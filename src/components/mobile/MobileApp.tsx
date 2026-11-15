import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BriefcaseBusiness,
  CalendarClock,
  Crosshair,
  Home,
  ReceiptText,
  RefreshCw,
  ShoppingBag,
  UserCheck,
  UserCircle2
} from 'lucide-react';
import { db } from '../../services/pocketbase';
import {
  akhiriSesi,
  ambilSesiServer,
  bacaSesi,
  EVENT_SESI_BERAKHIR,
  keluarDariServer,
  type SesiLogin
} from '../../utils/autentikasi';
import LogoAplikasi, {
  terapkanFaviconAplikasi,
  useIdentitasVisualAplikasi
} from '../common/LogoAplikasi';
import { KartuMasuk } from '../modules/website/site/HalamanDepan';
import { OfflineIndicator } from '../pwa/OfflineIndicator';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { MobileAbsensiView } from './MobileAbsensiView';
import { MobileCrmView, type CrmSubTab } from './MobileCrmView';
import { MobileHomeView, type MobileNavTarget } from './MobileHomeView';
import { MobileProfilView } from './MobileProfilView';
import { MobileSalesView, type SalesSubTab } from './MobileSalesView';
import { MobileShiftCutiView } from './MobileShiftCutiView';
import { MobileSlipGajiView } from './MobileSlipGajiView';
import { findKaryawanForSession, getMobileCapabilities } from './mobileHelpers';

type MobileTabId =
  | 'beranda'
  | 'absensi'
  | 'shift-cuti'
  | 'slip-gaji'
  | 'hris'
  | 'crm'
  | 'penjualan'
  | 'profil';

const KOLEKSI_MOBILE_SINKRON = [
  'hris_karyawan',
  'hris_shift',
  'hris_absensi',
  'hris_cuti',
  'hris_slip_gaji',
  'sales_pelanggan',
  'sales_prospek',
  'sales_kunjungan',
  'sales_pra_order',
  'penjualan',
  'sales_tender',
  'sales_pengetahuan_produk',
  'stok_gudang',
  'izin_edar',
  'sales_skema_harga',
  'connection_status'
] as const;

export default function MobileApp() {
  const [sesi, setSesi] = useState<SesiLogin | null>(() => bacaSesi());
  const [memeriksaSesi, setMemeriksaSesi] = useState<boolean>(() => Boolean(bacaSesi()));
  const [tabAktif, setTabAktif] = useState<MobileTabId>('beranda');
  const [hrisSubTab, setHrisSubTab] = useState<'absensi' | 'shift-cuti' | 'slip-gaji'>('absensi');
  const [crmSubTab, setCrmSubTab] = useState<CrmSubTab>('prospek');
  const [salesSubTab, setSalesSubTab] = useState<SalesSubTab>('order');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | undefined>(undefined);
  const [tick, setTick] = useState(0);
  const [syncingPb, setSyncingPb] = useState(false);
  const [lastPbResult, setLastPbResult] = useState<string | null>(null);

  const identitasVisual = useIdentitasVisualAplikasi();

  useEffect(() => {
    terapkanFaviconAplikasi(identitasVisual.faviconUrl || identitasVisual.logoUrl);
  }, [identitasVisual.faviconUrl, identitasVisual.logoUrl]);

  const refresh = useCallback(() => {
    setTick((n) => n + 1);
  }, []);

  const sinkronkanPocketBase = useCallback(async () => {
    setSyncingPb(true);
    try {
      await db.syncFromServer(true);
      const pbRes = await db.syncFromPocketBaseAMS();
      const jam = new Date(pbRes.syncedAt).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });
      setLastPbResult(
        pbRes.pocketbaseOnline
          ? `PocketBase AMS tersinkron (${pbRes.updatedCollections.length} koleksi diperbarui, ${jam})`
          : `Server Real-Time Sync aktif (${jam}) · PocketBase AMS port 8091 standby`
      );
      refresh();
    } finally {
      setSyncingPb(false);
    }
  }, [refresh]);

  useEffect(() => {
    let aktif = true;
    const cekServer = async () => {
      if (!bacaSesi()) {
        await db.hydratePublicSettingsFromServer();
        if (aktif) setMemeriksaSesi(false);
        return;
      }
      const segar = await ambilSesiServer();
      if (segar) {
        db.prepareSessionSync(segar.userId);
        await db.syncFromServer(false);
        void db.syncFromPocketBaseAMS();
      } else {
        await db.hydratePublicSettingsFromServer();
      }
      if (aktif) {
        setSesi(segar);
        setMemeriksaSesi(false);
      }
    };
    void cekServer();

    const padaKedaluwarsa = () => {
      akhiriSesi();
      setSesi(null);
      setMemeriksaSesi(false);
    };
    window.addEventListener(EVENT_SESI_BERAKHIR, padaKedaluwarsa);
    return () => {
      aktif = false;
      window.removeEventListener(EVENT_SESI_BERAKHIR, padaKedaluwarsa);
    };
  }, []);

  useEffect(() => {
    db.connectRealtimeSync(sesi?.token || null);
  }, [sesi?.token]);

  useEffect(() => {
    if (!sesi?.token) return;
    const unsubRbac = db.subscribeRbacUpdated(() => {
      void ambilSesiServer().then((segar) => {
        setSesi(segar);
      });
    });
    const unsubKoleksi = db.subscribeKoleksi(KOLEKSI_MOBILE_SINKRON, refresh);
    return () => {
      unsubRbac();
      unsubKoleksi();
    };
  }, [sesi?.token, refresh]);

  const tanganiMasuk = async (sesiBaru: SesiLogin) => {
    setMemeriksaSesi(true);
    db.prepareSessionSync(sesiBaru.userId);
    await db.syncFromServer(false);
    if (!sesiBaru.isHiddenDeveloper) {
      db.logAudit(
        'Autentikasi & Akses',
        'Masuk berhasil ke AMS Mobile (RBAC server terverifikasi)',
        sesiBaru.namaPengguna,
        sesiBaru.namaLengkap,
        sesiBaru.namaPeran,
        [{ kolom: 'sesi', nilaiLama: 'Keluar', nilaiBaru: `Masuk ${sesiBaru.masukPada}` }]
      );
    }
    void db.syncFromPocketBaseAMS();
    db.connectRealtimeSync(sesiBaru.token || null);
    setSesi(sesiBaru);
    setTabAktif('beranda');
    setMemeriksaSesi(false);
  };

  const tanganiKeluar = async () => {
    await keluarDariServer();
    db.connectRealtimeSync(null);
    setSesi(null);
  };

  const capabilities = useMemo(() => getMobileCapabilities(sesi), [sesi]);

  // Baca data live dari store
  void tick;
  const karyawanList = db.getKaryawanHRIS();
  const absensiList = db.getAbsensi();
  const shiftList = db.getJadwalShift();
  const cutiList = db.getCuti();
  const slipList = db.getSlipGaji();
  const pelangganList = db.getPelangganB2B();
  const prospekList = db.getProspek();
  const kunjunganList = db.getKunjunganMedRep();
  const praOrderList = db.getPraOrder();
  const penjualanList = db.getPenjualan();
  const tenderList = db.getTender();
  const produkList = db.getPengetahuanProduk();
  const izinEdarList = db.getIzinEdar();
  const stokList = db.getStokGudang();
  const skemaHargaList = db.getSkemaHarga();
  const conn = db.getConnectionStatus();

  const karyawanAktif = useMemo(
    () => findKaryawanForSession(karyawanList, sesi, selectedEmployeeId),
    [karyawanList, sesi, selectedEmployeeId]
  );

  const tanganiNavigasi = (target: MobileNavTarget) => {
    if (target.tab === 'hris') {
      if (target.sub) setHrisSubTab(target.sub);
      setTabAktif('hris');
      return;
    }
    if (target.tab === 'crm') {
      if (target.sub) setCrmSubTab(target.sub);
      setTabAktif('crm');
      return;
    }
    if (target.tab === 'penjualan') {
      if (target.sub) setSalesSubTab(target.sub);
      setTabAktif('penjualan');
      return;
    }
    setTabAktif(target.tab);
  };

  const daftarTabBawah: {
    id: MobileTabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = capabilities.isSales
    ? [
        { id: 'beranda', label: 'Beranda', icon: Home },
        { id: 'hris', label: 'HRIS', icon: UserCheck },
        { id: 'crm', label: 'CRM', icon: BriefcaseBusiness },
        { id: 'penjualan', label: 'Penjualan', icon: ShoppingBag },
        { id: 'profil', label: 'Profil', icon: UserCircle2 }
      ]
    : [
        { id: 'beranda', label: 'Beranda', icon: Home },
        { id: 'absensi', label: 'Absensi', icon: Crosshair },
        { id: 'shift-cuti', label: 'Shift/Cuti', icon: CalendarClock },
        { id: 'slip-gaji', label: 'Slip Gaji', icon: ReceiptText },
        { id: 'profil', label: 'Profil', icon: UserCircle2 }
      ];

  const namaPemakai = karyawanAktif?.nama || sesi?.namaLengkap || 'Pengguna AMS';

  if (memeriksaSesi) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Menyelaraskan sesi AMS Mobile…
        </p>
      </div>
    );
  }

  if (!sesi) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between px-4 py-8">
        <div className="mx-auto w-full max-w-md my-auto space-y-4">
          <div className="text-center space-y-1">
            <p className="text-2xs font-bold uppercase tracking-widest text-teal-700">
              AMS Mobile App · HRIS &amp; CRM
            </p>
            <h1 className="text-lg font-bold text-slate-900">
              PT Anugrahmitra Selaras
            </h1>
          </div>
          <KartuMasuk
            logoUrl={identitasVisual.logoUrl}
            onTerima={(s) => void tanganiMasuk(s)}
            onBatal={() => {
              window.location.href = '/web/';
            }}
          />
          <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
            <a href="/web/" className="hover:text-teal-700 font-medium underline-offset-2 hover:underline">
              Lihat Situs Perusahaan
            </a>
            <span>·</span>
            <a href="/" className="hover:text-teal-700 font-medium underline-offset-2 hover:underline">
              Dashboard Web Desktop
            </a>
          </div>
        </div>
        <OfflineIndicator />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 h-13 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-full max-w-5xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <LogoAplikasi ukuran="sm" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 leading-none truncate">
                AMS Mobile
              </p>
              <p className="text-2xs text-slate-500 truncate mt-0.5">
                {capabilities.isSales ? 'HRIS · CRM · Sales' : 'HRIS Karyawan'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PWAInstallButton />
            <button
              type="button"
              onClick={() => void sinkronkanPocketBase()}
              disabled={syncingPb}
              aria-label="Sinkronkan PocketBase AMS"
              title="Sinkronkan PocketBase AMS & Server Real-Time"
              className="min-h-[40px] min-w-[40px] rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${syncingPb ? 'animate-spin text-teal-700' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-4">
        {tabAktif === 'beranda' && (
          <MobileHomeView
            namaPengguna={sesi.namaLengkap}
            capabilities={capabilities}
            karyawan={karyawanAktif}
            absensiList={absensiList}
            shiftList={shiftList}
            cutiList={cutiList}
            slipList={slipList}
            prospekList={prospekList}
            kunjunganList={kunjunganList}
            praOrderList={praOrderList}
            tenderList={tenderList}
            statusKoneksiLabel={conn.statusLabel}
            pocketbaseOnline={conn.isPocketBaseServerReachable}
            onNavigate={tanganiNavigasi}
          />
        )}

        {tabAktif === 'absensi' && (
          <MobileAbsensiView
            karyawan={karyawanAktif}
            absensiList={absensiList}
            onRefresh={refresh}
          />
        )}

        {tabAktif === 'shift-cuti' && (
          <MobileShiftCutiView
            karyawan={karyawanAktif}
            shiftList={shiftList}
            cutiList={cutiList}
            canApproveLeave={capabilities.canApproveLeave}
            approverName={sesi.namaLengkap}
            onRefresh={refresh}
          />
        )}

        {tabAktif === 'slip-gaji' && (
          <MobileSlipGajiView
            karyawan={karyawanAktif}
            slipList={slipList}
            canViewAllEmployees={capabilities.canViewAllEmployees}
          />
        )}

        {tabAktif === 'hris' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-200/70 p-1">
              {(
                [
                  { id: 'absensi', label: 'Absensi GPS' },
                  { id: 'shift-cuti', label: 'Shift & Cuti' },
                  { id: 'slip-gaji', label: 'Slip Gaji' }
                ] as const
              ).map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setHrisSubTab(sub.id)}
                  className={`min-h-[44px] rounded-lg px-2 text-xs font-bold transition cursor-pointer ${
                    hrisSubTab === sub.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
            {hrisSubTab === 'absensi' && (
              <MobileAbsensiView
                karyawan={karyawanAktif}
                absensiList={absensiList}
                onRefresh={refresh}
              />
            )}
            {hrisSubTab === 'shift-cuti' && (
              <MobileShiftCutiView
                karyawan={karyawanAktif}
                shiftList={shiftList}
                cutiList={cutiList}
                canApproveLeave={capabilities.canApproveLeave}
                approverName={sesi.namaLengkap}
                onRefresh={refresh}
              />
            )}
            {hrisSubTab === 'slip-gaji' && (
              <MobileSlipGajiView
                karyawan={karyawanAktif}
                slipList={slipList}
                canViewAllEmployees={capabilities.canViewAllEmployees}
              />
            )}
          </div>
        )}

        {tabAktif === 'crm' && capabilities.isSales && (
          <MobileCrmView
            key={crmSubTab}
            salesName={namaPemakai}
            pelangganList={pelangganList}
            prospekList={prospekList}
            kunjunganList={kunjunganList}
            initialSubTab={crmSubTab}
            onRefresh={refresh}
          />
        )}

        {tabAktif === 'penjualan' && capabilities.isSales && (
          <MobileSalesView
            key={salesSubTab}
            salesName={namaPemakai}
            canManageOrders={capabilities.canManageOrders}
            pelangganList={pelangganList}
            praOrderList={praOrderList}
            penjualanList={penjualanList}
            tenderList={tenderList}
            produkList={produkList}
            izinEdarList={izinEdarList}
            stokList={stokList}
            skemaHargaList={skemaHargaList}
            initialSubTab={salesSubTab}
            onRefresh={refresh}
          />
        )}

        {tabAktif === 'profil' && (
          <MobileProfilView
            sesi={sesi}
            karyawan={karyawanAktif}
            allKaryawan={karyawanList}
            canSwitchProfile={capabilities.canViewAllEmployees}
            selectedEmployeeId={selectedEmployeeId}
            onSelectEmployee={setSelectedEmployeeId}
            onSyncPocketBase={sinkronkanPocketBase}
            syncingPb={syncingPb}
            lastPbResult={lastPbResult}
            onKeluar={() => void tanganiKeluar()}
          />
        )}
      </main>

      <OfflineIndicator />

      {/* Fixed Bottom Navigation */}
      <nav
        aria-label="Navigasi Mobile AMS"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto grid h-16 max-w-5xl grid-cols-5">
          {daftarTabBawah.map((item) => {
            const Icon = item.icon;
            const aktif = tabAktif === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTabAktif(item.id)}
                className={`flex flex-col items-center justify-center gap-0.5 text-2xs font-bold transition cursor-pointer ${
                  aktif ? 'text-teal-700' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${aktif ? 'stroke-[2.4]' : 'stroke-[1.9]'}`} />
                <span className="truncate max-w-full px-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
