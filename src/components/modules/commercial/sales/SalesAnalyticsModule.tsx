import { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Layers, 
  MapPin, 
  Users, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  Sparkles, 
  Boxes, 
  RotateCw,
  Cpu,
  Factory
} from 'lucide-react';
import { DemandForecastItem } from '../../../../types/salesMarketing';

interface SalesAnalyticsModuleProps {
  forecasts: DemandForecastItem[];
}

export default function SalesAnalyticsModule({
  forecasts
}: SalesAnalyticsModuleProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'forecast'>('dashboard');

  // Performance category breakdown data
  const categoryPerformance = [
    { name: 'Elektromedik Non Radiasi (Patient Monitor, USG, ECG)', revenue: 4850000000, target: 5000000000, percent: 97, share: 42, color: 'bg-emerald-500' },
    { name: 'Non Elektromedik Steril (Syringe, Infus, Benang Bedah)', revenue: 3200000000, target: 3000000000, percent: 106, share: 28, color: 'bg-blue-500' },
    { name: 'Diagnostik In Vitro / IVD (Reagen, Rapid Test)', revenue: 2150000000, target: 2500000000, percent: 86, share: 19, color: 'bg-indigo-500' },
    { name: 'Elektromedik Radiasi (Mobile X-Ray, C-Arm)', revenue: 1250000000, target: 1500000000, percent: 83, share: 11, color: 'bg-amber-500' }
  ];

  // Top Sales Leaderboard
  const salesLeaderboard = [
    { name: 'Dimas Satria, S.T.', territory: 'DKI Jakarta & Banten', closedDeals: 18, revenue: 3850000000, targetAchieved: 112 },
    { name: 'Budi Santoso, S.Si', territory: 'Jawa Tengah & DIY', closedDeals: 14, revenue: 2950000000, targetAchieved: 98 },
    { name: 'Ferry Pratama, A.Md.TEM', territory: 'Jawa Barat', closedDeals: 12, revenue: 2890000000, targetAchieved: 94 },
    { name: 'Arya Putra, S.Farm', territory: 'Jawa Timur & Bali', closedDeals: 11, revenue: 2450000000, targetAchieved: 88 }
  ];

  return (
    <div className="space-y-6">
      {/* Sub-tabs header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Sales Performance Dashboard (BI)
          </button>

          <button
            onClick={() => setActiveTab('forecast')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'forecast'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Demand Forecasting & Replenishment ({forecasts.length})
          </button>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          <span>Algoritma: 3-Month Moving Average + Seasonal Weight</span>
        </div>
      </div>

      {/* Tab 1: Sales Performance Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Main KPI Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Realisasi Penjualan YTD (Tahun Berjalan)</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">Rp 11.45 M</div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold mt-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                +14.8% vs Tahun Sebelumnya
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Target Penjualan Tahunan (Budget)</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">Rp 12.00 M</div>
              <div className="text-[11px] text-slate-500 mt-1">Pencapaian: 95.4% (On Track)</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Porsi Penjualan e-Katalog LKPP</span>
              <div className="text-2xl font-extrabold text-emerald-700 mt-1">68.2%</div>
              <div className="text-[11px] text-emerald-600 mt-1">Dominasi Rumah Sakit Vertikal & Daerah</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Rata-rata Margin Penjualan (Net)</span>
              <div className="text-2xl font-extrabold text-blue-700 mt-1">22.4%</div>
              <div className="text-[11px] text-slate-500 mt-1">Setelah pajak & biaya uji fungsi BAST</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Category Share & Target Progress */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Performa Penjualan Berdasarkan Kategori Alkes</h3>
                  <p className="text-xs text-slate-500">Evaluasi volume revenue dan pencapaian target kuartal</p>
                </div>
                <Layers className="w-4 h-4 text-slate-400" />
              </div>

              <div className="space-y-4 pt-2">
                {categoryPerformance.map((cat, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800">{cat.name}</span>
                      <span className="font-bold text-slate-900 font-mono">
                        Rp {(cat.revenue / 1_000_000_000).toFixed(2)} M ({cat.percent}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                      <div
                        className={`${cat.color} h-full transition-all duration-500`}
                        style={{ width: `${Math.min(100, cat.percent)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Pangsa Pasar Portofolio: {cat.share}%</span>
                      <span>Target: Rp {(cat.target / 1_000_000_000).toFixed(2)} M</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sales Leaderboard */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Leaderboard Medical Representative</h3>
                  <p className="text-xs text-slate-500">Peringkat performa closing SPK & kontrak RS</p>
                </div>
                <Users className="w-4 h-4 text-slate-400" />
              </div>

              <div className="space-y-3 pt-2">
                {salesLeaderboard.map((medrep, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">{medrep.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block ml-6">{medrep.territory}</span>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-xs text-slate-900 font-mono block">
                        Rp {(medrep.revenue / 1_000_000_000).toFixed(2)} M
                      </span>
                      <span className={`text-[10px] font-bold ${
                        medrep.targetAchieved >= 100 ? 'text-emerald-700' : 'text-blue-700'
                      }`}>
                        {medrep.targetAchieved}% Target ({medrep.closedDeals} Deals)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Demand Forecasting Engine */}
      {activeTab === 'forecast' && (
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Algoritma Prediktif & Integrasi CPAKB Manufaktur:</span>
              Sistem secara otomatis menghitung tingkat konsumsi bulanan RS dan pola musim pengadaan (Q4 belanja APBD/APBN) untuk merekomendasikan penerbitan Surat Perintah Kerja (SPK) perakitan/produksi CPAKB atau pembelian impor sebelum stok gudang menyentuh batas kritis (Safety Stock).
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Nama Produk Alkes & Kategori</th>
                    <th className="py-3 px-4">Rataan Penjualan (3 Bln)</th>
                    <th className="py-3 px-4">Tren Permintaan RS</th>
                    <th className="py-3 px-4">Stok Gudang vs Safety Stock</th>
                    <th className="py-3 px-4">Lead Time Produksi / Impor</th>
                    <th className="py-3 px-4">Proyeksi 30 Hari</th>
                    <th className="py-3 px-4">Rekomendasi Aksi Sistem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {forecasts.map(fc => (
                    <tr key={fc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{fc.namaAlkes}</span>
                        <span className="text-[10px] text-slate-500">{fc.kategori}</span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-800 font-semibold">
                        {fc.rataanPenjualan3Bulan.toLocaleString('id-ID')} Unit/Bulan
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          fc.trenKebutuhan.includes('Naik')
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {fc.trenKebutuhan}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-bold text-slate-900">{fc.stokTersediaGudang.toLocaleString('id-ID')}</span>
                        <span className="text-slate-400 text-[10px] block">Batas Aman: {fc.safetyStockMinimum.toLocaleString('id-ID')}</span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700">
                        {fc.leadTimePabrikHari} Hari Kalender
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {fc.proyeksiKebutuhan30Hari.toLocaleString('id-ID')} Unit
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 w-fit ${
                          fc.rekomendasiAksi.includes('Segera')
                            ? 'bg-rose-100 text-rose-800 animate-pulse'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          <Factory className="w-3 h-3" />
                          {fc.rekomendasiAksi}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
