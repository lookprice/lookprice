import React from "react";
import { motion } from "motion/react";
import {
  Palette,
  RefreshCw,
  Image as ImageIcon,
  ShoppingBag,
  User,
  Mail,
  Smartphone,
  Star,
  ShieldCheck,
  Upload,
  Plus,
  X,
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
  Tag,
  Lock,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Eye,
  EyeOff,
} from "lucide-react";

interface SettingsWebTabProps {
  branding: any;
  onBrandingChange: (field: string, value: any) => void;
  lang: string;
  isPortfolio: boolean;
  currentUser: any;
  emails: string[];
  phones: string[];
  updateEmail: (index: number, value: string) => void;
  removeEmail: (index: number) => void;
  addEmail: () => void;
  updatePhone: (index: number, value: string) => void;
  removePhone: (index: number) => void;
  addPhone: () => void;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFaviconUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBannerUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  users: any[];
  onAddUser: () => void;
  onDeleteUser: (id: number) => void;
}

export const SettingsWebTab = ({

  branding,
  onBrandingChange,
  lang,

  isPortfolio,
  currentUser,
  emails,
  phones,
  updateEmail,
  removeEmail,
  addEmail,
  updatePhone,
  removePhone,
  addPhone,
  onLogoUpload,
  onFaviconUpload,
  onBannerUpload,
  users,
  onAddUser,
  onDeleteUser,
}: SettingsWebTabProps) => {
  const txt = (tr: string, en: string, el: string) => (lang === "tr" ? tr : lang === "el" ? el : en);
  const isCafeRestaurant = branding?.store_type === 'cafe_restaurant' || branding?.page_layout_settings?.sector === 'cafe_restaurant';
  const rawBanners = Array.isArray(branding?.banners) ? branding.banners : [];

  const displayBanners = React.useMemo(() => {
    if (rawBanners.length > 0) return rawBanners;
    if (branding?.hero_image_url || branding?.hero_title) {
      return [{
        id: "legacy",
        image_url: branding?.hero_image_url || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80",
        title: branding?.hero_title || "",
        subtitle: branding?.hero_subtitle || "",
        text_position: "center",
        show_store_name: true,
        button_text: lang === "tr" ? "İncele" : "Explore",
        button_link: "#portfolio"
      }];
    }
    return [];
  }, [rawBanners, branding?.hero_image_url, branding?.hero_title, branding?.hero_subtitle, lang]);

  const handleAddBanner = () => {
    const newBanner = {
      id: Date.now().toString(),
      image_url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80",
      title: "",
      subtitle: "",
      text_position: "center",
      show_store_name: true,
      button_text: lang === "tr" ? "İncele" : "Explore",
      button_link: "#portfolio"
    };
    
    const baseBanners = rawBanners.length > 0 ? rawBanners : displayBanners;
    const updated = [...baseBanners, newBanner];
    onBrandingChange("banners", updated);
    
    if (updated.length > 0) {
      onBrandingChange("hero_image_url", updated[0].image_url || "");
      onBrandingChange("hero_title", updated[0].title || "");
      onBrandingChange("hero_subtitle", updated[0].subtitle || "");
    }
  };

  const handleUpdateBannerFieldSafe = (id: string, field: string, value: any) => {
    const baseBanners = rawBanners.length > 0 ? rawBanners : displayBanners;
    const currentList = baseBanners.map((b: any) => b.id === id ? { ...b, [field]: value } : b);
    
    onBrandingChange("banners", currentList);
    if (currentList.length > 0) {
      onBrandingChange("hero_image_url", currentList[0].image_url || "");
      onBrandingChange("hero_title", currentList[0].title || "");
      onBrandingChange("hero_subtitle", currentList[0].subtitle || "");
    }
  };

  const handleRemoveBannerSafe = (id: string) => {
    const currentList = displayBanners.filter((b: any) => b.id !== id);
    onBrandingChange("banners", currentList);
    if (currentList.length > 0) {
      onBrandingChange("hero_image_url", currentList[0].image_url || "");
      onBrandingChange("hero_title", currentList[0].title || "");
      onBrandingChange("hero_subtitle", currentList[0].subtitle || "");
    } else {
      onBrandingChange("hero_image_url", "");
      onBrandingChange("hero_title", "");
      onBrandingChange("hero_subtitle", "");
    }
  };

  const handleBannerImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const b64 = uploadEvent.target?.result as string;
        handleUpdateBannerFieldSafe(id, "image_url", b64);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-6 pb-20"
    >
      {/* Main Visual Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Showcase & Layout Controls */}
        {!isPortfolio && (
          <div className="lg:col-span-2 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-500" />
                {txt("VİTRİN VE TASARIM", "SHOWCASE & DESIGN", "ΒΙΤΡΙΝΑ ΚΑΙ ΣΧΕΔΙΑΣΜΟΣ")}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {[
                { id: "announcement_bar", icon: <Tag className="w-4 h-4" />, label: txt("Duyuru Bandı", "Announcement Bar", "Γραμμή Ανακοινώσεων") },
                { id: "testimonials", icon: <Star className="w-4 h-4" />, label: txt("Müşteri Yorumları", "Testimonials", "Μαρτυρίες") },
                { id: "newsletter", icon: <Mail className="w-4 h-4" />, label: txt("Haber Bülteni", "Newsletter", "Newsletter") },
                { id: "live_activity", icon: <MessageCircle className="w-4 h-4" />, label: txt("Canlı Aktivite", "Live Activity", "Ζωντανή Δραστηριότητα") },
                { id: "featured_deals", icon: <Tag className="w-4 h-4" />, label: txt("Fiyatı Düşenler (Fırsat)", "Featured Deals", "Προσφορές") },
              ].map(toggle => (
                <label key={toggle.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-indigo-50/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={branding?.page_layout_settings?.[toggle.id] !== false}
                    onChange={(e) => {
                      const current = branding?.page_layout_settings || {};
                      onBrandingChange("page_layout_settings", { ...current, [toggle.id]: e.target.checked });
                    }}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <div className="flex items-center gap-2 text-slate-700 text-xs font-bold">
                    {toggle.icon}
                    <span>{toggle.label}</span>
                  </div>
                </label>
              ))}
            </div>

            {branding?.page_layout_settings?.announcement_bar !== false && (
              <div className="mb-6">
                <input
                  type="text"
                  value={branding?.page_layout_settings?.announcement_text || ""}
                  onChange={(e) => {
                    const current = branding?.page_layout_settings || {};
                    onBrandingChange("page_layout_settings", { ...current, announcement_text: e.target.value });
                  }}
                  placeholder={txt("Duyuru metnini buraya yazın...", "Enter announcement text here...", "Πληκτρολογήστε κείμενο ανακοίνωσης...")}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700"
                />
              </div>
            )}
            
            <div className="pt-6 border-t border-slate-100">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">
                {txt("TEMA KONSEPTİ", "THEME CONCEPT", "ΚΟΝΣΕΠΤ ΘΕΜΑΤΟΣ")}
              </h4>
              <div className="flex flex-wrap gap-2">
                {['default', 'luxury', 'minimal', 'vibrant'].map(theme => (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => onBrandingChange("theme_concept", theme)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      (branding?.theme_concept || 'default') === theme 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {theme === 'luxury' ? txt('Moda / Lüks', 'Fashion / Luxury', 'Μόδα / Πολυτέλεια') : theme.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="lg:col-span-1 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-500" />
              BANNER SLIDER (HERO)
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              {txt("Mağazanızın en üstündeki reklam alanına birden fazla görsel ekleyip sıralayabilir, üzerindeki metinlerin konumunu ve görünürlüğünü yönetebilirsiniz.", "You can add multiple images to the advertising area at the top of your store, order them, and manage the position and visibility of the texts on them.", "Μπορείτε να προσθέσετε πολλές εικόνες στον διαφημιστικό χώρο στο πάνω μέρος του καταστήματός σας, να τις παραγγείλετε και να διαχειριστείτε τη θέση και την ορατότητα των κειμένων σε αυτές.")}
            </p>
          </div>
          <div className="flex items-center justify-center p-4 bg-white rounded-xl border border-dashed border-slate-200">
            <span className="text-[10px] text-slate-400 font-medium">
              {"💡 " + txt("Mağaza ismi 'lookprice' içerirse sistem otomatik olarak seçkin yerel firma fallbacks uygular.", "If the store name contains 'lookprice', the system automatically applies premium local business fallbacks.", "Εάν το όνομα του καταστήματος περιέχει 'lookprice', το σύστημα εφαρμόζει αυτόματα εναλλακτικές επιλογές κορυφαίων τοπικών επιχειρήσεων.")}
            </span>
          </div>
        </div>

        {displayBanners.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-medium">
              {lang === "tr" ? "Henüz afiş eklemediniz." : "No banner slides added yet."}
            </p>
            <button
              type="button"
              onClick={handleAddBanner}
              className="mt-3 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-bold rounded-lg transition-colors"
            >
              {lang === "tr" ? "İlk Afişi Ekle" : "Add First Slide"}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {displayBanners.map((banner: any, idx: number) => (
                <div key={banner.id || idx} className="p-5 bg-slate-50/50 rounded-2xl border border-slate-200 relative group flex flex-col gap-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-xs font-black text-indigo-600 tracking-wider">
                      {lang === "tr" ? `SLAYT #${idx + 1}` : `SLIDE #${idx + 1}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBannerSafe(banner.id)}
                      className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {lang === "tr" ? "SİL" : "DELETE"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Image Selector & Preview */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        {lang === "tr" ? "Görsel Seçimi" : "Banner Image"}
                      </label>
                      <div className="relative group/img h-32 bg-white border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center shadow-sm">
                        {banner.image_url ? (
                          <img
                            src={banner.image_url}
                            alt={`Slide ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center">
                            <Upload className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                            <span className="text-[8px] font-black text-slate-400 uppercase">{txt('YÜKLE', 'UPLOAD', 'ΜΕΤΑΦΟΡΤΩΣΗ')}</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => handleBannerImageUpload(banner.id, e)}
                        />
                      </div>
                      <input
                        type="text"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-mono text-slate-600 shadow-sm outline-none"
                        placeholder={txt('Görsel URL veya base64...', 'Image URL or base64...', 'Διεύθυνση URL εικόνας ή base64...')}
                        value={banner.image_url || ""}
                        onChange={(e) => handleUpdateBannerFieldSafe(banner.id, "image_url", e.target.value)}
                      />
                    </div>

                    {/* Content Fields */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                          {lang === "tr" ? "AFİŞ BAŞLIĞI" : "SLIDE TITLE"}
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-indigo-400 shadow-sm"
                          value={banner.title || ""}
                          onChange={(e) => handleUpdateBannerFieldSafe(banner.id, "title", e.target.value)}
                          placeholder={lang === "tr" ? "Örn: %50 Sezon İndirimi!" : "e.g. Summer Sale!"}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                          {lang === "tr" ? "AFİŞ ALT BAŞLIĞI" : "SLIDE SUBTITLE"}
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 outline-none focus:border-indigo-400 shadow-sm"
                          value={banner.subtitle || ""}
                          onChange={(e) => handleUpdateBannerFieldSafe(banner.id, "subtitle", e.target.value)}
                          placeholder={lang === "tr" ? "Örn: Seçili ürünlerde dev fırsat." : "e.g. Shop now."}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                    {/* Positioning Controls */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        {lang === "tr" ? "Yazı Hizalaması" : "Text Alignment"}
                      </span>
                      <div className="flex gap-2">
                        {[
                          { key: 'left', label: lang === 'tr' ? 'Sol' : 'Left', icon: <AlignLeft className="w-3.5 h-3.5" /> },
                          { key: 'center', label: lang === 'tr' ? 'Orta' : 'Center', icon: <AlignCenter className="w-3.5 h-3.5" /> },
                          { key: 'right', label: lang === 'tr' ? 'Sağ' : 'Right', icon: <AlignRight className="w-3.5 h-3.5" /> },
                        ].map((pos) => (
                          <button
                            key={pos.key}
                            type="button"
                            onClick={() => handleUpdateBannerFieldSafe(banner.id, "text_position", pos.key)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-[10px] font-bold border transition-colors ${
                              (banner.text_position || "center") === pos.key
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {pos.icon}
                            {pos.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Store Name Visibility & Action Buttons */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        {lang === "tr" ? "Diğer Gösterimler" : "Visibility & Buttons"}
                      </span>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-600">
                            {lang === "tr" ? "Mağaza İsmini Göster" : "Show Store Name"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateBannerFieldSafe(banner.id, "show_store_name", banner.show_store_name === false ? true : false)}
                            className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                              banner.show_store_name !== false ? "bg-indigo-600" : "bg-slate-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${
                                banner.show_store_name !== false ? "translate-x-3.5" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Button customization */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                        {lang === "tr" ? "BUTON YAZISI" : "BUTTON TEXT"}
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none"
                        value={banner.button_text || ""}
                        onChange={(e) => handleUpdateBannerFieldSafe(banner.id, "button_text", e.target.value)}
                        placeholder={lang === "tr" ? "Boş bırakılırsa gizlenir" : "Leave blank to hide"}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                        {lang === "tr" ? "BUTON BAĞLANTISI (LINK)" : "BUTTON LINK"}
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-mono outline-none"
                        value={banner.button_link || ""}
                        onChange={(e) => handleUpdateBannerFieldSafe(banner.id, "button_link", e.target.value)}
                        placeholder={txt('Örn: #portfolio veya #contact', 'e.g., #portfolio or #contact', 'π.χ. #portfolio ή #contact')}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Label & About Section (For Non-Portfolios only) */}
      {!isPortfolio && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Label Customization */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                {lang === "tr" ? "ÖZEL ETİKETLER" : "CUSTOM LABELS"}
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onBrandingChange("brand_label", lang === "tr" ? "Yazarlar" : "Authors");
                    onBrandingChange("category_label", lang === "tr" ? "Kitap Türleri" : "Book Types");
                    onBrandingChange("product_label", lang === "tr" ? "Kitap" : "Book");
                    onBrandingChange("stock_label", lang === "tr" ? "Stoktaki Kitap Sayısı" : "Books in Stock");
                    onBrandingChange("hero_title", lang === "tr" ? "Okumayı Seviyoruz" : "We Love Reading");
                  }}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-tight hover:bg-indigo-100 transition-colors"
                >
                  {lang === "tr" ? "Kitapçı Konsepti Uygula" : "Apply Bookstore Concept"}
                </button>
                {isCafeRestaurant && (
                  <button
                    type="button"
                    onClick={() => {
                      onBrandingChange("brand_label", lang === "tr" ? "Şefler" : "Chefs");
                      onBrandingChange("category_label", lang === "tr" ? "Menü Kategorileri" : "Menu Categories");
                      onBrandingChange("product_label", lang === "tr" ? "Lezzet / Yemek" : "Dish / Delicacy");
                      onBrandingChange("stock_label", lang === "tr" ? "Masa Servis Durumu" : "Table Service Status");
                      onBrandingChange("hero_title", lang === "tr" ? "Gurme Lezzetler & Keyifli Anlar" : "Gourmet Flavors & Cozy Moments");
                      onBrandingChange("hero_subtitle", lang === "tr" ? "Usta şeflerimizin özenle hazırladığı taze lezzetler ve kaliteli ürünlerimizle günün her anına keyif katıyoruz." : "We elevate every moment of your day with fresh dishes masterfully crafted by our chefs and premium ingredients.");
                    }}
                    className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-tight hover:bg-amber-100 transition-colors"
                  >
                    {lang === "tr" ? "Kafe Konsepti Uygula" : "Apply Cafe Concept"}
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {lang === "tr" ? "MARKA ETİKETİ" : "BRAND LABEL"}
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold"
                    placeholder={lang === "tr" ? "Örn: Yazarlar" : "e.g. Authors"}
                    value={branding?.brand_label || ""}
                    onChange={(e) => onBrandingChange("brand_label", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {lang === "tr" ? "KATEGORİ ETİKETİ" : "CATEGORY LABEL"}
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold"
                    placeholder={lang === "tr" ? "Örn: Koleksiyon" : "e.g. Collections"}
                    value={branding?.category_label || ""}
                    onChange={(e) => onBrandingChange("category_label", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {lang === "tr" ? "ÜRÜN ADLANDIRMA" : "PRODUCT LABEL"}
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold"
                    placeholder={lang === "tr" ? "Örn: Kitap" : "e.g. Book"}
                    value={branding?.product_label || ""}
                    onChange={(e) => onBrandingChange("product_label", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {lang === "tr" ? "STOK ETİKETİ" : "STOCK LABEL"}
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold"
                    placeholder={lang === "tr" ? "Örn: Kalan Adet" : "e.g. Remaining"}
                    value={branding?.stock_label || ""}
                    onChange={(e) => onBrandingChange("stock_label", e.target.value)}
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">
                {"* " + txt('Bu ayarlar web sitenizdeki filtreleme ve ürün detaylarındaki başlıkları değiştirir.', 'These settings change the filtering and product detail headings on your website.', 'Αυτές οι ρυθμίσεις αλλάζουν το φιλτράρισμα και τις επικεφαλίδες λεπτομερειών προϊόντος στον ιστότοπό σας.')}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">
              {lang === "tr" ? "HAKKIMIZDA METNİ" : "ABOUT TEXT"}
            </h3>
            <textarea
              className="w-full h-[180px] p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all resize-none mb-4"
              value={branding?.about_text || ""}
              onChange={(e) => onBrandingChange("about_text", e.target.value)}
              placeholder={lang === "tr" ? "Mağazanız hakkında kısa bir bilgi yazın..." : "Write some info about your store..."}
            />
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                {lang === "tr" ? "SAYFA LİNKİ (Google Merchant İçin)" : "PAGE LINK (For Google Merchant)"}
              </p>
              <code className="text-[10px] text-blue-600 font-mono break-all font-bold">
                {window.location.origin}/store/{branding?.slug}/about-us
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Legal Policies Section */}
      {!isPortfolio && !isCafeRestaurant && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">
              {lang === "tr" ? "İADE POLİTİKASI" : "RETURN POLICY"}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium mb-4">
              {lang === "tr" ? "Google Merchant Center için zorunludur." : "Required for Google Merchant Center."}
            </p>
            <textarea
              className="w-full h-[180px] p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all resize-none mb-4"
              value={branding?.legal_pages?.return_policy || ""}
              onChange={(e) =>
                onBrandingChange("legal_pages", { ...branding?.legal_pages, return_policy: e.target.value })
              }
              placeholder={lang === "tr" ? "İade şartlarınızı yazın..." : "Write your return conditions..."}
            />
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                {lang === "tr" ? "SAYFA LİNKİ" : "PAGE LINK"}
              </p>
              <code className="text-[10px] text-blue-600 font-mono break-all font-bold">
                {window.location.origin}/store/{branding?.slug}/return-policy
              </code>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">
              {lang === "tr" ? "KARGO POLİTİKASI" : "SHIPPING POLICY"}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium mb-4">
              {lang === "tr" ? "Google Merchant Center için zorunludur." : "Required for Google Merchant Center."}
            </p>
            <textarea
              className="w-full h-[180px] p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all resize-none mb-4"
              value={branding?.legal_pages?.shipping_policy || ""}
              onChange={(e) =>
                onBrandingChange("legal_pages", { ...branding?.legal_pages, shipping_policy: e.target.value })
              }
              placeholder={lang === "tr" ? "Kargo ve teslimat şartlarınızı yazın..." : "Write your shipping and delivery conditions..."}
            />
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                {lang === "tr" ? "SAYFA LİNKİ" : "PAGE LINK"}
              </p>
              <code className="text-[10px] text-blue-600 font-mono break-all font-bold">
                {window.location.origin}/store/{branding?.slug}/shipping-policy
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Contact & Social Compact */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-100/50">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Contact */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">
              {lang === "tr" ? "İLETİŞİM BİLGİLERİ" : "CONTACT INFO"}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  {lang === "tr" ? "E-POSTALARI YÖNET" : "MANAGE EMAILS"}
                </p>
                {emails.map((email, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs"
                      value={email}
                      onChange={(e) => updateEmail(idx, e.target.value)}
                    />
                    {emails.length > 1 && (
                      <button onClick={() => removeEmail(idx)} className="text-rose-500">
                        <X />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={addEmail} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                  + {lang === "tr" ? "EKLE" : "ADD"}
                </button>
              </div>
              <div className="space-y-3">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  {lang === "tr" ? "TELEFONLARI YÖNET" : "MANAGE PHONES"}
                </p>
                {phones.map((phone, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs"
                      value={phone}
                      onChange={(e) => updatePhone(idx, e.target.value)}
                    />
                    {phones.length > 1 && (
                      <button onClick={() => removePhone(idx)} className="text-rose-500">
                        <X />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={addPhone} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                  + {lang === "tr" ? "EKLE" : "ADD"}
                </button>
              </div>
            </div>
          </div>

          {/* Social */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-pink-500 uppercase tracking-[0.2em]">
              {lang === "tr" ? "SOSYAL MEDYA" : "SOCIAL MEDIA"}
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <Instagram className="w-4 h-4" />, key: "instagram_url", placeholder: "@username" },
                { icon: <Facebook className="w-4 h-4" />, key: "facebook_url", placeholder: "facebook.com/..." },
                { icon: <Twitter className="w-4 h-4" />, key: "twitter_url", placeholder: "@twitter" },
                { icon: <MessageCircle className="w-4 h-4" />, key: "whatsapp_number", placeholder: "+90..." },
              ].map((social) => (
                <div key={social.key} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="text-slate-400">{social.icon}</div>
                  <input
                    className="w-full bg-transparent text-xs font-bold outline-none placeholder:text-slate-300"
                    placeholder={social.placeholder}
                    value={branding?.[social.key as keyof typeof branding] || ""}
                    onChange={(e) => onBrandingChange(social.key as any, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tracking & Analytics */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Tag className="w-4 h-4 text-emerald-500" />
          {lang === "tr" ? "İZLEME VE ANALİTİK" : "TRACKING & ANALYTICS"}
        </h3>
        <p className="text-xs text-slate-500 mb-6 font-medium">
          {lang === "tr"
            ? txt('Google Analytics veya Google Tag Manager (GTM) aracılığıyla mağazanızı dijital olarak analiz edin.', 'Digitally analyze your store via Google Analytics or Google Tag Manager (GTM).', 'Αναλύστε ψηφιακά το κατάστημά σας μέσω του Google Analytics ή του Google Tag Manager (GTM).')
            : "Analyze your store digitally through Google Analytics or Google Tag Manager (GTM)."}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Google Analytics (gtag) ID
            </label>
            <input
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold font-mono placeholder:text-slate-300"
              placeholder="G-XXXXXXXXXX"
              value={
                branding?.meta_settings &&
                typeof branding.meta_settings === "object" &&
                !Array.isArray(branding.meta_settings)
                  ? branding.meta_settings.ga_measurement_id || ""
                  : ""
              }
              onChange={(e) => {
                const newSettings = { ...(branding?.meta_settings || {}) };
                newSettings.ga_measurement_id = e.target.value;
                onBrandingChange("meta_settings", newSettings);
              }}
            />
            <p className="text-[10px] text-slate-400 mt-1 ml-1 leading-relaxed">{txt("Örn: G-XXXXXXXXXX. Sadece ID'yi girin.", "e.g., G-XXXXXXXXXX. Just enter the ID.", "π.χ. G-XXXXXXXXXX. Απλώς εισάγετε το ID.")}</p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Google Tag Manager (GTM) ID
            </label>
            <input
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold font-mono placeholder:text-slate-300"
              placeholder="GTM-XXXXXXX"
              value={
                branding?.meta_settings &&
                typeof branding.meta_settings === "object" &&
                !Array.isArray(branding.meta_settings)
                  ? branding.meta_settings.gtm_id || ""
                  : ""
              }
              onChange={(e) => {
                const newSettings = { ...(branding?.meta_settings || {}) };
                newSettings.gtm_id = e.target.value;
                onBrandingChange("meta_settings", newSettings);
              }}
            />
            <p className="text-[10px] text-slate-400 mt-1 ml-1 leading-relaxed">{txt("Örn: GTM-XXXXXXX. Sadece ID'yi girin.", "e.g., GTM-XXXXXXX. Just enter the ID.", "π.χ. GTM-XXXXXXX. Απλώς εισάγετε το ID.")}</p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Google Search Console (GSC) Doğrulama Kodu
            </label>
            <input
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold font-mono placeholder:text-slate-300"
              placeholder={txt('google-site-verification meta etiketinin content değeri', 'Content value of the google-site-verification meta tag', 'Τιμή περιεχομένου της μετα-ετικέτας google-site-verification')}
              value={
                branding?.meta_settings &&
                typeof branding.meta_settings === "object" &&
                !Array.isArray(branding.meta_settings)
                  ? branding.meta_settings.gsc_id || ""
                  : ""
              }
              onChange={(e) => {
                const newSettings = { ...(branding?.meta_settings || {}) };
                newSettings.gsc_id = e.target.value;
                onBrandingChange("meta_settings", newSettings);
              }}
            />
            <p className="text-[10px] text-slate-400 mt-1 ml-1 leading-relaxed">{txt('Google Search Console\'daki meta etiketinin ("google-site-verification") içindeki kod/content değeridir.', 'It is the code/content value in the meta tag ("google-site-verification") in Google Search Console.', 'Είναι η τιμή κωδικού/περιεχομένου στη μετα-ετικέτα ("google-site-verification") στο Google Search Console.')}</p>
          </div>
        </div>
      </div>

      {/* User Management Section (Keep it simple here) */}
      <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] -mr-48 -mt-48 group-hover:bg-white/10 transition-all duration-1000"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-white tracking-widest uppercase mb-1">
                {lang === "tr" ? "EKİP YÖNETİMİ" : "TEAM MANAGEMENT"}
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">
                {lang === "tr" ? "MAĞAZA ERİŞİM YETKİLERİ" : "STORE ACCESS CONTROL"}
              </p>
            </div>
            {(currentUser?.role === "admin" ||
              currentUser?.role === "storeadmin" ||
              currentUser?.role === "superadmin") && (
              <button
                onClick={onAddUser}
                className="px-6 py-3 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all shadow-xl shadow-black/20"
              >
                + {lang === "tr" ? "YENİ ÜYE" : "NEW MEMBER"}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((u) => (
              <div
                key={u.id}
                className="p-5 bg-slate-800/50 rounded-3xl border border-slate-700/50 flex items-center justify-between group/user hover:bg-slate-800 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-700 rounded-2xl flex items-center justify-center text-white font-black">
                    {u.email?.[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-none mb-1">{u.email.split("@")[0]}</p>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{u.role}</p>
                  </div>
                </div>
                {((currentUser?.role === "admin" ||
                  currentUser?.role === "storeadmin" ||
                  currentUser?.role === "superadmin") &&
                  u.id !== currentUser?.id) && (
                  <button onClick={() => onDeleteUser(u.id)} className="p-2 text-slate-500 hover:text-rose-500 transition-colors">
                    <Lock className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
