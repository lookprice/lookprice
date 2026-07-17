import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, FileText, Upload, Plus, Trash2, Shield, Calendar, Check, Sparkles, Cpu, Eye, Image as ImageIcon, RefreshCw, EyeOff, Camera, Compass } from 'lucide-react';
import { ImageGallery } from './ImageGallery';
import { MultiImageUploader } from './MultiImageUploader';
import { REAL_ESTATE_REGIONS, EMLAK_TIPI_SUB_TIPLERI } from '../data/realEstateConfig';
import { RealEstateProperty } from '../types';
import { api } from '../services/api';
import { contractTemplates } from '../utils/contractTemplates';
import { LiteRichEditor } from './LiteRichEditor';

interface RealEstateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (property: RealEstateProperty) => void;
  property?: RealEstateProperty | null;
  storeId?: number;
  userRole?: string; // 'superadmin' | 'admin' | 'manager' | 'owner' | 'employee' | 'viewer'
}

export const RealEstateModal: React.FC<RealEstateModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  property,
  storeId,
  userRole = 'admin' // default to admin for standalone compatibility
}) => {
  // Office manager checks: superadmin, admin, manager, owner count as office managers
  const isOfficeManager = ['superadmin', 'admin', 'storeadmin', 'manager', 'owner', 'yönetici', 'yonetici', 'portfolio_manager', 'portföy yöneticisi', 'consultant', 'danışman', 'danisman', 'editor'].includes((userRole || 'admin').toString().toLowerCase());

  const joditRef = useRef(null);
  const joditConfig = useMemo(
    () => ({
      readonly: false,
      placeholder: 'Gayrimenkulün yatırım potansiyeli, amortisman süresi ve konumu hakkında detaylı açıklamaları buraya yazın...',
      height: 320,
      language: 'tr',
      toolbarAdaptive: false,
      buttons: [
        'source', '|',
        'bold', 'strikethrough', 'underline', 'italic', '|',
        'superscript', 'subscript', '|',
        'ul', 'ol', '|',
        'outdent', 'indent', '|',
        'font', 'fontsize', 'brush', 'paragraph', '|',
        'image', 'video', 'table', 'link', '|',
        'align', 'undo', 'redo', '|',
        'hr', 'eraser', 'copyformat', '|',
        'symbol', 'fullsize', 'print', 'about'
      ]
    }),
    []
  );

  const [formData, setFormData] = useState<Partial<RealEstateProperty>>({
    title: '',
    price: 0,
    reference_no: `REF-${Math.floor(Math.random() * 9000) + 1000}`,
    currency: 'GBP', // default to GBP for KKTC marketing style
    type: 'residence',
    subtype: '',
    listing_intent: 'sale', // Default to sale
    deposit: 0,
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
    kktc_sub_region: '',
    kktc_title_type: 'Eşdeğer Koçan',
    trafo_bedeli: false,
    kdv_status: 'to_be_paid',
    cati_terasi: false,
    is_on_enrakipsiz: true,
    auto_post_instagram: false,
    images: [],
    virtual_tour_url: '',
    ai_tour_enabled: false,
    documents: [],
    owner_info: { fullName: '', phone: '' },
    responsible_consultant_id: undefined,
    authorized_branch_id: undefined
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  // Mock Upload state
  const [docName, setDocName] = useState('');
  const [docCategory, setDocCategory] = useState<'title_deed'|'dask'|'contract'|'auth_doc'>('title_deed');
  const [docUrl, setDocUrl] = useState('');
  const [selectedDocFile, setSelectedDocFile] = useState<File | null>(null);
  const docCameraInputRef = useRef<HTMLInputElement>(null);

  // CRM Data states
  const [branches, setBranches] = useState<any[]>([]);
  const [consultants, setConsultants] = useState<any[]>([]);
  const [loadingCrm, setLoadingCrm] = useState(false);

  const handleSave = () => {
    if (formData.listing_intent === 'rent') {
      const depVal = Number(formData.deposit);
      if (!formData.deposit || isNaN(depVal) || depVal <= 0) {
        setValidationError("Kiralık mülkler için 'Depozito Tutarı' girişi zorundur ve 0'dan büyük olmalıdır!");
        return;
      }
    }
    setValidationError(null);

    const dataToSave = { ...formData };

    onSave(dataToSave as RealEstateProperty);
  };

  useEffect(() => {
    if (isOpen) {
      setValidationError(null);
      fetchCrmData();
    }
  }, [isOpen]);

  const fetchCrmData = async () => {
    setLoadingCrm(true);
    try {
      const [branchesRes, consultantsRes] = await Promise.all([
        api.getBranches(storeId),
        api.getConsultants(storeId)
      ]);
      setBranches(Array.isArray(branchesRes) ? branchesRes : []);
      setConsultants(Array.isArray(consultantsRes) ? consultantsRes : []);
    } catch (error) {
      console.error('Failed to fetch CRM data:', error);
    } finally {
      setLoadingCrm(false);
    }
  };

  useEffect(() => {
    setValidationError(null);
    if (property) {
      setFormData({
        ...property,
        currency: property.currency || 'GBP',
        country: property.country || 'KKTC',
        kktc_region: property.kktc_region || 'Girne',
        kktc_sub_region: property.kktc_sub_region || '',
        kktc_title_type: property.kktc_title_type || 'Eşdeğer Koçan',
        trafo_bedeli: property.trafo_bedeli || false,
        kdv_status: property.kdv_status || 'to_be_paid',
        cati_terasi: property.cati_terasi || false,
        is_on_enrakipsiz: property.is_on_enrakipsiz ?? true,
        auto_post_instagram: property.auto_post_instagram || false,
        subtype: property.subtype || '',
        branch_name: property.branch_name || 'Merkez Ofis',
        authorized_branch_id: property.authorized_branch_id,
        responsible_agent: property.responsible_agent || '',
        responsible_consultant_id: property.responsible_consultant_id,
        listing_intent: property.listing_intent || (property.reference_no?.toUpperCase().includes('-K-') ? 'rent' : 'sale'),
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
        subtype: '',
        listing_intent: 'sale',
        deposit: 0,
        billing_period: 'monthly',
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
        kktc_sub_region: '',
        kktc_title_type: 'Eşdeğer Koçan',
        trafo_bedeli: false,
        kdv_status: 'to_be_paid',
        cati_terasi: false,
        is_on_enrakipsiz: true,
        auto_post_instagram: false,
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
    setSelectedDocFile(null);
  }, [property, isOpen]);

  if (!isOpen) return null;

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName && !selectedDocFile) return;
    
    const sizeStr = selectedDocFile
      ? (selectedDocFile.size / (1024 * 1024)).toFixed(2) + ' MB'
      : (Math.random() * 2 + 1).toFixed(1) + ' MB';

    const fileUrlStr = selectedDocFile
      ? URL.createObjectURL(selectedDocFile)
      : docUrl || 'https://lookprice.me/docs/preview_deed.pdf';

    const finalDocName = docName || (selectedDocFile ? selectedDocFile.name.split('.')[0] : 'Evrak Örneği');

    const newDoc = {
      id: 'doc_' + Date.now(),
      name: finalDocName,
      category: docCategory,
      file_url: fileUrlStr,
      upload_date: new Date().toISOString().split('T')[0],
      size: sizeStr
    };

    const updatedDocs = [...(formData.documents || []), newDoc];
    setFormData({ ...formData, documents: updatedDocs });
    setDocName('');
    setDocUrl('');
    setSelectedDocFile(null);
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
          
          {/* Intent Toggle */}
          <div className="grid grid-cols-2 gap-4">
             <button
                type="button"
                onClick={() => setFormData({...formData, listing_intent: 'sale', status: 'active'})}
                className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 font-black transition-all ${formData.listing_intent === 'sale' ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-500'}`}
             >🏠 SATILIK (SALE)</button>
             <button
                type="button"
                onClick={() => setFormData({...formData, listing_intent: 'rent', status: 'active'})}
                className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 font-black transition-all ${formData.listing_intent === 'rent' ? 'border-sky-600 bg-sky-50 text-sky-800' : 'border-slate-200 text-slate-500'}`}
             >🔑 KİRALIK (RENT)</button>
          </div>

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
                  id="trade-in-toggle"
                  checked={!!formData.is_trade_in_available}
                  onChange={(e) => setFormData({...formData, is_trade_in_available: e.target.checked})}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                <label htmlFor="trade-in-toggle" className="text-xs font-bold text-indigo-950">Takas Kabul Ediliyor</label>
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

            <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 mt-2">
                <input 
                  type="checkbox" 
                  id="auto-post-instagram"
                  checked={!!formData.auto_post_instagram}
                  onChange={(e) => setFormData({...formData, auto_post_instagram: e.target.checked})}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                <label htmlFor="auto-post-instagram" className="text-xs font-bold text-indigo-950">Instagram'da Otomatik Paylaş (Onaylı)</label>
            </div>

            {formData.country === 'KKTC' ? (
              <div className="space-y-3">
                <p className="text-xs text-indigo-700 font-medium">
                  🌟 <strong>KKTC Pilot Satış Modülü Aktif:</strong> Portföy daha çok Kıbrıs gayrimenkullerinden oluşmaktadır. Bu modül Türkiye ve özellikle Kıbrıs bölgesine yatırım yapan İngiltere (UK) vatandaşlarını çekmek için sterilize edilmiştir.
                </p>
                <div className={`grid grid-cols-1 ${formData.listing_intent === 'rent' ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4 pt-1`}>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">KKTC Bölgesi</label>
                    <select
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                      value={formData.kktc_region}
                      onChange={(e) => setFormData({ ...formData, kktc_region: e.target.value as any, kktc_sub_region: '' })}
                    >
                      {Object.keys(REAL_ESTATE_REGIONS).map((region) => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Alt Bölge</label>
                    <select
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                      value={formData.kktc_sub_region}
                      onChange={(e) => setFormData({ ...formData, kktc_sub_region: e.target.value })}
                    >
                      <option value="">Alt bölge seçiniz</option>
                      {REAL_ESTATE_REGIONS[formData.kktc_region as keyof typeof REAL_ESTATE_REGIONS]?.map((subRegion) => (
                        <option key={subRegion} value={subRegion}>{subRegion}</option>
                      ))}
                    </select>
                  </div>
                  {formData.listing_intent !== 'rent' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Koçan Tipi</label>
                      <select
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                        value={formData.kktc_title_type}
                        onChange={(e) => setFormData({ ...formData, kktc_title_type: e.target.value as any })}
                      >
                        <option value="Türk Koçanı">Türk Koçanı</option>
                        <option value="Eşdeğer Koçan">Eşdeğer Koçan</option>
                        <option value="Tahsis Koçan">Tahsis Koçan</option>
                        <option value="Diğer">Diğer</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    {formData.listing_intent !== 'rent' && (
                      <>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" checked={formData.trafo_bedeli} onChange={(e) => setFormData({...formData, trafo_bedeli: e.target.checked})} />
                            <label className="text-xs font-bold text-slate-600">Trafo Bedeli Ödendi</label>
                        </div>
                        <div className="flex items-center gap-2">
                              <label className="text-xs font-bold text-slate-600">KDV Durumu:</label>
                              <select value={formData.kdv_status} onChange={(e) => setFormData({...formData, kdv_status: e.target.value as any})}>
                                <option value="to_be_paid">Ödenecek</option>
                                <option value="paid">Ödendi</option>
                              </select>
                        </div>
                      </>
                    )}
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked={formData.cati_terasi} onChange={(e) => setFormData({...formData, cati_terasi: e.target.checked})} />
                        <label className="text-xs font-bold text-slate-600">Çatı Terası Var</label>
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
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 mb-1">Referans / Portföy No</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: TR-1002"
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none text-sm font-mono font-bold"
                  value={formData.reference_no || ''}
                  onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-500 mb-1">İlan Başlığı</label>
                <input
                type="text"
                placeholder="Örn: Girne Alsancak'ta Dağ ve Deniz Manzaralı Lüks 2+1 Penthouse"
                className="w-full p-3 border rounded-xl placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Fiyat {formData.price ? `(Format: ${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Number(formData.price))})` : ''}
                </label>
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
                  onChange={(e) => setFormData({...formData, type: e.target.value as any, subtype: ''})}
                >
                  <option value="residence">Konut / Residence</option>
                  <option value="commercial">Ticari / Commercial</option>
                  <option value="land">Arsa / Land</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Alt Tip</label>
                <select
                  className="w-full p-3 border rounded-xl text-sm font-bold text-slate-700 bg-white"
                  value={formData.subtype || ''}
                  onChange={(e) => setFormData({...formData, subtype: e.target.value})}
                >
                  <option value="">Alt tip seçiniz</option>
                  {EMLAK_TIPI_SUB_TIPLERI[formData.type === 'residence' ? 'Konut' : formData.type === 'commercial' ? 'Ticari' : 'Arsa']?.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">İlan Durumu</label>
                <select
                  className="w-full p-3 border rounded-xl text-sm font-bold text-slate-700"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                >
                  {formData.listing_intent === 'sale' ? (
                    <>
                      <option value="active">Satışta (For Sale)</option>
                      <option value="optioned">Opsiyonlu (Kapora Alındı)</option>
                      <option value="sold">Satıldı (Sold)</option>
                    </>
                  ) : (
                    <>
                      <option value="active">Kiralık (For Rent)</option>
                      <option value="optioned">Opsiyonlu (Kapora Alındı)</option>
                      <option value="rented">Kiralandı (Rented)</option>
                    </>
                  )}
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
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Yetkili Şube</label>
                  <select 
                    className="w-full p-2.5 bg-slate-950 text-white border border-slate-800 rounded-lg text-xs font-bold"
                    value={formData.authorized_branch_id || ''}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      const branch = branches.find(b => b.id === id);
                      setFormData({...formData, authorized_branch_id: id, branch_name: branch?.name || ''});
                    }}
                  >
                    <option value="">Şube Seçiniz (Merkez)</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Sorumlu Danışman</label>
                  <select 
                    className="w-full p-2.5 bg-slate-950 text-white border border-slate-800 rounded-lg text-xs font-bold"
                    value={formData.responsible_consultant_id || ''}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      const consultant = consultants.find(c => c.id === id);
                      setFormData({...formData, responsible_consultant_id: id, responsible_agent: consultant?.name || '', consultant_phone: consultant?.phone || undefined});
                    }}
                  >
                    <option value="">Danışman Seçiniz</option>
                    {consultants.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Şube Adı (Görünen)</label>
                  <input 
                    type="text"
                    disabled
                    className="w-full p-2.5 bg-slate-900/50 text-slate-500 border border-slate-800 rounded-lg text-xs font-bold"
                    value={formData.branch_name || 'Merkez Ofis'}
                  />
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
                    {branches.map(b => (
                      <option key={b.id} value={b.name}>{b.name} Kilitli</option>
                    ))}
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

              {/* Dış CRM Entegrasyonu (Sahibinden, Emlakjet vb.) */}
              <div className="border-t border-slate-800/50 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-black text-slate-300 block uppercase">🔄 Dış Portal Entegrasyon Bağlantısı</span>
                    <span className="text-[9px] text-slate-500 block">Sahibinden.com, Emlakjet veya başka bir CRM'deki ilan numarasını bağlayın.</span>
                  </div>
                  <div className="flex gap-1.5">
                     <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase font-bold">API Aktif</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Dış Sistem Adı</label>
                    <select
                      className="w-full p-2 bg-slate-950 text-slate-300 border border-slate-800 rounded-lg text-[11px] font-bold"
                      value={formData.external_crm_name || ''}
                      onChange={(e) => setFormData({...formData, external_crm_name: e.target.value})}
                    >
                      <option value="">Seçiniz</option>
                      <option value="Sahibinden">Sahibinden.com</option>
                      <option value="101evler">101evler.com (KKTC)</option>
                      <option value="Hepsiemlak">Hepsiemlak</option>
                      <option value="Emlakjet">Emlakjet</option>
                      <option value="Zingat">Zingat</option>
                      <option value="PropertyFinder">PropertyFinder (UAE/International)</option>
                      <option value="Other">Diğer Özel CRM</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">İlan No / External ID</label>
                    <input
                      type="text"
                      placeholder="Örn: 1092837465"
                      className="w-full p-2 bg-slate-950 text-white border border-slate-800 rounded-lg text-[11px] font-bold placeholder-slate-600"
                      value={formData.external_crm_id || ''}
                      onChange={(e) => setFormData({...formData, external_crm_id: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detaylı Metrikler */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-800 border-l-4 border-slate-800 pl-2">Detaylı Metrikler & Konum Bilgileri</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {formData.listing_intent === 'sale' && (
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
              )}

              {formData.listing_intent === 'rent' && (
                <div className="grid grid-cols-2 gap-4 col-span-2 md:col-span-4 bg-amber-50/70 p-4 rounded-xl border border-amber-200">
                  <div>
                    <label className="block text-xs font-black text-rose-600 mb-1">
                      Depozito Tutarı (Zorunlu) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Örn: 2000"
                      className={`w-full p-3 border rounded-xl text-sm font-bold focus:outline-none focus:ring-1 ${(!formData.deposit || Number(formData.deposit) <= 0) ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/30' : 'border-slate-300 focus:border-amber-400 focus:ring-amber-400 bg-white'}`}
                      value={formData.deposit || ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : Number(e.target.value);
                        setFormData({...formData, deposit: val});
                        if (val > 0) setValidationError(null);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Ödeme Periyodu</label>
                    <select className="w-full p-3 border rounded-xl text-sm" value={formData.billing_period || 'monthly'} onChange={(e) => setFormData({...formData, billing_period: e.target.value as any})}>
                        <option value="monthly">Aylık</option>
                        <option value="3-monthly">3 Aylık</option>
                        <option value="6-monthly">6 Aylık</option>
                        <option value="yearly">Yıllık</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Net Alan (m²) {formData.square_meters ? `(Format: ${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Number(formData.square_meters))})` : ''}
                </label>
                <input
                  type="number"
                  placeholder="Net m²"
                  className="w-full p-3 border rounded-xl text-sm font-medium"
                  value={formData.square_meters || ''}
                  onChange={(e) => setFormData({...formData, square_meters: Number(e.target.value)})}
                />
              </div>

              {formData.listing_intent !== 'rent' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Brüt Alan (m²) {formData.sqm_gross ? `(Format: ${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Number(formData.sqm_gross))})` : ''}
                  </label>
                  <input
                    type="number"
                    placeholder="Brüt m²"
                    className="w-full p-3 border rounded-xl text-sm font-medium"
                    value={formData.sqm_gross || ''}
                    onChange={(e) => setFormData({...formData, sqm_gross: Number(e.target.value)})}
                  />
                </div>
              )}

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
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                  Aidat / Bakım Ücreti {formData.dues ? `(Format: ${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Number(formData.dues))})` : ''}
                </label>
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

            {/* Konum alanı kaldırıldı */}
          </div>

          {/* Medya ve Fotoğraflar */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-800 border-l-4 border-indigo-600 pl-2 text-indigo-950">Fotoğraflar & Medya</h4>
            
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/65 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-500">Mülk Fotoğrafları</label>
                  <MultiImageUploader onImagesUploaded={(urls) => setFormData({...formData, images: [...(formData.images || []), ...urls]})} />
                </div>
                <ImageGallery 
                    images={formData.images || []} 
                    onChange={(images) => setFormData({...formData, images})} 
                    isEditable={true}
                />
              </div>
            </div>
          </div>

          {/* Açıklama */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500">Açıklama (UK ve TR Yatırımcıları için Notlar)</label>
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <LiteRichEditor
                value={formData.description || ''}
                onChange={(newContent) => setFormData(prev => ({...prev, description: newContent}))}
                placeholder="Mülk inceleme notları ve detaylı açıklamaları buraya yazabilirsiniz..."
                minHeight="250px"
              />
            </div>
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
                          <div className="flex gap-1 items-center">
                            <button
                              type="button"
                              onClick={() => {
                                if (doc.file_url === "is_virtual_contract") {
                                  const tDef = contractTemplates.find(t => t.id === (doc.details?.templateId || 'showing_agreement')) || contractTemplates[0];
                                  const formattedPriceNum = Number(formData.price).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
                                  const symbol = formData.currency === 'GBP' ? '£' : formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : '₺';
                                  
                                  const { html } = tDef.getTemplate({
                                    storeName: "LookPrice Real Estate",
                                    storePhone: "+90 533 800 00 00",
                                    storeEmail: "realestate@lookprice.me",
                                    clientName: doc.details?.clientName || "[Alıcı / Mülk Sahibi Adı]",
                                    clientIdentity: doc.details?.clientIdentity || "[T.C. No]",
                                    clientPhone: doc.details?.clientPhone || "[Telefon]",
                                    propertyTitle: `[İlan Kodu: LP-${formData.id}] ${formData.title}`,
                                    propertyLocation: formData.location || "Kıbrıs",
                                    propertyPrice: `${formattedPriceNum} ${symbol}`,
                                    propertyBlockPlot: formData.block_plot,
                                    commissionRate: doc.details?.commissionRate || "3",
                                    contractDate: doc.upload_date
                                  });
                                  
                                  const printWin = window.open('', '_blank');
                                  if (printWin) {
                                    printWin.document.write(`
                                      <html>
                                        <head>
                                          <title>${doc.name}</title>
                                          <style>
                                            body { font-family: sans-serif; background: white; margin: 40px; color: #1e293b; }
                                          </style>
                                        </head>
                                        <body>
                                          ${html}
                                          <script>
                                            window.onload = function() { window.print(); }
                                          </script>
                                        </body>
                                      </html>
                                    `);
                                    printWin.document.close();
                                  }
                                } else {
                                  window.open(doc.file_url, '_blank');
                                }
                              }}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                              title="Evrak Görüntüle"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveDocument(doc.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Evrak Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Yeni Doküman Ekleme Formu */}
                <form onSubmit={handleAddDocument} className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm space-y-4 text-left">
                  <div className="flex justify-between items-center pb-2 border-b border-indigo-50/50">
                    <span className="block text-xs font-black text-indigo-950 uppercase tracking-tight flex items-center gap-1">
                      🔒 Yeni Evrak Ekle (Güvenli Yerel Yükleme)
                    </span>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                      Askerî Düzey Şifreleme (AES-256)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Kategori / Belge Türü</label>
                      <select
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                        value={docCategory}
                        onChange={(e) => setDocCategory(e.target.value as any)}
                      >
                        <option value="title_deed">📋 Tapu Örneği / Title Deed</option>
                        <option value="dask">🛡️ DASK / Zorunlu Deprem Sigortası</option>
                        <option value="contract">✍️ Yetki & Aracılık Sözleşmesi</option>
                        <option value="auth_doc">🔑 Diğer Resmî İmar/Devir Evrağı</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Açıklayıcı Evrak Adı (Opsiyonel)</label>
                      <input
                        type="text"
                        placeholder="Örn: Alsancak Blok A-3 Tapu Örneği"
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Native File Drag-and-Drop Uploader Component */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Resmî Belge Dosyası (Güvenli Yükleme)</label>
                    
                    {/* Hidden Camera Input */}
                    <input
                      type="file"
                      ref={docCameraInputRef}
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedDocFile(file);
                          if (!docName) {
                            setDocName(file.name.split('.')[0] || "Belge Fotoğrafı");
                          }
                        }
                      }}
                    />

                    <div className="relative">
                      <input
                        type="file"
                        id="document-secure-file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSelectedDocFile(file);
                            if (!docName) {
                              setDocName(file.name.split('.')[0]); // Prefill filename as docName!
                            }
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      
                      <div className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition-all ${
                        selectedDocFile 
                          ? 'border-emerald-500 bg-emerald-50/10' 
                          : 'border-slate-300 hover:border-indigo-400 bg-slate-50/30'
                      }`}>
                        {selectedDocFile ? (
                          <div className="flex flex-col items-center gap-1 animate-fade-in">
                            <span className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-1">
                              <Check className="w-6 h-6 stroke-[3]" />
                            </span>
                            <span className="text-xs font-black text-slate-800">{selectedDocFile.name}</span>
                            <span className="text-[10px] text-slate-400 font-extrabold font-mono">
                              {(selectedDocFile.size / (1024 * 1024)).toFixed(2)} MB • Hazır
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <span className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-1 border border-slate-200">
                              <Upload className="w-5 h-5" />
                            </span>
                            <span className="text-xs font-black text-slate-700">
                              Dosyayı sürükleyin veya <span className="text-indigo-600 underline">göz atın</span>
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold leading-none">
                              Desteklenen formatlar: PDF, PNG, JPG, DOCX (Maksimum 25 MB)
                            </span>
                            
                            {/* Instant Mobile doc snapshot badge */}
                            <div className="mt-2 pt-2 border-t border-slate-200/50 w-full flex justify-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  docCameraInputRef.current?.click();
                                }}
                                className="z-20 flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-150 text-rose-600 border border-rose-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                Canlı Belge Fotoğrafı Çek 📸
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    {selectedDocFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDocFile(null);
                          setDocName('');
                        }}
                        className="px-3.5 py-2 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
                      >
                        Vazgeç
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={!selectedDocFile && !docName}
                      className="px-5 py-2.5 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 text-xs flex items-center justify-center gap-1 transition-all shadow-md shadow-indigo-600/10 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      Güvenli Sistemine Evrakı Kaydet
                    </button>
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
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t rounded-b-[2rem] flex flex-col gap-3 shadow-[0_-5px_15px_-5px_initial]">
          {validationError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold font-sans flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse flex-shrink-0" />
              {validationError}
            </div>
          )}
          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              type="button"
              className="w-1/3 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all"
            >
              Kapat
            </button>
            <button
              onClick={handleSave}
              type="button"
              className="w-2/3 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-600/20 active:scale-98 transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {property ? 'Değişiklikleri Kaydet ve Güncelle' : 'Gayrimenkul Portföyüne Ekle'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
