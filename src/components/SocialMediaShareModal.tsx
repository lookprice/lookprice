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
}

type TemplateTheme = 'luxury_dark' | 'cyprus_warm' | 'modern_indigo' | 'minimal_carbon';
type AspectRatio = 'square' | 'story';
type CaptionTone = 'luxury' | 'investment' | 'friendly';

export const SocialMediaShareModal: React.FC<SocialMediaShareModalProps> = ({
  isOpen,
  onClose,
  property,
  branding
}) => {
  const [selectedTheme, setSelectedTheme] = useState<TemplateTheme>('luxury_dark');
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('square');
  const [isCollage, setIsCollage] = useState<boolean>(true);
  const [selectedTone, setSelectedTone] = useState<CaptionTone>('luxury');
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
    const rawStoreName = branding?.store_name || branding?.name;
    if (!rawStoreName || rawStoreName.toLowerCase().trim() === 'lookprice' || rawStoreName.toLowerCase().trim() === 'lookprice premium gallery') {
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
    }
  };

  const themeConfig = getThemeClasses();

  // Dynamic Captions generator (100% Client-side robust copywriting)
  const getCaptionText = () => {
    const brandName = branding?.store_name || branding?.name || 'Seçkin Gayrimenkul';
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
               `Kahvemizi içmeye ve bu güzel mülkün tüm detaylarını yüz yüze konuşmaya bekliyoruz! 😊☕️\n\n` +
               `💬 Hemen DM atın ya da bizi arayın:\n` +
               `📞 ${contactPhoneText}\n` +
               `👤 Danışmanınız: ${brokerName}\n` +
               `🏢 Emlak Ağı: ${brandName}\n\n` +
               `${friendlyHashtags}`;
    }
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(getCaptionText());
    setCopySuccess(true);
  };

  // HTML5 Canvas Premium Graphics Export
  const handleDownloadImage = () => {
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

    const accentColor = themeConfig.accentHex;

    // Background base fill (solid dark or matching)
    ctx.fillStyle = selectedTheme === 'cyprus_warm' ? '#1c0d02' : '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Image URL loading list
    const imageUrls: string[] = [];
    if (property.images && property.images[0]) imageUrls.push(property.images[0]);
    if (isCollage && property.images && property.images[1]) imageUrls.push(property.images[1]);
    if (isCollage && property.images && property.images[2]) imageUrls.push(property.images[2]);

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

    const drawFallbackBlock = (x: number, y: number, w: number, h: number, emoji: string) => {
      ctx.save();
      const grad = ctx.createLinearGradient(x, y, x + w, y + h);
      grad.addColorStop(0, '#111827');
      grad.addColorStop(1, '#1f2937');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);

      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 2;
      for (let offset = 0; offset < w + h; offset += 40) {
        ctx.beginPath();
        ctx.moveTo(x + offset, y);
        ctx.lineTo(x, y + offset);
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = 'bold 45px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(emoji, x + w/2, y + h/2 + 15);
      ctx.restore();
    };

    Promise.all(imageUrls.map(loadImg)).then((loadedImages) => {
      const imgElement = loadedImages[0];
      const sideImg1 = loadedImages[1];
      const sideImg2 = loadedImages[2];

      // Draw property image as FULL BLEED (occupies entire canvas)
      const borderPadding = 16;
      const imgX = 0;
      const imgY = 0;
      const imgWidth = width;
      const imgHeight = height;

      const drawSingleImageCover = (imgPtr: HTMLImageElement | null, x: number, y: number, w: number, h: number, emoji: string) => {
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
            
            // Draw a subtle diagonal glare sheen on the canvas image to give that "glass/metal polish" premium glossiness
            const sheenGrad = ctx.createLinearGradient(x, y, x + w, y + h);
            sheenGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
            sheenGrad.addColorStop(0.42, "rgba(255, 255, 255, 0)");
            sheenGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.15)"); // smooth glossy shine
            sheenGrad.addColorStop(0.58, "rgba(255, 255, 255, 0)");
            sheenGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
            ctx.fillStyle = sheenGrad;
            ctx.globalCompositeOperation = "overlay";
            ctx.fillRect(x, y, w, h);
            
            ctx.restore();
          } catch (err) {
            drawFallbackBlock(x, y, w, h, emoji);
          }
        } else {
          drawFallbackBlock(x, y, w, h, emoji);
        }
      };

      ctx.save();
      if (isCollage && (sideImg1 || sideImg2)) {
        // Collage Grid: Left main image 67% width, Right side stacked vertically 33% width
        const mainW = Math.round(width * 0.67);
        const gapSize = 8;
        const sideXWidth = width - mainW - gapSize;
        const sideH = Math.round((height - gapSize) / 2);

        // Main left
        drawSingleImageCover(imgElement, 0, 0, mainW, height, "🏠");

        // Side stacked right
        drawSingleImageCover(sideImg1, mainW + gapSize, 0, sideXWidth, sideH, "📸");
        drawSingleImageCover(sideImg2, mainW + gapSize, sideH + gapSize, sideXWidth, sideH, "📸");
      } else {
        // Full bleed single cover image
        drawSingleImageCover(imgElement, 0, 0, width, height, "🏠");
      }
      ctx.restore();

      // Subtle dark vignette/gradient overlays to guarantee text readability
      // Top vignette
      const topGrad = ctx.createLinearGradient(0, 0, 0, 320);
      topGrad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
      topGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, width, 320);

      // Bottom vignette
      const botGrad = ctx.createLinearGradient(0, height - 420, 0, height);
      botGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      botGrad.addColorStop(0.4, 'rgba(0, 0, 0, 0.65)');
      botGrad.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
      ctx.fillStyle = botGrad;
      ctx.fillRect(0, height - 420, width, 420);

      // Outer border matching theme accent
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 14;
      ctx.strokeRect(borderPadding / 2, borderPadding / 2, width - borderPadding, height - borderPadding);

      // --- BRANDING ELEMENT 1: TOP LEFT HIGH-IMPACT OBLIQUE STATUS ---
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 12;
      ctx.fillStyle = accentColor;
      ctx.font = 'italic 900 75px system-ui, sans-serif';
      ctx.fillText(isRent ? 'KİRALIK' : 'SATILIK', borderPadding + 40, borderPadding + 110);
      ctx.restore();

      // --- BRANDING ELEMENT 2: TOP RIGHT ACCENT INFORMATION TAG ---
      const categoryLabel = (property.type === 'residence' ? 'KONUT' : property.type === 'commercial' ? 'TİCARİ' : 'ARSA');
      const tagText = `${roomsText ? roomsText + ' ' : ''}${categoryLabel}`.toUpperCase();
      
      ctx.font = '900 22px system-ui, sans-serif';
      const tagWidth = ctx.measureText(tagText).width + 50;
      const tagX = width - borderPadding - tagWidth - 30;
      const tagY = borderPadding + 40;
      const tagH = 64;

      // Draw Tag background box
      ctx.fillStyle = accentColor;
      ctx.fillRect(tagX, tagY, tagWidth, tagH);

      // Draw Tag Text inside (Black text on colored background for maximum contrast, classic Hertz style!)
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.font = '900 22px system-ui, sans-serif';
      ctx.fillText(tagText, tagX + tagWidth / 2, tagY + 41);
      ctx.textAlign = 'left';

      // --- BRANDING ELEMENT 3: SEMI-TRANSPARENT DARK PRICE PLATE UNDER TAG ---
      const priceCardX = tagX;
      const priceCardY = tagY + tagH + 12;
      const priceCardW = tagWidth;
      const priceCardH = 80;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(priceCardX, priceCardY, priceCardW, priceCardH);
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(priceCardX, priceCardY, priceCardW, priceCardH);

      // Price text
      ctx.fillStyle = accentColor;
      ctx.font = '900 34px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(priceText, priceCardX + priceCardW / 2, priceCardY + 52);
      ctx.textAlign = 'left';

      // --- BRANDING ELEMENT 4: BOTTOM LEFT SOLID HERTZ-STYLE LOGO BOX ---
      const logoText = storeNameDisplay.toUpperCase();
      ctx.font = '900 22px system-ui, sans-serif';
      ctx.letterSpacing = '1px';
      const logoW = ctx.measureText(logoText).width + 50;
      const logoH = 75;
      const logoX = borderPadding + 30;
      const logoY = height - borderPadding - logoH - 35;

      // Hertz Yellow/Accent background
      ctx.fillStyle = accentColor;
      ctx.fillRect(logoX, logoY, logoW, logoH);

      // Bold black text logo
      ctx.fillStyle = '#000000';
      ctx.font = '900 22px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(logoText, logoX + logoW / 2, logoY + 46);
      ctx.textAlign = 'left';

      // --- BRANDING ELEMENT 5: BOTTOM RIGHT STRUCTURAL SPECS GRID (GLASS CARD) ---
      const glassW = 520;
      const glassH = 200;
      const glassX = width - borderPadding - glassW - 30;
      const glassY = height - borderPadding - glassH - 35;

      // Draw glass card background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(glassX, glassY, glassW, glassH);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.strokeRect(glassX, glassY, glassW, glassH);

      // Draw specs text elegantly
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 22px system-ui, sans-serif';
      ctx.fillText(`📍 ${propertyLocation.toUpperCase()}`, glassX + 30, glassY + 45);

      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8'; // slate-400
      ctx.fillText(regionText.toUpperCase(), glassX + 30, glassY + 80);

      ctx.fillStyle = '#cbd5e1'; // slate-300
      ctx.font = '500 16px system-ui, sans-serif';
      ctx.fillText(`📐 Alan Ölçüsü: ${sqmText || 'Belirtilmedi'}`, glassX + 30, glassY + 122);
      if (isRent) {
        ctx.fillText(`💵 Kapora: ${property.deposit ? `${currencySymbol}${formatNumberVal(property.deposit)}` : 'Görüşülecek'}`, glassX + 30, glassY + 160);
      } else {
        ctx.fillText(`📜 Koçan Türü: ${titleType}`, glassX + 30, glassY + 160);
      }

      // Agent watermark watermark bottom center of glass card or top
      ctx.font = '900 11px system-ui, sans-serif';
      ctx.fillStyle = accentColor;
      ctx.letterSpacing = '1px';
      ctx.textAlign = 'right';
      ctx.fillText(`LP-${property.reference_no || property.id}`, glassX + glassW - 30, glassY + 43);
      ctx.textAlign = 'left';

      // --- BRANDING ELEMENT 6: SPECIAL STORY ONLY PROMOTION LINE ---
      if (selectedRatio === 'story') {
        const promoY = 880;
        const promoH = 140;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(50, promoY, width - 100, promoH);
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(50, promoY, width - 100, promoH);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("KIBRIS'IN EN DEĞERLİ BÖLGESİNDE EŞSİZ GAYRİMENKUL FIRSATI!", width / 2, promoY + 55);
        ctx.fillStyle = accentColor;
        ctx.font = '900 20px system-ui, sans-serif';
        ctx.fillText("Detaylı bilgi ve yerinde özel sunum için bize hemen ulaşın.", width / 2, promoY + 100);
        ctx.textAlign = 'left';
      }

      // Start the download
      try {
        const link = document.createElement("a");
        const sanitizedTitle = (property.title || 'ilan').toLowerCase().replace(/\s+/g, '-').substring(0, 20);
        link.download = `afis-${sanitizedTitle}-${selectedTheme}-${selectedRatio}.png`;
        link.href = canvas.toDataURL("image/png");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        setRenderError("Kaydetme işlemi sırasında tarayıcı güvenlik kısıtlaması nedeniyle hata oluştu.");
      }
      setIsRendering(false);
    });
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
                  title="Instagram Square Post (1:1)"
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
              <div 
                ref={previewContainerRef}
                className="relative w-full max-w-[340px] rounded-3xl overflow-hidden shadow-2xl border-4 border-black/80 transition-all duration-300 flex flex-col bg-slate-950 font-sans"
                style={{ 
                  aspectRatio: selectedRatio === 'square' ? '1/1' : '9/16',
                  borderColor: themeConfig.accentHex 
                }}
              >
                
                {/* Full Bleed Image / Collage Grid */}
                <div className="absolute inset-0 w-full h-full z-0 select-none pointer-events-none">
                  {isCollage && property.images && (property.images[1] || property.images[2]) ? (
                    <div className="w-full h-full flex flex-row">
                      {/* Left Main (67%) */}
                      <div className="w-[67%] h-full relative border-r border-black/30 overflow-hidden">
                        {property.images[0] ? (
                          <div className="relative w-full h-full overflow-hidden">
                            <img 
                              src={property.images[0]} 
                              alt={propertyTitle} 
                              className="w-full h-full object-cover filter brightness-[1.12] contrast-[1.05] saturate-[1.12]"
                              referrerPolicy="no-referrer"
                            />
                            {/* Polish Diagonal Glare Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent pointer-events-none mix-blend-overlay" />
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-450 bg-slate-900">🏠</div>
                        )}
                      </div>
                      {/* Right stacked (33%) */}
                      <div className="w-[33%] h-full flex flex-col">
                        <div className="flex-1 relative border-b border-black/30 overflow-hidden">
                          {property.images[1] ? (
                            <div className="relative w-full h-full overflow-hidden">
                              <img 
                                src={property.images[1]} 
                                alt="Görsel 2" 
                                className="w-full h-full object-cover filter brightness-[1.12] contrast-[1.05] saturate-[1.12]"
                                referrerPolicy="no-referrer"
                              />
                              {/* Polish Diagonal Glare Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent pointer-events-none mix-blend-overlay" />
                            </div>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-500 bg-slate-900">📸</div>
                          )}
                        </div>
                        <div className="flex-1 relative overflow-hidden">
                          {property.images[2] ? (
                            <div className="relative w-full h-full overflow-hidden">
                              <img 
                                src={property.images[2]} 
                                alt="Görsel 3" 
                                className="w-full h-full object-cover filter brightness-[1.12] contrast-[1.05] saturate-[1.12]"
                                referrerPolicy="no-referrer"
                              />
                              {/* Polish Diagonal Glare Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent pointer-events-none mix-blend-overlay" />
                            </div>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-500 bg-slate-900">📸</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Full bleed single cover image
                    property.images && property.images[0] ? (
                      <div className="relative w-full h-full overflow-hidden">
                        <img 
                          src={property.images[0]} 
                          alt={propertyTitle} 
                          className="w-full h-full object-cover filter brightness-[1.12] contrast-[1.05] saturate-[1.12]"
                          referrerPolicy="no-referrer"
                        />
                        {/* Polish Diagonal Glare Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent pointer-events-none mix-blend-overlay" />
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-500">
                        <span className="text-4xl">🏠</span>
                      </div>
                    )
                  )}

                  {/* Dark vignette gradient overlays for high text readability */}
                  <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/80 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/95 via-black/70 to-transparent" />
                </div>

                {/* --- CONTENT LAYER --- */}
                <div className="relative z-10 w-full h-full flex flex-col justify-between p-4 flex-1">
                  {/* TOP ROW elements */}
                  <div className="flex justify-between items-start gap-3">
                    {/* Top Left: Oblique bold status banner (Rent vs Sale) */}
                    <div className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                      <span className={`text-[22px] italic font-black tracking-tighter uppercase ${themeConfig.accentText}`}>
                        {isRent ? 'KİRALIK' : 'SATILIK'}
                      </span>
                    </div>

                    {/* Top Right: Accent Tag + Price block */}
                    <div className="flex flex-col items-end gap-1.5 select-none shrink-0 max-w-[140px]">
                      {/* Accent Block Tag */}
                      <div className={`px-2.5 py-1 rounded-sm shadow-md text-black font-black text-[9px] tracking-widest leading-none ${themeConfig.accentBg}`}>
                        {`${roomsText ? roomsText + ' ' : ''}${categoryLabelForPreview(property.type)}`.toUpperCase()}
                      </div>

                      {/* Semi-transparent dark Price Tag */}
                      <div className="bg-black/85 text-center border px-2 py-1.5 rounded-sm shadow-md flex items-center justify-center leading-none" style={{ borderColor: themeConfig.accentHex }}>
                        <span className="text-[12px] font-black tracking-tight" style={{ color: themeConfig.accentHex }}>
                          {priceText}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SPECIAL STORY ONLY PROMOTION LINE (ONLY in Story ratio) */}
                  {selectedRatio === 'story' && (
                    <div className="my-auto px-4 py-3 bg-black/80 border rounded-xl text-center flex flex-col justify-center items-center backdrop-blur-xs shadow-xl" style={{ borderColor: themeConfig.accentHex }}>
                      <span className="text-[9px] font-black block mb-0.5 uppercase tracking-wider text-white">KIBRIS'IN EN SEÇKİN LOKASYONU</span>
                      <p className="text-[8px] max-w-[180px] leading-tight text-slate-300 font-medium">Değer kazanan eşsiz bölgesinde lüks emlak standartları!</p>
                    </div>
                  )}

                  {/* BOTTOM ROW elements */}
                  <div className="flex justify-between items-end gap-3 mt-auto">
                    {/* Bottom Left: Bold Store name inside solid box */}
                    <div className={`px-3 py-2 rounded-sm text-black font-extrabold text-[10px] tracking-wider uppercase leading-none select-none shadow-lg max-w-[120px] truncate ${themeConfig.accentBg}`}>
                      {storeNameDisplay}
                    </div>

                    {/* Bottom Right: Specs Glass Card */}
                    <div className="bg-black/90 border border-white/10 px-3 py-2.5 rounded-sm shadow-xl flex flex-col min-w-[140px] max-w-[160px] leading-tight select-none">
                      <span className="text-[9px] font-black text-white block truncate">📍 {propertyLocation.toUpperCase()}</span>
                      <span className="text-[7.5px] font-extrabold text-slate-400 block truncate uppercase mb-1">{regionText}</span>
                      <div className="h-[1px] bg-white/10 my-1" />
                      <span className="text-[7.5px] font-bold text-slate-300 block truncate">📐 Alan: {sqmText || 'Belirtilmedi'}</span>
                      {isRent ? (
                        <span className="text-[7.5px] font-bold text-slate-300 block truncate">💵 Kapora: {property.deposit ? `${currencySymbol}${formatNumberVal(property.deposit)}` : 'Görüşülecek'}</span>
                      ) : (
                        <span className="text-[7.5px] font-bold text-slate-300 block truncate">📜 Koçan: {titleType}</span>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            </div>
          </div>

          {/* Controls for Template styles */}
          <div className="mt-4">
            <span className="block text-[11px] font-black tracking-wider text-slate-500 uppercase mb-2">🎨 GÖRSEL ŞABLON RENK DETAYI</span>
            <div className="grid grid-cols-4 gap-2">
              <button 
                onClick={() => setSelectedTheme('luxury_dark')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${selectedTheme === 'luxury_dark' ? 'bg-slate-900 border-amber-500 text-white ring-2 ring-amber-500/40 shadow-md' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`}
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-950 to-amber-500 mb-1" />
                <span className="text-[9px] font-bold">Lüks Siyah</span>
              </button>
              <button 
                onClick={() => setSelectedTheme('cyprus_warm')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${selectedTheme === 'cyprus_warm' ? 'bg-orange-50 border-orange-500 text-amber-950 ring-2 ring-orange-400/45 shadow-md' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`}
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-200 to-orange-600 mb-1" />
                <span className="text-[9px] font-bold">Kıbrıs Sıcak</span>
              </button>
              <button 
                onClick={() => setSelectedTheme('modern_indigo')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${selectedTheme === 'modern_indigo' ? 'bg-indigo-950 border-cyan-400 text-white ring-2 ring-cyan-400/35 shadow-md' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`}
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-900 to-cyan-500 mb-1" />
                <span className="text-[9px] font-bold">Sanal Safir</span>
              </button>
              <button 
                onClick={() => setSelectedTheme('minimal_carbon')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${selectedTheme === 'minimal_carbon' ? 'bg-zinc-900 border-zinc-550 text-white ring-2 ring-zinc-500/25 shadow-md' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`}
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-zinc-700 to-neutral-900 mb-1" />
                <span className="text-[9px] font-bold">Kömür Gri</span>
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
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${selectedTone === 'luxury' ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-extrabold' : 'text-slate-550 hover:text-slate-900'}`}
                >
                  ⚜️ Lüks & Prestij
                </button>
                <button 
                  onClick={() => setSelectedTone('investment')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${selectedTone === 'investment' ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-extrabold' : 'text-slate-550 hover:text-slate-900'}`}
                >
                  📈 Yatırım Raporlu
                </button>
                <button 
                  onClick={() => setSelectedTone('friendly')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${selectedTone === 'friendly' ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-extrabold' : 'text-slate-550 hover:text-slate-900'}`}
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
                    className={`px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1 shadow-sm ${copySuccess ? 'bg-emerald-650 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
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
