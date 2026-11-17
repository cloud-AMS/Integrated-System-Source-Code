import { ArrowRight, BadgeCheck, PackageSearch, Search, ShieldCheck } from 'lucide-react';
import type { HalamanWebsite, KonfigurasiSitus } from '../../../../types';
import { selesaikanGambar } from '../../../../utils/website';
import { TombolSitus } from './SiteSections';

export function SorotanKatalog({
  cfg,
  ke
}: {
  cfg: KonfigurasiSitus;
  ke: (halaman: HalamanWebsite, kategoriKey?: string) => void;
}) {
  const hero = cfg.hero;
  if (!hero.isActive) return null;

  const produkUnggulan = cfg.produk.item.find((produk) => produk.isActive);
  const gambarProduk = selesaikanGambar(produkUnggulan?.imageUrl);
  const gambarUtama = gambarProduk || selesaikanGambar(hero.gambarUrl);
  const kategori = Array.from(
    new Set(cfg.produk.item.filter((produk) => produk.isActive).map((produk) => produk.kategori).filter(Boolean))
  ).slice(0, 4);
  const sertifikasi = cfg.kepercayaan.item.filter((item) => item.isActive).slice(0, 3);

  return (
    <section className="situs-hero katalog-hero border-b border-slate-200">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 py-10 sm:py-14 lg:py-16 grid lg:grid-cols-[1fr_0.92fr] gap-10 lg:gap-14 items-center">
        <div className="katalog-intro min-w-0">
          {hero.badge && (
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--brand)] bg-white border border-[color-mix(in_srgb,var(--brand)_24%,white)] rounded-full px-3 py-1.5 shadow-sm">
              <ShieldCheck className="w-4 h-4" />
              {hero.badge}
            </p>
          )}
          <h1 className="text-4xl sm:text-5xl leading-tight font-bold text-slate-900 mt-5">{hero.judul}</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-4 leading-relaxed max-w-2xl">{hero.subjudul}</p>

          <div className="flex flex-wrap gap-3 mt-6">
            <TombolSitus teks={hero.teksCtaUtama} tautan={hero.tautanCtaUtama} cfg={cfg} ke={ke} />
            <TombolSitus teks={hero.teksCtaCadangan} tautan={hero.tautanCtaCadangan} cfg={cfg} ke={ke} varian="garis" />
            <button type="button" onClick={() => ke('produk')} className="katalog-search-link">
              <Search className="w-4 h-4" />
              Jelajahi katalog
            </button>
          </div>

          {kategori.length > 0 && (
            <div className="mt-8">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Jelajahi kategori</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {kategori.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => ke('produk', label)}
                    className="katalog-category-chip"
                  >
                    {label}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="katalog-visual">
          <div className="katalog-visual-card">
            {gambarUtama ? (
              <img src={gambarUtama} alt={produkUnggulan?.nama || hero.judul} loading="eager" />
            ) : (
              <div className="katalog-visual-fallback">
                <PackageSearch className="w-16 h-16" />
                <span>Peralatan kesehatan untuk kebutuhan fasilitas Anda</span>
              </div>
            )}
            {produkUnggulan && gambarProduk && (
              <button
                type="button"
                className="katalog-featured-product"
                onClick={() => ke('produk', produkUnggulan.kategori)}
                aria-label={`Lihat katalog ${produkUnggulan.nama}`}
              >
                <span className="katalog-featured-icon">
                  <BadgeCheck className="w-5 h-5" />
                </span>
                <span className="min-w-0 text-left">
                  <span className="block text-2xs font-bold uppercase tracking-wider text-[var(--brand)]">Produk katalog</span>
                  <span className="block text-sm font-bold text-slate-900 truncate">{produkUnggulan.nama}</span>
                  <span className="block text-xs text-slate-500 truncate">{produkUnggulan.produsen}</span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
              </button>
            )}
          </div>
        </div>
      </div>

      {sertifikasi.length > 0 && (
        <div className="katalog-trust-wrap">
          <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 pb-8 grid sm:grid-cols-3 gap-3">
            {sertifikasi.map((item) => (
              <div key={item.id} className="katalog-trust-item">
                <ShieldCheck className="w-5 h-5 text-[var(--brand)] shrink-0" />
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-slate-800">{item.teks}</span>
                  {item.keterangan && <span className="block text-2xs text-slate-500 mt-0.5">{item.keterangan}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
