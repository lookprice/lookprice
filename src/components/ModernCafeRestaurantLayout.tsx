import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  ExternalLink,
  Utensils,
  ChevronRight,
  Sparkles,
  Compass,
  Instagram,
  Facebook,
  Twitter,
  Calendar,
  Layers,
  Award,
  Flame
} from "lucide-react";
import { Store, Product } from "../types";

interface ModernCafeRestaurantLayoutProps {
  store: Store;
  products: Product[];
  onViewProduct: (product: Product) => void;
  lang: string;
  t: any;
}

export const ModernCafeRestaurantLayout: React.FC<ModernCafeRestaurantLayoutProps> = ({
  store,
  products,
  onViewProduct,
  lang,
  t,
}) => {
  const isTr = lang === "tr";
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Group products by category
  const categories = React.useMemo(() => {
    const list = products.map((p) => p.category).filter(Boolean);
    return Array.from(new Set(list));
  }, [products]);

  const filteredProducts = React.useMemo(() => {
    if (selectedCategory === "bestsellers") {
      const explicit = products.filter((p) => p.is_bestseller);
      return explicit.length > 0 ? explicit : products.slice(0, 6);
    }
    if (selectedCategory === "all") return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const totalTables = store.page_layout_settings?.table_count || 12;

  // Social Links
  const socialLinks = [
    { icon: <Instagram className="w-5 h-5" />, url: store.instagram_url, label: "Instagram" },
    { icon: <Facebook className="w-5 h-5" />, url: store.facebook_url, label: "Facebook" },
    { icon: <Twitter className="w-5 h-5" />, url: store.twitter_url, label: "Twitter" },
  ].filter(link => link.url);

  // Digital menu path
  const digitalMenuUrl = `/digital-menu/${store.id}/web`;

  // Standard elegant cafe/restaurant themes use rich serif-style colors & soft warm aesthetics
  return (
    <div className="min-h-screen bg-stone-50/50 text-stone-800 font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* Warm Premium Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {store.logo_url ? (
              <img
                src={store.logo_url}
                alt={store.name}
                className="h-12 w-12 rounded-xl object-cover border border-stone-100 shadow-sm"
              />
            ) : (
              <div className="h-12 w-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-700 font-extrabold text-lg border border-amber-100">
                {store.name?.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <span className="block text-base font-black tracking-tight text-stone-900 leading-none">
                {store.name}
              </span>
              <span className="text-[10px] text-amber-700 font-bold uppercase tracking-widest mt-1 block">
                {isTr ? "Gurme Lezzetler" : "Gourmet Flavors"}
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-stone-600">
            <a href="#menu" className="hover:text-amber-700 transition-colors">{isTr ? "Menümüz" : "Our Menu"}</a>
            <a href="#story" className="hover:text-amber-700 transition-colors">{isTr ? "Hikayemiz" : "Our Story"}</a>
            <a href="#hours" className="hover:text-amber-700 transition-colors">{isTr ? "Çalışma Saatleri" : "Opening Hours"}</a>
            <a href="#contact" className="hover:text-amber-700 transition-colors">{isTr ? "İletişim" : "Contact"}</a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={digitalMenuUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide shadow-md shadow-amber-600/10 transition-all flex items-center gap-1.5"
            >
              <Utensils className="w-3.5 h-3.5" />
              {isTr ? "Dijital Menüyü Aç" : "Open Digital Menu"}
            </a>
          </div>
        </div>
      </header>

      {/* Atmospheric Cozy Hero Section */}
      <section className="relative overflow-hidden bg-stone-900 text-white min-h-[60vh] md:min-h-[70vh] flex items-center px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 z-0">
          <img
            src={store.hero_image_url || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=1600"}
            alt="Cafe Interior"
            className="w-full h-full object-cover opacity-35 filter brightness-75 scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/60 to-transparent" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-bold uppercase tracking-wider"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isTr ? "Eşsiz Lezzet Deneyimi" : "An Exquisite Culinary Experience"}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-amber-50 tracking-tight leading-tight"
          >
            {store.hero_title || (isTr ? "Sıcak Bir Atmosfer, Seçkin Tatlar" : "Warm Atmosphere, Fine Tastes")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-stone-200 font-medium max-w-2xl mx-auto leading-relaxed"
          >
            {store.hero_subtitle || (isTr ? "Usta şeflerimizin özenle hazırladığı taze lezzetler ve kaliteli kahve çeşitlerimizle günün her anına keyif katıyoruz." : "We elevate every moment of your day with fresh dishes masterfully crafted by our chefs and premium selection of coffee beans.")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <a
              href={digitalMenuUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold px-8 py-4 rounded-xl text-sm tracking-wide shadow-xl shadow-amber-600/20 transition-all flex items-center justify-center gap-2 group"
            >
              <Utensils className="w-4.5 h-4.5 group-hover:rotate-12 transition-transform" />
              {isTr ? "Dijital Menüden Sipariş Ver" : "Order from Digital Menu"}
            </a>
            {store.whatsapp_number && (
              <a
                href={`https://wa.me/${store.whatsapp_number.replace(/[^0-9+]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-stone-800/80 hover:bg-stone-700/80 backdrop-blur-sm border border-stone-700 text-stone-100 font-bold px-8 py-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4.5 h-4.5 text-green-400" />
                {isTr ? "Rezervasyon / İletişim" : "Make a Reservation"}
              </a>
            )}
          </motion.div>
        </div>
      </section>

      {/* Culinary Highlights / Menu Section */}
      <section id="menu" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <div className="text-xs text-amber-700 font-black uppercase tracking-widest">{isTr ? "SEÇKİN LEZZETLERİMİZ" : "OUR DISHES"}</div>
          <h2 className="text-3xl md:text-4xl font-serif font-black text-stone-900 tracking-tight">
            {isTr ? "Günün Öne Çıkan Menüsü" : "Signature Specialties"}
          </h2>
          <div className="w-12 h-1 bg-amber-600 mx-auto rounded-full mt-4" />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              selectedCategory === "all"
                ? "bg-amber-700 text-white shadow-md shadow-amber-700/10"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200/70"
            }`}
          >
            {isTr ? "TÜMÜ" : "ALL"}
          </button>
          <button
            onClick={() => setSelectedCategory("bestsellers")}
            className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              selectedCategory === "bestsellers"
                ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                : "bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200/60"
            }`}
          >
            <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
            {isTr ? "EN ÇOK SATANLAR" : "BESTSELLERS"}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                selectedCategory === cat
                  ? "bg-amber-700 text-white shadow-md shadow-amber-700/10"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200/70"
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Gourmet Menu Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => {
              const productDesc = product.description || (isTr ? "Özenle hazırlanan taze, eşsiz yerel lezzetler." : "Fresh culinary specialties prepared with premium ingredients.");
              return (
                <motion.div
                  layout
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => onViewProduct(product)}
                  className="group bg-white p-5 rounded-3xl border border-stone-200/40 hover:border-amber-700/20 shadow-sm hover:shadow-xl hover:shadow-stone-200/30 transition-all duration-300 flex gap-4 sm:gap-6 cursor-pointer relative"
                >
                  <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-2xl overflow-hidden bg-stone-100 border border-stone-100">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300">
                        <Utensils className="w-8 h-8" />
                      </div>
                    )}
                    {product.is_bestseller && (
                      <div className="absolute top-1.5 left-1.5 bg-orange-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm z-10">
                        <Flame className="w-2.5 h-2.5 fill-white" />
                        {isTr ? "POPÜLER" : "POPULAR"}
                      </div>
                    )}
                    {!product.is_bestseller && product.tags && (
                      <div className="absolute top-1.5 left-1.5 bg-amber-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md">
                        {product.tags.split(",")[0]}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-serif font-bold text-stone-900 text-base group-hover:text-amber-700 transition-colors leading-snug line-clamp-1">
                          {product.name}
                        </h3>
                        <span className="text-amber-700 font-black text-sm whitespace-nowrap shrink-0 ml-2">
                          {product.price} ₺
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 font-medium mt-1.5 line-clamp-2 leading-relaxed">
                        {productDesc}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-stone-50">
                      <span className="text-[10px] bg-stone-50 text-stone-500 px-2.5 py-1 rounded-lg font-bold border border-stone-100">
                        {product.category || (isTr ? "Genel" : "General")}
                      </span>
                      <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        {isTr ? "Detayları İncele" : "View Details"} <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20 text-stone-400 font-medium">
            {isTr ? "Bu kategoride henüz ürün bulunmuyor." : "No dishes listed under this category yet."}
          </div>
        )}
      </section>

      {/* Atmospheric Our Story / Story Section */}
      <section id="story" className="bg-stone-900 text-stone-200 py-24 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-6 lg:max-w-xl">
            <span className="text-xs text-amber-500 font-black uppercase tracking-[0.2em]">{isTr ? "HİKAYEMİZ & TUTKUMUZ" : "OUR HERITAGE"}</span>
            <h2 className="text-3xl md:text-4xl font-serif font-black text-stone-100 tracking-tight leading-tight">
              {isTr ? "Her Lokmada Bir Lezzet Öyküsü" : "A Taste Built on Pure Culinary Love"}
            </h2>
            <div className="w-12 h-1 bg-amber-500 rounded-full" />
            <p className="text-stone-300 leading-relaxed text-sm sm:text-base font-medium">
              {store.about_text || (isTr 
                ? "Sizlere sadece yemek sunmakla kalmıyoruz; keyifle paylaşılan anlara, sıcacık sohbetlere ve unutulmaz anılara ev sahipliği yapıyoruz. En kaliteli yerel malzemeleri seçiyor, usta ellerin vizyonuyla harmanlayıp masanıza getiriyoruz."
                : "We do not just offer gourmet food; we host warm conversations, shared laughter, and beautiful memories. Selecting only the finest local ingredients, masterfully combined and elegantly served to your table.")}
            </p>
            <div className="grid grid-cols-3 gap-6 pt-4 border-t border-stone-800">
              <div>
                <span className="block text-2xl font-black text-amber-500 font-serif">%100</span>
                <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mt-1 block">{isTr ? "Taze Ürün" : "Fresh Daily"}</span>
              </div>
              <div>
                <span className="block text-2xl font-black text-amber-500 font-serif">{totalTables}</span>
                <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mt-1 block">{isTr ? "Masa Servisi" : "Tables"}</span>
              </div>
              <div>
                <span className="block text-2xl font-black text-amber-500 font-serif">A+</span>
                <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mt-1 block">{isTr ? "Kalite Hizmet" : "Service Rate"}</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-tr from-amber-500 to-stone-800 rounded-[2.5rem] opacity-10 blur-xl" />
            <img
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000"
              alt="Atmospheric Table Setup"
              className="w-full h-80 md:h-[400px] object-cover rounded-[2rem] shadow-2xl relative z-10 border border-stone-800"
            />
          </div>
        </div>
      </section>

      {/* Opening Hours & Atmosphere Section */}
      <section id="hours" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
          
          {/* opening hours */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200/50 shadow-xl shadow-stone-200/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-extrabold text-stone-900 leading-none">{isTr ? "Çalışma Saatleri" : "Opening Hours"}</h3>
                  <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mt-1 block">{isTr ? "Kapımız Her Gün Açık" : "Open 7 Days a Week"}</span>
                </div>
              </div>
              <p className="text-sm text-stone-500 font-medium mb-8 leading-relaxed">
                {isTr 
                  ? "Sizlere en iyi deneyimi sunmak adına haftanın her günü taze lezzetlerimiz ve güler yüzlü ekibimizle hizmetinizdeyiz." 
                  : "We welcome you 7 days a week with a warm environment, fresh ingredients, and helpful staff."}
              </p>
              
              <div className="space-y-3.5 border-t border-stone-100 pt-6">
                {[
                  { days: isTr ? "Pazartesi - Cuma" : "Monday - Friday", hours: "08:30 - 23:00" },
                  { days: isTr ? "Cumartesi" : "Saturday", hours: "09:00 - 23:30" },
                  { days: isTr ? "Pazar" : "Sunday", hours: "09:00 - 22:30" },
                ].map((schedule, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm font-bold text-stone-700">
                    <span className="text-stone-500">{schedule.days}</span>
                    <span className="text-stone-900 font-mono">{schedule.hours}</span>
                  </div>
                ))}
              </div>
            </div>

            {store.phone && (
              <div className="mt-8 pt-6 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] text-stone-400 font-bold uppercase tracking-wider">{isTr ? "REZERVASYON VE TELEFON" : "TELEPHONE & BOOKING"}</span>
                  <span className="block text-base font-black text-stone-800 mt-1">{store.phone}</span>
                </div>
                <a
                  href={`tel:${store.phone}`}
                  className="bg-stone-900 hover:bg-stone-800 text-white p-3.5 rounded-2xl transition-colors shadow-lg shadow-stone-950/10"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>

          {/* Table Service & Digital Menu Guide */}
          <div className="bg-amber-700 text-amber-50 p-8 rounded-[2.5rem] shadow-xl shadow-amber-900/10 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-600 rounded-full blur-2xl opacity-40 -translate-y-12 translate-x-12" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white/10 text-white rounded-2xl border border-white/20">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-extrabold text-white leading-none">{isTr ? "Temassız Masa Servisi" : "Contactless Ordering"}</h3>
                  <span className="text-[10px] text-amber-200 uppercase tracking-widest font-bold mt-1 block">{isTr ? "Tek Tıkla Sipariş" : "Scan & Order"}</span>
                </div>
              </div>
              
              <h4 className="text-xl md:text-2xl font-serif font-bold text-white mb-4 leading-tight">
                {isTr ? "Sıra beklemeden, yerinizden sipariş verin!" : "No lines. Just sit down, scan and enjoy!"}
              </h4>
              <p className="text-sm text-amber-100/90 leading-relaxed font-medium mb-6">
                {isTr 
                  ? "Masalarımızda yer alan QR kodları taratarak veya web sitemiz üzerinden doğrudan dijital sipariş menümüze ulaşabilir, özel isteklerinizi anında mutfağımıza iletebilirsiniz." 
                  : "Simply scan the QR code at your table or access our beautiful contactless digital menu from your phone. Send your custom notes straight to our kitchen instantly."}
              </p>
            </div>

            <a
              href={digitalMenuUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-amber-900 hover:bg-amber-50 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-center shadow-lg relative z-10 transition-colors flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4 text-amber-700" />
              {isTr ? "DİJİTAL MENÜYE GİT" : "VISIT DIGITAL MENU"}
            </a>
          </div>

        </div>
      </section>

      {/* Footer & Contact */}
      <footer id="contact" className="bg-stone-950 text-stone-400 pt-20 pb-10 border-t border-stone-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            
            <div className="space-y-4">
              <h3 className="text-lg font-serif font-black text-white">{store.name}</h3>
              <p className="text-xs text-stone-500 font-medium leading-relaxed">
                {isTr ? "Her damak tadına hitap eden kaliteli malzemelerle bezenmiş lezzet reçeteleri." : "A sensory showcase of delicious culinary delights made with love and fresh local produce."}
              </p>
              {socialLinks.length > 0 && (
                <div className="flex gap-3 pt-2">
                  {socialLinks.map((social, idx) => (
                    <a
                      key={idx}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-stone-900 hover:bg-stone-800 rounded-xl text-stone-400 hover:text-amber-500 transition-all border border-stone-800"
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-widest">{isTr ? "HIZLI LİNKLER" : "QUICK LINKS"}</h4>
              <ul className="space-y-2 text-xs font-semibold">
                <li><a href="#menu" className="hover:text-amber-500 transition-colors">{isTr ? "Menümüz" : "Our Menu"}</a></li>
                <li><a href="#story" className="hover:text-amber-500 transition-colors">{isTr ? "Hikayemiz" : "Our Story"}</a></li>
                <li><a href="#hours" className="hover:text-amber-500 transition-colors">{isTr ? "Çalışma Saatleri" : "Opening Hours"}</a></li>
                <li><a href={digitalMenuUrl} target="_blank" rel="noopener noreferrer" className="hover:text-amber-500 transition-colors flex items-center gap-1">{isTr ? "Dijital Menü" : "Digital Menu"} <ExternalLink className="w-3 h-3" /></a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-widest">{isTr ? "İLETİŞİM BİLGİLERİ" : "CONTACT US"}</h4>
              <ul className="space-y-3.5 text-xs font-semibold">
                {store.phone && (
                  <li className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-stone-300">{store.phone}</span>
                  </li>
                )}
                {store.address && (
                  <li className="flex items-start gap-2 leading-relaxed">
                    <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-stone-300">{store.address}</span>
                  </li>
                )}
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-widest">{isTr ? "KONUMUMUZ" : "LOCATION"}</h4>
              <div className="h-28 w-full bg-stone-900 rounded-2xl overflow-hidden border border-stone-800">
                {/* Embedded dynamic location link map visualizer placeholder */}
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                  <MapPin className="w-6 h-6 text-amber-500 mb-1.5 animate-bounce" />
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address || store.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-amber-500 font-bold hover:underline flex items-center gap-1"
                  >
                    {isTr ? "Haritada Göster" : "Show on Google Maps"} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

          </div>

          <div className="pt-10 border-t border-stone-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-stone-600">
            <p>© 2026 {store.name}. {isTr ? "Tüm Hakları Saklıdır." : "All Rights Reserved."}</p>
            <div className="flex gap-6">
              <span>{isTr ? "Seçkin Mağaza Altyapısı" : "Premium Store Architecture"}</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};
