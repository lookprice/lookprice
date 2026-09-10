import React, { useState, useEffect } from "react";
import { 
  Activity,
  LogOut, 
  Globe, 
  Scan, 
  QrCode,
  ChevronUp,
  ChevronDown,
  LayoutDashboard,
  UtensilsCrossed,
  PanelLeftClose,
  Menu,
  Cloud,
  CloudOff,
  RefreshCw,
  ExternalLink,
  Calendar,
  UserCheck
} from "lucide-react";
import { api } from "../../services/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import Logo from "../../components/Logo";
import StoreLogo from "../../components/StoreLogo";
import { useLanguage } from "../../contexts/LanguageContext";

interface SidebarProps {
  navItems: any[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  branding: any;
  publicUrl: string;
  scanUrl: string;
  isPortfolio: boolean;
  isRealEstate: boolean;
  isAutomotive: boolean;
  isCafeRestaurant?: boolean;
  currentStoreId?: number;
  onLogout: () => void;
  setShowQrModal: (show: boolean) => void;
  activeStaffRole?: string;
  onOpenRoleModal?: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  desktopSidebarCollapsed: boolean;
  setDesktopSidebarCollapsed: (collapsed: boolean) => void;
  translations: any;
  startTransition: any;
}

export const DashboardSidebar = ({
  navItems,
  activeTab,
  setActiveTab,
  branding,
  publicUrl,
  scanUrl,
  isPortfolio,
  isRealEstate,
  isAutomotive,
  isCafeRestaurant,
  currentStoreId,
  onLogout,
  setShowQrModal,
  activeStaffRole,
  onOpenRoleModal,
  sidebarOpen,
  setSidebarOpen,
  desktopSidebarCollapsed,
  setDesktopSidebarCollapsed,
  translations: t,
  startTransition
}: SidebarProps) => {
  const { lang } = useLanguage();
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    dashboard: true,
    sales: true,
    operations: true,
    real_estate: true,
    integrations: false,
    settings: false
  });

  const storeLogoUrl = branding?.logo_url || branding?.logo;
  const displayName = (branding?.store_name && !/^lookprice$/i.test(branding.store_name.trim()))
    ? branding.store_name.trim()
    : (branding?.name && !/^lookprice$/i.test(branding.name.trim()))
    ? branding.name.trim()
    : "Seçkin Mağaza";

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed ${!desktopSidebarCollapsed ? 'lg:static' : ''} inset-y-0 left-0 w-64 bg-slate-950 text-slate-400 z-50 transition-transform duration-300 ease-in-out shrink-0 border-r border-slate-800/80 select-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        ${!desktopSidebarCollapsed && !sidebarOpen ? 'lg:translate-x-0' : ''}
      `}>
        <div className="flex flex-col h-full">
          {/* Header Block */}
          <div className="px-4 py-3.5 border-b border-white/5 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2.5 min-w-0">
              <StoreLogo logoUrl={storeLogoUrl} storeName={displayName} size="xs" />
              <div className="min-w-0">
                <h1 className="text-sm font-black text-white tracking-tight leading-none truncate" title={displayName}>
                  {displayName}
                </h1>
                <div className="flex items-center space-x-1.5 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{lang === 'tr' ? 'Bulut Panel' : 'Cloud POS'}</p>
                </div>
              </div>
            </div>
            
            {/* Desktop Collapse Button */}
            <button
              onClick={() => setDesktopSidebarCollapsed(true)}
              className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
              title={t?.collapseSidebar || "Menüyü Gizle"}
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>
          
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar">
            {navItems.map((navItem) => {
              if (navItem.type === 'category') {
                return (
                  <div key={navItem.key} className="mb-1.5">
                    <button
                       onClick={() => setOpenCategories({...openCategories, [navItem.key]: !openCategories[navItem.key]})}
                       className="flex items-center justify-between w-full text-[9px] font-black text-slate-500 uppercase tracking-wider px-2 py-1.5 hover:text-indigo-400 transition-colors cursor-pointer"
                    >
                      <span>{navItem.title}</span>
                      {openCategories[navItem.key] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                    <AnimatePresence>
                      {openCategories[navItem.key] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden space-y-0.5"
                        >
                          {navItem.items.map((item: any) => (
                            <button
                              key={item.id}
                              onClick={() => {
                                startTransition(() => {
                                  setActiveTab(item.id);
                                });
                                setSidebarOpen(false);
                              }}
                              className={`w-full group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                                activeTab === item.id 
                                  ? 'bg-indigo-600 text-white shadow-xs' 
                                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center space-x-2.5 min-w-0">
                                <item.icon className={`h-4 w-4 shrink-0 transition-colors ${activeTab === item.id ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`} />
                                <span className="truncate tracking-tight">{item.label}</span>
                              </div>
                              {item.badge > 0 && (
                                <span className={`flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-[9px] font-black shrink-0 ${
                                  item.badgeType === 'error' 
                                    ? (activeTab === item.id ? 'bg-white text-rose-600' : 'bg-rose-600 text-white animate-pulse')
                                    : (activeTab === item.id ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white animate-pulse')
                                }`}>
                                  {item.badge}
                                </span>
                              )}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              } else {
                return (
                  <button
                    key={navItem.id}
                    onClick={() => {
                      startTransition(() => {
                        setActiveTab(navItem.id);
                      });
                      setSidebarOpen(false);
                    }}
                    className={`w-full group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                      activeTab === navItem.id 
                        ? 'bg-indigo-600 text-white shadow-xs' 
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <navItem.icon className={`h-4 w-4 shrink-0 transition-colors ${activeTab === navItem.id ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`} />
                      <span className="truncate tracking-tight">{navItem.label}</span>
                    </div>
                    {navItem.badge > 0 && (
                      <span className={`flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-[9px] font-black shrink-0 ${
                        navItem.badgeType === 'error' 
                          ? (activeTab === navItem.id ? 'bg-white text-rose-600' : 'bg-rose-600 text-white animate-pulse')
                          : (activeTab === navItem.id ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white animate-pulse')
                      }`}>
                        {navItem.badge}
                      </span>
                    )}
                  </button>
                );
              }
            })}

            <div className="pt-3 mt-3 border-t border-white/5 space-y-0.5">
              <div className="text-[9px] font-black text-slate-600 uppercase tracking-wider px-2 py-1">
                {lang === 'tr' ? 'HARİCİ BAĞLANTILAR' : 'EXTERNAL ACCESS'}
              </div>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
              >
                <Globe className="h-4 w-4 text-slate-500" />
                <span className="truncate tracking-tight">{t.storeWebsite}</span>
              </a>
              {!isPortfolio && !isCafeRestaurant && (
                <a
                  href={scanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                >
                  <Scan className="h-4 w-4 text-slate-500" />
                  <span className="truncate tracking-tight">{t.barcodeScanner}</span>
                </a>
              )}
              {isCafeRestaurant && currentStoreId && (
                <a
                  href={`${window.location.origin}/digital-menu/${currentStoreId}/garson`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                >
                  <UtensilsCrossed className="h-4 w-4 text-slate-500" />
                  <span className="truncate tracking-tight">{t.barcodeScanner === 'Barcode Scanner' ? 'Menu / Order Screen' : 'Menü / Sipariş Ekranı'}</span>
                </a>
              )}
            </div>
          </nav>
          
          <div className="p-2.5 border-t border-white/5 bg-slate-900/40 space-y-1.5 shrink-0">
            {isCafeRestaurant && onOpenRoleModal && (
              <button
                onClick={onOpenRoleModal}
                className="flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-400 hover:bg-amber-500/10 transition-all border border-amber-500/20 group cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <UserCheck className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-[11px]">
                    {activeStaffRole === 'manager' 
                      ? '👑 Yönetici' 
                      : activeStaffRole === 'cashier' 
                        ? '💳 Kasiyer' 
                        : '🍽️ Garson'}
                  </span>
                </div>
                <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded uppercase font-mono">
                  Değiştir
                </span>
              </button>
            )}

            <button
              onClick={onLogout}
              className="flex w-full items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-all border border-rose-500/20 group cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 text-rose-500" />
              <span>{t.logout}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
