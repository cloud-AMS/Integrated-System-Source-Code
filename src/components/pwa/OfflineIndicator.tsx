import React, { useEffect, useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 shadow-lg flex items-center justify-between gap-3 text-amber-950"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <WifiOff className="w-4 h-4 text-amber-700 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-bold leading-tight">Mode Offline Aktif</p>
          <p className="text-2xs text-amber-800 truncate">
            Perubahan disimpan lokal &amp; disinkronkan saat koneksi kembali.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-amber-900 px-2.5 py-1.5 text-2xs font-bold text-white cursor-pointer"
      >
        <RefreshCw className="w-3 h-3" />
        Coba Lagi
      </button>
    </div>
  );
};
