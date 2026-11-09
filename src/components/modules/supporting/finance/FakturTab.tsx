import { useEffect, useMemo, useState } from 'react';
import { db } from '../../../../services/pocketbase';
import type { TransaksiKeuangan } from '../../../../types';
import { gerbangPenagihanCdakb, rancangJurnalFaktur } from '../../../../utils/akuntansi';
import { Badge, Panel, chipFilter, formatRupiah } from '../../../ui';
import { type IdentitasFinance, kepalaTabelKelas, pesanClass, selKelas, tabelKelas } from './ui';
import { Search, ShieldCheck } from 'lucide-react';

const KATEGORI_FAKTUR: TransaksiKeuangan['kategori'][] = ['Pendapatan Alkes', 'Biaya Uji Kalibrasi', 'Biaya Audit ISO/CDAKB', 'Pengadaan Suku Cadang', 'Biaya Retur Mutu'];
const LABEL_KATEGORI: Record<TransaksiKeuangan['kategori'], string> = {
  'Pendapatan Alkes': 'Pendapatan Penjualan Alkes',
  'Biaya Uji Kalibrasi': 'Biaya Uji Kalibrasi (BPFK / Lab Terakreditasi)',
  'Biaya Audit ISO/CDAKB': 'Biaya Audit Sertifikasi ISO/CDAKB',
  'Pengadaan Suku Cadang': 'Pengadaan Suku Cadang Resmi',
  'Biaya Retur Mutu': 'Biaya Penanganan Retur Mutu'
};

/** Gerbang CDAKB per faktur ditelusuri lewat surat jalan yang memakai nomor faktur yang sama;
 *  tanpa tautan itu tidak ada batch yang bisa diperiksa, dan itu dilaporkan, tidak dilewati. */
function periksaGerbangFaktur(faktur: string, dari: Date) {
  const suratJalan = db.getSuratJalan().filter((s) => s.nomorFaktur === faktur);
  if (!suratJalan.length) return { terkait: false as const, hasil: [] as { nomorBatch: string; bolehDitagih: boolean; sebab: string[] }[] };
  const stok = db.getStokGudang();
  const recall = db.getPenarikanProduk();
  const izinEdar = db.getIzinEdar();
  const pelanggan = db.getPelangganB2B();
  const hasil = suratJalan.flatMap((s) =>
    [...new Set(s.rute.map((r) => r.nomorBatch))].map((nomorBatch) => {
      const kartu = stok.find((k) => k.nomorBatch === nomorBatch);
      const gerbang = gerbangPenagihanCdakb({
        nomorBatch,
        nomorIzinEdar: kartu?.nomorIzinEdar ?? '',
        daftarStok: stok,
        daftarRecall: recall,
        daftarIzinEdar: izinEdar,
        pelanggan: pelanggan.find((p) => p.namaInstalasi === s.fasyankesTujuan),
        dari
      });
      return { nomorBatch, bolehDitagih: gerbang.bolehDitagih, sebab: gerbang.sebab };
    })
  );
  return { terkait: true as const, hasil };
}

export default function FakturTab({
  identitas,
  dariAcuan,
  bukaForm,
  onPerubahanData
}: {
  identitas: IdentitasFinance;
  dariAcuan: Date;
  /** Naik setiap kali tombol header ditekan; tab lain tidak boleh ikut membuka modal. */
  bukaForm: number;
  onPerubahanData: () => void;
}) {
  const [transaksiList, setTransaksiList] = useState<TransaksiKeuangan[]>(db.getTransaksi());
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pesan, setPesan] = useState<{ tipe: 'sukses' | 'galat'; teks: string } | null>(null);
  const [filter, setFilter] = useState<'Semua' | 'Pendapatan' | 'Beban'>('Semua');

  // New Transaction Form
  const [formData, setFormData] = useState<Partial<TransaksiKeuangan>>({
    kategori: 'Pendapatan Alkes',
    fasyankesAtauPemasok: '',
    tanggal: new Date().toISOString().split('T')[0],
    jumlah: 50000000,
    statusPembayaran: 'Menunggu Jatuh Tempo',
    ppnStatus: 'PPN 11% Terbit Faktur Pajak'
  });

  const jurnal = useMemo(() => db.getJurnalKeuangan(), []);
  const tetapan = useMemo(() => db.getTetapanPajak(), []);
  const tarifPpn = tetapan.find((t) => t.jenis === 'PPN Keluaran' && t.statusVerifikasiPJT === 'Terverifikasi')?.tarifPersen ?? 11;

  useEffect(() => {
    if (bukaForm > 0) setIsModalOpen(true);
  }, [bukaForm]);

  const filtered = transaksiList.filter(
    (t) =>
      (filter === 'Semua' ? true : filter === 'Pendapatan' ? t.kategori === 'Pendapatan Alkes' : t.kategori !== 'Pendapatan Alkes') &&
      (t.nomorFaktur.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.fasyankesAtauPemasok.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.kategori.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const jurnalFaktur = (nomorFaktur: string) => jurnal.find((j) => j.sumberRujukan === 'FAKTUR_PENJUALAN' && j.idRujukan === nomorFaktur);

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fasyankesAtauPemasok) return;

    const newItem: TransaksiKeuangan = {
      id: 'INV-' + Date.now(),
      nomorFaktur: `INV/AMS/2024/05/${String(transaksiList.length + 101).padStart(3, '0')}`,
      kategori: formData.kategori as TransaksiKeuangan['kategori'],
      fasyankesAtauPemasok: formData.fasyankesAtauPemasok || '',
      tanggal: formData.tanggal || new Date().toISOString().split('T')[0],
      jumlah: Number(formData.jumlah) || 0,
      statusPembayaran: formData.statusPembayaran as TransaksiKeuangan['statusPembayaran'],
      ppnStatus: formData.ppnStatus as TransaksiKeuangan['ppnStatus']
    };

    db.addTransaksi(newItem);
    setTransaksiList(db.getTransaksi());

    const rancangan = rancangJurnalFaktur(newItem, {
      tarifPpnPersen: tarifPpn,
      ppnTermasukDalamNominal: false,
      petugas: identitas.pengguna,
      peran: identitas.peran,
      urutanNomor: (p) => db.getJurnalKeuangan().filter((j) => j.periode === p || j.tanggalTransaksi.startsWith(p)).length + 1
    });
    const simpan = db.tambahJurnalKeuangan(rancangan);
    setIsModalOpen(false);
    onPerubahanData();

    setPesan(
      simpan.jurnal
        ? {
            tipe: 'sukses',
            teks: `${newItem.nomorFaktur} tercatat dan draf jurnal ${simpan.jurnal.nomorJournal} tersambung ke rantai hash. Draf belum masuk laporan — posting di tab Jurnal.`,
          }
        : { tipe: 'galat', teks: `${newItem.nomorFaktur} tercatat, tetapi jurnalnya tertolak: ${simpan.penyimpangan.map((p) => p.keterangan).join(' · ')}` }
    );
  };

  const totalPendapatan = transaksiList.filter((t) => t.kategori === 'Pendapatan Alkes').reduce((acc, curr) => acc + curr.jumlah, 0);
  const totalBiayaMutu = transaksiList.filter((t) => t.kategori !== 'Pendapatan Alkes').reduce((acc, curr) => acc + curr.jumlah, 0);
  const belumTerbukukan = transaksiList.filter((t) => !jurnalFaktur(t.nomorFaktur)).length;
  const gerbangTerkait = useMemo(
    () =>
      transaksiList
        .filter((t) => t.kategori === 'Pendapatan Alkes')
        .map((t) => ({ faktur: t.nomorFaktur, ...periksaGerbangFaktur(t.nomorFaktur, dariAcuan) })),
    [transaksiList, dariAcuan]
  );
  const gerbangGagal = gerbangTerkait.flatMap((g) => g.hasil.filter((h) => !h.bolehDitagih).map((h) => ({ ...h, faktur: g.faktur })));

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-slate-500 block font-medium">Total Penerimaan Faktur Fasyankes</span>
          <div className="text-xl font-bold text-slate-900 mt-1">Rp {totalPendapatan.toLocaleString('id-ID')}</div>
          <span className="text-2xs text-emerald-700 font-semibold mt-1 block">Telah diverifikasi PPN 11%</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-slate-500 block font-medium">Alokasi Biaya Mutu & Regulasi</span>
          <div className="text-xl font-bold text-blue-700 mt-1">Rp {totalBiayaMutu.toLocaleString('id-ID')}</div>
          <span className="text-2xs text-slate-500 mt-1 block">Audit ISO 13485 & Kalibrasi BPFK</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-slate-500 block font-medium">Status Faktur Pajak</span>
          <div className={`text-xl font-bold mt-1 ${belumTerbukukan ? 'text-amber-700' : 'text-emerald-700'}`}>
            {transaksiList.length - belumTerbukukan}/{transaksiList.length} Terbukukan
          </div>
          <span className="text-2xs text-slate-500 mt-1 block">
            {belumTerbukukan
              ? `${belumTerbukukan} faktur belum punya jurnal; e-Faktur masih draf, belum dikirim ke DJP`
              : 'Seluruh faktur punya jurnal; e-Faktur tetap draf, belum dikirim ke DJP'}
          </span>
        </div>
      </div>

      {pesan && <div className={pesanClass(pesan.tipe)}>{pesan.teks}</div>}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs gap-3 flex-wrap">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nomor faktur atau pihak fasyankes..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {(['Semua', 'Pendapatan', 'Beban'] as const).map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)} className={chipFilter(filter === f)}>
                {f}
              </button>
            ))}
          </div>
          <div className="text-slate-500">
            Total Transaksi: <strong>{transaksiList.length}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className={tabelKelas}>
            <thead>
              <tr className={kepalaTabelKelas}>
                <th className={selKelas}>Nomor Faktur & Tanggal</th>
                <th className={selKelas}>Kategori Akuntansi</th>
                <th className={selKelas}>Pihak Fasyankes / Pemasok</th>
                <th className={`${selKelas} text-right`}>Jumlah Transaksi</th>
                <th className={selKelas}>Status PPN</th>
                <th className={selKelas}>Status Bayar</th>
                <th className={selKelas}>Jurnal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => {
                const j = jurnalFaktur(item.nomorFaktur);
                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className={`${selKelas} font-mono font-bold text-blue-800`}>
                      <div>{item.nomorFaktur}</div>
                      <div className="text-2xs text-slate-500 font-normal">{item.tanggal}</div>
                    </td>
                    <td className={selKelas}>
                      <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-slate-100 text-slate-800">{item.kategori}</span>
                    </td>
                    <td className={`${selKelas} font-semibold text-slate-900`}>{item.fasyankesAtauPemasok}</td>
                    <td className={`${selKelas} text-right font-bold text-slate-900`}>{formatRupiah(item.jumlah)}</td>
                    <td className={`${selKelas} text-slate-600`}>{item.ppnStatus}</td>
                    <td className={selKelas}>
                      <span
                        className={`px-2 py-0.5 rounded text-2xs font-bold ${
                          item.statusPembayaran === 'Lunas'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {item.statusPembayaran}
                      </span>
                    </td>
                    <td className={selKelas}>
                      {j ? (
                        <Badge tone={j.status === 'Posted' ? 'emerald' : j.status === 'Draft' ? 'amber' : 'slate'}>{j.nomorJournal}</Badge>
                      ) : (
                        <Badge tone="rose">TANPA JURNAL</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Panel
        judul="Gerbang Penagihan CDAKB"
        keterangan="Faktur tidak boleh ditagih bila batch-nya kedaluwarsa, dalam recall, NIE tidak sah, atau izin operasional fasyankes berakhir. Pemeriksaan berjalan per nomor batch pada surat jalan yang memakai nomor faktur yang sama."
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs mb-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-slate-500 block font-medium">Faktur dengan Surat Jalan</span>
            <div className="text-xl font-bold text-slate-900 mt-1">{gerbangTerkait.filter((g) => g.terkait).length}</div>
            <span className="text-2xs text-slate-500 mt-1 block">dari {gerbangTerkait.length} faktur pendapatan</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-slate-500 block font-medium">Batch Lolos Gerbang</span>
            <div className="text-xl font-bold text-emerald-700 mt-1">
              {gerbangTerkait.reduce((a, g) => a + g.hasil.filter((h) => h.bolehDitagih).length, 0)}
            </div>
            <span className="text-2xs text-slate-500 mt-1 block">NIE sah, izin berlaku, tidak recall, stok layak kirim</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-slate-500 block font-medium">Batch Tertolak</span>
            <div className={`text-xl font-bold mt-1 ${gerbangGagal.length ? 'text-rose-700' : 'text-emerald-700'}`}>{gerbangGagal.length}</div>
            <span className="text-2xs text-slate-500 mt-1 block">Penagihan diblokir sampai tuntas</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className={tabelKelas}>
            <thead>
              <tr className={kepalaTabelKelas}>
                <th className={selKelas}>Nomor Faktur</th>
                <th className={selKelas}>No. Batch</th>
                <th className={selKelas}>Hasil Gerbang</th>
                <th className={selKelas}>Sebab / Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {gerbangTerkait.map((g) =>
                g.terkait ? (
                  g.hasil.map((h) => (
                    <tr key={`${g.faktur}-${h.nomorBatch}`} className="hover:bg-slate-50">
                      <td className={`${selKelas} font-mono text-blue-800 whitespace-nowrap`}>{g.faktur}</td>
                      <td className={`${selKelas} font-mono font-bold`}>{h.nomorBatch}</td>
                      <td className={selKelas}>
                        <Badge tone={h.bolehDitagih ? 'emerald' : 'rose'}>
                          {h.bolehDitagih ? <><ShieldCheck className="w-3 h-3" />Boleh Tagih</> : 'DIBLOKIR'}
                        </Badge>
                      </td>
                      <td className={`${selKelas} text-2xs text-slate-600 leading-relaxed`}>{h.sebab.join(' · ') || 'Semua pemeriksaan lolos'}</td>
                    </tr>
                  ))
                ) : (
                  <tr key={g.faktur} className="hover:bg-slate-50">
                    <td className={`${selKelas} font-mono text-blue-800 whitespace-nowrap`}>{g.faktur}</td>
                    <td className={`${selKelas} text-slate-400`}>-</td>
                    <td className={selKelas}>
                      <Badge tone="slate">TIDAK TERKAIT</Badge>
                    </td>
                    <td className={`${selKelas} text-2xs text-slate-500`}>Belum ada surat jalan dengan nomor faktur ini — gerbang tidak dapat diperiksa, bukan berarti lolos.</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Modal Add Transaction */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base text-slate-900 mb-1">
              Catat Faktur Transaksi Keuangan
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Pencatatan pendapatan distribusi alkes atau biaya kepatuhan mutu ISO/CDAKB.
            </p>

            <form onSubmit={handleSaveTransaction} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kategori Transaksi</label>
                <select
                  value={formData.kategori}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value as TransaksiKeuangan['kategori'] })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {KATEGORI_FAKTUR.map((k) => (
                    <option key={k} value={k}>
                      {LABEL_KATEGORI[k]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pihak Rumah Sakit / Vendor Rekanan</label>
                <input
                  type="text"
                  required
                  value={formData.fasyankesAtauPemasok}
                  onChange={(e) => setFormData({ ...formData, fasyankesAtauPemasok: e.target.value })}
                  placeholder="Contoh: RSUD Pasar Minggu"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Transaksi</label>
                  <input
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nominal (Rp)</label>
                  <input
                    type="number"
                    min={1000}
                    required
                    value={formData.jumlah}
                    onChange={(e) => setFormData({ ...formData, jumlah: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Pajak PPN</label>
                  <select
                    value={formData.ppnStatus}
                    onChange={(e) => setFormData({ ...formData, ppnStatus: e.target.value as TransaksiKeuangan['ppnStatus'] })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="PPN 11% Terbit Faktur Pajak">PPN 11% Terbit Faktur Pajak</option>
                    <option value="Bebas PPN">Bebas PPN (Sesuai Aturan)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Pembayaran</label>
                  <select
                    value={formData.statusPembayaran}
                    onChange={(e) => setFormData({ ...formData, statusPembayaran: e.target.value as TransaksiKeuangan['statusPembayaran'] })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Lunas">Lunas</option>
                    <option value="Menunggu Jatuh Tempo">Menunggu Jatuh Tempo</option>
                    <option value="Lewat Jatuh Tempo">Lewat Jatuh Tempo</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold cursor-pointer shadow-xs transition-colors"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
