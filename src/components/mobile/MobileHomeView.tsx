import React, { useMemo } from 'react';
import {
  ArrowRight,
  CalendarClock,
  Crosshair,
  Gavel,
  MapPin,
  PackageSearch,
  ReceiptText,
  ShoppingCart,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import type {
  JadwalShift,
  KaryawanHRIS,
  KunjunganMedRep,
  LogAbsensi,
  PengajuanCuti,
  PraOrderMedRep,
  ProspekAlkes,
  SlipGaji,
  TenderAlkes
} from '../../types';
import { formatRupiah, formatTanggal } from '../ui';
import type { MobileCapabilities } from './mobileHelpers';
import type { CrmSubTab } from './MobileCrmView';
import type { SalesSubTab } from './MobileSalesView';

export type MobileNavTarget =
  | { tab: 'beranda' }
  | { tab: 'absensi' }
  | { tab: 'shift-cuti' }
  | { tab: 'slip-gaji' }
  | { tab: 'hris'; sub?: 'absensi' | 'shift-cuti' | 'slip-gaji' }
  | { tab: 'crm'; sub?: CrmSubTab }
  | { tab: 'penjualan'; sub?: SalesSubTab }
  | { tab: 'profil' };

interface MobileHomeViewProps {
  namaPengguna: string;
  capabilities: MobileCapabilities;
  karyawan: KaryawanHRIS | undefined;
  absensiList: LogAbsensi[];
  shiftList: JadwalShift[];
  cutiList: PengajuanCuti[];
  slipList: SlipGaji[];
  prospekList: ProspekAlkes[];
  kunjunganList: KunjunganMedRep[];
  praOrderList: PraOrderMedRep[];
  tenderList: TenderAlkes[];
  statusKoneksiLabel: string;
  pocketbaseOnline: boolean;
  onNavigate: (target: MobileNavTarget) => void;
}

export const MobileHomeView: React.FC<MobileHomeViewProps> = ({
  namaPengguna,
  capabilities,
  karyawan,
  absensiList,
  shiftList,
  cutiList,
  slipList,
  prospekList,
  kunjunganList,
  praOrderList,
  tenderList,
  statusKoneksiLabel,
  pocketbaseOnline,
  onNavigate
}) => {
  const hariIni = new Date().toISOString().split('T')[0];
  const karyawanId = karyawan?.id || '';
  const namaKaryawan = karyawan?.nama || namaPengguna;

  const logHariIni = useMemo(
    () =>
      absensiList.find(
        (a) => a.tanggal === hariIni && (a.karyawanId === karyawanId || a.nama === namaKaryawan)
      ),
    [absensiList, hariIni, karyawanId, namaKaryawan]
  );

  const shiftAktif = useMemo(() => {
    const cocok = shiftList.filter((s) => s.tim.includes(namaKaryawan));
    return (cocok.length > 0 ? cocok : shiftList)[0] || null;
  }, [shiftList, namaKaryawan]);

  const cutiMenunggu = useMemo(
    () =>
      cutiList.filter(
        (c) => c.status === 'Menunggu' && (capabilities.canApproveLeave || c.karyawanId === karyawanId)
      ).length,
    [cutiList, capabilities.canApproveLeave, karyawanId]
  );

  const slipTerbaru = useMemo(() => {
    const milik = slipList.filter((s) => s.karyawanId === karyawanId || s.nama === namaKaryawan);
    return milik[0] || (capabilities.canViewAllEmployees ? slipList[0] : null) || null;
  }, [slipList, karyawanId, namaKaryawan, capabilities.canViewAllEmployees]);

  // Ringkasan Sales & CRM
  const kunjunganBelumCheckIn = useMemo(
    () => kunjunganList.filter((k) => !k.koordinatCheckIn).length,
    [kunjunganList]
  );

  const pipelineAktif = useMemo(() => {
    const aktif = prospekList.filter((p) => p.tahap !== 'Pemenang' && p.tahap !== 'Gagal');
    const nilai = aktif.reduce((acc, p) => acc + p.nilaiEstimasi, 0);
    return { jumlah: aktif.length, nilai };
  }, [prospekList]);

  const tenderAktif = useMemo(
    () => tenderList.filter((t) => t.statusTender === 'Aktif' || t.statusTender === 'Hampir Tutup'),
    [tenderList]
  );

  const praOrderMenunggu = useMemo(
    () => praOrderList.filter((p) => p.statusPraOrder === 'Terkirim ke Gudang').length,
    [praOrderList]
  );

  const keAbsensi = () =>
    onNavigate(capabilities.isSales ? { tab: 'hris', sub: 'absensi' } : { tab: 'absensi' });
  const keShiftCuti = () =>
    onNavigate(capabilities.isSales ? { tab: 'hris', sub: 'shift-cuti' } : { tab: 'shift-cuti' });
  const keSlipGaji = () =>
    onNavigate(capabilities.isSales ? { tab: 'hris', sub: 'slip-gaji' } : { tab: 'slip-gaji' });

  return (
    <div className="space-y-4">
      {/* Greeting + Sync Banner */}
      <section className="rounded-2xl bg-slate-900 text-white p-5 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-2xs font-bold uppercase tracking-wider text-teal-300">
              {capabilities.roleLabel} · {formatTanggal(hariIni)}
            </p>
            <h2 className="text-xl font-bold tracking-tight mt-0.5 truncate">
              Halo, {karyawan?.nama || namaPengguna}
            </h2>
            <p className="text-xs text-slate-300 truncate mt-0.5">
              {karyawan?.jabatan || 'PT Anugrahmitra Selaras'} · {karyawan?.lokasi || 'Operasional AMS'}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-md border px-2 py-1 text-2xs font-bold ${
              pocketbaseOnline
                ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-200'
                : 'border-slate-600 bg-slate-800 text-slate-300'
            }`}
          >
            {pocketbaseOnline ? 'PB AMS Aktif' : 'Sync Real-Time'}
          </span>
        </div>

        <div className="rounded-xl bg-white/10 border border-white/10 p-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-2xs uppercase tracking-wider text-slate-300 font-bold">
              Kehadiran Hari Ini
            </p>
            {logHariIni ? (
              <p className="text-xs font-semibold text-white mt-0.5">
                Masuk {logHariIni.jamMasuk}
                {logHariIni.jamKeluar && logHariIni.jamKeluar !== '-'
                  ? ` · Pulang ${logHariIni.jamKeluar}`
                  : ' · Belum Pulang'}
              </p>
            ) : (
              <p className="text-xs text-amber-200 mt-0.5">
                Belum ada log absensi GPS hari ini
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={keAbsensi}
            className="min-h-[44px] shrink-0 rounded-xl bg-teal-500 hover:bg-teal-400 px-3.5 text-xs font-bold text-slate-950 inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <Crosshair className="w-4 h-4" />
            {logHariIni ? 'Lihat Absensi' : 'Absen GPS'}
          </button>
        </div>

        <p className="text-2xs text-slate-400">{statusKoneksiLabel}</p>
      </section>

      {/* Ringkasan HRIS Personal */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Layanan HRIS Karyawan
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={keShiftCuti}
            className="text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-teal-300 transition cursor-pointer space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <CalendarClock className="w-5 h-5 text-teal-700" />
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xs font-bold text-slate-900">Jadwal Shift Aktif</p>
            <p className="text-2xs text-slate-600 truncate">
              {shiftAktif ? `${shiftAktif.namaShift} · ${shiftAktif.area}` : 'Lihat jadwal shift'}
            </p>
          </button>

          <button
            type="button"
            onClick={keShiftCuti}
            className="text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-teal-300 transition cursor-pointer space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xs font-bold text-slate-900">Pengajuan Cuti &amp; Izin</p>
            <p className="text-2xs text-slate-600">
              {cutiMenunggu > 0
                ? `${cutiMenunggu} pengajuan menunggu persetujuan`
                : 'Ajukan atau pantau cuti Anda'}
            </p>
          </button>

          <button
            type="button"
            onClick={keSlipGaji}
            className="text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-teal-300 transition cursor-pointer space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <ReceiptText className="w-5 h-5 text-sky-700" />
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xs font-bold text-slate-900">Slip Gaji Digital</p>
            <p className="text-2xs text-slate-600 tabular-nums">
              {slipTerbaru
                ? `${slipTerbaru.periode} · ${formatRupiah(slipTerbaru.takeHomePay)}`
                : 'Lihat rincian payroll'}
            </p>
          </button>
        </div>
      </section>

      {/* Ringkasan CRM & Sales (hanya untuk peran Sales / Manager / Admin) */}
      {capabilities.isSales && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Aktivitas CRM &amp; Penjualan Lapangan
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => onNavigate({ tab: 'crm', sub: 'kunjungan' })}
              className="text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-teal-300 transition cursor-pointer space-y-1"
            >
              <MapPin className="w-5 h-5 text-teal-700" />
              <p className="text-xl font-bold text-slate-900 tabular-nums mt-1">
                {kunjunganBelumCheckIn}
              </p>
              <p className="text-2xs font-semibold text-slate-600">
                Kunjungan Belum Check-In
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigate({ tab: 'crm', sub: 'prospek' })}
              className="text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-teal-300 transition cursor-pointer space-y-1"
            >
              <TrendingUp className="w-5 h-5 text-sky-700" />
              <p className="text-xl font-bold text-slate-900 tabular-nums mt-1">
                {pipelineAktif.jumlah}
              </p>
              <p className="text-2xs font-semibold text-slate-600">
                Prospek Aktif · {formatRupiah(pipelineAktif.nilai)}
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigate({ tab: 'penjualan', sub: 'tender' })}
              className="text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-teal-300 transition cursor-pointer space-y-1"
            >
              <Gavel className="w-5 h-5 text-amber-600" />
              <p className="text-xl font-bold text-slate-900 tabular-nums mt-1">
                {tenderAktif.length}
              </p>
              <p className="text-2xs font-semibold text-slate-600">
                Tender e-Katalog LKPP Aktif
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigate({ tab: 'penjualan', sub: 'order' })}
              className="text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-teal-300 transition cursor-pointer space-y-1"
            >
              <ShoppingCart className="w-5 h-5 text-emerald-700" />
              <p className="text-xl font-bold text-slate-900 tabular-nums mt-1">
                {praOrderMenunggu}
              </p>
              <p className="text-2xs font-semibold text-slate-600">
                Pre-Order Antre Verifikasi
              </p>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate({ tab: 'crm', sub: 'kunjungan' })}
              className="min-h-[48px] rounded-xl border border-teal-200 bg-teal-50 px-4 text-xs font-bold text-teal-900 inline-flex items-center justify-between hover:bg-teal-100 transition cursor-pointer"
            >
              <span className="inline-flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-700" />
                Mulai Check-In Kunjungan Sales (GPS)
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate({ tab: 'penjualan', sub: 'katalog' })}
              className="min-h-[48px] rounded-xl border border-slate-300 bg-white px-4 text-xs font-bold text-slate-800 inline-flex items-center justify-between hover:bg-slate-50 transition cursor-pointer"
            >
              <span className="inline-flex items-center gap-2">
                <PackageSearch className="w-4 h-4 text-slate-700" />
                Cek Katalog Produk, NIE &amp; Stok FEFO
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
