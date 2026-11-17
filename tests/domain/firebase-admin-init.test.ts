import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_FIRESTORE_DATABASE_ID,
  getFirebaseAdminApp,
  getFirebaseAdminAuth,
  getFirebaseAdminDb,
  getFirebaseAdminStatus,
  initializeFirebaseAdmin,
  maskClientEmail,
  normalizePrivateKey,
  resetFirebaseAdminForTests,
  resolveFirebaseAdminConfig,
  resolveWindowsFriendlyPath
} from '../../server/firebaseAdmin';

function generateEphemeralRsaPrivateKeyPem(): string {
  const { privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    },
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    }
  });
  return privateKey;
}

describe('Firebase Admin SDK & Named Firestore Database (Windows VPS)', () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await resetFirebaseAdminForTests();
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop();
      if (dir && fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  it('menormalisasi private key \\n dan menyamarkan email service account secara aman', () => {
    const escaped = '"-----BEGIN PRIVATE KEY-----\\nABC123\\n-----END PRIVATE KEY-----\\n"';
    expect(normalizePrivateKey(escaped)).toBe(
      '-----BEGIN PRIVATE KEY-----\nABC123\n-----END PRIVATE KEY-----\n'
    );
    expect(maskClientEmail('firebase-adminsdk-xyz@sixth-cedar-f5v9p.iam.gserviceaccount.com')).toBe(
      'fir***yz@sixth-cedar-f5v9p.iam.gserviceaccount.com'
    );
  });

  it('mempertahankan path gaya Windows (C:\\AMS\\Secrets\\...) dan meresolve path relatif', () => {
    const winPath = 'C:\\AMS\\Secrets\\firebase-service-account.json';
    expect(resolveWindowsFriendlyPath(winPath, '/app/applet')).toBe(winPath);

    const relPath = resolveWindowsFriendlyPath('secrets/sa.json', '/tmp/ams-vps');
    expect(relPath).toBe(path.resolve('/tmp/ams-vps', 'secrets/sa.json'));
  });

  it('menggunakan mode unconfigured tanpa crash bila kredensial Admin SDK belum dipasang', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ams-fb-admin-empty-'));
    tempDirs.push(dir);
    fs.writeFileSync(
      path.join(dir, 'firebase-applet-config.json'),
      JSON.stringify({
        projectId: 'sixth-cedar-f5v9p',
        firestoreDatabaseId: DEFAULT_FIRESTORE_DATABASE_ID
      }),
      'utf8'
    );

    const status = initializeFirebaseAdmin({ rootDir: dir, env: {}, forceReinit: true });
    expect(status.initialized).toBe(false);
    expect(status.connected).toBe(false);
    expect(status.credentialSource).toBe('unconfigured');
    expect(status.projectId).toBe('sixth-cedar-f5v9p');
    expect(status.databaseId).toBe(
      'ai-studio-amsintegratedsys-a6cc9862-667b-4eea-be94-96098a1c9439'
    );
    expect(getFirebaseAdminApp()).toBeNull();
    expect(getFirebaseAdminDb()).toBeNull();
  });

  it('melaporkan error yang jelas tanpa melempar exception bila file Service Account tidak ditemukan', () => {
    const missingPath = path.join(os.tmpdir(), 'tidak-ada-service-account-ams.json');
    const resolved = resolveFirebaseAdminConfig({
      rootDir: os.tmpdir(),
      env: {
        FIREBASE_PROJECT_ID: 'ams-staging-test',
        FIREBASE_FIRESTORE_DATABASE_ID: DEFAULT_FIRESTORE_DATABASE_ID,
        FIREBASE_SERVICE_ACCOUNT_PATH: missingPath
      }
    });

    expect(resolved.credentialSource).toBe('unconfigured');
    expect(resolved.databaseId).toBe(DEFAULT_FIRESTORE_DATABASE_ID);
    expect(resolved.configError).toContain(missingPath);
  });

  it('menginisialisasi Firebase Admin App, Auth, dan Firestore bernama via FIREBASE_SERVICE_ACCOUNT_PATH', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ams-fb-admin-file-'));
    tempDirs.push(dir);

    const keyPath = path.join(dir, 'firebase-service-account.json');
    const privateKey = generateEphemeralRsaPrivateKeyPem();
    fs.writeFileSync(
      keyPath,
      JSON.stringify({
        type: 'service_account',
        project_id: 'sixth-cedar-f5v9p',
        private_key_id: 'ephemeral-test-key',
        private_key: privateKey,
        client_email: 'firebase-adminsdk-ams@sixth-cedar-f5v9p.iam.gserviceaccount.com'
      }),
      'utf8'
    );

    const status = initializeFirebaseAdmin({
      rootDir: dir,
      env: {
        FIREBASE_SERVICE_ACCOUNT_PATH: keyPath,
        FIREBASE_FIRESTORE_DATABASE_ID: DEFAULT_FIRESTORE_DATABASE_ID
      },
      forceReinit: true
    });

    expect(status.initialized).toBe(true);
    expect(status.credentialSource).toBe('service-account-file');
    expect(status.projectId).toBe('sixth-cedar-f5v9p');
    expect(status.databaseId).toBe(
      'ai-studio-amsintegratedsys-a6cc9862-667b-4eea-be94-96098a1c9439'
    );
    expect(status.serviceAccountEmailMasked).toBe(
      'fir***ms@sixth-cedar-f5v9p.iam.gserviceaccount.com'
    );

    const db = getFirebaseAdminDb();
    expect(db).not.toBeNull();
    expect(db?.databaseId).toBe(
      'ai-studio-amsintegratedsys-a6cc9862-667b-4eea-be94-96098a1c9439'
    );
    expect(getFirebaseAdminAuth()).not.toBeNull();
    expect(getFirebaseAdminStatus().initialized).toBe(true);
  });

  it('mendukung FIREBASE_SERVICE_ACCOUNT_JSON dalam format Base64 dengan databaseId eksplisit', () => {
    const privateKey = generateEphemeralRsaPrivateKeyPem();
    const encoded = Buffer.from(
      JSON.stringify({
        project_id: 'ams-windows-staging',
        client_email: 'staging-sa@ams-windows-staging.iam.gserviceaccount.com',
        private_key: privateKey
      }),
      'utf8'
    ).toString('base64');

    const status = initializeFirebaseAdmin({
      rootDir: os.tmpdir(),
      env: {
        FIREBASE_SERVICE_ACCOUNT_JSON: encoded,
        FIREBASE_FIRESTORE_DATABASE_ID: DEFAULT_FIRESTORE_DATABASE_ID
      },
      forceReinit: true
    });

    expect(status.initialized).toBe(true);
    expect(status.credentialSource).toBe('service-account-json');
    expect(status.projectId).toBe('ams-windows-staging');
    expect(status.databaseId).toBe(DEFAULT_FIRESTORE_DATABASE_ID);
    expect(getFirebaseAdminDb()?.databaseId).toBe(DEFAULT_FIRESTORE_DATABASE_ID);
  });

  it('mendukung pasangan FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY dengan escape \\n', () => {
    const privateKeyEscaped = generateEphemeralRsaPrivateKeyPem().replace(/\n/g, '\\n');

    const status = initializeFirebaseAdmin({
      rootDir: os.tmpdir(),
      env: {
        FIREBASE_PROJECT_ID: 'ams-keypair-staging',
        FIREBASE_FIRESTORE_DATABASE_ID: DEFAULT_FIRESTORE_DATABASE_ID,
        FIREBASE_CLIENT_EMAIL: 'keypair-sa@ams-keypair-staging.iam.gserviceaccount.com',
        FIREBASE_PRIVATE_KEY: `"${privateKeyEscaped}"`
      },
      forceReinit: true
    });

    expect(status.initialized).toBe(true);
    expect(status.credentialSource).toBe('env-keypair');
    expect(status.projectId).toBe('ams-keypair-staging');
    expect(getFirebaseAdminDb()?.databaseId).toBe(DEFAULT_FIRESTORE_DATABASE_ID);
  });

  it('melindungi preview AI Studio (K_SERVICE=ais-dev-*) agar tetap memakai project dan databaseId bawaan', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ams-fb-admin-preview-'));
    tempDirs.push(dir);
    fs.writeFileSync(
      path.join(dir, 'firebase-applet-config.json'),
      JSON.stringify({
        projectId: 'sixth-cedar-f5v9p',
        firestoreDatabaseId: DEFAULT_FIRESTORE_DATABASE_ID
      }),
      'utf8'
    );

    const resolved = resolveFirebaseAdminConfig({
      rootDir: dir,
      env: {
        K_SERVICE: 'ais-dev-5wlp3yc5jxvcxnp4msjgv6',
        VITE_DEPLOYMENT_ENV: 'staging',
        VITE_FIREBASE_PROJECT_ID: 'ams-staging',
        VITE_FIRESTORE_DATABASE_ID: '(default)'
      }
    });

    expect(resolved.projectId).toBe('sixth-cedar-f5v9p');
    expect(resolved.databaseId).toBe(DEFAULT_FIRESTORE_DATABASE_ID);
  });
});
