import pg, { type Pool } from 'pg';
import type { readServerConfig } from './config';

export function createDatabasePool(config: ReturnType<typeof readServerConfig>['database']): Pool {
  const pool = new pg.Pool({ ...config, query_timeout: config.statement_timeout });
  pool.on('error', (error: Error & { code?: string }) => {
    const code = typeof error.code === 'string' && /^(?:[0-9A-Z]{5}|ECONNRESET|ECONNREFUSED|ETIMEDOUT|EPIPE|ENOTFOUND|EAI_AGAIN|ECONNABORTED|ENETUNREACH|EHOSTUNREACH)$/.test(error.code)
      ? error.code
      : 'UNKNOWN';
    console.error('PostgreSQL idle client error:', code);
  });
  return pool;
}

export async function checkDatabase(pool: Pick<Pool, 'query'>): Promise<void> {
  const result = await pool.query<{ ok: number }>('SELECT 1 AS ok');
  if (result?.rows?.length !== 1 || result.rows[0]?.ok !== 1) {
    throw new Error('Database connectivity check failed.');
  }
}
