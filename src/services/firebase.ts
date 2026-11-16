import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User as FirebaseUser
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import type { RoleDefinition, ServerUserRecord } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

const BOOTSTRAPPED_ADMIN_EMAIL = 'antraderyll@gmail.com';
const MAX_DOC_BYTES = 920_000;

const existingApps = getApps();
const app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);
export const dbFirestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const authFirebase = getAuth(app);

export function getFirebaseProjectInfo() {
  return {
    projectId: firebaseConfig.projectId,
    firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
    authDomain: firebaseConfig.authDomain
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errMsg = error instanceof Error ? error.message : String(error);
  const currentUser = authFirebase.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo:
        currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email
        })) || []
    },
    operationType,
    path
  };
  if (errMsg.includes('Quota exceeded')) {
    console.error('Firestore Quota Exceeded:', JSON.stringify(errInfo));
  } else {
    console.error('Firestore Error:', JSON.stringify(errInfo));
  }
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  if (typeof window === 'undefined') return;
  try {
    await getDocFromServer(doc(dbFirestore, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();

/** Sanitasi struktur agar murni berupa Map/List native Firestore (tanpa undefined). */
export function sanitizeFirestoreValue(input: unknown): unknown {
  if (input === undefined || typeof input === 'function' || typeof input === 'symbol') {
    return null;
  }
  if (input === null || typeof input === 'string' || typeof input === 'boolean') {
    return input;
  }
  if (typeof input === 'number') {
    return Number.isFinite(input) ? input : 0;
  }
  if (input instanceof Date) {
    return input.toISOString();
  }
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeFirestoreValue(item));
  }
  if (typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (v === undefined) continue;
      const safeKey = k === '' ? '_empty_' : k;
      out[safeKey] = sanitizeFirestoreValue(v);
    }
    return out;
  }
  return String(input);
}

function timestampToIso(val: unknown): string {
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (typeof val === 'string' && val) return val;
  if (val && typeof val === 'object' && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
}

function estimatePayloadBytes(obj: unknown): number {
  try {
    return new Blob([JSON.stringify(obj)]).size;
  } catch {
    return 0;
  }
}

export async function signInWithGoogleFirebase(): Promise<{ user: FirebaseUser; idToken: string }> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(authFirebase, provider);
  const idToken = await cred.user.getIdToken(true);
  await ensureUserSplitProfile(cred.user);
  return { user: cred.user, idToken };
}

export async function signOutFirebase(): Promise<void> {
  await signOut(authFirebase);
}

export function subscribeFirebaseAuthState(cb: (user: FirebaseUser | null) => void): () => void {
  return onAuthStateChanged(authFirebase, cb);
}

async function ensureUserSplitProfile(user: FirebaseUser): Promise<void> {
  if (!user.uid || !user.email || !user.emailVerified) return;
  const pubPath = `users/${user.uid}/public/profile`;
  const privPath = `users/${user.uid}/private/info`;
  const displayName = (user.displayName || user.email.split('@')[0] || 'Pengguna').slice(0, 120);
  const defaultRoleName =
    user.email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL
      ? 'Developer & IT Support'
      : 'Karyawan (HRIS Self-Service)';

  try {
    const pubRef = doc(dbFirestore, 'users', user.uid, 'public', 'profile');
    const pubSnap = await getDoc(pubRef);
    if (!pubSnap.exists()) {
      await setDoc(pubRef, {
        uid: user.uid,
        displayName,
        roleName: defaultRoleName,
        updatedAt: serverTimestamp()
      });
    } else {
      await updateDoc(pubRef, {
        displayName,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pubPath);
  }

  try {
    const privRef = doc(dbFirestore, 'users', user.uid, 'private', 'info');
    const privSnap = await getDoc(privRef);
    if (!privSnap.exists()) {
      await setDoc(privRef, {
        uid: user.uid,
        email: user.email.slice(0, 160),
        updatedAt: serverTimestamp()
      });
    } else {
      await updateDoc(privRef, {
        email: user.email.slice(0, 160),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, privPath);
  }
}

export async function fetchPublicSiteFromFirestore(): Promise<Record<string, unknown> | null> {
  const path = 'public_site/published';
  try {
    const snap = await getDoc(doc(dbFirestore, 'public_site', 'published'));
    if (!snap.exists()) return null;
    const data = snap.data() as { config?: Record<string, unknown> } | undefined;
    return data?.config && typeof data.config === 'object' ? data.config : null;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
      return null;
    }
    if (msg.includes('the client is offline')) {
      return null;
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function pushPublicSiteToFirestore(
  config: Record<string, unknown>,
  updatedBy: string
): Promise<void> {
  const user = authFirebase.currentUser;
  if (!user || !user.emailVerified) return;
  const sanitized = sanitizeFirestoreValue(config) as Record<string, unknown>;
  if (estimatePayloadBytes(sanitized) > MAX_DOC_BYTES) {
    throw new Error('Ukuran konfigurasi website melebihi batas dokumen Firestore (920 KB). Kurangi ukuran gambar inline.');
  }
  const path = 'public_site/published';
  const ref = doc(dbFirestore, 'public_site', 'published');
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        id: 'published',
        config: sanitized,
        updatedBy: updatedBy.slice(0, 120) || user.email || 'admin',
        updatedAt: serverTimestamp(),
        ownerUid: user.uid
      });
    } else {
      await updateDoc(ref, {
        config: sanitized,
        updatedBy: updatedBy.slice(0, 120) || user.email || 'admin',
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function pushSyncEntryToFirestore(
  key: string,
  value: unknown,
  version: number,
  updatedBy: string
): Promise<void> {
  const user = authFirebase.currentUser;
  if (!user || !user.emailVerified) return;
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(key)) return;

  const wrapped = { payload: sanitizeFirestoreValue(value) };
  if (estimatePayloadBytes(wrapped) > MAX_DOC_BYTES) {
    console.warn(`[Firebase] Koleksi "${key}" melewati 920 KB, dilewati agar aman dari batas 1 MiB Firestore.`);
    return;
  }

  const path = `ams_sync_entries/${key}`;
  const ref = doc(dbFirestore, 'ams_sync_entries', key);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        key,
        value: wrapped,
        version: Math.max(1, Math.floor(version || 1)),
        updatedBy: (updatedBy || user.email || 'admin').slice(0, 120),
        updatedAt: serverTimestamp(),
        ownerUid: user.uid
      });
    } else {
      await updateDoc(ref, {
        value: wrapped,
        version: Math.max(1, Math.floor(version || 1)),
        updatedBy: (updatedBy || user.email || 'admin').slice(0, 120),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSyncEntryFromFirestore(key: string): Promise<void> {
  const user = authFirebase.currentUser;
  if (!user || !user.emailVerified) return;
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(key)) return;
  const path = `ams_sync_entries/${key}`;
  try {
    await deleteDoc(doc(dbFirestore, 'ams_sync_entries', key));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function pushRbacSnapshotToFirestore(
  roles: RoleDefinition[],
  users: ServerUserRecord[]
): Promise<{ rolesPushed: number; usersPushed: number }> {
  const user = authFirebase.currentUser;
  if (!user || !user.emailVerified) {
    return { rolesPushed: 0, usersPushed: 0 };
  }

  let rolesPushed = 0;
  let usersPushed = 0;

  for (const r of roles) {
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(r.id)) continue;
    const path = `ams_rbac_roles/${r.id}`;
    const ref = doc(dbFirestore, 'ams_rbac_roles', r.id);
    const permissions = sanitizeFirestoreValue(r.permissions || {}) as Record<string, unknown>;
    try {
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          id: r.id,
          name: r.name.slice(0, 120),
          description: (r.description || '').slice(0, 500),
          isSystem: Boolean(r.isSystem),
          permissions,
          updatedAt: serverTimestamp(),
          ownerUid: user.uid
        });
      } else {
        await updateDoc(ref, {
          name: r.name.slice(0, 120),
          description: (r.description || '').slice(0, 500),
          isSystem: Boolean(r.isSystem),
          permissions,
          updatedAt: serverTimestamp()
        });
      }
      rolesPushed += 1;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  for (const u of users) {
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(u.id)) continue;
    const path = `ams_rbac_users/${u.id}`;
    const ref = doc(dbFirestore, 'ams_rbac_users', u.id);
    const cleanUsername = u.username.toLowerCase().slice(0, 32);
    const safeHash = u.passwordHash && u.passwordHash.length >= 8 ? u.passwordHash.slice(0, 256) : 'firebase_sso_account';
    try {
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          id: u.id,
          username: cleanUsername,
          fullName: u.fullName.slice(0, 120),
          email: (u.email || '').slice(0, 160),
          roleId: u.roleId.slice(0, 64),
          department: (u.department || 'Umum').slice(0, 120),
          isActive: u.isActive !== false,
          isHiddenDeveloper: Boolean(u.isHiddenDeveloper),
          passwordHash: safeHash,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ownerUid: user.uid
        });
      } else {
        await updateDoc(ref, {
          username: cleanUsername,
          fullName: u.fullName.slice(0, 120),
          email: (u.email || '').slice(0, 160),
          roleId: u.roleId.slice(0, 64),
          department: (u.department || 'Umum').slice(0, 120),
          isActive: u.isActive !== false,
          passwordHash: safeHash,
          updatedAt: serverTimestamp()
        });
      }
      usersPushed += 1;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  return { rolesPushed, usersPushed };
}

export async function pushArchiveConfigToFirestore(
  archiveId: string,
  driver: 'pocketbase' | 'firebase',
  config: Record<string, unknown>,
  archivedBy: string
): Promise<void> {
  const user = authFirebase.currentUser;
  if (!user || !user.emailVerified) return;
  const path = `ams_archives/${archiveId}`;
  const ref = doc(dbFirestore, 'ams_archives', archiveId);
  const sanitized = sanitizeFirestoreValue(config) as Record<string, unknown>;
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        id: archiveId,
        driver,
        config: sanitized,
        archivedBy: (archivedBy || user.email || 'admin').slice(0, 120),
        archivedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ownerUid: user.uid
      });
    } else {
      await updateDoc(ref, {
        driver,
        config: sanitized,
        archivedBy: (archivedBy || user.email || 'admin').slice(0, 120),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export interface CloudPulledState {
  entries: Record<string, { value: unknown; version: number; updatedAt: string; updatedBy: string }>;
  roles: RoleDefinition[];
  users: ServerUserRecord[];
  pocketbaseArchive?: {
    driver: 'pocketbase' | 'firebase';
    config: Record<string, unknown>;
    archivedAt: string;
  };
}

export async function pullAllCloudStateFromFirestore(): Promise<CloudPulledState> {
  const user = authFirebase.currentUser;
  if (!user || !user.emailVerified) {
    return { entries: {}, roles: [], users: [] };
  }

  const isBootstrapped = user.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL;
  const buildScopedQuery = (collName: string) =>
    isBootstrapped
      ? query(collection(dbFirestore, collName))
      : query(collection(dbFirestore, collName), where('ownerUid', '==', user.uid));

  const entries: CloudPulledState['entries'] = {};
  const entriesPath = 'ams_sync_entries';
  try {
    const snap = await getDocs(buildScopedQuery(entriesPath));
    snap.forEach((docSnap) => {
      const d = docSnap.data() as {
        key?: string;
        value?: { payload?: unknown };
        version?: number;
        updatedAt?: unknown;
        updatedBy?: string;
      };
      const k = d.key || docSnap.id;
      if (d.value && 'payload' in d.value) {
        entries[k] = {
          value: d.value.payload,
          version: typeof d.version === 'number' ? d.version : 1,
          updatedAt: timestampToIso(d.updatedAt),
          updatedBy: d.updatedBy || 'firebase-sync'
        };
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, entriesPath);
  }

  const roles: RoleDefinition[] = [];
  const rolesPath = 'ams_rbac_roles';
  try {
    const snap = await getDocs(buildScopedQuery(rolesPath));
    snap.forEach((docSnap) => {
      const d = docSnap.data() as Record<string, unknown>;
      if (typeof d.id === 'string' && typeof d.name === 'string') {
        roles.push({
          id: d.id,
          name: d.name,
          description: typeof d.description === 'string' ? d.description : '',
          isSystem: Boolean(d.isSystem),
          permissions: (d.permissions || {}) as RoleDefinition['permissions'],
          updatedAt: timestampToIso(d.updatedAt)
        });
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, rolesPath);
  }

  const users: ServerUserRecord[] = [];
  const usersPath = 'ams_rbac_users';
  try {
    const snap = await getDocs(buildScopedQuery(usersPath));
    snap.forEach((docSnap) => {
      const d = docSnap.data() as Record<string, unknown>;
      if (typeof d.id === 'string' && typeof d.username === 'string' && typeof d.roleId === 'string') {
        users.push({
          id: d.id,
          username: d.username,
          fullName: typeof d.fullName === 'string' ? d.fullName : d.username,
          email: typeof d.email === 'string' ? d.email : '',
          roleId: d.roleId,
          department: typeof d.department === 'string' ? d.department : 'Umum',
          isActive: d.isActive !== false,
          isHiddenDeveloper: Boolean(d.isHiddenDeveloper),
          passwordHash: typeof d.passwordHash === 'string' ? d.passwordHash : '',
          createdAt: timestampToIso(d.createdAt),
          updatedAt: timestampToIso(d.updatedAt)
        });
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, usersPath);
  }

  let pocketbaseArchive: CloudPulledState['pocketbaseArchive'];
  const archivesPath = 'ams_archives';
  try {
    const snap = await getDocs(buildScopedQuery(archivesPath));
    snap.forEach((docSnap) => {
      if (docSnap.id === 'pocketbase_legacy') {
        const d = docSnap.data() as {
          driver?: 'pocketbase' | 'firebase';
          config?: Record<string, unknown>;
          archivedAt?: unknown;
        };
        if (d.config) {
          pocketbaseArchive = {
            driver: d.driver === 'pocketbase' ? 'pocketbase' : 'firebase',
            config: d.config,
            archivedAt: timestampToIso(d.archivedAt)
          };
        }
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, archivesPath);
  }

  return { entries, roles, users, pocketbaseArchive };
}

export function attachFirestoreRealtimeSync(callbacks: {
  onEntriesChanged: (entries: Record<string, { value: unknown; version: number; updatedAt: string; updatedBy: string }>) => void;
  onRbacChanged: () => void;
}): Unsubscribe | null {
  const user = authFirebase.currentUser;
  if (!user || !user.emailVerified) return null;

  const isBootstrapped = user.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL;
  const entriesQuery = isBootstrapped
    ? query(collection(dbFirestore, 'ams_sync_entries'))
    : query(collection(dbFirestore, 'ams_sync_entries'), where('ownerUid', '==', user.uid));

  const rolesQuery = isBootstrapped
    ? query(collection(dbFirestore, 'ams_rbac_roles'))
    : query(collection(dbFirestore, 'ams_rbac_roles'), where('ownerUid', '==', user.uid));

  const unsubEntries = onSnapshot(
    entriesQuery,
    (snapshot) => {
      const updates: Record<string, { value: unknown; version: number; updatedAt: string; updatedBy: string }> = {};
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const d = change.doc.data() as {
            key?: string;
            value?: { payload?: unknown };
            version?: number;
            updatedAt?: unknown;
            updatedBy?: string;
          };
          const k = d.key || change.doc.id;
          if (d.value && 'payload' in d.value) {
            updates[k] = {
              value: d.value.payload,
              version: typeof d.version === 'number' ? d.version : 1,
              updatedAt: timestampToIso(d.updatedAt),
              updatedBy: d.updatedBy || 'firebase-sync'
            };
          }
        }
      });
      if (Object.keys(updates).length > 0) {
        callbacks.onEntriesChanged(updates);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'ams_sync_entries');
    }
  );

  const unsubRoles = onSnapshot(
    rolesQuery,
    (snapshot) => {
      if (snapshot.docChanges().length > 0) {
        callbacks.onRbacChanged();
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'ams_rbac_roles');
    }
  );

  return () => {
    unsubEntries();
    unsubRoles();
  };
}
