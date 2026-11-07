import {
  CustomerFaskes,
  OpportunityLead,
  SalesTerritory,
  LPSETender,
  PriceLockAgreement,
  VisitSchedule,
  DigitalBrochure,
  SalesOrderExtended,
  ProductTraceabilityRecord,
  DemoUnitLoan,
  MarketingEvent,
  LoyaltyRebate,
  DemandForecastItem,
  PartitionTableInfo,
  AuditTrailMedis
} from '../types/salesMarketing';

export const INITIAL_CUSTOMERS_FASKES: CustomerFaskes[] = [
  {
    id: 'FAS-001',
    kodeFaskes: '3171012',
    namaInstitusi: 'RSUP Dr. Cipto Mangunkusumo (RSCM)',
    tipeFaskes: 'RS Pemerintah Kelas A',
    akreditasiKemenkes: 'Paripurna',
    nomorIzinOperasional: '440/012/IZIN-RS/DPMPTSP/2023',
    masaBerlakuIzin: '2028-08-15',
    isIzinValid: true,
    dokterPenanggungJawab: 'dr. Hendra Prasetya, Sp.An-TI, Subsp.IC(K)',
    kontakPengadaan: 'Bpk. Irfan Budiman, S.Farm, Apt (PPK Pengadaan Alkes)',
    noTelepon: '(021) 1500135',
    email: 'pengadaan.alkes@rscm.co.id',
    alamat: 'Jl. Diponegoro No. 71, Kenari, Senen, Jakarta Pusat',
    wilayah: 'DKI Jakarta & Banten',
    batasKredit: 1500000000,
    piutangBerjalan: 420000000,
    sisaKredit: 1080000000,
    termOfPaymentHari: 60,
    statusVerifikasiCDAKB: 'Tervalifikasi PJT',
    koordinatLat: -6.1974,
    koordinatLng: 106.8485
  },
  {
    id: 'FAS-002',
    kodeFaskes: '3471014',
    namaInstitusi: 'RSUP Dr. Sardjito Yogyakarta',
    tipeFaskes: 'RS Pemerintah Kelas A',
    akreditasiKemenkes: 'Paripurna',
    nomorIzinOperasional: '503/442/RS-A/DIY/2022',
    masaBerlakuIzin: '2027-11-20',
    isIzinValid: true,
    dokterPenanggungJawab: 'dr. Tri Hartono, Sp.B, Subsp.Onk(K)',
    kontakPengadaan: 'Ibu Ratna Dewi, SE (Unit Layanan Pengadaan)',
    noTelepon: '(0274) 587333',
    email: 'ulp@sardjito.co.id',
    alamat: 'Jl. Kesehatan No. 1, Sekip, Sleman, DI Yogyakarta',
    wilayah: 'Jawa Tengah & DIY',
    batasKredit: 1200000000,
    piutangBerjalan: 310000000,
    sisaKredit: 890000000,
    termOfPaymentHari: 45,
    statusVerifikasiCDAKB: 'Tervalifikasi PJT',
    koordinatLat: -7.7686,
    koordinatLng: 110.3737
  },
  {
    id: 'FAS-003',
    kodeFaskes: '3174025',
    namaInstitusi: 'RS Kanker Dharmais (Pusat Kanker Nasional)',
    tipeFaskes: 'RS Pemerintah Kelas A',
    akreditasiKemenkes: 'Paripurna',
    nomorIzinOperasional: '445/008/PKN/DINKES-DKI/2024',
    masaBerlakuIzin: '2029-04-10',
    isIzinValid: true,
    dokterPenanggungJawab: 'dr. Maya Lestari, Sp.Rad(K)',
    kontakPengadaan: 'Bpk. Ahmad Fauzi (Bagian Farmasi & Alat Medis)',
    noTelepon: '(021) 5681570',
    email: 'procurement@dharmais.co.id',
    alamat: 'Jl. Letjen S. Parman Kav. 84-86, Slipi, Jakarta Barat',
    wilayah: 'DKI Jakarta & Banten',
    batasKredit: 2000000000,
    piutangBerjalan: 1850000000,
    sisaKredit: 150000000,
    termOfPaymentHari: 90,
    statusVerifikasiCDAKB: 'Tervalifikasi PJT',
    koordinatLat: -6.1903,
    koordinatLng: 106.7972
  },
  {
    id: 'FAS-004',
    kodeFaskes: '3173031',
    namaInstitusi: 'RS Siloam Hospitals Kebon Jeruk',
    tipeFaskes: 'RS Swasta',
    akreditasiKemenkes: 'Paripurna',
    nomorIzinOperasional: '503/014/RS-SWASTA/JB/2021',
    masaBerlakuIzin: '2026-12-31',
    isIzinValid: true,
    dokterPenanggungJawab: 'dr. Richard Gunawan, Sp.JP, FIHA',
    kontakPengadaan: 'Ibu Stefanie (Head of Supply Chain Siloam)',
    noTelepon: '(021) 25779000',
    email: 'procurement.shkj@siloamhospitals.com',
    alamat: 'Jl. Raya Pejuangan Kav. 8, Kebon Jeruk, Jakarta Barat',
    wilayah: 'DKI Jakarta & Banten',
    batasKredit: 800000000,
    piutangBerjalan: 120000000,
    sisaKredit: 680000000,
    termOfPaymentHari: 30,
    statusVerifikasiCDAKB: 'Tervalifikasi PJT',
    koordinatLat: -6.1925,
    koordinatLng: 106.7663
  },
  {
    id: 'FAS-005',
    kodeFaskes: '3273010',
    namaInstitusi: 'RSUD Al-Ihsan Provinsi Jawa Barat',
    tipeFaskes: 'RS Pemerintah Kelas B',
    akreditasiKemenkes: 'Utama',
    nomorIzinOperasional: '445.1/045/RSUD/JABAR/2023',
    masaBerlakuIzin: '2028-06-18',
    isIzinValid: true,
    dokterPenanggungJawab: 'dr. Rahmat Hidayat, Sp.OG',
    kontakPengadaan: 'Bpk. Dede Sukmana, ST (PPK Sarpras)',
    noTelepon: '(022) 5940872',
    email: 'sarpras@rsudalihsan.jabarprov.go.id',
    alamat: 'Jl. Ki Astramanggala, Baleendah, Bandung, Jawa Barat',
    wilayah: 'Jawa Barat',
    batasKredit: 750000000,
    piutangBerjalan: 710000000,
    sisaKredit: 40000000,
    termOfPaymentHari: 60,
    statusVerifikasiCDAKB: 'Tervalifikasi PJT',
    koordinatLat: -7.0093,
    koordinatLng: 107.6256
  },
  {
    id: 'FAS-006',
    kodeFaskes: '3171099',
    namaInstitusi: 'Klinik Utama Pratama Sehat Medika',
    tipeFaskes: 'Klinik Utama',
    akreditasiKemenkes: 'Madya',
    nomorIzinOperasional: '012/KLINIK/DPMPTSP/2020',
    masaBerlakuIzin: '2024-02-10', // Sudah Expired untuk uji coba validator!
    isIzinValid: false,
    dokterPenanggungJawab: 'dr. Anita Wijaya',
    kontakPengadaan: 'Ibu Nurul (Manajer Operasional)',
    noTelepon: '(021) 88997766',
    email: 'klinik.sehatmedika@gmail.com',
    alamat: 'Jl. Tebet Barat Raya No. 45, Jakarta Selatan',
    wilayah: 'DKI Jakarta & Banten',
    batasKredit: 100000000,
    piutangBerjalan: 95000000,
    sisaKredit: 5000000,
    termOfPaymentHari: 14,
    statusVerifikasiCDAKB: 'Perlu Pembaruan Dokumen',
    koordinatLat: -6.2361,
    koordinatLng: 106.8522
  }
];

export const INITIAL_OPPORTUNITIES: OpportunityLead[] = [
  {
    id: 'LEAD-001',
    judulProspek: 'Pengadaan 10 Unit Patient Monitor ICU & Central Station',
    faskesId: 'FAS-001',
    namaFaskes: 'RSUP Dr. Cipto Mangunkusumo (RSCM)',
    tipeFaskes: 'RS Pemerintah Kelas A',
    alkesTertarget: 'Patient Monitor Multi-Parameter AMS-V12 Pro',
    kategoriAlkes: 'Elektromedik Non Radiasi',
    estimasiNilai: 750000000,
    tahapan: 'Penawaran Teknis',
    probabilitasPersen: 75,
    medRep: 'Dimas Satria, S.T. (MedRep Jakarta 1)',
    tanggalUpdate: '2026-11-02',
    catatanTerakhir: 'Demo produk sukses di ruang ICU Gedung A RSCM. Spesifikasi disetujui dr. Hendra Prasetya.'
  },
  {
    id: 'LEAD-002',
    judulProspek: 'Re-tender USG 4D Color Doppler Departemen Obgyn',
    faskesId: 'FAS-002',
    namaFaskes: 'RSUP Dr. Sardjito Yogyakarta',
    tipeFaskes: 'RS Pemerintah Kelas A',
    alkesTertarget: 'AMS Ultrasound 4D High-Definition Sonoview',
    kategoriAlkes: 'Elektromedik Non Radiasi',
    estimasiNilai: 1200000000,
    tahapan: 'Demo Produk',
    probabilitasPersen: 60,
    medRep: 'Budi Santoso, S.Si (MedRep DIY & Solo)',
    tanggalUpdate: '2026-11-01',
    catatanTerakhir: 'Unit demo sedang diuji klinis selama 7 hari di poli fetomaternal.'
  },
  {
    id: 'LEAD-003',
    judulProspek: 'Kontrak Tahunan Spuit Infus & Disposable Bedah Steril',
    faskesId: 'FAS-004',
    namaFaskes: 'RS Siloam Hospitals Kebon Jeruk',
    tipeFaskes: 'RS Swasta',
    alkesTertarget: 'Auto-Disable Syringe AMS-Safe 3ml & 5ml (Steril)',
    kategoriAlkes: 'Non Elektromedik Steril',
    estimasiNilai: 360000000,
    tahapan: 'Negosiasi Harga',
    probabilitasPersen: 85,
    medRep: 'Dimas Satria, S.T. (MedRep Jakarta 1)',
    tanggalUpdate: '2026-10-29',
    catatanTerakhir: 'Pengajuan diskon volume 12% untuk komitmen pemesanan 50.000 pcs per triwulan.'
  },
  {
    id: 'LEAD-004',
    judulProspek: 'Pengadaan Mobile X-Ray Digital Radiography IGD',
    faskesId: 'FAS-005',
    namaFaskes: 'RSUD Al-Ihsan Provinsi Jawa Barat',
    tipeFaskes: 'RS Pemerintah Kelas B',
    alkesTertarget: 'AMS Digital Mobile Radiography 32kW',
    kategoriAlkes: 'Elektromedik Radiasi',
    estimasiNilai: 1850000000,
    tahapan: 'Perkenalan Alat',
    probabilitasPersen: 35,
    medRep: 'Ferry Pratama, A.Md.TEM (MedRep Bandung & Jabar)',
    tanggalUpdate: '2026-10-25',
    catatanTerakhir: 'Audiensi pertama dengan Ka. Instalasi Radiologi & Komite Medik.'
  },
  {
    id: 'LEAD-005',
    judulProspek: 'Pengadaan Paket Reagen & Rapid Test In-Vitro Diagnostik',
    faskesId: 'FAS-003',
    namaFaskes: 'RS Kanker Dharmais',
    tipeFaskes: 'RS Pemerintah Kelas A',
    alkesTertarget: 'AMS OncoTrace Biomarker Rapid Kit (IVD)',
    kategoriAlkes: 'Diagnostik In Vitro',
    estimasiNilai: 520000000,
    tahapan: 'Menang (SPK)',
    probabilitasPersen: 100,
    medRep: 'Siti Rahmawati, S.Tr.Kes (MedRep Jakarta 2)',
    tanggalUpdate: '2026-11-03',
    catatanTerakhir: 'Surat Pesanan SPK LKPP Nomor SPK-LKPP/2026/XI/088 telah terbit resmi.'
  }
];

export const INITIAL_TERRITORIES: SalesTerritory[] = [
  {
    id: 'TERR-01',
    namaWilayah: 'Wilayah 1: DKI Jakarta & Banten',
    cakupanKota: ['Jakarta Pusat', 'Jakarta Barat', 'Jakarta Selatan', 'Tangerang Raya', 'Serang'],
    medRepPIC: 'Dimas Satria & Siti Rahmawati',
    nomorKontak: '0812-9988-7711',
    targetKuartal: 5000000000,
    realisasiKuartal: 4150000000,
    jumlahFaskesTerdaftar: 48,
    statusOverlap: 'Bebas Konflik'
  },
  {
    id: 'TERR-02',
    namaWilayah: 'Wilayah 2: Jawa Barat',
    cakupanKota: ['Bandung Raya', 'Bogor', 'Bekasi', 'Cirebon', 'Tasikmalaya', 'Karawang'],
    medRepPIC: 'Ferry Pratama, A.Md.TEM',
    nomorKontak: '0813-2211-4433',
    targetKuartal: 3500000000,
    realisasiKuartal: 2890000000,
    jumlahFaskesTerdaftar: 36,
    statusOverlap: 'Bebas Konflik'
  },
  {
    id: 'TERR-03',
    namaWilayah: 'Wilayah 3: Jawa Tengah & D.I. Yogyakarta',
    cakupanKota: ['Yogyakarta', 'Sleman', 'Semarang', 'Solo', 'Banyumas', 'Pekalongan'],
    medRepPIC: 'Budi Santoso, S.Si',
    nomorKontak: '0811-3344-5566',
    targetKuartal: 3000000000,
    realisasiKuartal: 2950000000,
    jumlahFaskesTerdaftar: 29,
    statusOverlap: 'Bebas Konflik'
  },
  {
    id: 'TERR-04',
    namaWilayah: 'Wilayah 4: Jawa Timur & Bali',
    cakupanKota: ['Surabaya', 'Malang', 'Sidoarjo', 'Denpasar', 'Jember', 'Kediri'],
    medRepPIC: 'Arya Putra, S.Farm',
    nomorKontak: '0817-8899-0022',
    targetKuartal: 4000000000,
    realisasiKuartal: 3120000000,
    jumlahFaskesTerdaftar: 41,
    statusOverlap: 'Bebas Konflik'
  }
];

export const INITIAL_LPSE_TENDERS: LPSETender[] = [
  {
    id: 'TDR-001',
    kodeTender: 'LPSE-KEMKES-984210',
    namaPaket: 'Pengadaan Paket Patient Monitor Multi-Parameter Ruang Rawat Intensif RS Vertikal',
    instansi: 'Kementerian Kesehatan RI - Ditjen Pelayanan Kesehatan',
    kategoriAlkes: 'Elektromedik Non Radiasi',
    nilaiHPS: 3450000000,
    metodePengadaan: 'e-Katalog Mini Kompetisi',
    sisaHari: 4,
    tanggalBatas: '2026-11-07 15:00 WIB',
    dokumenSyarat: [
      'NIE AKD/AKL Masih Berlaku (Wajib)',
      'Sertifikat Standar Distribusi Alkes (SDAK)',
      'Sertifikat Jaminan Ketersediaan Suku Cadang 5 Tahun',
      'Surat Dukungan Pabrikan / Surat Penunjukan Distributor Resmi'
    ],
    statusKualifikasi: 'Memenuhi Syarat CDAKB & Izin Edar',
    rekomendasiBidding: 3180000000,
    statusBidding: 'Penyusunan Proposal'
  },
  {
    id: 'TDR-002',
    kodeTender: 'LPSE-DIY-772190',
    namaPaket: 'Belanja Modal Alat Kedokteran Kebidanan dan Penyakit Kandungan (USG 4D)',
    instansi: 'RSUP Dr. Sardjito Yogyakarta',
    kategoriAlkes: 'Elektromedik Non Radiasi',
    nilaiHPS: 1250000000,
    metodePengadaan: 'Tender Terbuka LPSE',
    sisaHari: 8,
    tanggalBatas: '2026-11-11 12:00 WIB',
    dokumenSyarat: [
      'Izin Edar Kemenkes RI AKL Alkes Kelas B',
      'Surat Keterangan Teknisi Bersertifikat Pelatihan Pabrikan',
      'BAST Uji Fungsi & Kalibrasi BPFK'
    ],
    statusKualifikasi: 'Memenuhi Syarat CDAKB & Izin Edar',
    rekomendasiBidding: 1145000000,
    statusBidding: 'Monitoring'
  },
  {
    id: 'TDR-003',
    kodeTender: 'LPSE-JABAR-554109',
    namaPaket: 'Pengadaan Habis Pakai Medis Spuit & Selang Infus Program Jamkesda',
    instansi: 'Dinas Kesehatan Provinsi Jawa Barat',
    kategoriAlkes: 'Non Elektromedik Steril',
    nilaiHPS: 890000000,
    metodePengadaan: 'e-Katalog Mini Kompetisi',
    sisaHari: 2,
    tanggalBatas: '2026-11-05 16:00 WIB',
    dokumenSyarat: [
      'Sertifikat CPAKB Pabrik Lokal (TKDN > 40%)',
      'Sertifikat Uji Sterilitas Batch',
      'Izin Edar Kemenkes RI AKD'
    ],
    statusKualifikasi: 'Memenuhi Syarat CDAKB & Izin Edar',
    rekomendasiBidding: 815000000,
    statusBidding: 'Penawaran Terkirim'
  }
];

export const INITIAL_PRICE_LOCKS: PriceLockAgreement[] = [
  {
    id: 'PLA-001',
    nomorKontrak: 'KONTRAK-HARGA-RSCM/2026/04',
    faskesId: 'FAS-001',
    namaFaskes: 'RSUP Dr. Cipto Mangunkusumo (RSCM)',
    namaAlkes: 'Patient Monitor Multi-Parameter AMS-V12 Pro',
    tipeModel: 'AMS-V12-PRO',
    hargaKatalog: 65000000,
    hargaTerkunci: 54000000,
    diskonPersen: 16.9,
    moq: 10,
    masaBerlakuMulai: '2026-01-01',
    masaBerlakuSelesai: '2026-12-31',
    klausulSLA: 'Garansi unit 24 bulan, respon teknisi maksimal 1x24 jam di Jakarta.',
    status: 'Aktif Terkunci'
  },
  {
    id: 'PLA-002',
    nomorKontrak: 'KONTRAK-SILOAM-GRP/2025/11',
    faskesId: 'FAS-004',
    namaFaskes: 'RS Siloam Hospitals Kebon Jeruk',
    namaAlkes: 'Auto-Disable Syringe AMS-Safe 3ml (Steril)',
    tipeModel: 'AMS-ADS-03',
    hargaKatalog: 2200,
    hargaTerkunci: 1650,
    diskonPersen: 25.0,
    moq: 20000,
    masaBerlakuMulai: '2025-11-01',
    masaBerlakuSelesai: '2026-11-30',
    klausulSLA: 'Stok buffer di gudang minimal 50.000 pcs disiapkan penyalur.',
    status: 'Mendekati Berakhir'
  }
];

export const INITIAL_VISIT_SCHEDULES: VisitSchedule[] = [
  {
    id: 'VISIT-001',
    medRepId: 'REP-01',
    namaMedRep: 'Dimas Satria, S.T.',
    tanggalKunjungan: '2026-11-04',
    jamRencana: '09:30 WIB',
    faskesId: 'FAS-001',
    namaFaskes: 'RSUP Dr. Cipto Mangunkusumo (RSCM)',
    alamatFaskes: 'Jl. Diponegoro No. 71, Kenari, Senen, Jakarta Pusat',
    tujuanKunjungan: 'Follow-up Penawaran Teknis Patient Monitor ICU & Pembahasan BAST Uji Fungsi',
    picTarget: 'dr. Hendra Prasetya, Sp.An-TI & Bpk. Irfan Budiman',
    statusVisit: 'Check-In GPS Terverifikasi',
    targetLat: -6.1974,
    targetLng: 106.8485,
    actualLat: -6.1973,
    actualLng: 106.8486,
    selisihJarakMeter: 18,
    fotoBukti: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&q=80',
    catatanHasil: 'Dokter PJ menyambut baik revisi penawaran kabel ECG 5-lead. Draft kontrak diserahkan ke bagian ULP.'
  },
  {
    id: 'VISIT-002',
    medRepId: 'REP-02',
    namaMedRep: 'Ferry Pratama, A.Md.TEM',
    tanggalKunjungan: '2026-11-04',
    jamRencana: '13:00 WIB',
    faskesId: 'FAS-005',
    namaFaskes: 'RSUD Al-Ihsan Provinsi Jawa Barat',
    alamatFaskes: 'Jl. Ki Astramanggala, Baleendah, Bandung',
    tujuanKunjungan: 'Presentasi Teknis Mobile X-Ray & Penjelasan NIE Kemenkes RI',
    picTarget: 'Bpk. Dede Sukmana, ST (PPK Sarpras)',
    statusVisit: 'Terjadwal',
    targetLat: -7.0093,
    targetLng: 107.6256
  },
  {
    id: 'VISIT-003',
    medRepId: 'REP-03',
    namaMedRep: 'Budi Santoso, S.Si',
    tanggalKunjungan: '2026-11-03',
    jamRencana: '10:00 WIB',
    faskesId: 'FAS-002',
    namaFaskes: 'RSUP Dr. Sardjito Yogyakarta',
    alamatFaskes: 'Jl. Kesehatan No. 1, Sekip, Sleman, Yogyakarta',
    tujuanKunjungan: 'Pemeriksaan Unit Demo USG 4D hari ke-3 & pendampingan dokter residen',
    picTarget: 'dr. Tri Hartono, Sp.B, Subsp.Onk(K)',
    statusVisit: 'Selesai Kunjungan',
    targetLat: -7.7686,
    targetLng: 110.3737,
    actualLat: -7.7687,
    actualLng: 110.3736,
    selisihJarakMeter: 14,
    catatanHasil: 'Kualitas citra resolusi tinggi diapresiasi spesialis kandungan. Menunggu rapat pleno komite medik hari Senin.'
  }
];

export const INITIAL_BROCHURES: DigitalBrochure[] = [
  {
    id: 'BRO-001',
    namaAlkes: 'Patient Monitor Multi-Parameter AMS-V12 Pro',
    tipeModel: 'AMS-V12-PRO',
    nomorIzinEdar: 'KEMENKES RI AKD 20501910234',
    produsen: 'PT Antarmitra Medika Solusindo (AMS)',
    kategori: 'Elektromedik Non Radiasi',
    sertifikasi: ['ISO 13485:2016', 'CPAKB Kemenkes RI', 'TKDN 43.8%'],
    ringkasanSpek: 'Layar 12.1 inci High-Res TFT, 6 parameter standar (ECG, NIBP, SpO2, Resp, 2x Temp, PR) + Opsional EtCO2 & 2-IBP.',
    fiturUtama: [
      'Algoritma arrhythmia detection 23 tipe aritmia jantung',
      'Penyimpanan gelombang tren 120 jam',
      'Konektivitas HL7 ke SIMRS / HIS Rumah Sakit',
      'Baterai Lithium backup hingga 4 jam pengoperasian'
    ],
    fileBrochurePdf: '/docs/brochure-ams-v12.pdf',
    videoDemoUrl: 'https://www.youtube.com/watch?v=sample-med-demo',
    statusNIE: 'Aktif Resmi'
  },
  {
    id: 'BRO-002',
    namaAlkes: 'AMS Ultrasound 4D High-Definition Sonoview',
    tipeModel: 'AMS-USG-4D-HD',
    nomorIzinEdar: 'KEMENKES RI AKL 21501220911',
    produsen: 'Medisonic Biosystems Corp (Impor Resmi)',
    kategori: 'Elektromedik Non Radiasi',
    sertifikasi: ['CE 0123 Medical', 'US FDA 510(k)', 'ISO 13485'],
    ringkasanSpek: 'Probe konveks 4D, Linear vascular, dan transvaginal frekuensi ganda dengan teknologi render real-time HD-Live.',
    fiturUtama: [
      'Render 4D High Definition warna kulit janin realistis',
      'Elastografi kuantitatif tumor & nodul tiroid',
      'Autosequence kalkulasi biometri obstetri otomatis',
      'Layar OLED 21.5 inci dengan lengan artikulasi fleksibel'
    ],
    fileBrochurePdf: '/docs/brochure-ams-usg4d.pdf',
    videoDemoUrl: 'https://www.youtube.com/watch?v=sample-usg-demo',
    statusNIE: 'Aktif Resmi'
  },
  {
    id: 'BRO-003',
    namaAlkes: 'Auto-Disable Syringe AMS-Safe 3ml & 5ml (Steril)',
    tipeModel: 'AMS-ADS-03 & 05',
    nomorIzinEdar: 'KEMENKES RI AKD 20902910450',
    produsen: 'PT Antarmitra Medika Solusindo (AMS)',
    kategori: 'Non Elektromedik Steril',
    sertifikasi: ['ISO 7886-4', 'Sterilisasi EtO Validated', 'TKDN 52.4%'],
    ringkasanSpek: 'Alat suntik sekali pakai dengan mekanisme pengunci pendorong otomatis pasca injeksi untuk mencegah infeksi nosokomial silang.',
    fiturUtama: [
      'Mekanisme Auto-Disable otomatis mengunci plunger',
      'Jarum stainless ultra-thin siliconized minim nyeri suntik',
      'Skala cetak ultra presisi anti luntur',
      'Kemasan blister medis individual bersertifikasi non-toksik'
    ],
    fileBrochurePdf: '/docs/brochure-ams-ads.pdf',
    videoDemoUrl: 'https://www.youtube.com/watch?v=sample-syringe-demo',
    statusNIE: 'Aktif Resmi'
  }
];

export const INITIAL_SALES_ORDERS_EXTENDED: SalesOrderExtended[] = [
  {
    id: 'SO-2026-001',
    nomorSO: 'SO-EKAT-2026-0182',
    tanggal: '2026-11-02',
    faskesId: 'FAS-001',
    namaFaskes: 'RSUP Dr. Cipto Mangunkusumo (RSCM)',
    tipeFaskes: 'RS Pemerintah Kelas A',
    wilayah: 'DKI Jakarta & Banten',
    items: [
      {
        alkesId: 'ALK-001',
        namaAlkes: 'Patient Monitor Multi-Parameter AMS-V12 Pro',
        tipeModel: 'AMS-V12-PRO',
        nomorIzinEdar: 'KEMENKES RI AKD 20501910234',
        isIzinEdarAktif: true,
        batchLot: 'LOT-2026-PM08',
        nomorSeri: 'SN-V12-9901 s/d SN-V12-9905',
        stokTersedia: 24,
        jumlah: 5,
        satuan: 'Unit',
        hargaSatuan: 54000000,
        diskonPersen: 0,
        total: 270000000
      }
    ],
    subtotal: 270000000,
    ppn11Persen: 29700000,
    grandTotal: 299700000,
    termOfPayment: 'TOP 60 Hari',
    jatuhTempo: '2027-01-01',
    statusComplianceCDAKB: 'Lolos Validasi CDAKB',
    statusKredit: 'Aman',
    statusOrder: 'Disetujui',
    namaSales: 'Dimas Satria, S.T.',
    keterangan: 'Paket e-Katalog LKPP Instalasi Gawat Darurat & HCU RSCM.',
    catatanPJT: 'NIE valid, izin faskes aktif hingga 2028. Lolos verifikasi regulasi.'
  },
  {
    id: 'SO-2026-002',
    nomorSO: 'SO-SWASTA-2026-0095',
    tanggal: '2026-11-01',
    faskesId: 'FAS-004',
    namaFaskes: 'RS Siloam Hospitals Kebon Jeruk',
    tipeFaskes: 'RS Swasta',
    wilayah: 'DKI Jakarta & Banten',
    items: [
      {
        alkesId: 'ALK-003',
        namaAlkes: 'Auto-Disable Syringe AMS-Safe 3ml (Steril)',
        tipeModel: 'AMS-ADS-03',
        nomorIzinEdar: 'KEMENKES RI AKD 20902910450',
        isIzinEdarAktif: true,
        batchLot: 'LOT-2026-SYR44',
        stokTersedia: 85000,
        jumlah: 25000,
        satuan: 'Pcs',
        hargaSatuan: 1650,
        diskonPersen: 0,
        total: 41250000
      }
    ],
    subtotal: 41250000,
    ppn11Persen: 4537500,
    grandTotal: 45787500,
    termOfPayment: 'TOP 30 Hari',
    jatuhTempo: '2026-12-01',
    statusComplianceCDAKB: 'Lolos Validasi CDAKB',
    statusKredit: 'Aman',
    statusOrder: 'Alokasi FEFO Gudang',
    namaSales: 'Dimas Satria, S.T.',
    keterangan: 'Pengiriman rutin mingguan Farmasi Siloam.'
  },
  {
    id: 'SO-2026-003',
    nomorSO: 'SO-TDR-2026-0042',
    tanggal: '2026-10-28',
    faskesId: 'FAS-003',
    namaFaskes: 'RS Kanker Dharmais',
    tipeFaskes: 'RS Pemerintah Kelas A',
    wilayah: 'DKI Jakarta & Banten',
    items: [
      {
        alkesId: 'ALK-005',
        namaAlkes: 'AMS OncoTrace Biomarker Rapid Kit (IVD)',
        tipeModel: 'AMS-IVD-ONCO',
        nomorIzinEdar: 'KEMENKES RI AKD 20303810190',
        isIzinEdarAktif: true,
        batchLot: 'LOT-2026-IVD09',
        stokTersedia: 400,
        jumlah: 150,
        satuan: 'Kit (50 Test)',
        hargaSatuan: 3200000,
        diskonPersen: 5,
        total: 456000000
      }
    ],
    subtotal: 456000000,
    ppn11Persen: 50160000,
    grandTotal: 506160000,
    termOfPayment: 'TOP 90 Hari',
    jatuhTempo: '2027-01-26',
    statusComplianceCDAKB: 'Lolos Validasi CDAKB',
    statusKredit: 'Peringatan Plafon',
    statusOrder: 'Diverifikasi PJT',
    namaSales: 'Siti Rahmawati, S.Tr.Kes',
    keterangan: 'Plafon kredit mendekati limit (sisa Rp 150 Jt vs nilai Rp 506 Jt). Memerlukan persetujuan Finance Director.'
  }
];

export const INITIAL_TRACEABILITY_RECORDS: ProductTraceabilityRecord[] = [
  {
    id: 'TRC-001',
    nomorSeriOrBatch: 'SN-V12-9901',
    tipeTracking: 'Nomor Seri (Alkes Elektro-Medik)',
    namaAlkes: 'Patient Monitor Multi-Parameter AMS-V12 Pro',
    nomorIzinEdar: 'KEMENKES RI AKD 20501910234',
    tanggalManufaktur: '2026-08-10',
    nomorSO: 'SO-EKAT-2026-0182',
    nomorFaktur: 'INV-2026-11-0021',
    faskesPenerima: 'RSUP Dr. Cipto Mangunkusumo (RSCM)',
    tanggalKirim: '2026-11-03',
    tanggalInstalasi: '2026-11-04',
    nomorBAST: 'BAST/RSCM/2026/XI/109',
    masaGaransiBulan: 24,
    akhirGaransi: '2028-11-04',
    statusRecall: 'Aman',
    teknisiInstalasi: 'Agus Santoso (Teknisi Elektromedik Bersertifikat)',
    jadwalPMAwal: '2027-02-04 (Preventive Maintenance Triwulan I)'
  },
  {
    id: 'TRC-002',
    nomorSeriOrBatch: 'LOT-2026-SYR44',
    tipeTracking: 'Nomor Bets / Lot (Alkes Habis Pakai)',
    namaAlkes: 'Auto-Disable Syringe AMS-Safe 3ml (Steril)',
    nomorIzinEdar: 'KEMENKES RI AKD 20902910450',
    tanggalManufaktur: '2026-09-01',
    tanggalKedaluwarsa: '2029-09-01',
    nomorSO: 'SO-SWASTA-2026-0095',
    nomorFaktur: 'INV-2026-11-0019',
    faskesPenerima: 'RS Siloam Hospitals Kebon Jeruk',
    tanggalKirim: '2026-11-02',
    statusRecall: 'Aman'
  },
  {
    id: 'TRC-003',
    nomorSeriOrBatch: 'LOT-2025-REAG03',
    tipeTracking: 'Nomor Bets / Lot (Alkes Habis Pakai)',
    namaAlkes: 'AMS Hemodialysis Acid Concentrate Solution',
    nomorIzinEdar: 'KEMENKES RI AKD 20801910299',
    tanggalManufaktur: '2025-05-12',
    tanggalKedaluwarsa: '2027-05-12',
    nomorSO: 'SO-HIST-2025-1102',
    nomorFaktur: 'INV-2025-06-0310',
    faskesPenerima: 'RSUD Tarakan & RS Fatmawati',
    tanggalKirim: '2025-06-15',
    statusRecall: 'Penarikan Produk (RECALL)'
  }
];

export const INITIAL_DEMO_UNITS: DemoUnitLoan[] = [
  {
    id: 'DEMO-001',
    nomorPeminjaman: 'LOAN-DEMO-2026-014',
    namaAlkes: 'AMS Ultrasound 4D High-Definition Sonoview',
    tipeModel: 'AMS-USG-4D-HD',
    nomorSeri: 'SN-USG-DEMO-03',
    faskesPeminjam: 'RSUP Dr. Sardjito Yogyakarta',
    dokterPenguji: 'dr. Tri Hartono, Sp.B, Subsp.Onk(K)',
    departemen: 'Poli Fetomaternal & Kebidanan',
    tanggalKirim: '2026-10-28',
    batasWaktuKembali: '2026-11-12',
    kondisiFisik: 'Sangat Baik',
    statusPeminjaman: 'Sedang Uji Coba di RS',
    medRepPIC: 'Budi Santoso, S.Si',
    catatanUjiFungsi: 'Uji klinis 4D janin berjalan lancar. Belum ada kendala kalibrasi probe.'
  },
  {
    id: 'DEMO-002',
    nomorPeminjaman: 'LOAN-DEMO-2026-009',
    namaAlkes: 'Patient Monitor Multi-Parameter AMS-V12 Pro',
    tipeModel: 'AMS-V12-PRO',
    nomorSeri: 'SN-V12-DEMO-01',
    faskesPeminjam: 'RSUD Al-Ihsan Bandung',
    dokterPenguji: 'dr. Rahmat Hidayat, Sp.OG',
    departemen: 'Kamar Bersalin & HCU',
    tanggalKirim: '2026-10-10',
    batasWaktuKembali: '2026-10-24',
    kondisiFisik: 'Baik',
    statusPeminjaman: 'Dikonversi Menjadi Pembelian',
    medRepPIC: 'Ferry Pratama, A.Md.TEM',
    catatanUjiFungsi: 'Pihak RS langsung menerbitkan Surat Pesanan Pembelian Definitif setelah masa pinjam 14 hari.'
  }
];

export const INITIAL_MARKETING_EVENTS: MarketingEvent[] = [
  {
    id: 'EVT-001',
    namaEvent: 'Hospital Expo Indonesia Ke-36 (JCC Senayan)',
    jenisEvent: 'Pameran Hospital Expo',
    lokasi: 'Jakarta Convention Center (Hall B, Booth No. 42-45)',
    tanggalMulai: '2026-10-18',
    tanggalSelesai: '2026-10-21',
    anggaran: 250000000,
    realisasiBiaya: 238500000,
    jumlahLeadDidapat: 84,
    potensiRevenueLead: 6800000000,
    sponsorDokter: ['dr. Anton, Sp.An', 'dr. Cindy, Sp.Rad', 'Prof. Dr. dr. Budi'],
    status: 'Selesai & Evaluasi ROI'
  },
  {
    id: 'EVT-002',
    namaEvent: 'Annual Scientific Meeting PERSI (Perhimpunan RS Seluruh Indonesia)',
    jenisEvent: 'Simposium & Kongres Dokter',
    lokasi: 'Bali Nusa Dua Convention Center',
    tanggalMulai: '2026-11-20',
    tanggalSelesai: '2026-11-23',
    anggaran: 180000000,
    realisasiBiaya: 65000000,
    jumlahLeadDidapat: 12,
    potensiRevenueLead: 2400000000,
    sponsorDokter: ['dr. Hendra Prasetya', 'dr. Tri Hartono'],
    status: 'Sedang Berlangsung'
  }
];

export const INITIAL_LOYALTY_REBATES: LoyaltyRebate[] = [
  {
    id: 'REB-001',
    namaPartner: 'PT Surya Medika Distribusindo (Jawa Timur)',
    kategori: 'Distributor Resmi',
    tier: 'Platinum',
    targetTahunan: 12000000000,
    realisasiPenjualan: 13450000000,
    persentaseRebate: 3.5,
    akumulasiRebateRp: 470750000,
    statusKlaim: 'Tercapai - Siap Klaim'
  },
  {
    id: 'REB-002',
    namaPartner: 'Jaringan RS Hermina Group (Regional Barat)',
    kategori: 'Jaringan RS Swasta',
    tier: 'Gold',
    targetTahunan: 8000000000,
    realisasiPenjualan: 6900000000,
    persentaseRebate: 2.5,
    akumulasiRebateRp: 172500000,
    statusKlaim: 'Dalam Proses'
  },
  {
    id: 'REB-003',
    namaPartner: 'Apotek & Sarana Medika Farma Bandung',
    kategori: 'Klinik Mandiri',
    tier: 'Silver',
    targetTahunan: 2000000000,
    realisasiPenjualan: 1450000000,
    persentaseRebate: 1.5,
    akumulasiRebateRp: 21750000,
    statusKlaim: 'Dalam Proses'
  }
];

export const INITIAL_DEMAND_FORECASTS: DemandForecastItem[] = [
  {
    id: 'FC-001',
    namaAlkes: 'Patient Monitor Multi-Parameter AMS-V12 Pro',
    kategori: 'Elektromedik Non Radiasi',
    penjualanHistorisBulanLalu: 18,
    rataanPenjualan3Bulan: 15,
    trenKebutuhan: 'Naik Tajam (End-Year Tender)',
    stokTersediaGudang: 24,
    safetyStockMinimum: 20,
    leadTimePabrikHari: 21,
    proyeksiKebutuhan30Hari: 35,
    rekomendasiAksi: 'Segera Beli/Produksi (CPAKB)'
  },
  {
    id: 'FC-002',
    namaAlkes: 'Auto-Disable Syringe AMS-Safe 3ml (Steril)',
    kategori: 'Non Elektromedik Steril',
    penjualanHistorisBulanLalu: 120000,
    rataanPenjualan3Bulan: 110000,
    trenKebutuhan: 'Stabil',
    stokTersediaGudang: 85000,
    safetyStockMinimum: 50000,
    leadTimePabrikHari: 14,
    proyeksiKebutuhan30Hari: 115000,
    rekomendasiAksi: 'Segera Beli/Produksi (CPAKB)'
  },
  {
    id: 'FC-003',
    namaAlkes: 'AMS Ultrasound 4D High-Definition Sonoview',
    kategori: 'Elektromedik Non Radiasi',
    penjualanHistorisBulanLalu: 2,
    rataanPenjualan3Bulan: 3,
    trenKebutuhan: 'Stabil',
    stokTersediaGudang: 5,
    safetyStockMinimum: 2,
    leadTimePabrikHari: 45,
    proyeksiKebutuhan30Hari: 4,
    rekomendasiAksi: 'Stok Cukup'
  },
  {
    id: 'FC-004',
    namaAlkes: 'AMS Digital Mobile Radiography 32kW',
    kategori: 'Elektromedik Radiasi',
    penjualanHistorisBulanLalu: 1,
    rataanPenjualan3Bulan: 1,
    trenKebutuhan: 'Menurun',
    stokTersediaGudang: 4,
    safetyStockMinimum: 1,
    leadTimePabrikHari: 60,
    proyeksiKebutuhan30Hari: 1,
    rekomendasiAksi: 'Stok Cukup'
  }
];

export const INITIAL_PARTITION_TABLES: PartitionTableInfo[] = [
  {
    namaTabel: 'sales_orders (Master Transaksi Penjualan)',
    skemaPartisi: 'RANGE Partitioning (Timestamp Kuartal)',
    kunciPartisi: 'tanggal_order (DATE)',
    daftarPartisi: [
      { namaPartisi: 'sales_orders_2026_q4', rentangOrNilai: '2026-10-01 s/d 2026-12-31', jumlahRow: 1420, ukuranData: '24.5 MB', status: 'Aktif (Read/Write)' },
      { namaPartisi: 'sales_orders_2026_q3', rentangOrNilai: '2026-07-01 s/d 2026-09-30', jumlahRow: 3890, ukuranData: '68.2 MB', status: 'ReadOnly (Archived)' },
      { namaPartisi: 'sales_orders_2026_q2', rentangOrNilai: '2026-04-01 s/d 2026-06-30', jumlahRow: 3410, ukuranData: '59.7 MB', status: 'ReadOnly (Archived)' },
      { namaPartisi: 'sales_orders_2026_q1', rentangOrNilai: '2026-01-01 s/d 2026-03-31', jumlahRow: 2980, ukuranData: '51.3 MB', status: 'ReadOnly (Archived)' }
    ]
  },
  {
    namaTabel: 'customer_faskes_registry (Data Institusi Wilayah)',
    skemaPartisi: 'LIST Partitioning (Wilayah Distribusi Medis)',
    kunciPartisi: 'kode_wilayah (VARCHAR)',
    daftarPartisi: [
      { namaPartisi: 'faskes_wilayah_dki_banten', rentangOrNilai: 'DKI Jakarta & Banten', jumlahRow: 412, ukuranData: '8.4 MB', status: 'Aktif (Read/Write)' },
      { namaPartisi: 'faskes_wilayah_jawa_barat', rentangOrNilai: 'Jawa Barat', jumlahRow: 320, ukuranData: '6.9 MB', status: 'Aktif (Read/Write)' },
      { namaPartisi: 'faskes_wilayah_jateng_diy', rentangOrNilai: 'Jawa Tengah & DIY', jumlahRow: 285, ukuranData: '5.8 MB', status: 'Aktif (Read/Write)' },
      { namaPartisi: 'faskes_wilayah_jatim_bali', rentangOrNilai: 'Jawa Timur & Bali', jumlahRow: 390, ukuranData: '7.8 MB', status: 'Aktif (Read/Write)' }
    ]
  }
];

export const INITIAL_AUDIT_LOGS_MEDIS: AuditTrailMedis[] = [
  {
    id: 'AUD-001',
    timestamp: '2026-11-03 16:42:10 WIB',
    user: 'dimas.satria@ams.co.id',
    role: 'Medical Representative (MedRep)',
    modul: 'Sales Order Processing',
    action: 'INSERT',
    entitas: 'sales_order (SO-EKAT-2026-0182)',
    recordId: 'SO-2026-001',
    oldValue: '-',
    newValue: 'Qty: 5 Unit V12 Pro, Faskes: RSCM, Nilai: Rp 299.700.000',
    catatanKepatuhan: 'Sistem memverifikasi NIE AKD 20501910234 AKTIF & Izin RSCM AKTIF.',
    ipAddress: '180.252.164.21 (Jakarta)'
  },
  {
    id: 'AUD-002',
    timestamp: '2026-11-03 16:45:00 WIB',
    user: 'apt.sarah.pjt@ams.co.id',
    role: 'Penanggung Jawab Teknis (PJT)',
    modul: 'Regulatory & Compliance CDAKB',
    action: 'VALIDASI_CDAKB',
    entitas: 'sales_order (SO-EKAT-2026-0182)',
    recordId: 'SO-2026-001',
    oldValue: 'status: Menunggu Verifikasi PJT',
    newValue: 'status: Disetujui PJT (Lolos CDAKB)',
    catatanKepatuhan: 'PJT menandatangani approval elektronik sesuai klausul Permenkes No. 4/2014.',
    ipAddress: '103.111.201.88 (Kantor Pusat)'
  },
  {
    id: 'AUD-003',
    timestamp: '2026-11-02 11:20:15 WIB',
    user: 'system_compliance_guard',
    role: 'Automated Bot Compliance Engine',
    modul: 'Credit Limit & Risk Control',
    action: 'BLOKIR_KREDIT',
    entitas: 'customer_faskes (FAS-006)',
    recordId: 'FAS-006',
    oldValue: 'status: Aktif',
    newValue: 'status: Diblokir Order Baru (Izin Operasional Kedaluwarsa)',
    catatanKepatuhan: 'Otomasi CDAKB: Menolak order karena izin klinik FAS-006 habis per 10 Feb 2024.',
    ipAddress: '127.0.0.1 (Internal Worker)'
  }
];
