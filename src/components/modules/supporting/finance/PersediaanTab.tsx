import { useMemo, useState } from 'react';
import { db } from '../../../../services/pocketbase';
import type { PusatBiayaId, ValuasiBatch } from '../../../../types';
import {
  NAMA_PUSAT_BIAYA,
  nilaiPersediaanPerBets,
  rancangJurnalHppPengiriman,
  rancangJurnalWriteOff,
  rekonsiliasiPersediaan,
  type SebabWriteOff
} from '../../../../utils/akuntansi';
import { Badge, Modal, Panel, Stat, chipFilter, formatRupiah, formatTanggal, inputClass, labelClass, tombolPrimer, tombolSekunder } from '../../../ui';
import { type IdentitasFinance, kepalaTabelKelas, nomorJurnalBerikutnya, pesanClass, selKelas, tabelKelas } from './ui';
import { Boxes, PackageX, ReceiptText } from 'lucide-react';

const SEBAB_WRITE_OFF: SebabWriteOff[] = ['Kedaluwarsa', 'Rusak', 'Karantina', 'Recall'];
const PUSAT_BIAYA = Object.keys(NAMA_PUSAT_BIAYA) as PusatBiayaId[];
const FILTER_VALUASI = ['Semua', 'Perlu Write-Off', 'Tanpa Dasar Biaya'] as const;

const nadaStatusStok = (status: string) =>
  status === 'AVAILABLE' ? 'emerald' : status === 'RESERVED' ? 'blue' : status === 'QUARANTINE' ? 'amber' : 'rose';

const tandai = (nilai: number) => (nilai === 0 ? formatRupiah(0) : `${nilai > 0 ? '+' : '−'} ${formatRupiah(Math.abs(nilai))}`);

export default function PersediaanTab({
  identitas,
  dariAcuan,
  onPerubahanData
}: {
  identitas: IdentitasFinance;
  dariAcuan: Date;
  onPerubahanData: () => void;
}) {
  const isoAcuan = dariAcuan.toISOString().slice(0, 10);
  const [filter, setFilter] = useState<(typeof FILTER_VALUASI)[number]>('Semua');
  const [pesan, setPesan] = useState<{ tipe: 'sukses' | 'galat'; teks: string } | null>(null);
  const [writeOff, setWriteOff] = useState<{ nomorBatch: string; namaAlkes: string; qtyMaks: number; sebab: SebabWriteOff } | null>(null);
  const [qtyWriteOff, setQtyWriteOff] = useState(0);
  const [pusatWriteOff, setPusatWriteOff] = useState<PusatBiayaId>('PB-DIST');
  const [dasar, setDasar] = useState<ValuasiBatch | 'BARU' | null>(null);
  const [formDasar, setFormDasar] = useState<Partial<ValuasiBatch>>({});

  const jurnal = useMemo(() => db.getJurnalKeuangan(), []);
  const valuasi = useMemo(() => db.getValuasiBatch(), []);
  const stok = useMemo(() => db.getStokGudang(), []);
  const suratJalan = useMemo(() => db.getSuratJalan(), []);
  const akunCoA = useMemo(() => db.getCoA(), []);

  const hasil = useMemo(() => nilaiPersediaanPerBets({ daftarStok: stok, daftarValuasi: valuasi, dari: dariAcuan }), [stok, valuasi, dariAcuan]);

  const rekonsiliasi = useMemo(
    () => rekonsiliasiPersediaan({ daftarJurnal: jurnal, daftarAkun: akunCoA, daftarStok: stok, daftarValuasi: valuasi, sampai: isoAcuan, dari: dariAcuan }),
    [jurnal, akunCoA, stok, valuasi, isoAcuan, dariAcuan]
  );
  const totalSelisihBatch = rekonsiliasi.baris.reduce((a, b) => a + b.selisih, 0);

  const tersaring = hasil.baris.filter((b) =>
    filter === 'Semua' ? true : filter === 'Perlu Write-Off' ? b.perluWriteOff : b.nilaiPerUnit === null
  );

  const ajukanWriteOff = (langsungPosting: boolean) => {
    if (!writeOff) return;
    const dasarBiaya = valuasi.find((v) => v.nomorBatch === writeOff.nomorBatch);
    if (!dasarBiaya) {
      setPesan({ tipe: 'galat', teks: `${writeOff.nomorBatch} tidak punya dasar biaya; catatkan harganya lebih dulu sebelum menghapus nilainya.` });
      return;
    }
    const tanggal = isoAcuan;
    const rancangan = rancangJurnalWriteOff({
      valuasi: dasarBiaya,
      qty: qtyWriteOff,
      sebab: writeOff.sebab,
      tanggal,
      petugas: identitas.pengguna,
      peran: identitas.peran,
      nomorJournal: nomorJurnalBerikutnya(jurnal, tanggal),
      pusatBiaya: pusatWriteOff
    });
    const simpan = db.tambahJurnalKeuangan(rancangan, {
      langsungPosting,
      tanggalPosting: tanggal,
      petugas: identitas.pengguna,
      peran: identitas.peran
    });
    if (!simpan.jurnal) {
      setPesan({ tipe: 'galat', teks: simpan.penyimpangan.map((p) => `${p.kode}: ${p.keterangan}`).join(' · ') });
      return;
    }
    setWriteOff(null);
    setPesan({
      tipe: 'sukses',
      teks: simpan.jurnal.status === 'Posted'
        ? `${simpan.jurnal.nomorJournal} di-posting; kerugian ${writeOff.sebab.toLowerCase()} masuk Laba Rugi dan cadangan penurunan nilai mengurangi Aset.`
        : `${simpan.jurnal.nomorJournal} tersimpan sebagai draf — belum menyentuh laporan sampai PJT/QA Manager mem-posting di tab Jurnal.`
    });
    onPerubahanData();
  };

  const simpanDasar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dasar || dasar === 'BARU') return;
    const baru: ValuasiBatch = {
      ...dasar,
      nilaiPerUnit: Number(formDasar.nilaiPerUnit ?? dasar.nilaiPerUnit),
      metode: (formDasar.metode ?? dasar.metode) as ValuasiBatch['metode'],
      sumberBiaya: (formDasar.sumberBiaya ?? dasar.sumberBiaya) as ValuasiBatch['sumberBiaya'],
      rujukanSumber: formDasar.rujukanSumber ?? dasar.rujukanSumber,
      asal: (formDasar.asal ?? dasar.asal) as ValuasiBatch['asal'],
      tercatatPada: isoAcuan
    };
    if (!(baru.nilaiPerUnit > 0)) {
      setPesan({ tipe: 'galat', teks: 'Nilai per unit harus lebih dari nol; persediaan bernilai nol berarti sudah dihapus seluruhnya.' });
      return;
    }
    db.simpanValuasiBatch(baru);
    setDasar(null);
    setFormDasar({});
    setPesan({
      tipe: 'sukses',
      teks: `Dasar biaya ${baru.nomorBatch} direvisi ke ${formatRupiah(baru.nilaiPerUnit)} per ${baru.satuan}. Jurnal Posted yang memakai harga lama TIDAK diubah — koreksi periode berjalan lewat jurnal penyesuaian.`
    });
    onPerubahanData();
  };

  const susunHpp = (nomorSuratJalan: string) => {
    const sj = suratJalan.find((s) => s.nomorSuratJalan === nomorSuratJalan);
    if (!sj) return;
    const tanggal = isoAcuan;
    const rancangan = rancangJurnalHppPengiriman({
      nomorSuratJalan: sj.nomorSuratJalan,
      tanggal,
      statusSuratJalan: sj.status,
      fasyankesTujuan: sj.fasyankesTujuan,
      rute: sj.rute.map((r) => ({ nomorBatch: r.nomorBatch, qty: r.qty })),
      daftarValuasi: valuasi,
      petugas: identitas.pengguna,
      peran: identitas.peran,
      nomorJournal: nomorJurnalBerikutnya(jurnal, tanggal)
    });
    if (!rancangan.rancangan) {
      setPesan({ tipe: 'galat', teks: `${sj.nomorSuratJalan}: ${rancangan.penolakan.join(' · ')}` });
      return;
    }
    const simpan = db.tambahJurnalKeuangan(rancangan.rancangan);
    if (!simpan.jurnal) {
      setPesan({ tipe: 'galat', teks: simpan.penyimpangan.map((p) => p.keterangan).join(' · ') });
      return;
    }
    setPesan({ tipe: 'sukses', teks: `Draf HPP ${simpan.jurnal.nomorJournal} untuk ${sj.nomorSuratJalan} tersusun; posting di tab Jurnal supaya pendapatan dan HPP seperiode.` });
    onPerubahanData();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <Stat label="Nilai Buku Persediaan" value={formatRupiah(hasil.totalNilaiBuku)} hint={hasil.keterangan} tone="blue" />
        <Stat
          label="Perlu Write-Off"
          value={formatRupiah(hasil.totalPerluWriteOff)}
          hint="Kedaluwarsa, rusak, recall, dan karantina terdeteksi dari kartu stok FEFO — bukan dari perkiraan."
          tone={hasil.totalPerluWriteOff > 0 ? 'amber' : 'emerald'}
        />
        <Stat
          label="Batch Tanpa Dasar Biaya"
          value={String(hasil.betsTanpaDasarBiaya.length)}
          hint={hasil.betsTanpaDasarBiaya.length ? hasil.betsTanpaDasarBiaya.join(', ') : 'Semua batch dapat dinilai — tidak ada nilai yang dikarang.'}
          tone={hasil.betsTanpaDasarBiaya.length ? 'rose' : 'emerald'}
        />
      </div>

      {pesan && <div className={pesanClass(pesan.tipe)}>{pesan.teks}</div>}

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 flex items-start gap-2">
        <Boxes className="w-4 h-4 mt-0.5 shrink-0" />
        <div>
          <div className="font-bold">Dasar biaya saat ini masih DUMMY</div>
          <div className="mt-0.5 leading-relaxed">
            {valuasi.filter((v) => v.asal === 'DUMMY').length} dari {valuasi.length} batch memakai taksiran manajemen (±72% harga e-Katalog), bukan PO/BMR asli.
            Angka Neraca, HPP, dan write-off di bawah konsisten secara akuntansi tetapi BUKAN angka laporan fiskal sampai data asli dimasukkan pada Phase 7.
          </div>
        </div>
      </div>

      <Panel
        judul="Rekonsiliasi Persediaan ↔ Neraca"
        keterangan="Jembatan ini hanya membaca. Angka Gudang (kartu stok × dasar biaya) dilawan harga pokok di buku besar, lalu diturunkan ke nilai bersih Neraca lewat cadangan penurunan nilai. Aplikasi tidak menambal selisih dengan jurnal otomatis — koreksi Anda buat sendiri di tab Jurnal supaya jejak penyesuaiannya tersisa."
        aksi={<Badge tone={rekonsiliasi.status === 'Seimbang' ? 'emerald' : rekonsiliasi.status === 'Buku Besar Belum Dibuka' ? 'blue' : 'rose'}>{rekonsiliasi.status}</Badge>}
      >
        <div className="space-y-1 text-xs">
          {[
            { label: 'Nilai buku kartu stok (Gudang × dasar biaya)', nilai: formatRupiah(rekonsiliasi.totalKartuStok), tebal: false },
            { label: `Selisih ${rekonsiliasi.baris.length} batch lawan buku besar`, nilai: tandai(totalSelisihBatch), tebal: false },
            { label: 'Pergerakan akun persediaan tanpa nomor batch', nilai: tandai(rekonsiliasi.tanpaNomorBatch), tebal: false },
            { label: 'Harga pokok persediaan di buku besar', nilai: formatRupiah(rekonsiliasi.hargaPokokBukuBesar), tebal: true },
            { label: 'Cadangan penurunan nilai 1129 (kontra-aset)', nilai: tandai(rekonsiliasi.cadanganPenurunanNilai), tebal: false },
            { label: 'Nilai bersih persediaan pada Neraca', nilai: formatRupiah(rekonsiliasi.nilaiBersihBukuBesar), tebal: true }
          ].map((b) => (
            <div key={b.label} className={`flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg ${b.tebal ? 'bg-slate-100 font-bold text-slate-900' : 'text-slate-700'}`}>
              <span>{b.label}</span>
              <span className="font-mono whitespace-nowrap">{b.nilai}</span>
            </div>
          ))}
        </div>

        {rekonsiliasi.status === 'Seimbang' ? (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
            {rekonsiliasi.keterangan} Tab Persediaan dan Neraca menunjuk angka yang sama — tidak ada yang perlu ditambal.
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
              {rekonsiliasi.keterangan} Setiap baris di bawah harus diselesaikan dari sisi yang benar (eksekusi gudang, write-off, atau jurnal penyesuaian), bukan dengan menyamakan angkanya paksa.
              {valuasi.some((v) => v.asal === 'DUMMY') && ' Sebagian selisih bisa berawal dari dasar biaya DUMMY; rekonsiliasi ini wajib dibaca ulang setelah data asli masuk pada Phase 7.'}
            </div>
            {rekonsiliasi.baris.length > 0 && (
              <div className="overflow-x-auto">
                <table className={tabelKelas}>
                  <thead>
                    <tr className={kepalaTabelKelas}>
                      <th className={selKelas}>No. Batch</th>
                      <th className={selKelas}>Alkes</th>
                      <th className={`${selKelas} text-right`}>Kartu Stok</th>
                      <th className={`${selKelas} text-right`}>Harga Pokok Buku Besar</th>
                      <th className={`${selKelas} text-right`}>Selisih</th>
                      <th className={selKelas}>Sebab</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rekonsiliasi.baris.map((b) => (
                      <tr key={b.nomorBatch} className="hover:bg-slate-50">
                        <td className={`${selKelas} font-mono font-bold text-blue-800 whitespace-nowrap`}>{b.nomorBatch}</td>
                        <td className={`${selKelas} font-semibold text-slate-900`}>{b.namaAlkes}</td>
                        <td className={`${selKelas} text-right font-mono`}>{formatRupiah(b.nilaiKartuStok)}</td>
                        <td className={`${selKelas} text-right font-mono`}>{formatRupiah(b.hargaPokokBukuBesar)}</td>
                        <td className={`${selKelas} text-right font-mono font-bold ${b.selisih > 0 ? 'text-rose-700' : 'text-amber-700'}`}>{tandai(b.selisih)}</td>
                        <td className={`${selKelas} text-2xs text-slate-500 leading-relaxed`}>{b.sebab}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Panel>

      <Panel
        judul="Valuasi Persediaan per Batch"
        keterangan="Harga pokok melekat pada nomor batch, sehingga write-off dan HPP dapat ditelusuri ke batch yang sama seperti di kartu stok CDAKB."
        aksi={
          <div className="flex items-center gap-1.5 flex-wrap">
            {FILTER_VALUASI.map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)} className={chipFilter(filter === f)}>
                {f}
              </button>
            ))}
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className={tabelKelas}>
            <thead>
              <tr className={kepalaTabelKelas}>
                <th className={selKelas}>No. Batch</th>
                <th className={selKelas}>Alkes</th>
                <th className={`${selKelas} text-right`}>Qty Fisik</th>
                <th className={selKelas}>Status</th>
                <th className={`${selKelas} text-right`}>Harga/Unit</th>
                <th className={`${selKelas} text-right`}>Nilai Buku</th>
                <th className={selKelas}>Dasar Biaya</th>
                <th className={selKelas}>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tersaring.map((b) => {
                const dasarBiaya = valuasi.find((v) => v.nomorBatch === b.nomorBatch && v.kodeSKU === b.kodeSKU);
                return (
                  <tr key={`${b.nomorBatch}-${b.kodeSKU}`} className="hover:bg-slate-50">
                    <td className={`${selKelas} font-mono font-bold text-blue-800 whitespace-nowrap`}>{b.nomorBatch}</td>
                    <td className={`${selKelas} font-semibold text-slate-900`}>
                      <div>{b.namaAlkes}</div>
                      <div className="text-2xs text-slate-500 font-normal">{b.kodeSKU}</div>
                    </td>
                    <td className={`${selKelas} text-right`}>{b.qtyFisik}</td>
                    <td className={selKelas}>
                      <Badge tone={nadaStatusStok(String(b.statusStok))}>{b.statusStok ?? '-'}</Badge>
                    </td>
                    <td className={`${selKelas} text-right ${b.nilaiPerUnit === null ? 'text-rose-700 font-bold' : ''}`}>
                      {b.nilaiPerUnit === null ? 'BELUM ADA' : formatRupiah(b.nilaiPerUnit)}
                    </td>
                    <td className={`${selKelas} text-right font-bold`}>{b.nilaiPerUnit === null ? '-' : formatRupiah(b.nilaiTotal)}</td>
                    <td className={`${selKelas} text-2xs text-slate-500 leading-relaxed`}>
                      <div>{b.catatan}</div>
                      {b.sebab && <div className="text-rose-700 font-semibold mt-0.5">Perlu write-off: {b.sebab}</div>}
                    </td>
                    <td className={selKelas}>
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        {b.perluWriteOff && (
                          <button
                            type="button"
                            disabled={!identitas.bolehAjukanWriteOff}
                            onClick={() => {
                              setWriteOff({ nomorBatch: b.nomorBatch, namaAlkes: b.namaAlkes, qtyMaks: Math.min(b.qtyFisik, dasarBiaya?.qtyTercatat ?? b.qtyFisik), sebab: b.sebab ?? 'Kedaluwarsa' });
                              setQtyWriteOff(Math.min(b.qtyFisik, dasarBiaya?.qtyTercatat ?? b.qtyFisik));
                              setPusatWriteOff(b.sebab === 'Karantina' || b.sebab === 'Recall' ? 'PB-QA' : 'PB-DIST');
                            }}
                            className={`${tombolSekunder} !px-2.5 !py-1 disabled:opacity-40 disabled:cursor-not-allowed`}
                          >
                            <PackageX className="w-3.5 h-3.5" />
                            Write-Off
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (dasarBiaya) {
                              setDasar(dasarBiaya);
                              setFormDasar(dasarBiaya);
                            } else {
                              setDasar('BARU');
                              setFormDasar({
                                nomorBatch: b.nomorBatch,
                                kodeSKU: b.kodeSKU,
                                namaAlkes: b.namaAlkes,
                                satuan: 'Unit',
                                qtyTercatat: b.qtyFisik,
                                tanggalProduksi: isoAcuan,
                                tanggalKedaluwarsa: '2026-12-31',
                                metode: 'FIFO',
                                sumberBiaya: 'Taksiran Manajemen',
                                rujukanSumber: '',
                                asal: 'DUMMY',
                                nilaiPerUnit: 0,
                                tercatatPada: isoAcuan
                              });
                            }
                          }}
                          className={`${tombolSekunder} !px-2.5 !py-1`}
                        >
                          {dasarBiaya ? 'Revisi Dasar' : 'Catat Dasar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {tersaring.length === 0 && (
                <tr>
                  <td colSpan={8} className={`${selKelas} text-center text-slate-500`}>
                    Tidak ada batch pada filter ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        judul="HPP atas Pengiriman"
        keterangan="HPP diakui saat penyerahan, bukan saat surat jalan terbit — selama status masih di perjalanan, pendapatan dan harga pokoknya tidak seperiode."
      >
        <div className="overflow-x-auto">
          <table className={tabelKelas}>
            <thead>
              <tr className={kepalaTabelKelas}>
                <th className={selKelas}>Surat Jalan</th>
                <th className={selKelas}>Fasyankes Tujuan</th>
                <th className={selKelas}>Tanggal Terbit</th>
                <th className={selKelas}>Status</th>
                <th className={`${selKelas} text-right`}>Qty</th>
                <th className={selKelas}>Batch Terlibat</th>
                <th className={selKelas}>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suratJalan.map((s) => {
                const sudahDibukukan = jurnal.some((j) => j.sumberRujukan === 'HPP_PENGIRIMAN' && j.idRujukan === s.nomorSuratJalan);
                const bets = [...new Set(s.rute.map((r) => r.nomorBatch))];
                return (
                  <tr key={s.nomorSuratJalan} className="hover:bg-slate-50">
                    <td className={`${selKelas} font-mono font-bold text-blue-800 whitespace-nowrap`}>{s.nomorSuratJalan}</td>
                    <td className={`${selKelas} font-semibold text-slate-900`}>{s.fasyankesTujuan}</td>
                    <td className={selKelas}>{formatTanggal(s.tanggalTerbit)}</td>
                    <td className={selKelas}>
                      <Badge tone={s.status === 'Terkirim' || s.status === 'Diterima Penerima' ? 'emerald' : 'amber'}>{s.status}</Badge>
                    </td>
                    <td className={`${selKelas} text-right`}>{s.qtyTotal}</td>
                    <td className={`${selKelas} font-mono text-2xs text-slate-500`}>{bets.join(', ') || '-'}</td>
                    <td className={selKelas}>
                      {sudahDibukukan ? (
                        <Badge tone="blue">HPP Terbukukan</Badge>
                      ) : (
                        <button
                          type="button"
                          onClick={() => susunHpp(s.nomorSuratJalan)}
                          className={`${tombolSekunder} !px-2.5 !py-1 ${s.status === 'Terkirim' || s.status === 'Diterima Penerima' ? '!text-blue-800 !border-blue-300' : ''}`}
                        >
                          <ReceiptText className="w-3.5 h-3.5" />
                          Susun Draf HPP
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {suratJalan.length === 0 && (
                <tr>
                  <td colSpan={7} className={`${selKelas} text-center text-slate-500`}>
                    Belum ada surat jalan dari modul Warehouse.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {writeOff && (
        <Modal
          judul={`Write-Off ${writeOff.namaAlkes}`}
          keterangan="Karantina hanya berpindah akun persediaan (belum ada kerugian). Kedaluwarsa, rusak, dan recall memindahkan nilai ke Beban Kerugian Persediaan dengan lawan Cadangan Penurunan Nilai."
          onClose={() => setWriteOff(null)}
        >
          <div className="space-y-3 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="font-mono font-bold text-slate-900">{writeOff.nomorBatch}</div>
              <div className="text-xs text-slate-600">Maksimal {writeOff.qtyMaks} unit sesuai kartu stok dan dasar biaya yang tercatat.</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Sebab</label>
                <select value={writeOff.sebab} onChange={(e) => setWriteOff({ ...writeOff, sebab: e.target.value as SebabWriteOff })} className={`${inputClass} bg-white`}>
                  {SEBAB_WRITE_OFF.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Qty</label>
                <input type="number" min={1} max={writeOff.qtyMaks} value={qtyWriteOff} onChange={(e) => setQtyWriteOff(Number(e.target.value))} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Pusat Biaya</label>
              <select value={pusatWriteOff} onChange={(e) => setPusatWriteOff(e.target.value as PusatBiayaId)} className={`${inputClass} bg-white`}>
                {PUSAT_BIAYA.map((p) => (
                  <option key={p} value={p}>
                    {p} — {NAMA_PUSAT_BIAYA[p]}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2">
              Nilai write-off: <strong>{formatRupiah((valuasi.find((v) => v.nomorBatch === writeOff.nomorBatch)?.nilaiPerUnit ?? 0) * qtyWriteOff)}</strong>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button type="button" onClick={() => setWriteOff(null)} className={tombolSekunder}>
                Batal
              </button>
              <button type="button" onClick={() => ajukanWriteOff(false)} className={tombolSekunder}>
                Simpan Draf
              </button>
              <button
                type="button"
                onClick={() => ajukanWriteOff(true)}
                disabled={!identitas.bolehPosting || qtyWriteOff < 1}
                className={`${tombolPrimer} disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                Draf &amp; Posting
              </button>
            </div>
          </div>
        </Modal>
      )}

      {dasar && (
        <Modal
          judul={dasar === 'BARU' ? 'Catat Dasar Biaya Batch' : `Revisi Dasar Biaya ${dasar.nomorBatch}`}
          keterangan="Dasar biaya adalah sumber harga pokok: PO, BMR produksi, atau taksiran manajemen. Taksiran harus ditandai DUMMY supaya laporan fiskal tidak pernah disusun dari angka sementara."
          onClose={() => setDasar(null)}
        >
          <form onSubmit={simpanDasar} className="space-y-3 text-xs">
            {dasar !== 'BARU' && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700">
                {dasar.namaAlkes} · {dasar.qtyTercatat} {dasar.satuan} · sumber lama {dasar.sumberBiaya} ({dasar.rujukanSumber})
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Nilai per Unit (Rp)</label>
                <input type="number" min={0} step={1000} value={formDasar.nilaiPerUnit ?? 0} onChange={(e) => setFormDasar({ ...formDasar, nilaiPerUnit: Number(e.target.value) })} className={`${inputClass} font-bold`} />
              </div>
              <div>
                <label className={labelClass}>Metode</label>
                <select value={formDasar.metode ?? 'FIFO'} onChange={(e) => setFormDasar({ ...formDasar, metode: e.target.value as ValuasiBatch['metode'] })} className={`${inputClass} bg-white`}>
                  <option value="FIFO">FIFO</option>
                  <option value="Rata-rata Tertimbang">Rata-rata Tertimbang</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Sumber Biaya</label>
                <select value={formDasar.sumberBiaya ?? 'Taksiran Manajemen'} onChange={(e) => setFormDasar({ ...formDasar, sumberBiaya: e.target.value as ValuasiBatch['sumberBiaya'] })} className={`${inputClass} bg-white`}>
                  <option value="Purchase Order">Purchase Order</option>
                  <option value="BMR Produksi">BMR Produksi</option>
                  <option value="Taksiran Manajemen">Taksiran Manajemen</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Asal Data</label>
                <select value={formDasar.asal ?? 'DUMMY'} onChange={(e) => setFormDasar({ ...formDasar, asal: e.target.value as ValuasiBatch['asal'] })} className={`${inputClass} bg-white`}>
                  <option value="DUMMY">DUMMY</option>
                  <option value="ASLI">ASLI</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Rujukan Sumber</label>
              <input type="text" value={formDasar.rujukanSumber ?? ''} onChange={(e) => setFormDasar({ ...formDasar, rujukanSumber: e.target.value })} placeholder="PO-2024-018 / BMR-2024-0142" className={inputClass} />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button type="button" onClick={() => setDasar(null)} className={tombolSekunder}>
                Batal
              </button>
              {dasar !== 'BARU' && (
                <button type="submit" className={tombolPrimer}>
                  Simpan Revisi
                </button>
              )}
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
