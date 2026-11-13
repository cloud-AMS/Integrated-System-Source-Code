import type { NextFunction, Request, Response } from 'express';
import type { PermissionAction, RbacResourceId, RoleDefinition, ServerUserPublic } from '../src/types/index';
import type { ServerRbacStore, ServerSessionRecord } from './rbacStore';

export const SESSION_COOKIE_NAME = 'ams_session';

export interface AuthContext {
  session: ServerSessionRecord;
  user: ServerUserPublic;
  role: RoleDefinition;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export function getClientIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.trim()) {
    return fwd.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || '127.0.0.1';
}

function parseCookies(header?: string): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq <= 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    try {
      out[k] = decodeURIComponent(v);
    } catch {
      out[k] = v;
    }
  }
  return out;
}

export function extractSessionToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length).trim();
    if (token) return token;
  }
  const cookies = parseCookies(req.headers.cookie);
  return cookies[SESSION_COOKIE_NAME] || null;
}

function isRequestHttps(req: Request): boolean {
  const proto = req.headers['x-forwarded-proto'];
  if (typeof proto === 'string' && proto.split(',')[0].trim() === 'https') return true;
  return Boolean(req.secure);
}

export function setSessionCookie(req: Request, res: Response, token: string, maxAgeSeconds = 12 * 60 * 60) {
  const https = isRequestHttps(req);
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    `Max-Age=${maxAgeSeconds}`,
    'HttpOnly',
    https ? 'SameSite=None' : 'SameSite=Lax'
  ];
  if (https) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearSessionCookie(req: Request, res: Response) {
  const https = isRequestHttps(req);
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'Max-Age=0',
    'HttpOnly',
    https ? 'SameSite=None' : 'SameSite=Lax'
  ];
  if (https) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function createRbacMiddleware(store: ServerRbacStore) {
  const attachAuth = (req: Request, _res: Response, next: NextFunction) => {
    const token = extractSessionToken(req);
    if (token) {
      const resolved = store.resolveToken(token);
      if (resolved) req.auth = resolved;
    }
    next();
  };

  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        pesan: 'Sesi tidak valid atau telah berakhir. Silakan masuk kembali.'
      });
    }
    next();
  };

  const requirePermission = (resource: RbacResourceId, action: PermissionAction) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.auth) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          pesan: 'Autentikasi diperlukan untuk mengakses sumber daya ini.'
        });
      }
      const allowedActions = req.auth.role.permissions[resource] || [];
      if (!allowedActions.includes(action)) {
        store.recordAudit({
          actorUsername: req.auth.user.username,
          actorRole: req.auth.role.id,
          action: `RBAC_DENIED:${resource}:${action}`,
          resource,
          status: 'DENIED',
          ip: getClientIp(req),
          detail: `Akses ditolak pada ${req.method} ${req.originalUrl} — peran "${req.auth.role.name}" tidak memiliki izin "${resource}:${action}".`
        });
        return res.status(403).json({
          error: 'FORBIDDEN',
          pesan: `Akses ditolak. Peran "${req.auth.role.name}" tidak memiliki izin "${resource}:${action}".`,
          required: { resource, action },
          role: req.auth.role.id
        });
      }
      next();
    };
  };

  return { attachAuth, requireAuth, requirePermission };
}
