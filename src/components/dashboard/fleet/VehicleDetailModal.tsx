import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDateTR, formatFuelType, formatTransmission } from '../../../utils/formatUtils';
import { 
  X, 
  Car, 
  FileText, 
  Wrench, 
  UserCheck, 
  History, 
  AlertTriangle,
  Plus,
  Calendar,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
  Settings,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { 
  Vehicle, 
  VehicleDocument, 
  VehicleMaintenance, 
  VehicleAssignment, 
  VehicleMileage, 
  VehicleIncident 
} from '../../../types';

interface VehicleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  t: any;
  lang: string;
  isViewer: boolean;
  activeVehicleTab: string;
  setActiveVehicleTab: (tab: any) => void;
  documents: VehicleDocument[];
  maintenance: VehicleMaintenance[];
  assignments: VehicleAssignment[];
  mileageLogs: VehicleMileage[];
  incidents: VehicleIncident[];
  drivers: any[];
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  generateVehicleTitle: (vehicle: Vehicle) => string;
  onAddDocument: () => void;
  onAddMaintenance: () => void;
  onAddAssignment: () => void;
  onAddMileage: () => void;
  onAddIncident: () => void;
  handleDeleteDocument: (id: number) => void;
  handleDeleteMaintenance: (id: number) => void;
  handleUpdateAssignment: (id: number, endMileage: number) => void;
  onEditVehicle?: () => void;
}

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  t,
  lang,
  isViewer,
  activeVehicleTab,
  setActiveVehicleTab,
  documents,
  maintenance,
  assignments,
  mileageLogs,
  incidents,
  drivers,
  getStatusColor,
  getStatusText,
  generateVehicleTitle,
  onAddDocument,
  onAddMaintenance,
  onAddAssignment,
  onAddMileage,
  onAddIncident,
  handleDeleteDocument,
  handleDeleteMaintenance,
  handleUpdateAssignment,
  onEditVehicle
}) => {
  const [isDossierCollapsed, setIsDossierCollapsed] = useState(false);
  const recordsSectionRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !vehicle) return null;
  const isTr = lang === 'tr';

  const sections = [
    { id: 'docs', icon: FileText, label: t.documents || 'Belgeler', count: documents.length, color: 'blue' },
    { id: 'maintenance', icon: Wrench, label: t.maintenance || 'Bakım', count: maintenance.length, color: 'orange' },
    { id: 'assignments', icon: UserCheck, label: t.history || 'Zimmet & Sürücü', count: assignments.length, color: 'indigo' },
    { id: 'mileage', icon: History, label: t.mileageLogs || 'KM Geçmişi', count: mileageLogs.length, color: 'emerald' },
    { id: 'incidents', icon: AlertTriangle, label: t.incidents || 'Hasar & Olaylar', count: incidents.length, color: 'red' }
  ];

  // Parse paint report
  const paintData = (() => {
    try {
      return typeof vehicle.paint_report === 'string' ? JSON.parse(vehicle.paint_report || '{}') : (vehicle.paint_report || {});
    } catch {
      return {};
    }
  })();

  const paintCounts = Object.values(paintData).reduce<{ original: number; painted: number; replaced: number }>(
    (acc, status: any) => {
      if (status === 'painted') acc.painted++;
      else if (status === 'replaced') acc.replaced++;
      else acc.original++;
      return acc;
    },
    { original: 0, painted: 0, replaced: 0 }
  );

  // If paintData is empty, default to 13 original parts for clean visual summary
  const totalPaintParts = paintCounts.original + paintCounts.painted + paintCounts.replaced;
  const effectiveOriginal = totalPaintParts === 0 ? 13 : paintCounts.original;

  const handleSelectSubTab = (tabId: string) => {
    setActiveVehicleTab(tabId);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setTimeout(() => {
        recordsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-1 sm:p-2">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.98, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.98, opacity: 0, y: 10 }}
        className="bg-white w-full max-w-6xl h-[94vh] max-h-[94dvh] rounded-xl shadow-2xl relative z-10 overflow-hidden flex flex-col border border-slate-800"
      >
        {/* Compact Header */}
        <div className="px-3 py-1.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-medium tracking-widest uppercase flex items-center gap-1 shadow-sm shrink-0 border border-blue-500/50">
              <Car className="w-3 h-3" />
              <span>{vehicle.plate}</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-[10px] font-medium text-white truncate flex items-center gap-2 uppercase tracking-widest">
                <span className="truncate">{generateVehicleTitle(vehicle)}</span>
                <span className={`hidden sm:inline-block px-1.5 py-0 rounded-[4px] text-[8px] font-medium uppercase tracking-widest border shrink-0 ${getStatusColor(vehicle.status).replace('bg-', 'bg-opacity-20 border-')}`}>
                  {getStatusText(vehicle.status)}
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {vehicle.selling_price && (
              <div className="hidden sm:flex items-center gap-1 bg-emerald-950 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded text-[9px] font-medium uppercase tracking-tighter">
                <Tag className="w-2.5 h-2.5 text-emerald-400" />
                <span>{vehicle.selling_price.toLocaleString()} {vehicle.currency || 'TRY'}</span>
              </div>
            )}

            {/* Mobile Quick Toggle for Künye */}
            <button
              type="button"
              onClick={() => setIsDossierCollapsed(prev => !prev)}
              className="lg:hidden flex items-center gap-1 px-2 py-0.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded text-[9px] font-medium uppercase tracking-wider transition-all border border-blue-500/40 cursor-pointer"
            >
              <ShieldCheck className="w-2.5 h-2.5" />
              <span>{isDossierCollapsed ? (isTr ? 'Künyeyi Aç' : 'Show Info') : (isTr ? 'Künyeyi Daralt' : 'Hide Info')}</span>
              {isDossierCollapsed ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronUp className="w-2.5 h-2.5" />}
            </button>

            {!isViewer && onEditVehicle && (
              <button
                onClick={onEditVehicle}
                className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-[9px] font-medium uppercase tracking-widest transition-all border border-slate-700 cursor-pointer"
              >
                <Settings className="w-2.5 h-2.5" />
                <span>{isTr ? 'DÜZENLE' : 'EDIT'}</span>
              </button>
            )}

            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-all cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Split Layout: Scrollable as a unified page on mobile (< lg), side-by-side split on desktop (lg+) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden custom-scrollbar">
          {/* Left / Main Dossier Panel (Secere Künyesi) */}
          <div className="w-full lg:w-[330px] bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col lg:overflow-y-auto custom-scrollbar p-2.5 space-y-2 shrink-0">
            
            {/* Collapsible Header Bar for Araç Künyesi & Seceresi */}
            <div 
              onClick={() => setIsDossierCollapsed(prev => !prev)}
              className="bg-white px-2.5 py-2 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-colors select-none"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="text-[10px] font-semibold text-slate-900 uppercase tracking-widest truncate">
                  {isTr ? 'Araç Künyesi & Seceresi' : 'Vehicle Dossier'}
                </span>
                <span className="text-[9px] font-mono font-medium text-slate-400 shrink-0">#{vehicle.id}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {isDossierCollapsed && (
                  <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {vehicle.selling_price ? `${vehicle.selling_price.toLocaleString()} ${vehicle.currency || 'TRY'}` : vehicle.plate}
                  </span>
                )}
                <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-tighter">
                  {isDossierCollapsed ? (isTr ? 'Detayı Aç' : 'Expand') : (isTr ? 'Daralt' : 'Collapse')}
                  {isDossierCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                </span>
              </div>
            </div>

            {/* Compact Summary Strip when Collapsed */}
            {isDossierCollapsed ? (
              <div className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                <div className="flex items-center gap-2 font-medium text-slate-700">
                  <span className="font-mono text-slate-900 font-semibold">{vehicle.plate}</span>
                  <span>•</span>
                  <span>{vehicle.brand} {vehicle.model}</span>
                  <span>•</span>
                  <span>{vehicle.year} ({(vehicle.current_mileage || 0).toLocaleString()} KM)</span>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-medium uppercase">
                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">Orj:{effectiveOriginal}</span>
                  <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">Boy:{paintCounts.painted}</span>
                  <span className="text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">Değ:{paintCounts.replaced}</span>
                </div>
              </div>
            ) : (
              <>
                {/* Main Photo Thumbnail */}
                <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-slate-300/50 bg-slate-200 shadow-sm group shrink-0">
                  {vehicle.images && vehicle.images.length > 0 ? (
                    <img 
                      src={vehicle.images[0]} 
                      alt={vehicle.plate} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center gap-1 text-slate-400">
                      <Car className="w-6 h-6 text-slate-300" />
                      <span className="text-[9px] font-medium uppercase tracking-wider">{isTr ? 'Görsel Yok' : 'No Image'}</span>
                    </div>
                  )}
                  {vehicle.images && vehicle.images.length > 1 && (
                    <span className="absolute bottom-1 right-1 bg-slate-900/90 text-white text-[8px] font-medium px-1.5 py-0.5 rounded backdrop-blur-xs border border-white/10">
                      +{vehicle.images.length - 1} FOTO
                    </span>
                  )}
                </div>

                {/* ARAÇ SECERESİ & KÜNYESİ (Micro Bento Grid) */}
                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs space-y-2">
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <div className="p-1.5 bg-slate-50 rounded border border-slate-100">
                      <span className="text-[8px] font-medium text-slate-400 uppercase block mb-0.5">Plaka</span>
                      <span className="font-medium text-slate-900 font-mono tracking-tighter uppercase">{vehicle.plate}</span>
                    </div>

                    <div className="p-1.5 bg-slate-50 rounded border border-slate-100">
                      <span className="text-[8px] font-medium text-slate-400 uppercase block mb-0.5">Satış Fiyatı</span>
                      <span className="font-medium text-emerald-700 tracking-tighter">
                        {vehicle.selling_price ? `${vehicle.selling_price.toLocaleString()} ${vehicle.currency || 'TRY'}` : 'N/A'}
                      </span>
                    </div>

                    <div className="p-1.5 bg-slate-50 rounded border border-slate-100">
                      <span className="text-[8px] font-medium text-slate-400 uppercase block mb-0.5">Marka / Model</span>
                      <span className="font-medium text-slate-800 truncate block tracking-tight uppercase">{vehicle.brand} {vehicle.model}</span>
                    </div>

                    <div className="p-1.5 bg-slate-50 rounded border border-slate-100">
                      <span className="text-[8px] font-medium text-slate-400 uppercase block mb-0.5">Yıl / KM</span>
                      <span className="font-medium text-slate-800 tracking-tighter">{vehicle.year} • {(vehicle.current_mileage || 0).toLocaleString()} KM</span>
                    </div>

                    <div className="p-1.5 bg-slate-50 rounded border border-slate-100">
                      <span className="text-[8px] font-medium text-slate-400 uppercase block mb-0.5">Yakıt / Vites</span>
                      <span className="font-medium text-slate-700 truncate block tracking-tighter uppercase">
                        {formatFuelType(vehicle.fuel_type)} • {formatTransmission(vehicle.transmission)}
                      </span>
                    </div>

                    <div className="p-1.5 bg-slate-50 rounded border border-slate-100">
                      <span className="text-[8px] font-medium text-slate-400 uppercase block mb-0.5">Paket / Renk</span>
                      <span className="font-medium text-slate-700 truncate block tracking-tighter uppercase">
                        {vehicle.package_name || '-'} {vehicle.color ? `(${vehicle.color})` : ''}
                      </span>
                    </div>

                    <div className="p-1.5 bg-slate-50 rounded border border-slate-100">
                      <span className="text-[8px] font-medium text-slate-400 uppercase block mb-0.5">Kategori / Kasa</span>
                      <span className="font-medium text-slate-700 truncate block tracking-tighter uppercase">
                        {vehicle.category || 'Otomobil'} {vehicle.body_type ? `• ${vehicle.body_type}` : ''}
                      </span>
                    </div>

                    <div className="p-1.5 bg-slate-50 rounded border border-slate-100">
                      <span className="text-[8px] font-medium text-slate-400 uppercase block mb-0.5">Tramer Kaydı</span>
                      <span className="font-medium text-slate-900 tracking-tighter">
                        {Number(vehicle.tramer_amount) > 0 ? `${Number(vehicle.tramer_amount).toLocaleString()} ${vehicle.tramer_currency || 'TL'}` : '0.00 TL (Temiz)'}
                      </span>
                    </div>

                    {vehicle.chassis_number && (
                      <div className="col-span-2 p-1.5 bg-slate-50 rounded border border-slate-100 flex items-center justify-between">
                        <span className="text-[8px] font-medium text-slate-400 uppercase">Şasi:</span>
                        <span className="font-mono text-[10px] font-medium text-slate-800 tracking-tight">{vehicle.chassis_number}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ekspertiz Özeti */}
                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs space-y-1.5">
                  <span className="text-[9px] font-medium text-slate-900 uppercase tracking-widest block border-b border-slate-100 pb-1">
                    Ekspertiz Durumu
                  </span>
                  <div className="flex items-center justify-between text-[10px] font-medium pt-0.5 px-0.5 uppercase tracking-tighter">
                    <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                      Orj: {effectiveOriginal}
                    </span>
                    <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                      Boy: {paintCounts.painted}
                    </span>
                    <span className="text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                      Değ: {paintCounts.replaced}
                    </span>
                  </div>
                </div>

                {/* Descriptions (Pazar Hikayesi & Teknik) */}
                {(vehicle.market_story || vehicle.description) && (
                  <div className="bg-indigo-50/40 p-2 rounded-lg border border-indigo-100 space-y-1">
                    <span className="text-[9px] font-medium text-indigo-700 uppercase tracking-widest block">Açıklama</span>
                    <p className="text-[10px] text-slate-800 leading-tight font-medium line-clamp-3 italic">
                      "{vehicle.market_story || vehicle.description}"
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Sub-Records Content Area (Guaranteed minimum height on mobile so it never gets crushed) */}
          <div ref={recordsSectionRef} className="flex-1 flex flex-col min-h-[380px] lg:min-h-0 lg:overflow-hidden bg-white">
            {/* Tabs Navigation (Sticky on mobile scroll) */}
            <div className="sticky top-0 z-20 px-2 pt-1.5 bg-slate-900 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0 border-b border-white/10">
              {sections.map((sec) => {
                const isActive = activeVehicleTab === sec.id;
                const Icon = sec.icon;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => handleSelectSubTab(sec.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-[10px] font-medium transition-all whitespace-nowrap uppercase tracking-wider border-x border-t cursor-pointer ${
                      isActive 
                        ? 'bg-white text-blue-600 border-white/10 shadow-sm font-semibold' 
                        : 'text-slate-300 hover:text-white border-transparent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{sec.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                      isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {sec.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sub-Tab Header Bar */}
            <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
              <span className="text-[10px] font-semibold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                {(() => {
                  const s = sections.find(x => x.id === activeVehicleTab);
                  return s ? (
                    <>
                      <s.icon className="w-3.5 h-3.5 text-blue-600" />
                      <span>{s.label} ({s.count})</span>
                    </>
                  ) : null;
                })()}
              </span>

              <div className="flex items-center gap-1.5">
                {!isViewer && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeVehicleTab === 'docs') onAddDocument();
                      else if (activeVehicleTab === 'maintenance') onAddMaintenance();
                      else if (activeVehicleTab === 'assignments') onAddAssignment();
                      else if (activeVehicleTab === 'mileage') onAddMileage();
                      else if (activeVehicleTab === 'incidents') onAddIncident();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white rounded-md text-[10px] font-medium hover:bg-blue-700 transition-all uppercase tracking-tighter shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isTr ? 'Kaydı İşle' : 'Add'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Tab Items List */}
            <div className="flex-1 lg:overflow-y-auto p-2.5 sm:p-3.5 custom-scrollbar bg-slate-50/40">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeVehicleTab}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.1 }}
                  className="space-y-2"
                >
                  {/* Documents Tab */}
                  {activeVehicleTab === 'docs' && (
                    documents.map((doc) => (
                      <div key={doc.id} className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors shadow-2xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0 border border-blue-100">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 text-[11px] truncate uppercase tracking-tight">{doc.type}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                              <span className="inline-flex items-center gap-1 text-[9px] text-slate-500 font-medium uppercase">
                                <Calendar className="w-2.5 h-2.5 text-slate-400" />
                                SON: {doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString('tr-TR') : '-'}
                              </span>
                              {(doc as any).notes && doc.document_url !== "is_virtual_contract" && (
                                <span className="text-[9px] text-slate-500 truncate max-w-[220px]">• {(doc as any).notes}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {doc.document_url === "is_virtual_contract" ? (
                            <button
                              type="button"
                              onClick={() => {
                                let details: any = {};
                                try {
                                  details = typeof doc.notes === 'string' ? JSON.parse(doc.notes) : doc.notes || {};
                                } catch (e) { console.error(e); }
                                
                                const cType = details.contractType || 'consignment';
                                const cTitle = cType === 'consignment' ? 'KONSİNYE SÖZLEŞMESİ' : 'REZERVASYON FORMU';
                                const symbol = vehicle.currency === 'GBP' ? '£' : vehicle.currency === 'USD' ? '$' : vehicle.currency === 'EUR' ? '€' : '₺';
                                const priceFormatted = `${symbol}${(vehicle.selling_price || vehicle.buying_price || 0).toLocaleString()}`;
                                const vehicleDetails = `${vehicle.brand} ${vehicle.model} (${vehicle.year || ''}) • Plaka: ${vehicle.plate || ''} • Şasi: ${vehicle.chassis_number || ''}`;

                                const html = `
                                  <div style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #1e293b; line-height: 1.5; font-size: 13px;">
                                    <h2 style="font-size: 16px; font-weight: 900; text-align: center; margin-bottom: 20px;">${cTitle}</h2>
                                    <p><strong>Müşteri:</strong> ${details.clientName || ''} (${details.clientIdentity || ''})</p>
                                    <p><strong>Araç:</strong> ${vehicleDetails}</p>
                                    <p><strong>Fiyat:</strong> ${priceFormatted}</p>
                                    <p><strong>Tarih:</strong> ${details.contractDate || new Date().toLocaleDateString("tr-TR")}</p>
                                  </div>
                                `;
                                const win = window.open('', '_blank');
                                if (win) { win.document.write(`<html><head><title>${cTitle}</title></head><body onload="window.print()">${html}</body></html>`); win.document.close(); }
                              }}
                              className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-medium uppercase hover:bg-emerald-200 transition-colors cursor-pointer"
                            >
                              GÖR
                            </button>
                          ) : doc.document_url ? (
                            <a href={doc.document_url} target="_blank" rel="noopener noreferrer" className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[8px] font-medium uppercase">
                              Aktif
                            </span>
                          )}

                          {!isViewer && (
                            <button onClick={() => handleDeleteDocument(doc.id)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {/* Maintenance Tab */}
                  {activeVehicleTab === 'maintenance' && (
                    maintenance.map((m) => (
                      <div key={m.id} className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors shadow-2xs gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center border border-orange-100 shrink-0">
                            <Wrench className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 text-[11px] uppercase tracking-tight truncate">{m.type}</p>
                            <p className="text-[9px] text-slate-500 font-medium uppercase mt-0.5">
                              {m.provider_name || 'Yetkili Servis'} • {formatDateTR(m.date)} {m.mileage ? `• ${Number(m.mileage).toLocaleString()} KM` : ''}
                            </p>
                            {(m as any).description && (
                              <p className="text-[9px] text-slate-600 mt-0.5 line-clamp-1">{(m as any).description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 tabular-nums">
                            {Number(m.cost || 0).toLocaleString()} {(m as any).currency || 'TL'}
                          </span>
                          {!isViewer && (
                            <button onClick={() => handleDeleteMaintenance(m.id)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {/* Assignments Tab */}
                  {activeVehicleTab === 'assignments' && (
                    assignments.map((a) => {
                      const matchedDriver = drivers.find((d: any) => Number(d.id) === Number((a as any).driver_id));
                      const assigneeTitle = matchedDriver?.name || (a as any).driver_name || a.user_email || 'Showroom Sürücü Tahsisi';
                      return (
                        <div key={a.id} className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors shadow-2xs gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${a.status === 'active' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                              <UserCheck className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 text-[11px] uppercase tracking-tight truncate">{assigneeTitle}</p>
                              <p className="text-[9px] text-slate-500 font-medium uppercase mt-0.5">
                                {formatDateTR(a.start_date)} • {a.start_mileage?.toLocaleString()} KM
                                {a.end_mileage ? ` → ${a.end_mileage.toLocaleString()} KM` : ''}
                              </p>
                              {a.notes && (
                                <p className="text-[9px] text-slate-600 mt-0.5 line-clamp-1">{a.notes}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-semibold uppercase tracking-widest border ${a.status === 'active' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                              {a.status === 'active' ? 'AKTİF ZİMMET' : 'TAMAMLANDI'}
                            </span>
                            {a.status === 'active' && !isViewer && (
                              <button onClick={() => handleUpdateAssignment(a.id, 0)} className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[9px] font-medium hover:bg-indigo-700 uppercase tracking-tighter cursor-pointer">
                                İADE AL
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Mileage Tab */}
                  {activeVehicleTab === 'mileage' && (
                    mileageLogs.map((log) => {
                      const matchedDriver = drivers.find((d: any) => Number(d.id) === Number((log as any).driver_id));
                      return (
                        <div key={log.id} className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors shadow-2xs gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100 shrink-0">
                              <History className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-[11px] font-semibold text-slate-900 tracking-tight">{log.mileage.toLocaleString()} KM</p>
                                <span className="text-[9px] text-slate-500 font-medium uppercase">• {formatDateTR(log.date)}</span>
                                {matchedDriver?.name && (
                                  <span className="text-[9px] text-indigo-600 font-medium">({matchedDriver.name})</span>
                                )}
                              </div>
                              {((log as any).purpose || log.notes) && (
                                <p className="text-[9px] text-slate-600 mt-0.5 truncate">
                                  {(log as any).purpose || log.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          {(log as any).expense_amount > 0 && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0 tabular-nums">
                              {Number((log as any).expense_amount).toLocaleString()} TL
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}

                  {/* Incidents Tab */}
                  {activeVehicleTab === 'incidents' && (
                    incidents.map((inc) => {
                      const incidentLabel = inc.type === 'accident' ? 'Hasar / Kozmetik İşlem' : inc.type === 'breakdown' ? 'Ekspertiz & Servis Kaydı' : inc.type;
                      return (
                        <div key={inc.id} className="p-2.5 bg-white rounded-lg border-l-4 border-red-500 border-y border-r border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors shadow-2xs gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 bg-red-50 text-red-600 rounded-lg flex items-center justify-center border border-red-100 shrink-0">
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold text-slate-900 uppercase tracking-tight truncate">{incidentLabel}</p>
                              <p className="text-[10px] text-slate-600 mt-0.5 line-clamp-2">{inc.description}</p>
                              <p className="text-[9px] text-slate-400 font-medium uppercase mt-0.5">{formatDateTR(inc.date)}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-100 tabular-nums shrink-0">
                            {Number(inc.cost) > 0 ? `${Number(inc.cost).toLocaleString()} TL` : '0 TL (Temiz)'}
                          </span>
                        </div>
                      );
                    })
                  )}

                  {/* Empty State */}
                  {((activeVehicleTab === 'docs' && documents.length === 0) ||
                    (activeVehicleTab === 'maintenance' && maintenance.length === 0) ||
                    (activeVehicleTab === 'assignments' && assignments.length === 0) ||
                    (activeVehicleTab === 'mileage' && mileageLogs.length === 0) ||
                    (activeVehicleTab === 'incidents' && incidents.length === 0)) && (
                    <div className="py-8 text-center bg-white rounded-lg border border-dashed border-slate-200">
                      <Info className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                      <p className="text-[10px] font-medium text-slate-700 uppercase tracking-widest">{isTr ? 'Kayıt Yok' : 'No Records'}</p>
                      <p className="text-[9px] text-slate-400 font-medium uppercase mt-0.5 tracking-tighter">{isTr ? 'Henüz veri girilmemiş.' : 'No data recorded.'}</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

