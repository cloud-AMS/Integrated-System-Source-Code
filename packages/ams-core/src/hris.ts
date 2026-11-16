// Cermin murni src/utils/hris.ts induk; konstanta payroll selaras
// PARAMETER_PAYROLL_2026 (src/data/initialData.ts:3046).
const TOLERANSI_KETERLAMBATAN_MENIT = 10;
const POTONGAN_PER_JAM_TERLAMBAT = 25000;

export function menitDariJam(jam: string) {
  const [h, m] = jam.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
  return h * 60 + m;
}

const JAM_MULAI_KERJA = ['07:00', '08:00', '15:00', '23:00'];

export function evaluasiKeterlambatan(jamMasuk: string, jamMulaiList: string[] = JAM_MULAI_KERJA) {
  const masuk = menitDariJam(jamMasuk);
  if (Number.isNaN(masuk)) return { jamAcuan: null as string | null, menitTerlambat: 0 };

  let acuan: string | null = null;
  let jarakTerdekat = Infinity;
  let selisihMaju = 0;
  for (const mulai of jamMulaiList) {
    const selisih = (masuk - menitDariJam(mulai) + 1440) % 1440;
    const jarak = Math.min(selisih, 1440 - selisih);
    if (jarak < jarakTerdekat) {
      jarakTerdekat = jarak;
      selisihMaju = selisih > 720 ? 0 : selisih;
      acuan = mulai;
    }
  }

  if (acuan === null || jarakTerdekat > 120) return { jamAcuan: null, menitTerlambat: 0 };
  return {
    jamAcuan: acuan,
    menitTerlambat: Math.max(selisihMaju - TOLERANSI_KETERLAMBATAN_MENIT, 0)
  };
}

export function hitungPotonganKeterlambatan(menitTerlambat: number) {
  const jumlahJam = Math.ceil(menitTerlambat / 60);
  return jumlahJam * POTONGAN_PER_JAM_TERLAMBAT;
}

export function hitungJarakKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (derajat: number) => (derajat * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function verifikasiGeofence(jarakKm: number, radiusMeter: number) {
  const dalamPagar = jarakKm * 1000 <= radiusMeter;
  return {
    dalamPagar,
    label: dalamPagar
      ? `Valid — radius ${Math.round(jarakKm * 1000)} m di dalam pagar geofence ${radiusMeter} m`
      : `Ditolak — radius ${Math.round(jarakKm * 1000)} m di luar pagar geofence ${radiusMeter} m`
  };
}