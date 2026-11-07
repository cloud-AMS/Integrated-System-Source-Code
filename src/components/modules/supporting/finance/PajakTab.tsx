import { useMemo, useState } from 'react';
import { db } from '../../../../services/pocketbase';
import {
  KODE_AKUN,
  csvEksporKpp,
  drafXmlEFaktur,
  hitungLandedCostImpor,
  rancangJurnalLandedCost,
  rekapPpnMasa,
  type BarisFakturPajak
} from '../../../../utils/akuntansi';
import {
  Badge,
  type IdentitasFinance,
  Panel,
  Stat,
  formatRupiah,
  formatTanggal,
  inputClass,
  kepalaTabelKelas,
  labelClass,
  nomorJurnalBerikutnya,
  pesanClass,
  selKelas,
  tabelKelas,
  tombolPrimer,
  tombolSekunder
} from './ui';
import { Download, FileText } from 'lucide-react';

const NPWP_BELUM_DICATAT = 'BELUM-DICATAT';
const KODE_TRANSAKSI_DALAM_NEGERI = '01';

function unduhTeks(namaBerkas: string, isi: string, mime: string) {
  const url = URL.createObjectURL(new Blob([isi], { type: mime }));
  const tautan = document.createElement('a');
  tautan.href = url;
  tautan.download = namaBerkas;
  tautan.click();
  URL.revokeObjectURL(url);
}

const ANGKA = [
  { label: 'Harga FOB', kunci: 'hargaFob' as const },
  { label: 'Angkut luar negeri', kunci: 'angkutLuarNegeri' as const },
  { label: 'Asuransi kargo', kunci: 'asuransi' as const }
];

export default function PajakTab({ identitas, dariAcuan }: { identitas: IdentitasFinance; dariAcuan: Date }) {
  const isoAcuan = dariAcuan.toISOString().slice(0, 10);
  const [pesan, setPesan] = useState<{ tipe: 'sukses' | 'galat'; teks: string } | null>(null);

  const jurnal = useMemo(() => db.getJurnalKeuangan(), []);
  const periode = useMemo(() => db.getPeriodeBuku(), []);
  const transaksi = useMemo(() => db.getTransaksi(), []);
  const tetapan = useMemo(() => db.getTetapanPajak(), []);

  const masaAwal = periode.find((p) => p.status === 'Terbuka')?.id ?? isoAcuan.slice(0, 7);
  const [masa, setMasa] = useState(masaAwal);

  const rekap = useMemo(() => rekapPpnMasa({ daftarJurnal: jurnal, masa }), [jurnal, masa]);

  /** DPP dan PPN dibaca dari baris jurnal Posted, bukan dihitung ulang dari faktur: kalau
   *  keduanya dihitung di sini, keputusan ppnTermasukDalamNominal saat posting bisa dilanggar diam-diam. */
  const barisFaktur = useMemo<BarisFakturPajak[]>(() => {
    const keluar = jurnal.filter((j) => j.status === 'Posted' && j.sumberRujukan === 'FAKTUR_PENJUALAN' && j.tanggalTransaksi.startsWith(masa));
    const kredit = (j: (typeof keluar)[number], kode: string) => j.baris.filter((b) => b.akunKode === kode).reduce((a, b) => a + b.kredit, 0);
    return keluar.map((j) => {
      const tagihan = transaksi.find((t) => t.nomorFaktur === j.idRujukan);
      return {
        nomorFaktur: j.idRujukan,
        tanggalFaktur: j.tanggalTransaksi,
        npwpPembeli: NPWP_BELUM_DICATAT,
        namaPembeli: tagihan?.fasyankesAtauPemasok ?? j.uraian,
        dpp: kredit(j, KODE_AKUN.PENDAPATAN_ALKES) + kredit(j, KODE_AKUN.PENDAPATAN_JASA),
        ppn: kredit(j, KODE_AKUN.PPN_KELUARAN),
        kodeTransaksi: KODE_TRANSAKSI_DALAM_NEGERI
      };
    });
  }, [jurnal, transaksi, masa]);

  const tanpaNpwp = barisFaktur.filter((b) => b.npwpPembeli === NPWP_BELUM_DICATAT).length;
  const xml = drafXmlEFaktur(barisFaktur, '0000000000000000');
  const csv = csvEksporKpp(barisFaktur);

  const [impor, setImpor] = useState({
    hargaFob: 1_200_000_000,
    angkutLuarNegeri: 85_000_000,
    asuransi: 24_000_000,
    beaMasukPersen: 0,
    pungutanPdbPersen: 0.5,
    ppnImporPersen: 11,
    pph22Persen: 2.5,
    qty: 4,
    pph22TidakDapatDikreditkan: false,
    nomorBatch: 'LOT-IMPOR-0001',
    namaAlkes: 'Usgan Portable 4CH'
  });
  const landed = useMemo(() => hitungLandedCostImpor(impor), [impor]);

  const bukukanLandedCost = () => {
    const rancangan = rancangJurnalLandedCost({
      landed,
      nomorBatch: impor.nomorBatch,
      tanggal: isoAcuan,
      petugas: identitas.pengguna,
      peran: identitas.peran,
      nomorJournal: nomorJurnalBerikutnya(jurnal, isoAcuan),
      idRujukan: `PIB ${impor.nomorBatch}`,
      namaAlkes: impor.namaAlkes
    });
    const simpan = db.tambahJurnalKeuangan(rancangan);
    setPesan(
      simpan.jurnal
        ? { tipe: 'sukses', teks: `Draf ${simpan.jurnal.nomorJournal} tersusun: ${formatRupiah(landed.totalTercapitalisasi)} masuk persediaan, PPN impor ke PPN Masukan, PPh 22 ke ${impor.pph22TidakDapatDikreditkan ? 'Beban' : 'Uang Muka Pajak'}. Posting di tab Jurnal.` }
        : { tipe: 'galat', teks: simpan.penyimpangan.map((p) => p.keterangan).join(' · ') }
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <Stat label={`PPN Keluaran Masa ${masa}`} value={formatRupiah(rekap.keluaran)} hint={`${rekap.jumlahFaktur} faktur pajak keluaran Posted.`} tone="blue" />
        <Stat label="PPN Masukan" value={formatRupiah(rekap.masukan)} hint="Termasuk PPN impor dan PPN atas biaya mutu yang dapat dikreditkan." tone="slate" />
        <Stat
          label="Posisi Masa Ini"
          value={rekap.status}
          hint={rekap.status === 'Kurang Bayar' ? `Setor ${formatRupiah(rekap.kurangBayar)} sebelum akhir bulan berikutnya.` : rekap.status === 'Lebih Bayar' ? `Kompensasikan ${formatRupiah(rekap.lebihBayar)} ke masa berikutnya atau restitusi.` : 'Keluaran sama dengan masukan.'}
          tone={rekap.status === 'Kurang Bayar' ? 'amber' : rekap.status === 'Lebih Bayar' ? 'blue' : 'emerald'}
        />
      </div>

      {pesan && <div className={pesanClass(pesan.tipe)}>{pesan.teks}</div>}

      <Panel
        judul="Rekapitulasi PPN Masa Pajak"
        keterangan="Hanya jurnal Posted yang dihitung. Masa yang sudah Dikunci/Ditutup tidak boleh menerima faktur baru — gerbangnya ada di tab Periode."
        aksi={
          <select value={masa} onChange={(e) => setMasa(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white">
            {periode.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} ({p.status})
              </option>
            ))}
          </select>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="text-[10px] text-slate-500">DPP Total</div>
            <div className="font-bold">{formatRupiah(barisFaktur.reduce((a, b) => a + b.dpp, 0))}</div>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="text-[10px] text-slate-500">PPN Kurang Bayar</div>
            <div className="font-bold">{formatRupiah(rekap.kurangBayar)}</div>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="text-[10px] text-slate-500">PPN Lebih Bayar</div>
            <div className="font-bold">{formatRupiah(rekap.lebihBayar)}</div>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="text-[10px] text-slate-500">Baris Tanpa NPWP</div>
            <div className={`font-bold ${tanpaNpwp ? 'text-rose-700' : 'text-emerald-700'}`}>{tanpaNpwp}</div>
          </div>
        </div>
      </Panel>

      <Panel
        judul="Draf Faktur Pajak Keluaran (e-Faktur)"
        keterangan="Draf lokal saja. Sistem ini TIDAK terhubung ke DJP: tidak ada kode DJP, tidak ada pengajuan, dan berkasnya berlabel BELUM DIKIRIM KE DJP."
        aksi={
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => unduhTeks(`draf-efaktur-${masa}.xml`, xml, 'application/xml')} className={`${tombolSekunder} !px-2.5 !py-1`}>
              <Download className="w-3.5 h-3.5" />
              Unduh Draf XML
            </button>
            <button type="button" onClick={() => unduhTeks(`ekspor-kpp-${masa}.csv`, csv, 'text/csv')} className={`${tombolSekunder} !px-2.5 !py-1`}>
              <Download className="w-3.5 h-3.5" />
              Unduh CSV KPP
            </button>
          </div>
        }
      >
        {tanpaNpwp > 0 && (
          <div className="mb-3 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs text-rose-900 flex items-start gap-2">
            <FileText className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <div className="font-bold">{tanpaNpwp} faktur tanpa NPWP pembeli</div>
              <div className="mt-0.5 leading-relaxed">
                Master data pelanggan B2B belum menyimpan NPWP, jadi draf ini belum sah untuk e-Faktur. Isi NPWP pada Phase 7 (hapus data dummy) — sistem tidak boleh mengarang NPWP.
              </div>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className={tabelKelas}>
            <thead>
              <tr className={kepalaTabelKelas}>
                <th className={selKelas}>No. Faktur</th>
                <th className={selKelas}>Tanggal</th>
                <th className={selKelas}>NPWP Pembeli</th>
                <th className={selKelas}>Nama Pembeli</th>
                <th className={`${selKelas} text-right`}>DPP</th>
                <th className={`${selKelas} text-right`}>PPN</th>
                <th className={selKelas}>Kode Transaksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {barisFaktur.map((b) => (
                <tr key={b.nomorFaktur} className="hover:bg-slate-50">
                  <td className={`${selKelas} font-mono font-bold text-blue-800`}>{b.nomorFaktur}</td>
                  <td className={selKelas}>{formatTanggal(b.tanggalFaktur)}</td>
                  <td className={selKelas}>
                    <Badge tone={b.npwpPembeli === NPWP_BELUM_DICATAT ? 'rose' : 'emerald'}>{b.npwpPembeli}</Badge>
                  </td>
                  <td className={`${selKelas} font-semibold text-slate-900`}>{b.namaPembeli}</td>
                  <td className={`${selKelas} text-right`}>{formatRupiah(b.dpp)}</td>
                  <td className={`${selKelas} text-right font-bold`}>{formatRupiah(b.ppn)}</td>
                  <td className={`${selKelas} font-mono text-[10px]`}>{b.kodeTransaksi}</td>
                </tr>
              ))}
              {barisFaktur.length === 0 && (
                <tr>
                  <td colSpan={7} className={`${selKelas} text-center text-slate-500`}>
                    Tidak ada faktur keluaran Posted pada masa ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        judul="Kalkulator Landed Cost Impor"
        keterangan="Bea masuk dan PDB ikut harga pokok; PPN impor menjadi PPN Masukan dan PPh 22 menjadi uang muka pajak. Blueprint asal mengkapitalisasi PPh 22 — itu tidak dipakai di sini karena akan menaikkan HPP dan PPh Badan secara salah."
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs mb-4">
          {ANGKA.map((a) => (
            <div key={a.kunci}>
              <label className={labelClass}>{a.label} (Rp)</label>
              <input type="number" min={0} step={1000} value={impor[a.kunci]} onChange={(e) => setImpor({ ...impor, [a.kunci]: Number(e.target.value) })} className={inputClass} />
            </div>
          ))}
          <div>
            <label className={labelClass}>Qty Unit</label>
            <input type="number" min={1} value={impor.qty} onChange={(e) => setImpor({ ...impor, qty: Number(e.target.value) })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Bea Masuk (%)</label>
            <input type="number" step={0.5} value={impor.beaMasukPersen} onChange={(e) => setImpor({ ...impor, beaMasukPersen: Number(e.target.value) })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Pungutan PDB (%)</label>
            <input type="number" step={0.1} value={impor.pungutanPdbPersen} onChange={(e) => setImpor({ ...impor, pungutanPdbPersen: Number(e.target.value) })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>PPN Impor (%)</label>
            <input type="number" step={0.5} value={impor.ppnImporPersen} onChange={(e) => setImpor({ ...impor, ppnImporPersen: Number(e.target.value) })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>PPh 22 (%)</label>
            <input type="number" step={0.5} value={impor.pph22Persen} onChange={(e) => setImpor({ ...impor, pph22Persen: Number(e.target.value) })} className={inputClass} />
          </div>
          <label className="flex items-start gap-2 text-xs text-slate-700 col-span-2">
            <input type="checkbox" checked={impor.pph22TidakDapatDikreditkan} onChange={(e) => setImpor({ ...impor, pph22TidakDapatDikreditkan: e.target.checked })} className="mt-0.5" />
            <span>
              PPh 22 tidak dapat dikreditkan (tanpa API/NPWP). Tetap dicatat sebagai <strong>beban pajak</strong>, bukan harga pokok persediaan.
            </span>
          </label>
          <div>
            <label className={labelClass}>Nomor Batch Tujuan</label>
            <input type="text" value={impor.nomorBatch} onChange={(e) => setImpor({ ...impor, nomorBatch: e.target.value })} className={`${inputClass} font-mono`} />
          </div>
          <div>
            <label className={labelClass}>Nama Alkes</label>
            <input type="text" value={impor.namaAlkes} onChange={(e) => setImpor({ ...impor, namaAlkes: e.target.value })} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="overflow-x-auto">
            <table className={tabelKelas}>
              <thead>
                <tr className={kepalaTabelKelas}>
                  <th className={selKelas}>Komponen</th>
                  <th className={`${selKelas} text-right`}>Nilai</th>
                  <th className={selKelas}>Perlakuan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {landed.uraianKomponen.map((k) => (
                  <tr key={k.komponen} className="hover:bg-slate-50">
                    <td className={`${selKelas} font-semibold text-slate-800`}>{k.komponen}</td>
                    <td className={`${selKelas} text-right`}>{formatRupiah(k.nilai)}</td>
                    <td className={`${selKelas} text-[10px] ${k.diperlakukan === 'Kapitalisasi persediaan' ? 'text-emerald-700 font-semibold' : 'text-slate-600'}`}>{k.diperlakukan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 p-3">
                <div className="text-[10px] text-slate-500">Total Tercapitalisasi</div>
                <div className="font-bold">{formatRupiah(landed.totalTercapitalisasi)}</div>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <div className="text-[10px] text-slate-500">Harga Pokok per Unit</div>
                <div className="font-bold">{formatRupiah(landed.biayaPerUnit)}</div>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <div className="text-[10px] text-slate-500">PPN Impor (Masukan)</div>
                <div className="font-bold">{formatRupiah(landed.ppnImporMasukan)}</div>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <div className="text-[10px] text-slate-500">PPh 22</div>
                <div className="font-bold">{formatRupiah(landed.pph22UangMuka)} / beban {formatRupiah(landed.pph22Beban)}</div>
              </div>
            </div>
            {landed.sisaPembulatan !== 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
                Pembagian {formatRupiah(landed.totalTercapitalisasi)} ke {impor.qty} unit menyisakan {formatRupiah(landed.sisaPembulatan)} rupiah. Sisa itu dibebankan ke unit pertama supaya total harga pokok tetap persis sama — tidak ada rupiah yang hilang atau muncul dua kali.
              </div>
            )}
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
              Total pembayaran ke kas negara: <strong className="text-slate-900">{formatRupiah(landed.totalPembayaran)}</strong>
            </div>
            <button type="button" onClick={bukukanLandedCost} className={tombolPrimer}>
              Susun Draf Jurnal Landed Cost
            </button>
          </div>
        </div>
      </Panel>

      <Panel
        judul="Tetapan Pajak & Perlakuan Akuntansi"
        keterangan="Tarif adalah data, bukan angka di dalam kode. Setiap tetapan membawa dasar hukum dan status verifikasi PJT; tarif 2026 dan kebijakan impor harus diverifikasi PJT sebelum dipakai memposting."
      >
        <div className="overflow-x-auto">
          <table className={tabelKelas}>
            <thead>
              <tr className={kepalaTabelKelas}>
                <th className={selKelas}>Nama</th>
                <th className={`${selKelas} text-right`}>Tarif</th>
                <th className={selKelas}>Perlakuan</th>
                <th className={selKelas}>Berlaku</th>
                <th className={selKelas}>Dasar Hukum</th>
                <th className={selKelas}>Verifikasi PJT</th>
                <th className={selKelas}>Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tetapan.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className={`${selKelas} font-semibold text-slate-900`}>{t.nama}</td>
                  <td className={`${selKelas} text-right font-mono`}>{t.tarifPersen}%</td>
                  <td className={selKelas}>
                    <Badge tone={t.diperlakukanSebagai === 'Kapitalisasi Persediaan' ? 'emerald' : t.diperlakukanSebagai === 'Kredit Pajak' ? 'blue' : t.diperlakukanSebagai === 'Pajak Keluaran' ? 'amber' : 'slate'}>
                      {t.diperlakukanSebagai}
                    </Badge>
                  </td>
                  <td className={`${selKelas} text-[10px] whitespace-nowrap`}>
                    {formatTanggal(t.berlakuMulai)} – {t.berlakuSampai ? formatTanggal(t.berlakuSampai) : 'berjalan'}
                  </td>
                  <td className={`${selKelas} text-[10px] text-slate-600`}>{t.dasarHukum}</td>
                  <td className={selKelas}>
                    <Badge tone={t.statusVerifikasiPJT === 'Terverifikasi' ? 'emerald' : 'amber'}>{t.statusVerifikasiPJT}</Badge>
                  </td>
                  <td className={`${selKelas} text-[10px] text-slate-500 leading-relaxed`}>{t.keterangan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
