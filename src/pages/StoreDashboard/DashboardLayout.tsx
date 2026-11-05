import React, { useState, useEffect } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import ErrorBoundary from "../../components/ErrorBoundary";
import StoreLogo from "../../components/StoreLogo";
import { OutlookTasksNotesHub } from "../../components/OutlookTasksNotesHub";
import { Bell, Loader2, Menu, WifiOff } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  modals?: React.ReactNode;
  sidebarProps: any;
  loading: boolean;
  lang: string;
}

export const DashboardLayout = ({ children, modals, sidebarProps, loading, lang }: DashboardLayoutProps) => {
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
    <div className="flex h-screen h-[100dvh] max-h-screen max-h-[100dvh] bg-slate-50 overflow-hidden font-sans relative operator-compact-layout">
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

      <main className="flex-1 flex flex-col min-w-0 min-h-0 h-full max-h-full overflow-hidden relative">
        {/* Unified Full-Screen Top Header with Accessible Menü Toggle Button */}
        <div className="dashboard-top-header flex items-center justify-between px-3 sm:px-4 py-2 bg-white border-b border-slate-200/80 shrink-0 shadow-2xs z-20 select-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <button 
              onClick={() => {
                sidebarProps.setSidebarOpen(true);
                sidebarProps.setDesktopSidebarCollapsed(false);
              }} 
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
              title={lang === 'tr' ? 'Menüyü Aç' : 'Open Menu'}
            >
              <Menu className="w-4 h-4" />
              <span>{lang === 'tr' ? 'Menü' : 'Menu'}</span>
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <StoreLogo logoUrl={headerLogoUrl} storeName={headerStoreName} size="xs" />
              <div className="font-black text-slate-900 truncate tracking-tight uppercase text-xs sm:text-sm">
                {headerStoreName}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {sidebarProps?.publicUrl && (
              <a
                href={sidebarProps.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-bold transition-all border border-slate-200/70"
                title={lang === 'tr' ? 'Müşteri Web Sitesi' : 'Customer Website'}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{lang === 'tr' ? 'Web Sitesi' : 'Website'}</span>
              </a>
            )}

            {/* Global Outlook 2007 Tasks & Yellow Sticky Notes Hub + Top/Bottom Pull-Tab Handles */}
            <OutlookTasksNotesHub
              storeId={sidebarProps?.currentStoreId}
              lang={lang}
              onRefreshNotifications={sidebarProps?.onRefreshNotifications}
            />

            {sidebarProps?.setActiveTab && (
              <button
                type="button"
                onClick={() => sidebarProps.setActiveTab("notifications")}
                className={`relative p-1.5 sm:p-2 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                  sidebarProps.activeTab === "notifications"
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
                title={lang === "tr" ? "Bildirim Merkezi" : "Notifications"}
              >
                <Bell className="w-4 h-4" />
                {Number(sidebarProps?.totalUrgentNotifications || 0) > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-mono font-bold flex items-center justify-center bg-rose-600 text-white shadow-xs">
                    {sidebarProps.totalUrgentNotifications}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
        
        {/* Full-Screen Workspace Area (w-full max-w-full without artificial 7xl width restrictions) */}
        <div className="dashboard-scroll-area flex-1 min-h-0 overflow-y-auto p-2 sm:p-3 md:p-3.5 pb-28 bg-slate-50/50">
          <div className="w-full max-w-full space-y-3 pb-8">
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

      {/* Root-Level Modals Layer (Outside scroll container so iOS Safari never clips or covers modals) */}
      {modals}
    </div>
  );
};
