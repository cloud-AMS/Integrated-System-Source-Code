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
import { WebSocketServer, WebSocket } from 'ws';
import { RBAC_RESOURCES, ServerRbacStore } from './server/rbacStore';
import {
  clearSessionCookie,
  createRbacMiddleware,
  getClientIp,
  SESSION_COOKIE_NAME,
  setSessionCookie
} from './server/rbacMiddleware';
import {
  canDeleteSyncKey,
  canWriteSyncKey,
  isLegacyRbacSyncKey,
  isValidSyncKey,
  mapSyncKeyToResource,
  PUBLIC_SYNC_KEYS,
  ServerDataSyncStore
} from './server/dataSyncStore';
import { ActiveDbDriver, PocketBaseArchiveConfig, ServerDbDriverManager } from './server/dbDriverManager';
import { resolveFirebaseClientConfig, type FirebaseClientConfig } from './src/services/firebaseConfig';
import { loadDeploymentEnv, resolveDeploymentEnvironment } from './server/envLoader';
import { buildWindowsDeploymentGuides } from './server/deploymentGuides';
import { WebsiteTranslationError, WebsiteTranslationService } from './server/websiteTranslation';
import {
  getFirebaseAdminStatus,
  initializeFirebaseAdmin,
  isAiStudioPreviewRuntime,
  validateVpsFirebaseConfig,
  verifyFirebaseAdminFirestoreConnection,
  verifyIdTokenViaAdmin,
  type VpsFirebaseValidationResult
} from './server/firebaseAdmin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadDeploymentEnv(__dirname);

const DATA_DIR = path.resolve(process.env.AMS_DATA_DIR?.trim() || path.resolve(__dirname, 'data'));
const BERKAS_SNAPSHOT = path.join(DATA_DIR, 'website-published.json');
const BERKAS_SNAPSHOT_STATIS = path.resolve(__dirname, 'public', 'website-published.json');
const BERKAS_INDEKS = path.resolve(__dirname, 'index.html');
const rbacStore = new ServerRbacStore(DATA_DIR);
const dataSyncStore = new ServerDataSyncStore(DATA_DIR);
const dbDriverManager = new ServerDbDriverManager(DATA_DIR, __dirname);
const websiteTranslationService = new WebsiteTranslationService(DATA_DIR);
const { attachAuth, requireAuth, requirePermission } = createRbacMiddleware(rbacStore);

function readFirebaseClientConfig(): FirebaseClientConfig | null {
  try {
    const cfgPath = path.resolve(__dirname, 'firebase-applet-config.json');
    if (!fs.existsSync(cfgPath)) return null;
    const parsed = JSON.parse(fs.readFileSync(cfgPath, 'utf8')) as Partial<FirebaseClientConfig>;
    const config = resolveFirebaseClientConfig(
      {
        VITE_DEPLOYMENT_ENV: process.env.VITE_DEPLOYMENT_ENV || process.env.DEPLOYMENT_ENV,
        VITE_FORCE_STAGING_IN_PREVIEW: process.env.VITE_FORCE_STAGING_IN_PREVIEW,
        VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY,
        VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN,
        VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID,
        VITE_FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET,
        VITE_FIREBASE_MESSAGING_SENDER_ID: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID,
        VITE_FIRESTORE_DATABASE_ID: process.env.VITE_FIRESTORE_DATABASE_ID
      },
      {
        apiKey: parsed.apiKey || '',
        authDomain: parsed.authDomain || '',
        projectId: parsed.projectId || '',
        storageBucket: parsed.storageBucket || '',
        messagingSenderId: parsed.messagingSenderId || '',
        appId: parsed.appId || '',
        firestoreDatabaseId: parsed.firestoreDatabaseId || '(default)'
      },
      {
        isAiStudioPreview: isAiStudioPreviewRuntime(process.env)
      }
    );
    if (!config.apiKey || !config.projectId) return null;
    return config;
  } catch {
    return null;
  }
}

/**
 * Memvalidasi keberadaan FIREBASE_SERVICE_ACCOUNT_JSON (dan sumber kredensial VPS lainnya)
 * serta memuat FIRESTORE_DATABASE_ID secara konsisten ke environment runtime agar koneksi
 * ke database Firestore yang dipilih oleh konfigurasi deployment tetap stabil di VPS.
 */
function validasiDanMuatFirebaseVps(emitLog = false): VpsFirebaseValidationResult {
  const hasil = validateVpsFirebaseConfig({
    rootDir: __dirname
  });

  if (!process.env.FIRESTORE_DATABASE_ID?.trim()) {
    process.env.FIRESTORE_DATABASE_ID = hasil.firestoreDatabaseId;
  }
  if (!process.env.FIREBASE_FIRESTORE_DATABASE_ID?.trim()) {
    process.env.FIREBASE_FIRESTORE_DATABASE_ID = hasil.firestoreDatabaseId;
  }

  if (emitLog) {
    console.log(
      `[Firebase VPS Validator] env=${hasil.isVpsRuntime ? 'VPS/Server' : 'AI-Studio-Preview'}, FIREBASE_SERVICE_ACCOUNT_JSON=${hasil.serviceAccountJsonStatus}, sumberKredensial=${hasil.credentialSource}, FIRESTORE_DATABASE_ID=${hasil.firestoreDatabaseId} (${hasil.databaseIdSource}), siapKoneksiStabil=${hasil.readyForStableConnection}`
    );
    for (const warning of hasil.warnings) {
      console.warn(`[Firebase VPS Validator][PERINGATAN] ${warning}`);
    }
    for (const err of hasil.errors) {
      console.error(`[Firebase VPS Validator][GALAT] ${err}`);
    }
  }

  return hasil;
}

async function verifyFirebaseIdToken(idToken: string): Promise<
  | { ok: true; uid: string; email: string; emailVerified: boolean; displayName: string }
  | { ok: false; message: string }
> {
  // Prioritaskan verifikasi lokal/resmi via Firebase Admin SDK jika Service Account aktif di server/VPS
  const adminVerified = await verifyIdTokenViaAdmin(idToken);
  if (adminVerified.ok) {
    return adminVerified;
  }
  if (!adminVerified.fallbackToRest) {
    return { ok: false, message: adminVerified.message };
  }

  const cfg = readFirebaseClientConfig();
  if (!cfg?.apiKey) {
    return { ok: false, message: 'Konfigurasi Firebase belum tersedia di server.' };
  }
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(cfg.apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      }
    );
    if (!res.ok) {
      return { ok: false, message: 'Token Firebase tidak valid atau sudah kedaluwarsa.' };
    }
    const payload = (await res.json()) as {
      users?: Array<{
        localId?: string;
        email?: string;
        emailVerified?: boolean;
        displayName?: string;
      }>;
    };
    const u = payload.users?.[0];
    if (!u?.localId || !u.email) {
      return { ok: false, message: 'Akun Firebase tidak memiliki alamat email yang sah.' };
    }
    if (!u.emailVerified) {
      return { ok: false, message: 'Email akun Google belum terverifikasi.' };
    }
    return {
      ok: true,
      uid: u.localId,
      email: u.email.trim().toLowerCase(),
      emailVerified: true,
      displayName: u.displayName || u.email
    };
  } catch {
    return { ok: false, message: 'Gagal memverifikasi token Firebase ke layanan identitas Google.' };
  }
}

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
      `<link rel="canonical" href="${process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000'}/web" />\n</head>`
    );
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  const httpServer = http.createServer(app);
  // Dev server di AI Studio harus berjalan di port 3000 (PORT=8080 digunakan nginx internal)
  const PORT = process.env.PORT && process.env.PORT !== '8080' ? Number(process.env.PORT) : 3000;

  // Validasi keberadaan FIREBASE_SERVICE_ACCOUNT_JSON & muat FIRESTORE_DATABASE_ID untuk stabilitas koneksi VPS
  validasiDanMuatFirebaseVps(true);

  // Inisialisasi Firebase Admin SDK untuk koneksi server-to-server aman ke named Firestore database
  const adminInitStatus = initializeFirebaseAdmin({ rootDir: __dirname });
  if (adminInitStatus.initialized) {
    console.log(
      `[Firebase Admin SDK] Terinisialisasi (project=${adminInitStatus.projectId}, databaseId=${adminInitStatus.databaseId}, sumber=${adminInitStatus.credentialSource})`
    );
    void verifyFirebaseAdminFirestoreConnection(8000, 3).then((verified) => {
      if (verified.connected) {
        console.log(
          `[Firebase Admin SDK] Koneksi Firestore "${verified.databaseId}" terverifikasi (${verified.latencyMs} ms, koleksi akar=${verified.collectionCount ?? 0}).`
        );
      } else if (verified.lastError) {
        console.warn(
          `[Firebase Admin SDK] Verifikasi awal Firestore "${verified.databaseId}" gagal: ${verified.lastError}`
        );
      }
    });
  } else {
    console.warn(
      `[Firebase Admin SDK] Mode fallback aktif (databaseId=${adminInitStatus.databaseId}): ${adminInitStatus.lastError || 'kredensial belum diatur'}`
    );
  }

  // Bootstrap website_published ke dataSyncStore jika sudah ada snapshot di disk
  if (!dataSyncStore.hasKey('website_published')) {
    const initialSnapshot = bacaSnapshot();
    if (initialSnapshot) {
      dataSyncStore.setKey('website_published', initialSnapshot, 'system');
    }
  }

  // Real-time WebSocket hub (/api/sync/ws) untuk sinkronisasi lintas user & perangkat
  interface SyncWsClient {
    ws: WebSocket;
    isAuthenticated: boolean;
    sessionId?: string;
    userId?: string;
    username?: string;
    isAlive: boolean;
  }
  const syncClients = new Set<SyncWsClient>();
  const syncWss = new WebSocketServer({ noServer: true });

  const extractWsToken = (req: http.IncomingMessage): string | null => {
    try {
      const parsed = new URL(req.url || '/', 'http://localhost');
      const qp = parsed.searchParams.get('token');
      if (qp && qp.trim()) return qp.trim();
    } catch {
      /* ignore */
    }
    const rawCookie = req.headers.cookie || '';
    for (const part of rawCookie.split(';')) {
      const eq = part.indexOf('=');
      if (eq <= 0) continue;
      if (part.slice(0, eq).trim() === SESSION_COOKIE_NAME) {
        try {
          return decodeURIComponent(part.slice(eq + 1).trim());
        } catch {
          return part.slice(eq + 1).trim();
        }
      }
    }
    return null;
  };

  syncWss.on('connection', (ws, req) => {
    const token = extractWsToken(req);
    const resolved = token ? rbacStore.resolveToken(token) : null;
    const client: SyncWsClient = {
      ws,
      isAuthenticated: Boolean(resolved),
      sessionId: resolved?.session.id,
      userId: resolved?.user.id,
      username: resolved?.user.username,
      isAlive: true
    };
    syncClients.add(client);

    ws.on('pong', () => {
      client.isAlive = true;
    });
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(String(raw)) as { type?: string; token?: string };
        if (msg?.type === 'sync:auth' && typeof msg.token === 'string') {
          const auth = msg.token ? rbacStore.resolveToken(msg.token) : null;
          client.isAuthenticated = Boolean(auth);
          client.sessionId = auth?.session.id;
          client.userId = auth?.user.id;
          client.username = auth?.user.username;
          ws.send(JSON.stringify({
            type: 'sync:hello',
            authenticated: client.isAuthenticated,
            revision: dataSyncStore.getRevision()
          }));
        }
      } catch {
        /* abaikan frame tidak valid */
      }
    });
    ws.on('close', () => {
      syncClients.delete(client);
    });
    ws.on('error', () => {
      syncClients.delete(client);
    });

    ws.send(JSON.stringify({
      type: 'sync:hello',
      authenticated: client.isAuthenticated,
      revision: dataSyncStore.getRevision()
    }));
  });

  const heartbeatInterval = setInterval(() => {
    for (const client of syncClients) {
      if (!client.isAlive) {
        client.ws.terminate();
        syncClients.delete(client);
        continue;
      }
      client.isAlive = false;
      try {
        client.ws.ping();
      } catch {
        syncClients.delete(client);
      }
    }
  }, 30_000);
  httpServer.on('close', () => clearInterval(heartbeatInterval));

  const broadcastMessage = (payload: Record<string, unknown>, publicAllowed: boolean) => {
    const serialized = JSON.stringify(payload);
    for (const client of syncClients) {
      if (client.ws.readyState !== WebSocket.OPEN) continue;
      if (!publicAllowed && !client.isAuthenticated) continue;
      try {
        client.ws.send(serialized);
      } catch {
        /* abaikan socket gagal kirim */
      }
    }
  };

  const broadcastSyncUpdate = (
    key: string,
    entry: { value: unknown; version: number; updatedAt: string; updatedBy: string },
    revision: number,
    sourceClientId?: string
  ) => {
    broadcastMessage(
      {
        type: 'sync:update',
        key,
        value: entry.value,
        version: entry.version,
        updatedAt: entry.updatedAt,
        updatedBy: entry.updatedBy,
        revision,
        sourceClientId: sourceClientId || null
      },
      PUBLIC_SYNC_KEYS.has(key)
    );
  };

  const broadcastSyncDelete = (key: string, revision: number, sourceClientId?: string) => {
    broadcastMessage(
      {
        type: 'sync:delete',
        key,
        revision,
        sourceClientId: sourceClientId || null
      },
      PUBLIC_SYNC_KEYS.has(key)
    );
  };

  const broadcastSyncBatch = (
    updated: Record<string, { value: unknown; version: number; updatedAt: string; updatedBy: string }>,
    deleted: string[],
    revision: number,
    sourceClientId?: string
  ) => {
    const publicUpdated: Record<string, { value: unknown; version: number; updatedAt: string; updatedBy: string }> = {};
    for (const [k, v] of Object.entries(updated)) {
      if (PUBLIC_SYNC_KEYS.has(k)) publicUpdated[k] = v;
    }
    const publicDeleted = deleted.filter((k) => PUBLIC_SYNC_KEYS.has(k));
    const hasPublicChanges = Object.keys(publicUpdated).length > 0 || publicDeleted.length > 0;

    const fullPayload = JSON.stringify({
      type: 'sync:batch-update',
      entries: updated,
      deleted,
      revision,
      sourceClientId: sourceClientId || null
    });
    const publicPayload = hasPublicChanges
      ? JSON.stringify({
          type: 'sync:batch-update',
          entries: publicUpdated,
          deleted: publicDeleted,
          revision,
          sourceClientId: sourceClientId || null
        })
      : null;

    for (const client of syncClients) {
      if (client.ws.readyState !== WebSocket.OPEN) continue;
      const msg = client.isAuthenticated ? fullPayload : publicPayload;
      if (!msg) continue;
      try {
        client.ws.send(msg);
      } catch {
        /* abaikan socket gagal kirim */
      }
    }
  };

  const broadcastRbacUpdated = () => {
    const nowIso = new Date().toISOString();
    const updatedPayload = JSON.stringify({ type: 'rbac:updated', at: nowIso });
    const revokedPayload = JSON.stringify({ type: 'rbac:session-revoked', at: nowIso });
    const setupPayload = JSON.stringify({
      type: 'rbac:setup-updated',
      needsSetup: rbacStore.needsInitialSetup(),
      at: nowIso
    });
    for (const client of syncClients) {
      if (client.ws.readyState !== WebSocket.OPEN) continue;
      try {
        if (client.isAuthenticated) {
          if (!client.sessionId || !rbacStore.resolveSessionById(client.sessionId)) {
            client.isAuthenticated = false;
            client.sessionId = undefined;
            client.userId = undefined;
            client.username = undefined;
            client.ws.send(revokedPayload);
          } else {
            client.ws.send(updatedPayload);
          }
        } else {
          client.ws.send(setupPayload);
        }
      } catch {
        /* abaikan socket gagal kirim */
      }
    }
  };

  const broadcastRbacActivity = () => {
    broadcastMessage({ type: 'rbac:activity', at: new Date().toISOString() }, false);
  };

  // PocketBase AMS (C:\pocketbase-ams, port 8091) hanya diekspos seperlunya:
  // GET /api/health, GET /api/realtime (SSE), GET /api/collections/<nama>/records.
  // Admin UI, superuser, pengaturan, dan tulis/hapus sengaja ditolak di sini —
  // aplikasi hanya butuh sinyal realtime + baca koleksi publik.
  const PB_GET_DIIZINKAN = /^\/api\/(health|realtime|collections\/[A-Za-z0-9_-]+\/records)\/?$/;
  const pbProxy = createProxyMiddleware({
    target: dbDriverManager.getPocketBaseUrl(),
    changeOrigin: true,
    pathRewrite: { '^/api/ams-pb': '' }
  });
  app.use('/api/ams-pb', (req, res, next) => {
    if (dbDriverManager.getActiveDriver() !== 'pocketbase') {
      return res.status(503).json({
        mode: dbDriverManager.getActiveDriver(),
        archived: true,
        pesan:
          'Database aktif berada pada mode Firebase Firestore (fase pengembangan). Pengaturan PocketBase aman diarsipkan dan dapat diaktifkan kembali kapan saja.'
      });
    }
    if (req.method === 'GET' && PB_GET_DIIZINKAN.test(req.path)) return next();
    return res.status(403).json({ pesan: 'Jalur PocketBase ini tidak diizinkan lewat proxy.' });
  }, pbProxy);

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
    const fbCfg = readFirebaseClientConfig();
    const envInfo = resolveDeploymentEnvironment();
    res.json({
      status: 'aktif',
      sistem: 'AMS Integrated System - PT Anugrahmitra Selaras',
      versi: '2.4.0-cdakb',
      deploymentEnv: envInfo.deploymentEnv,
      isStaging: envInfo.isStaging,
      standar: ['CDAKB Permenkes 4/2014', 'CPAKB Permenkes 20/2017', 'SDAK OSS-RBA', 'ISO 13485:2016'],
      basisData:
        dbDriverManager.getActiveDriver() === 'firebase'
          ? 'Firebase Firestore (Staging/Dev) + Server Real-Time Sync'
          : 'PocketBase Server + Persistent JSON Store + WebSocket',
      databaseDriver: dbDriverManager.getActiveDriver(),
      pocketbaseArchived: true,
      firebaseProjectId: fbCfg?.projectId || null,
      firebaseAdmin: getFirebaseAdminStatus(),
      firebaseVpsValidation: validasiDanMuatFirebaseVps(false),
      rbacAktif: true,
      realtimeSyncAktif: true,
      needsInitialSetup: rbacStore.needsInitialSetup(),
      syncRevision: dataSyncStore.getRevision(),
      klienTerhubung: syncClients.size,
      waktuServer: new Date().toISOString()
    });
  });

  // ================= AUTENTIKASI & RBAC SERVER-SIDE =================
  app.get('/api/auth/setup-status', (_req, res) => {
    const devReset = rbacStore.getDeveloperResetInfo();
    res.set('Cache-Control', 'no-store').json({
      needsSetup: rbacStore.needsInitialSetup(),
      requiresSetupToken: Boolean((process.env.INITIAL_SETUP_TOKEN || '').trim()),
      needsDeveloperReset: devReset.required,
      developerResetUser: devReset.required
        ? {
            username: devReset.username || 'dev.admin',
            fullName: devReset.fullName || 'Developer & IT Support',
            roleName: devReset.roleName || 'Developer & IT Support'
          }
        : undefined
    });
  });

  app.post('/api/auth/setup', (req, res) => {
    const { username, password, fullName, email, setupToken } = (req.body || {}) as Record<string, string | undefined>;
    const result = rbacStore.bootstrapFirstDeveloper(
      {
        username: String(username || ''),
        password: String(password || ''),
        fullName: String(fullName || ''),
        email,
        setupToken
      },
      getClientIp(req),
      String(req.headers['user-agent'] || '')
    );
    if (!result.ok) {
      return res.status(result.status).json({ error: 'SETUP_FAILED', pesan: result.message });
    }
    setSessionCookie(req, res, result.token);
    broadcastRbacUpdated();
    res.status(201).json({
      user: result.user,
      role: result.role,
      permissions: result.role.permissions,
      token: result.token,
      expiresAt: result.session.expiresAt
    });
  });

  app.post('/api/auth/reset-developer', (req, res) => {
    const { resetCode, newPassword } = (req.body || {}) as { resetCode?: string; newPassword?: string };
    const result = rbacStore.completeDeveloperPasswordReset(
      {
        resetCode: String(resetCode || ''),
        newPassword: String(newPassword || '')
      },
      getClientIp(req),
      String(req.headers['user-agent'] || '')
    );
    if (!result.ok) {
      return res.status(result.status).json({ error: 'DEV_RESET_FAILED', pesan: result.message });
    }
    setSessionCookie(req, res, result.token);
    broadcastRbacUpdated();
    res.json({
      user: result.user,
      role: result.role,
      permissions: result.role.permissions,
      token: result.token,
      expiresAt: result.session.expiresAt
    });
  });

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
    broadcastRbacActivity();
    res.json({
      user: result.user,
      role: result.role,
      permissions: result.role.permissions,
      token: result.token,
      expiresAt: result.session.expiresAt
    });
  });

  app.post('/api/auth/firebase-login', async (req, res) => {
    const { idToken } = (req.body || {}) as { idToken?: string };
    if (!idToken || typeof idToken !== 'string') {
      return res.status(400).json({ error: 'BAD_REQUEST', pesan: 'Token autentikasi Firebase wajib disertakan.' });
    }
    const verified = await verifyFirebaseIdToken(idToken);
    if (!verified.ok) {
      return res.status(401).json({ error: 'FIREBASE_AUTH_FAILED', pesan: verified.message });
    }
    const result = rbacStore.authenticateByVerifiedEmail(
      verified.email,
      verified.uid,
      verified.displayName,
      getClientIp(req),
      String(req.headers['user-agent'] || '')
    );
    if (!result.ok) {
      return res.status(result.status).json({ error: 'AUTH_FAILED', pesan: result.message });
    }
    setSessionCookie(req, res, result.token);
    broadcastRbacActivity();
    res.json({
      user: result.user,
      role: result.role,
      permissions: result.role.permissions,
      token: result.token,
      expiresAt: result.session.expiresAt
    });
  });

  app.get('/api/firebase/rbac-snapshot', requirePermission('rbac-admin', 'view'), (_req, res) => {
    res.set('Cache-Control', 'no-store').json({
      roles: rbacStore.listRoles(),
      users: rbacStore.listAllUsersForCloudSync()
    });
  });

  app.post('/api/firebase/hydrate', async (req, res) => {
    const body = (req.body || {}) as {
      idToken?: string;
      roles?: any[];
      users?: any[];
      entries?: Record<string, { value: unknown; version?: number; updatedAt?: string; updatedBy?: string }>;
      activeDriver?: ActiveDbDriver;
      pocketbaseArchive?: Partial<PocketBaseArchiveConfig>;
    };

    let actorUsername = req.auth?.user.username || '';
    let authorized = false;

    if (req.auth) {
      const permsRbac = req.auth.role.permissions['rbac-admin'] || [];
      const permsIt = req.auth.role.permissions['it-traceability'] || [];
      authorized =
        Boolean(req.auth.user.isHiddenDeveloper) ||
        permsRbac.includes('update') ||
        permsIt.includes('update');
    }

    if (!authorized && typeof body.idToken === 'string' && body.idToken.trim()) {
      const verified = await verifyFirebaseIdToken(body.idToken.trim());
      if (verified.ok) {
        const bootstrappedEmail = (process.env.BOOTSTRAP_DEV_EMAIL || 'antraderyll@gmail.com').trim().toLowerCase();
        const extraAdmins = (process.env.FIREBASE_ADMIN_EMAILS || '')
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);
        const adminEmailSet = new Set([
          bootstrappedEmail,
          'antraderyll@gmail.com',
          'cloud.ams2026@gmail.com',
          ...extraAdmins
        ]);
        const matchedUser = rbacStore.listAllUsersForCloudSync().find(
          (u) => u.email.trim().toLowerCase() === verified.email
        );
        if (
          adminEmailSet.has(verified.email) ||
          matchedUser?.isHiddenDeveloper ||
          matchedUser?.roleId === 'it_admin' ||
          matchedUser?.roleId === 'developer_it_support'
        ) {
          authorized = true;
          actorUsername = verified.email;
        }
      }
    }

    if (!authorized) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        pesan: 'Hanya administrator atau developer terverifikasi Firebase yang dapat memulihkan state cloud.'
      });
    }

    const rbacRes = rbacStore.hydrateFromCloud({ roles: body.roles, users: body.users });
    const syncRes = body.entries ? dataSyncStore.hydrateFromCloud(body.entries) : { appliedKeys: [], revision: dataSyncStore.getRevision() };

    if (body.activeDriver || body.pocketbaseArchive) {
      dbDriverManager.hydrateArchiveFromCloud(body.activeDriver, body.pocketbaseArchive, actorUsername || 'firebase-sync');
    }

    if (syncRes.appliedKeys.includes('website_published') && body.entries?.website_published?.value && adalahKonfigurasiSitus(body.entries.website_published.value)) {
      try {
        const serialized = JSON.stringify(body.entries.website_published.value, null, 2);
        fs.mkdirSync(path.dirname(BERKAS_SNAPSHOT), { recursive: true });
        fs.writeFileSync(BERKAS_SNAPSHOT, serialized, 'utf8');
        fs.mkdirSync(path.dirname(BERKAS_SNAPSHOT_STATIS), { recursive: true });
        fs.writeFileSync(BERKAS_SNAPSHOT_STATIS, serialized, 'utf8');
      } catch {
        /* lanjutkan meskipun public snapshot tidak dapat ditulis */
      }
    }

    if (rbacRes.rolesApplied > 0 || rbacRes.usersApplied > 0) {
      broadcastRbacUpdated();
    }
    if (syncRes.appliedKeys.length > 0) {
      const updatedEntries: Record<string, { value: unknown; version: number; updatedAt: string; updatedBy: string }> = {};
      const all = dataSyncStore.getAllState().entries;
      for (const k of syncRes.appliedKeys) {
        if (all[k]) updatedEntries[k] = all[k];
      }
      broadcastSyncBatch(updatedEntries, [], syncRes.revision);
    }

    res.json({
      ok: true,
      rolesApplied: rbacRes.rolesApplied,
      usersApplied: rbacRes.usersApplied,
      entriesApplied: syncRes.appliedKeys.length,
      revision: syncRes.revision
    });
  });

  app.get('/api/system/db-config', (req, res) => {
    const fbCfg = readFirebaseClientConfig();
    const summary = dbDriverManager.getRuntimeSummary();
    const envInfo = resolveDeploymentEnvironment();
    res.set('Cache-Control', 'no-store').json({
      activeDriver: summary.activeDriver,
      deploymentEnv: envInfo.deploymentEnv,
      isStaging: envInfo.isStaging,
      updatedAt: summary.updatedAt,
      updatedBy: summary.updatedBy,
      pocketbaseArchived: summary.pocketbaseArchived,
      pocketbaseUrl: summary.pocketbaseUrl,
      firebase: fbCfg
        ? {
            configured: true,
            projectId: fbCfg.projectId,
            firestoreDatabaseId: fbCfg.firestoreDatabaseId,
            authDomain: fbCfg.authDomain
          }
        : { configured: false },
      firebaseAdmin: getFirebaseAdminStatus(),
      firebaseVpsValidation: validasiDanMuatFirebaseVps(false),
      ...(req.auth ? { pocketbaseArchive: summary.pocketbaseArchive } : {})
    });
  });

  app.post('/api/system/firebase-admin-verify', requirePermission('it-traceability', 'view'), async (_req, res) => {
    const validation = validasiDanMuatFirebaseVps(false);
    initializeFirebaseAdmin({ rootDir: __dirname });
    const status = await verifyFirebaseAdminFirestoreConnection(8000, 3);
    res.set('Cache-Control', 'no-store').json({
      ok: status.connected,
      status,
      validation
    });
  });

  app.post('/api/system/db-driver', requireAuth, (req, res) => {
    const permsIt = req.auth!.role.permissions['it-traceability'] || [];
    const permsRbac = req.auth!.role.permissions['rbac-admin'] || [];
    const boleh =
      Boolean(req.auth!.user.isHiddenDeveloper) ||
      permsRbac.includes('update') ||
      permsIt.includes('update');
    if (!boleh) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        pesan: 'Anda tidak memiliki otoritas mengubah driver database sistem.'
      });
    }
    const { driver, pocketbaseUrl } = (req.body || {}) as { driver?: string; pocketbaseUrl?: string };
    if (driver !== 'firebase' && driver !== 'pocketbase') {
      return res.status(400).json({ error: 'BAD_REQUEST', pesan: 'Driver harus bernilai "firebase" atau "pocketbase".' });
    }
    const next = dbDriverManager.switchDriver(driver, req.auth!.user.username, pocketbaseUrl);
    rbacStore.recordAudit({
      actorUsername: req.auth!.user.username,
      actorRole: req.auth!.role.id,
      action: 'DB_DRIVER_SWITCHED',
      resource: 'it-traceability',
      status: 'ALLOWED',
      ip: getClientIp(req),
      detail: `Mode database aktif diubah ke "${driver}". Arsip konfigurasi PocketBase tetap dipertahankan.`
    });
    broadcastMessage({ type: 'system:db-driver', activeDriver: next.activeDriver }, true);
    res.json({ ok: true, ...next });
  });

  app.get('/api/system/migration-bundle', requirePermission('rbac-admin', 'view'), (_req, res) => {
    res.set('Cache-Control', 'no-store').json({
      exportedAt: new Date().toISOString(),
      activeDriver: dbDriverManager.getActiveDriver(),
      pocketbaseArchive: dbDriverManager.getPocketBaseArchive(),
      rbac: {
        roles: rbacStore.listRoles(),
        users: rbacStore.listAllUsersForCloudSync()
      },
      appState: dataSyncStore.getAllState()
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    if (req.auth) {
      const loggedOutSessionId = req.auth.session.id;
      rbacStore.revokeSession(loggedOutSessionId, req.auth.user.username, req.auth.role.id, getClientIp(req));
      for (const client of syncClients) {
        if (client.sessionId === loggedOutSessionId) {
          client.isAuthenticated = false;
          client.sessionId = undefined;
          client.userId = undefined;
          client.username = undefined;
        }
      }
      broadcastRbacActivity();
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
    broadcastRbacActivity();
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
    broadcastRbacUpdated();
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
    broadcastRbacUpdated();
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
    broadcastRbacUpdated();
    res.json({ ok: true });
  });

  app.get('/api/rbac/users', requirePermission('rbac-admin', 'view'), (_req, res) => {
    res.json({ users: rbacStore.listUsers() });
  });

  app.post('/api/rbac/users', requirePermission('rbac-admin', 'create'), (req, res) => {
    const { username, fullName, email, roleId, department, password, isActive } = (req.body || {}) as Record<string, any>;
    let result: ReturnType<typeof rbacStore.createUser>;
    try {
      result = rbacStore.createUser(
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
    } catch (error) {
      console.error('[RBAC] Gagal menyimpan akun pengguna di server.', error);
      return res.status(500).json({
        error: 'USER_PERSISTENCE_FAILED',
        pesan: 'Server gagal menyimpan akun ke penyimpanan RBAC. Periksa log layanan server.'
      });
    }
    if (!result.ok) return res.status(result.status).json({ error: 'USER_ERROR', pesan: result.message });
    broadcastRbacUpdated();
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
    broadcastRbacUpdated();
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
    broadcastRbacUpdated();
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
    broadcastRbacUpdated();
    res.json({ ok: true });
  });

  app.get('/api/rbac/audit', requirePermission('audit-trail', 'view'), (_req, res) => {
    res.json({ logs: rbacStore.getAuditLogs(200) });
  });

  // ================= REAL-TIME SERVER DATA & SETTINGS SYNC =================
  app.get('/api/sync/public-settings', (_req, res) => {
    res.set('Cache-Control', 'no-store').json(dataSyncStore.getPublicState());
  });

  app.get('/api/sync/state', requireAuth, (req, res) => {
    let sinceMap: Record<string, number> | undefined;
    const rawVersions = req.query.versions;
    if (typeof rawVersions === 'string' && rawVersions.trim()) {
      try {
        const parsed = JSON.parse(rawVersions) as unknown;
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          sinceMap = {};
          for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
            if (typeof v === 'number' && Number.isFinite(v)) {
              sinceMap[k] = v;
            }
          }
        }
      } catch {
        /* abaikan parameter versions tidak valid dan kembalikan snapshot penuh */
      }
    }
    res.set('Cache-Control', 'no-store').json(dataSyncStore.getAllState(sinceMap));
  });

  app.put('/api/sync/keys/:key', requireAuth, (req, res) => {
    const { key } = req.params;
    if (isLegacyRbacSyncKey(key)) {
      return res.status(410).json({
        error: 'LEGACY_RBAC_REMOVED',
        pesan: 'Koleksi RBAC lama sudah dihapus. Gunakan manajemen RBAC server.'
      });
    }
    if (!isValidSyncKey(key)) {
      return res.status(400).json({ error: 'INVALID_KEY', pesan: 'Kunci sinkronisasi tidak valid.' });
    }
    if (!canWriteSyncKey(req.auth!.role, key)) {
      const resource = mapSyncKeyToResource(key);
      rbacStore.recordAudit({
        actorUsername: req.auth!.user.username,
        actorRole: req.auth!.role.id,
        action: 'PERMISSION_DENIED',
        resource: `${resource}:${key}`,
        status: 'DENIED',
        ip: getClientIp(req),
        detail: `Permintaan PUT /api/sync/keys/${key} ditolak oleh RBAC server.`
      });
      return res.status(403).json({
        error: 'FORBIDDEN',
        pesan: `Akses ditolak: peran "${req.auth!.role.name}" tidak memiliki izin menulis data "${key}".`
      });
    }

    const body = (req.body || {}) as { value?: unknown; clientId?: string };
    if (!('value' in body) || body.value === undefined) {
      return res.status(400).json({ error: 'BAD_REQUEST', pesan: 'Field "value" wajib disertakan.' });
    }

    // Jika situs publik diperbarui via key sync, cerminkan ke snapshot disk bila valid
    if (key === 'website_published' && adalahKonfigurasiSitus(body.value)) {
      try {
        const serialized = JSON.stringify(body.value, null, 2);
        fs.mkdirSync(path.dirname(BERKAS_SNAPSHOT), { recursive: true });
        fs.writeFileSync(BERKAS_SNAPSHOT, serialized, 'utf8');
        fs.mkdirSync(path.dirname(BERKAS_SNAPSHOT_STATIS), { recursive: true });
        fs.writeFileSync(BERKAS_SNAPSHOT_STATIS, serialized, 'utf8');
      } catch {
        /* tetap lanjutkan penyimpanan sync store */
      }
    }

    const synced = dataSyncStore.setKey(key, body.value, req.auth!.user.username);
    const sourceClientId =
      typeof body.clientId === 'string' && body.clientId
        ? body.clientId
        : typeof req.headers['x-sync-client-id'] === 'string'
          ? req.headers['x-sync-client-id']
          : undefined;
    broadcastSyncUpdate(key, synced.entry, synced.revision, sourceClientId);
    res.json({
      ok: true,
      key,
      version: synced.entry.version,
      revision: synced.revision,
      updatedAt: synced.entry.updatedAt,
      updatedBy: synced.entry.updatedBy
    });
  });

  app.delete('/api/sync/keys/:key', requireAuth, (req, res) => {
    const { key } = req.params;
    if (isLegacyRbacSyncKey(key)) {
      return res.status(410).json({
        error: 'LEGACY_RBAC_REMOVED',
        pesan: 'Koleksi RBAC lama sudah dihapus. Gunakan manajemen RBAC server.'
      });
    }
    if (!isValidSyncKey(key)) {
      return res.status(400).json({ error: 'INVALID_KEY', pesan: 'Kunci sinkronisasi tidak valid.' });
    }
    if (!canDeleteSyncKey(req.auth!.role, key)) {
      const resource = mapSyncKeyToResource(key);
      rbacStore.recordAudit({
        actorUsername: req.auth!.user.username,
        actorRole: req.auth!.role.id,
        action: 'PERMISSION_DENIED',
        resource: `${resource}:${key}`,
        status: 'DENIED',
        ip: getClientIp(req),
        detail: `Permintaan DELETE /api/sync/keys/${key} ditolak oleh RBAC server.`
      });
      return res.status(403).json({
        error: 'FORBIDDEN',
        pesan: `Akses ditolak: peran "${req.auth!.role.name}" tidak memiliki izin menghapus data "${key}".`
      });
    }
    const result = dataSyncStore.deleteKey(key);
    const sourceClientId = typeof req.headers['x-sync-client-id'] === 'string' ? req.headers['x-sync-client-id'] : undefined;
    if (result.deleted) {
      broadcastSyncDelete(key, result.revision, sourceClientId);
    }
    res.json({ ok: true, key, deleted: result.deleted, revision: result.revision });
  });

  app.post('/api/sync/batch', requireAuth, (req, res) => {
    const body = (req.body || {}) as {
      updates?: Record<string, unknown>;
      deletes?: string[];
      clientId?: string;
    };
    const updates = body.updates && typeof body.updates === 'object' && !Array.isArray(body.updates) ? body.updates : {};
    const deletes = Array.isArray(body.deletes) ? body.deletes : [];

    for (const key of Object.keys(updates)) {
      if (isLegacyRbacSyncKey(key)) {
        return res.status(410).json({
          error: 'LEGACY_RBAC_REMOVED',
          pesan: 'Koleksi RBAC lama sudah dihapus. Gunakan manajemen RBAC server.'
        });
      }
      if (!isValidSyncKey(key)) {
        return res.status(400).json({ error: 'INVALID_KEY', pesan: `Kunci sinkronisasi tidak valid: ${key}` });
      }
      if (!canWriteSyncKey(req.auth!.role, key)) {
        const resource = mapSyncKeyToResource(key);
        rbacStore.recordAudit({
          actorUsername: req.auth!.user.username,
          actorRole: req.auth!.role.id,
          action: 'PERMISSION_DENIED',
          resource: `${resource}:${key}`,
          status: 'DENIED',
          ip: getClientIp(req),
          detail: `Permintaan batch write "${key}" ditolak oleh RBAC server.`
        });
        return res.status(403).json({
          error: 'FORBIDDEN',
          pesan: `Akses ditolak: peran "${req.auth!.role.name}" tidak memiliki izin menulis "${key}".`
        });
      }
    }

    for (const key of deletes) {
      if (isLegacyRbacSyncKey(key)) {
        return res.status(410).json({
          error: 'LEGACY_RBAC_REMOVED',
          pesan: 'Koleksi RBAC lama sudah dihapus. Gunakan manajemen RBAC server.'
        });
      }
      if (!isValidSyncKey(key)) {
        return res.status(400).json({ error: 'INVALID_KEY', pesan: `Kunci hapus tidak valid: ${key}` });
      }
      if (!canDeleteSyncKey(req.auth!.role, key)) {
        const resource = mapSyncKeyToResource(key);
        return res.status(403).json({
          error: 'FORBIDDEN',
          pesan: `Akses ditolak: peran "${req.auth!.role.name}" tidak memiliki izin menghapus "${key}".`
        });
      }
    }

    if (updates.website_published && adalahKonfigurasiSitus(updates.website_published)) {
      try {
        const serialized = JSON.stringify(updates.website_published, null, 2);
        fs.mkdirSync(path.dirname(BERKAS_SNAPSHOT), { recursive: true });
        fs.writeFileSync(BERKAS_SNAPSHOT, serialized, 'utf8');
        fs.mkdirSync(path.dirname(BERKAS_SNAPSHOT_STATIS), { recursive: true });
        fs.writeFileSync(BERKAS_SNAPSHOT_STATIS, serialized, 'utf8');
      } catch {
        /* lanjutkan penyimpanan batch */
      }
    }

    const result = dataSyncStore.setBatch(updates, deletes, req.auth!.user.username);
    const sourceClientId =
      typeof body.clientId === 'string' && body.clientId
        ? body.clientId
        : typeof req.headers['x-sync-client-id'] === 'string'
          ? req.headers['x-sync-client-id']
          : undefined;
    if (Object.keys(result.updated).length > 0 || result.deleted.length > 0) {
      broadcastSyncBatch(result.updated, result.deleted, result.revision, sourceClientId);
    }

    const versions: Record<string, number> = {};
    for (const [k, entry] of Object.entries(result.updated)) {
      versions[k] = entry.version;
    }

    res.json({
      ok: true,
      revision: result.revision,
      versions,
      deleted: result.deleted
    });
  });

  app.post('/api/sync/purge-dummy', requireAuth, (req, res) => {
    const permsIt = req.auth!.role.permissions['it-traceability'] || [];
    const permsRbac = req.auth!.role.permissions['rbac-admin'] || [];
    const bolehPurge =
      req.auth!.role.id === 'developer' ||
      req.auth!.role.id === 'it_admin' ||
      permsRbac.includes('delete') ||
      permsRbac.includes('update') ||
      permsIt.includes('delete') ||
      permsIt.includes('update');

    if (!bolehPurge) {
      rbacStore.recordAudit({
        actorUsername: req.auth!.user.username,
        actorRole: req.auth!.role.id,
        action: 'PERMISSION_DENIED',
        resource: 'it-traceability:purge-dummy',
        status: 'DENIED',
        ip: getClientIp(req),
        detail: 'Percobaan purge/pemulihan data dummy ditolak oleh RBAC server.'
      });
      return res.status(403).json({
        error: 'FORBIDDEN',
        pesan: `Akses ditolak: peran "${req.auth!.role.name}" tidak memiliki otoritas mengelola purge data dummy.`
      });
    }

    const body = (req.body || {}) as {
      updates?: Record<string, unknown>;
      deletes?: string[];
      mode?: 'purge' | 'restore';
      ringkasan?: string;
      clientId?: string;
    };
    const updates = body.updates && typeof body.updates === 'object' && !Array.isArray(body.updates) ? body.updates : {};
    const deletes = Array.isArray(body.deletes) ? body.deletes : [];

    for (const key of [...Object.keys(updates), ...deletes]) {
      if (isLegacyRbacSyncKey(key)) {
        return res.status(410).json({
          error: 'LEGACY_RBAC_REMOVED',
          pesan: 'Koleksi RBAC lama sudah dihapus. Gunakan manajemen RBAC server.'
        });
      }
      if (!isValidSyncKey(key)) {
        return res.status(400).json({ error: 'INVALID_KEY', pesan: `Kunci sinkronisasi tidak valid: ${key}` });
      }
    }

    const result = dataSyncStore.setBatch(updates, deletes, req.auth!.user.username);
    const sourceClientId =
      typeof body.clientId === 'string' && body.clientId
        ? body.clientId
        : typeof req.headers['x-sync-client-id'] === 'string'
          ? req.headers['x-sync-client-id']
          : undefined;
    if (Object.keys(result.updated).length > 0 || result.deleted.length > 0) {
      broadcastSyncBatch(result.updated, result.deleted, result.revision, sourceClientId);
    }

    const versions: Record<string, number> = {};
    for (const [k, entry] of Object.entries(result.updated)) {
      versions[k] = entry.version;
    }

    const mode = body.mode === 'restore' ? 'restore' : 'purge';
    rbacStore.recordAudit({
      actorUsername: req.auth!.user.username,
      actorRole: req.auth!.role.id,
      action: mode === 'restore' ? 'DUMMY_DATA_RESTORED' : 'DUMMY_DATA_PURGED',
      resource: 'sync',
      status: 'ALLOWED',
      ip: getClientIp(req),
      detail:
        body.ringkasan ||
        (mode === 'restore'
          ? 'Pemulihan data simulasi/dummy bawaan dilakukan melalui server sync.'
          : 'Pembersihan (purge) selektif data dummy dilakukan; data pengguna, RBAC, CoA, pajak, dan pengaturan situs dipertahankan.')
    });

    res.json({
      ok: true,
      mode,
      revision: result.revision,
      versions,
      deleted: result.deleted
    });
  });

  app.post('/api/sync/reset', requirePermission('rbac-admin', 'delete'), (req, res) => {
    const revision = dataSyncStore.resetAll();
    const sourceClientId =
      typeof (req.body as { clientId?: string } | undefined)?.clientId === 'string'
        ? (req.body as { clientId?: string }).clientId
        : undefined;
    broadcastMessage({ type: 'sync:reset', revision, sourceClientId: sourceClientId || null }, true);
    rbacStore.recordAudit({
      actorUsername: req.auth!.user.username,
      actorRole: req.auth!.role.id,
      action: 'SYNC_RESET',
      resource: 'sync',
      status: 'ALLOWED',
      ip: getClientIp(req),
      detail: 'Reset seluruh state sinkronisasi server ke bawaan awal.'
    });
    res.json({ ok: true, revision });
  });

  // IT & DevOps Deployment Guide & Config for Caddy + NSSM Windows Server (Firebase Staging)
  app.get('/api/system/deployment-guides', requirePermission('it-traceability', 'view'), (_req, res) => {
    const fbCfg = readFirebaseClientConfig();
    const envInfo = resolveDeploymentEnvironment();
    let domainFromEnv = '';
    try {
      domainFromEnv = envInfo.appUrl.startsWith('http') ? new URL(envInfo.appUrl).hostname : '';
    } catch {
      domainFromEnv = '';
    }
    const domain =
      domainFromEnv && domainFromEnv !== 'localhost' && domainFromEnv !== '127.0.0.1'
        ? domainFromEnv
        : 'ams.bejodigitalprint.com';

    res.json(
      buildWindowsDeploymentGuides({
        domain,
        deploymentEnv: envInfo.isStaging ? 'staging' : 'staging',
        activeDriver: dbDriverManager.getActiveDriver(),
        firebaseProjectId: fbCfg?.projectId
      })
    );
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
  app.get('/api/website/media/:id', (req, res) => {
    const media = dataSyncStore.getPublicWebsiteMedia(req.params.id, bacaSnapshot());
    if (!media) {
      return res.status(404).json({ pesan: 'Media situs tidak ditemukan atau belum diterbitkan.' });
    }
    res
      .set({
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'X-Content-Type-Options': 'nosniff'
      })
      .type(media.contentType)
      .send(media.bytes);
  });

  app.get('/api/website/published', (req, res) => {
    const snapshot = bacaSnapshot();
    if (!snapshot) return res.status(404).json({ pesan: 'Belum ada konten situs yang diterbitkan.' });
    res.set('Cache-Control', 'no-store').json({ config: snapshot });
  });

  const translationHits = new Map<string, { count: number; reset: number }>();
  const TRANSLATION_WINDOW_MS = 15 * 60 * 1000;
  const TRANSLATION_MAX_HITS = 20;
  app.get('/api/website/translation/en', async (req, res) => {
    const now = Date.now();
    const ip = getClientIp(req);
    const current = translationHits.get(ip);
    if (!current || current.reset <= now) {
      translationHits.set(ip, { count: 1, reset: now + TRANSLATION_WINDOW_MS });
    } else if (current.count >= TRANSLATION_MAX_HITS) {
      return res.status(429).json({
        error: 'WEBSITE_TRANSLATION_RATE_LIMITED',
        message: 'Terlalu banyak permintaan terjemahan. Coba lagi beberapa menit.'
      });
    } else {
      current.count += 1;
    }

    const snapshot = bacaSnapshot();
    if (!snapshot) return res.status(404).json({ error: 'WEBSITE_NOT_PUBLISHED', message: 'Belum ada konten situs yang diterbitkan.' });
    try {
      const translated = await websiteTranslationService.translate(snapshot);
      return res.set('Cache-Control', 'no-store').json({
        config: translated.config,
        sourceHash: translated.sourceHash,
        sourceVersion: snapshot.lastModifiedAt
      });
    } catch (error) {
      if (error instanceof WebsiteTranslationError) {
        return res.status(error.statusCode).json({ error: error.code, message: error.message });
      }
      console.error('[website-translation] Gagal menerjemahkan snapshot situs.', error);
      return res.status(500).json({
        error: 'WEBSITE_TRANSLATION_FAILED',
        message: 'Terjadi kesalahan saat menyiapkan terjemahan situs.'
      });
    }
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
      const synced = dataSyncStore.setKey(
        'website_published',
        terautentikasi,
        req.auth ? req.auth.user.username : 'admin-token'
      );
      broadcastSyncUpdate(
        'website_published',
        synced.entry,
        synced.revision,
        typeof req.headers['x-sync-client-id'] === 'string' ? req.headers['x-sync-client-id'] : undefined
      );
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
        revision: synced.revision,
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
    app.get(['/mobile', '/mobile/*'], (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
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
    app.get(['/mobile', '/mobile/*'], async (req, res, next) => {
      try {
        const mentah = fs.readFileSync(BERKAS_INDEKS, 'utf8');
        const html = await vite.transformIndexHtml(req.originalUrl, mentah);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        next(e);
      }
    });
    app.use(vite.middlewares);
  }

  // Isolasi WebSocket /api/sync/ws agar tidak bentrok dengan listener upgrade Vite HMR
  const existingUpgradeListeners = httpServer.listeners('upgrade').slice();
  httpServer.removeAllListeners('upgrade');
  httpServer.on('upgrade', (req, socket, head) => {
    const pathname = (req.url || '/').split('?')[0];
    if (pathname === '/api/sync/ws') {
      syncWss.handleUpgrade(req, socket, head, (ws) => {
        syncWss.emit('connection', ws, req);
      });
      return;
    }
    for (const fn of existingUpgradeListeners) {
      (fn as (...args: unknown[]) => void).call(httpServer, req, socket, head);
    }
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`AMS Integrated System Backend aktif di port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Gagal menjalankan server:', err);
  process.exit(1);
});
