# Security Specification & Hardening Audit — Firestore Rules (`AMS Integrated System`)

## 1. Data Invariants
1. **Default-Deny Net**: Any path not explicitly matched is rejected (`allow read, write: if false`).
2. **Email-Verified Admin / Owner Identity**: Every write requires `request.auth != null && request.auth.token.email_verified == true`.
3. **Bootstrapped & Delegated Admin**: Only `antraderyll@gmail.com` or `cloud.ams2026@gmail.com` (`email_verified == true`) or UIDs registered in `/admins/{uid}` may mutate system state, RBAC roles, RBAC users, public site snapshots, or database archives.
4. **PII Isolation**: `/ams_rbac_users/{userId}` and `/users/{userId}/private/{docId}` prohibit blanket authenticated reads; only `isAdmin()` or strict `isOwner(userId)` (`private`) can read.
5. **No Self-Privilege Escalation**: Non-admin users cannot create `/admins/{uid}` or change `roleName` in `/users/{userId}/public/{docId}`.
6. **Temporal Integrity**: `createdAt` (on create) and `updatedAt` (on create & update) must strictly equal `request.time`.
7. **Immutable Identity & Ownership**: `ownerUid`, `id`/`key`, and `createdAt`/`archivedAt` remain immutable after creation.
8. **Query Safety (`allow list`)**: `allow list` never invokes `get()` or `exists()`; list queries evaluate `resource.data.ownerUid == request.auth.uid` or token-verified `isBootstrappedAdmin()`.
9. **Path & Size Guards**: Every document ID path variable is checked via `isValidId(id)` (`^[a-zA-Z0-9_\-]+$`, max 128 chars), and all strings enforce explicit `.size()` bounds.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return `PERMISSION_DENIED`)
1. **Unauthenticated Write to Sync Entries**: Anonymous user writes `/ams_sync_entries/stok_gudang` -> DENIED (`isAdmin()` false).
2. **Unverified Email Admin Spoof**: Token with `email: "antraderyll@gmail.com"` and `email_verified: false` attempts `/ams_rbac_users/usr-1` read/write -> DENIED (`isVerified()` false).
3. **Ghost / Shadow Field Injection**: Admin or user sends extra field `isSuperRoot: true` on `/ams_sync_entries/stok_gudang` create/update -> DENIED (`hasOnly` & `affectedKeys().hasOnly` reject).
4. **Cross-Owner Impersonation**: Authenticated user `uidA` sets `ownerUid: "uidB"` on create -> DENIED (`incoming().ownerUid == request.auth.uid`).
5. **Immutable `ownerUid` Hijack**: Update attempts changing `ownerUid` or `createdAt` -> DENIED.
6. **Client Timestamp Forgery**: Payload passes `updatedAt: "2020-01-01T00:00:00Z"` instead of server `request.time` -> DENIED (`updatedAt == request.time`).
7. **ID Poisoning / Oversized Path**: Document ID of 200+ chars or containing `/` or spaces -> DENIED (`isValidId` fails).
8. **PII Blanket Read**: Signed-in non-admin user tries `get` or `list` on `/ams_rbac_users/usr-dev-1` -> DENIED.
9. **Private Profile Snooping**: `uidA` reads `/users/uidB/private/info` -> DENIED (`isOwner(uidB)` false).
10. **Self-Role Escalation**: `uidA` updates `roleName: "Developer & IT Support"` on `/users/uidA/public/profile` -> DENIED (`affectedKeys().hasOnly(['displayName', 'updatedAt'])`).
11. **System Role / Archive Deletion**: Delete attempt on system RBAC role (`isSystem == true`) or `/ams_archives/pocketbase_legacy` -> DENIED.
12. **Hidden Developer Account Deletion**: Attempt to delete `/ams_rbac_users/usr-dev-1` with `isHiddenDeveloper == true` -> DENIED.
