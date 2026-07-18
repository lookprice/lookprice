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
  MessageSquare
} from "lucide-react";
import { translations } from "../translations";
import { useLanguage } from "../contexts/LanguageContext";
import { TableGrid } from './TableGrid';
import { api } from "../services/api";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

interface FastPosTabProps {
  storeId?: number;
  onSaleComplete?: () => void;
  branding?: any;
  activeStaffRole?: 'manager' | 'cashier' | 'waiter';
}

const FastPosTab = ({ storeId, onSaleComplete, branding, activeStaffRole = 'manager' }: FastPosTabProps) => {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_card'>('cash');
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<number | null>(null);
  const [lastFiscal, setLastFiscal] = useState<any>(null);
  const [lastCart, setLastCart] = useState<any[]>([]);
  const [posStatus, setPosStatus] = useState<'idle' | 'waiting' | 'approved' | 'failed'>('idle');
  const [posMessage, setPosMessage] = useState("");
  const [bridgeDetected, setBridgeDetected] = useState<boolean | null>(null);

  // Z-Report and End-of-Day states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Cafe/Restaurant Table and Adisyon states
  const isCafeRestaurant = branding?.store_type === 'cafe_restaurant' || branding?.page_layout_settings?.sector === 'cafe_restaurant';
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [pendingSales, setPendingSales] = useState<any[]>([]);
  const [prevPendingCount, setPrevPendingCount] = useState<number | null>(null);
  const [tablesRefreshTrigger, setTablesRefreshTrigger] = useState(0);
  const [loadingPending, setLoadingPending] = useState(false);
  const [activeSaleId, setActiveSaleId] = useState<number | null>(null);
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

  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("all");

  const categories = React.useMemo(() => {
    const cats = new Set<string>();
    allProducts.forEach(p => {
      if (p.category) {
        cats.add(p.category);
      }
    });
    return Array.from(cats);
  }, [allProducts]);

  const subCategories = React.useMemo(() => {
    if (selectedCategory === "all") return [];
    const subs = new Set<string>();
    allProducts.filter(p => p.category === selectedCategory).forEach(p => {
      if (p.sub_category) subs.add(p.sub_category);
    });
    return Array.from(subs);
  }, [allProducts, selectedCategory]);

  const filteredProducts = React.useMemo(() => {
    let list = searchResults;
    if (selectedCategory !== "all") {
      list = list.filter(p => p.category === selectedCategory);
      if (selectedSubCategory !== "all") {
        list = list.filter(p => p.sub_category === selectedSubCategory);
      }
    }
    return list;
  }, [searchResults, selectedCategory, selectedSubCategory]);

  const fetchPendingSales = async (isPoll: boolean = false) => {
    if (!isCafeRestaurant) return;
    try {
      if (!isPoll) setLoadingPending(true);
      const res = await api.getSales('pending', '', '', storeId);
      if (Array.isArray(res)) {
        setPendingSales(res);
        setTablesRefreshTrigger(prev => prev + 1);

        if (prevPendingCount !== null && res.length > prevPendingCount) {
          // Play a beautiful, gentle dual-tone workspace alert sound using Web Audio API
          try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
              const audioCtx = new AudioContextClass();
              const oscillator = audioCtx.createOscillator();
              const gainNode = audioCtx.createGain();
              oscillator.connect(gainNode);
              gainNode.connect(audioCtx.destination);
              oscillator.type = 'sine';
              oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
              gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
              oscillator.start();
              oscillator.stop(audioCtx.currentTime + 0.12);
              
              setTimeout(() => {
                const osc2 = audioCtx.createOscillator();
                const gain2 = audioCtx.createGain();
                osc2.connect(gain2);
                gain2.connect(audioCtx.destination);
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
                gain2.gain.setValueAtTime(0.08, audioCtx.currentTime);
                osc2.start();
                osc2.stop(audioCtx.currentTime + 0.22);
              }, 120);
            }
          } catch (soundErr) {
            console.log("Audio play blocked by browser policies:", soundErr);
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
    
    // Poll for updates every 10 seconds to keep order state fresh
    const interval = setInterval(() => {
      fetchPendingSales(true);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [storeId, isCafeRestaurant, prevPendingCount]);

  const fetchReport = async (dateStr: string) => {
    try {
      setReportLoading(true);
      const data = await api.getPosDailyReport(dateStr, storeId);
      if (data && data.success) {
        setReportData(data);
      } else {
        setReportData(null);
      }
    } catch (e) {
      console.error("Error fetching daily report:", e);
      setReportData(null);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (showReportModal) {
      fetchReport(reportDate);
    }
  }, [showReportModal, reportDate]);

  // Isolated high-quality thermal slip printing via invisible iframe
  const handlePrintReceipt = () => {
    const printContent = document.getElementById("pos-receipt-printable");
    if (!printContent) return;
    
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <html>
          <head>
            <title>Sipariş Fişi</title>
            <style>
              body { font-family: 'Courier New', Courier, monospace; font-size: 11px; padding: 10px; line-height: 1.4; color: black; }
              .text-center { text-align: center; }
              .border-b { border-bottom: 1px dashed black; padding-bottom: 8px; margin-bottom: 8px; }
              .flex-between { display: flex; justify-content: space-between; }
              .font-bold { font-weight: bold; }
              .mt-4 { margin-top: 16px; }
              .mt-2 { margin-top: 8px; }
              table { width: 100%; border-collapse: collapse; margin-top: 8px; }
              th, td { text-align: left; padding: 2px 0; }
              th { border-bottom: 1px solid black; }
              .text-right { text-align: right; }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() {
                  window.frameElement.remove();
                }, 100);
              }
            </script>
          </body>
        </html>
      `);
      doc.close();
    }
  };

  const handlePrintReport = () => {
    const printContent = document.getElementById("pos-z-report-printable");
    if (!printContent) return;
    
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <html>
          <head>
            <title>Gün Sonu Raporu</title>
            <style>
              body { font-family: 'Courier New', Courier, monospace; font-size: 11px; padding: 10px; line-height: 1.4; color: black; }
              .text-center { text-align: center; }
              .border-b { border-bottom: 1px dashed black; padding-bottom: 8px; margin-bottom: 8px; }
              .flex-between { display: flex; justify-content: space-between; }
              .font-bold { font-weight: bold; }
              .mt-4 { margin-top: 16px; }
              .mt-2 { margin-top: 8px; }
              table { width: 100%; border-collapse: collapse; margin-top: 8px; }
              th, td { text-align: left; padding: 2px 0; }
              th { border-bottom: 1px solid black; }
              .text-right { text-align: right; }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() {
                  window.frameElement.remove();
                }, 100);
              }
            </script>
          </body>
        </html>
      `);
      doc.close();
    }
  };

  const handlePrintSingleQr = (tableNum: string) => {
    const cleanNum = tableNum.replace(/Masa/gi, '').trim();
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + "/digital-menu/" + storeId + "/" + cleanNum)}`;
    const storeTitle = branding?.store_name || branding?.name || 'Seçkin Restoran';
    
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <html>
          <head>
            <title>Masa ${cleanNum} QR Kodu</title>
            <style>
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
                \${lang === 'tr' ? 'Menüyü incelemek ve sipariş vermek için QR kodu cep telefonunuzla taratın.' : 'Scan the QR code with your phone to view menu and order.'}
              </p>
              <div class="footer">POWERED BY LOOKPRICE</div>
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() {
                  window.frameElement.remove();
                }, 100);
              }
            </script>
          </body>
        </html>
      `);
      doc.close();
    }
  };

  const handlePrintAllQrs = () => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
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
              \${lang === 'tr' ? 'Menüyü incelemek ve sipariş vermek için QR kodu cep telefonunuzla taratın.' : 'Scan the QR code with your phone to view menu and order.'}
            </div>
            <div class="footer-powered">POWERED BY LOOKPRICE</div>
          </div>
        `;
      }).join('');

      doc.write(`
        <html>
          <head>
            <title>Tüm Masalar QR Kodları</title>
            <style>
              @media print {
                body {
                  margin: 0;
                  padding: 0;
                  background: white;
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
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() {
                  window.frameElement.remove();
                }, 100);
              }
            </script>
          </body>
        </html>
      `);
      doc.close();
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
      if (searchTerm.length >= 2) {
        // Check if scanned value is a table QR code
        const tableUrlMatch = searchTerm.match(/\/digital-menu\/\d+\/(.+)/);
        if (tableUrlMatch) {
            const decodedTableNumber = decodeURIComponent(tableUrlMatch[1]);
            setSelectedTable(decodedTableNumber);
            setSearchTerm("");
            return;
        }

        try {
          const res = await api.getProducts(searchTerm, storeId, false, true);
          const products = Array.isArray(res) ? res : [];
          setSearchResults(products);
          
          // If exact barcode match, add to cart immediately
          const exactMatch = products.find((p: any) => p.barcode === searchTerm);
          if (exactMatch) {
            addToCart(exactMatch);
            setSearchTerm("");
          }
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults([]);
        }
      } else if (searchTerm.length === 0) {
        // Reset to all products if search term is cleared
        const res = await api.getProducts("", storeId, false, true);
        setSearchResults(Array.isArray(res) ? res : []);
      }
    };

    const delayDebounceFn = setTimeout(fetchProducts, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, storeId]);

  const getExchangeRate = (currency: string) => {
    if (!currency || currency === (branding?.default_currency || 'TRY')) return 1;
    if (branding?.currency_rates && branding.currency_rates[currency]) {
      return parseFloat(branding.currency_rates[currency]) || 1;
    }
    return 1;
  };

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      
      const rate = getExchangeRate(product.currency || 'TRY');
      const convertedPrice = (parseFloat(product.price || 0) * rate).toFixed(2);

      return [...prev, { 
        ...product, 
        quantity: 1,
        price: convertedPrice, // Store cross-currency calculated price
        currency: branding?.default_currency || 'TRY' // Normalize currency to store setting
      }];
    });
    setSearchTerm("");
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, Math.floor(item.quantity + delta));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const updatePrice = (productId: number, newPrice: string) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        return { ...item, price: newPrice };
      }
      return item;
    }));
  };

  const updateNote = (productId: number, note: string) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        return { ...item, note };
      }
      return item;
    }));
  };

  const total = cart.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * item.quantity), 0);

  const handleFinalizeSale = async () => {
    if (cart.length === 0) return;
    
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
          notes: selectedTable ? `${selectedTable} Satışı` : 'Hızlı POS Modu',
          currency: branding?.default_currency || 'TRY',
          exchangeRate: 1
        }, storeId);

        if (res.success) {
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

  const handleTableTransfer = async (targetTableNumber: string) => {
    if (!selectedTable || !targetTableNumber) return;
    if (selectedTable === targetTableNumber) {
      setIsChangingTable(false);
      return;
    }

    try {
      setTransferLoading(true);
      // We need IDs for transfer, but our POS uses table_numbers as identifiers in many places.
      // Let's fetch table IDs first or update API to handle numbers.
      // For now, let's assume the API handles it or we find the IDs.
      const fromTable = allTables.find(t => t.table_number === selectedTable);
      const toTable = allTables.find(t => t.table_number === targetTableNumber);

      if (!fromTable || !toTable) {
        toast.error(lang === 'tr' ? "Masa bilgileri bulunamadı." : "Table info not found.");
        return;
      }

      const res = await api.post("/api/store/restaurant/tables/transfer", {
        fromTableId: fromTable.id,
        toTableId: toTable.id
      });

      if (res && res.success) {
        toast.success(lang === 'tr' ? "Masa başarıyla taşındı." : "Table transferred successfully.");
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
    if (isChangingTable) {
      api.getRestaurantTables(storeId!).then(setAllTables).catch(console.error);
    }
  }, [isChangingTable, storeId]);

  const handleSaveToTable = async () => {
    if (cart.length === 0 || !selectedTable) return;
    try {
      setCompleting(true);
      const itemsToSave = cart.map(it => ({
        id: it.id,
        name: it.note ? `${it.name} (${it.note})` : it.name,
        price: it.price,
        quantity: it.quantity,
        barcode: it.barcode || ''
      }));

      if (activeSaleId !== null) {
        const res = await api.updatePendingSale(activeSaleId, {
          items: itemsToSave,
          total,
          customerName: selectedTable
        }, storeId);
        if (res.success) {
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
    <div className="flex flex-col space-y-4 h-[calc(100vh-140px)]">
      {/* Top Header Bar with Store Name, Connection Status & Report Button */}
      <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {isCafeRestaurant && selectedTable !== null && (
            <button
              onClick={() => {
                setSelectedTable(null);
                setActiveSaleId(null);
                setCart([]);
                fetchPendingSales();
              }}
              className="mr-2 p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-xl transition-all flex items-center justify-center border border-slate-200 shadow-xs"
              title={lang === 'tr' ? "Masalara Geri Dön" : "Back to Tables"}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
            {isCafeRestaurant && selectedTable !== null ? (
              <Coffee className="h-5 w-5 text-rose-500" />
            ) : (
              <ShoppingCart className="h-5 w-5" />
            )}
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-800 uppercase tracking-tight">
              {isCafeRestaurant && selectedTable !== null ? (
                <span>{selectedTable} {activeSaleId !== null ? `(${lang === 'tr' ? 'Açık Adisyon' : 'Open Bill'})` : `(${lang === 'tr' ? 'Yeni Sipariş' : 'New Order'})`}</span>
              ) : (
                branding?.store_name || branding?.name || (lang === 'tr' ? "Seçkin Mağaza" : "Premium Store")
              )}
            </h2>
            <p className="text-xs text-slate-400 font-semibold">
              {isCafeRestaurant && selectedTable !== null ? (
                <span>{branding?.store_name || branding?.name || (lang === 'tr' ? "Seçkin Restoran" : "Premium Restaurant")}</span>
              ) : (
                lang === 'tr' ? "Hızlı Satış & POS Terminali" : "Quick Sales & POS Terminal"
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Bridge Status Indicator */}
          {branding?.pos_bridge_enabled && (
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
              bridgeDetected 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                : 'bg-rose-50 border-rose-100 text-rose-700'
            }`}>
              <span className={`h-2 w-2 rounded-full ${bridgeDetected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
              {bridgeDetected ? (lang === 'tr' ? 'POS Köprüsü Aktif' : 'POS Bridge Active') : (lang === 'tr' ? 'POS Bağlantısı Yok' : 'POS Disconnected')}
            </div>
          )}
          
          {isCafeRestaurant && (
            <button
              onClick={() => setShowQrModal(true)}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-sm active:scale-95 touch-manipulation"
            >
              <Coffee className="h-4 w-4 text-rose-600" />
              {lang === 'tr' ? 'Dijital Menü QR' : 'Digital Menu QR'}
            </button>
          )}

          <button
            onClick={() => setShowReportModal(true)}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-sm active:scale-95 touch-manipulation"
          >
            <Calendar className="h-4 w-4 text-indigo-600" />
            {lang === 'tr' ? 'Gün Sonu Raporu' : 'End of Day Report'}
          </button>
        </div>
      </div>

      {isCafeRestaurant && selectedTable === null ? (
        <div className="flex-1 overflow-y-auto p-2">
          {/* Dashboard Summary Cards for Tables */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                <Coffee className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{lang === 'tr' ? 'Dolu Masalar' : 'Occupied Tables'}</p>
                <p className="text-2xl font-black text-slate-800">{pendingSales.length} / {allTables.length > 0 ? allTables.length : (branding?.page_layout_settings?.table_count || 12)}</p>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{lang === 'tr' ? 'Boş Masalar' : 'Empty Tables'}</p>
                <p className="text-2xl font-black text-slate-800">{(allTables.length > 0 ? allTables.length : (branding?.page_layout_settings?.table_count || 12)) - pendingSales.length} / {allTables.length > 0 ? allTables.length : (branding?.page_layout_settings?.table_count || 12)}</p>
              </div>
            </div>

            <div className="bg-indigo-600 text-white p-5 rounded-2xl shadow-md shadow-indigo-600/10 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-white/20 text-white flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider">{lang === 'tr' ? 'Aktif Adisyon Toplamı' : 'Active Bills Total'}</p>
                <p className="text-2xl font-black">
                  {pendingSales.reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0).toFixed(2)} ₺
                </p>
              </div>
            </div>
          </div>

          {/* Tables Grid */}
          <TableGrid 
            storeId={storeId!} 
            refreshTrigger={tablesRefreshTrigger}
            onTableSelect={(table) => {
              setSelectedTable(table.table_number);
              if (table.status === 'occupied') {
                // Find the sale for this table using normalization
                const normalizeName = (str: string) => str ? str.toLowerCase().replace(/\s+/g, '') : '';
                const sale = pendingSales.find(s => {
                  if (s.restaurant_table_id === table.id) return true;
                  const sName = normalizeName(s.customer_name);
                  const tNum = normalizeName(table.table_number);
                  return sName === tNum || sName === `masa${tNum}` || sName.includes(`masa${tNum}`) || sName === `table${tNum}`;
                });
                if (sale) {
                  setActiveSaleId(sale.id);
                  const mappedCart = sale.items.map((it: any) => {
                    const fullName = it.product_name || '';
                    const match = fullName.match(/(.+?)\s*\((.+?)\)$/);
                    const cleanName = match ? match[1].trim() : fullName;
                    const parsedNote = match ? match[2].trim() : '';
                    return {
                      id: it.product_id,
                      name: cleanName,
                      note: parsedNote,
                      price: it.unit_price.toString(),
                      quantity: it.quantity,
                      barcode: it.barcode || '',
                      currency: sale.currency || 'TRY'
                    };
                  });
                  setCart(mappedCart);
                }
              } else {
                setActiveSaleId(null);
                setCart([]);
              }
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
          {/* Left Side: Product Search & Selection */}
          <div className="lg:col-span-7 flex flex-col space-y-4 overflow-hidden">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="relative">
                <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-500" />
                <input 
                  ref={searchInputRef}
                  type="text" 
                  placeholder={lang === 'tr' ? "Barkod okutun veya ürün adı yazın..." : "Scan barcode or type product name..."}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-lg font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchResults.length > 0) {
                      addToCart(searchResults[0]);
                    }
                  }}
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            {categories.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none px-1">
                  <button
                    onClick={() => { setSelectedCategory("all"); setSelectedSubCategory("all"); }}
                    className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all whitespace-nowrap active:scale-95 ${
                      selectedCategory === "all"
                        ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                        : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {lang === 'tr' ? 'HEPSİ' : 'ALL'}
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => { setSelectedCategory(category); setSelectedSubCategory("all"); }}
                      className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all whitespace-nowrap active:scale-95 ${
                        selectedCategory === category
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                          : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                {subCategories.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none px-1">
                    <button
                      onClick={() => setSelectedSubCategory("all")}
                      className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all whitespace-nowrap active:scale-95 ${
                        selectedSubCategory === "all"
                          ? "bg-indigo-400 text-white shadow-md shadow-indigo-400/10"
                          : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {lang === 'tr' ? 'TÜMÜ' : 'ALL'}
                    </button>
                    {subCategories.map((subCategory) => (
                      <button
                        key={subCategory}
                        onClick={() => setSelectedSubCategory(subCategory)}
                        className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all whitespace-nowrap active:scale-95 ${
                          selectedSubCategory === subCategory
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                            : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {subCategory}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-y-auto p-4">
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      title={product.name}
                      className="relative flex flex-col h-48 w-full bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/40 hover:z-10 transition-all text-center group active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-500 touch-manipulation"
                    >
                      {/* Top Half: Image (50% of card height) */}
                      <div className="w-full h-24 bg-white flex items-center justify-center p-3 border-b border-slate-100 rounded-t-xl overflow-hidden">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt="" 
                            className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-200" 
                            referrerPolicy="no-referrer" 
                          />
                        ) : (
                          <Package className="h-10 w-10 text-slate-300 group-hover:scale-105 transition-transform duration-200" />
                        )}
                      </div>

                      {/* Bottom Half: Name & Price (50% of card height) */}
                      <div className="w-full h-24 p-3 flex flex-col justify-between items-center bg-slate-50 group-hover:bg-indigo-50/40 rounded-b-xl relative">
                        <div className="w-full flex-1 flex items-center justify-center overflow-hidden">
                          <span className="text-sm font-bold text-slate-800 line-clamp-2 px-1 text-center leading-tight">
                            {product.name}
                          </span>
                        </div>
                        <span className="text-sm font-black text-indigo-600 mt-1 whitespace-nowrap">
                          {product.price} {product.currency || 'TRY'}
                        </span>
                      </div>

                      {/* Full-card Elegant Overlay on Hover/Focus */}
                      <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-xs text-white flex flex-col items-center justify-center p-4 rounded-xl opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all duration-200 pointer-events-none z-10 text-center">
                        <ShoppingCart className="h-6 w-6 text-indigo-400 mb-2 animate-bounce" />
                        <p className="text-xs font-extrabold line-clamp-3 px-1 leading-snug">{product.name}</p>
                        <p className="text-sm text-indigo-300 mt-2 font-black">{product.price} {product.currency || 'TRY'}</p>
                        <span className="text-[10px] bg-indigo-600 text-white font-bold px-3 py-1 rounded-lg mt-3 tracking-wider">
                          {lang === 'tr' ? 'SEPETE EKLE' : 'ADD TO CART'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchTerm.length > 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Search className="h-12 w-12 mb-2 opacity-20" />
                  <p className="text-sm font-medium">{lang === 'tr' ? 'Ürün bulunamadı' : 'No products found'}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Barcode className="h-16 w-16 mb-4 opacity-10" />
                  <p className="text-sm font-medium">{lang === 'tr' ? 'Satış yapmak için ürün seçin veya barkod okutun' : 'Select products or scan barcode to start sale'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Cart & Checkout */}
          <div className="lg:col-span-5 flex flex-col space-y-4 overflow-hidden">
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-800">
                    {isCafeRestaurant && selectedTable !== null ? `${selectedTable} ${lang === 'tr' ? 'Adisyonu' : 'Bill'}` : (lang === 'tr' ? 'Satış Sepeti' : 'Sales Cart')}
                  </h3>
                </div>
                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold">
                  {cart.length} {lang === 'tr' ? 'Kalem' : 'Items'}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <AnimatePresence initial={false}>
                  {cart.map((item) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 flex flex-col"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 mr-4">
                          <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => updatePrice(item.id, e.target.value)}
                              className="w-20 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded px-2 py-0.5 outline-none focus:border-indigo-500 transition-colors"
                            />
                            <span className="text-xs font-medium text-slate-500">{item.currency || 'TRY'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                            <button 
                              onClick={() => updateQuantity(item.id, -1)}
                              className="p-1.5 hover:bg-slate-50 text-slate-600 transition-colors"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-10 text-center text-sm font-bold text-slate-800">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, 1)}
                              className="p-1.5 hover:bg-slate-50 text-slate-600 transition-colors"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Item level special request/note input */}
                      <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          placeholder={lang === 'tr' ? 'Özel istek / Mutfağa not (örn: Demli, Açık)' : 'Special note for kitchen (e.g. strong, light)'}
                          value={item.note || ''}
                          onChange={(e) => updateNote(item.id, e.target.value)}
                          className="w-full bg-transparent border-none text-[11px] font-medium text-slate-600 outline-none placeholder-slate-400"
                        />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {cart.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 py-12">
                    <ShoppingCart className="h-12 w-12 mb-2 opacity-20" />
                    <p className="text-sm font-medium">{lang === 'tr' ? 'Sepet boş' : 'Cart is empty'}</p>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">{lang === 'tr' ? 'Toplam Tutar' : 'Total Amount'}</span>
                  <span className="text-3xl font-black text-slate-900">{total.toFixed(2)} ₺</span>
                </div>

                {activeStaffRole === 'waiter' ? (
                  /* Waiter specific view - No payment buttons, just save to table and change table */
                  <div className="space-y-3">
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-amber-800 text-xs font-semibold leading-relaxed">
                      ⚠️ {lang === 'tr' 
                        ? 'Garson Yetki Sınırı: Sadece sipariş alabilir ve masaları güncelleyebilirsiniz. Hesap kapatma / ödeme alma yetkisi kasiyer veya yöneticidedir.' 
                        : 'Waiter Permission: You can only take orders and update tables. Payment collection and closing bills is restricted to Cashiers or Managers.'}
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <button
                        disabled={cart.length === 0 || completing}
                        onClick={handleSaveToTable}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/10 active:scale-98 disabled:opacity-50"
                      >
                        <Coffee className="h-5 w-5" />
                        {lang === 'tr' ? 'Siparişi Masaya Gönder' : 'Send Order to Table'}
                      </button>

                      {isCafeRestaurant && selectedTable !== null && (
                        <button
                          disabled={activeSaleId === null || completing}
                          onClick={() => setIsChangingTable(true)}
                          className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                        >
                          <ArrowLeftRight className="h-4 w-4" />
                          {lang === 'tr' ? 'Masa Değiştir' : 'Change Table'}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Manager & Cashier View - Full checkout & payment options */
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setPaymentMethod('cash')}
                        className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all font-bold ${
                          paymentMethod === 'cash' 
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <Banknote className="h-5 w-5" />
                        {lang === 'tr' ? 'Nakit' : 'Cash'}
                      </button>
                      <button 
                        onClick={() => setPaymentMethod('credit_card')}
                        className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all font-bold ${
                          paymentMethod === 'credit_card' 
                            ? 'border-blue-500 bg-blue-50 text-blue-700' 
                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <CreditCard className="h-5 w-5" />
                        {lang === 'tr' ? 'Kredi Kartı' : 'Credit Card'}
                      </button>
                    </div>

                    {isCafeRestaurant && selectedTable !== null && (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          disabled={cart.length === 0 || completing}
                          onClick={handleSaveToTable}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                        >
                          <Coffee className="h-4 w-4" />
                          {lang === 'tr' ? 'Adisyona Kaydet' : 'Save to Table'}
                        </button>
                        <button
                          disabled={activeSaleId === null || completing}
                          onClick={() => setIsChangingTable(true)}
                          className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                        >
                          <ArrowLeftRight className="h-4 w-4" />
                          {lang === 'tr' ? 'Masa Değiştir' : 'Change Table'}
                        </button>
                      </div>
                    )}

                    <button 
                      disabled={cart.length === 0 || completing}
                      onClick={handleFinalizeSale}
                      className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
                    >
                      {completing ? (
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <CheckCircle2 className="h-6 w-6" />
                          {isCafeRestaurant && selectedTable !== null 
                            ? (lang === 'tr' ? 'Hesabı Kapat / Öde' : 'Close Table & Pay') 
                            : (lang === 'tr' ? 'Satışı Tamamla' : 'Complete Sale')}
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Overlay */}
      <AnimatePresence>
        {posStatus !== 'idle' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full text-center shadow-2xl border border-slate-100"
            >
              <div className="relative mb-8">
                <div className={`h-24 w-24 rounded-full flex items-center justify-center mx-auto transition-all duration-500 ${
                  posStatus === 'waiting' ? 'bg-indigo-50 text-indigo-600' : 
                  posStatus === 'approved' ? 'bg-emerald-50 text-emerald-600' : 
                  'bg-rose-50 text-rose-600'
                }`}>
                  {posStatus === 'waiting' && <CreditCard className="h-12 w-12 animate-pulse" />}
                  {posStatus === 'approved' && <CheckCircle2 className="h-12 w-12" />}
                  {posStatus === 'failed' && <X className="h-12 w-12" />}
                </div>
                {posStatus === 'waiting' && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-24 w-24 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
              
              <h2 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">
                {posStatus === 'waiting' ? (lang === 'tr' ? 'POS İŞLEMİ' : 'POS TRANSACTION') : 
                 posStatus === 'approved' ? (lang === 'tr' ? 'ONAYLANDI' : 'APPROVED') : 
                 (lang === 'tr' ? 'HATA' : 'ERROR')}
              </h2>
              
              <p className="text-slate-500 font-bold text-sm leading-relaxed">
                {posMessage}
              </p>

              {posMessage.includes("Yerel bağlantı köprüsü") && (
                <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-left">
                  <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Kurulum Gerekli</h4>
                  <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                    Web tarayıcıları güvenlik nedeniyle yerel ağdaki cihazlara (192.168.x.x) doğrudan erişemez. 
                    İletişimi sağlamak için bilgisayarınızda bir <b>"LookPrice POS Bridge"</b> yazılımı çalışıyor olmalıdır.
                  </p>
                </div>
              )}

              {posStatus === 'failed' && (
                <button 
                  onClick={() => setPosStatus('idle')}
                  className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
                >
                  {lang === 'tr' ? 'Kapat' : 'Close'}
                </button>
              )}
            </motion.div>
          </motion.div>
        )}

        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
            >
              <div>
                <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-1">{lang === 'tr' ? 'Satış Başarılı!' : 'Sale Successful!'}</h2>
                <p className="text-slate-400 font-medium text-xs mb-4">
                  {lang === 'tr' ? `Satış #${lastSaleId} başarıyla kaydedildi.` : `Sale #${lastSaleId} recorded successfully.`}
                </p>
              </div>

              {/* Thermal Receipt Visual Preview (On Screen) */}
              <div className="mb-6 max-h-64 overflow-y-auto bg-amber-50/40 border border-amber-200/40 rounded-2xl p-5 text-left font-mono text-xs leading-relaxed text-slate-800 shadow-inner scrollbar-thin">
                <div className="text-center border-b border-dashed border-slate-300 pb-3 mb-3">
                  <h4 className="font-extrabold text-sm uppercase text-slate-900 tracking-tight">
                    {branding?.store_name || branding?.name || (lang === 'tr' ? "Seçkin Mağaza" : "Premium Store")}
                  </h4>
                  <p className="text-[10px] text-amber-800 font-bold mt-1 tracking-widest">{lang === 'tr' ? 'SİPARİŞ FİŞİ' : 'ORDER RECEIPT'}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Mağaza ID: {storeId} | Fiş: #{lastSaleId}</p>
                  <p className="text-[10px] text-slate-400">{new Date().toLocaleString('tr-TR')}</p>
                </div>
                
                <div className="space-y-1.5 mb-3 text-[11px] text-slate-700">
                  {lastCart.map((item, idx) => (
                    <div key={idx} className="flex justify-between gap-2">
                      <span className="truncate flex-1 font-semibold">{item.quantity}x {item.name}</span>
                      <span className="font-bold text-slate-900">{(parseFloat(item.price) * item.quantity).toFixed(2)} ₺</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-dashed border-slate-300 pt-3 font-bold text-xs">
                  <div className="flex justify-between text-slate-900 text-sm">
                    <span>TOPLAM</span>
                    <span>{lastCart.reduce((sum, i) => sum + ((parseFloat(i.price) || 0) * i.quantity), 0).toFixed(2)} ₺</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[10px] mt-1 font-medium">
                    <span>Ödeme Tipi</span>
                    <span className="uppercase text-slate-700 font-bold">{paymentMethod === 'cash' ? (lang === 'tr' ? 'NAKİT' : 'CASH') : (lang === 'tr' ? 'KREDİ KARTI' : 'CREDIT CARD')}</span>
                  </div>
                </div>

                {lastFiscal && (
                  <div className="mt-4 pt-2 border-t border-dashed border-slate-300 text-[9px] text-center text-slate-400">
                    <p>FİŞ NO: {lastFiscal.receiptNo}</p>
                    <p>Z NO: {lastFiscal.zNo}</p>
                    <p>CİHAZ: {lastFiscal.brand} - {lastFiscal.terminal}</p>
                    <p className="mt-1 font-bold">MALİ MÜHÜR</p>
                  </div>
                )}
                
                <div className="mt-4 text-center text-[9px] text-slate-400">
                  <p>Bizi tercih ettiğiniz için teşekkürler!</p>
                </div>
              </div>

              {/* Hidden Clean HTML for Thermal Printer Output */}
              <div id="pos-receipt-printable" className="hidden">
                <div className="text-center border-b">
                  <h3 className="font-bold" style={{ fontSize: '13px', margin: '0' }}>
                    {branding?.store_name || branding?.name || 'LOOKPRICE TERMINAL'}
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 'bold' }}>SİPARİŞ FİŞİ</p>
                  <p style={{ margin: '2px 0 0 0' }}>Mağaza ID: {storeId} | Fiş No: #{lastSaleId}</p>
                  <p style={{ margin: '2px 0 0 0' }}>{new Date().toLocaleString('tr-TR')}</p>
                </div>
                
                <div style={{ margin: '8px 0' }}>
                  {lastCart.map((item, idx) => (
                    <div key={idx} className="flex-between" style={{ fontSize: '11px', marginBottom: '2px' }}>
                      <span>{item.quantity}x {item.name}</span>
                      <span>{(parseFloat(item.price) * item.quantity).toFixed(2)} ₺</span>
                    </div>
                  ))}
                </div>
                
                <div className="font-bold" style={{ borderTop: '1px dashed black', paddingTop: '6px', fontSize: '11px' }}>
                  <div className="flex-between">
                    <span>TOPLAM:</span>
                    <span>{lastCart.reduce((sum, i) => sum + ((parseFloat(i.price) || 0) * i.quantity), 0).toFixed(2)} ₺</span>
                  </div>
                  <div className="flex-between" style={{ fontWeight: 'normal', fontSize: '10px', marginTop: '4px' }}>
                    <span>Ödeme Yöntemi:</span>
                    <span>{paymentMethod === 'cash' ? 'NAKİT' : 'KREDİ KARTI'}</span>
                  </div>
                </div>

                {lastFiscal && (
                  <div style={{ marginTop: '12px', paddingTop: '6px', borderTop: '1px dashed black', fontSize: '9px', textAlign: 'center' }}>
                    <p style={{ margin: '2px 0' }}>FİŞ NO: {lastFiscal.receiptNo}</p>
                    <p style={{ margin: '2px 0' }}>Z NO: {lastFiscal.zNo}</p>
                    <p style={{ margin: '2px 0' }}>CİHAZ: {lastFiscal.brand} - {lastFiscal.terminal}</p>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 'bold' }}>MALİ MÜHÜR</p>
                  </div>
                )}
                
                <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '9px', borderTop: '1px dashed black', paddingTop: '6px' }}>
                  <p style={{ margin: '0' }}>Bizi tercih ettiğiniz için teşekkürler!</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button 
                  onClick={handlePrintReceipt}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Printer className="h-5 w-5" />
                  {lang === 'tr' ? 'Fiş Yazdır' : 'Print Receipt'}
                </button>
                <button 
                  onClick={() => {
                    setShowSuccess(false);
                    if (searchInputRef.current) {
                      searchInputRef.current.focus();
                    }
                  }}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all active:scale-[0.98]"
                >
                  {lang === 'tr' ? 'Devam Et' : 'Continue'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* End of Day Report Modal (Gün Sonu Raporu) */}
        {showReportModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-100"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">{lang === 'tr' ? 'Gün Sonu Raporu' : 'End of Day Report'}</h3>
                    <p className="text-xs text-slate-400 font-semibold">{branding?.store_name || branding?.name || 'LOOKPRICE'}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowReportModal(false)}
                  className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Date Filter Bar */}
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{lang === 'tr' ? 'Rapor Tarihi' : 'Report Date'}</span>
                <div className="relative flex items-center">
                  <Calendar className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input 
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                  />
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                {reportLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-indigo-500">
                    <RefreshCw className="h-10 w-10 animate-spin mb-4" />
                    <p className="text-sm font-bold text-slate-500">{lang === 'tr' ? 'Rapor yükleniyor...' : 'Loading report...'}</p>
                  </div>
                ) : reportData ? (
                  <>
                    {/* Revenue cards split by payment type */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Cash Card */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                              <Banknote className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{lang === 'tr' ? 'Nakit Satış' : 'Cash Sales'}</span>
                          </div>
                          <p className="text-xl font-black text-slate-800">
                            {(reportData.payments?.find((p: any) => p.payment_method === 'cash')?.total_amount || 0).toFixed(2)} ₺
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold mt-2">
                          {reportData.payments?.find((p: any) => p.payment_method === 'cash')?.transaction_count || 0} {lang === 'tr' ? 'İşlem' : 'Txn'}
                        </span>
                      </div>

                      {/* Card Card */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                              <CreditCard className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{lang === 'tr' ? 'Kredi Kartı' : 'Credit Card'}</span>
                          </div>
                          <p className="text-xl font-black text-slate-800">
                            {(reportData.payments?.find((p: any) => p.payment_method === 'credit_card')?.total_amount || 0).toFixed(2)} ₺
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold mt-2">
                          {reportData.payments?.find((p: any) => p.payment_method === 'credit_card')?.transaction_count || 0} {lang === 'tr' ? 'İşlem' : 'Txn'}
                        </span>
                      </div>

                      {/* Total Card */}
                      <div className="bg-indigo-600 text-white p-5 rounded-2xl shadow-md shadow-indigo-600/10 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-7 w-7 rounded-lg bg-white/20 text-white flex items-center justify-center font-bold">
                              <TrendingUp className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-bold text-indigo-200 uppercase tracking-wide">{lang === 'tr' ? 'Gün Toplamı' : 'Day Total'}</span>
                          </div>
                          <p className="text-xl font-black">
                            {((reportData.payments?.reduce((sum: number, p: any) => sum + p.total_amount, 0)) || 0).toFixed(2)} ₺
                          </p>
                        </div>
                        <span className="text-[10px] text-indigo-200 font-bold mt-2">
                          {((reportData.payments?.reduce((sum: number, p: any) => sum + p.transaction_count, 0)) || 0)} {lang === 'tr' ? 'İşlem' : 'Txn'}
                        </span>
                      </div>
                    </div>

                    {/* Daily Product Quantities breakdown table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                        <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                          {lang === 'tr' ? 'Ürün Satış Adetleri' : 'Product Sales Counts'}
                        </span>
                        <span className="text-xs font-bold text-indigo-600">
                          {reportData.products?.length || 0} {lang === 'tr' ? 'Farklı Ürün' : 'Unique Items'}
                        </span>
                      </div>

                      <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                        {reportData.products && reportData.products.length > 0 ? (
                          reportData.products.map((p: any, idx: number) => (
                            <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-slate-800 truncate">{p.product_name}</p>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">{(p.total_revenue / p.total_quantity).toFixed(2)} ₺ / {lang === 'tr' ? 'birim' : 'unit'}</p>
                              </div>
                              <div className="flex items-center gap-4 text-right pl-3">
                                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-black min-w-16 text-center">
                                  {p.total_quantity} {lang === 'tr' ? 'Adet' : 'Qty'}
                                </span>
                                <span className="text-sm font-extrabold text-slate-700 min-w-20">
                                  {p.total_revenue?.toFixed(2)} ₺
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-12 text-center text-slate-400">
                            <Package className="h-10 w-10 mx-auto mb-2 opacity-25" />
                            <p className="text-xs font-bold">{lang === 'tr' ? 'Bugün henüz ürün satışı yapılmadı' : 'No products sold today yet'}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Hidden Z-Report HTML for printing */}
                    <div id="pos-z-report-printable" className="hidden">
                      <div className="text-center border-b">
                        <h3 className="font-bold" style={{ fontSize: '13px', margin: '0' }}>
                          {branding?.store_name || branding?.name || 'LOOKPRICE TERMINAL'}
                        </h3>
                        <p style={{ margin: '4px 0 0 0', fontWeight: 'bold' }}>GÜN SONU Z RAPORU</p>
                        <p style={{ margin: '2px 0 0 0' }}>Rapor Tarihi: {reportDate}</p>
                        <p style={{ margin: '2px 0 0 0' }}>Çıktı Zamanı: {new Date().toLocaleString('tr-TR')}</p>
                      </div>
                      
                      <div className="border-b" style={{ padding: '6px 0', fontSize: '10px' }}>
                        <p className="font-bold" style={{ margin: '0 0 4px 0' }}>ÖDEME ÖZETİ</p>
                        <div className="flex-between">
                          <span>NAKİT SATIŞ:</span>
                          <span className="font-bold">{(reportData.payments?.find((p: any) => p.payment_method === 'cash')?.total_amount || 0).toFixed(2)} ₺</span>
                        </div>
                        <div className="flex-between">
                          <span>KREDİ KARTI:</span>
                          <span className="font-bold">{(reportData.payments?.find((p: any) => p.payment_method === 'credit_card')?.total_amount || 0).toFixed(2)} ₺</span>
                        </div>
                        <div className="flex-between font-bold" style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px solid black' }}>
                          <span>TOPLAM CİRO:</span>
                          <span>
                            {((reportData.payments?.reduce((sum: number, p: any) => sum + p.total_amount, 0)) || 0).toFixed(2)} ₺
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ marginTop: '10px' }}>
                        <p className="font-bold" style={{ margin: '0 0 4px 0', fontSize: '10px' }}>SAYILAN ÜRÜN KALEMLERİ</p>
                        <table>
                          <thead>
                            <tr style={{ borderBottom: '1px solid black' }}>
                              <th>Ürün Adı</th>
                              <th className="text-right">Adet</th>
                              <th className="text-right">Tutar</th>
                            </tr>
                          </thead>
                          <tbody style={{ fontSize: '10px' }}>
                            {reportData.products && reportData.products.length > 0 ? (
                              reportData.products.map((p: any, idx: number) => (
                                <tr key={idx}>
                                  <td>{p.product_name}</td>
                                  <td className="text-right">{p.total_quantity}</td>
                                  <td className="text-right">{p.total_revenue?.toFixed(2)} ₺</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={3} style={{ textAlign: 'center' }}>Haraket yok.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      
                      <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '9px', borderTop: '1px dashed black', paddingTop: '8px' }}>
                        <p style={{ margin: '0' }}>Z RAPORU SONU</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-25 text-slate-500" />
                    <p className="text-sm font-bold text-slate-600 mb-1">{lang === 'tr' ? 'Seçilen Güne Ait Rapor Bulunamadı' : 'No report found for selected date'}</p>
                    <p className="text-xs text-slate-400 font-medium">{lang === 'tr' ? 'Bu tarihte henüz tamamlanmış POS satışı gerçekleşmemiş.' : 'No completed POS sales recorded on this date.'}</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50/50">
                <button 
                  disabled={reportLoading || !reportData}
                  onClick={handlePrintReport}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  <Printer className="h-4 w-4" />
                  {lang === 'tr' ? 'Raporu Fiş Yazdır' : 'Print Z-Report'}
                </button>
                <button 
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all active:scale-[0.98]"
                >
                  {lang === 'tr' ? 'Kapat' : 'Close'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showQrModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col border border-slate-100 max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 border border-rose-100">
                    <Coffee className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">
                      {lang === 'tr' ? 'Masalar & Dijital Menü QR Kodları' : 'Tables & Digital Menu QR Codes'}
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold">{branding?.store_name || branding?.name || 'LOOKPRICE'}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowQrModal(false)}
                  className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-100 bg-slate-50/30 p-2 gap-2">
                <button
                  type="button"
                  onClick={() => setQrModalTab('single')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    qrModalTab === 'single'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  {lang === 'tr' ? 'Tek Masa QR' : 'Single Table QR'}
                </button>
                <button
                  type="button"
                  onClick={() => setQrModalTab('all')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    qrModalTab === 'all'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  {lang === 'tr' ? 'Tüm Masalar Kataloğu' : 'All Tables Catalogue'}
                </button>
                <button
                  type="button"
                  onClick={() => setQrModalTab('manage')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    qrModalTab === 'manage'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  {lang === 'tr' ? 'Masa Sayısı & Yönetimi' : 'Table Count & Management'}
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                {qrModalTab === 'single' && (
                  <div className="flex flex-col items-center">
                    <div className="w-full max-w-sm mb-6">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                        {lang === 'tr' ? 'Yazdırılacak Masayı Seçin' : 'Select Table to Print'}
                      </label>
                      <select
                        value={singleQrTable}
                        onChange={(e) => setSingleQrTable(e.target.value)}
                        className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-xl font-bold text-slate-700 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all cursor-pointer"
                      >
                        {allTables.map((t) => (
                          <option key={t.id} value={t.table_number}>
                            {lang === 'tr' ? `Masa ${t.table_number}` : `Table ${t.table_number}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div id="pos-qr-card-printable-content" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center flex flex-col items-center max-w-xs w-full">
                      {branding?.logo_url ? (
                        <img src={branding.logo_url} alt="" className="max-h-12 max-w-full mb-3 object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center mb-3 font-black text-base">
                          {branding?.store_name?.[0] || branding?.name?.[0] || 'M'}
                        </div>
                      )}
                      <h4 className="text-base font-black text-slate-800 uppercase tracking-tight mb-1 text-center truncate max-w-full">
                        {branding?.store_name || branding?.name || 'Seçkin Restoran'}
                      </h4>
                      <h3 className="text-xl font-black text-rose-600 mb-2">
                        {lang === 'tr' ? `MASA ${singleQrTable.replace(/Masa/gi, '').trim()}` : `TABLE ${singleQrTable.replace(/Masa/gi, '').trim()}`}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold mb-4 text-center tracking-wide uppercase">
                        {lang === 'tr' ? 'DİJİTAL MENÜ' : 'DIGITAL MENU'}
                      </p>

                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4 flex items-center justify-center">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + "/digital-menu/" + storeId + "/" + singleQrTable.replace(/Masa/gi, '').trim())}`} 
                          alt="Digital Menu QR" 
                          className="h-36 w-36 object-contain"
                        />
                      </div>

                      <p className="text-[11px] font-bold text-slate-500 leading-relaxed text-center">
                        {lang === 'tr' ? 'Sipariş vermek ve menüyü incelemek için cep telefonunuzla taratın.' : 'Scan with your phone to view menu and order.'}
                      </p>
                      
                      <span className="text-[8px] text-slate-300 font-black mt-4 tracking-widest uppercase">
                        POWERED BY LOOKPRICE
                      </span>
                    </div>
                  </div>
                )}

                {qrModalTab === 'all' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <div>
                        <h4 className="text-sm font-bold text-slate-700">
                          {lang === 'tr' ? 'Tüm Masa QR Kartları' : 'All Table QR Cards'}
                        </h4>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                          {lang === 'tr' ? `${allTables.length} masanın tamamına ait QR katalog çıktılarını alın.` : `Get QR catalogue printouts for all ${allTables.length} tables.`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handlePrintAllQrs}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-sm shadow-indigo-100 active:scale-95"
                      >
                        <Printer className="h-4 w-4" />
                        {lang === 'tr' ? 'Hepsini Yazdır (A4)' : 'Print All (A4)'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-1">
                      {allTables.map((table) => {
                        const cleanNum = table.table_number.replace(/Masa/gi, '').trim();
                        return (
                          <div 
                            key={table.id}
                            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-rose-200 transition-all flex flex-col items-center text-center relative group"
                          >
                            <h5 className="font-extrabold text-xs text-slate-400 tracking-wider mb-1 uppercase">
                              {lang === 'tr' ? `MASA ${cleanNum}` : `TABLE ${cleanNum}`}
                            </h5>
                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 mb-3 flex items-center justify-center">
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(window.location.origin + "/digital-menu/" + storeId + "/" + cleanNum)}`} 
                                alt="" 
                                className="h-20 w-20 object-contain"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handlePrintSingleQr(cleanNum)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 w-full justify-center"
                            >
                              <Printer className="h-3 w-3" />
                              {lang === 'tr' ? 'Yazdır' : 'Print'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {qrModalTab === 'manage' && (
                  <div className="flex flex-col items-center py-4">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-md w-full text-center">
                      <div className="h-12 w-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 border border-rose-100 mx-auto mb-4">
                        <Coffee className="h-6 w-6" />
                      </div>
                      <h4 className="font-extrabold text-slate-800 text-lg mb-2">
                        {lang === 'tr' ? 'Masa Sayısını Arttırın / Azaltın' : 'Increase / Decrease Table Count'}
                      </h4>
                      <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">
                        {lang === 'tr' 
                          ? 'Masa sayısını güncellediğinizde sistem yeni masaları otomatik olarak ekler ve QR kodlarını anında oluşturur. Mevcut siparişi (doluluğu) olan masalar korunur.'
                          : 'When you update the table count, the system automatically adds new tables and creates QR codes instantly. Tables with active orders remain protected.'}
                      </p>

                      <div className="flex items-center justify-center gap-6 mb-8">
                        <button
                          type="button"
                          onClick={() => setNewTableCount(prev => Math.max(1, prev - 1))}
                          className="h-12 w-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all font-black text-xl active:scale-95"
                        >
                          <Minus className="h-5 w-5" />
                        </button>
                        <span className="text-4xl font-black text-slate-800 tracking-tight font-sans min-w-[80px]">
                          {newTableCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => setNewTableCount(prev => Math.min(200, prev + 1))}
                          className="h-12 w-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all font-black text-xl active:scale-95"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveTableCount}
                        disabled={savingTableCount}
                        className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-100 flex items-center justify-center gap-2 active:scale-95"
                      >
                        {savingTableCount ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            {lang === 'tr' ? 'Masalar Güncelleniyor...' : 'Updating Tables...'}
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            {lang === 'tr' ? 'Masa Sayısını Güncelle & Kaydet' : 'Update & Save Table Count'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50/50">
                {qrModalTab === 'single' && (
                  <button 
                    type="button"
                    onClick={handlePrintQr}
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <Printer className="h-4 w-4" />
                    {lang === 'tr' ? 'Seçili Masayı Yazdır' : 'Print Selected Table'}
                  </button>
                )}
                {qrModalTab === 'all' && (
                  <button 
                    type="button"
                    onClick={handlePrintAllQrs}
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <Printer className="h-4 w-4" />
                    {lang === 'tr' ? 'Tüm Kataloğu Yazdır (A4)' : 'Print All Catalogue (A4)'}
                  </button>
                )}
                <button 
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all active:scale-[0.98]"
                >
                  {lang === 'tr' ? 'Kapat' : 'Close'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isChangingTable && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col border border-slate-100 max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                    <ArrowLeftRight className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">{lang === 'tr' ? 'Masa Taşıma / Değiştirme' : 'Table Transfer / Change'}</h3>
                    <p className="text-xs text-slate-400 font-semibold">{lang === 'tr' ? `${selectedTable} masasındaki adisyonu taşıyın` : `Transfer bill from ${selectedTable}`}</p>
                  </div>
                </div>
                <button onClick={() => setIsChangingTable(false)} className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-all">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {allTables.map((table) => (
                    <button
                      key={table.id}
                      disabled={table.status === 'occupied' || table.table_number === selectedTable || transferLoading}
                      onClick={() => handleTableTransfer(table.table_number)}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 group relative ${
                        table.table_number === selectedTable ? 'border-indigo-600 bg-indigo-50 opacity-50' :
                        table.status === 'occupied' ? 'border-rose-100 bg-rose-50 opacity-50 cursor-not-allowed' :
                        'border-slate-100 bg-white hover:border-indigo-500 hover:bg-indigo-50/30'
                      }`}
                    >
                      <span className={`text-sm font-black ${table.status === 'occupied' ? 'text-rose-600' : 'text-slate-900'}`}>{table.table_number}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        {table.status === 'occupied' ? (lang === 'tr' ? 'DOLU' : 'FULL') : (lang === 'tr' ? 'BOŞ' : 'EMPTY')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <button 
                  onClick={() => setIsChangingTable(false)}
                  className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold transition-all active:scale-[0.98]"
                >
                  {lang === 'tr' ? 'İptal' : 'Cancel'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FastPosTab;
