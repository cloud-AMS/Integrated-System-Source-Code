import { useMemo } from 'react';
import { useDbTick } from '../../../../hooks/useDbSync';
import { db } from '../../../../services/pocketbase';
import {
  GudangFisik,
  IzinEdarAlkes,
  LokasiBin,
  PelangganB2B,
  PemasokAlkes,
  StatusZonaCdakb,
  TipeMitra
} from '../../../../types';
import {
  blokirNIEProduk,
  statusZonaBin,
  statusZonaGudang,
  validasiFormatNIE,
  zonaBolehPicking
} from '../../../../utils/gudang';
import { Badge, Panel, Stat, type Tone } from '../../../ui';

interface Props {
  dariAcuan: Date;
}

const toneZona = (zona: StatusZonaCdakb): Tone => {
  if (zona === 'RELEASED') return 'emerald';
  if (zona === 'QUARANTINE') return 'amber';
  if (zona === 'RETURN') return 'blue';
  return 'rose';
};

const toneMitra = (tipe?: TipeMitra): Tone => {
  if (tipe === 'PRINCIPAL') return 'blue';
  if (tipe === 'DISTRIBUTOR') return 'amber';
  if (tipe === 'FASYANKES') return 'emerald';
  return 'slate';
};

interface BarisMitra {
  id: string;
  nama: string;
  asal: 'Pemasok' | 'Pelanggan';
  tipeMitra?: TipeMitra;
  kodeSaranaKemenkes?: string;
  npwp?: string;
  kodeProvinsi?: string;
  kodeKota?: string;
  keterangan: string;
}

export default function MasterDataErpTab({ dariAcuan }: Props) {
  const dbTick = useDbTick(['izin_edar', 'gudang_fisik', 'lokasi_bin', 'pemasok', 'sales_pelanggan']);
  const izinList = useMemo<IzinEdarAlkes[]>(() => {
    void dbTick;
    return db.getIzinEdar();
  }, [dbTick]);
  const gudangList = useMemo<GudangFisik[]>(() => {
    void dbTick;
    return db.getGudangFisik();
  }, [dbTick]);
  const binList = useMemo<LokasiBin[]>(() => {
    void dbTick;
    return db.getLokasiBin();
  }, [dbTick]);
  const pemasokList = useMemo<PemasokAlkes[]>(() => {
    void dbTick;
    return db.getPemasok();
  }, [dbTick]);
  const pelangganList = useMemo<PelangganB2B[]>(() => {
    void dbTick;
    return db.getPelangganB2B();
  }, [dbTick]);

  const produkTerblokir = useMemo(
    () => izinList.filter((i) => blokirNIEProduk(i, dariAcuan) !== null),
    [izinList, dariAcuan]
  );

  const gudangTertutup = useMemo(
    () => gudangList.filter((g) => !zonaBolehPicking(statusZonaGudang(g))),
    [gudangList]
  );

  const mitraList = useMemo<BarisMitra[]>(
    () => [
      ...pemasokList.map((p): BarisMitra => ({
        id: p.id,
        nama: p.namaPemasok,
        asal: 'Pemasok',
        tipeMitra: p.tipeMitra,
        kodeSaranaKemenkes: p.kodeSaranaKemenkes,
        npwp: p.npwp,
        kodeProvinsi: p.kodeProvinsi,
        kodeKota: p.kodeKota,
        keterangan: `${p.kategori} · ${p.negara} · Audit: ${p.statusAuditMutu}`
      })),
      ...pelangganList.map((p): BarisMitra => ({
        id: p.id,
        nama: p.namaInstalasi,
        asal: 'Pelanggan',
        tipeMitra: p.tipeMitra,
        kodeSaranaKemenkes: p.kodeSaranaKemenkes,
        npwp: p.npwp,
        kodeProvinsi: p.kodeProvinsi,
        kodeKota: p.kodeKota,
        keterangan: `${p.tipeFasyankes} · ${p.provinsi} · ${p.statusPelanggan}`
      }))
    ],
    [pemasokList, pelangganList]
  );

  const mitraTanpaKode = mitraList.filter((m) => !m.kodeSaranaKemenkes);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Produk Terdaftar (mst_products)"
          value={izinList.length}
          hint="SKU, NIE, kelas risiko, syarat simpan & tipe lacak"
          tone="amber"
        />
        <Stat
          label="NIE Kedaluwarsa / Terblokir"
          value={produkTerblokir.length}
          hint="Otomatis ditolak picking FEFO & outbound (hard-control)"
          tone={produkTerblokir.length > 0 ? 'rose' : 'emerald'}
        />
        <Stat
          label="Zona Tertutup untuk Picking"
          value={gudangTertutup.length}
          hint="QUARANTINE / REJECT / RETURN / RECALL di luar rute Sales"
          tone={gudangTertutup.length > 0 ? 'amber' : 'emerald'}
        />
        <Stat
          label="Mitra Tanpa Kode Sarana"
          value={mitraTanpaKode.length}
          hint="Kolom Kode Sarana/Wilayah e-Report akan kosong"
          tone={mitraTanpaKode.length > 0 ? 'amber' : 'emerald'}
        />
      </div>

      {/* mst_products */}
      <Panel
        judul="mst_products — Registri Produk & Izin Edar (SKU · NIE · Syarat Simpan)"
        keterangan="Sumber tunggal atribut regulasi per SKU: nomor izin edar wajib berformat KEMENKES RI AKL/AKD; NIE kedaluwarsa memblokir alokasi FEFO dan surat jalan secara otomatis. Kelas risiko A–D dan rentang suhu menentukan zona penyimpanan yang diizinkan."
      >
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <th className="py-3 px-4">SKU & Produk</th>
                <th className="py-3 px-4">Nomor Izin Edar (NIE)</th>
                <th className="py-3 px-4">AKL/AKD & Kelas Risiko</th>
                <th className="py-3 px-4">Syarat Simpan</th>
                <th className="py-3 px-4">Tipe Lacak</th>
                <th className="py-3 px-4">Status Blokir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {izinList.map((i) => {
                const format = validasiFormatNIE(i.nomorIzinEdar);
                const blokir = blokirNIEProduk(i, dariAcuan);
                return (
                  <tr key={i.id} className="hover:bg-slate-50 align-top">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{i.namaAlkes}</div>
                      <div className="text-2xs font-mono text-slate-600">{i.skuCode ?? i.id} · {i.tipeModel}</div>
                      <div className="text-2xs text-slate-500">{i.produsen} · {i.negaraAsal}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-800">{format.bersih || '-'}</div>
                      <Badge tone={format.valid ? 'emerald' : 'rose'}>
                        {format.valid ? 'Format Valid' : 'Format Tidak Valid'}
                      </Badge>
                      <div className="text-2xs text-slate-500 mt-1">ED NIE {i.tanggalKedaluwarsa}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge tone={i.aklAkd === 'AKL' ? 'blue' : 'slate'}>{i.aklAkd ?? '-'}</Badge>
                      <div className="text-2xs text-slate-600 mt-1">{i.kelasRisiko} · {i.kategori}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{i.kondisiSimpan ?? '-'}</div>
                      {i.suhuMinC !== undefined && i.suhuMaxC !== undefined && (
                        <div className="text-2xs font-mono text-slate-500 tabular-nums">{i.suhuMinC}°C – {i.suhuMaxC}°C</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge tone={i.tipeLacak === 'SERIAL_NUMBER' ? 'blue' : 'slate'}>
                        {i.tipeLacak ?? 'BATCH_ONLY'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {blokir ? (
                        <div className="space-y-1">
                          <Badge tone="rose">Terblokir</Badge>
                          <div className="text-2xs text-rose-700 max-w-52 leading-snug">{blokir}</div>
                        </div>
                      ) : (
                        <Badge tone="emerald">Boleh Diedarkan</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* mst_locations */}
      <Panel
        judul="mst_locations — Zona Status Gudang (QUARANTINE / RELEASED / REJECT / RETURN / RECALL)"
        keterangan="Status zona per unit gudang menentukan kelayakan picking: hanya RELEASED yang terbuka untuk Sales dan alokasi FEFO. Bin dapat menimpa (override) zona induknya — rincian per bin ada di Tab 2 Struktur Gudang & Bin."
      >
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <th className="py-3 px-4">Kode & Nama Gudang</th>
                <th className="py-3 px-4">Tipe Ruang</th>
                <th className="py-3 px-4">Status Zona</th>
                <th className="py-3 px-4">Gerbang Picking</th>
                <th className="py-3 px-4">Bin (Override Zona)</th>
                <th className="py-3 px-4">Penanggung Jawab</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {gudangList.map((g) => {
                const zona = statusZonaGudang(g);
                const binGudang = binList.filter((b) => b.gudangId === g.id);
                const binOverride = binGudang.filter((b) => b.statusZona && b.statusZona !== zona);
                return (
                  <tr key={g.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{g.nama}</div>
                      <div className="text-2xs font-mono text-slate-500">{g.id}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{g.tipe}</td>
                    <td className="py-3 px-4">
                      <Badge tone={toneZona(zona)}>{zona}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      {zonaBolehPicking(zona) ? (
                        <Badge tone="emerald">Terbuka (Sales & FEFO)</Badge>
                      ) : (
                        <Badge tone="rose">Tertutup untuk Sales/picking</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                      {binGudang.length} bin
                      {binOverride.length > 0 && (
                        <div className="text-2xs text-amber-700 font-sans">{binOverride.length} bin override zona</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{g.penanggungJawab}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* mst_partners */}
      <Panel
        judul="mst_partners — Mitra Usaha (PRINCIPAL / DISTRIBUTOR / FASYANKES / RETAIL)"
        keterangan="Identitas resmi sarana untuk pemetaan e-Report Kemenkes: kode sarana/IDAK, NPWP, serta kode provinsi & kota. Mitra tanpa kode sarana tetap dapat bertransaksi, namun kolom Kode Sarana/Wilayah pada ekspor e-Report akan kosong dan ditandai perlu perbaikan."
      >
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <th className="py-3 px-4">Nama Mitra</th>
                <th className="py-3 px-4">Tipe Mitra</th>
                <th className="py-3 px-4">Kode Sarana / IDAK</th>
                <th className="py-3 px-4">NPWP</th>
                <th className="py-3 px-4">Kode Provinsi / Kota</th>
                <th className="py-3 px-4">Kesiapan e-Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mitraList.map((m) => (
                <tr key={`${m.asal}-${m.id}`} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{m.nama}</div>
                    <div className="text-2xs text-slate-500">{m.asal} · {m.keterangan}</div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge tone={toneMitra(m.tipeMitra)}>{m.tipeMitra ?? 'Belum Dipetakan'}</Badge>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">{m.kodeSaranaKemenkes ?? '-'}</td>
                  <td className="py-3 px-4 font-mono text-2xs text-slate-600">{m.npwp ?? '-'}</td>
                  <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                    {m.kodeProvinsi ?? '-'} / {m.kodeKota ?? '-'}
                  </td>
                  <td className="py-3 px-4">
                    {m.kodeSaranaKemenkes ? (
                      <Badge tone="emerald">Siap e-Report</Badge>
                    ) : (
                      <Badge tone="amber">Kode Sarana Kosong</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}