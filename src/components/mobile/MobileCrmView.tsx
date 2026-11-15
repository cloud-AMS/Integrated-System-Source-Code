import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Crosshair,
  LogOut,
  MapPin,
  Plus,
  Search,
  Sparkles,
  X
} from 'lucide-react';
import { db } from '../../services/pocketbase';
import type {
  KunjunganMedRep,
  PelangganB2B,
  ProspekAlkes,
  TahapProspek,
  TipeFasyankes
} from '../../types';
import {
  statusLimitKredit,
  validasiIzinOperasionalFasyankes,
  verifikasiCheckInKunjungan
} from '../../utils/sales';
import { formatRupiah, formatTanggal } from '../ui';
import { ambilLokasiGpsPerangkat, type HasilGpsPerangkat } from './mobileHelpers';

export type CrmSubTab = 'prospek' | 'pelanggan' | 'kunjungan';

interface MobileCrmViewProps {
  salesName: string;
  pelangganList: PelangganB2B[];
  prospekList: ProspekAlkes[];
  kunjunganList: KunjunganMedRep[];
  initialSubTab?: CrmSubTab;
  onRefresh: () => void;
}

const URUTAN_TAHAP: TahapProspek[] = [
  'Perkenalan Alat',
  'Demo Produk',
  'Negosiasi Harga',
  'Penawaran Resmi',
  'Pemenang',
  'Gagal'
];

const KOORDINAT_DEFAULT_FASYANKES: Record<string, { lat: number; lon: number }> = {
  'PLG-001': { lat: -6.2964, lon: 106.8164 },
  'PLG-002': { lat: -6.2936, lon: 106.7928 },
  'PLG-003': { lat: -6.9147, lon: 107.6098 },
  'PLG-004': { lat: -7.2624, lon: 112.7443 },
  'PLG-005': { lat: -6.5957, lon: 106.7832 },
  'PLG-006': { lat: -6.9905, lon: 110.4247 },
  'PLG-007': { lat: 3.5756, lon: 98.6762 }
};

function statusProspekStyle(tahap: TahapProspek): string {
  if (tahap === 'Pemenang') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (tahap === 'Gagal') return 'border-rose-200 bg-rose-50 text-rose-800';
  if (tahap === 'Penawaran Resmi' || tahap === 'Negosiasi Harga') {
    return 'border-amber-200 bg-amber-50 text-amber-800';
  }
  return 'border-sky-200 bg-sky-50 text-sky-800';
}

export const MobileCrmView: React.FC<MobileCrmViewProps> = ({
  salesName,
  pelangganList,
  prospekList,
  kunjunganList,
  initialSubTab = 'prospek',
  onRefresh
}) => {
  const [subTab, setSubTab] = useState<CrmSubTab>(initialSubTab);
  const [cari, setCari] = useState('');
  const [filterTahap, setFilterTahap] = useState<'Semua' | TahapProspek>('Semua');
  const [umpanBalik, setUmpanBalik] = useState<{ ok: boolean; teks: string } | null>(null);

  // Modal Tambah Prospek
  const [modalProspek, setModalProspek] = useState(false);
  const [namaProspek, setNamaProspek] = useState('');
  const [tipeFasyankes, setTipeFasyankes] = useState<TipeFasyankes>('RS Swasta');
  const [sumberLead, setSumberLead] = useState<ProspekAlkes['sumberLead']>('Cold Call');
  const [produkDiminati, setProdukDiminati] = useState('');
  const [nilaiEstimasi, setNilaiEstimasi] = useState('150000000');
  const [catatanProspek, setCatatanProspek] = useState('');

  // Modal Tambah Kunjungan & Check-out
  const [modalKunjungan, setModalKunjungan] = useState(false);
  const [kunjPelangganId, setKunjPelangganId] = useState(pelangganList[0]?.id || 'PLG-001');
  const [kunjTanggal, setKunjTanggal] = useState(() => new Date().toISOString().split('T')[0]);
  const [kunjTujuan, setKunjTujuan] =
    useState<KunjunganMedRep['tujuanKunjungan']>('Perkenalan Alat');
  const [kunjTindakLanjut, setKunjTindakLanjut] = useState('');
  const [checkOutTarget, setCheckOutTarget] = useState<KunjunganMedRep | null>(null);
  const [hasilCheckOut, setHasilCheckOut] = useState('');
  const [tindakLanjutCheckOut, setTindakLanjutCheckOut] = useState('');

  // GPS Check-in state
  const [sedangCheckInId, setSedangCheckInId] = useState<string | null>(null);
  const [gpsTerakhir, setGpsTerakhir] = useState<HasilGpsPerangkat | null>(null);

  const prospekTersaring = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return prospekList.filter((p) => {
      if (filterTahap !== 'Semua' && p.tahap !== filterTahap) return false;
      if (!q) return true;
      return (
        p.namaProspek.toLowerCase().includes(q) ||
        p.nomorProspek.toLowerCase().includes(q) ||
        p.produkDiminati.toLowerCase().includes(q) ||
        p.medRep.toLowerCase().includes(q)
      );
    });
  }, [prospekList, cari, filterTahap]);

  const pelangganTersaring = useMemo(() => {
    const q = cari.trim().toLowerCase();
    if (!q) return pelangganList;
    return pelangganList.filter(
      (c) =>
        c.namaInstalasi.toLowerCase().includes(q) ||
        c.kodePelanggan.toLowerCase().includes(q) ||
        c.provinsi.toLowerCase().includes(q) ||
        c.rayonDistribusi.toLowerCase().includes(q)
    );
  }, [pelangganList, cari]);

  const kunjunganTerurut = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return [...kunjunganList]
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
      .filter((k) => {
        if (!q) return true;
        const plg = pelangganList.find((c) => c.id === k.pelangganId);
        return (
          k.medRep.toLowerCase().includes(q) ||
          k.tujuanKunjungan.toLowerCase().includes(q) ||
          (plg?.namaInstalasi || '').toLowerCase().includes(q)
        );
      });
  }, [kunjunganList, pelangganList, cari]);

  const tahapBerikutnya = (tahap: TahapProspek): TahapProspek | null => {
    const idx = URUTAN_TAHAP.indexOf(tahap);
    if (idx < 0 || idx >= 4) return null;
    return URUTAN_TAHAP[idx + 1];
  };

  const majukanProspek = (p: ProspekAlkes) => {
    const next = tahapBerikutnya(p.tahap);
    if (!next) return;
    db.majukanTahapProspek(p.id, next);
    setUmpanBalik({
      ok: true,
      teks: `Prospek ${p.namaProspek} maju ke tahap "${next}".`
    });
    onRefresh();
  };

  const simpanProspekBaru = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaProspek.trim() || !produkDiminati.trim()) {
      setUmpanBalik({ ok: false, teks: 'Nama prospek/fasyankes dan produk diminati wajib diisi.' });
      return;
    }
    const hariIni = new Date().toISOString().split('T')[0];
    const baru: ProspekAlkes = {
      id: `PRS-${Date.now()}`,
      nomorProspek: `LDP-${new Date().getFullYear()}-${String(prospekList.length + 11).padStart(3, '0')}`,
      namaProspek: namaProspek.trim(),
      tipeFasyankes,
      sumberLead,
      tahap: 'Perkenalan Alat',
      produkDiminati: produkDiminati.trim(),
      nilaiEstimasi: Math.max(Number(nilaiEstimasi) || 0, 0),
      probabilitasPersen: 25,
      medRep: salesName,
      rayonDistribusi: 'Rayon Lapangan',
      tanggalDibuat: hariIni,
      tanggalTindakLanjut: hariIni,
      catatan: catatanProspek.trim() || 'Diinput dari aplikasi mobile CRM'
    };
    db.addProspek(baru);
    setModalProspek(false);
    setNamaProspek('');
    setProdukDiminati('');
    setCatatanProspek('');
    setUmpanBalik({ ok: true, teks: `Prospek baru ${baru.nomorProspek} berhasil ditambahkan.` });
    onRefresh();
  };

  const bukaJadwalkanDariPelanggan = (pelangganId: string) => {
    setKunjPelangganId(pelangganId);
    setSubTab('kunjungan');
    setModalKunjungan(true);
  };

  const simpanKunjunganBaru = (e: React.FormEvent) => {
    e.preventDefault();
    const pelanggan = pelangganList.find((c) => c.id === kunjPelangganId);
    const koor =
      KOORDINAT_DEFAULT_FASYANKES[kunjPelangganId] ||
      (gpsTerakhir ? { lat: gpsTerakhir.lat, lon: gpsTerakhir.lon } : { lat: -6.2297, lon: 106.8295 });

    const baru: KunjunganMedRep = {
      id: `VK-${Date.now()}`,
      tanggal: kunjTanggal,
      medRep: salesName,
      pelangganId: kunjPelangganId,
      tujuanKunjungan: kunjTujuan,
      koordinatFasyankes: koor,
      koordinatCheckIn: null,
      radiusGeofenceMeter: 200,
      jamCheckIn: '-',
      jamCheckOut: null,
      hasilKunjungan: pelanggan ? `Rencana kunjungan ke ${pelanggan.namaInstalasi}` : 'Rencana kunjungan',
      tindakLanjut: kunjTindakLanjut.trim() || 'Lakukan check-in GPS setibanya di fasyankes'
    };
    db.addKunjunganMedRep(baru);
    db.logAudit(
      'Sales & Marketing — SFA',
      `Penjadwalan kunjungan lapangan ke ${pelanggan?.namaInstalasi || kunjPelangganId}`,
      baru.id,
      salesName,
      'Sales / MedRep'
    );
    setModalKunjungan(false);
    setKunjTindakLanjut('');
    setUmpanBalik({ ok: true, teks: `Rencana kunjungan ke ${pelanggan?.namaInstalasi || kunjPelangganId} tersimpan.` });
    onRefresh();
  };

  const lakukanCheckInGps = async (k: KunjunganMedRep) => {
    setUmpanBalik(null);
    setSedangCheckInId(k.id);
    const posisi = await ambilLokasiGpsPerangkat();
    setSedangCheckInId(null);

    if (!posisi.ok) {
      setUmpanBalik({ ok: false, teks: posisi.pesan });
      return;
    }

    setGpsTerakhir(posisi);
    const jam = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    db.catatCheckInKunjungan(k.id, { lat: posisi.lat, lon: posisi.lon }, jam);
    const updated = { ...k, koordinatCheckIn: { lat: posisi.lat, lon: posisi.lon }, jamCheckIn: jam };
    const verif = verifikasiCheckInKunjungan(updated);
    setUmpanBalik({
      ok: verif.terverifikasi !== false,
      teks: `Check-in pukul ${jam} tercatat (${posisi.lat}, ${posisi.lon}, akurasi ±${posisi.accuracyMeter} m). ${verif.label}.`
    });
    onRefresh();
  };

  const simpanCheckOut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkOutTarget) return;
    const jamOut = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const list = db.getKunjunganMedRep().map((item) =>
      item.id === checkOutTarget.id
        ? {
            ...item,
            jamCheckOut: jamOut,
            hasilKunjungan: hasilCheckOut.trim() || item.hasilKunjungan,
            tindakLanjut: tindakLanjutCheckOut.trim() || item.tindakLanjut
          }
        : item
    );
    db.saveKunjunganMedRep(list);
    db.logAudit(
      'Sales & Marketing — SFA',
      `Check-out & laporan kunjungan lapangan`,
      checkOutTarget.id,
      salesName,
      'Sales / MedRep'
    );
    setCheckOutTarget(null);
    setHasilCheckOut('');
    setTindakLanjutCheckOut('');
    setUmpanBalik({ ok: true, teks: `Check-out pukul ${jamOut} & hasil kunjungan berhasil disimpan.` });
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Segmented Sub-tabs */}
      <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-200/70 p-1">
        {(
          [
            { id: 'prospek', label: `Prospek (${prospekList.length})` },
            { id: 'pelanggan', label: `Pelanggan (${pelangganList.length})` },
            { id: 'kunjungan', label: `Kunjungan (${kunjunganList.length})` }
          ] as { id: CrmSubTab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setSubTab(tab.id);
              setUmpanBalik(null);
            }}
            className={`min-h-[44px] rounded-lg px-2 text-xs font-bold transition cursor-pointer ${
              subTab === tab.id
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Primary Action */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder={
              subTab === 'prospek'
                ? 'Cari nama RS, produk, atau sales…'
                : subTab === 'pelanggan'
                  ? 'Cari fasyankes, provinsi, atau rayon…'
                  : 'Cari kunjungan atau nama medrep…'
            }
            className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-xs focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none"
          />
        </div>
        {subTab === 'prospek' && (
          <button
            type="button"
            onClick={() => setModalProspek(true)}
            className="min-h-[44px] rounded-xl bg-teal-600 px-4 text-xs font-bold text-white inline-flex items-center justify-center gap-1.5 hover:bg-teal-700 transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Prospek Baru
          </button>
        )}
        {subTab === 'kunjungan' && (
          <button
            type="button"
            onClick={() => setModalKunjungan(true)}
            className="min-h-[44px] rounded-xl bg-teal-600 px-4 text-xs font-bold text-white inline-flex items-center justify-center gap-1.5 hover:bg-teal-700 transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Jadwalkan Kunjungan
          </button>
        )}
      </div>

      {umpanBalik && (
        <div
          className={`rounded-xl border px-3.5 py-2.5 text-xs flex items-start gap-2 ${
            umpanBalik.ok
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-rose-200 bg-rose-50 text-rose-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{umpanBalik.teks}</span>
        </div>
      )}

      {/* TAB 1: PROSPEK */}
      {subTab === 'prospek' && (
        <div className="space-y-3">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {(['Semua', 'Perkenalan Alat', 'Demo Produk', 'Negosiasi Harga', 'Penawaran Resmi', 'Pemenang'] as const).map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterTahap(st)}
                  className={`min-h-[38px] shrink-0 rounded-full px-3 text-2xs font-bold border transition cursor-pointer ${
                    filterTahap === st
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {st}
                </button>
              )
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {prospekTersaring.map((p) => {
              const next = tahapBerikutnya(p.tahap);
              return (
                <article
                  key={p.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-2xs font-mono text-slate-500">
                          {p.nomorProspek} · {p.sumberLead}
                        </p>
                        <h3 className="text-sm font-bold text-slate-900 leading-snug mt-0.5">
                          {p.namaProspek}
                        </h3>
                      </div>
                      <span
                        className={`shrink-0 rounded-md border px-2 py-0.5 text-2xs font-bold ${statusProspekStyle(p.tahap)}`}
                      >
                        {p.tahap}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-teal-800">{p.produkDiminati}</p>
                    <p className="text-xs text-slate-600 line-clamp-2">{p.catatan}</p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900 tabular-nums">
                        {formatRupiah(p.nilaiEstimasi)}
                      </p>
                      <p className="text-2xs text-slate-500">
                        {p.medRep} · Peluang {p.probabilitasPersen}% · Follow-up {formatTanggal(p.tanggalTindakLanjut)}
                      </p>
                    </div>
                    {next && (
                      <button
                        type="button"
                        onClick={() => majukanProspek(p)}
                        className="min-h-[40px] shrink-0 rounded-xl border border-teal-200 bg-teal-50 px-3 text-2xs font-bold text-teal-800 inline-flex items-center gap-1 hover:bg-teal-100 transition cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Ke {next}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          {prospekTersaring.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
              Tidak ada prospek yang sesuai filter pencarian.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PELANGGAN B2B */}
      {subTab === 'pelanggan' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pelangganTersaring.map((c) => {
            const izin = validasiIzinOperasionalFasyankes(c);
            const kredit = statusLimitKredit(c, 0);
            const barPersen = Math.min(Math.round(kredit.rasioPersen), 100);
            return (
              <article
                key={c.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-2xs font-mono text-slate-500">
                      {c.kodePelanggan} · {c.tipeFasyankes}
                    </p>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug mt-0.5 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-teal-700 shrink-0" />
                      <span className="truncate">{c.namaInstalasi}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {c.provinsi} · {c.rayonDistribusi} · Akreditasi {c.akreditasi}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-md border px-2 py-0.5 text-2xs font-bold ${
                      izin.status === 'Lolos'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-rose-200 bg-rose-50 text-rose-800'
                    }`}
                  >
                    {c.statusPelanggan}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-600">Piutang / Plafon Kredit</span>
                    <span
                      className={`font-bold ${
                        kredit.status === 'Diblokir'
                          ? 'text-rose-700'
                          : kredit.status === 'Perlu Persetujuan Manajemen'
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                      }`}
                    >
                      {kredit.status}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full ${
                        kredit.status === 'Diblokir'
                          ? 'bg-rose-600'
                          : kredit.status === 'Perlu Persetujuan Manajemen'
                            ? 'bg-amber-500'
                            : 'bg-teal-600'
                      }`}
                      style={{ width: `${barPersen}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-2xs text-slate-600 tabular-nums">
                    <span>Terpakai: {formatRupiah(c.piutangBerjalan)}</span>
                    <span>Limit: {formatRupiah(c.batasKredit)} · TOP {c.termsOfPaymentHari} hr</span>
                  </div>
                </div>

                <div className="text-2xs text-slate-600 space-y-1">
                  <p>
                    PIC Pengadaan: <strong className="text-slate-800">{c.penanggungJawabPengadaan}</strong>
                  </p>
                  <p>
                    Izin Operasional: <span className="font-mono">{c.nomorIzinOperasional}</span> (s/d{' '}
                    {formatTanggal(c.tanggalBerlakuIzin)})
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => bukaJadwalkanDariPelanggan(c.id)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 inline-flex items-center justify-center gap-1.5 hover:bg-slate-50 transition cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-teal-700" />
                  Jadwalkan Kunjungan Sales
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </article>
            );
          })}
        </div>
      )}

      {/* TAB 3: KUNJUNGAN SALES (GPS CHECK-IN / CHECK-OUT) */}
      {subTab === 'kunjungan' && (
        <div className="space-y-3">
          {gpsTerakhir && (
            <div className="rounded-xl border border-teal-200 bg-teal-50 px-3.5 py-2 text-2xs text-teal-900 flex items-center justify-between gap-2">
              <span className="font-mono">
                GPS Terakhir: {gpsTerakhir.lat}, {gpsTerakhir.lon} (±{gpsTerakhir.accuracyMeter} m)
              </span>
              <span>{gpsTerakhir.diambilPada}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {kunjunganTerurut.map((k) => {
              const pelanggan = pelangganList.find((c) => c.id === k.pelangganId);
              const verif = verifikasiCheckInKunjungan(k);
              const sudahCheckIn = Boolean(k.koordinatCheckIn);
              const sudahCheckOut = Boolean(k.jamCheckOut);

              return (
                <article
                  key={k.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-2xs text-slate-500">
                        {formatTanggal(k.tanggal)} · {k.medRep}
                      </p>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug mt-0.5">
                        {pelanggan?.namaInstalasi || k.pelangganId}
                      </h3>
                      <p className="text-xs font-semibold text-teal-800 mt-0.5">
                        {k.tujuanKunjungan}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-md border px-2 py-0.5 text-2xs font-bold ${
                        verif.terverifikasi === true
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : verif.terverifikasi === false
                            ? 'border-rose-200 bg-rose-50 text-rose-800'
                            : 'border-amber-200 bg-amber-50 text-amber-800'
                      }`}
                    >
                      {verif.terverifikasi === true
                        ? 'Geofence Valid'
                        : verif.terverifikasi === false
                          ? 'Luar Radius'
                          : 'Belum Check-In'}
                    </span>
                  </div>

                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-2xs text-slate-700 space-y-1">
                    <p className="font-mono">
                      Target: {k.koordinatFasyankes.lat}, {k.koordinatFasyankes.lon} (radius {k.radiusGeofenceMeter} m)
                    </p>
                    <p>
                      Masuk: <strong>{k.jamCheckIn || '-'}</strong> · Keluar:{' '}
                      <strong>{k.jamCheckOut || '-'}</strong>
                      {verif.jarakKm !== null && ` · Jarak ${(verif.jarakKm * 1000).toFixed(0)} m`}
                    </p>
                    {k.hasilKunjungan && <p className="text-slate-600 pt-1">{k.hasilKunjungan}</p>}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={sedangCheckInId === k.id}
                      onClick={() => void lakukanCheckInGps(k)}
                      className="flex-1 min-h-[44px] rounded-xl bg-teal-600 px-3 text-xs font-bold text-white inline-flex items-center justify-center gap-1.5 hover:bg-teal-700 disabled:opacity-60 transition cursor-pointer"
                    >
                      <Crosshair className="w-4 h-4" />
                      {sedangCheckInId === k.id
                        ? 'Mengambil GPS…'
                        : sudahCheckIn
                          ? 'Perbarui Check-In GPS'
                          : 'Check-In GPS'}
                    </button>
                    {sudahCheckIn && !sudahCheckOut && (
                      <button
                        type="button"
                        onClick={() => {
                          setCheckOutTarget(k);
                          setHasilCheckOut(k.hasilKunjungan || '');
                          setTindakLanjutCheckOut(k.tindakLanjut || '');
                        }}
                        className="flex-1 min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 inline-flex items-center justify-center gap-1.5 hover:bg-slate-50 transition cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-slate-600" />
                        Check-Out &amp; Catatan
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL TAMBAH PROSPEK */}
      {modalProspek && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-5 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Input Prospek CRM Baru</h3>
              <button
                type="button"
                onClick={() => setModalProspek(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={simpanProspekBaru} className="space-y-3">
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Nama Fasyankes / Prospek
                </label>
                <input
                  type="text"
                  required
                  value={namaProspek}
                  onChange={(e) => setNamaProspek(e.target.value)}
                  placeholder="Contoh: RSUD Dr. Soetomo Surabaya"
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Tipe Fasyankes
                  </label>
                  <select
                    value={tipeFasyankes}
                    onChange={(e) => setTipeFasyankes(e.target.value as TipeFasyankes)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-xs bg-white"
                  >
                    <option value="RS Pemerintah">RS Pemerintah</option>
                    <option value="RS Swasta">RS Swasta</option>
                    <option value="Klinik">Klinik</option>
                    <option value="Laboratorium">Laboratorium</option>
                    <option value="Apotek">Apotek</option>
                    <option value="Dinas Kesehatan">Dinas Kesehatan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Sumber Lead
                  </label>
                  <select
                    value={sumberLead}
                    onChange={(e) => setSumberLead(e.target.value as ProspekAlkes['sumberLead'])}
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-xs bg-white"
                  >
                    <option value="Cold Call">Cold Call</option>
                    <option value="e-Katalog LKPP">e-Katalog LKPP</option>
                    <option value="LPSE">LPSE</option>
                    <option value="E-Purchasing">E-Purchasing</option>
                    <option value="Rujukan">Rujukan</option>
                    <option value="Simposium">Simposium</option>
                    <option value="Pameran">Pameran</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Produk Alkes Diminati
                </label>
                <input
                  type="text"
                  required
                  value={produkDiminati}
                  onChange={(e) => setProdukDiminati(e.target.value)}
                  placeholder="Contoh: Patient Monitor 12 Parameter (3 Unit)"
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-xs"
                />
              </div>
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Nilai Estimasi (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={nilaiEstimasi}
                  onChange={(e) => setNilaiEstimasi(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-xs"
                />
              </div>
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Catatan Kualifikasi
                </label>
                <textarea
                  rows={2}
                  value={catatanProspek}
                  onChange={(e) => setCatatanProspek(e.target.value)}
                  placeholder="Kebutuhan spesifikasi, jadwal anggaran RS, atau kontak dokter user..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full min-h-[48px] rounded-xl bg-teal-600 text-sm font-bold text-white hover:bg-teal-700 transition cursor-pointer"
              >
                Simpan Prospek ke Server AMS
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH KUNJUNGAN */}
      {modalKunjungan && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Jadwalkan Kunjungan Sales</h3>
              <button
                type="button"
                onClick={() => setModalKunjungan(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={simpanKunjunganBaru} className="space-y-3">
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Fasyankes Tujuan
                </label>
                <select
                  value={kunjPelangganId}
                  onChange={(e) => setKunjPelangganId(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-xs bg-white"
                >
                  {pelangganList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.namaInstalasi} ({c.provinsi})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Tanggal Kunjungan
                  </label>
                  <input
                    type="date"
                    required
                    value={kunjTanggal}
                    onChange={(e) => setKunjTanggal(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Tujuan
                  </label>
                  <select
                    value={kunjTujuan}
                    onChange={(e) =>
                      setKunjTujuan(e.target.value as KunjunganMedRep['tujuanKunjungan'])
                    }
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-xs bg-white"
                  >
                    <option value="Perkenalan Alat">Perkenalan Alat</option>
                    <option value="Demo Produk">Demo Produk</option>
                    <option value="Negosiasi">Negosiasi</option>
                    <option value="Pengumpulan Dokumen Tender">Dokumen Tender</option>
                    <option value="Pascapenjualan">Pascapenjualan</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Agenda / Tindak Lanjut
                </label>
                <textarea
                  rows={2}
                  value={kunjTindakLanjut}
                  onChange={(e) => setKunjTindakLanjut(e.target.value)}
                  placeholder="Contoh: Presentasi brosur Patient Monitor + verifikasi penawaran LKPP"
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full min-h-[48px] rounded-xl bg-teal-600 text-sm font-bold text-white hover:bg-teal-700 transition cursor-pointer"
              >
                Simpan Rencana Kunjungan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHECK-OUT KUNJUNGAN */}
      {checkOutTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Check-Out Kunjungan Sales</h3>
              <button
                type="button"
                onClick={() => setCheckOutTarget(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={simpanCheckOut} className="space-y-3">
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Ringkasan Hasil Pertemuan
                </label>
                <textarea
                  rows={3}
                  required
                  value={hasilCheckOut}
                  onChange={(e) => setHasilCheckOut(e.target.value)}
                  placeholder="Catat hasil diskusi dengan PPK / Dokter User / Kabag Pengadaan..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs"
                />
              </div>
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Rencana Tindak Lanjut
                </label>
                <input
                  type="text"
                  value={tindakLanjutCheckOut}
                  onChange={(e) => setTindakLanjutCheckOut(e.target.value)}
                  placeholder="Contoh: Kirim quotation resmi + berkas NIE sebelum Jumat"
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full min-h-[48px] rounded-xl bg-slate-900 text-sm font-bold text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Simpan Check-Out Kunjungan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
