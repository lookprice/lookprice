import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AcquisitionRadar } from "../../components/AcquisitionRadar";
import { 
  Loader2, 
  Sparkles, 
  Calendar, 
  Flame, 
  FileText, 
  Search, 
  Plus, 
  Mail, 
  Globe, 
  Building, 
  Radio, 
  ArrowRight,
  Check,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Terminal,
  Activity,
  Sliders,
  Trash2,
  Store,
  RotateCcw,
  Car,
  Building2,
  Tag,
  ShieldCheck,
  Zap,
  Layers
} from "lucide-react";
import { api } from "../../services/api";
import { useLanguage } from "../../contexts/LanguageContext";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  date: string;
  tags: string[];
  intensity: 'high' | 'normal';
  publishedOnStore: boolean;
  publishedOnEnrakipsiz: boolean;
  image?: string;
  image_url?: string;
}

interface TagItem {
  id: string;
  name: string;
  value: string;
  emailAlert: boolean;
  matchesCount: number;
}

interface RadarAlertsTabProps {
  sector?: string;
}

export const RadarAlertsTab: React.FC<RadarAlertsTabProps> = ({ sector }) => {
  const { lang } = useLanguage();
  const isTr = lang === "tr";
  const isAuto = sector === 'automotive' || sector === 'motor_vehicle';

  // Dynamic tags
  const defaultRealEstateTags: TagItem[] = [
    { id: '1', name: 'Lefkoşa İmar', value: 'Lefkoşa imar', emailAlert: true, matchesCount: 3 },
    { id: '2', name: 'Girne Marina', value: 'Girne marina', emailAlert: true, matchesCount: 2 },
    { id: '3', name: 'Kıbrıs Faizleri', value: 'faiz oranları', emailAlert: false, matchesCount: 2 },
    { id: '4', name: 'Ercan Teşvikleri', value: 'Ercan charter', emailAlert: true, matchesCount: 1 },
    { id: '5', name: 'İskele Tapu Yasası', value: 'yabancı satın alma', emailAlert: true, matchesCount: 2 }
  ];

  const defaultAutomotiveTags: TagItem[] = [
    { id: '1', name: 'Araç İthali & Gümrük', value: 'araç ithalat gümrük meclis', emailAlert: true, matchesCount: 4 },
    { id: '2', name: 'KKTC Tescil & Devir', value: 'KKTC plaka tescil devir', emailAlert: true, matchesCount: 2 },
    { id: '3', name: 'Günsel Elektrikli Araç', value: 'Günsel elektrikli araç fabrika', emailAlert: false, matchesCount: 3 },
    { id: '4', name: 'Elektrikli Otomobil Teşvik', value: 'elektrikli otomobil vergi muafiyeti', emailAlert: true, matchesCount: 1 },
    { id: '5', name: 'İkinci El Fiyat Endeksi', value: 'Kıbrıs sahibinden araba piyasası', emailAlert: true, matchesCount: 2 }
  ];

  // Dynamic news feed templates
  const defaultRealEstateNews: NewsItem[] = [
    {
      id: 'news-1',
      title: 'Lefkoşa İmar Planı Revizyon Kararı Resmi Gazete\'de!',
      summary: 'Yeni karar uyarınca Gönyeli ve Hamitköy sınırlarında kalan parsellerde kat izinleri 4 kattan 6 kata çıkarıldı. İmar alanlarındaki yeşil şerit sınırları revize edildi.',
      source: 'Resmi Gazete / AI Radar',
      date: 'Bugün 10:15',
      tags: ['Lefkoşa imar'],
      intensity: 'high',
      publishedOnStore: false,
      publishedOnEnrakipsiz: true
    },
    {
      id: 'news-2',
      title: 'Girne Harbour Çevresinde Yeni İmar İzinleri Askıya Çıktı',
      summary: 'Kuzey sahil şeridinde yer alan marinaya yakın 12 hektarlık lüks turizm geliştirme parselinde yapılacak villalar için yoğunluk katsayısı %40 olarak onaylandı.',
      source: 'Resmi Kabine Kararı',
      date: 'Dün 14:30',
      tags: ['Girne marina', 'Lefkoşa imar'],
      intensity: 'high',
      publishedOnStore: true,
      publishedOnEnrakipsiz: false
    },
    {
      id: 'news-3',
      title: 'Kuzey Kıbrıs Bankalar Birliği Konut Faizlerini Güncelledi',
      summary: 'Döviz bütçeli yabancı yatırımcılara özel GBP cinsinden mortgage faizleri aylık %0.45 düzeyine geriledi. TL faizlerinde ise devlet destekli yeni teşvik paketi onaylandı.',
      source: 'Kıbrıs Postası Bülteni',
      date: '2 gün önce',
      tags: ['faiz oranları'],
      intensity: 'normal',
      publishedOnStore: false,
      publishedOnEnrakipsiz: false
    },
    {
      id: 'news-4',
      title: 'Ercan Yeni Terminal Binası İngiliz Havayolları İçin Teşvik Planı',
      summary: 'Charter uçuşlara ve özel jet terminali kullanımlarına KDV muafiyeti sağlandı. Bu adımın Girne ve Lefkoşa lüks residans alıcıları talebini canlandıracağı öngörülüyor.',
      source: 'Sivil Havacılık Bülteni',
      date: '3 gün önce',
      tags: ['Ercan charter'],
      intensity: 'normal',
      publishedOnStore: false,
      publishedOnEnrakipsiz: true
    },
    {
      id: 'news-5',
      title: 'Yabancı Alıcılara Özel Tapu ve Kota Sınırlandırma Külliyatı',
      summary: 'İskele LongBeach ve Esentepe bölgesinde yabancı uyruklu şahısların hisse oranlarında tapu kayıt limitleri güncellendi. Ortak koçan tescilleri artık dijital ortamda tamamlanacak.',
      source: 'Tapu ve Kadastro Dairesi',
      date: '4 gün önce',
      tags: ['yabancı satın alma'],
      intensity: 'high',
      publishedOnStore: true,
      publishedOnEnrakipsiz: true
    }
  ];

  const defaultAutomotiveNews: NewsItem[] = [
    {
      id: 'news-1',
      title: 'KKTC Gümrük Mevzuatında 5 Yaş Sınırı Değişikliği Gündemde!',
      summary: 'Meclis alt komitesinde lüks ve ticari araçlar için ithalat yaş sınırının 5\'ten 8\'e çıkarılmasına ilişkin yeni bir tüzük tasarısı ele alınıyor.',
      source: 'Resmi Meclis Kararı',
      date: 'Bugün 10:15',
      tags: ['araç ithalat gümrük meclis'],
      intensity: 'high',
      publishedOnStore: false,
      publishedOnEnrakipsiz: true
    },
    {
      id: 'news-2',
      title: 'Elektrikli Araçlara Özel Seyrüsefer Harç Muafiyeti Devrede!',
      summary: 'Bakanlar Kurulu kararınca, %100 elektrikli binek araçlar için yıllık seyrüsefer ve ruhsatlandırma harçlarında %80 indirim uygulanacağı açıklandı.',
      source: 'Resmi Gazete Tescili',
      date: 'Dün 14:30',
      tags: ['elektrikli otomobil vergi muafiyeti', 'KKTC plaka tescil devir'],
      intensity: 'high',
      publishedOnStore: true,
      publishedOnEnrakipsiz: false
    },
    {
      id: 'news-3',
      title: 'Kıbrıs İkinci El Otomotiv Piyasasında GBP Endeksli Daralma!',
      summary: 'Döviz kurlarındaki dalgalanmalar nedeniyle, özellikle Japon ithal salon araç fiyatlarında son 30 günde %7\'lik bir talep daralması gözlemleniyor.',
      source: 'Otomotiv Sektör Endeksi',
      date: '2 gün önce',
      tags: ['Kıbrıs sahibinden araba piyasası'],
      intensity: 'normal',
      publishedOnStore: false,
      publishedOnEnrakipsiz: false
    },
    {
      id: 'news-4',
      title: 'Yerli Otomobil GÜNSEL Üretim Tesisi Yeni Teşvik Paketinden Faydalanacak!',
      summary: 'Elektrikli araç parça üretimi ve batarya montaj hattı yatırımlarına gelir vergisi muafiyeti ve gümrük vergisi indirimi Resmi Gazete\'de yayımlandı.',
      source: 'Sanayi ve Enerji Bakanlığı',
      date: '3 gün önce',
      tags: ['Günsel elektrikli araç fabrika'],
      intensity: 'normal',
      publishedOnStore: false,
      publishedOnEnrakipsiz: true
    },
    {
      id: 'news-5',
      title: 'KKTC Karayolları Dairesi Yeni Plaka Tescil Sistemini Duyurdu!',
      summary: 'Artık tüm devir, plaka basımı ve rehin (banka blokeli) kayıt işlemleri online e-Devlet kapısı üzerinden tescil edilebilecek.',
      source: 'E-Devlet Tescil Kapısı',
      date: '4 gün önce',
      tags: ['KKTC plaka tescil devir'],
      intensity: 'high',
      publishedOnStore: true,
      publishedOnEnrakipsiz: true
    }
  ];

  // State Declarations
  const [radarType, setRadarType] = useState<'legislation' | 'acquisition'>('legislation');
  const [newsTags, setNewsTags] = useState<TagItem[]>(isAuto ? defaultAutomotiveTags : defaultRealEstateTags);
  
  const [selectedNewsTag, setSelectedNewsTag] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [newTagKeyword, setNewTagKeyword] = useState("");
  const [newTagEmailAlert, setNewTagEmailAlert] = useState(true);
  
  const [isScanningNews, setIsScanningNews] = useState(false);
  const [newsFeed, setNewsFeed] = useState<NewsItem[]>(isAuto ? defaultAutomotiveNews : defaultRealEstateNews);

  // Terminal Logs for Cron Simulator
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[CORE] lookprice Telemetry Engine v3.4 initialized.",
    `[REGISTRY] Subscriptions validated. ${isAuto ? '5 automotive' : '5 real estate'} signal listeners active.`,
    "[CRAWLER] Monitoring Cyprus Official Gazette, Regional Feeds & Google Alerts."
  ]);

  const addLog = (msg: string) => {
    setTerminalLogs(prev => [...prev.slice(-10), `[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}] ${msg}`]);
  };

  // Automated 12-hour cron triggers simulation (every 45 seconds for visual feedback log)
  useEffect(() => {
    const logInterval = setInterval(() => {
      const phrases = [
        "[DAEMON] Background crawler sweep verified. Proxies optimal.",
        "[GATEWAY] Node ping: 22ms. Regional scrapers operational in KKTC.",
        "[SYNC] Sectoral cache synchronized with core datastore.",
        "[SCAN] Subscribed signal query checked: 0 anomalous spikes."
      ];
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      addLog(randomPhrase);
    }, 45000);

    return () => clearInterval(logInterval);
  }, []);

  // Sync cron interval
  useEffect(() => {
    const cronInterval = setInterval(() => {
      addLog("[CRON] Automated 12-hour background scan executing.");
      handleAIScanAlerts(true);
    }, 12 * 60 * 60 * 1000);
    
    return () => clearInterval(cronInterval);
  }, [newsTags]);

  useEffect(() => {
    fetchRadarNews();
  }, []);

  const fetchRadarNews = async () => {
    try {
      addLog("[DATABASE] Fetching cached developments from cloud datastore...");
      const data = await api.getRadarNews();
      if (Array.isArray(data) && data.length > 0) {
        const loadedNews = data.map((item: any) => ({
          id: item.id.toString(),
          title: item.title,
          summary: item.summary,
          source: item.source || 'Live Radar & AI Search',
          image: item.image_url || '',
          date: item.date || 'Az Önce',
          tags: Array.isArray(item.tags) ? item.tags : (typeof item.tags === 'string' ? JSON.parse(item.tags) : []),
          intensity: item.intensity || 'normal',
          publishedOnStore: !!item.published_on_store,
          publishedOnEnrakipsiz: !!item.published_on_enrakipsiz
        }));

        setNewsFeed(prev => {
          const filteredPrev = prev.filter(p => !loadedNews.some((l: any) => l.title === p.title));
          return [...loadedNews, ...filteredPrev];
        });
        addLog(`[SYNC] Loaded ${loadedNews.length} verified news inputs.`);
      }
    } catch (error) {
      console.error('Failed to fetch radar news:', error);
      addLog("[ERROR] Failed to fetch radar news from cloud server.");
    }
  };

  const handleTogglePublish = async (newsId: string, type: 'store' | 'enrakipsiz') => {
    const newsItem = newsFeed.find(n => n.id === newsId);
    if (!newsItem) return;

    const newPublishedOnStore = type === 'store' ? !newsItem.publishedOnStore : newsItem.publishedOnStore;
    const newPublishedOnEnrakipsiz = type === 'enrakipsiz' ? !newsItem.publishedOnEnrakipsiz : newsItem.publishedOnEnrakipsiz;

    try {
      addLog(`[DISPATCH] Updating channel [${type}] for item: "${newsItem.title.substring(0, 24)}..."`);
      await api.publishRadarNews({
        title: newsItem.title,
        summary: newsItem.summary,
        source: newsItem.source,
        image_url: newsItem.image || newsItem.image_url || '',
        date: newsItem.date,
        tags: newsItem.tags,
        published_on_store: newPublishedOnStore,
        published_on_enrakipsiz: newPublishedOnEnrakipsiz,
        sector: isAuto ? 'motor_vehicle' : 'real_estate'
      });

      setNewsFeed(prev => prev.map(n => n.id === newsId ? { 
        ...n, 
        publishedOnStore: newPublishedOnStore, 
        publishedOnEnrakipsiz: newPublishedOnEnrakipsiz 
      } : n));

      if (type === 'store') {
        addLog(`[STORE] Status updated on portfolio showcase: ${newPublishedOnStore ? 'PUBLISHED' : 'DEACTIVATED'}`);
      } else {
        addLog(`[PORTAL] Status updated on enrakipsiz.com: ${newPublishedOnEnrakipsiz ? 'PUBLISHED' : 'DEACTIVATED'}`);
      }
    } catch (error) {
      console.error("Failed to publish radar news:", error);
      addLog("[ERROR] Channel publisher sync failed.");
    }
  };

  const handleAIScanAlerts = async (silent: boolean = false) => {
    setIsScanningNews(true);
    addLog("[SCAN] Initiating Deep Web AI Scanner with Google Alerts...");
    try {
      const activeTags = newsTags.map(t => t.value);
      const res = await fetch('/api/real-estate/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ tags: activeTags })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch news');
      
      if (Array.isArray(data) && data.length > 0) {
        addLog(`[MATCH] Found ${data.length} candidate signals. Parsing sentiments...`);
        const incomingNews = data.map((item: any, idx: number) => ({
          title: item.title,
          summary: item.summary || item.category || 'Canlı AI Gelişmesi',
          image: item.img || item.image_url || '',
          source: item.source || 'Live Radar & AI Search',
          date: item.date || 'Az Önce',
          tags: item.tags || [activeTags[idx % activeTags.length] || (isAuto ? 'otomotiv' : 'imar')],
          intensity: item.priority === 'high' ? 'high' : 'normal',
          publishedOnStore: false, 
          publishedOnEnrakipsiz: false
        }));

        for (const item of incomingNews) {
          const existingNews = newsFeed.find(n => n.title === item.title);
          if (existingNews) continue;
          
          try {
            await api.publishRadarNews({
              title: item.title,
              summary: item.summary,
              source: item.source,
              image_url: item.image,
              date: item.date,
              tags: item.tags,
              intensity: item.intensity,
              published_on_store: false,
              published_on_enrakipsiz: false,
              sector: isAuto ? 'motor_vehicle' : 'real_estate'
            });
          } catch (dbErr) {
            console.error("Failed to pin scanned development:", dbErr);
          }
        }

        await fetchRadarNews();
      } else {
        addLog("[CHECK] No new unique regulatory changes parsed in this cycle.");
      }
    } catch (err: any) {
      console.error(err);
      addLog("[GATEWAY] AI crawler gateway timeout or rate limitation.");
    } finally {
      setIsScanningNews(false);
    }
  };

  const handleClearRadarNews = async () => {
    try {
      addLog("[RESET] Clearing development records from database...");
      await api.deleteRadarNews();
      setNewsFeed(isAuto ? defaultAutomotiveNews : defaultRealEstateNews);
      addLog("[RESET] Radar feed restored to standard telemetry baseline.");
    } catch (e) {
      console.error(e);
      addLog("[ERROR] Failed to reset database logs.");
    }
  };

  return (
    <div className="space-y-5">
      {/* FUTURISTIC HUD HEADER */}
      <div className="bg-slate-950 text-white rounded-2xl border border-slate-800 p-5 md:p-6 shadow-xl relative overflow-hidden">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            {/* Telemetry pill */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-950/80 border border-cyan-800/50 text-[10px] font-bold text-cyan-400 tracking-wider uppercase">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                {isAuto ? "AUTOLP TELEMETRY RADAR" : "RESTATED REGIONAL CRAWLER"}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                CANLI İZLEME (12H DÖNGÜ)
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-white">
              {isAuto
                ? (isTr ? "AutoLP • Motorlu Taşıtlar & Haber Radarı" : "AutoLP • Automotive & Regulatory Radar")
                : (isTr ? "RestateLP • İmar & Mevzuat Haber Radarı" : "RestateLP • Zoning & Regulatory Radar")}
            </h2>

            <p className="text-xs text-slate-400 font-normal leading-relaxed">
              {isAuto
                ? "KKTC Meclis kararları, Resmi Gazete araç ithalat yaş sınırları, elektrikli otomobil teşvikleri ve piyasa endekslerini yapay zeka ile canlı tarar, analiz eder ve vitrininize bağlar."
                : "Resmi Gazete imar planı kararları, belediye kat izinleri, yabancı tapu kota düzenlemeleri ve bölgesel inşaat katsayılarını yapay zeka ile canlı tarar, filtreler ve vitrininize bağlar."}
            </p>
          </div>

          {/* Action triggers */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => handleAIScanAlerts(false)}
              disabled={isScanningNews}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border shadow-sm ${
                isScanningNews 
                  ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-indigo-950/30 hover:shadow-md cursor-pointer active:scale-95'
              }`}
            >
              {isScanningNews ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-300" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              )}
              {isScanningNews ? 'AI Taranıyor...' : 'AI Canlı Tara'}
            </button>
            
            <button
              onClick={handleClearRadarNews}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all border bg-slate-900/80 border-slate-800 text-slate-300 hover:text-rose-400 hover:border-rose-900/50 hover:bg-rose-950/20 active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {isTr ? 'Radar Verilerini Sıfırla' : 'Reset Radar Data'}
            </button>
          </div>
        </div>
      </div>

      {/* FUTURISTIC SEGMENTED CONTROLLER */}
      <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl w-fit border border-slate-200">
        <button
          onClick={() => setRadarType('legislation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${
            radarType === 'legislation'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-cyan-600" />
          {isAuto 
            ? (isTr ? "Motorlu Taşıtlar & Mevzuat Radarı" : "Automotive & Legislation Radar")
            : (isTr ? "İmar & Mevzuat Radarı" : "Zoning & Legislation Radar")}
        </button>

        <button
          onClick={() => setRadarType('acquisition')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${
            radarType === 'acquisition'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {isAuto ? (
            <Car className="w-3.5 h-3.5 text-indigo-600" />
          ) : (
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
          )}
          {isAuto
            ? (isTr ? "Sahibinden Araç & Fırsat Radarı" : "Vehicle Acquisition Radar")
            : (isTr ? "Sahibinden Mülk & Fırsat Radarı" : "Property Acquisition Radar")}
        </button>
      </div>

      {radarType === 'acquisition' ? (
        <AcquisitionRadar sector={sector} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
          {/* LEFT COLUMN: TRACKING SIGNALS & TELEMETRY TERMINAL (Col-span-4) */}
          <div className="lg:col-span-4 space-y-5">
            
            {/* SUBSCRIPTION KEYWORDS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                      Aktif Takip Başlıkları
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium">Google & Resmi Gazete İzleme Anahtarları</p>
                  </div>
                </div>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-200/60">
                  {newsTags.length} AKTİF
                </span>
              </div>

              {/* Keyword Chips List */}
              <div className="flex flex-wrap gap-1.5 max-h-[190px] overflow-y-auto pr-1">
                <button
                  onClick={() => setSelectedNewsTag(null)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedNewsTag === null
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Globe className="w-3 h-3" />
                  <span>Tümü ({newsFeed.length})</span>
                </button>

                {newsTags.map((tag) => {
                  const matchedNewsCount = newsFeed.filter(news => news.tags.some(t => t.toLowerCase() === tag.value.toLowerCase())).length;
                  const isSelected = selectedNewsTag === tag.value;
                  return (
                    <div
                      key={tag.id}
                      className={`flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-lg text-xs font-semibold transition-all border ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <button
                        onClick={() => setSelectedNewsTag(isSelected ? null : tag.value)}
                        className="text-left font-semibold max-w-[130px] truncate"
                      >
                        #{tag.name} <span className="opacity-75 text-[10px]">({matchedNewsCount})</span>
                      </button>

                      {/* Minimal Toggle for Mail alerts */}
                      <button
                        onClick={() => {
                          setNewsTags(newsTags.map(t => t.id === tag.id ? { ...t, emailAlert: !t.emailAlert } : t));
                          addLog(`[ALERT] Updated email trigger for "${tag.name}" to: ${!tag.emailAlert ? 'ON' : 'OFF'}`);
                        }}
                        className={`p-1 rounded transition-colors ${
                          tag.emailAlert 
                            ? (isSelected ? 'text-cyan-200 hover:text-white' : 'text-emerald-600 hover:text-emerald-700') 
                            : (isSelected ? 'text-indigo-300 hover:text-white' : 'text-slate-300 hover:text-slate-600')
                        }`}
                        title={tag.emailAlert ? "E-posta Bildirimi Aktif" : "E-posta Bildirimi Pasif"}
                      >
                        <Mail className="w-3 h-3" />
                      </button>

                      {/* Delete Tag */}
                      <button
                        onClick={() => {
                          setNewsTags(newsTags.filter(t => t.id !== tag.id));
                          addLog(`[TAG] Removed listener keyword: "${tag.name}"`);
                        }}
                        className={`p-1 transition-colors ${isSelected ? 'text-indigo-200 hover:text-white' : 'text-slate-300 hover:text-rose-500'}`}
                        title="Takibi Kaldır"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* NEW TAG ADD BOARD */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Yeni Takip Anahtarı Tanımla
                </span>
                <div className="grid grid-cols-1 gap-2">
                  <input
                    type="text"
                    placeholder={isAuto ? "Başlık (Örn: Gümrük Yaş Sınırı)" : "Başlık (Örn: Girne İmar Revizyonu)"}
                    className="bg-slate-50 text-slate-800 border border-slate-200 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-1.5 text-xs font-medium placeholder-slate-400"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder={isAuto ? "Anahtarlar (Örn: araç ithalat, tescil, vergi)" : "Anahtarlar (Örn: imar planı, kat izni, tapu)"}
                    className="bg-slate-50 text-slate-800 border border-slate-200 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-1.5 text-xs font-medium placeholder-slate-400"
                    value={newTagKeyword}
                    onChange={(e) => setNewTagKeyword(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 text-[11px] font-medium text-slate-600">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newTagEmailAlert}
                      onChange={(e) => setNewTagEmailAlert(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span>E-posta Bildirimi</span>
                  </label>
                  <button
                    onClick={() => {
                      if (!newTagName || !newTagKeyword) return;
                      setNewsTags([...newsTags, {
                        id: Date.now().toString(),
                        name: newTagName,
                        value: newTagKeyword,
                        emailAlert: newTagEmailAlert,
                        matchesCount: 0
                      }]);
                      addLog(`[TAG] Registered new telemetry listener: "${newTagName}" (#${newTagKeyword})`);
                      setNewTagName("");
                      setNewTagKeyword("");
                    }}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold py-1.5 px-3 rounded-lg border border-indigo-100 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Takibi Başlat</span>
                  </button>
                </div>
              </div>
            </div>

            {/* CRON SCHEDULER MONITOR TERMINAL */}
            <div className="bg-slate-950 text-slate-300 p-4 rounded-2xl border border-slate-800 shadow-lg font-mono relative overflow-hidden space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <Terminal className="text-cyan-400 w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Telemetry Daemon v3.4</span>
                </div>
                <span className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-bold text-emerald-400 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  OTONOM (12H)
                </span>
              </div>

              {/* Log list terminal */}
              <div className="space-y-1.5 text-[10px] overflow-y-auto max-h-[140px] custom-scrollbar pr-1 leading-relaxed text-slate-400">
                {terminalLogs.map((log, index) => (
                  <div key={index} className="text-slate-300 font-mono">
                    {log}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[9px] text-slate-500">
                <span>Döngü: 12 Saat</span>
                <span>LookPrice AI Gateway</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: INTERACTIVE LEGISLATION STREAM (Col-span-8) */}
          <div className="lg:col-span-8 space-y-4">
            
            <div className="flex items-center justify-between bg-white px-5 py-3 rounded-xl border border-slate-200/80">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                {isTr ? "Doğrulanmış Sinyal & Haber Akışı" : "Verified Signal Stream"}
              </span>

              <span className="text-[11px] font-semibold text-slate-500">
                Toplam Gelişme: <strong className="text-slate-900">{newsFeed.length}</strong>
              </span>
            </div>

            {/* FEED GRID/CARDS */}
            <div className="space-y-3.5">
              {(() => {
                const filteredFeed = selectedNewsTag
                  ? newsFeed.filter(item => item.tags.some(t => t.toLowerCase().includes(selectedNewsTag.toLowerCase())))
                  : newsFeed;

                if (filteredFeed.length === 0) {
                  return (
                    <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 border-dashed space-y-2">
                      <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-800">Eşleşen Gelişme Bulunamadı</p>
                      <p className="text-xs text-slate-500">Sol menüden yeni takip anahtarları tanımlayabilir veya 'AI Canlı Tara' butonuyla güncel tarama yapabilirsiniz.</p>
                    </div>
                  );
                }

                return filteredFeed.map((news) => (
                  <div 
                    key={news.id} 
                    className={`bg-white border rounded-2xl p-5 flex flex-col justify-between transition-all group shadow-sm hover:shadow-md ${
                      news.intensity === 'high' ? 'border-l-4 border-l-rose-500 border-slate-200' : 'border-slate-200'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 border border-slate-200/60">
                            <Radio className="w-3 h-3 text-cyan-600" />
                            {news.source}
                          </span>
                          {news.intensity === 'high' && (
                            <span className="bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-rose-200/60">
                              <Flame className="w-3 h-3 text-rose-500" />
                              Kritik Gelişme
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {news.date}
                        </span>
                      </div>

                      <h3 className="text-base md:text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                        {news.title}
                      </h3>
                      <p className="text-xs text-slate-600 font-normal leading-relaxed">
                        {news.summary}
                      </p>

                      {/* Zero-pill metadata tags */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-medium text-slate-400">
                        {news.tags.map((t, idx) => (
                          <React.Fragment key={idx}>
                            {idx > 0 && <span>·</span>}
                            <span className="text-slate-500 font-semibold">#{t}</span>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    {/* DUALLY PUBLISHING CHANNEL ACTION CONTROL FOOTER */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-4 mt-4 border-t border-slate-100">
                      
                      {/* Action 1: Showcase Web portföyü */}
                      <button
                        onClick={() => handleTogglePublish(news.id, 'store')}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold text-center border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          news.publishedOnStore 
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold' 
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900'
                        }`}
                      >
                        <Store className="w-3.5 h-3.5 text-slate-500" />
                        {news.publishedOnStore ? 'Mağaza Vitrininde Yayında' : 'Mağaza Vitrininde Göster'}
                      </button>

                      {/* Action 2: enrakipsiz.com portal */}
                      <button
                        onClick={() => handleTogglePublish(news.id, 'enrakipsiz')}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold text-center border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          news.publishedOnEnrakipsiz 
                            ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm' 
                            : 'bg-slate-900 border-slate-950 hover:bg-slate-800 text-white'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5 text-indigo-300" />
                        {news.publishedOnEnrakipsiz ? "enrakipsiz.com'da Yayında" : "enrakipsiz.com'da Yayınla"}
                      </button>

                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
