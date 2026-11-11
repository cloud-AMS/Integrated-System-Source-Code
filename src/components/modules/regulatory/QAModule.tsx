import { useState } from 'react';
import { db } from '../../../services/pocketbase';
import { CAPARecord, ProdukKembalian, DokumenMutu, AuditInternalIso13485, DetailPemeriksaanDokumen } from '../../../types';
import { 
  Award, 
  Plus, 
  FileCheck, 
  AlertTriangle, 
  RotateCcw, 
  Search, 
  CheckCircle2, 
  Clock, 
  FileText,
  ShieldCheck,
  Printer,
  Download,
  Play,
  ClipboardCheck,
  Check,
  X,
  FileSpreadsheet,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import AuditReportModal from './AuditReportModal';
import { unduhAuditInternalCsv } from '../../../utils/auditInternalIso13485';

export default function QAModule() {
  const [activeTab, setActiveTab] = useState<'capa' | 'retur' | 'dokumen' | 'audit-iso'>('capa');
  const [capaList, setCapaList] = useState<CAPARecord[]>(db.getCAPA());
  const [returList, setReturList] = useState<ProdukKembalian[]>(db.getProdukKembalian());
  const [dokumenList] = useState<DokumenMutu[]>(db.getDokumenMutu());
  const [auditList, setAuditList] = useState<AuditInternalIso13485[]>(() => db.getAuditInternal('QA'));
  const [isCapaModalOpen, setIsCapaModalOpen] = useState(false);
  const [isReturModalOpen, setIsReturModalOpen] = useState(false);
  const [selectedAuditForModal, setSelectedAuditForModal] = useState<AuditInternalIso13485 | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [auditNotice, setAuditNotice] = useState<string | null>(null);

  // Filter untuk Tab Audit Internal
  const [filterTemuanAudit, setFilterTemuanAudit] = useState<string>('semua');
  const [filterKlausulAudit, setFilterKlausulAudit] = useState<string>('semua');
  const [searchAudit, setSearchAudit] = useState('');

  // Audit terkini (paling atas)
  const auditTerkini = auditList[0] || null;

  // New CAPA Form
  const [capaForm, setCapaForm] = useState<Partial<CAPARecord>>({
    sumber: 'Audit Internal',
    deskripsiMasalah: '',
    akarPenyebab: '',
    tindakanKorektif: '',
    tindakanPreventif: '',
    penanggungJawab: 'Budi Utomo, S.T (QA Manager)',
    targetSelesai: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    status: 'Penyelidikan',
    verifikasiPJT: true
  });

  // Handler eksekusi audit internal otomatis
  const handleJalankanAuditOtomatis = () => {
    setIsScanning(true);
    setAuditNotice('Memulai pemindaian otomatis kesesuaian dokumen ISO 13485:2016...');

    setTimeout(() => {
      const hasil = db.jalankanAuditOtomatisQA();
      setAuditList(db.getAuditInternal('QA'));
      setIsScanning(false);
      setAuditNotice(`Audit internal otomatis selesai! Indeks Kepatuhan: ${hasil.skorKepatuhan}% (${hasil.dokumenSesuai} Sesuai, ${hasil.temuanMinor} Minor NC, ${hasil.temuanMajor} Mayor NC).`);
      setTimeout(() => setAuditNotice(null), 8000);
    }, 600);
  };

  const handleBuatCapaDariTemuan = (doc: DetailPemeriksaanDokumen) => {
    setCapaForm({
      sumber: 'Audit Internal',
      deskripsiMasalah: `[Temuan Audit ${doc.kodeDokumen}] ${doc.catatanAudit}`,
      akarPenyebab: 'Perlu verifikasi alur pembaruan dan siklus peninjauan berkala dokumen mutu.',
      tindakanKorektif: doc.tindakanPerbaikan || 'Segera lakukan perbaikan dan pengesahan ulang dokumen oleh PJT.',
      tindakanPreventif: 'Sosialisasi prosedur pengendalian dokumen mutu ISO 13485 Klausul 4.2.4 ke seluruh departemen.',
      penanggungJawab: 'Budi Utomo, S.T (QA Manager)',
      targetSelesai: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: 'Penyelidikan',
      verifikasiPJT: true
    });
    setIsCapaModalOpen(true);
  };

  // New Retur Form
  const [returForm, setReturForm] = useState<Partial<ProdukKembalian>>({
    fasyankes: '',
    namaAlkes: '',
    nomorBatch: '',
    jumlah: 1,
    satuan: 'Unit',
    alasanRetur: 'Cacat Kemasan',
    statusKarantina: 'Di Ruang Karantina',
    catatanInspeksiQA: ''
  });

  const handleSaveCAPA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!capaForm.deskripsiMasalah) return;
    const item: CAPARecord = {
      id: 'CAPA-' + Date.now(),
      nomorCAPA: `CAPA/ISO/24/${String(capaList.length + 1).padStart(3, '0')}`,
      sumber: capaForm.sumber as CAPARecord['sumber'],
      deskripsiMasalah: capaForm.deskripsiMasalah || '',
      akarPenyebab: capaForm.akarPenyebab || '',
      tindakanKorektif: capaForm.tindakanKorektif || '',
      tindakanPreventif: capaForm.tindakanPreventif || '',
      penanggungJawab: capaForm.penanggungJawab || 'QA Team',
      targetSelesai: capaForm.targetSelesai || '',
      status: capaForm.status as CAPARecord['status'],
      verifikasiPJT: true
    };
    db.addCAPA(item);
    setCapaList(db.getCAPA());
    setIsCapaModalOpen(false);
  };

  const handleSaveRetur = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returForm.namaAlkes || !returForm.nomorBatch) return;
    const item: ProdukKembalian = {
      id: 'RET-' + Date.now(),
      nomorRetur: `RET/CDAKB/24/${String(returList.length + 1).padStart(3, '0')}`,
      fasyankes: returForm.fasyankes || 'Rumah Sakit Rekanan',
      namaAlkes: returForm.namaAlkes || '',
      nomorBatch: returForm.nomorBatch || '',
      jumlah: Number(returForm.jumlah) || 1,
      satuan: returForm.satuan || 'Unit',
      alasanRetur: returForm.alasanRetur as ProdukKembalian['alasanRetur'],
      statusKarantina: returForm.statusKarantina as ProdukKembalian['statusKarantina'],
      catatanInspeksiQA: returForm.catatanInspeksiQA || 'Barang ditahan di ruang karantina bertanda khusus.',
      tanggalMasukKarantina: new Date().toISOString().split('T')[0]
    };
    db.addProdukKembalian(item);
    setReturList(db.getProdukKembalian());
    setIsReturModalOpen(false);
  };

  // Filter daftar uji dokumen audit terkini
  const daftarUjiTerfilter = (auditTerkini?.daftarPemeriksaanDokumen || []).filter((item) => {
    const matchSearch =
      item.kodeDokumen.toLowerCase().includes(searchAudit.toLowerCase()) ||
      item.judulDokumen.toLowerCase().includes(searchAudit.toLowerCase()) ||
      item.klausulIso.toLowerCase().includes(searchAudit.toLowerCase()) ||
      item.catatanAudit.toLowerCase().includes(searchAudit.toLowerCase());

    const matchTemuan =
      filterTemuanAudit === 'semua' || item.statusKesesuaian.includes(filterTemuanAudit);

    const matchKlausul =
      filterKlausulAudit === 'semua' || item.klausulIso.includes(filterKlausulAudit);

    return matchSearch && matchTemuan && matchKlausul;
  });

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-800">
              Modul Mutu
            </span>
            <span className="text-xs text-slate-500">Klausul 4.2 & 8.2.4 ISO 13485:2016 & Bab II CDAKB</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Quality Assurance (QA) / Pemastian Mutu
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Menjamin kepatuhan sistem manajemen mutu (SMM), audit internal otomatis kesesuaian dokumen ISO 13485:2016, penanganan tindakan korektif pencegahan (CAPA), dan karantina produk alkes kembalian.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === 'audit-iso' && (
            <>
              <button
                type="button"
                onClick={handleJalankanAuditOtomatis}
                disabled={isScanning}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                {isScanning ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Memindai Dokumen...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Jalankan Audit Otomatis</span>
                  </>
                )}
              </button>
              {auditTerkini && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAuditForModal(auditTerkini);
                    setIsAuditModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Laporan</span>
                </button>
              )}
            </>
          )}

          {activeTab === 'capa' && (
            <button
              type="button"
              onClick={() => setIsCapaModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Buat Tindakan CAPA
            </button>
          )}
          {activeTab === 'retur' && (
            <button
              type="button"
              onClick={() => setIsReturModalOpen(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Catat Retur Karantina
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs overflow-x-auto [scrollbar-width:none]">
        <button
          type="button"
          onClick={() => setActiveTab('audit-iso')}
          className={`pb-3 px-3 font-semibold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'audit-iso'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          Audit Internal ISO 13485 ({auditList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('capa')}
          className={`pb-3 px-3 font-semibold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'capa'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          Tindakan CAPA ({capaList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('retur')}
          className={`pb-3 px-3 font-semibold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'retur'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          Produk Kembalian / Karantina ({returList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dokumen')}
          className={`pb-3 px-3 font-semibold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'dokumen'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Pengendalian Dokumen Mutu ({dokumenList.length})
        </button>
      </div>

      {/* Notice Banner */}
      {auditNotice && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="font-medium">{auditNotice}</span>
          </div>
          <button 
            type="button"
            onClick={() => setAuditNotice(null)}
            className="text-indigo-400 hover:text-indigo-700 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Content 0: Audit Internal ISO 13485 Otomatis */}
      {activeTab === 'audit-iso' && (
        <div className="space-y-6">
          
          {/* Audit Metrics Overview */}
          {auditTerkini && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block font-medium">Indeks Kepatuhan ISO</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl font-black text-indigo-600">{auditTerkini.skorKepatuhan}%</span>
                    <span className="text-2xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Compliant
                    </span>
                  </div>
                  <span className="text-3xs text-slate-400 mt-1 block">
                    Klausul 4.2, 8.2.4 & 8.5.2
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block font-medium">Dokumen Sesuai</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl font-black text-emerald-700">{auditTerkini.dokumenSesuai}</span>
                    <span className="text-2xs text-slate-500">/ {auditTerkini.totalDokumenDiperiksa} Berkas</span>
                  </div>
                  <span className="text-3xs text-slate-400 mt-1 block">
                    100% Pengesahan PJT Valid
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block font-medium">Temuan Minor / Rekomendasi</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-black text-amber-700">{auditTerkini.temuanMinor}</span>
                    <span className="text-xs text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                      +{auditTerkini.rekomendasiOFI} OFI
                    </span>
                  </div>
                  <span className="text-3xs text-slate-400 mt-1 block">
                    {auditTerkini.status}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block font-medium">Temuan Mayor NC</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl font-black text-rose-700">{auditTerkini.temuanMajor}</span>
                    <span className="text-2xs text-slate-400">Kritis</span>
                  </div>
                  <span className="text-3xs text-slate-400 mt-1 block">
                    Waktu: {auditTerkini.waktuAuditOtomatis}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
            </div>
          )}

          {/* Matriks Klausul ISO 13485 */}
          {auditTerkini && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Matriks Evaluasi Kepatuhan Klausul ISO 13485:2016
                  </h3>
                  <p className="text-2xs text-slate-500">
                    Pemantauan kesesuaian klausul dokumentasi, pengendalian dokumen, rekaman, audit internal, karantina, dan CAPA.
                  </p>
                </div>
                <div className="text-2xs text-slate-500">
                  Lead Auditor: <strong className="text-slate-800">{auditTerkini.auditorLead}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {auditTerkini.klausulAudit.map((klausul) => (
                  <div key={klausul.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-indigo-700 text-xs">Klausul {klausul.klausul}</span>
                      <span className={`text-3xs font-bold px-2 py-0.5 rounded ${
                        klausul.status === 'Sesuai'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : klausul.status === 'Minor NC'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {klausul.status} ({klausul.persentaseKepatuhan}%)
                      </span>
                    </div>

                    <div className="font-semibold text-slate-900 text-xs line-clamp-1">
                      {klausul.judulKlausul}
                    </div>

                    {/* Progress Bar Kepatuhan */}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          klausul.persentaseKepatuhan >= 90
                            ? 'bg-emerald-500'
                            : klausul.persentaseKepatuhan >= 75
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${klausul.persentaseKepatuhan}%` }}
                      />
                    </div>

                    <p className="text-2xs text-slate-600 leading-relaxed">
                      {klausul.catatanEvaluasi}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Table Container: Pemeriksaan Dokumen Mutu */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            
            {/* Header Table & Controls */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">Uji Kesesuaian Dokumen Otomatis</span>
                <span className="text-2xs text-slate-500 font-mono">({daftarUjiTerfilter.length} Berkas)</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchAudit}
                    onChange={(e) => setSearchAudit(e.target.value)}
                    placeholder="Cari kode/judul dokumen..."
                    className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs w-48 text-slate-800"
                  />
                </div>

                <select
                  value={filterTemuanAudit}
                  onChange={(e) => setFilterTemuanAudit(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="semua">Semua Status Temuan</option>
                  <option value="Sesuai">Sesuai (Compliant)</option>
                  <option value="Minor NC">Minor NC</option>
                  <option value="Major NC">Major NC</option>
                  <option value="OFI">Peluang Peningkatan (OFI)</option>
                </select>

                <select
                  value={filterKlausulAudit}
                  onChange={(e) => setFilterKlausulAudit(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="semua">Semua Klausul</option>
                  <option value="4.2.4">Klausul 4.2.4 (Dokumen)</option>
                  <option value="4.2.5">Klausul 4.2.5 (Rekaman)</option>
                  <option value="8.2.4">Klausul 8.2.4 (Audit)</option>
                  <option value="8.3">Klausul 8.3 (Non-conforming)</option>
                  <option value="8.5.2">Klausul 8.5.2 (CAPA)</option>
                </select>

                {auditTerkini && (
                  <button
                    type="button"
                    onClick={() => unduhAuditInternalCsv(auditTerkini)}
                    className="p-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 transition-colors cursor-pointer"
                    title="Unduh CSV"
                  >
                    <Download className="w-4 h-4 text-indigo-600" />
                  </button>
                )}
              </div>
            </div>

            {/* Table Records */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <th className="py-3 px-4">Kode & Judul Dokumen</th>
                    <th className="py-3 px-4">Kategori & Klausul ISO</th>
                    <th className="py-3 px-4">Parameter Kendali ISO 13485</th>
                    <th className="py-3 px-4">Catatan Evaluasi Auditor</th>
                    <th className="py-3 px-4 text-center">Status Kesesuaian</th>
                    <th className="py-3 px-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {daftarUjiTerfilter.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-indigo-800 text-xs">{doc.kodeDokumen}</div>
                        <div className="font-medium text-slate-900">{doc.judulDokumen}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="font-medium">{doc.kategori}</div>
                        <div className="font-mono text-2xs text-indigo-700 font-semibold">{doc.klausulIso}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 text-2xs">
                          <span className={`flex items-center gap-1 ${
                            doc.parameterUji.kontrolNomorRevisi ? 'text-emerald-700 font-medium' : 'text-rose-600 font-bold'
                          }`}>
                            {doc.parameterUji.kontrolNomorRevisi ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                            Penomoran Revisi Terkendali
                          </span>
                          <span className={`flex items-center gap-1 ${
                            doc.parameterUji.otoritasPengesahan ? 'text-emerald-700 font-medium' : 'text-rose-600 font-bold'
                          }`}>
                            {doc.parameterUji.otoritasPengesahan ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                            Disahkan PJT / Direktur
                          </span>
                          <span className={`flex items-center gap-1 ${
                            doc.parameterUji.statusMasaBerlaku ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'
                          }`}>
                            {doc.parameterUji.statusMasaBerlaku ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                            Status Aktif Berlaku
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs leading-relaxed text-2xs">
                        <p>{doc.catatanAudit}</p>
                        {doc.tindakanPerbaikan && (
                          <p className="text-indigo-800 font-medium mt-1">
                            <strong>Saran:</strong> {doc.tindakanPerbaikan}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-2xs font-bold inline-block ${
                          doc.statusKesesuaian === 'Sesuai (Compliant)'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : doc.statusKesesuaian === 'Minor NC'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : doc.statusKesesuaian === 'Major NC'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}>
                          {doc.statusKesesuaian}
                        </span>
                        <div className="text-3xs text-slate-400 mt-1">Skor: {doc.skor}%</div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {(doc.statusKesesuaian === 'Minor NC' || doc.statusKesesuaian === 'Major NC') && (
                          <button
                            type="button"
                            onClick={() => handleBuatCapaDariTemuan(doc)}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-2xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            Buat CAPA
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Riwayat Laporan Audit Internal */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                Arsip Laporan Audit Internal ISO 13485:2016
              </h3>
              <span className="text-2xs text-slate-500">Masa Retensi Wajib Minimum 5 Tahun</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <th className="py-2.5 px-3">Nomor Audit & Tanggal</th>
                    <th className="py-2.5 px-3">Judul Pelaksanaan</th>
                    <th className="py-2.5 px-3">Lead Auditor</th>
                    <th className="py-2.5 px-3">Indeks Kepatuhan</th>
                    <th className="py-2.5 px-3">Rincian Temuan</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditList.map((aud) => (
                    <tr key={aud.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-bold text-indigo-800 text-xs">{aud.nomorAudit}</div>
                        <div className="text-2xs text-slate-500">{aud.tanggalAudit}</div>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900 max-w-xs">{aud.judulAudit}</td>
                      <td className="py-2.5 px-3 text-slate-600 text-2xs">{aud.auditorLead}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-indigo-700">{aud.skorKepatuhan}%</span>
                      </td>
                      <td className="py-2.5 px-3 text-2xs">
                        <span className="text-emerald-700 font-semibold">{aud.dokumenSesuai} Sesuai</span> •{' '}
                        <span className="text-amber-700 font-semibold">{aud.temuanMinor} Minor</span> •{' '}
                        <span className="text-rose-700 font-semibold">{aud.temuanMajor} Mayor</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-3xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {aud.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAuditForModal(aud);
                            setIsAuditModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-lg text-2xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Printer className="w-3 h-3" />
                          Lihat / Cetak
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Content 1: CAPA List */}
      {activeTab === 'capa' && (
        <div className="space-y-4">
          {capaList.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                    {item.nomorCAPA}
                  </span>
                  <span className="text-xs font-semibold text-slate-600">Sumber: {item.sumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-2xs font-bold px-2 py-0.5 rounded ${
                    item.status === 'Efektif Diverifikasi'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.status}
                  </span>
                  {item.verifikasiPJT && (
                    <span className="text-2xs font-semibold text-indigo-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi PJT
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <div>
                    <span className="font-semibold text-slate-700 block">Uraian Ketidaksesuaian:</span>
                    <p className="text-slate-600 leading-relaxed text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      {item.deskripsiMasalah}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block">Analisis Akar Penyebab (Root Cause):</span>
                    <p className="text-slate-600 leading-relaxed text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      {item.akarPenyebab}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="font-semibold text-slate-700 block">Tindakan Korektif (Corrective Action):</span>
                    <p className="text-slate-600 leading-relaxed text-xs bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
                      {item.tindakanKorektif}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block">Tindakan Pencegahan (Preventive Action):</span>
                    <p className="text-slate-600 leading-relaxed text-xs bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                      {item.tindakanPreventif}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                <span>Penanggung Jawab: <strong>{item.penanggungJawab}</strong></span>
                <span>Target Selesai: <strong>{item.targetSelesai}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content 2: Produk Kembalian */}
      {activeTab === 'retur' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-amber-50/70 border-b border-amber-200 text-xs text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Kepatuhan CDAKB:</strong> Produk kembalian wajib ditempatkan di Area Karantina terpisah berpintu terkunci dengan penandaan jelas hingga keputusan rilis/pemusnahan dikeluarkan PJT.
            </span>
          </div>

          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <th className="py-3 px-4">Nomor Retur</th>
                <th className="py-3 px-4">Fasilitas Pelayanan (Fasyankes)</th>
                <th className="py-3 px-4">Alkes & Batch</th>
                <th className="py-3 px-4">Jumlah</th>
                <th className="py-3 px-4">Alasan Retur</th>
                <th className="py-3 px-4">Status Karantina</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {returList.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-semibold text-indigo-800">{r.nomorRetur}</td>
                  <td className="py-3 px-4 font-medium text-slate-900">{r.fasyankes}</td>
                  <td className="py-3 px-4 text-slate-700">
                    <div>{r.namaAlkes}</div>
                    <div className="font-mono text-2xs text-slate-500">Batch: {r.nomorBatch}</div>
                  </td>
                  <td className="py-3 px-4 font-bold">{r.jumlah} {r.satuan}</td>
                  <td className="py-3 px-4 text-slate-700">{r.alasanRetur}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-2xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      {r.statusKarantina}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Content 3: Dokumen Mutu */}
      {activeTab === 'dokumen' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <th className="py-3 px-4">Kode Dokumen</th>
                <th className="py-3 px-4">Judul Dokumen Mutu</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Revisi</th>
                <th className="py-3 px-4">Tanggal Efektif</th>
                <th className="py-3 px-4">Penyusun & Penyetuju</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dokumenList.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-800">{doc.kodeDokumen}</td>
                  <td className="py-3 px-4 font-medium text-slate-900">{doc.judul}</td>
                  <td className="py-3 px-4 text-slate-600">{doc.kategori}</td>
                  <td className="py-3 px-4 font-mono">Rev. 0{doc.revisi}</td>
                  <td className="py-3 px-4 text-slate-700">{doc.tanggalEfektif}</td>
                  <td className="py-3 px-4 text-xs text-slate-600">
                    <div>Penyusun: {doc.penyusun}</div>
                    <div className="font-semibold text-indigo-800">Penyetuju: {doc.penyetujui}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-2xs font-bold bg-emerald-100 text-emerald-800">
                      {doc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Add CAPA */}
      {isCapaModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base text-slate-900 mb-1">
              Catat Tindakan Korektif & Pencegahan (CAPA)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Klausul 8.5.2 & 8.5.3 ISO 13485:2016
            </p>

            <form onSubmit={handleSaveCAPA} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sumber Temuan</label>
                <select
                  value={capaForm.sumber}
                  onChange={(e) => setCapaForm({ ...capaForm, sumber: e.target.value as CAPARecord['sumber'] })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Audit Internal">Audit Internal</option>
                  <option value="Inspeksi Kemenkes">Inspeksi Kemenkes RI</option>
                  <option value="Keluhan Fasyankes">Keluhan Fasyankes</option>
                  <option value="Temuan QC">Temuan QC</option>
                  <option value="Ketidaksesuaian Suhu">Ketidaksesuaian Suhu Cold Chain</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Uraian Masalah / Temuan</label>
                <textarea
                  rows={2}
                  required
                  value={capaForm.deskripsiMasalah}
                  onChange={(e) => setCapaForm({ ...capaForm, deskripsiMasalah: e.target.value })}
                  placeholder="Jelaskan ketidaksesuaian yang terjadi..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Akar Penyebab (Root Cause)</label>
                <textarea
                  rows={2}
                  value={capaForm.akarPenyebab}
                  onChange={(e) => setCapaForm({ ...capaForm, akarPenyebab: e.target.value })}
                  placeholder="Mengapa masalah ini bisa terjadi..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tindakan Korektif (Perbaikan Sekarang)</label>
                <input
                  type="text"
                  value={capaForm.tindakanKorektif}
                  onChange={(e) => setCapaForm({ ...capaForm, tindakanKorektif: e.target.value })}
                  placeholder="Tindakan langsung memperbaiki masalah..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tindakan Preventif (Pencegahan Ke Depan)</label>
                <input
                  type="text"
                  value={capaForm.tindakanPreventif}
                  onChange={(e) => setCapaForm({ ...capaForm, tindakanPreventif: e.target.value })}
                  placeholder="Perubahan prosedur agar tidak terulang..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Penanggung Jawab</label>
                  <input
                    type="text"
                    value={capaForm.penanggungJawab}
                    onChange={(e) => setCapaForm({ ...capaForm, penanggungJawab: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Selesai</label>
                  <input
                    type="date"
                    value={capaForm.targetSelesai}
                    onChange={(e) => setCapaForm({ ...capaForm, targetSelesai: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCapaModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs cursor-pointer"
                >
                  Simpan CAPA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Retur */}
      {isReturModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base text-slate-900 mb-1">
              Catat Alkes Kembalian (Retur Karantina)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Penerimaan produk retur wajib masuk area karantina khusus sesuai CDAKB.
            </p>

            <form onSubmit={handleSaveRetur} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Asal Fasyankes / Rumah Sakit</label>
                <input
                  type="text"
                  required
                  value={returForm.fasyankes}
                  onChange={(e) => setReturForm({ ...returForm, fasyankes: e.target.value })}
                  placeholder="Contoh: RSUD Pasar Minggu"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Alkes</label>
                <input
                  type="text"
                  required
                  value={returForm.namaAlkes}
                  onChange={(e) => setReturForm({ ...returForm, namaAlkes: e.target.value })}
                  placeholder="Contoh: Patient Monitor AMS-V12 Pro"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Batch / Lot</label>
                  <input
                    type="text"
                    required
                    value={returForm.nomorBatch}
                    onChange={(e) => setReturForm({ ...returForm, nomorBatch: e.target.value })}
                    placeholder="LOT-2024-..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jumlah</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      value={returForm.jumlah}
                      onChange={(e) => setReturForm({ ...returForm, jumlah: Number(e.target.value) })}
                      className="w-20 px-3 py-2 border border-slate-300 rounded-lg"
                    />
                    <input
                      type="text"
                      value={returForm.satuan}
                      onChange={(e) => setReturForm({ ...returForm, satuan: e.target.value })}
                      placeholder="Unit/Box"
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alasan Retur</label>
                <select
                  value={returForm.alasanRetur}
                  onChange={(e) => setReturForm({ ...returForm, alasanRetur: e.target.value as ProdukKembalian['alasanRetur'] })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Cacat Kemasan">Cacat Kemasan Saat Pengiriman</option>
                  <option value="Salah Kirim">Salah Kirim Spesifikasi / Tipe</option>
                  <option value="Mendekati Kedaluwarsa">Mendekati Kedaluwarsa</option>
                  <option value="Dugaan Kerusakan Fungsi">Dugaan Kerusakan Fungsi / Keluhan User</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Pemeriksaan Awal QA</label>
                <textarea
                  rows={2}
                  value={returForm.catatanInspeksiQA}
                  onChange={(e) => setReturForm({ ...returForm, catatanInspeksiQA: e.target.value })}
                  placeholder="Catatan kondisi fisik saat diterima di pintu masuk..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReturModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold"
                >
                  Masuk Karantina
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Laporan Resmi Audit Internal ISO 13485 */}
      <AuditReportModal
        audit={selectedAuditForModal}
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />

    </div>
  );
}
