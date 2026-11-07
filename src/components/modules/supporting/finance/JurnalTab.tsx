import { useMemo, useState } from 'react';
import { db } from '../../../../services/pocketbase';
import type { JurnalKeuangan } from '../../../../types';
import { KODE_AKUN, balikanJurnal, bukuBesar, verifikasiRantaiJurnal } from '../../../../utils/akuntansi';
import {
  Badge,
  type IdentitasFinance,
  Modal,
  Panel,
  Stat,
  chipFilter,
  formatRupiah,
  formatTanggal,
  kepalaTabelKelas,
  nomorJurnalBerikutnya,
  pesanClass,
  selKelas,
  tabelKelas,
  tombolBahaya,
  tombolPrimer,
  tombolSekunder,
  toneStatusJurnal,
  totalSisi
} from './ui';
import { Link2, ShieldAlert, ShieldCheck } from 'lucide-react';

const FILTER_STATUS = ['Semua', 'Posted', 'Draft', 'Void'] as const;

export default function JurnalTab({
  identitas,
  dariAcuan,
  onPerubahanData
}: {
  identitas: IdentitasFinance;
  dariAcuan: Date;
  onPerubahanData: () => void;
}) {
  const [filter, setFilter] = useState<(typeof FILTER_STATUS)[number]>('Semua');
  const [kataKunci, setKataKunci] = useState('');
  const [terpilih, setTerpilih] = useState<string | null>(null);
  const [akunBukuBesar, setAkunBukuBesar] = useState<string>(KODE_AKUN.PERSEDIAAN_ALKES);
  const [pesan, setPesan] = useState<{ tipe: 'sukses' | 'galat'; teks: string } | null>(null);
  const [modalBalik, setModalBalik] = useState<JurnalKeuangan | null>(null);
  const [alasanBalik, setAlasanBalik] = useState('');

  const daftar = useMemo(() => db.getJurnalKeuangan(), []);
  const akun = useMemo(() => db.getCoA(), []);
  const periode = useMemo(() => db.getPeriodeBuku(), []);
  const rantai = useMemo(() => verifikasiRantaiJurnal(daftar), [daftar]);

  const tersaring = useMemo(() => {
    const kueri = kataKunci.trim().toLowerCase();
    return [...daftar]
      .filter((j) => (filter === 'Semua' ? true : j.status === filter))
      .filter(
        (j) =>
          !kueri ||
          j.nomorJournal.toLowerCase().includes(kueri) ||
          j.uraian.toLowerCase().includes(kueri) ||
          j.sumberRujukan.toLowerCase().includes(kueri) ||
          j.idRujukan.toLowerCase().includes(kueri) ||
          j.baris.some((b) => (b.nomorBatch ?? '').toLowerCase().includes(kueri))
      )
      .sort((a, b) => b.tanggalTransaksi.localeCompare(a.tanggalTransaksi) || b.nomorJournal.localeCompare(a.nomorJournal));
  }, [daftar, filter, kataKunci]);

  const detail = daftar.find((j) => j.id === terpilih) ?? null;
  const besar = bukuBesar({
    daftarJurnal: daftar,
    akun: akun.find((a) => a.kode === akunBukuBesar) ?? akun[0],
    sampai: dariAcuan.toISOString().slice(0, 10)
  });

  const nomorBerikutnya = (tanggal: string) => nomorJurnalBerikutnya(daftar, tanggal);

  const posting = (jurnal: JurnalKeuangan) => {
    if (!identitas.bolehPosting) {
      setPesan({ tipe: 'galat', teks: 'Hanya PJT atau QA Manager yang berhak mem-posting jurnal.' });
      return;
    }
    const hasil = db.ubahStatusJurnalKeuangan(jurnal.id, 'Posted', {
      tanggal: dariAcuan.toISOString().slice(0, 10),
      petugas: identitas.pengguna,
      peran: identitas.peran
    });
    if (!hasil.jurnal) {
      setPesan({ tipe: 'galat', teks: hasil.penyimpangan.map((p) => `${p.kode}: ${p.keterangan}`).join(' · ') });
      return;
    }
    setPesan({ tipe: 'sukses', teks: `Jurnal ${jurnal.nomorJournal} di-posting; isi yang di-hash tidak berubah, hanya status dan tanggal posting.` });
    onPerubahanData();
  };

  const buatBalikan = () => {
    if (!modalBalik || !alasanBalik.trim()) return;
    const tanggal = dariAcuan.toISOString().slice(0, 10);
    const hasil = balikanJurnal(modalBalik, {
      alasan: alasanBalik.trim(),
      tanggal,
      petugas: identitas.pengguna,
      peran: identitas.peran,
      nomorJournal: nomorBerikutnya(tanggal),
      daftarAkun: akun,
      daftarPeriode: periode
    });
    if (!hasil.rancangan) {
      setPesan({ tipe: 'galat', teks: hasil.penyimpangan.map((p) => p.keterangan).join(' · ') });
      return;
    }
    const simpan = db.tambahJurnalKeuangan(hasil.rancangan, { langsungPosting: true, tanggalPosting: tanggal, petugas: identitas.pengguna, peran: identitas.peran });
    if (!simpan.jurnal) {
      setPesan({ tipe: 'galat', teks: simpan.penyimpangan.map((p) => p.keterangan).join(' · ') });
      return;
    }
    const batal = db.ubahStatusJurnalKeuangan(modalBalik.id, 'Void', { tanggal, petugas: identitas.pengguna, peran: identitas.peran });
    setModalBalik(null);
    setAlasanBalik('');
    setPesan({
      tipe: 'sukses',
      teks: batal.jurnal
        ? `Jurnal pembalik ${simpan.jurnal.nomorJournal} di-posting dan ${modalBalik.nomorJournal} ditandai Void. Angka asli tetap terbaca di buku besar.`
        : `Jurnal pembalik ${simpan.jurnal.nomorJournal} di-posting; pembatalan ${modalBalik.nomorJournal} ditolak: ${batal.penyimpangan.map((p) => p.keterangan).join(' · ')}`
    });
    onPerubahanData();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <Stat
          label="Integritas Rantai Hash"
          value={rantai.valid ? 'UTUH' : `${rantai.penyimpangan.length} PENYIMPANGAN`}
          hint={rantai.keterangan}
          tone={rantai.valid ? 'emerald' : 'rose'}
        />
        <Stat label="Mata Rantai" value={String(rantai.jumlahMata)} hint={`Genesis ${rantai.sejakGenesis ? 'terhubung' : 'tidak terhubung'}`} tone="slate" />
        <Stat
          label="Total Debet = Total Kredit"
          value={formatRupiah(daftar.filter((j) => j.status === 'Posted').reduce((a, j) => a + totalSisi(j, 'debit'), 0))}
          hint="Buku besar hanya menghitung jurnal Posted; draf dan void tidak menyentuh laporan."
          tone="blue"
        />
      </div>

      {pesan && <div className={pesanClass(pesan.tipe)}>{pesan.teks}</div>}

      {!rantai.valid && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs text-rose-900 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <div className="font-bold">Rantai tanda tangan jurnal rusak — jangan terbitkan laporan sebelum tuntas</div>
            <ul className="mt-1 space-y-0.5">
              {rantai.penyimpangan.map((p) => (
                <li key={`${p.indeks}-${p.nomor}`}>
                  <span className="font-mono">{p.nomor}</span> ({p.jenis}): {p.keterangan}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <Panel
        judul="Jurnal Umum"
        keterangan="Setiap mata ditandatangani SHA-256 atas nomor, tanggal, rujukan, pembuat, dan barisnya. Isi tidak dapat disunting; koreksi lewat jurnal pembalik."
        aksi={
          <div className="flex items-center gap-1.5 flex-wrap">
            {FILTER_STATUS.map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)} className={chipFilter(filter === f)}>
                {f}
              </button>
            ))}
          </div>
        }
      >
        <div className="mb-3">
          <input
            type="text"
            value={kataKunci}
            onChange={(e) => setKataKunci(e.target.value)}
            placeholder="Cari nomor jurnal, uraian, sumber rujukan, atau nomor batch..."
            className="w-full max-w-md px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 text-slate-800"
          />
        </div>
        <div className="overflow-x-auto">
          <table className={tabelKelas}>
            <thead>
              <tr className={kepalaTabelKelas}>
                <th className={selKelas}>Nomor</th>
                <th className={selKelas}>Tanggal</th>
                <th className={selKelas}>Uraian</th>
                <th className={selKelas}>Sumber</th>
                <th className={selKelas}>Rujukan</th>
                <th className={`${selKelas} text-right`}>Nilai</th>
                <th className={selKelas}>Status</th>
                <th className={selKelas}>Tanda Tangan</th>
                <th className={selKelas}>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tersaring.map((j) => {
                const rusak = rantai.penyimpangan.some((p) => p.nomor === j.nomorJournal);
                return (
                  <tr key={j.id} className={`hover:bg-slate-50 ${terpilih === j.id ? 'bg-blue-50' : ''}`}>
                    <td className={`${selKelas} font-mono font-bold text-blue-800 whitespace-nowrap`}>
                      <button type="button" onClick={() => setTerpilih(terpilih === j.id ? null : j.id)} className="cursor-pointer hover:underline">
                        {j.nomorJournal}
                      </button>
                    </td>
                    <td className={selKelas}>{formatTanggal(j.tanggalTransaksi)}</td>
                    <td className={`${selKelas} font-semibold text-slate-900`}>{j.uraian}</td>
                    <td className={`${selKelas} text-slate-600 whitespace-nowrap`}>{j.sumberRujukan}</td>
                    <td className={`${selKelas} font-mono text-[10px] text-slate-600`}>{j.idRujukan}</td>
                    <td className={`${selKelas} text-right font-bold`}>{formatRupiah(totalSisi(j, 'debit'))}</td>
                    <td className={selKelas}>
                      <Badge tone={toneStatusJurnal(j.status)}>{j.status}</Badge>
                    </td>
                    <td className={selKelas}>
                      <span className={`inline-flex items-center gap-1 font-mono text-[10px] ${rusak ? 'text-rose-700' : 'text-slate-500'}`}>
                        {rusak ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                        {j.hash.slice(0, 10)}…
                      </span>
                    </td>
                    <td className={selKelas}>
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        {j.status === 'Draft' && (
                          <button type="button" onClick={() => posting(j)} className={`${tombolPrimer} !px-2.5 !py-1`}>
                            Posting
                          </button>
                        )}
                        {j.status === 'Posted' && identitas.bolehPosting && (
                          <button type="button" onClick={() => setModalBalik(j)} className={`${tombolBahaya} !px-2.5 !py-1`}>
                            Balik
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {tersaring.length === 0 && (
                <tr>
                  <td colSpan={9} className={`${selKelas} text-center text-slate-500`}>
                    Tidak ada jurnal pada filter ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {detail && (
        <Panel judul={`Baris Jurnal ${detail.nomorJournal}`} keterangan={`${detail.uraian} · dibuat oleh ${detail.dibuatOleh} (${detail.peranPembuat})`}>
          <table className={tabelKelas}>
            <thead>
              <tr className={kepalaTabelKelas}>
                <th className={selKelas}>Akun</th>
                <th className={selKelas}>No. Batch</th>
                <th className={selKelas}>Pusat Biaya</th>
                <th className={`${selKelas} text-right`}>Debet</th>
                <th className={`${selKelas} text-right`}>Kredit</th>
                <th className={selKelas}>Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {detail.baris.map((b, i) => {
                const a = akun.find((x) => x.kode === b.akunKode);
                return (
                  <tr key={`${detail.id}-${i}`}>
                    <td className={`${selKelas} font-mono font-bold text-slate-800`}>
                      {b.akunKode} · {a?.nama ?? 'AKUN TIDAK DIKENAL'}
                    </td>
                    <td className={`${selKelas} font-mono text-[10px]`}>{b.nomorBatch ?? '-'}</td>
                    <td className={`${selKelas} text-[10px]`}>{b.pusatBiayaId ?? '-'}</td>
                    <td className={`${selKelas} text-right font-bold ${b.debit ? 'text-slate-900' : 'text-slate-300'}`}>{b.debit ? formatRupiah(b.debit) : '-'}</td>
                    <td className={`${selKelas} text-right font-bold ${b.kredit ? 'text-slate-900' : 'text-slate-300'}`}>{b.kredit ? formatRupiah(b.kredit) : '-'}</td>
                    <td className={`${selKelas} text-slate-600`}>{b.keterangan ?? '-'}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t border-slate-200">
                <td className={`${selKelas} font-bold`} colSpan={3}>
                  <div className="flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-slate-500" />
                    hashSebelum {detail.hashSebelum.slice(0, 16)}…
                  </div>
                </td>
                <td className={`${selKelas} text-right font-bold`}>{formatRupiah(totalSisi(detail, 'debit'))}</td>
                <td className={`${selKelas} text-right font-bold`}>{formatRupiah(totalSisi(detail, 'kredit'))}</td>
                <td className={`${selKelas} font-mono text-[10px] text-slate-500`}>{detail.hash.slice(0, 24)}…</td>
              </tr>
            </tfoot>
          </table>
        </Panel>
      )}

      <Panel
        judul="Buku Besar per Akun"
        keterangan={`Halaman ${besar.akunKode} ${besar.namaAkun} memakai saldo normal ${besar.saldoNormal}; akun kontra seperti Cadangan Penurunan Nilai memang membaca saldonya di sisi kredit.`}
        aksi={
          <select
            value={akunBukuBesar}
            onChange={(e) => setAkunBukuBesar(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
          >
            {akun
              .filter((a) => a.aktif)
              .map((a) => (
                <option key={a.kode} value={a.kode}>
                  {a.kode} — {a.nama}
                </option>
              ))}
          </select>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 text-xs">
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="text-[10px] text-slate-500">Total Debet</div>
            <div className="font-bold">{formatRupiah(besar.totalDebit)}</div>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="text-[10px] text-slate-500">Total Kredit</div>
            <div className="font-bold">{formatRupiah(besar.totalKredit)}</div>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="text-[10px] text-slate-500">Saldo ({besar.saldoNormal})</div>
            <div className="font-bold">{formatRupiah(besar.saldo)}</div>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="text-[10px] text-slate-500">Entri</div>
            <div className="font-bold">{besar.entri.length}</div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className={tabelKelas}>
            <thead>
              <tr className={kepalaTabelKelas}>
                <th className={selKelas}>Tanggal</th>
                <th className={selKelas}>Nomor Jurnal</th>
                <th className={selKelas}>Uraian</th>
                <th className={selKelas}>No. Batch</th>
                <th className={`${selKelas} text-right`}>Debet</th>
                <th className={`${selKelas} text-right`}>Kredit</th>
                <th className={`${selKelas} text-right`}>Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {besar.entri.map((e, i) => (
                <tr key={`${e.nomorJournal}-${e.nomorBatch ?? 'tanpa-batch'}-${i}`} className="hover:bg-slate-50">
                  <td className={selKelas}>{formatTanggal(e.tanggal)}</td>
                  <td className={`${selKelas} font-mono font-bold text-blue-800 whitespace-nowrap`}>{e.nomorJournal}</td>
                  <td className={`${selKelas} text-slate-700`}>{e.uraian}</td>
                  <td className={`${selKelas} font-mono text-[10px]`}>{e.nomorBatch ?? '-'}</td>
                  <td className={`${selKelas} text-right`}>{e.debit ? formatRupiah(e.debit) : '-'}</td>
                  <td className={`${selKelas} text-right`}>{e.kredit ? formatRupiah(e.kredit) : '-'}</td>
                  <td className={`${selKelas} text-right font-bold`}>{formatRupiah(e.saldo)}</td>
                </tr>
              ))}
              {besar.entri.length === 0 && (
                <tr>
                  <td colSpan={7} className={`${selKelas} text-center text-slate-500`}>
                    Akun ini belum punya entri Posted.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {modalBalik && (
        <Modal
          judul={`Balikan Jurnal ${modalBalik.nomorJournal}`}
          keterangan="Jurnal asal tidak diubah dan tidak dihapus. Sistem membuat jurnal pembalik (sisi ditukar) lalu menandai asal sebagai Void, sehingga jejak audit ISO 13485 klausul 4.2.4 tetap lengkap."
          onClose={() => setModalBalik(null)}
        >
          <div className="space-y-3 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="font-bold text-slate-900">{modalBalik.uraian}</div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                {modalBalik.baris.length} baris · {formatRupiah(totalSisi(modalBalik, 'debit'))} · posted {formatTanggal(modalBalik.tanggalPosting ?? '-')}
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Alasan pembalikan (wajib, terekam di audit trail)</label>
              <textarea
                value={alasanBalik}
                onChange={(e) => setAlasanBalik(e.target.value)}
                rows={3}
                placeholder="Contoh: faktur salah input nominal dan sudah melewati jatuh tempo."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button type="button" onClick={() => setModalBalik(null)} className={tombolSekunder}>
                Batal
              </button>
              <button type="button" onClick={buatBalikan} disabled={!alasanBalik.trim()} className={`${tombolBahaya} disabled:opacity-40 disabled:cursor-not-allowed`}>
                Terbitkan Jurnal Pembalik
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
