import { describe, expect, it } from 'vitest';
import {
  formatRupiah,
  hitungBpjs,
  hitungPph21,
  hitungSlipGaji,
  hitungTunjanganPajak,
  hitungUpahLembur,
  hitungUpahPerJam
} from '../../src/utils/payroll';
import { PARAMETER_PAYROLL_2026 } from '../../src/data/initialData';

// Golden baseline payroll 2026. Spec §3 melarang perubahan hasil perhitungan bisnis tanpa
// persetujuan pemilik, jadi angka di bawah dihitung manual dari PARAMETER_PAYROLL_2026 dan
// tarif Pasal 17 UU PPh — bukan diambil dari output program.

describe('hitungUpahPerJam & hitungUpahLembur — 1/173, jam pertama 1,5x', () => {
  it('upah sejam = gaji pokok / 173 dibulatkan', () => {
    expect(hitungUpahPerJam(5000000)).toBe(28902);
    expect(hitungUpahPerJam(3460000)).toBe(20000);
  });

  it('lembur 0 jam tidak menghasilkan tambahan', () => {
    expect(hitungUpahLembur(5000000, 0)).toEqual({ upahPerJam: 28902, totalLembur: 0 });
  });

  it('jam pertama 1,5x lalu jam berikutnya 2x', () => {
    expect(hitungUpahLembur(5000000, 1).totalLembur).toBe(43353); // round(28902 * 1,5)
    expect(hitungUpahLembur(5000000, 3).totalLembur).toBe(158961); // 43353 + 2 * 2 * 28902
    expect(hitungUpahLembur(5000000, 2).totalLembur).toBe(101157); // 43353 + 28902 * 2
  });

  it('jam lembur negatif diperlakukan sebagai nol', () => {
    expect(hitungUpahLembur(5000000, -2)).toEqual({ upahPerJam: 28902, totalLembur: 0 });
  });
});

describe('hitungBpjs — persen karyawan/perusahaan, batas atas upah JP', () => {
  it('gaji 10 juta: seluruh komponen dalam ratusan rupiah', () => {
    expect(hitungBpjs(10000000)).toEqual({
      dasarUpahJp: 10000000,
      kesehatanKaryawan: 100000,
      kesehatanPerusahaan: 400000,
      jhtKaryawan: 200000,
      jhtPerusahaan: 370000,
      jpKaryawan: 100000,
      jpPerusahaan: 200000,
      totalKaryawan: 400000,
      totalPerusahaan: 970000
    });
  });

  it('batas atas hanya memotong iuran JP, bukan kesehatan/JHT', () => {
    const hasil = hitungBpjs(20000000);
    expect(hasil.dasarUpahJp).toBe(PARAMETER_PAYROLL_2026.batasAtasUpahJp);
    expect(hasil.kesehatanKaryawan).toBe(200000);
    expect(hasil.jhtKaryawan).toBe(400000);
    expect(hasil.jpKaryawan).toBe(100400); // bulatkanRatusan(10042300 * 1%)
    expect(hasil.jpPerusahaan).toBe(200800); // bulatkanRatusan(10042300 * 2%)
  });

  it('setiap komponen rupiah adalah kelipatan 100 (dasarUpahJp tetap nilai asli)', () => {
    const hasil = hitungBpjs(7777777);
    for (const [nama, nilai] of Object.entries(hasil)) {
      if (nama === 'dasarUpahJp') continue;
      expect(nilai % 100, nama).toBe(0);
    }
    expect(hasil.dasarUpahJp).toBe(7777777);
    expect(hasil.kesehatanKaryawan).toBe(77800);
  });
});

describe('hitungPph21 — biaya jabatan, PTKP, dan lapisan tarif Pasal 17', () => {
  it('pkp nol di bawah PTKP', () => {
    expect(hitungPph21(4000000, 0)).toMatchObject({ pkpTahunan: 0, pajakTahunan: 0, pajakBulanan: 0 });
  });

  it('gaji 10 juta: biaya jabatan kena plafon 6 juta, pkp 56,4 juta masih di lapisan 5%', () => {
    expect(hitungPph21(10000000, 300000)).toEqual({
      brutoTahunan: 120000000,
      biayaJabatan: 6000000,
      nettoTahunan: 110400000, // 120 juta - 6 juta - iuran pensiun 3,6 juta
      pkpTahunan: 56400000,
      pajakTahunan: 2820000,
      pajakBulanan: 235000
    });
  });

  it('pkp 294 juta menempuh tiga lapisan pertama', () => {
    const hasil = hitungPph21(30000000, 500000);
    expect(hasil.pkpTahunan).toBe(294000000);
    // 60 juta x 5% + 190 juta x 15% + 44 juta x 25%
    expect(hasil.pajakTahunan).toBe(3000000 + 28500000 + 11000000);
    expect(hasil.pajakBulanan).toBe(3541667);
  });

  it('pkp dibulatkan turun ke ribuan rupiah', () => {
    const hasil = hitungPph21(5000000, 12345);
    // (60.000.000 - 3.000.000 - 148.140 - 54.000.000) = 2.851.860 -> 2.851.000
    expect(hasil.pkpTahunan).toBe(2851000);
    expect(hasil.pkpTahunan % 1000).toBe(0);
  });

  it('PTKP lebih tinggi menurunkan pajak secara monoton', () => {
    const tk0 = hitungPph21(12000000, 0);
    const tk1 = hitungPph21(12000000, 0, PARAMETER_PAYROLL_2026.ptkpTK0 + 4500000);
    expect(tk1.pkpTahunan).toBe(tk0.pkpTahunan - 4500000);
    expect(tk1.pajakTahunan).toBeLessThan(tk0.pajakTahunan);
  });
});

describe('hitungTunjanganPajak — iterasi gross up harus konvergen', () => {
  it('tunjangan menutupi pajak dengan sisa di bawah toleransi 500', () => {
    const bruto = 9950000;
    const iuran = 240000;
    const tunjangan = hitungTunjanganPajak(bruto, iuran);
    const { pajakBulanan } = hitungPph21(bruto + tunjangan, iuran);
    expect(Math.abs(pajakBulanan - tunjangan)).toBeLessThan(500);
    expect(tunjangan).toBeGreaterThan(hitungPph21(bruto, iuran).pajakBulanan);
  });

  it('pajak nol bila bruto di bawah PTKP', () => {
    expect(hitungTunjanganPajak(3000000, 0)).toBe(0);
  });
});

describe('hitungSlipGaji — identitas pengambilan dan beban perusahaan', () => {
  const dasar = {
    periode: '2026-11',
    karyawanId: 'KRY-001',
    nama: 'Budi',
    gajiPokok: 8000000,
    tunjanganKehadiran: 500000,
    insentifSales: 750000,
    insentifProduksi: 0,
    potonganAbsensi: 100000,
    lembur: 300000
  };

  // 8.000.000 + 500.000 + 750.000 + 0 + 300.000 - 100.000 = 9.450.000
  it('metode Gross: pph21 dipotong dari karyawan, take-home pay cocok dengan rinciannya', () => {
    const hasil = hitungSlipGaji({ ...dasar, metodePph21: 'Gross' });
    expect(hasil.bruto).toBe(9450000);
    expect(hasil.bpjsKesehatanKaryawan).toBe(80000);
    expect(hasil.bpjsJhtKaryawan).toBe(160000);
    expect(hasil.bpjsJpKaryawan).toBe(80000);
    expect(hasil.pph21).toBe(211875); // pkp 50.850.000 seluruhnya di lapisan 5%
    expect(hasil.takeHomePay).toBe(hasil.bruto - 320000 - hasil.pph21);
    expect(hasil.takeHomePay).toBe(8918125);
    expect(hasil.totalBebanPerusahaan).toBe(9450000 + 776000);
  });

  it('metode Net: karyawan tidak dipungut pajak, perusahaan menanggung pph21', () => {
    const hasil = hitungSlipGaji({ ...dasar, metodePph21: 'Net' });
    expect(hasil.pph21).toBe(0);
    expect(hasil.tunjanganPajak).toBe(0);
    expect(hasil.takeHomePay).toBe(hasil.bruto - 320000);
    expect(hasil.totalBebanPerusahaan).toBe(9450000 + 776000 + 211875);
  });

  it('metode Gross Up: tunjangan pajak masuk bruto dan hasil bersih sama dengan metode Net', () => {
    const hasil = hitungSlipGaji({ ...dasar, metodePph21: 'Gross Up' });
    expect(hasil.tunjanganPajak).toBeGreaterThan(211875);
    expect(hasil.pph21).toBe(hasil.tunjanganPajak);
    expect(hasil.bruto).toBe(9450000 + hasil.tunjanganPajak);
    expect(hasil.takeHomePay).toBe(hasil.bruto - 320000 - hasil.pph21);
    expect(hasil.totalBebanPerusahaan).toBe(hasil.bruto + 776000);
    // Invarian bisnis: gross up dibuat agar penerimaan bersih karyawan tidak berkurang.
    expect(hasil.takeHomePay).toBe(hitungSlipGaji({ ...dasar, metodePph21: 'Net' }).takeHomePay);
  });

  it('takeHomePay = bruto - total iuran karyawan - pph21 untuk ketiga metode', () => {
    for (const metodePph21 of ['Net', 'Gross', 'Gross Up'] as const) {
      const hasil = hitungSlipGaji({ ...dasar, metodePph21 });
      const iuranKaryawan =
        hasil.bpjsKesehatanKaryawan + hasil.bpjsJhtKaryawan + hasil.bpjsJpKaryawan;
      expect(hasil.takeHomePay, metodePph21).toBeCloseTo(hasil.bruto - iuranKaryawan - hasil.pph21, 6);
    }
  });
});

describe('formatRupiah', () => {
  it('membulatkan sebelum memformat dan memakai pemisah ribuan Indonesia', () => {
    expect(formatRupiah(152208.4)).toBe('Rp ' + (152208).toLocaleString('id-ID'));
    expect(formatRupiah(0)).toBe('Rp ' + (0).toLocaleString('id-ID'));
    expect(formatRupiah(-1000)).toBe('Rp ' + (-1000).toLocaleString('id-ID'));
  });
});
