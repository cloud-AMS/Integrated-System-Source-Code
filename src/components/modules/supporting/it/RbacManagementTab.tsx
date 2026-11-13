import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  Check,
  KeyRound,
  Lock,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X
} from 'lucide-react';
import type {
  PermissionAction,
  RbacResourceId,
  RoleDefinition,
  RolePermissionMatrix,
  ServerAuditEntry,
  ServerSessionSummary,
  ServerUserPublic
} from '../../../../types';
import { authFetch, punyaIzin, type SesiLogin } from '../../../../utils/autentikasi';

interface RbacResourceMeta {
  id: RbacResourceId;
  label: string;
  group: string;
  actions: PermissionAction[];
}

const ACTION_LABELS: Record<PermissionAction, string> = {
  view: 'Lihat',
  create: 'Tambah',
  update: 'Ubah',
  delete: 'Hapus',
  approve: 'Setujui',
  publish: 'Terbit',
  export: 'Ekspor'
};

const ALL_ACTIONS: PermissionAction[] = [
  'view',
  'create',
  'update',
  'delete',
  'approve',
  'publish',
  'export'
];

export default function RbacManagementTab({
  sesi,
  onPermissionsUpdated
}: {
  sesi: SesiLogin;
  onPermissionsUpdated?: () => void;
}) {
  const [subTab, setSubTab] = useState<'users' | 'roles' | 'sessions' | 'audit'>('users');
  const [resources, setResources] = useState<RbacResourceMeta[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [users, setUsers] = useState<ServerUserPublic[]>([]);
  const [sessions, setSessions] = useState<ServerSessionSummary[]>([]);
  const [auditLogs, setAuditLogs] = useState<ServerAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // User Modal state
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ServerUserPublic | null>(null);
  const [userForm, setUserForm] = useState({
    username: '',
    fullName: '',
    email: '',
    department: '',
    roleId: 'qa_manager',
    password: '',
    isActive: true
  });

  // Role Editor state
  const [selectedRoleId, setSelectedRoleId] = useState<string>('pjt');
  const [draftRoleName, setDraftRoleName] = useState('');
  const [draftRoleDesc, setDraftRoleDesc] = useState('');
  const [draftPerms, setDraftPerms] = useState<RolePermissionMatrix>({});
  const [savingRole, setSavingRole] = useState(false);

  // New Role Modal state
  const [newRoleOpen, setNewRoleOpen] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({ name: '', description: '' });

  const canCreate = punyaIzin(sesi, 'rbac-admin', 'create');
  const canUpdate = punyaIzin(sesi, 'rbac-admin', 'update');
  const canDelete = punyaIzin(sesi, 'rbac-admin', 'delete');
  const canViewAudit = punyaIzin(sesi, 'audit-trail', 'view');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [metaRes, rolesRes, usersRes, sesRes, audRes] = await Promise.all([
        authFetch('/api/rbac/metadata'),
        authFetch('/api/rbac/roles'),
        authFetch('/api/rbac/users'),
        authFetch('/api/rbac/sessions'),
        canViewAudit ? authFetch('/api/rbac/audit') : Promise.resolve(null)
      ]);

      if (metaRes.ok) {
        const d = (await metaRes.json()) as { resources?: RbacResourceMeta[] };
        setResources(d.resources || []);
      }
      if (rolesRes.ok) {
        const d = (await rolesRes.json()) as { roles?: RoleDefinition[] };
        const list = d.roles || [];
        setRoles(list);
        if (list.length > 0 && !list.some((r) => r.id === selectedRoleId)) {
          setSelectedRoleId(list[0].id);
        }
      }
      if (usersRes.ok) {
        const d = (await usersRes.json()) as { users?: ServerUserPublic[] };
        setUsers(d.users || []);
      }
      if (sesRes.ok) {
        const d = (await sesRes.json()) as { sessions?: ServerSessionSummary[] };
        setSessions(d.sessions || []);
      }
      if (audRes && audRes.ok) {
        const d = (await audRes.json()) as { logs?: ServerAuditEntry[] };
        setAuditLogs(d.logs || []);
      }
    } catch {
      setBanner({ type: 'err', text: 'Gagal memuat data RBAC dari server.' });
    } finally {
      setLoading(false);
    }
  }, [canViewAudit, selectedRoleId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    const activeRole = roles.find((r) => r.id === selectedRoleId);
    if (!activeRole) return;
    setDraftRoleName(activeRole.name);
    setDraftRoleDesc(activeRole.description);
    setDraftPerms(JSON.parse(JSON.stringify(activeRole.permissions || {})) as RolePermissionMatrix);
  }, [roles, selectedRoleId]);

  const showMsg = (type: 'ok' | 'err', text: string) => {
    setBanner({ type, text });
    setTimeout(() => setBanner((cur) => (cur?.text === text ? null : cur)), 5000);
  };

  const openCreateUser = () => {
    setEditingUser(null);
    setUserForm({
      username: '',
      fullName: '',
      email: '',
      department: '',
      roleId: roles[0]?.id || 'qa_manager',
      password: '',
      isActive: true
    });
    setUserModalOpen(true);
  };

  const openEditUser = (u: ServerUserPublic) => {
    setEditingUser(u);
    setUserForm({
      username: u.username,
      fullName: u.fullName,
      email: u.email,
      department: u.department,
      roleId: u.roleId,
      password: '',
      isActive: u.isActive
    });
    setUserModalOpen(true);
  };

  const submitUser = async (e: FormEvent) => {
    e.preventDefault();
    const endpoint = editingUser ? `/api/rbac/users/${editingUser.id}` : '/api/rbac/users';
    const method = editingUser ? 'PUT' : 'POST';
    const body = editingUser
      ? {
          fullName: userForm.fullName,
          email: userForm.email,
          department: userForm.department,
          roleId: userForm.roleId,
          isActive: userForm.isActive,
          ...(userForm.password ? { newPassword: userForm.password } : {})
        }
      : {
          username: userForm.username,
          fullName: userForm.fullName,
          email: userForm.email,
          department: userForm.department,
          roleId: userForm.roleId,
          password: userForm.password,
          isActive: userForm.isActive
        };

    const res = await authFetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = (await res.json().catch(() => ({}))) as { pesan?: string };
    if (!res.ok) {
      showMsg('err', data.pesan || 'Gagal menyimpan data pengguna.');
      return;
    }
    setUserModalOpen(false);
    showMsg('ok', editingUser ? `Akun ${editingUser.username} diperbarui.` : 'Pengguna baru berhasil ditambahkan.');
    await loadAll();
    onPermissionsUpdated?.();
  };

  const removeUser = async (u: ServerUserPublic) => {
    const res = await authFetch(`/api/rbac/users/${u.id}`, { method: 'DELETE' });
    const data = (await res.json().catch(() => ({}))) as { pesan?: string };
    if (!res.ok) {
      showMsg('err', data.pesan || 'Gagal menghapus pengguna.');
      return;
    }
    showMsg('ok', `Akun "${u.username}" dihapus.`);
    await loadAll();
  };

  const togglePerm = (resourceId: RbacResourceId, action: PermissionAction) => {
    if (!canUpdate) return;
    setDraftPerms((prev) => {
      const current = new Set(prev[resourceId] || []);
      if (current.has(action)) {
        current.delete(action);
        if (action === 'view') {
          current.clear();
        }
      } else {
        current.add(action);
        if (action !== 'view') {
          current.add('view');
        }
      }
      const next = { ...prev };
      if (current.size === 0) {
        delete next[resourceId];
      } else {
        next[resourceId] = Array.from(current);
      }
      return next;
    });
  };

  const saveRoleChanges = async () => {
    const activeRole = roles.find((r) => r.id === selectedRoleId);
    if (!activeRole || !canUpdate) return;
    setSavingRole(true);
    try {
      const res = await authFetch(`/api/rbac/roles/${activeRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: draftRoleName,
          description: draftRoleDesc,
          permissions: draftPerms
        })
      });
      const data = (await res.json().catch(() => ({}))) as { pesan?: string };
      if (!res.ok) {
        showMsg('err', data.pesan || 'Gagal menyimpan matriks peran.');
        return;
      }
      showMsg('ok', `Matriks izin peran "${draftRoleName}" tersimpan di server.`);
      await loadAll();
      onPermissionsUpdated?.();
    } finally {
      setSavingRole(false);
    }
  };

  const submitNewRole = async (e: FormEvent) => {
    e.preventDefault();
    const res = await authFetch('/api/rbac/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newRoleForm.name,
        description: newRoleForm.description,
        permissions: { overview: ['view'] }
      })
    });
    const data = (await res.json().catch(() => ({}))) as { role?: RoleDefinition; pesan?: string };
    if (!res.ok || !data.role) {
      showMsg('err', data.pesan || 'Gagal membuat peran baru.');
      return;
    }
    setNewRoleOpen(false);
    setNewRoleForm({ name: '', description: '' });
    setSelectedRoleId(data.role.id);
    showMsg('ok', `Peran kustom "${data.role.name}" berhasil dibuat.`);
    await loadAll();
  };

  const removeRole = async (role: RoleDefinition) => {
    const res = await authFetch(`/api/rbac/roles/${role.id}`, { method: 'DELETE' });
    const data = (await res.json().catch(() => ({}))) as { pesan?: string };
    if (!res.ok) {
      showMsg('err', data.pesan || 'Gagal menghapus peran.');
      return;
    }
    showMsg('ok', `Peran "${role.name}" dihapus.`);
    await loadAll();
  };

  const revokeSession = async (sessionId: string) => {
    const res = await authFetch(`/api/rbac/sessions/${sessionId}`, { method: 'DELETE' });
    const data = (await res.json().catch(() => ({}))) as { pesan?: string };
    if (!res.ok) {
      showMsg('err', data.pesan || 'Gagal mencabut sesi.');
      return;
    }
    showMsg('ok', 'Sesi pengguna berhasil dicabut.');
    await loadAll();
  };

  const activeRoleObj = roles.find((r) => r.id === selectedRoleId);

  return (
    <div className="space-y-4">
      {/* Header status server RBAC */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
              SERVER-SIDE ENFORCED
            </span>
            <span className="text-xs text-slate-500">HMAC Session + Scrypt Password Hash + API Permission Guard</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-1">
            Manajemen Akun, Matriks Peran (RBAC) & Keamanan Server
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Setiap perubahan hak akses dan pencabutan sesi langsung diberlakukan oleh middleware server Express.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadAll()}
          className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Segarkan Data
        </button>
      </div>

      {banner && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            banner.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <span>{banner.text}</span>
          <button type="button" onClick={() => setBanner(null)} className="p-1 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sub-navigation */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 text-xs">
        <button
          type="button"
          onClick={() => setSubTab('users')}
          className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer ${
            subTab === 'users' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Akun Pengguna ({users.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab('roles')}
          className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer ${
            subTab === 'roles' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          Matriks Peran & Izin ({roles.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab('sessions')}
          className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer ${
            subTab === 'sessions' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          Sesi Aktif ({sessions.length})
        </button>
        {canViewAudit && (
          <button
            type="button"
            onClick={() => setSubTab('audit')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer ${
              subTab === 'audit' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Log Keamanan Server ({auditLogs.length})
          </button>
        )}
      </div>

      {/* SUBTAB 1: USERS */}
      {subTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
            <div className="text-xs">
              <p className="font-bold text-slate-900">Daftar Akun Pengguna Terverifikasi Server</p>
              <p className="text-slate-500 text-[11px]">Kata sandi di-hash dengan scrypt (salt acak) di penyimpanan server.</p>
            </div>
            {canCreate && (
              <button
                type="button"
                onClick={openCreateUser}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Tambah Akun
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <th className="py-3 px-4">Username & Nama</th>
                  <th className="py-3 px-4">Divisi</th>
                  <th className="py-3 px-4">Peran RBAC</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Login Terakhir</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{u.fullName}</div>
                      <div className="text-[11px] font-mono text-slate-500">
                        @{u.username} • {u.email}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{u.department}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-semibold text-[11px]">
                        {u.roleName}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {u.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-500 font-mono">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('id-ID') : 'Belum pernah'}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {canUpdate && (
                        <button
                          type="button"
                          onClick={() => openEditUser(u)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                        >
                          Ubah / Reset Sandi
                        </button>
                      )}
                      {canDelete && u.id !== sesi.userId && (
                        <button
                          type="button"
                          onClick={() => void removeUser(u)}
                          className="px-2 py-1 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700 cursor-pointer"
                          title="Hapus akun"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: ROLES & PERMISSION MATRIX */}
      {subTab === 'roles' && (
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
          {/* Role Sidebar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs space-y-2">
            <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900">Daftar Peran</span>
              {canCreate && (
                <button
                  type="button"
                  onClick={() => setNewRoleOpen(true)}
                  className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  Baru
                </button>
              )}
            </div>
            <div className="space-y-1 max-h-[480px] overflow-y-auto">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRoleId(r.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                    selectedRoleId === r.id
                      ? 'bg-slate-900 text-white'
                      : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between gap-2">
                    <span className="truncate">{r.name}</span>
                    {r.isSystem && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                          selectedRoleId === r.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        SISTEM
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-[10px] font-mono mt-0.5 ${
                      selectedRoleId === r.id ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {r.id} • {Object.keys(r.permissions || {}).length} modul
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Matrix Editor */}
          {activeRoleObj && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      ID: {activeRoleObj.id}
                    </span>
                    {activeRoleObj.id === 'it_admin' && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                        Izin rbac-admin terkunci aktif demi keamanan
                      </span>
                    )}
                  </div>
                  <input
                    value={draftRoleName}
                    onChange={(e) => setDraftRoleName(e.target.value)}
                    disabled={!canUpdate}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-900 disabled:bg-slate-50"
                  />
                  <input
                    value={draftRoleDesc}
                    onChange={(e) => setDraftRoleDesc(e.target.value)}
                    disabled={!canUpdate}
                    placeholder="Deskripsi peran"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 disabled:bg-slate-50"
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {canDelete && !activeRoleObj.isSystem && (
                    <button
                      type="button"
                      onClick={() => void removeRole(activeRoleObj)}
                      className="px-3 py-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-semibold cursor-pointer"
                    >
                      Hapus Peran
                    </button>
                  )}
                  {canUpdate && (
                    <button
                      type="button"
                      onClick={() => void saveRoleChanges()}
                      disabled={savingRole}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {savingRole ? 'Menyimpan…' : 'Simpan Matriks ke Server'}
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="py-2.5 px-3">Modul / Sumber Daya</th>
                      {ALL_ACTIONS.map((act) => (
                        <th key={act} className="py-2.5 px-2 text-center font-semibold">
                          {ACTION_LABELS[act]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {resources.map((res) => {
                      const assigned = draftPerms[res.id] || [];
                      return (
                        <tr key={res.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900">{res.label}</div>
                            <div className="text-[10px] text-slate-500">
                              {res.group} • <span className="font-mono">{res.id}</span>
                            </div>
                          </td>
                          {ALL_ACTIONS.map((act) => {
                            const supported = res.actions.includes(act);
                            if (!supported) {
                              return (
                                <td key={act} className="py-2.5 px-2 text-center text-slate-300">
                                  —
                                </td>
                              );
                            }
                            const checked = assigned.includes(act);
                            return (
                              <td key={act} className="py-2.5 px-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={!canUpdate}
                                  onChange={() => togglePerm(res.id, act)}
                                  className="w-4 h-4 accent-blue-600 cursor-pointer disabled:cursor-not-allowed"
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: ACTIVE SESSIONS */}
      {subTab === 'sessions' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span className="font-semibold flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-600" />
              Sesi Login Aktif di Server (Masa berlaku 12 jam)
            </span>
            <span>Total Aktif: {sessions.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <th className="py-3 px-4">Pengguna</th>
                  <th className="py-3 px-4">Peran</th>
                  <th className="py-3 px-4">Alamat IP</th>
                  <th className="py-3 px-4">Masuk Pada</th>
                  <th className="py-3 px-4">Kedaluwarsa</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{s.fullName}</span>
                        {s.isCurrent && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                            SESI INI
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">@{s.username}</div>
                    </td>
                    <td className="py-3 px-4">{s.roleName}</td>
                    <td className="py-3 px-4 font-mono text-[11px]">{s.ip}</td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {new Date(s.createdAt).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {new Date(s.expiresAt).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {canDelete && !s.isCurrent && (
                        <button
                          type="button"
                          onClick={() => void revokeSession(s.id)}
                          className="px-2.5 py-1 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700 font-semibold cursor-pointer"
                        >
                          Cabut Sesi
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 4: SERVER AUDIT LOG */}
      {subTab === 'audit' && canViewAudit && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span className="font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Log Autentikasi & Penegakan Otorisasi Server (Real-Time)
            </span>
            <span>Menampilkan {auditLogs.length} catatan terbaru</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Aktor & Peran</th>
                  <th className="py-3 px-4">Aksi & Sumber Daya</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap text-slate-600">
                      {new Date(log.timestamp).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{log.actorUsername}</div>
                      <div className="text-[10px] font-mono text-slate-500">
                        {log.actorRole} • {log.ip}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div className="font-semibold text-slate-800">{log.action}</div>
                      <div className="text-slate-500">{log.resource}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'ALLOWED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{log.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT USER */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900">
                {editingUser ? `Ubah Akun @${editingUser.username}` : 'Tambah Akun Pengguna Baru'}
              </h4>
              <button type="button" onClick={() => setUserModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={submitUser} className="space-y-3 text-xs">
              {!editingUser && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username</label>
                  <input
                    required
                    value={userForm.username}
                    onChange={(e) => setUserForm((p) => ({ ...p, username: e.target.value }))}
                    placeholder="mis. budi.qa"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              )}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  required
                  value={userForm.fullName}
                  onChange={(e) => setUserForm((p) => ({ ...p, fullName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Divisi / Departemen</label>
                  <input
                    value={userForm.department}
                    onChange={(e) => setUserForm((p) => ({ ...p, department: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Peran RBAC</label>
                <select
                  value={userForm.roleId}
                  onChange={(e) => setUserForm((p) => ({ ...p, roleId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.id})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {editingUser ? 'Reset Kata Sandi (kosongkan jika tidak diubah)' : 'Kata Sandi Awal (min. 6 karakter)'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={userForm.password}
                  onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={userForm.isActive}
                  onChange={(e) => setUserForm((p) => ({ ...p, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="font-semibold text-slate-700">Akun aktif (diizinkan masuk)</span>
              </label>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE CUSTOM ROLE */}
      {newRoleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900">Buat Peran RBAC Kustom</h4>
              <button type="button" onClick={() => setNewRoleOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={submitNewRole} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Peran</label>
                <input
                  required
                  value={newRoleForm.name}
                  onChange={(e) => setNewRoleForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="mis. Supervisor Cold Chain"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi</label>
                <textarea
                  rows={3}
                  value={newRoleForm.description}
                  onChange={(e) => setNewRoleForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewRoleOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
                >
                  Buat Peran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
