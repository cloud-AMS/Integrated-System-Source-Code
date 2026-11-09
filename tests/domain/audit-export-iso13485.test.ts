import { describe, it, expect } from 'vitest';
import { 
  generateIso13485AuditCsv, 
  petakanKlausulIso13485, 
  escapeCsvCell, 
  normalisasiTimestampUtc, 
  formatDeltaPerubahan 
} from '../../src/utils/auditExportIso13485';
import type { LogAuditTrail } from '../../src/types';

describe('ISO 13485:2016 Audit Log CSV Exporter', () => {
  const mockLogs: LogAuditTrail[] = [
    {
      id: 'LOG-001',
      waktu: '2026-11-09 10:15:30 WIB',
      pengguna: 'apt. Dewi Kartika, S.Si',
      peran: 'PJT Alkes',
      modul: 'Regulatory Affairs',
      aktivitas: 'Persetujuan rilis nomor izin edar alkes KEMENKES RI AKL 20501819203',
      nomorReferensi: 'NIE-001',
      statusIntegritas: 'Tervalidasi Digital',
      perubahan: [
        { kolom: 'status', nilaiLama: 'Menunggu Evaluasi', nilaiBaru: 'Aktif' },
        { kolom: 'verifikasiPJT', nilaiLama: 'Belum', nilaiBaru: 'Disetujui' }
      ]
    },
    {
      id: 'LOG-002',
      waktu: '2026-11-09 11:00:00 WIB',
      pengguna: 'Budi Santoso',
      peran: 'Kepala Gudang',
      modul: 'Gudang & Logistik',
      aktivitas: 'Pencatatan suhu ruang dingin 4.2°C pada chiller vaksin/reagen',
      nomorReferensi: 'CHILLER-01',
      statusIntegritas: 'Tervalidasi Digital'
    },
    {
      id: 'LOG-003',
      waktu: '2026-11-09 13:45:10 WIB',
      pengguna: 'dr. Sarah Permata',
      peran: 'QA Manager',
      modul: 'Post-Market Surveillance',
      aktivitas: 'Inisiasi tindakan penarikan kembali (recall) batch alkes bermasalah',
      nomorReferensi: 'RECALL-2026-004',
      statusIntegritas: 'Tervalidasi Digital',
      perubahan: [
        { kolom: 'statusRecall', nilaiLama: 'Karantina', nilaiBaru: 'Ditarik Nasional' }
      ]
    }
  ];

  it('harus menghasilkan blok metadata ISO 13485:2016 Klausul 4.2.5 di bagian atas CSV', () => {
    const csv = generateIso13485AuditCsv(mockLogs, {
      namaAdmin: 'Administrator IT / PJT',
      peranAdmin: 'it_admin',
      filterModul: 'SEMUA MODUL SISTEM'
    });

    expect(csv).toContain('ISO 13485:2016 Klausul 4.2.4 (Control of Documents) & Klausul 4.2.5 (Control of Records)');
    expect(csv).toContain('CDAKB Permenkes RI No. 4/2014');
    expect(csv).toContain('Prinsip ALCOA+');
    expect(csv).toContain('US FDA 21 CFR Part 11');
    expect(csv).toContain('AMS-QMS-REC-425-IT');
    expect(csv).toContain('Masa Retensi Wajib');
    expect(csv).toContain('Total Rekaman Audit    : 3 Catatan Terverifikasi');
  });

  it('harus menyertakan seluruh kolom standar RFC 4180 untuk kebutuhan inspeksi audit', () => {
    const csv = generateIso13485AuditCsv(mockLogs);
    const lines = csv.split('\r\n');
    const headerIndex = lines.findIndex(l => l.includes('Log ID'));
    expect(headerIndex).toBeGreaterThan(-1);

    const header = lines[headerIndex];
    expect(header).toContain('"No"');
    expect(header).toContain('"Log ID"');
    expect(header).toContain('"Waktu Operasional (WIB)"');
    expect(header).toContain('"Timestamp UTC (ISO 8601)"');
    expect(header).toContain('"Pengguna (Attributable User)"');
    expect(header).toContain('"Peran Otoritas (Authorized Role)"');
    expect(header).toContain('"Sub-sistem / Modul QMS"');
    expect(header).toContain('"Aktivitas Operasional (Event Action)"');
    expect(header).toContain('"Nomor Referensi Dokumen / Batch"');
    expect(header).toContain('"Detail Perubahan Kolom (Audit Delta)"');
    expect(header).toContain('"Status Integritas Data (ALCOA+)"');
    expect(header).toContain('"Referensi Klausul ISO 13485:2016"');
    expect(header).toContain('"Acuan Regulasi CDAKB Kemenkes RI"');
  });

  it('harus memetakan modul ke klausul ISO 13485 dan CDAKB secara akurat', () => {
    const p1 = petakanKlausulIso13485('Regulatory Affairs', 'Verifikasi izin edar');
    expect(p1.clause).toContain('4.2.3');
    expect(p1.cdakb).toContain('Bab I');

    const p2 = petakanKlausulIso13485('Gudang & Logistik', 'Pencatatan suhu dingin');
    expect(p2.clause).toContain('7.5.11');
    expect(p2.cdakb).toContain('Bab III');

    const p3 = petakanKlausulIso13485('Post-Market Surveillance', 'Penarikan recall alkes');
    expect(p3.clause).toContain('8.3.3');
    expect(p3.cdakb).toContain('Bab V');

    const p4 = petakanKlausulIso13485('Quality Assurance', 'Tindakan korektif CAPA');
    expect(p4.clause).toContain('8.5.2');
  });

  it('harus memformat perubahan delta nilai lama dan baru secara rapi', () => {
    const delta = formatDeltaPerubahan(mockLogs[0].perubahan);
    expect(delta).toContain('status: [Sebelum: Menunggu Evaluasi] -> [Sesudah: Aktif]');
    expect(delta).toContain('verifikasiPJT: [Sebelum: Belum] -> [Sesudah: Disetujui]');

    const deltaKosong = formatDeltaPerubahan(undefined);
    expect(deltaKosong).toBe('Tidak ada mutasi field (Aktivitas Transaksi / Otorisasi)');
  });

  it('harus meng-escape karakter tanda kutip dan koma sesuai RFC 4180', () => {
    expect(escapeCsvCell('Halo, Dunia')).toBe('"Halo, Dunia"');
    expect(escapeCsvCell('Tes "Kutipan" Medis')).toBe('"Tes ""Kutipan"" Medis"');
    expect(escapeCsvCell('Multi\nBaris')).toBe('"Multi\nBaris"');
    expect(escapeCsvCell(null)).toBe('""');
    expect(escapeCsvCell(undefined)).toBe('""');
  });

  it('harus menormalisasi timestamp lokal WIB ke format ISO 8601 UTC', () => {
    const isoUtc = normalisasiTimestampUtc('2026-11-09 10:15:30 WIB');
    expect(isoUtc).toContain('2026-11-09T');
    expect(isoUtc).toContain('Z');
  });
});
