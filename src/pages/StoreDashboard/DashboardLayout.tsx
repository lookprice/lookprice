import React, { useState, useEffect } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import ErrorBoundary from "../../components/ErrorBoundary";
import StoreLogo from "../../components/StoreLogo";
import { Bell, Loader2, Menu, WifiOff } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebarProps: any;
  loading: boolean;
  lang: string;
}

export const DashboardLayout = ({ children, sidebarProps, loading, lang }: DashboardLayoutProps) => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [hasRenderedChildren, setHasRenderedChildren] = useState(Boolean(children));

  useEffect(() => {
    if (children) {
      setHasRenderedChildren(true);
    }
  }, [children]);

  const branding = sidebarProps?.branding || {};
  const headerLogoUrl = branding.logo_url || branding.logo;
  const headerStoreName = (branding.store_name && !/^lookprice$/i.test(branding.store_name.trim()))
    ? branding.store_name.trim()
    : (branding.name && !/^lookprice$/i.test(branding.name.trim()))
    ? branding.name.trim()
    : "Seçkin Mağaza";

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="flex h-screen h-[100dvh] min-h-screen bg-slate-50 overflow-hidden font-sans relative operator-compact-layout">
      {/* Top Non-blocking Loading Bar */}
      {loading && (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5 bg-slate-200 overflow-hidden">
          <div className="h-full bg-slate-900 w-full animate-pulse" />
        </div>
      )}

      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] flex items-center gap-2.5 px-4 py-2 bg-slate-900 text-white rounded-lg shadow-xl font-medium text-xs border border-slate-800">
          <WifiOff className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span>
            {lang === "tr" 
              ? "Şu an çevrimdışısınız, verileriniz yerel depoda tutuluyor." 
              : "You are currently offline, data is saved locally."}
          </span>
        </div>
      )}

      {/* Background Pattern */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none overflow-hidden select-none flex flex-wrap gap-8 p-8">
        {Array.from({ length: 150 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center rotate-12">
            <div className="w-16 h-1 bg-slate-900 mb-0.5" />
            <div className="w-16 h-2 bg-slate-900 mb-0.5" />
            <div className="w-16 h-0.5 bg-slate-900 mb-0.5" />
            <div className="w-16 h-3 bg-slate-900 mb-0.5" />
          </div>
        ))}
      </div>

      <DashboardSidebar {...sidebarProps} />

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Mobile Header with Hamburger Menu & Notification Bell */}
        <div className="lg:hidden flex items-center justify-between px-3.5 py-2.5 bg-white border-b border-slate-200 z-10 shrink-0">
          <div className="flex items-center min-w-0">
            <button onClick={() => sidebarProps.setSidebarOpen(true)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">
              <Menu className="w-5 h-5" />
            </button>
            <div className="ml-2 flex items-center gap-2 min-w-0">
              <StoreLogo logoUrl={headerLogoUrl} storeName={headerStoreName} size="xs" />
              <div className="font-semibold text-slate-900 truncate tracking-tight uppercase text-xs sm:text-sm">
                {headerStoreName}
              </div>
            </div>
          </div>

          {sidebarProps?.setActiveTab && (
            <button
              type="button"
              onClick={() => sidebarProps.setActiveTab("notifications")}
              className={`relative p-2 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                sidebarProps.activeTab === "notifications"
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
              }`}
              title={lang === "tr" ? "Bildirim Merkezi" : "Notifications"}
            >
              <Bell className="w-4 h-4" />
              {Number(sidebarProps?.totalUrgentNotifications || 0) > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-mono font-medium flex items-center justify-center bg-slate-900 text-white border border-slate-700 shadow-xs">
                  {sidebarProps.totalUrgentNotifications}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Desktop Collapsed Header */}
        {sidebarProps.desktopSidebarCollapsed && (
          <div className="hidden lg:flex items-center p-4 bg-white border-b border-slate-200/60 z-10 shadow-sm transition-all shrink-0">
            <button 
              onClick={() => sidebarProps.setDesktopSidebarCollapsed(false)} 
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100 rounded-xl font-bold text-xs uppercase transition-all tracking-wider shrink-0 cursor-pointer"
              title={lang === 'tr' ? 'Menüyü Aç' : 'Open Sidebar'}
            >
              <Menu className="w-4 h-4" />
              <span>{lang === 'tr' ? 'Menüyü Aç' : 'Open Menu'}</span>
            </button>
            <div className="ml-4 flex items-center gap-2.5 min-w-0">
              <StoreLogo logoUrl={headerLogoUrl} storeName={headerStoreName} size="xs" />
              <div className="font-black text-slate-900 truncate tracking-tight uppercase text-xs">
                {headerStoreName}
              </div>
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto overscroll-contain p-3.5 md:p-5 pb-32 sm:pb-24 bg-slate-50/50">
          <div className="max-w-7xl mx-auto space-y-5 pb-12">
            <ErrorBoundary lang={lang}>
              {!hasRenderedChildren && loading ? (
                <div className="flex flex-col items-center justify-center h-64">
                   <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-3" />
                   <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{lang === 'tr' ? 'Sistem Yükleniyor...' : 'Loading System...'}</p>
                </div>
              ) : (
                children
              )}
            </ErrorBoundary>
          </div>
        </div>
      </main>
    </div>
  );
};
