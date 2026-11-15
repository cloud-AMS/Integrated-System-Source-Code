import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  Crosshair,
  LogIn,
  LogOut,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import { db } from '../../services/pocketbase';
import type { KaryawanHRIS, LogAbsensi } from '../../types';
import {
  evaluasiKeterlambatan,
  hitungJarakKm,
  hitungMenitKerja,
  verifikasiGeofence
} from '../../utils/hris';
import { formatTanggal } from '../ui';
import {
  LOKASI_GEOFENCE_AMS,
  ambilLokasiGpsPerangkat,
  type HasilGpsPerangkat
} from './mobileHelpers';

interface MobileAbsensiViewProps {
  karyawan: KaryawanHRIS | undefined;
  absensiList: LogAbsensi[];
  onRefresh: () => void;
}

export const MobileAbsensiView: React.FC<MobileAbsensiViewProps> = ({
  karyawan,
  absensiList,
  onRefresh
}) => {
  const defaultTitik =
    LOKASI_GEOFENCE_AMS.find((t) => t.id === karyawan?.lokasi) ||
    LOKASI_GEOFENCE_AMS[0];

  const [titikTerpilihId, setTitikTerpilihId] = useState(defaultTitik.id);
  const [gps, setGps] = useState<HasilGpsPerangkat | null>(null);
  const [mengambilGps, setMengambilGps] = useState(false);
  const [catatanLapangan, setCatatanLapangan] = useState('');
  const [modeDinasLuar, setModeDinasLuar] = useState(false);
  const [umpanBalik, setUmpanBalik] = useState<{
    ok: boolean;
    teks: string;
  } | null>(null);

  const hariIni = new Date().toISOString().split('T')[0];
  const namaKaryawan = karyawan?.nama || 'Pengguna AMS';
  const karyawanId = karyawan?.id || 'EMP-00';

  const riwayatSaya = useMemo(
    () =>
      absensiList
        .filter((a) => a.karyawanId === karyawanId || a.nama === namaKaryawan)
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
    [absensiList, karyawanId, namaKaryawan]
  );

  const logHariIni = riwayatSaya.find((a) => a.tanggal === hariIni);

  const titikAktif =
    LOKASI_GEOFENCE_AMS.find((t) => t.id === titikTerpilihId) || defaultTitik;

  const jarakKm = gps
    ? hitungJarakKm(gps.lat, gps.lon, titikAktif.lat, titikAktif.lon)
    : null;
  const hasilGeofence =
    jarakKm !== null
      ? verifikasiGeofence(jarakKm, titikAktif.radiusMeter)
      : null;

  const muatGps = async () => {
    setMengambilGps(true);
    setUmpanBalik(null);
    const hasil = await ambilLokasiGpsPerangkat();
    setMengambilGps(false);
    if (!hasil.ok) {
      setUmpanBalik({ ok: false, teks: hasil.pesan });
      return;
    }
    setGps(hasil);
  };

  const formatJamSekarang = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes()
    ).padStart(2, '0')}`;
  };

  const lakukanClockIn = async () => {
    setUmpanBalik(null);
    let posisi = gps;
    if (!posisi) {
      setMengambilGps(true);
      const ambil = await ambilLokasiGpsPerangkat();
      setMengambilGps(false);
      if (!ambil.ok) {
        setUmpanBalik({ ok: false, teks: ambil.pesan });
        return;
      }
      posisi = ambil;
      setGps(ambil);
    }

    const jarak = hitungJarakKm(
      posisi.lat,
      posisi.lon,
      titikAktif.lat,
      titikAktif.lon
    );
    const geo = verifikasiGeofence(jarak, titikAktif.radiusMeter);
    if (!geo.dalamPagar && !modeDinasLuar) {
      setUmpanBalik({
        ok: false,
        teks: `${geo.label}. Aktifkan "Dinas Luar / Kunjungan Fasyankes" jika berada di lokasi klien.`
      });
      return;
    }

    const jamMasuk = formatJamSekarang();
    const terlambat = evaluasiKeterlambatan(jamMasuk);
    const baru: LogAbsensi = {
      id: `ABS-MOB-${Date.now()}`,
      karyawanId,
      nama: namaKaryawan,
      tanggal: hariIni,
      jamMasuk,
      jamKeluar: '-',
      sumber: 'Geofencing GPS (Mobile)',
      status: terlambat.menitTerlambat > 0 ? 'Terlambat' : 'Hadir',
      lokasi: `GPS ${posisi.lat}, ${posisi.lon} (±${posisi.accuracyMeter}m) — ${
        modeDinasLuar
          ? `Dinas Luar${catatanLapangan.trim() ? `: ${catatanLapangan.trim()}` : ''}`
          : geo.label
      }`
    };

    db.addAbsensi(baru);
    db.logAudit(
      'HRIS Mobile — Absensi GPS',
      `Clock-in mobile (${baru.status})`,
      baru.id,
      namaKaryawan,
      karyawan?.jabatan || 'Karyawan'
    );
    onRefresh();
    setUmpanBalik({
      ok: true,
      teks: `Absen masuk tercatat pukul ${jamMasuk} WIB (${baru.status}).`
    });
  };

  const lakukanClockOut = async () => {
    if (!logHariIni) return;
    setUmpanBalik(null);
    let posisi = gps;
    if (!posisi) {
      setMengambilGps(true);
      const ambil = await ambilLokasiGpsPerangkat();
      setMengambilGps(false);
      if (ambil.ok) {
        posisi = ambil;
        setGps(ambil);
      }
    }
    const jamKeluar = formatJamSekarang();
    const infoLokasiOut = posisi
      ? `GPS ${posisi.lat}, ${posisi.lon} (±${posisi.accuracyMeter}m)`
      : 'Mobile App';
    db.checkOutAbsensi(logHariIni.id, jamKeluar, infoLokasiOut);
    db.logAudit(
      'HRIS Mobile — Absensi GPS',
      `Clock-out mobile pukul ${jamKeluar}`,
      logHariIni.id,
      namaKaryawan,
      karyawan?.jabatan || 'Karyawan'
    );
    onRefresh();
    setUmpanBalik({
      ok: true,
      teks: `Absen pulang tercatat pukul ${jamKeluar} WIB.`
    });
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">
              Absensi Geofencing GPS
            </p>
            <h2 className="text-base font-bold text-slate-900 mt-0.5">
              {formatTanggal(hariIni)}
            </h2>
          </div>
          <button
            type="button"
            onClick={muatGps}
            disabled={mengambilGps}
            className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-800 hover:bg-slate-100 active:bg-slate-200 cursor-pointer disabled:opacity-50"
          >
            <Crosshair className="w-4 h-4 text-teal-700" />
            {mengambilGps ? 'Mencari GPS…' : 'Ambil Lokasi GPS'}
          </button>
        </div>

        <div>
          <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Titik Lokasi Kerja / Geofence
          </label>
          <select
            value={titikTerpilihId}
            onChange={(e) => setTitikTerpilihId(e.target.value as typeof titikTerpilihId)}
            className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900"
          >
            {LOKASI_GEOFENCE_AMS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nama} (Radius {t.radiusMeter} m)
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
              <MapPin className="w-4 h-4 text-teal-700 shrink-0" />
              Koordinat Perangkat
            </span>
            <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
              {gps ? `${gps.lat}, ${gps.lon}` : 'Belum diambil'}
            </span>
          </div>
          {gps && (
            <div className="flex items-center justify-between gap-2 text-xs text-slate-600">
              <span>Akurasi ±{gps.accuracyMeter} m · {gps.diambilPada}</span>
              <span
                className={`font-bold ${
                  hasilGeofence?.dalamPagar ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {jarakKm !== null ? `${Math.round(jarakKm * 1000)} m dari titik` : ''}
              </span>
            </div>
          )}
          {hasilGeofence && !hasilGeofence.dalamPagar && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
              {hasilGeofence.label}
            </p>
          )}
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={modeDinasLuar}
            onChange={(e) => setModeDinasLuar(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-teal-600"
          />
          <span className="text-xs text-slate-700 leading-snug">
            <strong className="text-slate-900">Dinas Luar / Kunjungan Fasyankes</strong> — izinkan clock-in di luar pagar geofence kantor dengan geotag GPS asli perangkat.
          </span>
        </label>

        {modeDinasLuar && (
          <input
            type="text"
            value={catatanLapangan}
            onChange={(e) => setCatatanLapangan(e.target.value)}
            placeholder="Lokasi tugas luar (mis. RSUD Pasar Minggu / Dinas Kesehatan)..."
            className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm"
          />
        )}

        {umpanBalik && (
          <div
            className={`rounded-xl border px-3 py-2.5 text-xs font-semibold flex items-start gap-2 ${
              umpanBalik.ok
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-amber-200 bg-amber-50 text-amber-900'
            }`}
          >
            {umpanBalik.ok ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            )}
            <span>{umpanBalik.teks}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={lakukanClockIn}
            disabled={Boolean(logHariIni) || mengambilGps}
            className="h-12 rounded-xl bg-[var(--brand)] text-white text-sm font-bold inline-flex items-center justify-center gap-2 hover:bg-[var(--brand-aksen)] active:scale-[0.99] transition cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
          >
            <LogIn className="w-4 h-4" />
            {logHariIni ? `Masuk ${logHariIni.jamMasuk}` : 'Absen Masuk'}
          </button>
          <button
            type="button"
            onClick={lakukanClockOut}
            disabled={!logHariIni || (logHariIni.jamKeluar !== '-' && logHariIni.jamKeluar !== '')}
            className="h-12 rounded-xl border border-slate-300 bg-slate-900 text-white text-sm font-bold inline-flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-[0.99] transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <LogOut className="w-4 h-4" />
            {logHariIni && logHariIni.jamKeluar !== '-' ? `Pulang ${logHariIni.jamKeluar}` : 'Absen Pulang'}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-sm font-bold text-slate-900">Riwayat Absensi Saya</h3>
          <span className="text-xs font-semibold text-slate-500 tabular-nums">
            {riwayatSaya.length} catatan
          </span>
        </div>
        {riwayatSaya.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            Belum ada catatan kehadiran untuk akun ini.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {riwayatSaya.slice(0, 12).map((item) => {
              const menit =
                item.jamMasuk !== '-' && item.jamKeluar !== '-'
                  ? hitungMenitKerja(item.jamMasuk, item.jamKeluar)
                  : 0;
              return (
                <div key={item.id} className="py-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {formatTanggal(item.tanggal)}
                    </span>
                    <span
                      className={`text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        item.status === 'Hadir'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : item.status === 'Terlambat'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-700 font-mono tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="w-3.5 h-3.5 text-slate-400" />
                      {item.jamMasuk} — {item.jamKeluar}
                    </span>
                    {menit > 0 && (
                      <span className="text-slate-500">
                        · {Math.floor(menit / 60)}j {menit % 60}m
                      </span>
                    )}
                  </div>
                  <p className="text-2xs text-slate-500 leading-relaxed">
                    {item.sumber} · {item.lokasi}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
