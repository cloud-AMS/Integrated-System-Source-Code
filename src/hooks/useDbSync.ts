import { useEffect, useRef, useState } from 'react';
import { db } from '../services/pocketbase';

/**
 * Hook ringan untuk melanggan perubahan 1 atau banyak koleksi di `db` secara real-time
 * (baik perubahan dari modul lain di tab yang sama, tab lain via BroadcastChannel,
 * maupun pembaruan server via WebSocket).
 */
export function useDbTick(daftarKunci: readonly string[]): number {
  const [tick, setTick] = useState(0);
  const kunciKey = daftarKunci.join('|');
  const daftarRef = useRef<readonly string[]>(daftarKunci);
  daftarRef.current = daftarKunci;

  useEffect(() => {
    let aktif = true;
    const daftar = Array.from(new Set([...daftarRef.current, 'all']));
    const lepas = db.subscribeKoleksi(daftar, () => {
      queueMicrotask(() => {
        if (aktif) {
          setTick((t) => t + 1);
        }
      });
    });
    return () => {
      aktif = false;
      lepas();
    };
  }, [kunciKey]);

  return tick;
}

/**
 * Membaca nilai snapshot dari `db` dan memperbaruinya secara otomatis setiap kali
 * salah satu koleksi ketergantungan berubah.
 */
export function useDbSnapshot<T>(daftarKunci: readonly string[], pembaca: () => T): T {
  const tick = useDbTick(daftarKunci);
  const pembacaRef = useRef(pembaca);
  pembacaRef.current = pembaca;
  const [nilai, setNilai] = useState<T>(() => pembaca());
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!mountedRef.current) return;
    setNilai(pembacaRef.current());
  }, [tick]);

  return nilai;
}
