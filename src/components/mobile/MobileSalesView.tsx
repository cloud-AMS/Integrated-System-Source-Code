import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  Gavel,
  PackageSearch,
  Plus,
  Search,
  ShoppingCart,
  X
} from 'lucide-react';
import { db } from '../../services/pocketbase';
import type {
  IzinEdarAlkes,
  PelangganB2B,
  PengetahuanProdukAlkes,
  PenjualanAlkes,
  PraOrderMedRep,
  SkemaHargaAlkes,
  StokGudang,
  TenderAlkes
} from '../../types';
import {
  alokasikanFEFO,
  selisihHari,
  statusLimitKredit,
  validasiNomorIzinEdar
} from '../../utils/sales';
import { formatRupiah, formatTanggal } from '../ui';

export type SalesSubTab = 'order' | 'tender' | 'katalog';

interface MobileSalesViewProps {
  salesName: string;
  canManageOrders: boolean;
  pelangganList: PelangganB2B[];
  praOrderList: PraOrderMedRep[];
  penjualanList: PenjualanAlkes[];
  tenderList: TenderAlkes[];
  produkList: PengetahuanProdukAlkes[];
  izinEdarList: IzinEdarAlkes[];
  stokList: StokGudang[];
  skemaHargaList: SkemaHargaAlkes[];
  initialSubTab?: SalesSubTab;
  onRefresh: () => void;
}

export const MobileSalesView: React.FC<MobileSalesViewProps> = ({
  salesName,
  canManageOrders,
  pelangganList,
  praOrderList,
  penjualanList,
  tenderList,
  produkList,
  izinEdarList,
  stokList,
  skemaHargaList,
  initialSubTab = 'order',
  onRefresh
}) => {
  const [subTab, setSubTab] = useState<SalesSubTab>(initialSubTab);
  const [cari, setCari] = useState('');
  const [modeOrder, setModeOrder] = useState<'praorder' | 'so'>('praorder');
  const [filterSumberTender, setFilterSumberTender] = useState<
    'Semua' | TenderAlkes['sumber']
  >('Semua');
  const [umpanBalik, setUmpanBalik] = useState<{ ok: boolean; teks: string } | null>(null);

  // Modal Pre-Order Baru
  const [modalPreOrder, setModalPreOrder] = useState(false);
  const [poPelangganId, setPoPelangganId] = useState(pelangganList[0]?.id || 'PLG-001');
  const [poProdukIdx, setPoProdukIdx] = useState(0);
  const [poJumlah, setPoJumlah] = useState('2');
  const [poHargaCustom, setPoHargaCustom] = useState('');

  // Modal Detail Tender & Produk
  const [tenderDipilih, setTenderDipilih] = useState<TenderAlkes | null>(null);
  const [produkDipilih, setProdukDipilih] = useState<PengetahuanProdukAlkes | null>(null);

  const hitungStokTersedia = (namaAlkes: string): number => {
    const kunci = namaAlkes.toLowerCase();
    return stokList
      .filter((s) => {
        const nama = s.namaAlkes.toLowerCase();
        const cocok = nama.includes(kunci) || kunci.includes(nama);
        const tidakTerkunci =
          s.statusStok !== 'QUARANTINE' &&
          s.statusStok !== 'DAMAGED' &&
          s.statusStok !== 'EXPIRED_LOCK' &&
          s.statusFEFO !== 'Kedaluwarsa';
        return cocok && tidakTerkunci;
      })
      .reduce((acc, s) => acc + Math.max(s.jumlahStok - (s.qtyDipesan ?? 0), 0), 0);
  };

  const cariHargaDasarProduk = (namaAlkes: string): number => {
    const skema = skemaHargaList.find(
      (h) =>
        h.status === 'Aktif' &&
        (h.namaAlkes.toLowerCase().includes(namaAlkes.toLowerCase()) ||
          namaAlkes.toLowerCase().includes(h.namaAlkes.toLowerCase()))
    );
    return skema?.hargaDasar ?? 45000000;
  };

  const produkTerpilihForm = produkList[poProdukIdx] || produkList[0];
  const hargaSatuanEfektif = Number(
    poHargaCustom || (produkTerpilihForm ? cariHargaDasarProduk(produkTerpilihForm.namaAlkes) : 0)
  );
  const jumlahOrderInt = Math.max(Number(poJumlah) || 1, 1);
  const totalEstimasiOrder = hargaSatuanEfektif * jumlahOrderInt;

  const pelangganDipilihForm = pelangganList.find((p) => p.id === poPelangganId);
  const statusKreditForm = pelangganDipilihForm
    ? statusLimitKredit(pelangganDipilihForm, totalEstimasiOrder)
    : null;
  const statusNieForm = produkTerpilihForm
    ? validasiNomorIzinEdar(produkTerpilihForm.nomorIzinEdar, izinEdarList)
    : null;

  const simpanPreOrderBaru = (e: React.FormEvent) => {
    e.preventDefault();
    if (!produkTerpilihForm || !pelangganDipilihForm) {
      setUmpanBalik({ ok: false, teks: 'Pelanggan dan produk wajib dipilih.' });
      return;
    }

    const fefo = alokasikanFEFO(stokList, produkTerpilihForm.namaAlkes, jumlahOrderInt);
    const nomorBatch = fefo.usulan[0]?.nomorBatch || 'BATCH-PREORDER';
    const hariIni = new Date().toISOString().split('T')[0];

    const baru: PraOrderMedRep = {
      id: `PRA-${Date.now()}`,
      nomorPraOrder: `PO-MOB-${new Date().getFullYear()}-${String(praOrderList.length + 31).padStart(3, '0')}`,
      pelangganId: pelangganDipilihForm.id,
      medRep: salesName,
      tanggal: hariIni,
      item: [
        {
          namaAlkes: `${produkTerpilihForm.namaAlkes} (${produkTerpilihForm.tipeModel})`,
          nomorBatch,
          jumlah: jumlahOrderInt,
          hargaSatuan: hargaSatuanEfektif
        }
      ],
      statusPraOrder: 'Terkirim ke Gudang'
    };

    db.addPraOrder(baru);
    setModalPreOrder(false);
    setPoHargaCustom('');
    setUmpanBalik({
      ok: true,
      teks: `Pre-order ${baru.nomorPraOrder} (${formatRupiah(totalEstimasiOrder)}) terkirim untuk verifikasi gudang.`
    });
    onRefresh();
  };

  const konversiKeSO = (pra: PraOrderMedRep) => {
    const namaItem = pra.item[0]?.namaAlkes || '';
    const fefo = alokasikanFEFO(stokList, namaItem, pra.item[0]?.jumlah || 1);
    const batch = fefo.usulan[0]?.nomorBatch || pra.item[0]?.nomorBatch || 'LOT-FEFO-AUTO';
    const hasil = db.konversiPraOrderKeSalesOrder(
      pra.id,
      'Pembelian Langsung RS Swasta',
      batch
    );
    if (!hasil) {
      setUmpanBalik({ ok: false, teks: 'Gagal mengonversi pra-order ke Sales Order.' });
      return;
    }
    setUmpanBalik({
      ok: true,
      teks: `Berhasil dikonversi menjadi Sales Order ${hasil.nomorPesanan}.`
    });
    onRefresh();
  };

  const ubahStatusTender = (id: string, statusBaru: TenderAlkes['statusTender']) => {
    const next = tenderList.map((t) => (t.id === id ? { ...t, statusTender: statusBaru } : t));
    db.saveTender(next);
    db.logAudit(
      'Sales & Marketing — Tender',
      `Pembaruan status tender/LKPP menjadi "${statusBaru}" dari aplikasi mobile`,
      id,
      salesName,
      'Sales / MedRep'
    );
    if (tenderDipilih && tenderDipilih.id === id) {
      setTenderDipilih({ ...tenderDipilih, statusTender: statusBaru });
    }
    setUmpanBalik({ ok: true, teks: `Status tender diperbarui menjadi "${statusBaru}".` });
    onRefresh();
  };

  const praOrderTersaring = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return praOrderList.filter((p) => {
      if (!q) return true;
      const plg = pelangganList.find((c) => c.id === p.pelangganId);
      return (
        p.nomorPraOrder.toLowerCase().includes(q) ||
        p.medRep.toLowerCase().includes(q) ||
        (plg?.namaInstalasi || '').toLowerCase().includes(q) ||
        p.item.some((i) => i.namaAlkes.toLowerCase().includes(q))
      );
    });
  }, [praOrderList, pelangganList, cari]);

  const penjualanTersaring = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return penjualanList.filter((so) => {
      if (!q) return true;
      return (
        so.nomorPesanan.toLowerCase().includes(q) ||
        so.fasyankes.toLowerCase().includes(q) ||
        so.namaAlkes.toLowerCase().includes(q) ||
        so.jalurPenjualan.toLowerCase().includes(q)
      );
    });
  }, [penjualanList, cari]);

  const tenderTersaring = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return tenderList.filter((t) => {
      if (filterSumberTender !== 'Semua' && t.sumber !== filterSumberTender) return false;
      if (!q) return true;
      return (
        t.namaPengadaan.toLowerCase().includes(q) ||
        t.nomorPengumuman.toLowerCase().includes(q) ||
        t.instansiPembuat.toLowerCase().includes(q) ||
        t.produkDitawarkan.toLowerCase().includes(q)
      );
    });
  }, [tenderList, cari, filterSumberTender]);

  const produkTersaring = useMemo(() => {
    const q = cari.trim().toLowerCase();
    if (!q) return produkList;
    return produkList.filter(
      (p) =>
        p.namaAlkes.toLowerCase().includes(q) ||
        p.tipeModel.toLowerCase().includes(q) ||
        p.nomorIzinEdar.toLowerCase().includes(q) ||
        p.kategori.toLowerCase().includes(q)
    );
  }, [produkList, cari]);

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-200/70 p-1">
        {(
          [
            { id: 'order', label: `Order (${praOrderList.length + penjualanList.length})` },
            { id: 'tender', label: `e-Katalog LKPP (${tenderList.length})` },
            { id: 'katalog', label: `Katalog (${produkList.length})` }
          ] as { id: SalesSubTab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setSubTab(tab.id);
              setUmpanBalik(null);
            }}
            className={`min-h-[44px] rounded-lg px-2 text-xs font-bold transition cursor-pointer ${
              subTab === tab.id
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Primary CTA */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder={
              subTab === 'order'
                ? 'Cari nomor PO/SO, fasyankes, atau alkes…'
                : subTab === 'tender'
                  ? 'Cari paket e-Katalog LKPP / LPSE / instansi…'
                  : 'Cari produk alkes, model, atau nomor AKD/AKL…'
            }
            className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-xs focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none"
          />
        </div>
        {subTab === 'order' && canManageOrders && (
          <button
            type="button"
            onClick={() => setModalPreOrder(true)}
            className="min-h-[44px] rounded-xl bg-teal-600 px-4 text-xs font-bold text-white inline-flex items-center justify-center gap-1.5 hover:bg-teal-700 transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Buat Pre-Order
          </button>
        )}
      </div>

      {umpanBalik && (
        <div
          className={`rounded-xl border px-3.5 py-2.5 text-xs flex items-start gap-2 ${
            umpanBalik.ok
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-rose-200 bg-rose-50 text-rose-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{umpanBalik.teks}</span>
        </div>
      )}

      {/* TAB 1: ORDER PENJUALAN & PRE-ORDER */}
      {subTab === 'order' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setModeOrder('praorder')}
              className={`min-h-[40px] rounded-full px-3.5 text-xs font-bold border transition cursor-pointer ${
                modeOrder === 'praorder'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              Pre-Order Lapangan ({praOrderTersaring.length})
            </button>
            <button
              type="button"
              onClick={() => setModeOrder('so')}
              className={`min-h-[40px] rounded-full px-3.5 text-xs font-bold border transition cursor-pointer ${
                modeOrder === 'so'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              Sales Order Resmi ({penjualanTersaring.length})
            </button>
          </div>

          {modeOrder === 'praorder' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {praOrderTersaring.map((po) => {
                const pelanggan = pelangganList.find((c) => c.id === po.pelangganId);
                const nilai = po.item.reduce((acc, i) => acc + i.jumlah * i.hargaSatuan, 0);
                return (
                  <article
                    key={po.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-2xs font-mono text-slate-500">
                          {po.nomorPraOrder} · {formatTanggal(po.tanggal)}
                        </p>
                        <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                          {pelanggan?.namaInstalasi || po.pelangganId}
                        </h3>
                        <p className="text-2xs text-slate-500">Sales: {po.medRep}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-md border px-2 py-0.5 text-2xs font-bold ${
                          po.statusPraOrder === 'Konversi Sales Order'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : po.statusPraOrder === 'Ditolak'
                              ? 'border-rose-200 bg-rose-50 text-rose-800'
                              : 'border-amber-200 bg-amber-50 text-amber-800'
                        }`}
                      >
                        {po.statusPraOrder}
                      </span>
                    </div>

                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1 text-xs">
                      {po.item.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-800 truncate">
                            {it.namaAlkes} × {it.jumlah}
                          </span>
                          <span className="font-bold text-slate-900 tabular-nums shrink-0">
                            {formatRupiah(it.jumlah * it.hargaSatuan)}
                          </span>
                        </div>
                      ))}
                      <p className="text-2xs text-slate-500 pt-1 border-t border-slate-200 flex justify-between">
                        <span>Total Nilai Pre-Order</span>
                        <strong className="text-slate-900 tabular-nums">{formatRupiah(nilai)}</strong>
                      </p>
                    </div>

                    {canManageOrders && po.statusPraOrder === 'Terkirim ke Gudang' && (
                      <button
                        type="button"
                        onClick={() => konversiKeSO(po)}
                        className="w-full min-h-[44px] rounded-xl border border-teal-200 bg-teal-50 text-xs font-bold text-teal-800 inline-flex items-center justify-center gap-1.5 hover:bg-teal-100 transition cursor-pointer"
                      >
                        <FileCheck2 className="w-4 h-4" />
                        Konversi ke Sales Order Resmi (FEFO)
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {modeOrder === 'so' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {penjualanTersaring.map((so) => (
                <article
                  key={so.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-2xs font-mono text-slate-500">
                        {so.nomorPesanan} · {so.jalurPenjualan}
                      </p>
                      <h3 className="text-sm font-bold text-slate-900 mt-0.5 truncate">
                        {so.fasyankes}
                      </h3>
                    </div>
                    <span
                      className={`shrink-0 rounded-md border px-2 py-0.5 text-2xs font-bold ${
                        so.statusKirim === 'Terkirim' || so.statusKirim === 'Diterima Fasyankes'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : so.statusKirim === 'Dibatalkan'
                            ? 'border-rose-200 bg-rose-50 text-rose-800'
                            : 'border-sky-200 bg-sky-50 text-sky-800'
                      }`}
                    >
                      {so.statusKirim}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-teal-800">
                    {so.namaAlkes} · {so.jumlah} {so.satuan} (Batch {so.nomorBatch})
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">{formatTanggal(so.tanggalPesanan)}</span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {formatRupiah(so.totalHarga)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TENDER & E-KATALOG LKPP */}
      {subTab === 'tender' && (
        <div className="space-y-3">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {(['Semua', 'e-Katalog LKPP', 'LPSE', 'E-Purchasing', 'Tender Mandiri RS'] as const).map(
              (src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setFilterSumberTender(src)}
                  className={`min-h-[38px] shrink-0 rounded-full px-3 text-2xs font-bold border transition cursor-pointer ${
                    filterSumberTender === src
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {src}
                </button>
              )
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tenderTersaring.map((t) => {
              const sisaHari = selisihHari(t.batasAkhirPengajuan);
              const validNie = validasiNomorIzinEdar(t.nomorIzinEdarDipersyaratkan, izinEdarList);
              return (
                <article
                  key={t.id}
                  onClick={() => setTenderDipilih(t)}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-2.5 cursor-pointer hover:border-teal-300 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-2xs font-mono text-slate-500">
                        {t.sumber} · {t.nomorPengumuman}
                      </p>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug mt-0.5">
                        {t.namaPengadaan}
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {t.instansiPembuat} · {t.provinsi}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-md border px-2 py-0.5 text-2xs font-bold ${
                        t.statusTender === 'Dimenangkan'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : t.statusTender === 'Kalah' || t.statusTender === 'Sudah Tutup'
                            ? 'border-slate-200 bg-slate-100 text-slate-600'
                            : t.statusTender === 'Hampir Tutup'
                              ? 'border-rose-200 bg-rose-50 text-rose-800'
                              : 'border-sky-200 bg-sky-50 text-sky-800'
                      }`}
                    >
                      {t.statusTender}
                    </span>
                  </div>

                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between gap-2 text-xs">
                    <div>
                      <p className="text-2xs text-slate-500">Nilai HPS Paket</p>
                      <p className="font-bold text-slate-900 tabular-nums">
                        {formatRupiah(t.nilaiHps)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xs text-slate-500">Batas Akhir</p>
                      <p
                        className={`font-bold ${
                          sisaHari < 0
                            ? 'text-slate-500'
                            : sisaHari <= 5
                              ? 'text-rose-700'
                              : 'text-slate-900'
                        }`}
                      >
                        {formatTanggal(t.batasAkhirPengajuan)}
                        {sisaHari >= 0 ? ` (${sisaHari} hr)` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-2xs">
                    <span className="text-slate-600 truncate">Alkes: {t.produkDitawarkan}</span>
                    <span
                      className={`shrink-0 font-bold ${
                        validNie.status === 'Lolos' ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      NIE {validNie.status}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: KATALOG PRODUK ALKES */}
      {subTab === 'katalog' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {produkTersaring.map((p) => {
            const stok = hitungStokTersedia(p.namaAlkes);
            const harga = cariHargaDasarProduk(p.namaAlkes);
            const nieStatus = validasiNomorIzinEdar(p.nomorIzinEdar, izinEdarList);
            return (
              <article
                key={p.id}
                onClick={() => setProdukDipilih(p)}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3 cursor-pointer hover:border-teal-300 transition flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-2xs font-bold uppercase tracking-wider text-teal-700">
                        {p.kategori}
                      </p>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug mt-0.5">
                        {p.namaAlkes}
                      </h3>
                      <p className="text-2xs text-slate-500 font-mono mt-0.5">
                        Model {p.tipeModel} · {p.nomorIzinEdar}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-md border px-2 py-0.5 text-2xs font-bold ${
                        nieStatus.status === 'Lolos'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-rose-200 bg-rose-50 text-rose-800'
                      }`}
                    >
                      NIE {nieStatus.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{p.spesifikasiRingkas}</p>
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <p className="text-2xs text-slate-500">Harga Referensi</p>
                    <p className="font-bold text-slate-900 tabular-nums">{formatRupiah(harga)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xs text-slate-500">Stok Bebas FEFO</p>
                    <p
                      className={`font-bold tabular-nums ${
                        stok > 0 ? 'text-teal-700' : 'text-amber-700'
                      }`}
                    >
                      {stok} Unit
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* MODAL BUAT PRE-ORDER */}
      {modalPreOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-5 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 inline-flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-teal-700" />
                Buat Pre-Order Lapangan
              </h3>
              <button
                type="button"
                onClick={() => setModalPreOrder(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={simpanPreOrderBaru} className="space-y-3">
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Pelanggan B2B (Fasyankes)
                </label>
                <select
                  value={poPelangganId}
                  onChange={(e) => setPoPelangganId(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-xs bg-white"
                >
                  {pelangganList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.namaInstalasi}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Produk Alkes
                </label>
                <select
                  value={poProdukIdx}
                  onChange={(e) => {
                    setPoProdukIdx(Number(e.target.value));
                    setPoHargaCustom('');
                  }}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-xs bg-white"
                >
                  {produkList.map((p, idx) => (
                    <option key={p.id} value={idx}>
                      {p.namaAlkes} ({p.tipeModel})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Jumlah (Unit)
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={poJumlah}
                    onChange={(e) => setPoJumlah(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Harga Satuan (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={poHargaCustom || hargaSatuanEfektif}
                    onChange={(e) => setPoHargaCustom(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-xs"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1.5 text-2xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Validasi NIE Kemenkes</span>
                  <strong
                    className={
                      statusNieForm?.status === 'Lolos' ? 'text-emerald-700' : 'text-rose-700'
                    }
                  >
                    {statusNieForm?.status || '-'} ({produkTerpilihForm?.nomorIzinEdar})
                  </strong>
                </div>
                {statusKreditForm && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Limit Kredit Fasyankes</span>
                    <strong
                      className={
                        statusKreditForm.status === 'Diblokir'
                          ? 'text-rose-700'
                          : statusKreditForm.status === 'Perlu Persetujuan Manajemen'
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                      }
                    >
                      {statusKreditForm.status}
                    </strong>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-slate-200 text-xs">
                  <span className="font-semibold text-slate-700">Total Nilai Pre-Order</span>
                  <strong className="text-slate-900 tabular-nums">
                    {formatRupiah(totalEstimasiOrder)}
                  </strong>
                </div>
              </div>

              <button
                type="submit"
                className="w-full min-h-[48px] rounded-xl bg-teal-600 text-sm font-bold text-white hover:bg-teal-700 transition cursor-pointer"
              >
                Kirim Pre-Order ke Server AMS
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL TENDER e-KATALOG LKPP */}
      {tenderDipilih && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-5 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-2xs font-bold uppercase tracking-wider text-teal-700 inline-flex items-center gap-1">
                  <Gavel className="w-3.5 h-3.5" />
                  {tenderDipilih.sumber} · {tenderDipilih.nomorPengumuman}
                </p>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {tenderDipilih.namaPengadaan}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTenderDipilih(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-600">
                Instansi: <strong className="text-slate-900">{tenderDipilih.instansiPembuat}</strong>
              </p>
              <p className="text-slate-600">
                Nilai HPS:{' '}
                <strong className="text-slate-900 tabular-nums">
                  {formatRupiah(tenderDipilih.nilaiHps)}
                </strong>
              </p>
              <p className="text-slate-600">
                NIE Dipersyaratkan:{' '}
                <strong className="font-mono text-slate-900">
                  {tenderDipilih.nomorIzinEdarDipersyaratkan}
                </strong>
              </p>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1">
                <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                  Persyaratan Kunci Pengadaan
                </p>
                <ul className="list-disc pl-4 space-y-1 text-slate-700">
                  {tenderDipilih.persyaratanKunci.map((syarat, idx) => (
                    <li key={idx}>{syarat}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <p className="text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Perbarui Status Tender
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  ['Aktif', 'Hampir Tutup', 'Dimenangkan', 'Kalah'] as TenderAlkes['statusTender'][]
                ).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => ubahStatusTender(tenderDipilih.id, st)}
                    className={`min-h-[44px] rounded-xl text-xs font-bold border transition cursor-pointer ${
                      tenderDipilih.statusTender === st
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {tenderDipilih.tautanPengumuman && (
              <a
                href={tenderDipilih.tautanPengumuman}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[44px] rounded-xl border border-teal-200 bg-teal-50 text-xs font-bold text-teal-800 inline-flex items-center justify-center gap-1.5 hover:bg-teal-100 transition"
              >
                <ExternalLink className="w-4 h-4" />
                Buka Portal Pengumuman LKPP/LPSE
              </a>
            )}
          </div>
        </div>
      )}

      {/* MODAL DETAIL KATALOG PRODUK */}
      {produkDipilih && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-5 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-2xs font-bold uppercase tracking-wider text-teal-700 inline-flex items-center gap-1">
                  <PackageSearch className="w-3.5 h-3.5" />
                  {produkDipilih.kategori}
                </p>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {produkDipilih.namaAlkes}
                </h3>
                <p className="text-2xs text-slate-500 font-mono">
                  {produkDipilih.tipeModel} · {produkDipilih.nomorIzinEdar} (ED{' '}
                  {formatTanggal(produkDipilih.tanggalKedaluwarsaNie)})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProdukDipilih(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              {produkDipilih.spesifikasiRingkas}
            </p>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1.5 text-xs">
              <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                Keunggulan Utama (Selling Points)
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-700">
                {produkDipilih.poinJual.map((pj, idx) => (
                  <li key={idx}>{pj}</li>
                ))}
              </ul>
            </div>

            {produkDipilih.pertanyaanTeknisUmum.length > 0 && (
              <div className="space-y-2">
                <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                  FAQ Teknis User Fasyankes
                </p>
                {produkDipilih.pertanyaanTeknisUmum.map((faq, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 p-3 text-xs space-y-1"
                  >
                    <p className="font-bold text-slate-900">{faq.pertanyaan}</p>
                    <p className="text-slate-600">{faq.jawaban}</p>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                const idx = produkList.findIndex((x) => x.id === produkDipilih.id);
                if (idx >= 0) setPoProdukIdx(idx);
                setProdukDipilih(null);
                setSubTab('order');
                if (canManageOrders) setModalPreOrder(true);
              }}
              className="w-full min-h-[48px] rounded-xl bg-teal-600 text-sm font-bold text-white hover:bg-teal-700 transition cursor-pointer"
            >
              Buat Pre-Order untuk Produk Ini
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
