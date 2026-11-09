/**
 * Developer Notes — catatan jujur dari developer untuk pembaca teknis modul.
 * Menyatakan apa yang nyata (diuji/terpasang) dan apa yang masih berupa contoh,
 * belum terhubung, atau belum diverifikasi. Bukan klaim kepatuhan/ketersediaan.
 * Dipakai konsisten di seluruh modul; daftar butir per modul ditulis di pemanggil.
 */
import { useState, type ReactNode } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

export default function DeveloperNotes({
  items,
  className = ''
}: {
  items: string[];
  className?: string;
}) {
  const [terbuka, setTerbuka] = useState(false);

  if (!items.length) return null;

  return (
    <div className={`rounded-xl border border-amber-200 bg-amber-50/70 no-print ${className}`}>
      <button
        type="button"
        onClick={() => setTerbuka((v) => !v)}
        aria-expanded={terbuka}
        className="w-full flex items-center gap-2 px-3 py-2 text-left cursor-pointer"
      >
        <Info className="w-4 h-4 text-amber-700 shrink-0" />
        <span className="text-2xs font-bold uppercase tracking-wider text-amber-900">Developer Notes ({items.length})</span>
        <span className="text-2xs text-amber-800/80 ml-1 hidden sm:inline">dibaca developer &amp; QA, bukan klaim live</span>
        <span className="ml-auto text-amber-800">
          {terbuka ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>
      {terbuka && (
        <ul className="px-4 pb-3 pt-0 space-y-1.5 border-t border-amber-200/70">
          {items.map((catatan, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-amber-900 leading-relaxed pt-1.5">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" aria-hidden />
              <span>{catatan}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
