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
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder={lang === 'tr' ? 'Sürücü ara...' : 'Search drivers...'}
            value={driverSearch}
            onChange={(e) => setDriverSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-all text-xs font-bold shadow-sm"
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
                national_id: '',
                status: 'active'
              });
              setSelectedDriver(null as any);
              setShowAddDriverModal(true);
            }}
            className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            {lang === 'tr' ? 'Sürücü Ekle' : 'Add Driver'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
        {filteredDrivers.map((driver) => (
          <motion.div
            key={driver.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg border border-slate-200 hover:shadow-sm hover:border-blue-300 transition-all overflow-hidden group"
          >
            <div className="p-2.5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 bg-slate-50 rounded flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all border border-slate-100 shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-slate-900 text-[10px] truncate uppercase tracking-tighter leading-tight">{driver.name}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={`px-1 rounded-sm text-[6px] font-black uppercase tracking-widest border ${
                        driver.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        {driver.status === 'active' ? (lang === 'tr' ? 'Aktif' : 'Active') : (lang === 'tr' ? 'Pasif' : 'Inactive')}
                      </span>
                    </div>
                  </div>
                </div>
                {!isViewer && (
                  <div className="flex gap-0.5 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedDriver(driver);
                        setDriverFormData(driver);
                        setShowAddDriverModal(true);
                      }}
                      className="p-1 text-amber-500 hover:bg-amber-50 rounded transition-colors"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteDriver(driver.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-0.5 mb-2">
                <div className="flex items-center gap-1.5 text-[8px] text-slate-500 font-bold truncate">
                  <Mail className="w-2.5 h-2.5 text-slate-400" />
                  {driver.email}
                </div>
                <div className="flex items-center gap-1.5 text-[8px] text-slate-500 font-bold">
                  <Phone className="w-2.5 h-2.5 text-slate-400" />
                  {driver.phone}
                </div>
                {driver.national_id && (
                  <div className="text-[7px] font-black text-slate-400 font-mono tracking-tighter bg-slate-50 px-1 py-0.5 rounded border border-slate-100 mt-1 inline-block">
                    ID: {driver.national_id}
                  </div>
                )}
              </div>

              <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[6px] font-black text-slate-400 uppercase tracking-widest leading-none">LİSANS</span>
                  <span className="text-[8px] font-black text-slate-700 uppercase tracking-tighter mt-0.5">{driver.license_class} • {driver.license_number}</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedDriver(driver);
                    fetchDriverDetails(driver);
                    setShowDriverDetailModal(true);
                  }}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title={lang === 'tr' ? 'Detaylar' : 'Details'}
                >
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>


      {filteredDrivers.length === 0 && (
        <div className="bg-slate-50 rounded-2xl p-8 text-center border border-dashed border-slate-200">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
            <UserCheck className="w-5 h-5 text-slate-300" />
          </div>
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">
            {lang === 'tr' ? 'Sürücü Bulunamadı' : 'No Drivers Found'}
          </h3>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight max-w-sm mx-auto leading-relaxed">
            {lang === 'tr' 
              ? 'Aradığınız kriterlere uygun kayıt bulunamadı.' 
              : 'No records found matching your search.'}
          </p>
        </div>
      )}
    </div>
  );
};
