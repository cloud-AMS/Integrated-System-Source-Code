import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const CACHE_FILE = 'website-translation-en.json';
const MAX_REQUEST_BYTES = 128 * 1024;
const MAX_TEXTS_PER_REQUEST = 50;
const TRANSLATABLE_FIELDS = new Set([
  'badge',
  'caption',
  'catatan',
  'contoh',
  'deskripsi',
  'eyebrow',
  'footerCatatan',
  'isi',
  'jenis',
  'jabatan',
  'jawaban',
  'jamOperasional',
  'judul',
  'judulSitus',
  'keterangan',
  'kategori',
  'kutipan',
  'label',
  'metaDeskripsi',
  'metaJudul',
  'paragraf',
  'pesanPembukaWA',
  'poinJual',
  'pertanyaan',
  'ringkasan',
  'spesifikasi',
  'tahap',
  'subjudul',
  'tagline',
  'teks',
  'teksCta',
  'teksCtaCadangan',
  'teksCtaUtama',
  'teksTautan',
  'testimoni',
  'utamaTeks',
  'cadanganTeks',
  'portalTeks',
  'valueProposition'
]);

export class WebsiteTranslationError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code: string
  ) {
    super(message);
    this.name = 'WebsiteTranslationError';
  }
}

interface CacheEntry {
  sourceHash: string;
  targetLanguage: 'EN-US';
  config: Record<string, unknown>;
}

interface TranslationResponse {
  translations?: Array<{ text?: string }>;
}

function isTranslatableText(field: string, value: string): boolean {
  const text = value.trim();
  return (
    TRANSLATABLE_FIELDS.has(field) &&
    text.length > 1 &&
    /[A-Za-z\u00c0-\u024f\u1e00-\u1eff]/.test(text) &&
    !/^(?:https?:\/\/|mailto:|www\.)/i.test(text) &&
    !/^[A-Z\d\s._:/+-]+$/.test(text)
  );
}

function collectTexts(value: unknown, texts: Set<string>, field = ''): void {
  if (typeof value === 'string') {
    if (isTranslatableText(field, value)) texts.add(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectTexts(item, texts, field));
    return;
  }
  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, child]) => collectTexts(child, texts, key));
  }
}

function applyTranslations(
  value: unknown,
  translations: Map<string, string>,
  field = ''
): unknown {
  if (typeof value === 'string') {
    return isTranslatableText(field, value) ? translations.get(value) ?? value : value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => applyTranslations(item, translations, field));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, applyTranslations(child, translations, key)])
    );
  }
  return value;
}

function getApiBaseUrl(): string {
  const configured = process.env.DEEPL_API_URL?.trim();
  const baseUrl = configured || 'https://api-free.deepl.com';
  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new WebsiteTranslationError('Konfigurasi URL DeepL tidak valid.', 500, 'DEEPL_INVALID_URL');
  }
  if (
    parsed.protocol !== 'https:' ||
    !['api-free.deepl.com', 'api.deepl.com'].includes(parsed.hostname) ||
    parsed.pathname !== '/' ||
    parsed.search ||
    parsed.hash
  ) {
    throw new WebsiteTranslationError('URL DeepL harus menggunakan endpoint resmi Free atau Pro.', 500, 'DEEPL_INVALID_URL');
  }
  return parsed.origin;
}

function makeBatches(texts: string[]): string[][] {
  const batches: string[][] = [];
  let batch: string[] = [];
  for (const text of texts) {
    const candidate = [...batch, text];
    const body = JSON.stringify({ text: candidate, source_lang: 'ID', target_lang: 'EN-US' });
    if (Buffer.byteLength(body, 'utf8') > MAX_REQUEST_BYTES) {
      if (batch.length === 0) {
        throw new WebsiteTranslationError(
          'Satu bagian konten situs terlalu besar untuk diterjemahkan.',
          413,
          'WEBSITE_TRANSLATION_TEXT_TOO_LARGE'
        );
      }
      batches.push(batch);
      batch = [text];
    } else {
      batch = candidate;
    }
    if (batch.length === MAX_TEXTS_PER_REQUEST) {
      batches.push(batch);
      batch = [];
    }
  }
  if (batch.length > 0) batches.push(batch);
  return batches;
}

export class WebsiteTranslationService {
  private readonly cachePath: string;
  private readonly inFlight = new Map<string, Promise<CacheEntry>>();

  constructor(dataDirectory: string) {
    this.cachePath = path.join(dataDirectory, CACHE_FILE);
  }

  async translate(config: Record<string, unknown>): Promise<CacheEntry> {
    const serialized = JSON.stringify(config);
    const sourceHash = createHash('sha256').update(serialized).digest('hex');
    const cached = await this.readCache();
    if (cached?.sourceHash === sourceHash && cached.targetLanguage === 'EN-US') return cached;

    const existing = this.inFlight.get(sourceHash);
    if (existing) return existing;

    const translation = this.translateAndCache(config, sourceHash);
    this.inFlight.set(sourceHash, translation);
    try {
      return await translation;
    } finally {
      this.inFlight.delete(sourceHash);
    }
  }

  private async translateAndCache(
    config: Record<string, unknown>,
    sourceHash: string
  ): Promise<CacheEntry> {
    const texts = new Set<string>();
    collectTexts(config, texts);
    if (texts.size === 0) {
      throw new WebsiteTranslationError(
        'Konten situs tidak memiliki teks yang dapat diterjemahkan.',
        422,
        'WEBSITE_TRANSLATION_NO_TEXT'
      );
    }

    const apiKey = process.env.DEEPL_AUTH_KEY?.trim();
    if (!apiKey) {
      throw new WebsiteTranslationError(
        'Layanan bahasa Inggris belum dikonfigurasi. Admin perlu mengisi DEEPL_AUTH_KEY di environment server.',
        503,
        'DEEPL_NOT_CONFIGURED'
      );
    }

    const sourceTexts = Array.from(texts);
    const translatedTexts = new Map<string, string>();
    for (const batch of makeBatches(sourceTexts)) {
      const translations = await this.requestTranslations(batch, apiKey);
      if (translations.length !== batch.length) {
        throw new WebsiteTranslationError(
          'Layanan terjemahan mengembalikan jumlah hasil yang tidak sesuai.',
          502,
          'DEEPL_INVALID_RESPONSE'
        );
      }
      batch.forEach((text, index) => translatedTexts.set(text, translations[index]));
    }

    const entry: CacheEntry = {
      sourceHash,
      targetLanguage: 'EN-US',
      config: applyTranslations(config, translatedTexts) as Record<string, unknown>
    };
    await this.writeCache(entry);
    return entry;
  }

  private async requestTranslations(texts: string[], apiKey: string): Promise<string[]> {
    const baseUrl = getApiBaseUrl();
    let response: Response;
    try {
      response = await fetch(`${baseUrl}/v2/translate`, {
        method: 'POST',
        headers: {
          Authorization: `DeepL-Auth-Key ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: texts, source_lang: 'ID', target_lang: 'EN-US' }),
        signal: AbortSignal.timeout(20_000)
      });
    } catch {
      throw new WebsiteTranslationError(
        'Tidak dapat terhubung ke layanan terjemahan. Coba lagi nanti.',
        502,
        'DEEPL_CONNECTION_FAILED'
      );
    }

    if (!response.ok) {
      const statusCode = response.status === 456 || response.status === 429 ? 503 : 502;
      throw new WebsiteTranslationError(
        response.status === 456 || response.status === 429
          ? 'Layanan terjemahan sedang mencapai batas penggunaan. Coba lagi nanti.'
          : 'Layanan terjemahan gagal memproses konten situs.',
        statusCode,
        response.status === 456 ? 'DEEPL_QUOTA_EXCEEDED' : response.status === 429 ? 'DEEPL_RATE_LIMITED' : 'DEEPL_REQUEST_FAILED'
      );
    }

    let data: TranslationResponse;
    try {
      data = (await response.json()) as TranslationResponse;
    } catch {
      throw new WebsiteTranslationError(
        'Layanan terjemahan mengembalikan respons yang tidak valid.',
        502,
        'DEEPL_INVALID_RESPONSE'
      );
    }
    const translated = data.translations?.map((item) => item.text);
    if (!translated || translated.some((text) => typeof text !== 'string' || !text.trim())) {
      throw new WebsiteTranslationError(
        'Layanan terjemahan mengembalikan respons yang tidak lengkap.',
        502,
        'DEEPL_INVALID_RESPONSE'
      );
    }
    return translated as string[];
  }

  private async readCache(): Promise<CacheEntry | null> {
    try {
      const contents = await fs.readFile(this.cachePath, 'utf8');
      const cache = JSON.parse(contents) as CacheEntry;
      if (
        typeof cache.sourceHash === 'string' &&
        cache.targetLanguage === 'EN-US' &&
        cache.config &&
        typeof cache.config === 'object' &&
        !Array.isArray(cache.config)
      ) {
        return cache;
      }
      throw new Error('Bentuk cache terjemahan situs tidak valid.');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
  }

  private async writeCache(cache: CacheEntry): Promise<void> {
    await fs.mkdir(path.dirname(this.cachePath), { recursive: true });
    const temporaryPath = `${this.cachePath}.${process.pid}.${cache.sourceHash}.tmp`;
    await fs.writeFile(temporaryPath, JSON.stringify(cache), 'utf8');
    await fs.rename(temporaryPath, this.cachePath);
  }
}
