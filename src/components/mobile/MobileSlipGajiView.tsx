import React, { useMemo, useState } from 'react';
import { ChevronRight, ReceiptText, X } from 'lucide-react';
import type { KaryawanHRIS, SlipGaji } from '../../types';
import { formatRupiah } from '../ui';

interface MobileSlipGajiViewProps {
  karyawan: KaryawanHRIS | undefined;
  slipList: SlipGaji[];
  canViewAllEmployees: boolean;
}

export const MobileSlipGajiView: React.FC<MobileSlipGajiViewProps> = ({
  karyawan,
  slipList,
  canViewAllEmployees
}) => {
  const [slipDipilih, setSlipDipilih] = useState<SlipGaji | null>(null);
  const karyawanId = karyawan?.id || '';
  const namaKaryawan = karyawan?.nama || '';

  const slipTampil = useMemo(() => {
    const milikSaya = slipList.filter(
      (s) => s.karyawanId === karyawanId || s.nama === namaKaryawan
    );
    if (milikSaya.length > 0 && !canViewAllEmployees) return milikSaya;
    return canViewAllEmployees ? slipList : milikSaya;
  }, [slipList, karyawanId, namaKaryawan, canViewAllEmployees]);

  const slipTerbaru = slipTampil[0] || null;

  return (
    <div className="space-y-4">
      {slipTerbaru && (
        <section className="rounded-2xl bg-slate-900 text-white p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
              Take Home Pay Terakhir · {slipTerbaru.periode}
            </span>
            <span className="text-2xs font-bold uppercase tracking-wider text-emerald-300">
              {slipTerbaru.status}
            </span>
          </div>
          <p className="text-3xl font-bold tracking-tight tabular-nums">
            {formatRupiah(slipTerbaru.takeHomePay)}
          </p>
          <p className="text-xs text-slate-300">
            {slipTerbaru.nama} · PPh 21 ({slipTerbaru.metodePph21})
          </p>
          <button
            type="button"
            onClick={() => setSlipDipilih(slipTerbaru)}
            className="min-h-[44px] w-full rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white inline-flex items-center justify-center gap-1.5 cursor-pointer transition"
          >
            <ReceiptText className="w-4 h-4" />
            Lihat Rincian Komponen Gaji
          </button>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900">Arsip Slip Gaji</h2>
          <span className="text-xs font-semibold text-slate-500 tabular-nums">
            {slipTampil.length} periode
          </span>
        </div>

        {slipTampil.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            Belum ada slip gaji yang diterbitkan HRD untuk akun Anda.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {slipTampil.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSlipDipilih(s)}
                className="w-full min-h-[44px] py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-50 rounded-lg px-1 cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    Periode {s.periode} · {s.nama}
                  </p>
                  <p className="text-xs text-slate-500 tabular-nums">
                    Gaji Pokok {formatRupiah(s.gajiPokok)} · {s.status}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-bold text-slate-900 tabular-nums">
                    {formatRupiah(s.takeHomePay)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {slipDipilih && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                  Rincian Slip Gaji · {slipDipilih.id}
                </p>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {slipDipilih.nama} ({slipDipilih.periode})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSlipDipilih(null)}
                aria-label="Tutup"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <p className="text-2xs font-bold uppercase tracking-wider text-emerald-700">
                  Penerimaan
                </p>
                <div className="flex justify-between">
                  <span className="text-slate-600">Gaji Pokok</span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    {formatRupiah(slipDipilih.gajiPokok)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Tunjangan Kehadiran</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {formatRupiah(slipDipilih.tunjanganKehadiran)}
                  </span>
                </div>
                {slipDipilih.insentifSales > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Insentif Sales</span>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {formatRupiah(slipDipilih.insentifSales)}
                    </span>
                  </div>
                )}
                {slipDipilih.insentifProduksi > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Insentif Produksi</span>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {formatRupiah(slipDipilih.insentifProduksi)}
                    </span>
                  </div>
                )}
                {slipDipilih.lembur > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Upah Lembur</span>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {formatRupiah(slipDipilih.lembur)}
                    </span>
                  </div>
                )}
                {slipDipilih.tunjanganPajak > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tunjangan Pajak</span>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {formatRupiah(slipDipilih.tunjanganPajak)}
                    </span>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <p className="text-2xs font-bold uppercase tracking-wider text-rose-700">
                  Potongan &amp; Pajak
                </p>
                <div className="flex justify-between">
                  <span className="text-slate-600">Potongan Absensi / Terlambat</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    -{formatRupiah(slipDipilih.potonganAbsensi)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">BPJS Kesehatan Karyawan</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    -{formatRupiah(slipDipilih.bpjsKesehatanKaryawan)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">BPJS JHT Karyawan (2%)</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    -{formatRupiah(slipDipilih.bpjsJhtKaryawan)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">BPJS JP Karyawan (1%)</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    -{formatRupiah(slipDipilih.bpjsJpKaryawan)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">
                    PPh 21 ({slipDipilih.metodePph21})
                  </span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    -{formatRupiah(slipDipilih.pph21)}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-slate-900 text-white p-4 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Take Home Pay
                </span>
                <span className="text-lg font-bold tabular-nums">
                  {formatRupiah(slipDipilih.takeHomePay)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
