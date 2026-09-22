import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  CheckCircle2,
  X,
  Barcode,
  Package,
  Printer,
  Calendar,
  TrendingUp,
  RefreshCw,
  FileText,
  ArrowLeft,
  Coffee,
  ArrowLeftRight,
  MessageSquare,
  QrCode,
  Clock,
  Flame,
  Scale,
  Split,
  Divide,
  Bell,
  Building2,
  Gift,
  Tag,
  UserCheck
} from "lucide-react";
import { translations } from "../translations";
import { useLanguage } from "../contexts/LanguageContext";
import { useNetwork } from "../contexts/NetworkContext";
import { translateText } from "../utils/translator";
import { 
  TableGrid, 
  getStoredTableNicknames, 
  saveTableNickname, 
  clearStoredTableNickname, 
  transferStoredTableNickname 
} from './TableGrid';
import { api } from "../services/api";
import { matchesSearch, normalizeSearch } from "../lib/searchUtils";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { printThermalReceipt, printThermalZReport } from "../utils/thermalPrinter";
import { RoomTransferModal } from "./horeca/RoomTransferModal";
import { HotelRoom } from "./horeca/HotelRoomManagement";
import { PosServiceCallsBanner } from "./fastpos/PosServiceCallsBanner";
import { PosHeaderToolbar } from "./fastpos/PosHeaderToolbar";
import { PosTableGridView } from "./fastpos/PosTableGridView";
import { PosProductGridView } from "./fastpos/PosProductGridView";
import { PosOpenBillsPanel } from "./fastpos/PosOpenBillsPanel";
import { PosCartPanel } from "./fastpos/PosCartPanel";
import { PosModalsContainer } from "./fastpos/PosModalsContainer";

interface FastPosTabProps {
  storeId?: number;
  onSaleComplete?: () => void;
  branding?: any;
  activeStaffRole?: 'manager' | 'cashier' | 'waiter';
  setShowQuickProductModal?: (show: boolean) => void;
  setQuickProductForm?: (form: any) => void;
}

const FastPosTab = ({ storeId, onSaleComplete, branding, activeStaffRole = 'manager', setShowQuickProductModal, setQuickProductForm }: FastPosTabProps) => {
  const { lang } = useLanguage();
  const { isOnline } = useNetwork();
  const t = translations[lang].dashboard;
  const [searchTerm, setSearchTerm] = useState("");

  const [showCafeTools, setShowCafeTools] = useState(false);

  useEffect(() => {
    if (isOnline) {
      const pendingSales = JSON.parse(localStorage.getItem(`pendingSales_${storeId}`) || '[]');
      if (pendingSales.length > 0) {
        toast.info(lang === 'tr' ? "İnternet bağlantısı geri geldi, bekleyen satışlar senkronize ediliyor..." : "Internet connection restored, syncing pending sales...");
        pendingSales.forEach(async (sale: any) => {
          try {
            await api.createPosSale({
              items: sale.items,
              total: sale.total,
              paymentMethod: sale.paymentMethod,
              customerName: sale.customerName,
              notes: sale.notes
            }, storeId);
          } catch (e) {
            console.error("Sync error:", e);
          }
        });
        localStorage.removeItem(`pendingSales_${storeId}`);
      }
    }
  }, [isOnline, storeId]);

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_card' | 'room'>('cash');
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<number | null>(null);
  const [lastFiscal, setLastFiscal] = useState<any>(null);
  const [lastCart, setLastCart] = useState<any[]>([]);
  const [posStatus, setPosStatus] = useState<'idle' | 'waiting' | 'approved' | 'failed'>('idle');
  const [posMessage, setPosMessage] = useState("");
  const [bridgeDetected, setBridgeDetected] = useState<boolean | null>(null);

  // Z-Report and End-of-Day / Period Report states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportStartDate, setReportStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportPreset, setReportPreset] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('today');
  const [reportSearchQuery, setReportSearchQuery] = useState("");
  const [reportSortBy, setReportSortBy] = useState<'qty' | 'revenue' | 'name'>('qty');
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Printer Diagnostics & Auto-Print States
  const [showPrinterDiagnosticModal, setShowPrinterDiagnosticModal] = useState(false);
  const [printerDiagScenario, setPrinterDiagScenario] = useState<'success' | 'ip_conflict' | 'offline' | 'paper_jam'>('success');
  const [printerDiagStep, setPrinterDiagStep] = useState<'idle' | 'testing' | 'result'>('idle');

  const [autoPrintOnOrder, setAutoPrintOnOrder] = useState<boolean>(() => {
    const saved = localStorage.getItem(`pos_auto_print_order_${storeId}`);
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [autoPrintOnPay, setAutoPrintOnPay] = useState<boolean>(() => {
    const saved = localStorage.getItem(`pos_auto_print_pay_${storeId}`);
    return saved !== null ? JSON.parse(saved) : true;
  });

  const handleToggleAutoPrintOrder = () => {
    const nextVal = !autoPrintOnOrder;
    setAutoPrintOnOrder(nextVal);
    localStorage.setItem(`pos_auto_print_order_${storeId}`, JSON.stringify(nextVal));
    toast.info(nextVal ? "Sipariş kaydedildiğinde otomatik fiş yazdırılacak." : "Otomatik sipariş yazdırımı kapatıldı.");
  };

  const handleToggleAutoPrintPay = () => {
    const nextVal = !autoPrintOnPay;
    setAutoPrintOnPay(nextVal);
    localStorage.setItem(`pos_auto_print_pay_${storeId}`, JSON.stringify(nextVal));
    toast.info(nextVal ? "Ödeme alındığında otomatik fiş yazdırılacak." : "Otomatik ödeme fişi yazdırımı kapatıldı.");
  };

  const [showIkramNoteModal, setShowIkramNoteModal] = useState(false);
  const [ikramNote, setIkramNote] = useState('');
  const [pendingIkramAction, setPendingIkramAction] = useState<(() => void) | null>(null);

  const getFinalNote = (baseNote: string) => baseNote + (ikramNote ? ` | İkram Açıklaması: ${ikramNote}` : '');

  const executeWithIkramCheck = (action: () => void) => {
    if (cart.length === 0) return;
    const hasIkram = cart.some(item => parseFloat(item.price) === 0 || (item.note && item.note.toLowerCase().includes('i̇kram')) || (item.note && item.note.toLowerCase().includes('ikram')));
    if (hasIkram) {
      if (!ikramNote || ikramNote.trim().length < 3) {
        setPendingIkramAction(() => action);
        setShowIkramNoteModal(true);
        return;
      }
    }
    action();
  };

  const isCafeRestaurant = branding?.store_type === 'cafe_restaurant' || branding?.page_layout_settings?.sector === 'cafe_restaurant';
  const isHotelActive = isCafeRestaurant && Boolean(branding?.hotel_module_enabled);
  const [showRoomTransferModal, setShowRoomTransferModal] = useState(false);

  // Happy Hours state and configuration
  const [showHappyHourModal, setShowHappyHourModal] = useState(false);
  const [happyHourConfig, setHappyHourConfig] = useState({
    startHour: 14,
    endHour: 18,
    isEnabled: true
  });
  const [happyHourActive, setHappyHourActive] = useState(false);
  const [forceHappyHour, setForceHappyHour] = useState<boolean | null>(null);

  // Automatically check for happy hour schedule
  useEffect(() => {
    if (!isCafeRestaurant || !happyHourConfig.isEnabled) {
      setHappyHourActive(false);
      return;
    }
    const checkHappyHour = () => {
      const now = new Date();
      const currentHour = now.getHours();
      if (currentHour >= happyHourConfig.startHour && currentHour < happyHourConfig.endHour) {
        setHappyHourActive(true);
      } else {
        setHappyHourActive(false);
      }
    };
    checkHappyHour();
    const interval = setInterval(checkHappyHour, 10000); // Check every 10 seconds for instant feedback
    return () => clearInterval(interval);
  }, [happyHourConfig]);

  const isHappyHourActive = forceHappyHour !== null ? forceHappyHour : happyHourActive;

  // Cafe/Restaurant Table and Adisyon states
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  useEffect(() => {
    const handleOpenReport = () => setShowReportModal(true);
    const handleOpenTableQr = () => setShowQrModal(true);
    window.addEventListener('open-pos-report', handleOpenReport);
    window.addEventListener('open-table-qr', handleOpenTableQr);
    return () => {
      window.removeEventListener('open-pos-report', handleOpenReport);
      window.removeEventListener('open-table-qr', handleOpenTableQr);
    };
  }, []);
  const [pendingSales, setPendingSales] = useState<any[]>([]);
  const [prevPendingCount, setPrevPendingCount] = useState<number | null>(null);
  const [tablesRefreshTrigger, setTablesRefreshTrigger] = useState(0);
  const [loadingPending, setLoadingPending] = useState(false);
  const lastSoundPlayedRef = useRef<number>(0);
  const [activeSaleId, setActiveSaleId] = useState<number | null>(null);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitPayments, setSplitPayments] = useState<Array<{ method: 'cash' | 'credit_card'; amount: string }>>([]);
  const [splitTab, setSplitTab] = useState<'item_split' | 'amount_split'>('item_split');
  const [selectedSplitItems, setSelectedSplitItems] = useState<Record<number, number>>({});
  const [partialPayMethod, setPartialPayMethod] = useState<'cash' | 'credit_card'>('cash');
  const [isChangingTable, setIsChangingTable] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [allTables, setAllTables] = useState<any[]>([]);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrModalTab, setQrModalTab] = useState<'single' | 'all' | 'manage'>('single');
  const [newTableCount, setNewTableCount] = useState<number>(branding?.page_layout_settings?.table_count || 12);
  const [savingTableCount, setSavingTableCount] = useState(false);
  const [singleQrTable, setSingleQrTable] = useState<string>("1");

  useEffect(() => {
    if (selectedTable) {
      setSingleQrTable(selectedTable);
    } else if (allTables.length > 0) {
      setSingleQrTable(allTables[0].table_number);
    }
  }, [selectedTable, allTables]);

  useEffect(() => {
    if (branding?.page_layout_settings?.table_count) {
      setNewTableCount(branding.page_layout_settings.table_count);
    }
  }, [branding]);

  const [storeTableCalls, setStoreTableCalls] = useState<any[]>([]);
  const [tableNicknames, setTableNicknames] = useState<Record<string, string>>({});
  const [activeNicknameModal, setActiveNicknameModal] = useState<string | null>(null);
  const [activeNicknameInput, setActiveNicknameInput] = useState('');

  useEffect(() => {
    if (!storeId) return;
    const loadNicks = () => {
      setTableNicknames(getStoredTableNicknames(storeId));
    };
    loadNicks();
    const handleUpdated = () => loadNicks();
    window.addEventListener(`table-nicknames-updated-${storeId}`, handleUpdated);
    return () => {
      window.removeEventListener(`table-nicknames-updated-${storeId}`, handleUpdated);
    };
  }, [storeId]);
  useEffect(() => {
    const fetchTableCalls = () => {
      try {
        const calls = JSON.parse(localStorage.getItem(`storeTableCalls_${storeId}`) || '[]');
        setStoreTableCalls(Array.isArray(calls) ? calls.filter((c: any) => c.status === 'pending') : []);
      } catch (e) {
        console.error("Error reading storeTableCalls:", e);
      }
    };
    fetchTableCalls();
    const interval = setInterval(fetchTableCalls, 3000);
    return () => clearInterval(interval);
  }, [storeId]);

  const handleResolveTableCall = (callId: number) => {
    try {
      const calls = JSON.parse(localStorage.getItem(`storeTableCalls_${storeId}`) || '[]');
      const updated = calls.map((c: any) => c.id === callId ? { ...c, status: 'resolved' } : c);
      localStorage.setItem(`storeTableCalls_${storeId}`, JSON.stringify(updated));
      setStoreTableCalls(updated.filter((c: any) => c.status === 'pending'));
    } catch (e) {
      console.error("Error resolving call:", e);
    }
  };

  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("all");
  const [variantModalProduct, setVariantModalProduct] = useState<any | null>(null);

  const categories = React.useMemo(() => {
    const cats = new Set<string>();
    allProducts.forEach(p => {
      if (p.category) cats.add(p.category.trim());
      if (p.category_2) cats.add(p.category_2.trim());
    });
    return Array.from(cats);
  }, [allProducts]);

  const subCategories = React.useMemo(() => {
    if (selectedCategory === "all") return [];
    const subs = new Set<string>();
    allProducts.forEach(p => {
      if (p.category === selectedCategory || p.category_2 === selectedCategory) {
        if (p.category === selectedCategory && p.sub_category) subs.add(p.sub_category.trim());
        if (p.category_2 === selectedCategory && p.sub_category_2) subs.add(p.sub_category_2.trim());
      }
    });
    return Array.from(subs);
  }, [allProducts, selectedCategory]);

  const filteredProducts = React.useMemo(() => {
    const trimmed = searchTerm.trim();

    if (trimmed.length > 0) {
      const sourceList = allProducts.length > 0 ? allProducts : searchResults;
      let list = sourceList.filter((p) => {
        const basicMatch = matchesSearch(p, trimmed, [
          "name",
          "barcode",
          "category",
          "sub_category",
          "category_2",
          "sub_category_2",
          "description",
          "brand"
        ]);
        if (basicMatch) return true;

        if (Array.isArray(p.variants)) {
          const normTerm = normalizeSearch(trimmed);
          const varMatch = p.variants.some((v: any) => 
            normalizeSearch(v.name || '').includes(normTerm) || 
            normalizeSearch(v.barcode || '').includes(normTerm)
          );
          if (varMatch) return true;
        }

        if (Array.isArray(p.labels)) {
          const normTerm = normalizeSearch(trimmed);
          const labelMatch = p.labels.some((lbl: any) => normalizeSearch(String(lbl)).includes(normTerm));
          if (labelMatch) return true;
        }

        return false;
      });

      if (list.length === 0 && searchResults.length > 0) {
        list = searchResults;
      }

      return list;
    }

    let list = allProducts.length > 0 ? allProducts : searchResults;
    if (selectedCategory !== "all") {
      list = list.filter((p) => p.category === selectedCategory || p.category_2 === selectedCategory);
      if (selectedSubCategory !== "all") {
        list = list.filter((p) => 
          (p.category === selectedCategory && p.sub_category === selectedSubCategory) ||
          (p.category_2 === selectedCategory && p.sub_category_2 === selectedSubCategory)
        );
      }
    }
    return list;
  }, [allProducts, searchResults, searchTerm, selectedCategory, selectedSubCategory]);

  const fetchPendingSales = async (isPoll: boolean = false) => {
    if (!isCafeRestaurant) return;
    try {
      if (!isPoll) setLoadingPending(true);
      const res = await api.getSales('pending', '', '', storeId);
      if (Array.isArray(res)) {
        setPendingSales(res);
        setTablesRefreshTrigger(prev => prev + 1);

        if (prevPendingCount !== null && res.length > prevPendingCount) {
          // Play a "bell" style alert sound
          const now = Date.now();
          if (now - lastSoundPlayedRef.current > 2000) {
            lastSoundPlayedRef.current = now;
            try {
              const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
              if (AudioContextClass) {
                const audioCtx = new AudioContextClass();
                const gainNode = audioCtx.createGain();
                gainNode.connect(audioCtx.destination);
                
                // Envelope: Instant attack, long decay
                gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 2.5);

                // Harmonics (Bell synthesis)
                const baseFreq = 440; // A4
                const harmonics = [1, 2, 3, 4.1, 5.2]; // Fundamental + overtones
                
                harmonics.forEach((ratio) => {
                  const osc = audioCtx.createOscillator();
                  osc.connect(gainNode);
                  osc.type = 'sine'; // Sine waves are best for bell overtones
                  osc.frequency.setValueAtTime(baseFreq * ratio, audioCtx.currentTime);
                  osc.start();
                  osc.stop(audioCtx.currentTime + 2.5);
                });
              }
            } catch (soundErr) {
              console.log("Audio play blocked by browser policies:", soundErr);
            }
          }
          toast.success(lang === 'tr' ? "Yeni masa siparişi alındı!" : "New table order received!");
        }
        setPrevPendingCount(res.length);
      }
    } catch (e) {
      console.error("Error fetching pending sales:", e);
    } finally {
      if (!isPoll) setLoadingPending(false);
    }
  };

  useEffect(() => {
    if (!isCafeRestaurant) return;
    
    fetchPendingSales();
    
    // Poll for updates every 30 seconds to keep order state fresh
    const interval = setInterval(() => {
      fetchPendingSales(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [storeId, isCafeRestaurant]); // Removed prevPendingCount

  const fetchReport = async (startDateStr: string, endDateStr?: string) => {
    try {
      setReportLoading(true);
      const endStr = endDateStr || startDateStr;
      const data = await api.getPosDailyReport(startDateStr, storeId, endStr);
      if (data && data.success) {
        // Aggregate identical products regardless of notes appended in parentheses, numeric prefixes, or casing
        const aggregatedMap = new Map<string, { product_name: string; total_quantity: number; total_revenue: number }>();
        (data.products || []).forEach((p: any) => {
          let cleanName = (p.product_name || '').trim();
          // Strip leading numeric indexing if present (e.g. "1. ", "3. ", "14. ")
          cleanName = cleanName.replace(/^[0-9]+[.)\s-]+/, '').trim();
          // Strip trailing parenthetical notes repeatedly (e.g. "(Özgür)", "(Selçuk 1 ...)", "(İkram)")
          while (/\s*\([^)]*\)\s*$/.test(cleanName)) {
            cleanName = cleanName.replace(/\s*\([^)]*\)\s*$/, '').trim();
          }
          if (!cleanName) cleanName = (p.product_name || '').trim();

          const key = cleanName.toLowerCase();
          const qty = Number(p.total_quantity) || 0;
          const rev = Number(p.total_revenue) || 0;
          if (aggregatedMap.has(key)) {
            const existing = aggregatedMap.get(key)!;
            existing.total_quantity += qty;
            existing.total_revenue += rev;
          } else {
            aggregatedMap.set(key, {
              product_name: cleanName,
              total_quantity: qty,
              total_revenue: rev
            });
          }
        });
        const aggregatedProducts = Array.from(aggregatedMap.values()).sort((a, b) => b.total_quantity - a.total_quantity);
        setReportData({
          ...data,
          products: aggregatedProducts
        });
      } else {
        setReportData(null);
      }
    } catch (e) {
      console.error("Error fetching POS sales report:", e);
      setReportData(null);
    } finally {
      setReportLoading(false);
    }
  };

  const handleApplyPreset = (preset: 'today' | 'yesterday' | 'week' | 'month') => {
    setReportPreset(preset);
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'today') {
      const d = formatDate(today);
      setReportStartDate(d);
      setReportEndDate(d);
      fetchReport(d, d);
    } else if (preset === 'yesterday') {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const d = formatDate(y);
      setReportStartDate(d);
      setReportEndDate(d);
      fetchReport(d, d);
    } else if (preset === 'week') {
      const w = new Date(today);
      w.setDate(w.getDate() - 6);
      const start = formatDate(w);
      const end = formatDate(today);
      setReportStartDate(start);
      setReportEndDate(end);
      fetchReport(start, end);
    } else if (preset === 'month') {
      const m = new Date(today.getFullYear(), today.getMonth(), 1);
      const start = formatDate(m);
      const end = formatDate(today);
      setReportStartDate(start);
      setReportEndDate(end);
      fetchReport(start, end);
    }
  };

  useEffect(() => {
    if (showReportModal) {
      fetchReport(reportStartDate, reportEndDate);
    }
  }, [showReportModal, reportStartDate, reportEndDate]);

  // Isolated high-quality 80mm thermal slip printing
  const handlePrintReceipt = (overrideOptions?: any) => {
    if (overrideOptions && typeof overrideOptions === 'object' && !('target' in overrideOptions)) {
      printThermalReceipt({
        storeName: branding?.store_name || branding?.name || 'TELOCA CAFE',
        storePhone: branding?.phone || branding?.whatsapp_number,
        ...overrideOptions
      });
      return;
    }

    const itemsToPrint = cart.map(it => ({
      name: it.name,
      quantity: it.quantity,
      price: it.price,
      note: it.note
    }));

    const calculatedTotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * item.quantity, 0);

    printThermalReceipt({
      title: selectedTable ? "ADİSYON FİŞİ" : "SATIŞ FİŞİ",
      storeName: branding?.store_name || branding?.name || 'TELOCA CAFE',
      storePhone: branding?.phone || branding?.whatsapp_number,
      tableNo: selectedTable || "Hızlı Kasa",
      saleId: activeSaleId || undefined,
      items: itemsToPrint,
      totalAmount: calculatedTotal,
      paymentMethod: paymentMethod === 'cash' ? 'NAKİT' : (paymentMethod === 'credit_card' ? 'KREDİ KARTI' : 'SİPARİŞ')
    });
  };

  const handlePrintTableBill = (sale: any) => {
    if (!sale) return;
    const itemsToPrint = (sale.items || []).map((it: any) => ({
      name: it.product_name || it.name,
      quantity: Math.floor(Number(it.quantity)) || 1,
      price: it.unit_price || it.price || 0,
      note: it.note || ''
    }));

    printThermalReceipt({
      title: "ADİSYON FİŞİ",
      storeName: branding?.store_name || branding?.name || 'TELOCA CAFE',
      storePhone: branding?.phone || branding?.whatsapp_number,
      tableNo: sale.customer_name || "Masa",
      saleId: sale.id,
      items: itemsToPrint,
      totalAmount: parseFloat(sale.total_amount) || 0,
      paymentMethod: "SİPARİŞ / ÖDENMEDİ",
      notes: sale.notes || undefined
    });
  };

  const handlePrintReport = () => {
    if (!reportData) return;

    const cashAmount = reportData.payments?.filter((p: any) => ['cash', 'nakit'].includes(p.payment_method?.toLowerCase()))?.reduce((sum: number, p: any) => sum + (Number(p.total_amount) || 0), 0) || 0;
    const cardAmount = reportData.payments?.filter((p: any) => ['credit_card', 'card', 'kredi_karti', 'pos'].includes(p.payment_method?.toLowerCase()))?.reduce((sum: number, p: any) => sum + (Number(p.total_amount) || 0), 0) || 0;
    const otherAmount = reportData.payments?.filter((p: any) => !['cash', 'nakit', 'credit_card', 'card', 'kredi_karti', 'pos'].includes(p.payment_method?.toLowerCase()))?.reduce((sum: number, p: any) => sum + (Number(p.total_amount) || 0), 0) || 0;
    const totalAmount = reportData.grand_total || (reportData.payments?.reduce((s: number, p: any) => s + (Number(p.total_amount) || 0), 0)) || 0;
    const isRange = reportStartDate !== reportEndDate;
    const dateLabel = isRange ? `${reportStartDate} - ${reportEndDate}` : reportStartDate;
    const totalItems = reportData.products?.reduce((sum: number, p: any) => sum + (Number(p.total_quantity) || 0), 0) || 0;

    printThermalZReport({
      title: isRange ? "SATIŞ & CİRO DÖNEM RAPORU" : "GÜN SONU Z RAPORU",
      storeName: branding?.store_name || branding?.name || 'LOOKPRICE HORECA',
      reportDate: dateLabel,
      isRange: isRange,
      cashTotal: cashAmount,
      cardTotal: cardAmount,
      otherTotal: otherAmount,
      grandTotal: totalAmount,
      saleCount: reportData.total_sales || 0,
      totalItemsSold: totalItems,
      products: reportData.products || []
    });
  };

  const handlePrintA4Report = () => {
    if (!reportData) return;
    const isRange = reportStartDate !== reportEndDate;
    const dateLabel = isRange ? `${reportStartDate} — ${reportEndDate}` : reportStartDate;
    const storeTitle = branding?.store_name || branding?.name || 'LOOKPRICE RESTORAN & POS';
    const cashAmount = reportData.payments?.filter((p: any) => ['cash', 'nakit'].includes(p.payment_method?.toLowerCase()))?.reduce((sum: number, p: any) => sum + (Number(p.total_amount) || 0), 0) || 0;
    const cardAmount = reportData.payments?.filter((p: any) => ['credit_card', 'card', 'kredi_karti', 'pos'].includes(p.payment_method?.toLowerCase()))?.reduce((sum: number, p: any) => sum + (Number(p.total_amount) || 0), 0) || 0;
    const grandTotal = reportData.grand_total || (reportData.payments?.reduce((sum: number, p: any) => sum + (Number(p.total_amount) || 0), 0)) || 0;
    const totalItems = reportData.products?.reduce((sum: number, p: any) => sum + (Number(p.total_quantity) || 0), 0) || 0;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "100px";
    iframe.style.height = "100px";
    iframe.style.border = "none";
    iframe.style.opacity = "0.01";
    iframe.style.zIndex = "-999";
    document.body.appendChild(iframe);

    const productRows = (reportData.products || []).map((p: any, idx: number) => `
      <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
        <td style="padding: 8px 12px; font-weight: bold; color: #1e293b; text-align: left;">${idx + 1}. ${p.product_name}</td>
        <td style="padding: 8px 12px; text-align: center; font-weight: 700; color: #4f46e5;">${p.total_quantity} Adet</td>
        <td style="padding: 8px 12px; text-align: right; color: #64748b;">${(p.total_revenue / p.total_quantity).toFixed(2)} ₺</td>
        <td style="padding: 8px 12px; text-align: right; font-weight: 800; color: #0f172a;">${(p.total_revenue || 0).toFixed(2)} ₺</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${storeTitle} - ${isRange ? 'Dönem Satış Raporu' : 'Gün Sonu Raporu'}</title>
          <style>
            @media print {
              @page { size: A4 portrait; margin: 12mm; }
              body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.4; margin: 0; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background-color: #f1f5f9; padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
          </style>
        </head>
        <body>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #6366f1; padding-bottom: 15px; margin-bottom: 20px;">
            <div>
              <h1 style="font-size: 22px; margin: 0; color: #1e1b4b; font-weight: 900; text-transform: uppercase;">${storeTitle}</h1>
              <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 700; color: #6366f1;">${isRange ? 'DÖNEMLİK SATIŞ & CİRO RAPORU' : 'GÜN SONU Z RAPORU'}</p>
            </div>
            <div style="text-align: right; font-size: 12px; color: #64748b;">
              <p style="margin: 0; font-weight: 800; color: #0f172a; font-size: 13px;">Tarih: ${dateLabel}</p>
              <p style="margin: 3px 0 0 0;">Yazdırma: ${new Date().toLocaleString('tr-TR')}</p>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
              <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Toplam Ciro</span>
              <p style="font-size: 18px; font-weight: 900; color: #4f46e5; margin: 4px 0 0 0;">${grandTotal.toFixed(2)} ₺</p>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
              <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Nakit Tahsilat</span>
              <p style="font-size: 18px; font-weight: 900; color: #059669; margin: 4px 0 0 0;">${cashAmount.toFixed(2)} ₺</p>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
              <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Kredi Kartı / POS</span>
              <p style="font-size: 18px; font-weight: 900; color: #2563eb; margin: 4px 0 0 0;">${cardAmount.toFixed(2)} ₺</p>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
              <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Toplam Satılan Adet</span>
              <p style="font-size: 18px; font-weight: 900; color: #0f172a; margin: 4px 0 0 0;">${totalItems} Adet</p>
            </div>
          </div>

          <h3 style="font-size: 14px; font-weight: 800; color: #334155; margin: 25px 0 5px 0; text-transform: uppercase;">Satılan Ürün Dağılımı ve Gelir Tablosu</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 45%;">Ürün Adı</th>
                <th style="width: 15%; text-align: center;">Satılan Adet</th>
                <th style="width: 20%; text-align: right;">Birim Fiyat (Ort.)</th>
                <th style="width: 20%; text-align: right;">Toplam Tutar</th>
              </tr>
            </thead>
            <tbody>
              ${productRows || '<tr><td colspan="4" style="text-align:center; padding: 20px; color: #94a3b8;">Kayıt bulunamadı.</td></tr>'}
            </tbody>
            <tfoot>
              <tr style="background: #f1f5f9; font-weight: 900; border-top: 2px solid #94a3b8;">
                <td style="padding: 10px 12px;">GENEL TOPLAM</td>
                <td style="padding: 10px 12px; text-align: center; color: #4f46e5;">${totalItems} Adet</td>
                <td style="padding: 10px 12px; text-align: right;">—</td>
                <td style="padding: 10px 12px; text-align: right; color: #4f46e5; font-size: 15px;">${grandTotal.toFixed(2)} ₺</td>
              </tr>
            </tfoot>
          </table>

          <div style="margin-top: 50px; display: flex; justify-content: space-between; font-size: 12px; color: #64748b; padding-top: 20px; border-top: 1px dashed #cbd5e1;">
            <div>
              <p style="font-weight: 700; margin: 0 0 40px 0;">Kasiyer / Yetkili</p>
              <p style="margin: 0;">İmza: _______________________</p>
            </div>
            <div style="text-align: right;">
              <p style="font-weight: 700; margin: 0 0 40px 0;">Mağaza / İşletme Onayı</p>
              <p style="margin: 0;">İmza: _______________________</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error("A4 print error:", e);
        }
        setTimeout(() => {
          try { iframe.remove(); } catch (e) {}
        }, 1000);
      }, 400);
    }
  };

  const handlePrintSingleQr = (tableNum: string) => {
    const cleanNum = tableNum.replace(/Masa/gi, '').trim();
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + "/digital-menu/" + storeId + "/" + cleanNum)}`;
    const storeTitle = branding?.store_name || branding?.name || 'Seçkin Restoran';
    
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "100px";
    iframe.style.height = "100px";
    iframe.style.border = "none";
    iframe.style.opacity = "0.01";
    iframe.style.zIndex = "-999";
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Masa ${cleanNum} QR Kodu</title>
            <style>
              @media print {
                @page { margin: 0; size: auto; }
                html, body { background: white !important; color: black !important; margin: 0 !important; width: 100% !important; visibility: visible !important; }
              }
              body { 
                font-family: system-ui, -apple-system, sans-serif; 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center; 
                text-align: center; 
                padding: 40px; 
                color: #0f172a; 
                background: white;
              }
              .card { 
                border: 3px solid #e2e8f0; 
                border-radius: 24px; 
                padding: 40px; 
                max-width: 320px; 
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); 
                display: flex;
                flex-direction: column;
                align-items: center;
              }
              .logo { 
                font-size: 18px;
                font-weight: 800;
                color: #0f172a;
                text-transform: uppercase;
                margin-bottom: 4px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 280px;
              }
              h2 { 
                font-size: 32px; 
                font-weight: 900; 
                color: #e11d48;
                margin: 6px 0; 
                text-transform: uppercase; 
                letter-spacing: -0.5px; 
              }
              p.menu-sub { 
                font-size: 12px; 
                color: #64748b; 
                margin: 0 0 20px 0; 
                font-weight: 700; 
                letter-spacing: 1.5px;
              }
              .qr-container {
                background: #f8fafc;
                padding: 16px;
                border-radius: 20px;
                border: 1px solid #e2e8f0;
                margin-bottom: 20px;
              }
              .qr-container img { 
                width: 200px; 
                height: 200px; 
                display: block;
              }
              p.instructions {
                font-size: 12px;
                color: #475569;
                font-weight: 600;
                line-height: 1.4;
                margin: 0 0 16px 0;
                max-width: 240px;
              }
              .footer { 
                font-size: 9px; 
                color: #94a3b8; 
                text-transform: uppercase; 
                font-weight: 800; 
                letter-spacing: 1px; 
              }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="logo">${storeTitle}</div>
              <h2>MASA ${cleanNum}</h2>
              <p class="menu-sub">DİJİTAL MENÜ</p>
              <div class="qr-container">
                <img src="${qrUrl}" alt="Masa ${cleanNum}" />
              </div>
              <p class="instructions">
                ${lang === 'tr' ? 'Menüyü incelemek ve sipariş vermek için QR kodu cep telefonunuzla taratın.' : 'Scan the QR code with your phone to view menu and order.'}
              </p>
              <div class="footer">POWERED BY LOOKPRICE</div>
            </div>
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error("Print error:", e);
        }
        setTimeout(() => {
          try { iframe.remove(); } catch (e) {}
        }, 1000);
      }, 500);
    }
  };

  const handlePrintAllQrs = () => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "100px";
    iframe.style.height = "100px";
    iframe.style.border = "none";
    iframe.style.opacity = "0.01";
    iframe.style.zIndex = "-999";
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      
      const tablesHtml = allTables.map((table) => {
        const cleanNum = table.table_number.replace(/Masa/gi, '').trim();
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + "/digital-menu/" + storeId + "/" + cleanNum)}`;
        return `
          <div class="qr-card">
            <div class="logo-text">${branding?.store_name || branding?.name || 'Seçkin Restoran'}</div>
            <div class="table-title">MASA ${cleanNum}</div>
            <div class="subtitle">DİJİTAL MENÜ</div>
            <div class="qr-container">
              <img src="${qrUrl}" alt="Masa ${cleanNum}" />
            </div>
            <div class="instructions">
              ${lang === 'tr' ? 'Menüyü incelemek ve sipariş vermek için QR kodu cep telefonunuzla taratın.' : 'Scan the QR code with your phone to view menu and order.'}
            </div>
            <div class="footer-powered">POWERED BY LOOKPRICE</div>
          </div>
        `;
      }).join('');

      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Tüm Masalar QR Kodları</title>
            <style>
              @media print {
                @page { margin: 0; size: auto; }
                html, body {
                  margin: 0;
                  padding: 0;
                  background: white;
                  visibility: visible !important;
                }
                .page {
                  page-break-after: always;
                }
              }
              body { 
                font-family: system-ui, -apple-system, sans-serif; 
                background-color: #f8fafc;
                margin: 0;
                padding: 20px;
                display: flex;
                flex-wrap: wrap;
                gap: 24px;
                justify-content: center;
              }
              .qr-card { 
                background: white;
                border: 3px solid #e2e8f0; 
                border-radius: 20px; 
                padding: 30px; 
                width: 280px; 
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: space-between;
                box-sizing: border-box;
                page-break-inside: avoid;
              }
              .logo-text { 
                font-size: 16px;
                font-weight: 800;
                color: #0f172a;
                text-transform: uppercase;
                margin-bottom: 4px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 240px;
              }
              .table-title { 
                font-size: 26px; 
                font-weight: 900; 
                color: #e11d48;
                margin: 4px 0;
                letter-spacing: -0.5px; 
              }
              .subtitle {
                font-size: 11px;
                font-weight: 700;
                color: #64748b;
                letter-spacing: 1.5px;
                text-transform: uppercase;
                margin-bottom: 12px;
              }
              .qr-container { 
                background-color: #f8fafc;
                padding: 12px;
                border-radius: 16px;
                border: 1px solid #f1f5f9;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .qr-container img {
                width: 180px; 
                height: 180px; 
                display: block;
              }
              .instructions { 
                font-size: 11px; 
                color: #475569; 
                margin: 0 0 12px 0; 
                font-weight: 600; 
                line-height: 1.4;
                max-width: 220px;
              }
              .footer-powered { 
                font-size: 8px; 
                color: #94a3b8; 
                text-transform: uppercase; 
                font-weight: 800; 
                letter-spacing: 1px; 
              }
            </style>
          </head>
          <body>
            ${tablesHtml}
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error("Print error:", e);
        }
        setTimeout(() => {
          try { iframe.remove(); } catch (e) {}
        }, 1000);
      }, 600);
    }
  };

  const handleSaveTableCount = async () => {
    if (newTableCount < 1 || newTableCount > 200) {
      toast.error(lang === 'tr' ? "Lütfen 1 ile 200 arasında bir masa sayısı girin." : "Please enter a table count between 1 and 200.");
      return;
    }
    setSavingTableCount(true);
    try {
      const updatedBranding = {
        ...(branding || {}),
        page_layout_settings: {
          ...(branding?.page_layout_settings || {}),
          table_count: newTableCount
        }
      };
      await api.updateBranding(updatedBranding, storeId);
      toast.success(lang === 'tr' ? "Masa sayısı başarıyla güncellendi." : "Table count updated successfully.");
      
      // Refresh the table list from server
      const tablesRes = await api.getRestaurantTables(storeId!);
      if (Array.isArray(tablesRes)) {
        setAllTables(tablesRes);
        setTablesRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.error("Error updating table count:", err);
      toast.error(lang === 'tr' ? "Masa sayısı güncellenirken hata oluştu." : "Error updating table count.");
    } finally {
      setSavingTableCount(false);
    }
  };

  const handlePrintQr = () => {
    handlePrintSingleQr(singleQrTable);
  };

  useEffect(() => {
    const checkBridge = async () => {
      try {
        const bridgeIp = branding?.pos_bridge_ip || '127.0.0.1';
        const bridgePort = branding?.pos_bridge_port || '1616';
        const res = await fetch(`http://${bridgeIp}:${bridgePort}/pos/sale`, { 
          method: 'OPTIONS',
          signal: AbortSignal.timeout(1000)
        }).catch(() => null);
        setBridgeDetected(!!res || res === null); // If it responds or at least doesn't throw immediately
      } catch (e) {
        setBridgeDetected(false);
      }
    };
    
    if (branding?.pos_bridge_enabled) {
      checkBridge();
      const interval = setInterval(checkBridge, 10000);
      return () => clearInterval(interval);
    } else {
      setBridgeDetected(null);
    }
  }, [branding?.pos_bridge_enabled, branding?.pos_bridge_ip, branding?.pos_bridge_port]);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const fetchAllProducts = async () => {
      setLoading(true);
      try {
        const res = await api.getProducts("", storeId, false, true);
        const products = Array.isArray(res) ? res : [];
        setSearchResults(products);
        setAllProducts(products);
      } catch (error) {
        console.error("Fetch all products error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllProducts();
  }, [storeId]);

  useEffect(() => {
    const fetchProducts = async () => {
      const trimmed = searchTerm.trim();
      if (trimmed.length > 0) {
        // Check if scanned value is a table QR code
        const tableUrlMatch = trimmed.match(/\/digital-menu\/\d+\/(.+)/);
        if (tableUrlMatch) {
          const decodedTableNumber = decodeURIComponent(tableUrlMatch[1]);
          setSelectedTable(decodedTableNumber);
          setSearchTerm("");
          return;
        }

        try {
          const res = await api.getProducts(trimmed, storeId, false, true);
          const products = Array.isArray(res) ? res : [];
          setSearchResults(products);
          
          // If exact barcode match, add to cart immediately
          const exactMatch = (allProducts.length > 0 ? allProducts : products).find(
            (p: any) => p.barcode && p.barcode.toString().trim() === trimmed
          );
          if (exactMatch) {
            addToCart(exactMatch);
            setSearchTerm("");
          }
        } catch (error) {
          console.error("Search error:", error);
        }
      } else {
        if (allProducts.length > 0) {
          setSearchResults(allProducts);
        } else {
          try {
            const res = await api.getProducts("", storeId, false, true);
            const products = Array.isArray(res) ? res : [];
            setSearchResults(products);
            setAllProducts(products);
          } catch (error) {
            console.error("Fetch products reset error:", error);
          }
        }
      }
    };

    const delayDebounceFn = setTimeout(fetchProducts, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, storeId, allProducts]);

  const getExchangeRate = (currency: string) => {
    if (!currency || currency === (branding?.default_currency || 'TRY')) return 1;
    if (branding?.currency_rates && branding.currency_rates[currency]) {
      return parseFloat(branding.currency_rates[currency]) || 1;
    }
    return 1;
  };

  const handleProductClick = (product: any) => {
    const pHasVars = !!product.has_variants || (Array.isArray(product.variants) && product.variants.length > 0);
    if (pHasVars && Array.isArray(product.variants) && product.variants.length > 0) {
      setVariantModalProduct(product);
    } else {
      addToCart(product);
    }
  };

  const addToCart = (product: any, selectedVariant?: any) => {
    setCart(prev => {
      const variantName = selectedVariant ? selectedVariant.name : null;
      const existingIndex = prev.findIndex(item => 
        item.id === product.id && 
        ((!item.selectedVariant && !variantName) || (item.selectedVariant && item.selectedVariant.name === variantName))
      );

      const hasHappyHourPrice = isHappyHourActive && product.price_2 && parseFloat(product.price_2.toString()) > 0;
      const baseProductPrice = hasHappyHourPrice ? product.price_2 : product.price;

      const rawPrice = selectedVariant && selectedVariant.price && parseFloat(selectedVariant.price) > 0 
        ? selectedVariant.price 
        : baseProductPrice;

      const rate = getExchangeRate(product.currency || 'TRY');
      const convertedPrice = (parseFloat(rawPrice || 0) * rate).toFixed(2);

      if (existingIndex > -1) {
        return prev.map((item, idx) => 
          idx === existingIndex 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      
      const displayName = selectedVariant ? `${product.name} (${selectedVariant.name})` : product.name;

      return [...prev, { 
        ...product, 
        name: displayName,
        base_name: product.name,
        quantity: 1,
        price: convertedPrice,
        currency: branding?.default_currency || 'TRY',
        selectedVariant: selectedVariant || null,
        selected_variant_name: selectedVariant ? selectedVariant.name : null,
        selected_variant_id: selectedVariant ? selectedVariant.id : null,
        variant_id: selectedVariant ? (selectedVariant.id || selectedVariant.name) : null,
        variant_name: selectedVariant ? selectedVariant.name : null,
        variant_recipe_items: selectedVariant ? selectedVariant.recipe_items : null
      }];
    });
    setSearchTerm("");
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, idx) => idx !== index));
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => prev.map((item, idx) => {
      if (idx === index) {
        const newQty = Math.max(1, Math.floor(item.quantity + delta));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const updatePrice = (index: number, newPrice: string) => {
    setCart(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, price: newPrice };
      }
      return item;
    }));
  };

  const markAsIkram = (index: number) => {
    setCart(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { 
          ...item, 
          price: "0", 
          note: item.note ? (item.note.includes('İkram') ? item.note : `${item.note} - İkram`) : 'İkram'
        };
      }
      return item;
    }));
  };

  const markCartAsIkram = () => {
    setCart(prev => prev.map((item) => ({
      ...item,
      price: "0",
      note: item.note ? (item.note.includes('İkram') ? item.note : `${item.note} - İkram`) : 'İkram'
    })));
  };

  const updateNote = (index: number, note: string) => {
    setCart(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, note };
      }
      return item;
    }));
  };

  const total = cart.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * item.quantity), 0);

  const processFinalizeSale = async () => {
    if (cart.length === 0) return;
    
    if (paymentMethod === 'room') {
      setShowRoomTransferModal(true);
      return;
    }
    
    if (!isOnline) {
      const pendingSale = {
        id: Date.now(),
        items: cart,
        total,
        paymentMethod,
        customerName: selectedTable || 'Hızlı Satış',
        notes: getFinalNote(selectedTable ? `${selectedTable} Satışı` : 'Hızlı POS Modu'),
        timestamp: new Date().toISOString()
      };
      const pendingSales = JSON.parse(localStorage.getItem(`pendingSales_${storeId}`) || '[]');
      localStorage.setItem(`pendingSales_${storeId}`, JSON.stringify([...pendingSales, pendingSale]));
      toast.info(lang === 'tr' ? "İnternet bağlantısı yok, satış yerel olarak kaydedildi." : "No internet connection, sale saved locally.");
      setCart([]);
      setSelectedTable(null);
      if (onSaleComplete) onSaleComplete();
      setCompleting(false);
      return;
    }

    try {
      setCompleting(true);

      // POS Integration Simulation
      if (paymentMethod === 'credit_card' && branding?.pos_bridge_enabled) {
        setPosStatus('waiting');
        setPosMessage(lang === 'tr' ? `Fiziksel POS Cihazına bağlanılıyor...` : `Connecting to Physical POS...`);
        
        // Real-world bridge attempt simulation
        try {
          // We attempt to call a local bridge service (e.g. using the configured IP/Port)
          // This is a common pattern for web-to-local hardware communication
          const bridgeIp = branding?.pos_bridge_ip || '127.0.0.1';
          const bridgePort = branding?.pos_bridge_port || '1616';
          const bridgeUrl = `http://${bridgeIp}:${bridgePort}/pos/sale`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          const bridgeRes = await fetch(bridgeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: total,
              currency: branding.default_currency || 'TRY',
              ip: branding.fiscal_ip,
              port: branding.fiscal_port,
              brand: branding.fiscal_brand,
              terminalId: branding.fiscal_terminal_id
            }),
            signal: controller.signal
          }).catch(() => null);

          clearTimeout(timeoutId);

          if (!bridgeRes) {
            // If no bridge is found, we fall back to simulation but warn the user
            setPosMessage(lang === 'tr' ? "Yerel bağlantı köprüsü bulunamadı. Simülasyon modunda devam ediliyor..." : "Local bridge not found. Continuing in simulation mode...");
            await new Promise(resolve => setTimeout(resolve, 3000));
          } else {
            const data = await bridgeRes.json();
            if (data.status === 'approved') {
              setPosStatus('approved');
              setPosMessage(lang === 'tr' ? "İşlem Onaylandı!" : "Transaction Approved!");
              await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
              throw new Error(data.message || "POS Error");
            }
          }
        } catch (e) {
          console.log("Bridge connection failed, using simulation.");
        }

        if (posStatus === 'waiting') {
          await new Promise(resolve => setTimeout(resolve, 2000));
          setPosMessage(lang === 'tr' ? "Lütfen kartı takın veya yaklaştırın..." : "Please insert or tap card...");
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          setPosMessage(lang === 'tr' ? "Şifre bekleniyor..." : "Waiting for PIN...");
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          setPosMessage(lang === 'tr' ? "İşlem onaylanıyor..." : "Authorizing transaction...");
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          setPosStatus('approved');
          setPosMessage(lang === 'tr' ? "İşlem Onaylandı!" : "Transaction Approved!");
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (activeSaleId !== null) {
        // Complete an existing active pending adisyon/sale
        const res = await api.completeSale(activeSaleId, {
          paymentMethod,
          items: cart.map(item => ({
            product_id: item.id,
            product_name: item.note ? `${item.name} (${item.note})` : item.name,
            unit_price: parseFloat(item.price) || 0,
            quantity: item.quantity
          }))
        }, storeId);

        if (res.success) {
          if (autoPrintOnPay) {
            handlePrintReceipt();
          }
          if (selectedTable && storeId) {
            clearStoredTableNickname(storeId, selectedTable);
          }
          setLastSaleId(activeSaleId);
          setLastFiscal(res.fiscal);
          setLastCart(cart.map(item => ({ ...item, price: parseFloat(item.price) || 0, name: item.note ? `${item.name} (${item.note})` : item.name })));
          setShowSuccess(true);
          setCart([]);
          setActiveSaleId(null);
          setSelectedTable(null);
          fetchPendingSales(); // Refresh the active table grid!
          if (onSaleComplete) onSaleComplete();
          
          if (!res.fiscal) {
            setTimeout(() => {
              setShowSuccess(false);
            }, 3000);
          }
        }
      } else {
        // Direct cash register sale (can be standard or first-time immediately completed table)
        const currentCart = cart.map(item => ({
          ...item,
          name: item.note ? `${item.name} (${item.note})` : item.name,
          price: parseFloat(item.price) || 0
        }));
        const res = await api.createPosSale({
          items: currentCart,
          total,
          paymentMethod,
          customerName: selectedTable || 'Hızlı Satış',
          notes: getFinalNote(selectedTable ? `${selectedTable} Satışı` : 'Hızlı POS Modu'),
          currency: branding?.default_currency || 'TRY',
          exchangeRate: 1
        }, storeId);

        if (res.success) {
          if (autoPrintOnPay) {
            handlePrintReceipt();
          }
          if (selectedTable && storeId) {
            clearStoredTableNickname(storeId, selectedTable);
          }
          setLastSaleId(res.saleId);
          setLastFiscal(res.fiscal);
          setLastCart(currentCart);
          setShowSuccess(true);
          setCart([]);
          setSelectedTable(null);
          if (onSaleComplete) onSaleComplete();
          
          if (!res.fiscal) {
            setTimeout(() => {
              setShowSuccess(false);
              if (searchInputRef.current) {
                searchInputRef.current.focus();
              }
            }, 3000);
          }
        }
      }
    } catch (error: any) {
      alert(error.message || "Satış tamamlanırken bir hata oluştu.");
    } finally {
      setCompleting(false);
      setPosStatus('idle');
    }
  };

  const handleFinalizeSale = () => executeWithIkramCheck(processFinalizeSale);

  const handlePrintRoomSlip = (room: HotelRoom, guestName: string, notes: string) => {
    const itemsToPrint = cart.map(it => ({
      name: it.note ? `${it.name} (${it.note})` : it.name,
      quantity: it.quantity,
      price: parseFloat(it.price) || 0,
      note: it.note
    }));

    printThermalReceipt({
      title: "ODA HARCAMA & ADİSYON AKTARIM FİŞİ",
      storeName: branding?.store_name || branding?.name || 'LOOKPRICE HORECA',
      storePhone: branding?.phone || branding?.whatsapp_number,
      tableNo: `${selectedTable || 'Restoran'} ➔ Oda ${room.room_number}${guestName ? ` (${guestName})` : ''}`,
      saleId: activeSaleId || undefined,
      items: itemsToPrint,
      totalAmount: total,
      paymentMethod: `ODAYA YAZILDI (ODA ${room.room_number})`
    });
  };

  const handleTransferToRoom = async (room: HotelRoom, notes: string, printSlip: boolean) => {
    if (cart.length === 0) return;

    const guestName = room.current_guest 
      ? `${room.current_guest.first_name} ${room.current_guest.last_name}` 
      : '';

    const folioItem = {
      id: `f-pos-${Date.now()}`,
      title: notes || `${selectedTable || 'Restoran'} Adisyonu`,
      amount: total,
      date: new Date().toISOString().split('T')[0],
      category: selectedTable ? `Masa ${selectedTable}` : 'Restoran / Kafe'
    };

    const storageKey = `hotel_rooms_${storeId || 'default'}`;
    let currentRooms: HotelRoom[] = [];
    try {
      const localSaved = localStorage.getItem(storageKey);
      if (localSaved) currentRooms = JSON.parse(localSaved);
    } catch (e) {}

    if (!currentRooms || currentRooms.length === 0) {
      currentRooms = branding?.hotel_rooms || [];
    }

    const updatedRooms = currentRooms.map(r => {
      if (r.id === room.id || r.room_number === room.room_number) {
        const existingFolio = r.folio || { id: `folio-${r.id}`, total_amount: 0, items: [] };
        return {
          ...r,
          folio: {
            ...existingFolio,
            total_amount: (Number(existingFolio.total_amount) || 0) + total,
            items: [...(existingFolio.items || []), folioItem]
          }
        };
      }
      return r;
    });

    localStorage.setItem(storageKey, JSON.stringify(updatedRooms));
    window.dispatchEvent(new CustomEvent('hotel_rooms_updated', { 
      detail: { rooms: updatedRooms, storeId } 
    }));
    api.updateBranding({ hotel_rooms: updatedRooms }, storeId).catch(() => {});

    const customerLabel = `Oda ${room.room_number}${guestName ? ` - ${guestName}` : ''}`;
    const transferLog = `${selectedTable ? `${selectedTable} adisyonu` : 'Restoran siparişi'} Oda ${room.room_number} hesabına aktarıldı. Not: ${notes}`;

    if (activeSaleId !== null) {
      await api.completeSale(activeSaleId, {
        paymentMethod: 'room',
        customerName: customerLabel,
        notes: getFinalNote(transferLog),
        items: cart.map(item => ({
          product_id: item.id,
          product_name: item.note ? `${item.name} (${item.note})` : item.name,
          unit_price: parseFloat(item.price) || 0,
          quantity: item.quantity
        }))
      }, storeId);
    } else {
      await api.createPosSale({
        items: cart.map(item => ({
          product_id: item.id,
          name: item.note ? `${item.name} (${item.note})` : item.name,
          unit_price: parseFloat(item.price) || 0,
          quantity: item.quantity,
          price: parseFloat(item.price) || 0
        })),
        total,
        paymentMethod: 'room',
        customerName: customerLabel,
        notes: getFinalNote(transferLog),
        currency: branding?.default_currency || 'TRY',
        exchangeRate: 1
      }, storeId);
    }

    if (printSlip) {
      handlePrintRoomSlip(room, guestName, notes);
    }

    if (selectedTable && storeId) {
      clearStoredTableNickname(storeId, selectedTable);
    }

    toast.success(
      lang === 'tr' 
        ? `✅ ${selectedTable || 'Masa'} adisyonu (${total.toFixed(2)} ₺) başarıyla Oda ${room.room_number}${guestName ? ` (${guestName})` : ''} hesabına aktarıldı!` 
        : `✅ Order (${total.toFixed(2)} ₺) successfully transferred to Room ${room.room_number}!`
    );

    setCart([]);
    setActiveSaleId(null);
    setSelectedTable(null);
    setPaymentMethod('cash');
    fetchPendingSales();
    if (onSaleComplete) onSaleComplete();
  };

  const openSplitPaymentModal = () => {
    if (cart.length === 0) return;
    const half = (total / 2).toFixed(2);
    setSplitPayments([
      { method: 'cash', amount: half },
      { method: 'credit_card', amount: (total - parseFloat(half)).toFixed(2) }
    ]);
    setSelectedSplitItems({});
    setSplitTab('item_split');
    setPartialPayMethod('cash');
    setShowSplitModal(true);
  };

  const handlePartialItemPayment = async () => {
    if (cart.length === 0) return;

    const paidItems: any[] = [];
    const remainingItems: any[] = [];

    cart.forEach((item, index) => {
      const payQty = selectedSplitItems[index] || 0;
      if (payQty > 0) {
        paidItems.push({
          ...item,
          id: item.id,
          product_id: item.id,
          quantity: payQty,
          name: item.note ? `${item.name} (${item.note})` : item.name,
          price: parseFloat(item.price) || 0
        });
      }
      const remQty = item.quantity - payQty;
      if (remQty > 0) {
        remainingItems.push({
          ...item,
          quantity: remQty
        });
      }
    });

    const paidTotal = paidItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const remainingTotal = remainingItems.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * item.quantity), 0);

    if (paidItems.length === 0 || paidTotal <= 0) {
      toast.error(lang === 'tr' ? "Lütfen ödenecek en az 1 ürün ve adet seçin!" : "Please select at least 1 item to pay!");
      return;
    }

    try {
      setCompleting(true);

      if (partialPayMethod === 'credit_card' && branding?.pos_bridge_enabled) {
        setPosStatus('waiting');
        setPosMessage(lang === 'tr' ? `Fiziksel POS Cihazına bağlanılıyor...` : `Connecting to Physical POS...`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setPosStatus('approved');
        setPosMessage(lang === 'tr' ? "POS Ödemesi Onaylandı!" : "POS Payment Approved!");
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      const resCreate = await api.createPosSale({
        items: paidItems,
        total: paidTotal,
        paymentMethod: partialPayMethod,
        customerName: selectedTable ? `${selectedTable} (Kısmi Ödeme)` : 'Parçalı Satış',
        notes: selectedTable ? `${selectedTable} Alman Usulü / Parçalı Ödeme` : 'Parçalı POS Satışı',
        currency: branding?.default_currency || 'TRY',
        exchangeRate: 1
      }, storeId);

      if (!resCreate.success) {
        throw new Error(resCreate.error || "Kısmi ödeme kaydedilemedi.");
      }

      if (autoPrintOnPay) {
        printThermalReceipt({
          title: "PARÇALI ÖDEME FİŞİ",
          storeName: branding?.store_name || branding?.name || 'TELOCA CAFE',
          storePhone: branding?.phone || branding?.whatsapp_number,
          tableNo: selectedTable || "Hızlı Kasa",
          saleId: resCreate.saleId,
          items: paidItems.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
          totalAmount: paidTotal,
          paymentMethod: partialPayMethod === 'cash' ? 'NAKİT' : 'KREDİ KARTI',
          notes: remainingItems.length > 0 ? `Masada Kalan Adisyon Tutarı: ${remainingTotal.toFixed(2)} ₺` : 'Adisyon Tamamen Kapatıldı'
        });
      }

      if (remainingItems.length > 0) {
        if (activeSaleId !== null) {
          await api.updatePendingSale(activeSaleId, {
            items: remainingItems.map(item => ({
              id: item.id,
              name: item.name,
              quantity: item.quantity,
              price: parseFloat(item.price) || 0,
              barcode: item.barcode || ''
            })),
            total: remainingTotal,
            customerName: selectedTable
          }, storeId);
        } else if (selectedTable !== null) {
          const resPending = await api.createPosSale({
            items: remainingItems,
            total: remainingTotal,
            paymentMethod: 'cash',
            customerName: selectedTable,
            notes: `${selectedTable} Adisyonu (Parçalı Ödeme Sonrası)`,
            currency: branding?.default_currency || 'TRY',
            exchangeRate: 1,
            status: 'pending'
          }, storeId);

          if (resPending.success && resPending.saleId) {
            setActiveSaleId(resPending.saleId);
          }
        }

        setCart(remainingItems);
        toast.success(
          lang === 'tr' 
            ? `✅ ${paidTotal.toFixed(2)} ₺ kısmi ödeme alındı! Adisyon ${remainingTotal.toFixed(2)} ₺ tutarla AÇIK tutuluyor.`
            : `✅ ${paidTotal.toFixed(2)} ₺ paid! Table remains open with ${remainingTotal.toFixed(2)} ₺ remaining.`
        );
      } else {
        if (activeSaleId !== null) {
          await api.completeSale(activeSaleId, {
            paymentMethod: partialPayMethod,
            items: paidItems
          }, storeId);
        }
        if (selectedTable && storeId) {
          clearStoredTableNickname(storeId, selectedTable);
        }
        setCart([]);
        setActiveSaleId(null);
        setSelectedTable(null);
        toast.success(
          lang === 'tr'
            ? "🎉 Masanın tüm hesabı ödendi ve adisyon kapatıldı!"
            : "🎉 All items paid and table adisyon is closed!"
        );
      }

      setShowSplitModal(false);
      fetchPendingSales();
      if (onSaleComplete) onSaleComplete();
    } catch (err: any) {
      toast.error(err.message || "İşlem sırasında bir hata oluştu.");
    } finally {
      setCompleting(false);
      setPosStatus('idle');
    }
  };

  const handlePartialAmountPayment = async (amountToPay: number) => {
    if (amountToPay <= 0 || amountToPay >= total) return;
    const remainingAmount = total - amountToPay;

    try {
      setCompleting(true);

      if (partialPayMethod === 'credit_card' && branding?.pos_bridge_enabled) {
        setPosStatus('waiting');
        setPosMessage(lang === 'tr' ? `Fiziksel POS Cihazına bağlanılıyor...` : `Connecting to Physical POS...`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setPosStatus('approved');
        setPosMessage(lang === 'tr' ? "POS Ödemesi Onaylandı!" : "POS Payment Approved!");
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      const partialItem = {
        name: `${selectedTable || 'Masa'} Parçalı Tahsilat`,
        quantity: 1,
        price: amountToPay
      };

      const resCreate = await api.createPosSale({
        items: [partialItem],
        total: amountToPay,
        paymentMethod: partialPayMethod,
        customerName: selectedTable ? `${selectedTable} (Kısmi Ödeme)` : 'Parçalı Satış',
        notes: selectedTable ? `${selectedTable} Parçalı Tutar Tahsilatı` : 'Parçalı Tutar Ödemesi',
        currency: branding?.default_currency || 'TRY',
        exchangeRate: 1
      }, storeId);

      if (!resCreate.success) {
        throw new Error(resCreate.error || "Kısmi ödeme kaydedilemedi.");
      }

      if (autoPrintOnPay) {
        printThermalReceipt({
          title: "PARÇALI ÖDEME FİŞİ",
          storeName: branding?.store_name || branding?.name || 'TELOCA CAFE',
          storePhone: branding?.phone || branding?.whatsapp_number,
          tableNo: selectedTable || "Hızlı Kasa",
          saleId: resCreate.saleId,
          items: [{ name: "Adisyondan Kısmi Tahsilat", quantity: 1, price: amountToPay }],
          totalAmount: amountToPay,
          paymentMethod: partialPayMethod === 'cash' ? 'NAKİT' : 'KREDİ KARTI',
          notes: `Masada Kalan Adisyon Tutarı: ${remainingAmount.toFixed(2)} ₺`
        });
      }

      if (activeSaleId !== null) {
        await api.updatePendingSale(activeSaleId, {
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: parseFloat(item.price) || 0,
            barcode: item.barcode || ''
          })),
          total: remainingAmount,
          customerName: selectedTable
        }, storeId);
      }

      toast.success(
        lang === 'tr'
          ? `✅ ${amountToPay.toFixed(2)} ₺ ödeme alındı! Adisyon kalan ${remainingAmount.toFixed(2)} ₺ tutarla AÇIK tutuluyor.`
          : `✅ ${amountToPay.toFixed(2)} ₺ paid! Table remains open with ${remainingAmount.toFixed(2)} ₺ remaining.`
      );

      setShowSplitModal(false);
      fetchPendingSales();
      if (onSaleComplete) onSaleComplete();
    } catch (err: any) {
      toast.error(err.message || "İşlem sırasında hata oluştu.");
    } finally {
      setCompleting(false);
      setPosStatus('idle');
    }
  };

  const handleEqualSplit = (parts: number) => {
    if (parts <= 0) return;
    const partAmount = (total / parts).toFixed(2);
    const newPayments = [];
    for (let i = 0; i < parts; i++) {
      const isLast = i === parts - 1;
      const amt = isLast ? (total - (parseFloat(partAmount) * (parts - 1))).toFixed(2) : partAmount;
      newPayments.push({
        method: i % 2 === 0 ? 'cash' as const : 'credit_card' as const,
        amount: amt
      });
    }
    setSplitPayments(newPayments);
  };

  const handleFinalizeSplitSale = async () => {
    try {
      setCompleting(true);
      
      const payloadPayments = splitPayments.map(p => ({
        method: p.method,
        amount: parseFloat(p.amount) || 0
      }));

      // POS Integration simulation if they have Credit Card payments in the split
      const hasCc = splitPayments.some(p => p.method === 'credit_card');
      if (hasCc && branding?.pos_bridge_enabled) {
        setPosStatus('waiting');
        setPosMessage(lang === 'tr' ? `Fiziksel POS Cihazına bağlanılıyor...` : `Connecting to Physical POS...`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setPosStatus('approved');
        setPosMessage(lang === 'tr' ? "POS Ödemesi Onaylandı!" : "POS Payment Approved!");
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      if (activeSaleId !== null) {
        // Complete pending adisyon
        const res = await api.completeSale(activeSaleId, {
          paymentMethod: 'multiple',
          payments: payloadPayments,
          items: cart.map(item => ({
            product_id: item.id,
            product_name: item.note ? `${item.name} (${item.note})` : item.name,
            unit_price: parseFloat(item.price) || 0,
            quantity: item.quantity
          }))
        }, storeId);

        if (res.success) {
          if (selectedTable && storeId) {
            clearStoredTableNickname(storeId, selectedTable);
          }
          setLastSaleId(activeSaleId);
          setLastFiscal(res.fiscal);
          setLastCart(cart.map(item => ({ ...item, price: parseFloat(item.price) || 0, name: item.note ? `${item.name} (${item.note})` : item.name })));
          setShowSuccess(true);
          setCart([]);
          setActiveSaleId(null);
          setSelectedTable(null);
          setShowSplitModal(false);
          fetchPendingSales();
          if (onSaleComplete) onSaleComplete();
        }
      } else {
        // Direct cash register sale with multiple payments
        const currentCart = cart.map(item => ({
          ...item,
          name: item.note ? `${item.name} (${item.note})` : item.name,
          price: parseFloat(item.price) || 0
        }));
        
        const resCreate = await api.createPosSale({
          items: currentCart,
          total,
          paymentMethod: 'multiple',
          customerName: selectedTable || 'Hızlı Satış',
          notes: selectedTable ? `${selectedTable} Satışı` : 'Hızlı POS Modu (Parçalı)',
          currency: branding?.default_currency || 'TRY',
          exchangeRate: 1,
          status: 'pending' // Create it as pending!
        }, storeId);

        if (resCreate.success && resCreate.saleId) {
          // Then immediately complete it with the payments array!
          const resComplete = await api.completeSale(resCreate.saleId, {
            paymentMethod: 'multiple',
            payments: payloadPayments
          }, storeId);

          if (resComplete.success) {
            if (selectedTable && storeId) {
              clearStoredTableNickname(storeId, selectedTable);
            }
            setLastSaleId(resCreate.saleId);
            setLastFiscal(resComplete.fiscal);
            setLastCart(currentCart);
            setShowSuccess(true);
            setCart([]);
            setSelectedTable(null);
            setShowSplitModal(false);
            if (onSaleComplete) onSaleComplete();
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message || (lang === 'tr' ? "Parçalı ödeme tamamlanırken hata oluştu." : "Error completing split payment."));
    } finally {
      setCompleting(false);
      setPosStatus('idle');
    }
  };

  const handleTableTransfer = async (targetTableNumber: string) => {
    if (!selectedTable || !targetTableNumber) return;
    if (selectedTable === targetTableNumber) {
      setIsChangingTable(false);
      return;
    }

    try {
      setTransferLoading(true);
      const toTable = allTables.find(t => t.table_number === targetTableNumber);

      if (!toTable) {
        toast.error(lang === 'tr' ? "Hedef masa bulunamadı." : "Target table not found.");
        return;
      }

      const fromTable = allTables.find(t => t.table_number === selectedTable);

      const res = await api.post("/api/store/restaurant/tables/transfer", {
        fromTableId: fromTable ? fromTable.id : null,
        toTableId: toTable.id,
        saleId: activeSaleId
      });

      if (res && res.success) {
        if (storeId) {
          transferStoredTableNickname(storeId, selectedTable, targetTableNumber);
        }
        toast.success(lang === 'tr' ? `Adisyon ${targetTableNumber} masasına başarıyla taşındı.` : `Order transferred to table ${targetTableNumber} successfully.`);
        setIsChangingTable(false);
        setSelectedTable(null);
        setActiveSaleId(null);
        setCart([]);
        fetchPendingSales();
      } else {
        toast.error(res?.error || "Transfer failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Error");
    } finally {
      setTransferLoading(false);
    }
  };

  useEffect(() => {
    if (isChangingTable || showQrModal) {
      api.getRestaurantTables(storeId!).then(setAllTables).catch(console.error);
    }
  }, [isChangingTable, showQrModal, storeId]);

  const handleSaveToTable = async () => {
    if (cart.length === 0 || !selectedTable) return;
    try {
      setCompleting(true);
      const total = cart.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * item.quantity, 0);
      const itemsToSave = cart.map(it => ({
        id: it.id,
        product_id: it.product_id || it.id,
        name: it.note ? `${it.name} (${it.note})` : it.name,
        price: it.price,
        quantity: it.quantity,
        barcode: it.barcode || '',
        selectedVariant: it.selectedVariant,
        selected_variant_name: it.selectedVariant ? it.selectedVariant.name : (it.selected_variant_name || null),
        variant: it.selectedVariant,
        variant_recipe_items: it.selectedVariant ? it.selectedVariant.recipe_items : null,
        recipe_items: it.selectedVariant ? it.selectedVariant.recipe_items : (it.recipe_items || null)
      }));

      if (activeSaleId !== null) {
        const res = await api.updatePendingSale(activeSaleId, {
          items: itemsToSave,
          total,
          customerName: selectedTable
        }, storeId);
        if (res.success) {
          if (autoPrintOnOrder) {
            handlePrintReceipt();
          }
          setCart([]);
          setActiveSaleId(null);
          setSelectedTable(null);
          fetchPendingSales();
        }
      } else {
        const res = await api.createPosSale({
          items: itemsToSave,
          total,
          paymentMethod: 'cash',
          customerName: selectedTable,
          notes: `${selectedTable} Adisyonu`,
          currency: branding?.default_currency || 'TRY',
          exchangeRate: 1,
          status: 'pending'
        }, storeId);
        if (res.success) {
          if (autoPrintOnOrder) {
            handlePrintReceipt();
          }
          setCart([]);
          setActiveSaleId(null);
          setSelectedTable(null);
          fetchPendingSales();
        }
      }
    } catch (e: any) {
      alert(e.message || "Adisyon kaydedilirken hata oluştu.");
    } finally {
      setCompleting(false);
    }
  };

  const handleChangeTable = async (newTableName: string) => {
    if (!selectedTable || activeSaleId === null) return;
    try {
      setCompleting(true);
      const res = await api.updatePendingSale(activeSaleId, {
        items: cart.map(it => ({
          id: it.id,
          name: it.note ? `${it.name} (${it.note})` : it.name,
          price: it.price,
          quantity: it.quantity,
          barcode: it.barcode || ''
        })),
        total,
        customerName: newTableName
      }, storeId);
      if (res.success) {
        setSelectedTable(newTableName);
        fetchPendingSales();
        setIsChangingTable(false);
      }
    } catch (e: any) {
      alert(e.message || "Masa değiştirilirken hata oluştu.");
    } finally {
      setCompleting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col space-y-2 h-[calc(100vh-80px)] min-h-[600px]">
      {/* Customer Table Service Calls Notification Banner */}
      <PosServiceCallsBanner
        storeTableCalls={storeTableCalls}
        lang={lang}
        pendingSales={pendingSales}
        branding={branding}
        handlePrintTableBill={handlePrintTableBill}
        handleResolveTableCall={handleResolveTableCall}
      />

      {/* Main High-Density Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0 overflow-hidden">
        {/* Left Column: Tables or Product Selection */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col space-y-2 h-full min-h-0 overflow-hidden">
          {/* Sleek Ultra-Compact Header Bar */}
          <PosHeaderToolbar
            lang={lang}
            isCafeRestaurant={isCafeRestaurant}
            selectedTable={selectedTable}
            activeSaleId={activeSaleId}
            setSelectedTable={setSelectedTable}
            setActiveSaleId={setActiveSaleId}
            setCart={setCart}
            fetchPendingSales={fetchPendingSales}
            tableNicknames={tableNicknames}
            setActiveNicknameModal={setActiveNicknameModal}
            setActiveNicknameInput={setActiveNicknameInput}
            branding={branding}
            showCafeTools={showCafeTools}
            setShowCafeTools={setShowCafeTools}
            setShowQrModal={setShowQrModal}
            setShowReportModal={setShowReportModal}
            setPrinterDiagStep={setPrinterDiagStep}
            setShowPrinterDiagnosticModal={setShowPrinterDiagnosticModal}
            setShowHappyHourModal={setShowHappyHourModal}
            isHappyHourActive={isHappyHourActive}
            bridgeDetected={bridgeDetected}
          />

          {isCafeRestaurant && selectedTable === null ? (
            <PosTableGridView
              lang={lang}
              pendingSales={pendingSales}
              allTables={allTables}
              branding={branding}
              storeId={storeId!}
              tablesRefreshTrigger={tablesRefreshTrigger}
              setSelectedTable={setSelectedTable}
              setActiveSaleId={setActiveSaleId}
              setCart={setCart}
            />
          ) : (
            <PosProductGridView
              lang={lang}
              searchInputRef={searchInputRef}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              allProducts={allProducts}
              filteredProducts={filteredProducts}
              addToCart={addToCart}
              handleProductClick={handleProductClick}
              setShowQuickProductModal={setShowQuickProductModal}
              setQuickProductForm={setQuickProductForm}
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              subCategories={subCategories}
              selectedSubCategory={selectedSubCategory}
              setSelectedSubCategory={setSelectedSubCategory}
              isHappyHourActive={isHappyHourActive}
            />
          )}
      </div>

          {/* Right Side: Cart or Open Bills Live Panel */}
          <div className="lg:col-span-5 xl:col-span-5 flex flex-col h-full min-h-0 overflow-hidden">
            {isCafeRestaurant && selectedTable === null ? (
              <PosOpenBillsPanel
                lang={lang}
                pendingSales={pendingSales}
                handlePrintTableBill={handlePrintTableBill}
                setSelectedTable={setSelectedTable}
                setActiveSaleId={setActiveSaleId}
                setCart={setCart}
              />
            ) : (
              <PosCartPanel
                lang={lang}
                isCafeRestaurant={isCafeRestaurant}
                selectedTable={selectedTable}
                cart={cart}
                setCart={setCart}
                markCartAsIkram={markCartAsIkram}
                updatePrice={updatePrice}
                updateQuantity={updateQuantity}
                markAsIkram={markAsIkram}
                removeFromCart={removeFromCart}
                updateNote={updateNote}
                total={total}
                activeStaffRole={activeStaffRole}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod as any}
                isHotelActive={isHotelActive}
                setShowRoomTransferModal={setShowRoomTransferModal}
                completing={completing}
                handleSaveToTable={handleSaveToTable}
                activeSaleId={activeSaleId}
                setIsChangingTable={setIsChangingTable}
                handlePrintReceipt={handlePrintReceipt}
                executeWithIkramCheck={executeWithIkramCheck}
                openSplitPaymentModal={openSplitPaymentModal}
                handleFinalizeSale={handleFinalizeSale}
              />
          )}
        </div>
      </div>

      <PosModalsContainer
        lang={lang}
        storeId={storeId}
        branding={branding}
        isCafeRestaurant={isCafeRestaurant}
        isHotelActive={isHotelActive}
        posStatus={posStatus}
        posMessage={posMessage}
        setPosStatus={setPosStatus}
        showSuccess={showSuccess}
        setShowSuccess={setShowSuccess}
        lastSaleId={lastSaleId}
        lastCart={lastCart}
        paymentMethod={paymentMethod}
        lastFiscal={lastFiscal}
        handlePrintReceipt={handlePrintReceipt}
        searchInputRef={searchInputRef}
        showHappyHourModal={showHappyHourModal}
        setShowHappyHourModal={setShowHappyHourModal}
        isHappyHourActive={isHappyHourActive}
        happyHourConfig={happyHourConfig}
        setHappyHourConfig={setHappyHourConfig}
        forceHappyHour={forceHappyHour}
        setForceHappyHour={setForceHappyHour}
        allProducts={allProducts}
        showSplitModal={showSplitModal}
        setShowSplitModal={setShowSplitModal}
        selectedTable={selectedTable}
        splitTab={splitTab}
        setSplitTab={setSplitTab}
        total={total}
        cart={cart}
        selectedSplitItems={selectedSplitItems}
        setSelectedSplitItems={setSelectedSplitItems}
        partialPayMethod={partialPayMethod}
        setPartialPayMethod={setPartialPayMethod}
        completing={completing}
        handlePartialItemPayment={handlePartialItemPayment}
        splitPayments={splitPayments}
        setSplitPayments={setSplitPayments}
        handleEqualSplit={handleEqualSplit}
        handleFinalizeSplitSale={handleFinalizeSplitSale}
        handlePartialAmountPayment={handlePartialAmountPayment}
        showPrinterDiagnosticModal={showPrinterDiagnosticModal}
        setShowPrinterDiagnosticModal={setShowPrinterDiagnosticModal}
        autoPrintOnOrder={autoPrintOnOrder}
        autoPrintOnPay={autoPrintOnPay}
        handleToggleAutoPrintOrder={handleToggleAutoPrintOrder}
        handleToggleAutoPrintPay={handleToggleAutoPrintPay}
        showReportModal={showReportModal}
        setShowReportModal={setShowReportModal}
        reportStartDate={reportStartDate}
        setReportStartDate={setReportStartDate}
        reportEndDate={reportEndDate}
        setReportEndDate={setReportEndDate}
        reportPreset={reportPreset}
        setReportPreset={setReportPreset as any}
        reportSearchQuery={reportSearchQuery}
        setReportSearchQuery={setReportSearchQuery}
        reportSortBy={reportSortBy}
        setReportSortBy={setReportSortBy as any}
        reportData={reportData}
        reportLoading={reportLoading}
        fetchReport={fetchReport}
        handleApplyPreset={handleApplyPreset}
        handlePrintReport={handlePrintReport}
        handlePrintA4Report={handlePrintA4Report}
        showQrModal={showQrModal}
        setShowQrModal={setShowQrModal}
        allTables={allTables}
        qrModalTab={qrModalTab}
        setQrModalTab={setQrModalTab}
        singleQrTable={singleQrTable}
        setSingleQrTable={setSingleQrTable}
        newTableCount={newTableCount}
        setNewTableCount={setNewTableCount}
        savingTableCount={savingTableCount}
        handleSaveTableCount={handleSaveTableCount}
        handlePrintQr={handlePrintQr}
        handlePrintAllQrs={handlePrintAllQrs}
        isChangingTable={isChangingTable}
        setIsChangingTable={setIsChangingTable}
        transferLoading={transferLoading}
        handleTableTransfer={handleTableTransfer}
        variantModalProduct={variantModalProduct}
        setVariantModalProduct={setVariantModalProduct}
        addToCart={addToCart}
        showRoomTransferModal={showRoomTransferModal}
        setShowRoomTransferModal={setShowRoomTransferModal}
        handleTransferToRoom={handleTransferToRoom}
        showIkramNoteModal={showIkramNoteModal}
        setShowIkramNoteModal={setShowIkramNoteModal}
        ikramNote={ikramNote}
        setIkramNote={setIkramNote}
        pendingIkramAction={pendingIkramAction}
        setPendingIkramAction={setPendingIkramAction}
        activeNicknameModal={activeNicknameModal}
        setActiveNicknameModal={setActiveNicknameModal}
        activeNicknameInput={activeNicknameInput}
        setActiveNicknameInput={setActiveNicknameInput}
        tableNicknames={tableNicknames}
        saveTableNickname={(table, nick) => saveTableNickname(storeId!, table, nick)}
        clearStoredTableNickname={(table) => clearStoredTableNickname(storeId!, table)}
      />
    </div>
  );
};

export default FastPosTab;
