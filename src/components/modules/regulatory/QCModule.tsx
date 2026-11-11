import { useState } from 'react';
import { db } from '../../../services/pocketbase';
import { InspeksiQC, AuditInternalIso13485, DetailPemeriksaanDokumen } from '../../../types';
import { 
  CheckCircle2, 
  Plus, 
  Search, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Calendar,
  FileCheck,
  ShieldAlert,
  ShieldCheck,
  Printer,
  Download,
  Play,
  Check,
  X,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import AuditReportModal from './AuditReportModal';
import { unduhAuditInternalCsv } from '../../../utils/auditInternalIso13485';

export default function QCModule() {
  const [activeTab, setActiveTab] = useState<'inspeksi' | 'audit-iso'>('inspeksi');
  const [inspeksiList, setInspeksiList] = useState<InspeksiQC[]>(db.getInspeksiQC());
  const [auditList, setAuditList] = useState<AuditInternalIso13485[]>(() => db.getAuditInternal('QC'));
  const [searchQuery, setSearchQuery] = useState('');
  const [filterHasil, setFilterHasil] = useState<string>('semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAuditForModal, setSelectedAuditForModal] = useState<AuditInternalIso13485 | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [auditNotice, setAuditNotice] = useState<string | null>(null);

  // Filter untuk Tab Audit Internal QC
  const [filterTemuanAudit, setFilterTemuanAudit] = useState<string>('semua');
  const [filterKlausulAudit, setFilterKlausulAudit] = useState<string>('semua');
  const [searchAudit, setSearchAudit] = useState('');

  // Audit terkini
  const auditTerkini = auditList[0] || null;

  // New QC Form
  const [formData, setFormData] = useState<Partial<InspeksiQC>>({
    jenisInspeksi: 'Barang Masuk Gudang',
    namaBarang: '',
    nomorBatch: '',
    jumlahDiperiksa: 10,
    tanggalInspeksi: new Date().toISOString().split('T')[0],
    inspektur: 'Hendra Setiawan (QC Officer)',
    kondisiFisik: 'Baik & Utuh',
    kebersihan: 'Memenuhi Syarat',
    tanggalKedaluwarsa: '2028-12-31',
    hasilPemeriksaan: 'Lolos (Released)',
    catatanPJT: 'Label bahasa Indonesia dan nomor izin edar Kemenkes RI terverifikasi.'
  });

  const handleJalankanAuditOtomatisQC = () => {
    setIsScanning(true);
    setAuditNotice('Memulai pemindaian otomatis kesesuaian dokumen QC dengan ISO 13485:2016...');

    setTimeout(() => {
      const hasil = db.jalankanAuditOtomatisQC();
      setAuditList(db.getAuditInternal('QC'));
      setIsScanning(false);
      setAuditNotice(`Audit kepatuhan QC selesai! Indeks Kepatuhan: ${hasil.skorKepatuhan}% (${hasil.dokumenSesuai} Berkas Sesuai, ${hasil.temuanMinor} Minor NC, ${hasil.temuanMajor} Mayor NC).`);
      setTimeout(() => setAuditNotice(null), 8000);
    }, 600);
  };

  const filtered = inspeksiList.filter(item => {
    const matchSearch = item.namaBarang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nomorBatch.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nomorLaporan.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterHasil === 'semua') return matchSearch;
    return matchSearch && item.hasilPemeriksaan.includes(filterHasil);
  });

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

  const handleSaveQC = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaBarang || !formData.nomorBatch) return;

    const newItem: InspeksiQC = {
      id: 'QC-' + Date.now(),
      nomorLaporan: `QC/IN/2024/05/${String(inspeksiList.length + 1).padStart(3, '0')}`,
      jenisInspeksi: formData.jenisInspeksi as InspeksiQC['jenisInspeksi'],
      namaBarang: formData.namaBarang || '',
      nomorBatch: formData.nomorBatch || '',
      jumlahDiperiksa: Number(formData.jumlahDiperiksa) || 1,
      tanggalInspeksi: formData.tanggalInspeksi || new Date().toISOString().split('T')[0],
      inspektur: formData.inspektur || 'QC Team',
      kondisiFisik: formData.kondisiFisik as InspeksiQC['kondisiFisik'],
      kebersihan: formData.kebersihan as InspeksiQC['kebersihan'],
      tanggalKedaluwarsa: formData.tanggalKedaluwarsa || '2028-12-31',
      hasilPemeriksaan: formData.hasilPemeriksaan as InspeksiQC['hasilPemeriksaan'],
      catatanPJT: formData.catatanPJT || 'Memenuhi syarat rilis CDAKB.'
    };

    db.addInspeksiQC(newItem);
    setInspeksiList(db.getInspeksiQC());
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
              Pengawasan Mutu
            </span>
            <span className="text-xs text-slate-500">Klausul 7.4.3, 7.5.8, 8.2.6 ISO 13485 & Bab IV CDAKB</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Quality Control (QC) / Pengawasan Mutu
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Pemeriksaan sampling fisik alkes masuk dan pra-kirim, audit kepatuhan dokumen pengujian mutu otomatis ISO 13485:2016, integritas catatan batch ALCOA+, dan verifikasi pelepasan produk ke peredaran.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === 'audit-iso' && (
            <>
              <button
                type="button"
                onClick={handleJalankanAuditOtomatisQC}
                disabled={isScanning}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                {isScanning ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Memindai Rekaman QC...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Jalankan Audit Otomatis QC</span>
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

          {activeTab === 'inspeksi' && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Catat Inspeksi QC Baru
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs overflow-x-auto [scrollbar-width:none]">
        <button
          type="button"
          onClick={() => setActiveTab('inspeksi')}
          className={`pb-3 px-3 font-semibold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'inspeksi'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Pemeriksaan Batch QC ({inspeksiList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit-iso')}
          className={`pb-3 px-3 font-semibold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'audit-iso'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Audit Kepatuhan QC & ISO 13485 ({auditList.length})
        </button>
      </div>

      {/* Notice Banner */}
      {auditNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{auditNotice}</span>
          </div>
          <button 
            type="button"
            onClick={() => setAuditNotice(null)}
            className="text-emerald-400 hover:text-emerald-700 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tab 2: Audit Kepatuhan QC & ISO 13485 */}
      {activeTab === 'audit-iso' && (
        <div className="space-y-6">
          
          {/* Audit Metrics Overview */}
          {auditTerkini && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block font-medium">Indeks Kepatuhan QC</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl font-black text-emerald-700">{auditTerkini.skorKepatuhan}%</span>
                    <span className="text-2xs font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                      Compliant
                    </span>
                  </div>
                  <span className="text-3xs text-slate-400 mt-1 block">
                    Klausul 7.4.3 & 8.2.6
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block font-medium">Berkas QC Terverifikasi</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl font-black text-slate-900">{auditTerkini.dokumenSesuai}</span>
                    <span className="text-2xs text-slate-500">/ {auditTerkini.totalDokumenDiperiksa} Rekaman</span>
                  </div>
                  <span className="text-3xs text-slate-400 mt-1 block">
                    100% Attributable ALCOA+
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <FileCheck className="w-5 h-5" />
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
                    Status: {auditTerkini.status}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block font-medium">Temuan Mayor / Cacat Kritis</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl font-black text-rose-700">{auditTerkini.temuanMajor}</span>
                    <span className="text-2xs text-slate-400">Temuan</span>
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

          {/* Matriks Klausul ISO 13485 QC */}
          {auditTerkini && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Matriks Kepatuhan Klausul QC ISO 13485:2016
                  </h3>
                  <p className="text-2xs text-slate-500">
                    Evaluasi otomatis verifikasi sampling barang masuk, ketelusuran lot, kriteria rilis alkes, dan segregasi karantina.
                  </p>
                </div>
                <div className="text-2xs text-slate-500">
                  Lead Auditor: <strong className="text-slate-800">{auditTerkini.auditorLead}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {auditTerkini.klausulAudit.map((klausul) => (
                  <div key={klausul.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-emerald-800 text-xs">Klausul {klausul.klausul}</span>
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

                    {/* Progress Bar */}
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

          {/* Table Container: Pemeriksaan Dokumen QC */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            
            {/* Header Table & Controls */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">Hasil Audit Dokumen & Rekaman QC</span>
                <span className="text-2xs text-slate-500 font-mono">({daftarUjiTerfilter.length} Berkas Diuji)</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchAudit}
                    onChange={(e) => setSearchAudit(e.target.value)}
                    placeholder="Cari nomor laporan/batch/barang..."
                    className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs w-52 text-slate-800"
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
                  <option value="semua">Semua Klausul QC</option>
                  <option value="7.4.3">Klausul 7.4.3 (Sampling Masuk)</option>
                  <option value="7.5.8">Klausul 7.5.8 (Ketelusuran)</option>
                  <option value="8.2.6">Klausul 8.2.6 (Pengujian Mutu)</option>
                  <option value="8.3">Klausul 8.3 (Karantina)</option>
                </select>

                {auditTerkini && (
                  <button
                    type="button"
                    onClick={() => unduhAuditInternalCsv(auditTerkini)}
                    className="p-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 transition-colors cursor-pointer"
                    title="Unduh CSV"
                  >
                    <Download className="w-4 h-4 text-emerald-600" />
                  </button>
                )}
              </div>
            </div>

            {/* Table Records */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <th className="py-3 px-4">No. Laporan & Dokumen</th>
                    <th className="py-3 px-4">Kategori & Klausul</th>
                    <th className="py-3 px-4">Parameter Kepatuhan QC</th>
                    <th className="py-3 px-4">Catatan Evaluasi Auditor</th>
                    <th className="py-3 px-4 text-center">Status Kesesuaian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {daftarUjiTerfilter.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-emerald-800 text-xs">{doc.kodeDokumen}</div>
                        <div className="font-medium text-slate-900">{doc.judulDokumen}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="font-medium">{doc.kategori}</div>
                        <div className="font-mono text-2xs text-emerald-700 font-semibold">{doc.klausulIso}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 text-2xs">
                          <span className={`flex items-center gap-1 ${
                            doc.parameterUji.kontrolNomorRevisi ? 'text-emerald-700 font-medium' : 'text-rose-600 font-bold'
                          }`}>
                            {doc.parameterUji.kontrolNomorRevisi ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                            Format Laporan Terdaftar
                          </span>
                          <span className={`flex items-center gap-1 ${
                            doc.parameterUji.otoritasPengesahan ? 'text-emerald-700 font-medium' : 'text-rose-600 font-bold'
                          }`}>
                            {doc.parameterUji.otoritasPengesahan ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                            Inspektur & PJT Berwenang
                          </span>
                          <span className={`flex items-center gap-1 ${
                            doc.parameterUji.ketelusuranBatchAlkes ? 'text-emerald-700 font-medium' : 'text-rose-600 font-bold'
                          }`}>
                            {doc.parameterUji.ketelusuranBatchAlkes ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                            Ketelusuran Batch & ED Valid
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs leading-relaxed text-2xs">
                        <p>{doc.catatanAudit}</p>
                        {doc.tindakanPerbaikan && (
                          <p className="text-emerald-800 font-medium mt-1">
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Arsip Riwayat Laporan Audit QC */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Arsip Laporan Audit Kepatuhan QC ISO 13485:2016
              </h3>
              <span className="text-2xs text-slate-500">Retensi Dokumen Wajib 5 Tahun (CDAKB)</span>
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
                        <div className="font-mono font-bold text-emerald-800 text-xs">{aud.nomorAudit}</div>
                        <div className="text-2xs text-slate-500">{aud.tanggalAudit}</div>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900 max-w-xs">{aud.judulAudit}</td>
                      <td className="py-2.5 px-3 text-slate-600 text-2xs">{aud.auditorLead}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-emerald-700">{aud.skorKepatuhan}%</span>
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
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-2xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
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

      {/* Tab 1: Pemeriksaan Batch QC */}
      {activeTab === 'inspeksi' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-500 block font-medium">Lolos QC (Released)</span>
                <span className="text-xl font-bold text-emerald-700">
                  {inspeksiList.filter(i => i.hasilPemeriksaan.includes('Lolos')).length} Batch
                </span>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-500/30" />
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-500 block font-medium">Karantina Pengujian (Hold)</span>
                <span className="text-xl font-bold text-amber-700">
                  {inspeksiList.filter(i => i.hasilPemeriksaan.includes('Karantina')).length} Batch
                </span>
              </div>
              <Clock className="w-8 h-8 text-amber-500/30" />
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-500 block font-medium">Tolak (Rejected)</span>
                <span className="text-xl font-bold text-rose-700">
                  {inspeksiList.filter(i => i.hasilPemeriksaan.includes('Tolak')).length} Batch
                </span>
              </div>
              <XCircle className="w-8 h-8 text-rose-500/30" />
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            
            {/* Controls */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="relative max-w-sm w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari laporan QC, batch, atau nama barang..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500">Filter Hasil:</span>
                <select
                  value={filterHasil}
                  onChange={(e) => setFilterHasil(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="semua">Semua Hasil</option>
                  <option value="Lolos">Lolos (Released)</option>
                  <option value="Karantina">Karantina (Hold)</option>
                  <option value="Tolak">Tolak (Rejected)</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <th className="py-3 px-4">No. Laporan & Tanggal</th>
                    <th className="py-3 px-4">Nama Alkes / Bahan</th>
                    <th className="py-3 px-4">Nomor Batch</th>
                    <th className="py-3 px-4">Jml Diperiksa</th>
                    <th className="py-3 px-4">Kondisi & Kebersihan</th>
                    <th className="py-3 px-4">Kedaluwarsa</th>
                    <th className="py-3 px-4">Hasil Rilis QC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <div className="font-mono text-emerald-800">{item.nomorLaporan}</div>
                        <div className="text-2xs text-slate-500">{item.tanggalInspeksi} • {item.jenisInspeksi}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{item.namaBarang}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{item.nomorBatch}</td>
                      <td className="py-3 px-4 font-medium">{item.jumlahDiperiksa} Sampel</td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{item.kondisiFisik}</div>
                        <div className="text-2xs text-slate-500">{item.kebersihan}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">{item.tanggalKedaluwarsa}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-2xs font-bold ${
                          item.hasilPemeriksaan.includes('Lolos')
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : item.hasilPemeriksaan.includes('Karantina')
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {item.hasilPemeriksaan}
                        </span>
                        <div className="text-2xs text-slate-500 mt-1">Oleh: {item.inspektur}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add QC */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base text-slate-900 mb-1">
              Catat Hasil Pemeriksaan Mutu (QC)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Pemeriksaan fisik alkes berdasarkan nomor batch dan parameter standar CDAKB.
            </p>

            <form onSubmit={handleSaveQC} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tahap Inspeksi</label>
                <select
                  value={formData.jenisInspeksi}
                  onChange={(e) => setFormData({ ...formData, jenisInspeksi: e.target.value as InspeksiQC['jenisInspeksi'] })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Barang Masuk Gudang">Barang Masuk Gudang (Incoming Device)</option>
                  <option value="Bahan Baku Datang">Bahan Baku Datang (Raw Material)</option>
                  <option value="Produk Jadi Manufaktur">Produk Jadi Manufaktur (Finished Good)</option>
                  <option value="Pemeriksaan Pra-Kirim">Pemeriksaan Pra-Kirim (Pre-Dispatch)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Alat Kesehatan / Bahan</label>
                <input
                  type="text"
                  required
                  value={formData.namaBarang}
                  onChange={(e) => setFormData({ ...formData, namaBarang: e.target.value })}
                  placeholder="Contoh: Reagen Rapid Test Dengue NS1"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Batch / Lot</label>
                  <input
                    type="text"
                    required
                    value={formData.nomorBatch}
                    onChange={(e) => setFormData({ ...formData, nomorBatch: e.target.value })}
                    placeholder="LOT-2024-..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jumlah Diperiksa (Sampling)</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.jumlahDiperiksa}
                    onChange={(e) => setFormData({ ...formData, jumlahDiperiksa: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kondisi Kemasan Fisik</label>
                  <select
                    value={formData.kondisiFisik}
                    onChange={(e) => setFormData({ ...formData, kondisiFisik: e.target.value as InspeksiQC['kondisiFisik'] })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Baik & Utuh">Baik & Utuh (Segel Rapat)</option>
                    <option value="Kemasan Rusak">Kemasan Rusak / Basah</option>
                    <option value="Label Tidak Jelas">Label / NIE Tidak Jelas</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kebersihan</label>
                  <select
                    value={formData.kebersihan}
                    onChange={(e) => setFormData({ ...formData, kebersihan: e.target.value as InspeksiQC['kebersihan'] })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Memenuhi Syarat">Memenuhi Syarat (Bebas Debu/Kotoran)</option>
                    <option value="Tercemar">Tercemar / Debu Berlebih</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Kedaluwarsa (ED)</label>
                  <input
                    type="date"
                    value={formData.tanggalKedaluwarsa}
                    onChange={(e) => setFormData({ ...formData, tanggalKedaluwarsa: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Keputusan Rilis QC</label>
                  <select
                    value={formData.hasilPemeriksaan}
                    onChange={(e) => setFormData({ ...formData, hasilPemeriksaan: e.target.value as InspeksiQC['hasilPemeriksaan'] })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold text-emerald-800"
                  >
                    <option value="Lolos (Released)">Lolos (Released) - Siap Edar</option>
                    <option value="Karantina (Hold)">Karantina (Hold) - Butuh Uji Lanjut</option>
                    <option value="Tolak (Rejected)">Tolak (Rejected) - Musnah/Retur</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan PJT / Inspektur</label>
                <input
                  type="text"
                  value={formData.catatanPJT}
                  onChange={(e) => setFormData({ ...formData, catatanPJT: e.target.value })}
                  placeholder="Catatan penandaan bahasa Indonesia & buku manual..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs cursor-pointer"
                >
                  Simpan Hasil QC
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
