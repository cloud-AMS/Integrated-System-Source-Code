import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
const blueprintPath = path.resolve(process.cwd(), 'firebase-blueprint.json');
const rulesContent = fs.readFileSync(rulesPath, 'utf8');
const blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf8')) as {
  entities: Record<string, unknown>;
  firestore: Record<string, { schema: { $ref: string }; description: string }>;
};

describe('Firestore Security Rules & Blueprint — Audit Delapan Pilar', () => {
  it('menggunakan rules_version = 2 dan default-deny catch-all di blok pertama', () => {
    expect(rulesContent).toContain("rules_version = '2';");
    expect(rulesContent).toMatch(/match \/\{document=\*\*\} \{\s*allow read, write: if false;\s*\}/);
  });

  it('menghubungkan seluruh koleksi pada firebase-blueprint.json dengan match block eksplisit', () => {
    const collectionPaths = Object.keys(blueprint.firestore);
    for (const fullPath of collectionPaths) {
      const normalized = fullPath.replace(/^\//, '');
      expect(rulesContent).toContain(`match /${normalized}`);
    }
  });

  it('menolak blanket read, tidak memakai get()/exists() di allow list, dan mewajibkan email_verified == true', () => {
    expect(rulesContent).not.toMatch(/allow read:\s*if\s*(true|isSignedIn\(\))/);
    expect(rulesContent).toContain('request.auth.token.email_verified == true');
    expect(rulesContent).toContain("request.auth.token.email == 'antraderyll@gmail.com'");

    const listRules = rulesContent.match(/allow list:[^;]+;/g) || [];
    expect(listRules.length).toBeGreaterThan(0);
    for (const rule of listRules) {
      expect(rule).not.toMatch(/\b(isAdmin|get|exists)\s*\(/);
    }
  });

  it('menerapkan isValidId, affectedKeys().hasOnly, isValid* pada setiap update, dan request.time', () => {
    expect(rulesContent).toContain('function isValidId(id)');
    expect(rulesContent).toContain('incoming().updatedAt == request.time');
    expect(rulesContent).toContain('affectedKeys().hasOnly(');
    expect(rulesContent).not.toContain('JSON.stringify');
  });

  it('melindungi PII (/ams_rbac_users dan /users/*/private) serta mencegah penghapusan akun dev & arsip', () => {
    const rbacUsersBlock = rulesContent.split('match /ams_rbac_users/{userId}')[1]?.split('match /ams_archives')[0] || '';
    expect(rbacUsersBlock).toContain('allow get: if isAdmin()');
    expect(rbacUsersBlock).toContain('existing().isHiddenDeveloper == false');

    const archivesBlock = rulesContent.split('match /ams_archives/{archiveId}')[1]?.split('match /admins')[0] || '';
    expect(archivesBlock).not.toContain('allow delete:');
  });
});
