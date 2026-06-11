import React from 'react';
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
  ExternalLink 
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
  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
    d.email.toLowerCase().includes(driverSearch.toLowerCase()) ||
    d.phone.includes(driverSearch)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder={lang === 'tr' ? 'Sürücü adı, e-posta veya telefon...' : 'Driver name, email or phone...'}
            value={driverSearch}
            onChange={(e) => setDriverSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm"
          />
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
                status: 'active'
              });
              setSelectedDriver(null as any);
              setShowAddDriverModal(true);
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            {lang === 'tr' ? 'Sürücü Ekle' : 'Add Driver'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDrivers.map((driver) => (
          <motion.div
            key={driver.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden group"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{driver.name}</h3>
                    <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      driver.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {driver.status === 'active' ? (lang === 'tr' ? 'Aktif' : 'Active') : (lang === 'tr' ? 'Pasif' : 'Inactive')}
                    </span>
                  </div>
                </div>
                {!isViewer && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setSelectedDriver(driver);
                        setDriverFormData(driver);
                        setShowAddDriverModal(true);
                      }}
                      className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDriver(driver.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {driver.email}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {driver.phone}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{lang === 'tr' ? 'EHLİYET' : 'LICENSE'}</span>
                  <span className="text-sm font-black text-gray-700">{driver.license_class} • {driver.license_number}</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedDriver(driver);
                    fetchDriverDetails(driver);
                    setShowDriverDetailModal(true);
                  }}
                  className="flex items-center gap-2 text-blue-600 text-xs font-black uppercase tracking-tight hover:gap-3 transition-all"
                >
                  {lang === 'tr' ? 'Dosyalar' : 'Files'}
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredDrivers.length === 0 && (
        <div className="bg-gray-50 rounded-3xl p-20 text-center border-2 border-dashed border-gray-200">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <UserCheck className="w-10 h-10 text-gray-200" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {lang === 'tr' ? 'Sürücü Bulunamadı' : 'No Drivers Found'}
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            {lang === 'tr' 
              ? 'Aradığınız kriterlere uygun sürücü bulunamadı veya henüz sürücü eklenmemiş.' 
              : 'No drivers found matching your search or no drivers added yet.'}
          </p>
        </div>
      )}
    </div>
  );
};
