import React, { useState } from 'react';
import { ExternalLink, RefreshCw, Smartphone, Tablet, X } from 'lucide-react';

interface MobilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobilePreviewModal: React.FC<MobilePreviewModalProps> = ({
  isOpen,
  onClose
}) => {
  const [device, setDevice] = useState<'phone' | 'tablet'>('phone');
  const [reloadKey, setReloadKey] = useState(0);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Preview Aplikasi Mobile AMS"
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      {/* Toolbar Preview */}
      <div className="w-full max-w-4xl mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-white shadow-xl">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold leading-tight truncate">
              Preview AMS Mobile App (HRIS &amp; CRM)
            </p>
            <p className="text-2xs text-slate-400 font-mono truncate">
              /mobile · Terhubung PocketBase AMS &amp; Real-Time Sync
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setDevice('phone')}
            className={`min-h-[36px] rounded-xl px-2.5 text-2xs font-bold inline-flex items-center gap-1.5 border transition cursor-pointer ${
              device === 'phone'
                ? 'bg-teal-600 border-teal-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            HP (390px)
          </button>
          <button
            type="button"
            onClick={() => setDevice('tablet')}
            className={`min-h-[36px] rounded-xl px-2.5 text-2xs font-bold inline-flex items-center gap-1.5 border transition cursor-pointer ${
              device === 'tablet'
                ? 'bg-teal-600 border-teal-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            Tablet (768px)
          </button>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            title="Muat ulang preview mobile"
            className="min-h-[36px] rounded-xl border border-slate-700 bg-slate-800 px-2.5 text-2xs font-bold text-slate-200 inline-flex items-center gap-1 hover:bg-slate-700 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Muat Ulang
          </button>
          <a
            href="/mobile"
            className="min-h-[36px] rounded-xl bg-white px-3 text-2xs font-bold text-slate-900 inline-flex items-center gap-1.5 hover:bg-slate-100 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Layar Penuh
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup preview mobile"
            className="min-h-[36px] min-w-[36px] rounded-xl border border-slate-700 bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Device Frame */}
      <div
        className={`relative bg-slate-900 shadow-2xl border-[6px] border-slate-800 transition-all duration-200 flex flex-col overflow-hidden ${
          device === 'phone'
            ? 'w-full max-w-[396px] h-[min(780px,calc(100vh-110px))] rounded-[2.25rem]'
            : 'w-full max-w-[780px] h-[min(820px,calc(100vh-110px))] rounded-[1.5rem]'
        }`}
      >
        {device === 'phone' && (
          <div className="h-6 bg-slate-900 flex items-center justify-center shrink-0">
            <div className="w-20 h-3.5 rounded-full bg-slate-800 border border-slate-700" />
          </div>
        )}
        <iframe
          key={reloadKey}
          src="/mobile"
          title="Preview AMS Mobile App (HRIS & CRM)"
          allow="geolocation *"
          className="w-full flex-1 bg-slate-50 border-0"
        />
      </div>
    </div>
  );
};
