import express, { type RequestHandler } from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import {
  AKURASI_MAKS_METER,
  GEO_LOKASI_DEFAULT,
  createAttendanceRouter,
  jamServer,
  parsePayloadClock,
  pilihGeofence,
  simpanFoto,
  statusKehadiran,
  tanggalServer,
  type AttendanceDeps,
  type GeoLokasi
} from '../../server/attendance';
import { ServerDataSyncStore } from '../../server/dataSyncStore';
import type { AuthContext } from '../../server/rbacMiddleware';
import type { ServerSessionRecord } from '../../server/rbacStore';
import type { RoleDefinition, ServerUserPublic } from '../../src/types/index';

const PUSAT = GEO_LOKASI_DEFAULT[0];
const DI_DALAM = { lat: PUSAT.lat, lon: PUSAT.lon };
const DI_LUAR = { lat: -6.2, lon: 106.8 };
const PNG_1x1 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC';

describe('parsePayloadClock', () => {
  it('accepts a minimal valid coordinate and defaults foto to null', () => {
    const r = parsePayloadClock({ lat: -6.2964, lon: 106.8164 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.payload.lat).toBe(-6.2964);
      expect(r.payload.foto).toBeNull();
    }
  });

  it('coerces numeric strings and keeps optional fields', () => {
    const r = parsePayloadClock({
      lat: '-6.2964', lon: '106.8164', akurasiMeter: '12',
      deviceId: 'dev-1', idempotencyKey: 'key-1', mockLocation: false, foto: PNG_1x1
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.payload.lat).toBe(-6.2964);
      expect(r.payload.akurasiMeter).toBe(12);
      expect(r.payload.deviceId).toBe('dev-1');
      expect(r.payload.foto).toBe(PNG_1x1);
    }
  });

  it.each([
    null, undefined, 'bukan-objek', 42,
    { lat: 91, lon: 0 }, { lat: -91, lon: 0 }, { lat: 0, lon: 181 }, { lat: 0, lon: -181 },
    { lat: NaN, lon: 0 }, { lat: 0, lon: Infinity },
    { lat: 0, lon: 0, akurasiMeter: -1 }, { lat: 0, lon: 0, akurasiMeter: 'x' },
    { lat: 0, lon: 0, foto: 123 }, { lat: 0, lon: 0, deviceId: 5 },
    { lat: 0, lon: 0, idempotencyKey: 5 }, { lat: 0, lon: 0, mockLocation: 'ya' }
  ])('rejects invalid body %j', (body) => {
    expect(parsePayloadClock(body).ok).toBe(false);
  });
});

describe('pilihGeofence', () => {
  it('marks the exact center as inside the fence', () => {
    const g = pilihGeofence(DI_DALAM);
    expect(g.dalamPagar).toBe(true);
    expect(g.jarakMeter).toBeLessThan(1);
    expect(g.lokasi.id).toBe(PUSAT.id);
  });

  it('marks a far coordinate as outside the fence', () => {
    const g = pilihGeofence(DI_LUAR);
    expect(g.dalamPagar).toBe(false);
    expect(g.jarakMeter).toBeGreaterThan(PUSAT.radiusMeter);
  });

  it('selects the nearest among multiple locations', () => {
    const lokasi: GeoLokasi[] = [
      { id: 'A', nama: 'A', lat: 0, lon: 0, radiusMeter: 100 },
      { id: 'B', nama: 'B', lat: -6.2964, lon: 106.8164, radiusMeter: 100 }
    ];
    expect(pilihGeofence(DI_DALAM, lokasi).lokasi.id).toBe('B');
    expect(pilihGeofence({ lat: 0, lon: 0 }, lokasi).lokasi.id).toBe('A');
  });
});

describe('statusKehadiran', () => {
  it('treats on-time and early arrival as Hadir', () => {
    expect(statusKehadiran('08:00')).toBe('Hadir');
    expect(statusKehadiran('07:55')).toBe('Hadir');
  });

  it('treats arrival after the nearest shift start as Terlambat', () => {
    expect(statusKehadiran('08:30')).toBe('Terlambat');
  });
});

describe('jamServer / tanggalServer', () => {
  it('formats local time and date with zero padding', () => {
    const d = new Date(2026, 0, 5, 7, 9);
    expect(jamServer(d)).toBe('07:09');
    expect(tanggalServer(d)).toBe('2026-01-05');
  });
});

describe('simpanFoto', () => {
  let dir: string;
  beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ams-foto-')); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it('writes a content-addressed file and returns a served url + hash', () => {
    const r = simpanFoto(PNG_1x1, dir);
    expect(r.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(r.url).toBe(`/api/attendance/photo/${r.hash}.png`);
    expect(fs.existsSync(path.join(dir, `${r.hash}.png`))).toBe(true);
  });

  it('is idempotent for identical bytes', () => {
    const a = simpanFoto(PNG_1x1, dir);
    const b = simpanFoto(PNG_1x1, dir);
    expect(a.hash).toBe(b.hash);
  });

  it.each(['data:text/plain;base64,abc', 'bukan-data-url', 'data:image/png;base64,'])(
    'rejects malformed data url %s', (url) => {
      expect(() => simpanFoto(url, dir)).toThrow();
    });

  it('rejects an oversized photo', () => {
    const besar = `data:image/png;base64,${Buffer.alloc(5 * 1024 * 1024 + 1).toString('base64')}`;
    expect(() => simpanFoto(besar, dir)).toThrow(/batas/);
  });
});

describe('attendance router over HTTP', () => {
  let server: Server;
  let baseUrl: string;
  let root: string;
  let photoDir: string;
  let store: ServerDataSyncStore;
  let broadcast: Mock<AttendanceDeps['broadcastSyncUpdate']>;

  const authMiddleware: RequestHandler = (req, _res, next) => {
    if (req.headers['x-test-user']) {
      const now = new Date().toISOString();
      const user: ServerUserPublic = {
        id: 'U-1', username: 'budi', fullName: 'Budi Santoso', email: 'budi@ams.local',
        roleId: 'hrd', roleName: 'HRD', department: 'HRD', isActive: true, createdAt: now, updatedAt: now
      };
      const role: RoleDefinition = {
        id: 'hrd', name: 'HRD', description: '', isSystem: false, permissions: {}, updatedAt: now
      };
      const session: ServerSessionRecord = {
        id: 'S-1', userId: 'U-1', ip: '127.0.0.1', userAgent: 'test', createdAt: now,
        expiresAt: new Date(Date.now() + 3600_000).toISOString()
      };
      req.auth = { session, user, role } satisfies AuthContext;
    }
    next();
  };
  const requireAuth: RequestHandler = (req, res, next) => {
    if (!req.auth) return res.status(401).json({ error: 'UNAUTHORIZED' });
    next();
  };

  beforeEach(async () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'ams-absensi-'));
    photoDir = path.join(root, 'photos');
    store = new ServerDataSyncStore(root);
    broadcast = vi.fn<AttendanceDeps['broadcastSyncUpdate']>();
    const app = express();
    app.use(express.json({ limit: '10mb' }));
    app.use(authMiddleware);
    app.use('/api', createAttendanceRouter({ syncStore: store, requireAuth, broadcastSyncUpdate: broadcast, photoDir }));
    server = createServer(app);
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', () => { server.off('error', reject); resolve(); });
    });
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
  });

  afterEach(async () => {
    if (server?.listening) {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) => server.close((e) => e ? reject(e) : resolve()));
    }
    fs.rmSync(root, { recursive: true, force: true });
  });

  const req = (endpoint: string, init: RequestInit = {}, auth = true) =>
    fetch(`${baseUrl}${endpoint}`, {
      ...init,
      headers: { 'content-type': 'application/json', ...(auth ? { 'x-test-user': '1' } : {}), ...(init.headers || {}) },
      signal: AbortSignal.timeout(3000)
    });
  const post = (endpoint: string, body: unknown, auth = true) =>
    req(endpoint, { method: 'POST', body: JSON.stringify(body) }, auth);
  const get = (endpoint: string, auth = true) => req(endpoint, {}, auth);

  it('lists geofence locations for an authenticated user', async () => {
    const res = await get('/geo/locations');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.akurasiMaksMeter).toBe(AKURASI_MAKS_METER);
    expect(body.lokasi[0].id).toBe(PUSAT.id);
  });

  it('rejects unauthenticated access with 401', async () => {
    expect((await get('/geo/locations', false)).status).toBe(401);
    expect((await post('/attendance/clock-in', DI_DALAM, false)).status).toBe(401);
  });

  it('clocks in inside the fence without a photo and broadcasts the sync update', async () => {
    const res = await post('/attendance/clock-in', { ...DI_DALAM, deviceId: 'dev-1' });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.record.sumber).toBe('Geofencing GPS (Mobile)');
    expect(body.record.karyawanId).toBe('budi');
    expect(body.record.nama).toBe('Budi Santoso');
    expect(body.record.flagAntiSpoof).toBe('tanpa-foto');
    expect(body.record.geofence.dalamPagar).toBe(true);
    expect(body.record.jamKeluar).toBe('');
    expect(['Hadir', 'Terlambat']).toContain(body.record.status);
    expect(broadcast).toHaveBeenCalledOnce();
    expect(broadcast.mock.calls[0][0]).toBe('hris_absensi');
    expect(store.getAllState().entries.hris_absensi.value).toHaveLength(1);
  });

  it('stores a clock-in photo on disk and returns its url', async () => {
    const res = await post('/attendance/clock-in', { ...DI_DALAM, foto: PNG_1x1 });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.record.fotoMasukUrl).toMatch(/^\/api\/attendance\/photo\/[a-f0-9]{64}\.png$/);
    expect(body.record.fotoMasukHash).toMatch(/^[a-f0-9]{64}$/);
    const foto = await get(body.record.fotoMasukUrl.replace('/api', ''));
    expect(foto.status).toBe(200);
    expect((await foto.arrayBuffer()).byteLength).toBeGreaterThan(0);
  });

  it('rejects a clock-in outside the fence with 400', async () => {
    const res = await post('/attendance/clock-in', DI_LUAR);
    expect(res.status).toBe(400);
    expect((await res.json()).geofence.dalamPagar).toBe(false);
    expect(broadcast).not.toHaveBeenCalled();
  });

  it('rejects mock GPS, poor accuracy, and invalid coordinates with 400', async () => {
    expect((await post('/attendance/clock-in', { ...DI_DALAM, mockLocation: true })).status).toBe(400);
    expect((await post('/attendance/clock-in', { ...DI_DALAM, akurasiMeter: 100 })).status).toBe(400);
    expect((await post('/attendance/clock-in', { lat: 999, lon: 0 })).status).toBe(400);
    expect(broadcast).not.toHaveBeenCalled();
  });

  it('rejects a second clock-in on the same day with 409', async () => {
    expect((await post('/attendance/clock-in', DI_DALAM)).status).toBe(201);
    const res = await post('/attendance/clock-in', DI_DALAM);
    expect(res.status).toBe(409);
  });

  it('returns the existing record for a repeated idempotency key', async () => {
    const pertama = await post('/attendance/clock-in', { ...DI_DALAM, idempotencyKey: 'k-1' });
    expect(pertama.status).toBe(201);
    const ulang = await post('/attendance/clock-in', { ...DI_DALAM, idempotencyKey: 'k-1' });
    expect(ulang.status).toBe(200);
    const body = await ulang.json();
    expect(body.sudahAda).toBe(true);
    expect(store.getAllState().entries.hris_absensi.value).toHaveLength(1);
  });

  it('clocks out an open record and closes it', async () => {
    await post('/attendance/clock-in', DI_DALAM);
    const res = await post('/attendance/clock-out', { ...DI_DALAM, foto: PNG_1x1 });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.record.jamKeluar).not.toBe('');
    expect(body.record.fotoKeluarUrl).toMatch(/^\/api\/attendance\/photo\//);
  });

  it('rejects clock-out when there is no open record with 409', async () => {
    expect((await post('/attendance/clock-out', DI_DALAM)).status).toBe(409);
  });

  it('exposes today and history scoped to the authenticated user', async () => {
    await post('/attendance/clock-in', DI_DALAM);
    const today = await (await get('/attendance/today')).json();
    expect(today.record.karyawanId).toBe('budi');
    const history = await (await get('/attendance/history')).json();
    expect(history.records).toHaveLength(1);
    expect(history.records[0].karyawanId).toBe('budi');
  });

  it('validates the photo filename and returns 404 for a missing file', async () => {
    expect((await get('/attendance/photo/bukan-hash.jpg')).status).toBe(400);
    expect((await get(`/attendance/photo/${'a'.repeat(64)}.png`)).status).toBe(404);
  });
});