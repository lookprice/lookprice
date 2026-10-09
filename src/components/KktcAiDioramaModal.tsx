import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Globe, 
  MapPin, 
  Sun, 
  Moon, 
  Cpu, 
  Play, 
  Pause, 
  RotateCw, 
  X, 
  Sliders, 
  FileText, 
  Zap,
  Volume2,
  VolumeX,
  Compass,
  Check,
  Tv,
  Eye,
  Camera
} from "lucide-react";

interface HotspotNode {
  id: string;
  nameTr: string;
  nameEn: string;
  region: string;
  prompt1Tr: string;
  prompt1En: string;
  prompt2Tr: string;
  prompt2En: string;
  image: string;
  coords: { x: number; y: number }; // Percentage on map
  specs: {
    estateTypeTr: string;
    estateTypeEn: string;
    rooms: string;
    area: string;
  };
}

const KKTC_HOTSPOTS: HotspotNode[] = [
  {
    id: "girne",
    nameTr: "Bellapais Malikanesi (Girne)",
    nameEn: "Bellapais Mansion (Kyrenia)",
    region: "Girne / Kyrenia",
    prompt1Tr: "Girne Bellapais sırtlarında konumlanmış, Akdeniz manzaralı ultra-lüks Akdeniz dioraması. Beyaz mermer duvarlar, taş kemerler ve havuz yansımaları. Sinematik altın saat ışığı, 8k gerçeklik.",
    prompt1En: "Ultra-luxury Mediterranean mansion diorama positioned on Bellapais hills in Kyrenia, overlooking the sea. White marble walls, stone arches, and infinity pool reflections. Cinematic golden hour lighting, 8k realism.",
    prompt2Tr: "Yükseklik ve eğim alan drone kamerası ile Kız Kulesi tarzında Bellapais malikanesi etrafında pürüzsüz saat yönünde orbital dönüş yap. Su yansımaları, derinlik hissi ve rüzgarda kıpırdayan zeytin ağaçları.",
    prompt2En: "Perform a smooth clockwise orbital drone rotation around the Bellapais mansion with a subtle elevated angle. Realistic perspective shifts, gentle pool ripples, and soft pine/olive tree movement.",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200",
    coords: { x: 42, y: 35 },
    specs: {
      estateTypeTr: "Lüks Taş Villa",
      estateTypeEn: "Luxury Stone Villa",
      rooms: "5+2",
      area: "480 m²"
    }
  },
  {
    id: "iskele",
    nameTr: "Long Beach Sky Tower (İskele)",
    nameEn: "Long Beach Sky Tower (Iskele)",
    region: "İskele / Trikomo",
    prompt1Tr: "İskele Long Beach kıyısında, cam cepheli fütüristik lüks gökdelen dioraması. Akşamüstü gün batımı yansımaları, turkuaz deniz kıyısı, cyber-lüks sıcak ışıklar, ultra keskin mimari çizgi.",
    prompt1En: "Futuristic glassy high-rise skyscraper diorama on Iskele Long Beach shore. Sunset reflections on glass facade, turquoise coastal water, cyber-luxury warm ambient lighting, ultra-sharp architectural design.",
    prompt2Tr: "Gökdelenin en üst penthouse katını odak noktası alarak drone kamerasıyla orbital 360 dönüş gerçekleştir. Deniz dalgalarında parıltı, pencerelerdeki iç oda ışık derinliği geçişleri, 24fps sinema modu.",
    prompt2En: "Create an orbital 360 drone rotation focusing on the skyscraper penthouse. Specular highlights on sea waves, smooth perspective transition of interior lights behind floor-to-ceiling glass, 24fps.",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1200",
    coords: { x: 74, y: 55 },
    specs: {
      estateTypeTr: "Panoramik Penthouse",
      estateTypeEn: "Panoramic Penthouse",
      rooms: "3+1 Loft",
      area: "210 m²"
    }
  },
  {
    id: "lefkosa",
    nameTr: "Historic Suriçi Stone (Lefkoşa)",
    nameEn: "Historic Suriçi Stone (Nicosia)",
    region: "Lefkoşa / Nicosia",
    prompt1Tr: "Suriçi tarihi dokusunda Selimiye Camii yakınında, mermer ve el yapımı taş işçilikli geleneksel köşk dioraması. Sabah sisi, nemli taş zemin parlamaları, derin gölge kontrastları.",
    prompt1En: "Traditional courtyard mansion diorama near Selimiye in historic Walled Nicosia, crafted with authentic yellow stone. Morning fog, wet stone pavement reflections, high contrast shadows.",
    prompt2Tr: "Taş avluyu merkez alarak dar bir açıyla dairesel dönüş gerçekleştir. Tarihi cumbaların persfektif değişimi, bacalardan çıkan hafif duman efekti, sinematik ağır çekim, sarsıntısız drone akışı.",
    prompt2En: "Generate a tight orbital clockwise rotation centering on the stone courtyard. Real-time perspective warp of bay windows, faint historic chimney smoke plumes, cinematic slow motion.",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200",
    coords: { x: 50, y: 52 },
    specs: {
      estateTypeTr: "Tarihi Taş Köşk",
      estateTypeEn: "Historical Manor House",
      rooms: "8+3",
      area: "650 m²"
    }
  },
  {
    id: "magusa",
    nameTr: "Othello Luxury Port Galeri (Gazimağusa)",
    nameEn: "Othello Luxury Port Gallery (Famagusta)",
    region: "Gazimağusa / Famagusta",
    prompt1Tr: "Tarihi liman surları ve denizin birleştiği çizgide modern cam-çelik mimarili otomobil showroom galeri dioraması. Spor arabaların kaportasında gün batımı turuncusu, yansımalı epoksi zemin.",
    prompt1En: "Modern glass-steel automotive pavilion diorama situated where active port walls meet the sea. Sunset orange glares reflecting off exotic sports cars, high-gloss reflective epoxy floor.",
    prompt2Tr: "Tasarım galeri binasını merkezleyerek 360 derece helikopter çekimi hissi yarat. Deniz üzerindeki rüzgar esintileri, kıyı dalgaları ve vitrin camındaki akıllı ışık parlamaları.",
    prompt2En: "Animate a 360 helicopter-style orbital rotation around the showroom pavilion. Subtle wind ripples on the harbor sea and intelligent specular ambient flares on the curtain glass facades.",
    image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=1200",
    coords: { x: 70, y: 68 },
    specs: {
      estateTypeTr: "Premium Showroom",
      estateTypeEn: "Premium Showroom",
      rooms: "Geniş Galeri",
      area: "850 m²"
    }
  }
];

interface KktcAiDioramaModalProps {
  onClose: () => void;
  lang: string;
}

export const KktcAiDioramaModal: React.FC<KktcAiDioramaModalProps> = ({ onClose, lang }) => {
  const isTr = lang === "tr";
  
  // States
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotNode>(KKTC_HOTSPOTS[0]);
  const [prompt1, setPrompt1] = useState(selectedHotspot.prompt1Tr);
  const [prompt2, setPrompt2] = useState(selectedHotspot.prompt2Tr);
  const [customPromptEnabled, setCustomPromptEnabled] = useState(false);
  
  // Compilation Stage States
  const [isRendering, setIsRendering] = useState(false);
  const [renderStep, setRenderStep] = useState(0); // 0: Idle, 1: Gemini Diorama Synth, 2: Google Flow Video Render, 3: Success
  const [renderLogs, setRenderLogs] = useState<string[]>([]);
  
  // Interactive Simulator parameters
  const [lighting, setLighting] = useState<"golden" | "noon" | "neon" | "moon">("golden");
  const [orbitSpeed, setOrbitSpeed] = useState(1.5);
  const [dollyDistance, setDollyDistance] = useState(100); // 100% (default)
  const [isOrbiting, setIsOrbiting] = useState(true);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [hasSound, setHasSound] = useState(false);

  // Sync prompts when selected hotspot changes unless custom mode is active
  useEffect(() => {
    if (!customPromptEnabled) {
      setPrompt1(isTr ? selectedHotspot.prompt1Tr : selectedHotspot.prompt1En);
      setPrompt2(isTr ? selectedHotspot.prompt2Tr : selectedHotspot.prompt2En);
    }
  }, [selectedHotspot, isTr, customPromptEnabled]);

  // Orbit rotation loop
  useEffect(() => {
    let animationFrameId: number;
    const updateOrbit = () => {
      if (isOrbiting && renderStep === 3) {
        setCurrentAngle(prev => (prev + (orbitSpeed * 0.2)) % 360);
      }
      animationFrameId = requestAnimationFrame(updateOrbit);
    };
    animationFrameId = requestAnimationFrame(updateOrbit);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isOrbiting, orbitSpeed, renderStep]);

  // Logs stream simulator
  const logTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const addLogWithDelay = (message: string, delay: number) => {
    return new Promise<void>(resolve => {
      logTimeoutRef.current = setTimeout(() => {
        setRenderLogs(prev => [...prev, message]);
        resolve();
      }, delay);
    });
  };

  const handleStartRender = async () => {
    setIsRendering(true);
    setRenderStep(1);
    setRenderLogs([]);
    setCurrentAngle(0);

    const logsTurkish = [
      "⚡ [Gemini Pro 3D] Diorama Derleme Motoru Başlatıldı...",
      "📍 [Seçim] KKTC Bölgesel Koordinat Ağı optimize ediliyor: " + selectedHotspot.region,
      "🤖 [Prompt 1 Analizi] İpucu yükleniyor...",
      "🎨 [Malzeme Boyama] Premium Nappa Deri, Akdeniz Doğal Taşı & Yüksek Isı Cam haritalanıyor...",
      "💡 [Işık Katmanı] " + lighting.toUpperCase() + " Atmosferik simülasyonu giydiriliyor (Güç: 7200Lm)...",
      "🚀 [1. Aşama Tamam] Gemini 3D Yüksek Çözünürlüklü Sabit Diorama karesi üretildi.",
      "🚀 [Google Flow] Video İşleme Hattına Aktarılıyor...",
      "📹 [Prompt 2 Analizi] Drone uçuş parametreleri hesaplanıyor...",
      "🌀 [Hesaplama] 360 derecelik clockwise dairesel kamera rotası ve parallax eğrisi kalibre ediliyor...",
      "🌊 [Su Motoru] Gerçek zamanlı kıyı köpürmesi & deniz dalgalanma shader'ları çalıştırılıyor...",
      "🎬 [Google vFlow] 24 FPS render kuyruğu derleniyor...",
      "🌟 [BAŞARI] Sinematik 3D Dönüş Gösterimi Aktifleştirildi! İncelemeye hazırsınız."
    ];

    const logsEnglish = [
      "⚡ [Gemini Pro 3D] Diorama Synthesis Engine Initialized...",
      "📍 [Mapping] Optimizing Northern Cyprus terrain mesh: " + selectedHotspot.region,
      "🤖 [Prompt 1 Analysis] Processing layout prompts...",
      "🎨 [Surfacing] Texturing premium stone masonry, bespoke marble & ultra-translucent window glasses...",
      "💡 [Lighting State] Applying " + lighting.toUpperCase() + " cinematic atmospheric shader (Intensity: 7200Lm)...",
      "🚀 [Phase 1 Done] Gemini high-detail static diorama base frame successfully synthesized.",
      "🚀 [Google Flow] Pipelining base frame to Motion Core...",
      "📹 [Prompt 2 Analysis] Extracting flight tracking parameters...",
      "🌀 [Physics Check] Commencing clockwise orbital vector curves with parallax corrections...",
      "🌊 [Waverunner Core] Deploying sub-surface water ripples & ambient wind physics...",
      "🎬 [Google vFlow] Compiling raw frames into lossless 24 FPS stream...",
      "🌟 [SUCCESS] Immersive Cinematic 3D Reveal Ready and active!"
    ];

    const targetLogs = isTr ? logsTurkish : logsEnglish;

    for (let i = 0; i < targetLogs.length; i++) {
      if (i === 6) {
        setRenderStep(2); // Transition to Flow stage
      }
      await addLogWithDelay(targetLogs[i], 450 + Math.random() * 300);
    }

    setRenderStep(3); // Real-time orbit active
    setIsRendering(false);
  };

  // Automated trigger on Mount (Let's auto-compile the first one to give direct wow factor, or let them trigger!)
  useEffect(() => {
    handleStartRender();
    return () => {
      if (logTimeoutRef.current) clearTimeout(logTimeoutRef.current);
    };
  }, [selectedHotspot, lighting]); // Re-render when selected scene or lighting changes

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-0 md:p-6 select-none font-sans overflow-hidden">
      {/* Background Glass Plate */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl"
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="relative w-full h-full md:h-[90vh] max-w-7xl bg-slate-900 md:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col md:grid md:grid-cols-12"
      >
        {/* TOP MOBILE HEADER BANNER */}
        <div className="md:hidden flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70 z-20 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            <span className="text-xss font-black tracking-widest text-slate-300 uppercase">KKTC AI ORBIT REVEAL</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* LEFT COLUMN: INTERACTIVE VIEWPORT & HUD DIORAMA (7 cols) */}
        <div className="relative md:col-span-8 bg-slate-950 h-[45vh] md:h-full flex flex-col justify-between overflow-hidden">
          {/* HUD Top panel */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-none z-30">
            <div className="bg-slate-950/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-800 shadow-lg">
              <span className="text-[7px] text-indigo-400 font-extrabold tracking-widest uppercase block mb-0.5">CYPRUS AI CORE</span>
              <span className="text-[10px] text-white font-black tracking-wide uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {selectedHotspot.region}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-800 shadow-lg text-right">
              <div>
                <span className="text-[7px] text-slate-400 font-extrabold tracking-widest uppercase block mb-0.5">ORBIT SPEED</span>
                <span className="text-[10px] text-indigo-400 font-mono font-bold">{orbitSpeed.toFixed(1)}x / {currentAngle.toFixed(0)}°</span>
              </div>
            </div>
          </div>

          {/* VIEWPORT AREA TRIPLE RENDER LAYER */}
          <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden">
            {/* Ambient Lighting Overlays */}
            <div className={`absolute inset-0 z-10 pointer-events-none transition-all duration-1000 ${
              lighting === "noon" ? "bg-amber-500/5 mix-blend-overlay" : 
              lighting === "neon" ? "bg-purple-900/15 mix-blend-color-burn" :
              lighting === "moon" ? "bg-blue-950/30 mix-blend-multiply" : 
              "bg-orange-500/10 mix-blend-color-dodge"
            }`} />

            {/* Simulated Cyber Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 z-0 pointer-events-none" />

            {/* STAGE CONTAINER WITH PERSPECTIVE */}
            <div className="relative w-full max-w-lg aspect-square flex items-center justify-center -translate-y-4 md:-translate-y-8 z-10 p-4">
              <AnimatePresence mode="wait">
                {renderStep < 3 ? (
                  /* RENDERING COMPILATION HUD */
                  <motion.div 
                    key="compiling"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="w-full max-w-md bg-slate-950/60 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl flex flex-col items-center justify-center text-center shadow-2xl relative"
                  >
                    <div className="absolute top-4 left-4 flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                      <span className="text-[8px] font-mono text-slate-500 font-bold uppercase">RENDER IN PROGRESS</span>
                    </div>

                    <div className="relative w-24 h-24 flex items-center justify-center mb-6">
                      <svg className="w-full h-full animate-spin-slow text-indigo-500" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" stroke="#1e293b" strokeWidth="2" fill="transparent" />
                        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="3" strokeDasharray="80 280" fill="transparent" />
                      </svg>
                      {renderStep === 1 ? (
                        <Cpu className="w-8 h-8 text-indigo-400 absolute animate-pulse" />
                      ) : (
                        <Globe className="w-8 h-8 text-emerald-400 absolute animate-bounce" />
                      )}
                    </div>

                    <h4 className="text-sm font-extrabold text-white mb-1 uppercase tracking-wider">
                      {renderStep === 1 
                        ? (isTr ? "1. Aşama: Gemini 3D Diorama Sentezi" : "Phase 1: Gemini 3D Diorama Synthesis")
                        : (isTr ? "2. Aşama: Google Flow Video Render" : "Phase 2: Google Flow Video Render")
                      }
                    </h4>
                    <p className="text-xss text-slate-400 max-w-xs font-semibold uppercase tracking-wider mb-6">
                      {renderStep === 1
                        ? (isTr ? "Prompt 1 yönergelerine göre 3D dokular üretiliyor..." : "Generating custom 3D mesh & rich material structures...")
                        : (isTr ? "Prompt 2 yönergelerine göre 360° orbital video derleniyor..." : "Compiling 24fps smooth orbital movement pipeline...")
                      }
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-900 rounded-full h-1.5 border border-slate-800 overflow-hidden mb-2">
                      <motion.div 
                        initial={{ width: "0%" }}
                        animate={{ width: renderStep === 1 ? "50%" : "95%" }}
                        transition={{ duration: 4 }}
                        className="bg-indigo-600 h-full rounded-full"
                      />
                    </div>
                    <div className="flex justify-between w-full text-[8px] font-mono font-bold text-slate-500">
                      <span>GE_3D_COMPILE</span>
                      <span>{renderStep === 1 ? "42%" : "89%"}</span>
                    </div>
                  </motion.div>
                ) : (
                  /* CINEMATIC 3D ORBIT PREVIEW WINDOW */
                  <motion.div 
                    key="success_viewport"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative w-full h-full max-w-md aspect-square flex items-center justify-center cursor-grab active:cursor-grabbing"
                    style={{ perspective: "1000px" }}
                  >
                    {/* Floating SPEC Tag */}
                    <div className="absolute top-10 right-4 z-20 bg-slate-950/90 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-slate-800 shadow-xl max-w-[170px] pointer-events-none animate-in fade-in duration-500">
                      <span className="text-[7px] text-amber-400 font-extrabold tracking-widest uppercase block mb-0.5">{isTr ? "VARLIK ÖZELLİKLERİ" : "ASSET SPECS"}</span>
                      <h5 className="text-[10px] text-white font-black truncate">{isTr ? selectedHotspot.specs.estateTypeTr : selectedHotspot.specs.estateTypeEn}</h5>
                      <div className="grid grid-cols-2 gap-2 mt-1.5 border-t border-slate-800/60 pt-1.5 text-[8px] font-mono font-bold text-slate-400 leading-none">
                        <div>
                          <p className="text-[6px] text-slate-500 uppercase">{isTr ? "BÖLÜM" : "ROOMS"}</p>
                          <p className="text-white mt-0.5">{selectedHotspot.specs.rooms}</p>
                        </div>
                        <div>
                          <p className="text-[6px] text-slate-500 uppercase">{isTr ? "ALAN" : "AREA"}</p>
                          <p className="text-white mt-0.5">{selectedHotspot.specs.area}</p>
                        </div>
                      </div>
                    </div>

                    {/* Outer Rotating Shield Rings */}
                    <div 
                      className="absolute inset-0 border border-indigo-600/10 rounded-full z-0 pointer-events-none transition-transform duration-100 ease-out"
                      style={{ transform: `rotate3d(0, 1, 0, ${currentAngle * 0.3}deg) scale(0.9)` }}
                    />
                    <div 
                      className="absolute inset-0 border border-slate-800 border-dashed rounded-full z-0 pointer-events-none"
                    />

                    {/* DIORAMA BASE MOCK CONTAINER WITH ROTATIONAL DRAPE */}
                    <motion.div 
                      className="relative w-[300px] h-[340px] z-10 flex flex-col justify-end bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden rounded-[2.5rem] transition-all"
                      style={{ 
                        transformStyle: "preserve-3d",
                        transform: `rotate3d(0.2, 1, -0.1, ${currentAngle}deg)`,
                        scale: `${dollyDistance / 100}`
                      }}
                    >
                      {/* Image Frame layer 1 */}
                      <div 
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 pointer-events-none" 
                        style={{ 
                          backgroundImage: `url('${selectedHotspot.image}')`,
                          transform: `scale(1.1) translateX(${-Math.sin(currentAngle * Math.PI / 180) * 12}px)` // Parallax shift simulates true depth!
                        }}
                      />

                      {/* Depth-of-field Shadow overlays */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />

                      {/* HUD Overlays integrated onto Diorama Frame */}
                      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-10 text-[6px] font-mono text-white/50">
                        <div>
                          <p>ST_CAM_01</p>
                          <p className="text-indigo-400 font-bold">24FPS // HDR</p>
                        </div>
                        <div className="text-right">
                          <p>AZM_ELEV: +32°</p>
                          <p className="text-emerald-400">DEPTH LOCK</p>
                        </div>
                      </div>

                      {/* Diorama Interactive Content Block (Bottom Anchor) */}
                      <div className="p-4 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 z-10">
                        <span className="text-[7px] text-indigo-400 font-extrabold tracking-widest uppercase block mb-0.5">
                          {isTr ? "CİNEMA ORBİTAL REVEAL" : "CINEMATIC ORBIT REVEAL"}
                        </span>
                        <h4 className="text-xs font-black text-white truncate leading-none mb-1">
                          {isTr ? selectedHotspot.nameTr : selectedHotspot.nameEn}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-semibold line-clamp-2 leading-relaxed">
                          {isTr ? selectedHotspot.prompt1Tr : selectedHotspot.prompt1En}
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* LOWER CONTROL SLIDERS (Only visible after compilation success) */}
          <div className="p-4 bg-slate-900/60 backdrop-blur-md border-t border-slate-800 z-30 shrink-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Speed Slider */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{isTr ? "Dönüş Hızı" : "Orbit Speed"}</span>
                <input 
                  type="range" 
                  min="0" 
                  max="4" 
                  step="0.2"
                  value={orbitSpeed} 
                  onChange={(e) => setOrbitSpeed(Number(e.target.value))}
                  disabled={renderStep < 3}
                  className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-30"
                />
              </div>

              {/* Dolly/Zoom Slider */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{isTr ? "Kamera Yakınlığı" : "Dolly Zoom"}</span>
                <input 
                  type="range" 
                  min="60" 
                  max="140" 
                  step="2"
                  value={dollyDistance} 
                  onChange={(e) => setDollyDistance(Number(e.target.value))}
                  disabled={renderStep < 3}
                  className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-30"
                />
              </div>

              {/* Angle Angle Gauge / Play Toggle */}
              <div className="flex items-center gap-2 justify-center col-span-2 border-l border-slate-800/80 pl-4">
                <button
                  type="button"
                  onClick={() => setIsOrbiting(!isOrbiting)}
                  disabled={renderStep < 3}
                  className={`px-4 py-2 rounded-xl text-xss font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 ${isOrbiting ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'} disabled:opacity-30`}
                >
                  {isOrbiting ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {isOrbiting ? (isTr ? "Durdur" : "Pause") : (isTr ? "Döndür" : "Rotate")}
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentAngle(0)}
                  disabled={renderStep < 3}
                  className="px-3 py-2 rounded-xl text-xss font-bold bg-slate-800 text-slate-400 hover:text-white border border-slate-850 hover:border-slate-700 disabled:opacity-30"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CYPRUS GEOGRAPHY MAP & PROMPTING INTERNET CENTER (4 cols) */}
        <div className="md:col-span-4 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col h-[55vh] md:h-full justify-between">
          <div className="p-5 flex-1 overflow-y-auto no-scrollbar space-y-6">
            
            {/* BRANDING LOGO COMPONENT */}
            <div className="hidden md:flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                <h3 className="text-xss font-black tracking-widest text-white uppercase">{isTr ? "KUZEY KIBRIS AI ORBİT" : "NORTHERN CYPRUS AI ORBIT"}</h3>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg text-slate-500 hover:text-white transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* CYPRUS GEOGRAPHY MINIMAP WIDGET */}
            <div className="space-y-3">
              <span className="text-[8px] font-black text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                {isTr ? "İNTERAKTİF KKTC SEÇİM PLAKASI" : "INTERACTIVE CYPRUS MAP SECTIONS"}
              </span>

              {/* MAP CHIP CONTAINER */}
              <div className="relative bg-slate-950 rounded-2xl border border-slate-800/80 p-3 h-36 flex items-center justify-center overflow-hidden">
                {/* Visual Silhouette outline representation of Cyprus */}
                <svg className="w-11/12 h-5/6 text-slate-800/40 pointer-events-none absolute" viewBox="0 0 300 120" fill="currentColor">
                  {/* Stylized geometric outline of Cyprus */}
                  <path d="M50 50 Q 80 40 100 50 T 150 40 T 180 50 T 230 30 L 260 25 L 290 20 L 240 38 L 200 60 L 160 55 L 120 70 L 90 65 L 60 55 Z" />
                </svg>

                {/* Grid accent pattern inside map */}
                <div className="absolute inset-0 bg-slate-500/[0.02] bg-[size:10px_10px]" />

                {/* Hotspot Markers */}
                {KKTC_HOTSPOTS.map((node) => {
                  const isNodeActive = selectedHotspot.id === node.id;
                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => {
                        setSelectedHotspot(node);
                      }}
                      className="absolute group/node flex flex-col items-center"
                      style={{ left: `${node.coords.x}%`, top: `${node.coords.y}%` }}
                    >
                      {/* Interactive Radar Ring */}
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ${isNodeActive ? 'bg-indigo-500 ring-4 ring-indigo-500/30 text-white scale-125' : 'bg-slate-700 text-slate-400 group-hover/node:scale-110'}`}>
                        <span className="w-1 h-1 rounded-full bg-white" />
                      </span>
                      {/* Name tag */}
                      <span className={`absolute top-4 pointer-events-none transition-all text-[7px] font-black px-1.5 py-0.5 rounded leading-none whitespace-nowrap border ${isNodeActive ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 border-slate-800 text-slate-400 group-hover/node:text-slate-200'}`}>
                        {node.id.toUpperCase()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* QUICK ENVIRONMENT SCENE CONTROLLER */}
            <div className="space-y-3">
              <span className="text-[8px] font-black text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                {isTr ? "GÖRSEL ÇEVRE & GÜN IŞIĞI SİMÜLATÖRÜ" : "ENVIRONMENT LIGHTING SECTOR"}
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: "noon", labelTr: "Güpegündüz", labelEn: "Noon Sun", icon: Sun, color: "text-amber-500" },
                  { id: "golden", labelTr: "Altın Saat", labelEn: "Golden Hour", icon: Sparkles, color: "text-orange-400" },
                  { id: "neon", labelTr: "Cyberpunk", labelEn: "Cyberpunk", icon: Cpu, color: "text-purple-400" },
                  { id: "moon", labelTr: "Mehtap", labelEn: "Moonlight", icon: Moon, color: "text-blue-400" }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLighting(item.id as any)}
                    className={`py-2 rounded-xl text-[8px] font-black tracking-tight border flex flex-col items-center justify-center gap-1 transition-all ${lighting === item.id ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'}`}
                  >
                    <item.icon className={`w-3.5 h-3.5 ${lighting === item.id ? 'text-white' : item.color}`} />
                    <span>{isTr ? item.labelTr : item.labelEn}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* FIRST PROMPT DISPLAY: GEMINI DIORAMA DESIGN (Mapped visually) */}
            <div className="space-y-2 border-t border-slate-850 pt-4">
              <div className="flex justify-between items-center bg-slate-950/40 p-1.5 rounded-lg border border-slate-850">
                <span className="text-[8px] font-black text-indigo-400 tracking-wider uppercase">1. PROMPT (GEMINI MODEL GENERATION)</span>
                <span className="text-[6px] font-mono text-slate-500 uppercase px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">BASE_RIG</span>
              </div>
              <div className="relative">
                <textarea
                  value={prompt1}
                  onChange={(e) => {
                    setPrompt1(e.target.value);
                    setCustomPromptEnabled(true);
                  }}
                  className="w-full h-16 bg-slate-950 border border-slate-850 rounded-xl p-3 text-[10px] text-slate-300 font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* SECOND PROMPT DISPLAY: GOOGLE FLOW CINEMATIC REVEAL */}
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-slate-950/40 p-1.5 rounded-lg border border-slate-850">
                <span className="text-[8px] font-black text-indigo-400 tracking-wider uppercase">2. PROMPT (GOOGLE FLOW MOTION ENGINE)</span>
                <span className="text-[6px] font-mono text-slate-500 uppercase px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">FLOW_RIG</span>
              </div>
              <div className="relative">
                <textarea
                  value={prompt2}
                  onChange={(e) => {
                    setPrompt2(e.target.value);
                    setCustomPromptEnabled(true);
                  }}
                  className="w-full h-16 bg-slate-950 border border-slate-850 rounded-xl p-3 text-[10px] text-slate-300 font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none resize-none leading-relaxed"
                />
              </div>

              {customPromptEnabled && (
                <div className="flex justify-between items-center pt-2">
                  <p className="text-[8px] font-semibold text-amber-500 uppercase tracking-widest leading-none">⚠️ {isTr ? "Kendi Promptunuz Devrede" : "Custom Prompts Active"}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomPromptEnabled(false);
                      setPrompt1(isTr ? selectedHotspot.prompt1Tr : selectedHotspot.prompt1En);
                      setPrompt2(isTr ? selectedHotspot.prompt2Tr : selectedHotspot.prompt2En);
                    }}
                    className="text-[8px] font-extrabold text-slate-400 hover:text-white uppercase tracking-wider"
                  >
                    [{isTr ? "Sıfırla" : "Reset Preset"}]
                  </button>
                </div>
              )}
            </div>

            {/* CORE RENDER TRIGGER */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleStartRender}
                disabled={isRendering}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:opacity-95 text-white text-xs font-black tracking-wider uppercase shadow-xl hover:shadow-indigo-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 animate-pulse" />
                {isRendering ? (isTr ? "İŞLENİYOR..." : "SYNTHESIZING...") : (isTr ? "PROMPT MODELİNİ BURADA İŞLET" : "RUN PROMPT RENDER")}
              </button>
            </div>
          </div>

          {/* LOWER LOGS OUTPUT CONSOLE FOOTER */}
          <div className="p-4 bg-slate-950/70 border-t border-slate-850 flex flex-col justify-end shrink-0">
            <span className="text-[7px] text-indigo-400 font-black tracking-widest uppercase mb-1.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              {isTr ? "SİSTEMENT TEŞHİS MONİTÖRÜ" : "DIAGNOSTIC TELEMETRY LOGS"}
            </span>

            {/* Dynamic Console Rows */}
            <div className="bg-slate-950/90 border border-slate-900 rounded-xl p-3 h-20 overflow-y-auto font-mono text-[8px] text-slate-400 font-bold space-y-1 no-scrollbar">
              {renderLogs.length === 0 ? (
                <p className="text-slate-500">[{isTr ? "Bağlantı Bekleniyor..." : "Awaiting initialization signal..."}]</p>
              ) : (
                renderLogs.map((log, index) => (
                  <p key={index} className={log.includes("BAŞARI") || log.includes("SUCCESS") ? "text-emerald-400" : ""}>
                    {log}
                  </p>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
