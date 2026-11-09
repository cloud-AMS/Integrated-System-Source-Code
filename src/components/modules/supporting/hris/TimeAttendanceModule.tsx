import { useMemo, useState } from 'react';
import { db } from '../../../../services/pocketbase';
import type { LogAbsensi, PerhitunganLembur, SumberAbsensi } from '../../../../types';
import { PARAMETER_PAYROLL_2026 as P } from '../../../../data/initialData';
import {
  hitungMenitKerja,
  evaluasiKeterlambatan,
  hitungPotonganKeterlambatan,
  hitungJarakKm,
  verifikasiGeofence
} from '../../../../utils/hris';
import { hitungUpahLembur, formatRupiah } from '../../../../utils/payroll';
import {
  Clock3,
  MapPin,
  Fingerprint,
  ScanFace,
  PenLine,
  CalendarClock,
  Plus,
  Check,
  X,
  Timer,
  Smartphone,
  ExternalLink,
  Download,
  Eye,
  Wifi,
  Battery,
  Signal
} from 'lucide-react';
import { Badge, Panel, Stat, Modal, formatTanggal, inputClass, labelClass, tombolPrimer, tombolSekunder, type Tone } from '../../../ui';

const TITIK_PABRIK = { lat: -6.2297, lon: 107.1571, radiusMeter: 150, nama: 'Pabrik Cikarang' };

const IKON_SUMBER: Record<SumberAbsensi, typeof Fingerprint> = {
  'Geofencing GPS (Mobile)': MapPin,
  'Fingerprint (Pabrik)': Fingerprint,
  'Face Recognition (Pabrik)': ScanFace,
  'Manual HR': PenLine
};

const toneSumber = (sumber: SumberAbsensi): Tone =>
  sumber === 'Manual HR' ? 'amber' : sumber === 'Geofencing GPS (Mobile)' ? 'blue' : 'slate';

const toneStatus = (status: LogAbsensi['status']): Tone => {
  if (status === 'Hadir') return 'emerald';
  if (status === 'Terlambat') return 'amber';
  if (status === 'Mangkir') return 'rose';
  return 'slate';
};

export default function TimeAttendanceModule() {
  const [karyawan] = useState(db.getKaryawanHRIS());
  const [shift] = useState(db.getJadwalShift());
  const [absensi, setAbsensi] = useState<LogAbsensi[]>(db.getAbsensi());
  const [lembur, setLembur] = useState<PerhitunganLembur[]>(db.getLembur());
  const [tanggalFilter, setTanggalFilter] = useState('Semua');
  const [modalLembur, setModalLembur] = useState(false);
  const [formLembur, setFormLembur] = useState({
    karyawanId: '',
    tanggal: new Date().toISOString().split('T')[0],
    jamLembur: 1
  });
  const [gps, setGps] = useState({ lat: '-6.2291', lon: '107.1580', nama: '' });
  const [modalMobilePreview, setModalMobilePreview] = useState(false);
  const [osPreview, setOsPreview] = useState<'android' | 'ios'>('android');
  const [mobileClockedIn, setMobileClockedIn] = useState(false);

  const handleMobileClockIn = () => {
    setMobileClockedIn(true);
    const sekarang = new Date();
    const jamMasuk = `${String(sekarang.getHours()).padStart(2, '0')}:${String(sekarang.getMinutes()).padStart(2, '0')}`;
    const baru: LogAbsensi = {
      id: 'ABS-MOB-' + Date.now(),
      karyawanId: karyawan[0]?.id || 'KRY-01',
      nama: karyawan[0]?.nama || 'Ahmad Fauzi, S.Farm',
      tanggal: sekarang.toISOString().split('T')[0],
      jamMasuk,
      jamKeluar: '-',
      sumber: 'Geofencing GPS (Mobile)',
      status: 'Hadir',
      lokasi: `Mobile App v2.4 (${osPreview.toUpperCase()}) — GPS Lat ${TITIK_PABRIK.lat} / Lon ${TITIK_PABRIK.lon}`
    };
    db.addAbsensi(baru);
    setAbsensi(db.getAbsensi());
  };

  const karyawanDipilih = karyawan.find((k) => k.id === formLembur.karyawanId);
  const previewLembur = karyawanDipilih ? hitungUpahLembur(karyawanDipilih.gajiPokok, Number(formLembur.jamLembur)) : null;

  const tanggalTersedia = useMemo(() => Array.from(new Set(absensi.map((a) => a.tanggal))).sort().reverse(), [absensi]);
  const daftarAbsensi = useMemo(
    () => (tanggalFilter === 'Semua' ? absensi : absensi.filter((a) => a.tanggal === tanggalFilter)),
    [absensi, tanggalFilter]
  );

  const jarakGps = hitungJarakKm(Number(gps.lat), Number(gps.lon), TITIK_PABRIK.lat, TITIK_PABRIK.lon);
  const hasilGeofence = verifikasiGeofence(Number.isNaN(jarakGps) ? 999 : jarakGps, TITIK_PABRIK.radiusMeter);

  const lemburDisetujui = lembur.filter((l) => l.status === 'Disetujui');
  const totalBiayaLembur = lemburDisetujui.reduce((total, l) => total + l.totalLembur, 0);

  const simpanLembur = (e: React.FormEvent) => {
    e.preventDefault();
    if (!karyawanDipilih || !previewLembur) return;
    const baru: PerhitunganLembur = {
      id: 'LMB-' + Date.now(),
      karyawanId: karyawanDipilih.id,
      nama: karyawanDipilih.nama,
      tanggal: formLembur.tanggal,
      jamLembur: Number(formLembur.jamLembur),
      upahPerJam: previewLembur.upahPerJam,
      totalLembur: previewLembur.totalLembur,
      status: 'Menunggu Persetujuan'
    };
    db.addLembur(baru);
    setLembur(db.getLembur());
    setModalLembur(false);
    setFormLembur({ karyawanId: '', tanggal: new Date().toISOString().split('T')[0], jamLembur: 1 });
  };

  const ubahStatusLembur = (id: string, status: PerhitunganLembur['status']) => {
    const diperbarui = lembur.map((l) => (l.id === id ? { ...l, status } : l));
    db.saveLembur(diperbarui);
    setLembur(diperbarui);
  };

  const catatAbsensiGeofence = () => {
    if (!hasilGeofence.dalamPagar) return;
    const karyawanGps = karyawan.find((k) => k.nama.toLowerCase() === gps.nama.trim().toLowerCase()) || karyawan[0];
    const sekarang = new Date();
    const jamMasuk = `${String(sekarang.getHours()).padStart(2, '0')}:${String(sekarang.getMinutes()).padStart(2, '0')}`;
    const baru: LogAbsensi = {
      id: 'ABS-' + Date.now(),
      karyawanId: karyawanGps.id,
      nama: karyawanGps.nama,
      tanggal: sekarang.toISOString().split('T')[0],
      jamMasuk,
      jamKeluar: '-',
      sumber: 'Geofencing GPS (Mobile)',
      status: evaluasiKeterlambatan(jamMasuk).menitTerlambat > 0 ? 'Terlambat' : 'Hadir',
      lokasi: `GPS ${gps.lat} / ${gps.lon} — ${hasilGeofence.label}`
    };
    db.addAbsensi(baru);
    setAbsensi(db.getAbsensi());
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat
          label="Log Kehadiran Tercatat"
          value={absensi.length}
          hint={`${tanggalTersedia.length} tanggal aktivitas terakhir`}
          tone="blue"
        />
        <Stat
          label="Terlambat (> toleransi 10 menit)"
          value={absensi.filter((a) => a.status === 'Terlambat').length}
          hint={`Potongan ${formatRupiah(P.potonganPerJamTerlambat)} per jam keterlambatan`}
          tone="amber"
        />
        <Stat
          label="Jam Lembur Disetujui"
          value={`${lemburDisetujui.reduce((t, l) => t + l.jamLembur, 0)} jam`}
          hint={`${lembur.filter((l) => l.status === 'Menunggu Persetujuan').length} pengajuan menunggu`}
        />
        <Stat
          label="Estimasi Biaya Lembur"
          value={formatRupiah(totalBiayaLembur)}
          hint="Otomatis mengalir ke modul Payroll periode berjalan"
          tone="emerald"
        />
      </div>

      <Panel
        judul="Penjadwalan Shift Pabrik 24/7"
        keterangan="Rotasi otomatis tiga shift dengan premi shift malam dan aturan MCU khusus bagi tim cold chain."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {shift.map((s) => (
            <div key={s.id} className="rounded-xl border border-slate-200 p-4 bg-slate-50">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-slate-500" />
                <h4 className="text-xs font-bold text-slate-900">{s.namaShift}</h4>
              </div>
              <p className="text-xs text-blue-800 font-semibold mt-1">{s.area}</p>
              <p className="text-xs text-slate-600 leading-relaxed mt-2">{s.polaRotasi}</p>
              <div className="mt-3 pt-2 border-t border-slate-200">
                <div className="text-2xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Tim bertugas</div>
                <div className="flex flex-wrap gap-1">
                  {s.tim.map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </div>
                <div className="text-2xs font-mono text-slate-500 mt-2">
                  Berlaku {formatTanggal(s.tanggalMulai)} — {formatTanggal(s.tanggalBerakhir)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel
          judul="Absensi Geofencing GPS (Mobile)"
          keterangan="Karyawan lapangan (teknisi & sales) melakukan clock-in dari ponsel; sistem menolak bila koordinat di luar pagar geofence lokasi kerja."
        >
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 mb-3">
            Titik acuan: <strong>{TITIK_PABRIK.nama}</strong> — lat {TITIK_PABRIK.lat}, lon {TITIK_PABRIK.lon}, radius {TITIK_PABRIK.radiusMeter} m
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Latitude</label>
              <input
                type="text"
                className={inputClass}
                value={gps.lat}
                onChange={(e) => setGps({ ...gps, lat: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Longitude</label>
              <input
                type="text"
                className={inputClass}
                value={gps.lon}
                onChange={(e) => setGps({ ...gps, lon: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Nama Karyawan</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Opsional"
                value={gps.nama}
                onChange={(e) => setGps({ ...gps, nama: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <Badge tone={hasilGeofence.dalamPagar ? 'emerald' : 'rose'}>
              <MapPin className="w-3 h-3" />
              {hasilGeofence.label}
            </Badge>
            <button
              type="button"
              className={tombolPrimer}
              disabled={!hasilGeofence.dalamPagar}
              onClick={catatAbsensiGeofence}
            >
              <Clock3 className="w-4 h-4" />
              Clock-in Sekarang
            </button>
          </div>
        </Panel>

        <Panel
          judul="Integrasi Perangkat Biometrik Pabrik"
          keterangan="Antarmuka API ke mesin fingerprint & face recognition di gate produksi; data ditarik otomatis setiap pergantian shift."
        >
          <div className="space-y-2">
            {[
              { id: 'FP-02', jenis: 'Fingerprint', lokasi: 'Gate Produksi Lini 1 & 2', status: 'Sinkron 2 menit lalu', tone: 'emerald' as Tone },
              { id: 'FP-05', jenis: 'Fingerprint', lokasi: 'Gudang Cold Chain (Shift 3)', status: 'Sinkron 8 menit lalu', tone: 'emerald' as Tone },
              { id: 'FR-01', jenis: 'Face Recognition', lokasi: 'Turnstile Cleanroom Kelas C', status: 'Menunggu batch berikutnya', tone: 'amber' as Tone }
            ].map((perangkat) => (
              <div key={perangkat.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                <div className="flex items-center gap-2.5">
                  {perangkat.jenis === 'Fingerprint' ? (
                    <Fingerprint className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ScanFace className="w-4 h-4 text-slate-500" />
                  )}
                  <div>
                    <div className="text-xs font-bold text-slate-900">{perangkat.id} — {perangkat.jenis}</div>
                    <div className="text-2xs text-slate-500">{perangkat.lokasi}</div>
                  </div>
                </div>
                <Badge tone={perangkat.tone}>{perangkat.status}</Badge>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel
        judul="Smart Attendance Android App (Integrasi Git Eksternal)"
        keterangan="Aplikasi turunan berbasis Android untuk karyawan lapangan dan staf operasional (berasal dari repositori Smart-Attendance-App). Menyediakan absensi mobile, geofencing real-time, dan push notifikasi ke server pusat HRD."
        aksi={
          <button
            type="button"
            onClick={() => setModalMobilePreview(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview Mobile App v2.4 (iOS & Android)
          </button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <Smartphone className="w-4 h-4 text-blue-600" />
              Mobile App Client v2.4
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Aplikasi native Android untuk karyawan PT Anugrah Mitra Selaras (AMS) melakukan clock-in mandiri dengan verifikasi wajah dan geofence GPS terenkripsi.
            </p>
            <div className="pt-2 flex items-center justify-between">
              <Badge tone="emerald">Status: Terhubung (API v2)</Badge>
              <button
                type="button"
                onClick={() => alert('Mengunduh APK Installer Smart Attendance Android App v2.4 (Simulasi)...')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 text-slate-800 text-xs font-semibold hover:bg-slate-300 transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3" />
                Unduh APK
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <MapPin className="w-4 h-4 text-emerald-600" />
              GPS Geofencing Karyawan Lapangan
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sinkronisasi koordinat otomatis saat sales atau teknisi alkes melakukan kunjungan fasyankes atau rumah sakit.
            </p>
            <div className="text-2xs font-mono text-slate-500 pt-1">
              Radius validasi: 150m dari titik operasional pusat.
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <Clock3 className="w-4 h-4 text-amber-600" />
              Sinkronisasi Otomatis Shift & Lembur
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Setiap catatan kehadiran pada aplikasi Android langsung mengalir ke kalkulator lembur dan modul payroll bulanan secara real-time.
            </p>
            <div className="text-2xs font-mono text-slate-500 pt-1">
              Integrasi: 100% compliant CDAKB & ISO 13485.
            </div>
          </div>
        </div>
      </Panel>

      <Panel
        judul="Log Kehadiran Harian"
        keterangan="Sumber absensi dicatat sebagai bukti audit (data integrity) — GPS, biometrik, atau koreksi manual HR beserta alasannya."
        aksi={
          <div className="flex items-center gap-2">
            <select
              className={inputClass}
              value={tanggalFilter}
              onChange={(e) => setTanggalFilter(e.target.value)}
            >
              <option value="Semua">Semua tanggal</option>
              {tanggalTersedia.map((t) => (
                <option key={t} value={t}>{formatTanggal(t)}</option>
              ))}
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Karyawan</th>
                <th className="py-3 px-4">Masuk / Keluar</th>
                <th className="py-3 px-4">Jam Kerja</th>
                <th className="py-3 px-4">Sumber Absensi</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Keterangan Lokasi / Perangkat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {daftarAbsensi.map((a) => {
                const Ikon = IKON_SUMBER[a.sumber];
                const menitKerja = a.jamKeluar === '-' ? null : hitungMenitKerja(a.jamMasuk, a.jamKeluar);
                const telat = evaluasiKeterlambatan(a.jamMasuk);
                return (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-slate-700">{formatTanggal(a.tanggal)}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{a.nama}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{a.jamMasuk} — {a.jamKeluar}</td>
                    <td className="py-3 px-4 text-slate-700">
                      {menitKerja === null ? 'Berjalan' : `${Math.floor(menitKerja / 60)} j ${menitKerja % 60} m`}
                    </td>
                    <td className="py-3 px-4">
                      <Badge tone={toneSumber(a.sumber)}>
                        <Ikon className="w-3 h-3" />
                        {a.sumber}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge tone={toneStatus(a.status)}>{a.status}</Badge>
                      {a.status === 'Terlambat' && telat.menitTerlambat > 0 && (
                        <div className="text-2xs text-amber-700 mt-1">
                          +{telat.menitTerlambat} menit dari jam masuk {telat.jamAcuan} • potongan{' '}
                          {formatRupiah(hitungPotonganKeterlambatan(telat.menitTerlambat))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 max-w-md">{a.lokasi}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        judul="Kalkulator & Persetujuan Lembur (UU Ketenagakerjaan)"
        keterangan={`Upah sejam = 1/${P.pembagiUpahPerJam} upah sebulan. Jam pertama ${P.faktorLemburJamPertama}×, jam berikutnya ${P.faktorLemburJamBerikutnya}× upah sejam. Lembur disetujui otomatis masuk komponen slip gaji.`}
        aksi={
          <button type="button" className={tombolPrimer} onClick={() => setModalLembur(true)}>
            <Plus className="w-4 h-4" />
            Ajukan Lembur
          </button>
        }
      >
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Karyawan</th>
                <th className="py-3 px-4 text-right">Jam Lembur</th>
                <th className="py-3 px-4 text-right">Upah Sejam</th>
                <th className="py-3 px-4">Rincian Perhitungan</th>
                <th className="py-3 px-4 text-right">Total Lembur</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lembur.map((l) => {
                const jamPertama = Math.min(l.jamLembur, 1);
                const jamBerikutnya = Math.max(l.jamLembur - 1, 0);
                return (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-slate-700">{formatTanggal(l.tanggal)}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{l.nama}</td>
                    <td className="py-3 px-4 text-right font-mono">{l.jamLembur} jam</td>
                    <td className="py-3 px-4 text-right font-mono">{formatRupiah(l.upahPerJam)}</td>
                    <td className="py-3 px-4 font-mono text-2xs text-slate-500">
                      ({formatRupiah(l.upahPerJam)} × {P.faktorLemburJamPertama} × {jamPertama} j) +
                      ({formatRupiah(l.upahPerJam)} × {P.faktorLemburJamBerikutnya} × {jamBerikutnya} j)
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-800">{formatRupiah(l.totalLembur)}</td>
                    <td className="py-3 px-4">
                      <Badge tone={l.status === 'Disetujui' ? 'emerald' : l.status === 'Ditolak' ? 'rose' : 'amber'}>{l.status}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      {l.status === 'Menunggu Persetujuan' && (
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => ubahStatusLembur(l.id, 'Disetujui')}
                            className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 cursor-pointer"
                            title="Setujui lembur"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => ubahStatusLembur(l.id, 'Ditolak')}
                            className="p-1.5 rounded-lg bg-rose-100 text-rose-800 hover:bg-rose-200 cursor-pointer"
                            title="Tolak lembur"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {modalLembur && (
        <Modal
          judul="Ajukan Perhitungan Lembur"
          keterangan="Nilai dihitung otomatis dari gaji pokok karyawan dan jumlah jam lembur yang disetujui atasan."
          onClose={() => setModalLembur(false)}
        >
          <form onSubmit={simpanLembur} className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className={labelClass}>Karyawan</label>
                <select
                  required
                  className={inputClass}
                  value={formLembur.karyawanId}
                  onChange={(e) => setFormLembur({ ...formLembur, karyawanId: e.target.value })}
                >
                  <option value="">— Pilih karyawan —</option>
                  {karyawan.map((k) => (
                    <option key={k.id} value={k.id}>{k.nama} — {formatRupiah(k.gajiPokok)}/bulan</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Jam Lembur</label>
                <input
                  type="number"
                  min={0.5}
                  max={14}
                  step={0.5}
                  required
                  className={inputClass}
                  value={formLembur.jamLembur}
                  onChange={(e) => setFormLembur({ ...formLembur, jamLembur: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Tanggal Lembur</label>
              <input
                type="date"
                required
                className={inputClass}
                value={formLembur.tanggal}
                onChange={(e) => setFormLembur({ ...formLembur, tanggal: e.target.value })}
              />
            </div>

            {karyawanDipilih && previewLembur && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs space-y-1">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5" />
                  Rincian perhitungan — {karyawanDipilih.nama}
                </div>
                <div className="text-blue-900 font-mono text-xs">
                  Upah sejam = {formatRupiah(karyawanDipilih.gajiPokok)} / {P.pembagiUpahPerJam} = {formatRupiah(previewLembur.upahPerJam)}
                </div>
                <div className="text-blue-900 font-mono text-xs">
                  Lembur = ({formatRupiah(previewLembur.upahPerJam)} × {P.faktorLemburJamPertama} × {Math.min(formLembur.jamLembur, 1)} j) +
                  ({formatRupiah(previewLembur.upahPerJam)} × {P.faktorLemburJamBerikutnya} × {Math.max(formLembur.jamLembur - 1, 0)} j)
                </div>
                <div className="text-blue-900 font-bold">Total = {formatRupiah(previewLembur.totalLembur)}</div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button type="button" className={tombolSekunder} onClick={() => setModalLembur(false)}>Batal</button>
              <button type="submit" className={tombolPrimer} disabled={!karyawanDipilih}>Simpan Pengajuan</button>
            </div>
          </form>
        </Modal>
      )}

      {modalMobilePreview && (
        <Modal
          judul="Preview Mobile App Client v.2.4 (iOS & Android)"
          keterangan="Simulator tampilan aplikasi seluler karyawan untuk absensi GPS, verifikasi biometrik wajah, dan push notifikasi real-time ke sistem HRD."
          onClose={() => setModalMobilePreview(false)}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-100 p-2 rounded-xl">
              <div className="text-xs font-bold text-slate-700">Pilih Platform Target:</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOsPreview('android')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    osPreview === 'android' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  Android (Material You)
                </button>
                <button
                  type="button"
                  onClick={() => setOsPreview('ios')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    osPreview === 'ios' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  iOS (Apple Liquid)
                </button>
              </div>
            </div>

            {/* Simulated Phone Frame */}
            <div className="flex justify-center">
              <div className={`w-[320px] rounded-[36px] border-[8px] ${osPreview === 'ios' ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-slate-700 bg-slate-900 text-slate-100'} p-4 shadow-2xl relative overflow-hidden font-sans`}>
                {/* Phone Status Bar */}
                <div className="flex items-center justify-between text-2xs text-slate-400 px-2 pb-3 border-b border-slate-800">
                  <span className="font-mono">09:41</span>
                  <div className="flex items-center gap-1.5">
                    <Signal className="w-3 h-3" />
                    <Wifi className="w-3 h-3" />
                    <Battery className="w-3 h-3" />
                  </div>
                </div>

                {/* App Header inside phone */}
                <div className="py-3 px-2 flex items-center justify-between">
                  <div>
                    <div className="text-2xs text-blue-400 font-semibold">AMS Smart Attendance</div>
                    <div className="text-xs font-bold text-white">v.2.4 ({osPreview.toUpperCase()})</div>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-2xs font-bold text-white">
                    AMS
                  </div>
                </div>

                {/* App Body */}
                <div className="bg-slate-800 rounded-2xl p-3 space-y-3 my-2 text-xs">
                  <div className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-700">
                    <ScanFace className="w-6 h-6 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-white text-xs">{karyawan[0]?.nama || 'Ahmad Fauzi, S.Farm'}</div>
                      <div className="text-2xs text-emerald-400 font-mono">Face ID & Geofence Valid</div>
                    </div>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Lokasi Kerja:</span>
                      <span className="text-white font-medium">Pabrik Cikarang</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Radius GPS:</span>
                      <span className="text-emerald-400 font-medium">12m (Dalam Pagar)</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Status Shift:</span>
                      <span className="text-blue-400 font-medium">Shift 1 (08:00 - 16:00)</span>
                    </div>
                  </div>

                  {mobileClockedIn ? (
                    <div className="bg-emerald-950/80 border border-emerald-500/50 p-3 rounded-xl text-center space-y-1">
                      <Check className="w-6 h-6 text-emerald-400 mx-auto" />
                      <div className="font-bold text-emerald-200 text-xs">CLOCK-IN BERHASIL</div>
                      <div className="text-2xs text-emerald-300 font-mono">Tercatat ke Database Pusat HRD AMS</div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleMobileClockIn}
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wide shadow-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Clock3 className="w-4 h-4" />
                      CLOCK-IN SEKARANG
                    </button>
                  )}
                </div>

                {/* Phone Bottom Home Bar */}
                <div className="w-24 h-1 bg-slate-700 rounded-full mx-auto mt-3" />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                className={tombolPrimer}
                onClick={() => setModalMobilePreview(false)}
              >
                Tutup Simulator
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
