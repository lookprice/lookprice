import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  MapPin, 
  User, 
  Smartphone, 
  Calendar, 
  Coins, 
  Send, 
  CheckCircle, 
  FileText,
  Clock,
  Briefcase,
  ExternalLink,
  ClipboardCheck
} from "lucide-react";

interface TapuTakipModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: any;
  branding?: any;
  onSaveTrack?: (updatedProperty: any) => Promise<void>;
}

export const TapuTakipModal: React.FC<TapuTakipModalProps> = ({
  isOpen,
  onClose,
  property,
  branding,
  onSaveTrack
}) => {
  const [appNumber, setAppNumber] = useState("");
  const [stage, setStage] = useState("Başvuru Yapıldı (İncelemede)");
  const [feeAmount, setFeeAmount] = useState("");
  const [feeCurrency, setFeeCurrency] = useState("TRY");
  const [appointmentDateTime, setAppointmentDateTime] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [sellerName, setSellerName] = useState(property?.owner_name || "");
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initialize from property metadata if exists
  useEffect(() => {
    if (property && property.tapu_track) {
      const track = property.tapu_track;
      setAppNumber(track.appNumber || "");
      setStage(track.stage || "Başvuru Yapıldı (İncelemede)");
      setFeeAmount(track.feeAmount || "");
      setFeeCurrency(track.feeCurrency || "TRY");
      setAppointmentDateTime(track.appointmentDateTime || "");
      setBuyerName(track.buyerName || "");
      setBuyerPhone(track.buyerPhone || "");
      setSellerName(track.sellerName || property?.owner_name || "");
    } else if (property) {
      setAppNumber("");
      setStage("Başvuru Yapıldı (İncelemede)");
      setFeeAmount("");
      setFeeCurrency("TRY");
      setAppointmentDateTime("");
      setBuyerName("");
      setBuyerPhone("");
      setSellerName(property?.owner_name || "");
    }
  }, [property]);

  if (!isOpen || !property) return null;

  const storeNameVal = branding?.store_name?.replace(/lookprice/gi, 'Seçkin') || branding?.name || 'Seçkin VIP Gayrimenkul';
  const storePhoneVal = branding?.phone || branding?.whatsapp_number || '+90 533 ...';

  // Format Appointment Date to Readable String
  const formatDateTime = (dtStr: string) => {
    if (!dtStr) return "Belirlenmedi";
    try {
      const d = new Date(dtStr);
      return d.toLocaleString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dtStr;
    }
  };

  const getStatusColor = (currentStage: string) => {
    switch (currentStage) {
      case "Başvuru Yapıldı (İncelemede)":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "Vergi ve Harç Değerlemesinde":
        return "bg-cyan-500/10 text-cyan-500 border-cyan-500/20";
      case "Ödeme Aşamasında":
        return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
      case "Randevu Günü Belirlendi":
        return "bg-teal-500/10 text-teal-500 border-teal-500/20";
      case "İmza Aşamasında (Tescil Bekliyor)":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "Tapu Devri Tamamlandı (Başarı!)":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      default:
        return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    }
  };

  const getWhatsAppMessage = (targetRole: 'buyer' | 'seller') => {
    const name = targetRole === 'buyer' ? (buyerName || "Değerli Alıcımız") : (sellerName || "Değerli Satıcımız");
    const roleLabel = targetRole === 'buyer' ? "Alıcı" : "Satıcı";
    
    const currencySym = feeCurrency === 'GBP' ? '£' : feeCurrency === 'USD' ? '$' : feeCurrency === 'EUR' ? '€' : '₺';
    const formattedFee = feeAmount ? `${currencySym}${new Intl.NumberFormat('tr-TR').format(parseFloat(feeAmount))}` : "Henüz Belirlenmedi";
    const appTime = formatDateTime(appointmentDateTime);

    return `Sayın *${name}*,\n\n*[LP-${property.id}] ${property.title}* portföyünüzün Girne/Kıbrıs Tapu Dairesi işlemleri ile ilgili tescil süreci güncellenmiştir:\n\n📂 *Tapu Başvuru No:* ${appNumber || 'İnceleme Aşamasında'}\n📊 *İşlem Aşaması:* ${stage}\n💰 *Hesaplanan Tapu Harcı:* ${formattedFee}\n📅 *Randevu Günü ve Saati:* ${appTime}\n\n*Açıklama:* Tapu dairesi randevu saatinden 15 dakika önce tüm orijinal kimlik, pasaport belgeleriniz ve ödeme makbuzları ile birlikte hazır bulunmanız önemle rica olunur.\n\nSaygılarımızla,\n*${storeNameVal}*\nİrtibat: ${storePhoneVal}`;
  };

  const handleShareWhatsApp = (role: 'buyer' | 'seller') => {
    const phone = role === 'buyer' ? buyerPhone : (property.owner_phone || "");
    const formattedPhone = phone ? phone.replace(/[^\d+]/g, '') : '';
    const message = getWhatsAppMessage(role);
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCopyClipboard = (role: 'buyer' | 'seller') => {
    const text = getWhatsAppMessage(role);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const tapuTrackData = {
        appNumber,
        stage,
        feeAmount,
        feeCurrency,
        appointmentDateTime,
        buyerName,
        buyerPhone,
        sellerName,
        updatedAt: new Date().toISOString()
      };

      if (onSaveTrack) {
        await onSaveTrack({
          ...property,
          tapu_track: tapuTrackData
        });
      }
      onClose();
    } catch (err: any) {
      alert("Hata: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-6 md:p-8 border-b border-slate-800 flex justify-between items-start shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-md">
                  KKTC TAPU TESCİL TAKİP MOTORU
                </span>
                <span className="text-[10px] text-slate-500 font-bold">Ref: LP-{property.id}</span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">{property.title}</h2>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" /> {property.location} • Bölge: {property.kktc_region || "Girne"}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content Scrollable */}
          <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 scrollbar-thin scrollbar-thumb-slate-800">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Form: Inputs */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <Briefcase className="w-4 h-4" /> Süreç ve Randevu Girişi
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Tapu Başvuru No</label>
                    <input 
                      type="text" 
                      placeholder="Örn: G-2026/894"
                      value={appNumber}
                      onChange={(e) => setAppNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 px-4 text-xs font-bold text-white placeholder-slate-700 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Mevcut Aşama</label>
                    <select
                      value={stage}
                      onChange={(e) => setStage(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 px-3 text-xs font-bold text-white outline-none transition-all cursor-pointer"
                    >
                      <option value="Başvuru Yapıldı (İncelemede)">Başvuru Yapıldı (İncelemede)</option>
                      <option value="Vergi ve Harç Değerlemesinde">Vergi ve Harç Değerlemesinde</option>
                      <option value="Ödeme Aşamasında">Ödeme Aşamasında</option>
                      <option value="Randevu Günü Belirlendi">Randevu Günü Belirlendi</option>
                      <option value="İmza Aşamasında (Tescil Bekliyor)">İmza Aşamasında (Tescil Bekliyor)</option>
                      <option value="Tapu Devri Tamamlandı (Başarı!)">Tapu Devri Tamamlandı (Başarı!)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Hesaplanan Tapu Harcı</label>
                    <div className="flex gap-1.5">
                      <input 
                        type="number" 
                        placeholder="Miktar"
                        value={feeAmount}
                        onChange={(e) => setFeeAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 px-4 text-xs font-bold text-white placeholder-slate-700 outline-none transition-all"
                      />
                      <select
                        value={feeCurrency}
                        onChange={(e) => setFeeCurrency(e.target.value)}
                        className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 px-3 text-xs font-bold text-white outline-none transition-all cursor-pointer"
                      >
                        <option value="TRY">₺ TRY</option>
                        <option value="GBP">£ GBP</option>
                        <option value="USD">$ USD</option>
                        <option value="EUR">€ EUR</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Randevu Tarih & Saat</label>
                    <input 
                      type="datetime-local"
                      value={appointmentDateTime}
                      onChange={(e) => setAppointmentDateTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 px-4 text-xs font-bold text-white outline-none transition-all"
                    />
                  </div>
                </div>

                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800 pt-3 pb-2">
                  <User className="w-4 h-4" /> Tescil Tarafları
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Alıcı Adı Soyadı</label>
                    <input 
                      type="text" 
                      placeholder="Müşteri Alıcı"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 px-4 text-xs font-bold text-white placeholder-slate-700 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Alıcı Telefonu (WhatsApp)</label>
                    <input 
                      type="tel" 
                      placeholder="+90 533 ......"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 px-4 text-xs font-bold text-white placeholder-slate-700 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Mülk Sahibi (Satıcı)</label>
                    <input 
                      type="text" 
                      placeholder="Müşteri Satıcı"
                      value={sellerName}
                      onChange={(e) => setSellerName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 px-4 text-xs font-bold text-white placeholder-slate-700 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Satıcı Telefonu</label>
                    <input 
                      type="text" 
                      value={property.owner_phone || "Mülk kaydında mevcut"}
                      disabled
                      className="w-full bg-slate-950/50 border border-slate-850 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Right Box: Live Preview & Dispatch Tools */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <CheckCircle className="w-4 h-4" /> Canlı Bilgilendirme Raporu Önizleme
                </h3>

                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-[360px]">
                  {/* Real-time styled SMS bubble */}
                  <div className="space-y-3 flex-1 overflow-y-auto pr-2 text-xs text-slate-300 leading-relaxed font-sans scrollbar-thin">
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-[10px] text-slate-500 font-bold">
                        <span>📱 WhatsApp Bilgi Kartı</span>
                        <span className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase ${getStatusColor(stage)}`}>
                          {stage}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-[11px] font-sans">
                        {getWhatsAppMessage('buyer')}
                      </p>
                    </div>
                  </div>

                  {/* Immediate Direct Send Buttons */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800">
                    <button 
                      onClick={() => handleShareWhatsApp('buyer')}
                      className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] rounded-xl flex items-center justify-center gap-1 transition-all active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" /> Alıcıya Gönder
                    </button>
                    <button 
                      onClick={() => handleShareWhatsApp('seller')}
                      className="py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[11px] rounded-xl flex items-center justify-center gap-1 transition-all active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" /> Satıcıya Gönder
                    </button>
                    
                    <button 
                      onClick={() => handleCopyClipboard('buyer')}
                      className="col-span-2 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 font-bold text-[10px] rounded-xl flex items-center justify-center gap-1 transition-all"
                    >
                      {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <ClipboardCheck className="w-3.5 h-3.5" />}
                      {copied ? "Kopyalandı!" : "Metni Panoya Kopyala"}
                    </button>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950/40 border border-slate-850 rounded-xl text-[10px] text-slate-400 font-bold space-y-1">
                  <p className="text-white">💡 TAPU TAKİP DETAYI:</p>
                  <p>Alıcı ve satıcı için tescil randevuları ve harç analizleri yapıldıktan sonra WhatsApp bildirimleri tek tıkla paylaşılabilir.</p>
                </div>
              </div>

            </div>
          </div>

          {/* Footer Save & Actions */}
          <div className="p-6 md:p-8 border-t border-slate-800 bg-slate-950/50 flex justify-between items-center shrink-0">
            <span className="text-[10px] text-slate-500 font-bold">Kayıt Tescil Arşiv Servisi</span>
            <div className="flex gap-2">
              <button 
                onClick={onClose}
                className="py-3 px-5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs rounded-xl border border-slate-800 transition-all"
              >
                Vazgeç
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl tracking-wider uppercase transition-all shadow-md active:scale-95"
              >
                {isSaving ? "Kaydediliyor..." : "Süreci Kaydet"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
