import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Mail, Phone, MapPin, Building2, BarChart3, Star, Target, Shield, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from "../../contexts/LanguageContext";
import { api } from "../../services/api";

interface TeamCrmTabProps {
  storeId?: number;
}

export const TeamCrmTab = ({ storeId }: TeamCrmTabProps) => {
  const { lang } = useLanguage();
  const [agents, setAgents] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [activeSubTab, setActiveSubTab] = useState<'agents' | 'branches'>('agents');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Broker / Yöneticisi',
    branch_id: ''
  });

  const [branchFormData, setBranchFormData] = useState({
    name: '',
    address: '',
    phone: '',
    slug: ''
  });

  useEffect(() => {
    fetchData();
  }, [storeId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [agentsData, branchesData] = await Promise.all([
        api.getConsultants(storeId),
        api.getBranches(storeId)
      ]);
      setAgents(Array.isArray(agentsData) ? agentsData : []);
      setBranches(Array.isArray(branchesData) ? branchesData : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
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
        setFormData({ name: '', email: '', phone: '', role: 'Broker / Yöneticisi', branch_id: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Failed to save agent:', error);
    }
  };

  const handleSaveBranch = async () => {
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

  const openEdit = (agent: any) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      email: agent.email || '',
      phone: agent.phone || '',
      role: agent.role || 'Broker / Yöneticisi',
      branch_id: agent.branch_id || ''
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

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center mr-4">
             <button 
              onClick={() => setActiveSubTab('agents')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'agents' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
                {lang === 'tr' ? 'DANIŞMANLAR' : 'AGENTS'}
             </button>
             <button 
              onClick={() => setActiveSubTab('branches')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'branches' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
                {lang === 'tr' ? 'ŞUBELER' : 'BRANCHES'}
             </button>
          </div>

          <button 
            onClick={() => {
              if (activeSubTab === 'agents') {
                setEditingAgent(null);
                setFormData({ name: '', email: '', phone: '', role: 'Broker / Yöneticisi', branch_id: '' });
                setShowModal(true);
              } else {
                setEditingBranch(null);
                setBranchFormData({ name: '', address: '', phone: '', slug: '' });
                setShowBranchModal(true);
              }
            }}
            className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 group"
          >
            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
            {activeSubTab === 'agents' ? (lang === 'tr' ? 'YENİ PERSONEL' : 'ADD AGENT') : (lang === 'tr' ? 'YENİ ŞUBE' : 'ADD BRANCH')}
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
                   <div className="text-center p-3 rounded-2xl bg-amber-50/30">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{lang==='tr'? 'Puan':'Score'}</p>
                      <p className="font-black text-amber-700 text-lg">%{agent.performance?.target || 0}</p>
                   </div>
                </div>
             </div>
           ))}
        </div>
      ) : (
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
      )}

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
                   <button onClick={() => { setShowModal(false); setEditingAgent(null); }} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">İptal</button>
                   <button onClick={handleSave} className="flex-1 py-5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">Kaydet</button>
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
                   <button onClick={() => { setShowBranchModal(false); setEditingBranch(null); }} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">İptal</button>
                   <button onClick={handleSaveBranch} className="flex-1 py-5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">Kaydet</button>
                 </div>
              </div>
           </motion.div>
        </div>
      )}
    </div>
  );
};

export default TeamCrmTab;
