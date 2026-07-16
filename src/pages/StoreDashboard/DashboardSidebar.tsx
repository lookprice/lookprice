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
  ExternalLink
} from "lucide-react";
import { api } from "../../services/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import Logo from "../../components/Logo";

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
  sidebarOpen,
  setSidebarOpen,
  desktopSidebarCollapsed,
  setDesktopSidebarCollapsed,
  translations: t,
  startTransition
}: SidebarProps) => {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    dashboard: true,
    sales: true,
    operations: true,
    real_estate: true,
    integrations: false,
    settings: false
  });

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
        fixed ${!desktopSidebarCollapsed ? 'lg:static' : ''} inset-y-0 left-0 w-72 bg-slate-950 text-slate-400 z-50 transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        ${!desktopSidebarCollapsed && !sidebarOpen ? 'lg:translate-x-0' : ''}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-8 border-b border-indigo-500/10 flex items-center justify-between">
            <div className="flex items-center space-x-4 min-w-0">
              <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-500/20 scale-110 shrink-0">
                <Logo size={28} className="text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-black text-white tracking-tighter leading-none truncate max-w-[120px]">
                  {branding.name || branding.store_name || "LookPrice"}
                </h1>
                <div className="flex items-center space-x-1.5 mt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Retail_OS v4.2</p>
                </div>
              </div>
            </div>
            
            {/* Desktop Collapse Button */}
            <button
              onClick={() => setDesktopSidebarCollapsed(true)}
              className="hidden lg:flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              title={t?.collapseSidebar || "Menüyü Gizle"}
            >
              <PanelLeftClose className="h-5 w-5" />
            </button>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-5 space-y-1.5 custom-scrollbar">
            {navItems.map((navItem) => {
              if (navItem.type === 'category') {
                return (
                  <div key={navItem.key} className="mb-2">
                    <button
                       onClick={() => setOpenCategories({...openCategories, [navItem.key]: !openCategories[navItem.key]})}
                       className="flex items-center justify-between w-full text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-4 py-2 hover:text-indigo-400 transition-colors"
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
                          className="overflow-hidden"
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
                              className={`w-full group flex items-center justify-between px-4 py-3.5 rounded-2xl text-[13px] font-bold transition-all duration-300 ${
                                activeTab === item.id 
                                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center space-x-3.5">
                                <item.icon className={`h-4.5 w-4.5 transition-colors ${activeTab === item.id ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`} />
                                <span className="tracking-tight">{item.label}</span>
                              </div>
                              {item.badge > 0 && (
                                <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black ${
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
                    className={`w-full group flex items-center justify-between px-4 py-3.5 rounded-2xl text-[13px] font-bold transition-all duration-300 ${
                      activeTab === navItem.id 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <navItem.icon className={`h-4.5 w-4.5 transition-colors ${activeTab === navItem.id ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`} />
                      <span className="tracking-tight">{navItem.label}</span>
                    </div>
                    {navItem.badge > 0 && (
                      <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black ${
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


            <div className="pt-6 mt-6 border-t border-white/5">
              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-4 py-3 mb-1">External_Access</div>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl text-[13px] font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-all duration-300"
              >
                <Globe className="h-4.5 w-4.5 text-slate-500" />
                <span className="tracking-tight">{t.storeWebsite}</span>
              </a>
              {!isPortfolio && !isCafeRestaurant && (
                <a
                  href={scanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl text-[13px] font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-all duration-300"
                >
                  <Scan className="h-4.5 w-4.5 text-slate-500" />
                  <span className="tracking-tight">{t.barcodeScanner}</span>
                </a>
              )}
              {isCafeRestaurant && currentStoreId && (
                <a
                  href={`${window.location.origin}/digital-menu/${currentStoreId}/garson`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl text-[13px] font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-all duration-300"
                >
                  <UtensilsCrossed className="h-4.5 w-4.5 text-slate-500" />
                  <span className="tracking-tight">{t.barcodeScanner === 'Barcode Scanner' ? 'Menu / Order Screen' : 'Menü / Sipariş Ekranı'}</span>
                </a>
              )}
            </div>
          </nav>
          
          <div className="p-4 md:p-6 border-t border-white/5 bg-slate-900/30">
            {!isCafeRestaurant && (
              <button
                onClick={() => setShowQrModal(true)}
                className="flex w-full items-center justify-center space-x-2 py-3 mb-3 md:mb-4 rounded-2xl text-[10px] md:text-xs font-black text-indigo-400 hover:bg-indigo-600/10 transition-all border border-indigo-500/20 group uppercase tracking-[0.1em]"
              >
                <QrCode className="h-4 w-4 md:h-3 md:w-3" />
                <span>{t.storeQR || "QR Kodu"}</span>
              </button>
            )}
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-2xl text-[10px] md:text-xs font-black text-rose-500 hover:bg-rose-500/10 transition-all border border-rose-500/20 group uppercase tracking-[0.1em]"
            >
              <LogOut className="h-4 w-4 md:h-3 md:w-3" />
              <span>{t.logout}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
