import { useState, useRef } from 'react';
import { 
  Compass, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Camera, 
  BookOpen, 
  FileText, 
  Smartphone, 
  Search, 
  Video, 
  Download, 
  ShieldCheck, 
  Calendar, 
  User, 
  PackageCheck,
  Send,
  AlertCircle
} from 'lucide-react';
import { VisitSchedule, DigitalBrochure, CustomerFaskes } from '../../../../types/salesMarketing';

interface SfaModuleProps {
  visits: VisitSchedule[];
  onCheckInVisit: (visitId: string, actualLat: number, actualLng: number, notes: string) => void;
  brochures: DigitalBrochure[];
  customers: CustomerFaskes[];
  onSubmitPreOrder: (preOrderData: any) => void;
}

export default function SfaModule({
  visits,
  onCheckInVisit,
  brochures,
  customers,
  onSubmitPreOrder
}: SfaModuleProps) {
  const [activeTab, setActiveTab] = useState<'visits' | 'knowledge' | 'preorder'>('visits');
  const [selectedVisitForCheckIn, setSelectedVisitForCheckIn] = useState<VisitSchedule | null>(null);
  const [checkInNotes, setCheckInNotes] = useState('');
  const [gpsSimulatedLat, setGpsSimulatedLat] = useState<number>(-6.1973);
  const [gpsSimulatedLng, setGpsSimulatedLng] = useState<number>(106.8486);
  const [selectedBrochureModal, setSelectedBrochureModal] = useState<DigitalBrochure | null>(null);

  // Pre-Order Form State
  const [preOrderFaskesId, setPreOrderFaskesId] = useState<string>(customers[0]?.id || '');
  const [preOrderAlkesId, setPreOrderAlkesId] = useState<string>('ALK-001');
  const [preOrderQty, setPreOrderQty] = useState<number>(1);
  const [preOrderNotes, setPreOrderNotes] = useState<string>('');
  const [isPreOrderSuccess, setIsPreOrderSuccess] = useState(false);
  const [signedBy, setSignedBy] = useState<string>('dr. Kepala Pengadaan RS');

  const selectedFaskesObj = customers.find(c => c.id === preOrderFaskesId);

  // Stock inventory live lookup mock
  const stockInventoryMock: Record<string, { nama: string; tipe: string; stok: number; harga: number; nie: string }> = {
    'ALK-001': {
      nama: 'Patient Monitor Multi-Parameter AMS-V12 Pro',
      tipe: 'Elektromedik Non Radiasi',
      stok: 24,
      harga: 54000000,
      nie: 'KEMENKES RI AKD 20501910234'
    },
    'ALK-002': {
      nama: 'AMS Ultrasound 4D High-Definition Sonoview',
      tipe: 'Elektromedik Non Radiasi',
      stok: 5,
      harga: 950000000,
      nie: 'KEMENKES RI AKL 21501220911'
    },
    'ALK-003': {
      nama: 'Auto-Disable Syringe AMS-Safe 3ml (Steril)',
      tipe: 'Non Elektromedik Steril',
      stok: 85000,
      harga: 1650,
      nie: 'KEMENKES RI AKD 20902910450'
    }
  };

  const currentItem = stockInventoryMock[preOrderAlkesId];
  const preOrderTotal = (currentItem?.harga || 0) * preOrderQty;
  const isOverLimit = selectedFaskesObj ? (selectedFaskesObj.piutangBerjalan + preOrderTotal) > selectedFaskesObj.batasKredit : false;

  const handleExecuteCheckIn = () => {
    if (!selectedVisitForCheckIn) return;
    onCheckInVisit(selectedVisitForCheckIn.id, gpsSimulatedLat, gpsSimulatedLng, checkInNotes);
    setSelectedVisitForCheckIn(null);
    setCheckInNotes('');
  };

  const handlePreOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFaskesObj || !currentItem) return;

    onSubmitPreOrder({
      id: 'PRE-' + Date.now(),
      faskes: selectedFaskesObj.namaInstitusi,
      alkes: currentItem.nama,
      qty: preOrderQty,
      total: preOrderTotal,
      signedBy,
      catatan: preOrderNotes,
      status: 'Terkirim ke WMS & Verifikasi PJT'
    });

    setIsPreOrderSuccess(true);
    setTimeout(() => setIsPreOrderSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Sub-tabs header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('visits')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'visits'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            Visit Planner & Geo-Tagging ({visits.length})
          </button>

          <button
            onClick={() => setActiveTab('knowledge')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'knowledge'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Product Knowledge & e-Brochure ({brochures.length})
          </button>

          <button
            onClick={() => setActiveTab('preorder')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'preorder'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Mobile Order Taking (Pre-Order Live)
          </button>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-1.5 font-mono">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span>GPS Sensor: Real-time Geolocation Ready</span>
        </div>
      </div>

      {/* Tab 1: Visit Planner & Geo-Tagging */}
      {activeTab === 'visits' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Total Jadwal Kunjungan Hari Ini</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{visits.length} Fasyankes</div>
              <span className="text-[11px] text-emerald-600 font-medium">MedRep Jabodetabek & Regional</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Kunjungan Terverifikasi GPS</span>
              <div className="text-xl font-bold text-emerald-600 mt-1">
                {visits.filter(v => v.statusVisit.includes('Check-In') || v.statusVisit.includes('Selesai')).length} Selesai
              </div>
              <span className="text-[11px] text-slate-500">Radius toleransi &lt; 50 meter dari faskes</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Verifikasi CDAKB Kunjungan</span>
              <div className="text-xl font-bold text-blue-600 mt-1">100% Sesuai SOP</div>
              <span className="text-[11px] text-slate-500">Etika promosi tanpa klaim medis fiktif</span>
            </div>
          </div>

          <div className="space-y-3">
            {visits.map(visit => (
              <div 
                key={visit.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold">
                      {visit.jamRencana}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      visit.statusVisit === 'Check-In GPS Terverifikasi' 
                        ? 'bg-blue-100 text-blue-800'
                        : visit.statusVisit === 'Selesai Kunjungan'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {visit.statusVisit}
                    </span>
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      MedRep: <strong className="text-slate-700">{visit.namaMedRep}</strong>
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">
                    {visit.namaFaskes}
                  </h3>

                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="flex items-center gap-1.5 text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {visit.alamatFaskes}
                    </p>
                    <p>
                      <strong className="text-slate-700">Tujuan Kunjungan:</strong> {visit.tujuanKunjungan}
                    </p>
                    <p className="text-slate-500">
                      <strong>Dokter / PIC Target:</strong> {visit.picTarget}
                    </p>
                  </div>

                  {visit.catatanHasil && (
                    <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-700 border border-slate-100">
                      <span className="font-semibold text-slate-900 block mb-0.5">Catatan Hasil Kunjungan:</span>
                      {visit.catatanHasil}
                    </div>
                  )}
                </div>

                <div className="lg:border-l lg:border-slate-100 lg:pl-6 flex flex-col justify-between shrink-0 space-y-2 min-w-[200px]">
                  {visit.selisihJarakMeter !== undefined ? (
                    <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-[11px] space-y-0.5">
                      <span className="text-emerald-800 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Geo-Tagging Valid
                      </span>
                      <div className="text-slate-600">Selisih Radius: {visit.selisihJarakMeter} meter</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        GPS: {visit.actualLat?.toFixed(4)}, {visit.actualLng?.toFixed(4)}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100 text-[11px] text-amber-900">
                      Menunggu Check-In MedRep di lokasi rumah sakit
                    </div>
                  )}

                  {visit.statusVisit === 'Terjadwal' && (
                    <button
                      onClick={() => {
                        setSelectedVisitForCheckIn(visit);
                        setGpsSimulatedLat(visit.targetLat + 0.0001);
                        setGpsSimulatedLng(visit.targetLng + 0.0001);
                      }}
                      className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <MapPin className="w-4 h-4" />
                      Simulasi Check-In GPS
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Product Knowledge & Digital Brochure */}
      {activeTab === 'knowledge' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {brochures.map(brochure => (
              <div 
                key={brochure.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {brochure.statusNIE}
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-slate-500">
                      {brochure.tipeModel}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mb-1 leading-snug">
                    {brochure.namaAlkes}
                  </h3>

                  <div className="p-2 bg-slate-50 rounded-xl text-[11px] font-mono text-emerald-900 font-semibold mb-3 border border-slate-100">
                    {brochure.nomorIzinEdar}
                  </div>

                  <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                    {brochure.ringkasanSpek}
                  </p>

                  <div className="space-y-1 mb-4">
                    <span className="text-[11px] font-bold text-slate-700 block">Fitur Unggulan Klinis:</span>
                    {brochure.fiturUtama.slice(0, 3).map((fitur: string, i: number) => (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1" />
                        <span className="line-clamp-1">{fitur}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {brochure.sertifikasi.map((sert: string, i: number) => (
                      <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                        {sert}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedBrochureModal(brochure)}
                    className="flex-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Detail Lengkap
                  </button>

                  <a
                    href="#"
                    onClick={e => { e.preventDefault(); alert(`Mengunduh e-Brosur resmi: ${brochure.namaAlkes}`); }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh Brosur
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Mobile Order Taking (Pre-Order) */}
      {activeTab === 'preorder' && (
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Formulir Mobile Order Taking (Pre-Order Lapangan)
              </h3>
              <p className="text-xs text-slate-500">
                Pencatatan pesanan di hadapan dokter/pengadaan dengan pengecekan stok gudang seketika
              </p>
            </div>
          </div>

          {isPreOrderSuccess && (
            <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-start gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block">Pre-Order Berhasil Diteruskan!</strong>
                Pesanan telah masuk ke antrean verifikasi Penanggung Jawab Teknis (PJT) dan reservasi stok di WMS Gudang.
              </div>
            </div>
          )}

          <form onSubmit={handlePreOrderSubmit} className="space-y-4 text-xs">
            {/* Faskes Selector */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Pilih Faskes Pemesan *
              </label>
              <select
                value={preOrderFaskesId}
                onChange={e => setPreOrderFaskesId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-1 focus:ring-emerald-500"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.namaInstitusi} ({c.tipeFaskes})
                  </option>
                ))}
              </select>
            </div>

            {/* Plafon Status Alert */}
            {selectedFaskesObj && (
              <div className={`p-3 rounded-xl border text-[11px] ${
                isOverLimit 
                  ? 'bg-rose-50 border-rose-200 text-rose-800' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                <div className="flex justify-between font-semibold mb-1">
                  <span>Plafon Kredit RS: Rp {(selectedFaskesObj.batasKredit / 1_000_000).toLocaleString('id-ID')} Jt</span>
                  <span>Sisa Plafon: Rp {(selectedFaskesObj.sisaKredit / 1_000_000).toLocaleString('id-ID')} Jt</span>
                </div>
                {isOverLimit ? (
                  <div className="text-rose-700 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Peringatan: Pesanan ini akan melebihi plafon kredit faskes!
                  </div>
                ) : (
                  <div className="text-emerald-700">Plafon kredit memadai untuk transaksi ini.</div>
                )}
              </div>
            )}

            {/* Alkes Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">
                  Pilih Produk Alkes *
                </label>
                <select
                  value={preOrderAlkesId}
                  onChange={e => setPreOrderAlkesId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="ALK-001">Patient Monitor Multi-Parameter AMS-V12 Pro</option>
                  <option value="ALK-002">AMS Ultrasound 4D High-Definition Sonoview</option>
                  <option value="ALK-003">Auto-Disable Syringe AMS-Safe 3ml (Steril)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Jumlah (Qty) *
                </label>
                <input
                  type="number"
                  min={1}
                  value={preOrderQty}
                  onChange={e => setPreOrderQty(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            {/* Live Stock info badge */}
            {currentItem && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">NOMOR IZIN EDAR RESMI:</span>
                  <span className="font-bold text-slate-800 text-[11px]">{currentItem.nie}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">STOK GUDANG TERSEDIA:</span>
                  <span className={`font-bold text-xs ${currentItem.stok >= preOrderQty ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {currentItem.stok.toLocaleString('id-ID')} Unit {currentItem.stok >= preOrderQty ? '(Siap Kirim)' : '(Indent Pabrik)'}
                  </span>
                </div>
              </div>
            )}

            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex justify-between items-center">
              <span className="font-bold text-slate-700">Estimasi Total Nilai Pesanan:</span>
              <span className="font-extrabold text-sm text-emerald-800 font-mono">
                Rp {preOrderTotal.toLocaleString('id-ID')}
              </span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Nama Pejabat / Dokter Penandatangan Pre-Order
              </label>
              <input
                type="text"
                value={signedBy}
                onChange={e => setSignedBy(e.target.value)}
                placeholder="Contoh: dr. Bambang / PPK Pengadaan RS"
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Catatan Khusus Pengiriman / Kalibrasi
              </label>
              <textarea
                rows={2}
                value={preOrderNotes}
                onChange={e => setPreOrderNotes(e.target.value)}
                placeholder="Misal: Mohon sertakan kabel ECG ekstra 5-lead dan jadwal uji fungsi Sabtu..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                <Send className="w-4 h-4" />
                Kirim Pre-Order ke Sistem Gudang & PJT
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Simulasi Check-In GPS */}
      {selectedVisitForCheckIn && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-emerald-700 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Verifikasi Lokasi Kunjungan (Geo-Tagging)</h3>
                <p className="text-[11px] text-emerald-100">{selectedVisitForCheckIn.namaFaskes}</p>
              </div>
              <button
                onClick={() => setSelectedVisitForCheckIn(null)}
                className="text-white hover:text-emerald-200 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Koordinat Target Faskes:</span>
                  <span className="font-mono text-slate-800">
                    {selectedVisitForCheckIn.targetLat.toFixed(4)}, {selectedVisitForCheckIn.targetLng.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Koordinat GPS MedRep:</span>
                  <span className="font-mono text-emerald-700 font-bold">
                    {gpsSimulatedLat.toFixed(4)}, {gpsSimulatedLng.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-200">
                  <span>Status Jarak Radius:</span>
                  <span>14 Meter (Dalam Radius RS)</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Catatan Diskusi dengan Dokter / Bagian Pengadaan:
                </label>
                <textarea
                  rows={3}
                  value={checkInNotes}
                  onChange={e => setCheckInNotes(e.target.value)}
                  placeholder="Tuliskan hasil audiensi, spesifikasi yang diminta, atau tanggal jadwal demo..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedVisitForCheckIn(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteCheckIn}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Konfirmasi Check-In Valid
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail e-Brochure */}
      {selectedBrochureModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  {selectedBrochureModal.tipeModel}
                </span>
                <h3 className="text-base font-bold mt-1">{selectedBrochureModal.namaAlkes}</h3>
              </div>
              <button
                onClick={() => setSelectedBrochureModal(null)}
                className="text-slate-400 hover:text-white text-base font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-800 font-bold block mb-0.5">NOMOR IZIN EDAR RESMI KEMENKES RI:</span>
                <div className="text-sm font-bold font-mono text-emerald-900">
                  {selectedBrochureModal.nomorIzinEdar}
                </div>
                <span className="text-[11px] text-emerald-700">Produsen Resmi: {selectedBrochureModal.produsen}</span>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-1">Spesifikasi Teknis & Klinis:</span>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {selectedBrochureModal.ringkasanSpek}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-1.5">Fitur Unggulan Alat:</span>
                <div className="space-y-1.5">
                  {selectedBrochureModal.fiturUtama.map((f: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-1.5">Standar & Kepatuhan Mutu:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedBrochureModal.sertifikasi.map((s: string, i: number) => (
                    <span key={i} className="bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-lg text-[11px]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedBrochureModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
