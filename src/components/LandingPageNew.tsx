import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, Zap, BarChart3, X, Wrench, Truck, Package, Wallet, Check, Globe, FileText, ShoppingCart, ArrowLeftRight, Layout, Settings, Activity, Users, Shield, Download, CreditCard, RefreshCw, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../translations";
import { api } from "../services/api";

export const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, setLang } = useLanguage();
  const t = translations[lang];

  const [showDemoModal, setShowDemoModal] = useState(false);

  useEffect(() => {
    if (location.state?.openDemo) {
      setShowDemoModal(true);
      // Clear state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);
  const [demoForm, setDemoForm] = useState({ name: "", storeName: "", phone: "", email: "", notes: "" });
  const [demoStatus, setDemoStatus] = useState({ type: "", text: "" });
  const [activeScenario, setActiveScenario] = useState<'new' | 'existing'>('new');

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDemoStatus({ type: "loading", text: lang === 'tr' ? "Gönderiliyor..." : "Sending..." });
    
    try {
      const data = await api.requestDemo(demoForm);
      
      if (data.success) {
        setDemoStatus({ 
          type: "success", 
          text: lang === 'tr' ? "Talebiniz alındı! En kısa sürede sizinle iletişime geçeceğiz." : "Request received! We will contact you shortly." 
        });
        setDemoForm({ name: "", storeName: "", phone: "", email: "", notes: "" });
        setTimeout(() => {
          setShowDemoModal(false);
          setDemoStatus({ type: "", text: "" });
        }, 3000);
      } else {
        setDemoStatus({ 
          type: "error", 
          text: lang === 'tr' ? "Bir hata oluştu. Lütfen tekrar deneyin." : "An error occurred. Please try again." 
        });
      }
    } catch (err) {
      setDemoStatus({ 
        type: "error", 
        text: lang === 'tr' ? "Bağlantı hatası." : "Connection error." 
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-indigo-500/30">
      {/* Top Navigation */}
      <header className="fixed top-0 left-0 right-0 z-[100] px-4 md:px-8 lg:px-12 py-2 md:py-6 flex items-center justify-between bg-black/40 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center space-x-2 md:space-x-3 cursor-pointer group" onClick={() => navigate("/")}>
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative w-8 h-8 md:w-10 md:h-10 bg-white rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-white/5">
              <div className="w-4 h-4 md:w-5 md:h-5 bg-black rounded-sm" />
            </div>
          </div>
          <span className="text-lg md:text-xl font-black tracking-tighter hidden sm:block text-white">Look<span className="text-indigo-500">Price</span></span>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Language Switcher */}
          <div className="flex items-center bg-white/5 p-0.5 md:p-1 rounded-full border border-white/10 backdrop-blur-md">
            {['tr', 'en', 'de'].map((l) => (
              <button 
                key={l}
                onClick={() => setLang(l as 'tr' | 'en' | 'de')}
                className={`w-7 h-7 md:w-9 md:h-9 flex items-center justify-center rounded-full text-[8px] md:text-[10px] font-black transition-all ${
                  lang === l 
                    ? 'bg-white text-black shadow-xl' 
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          
          {/* Login Button */}
          <button
            onClick={() => navigate('/login')}
            className="px-4 md:px-8 py-2 md:py-3 bg-white text-black hover:bg-indigo-600 hover:text-white rounded-full text-[9px] md:text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-white/5 active:scale-95"
          >
            {lang === 'tr' ? 'Giriş' : 'Login'}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col justify-center px-6 md:px-12 lg:px-24 pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#050505] to-[#050505] pointer-events-none" />
        
        <div className="relative z-10 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-block px-4 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full text-sm font-medium tracking-wider uppercase mb-8 border border-indigo-500/20">
              {lang === 'tr' ? 'Şirketinizin Yeni Merkezi Sinir Sistemi' : 'Your Company\'s New Central Nervous System'}
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-medium tracking-tighter mb-8 leading-[1.05]">
              LookPrice <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                Nexus.
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/50 max-w-3xl mb-12 font-light leading-relaxed">
              {lang === 'tr' 
                ? 'Bir yerdeki hareket, tüm şirketi günceller. Kağıt kalemle, ayrı ayrı yazılımlarla koca bir şirketi yönetmeye çalışmayın. Şirketinizi "tek bir akılla" yaşatın.' 
                : 'Movement in one area updates the whole company. Stop trying to manage a large company with paper and pen or fragmented software. Let your company live with a "single mind".'}
            </p>

            <button
              onClick={() => setShowDemoModal(true)}
              className="group relative inline-flex items-center justify-center px-10 py-5 font-bold text-black bg-white rounded-full overflow-hidden transition-all hover:bg-indigo-500 hover:text-white text-lg"
            >
              {lang === 'tr' ? 'Şirketinizin Sinir Ağını Aktive Edin' : 'Activate Your Company\'s Nervous Network'}
              <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Anatomy - Central Nervous System */}
      <section className="px-6 md:px-12 lg:px-24 py-32 border-t border-white/10 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 text-center max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight mb-6">
              {lang === 'tr' ? 'Anatomi: Ne Alacaksınız?' : 'Anatomy: What Will You Get?'}
            </h2>
            <p className="text-white/50 text-xl font-light">
              {lang === 'tr' 
                ? 'Şirketinizi "canlı bir organizmaya" dönüştüren 5 ana sinir düğümü.' 
                : '5 main nerve nodes that transform your company into a "living organism".'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Brain */}
            <div className="p-10 rounded-[2rem] bg-indigo-950/20 border border-indigo-500/20 relative group overflow-hidden hover:bg-indigo-900/20 transition-colors">
              <div className="w-full h-48 bg-[#08080c] rounded-2xl mb-8 border border-indigo-500/20 flex flex-col overflow-hidden relative p-5 group-hover:border-indigo-500/40 transition-colors shadow-[0_0_30px_rgba(99,102,241,0.05)]">
                {/* Mock UI Header */}
                <div className="flex justify-between items-center mb-6">
                  <div className="w-24 h-2.5 bg-indigo-500/20 rounded-full" />
                  <div className="flex gap-2">
                    <div className="w-6 h-6 bg-indigo-500/10 rounded-md" />
                    <div className="w-6 h-6 bg-indigo-500/10 rounded-md" />
                  </div>
                </div>
                {/* Mock Chart Area */}
                <div className="flex-1 flex items-end gap-3 px-2 mt-auto">
                  <div className="w-full h-[40%] bg-indigo-500/20 rounded-t-md transition-all group-hover:h-[45%]" />
                  <div className="w-full h-[70%] bg-indigo-500/40 rounded-t-md transition-all group-hover:h-[75%]" />
                  <div className="w-full h-[50%] bg-indigo-500/30 rounded-t-md transition-all group-hover:h-[55%]" />
                  <div className="w-full h-[90%] bg-indigo-500/60 rounded-t-md relative transition-all group-hover:h-[95%]">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-3 h-3 bg-indigo-400 rounded-full shadow-[0_0_10px_rgba(129,140,248,0.8)]" />
                  </div>
                  <div className="w-full h-[60%] bg-indigo-500/30 rounded-t-md transition-all group-hover:h-[65%]" />
                  <div className="w-full h-[80%] bg-indigo-500/50 rounded-t-md transition-all group-hover:h-[85%]" />
                </div>
              </div>
              <Zap className="w-10 h-10 text-indigo-400 mb-8 relative z-10" />
              <h3 className="text-2xl font-medium mb-4 relative z-10">{lang === 'tr' ? 'BEYİN (Merkez Kasa & Yönetim)' : 'BRAIN (Central Cashier & Mgmt)'}</h3>
              <p className="text-white/80 font-light leading-relaxed mb-4 text-sm relative z-10">
                {lang === 'tr' ? 'N sayıda mağazanız, Hızlı POS modülü, e-marketler, kurumsal toptan, teknik servis hizmetleri ve sahada operasyon yapan personellerin tüm satışları TEK BİR MERKEZDE!' : 'Sales from N branches, Fast POS, e-marketplaces, corporate B2B, tech service, and field staff all in ONE CENTER!'}
              </p>
              <div className="flex flex-wrap gap-2 relative z-10">
                 <span className="px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs rounded">Nakit, Kart & POS</span>
                 <span className="px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs rounded">Döviz & Cari H.</span>
                 <span className="px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs rounded">Banka EFT/Havale</span>
                 <span className="px-2 py-1 bg-indigo-500/20 border border-indigo-500/40 text-white font-medium text-xs rounded w-full mt-1 text-center">ANLIK KASA DURUMU</span>
              </div>
            </div>

            {/* Senses */}
            <div className="p-10 rounded-[2rem] bg-cyan-950/20 border border-cyan-500/20 relative group overflow-hidden hover:bg-cyan-900/20 transition-colors">
              <div className="w-full h-48 bg-[#080c0c] rounded-2xl mb-8 border border-cyan-500/20 flex flex-col overflow-hidden relative p-5 group-hover:border-cyan-500/40 transition-colors shadow-[0_0_30px_rgba(6,182,212,0.05)]">
                <div className="flex justify-between items-center mb-4">
                   <div className="w-16 h-2 bg-cyan-500/20 rounded-full" />
                   <div className="w-8 h-2 bg-cyan-500/20 rounded-full" />
                </div>
                {/* Mock Integrations List */}
                <div className="flex flex-col gap-3 mt-2">
                   <div className="w-full p-2 bg-cyan-500/5 rounded-lg border border-cyan-500/10 flex items-center justify-between group-hover:bg-cyan-500/10 transition-colors">
                      <div className="flex items-center gap-3">
                         <div className="w-5 h-5 bg-cyan-500/20 rounded flex items-center justify-center"><div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_5px_rgba(34,211,238,0.8)]" /></div>
                         <div className="w-20 h-1.5 bg-cyan-500/20 rounded-full" />
                      </div>
                      <div className="w-8 h-4 rounded-full bg-cyan-500/20 flex items-center px-0.5"><div className="w-3 h-3 bg-cyan-400 rounded-full ml-auto" /></div>
                   </div>
                   <div className="w-full p-2 bg-cyan-500/5 rounded-lg border border-cyan-500/10 flex items-center justify-between group-hover:bg-cyan-500/10 transition-colors transition-delay-75">
                      <div className="flex items-center gap-3">
                         <div className="w-5 h-5 bg-cyan-500/20 rounded flex items-center justify-center"><div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_5px_rgba(34,211,238,0.8)]" /></div>
                         <div className="w-16 h-1.5 bg-cyan-500/20 rounded-full" />
                      </div>
                      <div className="w-8 h-4 rounded-full bg-cyan-500/20 flex items-center px-0.5"><div className="w-3 h-3 bg-cyan-400 rounded-full ml-auto" /></div>
                   </div>
                   <div className="w-full p-2 bg-cyan-500/5 rounded-lg border border-cyan-500/10 flex items-center justify-between group-hover:bg-cyan-500/10 transition-colors transition-delay-150">
                      <div className="flex items-center gap-3">
                         <div className="w-5 h-5 bg-cyan-500/20 rounded" />
                         <div className="w-24 h-1.5 bg-cyan-500/20 rounded-full" />
                      </div>
                      <div className="w-8 h-4 rounded-full bg-cyan-500/10 flex items-center px-0.5"><div className="w-3 h-3 bg-cyan-500/30 rounded-full" /></div>
                   </div>
                </div>
              </div>
              <Globe className="w-10 h-10 text-cyan-400 mb-8 relative z-10" />
              <h3 className="text-2xl font-medium mb-4 relative z-10">{lang === 'tr' ? 'DUYU ORGANLARI (Çoklu-Bağlantı)' : 'SENSES (Multi-Connectivity)'}</h3>
              <p className="text-white/80 font-light leading-relaxed text-sm relative z-10">
                {lang === 'tr' ? 'Ürünleriniz; anlık toplu fiyat güncelleme, kategori özellikleri ve çoklu döviz tanımları ile tek elden her yere dağılır.' : 'Your products are distributed everywhere from a single point with bulk price updates, category features, and multi-currency definitions.'}
                <br /><br />
                {lang === 'tr' ? 'Mağaza İçi: Personel veya müşteri "Dijital Fiyat Gör" ile fiyata saniyeler içinde erişir.' : 'In-Store: Staff or customers access prices in seconds via "Digital Price Check".'}
              </p>
            </div>

            {/* Heart */}
            <div className="p-10 rounded-[2rem] bg-rose-950/20 border border-rose-500/20 relative group overflow-hidden hover:bg-rose-900/20 transition-colors">
              <div className="w-full h-48 bg-[#0c0809] rounded-2xl mb-8 border border-rose-500/20 flex flex-row overflow-hidden relative p-5 gap-4 group-hover:border-rose-500/40 transition-colors shadow-[0_0_30px_rgba(244,63,94,0.05)]">
                {/* CRM/Kanban Mock */}
                <div className="flex-1 flex flex-col gap-3">
                   <div className="w-12 h-2 bg-rose-500/20 rounded-full mb-1" />
                   <div className="w-full h-full bg-rose-500/5 rounded-lg border border-rose-500/10 flex flex-col p-2 gap-2 group-hover:bg-rose-500/10 transition-colors">
                      <div className="w-full h-10 bg-rose-500/10 rounded flex flex-col p-2 gap-1.5 justify-center">
                         <div className="w-3/4 h-1.5 bg-rose-400/40 rounded-full" />
                         <div className="w-1/2 h-1 bg-rose-500/30 rounded-full" />
                      </div>
                      <div className="w-full h-16 bg-rose-500/15 rounded flex flex-col p-2 gap-1.5 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                         <div className="w-full h-1.5 bg-rose-400/60 rounded-full" />
                         <div className="w-2/3 h-1 bg-rose-500/40 rounded-full" />
                         <div className="w-6 h-6 rounded-full bg-rose-400/20 mt-auto ml-auto flex items-center justify-center"><div className="w-3 h-3 text-rose-400 text-[8px] leading-none">+</div></div>
                      </div>
                   </div>
                </div>
                <div className="flex-1 flex flex-col gap-3">
                   <div className="w-16 h-2 bg-rose-500/20 rounded-full mb-1" />
                   <div className="w-full h-[60%] bg-rose-500/5 rounded-lg border border-rose-500/10 flex flex-col p-2 gap-2 group-hover:bg-rose-500/10 transition-colors">
                      <div className="w-full h-10 bg-rose-500/10 rounded flex flex-col p-2 gap-1.5 justify-center">
                         <div className="w-1/2 h-1.5 bg-rose-400/40 rounded-full" />
                         <div className="w-1/3 h-1 bg-rose-500/30 rounded-full" />
                      </div>
                   </div>
                </div>
              </div>
              <Wallet className="w-10 h-10 text-rose-400 mb-8 relative z-10" />
              <h3 className="text-2xl font-medium mb-4 relative z-10">{lang === 'tr' ? 'KALP (Teklif, Servis & Satış)' : 'HEART (Quote, Service & Sales)'}</h3>
              <p className="text-white/80 font-light leading-relaxed text-sm mb-4 relative z-10">
                {lang === 'tr' ? 'Teknik servis takibi ve kurumsal satışın kalbi. Süreci yönetin, anında PDF teklif şablonları üretin.' : 'The heart of tech service and corporate sales. Manage the process, generate instant PDF templates.'}
              </p>
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded relative z-10">
                 <span className="block font-bold mb-1">Dijital Onay Köprüsü:</span>
                 {lang === 'tr' ? 'Müşteri teklifi tek tıkla onaylar, onay sonrası "Yeni Cari & Ürün Kartı" otomatik açılır.' : 'Customer clicks to approve, triggering Auto-Current Account & Product creation.'}
              </div>
            </div>

            {/* Motor */}
            <div className="p-10 rounded-[2rem] bg-emerald-950/20 border border-emerald-500/20 relative group overflow-hidden hover:bg-emerald-900/20 transition-colors">
              <div className="w-full h-48 bg-[#080c0a] rounded-2xl mb-8 border border-emerald-500/20 flex flex-col overflow-hidden relative p-5 group-hover:border-emerald-500/40 transition-colors shadow-[0_0_30px_rgba(16,185,129,0.05)]">
                 {/* Logistics/Map Mock */}
                 <div className="flex justify-between items-center mb-4">
                   <div className="w-1/3 h-2 bg-emerald-500/20 rounded-full" />
                   <div className="w-4 h-4 rounded-full border-2 border-emerald-500/40 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /></div>
                 </div>
                 <div className="relative flex-1 bg-emerald-900/10 rounded-xl overflow-hidden flex items-center justify-center border border-emerald-500/10 group-hover:bg-emerald-900/20 transition-colors">
                   <svg className="absolute w-full h-full opacity-40" viewBox="0 0 100 50" preserveAspectRatio="none">
                      <path d="M10,40 Q30,10 50,25 T90,15" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-500" strokeDasharray="3 3" />
                      <circle cx="10" cy="40" r="2.5" className="fill-emerald-500" />
                      <circle cx="50" cy="25" r="2.5" className="fill-emerald-500" />
                      <circle cx="90" cy="15" r="3.5" className="fill-emerald-400 shadow-[0_0_10px_rgba(52,211,153,1)]" />
                   </svg>
                   {/* Popup Mock */}
                   <div className="absolute top-2 right-4 bg-[#080c0a] border border-emerald-500/30 rounded-lg p-2 backdrop-blur-md shadow-lg shadow-emerald-900/20">
                      <div className="flex items-center gap-2 mb-1.5">
                         <Truck className="w-3 h-3 text-emerald-400" />
                         <div className="w-10 h-1 bg-emerald-400/80 rounded-full" />
                      </div>
                      <div className="w-16 h-1 bg-emerald-500/30 rounded-full" />
                   </div>
                 </div>
              </div>
              <Truck className="w-10 h-10 text-emerald-400 mb-8 relative z-10" />
              <h3 className="text-2xl font-medium mb-4 relative z-10">{lang === 'tr' ? 'MOTOR (Lojistik, Transfer & Filo)' : 'MOTOR (Logistics & Fleet)'}</h3>
              <div className="space-y-3 text-white/80 font-light text-sm relative z-10">
                <p>
                  <span className="text-emerald-400 font-medium">Sevkiyat:</span> {lang === 'tr' ? 'Çok mağazalı yapılar için depo/mağaza arası transfer süreçleri sıfır hatayla çalışır.' : 'Zero-error warehouse/store transfer process for multi-branch setups.'}
                </p>
                <p>
                  <span className="text-emerald-400 font-medium">360° Filo:</span> {lang === 'tr' ? 'Şirket & şahsi araçların evrakları, sigorta, vergi takibi. Sürücü zimmetleri ve kaza raporlamaları.' : 'Tracking documents, tax, and insurance for all vehicles. Driver assignments and accident reports.'}
                </p>
                <p>
                  <span className="text-emerald-400 font-medium">Uyarı Mekanizması:</span> {lang === 'tr' ? 'KM/Mil ayarlı periyodik bakım ve lastik değişimi uyarıları.' : 'Mileage-triggered periodic maintenance and tire alerts.'}
                </p>
              </div>
            </div>

            {/* Otonom */}
            <div className="p-10 rounded-[2rem] bg-purple-950/20 border border-purple-500/20 relative group overflow-hidden hover:bg-purple-900/20 transition-colors">
              <div className="w-full h-48 bg-[#0a080c] rounded-2xl mb-8 border border-purple-500/20 flex flex-col overflow-hidden relative p-5 group-hover:border-purple-500/40 transition-colors shadow-[0_0_30px_rgba(168,85,247,0.05)]">
                 <div className="flex gap-2 mb-6">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
                 </div>
                 {/* Workflow Mock */}
                 <div className="flex-1 border-l-2 border-purple-500/20 ml-1.5 pl-6 flex flex-col justify-center gap-5">
                    <div className="relative group-hover:translate-x-1 transition-transform">
                       <div className="w-2.5 h-2.5 bg-purple-400 rounded-full absolute -left-[29px] top-1/2 -translate-y-1/2 shadow-[0_0_10px_rgba(192,132,252,1)]" />
                       <div className="w-24 h-1.5 bg-purple-400/80 rounded-full mb-1" />
                       <div className="w-16 h-1 bg-purple-500/40 rounded-full" />
                    </div>
                    <div className="relative">
                       <div className="w-2 h-2 bg-purple-500/30 rounded-full absolute -left-[28px] top-1/2 -translate-y-1/2" />
                       <div className="w-20 h-1.5 bg-purple-500/30 rounded-full" />
                    </div>
                    <div className="relative group-hover:translate-x-1 transition-transform delay-75">
                       <div className="w-2.5 h-2.5 bg-purple-400 rounded-full absolute -left-[29px] top-1/2 -translate-y-1/2 shadow-[0_0_10px_rgba(192,132,252,1)]" />
                       <div className="w-32 h-1.5 bg-purple-400/80 rounded-full mb-1" />
                       <div className="w-24 h-1 bg-purple-500/40 rounded-full" />
                    </div>
                 </div>
              </div>
              <Layout className="w-10 h-10 text-purple-400 mb-8 relative z-10" />
              <h3 className="text-2xl font-medium mb-4 relative z-10">{lang === 'tr' ? 'OTONOM (Tedarik, Vergi & Denetim)' : 'AUTONOMIC (Supply & Audit)'}</h3>
              <div className="space-y-3 text-white/80 font-light text-sm relative z-10">
                 <p>
                  <span className="text-purple-400 font-medium">Distribütör Zekası:</span> {lang === 'tr' ? 'Teklif kabul edildi ama stok yok mu? Sistem distribütör verisini okur, otomatik tedarik emri oluşturur.' : 'Quote approved but out of stock? System reads distributor data, creates auto-supply order.'}
                </p>
                <p>
                  <span className="text-purple-400 font-medium">Finans & Vergi Öngörüsü:</span> {lang === 'tr' ? 'Dijital hesap mutabakatı ve anlık ödenecek vergi öngörü dashboardları.' : 'Digital reconciliation and live dashboards anticipating upcoming taxes.'}
                </p>
                 <p>
                  <span className="text-purple-400 font-medium">İşlem Geçmişi:</span> {lang === 'tr' ? 'Hangi personel ne iş yapmış, çarkı kim çeviriyor? Tüm raporları dilediğiniz cihaza indirin.' : 'Track exact operations by staff. Download all reports anywhere, anytime.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Core Modules Section */}
      <section className="px-6 md:px-12 lg:px-24 py-32 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-4">
              {lang === 'tr' ? 'Sistemin Temel Yapı Taşları.' : 'Core System Modules.'}
            </h2>
            <p className="text-white/40 text-lg font-light">
              {lang === 'tr' ? 'İşletmenizi uçtan uca yönetmeniz için tasarlanmış entegre modüller.' : 'Integrated modules designed to manage your business end-to-end.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Module 1 */}
            <div className="p-10 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
              <Wrench className="w-8 h-8 text-indigo-400 mb-8" />
              <h3 className="text-2xl font-medium mb-4">
                {lang === 'tr' ? 'Teknik Servis & Onarım' : 'Technical Service & Repair'}
              </h3>
              <p className="text-white/40 font-light leading-relaxed mb-8">
                {lang === 'tr' 
                  ? 'Cihaz kabulünden teslimata kadar tüm süreci dijitalleştirin. Müşteriye özel QR kodlar, otomatik durum bildirimleri ve tek tıkla servis kaydını satışa dönüştürme altyapısı.'
                  : 'Digitize the entire process from device intake to delivery. Customer-specific QR codes, automated status notifications, and one-click conversion to sales.'}
              </p>
              <ul className="space-y-3 text-sm text-white/60 font-light">
                <li className="flex items-center"><Check className="w-4 h-4 mr-3 text-indigo-500/50"/> {lang === 'tr' ? 'PDF Raporlama & Garanti Takibi' : 'PDF Reporting & Warranty Tracking'}</li>
                <li className="flex items-center"><Check className="w-4 h-4 mr-3 text-indigo-500/50"/> {lang === 'tr' ? 'Otomatik Stok Düşümü' : 'Automated Inventory Deduction'}</li>
              </ul>
            </div>

            {/* Module 2 */}
            <div className="p-10 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
              <Truck className="w-8 h-8 text-cyan-400 mb-8" />
              <h3 className="text-2xl font-medium mb-4">
                {lang === 'tr' ? 'Filo ve Araç Yönetimi' : 'Fleet & Vehicle Management'}
              </h3>
              <p className="text-white/40 font-light leading-relaxed mb-8">
                {lang === 'tr'
                  ? 'Araçlarınızın bakım geçmişini, sigorta/kasko bitiş tarihlerini ve personel zimmetlerini tek ekrandan izleyin. Sürpriz maliyetlerin önüne geçin.'
                  : 'Monitor vehicle maintenance history, insurance expiry dates, and staff assignments from a single screen. Prevent surprise costs.'}
              </p>
              <ul className="space-y-3 text-sm text-white/60 font-light">
                <li className="flex items-center"><Check className="w-4 h-4 mr-3 text-cyan-500/50"/> {lang === 'tr' ? 'Akıllı Bakım Uyarıları' : 'Smart Maintenance Alerts'}</li>
                <li className="flex items-center"><Check className="w-4 h-4 mr-3 text-cyan-500/50"/> {lang === 'tr' ? 'Sürücü ve Belge Yönetimi' : 'Driver & Document Management'}</li>
              </ul>
            </div>

            {/* Module 3 */}
            <div className="p-10 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
              <Package className="w-8 h-8 text-emerald-400 mb-8" />
              <h3 className="text-2xl font-medium mb-4">
                {lang === 'tr' ? 'Akıllı Stok & Envanter' : 'Smart Inventory & Stock'}
              </h3>
              <p className="text-white/40 font-light leading-relaxed mb-8">
                {lang === 'tr'
                  ? 'Çoklu şube desteğiyle stoklarınızı anlık takip edin. Kritik stok seviyelerinde uyarı alın, barkod okuyucu entegrasyonu ile saniyeler içinde işlem yapın.'
                  : 'Track your inventory in real-time with multi-branch support. Get alerts on critical stock levels and process transactions in seconds with barcode integration.'}
              </p>
              <ul className="space-y-3 text-sm text-white/60 font-light">
                <li className="flex items-center"><Check className="w-4 h-4 mr-3 text-emerald-500/50"/> {lang === 'tr' ? 'Şubeler Arası Transfer' : 'Inter-branch Transfers'}</li>
                <li className="flex items-center"><Check className="w-4 h-4 mr-3 text-emerald-500/50"/> {lang === 'tr' ? 'Excel ile Toplu İçe Aktarım' : 'Bulk Import via Excel'}</li>
              </ul>
            </div>

            {/* Module 4 */}
            <div className="p-10 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
              <Wallet className="w-8 h-8 text-rose-400 mb-8" />
              <h3 className="text-2xl font-medium mb-4">
                {lang === 'tr' ? 'Cari Hesap & Finans' : 'Current Accounts & Finance'}
              </h3>
              <p className="text-white/40 font-light leading-relaxed mb-8">
                {lang === 'tr'
                  ? 'Müşteri ve tedarikçilerinizle olan finansal ilişkilerinizi şeffaflaştırın. Vadeli satışlar, tahsilatlar ve anlık bakiye takibi ile nakit akışınızı kontrol altına alın.'
                  : 'Make your financial relationships with customers and suppliers transparent. Control your cash flow with term sales, collections, and real-time balance tracking.'}
              </p>
              <ul className="space-y-3 text-sm text-white/60 font-light">
                <li className="flex items-center"><Check className="w-4 h-4 mr-3 text-rose-500/50"/> {lang === 'tr' ? 'Otomatik Borç/Alacak Kaydı' : 'Automated Debt/Credit Recording'}</li>
                <li className="flex items-center"><Check className="w-4 h-4 mr-3 text-rose-500/50"/> {lang === 'tr' ? 'Kasa ve Banka Entegrasyonu' : 'Cash Register & Bank Integration'}</li>
              </ul>
            </div>

            {/* Module 5 */}
            <div className="p-10 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
              <FileText className="w-8 h-8 text-amber-400 mb-8" />
              <h3 className="text-2xl font-medium mb-4">
                {lang === 'tr' ? 'Teklif & Tedarik Zinciri' : 'Quotation & Supply Chain'}
              </h3>
              <p className="text-white/40 font-light leading-relaxed mb-8">
                {lang === 'tr'
                  ? 'Teklif hazırlama sürecinden, onay sonrası otomatik tedarik zinciri yönetimine kadar her adım kontrolünüzde. Tedarikçi entegrasyonu ile eksik ürünleri anında sipariş edin.'
                  : 'Control every step from quotation to automated supply chain management after approval. Order missing products instantly with supplier integration.'}
              </p>
              <ul className="space-y-3 text-sm text-white/60 font-light">
                <li className="flex items-center"><Check className="w-4 h-4 mr-3 text-amber-500/50"/> {lang === 'tr' ? 'Otomatik Teklif-Sipariş Dönüşümü' : 'Automated Quote-to-Order Conversion'}</li>
                <li className="flex items-center"><Check className="w-4 h-4 mr-3 text-amber-500/50"/> {lang === 'tr' ? 'Tedarikçi Stok Entegrasyonu' : 'Supplier Stock Integration'}</li>
              </ul>
            </div>

            {/* Module 6 */}
            <div className="p-10 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
              <ShoppingCart className="w-8 h-8 text-purple-400 mb-8" />
              <h3 className="text-2xl font-medium mb-4">
                {lang === 'tr' ? 'Dijital Mağaza Deneyimi' : 'Digital Store Experience'}
              </h3>
              <p className="text-white/40 font-light leading-relaxed mb-8">
                {lang === 'tr'
                  ? 'Mağaza içi "Dijital Fiyat Gör" terminalleri ve entegre "Dijital Sepet" ile müşterilerinize benzersiz bir deneyim sunun. Personel yükünü azaltın, satış hızını artırın.'
                  : 'Offer a unique experience with in-store "Digital Price Check" terminals and integrated "Digital Basket". Reduce staff workload and increase sales speed.'}
              </p>
              <ul className="space-y-3 text-sm text-white/60 font-light">
                <li className="flex items-center"><Check className="w-4 h-4 mr-3 text-purple-500/50"/> {lang === 'tr' ? 'Dijital Fiyat Gör & Bilgi Ekranı' : 'Digital Price Check & Info Screen'}</li>
                <li className="flex items-center"><Check className="w-4 h-4 mr-3 text-purple-500/50"/> {lang === 'tr' ? 'Entegre Dijital Sepet & Hızlı Ödeme' : 'Integrated Digital Basket & Fast Checkout'}</li>
              </ul>
            </div>

            {/* Module 7 */}
            <div className="p-10 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
              <ArrowLeftRight className="w-8 h-8 text-blue-400 mb-8" />
              <h3 className="text-2xl font-medium mb-4">
                {lang === 'tr' ? 'Şubeler Arası Otomasyon' : 'Inter-branch Automation'}
              </h3>
              <p className="text-white/40 font-light leading-relaxed mb-8">
                {lang === 'tr'
                  ? 'Şubeler arası ürün transferlerini manuel süreçlerden kurtarın. Akıllı talep yönetimi ve otomatik onay mekanizması ile stok dengesini saniyeler içinde sağlayın.'
                  : 'Free inter-branch product transfers from manual processes. Ensure stock balance in seconds with smart demand management and automated approval mechanisms.'}
              </p>
              <ul className="space-y-3 text-sm text-white/60 font-light">
                <li className="flex items-center"><Check className="w-4 h-4 mr-3 text-blue-500/50"/> {lang === 'tr' ? 'Akıllı Stok Transfer Talebi' : 'Smart Stock Transfer Request'}</li>
                <li className="flex items-center"><Check className="w-4 h-4 mr-3 text-blue-500/50"/> {lang === 'tr' ? 'Otomatik İrsaliye & Takip' : 'Automated Waybill & Tracking'}</li>
              </ul>
            </div>

            {/* Module 8 */}
            <div className="p-10 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
              <Layout className="w-8 h-8 text-orange-400 mb-8" />
              <h3 className="text-2xl font-medium mb-4">
                {lang === 'tr' ? 'Entegre E-Ticaret' : 'Integrated E-Commerce'}
              </h3>
              <p className="text-white/40 font-light leading-relaxed mb-8">
                {lang === 'tr'
                  ? 'Mağazanızla tam entegre, el değmeden hazır e-ticaret sitesi. Stoklarınız, fiyatlarınız ve kampanyalarınız fiziksel mağazanızla anlık senkronize çalışır.'
                  : 'A fully integrated, ready-to-go e-commerce site. Your stocks, prices, and campaigns work in real-time synchronization with your physical store.'}
              </p>
              <ul className="space-y-3 text-sm text-white/60 font-light">
                <li className="flex items-center"><Check className="w-4 h-4 mr-3 text-orange-500/50"/> {lang === 'tr' ? 'Sıfır Manuel Veri Girişi' : 'Zero Manual Data Entry'}</li>
                <li className="flex items-center"><Check className="w-4 h-4 mr-3 text-orange-500/50"/> {lang === 'tr' ? 'Anlık Stok & Fiyat Senkronu' : 'Instant Stock & Price Sync'}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem in Action (How it works) */}
      <section className="px-6 md:px-12 lg:px-24 py-32 border-t border-white/5 bg-[#050505]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="text-4xl md:text-6xl font-medium tracking-tight mb-6 leading-tight">
              {lang === 'tr' ? 'Peki Bu Okyanusu Nasıl Yönetiyoruz?' : 'So, How Do We Manage This Ocean?'}
            </h2>
            <p className="text-white/50 text-xl font-light max-w-3xl">
              {lang === 'tr' 
                ? 'İşte sistemin çarklarının kusursuz uyumu. Eski, yeni personel sorunu yok; her şey dijital bir köprü ile birbirine bağlı.' 
                : 'Here is the perfect harmony of the engine\'s gears. No old/new staff issues; everything is connected via a digital bridge.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]">
            
            {/* The Omni-Channel Core */}
            <div className="p-8 rounded-[2rem] bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/10 transition-colors md:col-span-2 lg:col-span-2">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-medium text-white">{lang === 'tr' ? 'Merkez Kasa & Omni-Channel Satış' : 'Central Cashier & Omni-Channel'}</h3>
              </div>
              <p className="text-white/60 font-light leading-relaxed mb-6">
                {lang === 'tr' 
                  ? 'Web sitenizden, 1. ve 2. mağazanızdaki Hızlı POS modülünden, pazaryerlerinden, kurumsal B2B kanaldan, teknik servisten veya sahadaki personelinizden gelen tüm satışlar...'
                  : 'All sales coming from your website, 1st and 2nd store Fast POS, marketplaces, corporate channels, tech service, or field staff...'}
                <br /><br />
                {lang === 'tr' 
                  ? 'Hepsi tek bir kasada birleşir. İster Nakit, Kart, POS, ister Döviz, Cari ve Banka EFT. Tüm varlıklarınızı anlık özet panosunda canlı izleyin.'
                  : 'All merge into a single cash register. Cash, Card, Currency, Account, or Wire Transfer. View your live summary instantly.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/70">{lang === 'tr' ? 'Fiyat Güncelleme (Toplu)' : 'Bulk Price Update'}</span>
                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/70">{lang === 'tr' ? 'Çoklu Döviz' : 'Multi-Currency'}</span>
                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/70">{lang === 'tr' ? 'Kategori Bazlı Özellikler' : 'Category Features'}</span>
              </div>
            </div>

            {/* In-Store Digital Price */}
            <div className="p-8 rounded-[2rem] bg-white/5 hover:bg-white/10 border border-white/5 transition-colors md:col-span-1 lg:col-span-2">
               <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-medium text-white">{lang === 'tr' ? 'Mağaza İçi "Dijital Fiyat Gör"' : 'In-Store Digital Price'}</h3>
              </div>
              <p className="text-white/60 font-light leading-relaxed">
                {lang === 'tr' 
                  ? 'Personeliniz veya mağaza içindeki müşterileriniz, doğrudan mobil cihazlarından okutarak saniyeler içinde güncel fiyata, özelliklere erişir. Donanım maliyetini bitirin.' 
                  : 'Staff or customers in-store simply scan with their mobile devices to access real-time pricing and specs in seconds. End hardware dependencies.'}
              </p>
            </div>

            {/* B2B & Supply (Spans 2 columns) */}
            <div className="p-8 rounded-[2rem] bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 transition-colors md:col-span-3 lg:col-span-2">
               <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-medium text-white">{lang === 'tr' ? 'Hatasız Tedarik & Sevkiyat' : 'Flawless Supply & Dispatch'}</h3>
              </div>
              <p className="text-white/60 font-light leading-relaxed mb-6">
                {lang === 'tr' 
                  ? 'Çok mağazalı yapılar için depo-mağaza ve mağaza-mağaza arası transferler artık manuel değil, sıfır hatayla çalışır.' 
                  : 'For multi-store setups, warehouse-to-store and store-to-store transfers are automated with zero errors.'}
                <br /><br />
                <span className="font-medium text-emerald-400">
                  {lang === 'tr' ? 'Distribütör Otonomisi: ' : 'Distributor Autonomy: '}
                </span>
                {lang === 'tr' 
                  ? 'Teklif onaylandı ama ürün stokta yok mu? Sistem distribütör datasını okur ve Otomatik Tedarik emrini hemen oluşturur.'
                  : 'Quote approved but out of stock? The system reads distributor data and fires an Auto-Supply order immediately.'}
              </p>
            </div>

            {/* Fleet Management */}
            <div className="p-8 rounded-[2rem] bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/10 transition-colors md:col-span-2 lg:col-span-2">
               <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <Truck className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-medium text-white">{lang === 'tr' ? '360° Filo & Personel' : '360° Fleet & Staff'}</h3>
              </div>
              <ul className="space-y-4 text-white/60 font-light text-sm">
                <li className="flex items-start"><Check className="w-4 h-4 mr-3 text-cyan-500 mt-1 flex-shrink-0"/> {lang === 'tr' ? 'Şirket/şahsi tüm araçların evrak, vergi ve sigorta takibi.' : 'Tracking documents, tax, and insurance for all company/personal vehicles.'}</li>
                <li className="flex items-start"><Check className="w-4 h-4 mr-3 text-cyan-500 mt-1 flex-shrink-0"/> {lang === 'tr' ? 'Sürücü zimmetleri, puantaj ve kaza/durum raporlamaları.' : 'Driver assignments, scoring, and condition/accident reports.'}</li>
                <li className="flex items-start"><Check className="w-4 h-4 mr-3 text-cyan-500 mt-1 flex-shrink-0"/> {lang === 'tr' ? 'KM/Mil ayarlı periyodik bakım ve lastik uyarı mekanizması.' : 'Mileage-triggered periodic maintenance and tire alerts.'}</li>
              </ul>
            </div>

            {/* Tech Service & CRM Bridge */}
            <div className="p-8 rounded-[2rem] bg-orange-500/5 hover:bg-orange-500/10 border border-orange-500/10 transition-colors lg:col-span-2 md:col-span-2">
               <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-xl font-medium text-white">{lang === 'tr' ? 'Servis & Satış Köprüsü' : 'Service & Sales Bridge'}</h3>
              </div>
              <p className="text-white/60 font-light mb-4">
                {lang === 'tr' 
                  ? 'Anında Kurumsal PDF teklifler oluşturun. Müşteriniz, gönderdiğiniz dijital onay köprüsü üzerinden teklifi tek tıkla onaylasın veya reddetsin.' 
                  : 'Create instant Corporate PDF quotes. Customers approve or reject with one click via a digital bridge.'}
              </p>
              <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20 text-orange-400 text-sm flex items-center">
                <Zap className="w-4 h-4 mr-2" />
                {lang === 'tr' ? 'Onay sonrası otomatik Yeni Cari hesap ve Ürün kartı oluşturulur.' : 'Automatic Current Account and Product card creation upon approval.'}
              </div>
            </div>

            {/* Finance & Audit */}
            <div className="p-8 rounded-[2rem] bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 transition-colors md:col-span-1 lg:col-span-1">
               <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-rose-400" />
                </div>
                <h3 className="text-xl font-medium text-white">{lang === 'tr' ? 'Canlı Finans' : 'Live Finance'}</h3>
              </div>
              <p className="text-white/60 font-light text-sm mb-4">
                {lang === 'tr' ? 'Dijital/manuel fatura sistemi, anlık mutabakat.' : 'Digital/manual invoicing, instant reconciliation.'}
              </p>
              <p className="text-white/60 font-light text-sm">
                <span className="text-rose-400 font-medium">Vergi Öngörüsü:</span> {lang === 'tr' ? 'Dashboardlar ile ödenecek vergiyi anlık izleyin.' : 'Track upcoming tax payments live via dashboards.'}
              </p>
            </div>

             {/* Audit / Reports */}
             <div className="p-8 rounded-[2rem] bg-white/5 hover:bg-white/10 border border-white/10 transition-colors md:col-span-1 lg:col-span-1">
               <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-medium text-white">{lang === 'tr' ? 'Tam Denetim' : 'Full Audit'}</h3>
              </div>
              <p className="text-white/60 font-light text-sm mb-4">
                {lang === 'tr' ? 'Kullanıcı rolleri ile kim, ne iş yapmış? Çarkı kim çeviriyor? Tüm işlem geçmişi elinizin altında.' : 'User roles show exactly who did what. The entire transaction history is at your fingertips.'}
              </p>
              <div className="flex items-center text-white/80 text-xs font-bold uppercase tracking-wider">
                <Download className="w-4 h-4 mr-2" /> PDF & EXCEL
              </div>
            </div>

            {/* Absolute Customization */}
            <div className="p-8 rounded-[2rem] bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/20 transition-colors md:col-span-3 lg:col-span-4 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
               <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                  <Settings className="w-6 h-6 text-indigo-400 group-hover:rotate-90 transition-transform duration-700" />
                </div>
                <h3 className="text-3xl font-medium text-white">{lang === 'tr' ? 'Sınırsız Özelleştirme: Sizin Oyun Alanınız' : 'Limitless Customization: Your Playground'}</h3>
              </div>
              <p className="text-white/60 font-light text-lg max-w-4xl relative z-10">
                {lang === 'tr' 
                  ? 'Sistemi kendinize göre dizayn etmek çocuk oyuncağı. Vergi oranları, çapraz döviz kurları, e-mağaza bağlantıları, yeni yazar kasa/pos entegrasyonu... Kendi web sitenizin tasarımından, PayPal/Iyzico sanal pos bağlantılarına ve kargo fiyatlandırmalarına kadar her şeyi yapabileceğiniz merkezi ayarlar tabanı.' 
                  : 'Designing the system to fit you is a breeze. Tax rates, cross-currency rates, e-store links, new POS integrations... The central settings hub lets you configure everything from your website design to PayPal/Iyzico virtual POS connections and shipping rates.'}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Platform Section */}
      <section className="px-6 md:px-12 lg:px-24 py-32 text-center border-t border-white/5">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight mb-8">
            {lang === 'tr' ? 'Teknoloji ile Yönetilen İşletmeler.' : 'Technology-Driven Businesses.'}
          </h2>
          <p className="text-xl text-white/40 font-light leading-relaxed">
            {lang === 'tr'
              ? 'Teknik servis, filo yönetimi, stok ve finansal entegrasyon. İşletmenizin tüm departmanlarını birbirine bağlayan, hatasız ve ölçeklenebilir bir yazılım mimarisi.'
              : 'Technical service, fleet management, inventory, and financial integration. An error-free and scalable software architecture connecting all departments of your business.'}
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-12 lg:px-24 py-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
              <div className="w-3 h-3 bg-black rounded-sm" />
            </div>
            <span className="font-bold tracking-tight text-lg">LookPrice</span>
          </div>
          <span className="text-white/40 text-xs font-medium uppercase tracking-widest">{lang === 'tr' ? '26 Yıllık GAP Bilişim Hizmetleri Tecrübesi' : '26 Years of GAP IT Services Experience'}</span>
        </div>
        
        <div className="text-white/40 text-sm font-light text-center">
          {lang === 'tr' ? 'Sürdürülebilir büyüme için, sağlam altyapı.' : 'Solid infrastructure for sustainable growth.'}
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-white/60">
          <a href="https://instagram.com/lookpricenet" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 transition-colors flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            lookpricenet
          </a>
          <div className="hidden md:block w-1 h-1 bg-white/20 rounded-full" />
          <a href="mailto:lookprice.me@gmail.com" className="hover:text-white transition-colors">lookprice.me@gmail.com</a>
          <div className="hidden md:block w-1 h-1 bg-white/20 rounded-full" />
          <a href="tel:+905488902309" className="hover:text-white transition-colors">+90 548 890 23 09</a>
        </div>
      </footer>

      {/* Demo Request Modal */}
      <AnimatePresence>
        {showDemoModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDemoModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#111] rounded-3xl shadow-2xl overflow-hidden border border-white/10"
            >
              <div className="p-10">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-2xl font-medium text-white tracking-tight">
                      {lang === 'tr' ? 'Konsültasyon Talebi' : 'Consultation Request'}
                    </h3>
                    <p className="text-white/40 text-sm mt-1">
                      {lang === 'tr' ? 'Sistem mimarisi ve entegrasyon için ilk adım.' : 'The first step for system architecture and integration.'}
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowDemoModal(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {demoStatus.type === 'success' ? (
                  <div className="bg-emerald-500/10 text-emerald-400 p-6 rounded-2xl text-center border border-emerald-500/20">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap className="h-6 w-6 text-emerald-400" />
                    </div>
                    <p className="font-medium">{demoStatus.text}</p>
                  </div>
                ) : (
                  <form onSubmit={handleDemoSubmit} className="space-y-5">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
                          {lang === 'tr' ? 'Ad Soyad' : 'Full Name'}
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-white placeholder-white/20"
                          placeholder="John Doe"
                          value={demoForm.name}
                          onChange={e => setDemoForm({...demoForm, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
                          {lang === 'tr' ? 'İşletme Adı' : 'Business Name'}
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-white placeholder-white/20"
                          placeholder="Şirketiniz A.Ş."
                          value={demoForm.storeName}
                          onChange={e => setDemoForm({...demoForm, storeName: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
                            {lang === 'tr' ? 'Telefon' : 'Phone'}
                          </label>
                          <input
                            type="tel"
                            required
                            className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-white placeholder-white/20"
                            placeholder="+90 555 000 0000"
                            value={demoForm.phone}
                            onChange={e => setDemoForm({...demoForm, phone: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
                            {lang === 'tr' ? 'E-posta' : 'Email'}
                          </label>
                          <input
                            type="email"
                            required
                            className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-white placeholder-white/20"
                            placeholder="mail@sirket.com"
                            value={demoForm.email}
                            onChange={e => setDemoForm({...demoForm, email: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    {demoStatus.type === 'error' && (
                      <p className="text-red-400 text-sm font-medium">{demoStatus.text}</p>
                    )}

                    <button
                      type="submit"
                      disabled={demoStatus.type === 'loading'}
                      className="w-full py-4 bg-white text-black rounded-xl font-medium hover:bg-white/90 transition-all disabled:opacity-50 mt-4"
                    >
                      {demoStatus.type === 'loading' 
                        ? (lang === 'tr' ? 'Gönderiliyor...' : 'Sending...') 
                        : (lang === 'tr' ? 'Talebi Gönder' : 'Send Request')}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
