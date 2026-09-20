import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Car, 
  MapPin, 
  AlertCircle, 
  FileText, 
  Wrench, 
  UserCheck, 
  History, 
  AlertTriangle,
  FilePlus,
  Plus,
  Download,
  Calendar,
  Clock,
  Trash2,
  ExternalLink,
  ChevronRight,
  ClipboardList,
  Fuel,
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
import { formatFuelType, formatTransmission } from '../../../utils/formatUtils';

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
  if (!isOpen || !vehicle) return null;
  const isTr = lang === 'tr';

  const sections = [
    { id: 'docs', icon: FileText, label: t.documents || 'Dokümanlar', color: 'blue' },
    { id: 'maintenance', icon: Wrench, label: t.maintenance || 'Bakım Kayıtları', color: 'orange' },
    { id: 'assignments', icon: UserCheck, label: t.history || 'Zimmet & Sürücü', color: 'indigo' },
    { id: 'mileage', icon: History, label: t.mileageLogs || 'KM Geçmişi', color: 'emerald' },
    { id: 'incidents', icon: AlertTriangle, label: t.incidents || 'Hasar & Olaylar', color: 'red' }
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 15 }}
        className="bg-white w-full max-w-6xl h-[92vh] rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col border border-slate-200"
      >
        {/* Compact Header */}
        <div className="px-4 py-2.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-blue-600 text-white px-2.5 py-1 rounded-lg text-xs font-black tracking-wider uppercase flex items-center gap-1.5 shadow-xs shrink-0">
              <Car className="w-3.5 h-3.5" />
              <span>{vehicle.plate}</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-extrabold text-white truncate flex items-center gap-2">
                <span>{generateVehicleTitle(vehicle)}</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${getStatusColor(vehicle.status)}`}>
                  {getStatusText(vehicle.status)}
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {vehicle.selling_price && (
              <div className="hidden sm:flex items-center gap-1 bg-emerald-950/80 text-emerald-400 border border-emerald-800 px-2.5 py-1 rounded-lg text-xs font-black">
                <Tag className="w-3 h-3 text-emerald-400" />
                <span>{vehicle.selling_price.toLocaleString()} {vehicle.currency || 'TRY'}</span>
              </div>
            )}

            {!isViewer && onEditVehicle && (
              <button
                onClick={onEditVehicle}
                className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{isTr ? 'Düzenle' : 'Edit'}</span>
              </button>
            )}

            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Split Layout */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left / Main Dossier Panel (Secere Künyesi) */}
          <div className="w-full lg:w-[350px] bg-slate-50 border-r border-slate-200 flex flex-col overflow-y-auto custom-scrollbar p-3 space-y-2.5 shrink-0">
            {/* Main Photo Thumbnail */}
            <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-slate-200/90 bg-slate-200 shadow-2xs group shrink-0">
              {vehicle.images && vehicle.images.length > 0 ? (
                <img 
                  src={vehicle.images[0]} 
                  alt={vehicle.plate} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center gap-1 text-slate-400">
                  <Car className="w-8 h-8 text-slate-300" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{isTr ? 'Görsel Bulunmuyor' : 'No Image'}</span>
                </div>
              )}
              {vehicle.images && vehicle.images.length > 1 && (
                <span className="absolute bottom-1.5 right-1.5 bg-slate-900/80 text-white text-[9px] font-mono px-1.5 py-0.5 rounded backdrop-blur-xs font-bold">
                  +{vehicle.images.length - 1} Foto
                </span>
              )}
            </div>

            {/* ARAÇ SECERESİ & KÜNYESİ (Micro Bento Grid) */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                <span className="text-[10px] font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  Araç Künyesi & Seceresi
                </span>
                <span className="text-[9px] font-mono font-bold text-slate-400">ID: #{vehicle.id}</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Plaka</span>
                  <span className="font-extrabold text-slate-900 font-mono">{vehicle.plate}</span>
                </div>

                <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Satış Fiyatı</span>
                  <span className="font-extrabold text-emerald-700">
                    {vehicle.selling_price ? `${vehicle.selling_price.toLocaleString()} ${vehicle.currency || 'TRY'}` : 'Belirtilmedi'}
                  </span>
                </div>

                <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Marka / Model</span>
                  <span className="font-extrabold text-slate-800 truncate block">{vehicle.brand} {vehicle.model}</span>
                </div>

                <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Yıl / KM</span>
                  <span className="font-extrabold text-slate-800">{vehicle.year} • {(vehicle.current_mileage || 0).toLocaleString()} KM</span>
                </div>

                <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Yakıt / Vites</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {formatFuelType(vehicle.fuel_type)} • {formatTransmission(vehicle.transmission)}
                  </span>
                </div>

                <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Paket / Renk</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {vehicle.package_name || '-'} {vehicle.color ? `(${vehicle.color})` : ''}
                  </span>
                </div>

                <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Kategori / Kasa</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {vehicle.category || 'Otomobil'} {vehicle.body_type ? `• ${vehicle.body_type}` : ''}
                  </span>
                </div>

                <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Tramer Kaydı</span>
                  <span className="font-extrabold text-slate-900">
                    {vehicle.tramer_amount ? `${vehicle.tramer_amount.toLocaleString()} TL` : '0 TL (Temiz)'}
                  </span>
                </div>

                {vehicle.chassis_number && (
                  <div className="col-span-2 p-1.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Şasi No:</span>
                    <span className="font-mono text-[11px] font-bold text-slate-800">{vehicle.chassis_number}</span>
                  </div>
                )}

                {vehicle.engine_number && (
                  <div className="col-span-2 p-1.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Motor No:</span>
                    <span className="font-mono text-[11px] font-bold text-slate-800">{vehicle.engine_number}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Ekspertiz Özeti */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
              <span className="text-[10px] font-extrabold text-slate-900 uppercase tracking-wider block border-b border-slate-100 pb-1">
                Ekspertiz Özeti
              </span>
              <div className="flex items-center justify-between text-xs font-bold pt-0.5">
                <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                  Orijinal: {paintCounts.original} Parça
                </span>
                <span className="text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">
                  Boyalı: {paintCounts.painted} Parça
                </span>
                <span className="text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded">
                  Değişen: {paintCounts.replaced} Parça
                </span>
              </div>
            </div>

            {/* Descriptions (Pazar Hikayesi & Teknik) */}
            {vehicle.market_story && (
              <div className="bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-100 space-y-1">
                <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider block">PAZAR HİKAYESİ</span>
                <p className="text-xs text-slate-800 leading-snug font-medium line-clamp-3">{vehicle.market_story}</p>
              </div>
            )}

            {vehicle.technical_description && (
              <div className="bg-slate-100/80 p-2.5 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">TEKNİK AÇIKLAMA</span>
                <p className="text-xs text-slate-700 leading-snug font-normal line-clamp-3">{vehicle.technical_description}</p>
              </div>
            )}
          </div>

          {/* Right Sub-Records Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* Tabs Navigation */}
            <div className="px-3 py-1.5 border-b border-slate-200/80 bg-slate-50/80 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
              {sections.map((sec) => {
                const isActive = activeVehicleTab === sec.id;
                const Icon = sec.icon;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveVehicleTab(sec.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all whitespace-nowrap ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{sec.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Sub-Tab Header Bar */}
            <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                {(() => {
                  const s = sections.find(x => x.id === activeVehicleTab);
                  return s ? (
                    <>
                      <s.icon className="w-4 h-4 text-blue-600" />
                      {s.label}
                    </>
                  ) : null;
                })()}
              </span>

              {!isViewer && (
                <button
                  onClick={() => {
                    if (activeVehicleTab === 'docs') onAddDocument();
                    else if (activeVehicleTab === 'maintenance') onAddMaintenance();
                    else if (activeVehicleTab === 'assignments') onAddAssignment();
                    else if (activeVehicleTab === 'mileage') onAddMileage();
                    else if (activeVehicleTab === 'incidents') onAddIncident();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isTr ? 'Yeni Kayıt Ekle' : 'Add Record'}</span>
                </button>
              )}
            </div>

            {/* Tab Items List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 custom-scrollbar bg-slate-50/30">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeVehicleTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-2"
                >
                  {/* Documents Tab */}
                  {activeVehicleTab === 'docs' && (
                    documents.map((doc) => (
                      <div key={doc.id} className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between hover:border-blue-200 transition-all">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs truncate">{doc.type}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              Sona Erme: {new Date(doc.expiry_date).toLocaleDateString(isTr ? 'tr-TR' : 'en-US')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {doc.document_url === "is_virtual_contract" ? (
                            <button
                              onClick={() => {
                                let details: any = {};
                                try {
                                  details = typeof doc.notes === 'string' ? JSON.parse(doc.notes) : doc.notes || {};
                                } catch (e) {
                                  console.error(e);
                                }
                                
                                const cType = details.contractType || 'consignment';
                                const cTitle = cType === 'consignment' ? 'ARAÇ KONSİNYE GİRİŞ VE SATIŞ SÖZLEŞMESİ' : 'ARAÇ REZERVASYON PROTOKOLÜ / KAPORA FORMU';
                                const symbol = vehicle.currency === 'GBP' ? '£' : vehicle.currency === 'USD' ? '$' : vehicle.currency === 'EUR' ? '€' : '₺';
                                const priceFormatted = `${symbol}${(vehicle.selling_price || vehicle.buying_price || 0).toLocaleString()}`;
                                const depositFormatted = details.depositAmount ? `${details.depositAmount} ${symbol}` : '[Kapora Tutarı]';
                                const vehicleDetails = `${vehicle.brand} ${vehicle.model} (${vehicle.year || ''}) • Plaka: ${vehicle.plate || ''} • Şasi: ${vehicle.chassis_number || ''}`;

                                const clientNameVal = details.clientName || '';
                                const clientIdentityVal = details.clientIdentity || '';
                                const clientPhoneVal = details.clientPhone || '';
                                const ipAddressVal = details.ipAddress || '127.0.0.1';
                                const timestampVal = details.contractDate || new Date().toLocaleDateString("tr-TR");

                                const combined = `${clientNameVal}-${clientIdentityVal}-${clientPhoneVal}-${vehicle.id}-security-seal`;
                                let hash = 0;
                                for (let i = 0; i < combined.length; i++) {
                                  const char = combined.charCodeAt(i);
                                  hash = (hash << 5) - hash + char;
                                  hash = hash & hash;
                                }
                                const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, "0");
                                const randomHex = (index: number) => {
                                  let rHash = 0;
                                  const rCombined = `${combined}-${index}`;
                                  for (let i = 0; i < rCombined.length; i++) {
                                    rHash = (rHash << 5) - rHash + rCombined.charCodeAt(i);
                                    rHash = rHash & rHash;
                                  }
                                  return Math.abs(rHash).toString(16).toUpperCase().padStart(8, "0");
                                };
                                const securityCode = `SEC-LP-${hex}-${randomHex(1)}-${randomHex(2)}`;

                                const html = `
                                  <div style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #1e293b; line-height: 1.5;">
                                    <h2 style="font-size: 16px; font-weight: 900; text-align: center; margin-bottom: 20px;">${cTitle}</h2>
                                    <p><strong>Müşteri:</strong> ${clientNameVal} (${clientIdentityVal})</p>
                                    <p><strong>Araç:</strong> ${vehicleDetails}</p>
                                    <p><strong>Fiyat:</strong> ${priceFormatted}</p>
                                    <p><strong>Tarih:</strong> ${timestampVal} • <strong>IP:</strong> ${ipAddressVal}</p>
                                    <p><strong>Mühür Kodu:</strong> ${securityCode}</p>
                                  </div>
                                `;
                                
                                const win = window.open('', '_blank');
                                if (win) {
                                  win.document.write(`<html><head><title>${cTitle}</title></head><body onload="window.print()">${html}</body></html>`);
                                  win.document.close();
                                }
                              }}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-extrabold hover:bg-emerald-100 transition-colors"
                            >
                              Sözleşmeyi Gör ➔
                            </button>
                          ) : doc.document_url ? (
                            <a href={doc.document_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          ) : null}

                          {!isViewer && (
                            <button onClick={() => handleDeleteDocument(doc.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {/* Maintenance Tab */}
                  {activeVehicleTab === 'maintenance' && (
                    maintenance.map((m) => (
                      <div key={m.id} className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center font-extrabold text-xs shrink-0">
                            <Wrench className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{m.type}</p>
                            <p className="text-[10px] text-slate-400">
                              {m.provider_name || 'Servis'} • {new Date(m.date).toLocaleDateString()} • {(m.mileage || 0).toLocaleString()} KM
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-slate-900">{m.cost?.toLocaleString()} TL</span>
                          {!isViewer && (
                            <button onClick={() => handleDeleteMaintenance(m.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {/* Assignments Tab */}
                  {activeVehicleTab === 'assignments' && (
                    assignments.map((a) => (
                      <div key={a.id} className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${a.status === 'active' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                            <UserCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{a.user_email}</p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(a.start_date).toLocaleDateString()} • {a.start_mileage?.toLocaleString()} KM
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${a.status === 'active' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                            {a.status === 'active' ? 'Aktif Zimmet' : 'Tamamlandı'}
                          </span>
                          {a.status === 'active' && !isViewer && (
                            <button onClick={() => handleUpdateAssignment(a.id, 0)} className="px-2 py-1 bg-indigo-600 text-white rounded-md text-[10px] font-bold hover:bg-indigo-700">
                              İade Al
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {/* Mileage Tab */}
                  {activeVehicleTab === 'mileage' && (
                    mileageLogs.map((log) => (
                      <div key={log.id} className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                            <History className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{log.mileage.toLocaleString()} KM</p>
                            <p className="text-[10px] text-slate-400">{new Date(log.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Incidents Tab */}
                  {activeVehicleTab === 'incidents' && (
                    incidents.map((inc) => (
                      <div key={inc.id} className="p-2.5 bg-white rounded-xl border border-red-200 border-l-4 shadow-2xs flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-red-50 text-red-600 rounded-lg flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{inc.type}: {inc.description}</p>
                            <p className="text-[10px] text-slate-400">{new Date(inc.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className="text-xs font-black text-red-600">{inc.cost?.toLocaleString()} TL</span>
                      </div>
                    ))
                  )}

                  {/* Empty State */}
                  {((activeVehicleTab === 'docs' && documents.length === 0) ||
                    (activeVehicleTab === 'maintenance' && maintenance.length === 0) ||
                    (activeVehicleTab === 'assignments' && assignments.length === 0) ||
                    (activeVehicleTab === 'mileage' && mileageLogs.length === 0) ||
                    (activeVehicleTab === 'incidents' && incidents.length === 0)) && (
                    <div className="py-12 text-center bg-white rounded-xl border border-dashed border-slate-200">
                      <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">{isTr ? 'Kayıt Bulunmuyor' : 'No Records Found'}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{isTr ? 'Henüz bu kategoriye ait bir kayıt girilmemiş.' : 'No data recorded yet.'}</p>
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
