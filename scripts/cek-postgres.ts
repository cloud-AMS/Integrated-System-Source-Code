import 'dotenv/config';
import { readServerConfig } from '../backend/config';
import { checkDatabase, createDatabasePool } from '../backend/database';

async function main() {
  const pool = createDatabasePool(readServerConfig().database);
  try {
    await checkDatabase(pool);
    const { rows } = await pool.query(`
      SELECT current_database() AS database, current_user AS pengguna,
        current_schema() AS schema, rolsuper, rolcreatedb, rolcreaterole
      FROM pg_roles WHERE rolname = current_user
    `);
    if (rows[0].rolsuper || rows[0].rolcreatedb || rows[0].rolcreaterole) {
      throw new Error('Akun runtime tidak boleh menjadi administrator database.');
    }
    if (rows[0].schema !== 'ams') throw new Error('Schema ams belum disiapkan.');
    console.log(JSON.stringify({ status: 'terhubung', ...rows[0], penyimpananERP: 'belum dimigrasikan' }, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch(() => {
  console.error('Pemeriksaan PostgreSQL gagal; periksa koneksi, hak akses akun runtime, dan schema ams.');
  process.exitCode = 1;
});
