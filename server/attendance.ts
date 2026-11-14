import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { Router, type Request, type Response, type RequestHandler } from 'express';
import type { LogAbsensi } from '../src/types/index';
import { evaluasiKeterlambatan, hitungJarakKm, verifikasiGeofence } from '../src/utils/hris';
import type { ServerDataSyncStore } from './dataSyncStore';

export interface GeoLokasi {
  id: string;
  nama: string;
  lat: number;
  lon: number;
  radiusMeter: number;
}

/** Master pagar geofence MVP (server-side). Nantinya dipindah ke tabel geo_lokasi. */
export const GEO_LOKASI_DEFAULT: GeoLokasi[] = [
  { id: 'LOC-PUSAT', nama: 'Kantor Pusat', lat: -6.2964, lon: 106.8164, radiusMeter: 150 }
];

export const AKURASI_MAKS_METER = 50;
const FOTO_MAKS_BYTE = 5 * 1024 * 1024;
const KUNCI_ABSENSI = 'hris_absensi';

export interface PayloadClock {
  lat: number;
  lon: number;
  akurasiMeter?: number;
  deviceId?: string;
  foto?: string | null;
  idempotencyKey?: string;
  mockLocation?: boolean;
}

export function parsePayloadClock(body: unknown): { ok: true; payload: PayloadClock } | { ok: false; pesan: string } {
  if (!body || typeof body !== 'object') return { ok: false, pesan: 'Body tidak valid.' };
  const b = body as Record<string, unknown>;
  const lat = Number(b.lat);
  const lon = Number(b.lon);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) return { ok: false, pesan: 'lat tidak valid.' };
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) return { ok: false, pesan: 'lon tidak valid.' };
  let akurasiMeter: number | undefined;
  if (b.akurasiMeter !== undefined) {
    akurasiMeter = Number(b.akurasiMeter);
    if (!Number.isFinite(akurasiMeter) || akurasiMeter < 0) return { ok: false, pesan: 'akurasiMeter tidak valid.' };
  }
  if (b.foto !== undefined && b.foto !== null && typeof b.foto !== 'string') {
    return { ok: false, pesan: 'foto harus string data URL base64.' };
  }
  if (b.deviceId !== undefined && typeof b.deviceId !== 'string') return { ok: false, pesan: 'deviceId tidak valid.' };
  if (b.idempotencyKey !== undefined && typeof b.idempotencyKey !== 'string') return { ok: false, pesan: 'idempotencyKey tidak valid.' };
  if (b.mockLocation !== undefined && typeof b.mockLocation !== 'boolean') return { ok: false, pesan: 'mockLocation tidak valid.' };
  return {
    ok: true,
    payload: {
      lat,
      lon,
      akurasiMeter,
      deviceId: b.deviceId as string | undefined,
      foto: (b.foto as string | null | undefined) ?? null,
      idempotencyKey: b.idempotencyKey as string | undefined,
      mockLocation: b.mockLocation as boolean | undefined
    }
  };
}

export interface HasilGeofence {
  lokasi: GeoLokasi;
  jarakMeter: number;
  dalamPagar: boolean;
  label: string;
}

export function pilihGeofence(payload: Pick<PayloadClock, 'lat' | 'lon'>, lokasi: GeoLokasi[] = GEO_LOKASI_DEFAULT): HasilGeofence {
  let terdekat = lokasi[0];
  let jarakTerdekat = Infinity;
  for (const l of lokasi) {
    const jarak = hitungJarakKm(payload.lat, payload.lon, l.lat, l.lon) * 1000;
    if (jarak < jarakTerdekat) {
      jarakTerdekat = jarak;
      terdekat = l;
    }
  }
  const jarakKm = jarakTerdekat / 1000;
  const v = verifikasiGeofence(jarakKm, terdekat.radiusMeter);
  return { lokasi: terdekat, jarakMeter: jarakTerdekat, dalamPagar: v.dalamPagar, label: v.label };
}

export function statusKehadiran(jam: string): 'Hadir' | 'Terlambat' {
  return evaluasiKeterlambatan(jam).menitTerlambat > 0 ? 'Terlambat' : 'Hadir';
}

export function jamServer(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function tanggalServer(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function simpanFoto(dataUrl: string, photoDir: string): { url: string; hash: string } {
  const m = /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) throw new Error('Format foto harus data URL image base64 (jpeg/png/webp).');
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length === 0 || buf.length > FOTO_MAKS_BYTE) throw new Error('Ukuran foto kosong atau melebihi batas.');
  const hash = crypto.createHash('sha256').update(buf).digest('hex');
  const ext = m[1] === 'png' ? 'png' : m[1] === 'webp' ? 'webp' : 'jpg';
  fs.mkdirSync(photoDir, { recursive: true });
  const file = path.join(photoDir, `${hash}.${ext}`);
  if (!fs.existsSync(file)) fs.writeFileSync(file, buf);
  return { url: `/api/attendance/photo/${hash}.${ext}`, hash };
}

export interface AttendanceDeps {
  syncStore: ServerDataSyncStore;
  requireAuth: RequestHandler;
  broadcastSyncUpdate: (
    key: string,
    entry: { value: unknown; version: number; updatedAt: string; updatedBy: string },
    revision: number,
    sourceClientId?: string
  ) => void;
  photoDir: string;
  lokasi?: GeoLokasi[];
}

export function createAttendanceRouter(deps: AttendanceDeps): Router {
  const r = Router();
  const lokasi = deps.lokasi ?? GEO_LOKASI_DEFAULT;

  const bacaAbsensi = (): LogAbsensi[] => {
    const entry = deps.syncStore.getAllState().entries[KUNCI_ABSENSI];
    return Array.isArray(entry?.value) ? (entry.value as LogAbsensi[]) : [];
  };
  const tulis = (arr: LogAbsensi[], actor: string): number => {
    const synced = deps.syncStore.setKey(KUNCI_ABSENSI, arr, actor);
    deps.broadcastSyncUpdate(KUNCI_ABSENSI, synced.entry, synced.revision);
    return synced.revision;
  };
  const milik = (rec: LogAbsensi, username: string) => rec.karyawanId === username;

  const validasiUmum = (req: Request, res: Response): PayloadClock | null => {
    const parsed = parsePayloadClock(req.body);
    if (!parsed.ok) {
      res.status(400).json({ pesan: parsed.pesan });
      return null;
    }
    const p = parsed.payload;
    if (p.mockLocation) {
      res.status(400).json({ pesan: 'Lokasi tiruan (mock GPS) ditolak.' });
      return null;
    }
    if (p.akurasiMeter !== undefined && p.akurasiMeter > AKURASI_MAKS_METER) {
      res.status(400).json({ pesan: `Akurasi GPS ${p.akurasiMeter} m di atas ambang ${AKURASI_MAKS_METER} m.` });
      return null;
    }
    return p;
  };

  r.get('/geo/locations', deps.requireAuth, (_req, res) => {
    res.json({ lokasi, akurasiMaksMeter: AKURASI_MAKS_METER });
  });

  r.post('/attendance/clock-in', deps.requireAuth, (req, res) => {
    const user = req.auth!.user;
    const p = validasiUmum(req, res);
    if (!p) return;
    const geo = pilihGeofence(p, lokasi);
    if (!geo.dalamPagar) {
      res.status(400).json({ pesan: geo.label, geofence: geo });
      return;
    }
    const now = new Date();
    const tanggal = tanggalServer(now);
    const jam = jamServer(now);
    const arr = bacaAbsensi();
    const hariIni = arr.filter((rec) => milik(rec, user.username) && rec.tanggal === tanggal);
    if (p.idempotencyKey) {
      const dup = hariIni.find((rec) => rec.idempotencyKey === p.idempotencyKey);
      if (dup) {
        res.json({ record: dup, sudahAda: true, revision: deps.syncStore.getRevision() });
        return;
      }
    }
    if (hariIni.length > 0) {
      res.status(409).json({ pesan: 'Sudah ada absensi hari ini; gunakan clock-out.' });
      return;
    }
    let fotoMasukUrl: string | undefined;
    let fotoMasukHash: string | undefined;
    let flagAntiSpoof: string | undefined;
    if (p.foto) {
      try {
        const f = simpanFoto(p.foto, deps.photoDir);
        fotoMasukUrl = f.url;
        fotoMasukHash = f.hash;
      } catch (e) {
        res.status(400).json({ pesan: (e as Error).message });
        return;
      }
    } else {
      flagAntiSpoof = 'tanpa-foto';
    }
    const record: LogAbsensi = {
      id: `ABS-${crypto.randomUUID()}`,
      karyawanId: user.username,
      nama: user.fullName,
      tanggal,
      jamMasuk: jam,
      jamKeluar: '',
      sumber: 'Geofencing GPS (Mobile)',
      status: statusKehadiran(jam),
      lokasi: geo.lokasi.nama,
      koordinat: { lat: p.lat, lon: p.lon },
      akurasiMeter: p.akurasiMeter,
      geofence: {
        lokasiId: geo.lokasi.id,
        radiusMeter: geo.lokasi.radiusMeter,
        jarakMeter: Math.round(geo.jarakMeter),
        dalamPagar: geo.dalamPagar
      },
      fotoMasukUrl,
      fotoMasukHash,
      deviceId: p.deviceId,
      waktuServer: now.toISOString(),
      flagAntiSpoof,
      idempotencyKey: p.idempotencyKey
    };
    const revision = tulis([...arr, record], user.username);
    res.status(201).json({ record, geofence: geo, revision });
  });

  r.post('/attendance/clock-out', deps.requireAuth, (req, res) => {
    const user = req.auth!.user;
    const p = validasiUmum(req, res);
    if (!p) return;
    const geo = pilihGeofence(p, lokasi);
    if (!geo.dalamPagar) {
      res.status(400).json({ pesan: geo.label, geofence: geo });
      return;
    }
    const now = new Date();
    const tanggal = tanggalServer(now);
    const arr = bacaAbsensi();
    const idx = arr.findIndex((rec) => milik(rec, user.username) && rec.tanggal === tanggal && rec.jamMasuk && !rec.jamKeluar);
    if (idx < 0) {
      res.status(409).json({ pesan: 'Tidak ada clock-in terbuka hari ini.' });
      return;
    }
    const rec = { ...arr[idx] };
    rec.jamKeluar = jamServer(now);
    if (p.foto) {
      try {
        const f = simpanFoto(p.foto, deps.photoDir);
        rec.fotoKeluarUrl = f.url;
        rec.fotoKeluarHash = f.hash;
      } catch (e) {
        res.status(400).json({ pesan: (e as Error).message });
        return;
      }
    }
    const berikutnya = [...arr];
    berikutnya[idx] = rec;
    const revision = tulis(berikutnya, user.username);
    res.json({ record: rec, geofence: geo, revision });
  });

  r.get('/attendance/today', deps.requireAuth, (req, res) => {
    const user = req.auth!.user;
    const tanggal = tanggalServer(new Date());
    const record = bacaAbsensi().find((rec) => milik(rec, user.username) && rec.tanggal === tanggal) ?? null;
    res.json({ record });
  });

  r.get('/attendance/history', deps.requireAuth, (req, res) => {
    const user = req.auth!.user;
    const records = bacaAbsensi()
      .filter((rec) => milik(rec, user.username))
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
      .slice(0, 60);
    res.json({ records });
  });

  r.get('/attendance/photo/:berkas', deps.requireAuth, (req, res) => {
    const berkas = String(req.params.berkas);
    if (!/^[a-f0-9]{64}\.(jpg|png|webp)$/.test(berkas)) {
      res.status(400).json({ pesan: 'Nama berkas foto tidak valid.' });
      return;
    }
    const file = path.join(deps.photoDir, berkas);
    if (!fs.existsSync(file)) {
      res.status(404).json({ pesan: 'Foto tidak ditemukan.' });
      return;
    }
    res.sendFile(file);
  });

  return r;
}