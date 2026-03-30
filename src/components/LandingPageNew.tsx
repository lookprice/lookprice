import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, Zap, BarChart3, X, Wrench, Truck, Package, Wallet, Check, Globe, FileText, ShoppingCart, ArrowLeftRight, Layout } from "lucide-react";
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
      <div className="fixed top-8 left-8 z-[100]">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-black rounded-sm" />
          </div>
          <span className="text-xl font-medium tracking-tight">LookPrice</span>
        </div>
      </div>

      <div className="fixed top-8 right-8 z-[100] flex items-center space-x-4">
        {/* Language Switcher */}
        <div className="flex items-center space-x-2 bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-md">
          <div className="pl-3 pr-1 text-white/40">
            <Globe className="w-4 h-4" />
          </div>
          {['tr', 'en', 'de'].map((l) => (
            <button 
              key={l}
              onClick={() => setLang(l as 'tr' | 'en' | 'de')}
              className={`w-9 h-9 flex items-center justify-center rounded-full text-xs font-medium transition-all ${
                lang === l 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        
        {/* Login Button */}
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full text-sm font-medium transition-all backdrop-blur-md"
        >
          {lang === 'tr' ? 'Giriş Yap' : 'Login'}
        </button>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex flex-col justify-center px-6 md:px-12 lg:px-24 pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#050505] to-[#050505] pointer-events-none" />
        
        <div className="relative z-10 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-tighter mb-8 leading-[1.05]">
              Retail Operations,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                Engineered.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/50 max-w-2xl mb-12 font-light leading-relaxed">
              {lang === 'tr' 
                ? 'Fikirden ölçeğe, perakende ve hizmet sektörünün dijital omurgası. Karmaşayı yönetilebilir verilere dönüştürüyoruz.' 
                : 'The digital backbone of retail and service sectors, from idea to scale. We turn chaos into manageable data.'}
            </p>

            <button
              onClick={() => setShowDemoModal(true)}
              className="group relative inline-flex items-center justify-center px-8 py-4 font-medium text-white bg-white/5 border border-white/10 rounded-full overflow-hidden transition-all hover:bg-white hover:text-black"
            >
              <span className="relative z-10 flex items-center">
                {lang === 'tr' ? 'Teknik Konsültasyon Talep Edin' : 'Request Technical Consultation'}
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Use Cases / Scenarios Section */}
      <section className="px-6 md:px-12 lg:px-24 py-32 border-t border-white/5 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight mb-6">
              {lang === 'tr' ? 'Hangi Aşamasındasınız?' : 'Where Are You in Your Journey?'}
            </h2>
            <p className="text-white/40 text-lg font-light max-w-2xl mx-auto">
              {lang === 'tr' 
                ? 'İster ilk mağazanızı açıyor olun, ister mevcut operasyonunuzu büyütüyor olun; LookPrice sizin için tasarlandı.' 
                : 'Whether you are opening your first store or scaling your existing operation; LookPrice is built for you.'}
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
            {/* Tabs/Selectors */}
            <div className="flex lg:flex-col gap-4 w-full lg:w-1/3 overflow-x-auto pb-4 lg:pb-0 snap-x">
              <button 
                onClick={() => setActiveScenario('new')}
                className={`text-left p-6 rounded-2xl transition-all min-w-[280px] lg:min-w-0 snap-start ${activeScenario === 'new' ? 'bg-white/10 border border-white/20' : 'bg-transparent border border-transparent hover:bg-white/5'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${activeScenario === 'new' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-white/40'}`}>
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className={`text-xl font-medium mb-2 ${activeScenario === 'new' ? 'text-white' : 'text-white/60'}`}>
                  {lang === 'tr' ? 'Sıfırdan Kurulum' : 'Starting Fresh'}
                </h3>
                <p className={`text-sm font-light ${activeScenario === 'new' ? 'text-white/60' : 'text-white/40'}`}>
                  {lang === 'tr' ? 'Yeni girişimciler için ilk günden kurumsal altyapı.' : 'Corporate infrastructure from day one for new entrepreneurs.'}
                </p>
              </button>

              <button 
                onClick={() => setActiveScenario('existing')}
                className={`text-left p-6 rounded-2xl transition-all min-w-[280px] lg:min-w-0 snap-start ${activeScenario === 'existing' ? 'bg-white/10 border border-white/20' : 'bg-transparent border border-transparent hover:bg-white/5'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${activeScenario === 'existing' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white/40'}`}>
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className={`text-xl font-medium mb-2 ${activeScenario === 'existing' ? 'text-white' : 'text-white/60'}`}>
                  {lang === 'tr' ? 'Operasyonel Dönüşüm' : 'Operational Transformation'}
                </h3>
                <p className={`text-sm font-light ${activeScenario === 'existing' ? 'text-white/60' : 'text-white/40'}`}>
                  {lang === 'tr' ? 'Mevcut işletmeler için kaostan kontrole geçiş.' : 'From chaos to control for existing businesses.'}
                </p>
              </button>
            </div>

            {/* Content Area */}
            <div className="w-full lg:w-2/3 bg-[#111] border border-white/10 rounded-3xl p-8 md:p-12 relative overflow-hidden min-h-[450px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {activeScenario === 'new' ? (
                  <motion.div 
                    key="new"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="relative z-10"
                  >
                    <div className="inline-block px-4 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-medium tracking-wider uppercase mb-6 border border-indigo-500/20">
                      {lang === 'tr' ? 'Senaryo: İlk Günden Kurumsal' : 'Scenario: Corporate from Day One'}
                    </div>
                    <h4 className="text-2xl md:text-3xl font-medium tracking-tight mb-6 leading-snug">
                      {lang === 'tr' 
                        ? '"Nereden başlarım, nasıl yönetirim, ya işin içinden çıkamazsam?"' 
                        : '"Where do I start, how do I manage, what if I get overwhelmed?"'}
                    </h4>
                    <div className="space-y-6 text-white/50 font-light leading-relaxed">
                      <p>
                        {lang === 'tr'
                          ? 'Dükkanı kiraladınız, rafları dizdiniz. Peki ya operasyon? Müşteri cihaz getirdiğinde kağıda mı yazacaksınız? Satış yaptığınızda stoktan nasıl düşecek? Muhasebeciye ay sonunda fişleri poşetle mi götüreceksiniz?'
                          : 'You rented the shop, stocked the shelves. What about operations? When a customer brings a device, will you write it on paper? How will stock drop when you sell? Will you carry receipts in a bag to the accountant?'}
                      </p>
                      <div className="p-6 bg-white/5 rounded-2xl border border-white/5 mt-8">
                        <h5 className="text-white font-medium mb-3 flex items-center"><Zap className="w-4 h-4 mr-2 text-indigo-400"/> LookPrice Devrede:</h5>
                        <p className="text-sm leading-relaxed">
                          {lang === 'tr'
                            ? 'Açılış gününde elinizde sadece bir tablet var. Müşteri geldiğinde 10 saniyede dijital kayıt oluşturun, SMS ile bilgilendirin. Satış yapın; stok otomatik düşsün, cari hesap güncellensin, kasanız netleşsin. İlk günden 10 yıllık kurumsal bir firma gibi çalışın.'
                            : 'On opening day, you only need a tablet. Create digital records in 10 seconds, notify via SMS. Make a sale; stock drops automatically, accounts update, cash register is clear. Work like a 10-year corporate firm from day one.'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="existing"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="relative z-10"
                  >
                    <div className="inline-block px-4 py-1.5 bg-cyan-500/10 text-cyan-400 rounded-full text-xs font-medium tracking-wider uppercase mb-6 border border-cyan-500/20">
                      {lang === 'tr' ? 'Senaryo: Kaostan Kontrole' : 'Scenario: From Chaos to Control'}
                    </div>
                    <h4 className="text-2xl md:text-3xl font-medium tracking-tight mb-6 leading-snug">
                      {lang === 'tr' 
                        ? '"İşler büyüdü ama sistemler yetersiz. Sürekli bir yangın söndürme halindeyiz."' 
                        : '"Business grew but systems are inadequate. We are constantly putting out fires."'}
                    </h4>
                    <div className="space-y-6 text-white/50 font-light leading-relaxed">
                      <p>
                        {lang === 'tr'
                          ? 'Şubeleriniz, personelleriniz ve araçlarınız var. Ancak servis durumu WhatsApp\'tan soruluyor, stoklar Excel\'de tutuluyor (ve hep yanlış), muhasebe ayrı bir programda. Müşteri "Cihazım nerede?" dediğinde bulmak dakikalar alıyor.'
                          : 'You have branches, staff, and vehicles. But service status is asked via WhatsApp, stocks are in Excel (and always wrong), accounting is separate. When a customer asks "Where is my device?", it takes minutes to find.'}
                      </p>
                      <div className="p-6 bg-white/5 rounded-2xl border border-white/5 mt-8">
                        <h5 className="text-white font-medium mb-3 flex items-center"><BarChart3 className="w-4 h-4 mr-2 text-cyan-400"/> LookPrice Devrede:</h5>
                        <p className="text-sm leading-relaxed">
                          {lang === 'tr'
                            ? 'Tüm parçalı sistemleri çöpe atın. Müşteri aradığında saniyeler içinde tüm geçmişini, cari borcunu ve cihazının hangi teknisyende olduğunu görün. Kritik stok ve araç muayene uyarıları otomatik gelsin. Taşıma suyuyla değirmen döndürmeyi bırakın; işletmenizi verilerle yönetin.'
                            : 'Throw away fragmented systems. See full customer history, debts, and device status in seconds. Get automated alerts for critical stock and vehicle inspections. Stop running on manual effort; manage your business with data.'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Background decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-white/5 to-transparent rounded-full blur-3xl pointer-events-none" />
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
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
            <div className="w-3 h-3 bg-black rounded-sm" />
          </div>
          <span className="font-medium tracking-tight">LookPrice</span>
        </div>
        
        <div className="text-white/30 text-sm font-light">
          {lang === 'tr' ? 'Sürdürülebilir büyüme için, sağlam altyapı.' : 'Solid infrastructure for sustainable growth.'}
        </div>
        
        <div className="flex space-x-6 text-sm text-white/50">
          <a href="mailto:hello@lookprice.com" className="hover:text-white transition-colors">hello@lookprice.com</a>
          <a href="tel:+905550000000" className="hover:text-white transition-colors">+90 555 000 00 00</a>
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
