/**
 * HALAMAN DEPAN APLIKASI — tampilan situs publik yang sama, dipakai sebagai beranda
 * sebelum pengguna masuk. Dashboard hanya dirender setelah sesi login tersimpan.
 */
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Eye, EyeOff, KeyRound, LogIn, ShieldCheck, X } from 'lucide-react';
import type { KonfigurasiSitus } from '../../../../types';
import { db } from '../../../../services/pocketbase';
import {
  ambilStatusSetupServer,
  buatAkunDeveloperAwalServer,
  masukDenganServer,
  type SesiLogin
} from '../../../../utils/autentikasi';
import LogoAplikasi from '../../../common/LogoAplikasi';
import PublicWebsite from './PublicWebsite';
import { tentukanKontenTayang, useKonfigurasiOperasionalSinkron } from './PublicWebsiteApp';

type StatusMuat = 'memuat' | 'selesai';

export default function HalamanDepan({ onMasuk }: { onMasuk: (sesi: SesiLogin) => void }) {
  const [konfigurasiDasar, setKonfigurasiDasar] = useState<KonfigurasiSitus | null>(null);
  const [statusTayang, setStatusTayang] = useState<'tayang' | 'belum' | 'tahan'>('belum');
  const [status, setStatus] = useState<StatusMuat>('memuat');
  const [formTerbuka, setFormTerbuka] = useState(() => new URLSearchParams(window.location.search).get('masuk') === '1');

  const konfigurasi = useKonfigurasiOperasionalSinkron(konfigurasiDasar);

  useEffect(() => {
    let batal = false;
    const muat = () => {
      tentukanKontenTayang().then(({ konfigurasi: isi, status: st }) => {
        if (batal) return;
        setKonfigurasiDasar(isi);
        setStatusTayang(st);
        setStatus('selesai');
      });
    };

    void ambilStatusSetupServer().then((stSetup) => {
      if (!batal && stSetup.needsSetup) {
        setFormTerbuka(true);
      }
    });

    void db.hydratePublicSettingsFromServer().finally(() => {
      if (!batal) muat();
    });
    db.connectRealtimeSync(null);
    const berhentiTerbit = db.subscribeKoleksi(['website_published', 'website_media_v1'], muat);
    return () => {
      batal = true;
      berhentiTerbit();
    };
  }, []);

  const terima = (sesi: SesiLogin) => {
    setFormTerbuka(false);
    onMasuk(sesi);
  };

  if (status === 'memuat') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Memuat halaman…</p>
      </div>
    );
  }

  /* Tanpa konten terbit (mis. publikasi ditahan) gerbang tetap harus bisa dibuka. */
  if (!konfigurasi || statusTayang !== 'tayang') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <KartuMasuk onTerima={terima} onBatal={() => window.location.href = '/web/'} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <PublicWebsite konfigurasi={konfigurasi} landasan="/" padaMasuk={() => setFormTerbuka(true)} />
      {formTerbuka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setFormTerbuka(false)} />
          <div className="relative w-full max-w-md my-auto">
            <KartuMasuk logoUrl={konfigurasi.identitas.logoUrl} onTerima={terima} onBatal={() => setFormTerbuka(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

export function KartuMasuk({
  logoUrl,
  onTerima,
  onBatal
}: {
  logoUrl?: string;
  onTerima: (sesi: SesiLogin) => void;
  onBatal: () => void;
}) {
  const [memeriksaSetup, setMemeriksaSetup] = useState(true);
  const [modeSetup, setModeSetup] = useState(false);
  const [butuhTokenSetup, setButuhTokenSetup] = useState(false);

  // State Form Login Biasa
  const [namaPengguna, setNamaPengguna] = useState('');
  const [kataSandi, setKataSandi] = useState('');
  const [tampilSandi, setTampilSandi] = useState(false);

  // State Form Setup Wizard Sekali Pakai
  const [setupNamaLengkap, setSetupNamaLengkap] = useState('');
  const [setupUsername, setSetupUsername] = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupSandi, setSetupSandi] = useState('');
  const [setupKonfirmasiSandi, setSetupKonfirmasiSandi] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [tampilSetupSandi, setTampilSetupSandi] = useState(false);

  const [galat, setGalat] = useState('');
  const [memproses, setMemproses] = useState(false);
  const bidangRef = useRef<HTMLInputElement>(null);
  const setupRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let aktif = true;
    void ambilStatusSetupServer().then((st) => {
      if (!aktif) return;
      setModeSetup(st.needsSetup);
      setButuhTokenSetup(st.requiresSetupToken);
      setMemeriksaSetup(false);
      requestAnimationFrame(() => {
        if (st.needsSetup) {
          setupRef.current?.focus();
        } else {
          bidangRef.current?.focus();
        }
      });
    });

    const tutup = (e: KeyboardEvent) => e.key === 'Escape' && onBatal();
    window.addEventListener('keydown', tutup);
    return () => {
      aktif = false;
      window.removeEventListener('keydown', tutup);
    };
  }, [onBatal]);

  const kirimLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (memproses) return;
    setGalat('');
    setMemproses(true);
    const hasil = await masukDenganServer(namaPengguna, kataSandi);
    if (!hasil.ok) {
      db.logAudit('Autentikasi & Akses', `Percobaan masuk ditolak server: ${hasil.pesan}`, namaPengguna.trim() || '-', namaPengguna.trim() || '-', 'Pengguna');
      setGalat(hasil.pesan);
      setMemproses(false);
      return;
    }
    if (!hasil.sesi.isHiddenDeveloper) {
      db.logAudit('Autentikasi & Akses', 'Masuk berhasil (RBAC server terverifikasi)', hasil.sesi.namaPengguna, hasil.sesi.namaLengkap, hasil.sesi.namaPeran, [
        { kolom: 'sesi', nilaiLama: 'Keluar', nilaiBaru: `Masuk ${hasil.sesi.masukPada}` }
      ]);
    }
    setMemproses(false);
    onTerima(hasil.sesi);
  };

  const kirimSetup = async (e: FormEvent) => {
    e.preventDefault();
    if (memproses) return;
    setGalat('');

    const usernameBersih = setupUsername.trim().toLowerCase();
    if (!setupNamaLengkap.trim()) {
      setGalat('Nama lengkap developer wajib diisi.');
      return;
    }
    if (!/^[a-z0-9._-]{3,32}$/.test(usernameBersih)) {
      setGalat('Username harus 3–32 karakter (huruf kecil, angka, titik, garis bawah, atau tanda hubung).');
      return;
    }
    if (setupSandi.length < 8) {
      setGalat('Kata sandi developer minimal 8 karakter.');
      return;
    }
    if (setupSandi !== setupKonfirmasiSandi) {
      setGalat('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    if (butuhTokenSetup && !setupToken.trim()) {
      setGalat('Token inisialisasi (INITIAL_SETUP_TOKEN) wajib diisi sesuai konfigurasi server.');
      return;
    }

    setMemproses(true);
    const hasil = await buatAkunDeveloperAwalServer({
      fullName: setupNamaLengkap,
      username: usernameBersih,
      email: setupEmail,
      password: setupSandi,
      setupToken: butuhTokenSetup ? setupToken : undefined
    });

    if (!hasil.ok) {
      setGalat(hasil.pesan);
      setMemproses(false);
      // Jika server menolak karena setup ternyata sudah diselesaikan tab/CLI lain, beralih ke mode login
      const stBaru = await ambilStatusSetupServer();
      if (!stBaru.needsSetup) {
        setModeSetup(false);
      }
      return;
    }

    if (!hasil.sesi.isHiddenDeveloper) {
      db.logAudit(
        'Autentikasi & Akses',
        'Inisialisasi akun developer pertama berhasil via Setup Wizard sekali pakai',
        hasil.sesi.namaPengguna,
        hasil.sesi.namaLengkap,
        hasil.sesi.namaPeran
      );
    }
    setMemproses(false);
    onTerima(hasil.sesi);
  };

  const gayaBidang = 'w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[var(--brand)] focus:border-[var(--brand)] outline-none';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl">
      <div className="flex items-start gap-3">
        <LogoAplikasi overrideUrl={logoUrl} ukuran="lg" />
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-tight">
            {modeSetup ? 'Setup Developer Awal (Sekali Pakai)' : 'Masuk ke Aplikasi AMS'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {modeSetup
              ? 'Belum ada akun terdaftar di server. Buat akun Administrator / Developer pertama; setelah tersimpan, wizard ini terkunci permanen.'
              : 'Halaman ini memakai tampilan situs perusahaan. Dashboard CDAKB & ISO terbuka setelah Anda masuk.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onBatal}
          aria-label="Tutup form masuk"
          className="ml-auto p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {memeriksaSetup ? (
        <div className="py-8 text-center text-xs text-slate-500">Memeriksa status inisialisasi server…</div>
      ) : modeSetup ? (
        <form onSubmit={kirimSetup} className="mt-5 space-y-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2.5 flex items-start gap-2.5 text-xs text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>
              Kredensial disimpan permanen dalam hash <strong>scrypt</strong> sebagai akun developer tersembunyi (tidak muncul di tabel pengguna modul RBAC) dan memiliki akses penuh.
            </span>
          </div>

          <label className="block">
            <span className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Nama Lengkap Developer</span>
            <input
              ref={setupRef}
              value={setupNamaLengkap}
              onChange={(e) => { setSetupNamaLengkap(e.target.value); setGalat(''); }}
              autoComplete="name"
              className={gayaBidang}
              placeholder="Nama lengkap penanggung jawab / developer"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Username</span>
              <input
                value={setupUsername}
                onChange={(e) => { setSetupUsername(e.target.value); setGalat(''); }}
                autoComplete="username"
                className={gayaBidang}
                placeholder="mis. dev.utama"
              />
            </label>
            <label className="block">
              <span className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Email (Opsional)</span>
              <input
                type="email"
                value={setupEmail}
                onChange={(e) => { setSetupEmail(e.target.value); setGalat(''); }}
                autoComplete="email"
                className={gayaBidang}
                placeholder="dev@perusahaan.co.id"
              />
            </label>
          </div>

          <label className="block">
            <span className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Kata Sandi (Min. 8 Karakter)</span>
            <span className="relative block">
              <input
                value={setupSandi}
                onChange={(e) => { setSetupSandi(e.target.value); setGalat(''); }}
                type={tampilSetupSandi ? 'text' : 'password'}
                autoComplete="new-password"
                className={`${gayaBidang} pr-10`}
                placeholder="Buat kata sandi kuat minimal 8 karakter"
              />
              <button
                type="button"
                onClick={() => setTampilSetupSandi((t) => !t)}
                aria-label={tampilSetupSandi ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                {tampilSetupSandi ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </span>
          </label>

          <label className="block">
            <span className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Konfirmasi Kata Sandi</span>
            <input
              value={setupKonfirmasiSandi}
              onChange={(e) => { setSetupKonfirmasiSandi(e.target.value); setGalat(''); }}
              type={tampilSetupSandi ? 'text' : 'password'}
              autoComplete="new-password"
              className={gayaBidang}
              placeholder="Ulangi kata sandi"
            />
          </label>

          {butuhTokenSetup && (
            <label className="block">
              <span className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                <KeyRound className="w-3 h-3" /> Token Inisialisasi Setup
              </span>
              <input
                value={setupToken}
                onChange={(e) => { setSetupToken(e.target.value); setGalat(''); }}
                type="password"
                className={gayaBidang}
                placeholder="Sesuai INITIAL_SETUP_TOKEN di server"
              />
            </label>
          )}

          {galat && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
              {galat}
            </p>
          )}

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[var(--brand)] hover:bg-[color-mix(in_srgb,var(--brand)_85%,black)] text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
            disabled={memproses || !setupNamaLengkap.trim() || !setupUsername.trim() || !setupSandi || !setupKonfirmasiSandi}
          >
            <ShieldCheck className="w-4 h-4" />
            {memproses ? 'Menyimpan & Mengunci Setup…' : 'Buat Akun Developer & Masuk'}
          </button>
        </form>
      ) : (
        <form onSubmit={kirimLogin} className="mt-5 space-y-3">
          <label className="block">
            <span className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Nama pengguna</span>
            <input
              ref={bidangRef}
              value={namaPengguna}
              onChange={(e) => { setNamaPengguna(e.target.value); setGalat(''); }}
              autoComplete="username"
              className={gayaBidang}
              placeholder="Username Anda"
            />
          </label>
          <label className="block">
            <span className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Kata sandi</span>
            <span className="relative block">
              <input
                value={kataSandi}
                onChange={(e) => { setKataSandi(e.target.value); setGalat(''); }}
                type={tampilSandi ? 'text' : 'password'}
                autoComplete="current-password"
                className={`${gayaBidang} pr-10`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setTampilSandi((t) => !t)}
                aria-label={tampilSandi ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                {tampilSandi ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </span>
          </label>

          {galat && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
              {galat}
            </p>
          )}

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[var(--brand)] hover:bg-[color-mix(in_srgb,var(--brand)_85%,black)] text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
            disabled={memproses || !namaPengguna || !kataSandi}
          >
            <LogIn className="w-4 h-4" />
            {memproses ? 'Memverifikasi…' : 'Masuk'}
          </button>
        </form>
      )}
    </div>
  );
}
