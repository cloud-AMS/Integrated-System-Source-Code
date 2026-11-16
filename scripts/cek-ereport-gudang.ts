// Penjaga alur CDAKB → e-Report Kemenkes (ERD mst_products/mst_locations/mst_partners,
// inv_batches/inv_serial_numbers/trx_stock_movements, qc_env_logs).
// Jalankan: npm run cek:ereport
// Tujuan: struktur 10 kolom e-Report, identitas saldo semester, gerbang zona/NIE/ED,
// putusan PJT, POD → DELIVERED, pembekuan RECALL satu klik, dan riwayat ekspor tidak boleh regresi.
import './penyimpanan-node';
import { db } from '../src/services/pocketbase';
import type { StokGudang } from '../src/types';
import {
  KOLOM_EREPOR,
  alokasiFEFOSadarKunci,
  bangunBarisEReport,
  blokirNIEProduk,
  deviasiSuhu,
  eksporCsvEReport,
  eksporXlsEReport,
  lacakBatchSatuKlik,
  namaBerkasEReport,
  periodeEReport,
  statusSerialErpDariUnit,
  statusZonaGudang,
  validasiFormatNIE,
  verifikasiRantaiHash,
  zonaBolehPicking,
  type MitraEReport
} from '../src/utils/gudang';

const ACUAN = new Date('2024-06-15T08:00:00');
const PETUGAS_PJT = { pengguna: 'apt. Dewi Kartika, S.Si (PJT)', peran: 'Penanggung Jawab Teknis' };

let masalah = 0;
const cek = (label: string, lolos: boolean) => {
  if (!lolos) {
    console.error(`[e-report gudang] ${label}`);
    masalah++;
  }
};
const mulai = () => localStorage.clear();
const mitraEReport = (): MitraEReport[] => [
  ...db.getPelangganB2B().map((p) => ({
    nama: p.namaInstalasi,
    kodeSaranaKemenkes: p.kodeSaranaKemenkes,
    kodeProvinsi: p.kodeProvinsi,
    kodeKota: p.kodeKota
  })),
  ...db.getPemasok().map((p) => ({
    nama: p.namaPemasok,
    kodeSaranaKemenkes: p.kodeSaranaKemenkes,
    kodeProvinsi: p.kodeProvinsi,
    kodeKota: p.kodeKota
  }))
];
const barisEReport = (tahun: number, semester: 1 | 2) =>
  bangunBarisEReport({
    periode: periodeEReport(tahun, semester),
    daftarStok: db.getStokGudang(),
    daftarPergerakan: db.getJejakPergerakan(),
    daftarSuratJalan: db.getSuratJalan(),
    daftarIzinEdar: db.getIzinEdar(),
    daftarMitra: mitraEReport()
  });

// ==================== A. Struktur 10 kolom & periode semester ====================
mulai();
const LABEL_WAJIB = [
  'Nomor Izin Edar (NIE)',
  'Nama Produk',
  'Tipe / Ukuran',
  'Nomor Batch / Lot',
  'Stok Awal Periode',
  'Jumlah Pemasukan',
  'Jumlah Penyaluran',
  'Stok Akhir Periode',
  'Nama Sarana Tujuan',
  'Kode Sarana / Wilayah'
];
cek('A1 e-Report wajib tepat 10 kolom', KOLOM_EREPOR.length === 10);
cek(
  `A2 urutan label kolom menyimpang (${KOLOM_EREPOR.map((k) => k.label).join(' | ')})`,
  KOLOM_EREPOR.every((k, i) => k.label === LABEL_WAJIB[i])
);
const s1 = periodeEReport(2024, 1);
const s2 = periodeEReport(2024, 2);
cek('A3 semester 1 = 1 Jan – 30 Jun', s1.kode === '2024-S1' && s1.mulai === '2024-01-01' && s1.akhir === '2024-06-30');
cek('A4 semester 2 = 1 Jul – 31 Des', s2.kode === '2024-S2' && s2.mulai === '2024-07-01' && s2.akhir === '2024-12-31');

// ==================== B. Baris e-Report seed 2024-S1 & identitas saldo ====================
const baris = barisEReport(2024, 1);
cek(`B1 seed 2024-S1 menghasilkan 2 baris penyaluran (kini ${baris.length})`, baris.length === 2);
const pm44 = baris.find((b) => b.nomorBatch === 'LOT-2024-PM44');
const dng12 = baris.find((b) => b.nomorBatch === 'LOT-2024-DNG12');
cek('B2 baris Patient Monitor LOT-2024-PM44 ada', !!pm44);
cek('B3 baris Reagen Dengue LOT-2024-DNG12 ada', !!dng12);
if (pm44) {
  cek('B4 PM44: awal 0 + masuk 34 - salur 2 = akhir 32', pm44.stokAwalPeriode === 0 && pm44.jumlahPemasukan === 34 && pm44.jumlahPenyaluran === 2 && pm44.stokAkhirPeriode === 32);
  cek('B5 PM44: tujuan RSUD Pasar Minggu + kode sarana 3174012', pm44.namaSaranaTujuan === 'RSUD Pasar Minggu Jakarta Selatan' && pm44.kodeSaranaWilayah.includes('3174012'));
}
if (dng12) {
  cek('B6 DNG12: awal 0 + masuk 320 - salur 20 = akhir 300', dng12.stokAwalPeriode === 0 && dng12.jumlahPemasukan === 320 && dng12.jumlahPenyaluran === 20 && dng12.stokAkhirPeriode === 300);
  cek('B7 DNG12: tujuan Klinik Sehat Paripurna + kode sarana 3273045', dng12.namaSaranaTujuan === 'Klinik Utama Sehat Paripurna Bandung' && dng12.kodeSaranaWilayah.includes('3273045'));
}
baris.forEach((b) => {
  const keluarBatch = db.getJejakPergerakan()
    .filter((m) => m.nomorBatch === b.nomorBatch && m.tipe === 'Pengiriman' && m.waktu.slice(0, 10) <= s1.akhir)
    .reduce((t, m) => t + m.jumlah, 0);
  const returBatch = db.getJejakPergerakan()
    .filter((m) => m.nomorBatch === b.nomorBatch && m.tipe === 'Retur Masuk' && m.waktu.slice(0, 10) <= s1.akhir)
    .reduce((t, m) => t + m.jumlah, 0);
  cek(
    `B8 identitas saldo batch ${b.nomorBatch}: awal ${b.stokAwalPeriode} + masuk ${b.jumlahPemasukan} - keluar ${keluarBatch - returBatch} = akhir ${b.stokAkhirPeriode}`,
    b.stokAwalPeriode + b.jumlahPemasukan - (keluarBatch - returBatch) === b.stokAkhirPeriode
  );
  cek(`B9 baris ${b.nomorBatch} tanpa catatan validasi (${b.catatanValidasi.join('; ')})`, b.catatanValidasi.length === 0);
  cek(`B10 NIE baris ${b.nomorBatch} berformat valid`, validasiFormatNIE(b.nomorIzinEdar).valid);
});
cek('B11 periode tanpa penyaluran menghasilkan 0 baris', barisEReport(2023, 2).length === 0);

// ==================== C. Ekspor CSV (BOM + CRLF) & XLS ====================
const csv = eksporCsvEReport(baris);
cek('C1 CSV diawali BOM UTF-8', csv.charCodeAt(0) === 0xfeff);
const pecahCsv = csv.split('\n');
cek('C2 CSV memakai CRLF di setiap akhir baris', pecahCsv[pecahCsv.length - 1] === '' && pecahCsv.slice(0, -1).every((b) => b.endsWith('\r')));
cek('C2b jumlah baris CSV = kepala + data', csv.split('\r\n').length === baris.length + 2);
cek('C3 kepala CSV = 10 label kolom', csv.slice(1).split('\r\n')[0] === LABEL_WAJIB.join(','));
const xls = eksporXlsEReport(baris);
cek('C4 XLS memuat 10 kepala kolom', (xls.match(/<th>/g) ?? []).length === 10);
cek('C5 XLS memuat 2 baris data', (xls.match(/<tr>/g) ?? []).length === 3);
cek('C6 nama berkas CSV sesuai periode', namaBerkasEReport('2024-S1', 'CSV') === 'e-Report-Alkes-Kemenkes-2024-S1.csv');
cek('C7 nama berkas XLS sesuai periode', namaBerkasEReport('2024-S1', 'XLS') === 'e-Report-Alkes-Kemenkes-2024-S1.xls');

// ==================== D. Gerbang zona, NIE kedaluwarsa, dan syarat ED pelanggan ====================
const zonaGdm = db.getGudangFisik().map((g) => `${g.id}=${statusZonaGudang(g)}`);
cek(
  `D1 zona seed GDM-01..05 = RELEASED/RELEASED/QUARANTINE/RETURN/REJECT (${zonaGdm.join(', ')})`,
  zonaGdm.join(',') === 'GDM-01=RELEASED,GDM-02=RELEASED,GDM-03=QUARANTINE,GDM-04=RETURN,GDM-05=REJECT'
);
cek('D2 hanya RELEASED terbuka untuk picking', zonaBolehPicking('RELEASED') && !zonaBolehPicking('QUARANTINE') && !zonaBolehPicking('REJECT') && !zonaBolehPicking('RETURN') && !zonaBolehPicking('RECALL'));
cek('D3 format NIE valid diterima', validasiFormatNIE('KEMENKES RI AKL 20501819203').valid);
cek('D4 format NIE menyimpang ditolak', !validasiFormatNIE('AKL 12345').valid && !validasiFormatNIE('').valid);

const stokDasar = db.getStokGudang().find((s) => s.id === 'STK-001')!;
const binReject = db.getLokasiBin().find((b) => b.gudangId === 'GDM-05')!;
const stokZonaTertutup: StokGudang[] = [
  { ...stokDasar, id: 'STK-UJI-ZONA', binId: binReject.id, gudangId: 'GDM-05', statusStok: 'AVAILABLE', qtyDipesan: 0 }
];
const fefoZona = alokasiFEFOSadarKunci({
  daftarStok: stokZonaTertutup,
  jumlahDiminta: 1,
  dari: ACUAN,
  daftarIzinEdar: db.getIzinEdar(),
  daftarBin: db.getLokasiBin(),
  daftarGudang: db.getGudangFisik()
});
cek('D5 stok AVAILABLE di zona REJECT tetap ditolak picking', fefoZona.usulan.length === 0);
cek(`D6 alasan tolak menyebut zona tertutup (${fefoZona.dilewati.map((d) => d.sebab).join('; ')})`, fefoZona.dilewati.some((d) => d.sebab.includes('zona REJECT')));

const stokNieKedaluwarsa: StokGudang[] = [
  {
    ...stokDasar,
    id: 'STK-UJI-NIE',
    kodeSKU: 'STR-BNG-04',
    namaAlkes: 'Benang Bedah Polyglactin 910 Braided Absorbable',
    nomorIzinEdar: 'KEMENKES RI AKD 21603910442',
    nomorBatch: 'LOT-UJI-NIE',
    tanggalKedaluwarsa: '2027-12-31',
    statusStok: 'AVAILABLE',
    qtyDipesan: 0
  }
];
const fefoNie = alokasiFEFOSadarKunci({
  daftarStok: stokNieKedaluwarsa,
  jumlahDiminta: 1,
  dari: new Date('2026-11-15T08:00:00'),
  daftarIzinEdar: db.getIzinEdar()
});
cek('D7 NIE kedaluwarsa memblokir picking walau batch AVAILABLE & ED panjang', fefoNie.usulan.length === 0);
cek(`D8 alasan tolak menyebut NIE (${fefoNie.dilewati.map((d) => d.sebab).join('; ')})`, fefoNie.dilewati.some((d) => d.sebab.startsWith('NIE')));
cek('D9 blokirNIEProduk menandai NIE-004 kedaluwarsa per 15 Nov 2026', blokirNIEProduk(db.getIzinEdar().find((i) => i.id === 'NIE-004'), new Date('2026-11-15T08:00:00')) !== null);

const stokEdPendek: StokGudang[] = [
  { ...stokDasar, id: 'STK-UJI-ED', nomorBatch: 'LOT-UJI-ED', tanggalKedaluwarsa: '2024-09-30', statusStok: 'AVAILABLE', qtyDipesan: 0 }
];
const fefoEd = alokasiFEFOSadarKunci({
  daftarStok: stokEdPendek,
  jumlahDiminta: 1,
  dari: ACUAN,
  minimalUmurEdBulan: 6
});
cek('D9b sisa ED < syarat pelanggan 6 bulan ditolak', fefoEd.usulan.length === 0 && fefoEd.dilewati.some((d) => d.sebab.includes('syarat pelanggan')));

// ==================== E. Putusan PJT atas stok QUARANTINE ====================
mulai();
const rilis = db.putusanPjtKarantina('STK-008', 'RELEASE', PETUGAS_PJT, ACUAN);
cek('E1 PJT boleh me-release stok QUARANTINE', rilis.boleh);
cek('E2 STK-008 menjadi AVAILABLE (zona RELEASED)', db.getStokGudang().find((s) => s.id === 'STK-008')?.statusStok === 'AVAILABLE');
const movRilis = db.getJejakPergerakan().find((m) => m.dokumenRujukan === 'QC/2024/LOT-2024-DNG18');
cek('E3 mutasi QC_RELEASE tercatat dengan persetujuan PJT', !!movRilis && movRilis.tipeTrx === 'QC_RELEASE' && movRilis.disetujuiPjt === PETUGAS_PJT.pengguna);
const tolak = db.putusanPjtKarantina('STK-010', 'REJECT', PETUGAS_PJT, ACUAN);
cek('E4 PJT boleh menolak stok QUARANTINE ke bad stock', tolak.boleh);
cek('E5 STK-010 menjadi DAMAGED', db.getStokGudang().find((s) => s.id === 'STK-010')?.statusStok === 'DAMAGED');
const movTolak = db.getJejakPergerakan().find((m) => m.dokumenRujukan === 'QC/2024/LOT-2023-B991');
cek('E6 mutasi QC_REJECT tercatat', !!movTolak && movTolak.tipeTrx === 'QC_REJECT');
const bukanKarantina = db.putusanPjtKarantina('STK-001', 'RELEASE', PETUGAS_PJT, ACUAN);
cek('E7 putusan PJT ditolak untuk stok non-QUARANTINE', !bukanKarantina.boleh);

// ==================== F. POD → DELIVERED → antrean e-Report ====================
mulai();
const sjBelumBerangkat = db.getSuratJalan().find((s) => s.id === 'SJT-002')!;
const podDini = db.unggahPodSuratJalan(sjBelumBerangkat.id, { buktiTerimaUrl: '/docs/pod/uji.pdf', namaPenerimaPod: 'Uji Coba' }, undefined, ACUAN);
cek(`F1 POD ditolak untuk SJ belum berangkat (${sjBelumBerangkat.status})`, !podDini.boleh);
const podKosong = db.unggahPodSuratJalan('SJT-003', { buktiTerimaUrl: '', namaPenerimaPod: '' }, undefined, ACUAN);
cek('F2 POD tanpa bukti & nama penerima ditolak', !podKosong.boleh);
const podSah = db.unggahPodSuratJalan('SJT-003', { buktiTerimaUrl: '/docs/pod/SJ-KLINIK-120.pdf', namaPenerimaPod: 'dr. Uji Penerima' }, undefined, ACUAN);
cek('F3 POD sah mengubah SJ Terkirim menjadi Diterima Penerima', podSah.boleh && db.getSuratJalan().find((s) => s.id === 'SJT-003')?.status === 'Diterima Penerima');
cek('F4 DELIVERED otomatis masuk antrean e-Report', podSah.antreEReport && db.getSuratJalan().find((s) => s.id === 'SJT-003')?.sudahEksporEReport === false);

// ==================== G. One-click traceability & pembekuan RECALL ====================
mulai();
const lacak = lacakBatchSatuKlik({
  nomorBatch: 'LOT-2024-PM44',
  daftarStok: db.getStokGudang(),
  daftarPergerakan: db.getJejakPergerakan(),
  daftarSuratJalan: db.getSuratJalan(),
  daftarUnit: db.getUnitSerial(),
  dari: ACUAN
});
cek('G1 traceability PM44: total pemasukan 34 unit', lacak.totalMasuk === 34);
cek('G2 traceability PM44: sisa gudang 32 unit', lacak.totalUnitGudang === 32);
cek('G3 daftar penerima memuat SJ-118 RSUD Pasar Minggu', lacak.daftarPenerima.some((p) => p.nomorSuratJalan === 'SJ/CDAKB/2024/SP-EKAT-2024-118'));
const beku = db.bekukanRecallBatch('LOT-2024-PM44', 'Edaran recall uji penjaga', PETUGAS_PJT, ACUAN);
cek('G4 pembekuan RECALL satu klik diizinkan', beku.boleh);
cek('G5 STK-001 berstatus RECALL', db.getStokGudang().find((s) => s.id === 'STK-001')?.statusStok === 'RECALL');
const movRecall = db.getJejakPergerakan().find((m) => m.dokumenRujukan === 'RECALL/2024/LOT-2024-PM44');
cek('G6 mutasi Penarikan Recall tercatat dengan persetujuan PJT', !!movRecall && movRecall.tipe === 'Penarikan Recall' && movRecall.disetujuiPjt === PETUGAS_PJT.pengguna);
const fefoPascaBeku = alokasiFEFOSadarKunci({
  daftarStok: db.getStokGudang(),
  kodeSKU: 'ALKES-PM-01',
  jumlahDiminta: 1,
  dari: ACUAN
});
cek('G7 batch RECALL otomatis dilewati FEFO', !fefoPascaBeku.usulan.some((u) => u.nomorBatch === 'LOT-2024-PM44'));
const bekuKosong = db.bekukanRecallBatch('LOT-TIDAK-ADA', 'uji', PETUGAS_PJT, ACUAN);
cek('G8 batch tanpa sisa stok tidak bisa dibekukan', !bekuKosong.boleh);

// ==================== H. Riwayat ekspor & penandaan SJ terekspor ====================
mulai();
db.unggahPodSuratJalan('SJT-003', { buktiTerimaUrl: '/docs/pod/SJ-KLINIK-120.pdf', namaPenerimaPod: 'dr. Uji Penerima' }, undefined, ACUAN);
const riwayatAwal = db.getRiwayatEksporEReport().length;
const entri = db.catatEksporEReport({ periode: s1, jumlahBaris: 2, format: 'CSV', pengguna: PETUGAS_PJT.pengguna }, ACUAN);
cek('H1 ekspor menambah satu riwayat', db.getRiwayatEksporEReport().length === riwayatAwal + 1);
cek('H2 entri riwayat membawa periode, format & nama berkas', entri.periode === '2024-S1' && entri.format === 'CSV' && entri.namaBerkas === 'e-Report-Alkes-Kemenkes-2024-S1.csv');
cek('H3 SJ DELIVERED dalam periode ditandai terekspor', db.getSuratJalan().find((s) => s.id === 'SJT-003')?.sudahEksporEReport === true);
cek('H4 SJ di luar periode tidak ikut ditandai', db.getSuratJalan().filter((s) => s.status !== 'Diterima Penerima').every((s) => !s.sudahEksporEReport));

// ==================== I. Integritas rantai hash & util qc_env_logs / serial ====================
const rantai = verifikasiRantaiHash(db.getJejakPergerakan());
cek(`I1 rantai hash tetap utuh pasca mutasi (${rantai.penyimpangan.map((p) => `${p.id}:${p.jenis}`).join(', ')})`, rantai.utuh);
const konfigurasi = db.getKonfigurasiGudang();
cek('I2 deviasi suhu cold chain terdeteksi otomatis', deviasiSuhu(9.5, 'Cold Chain (2°C - 8°C)', konfigurasi) && !deviasiSuhu(5, 'Cold Chain (2°C - 8°C)', konfigurasi));
cek('I3 deviasi suhu ruang sejuk terdeteksi otomatis', deviasiSuhu(31, 'Ruang Sejuk AC (15°C - 25°C)', konfigurasi) && !deviasiSuhu(22, 'Ruang Sejuk AC (15°C - 25°C)', konfigurasi));
const unitTerjual = db.getUnitSerial().find((u) => u.statusUnit === 'Terjual');
cek('I4 status serial ERP: Terjual → SOLD', !!unitTerjual && statusSerialErpDariUnit(unitTerjual) === 'SOLD');
const unitGudang = db.getUnitSerial().find((u) => u.statusUnit === 'Di Gudang');
cek('I5 status serial ERP: Di Gudang → IN_STOCK', !!unitGudang && statusSerialErpDariUnit(unitGudang) === 'IN_STOCK');

if (masalah > 0) {
  console.error(`GAGAL: ${masalah} pemeriksaan e-Report & alur CDAKB tidak terpenuhi.`);
  process.exitCode = 1;
} else {
  console.log('[e-report gudang] lolos: 10 kolom e-Report, identitas saldo semester, gerbang zona/NIE/ED, putusan PJT, POD DELIVERED, beku RECALL, riwayat ekspor, rantai hash utuh');
}