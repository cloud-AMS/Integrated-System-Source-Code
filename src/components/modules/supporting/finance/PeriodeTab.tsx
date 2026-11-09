import { useMemo, useState } from 'react';
import { db } from '../../../../services/pocketbase';
import type { PeriodeBuku } from '../../../../types';
import { alokasiBiayaMutu, periodeDari } from '../../../../utils/akuntansi';
import { Badge, Panel, Stat, formatRupiah, formatTanggal, inputClass, labelClass, tombolBahaya, tombolPrimer, tombolSekunder } from '../../../ui';
import { type IdentitasFinance, kepalaTabelKelas, pesanClass, selKelas, tabelKelas, toneStatusPeriode, totalSisi } from './ui';
import { Lock, Unlock } from 'lucide-react';

const STATUS_BERIKUTNYA: Record<PeriodeBuku['status'], PeriodeBuku['status'][]> = {
  Terbuka: ['Dikunci'],
  Dikunci: ['Ditutup', 'Terbuka'],
  Ditutup: ['Terbuka']
};

export default function PeriodeTab({
  identitas,
  dariAcuan,
  onPerubahanData
}: {
  identitas: IdentitasFinance;
  dariAcuan: Date;
  onPerubahanData: () => void;
}) {
  const [pesan, setPesan] = useState<{ tipe: 'sukses' | 'galat'; teks: string } | null>(null);
  const isoAcuan = dariAcuan.toISOString().slice(0, 10);
  const [alasan, setAlasan] = useState('');
  const [kalibrasi, setKalibrasi] = useState(48_000_000);
  const [scrap, setScrap] = useState(134_460_000);
  const [nomorBmr, setNomorBmr] = useState('');

  const periode = useMemo(() => db.getPeriodeBuku(), []);
  const jurnal = useMemo(() => db.getJurnalKeuangan(), []);

  const ringkas = (id: string) => {
    const dalam = jurnal.filter((j) => (j.periode ?? periodeDari(j.tanggalTransaksi)) === id);
    return {
      jumlah: dalam.length,
      posted: dalam.filter((j) => j.status === 'Posted').length,
      draft: dalam.filter((j) => j.status === 'Draft').length,
      nilai: dalam.filter((j) => j.status === 'Posted').reduce((a, j) => a + totalSisi(j, 'debit'), 0)
    };
  };

  const ubah = (p: PeriodeBuku, statusBaru: PeriodeBuku['status']) => {
    if (!identitas.bolehPosting) {
      setPesan({ tipe: 'galat', teks: 'Kunci dan tutup buku adalah hak PJT / QA Manager.' });
      return;
    }
    if (!alasan.trim() && statusBaru !== 'Terbuka') {
      setPesan({ tipe: 'galat', teks: 'Setiap perubahan status periode wajib disertai alasan; jejak audit ISO 13485 mencatatnya.' });
      return;
    }
    const hasil = db.ubahStatusPeriode(p.id, statusBaru, identitas.pengguna, alasan.trim());
    if (!hasil.berhasil) {
      setPesan({ tipe: 'galat', teks: hasil.alasan });
      return;
    }
    setAlasan('');
    setPesan({
      tipe: 'sukses',
      teks:
        statusBaru === 'Ditutup'
          ? `Periode ${p.label} ditutup — jurnal baru bertanggal dalam periode ini akan ditolak gerbang periode, dan saldonya menjadi angka tetap.`
          : statusBaru === 'Dikunci'
            ? `Periode ${p.label} dikunci: posting faktur baru untuk tanggal dalam periode ini akan ditolak, rekonsiliasi tetap berjalan.`
            : `Periode ${p.label} dibuka kembali. Semua jurnal Posted di dalamnya tetap utuh dan tidak diubah.`
    });
    onPerubahanData();
  };

  const alokasi = alokasiBiayaMutu({ biayaKalibrasi: kalibrasi, nilaiScrap: scrap, nomorBmrTerkait: nomorBmr.trim() || undefined });
  const masaAktif = periode.find((p) => p.status === 'Terbuka');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <Stat label="Periode Terbuka" value={masaAktif?.label ?? 'Tidak ada'} hint={masaAktif ? 'Hanya periode Terbuka yang menerima posting jurnal.' : 'Semua periode terkunci — buka satu periode sebelum mencatat transaksi.'} tone={masaAktif ? 'emerald' : 'rose'} />
        <Stat label="Periode Dikunci" value={String(periode.filter((p) => p.status === 'Dikunci').length)} hint="Dikunci saat rekonsiliasi PPN berjalan; jurnal baru bertanggal periode ini ditolak." tone="amber" />
        <Stat label="Periode Ditutup" value={String(periode.filter((p) => p.status === 'Ditutup').length)} hint="Angka dalam periode tertutup tidak dapat ditambah atau diubah." tone="blue" />
      </div>

      {pesan && <div className={pesanClass(pesan.tipe)}>{pesan.teks}</div>}

      <Panel
        judul="Periode Buku"
        keterangan="Kunci dulu untuk rekonsiliasi, baru tutup. Membuka kembali periode yang sudah ditutup tidak mengubah jurnal Posted — ia hanya mengizinkan posting tambahan, dan itu tercatat di audit trail."
        aksi={
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              placeholder="Alasan perubahan status..."
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs w-56"
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className={tabelKelas}>
            <thead>
              <tr className={kepalaTabelKelas}>
                <th className={selKelas}>Periode</th>
                <th className={selKelas}>Status</th>
                <th className={`${selKelas} text-right`}>Jurnal</th>
                <th className={`${selKelas} text-right`}>Draf Menunggu</th>
                <th className={`${selKelas} text-right`}>Nilai Posted</th>
                <th className={selKelas}>Ditutup Pada / Oleh</th>
                <th className={selKelas}>Alasan</th>
                <th className={selKelas}>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {periode.map((p) => {
                const r = ringkas(p.id);
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className={`${selKelas} font-mono font-bold text-blue-800 whitespace-nowrap`}>
                      {p.label}
                      {p.id === periodeDari(isoAcuan) && (
                        <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-3xs font-bold bg-blue-100 text-blue-800">MASA ACUAN</span>
                      )}
                    </td>
                    <td className={selKelas}>
                      <Badge tone={toneStatusPeriode(p.status)}>{p.status}</Badge>
                    </td>
                    <td className={`${selKelas} text-right`}>
                      {r.posted} Posted / {r.jumlah} total
                    </td>
                    <td className={`${selKelas} text-right ${r.draft ? 'text-amber-700 font-bold' : 'text-slate-400'}`}>{r.draft}</td>
                    <td className={`${selKelas} text-right font-bold`}>{formatRupiah(r.nilai)}</td>
                    <td className={`${selKelas} text-2xs text-slate-600`}>
                      {p.ditutupPada ? `${formatTanggal(p.ditutupPada)} · ${p.ditutupOleh}` : '-'}
                    </td>
                    <td className={`${selKelas} text-2xs text-slate-500`}>{p.alasan || '-'}</td>
                    <td className={selKelas}>
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        {STATUS_BERIKUTNYA[p.status].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => ubah(p, s)}
                            className={`${s === 'Ditutup' ? tombolBahaya : tombolSekunder} !px-2.5 !py-1`}
                          >
                            {s === 'Terbuka' ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            {s === 'Terbuka' ? 'Buka Kembali' : s === 'Dikunci' ? 'Kunci' : 'Tutup Buku'}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        judul="Alokasi Biaya Mutu (ISO 13485)"
        keterangan="Biaya mutu yang terikat satu BMR produksi ikut Cost of Goods Manufactured dan turun ke HPP saat barang diserahkan. Biaya mutu periodik — audit sertifikasi, kalibrasi alat bersama — tetap Beban Operasional. Membedakan keduanya mencegah harga pokok unit naik tanpa dasar."
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-3 text-xs">
            <div>
              <label className={labelClass}>Kalibrasi & Uji Fungsi (Rp)</label>
              <input type="number" min={0} step={1000} value={kalibrasi} onChange={(e) => setKalibrasi(Number(e.target.value))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Scrap Material Gagal (Rp)</label>
              <input type="number" min={0} step={1000} value={scrap} onChange={(e) => setScrap(Number(e.target.value))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Nomor BMR Terkait (opsional)</label>
              <input type="text" value={nomorBmr} onChange={(e) => setNomorBmr(e.target.value)} placeholder="BMR-2024-0142" className={`${inputClass} font-mono`} />
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 leading-relaxed">
              {alokasi.alasan}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="rounded-xl border border-slate-200 p-3">
                <div className="text-2xs text-slate-500">Masuk COGM / HPP</div>
                <div className={`font-bold ${alokasi.keHpp ? 'text-emerald-700' : 'text-slate-400'}`}>{formatRupiah(alokasi.keHpp)}</div>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <div className="text-2xs text-slate-500">Masuk Beban Operasional</div>
                <div className={`font-bold ${alokasi.keBebanOperasional ? 'text-blue-700' : 'text-slate-400'}`}>{formatRupiah(alokasi.keBebanOperasional)}</div>
              </div>
            </div>
            <table className={tabelKelas}>
              <thead>
                <tr className={kepalaTabelKelas}>
                  <th className={selKelas}>Komponen Biaya Mutu</th>
                  <th className={`${selKelas} text-right`}>Nilai</th>
                  <th className={selKelas}>Tujuan Alokasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alokasi.rincian.map((r) => (
                  <tr key={r.komponen} className="hover:bg-slate-50">
                    <td className={`${selKelas} font-semibold text-slate-800`}>{r.komponen}</td>
                    <td className={`${selKelas} text-right`}>{formatRupiah(r.nilai)}</td>
                    <td className={selKelas}>
                      <Badge tone={r.tujuan === 'COGM/HPP' ? 'emerald' : 'blue'}>{r.tujuan}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const daftarBmr = db.getBetsProduksi().filter((b) => b.nomorBMR === nomorBmr.trim());
                  setPesan(
                    daftarBmr.length
                      ? { tipe: 'sukses', teks: `BMR ${nomorBmr} ditemukan ${daftarBmr.length} batch produksi — biaya mutu boleh diikat ke COGM batch tersebut.` }
                      : { tipe: 'galat', teks: `BMR ${nomorBmr || '(kosong)'} tidak ditemukan pada batch produksi; biaya mutu diperlakukan sebagai Beban Operasional, bukan HPP.` }
                  );
                }}
                className={tombolPrimer}
              >
                Telusuri BMR ke Batch Produksi
              </button>
              <span className="text-2xs text-slate-500">Penelusuran ini membaca modul Warehouse; tanpa BMR yang sah, alokasi ke HPP akan salah harga pokok.</span>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
