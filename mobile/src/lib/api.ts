import type {
  BodyPesan,
  PayloadClock,
  ResponsClock,
  ResponsGeoLokasi,
  ResponsHariIni,
  ResponsRiwayat,
  SesiLogin
} from '@ams/core';
import { API_BASE_URL } from './config';
import { ambilItem } from './storage';

export const TOKEN_KEY = 'ams_session_token';
export const SESI_KEY = 'ams_session_cache';

export class ApiError extends Error {
  constructor(
    public status: number,
    pesan: string,
    public body?: BodyPesan
  ) {
    super(pesan);
    this.name = 'ApiError';
  }
}

interface OpsiRequest {
  method?: string;
  json?: unknown;
}

async function request<T>(path: string, opsi: OpsiRequest = {}): Promise<T> {
  const token = await ambilItem(TOKEN_KEY);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opsi.json !== undefined) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: opsi.method ?? 'GET',
      headers,
      body: opsi.json !== undefined ? JSON.stringify(opsi.json) : undefined
    });
  } catch {
    throw new ApiError(0, 'Tidak dapat menghubungi server. Periksa koneksi dan alamat API.');
  }

  const teks = await res.text();
  let data: unknown = null;
  try {
    data = teks ? JSON.parse(teks) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const body = (data ?? {}) as BodyPesan;
    throw new ApiError(res.status, body.pesan ?? `Server menolak permintaan (HTTP ${res.status}).`, body);
  }
  return data as T;
}

export const api = {
  login: (username: string, password: string) =>
    request<SesiLogin>('/api/auth/login', { method: 'POST', json: { username, password } }),
  me: () => request<Omit<SesiLogin, 'token'>>('/api/auth/me'),
  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
  gantiSandi: (currentPassword: string, newPassword: string) =>
    request<{ ok: boolean; pesan: string }>('/api/auth/change-password', {
      method: 'POST',
      json: { currentPassword, newPassword }
    }),
  geoLokasi: () => request<ResponsGeoLokasi>('/api/geo/locations'),
  clockIn: (payload: PayloadClock) =>
    request<ResponsClock>('/api/attendance/clock-in', { method: 'POST', json: payload }),
  clockOut: (payload: PayloadClock) =>
    request<ResponsClock>('/api/attendance/clock-out', { method: 'POST', json: payload }),
  hariIni: () => request<ResponsHariIni>('/api/attendance/today'),
  riwayat: () => request<ResponsRiwayat>('/api/attendance/history')
};