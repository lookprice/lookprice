import React, { useState, useRef, useEffect, useMemo } from "react";
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
          textTitle: 'text-cyan-455 font-extrabold',
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
    const storeName = branding?.store_name || branding?.name || 'LookPrice Mağazası';
    const contactPhone = branding?.phone || '+90 (548) 000 0000';
    const activeHashtags = `#alisveris #kampanya #kampanyaliurunler #kalite #indirim #lookprice #firsat #hediyelik #${productCategory.toLowerCase().replace(/\s+/g, '')} #${(productBrand || 'urun').toLowerCase().replace(/\s+/g, '')}`;

    switch (selectedTone) {
      case 'luxury':
        return `⚜️ YAŞAMINIZA ZERAFET KATIN: ${productTitle.toUpperCase()} ⚜️\n\n` +
               `Adını özgün tasarımdan, gücünü ise kaliteden alan muhteşem bir ürünle stilinizi taçlandırın. ${storeName} koleksiyonunun gözde tasarımları arasında yer alan bu nadide parça cazibesiyle göz kamaştırıyor.\n\n` +
               `🛍️ Ürün Bilgileri ve Özellikleri:\n` +
               `• Ürün Adı: ${productTitle}\n` +
               `• Kategori / Marka: ${productCategory} ${productBrand ? `• ${productBrand}` : ''}\n` +
               `• Stok Durumu: Sınırlı Stok / Güvenli Teslimat\n` +
               (discountPercentage > 0 ? `• Kampanya Ayrıcalığı: Net %${discountPercentage} Seçkin İndirim Oranı\n` : '') +
               `• Barkod ID: ${product.barcode || 'LP-PROD'}\n\n` +
               `💰 Ayrıcalıklı Liste Satış Bedeli: ${priceText}\n` +
               (oldPriceText ? `❌ Önceki Fiyat: ${oldPriceText}\n` : '') +
               `\nHayatına prestij ve asalet katmak isteyen, detaylardaki mükemmelliği önemseyen tüm seçkin misafirlerimizi mağazamıza davet ediyoruz. İncelemeniz ve dilediğiniz adrese randevulu kurye gönderimleri için bize hemen ulaşabilirsiniz.\n\n` +
               `📞 İletişim Hattı: ${contactPhone}\n` +
               `🏢 Koleksiyon Sahibi: ${storeName}\n\n` +
               `${activeHashtags}`;

      case 'promo':
        return `🔥 BÜYÜK FIRSAT DETAYI: KAÇIRILMAYACAK FİYAT! 🔥\n\n` +
               `Vitrinlerimizde hararetli anlar yaşanıyor! Sizlere kalite tescilli ${productTitle} ürünümüzü inanılmaz avantajlarla sunuyoruz. Stok tükenmeden hızlı karar verin!\n\n` +
               `⚡️ Kampanya ve Detaylar:\n` +
               `• Ürün Segmenti: ${productCategory}\n` +
               (productBrand ? `• Marka Kalitesi: ${productBrand}\n` : '') +
               (discountPercentage > 0 ? `🎊 Dev İndirim Oranı: %${discountPercentage} İndirim Fırsatı!\n` : '') +
               `• Barkod / Kod: ${product.barcode || 'LP-PROD'}\n` +
               `• Güvence: LookPrice 100% Mağaza Orijinallik Garantili\n\n` +
               `💰 Şok Liste Fiyatı: ${priceText}\n` +
               (oldPriceText ? `❌ Eski Satış Fiyatı: ${oldPriceText} (Büyük İndirim Yapıldı!)\n` : '') +
               `\nBu bütçe dostu, Premium tasarımı kapınıza kadar ulaştırmak ve hızlı sipariş geçmek için bize hemen DM atabilir veya telefon hattımızdan iletişime geçebilirsiniz. Fırsatı kaçırmayın!\n\n` +
               `📞 Çağrı / WP Destek: ${contactPhone}\n` +
               `🏪 Mağaza Mağazası: ${storeName}\n\n` +
               `#indirimvar #sezonindirimi #alisveriszamani #firsatfiyat #lookpriceshop ${activeHashtags}`;

      case 'friendly':
        return `🌟 Günün Harika Ürünü İle Karşınızdayız! 🌟\n\n` +
               `Selamlar sevgili LookPrice takipçileri! 😍 Bugün mağazamızın en beğenilen, her köşede tarzınızı ve günlük kullanım konforunuzu tazeleyecek pırıl pırıl bir parçayı sizinle paylaşmak için çok heyecanlıyız: ${productTitle}! ✨\n\n` +
               `🌸 Neden Bu Ürüne Bayılacaksınız?\n` +
               `👉 Kalite & Zarafet bir arada: ${productCategory} koleksiyonunun en yeni tarzı\n` +
               (productBrand ? `👉 Güvendiğiniz Marka: ${productBrand} güvencesiyle\n` : '') +
               (discountPercentage > 0 ? `👉 Çok Özel İndirim: Tam %${discountPercentage} indirim yaptı her bütçeye uygun hale getirdik! 🥳\n` : '') +
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

    // Draw stylish bordering
    ctx.strokeStyle = selectedTheme === 'luxury_dark' ? '#d97706' : // amber-650
                      selectedTheme === 'sunset_orange' ? '#ffffff' : // white
                      selectedTheme === 'neon_cyber' ? '#06b6d4' : '#e4e4e7'; // cyan
    ctx.lineWidth = 12;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // Draw Store Branding
    ctx.fillStyle = (selectedTheme === 'sunset_orange' || selectedTheme === 'minimal_carbon') ? '#ffffff' : '#ffffff';
    if (selectedTheme === 'luxury_dark') ctx.fillStyle = '#f59e0b';
    if (selectedTheme === 'neon_cyber') ctx.fillStyle = '#22d3ee';

    ctx.font = '900 24px system-ui, sans-serif';
    ctx.letterSpacing = '5px';
    const brandName = (branding?.store_name || branding?.name || 'LOOKPRICE SHOP').toUpperCase();
    ctx.fillText(brandName, 80, 95);

    ctx.fillStyle = '#ffffff';
    if (selectedTheme === 'sunset_orange') ctx.fillStyle = 'rgba(255,255,255,0.85)';
    if (selectedTheme === 'luxury_dark') ctx.fillStyle = '#a1a1aa';
    if (selectedTheme === 'neon_cyber') ctx.fillStyle = '#818cf8';

    ctx.font = '800 13px system-ui, sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText("PREMIUM PRODUCT SHOWCASE", 80, 125);

    // Discount badge on top right if discountPercentage exists
    if (discountPercentage > 0) {
      // Draw circular discount sticker or clean tag
      const stickerX = width - 180;
      const stickerY = 90;
      
      ctx.fillStyle = selectedTheme === 'sunset_orange' ? '#ffffff' : '#e11d48';
      if (selectedTheme === 'luxury_dark') ctx.fillStyle = '#d97706';
      if (selectedTheme === 'neon_cyber') ctx.fillStyle = '#06b6d4';
      
      ctx.beginPath();
      ctx.arc(stickerX, stickerY, 55, 0, Math.PI * 2);
      ctx.fill();

      // Text inside sticker
      ctx.fillStyle = selectedTheme === 'sunset_orange' ? '#e11d48' : '#ffffff';
      if (selectedTheme === 'neon_cyber') ctx.fillStyle = '#030712';
      ctx.textAlign = 'center';
      
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillText("İNDİRİM", stickerX, stickerY - 12);
      ctx.font = '900 34px system-ui, sans-serif';
      ctx.fillText(`%${discountPercentage}`, stickerX, stickerY + 18);
      ctx.textAlign = 'left';
    } else {
      // Draw regular barcode reference badge
      const refNo = product.barcode || 'PROD-VİTRİN';
      ctx.fillStyle = selectedTheme === 'sunset_orange' ? 'rgba(255,255,255,0.15)' : '#1e293b';
      ctx.fillRect(width - 280, 70, 200, 45);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(width - 280, 70, 200, 45);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px monospace';
      ctx.letterSpacing = '1px';
      ctx.textAlign = 'center';
      ctx.fillText(refNo, width - 180, 98);
      ctx.textAlign = 'left';
    }

    // Main image loading
    const mainImageUrl = productImages[0] || null;

    const finalizeDrawAndDownload = (imgElement: HTMLImageElement | null) => {
      const imgX = 80;
      const imgY = 160;
      const imgWidth = width - 160;
      const imgHeight = selectedRatio === 'square' ? 440 : 800;

      // Draw shadow/placeholder background
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
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

          // Subtle black gradient overlay on the bottom
          const imgGrad = ctx.createLinearGradient(imgX, imgY + imgHeight - 140, imgX, imgY + imgHeight);
          imgGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
          imgGrad.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
          ctx.fillStyle = imgGrad;
          ctx.fillRect(imgX, imgY + imgHeight - 140, imgWidth, 140);
        } catch (err) {
          drawFallback(imgX, imgY, imgWidth, imgHeight);
        }
      } else {
        drawFallback(imgX, imgY, imgWidth, imgHeight);
      }

      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 4;
      ctx.strokeRect(imgX, imgY, imgWidth, imgHeight);

      // --- TEXT CONTENT AREA ---
      const contentYStart = imgY + imgHeight + 50;

      // Category / Brand Pill Tags
      ctx.fillStyle = selectedTheme === 'luxury_dark' ? '#f59e0b' :
                      selectedTheme === 'sunset_orange' ? '#ffffff' :
                      selectedTheme === 'neon_cyber' ? '#22d3ee' : '#ffffff';
      ctx.fillRect(80, contentYStart, 160, 36);

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(productCategory.toUpperCase().substring(0, 15), 160, contentYStart + 24);
      ctx.textAlign = 'left';

      if (productBrand) {
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(255, contentYStart, 180, 36);
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.strokeRect(255, contentYStart, 180, 36);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px system-ui, sans-serif';
        ctx.fillText(`🏷️ ${productBrand.toUpperCase()}`, 275, contentYStart + 23);
      }

      // Title layout
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 36px system-ui, sans-serif';
      const titleLines = wrapText(productTitle, width - 160);
      let titleY = contentYStart + 90;
      titleLines.forEach((line, index) => {
        if (index < 2) {
          ctx.fillText(line, 80, titleY);
          titleY += 45;
        }
      });

      // Price Tag Row
      const priceBlockY = selectedRatio === 'square' ? height - 200 : height - 380;
      const priceGradient = ctx.createLinearGradient(80, priceBlockY, width - 80, priceBlockY);
      
      if (selectedTheme === 'luxury_dark') {
        priceGradient.addColorStop(0, '#ca8a04');
        priceGradient.addColorStop(1, '#eab308');
      } else if (selectedTheme === 'sunset_orange') {
        priceGradient.addColorStop(0, '#ffffff');
        priceGradient.addColorStop(1, '#ffeeed');
      } else if (selectedTheme === 'neon_cyber') {
        priceGradient.addColorStop(0, '#4f46e5');
        priceGradient.addColorStop(1, '#06b6d4');
      } else {
        priceGradient.addColorStop(0, '#ffffff');
        priceGradient.addColorStop(1, '#e4e4e7');
      }
      ctx.fillStyle = priceGradient;
      ctx.fillRect(80, priceBlockY, width - 160, 100);

      // Price typography integration
      ctx.fillStyle = (selectedTheme === 'sunset_orange' || selectedTheme === 'minimal_carbon') ? '#ea580c' : '#ffffff';
      if (selectedTheme === 'minimal_carbon') ctx.fillStyle = '#111827';
      
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.letterSpacing = '1px';
      ctx.fillText(discountPercentage > 0 ? "KAMPANYALI LİSTE FİYATI" : "AVANTAJLI SATIŞ FİYATI", 110, priceBlockY + 40);

      ctx.font = '900 45px system-ui, sans-serif';
      ctx.fillText(priceText, 110, priceBlockY + 84);

      // Strikeout original price if discount exists
      if (oldPriceText) {
        ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.fillStyle = (selectedTheme === 'sunset_orange' || selectedTheme === 'minimal_carbon') ? '#9ca3af' : 'rgba(255,255,255,0.5)';
        const textWidth = ctx.measureText(oldPriceText).width;
        
        const oldPriceX = width - 110 - textWidth;
        ctx.fillText(oldPriceText, oldPriceX, priceBlockY + 65);
        
        // Red diagonal strike line
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(oldPriceX - 4, priceBlockY + 58);
        ctx.lineTo(oldPriceX + textWidth + 4, priceBlockY + 58);
        ctx.stroke();
      }

      // Specs bullet message underneath price
      const specY = priceBlockY - 60;
      ctx.fillStyle = '#ffffff';
      if (selectedTheme === 'sunset_orange') ctx.fillStyle = '#fffbeb';
      ctx.font = '800 20px system-ui, sans-serif';

      let detailsStr = `🔥 Kampanya Sınırlı Stok!  •  100% Orijinal  •  LookPrice Hızlı Teslimat`;
      if (product.stock_quantity !== undefined && product.stock_quantity < 10) {
        detailsStr = `⚠️ Son ${product.stock_quantity} Adet Kaldı!  •  Orijinal Ambalajında  •  LookPrice Mağazası`;
      }
      ctx.fillText(detailsStr, 80, specY);

      // Footer brand row
      const footerY = height - 60;
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(80, footerY - 20);
      ctx.lineTo(width - 80, footerY - 20);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      if (selectedTheme === 'sunset_orange') ctx.fillStyle = 'rgba(255,255,255,0.95)';
      if (selectedTheme === 'luxury_dark') ctx.fillStyle = '#a1a1aa';
      
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillText(`GÜVENLİ MULTI-STATION SİPARİŞİ VE WP DESTEK`, 80, footerY + 15);

      ctx.textAlign = 'right';
      const footerPhone = branding?.phone ? `WP: ${branding.phone}` : 'LOOKPRICE HIZLI VİTRİN AĞI';
      ctx.fillText(footerPhone, width - 80, footerY + 15);
      ctx.textAlign = 'left';

      // Download trigger
      try {
        const link = document.createElement("a");
        const sanitizedTitle = productTitle.toLowerCase().replace(/\s+/g, '-').substring(0, 20);
        link.download = `lookprice-product-${sanitizedTitle}-${selectedTheme}-${selectedRatio}.png`;
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

      // Abstract grids
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
                className={`relative w-full max-w-[340px] rounded-2xl overflow-hidden shadow-xl border-4 ${themeConfig.accentBorder} ${themeConfig.bg} transition-all duration-300 flex flex-col`}
                style={{ aspectRatio: selectedRatio === 'square' ? '1/1' : '9/16' }}
              >
                {/* Header */}
                <div className="p-4 flex justify-between items-start z-10">
                  <div>
                    <h3 className={`text-sm font-black truncate max-w-[180px] leading-tight select-none uppercase tracking-wider ${themeConfig.textTitle}`}>
                      {branding?.store_name || branding?.name || 'LOOKPRICE SHOP'}
                    </h3>
                    <p className="text-[7.5px] font-black tracking-wider text-slate-350 uppercase select-none">PREMIUM PRODUCT</p>
                  </div>
                  {discountPercentage > 0 ? (
                    <span className="bg-red-600 text-white font-mono text-[9px] font-black px-2 py-0.5 rounded-full select-none uppercase animate-pulse">
                      %{discountPercentage} İndirim
                    </span>
                  ) : (
                    <span className="bg-slate-900 border border-slate-700 text-white font-mono text-[8px] font-semibold px-1.5 py-0.5 rounded uppercase select-none">
                      {product.barcode || 'VİTRİN'}
                    </span>
                  )}
                </div>

                {/* Product Image Box */}
                <div className="px-4 flex-1 flex flex-col justify-center min-h-0">
                  <div className="relative w-full flex-1 rounded-xl overflow-hidden bg-white/10 border border-white/20 max-h-[160px] lg:max-h-[220px]">
                    {productImages[0] ? (
                      <img 
                        src={productImages[0]} 
                        alt={productTitle} 
                        className="w-full h-full object-cover select-none"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                        <span className="text-3xl">🎁</span>
                        <span className="text-[9px] font-bold mt-1">Görsel Eklenmemiş</span>
                      </div>
                    )}
                    
                    {/* Floating Price Plate */}
                    <div className="absolute bottom-2 right-2 bg-slate-950/95 text-white px-3 py-1 rounded-lg border border-slate-700 shadow-lg text-right">
                      {oldPriceText && (
                        <span className="line-through text-[8.5px] text-red-400 font-extrabold mr-1">{oldPriceText}</span>
                      )}
                      <span className="text-xs font-black text-emerald-400">{priceText}</span>
                    </div>
                  </div>
                </div>

                {/* Specs Box */}
                <div className="px-4 mt-2 mb-3">
                  <div className="flex gap-1 flex-wrap select-none font-sans mb-1.5">
                    <span className={`text-[8.5px] font-black px-2 py-0.5 rounded-md border uppercase ${themeConfig.pillBg}`}>
                      {productCategory}
                    </span>
                    {productBrand && (
                      <span className="text-[8.5px] font-bold px-2 py-0.5 rounded-md border uppercase text-indigo-700 bg-indigo-50/70 border-indigo-200">
                        🏷️ {productBrand}
                      </span>
                    )}
                    {product.stock_quantity !== undefined && (
                      <span className={`text-[8.5px] font-semibold px-2 py-0.5 rounded-md border ${
                        selectedTheme === 'sunset_orange' 
                          ? 'text-white border-white/30 bg-white/10' 
                          : 'text-slate-300 border-slate-700/55'
                      }`}>
                        Stok: {product.stock_quantity} adet
                      </span>
                    )}
                  </div>
                  
                  <h4 className={`text-xs tracking-tight leading-snug mt-1 font-extrabold uppercase line-clamp-2 ${themeConfig.textTitle}`}>
                    {productTitle}
                  </h4>
                </div>

                {/* Callout box for Vertical Ratio Story */}
                {selectedRatio === 'story' && (
                  <div className={`px-4 py-3 mx-4 my-2 rounded-xl text-center flex flex-col justify-center items-center border ${
                    selectedTheme === 'sunset_orange'
                      ? 'bg-white/10 border-white/20'
                      : 'bg-indigo-500/10 border-indigo-550/25'
                  }`}>
                    <span className={`text-[10px] font-black block mb-0.5 uppercase tracking-widest ${
                      selectedTheme === 'sunset_orange' ? 'text-white' : 'text-cyan-400'
                    }`}>⭐ KAMPANYA VE GARANTİ</span>
                    <p className={`text-[9.5px] max-w-[210px] mx-auto leading-relaxed ${
                      selectedTheme === 'sunset_orange' ? 'text-orange-50 font-semibold' : 'text-zinc-300'
                    }`}>Orijinal kutusunda, mağaza garantili ve hızlı kargo ayrılacağıyla hemen satın alabilirsiniz!</p>
                  </div>
                )}

                {/* Footer with store info */}
                <div className={`mt-auto px-4 py-3 flex justify-between items-center text-[8.5px] ${themeConfig.footerBg}`}>
                  <div className="truncate max-w-[150px]">
                    <span className={`block text-[6.5px] uppercase leading-none ${
                      selectedTheme === 'sunset_orange' ? 'text-orange-50 font-black' : 'text-zinc-500'
                    }`}>GÜVENLİ MAĞAZA</span>
                    <strong className={`mt-0.5 block truncate uppercase ${
                      selectedTheme === 'sunset_orange' ? 'text-white' : 'text-zinc-200'
                    }`}>{branding?.store_name || branding?.name || 'LOOKPRICE'}</strong>
                  </div>
                  <div className="text-right">
                    <span className={`block tracking-wider font-mono font-black leading-none ${
                      selectedTheme === 'sunset_orange' ? 'text-white' : 'text-zinc-400'
                    }`}>{branding?.phone || 'LOOKPRICE.NET'}</span>
                  </div>
                </div>

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
                    <Award className="w-3.5 h-3.5 text-indigo-600" /> LOOKPRICE AD-WRITER V3
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
