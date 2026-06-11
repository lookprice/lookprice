import React, { useState, useEffect } from 'react';
import {
  Car,
  Plus,
  FileText,
  Wrench,
  UserCheck,
  History,
  AlertTriangle,
  Download,
  CheckCircle2,
  X,
  FileSignature,
  Eye,
  Edit2,
  Trash2,
  MoreVertical,
  Share2,
  Search,
  Filter,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AutomotiveSocialMediaShareModal } from '../../components/AutomotiveSocialMediaShareModal';
import { AutoContractModal } from '../../components/AutoContractModal';

import { AnimatePresence } from 'motion/react';
import { api } from '../../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { translations } from '../../translations';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  Vehicle, 
  Driver, 
  VehicleDocument, 
  VehicleMaintenance, 
  VehicleAssignment, 
  VehicleMileage, 
  VehicleIncident 
} from '../../types';
import { FleetStats } from '../../components/dashboard/fleet/FleetStats';
import { FleetMainTabContent } from '../../components/dashboard/fleet/FleetMainTabContent';
import { VehicleFormModal } from '../../components/dashboard/fleet/VehicleFormModal';
import { VehicleDetailModal } from '../../components/dashboard/fleet/VehicleDetailModal';

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
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showMileageModal, setShowMileageModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);

  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editingDocument, setEditingDocument] = useState<VehicleDocument | null>(null);
  const [editingMaintenance, setEditingMaintenance] = useState<VehicleMaintenance | null>(null);
  const [editingIncident, setEditingIncident] = useState<VehicleIncident | null>(null);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [driverFile, setDriverFile] = useState<File | null>(null);
  const [newDriverDoc, setNewDriverDoc] = useState<any>({
    type: '',
    expiry_date: '',
    is_recurring: false,
    recurrence_period: '1 year'
  });

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
  const [driverSearch, setDriverSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [documentFormData, setDocumentFormData] = useState<any>({ 
    type: 'registration', 
    status: 'valid',
    is_recurring: false,
    recurrence_period: '1 year'
  });
  const [maintenanceFormData, setMaintenanceFormData] = useState<Partial<VehicleMaintenance>>({ type: 'routine', status: 'planned' } as any);
  const [assignmentFormData, setAssignmentFormData] = useState<Partial<VehicleAssignment>>({ 
    status: 'active',
    start_date: new Date().toISOString().split('T')[0]
  } as any);
  const [mileageFormData, setMileageFormData] = useState<Partial<VehicleMileage>>({});
  const [incidentFormData, setIncidentFormData] = useState<Partial<VehicleIncident>>({ type: 'accident', status: 'open' });
  const [driverFormData, setDriverFormData] = useState<Partial<Driver>>({ status: 'active' });

  // AI & Luxury Presentation States
  const [generatingVehicleDesc, setGeneratingVehicleDesc] = useState(false);
  const [processingVehicleMedia, setProcessingVehicleMedia] = useState<string | null>(null);
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

  const handleAIVariantStaging = async (style: string) => {
    setProcessingVehicleMedia('staging');
    try {
      const coverUrl = (formData.images && formData.images[0]) || '';
      const res = await api.post("/api/store/ai-virtual-staging", { imageUrl: coverUrl, style });
      if (res.stagedUrl) {
        setFormData(prev => ({ ...prev, images: [res.stagedUrl] }));
        setVehicleAiNotice(`✅ Aracın ortam kalitesi ve yansımaları "${style.toUpperCase()}" showroom moduna ölçeklendi!`);
        setTimeout(() => setVehicleAiNotice(null), 6000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingVehicleMedia(null);
    }
  };

  const handleAIEnhanceExposure = async () => {
    setProcessingVehicleMedia('enhance');
    try {
      const coverUrl = (formData.images && formData.images[0]) || '';
      const res = await api.post("/api/store/ai-image-enhance", { imageUrl: coverUrl });
      if (res.enhancedUrl) {
        setFormData(prev => ({ ...prev, images: [res.enhancedUrl] }));
        setVehicleAiNotice("✅ Aracın parlamaları, gölge dengesi ve ortam ışığı yapay zeka ile optimize edildi!");
        setTimeout(() => setVehicleAiNotice(null), 6000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingVehicleMedia(null);
    }
  };

  const handleAIAnonymizePlate = async () => {
    setProcessingVehicleMedia('blur');
    try {
      const coverUrl = (formData.images && formData.images[0]) || '';
      const res = await api.post("/api/store/ai-blur-privacy", { imageUrl: coverUrl, type: 'vehicle' });
      if (res.anonymizedUrl) {
        setFormData(prev => ({ ...prev, images: [res.anonymizedUrl] }));
        setVehicleAiNotice("✅ Araç plaka ve cam yansımalarındaki insan yüzleri yapay zeka ile blurlanarak gizlendi!");
        setTimeout(() => setVehicleAiNotice(null), 6000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingVehicleMedia(null);
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
    is_on_enrakipsiz: false
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
        type: 'company', chassis_number: '', engine_number: '',
        current_mileage: 0, status: 'active', package_name: '',
        transmission: 'manual', fuel_type: 'gasoline', color: '',
        body_type: '', paint_report: '{}', tramer_amount: 0,
        tramer_currency: 'GBP', buying_price: 0, buying_currency: 'GBP',
        currency: 'GBP', expenses: '[]', target_profit_margin: 0,
        description: '', images: [], virtual_tour_url: '',
        ai_tour_enabled: false, is_on_enrakipsiz: false,
        market_story: '', technical_description: '', is_trade_in_available: false
      });
      alert(t.successSaved);
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
      setVehicles((vehicles || []).map(v => v.id === selectedVehicle.id ? res : v));
      setShowAddModal(false);
      setSelectedVehicle(null);
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
    setShowMaintenanceModal(true);
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

  const exportToExcel = () => {
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

  const exportToPDF = () => {
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
    return matchesSearch && matchesStatus;
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
                setFormData({
                  plate: '', brand: '', model: '', year: new Date().getFullYear(),
                  type: 'company', chassis_number: '', engine_number: '',
                  current_mileage: 0, status: 'active', package_name: '',
                  transmission: 'manual', fuel_type: 'gasoline', color: '',
                  body_type: '', paint_report: '{}', tramer_amount: 0,
                  tramer_currency: 'GBP', buying_price: 0, buying_currency: 'GBP',
                  currency: 'GBP', expenses: '[]', target_profit_margin: 0,
                  description: '', images: [], virtual_tour_url: '',
                  ai_tour_enabled: false, is_on_enrakipsiz: false
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
        setCurrentPage={setCurrentPage}
        lang={lang}
        t={t}
      />

      <div className="flex flex-wrap items-center gap-2 bg-gray-100/50 p-1.5 rounded-2xl w-fit">
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

      <VehicleFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        selectedVehicle={selectedVehicle}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        t={t}
        lang={lang}
        isTr={lang === 'tr'}
        generatingVehicleDesc={generatingVehicleDesc}
        handleGenerateVehicleDesc={handleGenerateVehicleDesc}
        processingVehicleMedia={processingVehicleMedia}
        vehicleAiNotice={vehicleAiNotice}
        handleAIVirtualStage={handleAIVariantStaging}
        handleAIEnhanceExposure={handleAIEnhanceExposure}
        handleAIAnonymizePlate={handleAIAnonymizePlate}
        generatingVehicleTour={false} // Needs to be connected if available
        handleGenerateVehicle360Tour={() => {}} // Needs to be connected if available
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
        onAddDocument={() => {}}
        onAddMaintenance={() => {}}
        onAddAssignment={() => {}}
        onAddMileage={() => {}}
        onAddIncident={() => {}}
        handleDeleteDocument={handleDeleteDocument}
        handleDeleteMaintenance={handleDeleteMaintenance}
        handleUpdateAssignment={handleUpdateAssignment}
      />

      <AutoContractModal
        isOpen={isAutoContractOpen}
        onClose={() => {
          setIsAutoContractOpen(false);
          setAutoContractVehicle(null);
        }}
        vehicle={autoContractVehicle}
        storeName="LookPrice Premium Gallery"
      />
      <AutomotiveSocialMediaShareModal
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setShareVehicle(null);
        }}
        vehicle={shareVehicle}
        branding={{ store_name: "LookPrice Premium Gallery" }}
      />
    </div>
  );
};

export default FleetTab;
