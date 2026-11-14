import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = path.join(root, 'data', 'postgres');
const cluster = path.join(directory, 'cluster');
const envFile = path.join(root, '.env');
const secretsFile = path.join(directory, 'credentials.json');
const bin = process.env.POSTGRES_BIN || path.join(directory, 'pgsql', 'bin');
const port = 5433;
const admin = 'ams_local_admin';
const database = 'ams_local';
const username = 'ams_app';

function executable(name: string) {
  return path.join(bin, `${name}${process.platform === 'win32' ? '.exe' : ''}`);
}

function run(name: string, args: string[]) {
  const result = spawnSync(executable(name), args, { stdio: 'inherit', windowsHide: true });
  if (result.error || result.status !== 0) throw new Error(`${name} gagal dijalankan.`);
}

function running() {
  const result = spawnSync(executable('pg_ctl'), ['status', '-D', cluster], { stdio: 'pipe', windowsHide: true });
  if (result.error) throw new Error('pg_ctl tidak tersedia; periksa POSTGRES_BIN.');
  if (result.status !== 0 && result.status !== 3) throw new Error('Status cluster PostgreSQL tidak dapat diperiksa.');
  return result.status === 0;
}

async function ensurePortAvailable() {
  await new Promise<void>((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', () => reject(new Error(`Port ${port} sudah digunakan; layanan lain tidak diubah.`)));
    probe.listen(port, '127.0.0.1', () => probe.close(() => resolve()));
  });
}

async function start() {
  if (!fs.existsSync(path.join(cluster, 'PG_VERSION'))) throw new Error('Cluster belum tersedia; jalankan npm run db:local:init.');
  if (running()) {
    console.log(`PostgreSQL lokal sudah aktif di 127.0.0.1:${port}.`);
    return;
  }
  await ensurePortAvailable();
  run('pg_ctl', [
    'start', '-w', '-t', '30', '-D', cluster, '-l', path.join(directory, 'postgresql.log'),
    '-o', `-h 127.0.0.1 -p ${port} -c password_encryption=scram-sha-256 -c timezone=UTC`
  ]);
}

async function initialize() {
  if (!fs.existsSync(executable('initdb'))) throw new Error('Binary PostgreSQL belum tersedia; ekstrak paket resmi ke data/postgres/pgsql atau tetapkan POSTGRES_BIN.');
  if (fs.existsSync(envFile) && !fs.existsSync(secretsFile)) throw new Error('.env sudah ada; konfigurasi existing tidak ditimpa.');
  if (fs.existsSync(cluster) && !fs.existsSync(secretsFile)) throw new Error('Direktori cluster sudah ada dan bukan milik setup ini; tidak diubah.');
  fs.mkdirSync(directory, { recursive: true });
  if (!fs.existsSync(secretsFile)) {
    await ensurePortAvailable();
    fs.writeFileSync(secretsFile, JSON.stringify({
      adminPassword: randomBytes(32).toString('hex'),
      appPassword: randomBytes(32).toString('hex')
    }), { flag: 'wx', mode: 0o600 });
  }
  const credentials = JSON.parse(fs.readFileSync(secretsFile, 'utf8'));
  if (![credentials.adminPassword, credentials.appPassword].every((value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value))) {
    throw new Error('Format kredensial lokal tidak valid.');
  }
  const connectionString = `postgresql://${username}:${credentials.appPassword}@127.0.0.1:${port}/${database}`;
  if (fs.existsSync(envFile) && dotenv.parse(fs.readFileSync(envFile)).DATABASE_URL !== connectionString) {
    throw new Error('DATABASE_URL existing berbeda; .env tidak diubah.');
  }
  if (!fs.existsSync(path.join(cluster, 'PG_VERSION'))) {
    const passwordFile = path.join(directory, 'init-password');
    fs.writeFileSync(passwordFile, credentials.adminPassword, { flag: 'wx', mode: 0o600 });
    try {
      run('initdb', ['-D', cluster, '-U', admin, '--encoding=UTF8', '--locale=C', '--auth-host=scram-sha-256', '--auth-local=scram-sha-256', `--pwfile=${passwordFile}`]);
    } finally {
      fs.unlinkSync(passwordFile);
    }
  }
  await start();
  const options = { host: '127.0.0.1', port, user: admin, password: credentials.adminPassword, connectionTimeoutMillis: 5000 };
  const owner = new pg.Client({ ...options, database: 'postgres' });
  try {
    await owner.connect();
    if (!(await owner.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [username])).rowCount) {
      await owner.query(`CREATE ROLE ams_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD ${pg.escapeLiteral(credentials.appPassword)}`);
    }
    if (!(await owner.query('SELECT 1 FROM pg_database WHERE datname = $1', [database])).rowCount) {
      await owner.query('CREATE DATABASE ams_local OWNER ams_local_admin');
    }
  } finally {
    await owner.end();
  }
  const schemaOwner = new pg.Client({ ...options, database });
  try {
    await schemaOwner.connect();
    await schemaOwner.query(`
      BEGIN;
      REVOKE ALL ON DATABASE ams_local FROM PUBLIC;
      GRANT CONNECT ON DATABASE ams_local TO ams_app;
      REVOKE ALL ON SCHEMA public FROM PUBLIC;
      CREATE SCHEMA IF NOT EXISTS ams AUTHORIZATION ams_local_admin;
      GRANT USAGE ON SCHEMA ams TO ams_app;
      ALTER DEFAULT PRIVILEGES FOR ROLE ams_local_admin IN SCHEMA ams
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ams_app;
      ALTER DEFAULT PRIVILEGES FOR ROLE ams_local_admin IN SCHEMA ams
        GRANT USAGE, SELECT ON SEQUENCES TO ams_app;
      ALTER ROLE ams_app IN DATABASE ams_local SET search_path = ams, public;
      COMMIT;
    `);
  } finally {
    await schemaOwner.end();
  }
  const app = new pg.Client({ host: '127.0.0.1', port, database, user: username, password: credentials.appPassword, connectionTimeoutMillis: 5000 });
  try {
    await app.connect();
    await app.query('SELECT 1');
  } finally {
    await app.end();
  }
  if (!fs.existsSync(envFile)) {
    fs.writeFileSync(envFile, [
      'NODE_ENV=development', 'HOST=127.0.0.1', 'PORT=3002', 'APP_URL=http://localhost:3002',
      `DATABASE_URL=${connectionString}`, 'DATABASE_SSL=disable', 'DATABASE_POOL_MAX=10',
      'DATABASE_TIMEOUT_MS=5000', 'AMS_ADMIN_TOKEN=', ''
    ].join('\n'), { flag: 'wx', mode: 0o600 });
  }
  console.log('Database ams_local dan schema ams siap; akun aplikasi non-superuser, tanpa tabel bisnis atau seed.');
  console.log('Kredensial disimpan lokal di .env dan data/postgres/credentials.json, bukan ditampilkan.');
}

async function main() {
  const action = process.argv[2];
  if (action === 'init') return initialize();
  if (action === 'start') return start();
  if (action === 'status') {
    run('pg_ctl', ['status', '-D', cluster]);
    return;
  }
  if (action === 'stop') {
    run('pg_ctl', ['stop', '-w', '-t', '30', '-m', 'fast', '-D', cluster]);
    return;
  }
  throw new Error('Gunakan init, start, status, atau stop.');
}

main().catch(() => {
  console.error('Setup PostgreSQL lokal gagal. Periksa binary, port 5433, konfigurasi existing, dan log lokal; tidak ada database yang dihapus.');
  process.exitCode = 1;
});
