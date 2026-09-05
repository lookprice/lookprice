import React, { useState, useRef, useEffect, useMemo } from "react";
import { safeHtml2Canvas, prepareImagesForHtml2Canvas } from "../utils/html2canvasFix";
import { useParams } from "react-router-dom";
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  Smartphone, 
  Grid, 
  Instagram, 
  Facebook, 
  MessageCircle, 
  Award,
  Sparkles,
  FileImage,
  RefreshCw,
  Info,
  Eye,
  Car,
  Gauge,
  Flame
} from "lucide-react";
import { formatFuelType, formatTransmission } from "../utils/formatUtils";

interface AutomotiveSocialMediaShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: any;
  branding?: any;
}

type TemplateTheme = 'luxury_dark' | 'sporty_red' | 'neon_cyber' | 'minimal_carbon' | 'hertz_style' | 'rangerover_style';
type AspectRatio = 'square' | 'story';
type CaptionTone = 'luxury' | 'technical' | 'friendly';

export const AutomotiveSocialMediaShareModal: React.FC<AutomotiveSocialMediaShareModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  branding
}) => {
  const { slug: urlSlug } = useParams<{ slug?: string }>();

  // Format slug nicely to Turkish title case
  const formatSlugToTitle = (slugStr: string): string => {
    if (!slugStr) return "";
    const lowerSlug = slugStr.toLowerCase().trim();
    if (lowerSlug === 'gap-bilisim' || lowerSlug === 'gap_bilisim' || lowerSlug === 'gapbilisim') {
      return 'Gap Bilişim';
    }
    if (lowerSlug === 'lookprice') {
      return 'LookPrice';
    }
    return slugStr
      .split(/[-_]/)
      .map(word => {
        if (!word) return "";
        let firstChar = word.charAt(0);
        if (firstChar === 'i') firstChar = 'İ';
        else if (firstChar === 'ı') firstChar = 'I';
        else if (firstChar === 'ş') firstChar = 'Ş';
        else if (firstChar === 'ç') firstChar = 'Ç';
        else if (firstChar === 'ğ') firstChar = 'Ğ';
        else if (firstChar === 'ü') firstChar = 'Ü';
        else if (firstChar === 'ö') firstChar = 'Ö';
        else firstChar = firstChar.toUpperCase();
        return firstChar + word.slice(1);
      })
      .join(" ");
  };

  const storeName = useMemo(() => {
    const candidateName = branding?.store_name || branding?.name;
    const activeSlug = urlSlug || branding?.slug || (branding as any)?.parent_slug;
    
    if (!candidateName || candidateName.toLowerCase().trim() === 'lookprice' || candidateName.toLowerCase().trim() === 'lookprice premium gallery') {
      if (activeSlug && activeSlug.toLowerCase().trim() !== 'lookprice') {
        return formatSlugToTitle(activeSlug);
      }
      return 'Seçkin Otomotiv';
    }
    return candidateName;
  }, [branding, urlSlug]);

  const [selectedTheme, setSelectedTheme] = useState<TemplateTheme>('luxury_dark');
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('square');
  const [isCollage, setIsCollage] = useState<boolean>(true);
  const [selectedTone, setSelectedTone] = useState<CaptionTone>('luxury');
  const [forcedStatus, setForcedStatus] = useState<'sold' | 'optioned' | 'deal' | null>(vehicle?.status === 'sold' ? 'sold' : vehicle?.status === 'optioned' ? 'optioned' : null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Capitalize/Format Helper
  const formatNumberVal = (val: any) => {
    if (val === undefined || val === null || val === '') return '0';
    const parsed = parseFloat(val);
    if (isNaN(parsed)) return '0';
    return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(parsed));
  };

  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => setCopySuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  if (!isOpen || !vehicle) return null;

  const currencySymbol = vehicle.currency === 'GBP' ? '£' : vehicle.currency === 'USD' ? '$' : vehicle.currency === 'EUR' ? '€' : '₺';
  const priceText = `${formatNumberVal(vehicle.selling_price)} ${currencySymbol}`;
  const vehicleTitle = `${vehicle.brand} ${vehicle.model} (${vehicle.year})`;
  const mileageText = vehicle.current_mileage ? `${formatNumberVal(vehicle.current_mileage)} KM` : "";
  const transmissionText = formatTransmission(vehicle.transmission);
  const fuelText = formatFuelType(vehicle.fuel_type);
  const bodyText = vehicle.body_type || 'Binek';
  const colorText = vehicle.color || 'Belirtilmedi';

  // Determine theme colors for HTML Preview
  const getThemeClasses = () => {
    switch (selectedTheme) {
      case 'luxury_dark':
        return {
          bg: 'bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950',
          textTitle: 'text-amber-400 font-extrabold',
          textBody: 'text-zinc-300',
          accentBorder: 'border-amber-500/30',
          pillBg: 'bg-amber-550/15 text-amber-300 border-amber-500/20',
          priceBg: 'bg-gradient-to-r from-amber-650 to-amber-500 text-white',
          footerBg: 'bg-slate-950/60 border-t border-slate-800',
          accentHex: '#fbbf24', // amber-400
          accentBg: 'bg-amber-400 text-black',
          accentText: 'text-amber-400'
        };
      case 'sporty_red':
        return {
          bg: 'bg-gradient-to-br from-zinc-950 via-neutral-900 to-red-950',
          textTitle: 'text-red-500 font-extrabold',
          textBody: 'text-zinc-300',
          accentBorder: 'border-red-600/30',
          pillBg: 'bg-red-500/15 text-red-400 border-red-500/20',
          priceBg: 'bg-gradient-to-r from-red-700 to-red-500 text-white',
          footerBg: 'bg-neutral-950/80 border-t border-red-950/40',
          accentHex: '#dc2626', // red-600
          accentBg: 'bg-red-650 text-white',
          accentText: 'text-red-500'
        };
      case 'neon_cyber':
        return {
          bg: 'bg-gradient-to-br from-zinc-950 via-indigo-950 to-purple-950',
          textTitle: 'text-cyan-400 font-extrabold',
          textBody: 'text-cyan-100',
          accentBorder: 'border-cyan-500/30',
          pillBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/20',
          priceBg: 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white',
          footerBg: 'bg-purple-950/60 border-t border-purple-900/30',
          accentHex: '#06b6d4', // cyan-500
          accentBg: 'bg-cyan-500 text-black',
          accentText: 'text-cyan-400'
        };
      case 'minimal_carbon':
        return {
          bg: 'bg-gradient-to-br from-zinc-900 via-neutral-900 to-zinc-955',
          textTitle: 'text-white font-extrabold',
          textBody: 'text-zinc-300',
          accentBorder: 'border-zinc-700',
          pillBg: 'bg-zinc-800 text-zinc-100 border-zinc-700',
          priceBg: 'bg-white text-zinc-900',
          footerBg: 'bg-zinc-950/80 border-t border-zinc-800',
          accentHex: '#e4e4e7', // zinc-200
          accentBg: 'bg-zinc-200 text-black',
          accentText: 'text-zinc-200'
        };
      case 'hertz_style':
        return {
          bg: 'bg-white',
          textTitle: 'text-black font-extrabold',
          textBody: 'text-black',
          accentBorder: 'border-yellow-400',
          pillBg: 'bg-yellow-400 text-black',
          priceBg: 'bg-yellow-400 text-black',
          footerBg: 'bg-yellow-400',
          accentHex: '#fbbf24', // yellow-400
          accentBg: 'bg-yellow-455 text-black',
          accentText: 'text-yellow-400'
        };
      case 'rangerover_style':
        return {
          bg: 'bg-zinc-900',
          textTitle: 'text-white font-extrabold',
          textBody: 'text-white',
          accentBorder: 'border-white',
          pillBg: 'bg-white text-black',
          priceBg: 'bg-white text-black',
          footerBg: 'bg-zinc-900',
          accentHex: '#ffffff', // white
          accentBg: 'bg-white text-black',
          accentText: 'text-white'
        };
    }
  };

  const themeConfig = getThemeClasses();

  const getCanvasThemeColors = (theme: TemplateTheme) => {
    switch (theme) {
      case 'luxury_dark': return { border: '#fbbf24', text: '#fbbf24', phone: '#fbbf24', sticker: '#fbbf24', glassBorder: 'rgba(251,191,36,0.35)', pill: '#fbbf24' };
      case 'sporty_red': return { border: '#dc2626', text: '#dc2626', phone: '#dc2626', sticker: '#dc2626', glassBorder: 'rgba(220,38,38,0.35)', pill: '#dc2626' };
      case 'neon_cyber': return { border: '#22d3ee', text: '#22d3ee', phone: '#22d3ee', sticker: '#22d3ee', glassBorder: 'rgba(34,211,238,0.35)', pill: '#22d3ee' };
      case 'minimal_carbon': return { border: '#e4e4e7', text: '#e4e4e7', phone: '#e4e4e7', sticker: '#e4e4e7', glassBorder: 'rgba(228,228,231,0.35)', pill: '#e4e4e7' };
      case 'hertz_style': return { border: '#eab308', text: '#eab308', phone: '#eab308', sticker: '#eab308', glassBorder: 'rgba(234,179,8,0.4)', pill: '#eab308' };
      case 'rangerover_style': return { border: '#ffffff', text: '#ffffff', phone: '#ffffff', sticker: '#ffffff', glassBorder: 'rgba(255,255,255,0.4)', pill: '#ffffff' };
      default: return { border: '#ffffff', text: '#ffffff', phone: '#ffffff', sticker: '#ffffff', glassBorder: 'rgba(255,255,255,0.18)', pill: '#64748b' };
    }
  };

  const canvasColors = getCanvasThemeColors(selectedTheme);

  // Dynamic Captions generator (100% Client-side robust copywriting for vehicles)
  const getCaptionText = () => {
    const rawName = storeName || branding?.store_name || branding?.name || "";
    const brandName = (!rawName || rawName.toLowerCase().includes("lookprice")) ? "Seçkin Otomotiv" : rawName;
    
    const contactPhone = branding?.whatsapp_number || branding?.phone || '';
    const contactPhoneText = contactPhone 
      ? `iletişim Hattı: ${contactPhone}` 
      : 'DM yoluyla iletişim kurabilirsiniz.';
    const brokerName = vehicle.responsible_agent || branding?.owner_name || `${brandName} Sorumlu Danışmanı`;
    const storeHastagPart = brandName.toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, '');
    const activeHashtags = `#otomotiv #araba #sahibinden #satilikaraba #${storeHastagPart} #luxurycars #gallerypremium #ikincielyetkili #arabapazari #${vehicle.brand.toLowerCase()} #${vehicle.model.toLowerCase()}`;

    switch (selectedTone) {
      case 'luxury':
        return `⚜️ SEÇKİN BİR SÜRÜŞ COĞRAFYASI: ${vehicle.brand.toUpperCase()} ${vehicle.model.toUpperCase()} ⚜️\n\n` +
               `Otomotiv dünyasının prestij, estetik ve mühendislik harikasını sunmaktan mutluluk duyarız. ${brandName} bünyesinde sergilenen bu özel aracımız, üst düzey konforu ve kusursuz kondisyonuyla yeni sahibini bekliyor.\n\n` +
               `🏎️ Araç Bilgileri ve Donanımı:\n` +
               `• Marka / Model: ${vehicle.brand} ${vehicle.model}\n` +
               `• Model Yılı: ${vehicle.year}\n` +
               `• Kilometre: ${mileageText || 'Düşük Km'}\n` +
               `• Şanzıman Tipi: ${transmissionText}\n` +
               `• Yakıt Türü: ${fuelText}\n` +
               `• Gövde / Renk: ${bodyText} / ${colorText}\n` +
               (vehicle.tramer_amount ? `• Tramer Hasar Kaydı: ${formatNumberVal(vehicle.tramer_amount)} ${vehicle.tramer_currency || 'TRY'}\n` : '• Hasar Durumu: Boyasız & Tramersiz Kusursuz Kondisyon\n') +
               `• Değişen Parça / Boya Bilgisi: Araç temizlik rasyolarına göre tam yetkili ekspertiz onaylıdır.\n\n` +
               `💰 Özel Portföy Fiyatı: ${priceText}\n\n` +
               `Hem şehir içi asaletini yaşamak hem de prestijli yolculukların keyfini sürmek isteyen seçkin müşterilerimiz için tasarlanan bu şaheseri yakından incelemek üzere galerimize davetlisiniz.\n\n` +
               `İletişim hattımız üzerinden detaylı teknik ekspertiz belgesi ve randevu talep edebilirsiniz.\n\n` +
               `👤 Portföy Danışmanı: ${brokerName}\n` +
               `📞 ${contactPhoneText}\n` +
               `🏢 Galeri: ${brandName}\n\n` +
               `${activeHashtags}`;

      case 'technical':
        return `⚡️ YÜKSEK PERFORMANS & MEKANİK KONDİSYON METRİKLERİ ⚡️\n\n` +
               `Kusursuz mekanik donanımı, aerodinamik gövde yapısı ve yüksek motor verimliliği ile premium segmentin öncüsü ${vehicle.brand} ${vehicle.model} satışa sunulmuştur.\n\n` +
               `📊 Detaylı Araç Özellikleri:\n` +
               `• Model Yılı: ${vehicle.year}\n` +
               `• Kilometre Sayacı: ${mileageText || 'Belirtilmedi'}\n` +
               `• Motor / Şanzıman: 2.0L verimli motor & ${transmissionText} teknolojisi\n` +
               `• Yakıt Sarfiyatı / Tip: ${fuelText} ile maksimum yakıt optimizasyonu\n` +
               `• Gövde Tipi: ${bodyText}\n` +
               `• Dış Kombinasyon: ${colorText} premium renk kodu\n` +
               (vehicle.tramer_amount ? `• Tramer Bilgisi: ${formatNumberVal(vehicle.tramer_amount)} ${vehicle.tramer_currency || 'TRY'} hasar kaydı\n` : '• Hasar Hasarsızlık: Ekspertiz garantili orijinal kaporta panelleri\n') +
               `• Takas Durumu: ${vehicle.is_trade_in_available ? 'Değerinde araçlar ile takas imkanı mevcuttur' : 'Sadece nakit satış'}\n\n` +
               `💰 Net Satış Bedeli: ${priceText}\n\n` +
               `Araç kozmetik olarak 10/10 seviyesinde olup, tüm periyodik ve ağır bakımları yetkili servis ağı tarafından yeni yapılmıştır. Detaylı şasi kontrolü, motor gücü haritalandırma raporu hazır durumdadır.\n\n` +
               `📞 ${contactPhoneText}\n` +
               `👤 Sorumlu Uzman: ${brokerName}\n` +
               `🏢 Yetkili Şube: ${brandName}\n\n` +
               `#otomotivteknik #performans #ekspertizgarantili #yetkiliserviz #arackondisyonu ${activeHashtags}`;

      case 'friendly':
        return `🌟 Sahibinden Tadında, Pırıl Pırıl Bir Fırsat! 🌟\n\n` +
               `Selamlar otomobil tutkunları! 😊 Bugün vitrinimize çok sevilen, sürüş konforu ve estetiğiyle görenleri kendine hayran bırakan pırıl pırıl bir ${vehicle.brand} ${vehicle.model} ekledik! 😍\n\n` +
               `✨ Neden Bu Arabayı Çok Seveceksiniz?\n` +
               `👉 Tam bir aile ve keyif arabası: ${bodyText} genişliği ve ferahlığı\n` +
               `👉 Sürüş Keyfi: ${transmissionText} şanzıman ile kesintisiz sürüş rahatlığı\n` +
               `👉 Yakıt Dostu: ${fuelText} motor seçeneği ile cebinizi yormaz\n` +
               `👉 Sadece ${mileageText || 'Düşük Km'} sürülmüş, tertemiz fırın boya kondisyonda\n` +
               `👉 Muhteşem ${colorText} rengiyle yollarda tüm bakışlar üzerinizde olacak! 😎\n\n` +
               `💰 Fiyat: ${priceText} (Fırsat kaçmadan ilk gelen alır!)\n\n` +
               `İçerisinde sigara içilmemiş, döşemelerinde en ufak bir deformasyon olmayan, her kilometresi özenle yapılmış bu yakışıklıyı yakından görüp test etmek isterseniz hemen bir çayımızı içmeye bekliyoruz!\n\n` +
               `💬 DM atarak ya da numaradan bana ulaşabilirsiniz:\n` +
               `📞 ${contactPhoneText}\n` +
               `👤 Araç Sorumlusu: ${brokerName}\n` +
               `🏢 Ofisimiz: ${brandName}\n\n` +
               `${activeHashtags}`;
    }
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(getCaptionText());
    setCopySuccess(true);
  };

  // High-Resolution HTML5 Canvas Exporter for Automotive Share Poster
  const handleDownloadImage = async () => {
    setIsRendering(true);
    setRenderError(null);

    const element = previewContainerRef.current;
    if (!element) {
      setRenderError("Afiş önizleme alanı yüklenemedi.");
      setIsRendering(false);
      return;
    }

    try {
      // 0. Wait a bit for layout to settle
      await new Promise(resolve => setTimeout(resolve, 200));

      // 1. Prepare and convert all images inside preview element to Data URLs for 100% CORS safety
      await prepareImagesForHtml2Canvas(element);

      // 2. Calculate render scale for 1080px resolution (HD Social Media standard)
      const currentWidth = element.clientWidth || 340;
      const targetWidth = 1080;
      const renderScale = Math.max(3.2, targetWidth / currentWidth);

      // 3. Render DOM element to high-resolution canvas with safe modern color handling
      const canvas = await safeHtml2Canvas(element, {
        scale: renderScale,
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        logging: false,
        imageTimeout: 10000,
      });

      // 4. Download generated PNG
      const sanitizedTitle = `${vehicle?.brand || 'arac'}-${vehicle?.model || 'ilan'}`
        .toLowerCase()
        .replace(/[^a-z0-9ğüşıöç]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 25);

      let dataUrl = '';
      try {
        dataUrl = canvas.toDataURL("image/png", 1.0);
      } catch (e) {
        dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      }

      const link = document.createElement("a");
      link.download = `afis-oto-${sanitizedTitle}-${selectedTheme}-${selectedRatio}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error("Automotive poster export error:", err);
      setRenderError("Afiş görseli indirilirken bir hata oluştu: " + (err?.message || "Lütfen tekrar deneyiniz."));
    } finally {
      setIsRendering(false);
    }
  };



  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[999] flex items-center justify-center p-4 overflow-y-auto font-sans" id="automotive-share-wizard-modal">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl flex flex-col lg:flex-row border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto lg:overflow-hidden">
        
        {/* Left Side: Real Real-time Interactive Poster Preview */}
        <div className="w-full lg:w-1/2 bg-slate-100 p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200 lg:overflow-y-auto">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5" /> REELTIME AFİŞ ÖNİZLEME (ARAÇ)
              </span>
              <div className="flex items-center gap-2">
                {/* Collage Toggle Mode */}
                <button
                  onClick={() => setIsCollage(!isCollage)}
                  className={`p-1 pl-2 pr-2.5 rounded-lg border text-[10px] font-black tracking-wider uppercase transition-all flex items-center gap-1.5 ${
                    isCollage
                      ? 'bg-amber-600 text-white border-amber-600 shadow'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Detaylı 3'lü Fotoğraf Kolajı"
                >
                  <Grid className="w-3.5 h-3.5" />
                  {isCollage ? "Kolaj" : "Tek Resim"}
                </button>
                <div className="h-5 w-[1px] bg-slate-200" />
                <button 
                  onClick={() => setSelectedRatio('square')}
                  className={`p-1.5 rounded-lg border transition-all ${selectedRatio === 'square' ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                  title="Instagram Post (1:1)"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setSelectedRatio('story')}
                  className={`p-1.5 rounded-lg border transition-all ${selectedRatio === 'story' ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                  title="Instagram Story / Vertical (9:16)"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Poster Canvas container */}
            <div className="flex justify-center items-center py-4">
              {(() => {
                const htmlThemeColors = {
                  luxury_dark: { bg: 'bg-[#0b111e]', border: 'border-[#d97706]', textAccent: 'text-[#f59e0b]', barBg: 'bg-[#d97706]', textMuted: 'text-slate-300' },
                  sporty_red: { bg: 'bg-[#110505]', border: 'border-[#dc2626]', textAccent: 'text-[#f87171]', barBg: 'bg-[#dc2626]', textMuted: 'text-rose-200' },
                  neon_cyber: { bg: 'bg-[#030712]', border: 'border-[#06b6d4]', textAccent: 'text-[#22d3ee]', barBg: 'bg-[#06b6d4]', textMuted: 'text-cyan-200' },
                  hertz_style: { bg: 'bg-[#0f172a]', border: 'border-[#eab308]', textAccent: 'text-[#facc15]', barBg: 'bg-[#eab308]', textMuted: 'text-yellow-100' },
                  rangerover_style: { bg: 'bg-[#18181b]', border: 'border-white', textAccent: 'text-[#e4e4e7]', barBg: 'bg-white', textMuted: 'text-zinc-350' }
                };
                const previewColors = htmlThemeColors[selectedTheme] || htmlThemeColors.luxury_dark;
                const brokerName = (vehicle.responsible_agent || storeName || branding?.owner_name || "Seçkin Danışman").toUpperCase();
                const brokerPhone = branding?.whatsapp_number || branding?.phone || "+90 548 890 23 09";
                const plateText = (vehicle.plate || 'OTO-PORTFÖY').toUpperCase();
                
                return (
                  <div 
                    ref={previewContainerRef}
                    className={`relative w-[340px] rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 flex flex-col font-sans p-4 ${previewColors.bg}`}
                    style={{ 
                      height: selectedRatio === 'square' ? '340px' : '604px'
                    }}
                  >
                    {/* Double Borders (Padded safely away from content) */}
                    <div className={`absolute inset-2 border-[3px] rounded-2xl pointer-events-none z-10 ${previewColors.border}`} />
                    <div className="absolute inset-3 border border-white/20 rounded-2xl pointer-events-none z-10" />

                    {/* TOP CONSULTANT BAR */}
                    <div className="relative z-20 flex justify-between items-center px-2.5 py-1.5 mx-2.5 mt-3 mb-1 text-[9px] font-black tracking-wider text-white shrink-0">
                      <div className="flex items-center gap-1.5 min-w-0 max-w-[60%]">
                        <span className="shrink-0 text-[9px]">👤</span>
                        <span className="truncate leading-normal text-[9px] font-black py-0.5 inline-block">{brokerName}</span>
                      </div>
                      <div className={`shrink-0 ${previewColors.textAccent} leading-normal text-[9px] font-black ml-1 py-0.5 inline-block`}>📞 {brokerPhone}</div>
                    </div>

                    {/* FRAMED IMAGE AREA */}
                    <div className={`relative flex-1 min-h-0 rounded-xl overflow-hidden border-2 z-20 ${previewColors.border} my-1`}>
                      {isCollage && vehicle.images && (vehicle.images[1] || vehicle.images[2]) ? (
                        <div className="w-full h-full flex flex-row bg-slate-900">
                          {/* Left Main (67%) */}
                          <div className="w-[67%] h-full relative border-r border-black/30 overflow-hidden">
                            {vehicle.images[0] ? (
                              <img 
                                src={vehicle.images[0]} 
                                alt={vehicleTitle} 
                                className="w-full h-full object-contain filter brightness-[1.12] contrast-[1.05] saturate-[1.12]"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">🚗</div>
                            )}
                          </div>
                          {/* Right stacked (33%) */}
                          <div className="w-[33%] h-full flex flex-col">
                            <div className="flex-1 relative border-b border-black/30 overflow-hidden">
                              {vehicle.images[1] ? (
                                <img 
                                  src={vehicle.images[1]} 
                                  alt="Görsel 2" 
                                  className="w-full h-full object-cover filter brightness-[1.12] contrast-[1.05] saturate-[1.12]"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-500">📸</div>
                              )}
                            </div>
                            <div className="flex-1 relative overflow-hidden">
                              {vehicle.images[2] ? (
                                <img 
                                  src={vehicle.images[2]} 
                                  alt="Görsel 3" 
                                  className="w-full h-full object-cover filter brightness-[1.12] contrast-[1.05] saturate-[1.12]"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-500">📸</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Full bleed single cover image
                        vehicle.images && vehicle.images[0] ? (
                          <img 
                            src={vehicle.images[0]} 
                            alt={vehicleTitle} 
                            className="w-full h-full object-cover filter brightness-[1.12] contrast-[1.05] saturate-[1.12]"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-500">
                            <span className="text-2xl">🚗</span>
                          </div>
                        )
                      )}

                      {/* Diagonal Banner for SOLD/OPTIONED/DEAL (HTML Preview) */}
                      {forcedStatus && (
                        forcedStatus === 'deal' ? (
                          <div className="absolute top-0 left-0 w-16 h-16 overflow-hidden z-50 pointer-events-none">
                            <div className="absolute top-[8px] left-[-24px] w-[110px] py-0.5 bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white font-black text-[7px] text-center transform -rotate-45 shadow-lg tracking-wider uppercase border-b border-white/20">
                              FIRSAT
                            </div>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center overflow-hidden z-50 pointer-events-none">
                            <div className={`w-[200%] py-1.5 text-center text-lg font-black tracking-[0.1em] text-white shadow-2xl transform -rotate-12 uppercase ${
                              forcedStatus === 'sold' ? 'bg-rose-600/95' : 'bg-amber-600/95'
                            }`}>
                              {forcedStatus === 'sold' ? 'SATILDI' : 'OPSİYONLU'}
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    {/* DETAILS AREA BELOW FRAME */}
                    <div className="relative z-20 flex flex-col items-center justify-center py-1.5 text-center text-white shrink-0">
                      <div className="text-[9.5px] font-black truncate max-w-full leading-tight">
                        🏎️ {vehicle.brand.toUpperCase()} {vehicle.model.toUpperCase()} ({vehicle.year})
                      </div>
                      
                      <div className={`text-[8px] font-extrabold mt-0.5 truncate max-w-full leading-tight ${previewColors.textMuted}`}>
                        🚗 {vehicle.body_type || 'Vasıta'}  •  ⚙️ {transmissionText}  •  ⛽ {fuelText}  •  📐 {mileageText || '0 km'}
                      </div>
                    </div>

                    {/* SOLID BOTTOM BAR */}
                    <div className={`relative z-20 rounded-xl p-2.5 flex justify-between items-center text-slate-900 ${previewColors.barBg} shrink-0 mt-1 mb-2`}>
                      <div className="flex flex-col text-left justify-center min-w-0 pr-2">
                        <span className="text-[7px] font-black tracking-widest text-[#0f172a]/90 uppercase leading-normal mb-0.5 block">
                          ARAÇ SATIŞ BEDELİ
                        </span>
                        <span className="text-[13px] font-black text-[#0f172a] tracking-tight leading-normal mb-0.5 block">
                          {priceText}
                        </span>
                        <span className="text-[8.5px] font-black text-[#0f172a] uppercase tracking-wider truncate leading-normal block">
                          {storeName}
                        </span>
                      </div>
                      
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-[7.5px] font-black text-[#0f172a]/80 mb-0.5 tracking-widest uppercase">PLAKA: {plateText}</span>
                        <div className="flex items-center text-[9.5px] font-black text-[#0f172a] tracking-wider leading-normal">
                          ENRAKİPSİZ<span className="text-[#0f172a] font-extrabold">.COM</span>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })()}
            </div>
          </div>

          {/* Controls for Template styles */}
          <div className="mt-4">
            <span className="block text-[11px] font-black tracking-wider text-slate-500 uppercase mb-2">🎨 SEKTÖREL GÖRSEL ŞABLONLAR</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button 
                onClick={() => setSelectedTheme('luxury_dark')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${selectedTheme === 'luxury_dark' ? 'bg-slate-900 border-amber-500 text-white ring-2 ring-amber-500/40 shadow-md' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`}
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-950 to-amber-500 mb-1" />
                <span className="text-[9px] font-bold">Lüks Siyah</span>
              </button>
              <button 
                onClick={() => setSelectedTheme('sporty_red')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${selectedTheme === 'sporty_red' ? 'bg-zinc-900 border-red-500 text-white ring-2 ring-red-500/40 shadow-md' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`}
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-zinc-900 to-red-650 mb-1" />
                <span className="text-[9px] font-bold">Spor Kırmızı</span>
              </button>
              <button 
                onClick={() => setSelectedTheme('neon_cyber')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${selectedTheme === 'neon_cyber' ? 'bg-indigo-950 border-cyan-400 text-white ring-2 ring-cyan-400/35 shadow-md' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`}
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-950 to-purple-500 mb-1" />
                <span className="text-[9px] font-bold">Neon Cyber</span>
              </button>
              <button 
                onClick={() => setSelectedTheme('minimal_carbon')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${selectedTheme === 'minimal_carbon' ? 'bg-zinc-900 border-zinc-550 text-white ring-2 ring-zinc-500/25 shadow-md' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`}
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-zinc-700 to-neutral-900 mb-1" />
                <span className="text-[9px] font-bold">Kömür Karbon</span>
              </button>
              <button 
                onClick={() => setSelectedTheme('hertz_style')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${selectedTheme === 'hertz_style' ? 'bg-yellow-400 border-yellow-600 text-black ring-2 ring-yellow-500/40 shadow-md' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`}
              >
                <div className="w-5 h-5 rounded-full bg-yellow-400 mb-1" />
                <span className="text-[9px] font-bold">Hertz Tarzı</span>
              </button>
              <button 
                onClick={() => setSelectedTheme('rangerover_style')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${selectedTheme === 'rangerover_style' ? 'bg-zinc-900 border-white text-white ring-2 ring-white/20 shadow-md' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`}
              >
                <div className="w-5 h-5 rounded-full bg-zinc-900 mb-1" />
                <span className="text-[9px] font-bold">Lüks Minimal</span>
              </button>
            </div>

            <span className="block text-[11px] font-black tracking-wider text-slate-500 uppercase mb-2 mt-4">📢 DURUM ETİKETİ (OPSİYONEL)</span>
            <div className="grid grid-cols-4 gap-2 mb-4">
              <button 
                onClick={() => setForcedStatus(null)}
                className={"py-2 px-1 rounded-xl text-[10px] font-bold transition-all border flex flex-col items-center gap-1 " + (forcedStatus === null ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50')}
              >
                <Eye className="w-3.5 h-3.5" />
                Normal
              </button>
              <button 
                onClick={() => setForcedStatus('sold')}
                className={"py-2 px-1 rounded-xl text-[10px] font-bold transition-all border flex flex-col items-center gap-1 " + (forcedStatus === 'sold' ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-500/20' : 'bg-white text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-600')}
              >
                <Award className="w-3.5 h-3.5" />
                Satıldı
              </button>
              <button 
                onClick={() => setForcedStatus('optioned')}
                className={"py-2 px-1 rounded-xl text-[10px] font-bold transition-all border flex flex-col items-center gap-1 " + (forcedStatus === 'optioned' ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-500/20' : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-600')}
              >
                <Check className="w-3.5 h-3.5" />
                Opsiyonlu
              </button>
              <button 
                onClick={() => setForcedStatus('deal')}
                className={"py-2 px-1 rounded-xl text-[10px] font-bold transition-all border flex flex-col items-center gap-1 " + (forcedStatus === 'deal' ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white border-orange-500 shadow-md ring-2 ring-orange-500/20' : 'bg-white text-slate-600 border-slate-200 hover:bg-orange-50 hover:text-orange-600')}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Fırsat
              </button>
            </div>

            {/* Print trigger */}
            <div className="mt-4 flex gap-1 items-center">
              <button 
                onClick={handleDownloadImage}
                disabled={isRendering}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl transition-all shadow-lg text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50"
              >
                {isRendering ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {isRendering ? 'Afiş Derleniyor...' : 'Kapak Görselini İndir (PNG)'}
              </button>
            </div>
            
            {renderError && (
              <p className="text-xs text-rose-600 mt-2 font-medium flex items-center gap-1">
                <Info className="w-3.5 h-3.5 shrink-0" /> {renderError}
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Copywriting Caption */}
        <div className="w-full lg:w-1/2 p-6 flex flex-col justify-between lg:overflow-y-auto">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5 leading-tight">
                <Instagram className="w-5 h-5 text-indigo-600" /> SOSYAL MEDYA ARABAM PAYLAŞIMCI
              </h2>
              <button 
                onClick={onClose}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-500 text-xs leading-relaxed mb-4">
              Motorlu aracınızı listenizden seçip kapak şablonunu oluşturduktan sonra, sosyal medya platformlarında (Instagram, Facebook veya WhatsApp durum) paylaşabileceğiniz pazar koşullarına ve araç piyasasına uygun <strong>pazarlama yazısını</strong> aşağıdan kopyalayabilirsiniz.
            </p>

            {/* Tone Selector */}
            <div className="mb-4">
              <span className="block text-[11px] font-black tracking-wider text-slate-500 uppercase mb-2">✍️ PAYLAŞIM TEMA & ÜSLUBU</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                <button 
                  onClick={() => setSelectedTone('luxury')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${selectedTone === 'luxury' ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-extrabold' : 'text-slate-550 hover:text-slate-900'}`}
                >
                  ⚜️ Lüks / Prestij
                </button>
                <button 
                  onClick={() => setSelectedTone('technical')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${selectedTone === 'technical' ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-extrabold' : 'text-slate-550 hover:text-slate-900'}`}
                >
                  🏎️ Performans / Donanım
                </button>
                <button 
                  onClick={() => setSelectedTone('friendly')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${selectedTone === 'friendly' ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-extrabold' : 'text-slate-550 hover:text-slate-900'}`}
                >
                  ✨ Samimi & Sahibinden
                </button>
              </div>
            </div>

            {/* Copywriting Area */}
            <div className="relative">
              <span className="block text-[11px] font-black tracking-wider text-slate-400 uppercase mb-1">HAZIR PAYLAŞIM METNİ (KOPYALANABİLİR)</span>
              <div className="border border-slate-200 rounded-2xl bg-slate-50 overflow-hidden">
                <textarea 
                  value={getCaptionText()}
                  readOnly
                  className="w-full h-[240px] p-4 text-xs font-medium text-slate-800 leading-relaxed bg-transparent focus:outline-none focus:ring-0 resize-none font-sans border-0 select-text"
                />
                
                {/* Float copy button */}
                <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-indigo-600" /> LOOKPRICE AUTO SCRIPT
                  </span>
                  <button 
                    onClick={handleCopyCaption}
                    className={`px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1 shadow-sm ${copySuccess ? 'bg-emerald-600 text-white animate-pulse' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
                  >
                    {copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copySuccess ? 'Kopyalandı!' : 'Metni Kopyala'}
                  </button>
                </div>
              </div>
            </div>

            {/* Helper Tips */}
            <div className="mt-4 p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-block text-amber-900 leading-none">ARAÇ PAYLAŞIM REHBERİ: ADIM ADIM</h4>
                <p className="text-[10.5px] text-amber-800 leading-relaxed mt-1">
                  1. Sol panelden galerinizin havasını en iyi yansıtan temayı ve oranı seçip <strong>"Afiş Görselini İndir"</strong> butonuyla kaydedin. <br />
                  2. Sağ panelden araç piyasasına en uygun üslubu seçip <strong>"Metni Kopyala"</strong> ya basın. <br />
                  3. Instagram, Facebook, Sahibinden veya WhatsApp'ı açarak kopyaladığınız metin ve görsel ile profesyonel paylaşımı tamamlayın! 🚀
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-black tracking-widest text-indigo-600 uppercase">LOOKPRICE AUTO WIZARD v2.0</span>
            <button 
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 text-slate-600 font-bold text-xs rounded-xl transition-all font-sans"
            >
              Kapat
            </button>
          </div>

        </div>

      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
