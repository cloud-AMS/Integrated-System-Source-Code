import React, { useMemo, useState } from 'react';
import { Calendar, Check, Plus, X } from 'lucide-react';
import { db } from '../../services/pocketbase';
import type { JadwalShift, KaryawanHRIS, PengajuanCuti } from '../../types';
import { formatTanggal } from '../ui';
import { hitungJumlahHariCuti } from './mobileHelpers';

interface MobileShiftCutiViewProps {
  karyawan: KaryawanHRIS | undefined;
  shiftList: JadwalShift[];
  cutiList: PengajuanCuti[];
  canApproveLeave: boolean;
  approverName: string;
  onRefresh: () => void;
}

const JENIS_CUTI: PengajuanCuti['jenis'][] = [
  'Cuti Tahunan',
  'Sakit',
  'Izin Khusus',
  'Cuti Melahirkan'
];

export const MobileShiftCutiView: React.FC<MobileShiftCutiViewProps> = ({
  karyawan,
  shiftList,
  cutiList,
  canApproveLeave,
  approverName,
  onRefresh
}) => {
  const [modalAjukan, setModalAjukan] = useState(false);
  const [jenis, setJenis] = useState<PengajuanCuti['jenis']>('Cuti Tahunan');
  const [tanggalMulai, setTanggalMulai] = useState(() => new Date().toISOString().split('T')[0]);
  const [tanggalSelesai, setTanggalSelesai] = useState(() => new Date().toISOString().split('T')[0]);
  const [alasan, setAlasan] = useState('');
  const [galat, setGalat] = useState('');

  const karyawanId = karyawan?.id || 'EMP-00';
  const namaKaryawan = karyawan?.nama || 'Karyawan AMS';

  const jatahTahunan = 12;
  const terpakai = useMemo(
    () =>
      cutiList
        .filter(
          (c) =>
            c.karyawanId === karyawanId &&
            c.jenis === 'Cuti Tahunan' &&
            c.status === 'Disetujui'
        )
        .reduce((acc, c) => acc + c.jumlahHari, 0),
    [cutiList, karyawanId]
  );

  const shiftSaya = useMemo(() => {
    const namaDepan = namaKaryawan.split(',')[0].trim().toLowerCase();
    return shiftList.filter((s) =>
      s.tim.some((t) => t.toLowerCase().includes(namaDepan))
    );
  }, [shiftList, namaKaryawan]);

  const cutiTampil = useMemo(() => {
    if (canApproveLeave) return cutiList;
    return cutiList.filter(
      (c) => c.karyawanId === karyawanId || c.namaKaryawan === namaKaryawan
    );
  }, [cutiList, canApproveLeave, karyawanId, namaKaryawan]);

  const jumlahHari = hitungJumlahHariCuti(tanggalMulai, tanggalSelesai);

  const kirimPengajuan = (e: React.FormEvent) => {
    e.preventDefault();
    if (jumlahHari <= 0) {
      setGalat('Tanggal selesai harus sama atau setelah tanggal mulai.');
      return;
    }
    if (!alasan.trim()) {
      setGalat('Alasan pengajuan wajib diisi.');
      return;
    }
    const baru: PengajuanCuti = {
      id: `CUTI-${Date.now()}`,
      karyawanId,
      namaKaryawan,
      jenis,
      tanggalMulai,
      tanggalSelesai,
      jumlahHari,
      alasan: alasan.trim(),
      status: 'Menunggu',
      tanggalPengajuan: new Date().toISOString().split('T')[0]
    };
    db.addCuti(baru);
    onRefresh();
    setModalAjukan(false);
    setAlasan('');
    setGalat('');
  };

  const putuskanCuti = (id: string, status: 'Disetujui' | 'Ditolak') => {
    db.ubahStatusCuti(id, status, approverName);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">
            Sisa Cuti
          </p>
          <p className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
            {Math.max(jatahTahunan - terpakai, 0)}{' '}
            <span className="text-xs font-semibold text-slate-500">hari</span>
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">
            Terpakai
          </p>
          <p className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
            {terpakai}{' '}
            <span className="text-xs font-semibold text-slate-500">hari</span>
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">
            Shift Aktif
          </p>
          <p className="text-xl font-bold text-teal-700 mt-1 tabular-nums">
            {shiftSaya.length > 0 ? shiftSaya.length : shiftList.length}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Jadwal Shift Kerja</h2>
            <p className="text-2xs text-slate-500">
              {shiftSaya.length > 0
                ? 'Jadwal shift yang memuat nama Anda'
                : 'Karyawan non-shift mengikuti jam kantor 08.00–17.00 · daftar rotasi pabrik/cold chain:'}
            </p>
          </div>
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
        </div>
        <div className="space-y-2.5">
          {(shiftSaya.length > 0 ? shiftSaya : shiftList).map((s) => (
            <div
              key={s.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900">{s.namaShift}</span>
                <span className="text-2xs font-mono font-semibold text-slate-500 tabular-nums">
                  {s.tanggalMulai} s/d {s.tanggalBerakhir}
                </span>
              </div>
              <p className="text-xs font-semibold text-teal-800">{s.area}</p>
              <p className="text-2xs text-slate-600 leading-relaxed">{s.polaRotasi}</p>
              <p className="text-2xs text-slate-500">Tim: {s.tim.join(' · ')}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Pengajuan Cuti &amp; Izin</h2>
            <p className="text-2xs text-slate-500">
              Tersinkronisasi langsung dengan HRD Pusat
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setGalat('');
              setModalAjukan(true);
            }}
            className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl bg-[var(--brand)] px-3.5 text-xs font-bold text-white hover:bg-[var(--brand-aksen)] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Ajukan Cuti
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {cutiTampil.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              Belum ada pengajuan cuti atau izin.
            </p>
          ) : (
            cutiTampil.map((c) => (
              <div key={c.id} className="py-3 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {c.jenis} · {c.jumlahHari} hari
                    </p>
                    <p className="text-2xs text-slate-500">
                      {c.namaKaryawan} · {formatTanggal(c.tanggalMulai)}
                      {c.tanggalSelesai !== c.tanggalMulai
                        ? ` s/d ${formatTanggal(c.tanggalSelesai)}`
                        : ''}
                    </p>
                  </div>
                  <span
                    className={`text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0 ${
                      c.status === 'Disetujui'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : c.status === 'Ditolak'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{c.alasan}</p>
                {c.disetujuiOleh && (
                  <p className="text-2xs text-slate-500">
                    Diputuskan oleh: {c.disetujuiOleh}
                  </p>
                )}
                {canApproveLeave && c.status === 'Menunggu' && (
                  <div className="flex items-center gap-2 pt-1.5">
                    <button
                      type="button"
                      onClick={() => putuskanCuti(c.id, 'Disetujui')}
                      className="min-h-[44px] flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      Setujui
                    </button>
                    <button
                      type="button"
                      onClick={() => putuskanCuti(c.id, 'Ditolak')}
                      className="min-h-[44px] flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-bold hover:bg-rose-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      Tolak
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {modalAjukan && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Ajukan Cuti / Izin</h3>
              <button
                type="button"
                onClick={() => setModalAjukan(false)}
                aria-label="Tutup"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={kirimPengajuan} className="space-y-3">
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Jenis Pengajuan
                </label>
                <select
                  value={jenis}
                  onChange={(e) => setJenis(e.target.value as PengajuanCuti['jenis'])}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm bg-white"
                >
                  {JENIS_CUTI.map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Mulai
                  </label>
                  <input
                    type="date"
                    value={tanggalMulai}
                    onChange={(e) => setTanggalMulai(e.target.value)}
                    required
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Selesai
                  </label>
                  <input
                    type="date"
                    value={tanggalSelesai}
                    onChange={(e) => setTanggalSelesai(e.target.value)}
                    required
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm"
                  />
                </div>
              </div>
              <p className="text-xs font-semibold text-slate-600 tabular-nums">
                Durasi pengajuan: <strong className="text-slate-900">{jumlahHari} hari</strong>
              </p>
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Alasan &amp; Pengalihan Tugas
                </label>
                <textarea
                  rows={3}
                  value={alasan}
                  onChange={(e) => setAlasan(e.target.value)}
                  required
                  placeholder="Jelaskan keperluan cuti/izin dan rekan pengganti sementara..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm"
                />
              </div>
              {galat && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  {galat}
                </p>
              )}
              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-[var(--brand)] text-white text-sm font-bold hover:bg-[var(--brand-aksen)] cursor-pointer"
              >
                Kirim Pengajuan Cuti
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
