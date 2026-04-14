
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Scan, 
  Zap, 
  BarChart3, 
  Play, 
  CheckCircle2, 
  ExternalLink, 
  ChevronRight, 
  FileText, 
  Palette, 
  TrendingUp, 
  Download,
  Instagram, 
  Phone, 
  MessageCircle, 
  Mail, 
  X,
  Globe,
  Upload,
  Search,
  Lock,
  AlertCircle,
  Volume2,
  VolumeX,
  Wallet,
  Users,
  CreditCard,
  Barcode,
  QrCode,
  Tag,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import * as XLSX from "xlsx";
import Logo from "./Logo";
import { translations } from "../translations";
import { api } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import { DEVELOPED_COUNTRIES } from "../constants";

export const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, setLang } = useLanguage();
  const t = translations[lang];

  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerStep, setRegisterStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [registerForm, setRegisterForm] = useState({
    storeName: "",
    username: "",
    password: "",
    companyTitle: "",
    address: "",
    phone: "",
    country: "TR",
    language: lang as string,
    currency: "TRY",
    uploadMethod: "manual" as "manual" | "excel",
    excelData: [] as any[],
    mapping: {
      barcode: "",
      name: "",
      price: "",
      description: ""
    }
  });
  const [registerStatus, setRegisterStatus] = useState({ type: "", text: "" });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [liveActivity, setLiveActivity] = useState<{name: string, location: string} | null>(null);
  const [demoForm, setDemoForm] = useState({ name: "", storeName: "", phone: "", email: "", notes: "" });
  const [demoStatus, setDemoStatus] = useState({ type: "", text: "" });
  const [isMuted, setIsMuted] = useState(true);
  const [showStickyCta, setShowStickyCta] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyCta(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const activities = lang === 'tr' ? [
      { name: "Bir müşteri barkod okuttu", location: "İstanbul, Kadıköy" },
      { name: "Yeni bir mağaza katıldı", location: "Ankara, Çankaya" },
      { name: "Fiyat güncellemesi yapıldı", location: "İzmir, Alsancak" },
      { name: "Bir müşteri fiyat sorguladı", location: "Antalya, Muratpaşa" }
    ] : [
      { name: "A customer scanned a barcode", location: "London, UK" },
      { name: "A new store joined", location: "Berlin, Germany" },
      { name: "Price update completed", location: "Paris, France" },
      { name: "A customer checked a price", location: "New York, USA" }
    ];

    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const activity = activities[Math.floor(Math.random() * activities.length)];
        setLiveActivity(activity);
        setTimeout(() => setLiveActivity(null), 5000);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [lang]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (location.state?.openDemo) {
      setShowDemoModal(true);
      // Clear state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      setRegisterForm(prev => ({ ...prev, excelData: data, uploadMethod: "excel" }));
      setRegisterStep(4);
    };
    reader.readAsBinaryString(file);
  };

  const isStepValid = () => {
    if (registerStep === 1) {
      return registerForm.storeName.trim() !== '' && 
             registerForm.username.trim() !== '' && 
             registerForm.password.trim() !== '';
    }
    if (registerStep === 2) {
      return registerForm.companyTitle.trim() !== '' && 
             registerForm.address.trim() !== '' && 
             registerForm.phone.trim() !== '';
    }
    if (registerStep === 3) {
      if (registerForm.uploadMethod === "excel" && registerForm.excelData.length === 0) return false;
      return true;
    }
    if (registerStep === 4) {
      if (registerForm.uploadMethod === "excel") {
        return registerForm.mapping.barcode !== '' && 
               registerForm.mapping.name !== '' && 
               registerForm.mapping.price !== '';
      }
      return true;
    }
    return true;
  };

  const handleRegisterSubmit = async () => {
    setRegisterStatus({ type: "loading", text: lang === 'tr' ? "Gönderiliyor..." : "Sending..." });
    
    try {
      const response = await api.requestRegistration({
        ...registerForm,
        plan: selectedPlan
      });

      if (response.success) {
        setRegisterStatus({ 
          type: "success", 
          text: translations[lang].registration.success.message 
        });
        setTimeout(() => {
          setShowRegisterModal(false);
          setRegisterStep(1);
          setRegisterStatus({ type: "", text: "" });
          setRegisterForm({
            storeName: "",
            username: "",
            password: "",
            companyTitle: "",
            address: "",
            phone: "",
            country: "TR",
            language: lang as string,
            currency: "TRY",
            uploadMethod: "manual",
            excelData: [],
            mapping: { barcode: "", name: "", price: "", description: "" }
          });
        }, 5000);
      } else {
        setRegisterStatus({ 
          type: "error", 
          text: response.error || (lang === 'tr' ? "Bir hata oluştu." : "An error occurred.") 
        });
      }
    } catch (err) {
      setRegisterStatus({ 
        type: "error", 
        text: lang === 'tr' ? "Bağlantı hatası." : "Connection error." 
      });
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { "Barkod": "8690000000001", "Ürün Adı": "Örnek Ürün 1", "Kategori": "Kırtasiye", "Fiyat": 100, "Açıklama": "Açıklama 1", "Stok": 50 },
      { "Barkod": "8690000000002", "Ürün Adı": "Örnek Ürün 2", "Kategori": "Kitap", "Fiyat": 200, "Açıklama": "Açıklama 2", "Stok": 20 }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ürünler");
    XLSX.writeFile(wb, "LookPrice_Urun_Sablonu.xlsx");
  };

  const references = [
    { name: "Güneş Plaza", logo: "https://picsum.photos/seed/gunes/200/200" },
    { name: "Cyprus Outdoor Shop", logo: "https://cyprusoutdoorshop.com/wp-content/uploads/2025/10/cropped-COS-logo-yatay-1.png" },
    { name: "GAP", logo: "https://11d46382.cdn.akinoncloud.com/static_omnishop/gapzero164/img/gap_black.svg" },
    { name: "BAMIX", logo: "https://bamixhome.com/wp-content/uploads/2025/07/cropped-logo-scaled-1-1024x292.png" },
    { name: "Deniz Medikal", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSZT8PDqi7qCfNatYPUTG7KdsWaRPmK2ZGdfg&s" }
  ];

  return (
    <div className="min-h-screen font-sans selection:bg-indigo-100 selection:text-indigo-900 currency-bg">
      {/* Language Switcher Floating */}
      <div className="fixed top-20 right-4 z-[100] flex flex-col space-y-2">
        {['tr', 'en', 'de'].map((l) => (
          <button 
            key={l}
            onClick={() => setLang(l as 'tr' | 'en' | 'de')}
            className={`w-10 h-10 flex items-center justify-center rounded-xl text-xs font-bold transition-all shadow-lg ${
              lang === l 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white/80 backdrop-blur-md text-gray-600 hover:bg-white'
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Hero Section - Modern SaaS Layout */}
      <section className="relative flex items-center overflow-hidden bg-slate-50/50 barcode-pattern">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/0 via-white/80 to-white pointer-events-none" />
        
        {/* Zebra Background Elements */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-950/5 barcode-pattern -skew-x-12 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-indigo-600/5 barcode-pattern skew-x-12 -translate-x-1/2" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-6"
            >
              <div className="inline-flex items-center space-x-2 mb-6 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full">
                <Barcode className="h-4 w-4 text-indigo-600" />
                <span className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em]">
                  {lang === 'tr' ? 'LOOKPRICE DÜNYASINA HOŞ GELDİNİZ' : 'WELCOME TO THE LOOKPRICE WORLD'}
                </span>
              </div>
              
              <h1 className="text-5xl sm:text-7xl lg:text-7xl font-black text-slate-900 leading-tight lg:leading-[1.1] tracking-tighter mb-6">
                {t.hero.title}
              </h1>
              
              <div className="max-w-xl mb-10 space-y-8">
                <p className="text-xl sm:text-2xl text-slate-600 leading-relaxed font-serif italic border-l-4 border-indigo-600 pl-6">
                  {t.hero.subtitle}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => {
                    setSelectedPlan("free");
                    setShowRegisterModal(true);
                  }}
                  className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95 flex items-center"
                >
                  <Tag className="h-5 w-5 mr-3" />
                  {t.hero.cta}
                </button>
                <button 
                  onClick={() => window.open(`${window.location.origin}/scan/demo-store`, '_blank')}
                  className="px-10 py-4 bg-white text-slate-900 border-2 border-slate-200 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all active:scale-95 flex items-center"
                >
                  <QrCode className="h-5 w-5 mr-3" />
                  {t.hero.liveExperience}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="lg:col-span-6 hidden lg:block relative"
            >
              <div className="relative">
                {/* Store Entrance Mockup */}
                <div className="glass-panel p-2 rounded-[3.5rem] shadow-2xl border border-white/60 transform rotate-2 hover:rotate-0 transition-transform duration-700 zebra-border">
                  <div className="bg-slate-900 rounded-[3.2rem] overflow-hidden aspect-[4/3] relative shadow-inner border border-slate-800">
                    <img 
                      src="https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?auto=format&fit=crop&w=1200&q=80" 
                      alt="Store Entrance" 
                      className="w-full h-full object-cover opacity-50 mix-blend-overlay"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-12">
                      <motion.div 
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="bg-white p-8 rounded-[3rem] shadow-2xl relative group"
                      >
                        <QRCodeSVG value="https://lookprice.app/demo" size={180} className="relative z-10" />
                        <div className="absolute inset-0 bg-indigo-600 opacity-0 group-hover:opacity-5 transition-opacity rounded-[3rem]" />
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-6 py-2 rounded-full font-black text-[10px] tracking-widest shadow-xl">
                          LOOKPRICE
                        </div>
                      </motion.div>
                      <p className="mt-12 text-white font-black text-2xl tracking-tighter text-center uppercase">
                        {lang === 'tr' ? 'MAĞAZA GİRİŞİNDE DİJİTAL KARŞILAMA' : 'DIGITAL WELCOME AT STORE ENTRANCE'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Floating Price Tag */}
                <motion.div 
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -left-12 -bottom-12 bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 z-20 transform -rotate-6 zebra-border"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                      <Tag className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instant_Price</div>
                      <div className="text-2xl font-black text-slate-900 tracking-tighter">₺1.250,00</div>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="w-2/3 h-full bg-indigo-600" />
                  </div>
                </motion.div>

                {/* Floating Barcode Badge */}
                <motion.div 
                  animate={{ x: [0, 15, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -right-8 top-1/2 glass-panel p-6 rounded-3xl shadow-xl border border-white/60 z-20 zebra-border"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center">
                      <Barcode className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product_ID</div>
                      <div className="text-lg font-black text-slate-900 tracking-tight">8690000001</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* Workflow Scenario Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 barcode-pattern opacity-5" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,rgba(79,70,229,0.05),transparent_50%)]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <h2 className="text-4xl sm:text-6xl font-black text-slate-900 mb-6 tracking-tighter">
              {t.workflow.title}
            </h2>
            <p className="text-xl text-slate-600 leading-relaxed">
              {t.workflow.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {[
              { 
                step: "01", 
                title: t.workflow.step1.title,
                desc: t.workflow.step1.desc,
                icon: Zap,
                image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80" // Employee changing tags visual
              },
              { 
                step: "02", 
                title: t.workflow.step2.title,
                desc: t.workflow.step2.desc,
                icon: Scan,
                image: "https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&w=800&q=80"
              },
              { 
                step: "03", 
                title: t.workflow.step3.title,
                desc: t.workflow.step3.desc,
                icon: FileText,
                image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80"
              },
              { 
                step: "04", 
                title: t.workflow.step4.title,
                desc: t.workflow.step4.desc,
                icon: CheckCircle2,
                image: "https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?auto=format&fit=crop&w=800&q=80"
              }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="relative h-48 rounded-3xl overflow-hidden mb-6 shadow-lg zebra-border">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-indigo-600/20 group-hover:bg-indigo-600/0 transition-colors" />
                  <div className="absolute top-4 left-4 w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                    <item.icon className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
                <div className="text-xs font-black text-indigo-600 mb-2 tracking-widest">{item.step}</div>
                <h4 className="text-xl font-black text-slate-900 mb-3 tracking-tight">{item.title}</h4>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Before vs After Section */}
      <section className="py-20 bg-slate-50 relative overflow-hidden">
        <div className="absolute inset-0 barcode-pattern opacity-5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-8 tracking-tighter">
                {t.beforeAfter.title}
              </h2>
              <div className="space-y-4">
                {[
                  { 
                    label: t.beforeAfter.labels.update, 
                    before: t.beforeAfter.values.updateOld, 
                    after: t.beforeAfter.values.updateNew,
                    icon: Tag 
                  },
                  { 
                    label: t.beforeAfter.labels.error, 
                    before: t.beforeAfter.values.errorOld, 
                    after: t.beforeAfter.values.errorNew,
                    icon: AlertCircle 
                  },
                  { 
                    label: t.beforeAfter.labels.cost, 
                    before: t.beforeAfter.values.costOld, 
                    after: t.beforeAfter.values.costNew,
                    icon: Barcode 
                  },
                  { 
                    label: t.beforeAfter.labels.interaction, 
                    before: t.beforeAfter.values.interactionOld, 
                    after: t.beforeAfter.values.interactionNew,
                    icon: QrCode 
                  }
                ].map((row, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between group hover:border-indigo-200 transition-all zebra-border">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                        <row.icon className="h-5 w-5 text-slate-400 group-hover:text-indigo-600" />
                      </div>
                      <span className="font-black text-slate-700 uppercase tracking-widest text-xs">{row.label}</span>
                    </div>
                    <div className="flex items-center space-x-8">
                      <div className="text-right">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.beforeAfter.old}</div>
                        <div className="text-sm font-bold text-slate-400 line-through">{row.before}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{t.beforeAfter.new}</div>
                        <div className="text-lg font-black text-indigo-600">{row.after}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-indigo-600 rounded-[4rem] overflow-hidden relative shadow-2xl zebra-border">
                <img 
                  src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80" 
                  alt="Customers in Store" 
                  className="w-full h-full object-cover opacity-60 mix-blend-overlay"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-8 shadow-2xl">
                    <Barcode className="h-12 w-12 text-indigo-600" />
                  </div>
                  <h3 className="text-3xl font-black text-white mb-4 tracking-tight">
                    {t.beforeAfter.efficiencyTitle}
                  </h3>
                  <p className="text-indigo-100 font-medium">
                    {t.beforeAfter.efficiencyDesc}
                  </p>
                </div>
              </div>
              {/* Floating Badge */}
              <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 zebra-border">
                <div className="text-4xl font-black text-indigo-600 mb-1">100%</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.beforeAfter.digitalAccuracy}</div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Conversion Section */}
      <section className="py-20 bg-indigo-600 text-white overflow-hidden relative">
        <div className="absolute inset-0 barcode-pattern opacity-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl sm:text-5xl font-black mb-8 leading-tight tracking-tighter">
                {lang === 'tr' 
                  ? 'Trafiği Çekmek Yetmez, Gelen Kişiyi "Müşteri" Yapmalıyız' 
                  : 'Attracting Traffic is Not Enough, We Must Make the Visitor a "Customer"'}
              </h2>
              <p className="text-xl text-indigo-100 mb-10 leading-relaxed">
                {lang === 'tr'
                  ? 'LookPrice sadece bir fiyat etiketi sistemi değildir. Müşterinizin merakını satışa dönüştüren bir pazarlama aracıdır.'
                  : 'LookPrice is not just a price tag system. It is a marketing tool that turns your customer\'s curiosity into a sale.'}
              </p>
              <ul className="space-y-6">
                {[
                  lang === 'tr' ? "Müşteri etkileşimini %60 artırın" : "Increase customer interaction by 60%",
                  lang === 'tr' ? "Kararsız müşterilere anında teklif sunun" : "Offer instant quotes to hesitant customers",
                  lang === 'tr' ? "Satış ekibinizin verimliliğini maksimize edin" : "Maximize the efficiency of your sales team"
                ].map((item, i) => (
                  <li key={i} className="flex items-center space-x-4">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <span className="font-bold">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-md p-8 rounded-[3rem] border border-white/20 shadow-2xl">
                <div className="bg-white rounded-[2rem] p-8 text-slate-900">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <span className="font-black tracking-tight">{t.ui.conversionRate}</span>
                    </div>
                    <span className="text-emerald-600 font-black">+24%</span>
                  </div>
                  <div className="space-y-6">
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: '85%' }}
                        className="h-full bg-indigo-600 rounded-full" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl">
                        <div className="text-[10px] font-black text-slate-400 uppercase mb-1">{t.ui.visitors}</div>
                        <div className="text-xl font-black">2,450</div>
                      </div>
                      <div className="p-4 bg-emerald-50 rounded-2xl">
                        <div className="text-[10px] font-black text-emerald-400 uppercase mb-1">{t.ui.sales}</div>
                        <div className="text-xl font-black text-emerald-600">588</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Clean & Spaced */}
      <section className="bg-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 barcode-pattern opacity-5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { label: t.stats.scans, value: "1.2M+", detail: "Processed monthly" },
              { label: t.stats.stores, value: "850+", detail: "Verified partners" },
              { label: t.stats.uptime, value: "99.9%", detail: "SLA Guaranteed" },
              { label: t.ui.support, value: "24/7", detail: "Expert assistance" }
            ].map((stat, i) => (
              <div key={i} className="text-center group p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 zebra-border hover:bg-white transition-all">
                <p className="text-5xl font-black text-slate-900 mb-3 tracking-tighter group-hover:text-indigo-600 transition-colors">{stat.value}</p>
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                <div className="h-1 w-8 bg-slate-100 mx-auto rounded-full group-hover:w-12 group-hover:bg-indigo-100 transition-all" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - Modern Cards */}
      <section id="Features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-block px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-6">
              {t.ui.capabilitiesMatrix}
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-6 leading-tight tracking-tighter">
              {t.features.title}
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              {t.features.subtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Scan, title: t.features.scan.title, desc: t.features.scan.desc, color: "bg-indigo-600", label: `01_${t.ui.scan}` },
              { icon: Zap, title: t.features.update.title, desc: t.features.update.desc, color: "bg-slate-900", label: `02_${t.ui.sync}` },
              { icon: BarChart3, title: t.features.analytics.title, desc: t.features.analytics.desc, color: "bg-emerald-600", label: `03_${t.ui.analyze}` }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group relative overflow-hidden">
                <div className="absolute top-10 right-10 text-[10px] font-black text-slate-200 uppercase tracking-widest group-hover:text-slate-300 transition-colors">
                  {feature.label}
                </div>
                <div className={`w-16 h-16 ${feature.color} text-white rounded-2xl flex items-center justify-center mb-10 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm font-medium mb-10">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo - Brutalist Touch */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-8 leading-[0.95] tracking-tighter">
                {t.demo.title}<br />
                <span className="text-indigo-600">{t.demo.subtitle}</span>
              </h2>
              <p className="text-xl text-slate-500 mb-12 leading-relaxed">
                {t.demo.desc}
              </p>
              
              <div className="space-y-6 mb-12">
                <div className="flex items-center space-x-6">
                  <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-slate-900/10">01</div>
                  <div>
                    <h4 className="font-black text-slate-900 tracking-tight">{t.demo.noApp}</h4>
                    <p className="text-sm text-slate-500">{t.demo.noAppDesc}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-slate-900/10">02</div>
                  <div>
                    <h4 className="font-black text-slate-900 tracking-tight">{t.demo.fast}</h4>
                    <p className="text-sm text-slate-500">{t.demo.fastDesc}</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => window.open(`${window.location.origin}/scan/demo-store`, '_blank')}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg flex items-center justify-center hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98]"
              >
                <ExternalLink className="h-5 w-5 mr-3" /> {t.demo.startBtn}
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative flex justify-center"
            >
              {/* Phone Mockup for QR */}
              <div className="relative w-full max-w-[320px] aspect-[9/19] bg-slate-900 rounded-[3rem] p-3 shadow-2xl border-4 border-slate-800">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-800 rounded-b-2xl z-20" />
                <div className="w-full h-full bg-white rounded-[2.2rem] overflow-hidden flex flex-col items-center justify-center p-8 text-center">
                  <div className="mb-8">
                    <Logo size={40} className="text-indigo-600 mx-auto mb-4" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.ui.scanToPreview}</p>
                  </div>
                  
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-inner mb-8">
                    <QRCodeSVG 
                      value={`${window.location.origin}/scan/demo-store`} 
                      size={180}
                      level="H"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-900">{t.demo.scanText}</p>
                    <div className="flex justify-center space-x-1">
                      {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />)}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative background element */}
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-600/5 rounded-full blur-3xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-6xl font-black text-slate-900 mb-6 tracking-tighter">
              {t.useCases.title}
            </h2>
            <p className="text-xl text-slate-600">
              {t.useCases.subtitle}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: t.useCases.items.furniture, icon: "🪑" },
              { name: t.useCases.items.electronics, icon: "🔌" },
              { name: t.useCases.items.jewelry, icon: "💎" },
              { name: t.useCases.items.automotive, icon: "🚗" },
              { name: t.useCases.items.fashion, icon: "👕" },
              { name: t.useCases.items.hardware, icon: "🛠️" },
              { name: t.useCases.items.sports, icon: "🏀" },
              { name: t.useCases.items.optics, icon: "👓" }
            ].map((item, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="p-8 bg-slate-50 rounded-3xl border border-slate-100 text-center hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all cursor-default"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <div className="font-black text-slate-900 text-sm uppercase tracking-tight">{item.name}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quotation System - Dark Luxury */}
      <section id="Quotation" className="py-32 bg-slate-950 text-white overflow-hidden relative">
        {/* Animated Background Flair */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.1),transparent_70%)]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col items-center gap-4 mb-10"
            >
              <div className="inline-block px-6 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-black uppercase tracking-[0.3em] text-indigo-400">
                {t.quotation.badge}
              </div>
              <div className="px-3 py-1 rounded-full bg-amber-500 text-[10px] font-black uppercase tracking-widest text-black animate-pulse">
                {lang === 'tr' ? 'YENİ ÖZELLİK' : 'NEW FEATURE'}
              </div>
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-5xl sm:text-7xl md:text-8xl font-black mb-10 leading-[0.9] tracking-tighter"
            >
              {t.quotation.title.split('\n').map((line, lineIdx) => (
                <div key={lineIdx}>
                  {line.split(/(HAYIR!|NO!|NEIN!)/).map((part, i) => {
                    if (part === 'HAYIR!' || part === 'NO!' || part === 'NEIN!') {
                      return <span key={i} className="text-rose-500">{part}</span>;
                    }
                    return part.split('LookPrice').map((p, j, arr) => (
                      <React.Fragment key={j}>
                        {p}
                        {j < arr.length - 1 && (
                          <span className="text-indigo-500">LookPrice</span>
                        )}
                      </React.Fragment>
                    ));
                  })}
                </div>
              ))}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl sm:text-2xl text-slate-400 leading-relaxed font-medium max-w-3xl mx-auto"
            >
              {t.quotation.desc}
            </motion.p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div>
              <div className="space-y-10">
                {[
                  { 
                    icon: <Zap className="h-8 w-8 text-indigo-400" />, 
                    title: t.quotation.fast, 
                    desc: t.quotation.fastDesc,
                    color: "indigo"
                  },
                  { 
                    icon: <BarChart3 className="h-8 w-8 text-blue-400" />, 
                    title: lang === 'tr' ? 'Teklif Takip Sistemi' : 'Quote Tracking System', 
                    desc: lang === 'tr' ? 'Hangi teklif ne zaman açıldı, ne kadar süre incelendi? Tüm süreci anlık takip edin.' : 'When was which quote opened, how long was it reviewed? Track the entire process instantly.',
                    color: "blue"
                  },
                  { 
                    icon: <Zap className="h-8 w-8 text-emerald-400" />, 
                    title: lang === 'tr' ? 'Otomasyon: Tek Tıkla Satış' : 'Automation: One-Click Sales', 
                    desc: lang === 'tr' ? 'Onaylanan teklifleri saniyeler içinde satışa ve faturaya dönüştürerek operasyonel yükü sıfırlayın.' : 'Reset the operational load by converting approved quotes into sales and invoices in seconds.',
                    color: "emerald"
                  },
                  { 
                    icon: <CheckCircle2 className="h-8 w-8 text-amber-400" />, 
                    title: lang === 'tr' ? 'Online Onay Mekanizması' : 'Online Approval Mechanism', 
                    desc: lang === 'tr' ? 'Müşterileriniz teklifleri online olarak inceleyip anında onaylasın veya revize istesin.' : 'Let your customers review quotes online and instantly approve or request revisions.',
                    color: "amber"
                  },
                  { 
                    icon: <Palette className="h-8 w-8 text-rose-400" />, 
                    title: t.quotation.custom, 
                    desc: t.quotation.customDesc,
                    color: "rose"
                  }
                ].map((feature, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start space-x-8 group"
                  >
                    <div className={`w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shrink-0 group-hover:bg-${feature.color}-500/10 group-hover:border-${feature.color}-500/30 transition-all duration-500`}>
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="text-2xl font-black mb-3 tracking-tight group-hover:text-white transition-colors">{feature.title}</h4>
                      <p className="text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">{feature.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="flex flex-col items-center pt-12">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedPlan("pro");
                    setShowRegisterModal(true);
                  }}
                  className="px-16 py-6 bg-white text-slate-950 rounded-[2.5rem] font-black text-lg hover:bg-indigo-50 transition-all shadow-2xl shadow-white/10 flex items-center space-x-4 group"
                >
                  <span>{t.quotation.cta}</span>
                  <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
                </motion.button>
                <p className="mt-6 text-slate-500 text-sm font-bold uppercase tracking-widest">
                  {lang === 'tr' ? 'KREDİ KARTI GEREKMEZ' : 'NO CREDIT CARD REQUIRED'}
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-1.5 rounded-[3rem] shadow-2xl">
                <div className="bg-white rounded-[2.6rem] overflow-hidden min-h-[520px] relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlide}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                      className="p-10 space-y-10 h-full"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <Logo size={40} className={currentSlide === 0 ? "text-indigo-600" : currentSlide === 1 ? "text-emerald-600" : "text-rose-600"} />
                          <div>
                            <div className="font-black text-slate-900 uppercase tracking-tighter">
                              {t.quotation.slides[currentSlide].name}
                            </div>
                            <div className="text-[8px] text-slate-400 font-bold">{t.ui.offerNo}2024-00{currentSlide + 1}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`w-24 h-2 rounded-full mb-2 ml-auto ${currentSlide === 0 ? "bg-indigo-100" : currentSlide === 1 ? "bg-emerald-100" : "bg-rose-100"}`} />
                          <div className={`w-16 h-2 rounded-full ml-auto ${currentSlide === 0 ? "bg-indigo-50" : currentSlide === 1 ? "bg-emerald-50" : "bg-rose-50"}`} />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {(currentSlide === 0 ? [
                          { name: "Premium Watch", price: "₺12.500" },
                          { name: "Leather Strap", price: "₺1.200" }
                        ] : currentSlide === 1 ? [
                          { name: "Diamond Ring", price: "₺45.000" },
                          { name: "Gift Box", price: "₺150" }
                        ] : [
                          { name: "Silk Scarf", price: "₺3.400" },
                          { name: "Handbag", price: "₺18.900" }
                        ]).map((item, i) => (
                          <div key={i} className="flex justify-between items-center py-5 border-b border-slate-50">
                            <div className="flex items-center space-x-5">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${currentSlide === 0 ? "bg-indigo-50" : currentSlide === 1 ? "bg-emerald-50" : "bg-rose-50"}`}>
                                <FileText className={`h-7 w-7 ${currentSlide === 0 ? "text-indigo-600" : currentSlide === 1 ? "text-emerald-600" : "text-rose-600"}`} />
                              </div>
                              <div className="text-base font-black text-slate-900 tracking-tight">{item.name}</div>
                            </div>
                            <div className={`px-5 py-2.5 rounded-xl text-xs font-black ${currentSlide === 0 ? "bg-indigo-50 text-indigo-600" : currentSlide === 1 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                              {item.price}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end pt-6">
                        <div className={`w-full h-16 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-xl active:scale-[0.98] transition-all ${currentSlide === 0 ? "bg-indigo-600 shadow-indigo-600/20" : currentSlide === 1 ? "bg-emerald-600 shadow-emerald-600/20" : "bg-rose-600 shadow-rose-600/20"}`}>
                          {t.quotation.approve}
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                  
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-3">
                    {[0, 1, 2].map((i) => (
                      <div 
                        key={i} 
                        className={`h-2 rounded-full transition-all duration-500 ${currentSlide === i ? 'w-10 bg-slate-900' : 'w-2 bg-slate-200'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Floating Badge */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-8 -bottom-8 bg-indigo-600 p-6 rounded-3xl shadow-2xl text-white z-20"
              >
                <Download className="h-8 w-8 mb-2" />
                <div className="text-[10px] font-black uppercase tracking-widest opacity-60">{t.ui.pdfReady}</div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>


      {/* ROI Calculator - Clean Minimal */}
      <section id="ROI" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 rounded-[4rem] p-12 md:p-24 border border-slate-100 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div>
                <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-8 leading-tight tracking-tighter">
                  {t.roi.title}
                </h2>
                <p className="text-xl text-slate-500 mb-16 leading-relaxed">
                  {t.roi.subtitle}
                </p>
                
                <div className="space-y-12">
                  <div>
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5">
                      <span>{t.roi.customers}</span>
                      <span className="text-indigo-600">500+</span>
                    </div>
                    <div className="h-4 bg-slate-200 rounded-full overflow-hidden p-1 shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: '75%' }}
                        className="h-full bg-indigo-600 rounded-full shadow-lg shadow-indigo-600/20" 
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5">
                      <span>{t.roi.time}</span>
                      <span className="text-emerald-600">40h</span>
                    </div>
                    <div className="h-4 bg-slate-200 rounded-full overflow-hidden p-1 shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: '50%' }}
                        className="h-full bg-emerald-600 rounded-full shadow-lg shadow-emerald-600/20" 
                      />
                    </div>
                  </div>
                </div>
                
                <p className="mt-16 text-sm text-slate-400 italic leading-relaxed font-serif">
                  {t.roi.disclaimer}
                </p>
              </div>

              <div className="bg-white p-12 md:p-16 rounded-[3.5rem] shadow-2xl border border-slate-100 text-center relative overflow-hidden group zebra-border">
                <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
                <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-10 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-12 w-12 text-emerald-600" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">{t.roi.annual}</p>
                <h3 className="text-3xl sm:text-6xl font-black text-slate-900 mb-6 tracking-tighter break-words leading-none px-4">{t.roi.annualValue}</h3>
                <p className="text-slate-500 mb-12 leading-relaxed">{t.roi.annualDesc}</p>
                <button 
                  onClick={() => {
                    setSelectedPlan("free");
                    setShowRegisterModal(true);
                  }}
                  className="w-full py-6 bg-indigo-600 text-white rounded-2xl font-black text-xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-600/20 active:scale-[0.98]"
                >
                  {t.roi.cta}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Management Section - Current Account & Cash Tracking */}
      <section className="py-20 bg-slate-950 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_100%,rgba(79,70,229,0.1),transparent_50%)]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10"
                >
                  <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6">
                    <Users className="h-7 w-7 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-black text-white mb-4 tracking-tight">{t.management.currentAccount.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {t.management.currentAccount.desc}
                  </p>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -5 }}
                  className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 sm:mt-12"
                >
                  <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6">
                    <Wallet className="h-7 w-7 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-black text-white mb-4 tracking-tight">{t.management.cashTracking.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {t.management.cashTracking.desc}
                  </p>
                </motion.div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <h2 className="text-4xl sm:text-6xl font-black text-white mb-8 tracking-tighter leading-tight">
                {t.management.title}
              </h2>
              <p className="text-xl text-slate-400 mb-12 leading-relaxed">
                {t.management.subtitle}
              </p>
              <button 
                onClick={() => {
                  setSelectedPlan("free");
                  setShowRegisterModal(true);
                }}
                className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-600/20 active:scale-95 flex items-center"
              >
                <CreditCard className="h-5 w-5 mr-3" />
                {t.management.cta}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="Pricing" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-8 leading-tight tracking-tighter">
              {t.pricing.title}
            </h2>
            <p className="text-xl text-slate-500 leading-relaxed">
              {t.pricing.subtitle}
            </p>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Free Plan */}
              <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col hover:shadow-xl transition-all zebra-border">
                <div className="mb-10">
                  <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">{t.pricing.free.name}</h3>
                  <div className="flex items-baseline">
                    <span className="text-5xl font-black text-slate-900 tracking-tighter">{t.pricing.free.price}</span>
                  </div>
                </div>
                <ul className="space-y-5 mb-12 flex-grow">
                  {t.pricing.free.features.map((feature: string, i: number) => (
                    <li key={i} className="flex items-start text-slate-600 text-sm font-bold">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-4 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => {
                    setSelectedPlan("free");
                    setShowRegisterModal(true);
                  }}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-base hover:bg-slate-800 transition-all active:scale-95"
                >
                  {t.pricing.free.cta}
                </button>
              </div>

              {/* Basic Plan */}
              <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col hover:shadow-xl transition-all zebra-border">
                <div className="mb-10">
                  <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">{t.pricing.basic.name}</h3>
                  <div className="flex items-baseline">
                    <span className="text-5xl font-black text-slate-900 tracking-tighter">{t.pricing.basic.price}</span>
                    <span className="text-slate-400 text-sm font-black uppercase tracking-widest ml-2">{t.pricing.basic.period}</span>
                  </div>
                </div>
                <ul className="space-y-5 mb-12 flex-grow">
                  {t.pricing.basic.features.map((feature: string, i: number) => (
                    <li key={i} className="flex items-start text-slate-600 text-sm font-bold">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-4 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button 
                  disabled
                  className="w-full py-5 bg-slate-100 text-slate-400 rounded-2xl font-black text-base cursor-not-allowed"
                >
                  {t.pricing.basic.cta}
                </button>
              </div>

              {/* Pro Plan */}
              <div className="bg-white p-10 rounded-[3rem] border-2 border-indigo-600 shadow-2xl flex flex-col relative hover:scale-[1.02] transition-all overflow-hidden zebra-border">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded-full shadow-lg shadow-indigo-600/20">Recommended</span>
                </div>
                <div className="mb-10 pt-4 relative z-10">
                  <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">{t.pricing.pro.name}</h3>
                  <div className="flex items-baseline">
                    <span className="text-5xl font-black text-slate-900 tracking-tighter">{t.pricing.pro.price}</span>
                    <span className="text-slate-400 text-sm font-black uppercase tracking-widest ml-2">{t.pricing.pro.period}</span>
                  </div>
                </div>
                <ul className="space-y-5 mb-12 flex-grow relative z-10">
                  {t.pricing.pro.features.map((feature: string, i: number) => (
                    <li key={i} className="flex items-start text-slate-600 text-sm font-bold">
                      <CheckCircle2 className="h-5 w-5 text-indigo-600 mr-4 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button 
                  disabled
                  className="w-full py-5 bg-indigo-50 text-indigo-400 rounded-2xl font-black text-base cursor-not-allowed border border-indigo-100 relative z-10"
                >
                  {t.pricing.pro.cta}
                </button>
              </div>

              {/* Enterprise Plan */}
              <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl flex flex-col text-white hover:shadow-indigo-900/10 transition-all zebra-border">
                <div className="mb-10">
                  <h3 className="text-xl font-black mb-3 tracking-tight">{t.pricing.enterprise.name}</h3>
                  <div className="flex items-baseline">
                    <span className="text-5xl font-black tracking-tighter">{t.pricing.enterprise.price}</span>
                  </div>
                </div>
                <ul className="space-y-5 mb-12 flex-grow">
                  {t.pricing.enterprise.features.map((feature: string, i: number) => (
                    <li key={i} className="flex items-start text-slate-400 text-sm font-bold">
                      <CheckCircle2 className="h-5 w-5 text-indigo-500 mr-4 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => setShowDemoModal(true)}
                  className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-base hover:bg-slate-100 transition-all active:scale-95"
                >
                  {t.pricing.enterprise.cta}
                </button>
              </div>
            </div>
        </div>
      </section>

      {/* Footer - Minimalist & Clean */}
      <footer className="bg-slate-950 pt-32 pb-16 border-t border-white/5 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-white/10">
                  <Logo size={24} className="text-slate-950" />
                </div>
                <span className="text-xl font-black text-white tracking-tighter">Look<span className="text-indigo-500">Price</span></span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-8 font-medium">
                {lang === 'tr' 
                  ? 'Perakende ve toptan satış süreçlerini dijitalleştiren, modern ve hızlı teklif yönetim platformu.' 
                  : 'A modern and fast quotation management platform digitizing retail and wholesale processes.'}
              </p>
              <div className="flex space-x-4">
                <a href="https://www.instagram.com/lookprice.me/" target="_blank" className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-white hover:text-indigo-400 hover:bg-white/10 transition-all cursor-pointer">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="https://wa.me/905488902309" target="_blank" className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-white hover:text-emerald-400 hover:bg-white/10 transition-all cursor-pointer">
                  <MessageCircle className="h-5 w-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-8">{t.footer.menu}</h4>
              <ul className="space-y-4">
                <li><button onClick={() => navigate("/login")} className="text-sm text-slate-400 font-bold hover:text-white transition-colors">{t.nav.login}</button></li>
                <li><button onClick={() => setShowDemoModal(true)} className="text-sm text-slate-400 font-bold hover:text-white transition-colors">{t.nav.demo}</button></li>
                <li><button className="text-sm text-slate-400 font-bold hover:text-white transition-colors">{t.footer.privacy}</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-8">{t.footer.contact}</h4>
              <ul className="space-y-4">
                <li className="flex items-center group">
                  <Phone className="h-4 w-4 mr-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                  <a href="tel:+905488902309" className="text-sm text-slate-400 font-bold hover:text-white transition-colors">+90 548 890 23 09</a>
                </li>
                <li className="flex items-center group">
                  <Mail className="h-4 w-4 mr-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                  <a href="mailto:lookprice.me@gmail.com" className="text-sm text-slate-400 font-bold hover:text-white transition-colors">lookprice.me@gmail.com</a>
                </li>
              </ul>
            </div>

            <div className="flex flex-col items-start lg:items-end">
              <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-8">Instagram_QR</h4>
              <div className="bg-white p-2 rounded-2xl w-28 h-28 flex items-center justify-center shadow-2xl shadow-indigo-500/10">
                <QRCodeSVG 
                  value="https://www.instagram.com/lookprice.me/" 
                  size={96}
                  level="H"
                />
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs font-black text-slate-500 uppercase tracking-[0.1em] mb-4 md:mb-0">
              {t.footer.rights}
            </p>
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2 text-xs font-black text-slate-500 uppercase tracking-[0.1em]">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span>System_Status: Operational</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Live Activity Notification */}
      <AnimatePresence>
        {liveActivity && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="fixed bottom-8 left-8 z-[100] bg-white p-5 rounded-[2rem] shadow-2xl border border-slate-100 flex items-center space-x-5 max-w-xs"
          >
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-600/20">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 tracking-tight">{liveActivity.name}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{liveActivity.location}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demo Request Modal - Modern & Clean */}
      <AnimatePresence>
        {showDemoModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDemoModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-12">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <div className="inline-block px-3 py-1 bg-indigo-50 text-[10px] font-black text-indigo-600 uppercase tracking-widest rounded-full mb-4">
                      Enterprise_Inquiry
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter">
                      {lang === 'tr' ? 'Demo Talebi' : 'Request Demo'}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setShowDemoModal(false)}
                    className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleDemoSubmit} className="space-y-6">
                  {demoStatus.text && (
                    <div className={`p-4 rounded-2xl text-sm font-black ${demoStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>
                      {demoStatus.text}
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'Ad Soyad' : 'Full Name'}</label>
                    <input 
                      type="text" 
                      required
                      placeholder="John Doe"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-bold text-slate-900"
                      value={demoForm.name} 
                      onChange={e => setDemoForm({...demoForm, name: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'Mağaza Adı' : 'Store Name'}</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Acme Store"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-bold text-slate-900"
                      value={demoForm.storeName} 
                      onChange={e => setDemoForm({...demoForm, storeName: e.target.value})} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'Telefon' : 'Phone'}</label>
                      <input 
                        type="tel" 
                        required
                        placeholder="+90..."
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-bold text-slate-900"
                        value={demoForm.phone} 
                        onChange={e => {
                          let val = e.target.value;
                          if (val && !val.startsWith('+')) val = '+' + val;
                          setDemoForm({...demoForm, phone: val});
                        }} 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-posta</label>
                      <input 
                        type="email" 
                        required
                        placeholder="john@example.com"
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-bold text-slate-900"
                        value={demoForm.email} 
                        onChange={e => setDemoForm({...demoForm, email: e.target.value})} 
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <button 
                      type="submit"
                      disabled={demoStatus.type === 'loading'}
                      className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98] disabled:opacity-50"
                    >
                      {demoStatus.type === 'loading' ? (lang === 'tr' ? 'Gönderiliyor...' : 'Sending...') : (lang === 'tr' ? 'Talebi Gönder' : 'Send Request')}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Video Modal Removed */}

      {/* Registration Modal - Modern & Multi-step */}
      <AnimatePresence>
        {showRegisterModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[110] overflow-y-auto">
            <div className="min-h-screen px-4 text-center flex items-center justify-center py-10">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full relative border border-slate-100 text-left"
              >
              {/* Header */}
              <div className="px-8 pt-8 md:px-10 md:pt-10 pb-6 border-b border-slate-50 relative">
                <button onClick={() => setShowRegisterModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 p-2 hover:bg-slate-50 rounded-xl transition-all z-10"><X /></button>
                
                <div className="pr-12 mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {registerStep === 1 && translations[lang].registration.steps.account}
                    {registerStep === 2 && translations[lang].registration.steps.company}
                    {registerStep === 3 && translations[lang].registration.steps.products}
                    {registerStep === 4 && translations[lang].registration.steps.mapping}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4].map((step) => {
                    let bgColor = 'bg-slate-100';
                    if (registerStep >= step) {
                      if (step === 1) bgColor = 'bg-indigo-500';
                      if (step === 2) bgColor = 'bg-violet-500';
                      if (step === 3) bgColor = 'bg-fuchsia-500';
                      if (step === 4) bgColor = 'bg-emerald-500';
                    }
                    return (
                      <div 
                        key={step} 
                        className={`h-2 rounded-full flex-1 transition-all duration-500 ${bgColor}`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Content */}
              <div className="px-8 py-6 md:px-10">

              {registerStatus.text && (
                <div className={`mb-8 p-5 rounded-2xl text-sm font-black shadow-sm ${
                  registerStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 
                  registerStatus.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-indigo-50 text-indigo-700'
                }`}>
                  {registerStatus.text}
                </div>
              )}

              {registerStep === 1 && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 ml-1">{translations[lang].registration.account.storeName}</label>
                    <input 
                      type="text" 
                      placeholder="My Awesome Store"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all outline-none text-slate-900" 
                      value={registerForm.storeName} 
                      onChange={e => setRegisterForm({...registerForm, storeName: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 ml-1">{translations[lang].registration.account.username}</label>
                    <input 
                      type="email" 
                      placeholder="admin@store.com"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all outline-none text-slate-900" 
                      value={registerForm.username} 
                      onChange={e => setRegisterForm({...registerForm, username: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 ml-1">{translations[lang].registration.account.password}</label>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all outline-none text-slate-900" 
                      value={registerForm.password} 
                      onChange={e => setRegisterForm({...registerForm, password: e.target.value})} 
                    />
                  </div>
                </div>
              )}

              {registerStep === 2 && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 ml-1">{translations[lang].registration.company.companyTitle}</label>
                    <input 
                      type="text" 
                      placeholder="Acme Corporation Ltd."
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all outline-none text-slate-900" 
                      value={registerForm.companyTitle} 
                      onChange={e => setRegisterForm({...registerForm, companyTitle: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 ml-1">{translations[lang].registration.company.address}</label>
                    <textarea 
                      rows={2}
                      placeholder="123 Business Ave, Suite 100"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all outline-none text-slate-900 resize-none" 
                      value={registerForm.address} 
                      onChange={e => setRegisterForm({...registerForm, address: e.target.value})} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 ml-1">{translations[lang].registration.company.country || 'Country'}</label>
                      <select 
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all outline-none text-slate-900 appearance-none" 
                        value={registerForm.country} 
                        onChange={e => {
                          const country = DEVELOPED_COUNTRIES.find(c => c.code === e.target.value);
                          setRegisterForm({
                            ...registerForm, 
                            country: e.target.value,
                            phone: country && (!registerForm.phone || registerForm.phone.trim() === '') ? country.dialCode + " " : registerForm.phone
                          });
                        }} 
                      >
                        {DEVELOPED_COUNTRIES.map(c => (
                          <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 ml-1">{translations[lang].registration.company.phone}</label>
                      <input 
                        type="tel" 
                        placeholder="+90..."
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all outline-none text-slate-900" 
                        value={registerForm.phone} 
                        onChange={e => {
                          let val = e.target.value;
                          if (val && !val.startsWith('+')) val = '+' + val;
                          setRegisterForm({...registerForm, phone: val});
                        }} 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 ml-1">{translations[lang].registration.company.language}</label>
                      <select 
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all outline-none text-slate-900 appearance-none" 
                        value={registerForm.language} 
                        onChange={e => setRegisterForm({...registerForm, language: e.target.value})} 
                      >
                        <option value="tr">Türkçe</option>
                        <option value="en">English</option>
                        <option value="de">Deutsch</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 ml-1">{translations[lang].registration.company.currency}</label>
                      <select 
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all outline-none text-slate-900 appearance-none" 
                        value={registerForm.currency} 
                        onChange={e => setRegisterForm({...registerForm, currency: e.target.value})} 
                      >
                        <option value="TRY">TL (₺)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {registerStep === 3 && (
                <div className="space-y-8">
                  <p className="text-slate-500 font-medium leading-relaxed">{translations[lang].registration.products.title}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <label className="cursor-pointer group">
                      <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
                      <div className="h-full p-8 bg-white border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center group-hover:border-indigo-600 group-hover:bg-indigo-50/50 transition-all shadow-sm">
                        <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform mb-4">
                          <Upload className="h-6 w-6 text-indigo-600" />
                        </div>
                        <h4 className="font-bold text-slate-900 mb-1 tracking-tight">{translations[lang].registration.products.excel}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t.ui.clickToUpload}</p>
                      </div>
                    </label>
                    <button 
                      onClick={() => {
                        setRegisterForm({...registerForm, uploadMethod: "manual"});
                        setRegisterStep(4);
                      }}
                      className="p-8 bg-white border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center hover:border-emerald-600 hover:bg-emerald-50/50 transition-all shadow-sm group"
                    >
                      <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform mb-4">
                        <Palette className="h-6 w-6 text-emerald-600" />
                      </div>
                      <h4 className="font-bold text-slate-900 mb-1 tracking-tight">{translations[lang].registration.products.manual}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t.ui.startFresh}</p>
                    </button>
                  </div>
                  <button 
                    onClick={downloadTemplate}
                    className="w-full py-4 bg-slate-50 text-slate-600 rounded-xl font-bold text-sm flex items-center justify-center hover:bg-slate-100 transition-all border border-slate-200"
                  >
                    <FileText className="h-4 w-4 mr-2" /> {translations[lang].registration.products.template}
                  </button>
                </div>
              )}

              {registerStep === 4 && (
                <div className="space-y-8">
                  {registerForm.uploadMethod === "excel" ? (
                    <>
                      <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                        <h4 className="font-bold text-indigo-900 mb-1 tracking-tight">{translations[lang].registration.mapping.title}</h4>
                        <p className="text-sm text-indigo-700 font-medium leading-relaxed">{translations[lang].registration.mapping.desc}</p>
                      </div>
                      
                      <div className="space-y-4">
                        {Object.keys(registerForm.mapping).map((key) => (
                          <div key={key} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center p-4 bg-white rounded-xl border border-slate-200">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                              {key === 'barcode' && translations[lang].registration.mapping.barcode}
                              {key === 'name' && translations[lang].registration.mapping.name}
                              {key === 'price' && translations[lang].registration.mapping.price}
                              {key === 'description' && translations[lang].registration.mapping.description}
                            </label>
                            <select 
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all outline-none text-sm font-bold text-slate-900 appearance-none"
                              value={registerForm.mapping[key as keyof typeof registerForm.mapping]}
                              onChange={e => setRegisterForm({
                                ...registerForm, 
                                mapping: { ...registerForm.mapping, [key]: e.target.value }
                              })}
                            >
                              <option value="">{t.ui.selectColumn}</option>
                              {registerForm.excelData.length > 0 && Object.keys(registerForm.excelData[0]).map(col => (
                                <option key={col} value={col}>{col}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="bg-white p-10 rounded-3xl text-center border border-slate-200 shadow-sm">
                      <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                      </div>
                      <h4 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">{translations[lang].registration.products.manual}</h4>
                      <p className="text-slate-500 text-sm font-medium leading-relaxed">{lang === 'tr' ? 'Hesabınız onaylandıktan sonra ürünlerinizi panel üzerinden tek tek ekleyebilirsiniz.' : 'You can add your products one by one through the panel after your account is approved.'}</p>
                    </div>
                  )}
                </div>
              )}
              </div>

              {/* Footer */}
              <div className="px-8 py-6 md:px-10 border-t border-slate-50 bg-slate-50/50 rounded-b-3xl">
                <div className="flex space-x-4">
                  {registerStep > 1 && (
                    <button 
                      onClick={() => setRegisterStep(prev => prev - 1)}
                      className="flex-1 py-3.5 bg-white text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all border border-slate-200"
                    >
                      {translations[lang].registration.buttons.back}
                    </button>
                  )}
                  {registerStep < 4 ? (
                    <button 
                      onClick={() => setRegisterStep(prev => prev + 1)}
                      disabled={!isStepValid()}
                      className="flex-[2] py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {translations[lang].registration.buttons.next}
                    </button>
                  ) : (
                    <button 
                      onClick={handleRegisterSubmit}
                      disabled={registerStatus.type === 'loading' || !isStepValid()}
                      className="flex-[2] py-3.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {registerStatus.type === 'loading' ? (lang === 'tr' ? 'Gönderiliyor...' : 'Sending...') : translations[lang].registration.buttons.submit}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
      {/* Sticky CTA */}
      <AnimatePresence>
        {showStickyCta && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-8 right-8 z-50"
          >
            <button
              onClick={() => {
                setSelectedPlan("free");
                setShowRegisterModal(true);
              }}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-2xl hover:bg-indigo-700 transition-all flex items-center space-x-3 group"
            >
              <span>{t.hero.cta}</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
