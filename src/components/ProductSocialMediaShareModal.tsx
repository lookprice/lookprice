import React, { useState, useRef, useEffect, useMemo } from "react";
import { safeHtml2Canvas, prepareImagesForHtml2Canvas, urlToDataUrl } from "../utils/html2canvasFix";
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
  const [safeProductImageUrl, setSafeProductImageUrl] = useState<string>('');

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

  // Proactively convert external image URL to Data URL via backend proxy so that:
  // 1) The preview displays crisp image with zero CORS restrictions
  // 2) html2canvas has the Data URL ready instantly when user clicks "Görseli İndir"
  useEffect(() => {
    let isMounted = true;
    const initialUrl = productImages[0];
    if (!initialUrl) {
      setSafeProductImageUrl('');
      return;
    }

    if (initialUrl.startsWith('data:')) {
      setSafeProductImageUrl(initialUrl);
      return;
    }

    urlToDataUrl(initialUrl).then((safeUrl) => {
      if (isMounted && safeUrl && safeUrl.startsWith('data:')) {
        setSafeProductImageUrl(safeUrl);
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [productImages]);

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

  const rawStoreName = storeName || branding?.store_name || branding?.name || "";
  const storeNameDisplay = (!rawStoreName || rawStoreName.toLowerCase().includes("lookprice")) ? "Seçkin Mağaza" : rawStoreName;

  // Determine theme colors for HTML Preview
  const getThemeClasses = () => {
    switch (selectedTheme) {
      case 'luxury_dark':
        return {
          canvasBg: 'bg-gradient-to-b from-[#111625] via-[#0b0e17] to-[#040609]',
          ambientGlow: 'from-amber-500/25 via-amber-600/10 to-transparent',
          accentBorder: 'border-amber-500/40',
          innerBorder: 'border-white/15',
          headerBg: 'bg-black/60 border border-white/10 text-white',
          infoCardBg: 'bg-black/85 border border-white/15 text-white shadow-2xl',
          textTitle: 'text-amber-400 font-black',
          priceColor: 'text-amber-300 font-black',
          oldPriceColor: 'text-rose-400 line-through font-bold',
          priceLabel: 'text-amber-200/90 font-extrabold',
          badgeBorder: 'border-amber-500/40',
          badgeText: 'text-amber-300',
          discountBg: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-black'
        };
      case 'sunset_orange':
        return {
          canvasBg: 'bg-gradient-to-b from-[#1c0a02] via-[#0f0501] to-[#050200]',
          ambientGlow: 'from-orange-500/30 via-orange-600/10 to-transparent',
          accentBorder: 'border-orange-500/40',
          innerBorder: 'border-white/15',
          headerBg: 'bg-black/60 border border-white/10 text-white',
          infoCardBg: 'bg-black/85 border border-white/15 text-white shadow-2xl',
          textTitle: 'text-orange-400 font-black',
          priceColor: 'text-amber-300 font-black',
          oldPriceColor: 'text-rose-400 line-through font-bold',
          priceLabel: 'text-orange-200/90 font-extrabold',
          badgeBorder: 'border-orange-500/40',
          badgeText: 'text-orange-300',
          discountBg: 'bg-gradient-to-r from-orange-500 to-rose-600 text-white font-black'
        };
      case 'neon_cyber':
        return {
          canvasBg: 'bg-gradient-to-b from-[#051124] via-[#030914] to-[#010307]',
          ambientGlow: 'from-cyan-500/25 via-blue-600/10 to-transparent',
          accentBorder: 'border-cyan-500/40',
          innerBorder: 'border-white/15',
          headerBg: 'bg-black/60 border border-white/10 text-white',
          infoCardBg: 'bg-black/85 border border-white/15 text-white shadow-2xl',
          textTitle: 'text-cyan-400 font-black',
          priceColor: 'text-cyan-300 font-black',
          oldPriceColor: 'text-rose-400 line-through font-bold',
          priceLabel: 'text-cyan-200/90 font-extrabold',
          badgeBorder: 'border-cyan-500/40',
          badgeText: 'text-cyan-300',
          discountBg: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black'
        };
      case 'minimal_carbon':
      default:
        return {
          canvasBg: 'bg-gradient-to-b from-[#1c1c1f] via-[#121214] to-[#0a0a0c]',
          ambientGlow: 'from-emerald-500/20 via-zinc-600/10 to-transparent',
          accentBorder: 'border-zinc-600/50',
          innerBorder: 'border-white/15',
          headerBg: 'bg-black/60 border border-white/10 text-white',
          infoCardBg: 'bg-black/85 border border-white/15 text-white shadow-2xl',
          textTitle: 'text-white font-black',
          priceColor: 'text-emerald-400 font-black',
          oldPriceColor: 'text-rose-400 line-through font-bold',
          priceLabel: 'text-zinc-300 font-extrabold',
          badgeBorder: 'border-zinc-700',
          badgeText: 'text-emerald-400',
          discountBg: 'bg-emerald-500 text-slate-950 font-black'
        };
    }
  };

  const themeConfig = getThemeClasses();

  // Dynamic Captions generator (100% Client-side robust copywriting for products)
  const getCaptionText = () => {
    const rawName = storeName || branding?.store_name || branding?.name || "";
    const displayName = (!rawName || rawName.toLowerCase().includes("lookprice")) ? "Seçkin Mağaza" : rawName;
    
    const contactPhone = branding?.whatsapp_number || branding?.phone || '';
    const contactPhoneText = contactPhone 
      ? `iletişim Hattı: ${contactPhone}` 
      : 'DM yoluyla iletişim kurabilirsiniz.';
    const storeHashtag = `#${displayName.toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, '')}`;
    const activeHashtags = `#alisveris #kampanya #kampanyaliurunler #kalite #indirim #firsat #hediyelik #${productCategory.toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, '')} #${(productBrand || 'urun').toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, '')} ${storeHashtag}`;

    switch (selectedTone) {
      case 'luxury':
        return `⚜️ YAŞAMINIZA ZERAFET KATIN: ${productTitle.toUpperCase()} ⚜️\n\n` +
               `Adını özgün tasarımdan, gücünü ise kaliteden alan muhteşem bir ürünle stilinizi taçlandırın. ${displayName} koleksiyonunun gözde tasarımları arasında yer alan bu nadide parça cazibesiyle göz kamaştırıyor.\n\n` +
               `🛍️ Ürün Bilgileri ve Özellikleri:\n` +
               `• Ürün Adı: ${productTitle}\n` +
               `• Kategori / Marka: ${productCategory} ${productBrand ? `• ${productBrand}` : ''}\n` +
               `• Güvence: %100 Orijinal Ürün & ${displayName} Güvencesi\n` +
               (discountPercentage > 0 ? `• Kampanya Ayrıcalığı: Net %${discountPercentage} Seçkin İndirim Oranı\n` : '') +
               `• Barkod ID: ${product.barcode || 'LP-PROD'}\n\n` +
               `💰 Ayrıcalıklı Liste Satış Bedeli: ${priceText}\n` +
               (oldPriceText ? `❌ Önceki Fiyat: ${oldPriceText}\n` : '') +
               `\nHayatına prestij ve asalet katmak isteyen, detaylardaki mükemmelliği önemseyen tüm seçkin misafirlerimizi mağazamıza davet ediyoruz. İncelemeniz ve dilediğiniz adrese randevulu kurye gönderimleri için bize hemen ulaşabilirsiniz.\n\n` +
               `📞 ${contactPhoneText}\n` +
               `🏢 Koleksiyon Sahibi / Mağaza: ${displayName}\n\n` +
               `${activeHashtags}`;

      case 'promo':
        return `🔥 BÜYÜK FIRSAT DETAYI: KAÇIRILMAYACAK FİYAT! 🔥\n\n` +
               `Vitrinlerimizde hararetli anlar yaşanıyor! Sizlere kalite tescilli ${productTitle} ürünümüzü inanılmaz avantajlarla sunuyoruz. Stok tükenmeden hızlı karar verin!\n\n` +
               `⚡️ Kampanya ve Detaylar:\n` +
               `• Ürün Segmenti: ${productCategory}\n` +
               (productBrand ? `• Marka Kalitesi: ${productBrand}\n` : '') +
               (discountPercentage > 0 ? `🎊 Dev İndirim Oranı: %${discountPercentage} İndirim Fırsatı!\n` : '') +
               `• Barkod / Kod: ${product.barcode || 'LP-PROD'}\n` +
               `• Güvence: %100 Orijinal Ürün & ${displayName} Güvencesi\n\n` +
               `💰 Şok Liste Fiyatı: ${priceText}\n` +
               (oldPriceText ? `❌ Eski Satış Fiyatı: ${oldPriceText} (Büyük İndirim Yapıldı!)\n` : '') +
               `\nBu bütçe dostu, Premium tasarımı kapınıza kadar ulaştırmak ve hızlı sipariş geçmek için bize hemen DM atabilir veya telefon hattımızdan iletişime geçebilirsiniz. Fırsatı kaçırmayın!\n\n` +
               `📞 ${contactPhoneText}\n` +
               `🏪 Yetkili Satıcı Mağaza: ${displayName}\n\n` +
               `#indirimvar #sezonindirimi #alisveriszamani #firsatfiyat #alisverisonline ${activeHashtags}`;

      case 'friendly':
        return `🌟 Günün Harika Ürünü İle Karşınızdayız! 🌟\n\n` +
               `Selamlar sevgili ${displayName} takipçileri! 😍 Bugün mağazamızın en beğenilen, her köşede tarzınızı ve günlük kullanım konforunuzu tazeleyecek pırıl pırıl bir parçayı sizinle paylaşmak için çok heyecanlıyız: ${productTitle}! ✨\n\n` +
               `🌸 Neden Bu Ürüne Bayılacaksınız?\n` +
               `👉 Kalite & Zarafet bir arada: ${productCategory} koleksiyonunun en yeni tarzı\n` +
               (productBrand ? `👉 Güvendiğiniz Marka: ${productBrand} güvencesiyle\n` : '') +
               (discountPercentage > 0 ? `👉 Çok Özel İndirim: Tam %${discountPercentage} indirim yaptık, her bütçeye uygun hale getirdik! 🥳\n` : '') +
               `👉 Tam günlük kullanımınıza, şık sofralarınıza veya sevdiklerinize hediye edilmeye uygun!\n\n` +
               `💰 Yeni Sahibini Bekleyen Fiyat: ${priceText}\n` +
               (oldPriceText ? `👉 Eski fiyata elveda: ${oldPriceText} yerine sadece ${priceText}! 😍\n` : '') +
               `\nEv sahipliği yapmak, detaylı sormak ya da bir Türk kahvemizi içerken ürünü yakından incelemek için bizimle hemen iletişime geçin. Sizler için mağazamızda özenle paketlemek için hazırız!\n\n` +
               `💬 DM üzerinden veya buraya yazarak bana anında ulaşabilirsiniz:\n` +
               `📞 ${contactPhoneText}\n` +
               `🛍️ Güvenli Mağaza: ${displayName}\n\n` +
               `${activeHashtags}`;
    }
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(getCaptionText());
    setCopySuccess(true);
  };

  // High-Resolution HTML5 Canvas Exporter for General Product Share Poster
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
      // Allow layout engine to fully settle
      await new Promise(resolve => setTimeout(resolve, 200));

      // 1. Prepare and convert all images inside preview element to Data URLs for 100% CORS safety
      await prepareImagesForHtml2Canvas(element);

      // 2. Render DOM element to high-resolution canvas with safe modern color handling
      const currentWidth = element.clientWidth || 340;
      const targetWidth = 1080;
      const renderScale = Math.max(3.0, targetWidth / currentWidth);

      const canvas = await safeHtml2Canvas(element, {
        scale: renderScale,
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        logging: false,
        imageTimeout: 15000,
      });

      // 3. Download generated PNG
      const sanitizedTitle = (productTitle || 'afis')
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
      link.download = `afis-product-${sanitizedTitle}-${selectedTheme}-${selectedRatio}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error("Poster export error:", err);
      setRenderError("Afiş görseli indirilirken bir hata oluştu: " + (err?.message || "Lütfen tekrar deneyiniz."));
    } finally {
      setIsRendering(false);
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
                className={`relative w-[340px] rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 flex flex-col font-sans select-none ${themeConfig.canvasBg}`}
                style={{ height: selectedRatio === 'square' ? '340px' : '604px' }}
              >
                {/* Double Luxury Borders */}
                <div className={`absolute inset-2 border-[2px] rounded-2xl pointer-events-none z-10 ${themeConfig.accentBorder}`} />
                <div className={`absolute inset-3 border rounded-2xl pointer-events-none z-10 ${themeConfig.innerBorder}`} />

                {/* Top Glassmorphic Store & Contact Bar */}
                <div className={`relative z-20 flex justify-between items-center px-3.5 py-2 mx-3.5 mt-4 rounded-xl backdrop-blur-md ${themeConfig.headerBg} shrink-0`}>
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-sm" />
                    <span className="text-[10.5px] font-black uppercase tracking-wider text-white inline-block leading-normal py-0.5">
                      {storeNameDisplay}
                    </span>
                  </div>
                  <div className={`shrink-0 text-[9.5px] font-mono font-black ${themeConfig.textTitle} leading-normal py-0.5 flex items-center gap-1`}>
                    <span>📞</span>
                    <span>{branding?.whatsapp_number || branding?.phone || '+90 212 8812442'}</span>
                  </div>
                </div>

                {/* Main Visual Image centerpiece with ambient glow */}
                <div className="relative flex-1 min-h-0 w-full flex items-center justify-center p-3 z-10 overflow-hidden">
                  {/* Soft Radial Backlight */}
                  <div className={`absolute inset-0 bg-radial ${themeConfig.ambientGlow} pointer-events-none`} />

                  {(safeProductImageUrl || productImages[0]) ? (
                    <img 
                      src={safeProductImageUrl || productImages[0]} 
                      alt={productTitle} 
                      className="max-w-full max-h-full w-auto h-auto object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.7)] select-none z-10"
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 z-10">
                      <span className="text-4xl mb-1">🎁</span>
                      <span className="text-[11px] font-bold">Görsel Eklenmemiş</span>
                    </div>
                  )}

                  {/* Floating Discount Badge */}
                  {discountPercentage > 0 && (
                    <div className={`absolute top-2 right-3 ${themeConfig.discountBg} font-mono text-[9px] font-black px-2.5 py-1 rounded-full uppercase shadow-xl z-20 border border-white/20`}>
                      %{discountPercentage} İNDİRİM
                    </div>
                  )}
                </div>

                {/* Translucent Overlay Info Card - 100% visible, elegant, NO line-clamp cut-off */}
                <div className={`relative z-20 mx-3.5 mb-3.5 p-3 rounded-2xl backdrop-blur-md ${themeConfig.infoCardBg} flex flex-col gap-1.5 shrink-0`}>
                  {/* Product Title */}
                  <h4 
                    className={`text-[12px] font-black uppercase tracking-wide leading-relaxed ${themeConfig.textTitle}`}
                    style={{ lineHeight: '1.4', overflowWrap: 'break-word' }}
                  >
                    {productTitle}
                  </h4>

                  {/* Price and Guarantee Section */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                    <div className="flex flex-col">
                      <span className={`block text-[7.5px] uppercase tracking-wider leading-normal font-extrabold ${themeConfig.priceLabel}`}>
                        {discountPercentage > 0 ? "KAMPANYALI LİSTE FİYATI" : "AVANTAJLI LİSTE FİYATI"}
                      </span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className={`text-base font-black tracking-tight leading-normal ${themeConfig.priceColor}`}>
                          {priceText}
                        </span>
                        {oldPriceText && (
                          <span className={`text-[9.5px] ${themeConfig.oldPriceColor} leading-normal`}>
                            {oldPriceText}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end shrink-0">
                      <span className="text-[7px] font-black uppercase tracking-widest text-slate-300 leading-normal mb-0.5 block">
                        GÜVENLİ MAĞAZA
                      </span>
                      <span className={`text-[8.5px] font-black tracking-wider uppercase px-2.5 py-1 rounded border ${themeConfig.badgeBorder} ${themeConfig.badgeText} bg-white/5 leading-normal inline-block`}>
                        ENRAKİPSİZ.COM
                      </span>
                    </div>
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
