import React, { useState, useEffect } from 'react';
import { 
  X, 
  Truck, 
  Save, 
  Send, 
  RefreshCw, 
  Printer, 
  User, 
  CreditCard, 
  Calendar, 
  Clock, 
  FileText,
  AlertCircle,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

interface SalesInvoiceWaybillModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  isTr: boolean;
  onRefresh: () => void;
}

export const SalesInvoiceWaybillModal: React.FC<SalesInvoiceWaybillModalProps> = ({
  isOpen,
  onClose,
  invoice,
  isTr,
  onRefresh
}) => {
  const [driverName, setDriverName] = useState('');
  const [driverSurname, setDriverSurname] = useState('');
  const [driverVkn, setDriverVkn] = useState('11111111111');
  const [plateNumber, setPlateNumber] = useState('');
  const [trailerPlate, setTrailerPlate] = useState('');
  const [actualDate, setActualDate] = useState('');
  const [actualTime, setActualTime] = useState('');
  const [prefix, setPrefix] = useState('IRS');
  
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'err'; text: string } | null>(null);
  const [viewHtml, setViewHtml] = useState(false);

  useEffect(() => {
    if (invoice) {
      setDriverName(invoice.waybill_driver_name || '');
      setDriverSurname(invoice.waybill_driver_surname || '');
      setDriverVkn(invoice.waybill_driver_vkn || '11111111111');
      setPlateNumber(invoice.waybill_plate_number || '');
      setTrailerPlate(invoice.waybill_trailer_plate || '');
      
      // Populate actual ship date
      if (invoice.waybill_actual_date) {
        setActualDate(new Date(invoice.waybill_actual_date).toISOString().split('T')[0]);
      } else {
        setActualDate(new Date().toISOString().split('T')[0]);
      }
      
      setActualTime(invoice.waybill_actual_time || new Date().toTimeString().split(' ')[0].substring(0, 5));
      setPrefix(invoice.waybill_prefix || 'IRS');
      setStatusMessage(null);
      setViewHtml(false);
    }
  }, [invoice]);

  if (!isOpen || !invoice) return null;

  const handleSaveDraft = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const response = await fetch(`/api/einvoice/waybill/save/${invoice.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverName,
          driverSurname,
          driverVkn,
          plateNumber,
          trailerPlate,
          actualDate,
          actualTime,
          prefix
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Beklenmeyen hata.");
      
      setStatusMessage({ type: 'success', text: isTr ? "İrsaliye sevk ve taşıyıcı detayları taslak olarak kaydedildi." : "Waybill draft details saved successfully." });
      onRefresh();
    } catch (err: any) {
      setStatusMessage({ type: 'err', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSendToGIB = async () => {
    if (!plateNumber.trim()) {
      setStatusMessage({ 
        type: 'err', 
        text: isTr ? "GİB kuralları gereği Araç Plaka Numarası doldurulması zorunludur." : "Vehicle Plate Number is strictly required." 
      });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    try {
      const response = await fetch(`/api/einvoice/waybill/send/${invoice.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gönderim başarısız.");

      setStatusMessage({ 
        type: 'success', 
        text: isTr 
          ? `E-İrsaliye başarıyla oluşturuldu ve MySoft üzerinden iletildi. Numara: ${data.waybillNumber}` 
          : `E-Waybill successfully issued. Number: ${data.waybillNumber}` 
      });
      onRefresh();
    } catch (err: any) {
      setStatusMessage({ type: 'err', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const response = await fetch(`/api/einvoice/waybill/status/${invoice.id}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Sorgulama başarısız.");

      setStatusMessage({
        type: 'success',
        text: isTr 
          ? `GİB Servis Durumu: ${data.status} - Açıklama: ${data.message}` 
          : `GİB Status: ${data.status} (${data.message})`
      });
      onRefresh();
    } catch (err: any) {
      setStatusMessage({ type: 'err', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-2xl w-full overflow-hidden transition-all duration-300">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-indigo-950 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <Truck className="h-6 w-6 text-indigo-400 animate-pulse" />
            <div>
              <h3 className="font-sans font-black text-lg tracking-tight">
                {isTr ? 'MySoft e-İrsaliye Entegrasyonu' : 'MySoft e-Waybill Module'}
              </h3>
              <p className="text-xs text-indigo-200/80 font-bold tracking-widest uppercase">
                {isTr ? `Fatura No: #${invoice.invoice_number}` : `Invoice No: #${invoice.invoice_number}`}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`px-6 py-4 border-b flex items-start gap-3 ${
            statusMessage.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="text-xs font-bold font-sans">{statusMessage.text}</div>
          </div>
        )}

        {/* Main Body */}
        {viewHtml ? (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{isTr ? 'GİB e-İrsaliye Belge Önizlemesi' : 'Official Document Copy'}</span>
              <button 
                onClick={() => setViewHtml(false)}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                {isTr ? 'Detaylara / Form Girişine Dön' : 'Return to Inputs Form'}
              </button>
            </div>
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 h-[450px]">
              <iframe 
                src={`/api/einvoice/waybill/html/${invoice.id}`} 
                className="w-full h-full border-0" 
                title="Waybill HTML representation"
              />
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            
            {/* Context Invoice Banner */}
            <div className="bg-slate-50/80 rounded-2xl border border-slate-100 p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">{isTr ? 'Müşteri / Cari' : 'Customer'}</span>
                <span className="text-xs font-bold text-slate-700 truncate block">
                  {invoice.customer_name || invoice.company_title || '-'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">{isTr ? 'Vergi / TCKN' : 'Tax Registration'}</span>
                <span className="text-xs font-mono font-bold text-indigo-600">
                  {invoice.tax_number || 'Tanımsız / Girilmemiş'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">{isTr ? 'Fatura Toplamı' : 'Grand Total'}</span>
                <span className="text-xs font-black text-slate-900">
                  {Number(invoice.grand_total).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {invoice.currency}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">{isTr ? 'İrsaliye Durumu' : 'Waybill State'}</span>
                <span className={`inline-flex items-center px-2 py-0.5 mt-0.5 rounded text-[9px] font-black tracking-widest uppercase border ${
                  invoice.waybill_status === 'SUCCESS' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
                  invoice.waybill_status === 'QUEUED' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                  invoice.waybill_status === 'ERROR' ? 'border-rose-200 bg-rose-50 text-rose-700' :
                  'border-slate-200 bg-slate-50 text-slate-700'
                }`}>
                  {invoice.waybill_status || 'DRAFT / TASLAK'}
                </span>
              </div>
            </div>

            {/* Form Fields split */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Truck className="h-4 w-4 text-slate-500" />
                {isTr ? 'Taşıyıcı ve Sevk Araç Detayları (GİB Zorunlu Sektörel Alanlar)' : 'Carrier Logistics Details'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Driver Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    {isTr ? 'Sürücü Adı' : 'Driver Name'}
                  </label>
                  <input 
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Örn: Ahmet"
                    className="w-full text-xs font-bold bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 transition-all outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Driver Surname */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    {isTr ? 'Sürücü Soyadı' : 'Driver Surname'}
                  </label>
                  <input 
                    type="text"
                    value={driverSurname}
                    onChange={(e) => setDriverSurname(e.target.value)}
                    placeholder="Örn: Yılmaz"
                    className="w-full text-xs font-bold bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 transition-all outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Driver VKN / TCKN */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                    {isTr ? 'Sürücü TCKN / VKN' : 'Driver ID Number'}
                  </label>
                  <input 
                    type="text"
                    maxLength={11}
                    value={driverVkn}
                    onChange={(e) => setDriverVkn(e.target.value)}
                    placeholder="11111111111"
                    className="w-full text-xs font-mono font-bold bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 transition-all outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Vehicle Plate Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-slate-400" />
                    {isTr ? 'Çekici Araç Plakası *' : 'Vehicle Plate Number *'}
                    <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input 
                    type="text"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    placeholder="Örn: 34ABC123"
                    className="w-full text-xs font-mono font-black uppercase tracking-wider bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 transition-all outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Trailer / Dorse Plate */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-slate-400" />
                    {isTr ? 'Dorse / Treyler Plakası' : 'Trailer Plate Number'}
                  </label>
                  <input 
                    type="text"
                    value={trailerPlate}
                    onChange={(e) => setTrailerPlate(e.target.value)}
                    placeholder="Örn: 34XYZ987"
                    className="w-full text-xs font-mono font-black uppercase tracking-wider bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 transition-all outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Prefix */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    {isTr ? 'İrsaliye Ön Eki' : 'Waybill Prefix'}
                  </label>
                  <input 
                    type="text"
                    maxLength={3}
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    placeholder="IRS"
                    className="w-full text-xs font-mono font-black uppercase bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 transition-all outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Shipping Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {isTr ? 'Fiili Sevk Tarihi' : 'Actual Shipping Date'}
                  </label>
                  <input 
                    type="date"
                    value={actualDate}
                    onChange={(e) => setActualDate(e.target.value)}
                    className="w-full text-xs font-bold bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 transition-all outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Shipping Time */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {isTr ? 'Fiili Sevk Saati' : 'Actual Shipping Time'}
                  </label>
                  <input 
                    type="time"
                    value={actualTime}
                    onChange={(e) => setActualTime(e.target.value)}
                    className="w-full text-xs font-bold bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 transition-all outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

              </div>
            </div>

            {/* Help guidelines */}
            <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100/50 p-4 text-[11px] text-indigo-950 font-medium flex gap-3">
              <HelpCircle className="h-5 w-5 text-indigo-600 shrink-0" />
              <div>
                <p className="font-bold mb-0.5">{isTr ? 'GİB ve Şematron Gereksinimleri:' : 'GİB Schematron Compliance guidelines:'}</p>
                <p>{isTr 
                  ? 'Fiili Sevk Tarihi girilmediği takdirde fatura tarihi geçerli sayılır. Sürücü kimlik numarası girilmezse varsayılan olarak "11111111111" atanacaktır. Araç çekici plakası girilmesi yasal bir zorunluluktur.'
                  : 'Vehicle plate number is mandatory. Driver national ID can fallback to "11111111111" if left unfilled.'
                }</p>
              </div>
            </div>

          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2.5 justify-between items-center">
          <div>
            {invoice.waybill_number && (
              <button 
                onClick={() => setViewHtml(!viewHtml)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50/80 rounded-xl text-xs font-bold text-slate-700 transition-all shadow-sm"
              >
                <Printer className="h-4 w-4 text-slate-500" />
                {viewHtml ? (isTr ? 'İçeriği Gizle' : 'Hide Document') : (isTr ? 'İrsaliye Görseli / Yazdır' : 'View Waybill / Print')}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {!viewHtml && (
              <button 
                disabled={loading}
                onClick={handleSaveDraft}
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-100/30 text-xs font-black text-slate-700 rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                <Save className="h-4 w-4 text-slate-500" />
                {isTr ? 'Taslak Kaydet' : 'Save Draft'}
              </button>
            )}

            {invoice.waybill_number && (
              <button 
                disabled={loading}
                onClick={handleCheckStatus}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-amber-500/10 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {isTr ? 'Durum Sorgula' : 'Check Status'}
              </button>
            )}

            {!viewHtml && (
              <button 
                disabled={loading}
                onClick={handleSendToGIB}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-indigo-600/10 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isTr ? 'Resmi İrsaliye Gönder' : 'Issue official Waybill'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
