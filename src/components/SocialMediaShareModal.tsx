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
          bg: 'bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950',
          textTitle: 'text-amber-400 font-extrabold',
          textBody: 'text-zinc-300',
          accentBorder: 'border-amber-500/30',
          pillBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
          priceBg: 'bg-gradient-to-r from-amber-600/90 to-amber-500/90 text-white',
          footerBg: 'bg-slate-950/60 border-t border-slate-800'
        };
      case 'cyprus_warm':
        return {
          bg: 'bg-gradient-to-br from-amber-50 via-orange-50/50 to-stone-100',
          textTitle: 'text-amber-900 font-extrabold',
          textBody: 'text-stone-700',
          accentBorder: 'border-orange-500/20',
          pillBg: 'bg-orange-500/10 text-orange-950 border-orange-500/10',
          priceBg: 'bg-gradient-to-r from-orange-600 to-amber-700 text-white',
          footerBg: 'bg-orange-100 border-t border-orange-200'
        };
      case 'modern_indigo':
        return {
          bg: 'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900',
          textTitle: 'text-cyan-400 font-extrabold',
          textBody: 'text-indigo-100',
          accentBorder: 'border-cyan-500/30',
          pillBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
          priceBg: 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white',
          footerBg: 'bg-indigo-950/60 border-t border-indigo-900'
        };
      case 'minimal_carbon':
        return {
          bg: 'bg-gradient-to-br from-zinc-900 via-neutral-900 to-zinc-950',
          textTitle: 'text-white font-extrabold',
          textBody: 'text-zinc-300',
          accentBorder: 'border-zinc-700',
          pillBg: 'bg-zinc-800 text-zinc-100 border-zinc-700',
          priceBg: 'bg-white text-zinc-955',
          footerBg: 'bg-zinc-950/80 border-t border-zinc-800'
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

    // Draw high quality background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    if (selectedTheme === 'luxury_dark') {
      gradient.addColorStop(0, '#020617'); // slate-950
      gradient.addColorStop(0.5, '#0f172a'); // slate-900
      gradient.addColorStop(1, '#090d16');
    } else if (selectedTheme === 'cyprus_warm') {
      gradient.addColorStop(0, '#fffbf7'); // soft light amber
      gradient.addColorStop(0.6, '#fef3c7'); // warm amber-100
      gradient.addColorStop(1, '#fadbbb');
    } else if (selectedTheme === 'modern_indigo') {
      gradient.addColorStop(0, '#030712'); // gray-950
      gradient.addColorStop(0.5, '#1e1b4b'); // indigo-950
      gradient.addColorStop(1, '#080a15');
    } else {
      gradient.addColorStop(0, '#18181b'); // zinc-900
      gradient.addColorStop(0.5, '#09090b'); // zinc-950
      gradient.addColorStop(1, '#1c1c1f');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Apply beautiful vector ambient lighting or abstract geometric accents
    ctx.strokeStyle = selectedTheme === 'luxury_dark' ? 'rgba(245, 158, 11, 0.15)' :
                      selectedTheme === 'cyprus_warm' ? 'rgba(234, 88, 12, 0.1)' :
                      selectedTheme === 'modern_indigo' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      ctx.arc(width / 2, height / 2, 200 + i * 150, 0, Math.PI * 2);
    }
    ctx.stroke();

    // Dynamic framing closer to edge = 16px instead of 30px to maximize image layout
    const borderPadding = 16;
    ctx.strokeStyle = selectedTheme === 'luxury_dark' ? '#d97706' : // amber-600
                      selectedTheme === 'cyprus_warm' ? '#ea580c' : // orange-600
                      selectedTheme === 'modern_indigo' ? '#06b6d4' : '#e4e4e7'; // cyan or white
    ctx.lineWidth = 12;
    ctx.strokeRect(borderPadding, borderPadding, width - (borderPadding * 2), height - (borderPadding * 2));

    // Render minimalist header on a single row Y
    ctx.fillStyle = selectedTheme === 'cyprus_warm' ? '#451a03' : '#ffffff';
    ctx.font = '900 24px \'Montserrat\', sans-serif';
    ctx.letterSpacing = '1px';
    const agentNameUpper = `👤 ${(property.responsible_agent || branding?.owner_name || 'DANIŞMAN').toUpperCase()}`;
    ctx.fillText(agentNameUpper, borderPadding + 50, borderPadding + 69);

    // Reference ID badge in the CENTER on top
    const refNo = `LP-${property.reference_no || property.id}`;
    ctx.fillStyle = selectedTheme === 'cyprus_warm' ? '#ea580c' : '#111827';
    ctx.fillRect((width / 2) - 95, borderPadding + 32, 190, 48);
    ctx.strokeStyle = selectedTheme === 'cyprus_warm' ? '#f97316' : '#d97706';
    ctx.lineWidth = 2;
    ctx.strokeRect((width / 2) - 95, borderPadding + 32, 190, 48);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 16px monospace';
    ctx.letterSpacing = '1px';
    ctx.textAlign = 'center';
    ctx.fillText(refNo, width / 2, borderPadding + 62);
    ctx.textAlign = 'left';

    // Contact number on the right side
    ctx.fillStyle = selectedTheme === 'cyprus_warm' ? '#451a03' : '#ffffff';
    ctx.font = '900 24px \'Montserrat\', sans-serif';
    ctx.textAlign = 'right';
    const contactTextUpper = `📞 ${property.consultant_phone || branding?.phone || branding?.whatsapp_number || 'YETKİLİ'}`;
    ctx.fillText(contactTextUpper, width - borderPadding - 50, borderPadding + 69);
    ctx.textAlign = 'left';

    // Image layout logic
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

    const wrapText = (text: string, maxWidth: number) => {
      const words = text.split(" ");
      const lines = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const widthCheck = ctx.measureText(currentLine + " " + word).width;
        if (widthCheck < maxWidth) {
          currentLine += " " + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      return lines;
    };

    Promise.all(imageUrls.map(loadImg)).then((loadedImages) => {
      const imgElement = loadedImages[0];
      const sideImg1 = loadedImages[1];
      const sideImg2 = loadedImages[2];

      // Set target dimensions & positioning for image box based on aspect ratio
      const imgX = borderPadding + 50;
      const imgY = borderPadding + 110;
      const imgWidth = width - (borderPadding * 2) - 100;
      const imgHeight = selectedRatio === 'square' ? 610 : 1100;

      // Draw shadow background for image path
      ctx.fillStyle = selectedTheme === 'cyprus_warm' ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.3)';
      ctx.fillRect(imgX, imgY, imgWidth, imgHeight);

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
            ctx.drawImage(imgPtr, sx, sy, sWidth, sHeight, x, y, w, h);
          } catch (err) {
            drawFallbackBlock(x, y, w, h, emoji);
          }
        } else {
          drawFallbackBlock(x, y, w, h, emoji);
        }
      };

      ctx.save();
      ctx.rect(imgX, imgY, imgWidth, imgHeight);
      ctx.clip();

      if (isCollage && (sideImg1 || sideImg2)) {
        // Collage grid: Left main image (67%), Right stacked column (33%)
        const mainW = Math.round(imgWidth * 0.67);
        const gapSize = 8;
        const sideXWidth = imgWidth - mainW - gapSize;
        const sideH = Math.round((imgHeight - gapSize) / 2);

        // Main Left
        drawSingleImageCover(imgElement, imgX, imgY, mainW, imgHeight, "🏠");

        // Side stacked
        drawSingleImageCover(sideImg1, imgX + mainW + gapSize, imgY, sideXWidth, sideH, "📸");
        drawSingleImageCover(sideImg2, imgX + mainW + gapSize, imgY + sideH + gapSize, sideXWidth, sideH, "📸");
      } else {
        // Regular single cover
        drawSingleImageCover(imgElement, imgX, imgY, imgWidth, imgHeight, "🏠");
      }

      ctx.restore();

      // Subtle black gradient overlays on the bottom of the image for premium depth
      const imgGrad = ctx.createLinearGradient(imgX, imgY + imgHeight - 150, imgX, imgY + imgHeight);
      imgGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      imgGrad.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
      ctx.fillStyle = imgGrad;
      ctx.fillRect(imgX, imgY + imgHeight - 150, imgWidth, 150);

      // Draw high resolution elegant frame around image
      ctx.strokeStyle = selectedTheme === 'cyprus_warm' ? '#fed7aa' : 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 4;
      ctx.strokeRect(imgX, imgY, imgWidth, imgHeight);

      // --- TEXT CONTENT AREA ---
      const contentYStart = imgY + imgHeight + 50;

      // Type Badge
      ctx.fillStyle = selectedTheme === 'luxury_dark' ? '#f59e0b' :
                      selectedTheme === 'cyprus_warm' ? '#ea580c' :
                      selectedTheme === 'modern_indigo' ? '#22d3ee' : '#d4d4d8';
      ctx.fillRect(borderPadding + 50, contentYStart, 160, 36);

      ctx.fillStyle = selectedTheme === 'luxury_dark' || selectedTheme === 'modern_indigo' ? '#000000' : '#ffffff';
      ctx.font = 'bold 15px \'Montserrat\', sans-serif';
      ctx.textAlign = 'center';
      const categoryLabel = (property.type === 'residence' ? 'KONUT' : property.type === 'commercial' ? 'TİCARİ' : 'ARSA');
      ctx.fillText(categoryLabel, borderPadding + 130, contentYStart + 24);
      ctx.textAlign = 'left';

      // Location badge next to it
      ctx.fillStyle = selectedTheme === 'cyprus_warm' ? '#fff7ed' : 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(borderPadding + 225, contentYStart, 260, 36);
      ctx.strokeStyle = selectedTheme === 'cyprus_warm' ? '#ffedd5' : 'rgba(255, 255, 255, 0.15)';
      ctx.strokeRect(borderPadding + 225, contentYStart, 260, 36);

      ctx.fillStyle = selectedTheme === 'cyprus_warm' ? '#7c2d12' : '#ffffff';
      ctx.font = 'bold 14px \'Golos Text\', sans-serif';
      ctx.fillText(`📍 ${propertyLocation.toUpperCase()} (${regionText.toUpperCase()})`, borderPadding + 245, contentYStart + 23);

      // Style and draw high resolution callout card for Story vertical ratio
      if (selectedRatio === 'story') {
        const cardY = contentYStart + 70;
        const cardH = 80;
        ctx.fillStyle = selectedTheme === 'cyprus_warm' ? 'rgba(234, 88, 12, 0.08)' : 'rgba(245, 158, 11, 0.08)';
        ctx.fillRect(borderPadding + 50, cardY, width - (borderPadding * 2) - 100, cardH);
        ctx.strokeStyle = selectedTheme === 'cyprus_warm' ? 'rgba(234, 88, 12, 0.2)' : 'rgba(245, 158, 11, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(borderPadding + 50, cardY, width - (borderPadding * 2) - 100, cardH);

        ctx.fillStyle = selectedTheme === 'cyprus_warm' ? '#7c2d12' : '#ca8a04';
        ctx.font = '900 16px \'Montserrat\', sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("KIBRIS'IN EN SEÇKİN PORTFÖY DEĞERLERİ İLE EŞSİZ YATIRIM FIRSATI!", width / 2, cardY + 46);
        ctx.textAlign = 'left';
      }

      // Price Tag (Huge accent block)
      const priceBlockY = selectedRatio === 'square' ? 940 : 1660;
      
      const priceGradient = ctx.createLinearGradient(80, priceBlockY, width - 80, priceBlockY);
      if (selectedTheme === 'luxury_dark') {
        priceGradient.addColorStop(0, '#ca8a04'); // amber-600
        priceGradient.addColorStop(1, '#eab308'); // amber-500
      } else if (selectedTheme === 'cyprus_warm') {
        priceGradient.addColorStop(0, '#c2410c'); // orange-700
        priceGradient.addColorStop(1, '#ea580c'); // orange-600
      } else if (selectedTheme === 'modern_indigo') {
        priceGradient.addColorStop(0, '#4f46e5'); // indigo-600
        priceGradient.addColorStop(1, '#06b6d4'); // cyan-500
      } else {
        priceGradient.addColorStop(0, '#ffffff');
        priceGradient.addColorStop(1, '#e4e4e7');
      }
      ctx.fillStyle = priceGradient;
      ctx.fillRect(borderPadding + 50, priceBlockY, width - (borderPadding * 2) - 100, 100);

      // Price text overlay
      ctx.fillStyle = selectedTheme === 'minimal_carbon' ? '#09090b' : '#ffffff';
      ctx.font = 'bold 15px \'Montserrat\', sans-serif';
      ctx.letterSpacing = '1px';
      ctx.fillText(property.listing_intent === 'rent' ? "AYLIK KİRA BEDELİ" : "LİSTE SATIŞ BEDELİ", borderPadding + 80, priceBlockY + 40);

      ctx.font = '900 45px \'Montserrat\', sans-serif';
      ctx.fillText(priceText, borderPadding + 80, priceBlockY + 84);

      // Bullet features badges
      const specY = selectedRatio === 'square' ? priceBlockY - 45 : priceBlockY - 90;
      ctx.fillStyle = selectedTheme === 'cyprus_warm' ? '#7c2d12' : '#ffffff';
      ctx.font = '800 21px \'Golos Text\', sans-serif';

      let specString = ``;
      if (property.subtype) specString += `🏠 ${property.subtype}  •  `;
      if (property.square_meters) specString += `📐 ${property.square_meters} m² Net  •  `;
      if (property.room_count) specString += `🛏️ ${property.room_count} Oda  •  `;
      if (isRent) {
        specString += property.furnished ? `🛋️ Eşyalı` : `📦 Eşyasız`;
        if (property.deposit !== undefined && property.deposit > 0) {
          specString += `  •  💰 Depozito: ${currencySymbol}${formatNumberVal(property.deposit)}`;
        }
        if (property.billing_period) {
          const bpText = property.billing_period === 'yearly' ? 'Yıllık' :
                         property.billing_period === '3-monthly' ? '3 Aylık' :
                         property.billing_period === '6-monthly' ? '6 Aylık' : 'Aylık';
          specString += ` (${bpText})`;
        }
      } else {
        specString += `📜 ${titleType}`;
      }
      ctx.fillText(specString, borderPadding + 50, specY);

      // Footer
      const footerY = height - 60;
      ctx.strokeStyle = selectedTheme === 'cyprus_warm' ? '#fed7aa' : 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(borderPadding + 50, footerY - 20);
      ctx.lineTo(width - borderPadding - 50, footerY - 20);
      ctx.stroke();

      ctx.fillStyle = selectedTheme === 'cyprus_warm' ? '#451a03' : '#ffffff';
      ctx.font = '900 24px \'Montserrat\', sans-serif';
      ctx.letterSpacing = '2px';
      ctx.textAlign = 'left';
      const rawStoreName = branding?.store_name || branding?.name || 'PREMIUM VIP EMLAK';
      const storeNameDisplay = (rawStoreName.toLowerCase().includes('lookprice') ? 'PREMIUM VIP EMLAK' : rawStoreName).toUpperCase();
      ctx.fillText(storeNameDisplay, borderPadding + 50, footerY + 15);
      
      ctx.textAlign = 'right';
      ctx.fillStyle = selectedTheme === 'cyprus_warm' ? 'rgba(69, 26, 3, 0.8)' : 'rgba(255, 255, 255, 0.7)';
      ctx.font = '900 20px \'Montserrat\', sans-serif';
      ctx.letterSpacing = '1px';
      ctx.fillText('ENRAKİPSİZ.COM', width - borderPadding - 50, footerY + 15);
      ctx.textAlign = 'left';

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
                className={`relative w-full max-w-[340px] rounded-2xl overflow-hidden shadow-xl border-4 ${themeConfig.accentBorder} ${themeConfig.bg} transition-all duration-300 flex flex-col`}
                style={{ aspectRatio: selectedRatio === 'square' ? '1/1' : '9/16' }}
              >
                
                {/* Minimalist Header */}
                <div className="px-3.5 py-1.5 flex justify-between items-center z-10 border-b border-white/5 bg-slate-950/15">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h3 className={`text-[8.5px] font-black truncate max-w-[120px] leading-none select-none uppercase tracking-widest ${themeConfig.textTitle}`}>
                      👤 {property.responsible_agent || branding?.owner_name || 'Danışman'}
                    </h3>
                  </div>
                  <span className={`${themeConfig.pillBg} font-mono text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase select-none shrink-0 border`}>
                    LP-{property.reference_no || property.id}
                  </span>
                  <div className="flex items-center text-right shrink-0">
                    <h3 className={`text-[8.5px] font-black leading-none select-none tracking-widest ${themeConfig.textTitle}`}>
                      📞 {property.consultant_phone || branding?.phone || branding?.whatsapp_number || 'YETKİLİ MAĞAZA'}
                    </h3>
                  </div>
                </div>

                {/* Property Image Cover Block */}
                <div className="px-3 mt-1 flex-1 flex flex-col justify-center min-h-0">
                  <div className={`relative w-full rounded-xl overflow-hidden bg-slate-850/50 border border-slate-700 transition-all ${
                    selectedRatio === 'story' ? 'h-[250px] sm:h-[320px]' : 'h-[195px] sm:h-[245px]'
                  }`}>
                    {isCollage && property.images && (property.images[1] || property.images[2]) ? (
                      <div className="absolute inset-0 w-full h-full flex flex-row">
                        {/* Main Image (67% width) */}
                        <div className="w-[67%] h-full border-r border-white/10 overflow-hidden relative">
                          {property.images[0] ? (
                            <img 
                              src={property.images[0]} 
                              alt={propertyTitle} 
                              className="w-full h-full object-cover select-none"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 bg-slate-800">Ana Görsel</div>
                          )}
                        </div>

                        {/* Side stack (33% width) */}
                        <div className="w-[33%] h-full flex flex-col border-l border-white/10">
                          <div className="flex-1 border-b border-white/10 overflow-hidden relative">
                            {property.images[1] ? (
                              <img 
                                src={property.images[1]} 
                                alt="Görsel 2" 
                                className="w-full h-full object-cover select-none"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-[7px] text-slate-500 bg-slate-850 font-bold">Resim 2</div>
                            )}
                          </div>
                          <div className="flex-1 overflow-hidden relative">
                            {property.images[2] ? (
                              <img 
                                src={property.images[2]} 
                                alt="Görsel 3" 
                                className="w-full h-full object-cover select-none"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-[7px] text-slate-500 bg-slate-850 font-bold">Resim 3</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Regular single image
                      property.images && property.images[0] ? (
                        <img 
                          src={property.images[0]} 
                          alt={propertyTitle} 
                          className="w-full h-full object-cover select-none"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                          <span className="text-3xl">🏠</span>
                          <span className="text-[9px] font-bold mt-1">Görsel Eklenmemiş</span>
                        </div>
                      )
                    )}
                    
                    {/* Floating Price Plate */}
                    <div className="absolute bottom-2 right-2 bg-slate-950/90 text-white px-3 py-1 rounded-lg border border-slate-700 shadow-lg text-right">
                      <span className="block text-[6px] text-slate-400 font-extrabold uppercase">
                        {property.listing_intent === 'rent' ? 'KİRA BEDELİ' : 'SATIŞ BEDELİ'}
                      </span>
                      <span className="text-xs font-black text-emerald-400">{priceText}</span>
                    </div>
                  </div>
                </div>

                {/* Specs Box */}
                <div className="px-4 mt-2">
                  <div className="flex gap-1 flex-wrap select-none font-sans">
                    <span className={`text-[8.5px] font-black px-2 py-0.5 rounded-md border uppercase ${themeConfig.pillBg}`}>
                      {categoryLabelForPreview(property.type)}
                    </span>
                    {property.subtype && (
                      <span className={`text-[8.5px] font-bold px-2 py-0.5 rounded-md border uppercase ${themeConfig.pillBg}`}>
                        🏠 {property.subtype}
                      </span>
                    )}
                    <span className={`text-[8.5px] font-black px-2 py-0.5 rounded-md border uppercase ${themeConfig.pillBg}`}>
                      📍 {propertyLocation}
                    </span>
                    {property.square_meters && (
                      <span className={`text-[8.5px] font-black px-2 py-0.5 rounded-md border uppercase ${themeConfig.pillBg}`}>
                        📐 {property.square_meters} m²
                      </span>
                    )}
                  </div>
                  
                  <p className={`text-[10px] font-bold mt-2.5 tracking-tight truncate ${themeConfig.textBody}`}>
                    {roomsText ? `🛌 ${roomsText} • ` : ''}
                    {isRent 
                      ? `${property.furnished ? '🛋️ Eşyalı' : '🔑 Boş'} • ${property.deposit ? `💰 Depozito: ${currencySymbol}${formatNumberVal(property.deposit)}` : 'Depozitosuz'} • ⏱️ ${
                          property.billing_period === 'yearly' ? 'Yıllık' :
                          property.billing_period === '3-monthly' ? '3 Aylık' :
                          property.billing_period === '6-monthly' ? '6 Aylık' : 'Aylık'
                        }` 
                      : `📜 ${titleType}`}
                    {property.kktc_region ? ` • 🌍 ${property.kktc_region}` : ''}
                  </p>
                </div>

                {/* Callout box for Vertical Ratio */}
                {selectedRatio === 'story' && (
                  <div className={`px-4 py-3 mx-4 my-2 rounded-xl text-center flex flex-col justify-center items-center border ${
                    selectedTheme === 'cyprus_warm'
                      ? 'bg-orange-100/30 border-orange-200/50'
                      : 'bg-amber-500/10 border-amber-550/25'
                  }`}>
                    <span className={`text-[10px] font-black block mb-0.5 uppercase tracking-widest ${
                      selectedTheme === 'cyprus_warm' ? 'text-orange-950' : 'text-amber-300'
                    }`}>👑 EN POPÜLER LOKASYON</span>
                    <p className={`text-[9px] max-w-[200px] mx-auto ${
                      selectedTheme === 'cyprus_warm' ? 'text-stone-850 font-semibold' : 'text-zinc-300'
                    }`}>Kıbrıs'ın değer kazanan emsalsiz bölgesinde lüks yaşam standartları!</p>
                  </div>
                )}

                {/* Footer slim */}
                <div className={`mt-auto px-4 py-2 flex justify-between items-center text-[7.5px] leading-none ${themeConfig.footerBg}`}>
                  <div className={`truncate font-black uppercase tracking-widest ${themeConfig.textTitle}`}>
                    {(branding?.store_name && !branding.store_name.toLowerCase().includes('lookprice')) ? branding.store_name : 'PREMIUM VIP EMLAK'}
                  </div>
                  <div className={`text-right font-black uppercase tracking-widest opacity-80 text-[6.5px] ${themeConfig.textBody}`}>
                    enrakipsiz.com
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
