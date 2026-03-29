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
  AlertCircle,
  Eye,
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
  X,
  Camera,
  FilePlus,
  Info,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../services/api';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { translations } from '../../translations';
import { useLanguage } from '../../contexts/LanguageContext';

interface Driver {
  id: number;
  store_id: number;
  name: string;
  license_number: string;
  license_class: string;
  blood_type: string;
  phone: string;
  email: string;
  address: string;
  status: 'active' | 'inactive';
  created_at: string;
}

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
  invoice_url: string | null;
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
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<'vehicles' | 'documents' | 'maintenance' | 'assignments' | 'mileage' | 'incidents'>('vehicles');
  const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'docs' | 'maintenance' | 'assignments' | 'mileage' | 'incidents'>('info');
  
  // All Fleet Data (for main tabs)
  const [allDocuments, setAllDocuments] = useState<any[]>([]);
  const [allMaintenance, setAllMaintenance] = useState<any[]>([]);
  const [allAssignments, setAllAssignments] = useState<any[]>([]);
  const [allMileage, setAllMileage] = useState<any[]>([]);
  const [allIncidents, setAllIncidents] = useState<any[]>([]);

  // Detail Data
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [maintenance, setMaintenance] = useState<VehicleMaintenance[]>([]);
  const [assignments, setAssignments] = useState<VehicleAssignment[]>([]);
  const [mileageLogs, setMileageLogs] = useState<VehicleMileageLog[]>([]);
  const [incidents, setIncidents] = useState<VehicleIncident[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // Action Modal States
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showMileageModal, setShowMileageModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);

  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editingDocument, setEditingDocument] = useState<VehicleDocument | null>(null);
  const [editingMaintenance, setEditingMaintenance] = useState<VehicleMaintenance | null>(null);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [driverFile, setDriverFile] = useState<File | null>(null);

  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const safeFormatDate = (dateString: string | Date | null | undefined, formatStr = 'dd.MM.yyyy', options?: any) => {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '-';
      return format(d, formatStr, options);
    } catch (e) {
      return '-';
    }
  };

  const [documentFormData, setDocumentFormData] = useState<any>({ type: 'registration', status: 'valid' });
  const [maintenanceFormData, setMaintenanceFormData] = useState<Partial<VehicleMaintenance>>({ type: 'routine', status: 'planned' } as any);
  const [assignmentFormData, setAssignmentFormData] = useState<Partial<VehicleAssignment>>({ status: 'active' } as any);
  const [mileageFormData, setMileageFormData] = useState<Partial<VehicleMileageLog>>({});
  const [incidentFormData, setIncidentFormData] = useState<Partial<VehicleIncident>>({ type: 'accident', status: 'open' });
  const [driverFormData, setDriverFormData] = useState<Partial<Driver>>({ status: 'active' });

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
    fetchAllFleetData();
    fetchDrivers();
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

  const fetchDrivers = async () => {
    try {
      const res = await api.getDrivers(storeId);
      setDrivers(res);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const fetchAllFleetData = async () => {
    try {
      const [docs, maint, assign, mileage, inc] = await Promise.all([
        api.getAllFleetDocuments(storeId),
        api.getAllFleetMaintenance(storeId),
        api.getAllFleetAssignments(storeId),
        api.getAllFleetMileage(storeId),
        api.getAllFleetIncidents(storeId)
      ]);
      setAllDocuments(docs);
      setAllMaintenance(maint);
      setAllAssignments(assign);
      setAllMileage(mileage);
      setAllIncidents(inc);
    } catch (error) {
      console.error('Error fetching all fleet data:', error);
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
      setDocuments(Array.isArray(docs) ? docs : []);
      setMaintenance(Array.isArray(maint) ? maint : []);
      setAssignments(Array.isArray(assign) ? assign : []);
      setMileageLogs(Array.isArray(mileage) ? mileage : []);
      setIncidents(Array.isArray(inc) ? inc : []);
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
      alert(t.errorOccurred);
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
      alert(t.errorOccurred);
    }
  };

  const handleDeleteVehicle = async (id: number) => {
    if (!window.confirm('Bu aracı silmek istediğinize emin misiniz? Tüm kayıtlar silinecektir.')) return;
    try {
      await api.deleteVehicle(id);
      setVehicles(vehicles.filter(v => v.id !== id));
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    try {
      let document_url = documentFormData.document_url || '';
      
      if (documentFile) {
        const formData = new FormData();
        formData.append('file', documentFile);
        const uploadRes = await api.uploadFile(formData);
        if (uploadRes.url) {
          document_url = uploadRes.url;
        }
      }

      if (editingDocument) {
        const res = await api.updateVehicleDocument(editingDocument.id, { ...documentFormData, document_url });
        if (res.error) {
          alert(res.error);
          return;
        }
        setDocuments(documents.map(d => d.id === editingDocument.id ? res : d));
      } else {
        const res = await api.createVehicleDocument(selectedVehicle.id, { ...documentFormData, document_url });
        if (res.error) {
          alert(res.error);
          return;
        }
        setDocuments([...documents, res]);
      }
      
      setShowDocumentModal(false);
      setEditingDocument(null);
      setDocumentFile(null);
      setDocumentFormData({ type: 'insurance', status: 'valid' } as any);
    } catch (error) {
      alert('Evrak kaydedilirken bir hata oluştu.');
    }
  };

  const handleEditDocument = (doc: VehicleDocument) => {
    setEditingDocument(doc);
    setDocumentFormData({
      type: doc.type,
      expiry_date: doc.expiry_date ? doc.expiry_date.split('T')[0] : '',
      notes: doc.notes,
      document_url: doc.document_url
    } as any);
    setShowDocumentModal(true);
  };

  const handleDeleteDocument = async (id: number) => {
    if (!window.confirm('Bu evrakı silmek istediğinize emin misiniz?')) return;
    try {
      await api.deleteVehicleDocument(id);
      setDocuments(documents.filter(d => d.id !== id));
    } catch (error) {
      alert('Evrak silinirken bir hata oluştu.');
    }
  };

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    try {
      if (editingMaintenance) {
        const res = await api.updateVehicleMaintenance(editingMaintenance.id, maintenanceFormData);
        if (res.error) {
          alert(res.error);
          return;
        }
        setMaintenance(maintenance.map(m => m.id === editingMaintenance.id ? res : m));
      } else {
        const res = await api.createVehicleMaintenance(selectedVehicle.id, maintenanceFormData);
        if (res.error) {
          alert(res.error);
          return;
        }
        setMaintenance([...maintenance, res]);
      }
      
      setShowMaintenanceModal(false);
      setEditingMaintenance(null);
      setMaintenanceFormData({ type: 'routine', status: 'planned' } as any);
    } catch (error) {
      alert('Bakım kaydı kaydedilirken bir hata oluştu.');
    }
  };

  const handleEditMaintenance = (m: VehicleMaintenance) => {
    setEditingMaintenance(m);
    setMaintenanceFormData({
      type: m.type,
      date: m.date ? m.date.split('T')[0] : '',
      mileage: m.mileage,
      cost: m.cost,
      currency: m.currency,
      provider_name: m.provider_name,
      description: m.description,
      status: m.status,
      next_maintenance_date: m.next_maintenance_date ? m.next_maintenance_date.split('T')[0] : '',
      next_maintenance_mileage: m.next_maintenance_mileage
    } as any);
    setShowMaintenanceModal(true);
  };

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    try {
      const res = await api.createVehicleAssignment(selectedVehicle.id, assignmentFormData);
      if (res.error) {
        alert(res.error);
        return;
      }
      setAssignments([...assignments, res]);
      setShowAssignmentModal(false);
      setAssignmentFormData({ status: 'active' } as any);
    } catch (error) {
      alert('Zimmet eklenirken bir hata oluştu.');
    }
  };

  const handleAddMileage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    try {
      const res = await api.createVehicleMileage(selectedVehicle.id, mileageFormData);
      if (res.error) {
        alert(res.error);
        return;
      }
      setMileageLogs([...mileageLogs, res]);
      setShowMileageModal(false);
      setMileageFormData({});
      setVehicles(vehicles.map(v => v.id === selectedVehicle.id ? { ...v, current_mileage: res.mileage } : v));
    } catch (error) {
      alert('KM eklenirken bir hata oluştu.');
    }
  };

  const handleAddIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    try {
      const res = await api.createVehicleIncident(selectedVehicle.id, incidentFormData);
      if (res.error) {
        alert(res.error);
        return;
      }
      setIncidents([...incidents, res]);
      setShowIncidentModal(false);
      setIncidentFormData({ type: 'accident', status: 'open' });
    } catch (error) {
      alert('Olay eklenirken bir hata oluştu.');
    }
  };

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDriver) {
        const res = await api.updateDriver(editingDriver.id, driverFormData);
        if (res.error) {
          alert(res.error);
          return;
        }
        setDrivers(drivers.map(d => d.id === editingDriver.id ? res : d));
      } else {
        const res = await api.createDriver({ ...driverFormData, store_id: storeId });
        if (res.error) {
          alert(res.error);
          return;
        }
        setDrivers([...drivers, res]);
      }
      setShowDriverModal(false);
      setEditingDriver(null);
      setDriverFormData({ status: 'active' });
    } catch (error) {
      alert('Sürücü kaydedilirken bir hata oluştu.');
    }
  };

  const handleDeleteDriver = async (id: number) => {
    if (!window.confirm('Bu sürücüyü silmek istediğinize emin misiniz?')) return;
    try {
      await api.deleteDriver(id);
      setDrivers(drivers.filter(d => d.id !== id));
    } catch (error) {
      alert('Sürücü silinirken bir hata oluştu.');
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const paginatedVehicles = filteredVehicles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
      case 'active': return t.active;
      case 'in_service': return t.inService;
      case 'broken': return t.broken;
      case 'sold': return t.sold;
      default: return status;
    }
  };

  const exportToExcel = () => {
    const data = vehicles.map(v => ({
      [t.plate]: v.plate,
      [t.brand]: v.brand,
      [t.model]: v.model,
      [t.year]: v.year,
      [t.vehicleType]: v.type === 'company' ? t.company : t.personal,
      [t.currentMileage]: v.current_mileage,
      [t.status]: getStatusText(v.status),
      [t.chassisNumber]: v.chassis_number,
      [t.engineNumber]: v.engine_number
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t.fleet);
    XLSX.writeFile(wb, `Fleet_Report_${format(new Date(), 'dd_MM_yyyy')}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(t.fleet, 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [[t.plate, t.brand, t.model, t.year, t.vehicleType, t.currentMileage, t.status]],
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

  const getVehiclePlate = (id: number) => vehicles.find(v => v.id === id)?.plate || `ID: ${id}`;

  const renderVehiclesTab = () => {
    const filteredVehicles = vehicles.filter(v => {
      const matchesSearch = v.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            v.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            v.model.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
    const paginatedVehicles = filteredVehicles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t.vehicleInfo}</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t.status}</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">KM</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Uyarılar</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Car className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{vehicle.plate}</p>
                        <p className="text-xs text-gray-500">{vehicle.brand} {vehicle.model}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(vehicle.status)}`}>
                      {getStatusText(vehicle.status)}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {(vehicle.current_mileage || 0).toLocaleString()}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {(vehicle.expiring_docs || 0) > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 rounded-md text-[10px] font-bold border border-amber-100">
                          <AlertCircle className="w-3 h-3" />
                          {vehicle.expiring_docs} EVRAK
                        </div>
                      )}
                      {((vehicle.maintenance_due || 0) > 0 || (vehicle.current_mileage && allMaintenance.find(m => m.vehicle_id === vehicle.id && m.next_maintenance_mileage && vehicle.current_mileage >= m.next_maintenance_mileage - 1000))) && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded-md text-[10px] font-bold border border-red-100">
                          <Wrench className="w-3 h-3" />
                          BAKIM
                        </div>
                      )}
                      {!(vehicle.expiring_docs || 0) && !(vehicle.maintenance_due || 0) && (
                        <span className="text-xs text-green-500 font-medium">Sorun Yok</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedVehicle(vehicle);
                          fetchVehicleDetails(vehicle);
                          setShowDetailModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Detaylar"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      {!isViewer && (
                        <>
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
                                status: vehicle.status
                              });
                              setShowAddModal(true);
                            }}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Düzenle"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteVehicle(vehicle.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedVehicles.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    {t.noVehicles}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <span className="text-sm text-gray-600">
              Toplam <span className="font-bold">{filteredVehicles.length}</span> araçtan <span className="font-bold">{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredVehicles.length)}</span> arası gösteriliyor
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-200 rounded-lg disabled:opacity-50"
              >
                Geri
              </button>
              <span className="text-sm font-bold">{currentPage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-200 rounded-lg disabled:opacity-50"
              >
                İleri
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDriversTab = () => {
    const filteredDrivers = drivers.filter(d => 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.license_number.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">{t.drivers}</h3>
          {!isViewer && (
            <button
              onClick={() => {
                setEditingDriver(null);
                setDriverFormData({ status: 'active' });
                setShowDriverModal(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              {t.addDriver}
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t.driverName}</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t.licenseNumber}</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t.phone}</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t.status}</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredDrivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                        <UserCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{driver.name}</p>
                        <p className="text-xs text-gray-500">{driver.license_class} Sınıfı</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-700">{driver.license_number}</td>
                  <td className="p-4 text-sm text-gray-700">{driver.phone}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      driver.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {driver.status === 'active' ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      {!isViewer && (
                        <>
                          <button
                            onClick={() => {
                              setEditingDriver(driver);
                              setDriverFormData(driver);
                              setShowDriverModal(true);
                            }}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDriver(driver.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDrivers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    {t.noDrivers}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderDocumentsTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {allDocuments.map(doc => (
        <div key={doc.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex items-center gap-1">
              {doc.document_url && (
                <a 
                  href={doc.document_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                  title="İndir / Görüntüle"
                >
                  <Download className="w-4 h-4" />
                </a>
              )}
              {!isViewer && (
                <button 
                  onClick={() => {
                    const vehicle = vehicles.find(v => v.id === doc.vehicle_id);
                    if (vehicle) {
                      setSelectedVehicle(vehicle);
                      handleEditDocument(doc);
                    }
                  }} 
                  className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                  title="Düzenle"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <h4 className="font-bold text-gray-900">{doc.type}</h4>
          <p className="text-sm text-gray-500 mb-2">{getVehiclePlate(doc.vehicle_id)}</p>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
            <span className={`text-xs font-medium ${new Date(doc.expiry_date) < new Date() ? 'text-red-600' : 'text-gray-500'}`}>
              Vade: {safeFormatDate(doc.expiry_date, 'dd.MM.yyyy')}
            </span>
          </div>
        </div>
      ))}
      {allDocuments.length === 0 && <div className="col-span-3 py-12 text-center text-gray-400">Evrak bulunamadı.</div>}
    </div>
  );

  const renderMaintenanceTab = () => (
    <div className="space-y-4">
      {allMaintenance.map(m => (
        <div key={m.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center hover:border-blue-200 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
              <Wrench className="w-7 h-7 text-orange-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">{m.type}</h4>
              <p className="text-sm text-gray-500">
                <span className="font-bold text-blue-600">{getVehiclePlate(m.vehicle_id)}</span> | {safeFormatDate(m.date, 'dd.MM.yyyy')} | {m.provider_name}
              </p>
              <div className="flex gap-4 mt-1">
                {m.next_maintenance_date && (
                  <p className="text-[10px] text-amber-600 font-bold uppercase">
                    Sonraki Tarih: {safeFormatDate(m.next_maintenance_date, 'dd.MM.yyyy')}
                  </p>
                )}
                {m.next_maintenance_mileage && (
                  <p className="text-[10px] text-amber-600 font-bold uppercase">
                    Sonraki KM: {m.next_maintenance_mileage.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="font-bold text-gray-900">{(m.cost || 0).toLocaleString()} {m.currency}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                m.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {m.status === 'completed' ? 'Tamamlandı' : 'Planlandı'}
              </span>
            </div>
            <div className="flex gap-2">
              {m.invoice_url && (
                <a 
                  href={m.invoice_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Faturayı İndir"
                >
                  <Download className="w-5 h-5" />
                </a>
              )}
              {!isViewer && (
                <button 
                  onClick={() => {
                    const vehicle = vehicles.find(v => v.id === m.vehicle_id);
                    if (vehicle) {
                      setSelectedVehicle(vehicle);
                      handleEditMaintenance(m);
                    }
                  }} 
                  className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                  title="Düzenle"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
      {allMaintenance.length === 0 && <div className="py-12 text-center text-gray-400">Bakım kaydı bulunamadı.</div>}
    </div>
  );

  const renderAssignmentsTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {allAssignments.map(a => (
        <div key={a.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{a.user_email}</h4>
                <p className="text-xs text-gray-500">{getVehiclePlate(a.vehicle_id)}</p>
              </div>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
              a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {a.status === 'active' ? 'Aktif' : 'İade Edildi'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
            <div>
              <p className="text-gray-400 uppercase font-bold mb-1">Başlangıç</p>
              <p>{safeFormatDate(a.start_date, 'dd.MM.yyyy')}</p>
              <p>{(a.start_mileage || 0).toLocaleString()} KM</p>
            </div>
            {a.end_date && (
              <div>
                <p className="text-gray-400 uppercase font-bold mb-1">Bitiş</p>
                <p>{safeFormatDate(a.end_date, 'dd.MM.yyyy')}</p>
                <p>{(a.end_mileage || 0).toLocaleString()} KM</p>
              </div>
            )}
          </div>
          {!isViewer && a.status === 'active' && (
            <button
              onClick={() => {
                const vehicle = vehicles.find(v => v.id === a.vehicle_id);
                if (vehicle) {
                  setSelectedVehicle(vehicle);
                  setAssignmentFormData({
                    vehicle_id: a.vehicle_id,
                    user_email: a.user_email,
                    start_date: a.start_date,
                    start_mileage: a.start_mileage,
                    end_date: new Date().toISOString().split('T')[0],
                    end_mileage: vehicle.current_mileage,
                    status: 'returned'
                  });
                  setShowAssignmentModal(true);
                }
              }}
              className="w-full mt-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors"
            >
              İADE AL
            </button>
          )}
        </div>
      ))}
      {allAssignments.length === 0 && <div className="col-span-2 py-12 text-center text-gray-400">Zimmet kaydı bulunamadı.</div>}
    </div>
  );

  const renderMileageTab = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="p-4 font-bold text-gray-500">Tarih</th>
            <th className="p-4 font-bold text-gray-500">{t.vehicles}</th>
            <th className="p-4 font-bold text-gray-500">KM</th>
            <th className="p-4 font-bold text-gray-500">Notlar</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {allMileage.map(log => (
            <tr key={log.id}>
              <td className="p-4">{safeFormatDate(log.date, 'dd.MM.yyyy HH:mm')}</td>
              <td className="p-4 font-bold text-blue-600">{getVehiclePlate(log.vehicle_id)}</td>
              <td className="p-4 font-bold">{(log.mileage || 0).toLocaleString()} KM</td>
              <td className="p-4 text-gray-500">{log.notes || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {allMileage.length === 0 && <div className="py-12 text-center text-gray-400">KM kaydı bulunamadı.</div>}
    </div>
  );

  const renderIncidentsTab = () => (
    <div className="space-y-4">
      {allIncidents.map(i => (
        <div key={i.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">{i.type}</h4>
              <p className="text-sm text-gray-500">
                <span className="font-bold text-blue-600">{getVehiclePlate(i.vehicle_id)}</span> | {safeFormatDate(i.date, 'dd.MM.yyyy')}
              </p>
              <p className="text-sm text-gray-600 mt-1">{i.description}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-red-600">{(i.cost || 0).toLocaleString()} TRY</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
              i.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {i.status === 'resolved' ? 'Çözüldü' : 'Bekliyor'}
            </span>
          </div>
        </div>
      ))}
      {allIncidents.length === 0 && <div className="py-12 text-center text-gray-400">Olay kaydı bulunamadı.</div>}
    </div>
  );

  const renderMainTabContent = () => {
    switch (activeMainTab) {
      case 'vehicles': return renderVehiclesTab();
      case 'drivers': return renderDriversTab();
      case 'documents': return renderDocumentsTab();
      case 'maintenance': return renderMaintenanceTab();
      case 'assignments': return renderAssignmentsTab();
      case 'mileage': return renderMileageTab();
      case 'incidents': return renderIncidentsTab();
      default: return null;
    }
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
          <p className="text-gray-500 text-sm">{t.fleet}</p>
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
              {t.addVehicle}
            </button>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveMainTab('vehicles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeMainTab === 'vehicles' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Car className="w-4 h-4" />
          {t.vehicles}
        </button>
        <button
          onClick={() => setActiveMainTab('drivers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeMainTab === 'drivers' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          {t.drivers}
        </button>
        <button
          onClick={() => setActiveMainTab('documents')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeMainTab === 'documents' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          {t.documents}
        </button>
        <button
          onClick={() => setActiveMainTab('maintenance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeMainTab === 'maintenance' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Wrench className="w-4 h-4" />
          Bakım-Onarım
        </button>
        <button
          onClick={() => setActiveMainTab('assignments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeMainTab === 'assignments' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Zimmetler
        </button>
        <button
          onClick={() => setActiveMainTab('mileage')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeMainTab === 'mileage' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <History className="w-4 h-4" />
          KM Kayıtları
        </button>
        <button
          onClick={() => setActiveMainTab('incidents')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeMainTab === 'incidents' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Olaylar
        </button>
      </div>

      {/* Search, Filter & Stats */}
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center justify-between">
            <span className="text-blue-700 font-medium">{t.totalVehicles}</span>
            <span className="text-2xl font-bold text-blue-800">{vehicles.length}</span>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-100 flex items-center justify-between">
            <span className="text-green-700 font-medium">{t.activeVehicles}</span>
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

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={`${t.plate}, ${t.brand.toLowerCase()} or ${t.model.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="active">Aktif</option>
              <option value="in_service">Serviste</option>
              <option value="broken">Arızalı</option>
              <option value="sold">Satıldı</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : renderMainTabContent()}

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
                  {selectedVehicle ? t.editVehicle : t.addVehicle}
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={selectedVehicle ? handleUpdateVehicle : handleCreateVehicle} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">{t.plate}</label>
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
                    <label className="text-sm font-medium text-gray-700">{t.vehicleType}</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="company">{t.company}</option>
                      <option value="personal">{t.personal}</option>
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
                <div className="flex items-center gap-2">
                  {!isViewer && (
                    <button
                      onClick={() => {
                        setFormData(selectedVehicle);
                        setShowAddModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                      <Edit2 className="w-4 h-4" />
                      Düzenle
                    </button>
                  )}
                  <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                </div>
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
                          <p className="text-xs text-gray-400 uppercase font-bold">{t.vehicleType}</p>
                          <p className="font-medium text-gray-700">{selectedVehicle.type === 'company' ? t.company : t.personal}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase font-bold">Kayıt Tarihi</p>
                          <p className="font-medium text-gray-700">{safeFormatDate(selectedVehicle.created_at, 'dd MMMM yyyy', { locale: tr })}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <h4 className="text-lg font-bold text-gray-800 border-b pb-2">Hızlı Durum</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                          <p className="text-xs text-blue-600 uppercase font-bold mb-1">Güncel KM</p>
                          <p className="text-2xl font-bold text-blue-800">{(selectedVehicle.current_mileage || 0).toLocaleString()} KM</p>
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
                        <button onClick={() => setShowDocumentModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
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
                              <p className="text-xs text-gray-500">Vade: {safeFormatDate(doc.expiry_date, 'dd.MM.yyyy')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {doc.document_url && (
                              <button 
                                onClick={() => window.open(doc.document_url, '_blank')}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="İndir / Görüntüle"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            )}
                            {!isViewer && (
                              <>
                                <button 
                                  onClick={() => handleEditDocument(doc)}
                                  className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                                  title="Düzenle"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                  title="Sil"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
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
                        <button onClick={() => setShowMaintenanceModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
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
                                <p className="text-xs text-gray-500">{safeFormatDate(m.date, 'dd MMMM yyyy', { locale: tr })} - {m.provider_name}</p>
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                              <div className="flex items-center gap-2">
                                {m.invoice_url && (
                                  <button 
                                    onClick={() => window.open(m.invoice_url!, '_blank')}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                    title="Fatura İndir"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                )}
                                {!isViewer && (
                                  <button 
                                    onClick={() => handleEditMaintenance(m)}
                                    className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                                    title="Düzenle"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                )}
                                <p className="font-bold text-gray-900">{(m.cost || 0).toLocaleString()} {m.currency}</p>
                              </div>
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
                                Sonraki Bakım: {safeFormatDate(m.next_maintenance_date, 'dd.MM.yyyy')}
                              </div>
                              {m.next_maintenance_mileage && (
                                <div className="flex items-center gap-1 text-blue-600">
                                  <MapPin className="w-3 h-3" />
                                  Sonraki KM: {(m.next_maintenance_mileage || 0).toLocaleString()}
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
                        <button onClick={() => setShowAssignmentModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
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
                                {safeFormatDate(a.start_date, 'dd.MM.yyyy')} 
                                {a.end_date ? ` - ${safeFormatDate(a.end_date, 'dd.MM.yyyy')}` : ' (Devam Ediyor)'}
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
                        <button onClick={() => setShowMileageModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
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
                                <p className="font-bold text-gray-800">{(log.mileage || 0).toLocaleString()} KM</p>
                                <p className="text-xs text-gray-500">{safeFormatDate(log.date, 'dd MMMM yyyy', { locale: tr })}</p>
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
                        <button onClick={() => setShowIncidentModal(true)} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm">
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
                                <p className="text-xs text-gray-500">{safeFormatDate(inc.date, 'dd.MM.yyyy')}</p>
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
                            <p className="text-sm font-bold text-red-600 mt-2">Maliyet: {(inc.cost || 0).toLocaleString()} TRY</p>
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

      {/* Document Modal */}
      <AnimatePresence>
        {showDocumentModal && selectedVehicle && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingDocument ? 'Evrak Düzenle' : 'Evrak Ekle'}
                </h3>
                <button onClick={() => {
                  setShowDocumentModal(false);
                  setEditingDocument(null);
                  setDocumentFile(null);
                }} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddDocument} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Evrak Tipi</label>
                  <select
                    required
                    value={documentFormData.type || ''}
                    onChange={(e) => setDocumentFormData({ ...documentFormData, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="registration">{t.vehicleLicense}</option>
                    <option value="insurance">Sigorta Poliçesi</option>
                    <option value="inspection">Muayene Belgesi</option>
                    <option value="tax">Vergi Dekontu</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dosya Yükle</label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-400 cursor-pointer transition-colors">
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {documentFile ? documentFile.name : 'Dosya Seç'}
                      </span>
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                  {documentFormData.document_url && !documentFile && (
                    <p className="text-xs text-blue-600 mt-1 truncate">Mevcut: {documentFormData.document_url}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Geçerlilik Tarihi</label>
                  <input
                    type="date"
                    required
                    value={documentFormData.expiry_date || ''}
                    onChange={(e) => setDocumentFormData({ ...documentFormData, expiry_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                  <textarea
                    value={documentFormData.notes || ''}
                    onChange={(e) => setDocumentFormData({ ...documentFormData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setShowDocumentModal(false)} className="px-6 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">İptal</button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Kaydet</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Maintenance Modal */}
      <AnimatePresence>
        {showMaintenanceModal && selectedVehicle && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingMaintenance ? 'Bakım Kaydı Düzenle' : 'Bakım Kaydı Ekle'}
                </h3>
                <button onClick={() => {
                  setShowMaintenanceModal(false);
                  setEditingMaintenance(null);
                }} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddMaintenance} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bakım Tipi</label>
                    <select
                      required
                      value={maintenanceFormData.type || ''}
                      onChange={(e) => setMaintenanceFormData({ ...maintenanceFormData, type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="routine">Periyodik Bakım</option>
                      <option value="repair">Onarım</option>
                      <option value="tire">Lastik Değişimi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                    <input
                      type="date"
                      required
                      value={maintenanceFormData.date || ''}
                      onChange={(e) => setMaintenanceFormData({ ...maintenanceFormData, date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">KM</label>
                    <input
                      type="number"
                      required
                      value={maintenanceFormData.mileage || ''}
                      onChange={(e) => setMaintenanceFormData({ ...maintenanceFormData, mileage: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maliyet (TRY)</label>
                    <input
                      type="number"
                      required
                      value={maintenanceFormData.cost || ''}
                      onChange={(e) => setMaintenanceFormData({ ...maintenanceFormData, cost: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl space-y-4">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Gelecek Bakım Planı</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sonraki Bakım Tarihi</label>
                      <input
                        type="date"
                        value={maintenanceFormData.next_maintenance_date || ''}
                        onChange={(e) => setMaintenanceFormData({ ...maintenanceFormData, next_maintenance_date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sonraki Bakım KM</label>
                      <input
                        type="number"
                        value={maintenanceFormData.next_maintenance_mileage || ''}
                        onChange={(e) => setMaintenanceFormData({ ...maintenanceFormData, next_maintenance_mileage: Number(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Örn: 110000"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Servis / Sağlayıcı</label>
                  <input
                    type="text"
                    value={maintenanceFormData.provider_name || ''}
                    onChange={(e) => setMaintenanceFormData({ ...maintenanceFormData, provider_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Örn: ABC Servis"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                  <textarea
                    value={maintenanceFormData.description || ''}
                    onChange={(e) => setMaintenanceFormData({ ...maintenanceFormData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fatura / Belge Yükle</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const formData = new FormData();
                            formData.append('file', file);
                            const res = await api.uploadFile(formData);
                            if (res.url) {
                              setMaintenanceFormData({ ...maintenanceFormData, invoice_url: res.url });
                            }
                          } catch (err) {
                            console.error('Upload failed:', err);
                            alert('Dosya yüklenirken bir hata oluştu.');
                          }
                        }
                      }}
                      className="hidden"
                      id="maintenance-file-upload"
                    />
                    <label
                      htmlFor="maintenance-file-upload"
                      className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <Upload className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Dosya Seç</span>
                    </label>
                    {maintenanceFormData.invoice_url && (
                      <div className="flex items-center gap-2 text-green-600 text-xs font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        Yüklendi
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setShowMaintenanceModal(false)} className="px-6 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">İptal</button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Kaydet</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Driver Modal */}
      <AnimatePresence>
        {showDriverModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-xl font-bold text-gray-800">{editingDriver ? t.editDriver : t.addDriver}</h3>
                <button onClick={() => setShowDriverModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddDriver} className="p-6 overflow-y-auto max-h-[80vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.driverName}</label>
                    <input
                      type="text"
                      required
                      value={driverFormData.name || ''}
                      onChange={(e) => setDriverFormData({ ...driverFormData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.licenseNumber}</label>
                    <input
                      type="text"
                      required
                      value={driverFormData.license_number || ''}
                      onChange={(e) => setDriverFormData({ ...driverFormData, license_number: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.licenseClass}</label>
                    <input
                      type="text"
                      required
                      placeholder="B, C, D, E..."
                      value={driverFormData.license_class || ''}
                      onChange={(e) => setDriverFormData({ ...driverFormData, license_class: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.bloodType}</label>
                    <select
                      value={driverFormData.blood_type || ''}
                      onChange={(e) => setDriverFormData({ ...driverFormData, blood_type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seçiniz</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'].map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.phone}</label>
                    <input
                      type="tel"
                      required
                      value={driverFormData.phone || ''}
                      onChange={(e) => setDriverFormData({ ...driverFormData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.email}</label>
                    <input
                      type="email"
                      required
                      value={driverFormData.email || ''}
                      onChange={(e) => setDriverFormData({ ...driverFormData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.address}</label>
                    <textarea
                      value={driverFormData.address || ''}
                      onChange={(e) => setDriverFormData({ ...driverFormData, address: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.status}</label>
                    <select
                      value={driverFormData.status || 'active'}
                      onChange={(e) => setDriverFormData({ ...driverFormData, status: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Aktif</option>
                      <option value="inactive">Pasif</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ehliyet / Evrak Yükle</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        onChange={(e) => setDriverFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="driver-file-upload"
                      />
                      <label
                        htmlFor="driver-file-upload"
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <Upload className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Dosya Seç</span>
                      </label>
                      {(driverFile || driverFormData.license_copy_url) && (
                        <div className="flex items-center gap-2 text-green-600 text-xs font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          {driverFile ? 'Yeni Dosya' : 'Yüklü'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setShowDriverModal(false)} className="px-6 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">İptal</button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Kaydet</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assignment Modal */}
      <AnimatePresence>
        {showAssignmentModal && selectedVehicle && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-xl font-bold text-gray-800">{assignmentFormData.status === 'returned' ? 'İade Al' : 'Zimmetle'}</h3>
                <button onClick={() => setShowAssignmentModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddAssignment} className="p-6 space-y-4">
                {assignmentFormData.status !== 'returned' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.driver}</label>
                    <select
                      required
                      value={assignmentFormData.driver_id || ''}
                      onChange={(e) => {
                        const driverId = Number(e.target.value);
                        const driver = drivers.find(d => d.id === driverId);
                        setAssignmentFormData({ 
                          ...assignmentFormData, 
                          driver_id: driverId,
                          user_email: driver?.email || ''
                        });
                      }}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{t.selectDriver}</option>
                      {drivers.filter(d => d.status === 'active').map(driver => (
                        <option key={driver.id} value={driver.id}>{driver.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {assignmentFormData.status === 'returned' ? 'İade Tarihi' : 'Başlangıç Tarihi'}
                  </label>
                  <input
                    type="date"
                    required
                    value={assignmentFormData.status === 'returned' ? (assignmentFormData.end_date || '') : (assignmentFormData.start_date || '')}
                    onChange={(e) => {
                      if (assignmentFormData.status === 'returned') {
                        setAssignmentFormData({ ...assignmentFormData, end_date: e.target.value });
                      } else {
                        setAssignmentFormData({ ...assignmentFormData, start_date: e.target.value });
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {assignmentFormData.status === 'returned' ? 'İade KM' : 'Başlangıç KM'}
                  </label>
                  <input
                    type="number"
                    required
                    value={assignmentFormData.status === 'returned' ? (assignmentFormData.end_mileage || '') : (assignmentFormData.start_mileage || '')}
                    onChange={(e) => {
                      if (assignmentFormData.status === 'returned') {
                        setAssignmentFormData({ ...assignmentFormData, end_mileage: Number(e.target.value) });
                      } else {
                        setAssignmentFormData({ ...assignmentFormData, start_mileage: Number(e.target.value) });
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                  <textarea
                    value={assignmentFormData.notes || ''}
                    onChange={(e) => setAssignmentFormData({ ...assignmentFormData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setShowAssignmentModal(false)} className="px-6 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">İptal</button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Kaydet</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mileage Modal */}
      <AnimatePresence>
        {showMileageModal && selectedVehicle && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-xl font-bold text-gray-800">KM Güncelle</h3>
                <button onClick={() => setShowMileageModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddMileage} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                  <input
                    type="date"
                    required
                    value={mileageFormData.date || ''}
                    onChange={(e) => setMileageFormData({ ...mileageFormData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yeni KM</label>
                  <input
                    type="number"
                    required
                    value={mileageFormData.mileage || ''}
                    onChange={(e) => setMileageFormData({ ...mileageFormData, mileage: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                  <textarea
                    value={mileageFormData.notes || ''}
                    onChange={(e) => setMileageFormData({ ...mileageFormData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setShowMileageModal(false)} className="px-6 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">İptal</button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Kaydet</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Incident Modal */}
      <AnimatePresence>
        {showIncidentModal && selectedVehicle && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-xl font-bold text-gray-800">Olay Kaydı Ekle</h3>
                <button onClick={() => setShowIncidentModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddIncident} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Olay Tipi</label>
                  <select
                    required
                    value={incidentFormData.type || ''}
                    onChange={(e) => setIncidentFormData({ ...incidentFormData, type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="accident">Kaza</option>
                    <option value="breakdown">Arıza</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                  <input
                    type="date"
                    required
                    value={incidentFormData.date || ''}
                    onChange={(e) => setIncidentFormData({ ...incidentFormData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                  <textarea
                    required
                    value={incidentFormData.description || ''}
                    onChange={(e) => setIncidentFormData({ ...incidentFormData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tahmini Maliyet (TRY)</label>
                  <input
                    type="number"
                    value={incidentFormData.cost || ''}
                    onChange={(e) => setIncidentFormData({ ...incidentFormData, cost: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setShowIncidentModal(false)} className="px-6 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">İptal</button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Kaydet</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FleetTab;
