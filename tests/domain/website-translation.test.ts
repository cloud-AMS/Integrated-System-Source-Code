import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WebsiteTranslationService } from '../../server/websiteTranslation';
import { translateWebsiteUi } from '../../src/components/modules/website/site/WebsiteLanguage';

const ENV_KEYS = ['DEEPL_AUTH_KEY', 'DEEPL_API_URL'] as const;
const previousEnvironment = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
const temporaryDirectories: string[] = [];

afterEach(async () => {
  vi.unstubAllGlobals();
  for (const key of ENV_KEYS) {
    const previous = previousEnvironment[key];
    if (previous === undefined) delete process.env[key];
    else process.env[key] = previous;
  }
  while (temporaryDirectories.length > 0) {
    const directory = temporaryDirectories.pop();
    if (directory) await fs.rm(directory, { recursive: true, force: true });
  }
});

async function createService(): Promise<WebsiteTranslationService> {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'ams-website-translation-'));
  temporaryDirectories.push(directory);
  return new WebsiteTranslationService(directory);
}

function mockDeepL(): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
    const request = JSON.parse(String(init?.body)) as { text: string[] };
    return new Response(
      JSON.stringify({
        translations: request.text.map((text) => ({ text: `EN: ${text}` }))
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('WebsiteTranslationService', () => {
  it('localizes known website controls while leaving unrecognized text unchanged', () => {
    expect(translateWebsiteUi('Masuk', 'en')).toBe('Sign in');
    expect(translateWebsiteUi('Masuk', 'id')).toBe('Masuk');
    expect(translateWebsiteUi('Custom CMS phrase', 'en')).toBe('Custom CMS phrase');
  });

  it('translates public copy, preserves identifiers, and serves the persistent cache', async () => {
    process.env.DEEPL_AUTH_KEY = 'test-key';
    const fetchMock = mockDeepL();
    const service = await createService();
    const source = {
      identitas: { nama: 'PT REMEDI', tagline: 'Solusi alat kesehatan', metaDeskripsi: 'Distributor alat kesehatan' },
      hero: {
        judul: 'Solusi kesehatan terpadu',
        badge: 'Layanan unggulan',
        banner: [{ judul: 'Perawatan lebih baik', imageUrl: '/site/banner.png' }]
      },
      produk: {
        item: [
          {
            nama: 'Model RX-500',
            tipeModel: 'RX-500',
            nomorIzinEdar: 'KEMENKES RI AKL 12345678901',
            statusIzinEdar: 'Aktif',
            spesifikasi: 'Perangkat untuk pemeriksaan laboratorium'
          }
        ]
      }
    };

    const first = await service.translate(source);
    const second = await service.translate(source);

    expect(first.config.identitas).toMatchObject({
      nama: 'PT REMEDI',
      tagline: 'EN: Solusi alat kesehatan',
      metaDeskripsi: 'EN: Distributor alat kesehatan'
    });
    expect(first.config.hero).toMatchObject({
      judul: 'EN: Solusi kesehatan terpadu',
      badge: 'EN: Layanan unggulan',
      banner: [{ judul: 'EN: Perawatan lebih baik', imageUrl: '/site/banner.png' }]
    });
    expect(first.config.produk).toMatchObject({
      item: [
        {
          nama: 'Model RX-500',
          tipeModel: 'RX-500',
          nomorIzinEdar: 'KEMENKES RI AKL 12345678901',
          statusIzinEdar: 'Aktif',
          spesifikasi: 'EN: Perangkat untuk pemeriksaan laboratorium'
        }
      ]
    });
    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({
      Authorization: 'DeepL-Auth-Key test-key'
    });
    await expect(fs.readFile(path.join(temporaryDirectories[0], 'website-translation-en.json'), 'utf8'))
      .resolves.not.toContain('test-key');
  });

  it('returns a clear configuration error without calling DeepL when the server key is missing', async () => {
    delete process.env.DEEPL_AUTH_KEY;
    const fetchMock = mockDeepL();
    const service = await createService();

    await expect(service.translate({ hero: { judul: 'Konten situs bahasa Indonesia' } })).rejects.toMatchObject({
      code: 'DEEPL_NOT_CONFIGURED',
      statusCode: 503
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('batches more than fifty distinct text fields into separate DeepL requests', async () => {
    process.env.DEEPL_AUTH_KEY = 'test-key';
    const fetchMock = mockDeepL();
    const service = await createService();
    const source = {
      hero: {
        item: Array.from({ length: 51 }, (_, index) => ({ judul: `Konten pemasaran nomor ${index}` }))
      }
    };

    await service.translate(source);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const batchSizes = fetchMock.mock.calls.map(([, init]) => {
      const request = JSON.parse(String(init?.body)) as { text: string[] };
      return request.text.length;
    });
    expect(batchSizes).toEqual([50, 1]);
  });
});
