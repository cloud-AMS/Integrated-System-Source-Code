import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import pg from 'pg';
import { readServerConfig } from '../backend/config';

async function main() {
  const config = readServerConfig().database;
  const url = new URL(config.connectionString);
  if (url.hostname !== '127.0.0.1' || url.port !== '5433' || url.pathname !== '/ams_local' || url.username !== 'ams_app') {
    throw new Error('Pengujian ini hanya untuk instance lokal terisolasi hasil db:local:init.');
  }
  const credentials = JSON.parse(fs.readFileSync(new URL('../data/postgres/credentials.json', import.meta.url), 'utf8'));
  const owner = new pg.Client({ host: '127.0.0.1', port: 5433, database: 'ams_local', user: 'ams_local_admin', password: credentials.adminPassword, connectionTimeoutMillis: 5000 });
  const client = new pg.Client(config);
  const reader = new pg.Client(config);
  const table = `ams.${pg.escapeIdentifier(`setup_probe_${randomUUID().replaceAll('-', '')}`)}`;
  let created = false;
  try {
    await owner.connect();
    await client.connect();
    await reader.connect();
    const role = (await client.query('SELECT rolsuper, rolcreatedb, rolcreaterole FROM pg_roles WHERE rolname = current_user')).rows[0];
    assert.deepEqual(role, { rolsuper: false, rolcreatedb: false, rolcreaterole: false });
    await assert.rejects(client.query(`CREATE TABLE ${table} (id integer)`), { code: '42501' });
    await owner.query(`CREATE TABLE ${table} (id integer PRIMARY KEY, note text NOT NULL)`);
    created = true;
    const value = "uji parameter ' aman";
    await client.query('BEGIN');
    await client.query(`INSERT INTO ${table} (id, note) VALUES ($1, $2)`, [1, value]);
    assert.equal((await reader.query(`SELECT * FROM ${table}`)).rowCount, 0);
    await client.query('COMMIT');
    assert.equal((await reader.query(`SELECT note FROM ${table} WHERE id = $1`, [1])).rows[0].note, value);
    await client.query('BEGIN');
    await client.query(`UPDATE ${table} SET note = $1 WHERE id = $2`, ['dibatalkan', 1]);
    await client.query('ROLLBACK');
    assert.equal((await reader.query(`SELECT note FROM ${table} WHERE id = $1`, [1])).rows[0].note, value);
    await client.query(`DELETE FROM ${table} WHERE id = $1`, [1]);
    assert.equal((await reader.query(`SELECT * FROM ${table}`)).rowCount, 0);
    console.log('Lulus: akun non-admin, DDL ditolak, CRUD berparameter, commit lintas koneksi, rollback, dan penghapusan data uji.');
  } finally {
    await Promise.all([client.end(), reader.end()]);
    try {
      if (created) await owner.query(`DROP TABLE ${table}`);
    } finally {
      await owner.end();
    }
  }
}

main().catch(() => {
  console.error('Uji integrasi PostgreSQL lokal gagal; periksa konfigurasi dan log database.');
  process.exitCode = 1;
});
