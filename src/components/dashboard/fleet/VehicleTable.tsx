import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Car, 
  MapPin, 
  AlertCircle, 
  Eye, 
  Share2, 
  Edit2, 
  Trash2, 
  FileSignature,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { Vehicle, Driver, VehicleDocument, VehicleAssignment, VehicleMaintenance } from '../../../types';

interface VehicleTableProps {
  vehicles: Vehicle[];
  paginatedVehicles: Vehicle[];
  t: any;
  lang: string;
  allDocuments: VehicleDocument[];
  allAssignments: VehicleAssignment[];
  drivers: Driver[];
  allDriverDocuments: any[];
  allMaintenance: VehicleMaintenance[];
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  generateVehicleTitle: (vehicle: Vehicle) => string;
  setSelectedVehicle: (vehicle: Vehicle) => void;
  fetchVehicleDetails: (vehicle: Vehicle) => void;
  setShowDetailModal: (val: boolean) => void;
  setShareVehicle: (vehicle: Vehicle) => void;
  setIsShareModalOpen: (val: boolean) => void;
  setFormData: (val: any) => void;
  setShowAddModal: (val: boolean) => void;
  handleDeleteVehicle: (id: number) => void;
  setAutoContractVehicle: (vehicle: Vehicle) => void;
  setIsAutoContractOpen: (val: boolean) => void;
}

export const VehicleTable: React.FC<VehicleTableProps> = ({
  vehicles,
  paginatedVehicles,
  t,
  lang,
  allDocuments,
  allAssignments,
  drivers,
  allDriverDocuments,
  allMaintenance,
  getStatusColor,
  getStatusText,
  generateVehicleTitle,
  setSelectedVehicle,
  fetchVehicleDetails,
  setShowDetailModal,
  setShareVehicle,
  setIsShareModalOpen,
  setFormData,
  setShowAddModal,
  handleDeleteVehicle,
  setAutoContractVehicle,
  setIsAutoContractOpen,
}) => {
  const [activePreviewImages, setActivePreviewImages] = useState<string[]>([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState<number>(0);
  const [previewVehiclePlate, setPreviewVehiclePlate] = useState<string>('');

  const getVehicleImagesList = (vehicle: Vehicle): string[] => {
    if (!vehicle.images) return [];
    try {
      const imgs = typeof vehicle.images === 'string' ? JSON.parse(vehicle.images) : vehicle.images;
      if (Array.isArray(imgs)) {
        return imgs.filter((img): img is string => typeof img === 'string' && img.trim() !== '');
      }
    } catch (e) {
      // fallback handled below
    }
    const rawImages = vehicle.images as any;
    if (typeof rawImages === 'string' && rawImages.startsWith('http')) {
      return [rawImages];
    }
    return [];
  };

  const getThumbnailUrl = (vehicle: Vehicle): string | null => {
    const list = getVehicleImagesList(vehicle);
    return list.length > 0 ? list[0] : null;
  };

  const openPreview = (vehicle: Vehicle) => {
    const imgs = getVehicleImagesList(vehicle);
    if (imgs.length > 0) {
      setActivePreviewImages(imgs);
      setActivePreviewIndex(0);
      setPreviewVehiclePlate(vehicle.plate);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {paginatedVehicles.map((vehicle) => (
          <div key={vehicle.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const thumb = getThumbnailUrl(vehicle);
                  if (thumb) {
                    return (
                      <div 
                        onClick={() => openPreview(vehicle)}
                        className="w-12 h-12 rounded-xl overflow-hidden relative group cursor-pointer border border-gray-100 shadow-sm shrink-0 active:scale-95 transition-all"
                        title={lang === 'tr' ? "Görseli Büyüt" : "Expand Image"}
                      >
                        <img src={thumb} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt={vehicle.plate} />
                        <div className="absolute inset-0 bg-black/25 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Maximize2 className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                      <Car className="w-6 h-6" />
                    </div>
                  );
                })()}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-gray-900 text-lg">{vehicle.plate}</p>
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold">#{vehicle.id}</span>
                    <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded">
                      <div className={`w-1.5 h-1.5 rounded-full ${vehicle.is_on_enrakipsiz ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]' : 'bg-gray-300'}`} />
                      <span className={`text-[9px] font-black uppercase tracking-wider ${vehicle.is_on_enrakipsiz ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {vehicle.is_on_enrakipsiz ? 'enrakipsiz: aktif' : 'enrakipsiz: pasif'}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 font-medium">{generateVehicleTitle(vehicle)}</p>
                </div>
              </div>
              <div className="flex flex-col gap-1 items-end">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(vehicle.status)}`}>
                  {getStatusText(vehicle.status)}
                </span>
                {vehicle.status === 'for_sale' && vehicle.selling_price && (
                  <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                    {vehicle.selling_price.toLocaleString()} {vehicle.currency}
                  </span>
                )}
              </div>
            </div>
            
            <div className="py-2.5 border-y border-gray-50 flex flex-wrap gap-1 items-center justify-between">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t.alerts}:</span>
              <div className="flex flex-wrap gap-1 justify-end">
                {allDocuments
                  .filter(d => d.vehicle_id === vehicle.id && d.type !== 'Ruhsat-Koçan' && new Date(d.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
                  .map((d, idx) => (
                    <div key={idx} className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[10px] font-bold border border-amber-100">
                      {d.type}
                    </div>
                  ))
                }
                {(vehicle.maintenance_due || 0) > 0 && (vehicle.current_mileage || 0) >= (vehicle.maintenance_due || 0) && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 rounded-md text-[10px] font-bold border border-red-100">
                    {t.service}
                  </div>
                )}
                {(() => {
                  const activeAssignment = (allAssignments || []).find(a => a.vehicle_id === vehicle.id && a.status === 'active');
                  if (activeAssignment && activeAssignment.driver_id) {
                    const driver = (drivers || []).find(d => d.id === activeAssignment.driver_id);
                    if (driver && (driver.expiring_docs || 0) > 0) {
                      return (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-600 rounded-md text-[10px] font-bold border border-orange-100">
                          {t.driverDoc} ({driver.expiring_docs})
                        </div>
                      );
                    }
                  }
                  return null;
                })()}
                {((vehicle.maintenance_due || 0) > 0 || (vehicle.current_mileage && (allMaintenance || []).find(m => m.vehicle_id === vehicle.id && m.next_maintenance_mileage && vehicle.current_mileage >= m.next_maintenance_mileage - 1000))) && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 rounded-md text-[10px] font-bold border border-red-100">
                    {t.maintenance}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1 text-sm font-bold text-gray-700">
                <MapPin className="w-4 h-4 text-gray-400" />
                {(vehicle.current_mileage || 0).toLocaleString()} <span className="text-[10px] text-gray-400 font-medium">KM</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedVehicle(vehicle);
                    fetchVehicleDetails(vehicle);
                    setShowDetailModal(true);
                  }}
                  className="p-4 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 hover:bg-blue-100 transition-all flex items-center justify-center active:scale-95"
                  title="İncele"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setShareVehicle(vehicle);
                    setIsShareModalOpen(true);
                  }}
                  className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 hover:bg-indigo-100 transition-all flex items-center justify-center active:scale-95"
                  title="Paylaş"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setAutoContractVehicle(vehicle);
                    setIsAutoContractOpen(true);
                  }}
                  className="p-4 bg-violet-50 text-violet-600 rounded-2xl border border-violet-100 hover:bg-violet-100 transition-all flex items-center justify-center active:scale-95"
                  title="Sözleşme Oluştur"
                >
                  <FileSignature className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setSelectedVehicle(vehicle);
                    setFormData({
                      plate: vehicle.plate,
                      brand: vehicle.brand,
                      model: vehicle.model,
                      year: vehicle.year,
                      type: vehicle.type,
                      chassis_number: vehicle.chassis_number,
                      engine_number: vehicle.engine_number,
                      current_mileage: vehicle.current_mileage,
                      status: vehicle.status,
                      selling_price: vehicle.selling_price,
                      currency: vehicle.currency || 'TRY',
                      package_name: vehicle.package_name || '',
                      transmission: vehicle.transmission || 'manual',
                      fuel_type: vehicle.fuel_type || 'gasoline',
                      color: vehicle.color || '',
                      body_type: vehicle.body_type || '',
                      paint_report: typeof vehicle.paint_report === 'string' ? vehicle.paint_report : JSON.stringify(vehicle.paint_report || {}),
                      tramer_amount: vehicle.tramer_amount || 0,
                      tramer_currency: vehicle.tramer_currency || 'TRY',
                      buying_price: vehicle.buying_price || 0,
                      buying_currency: vehicle.buying_currency || 'TRY',
                      expenses: typeof vehicle.expenses === 'string' ? vehicle.expenses : JSON.stringify(vehicle.expenses || []),
                      target_profit_margin: vehicle.target_profit_margin || 0,
                      description: vehicle.description || '',
                      images: vehicle.images || [],
                      virtual_tour_url: vehicle.virtual_tour_url || '',
                      ai_tour_enabled: !!vehicle.ai_tour_enabled,
                      is_on_enrakipsiz: !!vehicle.is_on_enrakipsiz,
                      market_story: vehicle.market_story || '',
                      technical_description: vehicle.technical_description || '',
                      is_trade_in_available: !!vehicle.is_trade_in_available
                    });
                    setShowAddModal(true);
                  }}
                  className="p-4 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 hover:bg-amber-100 transition-all flex items-center justify-center active:scale-95"
                  title="Düzenle"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDeleteVehicle(vehicle.id)}
                  className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 hover:bg-red-100 transition-all flex items-center justify-center active:scale-95"
                  title="Sil"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Portföy No</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t.vehicleInfo}</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t.status}</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Enrakipsiz</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">KM</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t.alerts}</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4 text-sm font-bold text-gray-900">
                    #{vehicle.id}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const thumb = getThumbnailUrl(vehicle);
                        if (thumb) {
                          return (
                            <div 
                              onClick={() => openPreview(vehicle)}
                              className="w-10 h-10 rounded-lg overflow-hidden relative group cursor-pointer border border-gray-100 shadow-sm shrink-0 active:scale-95 transition-all"
                              title={lang === 'tr' ? "Görseli Büyüt" : "Expand Image"}
                            >
                              <img src={thumb} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt={vehicle.plate} />
                              <div className="absolute inset-0 bg-black/25 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Maximize2 className="w-3.5 h-3.5 text-white" />
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                            <Car className="w-6 h-6" />
                          </div>
                        );
                      })()}
                      <div>
                        <p className="font-bold text-gray-900">{vehicle.plate}</p>
                        <p className="text-xs text-gray-500">{generateVehicleTitle(vehicle)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(vehicle.status)}`}>
                        {getStatusText(vehicle.status)}
                      </span>
                      {vehicle.status === 'for_sale' && vehicle.selling_price && (
                        <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                          {vehicle.selling_price.toLocaleString()} {vehicle.currency}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${vehicle.is_on_enrakipsiz ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-300'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-wider ${vehicle.is_on_enrakipsiz ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {vehicle.is_on_enrakipsiz ? (lang === 'tr' ? 'Aktif' : 'Active') : (lang === 'tr' ? 'Pasif' : 'Passive')}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {(vehicle.current_mileage || 0).toLocaleString()}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {allDocuments
                        .filter(d => d.vehicle_id === vehicle.id && d.type !== 'Ruhsat-Koçan' && new Date(d.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
                        .map((d, idx) => (
                          <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 rounded-md text-[10px] font-bold border border-amber-100">
                            <AlertCircle className="w-3 h-3" />
                            {d.type}
                          </div>
                        ))
                      }
                      {(() => {
                        const activeAssignment = (allAssignments || []).find(a => a.vehicle_id === vehicle.id && a.status === 'active');
                        if (activeAssignment && activeAssignment.driver_id) {
                          const driver = (drivers || []).find(d => d.id === activeAssignment.driver_id);
                          if (driver) {
                            return allDriverDocuments
                              .filter(d => d.driver_id === driver.id && new Date(d.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
                              .map((d, idx) => (
                                <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-600 rounded-md text-[10px] font-bold border border-orange-100">
                                  <AlertCircle className="w-3 h-3" />
                                  {driver.name} {d.type}
                                </div>
                              ));
                          }
                        }
                        return null;
                      })()}
                      {(vehicle.maintenance_due || 0) > 0 && (vehicle.current_mileage || 0) >= (vehicle.maintenance_due || 0) && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded-md text-[10px] font-bold border border-red-100">
                          <AlertCircle className="w-3 h-3" />
                          {t.service}
                        </div>
                      )}
                      {!(vehicle.expiring_docs || 0) && !(vehicle.maintenance_due || 0) && (
                        <span className="text-[10px] text-green-500 font-bold">{t.noProblem}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 items-center">
                      <button
                        onClick={() => {
                          setAutoContractVehicle(vehicle);
                          setIsAutoContractOpen(true);
                        }}
                        className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Sözleşme Oluştur"
                      >
                        <FileSignature className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedVehicle(vehicle);
                          fetchVehicleDetails(vehicle);
                          setShowDetailModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                        title="İncele"
                      >
                        <Eye className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => {
                          setShareVehicle(vehicle);
                          setIsShareModalOpen(true);
                        }}
                        className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                        title="Paylaş"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedVehicle(vehicle);
                          setFormData({
                            plate: vehicle.plate,
                            brand: vehicle.brand,
                            model: vehicle.model,
                            year: vehicle.year,
                            type: vehicle.type,
                            chassis_number: vehicle.chassis_number,
                            engine_number: vehicle.engine_number,
                            current_mileage: vehicle.current_mileage,
                            status: vehicle.status,
                            selling_price: vehicle.selling_price,
                            currency: vehicle.currency || 'TRY',
                            package_name: vehicle.package_name || '',
                            transmission: vehicle.transmission || 'manual',
                            fuel_type: vehicle.fuel_type || 'gasoline',
                            color: vehicle.color || '',
                            body_type: vehicle.body_type || '',
                            paint_report: typeof vehicle.paint_report === 'string' ? vehicle.paint_report : JSON.stringify(vehicle.paint_report || {}),
                            tramer_amount: vehicle.tramer_amount || 0,
                            tramer_currency: vehicle.tramer_currency || 'TRY',
                            buying_price: vehicle.buying_price || 0,
                            buying_currency: vehicle.buying_currency || 'TRY',
                            expenses: typeof vehicle.expenses === 'string' ? vehicle.expenses : JSON.stringify(vehicle.expenses || []),
                            target_profit_margin: vehicle.target_profit_margin || 0,
                            description: vehicle.description || '',
                            images: vehicle.images || [],
                            virtual_tour_url: vehicle.virtual_tour_url || '',
                            ai_tour_enabled: !!vehicle.ai_tour_enabled,
                            is_on_enrakipsiz: !!vehicle.is_on_enrakipsiz,
                            market_story: vehicle.market_story || '',
                            technical_description: vehicle.technical_description || '',
                            is_trade_in_available: !!vehicle.is_trade_in_available
                          });
                          setShowAddModal(true);
                        }}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Düzenle"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Image Gallery / Preview Modal */}
      <AnimatePresence>
        {activePreviewImages.length > 0 && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop with elegant frosted glass */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePreviewImages([])}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl relative z-10 w-full max-w-2xl overflow-hidden flex flex-col text-white"
            >
              {/* Header inside modal */}
              <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-sm font-black tracking-wider uppercase text-slate-300">
                    {previewVehiclePlate} - {lang === 'tr' ? 'Araç Görseli' : 'Vehicle Image'}
                  </span>
                </div>
                <button
                  onClick={() => setActivePreviewImages([])}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Image View */}
              <div className="relative flex-1 flex items-center justify-center min-h-[300px] max-h-[500px] bg-slate-950 p-6">
                <img
                  src={activePreviewImages[activePreviewIndex]}
                  alt="Vehicle Preview"
                  className="max-h-[380px] w-auto max-w-full object-contain rounded-xl shadow-lg border border-slate-850"
                  referrerPolicy="no-referrer"
                />

                {/* Left/Right Navigation Arrows if there are multiple images */}
                {activePreviewImages.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePreviewIndex((prev) => (prev === 0 ? activePreviewImages.length - 1 : prev - 1));
                      }}
                      className="absolute left-4 p-2.5 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 rounded-full text-white transition-all shadow-md active:scale-90"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePreviewIndex((prev) => (prev === activePreviewImages.length - 1 ? 0 : prev + 1));
                      }}
                      className="absolute right-4 p-2.5 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 rounded-full text-white transition-all shadow-md active:scale-90"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>

              {/* Footer Indicator / Image Strips */}
              <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                <div className="font-mono bg-slate-950 px-2.5 py-1 rounded-lg">
                  {activePreviewIndex + 1} / {activePreviewImages.length}
                </div>
                
                {/* Thumbnails list to jump to specific image */}
                {activePreviewImages.length > 1 && (
                  <div className="flex gap-1.5 overflow-x-auto max-w-[280px] sm:max-w-[350px] no-scrollbar py-0.5">
                    {activePreviewImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActivePreviewIndex(idx)}
                        className={`w-9 h-9 rounded-md overflow-hidden border transition-all duration-150 shrink-0 ${
                          idx === activePreviewIndex
                            ? 'border-blue-500 ring-2 ring-blue-500/20 opacity-100 scale-105'
                            : 'border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                )}
                
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">
                  {lang === 'tr' ? 'Seçkin Otomotiv' : 'Premium Automotive'}
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
