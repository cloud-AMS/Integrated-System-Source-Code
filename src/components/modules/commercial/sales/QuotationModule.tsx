import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Check,
  Copy,
  Download,
  FileText,
  History,
  Image as ImageIcon,
  PackagePlus,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Search,
  Settings2,
  Trash2,
  Upload
} from 'lucide-react';
import { db } from '../../../../services/pocketbase';
import { PelangganB2B, ProdukWebsite, UserRole } from '../../../../types';
import { gabungkanKatalogProduk, selesaikanGambar } from '../../../../utils/website';
import { namaPengguna, peranPengguna } from '../../../layout/Navbar';
import {
  DokumenQuotation,
  IdentitasPerusahaanQuotation,
  ItemQuotation,
  formatRpPdf,
  hitungRingkasanQuotation,
  unduhQuotationPdfA4
} from '../../../../utils/quotationPdf';
import {
  Badge,
  Modal,
  Panel,
  formatRupiah,
  formatTanggal,
  inputClass,
  labelClass,
  tombolPrimer,
  tombolSekunder
} from '../../../ui';

const KUNCI_IDENTITAS_QUOTATION = 'ams_quotation_company_profile';
const KUNCI_RIWAYAT_QUOTATION = 'ams_quotation_history';

interface ProdukSistemOption {
  id: string;
  nama: string;
  tipeModel: string;
  kategori: string;
  nomorIzinEdar: string;
  statusIzinEdar: string;
  produsen: string;
  spesifikasi: string;
  satuan: string;
  hargaReferensi: number;
  sumberHarga: string;
  stokTersedia?: number;
}

function parseHargaNumerik(hargaTayang?: string): number {
  if (!hargaTayang) return 0;
  const angka = hargaTayang.replace(/[^0-9]/g, '');
  if (!angka) return 0;
  const nilai = Number(angka);
  return Number.isFinite(nilai) ? nilai : 0;
}

function buatIdentitasDefault(role: UserRole): IdentitasPerusahaanQuotation {
  const draf = db.getWebsiteDraft();
  try {
    const tersimpan = localStorage.getItem(KUNCI_IDENTITAS_QUOTATION);
    if (tersimpan) {
      const parsed = JSON.parse(tersimpan) as IdentitasPerusahaanQuotation;
      const logoLegacy = !parsed.logoUrl || parsed.logoUrl === '/site/logo-remedi-new-bw.png';
      return {
        ...parsed,
        logoUrl: logoLegacy ? draf.identitas.logoUrl || '' : parsed.logoUrl
      };
    }
  } catch {
    /* ignore */
  }

  const sertifikat = db.getSertifikat();
  const ringkasanSertifikat = sertifikat
    .slice(0, 3)
    .map((s) => `${s.jenis.replace(/\s*\(.*\)$/, '')}: ${s.nomorSertifikat}`)
    .join(' • ');

  return {
    tampilkanLogo: true,
    logoUrl: draf.identitas.logoUrl || '',
    namaPerusahaan: draf.identitas.nama || 'PT ANUGRAHMITRA SELARAS',
    tagline: draf.identitas.tagline || 'Distributor & Produsen Alat Kesehatan Nasional • CDAKB & ISO 13485:2016',
    tampilkanLegalitas: true,
    nomorLegalitas:
      ringkasanSertifikat ||
      'SDAK Kemenkes RI • CPAKB • ISO 13485:2016',
    tampilkanNpwp: true,
    npwp: '02.418.905.3-413.000',
    alamat: draf.kontak.alamatKantor || 'Kawasan Industri Medis Cikarang Blok B-12, Bekasi, Jawa Barat 17530',
    telepon: draf.kontak.telepon || '(021) 8990-2134',
    email: draf.kontak.email || 'pjt@anugrahmitraselaras.co.id',
    website: 'www.anugrahmitraselaras.co.id',
    kotaTandaTangan: 'Bekasi',
    namaPenandatangan: namaPengguna(role).split('-')[0].trim(),
    jabatanPenandatangan: peranPengguna(role),
    warnaAksen: '#0f766e'
  };
}

function buatNomorQuotation(riwayat: DokumenQuotation[]): string {
  const now = new Date();
  const tahun = now.getFullYear();
  const bulan = String(now.getMonth() + 1).padStart(2, '0');
  const urutan = riwayat.length + 1;
  return `QT/AMS/${tahun}/${bulan}/${String(urutan).padStart(3, '0')}`;
}

function tambahHariIso(iso: string, hari: number): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() + hari);
  return d.toISOString().split('T')[0];
}

function bacaRiwayatQuotation(): DokumenQuotation[] {
  try {
    const mentah = localStorage.getItem(KUNCI_RIWAYAT_QUOTATION);
    if (!mentah) return [];
    const parsed = JSON.parse(mentah);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function QuotationModule({
  currentRole,
  pelangganAwal
}: {
  currentRole: UserRole;
  pelangganAwal?: PelangganB2B | null;
}) {
  const pelangganList = useMemo(() => db.getPelangganB2B(), []);
  const skemaHargaList = useMemo(() => db.getSkemaHarga(), []);

  // Gabungkan produk sistem (Izin Edar + Pengetahuan Produk + Stok + Katalog Rujukan + Skema Harga)
  const produkSistem = useMemo<ProdukSistemOption[]>(() => {
    const sumber = {
      izinEdar: db.getIzinEdar(),
      stok: db.getStokGudang(),
      pengetahuanProduk: db.getPengetahuanProduk(),
      skemaHarga: skemaHargaList
    };
    const katalog: ProdukWebsite[] = gabungkanKatalogProduk(sumber);

    return katalog.map((p) => {
      const skemaCocok = skemaHargaList.find(
        (s) =>
          s.status === 'Aktif' &&
          s.namaAlkes.trim().toLowerCase() === p.nama.trim().toLowerCase()
      );
      const hargaDariTayang = parseHargaNumerik(p.hargaTayang);
      const hargaReferensi = skemaCocok?.hargaDasar || hargaDariTayang || 0;
      const sumberHarga = skemaCocok
        ? `Skema Harga (${skemaCocok.level})`
        : hargaDariTayang > 0
          ? 'Referensi Katalog'
          : 'Input Manual';

      return {
        id: p.id,
        nama: p.nama,
        tipeModel: p.tipeModel || '-',
        kategori: p.kategori || 'Alat Kesehatan',
        nomorIzinEdar: p.nomorIzinEdar || 'Dalam Verifikasi',
        statusIzinEdar: p.statusIzinEdar || 'Aktif',
        produsen: p.produsen || 'PT Anugrahmitra Selaras',
        spesifikasi: p.spesifikasi || '',
        satuan: p.satuan || 'Unit',
        hargaReferensi,
        sumberHarga,
        stokTersedia: p.stokTersedia
      };
    });
  }, [skemaHargaList]);

  const [riwayat, setRiwayat] = useState<DokumenQuotation[]>(() => bacaRiwayatQuotation());
  const [identitas, setIdentitas] = useState<IdentitasPerusahaanQuotation>(() =>
    buatIdentitasDefault(currentRole)
  );
  const [subPanelKiri, setSubPanelKiri] = useState<'konten' | 'identitas' | 'riwayat'>('konten');
  const [sedangUnduh, setSedangUnduh] = useState(false);
  const [pesanStatus, setPesanStatus] = useState('');

  const [modalProdukTerbuka, setModalProdukTerbuka] = useState(false);
  const [modalManualTerbuka, setModalManualTerbuka] = useState(false);
  const [formManual, setFormManual] = useState({
    namaProduk: '',
    tipeModel: '',
    nomorIzinEdar: '',
    spesifikasi: '',
    qty: '1',
    satuan: 'Unit',
    hargaSatuan: '',
    diskonPersen: '0'
  });
  const [cariProduk, setCariProduk] = useState('');
  const [filterKategori, setFilterKategori] = useState('Semua');

  // State Quotation Aktif
  const todayIso = new Date().toISOString().split('T')[0];
  const [quotation, setQuotation] = useState<DokumenQuotation>(() => {
    const targetPelanggan = pelangganAwal ?? pelangganList[0];
    const produkAwal = produkSistem[0];
    return {
      id: `QT-${Date.now().toString(36)}`,
      nomorQuotation: buatNomorQuotation(bacaRiwayatQuotation()),
      tanggalTerbit: todayIso,
      berlakuHingga: tambahHariIso(todayIso, 30),
      perihal: 'Penawaran Harga Alat Kesehatan & BMHP',
      jalurPengadaan: 'e-Katalog LKPP',
      pelangganId: targetPelanggan?.id || '',
      namaPenerima: targetPelanggan?.namaInstalasi || 'RSUD Pasar Minggu',
      upPenerima: targetPelanggan?.penanggungJawabPengadaan || 'Pejabat Pembuat Komitmen (PPK)',
      alamatPenerima: targetPelanggan
        ? `${targetPelanggan.provinsi} (${targetPelanggan.rayonDistribusi})`
        : 'Jakarta Selatan',
      teleponPenerima: '',
      emailPenerima: '',
      items: produkAwal
        ? [
            {
              id: `item-${Date.now().toString(36)}`,
              produkId: produkAwal.id,
              namaProduk: produkAwal.nama,
              tipeModel: produkAwal.tipeModel,
              nomorIzinEdar: produkAwal.nomorIzinEdar,
              spesifikasi: produkAwal.spesifikasi,
              qty: 2,
              satuan: produkAwal.satuan,
              hargaSatuan: produkAwal.hargaReferensi || 58500000,
              diskonPersen: 0
            }
          ]
        : [],
      pakaiPpn: true,
      persenPpn: 11,
      diskonGlobalRp: 0,
      biayaLainRp: 0,
      labelBiayaLain: 'Biaya Pengiriman & Instalasi',
      syaratKetentuan:
        '1. Pembayaran TOP 30 Hari setelah Berita Acara Serah Terima (BAST) & Uji Fungsi.\n2. Garansi resmi unit 1 tahun termasuk kalibrasi awal & pelatihan operator.\n3. Seluruh produk dijamin keaslian serta memiliki Izin Edar Kemenkes RI aktif.',
      catatanTambahan: '',
      status: 'Draft',
      dibuatPada: new Date().toISOString()
    };
  });

  // Update penerima bila pelangganAwal berubah (mis. diklik dari modal CRM)
  useEffect(() => {
    if (!pelangganAwal) return;
    setQuotation((prev) => ({
      ...prev,
      pelangganId: pelangganAwal.id,
      namaPenerima: pelangganAwal.namaInstalasi,
      upPenerima: pelangganAwal.penanggungJawabPengadaan,
      alamatPenerima: `${pelangganAwal.provinsi} (${pelangganAwal.rayonDistribusi})`
    }));
    setSubPanelKiri('konten');
  }, [pelangganAwal]);

  const tampilkanInfo = (teks: string) => {
    setPesanStatus(teks);
    window.setTimeout(() => setPesanStatus(''), 3500);
  };

  const ringkasan = useMemo(() => hitungRingkasanQuotation(quotation), [quotation]);

  const kategoriUnik = useMemo(
    () => ['Semua', ...Array.from(new Set(produkSistem.map((p) => p.kategori)))],
    [produkSistem]
  );

  const produkTersaring = useMemo(() => {
    const q = cariProduk.trim().toLowerCase();
    return produkSistem.filter((p) => {
      const matchKat = filterKategori === 'Semua' || p.kategori === filterKategori;
      const matchCari =
        !q ||
        p.nama.toLowerCase().includes(q) ||
        p.tipeModel.toLowerCase().includes(q) ||
        p.nomorIzinEdar.toLowerCase().includes(q) ||
        p.produsen.toLowerCase().includes(q);
      return matchKat && matchCari;
    });
  }, [produkSistem, cariProduk, filterKategori]);

  const pilihPelangganSistem = (pelangganId: string) => {
    const p = pelangganList.find((x) => x.id === pelangganId);
    if (!p) {
      setQuotation((prev) => ({ ...prev, pelangganId: '' }));
      return;
    }
    setQuotation((prev) => ({
      ...prev,
      pelangganId: p.id,
      namaPenerima: p.namaInstalasi,
      upPenerima: p.penanggungJawabPengadaan,
      alamatPenerima: `${p.provinsi} • ${p.rayonDistribusi}`,
      syaratKetentuan: prev.syaratKetentuan.replace(
        /TOP \d+ Hari/i,
        `TOP ${p.termsOfPaymentHari} Hari`
      )
    }));
  };

  const tambahProdukDariSistem = (p: ProdukSistemOption) => {
    const baru: ItemQuotation = {
      id: `item-${Math.random().toString(36).slice(2, 9)}`,
      produkId: p.id,
      namaProduk: p.nama,
      tipeModel: p.tipeModel,
      nomorIzinEdar: p.nomorIzinEdar,
      spesifikasi: p.spesifikasi,
      qty: 1,
      satuan: p.satuan || 'Unit',
      hargaSatuan: p.hargaReferensi,
      diskonPersen: 0
    };
    setQuotation((prev) => ({ ...prev, items: [...prev.items, baru] }));
    tampilkanInfo(`"${p.nama}" ditambahkan ke quotation.`);
  };

  const resetFormManual = () => {
    setFormManual({
      namaProduk: '',
      tipeModel: '',
      nomorIzinEdar: '',
      spesifikasi: '',
      qty: '1',
      satuan: 'Unit',
      hargaSatuan: '',
      diskonPersen: '0'
    });
  };

  const bukaModalManual = () => {
    resetFormManual();
    setModalManualTerbuka(true);
  };

  const simpanProdukManual = (tutupSetelahSimpan: boolean) => {
    const namaBersih = formManual.namaProduk.trim();
    if (!namaBersih) {
      tampilkanInfo('Nama produk wajib diisi sebelum menambahkan baris manual.');
      return;
    }
    const qtyNum = Math.max(1, Number(formManual.qty) || 1);
    const hargaNum = Math.max(0, Number(formManual.hargaSatuan) || 0);
    const diskonNum = Math.min(100, Math.max(0, Number(formManual.diskonPersen) || 0));

    const baru: ItemQuotation = {
      id: `item-${Math.random().toString(36).slice(2, 9)}`,
      namaProduk: namaBersih,
      tipeModel: formManual.tipeModel.trim() || '-',
      nomorIzinEdar: formManual.nomorIzinEdar.trim() || '-',
      spesifikasi: formManual.spesifikasi.trim(),
      qty: qtyNum,
      satuan: formManual.satuan.trim() || 'Unit',
      hargaSatuan: hargaNum,
      diskonPersen: diskonNum
    };
    setQuotation((prev) => ({ ...prev, items: [...prev.items, baru] }));
    tampilkanInfo(`Produk manual "${namaBersih}" ditambahkan ke quotation.`);
    resetFormManual();
    if (tutupSetelahSimpan) {
      setModalManualTerbuka(false);
    }
  };

  const ubahItem = (id: string, patch: Partial<ItemQuotation>) => {
    setQuotation((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === id ? { ...it, ...patch } : it))
    }));
  };

  const hapusItem = (id: string) => {
    setQuotation((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.id !== id)
    }));
  };

  const unggahLogoPerusahaan = async (file?: File) => {
    if (!file) return;
    try {
      const asal = await new Promise<string>((selesai, gagal) => {
        const reader = new FileReader();
        reader.onload = () => selesai(String(reader.result));
        reader.onerror = () => gagal(new Error('gagal membaca berkas'));
        reader.readAsDataURL(file);
      });
      const dataUrl = await new Promise<string>((selesai) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 600;
          const skala = Math.min(1, maxDim / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
          const kanvas = document.createElement('canvas');
          kanvas.width = Math.max(1, Math.round((img.naturalWidth || maxDim) * skala));
          kanvas.height = Math.max(1, Math.round((img.naturalHeight || maxDim) * skala));
          const ctx = kanvas.getContext('2d');
          if (!ctx) {
            selesai(asal);
            return;
          }
          ctx.drawImage(img, 0, 0, kanvas.width, kanvas.height);
          selesai(kanvas.toDataURL('image/png'));
        };
        img.onerror = () => selesai(asal);
        img.src = asal;
      });
      setIdentitas((prev) => ({ ...prev, logoUrl: dataUrl, tampilkanLogo: true }));
      tampilkanInfo('Logo perusahaan berhasil dimuat.');
    } catch {
      tampilkanInfo('Gagal mengolah file logo. Gunakan PNG/JPG/SVG.');
    }
  };

  const simpanIdentitasDefault = () => {
    try {
      localStorage.setItem(KUNCI_IDENTITAS_QUOTATION, JSON.stringify(identitas));
      tampilkanInfo('Identitas perusahaan untuk quotation disimpan sebagai default.');
    } catch {
      tampilkanInfo('Gagal menyimpan identitas ke penyimpanan lokal.');
    }
  };

  const resetIdentitasDariCms = () => {
    try {
      localStorage.removeItem(KUNCI_IDENTITAS_QUOTATION);
    } catch {
      /* ignore */
    }
    setIdentitas(buatIdentitasDefault(currentRole));
    tampilkanInfo('Identitas dikembalikan sesuai profil Website CMS & Sertifikat.');
  };

  const simpanKeRiwayat = (statusBaru?: DokumenQuotation['status']) => {
    const dokumenSimpan: DokumenQuotation = {
      ...quotation,
      status: statusBaru ?? quotation.status,
      dibuatPada: new Date().toISOString()
    };
    const ada = riwayat.some((r) => r.id === dokumenSimpan.id);
    const baru = ada
      ? riwayat.map((r) => (r.id === dokumenSimpan.id ? dokumenSimpan : r))
      : [dokumenSimpan, ...riwayat];
    setRiwayat(baru);
    setQuotation(dokumenSimpan);
    try {
      localStorage.setItem(KUNCI_RIWAYAT_QUOTATION, JSON.stringify(baru));
    } catch {
      /* ignore */
    }
    db.logAudit(
      'CRM Marketing — Quotation',
      ada ? 'Pembaruan dokumen quotation' : 'Penerbitan dokumen quotation baru',
      `${dokumenSimpan.nomorQuotation} (${dokumenSimpan.namaPenerima}) — ${formatRupiah(ringkasan.total)}`,
      namaPengguna(currentRole),
      'Sales & Marketing'
    );
    tampilkanInfo(`Quotation ${dokumenSimpan.nomorQuotation} tersimpan.`);
  };

  const buatQuotationBaru = () => {
    const tgl = new Date().toISOString().split('T')[0];
    setQuotation((prev) => ({
      ...prev,
      id: `QT-${Date.now().toString(36)}`,
      nomorQuotation: buatNomorQuotation(riwayat),
      tanggalTerbit: tgl,
      berlakuHingga: tambahHariIso(tgl, 30),
      status: 'Draft',
      dibuatPada: new Date().toISOString()
    }));
    tampilkanInfo('Formulir quotation baru disiapkan.');
  };

  const tanganiDownloadPdf = async () => {
    setSedangUnduh(true);
    try {
      const resolvedLogo = selesaikanGambar(identitas.logoUrl);
      await unduhQuotationPdfA4(quotation, identitas, resolvedLogo);
      simpanKeRiwayat(quotation.status === 'Draft' ? 'Terkirim' : quotation.status);
      tampilkanInfo(`PDF A4 "${quotation.nomorQuotation}.pdf" berhasil diunduh.`);
    } catch (err) {
      console.error(err);
      tampilkanInfo('Gagal membuat file PDF. Coba gunakan tombol Cetak / Print A4.');
    } finally {
      setSedangUnduh(false);
    }
  };

  const logoPreviewUrl = selesaikanGambar(identitas.logoUrl);

  return (
    <div className="space-y-5">
      {/* Banner Modul Quotation */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
              CRM Marketing
            </span>
            <span className="text-xs text-slate-500">Surat Penawaran Harga Resmi • Format A4 PDF</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            Penerbitan Quotation (Penawaran Harga B2B &amp; e-Katalog)
          </h2>
          <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
            Pilih penerima dari daftar pelanggan CRM, tambahkan produk langsung dari katalog sistem (terintegrasi Nomor Izin Edar &amp; Skema Harga), atur identitas perusahaan pada kop surat, lalu unduh sebagai file PDF A4.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button type="button" onClick={() => simpanKeRiwayat()} className={tombolSekunder}>
            <Save className="w-3.5 h-3.5" />
            Simpan Draft
          </button>
          <button type="button" onClick={() => window.print()} className={tombolSekunder}>
            <Printer className="w-3.5 h-3.5" />
            Cetak / Print
          </button>
          <button
            type="button"
            onClick={() => void tanganiDownloadPdf()}
            disabled={sedangUnduh}
            className={tombolPrimer}
          >
            <Download className="w-3.5 h-3.5" />
            {sedangUnduh ? 'Menyusun PDF…' : 'Download PDF A4'}
          </button>
        </div>
      </div>

      {pesanStatus && (
        <div className="no-print bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{pesanStatus}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* KOLOM KIRI: Editor Quotation, Identitas Perusahaan, & Riwayat (No Print) */}
        <div className="xl:col-span-5 space-y-4 no-print">
          {/* Navigasi Sub-panel Editor */}
          <div className="bg-white p-1.5 rounded-xl border border-slate-200 grid grid-cols-3 gap-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSubPanelKiri('konten')}
              className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                subPanelKiri === 'konten' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Isi &amp; Produk
            </button>
            <button
              type="button"
              onClick={() => setSubPanelKiri('identitas')}
              className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                subPanelKiri === 'identitas' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Identitas Kop
            </button>
            <button
              type="button"
              onClick={() => setSubPanelKiri('riwayat')}
              className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                subPanelKiri === 'riwayat' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Riwayat ({riwayat.length})
            </button>
          </div>

          {subPanelKiri === 'konten' && (
            <>
              {/* Panel Detail Dokumen & Penerima */}
              <Panel
                judul="1. Informasi Dokumen & Penerima"
                aksi={
                  <button
                    type="button"
                    onClick={buatQuotationBaru}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Buat Baru
                  </button>
                }
              >
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Nomor Quotation</label>
                      <input
                        type="text"
                        value={quotation.nomorQuotation}
                        onChange={(e) => setQuotation({ ...quotation, nomorQuotation: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Jalur Pengadaan</label>
                      <select
                        value={quotation.jalurPengadaan}
                        onChange={(e) => setQuotation({ ...quotation, jalurPengadaan: e.target.value })}
                        className={inputClass}
                      >
                        <option value="e-Katalog LKPP">e-Katalog LKPP</option>
                        <option value="Tender LPSE">Tender Terbuka LPSE</option>
                        <option value="Pembelian Langsung B2B">Pembelian Langsung RS / B2B</option>
                        <option value="Klinik & Laboratorium">Klinik &amp; Laboratorium</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Tanggal Terbit</label>
                      <input
                        type="date"
                        value={quotation.tanggalTerbit}
                        onChange={(e) => setQuotation({ ...quotation, tanggalTerbit: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Berlaku Hingga</label>
                      <input
                        type="date"
                        value={quotation.berlakuHingga}
                        onChange={(e) => setQuotation({ ...quotation, berlakuHingga: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Perihal Penawaran</label>
                    <input
                      type="text"
                      value={quotation.perihal}
                      onChange={(e) => setQuotation({ ...quotation, perihal: e.target.value })}
                      className={inputClass}
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-2.5">
                    <div>
                      <label className={labelClass}>Ambil dari Pelanggan CRM B2B</label>
                      <select
                        value={quotation.pelangganId || ''}
                        onChange={(e) => pilihPelangganSistem(e.target.value)}
                        className={inputClass}
                      >
                        <option value="">-- Input Penerima Manual --</option>
                        {pelangganList.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.namaInstalasi} ({p.kodePelanggan} • {p.provinsi})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className={labelClass}>Nama Instansi / Penerima</label>
                        <input
                          type="text"
                          value={quotation.namaPenerima}
                          onChange={(e) => setQuotation({ ...quotation, namaPenerima: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Up / Pejabat Pengadaan</label>
                        <input
                          type="text"
                          value={quotation.upPenerima}
                          onChange={(e) => setQuotation({ ...quotation, upPenerima: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Alamat Penerima</label>
                      <textarea
                        rows={2}
                        value={quotation.alamatPenerima}
                        onChange={(e) => setQuotation({ ...quotation, alamatPenerima: e.target.value })}
                        className={inputClass}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className={labelClass}>Telepon Penerima (Opsional)</label>
                        <input
                          type="text"
                          value={quotation.teleponPenerima}
                          onChange={(e) => setQuotation({ ...quotation, teleponPenerima: e.target.value })}
                          placeholder="(021) ..."
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Email Penerima (Opsional)</label>
                        <input
                          type="email"
                          value={quotation.emailPenerima}
                          onChange={(e) => setQuotation({ ...quotation, emailPenerima: e.target.value })}
                          placeholder="pengadaan@rs..."
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>

              {/* Panel Item Produk Quotation */}
              <Panel
                judul={`2. Daftar Produk Penawaran (${quotation.items.length})`}
                aksi={
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={bukaModalManual}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-[11px] font-semibold text-slate-700 hover:bg-slate-100 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Input Manual
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalProdukTerbuka(true)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <PackagePlus className="w-3.5 h-3.5" />
                      Pilih Produk Sistem
                    </button>
                  </div>
                }
              >
                <div className="space-y-3">
                  {quotation.items.length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-slate-300 rounded-xl bg-slate-50">
                      <p className="text-xs font-semibold text-slate-700 mb-1">
                        Belum ada produk dalam quotation ini.
                      </p>
                      <p className="text-[11px] text-slate-500 mb-3">
                        Pilih alat kesehatan dari katalog sistem atau input produk/jasa secara manual.
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={bukaModalManual}
                          className={tombolSekunder}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Input Produk Manual
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalProdukTerbuka(true)}
                          className={tombolPrimer}
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                          Pilih Produk dari Sistem
                        </button>
                      </div>
                    </div>
                  ) : (
                    quotation.items.map((item, idx) => {
                      const subtotalBaris = Math.round(
                        item.qty * item.hargaSatuan * (1 - (item.diskonPersen || 0) / 100)
                      );
                      return (
                        <div key={item.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                Item #{idx + 1}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                                  item.produkId
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}
                              >
                                {item.produkId ? 'Produk Sistem' : 'Input Manual'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold font-mono text-slate-800">
                                {formatRupiah(subtotalBaris)}
                              </span>
                              <button
                                type="button"
                                onClick={() => hapusItem(item.id)}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                title="Hapus baris"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className={labelClass}>Nama Produk / Jasa</label>
                            <input
                              type="text"
                              value={item.namaProduk}
                              onChange={(e) => ubahItem(item.id, { namaProduk: e.target.value })}
                              placeholder="Contoh: Patient Monitor 5 Parameter / Jasa Kalibrasi"
                              className={inputClass}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className={labelClass}>Tipe / Model</label>
                              <input
                                type="text"
                                value={item.tipeModel}
                                onChange={(e) => ubahItem(item.id, { tipeModel: e.target.value })}
                                placeholder="-"
                                className={inputClass}
                              />
                            </div>
                            <div>
                              <label className={labelClass}>Nomor Izin Edar (NIE)</label>
                              <input
                                type="text"
                                value={item.nomorIzinEdar}
                                onChange={(e) => ubahItem(item.id, { nomorIzinEdar: e.target.value })}
                                placeholder="-"
                                className={inputClass}
                              />
                            </div>
                          </div>

                          <div>
                            <label className={labelClass}>Spesifikasi Ringkas</label>
                            <textarea
                              rows={2}
                              value={item.spesifikasi}
                              onChange={(e) => ubahItem(item.id, { spesifikasi: e.target.value })}
                              placeholder="Spesifikasi teknis, garansi, atau keterangan tambahan..."
                              className={inputClass}
                            />
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div>
                              <label className={labelClass}>Qty</label>
                              <input
                                type="number"
                                min={1}
                                value={item.qty}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  ubahItem(item.id, { qty: val === '' ? 1 : Math.max(1, Number(val) || 1) });
                                }}
                                className={inputClass}
                              />
                            </div>
                            <div>
                              <label className={labelClass}>Satuan</label>
                              <input
                                type="text"
                                list="daftar-satuan-quotation"
                                value={item.satuan}
                                onChange={(e) => ubahItem(item.id, { satuan: e.target.value })}
                                className={inputClass}
                              />
                            </div>
                            <div>
                              <label className={labelClass}>Harga (Rp)</label>
                              <input
                                type="number"
                                min={0}
                                value={item.hargaSatuan}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  ubahItem(item.id, { hargaSatuan: val === '' ? 0 : Math.max(0, Number(val) || 0) });
                                }}
                                className={inputClass}
                              />
                            </div>
                            <div>
                              <label className={labelClass}>Diskon %</label>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={item.diskonPersen}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  ubahItem(item.id, {
                                    diskonPersen: val === '' ? 0 : Math.min(100, Math.max(0, Number(val) || 0))
                                  });
                                }}
                                className={inputClass}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <datalist id="daftar-satuan-quotation">
                    <option value="Unit" />
                    <option value="Set" />
                    <option value="Box" />
                    <option value="Pcs" />
                    <option value="Paket" />
                    <option value="Botol" />
                    <option value="Roll" />
                  </datalist>
                </div>
              </Panel>

              {/* Panel Pajak, Biaya & Syarat Ketentuan */}
              <Panel judul="3. Perhitungan Pajak, Biaya & Ketentuan">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={quotation.pakaiPpn}
                        onChange={(e) => setQuotation({ ...quotation, pakaiPpn: e.target.checked })}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      Sertakan PPN
                    </label>
                    {quotation.pakaiPpn && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500">Tarif (%):</span>
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={quotation.persenPpn}
                          onChange={(e) => setQuotation({ ...quotation, persenPpn: Number(e.target.value) || 11 })}
                          className="w-16 px-2 py-1 border border-slate-300 rounded text-xs bg-white text-right"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className={labelClass}>Diskon Tambahan (Rp)</label>
                      <input
                        type="number"
                        min={0}
                        value={quotation.diskonGlobalRp}
                        onChange={(e) =>
                          setQuotation({ ...quotation, diskonGlobalRp: Math.max(0, Number(e.target.value) || 0) })
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Biaya Kirim / Instalasi (Rp)</label>
                      <input
                        type="number"
                        min={0}
                        value={quotation.biayaLainRp}
                        onChange={(e) =>
                          setQuotation({ ...quotation, biayaLainRp: Math.max(0, Number(e.target.value) || 0) })
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Label Biaya Tambahan</label>
                    <input
                      type="text"
                      value={quotation.labelBiayaLain}
                      onChange={(e) => setQuotation({ ...quotation, labelBiayaLain: e.target.value })}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Syarat &amp; Ketentuan Penawaran</label>
                    <textarea
                      rows={4}
                      value={quotation.syaratKetentuan}
                      onChange={(e) => setQuotation({ ...quotation, syaratKetentuan: e.target.value })}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Catatan Tambahan (Opsional)</label>
                    <textarea
                      rows={2}
                      value={quotation.catatanTambahan}
                      onChange={(e) => setQuotation({ ...quotation, catatanTambahan: e.target.value })}
                      placeholder="Contoh: Harga mengacu pada tayangan e-Katalog LKPP V6..."
                      className={inputClass}
                    />
                  </div>
                </div>
              </Panel>
            </>
          )}

          {subPanelKiri === 'identitas' && (
            <Panel
              judul="Pengaturan Identitas Perusahaan pada Quotation"
              keterangan="Atur logo, nama perusahaan, legalitas, alamat, kontak, dan penandatangan yang ditampilkan di kop surat & kaki dokumen PDF."
              aksi={
                <button
                  type="button"
                  onClick={resetIdentitasDariCms}
                  className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset dari CMS
                </button>
              }
            >
              <div className="space-y-3.5">
                {/* Logo Perusahaan */}
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={identitas.tampilkanLogo}
                        onChange={(e) => setIdentitas({ ...identitas, tampilkanLogo: e.target.checked })}
                        className="rounded text-emerald-600"
                      />
                      Tampilkan Logo Perusahaan
                    </label>
                    <label className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 inline-flex items-center gap-1.5 cursor-pointer">
                      <Upload className="w-3 h-3" />
                      Unggah Logo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => void unggahLogoPerusahaan(e.target.files?.[0])}
                      />
                    </label>
                  </div>

                  {identitas.tampilkanLogo && (
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-12 rounded-lg border border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0">
                        {logoPreviewUrl ? (
                          <img src={logoPreviewUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                      <input
                        type="text"
                        value={identitas.logoUrl?.startsWith('media:') ? '' : identitas.logoUrl || ''}
                        onChange={(e) => setIdentitas({ ...identitas, logoUrl: e.target.value })}
                        placeholder="atau tempel URL logo https://..."
                        className={inputClass}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Nama Perusahaan</label>
                    <input
                      type="text"
                      value={identitas.namaPerusahaan}
                      onChange={(e) => setIdentitas({ ...identitas, namaPerusahaan: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Tagline / Keterangan Singkat</label>
                    <input
                      type="text"
                      value={identitas.tagline}
                      onChange={(e) => setIdentitas({ ...identitas, tagline: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Alamat Kantor / Gudang</label>
                    <textarea
                      rows={2}
                      value={identitas.alamat}
                      onChange={(e) => setIdentitas({ ...identitas, alamat: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Telepon</label>
                    <input
                      type="text"
                      value={identitas.telepon}
                      onChange={(e) => setIdentitas({ ...identitas, telepon: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Surel / Email</label>
                    <input
                      type="text"
                      value={identitas.email}
                      onChange={(e) => setIdentitas({ ...identitas, email: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Website</label>
                    <input
                      type="text"
                      value={identitas.website}
                      onChange={(e) => setIdentitas({ ...identitas, website: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Warna Aksen Dokumen</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={identitas.warnaAksen}
                        onChange={(e) => setIdentitas({ ...identitas, warnaAksen: e.target.value })}
                        className="w-9 h-8 rounded border border-slate-300 cursor-pointer p-0.5 bg-white"
                      />
                      {['#0f766e', '#0078b5', '#1e293b', '#047857'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setIdentitas({ ...identitas, warnaAksen: c })}
                          className="w-6 h-6 rounded-full border border-slate-300 cursor-pointer"
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Legalitas & NPWP */}
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={identitas.tampilkanLegalitas}
                      onChange={(e) => setIdentitas({ ...identitas, tampilkanLegalitas: e.target.checked })}
                      className="rounded text-emerald-600"
                    />
                    Tampilkan Nomor Izin SDAK / CPAKB / ISO
                  </label>
                  {identitas.tampilkanLegalitas && (
                    <input
                      type="text"
                      value={identitas.nomorLegalitas}
                      onChange={(e) => setIdentitas({ ...identitas, nomorLegalitas: e.target.value })}
                      className={inputClass}
                    />
                  )}

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={identitas.tampilkanNpwp}
                      onChange={(e) => setIdentitas({ ...identitas, tampilkanNpwp: e.target.checked })}
                      className="rounded text-emerald-600"
                    />
                    Tampilkan NPWP Perusahaan
                  </label>
                  {identitas.tampilkanNpwp && (
                    <input
                      type="text"
                      value={identitas.npwp}
                      onChange={(e) => setIdentitas({ ...identitas, npwp: e.target.value })}
                      className={inputClass}
                    />
                  )}
                </div>

                {/* Penandatangan */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
                  <div>
                    <label className={labelClass}>Kota Tanda Tangan</label>
                    <input
                      type="text"
                      value={identitas.kotaTandaTangan}
                      onChange={(e) => setIdentitas({ ...identitas, kotaTandaTangan: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Nama Penandatangan</label>
                    <input
                      type="text"
                      value={identitas.namaPenandatangan}
                      onChange={(e) => setIdentitas({ ...identitas, namaPenandatangan: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Jabatan</label>
                    <input
                      type="text"
                      value={identitas.jabatanPenandatangan}
                      onChange={(e) => setIdentitas({ ...identitas, jabatanPenandatangan: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={simpanIdentitasDefault}
                  className={`${tombolPrimer} w-full justify-center`}
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  Simpan Identitas sebagai Default
                </button>
              </div>
            </Panel>
          )}

          {subPanelKiri === 'riwayat' && (
            <Panel
              judul="Riwayat Quotation Tersimpan"
              keterangan="Klik Muat untuk menyunting atau mengunduh ulang PDF A4 dari quotation yang pernah diterbitkan."
            >
              <div className="space-y-2.5">
                {riwayat.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">
                    Belum ada quotation yang disimpan atau diunduh.
                  </p>
                ) : (
                  riwayat.map((q) => {
                    const tot = hitungRingkasanQuotation(q).total;
                    return (
                      <div
                        key={q.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 font-mono">{q.nomorQuotation}</span>
                            <Badge tone={q.status === 'Disetujui' ? 'emerald' : q.status === 'Terkirim' ? 'blue' : 'slate'}>
                              {q.status}
                            </Badge>
                          </div>
                          <p className="font-semibold text-slate-700 truncate mt-0.5">{q.namaPenerima}</p>
                          <p className="text-[10px] text-slate-500">
                            {formatTanggal(q.tanggalTerbit)} • {q.items.length} item •{' '}
                            <strong className="text-slate-800">{formatRupiah(tot)}</strong>
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setQuotation(q);
                              setSubPanelKiri('konten');
                              tampilkanInfo(`Quotation ${q.nomorQuotation} dimuat ke editor.`);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                          >
                            Muat
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const salin: DokumenQuotation = {
                                ...JSON.parse(JSON.stringify(q)),
                                id: `QT-${Date.now().toString(36)}`,
                                nomorQuotation: buatNomorQuotation(riwayat),
                                status: 'Draft'
                              };
                              setQuotation(salin);
                              setSubPanelKiri('konten');
                              tampilkanInfo(`Salinan baru dibuat dari ${q.nomorQuotation}.`);
                            }}
                            className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 cursor-pointer"
                            title="Duplikat"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const sisa = riwayat.filter((x) => x.id !== q.id);
                              setRiwayat(sisa);
                              try {
                                localStorage.setItem(KUNCI_RIWAYAT_QUOTATION, JSON.stringify(sisa));
                              } catch {
                                /* ignore */
                              }
                            }}
                            className="p-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Panel>
          )}
        </div>

        {/* KOLOM KANAN: Pratinjau Kertas A4 Portrait (Print Ready) */}
        <div className="xl:col-span-7 space-y-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 no-print">
            <div className="flex items-center gap-2 text-xs">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-slate-800">Pratinjau Dokumen A4 Portrait</span>
              <span className="text-slate-400">• 210 × 297 mm</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">
                Total: <span className="text-emerald-700">{formatRupiah(ringkasan.total)}</span>
              </span>
              <button
                type="button"
                onClick={() => void tanganiDownloadPdf()}
                disabled={sedangUnduh}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                {sedangUnduh ? 'Menyusun…' : 'Download PDF A4'}
              </button>
            </div>
          </div>

          {/* Kertas A4 Preview */}
          <div className="flex justify-center print:block">
            <div className="w-full max-w-[740px] min-h-[1046px] bg-white border border-slate-300 rounded-xl shadow-md p-6 sm:p-10 flex flex-col justify-between text-[11px] text-slate-900 print:max-w-none print:w-full print:min-h-0 print:border-none print:shadow-none print:p-2">
              <div className="space-y-5">
                {/* KOP SURAT PERUSAHAAN */}
                <div
                  className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b-2"
                  style={{ borderColor: identitas.warnaAksen }}
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {identitas.tampilkanLogo && logoPreviewUrl && (
                      <img
                        src={logoPreviewUrl}
                        alt={identitas.namaPerusahaan}
                        className="h-14 max-w-[130px] object-contain shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <h1 className="text-base font-extrabold tracking-wide uppercase text-slate-900 leading-tight">
                        {identitas.namaPerusahaan || 'PT ANUGRAHMITRA SELARAS'}
                      </h1>
                      {identitas.tagline && (
                        <p className="text-[11px] font-bold mt-0.5" style={{ color: identitas.warnaAksen }}>
                          {identitas.tagline}
                        </p>
                      )}
                      {identitas.alamat && (
                        <p className="text-[10px] text-slate-600 mt-1 leading-snug">{identitas.alamat}</p>
                      )}
                      <p className="text-[10px] text-slate-600 mt-0.5">
                        {[
                          identitas.telepon ? `Telp: ${identitas.telepon}` : '',
                          identitas.email ? `Email: ${identitas.email}` : '',
                          identitas.website ? `Web: ${identitas.website}` : ''
                        ]
                          .filter(Boolean)
                          .join(' • ')}
                      </p>
                      {identitas.tampilkanLegalitas && identitas.nomorLegalitas && (
                        <p className="text-[9.5px] font-semibold text-slate-700 mt-1">{identitas.nomorLegalitas}</p>
                      )}
                      {identitas.tampilkanNpwp && identitas.npwp && (
                        <p className="text-[9.5px] text-slate-500">NPWP: {identitas.npwp}</p>
                      )}
                    </div>
                  </div>

                  <div
                    className="px-5 py-2.5 rounded-lg text-white text-center shrink-0 self-start"
                    style={{ backgroundColor: identitas.warnaAksen }}
                  >
                    <p className="text-sm font-extrabold tracking-widest">QUOTATION</p>
                    <p className="text-[9.5px] opacity-90">SURAT PENAWARAN HARGA</p>
                  </div>
                </div>

                {/* BLOK KEPADA YTH & DETAIL QUOTATION */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <p className="text-[9.5px] font-bold uppercase tracking-wider" style={{ color: identitas.warnaAksen }}>
                      Kepada Yth. (Penerima Penawaran)
                    </p>
                    <p className="text-xs font-extrabold text-slate-900">{quotation.namaPenerima || '-'}</p>
                    {quotation.upPenerima && (
                      <p className="text-[10.5px] text-slate-700">Up: {quotation.upPenerima}</p>
                    )}
                    <p className="text-[10px] text-slate-600 leading-relaxed whitespace-pre-line">
                      {quotation.alamatPenerima || '-'}
                    </p>
                    {(quotation.teleponPenerima || quotation.emailPenerima) && (
                      <p className="text-[9.5px] text-slate-500 pt-0.5">
                        {[quotation.teleponPenerima, quotation.emailPenerima].filter(Boolean).join(' • ')}
                      </p>
                    )}
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                    <p className="text-[9.5px] font-bold uppercase tracking-wider" style={{ color: identitas.warnaAksen }}>
                      Detail Dokumen Penawaran
                    </p>
                    <div className="grid grid-cols-[105px_1fr] gap-y-1 text-[10px]">
                      <span className="text-slate-500">No. Quotation</span>
                      <span className="font-bold font-mono text-slate-900">{quotation.nomorQuotation}</span>
                      <span className="text-slate-500">Tanggal Terbit</span>
                      <span className="font-semibold text-slate-900">{formatTanggal(quotation.tanggalTerbit)}</span>
                      <span className="text-slate-500">Berlaku Hingga</span>
                      <span className="font-semibold text-slate-900">{formatTanggal(quotation.berlakuHingga)}</span>
                      <span className="text-slate-500">Jalur Pengadaan</span>
                      <span className="font-semibold text-slate-900">{quotation.jalurPengadaan}</span>
                      <span className="text-slate-500">Perihal</span>
                      <span className="font-semibold text-slate-900">{quotation.perihal}</span>
                    </div>
                  </div>
                </div>

                {/* TABEL ITEM PRODUK */}
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="text-white" style={{ backgroundColor: identitas.warnaAksen }}>
                        <th className="py-2 px-2.5 text-center w-8">No</th>
                        <th className="py-2 px-2.5">Nama Produk / Tipe / Nomor Izin Edar</th>
                        <th className="py-2 px-2.5 text-center w-16">Qty</th>
                        <th className="py-2 px-2.5 text-right w-28">Harga Satuan</th>
                        <th className="py-2 px-2.5 text-center w-14">Diskon</th>
                        <th className="py-2 px-2.5 text-right w-32">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {quotation.items.map((item, idx) => {
                        const subBaris = Math.round(
                          item.qty * item.hargaSatuan * (1 - (item.diskonPersen || 0) / 100)
                        );
                        return (
                          <tr key={item.id} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                            <td className="py-2.5 px-2.5 text-center text-slate-500 align-top">{idx + 1}</td>
                            <td className="py-2.5 px-2.5 align-top">
                              <p className="font-bold text-slate-900 text-[10.5px]">{item.namaProduk}</p>
                              <p className="text-[9.5px] font-semibold mt-0.5" style={{ color: identitas.warnaAksen }}>
                                {[
                                  item.tipeModel && item.tipeModel !== '-' ? `Tipe: ${item.tipeModel}` : '',
                                  item.nomorIzinEdar && item.nomorIzinEdar !== '-' ? `NIE: ${item.nomorIzinEdar}` : ''
                                ]
                                  .filter(Boolean)
                                  .join('  |  ')}
                              </p>
                              {item.spesifikasi && (
                                <p className="text-[9.5px] text-slate-500 mt-0.5 leading-snug line-clamp-3">
                                  {item.spesifikasi}
                                </p>
                              )}
                            </td>
                            <td className="py-2.5 px-2.5 text-center font-semibold align-top whitespace-nowrap">
                              {item.qty} {item.satuan}
                            </td>
                            <td className="py-2.5 px-2.5 text-right font-mono align-top whitespace-nowrap">
                              {formatRpPdf(item.hargaSatuan)}
                            </td>
                            <td className="py-2.5 px-2.5 text-center align-top">
                              {item.diskonPersen ? `${item.diskonPersen}%` : '-'}
                            </td>
                            <td className="py-2.5 px-2.5 text-right font-bold font-mono text-slate-900 align-top whitespace-nowrap">
                              {formatRpPdf(subBaris)}
                            </td>
                          </tr>
                        );
                      })}
                      {quotation.items.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                            Belum ada produk dipilih. Klik "Pilih Produk Sistem" pada panel editor.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* RINGKASAN & SYARAT KETENTUAN */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 pt-2">
                  <div className="sm:col-span-7 space-y-2.5">
                    <div>
                      <p className="font-bold text-[10px] text-slate-900 uppercase tracking-wide mb-1">
                        Syarat &amp; Ketentuan Penawaran:
                      </p>
                      <p className="text-[10px] text-slate-600 leading-relaxed whitespace-pre-line">
                        {quotation.syaratKetentuan}
                      </p>
                    </div>
                    {quotation.catatanTambahan && (
                      <div>
                        <p className="font-bold text-[10px] text-slate-800">Catatan Tambahan:</p>
                        <p className="text-[10px] text-slate-600 leading-relaxed whitespace-pre-line">
                          {quotation.catatanTambahan}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-5 space-y-1.5 text-[10.5px]">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span className="font-mono font-semibold">{formatRpPdf(ringkasan.subtotal)}</span>
                    </div>
                    {ringkasan.diskonGlobal > 0 && (
                      <div className="flex justify-between text-rose-700">
                        <span>Diskon Tambahan</span>
                        <span className="font-mono font-semibold">- {formatRpPdf(ringkasan.diskonGlobal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span>Dasar Pengenaan Pajak (DPP)</span>
                      <span className="font-mono font-semibold">{formatRpPdf(ringkasan.dpp)}</span>
                    </div>
                    {quotation.pakaiPpn && (
                      <div className="flex justify-between text-slate-600">
                        <span>PPN ({quotation.persenPpn || 11}%)</span>
                        <span className="font-mono font-semibold">{formatRpPdf(ringkasan.ppn)}</span>
                      </div>
                    )}
                    {ringkasan.biayaLain > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>{quotation.labelBiayaLain || 'Biaya Lain'}</span>
                        <span className="font-mono font-semibold">{formatRpPdf(ringkasan.biayaLain)}</span>
                      </div>
                    )}
                    <div
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg text-white font-bold mt-2"
                      style={{ backgroundColor: identitas.warnaAksen }}
                    >
                      <span className="text-[10.5px]">TOTAL PENAWARAN</span>
                      <span className="font-mono text-xs">{formatRpPdf(ringkasan.total)}</span>
                    </div>
                  </div>
                </div>

                {/* BLOK TANDA TANGAN */}
                <div className="grid grid-cols-2 gap-8 pt-6 text-[10.5px]">
                  <div>
                    <p className="text-slate-600">Persetujuan / Konfirmasi Pemesan,</p>
                    <p className="font-bold text-slate-900 mt-0.5">{quotation.namaPenerima || 'Pihak Pemesan'}</p>
                    <div className="h-16 border-b border-slate-300 w-48" />
                    <p className="font-bold text-slate-900 mt-1.5">
                      {quotation.upPenerima || '( Nama & Stempel Instansi )'}
                    </p>
                    <p className="text-[9.5px] text-slate-500">Pejabat Pengadaan / Penerima</p>
                  </div>

                  <div className="flex flex-col items-end text-right">
                    <div>
                      <p className="text-slate-600">
                        {identitas.kotaTandaTangan || 'Bekasi'}, {formatTanggal(quotation.tanggalTerbit)}
                      </p>
                      <p className="font-bold text-slate-900 mt-0.5">{identitas.namaPerusahaan}</p>
                      <div className="h-16 border-b border-slate-300 w-48 ml-auto" />
                      <p className="font-bold text-slate-900 mt-1.5">{identitas.namaPenandatangan}</p>
                      <p className="text-[9.5px] text-slate-500">{identitas.jabatanPenandatangan}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER HALAMAN */}
              <div className="pt-4 mt-8 border-t border-slate-200 flex items-center justify-between text-[9.5px] text-slate-500">
                <span>
                  {identitas.namaPerusahaan} • Quotation {quotation.nomorQuotation}
                </span>
                <span>Dokumen Resmi Penawaran Harga • A4</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL PILIH PRODUK DARI SISTEM */}
      {modalProdukTerbuka && (
        <Modal
          onClose={() => setModalProdukTerbuka(false)}
          judul="Pilih Produk dari Sistem"
          keterangan="Pilih alat kesehatan dari katalog sistem (terintegrasi NIE & skema harga) untuk dimasukkan ke quotation."
        >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={cariProduk}
                onChange={(e) => setCariProduk(e.target.value)}
                placeholder="Cari nama alat kesehatan, tipe, nomor izin edar (NIE), atau prinsipal..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
            >
              {kategoriUnik.map((kat) => (
                <option key={kat} value={kat}>
                  {kat}
                </option>
              ))}
            </select>
          </div>

          <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
            {produkTersaring.map((p) => {
              const sudahAda = quotation.items.some((it) => it.produkId === p.id);
              return (
                <div
                  key={p.id}
                  className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900">{p.nama}</span>
                      <Badge tone={p.statusIzinEdar === 'Aktif' ? 'emerald' : 'amber'}>
                        {p.statusIzinEdar}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      <span>Tipe: {p.tipeModel}</span>
                      <span className="font-mono text-slate-700">NIE: {p.nomorIzinEdar}</span>
                      <span>Kategori: {p.kategori}</span>
                      {typeof p.stokTersedia === 'number' && (
                        <span>
                          Stok: <strong>{p.stokTersedia}</strong> {p.satuan}
                        </span>
                      )}
                    </div>
                    {p.spesifikasi && (
                      <p className="text-[10.5px] text-slate-500 line-clamp-1">{p.spesifikasi}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xs font-bold font-mono text-slate-900">
                        {p.hargaReferensi > 0 ? formatRupiah(p.hargaReferensi) : 'Harga Manual'}
                      </p>
                      <p className="text-[10px] text-slate-400">{p.sumberHarga}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => tambahProdukDariSistem(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                        sudahAda
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {sudahAda ? 'Tambah Lagi' : 'Pilih'}
                    </button>
                  </div>
                </div>
              );
            })}
            {produkTersaring.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <p>Tidak ada produk yang cocok dengan pencarian Anda.</p>
                <button
                  type="button"
                  onClick={() => {
                    setModalProdukTerbuka(false);
                    bukaModalManual();
                  }}
                  className={tombolSekunder}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Input Produk Secara Manual
                </button>
              </div>
            )}
          </div>
        </div>
        </Modal>
      )}

      {/* MODAL INPUT PRODUK MANUAL */}
      {modalManualTerbuka && (
        <Modal
          onClose={() => setModalManualTerbuka(false)}
          judul="Input Produk / Jasa Manual"
          keterangan="Masukkan rincian produk atau jasa secara manual untuk ditambahkan ke daftar penawaran quotation."
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className={labelClass}>
                Nama Produk / Jasa <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                autoFocus
                value={formManual.namaProduk}
                onChange={(e) => setFormManual({ ...formManual, namaProduk: e.target.value })}
                placeholder="Contoh: Patient Monitor 5 Parameter / Jasa Kalibrasi & Instalasi"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Tipe / Model (Opsional)</label>
                <input
                  type="text"
                  value={formManual.tipeModel}
                  onChange={(e) => setFormManual({ ...formManual, tipeModel: e.target.value })}
                  placeholder="Contoh: PM-5000 / Paket"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Nomor Izin Edar / NIE (Opsional)</label>
                <input
                  type="text"
                  value={formManual.nomorIzinEdar}
                  onChange={(e) => setFormManual({ ...formManual, nomorIzinEdar: e.target.value })}
                  placeholder="Contoh: KEMENKES RI AKL ... atau -"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Spesifikasi / Keterangan Tambahan (Opsional)</label>
              <textarea
                rows={2}
                value={formManual.spesifikasi}
                onChange={(e) => setFormManual({ ...formManual, spesifikasi: e.target.value })}
                placeholder="Rincian teknis, kelengkapan aksesoris, atau masa garansi..."
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className={labelClass}>Qty</label>
                <input
                  type="number"
                  min={1}
                  value={formManual.qty}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setFormManual({ ...formManual, qty: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Satuan</label>
                <input
                  type="text"
                  list="daftar-satuan-quotation"
                  value={formManual.satuan}
                  onChange={(e) => setFormManual({ ...formManual, satuan: e.target.value })}
                  placeholder="Unit"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Harga Satuan (Rp)</label>
                <input
                  type="number"
                  min={0}
                  value={formManual.hargaSatuan}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setFormManual({ ...formManual, hargaSatuan: e.target.value })}
                  placeholder="0"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Diskon (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formManual.diskonPersen}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setFormManual({ ...formManual, diskonPersen: e.target.value })}
                  placeholder="0"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600">Estimasi Subtotal Baris</span>
              <span className="text-sm font-bold font-mono text-emerald-700">
                {formatRupiah(
                  Math.round(
                    Math.max(1, Number(formManual.qty) || 1) *
                      Math.max(0, Number(formManual.hargaSatuan) || 0) *
                      (1 - Math.min(100, Math.max(0, Number(formManual.diskonPersen) || 0)) / 100)
                  )
                )}
              </span>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setModalManualTerbuka(false)}
                className={tombolSekunder}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => simpanProdukManual(false)}
                className={tombolSekunder}
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah &amp; Input Lagi
              </button>
              <button
                type="button"
                onClick={() => simpanProdukManual(true)}
                className={tombolPrimer}
              >
                <Check className="w-3.5 h-3.5" />
                Tambahkan ke Quotation
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
