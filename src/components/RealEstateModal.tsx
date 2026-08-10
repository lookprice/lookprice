import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, FileText, Upload, Plus, Trash2, Shield, Calendar, Check, Sparkles, Cpu, Eye, Image as ImageIcon, RefreshCw, EyeOff, Camera, Compass } from 'lucide-react';
import { ImageGallery } from './ImageGallery';
import { MultiImageUploader } from './MultiImageUploader';
import { REAL_ESTATE_REGIONS, EMLAK_TIPI_SUB_TIPLERI } from '../data/realEstateConfig';
import { RealEstateProperty } from '../types';
import { api } from '../services/api';
import { contractTemplates } from '../utils/contractTemplates';
import { LiteRichEditor } from './LiteRichEditor';
import { AutocompleteSelect } from './AutocompleteSelect';

interface RealEstateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (property: RealEstateProperty) => void;
  property?: RealEstateProperty | null;
  storeId?: number;
  userRole?: string; // 'superadmin' | 'admin' | 'manager' | 'owner' | 'employee' | 'viewer'
}

const formatPriceDisplay = (val: number | string | undefined | null): string => {
  if (val === undefined || val === null || val === '' || val === 0) return '';
  const num = typeof val === 'number' ? val : parseInt(String(val).replace(/\D/g, ''), 10);
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('tr-TR').format(num);
};

const parsePriceInput = (val: string): number => {
  const digits = val.replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
};

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
    address: '',
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
  const [contacts, setContacts] = useState<any[]>([]);

  const standardizeOwnerPhone = (phone: string) => {
    if (!phone) return phone;
    let cleaned = phone.trim();
    if (cleaned.startsWith('05') && cleaned.replace(/\s/g, '').length === 11) {
      const rawDigits = cleaned.replace(/\s/g, '');
      cleaned = `+90 ${rawDigits.substring(1, 4)} ${rawDigits.substring(4, 7)} ${rawDigits.substring(7)}`;
    } else if (cleaned.startsWith('5') && cleaned.replace(/\s/g, '').length === 10) {
      const rawDigits = cleaned.replace(/\s/g, '');
      cleaned = `+90 ${rawDigits.substring(0, 3)} ${rawDigits.substring(3, 6)} ${rawDigits.substring(6)}`;
    } else if (!cleaned.startsWith('+') && !cleaned.startsWith('00')) {
      const rawDigits = cleaned.replace(/\D/g, '');
      if (rawDigits.length === 10) {
        cleaned = `+90 ${rawDigits.substring(0, 3)} ${rawDigits.substring(3, 6)} ${rawDigits.substring(6)}`;
      } else if (rawDigits.length === 11 && rawDigits.startsWith('0')) {
        cleaned = `+90 ${rawDigits.substring(1, 4)} ${rawDigits.substring(4, 7)} ${rawDigits.substring(7)}`;
      }
    }
    return cleaned;
  };

  const handleSave = () => {
    if (formData.listing_intent === 'rent') {
      const depVal = Number(formData.deposit);
      if (!formData.deposit || isNaN(depVal) || depVal <= 0) {
        setValidationError("Kiralık mülkler için 'Depozito Tutarı' girişi zorundur ve 0'dan büyük olmalıdır!");
        return;
      }
    }
    if (formData.type === 'land') {
      if (!formData.ada || !formData.parsel || !formData.mahalle) {
        setValidationError("Arsa/Tarla mülkleri için Mahalle, Ada ve Parsel bilgileri zorunludur!");
        return;
      }
    } else {
      if (!formData.address) {
        setValidationError("Konut/Ticari mülkler için adres bilgisi zorunludur!");
        return;
      }
    }
    setValidationError(null);

    // Sync owner to CRM contacts directly
    if (formData.owner_info?.fullName) {
      api.addRealEstateContact({
        name: formData.owner_info.fullName,
        phone: formData.owner_info.phone || '',
        type: 'owner',
        notes: `${formData.title || 'Mülk'} sahibi olarak portföy kaydından otomatik senkronize edildi.`
      }, storeId).catch(err => console.error("Auto CRM sync failed:", err));
    }

    const sectorData = {
      ...(formData.sector_data || {}),
      type: formData.type,
      subtype: formData.subtype,
      room_count: formData.room_count,
      rooms: formData.room_count,
      square_meters: Number(formData.square_meters) || 0,
      sqm_gross: Number(formData.sqm_gross) || 0,
      listing_intent: formData.listing_intent,
      kktc_region: formData.kktc_region,
      kktc_sub_region: formData.kktc_sub_region,
      kktc_title_type: formData.kktc_title_type,
      trafo_bedeli: !!formData.trafo_bedeli,
      kdv_status: formData.kdv_status,
      cati_terasi: !!formData.cati_terasi,
      furnished: !!formData.furnished,
      is_trade_in_available: !!formData.is_trade_in_available,
      commercial_devir_status: formData.commercial_devir_status || 'empty',
      monthly_rent_income: Number(formData.monthly_rent_income) || 0,
      frontage_width: Number(formData.frontage_width) || 0,
      ceiling_height: Number(formData.ceiling_height) || 0,
      water_tank_capacity: Number(formData.water_tank_capacity) || 0,
      generator_capacity_kva: Number(formData.generator_capacity_kva) || 0,
      entrance_count: formData.entrance_count || '',
      is_main_road_frontage: !!formData.is_main_road_frontage,
      ground_floor_sqm: Number(formData.ground_floor_sqm) || 0,
      has_basement: !!formData.has_basement,
      basement_sqm: Number(formData.basement_sqm) || 0,
      has_mezzanine: !!formData.has_mezzanine,
      mezzanine_sqm: Number(formData.mezzanine_sqm) || 0,
      has_outdoor_terrace: !!formData.has_outdoor_terrace,
      outdoor_sqm: Number(formData.outdoor_sqm) || 0,
      toilet_count: formData.toilet_count || '',
      has_chimney: !!formData.has_chimney,
      has_industrial_electricity: !!formData.has_industrial_electricity,
      has_generator: !!formData.has_generator,
      has_elevator: !!formData.has_elevator,
      has_parking: !!formData.has_parking,
      parking_capacity: formData.parking_capacity || '',
      has_kitchen: !!formData.has_kitchen,
      hotel_rooms: Number(formData.hotel_rooms) || 0,
      hotel_beds: Number(formData.hotel_beds) || 0,
      hotel_stars: formData.hotel_stars || '',
      has_tourism_license: !!formData.has_tourism_license,
      ada: formData.ada || '',
      parsel: formData.parsel || '',
      mahalle: formData.mahalle || '',
      kocan_type: formData.kocan_type || formData.kktc_title_type || '',
      zoning_status: formData.zoning_status || ''
    };

    const dataToSave = {
      ...formData,
      sector_data: sectorData
    };

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
      const [branchesRes, consultantsRes, contactsRes] = await Promise.all([
        api.getBranches(storeId),
        api.getConsultants(storeId),
        api.getRealEstateContacts(undefined, storeId)
      ]);
      setBranches(Array.isArray(branchesRes) ? branchesRes : []);
      setConsultants(Array.isArray(consultantsRes) ? consultantsRes : []);
      setContacts(Array.isArray(contactsRes) ? contactsRes : []);
    } catch (error) {
      console.error('Failed to fetch CRM data:', error);
    } finally {
      setLoadingCrm(false);
    }
  };

  useEffect(() => {
    setValidationError(null);
    if (property) {
      const sec = typeof property.sector_data === 'string' ? (() => { try { return JSON.parse(property.sector_data); } catch(e) { return {}; } })() : (property.sector_data || {});
      setFormData({
        ...sec,
        ...property,
        commercial_devir_status: property.commercial_devir_status || sec.commercial_devir_status || 'empty',
        monthly_rent_income: property.monthly_rent_income || sec.monthly_rent_income || 0,
        frontage_width: property.frontage_width || sec.frontage_width || 0,
        ceiling_height: property.ceiling_height || sec.ceiling_height || 0,
        water_tank_capacity: property.water_tank_capacity || sec.water_tank_capacity || 0,
        generator_capacity_kva: property.generator_capacity_kva || sec.generator_capacity_kva || 0,
        entrance_count: property.entrance_count || sec.entrance_count || '',
        is_main_road_frontage: property.is_main_road_frontage ?? sec.is_main_road_frontage ?? false,
        ground_floor_sqm: property.ground_floor_sqm || sec.ground_floor_sqm || 0,
        has_basement: property.has_basement ?? sec.has_basement ?? false,
        basement_sqm: property.basement_sqm || sec.basement_sqm || 0,
        has_mezzanine: property.has_mezzanine ?? sec.has_mezzanine ?? false,
        mezzanine_sqm: property.mezzanine_sqm || sec.mezzanine_sqm || 0,
        has_outdoor_terrace: property.has_outdoor_terrace ?? sec.has_outdoor_terrace ?? false,
        outdoor_sqm: property.outdoor_sqm || sec.outdoor_sqm || 0,
        toilet_count: property.toilet_count || sec.toilet_count || '',
        has_chimney: property.has_chimney ?? sec.has_chimney ?? false,
        has_industrial_electricity: property.has_industrial_electricity ?? sec.has_industrial_electricity ?? false,
        has_generator: property.has_generator ?? sec.has_generator ?? false,
        has_elevator: property.has_elevator ?? sec.has_elevator ?? false,
        has_parking: property.has_parking ?? sec.has_parking ?? false,
        parking_capacity: property.parking_capacity || sec.parking_capacity || '',
        has_kitchen: property.has_kitchen ?? sec.has_kitchen ?? false,
        hotel_rooms: property.hotel_rooms || sec.hotel_rooms || 0,
        hotel_beds: property.hotel_beds || sec.hotel_beds || 0,
        hotel_stars: property.hotel_stars || sec.hotel_stars || '',
        has_tourism_license: property.has_tourism_license ?? sec.has_tourism_license ?? false,
        ada: property.ada || sec.ada || (property.block_plot ? property.block_plot.split('/')[0] : ''),
        parsel: property.parsel || sec.parsel || (property.block_plot ? property.block_plot.split('/')[1] : ''),
        mahalle: property.mahalle || sec.mahalle || '',
        kocan_type: property.kocan_type || sec.kocan_type || property.kktc_title_type || '',
        zoning_status: property.zoning_status || sec.zoning_status || '',
        currency: property.currency || 'GBP',
        country: property.country || 'KKTC',
        kktc_region: property.kktc_region || sec.kktc_region || 'Girne',
        kktc_sub_region: property.kktc_sub_region || sec.kktc_sub_region || '',
        kktc_title_type: property.kktc_title_type || sec.kktc_title_type || 'Eşdeğer Koçan',
        trafo_bedeli: property.trafo_bedeli ?? sec.trafo_bedeli ?? false,
        kdv_status: property.kdv_status || sec.kdv_status || 'to_be_paid',
        cati_terasi: property.cati_terasi ?? sec.cati_terasi ?? false,
        is_on_enrakipsiz: property.is_on_enrakipsiz ?? true,
        auto_post_instagram: property.auto_post_instagram || false,
        subtype: property.subtype || sec.subtype || '',
        branch_name: property.branch_name || 'Merkez Ofis',
        authorized_branch_id: property.authorized_branch_id,
        responsible_agent: property.responsible_agent || '',
        responsible_consultant_id: property.responsible_consultant_id,
        listing_intent: property.listing_intent || sec.listing_intent || (property.reference_no?.toUpperCase().includes('-K-') ? 'rent' : 'sale'),
        owner_info: property.owner_info || { fullName: '', phone: '' },
        address: property.address || '',
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
        address: '',
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
          
          {/* Intent Toggle - Compact */}
          <div className="grid grid-cols-2 gap-3 bg-slate-100 p-1.5 rounded-2xl">
             <button
                type="button"
                onClick={() => setFormData({...formData, listing_intent: 'sale', status: 'active'})}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-black text-xs transition-all ${formData.listing_intent === 'sale' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'}`}
             >🏠 SATILIK (SALE)</button>
             <button
                type="button"
                onClick={() => setFormData({...formData, listing_intent: 'rent', status: 'active'})}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-black text-xs transition-all ${formData.listing_intent === 'rent' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'}`}
             >🔑 KİRALIK (RENT)</button>
          </div>

          {/* 1- PİLOT SATIŞ BÖLGESİ SEÇİMİ */}
          <div className="bg-gradient-to-r from-indigo-50/80 to-emerald-50/80 p-4 md:p-5 rounded-2xl border border-indigo-100 space-y-3 shadow-2xs">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <span className="flex items-center gap-2 text-indigo-950 font-black text-xs uppercase tracking-wide">
                🌍 1. PİLOT SATIŞ BÖLGESİ SEÇİMİ
              </span>
              <div className="flex bg-white p-1 rounded-xl border border-indigo-100 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, country: 'TR', currency: 'TRY' })}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${formData.country === 'TR' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Türkiye (TR)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, country: 'KKTC', currency: 'GBP' })}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${formData.country === 'KKTC' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Kuzey Kıbrıs (KKTC)
                </button>
              </div>
            </div>

            {formData.country === 'KKTC' ? (
              <div className="space-y-3 pt-1">
                <p className="text-[11px] text-indigo-800 font-medium leading-snug">
                  🌟 <strong>KKTC Pilot Modülü:</strong> Kıbrıs gayrimenkul portföyü ve UK yatırımcı odaklı alanlar aktif.
                </p>
                <div className={`grid grid-cols-1 ${formData.listing_intent === 'rent' ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-3`}>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">KKTC Bölgesi</label>
                    <select
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={formData.kktc_region}
                      onChange={(e) => setFormData({ ...formData, kktc_region: e.target.value as any, kktc_sub_region: '' })}
                    >
                      {Object.keys(REAL_ESTATE_REGIONS).map((region) => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Alt Bölge</label>
                    <select
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Koçan Tipi</label>
                      <select
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              </div>
            ) : (
              <p className="text-xs text-slate-600 font-medium">Türkiye pazarı standart gayrimenkul bölge yönetimi devrede.</p>
            )}
          </div>

          {/* 2- MÜLK SAHİBİ VE YETKİ BİLGİLERİ (Distinctive colored background and border) */}
          <div className="bg-amber-50/70 border-l-4 border-amber-500 p-4 md:p-5 rounded-2xl border-y border-r border-amber-200/60 space-y-4 shadow-2xs">
            <h5 className="text-xs font-black uppercase text-amber-950 flex items-center gap-1.5 border-b border-amber-200/50 pb-2">
              👤 2. Mülk Sahibi ve Yetki Bilgileri
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                 <AutocompleteSelect
                   items={contacts}
                   displayField="name"
                   secondaryField="phone"
                   type="customer"
                   lang="tr"
                   value={formData.owner_info?.fullName || ''}
                   placeholder="Mülk sahibi arayın..."
                   label="Mülk Sahibi (Ad Soyad)"
                   onSelect={(selectedContact) => {
                     if (selectedContact) {
                       setFormData({
                         ...formData,
                         owner_info: {
                           fullName: selectedContact.name,
                           phone: selectedContact.phone || ''
                         }
                       });
                     } else {
                       setFormData({
                         ...formData,
                         owner_info: {
                           fullName: '',
                           phone: ''
                         }
                       });
                     }
                   }}
                   onQuickAdd={async (searchVal) => {
                     try {
                       const newContact = {
                         name: searchVal,
                         phone: '',
                         type: 'owner' as const,
                         notes: 'Portföy ekranından hızlı eklendi.'
                       };
                       await api.addRealEstateContact(newContact, storeId);
                       const res = await api.getRealEstateContacts(undefined, storeId);
                       setContacts(Array.isArray(res) ? res : []);
                       const saved = Array.isArray(res) ? res.find(c => c.name.toLowerCase().trim() === searchVal.toLowerCase().trim()) : null;
                       setFormData({
                         ...formData,
                         owner_info: {
                           fullName: searchVal,
                           phone: saved?.phone || ''
                         }
                       });
                     } catch (err) {
                       console.error("Quick add failed", err);
                     }
                   }}
                 />
              </div>
              <div>
                 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Mülk Sahibi (Telefon)</label>
                 <input 
                   type="tel" 
                   placeholder="+90 533 123 4567"
                   className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all text-xs font-bold text-slate-800 outline-none shadow-2xs" 
                   value={formData.owner_info?.phone || ''}
                   onChange={(e) => setFormData({...formData, owner_info: {...formData.owner_info, phone: e.target.value} as any})}
                   onBlur={(e) => {
                     const normalized = standardizeOwnerPhone(e.target.value);
                     setFormData({...formData, owner_info: {...formData.owner_info, phone: normalized} as any});
                   }}
                 />
              </div>
            </div>
            
            {formData.type !== 'land' ? (
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Portföy Adres Bilgisi</label>
                <textarea
                  rows={2}
                  className="w-full p-2.5 bg-white border border-amber-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 placeholder:text-slate-400"
                  placeholder="Örn: Girne Merkez, Atatürk Caddesi No: 42..."
                  value={formData.address || ''}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Mahalle', key: 'mahalle' },
                  { label: 'Ada', key: 'ada' },
                  { label: 'Parsel', key: 'parsel' },
                  { label: 'Pafta', key: 'pafta' },
                ].map((field) => (
                  <div key={field.key}>
                     <label className="block text-[10px] font-bold text-slate-600 mb-1">{field.label}</label>
                     <input type="text" className="w-full p-2 bg-white border border-amber-200 rounded-xl text-xs font-bold" 
                      value={(formData as any)[field.key] || ''}
                      onChange={(e) => setFormData({...formData, [field.key]: e.target.value})}
                     />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3- TEMEL İLAN DETAYLARI */}
          <div className="bg-white border border-slate-200 p-4 md:p-5 rounded-2xl space-y-4 shadow-2xs">
            <h4 className="text-xs font-black uppercase text-slate-900 border-l-4 border-indigo-600 pl-2">
              📋 3. Temel İlan Detayları
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Referans / Portföy No</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: TR-1002"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                  value={formData.reference_no || ''}
                  onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-[10px] font-bold text-slate-500 mb-1">İlan Başlığı</label>
                <input
                  type="text"
                  placeholder="Örn: Girne Alsancak Dağ ve Deniz Manzaralı Lüks 2+1 Penthouse"
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3.5">
              <div className="md:col-span-5">
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                  Fiyat <span className="text-emerald-600 font-bold ml-1">(Binlik Ayraçlı)</span>
                </label>
                <div className="flex gap-1.5 items-center">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Örn: 850.000"
                    className="flex-1 min-w-[120px] p-2.5 bg-white border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10 rounded-xl text-sm font-extrabold text-slate-900 shadow-2xs outline-none"
                    value={formatPriceDisplay(formData.price)}
                    onChange={(e) => {
                      const numericVal = parsePriceInput(e.target.value);
                      setFormData({ ...formData, price: numericVal });
                    }}
                  />
                  <select
                    className="w-28 p-2.5 border border-slate-300 rounded-xl text-xs font-black bg-slate-100 text-slate-800 shadow-2xs outline-none cursor-pointer hover:bg-slate-200 transition-colors"
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

              <div className="md:col-span-3">
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">Emlak Tipi</label>
                <select
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white shadow-2xs outline-none cursor-pointer"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as any, subtype: ''})}
                >
                  <option value="residence">Konut / Residence</option>
                  <option value="commercial">Ticari / Commercial</option>
                  <option value="land">Arsa / Land</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">Alt Tip</label>
                <select
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white shadow-2xs outline-none cursor-pointer"
                  value={formData.subtype || ''}
                  onChange={(e) => setFormData({...formData, subtype: e.target.value})}
                >
                  <option value="">Alt tip seçiniz</option>
                  {EMLAK_TIPI_SUB_TIPLERI[formData.type === 'residence' ? 'Konut' : formData.type === 'commercial' ? 'Ticari' : 'Arsa']?.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">İlan Durumu</label>
                <select
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white shadow-2xs outline-none cursor-pointer"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                >
                  {formData.listing_intent === 'sale' ? (
                    <>
                      <option value="active">Satışta</option>
                      <option value="optioned">Opsiyonlu</option>
                      <option value="sold">Satıldı</option>
                    </>
                  ) : (
                    <>
                      <option value="active">Kiralık</option>
                      <option value="optioned">Opsiyonlu</option>
                      <option value="rented">Kiralandı</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* 4- DETAYLI METRİKLER & KONUM BİLGİSİ (Conditional for Land vs Commercial vs Residence) */}
          <div className="bg-sky-50/40 border border-sky-100 p-4 md:p-5 rounded-2xl space-y-4 shadow-2xs">
            <h4 className="text-xs font-black uppercase text-sky-950 border-l-4 border-sky-600 pl-2">
              📐 4. {formData.type === 'land' ? 'Arsa & Arazi İmar ve Metrik Bilgileri' : formData.type === 'commercial' ? '🏬 Ticari Mülk & İşyeri Detaylı Metrikleri' : '🏠 Konut / Residence Detaylı Metrikleri'}
            </h4>

            {formData.listing_intent === 'rent' && formData.type !== 'land' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50 p-3.5 rounded-xl border border-amber-200">
                <div>
                  <label className="block text-[10px] font-black text-rose-700 mb-1">Depozito Tutarı (Zorunlu) *</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Örn: 2000"
                    className="w-full p-2.5 border border-amber-300 rounded-xl text-xs font-bold bg-white"
                    value={formData.deposit || ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : Number(e.target.value);
                      setFormData({...formData, deposit: val});
                      if (val > 0) setValidationError(null);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Ödeme Periyodu</label>
                  <select className="w-full p-2.5 border border-amber-300 rounded-xl text-xs font-bold bg-white" value={formData.billing_period || 'monthly'} onChange={(e) => setFormData({...formData, billing_period: e.target.value as any})}>
                      <option value="monthly">Aylık</option>
                      <option value="3-monthly">3 Aylık</option>
                      <option value="6-monthly">6 Aylık</option>
                      <option value="yearly">Yıllık</option>
                  </select>
                </div>
              </div>
            )}

            {formData.type === 'land' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Arsa Alanı (m²)</label>
                    <input
                      type="number"
                      placeholder="Örn: 500"
                      className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-xs font-bold"
                      value={formData.square_meters || ''}
                      onChange={(e) => setFormData({...formData, square_meters: Number(e.target.value)})}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">İmar Durumu</label>
                    <select
                      className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-xs font-bold"
                      value={(formData as any).imar_durumu || ''}
                      onChange={(e) => setFormData({...formData, imar_durumu: e.target.value} as any)}
                    >
                      <option value="">Seçiniz</option>
                      <option value="Konut İmarlı">Konut İmarlı</option>
                      <option value="Ticari İmarlı">Ticari İmarlı</option>
                      <option value="Konut + Ticari">Konut + Ticari (Karma)</option>
                      <option value="Tarla / Tarım">Tarla / Tarım</option>
                      <option value="Zeytinlik">Zeytinlik</option>
                      <option value="Sanayi İmarlı">Sanayi İmarlı</option>
                      <option value="Turizm İmarlı">Turizm İmarlı</option>
                      <option value="İmarsız / Ham Arsa">İmarsız / Ham Arsa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Emsal / Kaks</label>
                    <input
                      type="text"
                      placeholder="Örn: 0.35 / 0.70"
                      className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-xs font-bold"
                      value={(formData as any).kaks || ''}
                      onChange={(e) => setFormData({...formData, kaks: e.target.value} as any)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Gabari / Kat Sınırı</label>
                    <input
                      type="text"
                      placeholder="Örn: 2 Kat (6.50m)"
                      className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-xs font-bold"
                      value={(formData as any).gabari || ''}
                      onChange={(e) => setFormData({...formData, gabari: e.target.value} as any)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-sky-200 text-xs font-bold text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!(formData as any).elektrik_var} onChange={(e) => setFormData({...formData, elektrik_var: e.target.checked} as any)} className="w-4 h-4 text-sky-600 rounded" />
                    <span>⚡ Elektrik Altyapısı Var</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!(formData as any).su_var} onChange={(e) => setFormData({...formData, su_var: e.target.checked} as any)} className="w-4 h-4 text-sky-600 rounded" />
                    <span>💧 Su Altyapısı Var</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!(formData as any).yol_var} onChange={(e) => setFormData({...formData, yol_var: e.target.checked} as any)} className="w-4 h-4 text-sky-600 rounded" />
                    <span>🛣️ Kadastro Yolu Var</span>
                  </label>
                </div>
              </div>
            ) : formData.type === 'commercial' ? (
              <div className="space-y-4">
                {/* Devir & Kiracı Durumu + Cephe & Kat Sayısı */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-blue-50/80 p-3.5 rounded-xl border border-blue-200">
                  <div>
                    <label className="block text-[10px] font-black text-blue-900 mb-1">Devir & Kiracı Durumu *</label>
                    <select
                      className="w-full p-2.5 bg-white border border-blue-300 rounded-xl text-xs font-bold text-slate-800"
                      value={formData.commercial_devir_status || 'empty'}
                      onChange={(e) => setFormData({...formData, commercial_devir_status: e.target.value as any})}
                    >
                      <option value="empty">🔑 Boş / Kullanıma Hazır</option>
                      <option value="devren">🔄 Devren Satılık</option>
                      <option value="tenant">📈 Hazır Kiracılı</option>
                    </select>
                  </div>

                  {formData.commercial_devir_status === 'tenant' ? (
                    <div>
                      <label className="block text-[10px] font-black text-emerald-800 mb-1">Aylık Kira Geliri (£ / ₺ / $)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Örn: 2.500"
                        className="w-full p-2.5 bg-white border border-emerald-300 focus:border-emerald-500 rounded-xl text-xs font-bold text-slate-900 outline-none"
                        value={formatPriceDisplay(formData.monthly_rent_income)}
                        onChange={(e) => setFormData({...formData, monthly_rent_income: parsePriceInput(e.target.value)})}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Vitrin / Cephe Genişliği (m)</label>
                      <input
                        type="number"
                        placeholder="Örn: 12"
                        className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-xs font-bold"
                        value={formData.frontage_width || ''}
                        onChange={(e) => setFormData({...formData, frontage_width: Number(e.target.value)})}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Tavan / Vitrin Yüksekliği (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Örn: 4.5"
                      className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-xs font-bold"
                      value={formData.ceiling_height || ''}
                      onChange={(e) => setFormData({...formData, ceiling_height: Number(e.target.value)})}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Toplam Kat Sayısı</label>
                    <input
                      type="text"
                      placeholder="Örn: 3 Katlı (Bodrum, Zemin, Asma)"
                      className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-xs font-bold"
                      value={formData.total_floors || ''}
                      onChange={(e) => setFormData({...formData, total_floors: e.target.value})}
                    />
                  </div>
                </div>

                {/* Stratejik Altyapı & Kapasite Metrikleri */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-amber-50/50 p-3.5 rounded-xl border border-amber-200">
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 mb-1">🚰 Su Deposu Kapasitesi (Ton)</label>
                    <input
                      type="number"
                      placeholder="Örn: 15 (Ton)"
                      className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs font-bold"
                      value={formData.water_tank_capacity || ''}
                      onChange={(e) => setFormData({...formData, water_tank_capacity: Number(e.target.value)})}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 mb-1">⚡ Jeneratör Gücü (kVA)</label>
                    <input
                      type="number"
                      placeholder="Örn: 110 (kVA)"
                      className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs font-bold"
                      value={formData.generator_capacity_kva || ''}
                      onChange={(e) => setFormData({...formData, generator_capacity_kva: Number(e.target.value)})}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 mb-1">🚪 Giriş / Kapı / Sevkiyat Sayısı</label>
                    <input
                      type="text"
                      placeholder="Örn: 2 Giriş + Tır Yükleme Kapısı"
                      className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs font-bold"
                      value={formData.entrance_count || ''}
                      onChange={(e) => setFormData({...formData, entrance_count: e.target.value})}
                    />
                  </div>
                </div>

                {/* Metrajlar & Kullanım Alanları */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Toplam Net Alan (m²)</label>
                    <input
                      type="number"
                      placeholder="Net m² (Örn: 600)"
                      className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-xs font-bold"
                      value={formData.square_meters || ''}
                      onChange={(e) => setFormData({...formData, square_meters: Number(e.target.value)})}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Toplam Brüt Alan (m²)</label>
                    <input
                      type="number"
                      placeholder="Brüt m² (Örn: 680)"
                      className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-xs font-bold"
                      value={formData.sqm_gross || ''}
                      onChange={(e) => setFormData({...formData, sqm_gross: Number(e.target.value)})}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Zemin Kat Metrajı (m²)</label>
                    <input
                      type="number"
                      placeholder="Örn: 250"
                      className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-xs font-bold"
                      value={formData.ground_floor_sqm || ''}
                      onChange={(e) => setFormData({...formData, ground_floor_sqm: Number(e.target.value)})}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">WC / Tuvalet Sayısı</label>
                    <input
                      type="text"
                      placeholder="Örn: 2 WC / Bay-Bayan"
                      className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-xs font-bold"
                      value={formData.toilet_count || ''}
                      onChange={(e) => setFormData({...formData, toilet_count: e.target.value})}
                    />
                  </div>
                </div>

                {/* Kat Dağılımı ve Metraj Detayları (Bodrum Kat, Asma Kat, Teras/Açık Alan) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                      <input type="checkbox" checked={!!formData.has_basement} onChange={(e) => setFormData({...formData, has_basement: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                      <span>📦 Bodrum Kat / Depo Var</span>
                    </label>
                    {formData.has_basement && (
                      <input
                        type="number"
                        placeholder="Bodrum Kat m² (Örn: 150)"
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                        value={formData.basement_sqm || ''}
                        onChange={(e) => setFormData({...formData, basement_sqm: Number(e.target.value)})}
                      />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                      <input type="checkbox" checked={!!formData.has_mezzanine} onChange={(e) => setFormData({...formData, has_mezzanine: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                      <span>🏢 Asma Kat / Sende Kat Var</span>
                    </label>
                    {formData.has_mezzanine && (
                      <input
                        type="number"
                        placeholder="Asma Kat m² (Örn: 120)"
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                        value={formData.mezzanine_sqm || ''}
                        onChange={(e) => setFormData({...formData, mezzanine_sqm: Number(e.target.value)})}
                      />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                      <input type="checkbox" checked={!!formData.has_outdoor_terrace} onChange={(e) => setFormData({...formData, has_outdoor_terrace: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                      <span>🌅 Açık Kullanım / Teras Var</span>
                    </label>
                    {formData.has_outdoor_terrace && (
                      <input
                        type="number"
                        placeholder="Açık Alan m² (Örn: 80)"
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                        value={formData.outdoor_sqm || ''}
                        onChange={(e) => setFormData({...formData, outdoor_sqm: Number(e.target.value)})}
                      />
                    )}
                  </div>
                </div>

                {/* Ticari Tesis & Altyapı Toggles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-sky-200 text-xs font-bold text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer text-amber-900 bg-amber-50/60 p-1.5 rounded-lg border border-amber-200/60">
                    <input type="checkbox" checked={!!formData.is_main_road_frontage} onChange={(e) => setFormData({...formData, is_main_road_frontage: e.target.checked})} className="w-4 h-4 text-amber-600 rounded" />
                    <span>🛣️ Ana Yol / Cadde Üzeri</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!formData.has_chimney} onChange={(e) => setFormData({...formData, has_chimney: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                    <span>🌬️ Endüstriyel Baca</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!formData.has_industrial_electricity} onChange={(e) => setFormData({...formData, has_industrial_electricity: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                    <span>⚡ Sanayi Elektriği</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!formData.has_generator} onChange={(e) => setFormData({...formData, has_generator: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                    <span>🔋 Jeneratör Altyapısı</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!formData.has_elevator} onChange={(e) => setFormData({...formData, has_elevator: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                    <span>🚛 Yük / Müşteri Asansörü</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!formData.has_parking} onChange={(e) => setFormData({...formData, has_parking: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                    <span>🅿️ Otopark Alanı</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!formData.has_kitchen} onChange={(e) => setFormData({...formData, has_kitchen: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                    <span>🍳 Mutfak / Kitchenette</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!formData.trafo_bedeli} onChange={(e) => setFormData({...formData, trafo_bedeli: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                    <span>⚡ Trafo Bedeli Ödendi</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">KDV:</span>
                    <select className="p-1 border border-slate-200 rounded text-xs font-bold bg-white" value={formData.kdv_status} onChange={(e) => setFormData({...formData, kdv_status: e.target.value as any})}>
                      <option value="to_be_paid">Ödenecek</option>
                      <option value="paid">Ödendi</option>
                    </select>
                  </div>
                </div>

                {/* Otopark Kapasitesi */}
                {formData.has_parking && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Otopark Kapasitesi (Araç Sayısı)</label>
                    <input
                      type="text"
                      placeholder="Örn: 10 Araçlık Özel Müşteri Otoparkı"
                      className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-xs font-bold"
                      value={formData.parking_capacity || ''}
                      onChange={(e) => setFormData({...formData, parking_capacity: e.target.value})}
                    />
                  </div>
                )}

                {/* Otel / Pansiyon Özel Alanları */}
                {(formData.subtype?.toLowerCase().includes('otel') || formData.subtype?.toLowerCase().includes('pansiyon') || formData.subtype?.toLowerCase().includes('konaklama')) && (
                  <div className="p-3.5 bg-purple-50/80 rounded-xl border border-purple-200 space-y-3">
                    <h5 className="text-xs font-black uppercase text-purple-950 flex items-center gap-2">
                      🏨 Otel & Konaklama Tesisi Özel Metrikleri
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Toplam Oda Sayısı</label>
                        <input
                          type="number"
                          placeholder="Örn: 24"
                          className="w-full p-2 bg-white border border-purple-200 rounded-lg text-xs font-bold"
                          value={formData.hotel_rooms || ''}
                          onChange={(e) => setFormData({...formData, hotel_rooms: Number(e.target.value)})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Yatak Kapasitesi</label>
                        <input
                          type="number"
                          placeholder="Örn: 60"
                          className="w-full p-2 bg-white border border-purple-200 rounded-lg text-xs font-bold"
                          value={formData.hotel_beds || ''}
                          onChange={(e) => setFormData({...formData, hotel_beds: Number(e.target.value)})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Sınıfı / Yıldız</label>
                        <input
                          type="text"
                          placeholder="Örn: Butik Otel / 3 Yıldızlı"
                          className="w-full p-2 bg-white border border-purple-200 rounded-lg text-xs font-bold"
                          value={formData.hotel_stars || ''}
                          onChange={(e) => setFormData({...formData, hotel_stars: e.target.value})}
                        />
                      </div>
                      <div className="flex items-center pt-4">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-purple-900">
                          <input type="checkbox" checked={!!formData.has_tourism_license} onChange={(e) => setFormData({...formData, has_tourism_license: e.target.checked})} className="w-4 h-4 text-purple-600 rounded" />
                          <span>📜 Turizm Ruhsatlı</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Net Alan (m²)</label>
                    <input
                      type="number"
                      placeholder="Net m²"
                      className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-xs font-bold"
                      value={formData.square_meters || ''}
                      onChange={(e) => setFormData({...formData, square_meters: Number(e.target.value)})}
                    />
                  </div>

                  {formData.listing_intent !== 'rent' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Brüt Alan (m²)</label>
                      <input
                        type="number"
                        placeholder="Brüt m²"
                        className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-xs font-bold"
                        value={formData.sqm_gross || ''}
                        onChange={(e) => setFormData({...formData, sqm_gross: Number(e.target.value)})}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Oda Sayısı</label>
                    <input
                      type="text"
                      placeholder="3+1, 2+1 vb."
                      className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-xs font-bold"
                      value={formData.room_count || ''}
                      onChange={(e) => setFormData({...formData, room_count: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Bina Yaşı</label>
                    <input
                      type="text"
                      placeholder="Yaş"
                      className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-xs font-bold"
                      value={formData.building_age || ''}
                      onChange={(e) => setFormData({...formData, building_age: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Cephe</label>
                    <select
                      className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-xs font-bold"
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
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Kat</label>
                    <input
                      type="text"
                      placeholder="3. Kat"
                      className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-xs font-bold"
                      value={formData.floor || ''}
                      onChange={(e) => setFormData({...formData, floor: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Isıtma</label>
                    <select
                      className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-xs font-bold"
                      value={formData.heating || ''}
                      onChange={(e) => setFormData({...formData, heating: e.target.value})}
                    >
                      <option value="">Seçiniz</option>
                      <option value="Klima">Klima (KKTC)</option>
                      <option value="Yerden Isıtma">Yerden Isıtma</option>
                      <option value="Kombi">Kombi</option>
                      <option value="Merkezi Sistem">Merkezi</option>
                      <option value="Yok">Yok</option>
                    </select>
                  </div>
                </div>

                {/* Trafo, KDV, Çatı Terası, Site İçi toggles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-sky-200 text-xs font-bold text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!formData.trafo_bedeli} onChange={(e) => setFormData({...formData, trafo_bedeli: e.target.checked})} className="w-4 h-4 text-sky-600 rounded" />
                    <span>Trafo Bedeli Ödendi</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">KDV:</span>
                    <select className="p-1 border border-slate-200 rounded text-xs font-bold" value={formData.kdv_status} onChange={(e) => setFormData({...formData, kdv_status: e.target.value as any})}>
                      <option value="to_be_paid">Ödenecek</option>
                      <option value="paid">Ödendi</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!formData.cati_terasi} onChange={(e) => setFormData({...formData, cati_terasi: e.target.checked})} className="w-4 h-4 text-sky-600 rounded" />
                    <span>Çatı Terası</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!formData.in_gated_community} onChange={(e) => setFormData({...formData, in_gated_community: e.target.checked})} className="w-4 h-4 text-sky-600 rounded" />
                    <span>Site İçi</span>
                  </label>
                </div>
              </>
            )}
          </div>

          {/* 5- AÇIKLAMA (UK ve TR Yatırımcıları için Notlar) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">✍️ 5. Açıklama (UK ve TR Yatırımcıları için Notlar)</label>
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <LiteRichEditor
                value={formData.description || ''}
                onChange={(newContent) => setFormData(prev => ({...prev, description: newContent}))}
                placeholder="Yatırım potansiyeli, amortisman süresi ve açıklamalar..."
                minHeight="200px"
              />
            </div>
          </div>

          {/* 6- FOTOĞRAFLAR & MEDYA */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-indigo-950 border-l-4 border-indigo-600 pl-2">
              📸 6. Fotoğraflar & Medya
            </h4>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Yüklü Görseller</span>
                <MultiImageUploader onImagesUploaded={(urls) => setFormData({...formData, images: [...(formData.images || []), ...urls]})} />
              </div>
              <ImageGallery 
                  images={formData.images || []} 
                  onChange={(images) => setFormData({...formData, images})} 
                  isEditable={true}
              />
            </div>
          </div>

          {/* 7- GÜVENLİ DOKÜMAN YÖNETİMİ & PORTFÖY DOĞRULANMIŞ ROZETİ */}
          <div className="bg-amber-50/40 border border-amber-200/60 p-4 md:p-5 rounded-2xl space-y-4 shadow-2xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-xs font-black uppercase text-amber-950 border-l-4 border-amber-600 pl-2 flex items-center gap-1.5">
                📁 7. Güvenli Doküman Yönetimi & Doğrulama
              </h4>
              
              {/* Portföy Doğrulanmış Rozeti burada */}
              <label className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-amber-300 cursor-pointer shadow-2xs">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  checked={formData.is_verified || false}
                  onChange={(e) => setFormData({...formData, is_verified: e.target.checked})}
                />
                <span className="text-xs font-black text-amber-900">⭐ Portföy Doğrulanmış Rozeti</span>
              </label>
            </div>

            {isOfficeManager ? (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-600">Resmî tapu, DASK ve sözleşmeler ofis yöneticisi güvenli alanında saklanır.</p>
                {/* Documents list & form */}
                <div className="space-y-2">
                  {(!formData.documents || formData.documents.length === 0) ? (
                    <div className="text-center py-4 border border-dashed border-slate-300 rounded-xl bg-white text-slate-400 text-xs">
                      Henüz eklenmiş resmi evrak yok.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {formData.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl text-xs">
                          <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span className="font-bold text-slate-800 truncate flex-1">{doc.name}</span>
                          <button type="button" onClick={() => handleRemoveDocument(doc.id)} className="text-rose-500 p-1 hover:bg-rose-50 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Add Doc Form with Camera & File Support */}
                <div className="bg-white p-4 rounded-2xl border border-amber-200 space-y-3 shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Belge Türü</label>
                      <select
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50"
                        value={docCategory}
                        onChange={(e) => setDocCategory(e.target.value as any)}
                      >
                        <option value="title_deed">📋 Tapu Örneği / Title Deed</option>
                        <option value="dask">🛡️ DASK / Sigorta</option>
                        <option value="contract">✍️ Yetki & Aracılık Sözleşmesi</option>
                        <option value="auth_doc">🔑 Diğer Resmî Evrak</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Evrak Adı (Opsiyonel)</label>
                      <input
                        type="text"
                        placeholder="Örn: Blok A-3 Tapu Örneği"
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold"
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                      />
                    </div>
                  </div>

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

                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="file"
                      id="document-secure-file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedDocFile(file);
                          if (!docName) {
                            setDocName(file.name.split('.')[0]);
                          }
                        }
                      }}
                      className="hidden"
                    />

                    <label htmlFor="document-secure-file" className="w-full sm:flex-1 p-2.5 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl bg-slate-50 text-xs font-bold text-slate-600 flex items-center justify-center gap-2 cursor-pointer transition-all">
                      <Upload className="w-4 h-4 text-indigo-600" />
                      {selectedDocFile ? selectedDocFile.name : 'Dosya Seç veya Sürükle (PDF, Resim)'}
                    </label>

                    <button
                      type="button"
                      onClick={() => docCameraInputRef.current?.click()}
                      className="w-full sm:w-auto px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Camera className="w-4 h-4" />
                      Kamera 📸
                    </button>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    {selectedDocFile && (
                      <button
                        type="button"
                        onClick={() => { setSelectedDocFile(null); setDocName(''); }}
                        className="px-3 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                      >
                        Vazgeç
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleAddDocument}
                      disabled={!selectedDocFile && !docName}
                      className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      Güvenli Sistemine Evrakı Kaydet
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Güvenli evrak yönetimi sadece yönetici yetkisindedir.</p>
            )}
          </div>

          {/* 8- ÇOK ŞUBELİ CRM & HAVUZ YÖNETİMİ */}
          <div className="bg-slate-50 border border-slate-200 p-4 md:p-5 rounded-2xl space-y-4 shadow-2xs">
            <h4 className="text-xs font-black uppercase text-slate-900 border-l-4 border-slate-700 pl-2">
              🏢 8. Çok Şubeli CRM & Havuz Yönetimi
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Yetkili Şube</label>
                <select 
                  className="w-full p-2.5 bg-white text-slate-900 border border-slate-200 rounded-xl text-xs font-bold"
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
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Sorumlu Danışman</label>
                <select 
                  className="w-full p-2.5 bg-white text-slate-900 border border-slate-200 rounded-xl text-xs font-bold"
                  value={formData.responsible_consultant_id || ''}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    const consultant = consultants.find(c => c.id === id);
                    setFormData({...formData, responsible_consultant_id: id, responsible_agent: consultant?.name || ''});
                  }}
                >
                  <option value="">Danışman Seçiniz</option>
                  {consultants.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-1">Paylaşım Durumu</label>
              <select
                className="w-full p-2.5 bg-white text-slate-900 border border-slate-200 rounded-xl text-xs font-bold"
                value={formData.sharing_scope || 'shared_pool'}
                onChange={(e) => setFormData({...formData, sharing_scope: e.target.value as any})}
              >
                <option value="shared_pool">🌐 Ortak Havuz (Tüm Şubeler Satabilir)</option>
                <option value="branch_private">🔒 Şube İçi Özel</option>
                <option value="private">🔑 Danışmana Özel</option>
              </select>
            </div>
          </div>

          {/* BOTTOM OPTIONS & CHECKBOXES (Standard style, clean bottom positioning) */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 md:p-5 rounded-2xl space-y-3 shadow-md">
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-300 block mb-1">
              ⚙️ İlan Yayın & Dağıtım Seçenekleri
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2.5 cursor-pointer bg-white/10 p-2.5 rounded-xl border border-white/10 hover:bg-white/15 transition-all">
                <input 
                  type="checkbox" 
                  checked={!!formData.is_trade_in_available}
                  onChange={(e) => setFormData({...formData, is_trade_in_available: e.target.checked})}
                  className="w-4 h-4 text-indigo-500 rounded border-slate-400"
                />
                <span className="text-xs font-bold text-white">Takas Kabul Ediliyor</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer bg-white/10 p-2.5 rounded-xl border border-white/10 hover:bg-white/15 transition-all">
                <input 
                  type="checkbox" 
                  checked={!!formData.is_on_enrakipsiz}
                  onChange={(e) => setFormData({...formData, is_on_enrakipsiz: e.target.checked})}
                  className="w-4 h-4 text-indigo-500 rounded border-slate-400"
                />
                <span className="text-xs font-bold text-white">EnRakipsiz.com'da Yayınla</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer bg-white/10 p-2.5 rounded-xl border border-white/10 hover:bg-white/15 transition-all">
                <input 
                  type="checkbox" 
                  checked={!!formData.auto_post_instagram}
                  onChange={(e) => setFormData({...formData, auto_post_instagram: e.target.checked})}
                  className="w-4 h-4 text-indigo-500 rounded border-slate-400"
                />
                <span className="text-xs font-bold text-white">Instagram'da Otomatik Paylaş (Onaylı)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer bg-rose-500/20 p-2.5 rounded-xl border border-rose-500/30 hover:bg-rose-500/30 transition-all">
                <input
                  type="checkbox"
                  checked={Boolean((formData as any).is_discounted)}
                  onChange={(e) => setFormData({ ...formData, is_discounted: e.target.checked } as any)}
                  className="w-4 h-4 text-rose-500 rounded border-slate-400"
                />
                <span className="text-xs font-bold text-rose-200">🔥 Kelepir & Fırsat İlanı</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer bg-amber-500/20 p-2.5 rounded-xl border border-amber-500/30 hover:bg-amber-500/30 transition-all sm:col-span-2">
                <input
                  type="checkbox"
                  checked={Boolean((formData as any).is_featured)}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked } as any)}
                  className="w-4 h-4 text-amber-500 rounded border-slate-400"
                />
                <span className="text-xs font-bold text-amber-200">⭐ Öne Çıkan / VIP İlan</span>
              </label>
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t rounded-b-[2rem] flex flex-col gap-3 shadow-2xl">
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
              className="w-2/3 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
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
