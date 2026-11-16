import { useMemo, useState } from 'react';
import { useDbTick } from '../../../../hooks/useDbSync';
import DeveloperNotes from '../../../common/DeveloperNotes';
import { db } from '../../../../services/pocketbase';
import { KirimanSatuSehat, SinkronisasiLkpp, UserRole } from '../../../../types';
import {
  KOLOM_EREPOR,
  bangunBarisEReport,
  bangunBundleFhir,
  bangunPayloadLkpp,
  eksporCsvEReport,
  eksporXlsEReport,
  gerbangKonfirmasiStokSales,
  namaBerkasEReport,
  periodeEReport,
  stokBebas,
  validasiKirimanSatuSehat,
  type MitraEReport
} from '../../../../utils/gudang';
import {
  CheckCircle2,
  Code2,
  Copy,
  Download,
  FileJson,
  FileSpreadsheet,
  Globe,
  History,
  Plus,
  RefreshCw,
  Send,
  ShieldAlert,
  Wrench
} from 'lucide-react';
import { Badge, Modal, Panel, Stat, chipFilter, inputClass, labelClass, tombolPrimerGudang, tombolSekunder, type Tone } from '../../../ui';
import { identitasPeranGudang } from './ui';

interface Props {
  currentRole?: UserRole;
  dariAcuan: Date;
  onPerubahanData: () => void;
}

const toneLkpp = (st: SinkronisasiLkpp['status']): Tone => {
  if (st === 'Terkirim') return 'emerald';
  if (st === 'Antre') return 'amber';
  return 'rose';
};

const toneFhir = (st: KirimanSatuSehat['status']): Tone => {
  if (st === 'Diterima (201)') return 'emerald';
  if (st === 'Antre') return 'blue';
  if (st === 'Belum Terkirim') return 'amber';
  return 'rose';
};

export default function GerbangPemerintahTab({ currentRole = 'kepala_gudang', dariAcuan, onPerubahanData }: Props) {
  const dbTick = useDbTick([
    'gudang_lkpp_sync',
    'gudang_satusehat',
    'gudang_ereport',
    'gudang_pergerakan',
    'gudang_surat_jalan',
    'stok_gudang',
    'izin_edar',
    'sales_pelanggan',
    'pemasok',
    'gudang_pengaturan'
  ]);
  const lkppList = useMemo<SinkronisasiLkpp[]>(() => {
    void dbTick;
    return db.getSinkronisasiLkpp();
  }, [dbTick]);
  const fhirList = useMemo<KirimanSatuSehat[]>(() => {
    void dbTick;
    return db.getKirimanSatuSehat();
  }, [dbTick]);
  const stokList = useMemo(() => {
    void dbTick;
    return db.getStokGudang();
  }, [dbTick]);
  const konfigurasi = useMemo(() => {
    void dbTick;
    return db.getKonfigurasiGudang();
  }, [dbTick]);
  const pergerakanList = useMemo(() => {
    void dbTick;
    return db.getJejakPergerakan();
  }, [dbTick]);
  const sjList = useMemo(() => {
    void dbTick;
    return db.getSuratJalan();
  }, [dbTick]);
  const izinList = useMemo(() => {
    void dbTick;
    return db.getIzinEdar();
  }, [dbTick]);
  const riwayatEkspor = useMemo(() => {
    void dbTick;
    return db.getRiwayatEksporEReport();
  }, [dbTick]);
  const mitraEReport = useMemo<MitraEReport[]>(() => {
    void dbTick;
    return [
      ...db.getPelangganB2B().map((p) => ({
        nama: p.namaInstalasi,
        kodeSaranaKemenkes: p.kodeSaranaKemenkes,
        kodeProvinsi: p.kodeProvinsi,
        kodeKota: p.kodeKota
      })),
      ...db.getPemasok().map((p) => ({
        nama: p.namaPemasok,
        kodeSaranaKemenkes: p.kodeSaranaKemenkes,
        kodeProvinsi: p.kodeProvinsi,
        kodeKota: p.kodeKota
      }))
    ];
  }, [dbTick]);

  const [tahunEReport, setTahunEReport] = useState(() => dariAcuan.getFullYear());
  const [semesterEReport, setSemesterEReport] = useState<1 | 2>(() => (dariAcuan.getMonth() < 6 ? 1 : 2));

  const [skuCekGerbang, setSkuCekGerbang] = useState('IVD-STD-06');
  const [filterLkpp, setFilterLkpp] = useState<'Semua' | SinkronisasiLkpp['status']>('Semua');
  const [filterFhir, setFilterFhir] = useState<'Semua' | KirimanSatuSehat['status']>('Semua');

  const [pesan, setPesan] = useState<{ tipe: 'sukses' | 'tolak'; teks: string } | null>(null);
  const [pratinjauJson, setPratinjauJson] = useState<{ judul: string; endpoint: string; isi: string } | null>(null);

  const [modalLkppBaru, setModalLkppBaru] = useState(false);
  const [formLkpp, setFormLkpp] = useState({
    kodeSKU: 'ALKES-PM-01',
    nomorPaketLkpp: 'Paket LKPP/2024/0091873',
    pemicu: 'Perubahan Stok' as SinkronisasiLkpp['pemicu'],
    nomorBatch: 'LOT-2024-PM44'
  });

  const [modalFhirBaru, setModalFhirBaru] = useState(false);
  const [formFhir, setFormFhir] = useState({
    tipeSumberDaya: 'SupplyDelivery' as KirimanSatuSehat['tipeSumberDaya'],
    nomorRujukan: 'SJ/CDAKB/2024/SP-EKAT-2024-118',
    kodeFasyankes: 'FKN-RS-0041',
    namaFasyankes: 'RSUD Pasar Minggu Jakarta Selatan',
    nomorBatch: 'LOT-2024-PM44',
    nomorSerial: 'AMS-V12P-2406-0031',
    suhuRantaiDingin: '-'
  });

  const [perbaikanFhir, setPerbaikanFhir] = useState<KirimanSatuSehat | null>(null);
  const [formPerbaikan, setFormPerbaikan] = useState({
    kodeFasyankes: '',
    suhuRantaiDingin: '-',
    catatan: ''
  });

  const segarkan = () => {
    onPerubahanData();
  };

  const skuUnik = useMemo(() => {
    const peta = new Map<string, { kodeSKU: string; namaAlkes: string; satuan: string; bebas: number }>();
    stokList.forEach((s) => {
      const ada = peta.get(s.kodeSKU);
      peta.set(s.kodeSKU, {
        kodeSKU: s.kodeSKU,
        namaAlkes: s.namaAlkes,
        satuan: s.satuan,
        bebas: (ada?.bebas ?? 0) + stokBebas(s)
      });
    });
    return Array.from(peta.values());
  }, [stokList]);

  const hasilGerbangSales = useMemo(
    () => gerbangKonfirmasiStokSales({ daftarLkpp: lkppList, kodeSKU: skuCekGerbang }),
    [lkppList, skuCekGerbang]
  );

  const identitas = identitasPeranGudang(currentRole);
  const periode = useMemo(() => periodeEReport(tahunEReport, semesterEReport), [tahunEReport, semesterEReport]);
  const barisEReport = useMemo(
    () =>
      bangunBarisEReport({
        periode,
        daftarStok: stokList,
        daftarPergerakan: pergerakanList,
        daftarSuratJalan: sjList,
        daftarIzinEdar: izinList,
        daftarMitra: mitraEReport
      }),
    [periode, stokList, pergerakanList, sjList, izinList, mitraEReport]
  );
  const barisBermasalah = useMemo(() => barisEReport.filter((b) => b.catatanValidasi.length > 0), [barisEReport]);

  const unduhEReport = (format: 'CSV' | 'XLS') => {
    if (barisEReport.length === 0) {
      setPesan({
        tipe: 'tolak',
        teks: `Tidak ada mutasi penyaluran (OUTBOUND_SALES) pada periode ${periode.kode} — tidak ada baris yang dapat diekspor.`
      });
      return;
    }
    const isi = format === 'CSV' ? eksporCsvEReport(barisEReport) : eksporXlsEReport(barisEReport);
    const blob = new Blob([isi], {
      type: format === 'CSV' ? 'text/csv;charset=utf-8' : 'application/vnd.ms-excel;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const tautan = document.createElement('a');
    tautan.href = url;
    tautan.download = namaBerkasEReport(periode.kode, format);
    document.body.appendChild(tautan);
    tautan.click();
    tautan.remove();
    URL.revokeObjectURL(url);
    const entri = db.catatEksporEReport(
      { periode, jumlahBaris: barisEReport.length, format, pengguna: identitas.pengguna },
      dariAcuan
    );
    setPesan({
      tipe: 'sukses',
      teks: `${entri.namaBerkas} diunduh (${barisEReport.length} baris). Surat jalan DELIVERED periode ini ditandai terekspor; riwayat tercatat atas nama ${entri.pengguna}.`
    });
    segarkan();
  };

  const antrekanLkpp = (e: React.FormEvent) => {
    e.preventDefault();
    const infoSku = skuUnik.find((s) => s.kodeSKU === formLkpp.kodeSKU);
    const { antrean } = db.antrekanSinkronisasiLkpp({
      kodeSKU: formLkpp.kodeSKU,
      namaProduk: infoSku?.namaAlkes ?? formLkpp.kodeSKU,
      nomorPaketLkpp: formLkpp.nomorPaketLkpp.trim(),
      qtyDilaporkan: formLkpp.pemicu === 'Recall' || formLkpp.pemicu === 'Karantina' ? 0 : infoSku?.bebas ?? 0,
      satuan: infoSku?.satuan ?? 'Unit',
      pemicu: formLkpp.pemicu,
      nomorBatch: formLkpp.nomorBatch.trim()
    });
    setModalLkppBaru(false);
    setPesan({
      tipe: 'sukses',
      teks: `Webhook e-Katalog LKPP ${antrean.id} (${antrean.kodeSKU}, qty ${antrean.qtyDilaporkan}) masuk antrean.`
    });
    segarkan();
  };

  const bukaPayloadLkpp = (item: SinkronisasiLkpp) => {
    const infoSku = skuUnik.find((s) => s.kodeSKU === item.kodeSKU);
    const payload = bangunPayloadLkpp({
      konfigurasi,
      kodeSKU: item.kodeSKU,
      namaProduk: item.namaProduk,
      nomorPaketLkpp: item.nomorPaketLkpp,
      qtyDilaporkan: item.qtyDilaporkan,
      satuan: infoSku?.satuan ?? 'Unit',
      pemicu: item.pemicu,
      waktu: dariAcuan
    });
    setPratinjauJson({
      judul: `Pratinjau Webhook e-Katalog LKPP — ${item.id}`,
      endpoint: `${payload.method} ${payload.endpoint}`,
      isi: JSON.stringify({ headers: payload.headers, body: payload.body }, null, 2)
    });
  };

  const kirimUlangLkpp = (item: SinkronisasiLkpp) => {
    db.ubahStatusSinkronisasiLkpp(
      item.id,
      'Terkirim',
      'HTTP 200 - sinkronisasi ulang berhasil; stok etalase e-Katalog sudah mutakhir.'
    );
    setPesan({
      tipe: 'sukses',
      teks: `Sinkronisasi ${item.id} (${item.kodeSKU}) berhasil dikirim ulang (HTTP 200) — gerbang konfirmasi pesanan dibuka kembali.`
    });
    segarkan();
  };

  const simulasiGagalLkpp = (item: SinkronisasiLkpp) => {
    db.ubahStatusSinkronisasiLkpp(
      item.id,
      'Gagal',
      'HTTP 503 - gateway LKPP timeout; konfirmasi pesanan e-Katalog untuk SKU ini ditahan otomatis.'
    );
    setSkuCekGerbang(item.kodeSKU);
    setPesan({
      tipe: 'tolak',
      teks: `Kegagalan HTTP 503 tercatat pada ${item.id}; konfirmasi pesanan e-Katalog untuk ${item.kodeSKU} kini diblokir otomatis.`
    });
    segarkan();
  };

  const tambahBundleFhir = (e: React.FormEvent) => {
    e.preventDefault();
    const { kiriman, validasi } = db.catatKirimanSatuSehat({
      tipeSumberDaya: formFhir.tipeSumberDaya,
      nomorRujukan: formFhir.nomorRujukan.trim(),
      kodeFasyankes: formFhir.kodeFasyankes.trim(),
      namaFasyankes: formFhir.namaFasyankes.trim(),
      nomorBatch: formFhir.nomorBatch.trim(),
      nomorSerial: formFhir.nomorSerial.trim(),
      suhuRantaiDingin: formFhir.suhuRantaiDingin.trim() || '-',
      waktu: dariAcuan
    });
    setModalFhirBaru(false);
    setPesan({
      tipe: validasi.layakKirim ? 'sukses' : 'tolak',
      teks: validasi.layakKirim
        ? `Bundle FHIR ${kiriman.id} (${kiriman.tipeSumberDaya}) lolos validasi struktur dan masuk status Antre.`
        : `Bundle FHIR ${kiriman.id} ditahan (${kiriman.status}): ${validasi.sebab.join('; ')}`
    });
    segarkan();
  };

  const simpanPerbaikanDanKirimUlangFhir = (e: React.FormEvent) => {
    e.preventDefault();
    if (!perbaikanFhir) return;
    const bangunBaru = bangunBundleFhir({
      konfigurasi,
      tipeSumberDaya: perbaikanFhir.tipeSumberDaya,
      nomorRujukan: perbaikanFhir.nomorRujukan,
      kodeFasyankes: formPerbaikan.kodeFasyankes.trim(),
      namaFasyankes: perbaikanFhir.namaFasyankes,
      nomorBatch: perbaikanFhir.nomorBatch !== '-' ? perbaikanFhir.nomorBatch : undefined,
      nomorSerial: perbaikanFhir.nomorSerial !== '-' ? perbaikanFhir.nomorSerial : undefined,
      suhuRantaiDingin: formPerbaikan.suhuRantaiDingin.trim() || '-',
      waktu: dariAcuan
    });

    const draf: KirimanSatuSehat = {
      ...perbaikanFhir,
      kodeFasyankes: formPerbaikan.kodeFasyankes.trim(),
      suhuRantaiDingin: formPerbaikan.suhuRantaiDingin.trim() || '-',
      payloadJson: bangunBaru.payloadJson,
      status: 'Antre'
    };

    const cek = validasiKirimanSatuSehat({
      kiriman: draf,
      daftarKiriman: fhirList,
      konfigurasi
    });

    if (!cek.layakKirim) {
      setPesan({
        tipe: 'tolak',
        teks: `Masih ditolak validator FHIR: ${cek.sebab.join('; ')}`
      });
      return;
    }

    const daftarBaru = fhirList.map((k) => (k.id === perbaikanFhir.id ? draf : k));
    db.saveKirimanSatuSehat(daftarBaru);
    db.ubahStatusKirimanSatuSehat(
      perbaikanFhir.id,
      'Diterima (201)',
      formPerbaikan.catatan.trim() ||
        `Master data kode fasyankes ${draf.kodeFasyankes} telah dipetakan dan diterima SATUSEHAT (HTTP 201 Created).`
    );

    setPerbaikanFhir(null);
    setPesan({
      tipe: 'sukses',
      teks: `Kiriman FHIR ${draf.id} berhasil diperbaiki dan diterima Kemenkes SATUSEHAT (201).`
    });
    segarkan();
  };

  const salinTeks = async (isi: string) => {
    try {
      await navigator.clipboard.writeText(isi);
      setPesan({ tipe: 'sukses', teks: 'Payload JSON berhasil disalin ke papan klip untuk tim integrasi IT.' });
    } catch {
      setPesan({ tipe: 'tolak', teks: 'Gagal menyalin otomatis; silakan pilih teks JSON dari jendela pratinjau.' });
    }
  };

  const lkppTampil = lkppList.filter((l) => (filterLkpp === 'Semua' ? true : l.status === filterLkpp));
  const fhirTampil = fhirList.filter((f) => (filterFhir === 'Semua' ? true : f.status === filterFhir));

  const lkppBermasalah = lkppList.filter((l) => l.status === 'Gagal' || l.status === 'Ditolak').length;
  const fhirBermasalah = fhirList.filter((f) => f.status === 'Ditolak (OperationOutcome)').length;

  return (
    <div className="space-y-5">
      <DeveloperNotes
        items={[
          'Tab Kemenkes RI adalah antrean & pratinjau payload — belum terhubung ke e-Katalog LKPP maupun SATUSEHAT (tidak ada kredensial, endpoint produksi, atau pengiriman nyata).',
          'Antrean LKPP dan kiriman FHIR hanya tersimpan di perangkat (localStorage); tidak ada yang otomatis terkirim ke mana pun.',
          'Status "Gagal/Ditolak" adalah penolakan validasi lokal (payload/akun kosong), bukan respons server pemerintah.',
          'Ekspor e-Report semesteran menghasilkan berkas CSV/XLS lokal dari buku besar mutasi; tidak ada pengiriman otomatis ke portal e-Report Kemenkes.'
        ]}
      />
      {pesan && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            pesan.tipe === 'sukses'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {pesan.tipe === 'sukses' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
            )}
            <span>{pesan.teks}</span>
          </div>
          <button
            type="button"
            onClick={() => setPesan(null)}
            className="text-2xs font-semibold underline cursor-pointer shrink-0"
          >
            Tutup
          </button>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Stat
          label="Antrean & Log e-Katalog LKPP"
          value={lkppList.length}
          hint={`${lkppList.filter((l) => l.status === 'Terkirim').length} terkirim HTTP 200`}
        />
        <Stat
          label="Webhook LKPP Gagal / Ditolak"
          value={lkppBermasalah}
          hint="Memblokir konfirmasi pesanan e-Katalog SKU terkait"
          tone={lkppBermasalah > 0 ? 'rose' : 'emerald'}
        />
        <Stat
          label="Bundle HL7 FHIR SATUSEHAT"
          value={fhirList.length}
          hint={`${fhirList.filter((f) => f.status === 'Diterima (201)').length} diterima HTTP 201`}
          tone="blue"
        />
        <Stat
          label="Tolakan OperationOutcome"
          value={fhirBermasalah}
          hint="Wajib perbaikan kode fasyankes / suhu rantai dingin"
          tone={fhirBermasalah > 0 ? 'amber' : 'emerald'}
        />
        <Stat
          label="Ekspor e-Report Semesteran"
          value={riwayatEkspor.length}
          hint={`${sjList.filter((s) => s.status === 'Diterima Penerima' && !s.sudahEksporEReport).length} surat jalan DELIVERED masih antre`}
          tone="blue"
        />
      </div>

      {/* Panel 1: Gerbang Konfirmasi Stok Sales & Antrean LKPP */}
      <Panel
        judul="Gerbang Sinkronisasi Stok e-Katalog LKPP (Aturan §3.12)"
        keterangan={`Endpoint terdaftar: ${konfigurasi.endpointLkpp} (kredensial dikelola server proxy terpisah). Kegagalan sinkronisasi otomatis menahan konfirmasi pesanan Sales agar perusahaan terhindar dari penalti pembatalan paket LKPP.`}
        aksi={
          <button
            type="button"
            onClick={() => setModalLkppBaru(true)}
            className={tombolPrimerGudang}
          >
            <Plus className="w-4 h-4" />
            Antrekan Sinkronisasi Stok LKPP
          </button>
        }
      >
        {/* Pemeriksa Gerbang SKU */}
        <div className="mb-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-slate-700">Cek Gerbang Konfirmasi Sales per SKU:</span>
            <select
              value={skuCekGerbang}
              onChange={(e) => setSkuCekGerbang(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-mono text-xs"
            >
              {Array.from(new Set([...skuUnik.map((s) => s.kodeSKU), ...lkppList.map((l) => l.kodeSKU)])).map(
                (sku) => (
                  <option key={sku} value={sku}>
                    {sku}
                  </option>
                )
              )}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={hasilGerbangSales.bolehKonfirmasi ? 'emerald' : 'rose'}>
              {hasilGerbangSales.bolehKonfirmasi ? 'BOLEH KONFIRMASI PESANAN' : 'KONFIRMASI SALES DIBLOKIR'}
            </Badge>
            <span className="text-2xs text-slate-600">{hasilGerbangSales.sebab}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          {(['Semua', 'Antre', 'Terkirim', 'Gagal', 'Ditolak'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterLkpp(st)}
              className={chipFilter(filterLkpp === st)}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <th className="py-3 px-3.5">ID &amp; Waktu</th>
                <th className="py-3 px-3.5">SKU &amp; Paket Kontrak LKPP</th>
                <th className="py-3 px-3.5">Pemicu &amp; Qty</th>
                <th className="py-3 px-3.5">Status &amp; Percobaan</th>
                <th className="py-3 px-3.5">Respons Gateway</th>
                <th className="py-3 px-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lkppTampil.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3.5 font-mono tabular-nums">
                    <div className="font-bold text-slate-900">{item.id}</div>
                    <div className="text-2xs text-slate-500">{item.waktu}</div>
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="font-semibold text-slate-900">{item.namaProduk}</div>
                    <div className="font-mono text-2xs text-slate-500">
                      {item.kodeSKU} • {item.nomorPaketLkpp}
                    </div>
                  </td>
                  <td className="py-3 px-3.5 tabular-nums">
                    <div className="font-semibold text-slate-800">{item.pemicu}</div>
                    <div className="font-mono text-2xs text-slate-600">
                      Qty lapor: <strong>{item.qtyDilaporkan}</strong>
                    </div>
                  </td>
                  <td className="py-3 px-3.5">
                    <Badge tone={toneLkpp(item.status)}>{item.status}</Badge>
                    <div className="text-2xs text-slate-500 mt-1 tabular-nums">
                      Percobaan ke-{item.percobaan}
                    </div>
                  </td>
                  <td className="py-3 px-3.5 text-2xs text-slate-600 max-w-xs leading-relaxed">
                    {item.pesanRespons}
                  </td>
                  <td className="py-3 px-3.5 text-right">
                    <div className="inline-flex items-center gap-1.5 justify-end flex-wrap">
                      <button
                        type="button"
                        onClick={() => bukaPayloadLkpp(item)}
                        className={tombolSekunder}
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        JSON
                      </button>
                      {item.status !== 'Terkirim' ? (
                        <button
                          type="button"
                          onClick={() => kirimUlangLkpp(item)}
                          className={tombolPrimerGudang}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Kirim / Ulangi
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => simulasiGagalLkpp(item)}
                          className={tombolSekunder}
                          title="Uji penahan konfirmasi saat gateway HTTP 503"
                        >
                          Uji 503
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Panel 2: HL7 FHIR SATUSEHAT Logistik / SMILE Kemenkes */}
      <Panel
        judul="Integrasi HL7 FHIR SATUSEHAT Logistik / SMILE Kemenkes RI"
        keterangan={`Endpoint FHIR: ${konfigurasi.endpointSatuSehat} (${konfigurasi.klienSatuSehatTerdaftar ? 'Klien Produksi Aktif' : 'Mode Pratinjau Sandbox — tanpa token di browser'}). Validator memeriksa kode fasyankes, profil Organization (201), dan kepatuhan suhu rantai dingin 2°C – 8°C.`}
        aksi={
          <button
            type="button"
            onClick={() => setModalFhirBaru(true)}
            className={tombolPrimerGudang}
          >
            <Globe className="w-4 h-4" />
            Bangun Bundle FHIR Baru
          </button>
        }
      >
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          {(
            [
              'Semua',
              'Diterima (201)',
              'Antre',
              'Belum Terkirim',
              'Ditolak (OperationOutcome)'
            ] as const
          ).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterFhir(st)}
              className={chipFilter(filterFhir === st)}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <th className="py-3 px-3.5">ID &amp; Resource FHIR</th>
                <th className="py-3 px-3.5">Fasyankes &amp; Rujukan</th>
                <th className="py-3 px-3.5">Batch / Serial / Suhu</th>
                <th className="py-3 px-3.5">Status Kemenkes</th>
                <th className="py-3 px-3.5">Catatan &amp; Diagnostik</th>
                <th className="py-3 px-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fhirTampil.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3.5 font-mono">
                    <div className="font-bold text-slate-900">{f.id}</div>
                    <Badge tone="blue">{f.tipeSumberDaya}</Badge>
                    <div className="text-2xs text-slate-400 mt-0.5">{f.waktu}</div>
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="font-semibold text-slate-900">{f.namaFasyankes || '-'}</div>
                    <div className="font-mono text-2xs text-slate-500">
                      Kode: {f.kodeFasyankes || '(kosong)'} • Ref: {f.nomorRujukan}
                    </div>
                  </td>
                  <td className="py-3 px-3.5 font-mono text-2xs text-slate-700 space-y-0.5">
                    <div>Batch: {f.nomorBatch}</div>
                    <div>SN: {f.nomorSerial}</div>
                    <div>Suhu: {f.suhuRantaiDingin}</div>
                  </td>
                  <td className="py-3 px-3.5">
                    <Badge tone={toneFhir(f.status)}>{f.status}</Badge>
                  </td>
                  <td className="py-3 px-3.5 text-2xs text-slate-600 max-w-xs leading-relaxed">
                    {f.catatan}
                  </td>
                  <td className="py-3 px-3.5 text-right">
                    <div className="inline-flex items-center gap-1.5 justify-end flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          let rapi = f.payloadJson;
                          try {
                            rapi = JSON.stringify(JSON.parse(f.payloadJson), null, 2);
                          } catch {
                            // biarkan apa adanya bila tidak terurai
                          }
                          setPratinjauJson({
                            judul: `Bundle HL7 FHIR ${f.tipeSumberDaya} — ${f.id}`,
                            endpoint: `POST ${konfigurasi.endpointSatuSehat}`,
                            isi: rapi
                          });
                        }}
                        className={tombolSekunder}
                      >
                        <FileJson className="w-3.5 h-3.5" />
                        FHIR
                      </button>

                      {f.status === 'Ditolak (OperationOutcome)' || f.status === 'Belum Terkirim' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPerbaikanFhir(f);
                            setFormPerbaikan({
                              kodeFasyankes: f.kodeFasyankes || 'FKN-RS-0132-TERPETAKAN',
                              suhuRantaiDingin: f.suhuRantaiDingin,
                              catatan: 'Kode organisasi fasyankes telah dipetakan ulang pada master SATUSEHAT.'
                            });
                          }}
                          className={tombolPrimerGudang}
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          Perbaiki &amp; Kirim
                        </button>
                      ) : f.status === 'Antre' ? (
                        <button
                          type="button"
                          onClick={() => {
                            db.ubahStatusKirimanSatuSehat(
                              f.id,
                              'Diterima (201)',
                              'HTTP 201 Created — Bundle diterima sandbox SATUSEHAT Kemenkes.'
                            );
                            setPesan({
                              tipe: 'sukses',
                              teks: `Kiriman FHIR ${f.id} ditandai Diterima (201).`
                            });
                            segarkan();
                          }}
                          className={tombolPrimerGudang}
                        >
                          <Send className="w-3.5 h-3.5" />
                          Kirim (201)
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Panel 3: e-Report Distribusi Semesteran Alkes Kemenkes RI */}
      <Panel
        judul="e-Report Distribusi Semesteran Alat Kesehatan — Kemenkes RI"
        keterangan="Pemetaan otomatis buku besar mutasi (trx_stock_movements) ke format 10 kolom e-Report: Stok Awal (1 Jan / 1 Jul) + Pemasukan (INBOUND) − Penyaluran (OUTBOUND_SALES − RETURN_IN) = Stok Akhir. Baris dibentuk per (batch, sarana tujuan); surat jalan DELIVERED ber-POD menjadi antrean ekspor periode berjalan."
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 mb-4">
          <div>
            <label className={labelClass}>Tahun Laporan</label>
            <input
              type="number"
              min={2020}
              max={2100}
              value={tahunEReport}
              onChange={(e) => setTahunEReport(Number(e.target.value) || dariAcuan.getFullYear())}
              className={`${inputClass} tabular-nums w-28`}
            />
          </div>
          <div>
            <label className={labelClass}>Semester</label>
            <select
              value={semesterEReport}
              onChange={(e) => setSemesterEReport(Number(e.target.value) as 1 | 2)}
              className={inputClass}
            >
              <option value={1}>S1 — 1 Januari s.d. 30 Juni</option>
              <option value={2}>S2 — 1 Juli s.d. 31 Desember</option>
            </select>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" onClick={() => unduhEReport('CSV')} className={tombolPrimerGudang}>
              <Download className="w-3.5 h-3.5" />
              Ekspor CSV (Excel)
            </button>
            <button type="button" onClick={() => unduhEReport('XLS')} className={tombolSekunder}>
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Ekspor XLS
            </button>
          </div>
          <div className="text-2xs text-slate-500 sm:ml-auto sm:text-right">
            Periode <strong className="font-mono text-slate-700">{periode.kode}</strong> ({periode.mulai} s.d. {periode.akhir})
            <div>{barisEReport.length} baris · {barisBermasalah.length} perlu perbaikan</div>
          </div>
        </div>

        {barisBermasalah.length > 0 && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-2xs text-rose-900 mb-3 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              Validasi e-Report menemukan {barisBermasalah.length} baris bermasalah:
            </div>
            <ul className="list-disc pl-4 space-y-0.5">
              {barisBermasalah.map((b) => (
                <li key={`${b.nomorBatch}-${b.namaSaranaTujuan}`}>
                  <span className="font-mono font-semibold">{b.nomorBatch}</span> → {b.namaSaranaTujuan}: {b.catatanValidasi.join('; ')}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                {KOLOM_EREPOR.map((k) => (
                  <th key={k.kunci} className="py-2.5 px-3 whitespace-nowrap">{k.label}</th>
                ))}
                <th className="py-2.5 px-3">Validasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {barisEReport.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-4 px-3 text-center text-slate-500 text-2xs">
                    Tidak ada mutasi penyaluran (OUTBOUND_SALES) pada periode {periode.kode}.
                  </td>
                </tr>
              ) : (
                barisEReport.map((b) => (
                  <tr
                    key={`${b.nomorBatch}-${b.namaSaranaTujuan}`}
                    className={b.catatanValidasi.length ? 'bg-rose-50/60' : 'hover:bg-slate-50'}
                  >
                    {KOLOM_EREPOR.map((k) => (
                      <td
                        key={k.kunci}
                        className={`py-2 px-3 ${typeof b[k.kunci] === 'number' ? 'tabular-nums font-semibold text-slate-900' : 'text-slate-700'} ${k.kunci === 'nomorIzinEdar' || k.kunci === 'nomorBatch' ? 'font-mono text-2xs' : ''}`}
                      >
                        {String(b[k.kunci])}
                      </td>
                    ))}
                    <td className="py-2 px-3">
                      {b.catatanValidasi.length === 0 ? (
                        <Badge tone="emerald">Lolos</Badge>
                      ) : (
                        <Badge tone="rose">{b.catatanValidasi.length} catatan</Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="text-2xs text-slate-500 mt-2">
          Identitas saldo wajib: Stok Akhir = Stok Awal + Pemasukan − Penyaluran. Berkas diunduh lokal (CSV ber-BOM UTF-8 / XLS);
          pengiriman ke portal e-Report Kemenkes dilakukan backend terpisah setelah ditinjau PJT.
        </p>

        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-slate-500" />
            Riwayat Ekspor e-Report ({riwayatEkspor.length})
          </div>
          {riwayatEkspor.length === 0 ? (
            <p className="text-2xs text-slate-500">Belum ada ekspor tercatat.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <th className="py-2 px-3">Periode</th>
                    <th className="py-2 px-3">Waktu</th>
                    <th className="py-2 px-3">Pengguna</th>
                    <th className="py-2 px-3">Baris</th>
                    <th className="py-2 px-3">Berkas</th>
                    <th className="py-2 px-3">Format</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {riwayatEkspor.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-semibold text-slate-900">{r.periode}</td>
                      <td className="py-2 px-3 font-mono text-2xs text-slate-600">{r.waktu}</td>
                      <td className="py-2 px-3 text-slate-700">{r.pengguna}</td>
                      <td className="py-2 px-3 tabular-nums">{r.jumlahBaris}</td>
                      <td className="py-2 px-3 font-mono text-2xs text-slate-600">{r.namaBerkas}</td>
                      <td className="py-2 px-3"><Badge tone={r.format === 'CSV' ? 'blue' : 'emerald'}>{r.format}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Panel>

      {/* Modal Tambah Webhook LKPP */}
      {modalLkppBaru && (
        <Modal
          judul="Antrekan Sinkronisasi Stok e-Katalog LKPP"
          keterangan="Menyusun payload kuantitas stok bebas saat ini untuk paket kontrak e-Katalog."
          onClose={() => setModalLkppBaru(false)}
        >
          <form onSubmit={antrekanLkpp} className="space-y-3 text-xs">
            <div>
              <label className={labelClass}>Pilih SKU Katalog</label>
              <select
                value={formLkpp.kodeSKU}
                onChange={(e) => setFormLkpp({ ...formLkpp, kodeSKU: e.target.value })}
                className={inputClass}
              >
                {skuUnik.map((s) => (
                  <option key={s.kodeSKU} value={s.kodeSKU}>
                    {s.kodeSKU} — {s.namaAlkes} (Bebas: {s.bebas} {s.satuan})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Nomor Paket Kontrak LKPP</label>
              <input
                type="text"
                required
                value={formLkpp.nomorPaketLkpp}
                onChange={(e) => setFormLkpp({ ...formLkpp, nomorPaketLkpp: e.target.value })}
                className={`${inputClass} font-mono`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Pemicu Sinkronisasi</label>
                <select
                  value={formLkpp.pemicu}
                  onChange={(e) =>
                    setFormLkpp({
                      ...formLkpp,
                      pemicu: e.target.value as SinkronisasiLkpp['pemicu']
                    })
                  }
                  className={inputClass}
                >
                  <option value="Perubahan Stok">Perubahan Stok</option>
                  <option value="Pengiriman">Pengiriman</option>
                  <option value="Karantina">Karantina (Tahan Etalase)</option>
                  <option value="Kerusakan">Kerusakan</option>
                  <option value="Recall">Recall (Tangguhkan Katalog)</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Nomor Batch Terkait</label>
                <input
                  type="text"
                  value={formLkpp.nomorBatch}
                  onChange={(e) =>
                    setFormLkpp({ ...formLkpp, nomorBatch: e.target.value.toUpperCase() })
                  }
                  className={`${inputClass} font-mono uppercase`}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalLkppBaru(false)}
                className={tombolSekunder}
              >
                Batal
              </button>
              <button type="submit" className={tombolPrimerGudang}>
                Masukkan ke Antrean Webhook
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Builder Bundle FHIR */}
      {modalFhirBaru && (
        <Modal
          judul="Bangun Bundle HL7 FHIR SATUSEHAT Logistik"
          keterangan="Suhu di luar 2°C – 8°C atau kode fasyankes kosong otomatis ditahan oleh validator sebelum dikirim."
          onClose={() => setModalFhirBaru(false)}
        >
          <form onSubmit={tambahBundleFhir} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Tipe Sumber Daya FHIR</label>
                <select
                  value={formFhir.tipeSumberDaya}
                  onChange={(e) =>
                    setFormFhir({
                      ...formFhir,
                      tipeSumberDaya: e.target.value as KirimanSatuSehat['tipeSumberDaya']
                    })
                  }
                  className={inputClass}
                >
                  <option value="SupplyDelivery">SupplyDelivery (Pengiriman Alkes)</option>
                  <option value="Device">Device (Registrasi Nomor Seri)</option>
                  <option value="Immunization">Immunization (Rantai Dingin)</option>
                  <option value="Organization">Organization (Profil SDAK Penyalur)</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Nomor Dokumen Rujukan</label>
                <input
                  type="text"
                  required
                  value={formFhir.nomorRujukan}
                  onChange={(e) => setFormFhir({ ...formFhir, nomorRujukan: e.target.value })}
                  className={`${inputClass} font-mono`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Kode Fasyankes SATUSEHAT</label>
                <input
                  type="text"
                  value={formFhir.kodeFasyankes}
                  onChange={(e) => setFormFhir({ ...formFhir, kodeFasyankes: e.target.value })}
                  placeholder="Contoh: FKN-RS-0041"
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div>
                <label className={labelClass}>Nama Fasyankes Penerima</label>
                <input
                  type="text"
                  required
                  value={formFhir.namaFasyankes}
                  onChange={(e) => setFormFhir({ ...formFhir, namaFasyankes: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Nomor Batch</label>
                <input
                  type="text"
                  value={formFhir.nomorBatch}
                  onChange={(e) =>
                    setFormFhir({ ...formFhir, nomorBatch: e.target.value.toUpperCase() })
                  }
                  className={`${inputClass} font-mono uppercase`}
                />
              </div>
              <div>
                <label className={labelClass}>Nomor Serial</label>
                <input
                  type="text"
                  value={formFhir.nomorSerial}
                  onChange={(e) => setFormFhir({ ...formFhir, nomorSerial: e.target.value })}
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div>
                <label className={labelClass}>Lampiran Suhu (°C)</label>
                <input
                  type="text"
                  value={formFhir.suhuRantaiDingin}
                  onChange={(e) => setFormFhir({ ...formFhir, suhuRantaiDingin: e.target.value })}
                  placeholder="- atau 4.5°C"
                  className={`${inputClass} font-mono`}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalFhirBaru(false)}
                className={tombolSekunder}
              >
                Batal
              </button>
              <button type="submit" className={tombolPrimerGudang}>
                Validasi &amp; Simpan Bundle FHIR
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Perbaikan Master Data OperationOutcome */}
      {perbaikanFhir && (
        <Modal
          judul={`Perbaiki Master Data FHIR — ${perbaikanFhir.id}`}
          keterangan="Lengkapi kode fasyankes atau perbaiki lampiran suhu rantai dingin (2°C – 8°C) sebelum kirim ulang."
          onClose={() => setPerbaikanFhir(null)}
        >
          <form onSubmit={simpanPerbaikanDanKirimUlangFhir} className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-2xs text-rose-900">
              <strong>Diagnostik sebelumnya:</strong> {perbaikanFhir.catatan}
            </div>

            <div>
              <label className={labelClass}>Kode Organisasi Fasyankes Terpetakan</label>
              <input
                type="text"
                required
                value={formPerbaikan.kodeFasyankes}
                onChange={(e) =>
                  setFormPerbaikan({ ...formPerbaikan, kodeFasyankes: e.target.value })
                }
                className={`${inputClass} font-mono`}
              />
            </div>

            <div>
              <label className={labelClass}>Lampiran Suhu Rantai Dingin (2°C – 8°C atau -)</label>
              <input
                type="text"
                value={formPerbaikan.suhuRantaiDingin}
                onChange={(e) =>
                  setFormPerbaikan({ ...formPerbaikan, suhuRantaiDingin: e.target.value })
                }
                className={`${inputClass} font-mono`}
              />
            </div>

            <div>
              <label className={labelClass}>Catatan Perbaikan untuk Audit Trail</label>
              <textarea
                rows={2}
                value={formPerbaikan.catatan}
                onChange={(e) => setFormPerbaikan({ ...formPerbaikan, catatan: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPerbaikanFhir(null)}
                className={tombolSekunder}
              >
                Batal
              </button>
              <button type="submit" className={tombolPrimerGudang}>
                <Send className="w-3.5 h-3.5" />
                Bangun Ulang &amp; Kirim ke SATUSEHAT
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Pratinjau Payload JSON */}
      {pratinjauJson && (
        <Modal
          judul={pratinjauJson.judul}
          keterangan={pratinjauJson.endpoint}
          onClose={() => setPratinjauJson(null)}
        >
          <div className="space-y-3 text-xs">
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto font-mono text-2xs leading-relaxed max-h-96">
              {pratinjauJson.isi}
            </pre>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => salinTeks(pratinjauJson.isi)}
                className={tombolPrimerGudang}
              >
                <Copy className="w-3.5 h-3.5" />
                Salin Payload JSON
              </button>
              <button
                type="button"
                onClick={() => setPratinjauJson(null)}
                className={tombolSekunder}
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
