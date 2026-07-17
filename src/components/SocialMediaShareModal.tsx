import React, { useState, useRef, useEffect } from "react";
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
  Eye,
  Info,
  BadgePercent
} from "lucide-react";

interface SocialMediaShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: any;
  branding?: any;
  agents?: any[];
}

type TemplateTheme = 'luxury_dark' | 'cyprus_warm' | 'modern_indigo' | 'minimal_carbon' | 'premium_gold';
type AspectRatio = 'square' | 'story';
type CaptionTone = 'luxury' | 'investment' | 'friendly';

export const SocialMediaShareModal: React.FC<SocialMediaShareModalProps> = ({
  isOpen,
  onClose,
  property,
  branding,
  agents = []
}) => {
  const [selectedTheme, setSelectedTheme] = useState<TemplateTheme>('luxury_dark');
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('square');
  const [isCollage, setIsCollage] = useState<boolean>(true);
  const [selectedTone, setSelectedTone] = useState<CaptionTone>('luxury');
  const [forcedStatus, setForcedStatus] = useState<'sold' | 'rented' | null>(property?.status === 'sold' ? 'sold' : property?.status === 'rented' ? 'rented' : null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isRent = property?.listing_intent === 'rent';

  // Capitalize/Format Helper
  const formatNumberVal = (val: any) => {
    if (val === undefined || val === null || val === '') return '0';
    const parsed = parseFloat(val);
    if (isNaN(parsed)) return '0';
    return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(parsed));
  };

  const storeNameDisplay = React.useMemo(() => {
    const rawStoreName = branding?.store_name || branding?.name || "";
    if (!rawStoreName || rawStoreName.toLowerCase().includes('lookprice')) {
      return 'Seçkin Emlak';
    }
    return rawStoreName;
  }, [branding]);

  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => setCopySuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  if (!isOpen || !property) return null;

  const currencySymbol = property.currency === 'GBP' ? '£' : property.currency === 'USD' ? '$' : property.currency === 'EUR' ? '€' : '₺';
  const priceText = `${currencySymbol}${formatNumberVal(property.price)}`;
  const propertyTitle = property.title || "Kıbrıs Yatırımlık Lüks Emlak Fırsatı";
  const propertyLocation = property.location || "Girne";
  const regionText = property.kktc_region ? `Kuzey Kıbrıs / ${property.kktc_region}` : "Kuzey Kıbrıs";
  const sqmText = property.square_meters ? `${property.square_meters} m² Net` : "";
  const roomsText = property.room_count ? `${property.room_count} Oda` : "";
  const typeText = property.type === 'residence' ? 'Konut' : property.type === 'commercial' ? 'Ticari Mülk' : 'Arsa';
  const titleType = property.kktc_title_type || "Eşdeğer Koçan";

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(getCaptionText());
      setCopySuccess(true);
    } catch (err) {
      console.error('Kopyalama hatası:', err);
    }
  };

  // Determine theme colors for HTML Preview
  const getThemeClasses = () => {
    switch (selectedTheme) {
      case 'luxury_dark':
        return {
          bg: 'bg-slate-950',
          accentText: 'text-yellow-400',
          accentHex: '#facc15',
          accentBg: 'bg-yellow-400',
          accentBorder: 'border-yellow-400/50',
          textTitle: 'text-yellow-400 font-extrabold',
          textBody: 'text-zinc-350',
          pillBg: 'bg-yellow-400/10 text-yellow-300 border-yellow-500/20',
          priceBg: 'bg-yellow-400 text-black',
          footerBg: 'bg-slate-950/80 border-t border-slate-800'
        };
      case 'cyprus_warm':
        return {
          bg: 'bg-orange-950',
          accentText: 'text-orange-500',
          accentHex: '#f97316',
          accentBg: 'bg-orange-500',
          accentBorder: 'border-orange-500/50',
          textTitle: 'text-orange-500 font-extrabold',
          textBody: 'text-orange-100',
          pillBg: 'bg-orange-500/15 text-orange-350 border-orange-500/20',
          priceBg: 'bg-orange-500 text-white',
          footerBg: 'bg-orange-950/80 border-t border-orange-900'
        };
      case 'modern_indigo':
        return {
          bg: 'bg-indigo-950',
          accentText: 'text-cyan-400',
          accentHex: '#06b6d4',
          accentBg: 'bg-cyan-500',
          accentBorder: 'border-cyan-500/50',
          textTitle: 'text-cyan-400 font-extrabold',
          textBody: 'text-indigo-100',
          pillBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/20',
          priceBg: 'bg-cyan-500 text-black',
          footerBg: 'bg-indigo-950/80 border-t border-indigo-900'
        };
      case 'minimal_carbon':
        default:
        return {
          bg: 'bg-zinc-900',
          accentText: 'text-white',
          accentHex: '#ffffff',
          accentBg: 'bg-white',
          accentBorder: 'border-zinc-700',
          textTitle: 'text-white font-extrabold',
          textBody: 'text-zinc-300',
          pillBg: 'bg-zinc-800 text-zinc-100 border-zinc-750',
          priceBg: 'bg-white text-zinc-950',
          footerBg: 'bg-zinc-950/80 border-t border-zinc-850'
        };
      case 'premium_gold':
        return {
          bg: 'bg-white',
          accentText: 'text-yellow-600',
          accentHex: '#d4af37',
          accentBg: 'bg-yellow-600',
          accentBorder: 'border-yellow-700',
          textTitle: 'text-black font-extrabold',
          textBody: 'text-slate-800',
          pillBg: 'bg-yellow-50 text-yellow-800 border-yellow-200',
          priceBg: 'bg-yellow-600 text-white',
          footerBg: 'bg-white border-t border-yellow-200'
        };
    }
  };

  const themeConfig = getThemeClasses();

  // Dynamic Captions generator (100% Client-side robust copywriting)
  const getCaptionText = () => {
    const brandName = storeNameDisplay;
    const brokerName = property.responsible_agent || branding?.owner_name || `${brandName} Sorumlu Danışmanı`;
    const contactPhoneText = property.consultant_phone 
      ? `iletişim Hattı: ${property.consultant_phone}` 
      : (branding?.phone || branding?.whatsapp_number) 
        ? `iletişim Hattı: ${branding.phone || branding.whatsapp_number}` 
        : 'DM yoluyla iletişim kurabilirsiniz.';

    const priceLabel = isRent ? "Aylık Kira Bedeli" : "Değerleme Fiyatı";
    const statusAction = isRent ? "kiralık olarak sunulmuştur" : "satışa sunulmuştur";
    const storeHashtag = `#${brandName.toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, '')}`;
    const mainHashtags = isRent 
      ? `#kibrisemlak #${propertyLocation.toLowerCase()}emlak #kibriskiralik #luxurylife #realestatepremium #kiralikfirsati ${storeHashtag}`
      : `#kibrisemlak #${propertyLocation.toLowerCase()}emlak #kibrisyatirim #luxurylife #realestatepremium #yatirimfirsati ${storeHashtag}`;
    const burgerPriceText = priceText;
    const bPeriod = property.billing_period === 'yearly' ? 'Yıllık' :
                    property.billing_period === '3-monthly' ? '3 Aylık' :
                    property.billing_period === '6-monthly' ? '6 Aylık' : 'Aylık';

    switch (selectedTone) {
      case 'luxury':
        return `🌟 PRESTİJ VE LÜKS BİR ARADA! 🌟\n\n` +
               `Kuzey Kıbrıs emlak pazarının parlayan yıldızı ${propertyLocation} bölgesinde, elit standartlarda ve eşsiz konfor donanımlarıyla süslenmiş yeni bir portföy ile karşınızdayız.\n\n` +
               `🏡 Mülk Detayları:\n` +
               `• Alt Tip: ${property.subtype || typeText}\n` +
               `• Tip: ${typeText} / ${roomsText || 'Geniş Yerleşim'}\n` +
               `• Metrekare: ${sqmText || 'Belirtilmedi'}\n` +
               (isRent 
                 ? `• Eşya Durumu: ${property.furnished ? 'A-Z Tam Teşekküllü Eşyalı' : 'Eşyasız (Zevkinize Uygun Tasarım)'}\n` +
                   `• Depozito Tutarı: ${property.deposit ? `${currencySymbol}${formatNumberVal(property.deposit)}` : 'Özel Görüşülecek'}\n` +
                   `• Ödeme Periyodu: ${bPeriod}\n`
                 : `• Tapu Durumu: ${titleType}\n`) +
               `• Bölge: ${regionText}\n\n` +
               `💰 ${priceLabel}: ${priceText}\n\n` +
               `Sınırları zorlayan mimarisi, lüks kaplama detayları ve yüksek yaşam standartlarıyla bu mülk, ${isRent ? 'prestijli ve konforlu bir Kıbrıs hayatı sunmaktadır.' : 'hem prestijli bir yaşam hem de seçkin bir varlık yatırımı sunmaktadır.'}\n\n` +
               `Detaylı fizibilite dosyası, video turu ve yerinde özel randevulu sunum talepleriniz için bize hemen DM gönderebilir ya da iletişim hattımızdan ulaşabilirsiniz.\n\n` +
               `👤 Danışman: ${brokerName}\n` +
               `📞 ${contactPhoneText}\n` +
               `🏢 Ofis: ${brandName}\n\n` +
               `${mainHashtags}`;

      case 'investment':
        const profitSentence = isRent 
          ? `Kıbrıs'ta yüksek döviz kira getirisi ve prestijli yaşam avantajı arayan seçkin kiracılar için ideal yaşam alanı sunulmuştur.`
          : `Kıbrıs'ta yüksek döviz kira getirisi (GBP bazlı amortisman) ve kesintisiz bölgesel prim potansiyeli arayan uluslararası yatırımcılar için ideal kârlılık şeması geliştirilmiştir.`;
        const amortSentence = isRent 
          ? `• Kiralama Potansiyeli: Çok talep gören seçkin lokasyon`
          : `• Bölgesel Amortisman Trendi: Çok hızlı geri dönüş rasyosu`;

        return `📈 KAÇIRILMAYACAK SEÇKİN FIRSAT! 📈\n\n` +
               `Çok Şubeli Ağ Veri Analizlerimize göre, ${propertyLocation} bölgesinde emsallere kıyasla mükemmel fiyat-fayda rasyosu sunan üst seviye portföyümüz ${statusAction}.\n\n` +
               `🎯 Finansal & Yapısal Özet:\n` +
               `• Alt Tip: ${property.subtype || typeText}\n` +
               `• Değer Raporu: Bölgesel ortalamalara göre oldukça avantajlı\n` +
               (isRent ? `• Depozito Tutarı: ${property.deposit ? `${currencySymbol}${formatNumberVal(property.deposit)}` : 'Görüşülecek'}\n• Ödeme Periyodu: ${bPeriod}\n` : '') +
               `${amortSentence}\n` +
               `• Kapalı Alan Raporu: ${sqmText || 'Belirtilmedi'} (${roomsText})\n` +
               `• Konum Kusursuzluğu: Ana arterlere, denize ve lüks marina hattına yürüme mesafesinde\n` +
               (isRent
                 ? `• Kiralama Koşulu: Minimum 1 Yıllık Resmi Sözleşmeli\n\n`
                 : `• Tapu Statüsü: ${titleType} (Sorunsuz devir hazır)\n\n`) +
               `💰 Fırsat Liste Bedeli: ${priceText}${isRent ? ' / Aylık' : ''}\n\n` +
               `${profitSentence}\n\n` +
               `Seçkin güvencemizle dosya analizi ve hızlı sözleşme süreçleri için bizimle iletişime geçin.\n\n` +
               `📞 ${contactPhoneText}\n` +
               `👤 Sorumlu Temsilci: ${brokerName}\n` +
               `🏢 Yetkili Şube: ${brandName}\n\n` +
               `${isRent ? `#kibrisemlak #kibriskiralik #yatirimvizyonu #kibriskiralikdaire #${propertyLocation.toLowerCase()}realestate` : `#kibrisemlak #kibrisyatirim #emlakraporu #yatirimvizyonu #kibrissatilik #${propertyLocation.toLowerCase()}realestate`}`;

      case 'friendly':
        const friendlyHashtags = isRent 
          ? `#kibrisvizyon #keyifliyasam #kibriskiralikdaire #huzurluyasam #kibristakiralikev #homedesign`
          : `#kibrisvizyon #keyifliyasam #kibrissatilikdaire #huzurluyasam #kibristaevsahibiol #homedesign`;
        return `🔑 Hayalinizdeki Kıbrıs Yaşamına İlk Adımı Atın! 🔑\n\n` +
               `Merhaba sevgili takipçilerimiz! Bugün size Kuzey Kıbrıs'ın en samimi, en huzurlu köşelerinden biri olan ${propertyLocation}'da yer alan sıcacık bir ${isRent ? 'kiralık' : ''} ${typeText.toLowerCase()} fırsatını tanıtmak istiyoruz. 😍\n\n` +
               `✨ Neden Burayı Çok Seveceksiniz?\n` +
               `👉 Alt Tip: ${property.subtype || typeText} ayrıcalığı\n` +
               `👉 Tam ${roomsText || 'Geniş Yaşam Alanı'} ferahlığı\n` +
               `👉 Metraj Konforu: ${sqmText || 'Belirtilmedi'} kullanım alanı\n` +
               (isRent
                 ? `👉 Kullanım Kolaylığı: ${property.furnished ? 'Taşınmaya hazır, tam mobilyalı!' : 'Kendi tarzınızı yansıtabileceğiniz boş mülk.'}\n` +
                   `👉 Depozito Koşulu: ${property.deposit ? `${currencySymbol}${formatNumberVal(property.deposit)} depozitolu` : 'Görüşülecek'}\n` +
                   `👉 Ödeme Kolaylığı: ${property.billing_period === 'yearly' ? 'Yıllık peşin periyot' : property.billing_period === '3-monthly' ? '3 Aylık periyot' : property.billing_period === '6-monthly' ? '6 Aylık periyot' : 'Aylık ödemeli periyot'}\n`
                 : `👉 Güvenli Tapu: ${titleType} güvencesiyle içiniz rahat\n`) +
               `👉 Lokasyon Dostu: Alışveriş noktalarına, kafelere ve masmavi plajlara çok yakın!\n\n` +
               `💰 Fiyat: ${priceText}${isRent ? ' / Aylık' : ''} (Hızlı karar veren fırsat sahibi olur!)\n\n` +
               `Her sabah eşsiz Kıbrıs havasına gözlerinizi açacağınız, sevdiklerinizle huzurlu anılar biriktireceğiniz muhteşem bir konsepte sahip.\n\n` +
               `Kahvemizi içmeye ve bu güzel mülkü yakından incelemeye davetlisiniz.\n\n` +
               `📞 Detaylı Bilgi: ${contactPhoneText}\n` +
               `👤 Danışman: ${brokerName}\n\n` +
               `${friendlyHashtags}`;
    }
  };

  const handleDownloadImage = async () => {
    setIsRendering(true);
    setRenderError(null);

    const canvas = canvasRef.current;
    if (!canvas) {
      setRenderError("Tuval bileşeni yüklenemedi.");
      setIsRendering(false);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setRenderError("Grafik motoru başlatılamadı.");
      setIsRendering(false);
      return;
    }

    // Set canvas sizing based on aspect ratio chosen
    const width = 1080;
    const height = selectedRatio === 'square' ? 1080 : 1920;
    canvas.width = width;
    canvas.height = height;

    const themeColors = {
      luxury_dark: { bg: '#0b111e', accent: '#d97706', textAccent: '#f59e0b', textLight: '#ffffff', textMuted: '#cbd5e1' },
      cyprus_warm: { bg: '#1c0c05', accent: '#ea580c', textAccent: '#f97316', textLight: '#ffffff', textMuted: '#fed7aa' },
      modern_indigo: { bg: '#060c1d', accent: '#0284c7', textAccent: '#38bdf8', textLight: '#ffffff', textMuted: '#bae6fd' },
      minimal_carbon: { bg: '#18181b', accent: '#a1a1aa', textAccent: '#e4e4e7', textLight: '#ffffff', textMuted: '#d4d4d8' },
      premium_gold: { bg: '#0f172a', accent: '#ca8a04', textAccent: '#facc15', textLight: '#ffffff', textMuted: '#fef08a' }
    };
    
    const colors = themeColors[selectedTheme] || themeColors.luxury_dark;

    const isStory = selectedRatio === 'story';
    const photoTop = 140;
    const photoHeight = isStory ? 1200 : 640;
    const photoWidth = 980;
    const photoLeft = 50;

    // Background base fill
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);

    // Double Outer Borders
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 14;
    ctx.strokeRect(18, 18, width - 36, height - 36);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(25, 25, width - 50, height - 50);

    // Bounded photo frame outline/border
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 4;
    ctx.strokeRect(48, photoTop - 2, 984, photoHeight + 4);

    // Image URL loading list
    const imageUrls: string[] = [];
    if (property.images && property.images[0]) imageUrls.push(property.images[0]);
    if (isCollage && property.images && property.images[1]) imageUrls.push(property.images[1]);
    if (isCollage && property.images && property.images[2]) imageUrls.push(property.images[2]);

    const agent = agents.find(a => a.id === selectedAgentId);
    if (agent && agent.image_url) imageUrls.push(agent.image_url);

    const loadImg = (url: string): Promise<HTMLImageElement | null> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        const cacheBustSep = url.includes('?') ? '&' : '?';
        img.src = url + cacheBustSep + "lookprice_export_ts=" + Date.now();
      });
    };

    const loadedImages = await Promise.all(imageUrls.map(loadImg));
    const imgElement = loadedImages[0];
    const sideImg1 = loadedImages[1];
    const sideImg2 = loadedImages[2];
    const agentImg = agent && agent.image_url ? loadedImages[imageUrls.indexOf(agent.image_url)] : null;

    const drawSingleImageCover = (imgPtr: HTMLImageElement | null, x: number, y: number, w: number, h: number) => {
      if (imgPtr) {
        try {
          const imgAspect = imgPtr.width / imgPtr.height;
          const targetAspect = w / h;
          let sx = 0, sy = 0, sWidth = imgPtr.width, sHeight = imgPtr.height;
          if (imgAspect > targetAspect) {
            sWidth = imgPtr.height * targetAspect;
            sx = (imgPtr.width - sWidth) / 2;
          } else {
            sHeight = imgPtr.width / targetAspect;
            sy = (imgPtr.height - sHeight) / 2;
          }
          ctx.save();
          // Polish & Shine filter: Increase brightness, contrast and saturation dynamically
          ctx.filter = "brightness(1.12) contrast(1.05) saturate(1.12)";
          ctx.drawImage(imgPtr, sx, sy, sWidth, sHeight, x, y, w, h);
          ctx.restore();
        } catch (err) {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(x, y, w, h);
        }
      } else {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x, y, w, h);
      }
    };

    // Draw images inside the bounded frame
    if (isCollage && (sideImg1 || sideImg2)) {
      const mainW = Math.round(photoWidth * 0.67);
      const gapSize = 10;
      const sideXWidth = photoWidth - mainW - gapSize;
      const sideH = Math.round((photoHeight - gapSize) / 2);
      
      drawSingleImageCover(imgElement, photoLeft, photoTop, mainW, photoHeight);
      drawSingleImageCover(sideImg1, photoLeft + mainW + gapSize, photoTop, sideXWidth, sideH);
      drawSingleImageCover(sideImg2, photoLeft + mainW + gapSize, photoTop + sideH + gapSize, sideXWidth, sideH);
    } else {
      drawSingleImageCover(imgElement, photoLeft, photoTop, photoWidth, photoHeight);
    }

    ctx.save();
    // 1. TOP CONSULTANT LINE
    const brokerName = (agent?.name || storeNameDisplay || "Seçkin Danışman").toUpperCase();
    const brokerPhone = agent?.phone || branding?.phone || branding?.whatsapp_number || "+90 548 890 23 09";
    const refNoText = (property.reference_no || 'EMLAK-PORTFOY').toUpperCase();

    if (agentImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(70 + 28, 80, 28, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(agentImg, 70, 52, 56, 56);
      ctx.restore();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 22px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(brokerName, 140, 88);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 22px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText("👤 " + brokerName, 70, 88);
    }

    // Phone (Right)
    ctx.textAlign = 'right';
    ctx.fillStyle = colors.textAccent;
    ctx.font = '900 22px system-ui, sans-serif';
    ctx.fillText("📞 " + brokerPhone, 1010, 88);

    // Reference Pill (Center)
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.accent;
    ctx.font = '900 18px system-ui, sans-serif';
    ctx.fillText("REF: " + refNoText, width / 2, 88);
    ctx.restore();

    // 2. LOCATION BADGE & SPECS ROW Below Frame
    const locationY = photoTop + photoHeight + (isStory ? 45 : 35);
    const specsY = photoTop + photoHeight + (isStory ? 115 : 105);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 24px system-ui, sans-serif';
    ctx.fillText("📍 " + propertyLocation.toUpperCase() + "  •  " + regionText.toUpperCase(), width / 2, locationY);

    const spec1 = roomsText ? `${roomsText} Daire` : (property.property_type || 'Gayrimenkul');
    const spec2 = sqmText ? `${sqmText}` : 'Belirtilmedi';
    const spec3 = property.furnished === 'esyali' ? 'Eşyalı' : (property.furnished === 'esyasiz' ? 'Eşyasız' : 'Belirtilmedi');
    const spec4 = isRent 
      ? (property.deposit ? `Depozito: ${priceText}` : 'Depozitosuz')
      : `Koçan: ${titleType}`;

    ctx.font = '900 20px system-ui, sans-serif';
    ctx.fillStyle = colors.textMuted;
    ctx.fillText(`🏠 ${spec1}   •   📐 ${spec2}   •   📦 ${spec3}   •   🔑 ${spec4}`, width / 2, specsY);
    ctx.restore();

    // 3. BOTTOM SOLID BAR
    const barY = height - 145;
    const barHeight = 110;

    ctx.save();
    const barGradient = ctx.createLinearGradient(50, barY, 1030, barY);
    barGradient.addColorStop(0, colors.accent);
    barGradient.addColorStop(1, colors.accent + 'cc');
    ctx.fillStyle = barGradient;
    
    ctx.beginPath();
    // Use manual rectangle fallback if roundRect is not supported
    ctx.rect(48, barY, 984, barHeight);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 13px system-ui, sans-serif';
    ctx.fillText((isRent ? 'AYLIK KİRA BEDELİ' : 'SATIŞ BEDELİ'), 83, barY + 28);

    ctx.font = '950 40px system-ui, sans-serif';
    ctx.fillText(priceText, 83, barY + 70);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 18px system-ui, sans-serif';
    ctx.fillText(storeNameDisplay.toUpperCase(), 83, barY + 100);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#0f172a';
    ctx.font = '950 28px system-ui, sans-serif';
    ctx.fillText("ENRAKİPSİZ", 1010 - 64, barY + 66);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillText(".COM", 1010, barY + 66);
    ctx.restore();

    // 4. CENTER DIAGONAL BANNER FOR SOLD/RENTED (STAMP EFFECT)
    if (forcedStatus) {
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 40;
      ctx.fillStyle = forcedStatus === 'sold' ? '#e11d48' : '#0369a1'; // rose-600 or sky-700
      
      const bannerWidth = width * 1.6;
      const bannerHeight = 180; 
      
      ctx.translate(width / 2, height / 2);
      ctx.rotate(-Math.PI / 6);
      
      ctx.fillRect(-bannerWidth / 2, -bannerHeight / 2, bannerWidth, bannerHeight);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'black 900 100px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.letterSpacing = '8px';
      ctx.fillText(forcedStatus === 'sold' ? 'SATILDI' : 'KİRALANDI', 0, 0);
      ctx.restore();
    }

    // Save and download
    try {
      const link = document.createElement('a');
      let sanitizedTitle = (property.title || 'ilan').toLowerCase().replace(/\s+/g, '-').substring(0, 20);
      link.download = 'afis-' + sanitizedTitle + '-' + selectedTheme + '-' + selectedRatio + '.png';
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setRenderError("Kaydetme işlemi sırasında tarayıcı güvenlik kısıtlaması nedeniyle hata oluştu.");
    }
    setIsRendering(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[999] flex items-center justify-center p-4 overflow-y-auto font-sans" id="social-share-wizard-modal">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh]">
        
        {/* Left Side: Real Real-time Interactive Poster Preview */}
        <div className="lg:w-1/2 bg-slate-100 p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200 overflow-y-auto">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5" /> REELTIME AFİŞ ÖNİZLEME (EMLAK)
              </span>
              <div className="flex items-center gap-2">
                {/* Collage Toggle Mode */}
                <button
                  onClick={() => setIsCollage(!isCollage)}
                  className={isCollage 
                    ? "p-1 pl-2 pr-2.5 rounded-lg border text-[10px] font-black tracking-wider uppercase transition-all flex items-center gap-1.5 bg-amber-600 text-white border-amber-600 shadow" 
                    : "p-1 pl-2 pr-2.5 rounded-lg border text-[10px] font-black tracking-wider uppercase transition-all flex items-center gap-1.5 bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}
                  title="Detaylı 3'lü Fotoğraf Kolajı"
                >
                  <Grid className="w-3.5 h-3.5" />
                  {isCollage ? "Kolaj" : "Tek Resim"}
                </button>
                <div className="h-5 w-[1px] bg-slate-200" />
                <button 
                  onClick={() => setSelectedRatio('square')}
                  className={"p-1.5 rounded-lg border transition-all " + (selectedRatio === 'square' ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50')}
                  title="Instagram Square Post (1:1)"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setSelectedRatio('story')}
                  className={"p-1.5 rounded-lg border transition-all " + (selectedRatio === 'story' ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50')}
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
                  cyprus_warm: { bg: 'bg-[#1c0c05]', border: 'border-[#ea580c]', textAccent: 'text-[#f97316]', barBg: 'bg-[#ea580c]', textMuted: 'text-orange-200' },
                  modern_indigo: { bg: 'bg-[#060c1d]', border: 'border-[#0284c7]', textAccent: 'text-[#38bdf8]', barBg: 'bg-[#0284c7]', textMuted: 'text-cyan-200' },
                  minimal_carbon: { bg: 'bg-[#18181b]', border: 'border-[#a1a1aa]', textAccent: 'text-[#e4e4e7]', barBg: 'bg-[#a1a1aa]', textMuted: 'text-zinc-350' },
                  premium_gold: { bg: 'bg-[#0f172a]', border: 'border-[#ca8a04]', textAccent: 'text-[#facc15]', barBg: 'bg-[#ca8a04]', textMuted: 'text-yellow-100' }
                };
                const previewColors = htmlThemeColors[selectedTheme] || htmlThemeColors.luxury_dark;
                const activeAgent = agents.find(a => a.id === selectedAgentId);
                const activeBrokerName = (activeAgent?.name || storeNameDisplay || "Seçkin Danışman").toUpperCase();
                const activeBrokerPhone = activeAgent?.phone || branding?.phone || branding?.whatsapp_number || "+90 548 890 23 09";
                const activeRefNoText = (property.reference_no || 'EMLAK-PORTFOY').toUpperCase();
                
                return (
                  <div 
                    ref={previewContainerRef}
                    className={`relative w-full max-w-[340px] rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 flex flex-col font-sans p-3 ${previewColors.bg}`}
                    style={{ 
                      aspectRatio: selectedRatio === 'square' ? '1/1' : '9/16'
                    }}
                  >
                    {/* Double Borders */}
                    <div className={`absolute inset-1.5 border-[3px] rounded-2xl pointer-events-none z-10 ${previewColors.border}`} />
                    <div className="absolute inset-2 border border-white/20 rounded-2xl pointer-events-none z-10" />

                    {/* TOP CONSULTANT BAR */}
                    <div className="relative z-20 flex justify-between items-center px-2 py-1.5 mb-1 text-[8px] font-black tracking-wider text-white">
                      <div className="flex items-center gap-1">
                        {activeAgent?.image_url ? (
                          <img src={activeAgent.image_url} alt={activeBrokerName} className="w-4 h-4 rounded-full object-cover border border-white/40" />
                        ) : (
                          <span>👤</span>
                        )}
                        <span className="truncate max-w-[80px]">{activeBrokerName}</span>
                      </div>
                      <div className={previewColors.textAccent}>REF: {activeRefNoText}</div>
                      <div className={previewColors.textAccent}>📞 {activeBrokerPhone}</div>
                    </div>

                    {/* FRAMED IMAGE AREA */}
                    <div className={`relative flex-1 rounded-xl overflow-hidden border-2 z-20 ${previewColors.border}`}>
                      {isCollage && property.images && (property.images[1] || property.images[2]) ? (
                        <div className="w-full h-full flex flex-row bg-slate-900">
                          {/* Left Main (67%) */}
                          <div className="w-[67%] h-full relative border-r border-black/30 overflow-hidden">
                            {property.images[0] ? (
                              <img 
                                src={property.images[0]} 
                                alt={propertyTitle} 
                                className="w-full h-full object-cover filter brightness-[1.12] contrast-[1.05] saturate-[1.12]"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">🏠</div>
                            )}
                          </div>
                          {/* Right stacked (33%) */}
                          <div className="w-[33%] h-full flex flex-col">
                            <div className="flex-1 relative border-b border-black/30 overflow-hidden">
                              {property.images[1] ? (
                                <img 
                                  src={property.images[1]} 
                                  alt="Görsel 2" 
                                  className="w-full h-full object-cover filter brightness-[1.12] contrast-[1.05] saturate-[1.12]"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-500">📸</div>
                              )}
                            </div>
                            <div className="flex-1 relative overflow-hidden">
                              {property.images[2] ? (
                                <img 
                                  src={property.images[2]} 
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
                        property.images && property.images[0] ? (
                          <img 
                            src={property.images[0]} 
                            alt={propertyTitle} 
                            className="w-full h-full object-cover filter brightness-[1.12] contrast-[1.05] saturate-[1.12]"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-500">
                            <span className="text-2xl">🏠</span>
                          </div>
                        )
                      )}

                      {/* Diagonal Banner for SOLD/RENTED (HTML Preview) */}
                      {forcedStatus && (
                        <div className="absolute inset-0 flex items-center justify-center overflow-hidden z-50 pointer-events-none">
                          <div className={`w-[200%] py-1.5 text-center text-lg font-black tracking-[0.1em] text-white shadow-2xl transform -rotate-12 uppercase ${
                            forcedStatus === 'sold' ? 'bg-rose-600/95' : 'bg-sky-700/95'
                          }`}>
                            {forcedStatus === 'sold' ? 'SATILDI' : 'KİRALANDI'}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* LOCATION AND SPECS AREA BELOW FRAME */}
                    <div className="relative z-20 flex flex-col items-center justify-center py-2 text-center text-white">
                      <div className="text-[9px] font-black truncate max-w-full">
                        📍 {propertyLocation.toUpperCase()}  •  {regionText.toUpperCase()}
                      </div>
                      
                      <div className={`text-[7px] font-extrabold mt-0.5 truncate max-w-full ${previewColors.textMuted}`}>
                        🏠 {roomsText ? `${roomsText} Daire` : (property.property_type || 'Gayrimenkul')}  •  📐 {sqmText || 'Belirtilmedi'}  •  📦 {property.furnished === 'esyali' ? 'Eşyalı' : 'Eşyasız'}  •  🔑 {isRent ? 'Depozitolu' : titleType}
                      </div>
                    </div>

                    {/* SOLID BOTTOM BAR */}
                    <div className={`relative z-20 rounded-lg p-2 flex justify-between items-center text-slate-900 ${previewColors.barBg}`}>
                      <div className="flex flex-col text-left leading-tight">
                        <span className="text-[6px] font-black tracking-wider text-[#0f172a] uppercase">
                          {isRent ? 'AYLIK KİRA BEDELİ' : 'SATIŞ BEDELİ'}
                        </span>
                        <span className="text-[13px] font-black text-[#0f172a] tracking-tight">
                          {priceText}
                        </span>
                        <span className="text-[7px] font-black text-white uppercase tracking-wider truncate max-w-[120px]">
                          {storeNameDisplay}
                        </span>
                      </div>
                      
                      <div className="text-right flex items-center text-[9px] font-black text-[#0f172a]">
                        ENRAKİPSİZ<span className="text-white">.COM</span>
                      </div>
                    </div>

                  </div>
                );
              })()}
            </div>
          </div>

          {/* Controls for Template styles */}
          <div className="mt-4">
            <span className="block text-[11px] font-black tracking-wider text-slate-500 uppercase mb-2">👤 DANIŞMAN SEÇİMİ</span>
            <select
              value={selectedAgentId || ''}
              onChange={(e) => setSelectedAgentId(e.target.value ? Number(e.target.value) : null)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 mb-4 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
            >
              <option value="">Danışman Seçiniz (Fotoğraf İçin)</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>

            <span className="block text-[11px] font-black tracking-wider text-slate-500 uppercase mb-2">🎨 GÖRSEL ŞABLON RENK DETAYI</span>
            <div className="grid grid-cols-4 gap-2 mb-4">
              <button 
                onClick={() => setSelectedTheme('luxury_dark')}
                className={"p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all " + (selectedTheme === 'luxury_dark' ? 'bg-slate-900 border-amber-500 text-white ring-2 ring-amber-500/40 shadow-md' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700')}
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-950 to-amber-500 mb-1" />
                <span className="text-[9px] font-bold">Lüks Siyah</span>
              </button>
              <button 
                onClick={() => setSelectedTheme('cyprus_warm')}
                className={"p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all " + (selectedTheme === 'cyprus_warm' ? 'bg-orange-50 border-orange-500 text-amber-950 ring-2 ring-orange-400/45 shadow-md' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700')}
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-200 to-orange-600 mb-1" />
                <span className="text-[9px] font-bold">Kıbrıs Sıcak</span>
              </button>
              <button 
                onClick={() => setSelectedTheme('modern_indigo')}
                className={"p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all " + (selectedTheme === 'modern_indigo' ? 'bg-indigo-950 border-cyan-400 text-white ring-2 ring-cyan-400/35 shadow-md' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700')}
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-900 to-cyan-500 mb-1" />
                <span className="text-[9px] font-bold">Sanal Safir</span>
              </button>
              <button 
                onClick={() => setSelectedTheme('premium_gold')}
                className={"p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all " + (selectedTheme === 'premium_gold' ? 'bg-white border-yellow-600 text-yellow-800 ring-2 ring-yellow-500/40 shadow-md' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700')}
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-700 mb-1" />
                <span className="text-[9px] font-bold">Premium Gold</span>
              </button>
            </div>

            <span className="block text-[11px] font-black tracking-wider text-slate-500 uppercase mb-2">📢 DURUM ETİKETİ (OPSİYONEL)</span>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button 
                onClick={() => setForcedStatus(null)}
                className={"py-2 px-3 rounded-xl text-[10px] font-bold transition-all border flex flex-col items-center gap-1 " + (forcedStatus === null ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50')}
              >
                <Eye className="w-3.5 h-3.5" />
                Normal
              </button>
              <button 
                onClick={() => setForcedStatus('sold')}
                className={"py-2 px-3 rounded-xl text-[10px] font-bold transition-all border flex flex-col items-center gap-1 " + (forcedStatus === 'sold' ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-500/20' : 'bg-white text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-600')}
              >
                <Award className="w-3.5 h-3.5" />
                Satıldı
              </button>
              <button 
                onClick={() => setForcedStatus('rented')}
                className={"py-2 px-3 rounded-xl text-[10px] font-bold transition-all border flex flex-col items-center gap-1 " + (forcedStatus === 'rented' ? 'bg-sky-600 text-white border-sky-600 shadow-md ring-2 ring-sky-500/20' : 'bg-white text-slate-600 border-slate-200 hover:bg-sky-50 hover:text-sky-600')}
              >
                <Check className="w-3.5 h-3.5" />
                Kiralandı
              </button>
            </div>

            {/* Offline Export Trigger Button */}
            <div className="mt-4 flex gap-1 items-center">
              <button 
                onClick={handleDownloadImage}
                disabled={isRendering}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl transition-all shadow-lg text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50"
              >
                {isRendering ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {isRendering ? 'Afiş Derleniyor...' : 'Afiş Görselini İndir (PNG)'}
              </button>
            </div>
            
            {renderError && (
              <p className="text-xs text-rose-600 mt-2 font-medium flex items-center gap-1">
                <Info className="w-3.5 h-3.5 shrink-0" /> {renderError}
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Copywriting Caption & Social Media Posting Advisor */}
        <div className="lg:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5 leading-tight">
                <Instagram className="w-5 h-5 text-indigo-600" /> SOSYAL MEDYA PAYLAŞIM REHBERİ
              </h2>
              <button 
                onClick={onClose}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-500 text-xs leading-relaxed mb-4">
              Afişinizi sol panelden özelleştirip indirdikten sonra, sosyal medya gönderiniz (Instagram, Facebook post, WhatsApp durum veya WhatsApp mesajı) için hazır, sektörel standartlarda tasarlanmış <strong>kopyalanabilir pazarlama caption yazısını</strong> aşağıdan seçebilirsiniz. AI hatası veya teknik kesinti korkusu olmadan, rasyoları hesaplanmış, 100% güvenli bir paylaşım!
            </p>

            {/* Tone Selector */}
            <div className="mb-4">
              <span className="block text-[11px] font-black tracking-wider text-slate-500 uppercase mb-2">✍️ PAYLAŞIM METNİ TEMA & USLUBU</span>
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-200">
                <button 
                  onClick={() => setSelectedTone('luxury')}
                  className={"py-2 px-3 rounded-xl text-xs font-bold transition-all " + (selectedTone === 'luxury' ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-extrabold' : 'text-slate-550 hover:text-slate-900')}
                >
                  ⚜️ Lüks & Prestij
                </button>
                <button 
                  onClick={() => setSelectedTone('investment')}
                  className={"py-2 px-3 rounded-xl text-xs font-bold transition-all " + (selectedTone === 'investment' ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-extrabold' : 'text-slate-550 hover:text-slate-900')}
                >
                  📈 Yatırım Raporlu
                </button>
                <button 
                  onClick={() => setSelectedTone('friendly')}
                  className={"py-2 px-3 rounded-xl text-xs font-bold transition-all " + (selectedTone === 'friendly' ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-extrabold' : 'text-slate-550 hover:text-slate-900')}
                >
                  ✨ Samimi & Emojili
                </button>
              </div>
            </div>

            {/* Copywriting Read-only Text Box */}
            <div className="relative">
              <span className="block text-[11px] font-black tracking-wider text-slate-400 uppercase mb-1">HAZIR PAYLAŞIM METNİ (DÜZENLENEBİLİR)</span>
              <div className="border border-slate-200 rounded-2xl bg-slate-50 overflow-hidden">
                <textarea 
                  value={getCaptionText()}
                  readOnly
                  className="w-full h-[240px] p-4 text-xs font-medium text-slate-800 leading-relaxed bg-transparent focus:outline-none focus:ring-0 resize-none font-sans border-0 select-text"
                />
                
                {/* Float copy button */}
                <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-indigo-600" /> LOOKPRICE MULTI-STATION SCRIPT
                  </span>
                  <button 
                    onClick={handleCopyCaption}
                    className={"px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1 shadow-sm " + (copySuccess ? 'bg-emerald-650 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white')}
                  >
                    {copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copySuccess ? 'Kopyalandı!' : 'Metni Kopyala'}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Helper Tips */}
            <div className="mt-4 p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-amber-900 leading-none">LOOKPRICE PRO-IPUCU: ADIM ADIM REHBER</h4>
                <p className="text-[10.5px] text-amber-800 leading-relaxed mt-1">
                  1. Sol panelden hoşunuza giden bir stil seçip <strong>"Afiş Görselini İndir"</strong> butonuyla posteri bilgisayarınıza/telefonunuza kaydedin. <br />
                  2. Sağ panelden <strong>"Metni Kopyala"</strong> butonuna basarak metni hafızaya alın. <br />
                  3. Instagram, Facebook veya WhatsApp'ı açın, indirdiğiniz görseli ekleyip kopyaladığınız metni yapıştırarak ilanı <strong>hızlıca ve güvenle yayına verin!</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-black tracking-widest text-indigo-600 uppercase">LOOKPRICE SOCIAL WIZARD v2.5</span>
            <button 
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 text-slate-600 font-bold text-xs rounded-xl transition-all"
            >
              Kapat
            </button>
          </div>

        </div>

      </div>

      {/* Hidden off-screen canvas used purely for drawing high quality image rendering */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

// Helper inside file for translation consistency
const categoryLabelForPreview = (typeStr: string) => {
  switch (typeStr) {
    case 'residence': return '🏡 KONUT FIRSATI';
    case 'commercial': return '🏢 TİCARİ MODÜL';
    case 'land': return '🌿 ARSA VE PARSEL';
    default: return '📍 SEÇKİN PORTFÖY';
  }
};
