/**
 * MODUL E-KATALOG INTERNAL & PDF
 *
 * e-Katalog kustom format vertikal A4 (Portrait) dengan maksimum 2 produk per halaman.
 * Pengguna dapat menyunting seluruh tampilan halaman depan (cover) dan belakang (back cover)
 * secara manual, termasuk mengatur latar belakang (background image atau warna kustom RGB/Hex).
 */
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  Printer,
  CheckSquare,
  Square,
  ArrowUp,
  ArrowDown,
  Search,
  Building2,
  ShieldCheck,
  Check,
  ImageOff,
  Palette,
  Info,
  Image as ImageIcon
} from 'lucide-react';
import { db } from '../../../../services/pocketbase';
import { gabungkanKatalogProduk, selesaikanGambar } from '../../../../utils/website';
import { ProdukWebsite } from '../../../../types';
import { Panel } from '../../../ui';

/** Lebar 210mm dalam piksel CSS (96dpi) — dipakai untuk menghitung skala pratinjau. */
const A4_LEBAR_PX = (210 * 96) / 25.4;
const NAMA_BERKAS_PDF = 'Katalog Elektronik AMS 2026';

export default function InternalCatalogModule() {
  // Ambil data produk dari register izin edar & rujukan website
  const daftarProdukSemua = useMemo(() => {
    try {
      const sumber = {
        izinEdar: db.getIzinEdar(),
        stok: db.getStokGudang(),
        pengetahuanProduk: db.getPengetahuanProduk(),
        skemaHarga: []
      };
      return gabungkanKatalogProduk(sumber);
    } catch {
      return [];
    }
  }, []);

  // State pengaturan katalog
  const [judulKatalog, setJudulKatalog] = useState('Katalog Resmi Alkes & BMHP • PT Anugrah Mitra Selaras 2026');
  const [subjudulKatalog, setSubjudulKatalog] = useState('Standar Mutu CDAKB & ISO 13485:2016 • e-Katalog LKPP Pemerintah & Swasta');
  const [produkPerPage, setProdukPerPage] = useState<number>(2); // Maksimum 2 produk per halaman (1 atau 2)
  
  // Cover Depan (Full Manual Editing + Background Color RGB & Image)
  const [tampilCover, setTampilCover] = useState(true);
  const [judulCover, setJudulCover] = useState('KATALOG PRODUK ALAT KESEHATAN');
  const [subjudulCover, setSubjudulCover] = useState('PT ANUGRAH MITRA SELARAS (REMEDI)');
  const [penulisCover, setPenulisCover] = useState('Divisi Komersial & Penjaminan Mutu (PJT)');
  const [badgeCover, setBadgeCover] = useState('EDISI RESMI 2026');
  const [bgCoverColor, setBgCoverColor] = useState('#ffffff');
  const [bgCoverImage, setBgCoverImage] = useState('');

  // Back Cover (Full Manual Editing + Background Color RGB & Image)
  const [tampilBackCover, setTampilBackCover] = useState(true);
  const [judulBackCover, setJudulBackCover] = useState('Mitra Terpercaya Pengadaan Rumah Sakit Pemerintah & Swasta');
  const [catatanBackCover, setCatatanBackCover] = useState('Dokumen resmi penawaran e-Katalog LKPP, LPSE, dan Purchase Order B2B. Semua produk telah memiliki izin edar aktif Kemenkes RI.');
  const [alamatBackCover, setAlamatBackCover] = useState('Jl. Cempaka Utama No. 88, Komplek Pergudangan CDAKB Blok B-5, Jakarta 13830');
  const [kontakBackCover, setKontakBackCover] = useState('Surel: info@anugrahmitraselaras.co.id | Telepon: (021) 4788-9999 | Web: www.anugrahmitraselaras.co.id');
  const [bgBackCoverColor, setBgBackCoverColor] = useState('#0f172a'); // slate-900
  const [bgBackCoverImage, setBgBackCoverImage] = useState('');

  // Selected products IDs
  const [pilihanId, setPilihanId] = useState<string[]>(() => 
    daftarProdukSemua.slice(0, 4).map(p => p.id)
  );

  const [pencarian, setPencarian] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('Semua');

  // Filter produk untuk pemilihan
  const produkTersaring = useMemo(() => {
    return daftarProdukSemua.filter(p => {
      const matchKey = p.nama.toLowerCase().includes(pencarian.toLowerCase()) ||
                       (p.nomorIzinEdar && p.nomorIzinEdar.toLowerCase().includes(pencarian.toLowerCase()));
      const matchKat = kategoriFilter === 'Semua' || p.kategori === kategoriFilter;
      return matchKey && matchKat;
    });
  }, [daftarProdukSemua, pencarian, kategoriFilter]);

  const daftarKategori = useMemo(() => {
    const setKat = new Set(daftarProdukSemua.map(p => p.kategori).filter(Boolean));
    return ['Semua', ...Array.from(setKat)];
  }, [daftarProdukSemua]);

  const produkTerpilihList = useMemo(() => {
    return pilihanId.map(id => daftarProdukSemua.find(p => p.id === id)).filter(Boolean) as ProdukWebsite[];
  }, [pilihanId, daftarProdukSemua]);

  // Grouping produk per halaman (Maksimum 2 produk per halaman A4 Portrait)
  const produkPerPageEfektif = useMemo(() => Math.min(2, Math.max(1, produkPerPage)), [produkPerPage]);

  const halamanProdukList = useMemo(() => {
    const hasil: ProdukWebsite[][] = [];
    for (let i = 0; i < produkTerpilihList.length; i += produkPerPageEfektif) {
      hasil.push(produkTerpilihList.slice(i, i + produkPerPageEfektif));
    }
    return hasil;
  }, [produkTerpilihList, produkPerPageEfektif]);

  const totalHalamanEst = (tampilCover ? 1 : 0) + halamanProdukList.length + (tampilBackCover ? 1 : 0);

  const togglePilih = (id: string) => {
    if (pilihanId.includes(id)) {
      setPilihanId(pilihanId.filter(x => x !== id));
    } else {
      setPilihanId([...pilihanId, id]);
    }
  };

  const pindahUrutan = (index: number, arah: -1 | 1) => {
    const target = index + arah;
    if (target < 0 || target >= pilihanId.length) return;
    const salinan = [...pilihanId];
    [salinan[index], salinan[target]] = [salinan[target], salinan[index]];
    setPilihanId(salinan);
  };

  const panggungRef = useRef<HTMLDivElement>(null);
  const [skala, setSkala] = useState(1);

  // Pratinjau hanya memperkecil halaman A4 asli (zoom), tidak mengubah layoutnya.
  useEffect(() => {
    const el = panggungRef.current;
    if (!el) return;
    const ukur = () => setSkala(Math.min(1, el.clientWidth / A4_LEBAR_PX));
    ukur();
    const pengamat = new ResizeObserver(ukur);
    pengamat.observe(el);
    return () => pengamat.disconnect();
  }, []);

  const mulaiCetak = useCallback(() => {
    document.body.classList.add('katalog-cetak');
  }, []);

  const hentikanCetak = useCallback(() => {
    document.body.classList.remove('katalog-cetak');
  }, []);

  useEffect(() => {
    window.addEventListener('beforeprint', mulaiCetak);
    window.addEventListener('afterprint', hentikanCetak);
    return () => {
      window.removeEventListener('beforeprint', mulaiCetak);
      window.removeEventListener('afterprint', hentikanCetak);
      hentikanCetak();
    };
  }, [mulaiCetak, hentikanCetak]);

  const cetakPdf = () => {
    const judulSemula = document.title;
    // Chrome memakai judul dokumen sebagai nama awal berkas PDF.
    document.title = NAMA_BERKAS_PDF;
    mulaiCetak();
    try {
      window.print();
    } finally {
      hentikanCetak();
      document.title = judulSemula;
    }
  };

  // Satu sumber halaman: pratinjau dan berkas cetak memakai JSX yang sama persis.
  const susunHalaman = () => (
    <>
      {/* --- COVER DEPAN (PORTRAIT) --- */}
      {tampilCover && (
        <div
          className="a4-page"
          style={{
            backgroundColor: bgCoverColor,
            backgroundImage: bgCoverImage ? `url(${bgCoverImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: bgCoverColor === '#ffffff' || bgCoverColor.toLowerCase() === '#fff' ? '#0f172a' : '#ffffff'
          }}
        >
          <div className="shrink-0 flex items-center justify-between border-b pb-[4mm] border-current/20">
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-emerald-600" />
              <div>
                <p className="text-xs font-bold">PT ANUGRAH MITRA SELARAS</p>
                <p className="text-3xs opacity-80">Kemenkes RI • CDAKB &amp; ISO 13485:2016</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              {badgeCover}
            </span>
          </div>

          <div className="flex-1 min-h-0 flex flex-col justify-center text-center gap-[5mm] py-[6mm]">
            <span className="self-center px-3 py-1 rounded bg-slate-900 text-white text-2xs font-bold tracking-widest uppercase">
              e-KATALOG INTERNAL E-PURCHASING
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight leading-[1.2]">
              {judulCover}
            </h1>
            <p className="text-base font-medium text-emerald-700 max-w-[130mm] mx-auto leading-[1.4]">
              {subjudulCover}
            </p>
            <p className="text-2xs opacity-80 max-w-[120mm] mx-auto leading-[1.6] pt-2">
              {subjudulKatalog}
            </p>
          </div>

          <div className="shrink-0 pt-[5mm] border-t border-current/20 flex items-center justify-between text-2xs opacity-90">
            <div>
              <p className="font-semibold">{penulisCover}</p>
              <p className="text-3xs">Pusat Distribusi &amp; Logistik Alkes Nasional</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">www.anugrahmitraselaras.co.id</p>
              <p className="text-3xs">Hotline: (021) 555-AMS</p>
            </div>
          </div>
        </div>
      )}

      {/* --- HALAMAN PRODUK (PORTRAIT A4) --- */}
      {halamanProdukList.map((grupProduk, idxHal) => {
        const nomorHalamanIni = (tampilCover ? 1 : 0) + idxHal + 1;
        const budgetSpesifikasi = produkPerPageEfektif === 1 ? 8 : 5;
        const budgetKeunggulan = produkPerPageEfektif === 1 ? 4 : 3;
        return (
          <div key={idxHal} className="a4-page bg-white">
            {/* Header Halaman */}
            <div className="shrink-0 flex items-center justify-between gap-[6mm] border-b border-slate-200 pb-[3mm]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-slate-800 leading-[1.3]">{judulKatalog}</span>
              </div>
              <span className="text-2xs text-slate-400 font-medium shrink-0">Halaman {nomorHalamanIni} dari {totalHalamanEst}</span>
            </div>

            {/* Grid Produk per Halaman (Maks 2 produk per halaman portrait A4) */}
            <div className="flex-1 min-h-0 flex flex-col gap-[4mm] py-[3mm]">
              {grupProduk.map((p) => {
                const fotoUrl = selesaikanGambar(p.imageUrl);
                return (
                  <div key={p.id} className="flex-1 min-h-0 overflow-hidden flex flex-col border border-slate-200 rounded-[3mm] bg-white p-[4mm] text-2xs">

                    {/* Header Kartu Produk */}
                    <div className="shrink-0 flex items-center justify-between gap-[3mm]">
                      <span className="text-3xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 uppercase tracking-wide">
                        {p.kategoriRegulasi || p.kategori} · {p.kelasRisiko || 'Kelas C'}
                      </span>
                      <span className="text-3xs font-semibold text-slate-500 shrink-0">{p.nomorIzinEdar || 'NIE Aktif'}</span>
                    </div>

                    <h3 className="shrink-0 mt-[1.5mm] font-bold text-slate-900 text-sm leading-[1.25]">
                      {p.nama}
                    </h3>
                    <p className="shrink-0 text-3xs text-slate-500 mt-[0.5mm]">Model / Tipe: {p.tipeModel || 'Standar Unit Alkes'}</p>

                    {/* Detail Dua Kolom: tinggi kolom mengikuti sisa ruang kartu */}
                    <div className="flex-1 min-h-0 grid grid-cols-2 gap-[3mm] mt-[3mm] pt-[3mm] border-t border-slate-100">

                      {/* Kolom Kiri: Gambar Produk & Kepatuhan */}
                      <div className="min-h-0 flex flex-col gap-[2.5mm]">
                        <div className="flex-1 min-h-0 rounded-[2mm] border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shadow-inner">
                          {fotoUrl ? (
                            <img src={fotoUrl} alt={p.nama} className="w-full h-full object-contain p-[2mm]" />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400">
                              <ImageOff className="w-7 h-7 mb-1" />
                              <span className="text-3xs">PT Anugrah Mitra Selaras</span>
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 bg-slate-50 rounded-[2mm] p-[2.5mm] border border-slate-200 text-3xs space-y-[1mm]">
                          <p className="font-bold text-slate-700 border-b border-slate-200 pb-[1mm]">Informasi Kepatuhan &amp; Distribusi</p>
                          <div className="flex justify-between gap-[3mm]">
                            <span className="text-slate-500 shrink-0">No. Izin Edar</span>
                            <span className="font-semibold text-slate-800 text-right">{p.nomorIzinEdar || 'AKD 21603910'}</span>
                          </div>
                          <div className="flex justify-between gap-[3mm]">
                            <span className="text-slate-500 shrink-0">Status Registrasi</span>
                            <span className="font-semibold text-emerald-700">{p.statusIzinEdar || 'Aktif'}</span>
                          </div>
                          <div className="flex justify-between gap-[3mm]">
                            <span className="text-slate-500 shrink-0">Produsen / Prinsipal</span>
                            <span className="font-semibold text-slate-800 text-right">{p.produsen || 'PT AMS'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Kolom Kanan: Harga Referensi & Spesifikasi */}
                      <div className="min-h-0 flex flex-col gap-[2.5mm]">
                        <div className="shrink-0 bg-teal-50/70 border border-teal-200 rounded-[2mm] p-[2.5mm]">
                          <span className="text-3xs font-bold text-teal-800 block uppercase tracking-wider">Referensi Harga &amp; Pengadaan</span>
                          <p className="font-bold text-teal-900 text-2xs mt-[1mm]">Sesuai Kontrak / e-Katalog LKPP</p>
                          <p className="text-3xs text-slate-600 mt-[1mm] leading-[1.5]">Melayani pengadaan RS Pemerintah &amp; Swasta melalui e-Katalog LKPP.</p>
                        </div>

                        <div className="flex-1 min-h-0 overflow-hidden">
                          <span className="font-bold text-slate-700 text-3xs block uppercase tracking-wide mb-[1mm]">Spesifikasi Teknis</span>
                          <p className={`text-slate-600 text-3xs leading-[1.5] ${budgetSpesifikasi === 8 ? 'line-clamp-8' : 'line-clamp-5'}`}>
                            {p.spesifikasi || 'Spesifikasi standar medis rumah sakit, terdaftar di Kemenkes RI dengan jaminan purna jual & kalibrasi berkala.'}
                          </p>
                        </div>

                        {p.poinJual && p.poinJual.length > 0 && (
                          <div className="shrink-0">
                            <span className="font-bold text-slate-700 text-3xs block uppercase tracking-wide mb-[1mm]">Keunggulan Utama</span>
                            <ul className="space-y-[1mm] text-3xs text-slate-600">
                              {p.poinJual.slice(0, budgetKeunggulan).map((poin, i) => (
                                <li key={i} className="flex items-start gap-1">
                                  <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0 mt-[0.5mm]" />
                                  <span className="leading-[1.4]">{poin}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>

            {/* Footer Halaman */}
            <div className="shrink-0 flex items-center justify-between gap-[6mm] border-t border-slate-200 pt-[3mm] text-3xs text-slate-500">
              <span>PT Anugrah Mitra Selaras • Dokumen Kendali Mutu e-Katalog LKPP</span>
              <span className="shrink-0">Validasi PJT &amp; Tim Komersial</span>
            </div>
          </div>
        );
      })}

      {/* --- BACK COVER (PORTRAIT) --- */}
      {tampilBackCover && (
        <div
          className="a4-page"
          style={{
            backgroundColor: bgBackCoverColor,
            backgroundImage: bgBackCoverImage ? `url(${bgBackCoverImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: bgBackCoverColor === '#ffffff' || bgBackCoverColor.toLowerCase() === '#fff' ? '#0f172a' : '#ffffff'
          }}
        >
          <div className="shrink-0 flex items-center justify-between border-b pb-[4mm] border-current/20">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <div>
                <p className="text-xs font-bold">PT ANUGRAH MITRA SELARAS</p>
                <p className="text-3xs opacity-80">Pusat Distribusi Alat Kesehatan &amp; Bahan Medis Habis Pakai</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded bg-emerald-950 text-emerald-300 text-xs font-bold border border-emerald-800">
              KAPABILITAS NASIONAL
            </span>
          </div>

          <div className="flex-1 min-h-0 flex flex-col justify-center gap-[6mm] py-[6mm] max-w-[150mm]">
            <h2 className="text-3xl font-extrabold tracking-tight leading-[1.25]">
              {judulBackCover}
            </h2>
            <p className="text-xs opacity-90 leading-[1.7]">
              {catatanBackCover}
            </p>

            <div className="grid grid-cols-2 gap-[6mm] pt-[4mm] border-t border-current/20 text-2xs">
              <div>
                <p className="font-bold text-emerald-400 mb-[1.5mm]">Kantor Pusat &amp; Gudang Utama</p>
                <p className="opacity-90 leading-[1.7]">{alamatBackCover}</p>
              </div>
              <div>
                <p className="font-bold text-emerald-400 mb-[1.5mm]">Layanan Pelanggan &amp; e-Katalog</p>
                <p className="opacity-90 leading-[1.7]">{kontakBackCover}</p>
              </div>
            </div>
          </div>

          <div className="shrink-0 pt-[4mm] border-t border-current/20 flex items-center justify-between text-2xs opacity-80">
            <span>© 2026 PT Anugrah Mitra Selaras. All Rights Reserved.</span>
            <span className="text-emerald-400 font-semibold">Standar Mutu CDAKB &amp; ISO 13485:2016</span>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs no-print">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
            Modul Komersial
          </span>
          <span className="text-xs text-slate-500">Penyusunan e-Katalog Internal &amp; Ekspor PDF</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mt-1">
          Penyusun e-Katalog Internal (Format Vertikal A4 • Maks 2 Produk/Halaman)
        </h2>
        <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
          Susun e-Katalog internal kustom khusus format vertikal (Portrait) A4. Sesuaikan halaman depan (cover) dan belakang (back cover) secara manual—termasuk latar belakang warna RGB/Hex dan gambar kustom.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Panel Konfigurasi & Pilihan Produk (Kiri - No Print) */}
        <div className="lg:col-span-5 space-y-4 no-print">
          
          {/* 1. Pengaturan Katalog & Layout */}
          <Panel judul="1. Pengaturan Katalog & Halaman">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Utama Katalog</label>
                <input
                  type="text"
                  value={judulKatalog}
                  onChange={(e) => setJudulKatalog(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sub-judul / Keterangan</label>
                <input
                  type="text"
                  value={subjudulKatalog}
                  onChange={(e) => setSubjudulKatalog(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah Produk per Halaman (Maks. 2)</label>
                <select
                  value={produkPerPage}
                  onChange={(e) => setProdukPerPage(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value={1}>1 Produk / Halaman A4 (Detail Penuh)</option>
                  <option value={2}>2 Produk / Halaman A4 (Standar Katalog)</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tampilCover}
                    onChange={(e) => setTampilCover(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  Sertakan Cover Depan
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tampilBackCover}
                    onChange={(e) => setTampilBackCover(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  Sertakan Back Cover
                </label>
              </div>
            </div>
          </Panel>

          {/* Editor Cover Depan */}
          {tampilCover && (
            <Panel judul="Editor Halaman Depan (Cover)">
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Judul Cover</label>
                  <input
                    type="text"
                    value={judulCover}
                    onChange={(e) => setJudulCover(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subjudul / Perusahaan</label>
                  <input
                    type="text"
                    value={subjudulCover}
                    onChange={(e) => setSubjudulCover(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Penyusun / PJT</label>
                    <input
                      type="text"
                      value={penulisCover}
                      onChange={(e) => setPenulisCover(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Label Badge Atas</label>
                    <input
                      type="text"
                      value={badgeCover}
                      onChange={(e) => setBadgeCover(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                    />
                  </div>
                </div>

                {/* Kustomisasi Latar Belakang (Warna RGB/Hex & Gambar) */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Palette className="w-3.5 h-3.5 text-emerald-600" /> Warna Latar (RGB / Hex)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={bgCoverColor}
                        onChange={(e) => setBgCoverColor(e.target.value)}
                        className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={bgCoverColor}
                        onChange={(e) => setBgCoverColor(e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-slate-300 rounded text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-600" /> URL Gambar Latar (Opsional)
                    </label>
                    <input
                      type="text"
                      value={bgCoverImage}
                      onChange={(e) => setBgCoverImage(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
              </div>
            </Panel>
          )}

          {/* Editor Back Cover */}
          {tampilBackCover && (
            <Panel judul="Editor Halaman Belakang (Back Cover)">
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Judul / Slogan Utama</label>
                  <input
                    type="text"
                    value={judulBackCover}
                    onChange={(e) => setJudulBackCover(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Catatan / Deskripsi Belakang</label>
                  <textarea
                    rows={2}
                    value={catatanBackCover}
                    onChange={(e) => setCatatanBackCover(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs resize-y"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Alamat Kantor Utama</label>
                  <input
                    type="text"
                    value={alamatBackCover}
                    onChange={(e) => setAlamatBackCover(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kontak &amp; Surel</label>
                  <input
                    type="text"
                    value={kontakBackCover}
                    onChange={(e) => setKontakBackCover(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                  />
                </div>

                {/* Kustomisasi Latar Belakang Back Cover */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Palette className="w-3.5 h-3.5 text-emerald-600" /> Warna Latar (RGB / Hex)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={bgBackCoverColor}
                        onChange={(e) => setBgBackCoverColor(e.target.value)}
                        className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={bgBackCoverColor}
                        onChange={(e) => setBgBackCoverColor(e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-slate-300 rounded text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-600" /> URL Gambar Latar
                    </label>
                    <input
                      type="text"
                      value={bgBackCoverImage}
                      onChange={(e) => setBgBackCoverImage(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
              </div>
            </Panel>
          )}

          {/* 2. Pilih Produk */}
          <Panel judul={`2. Pilih Produk (${pilihanId.length} Dipilih)`}>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={pencarian}
                    onChange={(e) => setPencarian(e.target.value)}
                    placeholder="Cari nama alkes atau NIE..."
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <select
                  value={kategoriFilter}
                  onChange={(e) => setKategoriFilter(e.target.value)}
                  className="px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  {daftarKategori.map(kat => (
                    <option key={kat} value={kat}>{kat}</option>
                  ))}
                </select>
              </div>

              {/* Urutan Produk Terpilih */}
              <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-lg p-2 bg-slate-50">
                <p className="text-xs font-bold text-slate-500 uppercase px-1">Urutan Produk dalam Katalog</p>
                {produkTerpilihList.length === 0 ? (
                  <p className="text-xs text-slate-400 p-3 text-center">Belum ada produk dipilih</p>
                ) : (
                  produkTerpilihList.map((p, idx) => (
                    <div key={p.id} className="flex items-center justify-between bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs">
                      <div className="min-w-0 flex-1 pr-2">
                        <span className="font-semibold text-slate-800 truncate block">{idx + 1}. {p.nama}</span>
                        <span className="text-2xs text-slate-400">{p.kategori} • {p.nomorIzinEdar || 'NIE Pending'}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => pindahUrutan(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 text-slate-500 hover:bg-slate-100 rounded disabled:opacity-30"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => pindahUrutan(idx, 1)}
                          disabled={idx === produkTerpilihList.length - 1}
                          className="p-1 text-slate-500 hover:bg-slate-100 rounded disabled:opacity-30"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => togglePilih(p.id)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Master Produk */}
              <div className="max-h-60 overflow-y-auto space-y-1 border border-slate-200 rounded-lg p-2 bg-white">
                <p className="text-xs font-bold text-slate-500 uppercase px-1">Tambah dari Master Katalog</p>
                {produkTersaring.map(p => {
                  const terpilih = pilihanId.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => togglePilih(p.id)}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                        terpilih ? 'bg-emerald-50/60 border-emerald-300' : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-semibold text-slate-900 truncate">{p.nama}</p>
                        <p className="text-2xs text-slate-500">{p.kategori} • {p.produsen || 'AMS'}</p>
                      </div>
                      {terpilih ? <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" /> : <Square className="w-4 h-4 text-slate-300 shrink-0" />}
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500">Estimasi Total Halaman: <strong>{totalHalamanEst} Halaman A4</strong></span>
                <button
                  type="button"
                  onClick={cetakPdf}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Cetak / Ekspor PDF A4
                </button>
              </div>
            </div>
          </Panel>
        </div>

        {/* Panel Pratinjau Tampilan Katalog Profesional (Kanan - Print Ready A4 Portrait) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between no-print">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800">Pratinjau Halaman e-Katalog (Format Vertikal A4 Portrait)</span>
            </div>
            <button
              type="button"
              onClick={cetakPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak / Save PDF
            </button>
          </div>

          {/* Panggung Pratinjau: halaman A4 asli, hanya diperkecil lewat zoom */}
          <div ref={panggungRef} className="w-full min-w-0">
            <div className="a4-panggung" style={{ zoom: skala }}>
              {susunHalaman()}
            </div>
          </div>

          {/* Salinan halaman yang sama, khusus untuk lembar cetak / PDF */}
          {createPortal(<div className="katalog-cetak-root">{susunHalaman()}</div>, document.body)}

          <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5 no-print">
            <p className="flex items-center gap-1.5 font-bold text-slate-800">
              <Info className="w-3.5 h-3.5 text-emerald-600" /> Supaya berkas PDF tersimpan rapi
            </p>
            <p>1. Pada dialog cetak, pilih tujuan <strong>Save as PDF</strong> (nama berkas otomatis <strong>Katalog Elektronik AMS 2026.pdf</strong>).</p>
            <p>2. Setelan: Paper size <strong>A4</strong> • Margins <strong>None</strong> • Scale <strong>100%</strong> • <strong>Background graphics</strong> aktif • Headers and footers mati.</p>
            <p>3. Setiap halaman pratinjau menjadi tepat satu lembar PDF — tidak ada konten yang terpotong atau halaman tambahan.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
