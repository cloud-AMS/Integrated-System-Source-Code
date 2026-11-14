import type { Pool } from 'pg';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readServerConfig } from '../../backend/config';
import { checkDatabase, createDatabasePool } from '../../backend/database';

const { pool, PoolConstructor } = vi.hoisted(() => {
  const pool = { on: vi.fn(), query: vi.fn(), end: vi.fn() };
  const PoolConstructor = vi.fn(function () { return pool; });
  return { pool, PoolConstructor };
});

vi.mock('pg', () => ({ default: { Pool: PoolConstructor } }));

const config = readServerConfig({
  DATABASE_URL: 'postgresql://private-user:private-password@localhost/ams',
  DATABASE_TIMEOUT_MS: '8000',
}).database;

beforeEach(() => {
  vi.clearAllMocks();
  pool.query.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createDatabasePool', () => {
  it('constructs exactly one pool with bounded query timeout and an idle error listener', () => {
    expect(createDatabasePool(config)).toBe(pool);
    expect(PoolConstructor).toHaveBeenCalledExactlyOnceWith({ ...config, query_timeout: 8000 });
    expect(pool.on).toHaveBeenCalledExactlyOnceWith('error', expect.any(Function));
    expect(pool.query).not.toHaveBeenCalled();
    expect(pool.end).not.toHaveBeenCalled();
    expect(config).not.toHaveProperty('query_timeout');
  });

  it.each(['57P01', '08006', 'XX000', 'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'EPIPE'])
    ('logs only sanitized error code %s, not connection details', (code) => {
      const log = vi.spyOn(console, 'error').mockImplementation(() => {});
      createDatabasePool(config);
      const listener = pool.on.mock.calls[0][1];
      const error = Object.assign(new Error('private-password postgres://private-user@private-host/private-db'), {
        code, query: 'SELECT private-secret', connectionString: config.connectionString,
      });
      expect(() => listener(error, { password: 'private-password' })).not.toThrow();
      expect(log).toHaveBeenCalledExactlyOnceWith('PostgreSQL idle client error:', code);
      expect(JSON.stringify(log.mock.calls)).not.toContain('private-');
    });

  it.each([undefined, '', 'private-password', 'ECONNRESET\nprivate-password', 'postgres://user:secret@host/db', 123])
    ('redacts unrecognized or malformed error code %j', (code) => {
      const log = vi.spyOn(console, 'error').mockImplementation(() => {});
      createDatabasePool(config);
      const listener = pool.on.mock.calls[0][1];
      expect(() => listener(Object.assign(new Error('private-secret'), { code }))).not.toThrow();
      expect(log).toHaveBeenCalledExactlyOnceWith('PostgreSQL idle client error:', 'UNKNOWN');
    });
});

describe('checkDatabase', () => {
  const queryPool = pool as unknown as Pick<Pool, 'query'>;

  it('checks connectivity using only SELECT 1 AS ok', async () => {
    pool.query.mockResolvedValue({ rows: [{ ok: 1 }], rowCount: 1 });
    await expect(checkDatabase(queryPool)).resolves.toBeUndefined();
    expect(pool.query).toHaveBeenCalledExactlyOnceWith('SELECT 1 AS ok');
    expect(PoolConstructor).not.toHaveBeenCalled();
    expect(pool.end).not.toHaveBeenCalled();
  });

  it.each([
    undefined, null, {}, { rows: [] }, { rows: [{}] }, { rows: [null] },
    { rows: [{ ok: 0 }] }, { rows: [{ ok: '1' }] }, { rows: [{ ok: 1 }, { ok: 1 }] },
  ])('rejects an invalid connectivity result %j', async (result) => {
    pool.query.mockResolvedValue(result);
    await expect(checkDatabase(queryPool)).rejects.toThrow('Database connectivity check failed.');
    expect(pool.query).toHaveBeenCalledExactlyOnceWith('SELECT 1 AS ok');
  });

  it('propagates connection failure for the caller to handle without logging secrets', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('private-password');
    pool.query.mockRejectedValue(error);
    await expect(checkDatabase(queryPool)).rejects.toBe(error);
    expect(log).not.toHaveBeenCalled();
    expect(pool.end).not.toHaveBeenCalled();
  });
});
