import React, { useState, useEffect } from 'react';
import { X, FileText, Upload, Plus, Trash2, Shield, Calendar, Check, Sparkles, Cpu, Eye, Image as ImageIcon, RefreshCw, EyeOff, Camera, Compass } from 'lucide-react';
import { ImageGallery } from './ImageGallery';
import { MultiImageUploader } from './MultiImageUploader';
import { RealEstateProperty } from '../types';
import { api } from '../services/api';

interface RealEstateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (property: RealEstateProperty) => void;
  property?: RealEstateProperty | null;
  userRole?: string; // 'superadmin' | 'admin' | 'manager' | 'owner' | 'employee' | 'viewer'
}

export const RealEstateModal: React.FC<RealEstateModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  property,
  userRole = 'admin' // default to admin for standalone compatibility
}) => {
  // Office manager checks: superadmin, admin, manager, owner count as office managers
  const isOfficeManager = ['superadmin', 'admin', 'manager', 'owner', 'yönetici', 'yonetici'].includes(userRole.toLowerCase());

  const [formData, setFormData] = useState<Partial<RealEstateProperty>>({
    title: '',
    price: 0,
    currency: 'GBP', // default to GBP for KKTC marketing style
    type: 'residence',
    status: 'active',
    location: '',
    description: '',
    room_count: '',
    square_meters: 0,
    sqm_gross: 0,
    block_plot: '',
    facade: '',
    building_age: '',
    floor: '',
    total_floors: '',
    heating: '',
    furnished: false,
    in_gated_community: false,
    dues: 0,
    dues_currency: 'GBP',
    country: 'KKTC', // default to KKTC for pilot region priority
    kktc_region: 'Girne',
    kktc_title_type: 'Eşdeğer Koçan',
    images: [],
    virtual_tour_url: '',
    ai_tour_enabled: false,
    documents: [],
    owner_info: { fullName: '', phone: '' },
    responsible_consultant_id: undefined,
    authorized_branch_id: undefined
  });

  // Mock Upload state
  const [docName, setDocName] = useState('');
  const [docCategory, setDocCategory] = useState<'title_deed'|'dask'|'contract'|'auth_doc'>('title_deed');
  const [docUrl, setDocUrl] = useState('');

  // AI & Luxury Feature states
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [targetGroup, setTargetGroup] = useState<'UK'|'TR'>('UK');
  const [processingMedia, setProcessingMedia] = useState<string | null>(null); // 'staging' | 'enhance' | 'blur'
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  // AI 3D Tour states
  const [generatingTour, setGeneratingTour] = useState(false);
  const [activeTourNode, setActiveTourNode] = useState<any>(null);
  const [tourBlueprint, setTourBlueprint] = useState<any>(null);

  const handleGenerateDescription = async () => {
    if (!formData.title) {
      alert("Lütfen önce bir ilan başlığı giriniz.");
      return;
    }
    setGeneratingDesc(true);
    try {
      const res = await api.post("/api/store/generate-real-estate-desc", {
        title: formData.title,
        location: formData.location,
        region: formData.kktc_region,
        roomDetail: formData.room_count,
        sqm: formData.square_meters,
        titleType: formData.kktc_title_type,
        targetGroup: targetGroup,
        isGated: formData.in_gated_community,
        price: formData.price,
        currency: formData.currency,
        lang: 'tr'
      });
      if (res.text) {
        setFormData(prev => ({ ...prev, description: res.text }));
        setAiNotice("✅ İlan açıklaması yapay zeka tarafından başarıyla güncellendi!");
        setTimeout(() => setAiNotice(null), 5000);
      } else if (res.error) {
        alert("Açıklama üretilirken hata oluştu: " + res.error);
      }
    } catch (err: any) {
      console.error(err);
      alert("Açıklama üretme isteği başarısız oldu.");
    } finally {
      setGeneratingDesc(false);
    }
  };

  const handleAIVirtualStaging = async (style: string) => {
    setProcessingMedia('staging');
    try {
      const coverUrl = formData.images?.[0] || '';
      const res = await api.post("/api/store/ai-virtual-staging", { imageUrl: coverUrl, style });
      if (res.stagedUrl) {
        setFormData(prev => ({ ...prev, images: [res.stagedUrl] }));
        setAiNotice(`✅ ${style.toUpperCase()} tarzında lüks mobilyalar yapay zeka tarafından yerleştirildi!`);
        setTimeout(() => setAiNotice(null), 6000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingMedia(null);
    }
  };

  const handleAIImageEnhancement = async () => {
    setProcessingMedia('enhance');
    try {
      const coverUrl = formData.images?.[0] || '';
      const res = await api.post("/api/store/ai-image-enhance", { imageUrl: coverUrl });
      if (res.enhancedUrl) {
        setFormData(prev => ({ ...prev, images: [res.enhancedUrl] }));
        setAiNotice("✅ Fotoğraf kalitesi, ışığı ve renk dengesi yapay zeka tarafından optimize edildi!");
        setTimeout(() => setAiNotice(null), 6000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingMedia(null);
    }
  };

  const handleAIAnonymizePrivate = async () => {
    setProcessingMedia('blur');
    try {
      const coverUrl = formData.images?.[0] || '';
      const res = await api.post("/api/store/ai-blur-privacy", { imageUrl: coverUrl, type: 'real_estate' });
      if (res.anonymizedUrl) {
        setFormData(prev => ({ ...prev, images: [res.anonymizedUrl] }));
        setAiNotice("✅ Odadaki insan yüzleri ve hassas alanlar yapay zeka tarafından güvenle blurlanarak gizlendi!");
        setTimeout(() => setAiNotice(null), 6000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingMedia(null);
    }
  };

  const handleGenerate3DTour = async () => {
    setGeneratingTour(true);
    try {
      const res = await api.post("/api/store/ai-3d-tour", { name: formData.title, type: 'real_estate' });
      if (res.success) {
        setTourBlueprint(res);
        if (res.nodes && res.nodes.length > 0) {
          setActiveTourNode(res.nodes[0]);
        }
        setFormData(prev => ({ 
          ...prev, 
          virtual_tour_url: res.targetIframeUrl,
          ai_tour_enabled: true 
        }));
        setAiNotice("🏠 Yapay zeka tüm oda fotoğraflarını birleştirerek 3D sanal gezilebilir turu oluşturdu!");
        setTimeout(() => setAiNotice(null), 6000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingTour(false);
    }
  };

  useEffect(() => {
    if (property) {
      setFormData({
        ...property,
        currency: property.currency || 'GBP',
        country: property.country || 'KKTC',
        kktc_region: property.kktc_region || 'Girne',
        kktc_title_type: property.kktc_title_type || 'Eşdeğer Koçan',
        branch_name: property.branch_name || 'Merkez Ofis',
        authorized_branch_id: property.authorized_branch_id,
        responsible_agent: property.responsible_agent || '',
        responsible_consultant_id: property.responsible_consultant_id,
        owner_info: property.owner_info || { fullName: '', phone: '' },
        sharing_scope: property.sharing_scope || 'shared_pool',
        reserved_by_branch: property.reserved_by_branch || '',
        reservation_notes: property.reservation_notes || '',
        documents: property.documents || []
      });
    } else {
      setFormData({
        title: '',
        price: 0,
        currency: 'GBP',
        type: 'residence',
        status: 'active',
        location: '',
        description: '',
        room_count: '',
        square_meters: 0,
        sqm_gross: 0,
        block_plot: '',
        facade: '',
        building_age: '',
        floor: '',
        total_floors: '',
        heating: '',
        furnished: false,
        in_gated_community: false,
        dues: 0,
        dues_currency: 'GBP',
        country: 'KKTC',
        kktc_region: 'Girne',
        kktc_title_type: 'Eşdeğer Koçan',
        branch_name: 'Merkez Ofis',
        authorized_branch_id: undefined,
        responsible_agent: '',
        responsible_consultant_id: undefined,
        owner_info: { fullName: '', phone: '' },
        sharing_scope: 'shared_pool',
        reserved_by_branch: '',
        reservation_notes: '',
        images: [],
        virtual_tour_url: '',
        ai_tour_enabled: false,
        documents: []
      });
    }
    // reset mock upload state
    setDocName('');
    setDocUrl('');
  }, [property, isOpen]);

  if (!isOpen) return null;

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName) return;
    
    const newDoc = {
      id: 'doc_' + Date.now(),
      name: docName,
      category: docCategory,
      file_url: docUrl || 'https://lookprice.me/docs/preview_deed.pdf',
      upload_date: new Date().toISOString().split('T')[0],
      size: (Math.random() * 2 + 1).toFixed(1) + ' MB'
    };

    const updatedDocs = [...(formData.documents || []), newDoc];
    setFormData({ ...formData, documents: updatedDocs });
    setDocName('');
    setDocUrl('');
  };

  const handleRemoveDocument = (id: string) => {
    const updatedDocs = (formData.documents || []).filter(d => d.id !== id);
    setFormData({ ...formData, documents: updatedDocs });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-3xl relative z-10 flex flex-col h-[90vh] shadow-2xl transition-all">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-100">
          <div>
            <span className="text-xs font-black tracking-widest text-indigo-600 uppercase">LookPrice CRM</span>
            <h3 className="text-2xl font-bold text-slate-900">{property ? 'İlanı Düzenle' : 'Yeni Emlak İlanı'}</h3>
          </div>
          <button onClick={onClose} className="p-2.5 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <div className="overflow-y-auto space-y-6 pr-2 pb-24 hide-scrollbar flex-1">
          
          {aiNotice && (
            <div className="bg-emerald-500/10 text-emerald-800 text-xs font-bold border border-emerald-500/20 p-4 rounded-2xl flex items-center justify-between shadow-sm animate-fade-in relative z-20">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                {aiNotice}
              </span>
              <button type="button" onClick={() => setAiNotice(null)} className="p-1 hover:bg-emerald-500/15 rounded-full shrink-0">
                <X className="w-3.5 h-3.5 text-emerald-700" />
              </button>
            </div>
          )}
          
          {/* Bölge ve Pilot Alan Başlığı */}
          <div className="bg-gradient-to-r from-indigo-50 to-emerald-50 p-5 rounded-2xl border border-indigo-100/50 space-y-3">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <span className="flex items-center gap-2 text-indigo-900 font-extrabold text-sm uppercase tracking-wide">
                🌍 PİLOT SATIŞ BÖLGESİ SEÇİMİ
              </span>
              <div className="flex bg-white/80 p-1 rounded-xl border border-indigo-100 shadow-sm">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, country: 'TR', currency: 'TRY' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${formData.country === 'TR' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Türkiye (TR)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, country: 'KKTC', currency: 'GBP' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${formData.country === 'KKTC' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Kuzey Kıbrıs (KKTC)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 mt-2">
                <input 
                  type="checkbox" 
                  id="enrakipsiz-toggle"
                  checked={!!formData.is_on_enrakipsiz}
                  onChange={(e) => setFormData({...formData, is_on_enrakipsiz: e.target.checked})}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                <label htmlFor="enrakipsiz-toggle" className="text-xs font-bold text-indigo-950">EnRakipsiz.com'da Yayınla</label>
            </div>

            {formData.country === 'KKTC' ? (
              <div className="space-y-3">
                <p className="text-xs text-indigo-700 font-medium">
                  🌟 <strong>KKTC Pilot Satış Modülü Aktif:</strong> Portföy daha çok Kıbrıs gayrimenkullerinden oluşmaktadır. Bu modül Türkiye ve özellikle Kıbrıs bölgesine yatırım yapan İngiltere (UK) vatandaşlarını çekmek için sterilize edilmiştir.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">KKTC Bölgesi</label>
                    <select
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                      value={formData.kktc_region}
                      onChange={(e) => setFormData({ ...formData, kktc_region: e.target.value as any })}
                    >
                      <option value="Girne">Girne (Kyrenia) - Gözde Bölge</option>
                      <option value="Lefkoşa">Lefkoşa (Nicosia) - Başkent</option>
                      <option value="Gazimağusa">Gazimağusa (Famagusta) - Liman ve Üniversite</option>
                      <option value="İskele">İskele (Trikomo) - Yatırım ve Sahil Hattı</option>
                      <option value="Güzelyurt">Güzelyurt (Morphou)</option>
                      <option value="Lefke">Lefke (Lefka)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Koçan Tipi (Title Deed status)</label>
                    <select
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                      value={formData.kktc_title_type}
                      onChange={(e) => setFormData({ ...formData, kktc_title_type: e.target.value as any })}
                    >
                      <option value="Türk Koçanı">Türk Koçanı (Pre-74 Turkish Title - En Kıymetli)</option>
                      <option value="Eşdeğer Koçan">Eşdeğer Koçan (Exchange Title)</option>
                      <option value="Tahsis Koçan">Tahsis Koçan (Allotted Title)</option>
                      <option value="Diğer">Diğer / Koçansız</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600">
                Türkiye pazarına yönelik standart gayrimenkul yönetim alanındasınız.
              </p>
            )}
          </div>

          {/* Temel Bilgiler */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-800 border-l-4 border-slate-800 pl-2">Temel İlan Detayları</h4>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">İlan Başlığı</label>
              <input
                type="text"
                placeholder="Örn: Girne Alsancak'ta Dağ ve Deniz Manzaralı Lüks 2+1 Penthouse"
                className="w-full p-3 border rounded-xl placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Fiyat</label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    placeholder="Tutar"
                    className="w-full p-3 border rounded-xl text-sm font-bold"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                  />
                  <select
                    className="p-3 border rounded-xl text-sm font-bold bg-slate-50 text-slate-700"
                    value={formData.currency}
                    onChange={(e) => setFormData({...formData, currency: e.target.value})}
                  >
                    <option value="GBP">GBP (£)</option>
                    <option value="TRY">TRY (₺)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Emlak Tipi</label>
                <select
                  className="w-full p-3 border rounded-xl text-sm font-bold text-slate-700"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                >
                  <option value="residence">Konut / Residence</option>
                  <option value="commercial">Ticari / Commercial</option>
                  <option value="land">Arsa / Land</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">İlan Durumu</label>
                <select
                  className="w-full p-3 border rounded-xl text-sm font-bold text-slate-700"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                >
                  <option value="active">Satılık (For Sale)</option>
                  <option value="rented">Kiralık (For Rent)</option>
                  <option value="optioned">Opsiyonlu (Kapora Alındı)</option>
                  <option value="sold">Satıldı (Sold)</option>
                </select>
              </div>
            </div>

            {/* EMLAK SAHİBİ VE YETKİ KONTROL PANELİ */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4">
              <h5 className="text-xs font-black uppercase text-slate-800 border-b pb-2 mb-2">Mülk Sahibi ve Yetki Bilgileri</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="block text-[10px] font-bold text-slate-500 mb-1">Mülk Sahibi (Ad Soyad)</label>
                   <input type="text" className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs" 
                    value={formData.owner_info?.fullName || ''}
                    onChange={(e) => setFormData({...formData, owner_info: {...formData.owner_info, fullName: e.target.value} as any})}
                   />
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-slate-500 mb-1">Mülk Sahibi (Telefon)</label>
                   <input type="text" className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs" 
                    value={formData.owner_info?.phone || ''}
                    onChange={(e) => setFormData({...formData, owner_info: {...formData.owner_info, phone: e.target.value} as any})}
                   />
                </div>
              </div>
            </div>

            {/* ŞUBELER ARASI PAYLAŞIM VE CRM REZERVASYON MODÜLÜ */}
            <div className="bg-gradient-to-br from-indigo-950/45 to-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-indigo-400 tracking-wider">🏢 Çok Şubeli CRM & Havuz Yönetimi</span>
                <span className="text-[9px] bg-indigo-600/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full">LOOKPRICE HUB</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Yetkili Şube ID</label>
                  <input type="number" className="w-full p-2.5 bg-slate-950 text-white border border-slate-800 rounded-lg text-xs font-bold"
                    value={formData.authorized_branch_id || ''}
                    onChange={(e) => setFormData({...formData, authorized_branch_id: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Sorumlu Danışman ID</label>
                  <input type="number" className="w-full p-2.5 bg-slate-950 text-white border border-slate-800 rounded-lg text-xs font-bold"
                    value={formData.responsible_consultant_id || ''}
                    onChange={(e) => setFormData({...formData, responsible_consultant_id: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Sorumlu Şube / Ofis</label>
                  <select
                    className="w-full p-2.5 bg-slate-950 text-white border border-slate-800 rounded-lg text-xs font-bold"
                    value={formData.branch_name || 'Merkez Ofis'}
                    onChange={(e) => setFormData({...formData, branch_name: e.target.value})}
                  >
                    <option value="Merkez Ofis">Lefkoşa Merkez Ofis</option>
                    <option value="Girne Harbour Ofisi">Girne Harbour Ofisi</option>
                    <option value="İskele LongBeach Şubesi">İskele LongBeach Ofisi</option>
                    <option value="Gazi Mağusa Ofisi">Gazi Mağusa Ofisi</option>
                    <option value="İstanbul High-End Ofisi">İstanbul High-End Ofisi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Paylaşım Durumu (Havuz Kapsamı)</label>
                  <select
                    className="w-full p-2.5 bg-slate-950 text-white border border-slate-800 rounded-lg text-xs font-bold"
                    value={formData.sharing_scope || 'shared_pool'}
                    onChange={(e) => setFormData({...formData, sharing_scope: e.target.value as any})}
                  >
                    <option value="shared_pool">🌐 Ortak Havuz (Tüm Şubeler Satabilir)</option>
                    <option value="branch_private">🔒 Şube İçi Özel (Sadece Bu Ofis)</option>
                    <option value="private">🔑 Danışmana Özel (Gizli Portföy)</option>
                  </select>
                </div>
              </div>

              {/* Çift Satış Engelleme / Rezervasyon Kilidi */}
              <div className="border-t border-slate-800/80 pt-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-0.5 max-w-sm">
                  <span className="text-[11px] font-bold text-slate-300 block">Çapraz Şube Rezervasyon Kilidi</span>
                  <span className="text-[9px] text-slate-400 block">Eğer başka şubeden bir danışman bu mülke müşteri getirdiyse mülkü kilitleyin.</span>
                </div>

                <div className="flex gap-2">
                  <select
                    className="p-1.5 bg-slate-950 text-xs font-bold border border-slate-800 rounded-lg text-slate-300"
                    value={formData.reserved_by_branch || ''}
                    onChange={(e) => setFormData({...formData, reserved_by_branch: e.target.value})}
                  >
                    <option value="">Kilidi Açık (Rezervasyon Yok)</option>
                    <option value="Girne Harbour Ofisi">Girne Harbour Şube Kilitli</option>
                    <option value="İskele LongBeach Şubesi">İskele LongBeach Şube Kilitli</option>
                    <option value="Gazi Mağusa Ofisi">Gazi Mağusa Şube Kilitli</option>
                    <option value="İstanbul High-End Ofisi">İstanbul High-End Şube Kilitli</option>
                  </select>

                  {formData.reserved_by_branch && (
                    <input
                      type="text"
                      placeholder="Not: Kapora alındı..."
                      className="p-1.5 bg-slate-950 text-xs font-medium border border-slate-800 rounded-lg text-white"
                      value={formData.reservation_notes || ''}
                      onChange={(e) => setFormData({...formData, reservation_notes: e.target.value})}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Detaylı Metrikler */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-800 border-l-4 border-slate-800 pl-2">Detaylı Metrikler & Konum Bilgileri</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Ada / Parsel</label>
                <input
                  type="text"
                  placeholder="Ada/Parsel No"
                  className="w-full p-3 border rounded-xl text-sm font-medium"
                  value={formData.block_plot || ''}
                  onChange={(e) => setFormData({...formData, block_plot: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Net Alan (m²)</label>
                <input
                  type="number"
                  placeholder="Net m²"
                  className="w-full p-3 border rounded-xl text-sm font-medium"
                  value={formData.square_meters || ''}
                  onChange={(e) => setFormData({...formData, square_meters: Number(e.target.value)})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Brüt Alan (m²)</label>
                <input
                  type="number"
                  placeholder="Brüt m²"
                  className="w-full p-3 border rounded-xl text-sm font-medium"
                  value={formData.sqm_gross || ''}
                  onChange={(e) => setFormData({...formData, sqm_gross: Number(e.target.value)})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Oda Sayısı</label>
                <input
                  type="text"
                  placeholder="3+1, 2+1, Villa vb."
                  className="w-full p-3 border rounded-xl text-sm font-medium disabled:bg-slate-50 text-slate-700"
                  value={formData.room_count || ''}
                  onChange={(e) => setFormData({...formData, room_count: e.target.value})}
                  disabled={formData.type === 'land'}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Bina Yaşı</label>
                <input
                  type="text"
                  placeholder="Bina Yaşı"
                  className="w-full p-3 border rounded-xl text-sm font-medium disabled:bg-slate-50 text-slate-700"
                  value={formData.building_age || ''}
                  onChange={(e) => setFormData({...formData, building_age: e.target.value})}
                  disabled={formData.type === 'land'}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Cephe</label>
                <select
                  className="w-full p-3 border rounded-xl text-sm text-slate-700 bg-white"
                  value={formData.facade || ''}
                  onChange={(e) => setFormData({...formData, facade: e.target.value})}
                >
                  <option value="">Seçiniz</option>
                  <option value="Kuzey">Kuzey</option>
                  <option value="Güney">Güney</option>
                  <option value="Doğu">Doğu</option>
                  <option value="Batı">Batı</option>
                  <option value="Kuzeydoğu">Kuzeydoğu</option>
                  <option value="Kuzeybatı">Kuzeybatı</option>
                  <option value="Güneydoğu">Güneydoğu</option>
                  <option value="Güneybatı">Güneybatı</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Bulunduğu Kat</label>
                <input
                  type="text"
                  placeholder="3. Kat"
                  className="w-full p-3 border rounded-xl text-sm font-medium disabled:bg-slate-50 text-slate-700"
                  value={formData.floor || ''}
                  onChange={(e) => setFormData({...formData, floor: e.target.value})}
                  disabled={formData.type === 'land'}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Isıtma Tipi</label>
                <select
                  className="w-full p-3 border rounded-xl text-sm text-slate-700 bg-white disabled:bg-slate-50"
                  value={formData.heating || ''}
                  onChange={(e) => setFormData({...formData, heating: e.target.value})}
                  disabled={formData.type === 'land'}
                >
                  <option value="">Seçiniz</option>
                  <option value="Klima">Klima (KKTC Geneli)</option>
                  <option value="Yerden Isıtma">Yerden Isıtma</option>
                  <option value="Kombi (Doğalgaz)">Kombi (Doğalgaz)</option>
                  <option value="Merkezi Sistem">Merkezi Sistem</option>
                  <option value="Merkezi (Pay Ölçer)">Merkezi (Pay Ölçer)</option>
                  <option value="Soba">Soba</option>
                  <option value="Yok">Yok</option>
                </select>
              </div>
            </div>

            {/* Site İçi ve Aidat Durumu */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 font-sans">
              <div className="flex items-center">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    checked={formData.in_gated_community || false}
                    onChange={(e) => setFormData({...formData, in_gated_community: e.target.checked})}
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-700">Site İçi mi?</span>
                    <span className="block text-[9px] text-slate-400">Yüzme havuzu/güvenlik</span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Aidat / Bakım Ücreti</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    placeholder="Tutar"
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    value={formData.dues || ''}
                    disabled={!formData.in_gated_community}
                    onChange={(e) => setFormData({...formData, dues: Number(e.target.value)})}
                  />
                  <select
                    className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600"
                    value={formData.dues_currency || 'GBP'}
                    disabled={!formData.in_gated_community}
                    onChange={(e) => setFormData({...formData, dues_currency: e.target.value})}
                  >
                    <option value="GBP">GBP (£)</option>
                    <option value="TRY">TRY (₺)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    checked={formData.furnished || false}
                    onChange={(e) => setFormData({...formData, furnished: e.target.checked})}
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-700">Eşyalı mı?</span>
                    <span className="block text-[9px] text-slate-400">Mobilyalı anahtar teslim</span>
                  </div>
                </label>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                    checked={formData.is_verified || false}
                    onChange={(e) => setFormData({...formData, is_verified: e.target.checked})}
                  />
                  <div>
                    <span className="block text-xs font-black text-amber-800 flex items-center gap-0.5">⭐ Portföy Doğrulanmış?</span>
                    <span className="block text-[9px] text-slate-400">Evraklar ve tapu onaylandı</span>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Konum / Lokasyon Açıklaması</label>
              <input
                type="text"
                placeholder={formData.country === 'KKTC' ? 'Örn: Alsancak, Girne / Zeytinlik mevkii' : 'Örn: Bostancı, Kadıköy, İstanbul'}
                className="w-full p-3 border rounded-xl text-sm font-medium"
                value={formData.location || ''}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>
          </div>

          {/* Medya ve Sanal Gezinti */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-800 border-l-4 border-indigo-600 pl-2 text-indigo-900">Medya & Matterport Sanal Gezinti</h4>
            
            <div className="bg-slate-50 p-5 rounded-2xl border border-indigo-100 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-500">Mülk Fotoğrafları</label>
                  <MultiImageUploader onImagesUploaded={(urls) => setFormData({...formData, images: [...(formData.images || []), ...urls]})} />
                </div>
                <ImageGallery 
                    images={formData.images || []} 
                    onChange={(images) => setFormData({...formData, images})} 
                    isEditable={true}
                />

                {formData.images && formData.images.length > 0 && (
                  <div className="mt-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black text-indigo-900 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-600 shrink-0" />
                      LOOKPRICE AI RESİM GEREÇLERİ:
                    </span>
                    <button
                      type="button"
                      disabled={processingMedia !== null}
                      onClick={handleAIImageEnhancement}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-[10px] rounded-lg transition-all active:scale-95 flex items-center gap-1 shrink-0"
                    >
                      {processingMedia === 'enhance' ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                      ) : (
                        <Sparkles className="w-3 h-3 text-yellow-500" />
                      )}
                      Fotoğrafı İyileştir (Enhance)
                    </button>
                    <button
                      type="button"
                      disabled={processingMedia !== null}
                      onClick={() => handleAIVirtualStaging('luxury')}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-[10px] rounded-lg transition-all active:scale-95 flex items-center gap-1 shrink-0"
                    >
                      {processingMedia === 'staging' ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                      ) : (
                        <ImageIcon className="w-3 h-3 text-indigo-600" />
                      )}
                      Sanal Mobilyala (Virtual Staging)
                    </button>
                    <button
                      type="button"
                      disabled={processingMedia !== null}
                      onClick={handleAIAnonymizePrivate}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-[10px] rounded-lg transition-all active:scale-95 flex items-center gap-1 shrink-0"
                    >
                      {processingMedia === 'blur' ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                      ) : (
                        <Shield className="w-3 h-3 text-red-500" />
                      )}
                      Yüz / Plaka Gizle (Blur)
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Matterport / 3D Sanal Gezinti URL</label>
                  <input
                    type="text"
                    placeholder="https://my.matterport.com/show/?m=..."
                    className="w-full p-3 border rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                    value={formData.virtual_tour_url || ''}
                    onChange={(e) => setFormData({...formData, virtual_tour_url: e.target.value})}
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <label className="flex items-center gap-3 cursor-pointer p-2.5 bg-white border border-indigo-100 rounded-xl hover:bg-indigo-50 transition-colors shadow-sm">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${formData.ai_tour_enabled ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.29 7 12 12 20.71 7"></polyline><line x1="12" y1="22" x2="12" y2="12"></line></svg>
                    </div>
                    <div className="flex-1">
                      <span className="block text-xs font-black text-indigo-950">Yapay Zeka Sanal Gezinti Aktif</span>
                      <span className="block text-[10px] text-indigo-600/70">Uluslararası (UK) alıcılara 3D sanal gezinti butonu görünecektir</span>
                    </div>
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                      checked={formData.ai_tour_enabled || false}
                      onChange={(e) => setFormData({...formData, ai_tour_enabled: e.target.checked})}
                    />
                  </label>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <span className="text-[10px] text-slate-400 font-bold">
                  Kapak fotoğrafınız hazır mı? 2D fotoğrafları anında gezilebilir 3D alana çevirelim.
                </span>
                <button
                  type="button"
                  disabled={generatingTour}
                  onClick={handleGenerate3DTour}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {generatingTour ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Compass className="w-3.5 h-3.5" />
                  )}
                  Yapay Zeka 3D Tur Oluştur
                </button>
              </div>

              {/* Collapsible Immersive 3D Tour Interactive Viewer */}
              {formData.virtual_tour_url && (
                <div className="mt-3 bg-slate-900 text-white rounded-2xl overflow-hidden p-4 border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                        3D Sanal Tur Canlı HUD Önizleme
                      </span>
                    </div>
                    <span className="text-[10px] bg-indigo-600 font-black px-2 py-0.5 rounded uppercase">
                      Matterport AI Stitched
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Immersive interactive side views panel */}
                    <div className="md:col-span-1 bg-black/40 rounded-xl p-2 border border-slate-800/60 flex flex-col gap-1.5 max-h-[140px] overflow-y-auto">
                      <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase px-1">
                        GEZİLENEBİLİR NOKTALAR
                      </span>
                      {tourBlueprint?.nodes ? (
                        tourBlueprint.nodes.map((node: any, idx: number) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveTourNode(node)}
                            className={`w-full text-left p-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-between ${
                              activeTourNode?.name === node.name 
                                ? 'bg-indigo-600 text-white shadow' 
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            <span>🚪 {node.name}</span>
                          </button>
                        ))
                      ) : (
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => setActiveTourNode({
                              name: "Living Room (Salon)",
                              description: "Kuzey Kıbrıs’ın büyüleyici gün batımı ve deniz manzarasını sunan geniş pencereler, İtalyan mermer zemin kaplama.",
                              stagingSuggestions: "Lüks kadife oturma grubu."
                            })}
                            className={`w-full text-left p-1.5 rounded-md text-[10px] font-bold ${activeTourNode?.name === "Living Room (Salon)" || !activeTourNode ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"}`}
                          >
                            🚪 Living Room (Salon)
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTourNode({
                              name: "Master Suite",
                              description: "Gizli dolap detayları, özel banyo ve ebeveyn balkona direkt açılan stereoskopik taranmış yatak odası alanı.",
                              stagingSuggestions: "Boho-şık ahşap karyola ve lamine kaplama."
                            })}
                            className={`w-full text-left p-1.5 rounded-md text-[10px] font-bold ${activeTourNode?.name === "Master Suite" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"}`}
                          >
                            🚪 Master Suite
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTourNode({
                              name: "Infinity Terrace",
                              description: "Sonsuzluk havuzuna komşu, cam korkuluklar ile çevrili güneşlenme güvertesi.",
                              stagingSuggestions: "Ahşap tik dinlenme yatakları."
                            })}
                            className={`w-full text-left p-1.5 rounded-md text-[10px] font-bold ${activeTourNode?.name === "Infinity Terrace" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"}`}
                          >
                            🚪 Infinity Terrace
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Immersive View details description HUD */}
                    <div className="md:col-span-2 bg-slate-950/80 rounded-xl p-3 border border-slate-800 flex flex-col justify-between min-h-[140px] text-left">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-indigo-400">
                          AKTİF 3D KAMERA KONUMU
                        </span>
                        <h5 className="text-xs font-extrabold text-white">
                          {activeTourNode?.name || "Living Room (Salon)"}
                        </h5>
                        <p className="text-[10px] text-slate-300 leading-relaxed max-h-[60px] overflow-y-auto">
                          {activeTourNode?.description || "Kuzey Kıbrıs’ın büyüleyici gün batımı ve deniz manzarasını sunan geniş pencereler, İtalyan mermer zemin kaplama."}
                        </p>
                      </div>

                      {activeTourNode?.stagingSuggestions && (
                        <div className="mt-1 pb-1 text-[9px] text-amber-400 font-extrabold bg-amber-500/5 p-1 rounded-lg border border-amber-500/10 flex items-center gap-1.5 shrink-0 select-none">
                          <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>AI Sanal Mobilya: {activeTourNode.stagingSuggestions}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-[9px] text-slate-500 flex justify-between items-center pt-1 border-t border-slate-800">
                    <span>Sanal Tur: {formData.virtual_tour_url}</span>
                    <span className="text-indigo-400 font-extrabold text-[10px] cursor-pointer hover:underline" onClick={() => window.open(formData.virtual_tour_url, '_blank')}>
                      Yeni Sekmede Aç ↗
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Açıklama */}
          <div className="space-y-3">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <label className="block text-xs font-bold text-slate-500">Açıklama (UK ve TR Yatırımcıları için Notlar)</label>
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold">Yatırımcı Odağı:</span>
                <div className="inline-flex rounded-lg border p-0.5 bg-slate-50 border-slate-200">
                  <button
                    type="button"
                    onClick={() => setTargetGroup('UK')}
                    className={`px-2 py-1 text-[9px] font-black rounded-md transition-all ${targetGroup === 'UK' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600'}`}
                  >
                    🇬🇧 UK Alıcılar
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetGroup('TR')}
                    className={`px-2 py-1 text-[9px] font-black rounded-md transition-all ${targetGroup === 'TR' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600'}`}
                  >
                    🇹🇷 TR Alıcılar
                  </button>
                </div>

                <button
                  type="button"
                  disabled={generatingDesc}
                  onClick={handleGenerateDescription}
                  className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-wider rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {generatingDesc ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin shrink-0 text-white" />
                      Yazılıyor...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
                      AI ile Açıklama Yaz
                    </>
                  )}
                </button>
              </div>
            </div>
            <textarea
              placeholder="Gayrimenkulün yatırım potansiyeli, amortisman süresi ve konumu hakkında detaylı açıklamaları buraya yazın..."
              className="w-full p-3 border rounded-xl min-h-[120px] text-sm"
              value={formData.description || ''}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          {/* DOKÜMAN YÖNETİMİ (Tapu, DASK, Yetki Belgesi) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-800 border-l-4 border-amber-500 pl-2 flex items-center gap-1.5">
                📁 Güvenli Doküman Yönetimi 
                <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                  Sadece Yönetici
                </span>
              </h4>
              <Shield className={`w-4 h-4 ${isOfficeManager ? 'text-emerald-500' : 'text-slate-400'}`} />
            </div>

            {isOfficeManager ? (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  🔒 GÜVENLİ DEPOLAMA ALANI: Gayrimenkule ait aşağıdaki resmî evraklar ofis yöneticisi ve danışman ekibinin yetkisinde saklanır, son kullanıcılara asla gösterilmez.
                </p>

                {/* Mevcut Dokümanlar listesi */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-600">Yüklü Evrak Listesi</label>
                  {(!formData.documents || formData.documents.length === 0) ? (
                    <div className="text-center py-6 border border-dashed border-slate-300 rounded-xl bg-white text-slate-400 text-xs font-medium">
                      Bu gayrimenkule ait henüz yüklenmiş bir resmî evrak yok.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {formData.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-xs relative group">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block text-xs font-bold text-slate-800 truncate" title={doc.name}>
                              {doc.name}
                            </span>
                            <div className="flex gap-2 items-center text-[10px] text-slate-400 mt-0.5 font-bold">
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                {doc.category === 'title_deed' ? 'Tapu Örneği' :
                                 doc.category === 'dask' ? 'DASK Poliçesi' :
                                 doc.category === 'contract' ? 'Sözleşme' : 'Yetki Belgesi'}
                              </span>
                              <span>{doc.size || '1.8 MB'}</span>
                              <span>•</span>
                              <span>{doc.upload_date}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveDocument(doc.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Evrak Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Yeni Doküman Ekleme Formu */}
                <form onSubmit={handleAddDocument} className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <span className="block text-xs font-bold text-slate-700">Yeni Evrak Ekle (Güvenli Yükleme)</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Evrak Adı</label>
                      <input
                        type="text"
                        placeholder="Örn: Alsancak Tapu Örneği"
                        className="w-full p-2 border rounded-lg text-xs font-bold"
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kategori</label>
                      <select
                        className="w-full p-2 border rounded-lg text-xs font-bold text-slate-600"
                        value={docCategory}
                        onChange={(e) => setDocCategory(e.target.value as any)}
                      >
                        <option value="title_deed">Tapu Örneği / Title Deed</option>
                        <option value="dask">DASK / Resmî Sigorta</option>
                        <option value="contract">Gayrimenkul Alım/Satım Sözleşmesi</option>
                        <option value="auth_doc">Yetki Belgesi (Ofis Satış Yetkisi)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Döküman Bağlantı (URL)</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Mock Dosya Seç / Link"
                          className="w-full p-2 border rounded-lg text-xs"
                          value={docUrl}
                          onChange={(e) => setDocUrl(e.target.value)}
                        />
                        <button
                          type="submit"
                          className="px-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 text-xs shrink-0 flex items-center justify-center gap-1 shadow"
                        >
                          <Plus className="w-4 h-4" />
                          Yükle
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/50 border-dashed flex flex-col items-center justify-center text-center space-y-2">
                <Shield className="w-8 h-8 text-amber-500/80 mb-2" />
                <span className="text-sm font-black text-slate-800">Ofis Yöneticisi Yetkisi Gerekli</span>
                <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                  Resmî Tapu örnekleri, DASK poliçeleri, satış yetki belgeleri ve aracılık sözleşmeleri sadece <strong>ofis yöneticisi/owner</strong> tarafından görüntülenebilir ve yönetilebilir.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Footer actions */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t rounded-b-[2rem] flex gap-3 shadow-[0_-5px_15px_-5px_initial]">
          <button
            onClick={onClose}
            type="button"
            className="w-1/3 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all"
          >
            Kapat
          </button>
          <button
            onClick={() => onSave(formData as RealEstateProperty)}
            type="button"
            className="w-2/3 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-600/20 active:scale-98 transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            {property ? 'Değişiklikleri Kaydet ve Güncelle' : 'Gayrimenkul Portföyüne Ekle'}
          </button>
        </div>
      </div>
    </div>
  );
};
