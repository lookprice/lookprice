import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Mail, Phone, MapPin, Building2, BarChart3, Star, Target, Shield, Calendar, Search, LayoutGrid, List, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from "../../contexts/LanguageContext";
import { api } from "../../services/api";
import { RealEstateCRM } from '../../components/RealEstateCRM';
import { RealEstateCalendar } from '../../components/RealEstateCalendar';
import { AutomotiveCRM } from '../../components/AutomotiveCRM';
import { AutomotiveCalendar } from '../../components/AutomotiveCalendar';
import { RealEstateModal } from '../../components/RealEstateModal';
import { ArrangeTourModal } from '../../components/ArrangeTourModal';
import { VehicleAppointmentModal } from '../../components/VehicleAppointmentModal';
import { toast } from 'sonner';

interface TeamCrmTabProps {
  storeId?: number;
  storeName?: string;
  isAutomotive?: boolean;
  isRealEstate?: boolean;
}

const AUTO_STAGES = [
  'Yeni Talep / Aday',
  'Görüşme / Analiz',
  'Test Sürüşü & Ekspertiz',
  'Teklif & Pazarlık',
  'Satış Tamamlandı / Kapandı'
];

const RE_STAGES = [
  'Yeni Talep / Aday',
  'Görüşme / Analiz',
  'Yer Gösterme / Sunum',
  'Teklif / Sözleşme',
  'Kazanıldı'
];

const isAutomotiveMatching = (deal: any): boolean => {
  if (deal.sector === 'automotive') return true;
  if (deal.sector === 'real_estate') return false;
  // If no explicit sector tag, strict keyword detection: exclude all real estate patterns
  const rePattern = /dükkan|dukkan|villa|daire|arsa|konut|gayrimenkul|emlak|tapu|bina|yer gösterme|sunum|karaoğlanoğlu|karaoglanoglu|girne|lefkoşa|mağusa|iskele|etiler|sarıyer|kadıköy|gbp/i;
  const text = `${deal.title || ''} ${deal.description || ''} ${deal.stage || ''}`;
  return !rePattern.test(text);
};

const isRealEstateMatching = (deal: any): boolean => {
  if (deal.sector === 'real_estate') return true;
  if (deal.sector === 'automotive') return false;
  // If no explicit sector tag, strict keyword detection: exclude all automotive patterns
  const autoPattern = /araç|arac|otomobil|sedan|suv|panelvan|galeri|kilometre|\bkm\b|ekspertiz|motorlu|test sürüşü/i;
  const text = `${deal.title || ''} ${deal.description || ''} ${deal.stage || ''}`;
  return !autoPattern.test(text);
};

const getSectorDefaultDeals = (isAuto: boolean, sid?: number) => {
  if (isAuto) {
    return [
      {
        id: 'd_auto_1',
        title: 'Sedan / Yönetici Aracı Arayışı',
        description: 'Otomatik vites, düşük kilometreli, servis bakımlı 2021 ve üzeri model.',
        agent_name: 'Satış Temsilcisi',
        budget: '1.450.000 TL',
        stage: 'Yeni Talep / Aday',
        sector: 'automotive',
        store_id: sid
      },
      {
        id: 'd_auto_2',
        title: 'SUV / Aile Aracı Talebi',
        description: 'Kazasız, boyasız, geniş hacimli dizel/hibrit SUV arayışı.',
        agent_name: 'Satış Temsilcisi',
        budget: '2.100.000 TL',
        stage: 'Görüşme / Analiz',
        sector: 'automotive',
        store_id: sid
      },
      {
        id: 'd_auto_3',
        title: 'Ticari Panelvan Filo Talebi',
        description: 'İşletme dağıtım operasyonu için uygun hacimli araç talebi.',
        agent_name: 'Satış Temsilcisi',
        budget: '850.000 TL',
        stage: 'Teklif & Pazarlık',
        sector: 'automotive',
        store_id: sid
      }
    ];
  }
  return [
    {
      id: 'd_re_1',
      title: 'Müstakil Villa Arayışı',
      description: 'Minimum 3+1 müstakil veya ikiz villa, havuzlu ve bahçeli tercih ediliyor.',
      agent_name: 'Danışman',
      budget: '£350,000 Bütçe',
      stage: 'Yeni Talep / Aday',
      sector: 'real_estate',
      store_id: sid
    },
    {
      id: 'd_re_2',
      title: 'Yatırımlık 2+1 Daire Arayışı',
      description: 'Merkezi lokasyonda, yüksek kira getirili ve koçanlı konut talebi.',
      agent_name: 'Danışman',
      budget: '£95,000 Bütçe',
      stage: 'Görüşme / Analiz',
      sector: 'real_estate',
      store_id: sid
    }
  ];
};

const loadIsolatedDeals = (isAuto: boolean, sid?: number, key?: string) => {
  const effectiveKey = key || (isAuto ? `autolp_crm_deals_${sid || 'default'}` : `restatelp_crm_deals_${sid || 'default'}`);
  const stored = localStorage.getItem(effectiveKey);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const filtered = parsed.filter(d => isAuto ? isAutomotiveMatching(d) : isRealEstateMatching(d));
        if (filtered.length > 0) return filtered;
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Check legacy unisolated key if it exists, strictly filter out opposite sector items
  const legacyStored = localStorage.getItem('lookprice_crm_deals');
  if (legacyStored) {
    try {
      const parsedLegacy = JSON.parse(legacyStored);
      if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
        const matching = parsedLegacy.filter(d => isAuto ? isAutomotiveMatching(d) : isRealEstateMatching(d));
        if (matching.length > 0) {
          const stamped = matching.map(d => ({ ...d, sector: isAuto ? 'automotive' : 'real_estate', store_id: sid }));
          localStorage.setItem(effectiveKey, JSON.stringify(stamped));
          return stamped;
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  const defaults = getSectorDefaultDeals(isAuto, sid);
  localStorage.setItem(effectiveKey, JSON.stringify(defaults));
  return defaults;
};

export const TeamCrmTab = ({ storeId, storeName, isAutomotive = false, isRealEstate = true }: TeamCrmTabProps) => {
  const { lang } = useLanguage();
  const isTr = lang === 'tr';
  const [agents, setAgents] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [activeSubTab, setActiveSubTab] = useState<'agents' | 'branches' | 'pipeline'>('agents');
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Broker / Yöneticisi',
    branch_id: '',
    image_url: ''
  });

  const [branchFormData, setBranchFormData] = useState({
    name: '',
    address: '',
    phone: '',
    slug: ''
  });

  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [crmView, setCrmView] = useState<'leads' | 'portfolio' | 'calendar'>('leads');
  const [leadsDisplayMode, setLeadsDisplayMode] = useState<'list' | 'kanban'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTourProperty, setActiveTourProperty] = useState<any>(null);
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [isAutoAppointmentModalOpen, setIsAutoAppointmentModalOpen] = useState(false);

  const currentStages = isAutomotive ? AUTO_STAGES : RE_STAGES;
  const storageKey = isAutomotive 
    ? `autolp_crm_deals_${storeId || 'default'}` 
    : `restatelp_crm_deals_${storeId || 'default'}`;

  const [deals, setDeals] = useState<any[]>(() => loadIsolatedDeals(isAutomotive, storeId, storageKey));

  // Reload isolated deals when storeId or sector changes
  useEffect(() => {
    setDeals(loadIsolatedDeals(isAutomotive, storeId, storageKey));
  }, [storeId, isAutomotive, storageKey]);

  // Persist strictly to the isolated storageKey
  useEffect(() => {
    if (deals && Array.isArray(deals)) {
      localStorage.setItem(storageKey, JSON.stringify(deals));
    }
  }, [deals, storageKey]);

  const [showDealModal, setShowDealModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<any>(null);
  const [dealFormData, setDealFormData] = useState({
    title: '',
    description: '',
    agent_name: '',
    budget: '',
    stage: currentStages[0]
  });

  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [isRealEstateModalOpen, setIsRealEstateModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [storeId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [agentsData, branchesData, itemsData, tasksData] = await Promise.all([
        api.getConsultants(storeId),
        api.getBranches(storeId),
        isAutomotive ? api.getVehicles(storeId) : api.getProperties(storeId),
        api.getTasks(storeId)
      ]);
      setAgents(Array.isArray(agentsData) ? agentsData : []);
      setBranches(Array.isArray(branchesData) ? branchesData : []);
      setPortfolioItems(Array.isArray(itemsData) ? itemsData : []);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      let res;
      if (editingAgent) {
        res = await api.updateConsultant(editingAgent.id, formData, storeId);
      } else {
        res = await api.addConsultant(formData, storeId);
      }
      
      if (res && !res.error) {
        setShowModal(false);
        setEditingAgent(null);
        setFormData({ name: '', email: '', phone: '', role: 'Broker / Yöneticisi', branch_id: '', image_url: '' });
        fetchData();
        toast.success(isTr ? 'Personel kaydı kaydedildi' : 'Agent saved');
      }
    } catch (error) {
      console.error('Failed to save agent:', error);
      toast.error(isTr ? 'Personel kaydedilemedi' : 'Failed to save agent');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBranch = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      let res;
      if (editingBranch) {
        res = await api.updateBranch(editingBranch.id, branchFormData, storeId);
      } else {
        res = await api.addBranch(branchFormData, storeId);
      }
      
      if (res && !res.error) {
        setShowBranchModal(false);
        setEditingBranch(null);
        setBranchFormData({ name: '', address: '', phone: '', slug: '' });
        fetchData();
        toast.success(isTr ? 'Şube kaydı kaydedildi' : 'Branch saved');
      }
    } catch (error) {
      console.error('Failed to save branch:', error);
      toast.error(isTr ? 'Şube kaydedilemedi' : 'Failed to save branch');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBranch = async (id: number) => {
    if (!window.confirm(isTr ? 'Bu şubeyi silmek istediğinize emin misiniz?' : 'Are you sure you want to delete this branch?')) return;
    try {
      const res = await api.deleteBranch(id, storeId);
      if (res && !res.error) {
        fetchData();
        toast.success(isTr ? 'Şube silindi' : 'Branch deleted');
      }
    } catch (error) {
      console.error('Failed to delete branch:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(isTr ? 'Bu danışmanı silmek istediğinize emin misiniz?' : 'Are you sure you want to delete this agent?')) return;
    try {
      const res = await api.deleteConsultant(id, storeId);
      if (res && !res.error) {
        fetchData();
        toast.success(isTr ? 'Danışman silindi' : 'Agent deleted');
      }
    } catch (error) {
      console.error('Failed to delete agent:', error);
    }
  };

  const handleSaveDeal = () => {
    if (!dealFormData.title) return;
    
    if (editingDeal) {
      setDeals(prev => prev.map(d => d.id === editingDeal.id ? { 
        ...editingDeal, 
        ...dealFormData,
        sector: isAutomotive ? 'automotive' : 'real_estate',
        store_id: storeId
      } : d));
      toast.success(isTr ? 'Talep güncellendi' : 'Lead updated');
    } else {
      const newDeal = {
        ...dealFormData,
        sector: isAutomotive ? 'automotive' : 'real_estate',
        store_id: storeId,
        id: 'd' + Date.now()
      };
      setDeals(prev => [...prev, newDeal]);
      toast.success(isTr ? 'Yeni talep eklendi' : 'New lead added');
    }
    setShowDealModal(false);
    setEditingDeal(null);
    setDealFormData({ title: '', description: '', agent_name: '', budget: '', stage: currentStages[0] });
  };

  const openEdit = (agent: any) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      email: agent.email || '',
      phone: agent.phone || '',
      role: agent.role || (isAutomotive ? 'Satış Danışmanı / Temsilcisi' : 'Broker / Yöneticisi'),
      branch_id: agent.branch_id || '',
      image_url: agent.image_url || ''
    });
    setShowModal(true);
  };

  const filteredAgents = agents.filter(a => 
    a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDeals = deals
    .filter(d => isAutomotive ? isAutomotiveMatching(d) : isRealEstateMatching(d))
    .filter(d => 
      d.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.agent_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.budget?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="space-y-3 font-sans text-slate-800">
      {/* FUTURISTIC ULTRA-COMPACT SECTOR-ADAPTIVE CONTROL BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white border border-slate-200/90 rounded-2xl p-2.5 md:p-3 shadow-2xs">
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white flex items-center justify-center font-black shadow-xs shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs md:text-sm font-black uppercase text-slate-900 tracking-tight leading-tight flex items-center gap-2">
              <span>{isAutomotive ? 'Oto Galeri & Ekip HUB' : 'Team & Network HUB'}</span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded border border-indigo-200/60">
                {isAutomotive ? 'AUTOLP CRM' : 'RESTATED CRM'}
              </span>
            </span>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 mt-0.5">
              <span className="flex items-center gap-1 text-indigo-700 font-extrabold">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                <span>{agents.length} {isAutomotive ? 'Satış Temsilcisi / Personel' : (isTr ? 'Personel & Danışman' : 'Staff')}</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 text-slate-600">
                <Building2 className="w-3 h-3 text-slate-400" />
                <span>{branches.length} {isAutomotive ? 'Galeri / Şube' : (isTr ? 'Şube' : 'Branches')}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Subtabs & Compact Trigger */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center flex-wrap">
          <div className="bg-slate-100/90 p-0.5 rounded-xl flex items-center border border-slate-200/80">
            <button 
              onClick={() => setActiveSubTab('agents')}
              className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-tight transition-all cursor-pointer ${
                activeSubTab === 'agents' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAutomotive ? 'Temsilciler' : (isTr ? 'Danışmanlar' : 'Agents')}
            </button>
            <button 
              onClick={() => setActiveSubTab('branches')}
              className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-tight transition-all cursor-pointer ${
                activeSubTab === 'branches' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isTr ? 'Şubeler' : 'Branches'}
            </button>
            <button 
              onClick={() => setActiveSubTab('pipeline')}
              className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-tight transition-all cursor-pointer ${
                activeSubTab === 'pipeline' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isTr ? 'CRM (Pipeline)' : 'Pipeline'}
            </button>
          </div>

          <button 
            onClick={() => {
              if (activeSubTab === 'agents') {
                setEditingAgent(null);
                setFormData({ name: '', email: '', phone: '', role: isAutomotive ? 'Satış Danışmanı / Temsilcisi' : 'Broker / Yöneticisi', branch_id: '', image_url: '' });
                setShowModal(true);
              } else if (activeSubTab === 'branches') {
                setEditingBranch(null);
                setBranchFormData({ name: '', address: '', phone: '', slug: '' });
                setShowBranchModal(true);
              } else {
                if (isAutomotive) {
                  setIsAutoAppointmentModalOpen(true);
                } else {
                  setEditingDeal(null);
                  setDealFormData({ title: '', description: '', agent_name: '', budget: '', stage: 'Yeni Talep / Aday' });
                  setShowDealModal(true);
                }
              }
            }}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-[11px] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>
              {activeSubTab === 'agents' ? (isTr ? '+ Personel' : '+ Agent') : 
               activeSubTab === 'branches' ? (isTr ? '+ Şube' : '+ Branch') : 
               isAutomotive ? '+ Randevu / Fırsat' :
               (isTr ? '+ Talep/Fırsat' : '+ Lead')}
            </span>
          </button>
        </div>
      </div>

      {/* COMPACT SEARCH & FILTER BAR (Only for agents and branches; pipeline has its own integrated toolbar) */}
      {activeSubTab !== 'pipeline' && (
        <div className="flex items-center justify-between gap-2 bg-slate-50/80 p-2 rounded-xl border border-slate-200/80">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text"
              placeholder={activeSubTab === 'agents' ? "Danışman adı, e-posta veya görev ara..." : "Şube adı veya şehir ara..."}
              className="w-full pl-8 pr-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-slate-200">
          <div className="w-7 h-7 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
          <span className="text-xs font-bold text-slate-500">Yükleniyor...</span>
        </div>
      ) : activeSubTab === 'agents' ? (
        /* DANIŞMANLAR - HIGH DENSITY ROW-BY-ROW TABLE VIEW WITH UNCOVERED ICONS */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-3">Danışman / Personel</th>
                  <th className="py-2.5 px-3">Şube</th>
                  <th className="py-2.5 px-3">İletişim Bilgileri</th>
                  <th className="py-2.5 px-3 text-center">Performans / İlanlar</th>
                  <th className="py-2.5 px-3 text-right">Aksiyonlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                {filteredAgents.map((agent) => {
                  const assignedItems = portfolioItems.filter((item: any) => item.responsible_consultant_id === agent.id);
                  const isExpanded = selectedAgentId === agent.id;

                  return (
                    <React.Fragment key={agent.id}>
                      <tr className="hover:bg-indigo-50/30 transition-colors group">
                        {/* Personel Avatar & Role */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            {agent.image_url ? (
                              <img src={agent.image_url} alt={agent.name} className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0" />
                            ) : (
                              <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-black text-xs shrink-0 uppercase shadow-2xs">
                                {agent.name.substring(0,2)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-extrabold text-slate-900 truncate leading-tight">{agent.name}</p>
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100 mt-0.5">
                                <Star className="w-2.5 h-2.5" />
                                <span>{agent.role || 'Broker / Yöneticisi'}</span>
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Şube */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{branches.find(b => b.id === agent.branch_id)?.name || 'Merkez Ofis'}</span>
                          </div>
                        </td>

                        {/* İletişim Bilgileri (Always Visible Icons) */}
                        <td className="py-2.5 px-3">
                          <div className="space-y-0.5 text-[11px]">
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Mail className="w-3 h-3 text-indigo-500 shrink-0" />
                              <span className="truncate">{agent.email || '---'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span className="truncate">{agent.phone || '---'}</span>
                            </div>
                          </div>
                        </td>

                        {/* Performans & Aktif İlan Butonu */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold border border-slate-200">
                              Satış: {agent.performance?.deals || 0}
                            </span>
                            <button
                              onClick={() => setSelectedAgentId(isExpanded ? null : agent.id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-black border transition-all cursor-pointer flex items-center gap-1 ${
                                isExpanded 
                                  ? 'bg-amber-500 text-white border-amber-600' 
                                  : 'bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-100'
                              }`}
                              title="Yetkili olduğu ilanları göster/gizle"
                            >
                              <span>İlanlar: {assignedItems.length}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </div>
                        </td>

                        {/* Aksiyon Butonları (High Contrast Visible Icons) */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(agent)}
                              className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 rounded-lg transition-colors cursor-pointer border border-slate-200/60"
                              title="Düzenle"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(agent.id)}
                              className="p-1.5 bg-slate-100 hover:bg-rose-50 text-rose-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer border border-slate-200/60"
                              title="Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Portfolio Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80 border-b border-slate-200/80">
                          <td colSpan={5} className="p-3">
                            <div className="space-y-2">
                              <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                {agent.name} - Atanmış Portföy Listesi ({assignedItems.length})
                              </p>

                              {assignedItems.length === 0 ? (
                                <p className="text-xs text-slate-400 font-medium py-1">Henüz portföy atanmamış.</p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                  {assignedItems.map((item: any) => (
                                    <div 
                                      key={item.id}
                                      onClick={() => {
                                        setEditingProperty(item);
                                        setIsRealEstateModalOpen(true);
                                      }}
                                      className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-2xs transition-all cursor-pointer group"
                                    >
                                      {item.image_url ? (
                                        <img src={item.image_url} alt={item.title} className="w-8 h-8 rounded-md object-cover shrink-0" />
                                      ) : (
                                        <div className="w-8 h-8 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-400 shrink-0">
                                          <Building2 className="w-4 h-4" />
                                        </div>
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600">
                                          {isAutomotive ? `${item.plate} ${item.brand}` : item.title}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-bold truncate">
                                          {item.currency} {Math.round(Number(item.price) || 0).toLocaleString('tr-TR')} • {item.location || 'KKTC'}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {filteredAgents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-400 font-bold">
                      Kayıtlı danışman/personel bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeSubTab === 'branches' ? (
        /* ŞUBELER - HIGH DENSITY TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-3">Şube Adı</th>
                  <th className="py-2.5 px-3">Kod / Slug</th>
                  <th className="py-2.5 px-3">İletişim & Adres</th>
                  <th className="py-2.5 px-3 text-center">Personel Sayısı</th>
                  <th className="py-2.5 px-3 text-right">Aksiyonlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                {branches.map((branch) => {
                  const staffCount = agents.filter(a => a.branch_id === branch.id).length;
                  return (
                    <tr key={branch.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-extrabold text-slate-900">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span>{branch.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-mono">
                          {branch.slug?.toUpperCase() || 'ANA-SUBE'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="space-y-0.5 text-[11px] text-slate-600">
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{branch.phone || '---'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-xs">{branch.address || '---'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[10px] font-bold">
                          {staffCount} Personel
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingBranch(branch);
                              setBranchFormData({ name: branch.name, address: branch.address || '', phone: branch.phone || '', slug: branch.slug || '' });
                              setShowBranchModal(true);
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 rounded-lg transition-colors cursor-pointer border border-slate-200/60"
                            title="Düzenle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBranch(branch.id)}
                            className="p-1.5 bg-slate-100 hover:bg-rose-50 text-rose-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer border border-slate-200/60"
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {branches.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-400 font-bold">
                      Kayıtlı şube bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeSubTab === 'pipeline' ? (
        <div className="space-y-2.5">
          {/* UNIFIED SINGLE TOOLBAR FOR PIPELINE (NO DUPLICATE ROWS, NO DUPLICATE SEARCH, NO DUPLICATE CALENDAR BUTTON) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/90 p-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
            {/* Left: View Tabs */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-200/70 rounded-lg w-fit shrink-0">
              <button 
                onClick={() => setCrmView('leads')}
                className={`px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-tight transition-all cursor-pointer ${
                  crmView === 'leads' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isTr ? 'Müşteri Talepleri' : 'Lead Pipeline'}
              </button>
              <button 
                onClick={() => setCrmView('portfolio')}
                className={`px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-tight transition-all cursor-pointer ${
                  crmView === 'portfolio' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isAutomotive ? 'Araç Satış Pipeline' : (isTr ? 'Portföy Süreçleri' : 'Portfolio Pipeline')}
              </button>
              <button 
                onClick={() => setCrmView('calendar')}
                className={`px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-tight transition-all cursor-pointer ${
                  crmView === 'calendar' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isTr ? 'Randevu Takvimi' : 'Calendar'}
              </button>
            </div>

            {/* Right: Integrated Single Search & Controls */}
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
              {crmView === 'leads' && (
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                  <button 
                    onClick={() => setLeadsDisplayMode('list')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      leadsDisplayMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <List className="w-3 h-3" />
                    <span>Liste</span>
                  </button>
                  <button 
                    onClick={() => setLeadsDisplayMode('kanban')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      leadsDisplayMode === 'kanban' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LayoutGrid className="w-3 h-3" />
                    <span>Kanban</span>
                  </button>
                </div>
              )}

              {isAutomotive && (crmView === 'portfolio' || crmView === 'calendar') && (
                <button
                  onClick={() => setIsAutoAppointmentModalOpen(true)}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg text-[11px] transition-all flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>+ Yeni Araç Randevusu</span>
                </button>
              )}

              {crmView === 'portfolio' && !isAutomotive && (
                <button
                  onClick={() => {
                    setActiveTourProperty(null);
                    setIsTourModalOpen(true);
                  }}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg text-[11px] transition-all flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>+ Yeni Gezi Planla</span>
                </button>
              )}

              {crmView !== 'calendar' && (
                <div className="relative w-48 sm:w-60">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input 
                    type="text"
                    placeholder={crmView === 'leads' ? "Talep veya bütçe ara..." : (isAutomotive ? "Araç veya müşteri ara..." : "Portföy veya ref ara...")}
                    className="w-full pl-8 pr-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-2xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {crmView === 'leads' ? (
            leadsDisplayMode === 'list' ? (
              /* MÜŞTERİ & YATIRIMCI TALEPLERİ - LISTE GÖRÜNÜMÜ TABLE */
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/90 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500">
                        <th className="py-2.5 px-3">Talep / Müşteri</th>
                        <th className="py-2.5 px-3">Açıklama & Detay</th>
                        <th className="py-2.5 px-3">Sorumlu</th>
                        <th className="py-2.5 px-3">Bütçe</th>
                        <th className="py-2.5 px-3">Aşama / Statü</th>
                        <th className="py-2.5 px-3 text-right">Aksiyonlar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                      {filteredDeals.map((deal) => (
                        <tr key={deal.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 font-extrabold text-slate-900">
                            {deal.title}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 max-w-xs">
                            <p className="truncate text-[11px]">{deal.description || '---'}</p>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="flex items-center gap-1 text-[11px] text-slate-700">
                              <Users className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{deal.agent_name || 'Atanmamış'}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[10px] font-bold">
                              {deal.budget || '---'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 rounded text-[10px] font-black">
                              {deal.stage}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setEditingDeal(deal);
                                  setDealFormData({
                                    title: deal.title,
                                    description: deal.description || '',
                                    agent_name: deal.agent_name || '',
                                    budget: deal.budget || '',
                                    stage: deal.stage
                                  });
                                  setShowDealModal(true);
                                }}
                                className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 rounded-lg transition-colors cursor-pointer border border-slate-200/60"
                                title="Düzenle"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(isTr ? 'Bu talebi silmek istediğinize emin misiniz?' : 'Are you sure you want to delete this deal?')) {
                                    setDeals(prev => prev.filter(d => d.id !== deal.id));
                                    toast.success(isTr ? 'Talep silindi' : 'Lead deleted');
                                  }
                                }}
                                className="p-1.5 bg-slate-100 hover:bg-rose-50 text-rose-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer border border-slate-200/60"
                                title="Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {filteredDeals.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-xs text-slate-400 font-bold">
                            Kayıtlı talep/fırsat bulunamadı.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* KANBAN VIEW FOR LEADS */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                {currentStages.map((stage, idx) => {
                  const stageDeals = filteredDeals.filter(d => d.stage === stage);
                  return (
                    <div key={idx} className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2 flex flex-col gap-2 min-w-0">
                      <div className="flex items-center justify-between px-1 py-0.5 border-b border-slate-200/60 pb-1">
                        <span className="text-[10px] font-black uppercase text-slate-800 truncate">{stage}</span>
                        <span className="text-[9px] font-mono font-bold bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded">
                          {stageDeals.length}
                        </span>
                      </div>

                      <div className="space-y-1.5 overflow-y-auto max-h-[380px] custom-scrollbar pr-0.5">
                        {stageDeals.map((deal) => (
                          <div key={deal.id} className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs group relative">
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <p className="font-bold text-slate-900 text-xs truncate leading-tight">{deal.title}</p>
                              <div className="flex items-center gap-0.5 shrink-0">
                                <button
                                  onClick={() => {
                                    setEditingDeal(deal);
                                    setDealFormData({
                                      title: deal.title,
                                      description: deal.description || '',
                                      agent_name: deal.agent_name || '',
                                      budget: deal.budget || '',
                                      stage: deal.stage
                                    });
                                    setShowDealModal(true);
                                  }}
                                  className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('Silmek istediğinize emin misiniz?')) {
                                      setDeals(prev => prev.filter(d => d.id !== deal.id));
                                    }
                                  }}
                                  className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-500 line-clamp-2 mb-2">{deal.description}</p>
                            <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 pt-1.5 border-t border-slate-100">
                              <span>{deal.agent_name || 'Atanmamış'}</span>
                              <span className="text-indigo-700 font-extrabold">{deal.budget || '---'}</span>
                            </div>
                          </div>
                        ))}

                        {stageDeals.length === 0 && (
                          <div className="py-4 text-center text-[10px] text-slate-400 border border-dashed border-slate-200 rounded-lg">
                            Talep yok
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : crmView === 'portfolio' ? (
            isAutomotive ? (
              <AutomotiveCRM 
                storeId={storeId!}
                vehicles={portfolioItems}
                tasks={tasks}
                onOpenCalendar={() => setCrmView('calendar')}
                onRefresh={fetchData}
                searchQuery={searchQuery}
                hideHeader={true}
              />
            ) : (
              <RealEstateCRM 
                storeId={storeId!}
                properties={portfolioItems}
                tasks={tasks}
                onOpenCalendar={() => setCrmView('calendar')}
                onOpenTourModal={(p) => {
                  setActiveTourProperty(p);
                  setIsTourModalOpen(true);
                }}
                onRefresh={fetchData}
                searchQuery={searchQuery}
                hideHeader={true}
              />
            )
          ) : (
            isAutomotive ? (
              <AutomotiveCalendar 
                storeId={storeId!}
                vehicles={portfolioItems}
                onClose={() => setCrmView('portfolio')}
              />
            ) : (
              <RealEstateCalendar 
                storeId={storeId!}
                properties={portfolioItems}
                onClose={() => setCrmView('portfolio')}
              />
            )
          )}
        </div>
      ) : null}

      {/* COMPACT VIEWPORT-FIT MODALS */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-slate-900/40 backdrop-blur-xs">
          <motion.div 
            initial={{ opacity:0, scale: 0.95 }}
            animate={{ opacity:1, scale: 1 }}
            className="bg-white max-w-md w-full rounded-2xl shadow-xl p-4 border border-slate-200 relative overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                {editingAgent ? (isTr ? 'Personel Düzenle' : 'Edit Staff') : (isTr ? 'Yeni Personel Kaydı' : 'Agent Registration')}
              </h3>
              <button onClick={() => { setShowModal(false); setEditingAgent(null); }} className="text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer">✕</button>
            </div>

            <div className="space-y-2.5 text-xs font-bold">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{isTr ? 'Ad Soyad' : 'Full Name'}</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs mt-0.5 outline-none focus:border-indigo-500" 
                  placeholder="Ali Veli"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Email</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs mt-0.5 outline-none focus:border-indigo-500" 
                    placeholder="ali@sirket.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{isTr ? 'Telefon' : 'Phone'}</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs mt-0.5 outline-none focus:border-indigo-500" 
                    placeholder="+90 533..."
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{isTr ? 'Görev' : 'Role'}</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs mt-0.5 outline-none focus:border-indigo-500 cursor-pointer"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <option>Broker / Yöneticisi</option>
                    <option>Kıdemli Danışman</option>
                    <option>Satış Temsilcisi</option>
                    <option>Asistan</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{isTr ? 'Şube' : 'Branch'}</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs mt-0.5 outline-none focus:border-indigo-500 cursor-pointer"
                    value={formData.branch_id}
                    onChange={(e) => setFormData({...formData, branch_id: e.target.value})}
                  >
                    <option value="">{isTr ? 'Merkez Ofis' : 'Headquarters'}</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{isTr ? 'Profil Görseli (URL)' : 'Profile Image'}</label>
                <input 
                  type="text"
                  placeholder="https://..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs mt-0.5 outline-none focus:border-indigo-500" 
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <button 
                  disabled={isSaving} 
                  onClick={() => { setShowModal(false); setEditingAgent(null); }} 
                  className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button 
                  disabled={isSaving} 
                  onClick={handleSave} 
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {showBranchModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-slate-900/40 backdrop-blur-xs">
          <motion.div 
            initial={{ opacity:0, scale: 0.95 }}
            animate={{ opacity:1, scale: 1 }}
            className="bg-white max-w-md w-full rounded-2xl shadow-xl p-4 border border-slate-200 relative overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                {editingBranch ? (isTr ? 'Şube Düzenle' : 'Edit Branch') : (isTr ? 'Yeni Şube Kaydı' : 'Branch Registration')}
              </h3>
              <button onClick={() => { setShowBranchModal(false); setEditingBranch(null); }} className="text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer">✕</button>
            </div>

            <div className="space-y-2.5 text-xs font-bold">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{isTr ? 'Şube Adı' : 'Branch Name'}</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs mt-0.5 outline-none focus:border-indigo-500" 
                  placeholder="Merkez Ofis"
                  value={branchFormData.name}
                  onChange={(e) => setBranchFormData({...branchFormData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{isTr ? 'Telefon' : 'Phone'}</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs mt-0.5 outline-none focus:border-indigo-500" 
                    placeholder="+90..."
                    value={branchFormData.phone}
                    onChange={(e) => setBranchFormData({...branchFormData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Kod / Slug</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs mt-0.5 outline-none focus:border-indigo-500" 
                    placeholder="lefkosa"
                    value={branchFormData.slug}
                    onChange={(e) => setBranchFormData({...branchFormData, slug: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{isTr ? 'Adres' : 'Address'}</label>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs mt-0.5 outline-none focus:border-indigo-500 min-h-[60px]" 
                  placeholder="Şube adresi..."
                  value={branchFormData.address}
                  onChange={(e) => setBranchFormData({...branchFormData, address: e.target.value})}
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <button disabled={isSaving} onClick={() => { setShowBranchModal(false); setEditingBranch(null); }} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer">İptal</button>
                <button disabled={isSaving} onClick={handleSaveBranch} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50">{isSaving ? 'Kaydediliyor...' : 'Kaydet'}</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {showDealModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-slate-900/40 backdrop-blur-xs">
          <motion.div 
            initial={{ opacity:0, scale: 0.95 }}
            animate={{ opacity:1, scale: 1 }}
            className="bg-white max-w-md w-full rounded-2xl shadow-xl p-4 border border-slate-200 relative overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                {editingDeal ? (isTr ? 'Talebi Düzenle' : 'Edit Lead') : (isTr ? 'Yeni Müşteri Talebi' : 'New Lead')}
              </h3>
              <button onClick={() => { setShowDealModal(false); setEditingDeal(null); }} className="text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer">✕</button>
            </div>

            <div className="space-y-2.5 text-xs font-bold">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{isTr ? (isAutomotive ? 'Başlık / Müşteri (Araç Talebi)' : 'Başlık / Müşteri') : 'Title / Client'}</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs mt-0.5 outline-none focus:border-indigo-500" 
                  placeholder={isAutomotive ? "Örn: 2022+ BMW 320i veya Mercedes C200 arayışı" : "Örn: 3+1 Daire Arayışı (Ahmet Bey)"}
                  value={dealFormData.title}
                  onChange={(e) => setDealFormData({...dealFormData, title: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{isTr ? 'Açıklama & İhtiyaç' : 'Description'}</label>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs mt-0.5 outline-none focus:border-indigo-500 min-h-[60px]" 
                  placeholder={isAutomotive ? "Örn: Otomatik vites, düşük km, servis bakımlı araç talebi..." : "Bölge, oda sayısı, alım tarihi detayları..."}
                  value={dealFormData.description}
                  onChange={(e) => setDealFormData({...dealFormData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{isTr ? (isAutomotive ? 'Danışman / Temsilci' : 'Sorumlu') : 'Agent'}</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs mt-0.5 outline-none focus:border-indigo-500 cursor-pointer"
                    value={dealFormData.agent_name}
                    onChange={(e) => setDealFormData({...dealFormData, agent_name: e.target.value})}
                  >
                    <option value="">{isTr ? 'Seçiniz' : 'Select'}</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.name}>{a.name}</option>
                    ))}
                    <option value="Merkez">Merkez</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{isTr ? 'Bütçe / Durum' : 'Budget'}</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs mt-0.5 outline-none focus:border-indigo-500" 
                    placeholder={isAutomotive ? "Örn: 1.450.000 TL" : "Örn: £150,000 Bütçe"}
                    value={dealFormData.budget}
                    onChange={(e) => setDealFormData({...dealFormData, budget: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{isTr ? 'Süreç Aşaması' : 'Stage'}</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs mt-0.5 outline-none focus:border-indigo-500 cursor-pointer"
                  value={dealFormData.stage}
                  onChange={(e) => setDealFormData({...dealFormData, stage: e.target.value})}
                >
                  {currentStages.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <button onClick={() => { setShowDealModal(false); setEditingDeal(null); }} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer">İptal</button>
                <button onClick={handleSaveDeal} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-2xs active:scale-95 cursor-pointer">Kaydet</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {isRealEstateModalOpen && (
        <RealEstateModal
          isOpen={isRealEstateModalOpen}
          onClose={() => {
            setIsRealEstateModalOpen(false);
            setEditingProperty(null);
          }}
          property={editingProperty}
          userRole="admin"
          onSave={async (updatedProp) => {
            try {
              setPortfolioItems(prev => prev.map(p => p.id === updatedProp.id ? updatedProp : p));
              setIsRealEstateModalOpen(false);
              setEditingProperty(null);
            } catch (err) {
              console.error("Error saving property in CRM:", err);
            }
          }}
        />
      )}

      {isTourModalOpen && (
        <ArrangeTourModal
          onClose={() => {
            setIsTourModalOpen(false);
            setActiveTourProperty(null);
          }}
          property={activeTourProperty}
          propertiesList={portfolioItems}
          storeId={storeId}
          onSave={() => {
            setIsTourModalOpen(false);
            setActiveTourProperty(null);
            fetchData();
          }}
        />
      )}

      {isAutoAppointmentModalOpen && (
        <VehicleAppointmentModal
          isOpen={isAutoAppointmentModalOpen}
          onClose={() => setIsAutoAppointmentModalOpen(false)}
          storeId={storeId!}
          vehicles={portfolioItems}
          onSuccess={() => {
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default TeamCrmTab;
