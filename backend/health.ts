import { Router } from 'express';
import type { Pool } from 'pg';
import { checkDatabase } from './database';

export function createHealthRouter(pool: Pick<Pool, 'query'>): Router {
  const router = Router();

  router.get('/health', (_request, response) => {
    response.set('Cache-Control', 'no-store').json({
      status: 'aktif',
      sistem: 'AMS Integrated System',
      basisData: 'PostgreSQL (periksa /api/ready)',
      penyimpananOperasional: 'localStorage (belum dimigrasikan)',
      waktuServer: new Date().toISOString(),
    });
  });

  router.get('/ready', async (_request, response) => {
    response.set('Cache-Control', 'no-store');
    try {
      await checkDatabase(pool);
      response.json({
        status: 'siap',
        basisData: 'PostgreSQL',
        penyimpananOperasional: 'localStorage (belum dimigrasikan)',
      });
    } catch {
      response.status(503).json({
        status: 'belum_siap',
        basisData: 'PostgreSQL',
        pesan: 'Koneksi database tidak tersedia.',
      });
    }
  });

  return router;
}
