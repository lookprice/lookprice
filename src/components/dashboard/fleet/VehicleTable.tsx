import React from 'react';
import { motion } from 'motion/react';
import { 
  Car, 
  MapPin, 
  AlertCircle, 
  Eye, 
  Share2, 
  Edit2, 
  Trash2, 
  FileSignature 
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
  return (
    <div className="space-y-4">
      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {paginatedVehicles.map((vehicle) => (
          <div key={vehicle.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <Car className="w-6 h-6" />
                </div>
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
                  className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 hover:bg-blue-100 transition-all flex items-center justify-center active:scale-95"
                  title="İncele"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setShareVehicle(vehicle);
                    setIsShareModalOpen(true);
                  }}
                  className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-all flex items-center justify-center active:scale-95"
                  title="Paylaş"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setAutoContractVehicle(vehicle);
                    setIsAutoContractOpen(true);
                  }}
                  className="p-2.5 bg-violet-50 text-violet-600 rounded-xl border border-violet-100 hover:bg-violet-100 transition-all flex items-center justify-center active:scale-95"
                  title="Sözleşme Oluştur"
                >
                  <FileSignature className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
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
                  className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 hover:bg-amber-100 transition-all flex items-center justify-center active:scale-95"
                  title="Düzenle"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteVehicle(vehicle.id)}
                  className="p-2.5 bg-red-50 text-red-600 rounded-xl border border-red-100 hover:bg-red-100 transition-all flex items-center justify-center active:scale-95"
                  title="Sil"
                >
                  <Trash2 className="w-4 h-4" />
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
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Car className="w-6 h-6" />
                      </div>
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
    </div>
  );
};
