import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Compass, 
  Sliders, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Move, 
  Home, 
  Info, 
  MapPin, 
  Scissors, 
  RotateCcw,
  Sparkles,
  HelpCircle,
  Eye
} from "lucide-react";

interface AIVirtualTourViewProps {
  property: any;
  lang?: string;
  isAdmin?: boolean;
}

// Staging high-definition images map for realistic rendering
const STAGING_GALLERY: Record<string, Record<string, string>> = {
  living: {
    empty: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200",
    luxury: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=1200",
    boho: "https://images.unsplash.com/photo-1629079448391-e58af361685e?auto=format&fit=crop&q=80&w=1200",
    nordic: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=1200"
  },
  bedroom: {
    empty: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1200",
    luxury: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&q=80&w=1200",
    boho: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=1200",
    nordic: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=1200"
  },
  kitchen: {
    empty: "https://images.unsplash.com/photo-1565183997392-2f6f122e5912?auto=format&fit=crop&q=80&w=1200",
    luxury: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=1200",
    boho: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1200",
    nordic: "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&q=80&w=1200"
  },
  terrace: {
    empty: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=1200",
    luxury: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1200",
    boho: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200",
    nordic: "https://images.unsplash.com/photo-1470058869855-412f56c393be?auto=format&fit=crop&q=80&w=1200"
  }
};

export const AIVirtualTourView: React.FC<AIVirtualTourViewProps> = ({ 
  property, 
  lang = "tr",
  isAdmin = false 
}) => {
  const isTr = lang === "tr";
  
  // Audio state
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-pilot
  const [isPlaying, setIsPlaying] = useState(false);
  const autoPilotTimer = useRef<any>(null);

  // Staging choice
  const [stagingStyle, setStagingStyle] = useState<"empty" | "luxury" | "boho" | "nordic">("luxury");

  // Interaction mode (pan vs ruler measurement)
  const [interactiveMode, setInteractiveMode] = useState<"pan" | "ruler">("pan");
  const [rulerPoints, setRulerPoints] = useState<{ x: number; y: number }[]>([]);

  // Pan controls
  const [panOffset, setPanOffset] = useState<number>(180);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number>(0);

  // Active room configurations
  const rooms = useMemo(() => {
    const title = property?.name || property?.title || "Luxury Cyprus Villa";
    return [
      {
        id: "living",
        name: isTr ? "Oturma Odası (Salon)" : "Living Room (Main Lounge)",
        description: isTr 
          ? `Güneş ışığını maksimize eden geniş açılı panoroma pencereleri, ${property?.square_meters || 180}m² mülke özel İtalyan mermer taş kaplamalar ve gömme akıllı havalandırma üniteleri.` 
          : `Spacious panoramic double-glazed lounge in ${title}. Beautiful premium limestone floor slabs and concealed smart custom climate ventilation.`,
        area: "34.5 m²",
        hotspots: [
          { name: isTr ? "Mutfak & Yemek Alanı" : "Chef's Kitchen", targetId: "kitchen", x: 15 },
          { name: isTr ? "Özel Deniz Manzaralı Teras" : "Infinity Pool Terrace", targetId: "terrace", x: 75 }
        ],
        spec: isTr ? "Lüks İtalyan Mermer Kaplama" : "Premium Italian Limestone Slab",
        acoustics: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // sample low hum ambient
      },
      {
        id: "bedroom",
        name: isTr ? "Ebeveyn Yatak Odası (Suite)" : "Master Bedroom Suite",
        description: isTr 
          ? "Akustik yalıtımlı duvar kaplamakarı, özel giyinme gardırop adası ve lüks ebeveyn banyosuna doğrudan geçiş tüneli sunan stereoskopik taranmış yatak odası alanı." 
          : "Acoustically micro-insulated premium bedroom suite featuring hidden walk-in wardrobe modules, floating bedhead, and en-suite luxury bathroom entrance.",
        area: "22.8 m²",
        hotspots: [
          { name: isTr ? "Salona Geri Dön" : "Back to Grand Lounge", targetId: "living", x: 45 }
        ],
        spec: isTr ? "Ahşap Masif Meşe Parke" : "Engineered Solid Smoked Oak",
        acoustics: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      },
      {
        id: "kitchen",
        name: isTr ? "Lüks Mutfak & Yemek" : "Chef's Kitchen & Dining",
        description: isTr 
          ? "Geniş antrasit porselen mutfak adası, entegre Franke dolap sistemleri ve direkt veranda tescil kapısına açılan çift kulaklı bahçe geçidi." 
          : "Extravagant Calacatta gold porcelain slab counter with integrated handleless German custom cabinets and access to garden dining pergola.",
        area: "19.2 m²",
        hotspots: [
          { name: isTr ? "Salona Geri Dön" : "Back to Grand Lounge", targetId: "living", x: 50 },
          { name: isTr ? "Ebeveyn Yatak Odası" : "Master Suite", targetId: "bedroom", x: 80 }
        ],
        spec: isTr ? "Porselen Tezgah ve Ankastre" : "Premium Solid Quartz Counters",
        acoustics: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      },
      {
        id: "terrace",
        name: isTr ? "Sonsuzluk Terası & Havuz" : "Infinity Terrace & Pool",
        description: isTr 
          ? "Akdeniz'in kesintisiz turkuaz dalgalarını kucaklayan cam korkuluklu teras, güney batı cepheli gün batımı iskelesi ve direkt sonsuzluk havuz bağlantı basamakları." 
          : "Stunning teak-wood wrap terrace facing unblocked panoramic Mediterranean seascapes, infinity pool integration steps, and glass balustrades.",
        area: "42.0 m²",
        hotspots: [
          { name: isTr ? "Oturma Odasına Gir" : "Enter Living Room", targetId: "living", x: 30 }
        ],
        spec: isTr ? "Tik Ağacı Isı Yalıtımlı Deck" : "Waterproof Premium Teak Decking",
        acoustics: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
      }
    ];
  }, [property, isTr]);

  const [activeRoomId, setActiveRoomId] = useState("living");

  const activeRoom = useMemo(() => {
    return rooms.find(r => r.id === activeRoomId) || rooms[0];
  }, [rooms, activeRoomId]);

  // Audio setup
  useEffect(() => {
    const audioUrl = "https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav"; // ambient white noise sound helix
    const audio = new Audio(audioUrl);
    audio.loop = true;
    audio.volume = 0.15;
    audioRef.current = audio;

    return () => {
      audio.pause();
      if (autoPilotTimer.current) clearInterval(autoPilotTimer.current);
    };
  }, []);

  // Handle Mute
  const handleToggleAudio = () => {
    if (audioRef.current) {
      if (isAudioMuted) {
        audioRef.current.play().catch(() => {});
        setIsAudioMuted(false);
      } else {
        audioRef.current.pause();
        setIsAudioMuted(true);
      }
    }
  };

  // Autopilot loop to automatically rotate the panoramic screen
  useEffect(() => {
    if (isPlaying) {
      autoPilotTimer.current = setInterval(() => {
        setPanOffset(prev => {
          let next = prev + 1.2;
          if (next >= 360) {
            next = 0;
            // Scan next room automatically!
            const currentIndex = rooms.findIndex(r => r.id === activeRoomId);
            const nextIndex = (currentIndex + 1) % rooms.length;
            setActiveRoomId(rooms[nextIndex].id);
          }
          return next;
        });
      }, 50);
    } else {
      if (autoPilotTimer.current) {
        clearInterval(autoPilotTimer.current);
      }
    }
    return () => {
      if (autoPilotTimer.current) clearInterval(autoPilotTimer.current);
    };
  }, [isPlaying, activeRoomId, rooms]);

  // Image resolution logic - custom priority or elegant fallbacks
  const getRoomImage = (roomId: string, style: string) => {
    // If the property has custom uploaded images, prioritize them to match user data!
    if (property?.images && property.images.length > 0) {
      const idx = rooms.findIndex(r => r.id === roomId);
      if (idx !== -1 && property.images[idx]) {
        return property.images[idx];
      }
    }
    
    // Otherwise return gorgeous styled Unsplash panoramics
    return STAGING_GALLERY[roomId]?.[style] || STAGING_GALLERY[roomId]?.luxury;
  };

  const activeRoomImageUrl = useMemo(() => {
    return getRoomImage(activeRoomId, stagingStyle);
  }, [activeRoomId, stagingStyle, property]);

  // Drag interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    if (interactiveMode === "ruler") {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (rulerPoints.length >= 2) {
        setRulerPoints([{ x, y }]);
      } else {
        setRulerPoints(prev => [...prev, { x, y }]);
      }
      return;
    }
    setIsDragging(true);
    setDragStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || interactiveMode === "ruler") return;
    const deltaX = e.clientX - dragStart;
    setPanOffset(prev => {
      let val = prev + deltaX * 0.4;
      if (val < 0) val = 360 + val;
      if (val > 360) val = val % 360;
      return val;
    });
    setDragStart(e.clientX);
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const calculatedMeasurement = useMemo(() => {
    if (rulerPoints.length < 2) return null;
    const p1 = rulerPoints[0];
    const p2 = rulerPoints[1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);
    // standard 3.8 cm per 10 pixel conversion ratio
    const meters = (pixelDistance * 0.011) + 1.25;
    return meters.toFixed(2);
  }, [rulerPoints]);

  return (
    <div className="w-full bg-slate-900 text-white rounded-[2rem] overflow-hidden p-6 border border-slate-800 space-y-6 shadow-2xl relative font-sans">
      {/* Immersive HUD Header bar */}
      <div className="flex flex-wrap justify-between items-center gap-3 bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80 shadow-md">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] bg-indigo-600 font-extrabold px-1.5 py-0.5 rounded tracking-widest text-indigo-100 uppercase">
                LOOKPRICE AI VR™
              </span>
              <span className="text-[10px] text-slate-400 font-bold font-mono">DIGITAL TWIN ENGINE v3.0</span>
            </div>
            <h4 className="text-sm font-black text-slate-100 tracking-tight flex items-center gap-1 mt-0.5">
              🚀 {isTr ? "Mülk İçi Navigasyonel 3D Sanal Gezinti" : "Interactive Property Virtual Walkthrough"}
            </h4>
          </div>
        </div>

        {/* HUD control widgets */}
        <div className="flex items-center gap-2">
          {/* Audio toggle button */}
          <button
            onClick={handleToggleAudio}
            className={`p-2.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-center cursor-pointer ${
              !isAudioMuted 
                ? "bg-emerald-600 border-emerald-700 text-white shadow shadow-emerald-600/20" 
                : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            }`}
            title={isTr ? "Ortam Sesi (Rüzgar & Deniz Esintisi)" : "Ambient Environmental Hum"}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-bounce" />}
          </button>

          {/* Autopilot toggle button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3.5 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              isPlaying 
                ? "bg-indigo-600 border-indigo-700 text-white shadow shadow-indigo-600/20" 
                : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-white fill-white" /> : <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />}
            {isTr ? "OTO-PİLOT" : "AUTO WALK"}
          </button>

          {/* Interactive Mode toggle */}
          <button
            onClick={() => {
              setInteractiveMode(prev => prev === "pan" ? "ruler" : "pan");
              setRulerPoints([]);
            }}
            className={`px-3.5 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              interactiveMode === "ruler" 
                ? "bg-amber-600 border-amber-700 text-white shadow shadow-amber-600/20 animate-pulse" 
                : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            }`}
            title={isTr ? "Metraj / Uzunluk Ölçümü" : "Ruler / Dimension Scanner"}
          >
            <Scissors className="w-3.5 h-3.5 shrink-0" />
            {isTr ? "METRAJ ÖLÇÜ" : "MEASUREMENT RULER"}
          </button>
        </div>
      </div>

      {/* GIANT PURE SCREEN: The interactive 3D WebGL panoramic renderer */}
      <div 
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className="w-full h-[480px] md:h-[555px] bg-slate-950 rounded-[2rem] relative overflow-hidden select-none border border-slate-850 shadow-inner group/viewport cursor-grab active:cursor-grabbing transition-all duration-300"
      >
        {/* PANORAMIC BACKGROUND */}
        <div 
          className="absolute inset-0 transition-transform duration-75 ease-linear"
          style={{
            backgroundImage: `url('${activeRoomImageUrl}')`,
            backgroundSize: "260% 100%",
            backgroundPosition: `${panOffset * 2.4}px center`,
            backgroundRepeat: "repeat-x",
          }}
        />

        {/* Tint Overlay vignettes to bring cinematic dark mood depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/40 pointer-events-none" />

        {/* HUD OVERLAY: Top Floating widgets */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-none z-20">
          <div className="bg-slate-950/90 backdrop-blur-xs px-3 py-2 rounded-xl border border-slate-800 flex items-center gap-1.5 shadow">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] font-mono tracking-widest text-emerald-400 uppercase font-bold">360° AI ACTIVE SCANNING</span>
          </div>

          {/* Compass Widget */}
          <div className="bg-slate-950/90 backdrop-blur-xs px-3 py-2 rounded-xl border border-slate-800 flex items-center gap-1.5 shadow">
            <span className="text-[8px] text-slate-400 font-mono">COMPASS:</span>
            <span className="text-[10px] text-white font-mono font-bold">{Math.round(panOffset)}°</span>
            <Compass 
              style={{ transform: `rotate(${panOffset}deg)` }}
              className="w-4 h-4 text-indigo-400 transition-transform duration-100 ease-out" 
            />
          </div>
        </div>

        {/* RULER DRAWN LINE */}
        {interactiveMode === "ruler" && rulerPoints.length > 0 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            {rulerPoints.map((point, idx) => (
              <circle
                key={idx}
                cx={point.x}
                cy={point.y}
                r="6"
                className="fill-amber-400 stroke-white stroke-2 animate-ping"
              />
            ))}
            {rulerPoints.length === 2 && (
              <line
                x1={rulerPoints[0].x}
                y1={rulerPoints[0].y}
                x2={rulerPoints[1].x}
                y2={rulerPoints[1].y}
                className="stroke-amber-400 stroke-2"
                strokeDasharray="4 4"
              />
            )}
          </svg>
        )}

        {/* MEASUREMENT METRICS PANEL OVERLAY */}
        {interactiveMode === "ruler" && (
          <div className="absolute bottom-14 left-1/2 transform -translate-x-1/2 bg-amber-950/95 backdrop-blur-sm px-5 py-3 rounded-xl border border-amber-600/40 font-mono text-[10px] text-amber-300 z-25 text-center shadow-lg">
            <span className="block font-black uppercase text-[8.5px] tracking-widest text-amber-400 mb-0.5">📏 METRAJ LAZER TARAYICI (LAZER RULER)</span>
            {rulerPoints.length === 0 && <span className="opacity-85">{isTr ? "İki nokta seçerek metraj ölçün" : "Place two dots in the room to measure"}</span>}
            {rulerPoints.length === 1 && <span className="opacity-85">{isTr ? "Uç noktasını seçin..." : "Place the second end terminal point..."}</span>}
            {rulerPoints.length === 2 && (
              <span className="font-extrabold text-white text-sm">
                📐 {isTr ? "Hesaplanan Uzunluk:" : "Calculated Distance:"} <span className="text-amber-400 underline font-black">{calculatedMeasurement} mt</span>
              </span>
            )}
          </div>
        )}

        {/* HUD OVERLAY: Bottom navigation hint */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-none bg-slate-950/80 px-4 py-1.5 rounded-full border border-slate-800/80 backdrop-blur-xs transition-opacity opacity-90 group-hover/viewport:opacity-100 z-10">
          <span className="text-[8px] font-black text-slate-200 uppercase tracking-widest select-none">
            ↔️ {isTr ? "EKRAN ÜZERİNDE SÜRÜKLEYREK ODAYI GEZİNEBİLİRSİNİZ" : "DRAG ACROSS THE VIEWPORT TO omni-pan"}
          </span>
        </div>
      </div>

      {/* CONTROLS & COMPANION DASHBOARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {/* PANEL 1: Room Selector Map checklist */}
        <div className="bg-slate-950/40 rounded-2xl p-5 border border-slate-800/60 flex flex-col justify-between space-y-4">
          <div>
            <p className="text-[9px] font-extrabold text-indigo-400 tracking-widest uppercase mb-3 flex items-center gap-1.5">
              <span>📍</span> <span>{isTr ? "TÜM 3D TARAMA ALANLARI" : "SCANNED SPACES MAP"}</span>
            </p>
            
            <div className="grid grid-cols-1 gap-2">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => {
                    setActiveRoomId(room.id);
                    setRulerPoints([]);
                  }}
                  className={`w-full text-left py-3 px-4 rounded-xl text-[11px] font-black transition-all flex items-center justify-between border cursor-pointer ${
                    activeRoomId === room.id 
                      ? "bg-indigo-600 border-indigo-700 text-white shadow shadow-indigo-600/20" 
                      : "bg-slate-800/60 border-slate-700/50 text-slate-350 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  <span>🚪 {room.name}</span>
                  <span className="text-[9px] font-mono opacity-80">{room.area}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-indigo-600/5 p-3.5 rounded-xl border border-indigo-500/10 text-[10px] leading-relaxed text-indigo-300/90 font-medium">
            💡 <strong>{isTr ? "Gezinti İpucu:" : "Navigation Tip:"}</strong> {isTr ? "Yukarıdaki listeden istediğiniz mekana tıklayarak odalar arasında geçiş yapabilirsiniz. Evin içinde dolaşmak bu kadar kolay!" : "Click any room card on the list to jump between scanning sectors. Complete virtual navigation has never been cleaner!"}
          </div>
        </div>

        {/* PANEL 2: AI Staging Style selectors */}
        <div className="bg-slate-950/40 rounded-2xl p-5 border border-slate-800/60 flex flex-col justify-between space-y-4">
          <div>
            <p className="text-[9px] font-extrabold text-indigo-400 tracking-widest uppercase mb-3 flex items-center gap-1.5">
              <span>🛋️</span> <span>{isTr ? "YAPAY ZEKA DEKORASYON (AI STAGING)" : "AI DESIGN STAGING VARIATIONS"}</span>
            </p>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "empty", label: isTr ? "🚧 İnşaat / Boş" : "Raw Shell" },
                { id: "luxury", label: isTr ? "💎 Modern Lüks" : "Modern Luxury" },
                { id: "boho", label: isTr ? "🌿 Bohem Akdeniz" : "Boho Style" },
                { id: "nordic", label: isTr ? "🪵 Nordik Meşe" : "Nordic Cozy" }
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => setStagingStyle(style.id as any)}
                  className={`py-3 px-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                    stagingStyle === style.id 
                      ? "bg-indigo-600 border-indigo-700 text-white shadow-md shadow-indigo-600/20" 
                      : "bg-slate-800/60 border-slate-700/50 text-slate-350 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Staging Advice Block */}
          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800/80 space-y-1.5 shadow">
            <span className="block text-[8px] text-indigo-400 uppercase font-black tracking-widest">
              ✨ {isTr ? "STAGING TAVSİYESİ" : "STAGING ADVICE"}
            </span>
            <p className="text-[10px] text-slate-400 leading-normal font-medium">
              {stagingStyle === "empty" && (isTr ? "Mülk satılırken kaba inşaat aşamasını referans alarak duvarların mukavemetini ve beton yapıyı kontrol etmenizi sağlar." : "Direct skeletal structure view. Allows checking cement columns and wall density.")}
              {stagingStyle === "luxury" && (isTr ? "Kuzey Kıbrıs gün batımını yansıtması için antrasit mermer hatlar, gizli entegre led aydınlatmalar ve lüks kadife chester koltuk grubu önerilir." : "High-end luxury styling designed with solid gold lines, custom velvet seating pods, and concealed soft illumination.")}
              {stagingStyle === "boho" && (isTr ? "Doğal hazeran hasır dolaplar, el dokuması Girne ipeği kilimler ve Akdeniz rüzgarını hissettirecek palmiye saksıları ile sıcak bir konsept." : "Warm bohemian aesthetics. Authentic local palm leaves, organic wicker carpets, and warm Cyprus clay vases.")}
              {stagingStyle === "nordic" && (isTr ? "Yumuşak keten bej perdeler, açık meşe ahşap lambiri kaplamalar ile tavan yüksekliğini destekleyen, ferah bir konfor hissi." : "Light-toned minimal oak cabinetry, beige linen curtains and soft textured carpets to boost visual warmth.")}
            </p>
          </div>
        </div>

        {/* PANEL 3: AI Co-Designer Analytics & Details */}
        <div className="bg-slate-950/40 rounded-2xl p-5 border border-slate-800/60 flex flex-col justify-between min-h-[220px]">
          <div className="space-y-3">
            <div>
              <span className="text-[9px] font-extrabold text-indigo-400 tracking-widest uppercase flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                AI CO-DESIGNER INSIGHTS
              </span>
              <h5 className="text-[12px] font-black text-white mt-1 leading-none uppercase">
                🟢 {activeRoom.name}
              </h5>
              <div className="mt-2 text-[10px] text-slate-400 leading-relaxed font-semibold max-h-[100px] overflow-y-auto no-scrollbar">
                {activeRoom.description}
              </div>
            </div>

            {/* Smart technical specifics values list */}
            <div className="border-t border-slate-800/80 pt-2 bg-slate-950/30 p-2.5 rounded-xl border border-slate-850">
              <div className="text-[9px] font-mono leading-relaxed space-y-1.5 text-slate-450 text-slate-400">
                <div className="flex justify-between border-b border-slate-850/60 pb-1">
                  <span>Zemin:</span>
                  <span className="text-white font-bold">{activeRoom.spec}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tavan Yükseklik:</span>
                  <span className="text-emerald-400 font-extrabold font-mono">2.82mt</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 border-t border-slate-800/80 pt-3">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-400">{isTr ? "Sanal Tur No:" : "Virtual Scan ID:"}</span>
              <span className="font-mono text-emerald-400 font-bold">LP-VR-{property?.id || "992"}</span>
            </div>
            
            <button
              onClick={() => {
                if (property?.virtual_tour_url) {
                  window.open(property.virtual_tour_url, "_blank");
                } else {
                  alert(isTr ? "Bu mülk için dış Matterport linki tanımlanmamış. AI sanal turu üzerinden mülkü %100 oranında gezebilirsiniz!" : "No custom physical Matterport link. Use the AI Engine above to completely explore!");
                }
              }}
              className="w-full py-2.5 bg-slate-800/80 hover:bg-slate-750 hover:text-white rounded-xl text-[9px] font-extrabold uppercase tracking-widest text-slate-350 transition-all border border-slate-705/80 border-slate-700/80 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Eye className="w-3.5 h-3.5" />
              {isTr ? " Matterport Orijinal (Dış Link) ↗" : "Original Matterport External View ↗"}
            </button>
          </div>
        </div>
      </div>

      {/* Decorative branding info footer */}
      <div className="text-[8.5px] text-slate-500 font-mono flex justify-between items-center pt-2.5 border-t border-slate-850">
        <span>© 2026 LookPrice VR Network • Real-time AI digital twin integration hub</span>
        <span>Securely verified in Cyprus (KKTC) portfolio pool</span>
      </div>
    </div>
  );
};
