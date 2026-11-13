import { jsPDF } from 'jspdf';

export interface IdentitasPerusahaanQuotation {
  tampilkanLogo: boolean;
  logoUrl?: string;
  namaPerusahaan: string;
  tagline: string;
  tampilkanLegalitas: boolean;
  nomorLegalitas: string;
  tampilkanNpwp: boolean;
  npwp: string;
  alamat: string;
  telepon: string;
  email: string;
  website: string;
  kotaTandaTangan: string;
  namaPenandatangan: string;
  jabatanPenandatangan: string;
  warnaAksen: string;
}

export interface ItemQuotation {
  id: string;
  produkId?: string;
  namaProduk: string;
  tipeModel: string;
  nomorIzinEdar: string;
  spesifikasi: string;
  qty: number;
  satuan: string;
  hargaSatuan: number;
  diskonPersen: number;
}

export interface DokumenQuotation {
  id: string;
  nomorQuotation: string;
  tanggalTerbit: string;
  berlakuHingga: string;
  perihal: string;
  jalurPengadaan: string;
  pelangganId?: string;
  namaPenerima: string;
  upPenerima: string;
  alamatPenerima: string;
  teleponPenerima: string;
  emailPenerima: string;
  items: ItemQuotation[];
  pakaiPpn: boolean;
  persenPpn: number;
  diskonGlobalRp: number;
  biayaLainRp: number;
  labelBiayaLain: string;
  syaratKetentuan: string;
  catatanTambahan: string;
  status: 'Draft' | 'Terkirim' | 'Disetujui';
  dibuatPada: string;
}

export function hitungRingkasanQuotation(doc: Pick<DokumenQuotation, 'items' | 'pakaiPpn' | 'persenPpn' | 'diskonGlobalRp' | 'biayaLainRp'>) {
  const subtotal = doc.items.reduce((acc, item) => {
    const kotor = item.qty * item.hargaSatuan;
    const bersih = kotor * (1 - (item.diskonPersen || 0) / 100);
    return acc + Math.round(bersih);
  }, 0);
  const diskonGlobal = Math.max(0, Math.min(subtotal, doc.diskonGlobalRp || 0));
  const dpp = Math.max(0, subtotal - diskonGlobal);
  const ppn = doc.pakaiPpn ? Math.round((dpp * (doc.persenPpn || 11)) / 100) : 0;
  const biayaLain = Math.max(0, doc.biayaLainRp || 0);
  const total = dpp + ppn + biayaLain;
  return { subtotal, diskonGlobal, dpp, ppn, biayaLain, total };
}

export function formatRpPdf(nilai: number): string {
  return 'Rp ' + Math.round(nilai).toLocaleString('id-ID');
}

function hexToRgb(hex: string): [number, number, number] {
  const bersih = hex.replace('#', '').trim();
  if (bersih.length === 3) {
    const r = parseInt(bersih[0] + bersih[0], 16);
    const g = parseInt(bersih[1] + bersih[1], 16);
    const b = parseInt(bersih[2] + bersih[2], 16);
    return [r || 15, g || 118, b || 110];
  }
  if (bersih.length === 6) {
    const r = parseInt(bersih.slice(0, 2), 16);
    const g = parseInt(bersih.slice(2, 4), 16);
    const b = parseInt(bersih.slice(4, 6), 16);
    return [Number.isNaN(r) ? 15 : r, Number.isNaN(g) ? 118 : g, Number.isNaN(b) ? 110 : b];
  }
  return [15, 118, 110];
}

async function muatGambarSebagaiPng(src: string): Promise<{ dataUrl: string; width: number; height: number } | null> {
  if (!src) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = img.naturalWidth || 200;
        const h = img.naturalHeight || 80;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve({ dataUrl: canvas.toDataURL('image/png'), width: w, height: h });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function formatTanggalId(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

export async function unduhQuotationPdfA4(
  quotation: DokumenQuotation,
  identitas: IdentitasPerusahaanQuotation,
  logoResolvedUrl?: string
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageW = 210;
  const pageH = 297;
  const marginX = 14;
  const contentW = pageW - marginX * 2; // 182 mm
  const [accentR, accentG, accentB] = hexToRgb(identitas.warnaAksen || '#0f766e');

  const logoAsset =
    identitas.tampilkanLogo && logoResolvedUrl
      ? await muatGambarSebagaiPng(logoResolvedUrl)
      : null;

  let y = 14;

  // --- KOP SURAT PERUSAHAAN ---
  const startHeaderY = y;
  let textStartX = marginX;
  let maxTextW = contentW - 55;

  if (logoAsset) {
    const maxLogoW = 36;
    const maxLogoH = 16;
    const ratio = Math.min(maxLogoW / logoAsset.width, maxLogoH / logoAsset.height);
    const drawW = logoAsset.width * ratio;
    const drawH = logoAsset.height * ratio;
    doc.addImage(logoAsset.dataUrl, 'PNG', marginX, y, drawW, drawH);
    textStartX = marginX + drawW + 4;
    maxTextW = contentW - drawW - 56;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(17, 24, 39);
  const namaLines = doc.splitTextToSize(identitas.namaPerusahaan || 'PT ANUGRAHMITRA SELARAS', maxTextW);
  doc.text(namaLines, textStartX, y + 4.5);
  let leftY = y + 4.5 + (namaLines.length - 1) * 5;

  if (identitas.tagline) {
    leftY += 4.2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(accentR, accentG, accentB);
    const tagLines = doc.splitTextToSize(identitas.tagline, maxTextW);
    doc.text(tagLines, textStartX, leftY);
    leftY += (tagLines.length - 1) * 3.5;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(75, 85, 99);
  if (identitas.alamat) {
    leftY += 4;
    const alamatLines = doc.splitTextToSize(identitas.alamat, maxTextW);
    doc.text(alamatLines, textStartX, leftY);
    leftY += (alamatLines.length - 1) * 3.4;
  }

  const kontakBaris = [
    identitas.telepon ? `Telp: ${identitas.telepon}` : '',
    identitas.email ? `Email: ${identitas.email}` : '',
    identitas.website ? `Web: ${identitas.website}` : ''
  ]
    .filter(Boolean)
    .join('  •  ');
  if (kontakBaris) {
    leftY += 3.8;
    const kLines = doc.splitTextToSize(kontakBaris, maxTextW);
    doc.text(kLines, textStartX, leftY);
    leftY += (kLines.length - 1) * 3.4;
  }

  if (identitas.tampilkanLegalitas && identitas.nomorLegalitas) {
    leftY += 3.8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(55, 65, 81);
    const legLines = doc.splitTextToSize(identitas.nomorLegalitas, maxTextW);
    doc.text(legLines, textStartX, leftY);
    leftY += (legLines.length - 1) * 3.2;
  }

  if (identitas.tampilkanNpwp && identitas.npwp) {
    leftY += 3.6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.text(`NPWP: ${identitas.npwp}`, textStartX, leftY);
  }

  // Kanan header: Badge QUOTATION
  doc.setFillColor(accentR, accentG, accentB);
  doc.roundedRect(pageW - marginX - 50, startHeaderY, 50, 14, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('QUOTATION', pageW - marginX - 25, startHeaderY + 6.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.text('SURAT PENAWARAN HARGA', pageW - marginX - 25, startHeaderY + 11, { align: 'center' });

  y = Math.max(leftY + 4, startHeaderY + 21);
  doc.setDrawColor(accentR, accentG, accentB);
  doc.setLineWidth(0.7);
  doc.line(marginX, y, pageW - marginX, y);
  y += 5;

  // --- BLOK PENERIMA & METADATA QUOTATION ---
  const colGap = 6;
  const leftBoxW = 96;
  const rightBoxW = contentW - leftBoxW - colGap;
  const rightBoxX = marginX + leftBoxW + colGap;

  // Hitung isi kiri & kanan untuk menentukan tinggi box yang sama
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const addrLines = doc.splitTextToSize(quotation.alamatPenerima || '-', leftBoxW - 8);
  const boxH = Math.max(30, 18 + addrLines.length * 3.6);

  // Kotak Kepada Yth.
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, y, leftBoxW, boxH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(accentR, accentG, accentB);
  doc.text('KEPADA YTH. (PENERIMA PENAWARAN)', marginX + 4, y + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(17, 24, 39);
  doc.text(doc.splitTextToSize(quotation.namaPenerima || '-', leftBoxW - 8), marginX + 4, y + 9.2);

  let py = y + 13.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(55, 65, 81);
  if (quotation.upPenerima) {
    doc.text(`Up: ${quotation.upPenerima}`, marginX + 4, py);
    py += 3.8;
  }
  doc.text(addrLines, marginX + 4, py);
  py += addrLines.length * 3.5;
  const penerimaKontak = [quotation.teleponPenerima, quotation.emailPenerima].filter(Boolean).join(' • ');
  if (penerimaKontak) {
    doc.setFontSize(7.4);
    doc.setTextColor(100, 116, 139);
    doc.text(doc.splitTextToSize(penerimaKontak, leftBoxW - 8), marginX + 4, py + 0.5);
  }

  // Kotak Info Quotation
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightBoxX, y, rightBoxW, boxH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(accentR, accentG, accentB);
  doc.text('DETAIL DOKUMEN PENAWARAN', rightBoxX + 4, y + 4.5);

  const metaRows: [string, string][] = [
    ['No. Quotation', quotation.nomorQuotation || '-'],
    ['Tanggal Terbit', formatTanggalId(quotation.tanggalTerbit)],
    ['Berlaku Hingga', formatTanggalId(quotation.berlakuHingga)],
    ['Jalur Pengadaan', quotation.jalurPengadaan || '-'],
    ['Perihal', quotation.perihal || '-']
  ];

  let my = y + 9.2;
  metaRows.forEach(([k, v]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(k, rightBoxX + 4, my);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    const valLines = doc.splitTextToSize(v, rightBoxW - 31);
    doc.text(valLines, rightBoxX + 29, my);
    my += Math.max(4.1, valLines.length * 3.5);
  });

  y += boxH + 5;

  // --- TABEL PRODUK ---
  // Kolom: No (8), Produk & Spesifikasi (74), Qty (16), Harga Satuan (30), Diskon (16), Jumlah (38) => total 182
  const cols = [
    { label: 'No', w: 8, align: 'center' as const },
    { label: 'Nama Produk / Tipe / Izin Edar (NIE)', w: 74, align: 'left' as const },
    { label: 'Qty', w: 18, align: 'center' as const },
    { label: 'Harga Satuan', w: 30, align: 'right' as const },
    { label: 'Diskon', w: 15, align: 'center' as const },
    { label: 'Subtotal', w: 37, align: 'right' as const }
  ];

  const gambarHeaderTabel = (posY: number) => {
    doc.setFillColor(accentR, accentG, accentB);
    doc.rect(marginX, posY, contentW, 7.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.6);
    doc.setTextColor(255, 255, 255);
    let cx = marginX;
    cols.forEach((c) => {
      const tx = c.align === 'center' ? cx + c.w / 2 : c.align === 'right' ? cx + c.w - 2 : cx + 2;
      doc.text(c.label, tx, posY + 5, { align: c.align });
      cx += c.w;
    });
    return posY + 7.5;
  };

  y = gambarHeaderTabel(y);

  quotation.items.forEach((item, idx) => {
    const namaLine = doc.splitTextToSize(item.namaProduk || '-', cols[1].w - 4);
    const metaSub = [
      item.tipeModel ? `Tipe: ${item.tipeModel}` : '',
      item.nomorIzinEdar ? `NIE: ${item.nomorIzinEdar}` : ''
    ]
      .filter(Boolean)
      .join('  |  ');
    const metaLines = metaSub ? doc.splitTextToSize(metaSub, cols[1].w - 4) : [];
    const spekLines = item.spesifikasi
      ? doc.splitTextToSize(item.spesifikasi, cols[1].w - 4).slice(0, 3)
      : [];

    const rowH = Math.max(10, 4 + namaLine.length * 3.6 + metaLines.length * 3.1 + spekLines.length * 3.0 + 2);

    if (y + rowH > pageH - 25) {
      doc.addPage();
      y = 16;
      y = gambarHeaderTabel(y);
    }

    if (idx % 2 === 1) {
      doc.setFillColor(249, 250, 251);
      doc.rect(marginX, y, contentW, rowH, 'F');
    }
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.2);
    doc.line(marginX, y + rowH, pageW - marginX, y + rowH);

    // No
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(75, 85, 99);
    doc.text(String(idx + 1), marginX + cols[0].w / 2, y + 5, { align: 'center' });

    // Produk + Meta + Spek
    const prodX = marginX + cols[0].w + 2;
    let pyRow = y + 4.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(17, 24, 39);
    doc.text(namaLine, prodX, pyRow);
    pyRow += namaLine.length * 3.6;

    if (metaLines.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.9);
      doc.setTextColor(accentR, accentG, accentB);
      doc.text(metaLines, prodX, pyRow);
      pyRow += metaLines.length * 3.1;
    }

    if (spekLines.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(107, 114, 128);
      doc.text(spekLines, prodX, pyRow);
    }

    // Qty
    const qtyX = marginX + cols[0].w + cols[1].w;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(17, 24, 39);
    doc.text(`${item.qty} ${item.satuan || 'Unit'}`, qtyX + cols[2].w / 2, y + 5, { align: 'center' });

    // Harga Satuan
    const hargaX = qtyX + cols[2].w;
    doc.setFont('helvetica', 'normal');
    doc.text(formatRpPdf(item.hargaSatuan), hargaX + cols[3].w - 2, y + 5, { align: 'right' });

    // Diskon
    const discX = hargaX + cols[3].w;
    doc.text(item.diskonPersen ? `${item.diskonPersen}%` : '-', discX + cols[4].w / 2, y + 5, { align: 'center' });

    // Subtotal baris
    const subX = discX + cols[4].w;
    const subBaris = Math.round(item.qty * item.hargaSatuan * (1 - (item.diskonPersen || 0) / 100));
    doc.setFont('helvetica', 'bold');
    doc.text(formatRpPdf(subBaris), subX + cols[5].w - 2, y + 5, { align: 'right' });

    y += rowH;
  });

  if (quotation.items.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text('Belum ada item produk yang dipilih.', pageW / 2, y + 8, { align: 'center' });
    y += 14;
  }

  y += 5;

  // --- RINGKASAN FINANSIAL & SYARAT KETENTUAN ---
  const ringkasan = hitungRingkasanQuotation(quotation);

  // Pastikan cukup ruang untuk summary + syarat + tanda tangan (~78 mm)
  if (y + 78 > pageH - 18) {
    doc.addPage();
    y = 18;
  }

  const summaryStartY = y;
  const termsW = 104;
  const sumW = contentW - termsW - 6;
  const sumX = marginX + termsW + 6;

  // Kiri: Syarat & Ketentuan + Catatan
  let ty = summaryStartY;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(17, 24, 39);
  doc.text('SYARAT & KETENTUAN PENAWARAN:', marginX, ty + 3);
  ty += 6.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.3);
  doc.setTextColor(75, 85, 99);
  const termsLines = doc.splitTextToSize(quotation.syaratKetentuan || '-', termsW);
  doc.text(termsLines, marginX, ty);
  ty += termsLines.length * 3.4;

  if (quotation.catatanTambahan) {
    ty += 2.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.4);
    doc.setTextColor(55, 65, 81);
    doc.text('Catatan Tambahan:', marginX, ty);
    ty += 3.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    const catLines = doc.splitTextToSize(quotation.catatanTambahan, termsW);
    doc.text(catLines, marginX, ty);
    ty += catLines.length * 3.3;
  }

  // Kanan: Tabel Ringkasan Total
  let sy = summaryStartY;
  const addSumRow = (label: string, val: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(bold ? 17 : 75, bold ? 24 : 85, bold ? 39 : 99);
    doc.text(label, sumX + 2, sy + 3.5);
    doc.text(val, pageW - marginX - 2, sy + 3.5, { align: 'right' });
    sy += 5.2;
  };

  addSumRow('Subtotal', formatRpPdf(ringkasan.subtotal));
  if (ringkasan.diskonGlobal > 0) {
    addSumRow('Diskon Tambahan', `- ${formatRpPdf(ringkasan.diskonGlobal)}`);
  }
  addSumRow('Dasar Pengenaan Pajak (DPP)', formatRpPdf(ringkasan.dpp));
  if (quotation.pakaiPpn) {
    addSumRow(`PPN (${quotation.persenPpn || 11}%)`, formatRpPdf(ringkasan.ppn));
  }
  if (ringkasan.biayaLain > 0) {
    addSumRow(quotation.labelBiayaLain || 'Biaya Pengiriman & Instalasi', formatRpPdf(ringkasan.biayaLain));
  }

  sy += 1;
  doc.setFillColor(accentR, accentG, accentB);
  doc.roundedRect(sumX, sy, sumW, 9, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL PENAWARAN', sumX + 3, sy + 5.8);
  doc.setFontSize(9.5);
  doc.text(formatRpPdf(ringkasan.total), pageW - marginX - 3, sy + 5.8, { align: 'right' });
  sy += 11;

  // --- BLOK TANDA TANGAN ---
  y = Math.max(ty, sy) + 8;
  if (y + 34 > pageH - 16) {
    doc.addPage();
    y = 20;
  }

  const sigLeftX = marginX + 2;
  const sigRightX = pageW - marginX - 62;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(75, 85, 99);
  doc.text('Persetujuan / Konfirmasi Pemesan,', sigLeftX, y);
  doc.text(
    `${identitas.kotaTandaTangan || 'Jakarta'}, ${formatTanggalId(quotation.tanggalTerbit)}`,
    sigRightX,
    y
  );

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(quotation.namaPenerima || 'Pihak Pemesan', sigLeftX, y + 4.5);
  doc.text(identitas.namaPerusahaan || 'PT ANUGRAHMITRA SELARAS', sigRightX, y + 4.5);

  // Garis tanda tangan
  const lineSigY = y + 23;
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(sigLeftX, lineSigY, sigLeftX + 55, lineSigY);
  doc.line(sigRightX, lineSigY, sigRightX + 58, lineSigY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(17, 24, 39);
  doc.text(quotation.upPenerima || '( Nama & Stempel Instansi )', sigLeftX, lineSigY + 4);
  doc.text(identitas.namaPenandatangan || 'Penanggung Jawab Komersial', sigRightX, lineSigY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.3);
  doc.setTextColor(100, 116, 139);
  doc.text('Pejabat Pengadaan / Penerima', sigLeftX, lineSigY + 7.8);
  doc.text(identitas.jabatanPenandatangan || 'Sales & e-Katalog Manager', sigRightX, lineSigY + 7.8);

  // --- FOOTER SETIAP HALAMAN ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.line(marginX, pageH - 12, pageW - marginX, pageH - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    doc.text(
      `${identitas.namaPerusahaan} • Quotation ${quotation.nomorQuotation}`,
      marginX,
      pageH - 7.5
    );
    doc.text(`Halaman ${i} dari ${totalPages}`, pageW - marginX, pageH - 7.5, { align: 'right' });
  }

  const safeFilename = (quotation.nomorQuotation || 'Quotation')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  doc.save(`${safeFilename}.pdf`);
}
