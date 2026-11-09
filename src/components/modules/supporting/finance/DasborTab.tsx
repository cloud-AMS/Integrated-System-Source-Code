import { useMemo } from 'react';
import { db } from '../../../../services/pocketbase';
import {
  gerbangPeriodeBuku,
  nilaiPersediaanPerBets,
  rekapPpnMasa,
  susunLabaRugi,
  susunNeraca,
  verifikasiRantaiJurnal
} from '../../../../utils/akuntansi';
import { Badge, BarCapaian, Panel, Stat, formatRupiah, formatTanggal } from '../../../ui';
import { type FinanceTabId, type IdentitasFinance, kepalaTabelKelas, selKelas, tabelKelas, toneStatusJurnal, totalSisi } from './ui';
import { AlertTriangle, Link2, Scale, ShieldCheck } from 'lucide-react';

interface Penyimpangan {
  tingkat: 'galat' | 'peringatan' | 'catatan';
  judul: string;
  keterangan: string;
  tab?: FinanceTabId;
}

export default function DasborTab({
  dariAcuan,
  identitas,
  onPilihTab
}: {
  dariAcuan: Date;
  identitas: IdentitasFinance;
  onPilihTab: (tab: FinanceTabId) => void;
}) {
  const data = useMemo(() => {
    const jurnal = db.getJurnalKeuangan();
    const akun = db.getCoA();
    const valuasi = db.getValuasiBatch();
    const periode = db.getPeriodeBuku();
    const rantai = verifikasiRantaiJurnal(jurnal);
    const isoAcuan = dariAcuan.toISOString().slice(0, 10);
    const persediaan = nilaiPersediaanPerBets({ daftarStok: db.getStokGudang(), daftarValuasi: valuasi, dari: dariAcuan });
    const neraca = susunNeraca({ daftarJurnal: jurnal, daftarAkun: akun, sampai: isoAcuan });
    const awalTahun = `${isoAcuan.slice(0, 4)}-01-01`;
    const labaRugi = susunLabaRugi({ daftarJurnal: jurnal, daftarAkun: akun, dari: awalTahun, sampai: isoAcuan });
    const masaAktif = periode.find((p) => p.status === 'Terbuka')?.id ?? isoAcuan.slice(0, 7);
    const ppn = rekapPpnMasa({ daftarJurnal: jurnal, masa: masaAktif });
    const gerbang = gerbangPeriodeBuku(isoAcuan, periode);
    return { jurnal, akun, valuasi, periode, rantai, persediaan, neraca, labaRugi, ppn, masaAktif, gerbang, isoAcuan };
  }, [dariAcuan]);

  const penyimpangan = useMemo<Penyimpangan[]>(() => {
    const daftar: Penyimpangan[] = [];
    const { jurnal, rantai, neraca, labaRugi, persediaan, valuasi, ppn, masaAktif, gerbang } = data;

    if (!rantai.valid) {
      daftar.push({
        tingkat: 'galat',
        judul: 'Mata rantai jurnal rusak',
        keterangan: `${rantai.penyimpangan.length} penyimpangan: ${rantai.penyimpangan.map((p) => `${p.nomor} (${p.jenis})`).join(', ')}`,
        tab: 'jurnal'
      });
    }

    const draft = jurnal.filter((j) => j.status === 'Draft');
    if (draft.length) {
      daftar.push({
        tingkat: 'peringatan',
        judul: `${draft.length} jurnal masih draf`,
        keterangan: `Draf tidak masuk laporan: ${draft.map((j) => j.nomorJournal).join(', ')}`,
        tab: 'jurnal'
      });
    }

    const tidakSeimbang = jurnal
      .filter((j) => j.status === 'Posted')
      .map((j) => ({ j, selisih: totalSisi(j, 'debit') - totalSisi(j, 'kredit') }))
      .filter((x) => x.selisih !== 0);
    if (tidakSeimbang.length) {
      daftar.push({
        tingkat: 'galat',
        judul: 'Jurnal Posted tidak seimbang',
        keterangan: tidakSeimbang.map((x) => `${x.j.nomorJournal} selisih ${x.selisih}`).join('; '),
        tab: 'jurnal'
      });
    }

    if (!neraca.seimbang) {
      daftar.push({
        tingkat: 'galat',
        judul: 'Neraca tidak seimbang',
        keterangan: neraca.catatan.join(' · ') || `Aset ${neraca.totalAset} lawan Kewajiban+Ekuitas ${neraca.totalKewajiban + neraca.totalEkuitas}`,
        tab: 'laporan'
      });
    }

    if (labaRugi.totalPendapatan > 0 && labaRugi.totalHpp === 0) {
      daftar.push({
        tingkat: 'galat',
        judul: 'Pendapatan tercatat tanpa Harga Pokok Penjualan',
        keterangan: `Pendapatan ${formatRupiah(labaRugi.totalPendapatan)} tetapi HPP nol. Laba kotor yang tampil bukan laba sebenarnya — akui HPP saat surat jalan diserahkan pada tab Persediaan.`,
        tab: 'persediaan'
      });
    }

    const dummy = valuasi.filter((v) => v.asal === 'DUMMY');
    if (dummy.length) {
      daftar.push({
        tingkat: 'peringatan',
        judul: `${dummy.length} batch memakai dasar biaya DUMMY`,
        keterangan:
          'Sistem lama tidak menyimpan harga pokok. Nilai ini taksiran manajemen dan tidak boleh keluar sebagai laporan resmi sampai Fase 7 (hapus data dummy, input data asli).',
        tab: 'persediaan'
      });
    }

    if (persediaan.betsTanpaDasarBiaya.length) {
      daftar.push({
        tingkat: 'galat',
        judul: `${persediaan.betsTanpaDasarBiaya.length} batch tanpa dasar biaya`,
        keterangan: `Persediaan dinilai nol diam-diam bila dibiarkan: ${persediaan.betsTanpaDasarBiaya.join(', ')}`,
        tab: 'persediaan'
      });
    }

    if (persediaan.totalPerluWriteOff > 0) {
      daftar.push({
        tingkat: 'peringatan',
        judul: `Kerugian persediaan menunggu jurnal: ${formatRupiah(persediaan.totalPerluWriteOff)}`,
        keterangan: 'Batch kedaluwarsa, rusak, karantina, atau recall belum semuanya dibukukan.',
        tab: 'persediaan'
      });
    }

    if (!gerbang.boleh) {
      daftar.push({
        tingkat: 'peringatan',
        judul: `Periode ${gerbang.periode} ${data.periode.find((p) => p.id === gerbang.periode)?.status ?? 'tidak terbuka'}`,
        keterangan: gerbang.sebab.join('; '),
        tab: 'periode'
      });
    } else if (!gerbang.terdaftar) {
      daftar.push({
        tingkat: 'catatan',
        judul: `Periode ${gerbang.periode} belum terdaftar sebagai baris periode buku`,
        keterangan: 'Tanpa baris periode, jurnal apa pun diterima. Buat barisnya sebelum tutup buku.',
        tab: 'periode'
      });
    }

    if (ppn.kurangBayar > 0) {
      daftar.push({
        tingkat: 'peringatan',
        judul: `PPN masa ${masaAktif} kurang bayar ${formatRupiah(ppn.kurangBayar)}`,
        keterangan: `${ppn.jumlahFaktur} faktur keluaran; setor sebelum SPT Masa PPN jatuh tempo.`,
        tab: 'pajak'
      });
    } else if (ppn.lebihBayar > 0) {
      daftar.push({
        tingkat: 'catatan',
        judul: `PPN masa ${masaAktif} lebih bayar ${formatRupiah(ppn.lebihBayar)}`,
        keterangan: 'Kompensasi ke masa berikutnya atau restitusi; jangan diakui sebagai pendapatan.',
        tab: 'pajak'
      });
    }

    return daftar;
  }, [data]);

  const galat = penyimpangan.filter((p) => p.tingkat === 'galat').length;
  const peringatan = penyimpangan.filter((p) => p.tingkat === 'peringatan').length;
  const kesiapan = Math.max(0, 100 - galat * 25 - peringatan * 10);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <Stat
          label="Mata Rantai Jurnal"
          value={data.rantai.valid ? `${data.rantai.jumlahMata} mata utuh` : `${data.rantai.penyimpangan.length} rusak`}
          hint={data.rantai.keterangan}
          tone={data.rantai.valid ? 'emerald' : 'rose'}
        />
        <Stat
          label="Jurnal Posted / Total"
          value={`${data.jurnal.filter((j) => j.status === 'Posted').length} / ${data.jurnal.length}`}
          hint={`Draf menunggu posting: ${data.jurnal.filter((j) => j.status === 'Draft').length}`}
          tone={data.jurnal.some((j) => j.status === 'Draft') ? 'amber' : 'emerald'}
        />
        <Stat
          label="Nilai Buku Persediaan"
          value={formatRupiah(data.persediaan.totalNilaiBuku)}
          hint={`${data.valuasi.length} batch bernilai; ${data.persediaan.betsTanpaDasarBiaya.length} tanpa dasar biaya`}
          tone={data.persediaan.betsTanpaDasarBiaya.length ? 'rose' : 'slate'}
        />
        <Stat
          label="Laba Usaha Berjalan"
          value={formatRupiah(data.labaRugi.labaUsaha)}
          hint={`Pendapatan ${formatRupiah(data.labaRugi.totalPendapatan)} · beban ${formatRupiah(data.labaRugi.totalBeban)}`}
          tone={data.labaRugi.labaUsaha >= 0 ? 'emerald' : 'amber'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Panel
            judul="Kesiapan Audit & Penyimpangan Pembukuan"
            keterangan="Setiap baris dihitung dari buku besar, bukan dinyatakan tetap. Angka nol yang tidak berdasar ditampilkan sebagai galat, bukan disembunyikan."
            aksi={
              <Badge tone={galat ? 'rose' : penyimpangan.length ? 'amber' : 'emerald'}>
                {galat} galat · {peringatan} peringatan
              </Badge>
            }
          >
            {penyimpangan.length === 0 ? (
              <div className="flex items-center gap-3 text-xs text-emerald-800">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <span>
                  Buku besar seimbang, rantai hash utuh, dan tidak ada persediaan menggantung per {formatTanggal(data.isoAcuan)}.
                  Siap diaudit ISO 13485 klausul 4.2.4 dan Permenkes 4/2014.
                </span>
              </div>
            ) : (
              <ul className="space-y-2">
                {penyimpangan.map((p, indeks) => (
                  <li
                    key={`${p.judul}-${indeks}`}
                    className={`rounded-xl border px-4 py-3 ${
                      p.tingkat === 'galat'
                        ? 'border-rose-200 bg-rose-50'
                        : p.tingkat === 'peringatan'
                          ? 'border-amber-200 bg-amber-50'
                          : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${p.tingkat === 'galat' ? 'text-rose-700' : 'text-amber-700'}`} />
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-900">{p.judul}</div>
                        <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">{p.keterangan}</p>
                      </div>
                      {p.tab && (
                        <button
                          type="button"
                          onClick={() => onPilihTab(p.tab as FinanceTabId)}
                          className="text-xs font-bold text-blue-700 hover:text-blue-900 cursor-pointer whitespace-nowrap"
                        >
                          Tangani →
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <BarCapaian
                label="Skor kesiapan audit buku besar"
                persen={kesiapan}
                hint={`Bobot: galat −25, peringatan −10. Petugas aktif ${identitas.pengguna}${identitas.bolehPosting ? '' : ' (hanya-baca — posting butuh peran PJT/QA Manager)'}.`}
              />
            </div>
          </Panel>
        </div>

        <Panel judul="Posisi Periode Aktif" keterangan={`Masa pajak ${data.masaAktif} dan status buku sampai ${formatTanggal(data.isoAcuan)}.`}>
          <table className={tabelKelas}>
            <thead>
              <tr className={kepalaTabelKelas}>
                <th className={selKelas}>Pos</th>
                <th className={`${selKelas} text-right`}>Nilai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className={selKelas}>Aset</td>
                <td className={`${selKelas} text-right font-bold`}>{formatRupiah(data.neraca.totalAset)}</td>
              </tr>
              <tr>
                <td className={selKelas}>Kewajiban</td>
                <td className={`${selKelas} text-right font-bold`}>{formatRupiah(data.neraca.totalKewajiban)}</td>
              </tr>
              <tr>
                <td className={selKelas}>Ekuitas (termasuk laba berjalan)</td>
                <td className={`${selKelas} text-right font-bold`}>{formatRupiah(data.neraca.totalEkuitas)}</td>
              </tr>
              <tr>
                <td className={selKelas}>PPN Keluaran masa ini</td>
                <td className={`${selKelas} text-right font-bold`}>{formatRupiah(data.ppn.keluaran)}</td>
              </tr>
              <tr>
                <td className={selKelas}>PPN Masukan masa ini</td>
                <td className={`${selKelas} text-right font-bold`}>{formatRupiah(data.ppn.masukan)}</td>
              </tr>
              <tr>
                <td className={selKelas}>Status PPN</td>
                <td className={`${selKelas} text-right`}>
                  <Badge tone={data.ppn.status === 'Kurang Bayar' ? 'amber' : data.ppn.status === 'Lebih Bayar' ? 'blue' : 'emerald'}>
                    {data.ppn.status}
                  </Badge>
                </td>
              </tr>
              <tr>
                <td className={selKelas}>Persediaan perlu write-off</td>
                <td className={`${selKelas} text-right font-bold text-rose-700`}>{formatRupiah(data.persediaan.totalPerluWriteOff)}</td>
              </tr>
            </tbody>
          </table>
          <div className="flex items-center gap-2 mt-3 text-2xs text-slate-500">
            <Link2 className="w-3.5 h-3.5" />
            <span>Rantai: {data.rantai.sejakGenesis ? 'berakar pada genesis' : 'berakar pada titik cui'} · </span>
            <Scale className="w-3.5 h-3.5" />
            <span>Neraca {data.neraca.seimbang ? 'seimbang' : 'TIDAK seimbang'}</span>
          </div>
        </Panel>
      </div>

      <Panel judul="Lima Jurnal Terakhir" keterangan="Urut kronologis sesuai rantai; setiap mata menandatangani isi ekonominya dengan SHA-256.">
        <table className={tabelKelas}>
          <thead>
            <tr className={kepalaTabelKelas}>
              <th className={selKelas}>Nomor</th>
              <th className={selKelas}>Tanggal</th>
              <th className={selKelas}>Uraian</th>
              <th className={selKelas}>Sumber</th>
              <th className={`${selKelas} text-right`}>Debet = Kredit</th>
              <th className={selKelas}>Status</th>
              <th className={selKelas}>Hash</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[...data.jurnal]
              .sort((a, b) => b.tanggalTransaksi.localeCompare(a.tanggalTransaksi) || b.nomorJournal.localeCompare(a.nomorJournal))
              .slice(0, 5)
              .map((j) => (
                <tr key={j.id} className="hover:bg-slate-50">
                  <td className={`${selKelas} font-mono font-bold text-blue-800`}>{j.nomorJournal}</td>
                  <td className={selKelas}>{formatTanggal(j.tanggalTransaksi)}</td>
                  <td className={`${selKelas} font-semibold text-slate-900`}>{j.uraian}</td>
                  <td className={`${selKelas} text-slate-600`}>{j.sumberRujukan}</td>
                  <td className={`${selKelas} text-right font-bold`}>{formatRupiah(totalSisi(j, 'debit'))}</td>
                  <td className={selKelas}>
                    <Badge tone={toneStatusJurnal(j.status)}>{j.status}</Badge>
                  </td>
                  <td className={`${selKelas} font-mono text-2xs text-slate-500`}>{j.hash.slice(0, 12)}…</td>
                </tr>
              ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
