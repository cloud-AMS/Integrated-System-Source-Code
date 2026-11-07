import type {
  AmbangStok,
  BarisOpname,
  IzinEdarAlkes,
  JejakPergerakan,
  KonfigurasiGudang,
  LogSuhu,
  OpnameStok,
  PelangganB2B,
  SkemaHargaAlkes,
  StokGudang,
  UnitSerialAlkes
} from '../../src/types';
import { tambahJejakPergerakan } from '../../src/utils/gudang';

/** Tanggal tetap untuk seluruh baseline. Semua fungsi domain menerima `dari` sehingga uji tidak evergreen. */
export const TITIK_WAKTU = new Date('2026-11-05T08:00:00Z');
export const HARI_INI = TITIK_WAKTU.toISOString().slice(0, 10);

/** Ujung awal rantai hash; sama dengan GENESIS privat di src/utils/gudang.ts. */
export const GENESIS_UJI = '0'.repeat(64);

export function konfigurasi(baru: Partial<KonfigurasiGudang> = {}): KonfigurasiGudang {
  return {
    umurKunciEdHari: 90,
    ambangSelisihOpnamePersen: 2,
    coldChainMinSuhu: 2,
    coldChainMaxSuhu: 8,
    menitMaksimumDiLuarRentang: 60,
    frekuensiLogSuhuPerHari: 24,
    prefixSuratJalan: 'SJ',
    endpointLkpp: 'https://example.invalid/lkpp',
    endpointSatuSehat: 'https://example.invalid/fhir',
    klienSatuSehatTerdaftar: false,
    ...baru
  };
}

let urutanStok = 0;

/** Nomor id/batch hasil penomoran berurutan; panggil di beforeEach agar tiap uji berdiri sendiri. */
export function resetUrutanStok() {
  urutanStok = 0;
}

export function stok(baru: Partial<StokGudang> = {}): StokGudang {
  urutanStok += 1;
  return {
    id: `STK-${String(urutanStok).padStart(3, '0')}`,
    kodeSKU: 'SKU-BASC-001',
    namaAlkes: 'Basal Camera',
    nomorIzinEdar: 'KEMENKES RI AKL 11122233344',
    nomorBatch: `BETS-${String(urutanStok).padStart(3, '0')}`,
    lokasiPenyimpanan: 'Rak A-01',
    zonaSuhu: 'Ruang Sejuk AC (15°C - 25°C)',
    jumlahStok: 10,
    satuan: 'Unit',
    tanggalMasuk: '2026-01-10',
    tanggalKedaluwarsa: '2028-01-10',
    statusFEFO: 'Aman',
    gudangId: 'WH-UTAMA',
    binId: 'A-01-01-01',
    statusStok: 'AVAILABLE',
    qtyDipesan: 0,
    jalur: 'A',
    ...baru
  };
}

export function unit(baru: Partial<UnitSerialAlkes> = {}): UnitSerialAlkes {
  return {
    id: 'UNT-001',
    nomorSerial: 'SN-0001',
    nomorBatch: 'BETS-001',
    namaAlkes: 'Basal Camera',
    pelangganId: 'PLG-001',
    nomorSalesOrder: 'SO-0001',
    nomorInvoice: 'INV-0001',
    tanggalKirim: '2026-02-01',
    statusUnit: 'Di Gudang',
    tahapSiklusHidup: 'Di Gudang',
    ...baru
  };
}

export function ambang(baru: Partial<AmbangStok> = {}): AmbangStok {
  return {
    id: 'AMB-001',
    kodeSKU: 'SKU-BASC-001',
    namaAlkes: 'Basal Camera',
    rataRataTerjualPerHari: 4,
    leadTimeHari: 7,
    safetyStockHari: 5,
    minStok: 40,
    maxStok: 120,
    gudangId: 'WH-UTAMA',
    namaPemasok: 'PT Mitra Alkes',
    isActive: true,
    ...baru
  };
}

export function barisOpname(baru: Partial<BarisOpname> = {}): BarisOpname {
  return {
    kodeSKU: 'SKU-BASC-001',
    namaAlkes: 'Basal Camera',
    nomorBatch: 'BETS-001',
    binId: 'A-01-01-01',
    qtySistem: 20,
    qtyFisik: 20,
    status: 'Cocok',
    catatan: '',
    ...baru
  };
}

export function opname(baru: Partial<OpnameStok> = {}): OpnameStok {
  return {
    id: 'OPN-001',
    nomorOpname: 'OPN/2026/11/001',
    tanggal: HARI_INI,
    gudangId: 'WH-UTAMA',
    cakupanZona: 'Ruang Sejuk AC (15°C - 25°C)',
    petugas: 'Andi',
    metode: 'Blind Count',
    baris: [barisOpname()],
    status: 'Berjalan',
    selisihUnit: 0,
    verifikasiPJT: false,
    alasanSelisih: '',
    ...baru
  };
}

export function izinEdar(baru: Partial<IzinEdarAlkes> = {}): IzinEdarAlkes {
  return {
    id: 'NIE-001',
    namaAlkes: 'Basal Camera',
    tipeModel: 'BC-100',
    nomorIzinEdar: 'KEMENKES RI AKL 11122233344',
    kategori: 'Elektromedik Radiasi',
    kelasRisiko: 'Kelas C',
    produsen: 'Prima Medika',
    negaraAsal: 'Jerman',
    tanggalTerbit: '2021-01-01',
    tanggalKedaluwarsa: '2027-01-01',
    status: 'Aktif',
    statusPerpanjangan: 'Aman',
    keterangan: '',
    ...baru
  };
}

export function skemaHarga(baru: Partial<SkemaHargaAlkes> = {}): SkemaHargaAlkes {
  return {
    id: 'SKM-001',
    namaSkema: 'Harga Institusi RS Pemerintah',
    namaAlkes: 'Basal Camera',
    level: 'Harga Institusi',
    pelangganTarget: 'RS Pemerintah',
    hargaDasar: 1000000,
    potonganKuantitas: [
      { ambangMinUnit: 10, diskonPersen: 2 },
      { ambangMinUnit: 50, diskonPersen: 5 },
      { ambangMinUnit: 100, diskonPersen: 8 }
    ],
    bonusUnit: 1,
    status: 'Aktif',
    ...baru
  };
}

export function pelanggan(baru: Partial<PelangganB2B> = {}): PelangganB2B {
  return {
    id: 'PLG-001',
    kodePelanggan: 'RS-001',
    namaInstalasi: 'RSUD Contoh',
    tipeFasyankes: 'RS Pemerintah',
    provinsi: 'Jawa Barat',
    rayonDistribusi: 'Jabar',
    akreditasi: 'Paripurna',
    nomorIzinOperasional: 'IOP/RS/2024/0091',
    tanggalBerlakuIzin: '2028-12-31',
    penanggungJawabPengadaan: 'Bendahara',
    namaDokterPenanggungJawab: 'dr. Contoh',
    spesialisasiDokter: 'Radiologi',
    batasKredit: 100000000,
    piutangBerjalan: 0,
    tanggalJatuhTempoPiutang: '2026-12-31',
    termsOfPaymentHari: 30,
    statusPelanggan: 'Aktif',
    ...baru
  };
}

/** Rantai pergerakan dasar, dibangun lewat fungsi produksi sehingga tidak ada duplikasi aturan hash di test. */
export function rantaiDasar(): JejakPergerakan[] {
  const isi = [
    { waktu: `${HARI_INI} 08:00`, nomorBatch: 'BETS-A', dariBin: 'TERIMA', keBin: 'A-01-01-01', jumlah: 30, tipe: 'Penerimaan' as const },
    { waktu: `${HARI_INI} 09:00`, nomorBatch: 'BETS-A', dariBin: 'A-01-01-01', keBin: 'A-02-01-03', jumlah: 5, tipe: 'Pemindahan Rak' as const },
    { waktu: `${HARI_INI} 10:00`, nomorBatch: 'BETS-B', dariBin: 'TERIMA', keBin: 'A-03-02-01', jumlah: 12, tipe: 'Penerimaan' as const }
  ];
  let daftar: JejakPergerakan[] = [];
  for (const entri of isi) {
    daftar = tambahJejakPergerakan(daftar, {
      kodeSKU: 'SKU-BASC-001',
      namaAlkes: 'Basal Camera',
      satuan: 'Unit',
      pengguna: 'Siti',
      peran: 'pjt',
      dokumenRujukan: 'DO/2026/001',
      alasan: 'Baseline pengujian',
      ...entri
    });
  }
  return daftar;
}

export function logSuhu(baru: Partial<LogSuhu> = {}): LogSuhu {
  return {
    id: 'LOG-001',
    sensor: 'SNS-COLD-01',
    zona: 'Cold Chain (2°C - 8°C)',
    suhu: 5,
    kelembaban: 45,
    waktu: `${HARI_INI} 08:00`,
    status: 'Normal',
    ...baru
  };
}
