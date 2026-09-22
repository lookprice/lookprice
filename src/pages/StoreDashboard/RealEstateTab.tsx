import React, { useState, useEffect, useMemo } from "react";
import { Home } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/translations";
import { api } from "@/services/api";
import { RealEstateCalendar } from "@/components/RealEstateCalendar";
import { RealEstateCRM } from "@/components/RealEstateCRM";

// Vertical Slices
import { RealEstateTabProps, RealEstateViewMode, RealEstateStatusFilter } from "./realestate/types";
import { RealEstateHeaderToolbar } from "./realestate/RealEstateHeaderToolbar";
import { RealEstateCard } from "./realestate/RealEstateCard";
import { RealEstateModalsContainer } from "./realestate/RealEstateModalsContainer";
import { handlePrintProperty } from "./realestate/RealEstatePrintPoster";

export const RealEstateTab: React.FC<RealEstateTabProps> = ({
  properties,
  loading,
  onSave,
  onDelete,
  user,
  branding,
  initialStatusFilter,
  onResetStatusFilter,
  storeId
}) => {
  const safeProperties = useMemo(() => Array.isArray(properties) ? properties : [], [properties]);

  const { lang } = useLanguage();
  const t = translations[lang]?.dashboard || translations.tr.dashboard;

  const [search, setSearch] = useState("");
  const [tasks, setTasks] = useState<any[]>([]);
  const [driveConnected, setDriveConnected] = useState(false);
  const [isBackupLoading, setIsBackupLoading] = useState(false);

  const fetchTasks = async () => {
    const sid = storeId || user?.store_id;
    if (sid) {
      try {
        const res = await api.getTasks(sid);
        if (Array.isArray(res)) setTasks(res);
      } catch (err) {
        console.error("Error fetching tasks:", err);
      }
    }
  };

  useEffect(() => {
    api.getGoogleDriveSettings().then(res => {
      setDriveConnected(!!res?.connected);
    }).catch(err => console.error("Error fetching drive connected status in RealEstateTab", err));

    fetchTasks();
  }, [storeId, user?.store_id]);

  const [viewMode, setViewMode] = useState<RealEstateViewMode>('list');
  const [filterBranch, setFilterBranch] = useState("all");
  const [branches, setBranches] = useState<any[]>([]);
  const [filterScope, setFilterScope] = useState("all");
  const [filterRegion, setFilterRegion] = useState("all");
  
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [contractProperty, setContractProperty] = useState<any>(null);
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [activeTourProperty, setActiveTourProperty] = useState<any>(null);
  const [isSocialShareModalOpen, setIsSocialShareModalOpen] = useState(false);
  const [socialShareProperty, setSocialShareProperty] = useState<any>(null);
  const [isTapuModalOpen, setIsTapuModalOpen] = useState(false);
  const [tapuProperty, setTapuProperty] = useState<any>(null);
  const [viewDocsProperty, setViewDocsProperty] = useState<any>(null);

  const [statusTabFilter, setStatusTabFilter] = useState<RealEstateStatusFilter>('all');

  const uniqueRegions = useMemo(() => {
    return Array.from(new Set(safeProperties.map(p => p.kktc_region).filter(Boolean))) as string[];
  }, [safeProperties]);

  const filteredProperties = useMemo(() => {
    return safeProperties.filter(p => {
      const matchesSearch = !search || 
        p.title?.toLowerCase().includes(search.toLowerCase()) || 
        p.description?.toLowerCase().includes(search.toLowerCase()) || 
        p.reference_no?.toLowerCase().includes(search.toLowerCase());
      
      const matchesBranch = filterBranch === 'all' || p.branch_name === filterBranch;
      
      let matchesScope = true;
      if (filterScope === 'shared_pool') matchesScope = p.sharing_scope === 'shared_pool' || !p.sharing_scope;
      else if (filterScope === 'branch_private') matchesScope = p.sharing_scope === 'branch_private';
      else if (filterScope === 'private') matchesScope = p.sharing_scope === 'private';
      else if (filterScope === 'locked') matchesScope = !!p.reserved_by_branch;

      const matchesRegion = filterRegion === 'all' || p.kktc_region === filterRegion;

      return matchesSearch && matchesBranch && matchesScope && matchesRegion;
    });
  }, [safeProperties, search, filterBranch, filterScope, filterRegion]);

  const displayedProperties = useMemo(() => {
    return filteredProperties.filter(p => {
      if (statusTabFilter === 'all') return true;
      if (statusTabFilter === 'sale') return (p.listing_intent === 'sale' || !p.listing_intent) && p.status !== 'sold';
      if (statusTabFilter === 'rent') return p.listing_intent === 'rent' && p.status !== 'rented';
      if (statusTabFilter === 'optioned') return p.status === 'optioned';
      if (statusTabFilter === 'sold') return p.status === 'sold';
      if (statusTabFilter === 'rented') return p.status === 'rented';
      return true;
    });
  }, [filteredProperties, statusTabFilter]);

  const totalCount = filteredProperties.length;
  const saleCount = filteredProperties.filter(p => (p.listing_intent === 'sale' || !p.listing_intent) && p.status !== 'sold').length;
  const rentCount = filteredProperties.filter(p => p.listing_intent === 'rent' && p.status !== 'rented').length;
  const optionedCount = filteredProperties.filter(p => p.status === 'optioned').length;
  const soldCount = filteredProperties.filter(p => p.status === 'sold').length;
  const rentedCount = filteredProperties.filter(p => p.status === 'rented').length;

  const userRole = (user?.role || 'admin').toString();

  return (
    <div className="p-2 sm:p-3 space-y-2.5">
      {/* Header, stats, and search/filter toolbar */}
      <RealEstateHeaderToolbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        safeProperties={safeProperties}
        driveConnected={driveConnected}
        isBackupLoading={isBackupLoading}
        setIsBackupLoading={setIsBackupLoading}
        onAddNewProperty={() => {
          setSelectedProperty(null);
          setIsModalOpen(true);
        }}
        search={search}
        setSearch={setSearch}
        filterScope={filterScope}
        setFilterScope={setFilterScope}
        filterRegion={filterRegion}
        setFilterRegion={setFilterRegion}
        uniqueRegions={uniqueRegions}
        filterBranch={filterBranch}
        setFilterBranch={setFilterBranch}
        branches={branches}
        statusTabFilter={statusTabFilter}
        setStatusTabFilter={setStatusTabFilter}
        totalCount={totalCount}
        saleCount={saleCount}
        rentCount={rentCount}
        optionedCount={optionedCount}
        soldCount={soldCount}
        rentedCount={rentedCount}
      />
      
      {viewMode === 'calendar' ? (
        <RealEstateCalendar 
          storeId={storeId || user?.store_id} 
          properties={safeProperties} 
          onClose={() => setViewMode('list')}
          hideHeader={true}
        />
      ) : viewMode === 'pipeline' ? (
        <RealEstateCRM
          storeId={storeId || user?.store_id || 0}
          properties={safeProperties}
          tasks={tasks}
          hideHeader={true}
          onOpenCalendar={() => setViewMode('calendar')}
          onOpenTourModal={(p) => {
            setActiveTourProperty(p);
            setIsTourModalOpen(true);
          }}
          onRefresh={fetchTasks}
        />
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
          <span className="text-xs text-slate-500 font-bold">Portföy Yükleniyor...</span>
        </div>
      ) : displayedProperties.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <Home className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-bold text-sm">Aradığınız kriterlere uygun gayrimenkul bulunamadı.</p>
          <p className="text-xs text-slate-400 mt-1">Yeni ilan girerek portföy oluşturabilir ve pilot satışlara devam edebilirsiniz.</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {displayedProperties.map(property => (
            <RealEstateCard
              key={property.id}
              property={property}
              viewMode={viewMode}
              onOpenContract={(p) => {
                setContractProperty(p);
                setIsContractModalOpen(true);
              }}
              onOpenTapu={(p) => {
                setTapuProperty(p);
                setIsTapuModalOpen(true);
              }}
              onOpenSocialShare={(p) => {
                setSocialShareProperty(p);
                setIsSocialShareModalOpen(true);
              }}
              onPrint={(p) => handlePrintProperty(p, branding)}
              onOpenTour={(p) => {
                setActiveTourProperty(p);
                setIsTourModalOpen(true);
              }}
              onGoToPipeline={() => setViewMode('pipeline')}
              onEdit={(p) => {
                setSelectedProperty(p);
                setIsModalOpen(true);
              }}
              onDelete={onDelete}
              onViewDocs={(p) => setViewDocsProperty(p)}
            />
          ))}
        </div>
      )}

      {/* Modals & Popups Container */}
      <RealEstateModalsContainer
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        selectedProperty={selectedProperty}
        setSelectedProperty={setSelectedProperty}
        isContractModalOpen={isContractModalOpen}
        setIsContractModalOpen={setIsContractModalOpen}
        contractProperty={contractProperty}
        setContractProperty={setContractProperty}
        isTapuModalOpen={isTapuModalOpen}
        setIsTapuModalOpen={setIsTapuModalOpen}
        tapuProperty={tapuProperty}
        setTapuProperty={setTapuProperty}
        isTourModalOpen={isTourModalOpen}
        setIsTourModalOpen={setIsTourModalOpen}
        activeTourProperty={activeTourProperty}
        setActiveTourProperty={setActiveTourProperty}
        isSocialShareModalOpen={isSocialShareModalOpen}
        setIsSocialShareModalOpen={setIsSocialShareModalOpen}
        socialShareProperty={socialShareProperty}
        setSocialShareProperty={setSocialShareProperty}
        viewDocsProperty={viewDocsProperty}
        setViewDocsProperty={setViewDocsProperty}
        storeId={storeId}
        user={user}
        userRole={userRole}
        branding={branding}
        safeProperties={safeProperties}
        onSave={onSave}
        fetchTasks={fetchTasks}
      />
    </div>
  );
};

export default RealEstateTab;
