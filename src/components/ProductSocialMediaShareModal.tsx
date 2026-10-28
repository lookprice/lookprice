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
  Palette, 
  Sliders, 
  FileText,
  Wand2,
  Layers,
  Focus,
  Plus,
  Monitor,
  User,
  Package,
  Film,
  CheckCircle2
} from "lucide-react";
import { Product } from "../types";
import { 
  PosterConfig, 
  SceneType,
  CollageLayout,
  ImageFitMode,
  StorySceneItem,
  loadPosterImage, 
  renderPosterToCanvas, 
  downloadPosterImage, 
  recordPosterReel,
  createContextualSceneDataUrl
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

interface ScenarioOption {
  id: string;
  title: string;
  description: string;
  sceneType: SceneType;
  kicker: string;
  headline: string;
  badge: string;
  storyScenes: StorySceneItem[];
  aiPrompt?: string;
}

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
  const [outputMode, setOutputMode] = useState<'image' | 'video'>('image');
  const [selectedTheme, setSelectedTheme] = useState<TemplateTheme>('futuristic_studio');
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('square');
  const [selectedTone, setSelectedTone] = useState<CaptionTone>('promo');
  const [rightTab, setRightTab] = useState<'scenario' | 'collage' | 'caption'>('scenario');

  // Segment & Scenario Imagination States
  const [segmentLabel, setSegmentLabel] = useState<string>("Ürün Segmenti Analiz Ediliyor...");
  const [scenarios, setScenarios] = useState<ScenarioOption[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string>("");
  const [sceneType, setSceneType] = useState<SceneType>('desk_setup');
  const [scenarioTitle, setScenarioTitle] = useState<string>("");
  const [scenarioDescription, setScenarioDescription] = useState<string>("");
  const [storyScenes, setStoryScenes] = useState<StorySceneItem[]>([]);
  const [customScenarioIdea, setCustomScenarioIdea] = useState<string>("");
  const [isAnalyzingSegment, setIsAnalyzingSegment] = useState<boolean>(false);
  const [isGeneratingAiScene, setIsGeneratingAiScene] = useState<boolean>(false);

  // Multi-Image & Collage Center-Focus States
  const [imageUrlsPool, setImageUrlsPool] = useState<string[]>([]);
  const [selectedImageUrls, setSelectedImageUrls] = useState<string[]>([]);
  const [loadedImageElements, setLoadedImageElements] = useState<HTMLImageElement[]>([]);
  const [collageLayout, setCollageLayout] = useState<CollageLayout>('single');
  const [imageFitMode, setImageFitMode] = useState<ImageFitMode>('smart_center');
  const [focalZoom, setFocalZoom] = useState<number>(1.0);

  // Campaign Copy States
  const [kicker, setKicker] = useState<string>("MASANIZDA YENİ NESİL GÜÇ");
  const [headline, setHeadline] = useState<string>("MAKSİMUM PERFORMANS");
  const [badge, setBadge] = useState<string>("Orijinal Garanti & Aynı Gün Hızlı Kargo");

  // AI Caption States
  const [captionText, setCaptionText] = useState<string>("");
  const [isGeneratingCaption, setIsGeneratingCaption] = useState<boolean>(false);

  // Video / Storyboard Reel States
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(false);
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [isExportingVideo, setIsExportingVideo] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [aiGeneratedVideoUrl, setAiGeneratedVideoUrl] = useState<string | null>(null);
  const [isGeneratingAiVideo, setIsGeneratingAiVideo] = useState<boolean>(false);

  // Utility States
  const [copySuccess, setCopySuccess] = useState(false);
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
    setSelectedImageUrls(urls.slice(0, 4));
    // If product has multiple images, default collage layout to 3-image or 2-image showcase!
    if (urls.length >= 3) {
      setCollageLayout('collage_3');
    } else if (urls.length === 2) {
      setCollageLayout('collage_2');
    } else {
      setCollageLayout('single');
    }
  }, [product]);

  // 2. Load HTMLImageElements for all selected image URLs
  useEffect(() => {
    let active = true;
    if (selectedImageUrls.length === 0) {
      setLoadedImageElements([]);
      return;
    }

    Promise.all(
      selectedImageUrls.map((url) =>
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
  }, [selectedImageUrls]);

  // Apply a selected scenario option
  const applyScenario = useCallback((scen: ScenarioOption) => {
    setActiveScenarioId(scen.id);
    setSceneType(scen.sceneType || 'desk_setup');
    setScenarioTitle(scen.title);
    setScenarioDescription(scen.description);
    setKicker(scen.kicker || "ÖZEL SENARYO");
    setHeadline(discountPercentage > 0 ? `%${discountPercentage} İNDİRİM` : (scen.headline || "GERÇEK DENEYİM"));
    setBadge(scen.badge || "Aynı Gün Kargo & Orijinal Garanti");
    if (Array.isArray(scen.storyScenes) && scen.storyScenes.length > 0) {
      setStoryScenes(scen.storyScenes);
    }
  }, [discountPercentage]);

  // 3. Analyze Product Segment & Fetch Tailored Scenarios
  const handleAnalyzeSegment = useCallback(async (customIdeaStr: string = "") => {
    if (!product) return;
    setIsAnalyzingSegment(true);
    try {
      const res = await fetch("/api/ai-social/analyze-segment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: product.name,
          category: product.category,
          brand: product.brand,
          customIdea: customIdeaStr
        })
      });
      const data = await res.json();
      if (data.segmentLabel) setSegmentLabel(data.segmentLabel);
      if (Array.isArray(data.scenarios) && data.scenarios.length > 0) {
        setScenarios(data.scenarios);
        applyScenario(data.scenarios[0]);
      }
    } catch (e) {
      console.error("Segment analyze error:", e);
    } finally {
      setIsAnalyzingSegment(false);
    }
  }, [product, applyScenario]);

  // Generate AI Scene Image (Places the product into the chosen scenario & adds to multi-image pool)
  const handleGenerateAiSceneImage = async () => {
    if (loadedImageElements.length === 0) return;
    setIsGeneratingAiScene(true);
    try {
      const activeScen = scenarios.find((s) => s.id === activeScenarioId);
      const customOrScenTitle = customScenarioIdea.trim() || scenarioTitle || "Gerçek Yaşam Senaryosu";
      const targetSceneType: SceneType = customScenarioIdea.trim()
        ? (customScenarioIdea.toLowerCase().includes("dolap") || customScenarioIdea.toLowerCase().includes("raf")
            ? "closet_organizer"
            : customScenarioIdea.toLowerCase().includes("insan") || customScenarioIdea.toLowerCase().includes("kullanıcı") || customScenarioIdea.toLowerCase().includes("üzerinde")
            ? "user_lifestyle"
            : "desk_setup")
        : sceneType;

      // If user typed a custom scenario, also enrich the storyboard
      if (customScenarioIdea.trim().length > 2) {
        await handleAnalyzeSegment(customScenarioIdea.trim());
      }

      const res = await fetch("/api/ai-social/generate-scene-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: selectedImageUrls[0],
          title: product?.name,
          scenarioTitle: customOrScenTitle,
          scenarioPrompt: activeScen?.aiPrompt || customOrScenTitle,
          sceneType: targetSceneType
        })
      });

      const data = await res.json();
      let newSceneUrl = data.generatedImageUrl;

      if (!newSceneUrl && loadedImageElements[0]) {
        // Generate high-res 1080p contextual stage variant via procedural compositor
        newSceneUrl = createContextualSceneDataUrl(
          loadedImageElements[0],
          targetSceneType,
          customOrScenTitle
        );
      }

      if (newSceneUrl) {
        setImageUrlsPool((prev) => [newSceneUrl, ...prev]);
        setSelectedImageUrls((prev) => {
          const next = [newSceneUrl, ...prev].slice(0, 4);
          if (next.length >= 2 && collageLayout === 'single') {
            setCollageLayout('collage_2');
          }
          return next;
        });
      }
    } catch (e) {
      console.error("Scene generation error:", e);
    } finally {
      setIsGeneratingAiScene(false);
    }
  };

  // Handle local extra image upload for multi-image collage/video
  const handleAddLocalImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        if (dataUrl) {
          setImageUrlsPool((prev) => [...prev, dataUrl]);
          setSelectedImageUrls((prev) => {
            const next = [...prev, dataUrl].slice(0, 4);
            if (next.length === 2) setCollageLayout('collage_2');
            else if (next.length === 3) setCollageLayout('collage_3');
            else if (next.length >= 4) setCollageLayout('collage_4');
            return next;
          });
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // Generate AI Social Caption
  const handleGenerateCaption = useCallback(async (toneToUse: CaptionTone = selectedTone) => {
    if (!product) return;
    setIsGeneratingCaption(true);
    try {
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
          campaignBadge: badge,
          scenarioTitle,
          scenarioDescription
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
  }, [product, oldPriceText, storeName, branding, selectedTone, badge, scenarioTitle, scenarioDescription]);

  // Initial load when modal opens
  useEffect(() => {
    if (isOpen && product) {
      handleAnalyzeSegment("");
      handleGenerateCaption('promo');
    }
  }, [isOpen, product?.id]);

  // Poster Config Builder
  const posterConfig: PosterConfig = useMemo(() => {
    return {
      aspectRatio: selectedRatio,
      template: selectedTheme,
      sceneType,
      collageLayout,
      imageFitMode,
      focalZoom,
      storeName: storeName || "Seçkin Mağaza",
      kicker: kicker.trim() || "ÖZEL SENARYO",
      headline: headline.trim() || "GERÇEK DENEYİM",
      badge: badge.trim(),
      title: product?.name || "Seçkin Ürün",
      price: priceText,
      oldPrice: oldPriceText,
      currencySymbol,
      imageElement: loadedImageElements[0] || null,
      imageElements: loadedImageElements,
      brand: product?.brand || "",
      category: product?.category || "Genel Ürün",
      phone: branding?.phone || branding?.whatsapp_number || "",
      scenarioTitle,
      scenarioDescription,
      storyScenes
    };
  }, [
    selectedRatio,
    selectedTheme,
    sceneType,
    collageLayout,
    imageFitMode,
    focalZoom,
    storeName,
    kicker,
    headline,
    badge,
    product,
    priceText,
    oldPriceText,
    currencySymbol,
    loadedImageElements,
    branding,
    scenarioTitle,
    scenarioDescription,
    storyScenes
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
    if (!isPlayingVideo) {
      redrawCanvas(outputMode === 'video' ? 0.01 : undefined);
    }
  }, [posterConfig, isPlayingVideo, outputMode, redrawCanvas]);

  // 6-Second 4-Scene Storyboard Video Loop
  useEffect(() => {
    if (isPlayingVideo && outputMode === 'video') {
      const duration = 6000; // 6 second multi-scene storyboard loop

      const loop = (timestamp: number) => {
        if (!animationStartTimeRef.current) animationStartTimeRef.current = timestamp;
        const elapsed = (timestamp - animationStartTimeRef.current) % duration;
        const progress = Math.max(0.001, elapsed / duration);
        setVideoProgress(progress);
        redrawCanvas(progress);
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
      redrawCanvas(outputMode === 'video' ? 0.01 : undefined);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlayingVideo, outputMode, redrawCanvas]);

  // Download High-Res 1080p PNG
  const handleDownloadImage = async () => {
    if (!canvasRef.current) return;
    setIsDownloadingImage(true);
    try {
      // Ensure static poster render before snapshot
      renderPosterToCanvas(canvasRef.current, {
        ...posterConfig,
        animationProgress: undefined
      });
      const filename = `${storeName.replace(/\s+/g, '_')}_${(product?.name || 'urun').replace(/[^a-zA-Z0-9]/g, '_')}_${collageLayout}_1080p.png`;
      await downloadPosterImage(canvasRef.current, filename);
    } catch (err) {
      console.error("Download image error:", err);
    } finally {
      setIsDownloadingImage(false);
    }
  };

  // Download 6s Multi-Scene Storyboard Video Reel
  const handleDownloadVideo = async () => {
    setIsExportingVideo(true);
    setExportProgress(0);
    try {
      if (aiGeneratedVideoUrl) {
        const a = document.createElement('a');
        a.href = aiGeneratedVideoUrl;
        a.download = `${storeName.replace(/\s+/g, '_')}_${(product?.name || 'reel').replace(/[^a-zA-Z0-9]/g, '_')}_AI_Reel.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      const videoBlob = await recordPosterReel(posterConfig, (percent) => {
        setExportProgress(percent);
      });

      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${storeName.replace(/\s+/g, '_')}_${(product?.name || 'reel').replace(/[^a-zA-Z0-9]/g, '_')}_Senaryo_Reel.webm`;
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

  // Trigger Google AI Omni Video Generation
  const handleGenerateOmniVideo = async () => {
    setIsGeneratingAiVideo(true);
    setOutputMode('video');
    try {
      const activeScen = scenarios.find((s) => s.id === activeScenarioId);
      const res = await fetch("/api/ai-social/generate-ai-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrls: selectedImageUrls,
          title: product?.name,
          scenarioPrompt: activeScen?.aiPrompt || `${scenarioTitle}: ${scenarioDescription}`,
          aspectRatio: selectedRatio
        })
      });
      const data = await res.json();
      if (data.videoDataUrl) {
        setAiGeneratedVideoUrl(data.videoDataUrl);
      } else {
        setIsPlayingVideo(true);
      }
    } catch (e) {
      setIsPlayingVideo(true);
    } finally {
      setIsGeneratingAiVideo(false);
    }
  };

  const toggleImageSelection = (url: string) => {
    setSelectedImageUrls((prev) => {
      if (prev.includes(url)) {
        if (prev.length <= 1) return prev; // keep at least 1
        return prev.filter((u) => u !== url);
      }
      return [...prev, url].slice(0, 4);
    });
  };

  const handleCopyCaption = () => {
    if (!captionText) return;
    navigator.clipboard.writeText(captionText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[94vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* TOP HEADER */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold tracking-tight text-white">
                  AI Ürün Senaryolaştırma, Çoklu Kolaj & Video Stüdyosu
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  {segmentLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                {product?.name} — Ürünün segmentine göre gerçek yaşam senaryosu, merkez odaklı kolaj ve çok sahneli video üretimi
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MAIN DUAL-COLUMN WORKSPACE */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-5 p-4 sm:p-5">
          
          {/* LEFT COLUMN: LIVE STAGE PREVIEW, COLLAGE BAR & EXPORT (7 COLS) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-3.5">
            
            {/* TOP TOOLBAR: MODE + COLLAGE LAYOUT + ASPECT RATIO */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2 bg-slate-950/70 p-2 rounded-2xl border border-slate-800">
              
              {/* Output Mode Switcher */}
              <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setOutputMode('image');
                    setIsPlayingVideo(false);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    outputMode === 'image'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Senaryo & Kolaj Afiş</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOutputMode('video');
                    setIsPlayingVideo(true);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    outputMode === 'video'
                      ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>4 Sahneli Senaryo Video</span>
                </button>
              </div>

              {/* Quick Collage Layout Selector */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                {(
                  [
                    { id: 'single', label: 'Tekli Sahne' },
                    { id: 'collage_2', label: "2'li Kolaj" },
                    { id: 'collage_3', label: "3'lü Bento" },
                    { id: 'collage_4', label: "4'lü Odak" }
                  ] as Array<{ id: CollageLayout; label: string }>
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCollageLayout(item.id)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      collageLayout === item.id
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
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

            {/* HIGH-RES CANVAS / VIDEO PREVIEW STAGE */}
            <div className="relative w-full flex-1 flex items-center justify-center p-3 rounded-2xl bg-black/50 border border-slate-800/90 min-h-[370px] sm:min-h-[420px] max-h-[490px] overflow-hidden">
              {aiGeneratedVideoUrl && outputMode === 'video' ? (
                <video
                  src={aiGeneratedVideoUrl}
                  controls
                  autoPlay
                  loop
                  className="max-h-[440px] rounded-xl shadow-2xl border border-slate-700"
                />
              ) : (
                <div 
                  className="relative shadow-2xl transition-all duration-300 rounded-xl overflow-hidden"
                  style={{
                    width: selectedRatio === 'story' ? '265px' : '410px',
                    height: selectedRatio === 'story' ? '470px' : '410px',
                    maxHeight: '470px'
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full object-contain rounded-xl select-none"
                  />

                  {/* Active Mode Indicator Pill */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 text-[10px] font-bold text-white shadow-lg">
                    <span className={`w-2 h-2 rounded-full ${outputMode === 'video' ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400'}`} />
                    <span>
                      {outputMode === 'video'
                        ? `4 SAHNELİ SENARYO REEL (${Math.min(4, Math.floor(videoProgress * 4) + 1)}/4)`
                        : 'MERKEZ ODAKLI 1080P'}
                    </span>
                  </div>
                </div>
              )}

              {/* Video Playback Scrubber & Scene Bar */}
              {outputMode === 'video' && !aiGeneratedVideoUrl && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2.5 bg-slate-950/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-800 shadow-xl">
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
                  <div className="w-36 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full transition-all duration-75"
                      style={{ width: `${Math.round(videoProgress * 100)}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-slate-300">
                    {(videoProgress * 6).toFixed(1)}s / 6.0s
                  </span>
                </div>
              )}
            </div>

            {/* ENVIRONMENT SCENE & ATMOSPHERE BAR */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setSceneType('desk_setup')}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                  sceneType === 'desk_setup'
                    ? 'bg-slate-800 border-cyan-500 text-white ring-1 ring-cyan-500/30'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Monitor className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <div className="text-[11px] font-bold text-white">Ofis / Masaüstü</div>
                  <div className="text-[9px] text-slate-400">Masa kurulum sahnesi</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSceneType('user_lifestyle')}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                  sceneType === 'user_lifestyle'
                    ? 'bg-slate-800 border-purple-500 text-white ring-1 ring-purple-500/30'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <User className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <div className="text-[11px] font-bold text-white">Kullanıcı Üzerinde</div>
                  <div className="text-[9px] text-slate-400">Canlı deneyim kurgusu</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSceneType('closet_organizer')}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                  sceneType === 'closet_organizer'
                    ? 'bg-slate-800 border-amber-500 text-white ring-1 ring-amber-500/30'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Package className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="text-[11px] font-bold text-white">Dolap / Ev İçi</div>
                  <div className="text-[9px] text-slate-400">Raf & yerleşim sahnesi</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSceneType('studio_macro')}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                  sceneType === 'studio_macro'
                    ? 'bg-slate-800 border-emerald-500 text-white ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Focus className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[11px] font-bold text-white">Stüdyo Makro</div>
                  <div className="text-[9px] text-slate-400">Merkez doku & odak</div>
                </div>
              </button>
            </div>

            {/* DOWNLOAD & EXPORT BUTTONS */}
            <div className="w-full flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleDownloadImage}
                disabled={isDownloadingImage}
                className="flex-1 py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-slate-900" />
                <span>{isDownloadingImage ? "Hazırlanıyor..." : "Merkez Odaklı Afiş / Kolaj İndir (PNG)"}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadVideo}
                disabled={isExportingVideo}
                className="flex-1 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Video className="w-4 h-4" />
                <span>
                  {isExportingVideo 
                    ? `4 Sahneli Video Kaydediliyor (%${exportProgress})...` 
                    : "Çok Sahneli Senaryo Videosu İndir"}
                </span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: SEGMENT SCENARIO IMAGINATION, MULTI-IMAGE COLLAGE & AI CAPTION (5 COLS) */}
          <div className="lg:col-span-5 flex flex-col space-y-4 bg-slate-950/50 p-4 rounded-3xl border border-slate-800">
            
            {/* RIGHT PANEL NAVIGATION TABS */}
            <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-1 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setRightTab('scenario')}
                className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  rightTab === 'scenario'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>AI Senaryo</span>
              </button>

              <button
                type="button"
                onClick={() => setRightTab('collage')}
                className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  rightTab === 'collage'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Çoklu Resim ({selectedImageUrls.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setRightTab('caption')}
                className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  rightTab === 'caption'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Sektörel Metin</span>
              </button>
            </div>

            {/* TAB 1: SEGMENT SCENARIO IMAGINATION & STORYBOARD */}
            {rightTab === 'scenario' && (
              <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
                
                {/* Custom Imagination Prompt Box */}
                <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
                  <label className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Ürüne Özel Hayal Gücü & Senaryo Kurgusu</span>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customScenarioIdea}
                      onChange={(e) => setCustomScenarioIdea(e.target.value)}
                      placeholder="Örn: Dolap içinde kıyafet yerleştiren insan figürü / Modern ofis masası..."
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateAiSceneImage}
                      disabled={isGeneratingAiScene}
                      className="px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                      title="Ürünü bu senaryoda sahnele ve çoklu resim havuzuna ekle"
                    >
                      <Wand2 className={`w-3.5 h-3.5 ${isGeneratingAiScene ? 'animate-spin' : ''}`} />
                      <span>{isGeneratingAiScene ? "Sahneleniyor..." : "Sahne Üret"}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Ürününüzün segmentine göre hazır senaryolardan birini seçebilir veya hayal ettiğiniz kullanım ortamını yazıp <strong>Sahne Üret</strong> ile kolaja ekleyebilirsiniz.
                  </p>
                </div>

                {/* Tailored Segment Scenarios List */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Ürünün Segmentine Özel Hazır Canlandırma Senaryoları:
                  </span>
                  <div className="space-y-2">
                    {scenarios.map((scen) => {
                      const isSelected = activeScenarioId === scen.id;
                      return (
                        <button
                          key={scen.id}
                          type="button"
                          onClick={() => applyScenario(scen)}
                          className={`w-full text-left p-2.5 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-slate-800/95 border-cyan-500 ring-1 ring-cyan-500/30 shadow-md'
                              : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                              {scen.title}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 text-cyan-300 border border-slate-800 font-semibold">
                              4 Sahne
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug">
                            {scen.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Headline & Kicker Quick Editor */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Afiş & Video Başlık Kurgusu
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400">Üst Slogan</label>
                      <input
                        type="text"
                        value={kicker}
                        onChange={(e) => setKicker(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400">Ana Vurgu Başlığı</label>
                      <input
                        type="text"
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400">Alt Değer / Kampanya Rozeti</label>
                    <input
                      type="text"
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Google AI Pro Omni Video Trigger */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleGenerateOmniVideo}
                    disabled={isGeneratingAiVideo}
                    className="w-full py-2.5 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Film className={`w-4 h-4 ${isGeneratingAiVideo ? 'animate-spin' : ''}`} />
                    <span>
                      {isGeneratingAiVideo
                        ? "Senaryo Videosu Kurgulanıyor..."
                        : "Senaryoyu 4 Sahneli Video Reel Olarak Oynat"}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: MULTI-IMAGE COLLAGE & CENTER FOCAL ENGINE */}
            {rightTab === 'collage' && (
              <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                
                {/* Image Pool & Upload */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      Ürün Görselleri & Üretilen Sahneler ({imageUrlsPool.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Görsel Ekle</span>
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

                  <p className="text-[11px] text-slate-400">
                    Kolajda ve çok sahneli videoda kullanılacak görselleri seçin (En fazla 4 görsel). Her resmin ürün odağı otomatik olarak merkeze hizalanır.
                  </p>

                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {imageUrlsPool.map((url, idx) => {
                      const isSel = selectedImageUrls.includes(url);
                      const orderIdx = selectedImageUrls.indexOf(url) + 1;
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleImageSelection(url)}
                          className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                            isSel
                              ? 'border-cyan-400 ring-2 ring-cyan-500/30'
                              : 'border-slate-800 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={url}
                            alt={`Ürün Açı ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {isSel && (
                            <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-black text-[11px] flex items-center justify-center shadow-md">
                              {orderIdx}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Collage Grid Layout Picker */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-bold text-slate-300 block">
                    Kolaj Dizilimi Seçimi
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: 'single', title: 'Tekli Sahne & Odak', desc: 'Ana senaryo sahnesi (Çoklu resimde sağ alt PIP)' },
                        { id: 'collage_2', title: "2'li Simetrik Kolaj", desc: 'Senaryo sahnesi + 2. açı merkez odaklı' },
                        { id: 'collage_3', title: "3'lü Bento Vitrin", desc: '1 büyük sahne + 2 ortalanmış detay kare' },
                        { id: 'collage_4', title: "4'lü 360° Katalog", desc: '4 farklı açıdan tam merkez odaklı vitrin' }
                      ] as Array<{ id: CollageLayout; title: string; desc: string }>
                    ).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCollageLayout(c.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          collageLayout === c.id
                            ? 'bg-slate-800 border-cyan-500 text-white'
                            : 'bg-slate-900/70 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="text-xs font-bold text-white">{c.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{c.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Focal Point Centering Mode & Zoom */}
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Focus className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Resim Odağı & Merkezleme Modu</span>
                    </span>
                    <span className="text-[11px] font-mono text-cyan-300">
                      Yakınlık: %{Math.round(focalZoom * 100)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: 'smart_center', label: 'Akıllı Merkez Odak' },
                        { id: 'contain_center', label: 'Tam Ürün Sığdır' },
                        { id: 'cover_center', label: 'Tam Çerçeve Doldur' }
                      ] as Array<{ id: ImageFitMode; label: string }>
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setImageFitMode(m.id)}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          imageFitMode === m.id
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <input
                      type="range"
                      min="0.85"
                      max="1.35"
                      step="0.05"
                      value={focalZoom}
                      onChange={(e) => setFocalZoom(parseFloat(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Geniş Açı (%85)</span>
                      <span>Tam Merkez (%100)</span>
                      <span>Makro Yakın Plan (%135)</span>
                    </div>
                  </div>
                </div>

                {/* Color Theme Palette */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Çerçeve & Marka Atmosferi</span>
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(
                      [
                        { id: 'futuristic_studio', label: 'Siber Stüdyo' },
                        { id: 'modern_commerce', label: 'Aydınlık Vitrin' },
                        { id: 'luxury_editorial', label: 'Lüks Titanyum' },
                        { id: 'vibrant_sale', label: 'Sıcak Enerji' }
                      ] as Array<{ id: TemplateTheme; label: string }>
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTheme(t.id)}
                        className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                          selectedTheme === t.id
                            ? 'bg-indigo-600 border-indigo-400 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: AI CAPTION & COPYWRITING */}
            {rightTab === 'caption' && (
              <div className="space-y-3 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Senaryo Odaklı Paylaşım Metni
                  </span>
                  <button
                    type="button"
                    onClick={() => handleGenerateCaption(selectedTone)}
                    disabled={isGeneratingCaption}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isGeneratingCaption ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingCaption ? "Yazılıyor..." : "Yeniden Yaz"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  {(
                    [
                      { id: 'promo', label: 'Satış Odaklı' },
                      { id: 'luxury', label: 'Prestij' },
                      { id: 'futuristic', label: 'Teknoloji' },
                      { id: 'friendly', label: 'Samimi' }
                    ] as Array<{ id: CaptionTone; label: string }>
                  ).map((toneObj) => (
                    <button
                      key={toneObj.id}
                      type="button"
                      onClick={() => {
                        setSelectedTone(toneObj.id);
                        handleGenerateCaption(toneObj.id);
                      }}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        selectedTone === toneObj.id
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {toneObj.label}
                    </button>
                  ))}
                </div>

                <div className="relative flex-1">
                  <textarea
                    rows={11}
                    value={captionText}
                    onChange={(e) => setCaptionText(e.target.value)}
                    className="w-full h-full p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed resize-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyCaption}
                    className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg cursor-pointer"
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
