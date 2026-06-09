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

type TemplateTheme = 'luxury_dark' | 'sporty_red' | 'neon_cyber' | 'minimal_carbon';
type AspectRatio = 'square' | 'story';
type CaptionTone = 'luxury' | 'technical' | 'friendly';

export const AutomotiveSocialMediaShareModal: React.FC<AutomotiveSocialMediaShareModalProps> = ({
  isOpen,
  onClose,
  vehicle,
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
          pillBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
          priceBg: 'bg-gradient-to-r from-amber-650 to-amber-500 text-white',
          footerBg: 'bg-slate-950/60 border-t border-slate-800'
        };
      case 'sporty_red':
        return {
          bg: 'bg-gradient-to-br from-zinc-950 via-neutral-900 to-red-950',
          textTitle: 'text-red-500 font-extrabold',
          textBody: 'text-zinc-300',
          accentBorder: 'border-red-600/30',
          pillBg: 'bg-red-500/10 text-red-400 border-red-500/20',
          priceBg: 'bg-gradient-to-r from-red-700 to-red-500 text-white',
          footerBg: 'bg-neutral-950/80 border-t border-red-950/40'
        };
      case 'neon_cyber':
        return {
          bg: 'bg-gradient-to-br from-zinc-950 via-indigo-950 to-purple-950',
          textTitle: 'text-cyan-400 font-extrabold',
          textBody: 'text-cyan-100',
          accentBorder: 'border-cyan-500/30',
          pillBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
          priceBg: 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white',
          footerBg: 'bg-purple-950/60 border-t border-purple-900/30'
        };
      case 'minimal_carbon':
        return {
          bg: 'bg-gradient-to-br from-zinc-900 via-neutral-900 to-zinc-955',
          textTitle: 'text-white font-extrabold',
          textBody: 'text-zinc-300',
          accentBorder: 'border-zinc-700',
          pillBg: 'bg-zinc-800 text-zinc-100 border-zinc-700',
          priceBg: 'bg-white text-zinc-900',
          footerBg: 'bg-zinc-950/80 border-t border-zinc-800'
        };
    }
  };

  const themeConfig = getThemeClasses();

  // Dynamic Captions generator (100% Client-side robust copywriting for vehicles)
  const getCaptionText = () => {
    const brandName = branding?.store_name || branding?.name || 'LookPrice Premium Gallery';
    const contactPhone = branding?.phone || '+90 (548) 000 0000';
    const brokerName = vehicle.responsible_agent || 'LookPrice Otomotiv Danışmanı';
    const activeHashtags = `#otomotiv #araba #sahibinden #satilikaraba #lookprice #luxurycars #gallerypremium #ikincielyetkili #arabapazari #${vehicle.brand.toLowerCase()} #${vehicle.model.toLowerCase()}`;

    switch (selectedTone) {
      case 'luxury':
        return `⚜️ SEÇKİN BİR SÜRÜŞ COĞRAFYASI: ${vehicle.brand.toUpperCase()} ${vehicle.model.toUpperCase()} ⚜️\n\n` +
               `Otomotiv dünyasının prestij, estetik ve mühendislik harikasını sunmaktan mutluluk duyarız. LookPrice bünyesinde sergilenen bu özel aracımız, üst düzey konforu ve kusursuz kondisyonuyla yeni sahibini bekliyor.\n\n` +
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
               `📞 İletişim: ${contactPhone}\n` +
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
               `📞 Detaylı Bilgi İçin: ${contactPhone}\n` +
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
               `📞 Telefon: ${contactPhone}\n` +
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
    } else if (selectedTheme === 'sporty_red') {
      gradient.addColorStop(0, '#09090b'); // zinc-950
      gradient.addColorStop(0.5, '#1c1917'); // stone-900
      gradient.addColorStop(1, '#450a0a'); // red-950 (warm sporty undertone)
    } else if (selectedTheme === 'neon_cyber') {
      gradient.addColorStop(0, '#030712'); // gray-950
      gradient.addColorStop(0.5, '#1e1b4b'); // indigo-950
      gradient.addColorStop(1, '#3b0764'); // purple-950
    } else {
      gradient.addColorStop(0, '#18181b'); // zinc-900
      gradient.addColorStop(0.5, '#09090b'); // zinc-950
      gradient.addColorStop(1, '#1c1c1f');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Apply beautiful sector specific dynamic lighting orbits (curves for racing feel)
    ctx.strokeStyle = selectedTheme === 'luxury_dark' ? 'rgba(245, 158, 11, 0.15)' :
                      selectedTheme === 'sporty_red' ? 'rgba(239, 68, 68, 0.15)' :
                      selectedTheme === 'neon_cyber' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      ctx.arc(width / 2, height / 2, 100 + i * 180, 0, Math.PI * 2);
    }
    ctx.stroke();

    // Draw premium border framing
    ctx.strokeStyle = selectedTheme === 'luxury_dark' ? '#d97706' : // amber-600
                      selectedTheme === 'sporty_red' ? '#dc2626' : // red-600
                      selectedTheme === 'neon_cyber' ? '#06b6d4' : '#e4e4e7'; // cyan or white/zinc
    ctx.lineWidth = 12;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // Render title and marketing headers
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 24px system-ui, sans-serif';
    ctx.letterSpacing = '5px';
    const brandNameUpper = (branding?.store_name || branding?.name || 'LOOKPRICE GALLERY').toUpperCase();
    ctx.fillText(brandNameUpper, 80, 95);

    ctx.fillStyle = selectedTheme === 'luxury_dark' ? '#f59e0b' :
                    selectedTheme === 'sporty_red' ? '#ef4444' :
                    selectedTheme === 'neon_cyber' ? '#22d3ee' : '#a1a1aa';
    ctx.font = '800 13px system-ui, sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText("PREMIUM AUTOMOTIVE NETWORK", 80, 125);

    // Reference ID badge on top right
    const refNo = `AUTO-${vehicle.id}`;
    ctx.fillStyle = selectedTheme === 'sporty_red' ? '#dc2626' : selectedTheme === 'neon_cyber' ? '#0891b2' : '#1e293b';
    ctx.fillRect(width - 280, 70, 200, 45);
    ctx.strokeStyle = selectedTheme === 'luxury_dark' ? '#d97706' : selectedTheme === 'sporty_red' ? '#ef4444' : '#06b6d4';
    ctx.lineWidth = 2;
    ctx.strokeRect(width - 280, 70, 200, 45);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px monospace';
    ctx.letterSpacing = '1px';
    ctx.textAlign = 'center';
    ctx.fillText(refNo, width - 180, 98);
    ctx.textAlign = 'left';

    // Load original Image
    const mainImageUrl = vehicle.images && vehicle.images[0] ? vehicle.images[0] : null;

    const finalizeDrawAndDownload = (imgElement: HTMLImageElement | null) => {
      const imgX = 80;
      const imgY = 160;
      const imgWidth = width - 160;
      const imgHeight = selectedRatio === 'square' ? 440 : 800;

      // Draw shadow background for image path
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(imgX, imgY, imgWidth, imgHeight);

      if (imgElement) {
        try {
          const imgAspect = imgElement.width / imgElement.height;
          const targetAspect = imgWidth / imgHeight;

          let sx = 0, sy = 0, sWidth = imgElement.width, sHeight = imgElement.height;

          if (imgAspect > targetAspect) {
            sWidth = imgElement.height * targetAspect;
            sx = (imgElement.width - sWidth) / 2;
          } else {
            sHeight = imgElement.width / targetAspect;
            sy = (imgElement.height - sHeight) / 2;
          }

          ctx.drawImage(imgElement, sx, sy, sWidth, sHeight, imgX, imgY, imgWidth, imgHeight);

          // Add elegant dark gradient overlay
          const imgGrad = ctx.createLinearGradient(imgX, imgY + imgHeight - 150, imgX, imgY + imgHeight);
          imgGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
          imgGrad.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
          ctx.fillStyle = imgGrad;
          ctx.fillRect(imgX, imgY + imgHeight - 150, imgWidth, 150);

        } catch (err) {
          drawCorsFallback(imgX, imgY, imgWidth, imgHeight);
        }
      } else {
        drawCorsFallback(imgX, imgY, imgWidth, imgHeight);
      }

      // Border around image
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 4;
      ctx.strokeRect(imgX, imgY, imgWidth, imgHeight);

      // --- TEXT CONTENT AREA ---
      const contentYStart = imgY + imgHeight + 50;

      // Fuel & Transmission badges
      ctx.fillStyle = selectedTheme === 'luxury_dark' ? '#f59e0b' :
                      selectedTheme === 'sporty_red' ? '#ef4444' :
                      selectedTheme === 'neon_cyber' ? '#22d3ee' : '#d4d4d8';
      ctx.fillRect(80, contentYStart, 160, 36);

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(fuelText.toUpperCase(), 160, contentYStart + 24);
      ctx.textAlign = 'left';

      // General Badge
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(255, contentYStart, 260, 36);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.strokeRect(255, contentYStart, 260, 36);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillText(`⚙️ ${transmissionText.toUpperCase()} • 🚗 ${bodyText.toUpperCase()}`, 275, contentYStart + 23);

      // Vehicle Brand & Model (Big Title)
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 38px system-ui, sans-serif';
      const titleLines = wrapText(vehicleTitle, width - 160);
      let titleY = contentYStart + 90;
      titleLines.forEach((line, index) => {
        if (index < 2) {
          ctx.fillText(line, 80, titleY);
          titleY += 45;
        }
      });

      // Price Tag (Huge highlight strip)
      const priceBlockY = selectedRatio === 'square' ? height - 200 : height - 380;
      
      const priceGradient = ctx.createLinearGradient(80, priceBlockY, width - 80, priceBlockY);
      if (selectedTheme === 'luxury_dark') {
        priceGradient.addColorStop(0, '#ca8a04');
        priceGradient.addColorStop(1, '#eab308');
      } else if (selectedTheme === 'sporty_red') {
        priceGradient.addColorStop(0, '#b91c1c');
        priceGradient.addColorStop(1, '#ef4444');
      } else if (selectedTheme === 'neon_cyber') {
        priceGradient.addColorStop(0, '#4f46e5');
        priceGradient.addColorStop(1, '#06b6d4');
      } else {
        priceGradient.addColorStop(0, '#ffffff');
        priceGradient.addColorStop(1, '#e4e4e7');
      }
      ctx.fillStyle = priceGradient;
      ctx.fillRect(80, priceBlockY, width - 160, 100);

      // Price text overlays
      ctx.fillStyle = selectedTheme === 'minimal_carbon' ? '#09090b' : '#ffffff';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.letterSpacing = '1px';
      ctx.fillText("GALERİ LİSTE SATIŞ BEDELİ", 110, priceBlockY + 40);

      ctx.font = '900 45px system-ui, sans-serif';
      ctx.fillText(priceText, 110, priceBlockY + 84);

      // Badge stats text (KM, Color, Year)
      const specY = priceBlockY - 70;
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 20px system-ui, sans-serif';
      
      const specString = `🏁 ${mileageText || 'Kusursuz Km'}  •  🎨 ${colorText} Gövde  •  📅 Model Yılı: ${vehicle.year}`;
      ctx.fillText(specString, 80, specY);

      // Footer
      const footerY = height - 60;
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(80, footerY - 20);
      ctx.lineTo(width - 80, footerY - 20);
      ctx.stroke();

      ctx.fillStyle = '#a1a1aa';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillText(`FİRMA: ${branding?.store_name || 'LOOKPRICE PREMIUM GALLERY'}`, 80, footerY + 15);
      
      ctx.textAlign = 'right';
      const footerPhone = branding?.phone ? `MOBİL NO: ${branding.phone}` : 'MULTISTATION ARABAM PORTFÖY NETWORÜ';
      ctx.fillText(footerPhone, width - 80, footerY + 15);
      ctx.textAlign = 'left';

      // Download trigger
      try {
        const link = document.createElement("a");
        const sanitizedTitle = `${vehicle.brand}-${vehicle.model}`.toLowerCase().replace(/\s+/g, '-').substring(0, 20);
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
      const grad = ctx.createLinearGradient(x, y, x + w, y + h);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);

      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 3;
      for (let offset = 0; offset < w + h; offset += 60) {
        ctx.beginPath();
        ctx.moveTo(x + offset, y);
        ctx.lineTo(x, y + offset);
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.font = 'bold 100px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("🚗", x + w/2, y + h/2 + 20);

      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '800 13px system-ui, sans-serif';
      ctx.letterSpacing = '1px';
      ctx.fillText("PREMIUM AUTOMOTIVE MEMORY", x + w/2, y + h/2 + 70);
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
      img.crossOrigin = "anonymous";
      img.onload = () => {
        finalizeDrawAndDownload(img);
      };
      img.onerror = () => {
        finalizeDrawAndDownload(null);
      };
      const cacheBustSep = mainImageUrl.includes('?') ? '&' : '?';
      img.src = mainImageUrl + cacheBustSep + "lookprice_export_ts=" + Date.now();
    } else {
      finalizeDrawAndDownload(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[999] flex items-center justify-center p-4 overflow-y-auto font-sans" id="automotive-share-wizard-modal">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh]">
        
        {/* Left Side: Real Real-time Interactive Poster Preview */}
        <div className="lg:w-1/2 bg-slate-100 p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200 overflow-y-auto">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5" /> REELTIME AFİŞ ÖNİZLEME (ARAÇ)
              </span>
              <div className="flex items-center gap-1">
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
                className={`relative w-full max-w-[340px] rounded-2xl overflow-hidden shadow-xl border-4 ${themeConfig.accentBorder} ${themeConfig.bg} transition-all duration-300 flex flex-col`}
                style={{ aspectRatio: selectedRatio === 'square' ? '1/1' : '9/16' }}
              >
                
                {/* Header */}
                <div className="p-4 flex justify-between items-start z-10 w-full">
                  <div>
                    <h3 className={`text-base font-black truncate max-w-[180px] leading-tight select-none uppercase tracking-wider ${themeConfig.textTitle}`}>
                      {branding?.store_name || branding?.name || 'LOOKPRICE'}
                    </h3>
                    <p className="text-[7.5px] font-black tracking-wider text-slate-400 uppercase select-none">PREMIUM AUTOMOTIVE</p>
                  </div>
                  <span className="bg-slate-900 border border-slate-700 text-white font-mono text-[8px] font-semibold px-1.5 py-0.5 rounded uppercase select-none">
                    AUTO-{vehicle.id}
                  </span>
                </div>

                {/* Car Image Cover Block */}
                <div className="px-4 flex-1 flex flex-col justify-center min-h-0 w-full">
                  <div className="relative w-full flex-1 rounded-xl overflow-hidden bg-slate-850/50 border border-slate-700 max-h-[160px] lg:max-h-[220px]">
                    {vehicle.images && vehicle.images[0] ? (
                      <img 
                        src={vehicle.images[0]} 
                        alt={vehicleTitle} 
                        className="w-full h-full object-cover select-none"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900/50">
                        <span className="text-3xl">🚗</span>
                        <span className="text-[9px] font-bold mt-1">Görsel Eklenmemiş</span>
                      </div>
                    )}
                    
                    {/* Floating Price Plate */}
                    <div className="absolute bottom-2 right-2 bg-slate-950/90 text-white px-3 py-1 rounded-lg border border-slate-700 shadow-lg text-right">
                      <span className="block text-[6px] text-slate-400 font-extrabold uppercase">
                        GÖSTERGE FİYATI
                      </span>
                      <span className="text-xs font-black text-emerald-400">{priceText}</span>
                    </div>
                  </div>
                </div>

                {/* Specs Box */}
                <div className="px-4 mt-2 w-full">
                  <div className="flex gap-1 flex-wrap select-none font-sans">
                    <span className={`text-[8.5px] font-black px-2 py-0.5 rounded-md border uppercase ${themeConfig.pillBg}`}>
                      🚗 {bodyText}
                    </span>
                    <span className="text-[8.5px] font-bold px-2 py-0.5 rounded-md border uppercase text-indigo-600 bg-indigo-50/70 border-indigo-200">
                      ⚙️ {transmissionText}
                    </span>
                    <span className={`text-[8.5px] font-black px-2 py-0.5 rounded-md border uppercase ${themeConfig.pillBg}`}>
                      📍 GALERİ
                    </span>
                    {vehicle.year && (
                      <span className="text-[8.5px] font-semibold px-2 py-0.5 rounded-md border text-slate-300 border-slate-700/55">
                        📅 {vehicle.year}
                      </span>
                    )}
                  </div>
                  
                  {/* Real Title Grid */}
                  <h4 className={`text-sm tracking-tight leading-snug mt-2 font-extrabold uppercase line-clamp-2 ${themeConfig.textTitle}`}>
                    {vehicle.brand} {vehicle.model}
                  </h4>
                  <p className={`text-[9.5px] font-semibold mt-1 tracking-tight truncate ${themeConfig.textBody}`}>
                    🏁 {mileageText} • 📦 {fuelText} • 🎨 {colorText} Gövde
                  </p>
                </div>

                {/* Callout box for Vertical Ratio */}
                {selectedRatio === 'story' && (
                  <div className="px-4 py-3 mx-4 my-2 rounded-xl text-center flex flex-col justify-center items-center border bg-amber-500/10 border-amber-550/25">
                    <span className="text-[10px] font-black block mb-0.5 uppercase tracking-widest text-amber-300">🔥 KAÇIRILMAYACAK EKSPERTİZ</span>
                    <p className="text-[9px] max-w-[200px] mx-auto text-zinc-300">Detaylı mekanik ve kozmetik taraması uzman ekiplerimizce yapılmış kusursuz araç!</p>
                  </div>
                )}

                {/* Footer with responsible broker */}
                <div className={`mt-auto px-4 py-3 flex justify-between items-center text-[8.5px] w-full ${themeConfig.footerBg}`}>
                  <div className="truncate max-w-[150px]">
                    <span className="block text-[6.5px] uppercase leading-none text-zinc-500">MÜŞTERİ TEMSİLCİSİ</span>
                    <strong className="mt-0.5 block truncate uppercase text-zinc-200">{vehicle.responsible_agent || 'GALERİ DANIŞMANI'}</strong>
                  </div>
                  <div className="text-right">
                    <span className="block tracking-wider font-mono font-black leading-none text-zinc-450">{branding?.phone || 'LOOKPRICE GALLERY'}</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Controls for Template styles */}
          <div className="mt-4">
            <span className="block text-[11px] font-black tracking-wider text-slate-500 uppercase mb-2">🎨 SEKTÖREL GÖRSEL ŞABLONLAR</span>
            <div className="grid grid-cols-4 gap-2">
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
        <div className="lg:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
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
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-200">
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
