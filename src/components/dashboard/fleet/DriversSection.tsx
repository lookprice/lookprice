import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  UserCheck, 
  Search, 
  Plus, 
  User, 
  Mail, 
  Phone, 
  Edit2, 
  Trash2, 
  ExternalLink,
  CreditCard,
  Droplet,
  MapPin,
  LayoutGrid,
  List
} from 'lucide-react';
import { Driver } from '../../../types';

interface DriversSectionProps {
  drivers: Driver[];
  driverSearch: string;
  setDriverSearch: (val: string) => void;
  lang: string;
  t: any;
  isViewer: boolean;
  setShowAddDriverModal: (val: boolean) => void;
  setSelectedDriver: (driver: Driver) => void;
  setDriverFormData: (data: any) => void;
  fetchDriverDetails: (driver: Driver) => void;
  setShowDriverDetailModal: (val: boolean) => void;
  handleDeleteDriver: (id: number) => void;
}

export const DriversSection: React.FC<DriversSectionProps> = ({
  drivers,
  driverSearch,
  setDriverSearch,
  lang,
  t,
  isViewer,
  setShowAddDriverModal,
  setSelectedDriver,
  setDriverFormData,
  fetchDriverDetails,
  setShowDriverDetailModal,
  handleDeleteDriver
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const isTr = lang === 'tr';

  const filteredDrivers = drivers.filter(d => 
    (d.name || '').toLowerCase().includes(driverSearch.toLowerCase()) ||
    (d.email || '').toLowerCase().includes(driverSearch.toLowerCase()) ||
    (d.phone || '').includes(driverSearch) ||
    (d.license_number || '').toLowerCase().includes(driverSearch.toLowerCase()) ||
    (d.national_id || '').includes(driverSearch)
  );

  return (
    <div className="space-y-4 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder={isTr ? 'Sürücü adı, telefon, e-posta, T.C. veya ehliyet no ara...' : 'Search driver name, phone, email, ID or license...'}
            value={driverSearch}
            onChange={(e) => setDriverSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all text-xs sm:text-sm font-normal text-slate-800"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/70">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-normal transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title={isTr ? 'Liste Görünümü' : 'List View'}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isTr ? 'Liste' : 'List'}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-normal transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title={isTr ? 'Kart Görünümü' : 'Card View'}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isTr ? 'Kart' : 'Cards'}</span>
            </button>
          </div>

          {!isViewer && (
            <button
              onClick={() => {
                setDriverFormData({
                  name: '',
                  license_number: '',
                  license_class: '',
                  blood_type: '',
                  phone: '',
                  email: '',
                  address: '',
                  national_id: '',
                  status: 'active'
                });
                setSelectedDriver(null as any);
                setShowAddDriverModal(true);
              }}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl font-normal text-xs sm:text-sm hover:bg-blue-700 transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {isTr ? 'Sürücü Ekle' : 'Add Driver'}
            </button>
          )}
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[780px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-normal text-slate-500">
                  <th className="px-4 py-3 font-normal">{isTr ? 'Sürücü Adı Soyadı' : 'Driver Name'}</th>
                  <th className="px-4 py-3 font-normal">{isTr ? 'Durum' : 'Status'}</th>
                  <th className="px-4 py-3 font-normal">{isTr ? 'Telefon & E-posta' : 'Phone & Email'}</th>
                  <th className="px-4 py-3 font-normal">{isTr ? 'T.C. / Kimlik No' : 'National ID'}</th>
                  <th className="px-4 py-3 font-normal">{isTr ? 'Ehliyet Sınıfı & No' : 'License Class & No'}</th>
                  <th className="px-4 py-3 font-normal text-center">{isTr ? 'Kan Grubu' : 'Blood Type'}</th>
                  <th className="px-4 py-3 font-normal text-right">{isTr ? 'İşlemler' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-normal">
                {filteredDrivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-normal text-slate-900 truncate">
                            {driver.name || '-'}
                          </div>
                          {driver.address && (
                            <div className="text-xs font-normal text-slate-500 truncate max-w-[240px] flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{driver.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-normal border ${
                        driver.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {driver.status === 'active' ? (isTr ? 'Aktif' : 'Active') : (isTr ? 'Pasif' : 'Inactive')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {driver.phone ? (
                          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-700 font-normal">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{driver.phone}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                        {driver.email && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-normal truncate max-w-[220px]">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{driver.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {driver.national_id ? (
                        <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-mono font-normal text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                          {driver.national_id}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {(driver.license_class || driver.license_number) ? (
                        <div className="flex items-center gap-1.5">
                          {driver.license_class && (
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-xs font-normal">
                              {driver.license_class}
                            </span>
                          )}
                          {driver.license_number && (
                            <span className="text-xs sm:text-sm text-slate-700 font-normal font-mono">
                              {driver.license_number}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {driver.blood_type ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-xs font-normal">
                          <Droplet className="w-3 h-3 text-rose-500" />
                          {driver.blood_type}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedDriver(driver);
                            fetchDriverDetails(driver);
                            setShowDriverDetailModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-200 transition-colors cursor-pointer"
                          title={isTr ? 'Detaylar' : 'Details'}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        {!isViewer && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedDriver(driver);
                                setDriverFormData(driver);
                                setShowAddDriverModal(true);
                              }}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg border border-transparent hover:border-amber-200 transition-colors cursor-pointer"
                              title={isTr ? 'Düzenle' : 'Edit'}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDriver(driver.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                              title={isTr ? 'Sil' : 'Delete'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDrivers.map((driver) => (
            <motion.div
              key={driver.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all overflow-hidden group p-4 flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2.5 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all border border-blue-100 shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-normal font-sans text-slate-900 text-sm sm:text-base truncate leading-snug">
                        {driver.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-normal border ${
                          driver.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {driver.status === 'active' ? (isTr ? 'Aktif' : 'Active') : (isTr ? 'Pasif' : 'Inactive')}
                        </span>
                        {driver.blood_type && (
                          <span className="px-2 py-0.5 rounded-md text-xs font-normal bg-rose-50 text-rose-700 border border-rose-200">
                            {driver.blood_type}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {!isViewer && (
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedDriver(driver);
                          setDriverFormData(driver);
                          setShowAddDriverModal(true);
                        }}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        title={isTr ? 'Düzenle' : 'Edit'}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDriver(driver.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title={isTr ? 'Sil' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 mb-3 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 font-normal">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{driver.phone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 font-normal truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{driver.email || '-'}</span>
                  </div>
                  {driver.national_id && (
                    <div className="text-xs font-normal text-slate-600 font-mono bg-white px-2.5 py-1 rounded-lg border border-slate-200 mt-1 inline-block">
                      T.C. / ID: {driver.national_id}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[11px] font-normal text-slate-400">{isTr ? 'Ehliyet Bilgisi' : 'License'}</span>
                  <span className="text-xs sm:text-sm font-normal text-slate-800 mt-0.5">
                    {[driver.license_class, driver.license_number].filter(Boolean).join(' • ') || '-'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedDriver(driver);
                    fetchDriverDetails(driver);
                    setShowDriverDetailModal(true);
                  }}
                  className="px-3 py-1.5 text-xs font-normal text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  title={isTr ? 'Detaylar' : 'Details'}
                >
                  <span>{isTr ? 'Detay' : 'Details'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {filteredDrivers.length === 0 && (
        <div className="bg-slate-50 rounded-2xl p-8 text-center border border-dashed border-slate-200">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
            <UserCheck className="w-5 h-5 text-slate-300" />
          </div>
          <h3 className="text-sm font-normal font-sans text-slate-800 mb-1">
            {isTr ? 'Sürücü Bulunamadı' : 'No Drivers Found'}
          </h3>
          <p className="text-xs text-slate-500 font-normal max-w-sm mx-auto leading-relaxed">
            {isTr 
              ? 'Aradığınız kriterlere uygun sürücü kaydı bulunamadı.' 
              : 'No driver records found matching your search.'}
          </p>
        </div>
      )}
    </div>
  );
};

