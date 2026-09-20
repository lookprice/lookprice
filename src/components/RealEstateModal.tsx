import React, { useState, useEffect, useRef } from 'react';
import { 
  X, FileText, Upload, Plus, Trash2, Shield, Calendar, Check, 
  Sparkles, Camera, Building2, MapPin, DollarSign, Layers, 
  Image as ImageIcon, AlignLeft, Award, ChevronLeft, ChevronRight, LayoutGrid, Sliders
} from 'lucide-react';
import { ImageGallery } from './ImageGallery';
import { MultiImageUploader } from './MultiImageUploader';
import { REAL_ESTATE_REGIONS, EMLAK_TIPI_SUB_TIPLERI } from '../data/realEstateConfig';
import { RealEstateProperty } from '../types';
import { api } from '../services/api';
import { LiteRichEditor } from './LiteRichEditor';
import { AutocompleteSelect } from './AutocompleteSelect';

interface RealEstateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (property: RealEstateProperty) => void;
  property?: RealEstateProperty | null;
  storeId?: number;
  userRole?: string;
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

type TabId = 'basic' | 'owner' | 'metrics' | 'media' | 'description' | 'docs';

const TABS: { id: TabId; label: string; icon: any; short: string }[] = [
  { id: 'basic', label: '1. Temel & Fiyat', icon: DollarSign, short: 'Temel & Fiyat' },
  { id: 'owner', label: '2. Mülk Sahibi & Konum', icon: MapPin, short: 'Mülk Sahibi' },
  { id: 'metrics', label: '3. Metrikler & Donanım', icon: Layers, short: 'Metrikler' },
  { id: 'media', label: '4. Görseller & Medya', icon: ImageIcon, short: 'Görseller' },
  { id: 'description', label: '5. İlan Metni & Notlar', icon: AlignLeft, short: 'Açıklama' },
  { id: 'docs', label: '6. Evrak & Yayın', icon: Award, short: 'Evrak & Yayın' },
];

export const RealEstateModal: React.FC<RealEstateModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  property,
  storeId,
  userRole = 'admin'
}) => {
  const isOfficeManager = [
    'superadmin', 'admin', 'storeadmin', 'manager', 'owner', 
    'yönetici', 'yonetici', 'portfolio_manager', 'portföy yöneticisi', 
    'consultant', 'danışman', 'danisman', 'editor'
  ].includes((userRole || 'admin').toString().toLowerCase());

  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const [viewMode, setViewMode] = useState<'tabs' | 'all'>('tabs');

  const [formData, setFormData] = useState<Partial<RealEstateProperty>>({
    title: '',
    price: 0,
    reference_no: `REF-${Math.floor(Math.random() * 9000) + 1000}`,
    currency: 'GBP',
    type: 'residence',
    subtype: '',
    listing_intent: 'sale',
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
    country: 'KKTC',
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

  // CRM states
  const [branches, setBranches] = useState<any[]>([]);
  const [consultants, setConsultants] = useState<any[]>([]);
  const [loadingCrm, setLoadingCrm] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);

  // Document Upload state
  const [docName, setDocName] = useState('');
  const [docCategory, setDocCategory] = useState<'title_deed'|'dask'|'contract'|'auth_doc'>('title_deed');
  const [docUrl, setDocUrl] = useState('');
  const [selectedDocFile, setSelectedDocFile] = useState<File | null>(null);
  const docCameraInputRef = useRef<HTMLInputElement>(null);

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
      const sec = typeof (property as any).sector_data === 'string' 
        ? (() => { try { return JSON.parse((property as any).sector_data); } catch(e) { return {}; } })() 
        : ((property as any).sector_data || {});

      setFormData({
        ...sec,
        ...property,
        commercial_devir_status: (property as any).commercial_devir_status || sec.commercial_devir_status || 'empty',
        monthly_rent_income: (property as any).monthly_rent_income || sec.monthly_rent_income || 0,
        frontage_width: (property as any).frontage_width || sec.frontage_width || 0,
        ceiling_height: (property as any).ceiling_height || sec.ceiling_height || 0,
        water_tank_capacity: (property as any).water_tank_capacity || sec.water_tank_capacity || 0,
        generator_capacity_kva: (property as any).generator_capacity_kva || sec.generator_capacity_kva || 0,
        entrance_count: (property as any).entrance_count || sec.entrance_count || '',
        is_main_road_frontage: (property as any).is_main_road_frontage ?? sec.is_main_road_frontage ?? false,
        ground_floor_sqm: (property as any).ground_floor_sqm || sec.ground_floor_sqm || 0,
        has_basement: (property as any).has_basement ?? sec.has_basement ?? false,
        basement_sqm: (property as any).basement_sqm || sec.basement_sqm || 0,
        has_mezzanine: (property as any).has_mezzanine ?? sec.has_mezzanine ?? false,
        mezzanine_sqm: (property as any).mezzanine_sqm || sec.mezzanine_sqm || 0,
        has_outdoor_terrace: (property as any).has_outdoor_terrace ?? sec.has_outdoor_terrace ?? false,
        outdoor_sqm: (property as any).outdoor_sqm || sec.outdoor_sqm || 0,
        toilet_count: (property as any).toilet_count || sec.toilet_count || '',
        has_chimney: (property as any).has_chimney ?? sec.has_chimney ?? false,
        has_industrial_electricity: (property as any).has_industrial_electricity ?? sec.has_industrial_electricity ?? false,
        has_generator: (property as any).has_generator ?? sec.has_generator ?? false,
        has_elevator: (property as any).has_elevator ?? sec.has_elevator ?? false,
        has_parking: (property as any).has_parking ?? sec.has_parking ?? false,
        parking_capacity: (property as any).parking_capacity || sec.parking_capacity || '',
        has_kitchen: (property as any).has_kitchen ?? sec.has_kitchen ?? false,
        hotel_rooms: (property as any).hotel_rooms || sec.hotel_rooms || 0,
        hotel_beds: (property as any).hotel_beds || sec.hotel_beds || 0,
        hotel_stars: (property as any).hotel_stars || sec.hotel_stars || '',
        has_tourism_license: (property as any).has_tourism_license ?? sec.has_tourism_license ?? false,
        ada: sec.ada || (property as any).ada || (property.block_plot ? property.block_plot.split('/')[0] : ''),
        parsel: sec.parsel || (property as any).parsel || (property.block_plot ? property.block_plot.split('/')[1] : ''),
        mahalle: sec.mahalle || (property as any).mahalle || '',
        kocan_type: sec.kocan_type || sec.kktc_title_type || (property as any).kocan_type || property.kktc_title_type || '',
        zoning_status: sec.zoning_status || sec.imar_durumu || (property as any).zoning_status || (property as any).imar_durumu || '',
        imar_durumu: sec.imar_durumu || sec.zoning_status || (property as any).imar_durumu || (property as any).zoning_status || '',
        kaks: sec.kaks || (property as any).kaks || '',
        gabari: sec.gabari || (property as any).gabari || '',
        elektrik_var: sec.elektrik_var !== undefined ? !!sec.elektrik_var : (sec.elektrik_altyapisi !== undefined ? !!sec.elektrik_altyapisi : !!((property as any).elektrik_var || (property as any).elektrik_altyapisi)),
        su_var: sec.su_var !== undefined ? !!sec.su_var : (sec.su_altyapisi !== undefined ? !!sec.su_altyapisi : !!((property as any).su_var || (property as any).su_altyapisi)),
        yol_var: sec.yol_var !== undefined ? !!sec.yol_var : (sec.kadastro_yolu !== undefined ? !!sec.kadastro_yolu : !!((property as any).yol_var || (property as any).kadastro_yolu)),
        currency: property.currency || 'GBP',
        country: property.country || 'KKTC',
        kktc_region: property.kktc_region || sec.kktc_region || 'Girne',
        kktc_sub_region: property.kktc_sub_region || sec.kktc_sub_region || '',
        kktc_title_type: property.kktc_title_type || sec.kktc_title_type || sec.kocan_type || (property as any).kocan_type || 'Eşdeğer Koçan',
        trafo_bedeli: sec.trafo_bedeli !== undefined ? !!sec.trafo_bedeli : !!property.trafo_bedeli,
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
    setDocName('');
    setDocUrl('');
    setSelectedDocFile(null);
  }, [property, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (formData.listing_intent === 'rent') {
      const depVal = Number(formData.deposit);
      if (!formData.deposit || isNaN(depVal) || depVal <= 0) {
        setValidationError("Kiralık mülkler için 'Depozito Tutarı' girişi zorunludur ve 0'dan büyük olmalıdır!");
        setActiveTab('basic');
        return;
      }
    }
    if (formData.type === 'land') {
      if (!formData.ada || !formData.parsel || !formData.mahalle) {
        setValidationError("Arsa/Tarla mülkleri için Mahalle, Ada ve Parsel bilgileri zorunludur!");
        setActiveTab('owner');
        return;
      }
    } else {
      if (!formData.address) {
        setValidationError("Konut/Ticari mülkler için adres bilgisi zorunludur!");
        setActiveTab('owner');
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
      ...((formData as any).sector_data || {}),
      type: formData.type,
      subtype: formData.subtype,
      room_count: formData.room_count,
      rooms: formData.room_count,
      square_meters: Number(formData.square_meters) || 0,
      sqm_gross: Number(formData.sqm_gross) || 0,
      listing_intent: formData.listing_intent,
      kktc_region: formData.kktc_region,
      kktc_sub_region: formData.kktc_sub_region,
      kktc_title_type: formData.kktc_title_type || (formData as any).kocan_type || 'Eşdeğer Koçan',
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
      kocan_type: (formData as any).kocan_type || formData.kktc_title_type || '',
      zoning_status: (formData as any).zoning_status || (formData as any).imar_durumu || '',
      imar_durumu: (formData as any).imar_durumu || (formData as any).zoning_status || '',
      kaks: (formData as any).kaks || '',
      gabari: (formData as any).gabari || '',
      elektrik_var: !!(formData as any).elektrik_var,
      su_var: !!(formData as any).su_var,
      yol_var: !!(formData as any).yol_var,
      elektrik_altyapisi: !!(formData as any).elektrik_var,
      su_altyapisi: !!(formData as any).su_var,
      kadastro_yolu: !!(formData as any).yol_var
    };

    const dataToSave = {
      ...formData,
      block_plot: (formData.ada || formData.parsel) ? `${formData.ada || ''}/${formData.parsel || ''}` : formData.block_plot,
      sector_data: sectorData
    };

    onSave(dataToSave as RealEstateProperty);
  };

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

  const currentTabIndex = TABS.findIndex(t => t.id === activeTab);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4">
      {/* High-tech backdrop */}
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs" onClick={onClose} />
      
      {/* Modal Main Frame - Viewport Fit Compact & Futuristic */}
      <div className="bg-white rounded-2xl w-full max-w-5xl relative z-10 flex flex-col h-[94vh] sm:h-[90vh] md:h-[86vh] shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
        
        {/* TOP FUTURISTIC BAR */}
        <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between gap-3 border-b border-slate-800 shrink-0 select-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase font-mono">RESTATELP CORE</span>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300 font-mono font-bold">
                  {formData.reference_no || 'REF-AUTO'}
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-black text-white truncate">
                {property ? `Portföy Düzenle: ${property.title || property.reference_no}` : 'Yeni Gayrimenkul Portföyü Girişi'}
              </h3>
            </div>
          </div>

          {/* Quick Header Switchers & Close */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Intent Switcher */}
            <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
              <button
                type="button"
                onClick={() => setFormData({...formData, listing_intent: 'sale'})}
                className={`px-2 py-1 rounded text-[11px] font-black transition-all cursor-pointer ${formData.listing_intent === 'sale' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
              >
                SATILIK
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, listing_intent: 'rent'})}
                className={`px-2 py-1 rounded text-[11px] font-black transition-all cursor-pointer ${formData.listing_intent === 'rent' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
              >
                KİRALIK
              </button>
            </div>

            {/* Region Switcher */}
            <div className="hidden sm:flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, country: 'KKTC', currency: formData.currency || 'GBP' })}
                className={`px-2 py-1 rounded text-[11px] font-black transition-all cursor-pointer ${formData.country === 'KKTC' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
              >
                🏝️ KKTC
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, country: 'TR', currency: 'TRY' })}
                className={`px-2 py-1 rounded text-[11px] font-black transition-all cursor-pointer ${formData.country === 'TR' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
              >
                🇹🇷 TR
              </button>
            </div>

            {/* View Mode Toggle: Tabs vs All */}
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'tabs' ? 'all' : 'tabs')}
              title={viewMode === 'tabs' ? 'Tüm alanları tek listede göster' : 'Adım adım sekmeli görünüme geç'}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Sliders className="w-3 h-3" />
              <span className="hidden md:inline">{viewMode === 'tabs' ? 'Tüm Alanlar' : 'Sekmeli Mod'}</span>
            </button>

            {/* Close Button */}
            <button 
              onClick={onClose} 
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* FUTURISTIC SEGMENTED TAB BAR (If tabs mode) */}
        {viewMode === 'tabs' && (
          <div className="bg-slate-50 border-b border-slate-200 px-3 py-1.5 flex items-center gap-1 overflow-x-auto custom-scrollbar shrink-0">
            {TABS.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => { setActiveTab(tab.id); setValidationError(null); }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-black transition-all shrink-0 cursor-pointer ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-xs scale-100' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.id === 'media' && (formData.images?.length || 0) > 0 && (
                    <span className={`text-[10px] px-1 py-0.2 rounded-full font-mono font-black ${isActive ? 'bg-white text-indigo-700' : 'bg-indigo-100 text-indigo-700'}`}>
                      {formData.images?.length}
                    </span>
                  )}
                  {tab.id === 'docs' && (formData.documents?.length || 0) > 0 && (
                    <span className={`text-[10px] px-1 py-0.2 rounded-full font-mono font-black ${isActive ? 'bg-white text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {formData.documents?.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* SCROLLABLE FORM BODY - HIGH-DENSITY, MINIMALIST & FUTURISTIC */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-4 space-y-3.5 bg-slate-50/40 text-xs font-bold">
          
          {/* SECTION 1: TEMEL & FİYAT */}
          {(viewMode === 'all' || activeTab === 'basic') && (
            <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-3.5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-[11px] font-black uppercase text-indigo-950 flex items-center gap-1.5 tracking-wide">
                  <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                  1. Temel İlan Detayları & Fiyatlandırma
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  {formData.listing_intent === 'sale' ? 'Satılık İlan' : 'Kiralık İlan'} • {formData.country}
                </span>
              </div>

              {/* Reference & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Portföy Ref No *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="TR-1002"
                    className="w-full px-2.5 py-1.5 h-8.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-black text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                    value={formData.reference_no || ''}
                    onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-9">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    İlan Başlığı *
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Girne Alsancak Dağ ve Deniz Manzaralı 2+1 Lüks Daire"
                    className="w-full px-2.5 py-1.5 h-8.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
              </div>

              {/* Price, Currency, Type, Subtype, Status in one neat high-density row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2.5 items-end">
                {/* Price & Currency (Integrated Group with binlik ayraç) */}
                <div className="md:col-span-4">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Fiyat ({formData.currency}) *
                  </label>
                  <div className="flex gap-1 items-center">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="850.000"
                      className="flex-1 min-w-[110px] px-2.5 py-1.5 h-8.5 bg-white border border-slate-300 focus:border-indigo-600 rounded-lg text-xs font-black text-slate-900 shadow-2xs outline-none"
                      value={formatPriceDisplay(formData.price)}
                      onChange={(e) => setFormData({ ...formData, price: parsePriceInput(e.target.value) })}
                    />
                    <select
                      className="w-24 px-2 py-1.5 h-8.5 border border-slate-300 rounded-lg text-xs font-black bg-slate-100 text-slate-800 outline-none cursor-pointer hover:bg-slate-200 transition-colors"
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

                {/* Emlak Tipi */}
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Emlak Tipi
                  </label>
                  <select
                    className="w-full px-2.5 py-1.5 h-8.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-slate-50 outline-none focus:bg-white focus:border-indigo-500 cursor-pointer"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any, subtype: ''})}
                  >
                    <option value="residence">🏠 Konut / Residence</option>
                    <option value="commercial">🏬 Ticari / Commercial</option>
                    <option value="land">🌾 Arsa & Arazi / Land</option>
                  </select>
                </div>

                {/* Alt Tip */}
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Alt Tip
                  </label>
                  <select
                    className="w-full px-2.5 py-1.5 h-8.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-slate-50 outline-none focus:bg-white focus:border-indigo-500 cursor-pointer"
                    value={formData.subtype || ''}
                    onChange={(e) => setFormData({...formData, subtype: e.target.value})}
                  >
                    <option value="">Alt tip seçiniz</option>
                    {EMLAK_TIPI_SUB_TIPLERI[formData.type === 'residence' ? 'Konut' : formData.type === 'commercial' ? 'Ticari' : 'Arsa']?.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                {/* İlan Durumu */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    İlan Durumu
                  </label>
                  <select
                    className="w-full px-2 py-1.5 h-8.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-slate-50 outline-none focus:bg-white focus:border-indigo-500 cursor-pointer"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  >
                    {formData.listing_intent === 'sale' ? (
                      <>
                        <option value="active">🟢 Satışta</option>
                        <option value="optioned">🟡 Opsiyonlu</option>
                        <option value="sold">🔴 Satıldı</option>
                      </>
                    ) : (
                      <>
                        <option value="active">🟢 Kiralık</option>
                        <option value="optioned">🟡 Opsiyonlu</option>
                        <option value="rented">🔴 Kiralandı</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* KKTC / TR Bölge ve Koçan Seçimi (Compact) */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-indigo-900 uppercase">
                    🌍 Bölge & Konum Sınıflandırması
                  </span>
                  <span className="text-[10px] font-bold text-indigo-600">
                    {formData.country === 'KKTC' ? 'Kuzey Kıbrıs Pilot Veritabanı' : 'Türkiye Standart'}
                  </span>
                </div>

                {formData.country === 'KKTC' ? (
                  <div className={`grid grid-cols-1 ${formData.listing_intent === 'rent' ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-2.5`}>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">KKTC Bölgesi</label>
                      <select
                        className="w-full px-2 py-1.5 h-8 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                        value={formData.kktc_region}
                        onChange={(e) => setFormData({ ...formData, kktc_region: e.target.value as any, kktc_sub_region: '' })}
                      >
                        {Object.keys(REAL_ESTATE_REGIONS).map((region) => (
                          <option key={region} value={region}>{region}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Alt Bölge</label>
                      <select
                        className="w-full px-2 py-1.5 h-8 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
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
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Koçan Tipi</label>
                        <select
                          className="w-full px-2 py-1.5 h-8 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
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
                ) : (
                  <p className="text-[11px] text-slate-600 font-medium">Türkiye pazarı standart gayrimenkul bölge yönetimi devrede.</p>
                )}
              </div>

              {/* Kiralık Özel Alanları (Depozito & Periyot) */}
              {formData.listing_intent === 'rent' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/80">
                  <div>
                    <label className="block text-[10px] font-black text-rose-700 mb-0.5">Depozito Tutarı (Zorunlu) *</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="2000"
                      className="w-full px-2.5 py-1.5 h-8 bg-white border border-amber-300 rounded-lg text-xs font-bold"
                      value={formData.deposit || ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : Number(e.target.value);
                        setFormData({...formData, deposit: val});
                        if (val > 0) setValidationError(null);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Ödeme Periyodu</label>
                    <select 
                      className="w-full px-2.5 py-1.5 h-8 border border-amber-300 rounded-lg text-xs font-bold bg-white" 
                      value={formData.billing_period || 'monthly'} 
                      onChange={(e) => setFormData({...formData, billing_period: e.target.value as any})}
                    >
                      <option value="monthly">Aylık</option>
                      <option value="3-monthly">3 Aylık</option>
                      <option value="6-monthly">6 Aylık</option>
                      <option value="yearly">Yıllık</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: MÜLK SAHİBİ & ADRES & ŞUBE */}
          {(viewMode === 'all' || activeTab === 'owner') && (
            <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-3.5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-[11px] font-black uppercase text-amber-950 flex items-center gap-1.5 tracking-wide">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  2. Mülk Sahibi, Konum Adresi & Şube Ataması
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">CRM & Portföy Güvenliği</span>
              </div>

              {/* Owner Autocomplete & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/70">
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
                          owner_info: { fullName: '', phone: '' }
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
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    Mülk Sahibi (Telefon)
                  </label>
                  <input 
                    type="tel" 
                    placeholder="+90 533 123 4567"
                    className="w-full px-2.5 py-1.5 h-8.5 bg-white border border-amber-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-amber-500 shadow-2xs" 
                    value={formData.owner_info?.phone || ''}
                    onChange={(e) => setFormData({...formData, owner_info: {...formData.owner_info, phone: e.target.value} as any})}
                    onBlur={(e) => {
                      const normalized = standardizeOwnerPhone(e.target.value);
                      setFormData({...formData, owner_info: {...formData.owner_info, phone: normalized} as any});
                    }}
                  />
                </div>
              </div>

              {/* Address / Land Plot Coordinates */}
              {formData.type !== 'land' ? (
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    Portföy Açık Adres Bilgisi *
                  </label>
                  <input
                    type="text"
                    className="w-full px-2.5 py-1.5 h-8.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                    placeholder="Örn: Girne Merkez, Atatürk Caddesi No: 42 Daire: 5..."
                    value={formData.address || ''}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {[
                    { label: 'Mahalle / Köy *', key: 'mahalle', placeholder: 'Alsancak' },
                    { label: 'Ada *', key: 'ada', placeholder: '142' },
                    { label: 'Parsel *', key: 'parsel', placeholder: '12' },
                    { label: 'Pafta', key: 'pafta', placeholder: 'XI-4' },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">{field.label}</label>
                      <input 
                        type="text" 
                        placeholder={field.placeholder}
                        className="w-full px-2 py-1 h-8 bg-white border border-slate-200 rounded-lg text-xs font-bold" 
                        value={(formData as any)[field.key] || ''}
                        onChange={(e) => setFormData({...formData, [field.key]: e.target.value})}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Branch & Consultant assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Yetkili Şube</label>
                  <select 
                    className="w-full px-2 py-1 h-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
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
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Sorumlu Danışman</label>
                  <select 
                    className="w-full px-2 py-1 h-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
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

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Paylaşım Durumu</label>
                  <select
                    className="w-full px-2 py-1 h-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                    value={formData.sharing_scope || 'shared_pool'}
                    onChange={(e) => setFormData({...formData, sharing_scope: e.target.value as any})}
                  >
                    <option value="shared_pool">🌐 Ortak Havuz (Tüm Şubeler)</option>
                    <option value="branch_private">🔒 Şube İçi Özel</option>
                    <option value="private">🔑 Danışmana Özel</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: METRİKLER & DONANIM */}
          {(viewMode === 'all' || activeTab === 'metrics') && (
            <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-3.5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-[11px] font-black uppercase text-sky-950 flex items-center gap-1.5 tracking-wide">
                  <Layers className="w-3.5 h-3.5 text-sky-600" />
                  3. Teknik Metrikler, Alanlar & Donanım Özellikleri
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  {formData.type === 'land' ? 'Arsa & İmar' : formData.type === 'commercial' ? 'Ticari & Kapasite' : 'Konut & Donanım'}
                </span>
              </div>

              {/* LAND (ARSA) FIELDS */}
              {formData.type === 'land' ? (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Arsa Alanı (m²)</label>
                      <input
                        type="number"
                        placeholder="500"
                        className="w-full px-2 py-1 h-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                        value={formData.square_meters || ''}
                        onChange={(e) => setFormData({...formData, square_meters: Number(e.target.value)})}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">İmar Durumu</label>
                      <select
                        className="w-full px-2 py-1 h-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                        value={(formData as any).imar_durumu || ''}
                        onChange={(e) => setFormData({...formData, imar_durumu: e.target.value} as any)}
                      >
                        <option value="">Seçiniz</option>
                        <option value="Konut İmarlı">Konut İmarlı</option>
                        <option value="Ticari İmarlı">Ticari İmarlı</option>
                        <option value="Konut + Ticari">Konut + Ticari</option>
                        <option value="Tarla / Tarım">Tarla / Tarım</option>
                        <option value="Zeytinlik">Zeytinlik</option>
                        <option value="Sanayi İmarlı">Sanayi İmarlı</option>
                        <option value="Turizm İmarlı">Turizm İmarlı</option>
                        <option value="İmarsız / Ham Arsa">İmarsız / Ham Arsa</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Emsal / Kaks</label>
                      <input
                        type="text"
                        placeholder="0.35 / 0.70"
                        className="w-full px-2 py-1 h-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                        value={(formData as any).kaks || ''}
                        onChange={(e) => setFormData({...formData, kaks: e.target.value} as any)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Gabari / Kat Sınırı</label>
                      <input
                        type="text"
                        placeholder="2 Kat (6.5m)"
                        className="w-full px-2 py-1 h-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                        value={(formData as any).gabari || ''}
                        onChange={(e) => setFormData({...formData, gabari: e.target.value} as any)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={!!(formData as any).elektrik_var} onChange={(e) => setFormData({...formData, elektrik_var: e.target.checked} as any)} className="w-3.5 h-3.5 text-sky-600 rounded" />
                      <span>⚡ Elektrik Altyapısı</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={!!(formData as any).su_var} onChange={(e) => setFormData({...formData, su_var: e.target.checked} as any)} className="w-3.5 h-3.5 text-sky-600 rounded" />
                      <span>💧 Su Altyapısı</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={!!(formData as any).yol_var} onChange={(e) => setFormData({...formData, yol_var: e.target.checked} as any)} className="w-3.5 h-3.5 text-sky-600 rounded" />
                      <span>🛣️ Kadastro Yolu</span>
                    </label>
                  </div>
                </div>
              ) : formData.type === 'commercial' ? (
                /* COMMERCIAL (TİCARİ) FIELDS */
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Devir Durumu</label>
                      <select
                        className="w-full px-2 py-1 h-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                        value={formData.commercial_devir_status || 'empty'}
                        onChange={(e) => setFormData({...formData, commercial_devir_status: e.target.value as any})}
                      >
                        <option value="empty">🔑 Boş / Hazır</option>
                        <option value="devren">🔄 Devren Satılık</option>
                        <option value="tenant">📈 Hazır Kiracılı</option>
                      </select>
                    </div>

                    {formData.commercial_devir_status === 'tenant' ? (
                      <div>
                        <label className="block text-[10px] font-bold text-emerald-800 mb-0.5">Aylık Kira Geliri</label>
                        <input
                          type="text"
                          placeholder="2.500"
                          className="w-full px-2 py-1 h-8 bg-slate-50 border border-emerald-300 rounded-lg text-xs font-bold"
                          value={formatPriceDisplay(formData.monthly_rent_income)}
                          onChange={(e) => setFormData({...formData, monthly_rent_income: parsePriceInput(e.target.value)})}
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Cephe / Vitrin (m)</label>
                        <input
                          type="number"
                          placeholder="12"
                          className="w-full px-2 py-1 h-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                          value={formData.frontage_width || ''}
                          onChange={(e) => setFormData({...formData, frontage_width: Number(e.target.value)})}
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Tavan Yüksekliği (m)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="4.5"
                        className="w-full px-2 py-1 h-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                        value={formData.ceiling_height || ''}
                        onChange={(e) => setFormData({...formData, ceiling_height: Number(e.target.value)})}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Net / Brüt Alan (m²)</label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          placeholder="Net"
                          className="w-1/2 px-1.5 py-1 h-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                          value={formData.square_meters || ''}
                          onChange={(e) => setFormData({...formData, square_meters: Number(e.target.value)})}
                        />
                        <input
                          type="number"
                          placeholder="Brüt"
                          className="w-1/2 px-1.5 py-1 h-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                          value={formData.sqm_gross || ''}
                          onChange={(e) => setFormData({...formData, sqm_gross: Number(e.target.value)})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Commercial Facility Toggles */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={!!formData.is_main_road_frontage} onChange={(e) => setFormData({...formData, is_main_road_frontage: e.target.checked})} className="w-3.5 h-3.5 text-indigo-600 rounded" />
                      <span>🛣️ Cadde Üzeri</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={!!formData.has_chimney} onChange={(e) => setFormData({...formData, has_chimney: e.target.checked})} className="w-3.5 h-3.5 text-indigo-600 rounded" />
                      <span>🌬️ Sanayi Bacası</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={!!formData.has_industrial_electricity} onChange={(e) => setFormData({...formData, has_industrial_electricity: e.target.checked})} className="w-3.5 h-3.5 text-indigo-600 rounded" />
                      <span>⚡ Sanayi Elektriği</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={!!formData.has_parking} onChange={(e) => setFormData({...formData, has_parking: e.target.checked})} className="w-3.5 h-3.5 text-indigo-600 rounded" />
                      <span>🅿️ Otopark</span>
                    </label>
                  </div>
                </div>
              ) : (
                /* RESIDENCE (KONUT) FIELDS */
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Net Alan (m²)</label>
                      <input
                        type="number"
                        placeholder="120"
                        className="w-full px-2 py-1 h-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                        value={formData.square_meters || ''}
                        onChange={(e) => setFormData({...formData, square_meters: Number(e.target.value)})}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Brüt Alan (m²)</label>
                      <input
                        type="number"
                        placeholder="140"
                        className="w-full px-2 py-1 h-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                        value={formData.sqm_gross || ''}
                        onChange={(e) => setFormData({...formData, sqm_gross: Number(e.target.value)})}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Oda Sayısı</label>
                      <input
                        type="text"
                        placeholder="2+1, 3+1"
                        className="w-full px-2 py-1 h-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                        value={formData.room_count || ''}
                        onChange={(e) => setFormData({...formData, room_count: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Bina Yaşı</label>
                      <input
                        type="text"
                        placeholder="0 (Sıfır)"
                        className="w-full px-2 py-1 h-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                        value={formData.building_age || ''}
                        onChange={(e) => setFormData({...formData, building_age: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Kat / Kat Sayısı</label>
                      <input
                        type="text"
                        placeholder="3. Kat"
                        className="w-full px-2 py-1 h-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                        value={formData.floor || ''}
                        onChange={(e) => setFormData({...formData, floor: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Isıtma</label>
                      <select
                        className="w-full px-1.5 py-1 h-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
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

                  {/* Residence Toggles (Trafo, KDV, Çatı Terası, Site İçi) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={!!formData.trafo_bedeli} onChange={(e) => setFormData({...formData, trafo_bedeli: e.target.checked})} className="w-3.5 h-3.5 text-indigo-600 rounded" />
                      <span>⚡ Trafo Bedeli Ödendi</span>
                    </label>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-500">KDV:</span>
                      <select className="px-1.5 py-0.5 border border-slate-200 rounded text-xs font-bold bg-white" value={formData.kdv_status} onChange={(e) => setFormData({...formData, kdv_status: e.target.value as any})}>
                        <option value="to_be_paid">Ödenecek</option>
                        <option value="paid">Ödendi</option>
                      </select>
                    </div>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={!!formData.cati_terasi} onChange={(e) => setFormData({...formData, cati_terasi: e.target.checked})} className="w-3.5 h-3.5 text-indigo-600 rounded" />
                      <span>🌅 Çatı Terası</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={!!formData.in_gated_community} onChange={(e) => setFormData({...formData, in_gated_community: e.target.checked})} className="w-3.5 h-3.5 text-indigo-600 rounded" />
                      <span>🏡 Site İçi</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 4: FOTOĞRAFLAR & MEDYA */}
          {(viewMode === 'all' || activeTab === 'media') && (
            <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-3.5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-[11px] font-black uppercase text-indigo-950 flex items-center gap-1.5 tracking-wide">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                  4. Portföy Fotoğrafları & Medya Galerisi
                </span>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {formData.images?.length || 0} Görsel Yüklü
                </span>
              </div>

              {/* Uploader & Gallery */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-600">Görselleri Sırala veya Yeni Ekle</span>
                  <MultiImageUploader onImagesUploaded={(urls) => setFormData({...formData, images: [...(formData.images || []), ...urls]})} />
                </div>
                
                <ImageGallery 
                  images={formData.images || []} 
                  onChange={(images) => setFormData({...formData, images})} 
                  isEditable={true}
                />
              </div>

              {/* Virtual Tour URL */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <div className="sm:col-span-8">
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">360° Sanal Tur / Video Linki</label>
                  <input
                    type="url"
                    placeholder="https://my.matterport.com/show/?m=... veya YouTube linki"
                    className="w-full px-2.5 py-1.5 h-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-500"
                    value={formData.virtual_tour_url || ''}
                    onChange={(e) => setFormData({...formData, virtual_tour_url: e.target.value})}
                  />
                </div>
                <div className="sm:col-span-4 flex items-center pt-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input 
                      type="checkbox" 
                      checked={!!formData.ai_tour_enabled} 
                      onChange={(e) => setFormData({...formData, ai_tour_enabled: e.target.checked})} 
                      className="w-4 h-4 text-indigo-600 rounded" 
                    />
                    <span>✨ AI Sanal Asistan Aktif</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: AÇIKLAMA */}
          {(viewMode === 'all' || activeTab === 'description') && (
            <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-3.5 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-[11px] font-black uppercase text-slate-900 flex items-center gap-1.5 tracking-wide">
                  <AlignLeft className="w-3.5 h-3.5 text-indigo-600" />
                  5. Detaylı İlan Metni & Yatırım Açıklamaları
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">UK & TR Yatırımcı Odaklı</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <LiteRichEditor
                  value={formData.description || ''}
                  onChange={(newContent) => setFormData(prev => ({...prev, description: newContent}))}
                  placeholder="Gayrimenkulün yatırım potansiyeli, konumu, kira çarpanı ve avantajlarını buraya yazın..."
                  minHeight="180px"
                />
              </div>
            </div>
          )}

          {/* SECTION 6: DOKÜMAN YÖNETİMİ & YAYIN SEÇENEKLERİ */}
          {(viewMode === 'all' || activeTab === 'docs') && (
            <div className="space-y-3.5">
              {/* Document Management Box */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-3.5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 flex-wrap gap-2">
                  <span className="text-[11px] font-black uppercase text-amber-950 flex items-center gap-1.5 tracking-wide">
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    6. Güvenli Resmi Evrak Yönetimi (Tapu, DASK, Sözleşme)
                  </span>
                  
                  {/* Verified Badge Checkbox */}
                  <label className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500"
                      checked={formData.is_verified || false}
                      onChange={(e) => setFormData({...formData, is_verified: e.target.checked})}
                    />
                    <span className="text-xs font-black text-amber-900">⭐ Doğrulanmış Portföy Rozeti</span>
                  </label>
                </div>

                {isOfficeManager ? (
                  <div className="space-y-2.5">
                    {/* Documents List */}
                    <div className="space-y-1.5">
                      {(!formData.documents || formData.documents.length === 0) ? (
                        <div className="text-center py-3 border border-dashed border-slate-200 rounded-lg bg-slate-50 text-slate-400 text-xs">
                          Henüz eklenmiş resmi evrak yok.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {formData.documents.map((doc) => (
                            <div key={doc.id} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                              <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span className="font-bold text-slate-800 truncate flex-1">{doc.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{doc.size}</span>
                              <button type="button" onClick={() => handleRemoveDocument(doc.id)} className="text-rose-500 p-1 hover:bg-rose-50 rounded cursor-pointer">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quick Add Doc Input */}
                    <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Belge Türü</label>
                          <select
                            className="w-full px-2 py-1 h-8 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-white"
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
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Evrak Adı (Opsiyonel)</label>
                          <input
                            type="text"
                            placeholder="Örn: Blok A-3 Tapu Örneği"
                            className="w-full px-2 py-1 h-8 border border-slate-200 rounded-lg text-xs font-bold bg-white"
                            value={docName}
                            onChange={(e) => setDocName(e.target.value)}
                          />
                        </div>
                      </div>

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
                            if (!docName) setDocName(file.name.split('.')[0] || "Belge Fotoğrafı");
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
                              if (!docName) setDocName(file.name.split('.')[0]);
                            }
                          }}
                          className="hidden"
                        />

                        <label htmlFor="document-secure-file" className="w-full sm:flex-1 px-3 py-1.5 border border-dashed border-slate-300 hover:border-indigo-500 rounded-lg bg-white text-xs font-bold text-slate-600 flex items-center justify-center gap-2 cursor-pointer transition-all">
                          <Upload className="w-3.5 h-3.5 text-indigo-600" />
                          {selectedDocFile ? selectedDocFile.name : 'Dosya Seç (PDF, Resim)'}
                        </label>

                        <button
                          type="button"
                          onClick={() => docCameraInputRef.current?.click()}
                          className="w-full sm:w-auto px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          Kamera
                        </button>

                        <button
                          type="button"
                          onClick={handleAddDocument}
                          disabled={!selectedDocFile && !docName}
                          className="w-full sm:w-auto px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-black hover:bg-indigo-700 shadow-2xs disabled:opacity-40 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          Evrakı Ekle
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Güvenli evrak yönetimi sadece ofis yöneticisi yetkisindedir.</p>
                )}
              </div>

              {/* Publication and Marketing Toggles */}
              <div className="bg-slate-900 text-white p-3 sm:p-3.5 rounded-xl space-y-2.5 shadow-md">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 block">
                  ⚙️ İlan Yayın & Pazarlama Seçenekleri
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10 hover:bg-white/15 transition-all">
                    <input 
                      type="checkbox" 
                      checked={!!formData.is_trade_in_available}
                      onChange={(e) => setFormData({...formData, is_trade_in_available: e.target.checked})}
                      className="w-3.5 h-3.5 text-indigo-500 rounded border-slate-400"
                    />
                    <span className="text-xs font-bold text-white">Takas Kabul</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10 hover:bg-white/15 transition-all">
                    <input 
                      type="checkbox" 
                      checked={!!formData.is_on_enrakipsiz}
                      onChange={(e) => setFormData({...formData, is_on_enrakipsiz: e.target.checked})}
                      className="w-3.5 h-3.5 text-indigo-500 rounded border-slate-400"
                    />
                    <span className="text-xs font-bold text-white">EnRakipsiz.com</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10 hover:bg-white/15 transition-all">
                    <input 
                      type="checkbox" 
                      checked={!!formData.auto_post_instagram}
                      onChange={(e) => setFormData({...formData, auto_post_instagram: e.target.checked})}
                      className="w-3.5 h-3.5 text-indigo-500 rounded border-slate-400"
                    />
                    <span className="text-xs font-bold text-white">Instagram Otomatik</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-rose-500/20 px-2.5 py-1.5 rounded-lg border border-rose-500/30 hover:bg-rose-500/30 transition-all">
                    <input
                      type="checkbox"
                      checked={Boolean((formData as any).is_discounted)}
                      onChange={(e) => setFormData({ ...formData, is_discounted: e.target.checked } as any)}
                      className="w-3.5 h-3.5 text-rose-500 rounded border-slate-400"
                    />
                    <span className="text-xs font-bold text-rose-200">🔥 Fırsat & Kelepir</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-amber-500/20 px-2.5 py-1.5 rounded-lg border border-amber-500/30 hover:bg-amber-500/30 transition-all sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={Boolean((formData as any).is_featured)}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked } as any)}
                      className="w-3.5 h-3.5 text-amber-500 rounded border-slate-400"
                    />
                    <span className="text-xs font-bold text-amber-200">⭐ Öne Çıkan / VIP Portföy</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FIXED BOTTOM ACTION BAR */}
        <div className="p-3 sm:px-4 sm:py-2.5 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          {/* Left: Validation message or step info */}
          <div className="min-w-0 flex-1">
            {validationError ? (
              <div className="text-rose-600 text-xs font-black flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse shrink-0" />
                <span className="truncate">{validationError}</span>
              </div>
            ) : viewMode === 'tabs' ? (
              <div className="text-[11px] font-bold text-slate-500 hidden sm:flex items-center gap-2">
                <span>Adım {currentTabIndex + 1} / {TABS.length}:</span>
                <span className="text-indigo-600 font-black">{TABS[currentTabIndex]?.short}</span>
              </div>
            ) : null}
          </div>

          {/* Right: Step navigation & Save */}
          <div className="flex items-center gap-2 shrink-0">
            {viewMode === 'tabs' && currentTabIndex > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab(TABS[currentTabIndex - 1].id)}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Geri</span>
              </button>
            )}

            {viewMode === 'tabs' && currentTabIndex < TABS.length - 1 && (
              <button
                type="button"
                onClick={() => setActiveTab(TABS[currentTabIndex + 1].id)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer"
              >
                <span>İleri</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={onClose}
              type="button"
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              Kapat
            </button>

            <button
              onClick={handleSave}
              type="button"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>{property ? 'Değişiklikleri Kaydet' : 'Portföye Ekle'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
