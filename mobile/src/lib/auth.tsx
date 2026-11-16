import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { RoleDefinition, RolePermissionMatrix, ServerUserPublic } from '@ams/core';
import { api, ApiError, SESI_KEY, TOKEN_KEY } from './api';
import { ambilItem, hapusItem, simpanItem } from './storage';

export interface SesiTersimpan {
  user: ServerUserPublic;
  role: RoleDefinition;
  permissions: RolePermissionMatrix;
  expiresAt: string;
}

interface AuthState {
  sesi: SesiTersimpan | null;
  memuat: boolean;
  masuk: (username: string, password: string) => Promise<void>;
  keluar: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesi, setSesi] = useState<SesiTersimpan | null>(null);
  const [memuat, setMemuat] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await ambilItem(TOKEN_KEY);
        const cached = await ambilItem(SESI_KEY);
        if (!token || !cached) return;
        setSesi(JSON.parse(cached) as SesiTersimpan);
        try {
          const me = await api.me();
          const segar: SesiTersimpan = {
            user: me.user,
            role: me.role,
            permissions: me.permissions,
            expiresAt: me.expiresAt
          };
          await simpanItem(SESI_KEY, JSON.stringify(segar));
          setSesi(segar);
        } catch (e) {
          if (e instanceof ApiError && e.status === 401) {
            await hapusItem(TOKEN_KEY);
            await hapusItem(SESI_KEY);
            setSesi(null);
          }
        }
      } finally {
        setMemuat(false);
      }
    })();
  }, []);

  const masuk = useCallback(async (username: string, password: string) => {
    const hasil = await api.login(username, password);
    await simpanItem(TOKEN_KEY, hasil.token);
    const s: SesiTersimpan = {
      user: hasil.user,
      role: hasil.role,
      permissions: hasil.permissions,
      expiresAt: hasil.expiresAt
    };
    await simpanItem(SESI_KEY, JSON.stringify(s));
    setSesi(s);
  }, []);

  const keluar = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Sesi mungkin sudah kedaluwarsa; pembersihan lokal tetap dilanjutkan.
    }
    await hapusItem(TOKEN_KEY);
    await hapusItem(SESI_KEY);
    setSesi(null);
  }, []);

  const nilai = useMemo(() => ({ sesi, memuat, masuk, keluar }), [sesi, memuat, masuk, keluar]);
  return <AuthContext.Provider value={nilai}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider.');
  return ctx;
}