export interface CustomerFaskes {
  id: string;
  kodeFaskes: string;
  namaInstitusi: string;
  tipeFaskes: 
    | 'RS Pemerintah Kelas A' 
    | 'RS Pemerintah Kelas B' 
    | 'RS Swasta' 
    | 'Klinik Utama' 
    | 'Klinik Pratama' 
    | 'Dinas Kesehatan' 
    | 'Apotek & Penyalur Alkes' 
    | 'Laboratorium Medis';
  akreditasiKemenkes: 'Paripurna' | 'Utama' | 'Madya' | 'Dalam Proses';
  nomorIzinOperasional: string;
  masaBerlakuIzin: string;
  isIzinValid: boolean;
  dokterPenanggungJawab: string;
  kontakPengadaan: string;
  noTelepon: string;
  email: string;
  alamat: string;
  wilayah: 'DKI Jakarta & Banten' | 'Jawa Barat' | 'Jawa Tengah & DIY' | 'Jawa Timur' | 'Sumatera' | 'Indonesia Timur';
  batasKredit: number; // Plafon kredit
  piutangBerjalan: number;
  sisaKredit: number;
  termOfPaymentHari: number; // 30, 45, 60, 90 hari
  statusVerifikasiCDAKB: 'Tervalifikasi PJT' | 'Perlu Pembaruan Dokumen' | 'Diblokir Regulasi';
  koordinatLat: number;
  koordinatLng: number;
}

export interface OpportunityLead {
  id: string;
  judulProspek: string;
  faskesId: string;
  namaFaskes: string;
  tipeFaskes: string;
  alkesTertarget: string;
  kategoriAlkes: 'Elektromedik Radiasi' | 'Elektromedik Non Radiasi' | 'Non Elektromedik Steril' | 'Diagnostik In Vitro';
  estimasiNilai: number;
  tahapan: 'Perkenalan Alat' | 'Demo Produk' | 'Penawaran Teknis' | 'Negosiasi Harga' | 'Menang (SPK)' | 'Kalah / Batal';
  probabilitasPersen: number;
  medRep: string;
  tanggalUpdate: string;
  catatanTerakhir: string;
}

export interface SalesTerritory {
  id: string;
  namaWilayah: string;
  cakupanKota: string[];
  medRepPIC: string;
  nomorKontak: string;
  targetKuartal: number;
  realisasiKuartal: number;
  jumlahFaskesTerdaftar: number;
  statusOverlap: 'Bebas Konflik' | 'Peringatan Tumpang Tindih';
}

export interface LPSETender {
  id: string;
  kodeTender: string;
  namaPaket: string;
  instansi: string;
  kategoriAlkes: string;
  nilaiHPS: number;
  metodePengadaan: 'e-Katalog Mini Kompetisi' | 'Tender Terbuka LPSE' | 'Pengadaan Langsung';
  sisaHari: number;
  tanggalBatas: string;
  dokumenSyarat: string[];
  statusKualifikasi: 'Memenuhi Syarat CDAKB & Izin Edar' | 'Perlu Review Dokumen Teknis' | 'Tidak Memenuhi Syarat';
  rekomendasiBidding: number; // Nilai penawaran yang disarankan
  statusBidding: 'Monitoring' | 'Penyusunan Proposal' | 'Penawaran Terkirim' | 'Pemenang Tender';
}

export interface PriceLockAgreement {
  id: string;
  nomorKontrak: string;
  faskesId: string;
  namaFaskes: string;
  namaAlkes: string;
  tipeModel: string;
  hargaKatalog: number;
  hargaTerkunci: number;
  diskonPersen: number;
  moq: number; // Minimum Order Quantity
  masaBerlakuMulai: string;
  masaBerlakuSelesai: string;
  klausulSLA: string;
  status: 'Aktif Terkunci' | 'Mendekati Berakhir' | 'Kedaluwarsa';
}

export interface VisitSchedule {
  id: string;
  medRepId: string;
  namaMedRep: string;
  tanggalKunjungan: string;
  jamRencana: string;
  faskesId: string;
  namaFaskes: string;
  alamatFaskes: string;
  tujuanKunjungan: string;
  picTarget: string;
  statusVisit: 'Terjadwal' | 'Check-In GPS Terverifikasi' | 'Selesai Kunjungan' | 'Tertunda';
  targetLat: number;
  targetLng: number;
  actualLat?: number;
  actualLng?: number;
  selisihJarakMeter?: number;
  fotoBukti?: string;
  catatanHasil?: string;
}

export interface DigitalBrochure {
  id: string;
  namaAlkes: string;
  tipeModel: string;
  nomorIzinEdar: string;
  produsen: string;
  kategori: string;
  sertifikasi: string[];
  ringkasanSpek: string;
  fiturUtama: string[];
  fileBrochurePdf: string;
  videoDemoUrl: string;
  statusNIE: 'Aktif Resmi' | 'Dalam Perpanjangan';
}

export interface SalesOrderItem {
  alkesId: string;
  namaAlkes: string;
  tipeModel: string;
  nomorIzinEdar: string;
  isIzinEdarAktif: boolean;
  batchLot: string;
  nomorSeri?: string;
  stokTersedia: number;
  jumlah: number;
  satuan: string;
  hargaSatuan: number;
  diskonPersen: number;
  total: number;
}

export interface SalesOrderExtended {
  id: string;
  nomorSO: string;
  tanggal: string;
  faskesId: string;
  namaFaskes: string;
  tipeFaskes: string;
  wilayah: string;
  items: SalesOrderItem[];
  subtotal: number;
  ppn11Persen: number;
  grandTotal: number;
  termOfPayment: string;
  jatuhTempo: string;
  statusComplianceCDAKB: 'Lolos Validasi CDAKB' | 'Ditolak: Izin Edar Expired' | 'Ditolak: Faskes Belum Berizin';
  statusKredit: 'Aman' | 'Peringatan Plafon' | 'Diblokir Overlimit';
  statusOrder: 'Draft' | 'Diverifikasi PJT' | 'Disetujui' | 'Alokasi FEFO Gudang' | 'Dalam Pengiriman' | 'Terkirim';
  namaSales: string;
  keterangan: string;
  catatanPJT?: string;
}

export interface ProductTraceabilityRecord {
  id: string;
  nomorSeriOrBatch: string;
  tipeTracking: 'Nomor Seri (Alkes Elektro-Medik)' | 'Nomor Bets / Lot (Alkes Habis Pakai)';
  namaAlkes: string;
  nomorIzinEdar: string;
  tanggalManufaktur: string;
  tanggalKedaluwarsa?: string;
  nomorSO: string;
  nomorFaktur: string;
  faskesPenerima: string;
  tanggalKirim: string;
  tanggalInstalasi?: string;
  nomorBAST?: string;
  masaGaransiBulan?: number;
  akhirGaransi?: string;
  statusRecall: 'Aman' | 'Dalam Penyelidikan' | 'Penarikan Produk (RECALL)';
  teknisiInstalasi?: string;
  jadwalPMAwal?: string;
}

export interface DemoUnitLoan {
  id: string;
  nomorPeminjaman: string;
  namaAlkes: string;
  tipeModel: string;
  nomorSeri: string;
  faskesPeminjam: string;
  dokterPenguji: string;
  departemen: string;
  tanggalKirim: string;
  batasWaktuKembali: string;
  kondisiFisik: 'Sangat Baik' | 'Baik' | 'Perlu Kalibrasi';
  statusPeminjaman: 'Sedang Uji Coba di RS' | 'Dikonversi Menjadi Pembelian' | 'Ditarik Kembali ke Gudang';
  medRepPIC: string;
  catatanUjiFungsi: string;
}

export interface MarketingEvent {
  id: string;
  namaEvent: string;
  jenisEvent: 'Simposium & Kongres Dokter' | 'Pameran Hospital Expo' | 'Workshop Bedah & Alkes' | 'Webinar Medis';
  lokasi: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  anggaran: number;
  realisasiBiaya: number;
  jumlahLeadDidapat: number;
  potensiRevenueLead: number;
  sponsorDokter: string[];
  status: 'Perencanaan' | 'Sedang Berlangsung' | 'Selesai & Evaluasi ROI';
}

export interface LoyaltyRebate {
  id: string;
  namaPartner: string;
  kategori: 'Distributor Resmi' | 'Jaringan RS Swasta' | 'Klinik Mandiri';
  tier: 'Silver' | 'Gold' | 'Platinum';
  targetTahunan: number;
  realisasiPenjualan: number;
  persentaseRebate: number;
  akumulasiRebateRp: number;
  statusKlaim: 'Tercapai - Siap Klaim' | 'Dalam Proses' | 'Belum Memenuhi Target';
}

export interface DemandForecastItem {
  id: string;
  namaAlkes: string;
  kategori: string;
  penjualanHistorisBulanLalu: number;
  rataanPenjualan3Bulan: number;
  trenKebutuhan: 'Naik Tajam (End-Year Tender)' | 'Stabil' | 'Menurun';
  stokTersediaGudang: number;
  safetyStockMinimum: number;
  leadTimePabrikHari: number;
  proyeksiKebutuhan30Hari: number;
  rekomendasiAksi: 'Segera Beli/Produksi (CPAKB)' | 'Stok Cukup' | 'Potensi Overstock';
}

export interface PartitionTableInfo {
  namaTabel: string;
  skemaPartisi: string;
  kunciPartisi: string;
  daftarPartisi: {
    namaPartisi: string;
    rentangOrNilai: string;
    jumlahRow: number;
    ukuranData: string;
    status: 'Aktif (Read/Write)' | 'ReadOnly (Archived)';
  }[];
}

export interface AuditTrailMedis {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  modul: string;
  action: 'INSERT' | 'UPDATE' | 'VALIDASI_CDAKB' | 'BLOKIR_KREDIT' | 'PRICE_LOCK';
  entitas: string;
  recordId: string;
  oldValue: string;
  newValue: string;
  catatanKepatuhan: string;
  ipAddress: string;
}
