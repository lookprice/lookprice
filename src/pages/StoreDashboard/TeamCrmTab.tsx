import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Mail, Phone, MapPin, Building2, BarChart3, Star, Target, Shield, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from "../../contexts/LanguageContext";
import { api } from "../../services/api";
import { RealEstateCRM } from '../../components/RealEstateCRM';
import { RealEstateCalendar } from '../../components/RealEstateCalendar';
import { AutomotiveCRM } from '../../components/AutomotiveCRM';
import { AutomotiveCalendar } from '../../components/AutomotiveCalendar';
import { RealEstateModal } from '../../components/RealEstateModal';
import { ArrangeTourModal } from '../../components/ArrangeTourModal';
import { toast } from 'sonner';

interface TeamCrmTabProps {
  storeId?: number;
  storeName?: string;
  isAutomotive?: boolean;
  isRealEstate?: boolean;
}

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
  const [activeTourProperty, setActiveTourProperty] = useState<any>(null);
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);

  const [deals, setDeals] = useState<any[]>(() => {
    const stored = localStorage.getItem('lookprice_crm_deals');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch(err) {
        console.error(err);
      }
    }
    
    if (isAutomotive) {
      return [
        {
          id: 'd1',
          title: 'Sedan Araç Arayışı',
          description: 'Otomatik vites, düşük kilometreli, servis bakımlı araç. 2020 ve üzeri modeller.',
          agent_name: 'Mehmet B.',
          budget: '1.2M TL Bütçe',
          stage: 'Yeni Talep / Aday'
        },
        {
          id: 'd2',
          title: 'Ticari Panelvan',
          description: 'İşletme için uygun, geniş hacimli panelvan arayışı.',
          agent_name: 'Ayşe Y.',
          budget: 'Kiralık',
          stage: 'Yeni Talep / Aday'
        }
      ];
    }
    
    return [
      {
        id: 'd1',
        title: 'Müstakil Villa Arayışı',
        description: 'Etiler veya Sarıyer bölgesi, minimum 4 oda deniz manzaralı. Müşteri nakit alım yapacak, 1 ay içinde dönüş bekliyor.',
        agent_name: 'Mehmet B.',
        budget: '$1.5M Bütçe',
        stage: 'Yeni Talep / Aday'
      },
      {
        id: 'd2',
        title: 'Dükkan / Mağaza',
        description: 'Kadıköy merkez, yüksek yaya trafiği olan mağaza arayışı franchise için.',
        agent_name: 'Ayşe Y.',
        budget: 'Kiralık',
        stage: 'Yeni Talep / Aday'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('lookprice_crm_deals', JSON.stringify(deals));
  }, [deals]);

  const [showDealModal, setShowDealModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<any>(null);
  const [dealFormData, setDealFormData] = useState({
    title: '',
    description: '',
    agent_name: '',
    budget: '',
    stage: 'Yeni Talep / Aday'
  });

  // State to manage editing properties via RealEstateModal
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
      }
    } catch (error) {
      console.error('Failed to save agent:', error);
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
      }
    } catch (error) {
      console.error('Failed to save branch:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBranch = async (id: number) => {
    if (!window.confirm(lang === 'tr' ? 'Bu şubeyi silmek istediğinize emin misiniz?' : 'Are you sure you want to delete this branch?')) return;
    try {
      const res = await api.deleteBranch(id, storeId);
      if (res && !res.error) fetchData();
    } catch (error) {
      console.error('Failed to delete branch:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(lang === 'tr' ? 'Bu danışmanı silmek istediğinize emin misiniz?' : 'Are you sure you want to delete this agent?')) return;
    try {
      const res = await api.deleteConsultant(id, storeId);
      if (res && !res.error) fetchData();
    } catch (error) {
      console.error('Failed to delete agent:', error);
    }
  };

  const handleSaveDeal = () => {
    if (!dealFormData.title) return;
    
    if (editingDeal) {
      setDeals(prev => prev.map(d => d.id === editingDeal.id ? { ...editingDeal, ...dealFormData } : d));
    } else {
      const newDeal = {
        ...dealFormData,
        id: 'd' + Date.now()
      };
      setDeals(prev => [...prev, newDeal]);
    }
    setShowDealModal(false);
    setEditingDeal(null);
    setDealFormData({ title: '', description: '', agent_name: '', budget: '', stage: 'Yeni Talep / Aday' });
  };

  const openEdit = (agent: any) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      email: agent.email || '',
      phone: agent.phone || '',
      role: agent.role || 'Broker / Yöneticisi',
      branch_id: agent.branch_id || '',
      image_url: agent.image_url || ''
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
        <div>
           <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
             {lang === 'tr' ? 'Team & Network HUB' : 'Team & Network HUB'}
           </h2>
           <div className="flex items-center gap-2 mt-1">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
               {agents.length} {lang === 'tr' ? 'AKTİF PERSONEL' : 'ACTIVE STAFF'} • {branches.length} {lang === 'tr' ? 'ŞUBE' : 'BRANCHES'}
             </p>
           </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-3 w-full md:w-auto">
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center w-full md:w-auto overflow-x-auto custom-scrollbar md:mr-4">
             <button 
              onClick={() => setActiveSubTab('agents')}
              className={`px-4 md:px-6 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeSubTab === 'agents' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
                {lang === 'tr' ? 'DANIŞMANLAR' : 'AGENTS'}
             </button>
             <button 
              onClick={() => setActiveSubTab('branches')}
              className={`px-4 md:px-6 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeSubTab === 'branches' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
                {lang === 'tr' ? 'ŞUBELER' : 'BRANCHES'}
             </button>
             <button 
              onClick={() => setActiveSubTab('pipeline')}
              className={`px-4 md:px-6 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeSubTab === 'pipeline' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
                {lang === 'tr' ? 'CRM (Pipeline)' : 'PIPELINE'}
             </button>
          </div>

          <button 
            onClick={() => {
              if (activeSubTab === 'agents') {
                setEditingAgent(null);
                setFormData({ name: '', email: '', phone: '', role: 'Broker / Yöneticisi', branch_id: '', image_url: '' });
                setShowModal(true);
              } else if (activeSubTab === 'branches') {
                setEditingBranch(null);
                setBranchFormData({ name: '', address: '', phone: '', slug: '' });
                setShowBranchModal(true);
              } else {
                setEditingDeal(null);
                setDealFormData({ title: '', description: '', agent_name: '', budget: '', stage: 'Yeni Talep / Aday' });
                setShowDealModal(true);
              }
            }}
            className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 group"
          >
            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
            {activeSubTab === 'agents' ? (lang === 'tr' ? 'YENİ PERSONEL' : 'ADD AGENT') : 
             activeSubTab === 'branches' ? (lang === 'tr' ? 'YENİ ŞUBE' : 'ADD BRANCH') : 
             (lang === 'tr' ? 'YENİ TALEP/FIRSAT' : 'ADD LEAD')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : activeSubTab === 'agents' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {agents.map((agent) => (
             <div key={agent.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 flex flex-col gap-6 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                   <button 
                    onClick={() => openEdit(agent)}
                    className="p-3 bg-slate-100 text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors">
                      <Edit2 className="w-4 h-4" />
                   </button>
                   <button 
                    onClick={() => handleDelete(agent.id)}
                    className="p-3 bg-slate-100 text-red-500 rounded-xl hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                   </button>
                </div>

                <div className="flex gap-5 items-center">
                   <div className="h-20 w-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-slate-200 uppercase">
                     {agent.name.substring(0,2)}
                   </div>
                   <div>
                      <h3 className="font-black text-slate-800 text-xl leading-none mb-2">{agent.name}</h3>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase tracking-widest">
                         <Star className="w-3 h-3" />
                         {agent.role}
                      </span>
                      {agent.branch_id && (
                        <div className="flex items-center gap-1.5 mt-2 text-slate-400">
                          <Building2 className="w-3 h-3" />
                          <span className="text-[10px] font-bold uppercase tracking-tight">
                            {branches.find(b => b.id === agent.branch_id)?.name || 'Şube'}
                          </span>
                        </div>
                      )}
                   </div>
                </div>

                <div className="space-y-3 p-5 bg-slate-50/50 rounded-3xl border border-slate-100">
                   <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
                      <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      {agent.email || '---'}
                   </div>
                   <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
                      <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                      {agent.phone || '---'}
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-50 mt-auto">
                   <div className="text-center p-3 rounded-2xl bg-indigo-50/30">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{lang==='tr'? 'Satış':'Deals'}</p>
                      <p className="font-black text-indigo-700 text-lg">{agent.performance?.deals || 0}</p>
                   </div>
                   <div className="text-center p-3 rounded-2xl bg-emerald-50/30">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{lang==='tr'? 'Hacim':'Volume'}</p>
                      <p className="font-black text-emerald-700 text-lg">{agent.performance?.value || '0'}</p>
                   </div>
                   <div className="text-center p-3 rounded-2xl bg-amber-50/30 cursor-pointer hover:bg-amber-100/50 transition-colors" onClick={() => setSelectedAgentId(selectedAgentId === agent.id ? null : agent.id)}>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{lang==='tr'? 'Aktif İlan':'Listings'}</p>
                      <p className="font-black text-amber-700 text-lg">
                        {portfolioItems.filter((item: any) => item.responsible_consultant_id === agent.id).length}
                      </p>
                   </div>
                </div>

                {selectedAgentId === agent.id && (
                  <div className="mt-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      {lang === 'tr' ? 'Yetkili Olduğu Portföyler' : 'Assigned Portfolios'}
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {portfolioItems.filter((item: any) => item.responsible_consultant_id === agent.id).map((item: any) => (
                        <div 
                          key={item.id} 
                          onClick={() => {
                            setEditingProperty(item);
                            setIsRealEstateModalOpen(true);
                          }}
                          className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-400 hover:bg-indigo-50/20 transition-all group cursor-pointer active:scale-[0.98]"
                        >
                          {item.image_url ? (
                            <img src={item.image_url} alt={isAutomotive ? `${item.brand} ${item.model}` : item.title} className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-300">
                              <Building2 className="w-4 h-4" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-700 truncate group-hover:text-indigo-600 transition-colors flex items-center gap-1.5 justify-between">
                              <span className="truncate">{isAutomotive ? `${item.plate} - ${item.brand} ${item.model}` : item.title}</span>
                              <span className="text-[10px] text-indigo-600 font-extrabold flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                ✍️ Düzenle
                              </span>
                            </p>
                            <p className="text-[10px] font-black text-slate-400 truncate uppercase mt-0.5">
                              {isAutomotive ? `${item.year} • ${item.price} ${item.currency}` : `${item.currency} ${Math.round(Number(item.price) || 0).toLocaleString('tr-TR')} • ${item.location}`}
                            </p>
                          </div>
                        </div>
                      ))}
                      {portfolioItems.filter((item: any) => item.responsible_consultant_id === agent.id).length === 0 && (
                        <p className="text-xs text-slate-400 font-medium pb-2">
                          {lang === 'tr' ? 'Henüz portföy atanmamış.' : 'No portfolio assigned yet.'}
                        </p>
                      )}
                    </div>
                  </div>
                )}
             </div>
           ))}
        </div>
      ) : activeSubTab === 'pipeline' ? (
        <div className="space-y-6">
          {/* Sub-Sub Tabs for CRM */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
            <button 
              onClick={() => setCrmView('leads')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${crmView === 'leads' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {lang === 'tr' ? 'MÜŞTERİ TALEPLERİ' : 'LEAD PIPELINE'}
            </button>
            <button 
              onClick={() => setCrmView('portfolio')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${crmView === 'portfolio' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {lang === 'tr' ? 'PORTFÖY SÜREÇLERİ' : 'PORTFOLIO PIPELINE'}
            </button>
            <button 
              onClick={() => setCrmView('calendar')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${crmView === 'calendar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {lang === 'tr' ? 'RANDEVU TAKVİMİ' : 'APPOINTMENT CALENDAR'}
            </button>
          </div>

          {crmView === 'leads' ? (
            <div className="flex gap-6 overflow-x-auto pb-8 snap-x custom-scrollbar">
              {['Yeni Talep / Aday', 'Görüşme / Analiz', 'Yer Gösterme / Sunum', 'Teklif / Sözleşme', 'Kazanıldı'].map((stage, idx) => {
                 const stageDeals = deals.filter(d => d.stage === stage);
                 return (
                   <div key={idx} className="min-w-[320px] max-w-[320px] bg-slate-50/80 rounded-[2rem] border border-slate-200 p-6 shadow-sm snap-center flex flex-col gap-4">
                     <div className="flex items-center justify-between">
                       <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">{stage}</h4>
                       <div className="w-6 h-6 bg-white border border-slate-200 shadow-sm rounded-full flex items-center justify-center text-[10px] font-bold text-indigo-600 font-mono">
                         {stageDeals.length}
                       </div>
                     </div>
                     
                     <div className="space-y-3 overflow-y-auto max-h-[440px] pr-1 custom-scrollbar">
                       {stageDeals.map((deal) => (
                         <div key={deal.id} className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group relative">
                           {/* Edit and Delete Buttons (hover) */}
                           <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/95 backdrop-blur-xs rounded-lg p-1 border border-slate-100 shadow-sm z-10">
                             <button 
                               type="button"
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
                               className="p-1 hover:bg-slate-100 rounded-md text-indigo-605 transition-colors"
                             >
                               <Edit2 className="w-3 h-3" />
                             </button>
                             <button 
                               type="button"
                               onClick={() => {
                                 if (confirm(lang === 'tr' ? 'Bu kartı silmek istediğinize emin misiniz?' : 'Are you sure you want to delete this deal?')) {
                                   setDeals(prev => prev.filter(d => d.id !== deal.id));
                                 }
                               }}
                               className="p-1 hover:bg-rose-50 rounded-md text-rose-500 transition-colors"
                             >
                               <Trash2 className="w-3 h-3" />
                             </button>
                           </div>

                           <p className="font-bold text-slate-800 mb-1 group-hover:text-indigo-605 transition-colors pr-12 text-xs">{deal.title}</p>
                           <p className="text-[11px] text-slate-500 mb-4 line-clamp-3 leading-relaxed">{deal.description}</p>
                           
                           <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-slate-400 border-t border-slate-50 pt-3 mt-1">
                             <span className="flex items-center gap-1.5 truncate max-w-[130px]" title={deal.agent_name}>
                               <Users className="w-3.5 h-3.5 text-slate-300 shrink-0"/> {deal.agent_name || 'Atanmamış'}
                             </span>
                             <span className="text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded text-[9px] font-black shrink-0">
                               {deal.budget || '---'}
                             </span>
                           </div>
                         </div>
                       ))}

                       {stageDeals.length === 0 && (
                         <div className="py-8 text-center text-[10px] text-slate-400 border border-dashed border-slate-205 rounded-2xl bg-white/45">
                           {lang === 'tr' ? 'Bu aşamada talep yok' : 'No deal in this stage'}
                         </div>
                       )}
                     </div>

                     <button 
                       type="button"
                       onClick={() => {
                         setEditingDeal(null);
                         setDealFormData({ title: '', description: '', agent_name: '', budget: '', stage: stage });
                         setShowDealModal(true);
                       }}
                       className="mt-auto w-full py-4 rounded-xl border border-slate-200 border-dashed text-slate-400 hover:bg-slate-200/50 hover:text-slate-600 hover:border-slate-305 transition-colors flex items-center justify-center group"
                     >
                       <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                     </button>
                   </div>
                 );
               })}
             </div>
          ) : crmView === 'portfolio' ? (
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
             />
          ) : (
             <RealEstateCalendar 
               storeId={storeId!}
               properties={portfolioItems}
               onClose={() => setCrmView('portfolio')}
             />
          )}
        </div>
      ) : activeSubTab === 'branches' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {branches.map((branch) => (
             <div key={branch.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 flex flex-col gap-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                   <button 
                    onClick={() => { setEditingBranch(branch); setBranchFormData({name: branch.name, address: branch.address || '', phone: branch.phone || '', slug: branch.slug || ''}); setShowBranchModal(true); }}
                    className="p-3 bg-slate-100 text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors">
                      <Edit2 className="w-4 h-4" />
                   </button>
                   <button 
                    onClick={() => handleDeleteBranch(branch.id)}
                    className="p-3 bg-slate-100 text-red-500 rounded-xl hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                   </button>
                </div>

                <div className="flex gap-5 items-center">
                   <div className="h-16 w-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center shadow-inner">
                     <Building2 className="w-8 h-8" />
                   </div>
                   <div>
                      <h3 className="font-black text-slate-800 text-xl leading-none mb-2">{branch.name}</h3>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-widest">
                         {branch.slug?.toUpperCase() || 'MAIN_BRANCH'}
                      </span>
                   </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-50">
                   <div className="flex items-start gap-4 text-xs font-bold text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                      {branch.address || '---'}
                   </div>
                   <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
                      <Phone className="w-4 h-4 text-slate-300 shrink-0" />
                      {branch.phone || '---'}
                   </div>
                </div>

                <div className="mt-auto pt-6 flex items-center justify-between">
                   <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-slate-300" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {agents.filter(a => a.branch_id === branch.id).length} {lang === 'tr' ? 'PERSONEL' : 'STAFF'}
                      </span>
                   </div>
                   <div className="flex -space-x-2">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />
                      ))}
                   </div>
                </div>
             </div>
           ))}
        </div>
      ) : null}

      {/* Modals */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
           <motion.div 
            initial={{ opacity:0, scale: 0.9 }}
            animate={{ opacity:1, scale: 1 }}
            className="bg-white max-w-lg w-full rounded-[2.5rem] shadow-2xl p-10 relative overflow-hidden"
           >
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-8 leading-none">
                {editingAgent ? (lang === 'tr' ? 'Personel Düzenle' : 'Edit Staff') : (lang === 'tr' ? 'Personel Kaydı' : 'Agent Registration')}
              </h3>
              <div className="space-y-5">
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{lang === 'tr' ? 'Ad Soyad' : 'Full Name'}</label>
                   <input 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold mt-2 outline-none focus:ring-4 focus:ring-indigo-100 transition-all" 
                    placeholder="Ali Veli"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                   />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email</label>
                     <input 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold mt-2 outline-none focus:ring-4 focus:ring-indigo-100 transition-all" 
                      placeholder="ali@sirket.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                     />
                   </div>
                   <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{lang === 'tr' ? 'Telefon' : 'Phone'}</label>
                     <input 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold mt-2 outline-none focus:ring-4 focus:ring-indigo-100 transition-all" 
                      placeholder="+90"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                     />
                   </div>
                 </div>
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{lang === 'tr' ? 'Profil Resmi' : 'Profile Image'}</label>
                   <div className="mt-2 flex items-center gap-4">
                     {formData.image_url && (
                       <img src={formData.image_url} alt="Profile" className="w-16 h-16 rounded-2xl object-cover border border-slate-200" />
                     )}
                     <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50 cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-colors">
                       <input 
                        type="file" 
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData({...formData, image_url: reader.result as string});
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                       />
                       <span className="text-xs font-bold text-slate-500">{lang === 'tr' ? 'Resim Seç veya Sürükle' : 'Select or Drop Image'}</span>
                     </label>
                   </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{lang === 'tr' ? 'Görev' : 'Role'}</label>
                     <select 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold mt-2 outline-none focus:ring-4 focus:ring-indigo-100 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%2394a3b8%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1.5rem_center] bg-no-repeat"
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
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{lang === 'tr' ? 'Şube Seçimi' : 'Assign Branch'}</label>
                     <select 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold mt-2 outline-none focus:ring-4 focus:ring-indigo-100 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%2394a3b8%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1.5rem_center] bg-no-repeat"
                      value={formData.branch_id}
                      onChange={(e) => setFormData({...formData, branch_id: e.target.value})}
                     >
                       <option value="">{lang === 'tr' ? 'Merkez Ofis' : 'Headquarters'}</option>
                       {branches.map(b => (
                         <option key={b.id} value={b.id}>{b.name}</option>
                       ))}
                     </select>
                   </div>
                 </div>
                 <div className="pt-6 flex gap-4">
                   <button disabled={isSaving} onClick={() => { setShowModal(false); setEditingAgent(null); }} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-colors disabled:opacity-50">İptal</button>
                   <button disabled={isSaving} onClick={handleSave} className="flex-1 py-5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50">{isSaving ? 'Kaydediliyor...' : 'Kaydet'}</button>
                 </div>
              </div>
           </motion.div>
        </div>
      )}

      {showBranchModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
           <motion.div 
             initial={{ opacity:0, scale: 0.9 }}
             animate={{ opacity:1, scale: 1 }}
             className="bg-white max-w-lg w-full rounded-[2.5rem] shadow-2xl p-10 relative overflow-hidden"
           >
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-8 leading-none">
                {editingBranch ? (lang === 'tr' ? 'Şube Detayları' : 'Edit Branch') : (lang === 'tr' ? 'Şube Kaydı' : 'Branch Registration')}
              </h3>
              <div className="space-y-5">
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{lang === 'tr' ? 'Şube Adı' : 'Branch Name'}</label>
                   <input 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold mt-2 outline-none focus:ring-4 focus:ring-indigo-100 transition-all" 
                    placeholder="Merkez Ofis"
                    value={branchFormData.name}
                    onChange={(e) => setBranchFormData({...branchFormData, name: e.target.value})}
                   />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{lang === 'tr' ? 'Telefon' : 'Phone'}</label>
                     <input 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold mt-2 outline-none focus:ring-4 focus:ring-indigo-100 transition-all" 
                      placeholder="+90"
                      value={branchFormData.phone}
                      onChange={(e) => setBranchFormData({...branchFormData, phone: e.target.value})}
                     />
                   </div>
                   <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Slug</label>
                     <input 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold mt-2 outline-none focus:ring-4 focus:ring-indigo-100 transition-all" 
                      placeholder="lefkoşa"
                      value={branchFormData.slug}
                      onChange={(e) => setBranchFormData({...branchFormData, slug: e.target.value})}
                     />
                   </div>
                 </div>
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{lang === 'tr' ? 'Adres' : 'Address'}</label>
                   <textarea 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold mt-2 outline-none focus:ring-4 focus:ring-indigo-100 transition-all min-h-[120px]" 
                    placeholder="..."
                    value={branchFormData.address}
                    onChange={(e) => setBranchFormData({...branchFormData, address: e.target.value})}
                   />
                 </div>
                 <div className="pt-6 flex gap-4">
                   <button disabled={isSaving} onClick={() => { setShowBranchModal(false); setEditingBranch(null); }} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-colors disabled:opacity-50">İptal</button>
                   <button disabled={isSaving} onClick={handleSaveBranch} className="flex-1 py-5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50">{isSaving ? 'Kaydediliyor...' : 'Kaydet'}</button>
                 </div>
              </div>
           </motion.div>
        </div>
      )}
    
      {showDealModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
           <motion.div 
             initial={{ opacity:0, scale: 0.9 }}
             animate={{ opacity:1, scale: 1 }}
             className="bg-white max-w-lg w-full rounded-[2.5rem] shadow-2xl p-10 relative overflow-hidden"
           >
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-8 leading-none">
                {editingDeal ? (lang === 'tr' ? 'Talebi Düzenle' : 'Edit Deal') : (lang === 'tr' ? 'Yeni Talep / Fırsat' : 'New Lead')}
              </h3>
              <div className="space-y-5">
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{lang === 'tr' ? 'Başlık / Müşteri' : 'Title / Client'}</label>
                   <input 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold mt-2 outline-none focus:ring-4 focus:ring-indigo-100 transition-all" 
                    placeholder="Örn: 3+1 Daire Arayışı"
                    value={dealFormData.title}
                    onChange={(e) => setDealFormData({...dealFormData, title: e.target.value})}
                   />
                 </div>
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{lang === 'tr' ? 'Açıklama' : 'Description'}</label>
                   <textarea 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold mt-2 outline-none focus:ring-4 focus:ring-indigo-100 transition-all min-h-[100px]" 
                    placeholder="Detaylar..."
                    value={dealFormData.description}
                    onChange={(e) => setDealFormData({...dealFormData, description: e.target.value})}
                   />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{lang === 'tr' ? 'Sorumlu' : 'Agent'}</label>
                     <select 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold mt-2 outline-none focus:ring-4 focus:ring-indigo-100 appearance-none"
                      value={dealFormData.agent_name}
                      onChange={(e) => setDealFormData({...dealFormData, agent_name: e.target.value})}
                     >
                        <option value="">{lang === 'tr' ? 'Seçiniz' : 'Select'}</option>
                        {agents.map(a => (
                          <option key={a.id} value={a.name}>{a.name}</option>
                        ))}
                        <option value="Merkez">Merkez</option>
                     </select>
                   </div>
                   <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{lang === 'tr' ? 'Bütçe / Durum' : 'Budget / Status'}</label>
                     <input 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold mt-2 outline-none focus:ring-4 focus:ring-indigo-100 transition-all" 
                      placeholder="Örn: 500k €"
                      value={dealFormData.budget}
                      onChange={(e) => setDealFormData({...dealFormData, budget: e.target.value})}
                     />
                   </div>
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{lang === 'tr' ? 'Aşama' : 'Stage'}</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold mt-2 outline-none focus:ring-4 focus:ring-indigo-100 appearance-none"
                      value={dealFormData.stage}
                      onChange={(e) => setDealFormData({...dealFormData, stage: e.target.value})}
                     >
                        {['Yeni Talep / Aday', 'Görüşme / Analiz', 'Yer Gösterme / Sunum', 'Teklif / Sözleşme', 'Kazanıldı'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                     </select>
                 </div>
                 <div className="pt-6 flex gap-4">
                   <button onClick={() => { setShowDealModal(false); setEditingDeal(null); }} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">İptal</button>
                   <button onClick={handleSaveDeal} className="flex-1 py-5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">Kaydet</button>
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
          onClose={() => setIsTourModalOpen(false)}
          property={activeTourProperty}
          onSave={() => {
            setIsTourModalOpen(false);
            fetchData();
          }}
        />
      )}
</div>
  );
};

export default TeamCrmTab;
