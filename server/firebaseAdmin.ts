import fs from 'fs';
import path from 'path';
import {
  applicationDefault,
  cert,
  deleteApp,
  getApps,
  initializeApp,
  type App,
  type Credential,
  type ServiceAccount
} from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

export const DEFAULT_FIRESTORE_DATABASE_ID =
  'ai-studio-amsintegratedsys-a6cc9862-667b-4eea-be94-96098a1c9439';

export const FIREBASE_ADMIN_APP_NAME = 'ams-firebase-admin';

export type FirebaseAdminCredentialSource =
  | 'service-account-json'
  | 'service-account-file'
  | 'env-keypair'
  | 'adc'
  | 'unconfigured';

export interface FirebaseAdminResolvedConfig {
  projectId: string;
  databaseId: string;
  credentialSource: FirebaseAdminCredentialSource;
  serviceAccount?: ServiceAccount;
  serviceAccountFilePath?: string;
  configError?: string;
}

export interface FirebaseAdminStatus {
  initialized: boolean;
  connected: boolean;
  credentialSource: FirebaseAdminCredentialSource;
  projectId: string | null;
  databaseId: string;
  serviceAccountEmailMasked?: string | null;
  verifiedAt?: string | null;
  latencyMs?: number | null;
  collectionCount?: number | null;
  lastError?: string | null;
}

export type ServiceAccountJsonValidationStatus = 'valid' | 'missing' | 'placeholder' | 'invalid';

export interface FirestoreDatabaseIdResolution {
  databaseId: string;
  source:
    | 'FIRESTORE_DATABASE_ID'
    | 'FIREBASE_FIRESTORE_DATABASE_ID'
    | 'VITE_FIRESTORE_DATABASE_ID'
    | 'firebase-applet-config.json'
    | 'default';
  matchesExpectedDatabaseId: boolean;
}

export interface VpsFirebaseValidationResult {
  isVpsRuntime: boolean;
  hasServiceAccountJson: boolean;
  serviceAccountJsonValid: boolean;
  serviceAccountJsonStatus: ServiceAccountJsonValidationStatus;
  hasAlternativeCredential: boolean;
  credentialSource: FirebaseAdminCredentialSource;
  projectId: string | null;
  firestoreDatabaseId: string;
  databaseIdSource: FirestoreDatabaseIdResolution['source'];
  databaseIdMatchesTarget: boolean;
  serviceAccountEmailMasked: string | null;
  readyForStableConnection: boolean;
  warnings: string[];
  errors: string[];
}

interface RawServiceAccountJson {
  project_id?: unknown;
  projectId?: unknown;
  client_email?: unknown;
  clientEmail?: unknown;
  private_key?: unknown;
  privateKey?: unknown;
}

let cachedApp: App | null = null;
let cachedDb: Firestore | null = null;
let cachedAuth: Auth | null = null;
let currentStatus: FirebaseAdminStatus = {
  initialized: false,
  connected: false,
  credentialSource: 'unconfigured',
  projectId: null,
  databaseId: DEFAULT_FIRESTORE_DATABASE_ID,
  serviceAccountEmailMasked: null,
  verifiedAt: null,
  latencyMs: null,
  collectionCount: null,
  lastError: null
};

export function normalizePrivateKey(rawKey: string): string {
  return rawKey
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n');
}

export function maskClientEmail(email?: string | null): string | null {
  if (!email || !email.includes('@')) return null;
  const [local, domain] = email.split('@');
  if (local.length <= 4) return `***@${domain}`;
  return `${local.slice(0, 3)}***${local.slice(-2)}@${domain}`;
}

function readAppletConfigFile(rootDir: string): { projectId?: string; firestoreDatabaseId?: string } {
  try {
    const cfgPath = path.resolve(rootDir, 'firebase-applet-config.json');
    if (!fs.existsSync(cfgPath)) return {};
    const raw = JSON.parse(fs.readFileSync(cfgPath, 'utf8')) as {
      projectId?: unknown;
      firestoreDatabaseId?: unknown;
    };
    return {
      projectId: typeof raw.projectId === 'string' ? raw.projectId.trim() : undefined,
      firestoreDatabaseId:
        typeof raw.firestoreDatabaseId === 'string' ? raw.firestoreDatabaseId.trim() : undefined
    };
  } catch {
    return {};
  }
}

function parseServiceAccountObject(
  raw: RawServiceAccountJson,
  fallbackProjectId: string
): { ok: true; account: ServiceAccount } | { ok: false; error: string } {
  const projectId =
    (typeof raw.project_id === 'string' && raw.project_id.trim()) ||
    (typeof raw.projectId === 'string' && raw.projectId.trim()) ||
    fallbackProjectId;
  const clientEmail =
    (typeof raw.client_email === 'string' && raw.client_email.trim()) ||
    (typeof raw.clientEmail === 'string' && raw.clientEmail.trim()) ||
    '';
  const rawPrivateKey =
    (typeof raw.private_key === 'string' && raw.private_key) ||
    (typeof raw.privateKey === 'string' && raw.privateKey) ||
    '';

  if (!clientEmail || !rawPrivateKey) {
    return {
      ok: false,
      error: 'Service Account JSON tidak lengkap (client_email atau private_key kosong).'
    };
  }

  return {
    ok: true,
    account: {
      projectId: projectId || undefined,
      clientEmail,
      privateKey: normalizePrivateKey(rawPrivateKey)
    }
  };
}

function decodeServiceAccountJsonString(
  rawValue: string,
  fallbackProjectId: string
): { ok: true; account: ServiceAccount } | { ok: false; error: string } {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return { ok: false, error: 'FIREBASE_SERVICE_ACCOUNT_JSON kosong.' };
  }

  const candidateTexts: string[] = [trimmed];
  if (!trimmed.startsWith('{')) {
    try {
      const decoded = Buffer.from(trimmed, 'base64').toString('utf8').trim();
      if (decoded.startsWith('{')) {
        candidateTexts.unshift(decoded);
      }
    } catch {
      /* abaikan gagal decode base64 */
    }
  }

  for (const text of candidateTexts) {
    try {
      const parsed = JSON.parse(text) as RawServiceAccountJson;
      if (parsed && typeof parsed === 'object') {
        return parseServiceAccountObject(parsed, fallbackProjectId);
      }
    } catch {
      /* lanjut ke kandidat berikutnya */
    }
  }

  return {
    ok: false,
    error: 'FIREBASE_SERVICE_ACCOUNT_JSON bukan JSON atau Base64 Service Account yang valid.'
  };
}

export function resolveWindowsFriendlyPath(rawPath: string, rootDir: string): string {
  const clean = rawPath.trim().replace(/^["']|["']$/g, '');
  if (!clean) return '';
  if (path.isAbsolute(clean) || /^[a-zA-Z]:[\\/]/.test(clean) || clean.startsWith('\\\\')) {
    return clean;
  }
  return path.resolve(rootDir, clean);
}

export function isAiStudioPreviewRuntime(env: Record<string, string | undefined> = process.env): boolean {
  if (env.FORCE_STAGING_IN_PREVIEW === 'true' || env.VITE_FORCE_STAGING_IN_PREVIEW === 'true') {
    return false;
  }
  const kService = (env.K_SERVICE || '').trim();
  const appUrl = (env.APP_URL || '').trim();
  return /^ais-(?:dev|pre)-/i.test(kService) || /^https?:\/\/ais-(?:dev|pre)-/i.test(appUrl);
}

export function isPlaceholderEnvValue(raw?: string | null): boolean {
  const cleaned = (raw || '').trim().replace(/^["']|["']$/g, '');
  if (!cleaned) return true;
  return /^(?:GANTI_|MY_|YOUR_|PLACEHOLDER|<[^>]+>)/i.test(cleaned);
}

export function resolveFirestoreDatabaseId(opts?: {
  rootDir?: string;
  env?: Record<string, string | undefined>;
  expectedDatabaseId?: string;
}): FirestoreDatabaseIdResolution {
  const rootDir = opts?.rootDir || process.cwd();
  const env = opts?.env || process.env;
  const expected = (opts?.expectedDatabaseId || DEFAULT_FIRESTORE_DATABASE_ID).trim();
  const appletCfg = readAppletConfigFile(rootDir);
  const inAiStudioPreview = isAiStudioPreviewRuntime(env);

  const cleanVal = (v?: string) => (v || '').trim().replace(/^["']|["']$/g, '');
  const firebaseDbEnv = cleanVal(env.FIREBASE_FIRESTORE_DATABASE_ID);
  const firestoreDbEnv = cleanVal(env.FIRESTORE_DATABASE_ID);
  const viteDbEnv = cleanVal(env.VITE_FIRESTORE_DATABASE_ID);
  const appletDb = cleanVal(appletCfg.firestoreDatabaseId);

  let databaseId = DEFAULT_FIRESTORE_DATABASE_ID;
  let source: FirestoreDatabaseIdResolution['source'] = 'default';

  if (firestoreDbEnv && !isPlaceholderEnvValue(firestoreDbEnv)) {
    databaseId = firestoreDbEnv;
    source = 'FIRESTORE_DATABASE_ID';
  } else if (firebaseDbEnv && !isPlaceholderEnvValue(firebaseDbEnv)) {
    databaseId = firebaseDbEnv;
    source = 'FIREBASE_FIRESTORE_DATABASE_ID';
  } else if (!inAiStudioPreview && viteDbEnv && !isPlaceholderEnvValue(viteDbEnv)) {
    databaseId = viteDbEnv;
    source = 'VITE_FIRESTORE_DATABASE_ID';
  } else if (appletDb && !isPlaceholderEnvValue(appletDb)) {
    databaseId = appletDb;
    source = 'firebase-applet-config.json';
  }

  return {
    databaseId,
    source,
    matchesExpectedDatabaseId: databaseId === expected
  };
}

export function resolveFirebaseAdminConfig(opts?: {
  rootDir?: string;
  env?: Record<string, string | undefined>;
}): FirebaseAdminResolvedConfig {
  const rootDir = opts?.rootDir || process.cwd();
  const env = opts?.env || process.env;
  const appletCfg = readAppletConfigFile(rootDir);
  const inAiStudioPreview = isAiStudioPreviewRuntime(env);

  let projectId = inAiStudioPreview
    ? env.FIREBASE_PROJECT_ID?.trim() ||
      appletCfg.projectId ||
      env.GOOGLE_CLOUD_PROJECT?.trim() ||
      env.GCLOUD_PROJECT?.trim() ||
      env.VITE_FIREBASE_PROJECT_ID?.trim() ||
      ''
    : env.FIREBASE_PROJECT_ID?.trim() ||
      env.GOOGLE_CLOUD_PROJECT?.trim() ||
      env.GCLOUD_PROJECT?.trim() ||
      env.VITE_FIREBASE_PROJECT_ID?.trim() ||
      appletCfg.projectId ||
      '';

  const { databaseId } = resolveFirestoreDatabaseId({ rootDir, env });

  // 1. Inline JSON / Base64 JSON (cocok untuk secret manager atau .env single-line)
  const rawJson = env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (rawJson && !isPlaceholderEnvValue(rawJson)) {
    const parsed = decodeServiceAccountJsonString(rawJson, projectId);
    if (!parsed.ok) {
      return {
        projectId,
        databaseId,
        credentialSource: 'unconfigured',
        configError: parsed.error
      };
    }
    return {
      projectId: parsed.account.projectId || projectId,
      databaseId,
      credentialSource: 'service-account-json',
      serviceAccount: parsed.account
    };
  }

  // 2. File JSON terpisah di disk (rekomendasi Windows VPS: C:\AMS\Secrets\firebase-service-account.json)
  const rawFilePath =
    env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim() ||
    env.GOOGLE_APPLICATION_CREDENTIALS?.trim() ||
    '';
  if (rawFilePath) {
    const resolvedPath = resolveWindowsFriendlyPath(rawFilePath, rootDir);
    if (!fs.existsSync(resolvedPath)) {
      return {
        projectId,
        databaseId,
        credentialSource: 'unconfigured',
        serviceAccountFilePath: resolvedPath,
        configError: `File Service Account Firebase tidak ditemukan di: ${resolvedPath}`
      };
    }
    try {
      const content = fs.readFileSync(resolvedPath, 'utf8');
      const parsedJson = JSON.parse(content) as RawServiceAccountJson;
      const parsed = parseServiceAccountObject(parsedJson, projectId);
      if (!parsed.ok) {
        return {
          projectId,
          databaseId,
          credentialSource: 'unconfigured',
          serviceAccountFilePath: resolvedPath,
          configError: `${parsed.error} (${resolvedPath})`
        };
      }
      return {
        projectId: parsed.account.projectId || projectId,
        databaseId,
        credentialSource: 'service-account-file',
        serviceAccount: parsed.account,
        serviceAccountFilePath: resolvedPath
      };
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'Gagal membaca file JSON';
      return {
        projectId,
        databaseId,
        credentialSource: 'unconfigured',
        serviceAccountFilePath: resolvedPath,
        configError: `File Service Account tidak valid (${resolvedPath}): ${detail}`
      };
    }
  }

  // 3. Keypair terpisah via variabel environment (FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY)
  const clientEmail = env.FIREBASE_CLIENT_EMAIL?.trim() || '';
  const privateKey = env.FIREBASE_PRIVATE_KEY || '';
  if (clientEmail && privateKey.trim()) {
    const parsed = parseServiceAccountObject(
      {
        projectId,
        clientEmail,
        privateKey
      },
      projectId
    );
    if (!parsed.ok) {
      return {
        projectId,
        databaseId,
        credentialSource: 'unconfigured',
        configError: parsed.error
      };
    }
    return {
      projectId: parsed.account.projectId || projectId,
      databaseId,
      credentialSource: 'env-keypair',
      serviceAccount: parsed.account
    };
  }

  // 4. GCP Application Default Credentials (hanya diaktifkan eksplisit atau di lingkungan GCP Cloud Run)
  const useAdc =
    env.FIREBASE_USE_ADC === 'true' || Boolean(env.K_SERVICE || env.CLOUD_RUN_JOB);
  if (useAdc && projectId) {
    return {
      projectId,
      databaseId,
      credentialSource: 'adc'
    };
  }

  return {
    projectId,
    databaseId,
    credentialSource: 'unconfigured',
    configError:
      'Kredensial Firebase Admin SDK belum dikonfigurasi (atur FIREBASE_SERVICE_ACCOUNT_JSON atau FIREBASE_SERVICE_ACCOUNT_PATH untuk koneksi server-to-server penuh).'
  };
}

export function validateVpsFirebaseConfig(opts?: {
  rootDir?: string;
  env?: Record<string, string | undefined>;
  expectedDatabaseId?: string;
}): VpsFirebaseValidationResult {
  const rootDir = opts?.rootDir || process.cwd();
  const env = opts?.env || process.env;
  const expectedDb = (opts?.expectedDatabaseId || DEFAULT_FIRESTORE_DATABASE_ID).trim();
  const isVpsRuntime = !isAiStudioPreviewRuntime(env);

  const dbResolution = resolveFirestoreDatabaseId({
    rootDir,
    env,
    expectedDatabaseId: expectedDb
  });
  const resolved = resolveFirebaseAdminConfig({ rootDir, env });

  const rawServiceAccountJson = (env.FIREBASE_SERVICE_ACCOUNT_JSON || '').trim();
  const hasServiceAccountJson = rawServiceAccountJson.length > 0;
  let serviceAccountJsonStatus: ServiceAccountJsonValidationStatus = 'missing';
  let serviceAccountJsonValid = false;
  const warnings: string[] = [];
  const errors: string[] = [];

  if (hasServiceAccountJson) {
    if (isPlaceholderEnvValue(rawServiceAccountJson)) {
      serviceAccountJsonStatus = 'placeholder';
      warnings.push(
        'FIREBASE_SERVICE_ACCOUNT_JSON masih berisi nilai placeholder contoh; ganti dengan Service Account JSON / Base64 asli di VPS.'
      );
    } else {
      const decoded = decodeServiceAccountJsonString(rawServiceAccountJson, resolved.projectId);
      if (!decoded.ok) {
        serviceAccountJsonStatus = 'invalid';
        errors.push(decoded.error);
      } else if (
        !decoded.account.privateKey?.includes('BEGIN') ||
        !decoded.account.privateKey?.includes('PRIVATE KEY')
      ) {
        serviceAccountJsonStatus = 'invalid';
        errors.push('private_key pada FIREBASE_SERVICE_ACCOUNT_JSON tidak berformat PEM yang valid.');
      } else {
        serviceAccountJsonStatus = 'valid';
        serviceAccountJsonValid = true;
      }
    }
  } else {
    warnings.push(
      'FIREBASE_SERVICE_ACCOUNT_JSON tidak ditemukan di environment; server memeriksa sumber kredensial alternatif (FIREBASE_SERVICE_ACCOUNT_PATH / GOOGLE_APPLICATION_CREDENTIALS).'
    );
  }

  const hasAlternativeCredential =
    resolved.credentialSource === 'service-account-file' ||
    resolved.credentialSource === 'env-keypair' ||
    resolved.credentialSource === 'adc';

  if (resolved.credentialSource === 'unconfigured' && resolved.configError && errors.length === 0) {
    if (isVpsRuntime) {
      errors.push(resolved.configError);
    } else {
      warnings.push(resolved.configError);
    }
  }

  if (!dbResolution.matchesExpectedDatabaseId) {
    warnings.push(
      `FIRESTORE_DATABASE_ID aktif (${dbResolution.databaseId}, sumber=${dbResolution.source}) berbeda dari target database (${expectedDb}).`
    );
  }

  if (
    dbResolution.source !== 'FIRESTORE_DATABASE_ID' &&
    dbResolution.source !== 'FIREBASE_FIRESTORE_DATABASE_ID' &&
    isVpsRuntime
  ) {
    warnings.push(
      `FIRESTORE_DATABASE_ID belum diset eksplisit di environment VPS; memuat nilai fallback "${dbResolution.databaseId}" dari ${dbResolution.source}.`
    );
  }

  if (!resolved.projectId) {
    errors.push('Project ID Firebase belum terdefinisi untuk koneksi Admin SDK.');
  }

  const readyForStableConnection =
    Boolean(resolved.projectId) &&
    Boolean(dbResolution.databaseId) &&
    (serviceAccountJsonValid || hasAlternativeCredential);

  return {
    isVpsRuntime,
    hasServiceAccountJson,
    serviceAccountJsonValid,
    serviceAccountJsonStatus,
    hasAlternativeCredential,
    credentialSource: resolved.credentialSource,
    projectId: resolved.projectId || null,
    firestoreDatabaseId: dbResolution.databaseId,
    databaseIdSource: dbResolution.source,
    databaseIdMatchesTarget: dbResolution.matchesExpectedDatabaseId,
    serviceAccountEmailMasked: maskClientEmail(resolved.serviceAccount?.clientEmail),
    readyForStableConnection,
    warnings,
    errors
  };
}

export function initializeFirebaseAdmin(opts?: {
  rootDir?: string;
  env?: Record<string, string | undefined>;
  forceReinit?: boolean;
}): FirebaseAdminStatus {
  const resolved = resolveFirebaseAdminConfig(opts);

  if (
    !opts?.forceReinit &&
    cachedApp &&
    cachedDb &&
    currentStatus.initialized &&
    currentStatus.databaseId === resolved.databaseId &&
    currentStatus.projectId === (resolved.projectId || null) &&
    currentStatus.credentialSource === resolved.credentialSource
  ) {
    return { ...currentStatus };
  }

  if (resolved.credentialSource === 'unconfigured') {
    cachedApp = null;
    cachedDb = null;
    cachedAuth = null;
    currentStatus = {
      initialized: false,
      connected: false,
      credentialSource: 'unconfigured',
      projectId: resolved.projectId || null,
      databaseId: resolved.databaseId,
      serviceAccountEmailMasked: null,
      verifiedAt: null,
      latencyMs: null,
      collectionCount: null,
      lastError: resolved.configError || null
    };
    return { ...currentStatus };
  }

  if (!resolved.projectId) {
    cachedApp = null;
    cachedDb = null;
    cachedAuth = null;
    currentStatus = {
      initialized: false,
      connected: false,
      credentialSource: 'unconfigured',
      projectId: null,
      databaseId: resolved.databaseId,
      serviceAccountEmailMasked: maskClientEmail(resolved.serviceAccount?.clientEmail),
      verifiedAt: null,
      latencyMs: null,
      collectionCount: null,
      lastError: 'Project ID Firebase tidak ditemukan untuk inisialisasi Admin SDK.'
    };
    return { ...currentStatus };
  }

  try {
    let credential: Credential;
    if (resolved.credentialSource === 'adc') {
      credential = applicationDefault();
    } else if (resolved.serviceAccount) {
      credential = cert(resolved.serviceAccount);
    } else {
      throw new Error('Objek kredensial Service Account tidak tersedia.');
    }

    const existingApp = getApps().find((a) => a.name === FIREBASE_ADMIN_APP_NAME);
    const app = existingApp
      ? existingApp
      : initializeApp(
          {
            credential,
            projectId: resolved.projectId
          },
          FIREBASE_ADMIN_APP_NAME
        );

    const db = getFirestore(app, resolved.databaseId);
    try {
      db.settings({ ignoreUndefinedProperties: true });
    } catch {
      /* Firestore instance sudah dikonfigurasi sebelumnya */
    }
    const auth = getAuth(app);

    cachedApp = app;
    cachedDb = db;
    cachedAuth = auth;
    currentStatus = {
      initialized: true,
      connected: false,
      credentialSource: resolved.credentialSource,
      projectId: resolved.projectId,
      databaseId: resolved.databaseId,
      serviceAccountEmailMasked: maskClientEmail(resolved.serviceAccount?.clientEmail),
      verifiedAt: null,
      latencyMs: null,
      collectionCount: null,
      lastError: null
    };
    return { ...currentStatus };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal menginisialisasi Firebase Admin SDK.';
    cachedApp = null;
    cachedDb = null;
    cachedAuth = null;
    currentStatus = {
      initialized: false,
      connected: false,
      credentialSource: 'unconfigured',
      projectId: resolved.projectId || null,
      databaseId: resolved.databaseId,
      serviceAccountEmailMasked: maskClientEmail(resolved.serviceAccount?.clientEmail),
      verifiedAt: null,
      latencyMs: null,
      collectionCount: null,
      lastError: message
    };
    return { ...currentStatus };
  }
}

function isTransientFirestoreConnectionError(err: unknown): boolean {
  const code = String((err as { code?: unknown } | null)?.code || '').toUpperCase();
  const msg = (err instanceof Error ? err.message : String(err || '')).toLowerCase();
  if (code === '7' || code === 'PERMISSION_DENIED' || code === '16' || code === 'UNAUTHENTICATED') {
    return false;
  }
  if (msg.includes('permission_denied') || msg.includes('unauthenticated') || msg.includes('invalid_grant')) {
    return false;
  }
  return (
    code === '14' ||
    code === '4' ||
    code === 'UNAVAILABLE' ||
    code === 'DEADLINE_EXCEEDED' ||
    msg.includes('timeout') ||
    msg.includes('unavailable') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('enotfound')
  );
}

export async function verifyFirebaseAdminFirestoreConnection(
  timeoutMs = 8000,
  maxAttempts = 3
): Promise<FirebaseAdminStatus> {
  if (!cachedDb || !currentStatus.initialized) {
    return { ...currentStatus };
  }

  const attempts = Math.max(1, Math.min(5, Math.floor(maxAttempts)));
  const started = Date.now();
  let lastMessage = 'Gagal memverifikasi koneksi Firestore Admin SDK.';

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let timer: NodeJS.Timeout | undefined;
    try {
      const collections = await Promise.race([
        cachedDb.listCollections(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            reject(new Error(`Timeout koneksi Firestore Admin (${timeoutMs} ms)`));
          }, timeoutMs);
        })
      ]);
      currentStatus = {
        ...currentStatus,
        connected: true,
        verifiedAt: new Date().toISOString(),
        latencyMs: Date.now() - started,
        collectionCount: collections.length,
        lastError: null
      };
      if (timer) clearTimeout(timer);
      return { ...currentStatus };
    } catch (err) {
      if (timer) clearTimeout(timer);
      lastMessage =
        err instanceof Error ? err.message : 'Gagal memverifikasi koneksi Firestore Admin SDK.';
      if (attempt < attempts && isTransientFirestoreConnectionError(err)) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 600));
        continue;
      }
      break;
    }
  }

  currentStatus = {
    ...currentStatus,
    connected: false,
    verifiedAt: new Date().toISOString(),
    latencyMs: Date.now() - started,
    lastError: lastMessage
  };
  return { ...currentStatus };
}

export async function verifyIdTokenViaAdmin(idToken: string): Promise<
  | { ok: true; uid: string; email: string; emailVerified: boolean; displayName: string }
  | { ok: false; fallbackToRest: boolean; message: string }
> {
  if (!cachedAuth || !currentStatus.initialized) {
    return {
      ok: false,
      fallbackToRest: true,
      message: 'Firebase Admin SDK Auth belum diinisialisasi.'
    };
  }

  try {
    const decoded = await cachedAuth.verifyIdToken(idToken);
    const email = typeof decoded.email === 'string' ? decoded.email.trim().toLowerCase() : '';
    if (!decoded.uid || !email) {
      return {
        ok: false,
        fallbackToRest: false,
        message: 'Akun Firebase tidak memiliki alamat email yang sah.'
      };
    }
    if (!decoded.email_verified) {
      return {
        ok: false,
        fallbackToRest: false,
        message: 'Email akun Google belum terverifikasi.'
      };
    }
    return {
      ok: true,
      uid: decoded.uid,
      email,
      emailVerified: true,
      displayName: typeof decoded.name === 'string' && decoded.name ? decoded.name : email
    };
  } catch (err) {
    const code = (err as { code?: string } | null)?.code || '';
    if (
      code.startsWith('auth/id-token-') ||
      code === 'auth/argument-error' ||
      code === 'auth/user-disabled' ||
      code === 'auth/user-not-found'
    ) {
      return {
        ok: false,
        fallbackToRest: false,
        message: 'Token Firebase tidak valid atau sudah kedaluwarsa.'
      };
    }
    // Jika verifikasi via ADC/jaringan internal gagal sementara, izinkan fallback ke Identity Toolkit REST
    return {
      ok: false,
      fallbackToRest: currentStatus.credentialSource === 'adc',
      message: err instanceof Error ? err.message : 'Gagal memverifikasi token Firebase.'
    };
  }
}

export function getFirebaseAdminApp(): App | null {
  return cachedApp;
}

export function getFirebaseAdminDb(): Firestore | null {
  return cachedDb;
}

export function getFirebaseAdminAuth(): Auth | null {
  return cachedAuth;
}

export function getFirebaseAdminStatus(): FirebaseAdminStatus {
  return { ...currentStatus };
}

export async function resetFirebaseAdminForTests(): Promise<void> {
  const existing = getApps().find((a) => a.name === FIREBASE_ADMIN_APP_NAME);
  if (existing) {
    await deleteApp(existing);
  }
  cachedApp = null;
  cachedDb = null;
  cachedAuth = null;
  currentStatus = {
    initialized: false,
    connected: false,
    credentialSource: 'unconfigured',
    projectId: null,
    databaseId: DEFAULT_FIRESTORE_DATABASE_ID,
    serviceAccountEmailMasked: null,
    verifiedAt: null,
    latencyMs: null,
    collectionCount: null,
    lastError: null
  };
}
