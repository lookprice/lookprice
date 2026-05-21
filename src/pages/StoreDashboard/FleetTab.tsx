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
  User,
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
  Upload,
  Phone,
  ClipboardList,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Compass,
  Cpu,
  Image,
  Shield
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
  documents?: { id: number; type: string; url: string; expiry_date?: string }[];
  expiring_docs?: number;
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
  status: 'active' | 'in_service' | 'broken' | 'sold' | 'for_sale';
  selling_price?: number;
  currency?: string;
  package_name?: string;
  transmission?: 'manual' | 'automatic' | 'dual_clutch' | 'semi_automatic';
  fuel_type?: 'gasoline' | 'diesel' | 'lpg' | 'hybrid' | 'electric';
  color?: string;
  body_type?: string;
  paint_report?: string | Record<string, 'original' | 'painted' | 'replaced'>;
  tramer_amount?: number;
  tramer_currency?: string;
  buying_price?: number;
  expenses?: string | { id: string; name: string; amount: number; date: string }[];
  target_profit_margin?: number;
  description?: string;
  images?: string[];
  virtual_tour_url?: string;
  ai_tour_enabled?: boolean;
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
  is_recurring: boolean;
  recurrence_period?: string;
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
  driver_id?: number;
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
  purpose?: string;
  expense_amount?: number;
  expense_type?: string;
  duration_minutes?: number;
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
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  
  // Custom Loan Calculator States
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [loanTerm, setLoanTerm] = useState<number>(36);
  const [loanRate, setLoanRate] = useState<number>(2.49);

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
      // Skip "Ruhsat-Koçan" documents
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

  const alerts = getAlerts();

  const [statusFilter, setStatusFilter] = useState('all');
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
  const [mileageFormData, setMileageFormData] = useState<Partial<VehicleMileageLog>>({});
  const [incidentFormData, setIncidentFormData] = useState<Partial<VehicleIncident>>({ type: 'accident', status: 'open' });
  const [driverFormData, setDriverFormData] = useState<Partial<Driver>>({ status: 'active' });

  // AI & Luxury Presentation States
  const [generatingVehicleDesc, setGeneratingVehicleDesc] = useState(false);
  const [processingVehicleMedia, setProcessingVehicleMedia] = useState<string | null>(null); // 'staging' | 'enhance' | 'blur'
  const [vehicleAiNotice, setVehicleAiNotice] = useState<string | null>(null);

  const [generatingVehicleTour, setGeneratingVehicleTour] = useState(false);
  const [activeVehicleTourNode, setActiveVehicleTourNode] = useState<any>(null);
  const [vehicleTourBlueprint, setVehicleTourBlueprint] = useState<any>(null);

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
        tramerAmount: formData.tramer_amount,
        tramerCurrency: formData.tramer_currency,
        sellingPrice: formData.selling_price,
        currency: formData.currency,
        lang: 'tr'
      });
      if (res.text) {
        setFormData(prev => ({ ...prev, description: res.text }));
        setVehicleAiNotice("✅ Araç portföy hikayesi ve teknik açıklama yapay zeka tarafından başarıyla oluşturuldu!");
        setTimeout(() => setVehicleAiNotice(null), 5000);
      } else if (res.error) {
        alert("Açıklama üretilirken hata oluştu: " + res.error);
      }
    } catch (err: any) {
      console.error(err);
      alert("Açıklama üretme isteği başarısız oldu.");
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

  const handleGenerateVehicle360Tour = async () => {
    setGeneratingVehicleTour(true);
    try {
      const res = await api.post("/api/store/ai-3d-tour", { name: `${formData.brand} ${formData.model}`, type: 'automotive' });
      if (res.success) {
        setVehicleTourBlueprint(res);
        if (res.nodes && res.nodes.length > 0) {
          setActiveVehicleTourNode(res.nodes[0]);
        }
        setFormData(prev => ({ 
          ...prev, 
          virtual_tour_url: res.targetIframeUrl,
          ai_tour_enabled: true 
        }));
        setVehicleAiNotice("🏠 Yapay zeka tüm araç açılarından 360 derecelik sanal kokpit ve kaporta turunu oluşturdu!");
        setTimeout(() => setVehicleAiNotice(null), 6000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingVehicleTour(false);
    }
  };

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
    status: 'active',
    package_name: '',
    transmission: 'manual',
    fuel_type: 'gasoline',
    color: '',
    body_type: '',
    paint_report: '{}',
    tramer_amount: 0,
    tramer_currency: 'TRY',
    buying_price: 0,
    expenses: '[]',
    target_profit_margin: 0,
    description: '',
    images: [],
    virtual_tour_url: '',
    ai_tour_enabled: false
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
        tramer_currency: 'TRY',
        buying_price: 0,
        expenses: '[]',
        target_profit_margin: 0
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
        const res = await api.updateVehicleDocument(editingDocument.id, { 
          ...documentFormData, 
          document_url,
          is_recurring: documentFormData.is_recurring,
          recurrence_period: documentFormData.recurrence_period
        });
        if (res.error) {
          alert(res.error);
          return;
        }
        setDocuments((documents || []).map(d => d.id === editingDocument.id ? res : d));
      } else {
        const res = await api.createVehicleDocument(selectedVehicle.id, { 
          ...documentFormData, 
          document_url,
          is_recurring: documentFormData.is_recurring,
          recurrence_period: documentFormData.recurrence_period
        });
        if (res.error) {
          alert(res.error);
          return;
        }
        setDocuments([...(documents || []), res]);
      }
      
      setShowDocumentModal(false);
      setEditingDocument(null);
      setDocumentFile(null);
      setDocumentFormData({ 
        type: 'insurance', 
        status: 'valid',
        is_recurring: false,
        recurrence_period: '1 year'
      } as any);
    } catch (error) {
      alert(t.errorSavingDocument);
    }
  };

  const handleEditDocument = (doc: VehicleDocument) => {
    setEditingDocument(doc);
    setDocumentFormData({
      type: doc.type,
      expiry_date: doc.expiry_date ? doc.expiry_date.split('T')[0] : '',
      notes: doc.notes,
      document_url: doc.document_url,
      is_recurring: doc.is_recurring,
      recurrence_period: doc.recurrence_period || '1 year'
    } as any);
    setShowDocumentModal(true);
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
        setMaintenance((maintenance || []).map(m => m.id === editingMaintenance.id ? res : m));
      } else {
        const res = await api.createVehicleMaintenance(selectedVehicle.id, maintenanceFormData);
        if (res.error) {
          alert(res.error);
          return;
        }
        setMaintenance([...(maintenance || []), res]);
      }
      
      setShowMaintenanceModal(false);
      setEditingMaintenance(null);
      setMaintenanceFormData({ type: 'routine', status: 'planned' } as any);
    } catch (error) {
      alert(t.errorSavingMaintenance);
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

  const handleEditIncident = (i: VehicleIncident) => {
    setEditingIncident(i);
    setIncidentFormData({
      type: i.type,
      date: i.date ? i.date.split('T')[0] : '',
      description: i.description,
      cost: i.cost,
      status: i.status,
      report_url: i.report_url
    });
    setShowIncidentModal(true);
  };

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    try {
      if (assignmentFormData.status === 'returned' && (assignmentFormData as any).id) {
        const res = await api.updateVehicleAssignment((assignmentFormData as any).id, assignmentFormData);
        if (res.error) {
          alert(res.error);
          return;
        }
        setAssignments((assignments || []).map(a => a.id === (assignmentFormData as any).id ? res : a));
        setAllAssignments((allAssignments || []).map(a => a.id === (assignmentFormData as any).id ? res : a));
      } else {
        const res = await api.createVehicleAssignment(selectedVehicle.id, assignmentFormData);
        if (res.error) {
          alert(res.error);
          return;
        }
        setAssignments([...(assignments || []), res]);
        setAllAssignments([...(allAssignments || []), res]);
      }
      setShowAssignmentModal(false);
      setAssignmentFormData({ 
        status: 'active',
        start_date: new Date().toISOString().split('T')[0]
      } as any);
    } catch (error) {
      alert(t.errorSavingAssignment);
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
      setMileageLogs([...(mileageLogs || []), res]);
      setShowMileageModal(false);
      setMileageFormData({});
      setVehicles((vehicles || []).map(v => v.id === selectedVehicle.id ? { ...v, current_mileage: res.mileage } : v));
    } catch (error) {
      alert(t.errorAddingMileage);
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
      setIncidents([...(incidents || []), res]);
      setShowIncidentModal(false);
      setIncidentFormData({ type: 'accident', status: 'open' });
    } catch (error) {
      alert(t.errorAddingIncident);
    }
  };

  const handleUploadDriverDocument = async (driverId: number) => {
    if (!driverFile || !newDriverDoc.type) {
      alert(t.selectFileAndType);
      return;
    }
    const formData = new FormData();
    formData.append('file', driverFile);
    formData.append('type', newDriverDoc.type);
    formData.append('expiry_date', newDriverDoc.expiry_date);
    formData.append('is_recurring', String(newDriverDoc.is_recurring));
    formData.append('recurrence_period', newDriverDoc.recurrence_period);
    
    try {
      const res = await api.uploadDriverDocument(driverId, formData);
      if (res.error) {
        alert(res.error);
        return;
      }
      setDriverDocuments([...(driverDocuments || []), res]);
      setDrivers(drivers.map(d => d.id === driverId ? { ...d, documents: [...(d.documents || []), res] } : d));
      if (editingDriver && editingDriver.id === driverId) {
        setEditingDriver({ ...editingDriver, documents: [...(editingDriver.documents || []), res] });
      }
      setDriverFile(null);
      setNewDriverDoc({
        type: '',
        expiry_date: '',
        is_recurring: false,
        recurrence_period: '1 year'
      });
    } catch (error) {
      alert(t.errorSavingDocument);
    }
  };

  const handleDeleteDriverDocument = async (docId: number) => {
    if (!confirm(t.deleteConfirm)) return;
    try {
      await api.deleteDriverDocument(docId);
      setDrivers(drivers.map(d => ({ ...d, documents: (d.documents || []).filter(doc => doc.id !== docId) })));
      setEditingDriver({ ...editingDriver!, documents: (editingDriver!.documents || []).filter(doc => doc.id !== docId) });
    } catch (error) {
      alert(t.errorDeletingDocument);
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
        setDrivers((drivers || []).map(d => d.id === editingDriver.id ? res : d));
      } else {
        const res = await api.createDriver({ ...driverFormData, store_id: storeId });
        if (res.error) {
          alert(res.error);
          return;
        }
        setDrivers([...(drivers || []), res]);
      }
      setShowDriverModal(false);
      setEditingDriver(null);
      setDriverFormData({ status: 'active' });
    } catch (error) {
      alert(t.errorSavingDriver);
    }
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

  const filteredVehicles = (vehicles || []).filter(v => {
    const matchesSearch = (v.plate?.toLowerCase() || '').includes((searchQuery || '').toLowerCase()) ||
                          (v.brand?.toLowerCase() || '').includes((searchQuery || '').toLowerCase()) ||
                          (v.model?.toLowerCase() || '').includes((searchQuery || '').toLowerCase());
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
      [t.chassisNumber]: v.chassis_number,
      [t.engineNumber]: v.engine_number
    }));
    const docData = allDocuments.map(d => ({
      [t.plate]: d.plate,
      [t.type]: d.type,
      [t.lastValidity]: d.expiry_date
    }));
    const ws = XLSX.utils.json_to_sheet(docData);
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
        v.plate,
        v.brand,
        v.model,
        v.year,
        v.type === 'company' ? t.company : t.personal,
        v.current_mileage,
        getStatusText(v.status),
        getCurrentDriverName(v.id)
      ]),
    });
    doc.save(`${t.fleetReport}_${format(new Date(), 'dd_MM_yyyy')}.pdf`);
  };

  const getVehiclePlate = (id: number) => (vehicles || []).find(v => v.id === id)?.plate || `ID: ${id}`;

  const renderVehiclesTab = () => {
    const filteredVehicles = (vehicles || []).filter(v => 
      (v.plate?.toLowerCase() || '').includes((searchQuery || '').toLowerCase()) ||
      (v.brand?.toLowerCase() || '').includes((searchQuery || '').toLowerCase()) ||
      (v.model?.toLowerCase() || '').includes((searchQuery || '').toLowerCase())
    );
    const paginatedVehicles = filteredVehicles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);

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
                    <p className="font-black text-gray-900 text-lg">{vehicle.plate}</p>
                    <p className="text-xs text-gray-500 font-medium">{vehicle.brand} {vehicle.model}</p>
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
              
              <div className="grid grid-cols-2 gap-4 py-3 border-y border-gray-50">
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t.alerts}</span>
                  <div className="flex flex-wrap gap-1">
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
                    {!(vehicle.expiring_docs || 0) && !(vehicle.maintenance_due || 0) && (
                      <span className="text-[10px] text-green-500 font-bold">{t.noProblem}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedVehicle(vehicle);
                      fetchVehicleDetails(vehicle);
                      setShowDetailModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    {t.details}
                  </button>
                  {!isViewer && (
                    <div className="flex gap-2">
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
                            expenses: typeof vehicle.expenses === 'string' ? vehicle.expenses : JSON.stringify(vehicle.expenses || []),
                            target_profit_margin: vehicle.target_profit_margin || 0
                          });
                          setShowAddModal(true);
                        }}
                        className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 hover:bg-amber-100 transition-all"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                        className="p-2.5 bg-red-50 text-red-600 rounded-xl border border-red-100 hover:bg-red-100 transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
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
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t.vehicleInfo}</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t.status}</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">KM</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t.alerts}</th>
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
                        <div className="flex justify-end gap-2">
                          {vehicle.status === 'for_sale' && (
                            <button
                              onClick={() => window.open(`https://enrakipsiz.com/arac/${vehicle.id}`, '_blank')}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                              title="Portalda Gör"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedVehicle(vehicle);
                              fetchVehicleDetails(vehicle);
                              setShowDetailModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-200 rounded-xl disabled:opacity-50 font-bold text-sm hover:bg-gray-50 transition-all"
                >
                  {t.prev}
                </button>
                <div className="flex items-center gap-1">
                  <span className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg text-sm font-bold">{currentPage}</span>
                  <span className="text-gray-400">/</span>
                  <span className="text-sm font-bold text-gray-600">{totalPages}</span>
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-200 rounded-xl disabled:opacity-50 font-bold text-sm hover:bg-gray-50 transition-all"
                >
                  {t.next}
                </button>
              </div>
            )}
          </div>
        </div>
    );
  };

  const renderDriversTab = () => {
    const filteredDrivers = (drivers || []).filter(d => 
      (d.name?.toLowerCase() || '').includes((searchQuery || '').toLowerCase()) ||
      (d.license_number?.toLowerCase() || '').includes((searchQuery || '').toLowerCase())
    );

    return (
      <div className="space-y-4">
        {/* Mobile Card View */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {filteredDrivers.map((driver) => (
            <div key={driver.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-black text-gray-900 text-lg">{driver.name}</p>
                    <p className="text-xs text-gray-500 font-medium">{driver.license_number}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${driver.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {driver.status === 'active' ? t.active : t.passive}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 py-3 border-y border-gray-50">
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t.contact}</span>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1 text-xs font-bold text-gray-700">
                      <Phone className="w-3 h-3 text-gray-400" />
                      {driver.phone}
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t.license}</span>
                  <div className="flex items-center gap-1 text-xs font-bold text-gray-700">
                    <FileText className="w-3 h-3 text-gray-400" />
                    {driver.license_class} {t.class}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedDriver(driver);
                    fetchDriverDetails(driver);
                    setShowDriverDetailModal(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 transition-all"
                >
                  <Eye className="w-4 h-4" />
                  {t.details}
                </button>
                {!isViewer && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingDriver(driver);
                        setDriverFormData(driver);
                        setShowDriverModal(true);
                      }}
                      className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 hover:bg-amber-100 transition-all"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteDriver(driver.id)}
                      className="p-2.5 bg-red-50 text-red-600 rounded-xl border border-red-100 hover:bg-red-100 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {filteredDrivers.length === 0 && (
            <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center text-gray-500">
              {t.noDrivers}
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-500">{driver.license_class} {t.class}</p>
                            {(driver.expiring_docs || 0) > 0 && (
                              <span className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded text-[10px] font-black animate-pulse">
                                {driver.expiring_docs} {t.driverDoc}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-700">{driver.license_number}</td>
                    <td className="p-4 text-sm text-gray-700">{driver.phone}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        driver.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {driver.status === 'active' ? t.active : t.passive}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedDriver(driver);
                            fetchDriverDetails(driver);
                            setShowDriverDetailModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
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
      </div>
    );
  };

  const renderMaintenanceTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {allMaintenance.map(m => (
          <div key={m.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 transition-all group">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all">
                  <Wrench className="w-6 h-6 text-orange-600 group-hover:text-white" />
                </div>
                <div>
                  <h4 className="font-black text-gray-900">{m.type}</h4>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 mt-1">
                    <span className="font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{getVehiclePlate(m.vehicle_id)}</span>
                    <span className="opacity-30">•</span>
                    <span className="font-bold">{safeFormatDate(m.date, 'dd.MM.yyyy')}</span>
                    <span className="opacity-30">•</span>
                    <span className="font-medium">{m.provider_name}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-6 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-50">
                <div className="text-left sm:text-right">
                  <p className="font-black text-gray-900 text-lg">{(m.cost || 0).toLocaleString()} {m.currency}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                    m.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {m.status === 'completed' ? t.completed : t.planned}
                  </span>
                </div>
                <div className="flex gap-2">
                  {m.invoice_url && (
                    <a 
                      href={m.invoice_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                      title={t.downloadInvoice}
                    >
                      <Download className="w-5 h-5" />
                    </a>
                  )}
                  {!isViewer && (
                    <button 
                      onClick={() => {
                        const vehicle = (vehicles || []).find(v => v.id === m.vehicle_id);
                        if (vehicle) {
                          setSelectedVehicle(vehicle);
                          handleEditMaintenance(m);
                        }
                      }} 
                      className="p-2.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-all"
                      title={t.edit}
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            {(m.next_maintenance_date || m.next_maintenance_mileage) && (
              <div className="mt-4 p-3 bg-gray-50 rounded-xl flex flex-wrap gap-4">
                {m.next_maintenance_date && (
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t.nextDate}</span>
                    <span className="text-xs font-black text-amber-600">{safeFormatDate(m.next_maintenance_date, 'dd.MM.yyyy')}</span>
                  </div>
                )}
                {m.next_maintenance_mileage && (
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t.nextKM}</span>
                    <span className="text-xs font-black text-amber-600">{m.next_maintenance_mileage.toLocaleString()} KM</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {allMaintenance.length === 0 && (
        <div className="py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
          <Wrench className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-bold">{t.noMaintenanceFound}</p>
        </div>
      )}
    </div>
  );

  const renderAssignmentsTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {allAssignments.map(a => (
        <div key={a.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-purple-200 transition-all group">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all">
                <UserCheck className="w-6 h-6 text-purple-600 group-hover:text-white" />
              </div>
              <div>
                <h4 className="font-black text-gray-900">{a.user_email}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-black uppercase tracking-wider">
                    {getVehiclePlate(a.vehicle_id)}
                  </span>
                </div>
              </div>
            </div>
            <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider ${
              a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {a.status === 'active' ? t.active : t.returned}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 rounded-2xl mb-4">
            <div className="space-y-2">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">{t.received}</p>
              <div className="space-y-1">
                <p className="text-sm font-black text-gray-800">{safeFormatDate(a.start_date, 'dd.MM.yyyy')}</p>
                <p className="text-xs font-bold text-blue-600">{(a.start_mileage || 0).toLocaleString()} KM</p>
              </div>
            </div>
            {a.end_date ? (
              <div className="space-y-2 border-l border-gray-200 pl-6">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">{t.returned}</p>
                <div className="space-y-1">
                  <p className="text-sm font-black text-gray-800">{safeFormatDate(a.end_date, 'dd.MM.yyyy')}</p>
                  <p className="text-xs font-bold text-blue-600">{(a.end_mileage || 0).toLocaleString()} KM</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center border-l border-gray-200 pl-6">
                <span className="text-[10px] text-gray-300 font-black uppercase tracking-widest">{t.ongoing}</span>
              </div>
            )}
          </div>

          {!isViewer && a.status === 'active' && (
            <button
              onClick={() => {
                const vehicle = (vehicles || []).find(v => v.id === a.vehicle_id);
                if (vehicle) {
                  setSelectedVehicle(vehicle);
                  setAssignmentFormData({
                    id: a.id,
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
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
            >
              <History className="w-4 h-4" />
              {t.returnAssignment}
            </button>
          )}
        </div>
      ))}
      {allAssignments.length === 0 && (
        <div className="col-span-full py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
          <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-bold">{t.noAssignmentFound}</p>
        </div>
      )}
    </div>
  );

  const renderMileageTab = () => (
    <div className="space-y-4">
      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {allMileage.map(log => (
          <div key={log.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">{t.vehicle}</p>
                  <p className="font-black text-gray-900">{getVehiclePlate(log.vehicle_id)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">{t.date}</p>
                <p className="text-xs font-bold text-gray-700">{safeFormatDate(log.date, 'dd.MM.yyyy')}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">{t.kilometer}</p>
                <p className="text-lg font-black text-blue-600">{(log.mileage || 0).toLocaleString()} KM</p>
              </div>
              {log.notes && (
                <div className="max-w-[150px] text-right">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">{t.note}</p>
                  <p className="text-[10px] text-gray-600 line-clamp-2">{log.notes}</p>
                </div>
              )}
            </div>
          </div>
        ))}
        {allMileage.length === 0 && (
          <div className="py-12 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
            <p className="text-gray-500 font-bold">{t.noMileageFound}</p>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-wider">{t.date}</th>
              <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-wider">{t.vehicles}</th>
              <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-wider">KM</th>
              <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-wider">{t.notes}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {allMileage.map(log => (
              <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 text-sm font-bold text-gray-700">{safeFormatDate(log.date, 'dd.MM.yyyy HH:mm')}</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-black">
                    {getVehiclePlate(log.vehicle_id)}
                  </span>
                </td>
                <td className="p-4 text-sm font-black text-gray-900">{(log.mileage || 0).toLocaleString()} KM</td>
                <td className="p-4 text-sm text-gray-500">{log.notes || '-'}</td>
              </tr>
            ))}
            {allMileage.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  {t.noMileageFound}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderIncidentsTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {allIncidents.map(i => (
          <div key={i.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-red-200 transition-all group">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all">
                  <AlertTriangle className="w-6 h-6 text-red-600 group-hover:text-white" />
                </div>
                <div>
                  <h4 className="font-black text-gray-900">{i.type}</h4>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 mt-1">
                    <span className="font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{getVehiclePlate(i.vehicle_id)}</span>
                    <span className="opacity-30">•</span>
                    <span className="font-bold">{safeFormatDate(i.date, 'dd.MM.yyyy')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-6 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-50">
                <div className="text-left sm:text-right">
                  <p className="font-black text-gray-900 text-lg">{(i.cost || 0).toLocaleString()} {i.currency}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                    i.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {i.status === 'resolved' ? t.resolved : t.pending}
                  </span>
                </div>
                <div className="flex gap-2">
                  {i.report_url && (
                    <a 
                      href={i.report_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                      title={t.downloadReport}
                    >
                      <Download className="w-5 h-5" />
                    </a>
                  )}
                  {!isViewer && (
                    <button 
                      onClick={() => {
                        const vehicle = (vehicles || []).find(v => v.id === i.vehicle_id);
                        if (vehicle) {
                          setSelectedVehicle(vehicle);
                          handleEditIncident(i);
                        }
                      }} 
                      className="p-2.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-all"
                      title={t.edit}
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            {i.description && (
              <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">{t.description}</p>
                <p className="text-xs text-gray-600 leading-relaxed">{i.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      {allIncidents.length === 0 && (
        <div className="py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
          <AlertTriangle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-bold">{t.noIncidentFound}</p>
        </div>
      )}
    </div>
  );

  const renderObligationsTab = () => {
    const vehicleObligations = allDocuments.filter(d => ['insurance', 'kasko', 'tax', 'inspection'].includes(d.type));
    const driverObligations = allDriverDocuments.map(d => ({ ...d, is_driver_doc: true }));
    const obligations = [...vehicleObligations, ...driverObligations].sort((a, b) => {
      if (!a.expiry_date) return 1;
      if (!b.expiry_date) return -1;
      return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
    });

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-black text-gray-900">{t.obligationsTitle}</h3>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditingVehicle(null);
                setDocumentFormData({ type: 'insurance', status: 'valid' });
                setShowDocumentModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              {t.newVehicleDocument}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-black text-gray-500 uppercase tracking-wider">{t.assetPerson}</th>
                <th className="p-4 font-black text-gray-500 uppercase tracking-wider">{t.type}</th>
                <th className="p-4 font-black text-gray-500 uppercase tracking-wider">{t.expiryDate}</th>
                <th className="p-4 font-black text-gray-500 uppercase tracking-wider">{t.recurrence}</th>
                <th className="p-4 font-black text-gray-500 uppercase tracking-wider">{t.status}</th>
                <th className="p-4 font-black text-gray-500 uppercase tracking-wider text-right">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {obligations.map(doc => {
                const expiryDate = doc.expiry_date ? new Date(doc.expiry_date) : null;
                const now = new Date();
                const isExpired = expiryDate && expiryDate < now;
                const isExpiringSoon = expiryDate && !isExpired && expiryDate < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                
                return (
                  <tr key={`${doc.is_driver_doc ? 'd' : 'v'}-${doc.id}`} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {doc.is_driver_doc ? (
                          <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600">
                            <UserCheck className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                            <Car className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-900">{doc.is_driver_doc ? doc.driver_name : doc.plate}</p>
                          <p className="text-[10px] text-gray-400 uppercase font-black">{doc.is_driver_doc ? t.driver : t.vehicle}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-black uppercase">
                        {doc.type}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-gray-900">{safeFormatDate(doc.expiry_date, 'dd.MM.yyyy')}</td>
                    <td className="p-4">
                      {doc.is_recurring ? (
                        <span className="flex items-center gap-1 text-blue-600 font-bold text-xs uppercase">
                          <RefreshCw className="w-3 h-3" />
                          {doc.recurrence_period === '1 year' ? t.yearly : doc.recurrence_period === '6 months' ? t.sixMonths : t.twoYears}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs uppercase">{t.oneTime}</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        isExpired ? 'bg-red-100 text-red-700' : isExpiringSoon ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {isExpired ? t.expired : isExpiringSoon ? t.approaching : t.active}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <a href={doc.document_url || doc.url} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg inline-block">
                        <Download className="w-4 h-4" />
                      </a>
                    </td>
                  </tr>
                );
              })}
              {obligations.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="max-w-xs mx-auto">
                      <ShieldCheck className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-500 font-bold">{t.noObligationFound}</p>
                      <p className="text-xs text-gray-400 mt-1">{t.noObligationFoundDesc}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderMainTabContent = () => {
    switch (activeMainTab) {
      case 'vehicles': return renderVehiclesTab();
      case 'drivers': return renderDriversTab();
      case 'maintenance': return renderMaintenanceTab();
      case 'assignments': return renderAssignmentsTab();
      case 'mileage': return renderMileageTab();
      case 'incidents': return renderIncidentsTab();
      case 'obligations': return renderObligationsTab();
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Car className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
            {t.fleetManagement}
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">{t.fleet}</p>
        </div>
        <div className="grid grid-cols-3 sm:flex items-center gap-2">
          <button
            onClick={exportToExcel}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-green-50 text-green-700 border border-green-100 rounded-xl text-xs sm:text-sm font-bold hover:bg-green-100 transition-all"
            title="Excel"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Excel</span>
            <span className="sm:hidden">Excel</span>
          </button>
          <button
            onClick={exportToPDF}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-red-50 text-red-700 border border-red-100 rounded-xl text-xs sm:text-sm font-bold hover:bg-red-100 transition-all"
            title="PDF"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">PDF</span>
            <span className="sm:hidden">PDF</span>
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
                  status: 'active',
                  package_name: '',
                  transmission: 'manual',
                  fuel_type: 'gasoline',
                  color: '',
                  body_type: '',
                  paint_report: '{}',
                  tramer_amount: 0,
                  tramer_currency: 'TRY',
                  buying_price: 0,
                  expenses: '[]',
                  target_profit_margin: 0,
                  description: '',
                  images: [],
                  virtual_tour_url: '',
                  ai_tour_enabled: false
                });
                setSelectedVehicle(null);
                setShowAddModal(true);
              }}
              className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-blue-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t.addVehicle}</span>
              <span className="sm:hidden">{t.add}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-1 bg-gray-100/80 p-1.5 rounded-2xl mb-6 overflow-x-auto no-scrollbar scroll-smooth">
        {[
          { id: 'vehicles', icon: Car, label: t.vehicles },
          { id: 'drivers', icon: UserCheck, label: t.drivers },
          { id: 'maintenance', icon: Wrench, label: t.maintenance },
          { id: 'assignments', icon: ClipboardList, label: t.assignments },
          { id: 'mileage', icon: History, label: t.km },
          { id: 'incidents', icon: AlertTriangle, label: t.incidents },
          { id: 'obligations', icon: FileText, label: t.obligations }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveMainTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeMainTab === tab.id 
                ? 'bg-white text-blue-600 shadow-md shadow-blue-100 scale-105' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search, Filter & Stats */}
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Car className="w-4 h-4" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider opacity-70">{t.totalVehicles}</span>
            </div>
            <span className="text-2xl sm:text-3xl font-black text-gray-900">{(vehicles || []).length}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider opacity-70">{t.activeVehicles}</span>
            </div>
            <span className="text-2xl sm:text-3xl font-black text-gray-900">
              {(vehicles || []).filter(v => v.status === 'active').length}
            </span>
          </div>
          <div className={`bg-white p-4 rounded-2xl border shadow-sm flex flex-col gap-1 ${(vehicles || []).some(v => Number(v.expiring_docs) > 0) ? 'border-amber-200 ring-1 ring-amber-100' : 'border-gray-100'}`}>
            <div className={`flex items-center gap-2 mb-1 ${(vehicles || []).some(v => Number(v.expiring_docs) > 0) ? 'text-amber-600' : 'text-gray-400'}`}>
              <AlertCircle className="w-4 h-4" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider opacity-70">{t.documentAlert}</span>
            </div>
            <span className={`text-2xl sm:text-3xl font-black ${(vehicles || []).some(v => Number(v.expiring_docs) > 0) ? 'text-amber-600' : 'text-gray-300'}`}>
              {(vehicles || []).reduce((acc, v) => acc + (Number(v.expiring_docs) || 0), 0)}
            </span>
          </div>
          <div className={`bg-white p-4 rounded-2xl border shadow-sm flex flex-col gap-1 ${(vehicles || []).some(v => Number(v.maintenance_due) > 0) ? 'border-red-200 ring-1 ring-red-100' : 'border-gray-100'}`}>
            <div className={`flex items-center gap-2 mb-1 ${(vehicles || []).some(v => Number(v.maintenance_due) > 0) ? 'text-red-600' : 'text-gray-400'}`}>
              <Wrench className="w-4 h-4" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider opacity-70">{t.maintenanceAlert}</span>
            </div>
            <span className={`text-2xl sm:text-3xl font-black ${(vehicles || []).some(v => Number(v.maintenance_due) > 0) ? 'text-red-600' : 'text-gray-300'}`}>
              {(vehicles || []).reduce((acc, v) => acc + (Number(v.maintenance_due) || 0), 0)}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder={`${t.plate}, ${t.brand?.toLowerCase() || ''} or ${t.model?.toLowerCase() || ''}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-48 pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm appearance-none font-medium text-gray-700"
              >
                <option value="all">{t.allStatuses}</option>
                <option value="active">{t.active}</option>
                <option value="in_service">{t.inService}</option>
                <option value="broken">{t.broken}</option>
                <option value="for_sale">{lang === 'tr' ? 'Satışta' : 'For Sale'}</option>
                <option value="sold">{t.sold}</option>
              </select>
            </div>
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
        {showAddModal && (() => {
          const paintReportData = (() => {
            try {
              return typeof formData.paint_report === 'string' 
                ? JSON.parse(formData.paint_report || '{}') 
                : (formData.paint_report || {});
            } catch (e) {
              return {};
            }
          })();

          const togglePartState = (partId: string) => {
            const current = paintReportData[partId] || 'original';
            const next = current === 'original' ? 'painted' : current === 'painted' ? 'replaced' : 'original';
            const updated = { ...paintReportData, [partId]: next };
            setFormData(prev => ({ ...prev, paint_report: JSON.stringify(updated) }));
          };

          const expensesListData = (() => {
            try {
              return typeof formData.expenses === 'string' 
                ? JSON.parse(formData.expenses || '[]') 
                : (formData.expenses || []);
            } catch (e) {
              return [];
            }
          })();

          const triggerAddExpense = () => {
            if (!newExpenseName || !newExpenseAmount) return;
            const newExpItem = {
              id: Date.now().toString(),
              name: newExpenseName,
              amount: parseFloat(newExpenseAmount) || 0,
              date: new Date().toISOString()
            };
            const updated = [...expensesListData, newExpItem];
            setFormData(prev => ({ ...prev, expenses: JSON.stringify(updated) }));
            setNewExpenseName('');
            setNewExpenseAmount('');
          };

          const triggerRemoveExpense = (id: string) => {
            const updated = expensesListData.filter((item: any) => item.id !== id);
            setFormData(prev => ({ ...prev, expenses: JSON.stringify(updated) }));
          };

          const totalExpenses = expensesListData.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
          const baseBuyingPrice = Number(formData.buying_price) || 0;
          const calculatedTotalCost = baseBuyingPrice + totalExpenses;
          const targetMarginPercent = Number(formData.target_profit_margin) || 0;
          const suggestedRetailPrice = calculatedTotalCost * (1 + targetMarginPercent / 100);

          const partsDefinition = [
            { id: 'hood', label: 'Kaput' },
            { id: 'roof', label: 'Tavan' },
            { id: 'trunk', label: 'Bagaj Kapağı' },
            { id: 'front_bumper', label: 'Ön Tampon' },
            { id: 'rear_bumper', label: 'Arka Tampon' },
            { id: 'fender_fl', label: 'Sol Ön Çamurluk' },
            { id: 'door_fl', label: 'Sol Ön Kapı' },
            { id: 'door_rl', label: 'Sol Arka Kapı' },
            { id: 'fender_rl', label: 'Sol Arka Çamurluk' },
            { id: 'fender_fr', label: 'Sağ Ön Çamurluk' },
            { id: 'door_fr', label: 'Sağ Ön Kapı' },
            { id: 'door_rr', label: 'Sağ Arka Kapı' },
            { id: 'fender_rr', label: 'Sağ Arka Çamurluk' }
          ];

          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col"
              >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                      <Car className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-gray-900">
                        {selectedVehicle ? t.editVehicle : t.addVehicle}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium">B2B/B2C Portföy ve Teknik Veri Kartı</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={selectedVehicle ? handleUpdateVehicle : handleCreateVehicle} className="flex-1 overflow-y-auto p-6 space-y-8">
                  
                  {/* SECTION 1: CORE VEHICLE DATA */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-blue-700 tracking-wider uppercase border-l-4 border-blue-600 pl-2.5">
                      1. Ruhsat ve Kayıt Bilgileri
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600">Plaka *</label>
                        <input
                          required
                          type="text"
                          value={formData.plate}
                          onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold"
                          placeholder={t.example_plate}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600">Araç Tipi *</label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                        >
                          <option value="company">{t.company}</option>
                          <option value="personal">{t.personal}</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600">Marka *</label>
                        <input
                          required
                          type="text"
                          value={formData.brand}
                          onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          placeholder={t.example_ford}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600">Model Adı *</label>
                        <input
                          required
                          type="text"
                          value={formData.model}
                          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          placeholder={t.example_focus}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600">Üretim Yılı *</label>
                        <input
                          required
                          type="number"
                          value={formData.year}
                          onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600">Kilometre (Güncel) *</label>
                        <input
                          required
                          type="number"
                          value={formData.current_mileage || 0}
                          onChange={(e) => setFormData({ ...formData, current_mileage: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600">Şasi Numarası</label>
                        <input
                          type="text"
                          value={formData.chassis_number || ''}
                          onChange={(e) => setFormData({ ...formData, chassis_number: e.target.value.toUpperCase() })}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono"
                          placeholder="WBA123..."
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600">Motor Numarası</label>
                        <input
                          type="text"
                          value={formData.engine_number || ''}
                          onChange={(e) => setFormData({ ...formData, engine_number: e.target.value.toUpperCase() })}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono"
                          placeholder="N47D..."
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600">Operasyonel Durumu *</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                        >
                          <option value="active">{t.active}</option>
                          <option value="in_service">{t.inService}</option>
                          <option value="broken">{t.broken}</option>
                          <option value="for_sale">Satışta (Portföy)</option>
                          <option value="sold">{t.sold}</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: EXTENDED SPECS & CATEGORIES */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-blue-700 tracking-wider uppercase border-l-4 border-blue-600 pl-2.5">
                      2. Donanım ve Teknik Özellikler (Müşteri Detay)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600">Donanım Paketi</label>
                        <input
                          type="text"
                          value={formData.package_name || ''}
                          onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          placeholder="Örn: Titanium, M Sport"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600">Şanzıman Tipi</label>
                        <select
                          value={formData.transmission || 'manual'}
                          onChange={(e) => setFormData({ ...formData, transmission: e.target.value as any })}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        >
                          <option value="manual">Manuel</option>
                          <option value="automatic">Otomatik</option>
                          <option value="semi_automatic">Yarı Otomatik</option>
                          <option value="dual_clutch">Çift Kavrama (DCT/DSG)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600">Yakıt Türü</label>
                        <select
                          value={formData.fuel_type || 'gasoline'}
                          onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value as any })}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        >
                          <option value="gasoline">Benzin</option>
                          <option value="diesel">Dizel</option>
                          <option value="hybrid">Hibrit</option>
                          <option value="electric">Elektrik</option>
                          <option value="lpg">LPG</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600">Dış Renk</label>
                        <input
                          type="text"
                          value={formData.color || ''}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          placeholder="Örn: Metalik Füme, Opak Beyaz"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600">Gövde / Kasa Sınıfı</label>
                        <select
                          value={formData.body_type || ''}
                          onChange={(e) => setFormData({ ...formData, body_type: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        >
                          <option value="">Seçiniz...</option>
                          <option value="Sedan">Sedan</option>
                          <option value="Hatchback">Hatchback</option>
                          <option value="SUV">SUV (Arazi Grubu)</option>
                          <option value="Coupe">Coupe</option>
                          <option value="Station Wagon">Station Wagon</option>
                          <option value="Kabrio">Kabrio (Açık Kasa)</option>
                          <option value="Light Commercial">Hafif Ticari</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        {formData.status === 'for_sale' && (
                          <>
                            <label className="text-xs font-bold text-emerald-700">Açık İlan Satış Fiyatı *</label>
                            <div className="flex gap-1.5">
                              <input
                                required
                                type="number"
                                value={formData.selling_price || ''}
                                onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                                placeholder="0"
                                className="w-full px-3.5 py-2.5 bg-emerald-50/30 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-extrabold text-emerald-900"
                              />
                              <select
                                value={formData.currency || 'TRY'}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                className="px-2.5 py-2.5 bg-emerald-50/55 border border-emerald-200 rounded-xl outline-none font-bold text-xs text-emerald-800"
                              >
                                <option value="TRY">₺ TRY</option>
                                <option value="USD">$ USD</option>
                                <option value="EUR">€ EUR</option>
                                <option value="GBP">£ GBP</option>
                              </select>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: PAINT REPORT AND INSURANCE INTERACTION */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-blue-700 tracking-wider uppercase border-l-4 border-blue-600 pl-2.5 flex items-center gap-1.5">
                        3. Ekspertiz Kaporta Hasar & Tramer Haritası
                      </h4>
                      <p className="text-[10px] text-gray-500 font-bold bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-sm">
                        💡 Durum değiştirme için parçalar üzerine tıklayınız.
                      </p>
                    </div>

                    <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-6">
                      
                      {/* Grid representation of car panels */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {partsDefinition.map((p) => {
                          const state = paintReportData[p.id] || 'original';
                          let bgClass = "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100";
                          let dotClass = "bg-emerald-500";
                          let labelText = "Orijinal";

                          if (state === 'painted') {
                            bgClass = "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100";
                            dotClass = "bg-amber-500";
                            labelText = "Boyalı";
                          } else if (state === 'replaced') {
                            bgClass = "bg-red-50 text-red-800 border-red-200 hover:bg-red-100";
                            dotClass = "bg-red-500";
                            labelText = "Değişmiş";
                          }

                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => togglePartState(p.id)}
                              className={`p-3 border rounded-xl flex flex-col items-start gap-1 justify-between transition-all duration-150 text-left relative overflow-hidden shadow-sm hover:shadow active:scale-95 ${bgClass}`}
                            >
                              <span className="text-xs font-bold leading-tight line-clamp-1">{p.label}</span>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className={`w-2 h-2 rounded-full ${dotClass}`} />
                                <span className="text-[9px] font-extrabold uppercase tracking-wider opacity-90">{labelText}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* TRAMER INPUTS */}
                      <div className="pt-2 border-t border-gray-200/50 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="flex-1 space-y-1">
                          <label className="text-xs font-bold text-gray-700">Tramer Hasar Rekoru Tutarı (Kayıtlı Toplam Hasar)</label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              value={formData.tramer_amount || 0}
                              onChange={(e) => setFormData({ ...formData, tramer_amount: parseFloat(e.target.value) || 0 })}
                              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                              placeholder="0.00"
                            />
                            <select
                              value={formData.tramer_currency || 'TRY'}
                              onChange={(e) => setFormData({ ...formData, tramer_currency: e.target.value })}
                              className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl outline-none font-bold text-xs"
                            >
                              <option value="TRY">₺ TRY</option>
                              <option value="USD">$ USD</option>
                              <option value="EUR">€ EUR</option>
                              <option value="GBP">£ GBP</option>
                            </select>
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3 shadow-sm shrink-0">
                          <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                          <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Hasar Tespiti</p>
                            <p className="text-xs font-bold text-gray-800">
                              {(formData.tramer_amount || 0) > 0 
                                ? `${(formData.tramer_amount || 0).toLocaleString()} ${formData.tramer_currency || 'TRY'} Kayıtlı Tramer` 
                                : "Hasar Kaydı Bulunmuyor"}
                            </p>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* SECTION 4: MALIYET VE KARLILIK (CONFIDENTIAL) */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-indigo-700 tracking-wider uppercase border-l-4 border-indigo-600 pl-2.5 flex items-center gap-1.5">
                      <ShieldCheck className="w-5 h-5 text-indigo-600" />
                      4. Maliyet ve Karlılık Defteri (Sadece Galericiler Tarafından Görülür)
                    </h4>
                    
                    <div className="bg-indigo-50/40 p-5 rounded-3xl border border-indigo-100 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                        {/* Buying Price */}
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-indigo-950">Araç Alış Geliş Fiyatı</label>
                          <div className="flex gap-1.5">
                            <input
                              type="number"
                              value={baseBuyingPrice || ''}
                              onChange={(e) => setFormData({ ...formData, buying_price: parseFloat(e.target.value) || 0 })}
                              className="w-full px-3.5 py-2.5 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-extrabold text-indigo-900"
                              placeholder="0"
                            />
                            <select
                              value={formData.currency || 'TRY'}
                              disabled
                              className="px-2.5 py-2.5 bg-indigo-100/50 border border-indigo-200 rounded-xl outline-none font-bold text-xs text-indigo-800 cursor-not-allowed"
                            >
                              <option value="TRY">TRY</option>
                              <option value="USD">USD</option>
                              <option value="EUR">EUR</option>
                              <option value="GBP">GBP</option>
                            </select>
                          </div>
                        </div>

                        {/* Extra expenses dynamic adder */}
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-xs font-bold text-indigo-950">Ekspertiz, Bakım, Kuaför, Boya Masrafları Yönetimi</label>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={newExpenseName}
                              onChange={(e) => setNewExpenseName(e.target.value)}
                              className="flex-1 px-3.5 py-2.5 bg-white border border-indigo-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                              placeholder="Masraf Açıklaması (Örn: Pasta Cila, Detaylı Temizlik)"
                            />
                            <input
                              type="number"
                              value={newExpenseAmount}
                              onChange={(e) => setNewExpenseAmount(e.target.value)}
                              className="w-24 px-3.5 py-2.5 bg-white border border-indigo-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-right font-bold text-indigo-900"
                              placeholder="0"
                            />
                            <button
                              type="button"
                              onClick={triggerAddExpense}
                              className="px-4 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shrink-0"
                            >
                              Masraf Ekle
                            </button>
                          </div>
                        </div>

                      </div>

                      {/* Display added expenses */}
                      {expensesListData.length > 0 && (
                        <div className="bg-white/80 p-3.5 rounded-2xl border border-indigo-200/50 space-y-2">
                          <p className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-widest border-b pb-1">Yapılmış Masraf Kalemleri Listesi</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                            {expensesListData.map((item: any) => (
                              <div key={item.id} className="flex justify-between items-center p-2 bg-indigo-50/20 hover:bg-indigo-50/50 border border-gray-100 rounded-lg text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                                  <span className="font-semibold text-gray-700">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-indigo-900">{(item.amount || 0).toLocaleString()} {formData.currency || 'TRY'}</span>
                                  <button
                                    type="button"
                                    onClick={() => triggerRemoveExpense(item.id)}
                                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Target profit margin range */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-3 border-t border-indigo-200/50">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-xs font-bold text-indigo-950">
                            <span>Hedeflenen Saf Kâr Marjı (%)</span>
                            <span className="text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-100">% {targetMarginPercent}</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={targetMarginPercent}
                            onChange={(e) => setFormData({ ...formData, target_profit_margin: parseFloat(e.target.value) || 0 })}
                            className="w-full accent-indigo-600 h-2 bg-indigo-100 rounded-lg outline-none"
                          />
                        </div>

                        {/* Interactive Financial Math Display Board */}
                        <div className="bg-indigo-900 text-indigo-50 p-4 rounded-2xl grid grid-cols-2 gap-2 shadow-inner">
                          <div>
                            <p className="text-[9px] text-indigo-300 font-bold uppercase tracking-wider">Aracın Fiyat Maliyeti</p>
                            <p className="text-sm font-black">{calculatedTotalCost.toLocaleString()} {formData.currency || 'TRY'}</p>
                            <span className="text-[8px] text-indigo-400 font-medium">Alış + Toplam Masraflar</span>
                          </div>
                          <div>
                            <p className="text-[9px] text-indigo-300 font-bold uppercase tracking-wider">Önerilen Hedef Liste Fiyatı</p>
                            <p className="text-sm font-black text-amber-300">{suggestedRetailPrice.toLocaleString()} {formData.currency || 'TRY'}</p>
                            <span className="text-[8px] text-indigo-400 font-medium">Maliyet * (1 + %{targetMarginPercent} Marj)</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* SECTION 5: LOOKPRICE ELITE AI & LUXURY SHOWCASE SUITE */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-indigo-700 tracking-wider uppercase border-l-4 border-indigo-600 pl-2.5 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      5. LookPrice AI Premium Sunum & Görünüm Paneli
                    </h4>

                    {vehicleAiNotice && (
                      <div className="bg-emerald-500/10 text-emerald-800 text-xs font-bold border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between shadow-xs z-20">
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                          {vehicleAiNotice}
                        </span>
                        <button type="button" onClick={() => setVehicleAiNotice(null)} className="p-1 hover:bg-emerald-500/15 rounded-full shrink-0">
                          <X className="w-3.5 h-3.5 text-emerald-700" />
                        </button>
                      </div>
                    )}

                    <div className="bg-gradient-to-br from-indigo-50/60 to-purple-50/60 p-5 rounded-2xl border border-indigo-100/80 space-y-5">
                      
                      {/* Sub-section 5a: Image and lookprice filters */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-indigo-950">Araç Vitrin / Kapak Fotoğrafı URL</label>
                        <input
                          type="text"
                          value={formData.images?.[0] || ''}
                          onChange={(e) => setFormData({ ...formData, images: e.target.value ? [e.target.value] : [] })}
                          placeholder="https://images.unsplash.com/photo-..."
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-medium"
                        />

                        {formData.images && formData.images.length > 0 && (
                          <div className="pt-2 p-3 bg-white/40 border border-indigo-100/50 rounded-xl flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black text-indigo-950 flex items-center gap-1.5 uppercase tracking-wide">
                              <Cpu className="w-3 h-3 text-indigo-600" />
                              AI Fotoğraf Laboratuvarı:
                            </span>
                            <button
                              type="button"
                              disabled={processingVehicleMedia !== null}
                              onClick={handleAIEnhanceExposure}
                              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-[10px] rounded-lg transition-all active:scale-95 flex items-center gap-1 shrink-0 shadow-xs"
                            >
                              {processingVehicleMedia === 'enhance' ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-505" />
                              ) : (
                                <Sparkles className="w-3 h-3 text-yellow-500" />
                              )}
                              Renk/Kontrast Parlat (Enhance)
                            </button>
                            <button
                              type="button"
                              disabled={processingVehicleMedia !== null}
                              onClick={() => handleAIVariantStaging('luxury')}
                              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-[10px] rounded-lg transition-all active:scale-95 flex items-center gap-1 shrink-0 shadow-xs"
                            >
                              {processingVehicleMedia === 'staging' ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-505" />
                              ) : (
                                <Image className="w-3 h-3 text-slate-500" />
                              )}
                              Showroom Moduna Taşı (Staging)
                            </button>
                            <button
                              type="button"
                              disabled={processingVehicleMedia !== null}
                              onClick={handleAIAnonymizePlate}
                              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-[10px] rounded-lg transition-all active:scale-95 flex items-center gap-1 shrink-0 shadow-xs"
                            >
                              {processingVehicleMedia === 'blur' ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-505" />
                              ) : (
                                <Shield className="w-3 h-3 text-red-500" />
                              )}
                              Plaka / Cam Gizle (Privacy Blur)
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Sub-section 5b: Description Assistant */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <label className="text-xs font-bold text-indigo-950">Pazar Hikayesi & Teknik İlan Açıklaması</label>
                          <button
                            type="button"
                            disabled={generatingVehicleDesc}
                            onClick={handleGenerateVehicleDesc}
                            className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-wider rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-50"
                          >
                            {generatingVehicleDesc ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin text-white-500 shrink-0" />
                                Yazılıyor...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
                                AI İlan Hikayesi Oluştur
                              </>
                            )}
                          </button>
                        </div>
                        <textarea
                          placeholder="Aracın yol sürüş kalitesi, kondisyon detayları ve satış sunumunu yapay zekayla yazın veya buraya ekleyin..."
                          value={formData.description || ''}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full p-3.5 bg-white border border-gray-200 rounded-xl min-h-[100px] text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
                        />
                      </div>

                      {/* Sub-section 5c: 360 degree virtual staging HUD */}
                      <div className="space-y-4 pt-3 border-t border-indigo-100">
                        <div className="flex justify-between items-center gap-4 flex-wrap">
                          <div className="space-y-0.5">
                            <span className="block text-xs font-extrabold text-indigo-950">360° Sanal Sürüş Kabini Gezintisi</span>
                            <span className="block text-[10px] text-indigo-600/70">Ziyaretçiler için kokpit ve kabin içi 3D panoramik gezi turları</span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              value={formData.virtual_tour_url || ''}
                              onChange={(e) => setFormData({ ...formData, virtual_tour_url: e.target.value })}
                              placeholder="360° link veya Matterport URL"
                              className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[11px] font-medium outline-none text-slate-700"
                            />
                            <button
                              type="button"
                              disabled={generatingVehicleTour}
                              onClick={handleGenerateVehicle360Tour}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                            >
                              {generatingVehicleTour ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                              ) : (
                                <Compass className="w-3.5 h-3.5 text-white" />
                              )}
                              AI 360° Panorama Üret
                            </button>
                          </div>
                        </div>

                        {formData.virtual_tour_url && (
                          <div className="bg-slate-900 text-white rounded-2xl overflow-hidden p-4 border border-slate-800 space-y-3">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                                  360° SÜRÜŞ KABİNİ CANLI HUD ÖNİZLEME
                                </span>
                              </div>
                              <span className="text-[9px] bg-indigo-600 font-extrabold px-2 py-0.5 rounded uppercase font-mono">
                                LookPrice 360 VR
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="md:col-span-1 bg-black/40 rounded-xl p-2 border border-slate-800/60 flex flex-col gap-1.5 max-h-[140px] overflow-y-auto">
                                <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase px-1">
                                  GÖRÜNTÜ NOKTALARI
                                </span>
                                {vehicleTourBlueprint?.nodes ? (
                                  vehicleTourBlueprint.nodes.map((node: any, idx: number) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => setActiveVehicleTourNode(node)}
                                      className={`w-full text-left p-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-between ${
                                        activeVehicleTourNode?.name === node.name 
                                          ? 'bg-indigo-600 text-white shadow' 
                                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                      }`}
                                    >
                                      <span>🛋️ {node.name}</span>
                                    </button>
                                  ))
                                ) : (
                                  <div className="space-y-1">
                                    <button
                                      type="button"
                                      onClick={() => setActiveVehicleTourNode({
                                        name: "Kokpit Dashboard",
                                        description: "Dijital sürüş göstergeleri, karbon kaplama direksiyon ve premium dikişli deri detaylar."
                                      })}
                                      className={`w-full text-left p-1.5 rounded-md text-[10px] font-bold ${activeVehicleTourNode?.name === "Kokpit Dashboard" || !activeVehicleTourNode ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"}`}
                                    >
                                      🛋️ Kokpit Dashboard
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setActiveVehicleTourNode({
                                        name: "Nappa Deri Arka Koltuk",
                                        description: "Arka makam perdeleri, ısıtmalı ve havalandırmalı delikli Nappa deri koltuk kafaları ve klima kontrol üniteleri."
                                      })}
                                      className={`w-full text-left p-1.5 rounded-md text-[10px] font-bold ${activeVehicleTourNode?.name === "Nappa Deri Arka Koltuk" ? "bg-indigo-600 text-white shadow" : "bg-slate-800 text-slate-400"}`}
                                    >
                                      🛋️ Arka Makam Alanı
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div className="md:col-span-2 bg-slate-950/80 rounded-xl p-3 border border-slate-800 flex flex-col justify-between min-h-[145px] text-left">
                                <div className="space-y-1">
                                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                                    AKTİF KAMERA BAKIŞ AÇISI
                                  </span>
                                  <h5 className="text-xs font-extrabold text-white animate-fade-in">
                                    {activeVehicleTourNode?.name || "Kokpit Dashboard"}
                                  </h5>
                                  <p className="text-[10px] text-slate-300 leading-relaxed max-h-[60px] overflow-y-auto style-scrollbar">
                                    {activeVehicleTourNode?.description || "Dijital sürüş göstergeleri, karbon kaplama direksiyon ve premium dikişli deri detaylar."}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="text-[9px] text-slate-500 flex justify-between items-center pt-1.5 border-t border-slate-800">
                              <span>360° Key: {formData.virtual_tour_url}</span>
                              <span className="text-indigo-400 font-extrabold text-[10px] cursor-pointer hover:underline animate-pulse" onClick={() => window.open(formData.virtual_tour_url, '_blank')}>
                                Sürüş Simülatöründe Aç ↗
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                </form>

                {/* Footer Buttons */}
                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-100 text-sm font-semibold text-gray-700 transition-colors"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-extrabold shadow-lg shadow-blue-200 transition-all active:scale-95"
                  >
                    {selectedVehicle ? t.update : t.save}
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
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
                        setFormData({
                          plate: selectedVehicle.plate,
                          brand: selectedVehicle.brand,
                          model: selectedVehicle.model,
                          year: selectedVehicle.year,
                          type: selectedVehicle.type,
                          chassis_number: selectedVehicle.chassis_number,
                          engine_number: selectedVehicle.engine_number,
                          current_mileage: selectedVehicle.current_mileage,
                          status: selectedVehicle.status,
                          selling_price: selectedVehicle.selling_price,
                          currency: selectedVehicle.currency || 'TRY',
                          package_name: selectedVehicle.package_name || '',
                          transmission: selectedVehicle.transmission || 'manual',
                          fuel_type: selectedVehicle.fuel_type || 'gasoline',
                          color: selectedVehicle.color || '',
                          body_type: selectedVehicle.body_type || '',
                          paint_report: typeof selectedVehicle.paint_report === 'string' ? selectedVehicle.paint_report : JSON.stringify(selectedVehicle.paint_report || {}),
                          tramer_amount: selectedVehicle.tramer_amount || 0,
                          tramer_currency: selectedVehicle.tramer_currency || 'TRY',
                          buying_price: selectedVehicle.buying_price || 0,
                          expenses: typeof selectedVehicle.expenses === 'string' ? selectedVehicle.expenses : JSON.stringify(selectedVehicle.expenses || []),
                          target_profit_margin: selectedVehicle.target_profit_margin || 0,
                          description: selectedVehicle.description || '',
                          images: selectedVehicle.images || [],
                          virtual_tour_url: selectedVehicle.virtual_tour_url || '',
                          ai_tour_enabled: !!selectedVehicle.ai_tour_enabled
                        });
                        setShowAddModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                      <Edit2 className="w-4 h-4" />
                      {t.edit}
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
                  { id: 'info', label: t.generalInfo, icon: Info },
                  { id: 'docs', label: t.documents, icon: FileText },
                  { id: 'maintenance', label: t.maintenanceRepair, icon: Wrench },
                  { id: 'assignments', label: t.assignmentTracking, icon: UserCheck },
                  { id: 'mileage', label: t.mileageHistory, icon: History },
                  { id: 'incidents', label: t.accidentIncident, icon: AlertTriangle },
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
                {activeDetailTab === 'info' && (() => {
                  const paintReportData = (() => {
                    try {
                      return typeof selectedVehicle.paint_report === 'string' 
                        ? JSON.parse(selectedVehicle.paint_report || '{}') 
                        : (selectedVehicle.paint_report || {});
                    } catch (e) {
                      return {};
                    }
                  })();

                  const expensesListData = (() => {
                    try {
                      return typeof selectedVehicle.expenses === 'string' 
                        ? JSON.parse(selectedVehicle.expenses || '[]') 
                        : (selectedVehicle.expenses || []);
                    } catch (e) {
                      return [];
                    }
                  })();

                  const totalExpenses = expensesListData.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
                  const baseBuyingPrice = Number(selectedVehicle.buying_price) || 0;
                  const calculatedTotalCost = baseBuyingPrice + totalExpenses;

                  const partsDefinition = [
                    { id: 'hood', label: 'Kaput' },
                    { id: 'roof', label: 'Tavan' },
                    { id: 'trunk', label: 'Bagaj' },
                    { id: 'front_bumper', label: 'Ön Tampon' },
                    { id: 'rear_bumper', label: 'Arka Tampon' },
                    { id: 'fender_fl', label: 'Sol Ön Çamurluk' },
                    { id: 'door_fl', label: 'Sol Ön Kapı' },
                    { id: 'door_rl', label: 'Sol Arka Kapı' },
                    { id: 'fender_rl', label: 'Sol Arka Çamurluk' },
                    { id: 'fender_fr', label: 'Sağ Ön Çamurluk' },
                    { id: 'door_fr', label: 'Sağ Ön Kapı' },
                    { id: 'door_rr', label: 'Sağ Arka Kapı' },
                    { id: 'fender_rr', label: 'Sağ Arka Çamurluk' }
                  ];

                  // Loan payment math:
                  const rRate = (loanRate || 0) / 100;
                  const installTerm = Number(loanTerm) || 12;
                  const principal = Number(loanAmount) || 0;
                  const calculatedMonthlyInstallment = rRate === 0 
                    ? principal / installTerm 
                    : principal * (rRate * Math.pow(1 + rRate, installTerm)) / (Math.pow(1 + rRate, installTerm) - 1);
                  const totalRepay = calculatedMonthlyInstallment * installTerm;
                  const totalIntPaid = totalRepay - principal;

                  return (
                    <div className="space-y-8 animate-fade-in text-gray-800">
                      
                      {/* SUB GRID: GENERAL SPECS */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Box 1: Technical specs */}
                        <div className="lg:col-span-2 bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-4">
                          <h4 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                            Donanım ve Tescil Detayları
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                            <div>
                              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-0.5">Marka & Model</p>
                              <p className="font-extrabold text-gray-950">{selectedVehicle.brand} {selectedVehicle.model}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-0.5">Donanım Paketi</p>
                              <p className="font-semibold text-gray-800">{selectedVehicle.package_name || "Belirtilmemiş"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-0.5">Model Yılı</p>
                              <p className="font-bold text-gray-800">{selectedVehicle.year}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-0.5">Şanzıman Sistemi</p>
                              <p className="font-medium text-gray-800">
                                {selectedVehicle.transmission === 'manual' && 'Manuel'}
                                {selectedVehicle.transmission === 'automatic' && 'Otomatik'}
                                {selectedVehicle.transmission === 'semi_automatic' && 'Yarı Otomatik'}
                                {selectedVehicle.transmission === 'dual_clutch' && 'Çift Kavrama (DCT/DSG)'}
                                {!selectedVehicle.transmission && 'Manuel'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-0.5">Yakıt Grubu</p>
                              <p className="font-medium text-gray-800">
                                {selectedVehicle.fuel_type === 'gasoline' && 'Benzin'}
                                {selectedVehicle.fuel_type === 'diesel' && 'Dizel'}
                                {selectedVehicle.fuel_type === 'hybrid' && 'Hibrit'}
                                {selectedVehicle.fuel_type === 'electric' && 'Elektrik'}
                                {selectedVehicle.fuel_type === 'lpg' && 'LPG'}
                                {!selectedVehicle.fuel_type && 'Benzin'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-0.5">Dış Gövde Rengi</p>
                              <p className="font-medium text-gray-800">{selectedVehicle.color || "Belirtilmemiş"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-0.5">Kasa Sınıfı</p>
                              <p className="font-medium text-gray-800">{selectedVehicle.body_type || "Belirtilmemiş"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-0.5">Şasi Numarası</p>
                              <p className="font-mono text-xs font-bold text-gray-800 break-all">{selectedVehicle.chassis_number || "Belirtilmemiş"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-0.5">Motor Numarası</p>
                              <p className="font-mono text-xs font-bold text-gray-800 break-all">{selectedVehicle.engine_number || "Belirtilmemiş"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-0.5">Tescil Tarihi</p>
                              <p className="font-medium text-gray-800">{safeFormatDate(selectedVehicle.created_at, 'dd MMMM yyyy', { locale: tr })}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-0.5">Araç Tescil Tipi</p>
                              <p className="font-medium text-gray-800">{selectedVehicle.type === 'company' ? 'Şirket Özmalı' : 'Kişisel / Kiralık'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Box 2: Quick KM and Status Indicators */}
                        <div className="space-y-4">
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 rounded-2xl border border-blue-100 flex flex-col justify-between h-[45%] shadow-sm">
                            <div>
                              <p className="text-xs text-blue-600 uppercase font-bold tracking-wider mb-1">Güncel Kilometre Sayacı</p>
                              <p className="text-3xl font-black text-blue-900">{(selectedVehicle.current_mileage || 0).toLocaleString()} {t.km}</p>
                            </div>
                            <span className="text-[10px] text-blue-500 font-bold mt-2">📊 Son güncelleme tescil tarihi itibariyledir.</span>
                          </div>

                          <div className={`p-6 rounded-2xl border shadow-sm flex flex-col justify-between h-[50%] ${
                            selectedVehicle.status === 'for_sale' ? 'bg-emerald-50 border-emerald-100 text-emerald-950' : 'bg-gray-50 border-gray-100 text-gray-900'
                          }`}>
                            <div>
                              <p className="text-xs uppercase font-bold tracking-wider opacity-70 mb-1">Operasyonel Statüsü</p>
                              <p className="text-2xl font-extrabold">{getStatusText(selectedVehicle.status)}</p>
                            </div>
                            {selectedVehicle.selling_price && (
                              <div className="mt-2 pt-2 border-t border-emerald-200/50 flex justify-between items-center bg-white/60 p-2 rounded-xl">
                                <span className="text-xs font-bold text-emerald-800">İlan İstenen Fiyat:</span>
                                <span className="text-base font-black text-emerald-900">
                                  {selectedVehicle.selling_price.toLocaleString()} {selectedVehicle.currency || 'TRY'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* LookPrice Elite AI Presentation Integration */}
                      {(selectedVehicle.description || selectedVehicle.virtual_tour_url) && (
                        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-3xl border border-indigo-950 shadow-xl space-y-6">
                          <div className="flex justify-between items-center border-b border-indigo-800 pb-3 flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                              <h4 className="text-sm font-black tracking-widest uppercase text-indigo-100">
                                LookPrice Elite AI Portföy & Sanal Kokpit Deneyimi
                              </h4>
                            </div>
                            <span className="text-[10px] bg-indigo-600/50 backdrop-blur-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider text-indigo-300 border border-indigo-500/30">
                              3D VR Active
                            </span>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                            {/* AI Narrative Section */}
                            {selectedVehicle.description && (
                              <div className="bg-black/35 rounded-2xl p-5 border border-indigo-500/10 space-y-3 flex flex-col justify-between">
                                <div className="space-y-1.5 text-left">
                                  <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase block">
                                    YAPAY ZEKA PORTFÖY HİKAYESİ
                                  </span>
                                  <p className="text-xs text-indigo-100 leading-relaxed font-medium whitespace-pre-wrap">
                                    {selectedVehicle.description}
                                  </p>
                                </div>
                                <span className="text-[10px] text-slate-400 flex items-center gap-1 pt-2">
                                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                                  LookPrice Gemini AI tarafından üretilmiştir.
                                </span>
                              </div>
                            )}

                            {/* 360 Cockpit Section */}
                            {selectedVehicle.virtual_tour_url && (
                              <div className="bg-indigo-950/60 rounded-2xl p-5 border border-indigo-500/10 flex flex-col justify-between space-y-4">
                                <div className="space-y-2 text-left">
                                  <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase flex items-center gap-1">
                                    <Compass className="w-3.5 h-3.5 animate-spin" />
                                    360° ETKİLEŞİMLİ SÜRÜŞ KABİNİ SİMÜLATÖRÜ
                                  </span>
                                  <p className="text-[11px] text-indigo-200 leading-relaxed font-semibold">
                                    Ziyaretçileriniz, aracın içine girmeden önce tüm sürüş paneli, Nappa deri makam koltukları ve kontrol aksamlarını 3D olarak simülasyonda gezinebilir.
                                  </p>
                                </div>

                                <div className="p-3 bg-black/45 hover:bg-black/60 border border-slate-800 rounded-xl flex items-center justify-between transition-all group cursor-pointer text-left" onClick={() => window.open(selectedVehicle.virtual_tour_url, '_blank')}>
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold text-xs shrink-0">
                                      VR
                                    </div>
                                    <div className="space-y-0.5">
                                      <span className="block text-[11px] font-bold text-white group-hover:text-indigo-400 transition-colors">
                                        3D Sürüş Turunu Başlat
                                      </span>
                                      <span className="block text-[8px] text-slate-400 break-all max-w-[200px] truncate">
                                        {selectedVehicle.virtual_tour_url}
                                      </span>
                                    </div>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* SUB GRID: PAINT EXPERT ASSESSMENT DISPLAY CARD */}
                      <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-3 border-gray-200/50">
                          <div>
                            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                              Kaporta Ekspertiz Expert Kayıtları
                            </h4>
                            <p className="text-xs text-gray-500 font-medium">Boya ve değişen parçaların topografik durum özeti</p>
                          </div>
                          
                          <div className="flex gap-4 text-xs font-bold bg-white px-3 py-1.5 rounded-xl border border-gray-200/60 shadow-sm">
                            <span className="flex items-center gap-1 text-emerald-700">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Orijinal
                            </span>
                            <span className="flex items-center gap-1 text-amber-700">
                              <span className="w-2 h-2 rounded-full bg-amber-500" /> Boyalı
                            </span>
                            <span className="flex items-center gap-1 text-red-700">
                              <span className="w-2 h-2 rounded-full bg-red-500" /> Değişmiş
                            </span>
                          </div>
                        </div>

                        {/* Read-only board layout of parts */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                          {partsDefinition.map((p) => {
                            const state = paintReportData[p.id] || 'original';
                            let stateBg = "bg-white text-gray-800 border-gray-200";
                            let stateDot = "bg-emerald-500";
                            let stateLabel = "Orijinal";

                            if (state === 'painted') {
                              stateBg = "bg-amber-50/50 border-amber-100 text-amber-800";
                              stateDot = "bg-amber-500";
                              stateLabel = "Boyalı";
                            } else if (state === 'replaced') {
                              stateBg = "bg-red-50/50 border-red-100 text-red-800";
                              stateDot = "bg-red-500";
                              stateLabel = "Değişmiş";
                            }

                            return (
                              <div key={p.id} className={`p-2.5 border rounded-xl flex flex-col justify-between h-14 ${stateBg}`}>
                                <span className="text-xs font-bold leading-tight truncate text-gray-700">{p.label}</span>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className={`w-1.5 h-1.5 rounded-full ${stateDot}`} />
                                  <span className="text-[8px] font-extrabold uppercase tracking-wide opacity-80">{stateLabel}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* TRAMER SHIELD STATUS */}
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-3">
                            <ShieldCheck className="w-7 h-7 text-emerald-600" />
                            <div>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">Tramer Sigorta Sorgusu</p>
                              <h5 className="text-sm font-extrabold text-gray-800">
                                {(selectedVehicle.tramer_amount || 0) > 0 
                                  ? `${(selectedVehicle.tramer_amount || 0).toLocaleString()} ${selectedVehicle.tramer_currency || 'TRY'} Hasar Kaydı` 
                                  : "Hasar Kaydı Temiz (Tramer kaydı bulunmuyor)"}
                              </h5>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* CONFIDENTIAL COSTING SHEET (FOR DEALERS ONLY) */}
                      {!isViewer && (
                        <div className="bg-indigo-50/30 p-6 rounded-3xl border border-indigo-100/60 space-y-4">
                          <h4 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-indigo-600" />
                            Galerici Mali Defteri (Yalnızca Mağaza Yöneticilerine Görünür)
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white p-4 rounded-2xl border border-indigo-100/50 shadow-sm text-center">
                              <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Alış Alım Geliş Tutarı</p>
                              <p className="text-lg font-black text-indigo-950">{(selectedVehicle.buying_price || 0).toLocaleString()} {selectedVehicle.currency || 'TRY'}</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-indigo-100/50 shadow-sm text-center">
                              <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Harcama ve Ekstra Masraflar</p>
                              <p className="text-lg font-black text-indigo-950">{totalExpenses.toLocaleString()} {selectedVehicle.currency || 'TRY'}</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-indigo-100/50 shadow-sm text-center">
                              <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Toplam İşletme Maliyeti</p>
                              <p className="text-lg font-black text-indigo-950">{calculatedTotalCost.toLocaleString()} {selectedVehicle.currency || 'TRY'}</p>
                            </div>
                            <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 p-4 rounded-2xl shadow text-center text-white">
                              <p className="text-[10px] text-indigo-200 font-bold uppercase mb-0.5">Hedef Liste Fiyatı (%{selectedVehicle.target_profit_margin || 0} Marj)</p>
                              <p className="text-lg font-black text-amber-300">
                                {(calculatedTotalCost * (1 + (selectedVehicle.target_profit_margin || 0) / 100)).toLocaleString()} {selectedVehicle.currency || 'TRY'}
                              </p>
                            </div>
                          </div>

                          {/* Itemized expenses database print */}
                          {expensesListData.length > 0 && (
                            <div className="bg-white p-4 rounded-2xl border border-indigo-100/50 text-xs">
                              <p className="font-bold text-gray-800 border-b pb-1.5 mb-2">Masraf Kalemleri Özeti ({expensesListData.length} Adet)</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {expensesListData.map((item: any) => (
                                  <div key={item.id} className="flex justify-between items-center p-2 bg-indigo-50/15 rounded-lg border border-gray-100">
                                    <span className="font-semibold text-gray-600">{item.name}</span>
                                    <span className="font-extrabold text-indigo-900">{(item.amount || 0).toLocaleString()} {selectedVehicle.currency || 'TRY'}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* LOAN CALCULATOR SECTION (FOR CUSTOMERS) */}
                      {selectedVehicle.selling_price && (
                        <div className="bg-emerald-50/35 p-6 rounded-3xl border border-emerald-100 space-y-4">
                          <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-emerald-600" />
                            Anında Taşıt Kredisi Finansman Hesaplama Aracı
                          </h4>

                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                            
                            {/* Inputs column */}
                            <div className="lg:col-span-8 space-y-4 text-xs font-semibold">
                              
                              {/* Sliders 1: Loan Amount */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-emerald-900">
                                  <span>Kullanılacak Kredi Tutarı</span>
                                  <span className="font-extrabold text-emerald-800">{loanAmount.toLocaleString()} {selectedVehicle.currency || 'TRY'}</span>
                                </div>
                                <input
                                  type="range"
                                  min="10000"
                                  max={selectedVehicle.selling_price}
                                  step="5000"
                                  value={loanAmount || 0}
                                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                                  className="w-full accent-emerald-600 bg-emerald-100 h-1.5 rounded-lg"
                                />
                                <div className="flex justify-between text-[10px] text-emerald-600">
                                  <span>%0</span>
                                  <span>Maksimum İlan Fiyatı (%100)</span>
                                </div>
                              </div>

                              {/* Row of sliders */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <div className="flex justify-between text-emerald-900">
                                    <span>Vade (Ay Sayısı)</span>
                                    <span className="font-extrabold text-emerald-800">{loanTerm} Ay</span>
                                  </div>
                                  <select
                                    value={loanTerm}
                                    onChange={(e) => setLoanTerm(Number(e.target.value))}
                                    className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl outline-none font-bold"
                                  >
                                    <option value={12}>12 Ay</option>
                                    <option value="24">24 Ay</option>
                                    <option value="36">36 Ay</option>
                                    <option value="48">48 Ay</option>
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <div className="flex justify-between text-emerald-900">
                                    <span>Aylık Faiz Oranı (%)</span>
                                    <span className="font-extrabold text-emerald-800">% {loanRate}</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0.5"
                                    max="5"
                                    step="0.05"
                                    value={loanRate}
                                    onChange={(e) => setLoanRate(Number(e.target.value))}
                                    className="w-full accent-emerald-600 bg-emerald-100 h-1.5 rounded-lg"
                                  />
                                  <div className="flex justify-between text-[8px] text-emerald-500">
                                    <span>%0.5 Min</span>
                                    <span>%5.0 Maks</span>
                                  </div>
                                </div>
                              </div>

                            </div>

                            {/* Outputs display card */}
                            <div className="lg:col-span-4 bg-emerald-900 text-white rounded-2xl p-5 space-y-4 shadow flex flex-col justify-between">
                              <div className="space-y-1 text-center">
                                <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">Aylık Taksit Ödemeniz</p>
                                <p className="text-3xl font-black text-amber-300">
                                  {Math.round(calculatedMonthlyInstallment).toLocaleString()} {selectedVehicle.currency || 'TRY'}
                                </p>
                              </div>

                              <div className="border-t border-emerald-800 pt-3 space-y-1.5 text-xs text-emerald-100">
                                <div className="flex justify-between">
                                  <span>Toplam Geri Ödeme:</span>
                                  <span className="font-bold text-white">{Math.round(totalRepay).toLocaleString()} {selectedVehicle.currency || 'TRY'}</span>
                                </div>
                                <div className="flex justify-between text-[11px] text-emerald-200">
                                  <span>Toplam Faiz Yükü:</span>
                                  <span className="font-bold text-white">{Math.round(totalIntPaid).toLocaleString()} {selectedVehicle.currency || 'TRY'}</span>
                                </div>
                              </div>
                            </div>

                          </div>
                        </div>
                      )}

                    </div>
                  );
                })()}

                {activeDetailTab === 'docs' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-bold text-gray-800">{t.officialDocsPermissions}</h4>
                      {!isViewer && (
                        <button onClick={() => setShowDocumentModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                          <FilePlus className="w-4 h-4" />
                          {t.addDocument}
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
                              <p className="text-xs text-gray-500">{t.expiry}: {safeFormatDate(doc.expiry_date, 'dd.MM.yyyy')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {doc.document_url && (
                              <button 
                                onClick={() => window.open(doc.document_url, '_blank')}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title={t.downloadView}
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            )}
                            {!isViewer && (
                              <>
                                <button 
                                  onClick={() => handleEditDocument(doc)}
                                  className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                                  title={t.edit}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                  title={t.delete}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                      {(documents || []).length === 0 && (
                        <div className="col-span-2 py-12 text-center text-gray-400">
                          {t.noDocumentFound}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeDetailTab === 'maintenance' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-bold text-gray-800">{t.maintenanceRepairHistory}</h4>
                      {!isViewer && (
                        <button onClick={() => setShowMaintenanceModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                          <Plus className="w-4 h-4" />
                          {t.maintenanceRecord}
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
                                <p className="font-bold text-gray-800">{t.fleet_terms[m.type as keyof typeof t.fleet_terms] || m.type}</p>
                                <p className="text-xs text-gray-500">{safeFormatDate(m.date, 'dd MMMM yyyy', { locale: tr })} - {m.provider_name}</p>
                                <p className="text-xs text-gray-600 mt-1">{m.description}</p>
                                <p className="text-xs text-gray-500">{t.kilometer}: {m.mileage.toLocaleString('tr-TR')}</p>
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                              <p className="font-bold text-gray-800">{(m.cost || 0).toLocaleString('tr-TR')} {m.currency || t.currency_tl}</p>
                              <div className="flex items-center gap-2">
                                {m.invoice_url && (
                                  <button 
                                    onClick={() => window.open(m.invoice_url!, '_blank')}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                    title={t.downloadInvoice}
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                )}
                                {!isViewer && (
                                  <button 
                                    onClick={() => handleEditMaintenance(m)}
                                    className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                                    title={t.edit}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                )}
                                <p className="font-bold text-gray-900">{(m.cost || 0).toLocaleString()} {m.currency || t.currency_tl}</p>
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                m.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                              }`}>
                                {m.status === 'completed' ? t.completed : t.planned}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">{m.description}</p>
                          {m.next_maintenance_date && (
                            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-4 text-xs">
                              <div className="flex items-center gap-1 text-blue-600">
                                <Calendar className="w-3 h-3" />
                                {t.nextMaintenance}: {safeFormatDate(m.next_maintenance_date, 'dd.MM.yyyy')}
                              </div>
                              {m.next_maintenance_mileage && (
                                <div className="flex items-center gap-1 text-blue-600">
                                  <MapPin className="w-3 h-3" />
                                  {t.nextKM}: {(m.next_maintenance_mileage || 0).toLocaleString()}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      {(maintenance || []).length === 0 && (
                        <div className="py-12 text-center text-gray-400">
                          {t.noMaintenanceFound}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeDetailTab === 'assignments' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-bold text-gray-800">{t.assignmentUserTracking}</h4>
                      {!isViewer && (
                        <button onClick={() => setShowAssignmentModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                          <UserCheck className="w-4 h-4" />
                          {t.assign}
                        </button>
                      )}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                          <tr>
                            <th className="px-6 py-3">{t.userEmail}</th>
                            <th className="px-6 py-3">{t.startDate}</th>
                            <th className="px-6 py-3">{t.endDate}</th>
                            <th className="px-6 py-3">{t.status}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assignments.map((a) => (
                            <tr key={a.id} className="bg-white border-b hover:bg-gray-50">
                              <td className="px-6 py-4 font-medium text-gray-900">{a.user_email}</td>
                              <td className="px-6 py-4">{safeFormatDate(a.start_date, 'dd.MM.yyyy')}</td>
                              <td className="px-6 py-4">{a.end_date ? safeFormatDate(a.end_date, 'dd.MM.yyyy') : t.ongoing}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {a.status === 'active' ? t.activeAssignment : t.returned}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {(assignments || []).length === 0 && (
                        <div className="py-12 text-center text-gray-400">
                          {t.noAssignmentFound}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeDetailTab === 'mileage' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-bold text-gray-800">{t.mileageHistory}</h4>
                      {!isViewer && (
                        <button onClick={() => setShowMileageModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm shadow-blue-600/20">
                          <History className="w-4 h-4" />
                          {lang === 'tr' ? 'Sefer / KM Ekle' : 'Add Trip / KM'}
                        </button>
                      )}
                    </div>
                    
                    {mileageLogs.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100/50 shadow-sm">
                        <div className="bg-white/60 p-4 rounded-xl border border-white">
                          <p className="text-xs text-blue-600 font-black uppercase tracking-wider mb-1">{lang === 'tr' ? 'Toplam Sefer / İşlem' : 'Total Trips'}</p>
                          <p className="text-2xl font-black text-blue-950">{mileageLogs.length}</p>
                        </div>
                        <div className="bg-white/60 p-4 rounded-xl border border-white">
                          <p className="text-xs text-blue-600 font-black uppercase tracking-wider mb-1">{lang === 'tr' ? 'Saha Çalışma Süresi' : 'Field Time'}</p>
                          <p className="text-2xl font-black text-blue-950">
                            {Math.floor(mileageLogs.reduce((acc, log) => acc + (log.duration_minutes || 0), 0) / 60)}s {mileageLogs.reduce((acc, log) => acc + (log.duration_minutes || 0), 0) % 60}d
                          </p>
                        </div>
                        <div className="bg-white/60 p-4 rounded-xl border border-white">
                          <p className="text-xs text-blue-600 font-black uppercase tracking-wider mb-1">{lang === 'tr' ? 'Toplam Harcama' : 'Total Expense'}</p>
                          <p className="text-2xl font-black text-blue-950">
                            {mileageLogs.reduce((acc, log) => acc + (log.expense_amount || 0), 0).toLocaleString()} ₺
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="relative pl-2">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100"></div>
                      <div className="space-y-6 relative">
                        {mileageLogs.map((log) => (
                          <div key={log.id} className="flex relative">
                            <div className="flex flex-col items-center mr-4">
                              <div className="w-8 h-8 bg-white border-2 border-blue-600 rounded-full flex items-center justify-center z-10 shrink-0">
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              </div>
                              <div className="w-0.5 h-full bg-blue-100 mt-2"></div>
                            </div>
                            <div className="flex-1 p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-2 mb-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-bold text-gray-800 text-lg">{(log.mileage || 0).toLocaleString()} {t.km}</p>
                                  <p className="text-sm font-medium text-blue-600">{safeFormatDate(log.date, 'dd MMMM yyyy', { locale: tr })}</p>
                                </div>
                                {log.expense_amount ? (
                                  <div className="text-right">
                                    <span className="inline-block px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-md">
                                      {log.expense_type} - {log.expense_amount} ₺
                                    </span>
                                  </div>
                                ) : null}
                              </div>
                              
                              {(log.purpose || log.duration_minutes || log.notes) && (
                                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-200">
                                  {log.purpose && (
                                    <p className="text-xs text-gray-600"><strong>Amacı:</strong> {log.purpose}</p>
                                  )}
                                  {log.duration_minutes && (
                                    <p className="text-xs text-gray-600"><strong>Süre:</strong> {log.duration_minutes} dk</p>
                                  )}
                                  {log.notes && (
                                    <p className="text-xs text-gray-500 italic col-span-2">"{log.notes}"</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {(mileageLogs || []).length === 0 && (
                          <div className="py-12 text-center text-gray-400">
                            {t.noMileageFound}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeDetailTab === 'incidents' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-bold text-gray-800">{t.accidentIncidentRecords}</h4>
                      {!isViewer && (
                        <button onClick={() => setShowIncidentModal(true)} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm">
                          <AlertTriangle className="w-4 h-4" />
                          {t.incidentRecord}
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
                                <p className="font-bold text-gray-800">{inc.type === 'accident' ? t.accident : t.broken}</p>
                                <p className="text-xs text-gray-500">{safeFormatDate(inc.date, 'dd.MM.yyyy')}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                              inc.status === 'open' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'
                            }`}>
                              {inc.status === 'open' ? t.open : t.resolved}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{inc.description}</p>
                          {inc.cost > 0 && (
                            <p className="text-sm font-bold text-red-600 mt-2">{t.cost}: {(inc.cost || 0).toLocaleString()} {t.currency_try}</p>
                          )}
                        </div>
                      ))}
                      {(incidents || []).length === 0 && (
                        <div className="py-12 text-center text-gray-400">
                          {t.noIncidentFound}
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
                  {editingDocument ? t.editDocument : t.addDocument}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.documentType}</label>
                  <select
                    required
                    value={documentFormData.type || ''}
                    onChange={(e) => setDocumentFormData({ ...documentFormData, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="registration">{t.vehicleLicense}</option>
                    <option value="insurance">{t.insurancePolicy}</option>
                    <option value="inspection">{t.inspectionDocument}</option>
                    <option value="tax">{t.taxReceipt}</option>
                    <option value="other">{t.other}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.uploadFile}</label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-400 cursor-pointer transition-colors">
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {documentFile ? documentFile.name : t.selectFile}
                      </span>
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                  {documentFormData.document_url && !documentFile && (
                    <p className="text-xs text-blue-600 mt-1 truncate">{t.current}: {documentFormData.document_url}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.expiryDate}</label>
                  <input
                    type="date"
                    required
                    value={documentFormData.expiry_date || ''}
                    onChange={(e) => setDocumentFormData({ ...documentFormData, expiry_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    id="is_recurring"
                    checked={documentFormData.is_recurring || false}
                    onChange={(e) => setDocumentFormData({ ...documentFormData, is_recurring: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_recurring" className="text-sm font-medium text-gray-700">{t.recurringDocument}</label>
                </div>
                {documentFormData.is_recurring && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.recurrencePeriod}</label>
                    <select
                      value={documentFormData.recurrence_period || '1 year'}
                      onChange={(e) => setDocumentFormData({ ...documentFormData, recurrence_period: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1 year">{t.yearly}</option>
                      <option value="6 months">{t.sixMonths}</option>
                      <option value="2 years">{t.twoYears}</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.notes}</label>
                  <textarea
                    value={documentFormData.notes || ''}
                    onChange={(e) => setDocumentFormData({ ...documentFormData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setShowDocumentModal(false)} className="px-6 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">{t.cancel}</button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{t.save}</button>
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
                  {editingMaintenance ? t.editMaintenanceRecord : t.addMaintenanceRecord}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.maintenanceType}</label>
                    <select
                      required
                      value={maintenanceFormData.type || ''}
                      onChange={(e) => setMaintenanceFormData({ ...maintenanceFormData, type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="routine">{t.periodicMaintenance}</option>
                      <option value="repair">{t.repair}</option>
                      <option value="tire">{t.tireChange}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.date}</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.kilometer}</label>
                    <input
                      type="text"
                      required
                      value={maintenanceFormData.mileage || ''}
                      onChange={(e) => setMaintenanceFormData({ ...maintenanceFormData, mileage: Number(e.target.value.replace(',', '.')) })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.cost} ({t.currency_try})</label>
                    <input
                      type="text"
                      required
                      value={maintenanceFormData.cost || ''}
                      onChange={(e) => setMaintenanceFormData({ ...maintenanceFormData, cost: Number(e.target.value.replace(',', '.')) })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl space-y-4">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">{t.nextMaintenancePlan}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.nextMaintenanceDate}</label>
                      <input
                        type="date"
                        value={maintenanceFormData.next_maintenance_date || ''}
                        onChange={(e) => setMaintenanceFormData({ ...maintenanceFormData, next_maintenance_date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.nextMaintenanceKM}</label>
                      <input
                        type="text"
                        value={maintenanceFormData.next_maintenance_mileage || ''}
                        onChange={(e) => setMaintenanceFormData({ ...maintenanceFormData, next_maintenance_mileage: Number(e.target.value.replace(',', '.')) })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder={t.example_km}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.serviceProvider}</label>
                  <input
                    type="text"
                    value={maintenanceFormData.provider_name || ''}
                    onChange={(e) => setMaintenanceFormData({ ...maintenanceFormData, provider_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={t.example_service}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.description}</label>
                  <textarea
                    value={maintenanceFormData.description || ''}
                    onChange={(e) => setMaintenanceFormData({ ...maintenanceFormData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.uploadInvoiceDocument}</label>
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
                            alert(t.uploadError);
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
                      <span className="text-sm text-gray-600">{t.selectFile}</span>
                    </label>
                    {maintenanceFormData.invoice_url && (
                      <div className="flex items-center gap-2 text-green-600 text-xs font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        {t.uploaded}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setShowMaintenanceModal(false)} className="px-6 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">{t.cancel}</button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{t.save}</button>
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
                      placeholder={t.example_license_classes}
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
                      <option value="">{t.select}</option>
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
                      <option value="active">{t.active}</option>
                      <option value="inactive">{t.inactive}</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <label className="block text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">{t.addNewDocument}</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">{t.documentType}</label>
                        <input
                          type="text"
                          placeholder={t.example_driver_docs}
                          value={newDriverDoc.type}
                          onChange={(e) => setNewDriverDoc({ ...newDriverDoc, type: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">{t.expiryDate}</label>
                        <input
                          type="date"
                          value={newDriverDoc.expiry_date}
                          onChange={(e) => setNewDriverDoc({ ...newDriverDoc, expiry_date: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="driver_is_recurring"
                          checked={newDriverDoc.is_recurring}
                          onChange={(e) => setNewDriverDoc({ ...newDriverDoc, is_recurring: e.target.checked })}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="driver_is_recurring" className="text-xs font-bold text-gray-500 uppercase">{t.yearlyRecurring}</label>
                      </div>
                      {newDriverDoc.is_recurring && (
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">{t.period}</label>
                          <select
                            value={newDriverDoc.recurrence_period}
                            onChange={(e) => setNewDriverDoc({ ...newDriverDoc, recurrence_period: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="1 year">{t.yearly}</option>
                            <option value="6 months">{t.sixMonths}</option>
                            <option value="2 years">{t.twoYears}</option>
                          </select>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        onChange={(e) => setDriverFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="driver-file-upload"
                      />
                      <label
                        htmlFor="driver-file-upload"
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
                      >
                        <Upload className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-600">{t.selectFile}</span>
                      </label>
                      {driverFile && (
                        <div className="flex items-center gap-2 text-green-600 text-xs font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          {driverFile.name}
                        </div>
                      )}
                      {editingDriver && (
                        <button
                          type="button"
                          onClick={() => handleUploadDriverDocument(editingDriver.id)}
                          disabled={!driverFile || !newDriverDoc.type}
                          className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                        >
                          {t.uploadDocument}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {editingDriver && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.documents}</label>
                    <div className="space-y-2">
                      {(editingDriver.documents || []).map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium">{doc.type}</span>
                          <div className="flex gap-2">
                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                              <Download className="w-4 h-4" />
                            </a>
                            <button type="button" onClick={() => handleDeleteDriverDocument(doc.id)} className="text-red-600 hover:text-red-800">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setShowDriverModal(false)} className="px-6 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">{t.cancel}</button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{t.save}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Driver Detail Modal */}
      <AnimatePresence>
        {showDriverDetailModal && selectedDriver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[80vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                    <User className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedDriver.name}</h3>
                    <p className="text-gray-500">{selectedDriver.email} • {selectedDriver.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isViewer && (
                    <button
                      onClick={() => {
                        setEditingDriver(selectedDriver);
                        setDriverFormData(selectedDriver);
                        setShowDriverDetailModal(false);
                        setShowDriverModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                      <Edit2 className="w-4 h-4" />
                      {t.edit}
                    </button>
                  )}
                  <button onClick={() => setShowDriverDetailModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column: Info */}
                  <div className="md:col-span-1 space-y-6">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">{t.driverInfo}</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">{t.bloodType}</span>
                          <span className="text-sm font-bold text-red-600">{selectedDriver.blood_type || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">{t.status}</span>
                          <span className={`text-sm font-bold ${selectedDriver.status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>
                            {selectedDriver.status === 'active' ? t.active : t.inactive}
                          </span>
                        </div>
                        <div className="pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-400 mb-1">{t.address}</p>
                          <p className="text-sm text-gray-700">{selectedDriver.address || t.notSpecified}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Documents & Assignments */}
                  <div className="md:col-span-2 space-y-6">
                    {/* Documents */}
                    <div>
                      <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        {t.driverDocuments}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(driverDocuments || []).map((doc: any) => (
                          <div key={doc.id} className="p-3 border border-gray-100 rounded-xl bg-white shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                <FileText className="w-6 h-6 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-800">{doc.type}</p>
                                <p className="text-xs text-gray-500">
                                  {doc.expiry_date ? `${t.expiry}: ${safeFormatDate(doc.expiry_date, 'dd.MM.yyyy')}` : t.indefinite}
                                </p>
                              </div>
                            </div>
                            {doc.document_url && (
                              <a
                                href={doc.document_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Download className="w-5 h-5" />
                              </a>
                            )}
                          </div>
                        ))}
                        {(driverDocuments || []).length === 0 && (
                          <div className="col-span-full py-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            {t.noDocumentUploaded}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Assignments */}
                    <div>
                      <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Car className="w-5 h-5 text-blue-600" />
                        {t.assignedVehicles}
                      </h4>
                      <div className="space-y-3">
                        {(driverAssignments || []).filter(a => a.status === 'active').map((assign: any) => (
                          <div key={assign.id} className="p-4 border border-blue-100 bg-blue-50/30 rounded-xl flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                                <Car className="w-6 h-6" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-800">{assign.vehicle_plate}</p>
                                <p className="text-xs text-gray-500">{t.assignmentDate}: {safeFormatDate(assign.start_date, 'dd.MM.yyyy')}</p>
                              </div>
                            </div>
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase">{t.activeAssignment}</span>
                          </div>
                        ))}
                        {(driverAssignments || []).filter(a => a.status === 'active').length === 0 && (
                          <div className="py-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            {t.noAssignedVehicleFound}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
                <h3 className="text-xl font-bold text-gray-800">{assignmentFormData.status === 'returned' ? t.returnVehicle : t.assign}</h3>
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
                        const driver = (drivers || []).find(d => d.id === driverId);
                        setAssignmentFormData({ 
                          ...assignmentFormData, 
                          driver_id: driverId,
                          user_id: undefined,
                          user_email: driver?.name || ''
                        });
                      }}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{t.selectDriver}</option>
                      {(drivers || []).filter(d => d.status === 'active').map(driver => (
                        <option key={driver.id} value={driver.id}>{driver.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {assignmentFormData.status === 'returned' ? t.returnDate : t.startDate}
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
                    {assignmentFormData.status === 'returned' ? t.returnKM : t.startKM}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.notes}</label>
                  <textarea
                    value={assignmentFormData.notes || ''}
                    onChange={(e) => setAssignmentFormData({ ...assignmentFormData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setShowAssignmentModal(false)} className="px-6 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">{t.cancel}</button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{t.save}</button>
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
                <h3 className="text-xl font-bold text-gray-800">{t.updateKM}</h3>
                <button onClick={() => setShowMileageModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddMileage} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.date}</label>
                    <input
                      type="date"
                      required
                      value={mileageFormData.date || ''}
                      onChange={(e) => setMileageFormData({ ...mileageFormData, date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.newKM}</label>
                    <input
                      type="number"
                      required
                      value={mileageFormData.mileage || ''}
                      onChange={(e) => setMileageFormData({ ...mileageFormData, mileage: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{lang === 'tr' ? 'Sefer Türü / Amacı' : 'Trip Purpose'}</label>
                    <select
                      value={mileageFormData.purpose || ''}
                      onChange={(e) => setMileageFormData({ ...mileageFormData, purpose: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{lang === 'tr' ? 'Seçiniz' : 'Select'}</option>
                      <option value="test_drive">{lang === 'tr' ? 'Test Sürüşü' : 'Test Drive'}</option>
                      <option value="client_meeting">{lang === 'tr' ? 'Müşteri Görüşmesi / Emlak Gezisi' : 'Client/Property Visit'}</option>
                      <option value="delivery">{lang === 'tr' ? 'Teslimat / Sevkiyat' : 'Delivery'}</option>
                      <option value="other">{lang === 'tr' ? 'Diğer' : 'Other'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{lang === 'tr' ? 'Süre (Dakika)' : 'Duration (Mins)'}</label>
                    <input
                      type="number"
                      value={mileageFormData.duration_minutes || ''}
                      onChange={(e) => setMileageFormData({ ...mileageFormData, duration_minutes: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{lang === 'tr' ? 'Harcama Türü' : 'Expense Type'}</label>
                    <select
                      value={mileageFormData.expense_type || ''}
                      onChange={(e) => setMileageFormData({ ...mileageFormData, expense_type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{lang === 'tr' ? 'Yok' : 'None'}</option>
                      <option value="fuel">{lang === 'tr' ? 'Yakıt' : 'Fuel'}</option>
                      <option value="parking">{lang === 'tr' ? 'Otopark / Vale' : 'Parking/Valet'}</option>
                      <option value="toll">{lang === 'tr' ? 'Köprü / Otoyol' : 'Toll'}</option>
                      <option value="cleaning">{lang === 'tr' ? 'Yıkama / Temizlik' : 'Cleaning'}</option>
                      <option value="other">{lang === 'tr' ? 'Diğer' : 'Other'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{lang === 'tr' ? 'Tutar' : 'Amount'}</label>
                    <input
                      type="number"
                      value={mileageFormData.expense_amount || ''}
                      onChange={(e) => setMileageFormData({ ...mileageFormData, expense_amount: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={!mileageFormData.expense_type}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.notes}</label>
                  <textarea
                    value={mileageFormData.notes || ''}
                    onChange={(e) => setMileageFormData({ ...mileageFormData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setShowMileageModal(false)} className="px-6 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">{t.cancel}</button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{t.save}</button>
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
                <h3 className="text-xl font-bold text-gray-800">{t.addIncidentRecord}</h3>
                <button onClick={() => setShowIncidentModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddIncident} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.incidentType}</label>
                  <select
                    required
                    value={incidentFormData.type || ''}
                    onChange={(e) => setIncidentFormData({ ...incidentFormData, type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="accident">{t.accident}</option>
                    <option value="breakdown">{t.broken}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.date}</label>
                  <input
                    type="date"
                    required
                    value={incidentFormData.date || ''}
                    onChange={(e) => setIncidentFormData({ ...incidentFormData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.description}</label>
                  <textarea
                    required
                    value={incidentFormData.description || ''}
                    onChange={(e) => setIncidentFormData({ ...incidentFormData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.estimatedCost} ({t.currency_try})</label>
                  <input
                    type="number"
                    value={incidentFormData.cost || ''}
                    onChange={(e) => setIncidentFormData({ ...incidentFormData, cost: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setShowIncidentModal(false)} className="px-6 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">{t.cancel}</button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{t.save}</button>
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
