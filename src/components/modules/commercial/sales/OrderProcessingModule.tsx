import { useState } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Printer, 
  Building2, 
  Tag, 
  Clock, 
  CreditCard, 
  Ban, 
  Filter,
  DollarSign,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { SalesOrderExtended, CustomerFaskes, SalesOrderItem } from '../../../../types/salesMarketing';

interface OrderProcessingModuleProps {
  orders: SalesOrderExtended[];
  customers: CustomerFaskes[];
  onAddOrder: (newOrder: SalesOrderExtended) => void;
  onApprovePJT: (orderId: string) => void;
}

export default function OrderProcessingModule({
  orders,
  customers,
  onAddOrder,
  onApprovePJT
}: OrderProcessingModuleProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<SalesOrderExtended | null>(null);

  // New Order Form State with Interactive CDAKB Compliance Validator
  const [formFaskesId, setFormFaskesId] = useState<string>(customers[0]?.id || '');
  const [formAlkesSelection, setFormAlkesSelection] = useState<'V12_PRO' | 'USG_4D' | 'EXPIRED_DEMO_ITEM'>('V12_PRO');
  const [formPriceTier, setFormPriceTier] = useState<'eKatalog' | 'rsSwastaTier1' | 'distributor'>('eKatalog');
  const [formQty, setFormQty] = useState<number>(2);
  const [formDiscountPercent, setFormDiscountPercent] = useState<number>(0);
  const [formNotes, setFormNotes] = useState<string>('Pesanan resmi RS sesuai SPK');

  // Selected Faskes details
  const selectedFaskes = customers.find(c => c.id === formFaskesId);

  // Alkes catalog details with simulated NIE compliance
  const catalogAlkes = {
    'V12_PRO': {
      id: 'ALK-001',
      nama: 'Patient Monitor Multi-Parameter AMS-V12 Pro',
      tipe: 'AMS-V12-PRO',
      nie: 'KEMENKES RI AKD 20501910234',
      isNieValid: true,
      batch: 'LOT-2026-PM08',
      serial: 'SN-V12-9910',
      stok: 24,
      satuan: 'Unit',
      hargaTier: {
        eKatalog: 54000000,
        rsSwastaTier1: 58000000,
        distributor: 48000000
      }
    },
    'USG_4D': {
      id: 'ALK-002',
      nama: 'AMS Ultrasound 4D High-Definition Sonoview',
      tipe: 'AMS-USG-4D-HD',
      nie: 'KEMENKES RI AKL 21501220911',
      isNieValid: true,
      batch: 'LOT-2026-USG02',
      serial: 'SN-USG-4D-882',
      stok: 5,
      satuan: 'Unit',
      hargaTier: {
        eKatalog: 950000000,
        rsSwastaTier1: 980000000,
        distributor: 890000000
      }
    },
    'EXPIRED_DEMO_ITEM': {
      id: 'ALK-999',
      nama: 'Alat Cek Darah Model Lama (Izin Kedaluwarsa)',
      tipe: 'AMS-OLD-01',
      nie: 'KEMENKES RI AKD 20101810011 (KEDALUWARSA)',
      isNieValid: false, // Testing CDAKB validator blocking!
      batch: 'LOT-2021-OLD',
      serial: 'SN-OLD-001',
      stok: 10,
      satuan: 'Unit',
      hargaTier: {
        eKatalog: 12000000,
        rsSwastaTier1: 15000000,
        distributor: 10000000
      }
    }
  };

  const selectedItem = catalogAlkes[formAlkesSelection];
  const unitPrice = selectedItem.hargaTier[formPriceTier];
  const subTotal = (unitPrice * formQty) * (1 - formDiscountPercent / 100);
  const ppn11 = subTotal * 0.11;
  const grandTotal = subTotal + ppn11;

  // CDAKB & Credit Validation logic
  const isFaskesIzinValid = selectedFaskes?.isIzinValid ?? true;
  const isNieValid = selectedItem.isNieValid;
  const isCreditOverlimit = selectedFaskes ? (selectedFaskes.piutangBerjalan + grandTotal) > selectedFaskes.batasKredit : false;

  const canSubmitOrder = isFaskesIzinValid && isNieValid && !isCreditOverlimit;

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFaskes || !canSubmitOrder) return;

    const newOrder: SalesOrderExtended = {
      id: 'SO-' + Date.now(),
      nomorSO: `SO-MED-${new Date().getFullYear()}-${String(orders.length + 101).padStart(4, '0')}`,
      tanggal: new Date().toISOString().split('T')[0],
      faskesId: selectedFaskes.id,
      namaFaskes: selectedFaskes.namaInstitusi,
      tipeFaskes: selectedFaskes.tipeFaskes,
      wilayah: selectedFaskes.wilayah,
      items: [
        {
          alkesId: selectedItem.id,
          namaAlkes: selectedItem.nama,
          tipeModel: selectedItem.tipe,
          nomorIzinEdar: selectedItem.nie,
          isIzinEdarAktif: selectedItem.isNieValid,
          batchLot: selectedItem.batch,
          nomorSeri: selectedItem.serial,
          stokTersedia: selectedItem.stok,
          jumlah: formQty,
          satuan: selectedItem.satuan,
          hargaSatuan: unitPrice,
          diskonPersen: formDiscountPercent,
          total: subTotal
        }
      ],
      subtotal: subTotal,
      ppn11Persen: ppn11,
      grandTotal: grandTotal,
      termOfPayment: `TOP ${selectedFaskes.termOfPaymentHari} Hari`,
      jatuhTempo: new Date(Date.now() + selectedFaskes.termOfPaymentHari * 86400000).toISOString().split('T')[0],
      statusComplianceCDAKB: 'Lolos Validasi CDAKB',
      statusKredit: 'Aman',
      statusOrder: 'Diverifikasi PJT',
      namaSales: 'Dimas Satria, S.T.',
      keterangan: formNotes,
      catatanPJT: 'Verifikasi kepatuhan NIE & izin faskes otomatis lulus.'
    };

    onAddOrder(newOrder);
    setIsNewOrderModalOpen(false);
  };

  const filteredOrders = orders.filter(o => {
    const matchSearch = o.nomorSO.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.namaFaskes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items.some((i: SalesOrderItem) => i.namaAlkes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchStatus = selectedStatusFilter === 'all' || o.statusOrder === selectedStatusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Total Nilai Pesanan Berjalan</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            Rp {(orders.reduce((acc, o) => acc + o.grandTotal, 0) / 1_000_000).toLocaleString('id-ID')} Jt
          </div>
          <span className="text-[11px] text-slate-500">{orders.length} Dokumen Sales Order</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Kepatuhan Regulasi CDAKB</span>
          <div className="text-xl font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            100% Lolos
          </div>
          <span className="text-[11px] text-emerald-700">Validasi otomatis izin edar & faskes</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Status Plafon Piutang (AR)</span>
          <div className="text-xl font-bold text-blue-600 mt-1">Terkontrol</div>
          <span className="text-[11px] text-slate-500">Auto-lock jika overlimit kredit</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Input Pesanan</span>
            <div className="text-sm font-bold text-slate-800 mt-0.5">Sesuai Regulasi</div>
          </div>
          <button
            onClick={() => setIsNewOrderModalOpen(true)}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Buat Sales Order
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor SO, nama faskes, nama alkes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <span className="text-[11px] font-medium text-slate-500 shrink-0">Status Order:</span>
          <select
            value={selectedStatusFilter}
            onChange={e => setSelectedStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Semua Status</option>
            <option value="Diverifikasi PJT">Diverifikasi PJT</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Alokasi FEFO Gudang">Alokasi FEFO Gudang</option>
            <option value="Dalam Pengiriman">Dalam Pengiriman</option>
            <option value="Terkirim">Terkirim</option>
          </select>
        </div>
      </div>

      {/* Sales Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Nomor SO & Tanggal</th>
                <th className="py-3 px-4">Faskes Pemesan</th>
                <th className="py-3 px-4">Item Alkes & Izin Edar</th>
                <th className="py-3 px-4">Total Nilai (Inc. PPN)</th>
                <th className="py-3 px-4">Kepatuhan CDAKB & Plafon</th>
                <th className="py-3 px-4">Status & Alur Order</th>
                <th className="py-3 px-4 text-center">Faktur / Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-slate-900 block">{order.nomorSO}</span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {order.tanggal}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-800 block">{order.namaFaskes}</span>
                    <span className="text-[11px] text-slate-500">{order.tipeFaskes} • {order.wilayah}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    {order.items.map((item: SalesOrderItem, idx: number) => (
                      <div key={idx} className="space-y-0.5">
                        <span className="font-semibold text-slate-800 block">
                          {item.namaAlkes} ({item.jumlah} {item.satuan})
                        </span>
                        <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded inline-block">
                          {item.nomorIzinEdar}
                        </span>
                      </div>
                    ))}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block font-mono">
                      Rp {order.grandTotal.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{order.termOfPayment}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                        <ShieldCheck className="w-3 h-3" />
                        {order.statusComplianceCDAKB}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Plafon: <strong className="text-emerald-700">{order.statusKredit}</strong>
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      order.statusOrder === 'Disetujui' || order.statusOrder === 'Alokasi FEFO Gudang'
                        ? 'bg-blue-100 text-blue-800'
                        : order.statusOrder === 'Terkirim'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {order.statusOrder}
                    </span>

                    {order.statusOrder === 'Diverifikasi PJT' && (
                      <button
                        onClick={() => onApprovePJT(order.id)}
                        className="mt-1.5 block text-[10px] text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
                      >
                        Setujui sebagai PJT
                      </button>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedOrderForInvoice(order)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs flex items-center justify-center gap-1 mx-auto cursor-pointer transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Faktur
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Input Sales Order Baru dengan Live Compliance Guard */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  SISTEM PEMROFESIAN PENJUALAN CDAKB
                </span>
                <h3 className="text-base font-bold mt-1">Input Formulir Sales Order (SO) Baru</h3>
              </div>
              <button
                onClick={() => setIsNewOrderModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Compliance Warning Guard Display */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 block">Status Validasi Regulasi Kemenkes & CDAKB:</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Guard 1: Izin Operasional Faskes */}
                  <div className={`p-2.5 rounded-xl border text-[11px] ${
                    isFaskesIzinValid 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    <span className="font-bold block">1. Izin Faskes:</span>
                    {isFaskesIzinValid ? 'Aktif Resmi' : 'Kedaluwarsa (BLOKIR)'}
                  </div>

                  {/* Guard 2: Nomor Izin Edar (NIE) Alkes */}
                  <div className={`p-2.5 rounded-xl border text-[11px] ${
                    isNieValid 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    <span className="font-bold block">2. Izin Edar (NIE):</span>
                    {isNieValid ? 'Berlaku (Kemenkes)' : 'Expired (BLOKIR)'}
                  </div>

                  {/* Guard 3: Batas Plafon Piutang (AR Credit Limit) */}
                  <div className={`p-2.5 rounded-xl border text-[11px] ${
                    !isCreditOverlimit 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    <span className="font-bold block">3. Plafon Kredit:</span>
                    {!isCreditOverlimit ? 'Sisa Plafon Cukup' : 'Overlimit (BLOKIR)'}
                  </div>
                </div>

                {!canSubmitOrder && (
                  <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs flex items-start gap-2">
                    <Ban className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block">Sistem Menolak Pembuatan Sales Order Ini!</strong>
                      Sesuai standar CDAKB Permenkes RI No. 4/2014 dan SOP Manajemen Risiko Finansial, alkes tidak boleh didistribusikan jika NIE kedaluwarsa, faskes tidak memiliki izin sah, atau melebihi batas plafon kredit.
                    </div>
                  </div>
                )}
              </div>

              {/* Faskes Selector */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Pilih Rumah Sakit / Faskes Pemesan *</label>
                <select
                  value={formFaskesId}
                  onChange={e => setFormFaskesId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.namaInstitusi} - {c.tipeFaskes} (Sisa Plafon: Rp {(c.sisaKredit / 1_000_000).toLocaleString('id-ID')} Jt)
                    </option>
                  ))}
                </select>
              </div>

              {/* Alkes Selector */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Pilih Produk Alkes *</label>
                  <select
                    value={formAlkesSelection}
                    onChange={e => setFormAlkesSelection(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="V12_PRO">Patient Monitor AMS-V12 Pro (AKD Valid)</option>
                    <option value="USG_4D">AMS Ultrasound 4D Sonoview (AKL Valid)</option>
                    <option value="EXPIRED_DEMO_ITEM">⚠️ Alat Kedaluwarsa (Uji Coba Blokir Validator)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Skema Harga (Pricing Tier)</label>
                  <select
                    value={formPriceTier}
                    onChange={e => setFormPriceTier(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="eKatalog">Tier 1: e-Katalog LKPP Pemerintah</option>
                    <option value="rsSwastaTier1">Tier 2: Rumah Sakit Swasta Premium</option>
                    <option value="distributor">Tier 3: Distributor Resmi Daerah</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kuantitas (Qty Unit) *</label>
                  <input
                    type="number"
                    min={1}
                    value={formQty}
                    onChange={e => setFormQty(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Stok Gudang: {selectedItem.stok} Unit (FEFO: {selectedItem.batch})
                  </span>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Diskon Tambahan (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={formDiscountPercent}
                    onChange={e => setFormDiscountPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {/* Price Calculation Summary */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Harga Satuan:</span>
                  <span>Rp {unitPrice.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal ({formQty} unit):</span>
                  <span>Rp {subTotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>PPN 11%:</span>
                  <span>Rp {ppn11.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-emerald-800 pt-1 border-t border-slate-200">
                  <span>Grand Total Nilai SO:</span>
                  <span>Rp {grandTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Catatan Dokumen / Nomor SPK Tender</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewOrderModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!canSubmitOrder}
                  className={`px-4 py-2 rounded-xl font-semibold shadow-xs flex items-center gap-1.5 ${
                    canSubmitOrder
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Terbitkan Sales Order Resmi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Preview Faktur Penjualan Medis */}
      {selectedOrderForInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  FAKTUR PENJUALAN ALKES RESMI
                </span>
                <h3 className="text-base font-bold mt-1">{selectedOrderForInvoice.nomorSO}</h3>
              </div>
              <button
                onClick={() => setSelectedOrderForInvoice(null)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">PT Antarmitra Medika Solusindo (AMS)</h4>
                  <p className="text-slate-500">Izin Penyalur: SDAK-KEMENKES-9120003441</p>
                  <p className="text-slate-500">NPWP: 01.345.678.9-021.000</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-700 block">Faskes Tujuan:</span>
                  <div className="font-bold text-slate-900">{selectedOrderForInvoice.namaFaskes}</div>
                  <div className="text-slate-500">{selectedOrderForInvoice.tipeFaskes}</div>
                  <div className="text-slate-500">Jatuh Tempo: {selectedOrderForInvoice.jatuhTempo}</div>
                </div>
              </div>

              {/* Items detail */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3">Nama Alat & NIE Kemenkes</th>
                      <th className="py-2.5 px-3">Batch / SN</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Harga (Rp)</th>
                      <th className="py-2.5 px-3 text-right">Total (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrderForInvoice.items.map((item: SalesOrderItem, idx: number) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{item.namaAlkes}</div>
                          <div className="text-[10px] text-emerald-700 font-mono">{item.nomorIzinEdar}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                          {item.batchLot}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold">
                          {item.jumlah} {item.satuan}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {item.hargaSatuan.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {item.total.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="w-64 space-y-1 font-mono text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>Rp {selectedOrderForInvoice.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>PPN 11%:</span>
                    <span>Rp {selectedOrderForInvoice.ppn11Persen.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 text-sm pt-1 border-t border-slate-200">
                    <span>Grand Total:</span>
                    <span>Rp {selectedOrderForInvoice.grandTotal.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl text-[11px] text-emerald-900">
                Catatan Regulasi: Penjualan ini mematuhi prinsip Cara Distribusi Alat Kesehatan yang Baik (CDAKB). Produk dijamin keasliannya dan terdaftar resmi di Kementerian Kesehatan RI.
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs text-slate-500 font-mono">Status: {selectedOrderForInvoice.statusOrder}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => alert('Mencetak Faktur Penjualan Medis & Surat Jalan...')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Dokumen Faktur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
