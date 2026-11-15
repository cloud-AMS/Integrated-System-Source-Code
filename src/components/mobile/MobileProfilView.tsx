import React, { useState } from 'react';
import {
  Award,
  Building2,
  KeyRound,
  LogOut,
  Monitor,
  RefreshCw,
  ShieldCheck,
  UserCircle2,
  X
} from 'lucide-react';
import { db } from '../../services/pocketbase';
import type { KaryawanHRIS } from '../../types';
import { gantiKataSandiServer, type SesiLogin } from '../../utils/autentikasi';
import { statusSertifikat } from '../../utils/hris';
import { formatTanggal } from '../ui';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

interface MobileProfilViewProps {
  sesi: SesiLogin;
  karyawan: KaryawanHRIS | undefined;
  allKaryawan: KaryawanHRIS[];
  canSwitchProfile: boolean;
  selectedEmployeeId?: string;
  onSelectEmployee: (id: string) => void;
  onSyncPocketBase: () => Promise<void>;
  syncingPb: boolean;
  lastPbResult: string | null;
  onKeluar: () => void;
}

export const MobileProfilView: React.FC<MobileProfilViewProps> = ({
  sesi,
  karyawan,
  allKaryawan,
  canSwitchProfile,
  selectedEmployeeId,
  onSelectEmployee,
  onSyncPocketBase,
  syncingPb,
  lastPbResult,
  onKeluar
}) => {
  const [modalSandi, setModalSandi] = useState(false);
  const [sandiLama, setSandiLama] = useState('');
  const [sandiBaru, setSandiBaru] = useState('');
  const [pesanSandi, setPesanSandi] = useState<{ ok: boolean; teks: string } | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);

  const conn = db.getConnectionStatus();

  const kirimSandi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (menyimpan) return;
    setMenyimpan(true);
    const res = await gantiKataSandiServer(sandiLama, sandiBaru);
    setMenyimpan(false);
    setPesanSandi({ ok: res.ok, teks: res.pesan });
    if (res.ok) {
      setSandiLama('');
      setSandiBaru('');
      setTimeout(() => {
        setModalSandi(false);
        setPesanSandi(null);
      }, 1200);
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 shrink-0">
            <UserCircle2 className="w-7 h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-slate-900 truncate">
              {karyawan?.nama || sesi.namaLengkap}
            </h2>
            <p className="text-xs text-slate-600 truncate">
              {karyawan?.jabatan || sesi.namaPeran}
            </p>
            <p className="text-2xs text-slate-500 font-mono mt-0.5 tabular-nums">
              @{sesi.namaPengguna} · {karyawan?.nik || sesi.userId}
            </p>
          </div>
        </div>

        {canSwitchProfile && allKaryawan.length > 1 && (
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Pratinjau Profil Karyawan HRIS (Khusus PJT/Admin)
            </label>
            <select
              value={selectedEmployeeId || karyawan?.id || ''}
              onChange={(e) => onSelectEmployee(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-xs font-semibold bg-white"
            >
              {allKaryawan.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nik} — {k.nama} ({k.divisi})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5 pt-2 text-xs">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
            <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">
              Divisi &amp; Grade
            </p>
            <p className="font-bold text-slate-900 mt-1">
              {karyawan?.divisi || sesi.departemen} · {karyawan?.grade || '-'}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
            <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">
              Lokasi Kerja
            </p>
            <p className="font-bold text-slate-900 mt-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">{karyawan?.lokasi || 'Kantor Pusat'}</span>
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
            <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">
              Status &amp; Bergabung
            </p>
            <p className="font-bold text-slate-900 mt-1">
              {karyawan?.statusKaryawan || 'Aktif'} ·{' '}
              {karyawan?.tanggalBergabung ? formatTanggal(karyawan.tanggalBergabung) : '-'}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
            <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">
              Rekam Medis (MCU)
            </p>
            <p
              className={`font-bold mt-1 ${
                karyawan?.statusRekamMedis === 'Fit to Work'
                  ? 'text-emerald-700'
                  : 'text-amber-700'
              }`}
            >
              {karyawan?.statusRekamMedis || 'Terverifikasi'}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-teal-700" />
            Kompetensi, STR &amp; Sertifikasi CDAKB
          </h3>
          <span className="text-xs text-slate-500 tabular-nums">
            {karyawan?.sertifikasi.length || 0} dokumen
          </span>
        </div>
        {!karyawan || karyawan.sertifikasi.length === 0 ? (
          <p className="text-xs text-slate-500">
            Belum ada sertifikat terdaftar pada master HRIS.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {karyawan.sertifikasi.map((sert) => {
              const st = statusSertifikat(sert.masaBerlaku);
              return (
                <div key={sert.nomor} className="py-2.5 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold text-slate-900">{sert.nama}</p>
                    <span
                      className={`text-2xs font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                        st === 'Aktif'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : st === 'Perlu Perpanjangan (H-90)'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {st}
                    </span>
                  </div>
                  <p className="text-2xs font-mono text-slate-500 tabular-nums">
                    No. {sert.nomor} · Berlaku s/d {formatTanggal(sert.masaBerlaku)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              Koneksi Server PocketBase AMS
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">{conn.statusLabel}</p>
            <p className="text-2xs font-mono text-slate-400 mt-0.5 break-all">
              Endpoint: {conn.pocketbaseUrl || '/api/ams-pb'} · Rev #{conn.revision}
            </p>
          </div>
        </div>
        {lastPbResult && (
          <p className="text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
            {lastPbResult}
          </p>
        )}
        <button
          type="button"
          onClick={onSyncPocketBase}
          disabled={syncingPb}
          className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncingPb ? 'animate-spin' : ''}`} />
          {syncingPb
            ? 'Menyelaraskan PocketBase AMS…'
            : 'Sinkronkan Data Server PocketBase AMS'}
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Pasang di Layar Utama (Android/iOS)</span>
          <PWAInstallButton />
        </div>
        <button
          type="button"
          onClick={() => setModalSandi(true)}
          className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 text-xs font-bold text-slate-800 inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          <KeyRound className="w-4 h-4 text-slate-500" />
          Ganti Kata Sandi Akun
        </button>
        {sesi.peran !== 'karyawan' && (
          <a
            href="/"
            className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 text-xs font-bold text-slate-700 inline-flex items-center justify-center gap-2"
          >
            <Monitor className="w-4 h-4 text-slate-500" />
            Buka ERP Versi Desktop
          </a>
        )}
        <button
          type="button"
          onClick={onKeluar}
          className="w-full h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Keluar dari Aplikasi
        </button>
      </section>

      {modalSandi && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Ganti Kata Sandi</h3>
              <button
                type="button"
                onClick={() => {
                  setModalSandi(false);
                  setPesanSandi(null);
                }}
                aria-label="Tutup"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={kirimSandi} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi Saat Ini
                </label>
                <input
                  type="password"
                  value={sandiLama}
                  onChange={(e) => setSandiLama(e.target.value)}
                  required
                  className="w-full min-h-[44px] px-3 border border-slate-300 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi Baru (min. 6 karakter)
                </label>
                <input
                  type="password"
                  value={sandiBaru}
                  onChange={(e) => setSandiBaru(e.target.value)}
                  minLength={6}
                  required
                  className="w-full min-h-[44px] px-3 border border-slate-300 rounded-xl text-sm"
                />
              </div>
              {pesanSandi && (
                <p
                  className={`text-xs rounded-xl px-3 py-2 border ${
                    pesanSandi.ok
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}
                >
                  {pesanSandi.teks}
                </p>
              )}
              <button
                type="submit"
                disabled={menyimpan}
                className="w-full h-12 rounded-xl bg-slate-900 text-white text-sm font-bold cursor-pointer disabled:opacity-50"
              >
                {menyimpan ? 'Menyimpan…' : 'Simpan Sandi'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
