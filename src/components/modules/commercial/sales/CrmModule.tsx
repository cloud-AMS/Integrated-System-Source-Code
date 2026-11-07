import { useState } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Filter, 
  Users, 
  ShieldCheck, 
  TrendingUp, 
  FileText, 
  DollarSign, 
  Briefcase,
  AlertCircle,
  ExternalLink,
  Kanban,
  ListFilter
} from 'lucide-react';
import { CustomerFaskes, OpportunityLead, SalesTerritory } from '../../../../types/salesMarketing';

interface CrmModuleProps {
  customers: CustomerFaskes[];
  onAddCustomer: (customer: CustomerFaskes) => void;
  opportunities: OpportunityLead[];
  onUpdateOpportunityStage: (id: string, newStage: OpportunityLead['tahapan']) => void;
  territories: SalesTerritory[];
}

export default function CrmModule({
  customers,
  onAddCustomer,
  opportunities,
  onUpdateOpportunityStage,
  territories
}: CrmModuleProps) {
  const [activeSubTab, setActiveSubTab] = useState<'customers' | 'pipeline' | 'territories'>('customers');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedCustomerModal, setSelectedCustomerModal] = useState<CustomerFaskes | null>(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [pipelineViewMode, setPipelineViewMode] = useState<'kanban' | 'table'>('kanban');

  // Form state for new customer
  const [newCustomerForm, setNewCustomerForm] = useState<Partial<CustomerFaskes>>({
    namaInstitusi: '',
    tipeFaskes: 'RS Pemerintah Kelas A',
    akreditasiKemenkes: 'Paripurna',
    nomorIzinOperasional: '',
    masaBerlakuIzin: '2028-12-31',
    dokterPenanggungJawab: '',
    kontakPengadaan: '',
    noTelepon: '',
    email: '',
    alamat: '',
    wilayah: 'DKI Jakarta & Banten',
    batasKredit: 500000000,
    termOfPaymentHari: 45
  });

  const filteredCustomers = customers.filter(c => {
    const matchSearch = c.namaInstitusi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.kodeFaskes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.alamat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dokterPenanggungJawab.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = selectedTypeFilter === 'all' || c.tipeFaskes === selectedTypeFilter;
    return matchSearch && matchType;
  });

  const stages: OpportunityLead['tahapan'][] = [
    'Perkenalan Alat',
    'Demo Produk',
    'Penawaran Teknis',
    'Negosiasi Harga',
    'Menang (SPK)',
    'Kalah / Batal'
  ];

  const stageColors: Record<OpportunityLead['tahapan'], { bg: string; text: string; border: string; badge: string }> = {
    'Perkenalan Alat': { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-800' },
    'Demo Produk': { bg: 'bg-amber-50/50', text: 'text-amber-800', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800' },
    'Penawaran Teknis': { bg: 'bg-blue-50/50', text: 'text-blue-800', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-800' },
    'Negosiasi Harga': { bg: 'bg-indigo-50/50', text: 'text-indigo-800', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-800' },
    'Menang (SPK)': { bg: 'bg-emerald-50/50', text: 'text-emerald-800', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-800' },
    'Kalah / Batal': { bg: 'bg-rose-50/50', text: 'text-rose-800', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-800' }
  };

  const handleCreateCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerForm.namaInstitusi || !newCustomerForm.nomorIzinOperasional) return;

    const newCust: CustomerFaskes = {
      id: 'FAS-' + Date.now().toString().slice(-4),
      kodeFaskes: '31' + Math.floor(10000 + Math.random() * 90000),
      namaInstitusi: newCustomerForm.namaInstitusi,
      tipeFaskes: newCustomerForm.tipeFaskes as any,
      akreditasiKemenkes: newCustomerForm.akreditasiKemenkes as any,
      nomorIzinOperasional: newCustomerForm.nomorIzinOperasional,
      masaBerlakuIzin: newCustomerForm.masaBerlakuIzin || '2028-12-31',
      isIzinValid: new Date(newCustomerForm.masaBerlakuIzin || '') > new Date(),
      dokterPenanggungJawab: newCustomerForm.dokterPenanggungJawab || 'dr. Penanggung Jawab',
      kontakPengadaan: newCustomerForm.kontakPengadaan || 'Bagian Pengadaan',
      noTelepon: newCustomerForm.noTelepon || '(021) 000000',
      email: newCustomerForm.email || 'pengadaan@faskes.id',
      alamat: newCustomerForm.alamat || 'Alamat Institusi',
      wilayah: newCustomerForm.wilayah as any || 'DKI Jakarta & Banten',
      batasKredit: Number(newCustomerForm.batasKredit) || 500000000,
      piutangBerjalan: 0,
      sisaKredit: Number(newCustomerForm.batasKredit) || 500000000,
      termOfPaymentHari: Number(newCustomerForm.termOfPaymentHari) || 45,
      statusVerifikasiCDAKB: 'Tervalifikasi PJT',
      koordinatLat: -6.2088,
      koordinatLng: 106.8456
    };

    onAddCustomer(newCust);
    setIsAddCustomerOpen(false);
  };

  // Pipeline summary
  const totalPipelineValue = opportunities
    .filter(o => o.tahapan !== 'Kalah / Batal')
    .reduce((sum, o) => sum + o.estimasiNilai, 0);

  const weightedPipelineValue = opportunities
    .filter(o => o.tahapan !== 'Kalah / Batal')
    .reduce((sum, o) => sum + (o.estimasiNilai * o.probabilitasPersen / 100), 0);

  return (
    <div className="space-y-6">
      {/* Sub-tabs header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('customers')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'customers'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            B2B Customer Profiling ({customers.length})
          </button>

          <button
            onClick={() => setActiveSubTab('pipeline')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'pipeline'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Kanban className="w-4 h-4" />
            Lead & Opportunity Pipelines ({opportunities.length})
          </button>

          <button
            onClick={() => setActiveSubTab('territories')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'territories'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Mapping Area & Sales Territory ({territories.length})
          </button>
        </div>

        {activeSubTab === 'customers' && (
          <button
            onClick={() => setIsAddCustomerOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Daftarkan Faskes Baru
          </button>
        )}
      </div>

      {/* Sub-tab 1: B2B Customer Profiling */}
      {activeSubTab === 'customers' && (
        <div className="space-y-4">
          {/* Top Filter & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari faskes, kode faskes, dokter PJ..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <span className="text-[11px] font-medium text-slate-500 shrink-0">Tipe Faskes:</span>
              <select
                value={selectedTypeFilter}
                onChange={e => setSelectedTypeFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
              >
                <option value="all">Semua Tipe Faskes</option>
                <option value="RS Pemerintah Kelas A">RS Pemerintah Kelas A</option>
                <option value="RS Pemerintah Kelas B">RS Pemerintah Kelas B</option>
                <option value="RS Swasta">RS Swasta</option>
                <option value="Klinik Utama">Klinik Utama</option>
                <option value="Klinik Pratama">Klinik Pratama</option>
                <option value="Dinas Kesehatan">Dinas Kesehatan</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map(faskes => (
              <div 
                key={faskes.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                      KODE: {faskes.kodeFaskes}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      faskes.isIzinValid 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-rose-100 text-rose-800 animate-pulse'
                    }`}>
                      {faskes.isIzinValid ? 'Izin Valid' : 'Izin Kedaluwarsa'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1 mb-1">
                    {faskes.namaInstitusi}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{faskes.wilayah}</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-medium text-emerald-700">{faskes.tipeFaskes}</span>
                  </div>

                  <div className="space-y-1.5 py-2 border-y border-slate-100 text-[11px] text-slate-600 mb-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Akreditasi KARS/Kemkes:</span>
                      <span className="font-semibold text-slate-800">{faskes.akreditasiKemenkes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Dokter Penanggung Jawab:</span>
                      <span className="font-medium text-slate-800 truncate max-w-[170px]" title={faskes.dokterPenanggungJawab}>
                        {faskes.dokterPenanggungJawab}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Masa Izin Operasional:</span>
                      <span className={`font-medium ${faskes.isIzinValid ? 'text-slate-700' : 'text-rose-600 font-bold'}`}>
                        s/d {faskes.masaBerlakuIzin}
                      </span>
                    </div>
                  </div>

                  {/* Credit Plafon status */}
                  <div className="bg-slate-50 rounded-xl p-2.5 mb-2">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-500 font-medium">Plafon Kredit:</span>
                      <span className="font-bold text-slate-800">Rp {(faskes.batasKredit / 1_000_000).toLocaleString('id-ID')} Jt</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-1">
                      <div 
                        className={`h-full ${
                          (faskes.piutangBerjalan / faskes.batasKredit) > 0.85 
                            ? 'bg-rose-500' 
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, (faskes.piutangBerjalan / faskes.batasKredit) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Terpakai: Rp {(faskes.piutangBerjalan / 1_000_000).toLocaleString('id-ID')} Jt</span>
                      <span className="font-semibold text-emerald-700">TOP {faskes.termOfPaymentHari} Hari</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    {faskes.statusVerifikasiCDAKB}
                  </span>

                  <button
                    onClick={() => setSelectedCustomerModal(faskes)}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    Profil Lengkap
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-tab 2: Lead & Opportunity Pipelines */}
      {activeSubTab === 'pipeline' && (
        <div className="space-y-4">
          {/* Pipeline Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Total Nilai Pipeline Aktif</span>
              <div className="text-xl font-bold text-slate-900 mt-1">
                Rp {(totalPipelineValue / 1_000_000_000).toFixed(2)} Miliar
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Dari 5 prospek pengadaan faskes</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Weighted Forecast (Bobot Closing)</span>
              <div className="text-xl font-bold text-emerald-600 mt-1">
                Rp {(weightedPipelineValue / 1_000_000_000).toFixed(2)} Miliar
              </div>
              <span className="text-[11px] text-emerald-600 mt-0.5 block">Perhitungan probabilitas realisasi</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">Format Tampilan</span>
                <div className="text-sm font-bold text-slate-800 mt-0.5">
                  {pipelineViewMode === 'kanban' ? 'Kanban Funnel' : 'Tabel Detail'}
                </div>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setPipelineViewMode('kanban')}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    pipelineViewMode === 'kanban' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                  title="Kanban View"
                >
                  <Kanban className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPipelineViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    pipelineViewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                  title="Table View"
                >
                  <ListFilter className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Kanban Board View */}
          {pipelineViewMode === 'kanban' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 overflow-x-auto pb-4">
              {stages.map(stage => {
                const stageOpportunities = opportunities.filter(o => o.tahapan === stage);
                const stageTotal = stageOpportunities.reduce((sum, o) => sum + o.estimasiNilai, 0);

                return (
                  <div
                    key={stage}
                    className={`rounded-2xl border p-3 flex flex-col min-w-[240px] ${stageColors[stage].bg} ${stageColors[stage].border}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800">{stage}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stageColors[stage].badge}`}>
                        {stageOpportunities.length}
                      </span>
                    </div>

                    <div className="text-[11px] font-semibold text-slate-500 mb-3 pb-2 border-b border-slate-200/60">
                      Rp {(stageTotal / 1_000_000).toLocaleString('id-ID')} Jt
                    </div>

                    <div className="space-y-2 flex-1">
                      {stageOpportunities.map(opp => (
                        <div
                          key={opp.id}
                          className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              {opp.kategoriAlkes}
                            </span>
                            <span className="text-[10px] font-bold text-slate-600">
                              {opp.probabilitasPersen}%
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 line-clamp-2 mb-1">
                            {opp.judulProspek}
                          </h4>

                          <p className="text-[11px] text-slate-600 line-clamp-1 mb-1.5">
                            {opp.namaFaskes}
                          </p>

                          <div className="text-xs font-extrabold text-slate-900 mb-2">
                            Rp {(opp.estimasiNilai / 1_000_000).toLocaleString('id-ID')} Jt
                          </div>

                          <div className="text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded-lg mb-2 line-clamp-2">
                            {opp.catatanTerakhir}
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                            <span className="truncate max-w-[110px]">{opp.medRep}</span>
                            
                            {/* Fast stage mover selector */}
                            <select
                              value={opp.tahapan}
                              onChange={e => onUpdateOpportunityStage(opp.id, e.target.value as any)}
                              className="text-[10px] bg-slate-100 text-slate-700 rounded px-1 py-0.5 border border-slate-200 cursor-pointer"
                            >
                              {stages.map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}

                      {stageOpportunities.length === 0 && (
                        <div className="h-28 flex items-center justify-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs text-center px-2">
                          Tidak ada prospek pada tahap ini
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Judul Prospek & Alkes</th>
                      <th className="py-3 px-4 font-semibold">Faskes Tujuan</th>
                      <th className="py-3 px-4 font-semibold">Estimasi Nilai</th>
                      <th className="py-3 px-4 font-semibold">Tahap & Probabilitas</th>
                      <th className="py-3 px-4 font-semibold">MedRep PIC</th>
                      <th className="py-3 px-4 font-semibold">Aksi Tahapan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {opportunities.map(opp => (
                      <tr key={opp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{opp.judulProspek}</div>
                          <div className="text-[11px] text-slate-500">{opp.alkesTertarget}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{opp.namaFaskes}</div>
                          <div className="text-[11px] text-slate-400">{opp.tipeFaskes}</div>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          Rp {opp.estimasiNilai.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${stageColors[opp.tahapan].badge}`}>
                            {opp.tahapan} ({opp.probabilitasPersen}%)
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{opp.medRep}</td>
                        <td className="py-3 px-4">
                          <select
                            value={opp.tahapan}
                            onChange={e => onUpdateOpportunityStage(opp.id, e.target.value as any)}
                            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-emerald-500"
                          >
                            {stages.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sub-tab 3: Mapping Area & Sales Territory */}
      {activeSubTab === 'territories' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Pencegahan Konflik & Tumpang Tindih Area Distribusi Medis:</span>
              Setiap Medical Representative (MedRep) memiliki wilayah kerja spesifik untuk memastikan ketaatan pada Sertifikat Standar Distribusi Alkes (SDAK) perwakilan cabang dan tidak ada gesekan komisi penjualan antarsales.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {territories.map(terr => {
              const persentaseTarget = Math.round((terr.realisasiKuartal / terr.targetKuartal) * 100);

              return (
                <div key={terr.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">{terr.id}</span>
                      <h3 className="text-base font-bold text-slate-900">{terr.namaWilayah}</h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {terr.statusOverlap}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1.5 py-3 border-y border-slate-100 my-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Medical Representative PIC:</span>
                      <span className="font-semibold text-slate-800">{terr.medRepPIC}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Kontak Person Lapangan:</span>
                      <span className="font-mono text-slate-700">{terr.nomorKontak}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Faskes Tercover Resmi:</span>
                      <span className="font-bold text-emerald-700">{terr.jumlahFaskesTerdaftar} Rumah Sakit / Klinik</span>
                    </div>
                  </div>

                  {/* Coverage tag list */}
                  <div className="mb-4">
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">Cakupan Kota & Kabupaten:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {terr.cakupanKota.map((kota: string) => (
                        <span key={kota} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                          {kota}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Target & Realisasi Bar */}
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-600 font-medium">Pencapaian Target Kuartal:</span>
                      <span className="font-bold text-slate-900">{persentaseTarget}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full ${persentaseTarget >= 100 ? 'bg-emerald-600' : 'bg-blue-600'}`}
                        style={{ width: `${Math.min(100, persentaseTarget)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                      <span>Realisasi: Rp {(terr.realisasiKuartal / 1_000_000_000).toFixed(2)} M</span>
                      <span>Target: Rp {(terr.targetKuartal / 1_000_000_000).toFixed(2)} M</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Detail Faskes */}
      {selectedCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                  KODE FASKES KEMENKES: {selectedCustomerModal.kodeFaskes}
                </span>
                <h3 className="text-lg font-bold mt-1">{selectedCustomerModal.namaInstitusi}</h3>
                <p className="text-xs text-slate-400">{selectedCustomerModal.tipeFaskes} • {selectedCustomerModal.wilayah}</p>
              </div>
              <button
                onClick={() => setSelectedCustomerModal(null)}
                className="text-slate-400 hover:text-white p-1 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Status Kepatuhan CDAKB</span>
                  <div className="text-emerald-700 font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    {selectedCustomerModal.statusVerifikasiCDAKB}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Izin Operasional: {selectedCustomerModal.nomorIzinOperasional} (Berlaku s/d {selectedCustomerModal.masaBerlakuIzin})
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Akreditasi Rumah Sakit</span>
                  <div className="text-slate-900 font-bold text-sm">
                    {selectedCustomerModal.akreditasiKemenkes}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Standar Akreditasi Kemenkes RI (STARKES / KARS)</p>
                </div>
              </div>

              <div className="space-y-2 py-2 border-y border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Dokter Penanggung Jawab (PJ Medis):</span>
                  <span className="font-semibold text-slate-800">{selectedCustomerModal.dokterPenanggungJawab}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kontak Unit Pengadaan / Farmasi:</span>
                  <span className="font-semibold text-slate-800">{selectedCustomerModal.kontakPengadaan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Telepon & Email:</span>
                  <span className="font-mono text-slate-800">{selectedCustomerModal.noTelepon} | {selectedCustomerModal.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Alamat Lengkap:</span>
                  <span className="text-slate-800 max-w-xs text-right">{selectedCustomerModal.alamat}</span>
                </div>
              </div>

              {/* Credit Status */}
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4">
                <span className="font-bold text-emerald-900 block mb-2">Parameter Akuntansi & Batas Kredit (TOP)</span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                    <span className="text-[10px] text-slate-400 block">Plafon Kredit Maksimal</span>
                    <span className="font-bold text-slate-800">Rp {(selectedCustomerModal.batasKredit / 1_000_000).toLocaleString('id-ID')} Jt</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                    <span className="text-[10px] text-slate-400 block">Piutang Berjalan (AR)</span>
                    <span className="font-bold text-rose-700">Rp {(selectedCustomerModal.piutangBerjalan / 1_000_000).toLocaleString('id-ID')} Jt</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                    <span className="text-[10px] text-slate-400 block">Term of Payment</span>
                    <span className="font-bold text-emerald-700">{selectedCustomerModal.termOfPaymentHari} Hari Kalender</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedCustomerModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Faskes */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-emerald-700 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Pendaftaran Faskes / Rumah Sakit Baru</h3>
                <p className="text-xs text-emerald-100">Verifikasi kelayakan B2B sesuai standar CDAKB Kemenkes RI</p>
              </div>
              <button
                onClick={() => setIsAddCustomerOpen(false)}
                className="text-white hover:text-emerald-200 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomerSubmit} className="p-5 overflow-y-auto space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Institusi / Faskes *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: RSUD Dr. Soetomo Surabaya"
                  value={newCustomerForm.namaInstitusi}
                  onChange={e => setNewCustomerForm({ ...newCustomerForm, namaInstitusi: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tipe Faskes</label>
                  <select
                    value={newCustomerForm.tipeFaskes}
                    onChange={e => setNewCustomerForm({ ...newCustomerForm, tipeFaskes: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="RS Pemerintah Kelas A">RS Pemerintah Kelas A</option>
                    <option value="RS Pemerintah Kelas B">RS Pemerintah Kelas B</option>
                    <option value="RS Swasta">RS Swasta</option>
                    <option value="Klinik Utama">Klinik Utama</option>
                    <option value="Klinik Pratama">Klinik Pratama</option>
                    <option value="Dinas Kesehatan">Dinas Kesehatan</option>
                    <option value="Laboratorium Medis">Laboratorium Medis</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Akreditasi Kemenkes</label>
                  <select
                    value={newCustomerForm.akreditasiKemenkes}
                    onChange={e => setNewCustomerForm({ ...newCustomerForm, akreditasiKemenkes: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Paripurna">Paripurna (Bintang 5)</option>
                    <option value="Utama">Utama (Bintang 4)</option>
                    <option value="Madya">Madya (Bintang 3)</option>
                    <option value="Dalam Proses">Dalam Proses Akreditasi</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nomor Izin Operasional Faskes *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 440/102/IZIN-RS/2023"
                    value={newCustomerForm.nomorIzinOperasional}
                    onChange={e => setNewCustomerForm({ ...newCustomerForm, nomorIzinOperasional: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Masa Berlaku Izin *</label>
                  <input
                    type="date"
                    required
                    value={newCustomerForm.masaBerlakuIzin}
                    onChange={e => setNewCustomerForm({ ...newCustomerForm, masaBerlakuIzin: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Dokter Penanggung Jawab Medis</label>
                  <input
                    type="text"
                    placeholder="Contoh: dr. Bambang, Sp.B"
                    value={newCustomerForm.dokterPenanggungJawab}
                    onChange={e => setNewCustomerForm({ ...newCustomerForm, dokterPenanggungJawab: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kontak Bagian Pengadaan / Farmasi</label>
                  <input
                    type="text"
                    placeholder="Nama PPK atau Ka. Instalasi"
                    value={newCustomerForm.kontakPengadaan}
                    onChange={e => setNewCustomerForm({ ...newCustomerForm, kontakPengadaan: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Plafon Kredit (Batas Piutang Rp)</label>
                  <input
                    type="number"
                    value={newCustomerForm.batasKredit}
                    onChange={e => setNewCustomerForm({ ...newCustomerForm, batasKredit: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Term of Payment (Hari)</label>
                  <select
                    value={newCustomerForm.termOfPaymentHari}
                    onChange={e => setNewCustomerForm({ ...newCustomerForm, termOfPaymentHari: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value={14}>14 Hari (Klinik)</option>
                    <option value={30}>30 Hari (RS Swasta Standard)</option>
                    <option value={45}>45 Hari (RSUD)</option>
                    <option value={60}>60 Hari (RSUP / Kemenkes)</option>
                    <option value={90}>90 Hari (Tender Khusus)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Alamat Institusi</label>
                <textarea
                  rows={2}
                  placeholder="Jl. Rumah Sakit No..., Kota..., Provinsi..."
                  value={newCustomerForm.alamat}
                  onChange={e => setNewCustomerForm({ ...newCustomerForm, alamat: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl text-[11px] text-emerald-800">
                Pendaftaran ini otomatis diverifikasi oleh PJT sesuai klausul CDAKB terkait kelayakan penyaluran alat kesehatan ke sarana berizin.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold cursor-pointer shadow-xs"
                >
                  Simpan & Verifikasi PJT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
