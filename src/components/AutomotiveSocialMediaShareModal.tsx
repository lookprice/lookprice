import React, { useState, useRef, useEffect, useMemo } from "react";
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
  Car,
  Gauge,
  Flame
} from "lucide-react";

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
  const transmissionText = vehicle.transmission === 'automatic' ? 'Otomatik' : vehicle.transmission === 'semi_automatic' ? 'Yarı Otomatik' : 'Manuel';
  const fuelText = vehicle.fuel_type === 'diesel' ? 'Dizel' : vehicle.fuel_type === 'gasoline' ? 'Benzin' : vehicle.fuel_type === 'hybrid' ? 'Hibrit' : vehicle.fuel_type === 'electric' ? 'Elektrik' : vehicle.fuel_type || 'Belirtilmedi';
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
    const brandName = storeName || branding?.store_name || branding?.name || 'Seçkin Otomotiv';
    const contactPhoneText = (branding?.phone || branding?.whatsapp_number) 
      ? `iletişim Hattı: ${branding.phone || branding.whatsapp_number}` 
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

  // HTML5 Canvas Premium Graphics Export for Automotive
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
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    } else if (selectedTheme === 'sporty_red') {
      gradient.addColorStop(0, '#09090b'); // zinc-950
      gradient.addColorStop(0.5, '#1c1917'); // stone-900
      gradient.addColorStop(1, '#450a0a'); // red-950 (warm sporty undertone)
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    } else if (selectedTheme === 'neon_cyber') {
      gradient.addColorStop(0, '#030712'); // gray-950
      gradient.addColorStop(0.5, '#1e1b4b'); // indigo-950
      gradient.addColorStop(1, '#3b0764'); // purple-950
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    } else if (selectedTheme === 'hertz_style') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    } else if (selectedTheme === 'rangerover_style') {
      gradient.addColorStop(0, '#18181b'); // zinc-900
      gradient.addColorStop(0.5, '#09090b'); // zinc-950
      gradient.addColorStop(1, '#1c1c1f');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    } else {
      gradient.addColorStop(0, '#18181b'); // zinc-900
      gradient.addColorStop(0.5, '#09090b'); // zinc-950
      gradient.addColorStop(1, '#1c1c1f');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    // Dynamic framing closer to edge = 16px to maximize image layout
    const borderPadding = 16;
    ctx.strokeStyle = canvasColors.border;
    ctx.lineWidth = 12;
    ctx.strokeRect(borderPadding, borderPadding, width - (borderPadding * 2), height - (borderPadding * 2));

    // Parallel asynchronous loading of images
    const imageUrls: string[] = [];
    if (vehicle.images && vehicle.images[0]) imageUrls.push(vehicle.images[0]);
    if (isCollage && vehicle.images && vehicle.images[1]) imageUrls.push(vehicle.images[1]);
    if (isCollage && vehicle.images && vehicle.images[2]) imageUrls.push(vehicle.images[2]);

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
      grad.addColorStop(0, '#101726');
      grad.addColorStop(1, '#1b2536');
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

      const imgX = borderPadding;
      const imgY = borderPadding;
      const imgWidth = width - (borderPadding * 2);
      const imgHeight = height - (borderPadding * 2);

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
      // Clip image to outer border limits
      ctx.rect(imgX, imgY, imgWidth, imgHeight);
      ctx.clip();

      if (isCollage && (sideImg1 || sideImg2)) {
        // Collage layout! Left main image 67% width, Right side stacked vertically 33% width
        const mainW = Math.round(imgWidth * 0.67);
        const gapSize = 8;
        const sideXWidth = imgWidth - mainW - gapSize;
        const sideH = Math.round((imgHeight - gapSize) / 2);

        // Main Left image
        drawSingleImageCover(imgElement, imgX, imgY, mainW, imgHeight, "🚗");

        // Side stacked images
        drawSingleImageCover(sideImg1, imgX + mainW + gapSize, imgY, sideXWidth, sideH, "📸");
        drawSingleImageCover(sideImg2, imgX + mainW + gapSize, imgY + sideH + gapSize, sideXWidth, sideH, "📸");
      } else {
        // Regular single cover image
        drawSingleImageCover(imgElement, imgX, imgY, imgWidth, imgHeight, "🚗");
      }

      ctx.restore();

      // Vignette overlays - made extremely subtle to keep the vehicle completely visible
      // Top vignette
      const topGrad = ctx.createLinearGradient(imgX, imgY, imgX, imgY + 150);
      topGrad.addColorStop(0, 'rgba(0,0,0,0.4)');
      topGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = topGrad;
      ctx.fillRect(imgX, imgY, imgWidth, 150);

      // Bottom vignette
      const bottomGrad = ctx.createLinearGradient(imgX, imgY + imgHeight - 300, imgX, imgY + imgHeight);
      bottomGrad.addColorStop(0, 'rgba(0,0,0,0)');
      bottomGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = bottomGrad;
      ctx.fillRect(imgX, imgY + imgHeight - 300, imgWidth, 300);

      // TOP-LEFT: Oblique bold status banner
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.95)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 3;
      ctx.fillStyle = canvasColors.border; // accent color
      ctx.font = 'italic 900 62px system-ui, sans-serif';
      ctx.fillText(vehicle.is_trade_in_available ? 'TAKASLI' : 'SATILIK', imgX + 50, imgY + 110);
      ctx.restore();

      // TOP-RIGHT: Accent Tag + Price block
      const badgeText = `${vehicle.year || '2026'} ${transmissionText}`.toUpperCase();
      ctx.font = '900 24px system-ui, sans-serif';
      const badgeW = ctx.measureText(badgeText).width + 45;
      const badgeH = 55;
      const badgeX = width - borderPadding - 50 - badgeW;
      const badgeY = imgY + 50;

      // Draw solid accent background for badge
      ctx.fillStyle = canvasColors.border;
      ctx.beginPath();
      if ((ctx as any).roundRect) {
        (ctx as any).roundRect(badgeX, badgeY, badgeW, badgeH, 6);
      } else {
        ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
      }
      ctx.fill();

      // Text inside badge (black)
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.fillText(badgeText, badgeX + (badgeW / 2), badgeY + 37);

      // Price text directly with shadow (no solid background card)
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.95)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 3;
      
      ctx.textAlign = 'right';
      ctx.fillStyle = canvasColors.border;
      ctx.font = '950 48px system-ui, sans-serif';
      ctx.fillText(priceText, width - borderPadding - 50, badgeY + badgeH + 60);
      ctx.restore();

      // SPECIAL STORY PROMOTION LINE (Story ratio only)
      if (selectedRatio === 'story') {
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.95)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 3;

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 28px system-ui, sans-serif';
        ctx.fillText("SEÇKİN GALERİ GÜVENCESİ", width / 2, 850);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'semibold 20px system-ui, sans-serif';
        ctx.fillText("Kondisyon ve temizlik testleri yapılmış bu araca güvenle sahip olabilirsiniz!", width / 2, 895);
        ctx.restore();
      }

      // BOTTOM-LEFT: Store Name directly with drop shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.95)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 3;

      ctx.fillStyle = canvasColors.border;
      ctx.font = '900 36px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(storeName.toUpperCase(), imgX + 50, imgY + imgHeight - 90);
      ctx.restore();

      // BOTTOM-RIGHT: Specs Overlay directly with shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.95)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 3;

      ctx.textAlign = 'right';
      const specRightX = width - borderPadding - 50;
      const specBottomY = imgY + imgHeight - 90;

      // Brand Title
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 32px system-ui, sans-serif';
      ctx.fillText(vehicle.brand.toUpperCase(), specRightX, specBottomY - 145);

      // Model Title
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '800 22px system-ui, sans-serif';
      ctx.fillText(vehicle.model.toUpperCase(), specRightX, specBottomY - 110);

      // Details list
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.fillText(`📐 KM: ${mileageText || 'Düşük Km'}`, specRightX, specBottomY - 70);
      ctx.fillText(`⚙️ Şanzıman: ${transmissionText}`, specRightX, specBottomY - 35);
      ctx.fillText(`⛽ Yakıt: ${fuelText}`, specRightX, specBottomY);
      ctx.restore();

      // Trigger actual download of canvas
      try {
        const link = document.createElement("a");
        const sanitizedTitle = `${vehicle.brand}-${vehicle.model}`.toLowerCase().replace(/\s+/g, '-').substring(0, 20);
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
                  {isCollage && vehicle.images && (vehicle.images[1] || vehicle.images[2]) ? (
                    <div className="w-full h-full flex flex-row">
                      {/* Left Main (67%) */}
                      <div className="w-[67%] h-full relative border-r border-black/30 overflow-hidden">
                        {vehicle.images[0] ? (
                          <div className="relative w-full h-full overflow-hidden">
                            <img 
                              src={vehicle.images[0]} 
                              alt={vehicleTitle} 
                              className="w-full h-full object-cover filter brightness-[1.12] contrast-[1.05] saturate-[1.12]"
                              referrerPolicy="no-referrer"
                            />
                            {/* Polish Diagonal Glare Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent pointer-events-none mix-blend-overlay" />
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-450 bg-slate-900">🚗</div>
                        )}
                      </div>
                      {/* Right stacked (33%) */}
                      <div className="w-[33%] h-full flex flex-col">
                        <div className="flex-1 relative border-b border-black/30 overflow-hidden">
                          {vehicle.images[1] ? (
                            <div className="relative w-full h-full overflow-hidden">
                              <img 
                                src={vehicle.images[1]} 
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
                          {vehicle.images[2] ? (
                            <div className="relative w-full h-full overflow-hidden">
                              <img 
                                src={vehicle.images[2]} 
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
                    vehicle.images && vehicle.images[0] ? (
                      <div className="relative w-full h-full overflow-hidden">
                        <img 
                          src={vehicle.images[0]} 
                          alt={vehicleTitle} 
                          className="w-full h-full object-cover filter brightness-[1.12] contrast-[1.05] saturate-[1.12]"
                          referrerPolicy="no-referrer"
                        />
                        {/* Polish Diagonal Glare Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent pointer-events-none mix-blend-overlay" />
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-500">
                        <span className="text-4xl">🚗</span>
                      </div>
                    )
                  )}

                  {/* Subtle dark vignette gradient overlays for high text readability, keeping the image fully visible */}
                  <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/50 via-black/20 to-transparent pointer-events-none" />
                </div>

                {/* --- CONTENT LAYER --- */}
                <div className="relative z-10 w-full h-full flex flex-col justify-between p-4 flex-1">
                  {/* TOP ROW elements */}
                  <div className="flex justify-between items-start gap-3">
                    {/* Top Left: Oblique bold status banner */}
                    <div className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                      <span className={`text-[22px] italic font-black tracking-tighter uppercase ${themeConfig.accentText}`}>
                        {vehicle.is_trade_in_available ? 'TAKASLI' : 'SATILIK'}
                      </span>
                    </div>

                    {/* Top Right: Accent Tag + Price block with drop shadow, no backing box */}
                    <div className="flex flex-col items-end gap-1.5 select-none shrink-0 max-w-[140px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                      {/* Accent Block Tag */}
                      <div className={`px-2 py-0.5 rounded-sm text-black font-black text-[9px] tracking-widest leading-none ${themeConfig.accentBg}`}>
                        {`${vehicle.year ? vehicle.year + ' ' : ''}${transmissionText}`.toUpperCase()}
                      </div>

                      {/* Outlined Price Tag with NO background card */}
                      <div className="text-center px-1 py-1 leading-none">
                        <span className="text-[14px] font-black tracking-tight" style={{ color: themeConfig.accentHex }}>
                          {priceText}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SPECIAL STORY ONLY PROMOTION LINE (ONLY in Story ratio) with drop shadow */}
                  {selectedRatio === 'story' && (
                    <div className="my-auto px-4 py-3 text-center flex flex-col justify-center items-center drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)]">
                      <span className="text-[10px] font-black block mb-0.5 uppercase tracking-wider text-white">SEÇKİN GALERİ GÜVENCESİ</span>
                      <p className="text-[9px] max-w-[180px] leading-tight text-slate-300 font-medium">Kondisyon ve temizlik testleri yapılmış bu araca güvenle sahip olabilirsiniz!</p>
                    </div>
                  )}

                  {/* BOTTOM ROW elements */}
                  <div className="flex justify-between items-end gap-3 mt-auto w-full z-10">
                    {/* Bottom Left: Bold Store name directly on image with accent color and drop shadow */}
                    <div className={`text-[11px] font-black tracking-wider uppercase leading-none select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] truncate max-w-[140px] ${themeConfig.accentText}`}>
                      {storeName}
                    </div>

                    {/* Bottom Right: Clean Specs overlay with drop shadow, NO dark background cards */}
                    <div className="flex flex-col text-right items-end leading-tight select-none drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)]">
                      <span className="text-[10px] font-black text-white block truncate">{vehicle.brand.toUpperCase()}</span>
                      <span className="text-[8px] font-extrabold text-slate-300 block truncate uppercase mb-1">{vehicle.model.toUpperCase()}</span>
                      <div className="h-[1px] bg-white/20 w-16 my-1 self-end" />
                      <span className="text-[8px] font-bold text-slate-200 block truncate">📐 KM: {mileageText || 'Düşük Km'}</span>
                      <span className="text-[8px] font-bold text-slate-200 block truncate">⚙️ Şanzıman: {transmissionText}</span>
                      <span className="text-[8px] font-bold text-slate-200 block truncate">⛽ Yakıt: {fuelText}</span>
                    </div>
                  </div>

                </div>

              </div>
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
