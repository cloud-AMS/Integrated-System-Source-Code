/**
 * Editor template & tata letak situs — admin mengatur tampilan situs PUBLIK tanpa
 * menyentuh kode: template dasar, warna merek (primary/secondary), font, dan urutan
 * seksi Beranda. Perubahan berlaku pada draf; tayang setelah Terbitkan.
 */
import { ArrowDown, ArrowUp, Check, LayoutGrid, Palette, Type } from 'lucide-react';
import type { KonfigurasiSitus, KunciSeksiSitus, TampilanSitus } from '../../../../types';
import {
  FONT_SITUS,
  SEKSI_BERANDA_LABEL,
  TEMPLATES_SITUS,
  WARNA_MEREK_PRESET,
  tampilanEfektif
} from '../../../../utils/tampilan';

interface PropsEditorTampilan {
  cfg: KonfigurasiSitus;
  onGanti: (tampilan: TampilanSitus) => void;
}

const kelasKartuTemplate = (aktif: boolean) =>
  `text-left rounded-2xl border-2 overflow-hidden transition-all cursor-pointer ${
    aktif ? 'border-[var(--brand)] ring-2 ring-[color-mix(in_srgb,var(--brand)_40%,transparent)] shadow-md' : 'border-slate-200 hover:border-slate-300'
  }`;

/** Ilustrasi mini template: header + hero + seksi, dengan warna & font dari template. */
function KartuTemplate({ id }: { id: TampilanSitus['templateId'] }) {
  if (id === 'remedi-gelap') {
    return (
      <div className="h-28 w-full bg-[#0b1220] flex flex-col">
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-slate-800">
          <span className="w-4 h-4 rounded bg-[var(--brand)]" />
          <span className="h-1.5 w-14 rounded bg-slate-700" />
          <span className="ml-auto h-1.5 w-8 rounded bg-slate-700" />
          <span className="h-1.5 w-8 rounded bg-[var(--brand)]" />
        </div>
        <div className="px-3 pt-2 flex-1">
          <div className="h-1.5 w-9 rounded bg-[var(--brand)] mb-1.5" />
          <div className="h-2.5 w-24 rounded bg-slate-100" />
          <div className="h-2.5 w-16 rounded bg-slate-100 mt-1" />
          <div className="flex gap-1 mt-2">
            <span className="h-2 w-9 rounded-full bg-[var(--brand)]" />
            <span className="h-2 w-9 rounded-full border border-slate-700" />
          </div>
        </div>
      </div>
    );
  }
  if (id === 'remedi-minimal') {
    return (
      <div className="h-28 w-full bg-white flex flex-col">
        <div className="flex items-center gap-1.5 px-3 py-1.5">
          <span className="w-4 h-4 rounded bg-[var(--brand)]" />
          <span className="h-1.5 w-14 rounded bg-slate-200" />
          <span className="ml-auto h-1.5 w-8 rounded bg-slate-200" />
        </div>
        <div className="px-3 pt-1.5 flex-1">
          <div className="h-2 w-16 rounded bg-slate-900" />
          <div className="h-2 w-11 rounded bg-slate-300 mt-1" />
          <div className="h-2 w-7 rounded-full bg-[var(--brand)] mt-2" />
        </div>
      </div>
    );
  }
  return (
    <div className="h-28 w-full bg-white flex">
      <div className="w-2/5 p-3 flex flex-col justify-center border-r border-slate-100">
        <div className="h-1.5 w-8 rounded bg-[color-mix(in_srgb,var(--brand)_25%,white)] mb-1.5" />
        <div className="h-2 w-16 rounded bg-slate-900" />
        <div className="h-2 w-11 rounded bg-slate-900 mt-0.5" />
        <div className="h-1.5 w-10 rounded bg-slate-200 mt-1.5" />
        <div className="flex gap-1 mt-2">
          <span className="h-2 w-7 rounded-full bg-[var(--brand)]" />
          <span className="h-2 w-7 rounded-full border border-slate-300" />
        </div>
      </div>
      <div className="w-3/5 p-3 flex flex-col gap-1">
        <span className="h-3 w-full rounded bg-slate-100" />
        <span className="h-3 w-11/12 rounded bg-slate-100" />
        <div className="grid grid-cols-2 gap-1 mt-auto">
          <span className="h-4 rounded bg-[color-mix(in_srgb,var(--brand)_10%,white)]" />
          <span className="h-4 rounded bg-[color-mix(in_srgb,var(--brand)_10%,white)]" />
        </div>
      </div>
    </div>
  );
}

const hexBersih = (v: string) => {
  const s = v.trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(s) ? s : null;
};

export function EditorTampilan({ cfg, onGanti }: PropsEditorTampilan) {
  const tema = tampilanEfektif(cfg);
  const set = (patch: Partial<TampilanSitus>) => onGanti({ ...tema, ...patch });

  return (
    <div className="space-y-6">
      {/* ---------- 1. Template dasar ---------- */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <LayoutGrid className="w-4 h-4 text-slate-500" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">1. Template Dasar</h4>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Menentukan gaya header, hero, dan footer. Konten & halaman tidak berubah — hanya kulitnya.
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          {TEMPLATES_SITUS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => set({ templateId: t.id })}
              className={kelasKartuTemplate(tema.templateId === t.id)}
              aria-pressed={tema.templateId === t.id}
            >
              <KartuTemplate id={t.id} />
              <span className="block px-3 py-2.5">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900">{t.nama}</span>
                  {tema.templateId === t.id && (
                    <span className="inline-flex items-center gap-1 text-2xs font-bold text-emerald-800">
                      <Check className="w-3.5 h-3.5" /> Aktif
                    </span>
                  )}
                </span>
                <span className="block text-2xs text-slate-500 mt-1 leading-snug">{t.deskripsi}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ---------- 2. Warna merek ---------- */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <Palette className="w-4 h-4 text-slate-500" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">2. Warna Merek</h4>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {([
            { key: 'warnaUtama', label: 'Warna Utama (tombol & aksen)' },
            { key: 'warnaAksen', label: 'Warna Sekunder (hover & aksen lemah)' }
          ] as const).map(({ key, label }) => (
            <label key={key} className="block bg-white border border-slate-200 rounded-2xl p-4">
              <span className="text-xs font-semibold text-slate-700">{label}</span>
              <span className="flex items-center gap-3 mt-2">
                <input
                  type="color"
                  value={tema[key]}
                  onChange={(e) => set({ [key]: e.target.value } as Partial<TampilanSitus>)}
                  className="w-12 h-12 rounded-xl border border-slate-200 cursor-pointer bg-transparent"
                  aria-label={label}
                />
                <input
                  type="text"
                  value={tema[key]}
                  onChange={(e) => {
                    const bersih = hexBersih(e.target.value);
                    if (bersih) set({ [key]: bersih } as Partial<TampilanSitus>);
                  }}
                  onBlur={(e) => {
                    const bersih = hexBersih(e.target.value);
                    if (!bersih) set({ [key]: key === 'warnaUtama' ? '#0d9488' : '#0f766e' } as Partial<TampilanSitus>);
                  }}
                  spellCheck={false}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase"
                />
                <span
                  className="w-12 h-12 rounded-xl border border-slate-200"
                  style={{ backgroundColor: tema[key] }}
                  aria-hidden
                />
              </span>
            </label>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-2xs font-semibold text-slate-500 mr-1">Preset:</span>
          {WARNA_MEREK_PRESET.map((p) => (
            <button
              key={p.warna}
              type="button"
              title={p.nama}
              onClick={() => set({ warnaUtama: p.warna, warnaAksen: p.warna })}
              className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer hover:scale-110 transition-transform"
              style={{ backgroundColor: p.warna }}
              aria-label={`Preset ${p.nama}`}
            />
          ))}
        </div>
      </section>

      {/* ---------- 3. Tipografi ---------- */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <Type className="w-4 h-4 text-slate-500" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">3. Tipografi</h4>
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          {FONT_SITUS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => set({ fontId: f.id })}
              className={`text-left px-4 py-3 rounded-xl border-2 transition-colors cursor-pointer ${
                tema.fontId === f.id ? 'border-[var(--brand)] bg-[color-mix(in_srgb,var(--brand)_8%,white)]' : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
              aria-pressed={tema.fontId === f.id}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800">{f.nama}</span>
                {tema.fontId === f.id && <Check className="w-4 h-4 text-emerald-700 shrink-0" />}
              </span>
              <span className="block text-sm text-slate-600 mt-1" style={{ fontFamily: f.tumpukan }}>
                {f.contoh}
              </span>
            </button>
          ))}
        </div>
        <p className="text-2xs text-slate-500 mt-2">
          Logo & favicon diatur di menu <strong>Identitas &amp; SEO</strong> (grup Identitas &amp; Navigasi).
        </p>
      </section>
    </div>
  );
}

interface PropsEditorTataLetak {
  cfg: KonfigurasiSitus;
  onGanti: (tampilan: TampilanSitus) => void;
}

export function EditorTataLetak({ cfg, onGanti }: PropsEditorTataLetak) {
  const tema = tampilanEfektif(cfg);
  const urutan = tema.berandaUrutan;
  const geser = (i: number, arah: -1 | 1) => {
    const j = i + arah;
    if (j < 0 || j >= urutan.length) return;
    const baru = [...urutan];
    [baru[i], baru[j]] = [baru[j], baru[i]];
    onGanti({ ...tema, berandaUrutan: baru });
  };
  const pulihkan = () => onGanti({ ...tema, berandaUrutan: ['hero', 'slide', 'kepercayaan', 'solusi', 'konsultasi', 'statistik', 'produk', 'merek', 'perjalanan', 'institusi', 'kegiatan', 'promo', 'artikel', 'testimoni', 'faq'] });

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Susunan Seksi Beranda</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Geser urutan tampil seksi pada halaman Beranda. Seksi yang dimatikan lewat saklar di editornya tidak tampil walau ada di daftar.
          </p>
        </div>
        <button
          type="button"
          onClick={pulihkan}
          className="text-xs font-semibold text-slate-600 border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-100 cursor-pointer whitespace-nowrap"
        >
          Kembalikan Bawaan
        </button>
      </div>
      <ol className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
        {urutan.map((kunci, i) => (
          <li key={kunci} className="flex items-center gap-3 bg-white px-4 py-2.5">
            <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 tabular-nums shrink-0">
              {i + 1}
            </span>
            <span className="text-xs font-semibold text-slate-800 flex-1 truncate">
              {SEKSI_BERANDA_LABEL[kunci as KunciSeksiSitus]}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => geser(i, -1)}
                disabled={i === 0}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Naikkan seksi"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => geser(i, 1)}
                disabled={i === urutan.length - 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Turunkan seksi"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </li>
        ))}
      </ol>
      <p className="text-2xs text-slate-500 mt-2">
        Halaman lain (Katalog, Solusi, Layanan, Sumber Daya, Tentang, Kontak) memakai susunan baku modul.
      </p>
    </div>
  );
}
