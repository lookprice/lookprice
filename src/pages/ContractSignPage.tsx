import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Check, 
  PenTool, 
  RotateCcw, 
  Send, 
  CheckCircle, 
  FileText, 
  User, 
  Building, 
  Calendar,
  AlertTriangle,
  Award,
  Lock,
  Smartphone
} from "lucide-react";

export default function ContractSignPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const clientNameParam = searchParams.get("client") || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemData, setItemData] = useState<any>(null);
  const [isVehicle, setIsVehicle] = useState(false);
  const [clientName, setClientName] = useState(clientNameParam);
  const [clientPhone, setClientPhone] = useState("");
  const [signed, setSigned] = useState(false);
  const [isSigningActive, setIsSigningActive] = useState(false);
  const [success, setSuccess] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    if (!id) {
      setError("Sözleşme ID bulunamadı.");
      setLoading(false);
      return;
    }

    const checkAndFetch = async () => {
      try {
        if (id.startsWith("vehicle-")) {
          setIsVehicle(true);
          const realVehicleId = id.replace("vehicle-", "");
          const res = await fetch(`/api/public/vehicles/${realVehicleId}`);
          if (!res.ok) throw new Error("Araç bulunamadı.");
          const data = await res.json();
          setItemData(data);
        } else {
          setIsVehicle(false);
          const res = await fetch(`/api/public/real-estate/${id}`);
          if (!res.ok) throw new Error("Gayrimenkul bulunamadı.");
          const data = await res.json();
          setItemData(data);
        }
      } catch (err: any) {
        setError(err.message || "Veri yüklenirken hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    checkAndFetch();
  }, [id]);

  // Canvas drawing handlers for signature
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    isDrawing.current = true;
    const pos = getEventPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getEventPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1e1b4b"; // Indigo-950
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    setIsSigningActive(true);
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsSigningActive(false);
  };

  const getEventPos = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const handleApprove = () => {
    if (!clientName.trim()) {
      alert("Lütfen isminizi giriniz.");
      return;
    }
    if (!isSigningActive) {
      alert("Lütfen parmağınızla imza alanına imzanızı atınız.");
      return;
    }
    setSigned(true);
    setSuccess(true);
  };

  const formatCurrency = (val: any, currency: string) => {
    if (val === undefined || val === null || val === "") return "0";
    const symbol = currency === "GBP" ? "£" : currency === "USD" ? "$" : currency === "EUR" ? "€" : "₺";
    return `${symbol}${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(Math.round(val))}`;
  };

  const sendNotificationToAgent = () => {
    if (!itemData) return;
    const formattedPhone = itemData.store_phone ? itemData.store_phone.replace(/[^\d+]/g, "") : "";
    const targetTitle = isVehicle ? `${itemData.brand} ${itemData.model}` : itemData.title;
    const message = `Ortağım! *${clientName}* az önce gönderdiğin dijital sözleşmeyi onaylayıp imzaladı! 🎉✍️\n\n*Mülk/Araç:* ${targetTitle}\n*İmzalayan:* ${clientName}\n*Telefon:* ${clientPhone || "Belirtilmedi"}\n*Sözleşme ID:* LP-${id}\n\nDetayları ofis yönetim panelindeki cari ve hareket kütüğünden hemen inceleyebilirsin.`;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-400">Güvenli Bağlantı Kuruluyor, Lütfen Bekleyin...</p>
      </div>
    );
  }

  if (error || !itemData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] max-w-md w-full text-center shadow-2xl">
          <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto mb-4 animate-bounce" />
          <h2 className="text-xl font-black mb-2">Bağlantı Hatası</h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">{error || "Sözleşme verisi çekilemedi."}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl tracking-wider uppercase transition-all"
          >
            Yeniden Dene
          </button>
        </div>
      </div>
    );
  }

  const storeName = itemData.store_name?.replace(/lookprice/gi, "Seçkin") || "Seçkin VIP Portföy";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 md:p-8 font-sans">
      <AnimatePresence mode="wait">
        {!success ? (
          <motion.div 
            key="sign-flow"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-4xl bg-slate-900 border border-slate-800/80 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row h-full lg:h-[85vh]"
          >
            {/* Left Column: Contract Terms Viewer */}
            <div className="lg:w-7/12 p-6 md:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900/40">
              <div>
                {/* Contract Badge & Title */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Lock className="w-3 h-3" /> SSL GÜVENLİ ONAY SİSTEMİ
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Sözleşme No: LP-{id}</span>
                </div>

                <h1 className="text-2xl font-black tracking-tight text-white mb-6">
                  {isVehicle ? "Araç Emanet & Satış Aracılık Protokolü" : "Emlak Hizmet Ortaklığı & Komisyon Sözleşmesi"}
                </h1>

                {/* Main details list */}
                <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-950/55 p-4 rounded-2xl border border-slate-850">
                  <div className="flex items-start gap-2">
                    {isVehicle ? <Smartphone className="w-4 h-4 text-slate-500 mt-0.5" /> : <Building className="w-4 h-4 text-slate-500 mt-0.5" />}
                    <div className="truncate">
                      <span className="block text-[8px] font-bold text-slate-500 uppercase leading-none mb-1">Portföy Detayı</span>
                      <span className="text-xs font-bold text-white block truncate">
                        {isVehicle ? `${itemData.brand} ${itemData.model}` : itemData.title}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-slate-500 mt-0.5" />
                    <div className="truncate">
                      <span className="block text-[8px] font-bold text-slate-500 uppercase leading-none mb-1">Yetkili Acente / Ofis</span>
                      <span className="text-xs font-bold text-white block truncate">{storeName}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 col-span-2 border-t border-slate-800/50 pt-3 mt-1">
                    <Calendar className="w-4 h-4 text-slate-500 mt-0.5" />
                    <div>
                      <span className="block text-[8px] font-bold text-slate-500 uppercase leading-none mb-1">Protokol Değeri & Koşullar</span>
                      <span className="text-xs font-extrabold text-indigo-400 block">
                        {isVehicle 
                          ? `Fiyat: ${formatCurrency(itemData.selling_price || itemData.price, itemData.currency || "TRY")} | Model Yılı: ${itemData.year || "Belirtilmedi"}`
                          : `Fiyat: ${formatCurrency(itemData.price, itemData.currency || "GBP")} | Konum: ${itemData.location || "Girne"}`
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Legally binding scrolling terms */}
                <div className="bg-slate-950/80 border border-slate-850 rounded-2xl p-4 h-[220px] lg:h-[280px] overflow-y-auto text-[11px] text-slate-400 leading-relaxed font-sans space-y-4 pr-3 scrollbar-thin scrollbar-thumb-slate-800">
                  <p className="font-bold text-white">1. SÖZLEŞMENİN TARAFLARI VE KONUSU</p>
                  <p>
                    Bu sözleşme, bir tarafta yukarıda belirtilen mülk veya aracın hak sahibi ("Hizmet Alan / Satıcı") ile diğer tarafta yetkili aracı kurum olan <strong>{storeName}</strong> ("Galeri / Ofis") arasında dijital ortamda onaylanmak üzere tanzim edilmiştir. İşbu belgenin konusu, mülkün/aracın satışı, pazarlanması, alıcı adayı bulunması ve taraflar arasındaki komisyon haklarının güvence altına alınmasıdır.
                  </p>

                  <p className="font-bold text-white">2. PAZARLAMA VE YETKİ KOŞULLARI</p>
                  {isVehicle ? (
                    <p>
                      Hizmet Alan, mülkiyetindeki aracı satılması amacıyla Galeri'ye emanet statüsünde teslim etmeyi veya Galeri kanallarından ilan edilmesini kabul eder. Galeri, aracın internet portalları ve fiziki showroomlarda en iyi şekilde pazarlanmasından sorumludur. Hizmet alan, Galeri'nin bilgisi dışında aracı üçüncü şahıslara veya Galeri'nin yönlendirdiği müşterilere satamaz.
                    </p>
                  ) : (
                    <p>
                      Mülk sahibi, söz konusu gayrimenkulün pazarlanması hususunda Acente'ye tam yetki verdiğini beyan eder. Acente, her türlü reklam, afiş ve sosyal medya pazarlamasını üstlenir. Malik, Acente'yi devre dışı bırakarak doğrudan veya dolaylı olarak alıcı ile temas kurup satış gerçekleştiremez.
                    </p>
                  )}

                  <p className="font-bold text-white">3. ARACILIK HİZMET BEDELİ (KOMİSYON)</p>
                  <p>
                    Mülk veya aracın tescil ve satışı tamamlandığında, alıcı ve satıcı aracı kuruma yasal komisyon bedeli ödemekle mükelleftir. Bu komisyon bedeli aksi yazılı olarak kararlaştırılmadıkça lüks emlak segmentinde toplam bedel üzerinden <strong>%5</strong>, otomotiv segmentinde ise Galeri liste fiyatı üzerinden <strong>%3</strong> artı KDV olarak hesaplanır. Satıcı, acenteyi aradan çıkartarak satış yaparsa dahi cezai şart olarak bu komisyonun iki katını ödemeyi kabul eder.
                  </p>

                  <p className="font-bold text-white">4. GİZLİLİK VE ANLAŞMAZLIKLARIN ÇÖZÜMÜ</p>
                  <p>
                    İşbu sözleşmenin detayları, her iki tarafın ticari sırrı olup üçüncü kişilerle paylaşılamaz. Sözleşmeden doğacak her türlü ihtilafta, Kuzey Kıbrıs Türk Cumhuriyeti (Girne/Lefkoşa) Mahkemeleri ve İcra Daireleri yetkilidir. Dijital olarak parmak veya ıslak imza simülasyonu ile onaylanan bu sözleşme yasal olarak delil niteliği taşımaktadır.
                  </p>
                </div>
              </div>

              {/* Secure Stamp text */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[9px] text-slate-500 font-bold">
                <span>LOOKPRICE SECURE PLATFORM v3.2</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <CheckCircle className="w-3 h-3 text-emerald-500" /> %100 Yasal ve Delil Statüsündedir
                </span>
              </div>
            </div>

            {/* Right Column: Signature Pad Form */}
            <div className="lg:w-5/12 p-6 md:p-8 flex flex-col justify-between bg-slate-900/80">
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-indigo-400 font-black text-xs uppercase tracking-wider">
                  <PenTool className="w-4 h-4" /> DİJİTAL ONAY & İMZA PANELİ
                </div>

                <p className="text-slate-400 text-xs leading-relaxed">
                  Lütfen aşağıdaki alanları doldurun ve altındaki imza alanına parmağınızla/mouse ile imzanızı atarak onaylayın.
                </p>

                {/* Input Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none mb-1.5">SÖZLEŞMEYİ ONAYLAYAN ADI SOYADI</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input 
                        type="text" 
                        placeholder="Adınız Soyadınız" 
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-white placeholder-slate-600 focus:ring-0 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none mb-1.5">İLETİŞİM TELEFON NUMARASI</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input 
                        type="tel" 
                        placeholder="+90 533 ......" 
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-white placeholder-slate-600 focus:ring-0 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Canvas Signature Box */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">PARMAĞINIZLA BURAYA İMZALAYIN</label>
                    <button 
                      onClick={clearCanvas}
                      className="text-[9.5px] font-extrabold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 uppercase transition-all"
                    >
                      <RotateCcw className="w-3 h-3" /> Temizle
                    </button>
                  </div>

                  <div className="border border-slate-800 rounded-2xl overflow-hidden bg-white relative">
                    <canvas 
                      ref={canvasRef}
                      width={320}
                      height={180}
                      className="w-full h-[160px] cursor-crosshair block touch-none"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                    
                    {!isSigningActive && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase flex items-center gap-1 animate-pulse">
                          ✍️ BURAYA PARMAKLA ÇİZİN
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Approval Trigger */}
              <div className="mt-6">
                <button 
                  onClick={handleApprove}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl tracking-widest uppercase transition-all shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <Check className="w-4 h-4" /> SÖZLEŞMEYİ ONAYLA VE İMZALA
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="success-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[3rem] p-8 text-center shadow-2xl relative overflow-hidden"
          >
            {/* Glowing Success Background */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-20 h-20 bg-emerald-500/15 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-emerald-400" />
            </div>

            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black tracking-wider uppercase px-3 py-1.5 rounded-full mb-3 inline-block">
              DIJITAL SÖZLEŞME ONAYLANDI
            </span>

            <h2 className="text-2xl font-black text-white tracking-tight mb-2">Tebrikler, İşlem Tamamlandı!</h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-6 max-w-sm mx-auto">
              Sözleşmeniz dijital zaman damgası ve parmak izi tesciliyle birlikte onaylanmıştır. Belge, arşivimize şifreli olarak güvenle kaydedilmiştir.
            </p>

            {/* Time Stamp Card */}
            <div className="bg-slate-950/70 border border-slate-850 p-4 rounded-2xl text-left space-y-2 mb-6 text-xs max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">İmzalayan:</span>
                <span className="text-white font-extrabold">{clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Tarih / Saat:</span>
                <span className="text-indigo-400 font-extrabold">{new Date().toLocaleString("tr-TR")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Zaman Damgası SHA-256:</span>
                <span className="text-slate-400 font-mono text-[9px]">
                  LP-ONAY-{Math.random().toString(36).substring(2, 10).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="space-y-2.5 max-w-md mx-auto">
              <button 
                onClick={sendNotificationToAgent}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                <Send className="w-4 h-4" /> Danışmana WhatsApp ile Bildir
              </button>
              
              <p className="text-[10px] text-slate-500 font-bold leading-normal">
                WhatsApp ile bildir butonuna bastığınızda, saniyeler içinde sözleşmenizin onay bilgisi danışmanın ofis paneline iletilecektir.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
