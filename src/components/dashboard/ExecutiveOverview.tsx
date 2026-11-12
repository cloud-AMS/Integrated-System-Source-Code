import { useState, useEffect } from 'react';
import DeveloperNotes from '../common/DeveloperNotes';
import { db } from '../../services/pocketbase';
import {
  Building2, 
  Award, 
  Wrench, 
  CheckCircle2, 
  Thermometer, 
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  RefreshCw,
  Briefcase,
  Lock
} from 'lucide-react';
import type {
  AksesEfektif,
  CAPARecord,
  IzinEdarAlkes,
  ModuleId,
  SertifikatPerusahaan,
} from '../../types';
import { bolehAksesModul, SEMUA_ID_MODUL } from '../../utils/hakAkses';

interface ExecutiveOverviewProps {
  onSelectModule: (module: ModuleId) => void;
  onOpenTraceability: () => void;
  onOpenPrintModal: () => void;
  aksesAktif?: AksesEfektif;
}

const NAMA_BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function kunciBulan(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function labelBulan(key: string, berjalan: boolean): string {
  const idx = Number(key.slice(5, 7)) - 1;
  return `Bulan ${NAMA_BULAN[idx] ?? key}${berjalan ? ' (Berjalan)' : ''}`;
}

// Batas akhir bulan kunci 'YYYY-MM' sebagai epoch milidetik, untuk menilai rekaman "per tenggat".
function akhirBulanMs(key: string): number {
  const [tahun, bulan] = key.split('-').map(Number);
  return new Date(tahun, bulan, 0, 23, 59, 59).getTime();
}

// Persentase bagian yang lolos uji; null bila daftar kosong agar tidak ikut dirata-ratakan.
function persentaseBagian<T>(items: T[], lolos: (item: T) => boolean): number | null {
  if (items.length === 0) return null;
  return (items.filter(lolos).length / items.length) * 100;
}

// Skor kepatuhan = rata-rata porsi yang tersedia: NIE belum kedaluwarsa, sertifikat perusahaan masih berlaku, dan CAPA tidak lewat target selesai pada tanggal acuan refMs.
function hitungSkorKepatuhan(
  izin: IzinEdarAlkes[],
  sertifikat: SertifikatPerusahaan[],
  capa: CAPARecord[],
  refMs: number
): number {
  const bagian = [
    persentaseBagian(izin, (i) => i.status !== 'Kedaluwarsa' && new Date(i.tanggalKedaluwarsa).getTime() >= refMs),
    persentaseBagian(sertifikat, (s) => new Date(s.tanggalHabis).getTime() >= refMs),
    persentaseBagian(capa, (c) => c.status === 'Ditutup' || c.status === 'Efektif Diverifikasi' || new Date(c.targetSelesai).getTime() >= refMs),
  ].filter((x): x is number => x !== null);
  return bagian.length > 0 ? bagian.reduce((a, b) => a + b, 0) / bagian.length : 0;
}

interface TitikSerie {
  x: number;
  y: number;
  label: string;
  axis: string;
}

// Memetakan nilai seri ke geometri SVG viewBox 700x200 (area plot x 50-650, y 20-160, garis dasar 170) tanpa NaN saat seri kosong/bernilai sama.
function buatTitikSerie(points: { axis: string; value: number; display: string }[]): TitikSerie[] {
  if (points.length === 0) return [];
  const nilai = points.map((p) => p.value);
  const min = Math.min(...nilai);
  const max = Math.max(...nilai);
  const rentang = max - min;
  const n = points.length;
  return points.map((p, i) => ({
    x: n === 1 ? 350 : 50 + (600 * i) / (n - 1),
    y: rentang === 0 ? 95 : 160 - ((p.value - min) / rentang) * 140,
    label: p.display,
    axis: p.axis,
  }));
}

function garisLintasan(pts: TitikSerie[]): string {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

function bidangLintasan(pts: TitikSerie[]): string {
  if (pts.length < 2) return '';
  const pertama = pts[0];
  const terakhir = pts[pts.length - 1];
  return `${garisLintasan(pts)} L ${terakhir.x} 170 L ${pertama.x} 170 Z`;
}

export default function ExecutiveOverview({
  onSelectModule,
  onOpenTraceability,
  onOpenPrintModal,
  aksesAktif
}: ExecutiveOverviewProps) {
  const aksesEfektif: AksesEfektif = aksesAktif ?? {
    aksesPenuh: true,
    modulDiizinkan: [...SEMUA_ID_MODUL],
    sumber: 'akses-penuh'
  };

  const bukaModulJikaDiizinkan = (mod: ModuleId) => {
    if (!bolehAksesModul(mod, aksesEfektif)) return;
    onSelectModule(mod);
  };
  const [izinList, setIzinList] = useState(db.getIzinEdar());
  const [sertifikatList] = useState(db.getSertifikat());
  const [stokList] = useState(db.getStokGudang());
  const [logSuhuList, setLogSuhuList] = useState(db.getLogSuhu());
  const [layananList] = useState(db.getLayananTeknis());
  const [capaList, setCapaList] = useState(db.getCAPA());
  const [ktdList] = useState(db.getLaporanKTD());
  const [recallList] = useState(db.getPenarikanProduk());
  const [penjualanList, setPenjualanList] = useState(db.getPenjualan());
  const [karyawanList] = useState(db.getKaryawanHRIS());
  const [tenderList, setTenderList] = useState(db.getTender());
  const [absensiList] = useState(db.getAbsensi());
  const [teritorialList] = useState(db.getTeritorial());
  const [riwayatBulanan, setRiwayatBulanan] = useState(db.getRiwayatPenjualanBulanan());
  const [bmrList] = useState(db.getBetsProduksi());
  
  // Chart tab state: 'pendapatan' | 'suhu' | 'kepatuhan'
  const [chartTab, setChartTab] = useState<'pendapatan' | 'suhu' | 'kepatuhan'>('pendapatan');
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const unsub1 = db.subscribe('izin_edar', () => setIzinList(db.getIzinEdar()));
    const unsub2 = db.subscribe('log_suhu', () => setLogSuhuList(db.getLogSuhu()));
    const unsub3 = db.subscribe('penjualan', () => setPenjualanList(db.getPenjualan()));
    const unsub4 = db.subscribe('capa', () => setCapaList(db.getCAPA()));
    const unsub5 = db.subscribe('sales_tender', () => setTenderList(db.getTender()));
    const unsub6 = db.subscribe('sales_riwayat_bulanan', () => setRiwayatBulanan(db.getRiwayatPenjualanBulanan()));
    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
      unsub6();
    };
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIzinList(db.getIzinEdar());
      setLogSuhuList(db.getLogSuhu());
      setPenjualanList(db.getPenjualan());
      setCapaList(db.getCAPA());
      setTenderList(db.getTender());
      setRiwayatBulanan(db.getRiwayatPenjualanBulanan());
      setLastUpdated(new Date().toLocaleTimeString());
      setIsRefreshing(false);
    }, 600);
  };

  const niePerluPerpanjangan = izinList.filter(i => i.status === 'Perpanjangan' || i.statusPerpanjangan === 'Harus Diperpanjang Segera');
  const openCapaCount = capaList.filter(c => !c.status.includes('Selesai') && !c.status.includes('Diverifikasi')).length;

  const nowMs = Date.now();
  const keyBulanKini = kunciBulan(new Date());

  // Skor kepatuhan mutu & ISO saat ini memakai helper yang sama dengan seri grafik kepatuhan.
  const skorKepatuhanKini = hitungSkorKepatuhan(izinList, sertifikatList, capaList, nowMs);

  // Seri 6 bulan: nilai penjualan per bulan kalender dari koleksi riwayat penjualan bulanan (bukan pesanan, supaya kartu dan grafik satu sumber).
  const pendapatanPerBulan = (() => {
    const peta = new Map<string, number>();
    riwayatBulanan.forEach((r) => {
      const key = (r.bulan ?? '').slice(0, 7);
      if (!key) return;
      peta.set(key, (peta.get(key) ?? 0) + (r.nilaiPenjualan || 0));
    });
    return [...peta.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
  })();
  const tahunSeriTerakhir = pendapatanPerBulan[pendapatanPerBulan.length - 1]?.[0].slice(0, 4);
  const totalRevenue = pendapatanPerBulan
    .filter(([key]) => key.slice(0, 4) === tahunSeriTerakhir)
    .reduce((acc, [, nilai]) => acc + nilai, 0);
  const pertumbuhanBulanan = pendapatanPerBulan.length >= 2 && pendapatanPerBulan[pendapatanPerBulan.length - 2][1] > 0
    ? ((pendapatanPerBulan[pendapatanPerBulan.length - 1][1] - pendapatanPerBulan[pendapatanPerBulan.length - 2][1]) / pendapatanPerBulan[pendapatanPerBulan.length - 2][1]) * 100
    : null;

  // Pencapaian target = realisasi YTD seluruh rayon dibagi target tahunan seluruh rayon.
  const totalTargetTahunan = teritorialList.reduce((a, t) => a + (t.targetTahunan || 0), 0);
  const totalRealisasiYtd = teritorialList.reduce((a, t) => a + (t.realisasiYtd || 0), 0);
  const pctPencapaianTarget = totalTargetTahunan > 0 ? (totalRealisasiYtd / totalTargetTahunan) * 100 : 0;
  // Penentu "(On Track)": capaian dianggap aman bila sudah menyusul porsi tahun yang berjalan.
  const proporsiTahunBerjalan = ((new Date().getMonth() + 1) / 12) * 100;

  // Etika promosi = porsi pesanan dengan statusVerifikasiEtikaIklan 'Memenuhi Etika Promosi' pada koleksi penjualan.
  const pctEtikaPromosi = penjualanList.length > 0
    ? (penjualanList.filter((p) => p.statusVerifikasiEtikaIklan === 'Memenuhi Etika Promosi').length / penjualanList.length) * 100
    : 0;

  // Yield produksi = realisasi dibagi rencana seluruh Batch Manufacturing Record (CPAKB).
  const totalRencanaBMR = bmrList.reduce((a, b) => a + (b.jumlahRencana || 0), 0);
  const totalRealisasiBMR = bmrList.reduce((a, b) => a + (b.jumlahRealisasi || 0), 0);
  const pctYieldProduksi = totalRencanaBMR > 0 ? (totalRealisasiBMR / totalRencanaBMR) * 100 : 0;

  // Rata-rata bacaan sensor zona rantai dingin; kalau tidak ada sensor Cold Chain, seluruh bacaan dipakai.
  const bacaanColdChain = logSuhuList.filter((l) => l.zona.includes('Cold Chain'));
  const poolBacaanSuhu = bacaanColdChain.length > 0 ? bacaanColdChain : logSuhuList;
  const suhuColdChain = poolBacaanSuhu.length > 0
    ? poolBacaanSuhu.reduce((a, l) => a + l.suhu, 0) / poolBacaanSuhu.length
    : null;
  const suhuDalamRentang = suhuColdChain === null ? null : suhuColdChain >= 2 && suhuColdChain <= 8;

  // Kehadiran = porsi status 'Hadir'/'Terlambat' pada catatan absensi bertanggal terbaru.
  const tanggalAbsensiTerbaru = absensiList.reduce((mx, a) => (a.tanggal > mx ? a.tanggal : mx), '');
  const absensiTerbaru = absensiList.filter((a) => a.tanggal === tanggalAbsensiTerbaru);
  const pctKehadiran = absensiTerbaru.length > 0
    ? (absensiTerbaru.filter((a) => a.status === 'Hadir' || a.status === 'Terlambat').length / absensiTerbaru.length) * 100
    : 0;

  // Tersertifikasi = porsi sertifikat profesi staf (HRIS) yang masa berlakunya belum lewat dari hari ini.
  const daftarMasaBerlakuSertifikatStaf = karyawanList.flatMap((k) => k.sertifikasi.map((s) => s.masaBerlaku));
  const pctTersertifikasi = daftarMasaBerlakuSertifikatStaf.length > 0
    ? (daftarMasaBerlakuSertifikatStaf.filter((d) => new Date(d).getTime() >= nowMs).length / daftarMasaBerlakuSertifikatStaf.length) * 100
    : 0;

  // Seri grafik 1: total penjualan per bulan kalender dari koleksi penjualan (maks 6 bulan terakhir).
  const seriesPendapatan = buatTitikSerie(
    pendapatanPerBulan.map(([key, total]) => ({
      axis: labelBulan(key, key === keyBulanKini),
      value: total,
      display: `Rp ${(total / 1000000000).toFixed(1)}M`,
    }))
  );

  // Seri grafik 2: satu titik per sensor rantai dingin. Waktu pada log suhu relatif ("10 Menit yang lalu"),
  // jadi tren bulanan tidak dapat dihitung dari data ini tanpa mengarang tanggal; nilai per sensor yang ditampilkan.
  const seriesSuhu = buatTitikSerie(
    poolBacaanSuhu.map((l) => ({
      axis: l.sensor,
      value: l.suhu,
      display: `${l.suhu.toFixed(1)}°C`,
    }))
  );

  // Seri grafik 3: skor kepatuhan helper yang sama dievaluasi pada akhir tiap bulan seri pendapatan.
  const bulanSeriKepatuhan = pendapatanPerBulan.map(([key]) => key);
  const seriesKepatuhan = buatTitikSerie(
    (bulanSeriKepatuhan.length > 0 ? bulanSeriKepatuhan : [keyBulanKini]).map((key) => {
      const ref = Math.min(akhirBulanMs(key), nowMs);
      const skor = hitungSkorKepatuhan(izinList, sertifikatList, capaList, ref);
      return { axis: labelBulan(key, key === keyBulanKini), value: skor, display: `${skor.toFixed(1)}%` };
    })
  );

  const seriesAktif = chartTab === 'pendapatan' ? seriesPendapatan : chartTab === 'suhu' ? seriesSuhu : seriesKepatuhan;
  const warnaGarisSerie = chartTab === 'pendapatan' ? '#2563eb' : chartTab === 'suhu' ? '#d97706' : '#059669';
  const idGradasiSerie = chartTab === 'pendapatan' ? 'blueGradient' : chartTab === 'suhu' ? 'amberGradient' : 'emeraldGradient';

  return (
    <div className="space-y-6">
      <DeveloperNotes
        items={[
          'Semua angka (Pendapatan, Skor Kepatuhan, Suhu Cold Chain, jumlah Tender) berasal dari data benih contoh di perangkat (localStorage) — bukan hasil pengukuran gudang atau keuangan nyata.',
          'Label "Real-Time Board Cockpit", "Sinkronisasi Aktif", dan "LKPP LPSE Terhubung" adalah teks antarmuka; belum ada koneksi API ke LKPP/LPSE, Kemenkes, atau sensor suhu.',
          'Tombol "Sinkronisasi" hanya membaca ulang data dari perangkat ini (dengan jeda 0,6 detik simulasi), bukan penarikan dari server.'
        ]}
      />
      {/* Board of Directors Header Cockpit */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(circle_at_right,rgba(0,170,255,0.2),transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                Real-Time Board Cockpit (Direksi)
              </span>
              <span className="text-xs text-slate-400">PT Anugrah Mitra Selaras (AMS) • Kemenkes RI Standar</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Executive Dashboard & Pemantauan Divisi
            </h1>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Pusat komando eksekutif dewan direksi untuk memantau performa bisnis, kepatuhan regulasi CDAKB & ISO 13485, stabilitas rantai dingin logistik, serta laporan operasional dari 13 divisi secara langsung.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
              Sinkronisasi ({lastUpdated})
            </button>
            <button
              type="button"
              onClick={onOpenTraceability}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              Lacak Batch
            </button>
            <button
              type="button"
              onClick={onOpenPrintModal}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cetak Laporan
            </button>
          </div>
        </div>

        {/* Executive Summary Metric Cards Row */}
        <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Total Pendapatan YTD</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-white mt-1">
              Rp {(totalRevenue / 1000000000).toFixed(2)} M
            </div>
            <div className={`text-2xs mt-0.5 flex items-center gap-1 ${pertumbuhanBulanan === null ? 'text-slate-400' : pertumbuhanBulanan >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {pertumbuhanBulanan === null ? (
                'Bulan pembanding belum ada'
              ) : pertumbuhanBulanan >= 0 ? (
                <><TrendingUp className="w-3 h-3" /> {`+${pertumbuhanBulanan.toFixed(1)}% dari bulan lalu`}</>
              ) : (
                <><TrendingDown className="w-3 h-3" /> {`${pertumbuhanBulanan.toFixed(1)}% dari bulan lalu`}</>
              )}
            </div>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Kepatuhan Mutu & ISO</span>
              <Award className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-lg font-bold text-white mt-1">
              {`${skorKepatuhanKini.toFixed(1)}%`}
            </div>
            <div className="text-2xs text-blue-400 mt-0.5">
              Audit KAN & Kemenkes Lulus
            </div>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Suhu Cold Chain</span>
              <Thermometer className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-lg font-bold text-white mt-1">
              {suhuColdChain === null ? 'Belum ada sensor' : `${suhuColdChain.toFixed(1)}°C`}
            </div>
            <div className={`text-2xs mt-0.5 flex items-center gap-1 ${suhuDalamRentang === false ? 'text-rose-400' : 'text-emerald-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full inline-block ${suhuDalamRentang === false ? 'bg-rose-400' : 'bg-emerald-400'}`} /> {suhuDalamRentang === false ? 'Di Luar Rentang 2-8°C' : 'Standar 2-8°C Aman'}
            </div>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Izin Edar NIE Aktif</span>
              <Building2 className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-lg font-bold text-white mt-1">
              {izinList.length} Produk
            </div>
            <div className="text-2xs text-amber-400 mt-0.5">
              {niePerluPerpanjangan.length} perlu perpanjangan
            </div>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Tender & e-Katalog</span>
              <Briefcase className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-lg font-bold text-white mt-1">
              {tenderList.length} Aktif
            </div>
            <div className="text-2xs text-cyan-400 mt-0.5">
              LKPP LPSE Terhubung
            </div>
          </div>
        </div>
      </div>

      {/* Main Section: Interactive Line Chart & Real-Time Performance Analytics */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Grafik Analisis Real-Time Perusahaan (Tren 6 Bulan)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pemantauan kinerja keuangan, stabilitas suhu rantai dingin, dan skor kepatuhan mutu secara periodik
            </p>
          </div>

          {/* Chart View Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setChartTab('pendapatan')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                chartTab === 'pendapatan' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pendapatan (Miliar Rp)
            </button>
            <button
              type="button"
              onClick={() => setChartTab('suhu')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                chartTab === 'suhu' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Suhu Cold Chain (°C)
            </button>
            <button
              type="button"
              onClick={() => setChartTab('kepatuhan')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                chartTab === 'kepatuhan' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Skor Kepatuhan (%)
            </button>
          </div>
        </div>

        {/* Line Chart Visual Representation (SVG interactive graph) */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-4 text-xs text-slate-600">
            <span className="font-semibold flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
              {chartTab === 'pendapatan' && 'Grafik Tren Penjualan & Pendapatan YTD (Miliar Rupiah)'}
              {chartTab === 'suhu' && 'Grafik Fluktuasi Rata-Rata Suhu Cold Chain Gudang Utama (2-8°C)'}
              {chartTab === 'kepatuhan' && 'Grafik Audit Kepatuhan CDAKB & CAPA ISO 13485 (%)'}
            </span>
            <span className="font-mono text-slate-500">Update Real-Time: {lastUpdated}</span>
          </div>

          {/* SVG Line Chart Box */}
          <div className="h-64 w-full relative flex items-end">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 700 200">
              {/* Grid lines */}
              <line x1="0" y1="20" x2="700" y2="20" stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />
              <line x1="0" y1="70" x2="700" y2="70" stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />
              <line x1="0" y1="120" x2="700" y2="120" stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />
              <line x1="0" y1="170" x2="700" y2="170" stroke="#cbd5e1" strokeWidth="1" />

              {/* Dynamic Path / Line based on active tab — titik dipetakan dari data nyata ke geometri viewBox */}
              <defs>
                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0" />
                </linearGradient>
              </defs>

              {seriesAktif.length >= 2 && (
                <>
                  <path
                    d={garisLintasan(seriesAktif)}
                    fill="none"
                    stroke={warnaGarisSerie}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <path
                    d={bidangLintasan(seriesAktif)}
                    fill={`url(#${idGradasiSerie})`}
                    opacity="0.12"
                  />
                </>
              )}

              {seriesAktif.length === 0 && (
                <text x="350" y="95" textAnchor="middle" className="text-xs font-bold fill-slate-500">
                  Belum ada data untuk grafik ini
                </text>
              )}

              {/* Data points */}
              {seriesAktif.map((pt, idx) => (
                <g key={idx} className="cursor-pointer group/dot">
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="5"
                    className={`transition-all ${chartTab === 'pendapatan' ? 'fill-blue-600' : chartTab === 'suhu' ? 'fill-amber-600' : 'fill-emerald-600'} group-hover/dot:scale-125`}
                  />
                  {idx === seriesAktif.length - 1 && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="9"
                      className={`transition-all opacity-30 ${chartTab === 'pendapatan' ? 'fill-blue-400' : chartTab === 'suhu' ? 'fill-amber-400' : 'fill-emerald-400'} animate-ping`}
                    />
                  )}
                  <text x={pt.x} y={pt.y - 12} textAnchor="middle" className="text-2xs font-bold fill-slate-700 font-mono">
                    {pt.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="flex justify-between text-xs text-slate-500 font-mono mt-2 pt-2 border-t border-slate-200">
            {seriesAktif.map((pt, idx) => (
              <span key={idx}>{pt.axis}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Departmental Reports Grid (Laporan per Divisi) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Laporan Kinerja & Status per Divisi Perusahaan
            </h3>
            <p className="text-xs text-slate-500">
              Ringkasan operasional real-time dari setiap departemen fungsional PT Anugrah Mitra Selaras
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
            7 Divisi Utama Dipantau
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* Divisi 1: Commercial / Sales & e-Katalog LKPP */}
          <div 
            onClick={() => bukaModulJikaDiizinkan('sales-marketing')}
            className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-xs transition-all group flex flex-col justify-between ${
              bolehAksesModul('sales-marketing', aksesEfektif) ? 'hover:border-blue-500 hover:shadow-md cursor-pointer' : 'opacity-70 cursor-not-allowed'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-full text-2xs font-bold bg-blue-100 text-blue-800">
                  Divisi Komersial & LKPP
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Normal Aktif" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                Sales & e-Katalog LKPP
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                {penjualanList.length} Pesanan Fasyankes Aktif • {tenderList.length} Tender LPSE Berjalan
              </p>
              <div className="mt-4 space-y-2 text-xs pt-3 border-t border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Pencapaian Target:</span>
                  <span className={`font-bold ${pctPencapaianTarget >= proporsiTahunBerjalan ? 'text-emerald-700' : 'text-amber-700'}`}>{`${pctPencapaianTarget.toFixed(1)}% ${pctPencapaianTarget >= proporsiTahunBerjalan ? '(On Track)' : '(Tertinggal)'}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Etika Promosi:</span>
                  <span className="font-semibold text-slate-800">{`${pctEtikaPromosi.toFixed(0)}% Memenuhi Etika`}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
              {bolehAksesModul('sales-marketing', aksesEfektif) ? (
                <>Buka Modul Komersial <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" /></>
              ) : (
                <span className="text-slate-500 flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Akses Terbatas</span>
              )}
            </div>
          </div>

          {/* Divisi 2: Warehouse & Logistics (CDAKB) */}
          <div 
            onClick={() => bukaModulJikaDiizinkan('gudang-logistik')}
            className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-xs transition-all group flex flex-col justify-between ${
              bolehAksesModul('gudang-logistik', aksesEfektif) ? 'hover:border-amber-500 hover:shadow-md cursor-pointer' : 'opacity-70 cursor-not-allowed'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-full text-2xs font-bold bg-amber-100 text-amber-800">
                  Divisi Operasional & CDAKB
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Normal Aktif" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-amber-600 transition-colors">
                Warehouse & Logistik (CDAKB)
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                {stokList.length} Batch Alkes • Suhu Cold Chain {suhuColdChain === null ? '-' : `${suhuColdChain.toFixed(1)}°C`}
              </p>
              <div className="mt-4 space-y-2 text-xs pt-3 border-t border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Prinsip FEFO:</span>
                  <span className="font-bold text-emerald-700">Terkontrol Otomatis</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">SatuSehat / LKPP:</span>
                  <span className="font-semibold text-slate-800">Sinkronisasi Aktif</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-amber-600">
              {bolehAksesModul('gudang-logistik', aksesEfektif) ? (
                <>Buka Modul Gudang <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" /></>
              ) : (
                <span className="text-slate-500 flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Akses Terbatas</span>
              )}
            </div>
          </div>

          {/* Divisi 3: Regulatory Affairs & PJT */}
          <div 
            onClick={() => bukaModulJikaDiizinkan('ra-pjt')}
            className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-xs transition-all group flex flex-col justify-between ${
              bolehAksesModul('ra-pjt', aksesEfektif) ? 'hover:border-indigo-500 hover:shadow-md cursor-pointer' : 'opacity-70 cursor-not-allowed'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-full text-2xs font-bold bg-indigo-100 text-indigo-800">
                  Regulasi & Kepatuhan
                </span>
                <span className={`w-2 h-2 rounded-full ${niePerluPerpanjangan.length > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              </div>
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                Regulatory Affairs (PJT)
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                {izinList.length} Nomor Izin Edar (NIE) Terdaftar di Kemenkes RI
              </p>
              <div className="mt-4 space-y-2 text-xs pt-3 border-t border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Perlu Perpanjangan:</span>
                  <span className={`font-bold ${niePerluPerpanjangan.length > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {niePerluPerpanjangan.length} Produk
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sertifikat SDAK:</span>
                  <span className="font-semibold text-emerald-700">Aktif Berlaku</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
              {bolehAksesModul('ra-pjt', aksesEfektif) ? (
                <>Buka Modul Regulatory <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" /></>
              ) : (
                <span className="text-slate-500 flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Akses Terbatas</span>
              )}
            </div>
          </div>

          {/* Divisi 4: Quality Assurance & ISO 13485 */}
          <div 
            onClick={() => bukaModulJikaDiizinkan('qa-mutu')}
            className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-xs transition-all group flex flex-col justify-between ${
              bolehAksesModul('qa-mutu', aksesEfektif) ? 'hover:border-purple-500 hover:shadow-md cursor-pointer' : 'opacity-70 cursor-not-allowed'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-full text-2xs font-bold bg-purple-100 text-purple-800">
                  Sistem Manajemen Mutu
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-purple-600 transition-colors">
                Quality Assurance (ISO 13485)
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                {capaList.length} Total Catatan CAPA • SMM Terakreditasi KAN
              </p>
              <div className="mt-4 space-y-2 text-xs pt-3 border-t border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Audit Internal:</span>
                  <span className="font-bold text-emerald-700">Lulus Sesuai Jadwal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sertifikat ISO:</span>
                  <span className="font-semibold text-slate-800">Berlaku s.d 2028</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-600">
              {bolehAksesModul('qa-mutu', aksesEfektif) ? (
                <>Buka Modul QA <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" /></>
              ) : (
                <span className="text-slate-500 flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Akses Terbatas</span>
              )}
            </div>
          </div>

          {/* Divisi 5: Manufaktur CPAKB */}
          <div 
            onClick={() => bukaModulJikaDiizinkan('produksi-cpakb')}
            className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-xs transition-all group flex flex-col justify-between ${
              bolehAksesModul('produksi-cpakb', aksesEfektif) ? 'hover:border-emerald-500 hover:shadow-md cursor-pointer' : 'opacity-70 cursor-not-allowed'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-full text-2xs font-bold bg-emerald-100 text-emerald-800">
                  Produksi & CPAKB
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">
                Manufacture CPAKB
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Batch Manufacturing Record (BMR) & Cleanroom Steril
              </p>
              <div className="mt-4 space-y-2 text-xs pt-3 border-t border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Yield Produksi:</span>
                  <span className="font-bold text-emerald-700">{`${pctYieldProduksi.toFixed(1)}% Rata-Rata`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status Cleanroom:</span>
                  <span className="font-semibold text-slate-800">Tekanan Udara Normal</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600">
              {bolehAksesModul('produksi-cpakb', aksesEfektif) ? (
                <>Buka Modul Produksi <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" /></>
              ) : (
                <span className="text-slate-500 flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Akses Terbatas</span>
              )}
            </div>
          </div>

          {/* Divisi 6: Finance & Accounting */}
          <div 
            onClick={() => bukaModulJikaDiizinkan('finance-akuntansi')}
            className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-xs transition-all group flex flex-col justify-between ${
              bolehAksesModul('finance-akuntansi', aksesEfektif) ? 'hover:border-cyan-500 hover:shadow-md cursor-pointer' : 'opacity-70 cursor-not-allowed'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-full text-2xs font-bold bg-cyan-100 text-cyan-800">
                  Keuangan & Pajak
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-cyan-600 transition-colors">
                Finance & Accounting
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Buku Besar Ganda, Arus Kas, & Pajak PPN 11% Terintegrasi
              </p>
              <div className="mt-4 space-y-2 text-xs pt-3 border-t border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Arus Kas Bersih:</span>
                  <span className="font-bold text-emerald-700">Positif & Sehat</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kepatuhan Pajak:</span>
                  <span className="font-semibold text-slate-800">SPT Masa Lapor</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-cyan-600">
              {bolehAksesModul('finance-akuntansi', aksesEfektif) ? (
                <>Buka Modul Keuangan <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" /></>
              ) : (
                <span className="text-slate-500 flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Akses Terbatas</span>
              )}
            </div>
          </div>

          {/* Divisi 7: HRD & Payroll */}
          <div 
            onClick={() => bukaModulJikaDiizinkan('hrd-pelatihan')}
            className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-xs transition-all group flex flex-col justify-between ${
              bolehAksesModul('hrd-pelatihan', aksesEfektif) ? 'hover:border-rose-500 hover:shadow-md cursor-pointer' : 'opacity-70 cursor-not-allowed'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-full text-2xs font-bold bg-rose-100 text-rose-800">
                  Sumber Daya Manusia
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-rose-600 transition-colors">
                HRD & Payroll (HRIS)
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                {karyawanList.length} Karyawan Aktif • Shift, Absensi, & Penggajian
              </p>
              <div className="mt-4 space-y-2 text-xs pt-3 border-t border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Kehadiran Hari Ini:</span>
                  <span className="font-bold text-emerald-700">{`${pctKehadiran.toFixed(1)}% Hadir`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sertifikasi PJT/Staff:</span>
                  <span className="font-semibold text-slate-800">{`${pctTersertifikasi.toFixed(0)}% Tersertifikasi`}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-rose-600">
              {bolehAksesModul('hrd-pelatihan', aksesEfektif) ? (
                <>Buka Modul HRIS <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" /></>
              ) : (
                <span className="text-slate-500 flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Akses Terbatas</span>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Board Resolution & Quick Action Footer */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Sistem Manajemen Mutu Perusahaan Tersertifikasi</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Seluruh data operasional dienkripsi dan dicatat menggunakan standar keamanan SHA-256 (ALCOA+) untuk audit Kemenkes RI.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {bolehAksesModul('pms-vigilance', aksesEfektif) && (
            <button
              type="button"
              onClick={() => bukaModulJikaDiizinkan('pms-vigilance')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Pusat Laporan KTD
            </button>
          )}
          <button
            type="button"
            onClick={onOpenPrintModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Cetak Ringkasan Direksi
          </button>
        </div>
      </div>

    </div>
  );
}
