import type { AkunPengguna, RoleSistem, UserRole } from '../types';
import { AKUN_BAWAAN_SISTEM, ROLE_BAWAAN_SISTEM } from './hakAkses';

/**
 * Gerbang masuk aplikasi. Kredensial ikut terbungkus di berkas sisi klien, jadi ini
 * pembatas tampilan halaman — bukan batas keamanan: isi localStorage pengunjung mana pun
 * tetap terbaca tanpa kata sandi.
 */
export const AKUN_BAWAAN = { namaPengguna: 'admin', kataSandi: 'admin123', peran: 'pjt' as UserRole };

const KUNCI_SESI = 'ams_alkes_sesi_login';
const KUNCI_AKUN = 'ams_alkes_rb_akun';
const KUNCI_ROLE = 'ams_alkes_rb_role';

export interface SesiLogin {
  akunId?: string;
  namaPengguna: string;
  namaLengkap?: string;
  peran: UserRole;
  roleId?: string;
  masukPada: string;
}

function bacaDaftarAkun(): AkunPengguna[] {
  try {
    const mentah = localStorage.getItem(KUNCI_AKUN);
    if (!mentah) return AKUN_BAWAAN_SISTEM;
    const parsed = JSON.parse(mentah) as AkunPengguna[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : AKUN_BAWAAN_SISTEM;
  } catch {
    return AKUN_BAWAAN_SISTEM;
  }
}

function bacaDaftarRole(): RoleSistem[] {
  try {
    const mentah = localStorage.getItem(KUNCI_ROLE);
    if (!mentah) return ROLE_BAWAAN_SISTEM;
    const parsed = JSON.parse(mentah) as RoleSistem[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : ROLE_BAWAAN_SISTEM;
  } catch {
    return ROLE_BAWAAN_SISTEM;
  }
}

export function bacaSesi(): SesiLogin | null {
  try {
    const mentah = localStorage.getItem(KUNCI_SESI);
    if (!mentah) return null;
    const sesi = JSON.parse(mentah) as SesiLogin;
    if (!sesi || !sesi.namaPengguna) return null;
    if (sesi.namaPengguna === AKUN_BAWAAN.namaPengguna) return sesi;
    const daftarAkun = bacaDaftarAkun();
    const cocok = daftarAkun.find((a) => a.username === sesi.namaPengguna && a.status === 'Aktif');
    return cocok ? sesi : null;
  } catch {
    return null;
  }
}

export function cobaMasuk(namaPengguna: string, kataSandi: string): SesiLogin | null {
  const inputUser = namaPengguna.trim();
  const daftarAkun = bacaDaftarAkun();
  const daftarRole = bacaDaftarRole();

  const akunCocok = daftarAkun.find(
    (a) => a.username.toLowerCase() === inputUser.toLowerCase() && a.kataSandi === kataSandi
  );

  let sesi: SesiLogin | null = null;

  if (akunCocok) {
    if (akunCocok.status !== 'Aktif') return null;
    const roleDef = daftarRole.find((r) => r.id === akunCocok.roleId);
    const basisPeran: UserRole = roleDef?.basisPeran ?? 'pjt';
    sesi = {
      akunId: akunCocok.id,
      namaPengguna: akunCocok.username,
      namaLengkap: akunCocok.namaLengkap,
      peran: basisPeran,
      roleId: akunCocok.roleId,
      masukPada: new Date().toISOString()
    };
  } else if (inputUser === AKUN_BAWAAN.namaPengguna && kataSandi === AKUN_BAWAAN.kataSandi) {
    sesi = {
      akunId: 'USR-01',
      namaPengguna: AKUN_BAWAAN.namaPengguna,
      namaLengkap: 'apt. Dewi Kartika, S.Si',
      peran: AKUN_BAWAAN.peran,
      roleId: 'pjt',
      masukPada: new Date().toISOString()
    };
  }

  if (!sesi) return null;

  try {
    localStorage.setItem(KUNCI_SESI, JSON.stringify(sesi));
  } catch {
    /* sesi tetap berlaku sampai halaman ditutup bila penyimpanan penuh */
  }
  return sesi;
}

export function akhiriSesi(): void {
  try {
    localStorage.removeItem(KUNCI_SESI);
  } catch {
    /* tidak ada yang bisa dibersihkan bila penyimpanan tidak tersedia */
  }
}
