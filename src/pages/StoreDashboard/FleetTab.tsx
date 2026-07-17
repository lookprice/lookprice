import React, { useState, useEffect } from 'react';
import { 
  Car, 
  UserCheck, 
  Wrench, 
  ClipboardList, 
  History, 
  AlertTriangle, 
  ShieldCheck,
  Search,
  Plus,
  Download,
  Filter,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Eye,
  Camera,
  RefreshCw,
  X,
  PlusCircle,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
// import * as XLSX from 'xlsx';
import { api } from '../../services/api';
// import { jsPDF } from 'jspdf';
// import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations';
import { Vehicle, Driver, VehicleDocument, VehicleAssignment, VehicleMaintenance, VehicleMileage, VehicleIncident } from '../../types';
import { FleetStats } from '../../components/dashboard/fleet/FleetStats';
import { FleetMainTabContent } from '../../components/dashboard/fleet/FleetMainTabContent';
import { VehicleFormModal } from '../../components/dashboard/fleet/VehicleFormModal';
import { VehicleDetailModal } from '../../components/dashboard/fleet/VehicleDetailModal';
import { DriverFormModal } from '../../components/dashboard/fleet/DriverFormModal';
import { MaintenanceFormModal } from '../../components/dashboard/fleet/MaintenanceFormModal';
import { AssignmentFormModal } from '../../components/dashboard/fleet/AssignmentFormModal';
import { MileageFormModal } from '../../components/dashboard/fleet/MileageFormModal';
import { IncidentFormModal } from '../../components/dashboard/fleet/IncidentFormModal';
import { DocumentFormModal } from '../../components/dashboard/fleet/DocumentFormModal';
import { AutoContractModal } from '../../components/AutoContractModal';
import { AutomotiveSocialMediaShareModal } from '../../components/AutomotiveSocialMediaShareModal';

interface FleetTabProps {
  storeId: number;
  isViewer?: boolean;
  branding?: any;
}

const FleetTab: React.FC<FleetTabProps> = ({ storeId, isViewer, branding }) => {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareVehicle, setShareVehicle] = useState<Vehicle | null>(null);
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseCurrency, setNewExpenseCurrency] = useState('TRY');
  
  // Custom Loan Calculator States
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [loanTerm, setLoanTerm] = useState<number>(36);
  const [loanRate, setLoanRate] = useState<number>(2.49);

  // Auto Contract Generator States
  const [autoContractVehicle, setAutoContractVehicle] = useState<Vehicle | null>(null);
  const [isAutoContractOpen, setIsAutoContractOpen] = useState(false);

  useEffect(() => {
    if (selectedVehicle?.selling_price) {
      setLoanAmount(Math.round(selectedVehicle.selling_price * 0.7));
    }
  }, [selectedVehicle]);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDriverDetailModal, setShowDriverDetailModal] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<'vehicles' | 'drivers' | 'maintenance' | 'assignments' | 'mileage' | 'incidents' | 'obligations'>('vehicles');
  const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'docs' | 'maintenance' | 'assignments' | 'mileage' | 'incidents'>('info');
  
  // All Fleet Data (for main tabs)
  const [allDocuments, setAllDocuments] = useState<any[]>([]);
  const [allMaintenance, setAllMaintenance] = useState<any[]>([]);
  const [allAssignments, setAllAssignments] = useState<any[]>([]);
  const [allMileage, setAllMileage] = useState<any[]>([]);
  const [allIncidents, setAllIncidents] = useState<any[]>([]);
  const [allDriverDocuments, setAllDriverDocuments] = useState<any[]>([]);

  // Detail Data
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [driverDocuments, setDriverDocuments] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<VehicleMaintenance[]>([]);
  const [assignments, setAssignments] = useState<VehicleAssignment[]>([]);
  const [driverAssignments, setDriverAssignments] = useState<VehicleAssignment[]>([]);
  const [mileageLogs, setMileageLogs] = useState<VehicleMileage[]>([]);
  const [incidents, setIncidents] = useState<VehicleIncident[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // Action Modal States
  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false);
  const [showAddMaintenanceModal, setShowAddMaintenanceModal] = useState(false);
  const [showAddAssignmentModal, setShowAddAssignmentModal] = useState(false);
  const [showAddMileageModal, setShowAddMileageModal] = useState(false);
  const [showAddIncidentModal, setShowAddIncidentModal] = useState(false);
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);

  const [driverFormData, setDriverFormData] = useState<any>({ name: '', phone: '', email: '', status: 'active' });
  const [maintenanceFormData, setMaintenanceFormData] = useState<any>({ type: '', date: '', status: 'planned', cost: 0, currency: 'TRY' });
  const [assignmentFormData, setAssignmentFormData] = useState<any>({ user_email: '', start_date: '', start_mileage: 0 });
  const [mileageFormData, setMileageFormData] = useState<any>({ date: '', mileage: 0 });
  const [incidentFormData, setIncidentFormData] = useState<any>({ type: '', date: '', description: '', cost: 0 });
  const [documentFormData, setDocumentFormData] = useState<any>({ type: '', expiry_date: '', document_number: '' });

  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editingDocument, setEditingDocument] = useState<VehicleDocument | null>(null);
  const [editingMaintenance, setEditingMaintenance] = useState<VehicleMaintenance | null>(null);
  const [editingIncident, setEditingIncident] = useState<VehicleIncident | null>(null);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

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

  const getAlerts = () => {
    const alerts: { type: string; message: string; icon: any; color: string }[] = [];
    
    vehicles.forEach(v => {
      if (v.maintenance_due && v.current_mileage >= v.maintenance_due) {
        alerts.push({ type: 'maintenance', message: `${v.plate} ${t.maintenanceDue} (${v.current_mileage.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} KM)`, icon: Wrench, color: 'text-red-600' });
      }
    });

    const now = new Date();
    const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    allDocuments.forEach(d => {
      if (d.type === 'Ruhsat-Koçan') return;
      if (d.expiry_date && new Date(d.expiry_date) < soon) {
        alerts.push({ type: 'document', message: `${d.type} ${t.documentExpiring} (${t.expiryDate}: ${safeFormatDate(d.expiry_date)})`, icon: FileText, color: 'text-orange-600' });
      }
    });

    allDriverDocuments.forEach(d => {
      if (d.expiry_date && new Date(d.expiry_date) < soon) {
        alerts.push({ type: 'document', message: `${d.driver_name} ${t.documentExpiring} (${t.expiryDate}: ${safeFormatDate(d.expiry_date)})`, icon: UserCheck, color: 'text-orange-600' });
      }
    });

    return alerts;
  };

  const [statusFilter, setStatusFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [modelFilter, setModelFilter] = useState('all');
  const [driverSearch, setDriverSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // AI & Luxury Presentation States
  const [generatingVehicleDesc, setGeneratingVehicleDesc] = useState(false);
  const [vehicleAiNotice, setVehicleAiNotice] = useState<string | null>(null);

  const handleGenerateVehicleDesc = async () => {
    if (!formData.brand || !formData.model) {
      alert("Lütfen önce marka ve model bilgilerini giriniz.");
      return;
    }
    setGeneratingVehicleDesc(true);
    try {
      const res = await api.post("/api/store/generate-vehicle-desc", {
        brand: formData.brand,
        model: formData.model,
        year: formData.year,
        currentMileage: formData.current_mileage,
        transmission: formData.transmission,
        fuelType: formData.fuel_type,
        color: formData.color,
        bodyType: formData.body_type,
        paintReport: formData.paint_report,
        tramer_amount: formData.tramer_amount,
        tramer_currency: formData.tramer_currency,
        sellingPrice: formData.selling_price,
        currency: formData.currency,
        lang: 'tr'
      });
      if (res.text) {
        setFormData(prev => ({ 
          ...prev, 
          market_story: res.text,
          technical_description: res.text 
        }));
        setVehicleAiNotice("✅ Araç portföy hikayesi ve teknik açıklama yapay zeka tarafından başarıyla oluşturuldu!");
        setTimeout(() => setVehicleAiNotice(null), 5000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingVehicleDesc(false);
    }
  };

  const generateVehicleTitle = (v: any) => {
    if (!v) return "";
    const transMap: Record<string, string> = {
      'manual': 'Manuel',
      'automatic': 'Otomatik',
      'semi_automatic': 'Yarı Otomatik',
      'dual_clutch': 'Çift Kavrama (DCT/DSG)'
    };
    const fuelMap: Record<string, string> = {
      'gasoline': 'Benzin',
      'diesel': 'Dizel',
      'gasoline_hybrid': 'Benzin / Hibrit',
      'diesel_hybrid': 'Dizel / Hibrit',
      'electric': 'Elektrik',
      'lpg': 'LPG'
    };

    const year = v.year ? `${v.year} Model` : "";
    const trans = transMap[v.transmission] || transMap['manual'];
    const fuel = fuelMap[v.fuel_type] || fuelMap['gasoline'];
    const brand = v.brand || "";
    const model = v.model || "";

    return `${year} ${trans} ${fuel} ${brand} ${model}`.trim();
  };

  const [formData, setFormData] = useState<Partial<Vehicle>>({
    plate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    type: 'company',
    category: 'otomobil',
    chassis_number: '',
    engine_number: '',
    current_mileage: 0,
    status: 'active',
    package_name: '',
    transmission: 'manual',
    fuel_type: 'gasoline',
    color: '',
    body_type: '',
    paint_report: '{}',
    tramer_amount: 0,
    tramer_currency: 'GBP',
    buying_price: 0,
    buying_currency: 'GBP',
    currency: 'GBP',
    expenses: '[]',
    target_profit_margin: 0,
    description: '',
    market_story: '',
    technical_description: '',
    is_trade_in_available: false,
    images: [],
    virtual_tour_url: '',
    ai_tour_enabled: false,
    is_on_enrakipsiz: true,
    is_on_website: true,
    auto_post_instagram: false
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
      setDrivers(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setDrivers([]);
    }
  };

  const fetchAllFleetData = async () => {
    try {
      const [docs, maint, assign, mileage, inc, driverDocs] = await Promise.all([
        api.getAllFleetDocuments(storeId),
        api.getAllFleetMaintenance(storeId),
        api.getAllFleetAssignments(storeId),
        api.getAllFleetMileage(storeId),
        api.getAllFleetIncidents(storeId),
        api.getAllFleetDriverDocuments(storeId).catch(() => [])
      ]);
      setAllDocuments(docs);
      setAllMaintenance(maint);
      setAllAssignments(assign);
      setAllMileage(mileage);
      setAllIncidents(inc);
      setAllDriverDocuments(Array.isArray(driverDocs) ? driverDocs : []);
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

  const fetchDriverDetails = async (driver: Driver) => {
    try {
      const [docs, assign] = await Promise.all([
        api.getDriverDocuments(driver.id),
        api.getDriverAssignments(driver.id)
      ]);
      setDriverDocuments(Array.isArray(docs) ? docs : []);
      setDriverAssignments(Array.isArray(assign) ? assign : []);
    } catch (error) {
      console.error('Error fetching driver details:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting vehicle form, formData:", formData);
    if (selectedVehicle) {
      await handleUpdateVehicle(e);
    } else {
      await handleCreateVehicle(e);
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
      setVehicles([...(vehicles || []), res]);
      setShowAddModal(false);
      setFormData({
        plate: '', brand: '', model: '', year: new Date().getFullYear(),
        type: 'company', category: 'otomobil', chassis_number: '', engine_number: '',
        current_mileage: 0, status: 'active', package_name: '',
        transmission: 'manual', fuel_type: 'gasoline', color: '',
        body_type: '', paint_report: '{}', tramer_amount: 0,
        tramer_currency: 'GBP', buying_price: 0, buying_currency: 'GBP',
        currency: 'GBP', expenses: '[]', target_profit_margin: 0,
        description: '', images: [], virtual_tour_url: '',
        ai_tour_enabled: false, is_on_enrakipsiz: true,
        is_on_website: true,
        auto_post_instagram: false,
        market_story: '', technical_description: '', is_trade_in_available: false
      });
      alert(t.successSaved);
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createDriver({ ...driverFormData, store_id: storeId });
      if (res.error) {
        alert(res.error);
        return;
      }
      setDrivers([...(drivers || []), res]);
      setShowAddDriverModal(false);
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { vehicle_id, ...rest } = maintenanceFormData;
      const res = await api.createVehicleMaintenance(vehicle_id, rest);
      if (res.error) {
        alert(res.error);
        return;
      }
      setAllMaintenance([...(allMaintenance || []), res]);
      if (selectedVehicle && Number(vehicle_id) === selectedVehicle.id) {
        setMaintenance([...(maintenance || []), res]);
      }
      setShowAddMaintenanceModal(false);
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { vehicle_id, ...rest } = assignmentFormData;
      const res = await api.createVehicleAssignment(vehicle_id, rest);
      if (res.error) {
        alert(res.error);
        return;
      }
      setAllAssignments([...(allAssignments || []), res]);
      if (selectedVehicle && Number(vehicle_id) === selectedVehicle.id) {
        setAssignments([...(assignments || []), res]);
      }
      setShowAddAssignmentModal(false);
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleCreateMileage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { vehicle_id, ...rest } = mileageFormData;
      const res = await api.createVehicleMileage(vehicle_id, rest);
      if (res.error) {
        alert(res.error);
        return;
      }
      setAllMileage([...(allMileage || []), res]);
      if (selectedVehicle && Number(vehicle_id) === selectedVehicle.id) {
        setMileageLogs([...(mileageLogs || []), res]);
        setSelectedVehicle({ ...selectedVehicle, current_mileage: res.mileage });
        setVehicles(prev => (prev || []).map(v => v.id === selectedVehicle.id ? { ...v, current_mileage: res.mileage } : v));
      }
      setShowAddMileageModal(false);
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { vehicle_id, ...rest } = incidentFormData;
      const res = await api.createVehicleIncident(vehicle_id, rest);
      if (res.error) {
        alert(res.error);
        return;
      }
      setAllIncidents([...(allIncidents || []), res]);
      if (selectedVehicle && Number(vehicle_id) === selectedVehicle.id) {
        setIncidents([...(incidents || []), res]);
      }
      setShowAddIncidentModal(false);
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { vehicle_id, ...rest } = documentFormData;
      const res = await api.createVehicleDocument(vehicle_id, rest);
      if (res.error) {
        alert(res.error);
        return;
      }
      setAllDocuments([...(allDocuments || []), res]);
      if (selectedVehicle && Number(vehicle_id) === selectedVehicle.id) {
        setDocuments([...(documents || []), res]);
      }
      setShowAddDocumentModal(false);
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleSubmitDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDriver) {
      try {
        const res = await api.updateDriver(selectedDriver.id, driverFormData);
        if (res.error) {
          alert(res.error);
          return;
        }
        setDrivers((drivers || []).map(d => d.id === selectedDriver.id ? res : d));
        setShowAddDriverModal(false);
        setSelectedDriver(null);
      } catch (error) {
        alert(t.errorOccurred);
      }
    } else {
      await handleCreateDriver(e);
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
      setVehicles((vehicles || []).map(v => v.id === selectedVehicle.id ? res : v));
      setShowAddModal(false);
      setSelectedVehicle(res);
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleDeleteVehicle = async (id: number) => {
    if (!window.confirm(t.deleteVehicleConfirm)) return;
    try {
      await api.deleteVehicle(id);
      setVehicles((vehicles || []).filter(v => v.id !== id));
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleDeleteDocument = async (id: number) => {
    if (!window.confirm(t.deleteConfirm)) return;
    try {
      await api.deleteVehicleDocument(id);
      setDocuments((documents || []).filter(d => d.id !== id));
    } catch (error) {
      alert(t.errorDeletingDocument);
    }
  };

  const handleDeleteMaintenance = async (id: number) => {
    if (!window.confirm(t.deleteConfirm)) return;
    try {
      await api.deleteVehicleMaintenance(id);
      setMaintenance((maintenance || []).filter(m => m.id !== id));
    } catch (error) {
      alert(t.errorSavingMaintenance);
    }
  };

  const handleUpdateAssignment = async (id: number, data: any) => {
    try {
      const res = await api.updateVehicleAssignment(id, data);
      if (res.error) {
        alert(res.error);
        return;
      }
      setAssignments((assignments || []).map(a => a.id === id ? res : a));
    } catch (error) {
      alert(t.errorSavingAssignment);
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
    setShowAddMaintenanceModal(true);
  };

  const handleDeleteDriver = async (id: number) => {
    if (!window.confirm(t.deleteConfirm)) return;
    try {
      await api.deleteDriver(id);
      setDrivers((drivers || []).filter(d => d.id !== id));
    } catch (error) {
      alert(t.errorDeletingDriver);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'in_service': return 'bg-blue-100 text-blue-700';
      case 'broken': return 'bg-red-100 text-red-700';
      case 'sold': return 'bg-gray-100 text-gray-700';
      case 'for_sale': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return t.active;
      case 'in_service': return t.inService;
      case 'broken': return t.broken;
      case 'sold': return t.sold;
      case 'for_sale': return lang === 'tr' ? 'Satışta' : 'For Sale';
      default: return status;
    }
  };

  const getCurrentDriverName = (vehicleId: number) => {
    const activeAssignment = (allAssignments || []).find(a => a.vehicle_id === vehicleId && a.status === 'active');
    if (!activeAssignment) return '-';
    if (activeAssignment.driver_id) {
      const driver = (drivers || []).find(d => d.id === activeAssignment.driver_id);
      return driver ? driver.name : activeAssignment.user_email;
    }
    return activeAssignment.user_email;
  };

  const getVehiclePlate = (id: number) => (vehicles || []).find(v => v.id === id)?.plate || `ID: ${id}`;

  const exportToExcel = async () => {
    const XLSX = await import('xlsx');
    const data = (vehicles || []).map(v => ({
      [t.plate]: v.plate,
      [t.brand]: v.brand,
      [t.model]: v.model,
      [t.year]: v.year,
      [t.vehicleType]: v.type === 'company' ? t.company : t.personal,
      [t.currentMileage]: v.current_mileage,
      [t.status]: getStatusText(v.status),
      [t.driver]: getCurrentDriverName(v.id),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t.fleet);
    XLSX.writeFile(wb, `${t.fleetReport}_${format(new Date(), 'dd_MM_yyyy')}.xlsx`);
  };

  const exportToPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    doc.text(t.fleet, 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [[t.plate, t.brand, t.model, t.year, t.vehicleType, t.currentMileage, t.status, t.driver]],
      body: (vehicles || []).map(v => [
        v.plate, v.brand, v.model, v.year,
        v.type === 'company' ? t.company : t.personal,
        v.current_mileage, getStatusText(v.status), getCurrentDriverName(v.id)
      ]),
    });
    doc.save(`${t.fleetReport}_${format(new Date(), 'dd_MM_yyyy')}.pdf`);
  };

  const filteredVehicles = (vehicles || []).filter(v => {
    const matchesSearch = (v.plate?.toLowerCase() || '').includes((searchQuery || '').toLowerCase()) ||
                          (v.brand?.toLowerCase() || '').includes((searchQuery || '').toLowerCase()) ||
                          (v.model?.toLowerCase() || '').includes((searchQuery || '').toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    const matchesBrand = brandFilter === 'all' || !brandFilter || v.brand === brandFilter;
    const matchesModel = modelFilter === 'all' || !modelFilter || v.model === modelFilter;
    return matchesSearch && matchesStatus && matchesBrand && matchesModel;
  });

  const paginatedVehicles = filteredVehicles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const renderMainTabContent = () => {
    return (
      <FleetMainTabContent
        activeTab={activeMainTab}
        vehicles={vehicles}
        paginatedVehicles={paginatedVehicles}
        drivers={drivers}
        driverSearch={driverSearch}
        setDriverSearch={setDriverSearch}
        allDocuments={allDocuments}
        allAssignments={allAssignments}
        allMaintenance={allMaintenance}
        allMileageLogs={allMileage}
        allIncidents={allIncidents}
        allDriverDocuments={allDriverDocuments}
        lang={lang}
        t={t}
        isViewer={!!isViewer}
        getStatusColor={getStatusColor}
        getStatusText={getStatusText}
        generateVehicleTitle={generateVehicleTitle}
        getVehiclePlate={getVehiclePlate}
        safeFormatDate={safeFormatDate}
        setSelectedVehicle={setSelectedVehicle}
        fetchVehicleDetails={fetchVehicleDetails}
        setShowDetailModal={setShowDetailModal}
        setShareVehicle={setShareVehicle}
        setIsShareModalOpen={setIsShareModalOpen}
        setFormData={setFormData}
        setShowAddModal={setShowAddModal}
        handleDeleteVehicle={handleDeleteVehicle}
        setDriverFormData={setDriverFormData}
        setShowAddDriverModal={setShowAddDriverModal}
        setSelectedDriver={setSelectedDriver}
        fetchDriverDetails={fetchDriverDetails}
        setShowDriverDetailModal={setShowDriverDetailModal}
        handleDeleteDriver={handleDeleteDriver}
        handleEditMaintenance={handleEditMaintenance}
        handleDeleteMaintenance={handleDeleteMaintenance}
        handleUpdateAssignment={handleUpdateAssignment}
        handleDeleteIncident={async (id) => {
          if (!window.confirm(t.deleteConfirm)) return;
          try {
            await api.delete(`/api/fleet/vehicle-incidents/${id}`);
            setAllIncidents(allIncidents.filter(i => i.id !== id));
            setIncidents(incidents.filter(i => i.id !== id));
          } catch (error) {
            alert(t.errorOccurred);
          }
        }}
        handleDeleteDocument={handleDeleteDocument}
        setAutoContractVehicle={setAutoContractVehicle}
        setIsAutoContractOpen={setIsAutoContractOpen}
        setShowAddMaintenanceModal={setShowAddMaintenanceModal}
        setShowAddAssignmentModal={setShowAddAssignmentModal}
        setShowAddMileageModal={setShowAddMileageModal}
        setShowAddIncidentModal={setShowAddIncidentModal}
        setShowAddDocumentModal={setShowAddDocumentModal}
      />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">{t.fleetManagement}</h2>
          <p className="text-gray-500 font-medium">{t.fleetSubTitle}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {!isViewer && (
            <button
              onClick={() => {
                setEditingVehicle(null);
                setSelectedVehicle(null);
                setFormData({
                  plate: '', brand: '', model: '', year: new Date().getFullYear(),
                  type: 'company', chassis_number: '', engine_number: '',
                  current_mileage: 0, status: 'active', package_name: '',
                  transmission: 'manual', fuel_type: 'gasoline', color: '',
                  body_type: '', paint_report: '{}', tramer_amount: 0,
                  tramer_currency: 'GBP', buying_price: 0, buying_currency: 'GBP',
                  currency: 'GBP', expenses: '[]', target_profit_margin: 0,
                  description: '', images: [], virtual_tour_url: '',
                  ai_tour_enabled: false, is_on_enrakipsiz: true,
                  is_on_website: true,
                  auto_post_instagram: false
                });
                setShowAddModal(true);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              <Plus className="w-4 h-4" />
              {t.addVehicle}
            </button>
          )}
          <button onClick={exportToExcel} className="p-2.5 text-gray-500 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-200">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      <FleetStats
        vehicles={vehicles}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        brandFilter={brandFilter}
        setBrandFilter={setBrandFilter}
        modelFilter={modelFilter}
        setModelFilter={setModelFilter}
        setCurrentPage={setCurrentPage}
        lang={lang}
        t={t}
      />

      <div className="flex items-center gap-1.5 bg-gray-100/50 p-1.5 rounded-2xl overflow-x-auto max-w-full no-scrollbar whitespace-nowrap scroll-smooth shrink-0">
        {[
          { id: 'vehicles', icon: Car, label: t.vehicles },
          { id: 'drivers', icon: UserCheck, label: t.drivers },
          { id: 'maintenance', icon: Wrench, label: t.maintenance },
          { id: 'assignments', icon: ClipboardList, label: t.assignments },
          { id: 'mileage', icon: History, label: t.mileage },
          { id: 'incidents', icon: AlertTriangle, label: t.incidents },
          { id: 'obligations', icon: ShieldCheck, label: t.obligations },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveMainTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeMainTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {renderMainTabContent()}

      {/* Pagination Controls */}
      {activeMainTab === 'vehicles' && Math.ceil(filteredVehicles.length / itemsPerPage) > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.ceil(filteredVehicles.length / itemsPerPage) }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-xl text-sm font-bold transition-all ${
                  currentPage === i + 1
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredVehicles.length / itemsPerPage), p + 1))}
            disabled={currentPage === Math.ceil(filteredVehicles.length / itemsPerPage)}
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      <VehicleFormModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedVehicle(null);
        }}
        selectedVehicle={selectedVehicle}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        t={t}
        lang={lang}
        isTr={lang === 'tr'}
        generatingVehicleDesc={generatingVehicleDesc}
        handleGenerateVehicleDesc={handleGenerateVehicleDesc}
        vehicleAiNotice={vehicleAiNotice}
      />

      <VehicleDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        vehicle={selectedVehicle}
        t={t}
        lang={lang}
        isViewer={!!isViewer}
        activeVehicleTab={activeDetailTab}
        setActiveVehicleTab={setActiveDetailTab}
        documents={documents}
        maintenance={maintenance}
        assignments={assignments}
        mileageLogs={mileageLogs}
        incidents={incidents}
        drivers={drivers}
        getStatusColor={getStatusColor}
        getStatusText={getStatusText}
        generateVehicleTitle={generateVehicleTitle}
        onAddDocument={() => {
          if (!selectedVehicle) return;
          setDocumentFormData({
            vehicle_id: selectedVehicle.id,
            type: '',
            expiry_date: '',
            document_number: '',
            issue_date: '',
            document_url: '',
            notes: ''
          });
          setShowAddDocumentModal(true);
        }}
        onAddMaintenance={() => {
          if (!selectedVehicle) return;
          setMaintenanceFormData({
            vehicle_id: selectedVehicle.id,
            type: '',
            date: '',
            status: 'planned',
            cost: 0,
            currency: 'TRY',
            provider_name: '',
            notes: ''
          });
          setShowAddMaintenanceModal(true);
        }}
        onAddAssignment={() => {
          if (!selectedVehicle) return;
          setAssignmentFormData({
            vehicle_id: selectedVehicle.id,
            user_email: '',
            start_date: '',
            start_mileage: selectedVehicle.current_mileage || 0,
            status: 'active'
          });
          setShowAddAssignmentModal(true);
        }}
        onAddMileage={() => {
          if (!selectedVehicle) return;
          setMileageFormData({
            vehicle_id: selectedVehicle.id,
            date: '',
            mileage: selectedVehicle.current_mileage || 0
          });
          setShowAddMileageModal(true);
        }}
        onAddIncident={() => {
          if (!selectedVehicle) return;
          setIncidentFormData({
            vehicle_id: selectedVehicle.id,
            type: '',
            date: '',
            description: '',
            cost: 0
          });
          setShowAddIncidentModal(true);
        }}
        handleDeleteDocument={handleDeleteDocument}
        handleDeleteMaintenance={handleDeleteMaintenance}
        handleUpdateAssignment={handleUpdateAssignment}
        onEditVehicle={() => {
          if (!selectedVehicle) return;
          setFormData({
            plate: selectedVehicle.plate,
            brand: selectedVehicle.brand,
            model: selectedVehicle.model,
            year: selectedVehicle.year,
            type: selectedVehicle.type,
            chassis_number: selectedVehicle.chassis_number || '',
            engine_number: selectedVehicle.engine_number || '',
            current_mileage: selectedVehicle.current_mileage || 0,
            status: selectedVehicle.status || 'active',
            package_name: selectedVehicle.package_name || '',
            transmission: selectedVehicle.transmission || 'manual',
            fuel_type: selectedVehicle.fuel_type || 'gasoline',
            color: selectedVehicle.color || '',
            body_type: selectedVehicle.body_type || '',
            paint_report: typeof selectedVehicle.paint_report === 'string' ? selectedVehicle.paint_report : JSON.stringify(selectedVehicle.paint_report || {}),
            tramer_amount: selectedVehicle.tramer_amount || 0,
            tramer_currency: selectedVehicle.tramer_currency || 'GBP',
            buying_price: selectedVehicle.buying_price || 0,
            buying_currency: selectedVehicle.buying_currency || 'GBP',
            currency: selectedVehicle.currency || 'GBP',
            expenses: typeof selectedVehicle.expenses === 'string' ? selectedVehicle.expenses : JSON.stringify(selectedVehicle.expenses || []),
            target_profit_margin: selectedVehicle.target_profit_margin || 0,
            description: selectedVehicle.description || '',
            market_story: selectedVehicle.market_story || '',
            technical_description: selectedVehicle.technical_description || '',
            is_trade_in_available: selectedVehicle.is_trade_in_available || false,
            images: selectedVehicle.images || [],
            virtual_tour_url: selectedVehicle.virtual_tour_url || '',
            ai_tour_enabled: selectedVehicle.ai_tour_enabled || false,
            category: selectedVehicle.category || 'otomobil',
            is_on_enrakipsiz: selectedVehicle.is_on_enrakipsiz !== undefined ? selectedVehicle.is_on_enrakipsiz : true,
            is_on_website: selectedVehicle.is_on_website !== undefined ? selectedVehicle.is_on_website : true,
            auto_post_instagram: selectedVehicle.auto_post_instagram || false
          });
          setShowAddModal(true);
        }}
      />

      <AutoContractModal
        isOpen={isAutoContractOpen}
        onClose={() => {
          setIsAutoContractOpen(false);
          setAutoContractVehicle(null);
        }}
        vehicle={autoContractVehicle}
        storeName={branding?.store_name || branding?.name || (lang === 'tr' ? "Seçkin Otomotiv" : "Premium Automotive")}
        branding={branding}
      />
      <AutomotiveSocialMediaShareModal
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setShareVehicle(null);
        }}
        vehicle={shareVehicle}
        branding={branding}
      />

      <DriverFormModal
        isOpen={showAddDriverModal}
        onClose={() => setShowAddDriverModal(false)}
        lang={lang}
        formData={driverFormData}
        setFormData={setDriverFormData}
        handleSubmit={handleSubmitDriver}
      />

      <MaintenanceFormModal
        isOpen={showAddMaintenanceModal}
        onClose={() => setShowAddMaintenanceModal(false)}
        lang={lang}
        formData={maintenanceFormData}
        setFormData={setMaintenanceFormData}
        handleSubmit={handleCreateMaintenance}
        vehicles={vehicles || []}
      />

      <AssignmentFormModal
        isOpen={showAddAssignmentModal}
        onClose={() => setShowAddAssignmentModal(false)}
        lang={lang}
        formData={assignmentFormData}
        setFormData={setAssignmentFormData}
        handleSubmit={handleCreateAssignment}
        vehicles={vehicles || []}
        drivers={drivers || []}
      />

      <MileageFormModal
        isOpen={showAddMileageModal}
        onClose={() => setShowAddMileageModal(false)}
        lang={lang}
        formData={mileageFormData}
        setFormData={setMileageFormData}
        handleSubmit={handleCreateMileage}
        vehicles={vehicles || []}
      />

      <IncidentFormModal
        isOpen={showAddIncidentModal}
        onClose={() => setShowAddIncidentModal(false)}
        lang={lang}
        formData={incidentFormData}
        setFormData={setIncidentFormData}
        handleSubmit={handleCreateIncident}
        vehicles={vehicles || []}
      />

      <DocumentFormModal
        isOpen={showAddDocumentModal}
        onClose={() => setShowAddDocumentModal(false)}
        lang={lang}
        formData={documentFormData}
        setFormData={setDocumentFormData}
        handleSubmit={handleCreateDocument}
        vehicles={vehicles || []}
      />
    </div>
  );
};

export default FleetTab;
