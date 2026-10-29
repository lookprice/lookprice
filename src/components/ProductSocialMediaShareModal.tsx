import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  Smartphone, 
  Grid, 
  Sparkles, 
  RefreshCw, 
  Play, 
  Pause, 
  RotateCcw, 
  Video, 
  Image as ImageIcon, 
  FileText,
  Wand2,
  Layers,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Film,
  CheckCircle2,
  MoveHorizontal,
  ZoomIn,
  ZoomOut,
  Activity,
  Sliders
} from "lucide-react";
import { Product } from "../types";
import { 
  PosterConfig, 
  SceneType,
  CollageLayout,
  ImageFitMode,
  StorySlideItem,
  MotionEffect,
  loadPosterImage, 
  renderPosterToCanvas, 
  downloadPosterImage, 
  recordPosterReel
} from "../utils/posterCanvasEngine";

interface ProductSocialMediaShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  branding?: any;
}

type TemplateTheme = 'futuristic_studio' | 'modern_commerce' | 'luxury_editorial' | 'vibrant_sale';
type AspectRatio = 'square' | 'story';
type CaptionTone = 'promo' | 'luxury' | 'futuristic' | 'friendly';

export const ProductSocialMediaShareModal: React.FC<ProductSocialMediaShareModalProps> = ({
  isOpen,
  onClose,
  product,
  branding
}) => {
  const { slug: urlSlug } = useParams<{ slug?: string }>();

  const formatSlugToTitle = (slugStr: string): string => {
    if (!slugStr) return "";
    const lowerSlug = slugStr.toLowerCase().trim();
    if (lowerSlug === 'gap-bilisim' || lowerSlug === 'gap_bilisim' || lowerSlug === 'gapbilisim') {
      return 'Gap Bilişim';
    }
    if (lowerSlug === 'lookprice') {
      return 'Seçkin Mağaza';
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

  // Core Studio States
  const [outputMode, setOutputMode] = useState<'video' | 'image'>('video');
  const [selectedTheme, setSelectedTheme] = useState<TemplateTheme>('futuristic_studio');
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('square');
  const [selectedTone, setSelectedTone] = useState<CaptionTone>('promo');
  const [rightTab, setRightTab] = useState<'slides' | 'design' | 'caption'>('slides');

  // Multi-Image Pool States
  const [imageUrlsPool, setImageUrlsPool] = useState<string[]>([]);
  const [loadedImageElements, setLoadedImageElements] = useState<HTMLImageElement[]>([]);
  const [focalZoom, setFocalZoom] = useState<number>(1.0);
  const [imageFitMode, setImageFitMode] = useState<ImageFitMode>('smart_center');

  // Interactive Slide Studio States
  const [slides, setSlides] = useState<StorySlideItem[]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [isGeneratingSlides, setIsGeneratingSlides] = useState<boolean>(false);
  const [customSlidePrompt, setCustomSlidePrompt] = useState<string>("");

  // AI Caption States
  const [captionText, setCaptionText] = useState<string>("");
  const [isGeneratingCaption, setIsGeneratingCaption] = useState<boolean>(false);

  // Video / Storyboard Reel States
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(true);
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [isExportingVideo, setIsExportingVideo] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);

  // Utility States
  const [copySuccess, setCopySuccess] = useState(false);
  const [mobileTab, setMobileTab] = useState<'stage' | 'slides' | 'caption' | 'design'>('stage');
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const animationStartTimeRef = useRef<number | null>(null);

  const formatNumberVal = (val: any) => {
    if (val === undefined || val === null || val === '') return '0';
    const parsed = parseFloat(val);
    if (isNaN(parsed)) return '0';
    return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(parsed));
  };

  const currencySymbol = product?.currency === 'GBP' ? '£' : product?.currency === 'USD' ? '$' : product?.currency === 'EUR' ? '€' : '₺';
  const priceText = `${formatNumberVal(product?.price)} ${currencySymbol}`;
  const oldPriceText = product?.old_price && Number(product.old_price) > Number(product?.price) 
    ? `${formatNumberVal(product.old_price)} ${currencySymbol}` 
    : null;

  const discountPercentage = useMemo(() => {
    if (product?.price && product?.old_price && Number(product.old_price) > Number(product.price)) {
      return Math.round(((Number(product.old_price) - Number(product.price)) / Number(product.old_price)) * 100);
    }
    return 0;
  }, [product?.price, product?.old_price]);

  // 1. Collect all product images (image_url + images array + gallery)
  useEffect(() => {
    if (!product) return;
    const urls: string[] = [];
    if (product.image_url && typeof product.image_url === 'string') {
      urls.push(product.image_url);
    }
    const rawImages = (product as any)?.images || (product as any)?.gallery || (product as any)?.image_urls;
    if (Array.isArray(rawImages)) {
      for (const item of rawImages) {
        const u = typeof item === 'string' ? item : item?.url || item?.image_url;
        if (u && typeof u === 'string' && !urls.includes(u)) {
          urls.push(u);
        }
      }
    } else if (typeof rawImages === 'string' && rawImages.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(rawImages);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const u = typeof item === 'string' ? item : item?.url;
            if (u && !urls.includes(u)) urls.push(u);
          }
        }
      } catch (e) {}
    }

    setImageUrlsPool(urls);
  }, [product]);

  // 2. Load HTMLImageElements for all collected image URLs
  useEffect(() => {
    let active = true;
    if (imageUrlsPool.length === 0) {
      setLoadedImageElements([]);
      return;
    }

    Promise.all(
      imageUrlsPool.map((url) =>
        loadPosterImage(url).catch(() => null)
      )
    ).then((imgs) => {
      if (!active) return;
      const valid = imgs.filter((i): i is HTMLImageElement => i !== null);
      setLoadedImageElements(valid);
    });

    return () => {
      active = false;
    };
  }, [imageUrlsPool]);

  // 3. Generate AI Story Slides tailored to the product's actual title, category, description, and images
  const handleGenerateStorySlides = useCallback(async (customIdeaStr: string = "") => {
    if (!product) return;
    setIsGeneratingSlides(true);
    try {
      const res = await fetch("/api/ai-social/generate-story-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: product.name,
          description: product.description || "",
          category: product.category || "Genel",
          brand: product.brand || "",
          price: formatNumberVal(product.price),
          oldPrice: oldPriceText ? formatNumberVal(product.old_price) : null,
          currency: product.currency || 'TRY',
          imagesCount: Math.max(2, imageUrlsPool.length || 4),
          customPrompt: customIdeaStr
        })
      });
      const data = await res.json();
      if (Array.isArray(data.slides) && data.slides.length > 0) {
        setSlides(data.slides);
        setActiveSlideIndex(0);
      }
    } catch (e) {
      console.error("Story slides generation error:", e);
    } finally {
      setIsGeneratingSlides(false);
    }
  }, [product, oldPriceText, imageUrlsPool.length]);

  // Generate AI Social Caption
  const handleGenerateCaption = useCallback(async (toneToUse: CaptionTone = selectedTone) => {
    if (!product) return;
    setIsGeneratingCaption(true);
    try {
      const activeSlide = slides[activeSlideIndex] || slides[0];
      const res = await fetch("/api/ai-social/generate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType: "product",
          title: product?.name,
          price: formatNumberVal(product?.price),
          oldPrice: oldPriceText ? formatNumberVal(product?.old_price) : null,
          currency: product?.currency || 'TRY',
          category: product?.category,
          brand: product?.brand,
          storeName: storeName,
          phone: branding?.phone || branding?.whatsapp_number,
          tone: toneToUse,
          campaignBadge: activeSlide?.badge || (discountPercentage > 0 ? `%${discountPercentage} İndirim` : "Özel Fırsat"),
          scenarioTitle: activeSlide?.headline || product?.name,
          scenarioDescription: activeSlide?.subtitle || product?.description
        })
      });

      const data = await res.json();
      if (data.caption) {
        setCaptionText(data.caption);
      }
    } catch (e) {
      console.error("Caption generation error:", e);
    } finally {
      setIsGeneratingCaption(false);
    }
  }, [product, oldPriceText, storeName, branding, selectedTone, slides, activeSlideIndex, discountPercentage]);

  // Initial load when modal opens
  useEffect(() => {
    if (isOpen && product) {
      handleGenerateStorySlides("");
      handleGenerateCaption('promo');
    }
  }, [isOpen, product?.id]);

  // Slide CRUD helpers
  const handleUpdateActiveSlide = (updates: Partial<StorySlideItem>) => {
    setSlides(prev => prev.map((s, idx) => idx === activeSlideIndex ? { ...s, ...updates } : s));
  };

  const handleAddSlide = () => {
    const newIdx = slides.length;
    const newSlide: StorySlideItem = {
      id: `slide-${Date.now()}`,
      imageIndex: newIdx % (imageUrlsPool.length || 1),
      kicker: "ÖZEL DETAY",
      headline: "YENİ AVANTAJ & ÖZELLİK",
      subtitle: "Ürünün öne çıkan pratik kullanım detayları",
      badge: "Sınırlı Stok",
      motion: 'zoom_in'
    };
    setSlides(prev => [...prev, newSlide]);
    setActiveSlideIndex(newIdx);
    setIsPlayingVideo(false);
  };

  const handleDeleteSlide = (indexToDelete: number) => {
    if (slides.length <= 1) return;
    setSlides(prev => prev.filter((_, idx) => idx !== indexToDelete));
    if (activeSlideIndex >= indexToDelete && activeSlideIndex > 0) {
      setActiveSlideIndex(prev => prev - 1);
    }
  };

  const handleMoveSlide = (fromIndex: number, direction: 'left' | 'right') => {
    const toIndex = direction === 'left' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= slides.length) return;
    setSlides(prev => {
      const next = [...prev];
      const temp = next[fromIndex];
      next[fromIndex] = next[toIndex];
      next[toIndex] = temp;
      return next;
    });
    setActiveSlideIndex(toIndex);
  };

  // Handle local extra image upload for multi-image pool
  const handleAddLocalImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        if (dataUrl) {
          setImageUrlsPool((prev) => [...prev, dataUrl]);
          // Also assign newly uploaded image to currently active slide!
          handleUpdateActiveSlide({
            imageIndex: imageUrlsPool.length // points to the new image
          });
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // Poster Config Builder
  const posterConfig: PosterConfig = useMemo(() => {
    const currentSlide = slides[activeSlideIndex] || slides[0];
    return {
      aspectRatio: selectedRatio,
      template: selectedTheme,
      slides,
      activeSlideIndex,
      focalZoom,
      imageFitMode,
      storeName: storeName || "Seçkin Mağaza",
      kicker: currentSlide?.kicker || "ÖZEL SENARYO",
      headline: currentSlide?.headline || product?.name || "GERÇEK DENEYİM",
      badge: currentSlide?.badge || (discountPercentage > 0 ? `%${discountPercentage} İndirim` : "Orijinal Garanti"),
      title: product?.name || "Seçkin Ürün",
      price: priceText,
      oldPrice: oldPriceText,
      currencySymbol,
      imageElement: loadedImageElements[currentSlide?.imageIndex || 0] || loadedImageElements[0] || null,
      imageElements: loadedImageElements,
      brand: product?.brand || "",
      category: product?.category || "Genel Ürün",
      phone: branding?.phone || branding?.whatsapp_number || ""
    };
  }, [
    selectedRatio,
    selectedTheme,
    slides,
    activeSlideIndex,
    focalZoom,
    imageFitMode,
    storeName,
    product,
    discountPercentage,
    priceText,
    oldPriceText,
    currencySymbol,
    loadedImageElements,
    branding
  ]);

  // Render canvas
  const redrawCanvas = useCallback((progress?: number) => {
    if (canvasRef.current) {
      renderPosterToCanvas(canvasRef.current, {
        ...posterConfig,
        animationProgress: progress
      });
    }
  }, [posterConfig]);

  useEffect(() => {
    if (!isPlayingVideo || outputMode === 'image') {
      redrawCanvas(undefined);
    }
  }, [posterConfig, isPlayingVideo, outputMode, redrawCanvas]);

  // Multi-Slide Story Video Reel Loop (2 seconds per slide)
  useEffect(() => {
    if (isPlayingVideo && outputMode === 'video' && slides.length > 0) {
      const slideDuration = 2000; // 2 seconds per slide
      const totalDuration = slides.length * slideDuration;

      const loop = (timestamp: number) => {
        if (!animationStartTimeRef.current) animationStartTimeRef.current = timestamp;
        const elapsed = (timestamp - animationStartTimeRef.current) % totalDuration;
        const progress = Math.max(0.001, elapsed / totalDuration);
        setVideoProgress(progress);
        redrawCanvas(progress);

        // Keep activeSlideIndex in sync with video progress for active UI indicator
        const currentIdx = Math.min(slides.length - 1, Math.floor(progress * slides.length));
        setActiveSlideIndex(currentIdx);

        animationFrameRef.current = requestAnimationFrame(loop);
      };

      animationFrameRef.current = requestAnimationFrame(loop);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      animationStartTimeRef.current = null;
      setVideoProgress(0);
      redrawCanvas(undefined);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlayingVideo, outputMode, slides.length, redrawCanvas]);

  // Download Current Active Slide as High-Res 1080p PNG Poster
  const handleDownloadImage = async () => {
    if (!canvasRef.current) return;
    setIsDownloadingImage(true);
    try {
      renderPosterToCanvas(canvasRef.current, {
        ...posterConfig,
        animationProgress: undefined
      });
      const activeSlide = slides[activeSlideIndex];
      const filename = `${storeName.replace(/\s+/g, '_')}_${(product?.name || 'urun').replace(/[^a-zA-Z0-9]/g, '_')}_Slayt_${activeSlideIndex + 1}_1080p.png`;
      await downloadPosterImage(canvasRef.current, filename);
    } catch (err) {
      console.error("Download image error:", err);
    } finally {
      setIsDownloadingImage(false);
    }
  };

  // Download Multi-Slide Storyboard Video Reel (.MP4 — Instagram, WhatsApp & TikTok Ready)
  const handleDownloadVideo = async () => {
    setIsExportingVideo(true);
    setExportProgress(0);
    try {
      const videoBlob = await recordPosterReel(posterConfig, (percent) => {
        setExportProgress(percent);
      });

      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${storeName.replace(/\s+/g, '_')}_${(product?.name || 'reel').replace(/[^a-zA-Z0-9]/g, '_')}_Instagram_Reels.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Video export error:", err);
    } finally {
      setIsExportingVideo(false);
      setExportProgress(0);
    }
  };

  const handleCopyCaption = () => {
    if (!captionText) return;
    navigator.clipboard.writeText(captionText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  if (!isOpen) return null;

  const activeSlide = slides[activeSlideIndex] || slides[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xl animate-fade-in overflow-hidden">
      <div className="relative w-full max-w-6xl max-h-[96vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-white overflow-hidden">
        
        {/* COMPACT MODAL HEADER */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
              <Film className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight truncate">
                  AI Slayt & Video Reklam Stüdyosu
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider hidden sm:inline-block">
                  {slides.length} Slaytlı Kurgu
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {product?.name} • {storeName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MOBILE NAVIGATION TABS */}
        <div className="lg:hidden flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-2 py-1.5 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab('stage')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mobileTab === 'stage'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Önizleme</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileTab('slides');
              setRightTab('slides');
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mobileTab === 'slides'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Slayt Editörü</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileTab('caption');
              setRightTab('caption');
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mobileTab === 'caption'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Metin</span>
          </button>
        </div>

        {/* MAIN DUAL-COLUMN WORKSPACE (SINGLE UNIFIED SCROLL CONTEXT - NO DOUBLE SCROLLBARS) */}
        <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 sm:p-4 pb-24 sm:pb-4 items-start">
          
          {/* LEFT COLUMN: LIVE STAGE PREVIEW, TIMELINE SCRUBBER & EXPORT (7 COLS) */}
          <div className={`lg:col-span-7 flex flex-col justify-between space-y-2.5 ${mobileTab !== 'stage' ? 'hidden lg:flex' : 'flex'}`}>
            
            {/* TOP TOOLBAR: OUTPUT MODE + ASPECT RATIO */}
            <div className="w-full flex items-center justify-between gap-2 bg-slate-950/70 p-2 rounded-2xl border border-slate-800">
              <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setOutputMode('video');
                    setIsPlayingVideo(true);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    outputMode === 'video'
                      ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Slayt Video (Reels)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOutputMode('image');
                    setIsPlayingVideo(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    outputMode === 'image'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Tek Slayt Afişi</span>
                </button>
              </div>

              {/* Aspect Ratio Switcher */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedRatio('square')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    selectedRatio === 'square'
                      ? 'bg-slate-800 text-white border-indigo-500'
                      : 'bg-slate-900/80 text-slate-400 border-slate-800'
                  }`}
                  title="Kare 1:1 (1080x1080)"
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>1:1</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRatio('story')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    selectedRatio === 'story'
                      ? 'bg-slate-800 text-white border-indigo-500'
                      : 'bg-slate-900/80 text-slate-400 border-slate-800'
                  }`}
                  title="Dikey Story/Reels 9:16 (1080x1920)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>9:16</span>
                </button>
              </div>
            </div>

            {/* HIGH-RES CANVAS PREVIEW STAGE */}
            <div className="relative w-full flex items-center justify-center p-2 rounded-2xl bg-black/60 border border-slate-800/90 min-h-[240px] sm:min-h-[320px] max-h-[390px] overflow-hidden">
              <div 
                className="relative shadow-2xl transition-all duration-300 rounded-xl overflow-hidden max-w-full"
                style={{
                  width: selectedRatio === 'story' ? 'min(220px, 62vw)' : 'min(340px, 82vw)',
                  height: selectedRatio === 'story' ? 'min(370px, 44vh)' : 'min(340px, 44vh)',
                  maxHeight: '370px'
                }}
              >
                <canvas
                  ref={canvasRef}
                  className="w-full h-full object-contain rounded-xl select-none"
                />

                {/* Active Slide Pill */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 text-[10px] font-bold text-white shadow-lg">
                  <span className={`w-2 h-2 rounded-full ${outputMode === 'video' ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400'}`} />
                  <span>
                    SLAYT {activeSlideIndex + 1} / {slides.length}
                  </span>
                </div>
              </div>

              {/* Video Playback Scrubber & Scene Bar */}
              {outputMode === 'video' && slides.length > 0 && (
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-950/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-800 shadow-xl">
                  <button
                    type="button"
                    onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                    className="p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer"
                  >
                    {isPlayingVideo ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlayingVideo(false);
                      setTimeout(() => setIsPlayingVideo(true), 40);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-32 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full transition-all duration-75"
                      style={{ width: `${Math.round(videoProgress * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-300">
                    {(videoProgress * slides.length * 2).toFixed(1)}s / {(slides.length * 2)}s
                  </span>
                </div>
              )}
            </div>

            {/* DOWNLOAD & EXPORT BUTTONS */}
            <div className="w-full flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleDownloadVideo}
                disabled={isExportingVideo}
                className="flex-1 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Video className="w-4 h-4" />
                <span>
                  {isExportingVideo 
                    ? `MP4 Video Hazırlanıyor (%${exportProgress})...` 
                    : `Slayt Videosunu İndir (MP4 • ${slides.length * 2}s)`}
                </span>
              </button>

              <button
                type="button"
                onClick={handleDownloadImage}
                disabled={isDownloadingImage}
                className="py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-slate-900" />
                <span>Bu Slaytı Afiş İndir (PNG)</span>
              </button>
            </div>

            {/* QUICK CAPTION COPY BAR */}
            <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/90 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-lg">
              <div className="flex-1 min-w-0 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
                  <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">Sektörel Paylaşım Metni & Hashtagler:</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {captionText || "Ürüne özel hazır satış metni..."}
                </p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={handleCopyCaption}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copySuccess ? "Kopyalandı!" : "Metni Kopyala"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: SLIDE TIMELINE & INTERACTIVE SLIDE INSPECTOR (5 COLS - NO NESTED SCROLLBAR) */}
          <div className={`lg:col-span-5 min-w-0 flex flex-col space-y-2.5 bg-slate-950/50 p-3 rounded-2xl border border-slate-800 ${mobileTab === 'stage' ? 'hidden lg:flex' : 'flex'}`}>
            
            {/* RIGHT PANEL NAVIGATION TABS */}
            <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setRightTab('slides');
                  setMobileTab('slides');
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  rightTab === 'slides'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Slayt Editörü ({slides.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRightTab('design');
                  setMobileTab('design');
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  rightTab === 'design'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Şablon & Tema</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRightTab('caption');
                  setMobileTab('caption');
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  rightTab === 'caption'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Hazır Metin</span>
              </button>
            </div>

            {/* TAB 1: INTERACTIVE SLIDE DECK & ACTIVE SLIDE INSPECTOR */}
            {rightTab === 'slides' && (
              <div className="space-y-2.5 min-w-0">
                
                {/* 4-COLUMN FULL-VISIBILITY SLIDE TIMELINE / SELECTOR (ZERO HIDDEN SLIDES) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <span>Slayt Akışı</span>
                      <span className="text-cyan-400">({activeSlideIndex + 1}/{slides.length})</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleAddSlide}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 text-[10px] font-bold cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Slayt Ekle</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {slides.map((s, idx) => {
                      const isSelected = activeSlideIndex === idx;
                      const thumbUrl = imageUrlsPool[s.imageIndex] || imageUrlsPool[0];
                      return (
                        <button
                          key={s.id || idx}
                          type="button"
                          onClick={() => {
                            setActiveSlideIndex(idx);
                            setIsPlayingVideo(false);
                          }}
                          className={`flex items-center gap-1.5 p-1.5 rounded-xl border transition-all cursor-pointer min-w-0 text-left ${
                            isSelected
                              ? 'bg-slate-800 border-cyan-400 ring-1 ring-cyan-500/40 shadow-md'
                              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="w-7 h-7 rounded-lg bg-slate-950 overflow-hidden shrink-0 border border-slate-700">
                            {thumbUrl && <img src={thumbUrl} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-extrabold text-white flex items-center justify-between gap-1 leading-tight">
                              <span className="truncate">Slayt {idx + 1}</span>
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />}
                            </div>
                            <div className="text-[9px] text-slate-400 truncate leading-tight mt-0.5">
                              {s.kicker || s.headline}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ACTIVE SLIDE INSPECTOR (EDIT SELECTED SLIDE) */}
                {activeSlide && (
                  <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                      <span className="text-xs font-extrabold text-cyan-300 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Slayt {activeSlideIndex + 1} Detayları</span>
                      </span>

                      {/* Slide Reorder & Delete */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveSlide(activeSlideIndex, 'left')}
                          disabled={activeSlideIndex === 0}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
                          title="Sola Taşı"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveSlide(activeSlideIndex, 'right')}
                          disabled={activeSlideIndex === slides.length - 1}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
                          title="Sağa Taşı"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                        {slides.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSlide(activeSlideIndex)}
                            className="p-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 cursor-pointer"
                            title="Bu Slaytı Sil"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Image Assignment for this Slide (Flex-Wrap for 100% Visibility) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">
                          Slayt Görselini Seç ({imageUrlsPool.length} Görsel)
                        </label>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-2.5 h-2.5" /> Görsel Ekle
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleAddLocalImage}
                          className="hidden"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {imageUrlsPool.map((url, imgIdx) => {
                          const isAssigned = activeSlide.imageIndex === imgIdx;
                          return (
                            <button
                              key={imgIdx}
                              type="button"
                              onClick={() => handleUpdateActiveSlide({ imageIndex: imgIdx })}
                              className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer relative ${
                                isAssigned
                                  ? 'border-cyan-400 ring-2 ring-cyan-500/30 scale-105'
                                  : 'border-slate-800 opacity-60 hover:opacity-100'
                              }`}
                            >
                              <img src={url} alt="" className="w-full h-full object-cover" />
                              {isAssigned && (
                                <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center">
                                  <Check className="w-3.5 h-3.5 text-cyan-300 stroke-[3]" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Compact Headline & Kicker Inputs */}
                    <div className="space-y-1.5">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <div className="sm:col-span-5">
                          <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Üst Kanca / Slogan</label>
                          <input
                            type="text"
                            value={activeSlide.kicker}
                            onChange={(e) => handleUpdateActiveSlide({ kicker: e.target.value })}
                            placeholder="Örn: GÜNÜN FIRSATI"
                            className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                          />
                        </div>

                        <div className="sm:col-span-7">
                          <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Büyük Vurucu Başlık</label>
                          <input
                            type="text"
                            value={activeSlide.headline}
                            onChange={(e) => handleUpdateActiveSlide({ headline: e.target.value })}
                            placeholder="Örn: TERMO İZOLASYON & GENİŞ HACİM"
                            className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Açıklama / Fayda Metni</label>
                        <textarea
                          rows={2}
                          value={activeSlide.subtitle}
                          onChange={(e) => handleUpdateActiveSlide({ subtitle: e.target.value })}
                          placeholder="Örn: Yiyecek ve içeceklerinizi saatlerce ilk tazeliğinde muhafaza edin"
                          className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Kampanya / Rozet</label>
                          <input
                            type="text"
                            value={activeSlide.badge}
                            onChange={(e) => handleUpdateActiveSlide({ badge: e.target.value })}
                            placeholder="Örn: %25 İNDİRİM"
                            className="w-full px-2 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-amber-300 font-semibold focus:outline-none focus:border-cyan-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Hareket Efekti</label>
                          <select
                            value={activeSlide.motion}
                            onChange={(e) => handleUpdateActiveSlide({ motion: e.target.value as MotionEffect })}
                            className="w-full px-2 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                          >
                            <option value="zoom_in">Yavaşça Yakınlaş (Zoom In)</option>
                            <option value="zoom_out">Geniş Açıya Açıl (Zoom Out)</option>
                            <option value="pan_right">Yana Dinamik Kaydır (Pan)</option>
                            <option value="pulse">Dinamik Odak (Pulse)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI RE-GENERATE SLIDES PROMPT BOX */}
                <div className="p-2.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>AI ile Slaytları Yeniden Kurgula</span>
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customSlidePrompt}
                      onChange={(e) => setCustomSlidePrompt(e.target.value)}
                      placeholder="Örn: Masaüstü ofis kurgusu / Piknik ve tatil..."
                      className="flex-1 min-w-0 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleGenerateStorySlides(customSlidePrompt)}
                      disabled={isGeneratingSlides}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                    >
                      <Wand2 className={`w-3.5 h-3.5 ${isGeneratingSlides ? 'animate-spin' : ''}`} />
                      <span>{isGeneratingSlides ? "Kurgulanıyor..." : "Yeniden Üret"}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Gemini AI, ürünün gerçek resimlerine ve özelliklerine göre dikkat çeken {slides.length} sahnelik satış hikayesini otomatik kurgular.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: TEMPLATE & THEME SETTINGS */}
            {rightTab === 'design' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Görsel Tema & Renk Atmosferi
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'futuristic_studio', label: 'Fütüristik Stüdyo', desc: 'Koyu neon & siber mavi' },
                      { id: 'modern_commerce', label: 'Modern Ticaret', desc: 'Açık & minimal kurumsal' },
                      { id: 'luxury_editorial', label: 'Lüks Editoryal', desc: 'Premium altın & antrasit' },
                      { id: 'vibrant_sale', label: 'Dinamik İndirim', desc: 'Sıcak günbatımı & kampanya' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTheme(t.id as TemplateTheme)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedTheme === t.id
                            ? 'bg-slate-800 border-cyan-500 text-white ring-1 ring-cyan-500/30'
                            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold text-white">{t.label}</div>
                        <div className="text-[10px] text-slate-400">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Focal Zoom */}
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300">Merkez Ürün Yakınlaştırma (Focal Zoom)</span>
                    <span className="font-mono text-cyan-400 font-bold">{focalZoom.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.85"
                    max="1.35"
                    step="0.05"
                    value={focalZoom}
                    onChange={(e) => setFocalZoom(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: AI CAPTION GENERATOR */}
            {rightTab === 'caption' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Metin Tonu
                  </span>
                  <div className="flex items-center gap-1">
                    {(['promo', 'luxury', 'futuristic', 'friendly'] as CaptionTone[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setSelectedTone(t);
                          handleGenerateCaption(t);
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                          selectedTone === t
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        {t === 'promo' ? 'Fırsat' : t === 'luxury' ? 'Lüks' : t === 'futuristic' ? 'Vizyon' : 'Samimi'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    rows={9}
                    value={captionText}
                    onChange={(e) => setCaptionText(e.target.value)}
                    placeholder="Sektörel paylaşım metni ve hashtagler..."
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-indigo-500 resize-none font-sans"
                  />
                  {isGeneratingCaption && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center rounded-2xl">
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sektörel Metin Yazılıyor...</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleGenerateCaption(selectedTone)}
                    disabled={isGeneratingCaption}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingCaption ? 'animate-spin' : ''}`} />
                    <span>Yeniden Yaz</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyCaption}
                    className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copySuccess ? "Kopyalandı!" : "Metni Kopyala"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
