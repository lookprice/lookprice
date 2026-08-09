import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin,
  SlidersHorizontal,
  Grid,
  List,
  Map as MapIcon,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ArrowUp,
  RotateCcw,
  Building2,
  Home,
  Check,
  ExternalLink,
  Search,
  Navigation,
  Compass,
  Zap,
  Tag,
  Share2,
  Info,
  Phone,
  MessageCircle,
  User,
  Clock
} from "lucide-react";
import { Product, Store } from "../types";
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import { REAL_ESTATE_REGIONS, EMLAK_TIPI_SUB_TIPLERI } from "../data/realEstateConfig";

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_PLATFORM_KEY || process.env.GOOGLE_MAPS_PLATFORM_KEY || "";

// Comprehensive coordinates for Northern Cyprus (KKTC) regions
const REGION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "girne": { lat: 35.3364, lng: 33.3174 },
  "kyrenia": { lat: 35.3364, lng: 33.3174 },
  "alsancak": { lat: 35.3444, lng: 33.2294 },
  "lapta": { lat: 35.3421, lng: 33.1517 },
  "karsiyaka": { lat: 35.3522, lng: 33.0560 },
  "karşıyaka": { lat: 35.3522, lng: 33.0560 },
  "esentepe": { lat: 35.3422, lng: 33.5786 },
  "catalkoy": { lat: 35.3283, lng: 33.3853 },
  "çatalköy": { lat: 35.3283, lng: 33.3853 },
  "bellapais": { lat: 35.2974, lng: 33.3441 },
  "zeytinlik": { lat: 35.3278, lng: 33.3083 },
  "karaoglanoglu": { lat: 35.3365, lng: 33.2847 },
  "karaoğlanoğlu": { lat: 35.3365, lng: 33.2847 },
  "ozankoy": { lat: 35.3256, lng: 33.3592 },
  "ozanköy": { lat: 35.3256, lng: 33.3592 },
  "karaman": { lat: 35.3121, lng: 33.2657 },
  "lefkoşa": { lat: 35.1856, lng: 33.3820 },
  "lefkosa": { lat: 35.1856, lng: 33.3820 },
  "nicosia": { lat: 35.1856, lng: 33.3820 },
  "gonyeli": { lat: 35.2105, lng: 33.3175 },
  "gönyeli": { lat: 35.2105, lng: 33.3175 },
  "hamitkoy": { lat: 35.2091, lng: 33.3934 },
  "hamitköy": { lat: 35.2091, lng: 33.3934 },
  "ortakoy": { lat: 35.1972, lng: 33.3465 },
  "ortaköy": { lat: 35.1972, lng: 33.3465 },
  "yenisehir": { lat: 35.1834, lng: 33.3695 },
  "yenişehir": { lat: 35.1834, lng: 33.3695 },
  "gazimağusa": { lat: 35.1250, lng: 33.9312 },
  "gazimagusa": { lat: 35.1250, lng: 33.9312 },
  "magusa": { lat: 35.1250, lng: 33.9312 },
  "mağusa": { lat: 35.1250, lng: 33.9312 },
  "famagusta": { lat: 35.1250, lng: 33.9312 },
  "yenibogazici": { lat: 35.1979, lng: 33.8966 },
  "yeniboğaziçi": { lat: 35.1979, lng: 33.8966 },
  "tuzla": { lat: 35.1584, lng: 33.9056 },
  "iskele": { lat: 35.2902, lng: 33.8912 },
  "long beach": { lat: 35.2750, lng: 33.9100 },
  "bafra": { lat: 35.3564, lng: 34.0044 },
  "bogaz": { lat: 35.2950, lng: 33.9450 },
  "boğaz": { lat: 35.2950, lng: 33.9450 },
  "otuken": { lat: 35.2104, lng: 33.8943 },
  "ötüken": { lat: 35.2104, lng: 33.8943 },
  "güzelyurt": { lat: 35.1997, lng: 32.9975 },
  "guzelyurt": { lat: 35.1997, lng: 32.9975 },
  "lefke": { lat: 35.1119, lng: 32.8494 },
  "gemikonagi": { lat: 35.1415, lng: 32.8250 },
  "gemikonağı": { lat: 35.1415, lng: 32.8250 },
  "dipkarpaz": { lat: 35.5975, lng: 34.3780 },
  "karpaz": { lat: 35.5348, lng: 34.1843 }
};

// Points of Interest (POIs) Database for Neighborhood Analysis
interface POI {
  id: string;
  name: string;
  type: 'hospital' | 'school' | 'park' | 'mall' | 'pharmacy' | 'sports' | 'gov';
  icon: string;
  lat: number;
  lng: number;
  region: string;
  address: string;
}

const NEIGHBORHOOD_POIS: POI[] = [
  // Girne POIs
  { id: 'g-hosp-1', name: 'Girne Dr. Akçiçek Devlet Hastanesi', type: 'hospital', icon: '🏥', lat: 35.3340, lng: 33.3210, region: 'Girne', address: 'Mustafa Çağatay Caddesi, Girne' },
  { id: 'g-hosp-2', name: 'Kıbrıs Kolan Hospital Girne', type: 'hospital', icon: '🏥', lat: 35.3380, lng: 33.3120, region: 'Girne', address: 'Karakız Sokak, Girne' },
  { id: 'g-sch-1', name: 'Girne Amerikan Üniversitesi (GAÜ)', type: 'school', icon: '🏫', lat: 35.3280, lng: 33.2980, region: 'Girne', address: 'Karaoğlanoğlu Caddesi' },
  { id: 'g-sch-2', name: 'Kıbrıs İlim Üniversitesi (KİÜ)', type: 'school', icon: '🏫', lat: 35.3320, lng: 33.3450, region: 'Girne', address: 'Ozanköy Yolu, Girne' },
  { id: 'g-sch-3', name: 'The English School of Kyrenia (ESK)', type: 'school', icon: '🎓', lat: 35.3240, lng: 33.3520, region: 'Girne', address: 'Bellapais Road, Ozanköy' },
  { id: 'g-park-1', name: 'Barış Parkı & Yürüyüş Yolu', type: 'park', icon: '🌳', lat: 35.3355, lng: 33.3190, region: 'Girne', address: 'Merkez Girne' },
  { id: 'g-park-2', name: 'Alsancak Milli Parkı & Sahil Yolu', type: 'park', icon: '🏖️', lat: 35.3480, lng: 33.2200, region: 'Alsancak', address: 'Alsancak Sahili' },
  { id: 'g-mall-1', name: 'Girne Park AVM & Çarşı', type: 'mall', icon: '🛒', lat: 35.3370, lng: 33.3180, region: 'Girne', address: 'Ziya Rızkı Caddesi' },
  { id: 'g-pharm-1', name: 'Merkez Eczanesi & Nöbetçi Noktası', type: 'pharmacy', icon: '💊', lat: 35.3360, lng: 33.3160, region: 'Girne', address: 'Kordonboyu Caddesi' },
  { id: 'g-gov-1', name: 'Girne Kaza Tapu ve Cadde Dairesi', type: 'gov', icon: '🏛️', lat: 35.3330, lng: 33.3240, region: 'Girne', address: 'Hükümet Binası Yanı' },
  { id: 'g-sports-1', name: 'Girne Antik Liman & Yat Marinası', type: 'sports', icon: '⛵', lat: 35.3415, lng: 33.3205, region: 'Girne', address: 'Antik Liman' },

  // Lefkoşa POIs
  { id: 'l-hosp-1', name: 'Dr. Burhan Nalbantoğlu Devlet Hastanesi', type: 'hospital', icon: '🏥', lat: 35.1950, lng: 33.3510, region: 'Lefkoşa', address: 'Ortaköy, Lefkoşa' },
  { id: 'l-sch-1', name: 'Yakın Doğu Üniversitesi (YDÜ) Kampüsü', type: 'school', icon: '🏫', lat: 35.2260, lng: 33.3190, region: 'Lefkoşa', address: 'Yakın Doğu Bulvarı' },
  { id: 'l-gov-1', name: 'KKTC İçişleri ve Tapu Dairesi Genel Müdürlüğü', type: 'gov', icon: '🏛️', lat: 35.1870, lng: 33.3650, region: 'Lefkoşa', address: 'Bakanlıklar Yolu' },
  { id: 'l-mall-1', name: 'Dereboyu Caddesi Alışveriş Bulvarı', type: 'mall', icon: '🛍️', lat: 35.1910, lng: 33.3520, region: 'Lefkoşa', address: 'Mehmet Akif Caddesi' },

  // Gazimağusa / İskele POIs
  { id: 'm-sch-1', name: 'Doğu Akdeniz Üniversitesi (DAÜ)', type: 'school', icon: '🏫', lat: 35.1430, lng: 33.9080, region: 'Gazimağusa', address: 'DAÜ Kampüsü' },
  { id: 'm-hosp-1', name: 'Gazimağusa Devlet Hastanesi', type: 'hospital', icon: '🏥', lat: 35.1520, lng: 33.9100, region: 'Gazimağusa', address: 'Tuzla Yolu' },
  { id: 'i-park-1', name: 'Long Beach Sahil Parkı & Bisiklet Yolu', type: 'park', icon: '🏖️', lat: 35.2780, lng: 33.9120, region: 'İskele', address: 'Long Beach, İskele' }
];

const MapHandler = ({ center, zoom }: { center: { lat: number; lng: number }; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    if (map && center) {
      map.panTo(center);
    }
  }, [map, center]);

  useEffect(() => {
    if (map && zoom) {
      map.setZoom(zoom);
    }
  }, [map, zoom]);

  return null;
};

interface IDXSplitMapViewProps {
  products: Product[];
  store: Store;
  lang: string;
  onViewProduct: (product: Product) => void;
  formatPrice: (price: number, currency?: string) => string;
  onOpenSellModal?: () => void;
}

export const IDXSplitMapView: React.FC<IDXSplitMapViewProps> = ({
  products,
  store,
  lang,
  onViewProduct,
  formatPrice,
  onOpenSellModal
}) => {
  const isTr = lang === "tr";

  // Navigation & Fihrist Filter States
  const [activeTab, setActiveTab] = useState<'listings' | 'offices' | 'deals'>('listings');
  const [activeIntent, setActiveIntent] = useState<'all' | 'sale' | 'rent'>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeRegion, setActiveRegion] = useState<string>('all');
  const [activeSubRegion, setActiveSubRegion] = useState<string>('all');
  const [activeBadgeFilter, setActiveBadgeFilter] = useState<'all' | 'new' | 'discounted' | 'vip'>('all');

  // Advanced Drawer Filter States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<string>('all');
  const [selectedRooms, setSelectedRooms] = useState<string>('all');
  const [trafoPaidFilter, setTrafoPaidFilter] = useState<string>('all');
  const [kdvFilter, setKdvFilter] = useState<string>('all');
  const [terraceFilter, setTerraceFilter] = useState<string>('all');

  // Property-Type Custom Specific Filter States (Web Filtreleri)
  const [kocanTypeFilter, setKocanTypeFilter] = useState<string>('all'); // Tapu / Koçan (Eşdeğer, Türk, Tahsis, Müşterek)
  const [landZoningFilter, setLandZoningFilter] = useState<string>('all'); // Arsa İmar Durumu (Konut, Ticari, Sanayi, Tarım, İmarsız)
  const [landKaksFilter, setLandKaksFilter] = useState<string>('all'); // Arsa İmar Oranı (%20, %30, %50, %100+)
  const [landInfraFilter, setLandInfraFilter] = useState<string>('all'); // Arsa Altyapı (Yollu, Elektrik-Su, Anayol)
  const [commercialTypeFilter, setCommercialTypeFilter] = useState<string>('all'); // Ticari Türü (Dükkan, Ofis, Bina, Depo, Otel)
  const [commercialDevirFilter, setCommercialDevirFilter] = useState<string>('all'); // Devren / Kiracılı
  const [furnishedFilter, setFurnishedFilter] = useState<string>('all'); // Eşya Durumu
  const [buildingAgeFilter, setBuildingAgeFilter] = useState<string>('all'); // Bina Yaşı
  const [siteAmenitiesFilter, setSiteAmenitiesFilter] = useState<string>('all'); // Site Özellikleri (Havuzlu, Bahçeli, Deniz)

  // View Layout Mode: 'split' (Half Map / Half Grid), 'grid' (Full Grid), 'map' (Full Map)
  const [viewMode, setViewMode] = useState<'split' | 'grid' | 'map'>('split');

  // Map & POI Overlay States
  const [selectedProperty, setSelectedProperty] = useState<Product | null>(null);
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | number | null>(null);
  const [selectedPOICategory, setSelectedPOICategory] = useState<string>('all');
  const [showPOIs, setShowPOIs] = useState<boolean>(true);

  // Controlled Map Center and Zoom States
  const [mapCenterState, setMapCenterState] = useState<{ lat: number; lng: number }>({ lat: 35.3364, lng: 33.3174 });
  const [mapZoomState, setMapZoomState] = useState<number>(11);

  const topSectionRef = useRef<HTMLDivElement>(null);

  // Mobile Pagination / Load More State
  const [visibleCount, setVisibleCount] = useState<number>(6);

  useEffect(() => {
    setVisibleCount(6);
  }, [activeIntent, activeCategory, activeRegion, activeSubRegion, activeBadgeFilter, selectedRooms, priceRange, trafoPaidFilter, kdvFilter, kocanTypeFilter, landZoningFilter, commercialTypeFilter, furnishedFilter]);

  // Reset All Filters Helper
  const handleResetFilters = () => {
    setActiveIntent('all');
    setActiveCategory('all');
    setActiveRegion('all');
    setActiveSubRegion('all');
    setActiveBadgeFilter('all');
    setPriceRange('all');
    setSelectedRooms('all');
    setTrafoPaidFilter('all');
    setKdvFilter('all');
    setTerraceFilter('all');
    setKocanTypeFilter('all');
    setLandZoningFilter('all');
    setLandKaksFilter('all');
    setLandInfraFilter('all');
    setCommercialTypeFilter('all');
    setCommercialDevirFilter('all');
    setFurnishedFilter('all');
    setBuildingAgeFilter('all');
    setSiteAmenitiesFilter('all');
    setSelectedProperty(null);
  };

  // Helper to hash string or number ID to a numeric value safely
  const getNumericId = (id: any): number => {
    if (typeof id === 'number' && !isNaN(id)) return Math.abs(id);
    if (!id) return 1;
    const str = String(id);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) || 1;
  };

  const translateCategory = (cat: string | undefined): string => {
    if (!cat) return '';
    const c = cat.toLowerCase();
    if (c.includes('land')) return 'Arsa / Arazi';
    if (c.includes('residence')) return 'Konut / Daire';
    if (c.includes('villa')) return 'Villa';
    if (c.includes('commercial')) return 'Ticari Dükkan';
    return cat;
  };

  const getStatusBadge = (p: Product) => {
    const status = (p.status || p.sector_data?.status || 'active').toLowerCase();
    if (status === 'sold' || status === 'satildi' || status === 'satıldı') {
      return { label: 'SATILDI', bg: 'bg-rose-600/90 text-white border-rose-500' };
    }
    if (status === 'rented' || status === 'kiralandi' || status === 'kiralandı') {
      return { label: 'KİRALANDI', bg: 'bg-amber-600/90 text-white border-amber-500' };
    }
    if (status === 'reserved' || status === 'opsiyonlandi' || status === 'opsiyonlu') {
      return { label: 'OPSİYONLANDI', bg: 'bg-purple-600/90 text-white border-purple-500' };
    }
    return null;
  };

  // Helper to resolve property lat/lng
  const getPropertyCoords = (p: Product): { lat: number; lng: number } => {
    const coordsStr = (p as any).coordinates || p.sector_data?.coordinates || (p as any).location_coords;
    if (coordsStr && typeof coordsStr === "string" && coordsStr.includes(",")) {
      const [latS, lngS] = coordsStr.split(",");
      const lat = parseFloat(latS);
      const lng = parseFloat(lngS);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }

    const numId = getNumericId(p.id);

    // Lookup by sub-region or region name
    const locText = (p.sector_data?.kktc_sub_region || p.sector_data?.kktc_region || p.sector_data?.district || p.sector_data?.city || p.location || "").toLowerCase().trim();
    for (const [key, coords] of Object.entries(REGION_COORDINATES)) {
      if (locText.includes(key)) {
        // Offset slightly based on property ID to prevent overlap
        const offsetLat = ((numId * 17) % 50) * 0.0003 - 0.0075;
        const offsetLng = ((numId * 31) % 50) * 0.0003 - 0.0075;
        return { lat: coords.lat + offsetLat, lng: coords.lng + offsetLng };
      }
    }

    // Default Girne/Kyrenia coordinates with offset
    const offsetLat = ((numId * 17) % 50) * 0.0003 - 0.0075;
    const offsetLng = ((numId * 31) % 50) * 0.0003 - 0.0075;
    return { lat: 35.3364 + offsetLat, lng: 33.3174 + offsetLng };
  };

  // Filtered Products Calculation
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Intent filter (Satılık / Kiralık)
      const isRent = p.sector_data?.listing_intent === 'rent' || p.category?.toLowerCase().includes('kira') || p.category?.toLowerCase().includes('rent');
      if (activeIntent === 'sale' && isRent) return false;
      if (activeIntent === 'rent' && !isRent) return false;

      // Category filter (Daire, Villa, Arsa, Ticari)
      if (activeCategory !== 'all') {
        if (p.category?.toLowerCase() !== activeCategory.toLowerCase()) return false;
      }

      // Region match
      if (activeRegion !== 'all') {
        const pRegion = (p.sector_data?.kktc_region || p.sector_data?.city || p.location || "").toLowerCase();
        if (!pRegion.includes(activeRegion.toLowerCase())) return false;
      }

      // SubRegion match
      if (activeSubRegion !== 'all') {
        const pSubRegion = (p.sector_data?.kktc_sub_region || p.sector_data?.district || "").toLowerCase();
        if (!pSubRegion.includes(activeSubRegion.toLowerCase())) return false;
      }

      // Badge Filter
      if (activeBadgeFilter === 'new' && !p.sector_data?.is_new_building) return false;
      if (activeBadgeFilter === 'discounted' && !( (p as any).is_discounted || (p as any).is_opportunity || (p as any).is_featured || p.sector_data?.is_opportunity || p.sector_data?.is_discounted || p.name?.toLowerCase().includes('fırsat') || p.name?.toLowerCase().includes('kelepir') || p.description?.toLowerCase().includes('fırsat') || p.description?.toLowerCase().includes('kelepir') )) return false;
      if (activeBadgeFilter === 'vip' && !(p as any).is_featured) return false;

      // Advanced Drawer Filters
      if (selectedRooms !== 'all') {
        const pRooms = p.sector_data?.rooms?.toString() || "";
        if (pRooms !== selectedRooms) return false;
      }

      if (priceRange !== 'all') {
        const price = p.price;
        if (priceRange === '0-150000' && price > 150000) return false;
        if (priceRange === '150000-300000' && (price < 150000 || price > 300000)) return false;
        if (priceRange === '300000-500000' && (price < 300000 || price > 500000)) return false;
        if (priceRange === '500000+' && price < 500000) return false;
      }

      if (trafoPaidFilter !== 'all') {
        const isPaid = p.sector_data?.trafo_bedeli === true;
        if (trafoPaidFilter === 'paid' && !isPaid) return false;
        if (trafoPaidFilter === 'unpaid' && isPaid) return false;
      }

      if (kdvFilter !== 'all') {
        const kdv = p.sector_data?.kdv_status || 'to_be_paid';
        if (kdv !== kdvFilter) return false;
      }

      if (terraceFilter === 'yes' && !p.sector_data?.cati_terasi) return false;

      // Koçan / Title Deed Filter
      if (kocanTypeFilter !== 'all') {
        const pKocan = (p.sector_data?.kocan_type || p.sector_data?.title_deed || "").toLowerCase();
        if (!pKocan.includes(kocanTypeFilter.toLowerCase())) return false;
      }

      // Land Zoning Status Filter (Arsa)
      if (landZoningFilter !== 'all') {
        const pZoning = (p.sector_data?.zoning_status || p.sector_data?.imar_durumu || "").toLowerCase();
        if (!pZoning.includes(landZoningFilter.toLowerCase())) return false;
      }

      // Commercial Type Filter
      if (commercialTypeFilter !== 'all') {
        const pComm = (p.sector_data?.commercial_type || p.category || "").toLowerCase();
        if (!pComm.includes(commercialTypeFilter.toLowerCase())) return false;
      }

      // Furnished Status Filter
      if (furnishedFilter !== 'all') {
        const pFurn = (p.sector_data?.furnished_status || "").toLowerCase();
        if (furnishedFilter === 'full' && !pFurn.includes('full') && !pFurn.includes('tam')) return false;
        if (furnishedFilter === 'unfurnished' && (pFurn.includes('full') || pFurn.includes('eşyalı'))) return false;
      }

      return true;
    });
  }, [products, activeIntent, activeCategory, activeRegion, activeSubRegion, activeBadgeFilter, selectedRooms, priceRange, trafoPaidFilter, kdvFilter, terraceFilter, kocanTypeFilter, landZoningFilter, commercialTypeFilter, furnishedFilter]);

  // Featured / Opportunity Property
  const opportunityProperty = useMemo(() => {
    return filteredProducts.find(p => (p as any).is_discounted || (p as any).is_opportunity || (p as any).is_featured || p.sector_data?.is_new_building || p.name?.toLowerCase().includes('fırsat') || p.name?.toLowerCase().includes('kelepir')) || filteredProducts[0];
  }, [filteredProducts]);

  // Sync mapCenterState and mapZoomState when selectedProperty or activeRegion changes
  useEffect(() => {
    if (selectedProperty) {
      const c = getPropertyCoords(selectedProperty);
      if (c && typeof c.lat === 'number' && !isNaN(c.lat) && typeof c.lng === 'number' && !isNaN(c.lng)) {
        setMapCenterState(c);
        setMapZoomState(14);
      }
    } else if (activeRegion !== 'all' && REGION_COORDINATES[activeRegion.toLowerCase()]) {
      const c = REGION_COORDINATES[activeRegion.toLowerCase()];
      if (c && typeof c.lat === 'number' && !isNaN(c.lat) && typeof c.lng === 'number' && !isNaN(c.lng)) {
        setMapCenterState(c);
        setMapZoomState(12);
      }
    } else if (filteredProducts.length > 0) {
      const c = getPropertyCoords(filteredProducts[0]);
      if (c && typeof c.lat === 'number' && !isNaN(c.lat) && typeof c.lng === 'number' && !isNaN(c.lng)) {
        setMapCenterState(c);
      }
    }
  }, [selectedProperty, activeRegion]);

  // Calculate nearby POIs for selected property
  const nearbyPoisForSelected = useMemo(() => {
    if (!selectedProperty) return [];
    const propCoords = getPropertyCoords(selectedProperty);
    
    // Haversine distance formula in meters
    const calcDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371e3;
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lon2 - lon1) * Math.PI) / 180;
      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return Math.round(R * c);
    };

    return NEIGHBORHOOD_POIS.map(poi => ({
      ...poi,
      distanceMeters: calcDistanceMeters(propCoords.lat, propCoords.lng, poi.lat, poi.lng)
    })).sort((a, b) => a.distanceMeters - b.distanceMeters).slice(0, 5);
  }, [selectedProperty]);

  const scrollToTop = () => {
    if (topSectionRef.current) {
      topSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div ref={topSectionRef} className="w-full bg-slate-50 text-slate-800 min-h-screen relative font-sans">
      
      {/* 1. TOP HEADER & FIHRIST FILTER BAR (Light Directory Index Theme) */}
      <div className="bg-amber-50/95 border-b border-amber-200/80 sticky top-[60px] sm:top-[68px] z-40 shadow-md backdrop-blur-xl">
        
        {/* Üst Sekme Fihrist Yapısı (Directory Header Binder Folder Tabs) */}
        <div className="max-w-7xl mx-auto px-2 sm:px-4 pt-2.5 pb-0">
          <div className="flex items-center gap-1.5 sm:gap-3 overflow-x-auto no-scrollbar border-b-2 border-slate-300">
            <button
              onClick={() => { setActiveTab('listings'); handleResetFilters(); }}
              className={`px-4 sm:px-6 py-2.5 rounded-t-xl sm:rounded-t-2xl text-[10px] sm:text-[12px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 shrink-0 relative border-t-2 border-x ${
                activeTab === 'listings'
                  ? "bg-slate-800 border-slate-900 text-white shadow-md -mb-0.5 z-10 scale-[1.01]"
                  : "bg-slate-300 border-slate-400 text-slate-800 hover:bg-slate-400 hover:text-slate-950"
              }`}
            >
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>{isTr ? "EMLAK PORTFÖYÜ" : "REAL ESTATE PORTFOLIO"}</span>
              <div className="w-2 h-2 bg-amber-400 rounded-full absolute -top-1 right-2 border border-white shadow-xs" />
            </button>

            <button
              onClick={() => { setActiveTab('offices'); }}
              className={`px-4 sm:px-6 py-2.5 rounded-t-xl sm:rounded-t-2xl text-[10px] sm:text-[12px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 shrink-0 relative border-t-2 border-x ${
                activeTab === 'offices'
                  ? "bg-blue-600 border-blue-800 text-white shadow-md -mb-0.5 z-10 scale-[1.01]"
                  : "bg-blue-200 border-blue-300 text-blue-900 hover:bg-blue-300 hover:text-blue-950"
              }`}
            >
              <Home className="w-4 h-4 text-blue-200" />
              <span>{isTr ? "OFİSLERİMİZ & DANIŞMANLAR" : "OFFICES & AGENTS"}</span>
              <div className="w-2 h-2 bg-blue-300 rounded-full absolute -top-1 right-2 border border-white shadow-xs" />
            </button>

            <button
              onClick={() => { setActiveTab('deals'); setActiveBadgeFilter('discounted'); }}
              className={`px-4 sm:px-6 py-2.5 rounded-t-xl sm:rounded-t-2xl text-[10px] sm:text-[12px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 shrink-0 relative border-t-2 border-x ${
                activeTab === 'deals' || activeBadgeFilter === 'discounted'
                  ? "bg-rose-600 border-rose-800 text-white shadow-md -mb-0.5 z-10 scale-[1.01]"
                  : "bg-rose-200 border-rose-300 text-rose-900 hover:bg-rose-300 hover:text-rose-950"
              }`}
            >
              <Zap className="w-4 h-4 text-yellow-300 animate-pulse" />
              <span>{isTr ? "FIRSAT KAMPANYALARI" : "DEALS & CAMPAIGNS"}</span>
              <div className="w-2 h-2 bg-yellow-400 rounded-full absolute -top-1 right-2 border border-white shadow-xs" />
            </button>
          </div>
        </div>

        {/* Fihrist Controls Content */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 space-y-2.5 bg-white/80 border-b border-amber-200/60 shadow-xs">
          
          {/* Main Fihrist Navigation Bar */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            
            {/* Intent Selector Tabs (Satılık / Kiralık / Tümü) */}
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shrink-0 shadow-inner">
              <button
                onClick={() => { setActiveIntent('all'); setSelectedProperty(null); }}
                className={`px-3 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                  activeIntent === 'all'
                    ? "bg-amber-500 text-slate-950 shadow-md scale-[1.02]"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>🌐</span>
                <span>{isTr ? "Tümü" : "All"}</span>
              </button>
              <button
                onClick={() => { setActiveIntent('sale'); setSelectedProperty(null); }}
                className={`px-3 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                  activeIntent === 'sale'
                    ? "bg-indigo-600 text-white shadow-md scale-[1.02]"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>🏠</span>
                <span>{isTr ? "Satılık" : "For Sale"}</span>
              </button>
              <button
                onClick={() => { setActiveIntent('rent'); setSelectedProperty(null); }}
                className={`px-3 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                  activeIntent === 'rent'
                    ? "bg-emerald-600 text-white shadow-md scale-[1.02]"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>🔑</span>
                <span>{isTr ? "Kiralık" : "For Rent"}</span>
              </button>
            </div>

            {/* View Mode Toggle Switch & Action Icons */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
                <button
                  onClick={() => setViewMode('split')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                    viewMode === 'split' ? "bg-amber-500 text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Harita ve İlanlar Yan Yana (IDX)"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isTr ? "IDX Yan Yana" : "Split View"}</span>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                    viewMode === 'grid' ? "bg-amber-500 text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Galeri / Izgara Görünümü"
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isTr ? "Galeri" : "Grid"}</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                    viewMode === 'map' ? "bg-amber-500 text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Tam Ekran Harita Keşfi"
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isTr ? "Harita" : "Map"}</span>
                </button>
              </div>

              {/* Reset/Back Button (ONLY ICON) */}
              {(activeRegion !== 'all' || activeCategory !== 'all' || activeBadgeFilter !== 'all' || activeSubRegion !== 'all' || priceRange !== 'all' || activeIntent !== 'all') && (
                <button
                  onClick={handleResetFilters}
                  className="p-2 bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 rounded-xl cursor-pointer transition-all shadow-xs flex items-center justify-center shrink-0 active:scale-95"
                  title={isTr ? "Tüm Filtreleri Sıfırla" : "Reset Filters"}
                >
                  <RotateCcw className="w-4 h-4 text-amber-800" />
                </button>
              )}


            </div>
          </div>

          {/* Level 2 Fihrist: Mülk Tipleri & Kelepir Filtreleri */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pt-1 no-scrollbar">
            <div className="flex items-center gap-1.5 shrink-0">
              {[
                { key: 'all', label: isTr ? 'Tüm Tipler' : 'All Types', icon: '🏢' },
                { key: 'residence', label: 'Konut / Daire', icon: '🏠' },
                { key: 'villa', label: 'Villa', icon: '🏰' },
                { key: 'land', label: 'Arsa / Arazi', icon: '🏞️' },
                { key: 'commercial', label: 'Ticari Dükkan', icon: '🏪' },
              ].map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 border ${
                    activeCategory === cat.key
                      ? "bg-amber-500 text-slate-950 font-black border-amber-600 shadow-xs"
                      : "bg-white text-slate-700 hover:text-slate-900 hover:bg-amber-50 border-slate-200"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Quick Badge Filters */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setActiveBadgeFilter(activeBadgeFilter === 'discounted' ? 'all' : 'discounted')}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 border ${
                  activeBadgeFilter === 'discounted'
                    ? "bg-rose-600 text-white shadow-sm border-rose-700"
                    : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                }`}
              >
                🔥 {isTr ? "Kelepirler" : "Discounted"}
              </button>
              <button
                onClick={() => setActiveBadgeFilter(activeBadgeFilter === 'new' ? 'all' : 'new')}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 border ${
                  activeBadgeFilter === 'new'
                    ? "bg-emerald-600 text-white shadow-sm border-emerald-700"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                }`}
              >
                ✨ {isTr ? "Yeni Gelenler" : "New"}
              </button>
            </div>
          </div>

          {/* Level 3 Fihrist: Şehir / Bölge Seçimi (Tıklanınca Detay Filtre Çekmecesi & Alt Bölgeler Açılır) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1.5 border-t border-slate-200/70 pb-1 no-scrollbar text-xs">
            {['all', 'Girne', 'Lefkoşa', 'Gazimağusa', 'İskele', 'Lefke', 'Güzelyurt'].map((reg) => (
              <button
                key={reg}
                onClick={() => { 
                  setActiveRegion(reg); 
                  setActiveSubRegion('all'); 
                  if (reg !== 'all') {
                    setIsDrawerOpen(true); // Şehir seçilince detay filtreler & alt semtler otomatik açılır
                  }
                }}
                className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border ${
                  activeRegion === reg
                    ? "bg-indigo-600 text-white font-black shadow-md border-indigo-700 scale-[1.02]"
                    : "bg-white text-slate-700 hover:bg-indigo-50 hover:text-slate-900 border-slate-200 shadow-2xs"
                }`}
              >
                📍 {reg === 'all' ? (isTr ? "Tüm Şehirler" : "All Cities") : reg}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* 2. FEATURED / SPONSORED HIGHLIGHT BAR */}
      {opportunityProperty && (
        <div className="bg-amber-100/80 border-b border-amber-200 py-2.5 px-4 shadow-2xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3 overflow-hidden">
              <span className="bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0 flex items-center gap-1 shadow-xs">
                <Zap className="w-3 h-3 text-slate-950" /> {isTr ? "ÖNE ÇIKAN FIRSAT" : "FEATURED"}
              </span>
              <p className="text-slate-900 font-bold truncate text-[11px]">
                {opportunityProperty.name} — <span className="text-amber-700 font-black">{formatPrice(opportunityProperty.price, store?.currency || opportunityProperty.currency)}</span>
              </p>
            </div>
            <button
              onClick={() => onViewProduct(opportunityProperty)}
              className="text-[10px] font-black text-amber-800 hover:text-amber-950 uppercase tracking-widest shrink-0 flex items-center gap-1 cursor-pointer"
            >
              {isTr ? "İncele" : "View"} <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* 3. MAIN CONTENT BODY (SPLIT VIEW / GRID / MAP) */}
      <div className="max-w-[1700px] mx-auto p-2 sm:p-4 md:p-6">
        
        {/* VIEW MODE 1: SPLIT VIEW (HALF MAP, HALF GRID) */}
        {viewMode === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-180px)]">
            
            {/* LEFT COLUMN: INTERACTIVE GOOGLE MAP + POI OVERLAY (7 COLS ON DESKTOP) */}
            <div className="lg:col-span-7 h-[500px] lg:h-[calc(100vh-230px)] lg:sticky lg:top-[210px] rounded-3xl overflow-hidden border border-slate-200 shadow-xl relative bg-white flex flex-col z-10">
              
              {/* Map POI Category Toolbar */}
              <div className="bg-amber-50/90 backdrop-blur-md p-2.5 border-b border-amber-200/80 z-10 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[9px] font-black text-amber-900 uppercase tracking-widest mr-1">📍 ÇEVRE HARİTASI & İMKÂNLAR:</span>
                  {[
                    { key: 'all', label: 'Tümü', icon: '🗺️' },
                    { key: 'hospital', label: 'Hastaneler', icon: '🏥' },
                    { key: 'school', label: 'Okullar', icon: '🏫' },
                    { key: 'park', label: 'Park & Sahil', icon: '🌳' },
                    { key: 'mall', label: 'AVM & Market', icon: '🛒' },
                    { key: 'gov', label: 'Tapu & Kamu', icon: '🏛️' },
                  ].map((poi) => (
                    <button
                      key={poi.key}
                      onClick={() => setSelectedPOICategory(poi.key)}
                      className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all ${
                        selectedPOICategory === poi.key
                          ? "bg-amber-500 text-slate-950 shadow-xs font-black"
                          : "bg-white text-slate-700 border border-amber-200/80 hover:bg-amber-100/60"
                      }`}
                    >
                      <span>{poi.icon}</span>
                      <span>{poi.label}</span>
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setShowPOIs(!showPOIs)}
                  className={`px-2.5 py-1 rounded-xl text-[9px] font-bold uppercase tracking-wider border cursor-pointer ${
                    showPOIs ? "bg-indigo-600 text-white border-indigo-700 shadow-xs" : "bg-white text-slate-500 border-slate-200"
                  }`}
                >
                  {showPOIs ? "İmkânlar Açık" : "İmkânlar Gizli"}
                </button>
              </div>

              {/* Google Map Canvas */}
              <div className="flex-1 w-full h-full relative">
                {GOOGLE_MAPS_KEY ? (
                  <APIProvider apiKey={GOOGLE_MAPS_KEY}>
                    <Map
                      style={{ width: "100%", height: "100%" }}
                      defaultCenter={mapCenterState}
                      defaultZoom={mapZoomState}
                      gestureHandling="greedy"
                      disableDefaultUI={false}
                      zoomControl={true}
                      mapId="idx_real_estate_map"
                    >
                      <MapHandler center={mapCenterState} zoom={mapZoomState} />
                      {/* Render Property Price Markers */}
                      {filteredProducts.map((p) => {
                        const coords = getPropertyCoords(p);
                        const isSelected = selectedProperty?.id === p.id;
                        const isHovered = hoveredPropertyId === p.id;
                        const priceText = formatPrice(p.price, store?.currency || p.currency);

                        return (
                          <AdvancedMarker
                            key={p.id}
                            position={coords}
                            onClick={() => setSelectedProperty(p)}
                          >
                            <div
                              className={`px-2.5 py-1.5 rounded-2xl font-black text-[11px] shadow-lg transition-all duration-300 transform cursor-pointer flex items-center gap-1 border ${
                                isSelected
                                  ? "bg-amber-500 text-slate-950 scale-125 border-slate-900 z-50 ring-4 ring-amber-400/60 font-black"
                                  : isHovered
                                  ? "bg-indigo-600 text-white scale-110 border-indigo-400 z-40 font-bold"
                                  : "bg-slate-900 text-white border-slate-700 hover:bg-slate-800 hover:scale-105"
                              }`}
                            >
                              <Home className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>{priceText}</span>
                            </div>
                          </AdvancedMarker>
                        );
                      })}

                      {/* Render POIs on Map */}
                      {showPOIs && NEIGHBORHOOD_POIS.filter(poi => selectedPOICategory === 'all' || poi.type === selectedPOICategory).map((poi) => (
                        <AdvancedMarker
                          key={poi.id}
                          position={{ lat: poi.lat, lng: poi.lng }}
                        >
                          <div className="w-7 h-7 bg-white border border-amber-400 rounded-full flex items-center justify-center text-xs shadow-md transform hover:scale-125 transition-transform" title={`${poi.name} (${poi.address})`}>
                            {poi.icon}
                          </div>
                        </AdvancedMarker>
                      ))}

                      {/* Selected Property Popup InfoWindow */}
                      {selectedProperty && (
                        <InfoWindow
                          position={getPropertyCoords(selectedProperty)}
                          onCloseClick={() => setSelectedProperty(null)}
                        >
                          <div className="p-1 max-w-[220px] text-slate-900 font-sans">
                            <img
                              src={selectedProperty.image_url || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000"}
                              alt={selectedProperty.name}
                              className="w-full h-24 object-cover rounded-xl mb-2 shadow-xs"
                            />
                            <p className="font-extrabold text-xs uppercase leading-tight text-slate-900 line-clamp-1">
                              {selectedProperty.name}
                            </p>
                            <p className="text-amber-700 font-black text-sm my-1">
                              {formatPrice(selectedProperty.price, store?.currency || selectedProperty.currency)}
                            </p>
                            <button
                              onClick={() => onViewProduct(selectedProperty)}
                              className="w-full py-1.5 bg-slate-900 text-white font-black text-[10px] uppercase rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
                            >
                              Detaylı İncele ➔
                            </button>
                          </div>
                        </InfoWindow>
                      )}
                    </Map>
                  </APIProvider>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-amber-50/50">
                    <MapPin className="w-12 h-12 text-amber-600 mb-3 animate-bounce" />
                    <h4 className="text-base font-black text-slate-900">İnteraktif Konum & Çevre Analizi</h4>
                    <p className="text-xs text-slate-600 max-w-sm mt-1">
                      Haritadaki marker'lara tıklayarak portföy fiyatlarını ve mahalleden hastane, okul, sahil mesafelerini canlı inceleyebilirsiniz.
                    </p>
                  </div>
                )}
              </div>

              {/* Neighborhood Amenities Analysis Panel for Selected Property */}
              {selectedProperty && (
                <div className="bg-white border-t border-amber-200/80 p-3.5 shadow-md animate-fadeIn">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5 text-amber-600" /> YAKIN ÇEVRE VE MAHALLE İMKÂNLARI ANALİZİ
                    </span>
                    <button onClick={() => setSelectedProperty(null)} className="text-slate-400 hover:text-white text-xs">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
                    {nearbyPoisForSelected.map((poi) => (
                      <div key={poi.id} className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl flex items-center gap-2">
                        <span className="text-sm shrink-0">{poi.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-200 truncate">{poi.name}</p>
                          <p className="text-amber-400 font-extrabold text-[9px]">{poi.distanceMeters < 1000 ? `${poi.distanceMeters}m` : `${(poi.distanceMeters/1000).toFixed(1)}km`} mesafede</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT COLUMN: LISTING CARDS GRID (5 COLS ON DESKTOP) */}
            <div className="lg:col-span-5 lg:h-[calc(100vh-230px)] lg:overflow-y-auto lg:sticky lg:top-[210px] space-y-4 pr-1.5 no-scrollbar z-10">
              
              {/* If activeTab is 'offices', render Office & Consultant Directory Card */}
              {activeTab === 'offices' ? (
                <div className="bg-slate-950 p-5 rounded-3xl border border-blue-500/40 shadow-2xl space-y-5 text-white animate-fadeIn">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                    <div className="p-3 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/30">
                      <Home className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white uppercase tracking-wider">
                        {((store as any)?.branding?.store_name) || store?.name || "Premium VIP Emlak"}
                      </h3>
                      <p className="text-xs text-blue-300 font-bold uppercase tracking-widest">Merkez Ofisimiz & Lisanslı Portföy Yönetimi</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-start gap-2.5 bg-slate-900 p-3 rounded-2xl border border-slate-800">
                      <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-300 uppercase text-[10px]">Adres & Konum</p>
                        <p className="text-slate-200 font-medium">
                          {((store as any)?.branding?.address) || store?.address || ((store as any)?.locations?.[0]?.address) || ((store as any)?.branches?.[0]?.address) || "Bedrettin Demirel Caddesi, Girne / KKTC"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 bg-slate-900 p-3 rounded-2xl border border-slate-800">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <p className="font-bold text-slate-300 uppercase text-[10px]">Çalışma Saatleri</p>
                        <p className="text-slate-200 font-medium">Pazartesi - Cumartesi: 08:30 - 18:30</p>
                      </div>
                    </div>
                  </div>

                  {/* Gayrimenkul Danışmanlarımız Section */}
                  <div className="pt-3 border-t border-slate-800">
                    <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" /> Portföy Yöneticileri & Danışmanlar
                    </h4>
                    
                    <div className="space-y-3">
                      {(() => {
                        const teamSource = 
                          (store as any).page_layout_settings?.team && Array.isArray((store as any).page_layout_settings.team) && (store as any).page_layout_settings.team.length > 0
                            ? (store as any).page_layout_settings.team
                            : (store as any).branding?.team && Array.isArray((store as any).branding.team) && (store as any).branding.team.length > 0
                              ? (store as any).branding.team
                              : (store as any).team && Array.isArray((store as any).team) && (store as any).team.length > 0
                                ? (store as any).team
                                : (store as any).agents && Array.isArray((store as any).agents) && (store as any).agents.length > 0
                                  ? (store as any).agents
                                  : store.consultants && store.consultants.length > 0
                                    ? store.consultants
                                    : [];

                        const storeTeam = teamSource.length > 0
                          ? teamSource.map((c: any, idx: number) => {
                              const rawImg = c.image || c.image_url || c.photo_url || c.avatar_url || c.photo || c.avatar || c.picture;
                              const validImg = typeof rawImg === 'string' && rawImg.trim().length > 0
                                ? rawImg
                                : "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400";
                              return {
                                id: c.id?.toString() || `member_${idx}`,
                                name: c.name || c.full_name || "Danışman",
                                role: c.role || c.title || "Gayrimenkul Danışmanı",
                                phone: c.phone || c.gsm || c.mobile || c.whatsapp || c.whatsapp_number || store.phone || "",
                                whatsapp: c.whatsapp || c.whatsapp_number || c.phone || c.gsm || c.mobile || (store as any).whatsapp_number || store.phone || "",
                                image: validImg,
                              };
                            })
                          : [
                              {
                                id: "1",
                                name: ((store as any)?.branding?.store_name) || store.name || "Seçkin Emlak",
                                role: "Kıdemli Gayrimenkul Danışmanı",
                                phone: store.phone || "",
                                whatsapp: store.whatsapp_number || store.phone || "",
                                image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400",
                              }
                            ];

                        return storeTeam.map((tm: any, idx: number) => (
                          <div key={`team_${tm.id || 'default'}_${idx}`} className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              {tm.image ? (
                                <img src={tm.image} alt={tm.name} className="w-10 h-10 rounded-full object-cover border border-amber-500/40" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 font-black flex items-center justify-center border border-amber-500/40 text-xs">
                                  {tm.name?.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="font-black text-white text-xs uppercase">{tm.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold">{tm.role}</p>
                              </div>
                            </div>
                            {tm.whatsapp && (
                              <a
                                href={`https://wa.me/${tm.whatsapp.replace(/\D/g,'')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase rounded-xl flex items-center gap-1.5 transition-all shrink-0"
                              >
                                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                              </a>
                            )}
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('listings')}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase rounded-xl tracking-wider transition-all"
                  >
                    Tüm İlan Portföyüne Dön
                  </button>
                </div>
              ) : (
                <>
                  {/* Results Header */}
                  <div className="flex items-center justify-between bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                    <span className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-amber-400" />
                      <span>Listelenen Portföy: <span className="text-amber-400 font-black">{filteredProducts.length} İlan</span></span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Canlı IDX Akışı</span>
                  </div>

              {/* Product Cards Container */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-slate-950/60 border-2 border-dashed border-slate-800 rounded-3xl p-8">
                  <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-300 font-black text-sm uppercase">Aramanıza Uygun Portföy Bulunamadı</p>
                  <p className="text-xs text-slate-500 mt-1">Filtre kriterlerinizi genişleterek tekrar deneyebilirsiniz.</p>
                  <button
                    onClick={handleResetFilters}
                    className="mt-4 px-4 py-2 bg-amber-500 text-slate-950 text-xs font-black rounded-xl uppercase tracking-wider hover:bg-amber-400"
                  >
                    Tüm Filtreleri Temizle
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                    {filteredProducts.slice(0, visibleCount).map((p) => {
                      const priceStr = formatPrice(p.price, store?.currency || p.currency);
                      const isRent = p.sector_data?.listing_intent === 'rent' || p.category?.toLowerCase().includes('kira') || p.category?.toLowerCase().includes('rent');
                      const isSelected = selectedProperty?.id === p.id;

                      return (
                        <div
                          key={p.id}
                          onMouseEnter={() => setHoveredPropertyId(p.id)}
                          onMouseLeave={() => setHoveredPropertyId(null)}
                          onClick={() => setSelectedProperty(p)}
                          className={`group bg-slate-950 rounded-3xl overflow-hidden border transition-all duration-300 cursor-pointer flex flex-col sm:flex-row ${
                            isSelected
                              ? "border-amber-400 ring-2 ring-amber-400/40 shadow-2xl scale-[1.01]"
                              : "border-slate-800/90 hover:border-slate-700 hover:shadow-xl"
                          }`}
                        >
                          {/* Image Thumbnail */}
                          <div className="w-full sm:w-44 h-40 shrink-0 relative overflow-hidden bg-slate-900">
                            <img
                              src={p.image_url || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000"}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                              {(() => {
                                const stBadge = getStatusBadge(p);
                                if (stBadge) {
                                  return (
                                    <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider backdrop-blur-md shadow-lg border ${stBadge.bg}`}>
                                      {stBadge.label}
                                    </span>
                                  );
                                }
                                return (
                                  <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider backdrop-blur-md shadow-md ${
                                    isRent ? "bg-emerald-600/90 text-white" : "bg-indigo-600/90 text-white"
                                  }`}>
                                    {isRent ? "KİRALIK" : "SATILIK"}
                                  </span>
                                );
                              })()}
                              {p.reference_no && (
                                <span className="bg-slate-950/80 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold">
                                  #{p.reference_no}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Details Area */}
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                                <span>{translateCategory(p.category)}</span>
                                <span className="text-slate-500">{p.sector_data?.kktc_sub_region || p.sector_data?.district || 'KKTC'}</span>
                              </div>
                              <h4 className="text-sm font-black text-slate-100 group-hover:text-amber-400 transition-colors line-clamp-1 uppercase">
                                {p.name}
                              </h4>
                              <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mt-1">
                                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span className="truncate">{p.location || p.sector_data?.location || "Girne, Kıbrıs"}</span>
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-900">
                              <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                                {p.sector_data?.rooms && <span>🛏️ {p.sector_data.rooms}</span>}
                                {p.sector_data?.square_meters && <span>📏 {p.sector_data.square_meters} m²</span>}
                              </div>
                              <div className="text-right">
                                <p className="text-base font-black text-amber-400 tracking-tight">{priceStr}</p>
                                <button
                                  onClick={(e) => { e.stopPropagation(); onViewProduct(p); }}
                                  className="text-[9px] font-black text-slate-400 group-hover:text-white uppercase tracking-wider flex items-center gap-0.5 ml-auto mt-0.5"
                                >
                                  {isTr ? "Detay" : "View"} ➔
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {filteredProducts.length > visibleCount && (
                    <button
                      onClick={() => setVisibleCount(prev => prev + 6)}
                      className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase rounded-2xl tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-95"
                    >
                      <span>{isTr ? `Daha Fazla Göster (${filteredProducts.length - visibleCount} İlan Kaldı)` : `Load More (${filteredProducts.length - visibleCount} remaining)`}</span>
                      <span>↓</span>
                    </button>
                  )}
                </div>
              )}
            </>
          )}

            </div>
          </div>
        )}

        {/* VIEW MODE 2: FULL GRID GALLERY VIEW */}
        {viewMode === 'grid' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-sm font-black text-slate-200 uppercase tracking-wider">
                Toplama Portföy: <span className="text-amber-400">{filteredProducts.length} İlan Bulundu</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((p) => {
                const priceStr = formatPrice(p.price, store?.currency || p.currency);
                const isRent = p.sector_data?.listing_intent === 'rent' || p.category?.toLowerCase().includes('kira');

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      onViewProduct(p);
                    }}
                    className="group bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 hover:border-amber-500/50 hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
                  >
                    <div className="relative aspect-[16/11] overflow-hidden bg-slate-900">
                      <img
                        src={p.image_url || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000"}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        {(() => {
                          const stBadge = getStatusBadge(p);
                          if (stBadge) {
                            return (
                              <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider backdrop-blur-md shadow-lg border ${stBadge.bg}`}>
                                {stBadge.label}
                              </span>
                            );
                          }
                          return (
                            <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider backdrop-blur-md shadow-md ${
                              isRent ? "bg-emerald-600/90 text-white" : "bg-indigo-600/90 text-white"
                            }`}>
                              {isRent ? "KİRALIK" : "SATILIK"}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <div>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{translateCategory(p.category)}</span>
                        <h4 className="text-base font-black text-white group-hover:text-amber-400 transition-colors uppercase line-clamp-1 mt-0.5">
                          {p.name}
                        </h4>
                        <p className="text-xs font-bold text-slate-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="truncate">{p.location || "Kıbrıs"}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-900">
                        <div className="text-xs font-bold text-slate-400">
                          {p.sector_data?.rooms && <span>🛏️ {p.sector_data.rooms} &nbsp;</span>}
                          {p.sector_data?.square_meters && <span>📏 {p.sector_data.square_meters} m²</span>}
                        </div>
                        <p className="text-lg font-black text-amber-400">{priceStr}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW MODE 3: FULL MAP DISCOVERY */}
        {viewMode === 'map' && (
          <div className="w-full h-[calc(100vh-180px)] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative bg-slate-950">
            {GOOGLE_MAPS_KEY ? (
              <APIProvider apiKey={GOOGLE_MAPS_KEY}>
                <Map
                  style={{ width: "100%", height: "100%" }}
                  defaultCenter={mapCenterState}
                  defaultZoom={12}
                  gestureHandling="greedy"
                  mapId="full_idx_map"
                >
                  <MapHandler center={mapCenterState} zoom={12} />
                  {filteredProducts.map((p) => {
                    const coords = getPropertyCoords(p);
                    const isSelected = selectedProperty?.id === p.id;
                    const priceText = formatPrice(p.price, store?.currency || p.currency);
                    return (
                      <AdvancedMarker
                        key={p.id}
                        position={coords}
                        onClick={() => setSelectedProperty(p)}
                      >
                        <div
                          className={`px-3 py-1.5 rounded-2xl font-black text-xs shadow-2xl transition-all duration-300 transform cursor-pointer flex items-center gap-1 border ${
                            isSelected
                              ? "bg-amber-500 text-slate-950 scale-125 border-slate-950 z-50 ring-4 ring-amber-400/60 font-black"
                              : "bg-slate-900 text-amber-400 border-amber-500/30 hover:bg-slate-800 hover:scale-115"
                          }`}
                        >
                          <Home className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{priceText}</span>
                        </div>
                      </AdvancedMarker>
                    );
                  })}

                  {/* Selected Property Popup InfoWindow on Full Screen Map */}
                  {selectedProperty && (
                    <InfoWindow
                      position={getPropertyCoords(selectedProperty)}
                      onCloseClick={() => setSelectedProperty(null)}
                    >
                      <div className="p-1 max-w-[220px] text-slate-900 font-sans">
                        <img
                          src={selectedProperty.image_url || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000"}
                          alt={selectedProperty.name}
                          className="w-full h-24 object-cover rounded-xl mb-2 shadow-xs"
                        />
                        <p className="font-extrabold text-xs uppercase leading-tight text-slate-900 line-clamp-1">
                          {selectedProperty.name}
                        </p>
                        <p className="text-amber-700 font-black text-sm my-1">
                          {formatPrice(selectedProperty.price, store?.currency || selectedProperty.currency)}
                        </p>
                        <div className="text-[10px] text-slate-600 font-bold mb-2 flex items-center gap-1 truncate">
                          <span>📍 {selectedProperty.location}</span>
                          {selectedProperty.sector_data?.square_meters && <span>• {selectedProperty.sector_data.square_meters} m²</span>}
                        </div>
                        <button
                          onClick={() => onViewProduct(selectedProperty)}
                          className="w-full py-1.5 bg-slate-900 text-white font-black text-[10px] uppercase rounded-lg hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
                        >
                          Detaylı İncele ➔
                        </button>
                      </div>
                    </InfoWindow>
                  )}
                </Map>
              </APIProvider>
            ) : (
              <div className="p-12 text-center text-slate-400">Harita yükleniyor...</div>
            )}
          </div>
        )}

      </div>

      {/* 4. FIXED SIDE EDGE SLIDE-OUT FILTER TRIGGER */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] uppercase tracking-widest px-2 py-4 rounded-l-2xl shadow-2xl border-l-2 border-y-2 border-amber-300 flex flex-col items-center gap-2 cursor-pointer group hover:pr-3 transition-all"
        title="Fihrist Detay Filtre Çekmecesi"
      >
        <SlidersHorizontal className="w-4 h-4" />
        <span className="[writing-mode:vertical-lr] rotate-180 text-[10px] tracking-widest font-black py-1">
          FİHRİST FİLTRE
        </span>
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
      </button>

      {/* 5. SLIDE-OUT ADVANCED FILTER DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-y-auto p-6 text-slate-800"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
                  <div className="flex items-center gap-2 text-amber-700">
                    <SlidersHorizontal className="w-5 h-5 text-amber-600" />
                    <h3 className="text-lg font-black uppercase text-slate-900 tracking-wider">Detaylı Arama Filtreleri</h3>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 rounded-full cursor-pointer hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-5 text-xs">
                  
                  {/* Mülk Tipi Seçimi (Çekmece İçi Hızlı Geçiş) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Mülk Tipi Kategorisi</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { key: 'all', label: 'Tüm Tipler', icon: '🏢' },
                        { key: 'residence', label: 'Konut / Daire', icon: '🏠' },
                        { key: 'villa', label: 'Villa', icon: '🏰' },
                        { key: 'land', label: 'Arsa / Arazi', icon: '🏞️' },
                        { key: 'commercial', label: 'Ticari Dükkan', icon: '🏪' },
                      ].map((cat) => (
                        <button
                          key={cat.key}
                          onClick={() => setActiveCategory(cat.key)}
                          className={`py-2 px-2 rounded-xl text-[10px] font-bold border cursor-pointer transition-all flex items-center justify-center gap-1 ${
                            activeCategory === cat.key ? "bg-amber-500 text-slate-950 border-amber-600 font-black shadow-xs" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Şehir / Bölge & Alt Mahalle Seçimi */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Şehir / Bölge Seçimi</label>
                    <div className="grid grid-cols-3 gap-1.5 mb-3">
                      {['all', 'Girne', 'Lefkoşa', 'Gazimağusa', 'İskele', 'Lefke', 'Güzelyurt'].map((reg) => (
                        <button
                          key={reg}
                          onClick={() => { setActiveRegion(reg); setActiveSubRegion('all'); }}
                          className={`py-2 px-2 rounded-xl text-[10px] font-bold border cursor-pointer transition-all ${
                            activeRegion === reg ? "bg-indigo-600 text-white border-indigo-700 font-black shadow-xs" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {reg === 'all' ? 'Tüm Şehirler' : reg}
                        </button>
                      ))}
                    </div>

                    {/* Alt Semt / Mahalle Seçimi */}
                    {activeRegion !== 'all' && REAL_ESTATE_REGIONS[activeRegion as keyof typeof REAL_ESTATE_REGIONS] && (
                      <div className="bg-amber-50/80 p-3 rounded-2xl border border-amber-200 shadow-2xs">
                        <label className="block text-[10px] font-black text-amber-900 uppercase tracking-wider mb-2">
                          📍 {activeRegion} — Alt Semtler & Mahalleler:
                        </label>
                        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1 no-scrollbar">
                          <button
                            onClick={() => setActiveSubRegion('all')}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                              activeSubRegion === 'all' ? "bg-indigo-600 text-white font-black shadow-xs" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            Tüm Semtler
                          </button>
                          {REAL_ESTATE_REGIONS[activeRegion as keyof typeof REAL_ESTATE_REGIONS].map((sub) => (
                            <button
                              key={sub}
                              onClick={() => setActiveSubRegion(sub)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer border ${
                                activeSubRegion === sub
                                  ? "bg-indigo-600 text-white font-black border-indigo-700 shadow-xs"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-indigo-50"
                              }`}
                            >
                              {sub}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Fiyat Aralığı */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Fiyat Aralığı (£)</label>
                    <select
                      value={priceRange}
                      onChange={(e) => setPriceRange(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-amber-500"
                    >
                      <option value="all">Tüm Fiyatlar</option>
                      <option value="0-150000">£150.000 Altı</option>
                      <option value="150000-300000">£150.000 - £300.000</option>
                      <option value="300000-500000">£300.000 - £500.000</option>
                      <option value="500000+">£500.000 Üstü Lüks</option>
                    </select>
                  </div>

                  {/* Koçan / Tapu Türü (Tüm Mülk Tiplerine Ortak KKTC Özel Filtresi) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Koçan / Tapu Türü (KKTC)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'all', label: 'Tüm Tapu Türleri' },
                        { key: 'eşdeğer', label: '📜 Eşdeğer Koçan' },
                        { key: 'türk', label: '🏛️ Türk Koçanı' },
                        { key: 'tahsis', label: '📑 Tahsis Koçan' },
                      ].map((kc) => (
                        <button
                          key={kc.key}
                          onClick={() => setKocanTypeFilter(kc.key)}
                          className={`py-2 rounded-xl text-[10px] font-bold border cursor-pointer transition-all ${
                            kocanTypeFilter === kc.key ? "bg-amber-500 text-slate-950 border-amber-600 font-black shadow-xs" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {kc.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* === CASE 1: ARSA / ARAZİ / TARLA ÖZEL FİLTRELERİ === */}
                  {activeCategory === 'land' && (
                    <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-4">
                      <div className="flex items-center gap-2 text-emerald-900 border-b border-emerald-200 pb-2">
                        <span>🏞️</span>
                        <h4 className="font-black uppercase tracking-wider text-[11px]">Arsa & Arazi Özel Detay Filtreleri</h4>
                      </div>

                      {/* İmar Durumu */}
                      <div>
                        <label className="block text-[10px] font-bold text-emerald-950 uppercase tracking-wider mb-1.5">İmar Durumu</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { key: 'all', label: 'Tüm İmar Durumları' },
                            { key: 'konut', label: '🏡 Konut İmarlı' },
                            { key: 'ticari', label: '🏢 Ticari İmarlı' },
                            { key: 'sanayi', label: '🏭 Sanayi İmarlı' },
                            { key: 'turizm', label: '🏖️ Turizm İmarlı' },
                            { key: 'tarim', label: '🌾 Tarım / Zeytinlik' },
                          ].map((zm) => (
                            <button
                              key={zm.key}
                              onClick={() => setLandZoningFilter(zm.key)}
                              className={`py-2 rounded-xl text-[10px] font-bold border cursor-pointer transition-all ${
                                landZoningFilter === zm.key ? "bg-emerald-600 text-white border-emerald-700 font-black shadow-xs" : "bg-white text-slate-700 border-emerald-200 hover:bg-emerald-100"
                              }`}
                            >
                              {zm.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* İmar Oranı / KAKS */}
                      <div>
                        <label className="block text-[10px] font-bold text-emerald-950 uppercase tracking-wider mb-1.5">İmar Oranı / KAKS (Yoğunluk)</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { key: 'all', label: 'Tümü' },
                            { key: '20', label: '%20 (2 Kat)' },
                            { key: '30', label: '%30 (3 Kat)' },
                            { key: '50', label: '%50 (Orta)' },
                            { key: '100', label: '%100+ (Yüksek)' },
                          ].map((kks) => (
                            <button
                              key={kks.key}
                              onClick={() => setLandKaksFilter(kks.key)}
                              className={`py-2 rounded-xl text-[10px] font-bold border cursor-pointer transition-all ${
                                landKaksFilter === kks.key ? "bg-emerald-600 text-white border-emerald-700 font-black shadow-xs" : "bg-white text-slate-700 border-emerald-200 hover:bg-emerald-100"
                              }`}
                            >
                              {kks.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Altyapı & Yolu */}
                      <div>
                        <label className="block text-[10px] font-bold text-emerald-950 uppercase tracking-wider mb-1.5">Altyapı & Ulaşım</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { key: 'all', label: 'Fark Etmez' },
                            { key: 'road', label: '🚗 Kadastral Yolu Var' },
                            { key: 'main_road', label: '🛣️ Anayola Sıfır' },
                            { key: 'infra', label: '⚡ Elektrik & Su Var' },
                          ].map((inf) => (
                            <button
                              key={inf.key}
                              onClick={() => setLandInfraFilter(inf.key)}
                              className={`py-2 rounded-xl text-[10px] font-bold border cursor-pointer transition-all ${
                                landInfraFilter === inf.key ? "bg-emerald-600 text-white border-emerald-700 font-black shadow-xs" : "bg-white text-slate-700 border-emerald-200 hover:bg-emerald-100"
                              }`}
                            >
                              {inf.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* === CASE 2: TİCARİ DÜKKAN / İŞYERİ ÖZEL FİLTRELERİ === */}
                  {activeCategory === 'commercial' && (
                    <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200 space-y-4">
                      <div className="flex items-center gap-2 text-blue-900 border-b border-blue-200 pb-2">
                        <span>🏪</span>
                        <h4 className="font-black uppercase tracking-wider text-[11px]">Ticari Mülk & İşyeri Filtreleri</h4>
                      </div>

                      {/* Ticari Türü */}
                      <div>
                        <label className="block text-[10px] font-bold text-blue-950 uppercase tracking-wider mb-1.5">Ticari Mülk Türü</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { key: 'all', label: 'Tüm Ticari Türler' },
                            { key: 'dukan', label: '🛍️ Dükkan / Mağaza' },
                            { key: 'ofis', label: '💼 Ofis / Büro' },
                            { key: 'bina', label: '🏢 Komple Ticari Bina' },
                            { key: 'depo', label: '📦 Depo / Antrepo' },
                            { key: 'otel', label: '🏨 Otel / Pansiyon' },
                          ].map((ct) => (
                            <button
                              key={ct.key}
                              onClick={() => setCommercialTypeFilter(ct.key)}
                              className={`py-2 rounded-xl text-[10px] font-bold border cursor-pointer transition-all ${
                                commercialTypeFilter === ct.key ? "bg-blue-600 text-white border-blue-700 font-black shadow-xs" : "bg-white text-slate-700 border-blue-200 hover:bg-blue-100"
                              }`}
                            >
                              {ct.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Devren & Kiracı Durumu */}
                      <div>
                        <label className="block text-[10px] font-bold text-blue-950 uppercase tracking-wider mb-1.5">Devir & Kiracı Durumu</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { key: 'all', label: 'Tümü' },
                            { key: 'empty', label: '🔑 Boş / Kullanıma Hazır' },
                            { key: 'devren', label: '🔄 Devren Satılık' },
                            { key: 'tenant', label: '📈 Hazır Kiracılı' },
                          ].map((cd) => (
                            <button
                              key={cd.key}
                              onClick={() => setCommercialDevirFilter(cd.key)}
                              className={`py-2 rounded-xl text-[10px] font-bold border cursor-pointer transition-all ${
                                commercialDevirFilter === cd.key ? "bg-blue-600 text-white border-blue-700 font-black shadow-xs" : "bg-white text-slate-700 border-blue-200 hover:bg-blue-100"
                              }`}
                            >
                              {cd.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* === CASE 3: KONUT / DAİRE / VİLLA ÖZEL FİLTRELERİ === */}
                  {(activeCategory === 'residence' || activeCategory === 'villa' || activeCategory === 'all') && (
                    <>
                      {/* Oda Sayısı */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Oda Sayısı</label>
                        <div className="grid grid-cols-4 gap-2">
                          {['all', '1+1', '2+1', '3+1', '4+1', '4+2', 'Penthouse'].map((rm) => (
                            <button
                              key={rm}
                              onClick={() => setSelectedRooms(rm)}
                              className={`py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                                selectedRooms === rm ? "bg-amber-500 text-slate-950 border-amber-600 font-black shadow-xs" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {rm === 'all' ? 'Tümü' : rm}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Eşya Durumu */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Eşya Durumu</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { key: 'all', label: 'Tümü' },
                            { key: 'full', label: '🛋️ Full Eşyalı' },
                            { key: 'unfurnished', label: '📦 Eşyasız' },
                          ].map((fn) => (
                            <button
                              key={fn.key}
                              onClick={() => setFurnishedFilter(fn.key)}
                              className={`py-2 rounded-xl text-[10px] font-bold border cursor-pointer transition-all ${
                                furnishedFilter === fn.key ? "bg-amber-500 text-slate-950 border-amber-600 font-black shadow-xs" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {fn.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Trafo Bedeli & KDV */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Trafo Bedeli</label>
                          <select
                            value={trafoPaidFilter}
                            onChange={(e) => setTrafoPaidFilter(e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                          >
                            <option value="all">Tümü</option>
                            <option value="paid">✅ Ödendi</option>
                            <option value="unpaid">⏳ Ödenecek</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">KDV Durumu</label>
                          <select
                            value={kdvFilter}
                            onChange={(e) => setKdvFilter(e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                          >
                            <option value="all">Tümü</option>
                            <option value="paid">KDV Ödendi</option>
                            <option value="to_be_paid">KDV Ödenecek</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 space-y-3">
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Sonuçları Göster ({filteredProducts.length} Portföy)
                </button>
                <button
                  onClick={handleResetFilters}
                  className="w-full py-2.5 bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer"
                >
                  Filtreleri Temizle
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



    </div>
  );
};
