import { useMemo, useState } from 'react';
import { db } from '../../../../services/pocketbase';
import type { AkunCoA, KelompokLaporan, TipeAkun } from '../../../../types';
import { NAMA_PUSAT_BIAYA, susunLabaRugi, susunNeraca } from '../../../../utils/akuntansi';
import { Badge, Modal, Panel, Stat, chipFilter, formatPersen, formatRupiah, inputClass, labelClass, tombolPrimer, tombolSekunder } from '../../../ui';
import { kepalaTabelKelas, pesanClass, selKelas, tabelKelas } from './ui';
import { Plus, Scale } from 'lucide-react';

const TIPE_AKUN: TipeAkun[] = ['Aset', 'Kewajiban', 'Ekuitas', 'Pendapatan', 'Beban'];

/** Kelompok dipilih dari daftar yang sah, bukan diturunkan dari pola kode: CoA boleh diperdalam
 *  tanpa membuat baris Neraca/Laba Rugi pecah. */
const KELOMPOK_PER_TIPE: Record<TipeAkun, KelompokLaporan[]> = {
  Aset: ['Aset Lancar', 'Aset Tidak Lancar'],
  Kewajiban: ['Kewajiban Lancar', 'Kewajiban Tidak Lancar'],
  Ekuitas: ['Ekuitas'],
  Pendapatan: ['Pendapatan Operasional', 'Pendapatan Lain-lain'],
  Beban: ['Harga Pokok Penjualan', 'Beban Operasional', 'Beban Lain-lain']
};

const SALDO_NORMAL: AkunCoA['saldoNormal'][] = ['Debet', 'Kredit'];

function BarisLaporanTabel({ judul, baris, total, nadaTotal }: { judul: string; baris: { label: string; kodeAkun: string; nilai: number }[]; total: number; nadaTotal?: boolean }) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 border-b border-slate-200">{judul}</div>
      <table className={tabelKelas}>
        <tbody className="divide-y divide-slate-100">
          {baris.map((b) => (
            <tr key={b.kodeAkun} className="hover:bg-slate-50">
              <td className={`${selKelas} font-mono text-2xs text-slate-500`}>{b.kodeAkun}</td>
              <td className={`${selKelas} text-slate-800`}>{b.label}</td>
              <td className={`${selKelas} text-right font-semibold ${b.nilai < 0 ? 'text-rose-700' : 'text-slate-900'}`}>{formatRupiah(b.nilai)}</td>
            </tr>
          ))}
          {baris.length === 0 && (
            <tr>
              <td colSpan={3} className={`${selKelas} text-center text-slate-400`}>
                Tidak ada saldo pada bagian ini.
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className={`border-t border-slate-200 ${nadaTotal ? 'bg-emerald-50' : 'bg-slate-50'}`}>
            <td />
            <td className={`${selKelas} font-bold text-slate-800`}>Jumlah</td>
            <td className={`${selKelas} text-right font-bold ${nadaTotal ? 'text-emerald-800' : 'text-slate-900'}`}>{formatRupiah(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default function LaporanTab({ dariAcuan }: { dariAcuan: Date }) {
  const isoAcuan = dariAcuan.toISOString().slice(0, 10);
  const [filterTipe, setFilterTipe] = useState<'Semua' | TipeAkun>('Semua');
  const [kataKunci, setKataKunci] = useState('');
  const [dari, setDari] = useState(`${isoAcuan.slice(0, 4)}-01-01`);
  const [sampai, setSampai] = useState(isoAcuan);
  const [modalAkun, setModalAkun] = useState(false);
  const [pesan, setPesan] = useState<{ tipe: 'sukses' | 'galat'; teks: string } | null>(null);
  const [baru, setBaru] = useState<Partial<AkunCoA>>({ tipe: 'Beban', kelompokLaporan: 'Beban Operasional', saldoNormal: 'Debet', aktif: true });

  const akun = useMemo(() => db.getCoA(), []);
  const jurnal = useMemo(() => db.getJurnalKeuangan(), []);

  const neraca = useMemo(
    () => susunNeraca({ daftarJurnal: jurnal, daftarAkun: akun, sampai: isoAcuan }),
    [jurnal, akun, isoAcuan]
  );
  const labaRugi = useMemo(
    () => susunLabaRugi({ daftarJurnal: jurnal, daftarAkun: akun, dari, sampai }),
    [jurnal, akun, dari, sampai]
  );

  const tersaring = useMemo(() => {
    const kueri = kataKunci.trim().toLowerCase();
    return akun
      .filter((a) => (filterTipe === 'Semua' ? true : a.tipe === filterTipe))
      .filter(
        (a) =>
          !kueri ||
          a.kode.toLowerCase().includes(kueri) ||
          a.nama.toLowerCase().includes(kueri) ||
          (a.catatanRegulasi ?? '').toLowerCase().includes(kueri)
      )
      .sort((a, b) => a.kode.localeCompare(b.kode));
  }, [akun, filterTipe, kataKunci]);

  const simpanAkun = (e: React.FormEvent) => {
    e.preventDefault();
    const lengkap: AkunCoA = {
      kode: (baru.kode ?? '').trim(),
      nama: (baru.nama ?? '').trim(),
      tipe: (baru.tipe ?? 'Beban') as TipeAkun,
      kelompokLaporan: (baru.kelompokLaporan ?? 'Beban Operasional') as KelompokLaporan,
      saldoNormal: (baru.saldoNormal ?? 'Debet') as AkunCoA['saldoNormal'],
      aktif: baru.aktif ?? true,
      catatanRegulasi: baru.catatanRegulasi?.trim() || undefined
    };
    if (!lengkap.kode || !lengkap.nama) {
      setPesan({ tipe: 'galat', teks: 'Kode dan nama akun wajib diisi.' });
      return;
    }
    const hasil = db.tambahAkunCoA(lengkap);
    if (!hasil.berhasil) {
      setPesan({ tipe: 'galat', teks: `${hasil.alasan} — akun lama tidak ditimpa agar jurnal yang sudah tersimpan tidak berubah makna.` });
      return;
    }
    setModalAkun(false);
    setBaru({ tipe: 'Beban', kelompokLaporan: 'Beban Operasional', saldoNormal: 'Debet', aktif: true });
    setPesan({ tipe: 'sukses', teks: `Akun ${lengkap.kode} ${lengkap.nama} ditambahkan. Jurnal yang sudah Posted tidak berubah.` });
  };

  return (
    <div className="space-y-4">
      {pesan && <div className={pesanClass(pesan.tipe)}>{pesan.teks}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <Stat label="Total Aset" value={formatRupiah(neraca.totalAset)} hint={`Per ${isoAcuan}; akun kontra mengurangi, bukan menambah.`} tone="blue" />
        <Stat label="Total Kewajiban + Ekuitas" value={formatRupiah(neraca.totalKewajiban + neraca.totalEkuitas)} hint={`Ekuitas ${formatRupiah(neraca.totalEkuitas)} sudah termasuk laba periode berjalan.`} tone="slate" />
        <Stat
          label="Balance"
          value={neraca.seimbang ? 'SEIMBANG' : `SELISIH ${formatRupiah(neraca.totalAset - (neraca.totalKewajiban + neraca.totalEkuitas))}`}
          hint={neraca.catatan.length ? neraca.catatan.join(' · ') : 'Setiap jurnal Posted lolos uji debet = kredit sebelum masuk buku besar.'}
          tone={neraca.seimbang ? 'emerald' : 'rose'}
        />
      </div>

      <Panel
        judul="Neraca"
        keterangan="Disusun dari saldo akun Posted. Laba periode berjalan masuk Ekuitas secara virtual karena jurnal penutup belum dijalankan — ini bukan angka tutup buku."
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <BarisLaporanTabel judul="ASET" baris={neraca.aset} total={neraca.totalAset} />
          <BarisLaporanTabel judul="KEWAJIBAN" baris={neraca.kewajiban} total={neraca.totalKewajiban} />
          <BarisLaporanTabel judul="EKUITAS" baris={neraca.ekuitas.concat([{ kelompok: 'Ekuitas', label: 'Laba (Rugi) Periode Berjalan', nilai: neraca.labaPeriodeBerjalan, kodeAkun: '—virtual' }])} total={neraca.totalEkuitas} nadaTotal />
        </div>
        {neraca.catatan.length > 0 && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            {neraca.catatan.map((c) => (
              <div key={c}>{c}</div>
            ))}
          </div>
        )}
      </Panel>

      <Panel
        judul="Laba Rugi"
        keterangan="HPP hanya muncul bila pengiriman diakui; selama surat jalan belum Terkirim, margin kotor terlihat terlalu tinggi dan itu tercatat sebagai penyimpangan di Dasbor."
        aksi={
          <div className="flex items-end gap-2">
            <div>
              <label className={labelClass}>Dari</label>
              <input type="date" value={dari} onChange={(e) => setDari(e.target.value)} className="px-2 py-1.5 border border-slate-300 rounded-lg text-xs" />
            </div>
            <div>
              <label className={labelClass}>Sampai</label>
              <input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} className="px-2 py-1.5 border border-slate-300 rounded-lg text-xs" />
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <BarisLaporanTabel judul="PENDAPATAN" baris={labaRugi.pendapatan} total={labaRugi.totalPendapatan} nadaTotal />
          <BarisLaporanTabel judul="HARGA POKOK PENJUALAN" baris={labaRugi.hpp} total={labaRugi.totalHpp} />
          <BarisLaporanTabel judul="BEBAN OPERASIONAL & LAIN-LAIN" baris={labaRugi.beban} total={labaRugi.totalBeban} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="text-2xs text-slate-500">Laba Kotor</div>
            <div className="font-bold">{formatRupiah(labaRugi.labaKotor)}</div>
            <div className="text-2xs text-slate-500 mt-0.5">margin {formatPersen(labaRugi.marginKotorPersen, 1)}</div>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="text-2xs text-slate-500">Beban Periode</div>
            <div className="font-bold">{formatRupiah(labaRugi.totalBeban)}</div>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="text-2xs text-slate-500">Laba Usaha</div>
            <div className={`font-bold ${labaRugi.labaUsaha < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{formatRupiah(labaRugi.labaUsaha)}</div>
            <div className="text-2xs text-slate-500 mt-0.5">margin {formatPersen(labaRugi.marginUsahaPersen, 1)}</div>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="text-2xs text-slate-500">Baris Tanpa Pusat Biaya</div>
            <div className="font-bold">{formatRupiah(labaRugi.segmenTanpaLabel)}</div>
            <div className="text-2xs text-slate-500 mt-0.5">tidak teralokasi ke segmen</div>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
            <Scale className="w-3.5 h-3.5" /> Per Pusat Biaya (segmen)
          </div>
          <table className={tabelKelas}>
            <thead>
              <tr className={kepalaTabelKelas}>
                <th className={selKelas}>Pusat Biaya</th>
                <th className={`${selKelas} text-right`}>Pendapatan</th>
                <th className={`${selKelas} text-right`}>HPP</th>
                <th className={`${selKelas} text-right`}>Laba Kotor</th>
                <th className={`${selKelas} text-right`}>Beban Operasional</th>
                <th className={`${selKelas} text-right`}>Laba Usaha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {labaRugi.perSegmen.map((s) => (
                <tr key={s.pusatBiaya} className="hover:bg-slate-50">
                  <td className={`${selKelas} font-semibold text-slate-900`}>
                    {s.pusatBiaya} — {NAMA_PUSAT_BIAYA[s.pusatBiaya]}
                  </td>
                  <td className={`${selKelas} text-right`}>{formatRupiah(s.pendapatan)}</td>
                  <td className={`${selKelas} text-right`}>{formatRupiah(s.hpp)}</td>
                  <td className={`${selKelas} text-right font-semibold`}>{formatRupiah(s.labaKotor)}</td>
                  <td className={`${selKelas} text-right`}>{formatRupiah(s.bebanOperasional)}</td>
                  <td className={`${selKelas} text-right font-bold ${s.labaUsaha < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{formatRupiah(s.labaUsaha)}</td>
                </tr>
              ))}
              {labaRugi.perSegmen.length === 0 && (
                <tr>
                  <td colSpan={6} className={`${selKelas} text-center text-slate-500`}>
                    Belum ada jurnal Posted berlabel pusat biaya pada rentang ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        judul="Chart of Accounts"
        keterangan="Saldo normal menentukan cara halaman buku besar membaca baris; hakikat akun menentukan tanda pada laporan. Keduanya sengaja terpisah supaya akun kontra tidak salah jumlah."
        aksi={
          <button type="button" onClick={() => setModalAkun(true)} className={tombolPrimer}>
            <Plus className="w-4 h-4" />
            Tambah Akun
          </button>
        }
      >
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {(['Semua', ...TIPE_AKUN] as const).map((t) => (
            <button key={t} type="button" onClick={() => setFilterTipe(t)} className={chipFilter(filterTipe === t)}>
              {t}
            </button>
          ))}
          <input
            type="text"
            value={kataKunci}
            onChange={(e) => setKataKunci(e.target.value)}
            placeholder="Cari kode, nama, atau catatan regulasi..."
            className="ml-auto max-w-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
          />
        </div>
        <div className="overflow-x-auto">
          <table className={tabelKelas}>
            <thead>
              <tr className={kepalaTabelKelas}>
                <th className={selKelas}>Kode</th>
                <th className={selKelas}>Nama Akun</th>
                <th className={selKelas}>Tipe</th>
                <th className={selKelas}>Baris Laporan</th>
                <th className={selKelas}>Saldo Normal</th>
                <th className={selKelas}>Status</th>
                <th className={selKelas}>Dasar Regulasi / Kebijakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tersaring.map((a) => (
                <tr key={a.kode} className="hover:bg-slate-50">
                  <td className={`${selKelas} font-mono font-bold text-blue-800`}>{a.kode}</td>
                  <td className={`${selKelas} font-semibold text-slate-900`}>{a.nama}</td>
                  <td className={selKelas}>
                    <Badge tone={a.tipe === 'Aset' ? 'blue' : a.tipe === 'Kewajiban' ? 'amber' : a.tipe === 'Ekuitas' ? 'slate' : a.tipe === 'Pendapatan' ? 'emerald' : 'rose'}>
                      {a.tipe}
                    </Badge>
                  </td>
                  <td className={`${selKelas} text-slate-600`}>{a.kelompokLaporan}</td>
                  <td className={`${selKelas} font-mono text-2xs`}>{a.saldoNormal}</td>
                  <td className={selKelas}>
                    <Badge tone={a.aktif ? 'emerald' : 'slate'}>{a.aktif ? 'Aktif' : 'Nonaktif'}</Badge>
                  </td>
                  <td className={`${selKelas} text-2xs text-slate-500 leading-relaxed`}>{a.catatanRegulasi ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {modalAkun && (
        <Modal judul="Tambah Akun Chart of Accounts" keterangan="Akun lama tidak diedit — kode yang sudah dipakai jurnal tidak boleh berubah makna." onClose={() => setModalAkun(false)}>
          <form onSubmit={simpanAkun} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Kode Akun</label>
                <input type="text" value={baru.kode ?? ''} onChange={(e) => setBaru({ ...baru, kode: e.target.value })} placeholder="5240" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Saldo Normal</label>
                <select value={baru.saldoNormal} onChange={(e) => setBaru({ ...baru, saldoNormal: e.target.value as AkunCoA['saldoNormal'] })} className={`${inputClass} bg-white`}>
                  {SALDO_NORMAL.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Nama Akun</label>
              <input type="text" value={baru.nama ?? ''} onChange={(e) => setBaru({ ...baru, nama: e.target.value })} placeholder="Contoh: Biaya Penyusutan Armada" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Tipe</label>
                <select
                  value={baru.tipe}
                  onChange={(e) => {
                    const tipe = e.target.value as TipeAkun;
                    setBaru({ ...baru, tipe, kelompokLaporan: KELOMPOK_PER_TIPE[tipe][0] });
                  }}
                  className={`${inputClass} bg-white`}
                >
                  {TIPE_AKUN.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Baris Laporan</label>
                <select
                  value={baru.kelompokLaporan}
                  onChange={(e) => setBaru({ ...baru, kelompokLaporan: e.target.value as KelompokLaporan })}
                  className={`${inputClass} bg-white`}
                >
                  {KELOMPOK_PER_TIPE[(baru.tipe ?? 'Beban') as TipeAkun].map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Dasar Regulasi / Kebijakan (opsional)</label>
              <input
                type="text"
                value={baru.catatanRegulasi ?? ''}
                onChange={(e) => setBaru({ ...baru, catatanRegulasi: e.target.value })}
                placeholder="Contoh: PSAK 14 — biaya tidak terkapitalisasi"
                className={inputClass}
              />
            </div>
            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button type="button" onClick={() => setModalAkun(false)} className={tombolSekunder}>
                Batal
              </button>
              <button type="submit" className={tombolPrimer}>
                Simpan Akun
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
