import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PayloadClock } from '@ams/core';
import { api } from '../lib/api';

export function useAbsensiHariIni() {
  return useQuery({ queryKey: ['absensi', 'hari-ini'], queryFn: () => api.hariIni() });
}

export function useRiwayatAbsensi() {
  return useQuery({ queryKey: ['absensi', 'riwayat'], queryFn: () => api.riwayat() });
}

export function useGeoLokasi() {
  return useQuery({ queryKey: ['geo', 'lokasi'], queryFn: () => api.geoLokasi(), staleTime: 5 * 60_000 });
}

export function useClock() {
  const qc = useQueryClient();
  const selesai = () => {
    qc.invalidateQueries({ queryKey: ['absensi'] });
  };
  const masuk = useMutation({ mutationFn: (p: PayloadClock) => api.clockIn(p), onSuccess: selesai });
  const keluar = useMutation({ mutationFn: (p: PayloadClock) => api.clockOut(p), onSuccess: selesai });
  return { masuk, keluar };
}