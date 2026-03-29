import React, { useState, useEffect } from 'react';
import { 
  Car, 
  Plus, 
  Search, 
  FileText, 
  Wrench, 
  UserCheck, 
  History, 
  AlertTriangle, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Calendar, 
  MapPin, 
  Download, 
  ChevronRight,
  Filter,
  ArrowRight,
  CheckCircle2,
  Clock,
  XCircle,
  Camera,
  FilePlus,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../services/api';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Vehicle {
  id: number;
  store_id: number;
  plate: string;
  brand: string;
  model: string;
  year: number;
  type: 'personal' | 'company';
  chassis_number: string;
  engine_number: string;
  current_mileage: number;
  status: 'active' | 'in_service' | 'broken' | 'sold';
  created_at: string;
  updated_at: string;
  expiring_docs?: number;
  maintenance_due?: number;
}

interface VehicleDocument {
  id: number;
  vehicle_id: number;
  type: string;
  document_url: string;
  expiry_date: string;
  notes: string;
  created_at: string;
}

interface VehicleMaintenance {
  id: number;
  vehicle_id: number;
  type: string;
  date: string;
  mileage: number;
  cost: number;
  currency: string;
  provider_name: string;
  description: string;
  status: 'planned' | 'completed' | 'cancelled';
  next_maintenance_date: string;
  next_maintenance_mileage: number;
}

interface VehicleAssignment {
  id: number;
  vehicle_id: number;
  user_id: number;
  user_email: string;
  start_date: string;
  end_date: string | null;
  start_mileage: number;
  end_mileage: number | null;
  notes: string;
  status: 'active' | 'returned';
}

interface VehicleMileageLog {
  id: number;
  vehicle_id: number;
  date: string;
  mileage: number;
  user_id: number;
  notes: string;
}

interface VehicleIncident {
  id: number;
  vehicle_id: number;
  type: 'accident' | 'breakdown';
  date: string;
  description: string;
  cost: number;
  status: 'open' | 'repaired' | 'totaled';
  report_url: string;
}

interface FleetTabProps {
  storeId: number;
  isViewer?: boolean;
}

const FleetTab: React.FC<FleetTabProps> = ({ storeId, isViewer }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'docs' | 'maintenance' | 'assignments' | 'mileage' | 'incidents'>('info');
  
  // Detail Data
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [maintenance, setMaintenance] = useState<VehicleMaintenance[]>([]);
  const [assignments, setAssignments] = useState<VehicleAssignment[]>([]);
  const [mileageLogs, setMileageLogs] = useState<VehicleMileageLog[]>([]);
  const [incidents, setIncidents] = useState<VehicleIncident[]>([]);

  // Form States
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    plate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    type: 'company',
    chassis_number: '',
    engine_number: '',
    current_mileage: 0,
    status: 'active'
  });

  useEffect(() => {
    fetchVehicles();
  }, [storeId]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await api.getVehicles(storeId);
      setVehicles(res);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicleDetails = async (vehicle: Vehicle) => {
    try {
      const [docs, maint, assign, mileage, inc] = await Promise.all([
        api.getVehicleDocuments(vehicle.id),
        api.getVehicleMaintenance(vehicle.id),
        api.getVehicleAssignments(vehicle.id),
        api.getVehicleMileage(vehicle.id),
        api.getVehicleIncidents(vehicle.id)
      ]);
      setDocuments(docs);
      setMaintenance(maint);
      setAssignments(assign);
      setMileageLogs(mileage);
      setIncidents(inc);
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
    }
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createVehicle({ ...formData, store_id: storeId });
      if (res.error) {
        alert(res.error);
        return;
      }
      setVehicles([...vehicles, res]);
      setShowAddModal(false);
      setFormData({
        plate: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        type: 'company',
        chassis_number: '',
        engine_number: '',
        current_mileage: 0,
        status: 'active'
      });
    } catch (error) {
      alert('Araç eklenirken bir hata oluştu.');
    }
  };

  const handleUpdateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    try {
      const res = await api.updateVehicle(selectedVehicle.id, formData);
      if (res.error) {
        alert(res.error);
        return;
      }
      setVehicles(vehicles.map(v => v.id === selectedVehicle.id ? res : v));
      setShowAddModal(false);
      setSelectedVehicle(null);
    } catch (error) {
      alert('Araç güncellenirken bir hata oluştu.');
    }
  };

  const handleDeleteVehicle = async (id: number) => {
    if (!window.confirm('Bu aracı silmek istediğinize emin misiniz? Tüm kayıtlar silinecektir.')) return;
    try {
      await api.deleteVehicle(id);
      setVehicles(vehicles.filter(v => v.id !== id));
    } catch (error) {
      alert('Araç silinirken bir hata oluştu.');
    }
  };

  const filteredVehicles = vehicles.filter(v => 
    v.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'in_service': return 'bg-blue-100 text-blue-700';
      case 'broken': return 'bg-red-100 text-red-700';
      case 'sold': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'in_service': return 'Serviste';
      case 'broken': return 'Arızalı';
      case 'sold': return 'Satıldı';
      default: return status;
    }
  };

  const exportToExcel = () => {
    const data = vehicles.map(v => ({
      'Plaka': v.plate,
      'Marka': v.brand,
      'Model': v.model,
      'Yıl': v.year,
      'Tip': v.type === 'company' ? 'Şirket' : 'Şahsi',
      'KM': v.current_mileage,
      'Durum': getStatusText(v.status),
      'Şasi No': v.chassis_number,
      'Motor No': v.engine_number
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Filo");
    XLSX.writeFile(wb, `Filo_Raporu_${format(new Date(), 'dd_MM_yyyy')}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Filo Durum Raporu", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [['Plaka', 'Marka', 'Model', 'Yıl', 'Tip', 'KM', 'Durum']],
      body: vehicles.map(v => [
        v.plate,
        v.brand,
        v.model,
        v.year,
        v.type === 'company' ? 'Şirket' : 'Şahsi',
        v.current_mileage,
        getStatusText(v.status)
      ]),
    });
    doc.save(`Filo_Raporu_${format(new Date(), 'dd_MM_yyyy')}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Car className="w-8 h-8 text-blue-600" />
            Filo Yönetimi
          </h2>
          <p className="text-gray-500 text-sm">Araç envanteri, bakım ve evrak takibi</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
          {!isViewer && (
            <button
              onClick={() => {
                setFormData({
                  plate: '',
                  brand: '',
                  model: '',
                  year: new Date().getFullYear(),
                  type: 'company',
                  chassis_number: '',
                  engine_number: '',
                  current_mileage: 0,
                  status: 'active'
                });
                setSelectedVehicle(null);
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Yeni Araç
            </button>
          )}
        </div>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Plaka, marka veya model ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center justify-between">
          <span className="text-blue-700 font-medium">Toplam Araç</span>
          <span className="text-2xl font-bold text-blue-800">{vehicles.length}</span>
        </div>
        <div className="bg-green-50 p-3 rounded-lg border border-green-100 flex items-center justify-between">
          <span className="text-green-700 font-medium">Aktif Araç</span>
          <span className="text-2xl font-bold text-green-800">
            {vehicles.filter(v => v.status === 'active').length}
          </span>
        </div>
        <div className={`p-3 rounded-lg border flex items-center justify-between ${vehicles.some(v => Number(v.expiring_docs) > 0) ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
          <span className={vehicles.some(v => Number(v.expiring_docs) > 0) ? 'text-amber-700 font-medium' : 'text-gray-500 font-medium'}>Evrak Uyarısı</span>
          <span className={`text-2xl font-bold ${vehicles.some(v => Number(v.expiring_docs) > 0) ? 'text-amber-800' : 'text-gray-400'}`}>
            {vehicles.reduce((acc, v) => acc + (Number(v.expiring_docs) || 0), 0)}
          </span>
        </div>
        <div className={`p-3 rounded-lg border flex items-center justify-between ${vehicles.some(v => Number(v.maintenance_due) > 0) ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
          <span className={vehicles.some(v => Number(v.maintenance_due) > 0) ? 'text-red-700 font-medium' : 'text-gray-500 font-medium'}>Bakım Uyarısı</span>
          <span className={`text-2xl font-bold ${vehicles.some(v => Number(v.maintenance_due) > 0) ? 'text-red-800' : 'text-gray-400'}`}>
            {vehicles.reduce((acc, v) => acc + (Number(v.maintenance_due) || 0), 0)}
          </span>
        </div>
      </div>

      {/* Vehicle Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <motion.div
              key={vehicle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Car className="w-7 h-7 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{vehicle.plate}</h3>
                      <p className="text-sm text-gray-500">{vehicle.brand} {vehicle.model}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                    {getStatusText(vehicle.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{vehicle.year}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{vehicle.current_mileage.toLocaleString()} KM</span>
                  </div>
                </div>

                {/* Alerts */}
                {(Number(vehicle.expiring_docs) > 0 || Number(vehicle.maintenance_due) > 0) && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {Number(vehicle.expiring_docs) > 0 && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded text-[10px] font-bold border border-amber-200 uppercase tracking-wider">
                        <FileText className="w-3 h-3" />
                        Evrak ({vehicle.expiring_docs})
                      </div>
                    )}
                    {Number(vehicle.maintenance_due) > 0 && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded text-[10px] font-bold border border-red-200 uppercase tracking-wider animate-pulse">
                        <Wrench className="w-3 h-3" />
                        Bakım ({vehicle.maintenance_due})
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setSelectedVehicle(vehicle);
                      fetchVehicleDetails(vehicle);
                      setActiveDetailTab('info');
                      setShowDetailModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                  >
                    Detayları Gör
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  {!isViewer && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setFormData(vehicle);
                          setSelectedVehicle(vehicle);
                          setShowAddModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-xl font-bold text-gray-800">
                  {selectedVehicle ? 'Aracı Düzenle' : 'Yeni Araç Ekle'}
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                  <MoreVertical className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={selectedVehicle ? handleUpdateVehicle : handleCreateVehicle} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Plaka</label>
                    <input
                      required
                      type="text"
                      value={formData.plate}
                      onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="34 ABC 123"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Araç Tipi</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="company">Şirket Aracı</option>
                      <option value="personal">Şahsi Araç</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Marka</label>
                    <input
                      required
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Örn: Ford"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Model</label>
                    <input
                      required
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Örn: Focus"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Yıl</label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Güncel KM</label>
                    <input
                      type="number"
                      value={formData.current_mileage}
                      onChange={(e) => setFormData({ ...formData, current_mileage: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Şasi No</label>
                    <input
                      type="text"
                      value={formData.chassis_number}
                      onChange={(e) => setFormData({ ...formData, chassis_number: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Motor No</label>
                    <input
                      type="text"
                      value={formData.engine_number}
                      onChange={(e) => setFormData({ ...formData, engine_number: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Durum</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="active">Aktif</option>
                    <option value="in_service">Serviste</option>
                    <option value="broken">Arızalı</option>
                    <option value="sold">Satıldı</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {selectedVehicle ? 'Güncelle' : 'Kaydet'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedVehicle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                    <Car className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedVehicle.plate}</h3>
                    <p className="text-gray-500">{selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.year})</p>
                  </div>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <MoreVertical className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-100 bg-white overflow-x-auto">
                {[
                  { id: 'info', label: 'Genel Bilgiler', icon: Info },
                  { id: 'docs', label: 'Evraklar', icon: FileText },
                  { id: 'maintenance', label: 'Bakım & Onarım', icon: Wrench },
                  { id: 'assignments', label: 'Zimmet Takibi', icon: UserCheck },
                  { id: 'mileage', label: 'KM Geçmişi', icon: History },
                  { id: 'incidents', label: 'Kaza & Arıza', icon: AlertTriangle },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDetailTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                      activeDetailTab === tab.id
                        ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeDetailTab === 'info' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <h4 className="text-lg font-bold text-gray-800 border-b pb-2">Teknik Detaylar</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-400 uppercase font-bold">Şasi Numarası</p>
                          <p className="font-medium text-gray-700">{selectedVehicle.chassis_number || 'Belirtilmemiş'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase font-bold">Motor Numarası</p>
                          <p className="font-medium text-gray-700">{selectedVehicle.engine_number || 'Belirtilmemiş'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase font-bold">Araç Tipi</p>
                          <p className="font-medium text-gray-700">{selectedVehicle.type === 'company' ? 'Şirket Aracı' : 'Şahsi Araç'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase font-bold">Kayıt Tarihi</p>
                          <p className="font-medium text-gray-700">{format(new Date(selectedVehicle.created_at), 'dd MMMM yyyy', { locale: tr })}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <h4 className="text-lg font-bold text-gray-800 border-b pb-2">Hızlı Durum</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                          <p className="text-xs text-blue-600 uppercase font-bold mb-1">Güncel KM</p>
                          <p className="text-2xl font-bold text-blue-800">{selectedVehicle.current_mileage.toLocaleString()} KM</p>
                        </div>
                        <div className={`p-4 rounded-xl border ${getStatusColor(selectedVehicle.status)}`}>
                          <p className="text-xs uppercase font-bold mb-1 opacity-70">Durum</p>
                          <p className="text-2xl font-bold">{getStatusText(selectedVehicle.status)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeDetailTab === 'docs' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-bold text-gray-800">Resmi Evraklar & İzinler</h4>
                      {!isViewer && (
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                          <FilePlus className="w-4 h-4" />
                          Evrak Ekle
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {documents.map((doc) => (
                        <div key={doc.id} className="p-4 border border-gray-200 rounded-xl flex items-center justify-between hover:border-blue-300 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-6 h-6 text-gray-500" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-800">{doc.type}</p>
                              <p className="text-xs text-gray-500">Vade: {format(new Date(doc.expiry_date), 'dd.MM.yyyy')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                              <Download className="w-4 h-4" />
                            </button>
                            {!isViewer && (
                              <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {documents.length === 0 && (
                        <div className="col-span-2 py-12 text-center text-gray-400">
                          Henüz evrak kaydı bulunmuyor.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeDetailTab === 'maintenance' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-bold text-gray-800">Bakım & Onarım Geçmişi</h4>
                      {!isViewer && (
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                          <Plus className="w-4 h-4" />
                          Bakım Kaydı
                        </button>
                      )}
                    </div>
                    <div className="space-y-4">
                      {maintenance.map((m) => (
                        <div key={m.id} className="p-4 border border-gray-200 rounded-xl hover:shadow-sm transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                                <Wrench className="w-6 h-6 text-orange-600" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-800">{m.type}</p>
                                <p className="text-xs text-gray-500">{format(new Date(m.date), 'dd MMMM yyyy', { locale: tr })} - {m.provider_name}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900">{m.cost.toLocaleString()} {m.currency}</p>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                m.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                              }`}>
                                {m.status === 'completed' ? 'Tamamlandı' : 'Planlandı'}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">{m.description}</p>
                          {m.next_maintenance_date && (
                            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-4 text-xs">
                              <div className="flex items-center gap-1 text-blue-600">
                                <Calendar className="w-3 h-3" />
                                Sonraki Bakım: {format(new Date(m.next_maintenance_date), 'dd.MM.yyyy')}
                              </div>
                              {m.next_maintenance_mileage && (
                                <div className="flex items-center gap-1 text-blue-600">
                                  <MapPin className="w-3 h-3" />
                                  Sonraki KM: {m.next_maintenance_mileage.toLocaleString()}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      {maintenance.length === 0 && (
                        <div className="py-12 text-center text-gray-400">
                          Henüz bakım kaydı bulunmuyor.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeDetailTab === 'assignments' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-bold text-gray-800">Zimmet & Kullanıcı Takibi</h4>
                      {!isViewer && (
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                          <UserCheck className="w-4 h-4" />
                          Zimmetle
                        </button>
                      )}
                    </div>
                    <div className="space-y-4">
                      {assignments.map((a) => (
                        <div key={a.id} className="p-4 border border-gray-200 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                              <UserCheck className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-800">{a.user_email}</p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(a.start_date), 'dd.MM.yyyy')} 
                                {a.end_date ? ` - ${format(new Date(a.end_date), 'dd.MM.yyyy')}` : ' (Devam Ediyor)'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {a.status === 'active' ? 'Aktif Zimmet' : 'İade Edildi'}
                            </span>
                          </div>
                        </div>
                      ))}
                      {assignments.length === 0 && (
                        <div className="py-12 text-center text-gray-400">
                          Henüz zimmet kaydı bulunmuyor.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeDetailTab === 'mileage' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-bold text-gray-800">Kilometre Geçmişi</h4>
                      {!isViewer && (
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                          <History className="w-4 h-4" />
                          KM Güncelle
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100"></div>
                      <div className="space-y-6 relative">
                        {mileageLogs.map((log) => (
                          <div key={log.id} className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-white border-2 border-blue-600 rounded-full flex items-center justify-center z-10">
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            </div>
                            <div className="flex-1 p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center">
                              <div>
                                <p className="font-bold text-gray-800">{log.mileage.toLocaleString()} KM</p>
                                <p className="text-xs text-gray-500">{format(new Date(log.date), 'dd MMMM yyyy', { locale: tr })}</p>
                              </div>
                              {log.notes && <p className="text-xs text-gray-400 italic">"{log.notes}"</p>}
                            </div>
                          </div>
                        ))}
                        {mileageLogs.length === 0 && (
                          <div className="py-12 text-center text-gray-400">
                            Henüz KM kaydı bulunmuyor.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeDetailTab === 'incidents' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-bold text-gray-800">Kaza & Arıza Kayıtları</h4>
                      {!isViewer && (
                        <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm">
                          <AlertTriangle className="w-4 h-4" />
                          Olay Kaydı
                        </button>
                      )}
                    </div>
                    <div className="space-y-4">
                      {incidents.map((inc) => (
                        <div key={inc.id} className="p-4 border border-red-100 bg-red-50/30 rounded-xl">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-800">{inc.type === 'accident' ? 'Kaza' : 'Arıza'}</p>
                                <p className="text-xs text-gray-500">{format(new Date(inc.date), 'dd.MM.yyyy')}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                              inc.status === 'open' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'
                            }`}>
                              {inc.status === 'open' ? 'Açık' : 'Onarıldı'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{inc.description}</p>
                          {inc.cost > 0 && (
                            <p className="text-sm font-bold text-red-600 mt-2">Maliyet: {inc.cost.toLocaleString()} TRY</p>
                          )}
                        </div>
                      ))}
                      {incidents.length === 0 && (
                        <div className="py-12 text-center text-gray-400">
                          Henüz olay kaydı bulunmuyor.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FleetTab;
