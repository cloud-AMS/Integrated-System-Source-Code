/**
 * Hero bergulir khusus template REMEDI Studio (VS Code): teks beranda + panel
 * gambar yang menempel (sticky). Saat pengguna menggulir, panel berganti gambar
 * sesuai seksi yang sedang berada di tengah layar — ke arah atas maupun bawah.
 *
 * Gambar diambil dari konfigurasi CMS yang sama: hero, banner, katalog produk,
 * sumber daya, dan galeri. Tidak ada konten yang ditulis ulang di sini.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import type { HalamanWebsite, KonfigurasiSitus } from '../../../../types';
import { selesaikanGambar } from '../../../../utils/website';
import { TombolSitus } from './SiteSections';

interface Adegan {
  id: string;
  label: string;
  judul: string;
  deskripsi: string;
  gambar?: string;
  halaman?: HalamanWebsite;
}

const BATAS_ADEGAN = 7;

/** Adegan = gambar utama per bagian situs; adegan[0] selalu hero (teks utama). */
function bangunAdegan(cfg: KonfigurasiSitus): Adegan[] {
  const hero = cfg.hero;
  const daftar: Adegan[] = [
    {
      id: 'hero',
      label: 'Sambutan',
      judul: hero.judul,
      deskripsi: hero.subjudul,
      gambar: hero.gambarUrl
    }
  ];
  const gambarDipakai = new Set<string>();
  if (hero.gambarUrl) gambarDipakai.add(hero.gambarUrl);

  const tambah = (a: Adegan) => {
    if (daftar.length >= BATAS_ADEGAN || !a.gambar || gambarDipakai.has(a.gambar)) return;
    gambarDipakai.add(a.gambar);
    daftar.push(a);
  };

  if (cfg.slide.isActive) {
    for (const s of cfg.slide.item) {
      if (!s.isActive) continue;
      tambah({
        id: `slide-${s.id}`,
        label: 'Banner',
        judul: s.judul,
        deskripsi: s.subjudul ?? '',
        gambar: s.imageUrl,
        halaman: s.tautan?.tipe === 'halaman' ? (s.tautan.nilai as HalamanWebsite) : 'beranda'
      });
    }
  }

  if (cfg.produk.isActive) {
    for (const p of cfg.produk.item) {
      if (!p.isActive) continue;
      tambah({
        id: `produk-${p.id}`,
        label: 'Katalog Produk',
        judul: p.nama,
        deskripsi: [p.tipeModel, p.produsen].filter(Boolean).join(' · '),
        gambar: p.imageUrl,
        halaman: 'produk'
      });
    }
  }

  if (cfg.artikel.isActive) {
    for (const a of cfg.artikel.item) {
      if (!a.isActive) continue;
      tambah({
        id: `artikel-${a.id}`,
        label: 'Sumber Daya',
        judul: a.judul,
        deskripsi: a.ringkasan,
        gambar: a.imageUrl,
        halaman: 'sumber-daya'
      });
    }
  }

  if (cfg.galeri.isActive) {
    for (const g of cfg.galeri.item) {
      if (!g.isActive) continue;
      tambah({
        id: `galeri-${g.id}`,
        label: 'Galeri',
        judul: g.judul,
        deskripsi: g.keterangan ?? '',
        gambar: g.imageUrl,
        halaman: 'sumber-daya'
      });
    }
  }

  return daftar;
}

const teksTautan = (halaman?: HalamanWebsite) =>
  halaman === 'produk' ? 'Buka katalog' : halaman === 'sumber-daya' ? 'Buka sumber daya' : 'Selengkapnya';

function FotoStatis({ rujukan, alt }: { rujukan?: string; alt: string }) {
  const url = selesaikanGambar(rujukan);
  return (
    <div className="sorotan-foto-stat" style={{ aspectRatio: '3 / 2' }}>
      {url ? (
        <img src={url} alt={alt} loading="lazy" />
      ) : (
        <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400 px-3 text-center">{alt}</span>
      )}
    </div>
  );
}

export function SorotanGulir({
  cfg,
  ke
}: {
  cfg: KonfigurasiSitus;
  ke: (halaman: HalamanWebsite, kategoriKey?: string) => void;
}) {
  const hero = cfg.hero;
  const adegan = useMemo(() => bangunAdegan(cfg), [cfg]);
  const [aktif, setAktif] = useState(0);
  const blokRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (adegan.length < 2) return;

    const hitung = () => {
      const tengah = window.innerHeight / 2;
      let terbaik = 0;
      let jarak = Number.POSITIVE_INFINITY;
      blokRef.current.forEach((el, i) => {
        if (!el) return;
        const kotak = el.getBoundingClientRect();
        const selisih = Math.abs(kotak.top + kotak.height / 2 - tengah);
        if (selisih < jarak) {
          jarak = selisih;
          terbaik = i;
        }
      });
      setAktif(terbaik);
    };
    hitung();
    window.addEventListener('scroll', hitung, { passive: true });
    window.addEventListener('resize', hitung);
    return () => {
      window.removeEventListener('scroll', hitung);
      window.removeEventListener('resize', hitung);
    };
  }, [adegan.length]);

  if (!hero.isActive) return null;

  const sekarang = adegan[Math.min(aktif, adegan.length - 1)] ?? adegan[0];
  const lencana = cfg.kepercayaan.item.filter((l) => l.isActive).slice(0, 4);

  const gulirKe = (indeks: number) => {
    const el = blokRef.current[indeks];
    const kurangiGerak = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el?.scrollIntoView({ behavior: kurangiGerak ? 'auto' : 'smooth', block: 'center' });
    setAktif(indeks);
  };

  return (
    <section className="situs-hero sorotan-gulir border-b border-slate-200">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 py-10 sm:py-14 grid lg:grid-cols-[1.02fr_0.98fr] gap-10 lg:gap-12">
        <div className="min-w-0">
          <div
            ref={(el) => {
              blokRef.current[0] = el;
            }}
            className="sorotan-blok sorotan-blok-hero"
            data-aktif={aktif === 0}
          >
            {hero.badge && (
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--brand)] bg-[color-mix(in_srgb,var(--brand)_10%,white)] border border-[color-mix(in_srgb,var(--brand)_35%,white)] rounded-full px-3 py-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {hero.badge}
              </p>
            )}
            <h1 className="text-4xl sm:text-5xl leading-tight font-bold text-slate-900 mt-4">{hero.judul}</h1>
            <p className="text-sm sm:text-base text-slate-600 mt-4 leading-relaxed max-w-2xl">{hero.subjudul}</p>
            <div className="flex flex-wrap gap-3 mt-6">
              <TombolSitus teks={hero.teksCtaUtama} tautan={hero.tautanCtaUtama} cfg={cfg} ke={ke} />
              <TombolSitus teks={hero.teksCtaCadangan} tautan={hero.tautanCtaCadangan} cfg={cfg} ke={ke} varian="garis" />
            </div>
            {lencana.length > 0 && (
              <div className="mt-8 grid sm:grid-cols-2 gap-3 max-w-xl">
                {lencana.map((l) => (
                  <div key={l.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <p className="text-xs font-bold text-slate-800 leading-snug">{l.teks}</p>
                    <p className="text-2xs text-slate-500 mt-1 leading-snug">{l.keterangan}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="lg:hidden mt-6">
              <FotoStatis rujukan={hero.gambarUrl} alt="Foto utama" />
            </div>
          </div>

          {adegan.slice(1).map((a, i) => (
            <div
              key={a.id}
              ref={(el) => {
                blokRef.current[i + 1] = el;
              }}
              className="sorotan-blok"
              data-aktif={aktif === i + 1}
            >
              <div className="lg:hidden mb-4">
                <FotoStatis rujukan={a.gambar} alt={a.judul} />
              </div>
              <p className="sorotan-label">{a.label}</p>
              <h3 className="sorotan-judul">{a.judul}</h3>
              {a.deskripsi && <p className="sorotan-teks">{a.deskripsi}</p>}
              {a.halaman && (
                <button type="button" onClick={() => ke(a.halaman!)} className="sorotan-tautan">
                  {teksTautan(a.halaman)}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-24 sorotan-panel">
            <div className="sorotan-jendela">
              <div className="sorotan-bilah">
                <span className="sorotan-titik" />
                <span className="sorotan-titik" />
                <span className="sorotan-titik" />
                <span className="sorotan-nama">{sekarang.label}</span>
                <span className="sorotan-lampu" />
              </div>
              <div className="sorotan-kanvas" style={{ aspectRatio: '4 / 3' }}>
                {adegan.map((a, i) => {
                  const url = selesaikanGambar(a.gambar);
                  if (!url) return null;
                  return (
                    <img
                      key={a.id}
                      src={url}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      className="sorotan-foto"
                      data-aktif={i === aktif}
                    />
                  );
                })}
                <div className="sorotan-ket" key={sekarang.id}>
                  <span className="sorotan-ket-label">{sekarang.label}</span>
                  <span className="sorotan-ket-judul">{sekarang.judul}</span>
                </div>
              </div>
              <div className="sorotan-kemajuan">
                <span style={{ width: `${((aktif + 1) / adegan.length) * 100}%` }} />
              </div>
              <div className="sorotan-noktah">
                {adegan.map((a, i) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => gulirKe(i)}
                    className="sorotan-tombol-noktah"
                    data-aktif={i === aktif}
                    aria-label={`Tampilkan ${a.label}: ${a.judul}`}
                    aria-pressed={i === aktif}
                    title={a.judul}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
