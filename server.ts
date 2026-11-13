if (typeof (globalThis as any).__dirname !== 'undefined') {
  delete (globalThis as any).__dirname;
}

import http from 'http';
import crypto from 'crypto';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { RBAC_RESOURCES, ServerRbacStore } from './server/rbacStore';
import {
  clearSessionCookie,
  createRbacMiddleware,
  getClientIp,
  setSessionCookie
} from './server/rbacMiddleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BERKAS_SNAPSHOT = path.resolve(__dirname, 'data', 'website-published.json');
const BERKAS_SNAPSHOT_STATIS = path.resolve(__dirname, 'public', 'website-published.json');
const BERKAS_INDEKS = path.resolve(__dirname, 'index.html');
const rbacStore = new ServerRbacStore(path.resolve(__dirname, 'data'));
const { attachAuth, requireAuth, requirePermission } = createRbacMiddleware(rbacStore);

/** Snapshot harus berbentuk KonfigurasiSitus; penolakan melindungi berkas data dari muatan sembarangan. */
function adalahKonfigurasiSitus(nilai: unknown): nilai is Record<string, any> {
  if (!nilai || typeof nilai !== 'object') return false;
  const cfg = nilai as Record<string, any>;
  return Boolean(
    cfg.identitas && typeof cfg.identitas.nama === 'string' && cfg.hero && typeof cfg.hero.judul === 'string'
  );
}

function bacaSnapshot(): Record<string, any> | null {
  try {
    const target = fs.existsSync(BERKAS_SNAPSHOT)
      ? BERKAS_SNAPSHOT
      : fs.existsSync(BERKAS_SNAPSHOT_STATIS)
        ? BERKAS_SNAPSHOT_STATIS
        : null;
    if (!target) return null;
    const isi = JSON.parse(fs.readFileSync(target, 'utf8')) as unknown;
    return adalahKonfigurasiSitus(isi) ? isi : null;
  } catch {
    return null;
  }
}

/** Ganti judul tab, meta description, dan tautan kanonik halaman /web sesuai konten terbit. */
function suntikSeo(html: string, snapshot: Record<string, any> | null): string {
  if (!snapshot) return html;
  const judul = String(snapshot.identitas.judulSitus || snapshot.identitas.nama).replace(/</g, '&lt;');
  const deskripsi = String(snapshot.identitas.metaDeskripsi || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${judul}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${deskripsi}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${judul}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${deskripsi}$2`)
    .replace(
      '</head>',
      `<link rel="canonical" href="${process.env.APP_URL || 'http://localhost:3000'}/web" />\n</head>`
    );
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  // Dev server di AI Studio harus berjalan di port 3000 (PORT=8080 digunakan nginx internal)
  const PORT = process.env.PORT && process.env.PORT !== '8080' ? Number(process.env.PORT) : 3000;

  // PocketBase AMS (C:\pocketbase-ams, port 8091) hanya diekspos seperlunya:
  // GET /api/health, GET /api/realtime (SSE), GET /api/collections/<nama>/records.
  // Admin UI, superuser, pengaturan, dan tulis/hapus sengaja ditolak di sini —
  // aplikasi hanya butuh sinyal realtime + baca koleksi publik.
  const PB_GET_DIIZINKAN = /^\/api\/(health|realtime|collections\/[A-Za-z0-9_-]+\/records)\/?$/;
  app.use('/api/ams-pb', (req, res, next) => {
    if (req.method === 'GET' && PB_GET_DIIZINKAN.test(req.path)) return next();
    return res.status(403).json({ pesan: 'Jalur PocketBase ini tidak diizinkan lewat proxy.' });
  }, createProxyMiddleware({
    target: 'http://127.0.0.1:8091',
    changeOrigin: true,
    pathRewrite: { '^/api/ams-pb': '' }
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(attachAuth);

  // Body-parser menolak JSON rusak/payload terlalu besar sebelum rute manapun —
  // balas 400/413 yang bersih, jangan biarkan error merayap ke atas dan menjatuhkan proses.
  app.use(((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err?.type === 'entity.parse.failed') {
      return res.status(400).json({ pesan: 'Isi permintaan bukan JSON valid.' });
    }
    if (err?.type === 'entity.too.large') {
      return res.status(413).json({ pesan: 'Payload terlalu besar (maks 10 MB).' });
    }
    next(err);
  }) as express.ErrorRequestHandler);

  // Status and regulatory compliance info
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'aktif',
      sistem: 'AMS Integrated System - PT Anugrahmitra Selaras',
      versi: '2.4.0-cdakb',
      standar: ['CDAKB Permenkes 4/2014', 'CPAKB Permenkes 20/2017', 'SDAK OSS-RBA', 'ISO 13485:2016'],
      basisData: 'PocketBase 0.28.1 (Real-time Kanal Terhubung) + Cache Lokal + Server RBAC',
      rbacAktif: true,
      waktuServer: new Date().toISOString()
    });
  });

  // ================= AUTENTIKASI & RBAC SERVER-SIDE =================
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = (req.body || {}) as { username?: string; password?: string };
    if (!username || !password) {
      return res.status(400).json({ error: 'BAD_REQUEST', pesan: 'Nama pengguna dan kata sandi wajib diisi.' });
    }
    const result = rbacStore.authenticate(
      username,
      password,
      getClientIp(req),
      String(req.headers['user-agent'] || '')
    );
    if (!result.ok) {
      return res.status(result.status).json({ error: 'AUTH_FAILED', pesan: result.message });
    }
    setSessionCookie(req, res, result.token);
    res.json({
      user: result.user,
      role: result.role,
      permissions: result.role.permissions,
      token: result.token,
      expiresAt: result.session.expiresAt
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    if (req.auth) {
      rbacStore.revokeSession(req.auth.session.id, req.auth.user.username, req.auth.role.id, getClientIp(req));
    }
    clearSessionCookie(req, res);
    res.json({ ok: true });
  });

  app.get('/api/auth/me', requireAuth, (req, res) => {
    res.set('Cache-Control', 'no-store').json({
      user: req.auth!.user,
      role: req.auth!.role,
      permissions: req.auth!.role.permissions,
      expiresAt: req.auth!.session.expiresAt
    });
  });

  app.post('/api/auth/change-password', requireAuth, (req, res) => {
    const { currentPassword, newPassword } = (req.body || {}) as { currentPassword?: string; newPassword?: string };
    const result = rbacStore.changeOwnPassword(
      req.auth!.user.id,
      String(currentPassword || ''),
      String(newPassword || ''),
      getClientIp(req)
    );
    if (!result.ok) {
      return res.status(result.status).json({ error: 'CHANGE_PASSWORD_FAILED', pesan: result.message });
    }
    res.json({ ok: true, pesan: 'Kata sandi berhasil diperbarui di server.' });
  });

  app.get('/api/rbac/metadata', requirePermission('rbac-admin', 'view'), (_req, res) => {
    res.json({
      resources: RBAC_RESOURCES,
      actions: [
        { id: 'view', label: 'Lihat Modul' },
        { id: 'create', label: 'Tambah' },
        { id: 'update', label: 'Ubah' },
        { id: 'delete', label: 'Hapus' },
        { id: 'approve', label: 'Setujui / Rilis' },
        { id: 'publish', label: 'Terbitkan' },
        { id: 'export', label: 'Ekspor' }
      ]
    });
  });

  app.get('/api/rbac/roles', requirePermission('rbac-admin', 'view'), (_req, res) => {
    res.json({ roles: rbacStore.listRoles() });
  });

  app.post('/api/rbac/roles', requirePermission('rbac-admin', 'create'), (req, res) => {
    const { id, name, description, permissions } = (req.body || {}) as Record<string, any>;
    const result = rbacStore.createRole(
      { id: String(id || ''), name: String(name || ''), description: String(description || ''), permissions: permissions || {} },
      req.auth!.user.username,
      req.auth!.role.id,
      getClientIp(req)
    );
    if (!result.ok) return res.status(result.status).json({ error: 'ROLE_ERROR', pesan: result.message });
    res.status(201).json({ role: result.role });
  });

  app.put('/api/rbac/roles/:roleId', requirePermission('rbac-admin', 'update'), (req, res) => {
    const { name, description, permissions } = (req.body || {}) as Record<string, any>;
    const result = rbacStore.updateRole(
      req.params.roleId,
      { name, description, permissions },
      req.auth!.user.username,
      req.auth!.role.id,
      getClientIp(req)
    );
    if (!result.ok) return res.status(result.status).json({ error: 'ROLE_ERROR', pesan: result.message });
    res.json({ role: result.role });
  });

  app.delete('/api/rbac/roles/:roleId', requirePermission('rbac-admin', 'delete'), (req, res) => {
    const result = rbacStore.deleteRole(
      req.params.roleId,
      req.auth!.user.username,
      req.auth!.role.id,
      getClientIp(req)
    );
    if (!result.ok) return res.status(result.status).json({ error: 'ROLE_ERROR', pesan: result.message });
    res.json({ ok: true });
  });

  app.get('/api/rbac/users', requirePermission('rbac-admin', 'view'), (_req, res) => {
    res.json({ users: rbacStore.listUsers() });
  });

  app.post('/api/rbac/users', requirePermission('rbac-admin', 'create'), (req, res) => {
    const { username, fullName, email, roleId, department, password, isActive } = (req.body || {}) as Record<string, any>;
    const result = rbacStore.createUser(
      {
        username: String(username || ''),
        fullName: String(fullName || ''),
        email: String(email || ''),
        roleId: String(roleId || ''),
        department: String(department || ''),
        password: String(password || ''),
        isActive: isActive !== false
      },
      req.auth!.user.username,
      req.auth!.role.id,
      getClientIp(req)
    );
    if (!result.ok) return res.status(result.status).json({ error: 'USER_ERROR', pesan: result.message });
    res.status(201).json({ user: result.user });
  });

  app.put('/api/rbac/users/:userId', requirePermission('rbac-admin', 'update'), (req, res) => {
    const { fullName, email, roleId, department, isActive, newPassword } = (req.body || {}) as Record<string, any>;
    const result = rbacStore.updateUser(
      req.params.userId,
      { fullName, email, roleId, department, isActive, newPassword },
      req.auth!.user.id,
      req.auth!.user.username,
      req.auth!.role.id,
      getClientIp(req)
    );
    if (!result.ok) return res.status(result.status).json({ error: 'USER_ERROR', pesan: result.message });
    res.json({ user: result.user });
  });

  app.delete('/api/rbac/users/:userId', requirePermission('rbac-admin', 'delete'), (req, res) => {
    const result = rbacStore.deleteUser(
      req.params.userId,
      req.auth!.user.id,
      req.auth!.user.username,
      req.auth!.role.id,
      getClientIp(req)
    );
    if (!result.ok) return res.status(result.status).json({ error: 'USER_ERROR', pesan: result.message });
    res.json({ ok: true });
  });

  app.get('/api/rbac/sessions', requirePermission('rbac-admin', 'view'), (req, res) => {
    res.json({ sessions: rbacStore.listActiveSessions(req.auth?.session.id) });
  });

  app.delete('/api/rbac/sessions/:sessionId', requirePermission('rbac-admin', 'delete'), (req, res) => {
    const ok = rbacStore.revokeSession(
      req.params.sessionId,
      req.auth!.user.username,
      req.auth!.role.id,
      getClientIp(req)
    );
    if (!ok) return res.status(404).json({ error: 'SESSION_ERROR', pesan: 'Sesi tidak ditemukan.' });
    res.json({ ok: true });
  });

  app.get('/api/rbac/audit', requirePermission('audit-trail', 'view'), (_req, res) => {
    res.json({ logs: rbacStore.getAuditLogs(200) });
  });

  // IT & DevOps Deployment Guide & Config for Caddy + NSSM Windows Server
  app.get('/api/system/deployment-guides', requirePermission('it-traceability', 'view'), (req, res) => {
    res.json({
      caddyfile: `# Caddyfile Konfigurasi Reverse Proxy + HTTPS Otomatis
# Lokasi: C:\\caddy\\Caddyfile
alkes.perusahaan-anda.co.id {
    reverse_proxy localhost:3000
    
    # Header keamanan standar medis & privasi data
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    # Penanganan PocketBase websocket & streaming
    handle /api/pocketbase/* {
        reverse_proxy localhost:8090
    }

    log {
        output file C:\\caddy\\logs\\ams_access.log {
            roll_size 20mb
            roll_keep 10
        }
    }
}`,
      nssmCommands: [
        '# 1. Build lebih dulu (hasilkan dist/ untuk aset dan server.js untuk bundel runtime)',
        'cd C:\\inetpub\\ams-alkes',
        'npm ci',
        'npm run build',
        '',
        '# 2. Pasang Node Express Server sebagai Service Windows',
        'nssm install AMS_AppService "C:\\Program Files\\nodejs\\node.exe" "C:\\inetpub\\ams-alkes\\server.js"',
        'nssm set AMS_AppService AppDirectory "C:\\inetpub\\ams-alkes"',
        'nssm set AMS_AppService AppEnvironmentExtra NODE_ENV=production PORT=3000',
        'nssm set AMS_AppService AppStdout "C:\\inetpub\\ams-alkes\\logs\\service_output.log"',
        'nssm set AMS_AppService AppStderr "C:\\inetpub\\ams-alkes\\logs\\service_error.log"',
        'nssm start AMS_AppService',
        '',
        '# 3. Pasang PocketBase Service di Windows Server',
        'nssm install AMS_PocketBase "C:\\pocketbase\\pocketbase.exe" "serve --http=0.0.0.0:8090"',
        'nssm set AMS_PocketBase AppDirectory "C:\\pocketbase"',
        'nssm set AMS_PocketBase AppStdout "C:\\pocketbase\\logs\\pb_output.log"',
        'nssm start AMS_PocketBase',
        '',
        '# 4. Pasang Caddy Web Server sebagai Service',
        'nssm install CaddyWebServer "C:\\caddy\\caddy.exe" "run --config C:\\caddy\\Caddyfile"',
        'nssm start CaddyWebServer'
      ]
    });
  });

  // Kemenkes NIE format verification helper
  app.post('/api/kemenkes/validasi-nie', requireAuth, (req, res) => {
    const { nomorIzinEdar } = req.body;
    if (!nomorIzinEdar || typeof nomorIzinEdar !== 'string') {
      return res.status(400).json({ valid: false, pesan: 'Nomor izin edar harus diisi' });
    }
    const clean = nomorIzinEdar.trim().toUpperCase();
    const regex = /^KEMENKES RI (AKL|AKD) \d{11}$/;
    const valid = regex.test(clean);
    
    const tipe = clean.includes('AKL') ? 'Alkes Luar Negeri (Impor)' : clean.includes('AKD') ? 'Alkes Dalam Negeri (Produksi Lokal)' : 'Format Belum Sesuai';
    
    res.json({
      valid,
      nomor: clean,
      tipeAlkes: tipe,
      formatResmi: 'KEMENKES RI AKL/AKD + 11 digit angka (Contoh: KEMENKES RI AKD 20501910234)',
      keterangan: valid ? 'Format izin edar sesuai standar penomoran Kemenkes RI' : 'Format belum sesuai aturan Kemenkes RI'
    });
  });

  // ================= SITUS PUBLIK (konten diatur dari menu Website di dashboard) =================
  // Snapshot terbit dibaca halaman /web lintas perangkat; hanya konfigurasi valid yang diterima.
  app.get('/api/website/published', (req, res) => {
    const snapshot = bacaSnapshot();
    if (!snapshot) return res.status(404).json({ pesan: 'Belum ada konten situs yang diterbitkan.' });
    res.set('Cache-Control', 'no-store').json({ config: snapshot });
  });

  // Salinan statis untuk hosting tanpa Node (jalur cadangan pada PublicWebsiteApp).
  app.get('/website-published.json', (req, res) => {
    const snapshot = bacaSnapshot();
    if (!snapshot) return res.status(404).json({ pesan: 'Belum ada konten situs yang diterbitkan.' });
    res.set('Cache-Control', 'no-store').json(snapshot);
  });

  // Token publikasi server diset lewat environment (AMS_ADMIN_TOKEN). Tanpa token,
  // publikasi situs dinonaktifkan (fail-closed) — UI menampilkan fallback unduh JSON.
  const AMS_ADMIN_TOKEN = (process.env.AMS_ADMIN_TOKEN || '').trim();
  // Rate limit sederhana per IP untuk rute tulis situs (30 percobaan / 15 menit).
  const putHits = new Map<string, { count: number; reset: number }>();
  const PUT_WINDOW_MS = 15 * 60 * 1000;
  const PUT_MAX_HITS = 30;
  const dapatPosting = (kunci: string): boolean => {
    const now = Date.now();
    const cur = putHits.get(kunci);
    if (!cur || now > cur.reset) {
      putHits.set(kunci, { count: 1, reset: now + PUT_WINDOW_MS });
      return true;
    }
    if (cur.count >= PUT_MAX_HITS) return false;
    cur.count += 1;
    return true;
  };

  app.put('/api/website/published', (req, res) => {
    const token = String(req.headers['x-ams-admin-token'] || '');
    const viaAdminToken =
      Boolean(AMS_ADMIN_TOKEN) &&
      token.length === AMS_ADMIN_TOKEN.length &&
      crypto.timingSafeEqual(Buffer.from(token), Buffer.from(AMS_ADMIN_TOKEN));

    if (!viaAdminToken) {
      if (!req.auth) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          pesan: 'Sesi login atau token admin diperlukan untuk menerbitkan situs.'
        });
      }
      const perms = req.auth.role.permissions.website;
      if (!Array.isArray(perms) || !perms.includes('publish')) {
        rbacStore.recordAudit({
          actorUsername: req.auth.user.username,
          actorRole: req.auth.role.id,
          action: 'PERMISSION_DENIED',
          resource: 'website:publish',
          status: 'DENIED',
          ip: getClientIp(req),
          detail: `Permintaan PUT /api/website/published ditolak oleh RBAC server.`
        });
        return res.status(403).json({
          error: 'FORBIDDEN',
          pesan: `Akses ditolak: peran "${req.auth.role.name}" tidak memiliki izin "publish" pada modul website.`
        });
      }
    }
    if (!dapatPosting(req.ip ?? 'tidak-diketahui')) {
      return res.status(429).json({ pesan: 'Terlalu banyak percobaan publikasi. Coba lagi 15 menit.' });
    }
    const kandidat = ((req.body as Record<string, any> | undefined)?.config ?? req.body) as unknown;
    if (!adalahKonfigurasiSitus(kandidat)) {
      return res.status(400).json({ pesan: 'Bentuk konfigurasi situs tidak valid (identitas.nama dan hero.judul wajib ada).' });
    }
    try {
      const pelaku = req.auth ? req.auth.user.fullName : 'Admin Token API';
      const terautentikasi: Record<string, any> = {
        ...(kandidat as Record<string, any>),
        lastModifiedBy: pelaku
      };
      const isian = JSON.stringify(terautentikasi, null, 2);
      fs.mkdirSync(path.dirname(BERKAS_SNAPSHOT), { recursive: true });
      fs.writeFileSync(BERKAS_SNAPSHOT, isian, 'utf8');
      // Salinan public/ ikut terbawa ke dist/ saat build → situs tetap tayang di hosting statis.
      fs.mkdirSync(path.dirname(BERKAS_SNAPSHOT_STATIS), { recursive: true });
      fs.writeFileSync(BERKAS_SNAPSHOT_STATIS, isian, 'utf8');
      rbacStore.recordAudit({
        actorUsername: req.auth ? req.auth.user.username : 'admin-token',
        actorRole: req.auth ? req.auth.role.id : 'system',
        action: terautentikasi.isPublished ? 'WEBSITE_PUBLISHED' : 'WEBSITE_HELD',
        resource: 'website',
        status: 'ALLOWED',
        ip: getClientIp(req),
        detail: terautentikasi.isPublished
          ? 'Snapshot situs publik diterbitkan ke server.'
          : 'Penayangan situs publik ditahan di server.'
      });
      res.json({
        ok: true,
        disimpanPada: new Date().toISOString(),
        oleh: pelaku,
        byte: Buffer.byteLength(isian)
      });
    } catch {
      res.status(500).json({ pesan: 'Snapshot gagal ditulis ke penyimpanan server.' });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('/web', (req, res) => {
      const html = fs.readFileSync(path.resolve(__dirname, 'dist', 'index.html'), 'utf8');
      res.status(200).type('html').send(suntikSeo(html, bacaSnapshot()));
    });
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: { server: httpServer },
      },
      appType: 'spa',
    });
    app.get('/web', async (req, res, next) => {
      try {
        const mentah = fs.readFileSync(BERKAS_INDEKS, 'utf8');
        const html = await vite.transformIndexHtml(req.originalUrl, mentah);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(suntikSeo(html, bacaSnapshot()));
      } catch (e) {
        next(e);
      }
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`AMS Integrated System Backend aktif di port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Gagal menjalankan server:', err);
  process.exit(1);
});
