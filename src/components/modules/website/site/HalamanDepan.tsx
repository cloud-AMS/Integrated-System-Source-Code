/**
 * HALAMAN DEPAN APLIKASI — tampilan situs publik yang sama, dipakai sebagai beranda
 * sebelum pengguna masuk. Dashboard hanya dirender setelah sesi login tersimpan.
 */
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Eye, EyeOff, KeyRound, LogIn, ShieldCheck, Smartphone, X } from 'lucide-react';
import type { KonfigurasiSitus } from '../../../../types';
import { db } from '../../../../services/pocketbase';
import {
  ambilStatusSetupServer,
  buatAkunDeveloperAwalServer,
  masukDenganGoogleFirebaseServer,
  masukDenganServer,
  resetKataSandiDeveloperServer,
  type SesiLogin
} from '../../../../utils/autentikasi';
import LogoAplikasi from '../../../common/LogoAplikasi';
import { MobilePreviewModal } from '../../../mobile/MobilePreviewModal';
import PublicWebsite from './PublicWebsite';
import { tentukanKontenTayang, useKonfigurasiOperasionalSinkron } from './PublicWebsiteApp';

type StatusMuat = 'memuat' | 'selesai';

export default function HalamanDepan({ onMasuk }: { onMasuk: (sesi: SesiLogin) => void }) {
  const [konfigurasiDasar, setKonfigurasiDasar] = useState<KonfigurasiSitus | null>(null);
  const [statusTayang, setStatusTayang] = useState<'tayang' | 'belum' | 'tahan'>('belum');
  const [status, setStatus] = useState<StatusMuat>('memuat');
  const [formTerbuka, setFormTerbuka] = useState(() => new URLSearchParams(window.location.search).get('masuk') === '1');
  const [previewMobileTerbuka, setPreviewMobileTerbuka] = useState(
    () => new URLSearchParams(window.location.search).get('preview') === 'mobile'
  );

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
      if (!batal && (stSetup.needsSetup || stSetup.needsDeveloperReset)) {
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
        <div className="w-full max-w-md space-y-3">
          <KartuMasuk onTerima={terima} onBatal={() => window.location.href = '/web/'} />
          <button
            type="button"
            onClick={() => setPreviewMobileTerbuka(true)}
            className="w-full min-h-[44px] rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-xs font-bold text-teal-800 inline-flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
            Tampilkan Preview Aplikasi Mobile (/mobile)
          </button>
        </div>
        <MobilePreviewModal
          isOpen={previewMobileTerbuka}
          onClose={() => setPreviewMobileTerbuka(false)}
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <PublicWebsite konfigurasi={konfigurasi} landasan="/" padaMasuk={() => setFormTerbuka(true)} />
      <button
        type="button"
        onClick={() => setPreviewMobileTerbuka(true)}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-teal-500 bg-teal-700 hover:bg-teal-800 px-4 py-2.5 text-xs font-bold text-white shadow-lg transition cursor-pointer"
      >
        <Smartphone className="w-4 h-4" />
        Preview Mobile App
      </button>
      {formTerbuka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setFormTerbuka(false)} />
          <div className="relative w-full max-w-md my-auto">
            <KartuMasuk logoUrl={konfigurasi.identitas.logoUrl} onTerima={terima} onBatal={() => setFormTerbuka(false)} />
          </div>
        </div>
      )}
      <MobilePreviewModal
        isOpen={previewMobileTerbuka}
        onClose={() => setPreviewMobileTerbuka(false)}
      />
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
  const [resetDevTersedia, setResetDevTersedia] = useState(false);
  const [modeResetDev, setModeResetDev] = useState(false);
  const [infoResetDev, setInfoResetDev] = useState<{ username: string; fullName: string; roleName: string } | null>(null);

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

  // State Form Reset Kata Sandi Developer
  const [resetKode, setResetKode] = useState('');
  const [resetSandiBaru, setResetSandiBaru] = useState('');
  const [resetKonfirmasiSandi, setResetKonfirmasiSandi] = useState('');
  const [tampilResetSandi, setTampilResetSandi] = useState(false);

  const [galat, setGalat] = useState('');
  const [memproses, setMemproses] = useState(false);
  const bidangRef = useRef<HTMLInputElement>(null);
  const setupRef = useRef<HTMLInputElement>(null);
  const resetKodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let aktif = true;
    const periksaSetup = () => {
      void ambilStatusSetupServer().then((st) => {
        if (!aktif) return;
        const adaReset = Boolean(st.needsDeveloperReset);
        setModeSetup(st.needsSetup);
        setButuhTokenSetup(st.requiresSetupToken);
        setResetDevTersedia(adaReset);
        setModeResetDev(adaReset && !st.needsSetup);
        setInfoResetDev(st.developerResetUser ?? null);
        setMemeriksaSetup(false);
        requestAnimationFrame(() => {
          if (st.needsSetup) {
            setupRef.current?.focus();
          } else if (adaReset) {
            resetKodeRef.current?.focus();
          } else {
            bidangRef.current?.focus();
          }
        });
      });
    };
    periksaSetup();
    const unsubRbac = db.subscribeRbacUpdated(periksaSetup);

    const tutup = (e: KeyboardEvent) => e.key === 'Escape' && onBatal();
    window.addEventListener('keydown', tutup);
    return () => {
      aktif = false;
      unsubRbac();
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
      setGalat(hasil.pesan);
      setMemproses(false);
      return;
    }
    setMemproses(false);
    onTerima(hasil.sesi);
  };

  const kirimLoginGoogle = async () => {
    if (memproses) return;
    setGalat('');
    setMemproses(true);
    const hasil = await masukDenganGoogleFirebaseServer();
    if (!hasil.ok) {
      setGalat(hasil.pesan);
      setMemproses(false);
      return;
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

    setMemproses(false);
    onTerima(hasil.sesi);
  };

  const kirimResetDev = async (e: FormEvent) => {
    e.preventDefault();
    if (memproses) return;
    setGalat('');

    if (!resetKode.trim()) {
      setGalat('Kode verifikasi reset wajib diisi.');
      return;
    }
    if (resetSandiBaru.length < 8) {
      setGalat('Kata sandi baru developer minimal 8 karakter.');
      return;
    }
    if (resetSandiBaru !== resetKonfirmasiSandi) {
      setGalat('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setMemproses(true);
    const hasil = await resetKataSandiDeveloperServer({
      resetCode: resetKode,
      newPassword: resetSandiBaru
    });

    if (!hasil.ok) {
      setGalat(hasil.pesan);
      setMemproses(false);
      return;
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
            {modeSetup
              ? 'Setup Developer Awal (Sekali Pakai)'
              : modeResetDev
                ? 'Reset Kata Sandi Developer'
                : 'Masuk ke Aplikasi AMS'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {modeSetup
              ? 'Belum ada akun terdaftar di server. Buat akun Administrator / Developer pertama; setelah tersimpan, wizard ini terkunci permanen.'
              : modeResetDev
                ? 'Masukkan kode reset satu kali dan tetapkan kata sandi baru untuk akun developer.'
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
      ) : modeResetDev ? (
        <form onSubmit={kirimResetDev} className="mt-5 space-y-3">
          <div className="rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2.5 space-y-1 text-xs text-amber-950">
            <div className="flex items-center gap-2 font-semibold">
              <KeyRound className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Akun Target: {infoResetDev?.username || 'dev.admin'}</span>
            </div>
            <p className="text-slate-700">
              {infoResetDev?.fullName || 'Langgo Bramandityo'} · {infoResetDev?.roleName || 'Developer & IT Support'}
            </p>
          </div>

          <label className="block">
            <span className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Kode Verifikasi Reset Satu Kali
            </span>
            <input
              ref={resetKodeRef}
              value={resetKode}
              onChange={(e) => { setResetKode(e.target.value); setGalat(''); }}
              autoComplete="one-time-code"
              className={`${gayaBidang} font-mono tracking-wide`}
              placeholder="Contoh: AMS-RESET-XXXXXXXXXXXX"
            />
          </label>

          <label className="block">
            <span className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Kata Sandi Baru (Min. 8 Karakter)
            </span>
            <span className="relative block">
              <input
                value={resetSandiBaru}
                onChange={(e) => { setResetSandiBaru(e.target.value); setGalat(''); }}
                type={tampilResetSandi ? 'text' : 'password'}
                autoComplete="new-password"
                className={`${gayaBidang} pr-10`}
                placeholder="Masukkan kata sandi baru minimal 8 karakter"
              />
              <button
                type="button"
                onClick={() => setTampilResetSandi((t) => !t)}
                aria-label={tampilResetSandi ? 'Sembunyikan kata sandi baru' : 'Tampilkan kata sandi baru'}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                {tampilResetSandi ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </span>
          </label>

          <label className="block">
            <span className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Konfirmasi Kata Sandi Baru
            </span>
            <input
              value={resetKonfirmasiSandi}
              onChange={(e) => { setResetKonfirmasiSandi(e.target.value); setGalat(''); }}
              type={tampilResetSandi ? 'text' : 'password'}
              autoComplete="new-password"
              className={gayaBidang}
              placeholder="Ulangi kata sandi baru"
            />
          </label>

          {galat && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
              {galat}
            </p>
          )}

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[var(--brand)] hover:bg-[color-mix(in_srgb,var(--brand)_85%,black)] text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
            disabled={memproses || !resetKode.trim() || !resetSandiBaru || !resetKonfirmasiSandi}
          >
            <KeyRound className="w-4 h-4" />
            {memproses ? 'Menyimpan Kata Sandi Baru…' : 'Simpan Kata Sandi Baru & Masuk'}
          </button>

          <button
            type="button"
            onClick={() => {
              setModeResetDev(false);
              setGalat('');
            }}
            className="w-full text-center text-xs font-semibold text-slate-600 hover:text-slate-900 py-1 cursor-pointer"
          >
            Masuk dengan akun pengguna lain
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

          <div className="relative py-1 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">atau</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={() => void kirimLoginGoogle()}
            disabled={memproses}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Masuk dengan Google (Firebase Cloud)
          </button>
          <p className="text-[11px] text-slate-500 text-center leading-relaxed">
            Login Google menyinkronkan akun, peran RBAC, data CMS situs, dan transaksi ERP secara persisten ke Firebase Firestore lintas re-publish.
          </p>

          {resetDevTersedia && (
            <button
              type="button"
              onClick={() => {
                setModeResetDev(true);
                setGalat('');
              }}
              className="w-full text-center text-xs font-semibold text-amber-800 hover:text-amber-950 py-1 cursor-pointer"
            >
              Lanjutkan Reset Kata Sandi Developer ({infoResetDev?.username || 'dev.admin'})
            </button>
          )}
        </form>
      )}
    </div>
  );
}
