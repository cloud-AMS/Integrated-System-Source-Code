/**
 * Aturan tampilan situs publik: template, warna merek, font, dan urutan seksi Beranda.
 * Konfigurasi visual opsional (`tampilan`) di KonfigurasiSitus; modul ini menormalkan
 * nilai lama/absen ke standar REMEDI Klasik agar snapshot lama tetap tayang normal.
 * Tidak ada dependensi ke modul koneksi — aman diimpor dari Node (penjaga/tes).
 */
import type {
  FontSitus,
  KunciSeksiSitus,
  TemplateSitus,
  TampilanSitus
} from '../types';

export const TEMPLATES_SITUS: { id: TemplateSitus; nama: string; deskripsi: string }[] = [
  {
    id: 'remedi-klasik',
    nama: 'REMEDI Klasik',
    deskripsi: 'Header terang, hero dua kolom (teks + foto), seksi putih. Tampilan yang sedang tayang.'
  },
  {
    id: 'remedi-gelap',
    nama: 'REMEDI Premium Gelap',
    deskripsi: 'Header dan hero gelap dengan aksen merek menyala (cocok untuk elektromedik premium).'
  },
  {
    id: 'remedi-minimal',
    nama: 'REMEDI Minimal',
    deskripsi: 'Hero ringkas rata kiri, header tanpa garis, fokus ke katalog produk.'
  }
];

export const FONT_SITUS: { id: FontSitus; nama: string; tumpukan: string; contoh: string }[] = [
  { id: 'quicksand', nama: 'Quicksand (bawaan)', tumpukan: "'Quicksand', 'Google Sans', system-ui, sans-serif", contoh: 'Quicksand — Regulasi CDAKB & ISO 13485' },
  { id: 'open-sans', nama: 'Open Sans (standar dokumen)', tumpukan: "'Open Sans', system-ui, sans-serif", contoh: 'Open Sans — Regulasi CDAKB & ISO 13485' },
  { id: 'jetbrains-mono', nama: 'JetBrains Mono (teknis / katalog)', tumpukan: "'JetBrains Mono', monospace", contoh: 'JetBrains Mono — NIE AKD 20501910234' },
  { id: 'system', nama: 'Sistem (tercepat)', tumpukan: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", contoh: 'Font sistem perangkat Anda' }
];

export const URUTAN_BERANDA_BAWAAN: KunciSeksiSitus[] = [
  'hero',
  'slide',
  'kepercayaan',
  'solusi',
  'konsultasi',
  'statistik',
  'produk',
  'merek',
  'perjalanan',
  'institusi',
  'kegiatan',
  'promo',
  'artikel',
  'testimoni',
  'faq'
];

export const SEKSI_BERANDA_LABEL: Record<KunciSeksiSitus, string> = {
  hero: 'Hero utama',
  slide: 'Banner / Slider',
  kepercayaan: 'Legalitas & Sertifikat',
  solusi: 'Solusi per Kategori',
  konsultasi: 'Konsultasi CTA',
  statistik: 'Capaian Terukur',
  produk: 'Katalog Produk',
  merek: 'Merek / Prinsipal',
  perjalanan: 'Tahap Perjalanan Layanan',
  institusi: 'Institusi yang Dilayani',
  kegiatan: 'Kegiatan & Seminar',
  promo: 'Penawaran & Promo',
  artikel: 'Berita & Sumber Daya',
  testimoni: 'Testimoni',
  faq: 'Tanya Jawab'
};

export const WARNA_MEREK_PRESET: { warna: string; nama: string }[] = [
  { warna: '#0d9488', nama: 'Teal REMEDI (bawaan)' },
  { warna: '#0284c7', nama: 'Biru Langit' },
  { warna: '#1d4ed8', nama: 'Biru Institusi' },
  { warna: '#059669', nama: 'Hijau Klinis' },
  { warna: '#4338ca', nama: 'Indigo' },
  { warna: '#b45309', nama: 'Amber Tua' },
  { warna: '#1f2937', nama: 'Arang' },
  { warna: '#9f1239', nama: 'Rose Farmasi' }
];

export const TAMPILAN_BAWAAN: TampilanSitus = {
  templateId: 'remedi-klasik',
  warnaUtama: '#0d9488',
  warnaAksen: '#0f766e',
  fontId: 'quicksand',
  berandaUrutan: [...URUTAN_BERANDA_BAWAAN]
};

const HEX6 = /^#[0-9a-fA-F]{6}$/;
const VALID_TEMPLATE = new Set(TEMPLATES_SITUS.map((t) => t.id));
const VALID_FONT = new Set(FONT_SITUS.map((f) => f.id));
const VALID_URUTAN = new Set(URUTAN_BERANDA_BAWAAN);

const warnaAman = (v: unknown, fallback: string): string =>
  typeof v === 'string' && HEX6.test(v.trim()) ? v.trim().toLowerCase() : fallback;

/** Normalisasi tampilan dari konfigurasi lama/rusak — tidak pernah melempar. */
export function tampilanEfektif(cfg: { tampilan?: Partial<TampilanSitus> | null }): TampilanSitus {
  const t = cfg?.tampilan ?? {};
  const templateId = typeof t.templateId === 'string' && VALID_TEMPLATE.has(t.templateId as TemplateSitus)
    ? (t.templateId as TemplateSitus)
    : TAMPILAN_BAWAAN.templateId;
  const fontId = typeof t.fontId === 'string' && VALID_FONT.has(t.fontId as FontSitus)
    ? (t.fontId as FontSitus)
    : TAMPILAN_BAWAAN.fontId;
  const urutan = Array.isArray(t.berandaUrutan)
    ? (t.berandaUrutan.filter((k): k is KunciSeksiSitus => typeof k === 'string' && VALID_URUTAN.has(k as KunciSeksiSitus)))
    : [];
  // Buang duplikat, pertahankan urutan admin; seksi baru yang belum ada di beranda ditambahkan di akhir.
  const bersih = [...new Set(urutan)];
  for (const k of URUTAN_BERANDA_BAWAAN) {
    if (!bersih.includes(k)) bersih.push(k);
  }
  return {
    templateId,
    warnaUtama: warnaAman(t.warnaUtama, TAMPILAN_BAWAAN.warnaUtama),
    warnaAksen: warnaAman(t.warnaAksen, TAMPILAN_BAWAAN.warnaAksen),
    fontId,
    berandaUrutan: bersih
  };
}

/** Metrik font yang aman disuntik sebagai variabel CSS. */
export function tumpukanFont(fontId: FontSitus): string {
  return FONT_SITUS.find((f) => f.id === fontId)?.tumpukan ?? FONT_SITUS[0].tumpukan;
}
