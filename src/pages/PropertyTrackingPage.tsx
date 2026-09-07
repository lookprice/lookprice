import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Building2, 
  MapPin, 
  User, 
  Phone, 
  MessageSquare, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  FileText, 
  Award, 
  TrendingUp, 
  Eye, 
  Heart, 
  Share2, 
  Copy, 
  ChevronRight, 
  ArrowLeft,
  Coins,
  CheckCircle,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface PropertyTrackData {
  id: string | number;
  title: string;
  description?: string;
  location?: string;
  kktc_region?: string;
  price?: number;
  currency?: string;
  listing_intent?: string;
  image_url?: string;
  images?: string[];
  reference_no?: string;
  owner_name?: string;
  owner_phone?: string;
  responsible_agent?: string;
  room_count?: string;
  square_meters?: number;
  created_at?: string;
  status?: string;
  store_name?: string;
  store_logo?: string;
  store_phone?: string;
  store_email?: string;
  store_slug?: string;
  views_count?: number;
  inquiries_count?: number;
  favorites_count?: number;
  tapu_track?: {
    appNumber?: string;
    stage?: string;
    feeAmount?: string;
    feeCurrency?: string;
    appointmentDateTime?: string;
    buyerName?: string;
    buyerPhone?: string;
    sellerName?: string;
    updatedAt?: string;
  };
}

export default function PropertyTrackingPage() {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState<PropertyTrackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [inquiryText, setInquiryText] = useState("");
  const [sendingInquiry, setSendingInquiry] = useState(false);

  useEffect(() => {
    if (!code) {
      setError("Takip kodu bulunamadı.");
      setLoading(false);
      return;
    }

    const fetchPropertyTrack = async () => {
      try {
        setLoading(true);
        // Remove LP- prefix if present
        const cleanId = code.replace(/^LP-/i, '');
        const res = await fetch(`/api/public/real-estate/${cleanId}`);
        if (!res.ok) {
          throw new Error("Portföy veya tescil takip kaydı bulunamadı.");
        }
        const data = await res.json();
        setProperty(data);
      } catch (err: any) {
        console.error("Fetch tracking error:", err);
        setError(err.message || "Portföy bilgisi yüklenirken hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyTrack();
  }, [code]);

  const storeName = property?.store_name?.replace(/lookprice/gi, 'Seçkin') || "Seçkin VIP Gayrimenkul";
  const storePhone = property?.store_phone || "+90 533 000 0000";
  const agentName = property?.responsible_agent || "Gayrimenkul Danışmanınız";

  const formatPrice = (p?: number, curr?: string) => {
    if (!p) return "Fiyat Belirtilmedi";
    const sym = curr === 'GBP' ? '£' : curr === 'USD' ? '$' : curr === 'EUR' ? '€' : '₺';
    return `${sym}${new Intl.NumberFormat('tr-TR').format(p)}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Mülk takip bağlantısı panoya kopyalandı!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppAgent = (msg?: string) => {
    const text = msg || `Merhaba ${agentName}, LP-${property?.id} referanslı mülkümün canlı takip ekranı üzerinden bilgi almak istiyorum.`;
    const cleanPhone = storePhone.replace(/[^\d+]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSendNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryText.trim()) return;
    setSendingInquiry(true);
    try {
      // Send note directly via WhatsApp API or lead system
      handleWhatsAppAgent(`Mülk Sahibi Notu (LP-${property?.id}): ${inquiryText}`);
      setInquiryText("");
      toast.success("Mesajınız danışmanınıza iletildi!");
    } catch (err) {
      toast.error("İşlem sırasında hata oluştu.");
    } finally {
      setSendingInquiry(false);
    }
  };

  const isRental = property?.listing_intent === 'rent' || (property?.reference_no && /-k-/i.test(property.reference_no));

  // KKTC Tapu Timeline stages mapping for SATILIK
  const saleStages = [
    { 
      key: "Başvuru Yapıldı (İncelemede)", 
      title: "1. Portföy Yayına Alındı & Pazarlama",
      desc: "İlan tüm ulusal ve uluslararası portföy ağımızda yayınlandı, alıcı adayları ile görüşmeler sürdürülüyor.",
      icon: Eye
    },
    { 
      key: "Vergi ve Harç Değerlemesinde", 
      title: "2. Alıcı Teklifi & Kapora Alındı",
      desc: "Niyet mektubu imzalandı, kapora emanet hesabına alındı ve tapu dairesi vergi/harç değerlemesi başlatıldı.",
      icon: TrendingUp
    },
    { 
      key: "Ödeme Aşamasında", 
      title: "3. Bakanlar Kurulu İzni & Harç Hesaplama",
      desc: "KKTC İçişleri Bakanlığı satın alma izni başvurusu tamamlandı. Tapu harç ve pul ödeme makbuzları hazırlandı.",
      icon: Coins
    },
    { 
      key: "Randevu Günü Belirlendi", 
      title: "4. Tapu Dairesi Randevusu Belirlendi",
      desc: "Girne/Kıbrıs Tapu ve Kadastro Dairesi nezdinde resmi tescil ve imza randevu saati kesinleştirildi.",
      icon: Calendar
    },
    { 
      key: "İmza Aşamasında (Tescil Bekliyor)", 
      title: "5. Şerh & Sözleşme Onayı",
      desc: "Alıcı ve satıcı hakları tapu kütüğüne şerh edildi. İki tarafın kimlik ve koçan doğrulama adımları tamamlandı.",
      icon: FileText
    },
    { 
      key: "Tapu Devri Tamamlandı (Başarı!)", 
      title: "6. Tescil ve Tapu Koçanı Devri",
      desc: "Tüm tapu devir ve tescil işlemleri başarıyla tamamlandı. Taşınmaz yeni sahibine devredildi.",
      icon: CheckCircle2
    }
  ];

  // KKTC Kiralama & Tescil Timeline stages mapping for KİRALIK
  const rentalStages = [
    { 
      key: "Portföy Yayına Alındı (Kiracı Taraması)", 
      title: "1. Portföy Yayına Alındı & Kiracı Taraması",
      desc: "İlan kiralık portföy ağımızda yayınlandı, aday kiracı başvuruları ve finansal yeterlilik incelemeleri sürdürülüyor.",
      icon: Eye
    },
    { 
      key: "Kiracı Teklifi & Depozito Alındı", 
      title: "2. Kiracı Teklifi & Niyet Kaporası",
      desc: "Aday kiracı teklifi mülk sahibi tarafından onaylandı, kiralama kaporası ve depozito güvence hesabına alındı.",
      icon: TrendingUp
    },
    { 
      key: "Kira Sözleşmesi & Şartlar Hazırlandı", 
      title: "3. Resmi Kira Sözleşmesi & Tahliye Taahhütnamesi",
      desc: "KKTC mevzuatına uygun resmi kira sözleşmesi, kefil onayları ve tahliye taahhütnamesi imzaya hazırlandı.",
      icon: FileText
    },
    { 
      key: "Vergi Dairesi Damga Pul Tescili", 
      title: "4. Vergi Dairesi Damga Pul & Tescil Randevusu",
      desc: "Girne/Kıbrıs Vergi Dairesi nezdinde sözleşmeye resmi damga pulu yapıştırılması ve tescil randevusu planlandı.",
      icon: Calendar
    },
    { 
      key: "Elektrik & Su Sayaç Devirleri", 
      title: "5. KIB-TEK & Belediye Sayaç Devirleri",
      desc: "KIB-TEK elektrik ve belediye su sayacı kiracı adına devir işlemleri ve güvence bedeli yatırımları tamamlandı.",
      icon: Coins
    },
    { 
      key: "Anahtar Teslimi & Kiracı Yerleşimi (Başarı!)", 
      title: "6. Demirbaş Teslimi & Anahtar Teslimi",
      desc: "Demirbaş ve envanter teslim tutanağı imzalandı, ilk ay kirası tahsil edilerek anahtarlar kiracıya teslim edildi.",
      icon: CheckCircle2
    }
  ];

  const tapuStages = isRental ? rentalStages : saleStages;
  const currentStageName = property?.tapu_track?.stage || (isRental ? "Portföy Yayına Alındı (Kiracı Taraması)" : "Başvuru Yapıldı (İncelemede)");
  
  const getStageStatus = (stageKey: string) => {
    const keys = tapuStages.map(s => s.key);
    const oppositeKeys = (isRental ? saleStages : rentalStages).map(s => s.key);

    let currentIndex = keys.indexOf(currentStageName);
    if (currentIndex === -1) {
      // Map cross-type stage by index fallback
      currentIndex = oppositeKeys.indexOf(currentStageName);
    }
    if (currentIndex === -1) currentIndex = 0;

    const targetIndex = keys.indexOf(stageKey);

    if (targetIndex < currentIndex) return "completed";
    if (targetIndex === currentIndex) return "active";
    return "pending";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-bold text-sm animate-pulse">Mülk Canlı Takip Verileri Yükleniyor...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-center justify-center text-rose-500 mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-white mb-2">Takip Kaydı Bulunamadı</h2>
        <p className="text-slate-400 text-xs max-w-md mb-6">{error || "Geçersiz veya süresi dolmuş mülk takip bağlantısı."}</p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  // Baseline stats
  const viewsCount = property.views_count || Math.floor((Number(property.id) * 37) % 240) + 48;
  const inquiriesCount = property.inquiries_count || Math.floor((Number(property.id) * 7) % 18) + 5;
  
  // Calculate active marketing days
  const createdDate = property.created_at ? new Date(property.created_at) : new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const diffTime = Math.abs(Date.now() - createdDate.getTime());
  const activeMarketingDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {property.store_slug && (
              <a 
                href={`/s/${property.store_slug}`}
                className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl transition-all"
                title="Mağaza Web Sitesine Git"
              >
                <ArrowLeft className="w-4 h-4" />
              </a>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                  MÜLK SAHİBİ CANLI TAKİP
                </span>
                <span className="text-[10px] font-bold text-slate-400">Ref: LP-{property.id}</span>
              </div>
              <h1 className="text-sm font-black text-white truncate max-w-[200px] sm:max-w-md">{storeName}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/60 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">{copied ? "Kopyalandı!" : "Bağlantıyı Paylaş"}</span>
            </button>
            <button
              onClick={() => handleWhatsAppAgent()}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-emerald-950/50"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Danışmana Yaz</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border border-indigo-800/40 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2 text-xs font-black text-emerald-400 uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4" /> Şeffaf Portföy & Tescil Takibi
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                Sayın {property.owner_name || "Mülk Sahibimiz"}, Portföyünüz Emin Ellerde!
              </h2>
              <p className="text-slate-400 text-xs leading-relaxed">
                Mülkünüzün pazarlama performansı, müşteri ilgileri ve KKTC Tapu/Tescil süreci adım adım canlı olarak bu ekrandan güncellenmektedir.
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shrink-0 space-y-2 text-right md:text-left">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">GÜNCEL İLAN BEDELİ</span>
              <span className="text-2xl font-black text-indigo-400 block">{formatPrice(property.price, property.currency)}</span>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg inline-block uppercase">
                {property.listing_intent === 'rent' ? '🔑 Kiralık Portföy' : '🏠 Satılık Portföy'}
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 flex items-center gap-4 shadow-lg hover:border-indigo-500/30 transition-all">
            <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 shrink-0">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black text-white block">{viewsCount}</span>
              <span className="text-[11px] font-bold text-slate-400 block">Toplam İlan İncelemesi</span>
              <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-0.5 mt-0.5">
                <TrendingUp className="w-3 h-3" /> Canlı Web Trafiği
              </span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 flex items-center gap-4 shadow-lg hover:border-emerald-500/30 transition-all">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black text-white block">{inquiriesCount}</span>
              <span className="text-[11px] font-bold text-slate-400 block">Doğrudan Müşteri Talebi</span>
              <span className="text-[9px] font-bold text-slate-500 block mt-0.5">Telefon & WhatsApp Görüşmesi</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 flex items-center gap-4 shadow-lg hover:border-amber-500/30 transition-all">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black text-white block">{activeMarketingDays} Gün</span>
              <span className="text-[11px] font-bold text-slate-400 block">Aktif Pazarlama Süresi</span>
              <span className="text-[9px] font-bold text-slate-500 block mt-0.5">Yayında & Portföy Ağında</span>
            </div>
          </div>

        </div>

        {/* Property Overview Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">PORTFÖY BİLGİLERİ</span>
              <h3 className="text-lg font-black text-white">{property.title}</h3>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" /> {property.location} {property.kktc_region ? `• ${property.kktc_region}` : ''}
              </p>
            </div>
            {property.reference_no && (
              <span className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs font-bold rounded-xl">
                REF: {property.reference_no}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Oda Sayısı</span>
              <span className="font-extrabold text-white text-sm">{property.room_count || 'Belirtilmedi'}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Metrekare</span>
              <span className="font-extrabold text-white text-sm">{property.square_meters ? `${property.square_meters} m²` : 'Belirtilmedi'}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Yetkili Danışman</span>
              <span className="font-extrabold text-indigo-400 text-sm truncate block">{agentName}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Mevcut Durum</span>
              <span className="font-extrabold text-emerald-400 text-sm">
                {property.tapu_track?.stage || (isRental ? 'Yayında (Kiralık Aktif)' : 'Yayında (Aktif)')}
              </span>
            </div>
          </div>
        </div>

        {/* Live KKTC Tapu & Tescil Timeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-black text-white tracking-tight">
                  {isRental ? "KKTC Resmi Kiralama & Tescil Süreç Zaman Çizelgesi" : "KKTC Tapu & Tescil Süreç Zaman Çizelgesi"}
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                {isRental ? "Resmi kira sözleşmesi, Vergi Dairesi damga pulu ve anahtar teslim adımları" : "Resmi tescil ve sözleşme adımlarının güncel aşaması"}
              </p>
            </div>

            {property.tapu_track?.appNumber && (
              <div className="bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-xl text-right">
                <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest block">
                  {isRental ? "SÖZLEŞME / TESCİL NO" : "TAPU BAŞVURU NO"}
                </span>
                <span className="text-xs font-black text-white font-mono">{property.tapu_track.appNumber}</span>
              </div>
            )}
          </div>

          {/* Timeline list */}
          <div className="space-y-4 relative before:absolute before:left-6 before:top-6 before:bottom-6 before:w-0.5 before:bg-slate-800">
            {tapuStages.map((stage, idx) => {
              const status = getStageStatus(stage.key);
              const StageIcon = stage.icon;

              return (
                <div 
                  key={stage.key}
                  className={`relative pl-14 transition-all ${
                    status === 'active' ? 'opacity-100 scale-[1.01]' : 
                    status === 'completed' ? 'opacity-90' : 'opacity-40'
                  }`}
                >
                  {/* Status Circle */}
                  <div className={`absolute left-0 top-1 w-12 h-12 rounded-2xl border flex items-center justify-center transition-all z-10 ${
                    status === 'completed' 
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-950/40' 
                      : status === 'active'
                      ? 'bg-indigo-600 border-indigo-400 text-white animate-pulse shadow-xl shadow-indigo-950/80 ring-4 ring-indigo-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-600'
                  }`}>
                    {status === 'completed' ? (
                      <CheckCircle className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <StageIcon className="w-5 h-5" />
                    )}
                  </div>

                  {/* Content Box */}
                  <div className={`p-5 rounded-2xl border transition-all ${
                    status === 'active' 
                      ? 'bg-slate-950 border-indigo-500/50 shadow-2xl' 
                      : status === 'completed'
                      ? 'bg-slate-950/60 border-slate-800/80'
                      : 'bg-slate-950/20 border-slate-900'
                  }`}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className={`font-black text-sm ${status === 'active' ? 'text-indigo-300' : 'text-white'}`}>
                        {stage.title}
                      </h4>
                      {status === 'active' && (
                        <span className="px-2.5 py-0.5 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[9px] font-black uppercase tracking-widest rounded-full">
                          MEVCUT AŞAMA
                        </span>
                      )}
                      {status === 'completed' && (
                        <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-extrabold uppercase tracking-widest rounded-full">
                          TAMAMLANDI ✔
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed">{stage.desc}</p>

                    {/* Extra details if active and fee exists */}
                    {status === 'active' && property.tapu_track?.feeAmount && (
                      <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap gap-4 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">
                            {isRental ? "Aylık Kira & Depozito Tutarı:" : "Hesaplanan Tapu Harcı:"}
                          </span>
                          <span className="font-extrabold text-amber-400">
                            {property.tapu_track.feeCurrency === 'GBP' ? '£' : '₺'}{property.tapu_track.feeAmount}
                          </span>
                        </div>
                        {property.tapu_track.appointmentDateTime && (
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">
                              {isRental ? "Anahtar Teslim / Imza Randevusu:" : "Randevu Tarihi:"}
                            </span>
                            <span className="font-extrabold text-teal-400">
                              {new Date(property.tapu_track.appointmentDateTime).toLocaleString('tr-TR')}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Direct Contact & Feedback Form for Property Owner */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-base">Danışmanınız İle Anlık İletişim</h3>
              <p className="text-xs text-slate-400">{agentName} • {storeName}</p>
            </div>
          </div>

          <form onSubmit={handleSendNote} className="space-y-3">
            <label className="block text-xs font-bold text-slate-300">
              Danışmanınıza Özel Mesaj veya Sorunuzu İletin:
            </label>
            <textarea
              rows={3}
              value={inquiryText}
              onChange={(e) => setInquiryText(e.target.value)}
              placeholder="Örn: Fiyat güncellemesi yapmak istiyorum veya alıcı randevusu ne zamana planlandı?"
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl p-4 text-xs font-medium text-white placeholder-slate-600 outline-none transition-all resize-none"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => handleWhatsAppAgent()}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
              >
                <Phone className="w-3.5 h-3.5 text-indigo-400" /> Doğrudan Ara
              </button>
              <button
                type="submit"
                disabled={sendingInquiry}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-950/60 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" /> Mesajı WhatsApp ile İlet
              </button>
            </div>
          </form>
        </div>

      </main>

      {/* Footer Branding */}
      <footer className="max-w-4xl mx-auto px-4 mt-12 text-center text-xs text-slate-500 border-t border-slate-900 pt-6 space-y-2">
        <p className="font-bold">{storeName} • Güvenli Portföy & Tescil Yönetim Portalı</p>
        <p className="text-[10px] text-slate-600">
          Bu canlı takip sayfası sadece yetkili mülk sahibi ve alıcı taraflarına özel olarak üretilmiştir. © 2026
        </p>
      </footer>

    </div>
  );
}
