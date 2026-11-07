import { useState } from 'react';
import { 
  FileCheck, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Calculator, 
  Lock, 
  ShieldCheck, 
  DollarSign, 
  Calendar, 
  Building2, 
  ExternalLink,
  Percent,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { LPSETender, PriceLockAgreement } from '../../../../types/salesMarketing';

interface TenderModuleProps {
  tenders: LPSETender[];
  priceLocks: PriceLockAgreement[];
  onAddPriceLock: (item: PriceLockAgreement) => void;
}

export default function TenderModule({
  tenders,
  priceLocks,
  onAddPriceLock
}: TenderModuleProps) {
  const [activeTab, setActiveTab] = useState<'lpse' | 'priceLock' | 'calculator'>('lpse');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenderModal, setSelectedTenderModal] = useState<LPSETender | null>(null);

  // Margin Calculator State
  const [calcHps, setCalcHps] = useState<number>(1500000000);
  const [calcCogs, setCalcCogs] = useState<number>(850000000);
  const [calcLogistic, setCalcLogistic] = useState<number>(35000000);
  const [calcInstallation, setCalcInstallation] = useState<number>(25000000);
  const [calcCommissionRate, setCalcCommissionRate] = useState<number>(3); // %
  const [calcTargetBidDiscount, setCalcTargetBidDiscount] = useState<number>(8); // Diskon % dari HPS

  // Derived calculations
  const offeredPrice = calcHps * (1 - calcTargetBidDiscount / 100);
  const commissionCost = offeredPrice * (calcCommissionRate / 100);
  const ppn11 = offeredPrice * 0.11;
  const pph15 = offeredPrice * 0.015; // PPh pasal 22 rekanan pemerintah 1.5%
  const totalCost = calcCogs + calcLogistic + calcInstallation + commissionCost;
  const grossProfit = offeredPrice - totalCost;
  const netProfit = grossProfit - pph15;
  const marginPercent = offeredPrice > 0 ? (netProfit / offeredPrice) * 100 : 0;

  const filteredTenders = tenders.filter(t => 
    t.namaPaket.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.kodeTender.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.instansi.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Sub-tabs header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('lpse')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'lpse'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            LPSE Scraper & Alert System ({tenders.length})
          </button>

          <button
            onClick={() => setActiveTab('priceLock')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'priceLock'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            Contract & Price Lock Agreement ({priceLocks.length})
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'calculator'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Calculator className="w-4 h-4" />
            Interactive Margin Calculator
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Sinkronisasi LKPP e-Katalog V6 Aktif</span>
        </div>
      </div>

      {/* Tab 1: LPSE Scraper & Alert System */}
      {activeTab === 'lpse' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kode tender LPSE, instansi..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="text-slate-400">Filter Metode:</span>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg font-semibold text-[11px]">
                e-Katalog Mini Kompetisi & Tender Terbuka
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {filteredTenders.map(tender => (
              <div 
                key={tender.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-white font-bold">
                      {tender.kodeTender}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {tender.metodePengadaan}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {tender.instansi}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {tender.namaPaket}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400">Kategori Alkes: </span>
                      <span className="font-medium text-slate-800">{tender.kategoriAlkes}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Status Kualifikasi: </span>
                      <span className="font-semibold text-emerald-700">{tender.statusKualifikasi}</span>
                    </div>
                    <div className="flex items-center gap-1 text-rose-600 font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Sisa Waktu: {tender.sisaHari} Hari ({tender.tanggalBatas})</span>
                    </div>
                  </div>
                </div>

                {/* Right price block & action */}
                <div className="lg:border-l lg:border-slate-100 lg:pl-6 flex flex-col justify-between shrink-0 space-y-2 min-w-[220px]">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Nilai HPS Pagu Pemerintah</span>
                    <div className="text-base font-extrabold text-slate-900">
                      Rp {tender.nilaiHPS.toLocaleString('id-ID')}
                    </div>
                  </div>

                  <div className="bg-emerald-50 p-2 rounded-xl text-[11px]">
                    <span className="text-slate-500 block">Rekomendasi Bidding Aman:</span>
                    <span className="font-bold text-emerald-800">
                      Rp {tender.rekomendasiBidding.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        setCalcHps(tender.nilaiHPS);
                        setActiveTab('calculator');
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      Hitung Margin
                    </button>
                    <button
                      onClick={() => setSelectedTenderModal(tender)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Dokumen Syarat
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Contract & Pricing Agreement */}
      {activeTab === 'priceLock' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-3">
            <Lock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Proteksi Harga Jangka Panjang (Price Lock Agreement):</span>
              Mengunci harga penawaran resmi yang telah disepakati pada kontrak payung (Framework Contract) dengan Rumah Sakit atau Dinas Kesehatan untuk mencegah sengketa harga saat terjadi fluktuasi kurs mata uang atau kenaikan harga bahan baku impor.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {priceLocks.map(pl => (
              <div key={pl.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                      {pl.nomorKontrak}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{pl.namaFaskes}</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    pl.status === 'Aktif Terkunci' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {pl.status}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <div className="text-xs font-bold text-slate-800">{pl.namaAlkes}</div>
                  <div className="text-[11px] text-slate-500 font-mono">Tipe: {pl.tipeModel} • MOQ: {pl.moq.toLocaleString('id-ID')} unit</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="border border-slate-100 rounded-xl p-2.5">
                    <span className="text-[10px] text-slate-400 block">Harga Katalog Normal</span>
                    <span className="line-through text-slate-400 font-semibold">
                      Rp {pl.hargaKatalog.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="border border-emerald-100 bg-emerald-50/40 rounded-xl p-2.5">
                    <span className="text-[10px] text-emerald-800 block font-semibold">Harga Terkunci (Locked)</span>
                    <span className="font-extrabold text-emerald-700">
                      Rp {pl.hargaTerkunci.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[10px] text-emerald-600 block">Diskon: {pl.diskonPersen}%</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 pt-2 border-t border-slate-100 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Periode Perjanjian:</span>
                    <span className="font-medium text-slate-700">{pl.masaBerlakuMulai} s/d {pl.masaBerlakuSelesai}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Klausul Layanan / SLA:</span>
                    <span className="font-medium text-slate-700 text-right truncate max-w-[210px]" title={pl.klausulSLA}>
                      {pl.klausulSLA}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Interactive Margin Calculator */}
      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-600" />
                Parameter Biaya Tender & Pengadaan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Simulasi laba bersih sesuai spesifikasi logistik medis dan perpajakan faskes pemerintah
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Nilai HPS Pagu Tender (Rp)
                </label>
                <input
                  type="number"
                  value={calcHps}
                  onChange={e => setCalcHps(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Diskon Bidding dari HPS (%)
                  </label>
                  <input
                    type="number"
                    value={calcTargetBidDiscount}
                    onChange={e => setCalcTargetBidDiscount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Nilai Tawaran: Rp {(offeredPrice / 1_000_000).toLocaleString('id-ID')} Jt
                  </span>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    COGS / HPP Alkes (Pabrik / Impor)
                  </label>
                  <input
                    type="number"
                    value={calcCogs}
                    onChange={e => setCalcCogs(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Biaya Logistik & Cold Chain (Rp)
                  </label>
                  <input
                    type="number"
                    value={calcLogistic}
                    onChange={e => setCalcLogistic(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Armada berpendingin / fragile</span>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Biaya Instalasi & Uji Fungsi BAST
                  </label>
                  <input
                    type="number"
                    value={calcInstallation}
                    onChange={e => setCalcInstallation(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Fee teknisi bersertifikat</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Komisi MedRep / Agen Penjual (%)
                </label>
                <input
                  type="number"
                  value={calcCommissionRate}
                  onChange={e => setCalcCommissionRate(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Nilai Komisi: Rp {(commissionCost / 1_000_000).toLocaleString('id-ID')} Jt
                </span>
              </div>
            </div>
          </div>

          {/* Result Card */}
          <div className="lg:col-span-6 bg-slate-900 text-white p-6 rounded-2xl flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Hasil Kalkulasi Profitabilitas</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  marginPercent >= 20 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  Margin {marginPercent.toFixed(1)}% ({marginPercent >= 20 ? 'Sehat' : 'Ketat'})
                </span>
              </div>

              <div className="space-y-3 mt-4 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Harga Penawaran Resmi (Offered Price):</span>
                  <span className="font-mono font-bold text-white">Rp {offeredPrice.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>- Biaya Pokok Penjualan (COGS):</span>
                  <span className="font-mono text-rose-300">- Rp {calcCogs.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>- Biaya Logistik Medis & Ekspedisi:</span>
                  <span className="font-mono text-rose-300">- Rp {calcLogistic.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>- Instalasi & Kalibrasi Uji Fungsi:</span>
                  <span className="font-mono text-rose-300">- Rp {calcInstallation.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>- Komisi Sales & Marketing ({calcCommissionRate}%):</span>
                  <span className="font-mono text-rose-300">- Rp {commissionCost.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-400 pb-2 border-b border-slate-800">
                  <span>- PPh Pasal 22 Rekanan Pemerintah (1.5%):</span>
                  <span className="font-mono text-rose-300">- Rp {pph15.toLocaleString('id-ID')}</span>
                </div>

                <div className="flex justify-between text-sm pt-1">
                  <span className="font-bold text-emerald-400">Net Profit / Laba Bersih:</span>
                  <span className="font-mono font-extrabold text-emerald-400 text-base">
                    Rp {netProfit.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-xs text-slate-300 space-y-1">
              <span className="font-bold text-white block">Rekomendasi Bidding Strategy:</span>
              <p className="text-[11px] leading-relaxed">
                {marginPercent >= 20 
                  ? 'Penawaran ini berada pada batas profitabilitas ideal (>20%). Memiliki ruang negosiasi hingga 5% jika tender memasuki tahap Reverse Auction.'
                  : 'Peringatan: Margin berada di bawah 20%. Pertimbangkan untuk menegosiasikan diskon pengadaan ke pabrikan prinsipal sebelum mengajukan penawaran final.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Dokumen Syarat LPSE */}
      {selectedTenderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  {selectedTenderModal.kodeTender}
                </span>
                <h3 className="text-sm font-bold mt-1">{selectedTenderModal.namaPaket}</h3>
              </div>
              <button
                onClick={() => setSelectedTenderModal(null)}
                className="text-slate-400 hover:text-white p-1 text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div>
                <span className="font-bold text-slate-800 block mb-2">Checklist Persyaratan Dokumen Medis & CDAKB:</span>
                <div className="space-y-2">
                  {selectedTenderModal.dokumenSyarat.map((syarat: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-slate-700 font-medium">{syarat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px]">
                Seluruh dokumen persyaratan teknis, jaminan purna jual 5 tahun, dan sertifikat teknisi siap diunduh otomatis dari modul Regulatory & QA.
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedTenderModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
