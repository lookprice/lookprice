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

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-[60] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between gap-8">
        <div
          className="flex items-center gap-4 cursor-pointer group"
          onClick={() => navigate(getStorePath("/"))}
        >
          {store?.logo_url ? (
            <img
              src={store.logo_url}
              alt={store.name}
              className="h-10 w-auto object-contain group-hover:scale-110 transition-transform"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className="h-10 w-10 md:h-12 md:w-12 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform"
              style={{
                backgroundColor: primaryColor,
                boxShadow: `0 10px 25px -5px ${primaryColor}40`,
              }}
            >
              <StoreIcon className="w-6 h-6" />
            </div>
          )}
          <h1 className="text-xl font-bold text-gray-900 tracking-tighter hidden sm:block">
            {store?.name}
          </h1>
        </div>

        {/* Menu Links */}
        <div className="hidden md:flex items-center gap-6">
          {(store?.menu_links || []).map((link: any, index: number) => (
            <a
              key={index}
              href={link.url}
              className="text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
              style={{ color: link.active ? primaryColor : undefined }}
            >
              {link.label}
            </a>
          ))}
          {store?.blog_posts && store.blog_posts.length > 0 && (
            <button
              onClick={() => setShowBlog(true)}
              className="text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
            >
              {lang === "tr" ? "Blog" : "Blog"}
            </button>
          )}
        </div>

        <div className="flex-1 max-w-xl relative hidden md:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder={t.dashboard.searchProducts}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-100 focus:bg-white focus:ring-4 focus:ring-opacity-10 rounded-lg transition-all outline-none text-sm font-medium"
            style={{ ringColor: primaryColor } as any}
          />
        </div>

        <div className="flex items-center gap-3">
          {customer ? (
            <div className="relative" ref={accountMenuRef}>
              <button
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                className="px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-all flex items-center gap-2"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shadow-md"
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
                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        navigate(getStorePath("/profile"));
                        setIsAccountMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 text-sm font-bold flex items-center gap-2 group transition-colors"
                    >
                      <User className="w-4 h-4 text-gray-400 group-hover:text-gray-900" />{" "}
                      {lang === "tr" ? "Profilim" : "My Profile"}
                    </button>
                    <button
                      onClick={() => {
                        navigate(getStorePath("/orders"));
                        setIsAccountMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 text-sm font-bold flex items-center gap-2 group transition-colors"
                    >
                      <Package className="w-4 h-4 text-gray-400 group-hover:text-gray-900" />{" "}
                      {lang === "tr" ? "Siparişlerim" : "My Orders"}
                    </button>
                    <div className="my-1 border-t border-gray-50" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 text-sm font-bold flex items-center gap-2 group transition-colors"
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
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-all group"
            >
              <User className="w-5 h-5 text-gray-700 group-hover:text-gray-900 transition-colors" />
              <span className="text-sm font-bold text-gray-700 hidden sm:block">
                {lang === "tr" ? "Giriş Yap" : "Login"}
              </span>
            </button>
          )}
          {store?.store_type !== "real_estate" && store?.store_type !== "motor_vehicle" && (
            <button
              onClick={() => setIsBasketOpen(true)}
              className="relative p-2.5 hover:bg-gray-100 rounded-lg transition-all active:scale-95 group"
            >
              <ShoppingBag className="w-6 h-6 text-gray-700 group-hover:text-gray-900 transition-colors" />
              {basketCount > 0 && (
                <span
                  className="absolute top-1 right-1 text-white text-[9px] font-semibold w-4 h-4 flex items-center justify-center rounded-lg shadow-lg"
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
  );
};
