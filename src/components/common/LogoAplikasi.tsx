import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { db } from '../../services/pocketbase';
import { selesaikanGambar } from '../../utils/website';

export interface IdentitasVisualAplikasi {
  nama: string;
  logoUrl?: string;
  faviconUrl?: string;
}

/**
 * Ambil identitas visual (logo & favicon) secara dinamis dari konfigurasi CMS Website
 * dan penyimpanan media aplikasi — tidak ada path gambar yang di-hardcode di komponen.
 */
export function bacaIdentitasVisualAplikasi(): IdentitasVisualAplikasi {
  const draf = db.getWebsiteDraft();
  const logoUrl = selesaikanGambar(draf.identitas.logoUrl);
  const faviconUrl = selesaikanGambar(draf.identitas.faviconUrl) ?? logoUrl;
  return {
    nama: draf.identitas.nama,
    logoUrl,
    faviconUrl
  };
}

/** Hook reaktif agar perubahan logo di CMS Website / Media langsung memperbarui seluruh aplikasi. */
export function useIdentitasVisualAplikasi(): IdentitasVisualAplikasi {
  const [identitas, setIdentitas] = useState<IdentitasVisualAplikasi>(() =>
    bacaIdentitasVisualAplikasi()
  );

  useEffect(() => {
    const segarkan = () => {
      const baru = bacaIdentitasVisualAplikasi();
      setIdentitas((lama) =>
        lama.nama === baru.nama &&
        lama.logoUrl === baru.logoUrl &&
        lama.faviconUrl === baru.faviconUrl
          ? lama
          : baru
      );
    };
    const unsubDraft = db.subscribe('website_draft', segarkan);
    const unsubPublished = db.subscribe('website_published', segarkan);
    const unsubStorage = (e: StorageEvent) => {
      if (!e.key || e.key.includes('website')) segarkan();
    };
    window.addEventListener('storage', unsubStorage);
    return () => {
      unsubDraft();
      unsubPublished();
      window.removeEventListener('storage', unsubStorage);
    };
  }, []);

  return identitas;
}

/** Sinkronkan elemen <link rel="icon"> browser dengan favicon / logo CMS aktif. */
export function terapkanFaviconAplikasi(url?: string) {
  if (!url || typeof document === 'undefined') return;
  let link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  if (link.href !== url) {
    link.href = url;
  }
}

/**
 * Komponen logo standar aplikasi. Membaca URL gambar dari CMS/Media secara dinamis
 * (atau lewat prop `overrideUrl`), dengan fallback ikon hanya bila gambar belum tersedia.
 */
export default function LogoAplikasi({
  overrideUrl,
  alt,
  ukuran = 'md',
  className = ''
}: {
  overrideUrl?: string;
  alt?: string;
  ukuran?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const identitas = useIdentitasVisualAplikasi();
  const sumberMentah = overrideUrl !== undefined ? overrideUrl : identitas.logoUrl;
  const resolvedUrl = selesaikanGambar(sumberMentah);
  const [gagalMuat, setGagalMuat] = useState(false);

  useEffect(() => {
    setGagalMuat(false);
  }, [resolvedUrl]);

  const dimensi =
    ukuran === 'sm'
      ? 'w-8 h-8 rounded-lg'
      : ukuran === 'lg'
        ? 'w-11 h-11 rounded-xl'
        : 'w-9 h-9 rounded-xl';

  if (resolvedUrl && !gagalMuat) {
    return (
      <div
        className={`${dimensi} bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-xs shrink-0 p-1 ${className}`}
      >
        <img
          src={resolvedUrl}
          alt={alt || identitas.nama || 'Logo Perusahaan'}
          onError={() => setGagalMuat(true)}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      className={`${dimensi} bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-xs shrink-0 ring-2 ring-blue-500/20 ${className}`}
    >
      <ShieldCheck className={ukuran === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
    </div>
  );
}
