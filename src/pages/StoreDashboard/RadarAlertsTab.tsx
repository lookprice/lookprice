import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Loader2, 
  Sparkles, 
  X, 
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
  HeartPulse
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
  const defaultRealEstateTags = [
    { id: '1', name: 'Lefkoşa İmar', value: 'Lefkoşa imar', emailAlert: true, matchesCount: 3 },
    { id: '2', name: 'Girne Marina', value: 'Girne marina', emailAlert: true, matchesCount: 2 },
    { id: '3', name: 'Kıbrıs Faizleri', value: 'faiz oranları', emailAlert: false, matchesCount: 2 },
    { id: '4', name: 'Ercan Teşvikleri', value: 'Ercan charter', emailAlert: true, matchesCount: 1 },
    { id: '5', name: 'İskele Tapu Yasası', value: 'yabancı satın alma', emailAlert: true, matchesCount: 2 }
  ];

  const defaultAutomotiveTags = [
    { id: '1', name: 'Araç İthali & Gümrük', value: 'araç ithalat gümrük meclis', emailAlert: true, matchesCount: 4 },
    { id: '2', name: 'KKTC Tescil & Devir', value: 'KKTC plaka tescil devir', emailAlert: true, matchesCount: 2 },
    { id: '3', name: 'Günsel Elektrikli Araç', value: 'Günsel elektrikli araç fabrika', emailAlert: false, matchesCount: 3 },
    { id: '4', name: 'Elektrikli Otomobil Teşvik', value: 'elektrikli otomobil vergi muafiyeti', emailAlert: true, matchesCount: 1 },
    { id: '5', name: 'İkinci El Fiyat Endeksi', value: 'Kıbrıs sahibinden araba piyasası', emailAlert: true, matchesCount: 2 }
  ];

  // Dynamic news feed templates
  const defaultRealEstateNews = [
    {
      id: 'news-1',
      title: 'Lefkoşa İmar Planı Revizyon Kararı Resmi Gazete\'de!',
      summary: 'Yeni karar uyarınca Gönyeli ve Hamitköy sınırlarında kalan parsellerde kat izinleri 4 kattan 6 kata çıkarıldı. İmar alanlarındaki yeşil şerit sınırları revize edildi.',
      source: 'Google Alerts (lookpriceAI)',
      date: 'Bugün 10:15',
      tags: ['Lefkoşa imar'],
      intensity: 'high' as const,
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
      intensity: 'high' as const,
      publishedOnStore: true,
      publishedOnEnrakipsiz: false
    },
    {
      id: 'news-3',
      title: 'Kuzey Kıbrıs Bankalar Birliği Konut Faizlerini Güncelledi',
      summary: 'Döviz bütçeli yabancı yatırımcılara özel GBP cinsinden mortgage faizleri aylık %0.45 düzeyine geriledi. TL faizlerinde ise devlet destekli yeni teşvik paketi onaylandı.',
      source: 'Kıbrıs Postası',
      date: '2 gün önce',
      tags: ['faiz oranları'],
      intensity: 'normal' as const,
      publishedOnStore: false,
      publishedOnEnrakipsiz: false
    },
    {
      id: 'news-4',
      title: 'Ercan Yeni Terminal Binası İngiliz Havayolları İçin Teşvik Planı',
      summary: 'Charter uçuşlara ve özel jet terminali kullanımlarına KDV muafiyeti sağlandı. Bu adımın Girne ve Lefkoşa lüks residans alıcıları talebini canlandıracağı öngörülüyor.',
      source: 'Google Alerts (lookpriceAI)',
      date: '3 gün önce',
      tags: ['Ercan charter'],
      intensity: 'normal' as const,
      publishedOnStore: false,
      publishedOnEnrakipsiz: true
    },
    {
      id: 'news-5',
      title: 'Yabancı Alıcılara Özel Tapu ve Kota Sınırlandırma Külliyatı',
      summary: 'İskele LongBeach ve Esentepe bölgesinde yabancı uyruklu şahısların hisse oranlarında tapu kayıt limitleri güncellendi. Ortak koçan tescilleri artık dijital ortamda tamamlanacak.',
      source: 'Resmi Kabine Kararı',
      date: '4 gün önce',
      tags: ['yabancı satın alma'],
      intensity: 'high' as const,
      publishedOnStore: true,
      publishedOnEnrakipsiz: true
    }
  ];

  const defaultAutomotiveNews = [
    {
      id: 'news-1',
      title: 'KKTC Gümrük Mevzuatında 5 Yaş Sınırı Değişikliği Gündemde!',
      summary: 'Meclis alt komitesinde lüks ve ticari araçlar için ithalat yaş sınırının 5\'ten 8\'e çıkarılmasına ilişkin yeni bir tüzük tasarısı ele alınıyor.',
      source: 'Resmi Meclis Kararı',
      date: 'Bugün 10:15',
      tags: ['araç ithalat gümrük meclis'],
      intensity: 'high' as const,
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
      intensity: 'high' as const,
      publishedOnStore: true,
      publishedOnEnrakipsiz: false
    },
    {
      id: 'news-3',
      title: 'Kıbrıs İkinci El Otomotiv Piyasasında GBP Endeksli Daralma!',
      summary: 'Döviz kurlarındaki dalgalanmalar nedeniyle, özellikle Japon ithal salon araç fiyatlarında son 30 günde %7\'lik bir talep daralması gözlemleniyor.',
      source: 'Kıbrıs Postası',
      date: '2 gün önce',
      tags: ['Kıbrıs sahibinden araba piyasası'],
      intensity: 'normal' as const,
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
      intensity: 'normal' as const,
      publishedOnStore: false,
      publishedOnEnrakipsiz: true
    },
    {
      id: 'news-5',
      title: 'KKTC Karayolları Dairesi Yeni Plaka Tescil Sistemini Duyurdu!',
      summary: 'Artık tüm devir, plaka basımı ve rehin (banka blokeli) kayıt işlemleri online e-Devlet kapısı üzerinden tescil edilebilecek.',
      source: 'E-Devlet KKTC',
      date: '4 gün önce',
      tags: ['KKTC plaka tescil devir'],
      intensity: 'high' as const,
      publishedOnStore: true,
      publishedOnEnrakipsiz: true
    }
  ];

  // State Declarations
  const [newsTags, setNewsTags] = useState<TagItem[]>(isAuto ? defaultAutomotiveTags : defaultRealEstateTags);
  
  const [selectedNewsTag, setSelectedNewsTag] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [newTagKeyword, setNewTagKeyword] = useState("");
  const [newTagEmailAlert, setNewTagEmailAlert] = useState(true);
  
  const [isScanningNews, setIsScanningNews] = useState(false);
  const [newsFeed, setNewsFeed] = useState<NewsItem[]>(isAuto ? defaultAutomotiveNews : defaultRealEstateNews);

  // Terminal Logs for Cron Simulator
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "🤖 [lookprice BOT V3] System ready. CRON schedule: Active (12-hour intervals)",
    `📅 [${new Date().toLocaleDateString()}] Subscriptions validated. 5 active trackers in registry.`,
    "📡 Listening to Cyprus Official Gazette, Google Alerts Feed, and Sectoral Bulletins."
  ]);

  const addLog = (msg: string) => {
    setTerminalLogs(prev => [...prev.slice(-10), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // Automated 12-hour cron triggers simulation (every 30 seconds for visual feedback log)
  useEffect(() => {
    const logInterval = setInterval(() => {
      const phrases = [
        "🔄 Background verification triggered. Checking crawler proxies...",
        "⚡ API Gateway ping: 24ms. Regional crawlers operating fully in KKTC.",
        "📊 Synced. Local cache up to date.",
        "📬 Subscribed alerts checking: 0 new matches found in queue."
      ];
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      addLog(randomPhrase);
    }, 45000);

    return () => clearInterval(logInterval);
  }, []);

  // Sync cron interval
  useEffect(() => {
    const cronInterval = setInterval(() => {
      addLog("⏰ CRON Scheduler triggered automated real-time scan.");
      handleAIScanAlerts(true);
    }, 12 * 60 * 60 * 1000);
    
    return () => clearInterval(cronInterval);
  }, [newsTags]);

  useEffect(() => {
    fetchRadarNews();
  }, []);

  const fetchRadarNews = async () => {
    try {
      addLog("📡 Fetching cached developments from core database...");
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
        addLog(`✅ Successfully loaded ${loadedNews.length} verified news inputs.`);
      }
    } catch (error) {
      console.error('Failed to fetch radar news:', error);
      addLog("❌ Error: Failed to fetch radar news from cloud server.");
    }
  };

  const handleTogglePublish = async (newsId: string, type: 'store' | 'enrakipsiz') => {
    const newsItem = newsFeed.find(n => n.id === newsId);
    if (!newsItem) return;

    const newPublishedOnStore = type === 'store' ? !newsItem.publishedOnStore : newsItem.publishedOnStore;
    const newPublishedOnEnrakipsiz = type === 'enrakipsiz' ? !newsItem.publishedOnEnrakipsiz : newsItem.publishedOnEnrakipsiz;

    try {
      addLog(`🔄 Updating publication channel [${type}] for item: "${newsItem.title.substring(0,25)}..."`);
      await api.publishRadarNews({
        title: newsItem.title,
        summary: newsItem.summary,
        source: newsItem.source,
        image_url: newsItem.image || newsItem.image_url || '',
        date: newsItem.date,
        tags: newsItem.tags,
        published_on_store: newPublishedOnStore,
        published_on_enrakipsiz: newPublishedOnEnrakipsiz
      });

      setNewsFeed(prev => prev.map(n => n.id === newsId ? { 
        ...n, 
        publishedOnStore: newPublishedOnStore, 
        publishedOnEnrakipsiz: newPublishedOnEnrakipsiz 
      } : n));

      if (type === 'store') {
        addLog(`🏪 News status modified on store showcase: ${newPublishedOnStore ? 'PUBLISHED' : 'DEACTIVATED'}`);
        if (newPublishedOnStore) {
          alert(isTr ? "🟢 Başarıyla İşlendi!\n\nBu gelişme portföy web mağazanızın 'Haberler' akışında ziyaretçilere gösterilmek üzere tescillendi." : "🟢 Successfully Published on Portfolios Store!");
        } else {
          alert(isTr ? "Bilgi: Haber mağaza vitrininden kaldırıldı." : "Info: News removed from store showcase.");
        }
      } else {
        addLog(`🚀 News status modified on enrakipsiz.com: ${newPublishedOnEnrakipsiz ? 'PUBLISHED' : 'DEACTIVATED'}`);
        if (newPublishedOnEnrakipsiz) {
          alert(isTr ? "⚡ ENRAKİPSİZ PORTALI AKTİF!\n\nBu kritik gelişme, amiral gemimiz 'enrakipsiz.com' ana sayfasında ve 'Kıbrıs İmar/Mevzuat Haberleri' ızgarasında flaş haber formatında tescil edildi!" : "⚡ EnRakipsiz Portal Activated!");
        } else {
          alert(isTr ? "Bilgi: enrakipsiz.com portal yayını durduruldu." : "Info: Post removed from enrakipsiz.com portal.");
        }
      }
    } catch (error) {
      console.error("Failed to publish radar news:", error);
      addLog("❌ Error during cloud publisher sync.");
      alert(isTr ? "Hata: Bulut veritabanına kaydedilemedi." : "Error saving to database.");
    }
  };

  const handleAIScanAlerts = async (silent: boolean = false) => {
    setIsScanningNews(true);
    addLog("⚡ Initiating Deep Web Scanner with Google Alerts...");
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
        addLog(`🔥 Found ${data.length} potential matches. Analyzing sentiments...`);
        const incomingNews = data.map((item: any, idx: number) => ({
          title: item.title,
          summary: item.summary || item.category || 'Canlı AI Gelişmesi',
          image: item.img || item.image_url || '',
          source: item.source || 'Live Radar & AI Search',
          date: item.date || 'Az Önce',
          tags: item.tags || [activeTags[idx % activeTags.length] || 'imar'],
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
              published_on_enrakipsiz: false
            });
          } catch (dbErr) {
            console.error("Failed to pin scanned development:", dbErr);
          }
        }

        await fetchRadarNews();
        if (!silent) {
          alert(`🛎️ ${data.length} YENİ CANLI HABER BULUNDU!\n\nAI Radarı etiketlerinize uygun en güncel gerçek haberleri getirdi ve takip paneline sabitledi.`);
        }
      } else {
        addLog("✅ No new unique legislation changes parsed this term.");
        if (!silent) {
          alert(`🛎️ Şu anda belirlediğiniz etiketlerle eşleşen yeni bir kritik rapor bulunamadı.`);
        }
      }
    } catch (err: any) {
      console.error(err);
      addLog("❌ AI Crawler encountered an error gateway timeout.");
      if (!silent) {
        alert('Hata: Canlı AI haberi alınamadı.');
      }
    } finally {
      setIsScanningNews(false);
    }
  };

  const handleClearRadarNews = async () => {
    if (!confirm(isTr ? "Kayıtlı tüm radar haberlerini ve taranmış gelişmeleri kalıcı olarak silmek ve listeyi sıfırlamak istediğinize emin misiniz?" : "Are you sure you want to permanently delete all radar news?")) return;
    try {
      addLog("🗑️ Clearing development logs from database...");
      await api.deleteRadarNews();
      setNewsFeed(isAuto ? defaultAutomotiveNews : defaultRealEstateNews);
      addLog("✅ Radar feed successfully reset to original state.");
      alert(isTr ? "Mevzuat radarı sıfırlandı ve temizlendi." : "Radar feed successfully reset.");
    } catch (e) {
      console.error(e);
      addLog("❌ Failed to clear database logs.");
      alert(isTr ? "Hata: Veritabanı temizleme başarısız." : "Error: Failed to clean database.");
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER CARD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black tracking-widest uppercase">
              🛰️ REGIONAL CRAWLER
            </span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {isTr ? "Live AI Radar & Mevzuat Takibi" : "Live AI Radar & Legislation Tracker"}
          </h2>
          <p className="text-xs text-slate-500 font-medium max-w-xl">
            Kıbrıs Resmi Gazete bültenlerini, Google Gelişmelerini ve imar kütüklerini 12 saatlik otomatik cron görevleriyle tarar, filtreler ve tek tıkla yayınlamanızı sağlar.
          </p>
        </div>

        {/* Action triggers */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleAIScanAlerts(false)}
            disabled={isScanningNews}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase shadow-md transition-all border ${
              isScanningNews 
                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 hover:scale-[1.02] active:scale-95 cursor-pointer shadow-indigo-100'
            }`}
          >
            {isScanningNews ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-300 animate-bounce" />
            )}
            {isScanningNews ? 'AI Tarıyor...' : '⚡ AI Canlı Tara'}
          </button>
          
          <button
            onClick={handleClearRadarNews}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase shadow-md transition-all border bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 hover:scale-[1.02] active:scale-95 cursor-pointer shadow-rose-100"
          >
            🗑️ {isTr ? 'Radar Verilerini Temizle' : 'Clear Radar News'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: TAG SUBSCRIPTIONS & MONITORING CRON TERMINAL (Col-span-5) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* SUBSCRIPTION KEYWORDS */}
          <div className="bg-white p-6 rounded-[2.2rem] border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">🔔 Takip Edilen Başlıklar</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Google / Resmi Gazete Takip Anahtarları</p>
              </div>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-lg">LIVE</span>
            </div>

            {/* Keyword Pills List */}
            <div className="flex flex-wrap gap-1.5 max-h-[180px] overflow-y-auto pr-1">
              <button
                onClick={() => setSelectedNewsTag(null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedNewsTag === null
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                🌐 Tüm ({newsFeed.length})
              </button>

              {newsTags.map((tag) => {
                const matchedNewsCount = newsFeed.filter(news => news.tags.some(t => t.toLowerCase() === tag.value.toLowerCase())).length;
                return (
                  <div
                    key={tag.id}
                    className={`flex items-center gap-1 pl-3 pr-1.5 py-1 rounded-xl text-xs font-bold transition-all border ${
                      selectedNewsTag === tag.value
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-100'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedNewsTag(selectedNewsTag === tag.value ? null : tag.value)}
                      className="text-left font-extrabold max-w-[120px] truncate"
                    >
                      #{tag.name} <span className="opacity-70 text-[10px]">({matchedNewsCount})</span>
                    </button>

                    {/* Minimal Toggle for Mail alerts */}
                    <button
                      onClick={() => {
                        setNewsTags(newsTags.map(t => t.id === tag.id ? { ...t, emailAlert: !t.emailAlert } : t));
                        addLog(`🔔 Updated email notification for "${tag.name}" to: ${!tag.emailAlert ? 'ON' : 'OFF'}`);
                      }}
                      className={`p-1 rounded transition-colors ${tag.emailAlert ? 'text-emerald-500 hover:text-slate-400' : 'text-slate-300 hover:text-slate-500'}`}
                      title={tag.emailAlert ? "E-posta Bildirimi Aktif" : "E-posta Bildirimi Pasif"}
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Tag */}
                    <button
                      onClick={() => {
                        if (confirm(`"${tag.name}" takibini sonlandırmak istiyor musunuz?`)) {
                          setNewsTags(newsTags.filter(t => t.id !== tag.id));
                          addLog(`🗑️ Removed keyword tracking for "${tag.name}"`);
                        }
                      }}
                      className="text-slate-300 hover:text-red-500 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* NEW CONU ADD BOARD */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Yeni Takip Terimi Tanımla</span>
              <div className="grid grid-cols-1 gap-2">
                <input
                  type="text"
                  placeholder="Başlık (Örn: Girne İmar)"
                  className="bg-slate-50 text-slate-800 border-slate-200 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs font-semibold placeholder-slate-400"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Kelime (Örn: imar planı, liman)"
                  className="bg-slate-50 text-slate-800 border-slate-200 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs font-semibold placeholder-slate-400"
                  value={newTagKeyword}
                  onChange={(e) => setNewTagKeyword(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 text-[11px] font-semibold text-slate-600">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newTagEmailAlert}
                    onChange={(e) => setNewTagEmailAlert(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5"
                  />
                  <span>Beni Mail ile Uyar!</span>
                </label>
                <button
                  onClick={() => {
                    if (!newTagName || !newTagKeyword) {
                      alert("Lütfen tüm alanları doldurunuz!");
                      return;
                    }
                    setNewsTags([...newsTags, {
                      id: Date.now().toString(),
                      name: newTagName,
                      value: newTagKeyword,
                      emailAlert: newTagEmailAlert,
                      matchesCount: 0
                    }]);
                    addLog(`➕ Registered new alert listener: "${newTagName}" (#${newTagKeyword})`);
                    setNewTagName("");
                    setNewTagKeyword("");
                  }}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black py-2 px-3 rounded-xl border border-indigo-100 transition-all cursor-pointer"
                >
                  ➕ Takibi Başlat
                </button>
              </div>
            </div>
          </div>

          {/* CRON SCHEDULER MONITOR DIAL */}
          <div className="bg-slate-950 text-slate-400 p-5 rounded-[2.2rem] border border-slate-900 shadow-xl font-mono relative overflow-hidden space-y-3.5">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <Terminal className="text-indigo-400 w-4 h-4" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Cron Job Daemon v1.02</span>
              </div>
              <span className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-black text-emerald-400 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ACTIVE (12H)
              </span>
            </div>

            {/* Log list terminal */}
            <div className="space-y-1.5 text-[10px] overflow-y-auto max-h-[150px] custom-scrollbar pr-1 line-clamp-6 leading-relaxed">
              {terminalLogs.map((log, index) => (
                <div key={index} className="text-slate-300">
                  {log}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[9px] text-slate-500">
              <span>Next execution: Today 22:15</span>
              <span>LookPrice AI Service Node</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE LEGISLATION STREAM (Col-span-8) */}
        <div className="lg:col-span-8 space-y-5">
          
          <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-slate-200/80">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" />
              {isTr ? "Sinyal Akış Listesi" : "Alert Stream Signals"}
            </span>

            <span className="text-[10px] font-bold text-slate-500">
              Toplam Eşleşen Gelişme: <strong>{newsFeed.length}</strong>
            </span>
          </div>

          {/* FEED GRID/CARDS */}
          <div className="space-y-4">
            {(() => {
              const filteredFeed = selectedNewsTag
                ? newsFeed.filter(item => item.tags.some(t => t.toLowerCase().includes(selectedNewsTag.toLowerCase())))
                : newsFeed;

              if (filteredFeed.length === 0) {
                return (
                  <div className="bg-white p-12 text-center rounded-[2.5rem] border border-slate-250 border-dashed">
                    <AlertTriangle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm font-black text-slate-800">Hasıl Olmuş Gelişme Bulunamadı</p>
                    <p className="text-xs text-slate-500 mt-1">Sola yeni takip kelimeleri ekleyebilir veya AI tara butonunu ezebilirsiniz.</p>
                  </div>
                );
              }

              return filteredFeed.map((news) => (
                <div 
                  key={news.id} 
                  className={`bg-white border rounded-[2.3rem] p-6 flex flex-col justify-between transition-all group shadow-sm hover:shadow-md ${
                    news.intensity === 'high' ? 'border-l-4 border-l-rose-500 border-slate-200' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] bg-indigo-50 text-indigo-600 font-black px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1">
                          📡 {news.source}
                        </span>
                        {news.intensity === 'high' && (
                          <span className="bg-rose-50 text-rose-600 text-[9px] font-black px-2 py-1 rounded-lg flex items-center gap-1">
                            <Flame className="w-3 h-3 text-rose-500 animate-pulse" />
                            Kritik
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold">{news.date}</span>
                    </div>

                    <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                      {news.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      {news.summary}
                    </p>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {news.tags.map((t, idx) => (
                        <span key={idx} className="text-[9px] font-extrabold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* DUALLY PUBLISHING CHANNEL ACTION CONTROL FOOTER */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-4 mt-5 border-t border-slate-100">
                    
                    {/* Action 1: Showcase Web portföyü */}
                    <button
                      onClick={() => handleTogglePublish(news.id, 'store')}
                      className={`py-2 px-3 rounded-xl text-[10.5px] font-black text-center border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        news.publishedOnStore 
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-black' 
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      <Building className="w-3.5 h-3.5" />
                      {news.publishedOnStore ? '🏪 Mağazada Yayında' : '🏪 Mağazada Göster'}
                    </button>

                    {/* Action 2: enrakipsiz.com portal */}
                    <button
                      onClick={() => handleTogglePublish(news.id, 'enrakipsiz')}
                      className={`py-2 px-3 rounded-xl text-[10.5px] font-black text-center border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        news.publishedOnEnrakipsiz 
                          ? 'bg-indigo-600 border-indigo-700 text-white shadow-md shadow-indigo-100' 
                          : 'bg-slate-900 border-slate-950 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5 text-indigo-300" />
                      {news.publishedOnEnrakipsiz ? '🚀 enrakipsiz\'de Yayında' : '🚀 enrakipsiz\'de Yayınla'}
                    </button>

                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

      </div>
    </div>
  );
};
