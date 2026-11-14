import express from 'express';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Pool } from 'pg';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHealthRouter } from '../../backend/health';

let server: Server;
let baseUrl: string;
let query: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  query = vi.fn();
  const app = express();
  app.use('/api', createHealthRouter({ query } as unknown as Pick<Pool, 'query'>));
  server = createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
});

afterEach(async () => {
  if (!server?.listening) return;
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

function get(endpoint: string) {
  return fetch(`${baseUrl}${endpoint}`, { signal: AbortSignal.timeout(2000) });
}

describe('health router over HTTP', () => {
  it('reports process liveness without checking or claiming operational PostgreSQL storage', async () => {
    query.mockRejectedValue(new Error('private-password'));
    const before = Date.now();
    const response = await get('/health');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const body = await response.json();
    expect(body).toEqual({
      status: 'aktif',
      sistem: 'AMS Integrated System',
      basisData: 'PostgreSQL (periksa /api/ready)',
      penyimpananOperasional: 'localStorage (belum dimigrasikan)',
      waktuServer: expect.any(String),
    });
    expect(new Date(body.waktuServer).toISOString()).toBe(body.waktuServer);
    expect(Date.parse(body.waktuServer)).toBeGreaterThanOrEqual(before);
    expect(Date.parse(body.waktuServer)).toBeLessThanOrEqual(Date.now());
    expect(query).not.toHaveBeenCalled();
  });

  it('reports database connectivity while preserving the localStorage migration disclaimer', async () => {
    query.mockResolvedValue({ rows: [{ ok: 1 }], rowCount: 1 });
    const response = await get('/ready');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({
      status: 'siap',
      basisData: 'PostgreSQL',
      penyimpananOperasional: 'localStorage (belum dimigrasikan)',
    });
    expect(query).toHaveBeenCalledExactlyOnceWith('SELECT 1 AS ok');
  });

  it.each([
    new Error('postgres://private-user:private-password@private-host/private-database'),
    'postgres://private-user:private-password@private-host/private-database',
    { message: 'private-password', code: 'private-code', host: 'private-host', user: 'private-user', database: 'private-database', query: 'private-query' },
  ])('returns a sanitized 503 for rejected query %#', async (failure) => {
    query.mockRejectedValue(failure);
    const response = await get('/ready');
    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const text = await response.text();
    expect(text).not.toContain('private-');
    expect(JSON.parse(text)).toEqual({
      status: 'belum_siap',
      basisData: 'PostgreSQL',
      pesan: 'Koneksi database tidak tersedia.',
    });
    expect(query).toHaveBeenCalledExactlyOnceWith('SELECT 1 AS ok');
  });

  it.each([undefined, { rows: [] }, { rows: [{ ok: '1', secret: 'private-password' }] }])
    ('returns 503 instead of claiming readiness for invalid result %#', async (result) => {
      query.mockResolvedValue(result);
      const response = await get('/ready');
      expect(response.status).toBe(503);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(await response.json()).toEqual({
        status: 'belum_siap',
        basisData: 'PostgreSQL',
        pesan: 'Koneksi database tidak tersedia.',
      });
    });

  it('queries on every readiness request and recovers without affecting liveness', async () => {
    query.mockRejectedValueOnce(new Error('unavailable')).mockResolvedValueOnce({ rows: [{ ok: 1 }] });
    const unavailable = await get('/ready');
    expect(unavailable.status).toBe(503);
    await unavailable.json();
    const alive = await get('/health');
    expect(alive.status).toBe(200);
    await alive.json();
    expect(query).toHaveBeenCalledTimes(1);
    const recovered = await get('/ready');
    expect(recovered.status).toBe(200);
    await recovered.json();
    expect(query).toHaveBeenCalledTimes(2);
  });
});
