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
  const [selectedTone, setSelectedTone] = useState<CaptionTone>('luxury');
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
          pillBg: 'bg-orange-500/10 text-orange-850 border-orange-500/10',
          priceBg: 'bg-gradient-to-r from-orange-600 to-amber-700 text-white',
          footerBg: 'bg-stone-50 border-t border-stone-200'
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
    const brandName = branding?.store_name || branding?.name || 'LookPrice Real Estate';
    const contactPhone = branding?.phone || '+90 (548) 000 0000';
    const brokerName = property.responsible_agent || 'LookPrice Uzman Portföy Temsilcisi';

    switch (selectedTone) {
      case 'luxury':
        return `🌟 PRESTİJ VE LÜKS BİR ARADA! 🌟\n\n` +
               `Kuzey Kıbrıs emlak pazarının parlayan yıldızı ${propertyLocation} bölgesinde, elit standartlarda ve eşsiz konfor donanımlarıyla süslenmiş yeni bir portföy ile karşınızdayız.\n\n` +
               `🏡 Mülk Detayları:\n` +
               `• Tip: ${typeText} / ${roomsText || 'Geniş Yerleşim'}\n` +
               `• Metrekare: ${sqmText || 'Belirtilmedi'}\n` +
               `• Tapu Durumu: ${titleType}\n` +
               `• Bölge: ${regionText}\n\n` +
               `💰 Değerleme Fiyatı: ${priceText}\n\n` +
               `Sınırları zorlayan mimarisi, lüks kaplama detayları ve yüksek yaşam standartlarıyla bu mülk, hem prestijli bir yaşam hem de seçkin bir varlık yatırımı sunmaktadır.\n\n` +
               `Detaylı fizibilite dosyası, video turu ve yerinde özel randevulu sunum talepleriniz için bize hemen DM gönderebilir ya da iletişim hattımızdan ulaşabilirsiniz.\n\n` +
               `👤 Danışman: ${brokerName}\n` +
               `📞 İletişim: ${contactPhone}\n` +
               `🏢 Ofis: ${brandName}\n\n` +
               `#kibrisemlak #${propertyLocation.toLowerCase()}emlak #kibrisyatirim #luxurylire #lookprice #realestatepremium #yatirimfirsati`;

      case 'investment':
        return `📈 KAÇIRILMAYACAK YATIRIM VE ARTI DEĞER FIRSATI! 📈\n\n` +
               `LookPrice Çok Şubeli Ağ Veri Analizlerimize göre, ${propertyLocation} bölgesinde emsallere kıyasla %15+ değer avantajı sağlayan üst seviye portföyümüz ön lansman aşamasında satışa sunulmuştur.\n\n` +
               `🎯 Finansal & Yapısal Özet:\n` +
               `• Bölgesel Amortisman Trendi: Çok hızlı geri dönüş rasyosu\n` +
               `• Kapalı Alan Raporu: ${sqmText || 'Belirtilmedi'} (${roomsText})\n` +
               `• Konum Kusursuzluğu: Ana arterlere, denize ve lüks marina hattına yürüme mesafesinde\n` +
               `• Tapu Statüsü: ${titleType} (Sorunsuz devir hazır)\n\n` +
               `💰 Fırsat Liste Bedeli: ${priceText}\n\n` +
               `Kıbrıs'ta yüksek döviz kira getirisi (GBP bazlı amortisman) ve kesintisiz bölgesel prim potansiyeli arayan uluslararası yatırımcılar için ideal kârlılık şeması geliştirilmiştir.\n\n` +
               `LookPrice güvencesiyle dosya analizi ve hızlı devir süreçleri için bizimle iletişime geçin.\n\n` +
               `📞 Detaylar İçin Arayın: ${contactPhone}\n` +
               `👤 Sorumlu Temsilci: ${brokerName}\n` +
               `🏢 Yetkili Şube: ${brandName}\n\n` +
               `#kibrisemlak #kibrisyatirim #emlakraporu #lookpricecapital #yatirimvizyonu #kibrissatilik #${propertyLocation.toLowerCase()}realestate`;

      case 'friendly':
        return `🔑 Hayalinizdeki Kıbrıs Yaşamına İlk Adımı Atın! 🔑\n\n` +
               `Merhaba sevgili takipçilerimiz! Bugün size Kuzey Kıbrıs'ın en samimi, en huzurlu köşelerinden biri olan ${propertyLocation}'da yer alan sıcacık bir ${typeText.toLowerCase()} fırsatını tanıtmak istiyoruz. 😍\n\n` +
               `✨ Neden Burayı Çok Seveceksiniz?\n` +
               `👉 Tam ${roomsText || 'Geniş Yaşam Alanı'} ferahlığı\n` +
               `👉 Metraj Konforu: ${sqmText || 'Belirtilmedi'} kullanım alanı\n` +
               `👉 Güvenli Tapu: ${titleType} güvencesiyle içiniz rahat\n` +
               `👉 Lokasyon Dostu: Alışveriş noktalarına, kafelere ve masmavi plajlara çok yakın!\n\n` +
               `💰 Fiyat: ${priceText} (Hızlı karar veren fırsat sahibi olur!)\n\n` +
               `Her sabah eşsiz Kıbrıs havasına gözlerinizi açacağınız, sevdiklerinizle huzurlu anılar biriktireceğiniz muhteşem bir konsepte sahip.\n\n` +
               `Kahvemizi içmeye ve bu güzel mülkün tüm detaylarını yüz yüze konuşmaya bekliyoruz! 😊☕️\n\n` +
               `💬 Hemen DM atın ya da bizi arayın:\n` +
               `📞 Cep: ${contactPhone}\n` +
               `👤 Danışmanınız: ${brokerName}\n` +
               `🏢 Emlak Ağı: ${brandName}\n\n` +
               `#kibrisvizyon #keyifliyasam #kibrissatilikdaire #lookpriceemlak #huzurluyasam #kibristaevsahibiol #homedesign`;
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

    // Draw premium border framing
    ctx.strokeStyle = selectedTheme === 'luxury_dark' ? '#d97706' : // amber-600
                      selectedTheme === 'cyprus_warm' ? '#ea580c' : // orange-600
                      selectedTheme === 'modern_indigo' ? '#06b6d4' : '#e4e4e7'; // cyan or white
    ctx.lineWidth = 12;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // Render title and marketing headers
    ctx.fillStyle = selectedTheme === 'cyprus_warm' ? '#451a03' : '#ffffff';
    ctx.font = '900 24px system-ui, sans-serif';
    ctx.letterSpacing = '5px';
    const brandNameUpper = (branding?.store_name || branding?.name || 'LOOKPRICE').toUpperCase();
    ctx.fillText(brandNameUpper, 80, 95);

    ctx.fillStyle = selectedTheme === 'luxury_dark' ? '#f59e0b' :
                    selectedTheme === 'cyprus_warm' ? '#c2410c' :
                    selectedTheme === 'modern_indigo' ? '#06b6d4' : '#a1a1aa';
    ctx.font = '800 13px system-ui, sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText("PREMIUM REAL ESTATE NETWORK", 80, 125);

    // Reference ID badge on top right
    const refNo = `LP-${property.reference_no || property.id}`;
    ctx.fillStyle = selectedTheme === 'cyprus_warm' ? '#ea580c' : '#1e293b';
    ctx.fillRect(width - 280, 70, 200, 45);
    ctx.strokeStyle = selectedTheme === 'cyprus_warm' ? '#f97316' : '#d97706';
    ctx.lineWidth = 2;
    ctx.strokeRect(width - 280, 70, 200, 45);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px monospace';
    ctx.letterSpacing = '1px';
    ctx.textAlign = 'center';
    ctx.fillText(refNo, width - 180, 98);
    ctx.textAlign = 'left';

    // Now, load the main image if exists
    const mainImageUrl = property.images && property.images[0] ? property.images[0] : null;

    const finalizeDrawAndDownload = (imgElement: HTMLImageElement | null) => {
      // Set target dimensions & positioning for image box based on aspect ratio
      const imgX = 80;
      const imgY = 160;
      const imgWidth = width - 160;
      const imgHeight = selectedRatio === 'square' ? 440 : 800;

      // Draw shadow background for image path
      ctx.fillStyle = selectedTheme === 'cyprus_warm' ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.3)';
      ctx.fillRect(imgX, imgY, imgWidth, imgHeight);

      if (imgElement) {
        try {
          // Draw property image nicely (cover style)
          const imgAspect = imgElement.width / imgElement.height;
          const targetAspect = imgWidth / imgHeight;

          let sx = 0, sy = 0, sWidth = imgElement.width, sHeight = imgElement.height;

          if (imgAspect > targetAspect) {
            // Image is wider than target aspect ratio
            sWidth = imgElement.height * targetAspect;
            sx = (imgElement.width - sWidth) / 2;
          } else {
            // Image is taller than target aspect ratio
            sHeight = imgElement.width / targetAspect;
            sy = (imgElement.height - sHeight) / 2;
          }

          ctx.drawImage(imgElement, sx, sy, sWidth, sHeight, imgX, imgY, imgWidth, imgHeight);

          // Add a subtle dark gradient overlays on the bottom of the image for premium depth
          const imgGrad = ctx.createLinearGradient(imgX, imgY + imgHeight - 150, imgX, imgY + imgHeight);
          imgGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
          imgGrad.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
          ctx.fillStyle = imgGrad;
          ctx.fillRect(imgX, imgY + imgHeight - 150, imgWidth, 150);

        } catch (err) {
          // CORS fallback gradient block
          drawCorsFallback(imgX, imgY, imgWidth, imgHeight);
        }
      } else {
        // No image fallback icon block
        drawCorsFallback(imgX, imgY, imgWidth, imgHeight);
      }

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
      ctx.fillRect(80, contentYStart, 160, 36);

      ctx.fillStyle = selectedTheme === 'luxury_dark' || selectedTheme === 'modern_indigo' ? '#000000' : '#ffffff';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      const categoryLabel = (property.type === 'residence' ? 'KONUT' : property.type === 'commercial' ? 'TİCARİ' : 'ARSA');
      ctx.fillText(categoryLabel, 160, contentYStart + 24);
      ctx.textAlign = 'left';

      // Location badge next to it
      ctx.fillStyle = selectedTheme === 'cyprus_warm' ? '#fff7ed' : 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(255, contentYStart, 260, 36);
      ctx.strokeStyle = selectedTheme === 'cyprus_warm' ? '#ffedd5' : 'rgba(255, 255, 255, 0.15)';
      ctx.strokeRect(255, contentYStart, 260, 36);

      ctx.fillStyle = selectedTheme === 'cyprus_warm' ? '#7c2d12' : '#ffffff';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.fillText(`📍 ${propertyLocation.toUpperCase()} (${regionText.toUpperCase()})`, 275, contentYStart + 23);

      // Dynamic Title
      ctx.fillStyle = selectedTheme === 'cyprus_warm' ? '#292524' : '#ffffff';
      ctx.font = '900 36px system-ui, sans-serif';
      const titleLines = wrapText(propertyTitle, width - 160);
      let titleY = contentYStart + 90;
      titleLines.forEach((line, index) => {
        if (index < 2) { // Show max two lines of title
          ctx.fillText(line, 80, titleY);
          titleY += 45;
        }
      });

      // Price Tag (Huge accent block)
      const priceBlockY = selectedRatio === 'square' ? height - 200 : height - 380;
      
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
      ctx.fillRect(80, priceBlockY, width - 160, 100);

      // Price text overlay
      ctx.fillStyle = selectedTheme === 'minimal_carbon' ? '#09090b' : '#ffffff';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.letterSpacing = '1px';
      ctx.fillText("SATILIK / KİRALIK LİSTE BEDELİ", 110, priceBlockY + 40);

      ctx.font = '900 45px system-ui, sans-serif';
      ctx.fillText(priceText, 110, priceBlockY + 84);

      // Bullet features badges
      const specY = priceBlockY - 70;
      ctx.fillStyle = selectedTheme === 'cyprus_warm' ? '#7c2d12' : '#ffffff';
      ctx.font = '800 20px system-ui, sans-serif';

      let specString = ``;
      if (property.square_meters) specString += `📐 ${property.square_meters} m² Net  •  `;
      if (property.room_count) specString += `🛏️ ${property.room_count} Oda  •  `;
      specString += `📜 ${titleType}`;
      ctx.fillText(specString, 80, specY);

      // Footer
      const footerY = height - 60;
      ctx.strokeStyle = selectedTheme === 'cyprus_warm' ? '#fed7aa' : 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(80, footerY - 20);
      ctx.lineTo(width - 80, footerY - 20);
      ctx.stroke();

      ctx.fillStyle = selectedTheme === 'cyprus_warm' ? '#c2410c' : '#a1a1aa';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillText(`PORTFÖY SORUMLUSU: ${property.responsible_agent || 'LOOKPRICE DANISMANI'}`, 80, footerY + 15);
      
      ctx.textAlign = 'right';
      const footerPhone = branding?.phone ? `İLETİŞİM: ${branding.phone}` : 'KUZEY KIBRIS ÇOK ŞUBELİ PORTAL AĞI';
      ctx.fillText(footerPhone, width - 80, footerY + 15);
      ctx.textAlign = 'left';

      // Start the download
      try {
        const link = document.createElement("a");
        const sanitizedTitle = (property.title || 'ilan').toLowerCase().replace(/\s+/g, '-').substring(0, 20);
        link.download = `lookprice-${sanitizedTitle}-${selectedTheme}-${selectedRatio}.png`;
        link.href = canvas.toDataURL("image/png");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        setRenderError("Kaydetme işlemi sırasında tarayıcı güvenlik kısıtlaması nedeniyle hata oluştu.");
      }
      setIsRendering(false);
    };

    const drawCorsFallback = (x: number, y: number, w: number, h: number) => {
      // Create a nice looking mesh pattern
      const grad = ctx.createLinearGradient(x, y, x + w, y + h);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(1, '#334155');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);

      // Abstract line graphics
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 3;
      for (let offset = 0; offset < w + h; offset += 60) {
        ctx.beginPath();
        ctx.moveTo(x + offset, y);
        ctx.lineTo(x, y + offset);
        ctx.stroke();
      }

      // Draw stylized building silhouette vector or icon text
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.font = 'bold 100px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("🏠", x + w/2, y + h/2 + 20);

      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '800 13px system-ui, sans-serif';
      ctx.letterSpacing = '1px';
      ctx.fillText("PREMIUM PORTFÖY HAFIZASI", x + w/2, y + h/2 + 70);
      ctx.textAlign = 'left';
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

    if (mainImageUrl) {
      const img = new Image();
      // Ensure crossOrigin is configured for fallback safety
      img.crossOrigin = "anonymous";
      img.onload = () => {
        finalizeDrawAndDownload(img);
      };
      img.onerror = () => {
        // If image loading fails (CORS, invalid URL, offline etc.), finalize with dummy image representation.
        finalizeDrawAndDownload(null);
      };
      
      // Handle cache-busting securely for AWS/CDN image configurations
      const cacheBustSep = mainImageUrl.includes('?') ? '&' : '?';
      img.src = mainImageUrl + cacheBustSep + "lookprice_export_ts=" + Date.now();
    } else {
      finalizeDrawAndDownload(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[999] flex items-center justify-center p-4 overflow-y-auto font-sans" id="social-share-wizard-modal">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh]">
        
        {/* Left Side: Real Real-time Interactive Poster Preview */}
        <div className="lg:w-1/2 bg-slate-100 p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200 overflow-y-auto">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5" /> REELTIME AFİŞ ÖNİZLEME
              </span>
              <div className="flex items-center gap-1">
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
                
                {/* Header */}
                <div className="p-4 flex justify-between items-start z-10">
                  <div>
                    <h3 className={`text-base font-black truncate max-w-[180px] leading-tight select-none uppercase tracking-wider ${themeConfig.textTitle}`}>
                      {branding?.store_name || branding?.name || 'LOOKPRICE'}
                    </h3>
                    <p className="text-[7.5px] font-black tracking-wider text-slate-400 uppercase select-none">PREMIUM ESTATE</p>
                  </div>
                  <span className="bg-slate-900 border border-slate-700 text-white font-mono text-[8px] font-semibold px-1.5 py-0.5 rounded uppercase select-none">
                    LP-{property.reference_no || property.id}
                  </span>
                </div>

                {/* Property Image Cover Block */}
                <div className="px-4 flex-1 flex flex-col justify-center min-h-0">
                  <div className="relative w-full flex-1 rounded-xl overflow-hidden bg-slate-850/50 border border-slate-700 max-h-[160px] lg:max-h-[220px]">
                    {property.images && property.images[0] ? (
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
                    )}
                    
                    {/* Floating Price Plate */}
                    <div className="absolute bottom-2 right-2 bg-slate-950/90 text-white px-3 py-1 rounded-lg border border-slate-700 shadow-lg text-right">
                      <span className="block text-[6px] text-slate-400 font-extrabold uppercase">SATIŞ BEDELİ</span>
                      <span className="text-xs font-black text-emerald-400">{priceText}</span>
                    </div>
                  </div>
                </div>

                {/* Specs Box */}
                <div className="px-4 mt-2">
                  <div className="flex gap-1 flex-wrap select-none">
                    <span className={`text-[8.5px] font-black px-2 py-0.5 rounded-md border uppercase ${themeConfig.pillBg}`}>
                      {categoryLabelForPreview(property.type)}
                    </span>
                    <span className={`text-[8.5px] font-black px-2 py-0.5 rounded-md border uppercase ${themeConfig.pillBg}`}>
                      📍 {propertyLocation}
                    </span>
                    {property.square_meters && (
                      <span className={`text-[8.5px] font-semibold px-2 py-0.5 rounded-md border text-slate-300 border-slate-700/55`}>
                        📐 {property.square_meters} m²
                      </span>
                    )}
                  </div>
                  
                  {/* Real Title Grid */}
                  <h4 className={`text-sm tracking-tight leading-snug mt-2 font-extrabold uppercase line-clamp-2 ${themeConfig.textTitle}`}>
                    {propertyTitle}
                  </h4>
                  <p className={`text-[9.5px] font-semibold mt-1 tracking-tight truncate ${themeConfig.textBody}`}>
                    {roomsText ? `🛌 ${roomsText} • ` : ''}📜 {titleType} {property.kktc_region ? `• 🌍 ${property.kktc_region}` : ''}
                  </p>
                </div>

                {/* Callout box for Vertical Ratio */}
                {selectedRatio === 'story' && (
                  <div className="px-4 py-3 mx-4 my-2 rounded-xl bg-amber-500/10 border border-amber-550/25 text-center flex-col justify-center items-center">
                    <span className="text-[10px] font-black text-amber-300 block mb-0.5 uppercase tracking-widest">👑 EN POPÜLER LOKASYON</span>
                    <p className="text-[9px] text-zinc-300 max-w-[200px] mx-auto">Kıbrıs'ın değer kazanan emsalsiz bölgesinde lüks yaşam standartları!</p>
                  </div>
                )}

                {/* Footer with responsible broker */}
                <div className="mt-auto px-4 py-3 flex justify-between items-center border-t border-slate-800/80 bg-black/30 text-[8.5px]">
                  <div className="truncate max-w-[150px]">
                    <span className="block text-[6px] text-zinc-500 uppercase leading-none">PORTFÖY DANIŞMANI</span>
                    <strong className="text-zinc-200 mt-0.5 block truncate uppercase">{property.responsible_agent || 'LOOKPRICE EXPERT'}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-zinc-400 block tracking-wider font-mono font-bold leading-none">{branding?.phone || 'LOOKPRICE.ME'}</span>
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
