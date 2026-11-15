import { beforeEach, describe, expect, it } from 'vitest';
import {
  findKaryawanForSession,
  getMobileCapabilities,
  hitungJumlahHariCuti
} from '../../src/components/mobile/mobileHelpers';
import { INITIAL_KARYAWAN_HRIS } from '../../src/data/initialData';
import { db } from '../../src/services/pocketbase';
import type { RoleDefinition } from '../../src/types';
import type { SesiLogin } from '../../src/utils/autentikasi';
import { canWriteSyncKey } from '../../server/dataSyncStore';

function buatSesiUji(
  peran: SesiLogin['peran'],
  permissions: RoleDefinition['permissions'],
  namaLengkap = 'Pegawai Lapangan'
): SesiLogin {
  return {
    userId: `USR-${peran}`,
    namaPengguna: `user.${peran}`,
    namaLengkap,
    email: `${peran}@ams.co.id`,
    peran,
    namaPeran: peran,
    departemen: 'Operasional',
    token: 'tok-uji',
    expiresAt: '2099-01-01T00:00:00.000Z',
    masukPada: '2026-11-15T08:00:00.000Z',
    permissions
  };
}

describe('Mobile App — Kontrol Akses Berbasis Peran (Karyawan vs Sales)', () => {
  it('karyawan reguler hanya mendapat akses HRIS tanpa menu CRM atau Sales', () => {
    const sesiKaryawan = buatSesiUji('karyawan', {
      overview: ['view'],
      'hrd-pelatihan': ['view']
    });
    const cap = getMobileCapabilities(sesiKaryawan);

    expect(cap.isSales).toBe(false);
    expect(cap.canManageOrders).toBe(false);
    expect(cap.canApproveLeave).toBe(false);
    expect(cap.canViewAllEmployees).toBe(false);
  });

  it('sales_medrep mendapat akses penuh CRM, kunjungan GPS, dan pre-order tanpa approve cuti', () => {
    const sesiSales = buatSesiUji('sales_medrep', {
      overview: ['view'],
      'sales-marketing': ['view', 'create', 'update'],
      'hrd-pelatihan': ['view']
    });
    const cap = getMobileCapabilities(sesiSales);

    expect(cap.isSales).toBe(true);
    expect(cap.canManageOrders).toBe(true);
    expect(cap.canApproveLeave).toBe(false);
    expect(cap.canViewAllEmployees).toBe(false);
  });

  it('sales_manager dapat mengakses CRM, mengelola order, dan menyetujui pengajuan cuti', () => {
    const sesiManager = buatSesiUji('sales_manager', {
      overview: ['view'],
      'sales-marketing': ['view', 'create', 'update', 'approve'],
      'hrd-pelatihan': ['view', 'approve']
    });
    const cap = getMobileCapabilities(sesiManager);

    expect(cap.isSales).toBe(true);
    expect(cap.canManageOrders).toBe(true);
    expect(cap.canApproveLeave).toBe(true);
  });

  it('pjt mendapat seluruh kapabilitas mobile termasuk switch pratinjau profil karyawan', () => {
    const sesiPjt = buatSesiUji('pjt', {
      overview: ['view', 'create', 'update', 'delete', 'approve', 'export', 'publish'],
      'hrd-pelatihan': ['view', 'create', 'update', 'approve'],
      'sales-marketing': ['view', 'create', 'update', 'approve']
    });
    const cap = getMobileCapabilities(sesiPjt);

    expect(cap.isSales).toBe(true);
    expect(cap.canManageOrders).toBe(true);
    expect(cap.canApproveLeave).toBe(true);
    expect(cap.canViewAllEmployees).toBe(true);
  });
});

function pasangLocalStorageMock() {
  const store = new Map<string, string>();
  const mockStorage: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    }
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockStorage,
    configurable: true,
    writable: true
  });
}

describe('Mobile App — Utilitas HRIS, Cuti & Server Self-Service Sync', () => {
  beforeEach(() => {
    pasangLocalStorageMock();
  });

  it('hitungJumlahHariCuti menghitung durasi inklusif secara akurat dan menolak rentang terbalik', () => {
    expect(hitungJumlahHariCuti('2026-11-16', '2026-11-16')).toBe(1);
    expect(hitungJumlahHariCuti('2026-11-16', '2026-11-18')).toBe(3);
    expect(hitungJumlahHariCuti('2026-11-18', '2026-11-16')).toBe(0);
    expect(hitungJumlahHariCuti('', '2026-11-16')).toBe(0);
  });

  it('findKaryawanForSession mencocokkan nama lengkap sesi dengan master KaryawanHRIS', () => {
    const target = INITIAL_KARYAWAN_HRIS[0];
    const sesi = buatSesiUji('karyawan', { 'hrd-pelatihan': ['view'] }, target.nama);
    const ditemukan = findKaryawanForSession(INITIAL_KARYAWAN_HRIS, sesi);

    expect(ditemukan?.id).toBe(target.id);
  });

  it('canWriteSyncKey mengizinkan self-service absensi & cuti untuk karyawan namun memblokir modul terlarang', () => {
    const roleKaryawan: RoleDefinition = {
      id: 'karyawan',
      name: 'Karyawan (Mobile HRIS)',
      description: 'Self-service HRIS',
      isSystem: true,
      updatedAt: '2026-11-15T00:00:00.000Z',
      permissions: {
        overview: ['view'],
        'hrd-pelatihan': ['view']
      }
    };

    expect(canWriteSyncKey(roleKaryawan, 'hris_absensi')).toBe(true);
    expect(canWriteSyncKey(roleKaryawan, 'hris_cuti')).toBe(true);
    expect(canWriteSyncKey(roleKaryawan, 'izin_edar')).toBe(false);
    expect(canWriteSyncKey(roleKaryawan, 'keuangan_jurnal')).toBe(false);
  });

  it('db.addCuti, db.ubahStatusCuti, dan db.checkOutAbsensi memperbarui data dengan benar', () => {
    db.addCuti({
      id: 'CUTI-UJI-1',
      karyawanId: INITIAL_KARYAWAN_HRIS[0].id,
      namaKaryawan: INITIAL_KARYAWAN_HRIS[0].nama,
      jenis: 'Cuti Tahunan',
      tanggalMulai: '2026-12-01',
      tanggalSelesai: '2026-12-02',
      jumlahHari: 2,
      alasan: 'Keperluan keluarga',
      status: 'Menunggu',
      tanggalPengajuan: '2026-11-15'
    });

    expect(db.getCuti().some((c) => c.id === 'CUTI-UJI-1' && c.status === 'Menunggu')).toBe(true);

    db.ubahStatusCuti('CUTI-UJI-1', 'Disetujui', 'Manajer HR');
    const disetujui = db.getCuti().find((c) => c.id === 'CUTI-UJI-1');
    expect(disetujui?.status).toBe('Disetujui');
    expect(disetujui?.disetujuiOleh).toBe('Manajer HR');

    db.addAbsensi({
      id: 'ABS-UJI-1',
      karyawanId: INITIAL_KARYAWAN_HRIS[0].id,
      nama: INITIAL_KARYAWAN_HRIS[0].nama,
      tanggal: '2026-11-15',
      jamMasuk: '07:55',
      jamKeluar: '-',
      sumber: 'Geofencing GPS (Mobile)',
      status: 'Hadir',
      lokasi: 'Kantor Pusat AMS (-6.2297, 106.8295)'
    });
    db.checkOutAbsensi('ABS-UJI-1', '17:05', '-6.2297, 106.8295');
    const logOut = db.getAbsensi().find((a) => a.id === 'ABS-UJI-1');
    expect(logOut?.jamKeluar).toBe('17:05');
    expect(logOut?.lokasi).toContain('Out: -6.2297, 106.8295');
  });
});
