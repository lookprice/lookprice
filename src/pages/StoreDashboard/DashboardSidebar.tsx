import React, { useState, useEffect } from "react";
import {
  LogOut,
  Globe,
  Scan,
  QrCode,
  ChevronUp,
  ChevronDown,
  UtensilsCrossed,
  PanelLeftClose,
  UserCheck,
  CheckSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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
  isDeveloperProject?: boolean;
  isCafeRestaurant?: boolean;
  isCorporateWebsite?: boolean;
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
  isDeveloperProject,
  isCafeRestaurant,
  isCorporateWebsite,
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
    project_hub: true,
    corporate_ops: true,
    website_cms: true,
    dashboard: true,
    sales: true,
    operations: true,
    real_estate: true,
    finance_operations: true,
    team: true,
    integrations: true,
    settings: false
  });

  useEffect(() => {
    setOpenCategories((prev) => ({
      ...prev,
      project_hub: prev.project_hub ?? true,
      corporate_ops: prev.corporate_ops ?? true
    }));
  }, [navItems]);

  const storeLogoUrl = branding?.logo_url || branding?.logo;
  const rawDisplayName =
    branding?.store_name && !/^lookprice$/i.test(branding.store_name.trim())
      ? branding.store_name.trim()
      : branding?.name && !/^lookprice$/i.test(branding.name.trim())
      ? branding.name.trim()
      : "Seçkin Mağaza";
  const displayName = rawDisplayName.replace(/\s*\(projectLP\)\s*/gi, "").trim();

  const handleCloseMenu = () => {
    setSidebarOpen(false);
    setDesktopSidebarCollapsed(true);
    if (isDeveloperProject) {
      localStorage.setItem("projectLP_sidebar_collapsed", "true");
    }
  };

  const handleSelectNavItem = (tabId: string) => {
    startTransition(() => {
      setActiveTab(tabId);
    });
    setSidebarOpen(false);
    if (!isDeveloperProject) {
      setDesktopSidebarCollapsed(true);
    }
  };

  const isDrawerOpen = sidebarOpen || !desktopSidebarCollapsed;

  return (
    <>
      {/* Backdrop: Mobile/Tablet always; Desktop only for non-inline drawer mode */}
      <AnimatePresence>
        {(sidebarOpen || (!desktopSidebarCollapsed && !isDeveloperProject)) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseMenu}
            className={`fixed inset-0 bg-slate-950/50 z-50 backdrop-blur-xs transition-opacity ${
              isDeveloperProject && !sidebarOpen ? "lg:hidden" : ""
            }`}
          />
        )}
      </AnimatePresence>

      <aside
        className={`
          fixed inset-y-0 left-0 w-72 bg-white text-slate-800 z-50 transition-transform duration-300 ease-in-out shrink-0 border-r border-slate-200 select-none shadow-2xl
          ${
            isDeveloperProject && !desktopSidebarCollapsed
              ? "lg:static lg:translate-x-0 lg:shadow-none lg:z-30"
              : ""
          }
          ${isDrawerOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full font-display">
          {/* High-Contrast Daylight Header Block */}
          <div className="px-4 py-3.5 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2.5 min-w-0">
              <StoreLogo logoUrl={storeLogoUrl} storeName={displayName} size="xs" />
              <div className="min-w-0">
                <h1
                  className="text-[15px] font-semibold text-slate-950 tracking-tight leading-snug truncate"
                  title={displayName}
                >
                  {displayName}
                </h1>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    {lang === "tr" ? "Bulut Panel" : "Cloud POS"}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleCloseMenu}
              className="flex items-center justify-center p-1.5 rounded-lg text-slate-500 hover:text-slate-950 hover:bg-slate-200/70 transition-colors shrink-0 cursor-pointer"
              title={t?.collapseSidebar || (lang === "tr" ? "Menüyü Gizle" : "Close Menu")}
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-2 custom-scrollbar">
            {navItems.map((navItem) => {
              if (navItem.type === "category") {
                const isCategoryOpen = openCategories[navItem.key] !== false;
                return (
                  <div key={navItem.key} className="mb-1">
                    <button
                      onClick={() =>
                        setOpenCategories({
                          ...openCategories,
                          [navItem.key]: !isCategoryOpen
                        })
                      }
                      className="flex items-center justify-between w-full text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2.5 py-2 hover:text-indigo-700 transition-colors cursor-pointer"
                    >
                      <span>{navItem.title}</span>
                      {isCategoryOpen ? (
                        <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                      )}
                    </button>
                    <AnimatePresence>
                      {isCategoryOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden space-y-1"
                        >
                          {navItem.items.map((item: any) => {
                            const isActive = activeTab === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={() => handleSelectNavItem(item.id)}
                                className={`w-full group flex items-center justify-between px-3 py-2 rounded-xl text-[13.5px] leading-snug transition-all duration-150 cursor-pointer ${
                                  isActive
                                    ? "bg-slate-900 text-white shadow-xs font-medium"
                                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 font-medium"
                                }`}
                              >
                                <div className="flex items-center space-x-2.5 min-w-0">
                                  <item.icon
                                    className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                                      isActive
                                        ? "text-white"
                                        : "text-slate-500 group-hover:text-slate-900"
                                    }`}
                                  />
                                  <span className="truncate tracking-tight">{item.label}</span>
                                </div>
                                {item.badge > 0 && (
                                  <span
                                    className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-mono font-medium shrink-0 ${
                                      isActive
                                        ? "bg-white/20 text-white"
                                        : item.badgeType === "error"
                                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                                        : "bg-slate-100 text-slate-700 border border-slate-200"
                                    }`}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              } else {
                const isActive = activeTab === navItem.id;
                return (
                  <button
                    key={navItem.id}
                    onClick={() => handleSelectNavItem(navItem.id)}
                    className={`w-full group flex items-center justify-between px-3 py-2 rounded-xl text-[13.5px] leading-snug transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-slate-900 text-white shadow-xs font-medium"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 font-medium"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <navItem.icon
                        className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                          isActive ? "text-white" : "text-slate-500 group-hover:text-slate-900"
                        }`}
                      />
                      <span className="truncate tracking-tight">{navItem.label}</span>
                    </div>
                    {navItem.badge > 0 && (
                      <span
                        className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-mono font-medium shrink-0 ${
                          isActive
                            ? "bg-white/20 text-white"
                            : navItem.badgeType === "error"
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {navItem.badge}
                      </span>
                    )}
                  </button>
                );
              }
            })}

            <div className="pt-3 mt-3 border-t border-slate-200 space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2.5 py-1">
                {lang === "tr" ? "HARİCİ BAĞLANTILAR" : "EXTERNAL ACCESS"}
              </div>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-[13.5px] font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-all cursor-pointer"
              >
                <Globe className="h-[18px] w-[18px] text-slate-500" />
                <span className="truncate tracking-tight">{t.storeWebsite}</span>
              </a>
              {!isPortfolio && !isCafeRestaurant && !isCorporateWebsite && (
                <a
                  href={scanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-[13.5px] font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-all cursor-pointer"
                >
                  <Scan className="h-[18px] w-[18px] text-slate-500" />
                  <span className="truncate tracking-tight">{t.barcodeScanner}</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13.5px] font-medium text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all cursor-pointer group"
                title={
                  isCorporateWebsite
                    ? lang === "tr"
                      ? "Kurumsal Web Sitesi QR Kodu"
                      : "Corporate Website QR Code"
                    : !isPortfolio && !isCafeRestaurant
                    ? lang === "tr"
                      ? "Mağaza İçi 'Fiyat Gör' Barkod QR Kodu & Yazdırılabilir Afiş"
                      : "In-Store Price Check QR & Printable Poster"
                    : isCafeRestaurant
                    ? lang === "tr"
                      ? "Dijital Menü & Web QR Kodu"
                      : "Digital Menu & Web QR Code"
                    : lang === "tr"
                    ? "Web Vitrini & Portföy QR Kodu"
                    : "Web Showcase & Portfolio QR Code"
                }
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <QrCode className="h-[18px] w-[18px] text-amber-700 shrink-0 group-hover:scale-105 transition-transform" />
                  <span className="truncate tracking-tight">
                    {isCorporateWebsite
                      ? lang === "tr"
                        ? "Web Sitesi QR Kodu"
                        : "Website QR Code"
                      : !isPortfolio && !isCafeRestaurant
                      ? lang === "tr"
                        ? "Fiyat Gör QR & Afiş"
                        : "Price Check QR & Poster"
                      : isCafeRestaurant
                      ? lang === "tr"
                        ? "Menü & Vitrin QR"
                        : "Menu & Web QR"
                      : lang === "tr"
                      ? "Vitrin QR Kodu"
                      : "Store QR Code"}
                  </span>
                </div>
                <span className="text-[10px] bg-amber-200/80 text-amber-950 px-1.5 py-0.5 rounded font-mono font-semibold uppercase">
                  {!isPortfolio && !isCafeRestaurant && !isCorporateWebsite ? "Afiş" : "QR"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("open-tasks-notes-hub", { detail: { section: "tasks" } })
                  );
                  setSidebarOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13.5px] font-medium text-amber-950 bg-amber-50/70 hover:bg-amber-100 border border-amber-200 transition-all group cursor-pointer"
                title={
                  lang === "tr"
                    ? "Görevler & Sarı Yapışkan Notlar (Ajanda)"
                    : "Tasks & Sticky Notes"
                }
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <CheckSquare className="h-[18px] w-[18px] text-amber-700 shrink-0 group-hover:scale-105 transition-transform" />
                  <span className="truncate tracking-tight">
                    {lang === "tr" ? "Görevler & Notlar" : "Tasks & Notes"}
                  </span>
                </div>
                <span className="text-[10px] bg-amber-500 text-white font-semibold px-1.5 py-0.5 rounded uppercase font-mono">
                  Ajanda
                </span>
              </button>
              {isCafeRestaurant && currentStoreId && (
                <a
                  href={`${window.location.origin}/digital-menu/${currentStoreId}/garson`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-[13.5px] font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-all cursor-pointer"
                >
                  <UtensilsCrossed className="h-[18px] w-[18px] text-slate-500" />
                  <span className="truncate tracking-tight">
                    {t.barcodeScanner === "Barcode Scanner"
                      ? "Menu / Order Screen"
                      : "Menü / Sipariş Ekranı"}
                  </span>
                </a>
              )}
            </div>
          </nav>

          <div className="p-3 border-t border-slate-200 bg-slate-50/90 space-y-2 shrink-0">
            {isCafeRestaurant && onOpenRoleModal && (
              <button
                onClick={onOpenRoleModal}
                className="flex w-full items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium text-amber-950 bg-amber-50 hover:bg-amber-100 transition-all border border-amber-200 group cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <UserCheck className="h-4 w-4 text-amber-700" />
                  <span>
                    {activeStaffRole === "manager"
                      ? "Yönetici"
                      : activeStaffRole === "cashier"
                      ? "Kasiyer"
                      : "Garson"}
                  </span>
                </div>
                <span className="text-[10px] bg-amber-200/80 text-amber-950 px-1.5 py-0.5 rounded uppercase font-mono">
                  Değiştir
                </span>
              </button>
            )}

            <button
              onClick={onLogout}
              className="flex w-full items-center space-x-2.5 px-3 py-2 rounded-xl text-[13.5px] font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 transition-all border border-rose-200 group cursor-pointer"
            >
              <LogOut className="h-4 w-4 text-rose-600" />
              <span>{t.logout}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
