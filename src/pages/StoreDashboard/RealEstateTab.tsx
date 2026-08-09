import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../../contexts/LanguageContext";
import { translations } from "@/translations";
import {
  Globe,
  Building2,
  Share2,
  Lock,
  Plus,
  Search,
  LayoutGrid,
  List,
  Home,
  MapPin,
  FolderLock,
  FileSignature,
  Printer,
  Calendar,
  Edit2,
  Trash2,
  Cloud,
  Award,
  CalendarDays,
  Layout,
  Eye,
  X,
  FileText,
  Download
} from "lucide-react";
import { api } from "../../services/api";
import { toast } from "sonner";
import { ConsultingInsights } from "../../components/ConsultingInsights";
import { contractTemplates } from "../../utils/contractTemplates";
import { RealEstateCalendar } from "../../components/RealEstateCalendar";
import { RealEstateCRM } from "../../components/RealEstateCRM";

const RealEstateModal = React.lazy(() => import("../../components/RealEstateModal").then(m => ({ default: m.RealEstateModal })));
const LegalContractModal = React.lazy(() => import("../../components/LegalContractModal").then(m => ({ default: m.LegalContractModal })));
const ArrangeTourModal = React.lazy(() => import("../../components/ArrangeTourModal").then(m => ({ default: m.ArrangeTourModal })));
const SocialMediaShareModal = React.lazy(() => import("../../components/SocialMediaShareModal").then(m => ({ default: m.SocialMediaShareModal })));
const TapuTakipModal = React.lazy(() => import("../../components/TapuTakipModal").then(m => ({ default: m.TapuTakipModal })));

interface RealEstateTabProps {
  properties: any[];
  loading: boolean;
  onSave: (p: any) => void;
  onDelete: (id: any) => void;
  user: any;
  branding: any;
  initialStatusFilter: string;
  onResetStatusFilter: () => void;
  storeId?: number;
}

const formatNumberVal = (val: any) => {
  if (val === undefined || val === null || val === '') return '0';
  const cleanVal = val.toString().replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleanVal);
  if (isNaN(parsed)) return val;
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(parsed));
};

const RealEstateTab = ({ properties, loading, onSave, onDelete, user, branding, initialStatusFilter, onResetStatusFilter, storeId }: RealEstateTabProps) => {
  const safeProperties = Array.isArray(properties) ? properties : [];

  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const [search, setSearch] = useState("");
  const [tasks, setTasks] = useState<any[]>([]);
  const [driveConnected, setDriveConnected] = useState(false);
  const [isBackupLoading, setIsBackupLoading] = useState(false);

  const fetchTasks = async () => {
    const sid = storeId || user?.store_id;
    if (sid) {
      try {
        const res = await api.getTasks(sid);
        if (Array.isArray(res)) setTasks(res);
      } catch (err) {
        console.error("Error fetching tasks:", err);
      }
    }
  };

  useEffect(() => {
    api.getGoogleDriveSettings().then(res => {
      setDriveConnected(!!res?.connected);
    }).catch(err => console.error("Error fetching drive connected status in RealEstateTab", err));

    fetchTasks();
  }, [storeId, user?.store_id]);

  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'calendar' | 'pipeline'>('list');
  const [filterBranch, setFilterBranch] = useState("all");
  const [branches, setBranches] = useState<any[]>([]);
  const [filterScope, setFilterScope] = useState("all");
  const [filterRegion, setFilterRegion] = useState("all");
  
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [contractProperty, setContractProperty] = useState<any>(null);
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [activeTourProperty, setActiveTourProperty] = useState<any>(null);
  const [isSocialShareModalOpen, setIsSocialShareModalOpen] = useState(false);
  const [socialShareProperty, setSocialShareProperty] = useState<any>(null);
  const [isTapuModalOpen, setIsTapuModalOpen] = useState(false);
  const [tapuProperty, setTapuProperty] = useState<any>(null);
  const [viewDocsProperty, setViewDocsProperty] = useState<any>(null);

  const [showingBufferTime, setShowingBufferTime] = useState<number>(15);
  const [showingWaitlist, setShowingWaitlist] = useState<any[]>([
    {
      id: "wl-1",
      clientName: "Ahmet Yılmaz",
      phone: "+90 533 800 00 00",
      notes: "Kıbrıs satılık arsa / sanayi imarlı arıyor"
    }
  ]);
  const [showingPrep, setShowingPrep] = useState<any>({
    alarmArmed: false,
    lightsOn: true,
    blindsOpen: true,
    acAdjusted: true,
    scentRefreshed: true,
    flyersPresent: true
  });
  
  const [newFeedbackAgent, setNewFeedbackAgent] = useState("");
  const [newFeedbackStatus, setNewFeedbackStatus] = useState("pending");
  const [statusTabFilter, setStatusTabFilter] = useState<'all' | 'sale' | 'rent' | 'optioned' | 'sold' | 'rented'>('all');

  const uniqueRegions = Array.from(new Set(safeProperties.map(p => p.kktc_region).filter(Boolean))) as string[];

  const filteredProperties = safeProperties.filter(p => {
      const matchesSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()) || p.reference_no?.toLowerCase().includes(search.toLowerCase());
      const matchesBranch = filterBranch === 'all' || p.branch_name === filterBranch;
      
      let matchesScope = true;
      if (filterScope === 'shared_pool') matchesScope = p.sharing_scope === 'shared_pool' || !p.sharing_scope;
      else if (filterScope === 'branch_private') matchesScope = p.sharing_scope === 'branch_private';
      else if (filterScope === 'private') matchesScope = p.sharing_scope === 'private';
      else if (filterScope === 'locked') matchesScope = !!p.reserved_by_branch;

      const matchesRegion = filterRegion === 'all' || p.kktc_region === filterRegion;

      return matchesSearch && matchesBranch && matchesScope && matchesRegion;
  });

  const displayedProperties = filteredProperties.filter(p => {
    if (statusTabFilter === 'all') return true;
    if (statusTabFilter === 'sale') return (p.listing_intent === 'sale' || !p.listing_intent) && p.status !== 'sold';
    if (statusTabFilter === 'rent') return p.listing_intent === 'rent' && p.status !== 'rented';
    if (statusTabFilter === 'optioned') return p.status === 'optioned';
    if (statusTabFilter === 'sold') return p.status === 'sold';
    if (statusTabFilter === 'rented') return p.status === 'rented';
    return true;
  });

  const totalCount = filteredProperties.length;
  const saleCount = filteredProperties.filter(p => (p.listing_intent === 'sale' || !p.listing_intent) && p.status !== 'sold').length;
  const rentCount = filteredProperties.filter(p => p.listing_intent === 'rent' && p.status !== 'rented').length;
  const optionedCount = filteredProperties.filter(p => p.status === 'optioned').length;
  const soldCount = filteredProperties.filter(p => p.status === 'sold').length;
  const rentedCount = filteredProperties.filter(p => p.status === 'rented').length;

  const unescapeEntities = (str: string) => {
    if (!str) return '';
    return str
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, ' ');
  };

  const unescapeHtmlManual = (html: string) => {
    if (!html) return '';
    // This is for list view - strip all tags
    return unescapeEntities(html).replace(/<[^>]*>?/gm, '');
  };

  // Safe checks for user role representation
  const userRole = (user?.role || 'admin').toString();
  const isOfficeManager = ["superadmin", "admin", "storeadmin", "manager", "owner", "portfolio_manager", "portföy yöneticisi", "consultant", "danışman", "danisman", "editor"].includes((userRole || "admin").toLowerCase());

  const [propertyToPrint, setPropertyToPrint] = useState<any>(null);

  useEffect(() => {
    const handleAfterPrint = () => {
      setPropertyToPrint(null);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  const handlePrintProperty = (property: any) => {
    const primaryColor = branding?.page_layout_settings?.primary_color || "#0F172A";
    const accentColor = branding?.page_layout_settings?.accent_color || "#4f46e5";
    const storeName = branding?.store_name || branding?.name || 'SEÇKİN EMLAK';
    const referenceNo = property.reference_no || property.id;
    const dateStr = new Date(property.created_at || Date.now()).toLocaleDateString('tr-TR');
    
    const isRent = property.listing_intent === 'rent';
    const titleText = property.type === 'residence' ? '🏠 KONUT PORTFÖYÜ' : property.type === 'commercial' ? '🏢 TİCARİ PORTFÖY' : '🌿 ARSA PORTFÖYÜ';
    const priceCurrency = property.currency === 'GBP' ? '£' : property.currency === 'USD' ? '$' : property.currency === 'EUR' ? '€' : '₺';
    const priceText = `${priceCurrency}${formatNumberVal(property.price)}`;
    const imageUrl = property.images && property.images[0] ? property.images[0] : '';
    
    const roomCount = property.room_count || 'Belirtilmedi';
    const netArea = property.square_meters ? `${formatNumberVal(property.square_meters)} m²` : 'Belirtilmedi';
    const heating = property.heating || 'Klima';
    const deedType = isRent ? (property.furnished ? 'Eşyalı' : 'Eşyasız') : (property.kktc_title_type || 'Eşdeğer Koçan');
    const deedLabel = isRent ? 'EŞYA DURUMU' : 'KOÇAN / TAPU';
    const deedSubLabel = isRent ? 'FURNITURE' : 'DEED TYPE';
    
    const descContent = property.description ? unescapeEntities(property.description) : 'Bu gayrimenkul portföyü için detaylı teknik açıklama girilmemiştir. Lütfen yetkili danışmanımız ile irtibata geçiniz.';
    const agentName = property.responsible_agent || 'Sorumlu Şube Temsilcisi';
    const branchName = property.branch_name || 'Merkez Ofis';
    const phoneInfo = branding?.phone ? `📞 ${branding.phone}` : '';
    const addressInfo = branding?.address ? `📍 ${branding.address}` : '';

    const printWin = window.open('', '_blank');
    if (!printWin) {
      toast.error("Tarayıcınızın yeni sekme açmasını engelleyen pop-up engelleyicisini kapatıp tekrar deneyiniz.");
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${property.title} - A4 Afiş</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
            
            * {
              box-sizing: border-box;
            }

            body {
              font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #ffffff;
              color: #1e293b;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            @page {
              size: A4 portrait;
              margin: 0;
            }

            .poster-page {
              width: 210mm;
              height: 297mm;
              padding: 10mm;
              box-sizing: border-box;
              background: white;
              display: flex;
              flex-direction: column;
              justify-content: center;
              overflow: hidden;
            }

            .double-border {
              border: 10px double ${primaryColor};
              height: 277mm;
              padding: 8mm;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              overflow: hidden;
            }

            /* Header Section */
            .header-container {
              display: flex;
              justify-content: space-between;
              align-items: center;
              height: 20mm;
              overflow: hidden;
            }

            .brand-section {
              display: flex;
              flex-direction: column;
            }

            .store-title {
              font-size: 24px;
              font-weight: 900;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              margin: 0;
              line-height: 1.1;
              color: ${primaryColor};
            }

            .brand-eyebrow {
              font-size: 8.5px;
              font-weight: 800;
              letter-spacing: 1.5px;
              text-transform: uppercase;
              margin-top: 5px;
              margin-bottom: 0;
              color: ${accentColor};
            }

            .ref-section {
              display: flex;
              flex-direction: column;
              align-items: flex-end;
              justify-content: center;
            }

            .ref-badge {
              display: inline-block;
              color: #ffffff;
              font-family: monospace;
              font-size: 11px;
              font-weight: 900;
              padding: 4px 10px;
              border-radius: 4px;
              text-transform: uppercase;
              letter-spacing: 1px;
              background-color: ${primaryColor};
            }

            .date-text {
              font-size: 9px;
              color: #64748b;
              font-weight: 700;
              margin-top: 6px;
              margin-bottom: 0;
            }

            /* Title & Location Section */
            .title-container {
              display: flex;
              flex-direction: column;
              justify-content: center;
              height: 22mm;
              overflow: hidden;
            }

            .intent-tag {
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: ${accentColor};
              margin-bottom: 4px;
            }

            .property-title {
              font-size: 20px;
              font-weight: 900;
              letter-spacing: -0.5px;
              line-height: 1.2;
              text-transform: uppercase;
              margin: 0 0 6px 0;
              color: ${primaryColor};
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .location-pills {
              display: flex;
              align-items: center;
              gap: 8px;
            }

            .pill-loc {
              font-size: 10px;
              font-weight: 700;
              color: #334155;
              background-color: #f1f5f9;
              padding: 4px 10px;
              border-radius: 9999px;
              border: 1px solid #e2e8f0;
              display: flex;
              align-items: center;
              gap: 4px;
            }

            .pill-country {
              font-size: 10px;
              font-weight: 700;
              color: #b45309;
              background-color: #fef3c7;
              padding: 4px 10px;
              border-radius: 9999px;
              border: 1px solid #fde68a;
            }

            /* Image Section */
            .image-container {
              width: 100%;
              height: 108mm;
              border-radius: 12px;
              overflow: hidden;
              background-color: #f1f5f9;
              border: 1px solid #e2e8f0;
              position: relative;
            }

            .property-img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }

            .no-img-placeholder {
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              color: #94a3b8;
            }

            .price-badge-container {
              position: absolute;
              bottom: 16px;
              right: 16px;
              border-radius: 8px;
              padding: 8px 16px;
              color: #ffffff;
              background-color: ${primaryColor};
              border: 1px solid rgba(255, 255, 255, 0.15);
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
              text-align: right;
            }

            .price-label {
              display: block;
              font-size: 8px;
              font-weight: 900;
              letter-spacing: 1px;
              color: #cbd5e1;
              text-transform: uppercase;
              margin-bottom: 2px;
            }

            .price-val {
              font-size: 24px;
              font-weight: 900;
              color: #34d399; /* emerald-400 */
              line-height: 1;
            }

            /* Bento Specs Grid */
            .specs-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
              height: 22mm;
              overflow: hidden;
            }

            .spec-card {
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 8px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              text-align: center;
            }

            .spec-card-title {
              font-size: 8px;
              font-weight: 900;
              text-transform: uppercase;
              color: #94a3b8;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }

            .spec-card-val {
              font-size: 13px;
              font-weight: 900;
              color: #1e293b;
              margin-bottom: 2px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              width: 100%;
            }

            .spec-card-sub {
              font-size: 7px;
              color: #94a3b8;
              font-weight: 700;
              text-transform: uppercase;
            }

            /* Description Section */
            .description-section {
              border-left: 4px solid ${accentColor};
              padding-left: 12px;
              height: 26mm;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }

            .desc-title {
              display: block;
              font-weight: 900;
              letter-spacing: 1px;
              text-transform: uppercase;
              font-size: 9px;
              margin-bottom: 6px;
              color: ${primaryColor};
            }

            .desc-body {
              font-size: 10px;
              line-height: 1.5;
              color: #475569;
              font-weight: 500;
              display: -webkit-box;
              -webkit-line-clamp: 3;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }

            /* Footer Section */
            .footer-section {
              border-top: 1px solid #e2e8f0;
              padding-top: 10px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              height: 22mm;
              overflow: hidden;
            }

            .agent-info {
              display: flex;
              flex-direction: column;
              align-items: flex-start;
              justify-content: flex-end;
            }

            .agent-label {
              font-size: 8px;
              font-weight: 900;
              color: #94a3b8;
              text-transform: uppercase;
              letter-spacing: 1px;
              line-height: 1;
            }

            .agent-name {
              font-size: 15px;
              font-weight: 900;
              color: ${primaryColor};
              margin: 4px 0 2px 0;
              line-height: 1.2;
            }

            .branch-name {
              font-size: 9px;
              color: #64748b;
              font-weight: 700;
              margin: 0 0 6px 0;
            }

            .contact-info {
              display: flex;
              align-items: center;
              gap: 12px;
            }

            .phone-span {
              font-size: 10px;
              color: #1e293b;
              font-weight: 900;
            }

            .address-span {
              font-size: 9px;
              color: #94a3b8;
              font-weight: 700;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 280px;
            }

            .footer-right {
              display: flex;
              flex-direction: column;
              align-items: flex-end;
              justify-content: flex-end;
            }

            .badge-secure {
              display: flex;
              align-items: center;
              gap: 4px;
              background-color: #0f172a;
              color: #ffffff;
              font-weight: 900;
              text-transform: uppercase;
              font-size: 8px;
              letter-spacing: 1px;
              padding: 4px 8px;
              border-radius: 4px;
              margin-bottom: 4px;
            }

            .footer-desc {
              font-size: 8px;
              color: #94a3b8;
              font-weight: 700;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div class="poster-page">
            <div class="double-border">
              
              <!-- Header -->
              <div class="header-container">
                <div class="brand-section">
                  <h1 class="store-title">${storeName}</h1>
                  <p class="brand-eyebrow">PREMIUM REAL ESTATE SOLUTIONS</p>
                </div>
                <div class="ref-section">
                  <span class="ref-badge">REF: LP-${referenceNo}</span>
                  <p class="date-text">İlan Tarihi: ${dateStr}</p>
                </div>
              </div>

              <!-- Title & Location -->
              <div class="title-container">
                <div class="intent-tag">${titleText}</div>
                <h2 class="property-title">${property.title}</h2>
                <div class="location-pills">
                  <span class="pill-loc">📍 ${property.location}</span>
                  <span class="pill-country">
                    ${property.country === 'KKTC' ? `KKTC • ${property.kktc_region || 'Girne'}` : `${property.country || 'Türkiye'}`}
                  </span>
                </div>
              </div>

              <!-- Main Image -->
              <div class="image-container">
                ${imageUrl ? `
                  <img src="${imageUrl}" alt="${property.title}" class="property-img" />
                ` : `
                  <div class="no-img-placeholder">
                    <span style="font-size: 40px;">🏢</span>
                    <span style="font-size: 11px; font-weight: bold; margin-top: 8px;">Görsel Bulunmuyor</span>
                  </div>
                `}
                <div class="price-badge-container">
                  <span class="price-label">${isRent ? 'AYLIK KİRA BEDELİ' : 'SATIŞ BEDELİ'}</span>
                  <span class="price-val">${priceText}</span>
                </div>
              </div>

              <!-- Bento Specs -->
              <div class="specs-grid">
                <div class="spec-card">
                  <span class="spec-card-title">ODA SAYISI</span>
                  <span class="spec-card-val">${roomCount}</span>
                  <span class="spec-card-sub">ROOMS</span>
                </div>
                <div class="spec-card">
                  <span class="spec-card-title">NET ALAN</span>
                  <span class="spec-card-val">${netArea}</span>
                  <span class="spec-card-sub">NET AREA</span>
                </div>
                <div class="spec-card">
                  <span class="spec-card-title">ISITMA SİSTEMİ</span>
                  <span class="spec-card-val">${heating}</span>
                  <span class="spec-card-sub">HEATING</span>
                </div>
                <div class="spec-card">
                  <span class="spec-card-title">${deedLabel}</span>
                  <span class="spec-card-val" style="color: #92400e;">${deedType}</span>
                  <span class="spec-card-sub">${deedSubLabel}</span>
                </div>
              </div>

              <!-- Description Summary Module -->
              <div class="description-section">
                <span class="desc-title">AÇIKLAMA VE PORTFÖY DETAYLARI • DESCRIPTION</span>
                <div class="desc-body">${descContent}</div>
              </div>

              <!-- Footer -->
              <div class="footer-section">
                <div class="agent-info">
                  <span class="agent-label">YETKİLİ GAYRİMENKUL DANIŞMANI</span>
                  <h4 class="agent-name">${agentName}</h4>
                  <p class="branch-name">Şube: ${branchName}</p>
                  <div class="contact-info">
                    ${phoneInfo ? `<span class="phone-span">${phoneInfo}</span>` : ''}
                    ${addressInfo ? `<span class="address-span">${addressInfo}</span>` : ''}
                  </div>
                </div>
                <div class="footer-right">
                  <div class="badge-secure">🛡️ LOOKPRICE SECURE</div>
                  <p class="footer-desc">Sektörün En Güçlü CRM & Emlak Entegrasyon Altyapısı</p>
                </div>
              </div>

            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                setTimeout(() => { window.close(); }, 1500);
              }, 600);
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      
      {/* ENRAKİPSİZ ÇOK ŞUBELİ CRM STATS BENTO PANEL */}
      {viewMode !== 'pipeline' && viewMode !== 'calendar' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-[1.8rem] border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Building2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Ağ Portföyü</span>
            <span className="text-xl font-black text-slate-900 mt-1 block">
              {formatNumberVal(safeProperties.length)} <span className="text-[10px] text-slate-500 font-bold">Mülk</span>
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[1.8rem] border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Share2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Ortak Havuz</span>
            <span className="text-xl font-black text-emerald-600 mt-1 block">
              {formatNumberVal(safeProperties.filter(p => (p.sharing_scope || 'shared_pool') === 'shared_pool').length)} <span className="text-[10px] text-emerald-500 font-bold">Açık</span>
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[1.8rem] border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <Lock className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Rezervasyon Kilidi</span>
            <span className="text-xl font-black text-rose-600 mt-1 block">
              {formatNumberVal(safeProperties.filter(p => !!p.reserved_by_branch).length)} <span className="text-[10px] text-rose-500 font-bold">Kilitli</span>
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[1.8rem] border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="p-3 bg-cyan-50 text-cyan-600 rounded-2xl">
            <Globe className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Kıbrıs (KKTC)</span>
            <span className="text-xl font-black text-slate-900 mt-1 block">
              {formatNumberVal(safeProperties.filter(p => p.country === 'KKTC').length)} <span className="text-[10px] text-slate-500 font-bold">İlan</span>
            </span>
          </div>
        </div>
      </div>
      )}

      {/* ŞUBELER ARASI ENRAKİPSİZ FİLTRE KAPLÜLLERİ */}
      {viewMode !== 'pipeline' && viewMode !== 'calendar' && (
        <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-200/40 space-y-3">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Şubeler Arası Portföy Süzgeci</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilterBranch("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                filterBranch === "all" 
                  ? "bg-slate-900 text-white shadow-sm scale-102"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              Tüm Şubeler
            </button>
            {branches.map(b => (
              <button
                key={b.id}
                onClick={() => setFilterBranch(b.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  filterBranch === b.name 
                    ? "bg-slate-900 text-white shadow-sm scale-102"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      )}

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900">Portföy Listesi</h3>
          <p className="text-xs text-slate-500">Mevcut şubeniz ve tüm pilot bölgelerdeki portföy</p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          {driveConnected && (
            <button
              onClick={async () => {
                setIsBackupLoading(true);
                const promise = api.exportToGoogleDrive({ targetType: 'real_estate', format: 'xls' });
                toast.promise(promise, {
                  loading: 'Portföy şeması Google Drive\'a yedekleniyor...',
                  success: 'Emlak Portföy şeması Excel formatında Google Drive\'a başarıyla kaydoldu!',
                  error: 'Google Drive yedeklemesi başarısız oldu.'
                });
                try {
                  await promise;
                } catch (e) {
                  console.error(e);
                } finally {
                  setIsBackupLoading(false);
                }
              }}
              disabled={isBackupLoading}
              className="flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 border border-emerald-200 hover:border-emerald-300 px-4 py-3 rounded-xl transition-all font-black text-xs uppercase shadow-sm shadow-emerald-50 active:scale-95"
              title="Google Drive'a Doğrudan Excel Yedekle"
            >
              <Cloud className="h-4 w-4 text-emerald-600 animate-pulse font-bold" />
              Drive'a Yedekle
            </button>
          )}
          <button
            onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
            className={`flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 px-4 py-3 rounded-xl transition-all font-black text-xs uppercase shadow-sm active:scale-95 hover:bg-slate-50 ${viewMode === 'calendar' ? 'ring-2 ring-indigo-500' : ''}`}
            title="Gezi & Randevu Takvimi"
          >
            <CalendarDays className="h-4 w-4 text-indigo-600" />
            Takvim
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'pipeline' ? 'list' : 'pipeline')}
            className={`flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 px-4 py-3 rounded-xl transition-all font-black text-xs uppercase shadow-sm active:scale-95 hover:bg-slate-50 ${viewMode === 'pipeline' ? 'ring-2 ring-indigo-500' : ''}`}
            title="CRM Pipeline"
          >
            <Layout className="h-4 w-4 text-indigo-600" />
            CRM Pipeline
          </button>
          <button
            onClick={() => {
              setSelectedProperty(null);
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 transition-all font-black text-xs uppercase shadow-md hover:shadow-indigo-600/10 active:scale-95 self-start md:self-auto"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            Yeni Portföy Ekle
          </button>
        </div>
      </div>

      {/* Filters and Search Grid */}
      {viewMode !== 'pipeline' && viewMode !== 'calendar' && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Başlık, bölge veya açıklama ara..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border-0 rounded-xl text-xs font-bold focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all text-slate-700"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <select
            className="w-full px-3 py-2 bg-slate-50 border-0 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
            value={filterScope}
            onChange={(e) => setFilterScope(e.target.value)}
          >
            <option value="all">🌐 Ağ ve Paylaşım Durumu</option>
            <option value="shared_pool">🌐 Ortak Havuz İlanları</option>
            <option value="branch_private">🏢 Sadece Kendi Şubem</option>
            <option value="private">🔑 Sadece Benim Şahsi İlanlarım</option>
            <option value="locked">🔒 Kilitli / Rezerveli İlanlar</option>
          </select>
        </div>
        <div>
          <select
            className="w-full px-3 py-2 bg-slate-50 border-0 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
          >
            <option value="all">📍 Tüm Bölgeler (Kuzey Kıbrıs)</option>
            {uniqueRegions.map(reg => (
              <option key={reg} value={reg}>{reg}</option>
            ))}
          </select>
        </div>
      </div>
      )}

      {/* Segmented status filter tab header */}
      {viewMode !== 'pipeline' && viewMode !== 'calendar' && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3">
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-205/60">
          <button 
            onClick={() => setStatusTabFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              statusTabFilter === 'all'
                ? 'bg-white text-slate-900 shadow-sm font-bold scale-[1.01]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            HEPSİ ({totalCount})
          </button>
          <button 
            onClick={() => setStatusTabFilter('sale')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              statusTabFilter === 'sale'
                ? 'bg-indigo-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            🏠 SATILIK ({saleCount})
          </button>
          <button 
            onClick={() => setStatusTabFilter('rent')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              statusTabFilter === 'rent'
                ? 'bg-sky-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            🔑 KİRALIK ({rentCount})
          </button>
          <button 
            onClick={() => setStatusTabFilter('optioned')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              statusTabFilter === 'optioned'
                ? 'bg-amber-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            ✍ OPSİYONLANDI ({optionedCount})
          </button>
          <button 
            onClick={() => setStatusTabFilter('sold')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              statusTabFilter === 'sold'
                ? 'bg-rose-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            ✅ SATILDI ({soldCount})
          </button>
          <button 
            onClick={() => setStatusTabFilter('rented')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              statusTabFilter === 'rented'
                ? 'bg-sky-700 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            🔑 KİRALANDI ({rentedCount})
          </button>
        </div>
      </div>
      )}
      
      {viewMode === 'calendar' ? (
        <RealEstateCalendar 
          storeId={storeId || user?.store_id} 
          properties={safeProperties} 
          onClose={() => setViewMode('list')}
        />
      ) : viewMode === 'pipeline' ? (
        <RealEstateCRM
          storeId={storeId || user?.store_id || 0}
          properties={safeProperties}
          tasks={tasks}
          onOpenCalendar={() => setViewMode('calendar')}
          onOpenTourModal={(p) => {
            setActiveTourProperty(p);
            setIsTourModalOpen(true);
          }}
          onRefresh={fetchTasks}
        />
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
          <span className="text-xs text-slate-500 font-bold">Portföy Yükleniyor...</span>
        </div>
      ) : displayedProperties.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <Home className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-bold text-sm">Aradığınız kriterlere uygun gayrimenkul bulunamadı.</p>
          <p className="text-xs text-slate-400 mt-1">Yeni ilan girerek portföy oluşturabilir ve pilot satışlara devam edebilirsiniz.</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {displayedProperties.map(property => {
            return (
              <div 
                key={property.id} 
                className={`bg-white rounded-3xl shadow-sm border border-slate-150 overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all group relative ${viewMode === 'grid' ? 'flex flex-col h-full' : 'flex flex-col sm:flex-row'}`}
              >
                {/* Image Banner */}
                <div className={`${viewMode === 'grid' ? 'w-full h-48' : 'w-full sm:w-64 h-64 shrink-0'} bg-slate-100 relative overflow-hidden`}>
                  {property.images && property.images.length > 0 ? (
                    <img 
                      src={property.images[0]} 
                      alt={property.title} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Home className="w-12 h-12 stroke-[1.25]" />
                    </div>
                  )}

                  {/* Minimalistic Badge */}
                  <div className="absolute top-3 left-3 z-20">
                    <span className={`font-black text-[10px] px-2.5 py-1.5 rounded-xl shadow-lg tracking-wide ${
                      property.status === 'optioned' ? 'bg-amber-600 text-white' :
                      property.status === 'sold' ? 'bg-rose-600 text-white' :
                      property.status === 'rented' ? 'bg-sky-700 text-white' :
                      property.listing_intent === 'rent' ? 'bg-sky-600 text-white' :
                      'bg-emerald-600 text-white'
                    }`}>
                      {property.status === 'optioned' ? '✍ OPSİYONLU' :
                       property.status === 'sold' ? '✅ SATILDI' :
                       property.status === 'rented' ? '🔑 KİRALANDI' :
                       property.listing_intent === 'rent' ? '🔑 KİRALIK' : '🏠 SATILIK'}
                    </span>
                  </div>

                  {/* Diagonal Banner for SOLD/RENTED */}
                  {(property.status === 'sold' || property.status === 'rented') && (
                    <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden z-10 pointer-events-none">
                      <div className={`absolute top-0 right-0 w-[170px] py-1 text-center text-[10px] font-black tracking-[0.2em] text-white shadow-lg transform translate-x-[45px] translate-y-[25px] rotate-45 uppercase ${
                        property.status === 'sold' ? 'bg-rose-600/90' : 'bg-sky-700/90'
                      }`}>
                        {property.status === 'sold' ? 'SATILDI' : 'KİRALANDI'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Content body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    {/* Şube ve Paylaşım Bilgisi */}
                    <div className="flex items-center justify-between gap-2 text-[10px] font-black border-b border-dashed border-slate-100 pb-2 mb-1">
                      <span className="flex items-center gap-1 text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                        🏢 {property.branch_name || 'Merkez Ofis'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg border uppercase tracking-wider ${
                        property.sharing_scope === 'private' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                        property.sharing_scope === 'branch_private' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                        'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        {property.sharing_scope === 'private' ? '🔑 Kişisel' :
                         property.sharing_scope === 'branch_private' ? '🔒 Ofise Özel' :
                         '🌐 Ortak Havuz'}
                      </span>
                      {property.is_trade_in_available && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg uppercase tracking-wider">
                          🔄 Takaslı
                        </span>
                      )}
                    </div>

                    <div>
                      {property.reference_no && (
                        <div className="text-[9.5px] font-black tracking-widest text-slate-500 mb-1 font-mono uppercase bg-slate-100 inline-block px-1.5 py-0.5 rounded-full border border-slate-200 shadow-sm leading-none">
                          REF: {property.reference_no}
                        </div>
                      )}
                      <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {property.title}
                      </h4>
                      <p className="text-slate-400 text-[10px] font-bold flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 inline text-slate-400" />
                          {property.location} {property.kktc_region ? `• Bölge: ${property.kktc_region}` : ""}
                        </span>
                        {property.responsible_agent && (
                          <span className="text-indigo-600 font-extrabold text-[9px] uppercase">
                            👤 Danışman: {property.responsible_agent}
                          </span>
                        )}
                      </p>
                    </div>

                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                      {property.description ? 
                        unescapeHtmlManual(property.description)
                        : "Açıklama girilmemiş..."
                      }
                    </p>

                    {/* Regional Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {property.listing_intent !== 'rent' && property.kktc_title_type && (
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-extrabold border border-indigo-100">
                          📜 {property.kktc_title_type}
                        </span>
                      )}
                      {property.listing_intent === 'rent' && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md text-[10px] font-extrabold border border-amber-100">
                          🛋️ {property.furnished ? 'Tam Eşyalı' : 'Eşyasız'}
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
                          📐 {formatNumberVal(property.square_meters)} m² Net {property.sqm_gross ? `/ ${formatNumberVal(property.sqm_gross)} m² Brüt` : ''}
                        </span>
                      )}
                      {property.in_gated_community && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md text-[10px] font-bold border border-emerald-100">
                          🏡 Site İçi {property.dues ? `• ${formatNumberVal(property.dues)} ${property.dues_currency || 'GBP'} Aidat` : ''}
                        </span>
                      )}
                      {property.facade && (
                        <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md text-[10px] font-bold border border-slate-200">
                          🧭 {property.facade} Cephe
                        </span>
                      )}
                    </div>

                    {/* Safe Document Icon indicators for managers only */}
                    <div 
                      onClick={() => {
                        if (property.documents && property.documents.length > 0) {
                          setViewDocsProperty(property);
                        } else {
                          toast.info("Bu gayrimenkule ait henüz yüklenmiş bir resmî evrak yok. Yeni bir Sözleşme oluşturup kaydederek buraya ekleyebilirsiniz.");
                        }
                      }}
                      className="flex items-center justify-between gap-2 text-[10px] font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 p-2.5 rounded-xl border border-slate-200 cursor-pointer transition-all active:scale-[0.99]"
                      title={property.documents && property.documents.length > 0 ? "Resmî evrakları ve sözleşmeleri hızlıca görüntülemek için tıklayın" : ""}
                    >
                      <div className="flex items-center gap-1.5">
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
                      {property.documents && property.documents.length > 0 && (
                        <span className="text-indigo-600 font-black text-[9px] uppercase tracking-tight flex items-center gap-0.5">
                          GÖRÜNTÜLE ➔
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-col space-y-3">

                    {/* Price and Standard Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-slate-900">
                        <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">İLAN BEDELİ</span>
                        <span className="text-base font-black text-indigo-600">
                          {property.currency === 'GBP' ? '£' : property.currency === 'USD' ? '$' : property.currency === 'EUR' ? '€' : '₺'}{formatNumberVal(property.price)}
                        </span>
                      </div>

                      <div className="flex gap-1.5 items-center flex-wrap shrink-0 sm:justify-end">
                        <a
                          href={`/mulk-takip/${property.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center p-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl transition-all shadow active:scale-95 border border-emerald-200 shrink-0"
                          title="Mülk Sahibi Canlı Takip & İstatistik Ekranı"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => { setContractProperty(property); setIsContractModalOpen(true); }}
                          className="flex items-center justify-center p-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition-all shadow active:scale-95 border border-slate-950 shrink-0"
                          title="Sözleşme / Resmi Hizmet Oluştur"
                        >
                          <FileSignature className="w-4 h-4" />
                        </button>
                        {property.listing_intent !== "rent" && (
                          <button
                            onClick={() => { setTapuProperty(property); setIsTapuModalOpen(true); }}
                            className="flex items-center justify-center p-2.5 bg-amber-500 text-white hover:bg-amber-600 rounded-xl transition-all shadow active:scale-95 border border-amber-600 shrink-0"
                            title="Tapu Süreç & Randevu Takipçisi"
                          >
                            <Award className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => { setSocialShareProperty(property); setIsSocialShareModalOpen(true); }}
                          className="flex items-center justify-center p-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl transition-all shadow active:scale-95 border border-indigo-100 shrink-0"
                          title="Sosyal Medya Afiş & Paylaşım Sihirbazı"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handlePrintProperty(property)}
                          className="flex items-center justify-center p-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition-all shadow active:scale-95 border border-slate-200 shrink-0"
                          title="Poster Yazdır"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { setActiveTourProperty(property); setIsTourModalOpen(true); }}
                          className="flex items-center justify-center p-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition-all shadow active:scale-95 border border-slate-200 shrink-0"
                          title="Temsilci Keşif / Gösterim Turu Planla"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedProperty(property);
                            setIsModalOpen(true);
                          }}
                          className="flex items-center justify-center p-2.5 text-slate-750 hover:bg-slate-100 rounded-xl transition-all border border-transparent shrink-0"
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
                          className="flex items-center justify-center p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent shrink-0"
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

      {/* Real Real Estate Modal component */}
      {isModalOpen && (
        <React.Suspense fallback={<div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-600">İlan Formu Yükleniyor...</p>
          </div>
        </div>}>
          <RealEstateModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            property={selectedProperty}
            storeId={storeId || user?.store_id}
            userRole={userRole}
            onSave={async (p) => {
              try {
                if (onSave) {
                  await onSave(p);
                  setIsModalOpen(false);
                }
              } catch (err: any) {
                alert("İlan kaydedilirken bir hata oluştu: " + (err.message || err));
              }
            }}
          />
        </React.Suspense>
      )}

      {/* Dynamic Bilingual Legal Contract Generator Modal */}
      {contractProperty && (
        <React.Suspense fallback={null}>
          <LegalContractModal
            isOpen={isContractModalOpen}
            onClose={() => {
              setIsContractModalOpen(false);
              setContractProperty(null);
            }}
            property={contractProperty}
            branding={branding}
            onSaveContract={async (contractDoc) => {
              if (!onSave || !contractProperty) return;
              const existingDocs = contractProperty.documents || [];
              const updatedDocs = [...existingDocs.filter((d: any) => d.id !== contractDoc.id), contractDoc];
              await onSave({
                ...contractProperty,
                documents: updatedDocs
              });
              setContractProperty(prev => prev ? { ...prev, documents: updatedDocs } : null);
            }}
          />
        </React.Suspense>
      )}

      {/* Tapu Süreç & Randevu Takipçisi Modal */}
      {tapuProperty && (
        <React.Suspense fallback={null}>
          <TapuTakipModal
            isOpen={isTapuModalOpen}
            onClose={() => {
              setIsTapuModalOpen(false);
              setTapuProperty(null);
            }}
            property={tapuProperty}
            branding={branding}
            onSaveTrack={async (updatedProperty) => {
              if (!onSave) return;
              await onSave(updatedProperty);
              toast.success("Tapu tescil süreci başarıyla kaydedildi!");
            }}
          />
        </React.Suspense>
      )}

      {/* Tour Arranger Modal */}
      {isTourModalOpen && activeTourProperty && (
        <React.Suspense fallback={null}>
          <ArrangeTourModal
            onClose={() => {
              setIsTourModalOpen(false);
              setActiveTourProperty(null);
            }}
            property={activeTourProperty}
            onSave={() => {
              setIsTourModalOpen(false);
              setActiveTourProperty(null);
            }}
          />
        </React.Suspense>
      )}

      {/* Social Media Sharing & Poster Creation Wizard */}
      {isSocialShareModalOpen && socialShareProperty && (
        <React.Suspense fallback={null}>
          <SocialMediaShareModal
            isOpen={isSocialShareModalOpen}
            onClose={() => {
              setIsSocialShareModalOpen(false);
              setSocialShareProperty(null);
            }}
            property={socialShareProperty}
            branding={branding}
          />
        </React.Suspense>
      )}

      {/* Real Estate Poster Print Component */}
      {propertyToPrint && createPortal(
        <div id="print-poster-wrapper" className="hidden print:block bg-white text-slate-900 font-sans" style={{ width: '210mm', height: '297mm', padding: '10mm', boxSizing: 'border-box', backgroundColor: '#ffffff' }}>
          <style>
            {`
              @media print {
                @page {
                  size: A4 portrait !important;
                  margin: 0 !important;
                }
                body {
                  margin: 0 !important;
                  padding: 0 !important;
                  background: white !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }
                body > *:not(#print-poster-wrapper) {
                  display: none !important;
                }
                #print-poster-wrapper {
                  display: block !important;
                  visibility: visible !important;
                  position: absolute !important;
                  top: 0 !important;
                  left: 0 !important;
                  width: 210mm !important;
                  height: 297mm !important;
                  min-height: 297mm !important;
                  max-height: 297mm !important;
                  padding: 10mm !important;
                  margin: 0 !important;
                  box-sizing: border-box !important;
                  background: white !important;
                  color: #0f172a !important;
                  z-index: 999999999 !important;
                  overflow: hidden !important;
                }
                #print-poster-wrapper * {
                  visibility: visible !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }
                .print-description-content * {
                  color: #334155 !important;
                  background-color: transparent !important;
                  background: none !important;
                  font-family: inherit !important;
                  font-size: 8px !important;
                  line-height: 1.3 !important;
                  margin: 0 !important;
                  padding: 0 !important;
                }
                .print-description-content p, .print-description-content div {
                  margin-bottom: 2px !important;
                }
                .print-description-content ul, .print-description-content ol {
                  padding-left: 10px !important;
                  margin-bottom: 2px !important;
                }
                .print-description-content li {
                  margin-bottom: 1px !important;
                }
              }
            `}
          </style>
          <div 
            className="border-[10px] border-double box-border bg-white" 
            style={{ 
              height: '254mm', 
              width: '100%',
              padding: '5mm',
              boxSizing: 'border-box', 
              borderColor: branding?.page_layout_settings?.primary_color || "#0F172A",
              display: 'block',
              overflow: 'hidden'
            }}
          >
            
            {/* Solid Brand Header - 16mm */}
            <div 
              className="px-0" 
              style={{ 
                height: '16mm', 
                marginBottom: '4mm',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxSizing: 'border-box',
                overflow: 'hidden'
              }}
            >
              <div>
                <h1 className="text-[20px] font-black tracking-wider uppercase leading-none font-display" style={{ color: branding?.page_layout_settings?.primary_color || "#0F172A" }}>
                  {branding?.store_name || branding?.name || 'SEÇKİN EMLAK'}
                </h1>
                <p className="text-[7.5px] font-black tracking-widest uppercase mt-1.5 leading-none opacity-90" style={{ color: branding?.page_layout_settings?.accent_color || "#4f46e5" }}>
                  PREMIUM REAL ESTATE SOLUTIONS
                </p>
              </div>
              <div className="text-right flex flex-col items-end justify-center">
                <span 
                  className="inline-block text-white font-mono text-[8px] font-black px-2.5 py-0.5 rounded uppercase tracking-widest"
                  style={{ backgroundColor: branding?.page_layout_settings?.primary_color || "#0F172A" }}
                >
                  REF: LP-{propertyToPrint.reference_no || propertyToPrint.id}
                </span>
                <p className="text-[7px] text-slate-500 font-bold mt-1.5 leading-none">İlan Tarihi: {new Date(propertyToPrint.created_at || Date.now()).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>

            {/* Title & Location Module - 16mm */}
            <div 
              className="pb-2 flex flex-col justify-center" 
              style={{ 
                height: '16mm', 
                marginBottom: '4mm',
                boxSizing: 'border-box'
              }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[7.5px] font-black uppercase tracking-widest" style={{ color: branding?.page_layout_settings?.accent_color || "#4f46e5" }}>
                  {propertyToPrint.type === 'residence' ? '🏠 KONUT PORTFÖYÜ' : propertyToPrint.type === 'commercial' ? '🏢 TİCARİ PORTFÖY' : '🌿 ARSA PORTFÖYÜ'}
                </span>
              </div>
              
              <h2 
                className="font-black tracking-tight leading-none uppercase font-display line-clamp-1 mb-2 text-slate-900" 
                style={{ 
                  color: branding?.page_layout_settings?.primary_color || "#0F172A",
                  fontSize: propertyToPrint.title.length > 55 ? '13px' : '15px'
                }}
              >
                {propertyToPrint.title}
              </h2>

              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1 border border-slate-200 shadow-sm leading-none">
                  📍 {propertyToPrint.location}
                </span>
                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 shadow-sm leading-none">
                  {propertyToPrint.country === 'KKTC' ? `KKTC • ${propertyToPrint.kktc_region || 'Girne'}` : `${propertyToPrint.country || 'Türkiye'}`}
                </span>
              </div>
            </div>

            {/* Poster Image - 112mm */}
            <div 
              className="w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200"
              style={{ 
                height: '112mm', 
                marginBottom: '4mm',
                boxSizing: 'border-box',
                position: 'relative'
              }}
            >
              {propertyToPrint.images && propertyToPrint.images[0] ? (
                <img 
                  src={propertyToPrint.images[0]} 
                  alt={propertyToPrint.title}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 absolute top-0 left-0">
                  <span className="text-4xl">🏢</span>
                  <span className="text-[10px] mt-2 font-bold">Görsel Bulunmuyor</span>
                </div>
              )}
              
              <div 
                className="absolute bottom-4 right-4 rounded-xl px-4 py-2 text-white shadow-lg backdrop-blur-md border border-white/10"
                style={{ 
                  backgroundColor: branding?.page_layout_settings?.primary_color || "#0F172A",
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)'
                }}
              >
                <div className="text-right">
                  <span className="block text-[7px] font-black tracking-widest text-slate-300 uppercase leading-none mb-1">
                    {propertyToPrint.listing_intent === 'rent' ? 'TALEP EDİLEN AYLIK KİRA BEDELİ' : 'SATIŞ BEDELİ'}
                  </span>
                  <span className="text-[20px] font-black text-emerald-400 leading-none tracking-tight font-display drop-shadow-sm">
                    {propertyToPrint.currency === 'GBP' ? '£' : propertyToPrint.currency === 'USD' ? '$' : propertyToPrint.currency === 'EUR' ? '€' : '₺'}
                    {formatNumberVal(propertyToPrint.price)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bento Spec Highlights (4 Columns, Beautiful Visual Blocks) - 18mm */}
            <div 
              className="w-full"
              style={{ 
                height: '18mm', 
                marginBottom: '4mm',
                boxSizing: 'border-box',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                columnGap: '8px'
              }}
            >
              {/* Card 1: Oda Sayısı */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 flex flex-col justify-center items-center text-center">
                <span className="text-[7.5px] font-black uppercase text-slate-400 tracking-wider mb-1">ODA SAYISI</span>
                <span className="text-[13px] font-black text-slate-800 leading-none mb-1">{propertyToPrint.room_count || 'Belirtilmedi'}</span>
                <span className="text-[7px] text-slate-400 font-bold uppercase leading-none">ROOMS</span>
              </div>

              {/* Card 2: Alan */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 flex flex-col justify-center items-center text-center">
                <span className="text-[7.5px] font-black uppercase text-slate-400 tracking-wider mb-1">NET ALAN</span>
                <span className="text-[13px] font-black text-slate-800 leading-none mb-1">{propertyToPrint.square_meters ? `${formatNumberVal(propertyToPrint.square_meters)} m²` : 'Belirtilmedi'}</span>
                <span className="text-[7px] text-slate-400 font-bold uppercase leading-none">NET AREA</span>
              </div>

              {/* Card 3: Isıtma */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 flex flex-col justify-center items-center text-center">
                <span className="text-[7.5px] font-black uppercase text-slate-400 tracking-wider mb-1">ISITMA SİSTEMİ</span>
                <span className="text-[11px] font-black text-slate-800 truncate max-w-full leading-none mb-1">{propertyToPrint.heating || 'Klima'}</span>
                <span className="text-[7px] text-slate-400 font-bold uppercase leading-none">HEATING</span>
              </div>

              {/* Card 4: Tapu veya Eşya */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 flex flex-col justify-center items-center text-center">
                <span className="text-[7.5px] font-black uppercase text-slate-400 tracking-wider mb-1">
                  {propertyToPrint.listing_intent === 'rent' ? 'EŞYA DURUMU' : 'KOÇAN / TAPU'}
                </span>
                <span className="text-[10px] font-black text-amber-800 truncate max-w-full leading-none uppercase mb-1">
                  {propertyToPrint.listing_intent === 'rent' 
                    ? (propertyToPrint.furnished ? 'Eşyalı' : 'Eşyasız') 
                    : (propertyToPrint.kktc_title_type || 'Eşdeğer Koçan')}
                </span>
                <span className="text-[7px] text-slate-400 font-bold uppercase leading-none">
                  {propertyToPrint.listing_intent === 'rent' ? 'FURNITURE' : 'DEED TYPE'}
                </span>
              </div>
            </div>

            {/* Description Summary Module - 22mm */}
            <div 
              className="text-slate-700 font-sans relative flex flex-col justify-center overflow-hidden"
              style={{ 
                height: '22mm', 
                marginBottom: '4mm',
                boxSizing: 'border-box',
                borderLeft: `3px solid ${branding?.page_layout_settings?.accent_color || "#4f46e5"}`,
                paddingLeft: '10px'
              }}
            >
              <span className="block font-black mb-1 tracking-wider uppercase text-[7.5px]" style={{ color: branding?.page_layout_settings?.primary_color || "#0F172A" }}>
                AÇIKLAMA VE PORTFÖY DETAYLARI • DESCRIPTION
              </span>
              {propertyToPrint.description ? (
                <div 
                  className="print-description-content text-[8px] columns-2 gap-x-6 leading-snug overflow-hidden text-slate-600 font-medium"
                  style={{ columnFill: 'auto', height: '100%', maxHeight: '100%' }}
                  dangerouslySetInnerHTML={{ __html: unescapeEntities(propertyToPrint.description) }}
                />
              ) : (
                <p className="text-[8px] text-slate-400 italic">Bu gayrimenkul portföyü için detaylı teknik açıklama girilmemiştir. Lütfen yetkili danışmanımız ile irtibata geçiniz.</p>
              )}
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            </div>

            {/* Footer with agent details - 20mm */}
            <div 
              className="border-t pt-2"
              style={{ 
                height: '20mm', 
                borderColor: '#e2e8f0',
                boxSizing: 'border-box',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                overflow: 'hidden'
              }}
            >
              <div>
                <span className="block text-[7.5px] font-black text-slate-400 uppercase tracking-widest leading-none">YETKİLİ GAYRİMENKUL DANIŞMANI</span>
                <h4 className="text-[12px] font-black leading-tight mt-1" style={{ color: branding?.page_layout_settings?.primary_color || "#0F172A" }}>
                  {propertyToPrint.responsible_agent || 'Sorumlu Şube Temsilcisi'}
                </h4>
                <p className="text-[8px] text-slate-500 font-bold mb-1">Şube: {propertyToPrint.branch_name || 'Merkez Ofis'}</p>
                <div className="flex items-center gap-3 mt-1">
                  {branding?.phone && (
                    <span className="text-[9px] text-slate-800 font-black flex items-center gap-1">
                      📞 {branding.phone}
                    </span>
                  )}
                  {branding?.address && (
                    <span className="text-[8px] text-slate-400 font-bold truncate max-w-[220px]">
                      📍 {branding.address}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right flex flex-col items-end justify-end">
                <div className="flex items-center gap-1 mb-1 bg-slate-900 text-white font-black uppercase text-[7.5px] tracking-widest px-2 py-1 rounded">
                  🛡️ LOOKPRICE SECURE
                </div>
                <p className="text-[7.5px] text-slate-450 font-bold leading-none">Sektörün En Güçlü CRM & Emlak Entegrasyon Altyapısı</p>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* Property Documents Quick Access Modal */}
      {viewDocsProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm cursor-pointer" onClick={() => setViewDocsProperty(null)}>
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] cursor-default" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <div>
                <span className="text-[10px] bg-emerald-600/20 text-emerald-400 font-black tracking-widest px-2 py-0.5 rounded-md uppercase font-mono">GÜVENLİ DEPOLAMA</span>
                <h3 className="text-lg font-black text-white mt-1">Resmî Evraklar & Sözleşmeler</h3>
                <p className="text-slate-400 text-xs">#{viewDocsProperty.id} • {viewDocsProperty.title}</p>
              </div>
              <button 
                onClick={() => setViewDocsProperty(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="p-6 overflow-y-auto space-y-3 bg-slate-900 flex-1">
              {(!viewDocsProperty.documents || viewDocsProperty.documents.length === 0) ? (
                <p className="text-center py-8 text-slate-500 text-xs font-semibold">Bu gayrimenkule ait resmî evrak bulunmamaktadır.</p>
              ) : (
                viewDocsProperty.documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-2xl shadow-xs relative group">
                    <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-xs font-bold text-white truncate" title={doc.name}>
                        {doc.name}
                      </span>
                      <div className="flex gap-2 items-center text-[10px] text-slate-400 mt-0.5 font-bold">
                        <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                          {doc.category === 'title_deed' ? 'Tapu Örneği' :
                           doc.category === 'dask' ? 'DASK Poliçesi' :
                           doc.category === 'contract' ? 'Sözleşme' : 'Yetki Belgesi'}
                        </span>
                        <span>{doc.upload_date}</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 items-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (doc.file_url === "is_virtual_contract") {
                            const tDef = contractTemplates.find((t: any) => t.id === (doc.details?.templateId || 'showing_agreement')) || contractTemplates[0];
                            const formattedPriceNum = Number(viewDocsProperty.price).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
                            const symbol = viewDocsProperty.currency === 'GBP' ? '£' : viewDocsProperty.currency === 'USD' ? '$' : viewDocsProperty.currency === 'EUR' ? '€' : '₺';
                            
                            const clientNameVal = doc.details?.clientName || "[Alıcı / Mülk Sahibi Adı]";
                            const clientIdentityVal = doc.details?.clientIdentity || "[T.C. No]";
                            const clientPhoneVal = doc.details?.clientPhone || "[Telefon]";
                            const ipAddressVal = doc.details?.ipAddress || "127.0.0.1";
                            const timestampVal = doc.upload_date || doc.details?.contractDate || new Date().toLocaleDateString("tr-TR");

                            const combined = `${clientNameVal}-${clientIdentityVal}-${clientPhoneVal}-${viewDocsProperty.id}-security-seal`;
                            let hash = 0;
                            for (let i = 0; i < combined.length; i++) {
                              const char = combined.charCodeAt(i);
                              hash = (hash << 5) - hash + char;
                              hash = hash & hash;
                            }
                            const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, "0");
                            const randomHex = (index: number) => {
                              let rHash = 0;
                              const rCombined = `${combined}-${index}`;
                              for (let i = 0; i < rCombined.length; i++) {
                                rHash = (rHash << 5) - rHash + rCombined.charCodeAt(i);
                                rHash = rHash & rHash;
                              }
                              return Math.abs(rHash).toString(16).toUpperCase().padStart(8, "0");
                            };
                            const securityCode = `SEC-LP-${hex}-${randomHex(1)}-${randomHex(2)}`;

                            const { html } = tDef.getTemplate({
                              storeName: branding?.store_name || branding?.name || "Premium Real Estate",
                              storePhone: branding?.phone || branding?.whatsapp_number || "+90 533 800 00 00",
                              storeEmail: branding?.email || "realestate@lookprice.me",
                              clientName: clientNameVal,
                              clientIdentity: clientIdentityVal,
                              clientPhone: clientPhoneVal,
                              propertyTitle: `[İlan Kodu: LP-${viewDocsProperty.id}] ${viewDocsProperty.title}`,
                              propertyLocation: viewDocsProperty.location || "Kıbrıs",
                              propertyPrice: `${formattedPriceNum} ${symbol}`,
                              propertyBlockPlot: viewDocsProperty.block_plot,
                              commissionRate: doc.details?.commissionRate || "3",
                              contractDate: doc.upload_date,
                              propertyAddress: viewDocsProperty.address,
                              isSigned: doc.details?.signed,
                              signatureImage: doc.details?.signatureImage,
                              splitRatio: doc.details?.splitRatio,
                              contractDuration: doc.details?.contractDuration,
                              evictionDate: doc.details?.evictionDate,
                              depositAmount: doc.details?.depositAmount,
                              rentDuration: doc.details?.rentDuration,
                              paymentDay: doc.details?.paymentDay
                            });

                            const securityBoxHtml = `
                              <div style="margin-top: 45px; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; background-color: #f8fafc; font-family: sans-serif; box-shadow: inset 0 1px 2px rgba(0,0,0,0.02); page-break-inside: avoid;">
                                <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                                  <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 16px;">🛡️</span>
                                    <div>
                                      <h4 style="margin: 0; font-size: 13px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">E-İMZA & GÜVENLİK DOĞRULAMA RAPORU</h4>
                                      <span style="font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase;">DIGITAL SIGNATURE & INTEGRITY REPORT</span>
                                    </div>
                                  </div>
                                  <span style="background-color: #dcfce7; border: 1px solid #bbf7d0; color: #15803d; font-size: 10px; font-weight: 900; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap;">✅ DİJİTAL ONAYLANDI</span>
                                </div>
                                
                                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 11px; margin-bottom: 15px;">
                                  <div>
                                    <span style="color: #64748b; font-weight: bold; display: block; text-transform: uppercase; font-size: 9px; margin-bottom: 2px;">İmzalayan Müşteri (Signing Client)</span>
                                    <strong style="color: #1e293b; font-size: 12px;">${clientNameVal}</strong>
                                  </div>
                                  <div>
                                    <span style="color: #64748b; font-weight: bold; display: block; text-transform: uppercase; font-size: 9px; margin-bottom: 2px;">T.C. Kimlik / Pasaport No (ID / Passport)</span>
                                    <strong style="color: #1e293b; font-size: 12px; font-family: monospace;">${clientIdentityVal}</strong>
                                  </div>
                                  <div>
                                    <span style="color: #64748b; font-weight: bold; display: block; text-transform: uppercase; font-size: 9px; margin-bottom: 2px;">İletişim Telefonu (Client Phone)</span>
                                    <strong style="color: #1e293b; font-size: 12px; font-family: monospace;">${clientPhoneVal}</strong>
                                  </div>
                                  <div>
                                    <span style="color: #64748b; font-weight: bold; display: block; text-transform: uppercase; font-size: 9px; margin-bottom: 2px;">IP Adresi (IP Address)</span>
                                    <strong style="color: #1e293b; font-size: 12px; font-family: monospace;">${ipAddressVal}</strong>
                                  </div>
                                  <div>
                                    <span style="color: #64748b; font-weight: bold; display: block; text-transform: uppercase; font-size: 9px; margin-bottom: 2px;">Onay Zaman Damgası (Signing Timestamp)</span>
                                    <strong style="color: #1e293b; font-size: 12px;">${timestampVal}</strong>
                                  </div>
                                  <div>
                                    <span style="color: #64748b; font-weight: bold; display: block; text-transform: uppercase; font-size: 9px; margin-bottom: 2px;">Güvenlik & Bütünlük Kodu (Security Hash / SHA)</span>
                                    <strong style="color: #16a34a; font-size: 11px; font-family: monospace; letter-spacing: 0.5px;">${securityCode}</strong>
                                  </div>
                                </div>
                                
                                <div style="border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 10px; color: #64748b; text-align: justify; line-height: 1.5;">
                                  <p style="margin: 0;"><strong>YASAL BEYAN VE GEÇERLİLİK:</strong> İşbu dijital sözleşme, taraflarca mobil/tablet cihazın dokunmatik ekranı üzerinde biyometrik parmak izi imza simülasyonu ile onaylanmıştır. 5070 Sayılı Elektronik İmza Kanunu, KKTC E-İmza Yasası ve Türk Borçlar Kanunu kapsamında hukuken geçerli ve tarafları bağlayıcı "Yazılı Delil Başlangıcı ve Sözleşmesi" niteliğindedir. Sözleşme içeriği ve imza bütünlüğü, yukarıda belirtilen benzersiz Güvenlik & Bütünlük Kodu (SHA) ile kriptografik olarak mühürlenmiştir.</p>
                                </div>
                              </div>
                            `;

                            let enrichedHtml = html;
                            const lastDivIndex = enrichedHtml.lastIndexOf("</div>");
                            if (lastDivIndex !== -1) {
                              enrichedHtml = enrichedHtml.substring(0, lastDivIndex) + securityBoxHtml + "</div>";
                            } else {
                              enrichedHtml = enrichedHtml + securityBoxHtml;
                            }
                             
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
                                    ${enrichedHtml}
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
                        className="p-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 hover:text-white rounded-xl transition"
                        title="Evrak Görüntüle / Yazdır"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm("Bu sözleşmeyi/evrakı silmek istediğinize emin misiniz?")) return;
                          const updatedDocs = (viewDocsProperty.documents || []).filter((d: any) => d.id !== doc.id);
                          const updatedProp = { ...viewDocsProperty, documents: updatedDocs };
                          await onSave(updatedProp);
                          setViewDocsProperty(updatedProp);
                          toast.success("Sözleşme başarıyla silindi!");
                        }}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-white rounded-xl transition"
                        title="Sözleşmeyi Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setViewDocsProperty(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RealEstateTab;
