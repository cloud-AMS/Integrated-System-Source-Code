import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Check,
  CheckSquare,
  Edit3,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Square,
  Trash2,
  UserCheck,
  UserPlus,
  Users
} from 'lucide-react';
import { db } from '../../services/pocketbase';
import type { AkunPengguna, AksesEfektif, ModuleNavId, RoleSistem, UserRole } from '../../types';
import {
  buatSlugRole,
  DAFTAR_MODUL_SISTEM,
  GRUP_MODUL_URUTAN,
  hitungAdminAksesPenuhAktif,
  hitungAksesEfektif,
  ROLE_BAWAAN_SISTEM,
  SEMUA_ID_MODUL
} from '../../utils/hakAkses';
import {
  Badge,
  Modal,
  Panel,
  Stat,
  chipFilter,
  formatTanggal,
  inputClass,
  labelClass,
  tombolBahaya,
  tombolPrimer,
  tombolSekunder
} from '../ui';

interface UserAccountRolesModuleProps {
  aksesAktif: AksesEfektif;
  pelakuAktif: string;
  akunAktifId?: string;
}

const BASIS_PERAN_OPS: { value: UserRole; label: string }[] = [
  { value: 'pjt', label: 'PJT (Otoritas Regulasi & Rilis)' },
  { value: 'it_admin', label: 'IT Admin (Konfigurasi & Audit)' },
  { value: 'qa_manager', label: 'QA Manager (Mutu & CAPA)' },
  { value: 'qc_officer', label: 'QC Officer (Inspeksi & Uji)' },
  { value: 'kepala_gudang', label: 'Kepala Gudang (FEFO & Stok)' },
  { value: 'teknisi_elektromedik', label: 'Teknisi Elektromedik' },
  { value: 'manajer_produksi', label: 'Manajer Produksi (CPAKB)' },
  { value: 'purchasing', label: 'Purchasing & Procurement' },
  { value: 'sales_manager', label: 'Sales & e-Katalog LKPP' },
  { value: 'auditor_internal', label: 'Auditor Internal ISO 13485' }
];

export default function UserAccountRolesModule({
  aksesAktif,
  pelakuAktif,
  akunAktifId
}: UserAccountRolesModuleProps) {
  const [subTab, setSubTab] = useState<'akun' | 'roles'>('akun');
  const [daftarAkun, setDaftarAkun] = useState<AkunPengguna[]>(() => db.getAkunPengguna());
  const [daftarRole, setDaftarRole] = useState<RoleSistem[]>(() => db.getRoleSistem());

  // Filter daftar user
  const [kataKunci, setKataKunci] = useState('');
  const [filterRole, setFilterRole] = useState<string>('Semua');
  const [filterStatus, setFilterStatus] = useState<'Semua' | 'Aktif' | 'Nonaktif'>('Semua');

  // Notifikasi aksi
  const [pesanSukses, setPesanSukses] = useState<string | null>(null);
  const [pesanGalat, setPesanGalat] = useState<string | null>(null);

  // Modal Tambah/Edit User
  const [modalAkunTerbuka, setModalAkunTerbuka] = useState(false);
  const [modeEditAkun, setModeEditAkun] = useState<AkunPengguna | null>(null);
  const [tampilSandi, setTampilSandi] = useState(false);
  const [formAkun, setFormAkun] = useState<{
    namaLengkap: string;
    username: string;
    email: string;
    kataSandi: string;
    roleId: string;
    status: 'Aktif' | 'Nonaktif';
    aksesKustom: boolean;
    aksesPenuhOverride: boolean;
    modulDiizinkan: ModuleNavId[];
  }>({
    namaLengkap: '',
    username: '',
    email: '',
    kataSandi: '',
    roleId: 'qa_manager',
    status: 'Aktif',
    aksesKustom: false,
    aksesPenuhOverride: false,
    modulDiizinkan: ['overview']
  });

  // Manajemen Role state
  const [roleTerpilihId, setRoleTerpilihId] = useState<string>(() => daftarRole[0]?.id || 'pjt');
  const [draftRole, setDraftRole] = useState<RoleSistem | null>(null);
  const [modalTambahRole, setModalTambahRole] = useState(false);
  const [formRoleBaru, setFormRoleBaru] = useState<{
    nama: string;
    deskripsi: string;
    basisPeran: UserRole;
    aksesPenuh: boolean;
    modulDiizinkan: ModuleNavId[];
  }>({
    nama: '',
    deskripsi: '',
    basisPeran: 'auditor_internal',
    aksesPenuh: false,
    modulDiizinkan: ['overview']
  });

  // Konfirmasi hapus akun/role tanpa window.alert/confirm
  const [konfirmasiHapusAkun, setKonfirmasiHapusAkun] = useState<AkunPengguna | null>(null);
  const [konfirmasiHapusRole, setKonfirmasiHapusRole] = useState<RoleSistem | null>(null);

  const punyaAksesPenuh = aksesAktif.aksesPenuh;

  useEffect(() => {
    const unsubAkun = db.subscribe('rb_akun', () => setDaftarAkun(db.getAkunPengguna()));
    const unsubRole = db.subscribe('rb_role', () => setDaftarRole(db.getRoleSistem()));
    return () => {
      unsubAkun();
      unsubRole();
    };
  }, []);

  useEffect(() => {
    const aktif = daftarRole.find((r) => r.id === roleTerpilihId) || daftarRole[0] || null;
    setDraftRole(aktif ? { ...aktif, modulDiizinkan: [...aktif.modulDiizinkan] } : null);
  }, [roleTerpilihId, daftarRole]);

  const tampilNotifSukses = (teks: string) => {
    setPesanGalat(null);
    setPesanSukses(teks);
    setTimeout(() => setPesanSukses(null), 4000);
  };

  const tampilNotifGalat = (teks: string) => {
    setPesanSukses(null);
    setPesanGalat(teks);
  };

  const jumlahAdminPenuhAktif = useMemo(
    () => hitungAdminAksesPenuhAktif(daftarAkun, daftarRole),
    [daftarAkun, daftarRole]
  );

  const akunTersaring = useMemo(() => {
    const q = kataKunci.trim().toLowerCase();
    return daftarAkun.filter((akun) => {
      const cocokRole = filterRole === 'Semua' || akun.roleId === filterRole;
      const cocokStatus = filterStatus === 'Semua' || akun.status === filterStatus;
      const roleObj = daftarRole.find((r) => r.id === akun.roleId);
      const cocokCari =
        !q ||
        [akun.namaLengkap, akun.username, akun.email, roleObj?.nama || ''].some((val) =>
          val.toLowerCase().includes(q)
        );
      return cocokRole && cocokStatus && cocokCari;
    });
  }, [daftarAkun, daftarRole, kataKunci, filterRole, filterStatus]);

  const bukaModalTambahAkun = () => {
    setPesanGalat(null);
    setModeEditAkun(null);
    setTampilSandi(false);
    const defaultRole = daftarRole.find((r) => r.id === 'qa_manager') || daftarRole[0];
    setFormAkun({
      namaLengkap: '',
      username: '',
      email: '',
      kataSandi: '',
      roleId: defaultRole?.id || 'pjt',
      status: 'Aktif',
      aksesKustom: false,
      aksesPenuhOverride: false,
      modulDiizinkan: defaultRole ? [...defaultRole.modulDiizinkan] : ['overview']
    });
    setModalAkunTerbuka(true);
  };

  const bukaModalEditAkun = (akun: AkunPengguna, fokusKustom = false) => {
    setPesanGalat(null);
    setModeEditAkun(akun);
    setTampilSandi(false);
    const aksesSaatIni = hitungAksesEfektif(akun, daftarRole);
    setFormAkun({
      namaLengkap: akun.namaLengkap,
      username: akun.username,
      email: akun.email,
      kataSandi: akun.kataSandi,
      roleId: akun.roleId,
      status: akun.status,
      aksesKustom: fokusKustom ? true : akun.aksesKustom,
      aksesPenuhOverride: Boolean(akun.aksesPenuhOverride),
      modulDiizinkan: akun.aksesKustom
        ? [...(akun.modulDiizinkan || [])]
        : [...aksesSaatIni.modulDiizinkan]
    });
    setModalAkunTerbuka(true);
  };

  const toggleModulFormAkun = (modulId: ModuleNavId) => {
    setFormAkun((prev) => {
      const ada = prev.modulDiizinkan.includes(modulId);
      return {
        ...prev,
        modulDiizinkan: ada
          ? prev.modulDiizinkan.filter((m) => m !== modulId)
          : [...prev.modulDiizinkan, modulId]
      };
    });
  };

  const simpanFormAkun = (e: FormEvent) => {
    e.preventDefault();
    if (!punyaAksesPenuh) return;

    const usernameBersih = formAkun.username.trim().toLowerCase();
    if (!formAkun.namaLengkap.trim() || !usernameBersih || !formAkun.kataSandi.trim()) {
      tampilNotifGalat('Nama lengkap, username, dan kata sandi wajib diisi.');
      return;
    }

    const duplikat = daftarAkun.find(
      (a) => a.username.toLowerCase() === usernameBersih && a.id !== modeEditAkun?.id
    );
    if (duplikat) {
      tampilNotifGalat(`Username "${usernameBersih}" sudah digunakan oleh akun lain.`);
      return;
    }

    if (!formAkun.aksesKustom && !daftarRole.some((r) => r.id === formAkun.roleId)) {
      tampilNotifGalat('Role yang dipilih tidak valid.');
      return;
    }

    const kandidat: AkunPengguna = {
      id: modeEditAkun ? modeEditAkun.id : `USR-${Date.now().toString().slice(-5)}`,
      namaLengkap: formAkun.namaLengkap.trim(),
      username: usernameBersih,
      email: formAkun.email.trim() || `${usernameBersih}@anugrahmitraselaras.co.id`,
      kataSandi: formAkun.kataSandi,
      roleId: formAkun.roleId,
      status: formAkun.status,
      aksesKustom: formAkun.aksesKustom,
      aksesPenuhOverride: formAkun.aksesKustom ? formAkun.aksesPenuhOverride : false,
      modulDiizinkan: formAkun.aksesKustom
        ? formAkun.aksesPenuhOverride
          ? [...SEMUA_ID_MODUL]
          : formAkun.modulDiizinkan
        : undefined,
      dibuatPada: modeEditAkun ? modeEditAkun.dibuatPada : new Date().toISOString(),
      terakhirMasuk: modeEditAkun?.terakhirMasuk
    };

    // Safeguard agar tidak mengunci semua akun Akses Penuh
    if (modeEditAkun) {
      const simulasiList = daftarAkun.map((a) => (a.id === modeEditAkun.id ? kandidat : a));
      if (hitungAdminAksesPenuhAktif(simulasiList, daftarRole) === 0) {
        tampilNotifGalat('Harus ada minimal 1 user akun aktif dengan Akses Penuh agar sistem tetap dapat dikelola.');
        return;
      }
      db.perbaruiAkunPengguna(kandidat, pelakuAktif);
      tampilNotifSukses(`Akun "${kandidat.namaLengkap}" (@${kandidat.username}) berhasil diperbarui.`);
    } else {
      db.tambahAkunPengguna(kandidat, pelakuAktif);
      tampilNotifSukses(`User akun baru "${kandidat.namaLengkap}" (@${kandidat.username}) berhasil dibuat.`);
    }

    setDaftarAkun(db.getAkunPengguna());
    setModalAkunTerbuka(false);
  };

  const eksekusiHapusAkun = () => {
    if (!konfirmasiHapusAkun || !punyaAksesPenuh) return;
    const sisa = daftarAkun.filter((a) => a.id !== konfirmasiHapusAkun.id);
    if (hitungAdminAksesPenuhAktif(sisa, daftarRole) === 0) {
      tampilNotifGalat('Tidak dapat menghapus satu-satunya akun aktif yang memiliki Akses Penuh.');
      setKonfirmasiHapusAkun(null);
      return;
    }
    db.hapusAkunPengguna(konfirmasiHapusAkun.id, pelakuAktif);
    setDaftarAkun(db.getAkunPengguna());
    tampilNotifSukses(`User akun "@${konfirmasiHapusAkun.username}" telah dihapus.`);
    setKonfirmasiHapusAkun(null);
  };

  const toggleModulDraftRole = (modulId: ModuleNavId) => {
    if (!draftRole) return;
    const ada = draftRole.modulDiizinkan.includes(modulId);
    setDraftRole({
      ...draftRole,
      modulDiizinkan: ada
        ? draftRole.modulDiizinkan.filter((m) => m !== modulId)
        : [...draftRole.modulDiizinkan, modulId]
    });
  };

  const toggleGrupDraftRole = (grup: (typeof GRUP_MODUL_URUTAN)[number]) => {
    if (!draftRole) return;
    const modulGrup = DAFTAR_MODUL_SISTEM.filter((m) => m.grup === grup).map((m) => m.id);
    const semuaTercentang = modulGrup.every((id) => draftRole.modulDiizinkan.includes(id));
    if (semuaTercentang) {
      setDraftRole({
        ...draftRole,
        modulDiizinkan: draftRole.modulDiizinkan.filter((id) => !modulGrup.includes(id))
      });
    } else {
      const gabungan = new Set([...draftRole.modulDiizinkan, ...modulGrup]);
      setDraftRole({
        ...draftRole,
        modulDiizinkan: SEMUA_ID_MODUL.filter((id) => gabungan.has(id))
      });
    }
  };

  const simpanPerubahanRole = () => {
    if (!draftRole || !punyaAksesPenuh) return;
    if (!draftRole.nama.trim()) {
      tampilNotifGalat('Nama role tidak boleh kosong.');
      return;
    }
    const roleSimpan: RoleSistem = {
      ...draftRole,
      nama: draftRole.nama.trim(),
      deskripsi: draftRole.deskripsi.trim(),
      modulDiizinkan: draftRole.aksesPenuh ? [...SEMUA_ID_MODUL] : draftRole.modulDiizinkan
    };
    const simulasiRoles = daftarRole.map((r) => (r.id === roleSimpan.id ? roleSimpan : r));
    if (hitungAdminAksesPenuhAktif(daftarAkun, simulasiRoles) === 0) {
      tampilNotifGalat('Perubahan ditolak: minimal harus tersisa 1 user akun aktif dengan hak Akses Penuh.');
      return;
    }
    db.perbaruiRoleSistem(roleSimpan, pelakuAktif);
    setDaftarRole(db.getRoleSistem());
    tampilNotifSukses(`Batasan akses untuk role "${roleSimpan.nama}" berhasil disimpan.`);
  };

  const resetRoleKeBawaan = () => {
    if (!draftRole) return;
    const bawaan = ROLE_BAWAAN_SISTEM.find((r) => r.id === draftRole.id);
    if (!bawaan) return;
    setDraftRole({
      ...draftRole,
      aksesPenuh: bawaan.aksesPenuh,
      modulDiizinkan: [...bawaan.modulDiizinkan]
    });
  };

  const simpanRoleBaru = (e: FormEvent) => {
    e.preventDefault();
    if (!punyaAksesPenuh || !formRoleBaru.nama.trim()) return;
    const slug = buatSlugRole(formRoleBaru.nama, daftarRole.map((r) => r.id));
    const roleBaru: RoleSistem = {
      id: slug,
      nama: formRoleBaru.nama.trim(),
      deskripsi: formRoleBaru.deskripsi.trim() || 'Role kustom perusahaan.',
      basisPeran: formRoleBaru.basisPeran,
      aksesPenuh: formRoleBaru.aksesPenuh,
      modulDiizinkan: formRoleBaru.aksesPenuh ? [...SEMUA_ID_MODUL] : formRoleBaru.modulDiizinkan,
      bawaanSistem: false,
      diperbaruiPada: new Date().toISOString()
    };
    db.tambahRoleSistem(roleBaru, pelakuAktif);
    const updated = db.getRoleSistem();
    setDaftarRole(updated);
    setRoleTerpilihId(roleBaru.id);
    setModalTambahRole(false);
    tampilNotifSukses(`Role baru "${roleBaru.nama}" berhasil ditambahkan.`);
  };

  const eksekusiHapusRole = () => {
    if (!konfirmasiHapusRole || !punyaAksesPenuh) return;
    const dipakai = daftarAkun.some((a) => a.roleId === konfirmasiHapusRole.id);
    if (dipakai) {
      tampilNotifGalat(`Role "${konfirmasiHapusRole.nama}" masih dipakai oleh user akun. Pindahkan user tersebut terlebih dahulu.`);
      setKonfirmasiHapusRole(null);
      return;
    }
    db.hapusRoleSistem(konfirmasiHapusRole.id, pelakuAktif);
    const updated = db.getRoleSistem();
    setDaftarRole(updated);
    setRoleTerpilihId(updated[0]?.id || 'pjt');
    tampilNotifSukses(`Role "${konfirmasiHapusRole.nama}" berhasil dihapus.`);
    setKonfirmasiHapusRole(null);
  };

  return (
    <div className="space-y-5">
      {/* Banner status hak akses saat ini */}
      {!punyaAksesPenuh ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-950">Mode Hanya-Baca (Akses Terbatas)</h3>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                Akun/peran aktif saat ini tidak memiliki hak <strong>Akses Penuh</strong>. Hanya user dengan Akses Penuh (seperti PJT atau Admin IT) yang dapat membuat user akun, menetapkan role, dan mengubah checklist modul.
              </p>
            </div>
          </div>
          <Badge tone="amber">{aksesAktif.modulDiizinkan.length} dari {SEMUA_ID_MODUL.length} modul diizinkan</Badge>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Kontrol Akses Penuh Aktif</h3>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Anda masuk sebagai <strong>{pelakuAktif}</strong> dengan wewenang penuh untuk membuat akun, mengatur role, dan mencentang batasan modul per role maupun per user.
              </p>
            </div>
          </div>
          <Badge tone="blue">Akses Penuh (14/14 Modul)</Badge>
        </div>
      )}

      {pesanSukses && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{pesanSukses}</span>
        </div>
      )}

      {pesanGalat && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-900 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
          <span>{pesanGalat}</span>
        </div>
      )}

      {/* 4 Stat Ringkas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Total User Akun"
          value={daftarAkun.length}
          hint={`${daftarAkun.filter((a) => a.status === 'Aktif').length} aktif · ${daftarAkun.filter((a) => a.status === 'Nonaktif').length} nonaktif`}
          tone="blue"
        />
        <Stat
          label="Total Role Terdaftar"
          value={daftarRole.length}
          hint={`${daftarRole.filter((r) => r.bawaanSistem).length} standar · ${daftarRole.filter((r) => !r.bawaanSistem).length} kustom`}
        />
        <Stat
          label="Akun Akses Penuh"
          value={jumlahAdminPenuhAktif}
          hint="Dapat mengatur user, role, & seluruh modul"
          tone="emerald"
        />
        <Stat
          label="Override Akses Kustom"
          value={daftarAkun.filter((a) => a.aksesKustom).length}
          hint="User dengan checklist modul khusus"
          tone="amber"
        />
      </div>

      {/* Switcher Sub-Tab */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setSubTab('akun')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'akun' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            Daftar User Akun ({daftarAkun.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('roles')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'roles' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            Manajemen Role & Checklist Modul ({daftarRole.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {punyaAksesPenuh && subTab === 'akun' && (
            <button type="button" onClick={bukaModalTambahAkun} className={tombolPrimer}>
              <UserPlus className="w-4 h-4" />
              Buat User Akun
            </button>
          )}
          {punyaAksesPenuh && subTab === 'roles' && (
            <button
              type="button"
              onClick={() => {
                setPesanGalat(null);
                setFormRoleBaru({
                  nama: '',
                  deskripsi: '',
                  basisPeran: 'auditor_internal',
                  aksesPenuh: false,
                  modulDiizinkan: ['overview']
                });
                setModalTambahRole(true);
              }}
              className={tombolPrimer}
            >
              <Plus className="w-4 h-4" />
              Tambah Role Baru
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: DAFTAR USER AKUN */}
      {subTab === 'akun' && (
        <Panel
          judul="Daftar User Akun & Penetapan Role"
          keterangan="Kelola akun pengguna, tetapkan role, serta tentukan apakah user mengikuti hak akses role atau menggunakan checklist modul kustom."
        >
          <div className="flex flex-col lg:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={kataKunci}
                onChange={(e) => setKataKunci(e.target.value)}
                placeholder="Cari nama lengkap, username, email, atau role..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white"
              aria-label="Filter role"
            >
              <option value="Semua">Semua Role</option>
              {daftarRole.map((r) => (
                <option key={r.id} value={r.id}>{r.nama}</option>
              ))}
            </select>

            <div className="flex items-center gap-1">
              {(['Semua', 'Aktif', 'Nonaktif'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={chipFilter(filterStatus === st)}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <th className="py-3 px-4">Pengguna</th>
                  <th className="py-3 px-4">Role Diberikan</th>
                  <th className="py-3 px-4">Batasan Akses Modul</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Dibuat / Login Terakhir</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {akunTersaring.map((akun) => {
                  const efektif = hitungAksesEfektif(akun, daftarRole);
                  const roleObj = daftarRole.find((r) => r.id === akun.roleId);
                  const isAkunAktif = akun.id === akunAktifId;
                  return (
                    <tr key={akun.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{akun.namaLengkap}</span>
                          {isAkunAktif && (
                            <span className="text-3xs font-semibold text-blue-700">· Sedang Aktif</span>
                          )}
                        </div>
                        <div className="text-2xs text-slate-500 mt-0.5 font-mono">
                          @{akun.username} · {akun.email}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{roleObj?.nama || akun.roleId}</div>
                        <div className="text-2xs text-slate-500">
                          {roleObj?.bawaanSistem ? 'Role standar sistem' : 'Role kustom'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {efektif.aksesPenuh ? (
                            <Badge tone="emerald">
                              <ShieldCheck className="w-3 h-3" />
                              Akses Penuh (14/14)
                            </Badge>
                          ) : (
                            <Badge tone={akun.aksesKustom ? 'amber' : 'blue'}>
                              <KeyRound className="w-3 h-3" />
                              <span className="tabular-nums">
                                {akun.aksesKustom ? 'Kustom User' : 'Ikuti Role'} ({efektif.modulDiizinkan.length}/{SEMUA_ID_MODUL.length})
                              </span>
                            </Badge>
                          )}
                        </div>
                        {!efektif.aksesPenuh && (
                          <div className="text-2xs text-slate-500 mt-1 max-w-xs truncate">
                            {efektif.modulDiizinkan.length === 0
                              ? 'Tidak ada modul dicentang'
                              : efektif.modulDiizinkan
                                  .map((id) => DAFTAR_MODUL_SISTEM.find((m) => m.id === id)?.nama || id)
                                  .join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge tone={akun.status === 'Aktif' ? 'emerald' : 'rose'}>
                          {akun.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-2xs text-slate-500 tabular-nums">
                        <div>Dibuat: {formatTanggal(akun.dibuatPada)}</div>
                        <div>Masuk: {akun.terakhirMasuk ? formatTanggal(akun.terakhirMasuk) : 'Belum tercatat'}</div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {punyaAksesPenuh ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => bukaModalEditAkun(akun, true)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer whitespace-nowrap"
                              title="Centang modul yang dapat diakses user ini"
                            >
                              Atur Akses
                            </button>
                            <button
                              type="button"
                              onClick={() => bukaModalEditAkun(akun, false)}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 cursor-pointer"
                              aria-label={`Edit ${akun.username}`}
                              title="Edit detail akun"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setKonfirmasiHapusAkun(akun)}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-slate-500 cursor-pointer"
                              aria-label={`Hapus ${akun.username}`}
                              title="Hapus akun"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-2xs text-slate-400">Hanya baca</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {akunTersaring.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 px-4 text-center text-slate-500">
                      <p className="text-xs font-semibold text-slate-700">Tidak ada user akun yang cocok dengan filter.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setKataKunci('');
                          setFilterRole('Semua');
                          setFilterStatus('Semua');
                        }}
                        className="mt-2 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                      >
                        Reset filter pencarian
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* TAB 2: MANAJEMEN ROLE & CHECKLIST MODUL */}
      {subTab === 'roles' && draftRole && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Kolom Kiri: Daftar Role */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-3.5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Daftar Role Sistem</h3>
              <p className="text-2xs text-slate-500 mt-0.5">Pilih role untuk melihat atau mencentang akses modul.</p>
            </div>
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {daftarRole.map((role) => {
                const aktif = role.id === draftRole.id;
                const jmlUser = daftarAkun.filter((a) => a.roleId === role.id).length;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setRoleTerpilihId(role.id)}
                    className={`w-full text-left px-4 py-3 transition-colors cursor-pointer ${
                      aktif ? 'bg-slate-900 text-white' : 'bg-white text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold truncate">{role.nama}</span>
                      <span
                        className={`text-2xs font-mono tabular-nums shrink-0 ${
                          aktif ? 'text-blue-300' : 'text-slate-500'
                        }`}
                      >
                        {role.aksesPenuh ? 'Penuh' : `${role.modulDiizinkan.length}/${SEMUA_ID_MODUL.length}`}
                      </span>
                    </div>
                    <div className={`text-2xs mt-1 flex items-center justify-between ${aktif ? 'text-slate-300' : 'text-slate-500'}`}>
                      <span>{role.bawaanSistem ? 'Role standar' : 'Role kustom'}</span>
                      <span className="tabular-nums">{jmlUser} akun</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kolom Kanan: Konfigurasi Role & Checklist Modul */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Konfigurasi Akses Role: {draftRole.nama}
                </h3>
                <p className="text-2xs text-slate-500 mt-0.5">
                  Centang modul yang boleh diakses oleh seluruh user yang menggunakan role ini.
                </p>
              </div>
              {punyaAksesPenuh && !draftRole.bawaanSistem && (
                <button
                  type="button"
                  onClick={() => setKonfirmasiHapusRole(draftRole)}
                  className={tombolBahaya}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Role
                </button>
              )}
            </div>

            <div className="p-5 space-y-5">
              {/* Identitas Role */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Nama Role</label>
                  <input
                    type="text"
                    disabled={!punyaAksesPenuh}
                    value={draftRole.nama}
                    onChange={(e) => setDraftRole({ ...draftRole, nama: e.target.value })}
                    className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-500`}
                  />
                </div>
                <div>
                  <label className={labelClass}>Basis Peran Operasional</label>
                  <select
                    disabled={!punyaAksesPenuh || Boolean(draftRole.bawaanSistem)}
                    value={draftRole.basisPeran}
                    onChange={(e) => setDraftRole({ ...draftRole, basisPeran: e.target.value as UserRole })}
                    className={`${inputClass} bg-white disabled:bg-slate-50 disabled:text-slate-500`}
                  >
                    {BASIS_PERAN_OPS.map((bp) => (
                      <option key={bp.value} value={bp.value}>{bp.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Deskripsi Tanggung Jawab</label>
                <input
                  type="text"
                  disabled={!punyaAksesPenuh}
                  value={draftRole.deskripsi}
                  onChange={(e) => setDraftRole({ ...draftRole, deskripsi: e.target.value })}
                  className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-500`}
                />
              </div>

              {/* Checkbox Akses Penuh */}
              <div className="pt-3 border-t border-slate-100">
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition-colors ${
                    draftRole.aksesPenuh
                      ? 'border-emerald-300 bg-emerald-50/70'
                      : 'border-slate-200 bg-slate-50'
                  } ${punyaAksesPenuh ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'}`}
                >
                  <input
                    type="checkbox"
                    disabled={!punyaAksesPenuh}
                    checked={draftRole.aksesPenuh}
                    onChange={(e) =>
                      setDraftRole({
                        ...draftRole,
                        aksesPenuh: e.target.checked,
                        modulDiizinkan: e.target.checked ? [...SEMUA_ID_MODUL] : draftRole.modulDiizinkan
                      })
                    }
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Berikan Akses Penuh (Administrator Penuh)
                    </div>
                    <p className="text-2xs text-slate-600 mt-0.5 leading-relaxed">
                      Jika dicentang, role ini otomatis memiliki akses ke seluruh {SEMUA_ID_MODUL.length} modul aplikasi serta wewenang mengelola menu User Account & Roles.
                    </p>
                  </div>
                </label>
              </div>

              {/* Checklist Modul per Grup */}
              <div className="pt-3 border-t border-slate-100 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Checklist Modul yang Dapat Diakses ({draftRole.aksesPenuh ? SEMUA_ID_MODUL.length : draftRole.modulDiizinkan.length}/{SEMUA_ID_MODUL.length})
                    </h4>
                    <p className="text-2xs text-slate-500">
                      Centang modul yang diizinkan untuk role ini. Modul yang tidak dicentang akan disembunyikan dan dibatasi.
                    </p>
                  </div>
                  {punyaAksesPenuh && !draftRole.aksesPenuh && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDraftRole({ ...draftRole, modulDiizinkan: [...SEMUA_ID_MODUL] })}
                        className={tombolSekunder}
                      >
                        Centang Semua
                      </button>
                      <button
                        type="button"
                        onClick={() => setDraftRole({ ...draftRole, modulDiizinkan: ['overview'] })}
                        className={tombolSekunder}
                      >
                        Hanya Overview
                      </button>
                      {draftRole.bawaanSistem && (
                        <button type="button" onClick={resetRoleKeBawaan} className={tombolSekunder}>
                          Reset Default
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {GRUP_MODUL_URUTAN.map((grup) => {
                    const modulGrup = DAFTAR_MODUL_SISTEM.filter((m) => m.grup === grup);
                    const semuaGrupAktif = modulGrup.every((m) =>
                      draftRole.aksesPenuh || draftRole.modulDiizinkan.includes(m.id)
                    );
                    return (
                      <div key={grup} className="border-t border-slate-100 pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-800">{grup}</span>
                          {punyaAksesPenuh && !draftRole.aksesPenuh && (
                            <button
                              type="button"
                              onClick={() => toggleGrupDraftRole(grup)}
                              className="text-2xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1"
                            >
                              {semuaGrupAktif ? (
                                <><CheckSquare className="w-3.5 h-3.5" /> Batalkan grup</>
                              ) : (
                                <><Square className="w-3.5 h-3.5" /> Pilih semua di grup</>
                              )}
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {modulGrup.map((modul) => {
                            const checked =
                              draftRole.aksesPenuh || draftRole.modulDiizinkan.includes(modul.id);
                            const disabled = !punyaAksesPenuh || draftRole.aksesPenuh;
                            return (
                              <label
                                key={modul.id}
                                className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-colors ${
                                  checked
                                    ? 'border-blue-200 bg-blue-50/60'
                                    : 'border-slate-200 bg-white hover:bg-slate-50'
                                } ${disabled ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                              >
                                <input
                                  type="checkbox"
                                  disabled={disabled}
                                  checked={checked}
                                  onChange={() => toggleModulDraftRole(modul.id)}
                                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-slate-900 leading-snug">
                                    {modul.nama}
                                  </div>
                                  <div className="text-2xs text-slate-500 leading-snug mt-0.5">
                                    {modul.deskripsi}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {punyaAksesPenuh && (
                <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button type="button" onClick={simpanPerubahanRole} className={tombolPrimer}>
                    <UserCheck className="w-4 h-4" />
                    Simpan Batasan Akses Role
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL BUAT / EDIT USER AKUN & CHECKLIST AKSES PER USER */}
      {modalAkunTerbuka && (
        <Modal
          judul={modeEditAkun ? `Kelola Akun: ${modeEditAkun.namaLengkap}` : 'Buat User Akun Baru'}
          keterangan="Tetapkan identitas login, role, serta checklist modul yang diizinkan untuk akun ini."
          onClose={() => setModalAkunTerbuka(false)}
        >
          <form onSubmit={simpanFormAkun} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Nama Lengkap &amp; Gelar</label>
                <input
                  type="text"
                  required
                  value={formAkun.namaLengkap}
                  onChange={(e) => setFormAkun({ ...formAkun, namaLengkap: e.target.value })}
                  placeholder="Contoh: apt. Sinta Maharani, S.Farm"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Username Login</label>
                <input
                  type="text"
                  required
                  value={formAkun.username}
                  onChange={(e) => setFormAkun({ ...formAkun, username: e.target.value })}
                  placeholder="Contoh: sinta.ra"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Email Perusahaan</label>
                <input
                  type="email"
                  value={formAkun.email}
                  onChange={(e) => setFormAkun({ ...formAkun, email: e.target.value })}
                  placeholder="nama@anugrahmitraselaras.co.id"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Kata Sandi</label>
                <div className="relative">
                  <input
                    type={tampilSandi ? 'text' : 'password'}
                    required
                    value={formAkun.kataSandi}
                    onChange={(e) => setFormAkun({ ...formAkun, kataSandi: e.target.value })}
                    placeholder="Minimal 6 karakter"
                    className={`${inputClass} pr-9`}
                  />
                  <button
                    type="button"
                    onClick={() => setTampilSandi(!tampilSandi)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    aria-label="Tampilkan atau sembunyikan kata sandi"
                  >
                    {tampilSandi ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Role Akun</label>
                <select
                  value={formAkun.roleId}
                  onChange={(e) => {
                    const nextRoleId = e.target.value;
                    const r = daftarRole.find((item) => item.id === nextRoleId);
                    setFormAkun((prev) => ({
                      ...prev,
                      roleId: nextRoleId,
                      modulDiizinkan: prev.aksesKustom
                        ? prev.modulDiizinkan
                        : r
                          ? [...r.modulDiizinkan]
                          : ['overview']
                    }));
                  }}
                  className={`${inputClass} bg-white`}
                >
                  {daftarRole.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nama} {r.aksesPenuh ? '(Akses Penuh)' : `(${r.modulDiizinkan.length} modul)`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Status Akun</label>
                <select
                  value={formAkun.status}
                  onChange={(e) => setFormAkun({ ...formAkun, status: e.target.value as 'Aktif' | 'Nonaktif' })}
                  className={`${inputClass} bg-white`}
                >
                  <option value="Aktif">Aktif (Diizinkan Masuk)</option>
                  <option value="Nonaktif">Nonaktif (Dibekukan)</option>
                </select>
              </div>
            </div>

            {/* Pilihan Mode Batasan Akses User */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div>
                <label className={labelClass}>Mode Batasan Akses Modul</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFormAkun({ ...formAkun, aksesKustom: false })}
                    className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      !formAkun.aksesKustom
                        ? 'border-blue-600 bg-blue-50 text-blue-950'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold">Ikuti Hak Akses Role</div>
                    <div className="text-2xs text-slate-600 mt-0.5">
                      Otomatis mengikuti modul yang dicentang pada role yang dipilih.
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const roleObj = daftarRole.find((r) => r.id === formAkun.roleId);
                      setFormAkun((prev) => ({
                        ...prev,
                        aksesKustom: true,
                        modulDiizinkan:
                          prev.aksesKustom
                            ? prev.modulDiizinkan
                            : roleObj
                              ? [...roleObj.modulDiizinkan]
                              : ['overview']
                      }));
                    }}
                    className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      formAkun.aksesKustom
                        ? 'border-amber-500 bg-amber-50 text-amber-950'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold">Atur Batasan Kustom Per User</div>
                    <div className="text-2xs text-slate-600 mt-0.5">
                      Centang modul tertentu khusus untuk akun ini secara individual.
                    </div>
                  </button>
                </div>
              </div>

              {formAkun.aksesKustom && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formAkun.aksesPenuhOverride}
                      onChange={(e) =>
                        setFormAkun({
                          ...formAkun,
                          aksesPenuhOverride: e.target.checked,
                          modulDiizinkan: e.target.checked ? [...SEMUA_ID_MODUL] : formAkun.modulDiizinkan
                        })
                      }
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-emerald-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Berikan Akses Penuh Khusus User Ini
                      </div>
                      <div className="text-2xs text-slate-600">
                        User ini dapat mengakses seluruh {SEMUA_ID_MODUL.length} modul dan mengelola User Account & Roles.
                      </div>
                    </div>
                  </label>

                  {!formAkun.aksesPenuhOverride && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          Centang Modul yang Bisa Diakses ({formAkun.modulDiizinkan.length}/{SEMUA_ID_MODUL.length})
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setFormAkun({ ...formAkun, modulDiizinkan: [...SEMUA_ID_MODUL] })}
                            className="text-2xs font-semibold text-blue-600 hover:underline cursor-pointer"
                          >
                            Centang Semua
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormAkun({ ...formAkun, modulDiizinkan: ['overview'] })}
                            className="text-2xs font-semibold text-slate-500 hover:underline cursor-pointer"
                          >
                            Hanya Overview
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                        {DAFTAR_MODUL_SISTEM.map((modul) => {
                          const checked = formAkun.modulDiizinkan.includes(modul.id);
                          return (
                            <label
                              key={modul.id}
                              className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer ${
                                checked ? 'border-blue-300 bg-blue-50/70' : 'border-slate-200 bg-white'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleModulFormAkun(modul.id)}
                                className="mt-0.5 w-3.5 h-3.5 rounded border-slate-300 text-blue-600"
                              />
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900 leading-tight">{modul.nama}</div>
                                <div className="text-2xs text-slate-500">{modul.grup}</div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button type="button" onClick={() => setModalAkunTerbuka(false)} className={tombolSekunder}>
                Batal
              </button>
              <button type="submit" className={tombolPrimer}>
                {modeEditAkun ? 'Simpan Perubahan Akun' : 'Simpan User Akun'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL TAMBAH ROLE BARU */}
      {modalTambahRole && (
        <Modal
          judul="Tambah Role Baru"
          keterangan="Buat role kustom baru dan tentukan daftar modul yang dapat diakses role ini."
          onClose={() => setModalTambahRole(false)}
        >
          <form onSubmit={simpanRoleBaru} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Nama Role</label>
                <input
                  type="text"
                  required
                  value={formRoleBaru.nama}
                  onChange={(e) => setFormRoleBaru({ ...formRoleBaru, nama: e.target.value })}
                  placeholder="Contoh: Supervisor Keuangan & Pajak"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Basis Peran Operasional</label>
                <select
                  value={formRoleBaru.basisPeran}
                  onChange={(e) => setFormRoleBaru({ ...formRoleBaru, basisPeran: e.target.value as UserRole })}
                  className={`${inputClass} bg-white`}
                >
                  {BASIS_PERAN_OPS.map((bp) => (
                    <option key={bp.value} value={bp.value}>{bp.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Deskripsi Singkat</label>
              <input
                type="text"
                value={formRoleBaru.deskripsi}
                onChange={(e) => setFormRoleBaru({ ...formRoleBaru, deskripsi: e.target.value })}
                placeholder="Wewenang dan tanggung jawab role ini..."
                className={inputClass}
              />
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 cursor-pointer">
              <input
                type="checkbox"
                checked={formRoleBaru.aksesPenuh}
                onChange={(e) =>
                  setFormRoleBaru({
                    ...formRoleBaru,
                    aksesPenuh: e.target.checked,
                    modulDiizinkan: e.target.checked ? [...SEMUA_ID_MODUL] : formRoleBaru.modulDiizinkan
                  })
                }
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-emerald-600"
              />
              <div>
                <div className="text-xs font-bold text-slate-900">Jadikan Role Akses Penuh</div>
                <div className="text-2xs text-slate-600">Role dapat mengakses seluruh modul serta mengelola akun & role.</div>
              </div>
            </label>

            {!formRoleBaru.aksesPenuh && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Centang Modul yang Diizinkan ({formRoleBaru.modulDiizinkan.length}/{SEMUA_ID_MODUL.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormRoleBaru({ ...formRoleBaru, modulDiizinkan: [...SEMUA_ID_MODUL] })}
                    className="text-2xs font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    Centang Semua
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                  {DAFTAR_MODUL_SISTEM.map((modul) => {
                    const checked = formRoleBaru.modulDiizinkan.includes(modul.id);
                    return (
                      <label
                        key={modul.id}
                        className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer ${
                          checked ? 'border-blue-300 bg-blue-50/70' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const ada = formRoleBaru.modulDiizinkan.includes(modul.id);
                            setFormRoleBaru({
                              ...formRoleBaru,
                              modulDiizinkan: ada
                                ? formRoleBaru.modulDiizinkan.filter((m) => m !== modul.id)
                                : [...formRoleBaru.modulDiizinkan, modul.id]
                            });
                          }}
                          className="mt-0.5 w-3.5 h-3.5 rounded border-slate-300 text-blue-600"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 leading-tight">{modul.nama}</div>
                          <div className="text-2xs text-slate-500">{modul.grup}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button type="button" onClick={() => setModalTambahRole(false)} className={tombolSekunder}>
                Batal
              </button>
              <button type="submit" className={tombolPrimer}>
                Simpan Role Baru
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL KONFIRMASI HAPUS AKUN */}
      {konfirmasiHapusAkun && (
        <Modal
          judul="Konfirmasi Hapus User Akun"
          keterangan="Tindakan ini akan menghapus akun pengguna dan dicatat dalam Audit Trail."
          onClose={() => setKonfirmasiHapusAkun(null)}
        >
          <p className="text-xs text-slate-700 leading-relaxed">
            Apakah Anda yakin ingin menghapus akun <strong>{konfirmasiHapusAkun.namaLengkap}</strong> (<span className="font-mono">@{konfirmasiHapusAkun.username}</span>)?
          </p>
          <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button type="button" onClick={() => setKonfirmasiHapusAkun(null)} className={tombolSekunder}>
              Batal
            </button>
            <button type="button" onClick={eksekusiHapusAkun} className={tombolBahaya}>
              Hapus Akun
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL KONFIRMASI HAPUS ROLE */}
      {konfirmasiHapusRole && (
        <Modal
          judul="Konfirmasi Hapus Role"
          keterangan="Role kustom akan dihapus permanen dari daftar otorisasi sistem."
          onClose={() => setKonfirmasiHapusRole(null)}
        >
          <p className="text-xs text-slate-700 leading-relaxed">
            Apakah Anda yakin ingin menghapus role <strong>{konfirmasiHapusRole.nama}</strong>?
          </p>
          <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button type="button" onClick={() => setKonfirmasiHapusRole(null)} className={tombolSekunder}>
              Batal
            </button>
            <button type="button" onClick={eksekusiHapusRole} className={tombolBahaya}>
              Hapus Role
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
