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
  Award,
  Sparkles,
  RefreshCw,
  Info,
  BadgePercent,
  TrendingUp,
  Tag,
  Star
} from "lucide-react";
import { Product } from "../types";

interface ProductSocialMediaShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  branding?: any;
}

type TemplateTheme = 'luxury_dark' | 'sunset_orange' | 'neon_cyber' | 'minimal_carbon';
type AspectRatio = 'square' | 'story';
type CaptionTone = 'luxury' | 'promo' | 'friendly';

export const ProductSocialMediaShareModal: React.FC<ProductSocialMediaShareModalProps> = ({
  isOpen,
  onClose,
  product,
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
    
    if (!candidateName || candidateName.toLowerCase().trim() === 'lookprice') {
      if (activeSlug && activeSlug.toLowerCase().trim() !== 'lookprice') {
        return formatSlugToTitle(activeSlug);
      }
      return 'Seçkin Mağaza';
    }
    return candidateName;
  }, [branding, urlSlug]);

  const [selectedTheme, setSelectedTheme] = useState<TemplateTheme>('sunset_orange');
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('square');
  const [selectedTone, setSelectedTone] = useState<CaptionTone>('promo');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => setCopySuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  // Premium dynamic image gallery integration matching ProductDetailModal
  const productImages = useMemo(() => {
    const list: string[] = [];
    if (product?.image_url) {
      list.push(product.image_url);
    }
    const rawImages = (product as any)?.images;
    if (rawImages) {
      if (Array.isArray(rawImages)) {
        rawImages.forEach((img: any) => {
          if (img && typeof img === "string" && !list.includes(img)) {
            list.push(img);
          }
        });
      } else if (typeof rawImages === "string") {
        try {
          const parsed = JSON.parse(rawImages);
          if (Array.isArray(parsed)) {
            parsed.forEach((img: any) => {
              if (img && typeof img === "string" && !list.includes(img)) {
                list.push(img);
              }
            });
          }
        } catch (e) {}
      }
    }
    return list;
  }, [product]);

  if (!isOpen || !product) return null;

  const formatNumberVal = (val: any) => {
    if (val === undefined || val === null || val === '') return '0';
    const parsed = parseFloat(val);
    if (isNaN(parsed)) return '0';
    return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(parsed));
  };

  const currencySymbol = product.currency === 'GBP' ? '£' : product.currency === 'USD' ? '$' : product.currency === 'EUR' ? '€' : '₺';
  const priceText = `${formatNumberVal(product.price)} ${currencySymbol}`;
  const oldPriceText = product.old_price ? `${formatNumberVal(product.old_price)} ${currencySymbol}` : null;
  const productTitle = product.name || "Seçkin Ürün Kataloğu";
  const productCategory = product.category || "Genel Ürün";
  const productBrand = product.brand || "";

  // Calculate discount percentage if exists
  const discountPercentage = useMemo(() => {
    if (product.price && product.old_price && product.old_price > product.price) {
      return Math.round(((product.old_price - product.price) / product.old_price) * 100);
    }
    return 0;
  }, [product.price, product.old_price]);

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
          priceBg: 'bg-gradient-to-r from-amber-650 to-amber-505 text-white',
          footerBg: 'bg-slate-950/60 border-t border-slate-800'
        };
      case 'sunset_orange':
        return {
          bg: 'bg-gradient-to-br from-orange-500 via-rose-600 to-amber-650',
          textTitle: 'text-white font-black',
          textBody: 'text-orange-100',
          accentBorder: 'border-white/20',
          pillBg: 'bg-white/15 text-white border-white/20',
          priceBg: 'bg-white text-orange-650',
          footerBg: 'bg-black/20 border-t border-white/10'
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
          bg: 'bg-gradient-to-br from-zinc-900 via-neutral-900 to-zinc-950',
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

  // Dynamic Captions generator (100% Client-side robust copywriting for products)
  const getCaptionText = () => {
    const contactPhone = branding?.phone || branding?.whatsapp_number || '+90 (548) 000 0000';
    const storeHashtag = `#${storeName.toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, '')}`;
    const activeHashtags = `#alisveris #kampanya #kampanyaliurunler #kalite #indirim #firsat #hediyelik #${productCategory.toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, '')} #${(productBrand || 'urun').toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, '')} ${storeHashtag}`;

    switch (selectedTone) {
      case 'luxury':
        return `⚜️ YAŞAMINIZA ZERAFET KATIN: ${productTitle.toUpperCase()} ⚜️\n\n` +
               `Adını özgün tasarımdan, gücünü ise kaliteden alan muhteşem bir ürünle stilinizi taçlandırın. ${storeName} koleksiyonunun gözde tasarımları arasında yer alan bu nadide parça cazibesiyle göz kamaştırıyor.\n\n` +
               `🛍️ Ürün Bilgileri ve Özellikleri:\n` +
               `• Ürün Adı: ${productTitle}\n` +
               `• Kategori / Marka: ${productCategory} ${productBrand ? `• ${productBrand}` : ''}\n` +
               `• Güvence: %100 Orijinal Ürün & ${storeName} Güvencesi\n` +
               (discountPercentage > 0 ? `• Kampanya Ayrıcalığı: Net %${discountPercentage} Seçkin İndirim Oranı\n` : '') +
               `• Barkod ID: ${product.barcode || 'LP-PROD'}\n\n` +
               `💰 Ayrıcalıklı Liste Satış Bedeli: ${priceText}\n` +
               (oldPriceText ? `❌ Önceki Fiyat: ${oldPriceText}\n` : '') +
               `\nHayatına prestij ve asalet katmak isteyen, detaylardaki mükemmelliği önemseyen tüm seçkin misafirlerimizi mağazamıza davet ediyoruz. İncelemeniz ve dilediğiniz adrese randevulu kurye gönderimleri için bize hemen ulaşabilirsiniz.\n\n` +
               `📞 İletişim Hattı: ${contactPhone}\n` +
               `🏢 Koleksiyon Sahibi / Mağaza: ${storeName}\n\n` +
               `${activeHashtags}`;

      case 'promo':
        return `🔥 BÜYÜK FIRSAT DETAYI: KAÇIRILMAYACAK FİYAT! 🔥\n\n` +
               `Vitrinlerimizde hararetli anlar yaşanıyor! Sizlere kalite tescilli ${productTitle} ürünümüzü inanılmaz avantajlarla sunuyoruz. Stok tükenmeden hızlı karar verin!\n\n` +
               `⚡️ Kampanya ve Detaylar:\n` +
               `• Ürün Segmenti: ${productCategory}\n` +
               (productBrand ? `• Marka Kalitesi: ${productBrand}\n` : '') +
               (discountPercentage > 0 ? `🎊 Dev İndirim Oranı: %${discountPercentage} İndirim Fırsatı!\n` : '') +
               `• Barkod / Kod: ${product.barcode || 'LP-PROD'}\n` +
               `• Güvence: %100 Orijinal Ürün & ${storeName} Güvencesi\n\n` +
               `💰 Şok Liste Fiyatı: ${priceText}\n` +
               (oldPriceText ? `❌ Eski Satış Fiyatı: ${oldPriceText} (Büyük İndirim Yapıldı!)\n` : '') +
               `\nBu bütçe dostu, Premium tasarımı kapınıza kadar ulaştırmak ve hızlı sipariş geçmek için bize hemen DM atabilir veya telefon hattımızdan iletişime geçebilirsiniz. Fırsatı kaçırmayın!\n\n` +
               `📞 Çağrı / WP Destek: ${contactPhone}\n` +
               `🏪 Yetkili Satıcı Mağaza: ${storeName}\n\n` +
               `#indirimvar #sezonindirimi #alisveriszamani #firsatfiyat #alisverisonline ${activeHashtags}`;

      case 'friendly':
        return `🌟 Günün Harika Ürünü İle Karşınızdayız! 🌟\n\n` +
               `Selamlar sevgili ${storeName} takipçileri! 😍 Bugün mağazamızın en beğenilen, her köşede tarzınızı ve günlük kullanım konforunuzu tazeleyecek pırıl pırıl bir parçayı sizinle paylaşmak için çok heyecanlıyız: ${productTitle}! ✨\n\n` +
               `🌸 Neden Bu Ürüne Bayılacaksınız?\n` +
               `👉 Kalite & Zarafet bir arada: ${productCategory} koleksiyonunun en yeni tarzı\n` +
               (productBrand ? `👉 Güvendiğiniz Marka: ${productBrand} güvencesiyle\n` : '') +
               (discountPercentage > 0 ? `👉 Çok Özel İndirim: Tam %${discountPercentage} indirim yaptık, her bütçeye uygun hale getirdik! 🥳\n` : '') +
               `👉 Tam günlük kullanımınıza, şık sofralarınıza veya sevdiklerinize hediye edilmeye uygun!\n\n` +
               `💰 Yeni Sahibini Bekleyen Fiyat: ${priceText}\n` +
               (oldPriceText ? `👉 Eski fiyata elveda: ${oldPriceText} yerine sadece ${priceText}! 😍\n` : '') +
               `\nEv sahipliği yapmak, detaylı sormak ya da bir Türk kahvemizi içerken ürünü yakından incelemek için bizimle hemen iletişime geçin. Sizler için mağazamızda özenle paketlemek için hazırız!\n\n` +
               `💬 DM üzerinden veya buraya yazarak bana anında ulaşabilirsiniz:\n` +
               `📞 Telefon/WhatsApp: ${contactPhone}\n` +
               `🛍️ Güvenli Mağaza: ${storeName}\n\n` +
               `${activeHashtags}`;
    }
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(getCaptionText());
    setCopySuccess(true);
  };

  // HTML5 Canvas Graphics Export Creator for General Product
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

    // Canvas size depending on aspect ratio chosen
    const width = 1080;
    const height = selectedRatio === 'square' ? 1080 : 1920;
    canvas.width = width;
    canvas.height = height;

    // Draw background gradients
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    if (selectedTheme === 'luxury_dark') {
      gradient.addColorStop(0, '#020617'); // slate-950
      gradient.addColorStop(0.5, '#0f172a'); // slate-900
      gradient.addColorStop(1, '#090d16');
    } else if (selectedTheme === 'sunset_orange') {
      gradient.addColorStop(0, '#ea580c'); // orange-600
      gradient.addColorStop(0.5, '#e11d48'); // rose-600
      gradient.addColorStop(1, '#ca8a04'); // amber-600
    } else if (selectedTheme === 'neon_cyber') {
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

    // Dynamic geometric background mesh
    ctx.strokeStyle = selectedTheme === 'luxury_dark' ? 'rgba(245, 158, 11, 0.12)' :
                      selectedTheme === 'sunset_orange' ? 'rgba(255, 255, 255, 0.15)' :
                      selectedTheme === 'neon_cyber' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      ctx.arc(width / 2, height / 2, 150 + i * 160, 0, Math.PI * 2);
    }
    ctx.stroke();

    // Draw stylish outer border
    ctx.strokeStyle = selectedTheme === 'luxury_dark' ? '#d97706' : // amber-650
                      selectedTheme === 'sunset_orange' ? '#ffffff' : // white
                      selectedTheme === 'neon_cyber' ? '#06b6d4' : '#e4e4e7'; // cyan
    ctx.lineWidth = 12;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // Draw Store Branding Header inside the Canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(30, 30, width - 60, 110);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, 140);
    ctx.lineTo(width - 30, 140);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = selectedTheme === 'luxury_dark' ? '#f59e0b' :
                    selectedTheme === 'neon_cyber' ? '#22d3ee' : '#ffffff';
    ctx.font = '900 28px system-ui, sans-serif';
    ctx.letterSpacing = '5px';
    const brandName = storeName.toUpperCase();
    ctx.fillText(brandName, 80, 80);

    ctx.fillStyle = '#a1a1aa';
    if (selectedTheme === 'sunset_orange') ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '800 13px system-ui, sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText("PREMIUM PRODUCT SHOWCASE", 80, 112);

    // Draw phone top-right text
    ctx.textAlign = 'right';
    ctx.fillStyle = selectedTheme === 'luxury_dark' ? '#fbbf24' :
                    selectedTheme === 'neon_cyber' ? '#22d3ee' : '#ffffff';
    ctx.font = 'bold 20px monospace';
    const contactPhoneText = branding?.phone || branding?.whatsapp_number || 'PREMIUM MAĞAZA';
    ctx.fillText(contactPhoneText, width - 80, 95);
    ctx.textAlign = 'left'; // Reset

    // Main image loading
    const mainImageUrl = productImages[0] || null;

    const finalizeDrawAndDownload = (imgElement: HTMLImageElement | null) => {
      // Image occupies the whole core region of the card
      const imgX = 30;
      const imgY = 140;
      const imgWidth = width - 60;
      const imgHeight = selectedRatio === 'square' ? height - 170 : 1210; // story reaches up to 1350

      ctx.save();
      // Clip image to outer border limits
      ctx.rect(imgX, imgY, imgWidth, imgHeight);
      ctx.clip();

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
        } catch (err) {
          drawFallback(imgX, imgY, imgWidth, imgHeight);
        }
      } else {
        drawFallback(imgX, imgY, imgWidth, imgHeight);
      }

      ctx.restore();

      // Subtle black gradient overlay on the bottom portion of image
      const imgGrad = ctx.createLinearGradient(30, imgY + imgHeight - 480, 30, imgY + imgHeight);
      imgGrad.addColorStop(0, 'rgba(0,0,0,0)');
      imgGrad.addColorStop(0.35, 'rgba(0, 0, 0, 0.45)');
      imgGrad.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
      ctx.fillStyle = imgGrad;
      ctx.fillRect(30, imgY + imgHeight - 480, imgWidth, 480);

      // Draw floating discount sticker top right if discountPercentage exists
      if (discountPercentage > 0) {
        const stickerX = width - 130;
        const stickerY = 240;
        
        ctx.fillStyle = '#e11d48'; // red-650
        ctx.beginPath();
        ctx.arc(stickerX, stickerY, 65, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.font = 'bold 16px system-ui, sans-serif';
        ctx.fillText("İNDİRİM", stickerX, stickerY - 14);
        ctx.font = '950 38px system-ui, sans-serif';
        ctx.fillText(`%${discountPercentage}`, stickerX, stickerY + 20);
        ctx.textAlign = 'left';
      }

      // --- TEXT CONTENT GLASS CARD OVERLAY ---
      const glassX = 70;
      const glassY = selectedRatio === 'square' ? 730 : 1085;
      const glassW = width - 140;
      const glassH = 290;

      // Draw glass card container
      ctx.fillStyle = 'rgba(8, 11, 22, 0.90)'; // premium slate backdrop
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(glassX, glassY, glassW, glassH, 24) : ctx.rect(glassX, glassY, glassW, glassH);
      ctx.fill();

      ctx.strokeStyle = selectedTheme === 'luxury_dark' ? 'rgba(217,119,6,0.35)' :
                        selectedTheme === 'neon_cyber' ? 'rgba(6,182,212,0.4)' : 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Pills starts at X = glassX + 40, Y = glassY + 30
      const pillY = glassY + 30;
      ctx.font = 'bold 15px system-ui, sans-serif';
      const catText = productCategory.toUpperCase().substring(0, 20);
      const catWidth = ctx.measureText(catText).width + 30;

      // Category Pill
      ctx.fillStyle = selectedTheme === 'luxury_dark' ? '#d97706' :
                      selectedTheme === 'neon_cyber' ? '#06b6d4' : '#ffffff';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(glassX + 35, pillY, catWidth, 34, 8) : ctx.rect(glassX + 35, pillY, catWidth, 34);
      ctx.fill();

      ctx.fillStyle = '#010510';
      ctx.font = '900 13px system-ui, sans-serif';
      ctx.fillText(catText, glassX + 50, pillY + 22);

      let nextPillX = glassX + 35 + catWidth + 15;

      // Brand Pill (if exists)
      if (productBrand) {
        const brandText = productBrand.toUpperCase();
        ctx.font = 'bold 13px system-ui, sans-serif';
        const brandWidth = ctx.measureText(brandText).width + 30;

        ctx.fillStyle = 'rgba(79, 70, 229, 0.15)';
        ctx.strokeStyle = 'rgba(79, 70, 229, 0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(nextPillX, pillY, brandWidth, 34, 8) : ctx.rect(nextPillX, pillY, brandWidth, 34);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#818cf8';
        ctx.fillText(brandText, nextPillX + 15, pillY + 22);
        nextPillX += brandWidth + 15;
      }

      // Barcode Pill (replaces stocks)
      if (product.barcode) {
        const barText = `KOD: ${product.barcode.toUpperCase()}`;
        ctx.font = 'bold 13px system-ui, sans-serif';
        const barWidth = ctx.measureText(barText).width + 30;

        ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(nextPillX, pillY, barWidth, 34, 8) : ctx.rect(nextPillX, pillY, barWidth, 34);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#22d3ee';
        ctx.fillText(barText, nextPillX + 15, pillY + 22);
      }

      // Product Title drawing
      ctx.fillStyle = '#ffffff';
      ctx.font = '950 30px system-ui, sans-serif';
      const titleLines = wrapText(productTitle, glassW - 70);
      let titleYLine = glassY + 98;
      titleLines.forEach((line, idx) => {
        if (idx < 2) {
          ctx.fillText(line, glassX + 35, titleYLine);
          titleYLine += 42;
        }
      });

      // Price block at bottom of glass block
      const priceRowY = glassY + 225;

      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(glassX + 35, priceRowY - 25);
      ctx.lineTo(glassX + glassW - 35, priceRowY - 25);
      ctx.stroke();

      ctx.fillStyle = '#a1a1aa';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillText(discountPercentage > 0 ? "KAMPANYALI FİYAT SEÇENEĞİ" : "AVANTAJLI LİSTE FİYATI", glassX + 35, priceRowY - 5);

      ctx.fillStyle = '#10b981'; // emerald-450
      ctx.font = '900 36px system-ui, sans-serif';
      ctx.fillText(priceText, glassX + 35, priceRowY + 35);

      if (oldPriceText) {
        ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.fillStyle = '#ef4444';
        const prLabelWidth = ctx.measureText(priceText).width;
        const oldXLoc = glassX + 35 + prLabelWidth + 30;
        ctx.fillText(oldPriceText, oldXLoc, priceRowY + 22);

        const oldW = ctx.measureText(oldPriceText).width;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(oldXLoc - 4, priceRowY + 14);
        ctx.lineTo(oldXLoc + oldW + 4, priceRowY + 14);
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(glassX + 35, priceRowY - 35);
      ctx.lineTo(glassX + glassW - 35, priceRowY - 35);
      ctx.stroke();

      ctx.fillStyle = '#a1a1aa';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillText(discountPercentage > 0 ? "KAMPANYALI FİYAT SEÇENEĞİ" : "AVANTAJLI LİSTE FİYATI", glassX + 35, priceRowY - 12);

      ctx.fillStyle = '#10b981'; // emerald-450
      ctx.font = '900 36px system-ui, sans-serif';
      ctx.fillText(priceText, glassX + 35, priceRowY + 28);

      if (oldPriceText) {
        ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.fillStyle = '#ef4444';
        const prLabelWidth = ctx.measureText(priceText).width;
        const oldXLoc = glassX + 35 + prLabelWidth + 30;
        ctx.fillText(oldPriceText, oldXLoc, priceRowY + 22);

        const oldW = ctx.measureText(oldPriceText).width;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(oldXLoc - 4, priceRowY + 14);
        ctx.lineTo(oldXLoc + oldW + 4, priceRowY + 14);
        ctx.stroke();
      }

      // Guarantee badge on right alignment
      ctx.textAlign = 'right';
      ctx.fillStyle = '#f59e0b'; // amber-500
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.fillText("⭐ %100 SATICI GÜVENCESİ", glassX + glassW - 35, priceRowY + 18);
      ctx.textAlign = 'left'; // Restore alignment

      // Story Special Callout Box below the visual frame
      if (selectedRatio === 'story') {
        const calloutY = 1420;
        const calloutH = 340;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(80, calloutY, width - 160, calloutH, 20) : ctx.rect(80, calloutY, width - 160, calloutH);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#f59e0b';
        ctx.font = '900 24px system-ui, sans-serif';
        ctx.fillText("⭐ %100 ORİJİNAL ÜRÜN GARANTİSİ", width / 2, calloutY + 70);

        ctx.fillStyle = '#e4e4e7';
        ctx.font = 'semibold 18px system-ui, sans-serif';
        const strLinesText = [
          `Bu yüksek tescilli tasarım, orijinal faturası ve ambalajı`,
          `ile mağazamız güvencesinde kapınıza kadar ulaştırılıyor!`,
          `Hızlı destek, sipariş ve randevu için bize hemen ulaşın.`
        ];
        strLinesText.forEach((lnText, lnIdx) => {
          ctx.fillText(lnText, width / 2, calloutY + 130 + (lnIdx * 45));
        });
        ctx.textAlign = 'left'; // restore
      }

      // Trigger actual download of canvas
      try {
        const link = document.createElement("a");
        const sanitizedTitle = productTitle.toLowerCase().replace(/\s+/g, '-').substring(0, 20);
        link.download = `afis-product-${sanitizedTitle}-${selectedTheme}-${selectedRatio}.png`;
        link.href = canvas.toDataURL("image/png");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        setRenderError("Kaydetme işlemi sırasında tarayıcı güvenlik kısıtlaması nedeniyle hata oluştu.");
      }
      setIsRendering(false);
    };

    const drawFallback = (x: number, y: number, w: number, h: number) => {
      const grad = ctx.createLinearGradient(x, y, x + w, y + h);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(1, '#334155');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);

      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 3;
      for (let offset = 0; offset < w + h; offset += 50) {
        ctx.beginPath();
        ctx.moveTo(x + offset, y);
        ctx.lineTo(x, y + offset);
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.font = 'bold 100px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("🎁", x + w/2, y + h/2 + 20);

      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '800 13px system-ui, sans-serif';
      ctx.letterSpacing = '1px';
      ctx.fillText("PREMIUM PRODUCT GALLERY", x + w/2, y + h/2 + 70);
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
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[999] flex items-center justify-center p-4 overflow-y-auto font-sans" id="product-share-wizard-modal">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh]">
        
        {/* Left Side: Real-time Live Preview */}
        <div className="lg:w-1/2 bg-slate-100 p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200 overflow-y-auto">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5" /> AFİŞ ÖNİZLEME (FİİLİ TASARIM)
              </span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setSelectedRatio('square')}
                  className={`p-1.5 rounded-lg border transition-all ${selectedRatio === 'square' ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                  title="Kare Gönderi Post (1:1)"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setSelectedRatio('story')}
                  className={`p-1.5 rounded-lg border transition-all ${selectedRatio === 'story' ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                  title="Dikey Gönderi / Hikaye Story (9:16)"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Poster Canvas container */}
            <div className="flex justify-center items-center py-4">
              <div 
                ref={previewContainerRef}
                className={`relative w-full max-w-[340px] rounded-2xl overflow-hidden shadow-2xl border-4 ${themeConfig.accentBorder} ${themeConfig.bg} transition-all duration-300 flex flex-col`}
                style={{ aspectRatio: selectedRatio === 'square' ? '1/1' : '9/16' }}
              >
                {/* Brand Header (Sits beautifully at the top) */}
                <div className="p-3 bg-black/45 backdrop-blur-md border-b border-white/10 flex justify-between items-center z-10">
                  <div className="truncate pr-2">
                    <h3 className={`text-[11px] font-black tracking-wider uppercase leading-none select-none ${themeConfig.textTitle}`}>
                      {storeName}
                    </h3>
                    <span className="text-[7.5px] font-black tracking-widest text-zinc-400 uppercase mt-0.5 block select-none">
                      PREMIUM VİTRİN
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono font-black text-rose-400 bg-rose-500/10 border border-rose-500/25 px-1.5 py-0.5 rounded select-none">
                      {branding?.phone || branding?.whatsapp_number || 'YETKİLİ MAĞAZA'}
                    </span>
                  </div>
                </div>

                {/* Main Visual Image centerpiece (Occupies 100% of rest of card height) */}
                <div className="relative flex-1 w-full bg-slate-900 overflow-hidden flex flex-col justify-end">
                  {/* Image full bleed background */}
                  {productImages[0] ? (
                    <img 
                      src={productImages[0]} 
                      alt={productTitle} 
                      className="absolute inset-0 w-full h-full object-cover select-none"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-800">
                      <span className="text-4xl mb-1">🎁</span>
                      <span className="text-[10px] font-bold">Görsel Eklenmemiş</span>
                    </div>
                  )}

                  {/* Gradient Overlay for exceptional legibility and contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent pointer-events-none" />

                  {/* Floating Discount Sticker */}
                  {discountPercentage > 0 && (
                    <span className="absolute top-3 right-3 bg-gradient-to-r from-red-600 to-rose-600 text-white font-mono text-[9px] font-black px-2.5 py-1 rounded-full select-none uppercase shadow-lg animate-pulse z-20">
                      %{discountPercentage} Dev İndirim!
                    </span>
                  )}

                  {/* PREMIUM OVERLAY INFO BLOC (Always visible, clean spacing) */}
                  <div className="relative z-10 p-2.5 m-2.5 bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-xl flex flex-col gap-1.5">
                    
                    {/* Pills row (Category, Brand, Barcode) - NO STOCKS! */}
                    <div className="flex gap-1 flex-wrap select-none">
                      <span className={`text-[7.5px] font-black px-1.5 py-0.5 rounded-md border uppercase ${themeConfig.pillBg}`}>
                        {productCategory}
                      </span>
                      {productBrand && (
                        <span className="text-[7.5px] font-bold px-1.5 py-0.5 rounded-md border border-indigo-500/25 bg-indigo-500/10 text-indigo-300 uppercase">
                          {productBrand}
                        </span>
                      )}
                      {product.barcode && (
                        <span className="text-[7.5px] font-mono font-bold px-1.5 py-0.5 rounded-md border border-cyan-500/25 bg-cyan-500/10 text-cyan-300 uppercase">
                          KOD: {product.barcode}
                        </span>
                      )}
                    </div>

                    {/* Product Title */}
                    <h4 className={`text-[11.5px] leading-snug font-extrabold uppercase line-clamp-2 select-text ${themeConfig.textTitle}`}>
                      {productTitle}
                    </h4>

                    {/* Price and Action Section */}
                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-white/10">
                      <div>
                        <span className="block text-[6.5px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                          {discountPercentage > 0 ? "KAMPANYALI SEÇENEK" : "AVANTAJLI LİSTE"}
                        </span>
                        <div className="flex items-baseline gap-1.5 leading-none">
                          <span className="text-xs font-black text-emerald-400">{priceText}</span>
                          {oldPriceText && (
                            <span className="line-through text-[8.5px] text-red-500 font-extrabold">{oldPriceText}</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Premium Assurance Tag */}
                      <span className="text-[7.5px] font-extrabold text-[#fbbf24] bg-amber-400/15 border border-amber-400/20 px-1.5 py-0.5 rounded select-none uppercase shrink-0">
                        %100 ORİJİNAL
                      </span>
                    </div>

                  </div>
                </div>

                {/* Callout box for Vertical Ratio Story - sits beautifully below the centerpiece */}
                {selectedRatio === 'story' && (
                  <div className="p-3 mx-2.5 mb-2.5 bg-white/5 border border-white/10 rounded-xl text-center flex flex-col justify-center items-center">
                    <span className="text-[8.5px] font-black tracking-wider text-[#fbbf24] mb-0.5 uppercase">⭐ %100 SATICI GÜVENCESİ</span>
                    <p className="text-[8.5px] text-slate-350 leading-normal">
                      Orijinal kutusundaki bu parçaya <strong>{storeName}</strong> ayrıcalığı ve hızlı kargo desteği ile sahip olabilirsiniz!
                    </p>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* Theme Colors selection */}
          <div className="mt-4">
            <span className="block text-[11px] font-black tracking-wider text-slate-500 uppercase mb-2">🎨 GÖRSEL ŞABLON SEÇENEKLERİ</span>
            <div className="grid grid-cols-4 gap-2">
              <button 
                onClick={() => setSelectedTheme('sunset_orange')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${selectedTheme === 'sunset_orange' ? 'bg-orange-500 border-white text-white ring-2 ring-orange-550/40 shadow-md' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`}
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-500 to-rose-600 mb-1 border border-white/20" />
                <span className="text-[9px] font-bold">Turuncu Fırsat</span>
              </button>
              <button 
                onClick={() => setSelectedTheme('luxury_dark')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${selectedTheme === 'luxury_dark' ? 'bg-slate-900 border-amber-500 text-white ring-2 ring-amber-500/40 shadow-md' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`}
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-950 to-amber-500 mb-1" />
                <span className="text-[9px] font-bold">Lüks Siyah</span>
              </button>
              <button 
                onClick={() => setSelectedTheme('neon_cyber')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${selectedTheme === 'neon_cyber' ? 'bg-indigo-950 border-cyan-400 text-white ring-2 ring-cyan-400/35 shadow-md' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`}
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-900 to-cyan-500 mb-1" />
                <span className="text-[9px] font-bold">Sanal Siber</span>
              </button>
              <button 
                onClick={() => setSelectedTheme('minimal_carbon')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${selectedTheme === 'minimal_carbon' ? 'bg-zinc-900 border-zinc-550 text-white ring-2 ring-zinc-500/25 shadow-md' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`}
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-zinc-700 to-neutral-900 mb-1" />
                <span className="text-[9px] font-bold">Kömür Gri</span>
              </button>
            </div>

            {/* Downloader Trigger Button */}
            <div className="mt-4 flex gap-1 items-center">
              <button 
                onClick={handleDownloadImage}
                disabled={isRendering}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl transition-all shadow-lg text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50"
              >
                {isRendering ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {isRendering ? 'Görsel Derleniyor (PNG)...' : 'Afiş Görselini İndir (PNG)'}
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
                <Instagram className="w-5 h-5 text-indigo-600" /> KOPYALANABİLİR REKLAM METİNLERİ
              </h2>
              <button 
                onClick={onClose}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-500 text-xs leading-relaxed mb-4">
              Reklam afişinizi sol panelden dilediğiniz gibi hazırlayıp indirdikten sonra, sosyal medya postlarınız, story paylaşımlarınız veya WhatsApp katalog duyurularınız için kullanabileceğiniz hazır pazarlama metinleri:
            </p>

            {/* Tone Selector */}
            <div className="mb-4">
              <span className="block text-[11px] font-black tracking-wider text-slate-500 uppercase mb-2 font-sans">✍️ METİN TONU VE ÜSLUP TERCİHİ</span>
              <div className="grid grid-cols-3 gap-2 bg-slate-55 p-1 rounded-2xl border border-slate-200">
                <button 
                  onClick={() => setSelectedTone('promo')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${selectedTone === 'promo' ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-extrabold' : 'text-slate-550 hover:text-slate-900'}`}
                >
                  🔥 İndirim & Fırsat
                </button>
                <button 
                  onClick={() => setSelectedTone('luxury')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${selectedTone === 'luxury' ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-extrabold' : 'text-slate-550 hover:text-slate-900'}`}
                >
                  ⚜️ Lüks & Prestij
                </button>
                <button 
                  onClick={() => setSelectedTone('friendly')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${selectedTone === 'friendly' ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-extrabold' : 'text-slate-550 hover:text-slate-900'}`}
                >
                  ✨ Samimi & Emojili
                </button>
              </div>
            </div>

            {/* Caption Text area */}
            <div className="relative">
              <span className="block text-[11px] font-black tracking-wider text-slate-400 uppercase mb-1">HAZIR REKLAM METNİ (KOPYALANABİLİR)</span>
              <div className="border border-slate-200 rounded-2xl bg-slate-50 overflow-hidden">
                <textarea 
                  value={getCaptionText()}
                  readOnly
                  className="w-full h-[240px] p-4 text-xs font-medium text-slate-800 leading-relaxed bg-transparent focus:outline-none focus:ring-0 resize-none font-sans border-0 select-text"
                />
                
                {/* Float copy bar */}
                <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-indigo-600" /> DIGITAL AD-WRITER V3
                  </span>
                  <button 
                    onClick={handleCopyCaption}
                    className={`px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1 shadow-sm ${copySuccess ? 'bg-emerald-600 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
                  >
                    {copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copySuccess ? 'Kopyalandı!' : 'Metni Kopyala'}
                  </button>
                </div>
              </div>
            </div>

            {/* Help guidelines */}
            <div className="mt-4 p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-100 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-indigo-900 leading-none">PRATİK KULLANIM REHBERİ</h4>
                <p className="text-[10.5px] text-indigo-800 leading-relaxed mt-1">
                  Afiş şablonunuzu sol kısımdan dikey veya kare olarak ayarlayıp indirdikten sonra, sağdaki reklam açıklamasını tek tıkla kopyalayarak Instagram veya WhatsApp statünüzde doğrudan paylaşabilirsiniz.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Hidden virtual canvas for ultra-resolution graphics processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
