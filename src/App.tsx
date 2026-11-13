/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * coded by Langgo Bramandityo
 */

import { useEffect, useMemo, useState } from 'react';
import Navbar, { type NavId } from './components/layout/Navbar';
import ExecutiveOverview from './components/dashboard/ExecutiveOverview';
import TraceabilityModal from './components/traceability/TraceabilityModal';
import PrintModal from './components/common/PrintModal';
import { terapkanFaviconAplikasi, useIdentitasVisualAplikasi } from './components/common/LogoAplikasi';
import HalamanDepan from './components/modules/website/site/HalamanDepan';

// Module components
import RegulatoryModule from './components/modules/regulatory/RegulatoryModule';
import QAModule from './components/modules/regulatory/QAModule';
import QCModule from './components/modules/regulatory/QCModule';
import WarehouseModule from './components/modules/operations/WarehouseModule';
import type { GudangTabId } from './components/modules/operations/gudang/ui';
import ServiceModule from './components/modules/operations/ServiceModule';
import ProductionModule from './components/modules/operations/ProductionModule';
import ProcurementModule from './components/modules/operations/ProcurementModule';
import SalesModule, { type SalesTab } from './components/modules/commercial/SalesModule';
import PMSModule from './components/modules/commercial/PMSModule';
import HRDModule from './components/modules/supporting/HRDModule';
import FinanceModule from './components/modules/supporting/FinanceModule';
import ITModule, { type ITSubTabId } from './components/modules/supporting/ITModule';
import WebsiteModule from './components/modules/website/WebsiteModule';

import type { AksesEfektif, ModuleNavId, UserRole } from './types';
import { Lock, ShieldCheck, X } from 'lucide-react';
import {
  akhiriSesi,
  ambilSesiServer,
  bacaSesi,
  bolehAksesModul as bolehAksesModulSesi,
  EVENT_SESI_BERAKHIR,
  keluarDariServer,
  type SesiLogin
} from './utils/autentikasi';
import { SEMUA_ID_MODUL, bolehAksesModul } from './utils/hakAkses';

export default function App() {
  const [sesi, setSesi] = useState<SesiLogin | null>(() => bacaSesi());
  const [memeriksaSesi, setMemeriksaSesi] = useState<boolean>(() => Boolean(bacaSesi()));
  const identitasVisual = useIdentitasVisualAplikasi();

  useEffect(() => {
    terapkanFaviconAplikasi(identitasVisual.faviconUrl || identitasVisual.logoUrl);
  }, [identitasVisual.faviconUrl, identitasVisual.logoUrl]);

  useEffect(() => {
    let aktif = true;
    const cekServer = async () => {
      if (!bacaSesi()) {
        if (aktif) setMemeriksaSesi(false);
        return;
      }
      const segar = await ambilSesiServer();
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

  if (memeriksaSesi) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Memverifikasi sesi RBAC server…
        </p>
      </div>
    );
  }

  if (!sesi) return <HalamanDepan onMasuk={setSesi} />;

  return (
    <Dasbor
      sesi={sesi}
      onSegarkanSesi={async () => {
        const segar = await ambilSesiServer();
        if (segar) setSesi(segar);
      }}
      onKeluar={() => {
        void keluarDariServer().then(() => setSesi(null));
      }}
    />
  );
}

/** Isi dashboard; tab awal 'overview' adalah menu CDAKB & ISO. */
function Dasbor({
  sesi,
  onSegarkanSesi,
  onKeluar
}: {
  sesi: SesiLogin;
  onSegarkanSesi: () => Promise<void>;
  onKeluar: () => void;
}) {
  const currentRole: UserRole = sesi.peran;
  const aksesAktif: AksesEfektif = useMemo(() => {
    const diizinkan: ModuleNavId[] = SEMUA_ID_MODUL.filter((id) =>
      bolehAksesModulSesi(sesi, id)
    );
    return {
      aksesPenuh: diizinkan.length === SEMUA_ID_MODUL.length,
      modulDiizinkan: diizinkan,
      sumber: 'role'
    };
  }, [sesi]);

  const [activeTab, setActiveTab] = useState<NavId>(() => {
    if (bolehAksesModulSesi(sesi, 'overview')) return 'overview';
    return aksesAktif.modulDiizinkan[0] || 'overview';
  });
  const [itSubTab, setItSubTab] = useState<ITSubTabId>('traceability');
  const [salesSubTab, setSalesSubTab] = useState<SalesTab>('order');
  const [isTraceabilityOpen, setIsTraceabilityOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [showComplianceBanner, setShowComplianceBanner] = useState(true);
  const [gudangTabAwal, setGudangTabAwal] = useState<GudangTabId | undefined>(undefined);

  const bolehBukaTabAktif = bolehAksesModul(activeTab, aksesAktif);
  const namaPelakuAktif = sesi.namaLengkap || sesi.namaPengguna;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-[#00AAFF] selection:text-white">
      
      {/* Top Banner (Diselaraskan dengan gaya banner notifikasi bejo-pos) */}
      {showComplianceBanner && (
        <div className="bg-slate-900 text-slate-200 px-3 sm:px-5 py-1.5 text-xs border-b border-slate-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-2 max-w-[1440px] mx-auto flex-1 justify-center text-center">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0 hidden sm:inline-block" />
            <span className="text-xs text-slate-300">
              <strong className="text-white">Standar Resmi Kementerian Kesehatan RI:</strong> Kepatuhan Izin Edar Alkes (NIE), Sertifikat Distribusi (SDAK), CDAKB Permenkes 4/2014 & ISO 13485:2016.
            </span>
          </div>
          <button 
            type="button"
            onClick={() => setShowComplianceBanner(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            title="Tutup pemberitahuan"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Navbar (2-Baris Desktop, Drawer & Bottom Bar Mobile sesuai bejo-pos) */}
      <Navbar
        currentTab={activeTab}
        setCurrentTab={setActiveTab}
        currentRole={currentRole}
        sesi={sesi}
        onOpenTraceability={() => setIsTraceabilityOpen(true)}
        onKeluar={onKeluar}
        aksesAktif={aksesAktif}
        itSubTab={itSubTab}
        onITNavigate={(sub) => {
          setItSubTab(sub);
          setActiveTab('it-traceability');
        }}
        salesSubTab={salesSubTab}
        onSalesNavigate={(sub) => {
          setSalesSubTab(sub);
          setActiveTab('sales-marketing');
        }}
      />

      {/* Main Application Content Container */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-3 sm:px-5 py-4 sm:py-6 pb-24 lg:pb-8">
        {!bolehBukaTabAktif ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-xl mx-auto shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Akses Modul Dibatasi</h2>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Akun <strong>{namaPelakuAktif}</strong> tidak memiliki izin untuk membuka modul ini sesuai konfigurasi User Account &amp; Roles. Hubungi user dengan Akses Penuh untuk memperbarui daftar modul yang dicentang.
            </p>
            {aksesAktif.modulDiizinkan.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab(aksesAktif.modulDiizinkan[0])}
                className="mt-5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Kembali ke Modul yang Diizinkan
              </button>
            )}
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <ExecutiveOverview
                onSelectModule={(mod) => setActiveTab(mod)}
                onOpenTraceability={() => setIsTraceabilityOpen(true)}
                onOpenPrintModal={() => setIsPrintModalOpen(true)}
                aksesAktif={aksesAktif}
              />
            )}

            {/* Website */}
            {activeTab === 'website' && <WebsiteModule currentRole={currentRole} sesi={sesi} />}

            {/* Regulatory Affairs */}
            {activeTab === 'ra-pjt' && <RegulatoryModule />}
            {activeTab === 'qa-mutu' && <QAModule />}
            {activeTab === 'qc-inspeksi' && <QCModule />}

            {/* Operations & Technical */}
            {activeTab === 'gudang-logistik' && (
              <WarehouseModule
                currentRole={currentRole}
                initialTab={gudangTabAwal}
                onOpenPrintModal={() => setIsPrintModalOpen(true)}
                onNavigateModule={(mod) => setActiveTab(mod)}
              />
            )}
            {activeTab === 'teknisi-service' && <ServiceModule />}
            {activeTab === 'produksi-cpakb' && <ProductionModule />}
            {activeTab === 'purchasing-procurement' && <ProcurementModule />}

            {/* Sales & Marketing */}
            {activeTab === 'sales-marketing' && (
              <SalesModule
                currentRole={currentRole}
                initialTab={salesSubTab}
                onTabChange={setSalesSubTab}
              />
            )}
            {activeTab === 'pms-vigilance' && (
              <PMSModule
                onBukaRecallGudang={() => {
                  setGudangTabAwal('recall');
                  setActiveTab('gudang-logistik');
                }}
              />
            )}

            {/* Supporting System */}
            {activeTab === 'hrd-pelatihan' && <HRDModule />}
            {activeTab === 'finance-akuntansi' && <FinanceModule currentRole={currentRole} />}
            {activeTab === 'it-traceability' && (
              <ITModule
                currentRole={currentRole}
                currentUserName={namaPelakuAktif}
                aksesAktif={aksesAktif}
                akunAktifId={sesi.userId}
                activeTab={itSubTab}
                onTabChange={setItSubTab}
                sesi={sesi}
                onPermissionsUpdated={onSegarkanSesi}
              />
            )}
          </>
        )}
      </main>

      {/* Elegant Footer Watermark */}
      <footer className="no-print mt-auto py-4 px-4 border-t border-slate-200 bg-white/80 backdrop-blur text-xs text-slate-500">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>© 2026 PT Anugrahmitra Selaras (AMS) • Sistem Terintegrasi CDAKB & ISO 13485</span>
          </div>
          <div className="font-semibold text-slate-600 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />
            coded by Langgo Bramandityo
          </div>
        </div>
      </footer>

      {/* Universal Batch / Lot Traceability Dialog Modal */}
      <TraceabilityModal
        isOpen={isTraceabilityOpen}
        onClose={() => setIsTraceabilityOpen(false)}
      />

      {/* Official Regulatory Printable Document Modal */}
      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
      />

    </div>
  );
}
