import { describe, expect, it } from 'vitest';
import {
  AKUN_BAWAAN_SISTEM,
  ROLE_BAWAAN_SISTEM,
  SEMUA_ID_MODUL,
  bolehAksesModul,
  buatSlugRole,
  hitungAdminAksesPenuhAktif,
  hitungAksesEfektif
} from '../../src/utils/hakAkses';
import type { AkunPengguna, RoleSistem } from '../../src/types';

describe('hitungAksesEfektif & bolehAksesModul — RBAC per role dan per user', () => {
  it('role dengan aksesPenuh=true (pjt, it_admin) mendapat seluruh 14 modul sistem', () => {
    const pjtAccount = AKUN_BAWAAN_SISTEM.find((a) => a.roleId === 'pjt')!;
    const akses = hitungAksesEfektif(pjtAccount, ROLE_BAWAAN_SISTEM);

    expect(akses.aksesPenuh).toBe(true);
    expect(akses.sumber).toBe('akses-penuh');
    expect(akses.modulDiizinkan).toEqual(SEMUA_ID_MODUL);
    expect(bolehAksesModul('finance-akuntansi', akses)).toBe(true);
    expect(bolehAksesModul('hrd-pelatihan', akses)).toBe(true);
  });

  it('role terbatas (qa_manager) hanya dapat mengakses modul yang dicentang pada rolenya', () => {
    const qaAccount = AKUN_BAWAAN_SISTEM.find((a) => a.roleId === 'qa_manager')!;
    const akses = hitungAksesEfektif(qaAccount, ROLE_BAWAAN_SISTEM);

    expect(akses.aksesPenuh).toBe(false);
    expect(akses.sumber).toBe('role');
    expect(bolehAksesModul('qa-mutu', akses)).toBe(true);
    expect(bolehAksesModul('overview', akses)).toBe(true);
    expect(bolehAksesModul('finance-akuntansi', akses)).toBe(false);
    expect(bolehAksesModul('hrd-pelatihan', akses)).toBe(false);
  });

  it('override per user (aksesKustom=true) menimpa hak akses bawaan role dan membersihkan duplikat/id invalid', () => {
    const baseUser = AKUN_BAWAAN_SISTEM.find((a) => a.roleId === 'qa_manager')!;
    const customUser: AkunPengguna = {
      ...baseUser,
      aksesKustom: true,
      aksesPenuhOverride: false,
      modulDiizinkan: ['finance-akuntansi', 'overview', 'finance-akuntansi', 'modul-palsu' as never]
    };

    const akses = hitungAksesEfektif(customUser, ROLE_BAWAAN_SISTEM);
    expect(akses.aksesPenuh).toBe(false);
    expect(akses.sumber).toBe('kustom-user');
    expect(akses.modulDiizinkan).toEqual(['overview', 'finance-akuntansi']);
    expect(bolehAksesModul('qa-mutu', akses)).toBe(false);
    expect(bolehAksesModul('finance-akuntansi', akses)).toBe(true);
  });

  it('override aksesPenuhOverride=true memberi akses penuh kepada user meskipun rolenya terbatas', () => {
    const baseUser = AKUN_BAWAAN_SISTEM.find((a) => a.roleId === 'sales_manager')!;
    const promotedUser: AkunPengguna = {
      ...baseUser,
      aksesKustom: true,
      aksesPenuhOverride: true,
      modulDiizinkan: ['sales-marketing']
    };

    const akses = hitungAksesEfektif(promotedUser, ROLE_BAWAAN_SISTEM);
    expect(akses.aksesPenuh).toBe(true);
    expect(akses.sumber).toBe('akses-penuh');
    expect(akses.modulDiizinkan).toEqual(SEMUA_ID_MODUL);
    expect(bolehAksesModul('it-traceability', akses)).toBe(true);
  });

  it('role kustom baru dapat disematkan ke akun baru dengan checklist modul pilihan', () => {
    const roleKustom: RoleSistem = {
      id: 'staf_pajak_khusus',
      nama: 'Staf Pajak Khusus',
      deskripsi: 'Akses hanya finance dan overview',
      basisPeran: 'purchasing',
      aksesPenuh: false,
      modulDiizinkan: ['overview', 'finance-akuntansi'],
      bawaanSistem: false,
      diperbaruiPada: '2026-11-12T00:00:00.000Z'
    };

    const akunBaru: AkunPengguna = {
      id: 'USR-CUSTOM',
      namaLengkap: 'Rina Wijaya',
      username: 'rina.pajak',
      email: 'rina@ams.co.id',
      kataSandi: 'rahasia',
      roleId: 'staf_pajak_khusus',
      status: 'Aktif',
      aksesKustom: false,
      dibuatPada: '2026-11-12T00:00:00.000Z'
    };

    const akses = hitungAksesEfektif(akunBaru, [...ROLE_BAWAAN_SISTEM, roleKustom]);
    expect(akses.aksesPenuh).toBe(false);
    expect(akses.role?.nama).toBe('Staf Pajak Khusus');
    expect(bolehAksesModul('finance-akuntansi', akses)).toBe(true);
    expect(bolehAksesModul('purchasing-procurement', akses)).toBe(false);
  });

  it('fallback ketika akun null memakai fallbackRoleId dan jatuh ke overview bila role tidak dikenal', () => {
    const aksesFallback = hitungAksesEfektif(null, ROLE_BAWAAN_SISTEM, 'kepala_gudang');
    expect(aksesFallback.aksesPenuh).toBe(false);
    expect(bolehAksesModul('gudang-logistik', aksesFallback)).toBe(true);

    const aksesTidakDikenal = hitungAksesEfektif(null, [], 'role_asing' as never);
    expect(aksesTidakDikenal.aksesPenuh).toBe(false);
    expect(aksesTidakDikenal.modulDiizinkan).toEqual(['overview']);
  });
});

describe('hitungAdminAksesPenuhAktif & buatSlugRole — pengaman anti-lockout & slug role', () => {
  it('hanya menghitung akun berstatus Aktif yang memiliki akses penuh (role atau override)', () => {
    const daftarAkun: AkunPengguna[] = [
      { ...AKUN_BAWAAN_SISTEM[0], status: 'Aktif' }, // pjt -> aksesPenuh
      { ...AKUN_BAWAAN_SISTEM[1], status: 'Nonaktif' }, // it_admin tapi nonaktif -> tidak dihitung
      {
        ...AKUN_BAWAAN_SISTEM[2],
        status: 'Aktif',
        aksesKustom: true,
        aksesPenuhOverride: true
      } // qa_manager + override penuh -> dihitung
    ];

    expect(hitungAdminAksesPenuhAktif(daftarAkun, ROLE_BAWAAN_SISTEM)).toBe(2);
  });

  it('menghasilkan slug unik dan bersih untuk nama role baru', () => {
    expect(buatSlugRole('Supervisor Gudang & Cold Chain', ['supervisor_gudang'])).toBe(
      'supervisor_gudang_cold_chain'
    );
    expect(buatSlugRole('QA Manager', ['qa_manager', 'qa_manager_2'])).toBe('qa_manager_3');
    expect(buatSlugRole('   !!!   ', [])).toBe('custom_role');
  });
});
