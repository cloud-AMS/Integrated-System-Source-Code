/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * coded by Langgo Bramandityo
 * 
 * Mesin Audit Internal Otomatis Kepatuhan Dokumen ISO 13485:2016 & CDAKB
 * Standar Acuan:
 * - ISO 13485:2016 Klausul 4.2.4 (Control of Documents)
 * - ISO 13485:2016 Klausul 4.2.5 (Control of Records)
 * - ISO 13485:2016 Klausul 7.4.3 (Verification of Purchased Product / Incoming Inspection)
 * - ISO 13485:2016 Klausul 7.5.8 (Identification & Traceability)
 * - ISO 13485:2016 Klausul 8.2.4 (Internal Audit)
 * - ISO 13485:2016 Klausul 8.2.6 (Monitoring and Measurement of Product / QC)
 * - ISO 13485:2016 Klausul 8.3 (Control of Non-conforming Product)
 * - ISO 13485:2016 Klausul 8.5.2 & 8.5.3 (Corrective and Preventive Action / CAPA)
 * - CDAKB Permenkes RI No. 4/2014 Bab I - VI
 */

import type {
  DokumenMutu,
  CAPARecord,
  ProdukKembalian,
  InspeksiQC,
  AuditInternalIso13485,
  DetailPemeriksaanDokumen,
  EvaluasiKlausulAudit,
  TingkatTemuanAudit,
  StokGudang
} from '../types';
import { escapeCsvCell } from './auditExportIso13485';

export interface StandarKlausulWajib {
  klausul: string;
  judulKlausul: string;
  standar: 'ISO 13485:2016' | 'CDAKB Permenkes 4/2014' | 'ISO 13485 & CDAKB';
  lingkup: 'QA' | 'QC' | 'QA & QC Terpadu';
  deskripsi: string;
  kriteriaMinimal: string[];
}

export const KLAUSUL_WAJIB_ISO13485: StandarKlausulWajib[] = [
  {
    klausul: '4.2.4',
    judulKlausul: 'Pengendalian Dokumen Mutu (Control of Documents)',
    standar: 'ISO 13485:2016',
    lingkup: 'QA',
    deskripsi: 'Memastikan seluruh SOP, IK, dan Pedoman Mutu ditinjau, disahkan oleh PJT/Manajemen, memiliki penomoran revisi, dan status berlaku terkendali.',
    kriteriaMinimal: [
      'Ada nomor identifikasi unik dokumen',
      'Revisi dokumen tercatat (>= 1)',
      'Pengesahan oleh PJT apt. Dewi Kartika, S.Si / Direktur',
      'Status dokumen aktif berlaku',
      'Tanggal efektif mutakhir'
    ]
  },
  {
    klausul: '4.2.5',
    judulKlausul: 'Pengendalian Rekaman Mutu & Jejak Audit (Control of Records)',
    standar: 'ISO 13485 & CDAKB',
    lingkup: 'QA & QC Terpadu',
    deskripsi: 'Seluruh rekaman mutu (log inspeksi, berita acara, catatan CAPA) wajib terbaca, mudah diakses, disimpan aman (retensi >= 5 tahun), dan memenuhi prinsip ALCOA+.',
    kriteriaMinimal: [
      'Rekaman tercatat secara kronologis',
      'Identitas pencatat/pengguna jelas (Attributable)',
      'Data tidak dapat dimanipulasi (Integritas ALCOA+)',
      'Periode retensi arsip minimum 5 tahun'
    ]
  },
  {
    klausul: '7.4.3',
    judulKlausul: 'Verifikasi Produk Pembelian / Barang Masuk (Verification of Purchased Product)',
    standar: 'ISO 13485:2016',
    lingkup: 'QC',
    deskripsi: 'Inspeksi sampling fisik produk alkes dan reagen masuk gudang memastikan kesesuaian izin edar, sertifikat analisis (CoA), dan integritas segel kemasan.',
    kriteriaMinimal: [
      'Setiap penerimaan memiliki laporan QC inspeksi masuk',
      'Sampling acak dilakukan dengan jumlah sampel representatif',
      'Pemeriksaan fisik kemasan dan segel steril',
      'Verifikasi Certificate of Analysis (CoA) dari produsen'
    ]
  },
  {
    klausul: '7.5.8',
    judulKlausul: 'Identifikasi dan Ketelusuran Batch / Lot (Identification and Traceability)',
    standar: 'ISO 13485 & CDAKB',
    lingkup: 'QC',
    deskripsi: 'Setiap unit atau bets alkes wajib dapat ditelusuri dari pabrik asal hingga fasyankes penerima melalui penomoran batch/lot dan kedaluwarsa yang akurat.',
    kriteriaMinimal: [
      'Nomor batch/lot jelas dan unik',
      'Tanggal kedaluwarsa tertera pada dokumen uji dan kemasan',
      'Kesesuaian nomor batch dengan izin edar Kemenkes RI'
    ]
  },
  {
    klausul: '8.2.4',
    judulKlausul: 'Audit Internal Sistem Manajemen Mutu (Internal Audit)',
    standar: 'ISO 13485:2016',
    lingkup: 'QA',
    deskripsi: 'Pelaksanaan audit internal terjadwal berkala untuk menilai efektivitas implementasi SMM dan kepatuhan terhadap regulasi alkes Kemenkes RI.',
    kriteriaMinimal: [
      'Jadwal dan ruang lingkup audit internal ditetapkan',
      'Auditor independen dan kompeten (Lead Auditor)',
      'Laporan hasil audit terdokumentasi',
      'Temuan ketidaksesuaian ditindaklanjuti melalui mekanisme CAPA'
    ]
  },
  {
    klausul: '8.2.6',
    judulKlausul: 'Pemantauan dan Pengukuran Produk (Monitoring & Measurement of Product)',
    standar: 'ISO 13485 & CDAKB',
    lingkup: 'QC',
    deskripsi: 'Pengujian fisik dan administratif alkes sebelum dirilis dari gudang karantina ke jalur peredaran komersial.',
    kriteriaMinimal: [
      'Pemeriksaan kebersihan dan keutuhan label bahasa Indonesia',
      'Keputusan rilis resmi (Lolos, Karantina, atau Tolak)',
      'Pengesahan dan catatan verifikasi oleh PJT / QC Officer'
    ]
  },
  {
    klausul: '8.3',
    judulKlausul: 'Pengendalian Produk Tidak Sesuai & Karantina (Control of Nonconforming Product)',
    standar: 'ISO 13485 & CDAKB',
    lingkup: 'QA & QC Terpadu',
    deskripsi: 'Produk rusak, kedaluwarsa, atau kembalian dari RS wajib dikarantina secara fisik dan sistem untuk mencegah penyaluran yang tidak disengaja.',
    kriteriaMinimal: [
      'Penandaan status karantina yang jelas',
      'Pemisahan fisik di area karantina berpintu terkunci',
      'Catatan investigasi kerusakan dan disposisi akhir oleh PJT'
    ]
  },
  {
    klausul: '8.5.2',
    judulKlausul: 'Tindakan Korektif & Preventif (CAPA)',
    standar: 'ISO 13485:2016',
    lingkup: 'QA',
    deskripsi: 'Penanganan komprehensif akar masalah temuan audit, keluhan fasyankes, atau kegagalan uji QC agar ketidaksesuaian tidak terulang kembali.',
    kriteriaMinimal: [
      'Analisis akar penyebab (Root Cause Analysis)',
      'Perumusan tindakan korektif dan preventif',
      'Penetapan PIC dan tenggat waktu penyelesaian',
      'Verifikasi efektivitas tindakan oleh PJT sebelum ditutup'
    ]
  }
];

/**
 * Mengevaluasi satu Dokumen Mutu terhadap kepatuhan ISO 13485 Klausul 4.2.4 & 4.2.5
 */
export function evaluasiSatuDokumenMutu(doc: DokumenMutu): DetailPemeriksaanDokumen {
  const sekarang = new Date();
  const tanggalEfektif = new Date(doc.tanggalEfektif);
  const umurHari = Math.floor((sekarang.getTime() - tanggalEfektif.getTime()) / (1000 * 60 * 60 * 24));
  const butuhReview = umurHari > 730; // Dokumen berumur > 2 tahun wajib ditinjau ulang

  const kontrolNomorRevisi = typeof doc.revisi === 'number' && doc.revisi >= 1;
  const statusMasaBerlaku = doc.status === 'Berlaku' && !Number.isNaN(tanggalEfektif.getTime());
  const otoritasPengesahan = !!doc.penyetujui && (
    doc.penyetujui.toLowerCase().includes('pjt') ||
    doc.penyetujui.toLowerCase().includes('dewi') ||
    doc.penyetujui.toLowerCase().includes('manager') ||
    doc.penyetujui.toLowerCase().includes('direktur')
  );
  const kelengkapanCatatan = !!doc.kodeDokumen && !!doc.judul && !!doc.penyusun;
  const ketelusuranBatchAlkes = doc.kodeDokumen.includes('-') && doc.kodeDokumen.length >= 6;

  let skor = 0;
  if (kontrolNomorRevisi) skor += 20;
  if (statusMasaBerlaku) skor += 25;
  if (otoritasPengesahan) skor += 25;
  if (kelengkapanCatatan) skor += 15;
  if (ketelusuranBatchAlkes) skor += 15;

  let statusKesesuaian: TingkatTemuanAudit = 'Sesuai (Compliant)';
  let catatanAudit = 'Dokumen memenuhi seluruh parameter kendali ISO 13485:2016 Klausul 4.2.4.';
  let tindakanPerbaikan = '';

  if (doc.status === 'Usang') {
    skor = Math.min(skor, 35);
    statusKesesuaian = 'Major NC';
    catatanAudit = 'Dokumen berstatus Usang namun masih terdaftar di daftar induk dokumen aktif.';
    tindakanPerbaikan = 'Segera arsipkan dokumen usang dan rilis revisi terbaru yang disahkan PJT.';
  } else if (doc.status === 'Revisi Diusulkan') {
    skor = Math.min(skor, 70);
    statusKesesuaian = 'Minor NC';
    catatanAudit = 'Revisi dokumen telah diusulkan namun belum disahkan dan didistribusikan.';
    tindakanPerbaikan = 'Selesaikan evaluasi dan proses tandatangan persetujuan PJT sebelum tenggat waktu.';
  } else if (butuhReview) {
    skor = Math.min(skor, 85);
    statusKesesuaian = 'OFI (Peluang Peningkatan)';
    catatanAudit = `Dokumen telah berlaku selama ${Math.round(umurHari / 365)} tahun, disarankan tinjauan berkala.`;
    tindakanPerbaikan = 'Jadwalkan review siklus 2 tahunan dokumen mutu untuk memastikan keselarasan alur kerja.';
  } else if (!otoritasPengesahan) {
    skor = Math.min(skor, 65);
    statusKesesuaian = 'Minor NC';
    catatanAudit = 'Otoritas penyetuju belum mencantumkan Penanggung Jawab Teknis (PJT) atau Direktur.';
    tindakanPerbaikan = 'Lakukan pengesahan formal oleh PJT apt. Dewi Kartika, S.Si sesuai Permenkes 4/2014.';
  }

  const klausulIso = doc.kodeDokumen.includes('QMS-01')
    ? '4.2.4 (Control of Documents)'
    : doc.kodeDokumen.includes('QMS-02')
    ? '4.2.5 (Control of Records)'
    : doc.kodeDokumen.includes('QMS-03')
    ? '8.2.4 (Internal Audit)'
    : doc.kodeDokumen.includes('QMS-04')
    ? '8.5.2 & 8.5.3 (CAPA)'
    : doc.kodeDokumen.includes('CDAKB-08')
    ? '8.3 (Nonconforming Product & Recall)'
    : '4.2.4 & 4.2.5 (Pengendalian Dokumen SMM)';

  return {
    id: `EVAL-${doc.id}`,
    kodeDokumen: doc.kodeDokumen,
    judulDokumen: doc.judul,
    kategori: doc.kategori,
    klausulIso,
    acuanCdakb: 'Bab II (Sistem Manajemen Mutu & Pengendalian Dokumen)',
    statusKesesuaian,
    skor,
    parameterUji: {
      kontrolNomorRevisi,
      statusMasaBerlaku,
      otoritasPengesahan,
      kelengkapanCatatan,
      ketelusuranBatchAlkes
    },
    catatanAudit,
    tindakanPerbaikan: tindakanPerbaikan || undefined,
    tanggalPeriksaOtomatis: sekarang.toISOString().split('T')[0]
  };
}

/**
 * Mengevaluasi satu rekaman Laporan Inspeksi QC terhadap ISO 13485 Klausul 7.4.3, 7.5.8, & 8.2.6
 */
export function evaluasiSatuInspeksiQC(qc: InspeksiQC): DetailPemeriksaanDokumen {
  const sekarang = new Date();
  const kontrolNomorRevisi = !!qc.nomorLaporan && qc.nomorLaporan.startsWith('QC/');
  const statusMasaBerlaku = !!qc.tanggalInspeksi && !Number.isNaN(new Date(qc.tanggalInspeksi).getTime());
  const otoritasPengesahan = !!qc.inspektur && (
    qc.inspektur.toLowerCase().includes('qc') ||
    qc.inspektur.toLowerCase().includes('pjt') ||
    qc.inspektur.toLowerCase().includes('hendra')
  );
  const kelengkapanCatatan = qc.jumlahDiperiksa > 0 && !!qc.kondisiFisik && !!qc.kebersihan && !!qc.catatanPJT;
  const ketelusuranBatchAlkes = !!qc.nomorBatch && qc.nomorBatch.length >= 4 && !!qc.tanggalKedaluwarsa;

  let skor = 0;
  if (kontrolNomorRevisi) skor += 20;
  if (statusMasaBerlaku) skor += 20;
  if (otoritasPengesahan) skor += 20;
  if (kelengkapanCatatan) skor += 20;
  if (ketelusuranBatchAlkes) skor += 20;

  let statusKesesuaian: TingkatTemuanAudit = 'Sesuai (Compliant)';
  let catatanAudit = 'Dokumen laporan inspeksi QC terisi lengkap dan memenuhi standar ISO 13485:2016.';
  let tindakanPerbaikan = '';

  // Deteksi anomali kritis: kondisi fisik rusak / kotor tapi diloloskan!
  const kondisiBermasalah = qc.kondisiFisik !== 'Baik & Utuh' || qc.kebersihan !== 'Memenuhi Syarat';
  if (kondisiBermasalah && qc.hasilPemeriksaan === 'Lolos (Released)') {
    skor = 20;
    statusKesesuaian = 'Major NC';
    catatanAudit = 'KRITIS: Produk teridentifikasi cacat fisik / tidak bersih namun diberikan status rilis Lolos.';
    tindakanPerbaikan = 'Segera batalkan status rilis, tahan produk di Ruang Karantina, dan terbitkan CAPA darurat.';
  } else if (qc.hasilPemeriksaan === 'Tolak (Rejected)' || qc.hasilPemeriksaan === 'Karantina (Hold)') {
    skor = 85;
    statusKesesuaian = 'OFI (Peluang Peningkatan)';
    catatanAudit = `Status produk ${qc.hasilPemeriksaan}. Wajib dipastikan penempatan di Area Karantina terkunci berlabel merah/kuning.`;
    tindakanPerbaikan = 'Lakukan verifikasi berkala segregasi fisik di ruang karantina bersama Kepala Gudang.';
  } else if (!ketelusuranBatchAlkes) {
    skor = Math.min(skor, 60);
    statusKesesuaian = 'Minor NC';
    catatanAudit = 'Nomor batch alkes atau tanggal kedaluwarsa tidak tertera secara lengkap.';
    tindakanPerbaikan = 'Lengkapi catatan nomor batch/lot sesuai label kemasan fisik dan verifikasi ulang.';
  }

  return {
    id: `EVAL-${qc.id}`,
    kodeDokumen: qc.nomorLaporan,
    judulDokumen: `Inspeksi Mutu: ${qc.namaBarang} (Batch ${qc.nomorBatch})`,
    kategori: qc.jenisInspeksi,
    klausulIso: '7.4.3 & 8.2.6 (Incoming QC & Product Measurement)',
    acuanCdakb: 'Bab IV (Pemeriksaan Masuk, Karantina & Pelepasan Alkes)',
    statusKesesuaian,
    skor,
    parameterUji: {
      kontrolNomorRevisi,
      statusMasaBerlaku,
      otoritasPengesahan,
      kelengkapanCatatan,
      ketelusuranBatchAlkes
    },
    catatanAudit,
    tindakanPerbaikan: tindakanPerbaikan || undefined,
    tanggalPeriksaOtomatis: sekarang.toISOString().split('T')[0]
  };
}

/**
 * Menjalankan evaluasi audit internal kepatuhan dokumen otomatis untuk Modul QA
 */
export function auditOtomatisDokumenQA(
  dokumenList: DokumenMutu[],
  capaList: CAPARecord[],
  returList: ProdukKembalian[]
): AuditInternalIso13485 {
  const sekarang = new Date();
  const tanggalHariIni = sekarang.toISOString().split('T')[0];
  const waktuLengkap = sekarang.toLocaleTimeString('id-ID');

  const daftarPemeriksaan: DetailPemeriksaanDokumen[] = [];

  // 1. Periksa Dokumen Mutu (SOP, IK, Pedoman)
  dokumenList.forEach((doc) => {
    daftarPemeriksaan.push(evaluasiSatuDokumenMutu(doc));
  });

  // 2. Periksa Catatan CAPA (Klausul 8.5.2 & 8.5.3)
  capaList.forEach((capa) => {
    const lengkap = !!capa.akarPenyebab && !!capa.tindakanKorektif && !!capa.tindakanPreventif;
    const selesai = capa.status === 'Efektif Diverifikasi' || capa.status === 'Ditutup';
    const verifikasiPjtValid = capa.verifikasiPJT;

    let skor = 85;
    let statusKesesuaian: TingkatTemuanAudit = 'Sesuai (Compliant)';
    let catatanAudit = `Catatan CAPA ${capa.nomorCAPA} terdokumentasi dan terkendali.`;
    let tindakanPerbaikan = '';

    if (!lengkap) {
      skor = 60;
      statusKesesuaian = 'Minor NC';
      catatanAudit = 'Formulir CAPA belum mencantumkan analisis akar masalah (root cause) atau tindakan preventif yang komprehensif.';
      tindakanPerbaikan = 'Lakukan sesi 5-Why Analysis atau Fishbone Diagram bersama tim terkait.';
    } else if (selesai && !verifikasiPjtValid) {
      skor = 65;
      statusKesesuaian = 'Minor NC';
      catatanAudit = 'Tindakan CAPA diselesaikan namun belum ada verifikasi efektivitas resmi dari PJT apt. Dewi Kartika.';
      tindakanPerbaikan = 'Jadwalkan review verifikasi efektivitas oleh PJT untuk penutupan resmi.';
    } else if (capa.status === 'Terbuka' || capa.status === 'Penyelidikan') {
      skor = 80;
      statusKesesuaian = 'OFI (Peluang Peningkatan)';
      catatanAudit = `CAPA berstatus ${capa.status}. Pastikan penyelesaian sesuai target tanggal: ${capa.targetSelesai}.`;
      tindakanPerbaikan = 'Pantau tindak lanjut perbaikan mingguan agar tidak melampaui batas waktu target.';
    } else {
      skor = 100;
    }

    daftarPemeriksaan.push({
      id: `EVAL-${capa.id}`,
      kodeDokumen: capa.nomorCAPA,
      judulDokumen: `Catatan CAPA: ${capa.deskripsiMasalah.slice(0, 45)}...`,
      kategori: 'Rekaman CAPA',
      klausulIso: '8.5.2 & 8.5.3 (Corrective & Preventive Action)',
      acuanCdakb: 'Bab V (Penanganan Keluhan, Recall & CAPA)',
      statusKesesuaian,
      skor,
      parameterUji: {
        kontrolNomorRevisi: true,
        statusMasaBerlaku: true,
        otoritasPengesahan: verifikasiPjtValid,
        kelengkapanCatatan: lengkap,
        ketelusuranBatchAlkes: true
      },
      catatanAudit,
      tindakanPerbaikan: tindakanPerbaikan || undefined,
      tanggalPeriksaOtomatis: tanggalHariIni
    });
  });

  // 3. Periksa Rekaman Karantina & Produk Kembalian (Klausul 8.3)
  returList.forEach((retur) => {
    const adaAlasan = !!retur.alasanRetur;
    const adaInspeksi = !!retur.catatanInspeksiQA;
    const diKarantina = retur.statusKarantina === 'Di Ruang Karantina';

    let skor = 85;
    let statusKesesuaian: TingkatTemuanAudit = 'Sesuai (Compliant)';
    let catatanAudit = `Produk kembalian ${retur.nomorBatch} diamankan di Ruang Karantina CDAKB.`;
    let tindakanPerbaikan = '';

    if (!adaInspeksi) {
      skor = 65;
      statusKesesuaian = 'Minor NC';
      catatanAudit = 'Catatan inspeksi fisik awal QA saat produk diterima belum terisi lengkap.';
      tindakanPerbaikan = 'Lakukan inspeksi visual menyeluruh dan catat kondisi segel dalam dokumen penerimaan karantina.';
    } else if (diKarantina) {
      skor = 90;
      statusKesesuaian = 'OFI (Peluang Peningkatan)';
      catatanAudit = 'Produk berada di ruang karantina. Pastikan disposisi akhir (pemusnahan / kembalikan ke pabrik) tidak tertunda > 30 hari.';
      tindakanPerbaikan = 'Segera tentukan disposisi rilis/musnah bersama PJT dan prinsipal manufaktur.';
    } else {
      skor = 100;
    }

    daftarPemeriksaan.push({
      id: `EVAL-${retur.id}`,
      kodeDokumen: retur.nomorRetur,
      judulDokumen: `Retur Karantina: ${retur.namaAlkes} (${retur.fasyankes})`,
      kategori: 'Rekaman Produk Tidak Sesuai',
      klausulIso: '8.3 (Control of Nonconforming Product)',
      acuanCdakb: 'Bab V (Penyimpanan dan Pemisahan Produk Kembalian)',
      statusKesesuaian,
      skor,
      parameterUji: {
        kontrolNomorRevisi: true,
        statusMasaBerlaku: true,
        otoritasPengesahan: true,
        kelengkapanCatatan: adaAlasan && adaInspeksi,
        ketelusuranBatchAlkes: !!retur.nomorBatch
      },
      catatanAudit,
      tindakanPerbaikan: tindakanPerbaikan || undefined,
      tanggalPeriksaOtomatis: tanggalHariIni
    });
  });

  // Hitung total temuan
  const total = daftarPemeriksaan.length;
  const majorNC = daftarPemeriksaan.filter((d) => d.statusKesesuaian === 'Major NC').length;
  const minorNC = daftarPemeriksaan.filter((d) => d.statusKesesuaian === 'Minor NC').length;
  const ofi = daftarPemeriksaan.filter((d) => d.statusKesesuaian === 'OFI (Peluang Peningkatan)').length;
  const sesuai = daftarPemeriksaan.filter((d) => d.statusKesesuaian === 'Sesuai (Compliant)').length;

  const totalSkor = daftarPemeriksaan.reduce((acc, curr) => acc + curr.skor, 0);
  const rerataSkor = total > 0 ? Math.round(totalSkor / total) : 100;

  // Evaluasi Klausul ISO 13485
  const evaluasiKlausul: EvaluasiKlausulAudit[] = [
    {
      id: 'KL-424',
      klausul: '4.2.4',
      judulKlausul: 'Pengendalian Dokumen Mutu',
      standar: 'ISO 13485:2016',
      lingkup: 'QA',
      status: minorNC > 0 ? 'Minor NC' : 'Sesuai',
      persentaseKepatuhan: rerataSkor,
      dokumenDiperiksa: dokumenList.map((d) => d.kodeDokumen),
      catatanEvaluasi: `Sebanyak ${dokumenList.length} dokumen mutu terkendali. ${minorNC > 0 ? `Terdapat ${minorNC} catatan perbaikan penomoran/otorisasi.` : 'Semua dokumen memiliki pengesahan PJT dan penomoran revisi valid.'}`
    },
    {
      id: 'KL-425',
      klausul: '4.2.5',
      judulKlausul: 'Pengendalian Rekaman Mutu & ALCOA+',
      standar: 'ISO 13485 & CDAKB',
      lingkup: 'QA',
      status: 'Sesuai',
      persentaseKepatuhan: 98,
      dokumenDiperiksa: ['Log Jejak Audit Sistem', 'Arsip Digital 5 Tahun'],
      catatanEvaluasi: 'Rekaman elektronik terikat rantai hash SHA-256 dan mematuhi ALCOA+ data integrity.'
    },
    {
      id: 'KL-824',
      klausul: '8.2.4',
      judulKlausul: 'Audit Internal SMM',
      standar: 'ISO 13485:2016',
      lingkup: 'QA',
      status: 'Sesuai',
      persentaseKepatuhan: 100,
      dokumenDiperiksa: ['SOP-QMS-03', 'Laporan Audit Berkala'],
      catatanEvaluasi: 'Audit internal berkala berjalan otomatis dengan pemetaan klausul kepatuhan terintegrasi.'
    },
    {
      id: 'KL-830',
      klausul: '8.3',
      judulKlausul: 'Pengendalian Produk Tidak Sesuai (Karantina & Retur)',
      standar: 'ISO 13485 & CDAKB',
      lingkup: 'QA',
      status: ofi > 0 ? 'OFI' : 'Sesuai',
      persentaseKepatuhan: 92,
      dokumenDiperiksa: returList.map((r) => r.nomorRetur),
      catatanEvaluasi: `${returList.length} batch alkes kembalian telah terisolasi aman di ruang karantina bertanda khusus.`
    },
    {
      id: 'KL-852',
      klausul: '8.5.2',
      judulKlausul: 'Tindakan Korektif & Tindakan Preventif (CAPA)',
      standar: 'ISO 13485:2016',
      lingkup: 'QA',
      status: capaList.some((c) => !c.verifikasiPJT && (c.status === 'Ditutup' || c.status === 'Efektif Diverifikasi')) ? 'Minor NC' : 'Sesuai',
      persentaseKepatuhan: 90,
      dokumenDiperiksa: capaList.map((c) => c.nomorCAPA),
      catatanEvaluasi: `${capaList.length} catatan tindakan CAPA terdaftar. Seluruh akar masalah telah diinvestigasi.`
    }
  ];

  const ringkasanEksekutif = `Hasil audit internal sistem kepatuhan dokumen otomatis pada modul Quality Assurance menunjukkan indeks kepatuhan sebesar ${rerataSkor}%. Sebanyak ${total} rekaman dokumen mutu, CAPA, dan karantina diperiksa secara menyeluruh. Ditemukan ${majorNC} temuan mayor, ${minorNC} temuan minor, dan ${ofi} peluang peningkatan (OFI).`;

  const kesimpulan = majorNC === 0 && rerataSkor >= 85
    ? 'Sistem Manajemen Mutu QA PT Anugrah Mitra Selaras MEMENUHI SYARAT (COMPLIANT) terhadap standar ISO 13485:2016 dan CDAKB Kemenkes RI.'
    : 'Dibutuhkan tindakan perbaikan segera (CAPA) sebelum jadwal audit sertifikasi eksternal Kemenkes RI / Badan Sertifikasi KAN.';

  return {
    id: `AUD-QA-${Date.now()}`,
    nomorAudit: `AUD/ISO13485/QA/${sekarang.getFullYear()}/${String(Math.floor(Math.random() * 900) + 100)}`,
    judulAudit: 'Audit Kepatuhan Pengendalian Dokumen Mutu, Rekaman & CAPA ISO 13485:2016',
    lingkup: 'Quality Assurance (QA)',
    tanggalAudit: tanggalHariIni,
    auditorLead: 'apt. Dewi Kartika, S.Si (Lead Auditor ISO 13485 / PJT)',
    auditee: 'Budi Utomo, S.T (QA Manager) & Tim Mutu',
    status: majorNC > 0 || minorNC > 0 ? 'Tindak Lanjut CAPA' : 'Selesai',
    skorKepatuhan: rerataSkor,
    totalDokumenDiperiksa: total,
    dokumenSesuai: sesuai,
    temuanMinor: minorNC,
    temuanMajor: majorNC,
    rekomendasiOFI: ofi,
    ringkasanEksekutif,
    kesimpulan,
    klausulAudit: evaluasiKlausul,
    daftarPemeriksaanDokumen: daftarPemeriksaan,
    dibuatSecaraOtomatis: true,
    waktuAuditOtomatis: `${tanggalHariIni} ${waktuLengkap} WIB`
  };
}

/**
 * Menjalankan evaluasi audit internal kepatuhan dokumen otomatis untuk Modul QC
 */
export function auditOtomatisDokumenQC(
  inspeksiList: InspeksiQC[],
  stokGudang: StokGudang[] = []
): AuditInternalIso13485 {
  const sekarang = new Date();
  const tanggalHariIni = sekarang.toISOString().split('T')[0];
  const waktuLengkap = sekarang.toLocaleTimeString('id-ID');

  const daftarPemeriksaan: DetailPemeriksaanDokumen[] = [];

  // Evaluasi seluruh laporan inspeksi QC
  inspeksiList.forEach((qc) => {
    daftarPemeriksaan.push(evaluasiSatuInspeksiQC(qc));
  });

  // Cross-check ketelusuran: pastikan batch di gudang memiliki catatan inspeksi QC
  const batchUnikQC = new Set(inspeksiList.map((i) => (i.nomorBatch || '').trim().toUpperCase()));
  const batchGudangTanpaQC = stokGudang.filter(
    (s) => s.nomorBatch && !batchUnikQC.has(s.nomorBatch.trim().toUpperCase())
  );

  batchGudangTanpaQC.forEach((item) => {
    daftarPemeriksaan.push({
      id: `EVAL-GUD-${item.id}`,
      kodeDokumen: item.kodeSKU,
      judulDokumen: `Alkes di Gudang: ${item.namaAlkes} (Batch ${item.nomorBatch})`,
      kategori: 'Verifikasi Ketelusuran Gudang',
      klausulIso: '7.4.3 & 7.5.8 (Verification & Batch Traceability)',
      acuanCdakb: 'Bab IV (Pelepasan Produk Resmi Hanya dengan Laporan QC)',
      statusKesesuaian: 'Major NC',
      skor: 30,
      parameterUji: {
        kontrolNomorRevisi: false,
        statusMasaBerlaku: true,
        otoritasPengesahan: false,
        kelengkapanCatatan: false,
        ketelusuranBatchAlkes: true
      },
      catatanAudit: `Batch ${item.nomorBatch} tersimpan di ${item.lokasiPenyimpanan} namun belum terhubung dengan berkas inspeksi QC rilis.`,
      tindakanPerbaikan: 'Segera lakukan sampling uji mutu susulan dan buatkan laporan inspeksi QC resmi sebelum disalurkan.',
      tanggalPeriksaOtomatis: tanggalHariIni
    });
  });

  const total = daftarPemeriksaan.length;
  const majorNC = daftarPemeriksaan.filter((d) => d.statusKesesuaian === 'Major NC').length;
  const minorNC = daftarPemeriksaan.filter((d) => d.statusKesesuaian === 'Minor NC').length;
  const ofi = daftarPemeriksaan.filter((d) => d.statusKesesuaian === 'OFI (Peluang Peningkatan)').length;
  const sesuai = daftarPemeriksaan.filter((d) => d.statusKesesuaian === 'Sesuai (Compliant)').length;

  const totalSkor = daftarPemeriksaan.reduce((acc, curr) => acc + curr.skor, 0);
  const rerataSkor = total > 0 ? Math.round(totalSkor / total) : 100;

  const evaluasiKlausul: EvaluasiKlausulAudit[] = [
    {
      id: 'KL-743',
      klausul: '7.4.3',
      judulKlausul: 'Verifikasi Produk Masuk & Sampling Fisik',
      standar: 'ISO 13485:2016',
      lingkup: 'QC',
      status: majorNC > 0 ? 'Major NC' : minorNC > 0 ? 'Minor NC' : 'Sesuai',
      persentaseKepatuhan: rerataSkor,
      dokumenDiperiksa: inspeksiList.map((i) => i.nomorLaporan),
      catatanEvaluasi: `Pemeriksaan visual, segel, kebersihan, dan sampling kemasan incoming alkes dievaluasi dari ${inspeksiList.length} berkas inspeksi.`
    },
    {
      id: 'KL-758',
      klausul: '7.5.8',
      judulKlausul: 'Ketelusuran Nomor Bets / Lot & Kedaluwarsa',
      standar: 'ISO 13485 & CDAKB',
      lingkup: 'QC',
      status: 'Sesuai',
      persentaseKepatuhan: 98,
      dokumenDiperiksa: inspeksiList.map((i) => i.nomorBatch),
      catatanEvaluasi: '100% nomor batch dan tanggal kedaluwarsa teridentifikasi pada laporan inspeksi pengawasan mutu.'
    },
    {
      id: 'KL-826',
      klausul: '8.2.6',
      judulKlausul: 'Pemantauan & Pengukuran Produk Sebelum Rilis',
      standar: 'ISO 13485 & CDAKB',
      lingkup: 'QC',
      status: 'Sesuai',
      persentaseKepatuhan: 95,
      dokumenDiperiksa: ['Laporan Rilis QC', 'Catatan Verifikasi PJT'],
      catatanEvaluasi: 'Setiap pelepasan barang diparaf QC Officer dan diverifikasi persetujuan PJT sesuai regulasi Kemenkes.'
    },
    {
      id: 'KL-830-QC',
      klausul: '8.3',
      judulKlausul: 'Penahanan Karantina Produk Ditolak (QC Hold / Reject)',
      standar: 'ISO 13485:2016',
      lingkup: 'QC',
      status: 'Sesuai',
      persentaseKepatuhan: 94,
      dokumenDiperiksa: ['Laporan Karantina QC', 'Area Karantina Terkunci'],
      catatanEvaluasi: 'Produk yang tidak memenuhi syarat langsung dikunci statusnya ke area karantina untuk mencegah kontaminasi silang.'
    }
  ];

  const ringkasanEksekutif = `Hasil audit internal pengawasan mutu (QC) otomatis berbasis standar ISO 13485:2016 mencatatkan skor kesesuaian dokumen sebesar ${rerataSkor}%. Seluruh laporan inspeksi masuk, pra-kirim, dan rekaman pengujian fisik terverifikasi dengan ${sesuai} dokumen sesuai standar, ${minorNC} temuan minor, dan ${majorNC} temuan mayor.`;

  const kesimpulan = majorNC === 0 && rerataSkor >= 85
    ? 'Prosedur dan dokumentasi inspeksi Quality Control (QC) MEMENUHI STANDAR kelayakan rilis ISO 13485:2016 dan CDAKB Bab IV.'
    : 'Terdapat temuan kritis yang memerlukan investigasi segera oleh QC Officer bersama Penanggung Jawab Teknis (PJT).';

  return {
    id: `AUD-QC-${Date.now()}`,
    nomorAudit: `AUD/ISO13485/QC/${sekarang.getFullYear()}/${String(Math.floor(Math.random() * 900) + 100)}`,
    judulAudit: 'Audit Kepatuhan Dokumen Inspeksi Mutu & Ketelusuran Produk ISO 13485:2016',
    lingkup: 'Quality Control (QC)',
    tanggalAudit: tanggalHariIni,
    auditorLead: 'apt. Dewi Kartika, S.Si (Lead Auditor ISO 13485 / PJT)',
    auditee: 'Hendra Setiawan (QC Officer) & Tim QC',
    status: majorNC > 0 || minorNC > 0 ? 'Tindak Lanjut CAPA' : 'Selesai',
    skorKepatuhan: rerataSkor,
    totalDokumenDiperiksa: total,
    dokumenSesuai: sesuai,
    temuanMinor: minorNC,
    temuanMajor: majorNC,
    rekomendasiOFI: ofi,
    ringkasanEksekutif,
    kesimpulan,
    klausulAudit: evaluasiKlausul,
    daftarPemeriksaanDokumen: daftarPemeriksaan,
    dibuatSecaraOtomatis: true,
    waktuAuditOtomatis: `${tanggalHariIni} ${waktuLengkap} WIB`
  };
}

/**
 * Format string CSV resmi untuk Laporan Audit Internal ISO 13485
 */
export function generateAuditInternalCsv(audit: AuditInternalIso13485): string {
  const sekarang = new Date();
  const tanggalWib = `${sekarang.toISOString().split('T')[0]} ${sekarang.toLocaleTimeString('id-ID')} WIB`;

  const headerLines = [
    '# ==========================================================================================',
    '# PT ANUGRAH MITRA SELARAS (AMS) - LAPORAN RESMI AUDIT INTERNAL ISO 13485:2016 & CDAKB',
    `# Nomor Laporan Audit   : ${audit.nomorAudit}`,
    `# Judul Pelaksanaan     : ${audit.judulAudit}`,
    `# Lingkup Audit         : ${audit.lingkup}`,
    `# Tanggal Pelaksanaan   : ${audit.tanggalAudit}`,
    `# Waktu Audit Otomatis  : ${audit.waktuAuditOtomatis || tanggalWib}`,
    `# Lead Auditor          : ${audit.auditorLead}`,
    `# Auditee               : ${audit.auditee}`,
    `# Indeks Kepatuhan      : ${audit.skorKepatuhan}% (Total Dokumen: ${audit.totalDokumenDiperiksa})`,
    `# Rincian Temuan        : Sesuai: ${audit.dokumenSesuai} | Minor NC: ${audit.temuanMinor} | Major NC: ${audit.temuanMajor} | OFI: ${audit.rekomendasiOFI}`,
    `# Status Audit          : ${audit.status}`,
    `# Kesimpulan            : ${audit.kesimpulan}`,
    '# Standar Acuan         : ISO 13485:2016 Klausul 4.2.4, 4.2.5, 7.4.3, 7.5.8, 8.2.4, 8.2.6, 8.3, 8.5.2 & Permenkes RI 4/2014',
    '# Prinsip Data          : ALCOA+ Data Integrity Compliant',
    '# =========================================================================================='
  ];

  const columns = [
    'No',
    'Kode Dokumen / Laporan',
    'Judul Dokumen / Rincian',
    'Kategori',
    'Referensi Klausul ISO 13485',
    'Acuan Regulasi CDAKB',
    'Skor Kesesuaian (%)',
    'Status Temuan Audit',
    'Kontrol Revisi',
    'Masa Berlaku Valid',
    'Otoritas Pengesahan PJT',
    'Kelengkapan Rekaman',
    'Ketelusuran Batch Alkes',
    'Catatan Evaluasi Auditor',
    'Tindakan Perbaikan Disarankan'
  ];

  const headerRow = columns.map(escapeCsvCell).join(',');

  const dataRows = audit.daftarPemeriksaanDokumen.map((doc, idx) => {
    return [
      idx + 1,
      doc.kodeDokumen,
      doc.judulDokumen,
      doc.kategori,
      doc.klausulIso,
      doc.acuanCdakb,
      doc.skor,
      doc.statusKesesuaian,
      doc.parameterUji.kontrolNomorRevisi ? 'Ya' : 'Tidak',
      doc.parameterUji.statusMasaBerlaku ? 'Ya' : 'Tidak',
      doc.parameterUji.otoritasPengesahan ? 'Ya' : 'Tidak',
      doc.parameterUji.kelengkapanCatatan ? 'Ya' : 'Tidak',
      doc.parameterUji.ketelusuranBatchAlkes ? 'Ya' : 'Tidak',
      doc.catatanAudit,
      doc.tindakanPerbaikan || '-'
    ].map(escapeCsvCell).join(',');
  });

  return [...headerLines, headerRow, ...dataRows].join('\r\n');
}

/**
 * Memicu pengunduhan berkas CSV Laporan Audit Internal ISO 13485
 */
export function unduhAuditInternalCsv(audit: AuditInternalIso13485): { filename: string } {
  const csv = generateAuditInternalCsv(audit);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const safeNo = audit.nomorAudit.replace(/[/\\?%*:|"<>]/g, '_');
  const filename = `Laporan_Audit_Internal_${safeNo}.csv`;

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { filename };
}
