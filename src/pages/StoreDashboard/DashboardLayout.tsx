import React from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import ErrorBoundary from "../../components/ErrorBoundary";
import { Loader2, Menu } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebarProps: any;
  loading: boolean;
  lang: string;
}

export const DashboardLayout = ({ children, sidebarProps, loading, lang }: DashboardLayoutProps) => {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative">
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

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Header with Hamburger Menu */}
        <div className="lg:hidden flex items-center p-4 bg-white border-b border-slate-200 z-10">
          <button onClick={() => sidebarProps.setSidebarOpen(true)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
          <div className="ml-4 font-bold text-slate-900 truncate tracking-tight uppercase text-sm">
            {sidebarProps.branding?.name || "LookPrice"}
          </div>
        </div>

        {/* Desktop Collapsed Header */}
        {sidebarProps.desktopSidebarCollapsed && (
          <div className="hidden lg:flex items-center p-4 bg-white border-b border-slate-200/60 z-10 shadow-sm transition-all">
            <button 
              onClick={() => sidebarProps.setDesktopSidebarCollapsed(false)} 
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100 rounded-xl font-bold text-xs uppercase transition-all tracking-wider shrink-0"
              title={lang === 'tr' ? 'Menüyü Aç' : 'Open Sidebar'}
            >
              <Menu className="w-4 h-4" />
              <span>{lang === 'tr' ? 'Menüyü Aç' : 'Open Menu'}</span>
            </button>
            <div className="ml-4 font-black text-slate-900 truncate tracking-tight uppercase text-xs">
              {sidebarProps.branding?.name || "LookPrice"}
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50">
          <div className="max-w-7xl mx-auto space-y-8">
            <ErrorBoundary lang={lang}>
              {loading ? (
                <div className="flex flex-col items-center justify-center h-64">
                   <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
                   <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Synchronizing_Data...</p>
                </div>
              ) : children}
            </ErrorBoundary>
          </div>
        </div>
      </main>
    </div>
  );
};
