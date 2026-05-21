import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Plus, 
  Search, 
  Home, 
  MapPin, 
  Tag, 
  Edit2, 
  Trash2, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  Globe, 
  FileCheck, 
  ExternalLink,
  Shield,
  HelpCircle,
  FolderLock,
  X,
  TrendingUp,
  MessageSquare,
  Clock,
  Briefcase
} from "lucide-react";
import { translations } from "@/translations";
import { useLanguage } from "../../contexts/LanguageContext";
import { RealEstateModal } from "../../components/RealEstateModal";
import { VirtualTourViewer } from "../../components/VirtualTourViewer";
import { RealEstateProperty, RealEstateLead } from "../../types";
import { api } from "../../services/api";
import { motion, AnimatePresence } from "motion/react";

interface RealEstateTabProps {
  properties: RealEstateProperty[];
  loading: boolean;
  onSave?: (p: Partial<RealEstateProperty>) => void;
  onDelete?: (id: number) => void;
  user?: any; // Contains store_id and role
}

interface BuyerDemand {
  id: string;
  name: string;
  phone: string;
  email: string;
  nationality: 'UK' | 'TR';
  preferredRegions: string[];
  maxBudget: number;
  currency: 'GBP' | 'TRY';
  minSqm: number;
  p_type?: string;
  titleTypePref?: string;
}

const mockBuyers: BuyerDemand[] = [
  {
    id: "buyer_1",
    name: "Alistair Harrison (UK Investor)",
    phone: "+44 7911 123456",
    email: "alistair.h@capitaluk.com",
    nationality: "UK",
    preferredRegions: ["Girne", "İskele"],
    maxBudget: 175000,
    currency: "GBP",
    minSqm: 80,
    titleTypePref: "Türk Koçanı"
  },
  {
    id: "buyer_2",
    name: "Emily Watson",
    phone: "+44 7911 654321",
    email: "emily.watson@yahoo.co.uk",
    nationality: "UK",
    preferredRegions: ["İskele", "Gazimağusa"],
    maxBudget: 220000,
    currency: "GBP",
    minSqm: 90,
    titleTypePref: "Eşdeğer Koçan"
  },
  {
    id: "buyer_3",
    name: "Ahmet Yılmaz",
    phone: "0533 876 54 32",
    email: "ahmet.yilmaz@kibrismail.com",
    nationality: "TR",
    preferredRegions: ["Lefkoşa", "Girne"],
    maxBudget: 130000,
    currency: "GBP",
    minSqm: 100,
    titleTypePref: "Eşdeğer Koçan"
  },
  {
    id: "buyer_4",
    name: "Merve Şahin (İstanbul Yatırımcı)",
    phone: "0532 123 45 67",
    email: "merve.sahin@insaatplus.com",
    nationality: "TR",
    preferredRegions: ["İstanbul", "Kadıköy", "Lefkoşa"],
    maxBudget: 8500000,
    currency: "TRY",
    minSqm: 100
  }
];

const RealEstateTab = ({ properties, loading, onSave, onDelete, user }: RealEstateTabProps) => {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const [activeView, setActiveView] = useState<'listings' | 'leads' | 'crm' | 'owners' | 'agents'>('listings');
  const [search, setSearch] = useState("");
  const [filterRegion, setFilterRegion] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAgent, setFilterAgent] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<RealEstateProperty | null>(null);
  const [tourUrl, setTourUrl] = useState<string | null>(null);
  const [matchingProperty, setMatchingProperty] = useState<RealEstateProperty | null>(null);
  const [matchList, setMatchList] = useState<{ buyer: BuyerDemand; score: number; reason: string }[]>([]);
  
  // Persistence Data
  const [leads, setLeads] = useState<RealEstateLead[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [staffAgents, setStaffAgents] = useState<any[]>([]);
  const [owners, setOwners] = useState<any[]>([]);
  const [crmLoading, setCrmLoading] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<any | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);

  useEffect(() => {
    fetchCrmData();
  }, [user]);

  const fetchCrmData = async () => {
    if (!user?.store_id) return;
    setCrmLoading(true);
    try {
      const [leadsRes, activitiesRes, agentsRes, ownersRes] = await Promise.all([
        api.getRealEstateLeads(),
        api.getRealEstateActivities(),
        api.getRealEstateAgents(),
        api.getRealEstateOwners()
      ]);
      setLeads(leadsRes.data);
      setActivities(activitiesRes.data);
      setStaffAgents(agentsRes.data);
      setOwners(ownersRes.data);
    } catch (error) {
      console.error("Error fetching CRM data:", error);
    } finally {
      setCrmLoading(false);
    }
  };

  // Advanced CRM Actions
  const [showOwnerForm, setShowOwnerForm] = useState(false);
  const [editingOwnerInfo, setEditingOwnerInfo] = useState<any>(null);

  const handleOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const ownerData = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      notes: formData.get('notes') as string
    };
    
    try {
      if (editingOwnerInfo?.id) {
        await api.updateRealEstateOwner(editingOwnerInfo.id, ownerData);
      } else {
        await api.addRealEstateOwner(ownerData);
      }
      alert(lang === 'tr' ? 'Mülk sahibi bilgileri başarıyla kaydedildi.' : 'Owner information saved successfully.');
      setShowOwnerForm(false);
      setEditingOwnerInfo(null);
      fetchCrmData();
    } catch (err) {
      alert(lang === 'tr' ? 'Hata oluştu' : 'Error occurred');
    }
  };

  const deleteOwner = async (id: number) => {
    if (window.confirm(lang === 'tr' ? 'Bu mal sahibini silmek istediğinize emin misiniz?' : 'Are you sure you want to delete this owner?')) {
      try {
        await api.deleteRealEstateOwner(id);
        fetchCrmData();
      } catch (err) {
        alert(lang === 'tr' ? 'Hata oluştu' : 'Error occurred');
      }
    }
  };

  const [showActivityForm, setShowActivityForm] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  
  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const activityData = {
      type: formData.get('type'),
      title: formData.get('title'),
      detail: formData.get('detail'),
      date: new Date().toISOString(),
      agent: user?.name || 'Admin'
    };
    
    try {
      if (selectedActivity?.id) {
        await api.updateRealEstateActivity(selectedActivity.id, activityData);
      } else {
        await api.addRealEstateActivity(activityData);
      }
      setShowActivityForm(false);
      setSelectedActivity(null);
      fetchCrmData();
    } catch (err) {
      alert(lang === 'tr' ? 'Hata oluştu' : 'Error occurred');
    }
  };

  const deleteActivity = async (id: number) => {
    if (window.confirm(lang === 'tr' ? 'Bu aktiviteyi silmek istediğinize emin misiniz?' : 'Are you sure you want to delete this activity?')) {
      try {
        await api.deleteRealEstateActivity(id);
        fetchCrmData();
      } catch (err) {
        alert(lang === 'tr' ? 'Hata oluştu' : 'Error occurred');
      }
    }
  };

  const [showLeadForm, setShowLeadForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState<RealEstateLead | null>(null);

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const leadData = {
      customer_name: formData.get('customer_name') as string,
      customer_phone: formData.get('customer_phone') as string,
      source: (formData.get('source') as any) || 'manual',
      status: (formData.get('status') as any) || 'new',
      property_title: formData.get('property_title') as string,
      notes: formData.get('notes') as string
    };

    try {
      if (selectedLead?.id) {
        await api.updateRealEstateLead(selectedLead.id, leadData);
      } else {
        await api.addRealEstateLead(leadData);
      }
      setShowLeadForm(false);
      setSelectedLead(null);
      fetchCrmData();
    } catch (err) {
      alert(lang === 'tr' ? 'Hata oluştu' : 'Error occurred');
    }
  };

  const deleteLead = async (id: string | number) => {
    if (window.confirm(lang === 'tr' ? 'Bu talebi silmek istediğinize emin misiniz?' : 'Are you sure you want to delete this lead?')) {
      try {
        await api.deleteRealEstateLead(id);
        fetchCrmData();
      } catch (err) {
        alert(lang === 'tr' ? 'Hata oluştu' : 'Error occurred');
      }
    }
  };

  const [showAgentForm, setShowAgentForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);

  const handleAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const agentData = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      status: formData.get('status') || 'active'
    };

    try {
      if (editingAgent?.id) {
        await api.updateRealEstateAgent(editingAgent.id, agentData);
      } else {
        await api.addRealEstateAgent(agentData);
      }
      setShowAgentForm(false);
      setEditingAgent(null);
      fetchCrmData();
    } catch (err) {
      alert(lang === 'tr' ? 'Hata oluştu' : 'Error occurred');
    }
  };

  const deleteAgent = async (id: number) => {
    if (window.confirm(lang === 'tr' ? 'Danışman kaydını silmek istediğinize emin misiniz?' : 'Are you sure you want to delete this agent?')) {
       try {
        await api.deleteRealEstateAgent(id);
        fetchCrmData();
       } catch (err) {
        alert(lang === 'tr' ? 'Hata oluştu' : 'Error occurred');
       }
    }
  };

  // Simple currency conversion helper for the matching algorithm
  const convertToGBP = (price: number, fromCurrency: string): number => {
    const rates: Record<string, number> = {
      GBP: 1,
      TRY: 0.022,  // 1 TRY = 0.022 GBP approx
      USD: 0.80,   // 1 USD = 0.80 GBP approx
      EUR: 0.86    // 1 EUR = 0.86 GBP approx
    };
    return price * (rates[fromCurrency] || 1);
  };

  // Run the smart matching algorithm
  const runMatchingAlgorithm = (property: RealEstateProperty) => {
    const propPriceInGBP = convertToGBP(property.price, property.currency);
    const propSqm = property.square_meters || 0;
    const propLocation = property.location || "";
    const propRegion = property.kktc_region || "";
    const propTitle = property.kktc_title_type || "";

    const matches: { buyer: BuyerDemand; score: number; reason: string }[] = [];

    mockBuyers.forEach(buyer => {
      let score = 50; // base score
      let reasons: string[] = [];
      let isEligible = true;

      // 1. Region Match
      const matchesRegion = buyer.preferredRegions.some(reg => 
        propLocation.toLowerCase().includes(reg.toLowerCase()) ||
        propRegion.toLowerCase().includes(reg.toLowerCase())
      );

      if (matchesRegion) {
        score += 25;
        reasons.push("📍 Tercih edilen bölge uyumlu");
      } else {
        score -= 15;
      }

      // 2. Budget Check (Buyer's budget in GBP vs Property price in GBP)
      const buyerBudgetInGBP = buyer.currency === 'GBP' ? buyer.maxBudget : convertToGBP(buyer.maxBudget, buyer.currency);
      if (propPriceInGBP <= buyerBudgetInGBP) {
        score += 15;
        reasons.push(`💰 Fiyat bütçeye uygun (£${Math.round(propPriceInGBP).toLocaleString()} <= £${Math.round(buyerBudgetInGBP).toLocaleString()})`);
      } else {
        // Over budget
        const pctOver = (propPriceInGBP - buyerBudgetInGBP) / buyerBudgetInGBP;
        if (pctOver > 0.15) {
          isEligible = false; // strictly over budget
        } else {
          score -= 10; // slightly over budget
          reasons.push("⚠️ Fiyat bütçeyi hafif aşıyor");
        }
      }

      // 3. Space Check
      if (propSqm >= buyer.minSqm) {
        score += 10;
        reasons.push(`📐 Metrekare yeterli (${propSqm}m² >= ${buyer.minSqm}m²)`);
      } else {
        score -= 15;
      }

      // 4. KKTC Title Deed match (Koçan Tipi)
      if (property.country === 'KKTC' && buyer.titleTypePref) {
        if (propTitle === buyer.titleTypePref) {
          score += 10;
          reasons.push(`📜 Koçan tipi tam uyumlu (${propTitle})`);
        } else {
          score -= 5;
        }
      }

      if (isEligible && score >= 50) {
        matches.push({
          buyer,
          score: Math.min(score, 100),
          reason: reasons.join(", ")
        });
      }
    });

    return matches.sort((a, b) => b.score - a.score);
  };

  const handleOpenMatching = (property: RealEstateProperty) => {
    const list = runMatchingAlgorithm(property);
    setMatchingProperty(property);
    setMatchList(list);
  };

  const filteredProperties = properties.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
      (p.location && p.location.toLowerCase().includes(search.toLowerCase())) ||
      (p.listing_agent_name && p.listing_agent_name.toLowerCase().includes(search.toLowerCase()));
    
    const matchesRegion = filterRegion === "all" || 
      (filterRegion === "KKTC" && p.country === "KKTC") ||
      (filterRegion === "TR" && p.country === "TR") ||
      (p.kktc_region === filterRegion);

    const matchesStatus = filterStatus === "all" || p.status === filterStatus;
    const matchesAgent = filterAgent === "all" || p.listing_agent_name === filterAgent;

    return matchesSearch && matchesRegion && matchesStatus && matchesAgent;
  });

  // Extract unique agents for filtering
  const agents = Array.from(new Set(properties.map(p => p.listing_agent_name).filter(Boolean))) as string[];

  // Safe checks for user role representation
  const userRole = user?.role || 'admin';
  const isOfficeManager = ["superadmin", "admin", "manager", "owner"].includes(userRole.toLowerCase());

  // CRM Analytics
  const totalCommissionPotential = properties.reduce((acc, p) => acc + (convertToGBP(p.price, p.currency) * (p.commission_rate || 2) / 100), 0);
  const activeListingsCount = properties.filter(p => p.status === 'active').length;
  const pendingLeadsCount = leads.filter(l => l.status !== 'sold' && l.status !== 'lost').length;

  return (
    <div className="p-6 space-y-6">
      
      {/* Real Estate Agency - Professional Dashboard Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1 bg-slate-900 text-white p-5 rounded-[2rem] shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[160px]">
          <div className="relative z-10">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Toplam Portföy</span>
            <div className="text-3xl font-black mt-1">{properties.length}</div>
          </div>
          <div className="relative z-10 flex items-center gap-2 text-xs font-bold text-slate-400">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            <span>%{activeListingsCount > 0 ? Math.round((activeListingsCount/properties.length)*100) : 0} Aktif Satışta</span>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-5">
             <Home className="h-32 w-32" />
          </div>
        </div>

        <div className="md:col-span-1 bg-white p-5 rounded-[2rem] shadow-sm border border-slate-150 flex flex-col justify-between min-h-[160px]">
           <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bekleyen Leadler</span>
              <div className="text-3xl font-black text-slate-900 mt-1">{pendingLeadsCount}</div>
           </div>
           <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full self-start">
              <MessageSquare className="h-3 w-3" />
              <span>{leads.filter(l => l.status === 'new').length} Yeni Yanıt Bekliyor</span>
           </div>
        </div>

        <div className="md:col-span-1 bg-white p-5 rounded-[2rem] shadow-sm border border-slate-150 flex flex-col justify-between min-h-[160px]">
           <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Komisyon Potansiyeli</span>
              <div className="text-3xl font-black text-slate-900 mt-1">£{Math.round(totalCommissionPotential).toLocaleString()}</div>
           </div>
           <p className="text-[10px] font-bold text-slate-400">Tüm portföyden beklenen hizmet bedeli</p>
        </div>

        <div className="md:col-span-1 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white p-5 rounded-[2rem] shadow-lg shadow-indigo-200 flex flex-col justify-between min-h-[160px]">
           <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Kıbrıs & TR Pilot</span>
              <div className="text-lg font-black mt-2 leading-tight">Yatırımcı Bulucu Motoru Aktif</div>
           </div>
           <button 
             onClick={() => setActiveView('leads')}
             className="w-full py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-white/10"
           >
              Müşteri Taleplerini Gör
           </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center bg-white p-1 rounded-2xl shadow-sm border border-slate-150">
           <button 
             onClick={() => setActiveView('listings')}
             className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeView === 'listings' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             <Briefcase className="w-3.5 h-3.5" />
             PORTFÖY
           </button>
           <button 
             onClick={() => setActiveView('leads')}
             className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeView === 'leads' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             <Users className="w-3.5 h-3.5" />
             ALICI LEADLERİ
           </button>
           <button 
             onClick={() => setActiveView('owners')}
             className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeView === 'owners' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             <FolderLock className="w-3.5 h-3.5" />
             MÜLK SAHİPLERİ
           </button>
           <button 
             onClick={() => setActiveView('agents')}
             className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeView === 'agents' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             <Shield className="w-3.5 h-3.5" />
             DANIŞMANLAR
           </button>
           <button 
             onClick={() => setActiveView('crm')}
             className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeView === 'crm' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             <Clock className="w-3.5 h-3.5" />
             AJANDA & ANALİZ
           </button>
        </div>
        <button
          onClick={() => {
            setSelectedProperty(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 transition-all font-black text-xs uppercase shadow-md hover:shadow-indigo-600/10 active:scale-95"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          Yeni İlan Ekle
        </button>
      </div>

      {activeView === 'listings' && (
        <div className="space-y-6">
          {/* Filters and Search Grid */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Başlık, bölge veya danışman ara..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border-0 rounded-xl text-xs font-bold focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all text-slate-700"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <select
                className="w-full p-2 bg-slate-50 border-0 rounded-xl text-xs font-bold text-slate-600 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
              >
                <option value="all">Tüm Pilot Bölgeler</option>
                <option value="KKTC">Kuzey Kıbrıs (KKTC)</option>
                <option value="Girne">Girne / Kyrenia</option>
                <option value="İskele">İskele / Trikomo</option>
                <option value="TR">Türkiye (TR)</option>
              </select>
            </div>
            <div>
              <select
                className="w-full p-2 bg-slate-50 border-0 rounded-xl text-xs font-bold text-slate-600 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Tüm Durumlar</option>
                <option value="active">Satılık</option>
                <option value="optioned">Opsiyonlu</option>
                <option value="sold">Satıldı</option>
              </select>
            </div>
            <div>
              <select
                className="w-full p-2 bg-slate-50 border-0 rounded-xl text-xs font-bold text-slate-600 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                value={filterAgent}
                onChange={(e) => setFilterAgent(e.target.value)}
              >
                <option value="all">Tüm Danışmanlar</option>
                {agents.map(agent => (
                  <option key={agent} value={agent}>{agent}</option>
                ))}
              </select>
            </div>
          </div>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
          <span className="text-xs text-slate-500 font-bold">Portföy Yükleniyor...</span>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <Home className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-bold text-sm">Aradığınız kriterlere uygun gayrimenkul bulunamadı.</p>
          <p className="text-xs text-slate-400 mt-1">Yeni ilan girerek portföy oluşturabilir ve pilot satışlara devam edebilirsiniz.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map(property => {
            const matchesCount = runMatchingAlgorithm(property).length;
            
            return (
              <div 
                key={property.id} 
                className="bg-white rounded-3xl shadow-sm border border-slate-150 overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all group flex flex-col h-full relative"
              >
                {/* Image Banner */}
                <div className="w-full h-44 bg-slate-100 relative overflow-hidden">
                  {property.images && property.images.length > 0 ? (
                    <img 
                      src={property.images[0]} 
                      alt={property.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                      <Home className="w-12 h-12 stroke-[1.25]" />
                      <span className="text-[10px] uppercase font-black tracking-widest mt-1">Görsel Yok</span>
                    </div>
                  )}

                  {/* Flag Accent */}
                  <div className="absolute top-3 left-3 flex gap-1.5 items-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase text-white rounded-lg shadow-sm backdrop-blur-md ${property.country === 'KKTC' ? 'bg-indigo-600/90' : 'bg-red-600/90'}`}>
                      {property.country === 'KKTC' ? '🇨🇾 Kıbrıs (KKTC)' : '🇹🇷 Türkiye'}
                    </span>
                    {property.country === 'KKTC' && (
                      <span className="px-2 py-1 bg-amber-500/90 text-white font-black text-[9px] rounded-lg shadow-sm">
                        🇬🇧 UK Target
                      </span>
                    )}
                  </div>

                  {/* Status Overlay */}
                  <div className="absolute top-3 right-3">
                    <span className={`inline-flex px-2.5 py-1 text-[10px] font-black uppercase rounded-lg shadow-sm ${
                      property.status === 'active' ? 'bg-emerald-500 text-white' :
                      property.status === 'rented' ? 'bg-blue-500 text-white' :
                      property.status === 'optioned' ? 'bg-amber-500 text-white' :
                      'bg-slate-700 text-white'
                    }`}>
                      {property.status === 'active' ? 'SATILIK' :
                       property.status === 'rented' ? 'KİRALIK' :
                       property.status === 'optioned' ? 'OPSİYONLU (Kapora alındı)' :
                       'SATILDI'}
                    </span>
                  </div>

                  {/* matterport tour is highlighted */}
                  {property.virtual_tour_url ? (
                    <div 
                      className="absolute bottom-3 left-3 cursor-pointer"
                      onClick={() => setTourUrl(property.virtual_tour_url || null)}
                    >
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/95 text-indigo-700 rounded-lg text-[10px] font-black shadow-lg shadow-indigo-600/20 border border-indigo-100 animate-pulse">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.29 7 12 12 20.71 7"></polyline><line x1="12" y1="22" x2="12" y2="12"></line></svg>
                        3D GEZİNTİ
                      </span>
                    </div>
                  ) : (
                    <div className="absolute bottom-3 left-3">
                         <button 
                             onClick={async () => {
                                 await api.triggerAIJob({ entity_type: 'real_estate', entity_id: property.id, payload: { images: property.images } });
                                 alert("3D Tur oluşturma isteği alındı!");
                             }}
                             className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-black shadow-lg hover:bg-indigo-700"
                         >
                             3D OLUŞTUR
                         </button>
                    </div>
                  )}
                </div>

                {/* Content body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {property.title}
                      </h4>
                      <p className="text-slate-400 text-[10px] font-bold flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 w-3 inline text-slate-400" />
                        {property.location} {property.kktc_region ? `• Bölge: ${property.kktc_region}` : ""}
                      </p>
                    </div>

                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                      {property.description || "Açıklama girilmemiş..."}
                    </p>

                    {/* Regional Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {property.kktc_title_type && (
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-extrabold border border-indigo-100">
                          📜 {property.kktc_title_type}
                        </span>
                      )}
                      {property.block_plot && (
                        <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md text-[10px] font-extrabold border border-slate-250">
                          📍 Ada/Parsel {property.block_plot}
                        </span>
                      )}
                      {property.room_count && (
                        <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md text-[10px] font-bold border border-slate-200">
                          🚪 Oda: {property.room_count}
                        </span>
                      )}
                      {property.square_meters && (
                        <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md text-[10px] font-bold border border-slate-200">
                          📐 {property.square_meters}m² Net {property.sqm_gross ? `/ ${property.sqm_gross}m² Brüt` : ''}
                        </span>
                      )}
                      {property.in_gated_community && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md text-[10px] font-bold border border-emerald-100">
                          🏡 Site İçi {property.dues ? `• ${property.dues} ${property.dues_currency || 'GBP'} Aidat` : ''}
                        </span>
                      )}
                      {property.facade && (
                        <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md text-[10px] font-bold border border-slate-200">
                          🧭 {property.facade} Cephe
                        </span>
                      )}
                    </div>

                    {/* Safe Document Icon indicators for managers only */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <FolderLock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Resmî Evraklar:</span>
                        {property.documents && property.documents.length > 0 ? (
                          <span className="text-emerald-600 font-extrabold flex items-center gap-0.5">
                            ✔ Yüklü ({property.documents.length} adet)
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">Yüklenmemiş</span>
                        )}
                      </div>

                      {(isOfficeManager || property.listing_agent_name) && (
                        <div className="flex items-center justify-between gap-2 text-[10px] font-bold text-slate-500 bg-indigo-50/30 p-2.5 rounded-xl border border-indigo-100/50">
                          <div className="flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Portföy Sorumlusu:</span>
                          </div>
                          <span className="text-indigo-700 font-black truncate max-w-[100px]">
                            {property.listing_agent_name || "Atanmamış"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-col space-y-3">
                    
                    {/* Alıcı Portföy & Müşteri Eşleştirme Motoru */}
                    <div 
                      onClick={() => handleOpenMatching(property)}
                      className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 p-2.5 rounded-xl flex items-center justify-between cursor-pointer active:scale-98 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                          <Users className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <div className="text-left">
                          <span className="block text-[10px] font-black text-indigo-950 uppercase tracking-wide">Yatırımcı Bulucu Motoru</span>
                          <span className="block text-[9px] text-indigo-600">
                            {matchesCount > 0 ? `🔥 ${matchesCount} Eşleşen Alıcı Bulundu!` : 'Kriterlere uygun alıcı bulunamadı'}
                          </span>
                        </div>
                      </div>
                      {matchesCount > 0 && (
                        <span className="inline-flex items-center gap-1 bg-indigo-600 text-white px-2 py-1 rounded-lg text-[9px] font-black uppercase">
                          Eşleştir
                          <Sparkles className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>

                    {/* Price and Standard Action Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="text-slate-900">
                        <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">İLAN BEDELİ</span>
                        <span className="text-base font-black text-indigo-600">
                          {property.currency === 'GBP' ? '£' : property.currency === 'USD' ? '$' : property.currency === 'EUR' ? '€' : '₺'}{property.price.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex gap-1.5 pt-1">
                        <Link 
                          to={`/store/${user?.store_slug || 'portal'}`} 
                          target="_blank"
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-indigo-100 group/btn"
                          title="Amiral Sitede Gör"
                        >
                          <Globe className="w-4 h-4 group-hover/btn:animate-pulse" />
                        </Link>
                        <button 
                          onClick={() => { setSelectedProperty(property); setIsModalOpen(true); }}
                          className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all border border-slate-100"
                          title="Düzenle"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm('Bu gayrimenkulü silmek istediğinize emin misiniz?')) {
                              if (onDelete) onDelete(property.id);
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
      )}

      {/* MATCHING ALGORITHM OVERLAY MODAL */}
      {matchingProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMatchingProperty(null)} />
          <div className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-xl relative z-10 flex flex-col max-h-[85vh] shadow-2xl transition-all">
            <div className="flex justify-between items-start mb-6 pb-2 border-b">
              <div>
                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">AKILLI EŞLEŞTİRME ALGORİTMASI</span>
                <h4 className="text-xl font-bold text-slate-900 leading-tight">Yatırımcı Portföy Uyumu</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-md">Gayrimenkul: {matchingProperty.title}</p>
              </div>
              <button 
                onClick={() => setMatchingProperty(null)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 flex-1 pr-1 hide-scrollbar">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50 space-y-1">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wide">Gayrimenkul Kriterleri</span>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 font-bold">
                  <div>• Lokasyon: <span className="text-indigo-600">{matchingProperty.location} ({matchingProperty.kktc_region || 'TR'})</span></div>
                  <div>• Net Alan: <span className="text-indigo-600">{matchingProperty.square_meters || 0} m²</span></div>
                  <div>• Fiyatı: <span className="text-indigo-600">{matchingProperty.currency} {matchingProperty.price.toLocaleString()}</span></div>
                  <div>• Koçan Tipi: <span className="text-indigo-600">{matchingProperty.kktc_title_type || 'Belirtilmedi'}</span></div>
                </div>
              </div>

              <div className="space-y-3">
                <span className="block text-xs font-black text-slate-800">Eşleşen Yatırımcılar ({matchList.length})</span>
                {matchList.length === 0 ? (
                  <div className="text-center py-8 text-xs font-bold text-slate-400 bg-slate-50 rounded-xl">
                    Bu gayrimenkule uyan aktif bir alıcı talebi bulunmuyor.
                  </div>
                ) : (
                  matchList.map(({ buyer, score, reason }) => (
                    <div key={buyer.id} className="p-4 bg-slate-50/60 border hover:border-indigo-200 rounded-2xl space-y-3 transition-colors relative">
                      
                      {/* Percent Badge */}
                      <span className="absolute top-4 right-4 bg-indigo-600 text-white font-black text-xs px-2.5 py-1 rounded-full shadow-sm">
                        %{score} Match
                      </span>

                      <div className="space-y-1">
                        <div className="flex gap-2 items-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase text-white ${buyer.nationality === 'UK' ? 'bg-blue-600' : 'bg-red-500'}`}>
                            {buyer.nationality === 'UK' ? '🇬🇧 UK' : '🇹🇷 TR'}
                          </span>
                          <span className="font-extrabold text-xs text-slate-900">{buyer.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-none">
                          Tercihler: {buyer.preferredRegions.join(", ")} • Min: {buyer.minSqm}m² • Max Bütçe: {buyer.currency === 'GBP' ? '£' : '₺'}{buyer.maxBudget.toLocaleString()}
                        </p>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-[10px] font-medium text-slate-600 leading-relaxed">
                        {reason}
                      </div>

                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => window.open(`mailto:${buyer.email}?subject=LookPrice%20Yat%C4%B1r%C4%B1m%20F%C4%B1rsat%C4%B1&body=Merhaba%20${buyer.name},%20Kriterlerinize%20uygun%20sanal%20gezintisi%20haz%C4%B1r%20olay%20portf%C3%B6y%C3%BC%20inceleyebilirsiniz:%20${matchingProperty.virtual_tour_url || ''}`, '_blank')}
                          className="bg-white hover:bg-indigo-50 text-indigo-700 font-extrabold text-[10px] px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors"
                        >
                          Yatırım PDF Gönder
                        </button>
                        <button
                          onClick={() => window.open(`https://wa.me/${buyer.phone.replace(/\s+/g, '')}?text=Merhaba%20${buyer.name},%20Kriterlerinize%20uygun%20yeni%20KKTC%20portf%C3%B6y%C3%BCm%C3%BCz%20yay%C4%B1mland%C4%B1!%20Sanal%20Tur:%20${matchingProperty.virtual_tour_url || ''}`, '_blank')}
                          className="bg-green-600 hover:bg-green-700 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow"
                        >
                          WhatsApp’tan Paylaş
                        </button>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t mt-4">
              <button 
                onClick={() => setMatchingProperty(null)}
                className="w-full py-3 bg-slate-900 text-white font-bold text-xs uppercase rounded-xl"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real Real Estate Modal component */}
      <RealEstateModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        property={selectedProperty}
        userRole={userRole}
        onSave={(p) => {
          if (onSave) onSave(p);
          setIsModalOpen(false);
        }}
      />

      {activeView === 'owners' && (
        <div className="bg-white rounded-[2rem] border border-slate-150 shadow-sm p-8">
           <div className="flex justify-between items-center mb-8">
             <div>
               <h4 className="text-2xl font-black text-slate-900">Mülk Sahipleri Rehberi</h4>
               <p className="text-sm text-slate-500 font-medium">Portföyünüzdeki gayrimenkul sahiplerinin listesi ve CRM kayıtları.</p>
             </div>
             <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">
                Yeni Mal Sahibi Kaydı
             </button>
           </div>

           <div className="overflow-x-auto">
             <table className="w-full">
               <thead>
                 <tr className="text-left bg-slate-50 border-b border-slate-100">
                   <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mal Sahibi / Müşteri</th>
                   <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">İletişim Bilgileri</th>
                   <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Aktif Portföyler</th>
                   <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Son Görüşme</th>
                   <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">İşlem</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {Array.from(new Set(properties.filter(p => p.owner_name).map(p => p.owner_name))).map(ownerName => {
                   const ownerProperties = properties.filter(p => p.owner_name === ownerName);
                   const firstProp = ownerProperties[0];
                   
                   return (
                     <tr key={ownerName as string} className="hover:bg-slate-50/50 transition-colors">
                       <td className="px-6 py-4">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-black text-sm">
                              {(ownerName as string)[0]}
                            </div>
                            <div>
                               <div className="text-sm font-black text-slate-900">{ownerName}</div>
                               <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">VIP Portföy Sahibi</div>
                            </div>
                         </div>
                       </td>
                       <td className="px-6 py-4">
                         <div className="text-xs font-bold text-slate-700">{firstProp.owner_phone || 'Telefon yok'}</div>
                         <div className="text-[10px] text-slate-400">{firstProp.owner_email || 'E-posta tanımlanmamış'}</div>
                       </td>
                       <td className="px-6 py-4">
                         <div className="flex flex-wrap gap-1">
                           {ownerProperties.map(p => (
                             <span key={p.id} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md text-[9px] font-black">
                               #{p.id} {p.title.substring(0, 15)}...
                             </span>
                           ))}
                         </div>
                       </td>
                       <td className="px-6 py-4">
                         <div className="text-[10px] font-black text-slate-500 uppercase">2 gün önce</div>
                         <div className="text-[9px] text-slate-400 truncate max-w-[120px]">Fiyat güncellemesi görüşüldü.</div>
                       </td>
                       <td className="px-6 py-4">
                         <div className="flex gap-2">
                            <button 
                               onClick={() => {
                                 setEditingOwnerInfo({ name: ownerName, phone: firstProp.owner_phone, email: firstProp.owner_email });
                                 setShowOwnerForm(true);
                               }}
                               className="text-[10px] font-black text-indigo-600 uppercase hover:underline"
                             >
                               Kaydı Düzenle
                             </button>
                            <button className="text-[10px] font-black text-slate-400 uppercase hover:text-slate-900">Ara</button>
                         </div>
                       </td>
                     </tr>
                   );
                 })}
                 {properties.filter(p => p.owner_name).length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <FolderLock className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold text-sm">Henüz kayıtlı mülk sahibi bilgisi bulunmuyor.</p>
                        <p className="text-xs text-slate-400 mt-1">İlan eklerken mal sahibi bilgilerini girerek bu rehberi oluşturabilirsiniz.</p>
                      </td>
                    </tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {/* AGENTS VIEW */}
      {activeView === 'agents' && (
        <div className="space-y-6">
           <div className="bg-white rounded-[2rem] border border-slate-150 shadow-sm p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h4 className="text-2xl font-black text-slate-900">Emlak Danışmanı & Broker Yönetimi</h4>
                  <p className="text-sm text-slate-500 font-medium">Ofisinizdeki saha ekibinin portföy dağılımı ve performans metrikleri.</p>
                </div>
                 <button 
                   onClick={() => {
                     setEditingAgent(null);
                     setShowAgentForm(true);
                   }}
                   className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider active:scale-95 transition-all flex items-center gap-2"
                 >
                    <Plus className="w-4 h-4" />
                    Yeni Danışman Ekle
                 </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {staffAgents.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                    <Shield className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold text-sm">Ofisinizde henüz tanımlı bir danışman bulunmuyor.</p>
                  </div>
                ) : (
                  staffAgents.map(agent => {
                    const agentListings = properties.filter(p => p.listing_agent_name === agent.name);
                    const commissionAgent = agentListings.reduce((acc, p) => acc + (convertToGBP(p.price, p.currency) * (p.commission_rate || 2) / 100), 0);
                    
                    return (
                      <div key={agent.id} className="bg-slate-50 rounded-[2rem] border border-slate-100 p-6 flex flex-col hover:border-indigo-200 hover:bg-white transition-all group relative">
                         <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingAgent(agent); setShowAgentForm(true); }} className="p-1.5 bg-white rounded-lg border border-slate-100 text-slate-400 hover:text-indigo-600 shadow-sm"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => deleteAgent(agent.id)} className="p-1.5 bg-white rounded-lg border border-slate-100 text-slate-400 hover:text-red-600 shadow-sm"><Trash2 className="w-3.5 h-3.5" /></button>
                         </div>
                         <div className="flex items-center gap-4 mb-6">
                            <div className="relative">
                               <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-xl overflow-hidden">
                                  <img 
                                    src={`https://ui-avatars.com/api/?name=${agent.name}&background=random&color=fff`} 
                                    alt={agent.name} 
                                    className="w-full h-full object-cover"
                                  />
                               </div>
                               <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full"></div>
                            </div>
                            <div>
                               <h5 className="font-black text-slate-900">{agent.name}</h5>
                               <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 uppercase tracking-tight">Danışman</span>
                            </div>
                         </div>

                         <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-white p-3 rounded-2xl border border-slate-100">
                               <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Portföy</span>
                               <span className="text-lg font-black text-slate-900">{agentListings.length} İlan</span>
                            </div>
                            <div className="bg-white p-3 rounded-2xl border border-slate-100">
                               <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Hizmet Bedeli</span>
                               <span className="text-lg font-black text-emerald-600">£{Math.round(commissionAgent).toLocaleString()}</span>
                            </div>
                         </div>

                         <div className="space-y-3 mb-6">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                               <span className="text-slate-500">Kapanış Oranı</span>
                               <span className="text-slate-900">%24</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                               <div className="h-full bg-indigo-600 rounded-full" style={{ width: '24%' }}></div>
                            </div>
                         </div>

                         <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] font-black uppercase tracking-tight">
                            <button 
                              onClick={() => setSelectedAgent(agent.name)}
                              className="text-indigo-600 hover:underline"
                            >
                               Performans Özeti
                            </button>
                            <button 
                              onClick={() => deleteAgent(agent.id)}
                              className="text-slate-400 hover:text-red-500"
                            >
                               Pasif Yap / Sil
                            </button>
                         </div>
                      </div>
                    );
                  })
                )}
              </div>
           </div>
        </div>
      )}
      {activeView === 'crm' && (
        <div className="space-y-6">
           {/* CRM Header & Activity Feed Button */}
           <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-150 shadow-sm">
              <div>
                <h4 className="text-xl font-black text-slate-900">Ofis Aktivite Akışı</h4>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Müşteri İlişkileri ve Satış Zaman Çizelgesi</p>
              </div>
              <button 
                onClick={() => setShowActivityForm(true)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2"
              >
                 <Edit2 className="w-4 h-4" />
                 Aktivite Ekle
              </button>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Timeline */}
              <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-150 shadow-sm p-8">
                 <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    Zaman Çizelgesi
                 </h5>
                 
                 <div className="relative space-y-8 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                    {activities.map((activity) => (
                       <div key={activity.id} className="relative pl-12">
                          <div className={`absolute left-0 top-0 w-10 h-10 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 ${
                             activity.type === 'calling' ? 'bg-indigo-500 text-white' : 
                             activity.type === 'showing' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-white'
                          }`}>
                            {activity.type === 'calling' ? <MessageSquare className="w-4 h-4" /> : <Home className="w-4 h-4" />}
                          </div>
                          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 hover:border-indigo-100 transition-all">
                             <div className="flex justify-between items-start mb-2">
                                <h6 className="font-black text-slate-900">{activity.title}</h6>
                                <span className="text-[9px] font-bold text-slate-400">{new Date(activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                             </div>
                             <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">{activity.detail}</p>
                             <div className="flex items-center gap-2 pt-3 border-t border-slate-150">
                                <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[9px] font-black text-indigo-600">
                                   {activity.agent[0]}
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{activity.agent} • Sorumlu Danışman</span>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Right Column: Key Stats/Reminders */}
              <div className="space-y-6">
                 <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-600/20">
                    <h6 className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-6">Ofis Hedefi</h6>
                    <div className="space-y-4">
                       <div className="flex justify-between text-xs font-black">
                          <span>Aylık Satış Kotası</span>
                          <span>£185K / £300K</span>
                       </div>
                       <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full" style={{ width: '62%' }}></div>
                       </div>
                       <p className="text-[10px] font-bold text-indigo-200">Ayın bitmesine 12 gün kaldı. Mevcut hızla hedefe ulaşılması bekleniyor.</p>
                    </div>
                 </div>

                 <div className="bg-white rounded-[2rem] border border-slate-150 shadow-sm p-6">
                    <h6 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                       <FileCheck className="w-3.5 h-3.5" />
                       Hızlı Görevler
                    </h6>
                    <div className="space-y-4">
                       <button className="w-full text-left p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                          <span className="text-xs font-black text-slate-700">Evrak Bekleyen İlanlar (4)</span>
                          <CheckCircle2 className="w-4 h-4 ml-auto text-slate-200 group-hover:text-indigo-600" />
                       </button>
                       <button className="w-full text-left p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-red-400"></div>
                          <span className="text-xs font-black text-slate-700">Süresi Dolan Kontratlar (2)</span>
                          <CheckCircle2 className="w-4 h-4 ml-auto text-slate-200 group-hover:text-indigo-600" />
                       </button>
                       <button className="w-full text-left p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                          <span className="text-xs font-black text-slate-700">Yeni Alıcı Eşleşmeleri (7)</span>
                          <CheckCircle2 className="w-4 h-4 ml-auto text-slate-200 group-hover:text-indigo-600" />
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* DETAIL MODALS (Owner, Agent, Activity Form) */}
      <AnimatePresence>
        {selectedOwner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setSelectedOwner(null)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden"
            >
               <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-2xl font-black">
                       {selectedOwner[0]}
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-slate-900">{selectedOwner}</h4>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Portföy Sahibi CRM Kartı</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedOwner(null)} className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl transition-all">
                    <X className="w-5 h-5" />
                  </button>
               </div>

               <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Toplam Mülk</span>
                     <span className="text-2xl font-black text-slate-900">{properties.filter(p => p.owner_name === selectedOwner).length} Birim</span>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Güven Skoru</span>
                     <span className="text-2xl font-black text-emerald-600">A+ VIP</span>
                  </div>
               </div>

               <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Mülk Portföyü</h5>
               <div className="space-y-3 mb-8 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  {properties.filter(p => p.owner_name === selectedOwner).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-150 hover:border-indigo-200 transition-all">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden">
                             {p.images?.[0] && <img src={p.images[0]} className="w-full h-full object-cover" />}
                          </div>
                          <div>
                             <span className="block text-xs font-black text-slate-900 leading-tight">{p.title}</span>
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{p.location}</span>
                          </div>
                       </div>
                       <span className="text-xs font-black text-indigo-600">£{p.price.toLocaleString()}</span>
                    </div>
                  ))}
               </div>

               <div className="flex gap-3">
                  <button 
                    onClick={() => {
                       const message = encodeURIComponent(`Merhaba, ${selectedOwner} mülk portföyünüz hakkında bilgilendirme özeti hazırladım. İncelemek için linki kullanabilirsiniz.`);
                       const ownerPh = properties.find(p => p.owner_name === selectedOwner)?.owner_phone?.replace(/[^0-9]/g, '') || '';
                       window.open(`https://wa.me/${ownerPh}?text=${message}`, '_blank');
                    }}
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-indigo-600/20"
                  >
                     WhatsApp Portföy Özeti Gönder
                  </button>
                  <button 
                    onClick={() => alert(lang === 'tr' ? 'İletişim geçmişi arşivi yükleniyor...' : 'Communication history archive is loading...')}
                    className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all"
                  >
                     İletişim Geçmişini Gör
                  </button>
               </div>
            </motion.div>
          </div>
        )}

        {selectedAgent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setSelectedAgent(null)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-xl relative z-10 shadow-2xl"
            >
               <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 bg-indigo-100 rounded-2xl overflow-hidden ring-4 ring-white shadow-md">
                        <img src={`https://ui-avatars.com/api/?name=${selectedAgent}&background=4f46e5&color=fff`} className="w-full h-full object-cover" />
                     </div>
                     <div>
                        <h4 className="text-xl font-black text-slate-900">{selectedAgent}</h4>
                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-lg inline-block mt-1">Emlak Yatırım Danışmanı</p>
                     </div>
                  </div>
                  <button onClick={() => setSelectedAgent(null)} className="p-2 bg-slate-100 rounded-xl">
                     <X className="w-4 h-4" />
                  </button>
               </div>

               <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Aktif Portföy</span>
                        <span className="text-lg font-black text-slate-900">{properties.filter(p => p.listing_agent_name === selectedAgent).length} Gayrimenkul</span>
                     </div>
                     <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Müşteri Puanı</span>
                        <span className="text-lg font-black text-emerald-600">4.9 / 5.0</span>
                     </div>
                  </div>

                  <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                     <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-black text-indigo-900 uppercase tracking-widest">Performans Grafiği</span>
                        <span className="text-[10px] font-bold text-indigo-600">Son 6 Ay</span>
                     </div>
                     <div className="h-24 flex items-end gap-2 px-2">
                        {[40, 70, 45, 90, 65, 80].map((h, i) => (
                          <div key={i} className="flex-1 bg-indigo-600 rounded-t-lg transition-all hover:bg-indigo-400" style={{ height: `${h}%` }}></div>
                        ))}
                     </div>
                  </div>

                  <button 
                    onClick={() => alert(lang === 'tr' ? 'Personel performans raporu PDF olarak hazırlanıyor...' : 'Staff performance report is being prepared as PDF...')}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all"
                  >
                     Kapsamlı Raporu İndir
                  </button>
               </div>
            </motion.div>
          </div>
        )}

        {showActivityForm && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowActivityForm(false); setSelectedActivity(null); }} />
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white rounded-3xl p-8 w-full max-w-md relative z-10 shadow-2xl">
                 <h4 className="text-xl font-black text-slate-900 mb-2">{selectedActivity ? 'Aktiviteyi Düzenle' : 'CRM Aktivitesi Ekle'}</h4>
                 <p className="text-xs text-slate-400 font-medium mb-6">Ofis içi iletişim ve satış sürecini takip edin.</p>
                 
                 <form onSubmit={handleAddActivity} className="space-y-4">
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Aktivite Tipi</label>
                       <select name="type" defaultValue={selectedActivity?.type} className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-700">
                          <option value="calling">📞 Telefon Görüşmesi</option>
                          <option value="showing">🏠 Yer Gösterme / Sunum</option>
                          <option value="contract">✍️ Sözleşme / İmza</option>
                          <option value="other">💬 Diğer</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Başlık</label>
                       <input name="title" required defaultValue={selectedActivity?.title} placeholder="Örn: Portföy Görüşmesi" className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-700" />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Açıklama / Notlar</label>
                       <textarea name="detail" required defaultValue={selectedActivity?.detail} rows={3} placeholder="Müşteri beklentileri, görüşme detayları..." className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-700"></textarea>
                    </div>
                    <div className="pt-4 flex gap-3">
                       <button type="button" onClick={() => { setShowActivityForm(false); setSelectedActivity(null); }} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest">İptal</button>
                       <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/10">Kaydet</button>
                    </div>
                 </form>
              </motion.div>
           </div>
        )}

        {showLeadForm && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowLeadForm(false); setSelectedLead(null); }} />
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg relative z-10 shadow-2xl">
                 <h4 className="text-2xl font-black text-slate-900 mb-2">{selectedLead ? 'Talebi Düzenle' : 'Yeni Lead Kaydı'}</h4>
                 <p className="text-xs text-slate-400 font-medium mb-6">Müşteri talep bilgilerini sisteme işleyin.</p>
                 
                 <form onSubmit={handleAddLead} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Müşteri Adı Soyadı</label>
                         <input name="customer_name" defaultValue={selectedLead?.customer_name} required className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-700" />
                      </div>
                      <div>
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Telefon</label>
                         <input name="customer_phone" defaultValue={selectedLead?.customer_phone} required className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-700" />
                      </div>
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">İlgilendiği Gayrimenkul Başlığı</label>
                       <input name="property_title" defaultValue={selectedLead?.property_title} placeholder="Örn: Girne 3+1 Daire" className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-700" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Kaynak</label>
                         <select name="source" defaultValue={selectedLead?.source} className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-700">
                            <option value="manual">Manuel Giriş</option>
                            <option value="website">Web Sitesi</option>
                            <option value="whatsapp">WhatsApp</option>
                            <option value="phone">Telefon</option>
                         </select>
                      </div>
                      <div>
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Durum</label>
                         <select name="status" defaultValue={selectedLead?.status} className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-700">
                            <option value="new">YENİ</option>
                            <option value="contacted">ARANDI</option>
                            <option value="showing">YER GÖSTERİLDİ</option>
                            <option value="offer">TEKLİF ALINDI</option>
                         </select>
                      </div>
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Notlar</label>
                       <textarea name="notes" defaultValue={selectedLead?.notes} rows={3} className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-700"></textarea>
                    </div>
                    <div className="pt-4 flex gap-3">
                       <button type="button" onClick={() => { setShowLeadForm(false); setSelectedLead(null); }} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest">Vazgeç</button>
                       <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/10">Kaydet</button>
                    </div>
                 </form>
              </motion.div>
           </div>
        )}

        {showAgentForm && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowAgentForm(false); setEditingAgent(null); }} />
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white rounded-[2.5rem] p-8 w-full max-w-md relative z-10 shadow-2xl">
                 <h4 className="text-2xl font-black text-slate-900 mb-2">{editingAgent ? 'Danışmanı Düzenle' : 'Yeni Danışman Ekle'}</h4>
                 <p className="text-xs text-slate-400 font-medium mb-6">Ofis kadronuza yeni bir danışman tanımlayın.</p>
                 
                 <form onSubmit={handleAgentSubmit} className="space-y-4">
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Ad Soyad</label>
                       <input name="name" defaultValue={editingAgent?.name} required className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-700" />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Telefon Numarası</label>
                       <input name="phone" defaultValue={editingAgent?.phone} required className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-700" />
                    </div>
                    <div className="pt-4 flex gap-3">
                       <button type="button" onClick={() => { setShowAgentForm(false); setEditingAgent(null); }} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest">İptal</button>
                       <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/10">Kaydet</button>
                    </div>
                 </form>
              </motion.div>
           </div>
        )}
        {showOwnerForm && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowOwnerForm(false); setEditingOwnerInfo(null); }} />
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white rounded-[2.5rem] p-8 w-full max-w-md relative z-10 shadow-2xl">
                 <h4 className="text-2xl font-black text-slate-900 mb-2">{editingOwnerInfo ? 'Mal Sahibini Düzenle' : 'Yeni Mal Sahibi Kaydı'}</h4>
                 <p className="text-xs text-slate-400 font-medium mb-6">Mülk sahibi iletişim ve CRM bilgilerini güncelleyin.</p>
                 
                 <form onSubmit={handleOwnerSubmit} className="space-y-4">
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Ad Soyad</label>
                       <input name="name" defaultValue={editingOwnerInfo?.name} required className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-700" />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Telefon Numarası</label>
                       <input name="phone" defaultValue={editingOwnerInfo?.phone} required className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-700" />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">E-posta</label>
                       <input name="email" defaultValue={editingOwnerInfo?.email} className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-700" />
                    </div>
                    <div className="pt-4 flex gap-3">
                       <button type="button" onClick={() => { setShowOwnerForm(false); setEditingOwnerInfo(null); }} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest">İptal</button>
                       <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/10">Kaydet</button>
                    </div>
                 </form>
              </motion.div>
           </div>
        )}
      </AnimatePresence>

      {activeView === 'leads' && (
         <div className="space-y-6">
             <div className="bg-white rounded-[2rem] border border-slate-150 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h4 className="text-lg font-black text-slate-900">Aktif Alıcı Talepleri (Leads)</h4>
                        <p className="text-xs text-slate-500 font-medium">Tüm ilanlara gelen formlar ve manuel girişler</p>
                    </div>
                    <button 
                        onClick={() => {
                          setSelectedLead(null);
                          setShowLeadForm(true);
                        }}
                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all"
                    >
                        Manuel Lead Ekle
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Müşteri</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">İlgili Gayrimenkul</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kaynak</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Durum</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Danışman</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {leads.map(lead => (
                                <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-extrabold text-sm text-slate-900">{lead.customer_name}</div>
                                        <div className="text-[10px] text-slate-500 font-mono">{lead.customer_phone}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-bold text-indigo-600 line-clamp-1">{lead.property_title || 'Genel Sorgu'}</div>
                                        <div className="text-[9px] text-slate-400 mt-1 flex items-center gap-1">
                                          <Clock className="w-2.5 h-2.5" />
                                          {new Date(lead.created_at).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${lead.source === 'website' ? 'bg-blue-100 text-blue-700' : lead.source === 'whatsapp' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                                            {lead.source}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select 
                                          className="bg-transparent border-0 text-xs font-bold text-slate-700 focus:ring-0 p-0 cursor-pointer hover:text-indigo-600 transition-colors"
                                          value={lead.status}
                                          onChange={(e) => {
                                            const newStatus = e.target.value;
                                            setLeads(leads.map(l => l.id === lead.id ? { ...l, status: newStatus as any } : l));
                                          }}
                                        >
                                            <option value="new">YENİ</option>
                                            <option value="contacted">ARANDI</option>
                                            <option value="showing">YER GÖSTERİLDİ</option>
                                            <option value="offer">TEKLİF ALINDI</option>
                                            <option value="sold">SATILDI</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-bold text-slate-600">{lead.assigned_agent_name || 'Atanmamış'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                          <button 
                                            onClick={() => {
                                              const note = prompt('Lead için not giriniz:');
                                              if (note) {
                                                setActivities([{
                                                  id: Date.now(),
                                                  type: 'calling',
                                                  title: `Lead Takibi: ${lead.customer_name}`,
                                                  detail: note,
                                                  date: new Date().toISOString(),
                                                  agent: user?.name || 'Admin'
                                                }, ...activities]);
                                              }
                                            }}
                                            className="text-indigo-600 hover:underline text-[10px] font-black uppercase tracking-tight"
                                          >
                                            Not Ekle
                                          </button>
                                          <button 
                                            onClick={() => {
                                              setSelectedLead(lead);
                                              setShowLeadForm(true);
                                            }}
                                            className="text-slate-600 hover:underline text-[10px] font-black uppercase tracking-tight"
                                          >
                                            Düzenle
                                          </button>
                                          <button 
                                            onClick={() => deleteLead(lead.id)}
                                            className="text-red-500 hover:underline text-[10px] font-black uppercase tracking-tight"
                                          >
                                            Sil
                                          </button>
                                          <button 
                                            onClick={() => window.open(`tel:${lead.customer_phone}`)}
                                            className="text-slate-400 hover:text-slate-900 text-[10px] font-black uppercase tracking-tight"
                                          >
                                            Ara
                                          </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </div>
         </div>
      )}

      {activeView === 'crm' && (
         <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-white border border-slate-150 rounded-[2rem] shadow-sm">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dönüşüm Oranı</span>
                   <div className="text-2xl font-black text-slate-900 mt-1">%14.2</div>
                   <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: '14.2%' }}></div>
                   </div>
                </div>
                <div className="p-5 bg-white border border-slate-150 rounded-[2rem] shadow-sm">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ort. Satış Süresi</span>
                   <div className="text-2xl font-black text-slate-900 mt-1">38 Gün</div>
                   <p className="text-[10px] text-emerald-600 font-bold mt-1">↓ %12 Geçen aya göre</p>
                </div>
                <div className="p-5 bg-white border border-slate-150 rounded-[2rem] shadow-sm">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aktif Teklifler</span>
                   <div className="text-2xl font-black text-slate-900 mt-1">12 Adet</div>
                   <p className="text-[10px] text-indigo-600 font-bold mt-1">£420k Toplam Hacim</p>
                </div>
                <div className="p-5 bg-white border border-slate-150 rounded-[2rem] shadow-sm">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ekspertiz Talepleri</span>
                   <div className="text-2xl font-black text-slate-900 mt-1">5 Yeni</div>
                   <p className="text-[10px] text-slate-400 font-bold mt-1">Saha ekibi atama bekliyor</p>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[2rem] border border-slate-150 shadow-sm p-6 overflow-hidden">
                        <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-indigo-600" />
                            Portföy Sahibi / Mülk Sahipleri Rehberi
                        </h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mülk Sahibi</th>
                                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">İrtibat</th>
                                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Portföy Sayısı</th>
                                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {Array.from(new Set(properties.filter(p => p.owner_name).map(p => p.owner_name))).map((ownerName, idx) => {
                                        const ownerProps = properties.filter(p => p.owner_name === ownerName);
                                        const p = ownerProps[0];
                                        return (
                                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                              <td className="py-4">
                                                  <button 
                                                    onClick={() => setSelectedOwner(ownerName as string)}
                                                    className="text-sm font-black text-slate-900 hover:text-indigo-600 transition-colors text-left"
                                                  >
                                                    {ownerName}
                                                  </button>
                                                  <div className="text-[10px] text-slate-500">{p.owner_email || 'E-posta yok'}</div>
                                              </td>
                                              <td className="py-4 text-xs font-bold text-slate-700">{p.owner_phone || '-'}</td>
                                              <td className="py-4 text-xs font-black text-indigo-600">{ownerProps.length} Portföy</td>
                                              <td className="py-4">
                                                  <button 
                                                    onClick={() => setSelectedOwner(ownerName as string)}
                                                    className="text-[10px] font-black text-indigo-600 uppercase hover:underline"
                                                  >
                                                    Detaylar
                                                  </button>
                                              </td>
                                          </tr>
                                        );
                                    })}
                                    {properties.filter(p => p.owner_name).length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-10 text-center text-xs font-bold text-slate-400">
                                                Henüz kayıtlı mülk sahibi bilgisi bulunmuyor.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-[2rem] border border-slate-150 shadow-sm p-6">
                        <h4 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-indigo-600" />
                            Yaklaşan Aktiviteler
                        </h4>
                        <div className="space-y-4">
                            <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="bg-white p-2 rounded-xl text-center min-w-[50px] shadow-sm border border-slate-100">
                                    <div className="text-[10px] font-black text-slate-400">MAY</div>
                                    <div className="text-lg font-black text-slate-900">22</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-indigo-600 uppercase">Yer Gösterme</div>
                                    <div className="text-sm font-extrabold text-slate-900">Girne Alsancak Penthouse Sunumu</div>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Müşteri: Emily Watson • Danışman: Can Portföy</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                <div className="bg-white p-2 rounded-xl text-center min-w-[50px] shadow-sm border border-slate-100">
                                    <div className="text-[10px] font-black text-slate-400">MAY</div>
                                    <div className="text-lg font-black text-slate-900">24</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-emerald-600 uppercase">Sözleşme Yenileme</div>
                                    <div className="text-sm font-extrabold text-slate-900">Lefkoşa Mal Sahibi Görüşmesi</div>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Yetki belgesi süresi doluyor.</p>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowActivityForm(true)}
                            className="w-full mt-4 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-black text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all"
                        >
                            + AKTİVİTE EKLE
                        </button>
                    </div>

                    <div className="bg-slate-900 text-white rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h4 className="text-lg font-black mb-2">Broker İstatistiği</h4>
                            <p className="text-xs text-slate-400 font-bold mb-6">Ofisler arası randıman karşılaştırması</p>
                            
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-[10px] font-black uppercase mb-1.5">
                                        <span>GİRNE MERKEZ</span>
                                        <span>£240k Sales</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: '85%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[10px] font-black uppercase mb-1.5">
                                        <span>LEFKOŞA ŞUBE</span>
                                        <span>£110k Sales</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500 rounded-full" style={{ width: '45%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[10px] font-black uppercase mb-1.5">
                                        <span>MAĞUSA ŞUBE</span>
                                        <span>£95k Sales</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '38%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Sparkles className="absolute -bottom-10 -right-10 h-40 w-40 text-white/5" />
                    </div>
                </div>
             </div>
         </div>
      )}

    </div>
  );
};

export default RealEstateTab;
