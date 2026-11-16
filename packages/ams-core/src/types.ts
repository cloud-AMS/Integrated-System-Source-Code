export type SumberAbsensi = 'Geofencing GPS (Mobile)' | 'Fingerprint (Pabrik)' | 'Face Recognition (Pabrik)' | 'Manual HR';

export interface LogAbsensi {
  id: string;
  karyawanId: string;
  nama: string;
  tanggal: string;
  jamMasuk: string;
  jamKeluar: string;
  sumber: SumberAbsensi;
  status: 'Hadir' | 'Terlambat' | 'Izin' | 'Sakit' | 'Mangkir';
  lokasi: string;
  koordinat?: { lat: number; lon: number };
  akurasiMeter?: number;
  geofence?: { lokasiId: string; radiusMeter: number; jarakMeter: number; dalamPagar: boolean };
  fotoMasukUrl?: string;
  fotoMasukHash?: string;
  fotoKeluarUrl?: string;
  fotoKeluarHash?: string;
  deviceId?: string;
  waktuServer?: string;
  flagAntiSpoof?: string;
  idempotencyKey?: string;
}

export interface GeoLokasi {
  id: string;
  nama: string;
  lat: number;
  lon: number;
  radiusMeter: number;
}

export interface PayloadClock {
  lat: number;
  lon: number;
  akurasiMeter?: number;
  deviceId?: string;
  foto?: string | null;
  idempotencyKey?: string;
  mockLocation?: boolean;
}

export interface HasilGeofence {
  lokasi: GeoLokasi;
  jarakMeter: number;
  dalamPagar: boolean;
  label: string;
}

export type PermissionAction =
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'publish'
  | 'export';

export type ModuleId =
  | 'ra-pjt'
  | 'qa-mutu'
  | 'qc-inspeksi'
  | 'gudang-logistik'
  | 'teknisi-service'
  | 'produksi-cpakb'
  | 'purchasing-procurement'
  | 'sales-marketing'
  | 'pms-vigilance'
  | 'hrd-pelatihan'
  | 'finance-akuntansi'
  | 'it-traceability';

export type RbacResourceId =
  | ModuleId
  | 'overview'
  | 'website'
  | 'rbac-admin'
  | 'audit-trail';

export type RolePermissionMatrix = Partial<Record<RbacResourceId, PermissionAction[]>>;

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: RolePermissionMatrix;
  updatedAt: string;
}

export interface ServerUserPublic {
  id: string;
  username: string;
  fullName: string;
  email: string;
  roleId: string;
  roleName: string;
  department: string;
  isActive: boolean;
  isHiddenDeveloper?: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SesiLogin {
  user: ServerUserPublic;
  role: RoleDefinition;
  permissions: RolePermissionMatrix;
  token: string;
  expiresAt: string;
}

export interface ResponsGeoLokasi {
  lokasi: GeoLokasi[];
  akurasiMaksMeter: number;
}

export interface ResponsClock {
  record: LogAbsensi;
  geofence: HasilGeofence;
  revision: number;
  sudahAda?: boolean;
}

export interface ResponsHariIni {
  record: LogAbsensi | null;
}

export interface ResponsRiwayat {
  records: LogAbsensi[];
}

export interface BodyPesan {
  pesan: string;
  error?: string;
  geofence?: HasilGeofence;
}