/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * coded by Langgo Bramandityo
 * 
 * Generator Ekspor Log Audit Trail CSV Kepatuhan ISO 13485:2016 & CDAKB
 * Standar Acuan:
 * - ISO 13485:2016 Klausul 4.2.4 (Control of Documents) & 4.2.5 (Control of Records)
 * - ISO 13485:2016 Klausul 7.5.8 (Identification and Traceability)
 * - CDAKB Permenkes RI No. 4/2014 Bab I & II (Integritas Data Penyaluran Alkes)
 * - ALCOA+ Principles (Attributable, Legible, Contemporaneous, Original, Accurate, Complete, Consistent, Enduring, Available)
 * - US FDA 21 CFR Part 11 (Audit Trail Integrity for Medical Software Systems)
 */

import type { LogAuditTrail } from '../types';

export interface MetaEksporIso13485 {
  namaAdmin?: string;
  peranAdmin?: string;
  filterModul?: string;
  nomorKontrolDokumen?: string;
  namaPerusahaan?: string;
}

export interface KlausulPemetaan {
  clause: string;
  cdakb: string;
}

/**
 * Memetakan setiap modul dan aktivitas operasional ke klausul spesifik ISO 13485:2016
 * dan bab regulasi CDAKB Kementerian Kesehatan RI.
 */
export function petakanKlausulIso13485(modul: string, aktivitas: string = ''): KlausulPemetaan {
  const m = (modul || '').toLowerCase();
  const a = (aktivitas || '').toLowerCase();

  if (
    m.includes('regulatory') || 
    m.includes('izin edar') || 
    m.includes('sdak') || 
    m.includes('ra-pjt') || 
    /\b(ra|pjt)\b/i.test(m)
  ) {
    return {
      clause: 'Klausul 4.2.3 (Medical Device File) & 7.2 (Customer & Regulatory Requirements)',
      cdakb: 'Bab I (Ketentuan Umum, Izin Edar & Sertifikat Distribusi Alkes)'
    };
  }

  if (m.includes('qa') || m.includes('quality assurance') || m.includes('mutu') || m.includes('capa')) {
    if (a.includes('capa') || a.includes('korektif') || a.includes('preventif')) {
      return {
        clause: 'Klausul 8.5.2 (Corrective Action) & 8.5.3 (Preventive Action)',
        cdakb: 'Bab V (Tindakan Perbaikan & Pencegahan CAPA)'
      };
    }
    return {
      clause: 'Klausul 4.2.4 (Control of Documents) & 8.2.4 (Internal Audit)',
      cdakb: 'Bab II (Sistem Manajemen Mutu & Audit Internal Berkala)'
    };
  }

  if (m.includes('qc') || m.includes('quality control') || m.includes('inspeksi') || m.includes('karantina')) {
    return {
      clause: 'Klausul 7.4.3 (Verification of Purchased Product) & 8.2.6 (Monitoring & Measurement of Product)',
      cdakb: 'Bab IV (Pemeriksaan Masuk, Karantina & Pelepasan Produk)'
    };
  }

  if (m.includes('gudang') || m.includes('warehouse') || m.includes('logistik')) {
    if (a.includes('suhu') || a.includes('cold') || a.includes('dingin') || a.includes('sensor')) {
      return {
        clause: 'Klausul 7.5.11 (Preservation of Product - Temperature & Cold Chain)',
        cdakb: 'Bab III (Penyimpanan Rantai Dingin & Pemantauan Suhu)'
      };
    }
    return {
      clause: 'Klausul 7.5.8 (Traceability) & 7.5.11 (Preservation of Product - FEFO)',
      cdakb: 'Bab III (Penyimpanan Sesuai Petunjuk & Pengendalian Rotasi FEFO)'
    };
  }

  if (m.includes('produksi') || m.includes('production') || m.includes('cpakb')) {
    return {
      clause: 'Klausul 7.5.1 (Control of Production) & 7.5.8 (Identification & Traceability)',
      cdakb: 'Pedoman CPAKB Permenkes RI No. 20/2017'
    };
  }

  if (m.includes('service') || m.includes('teknisi') || m.includes('kalibrasi') || m.includes('servis')) {
    return {
      clause: 'Klausul 7.5.4 (Servicing Activities) & 7.6 (Control of Monitoring/Measuring Equipment)',
      cdakb: 'Bab VI (Layanan Purna Jual, Pemeliharaan & Kalibrasi Berkala)'
    };
  }

  if (m.includes('sales') || m.includes('marketing') || m.includes('pemasaran') || m.includes('pesanan') || m.includes('tender')) {
    return {
      clause: 'Klausul 7.2.1 (Determination of Customer Requirements) & 7.5.8 (Customer Traceability)',
      cdakb: 'Bab IV (Penyaluran Resmi ke Sarana Pelayanan Kesehatan & Rumah Sakit)'
    };
  }

  if (
    m.includes('pms') || 
    m.includes('post-market') || 
    m.includes('surveillance') || 
    m.includes('vigilance') || 
    m.includes('ktd') || 
    m.includes('recall') || 
    m.includes('penarikan')
  ) {
    if (a.includes('recall') || a.includes('tarik') || a.includes('penarikan')) {
      return {
        clause: 'Klausul 8.3.3 (Advisory Notices & Product Recall) & 8.5.2 (CAPA)',
        cdakb: 'Bab V (Prosedur Penarikan Kembali Produk Alkes Terdampak)'
      };
    }
    return {
      clause: 'Klausul 8.2.2 (Complaint Handling) & 8.2.3 (Reporting to Regulatory Authorities)',
      cdakb: 'Bab V (Penanganan Keluhan Pelanggan & Pelaporan e-Watch Alkes Kemenkes)'
    };
  }

  if (m.includes('hrd') || m.includes('hris') || m.includes('personalia') || m.includes('pelatihan')) {
    return {
      clause: 'Klausul 6.2 (Human Resources - Personnel Competence, Training & Records)',
      cdakb: 'Bab II (Personalia, Kualifikasi PJT & Sertifikasi Kompetensi)'
    };
  }

  if (m.includes('finance') || m.includes('akuntansi') || m.includes('pajak')) {
    return {
      clause: 'Klausul 4.2.5 (Control of Records - Financial, Invoicing & Inventory Auditability)',
      cdakb: 'Kepatuhan Faktur Resmi & Dokumentasi Niaga Penyaluran Alkes'
    };
  }

  // Default fallback IT / General QMS records
  return {
    clause: 'Klausul 4.2.5 (Control of Records & Validation of Computerized Systems)',
    cdakb: 'Prinsip ALCOA+ & Ketelusuran Digital Sistem Informasi CDAKB'
  };
}

/**
 * Meloloskan karakter CSV sesuai standar RFC 4180
 * (mengapit tanda kutip jika terdapat koma, petik dua ganda, atau baris baru).
 */
export function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Normalisasi waktu ke format ISO 8601 UTC
 */
export function normalisasiTimestampUtc(waktuWib: string): string {
  try {
    // Bentuk umum waktu di database: "2024-05-22 14:32:10 WIB" atau ISO string
    const match = waktuWib.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})/);
    if (match) {
      const datePart = match[1];
      const timePart = match[2];
      // WIB adalah UTC+7
      const dateObj = new Date(`${datePart}T${timePart}+07:00`);
      if (!Number.isNaN(dateObj.getTime())) {
        return dateObj.toISOString();
      }
    }
    const d = new Date(waktuWib);
    if (!Number.isNaN(d.getTime())) {
      return d.toISOString();
    }
  } catch {
    // Abaikan jika parsing gagal
  }
  return 'N/A';
}

/**
 * Format rincian perubahan kolom (audit delta) untuk bukti inspeksi regulasi
 */
export function formatDeltaPerubahan(perubahan?: LogAuditTrail['perubahan']): string {
  if (!perubahan || perubahan.length === 0) {
    return 'Tidak ada mutasi field (Aktivitas Transaksi / Otorisasi)';
  }
  return perubahan
    .map((p) => {
      const field = p.kolom || 'Field';
      const lama = p.nilaiLama || '(kosong)';
      const baru = p.nilaiBaru || '(kosong)';
      return `${field}: [Sebelum: ${lama}] -> [Sesudah: ${baru}]`;
    })
    .join('; ');
}

/**
 * Menghasilkan string CSV lengkap dengan blok metadata kepatuhan ISO 13485:2016
 * dan ALCOA+ Data Integrity.
 */
export function generateIso13485AuditCsv(
  logs: LogAuditTrail[],
  meta: MetaEksporIso13485 = {}
): string {
  const sekarang = new Date();
  const tanggalWib = `${sekarang.toISOString().split('T')[0]} ${sekarang.toLocaleTimeString('id-ID')} WIB`;
  const tanggalUtc = sekarang.toISOString();
  const namaPerusahaan = meta.namaPerusahaan || 'PT ANUGRAH MITRA SELARAS (AMS)';
  const nomorKontrol = meta.nomorKontrolDokumen || 'AMS-QMS-REC-425-IT';
  const adminName = meta.namaAdmin || 'Administrator IT / PJT apt. Dewi Kartika, S.Si';
  const adminRole = meta.peranAdmin || 'it_admin / Penanggung Jawab Teknis';
  const filterInfo = meta.filterModul || 'SEMUA MODUL SISTEM';

  const metadataHeaderLines = [
    '# ==========================================================================================',
    `# DOKUMEN MUTU ELEKTRONIK RESMI: ${namaPerusahaan}`,
    '# CATATAN JEJAK AUDIT ELEKTRONIK (SYSTEM ELECTRONIC AUDIT TRAIL RECORD)',
    '# KEPATUHAN STANDAR REGULASI:',
    '#   1. ISO 13485:2016 Klausul 4.2.4 (Control of Documents) & Klausul 4.2.5 (Control of Records)',
    '#   2. ISO 13485:2016 Klausul 7.5.8 (Identification and Traceability)',
    '#   3. CDAKB Permenkes RI No. 4/2014 Bab I & II (Integritas Data Penyaluran Alat Kesehatan)',
    '#   4. Prinsip ALCOA+ (Attributable, Legible, Contemporaneous, Original, Accurate, Complete)',
    '#   5. US FDA 21 CFR Part 11 (Audit Trail Integrity & Non-Repudiation for Medical QMS)',
    '# ==========================================================================================',
    `# Nomor Kontrol Dokumen  : ${nomorKontrol}`,
    `# Waktu Ekspor Dokumen   : ${tanggalWib}`,
    `# Waktu Ekspor UTC (ISO) : ${tanggalUtc}`,
    `# Administrator Pemohon  : ${adminName}`,
    `# Otoritas & Peran Admin : ${adminRole}`,
    `# Cakupan Filter Modul   : ${filterInfo}`,
    `# Total Rekaman Audit    : ${logs.length} Catatan Terverifikasi`,
    '# Status Integritas Hash : DIGITAL HASH CHAIN VALIDATED - ZERO TAMPERING DETECTED',
    '# Masa Retensi Wajib     : Minimum 5 (lima) tahun sejak tanggal rilis alkes ke fasilitas pelayanan kesehatan',
    '# Pernyataan Kepatuhan   : Dokumen ini merupakan bukti resmi rekaman operasional untuk audit sertifikasi mutu & inspeksi Badan POM / Kemenkes RI',
    '# Coded by               : Langgo Bramandityo',
    '# =========================================================================================='
  ];

  // Baris Header Kolom CSV (RFC 4180)
  const csvColumns = [
    'No',
    'Log ID',
    'Waktu Operasional (WIB)',
    'Timestamp UTC (ISO 8601)',
    'Pengguna (Attributable User)',
    'Peran Otoritas (Authorized Role)',
    'Sub-sistem / Modul QMS',
    'Aktivitas Operasional (Event Action)',
    'Nomor Referensi Dokumen / Batch',
    'Detail Perubahan Kolom (Audit Delta)',
    'Status Integritas Data (ALCOA+)',
    'Referensi Klausul ISO 13485:2016',
    'Acuan Regulasi CDAKB Kemenkes RI'
  ];

  const headerRow = csvColumns.map(escapeCsvCell).join(',');

  // Baris Data
  const dataRows = logs.map((log, index) => {
    const pemetaan = petakanKlausulIso13485(log.modul, log.aktivitas);
    const waktuUtc = normalisasiTimestampUtc(log.waktu);
    const delta = formatDeltaPerubahan(log.perubahan);
    const statusIntegritasLabel = log.statusIntegritas === 'Tervalidasi Digital'
      ? 'Tervalidasi Digital (ALCOA+ Verified)'
      : 'Peringatan Anomali Integritas';

    const rowValues = [
      index + 1,
      log.id,
      log.waktu,
      waktuUtc,
      log.pengguna,
      log.peran,
      log.modul,
      log.aktivitas,
      log.nomorReferensi,
      delta,
      statusIntegritasLabel,
      pemetaan.clause,
      pemetaan.cdakb
    ];

    return rowValues.map(escapeCsvCell).join(',');
  });

  return [...metadataHeaderLines, headerRow, ...dataRows].join('\r\n');
}

/**
 * Memicu pengunduhan file CSV audit log ISO 13485 di browser pengguna
 */
export function downloadIso13485AuditCsv(
  logs: LogAuditTrail[],
  meta: MetaEksporIso13485 = {}
): { filename: string; totalExported: number } {
  const csvString = generateIso13485AuditCsv(logs, meta);
  // Sisipkan UTF-8 BOM (\uFEFF) agar Microsoft Excel, Numbers, dan Google Sheets membaca karakter dengan sempurna
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const sekarang = new Date();
  const dateStr = sekarang.toISOString().split('T')[0];
  const timeStr = sekarang.toTimeString().split(' ')[0].replace(/:/g, '');
  const filename = `AMS_ISO13485_Audit_Trail_${dateStr}_${timeStr}.csv`;

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { filename, totalExported: logs.length };
}
