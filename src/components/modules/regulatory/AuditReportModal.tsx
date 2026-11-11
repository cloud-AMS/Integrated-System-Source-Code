/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * coded by Langgo Bramandityo
 * 
 * Modal Tampilan & Cetak Laporan Resmi Audit Internal ISO 13485:2016 & CDAKB
 */

import { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  ShieldCheck, 
  FileText,
  Calendar,
  UserCheck
} from 'lucide-react';
import type { AuditInternalIso13485 } from '../../../types';
import { unduhAuditInternalCsv } from '../../../utils/auditInternalIso13485';

interface AuditReportModalProps {
  audit: AuditInternalIso13485 | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AuditReportModal({ audit, isOpen, onClose }: AuditReportModalProps) {
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'klausul' | 'dokumen'>('ringkasan');

  if (!isOpen || !audit) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    unduhAuditInternalCsv(audit);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Dialog */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-800 no-print">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-2xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                  {audit.nomorAudit}
                </span>
                <span className="text-2xs text-slate-400">{audit.lingkup}</span>
              </div>
              <h3 className="font-bold text-sm text-white mt-0.5">
                Laporan Resmi Audit Internal ISO 13485:2016 & CDAKB
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Unduh berkas CSV"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Unduh CSV</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Laporan</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer ml-1"
              title="Tutup dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Sub-navigasi */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-xs shrink-0 no-print">
          <button
            type="button"
            onClick={() => setActiveTab('ringkasan')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'ringkasan'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            Ringkasan & KOP Resmi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('klausul')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'klausul'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            Evaluasi Klausul ISO 13485 ({audit.klausulAudit.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dokumen')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'dokumen'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            Daftar Uji Dokumen ({audit.daftarPemeriksaanDokumen.length})
          </button>
        </div>

        {/* Konten Dokumen Siap Cetak */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex justify-center">
          <div className="bg-white text-slate-900 w-full max-w-3xl p-6 sm:p-8 rounded-xl shadow-xs border border-slate-300 font-sans text-xs leading-relaxed print:m-0 print:p-0 print:shadow-none print:border-none">
            
            {/* KOP SURAT PERUSAHAAN */}
            <div className="border-b-2 border-slate-900 pb-3 mb-4 text-center">
              <h2 className="text-base font-extrabold tracking-wide uppercase text-slate-900">
                PT ANUGRAH MITRA SELARAS (AMS)
              </h2>
              <p className="text-xs text-slate-700 font-medium">
                Penyalur Alat Kesehatan Berizin Kemenkes RI • Sertifikat Distribusi (SDAK) No: SDAK-91203049201940001
              </p>
              <p className="text-2xs text-slate-500">
                Sertifikat ISO 13485:2016 No: ID-MD-13485-882194 • Sertifikat CPAKB Kemenkes RI No: CPAKB-FK-0284/2023
              </p>
              <p className="text-2xs text-slate-400 mt-0.5">
                Kawasan Industri Medis Cikarang Blok B-12, Bekasi, Jawa Barat | Telepon: (021) 8990-2134 | Email: pjt@anugrahmitraselaras.co.id
              </p>
            </div>

            {/* Judul & Metadata Laporan */}
            <div className="text-center mb-5">
              <span className="text-2xs font-bold tracking-widest text-indigo-700 uppercase bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200 inline-block mb-1">
                DOKUMEN RESMI SISTEM MANAJEMEN MUTU ALAT KESEHATAN
              </span>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 uppercase">
                LAPORAN HASIL AUDIT INTERNAL SISTEM MANAJEMEN MUTU (SMM)
              </h1>
              <p className="text-xs text-slate-600 font-mono mt-0.5">
                Nomor Kontrol Dokumen: <strong className="text-slate-900">{audit.nomorAudit}</strong>
              </p>
            </div>

            {/* Kartu Ringkasan Eksekutif & Metadata */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 space-y-2.5 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-slate-200 pb-3">
                <div>
                  <span className="text-2xs text-slate-500 block">Lingkup Audit:</span>
                  <span className="font-semibold text-slate-900">{audit.lingkup}</span>
                </div>
                <div>
                  <span className="text-2xs text-slate-500 block">Tanggal Audit:</span>
                  <span className="font-semibold text-slate-900">{audit.tanggalAudit}</span>
                </div>
                <div>
                  <span className="text-2xs text-slate-500 block">Lead Auditor ISO 13485:</span>
                  <span className="font-semibold text-slate-900">{audit.auditorLead}</span>
                </div>
                <div>
                  <span className="text-2xs text-slate-500 block">Auditee / Bagian:</span>
                  <span className="font-semibold text-slate-900">{audit.auditee}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100">
                  <span className="text-2xs text-indigo-700 block font-medium">Indeks Kepatuhan</span>
                  <span className="text-lg font-extrabold text-indigo-900">{audit.skorKepatuhan}%</span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                  <span className="text-2xs text-emerald-700 block font-medium">Dokumen Sesuai</span>
                  <span className="text-lg font-extrabold text-emerald-800">{audit.dokumenSesuai} Berkas</span>
                </div>
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-100">
                  <span className="text-2xs text-amber-700 block font-medium">Temuan Minor NC</span>
                  <span className="text-lg font-extrabold text-amber-800">{audit.temuanMinor} Catatan</span>
                </div>
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-100">
                  <span className="text-2xs text-rose-700 block font-medium">Temuan Mayor NC</span>
                  <span className="text-lg font-extrabold text-rose-800">{audit.temuanMajor} Kritis</span>
                </div>
              </div>

              <div className="pt-2 text-slate-700 leading-relaxed">
                <strong className="text-slate-900 block mb-0.5">Uraian Ringkasan Eksekutif:</strong>
                {audit.ringkasanEksekutif}
              </div>
            </div>

            {/* BAGIAN 1: Ringkasan & Kesimpulan */}
            {activeTab === 'ringkasan' && (
              <div className="space-y-4">
                <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Kesimpulan & Status Kepatuhan Audit
                  </h4>
                  <p className="text-slate-700 leading-relaxed bg-emerald-50/60 p-3 rounded-lg border border-emerald-200 font-medium">
                    {audit.kesimpulan}
                  </p>
                  <p className="text-2xs text-slate-500 italic mt-1">
                    * Berdasarkan pemantauan otomatis kesesuaian dokumen dengan klausul ISO 13485:2016 (4.2.4, 4.2.5, 7.4.3, 7.5.8, 8.2.4, 8.2.6, 8.3, 8.5.2) serta CDAKB Permenkes RI No. 4/2014.
                  </p>
                </div>

                {/* Ringkasan Temuan Cepat */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs">Ringkasan Klausul ISO 13485 yang Diaudit:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {audit.klausulAudit.map((k) => (
                      <div key={k.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-indigo-800 text-2xs">Klausul {k.klausul}</span>
                          <span className={`text-3xs font-bold px-2 py-0.5 rounded ${
                            k.status === 'Sesuai'
                              ? 'bg-emerald-100 text-emerald-800'
                              : k.status === 'Minor NC'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {k.status} ({k.persentaseKepatuhan}%)
                          </span>
                        </div>
                        <div className="font-semibold text-slate-900 text-xs">{k.judulKlausul}</div>
                        <p className="text-2xs text-slate-600 leading-tight">{k.catatanEvaluasi}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* BAGIAN 2: Detail Evaluasi Klausul */}
            {activeTab === 'klausul' && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-xs mb-2">Matriks Kepatuhan Klausul Standar:</h4>
                {audit.klausulAudit.map((k) => (
                  <div key={k.id} className="p-3.5 border border-slate-200 rounded-xl bg-white space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div>
                        <span className="font-mono font-bold text-indigo-700 text-xs mr-2">Klausul {k.klausul}</span>
                        <span className="font-bold text-slate-900 text-xs">{k.judulKlausul}</span>
                      </div>
                      <span className={`text-2xs font-bold px-2.5 py-0.5 rounded ${
                        k.status === 'Sesuai'
                          ? 'bg-emerald-100 text-emerald-800'
                          : k.status === 'Minor NC'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {k.status} • Kepatuhan {k.persentaseKepatuhan}%
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">
                      {k.catatanEvaluasi}
                    </p>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-2xs space-y-1">
                      <div className="text-slate-600">
                        <strong>Dokumen Diperiksa:</strong> {k.dokumenDiperiksa.join(', ')}
                      </div>
                      {k.rekomendasiTindakan && (
                        <div className="text-indigo-800 font-medium">
                          <strong>Rekomendasi Tindakan:</strong> {k.rekomendasiTindakan}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* BAGIAN 3: Daftar Uji Dokumen Terperinci */}
            {activeTab === 'dokumen' && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-xs mb-2">
                  Daftar Pengujian Dokumen & Rekaman ({audit.daftarPemeriksaanDokumen.length} Berkas):
                </h4>
                
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-2xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                        <th className="py-2.5 px-3">Kode & Judul Dokumen</th>
                        <th className="py-2.5 px-3">Kategori & Klausul</th>
                        <th className="py-2.5 px-3">Parameter Uji</th>
                        <th className="py-2.5 px-3">Skor & Temuan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {audit.daftarPemeriksaanDokumen.map((doc) => (
                        <tr key={doc.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3">
                            <div className="font-mono font-bold text-indigo-800">{doc.kodeDokumen}</div>
                            <div className="text-slate-900 font-medium">{doc.judulDokumen}</div>
                            <div className="text-3xs text-slate-500 mt-0.5">{doc.catatanAudit}</div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            <div>{doc.kategori}</div>
                            <div className="font-mono text-3xs text-indigo-700">{doc.klausulIso}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-wrap gap-1">
                              <span className={`px-1.5 py-0.5 rounded text-3xs font-semibold ${
                                doc.parameterUji.kontrolNomorRevisi ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                Revisi {doc.parameterUji.kontrolNomorRevisi ? '✓' : '✗'}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-3xs font-semibold ${
                                doc.parameterUji.otoritasPengesahan ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                Pengesahan {doc.parameterUji.otoritasPengesahan ? '✓' : '✗'}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-3xs font-semibold ${
                                doc.parameterUji.ketelusuranBatchAlkes ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                Telusur {doc.parameterUji.ketelusuranBatchAlkes ? '✓' : '✗'}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-3xs font-bold inline-block ${
                              doc.statusKesesuaian === 'Sesuai (Compliant)'
                                ? 'bg-emerald-100 text-emerald-800'
                                : doc.statusKesesuaian === 'Minor NC'
                                ? 'bg-amber-100 text-amber-800'
                                : doc.statusKesesuaian === 'Major NC'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {doc.statusKesesuaian} ({doc.skor}%)
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Kolom Tanda Tangan Resmi ISO 13485 */}
            <div className="mt-8 pt-4 border-t-2 border-slate-200 grid grid-cols-3 gap-4 text-center text-xs">
              <div>
                <p className="text-2xs text-slate-500 mb-8">Disiapkan Oleh (Auditee):</p>
                <div className="font-bold text-slate-900 border-b border-slate-300 pb-1">
                  {audit.auditee.split('&')[0].trim()}
                </div>
                <p className="text-2xs text-slate-500 mt-1">Personil Terkait</p>
              </div>

              <div>
                <p className="text-2xs text-slate-500 mb-8">Diperiksa Oleh (Lead Auditor):</p>
                <div className="font-bold text-slate-900 border-b border-slate-300 pb-1">
                  {audit.auditorLead.split('(')[0].trim()}
                </div>
                <p className="text-2xs text-slate-500 mt-1">Lead Auditor ISO 13485</p>
              </div>

              <div>
                <p className="text-2xs text-slate-500 mb-8">Disetujui & Disahkan (PJT):</p>
                <div className="font-bold text-indigo-900 border-b border-slate-300 pb-1">
                  apt. Dewi Kartika, S.Si
                </div>
                <p className="text-2xs text-slate-500 mt-1">Penanggung Jawab Teknis (PJT)</p>
              </div>
            </div>

            {/* Catatan Kaki Integritas ALCOA+ */}
            <div className="mt-6 pt-3 border-t border-slate-200 text-2xs text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-1">
              <span>Dicetak secara elektronik dari AMS Integrated System • Kode: AMS-SMM-AUD-13485</span>
              <span className="font-mono">Integritas ALCOA+ Terverifikasi Digital</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
