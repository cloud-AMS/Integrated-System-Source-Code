import { useState } from 'react';
import { 
  Megaphone, 
  Calendar, 
  Award, 
  Package, 
  TrendingUp, 
  Users, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Search, 
  Plus, 
  ArrowRight,
  ShieldCheck,
  Gift
} from 'lucide-react';
import { MarketingEvent, DemoUnitLoan, LoyaltyRebate } from '../../../../types/salesMarketing';

interface MarketingCampaignModuleProps {
  events: MarketingEvent[];
  demoUnits: DemoUnitLoan[];
  rebates: LoyaltyRebate[];
  onConvertToSale: (demoId: string) => void;
}

export default function MarketingCampaignModule({
  events,
  demoUnits,
  rebates,
  onConvertToSale
}: MarketingCampaignModuleProps) {
  const [activeTab, setActiveTab] = useState<'events' | 'demos' | 'rebates'>('events');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = events.filter(e =>
    e.namaEvent.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.lokasi.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDemos = demoUnits.filter(d =>
    d.namaAlkes.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.faskesPeminjam.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.nomorSeri.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Sub-tabs header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'events'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            Event & Simposium Kedokteran ({events.length})
          </button>

          <button
            onClick={() => setActiveTab('demos')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'demos'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            Sample & Demo Unit Tracking ({demoUnits.length})
          </button>

          <button
            onClick={() => setActiveTab('rebates')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'rebates'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            Loyalty & Rebate Program ({rebates.length})
          </button>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          <span>Kepatuhan Etika Promosi Permenkes No. 76 Tahun 2013</span>
        </div>
      </div>

      {/* Tab 1: Event & Simposium Manager */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEvents.map(evt => {
              const roiMultiplier = evt.realisasiBiaya > 0 ? (evt.potensiRevenueLead / evt.realisasiBiaya).toFixed(1) : '0';

              return (
                <div key={evt.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {evt.jenisEvent}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-1">{evt.namaEvent}</h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                      {evt.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {evt.tanggalMulai} s/d {evt.tanggalSelesai} • {evt.lokasi}
                  </p>

                  <div className="grid grid-cols-3 gap-2 text-xs py-2 border-y border-slate-100">
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <span className="text-[10px] text-slate-400 block">Realisasi Biaya</span>
                      <span className="font-bold text-slate-800">
                        Rp {(evt.realisasiBiaya / 1_000_000).toLocaleString('id-ID')} Jt
                      </span>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-xl">
                      <span className="text-[10px] text-slate-400 block">Lead Diperoleh</span>
                      <span className="font-bold text-emerald-700">{evt.jumlahLeadDidapat} Prospek RS</span>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-xl">
                      <span className="text-[10px] text-slate-400 block">Estimasi ROI</span>
                      <span className="font-bold text-blue-700 font-mono">{roiMultiplier}x Nilai Biaya</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Dokter / Narasumber yang Didukung Resmi:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {evt.sponsorDokter.map((doc: string, idx: number) => (
                        <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                          {doc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Sample & Demo Unit Tracking */}
      {activeTab === 'demos' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDemos.map(demo => (
              <div key={demo.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                      {demo.nomorPeminjaman}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{demo.namaAlkes}</h3>
                    <div className="text-[11px] text-slate-500 font-mono">SN: {demo.nomorSeri}</div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    demo.statusPeminjaman.includes('Sedang') 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {demo.statusPeminjaman}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rumah Sakit Peminjam:</span>
                    <span className="font-bold text-slate-800">{demo.faskesPeminjam}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Departemen & Dokter Penguji:</span>
                    <span className="font-medium text-slate-700">{demo.dokterPenguji} ({demo.departemen})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Masa Pinjam Uji Coba:</span>
                    <span className="font-medium text-slate-700">{demo.tanggalKirim} s/d {demo.batasWaktuKembali}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Kondisi Fisik Alat:</span>
                    <span className="font-semibold text-emerald-700">{demo.kondisiFisik}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                  <strong className="text-emerald-900 block mb-0.5">Catatan Evaluasi Klinis Dokter:</strong>
                  {demo.catatanUjiFungsi}
                </div>

                {demo.statusPeminjaman === 'Sedang Uji Coba di RS' && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => onConvertToSale(demo.id)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Konversi Menjadi Pembelian Resmi
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Loyalty & Rebate Program */}
      {activeTab === 'rebates' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rebates.map(rebate => {
              const pencapaianPercent = Math.round((rebate.realisasiPenjualan / rebate.targetTahunan) * 100);

              const tierBadgeColors: Record<string, string> = {
                'Platinum': 'bg-indigo-100 text-indigo-800 border-indigo-200',
                'Gold': 'bg-amber-100 text-amber-800 border-amber-200',
                'Silver': 'bg-slate-100 text-slate-700 border-slate-200'
              };

              return (
                <div key={rebate.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${tierBadgeColors[rebate.tier]}`}>
                        Tier {rebate.tier} ({rebate.persentaseRebate}% Rebate)
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">{rebate.kategori}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mb-3">{rebate.namaPartner}</h3>

                    <div className="bg-slate-50 p-3 rounded-xl mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">Pencapaian Target:</span>
                        <span className="font-bold text-slate-800">{pencapaianPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
                        <div
                          className={`h-full ${pencapaianPercent >= 100 ? 'bg-emerald-600' : 'bg-blue-600'}`}
                          style={{ width: `${Math.min(100, pencapaianPercent)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                        <span>Real: Rp {(rebate.realisasiPenjualan / 1_000_000_000).toFixed(2)} M</span>
                        <span>Target: Rp {(rebate.targetTahunan / 1_000_000_000).toFixed(2)} M</span>
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs">
                      <span className="text-[10px] text-emerald-800 font-semibold block">Akumulasi Reward Rebate:</span>
                      <div className="text-base font-extrabold text-emerald-800 font-mono mt-0.5">
                        Rp {rebate.akumulasiRebateRp.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Status: <strong className="text-emerald-700">{rebate.statusKlaim}</strong></span>
                    <Gift className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
