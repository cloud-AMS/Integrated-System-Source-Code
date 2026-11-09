import { useMemo, useState } from 'react';
import DeveloperNotes from '../../common/DeveloperNotes';
import type { UserRole } from '../../../types';
import { TANGGAL_ACUAN_BENIH, buatTanggalAcuan } from '../operations/gudang/ui';
import DasborTab from './finance/DasborTab';
import FakturTab from './finance/FakturTab';
import JurnalTab from './finance/JurnalTab';
import LaporanTab from './finance/LaporanTab';
import PajakTab from './finance/PajakTab';
import PeriodeTab from './finance/PeriodeTab';
import PersediaanTab from './finance/PersediaanTab';
import { type FinanceTabId, identitasPeranFinance } from './finance/ui';
import { BarChart3, CalendarClock, type Coins, LayoutDashboard, PackageSearch, Plus, Receipt, ScrollText, Wallet } from 'lucide-react';

const DAFTAR_TAB: { id: FinanceTabId; nomor: number; label: string; ikon: typeof Coins }[] = [
  { id: 'faktur', nomor: 1, label: 'Faktur & Piutang', ikon: Wallet },
  { id: 'dasbor', nomor: 2, label: 'Dasbor Kendali', ikon: LayoutDashboard },
  { id: 'jurnal', nomor: 3, label: 'Jurnal & Buku Besar', ikon: ScrollText },
  { id: 'laporan', nomor: 4, label: 'Neraca & Laba Rugi', ikon: BarChart3 },
  { id: 'persediaan', nomor: 5, label: 'Valuasi & Write-Off', ikon: PackageSearch },
  { id: 'pajak', nomor: 6, label: 'PPN, e-Faktur & Landed Cost', ikon: Receipt },
  { id: 'periode', nomor: 7, label: 'Periode & Biaya Mutu', ikon: CalendarClock }
];

export default function FinanceModule({ currentRole }: { currentRole?: UserRole }) {
  const [activeTab, setActiveTab] = useState<FinanceTabId>('faktur');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [bukaFormFaktur, setBukaFormFaktur] = useState(0);

  const identitas = useMemo(() => identitasPeranFinance(currentRole ?? 'pjt'), [currentRole]);
  const dariAcuan = useMemo(() => buatTanggalAcuan(TANGGAL_ACUAN_BENIH), []);

  const catatFakturBaru = () => {
    setActiveTab('faktur');
    setBukaFormFaktur((n) => n + 1);
  };

  return (
    <div className="space-y-6">

      <DeveloperNotes
        items={[
          'Buku besar ganda & jurnal berantai dihitung dan disimpan di perangkat (localStorage) — ini bukan database server multi-pengguna.',
          'Nilai PPN/PPh dan jurnal contoh memakai benih; modul ini BELUM tersambung ke Coretax DJP / e-Faktur produksi.',
          '"Mata Rantai terhubung" berarti rantai hash jurnal dihitung benar secara lokal, bukan bukti audit pihak ketiga atau immutable storage server.'
        ]}
      />
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800">
              Keuangan & Anggaran Mutu
            </span>
            <span className="text-xs text-slate-500">Perpajakan PPN Alkes & Biaya Audit Kepatuhan</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Finance & Accounting Perusahaan Alkes
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Pencatatan faktur komersial fasyankes, kepatuhan pajak PPN 11% alkes, serta pemantauan anggaran jaminan mutu (biaya kalibrasi BPFK, audit ISO 13485, dan retur).
          </p>
          <p className="text-2xs text-slate-500 mt-2">
            Aktif sebagai <strong className="text-slate-700">{identitas.pengguna}</strong> ({identitas.peran}) — {identitas.bolehPosting ? 'berhak mem-posting jurnal dan tutup buku' : 'berhak mengajukan draf; posting dilakukan PJT / QA Manager'} · tanggal acuan pembukuan {TANGGAL_ACUAN_BENIH}
          </p>
        </div>

        <button
          type="button"
          onClick={catatFakturBaru}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Catat Faktur Transaksi Baru
        </button>
      </div>

      {/* Strip 7 Tab (Pola WarehouseModule, aksen Blue khas Supporting) */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 text-xs overflow-x-auto">
        {DAFTAR_TAB.map((tab) => {
          const Ikon = tab.ikon;
          const aktif = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-3 font-semibold transition-colors border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                aktif
                  ? 'border-blue-600 text-blue-800 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Ikon className="w-4 h-4 shrink-0" />
              <span>
                <span className="font-mono text-2xs mr-1 opacity-75">{tab.nomor}.</span>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {activeTab === 'faktur' && (
        <FakturTab
          key={refreshTrigger}
          identitas={identitas}
          dariAcuan={dariAcuan}
          bukaForm={bukaFormFaktur}
          onPerubahanData={() => setRefreshTrigger((n) => n + 1)}
        />
      )}
      {activeTab === 'dasbor' && (
        <DasborTab key={refreshTrigger} dariAcuan={dariAcuan} identitas={identitas} onPilihTab={setActiveTab} />
      )}
      {activeTab === 'jurnal' && (
        <JurnalTab
          key={refreshTrigger}
          identitas={identitas}
          dariAcuan={dariAcuan}
          onPerubahanData={() => setRefreshTrigger((n) => n + 1)}
        />
      )}
      {activeTab === 'laporan' && <LaporanTab key={refreshTrigger} dariAcuan={dariAcuan} />}
      {activeTab === 'persediaan' && (
        <PersediaanTab
          key={refreshTrigger}
          identitas={identitas}
          dariAcuan={dariAcuan}
          onPerubahanData={() => setRefreshTrigger((n) => n + 1)}
        />
      )}
      {activeTab === 'pajak' && <PajakTab key={refreshTrigger} identitas={identitas} dariAcuan={dariAcuan} />}
      {activeTab === 'periode' && (
        <PeriodeTab
          key={refreshTrigger}
          identitas={identitas}
          dariAcuan={dariAcuan}
          onPerubahanData={() => setRefreshTrigger((n) => n + 1)}
        />
      )}
    </div>
  );
}
