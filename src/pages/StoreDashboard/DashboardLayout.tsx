import React from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import ErrorBoundary from "../../components/ErrorBoundary";
import { Loader2 } from "lucide-react";

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
