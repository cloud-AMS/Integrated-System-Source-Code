import type { KaryawanHRIS, LokasiKerja, UserRole } from '../../types';
import { punyaIzin, type SesiLogin } from '../../utils/autentikasi';

export interface MobileCapabilities {
  isSales: boolean;
  canApproveLeave: boolean;
  canViewAllEmployees: boolean;
  canManageOrders: boolean;
  roleLabel: string;
}

export interface TitikGeofenceKantor {
  id: LokasiKerja;
  nama: string;
  lat: number;
  lon: number;
  radiusMeter: number;
}

export const LOKASI_GEOFENCE_AMS: TitikGeofenceKantor[] = [
  {
    id: 'Kantor Pusat',
    nama: 'Kantor Pusat AMS (Jakarta)',
    lat: -6.2297,
    lon: 106.8295,
    radiusMeter: 200
  },
  {
    id: 'Pabrik Manufaktur',
    nama: 'Pabrik Manufaktur CPAKB Cikarang',
    lat: -6.2297,
    lon: 107.1571,
    radiusMeter: 200
  },
  {
    id: 'Gudang Distribusi',
    nama: 'Gudang Distribusi CDAKB & Cold Chain',
    lat: -6.2314,
    lon: 107.1542,
    radiusMeter: 200
  }
];

const PERAN_SALES: ReadonlySet<UserRole> = new Set([
  'sales_medrep',
  'sales_manager',
  'pjt',
  'it_admin'
]);

const PERAN_APPROVER: ReadonlySet<UserRole> = new Set([
  'pjt',
  'it_admin',
  'qa_manager',
  'manajer_produksi',
  'kepala_gudang',
  'sales_manager'
]);

export function getMobileCapabilities(sesi: SesiLogin | null | undefined): MobileCapabilities {
  if (!sesi) {
    return {
      isSales: false,
      canApproveLeave: false,
      canViewAllEmployees: false,
      canManageOrders: false,
      roleLabel: 'Tamu'
    };
  }

  const isSalesRole =
    PERAN_SALES.has(sesi.peran) || punyaIzin(sesi, 'sales-marketing', 'view');
  const canApproveLeave =
    PERAN_APPROVER.has(sesi.peran) || punyaIzin(sesi, 'hrd-pelatihan', 'approve');
  const canViewAllEmployees =
    sesi.peran === 'pjt' ||
    sesi.peran === 'it_admin' ||
    punyaIzin(sesi, 'hrd-pelatihan', 'update');
  const canManageOrders =
    PERAN_SALES.has(sesi.peran) || punyaIzin(sesi, 'sales-marketing', 'create');

  return {
    isSales: isSalesRole,
    canApproveLeave,
    canViewAllEmployees,
    canManageOrders,
    roleLabel: sesi.namaPeran || sesi.peran
  };
}

function normalisasiNama(teks: string): string {
  return teks
    .toLowerCase()
    .replace(/\b(apt|dr|ir|s\.si|s\.t|s\.e|s\.farm|a\.md\.tem|s\.kom)\b/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function findKaryawanForSession(
  daftarKaryawan: KaryawanHRIS[],
  sesi: SesiLogin | null | undefined,
  overrideId?: string
): KaryawanHRIS | undefined {
  if (daftarKaryawan.length === 0) return undefined;
  if (overrideId) {
    const manual = daftarKaryawan.find((k) => k.id === overrideId);
    if (manual) return manual;
  }
  if (!sesi) return daftarKaryawan[0];

  const targetNama = normalisasiNama(sesi.namaLengkap || '');
  const usernameLower = (sesi.namaPengguna || '').toLowerCase();

  const exactNama = daftarKaryawan.find((k) => {
    const normK = normalisasiNama(k.nama);
    return targetNama.length > 2 && (normK.includes(targetNama) || targetNama.includes(normK));
  });
  if (exactNama) return exactNama;

  const cocokUsername = daftarKaryawan.find((k) => {
    const bagian = k.nama.toLowerCase().split(/\s+/);
    return bagian.some((b) => b.length >= 4 && usernameLower.includes(b));
  });
  if (cocokUsername) return cocokUsername;

  if (sesi.peran === 'sales_manager' || sesi.peran === 'sales_medrep') {
    const salesEmp = daftarKaryawan.find((k) =>
      k.divisi.toLowerCase().includes('sales')
    );
    if (salesEmp) return salesEmp;
  }

  return daftarKaryawan[0];
}

export function hitungJumlahHariCuti(tanggalMulai: string, tanggalSelesai: string): number {
  if (!tanggalMulai || !tanggalSelesai) return 0;
  const mulai = new Date(tanggalMulai);
  const selesai = new Date(tanggalSelesai);
  if (Number.isNaN(mulai.getTime()) || Number.isNaN(selesai.getTime())) return 0;
  if (selesai.getTime() < mulai.getTime()) return 0;
  return Math.round((selesai.getTime() - mulai.getTime()) / 86400000) + 1;
}

export interface HasilGpsPerangkat {
  ok: true;
  lat: number;
  lon: number;
  accuracyMeter: number;
  diambilPada: string;
}

export interface GalatGpsPerangkat {
  ok: false;
  pesan: string;
}

export function ambilLokasiGpsPerangkat(): Promise<HasilGpsPerangkat | GalatGpsPerangkat> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve({
      ok: false,
      pesan: 'Browser atau perangkat ini tidak mendukung sensor GPS (Geolocation API).'
    });
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          ok: true,
          lat: Number(pos.coords.latitude.toFixed(6)),
          lon: Number(pos.coords.longitude.toFixed(6)),
          accuracyMeter: Math.round(pos.coords.accuracy || 0),
          diambilPada: new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          resolve({
            ok: false,
            pesan: 'Izin lokasi GPS ditolak. Aktifkan izin lokasi di pengaturan browser/HP untuk absensi & check-in.'
          });
          return;
        }
        if (err.code === err.POSITION_UNAVAILABLE) {
          resolve({
            ok: false,
            pesan: 'Sinyal GPS tidak tersedia saat ini. Pastikan GPS perangkat aktif di area terbuka.'
          });
          return;
        }
        resolve({
          ok: false,
          pesan: 'Waktu pencarian sinyal GPS habis. Silakan coba lagi atau periksa koneksi perangkat.'
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 15000
      }
    );
  });
}
