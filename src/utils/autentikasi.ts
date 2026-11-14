import type {
  PermissionAction,
  RbacResourceId,
  RoleDefinition,
  RolePermissionMatrix,
  ServerUserPublic,
  UserRole
} from '../types';

const KUNCI_SESI = 'ams_alkes_sesi_login_v2';
const KUNCI_SESI_LAMA = 'ams_alkes_sesi_login';

export const EVENT_SESI_BERAKHIR = 'ams:auth-expired';

export interface SesiLogin {
  userId: string;
  namaPengguna: string;
  namaLengkap: string;
  email: string;
  departemen: string;
  peran: UserRole;
  namaPeran: string;
  permissions: RolePermissionMatrix;
  isHiddenDeveloper?: boolean;
  masukPada: string;
  expiresAt: string;
  token?: string;
}

interface AuthResponsePayload {
  user: ServerUserPublic;
  role: RoleDefinition;
  permissions: RolePermissionMatrix;
  token?: string;
  expiresAt: string;
  pesan?: string;
}

function petakanPayloadKeSesi(payload: AuthResponsePayload, tokenSebelumnya?: string): SesiLogin {
  return {
    userId: payload.user.id,
    namaPengguna: payload.user.username,
    namaLengkap: payload.user.fullName,
    email: payload.user.email,
    departemen: payload.user.department,
    peran: payload.user.roleId as UserRole,
    namaPeran: payload.role?.name || payload.user.roleName || payload.user.roleId,
    permissions: payload.permissions || payload.role?.permissions || {},
    isHiddenDeveloper: Boolean(payload.user.isHiddenDeveloper),
    masukPada: new Date().toISOString(),
    expiresAt: payload.expiresAt,
    token: payload.token || tokenSebelumnya
  };
}

export function simpanSesi(sesi: SesiLogin): void {
  try {
    localStorage.removeItem(KUNCI_SESI_LAMA);
    localStorage.setItem(KUNCI_SESI, JSON.stringify(sesi));
  } catch {
    /* abaikan bila penyimpanan lokal penuh */
  }
}

export function bacaSesi(): SesiLogin | null {
  try {
    const mentah = localStorage.getItem(KUNCI_SESI);
    if (!mentah) return null;
    const sesi = JSON.parse(mentah) as SesiLogin;
    if (!sesi || !sesi.namaPengguna || !sesi.peran || !sesi.token) return null;
    if (sesi.expiresAt && new Date(sesi.expiresAt).getTime() <= Date.now()) {
      localStorage.removeItem(KUNCI_SESI);
      return null;
    }
    return sesi;
  } catch {
    return null;
  }
}

export function akhiriSesi(): void {
  try {
    localStorage.removeItem(KUNCI_SESI);
    localStorage.removeItem(KUNCI_SESI_LAMA);
  } catch {
    /* abaikan */
  }
}

export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const sesi = bacaSesi();
  const headers = new Headers(init.headers);
  if (sesi?.token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${sesi.token}`);
  }
  const response = await fetch(input, {
    ...init,
    credentials: 'include',
    headers
  });
  if (response.status === 401 && typeof window !== 'undefined') {
    akhiriSesi();
    window.dispatchEvent(new CustomEvent(EVENT_SESI_BERAKHIR));
  }
  return response;
}

export interface StatusSetupServer {
  needsSetup: boolean;
  requiresSetupToken: boolean;
}

export async function ambilStatusSetupServer(): Promise<StatusSetupServer> {
  try {
    const res = await fetch('/api/auth/setup-status', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store'
    });
    if (!res.ok) {
      return { needsSetup: false, requiresSetupToken: false };
    }
    const data = (await res.json()) as Partial<StatusSetupServer>;
    return {
      needsSetup: Boolean(data.needsSetup),
      requiresSetupToken: Boolean(data.requiresSetupToken)
    };
  } catch {
    return { needsSetup: false, requiresSetupToken: false };
  }
}

export async function buatAkunDeveloperAwalServer(payload: {
  username: string;
  password: string;
  fullName: string;
  email?: string;
  setupToken?: string;
}): Promise<{ ok: true; sesi: SesiLogin } | { ok: false; pesan: string }> {
  try {
    const res = await fetch('/api/auth/setup', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: payload.username.trim(),
        password: payload.password,
        fullName: payload.fullName.trim(),
        email: payload.email?.trim() || undefined,
        setupToken: payload.setupToken?.trim() || undefined
      })
    });
    const data = (await res.json().catch(() => ({}))) as Partial<AuthResponsePayload> & { pesan?: string };
    if (!res.ok || !data.user || !data.role) {
      return {
        ok: false,
        pesan: data.pesan || 'Gagal membuat akun developer awal.'
      };
    }
    const sesi = petakanPayloadKeSesi(data as AuthResponsePayload);
    simpanSesi(sesi);
    return { ok: true, sesi };
  } catch {
    return {
      ok: false,
      pesan: 'Tidak dapat terhubung ke server untuk Setup Wizard awal.'
    };
  }
}

export async function masukDenganServer(
  namaPengguna: string,
  kataSandi: string
): Promise<{ ok: true; sesi: SesiLogin } | { ok: false; pesan: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: namaPengguna.trim(),
        password: kataSandi
      })
    });
    const data = (await res.json()) as Partial<AuthResponsePayload> & { pesan?: string };
    if (!res.ok || !data.user || !data.role) {
      return {
        ok: false,
        pesan: data.pesan || 'Nama pengguna atau kata sandi salah.'
      };
    }
    const sesi = petakanPayloadKeSesi(data as AuthResponsePayload);
    simpanSesi(sesi);
    return { ok: true, sesi };
  } catch {
    return {
      ok: false,
      pesan: 'Tidak dapat terhubung ke server autentikasi. Periksa koneksi server.'
    };
  }
}

/** Verifikasi sesi aktif terhadap server (/api/auth/me) dan perbarui izin RBAC terbaru. */
export async function ambilSesiServer(): Promise<SesiLogin | null> {
  const lokal = bacaSesi();
  try {
    const headers = new Headers();
    if (lokal?.token) {
      headers.set('Authorization', `Bearer ${lokal.token}`);
    }
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include',
      headers
    });
    if (!res.ok) {
      akhiriSesi();
      return null;
    }
    const data = (await res.json()) as AuthResponsePayload;
    if (!data.user || !data.role) {
      akhiriSesi();
      return null;
    }
    const segar = petakanPayloadKeSesi(data, lokal?.token);
    simpanSesi(segar);
    return segar;
  } catch {
    return lokal;
  }
}

export async function keluarDariServer(): Promise<void> {
  const lokal = bacaSesi();
  try {
    const headers = new Headers();
    if (lokal?.token) {
      headers.set('Authorization', `Bearer ${lokal.token}`);
    }
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers
    });
  } catch {
    /* tetap bersihkan sesi lokal walau jaringan gagal */
  } finally {
    akhiriSesi();
  }
}

export async function gantiKataSandiServer(
  currentPassword: string,
  newPassword: string
): Promise<{ ok: boolean; pesan: string }> {
  const res = await authFetch('/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword })
  });
  const data = (await res.json().catch(() => ({}))) as { pesan?: string };
  return {
    ok: res.ok,
    pesan: data.pesan || (res.ok ? 'Kata sandi berhasil diperbarui.' : 'Gagal memperbarui kata sandi.')
  };
}

export function punyaIzin(
  sesi: Pick<SesiLogin, 'permissions'> | null | undefined,
  resource: RbacResourceId,
  action: PermissionAction
): boolean {
  if (!sesi?.permissions) return false;
  const daftar = sesi.permissions[resource];
  return Array.isArray(daftar) && daftar.includes(action);
}

export function bolehAksesModul(
  sesi: Pick<SesiLogin, 'permissions'> | null | undefined,
  resource: RbacResourceId
): boolean {
  return punyaIzin(sesi, resource, 'view');
}
