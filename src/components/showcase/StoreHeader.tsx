import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Store as StoreIcon, 
  Search, 
  ChevronDown, 
  User, 
  Package, 
  LogOut, 
  ShoppingBag 
} from 'lucide-react';

interface StoreHeaderProps {
  store: any;
  lang: string;
  primaryColor: string;
  getStorePath: (path: string) => string;
  t: any;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  customer: any;
  isAccountMenuOpen: boolean;
  setIsAccountMenuOpen: (open: boolean) => void;
  accountMenuRef: React.RefObject<HTMLDivElement>;
  handleLogout: () => void;
  setAuthMode: (mode: 'login' | 'register') => void;
  setShowAuthModal: (show: boolean) => void;
  setIsBasketOpen: (open: boolean) => void;
  basketCount: number;
  setShowBlog: (show: boolean) => void;
}

const getDisplayStoreName = (store: any) => {
  const rawName = store?.branding?.store_name || store?.branding?.name || store?.name || "";
  if (!rawName || rawName.toLowerCase().includes("lookprice")) {
    const type = store?.store_type || store?.branding?.store_type;
    if (type === 'real_estate') {
      return "Premium VIP Emlak";
    } else if (type === 'motor_vehicle' || type === 'automotive') {
      return "Seçkin Otomotiv";
    }
    return "Seçkin Mağaza";
  }
  return rawName;
};

export const StoreHeader: React.FC<StoreHeaderProps> = ({
  store,
  lang,
  primaryColor,
  getStorePath,
  t,
  searchQuery,
  setSearchQuery,
  customer,
  isAccountMenuOpen,
  setIsAccountMenuOpen,
  accountMenuRef,
  handleLogout,
  setAuthMode,
  setShowAuthModal,
  setIsBasketOpen,
  basketCount,
  setShowBlog
}) => {
  const navigate = useNavigate();
  const displayName = getDisplayStoreName(store);

  const announcementText = store?.page_layout_settings?.announcement_text || store?.announcement_text || store?.branding?.announcement_text;
  const showAnnouncement = store?.page_layout_settings?.show_announcement !== false && store?.page_layout_settings?.announcement_bar !== false && store?.show_announcement !== false && store?.announcement_bar !== false && !!announcementText;

  return (
    <div className="sticky top-4 z-[60] px-4 md:px-8 pointer-events-none flex flex-col items-center gap-2 mb-6">
      {showAnnouncement && (
        <div className="w-full max-w-7xl bg-slate-900/90 backdrop-blur-md text-white text-xs font-semibold py-2 px-6 rounded-2xl border border-white/10 shadow-lg pointer-events-auto flex items-center justify-center gap-2.5 text-center">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="tracking-wide leading-relaxed">{announcementText}</span>
        </div>
      )}
      <header className="w-full max-w-7xl bg-white/70 backdrop-blur-2xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-3xl pointer-events-auto transition-all duration-500 ease-out hover:bg-white/90">
        <div className="h-16 md:h-20 px-6 flex items-center justify-between gap-4 md:gap-8">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate(getStorePath("/"))}
          >
            {store?.logo_url ? (
              <img 
                src={store.logo_url}
                alt={displayName}
                className="h-8 md:h-10 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className="h-9 w-9 md:h-11 md:w-11 rounded-xl flex items-center justify-center text-white"
                style={{
                  backgroundColor: primaryColor,
                }}
              >
                <StoreIcon className="w-5 h-5 md:w-6 md:h-6" />
              </div>
            )}
            <h1 className="text-lg font-semibold text-slate-950 tracking-tight hidden sm:block">
              {displayName}
            </h1>
          </div>

          {/* Menu Links */}
          <div className="hidden lg:flex items-center gap-6">
            {(store?.menu_links || []).map((link: any, index: number) => (
              <a
                key={index}
                href={link.url}
                className="text-sm font-medium text-slate-600 hover:text-slate-950 transition-colors"
                style={{ color: link.active ? primaryColor : undefined }}
              >
                {link.label}
              </a>
            ))}
            {store?.blog_posts && store.blog_posts.length > 0 && (
              <button
                onClick={() => setShowBlog(true)}
                className="text-sm font-medium text-slate-600 hover:text-slate-950 transition-colors"
              >
                {lang === "tr" ? "Blog" : "Blog"}
              </button>
            )}
          </div>

          <div className="flex-1 max-w-sm relative hidden md:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t.dashboard.searchProducts}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-slate-300 rounded-full transition-all outline-none text-sm font-medium"
            />
          </div>

          <div className="flex items-center gap-3">
            {customer ? (
              <div className="relative" ref={accountMenuRef}>
                <button
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  className="px-3 py-1.5 hover:bg-gray-100 rounded-full transition-all flex items-center gap-2"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-md"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {customer.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-bold text-gray-700 hidden sm:block">
                    {lang === "tr" ? "Hesabım" : "My Account"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                <AnimatePresence>
                  {isAccountMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full mt-4 w-48 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 p-2 z-50 overflow-hidden"
                    >
                      <button
                        onClick={() => {
                          navigate(getStorePath("/profile"));
                          setIsAccountMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 text-sm font-bold flex items-center gap-2 group transition-colors"
                      >
                        <User className="w-4 h-4 text-gray-400 group-hover:text-gray-900" />{" "}
                        {lang === "tr" ? "Profilim" : "My Profile"}
                      </button>
                      <button
                        onClick={() => {
                          navigate(getStorePath("/orders"));
                          setIsAccountMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 text-sm font-bold flex items-center gap-2 group transition-colors"
                      >
                        <Package className="w-4 h-4 text-gray-400 group-hover:text-gray-900" />{" "}
                        {lang === "tr" 
                          ? (store?.store_type === 'real_estate' || store?.store_type === 'motor_vehicle' ? "Taleplerim" : "Siparişlerim") 
                          : (store?.store_type === 'real_estate' || store?.store_type === 'motor_vehicle' ? "My Requests" : "My Orders")}
                      </button>
                      <div className="my-1 border-t border-gray-100" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 text-sm font-bold flex items-center gap-2 group transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-600" />{" "}
                        {lang === "tr" ? "Çıkış Yap" : "Logout"}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthMode("login");
                  setShowAuthModal(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white hover:bg-gray-800 rounded-full transition-all group shadow-md"
              >
                <User className="w-4 h-4" />
                <span className="text-sm font-bold hidden sm:block">
                  {lang === "tr" ? "Giriş Yap" : "Login"}
                </span>
              </button>
            )}

            {store?.store_type !== "real_estate" && store?.store_type !== "motor_vehicle" && (
              <button
                onClick={() => setIsBasketOpen(true)}
                className="relative p-3 bg-gray-50 hover:bg-gray-100 rounded-full transition-all active:scale-95 group shadow-sm border border-gray-200/50"
              >
                <ShoppingBag className="w-5 h-5 text-gray-700 group-hover:text-gray-900 transition-colors" />
                {basketCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-lg ring-2 ring-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {basketCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};
