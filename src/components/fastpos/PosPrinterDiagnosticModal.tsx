import React, { useState } from "react";
import { motion } from "motion/react";
import { Printer, X, RefreshCw } from "lucide-react";
import { printThermalReceipt } from "../../utils/thermalPrinter";

export interface PosPrinterDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  branding?: any;
  autoPrintOnOrder: boolean;
  autoPrintOnPay: boolean;
  onToggleAutoPrintOrder: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleAutoPrintPay: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PosPrinterDiagnosticModal: React.FC<PosPrinterDiagnosticModalProps> = ({
  isOpen,
  onClose,
  lang,
  branding,
  autoPrintOnOrder,
  autoPrintOnPay,
  onToggleAutoPrintOrder,
  onToggleAutoPrintPay
}) => {
  const [printerDiagScenario, setPrinterDiagScenario] = useState<'success' | 'ip_conflict' | 'offline' | 'paper_jam'>('success');
  const [printerDiagStep, setPrinterDiagStep] = useState<'idle' | 'testing' | 'result'>('idle');

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-100 p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">
                {lang === 'tr' ? 'Yazıcı Durumu ve Ağ Tanı Aracı' : 'Printer Status & Diagnostics'}
              </h3>
              <p className="text-xs text-slate-400 font-semibold">
                {lang === 'tr' ? 'Yerel ağ ve donanım sorun gidericisi' : 'Local network & hardware troubleshooter'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {printerDiagStep === 'idle' && (
          <div className="space-y-4 overflow-y-auto pr-1">
            {/* Real Thermal Printer Test Card */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-200/80 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Printer className="w-4 h-4 text-amber-600" />
                    Teloca Termal Yazıcı Sınama Fişi (80mm)
                  </h4>
                  <p className="text-[11px] text-amber-800/80 font-medium">
                    Windows'a tanımlı termal yazıcıdan büyük ve okunaklı test çıktısı alın.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    printThermalReceipt({
                      title: "TERMAL YAZICI SINAMA SAYFASI",
                      storeName: branding?.store_name || branding?.name || "TELOCA CAFE",
                      storePhone: branding?.phone || branding?.whatsapp_number,
                      tableNo: "TEST MASA 1",
                      saleId: "9999",
                      items: [
                        { name: "Türk Kahvesi (Orta)", quantity: 1, price: 45 },
                        { name: "Demli Çay", quantity: 2, price: 30 },
                        { name: "Şekerli Çay", quantity: 1, price: 15 }
                      ],
                      totalAmount: 120,
                      paymentMethod: "WIN32 TEST OK",
                      notes: "Windows Sınama Sayfası Başarılı!"
                    });
                  }}
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Printer className="w-4 h-4 text-amber-200" />
                  <span>Sınama Fişi Al</span>
                </button>
              </div>

              <div className="pt-2 border-t border-amber-200/60 space-y-2">
                <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider block">
                  Otomatik Adisyon & Ödeme Fişi Ayarları:
                </span>
                <label className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-amber-200/80 cursor-pointer hover:bg-amber-50/50 transition-all">
                  <span className="text-xs font-bold text-slate-700">Adisyona Kaydet dediğimde otomatik yazdır</span>
                  <input
                    type="checkbox"
                    checked={autoPrintOnOrder}
                    onChange={onToggleAutoPrintOrder}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-amber-200/80 cursor-pointer hover:bg-amber-50/50 transition-all">
                  <span className="text-xs font-bold text-slate-700">Hesabı Kapat / Öde dediğimde otomatik yazdır</span>
                  <input
                    type="checkbox"
                    checked={autoPrintOnPay}
                    onChange={onToggleAutoPrintPay}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              {lang === 'tr' 
                ? 'Aşağıdaki panel, mutfaktaki yazıcıların IP çakışmaları, kablo bağlantı hataları veya yazıcı çevrimdışı durumlarını tespit edip yönlendirme sunar.' 
                : 'This panel detects printer IP conflicts, cable disconnected errors, or offline status and provides user-friendly instructions.'}
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                {lang === 'tr' ? 'Simüle Edilecek Durumu Seçin:' : 'Select Scenario to Simulate:'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button 
                  onClick={() => setPrinterDiagScenario('success')}
                  className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${printerDiagScenario === 'success' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                >
                  ✅ {lang === 'tr' ? 'Her Şey Yolunda (Sorunsuz)' : 'All Good (Healthy)'}
                </button>
                <button 
                  onClick={() => setPrinterDiagScenario('ip_conflict')}
                  className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${printerDiagScenario === 'ip_conflict' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                >
                  ⚠️ {lang === 'tr' ? 'IP Adresi Çakışması Hatası' : 'IP Address Conflict'}
                </button>
                <button 
                  onClick={() => setPrinterDiagScenario('offline')}
                  className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${printerDiagScenario === 'offline' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                >
                  🔌 {lang === 'tr' ? 'Yazıcı Çevrimdışı / Kablo Yok' : 'Printer Offline / Cable Loose'}
                </button>
                <button 
                  onClick={() => setPrinterDiagScenario('paper_jam')}
                  className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${printerDiagScenario === 'paper_jam' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                >
                  📄 {lang === 'tr' ? 'Kapak Açık / Kağıt Bitti' : 'Cover Open / Out of Paper'}
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setPrinterDiagStep('testing');
                setTimeout(() => {
                  setPrinterDiagStep('result');
                }, 1500);
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/10 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4 animate-spin-slow" />
              <span>{lang === 'tr' ? 'Tanılamayı Başlat (Ping & Durum)' : 'Start Diagnostics (Ping & Status)'}</span>
            </button>
          </div>
        )}

        {printerDiagStep === 'testing' && (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-600 animate-pulse">
              {lang === 'tr' ? 'Yazıcıya Ping Gönderiliyor, Ağ Durumu Analiz Ediliyor...' : 'Pinging printer, analyzing network state...'}
            </p>
          </div>
        )}

        {printerDiagStep === 'result' && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-500">{lang === 'tr' ? 'Mutfak Yazıcı IP Adresi' : 'Kitchen Printer IP'}</span>
                <span className="text-slate-700">192.168.1.102</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-500">{lang === 'tr' ? 'Print Server İletişimi' : 'Print Server Link'}</span>
                <span className={printerDiagScenario === 'offline' ? 'text-rose-600' : 'text-emerald-600'}>
                  {printerDiagScenario === 'offline' ? 'FAILED' : 'OK'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-500">{lang === 'tr' ? 'Ağ Paket Kaybı (Loss)' : 'Packet Loss'}</span>
                <span className={printerDiagScenario === 'offline' ? 'text-rose-600' : 'text-emerald-600'}>
                  {printerDiagScenario === 'offline' ? '100%' : '0%'}
                </span>
              </div>
            </div>

            {printerDiagScenario === 'success' && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 text-xs font-medium leading-relaxed">
                <h4 className="font-bold text-sm mb-1">✅ {lang === 'tr' ? 'Yazıcı Sağlıklı Çalışıyor' : 'Printer is Healthy'}</h4>
                {lang === 'tr' 
                  ? 'Yazıcınız yerel ağda başarıyla tespit edildi. Kağıt rulosu yeterli ve herhangi bir IP çakışması saptanmadı. Sipariş çıktısı alabilirsiniz.' 
                  : 'Your printer is successfully detected. Paper is sufficient and no IP conflict found. You can print orders.'}
              </div>
            )}

            {printerDiagScenario === 'ip_conflict' && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-900 text-xs leading-relaxed">
                <h4 className="font-bold text-sm mb-1 text-amber-800">⚠️ {lang === 'tr' ? 'IP Adresi Çakışması Tespit Edildi!' : 'IP Address Conflict Detected!'}</h4>
                <p className="mb-2">
                  {lang === 'tr'
                    ? 'Mutfak Yazıcısının IP adresi (192.168.1.102) yerel ağdaki başka bir akıllı cihaz veya cep telefonu tarafından işgal edilmiş durumda!'
                    : 'The Kitchen Printer IP address (192.168.1.102) is being used by another device (like a smartphone or TV) on your network.'}
                </p>
                <span className="font-bold block mt-2 text-amber-900">{lang === 'tr' ? 'Çözüm Önerisi:' : 'Solution:'}</span>
                <ul className="list-disc list-inside space-y-1 mt-1 font-semibold text-amber-800">
                  <li>{lang === 'tr' ? 'Mutfak yazıcısını kapatıp tekrar açın.' : 'Turn the printer off and on again.'}</li>
                  <li>{lang === 'tr' ? 'Yazıcınıza modem arayüzünden statik (sabit) bir IP adresi atayın.' : 'Assign a static IP address to the printer via your router settings.'}</li>
                  <li>{lang === 'tr' ? 'Yerel ağdaki diğer cihazların DHCP üzerinden çakışma yapmasını önlemek için modemi yeniden başlatın.' : 'Restart the router to clear DHCP IP allocation conflicts.'}</li>
                </ul>
              </div>
            )}

            {printerDiagScenario === 'offline' && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-900 text-xs leading-relaxed">
                <h4 className="font-bold text-sm mb-1 text-rose-800">🔌 {lang === 'tr' ? 'Yazıcı Çevrimdışı / Bağlantı Koptu' : 'Printer Offline / Disconnected'}</h4>
                <p className="mb-2">
                  {lang === 'tr'
                    ? 'Yazıcı ile yerel ağ üzerinden bağlantı kurulamadı. Print Server (Print-Daemon) çalışıyor ancak fiziksel yazıcıya erişemiyor.'
                    : 'Could not connect to the printer over the local network. The Print Server daemon is running but cannot reach the hardware.'}
                </p>
                <span className="font-bold block mt-2 text-rose-900">{lang === 'tr' ? 'Çözüm Önerisi:' : 'Solution:'}</span>
                <ul className="list-disc list-inside space-y-1 mt-1 font-semibold text-rose-800">
                  <li>{lang === 'tr' ? 'Ethernet / LAN kablosunun yazıcının arkasına ve modeme tam oturduğundan emin olun.' : 'Ensure the Ethernet/LAN cable is plugged securely into the printer and router.'}</li>
                  <li>{lang === 'tr' ? 'Yazıcının güç ışığının yandığından emin olun.' : 'Check if the printer power light is green.'}</li>
                  <li>{lang === 'tr' ? 'Modemdeki yeşil LAN ışığının yanıp söndüğünü kontrol edin.' : 'Verify if the green LAN light is flashing on your router.'}</li>
                </ul>
              </div>
            )}

            {printerDiagScenario === 'paper_jam' && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-900 text-xs leading-relaxed">
                <h4 className="font-bold text-sm mb-1 text-rose-800">📄 {lang === 'tr' ? 'Kağıt Sıkışması / Kapak Açık' : 'Paper Jam / Cover Open'}</h4>
                <p className="mb-2">
                  {lang === 'tr'
                    ? 'Yazıcı ağda aktif ancak donanım hatası bildiriyor. Kağıt rulosu bitmiş, rulo sıkışmış veya üst kapak tam kapanmamış.'
                    : 'Printer is active on the network but reporting a hardware error. Paper is empty, jammed, or the top lid is not closed properly.'}
                </p>
                <span className="font-bold block mt-2 text-rose-900">{lang === 'tr' ? 'Çözüm Önerisi:' : 'Solution:'}</span>
                <ul className="list-disc list-inside space-y-1 mt-1 font-semibold text-rose-800">
                  <li>{lang === 'tr' ? 'Yazıcının kapağını açıp kağıt rulosunu düzeltin veya yeni bir rulo takın.' : 'Open the lid, adjust the paper roll, or install a new paper roll.'}</li>
                  <li>{lang === 'tr' ? 'Kapağı sertçe bastırarak tam oturduğundan emin olun.' : 'Ensure the cover click-locks completely shut.'}</li>
                  <li>{lang === 'tr' ? 'Hata ışığının sönüp sönmediğini takip edin.' : 'Check if the red error LED goes off.'}</li>
                </ul>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setPrinterDiagStep('idle')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
              >
                {lang === 'tr' ? 'Yeniden Test Et' : 'Test Again'}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all"
              >
                {lang === 'tr' ? 'Kapat' : 'Close'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
