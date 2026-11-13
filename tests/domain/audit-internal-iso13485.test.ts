/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * coded by Langgo Bramandityo
 * 
 * Pengujian Unit Mesin Audit Internal Otomatis Kepatuhan Dokumen ISO 13485:2016 & CDAKB
 */

import { describe, it, expect } from 'vitest';
import {
  evaluasiSatuDokumenMutu,
  evaluasiSatuInspeksiQC,
  auditOtomatisDokumenQA,
  auditOtomatisDokumenQC,
  generateAuditInternalCsv
} from '../../src/utils/auditInternalIso13485';
import type { DokumenMutu, CAPARecord, ProdukKembalian, InspeksiQC, StokGudang } from '../../src/types';
import { db } from '../../src/services/pocketbase';

describe('Audit Internal Otomatis ISO 13485:2016 & CDAKB', () => {
  const dummyDocs: DokumenMutu[] = [
    {
      id: 'DOC-1',
      kodeDokumen: 'SOP-QMS-01',
      judul: 'Prosedur Pengendalian Dokumen Mutu',
      kategori: 'SOP',
      revisi: 3,
      tanggalEfektif: '2026-01-10',
      status: 'Berlaku',
      penyusun: 'Rian Prasetyo, S.Farm (QA)',
      penyetujui: 'apt. Dewi Kartika, S.Si (PJT)'
    },
    {
      id: 'DOC-2',
      kodeDokumen: 'SOP-QMS-99',
      judul: 'Prosedur Usang Yang Belum Diperbarui',
      kategori: 'SOP',
      revisi: 1,
      tanggalEfektif: '2020-01-01',
      status: 'Usang',
      penyusun: 'Staf Lama',
      penyetujui: 'Mantan Direktur'
    },
    {
      id: 'DOC-3',
      kodeDokumen: 'SOP-QMS-98',
      judul: 'Prosedur Yang Berlaku Lebih Dari 2 Tahun',
      kategori: 'SOP',
      revisi: 2,
      tanggalEfektif: '2022-01-01',
      status: 'Berlaku',
      penyusun: 'Budi Utomo, S.T',
      penyetujui: 'apt. Dewi Kartika, S.Si (PJT)'
    }
  ];

  const dummyCapa: CAPARecord[] = [
    {
      id: 'CAPA-1',
      nomorCAPA: 'CAPA/ISO/24/001',
      sumber: 'Audit Internal',
      deskripsiMasalah: 'Ditemukan instrumen kalibrator expired',
      akarPenyebab: 'Jadwal re-kalibrasi belum tersinkron di sistem',
      tindakanKorektif: 'Kirim ke BPFK',
      tindakanPreventif: 'Aktifkan alarm H-30',
      penanggungJawab: 'Dian Nugraha',
      targetSelesai: '2024-06-30',
      status: 'Efektif Diverifikasi',
      verifikasiPJT: true
    }
  ];

  const dummyRetur: ProdukKembalian[] = [
    {
      id: 'RET-1',
      nomorRetur: 'RET/CDAKB/24/001',
      fasyankes: 'RSUP Dr. Cipto Mangunkusumo',
      namaAlkes: 'Benang Bedah Polyglactin 910',
      nomorBatch: 'LOT-2023-B991',
      jumlah: 15,
      satuan: 'Box',
      alasanRetur: 'Cacat Kemasan',
      statusKarantina: 'Di Ruang Karantina',
      catatanInspeksiQA: 'Segel basah terkena rembesan air, ditahan di area karantina',
      tanggalMasukKarantina: '2024-05-14'
    }
  ];

  const dummyQC: InspeksiQC[] = [
    {
      id: 'QC-01',
      nomorLaporan: 'QC/IN/2024/05/001',
      jenisInspeksi: 'Barang Masuk Gudang',
      namaBarang: 'Patient Monitor Multi-Parameter AMS-V12 Pro',
      nomorBatch: 'LOT-2024-PM44',
      jumlahDiperiksa: 20,
      tanggalInspeksi: '2024-05-20',
      inspektur: 'Hendra Setiawan (QC Officer)',
      kondisiFisik: 'Baik & Utuh',
      kebersihan: 'Memenuhi Syarat',
      tanggalKedaluwarsa: '2029-05-01',
      hasilPemeriksaan: 'Lolos (Released)',
      catatanPJT: 'Label bahasa Indonesia & manual lengkap.'
    },
    {
      id: 'QC-02',
      nomorLaporan: 'QC/IN/2024/05/002',
      jenisInspeksi: 'Barang Masuk Gudang',
      namaBarang: 'Reagen Rusak Tak Memenuhi Syarat',
      nomorBatch: 'LOT-FAIL-01',
      jumlahDiperiksa: 10,
      tanggalInspeksi: '2024-05-21',
      inspektur: 'Hendra Setiawan (QC Officer)',
      kondisiFisik: 'Kemasan Rusak',
      kebersihan: 'Tercemar',
      tanggalKedaluwarsa: '2025-01-01',
      hasilPemeriksaan: 'Lolos (Released)', // Anomali kritis: kondisi rusak tapi diloloskan!
      catatanPJT: 'Catatan pengujian tidak sesuai'
    }
  ];

  describe('Evaluasi Dokumen Mutu QA (Klausul 4.2.4 & 4.2.5)', () => {
    it('harus memvalidasi dokumen yang berlaku dan disahkan PJT sebagai Sesuai', () => {
      const hasil = evaluasiSatuDokumenMutu(dummyDocs[0]);
      expect(hasil.statusKesesuaian).toBe('Sesuai (Compliant)');
      expect(hasil.skor).toBeGreaterThanOrEqual(90);
      expect(hasil.parameterUji.kontrolNomorRevisi).toBe(true);
      expect(hasil.parameterUji.otoritasPengesahan).toBe(true);
    });

    it('harus menandai dokumen usang sebagai Major NC', () => {
      const hasil = evaluasiSatuDokumenMutu(dummyDocs[1]);
      expect(hasil.statusKesesuaian).toBe('Major NC');
      expect(hasil.skor).toBeLessThanOrEqual(50);
      expect(hasil.tindakanPerbaikan).toContain('Segera arsipkan dokumen usang');
    });

    it('harus menandai dokumen yang berlaku > 2 tahun sebagai OFI (siklus peninjauan berkala)', () => {
      const hasil = evaluasiSatuDokumenMutu(dummyDocs[2]);
      expect(hasil.statusKesesuaian).toBe('OFI (Peluang Peningkatan)');
      expect(hasil.catatanAudit).toContain('tahun, disarankan tinjauan berkala');
    });

    it('harus menghasilkan laporan audit lengkap modul QA dengan skor kepatuhan', () => {
      const audit = auditOtomatisDokumenQA(dummyDocs, dummyCapa, dummyRetur);
      expect(audit.lingkup).toBe('Quality Assurance (QA)');
      expect(audit.skorKepatuhan).toBeGreaterThan(0);
      expect(audit.skorKepatuhan).toBeLessThanOrEqual(100);
      expect(audit.klausulAudit.length).toBeGreaterThanOrEqual(4);
      expect(audit.daftarPemeriksaanDokumen.length).toBe(dummyDocs.length + dummyCapa.length + dummyRetur.length);
      expect(audit.kesimpulan).toBeTruthy();
    });
  });

  describe('Evaluasi Dokumen Inspeksi QC (Klausul 7.4.3, 7.5.8, 8.2.6)', () => {
    it('harus memvalidasi laporan QC standar sebagai Sesuai', () => {
      const hasil = evaluasiSatuInspeksiQC(dummyQC[0]);
      expect(hasil.statusKesesuaian).toBe('Sesuai (Compliant)');
      expect(hasil.skor).toBe(100);
      expect(hasil.parameterUji.ketelusuranBatchAlkes).toBe(true);
    });

    it('harus mendeteksi anomali kritis: barang rusak yang diloloskan sebagai Major NC', () => {
      const hasil = evaluasiSatuInspeksiQC(dummyQC[1]);
      expect(hasil.statusKesesuaian).toBe('Major NC');
      expect(hasil.skor).toBeLessThanOrEqual(30);
      expect(hasil.catatanAudit).toContain('KRITIS');
      expect(hasil.tindakanPerbaikan).toContain('Ruang Karantina');
    });

    it('harus mendeteksi stok gudang yang belum memiliki laporan inspeksi QC rilis', () => {
      const dummyStok: StokGudang[] = [
        {
          id: 'STK-99',
          kodeSKU: 'ALKES-UNINSPECTED',
          namaAlkes: 'Alkes Tanpa Uji QC',
          nomorIzinEdar: 'AKL 12345',
          nomorBatch: 'LOT-MYSTERY-999',
          lokasiPenyimpanan: 'Rak Z',
          zonaSuhu: 'Suhu Kamar (< 30°C)',
          jumlahStok: 5,
          satuan: 'Unit',
          tanggalMasuk: '2024-05-01',
          tanggalKedaluwarsa: '2027-01-01',
          statusFEFO: 'Aman'
        }
      ];

      const audit = auditOtomatisDokumenQC(dummyQC, dummyStok);
      expect(audit.lingkup).toBe('Quality Control (QC)');
      const temuanStok = audit.daftarPemeriksaanDokumen.find(d => d.kodeDokumen === 'ALKES-UNINSPECTED');
      expect(temuanStok).toBeDefined();
      expect(temuanStok?.statusKesesuaian).toBe('Major NC');
      expect(temuanStok?.catatanAudit).toContain('belum terhubung dengan berkas inspeksi QC rilis');
    });
  });

  describe('Format CSV Laporan Audit Internal ISO 13485', () => {
    it('harus menghasilkan baris header dan data RFC 4180 yang valid', () => {
      const audit = auditOtomatisDokumenQA(dummyDocs, dummyCapa, dummyRetur);
      const csv = generateAuditInternalCsv(audit);

      expect(csv).toContain('PT ANUGRAHMITRA SELARAS (AMS) - LAPORAN RESMI AUDIT INTERNAL ISO 13485:2016 & CDAKB');
      expect(csv).toContain(audit.nomorAudit);
      expect(csv).toContain('Kode Dokumen / Laporan');
      expect(csv).toContain('SOP-QMS-01');
      expect(csv).toContain('CAPA/ISO/24/001');
      expect(csv).toContain('RET/CDAKB/24/001');
    });
  });

  describe('Integrasi Database PocketBase Service', () => {
    it('harus dapat mengambil daftar audit internal dan mengeksekusi audit otomatis', () => {
      const auditsQA = db.getAuditInternal('QA');
      expect(auditsQA.length).toBeGreaterThan(0);
      expect(auditsQA[0].lingkup).toContain('QA');

      const auditsQC = db.getAuditInternal('QC');
      expect(auditsQC.length).toBeGreaterThan(0);
      expect(auditsQC[0].lingkup).toContain('QC');

      const auditBaruQA = db.jalankanAuditOtomatisQA();
      expect(auditBaruQA).toBeDefined();
      expect(auditBaruQA.dibuatSecaraOtomatis).toBe(true);

      const auditBaruQC = db.jalankanAuditOtomatisQC();
      expect(auditBaruQC).toBeDefined();
      expect(auditBaruQC.dibuatSecaraOtomatis).toBe(true);
    });
  });
});
