import type { AkunCoA, JurnalKeuangan, PeriodeBuku, TetapanPajak, ValuasiBatch } from '../types';
import {
  KODE_AKUN,
  type RancanganJurnal,
  nomorJournalUntuk,
  rancangJurnalFaktur,
  rancangJurnalPembukaanPersediaan,
  rancangJurnalWriteOff,
  susunJurnalBerantai
} from '../utils/akuntansi';
import { INITIAL_BETS_PRODUKSI, INITIAL_STOK_GUDANG, INITIAL_TERIMA_BARANG, INITIAL_TRANSAKSI } from './initialData';

/**
 * Benih modul Finance & Accounting.
 *
 * Sistem lama tidak menyimpan harga pokok sama sekali, jadi seluruh `nilaiPerUnit` di file ini
 * adalah TAKSIRAN MANAJEMEN berlabel `asal: 'DUMMY'`. Angka itu ada supaya mesin pembukuan bisa
 * diuji dan layarnya punya isi — bukan untuk laporan resmi. Sesuai keputusan pemilik Q-3, seluruh
 * baris DUMMY dihapus dan diganti data asli (harga PO, BMR, dokumen kepabeanan) pada Fase 7.
 *
 * Rujukan batch tetap memakai dokumen yang benar-benar ada di benih (BMR / nomor PO penerimaan),
 * supaya jejak penelusuran CDAKB tidak putus meskipun nilainya masih taksiran.
 */

const ESTIMASI_BIAYA_PER_SKU: Record<string, number> = {
  'ALKES-PM-01': 42000000,
  'ALKES-SP-02': 24500000,
  'ALKES-USG-05': 480000000,
  'ALKES-XR-09': 310000000,
  'ALKES-AC-10': 285000,
  'IVD-DNG-03': 1150000,
  'IVD-STD-06': 980000,
  'STR-BNG-04': 480000
};

interface SumberBets {
  sumberBiaya: ValuasiBatch['sumberBiaya'];
  rujukanSumber: string;
  tanggalProduksi: string;
}

function petaSumberBets(): Map<string, SumberBets> {
  const peta = new Map<string, SumberBets>();
  for (const bmr of INITIAL_BETS_PRODUKSI) {
    peta.set(bmr.nomorBatch, {
      sumberBiaya: 'BMR Produksi',
      rujukanSumber: `${bmr.nomorBMR} (realisasi ${bmr.jumlahRealisasi} ${bmr.satuan}) — nilai per unit masih taksiran manajemen`,
      tanggalProduksi: bmr.tanggalMulai
    });
  }
  for (const terima of INITIAL_TERIMA_BARANG) {
    for (const baris of terima.baris) {
      if (peta.has(baris.nomorBatch)) continue;
      peta.set(baris.nomorBatch, {
        sumberBiaya: 'Purchase Order',
        rujukanSumber: `${terima.nomorPurchaseOrder} — ${terima.namaPemasok}; nilai per unit masih taksiran manajemen`,
        tanggalProduksi: terima.tanggalTerima
      });
    }
  }
  return peta;
}

function gabungkanBets() {
  const perBets = new Map<
    string,
    { nomorBatch: string; kodeSKU: string; namaAlkes: string; satuan: string; tanggalKedaluwarsa: string; qty: number; tanggalMasuk: string }
  >();
  for (const s of INITIAL_STOK_GUDANG) {
    const kunci = `${s.nomorBatch}|${s.kodeSKU}`;
    const lama = perBets.get(kunci);
    if (lama) {
      lama.qty += s.jumlahStok;
      if (s.tanggalMasuk < lama.tanggalMasuk) lama.tanggalMasuk = s.tanggalMasuk;
    } else {
      perBets.set(kunci, {
        nomorBatch: s.nomorBatch,
        kodeSKU: s.kodeSKU,
        namaAlkes: s.namaAlkes,
        satuan: s.satuan,
        tanggalKedaluwarsa: s.tanggalKedaluwarsa,
        qty: s.jumlahStok,
        tanggalMasuk: s.tanggalMasuk
      });
    }
  }
  return [...perBets.values()].sort((a, b) => a.nomorBatch.localeCompare(b.nomorBatch));
}

export const INITIAL_VALUASI_BATCH: ValuasiBatch[] = gabungkanBets().map((b) => {
  const sumber = petaSumberBets().get(b.nomorBatch) ?? {
    sumberBiaya: 'Taksiran Manajemen' as const,
    rujukanSumber: 'Tidak ada dokumen sumber pada benih sistem lama',
    tanggalProduksi: b.tanggalMasuk
  };
  return {
    nomorBatch: b.nomorBatch,
    kodeSKU: b.kodeSKU,
    namaAlkes: b.namaAlkes,
    tanggalProduksi: sumber.tanggalProduksi,
    tanggalKedaluwarsa: b.tanggalKedaluwarsa,
    qtyTercatat: b.qty,
    satuan: b.satuan,
    nilaiPerUnit: ESTIMASI_BIAYA_PER_SKU[b.kodeSKU],
    metode: b.kodeSKU.startsWith('ALKES') ? ('FIFO' as const) : ('Rata-rata Tertimbang' as const),
    sumberBiaya: sumber.sumberBiaya,
    rujukanSumber: sumber.rujukanSumber,
    asal: 'DUMMY' as const,
    tercatatPada: '2024-06-15'
  };
});

/** Nilai persediaan satu batch menurut benih; dipakai juga oleh penjaga integritas. */
export function nilaiBenihBets(nomorBatch: string, qty?: number) {
  const valuasi = INITIAL_VALUASI_BATCH.find((v) => v.nomorBatch === nomorBatch);
  if (!valuasi) return 0;
  return Math.round(valuasi.nilaiPerUnit * (qty ?? valuasi.qtyTercatat));
}

export const INITIAL_COA: AkunCoA[] = [
  { kode: KODE_AKUN.KAS, nama: 'Kas dan Bank', tipe: 'Aset', kelompokLaporan: 'Aset Lancar', saldoNormal: 'Debet', aktif: true, catatanRegulasi: 'Rekonsiliasi bulanan dengan rekening penampung e-Katalog' },
  { kode: KODE_AKUN.PERSEDIAAN_ALKES, nama: 'Persediaan Alat Kesehatan (Layak Kirim)', tipe: 'Aset', kelompokLaporan: 'Aset Lancar', saldoNormal: 'Debet', aktif: true, catatanRegulasi: 'Permenkes 4/2014 — hanya batch AVAILABLE yang dinilai sebagai stok layak kirim' },
  { kode: KODE_AKUN.PERSEDIAAN_KARANTINA, nama: 'Persediaan Karantina', tipe: 'Aset', kelompokLaporan: 'Aset Lancar', saldoNormal: 'Debet', aktif: true, catatanRegulasi: 'ISO 13485 7.5.11 — barang tertahan, kerugian belum pasti' },
  { kode: KODE_AKUN.PERSEDIAAN_SUKU_CADANG, nama: 'Persediaan Suku Cadang', tipe: 'Aset', kelompokLaporan: 'Aset Lancar', saldoNormal: 'Debet', aktif: true },
  { kode: KODE_AKUN.CADANGAN_PENURUNAN_NILAI, nama: 'Cadangan Penurunan Nilai Persediaan', tipe: 'Aset', kelompokLaporan: 'Aset Lancar', saldoNormal: 'Kredit', aktif: true, catatanRegulasi: 'Akun kontra; write-off tidak menyentuh kartu stok langsung' },
  { kode: KODE_AKUN.PIUTANG_DAGANG, nama: 'Piutang Dagang Fasyankes', tipe: 'Aset', kelompokLaporan: 'Aset Lancar', saldoNormal: 'Debet', aktif: true },
  { kode: KODE_AKUN.PPN_MASUKAN, nama: 'PPN Masukan', tipe: 'Aset', kelompokLaporan: 'Aset Lancar', saldoNormal: 'Debet', aktif: true, catatanRegulasi: 'Pengkreditan hanya sah bila faktur pajak sesuai dan dilaporkan tepat masa' },
  { kode: KODE_AKUN.UANG_MUKA_PPH22, nama: 'Uang Muka PPh 22 Impor', tipe: 'Aset', kelompokLaporan: 'Aset Lancar', saldoNormal: 'Debet', aktif: true, catatanRegulasi: 'Kredit pajak importir ber-API; BUKAN biaya perolehan persediaan' },
  { kode: KODE_AKUN.PIUTANG_PPN_LEBIH_BAYAR, nama: 'PPN Lebih Bayar', tipe: 'Aset', kelompokLaporan: 'Aset Lancar', saldoNormal: 'Debet', aktif: true },
  { kode: KODE_AKUN.PPN_KELUARAN, nama: 'PPN Keluaran', tipe: 'Kewajiban', kelompokLaporan: 'Kewajiban Lancar', saldoNormal: 'Kredit', aktif: true },
  { kode: KODE_AKUN.HUTANG_USAHA, nama: 'Hutang Usaha Pemasok', tipe: 'Kewajiban', kelompokLaporan: 'Kewajiban Lancar', saldoNormal: 'Kredit', aktif: true },
  { kode: KODE_AKUN.HUTANG_PPN, nama: 'Hutang PPN Masa', tipe: 'Kewajiban', kelompokLaporan: 'Kewajiban Lancar', saldoNormal: 'Kredit', aktif: true, catatanRegulasi: 'Diluncurkan saat penyetoran masa PPN' },
  { kode: KODE_AKUN.MODAL_DISETOR, nama: 'Modal Disetor', tipe: 'Ekuitas', kelompokLaporan: 'Ekuitas', saldoNormal: 'Kredit', aktif: true },
  { kode: KODE_AKUN.LABA_DITAHAN, nama: 'Laba Ditahan', tipe: 'Ekuitas', kelompokLaporan: 'Ekuitas', saldoNormal: 'Kredit', aktif: true, catatanRegulasi: 'Saldo berjalan yang belum ditutup dibukakan ke akun ini saat tutup buku' },
  { kode: KODE_AKUN.PENDAPATAN_ALKES, nama: 'Pendapatan Penjualan Alat Kesehatan', tipe: 'Pendapatan', kelompokLaporan: 'Pendapatan Operasional', saldoNormal: 'Kredit', aktif: true },
  { kode: KODE_AKUN.PENDAPATAN_JASA, nama: 'Pendapatan Jasa Purna Jual & Kalibrasi', tipe: 'Pendapatan', kelompokLaporan: 'Pendapatan Operasional', saldoNormal: 'Kredit', aktif: true },
  { kode: KODE_AKUN.HPP_ALKES, nama: 'Harga Pokok Penjualan Alat Kesehatan', tipe: 'Beban', kelompokLaporan: 'Harga Pokok Penjualan', saldoNormal: 'Debet', aktif: true },
  { kode: KODE_AKUN.BEBAN_KERUGIAN_PERSEDIAAN, nama: 'Beban Kerugian Persediaan (Write-off)', tipe: 'Beban', kelompokLaporan: 'Beban Operasional', saldoNormal: 'Debet', aktif: true, catatanRegulasi: 'Kedaluwarsa, rusak, recall; karantina hanya reklasifikasi' },
  { kode: KODE_AKUN.BEBAN_KALIBRASI, nama: 'Beban Uji Kalibrasi & BPFK', tipe: 'Beban', kelompokLaporan: 'Beban Operasional', saldoNormal: 'Debet', aktif: true, catatanRegulasi: 'Biaya mutu — ke HPP bila terkait BMR, selain itu ke Beban Operasional' },
  { kode: KODE_AKUN.BEBAN_AUDIT_MUTU, nama: 'Beban Audit ISO 13485 & CDAKB', tipe: 'Beban', kelompokLaporan: 'Beban Operasional', saldoNormal: 'Debet', aktif: true },
  { kode: KODE_AKUN.BEBAN_RETUR_MUTU, nama: 'Beban Retur Mutu & Produk Kembalian', tipe: 'Beban', kelompokLaporan: 'Beban Operasional', saldoNormal: 'Debet', aktif: true },
  { kode: KODE_AKUN.BEBAN_UMUM, nama: 'Beban Umum & Administrasi', tipe: 'Beban', kelompokLaporan: 'Beban Operasional', saldoNormal: 'Debet', aktif: true }
];

export const INITIAL_PERIODE_BUKU: PeriodeBuku[] = [
  { id: '2024-01', label: 'Januari 2024', status: 'Ditutup', ditutupPada: '2024-02-05', ditutupOleh: 'Budi Utomo, S.T', alasan: 'Tutup buku massal dari sistem lama tanpa jurnal dua-entry' },
  { id: '2024-02', label: 'Februari 2024', status: 'Ditutup', ditutupPada: '2024-03-05', ditutupOleh: 'Budi Utomo, S.T', alasan: 'Tutup buku massal dari sistem lama tanpa jurnal dua-entry' },
  { id: '2024-03', label: 'Maret 2024', status: 'Ditutup', ditutupPada: '2024-04-05', ditutupOleh: 'Budi Utomo, S.T', alasan: 'Tutup buku massal dari sistem lama tanpa jurnal dua-entry' },
  { id: '2024-04', label: 'April 2024', status: 'Ditutup', ditutupPada: '2024-05-06', ditutupOleh: 'Budi Utomo, S.T', alasan: 'Tutup buku massal dari sistem lama tanpa jurnal dua-entry' },
  { id: '2024-05', label: 'Mei 2024', status: 'Dikunci', ditutupPada: null, ditutupOleh: '', alasan: 'Dikunci untuk rekonsiliasi PPN masa Mei sebelum draf e-Faktur dikirim' },
  { id: '2024-06', label: 'Juni 2024', status: 'Terbuka', ditutupPada: null, ditutupOleh: '', alasan: '' }
];

export const INITIAL_TETAPAN_PAJAK: TetapanPajak[] = [
  { id: 'PAJ-PPN-KEL', nama: 'PPN Keluaran (penjualan alkes)', jenis: 'PPN Keluaran', tarifPersen: 11, diperlakukanSebagai: 'Pajak Keluaran', berlakuMulai: '2022-04-01', berlakuSampai: null, dasarHukum: 'UU HPP No. 7/2021 jo. PMK 131/2022', statusVerifikasiPJT: 'Terverifikasi', keterangan: 'Alkes adalah barang kena pajak; tarif 11% sejak April 2022.' },
  { id: 'PAJ-PPN-MAS', nama: 'PPN Masukan (pembelian & biaya)', jenis: 'PPN Masukan', tarifPersen: 11, diperlakukanSebagai: 'Kredit Pajak', berlakuMulai: '2022-04-01', berlakuSampai: null, dasarHukum: 'UU HPP No. 7/2021', statusVerifikasiPJT: 'Terverifikasi', keterangan: 'Pengkreditan hanya sah bila faktur pajak diterima dan dilaporkan pada masa yang tepat.' },
  { id: 'PAJ-PPN-IMP', nama: 'PPN atas impor alkes', jenis: 'PPN Impor', tarifPersen: 11, diperlakukanSebagai: 'Kredit Pajak', berlakuMulai: '2022-04-01', berlakuSampai: null, dasarHukum: 'PMK 131/2022 jo. ketentuan kepabeanan', statusVerifikasiPJT: 'Terverifikasi', keterangan: 'Dihitung atas nilai impor (CIF + bea masuk + PDB), bukan dari FOB saja.' },
  { id: 'PAJ-PBH-22-API', nama: 'PPh 22 Impor dengan API', jenis: 'PPh 22 Impor', tarifPersen: 2.5, diperlakukanSebagai: 'Kredit Pajak', berlakuMulai: '2023-10-01', berlakuSampai: null, dasarHukum: 'PMK 178/2023 (importir ber-PIB/API)', statusVerifikasiPJT: 'Perlu Verifikasi PJT', keterangan: 'Uang muka PPh yang dapat dikreditkan — TIDAK dikapitalisasi ke persediaan. Ini koreksi atas blueprint lama yang memasukkannya ke Landed Cost.' },
  { id: 'PAJ-PBH-22-TANPA-API', nama: 'PPh 22 Impor tanpa API', jenis: 'PPh 22 Impor', tarifPersen: 7.5, diperlakukanSebagai: 'Beban Operasional', berlakuMulai: '2023-10-01', berlakuSampai: null, dasarHukum: 'PMK 178/2023', statusVerifikasiPJT: 'Perlu Verifikasi PJT', keterangan: 'Tetap pajak, bukan biaya perolehan barang; bila tidak dapat dikreditkan dibebankan pada periode berjalan.' },
  { id: 'PAJ-BEA-MASUK', nama: 'Bea masuk alkes (fasilitas)', jenis: 'Bea Masuk', tarifPersen: 0, diperlakukanSebagai: 'Kapitalisasi Persediaan', berlakuMulai: '2024-01-01', berlakuSampai: null, dasarHukum: 'PMK fasilitas bea masuk alat kesehatan', statusVerifikasiPJT: 'Perlu Verifikasi PJT', keterangan: 'Benih memakai tarif 0% (fasilitas). Angka sebenarnya harus datang dari Surat Penetapan Pembayaran Bea Masuk, bukan dari taksiran.' },
  { id: 'PAJ-PDB', nama: 'Pungutan atas Distribusi Barang (PDB) 0,5%', jenis: 'Bea Masuk', tarifPersen: 0.5, diperlakukanSebagai: 'Kapitalisasi Persediaan', berlakuMulai: '2024-01-01', berlakuSampai: null, dasarHukum: 'PP 37/2024 tentang Pungutan PDB', statusVerifikasiPJT: 'Perlu Verifikasi PJT', keterangan: 'Dihitung atas nilai pabean dan masuk biaya perolehan.' },
  { id: 'PAJ-PPH-23', nama: 'PPh 23 atas jasa (kalibrasi, audit, jasa lainnya)', jenis: 'PPh 23 Jasa', tarifPersen: 15, diperlakukanSebagai: 'Kredit Pajak', berlakuMulai: '2022-01-01', berlakuSampai: null, dasarHukum: 'PP 9/2022 jo. PMK 113/2022', statusVerifikasiPJT: 'Perlu Verifikasi PJT', keterangan: 'Dipotong fasyankes/lembaga atas imbalan jasa; diperlakukan sebagai uang muka pajak yang dapat dikreditkan, bukan pengurang beban.' }
];

const PETUGAS_BENIH = { petugas: 'Budi Utomo, S.T', peran: 'QA Manager' };

/** Kejadian persediaan yang benar-benar tersirat dari benih gudang: batch karantina, recall,
 *  kedaluwarsa, dan rusak. Nominalnya diambil dari valuasi batch, bukan diketik manual. */
const KEJADIAN_PERSEDIAAN_BENIH: { nomorBatch: string; qty: number; sebab: 'Kedaluwarsa' | 'Rusak' | 'Karantina' | 'Recall'; tanggal: string; pusatBiaya: 'PB-QA' | 'PB-DIST' }[] = [
  { nomorBatch: 'LOT-2024-DNG18', qty: 300, sebab: 'Karantina', tanggal: '2024-06-05', pusatBiaya: 'PB-QA' },
  { nomorBatch: 'LOT-2023-B991', qty: 42, sebab: 'Recall', tanggal: '2024-06-08', pusatBiaya: 'PB-QA' },
  { nomorBatch: 'LOT-2023-B884', qty: 85, sebab: 'Kedaluwarsa', tanggal: '2024-06-12', pusatBiaya: 'PB-DIST' },
  { nomorBatch: 'LOT-2024-SP08', qty: 3, sebab: 'Rusak', tanggal: '2024-06-12', pusatBiaya: 'PB-DIST' }
];

/** Membangun jurnal benih dengan mesin yang sama dipakai aplikasi: rancang → uji keseimbangan →
 *  sambung rantai → posting. Tidak ada hash yang diketik manual, jadi rantai selalu bisa diverifikasi. */
export function bangunJurnalBenih(daftarAkun: AkunCoA[] = INITIAL_COA): JurnalKeuangan[] {
  const urutanPerPeriode = new Map<string, number>();
  const urutanBerikutnya = (periode: string) => {
    const berikutnya = (urutanPerPeriode.get(periode) ?? 0) + 1;
    urutanPerPeriode.set(periode, berikutnya);
    return berikutnya;
  };

  const rancangan: RancanganJurnal[] = [];

  for (const transaksi of [...INITIAL_TRANSAKSI].sort((a, b) => a.tanggal.localeCompare(b.tanggal))) {
    rancangan.push(
      rancangJurnalFaktur(transaksi, {
        tarifPpnPersen: 11,
        ppnTermasukDalamNominal: false,
        petugas: PETUGAS_BENIH.petugas,
        peran: PETUGAS_BENIH.peran,
        urutanNomor: urutanBerikutnya
      })
    );
  }

  // Stok fisik benih tidak pernah dibukukan oleh sistem lama. Tanpa saldo awal ini Neraca
  // selamanya pincang, jadi nilai buku tiap batch diakui sekali di pembuka periode.
  rancangan.push(
    rancangJurnalPembukaanPersediaan({
      valuasi: INITIAL_VALUASI_BATCH,
      tanggal: '2024-06-01',
      ...PETUGAS_BENIH,
      nomorJournal: nomorJournalUntuk('2024-06', urutanBerikutnya('2024-06'))
    })
  );

  for (const kejadian of KEJADIAN_PERSEDIAAN_BENIH) {
    const valuasi = INITIAL_VALUASI_BATCH.find((v) => v.nomorBatch === kejadian.nomorBatch);
    if (!valuasi) continue;
    const periode = kejadian.tanggal.slice(0, 7);
    rancangan.push(
      rancangJurnalWriteOff({
        valuasi,
        qty: kejadian.qty,
        sebab: kejadian.sebab,
        tanggal: kejadian.tanggal,
        ...PETUGAS_BENIH,
        nomorJournal: nomorJournalUntuk(periode, urutanBerikutnya(periode)),
        pusatBiaya: kejadian.pusatBiaya
      })
    );
  }

  rancangan.sort((a, b) => a.tanggalTransaksi.localeCompare(b.tanggalTransaksi) || a.nomorJournal.localeCompare(b.nomorJournal));

  const hasil: JurnalKeuangan[] = [];
  for (const r of rancangan) {
    const mata = susunJurnalBerantai(hasil, r, { daftarAkun });
    if (!mata.jurnal) continue;
    hasil.push({ ...mata.jurnal, status: 'Posted', tanggalPosting: mata.jurnal.tanggalTransaksi });
  }
  return hasil;
}

/** Jurnal Mei diposting sebelum masa itu dikunci untuk rekonsiliasi PPN; penulisan baru ke masa
 *  terkunci tetap ditolak `gerbangPeriodeBuku`, jadi benih dan gerbang tidak saling meniadakan. */
export const INITIAL_JURNAL_KEUANGAN: JurnalKeuangan[] = bangunJurnalBenih();
