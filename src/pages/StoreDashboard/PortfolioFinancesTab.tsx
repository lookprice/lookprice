import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Calendar, 
  FileSpreadsheet,
  Printer, 
  Coins, 
  Search,
  X,
  PlusCircle,
  Wallet, 
  Edit3, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight, 
  RotateCcw, 
  Check, 
  Receipt, 
  User,
  Landmark,
  CreditCard,
  ChevronDown,
  FileCheck2,
  PieChart as PieIcon,
  Layers,
  ArrowRight,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Banknote,
  Store,
  ArrowLeftRight
} from "lucide-react";
import * as XLSX from "xlsx";
import { useLanguage } from "../../contexts/LanguageContext";
import { usePortfolioFinances, PortfolioTransaction } from "../../hooks/usePortfolioFinances";
import { useRealEstate } from "../../hooks/useRealEstate";
import { api } from "../../services/api";
import { contractTemplates, resolveOfficialPropertyTitle } from "../../utils/contractTemplates";
import { printHtmlContract } from "../../utils/printContractHelper";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { DomainId, resolveDomainId } from "../../utils/sectorCapability";

interface PortfolioFinancesTabProps {
  storeId: number;
  isAutomotive?: boolean;
  isRealEstate?: boolean;
  domainId?: DomainId;
  branding?: any;
}

export interface FinancialAccount {
  id: number;
  store_id: number;
  account_type: "bank" | "credit_card" | "check" | "cash" | "marketplace";
  account_name: string;
  bank_name?: string;
  account_number?: string;
  currency: string;
  initial_balance: number;
  created_at?: string;
}

type DatePreset = "all" | "today" | "this_week" | "this_month" | "last_month" | "this_year" | "custom";
type ViewTabMode = "statement" | "checks_notes" | "portfolio_profit";

const SUPPORTED_CURRENCIES = ["GBP", "EUR", "USD", "TRY"] as const;

export default function PortfolioFinancesTab({ 
  storeId, 
  isAutomotive = false, 
  isRealEstate = false,
  domainId,
  branding
}: PortfolioFinancesTabProps) {
  const { lang } = useLanguage();
  const isTr = lang === "tr";

  const resolvedDomain: DomainId = domainId || resolveDomainId(branding);
  const activeAutomotive = Boolean(isAutomotive || resolvedDomain === "AUTOMOTIVE");
  const activeRealEstate = Boolean(isRealEstate || resolvedDomain === "REAL_ESTATE" || resolvedDomain === "DEVELOPER_PROJECT");
  const isPortfolioSector = activeAutomotive || activeRealEstate;
  const isHorecaSector = resolvedDomain === "HORECA" || resolvedDomain === "HOTEL";
  const isHotelSector = resolvedDomain === "HOTEL";
  const isCorporateSector = resolvedDomain === "CORPORATE";
  const isBookstoreSector = resolvedDomain === "BOOKSTORE";
  const isShopLPSector = resolvedDomain === "RETAIL";
  const defaultSectorCurrency = activeRealEstate ? "GBP" : "TRY";

  const { properties } = useRealEstate(activeRealEstate ? storeId : undefined);
  const { transactions, loading: loadingFinances, addTransaction, updateTransaction, deleteTransaction, fetchTransactions } = usePortfolioFinances(storeId);

  // Tab View Switcher: "statement" (Genel Kasa & Ekstre) vs "portfolio_profit" (Portföy Kâr/Zarar Takibi - yalnız portföy sektörleri)
  const [viewTab, setViewTab] = useState<ViewTabMode>("statement");

  useEffect(() => {
    if (!isPortfolioSector && viewTab === "portfolio_profit") {
      setViewTab("statement");
    }
  }, [isPortfolioSector, viewTab]);

  // Financial Accounts (Bank accounts, Credit cards, etc.)
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [showAccountsModal, setShowAccountsModal] = useState(false);
  const [showAccountsSummary, setShowAccountsSummary] = useState(true);

  // Store default currency & exchange rates for cross-currency portfolio P&L
  const [storeDefaultCurrency, setStoreDefaultCurrency] = useState<string>(
    (branding?.default_currency || branding?.currency || defaultSectorCurrency).toUpperCase()
  );
  const [storeCurrencyRates, setStoreCurrencyRates] = useState<Record<string, number>>(() => {
    const base: Record<string, number> = { USD: 34.50, EUR: 37.80, GBP: 45.20, TRY: 1 };
    const raw = branding?.currency_rates || {};
    if (typeof raw === "object" && raw !== null) {
      Object.keys(raw).forEach(k => {
        const v = parseFloat(raw[k]);
        if (!isNaN(v) && v > 1.05) base[k.toUpperCase()] = v;
      });
    }
    base.TRY = 1;
    return base;
  });

  useEffect(() => {
    if (branding?.default_currency || branding?.currency) {
      setStoreDefaultCurrency((branding.default_currency || branding.currency).toUpperCase());
    }
    if (branding?.currency_rates && typeof branding.currency_rates === "object") {
      setStoreCurrencyRates(prev => {
        const next = { ...prev };
        Object.keys(branding.currency_rates).forEach(k => {
          const v = parseFloat(branding.currency_rates[k]);
          if (!isNaN(v) && v > 1.05) next[k.toUpperCase()] = v;
        });
        next.TRY = 1;
        return next;
      });
    }
  }, [branding?.default_currency, branding?.currency, branding?.currency_rates]);

  useEffect(() => {
    if (!storeId) return;
    const fetchStore = typeof (api as any).getStoreInfo === "function"
      ? (api as any).getStoreInfo
      : typeof (api as any).getStoreConfig === "function"
      ? (api as any).getStoreConfig
      : null;

    if (!fetchStore) return;

    fetchStore(storeId)
      .then((info: any) => {
        if (!info) return;
        const defCur = (info.default_currency || info.currency || defaultSectorCurrency).toUpperCase();
        setStoreDefaultCurrency(defCur);
        const rawRates = info.currency_rates || {};
        const parsedRates: Record<string, number> = { USD: 34.50, EUR: 37.80, GBP: 45.20, TRY: 1 };
        if (typeof rawRates === "object" && rawRates !== null) {
          Object.keys(rawRates).forEach(k => {
            const v = parseFloat(rawRates[k]);
            if (!isNaN(v) && v > 1.05) parsedRates[k.toUpperCase()] = v;
          });
        }
        parsedRates["TRY"] = 1;
        setStoreCurrencyRates(parsedRates);
      })
      .catch((err: any) => console.error("Error fetching store currency info:", err));
  }, [storeId, defaultSectorCurrency]);

  const convertPortfolioCurrency = useCallback((amount: number, fromCurr: string, toCurr: string) => {
    const val = Number(amount) || 0;
    const f = (fromCurr || storeDefaultCurrency).toUpperCase();
    const t = (toCurr || storeDefaultCurrency).toUpperCase();
    if (f === t || val === 0) return val;
    const fromTry = f === "TRY" ? 1 : (storeCurrencyRates[f] || 35);
    const toTry = t === "TRY" ? 1 : (storeCurrencyRates[t] || 35);
    return Number(((val * fromTry) / toTry).toFixed(2));
  }, [storeDefaultCurrency, storeCurrencyRates]);

  // Vehicles for automotive finances
  const [vehicles, setVehicles] = useState<any[]>([]);
  useEffect(() => {
    if (activeAutomotive && storeId) {
      api.getVehicles(storeId)
        .then(res => {
          setVehicles(Array.isArray(res) ? res : []);
        })
        .catch(err => console.error("Error fetching vehicles for finances:", err));
    }
  }, [storeId, activeAutomotive]);

  // Fetch financial accounts
  const fetchAccounts = useCallback(async () => {
    if (!storeId) return;
    setLoadingAccounts(true);
    try {
      const res = await api.getFinancialAccounts(storeId);
      if (Array.isArray(res)) {
        setAccounts(res);
      }
    } catch (err) {
      console.error("Error fetching financial accounts:", err);
    } finally {
      setLoadingAccounts(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // shopLP Marketplace Vaults Sync & Hakediş Virmanı States
  const [syncingMarketplaces, setSyncingMarketplaces] = useState(false);
  const marketplaceSyncedStoreRef = React.useRef<number | null>(null);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [transferForm, setTransferForm] = useState({
    from_key: "", // "acc:<id>" | "cash:<CUR>"
    to_key: "",   // "acc:<id>" | "cash:<CUR>"
    amount: "",
    date: new Date().toISOString().split("T")[0],
    reference_no: "",
    title: "",
    description: ""
  });

  const handleSyncMarketplaces = useCallback(async (silent = false) => {
    if (!storeId || !isShopLPSector) return;
    setSyncingMarketplaces(true);
    try {
      const res = await api.syncMarketplaceVaults(storeId);
      await Promise.all([fetchAccounts(), fetchTransactions()]);
      if (!silent) {
        const orderSynced = Number(res?.syncedOrders ?? res?.ordersSynced ?? 0);
        const expSynced = Number(res?.syncedExpenseInvoices ?? res?.expensesSynced ?? 0);
        const vaultsCount = Array.isArray(res?.ensuredVaults) ? res.ensuredVaults.length : Number(res?.vaultsCreated ?? 0);
        toast.success(
          isTr
            ? `Pazaryeri kasaları güncellendi (${vaultsCount} kasa, ${orderSynced} sipariş, ${expSynced} gider faturası).`
            : `Marketplace vaults synced (${vaultsCount} vaults, ${orderSynced} orders, ${expSynced} expenses).`
        );
      }
    } catch (err: any) {
      if (!silent) {
        toast.error(err?.message || (isTr ? "Pazaryeri kasaları senkronize edilemedi." : "Failed to sync marketplace vaults."));
      }
    } finally {
      setSyncingMarketplaces(false);
    }
  }, [storeId, isShopLPSector, fetchAccounts, fetchTransactions, isTr]);

  useEffect(() => {
    if (!storeId || !isShopLPSector) return;
    if (marketplaceSyncedStoreRef.current === storeId) return;
    marketplaceSyncedStoreRef.current = storeId;
    handleSyncMarketplaces(true);
  }, [storeId, isShopLPSector, handleSyncMarketplaces]);

  // Modal & Edit States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTx, setEditingTx] = useState<PortfolioTransaction | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [showCharts, setShowCharts] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    if (!openDropdown) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && !target.closest("[data-dropdown-root]")) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [openDropdown]);

  // Account modal states
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);
  const [accountFormData, setAccountFormData] = useState({
    account_type: "bank" as "bank" | "credit_card" | "check" | "cash" | "marketplace",
    account_name: "",
    bank_name: "",
    account_number: "",
    currency: "TRY",
    initial_balance: "0"
  });

  // Account / Cash Vault Statement ("Ekstre") Modal States
  const [statementModalOpen, setStatementModalOpen] = useState(false);
  const [statementTarget, setStatementTarget] = useState<{ accountId?: number; cashCurrency?: string; label: string } | null>(null);
  const [statementStartDate, setStatementStartDate] = useState<string>("");
  const [statementEndDate, setStatementEndDate] = useState<string>("");
  const [statementLoading, setStatementLoading] = useState(false);
  const [statementData, setStatementData] = useState<any | null>(null);

  // Checks & Promissory Notes ("Çek & Senetler") States
  const [checksNotes, setChecksNotes] = useState<any[]>([]);
  const [loadingChecks, setLoadingChecks] = useState(false);
  const [companiesList, setCompaniesList] = useState<any[]>([]);
  const [checkDirectionFilter, setCheckDirectionFilter] = useState<"all" | "received" | "issued">("all");
  const [checkStatusFilter, setCheckStatusFilter] = useState<string>("all");
  const [checkInstrumentFilter, setCheckInstrumentFilter] = useState<"all" | "check" | "promissory_note">("all");
  const [checkStartDate, setCheckStartDate] = useState<string>("");
  const [checkEndDate, setCheckEndDate] = useState<string>("");
  const [checkSearchQuery, setCheckSearchQuery] = useState<string>("");
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [editingCheck, setEditingCheck] = useState<any | null>(null);
  const [confirmDeleteCheckId, setConfirmDeleteCheckId] = useState<number | null>(null);
  const [checkFormData, setCheckFormData] = useState({
    direction: "received" as "received" | "issued",
    instrument_type: "check" as "check" | "promissory_note",
    document_no: "",
    company_id: "",
    contact_name: "",
    bank_name: "",
    branch_name: "",
    drawer_name: "",
    issue_date: new Date().toISOString().split("T")[0],
    due_date: new Date().toISOString().split("T")[0],
    amount: "",
    currency: defaultSectorCurrency,
    exchange_rate: "1",
    status: "portfolio",
    collection_account_id: "",
    collection_account_name: "",
    notes: ""
  });
  const [settlingCheck, setSettlingCheck] = useState<any | null>(null);
  const [settleAccountId, setSettleAccountId] = useState<string>("");
  const [settleAccountName, setSettleAccountName] = useState<string>("");
  const [settleDate, setSettleDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [settleNotes, setSettleNotes] = useState<string>("");
  const [settlingSubmitting, setSettlingSubmitting] = useState(false);

  const fetchChecksNotes = useCallback(async () => {
    if (!storeId) return;
    setLoadingChecks(true);
    try {
      const res = await api.getChecksNotes({}, storeId);
      setChecksNotes(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Error fetching checks/notes:", err);
    } finally {
      setLoadingChecks(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchChecksNotes();
    if (storeId) {
      api.getCompanies(true, storeId)
        .then(res => setCompaniesList(Array.isArray(res) ? res : []))
        .catch(() => {});
    }
  }, [fetchChecksNotes, storeId]);

  // Filter States
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currencyFilter, setCurrencyFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [cashVaultFilter, setCashVaultFilter] = useState<string>("all");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<string>("all");
  const [portfolioProfitFilter, setPortfolioProfitFilter] = useState<"all" | "profit" | "loss" | "no_activity">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [portfolioSearch, setPortfolioSearch] = useState("");
  const [profitTabSearch, setProfitTabSearch] = useState("");

  const categories = useMemo(() => {
    if (activeAutomotive) {
      return {
        income: [
          { id: "car_sales", label: isTr ? "Araç Satış Geliri" : "Vehicle Sales Income" },
          { id: "commission", label: isTr ? "Oto Satış Komisyonu" : "Vehicle Sales Commission" },
          { id: "car_rental", label: isTr ? "Araç Kiralama Geliri" : "Car Rental Income" },
          { id: "deposit_income", label: isTr ? "Kapora / Ön Ödeme" : "Deposit Received" },
          { id: "consulting", label: isTr ? "Ekspertiz & Danışmanlık" : "Appraisal & Consulting" },
          { id: "other", label: isTr ? "Diğer Gelirler" : "Other Income" }
        ],
        expense: [
          { id: "car_purchase", label: isTr ? "Stok Araç Alım Bedeli" : "Vehicle Inventory Purchase" },
          { id: "vehicle_maintenance", label: isTr ? "Araç Bakım, Onarım & Ekspertiz" : "Vehicle Maintenance & Appraisal" },
          { id: "advertising", label: isTr ? "Portal İlan Ücretleri" : "Listing Portal Fees" },
          { id: "rent_utilities", label: isTr ? "Ofis/Galeri Kirası & Faturalar" : "Gallery Rent & Utilities" },
          { id: "agent_commission", label: isTr ? "Satış Personeli Primi & Maaş" : "Agent Commission & Salary" },
          { id: "tax_official", label: isTr ? "Noter, Vergi & Resmi Harçlar" : "Notary, Tax & Official Fees" },
          { id: "marketing", label: isTr ? "Reklam & Tanıtım Giderleri" : "Marketing & Printing" },
          { id: "other", label: isTr ? "Diğer Giderler" : "Other Expenses" }
        ]
      };
    }

    if (activeRealEstate) {
      return {
        income: [
          { id: "commission", label: isTr ? "Emlak Satış Komisyonu" : "Real Estate Sales Commission" },
          { id: "rental_placement", label: isTr ? "Kiralama Hizmet Bedeli" : "Rental Placement Fee" },
          { id: "deposit_income", label: isTr ? "Kapora / Ön Ödeme Tahsilatı" : "Deposit Received" },
          { id: "property_management", label: isTr ? "Mülk Yönetim & Aidat Geliri" : "Property Management Fee" },
          { id: "consulting", label: isTr ? "Danışmanlık & Ekspertiz Bedeli" : "Consulting & Appraisal Fee" },
          { id: "other", label: isTr ? "Diğer Gelirler" : "Other Income" }
        ],
        expense: [
          { id: "advertising", label: isTr ? "Portal İlan & Vitrin Ücretleri" : "Listing Portal Fees" },
          { id: "rent_utilities", label: isTr ? "Ofis Kirası, Elektrik, Su & İnternet" : "Office Rent & Utilities" },
          { id: "agent_commission", label: isTr ? "Danışman Primi & Personel Ödemesi" : "Agent Commission & Payroll" },
          { id: "marketing", label: isTr ? "Dijital Reklam, Afiş & Tabela" : "Marketing, Banner & Printing" },
          { id: "vehicle", label: isTr ? "Ulaşım, Taşıt & Yakıt Gideri" : "Transportation & Fuel" },
          { id: "tax_official", label: isTr ? "Tapu, Vergi & Resmi Harçlar" : "Title Deed, Tax & Official Fees" },
          { id: "office_supplies", label: isTr ? "Ofis Mutfak & Kırtasiye Gideri" : "Office & Hospitality Expenses" },
          { id: "other", label: isTr ? "Diğer Giderler" : "Other Expenses" }
        ]
      };
    }

    if (isHorecaSector) {
      return {
        income: [
          { id: "pos_sales", label: isTr ? "Adisyon / Masa & Kasa Satışı" : "POS & Table Sales" },
          { id: "takeaway_delivery", label: isTr ? "Paket Servis & Gel-Al Geliri" : "Takeaway & Delivery Sales" },
          ...(isHotelSector ? [{ id: "hotel_accommodation", label: isTr ? "Oda Konaklama & Rezervasyon Geliri" : "Room & Reservation Income" }] : []),
          { id: "catering_event", label: isTr ? "Catering & Özel Organizasyon" : "Catering & Events" },
          { id: "deposit_income", label: isTr ? "Kapora / Ön Ödeme Tahsilatı" : "Deposit Received" },
          { id: "other", label: isTr ? "Diğer Gelirler" : "Other Income" }
        ],
        expense: [
          { id: "kitchen_supplies", label: isTr ? "Mutfak, Hammadde & İçecek Alımı" : "Kitchen & Beverage Supplies" },
          { id: "rent_utilities", label: isTr ? "İşletme Kirası, Elektrik, Su & Gaz" : "Rent & Utilities" },
          { id: "staff_payroll", label: isTr ? "Personel Maaş, Avans & Prim" : "Staff Payroll & Benefits" },
          { id: "delivery_commission", label: isTr ? "Kurye & Sipariş Platformu Gideri" : "Delivery & Courier Fees" },
          { id: "maintenance_cleaning", label: isTr ? "Temizlik, Bakım & Ekipman" : "Cleaning & Maintenance" },
          { id: "tax_official", label: isTr ? "Vergi, Stopaj & Resmi Harçlar" : "Tax & Official Fees" },
          { id: "marketing", label: isTr ? "Menü, Reklam & Tanıtım" : "Marketing & Menu" },
          { id: "other", label: isTr ? "Diğer Giderler" : "Other Expenses" }
        ]
      };
    }

    if (isCorporateSector) {
      return {
        income: [
          { id: "service_revenue", label: isTr ? "Hizmet & Proje Tahsilatı" : "Service & Project Revenue" },
          { id: "consulting", label: isTr ? "Danışmanlık & Sözleşme Geliri" : "Consulting & Retainer" },
          { id: "deposit_income", label: isTr ? "Ön Ödeme / Avans Tahsilatı" : "Advance / Deposit Received" },
          { id: "other", label: isTr ? "Diğer Gelirler" : "Other Income" }
        ],
        expense: [
          { id: "supplier_payment", label: isTr ? "Tedarikçi & Taşeron Ödemesi" : "Vendor & Contractor Payment" },
          { id: "rent_utilities", label: isTr ? "Ofis Kirası, Elektrik & İnternet" : "Office Rent & Utilities" },
          { id: "staff_payroll", label: isTr ? "Personel Maaş, SGK & Prim" : "Staff Payroll & Benefits" },
          { id: "marketing", label: isTr ? "Dijital Reklam, Web & Tanıtım" : "Digital Marketing & Web" },
          { id: "office_supplies", label: isTr ? "Ofis, Yazılım & Kırtasiye" : "Office, Software & Supplies" },
          { id: "tax_official", label: isTr ? "Vergi, Muhasebe & Resmi Harçlar" : "Tax, Accounting & Fees" },
          { id: "other", label: isTr ? "Diğer Giderler" : "Other Expenses" }
        ]
      };
    }

    // RETAIL (shopLP) & BOOKSTORE (BookLP)
    return {
      income: [
        { id: "retail_sales", label: isBookstoreSector ? (isTr ? "Mağaza & Kitap Satış Geliri" : "Store & Book Sales") : (isTr ? "Mağaza & Kasa Satış Geliri" : "Store & POS Sales") },
        { id: "online_marketplace", label: isTr ? "E-Ticaret & Pazaryeri Tahsilatı" : "E-Commerce & Marketplace Payout" },
        { id: "invoice_collection", label: isTr ? "Cari / Fatura Tahsilatı" : "Account & Invoice Collection" },
        { id: "deposit_income", label: isTr ? "Kapora / Ön Ödeme Tahsilatı" : "Deposit Received" },
        { id: "other", label: isTr ? "Diğer Gelirler" : "Other Income" }
      ],
      expense: [
        { id: "supplier_payment", label: isBookstoreSector ? (isTr ? "Yayınevi & Tedarikçi Ödemesi" : "Publisher & Supplier Payment") : (isTr ? "Mal Alımı & Tedarikçi Ödemesi" : "Inventory & Supplier Payment") },
        ...(isShopLPSector ? [{ id: "marketplace_commission", label: isTr ? "Pazaryeri Komisyon & Hizmet Gideri" : "Marketplace Commission & Fees" }] : []),
        { id: "rent_utilities", label: isTr ? "Mağaza Kirası, Elektrik & İnternet" : "Store Rent & Utilities" },
        { id: "staff_payroll", label: isTr ? "Personel Maaş, SGK & Prim" : "Staff Payroll & Benefits" },
        { id: "shipping_logistics", label: isTr ? "Kargo, Lojistik & Paketleme" : "Shipping & Packaging" },
        { id: "marketing", label: isTr ? "Reklam, Kampanya & Vitrin" : "Advertising & Marketing" },
        { id: "tax_official", label: isTr ? "Vergi, Stopaj & Resmi Harçlar" : "Tax & Official Fees" },
        { id: "office_supplies", label: isTr ? "Mağaza Sarf & Kırtasiye" : "Store Supplies" },
        { id: "other", label: isTr ? "Diğer Giderler" : "Other Expenses" }
      ]
    };
  }, [activeAutomotive, activeRealEstate, isHorecaSector, isHotelSector, isCorporateSector, isBookstoreSector, isShopLPSector, isTr]);

  // Form State
  const [formData, setFormData] = useState({
    type: "income" as "income" | "expense",
    category: categories.income[0]?.id || "other",
    title: "",
    amount: "",
    currency: defaultSectorCurrency,
    date: new Date().toISOString().split("T")[0],
    property_id: "" as string | number,
    payment_method: "cash",
    account_id: "" as string | number,
    account_name: "",
    reference_no: "",
    contact_name: "",
    description: ""
  });

  const paymentMethods = [
    { id: "cash", label: isTr ? "Nakit Kasa" : "Cash" },
    { id: "bank_transfer", label: isTr ? "Banka Havale / EFT" : "Bank Transfer" },
    { id: "credit_card", label: isTr ? "Kredi Kartı" : "Credit Card" },
    { id: "check_promissory", label: isTr ? "Çek / Senet" : "Check / Note" },
    ...(isShopLPSector ? [{ id: "marketplace_vault", label: isTr ? "Pazaryeri Kasası" : "Marketplace Vault" }] : [])
  ];

  // Apply Date Preset
  const handleSelectDatePreset = (preset: DatePreset) => {
    setDatePreset(preset);
    const now = new Date();
    const toIsoDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "today") {
      const today = toIsoDate(now);
      setStartDate(today);
      setEndDate(today);
    } else if (preset === "this_week") {
      const dayOfWeek = now.getDay() || 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - dayOfWeek + 1);
      setStartDate(toIsoDate(monday));
      setEndDate(toIsoDate(now));
    } else if (preset === "this_month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(toIsoDate(firstDay));
      setEndDate(toIsoDate(now));
    } else if (preset === "last_month") {
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(toIsoDate(firstDayLastMonth));
      setEndDate(toIsoDate(lastDayLastMonth));
    } else if (preset === "this_year") {
      const firstDayYear = new Date(now.getFullYear(), 0, 1);
      setStartDate(toIsoDate(firstDayYear));
      setEndDate(toIsoDate(now));
    }
  };

  const normalizePaymentMethod = useCallback((method?: string | null): "cash" | "bank_transfer" | "credit_card" | "check_promissory" | "marketplace_vault" => {
    const token = String(method || "cash").toLowerCase().trim();
    if (
      token === "marketplace_vault" ||
      token === "marketplace" ||
      token.includes("pazaryeri") ||
      token.includes("hepsiburada") ||
      token.includes("trendyol") ||
      token.includes("n11") ||
      token.includes("amazon") ||
      token.includes("pazarama")
    ) {
      return "marketplace_vault";
    }
    if (token === "bank" || token === "bank_transfer" || token === "havale" || token === "eft" || token === "fast" || token === "wire" || token === "transfer") {
      return "bank_transfer";
    }
    if (token === "credit_card" || token === "card" || token === "pos" || token === "kredi_karti" || token === "kredi kartı") {
      return "credit_card";
    }
    if (token === "check_promissory" || token === "check" || token === "promissory_note" || token === "cek" || token === "çek" || token === "senet" || token === "çek/senet") {
      return "check_promissory";
    }
    return "cash";
  }, []);

  // Open modal for New Record (optionally pre-selecting a property)
  const handleOpenCreateModal = (preselectedPropertyId?: string | number) => {
    setEditingTx(null);
    setPortfolioSearch("");
    const defaultCur = currencyFilter !== "all" ? currencyFilter : (storeDefaultCurrency || defaultSectorCurrency);
    setFormData({
      type: "income",
      category: categories.income[0]?.id || "other",
      title: "",
      amount: "",
      currency: defaultCur,
      date: new Date().toISOString().split("T")[0],
      property_id: isPortfolioSector ? (preselectedPropertyId ? String(preselectedPropertyId) : (selectedPropertyFilter !== "all" ? selectedPropertyFilter : "")) : "",
      payment_method: "cash",
      account_id: "",
      account_name: `${defaultCur} Nakit Kasa`,
      reference_no: "",
      contact_name: "",
      description: ""
    });
    setShowAddModal(true);
  };

  // Open modal for Edit Record
  const handleOpenEditModal = (tx: PortfolioTransaction) => {
    setEditingTx(tx);
    setPortfolioSearch("");
    const txDateStr = tx.date ? new Date(tx.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
    const txCurr = tx.currency || storeDefaultCurrency || defaultSectorCurrency;
    const txMethod = normalizePaymentMethod(tx.payment_method);
    const resolvedAccName = (txMethod === "cash" && !tx.account_id)
      ? `${txCurr} Nakit Kasa`
      : (tx.account_name || "");
    setFormData({
      type: tx.type,
      category: tx.category,
      title: tx.title || "",
      amount: String(tx.amount || ""),
      currency: txCurr,
      date: txDateStr,
      property_id: isPortfolioSector && tx.property_id ? String(tx.property_id) : "",
      payment_method: txMethod,
      account_id: tx.account_id ? String(tx.account_id) : "",
      account_name: resolvedAccName,
      reference_no: tx.reference_no || "",
      contact_name: tx.contact_name || "",
      description: tx.description || ""
    });
    setShowAddModal(true);
  };

  // Filter properties or vehicles based on portfolioSearch
  const filteredPortfolioItems = useMemo(() => {
    const searchLower = portfolioSearch.toLowerCase().trim();
    if (activeAutomotive) {
      if (!searchLower) return vehicles;
      return vehicles.filter(v => 
        (v.plate && v.plate.toLowerCase().includes(searchLower)) ||
        (v.brand && v.brand.toLowerCase().includes(searchLower)) ||
        (v.model && v.model.toLowerCase().includes(searchLower)) ||
        (v.year && String(v.year).includes(searchLower))
      );
    } else {
      if (!searchLower) return properties;
      return properties.filter(p => 
        (p.title && p.title.toLowerCase().includes(searchLower)) ||
        (p.location && p.location.toLowerCase().includes(searchLower)) ||
        (p.reference_no && p.reference_no.toLowerCase().includes(searchLower)) ||
        (p.id && String(p.id).includes(searchLower))
      );
    }
  }, [portfolioSearch, activeAutomotive, vehicles, properties]);

  // Handle Form Submit (Add or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(String(formData.amount).replace(/,/g, "."));
    if (!formData.title.trim() || !numericAmount || numericAmount <= 0) {
      toast.error(isTr ? "Lütfen geçerli bir işlem başlığı ve tutar girin." : "Please enter a valid title and positive amount.");
      return;
    }

    const normMethod = normalizePaymentMethod(formData.payment_method);
    let resolvedAccountId: number | null = formData.account_id ? (Number(formData.account_id) || null) : null;
    let resolvedAccountName = (formData.account_name || "").trim();

    if (normMethod === "cash") {
      const matchedCashAcc = resolvedAccountId
        ? accounts.find(a => Number(a.id) === resolvedAccountId && a.account_type === "cash")
        : null;
      if (matchedCashAcc) {
        resolvedAccountId = matchedCashAcc.id;
        resolvedAccountName = matchedCashAcc.account_name;
      } else {
        resolvedAccountId = null;
        resolvedAccountName = `${formData.currency} Nakit Kasa`;
      }
    } else if (normMethod === "bank_transfer") {
      const foundAcc = resolvedAccountId
        ? accounts.find(a => Number(a.id) === resolvedAccountId && a.account_type === "bank")
        : null;
      if (foundAcc) {
        resolvedAccountId = foundAcc.id;
        resolvedAccountName = foundAcc.account_name;
      } else {
        resolvedAccountId = null;
        if (!resolvedAccountName || /^(GBP|EUR|USD|TRY)?\s*(Nakit\s+Kasa|Cash\s*Vault|Cash)$/i.test(resolvedAccountName)) {
          resolvedAccountName = isTr ? "Banka Hesabı" : "Bank Account";
        }
      }
    } else if (normMethod === "credit_card") {
      const foundCard = resolvedAccountId
        ? accounts.find(a => Number(a.id) === resolvedAccountId && a.account_type === "credit_card")
        : null;
      if (foundCard) {
        resolvedAccountId = foundCard.id;
        resolvedAccountName = foundCard.account_name;
      } else {
        resolvedAccountId = null;
        if (!resolvedAccountName || /^(GBP|EUR|USD|TRY)?\s*(Nakit\s+Kasa|Cash\s*Vault|Cash)$/i.test(resolvedAccountName)) {
          resolvedAccountName = isTr ? "Kredi Kartı" : "Credit Card";
        }
      }
    } else if (normMethod === "check_promissory") {
      resolvedAccountId = null;
      resolvedAccountName = isTr ? "Çek / Senet Portföyü" : "Check / Note Portfolio";
    } else if (normMethod === "marketplace_vault") {
      const foundMp = resolvedAccountId
        ? accounts.find(a => Number(a.id) === resolvedAccountId && a.account_type === "marketplace")
        : null;
      if (foundMp) {
        resolvedAccountId = foundMp.id;
        resolvedAccountName = foundMp.account_name;
      } else {
        resolvedAccountId = null;
        if (!resolvedAccountName || /^(GBP|EUR|USD|TRY)?\s*(Nakit\s+Kasa|Cash\s*Vault|Cash)$/i.test(resolvedAccountName)) {
          resolvedAccountName = isTr ? "Pazaryeri Kasası" : "Marketplace Vault";
        }
      }
    }

    const payload = {
      type: formData.type,
      category: formData.category,
      title: formData.title.trim(),
      amount: numericAmount,
      currency: formData.currency,
      date: new Date(formData.date).toISOString(),
      property_id: formData.property_id ? Number(formData.property_id) : null,
      payment_method: normMethod,
      account_id: resolvedAccountId,
      account_name: resolvedAccountName,
      reference_no: formData.reference_no.trim(),
      contact_name: formData.contact_name.trim(),
      description: formData.description.trim()
    };

    try {
      if (editingTx) {
        await updateTransaction(editingTx.id, payload);
        toast.success(isTr ? "Finansal işlem güncellendi." : "Financial record updated.");
      } else {
        await addTransaction(payload);
        toast.success(isTr ? "Finansal işlem kaydedildi." : "Financial record saved.");
      }
      setShowAddModal(false);
      setEditingTx(null);
    } catch (err: any) {
      toast.error(isTr ? "İşlem kaydedilirken hata oluştu." : "Error saving financial record.");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTransaction(id);
      setConfirmDeleteId(null);
      toast.success(isTr ? "Kayıt başarıyla silindi." : "Record deleted successfully.");
    } catch (err) {
      toast.error(isTr ? "Kayıt silinirken hata oluştu." : "Error deleting record.");
    }
  };

  const escapeHtmlStr = (val?: string | null) =>
    String(val ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const handlePrintReceipt = (t: PortfolioTransaction) => {
    if (activeRealEstate) {
      const prop = t.property_id ? properties.find(p => p.id === t.property_id) : null;
      const isRent = t.category === "rental_placement" || (prop && prop.listing_intent === "rent") || (t.title && t.title.toLowerCase().includes("kira"));
      const templateId = isRent ? "rental_commission_receipt" : "sales_commission_receipt";
      const tpl = contractTemplates.find(ct => ct.id === templateId);
      if (!tpl) {
        toast.error(isTr ? "Makbuz şablonu bulunamadı." : "Receipt template not found.");
        return;
      }

      const rawTitle = (branding?.store_name || branding?.name || "").trim();
      const storeTitle = rawTitle && !/^lookprice$/i.test(rawTitle) ? rawTitle : "Seçkin Emlak";
      const storeAddress = branding?.address || "-";
      const storePhone = branding?.phone || branding?.whatsapp_number || "";

      const propTitle = prop ? resolveOfficialPropertyTitle(prop) : (t.property_title || t.title);
      const propAddress = prop?.address || (prop ? `${prop.kktc_sub_region || ""} ${prop.kktc_region || ""}`.trim() : "-");

      const receiptNo = t.reference_no || `MAK-${isRent ? "KIR" : "SAT"}-${t.id || Date.now().toString().slice(-4)}`;
      const payerName = t.contact_name || (isRent ? "Kiracı" : (prop?.owner_info?.fullName || "Mülk Sahibi"));

      const { html } = tpl.getTemplate({
        storeName: storeTitle,
        storePhone: storePhone,
        brokerAddress: storeAddress,
        clientName: payerName,
        clientIdentity: "-",
        clientPhone: isRent ? (branding?.phone || "") : (prop?.owner_info?.phone || ""),
        ownerName: isRent ? "" : payerName,
        sellerIdentity: isRent ? "" : (prop?.owner_info?.identityNo || "-"),
        ownerPhone: isRent ? "" : (prop?.owner_info?.phone || ""),
        propertyTitle: propTitle,
        propertyAddress: propAddress,
        propertyLocation: prop ? `${prop.kktc_region || ""} / ${prop.kktc_sub_region || ""}` : "",
        propertyPrice: `${t.amount} ${t.currency}`,
        commissionRate: `${t.amount} ${t.currency}`,
        commissionAmountWords: String(t.amount),
        rentCurrency: t.currency,
        saleCurrency: t.currency,
        commissionPaymentMethod: t.payment_method || (isTr ? "Banka Havalesi / EFT" : "Bank Transfer"),
        commissionReceiptNo: receiptNo,
        commissionPayerName: payerName,
        commissionPayerRole: isRent ? "KİRACI" : "MAL SAHİBİ",
        contractDate: t.date ? new Date(t.date).toLocaleDateString("tr-TR") : new Date().toLocaleDateString("tr-TR")
      });

      printHtmlContract(html, `${isRent ? "Kiralık" : "Satılık"} Komisyon Alım Belgesi - ${receiptNo}`);
      toast.success(isTr ? "Resmi Komisyon Alım Belgesi yazdırma penceresi açılıyor..." : "Opening receipt print preview...");
      return;
    }

    // Store-branded official collection receipt for Retail, HoReCa, Hotel, Automotive & Corporate sectors
    const rawStoreTitle = (branding?.store_name || branding?.name || "").trim();
    const storeTitle = rawStoreTitle && !/^lookprice$/i.test(rawStoreTitle)
      ? rawStoreTitle
      : (activeAutomotive ? "Seçkin Otomotiv" : "Seçkin Mağaza");
    const storeAddress = branding?.address || "";
    const storePhone = branding?.phone || branding?.whatsapp_number || "";
    const receiptNo = t.reference_no || `MKB-${t.id || Date.now().toString().slice(-4)}`;
    const dateStr = t.date ? new Date(t.date).toLocaleDateString("tr-TR") : new Date().toLocaleDateString("tr-TR");
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtmlStr(isTr ? "Tahsilat Makbuzu" : "Collection Receipt")} - ${escapeHtmlStr(receiptNo)}</title>
        <style>
          @page { size: A5 landscape; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 16px; }
          .box { border: 2px solid #0f172a; border-radius: 10px; padding: 18px; }
          .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #cbd5e1; padding-bottom: 10px; margin-bottom: 14px; }
          .brand { font-size: 16px; font-weight: 700; }
          .sub { font-size: 11px; color: #475569; margin-top: 2px; }
          .badge { background: #0f172a; color: #ffffff; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          td { padding: 6px 4px; border-bottom: 1px solid #f1f5f9; }
          td.lbl { width: 34%; color: #475569; font-weight: 600; }
          .amt { font-size: 16px; font-weight: 700; color: #047857; }
          .foot { display: flex; justify-content: space-between; margin-top: 22px; font-size: 11px; color: #475569; }
          .sig { border-top: 1px solid #94a3b8; padding-top: 4px; width: 180px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="box">
          <div class="head">
            <div>
              <div class="brand">${escapeHtmlStr(storeTitle)}</div>
              ${storeAddress ? `<div class="sub">${escapeHtmlStr(storeAddress)}</div>` : ""}
              ${storePhone ? `<div class="sub">${escapeHtmlStr(storePhone)}</div>` : ""}
            </div>
            <div style="text-align:right">
              <div class="badge">${escapeHtmlStr(isTr ? "TAHSİLAT MAKBUZU" : "COLLECTION RECEIPT")}</div>
              <div class="sub" style="margin-top:6px;">No: <strong>${escapeHtmlStr(receiptNo)}</strong> • ${escapeHtmlStr(dateStr)}</div>
            </div>
          </div>
          <table>
            <tr><td class="lbl">${escapeHtmlStr(isTr ? "İşlem Başlığı" : "Title")}</td><td>${escapeHtmlStr(t.title)}</td></tr>
            <tr><td class="lbl">${escapeHtmlStr(isTr ? "Kategori" : "Category")}</td><td>${escapeHtmlStr(getCategoryLabel(t.type, t.category))}</td></tr>
            <tr><td class="lbl">${escapeHtmlStr(isTr ? "Ödeme Yöntemi / Hesap" : "Method / Account")}</td><td>${escapeHtmlStr(getPaymentMethodLabel(t.payment_method))} • ${escapeHtmlStr(getResolvedAccountName(t))}</td></tr>
            ${t.contact_name ? `<tr><td class="lbl">${escapeHtmlStr(isTr ? "İlgili Kişi / Kurum" : "Contact")}</td><td>${escapeHtmlStr(t.contact_name)}</td></tr>` : ""}
            ${t.description ? `<tr><td class="lbl">${escapeHtmlStr(isTr ? "Açıklama" : "Notes")}</td><td>${escapeHtmlStr(t.description)}</td></tr>` : ""}
            <tr><td class="lbl">${escapeHtmlStr(isTr ? "Tahsil Edilen Tutar" : "Amount")}</td><td class="amt">+${escapeHtmlStr(formatMoney(t.amount, t.currency))} (${escapeHtmlStr(t.currency)})</td></tr>
          </table>
          <div class="foot">
            <div class="sig">${escapeHtmlStr(isTr ? "Ödeyen / İlgili İmza" : "Payer Signature")}</div>
            <div class="sig">${escapeHtmlStr(isTr ? "Tahsil Eden Yetkili" : "Authorized Signature")}</div>
          </div>
        </div>
      </body>
      </html>
    `;
    printHtmlContract(html, `${isTr ? "Tahsilat Makbuzu" : "Receipt"} - ${receiptNo}`);
    toast.success(isTr ? "Tahsilat makbuzu yazdırma penceresi açılıyor..." : "Opening receipt print preview...");
  };

  // Financial Account Form Submit
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountFormData.account_name.trim()) {
      toast.error(isTr ? "Lütfen hesap adı belirtin." : "Please specify an account name.");
      return;
    }

    try {
      if (editingAccount) {
        await api.updateFinancialAccount(editingAccount.id, accountFormData, storeId);
        toast.success(isTr ? "Hesap bilgileri güncellendi." : "Account updated.");
      } else {
        await api.addFinancialAccount(accountFormData, storeId);
        toast.success(isTr ? "Yeni hesap başarıyla tanımlandı." : "New account added.");
      }
      await fetchAccounts();
      setEditingAccount(null);
      setAccountFormData({
        account_type: "bank",
        account_name: "",
        bank_name: "",
        account_number: "",
        currency: "TRY",
        initial_balance: "0"
      });
    } catch (err) {
      toast.error(isTr ? "Hesap kaydedilirken hata oluştu." : "Error saving account.");
    }
  };

  const handleDeleteAccount = async (id: number) => {
    if (!confirm(isTr ? "Bu hesabı silmek istediğinize emin misiniz?" : "Delete this account?")) return;
    try {
      await api.deleteFinancialAccount(id, storeId);
      toast.success(isTr ? "Hesap silindi." : "Account deleted.");
      await fetchAccounts();
    } catch (err) {
      toast.error(isTr ? "Hesap silinirken hata oluştu." : "Error deleting account.");
    }
  };

  const LEGACY_CATEGORY_LABELS: Record<string, { tr: string; en: string }> = {
    car_sales: { tr: "Araç Satış Geliri", en: "Vehicle Sales Income" },
    car_rental: { tr: "Araç Kiralama Geliri", en: "Car Rental Income" },
    car_purchase: { tr: "Stok Araç Alım Bedeli", en: "Vehicle Inventory Purchase" },
    vehicle_maintenance: { tr: "Araç Bakım & Ekspertiz", en: "Vehicle Maintenance" },
    commission: { tr: "Satış Komisyonu", en: "Sales Commission" },
    rental_placement: { tr: "Kiralama Hizmet Bedeli", en: "Rental Placement Fee" },
    property_management: { tr: "Mülk Yönetim & Aidat", en: "Property Management" },
    deposit_income: { tr: "Kapora / Ön Ödeme", en: "Deposit Received" },
    consulting: { tr: "Danışmanlık & Ekspertiz", en: "Consulting & Appraisal" },
    pos_sales: { tr: "Adisyon / Masa & Kasa Satışı", en: "POS & Table Sales" },
    takeaway_delivery: { tr: "Paket Servis & Gel-Al", en: "Takeaway & Delivery" },
    hotel_accommodation: { tr: "Oda Konaklama Geliri", en: "Room & Reservation Income" },
    catering_event: { tr: "Catering & Organizasyon", en: "Catering & Events" },
    kitchen_supplies: { tr: "Mutfak & İçecek Alımı", en: "Kitchen & Beverage Supplies" },
    delivery_commission: { tr: "Kurye & Platform Gideri", en: "Delivery & Courier Fees" },
    maintenance_cleaning: { tr: "Temizlik, Bakım & Ekipman", en: "Cleaning & Maintenance" },
    retail_sales: { tr: "Mağaza & Kasa Satış Geliri", en: "Store & POS Sales" },
    online_marketplace: { tr: "E-Ticaret & Pazaryeri Tahsilatı", en: "E-Commerce Payout" },
    invoice_collection: { tr: "Cari / Fatura Tahsilatı", en: "Account & Invoice Collection" },
    service_revenue: { tr: "Hizmet & Proje Tahsilatı", en: "Service & Project Revenue" },
    supplier_payment: { tr: "Tedarikçi Ödemesi", en: "Supplier Payment" },
    shipping_logistics: { tr: "Kargo & Lojistik", en: "Shipping & Packaging" },
    staff_payroll: { tr: "Personel Maaş & Prim", en: "Staff Payroll & Benefits" },
    rent_utilities: { tr: "Kira & Faturalar", en: "Rent & Utilities" },
    agent_commission: { tr: "Personel Primi & Maaş", en: "Payroll & Commission" },
    advertising: { tr: "İlan & Vitrin Ücretleri", en: "Listing Portal Fees" },
    marketing: { tr: "Reklam & Tanıtım", en: "Advertising & Marketing" },
    vehicle: { tr: "Ulaşım & Yakıt Gideri", en: "Transportation & Fuel" },
    tax_official: { tr: "Vergi & Resmi Harçlar", en: "Tax & Official Fees" },
    office_supplies: { tr: "Sarf & Kırtasiye Gideri", en: "Office & Store Supplies" },
    marketplace_commission: { tr: "Pazaryeri Komisyon & Masraf", en: "Marketplace Commission & Fees" },
    transfer: { tr: "Hesaplar Arası Virman / Hakediş", en: "Internal Transfer / Payout" },
    other: { tr: "Diğer", en: "Other" }
  };

  const getCategoryLabel = (type: "income" | "expense", id: string) => {
    const list = type === "income" ? categories.income : categories.expense;
    const found = list.find(c => c.id === id)?.label;
    if (found) return found;
    const fallback = LEGACY_CATEGORY_LABELS[id];
    return fallback ? (isTr ? fallback.tr : fallback.en) : id;
  };

  const getPaymentMethodLabel = (method?: string) => {
    const norm = normalizePaymentMethod(method);
    const found = paymentMethods.find(m => m.id === norm);
    return found ? found.label : (isTr ? "Nakit Kasa" : "Cash");
  };

  const getCurrencySymbol = (cur: string) => {
    switch (cur) {
      case "GBP": return "£";
      case "EUR": return "€";
      case "USD": return "$";
      case "TRY": return "₺";
      default: return cur;
    }
  };

  const formatMoney = (amount: number, cur?: string) => {
    const formatted = Math.abs(Number(amount) || 0).toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    if (!cur) return formatted;
    return `${getCurrencySymbol(cur)}${formatted}`;
  };

  const isMarketplaceAccount = useCallback((acc?: FinancialAccount | null): boolean => {
    if (!acc) return false;
    const t = String(acc.account_type || "").toLowerCase().trim();
    if (t === "marketplace") return true;
    const num = String(acc.account_number || "").toLowerCase().trim();
    if (["hepsiburada", "trendyol", "n11", "amazon", "pazarama", "hb", "ty", "amz", "pzr"].includes(num)) {
      return true;
    }
    return /(hepsiburada|trendyol|n11|amazon|pazarama)\s*kasas/i.test(String(acc.account_name || ""));
  }, []);

  const accountTypeMap = useMemo(() => {
    const m = new Map<string, FinancialAccount["account_type"]>();
    accounts.forEach(a => m.set(String(a.id), isMarketplaceAccount(a) ? "marketplace" : a.account_type));
    return m;
  }, [accounts, isMarketplaceAccount]);

  const isCashVaultTx = useCallback((t: PortfolioTransaction) => {
    const normMethod = normalizePaymentMethod(t.payment_method);
    if (normMethod !== "cash") return false;
    const accKey = t.account_id ? String(t.account_id) : "";
    if (accKey) {
      const accType = accountTypeMap.get(accKey);
      // Any row linked to a bank/card/marketplace account (or unmapped account while loading) is NEVER physical cash safe
      if (accType !== "cash") return false;
    }
    const rawAccName = String(t.account_name || "").toLowerCase();
    if (/(hepsiburada|trendyol|n11|amazon|pazarama)\s*kasas/i.test(rawAccName)) return false;
    return true;
  }, [accountTypeMap, normalizePaymentMethod]);

  const getResolvedAccountName = useCallback((t: PortfolioTransaction) => {
    const method = normalizePaymentMethod(t.payment_method);
    const cur = (t.currency || storeDefaultCurrency || "GBP").toUpperCase();
    const rawName = (t.account_name || "").trim();
    const matchedAcc = t.account_id ? accounts.find(a => String(a.id) === String(t.account_id)) : undefined;
    if (matchedAcc) return matchedAcc.account_name;
    if (method === "cash") {
      if (!rawName || /^(GBP|EUR|USD|TRY)\s+(Nakit\s+Kasa|Cash)$/i.test(rawName) || rawName === "Nakit Kasa" || rawName === "Cash") {
        return `${cur} ${isTr ? "Nakit Kasa" : "Cash"}`;
      }
      return rawName;
    }
    if (rawName && !/^(GBP|EUR|USD|TRY)?\s*(Nakit\s+Kasa|Cash\s*Vault|Cash)$/i.test(rawName)) {
      return rawName;
    }
    return getPaymentMethodLabel(method);
  }, [accounts, storeDefaultCurrency, isTr, normalizePaymentMethod]);

  // Comprehensive Real Estate / Vehicle Portfolio Profit & Loss Analysis Engine (With Cross-Currency Conversion)
  const portfolioAnalysis = useMemo(() => {
    const propertyMap: Record<string, {
      property: any;
      income: number;
      expense: number;
      net: number;
      txCount: number;
      transactions: any[];
      currency: string;
    }> = {};

    // Initialize for all real estate properties
    properties.forEach(p => {
      propertyMap[String(p.id)] = {
        property: p,
        income: 0,
        expense: 0,
        net: 0,
        txCount: 0,
        transactions: [],
        currency: (p.currency || storeDefaultCurrency || "GBP").toUpperCase()
      };
    });

    // Also include vehicles if activeAutomotive
    if (activeAutomotive) {
      vehicles.forEach(v => {
        propertyMap[String(v.id)] = {
          property: v,
          income: 0,
          expense: 0,
          net: 0,
          txCount: 0,
          transactions: [],
          currency: (v.currency || storeDefaultCurrency || "TRY").toUpperCase()
        };
      });
    }

    // Populate from transactions with automatic cross-currency conversion to portfolio/default currency
    transactions.forEach(t => {
      if (t.property_id) {
        const key = String(t.property_id);
        if (!propertyMap[key]) {
          propertyMap[key] = {
            property: {
              id: t.property_id,
              title: t.property_title || (isTr ? `İlan #${t.property_id}` : `Property #${t.property_id}`),
              reference_no: "",
              currency: (storeDefaultCurrency || t.currency || "GBP").toUpperCase()
            },
            income: 0,
            expense: 0,
            net: 0,
            txCount: 0,
            transactions: [],
            currency: (storeDefaultCurrency || t.currency || "GBP").toUpperCase()
          };
        }
        const propCurr = (propertyMap[key].currency || storeDefaultCurrency || "GBP").toUpperCase();
        const txCurr = (t.currency || propCurr).toUpperCase();
        const rawAmt = Number(t.amount) || 0;

        // Convert cross-currency income/expense into the portfolio's currency
        const convertedAmt = txCurr === propCurr
          ? rawAmt
          : convertPortfolioCurrency(rawAmt, txCurr, propCurr);

        if (t.type === "income") {
          propertyMap[key].income = Number((propertyMap[key].income + convertedAmt).toFixed(2));
        } else {
          propertyMap[key].expense = Number((propertyMap[key].expense + convertedAmt).toFixed(2));
        }

        propertyMap[key].net = Number((propertyMap[key].income - propertyMap[key].expense).toFixed(2));
        propertyMap[key].txCount += 1;
        propertyMap[key].transactions.push({
          ...t,
          convertedAmount: convertedAmt,
          portfolioCurrency: propCurr
        });
      }
    });

    const propertyList = Object.values(propertyMap);
    const activeWithTxs = propertyList.filter(p => p.txCount > 0);

    const totalIncome = Number(activeWithTxs.reduce((sum, p) => sum + convertPortfolioCurrency(p.income, p.currency, storeDefaultCurrency), 0).toFixed(2));
    const totalExpense = Number(activeWithTxs.reduce((sum, p) => sum + convertPortfolioCurrency(p.expense, p.currency, storeDefaultCurrency), 0).toFixed(2));
    const totalNet = Number((totalIncome - totalExpense).toFixed(2));
    const profitableCount = activeWithTxs.filter(p => p.net > 0).length;
    const lossCount = activeWithTxs.filter(p => p.net < 0).length;

    return {
      propertyMap,
      propertyList,
      activeWithTxs,
      totalIncome,
      totalExpense,
      totalNet,
      profitableCount,
      lossCount
    };
  }, [properties, vehicles, transactions, activeAutomotive, isTr, storeDefaultCurrency, convertPortfolioCurrency]);

  // Compute Chronological Running Balances & Date-Range Statement Data per Currency & Account
  const statementAnalysis = useMemo(() => {
    const startTs = startDate ? new Date(`${startDate}T00:00:00`).getTime() : null;
    const endTs = endDate ? new Date(`${endDate}T23:59:59.999`).getTime() : null;

    // Sort all transactions chronologically (oldest first)
    const chronological = [...transactions].sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      if (da !== db) return da - db;
      return (a.id || 0) - (b.id || 0);
    });

    const cashAccountIds = new Set(
      accounts.filter(a => a.account_type === "cash").map(a => String(a.id))
    );

    const summaryByCurrency: Record<string, {
      openingBalance: number;
      periodIncome: number;
      periodExpense: number;
      periodNet: number;
      closingBalance: number;
      allTimeIncome: number;
      allTimeExpense: number;
      allTimeNet: number;
      txCount: number;
    }> = {};

    SUPPORTED_CURRENCIES.forEach(cur => {
      const cashInit = accounts
        .filter(a => a.account_type === "cash" && (a.currency || "TRY").toUpperCase() === cur)
        .reduce((s, a) => s + Number(a.initial_balance || 0), 0);
      summaryByCurrency[cur] = {
        openingBalance: cashInit,
        periodIncome: 0,
        periodExpense: 0,
        periodNet: 0,
        closingBalance: cashInit,
        allTimeIncome: 0,
        allTimeExpense: 0,
        allTimeNet: 0,
        txCount: 0
      };
    });

    // Account specific running balances (including pre-startDate prior transactions)
    const summaryByAccount: Record<string, {
      account_id?: number | null;
      account_name: string;
      account_type: string;
      currency: string;
      openingBalance: number;
      periodIncome: number;
      periodExpense: number;
      closingBalance: number;
      txCount: number;
    }> = {};

    accounts.forEach(acc => {
      const accKey = String(acc.id);
      const initBal = Number(acc.initial_balance || 0);
      summaryByAccount[accKey] = {
        account_id: acc.id,
        account_name: acc.account_name,
        account_type: acc.account_type,
        currency: acc.currency,
        openingBalance: initBal,
        periodIncome: 0,
        periodExpense: 0,
        closingBalance: initBal,
        txCount: 0
      };
    });

    const cashRunningTracker: Record<string, number> = {};
    SUPPORTED_CURRENCIES.forEach(cur => {
      cashRunningTracker[cur] = summaryByCurrency[cur]?.openingBalance || 0;
    });
    const accountRunningTracker: Record<string, number> = {};
    accounts.forEach(acc => {
      accountRunningTracker[String(acc.id)] = Number(acc.initial_balance || 0);
    });
    const unlinkedMethodTracker: Record<string, number> = {};

    const enrichedWithRunning: Array<PortfolioTransaction & { runningBalance: number }> = [];

    for (const tx of chronological) {
      const cur = (tx.currency || "GBP").toUpperCase();
      if (!summaryByCurrency[cur]) {
        summaryByCurrency[cur] = {
          openingBalance: 0,
          periodIncome: 0,
          periodExpense: 0,
          periodNet: 0,
          closingBalance: 0,
          allTimeIncome: 0,
          allTimeExpense: 0,
          allTimeNet: 0,
          txCount: 0
        };
      }
      if (cashRunningTracker[cur] === undefined) cashRunningTracker[cur] = 0;

      const amt = Number(tx.amount) || 0;
      const delta = tx.type === "income" ? amt : -amt;
      const txTime = tx.date ? new Date(tx.date).getTime() : 0;
      const isBeforeStart = startTs !== null && txTime < startTs;
      const isAfterEnd = endTs !== null && txTime > endTs;

      const accKey = tx.account_id ? String(tx.account_id) : "";
      const normMethod = normalizePaymentMethod(tx.payment_method);
      const isCashTx = isCashVaultTx(tx);

      if (isCashTx) {
        if (tx.type === "income") summaryByCurrency[cur].allTimeIncome += amt;
        else summaryByCurrency[cur].allTimeExpense += amt;
        summaryByCurrency[cur].allTimeNet = summaryByCurrency[cur].allTimeIncome - summaryByCurrency[cur].allTimeExpense;

        if (isBeforeStart) {
          summaryByCurrency[cur].openingBalance += delta;
        } else if (!isAfterEnd) {
          if (tx.type === "income") summaryByCurrency[cur].periodIncome += amt;
          else summaryByCurrency[cur].periodExpense += amt;
          summaryByCurrency[cur].txCount += 1;
        }
      }

      if (accKey && summaryByAccount[accKey]) {
        const accType = String(summaryByAccount[accKey].account_type || "").toLowerCase();
        const isCompatibleWithAccount = accType === "cash" ? isCashTx : !isCashTx;
        if (isCompatibleWithAccount) {
          if (isBeforeStart) {
            summaryByAccount[accKey].openingBalance += delta;
          } else if (!isAfterEnd) {
            if (tx.type === "income") summaryByAccount[accKey].periodIncome += amt;
            else summaryByAccount[accKey].periodExpense += amt;
            summaryByAccount[accKey].txCount += 1;
          }
        }
      }

      let instrumentRunning = 0;
      if (isCashTx) {
        if (!isAfterEnd) {
          cashRunningTracker[cur] += delta;
          instrumentRunning = cashRunningTracker[cur];
        }
      } else if (accKey) {
        if (accountRunningTracker[accKey] === undefined) accountRunningTracker[accKey] = 0;
        if (!isAfterEnd) {
          accountRunningTracker[accKey] += delta;
          instrumentRunning = accountRunningTracker[accKey];
        }
      } else {
        const methodKey = `${normMethod}:${cur}`;
        if (unlinkedMethodTracker[methodKey] === undefined) unlinkedMethodTracker[methodKey] = 0;
        if (!isAfterEnd) {
          unlinkedMethodTracker[methodKey] += delta;
          instrumentRunning = unlinkedMethodTracker[methodKey];
        }
      }

      if (!isBeforeStart && !isAfterEnd) {
        enrichedWithRunning.push({
          ...tx,
          runningBalance: instrumentRunning
        });
      }
    }

    Object.keys(summaryByCurrency).forEach(cur => {
      const s = summaryByCurrency[cur];
      s.periodNet = s.periodIncome - s.periodExpense;
      s.closingBalance = s.openingBalance + s.periodNet;
    });

    Object.keys(summaryByAccount).forEach(accKey => {
      const s = summaryByAccount[accKey];
      s.closingBalance = s.openingBalance + (s.periodIncome - s.periodExpense);
    });

    const periodTransactionsDesc = [...enrichedWithRunning].reverse();

    return {
      summaryByCurrency,
      summaryByAccount,
      periodTransactionsDesc,
      periodTransactionsAsc: enrichedWithRunning
    };
  }, [transactions, startDate, endDate, accounts, isCashVaultTx, normalizePaymentMethod]);

  // Apply Search, Type, Category, Currency, Method, Cash Vault, Account, and Property filters on statement
  const filteredTransactions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return statementAnalysis.periodTransactionsDesc.filter(t => {
      const normMethod = normalizePaymentMethod(t.payment_method);
      const txCurr = (t.currency || "TRY").toUpperCase();
      const matchesType = typeFilter === "all" || t.type === typeFilter;
      const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
      const matchesCurrency = currencyFilter === "all" || txCurr === currencyFilter;
      const matchesMethod = methodFilter === "all" || (methodFilter === "cash" ? isCashVaultTx(t) : normMethod === methodFilter);
      const matchesCashVault = cashVaultFilter === "all" || (isCashVaultTx(t) && txCurr === cashVaultFilter);
      const matchesAccount = selectedAccountId === "all" || (String(t.account_id) === selectedAccountId && (accountTypeMap.get(selectedAccountId) === "cash" ? isCashVaultTx(t) : !isCashVaultTx(t)));
      const matchesProperty = selectedPropertyFilter === "all" || String(t.property_id) === selectedPropertyFilter;
      const matchesSearch = !q || 
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.property_title && t.property_title.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.contact_name && t.contact_name.toLowerCase().includes(q)) ||
        (t.account_name && t.account_name.toLowerCase().includes(q)) ||
        (t.reference_no && t.reference_no.toLowerCase().includes(q)) ||
        getCategoryLabel(t.type, t.category).toLowerCase().includes(q);

      return matchesType && matchesCategory && matchesCurrency && matchesMethod && matchesCashVault && matchesAccount && matchesProperty && matchesSearch;
    });
  }, [statementAnalysis.periodTransactionsDesc, typeFilter, categoryFilter, currencyFilter, methodFilter, cashVaultFilter, selectedAccountId, selectedPropertyFilter, searchQuery, categories, normalizePaymentMethod, isCashVaultTx]);

  // Export Statement to Excel (.xlsx)
  const handleExportExcel = () => {
    if (transactions.length === 0) {
      toast.error(isTr ? "Dışa aktarılacak işlem kaydı bulunamadı." : "No transactions to export.");
      return;
    }

    try {
      const wb = XLSX.utils.book_new();
      const periodLabel = (startDate || endDate)
        ? `${startDate || "Başlangıç"} - ${endDate || "Bugün"}`
        : (isTr ? "Tüm Zamanlar" : "All Time");

      // 1. Sheet: Kasa Özeti
      const summaryRows = SUPPORTED_CURRENCIES.map(cur => {
        const s = statementAnalysis.summaryByCurrency[cur];
        return {
          [isTr ? "Para Birimi" : "Currency"]: cur,
          [isTr ? "Dönem" : "Period"]: periodLabel,
          [isTr ? "Dönem Başı Devreden Bakiye" : "Opening Balance"]: Number(s.openingBalance.toFixed(2)),
          [isTr ? "Dönem Toplam Gelir (+)" : "Period Income (+)"]: Number(s.periodIncome.toFixed(2)),
          [isTr ? "Dönem Toplam Gider (-)" : "Period Expense (-)"]: Number(s.periodExpense.toFixed(2)),
          [isTr ? "Dönem Net Fark" : "Period Net"]: Number(s.periodNet.toFixed(2)),
          [isTr ? "Dönem Sonu Kasa Bakiyesi" : "Closing Balance"]: Number(s.closingBalance.toFixed(2)),
          [isTr ? "İşlem Adedi" : "Transaction Count"]: s.txCount
        };
      });
      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(wb, wsSummary, isTr ? "Kasa Özeti" : "Cash Summary");

      // 2. Sheet: Portföy Kâr / Zarar Raporu (Yalnızca portföy sektörlerinde)
      if (isPortfolioSector) {
        const portfolioRows = portfolioAnalysis.activeWithTxs.map(p => ({
          [isTr ? "Portföy No" : "Ref"]: p.property.reference_no || p.property.id,
          [isTr ? "İlan Başlığı" : "Title"]: p.property.title || "-",
          [isTr ? "İlan Fiyatı" : "Price"]: `${p.property.price || 0} ${p.currency}`,
          [isTr ? "Toplam Gelir (+)" : "Income"]: p.income,
          [isTr ? "Toplam Masraf / Gider (-)" : "Expense"]: p.expense,
          [isTr ? "Net Kâr / Zarar" : "Net P&L"]: p.net,
          [isTr ? "Durum" : "Status"]: p.net >= 0 ? (isTr ? "KÂRDA" : "PROFIT") : (isTr ? "ZARARDA" : "LOSS"),
          [isTr ? "İşlem Sayısı" : "Tx Count"]: p.txCount
        }));
        if (portfolioRows.length > 0) {
          const wsPort = XLSX.utils.json_to_sheet(portfolioRows);
          XLSX.utils.book_append_sheet(wb, wsPort, isTr ? "Portföy Kâr-Zarar" : "Portfolio P&L");
        }
      }

      // 3. Sheet: Ekrandaki Filtreli Ekstre
      const chronologicalFiltered = [...filteredTransactions].reverse();
      const allLedgerRows = chronologicalFiltered.map((t, idx) => ({
        "#": idx + 1,
        [isTr ? "Tarih" : "Date"]: t.date ? new Date(t.date).toLocaleDateString("tr-TR") : "",
        [isTr ? "Tür" : "Type"]: t.type === "income" ? (isTr ? "GELİR (+)" : "INCOME (+)") : (isTr ? "GİDER (-)" : "EXPENSE (-)"),
        [isTr ? "Kategori" : "Category"]: getCategoryLabel(t.type, t.category),
        [isTr ? "İşlem Başlığı" : "Title"]: t.title || "",
        ...(isPortfolioSector ? { [isTr ? "İlişkili Portföy" : "Linked Property"]: t.property_title || "-" } : {}),
        [isTr ? "Hesap / Kasa" : "Account"]: getResolvedAccountName(t),
        [isTr ? "Ödeme Yöntemi" : "Payment Method"]: getPaymentMethodLabel(t.payment_method),
        [isTr ? "İlgili Kişi / Kurum" : "Contact"]: t.contact_name || "-",
        [isTr ? "Belge No" : "Ref No"]: t.reference_no || "-",
        [isTr ? "Giriş (+)" : "Credit (+)"]: t.type === "income" ? Number(Number(t.amount).toFixed(2)) : 0,
        [isTr ? "Çıkış (-)" : "Debit (-)"]: t.type === "expense" ? Number(Number(t.amount).toFixed(2)) : 0,
        [isTr ? "Para Birimi" : "Currency"]: t.currency,
        [isTr ? "Kümülatif Kasa Bakiyesi" : "Running Balance"]: Number(t.runningBalance.toFixed(2)),
        [isTr ? "Açıklama / Not" : "Description"]: t.description || ""
      }));
      const wsAll = XLSX.utils.json_to_sheet(allLedgerRows);
      XLSX.utils.book_append_sheet(wb, wsAll, isTr ? "Ekstre" : "Statement");

      const exportPrefix = isPortfolioSector ? "Kasa_ve_Portfoy_Ekstresi" : "Gelir_Gider_ve_Kasa_Ekstresi";
      XLSX.writeFile(wb, `${exportPrefix}_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success(isTr ? "Excel raporu indirildi." : "Excel report exported.");
    } catch (err) {
      toast.error(isTr ? "Excel oluşturulurken hata oluştu." : "Failed to export Excel.");
    }
  };

  // Print Clean PDF Statement
  const handlePrintStatement = () => {
    if (filteredTransactions.length === 0) {
      toast.error(isTr ? "Yazdırılacak işlem kaydı bulunamadı." : "No transactions to print.");
      return;
    }

    const chronologicalRows = [...filteredTransactions].reverse();
    const periodStr = (startDate || endDate) 
      ? `${startDate || "-"} - ${endDate || "-"}`
      : (isTr ? "Tüm Zamanlar" : "All Time");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Gelir - Gider & Kasa Ekstresi</title>
        <meta charset="utf-8" />
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 10px; color: #1e293b; margin: 0; padding: 0; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 14px; font-weight: 600; color: #0f172a; }
          .meta { font-size: 9px; color: #64748b; }
          table { width: 100%; border-collapse: collapse; margin-top: 6px; }
          th { background: #f8fafc; border-bottom: 1px solid #cbd5e1; padding: 5px 6px; text-align: left; font-size: 9px; font-weight: 600; color: #475569; }
          td { border-bottom: 1px solid #f1f5f9; padding: 4px 6px; font-size: 9px; }
          .right { text-align: right; }
          .inc { color: #059669; }
          .exp { color: #dc2626; }
          .bal { font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">Gelir - Gider & Kasa Ekstresi</div>
            <div class="meta">Dönem: ${escapeHtmlStr(periodStr)}</div>
          </div>
          <div class="meta right">Yazdırma Tarihi: ${escapeHtmlStr(new Date().toLocaleDateString("tr-TR"))}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Tarih</th>
              <th>İşlem Başlığı</th>
              ${isPortfolioSector ? "<th>İlişkili Portföy</th>" : ""}
              <th>Hesap / Yöntem</th>
              <th>Kategori</th>
              <th class="right">Giriş (+)</th>
              <th class="right">Çıkış (-)</th>
              <th class="right">Bakiye</th>
            </tr>
          </thead>
          <tbody>
            ${chronologicalRows.map(t => `
              <tr>
                <td>${t.date ? escapeHtmlStr(new Date(t.date).toLocaleDateString("tr-TR")) : "-"}</td>
                <td>${escapeHtmlStr(t.title || "")}</td>
                ${isPortfolioSector ? `<td>${escapeHtmlStr(t.property_title || "-")}</td>` : ""}
                <td>${escapeHtmlStr(getResolvedAccountName(t))}</td>
                <td>${escapeHtmlStr(getCategoryLabel(t.type, t.category))}</td>
                <td class="right inc">${t.type === "income" ? `+${escapeHtmlStr(formatMoney(t.amount, t.currency))}` : "-"}</td>
                <td class="right exp">${t.type === "expense" ? `-${escapeHtmlStr(formatMoney(t.amount, t.currency))}` : "-"}</td>
                <td class="right bal">${t.runningBalance < 0 ? "-" : ""}${escapeHtmlStr(formatMoney(t.runningBalance, t.currency))}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }, 250);
    }
  };

  // Filtered table totals per currency (excludes internal transfers in consolidated P&L view so payouts don't double-count)
  const filteredTotalsByCurrency = useMemo(() => {
    const isConsolidatedView = selectedAccountId === "all" && cashVaultFilter === "all" && methodFilter === "all";
    const map: Record<string, { income: number; expense: number; net: number; count: number }> = {};
    filteredTransactions.forEach(t => {
      const cur = t.currency || "GBP";
      if (!map[cur]) map[cur] = { income: 0, expense: 0, net: 0, count: 0 };
      map[cur].count += 1;
      if (isConsolidatedView && t.category === "transfer") {
        return;
      }
      const amt = Number(t.amount) || 0;
      if (t.type === "income") map[cur].income += amt;
      else map[cur].expense += amt;
      map[cur].net = map[cur].income - map[cur].expense;
    });
    return map;
  }, [filteredTransactions, selectedAccountId, cashVaultFilter, methodFilter]);

  const handleOpenTransferModal = (opts?: FinancialAccount | { account?: FinancialAccount; cashCurrency?: string; preferMarketplace?: boolean }) => {
    const isAccountObj = opts && "id" in opts;
    const sourceAcc = isAccountObj ? (opts as FinancialAccount) : (opts as any)?.account;
    const sourceCashCurr = !isAccountObj ? (opts as any)?.cashCurrency : undefined;
    const preferMarketplace = !isAccountObj && Boolean((opts as any)?.preferMarketplace);

    const mpAccounts = isShopLPSector ? accounts.filter(a => isMarketplaceAccount(a)) : [];
    const bankAccounts = accounts.filter(a => !isMarketplaceAccount(a) && a.account_type === "bank");

    if (sourceCashCurr) {
      const cur = sourceCashCurr.toUpperCase();
      const matchedBank = bankAccounts.find(b => b.currency.toUpperCase() === cur) || bankAccounts[0] || null;
      const cashBal = statementAnalysis.summaryByCurrency[cur]?.closingBalance ?? 0;
      setTransferForm({
        from_key: `cash:${cur}`,
        to_key: matchedBank ? `acc:${matchedBank.id}` : "",
        amount: cashBal > 0 ? String(Number(cashBal.toFixed(2))) : "",
        date: new Date().toISOString().split("T")[0],
        reference_no: "",
        title: matchedBank ? `${cur} Nakit Kasa → ${matchedBank.account_name} Virmanı` : `${cur} Nakit Kasa Banka Yatırma`,
        description: ""
      });
      setTransferModalOpen(true);
      return;
    }

    const src = sourceAcc || (preferMarketplace ? (mpAccounts[0] || bankAccounts[0] || null) : null);
    if (src) {
      const srcIsMp = isMarketplaceAccount(src);
      const srcCurrency = (src.currency || "TRY").toUpperCase();
      const matchedBank = bankAccounts.find(b => b.currency.toUpperCase() === srcCurrency && b.id !== src.id) || bankAccounts.find(b => b.id !== src.id) || null;
      const srcBalance = statementAnalysis.summaryByAccount[String(src.id)]?.closingBalance ?? Number(src.initial_balance || 0);
      setTransferForm({
        from_key: `acc:${src.id}`,
        to_key: srcIsMp
          ? (matchedBank ? `acc:${matchedBank.id}` : `cash:${srcCurrency}`)
          : `cash:${srcCurrency}`,
        amount: srcBalance > 0 ? String(Number(srcBalance.toFixed(2))) : "",
        date: new Date().toISOString().split("T")[0],
        reference_no: "",
        title: srcIsMp
          ? `${src.account_name} Hakediş Virmanı`
          : `${src.account_name} Virmanı`,
        description: ""
      });
      setTransferModalOpen(true);
      return;
    }

    // Default universal Virman: Nakit Kasa (default currency) -> First matching Bank account
    const defCur = (storeDefaultCurrency || "TRY").toUpperCase();
    const matchedBank = bankAccounts.find(b => b.currency.toUpperCase() === defCur) || bankAccounts[0] || null;
    const fallbackFrom = matchedBank ? `cash:${matchedBank.currency.toUpperCase()}` : `cash:${defCur}`;
    setTransferForm({
      from_key: fallbackFrom,
      to_key: matchedBank ? `acc:${matchedBank.id}` : "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      reference_no: "",
      title: "",
      description: ""
    });
    setTransferModalOpen(true);
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(String(transferForm.amount).replace(/,/g, "."));
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error(isTr ? "Lütfen geçerli bir aktarım tutarı girin." : "Please enter a valid transfer amount.");
      return;
    }
    if (!transferForm.from_key || !transferForm.to_key || transferForm.from_key === transferForm.to_key) {
      toast.error(isTr ? "Kaynak ve hedef hesap farklı olmalıdır." : "Source and destination accounts must differ.");
      return;
    }
    const parseKey = (k: string) => {
      if (k.startsWith("acc:")) return { accountId: Number(k.slice(4)), cashCurrency: null };
      if (k.startsWith("cash:")) return { accountId: null, cashCurrency: k.slice(5) };
      return { accountId: null, cashCurrency: null };
    };
    const src = parseKey(transferForm.from_key);
    const dst = parseKey(transferForm.to_key);
    const srcAcc = src.accountId ? accounts.find(a => a.id === src.accountId) : null;
    const currency = (srcAcc?.currency || src.cashCurrency || "TRY").toUpperCase();

    setTransferSubmitting(true);
    try {
      await api.transferFinancialAccounts(
        {
          from_account_id: src.accountId,
          from_cash_currency: src.cashCurrency,
          to_account_id: dst.accountId,
          to_cash_currency: dst.cashCurrency,
          amount: amt,
          currency,
          date: transferForm.date ? new Date(transferForm.date).toISOString() : new Date().toISOString(),
          title: transferForm.title.trim() || undefined,
          reference_no: transferForm.reference_no.trim() || undefined,
          description: transferForm.description.trim() || undefined
        },
        storeId
      );
      toast.success(isTr ? "Hakediş / hesap virmanı başarıyla kaydedildi." : "Transfer recorded successfully.");
      setTransferModalOpen(false);
      await Promise.all([fetchAccounts(), fetchTransactions()]);
    } catch (err: any) {
      toast.error(err?.message || (isTr ? "Virman işlemi başarısız oldu." : "Transfer failed."));
    } finally {
      setTransferSubmitting(false);
    }
  };

  // Account / Cash Vault Statement Helpers
  const loadAccountStatement = useCallback(async (
    target: { accountId?: number; cashCurrency?: string; label: string },
    sDate?: string,
    eDate?: string
  ) => {
    setStatementLoading(true);
    try {
      const data = await api.getFinancialAccountStatement(
        {
          accountId: target.accountId,
          cashCurrency: target.cashCurrency,
          startDate: sDate || undefined,
          endDate: eDate || undefined
        },
        storeId
      );
      setStatementData(data);
    } catch (err: any) {
      toast.error(err?.message || (isTr ? "Hesap ekstresi yüklenemedi." : "Failed to load account statement."));
    } finally {
      setStatementLoading(false);
    }
  }, [storeId, isTr]);

  const handleOpenAccountStatement = (target: { accountId?: number; cashCurrency?: string; label: string }) => {
    setStatementTarget(target);
    setStatementStartDate(startDate || "");
    setStatementEndDate(endDate || "");
    setStatementData(null);
    setStatementModalOpen(true);
    loadAccountStatement(target, startDate || "", endDate || "");
  };

  const handleExportAccountStatementExcel = () => {
    if (!statementData || !statementTarget) return;
    try {
      const wb = XLSX.utils.book_new();
      const cur = statementData.account?.currency || "TRY";
      const summaryRows = [{
        [isTr ? "Hesap / Kasa" : "Account"]: statementData.account?.account_name || statementTarget.label,
        [isTr ? "Para Birimi" : "Currency"]: cur,
        [isTr ? "Dönem" : "Period"]: (statementStartDate || statementEndDate) ? `${statementStartDate || "-"} / ${statementEndDate || "-"}` : (isTr ? "Tüm Zamanlar" : "All Time"),
        [isTr ? "Devir Bakiye" : "Opening"]: Number(statementData.openingBalance || 0),
        [isTr ? "Dönem Giriş (+)" : "Inflows (+)"]: Number(statementData.periodIncome || 0),
        [isTr ? "Dönem Çıkış (-)" : "Outflows (-)"]: Number(statementData.periodExpense || 0),
        [isTr ? "Kapanış Bakiye" : "Closing"]: Number(statementData.closingBalance || 0)
      }];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), isTr ? "Özet" : "Summary");

      const txRows = (statementData.transactions || []).map((tx: any, idx: number) => ({
        "#": idx + 1,
        [isTr ? "Tarih" : "Date"]: tx.date ? new Date(tx.date).toLocaleDateString("tr-TR") : "-",
        [isTr ? "İşlem" : "Title"]: tx.title || "",
        [isTr ? "İlgili Kişi / Cari" : "Contact"]: tx.contact_name || "-",
        [isTr ? "Belge No" : "Ref"]: tx.reference_no || "-",
        [isTr ? "Yöntem" : "Method"]: getPaymentMethodLabel(tx.payment_method),
        [isTr ? "Giriş (+)" : "Credit (+)"]: tx.type === "income" ? Number(tx.amount || 0) : 0,
        [isTr ? "Çıkış (-)" : "Debit (-)"]: tx.type === "expense" ? Number(tx.amount || 0) : 0,
        [isTr ? "Yürüyen Bakiye" : "Balance"]: Number(tx.running_balance || 0),
        [isTr ? "Açıklama" : "Notes"]: tx.description || ""
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(txRows), isTr ? "Hareketler" : "Movements");
      const safeName = (statementData.account?.account_name || statementTarget.label).replace(/[^a-zA-Z0-9_-]/g, "_");
      XLSX.writeFile(wb, `Ekstre_${safeName}_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success(isTr ? "Hesap ekstresi Excel olarak indirildi." : "Statement exported.");
    } catch {
      toast.error(isTr ? "Excel oluşturulamadı." : "Excel export failed.");
    }
  };

  const handlePrintAccountStatement = () => {
    if (!statementData || !statementTarget) return;
    const acc = statementData.account || {};
    const cur = acc.currency || "TRY";
    const periodStr = (statementStartDate || statementEndDate)
      ? `${statementStartDate || "-"} - ${statementEndDate || "-"}`
      : (isTr ? "Tüm Zamanlar" : "All Time");
    const rows = statementData.transactions || [];
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtmlStr(acc.account_name || statementTarget.label)} - Ekstre</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 10px; color: #0f172a; margin: 0; }
          .head { border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 14px; font-weight: 700; }
          .meta { font-size: 9px; color: #475569; margin-top: 2px; }
          .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 10px; }
          .kpi { border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 8px; background: #f8fafc; }
          .kpi-lbl { font-size: 8px; text-transform: uppercase; color: #64748b; }
          .kpi-val { font-size: 12px; font-weight: 700; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f1f5f9; border-bottom: 1px solid #cbd5e1; padding: 5px 6px; text-align: left; font-size: 9px; }
          td { border-bottom: 1px solid #f1f5f9; padding: 4px 6px; font-size: 9px; }
          .right { text-align: right; }
          .inc { color: #059669; font-weight: 600; }
          .exp { color: #dc2626; font-weight: 600; }
          .bal { font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="head">
          <div>
            <div class="title">${escapeHtmlStr(acc.account_name || statementTarget.label)} (${escapeHtmlStr(cur)})</div>
            <div class="meta">${acc.bank_name ? `${escapeHtmlStr(acc.bank_name)} • ` : ""}${acc.account_number ? `${escapeHtmlStr(acc.account_number)} • ` : ""}Dönem: ${escapeHtmlStr(periodStr)}</div>
          </div>
          <div class="meta right">Tarih: ${escapeHtmlStr(new Date().toLocaleDateString("tr-TR"))}</div>
        </div>
        <div class="kpis">
          <div class="kpi"><div class="kpi-lbl">Devir Bakiye</div><div class="kpi-val">${statementData.openingBalance < 0 ? "-" : ""}${escapeHtmlStr(formatMoney(statementData.openingBalance, cur))}</div></div>
          <div class="kpi"><div class="kpi-lbl">Dönem Giriş (+)</div><div class="kpi-val inc">+${escapeHtmlStr(formatMoney(statementData.periodIncome, cur))}</div></div>
          <div class="kpi"><div class="kpi-lbl">Dönem Çıkış (-)</div><div class="kpi-val exp">-${escapeHtmlStr(formatMoney(statementData.periodExpense, cur))}</div></div>
          <div class="kpi"><div class="kpi-lbl">Kapanış Bakiye</div><div class="kpi-val">${statementData.closingBalance < 0 ? "-" : ""}${escapeHtmlStr(formatMoney(statementData.closingBalance, cur))}</div></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Tarih</th>
              <th>İşlem / Açıklama</th>
              <th>İlgili / Belge</th>
              <th class="right">Giriş (+)</th>
              <th class="right">Çıkış (-)</th>
              <th class="right">Bakiye</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((tx: any) => `
              <tr>
                <td>${tx.date ? escapeHtmlStr(new Date(tx.date).toLocaleDateString("tr-TR")) : "-"}</td>
                <td>${escapeHtmlStr(tx.title || "")}${tx.description ? `<br/><span style="color:#64748b;font-size:8px;">${escapeHtmlStr(tx.description)}</span>` : ""}</td>
                <td>${escapeHtmlStr(tx.contact_name || "-")} ${tx.reference_no ? `(${escapeHtmlStr(tx.reference_no)})` : ""}</td>
                <td class="right inc">${tx.type === "income" ? `+${escapeHtmlStr(formatMoney(tx.amount, cur))}` : "-"}</td>
                <td class="right exp">${tx.type === "expense" ? `-${escapeHtmlStr(formatMoney(tx.amount, cur))}` : "-"}</td>
                <td class="right bal">${tx.running_balance < 0 ? "-" : ""}${escapeHtmlStr(formatMoney(tx.running_balance, cur))}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }, 250);
    }
  };

  // Checks & Promissory Notes Computed Filters & KPIs
  const filteredChecksNotes = useMemo(() => {
    const q = checkSearchQuery.toLowerCase().trim();
    const sTs = checkStartDate ? new Date(`${checkStartDate}T00:00:00`).getTime() : null;
    const eTs = checkEndDate ? new Date(`${checkEndDate}T23:59:59`).getTime() : null;
    return checksNotes.filter((cn: any) => {
      if (checkDirectionFilter !== "all" && cn.direction !== checkDirectionFilter) return false;
      if (checkStatusFilter !== "all" && cn.status !== checkStatusFilter) return false;
      if (checkInstrumentFilter !== "all" && cn.instrument_type !== checkInstrumentFilter) return false;
      if (sTs || eTs) {
        const dueTs = cn.due_date ? new Date(cn.due_date).getTime() : 0;
        if (sTs && dueTs < sTs) return false;
        if (eTs && dueTs > eTs) return false;
      }
      if (q) {
        const hay = `${cn.document_no || ""} ${cn.contact_name || ""} ${cn.company_title || ""} ${cn.bank_name || ""} ${cn.drawer_name || ""} ${cn.notes || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [checksNotes, checkDirectionFilter, checkStatusFilter, checkInstrumentFilter, checkStartDate, checkEndDate, checkSearchQuery]);

  const checksKpis = useMemo(() => {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 86400000);
    const portfolioReceivedByCur: Record<string, number> = {};
    const portfolioIssuedByCur: Record<string, number> = {};
    const settledByCur: Record<string, number> = {};
    let portfolioCount = 0;
    let upcomingDueCount = 0;

    checksNotes.forEach((cn: any) => {
      const cur = (cn.currency || "TRY").toUpperCase();
      const amt = Number(cn.amount || 0);
      if (cn.status === "portfolio") {
        portfolioCount += 1;
        if (cn.direction === "received") portfolioReceivedByCur[cur] = (portfolioReceivedByCur[cur] || 0) + amt;
        else portfolioIssuedByCur[cur] = (portfolioIssuedByCur[cur] || 0) + amt;
        if (cn.due_date) {
          const dd = new Date(cn.due_date);
          if (!isNaN(dd.getTime()) && dd <= in7Days) upcomingDueCount += 1;
        }
      } else if (cn.status === "collected" || cn.status === "paid") {
        settledByCur[cur] = (settledByCur[cur] || 0) + amt;
      }
    });

    const formatCurMap = (m: Record<string, number>) => {
      const entries = Object.entries(m).filter(([, v]) => v > 0);
      if (entries.length === 0) return formatMoney(0, storeDefaultCurrency || "TRY");
      return entries.map(([c, v]) => formatMoney(v, c)).join(" • ");
    };

    return {
      portfolioCount,
      upcomingDueCount,
      receivedLabel: formatCurMap(portfolioReceivedByCur),
      issuedLabel: formatCurMap(portfolioIssuedByCur),
      settledLabel: formatCurMap(settledByCur)
    };
  }, [checksNotes, storeDefaultCurrency]);

  const handleOpenCreateCheck = () => {
    setEditingCheck(null);
    setCheckFormData({
      direction: "received",
      instrument_type: "check",
      document_no: "",
      company_id: "",
      contact_name: "",
      bank_name: "",
      branch_name: "",
      drawer_name: "",
      issue_date: new Date().toISOString().split("T")[0],
      due_date: new Date().toISOString().split("T")[0],
      amount: "",
      currency: storeDefaultCurrency || defaultSectorCurrency,
      exchange_rate: "1",
      status: "portfolio",
      collection_account_id: "",
      collection_account_name: "",
      notes: ""
    });
    setShowCheckModal(true);
  };

  const handleOpenEditCheck = (cn: any) => {
    setEditingCheck(cn);
    setCheckFormData({
      direction: cn.direction === "issued" ? "issued" : "received",
      instrument_type: cn.instrument_type === "promissory_note" ? "promissory_note" : "check",
      document_no: cn.document_no || "",
      company_id: cn.company_id ? String(cn.company_id) : "",
      contact_name: cn.contact_name || "",
      bank_name: cn.bank_name || "",
      branch_name: cn.branch_name || "",
      drawer_name: cn.drawer_name || "",
      issue_date: cn.issue_date ? String(cn.issue_date).split("T")[0] : new Date().toISOString().split("T")[0],
      due_date: cn.due_date ? String(cn.due_date).split("T")[0] : new Date().toISOString().split("T")[0],
      amount: String(cn.amount || ""),
      currency: (cn.currency || "TRY").toUpperCase(),
      exchange_rate: String(cn.exchange_rate || 1),
      status: cn.status || "portfolio",
      collection_account_id: cn.collection_account_id ? String(cn.collection_account_id) : "",
      collection_account_name: cn.collection_account_name || "",
      notes: cn.notes || ""
    });
    setShowCheckModal(true);
  };

  const handleSaveCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(String(checkFormData.amount).replace(/,/g, "."));
    if (!checkFormData.document_no.trim() || !amt || amt <= 0 || !checkFormData.due_date) {
      toast.error(isTr ? "Evrak numarası, geçerli tutar ve vade tarihi zorunludur." : "Document no, positive amount and due date are required.");
      return;
    }
    const payload = {
      ...checkFormData,
      amount: amt,
      company_id: checkFormData.company_id ? Number(checkFormData.company_id) : null,
      exchange_rate: Number(String(checkFormData.exchange_rate).replace(/,/g, ".")) || 1,
      collection_account_id: checkFormData.collection_account_id ? Number(checkFormData.collection_account_id) : null
    };
    try {
      if (editingCheck) {
        await api.updateCheckNote(editingCheck.id, payload, storeId);
        toast.success(isTr ? "Çek / Senet kaydı güncellendi." : "Check/Note updated.");
      } else {
        await api.addCheckNote(payload, storeId);
        toast.success(isTr ? "Çek / Senet portföye kaydedildi." : "Check/Note recorded.");
      }
      setShowCheckModal(false);
      setEditingCheck(null);
      await Promise.all([fetchChecksNotes(), fetchTransactions()]);
    } catch (err: any) {
      toast.error(err?.message || (isTr ? "Çek / Senet kaydedilemedi." : "Failed to save check/note."));
    }
  };

  const handleSettleCheckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingCheck) return;
    setSettlingSubmitting(true);
    try {
      const targetStatus = settlingCheck.direction === "received" ? "collected" : "paid";
      const cur = (settlingCheck.currency || "TRY").toUpperCase();
      await api.updateCheckNoteStatus(
        settlingCheck.id,
        {
          status: targetStatus,
          collection_account_id: settleAccountId ? Number(settleAccountId) : null,
          collection_account_name: settleAccountId ? settleAccountName : `${cur} Nakit Kasa`,
          collected_at: settleDate,
          notes: settleNotes
        },
        storeId
      );
      toast.success(
        settlingCheck.direction === "received"
          ? (isTr ? "Çek / Senet tahsil edildi ve kasaya/bankaya işlendi." : "Collected and synced to treasury.")
          : (isTr ? "Çek / Senet ödendi ve kasadan/bankadan düşüldü." : "Paid and synced to treasury.")
      );
      setSettlingCheck(null);
      await Promise.all([fetchChecksNotes(), fetchTransactions()]);
    } catch (err: any) {
      toast.error(err?.message || (isTr ? "Tahsil / Ödeme işlemi başarısız." : "Settlement failed."));
    } finally {
      setSettlingSubmitting(false);
    }
  };

  const handleDeleteCheck = async (id: number) => {
    try {
      await api.deleteCheckNote(id, storeId);
      setConfirmDeleteCheckId(null);
      toast.success(isTr ? "Çek / Senet silindi ve bağlı kasa hareketi temizlendi." : "Deleted check/note.");
      await Promise.all([fetchChecksNotes(), fetchTransactions()]);
    } catch (err: any) {
      toast.error(err?.message || (isTr ? "Silme başarısız." : "Delete failed."));
    }
  };

  const handleExportChecksExcel = () => {
    if (filteredChecksNotes.length === 0) {
      toast.error(isTr ? "Dışa aktarılacak çek/senet bulunamadı." : "No records to export.");
      return;
    }
    try {
      const wb = XLSX.utils.book_new();
      const rows = filteredChecksNotes.map((cn: any, idx: number) => ({
        "#": idx + 1,
        [isTr ? "Vade Tarihi" : "Due Date"]: cn.due_date ? new Date(cn.due_date).toLocaleDateString("tr-TR") : "-",
        [isTr ? "Düzenleme Tarihi" : "Issue Date"]: cn.issue_date ? new Date(cn.issue_date).toLocaleDateString("tr-TR") : "-",
        [isTr ? "Evrak Türü" : "Type"]: cn.instrument_type === "promissory_note" ? (isTr ? "Senet" : "Note") : (isTr ? "Çek" : "Check"),
        [isTr ? "Yön" : "Direction"]: cn.direction === "received" ? (isTr ? "Alınan (Müşteri)" : "Received") : (isTr ? "Verilen (Borç)" : "Issued"),
        [isTr ? "Evrak No" : "Doc No"]: cn.document_no || "",
        [isTr ? "Cari / İlgili" : "Party"]: cn.company_title || cn.contact_name || "-",
        [isTr ? "Banka / Keşideci" : "Bank / Drawer"]: [cn.bank_name, cn.drawer_name].filter(Boolean).join(" / ") || "-",
        [isTr ? "Tutar" : "Amount"]: Number(cn.amount || 0),
        [isTr ? "Para Birimi" : "Currency"]: cn.currency || "TRY",
        [isTr ? "Durum" : "Status"]: cn.status,
        [isTr ? "Tahsil/Ödeme Hesabı" : "Settlement Account"]: cn.collection_account_name || "-"
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), isTr ? "Çek & Senet Ekstresi" : "Checks & Notes");
      XLSX.writeFile(wb, `Cek_Senet_Portfoyu_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success(isTr ? "Çek / Senet Excel raporu indirildi." : "Excel exported.");
    } catch {
      toast.error(isTr ? "Excel oluşturulamadı." : "Export failed.");
    }
  };

  const handlePrintChecks = () => {
    if (filteredChecksNotes.length === 0) {
      toast.error(isTr ? "Yazdırılacak çek/senet kaydı yok." : "No records to print.");
      return;
    }
    const statusMap: Record<string, string> = {
      portfolio: isTr ? "Portföyde" : "Portfolio",
      collected: isTr ? "Tahsil Edildi" : "Collected",
      paid: isTr ? "Ödendi" : "Paid",
      endorsed: isTr ? "Ciro Edildi" : "Endorsed",
      bounced: isTr ? "Karşılıksız" : "Bounced",
      cancelled: isTr ? "İptal" : "Cancelled"
    };
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Kambiyo Senetleri ve Çek Portföyü</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 10px; color: #0f172a; margin: 0; }
          .head { border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 14px; font-weight: 700; }
          .meta { font-size: 9px; color: #64748b; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f1f5f9; border-bottom: 1px solid #cbd5e1; padding: 5px 6px; text-align: left; font-size: 9px; }
          td { border-bottom: 1px solid #f1f5f9; padding: 4px 6px; font-size: 9px; }
          .right { text-align: right; }
        </style>
      </head>
      <body>
        <div class="head">
          <div>
            <div class="title">Kambiyo Senetleri & Çek Portföyü Ekstresi</div>
            <div class="meta">Toplam Kayıt: ${filteredChecksNotes.length}</div>
          </div>
          <div class="meta right">Tarih: ${escapeHtmlStr(new Date().toLocaleDateString("tr-TR"))}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Vade Tarihi</th>
              <th>Tür / Yön</th>
              <th>Evrak No</th>
              <th>İlgili Cari / Kişi</th>
              <th>Banka / Keşideci</th>
              <th class="right">Tutar</th>
              <th>Durum</th>
              <th>Hesap</th>
            </tr>
          </thead>
          <tbody>
            ${filteredChecksNotes.map((cn: any) => `
              <tr>
                <td>${cn.due_date ? escapeHtmlStr(new Date(cn.due_date).toLocaleDateString("tr-TR")) : "-"}</td>
                <td>${cn.instrument_type === "promissory_note" ? "Senet" : "Çek"} • ${cn.direction === "received" ? "Alınan" : "Verilen"}</td>
                <td>${escapeHtmlStr(cn.document_no || "-")}</td>
                <td>${escapeHtmlStr(cn.company_title || cn.contact_name || "-")}</td>
                <td>${escapeHtmlStr([cn.bank_name, cn.drawer_name].filter(Boolean).join(" / ") || "-")}</td>
                <td class="right"><strong>${escapeHtmlStr(formatMoney(cn.amount, cn.currency))}</strong></td>
                <td>${escapeHtmlStr(statusMap[cn.status] || cn.status)}</td>
                <td>${escapeHtmlStr(cn.collection_account_name || "-")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }, 250);
    }
  };

  // Filtered property list for the dedicated "Portföy Kâr/Zarar" View Tab
  const displayedPortfolioProfitList = useMemo(() => {
    const q = profitTabSearch.toLowerCase().trim();
    return portfolioAnalysis.propertyList.filter(p => {
      const titleMatch = !q || 
        (p.property.title && p.property.title.toLowerCase().includes(q)) ||
        (p.property.reference_no && p.property.reference_no.toLowerCase().includes(q)) ||
        (p.property.location && p.property.location.toLowerCase().includes(q));

      if (!titleMatch) return false;

      if (portfolioProfitFilter === "profit") return p.net > 0;
      if (portfolioProfitFilter === "loss") return p.net < 0;
      if (portfolioProfitFilter === "no_activity") return p.txCount === 0;
      return true;
    });
  }, [portfolioAnalysis.propertyList, profitTabSearch, portfolioProfitFilter]);

  return (
    <div className="space-y-2">
      {/* 1. Header & Action Bar - Responsive, Clean Mobile & Desktop Layout */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 shadow-xs flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Coins className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-xs font-semibold text-slate-800 tracking-tight truncate">
                {isTr ? "Gelir - Gider & Kasa Takibi" : "Ledger & Finances"}
              </h2>
            </div>

            {/* Action Buttons on Mobile Top Row */}
            <div className="flex sm:hidden items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setShowCharts(prev => !prev)}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  showCharts
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
                title={isTr ? "Grafik Dağılım Analizi" : "Charts"}
              >
                <BarChart3 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handlePrintStatement}
                className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                title={isTr ? "PDF Ekstre İndir / Yazdır" : "Print PDF Statement"}
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs cursor-pointer"
                title={isTr ? "Excel (XLSX) Formatında Dışa Aktar" : "Export Excel"}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => handleOpenTransferModal()}
                className="flex items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                title={isTr ? "Kasa / Banka / Pazaryeri Virman Yap" : "Transfer / Virman"}
              >
                <ArrowLeftRight className="w-3 h-3" />
                <span>{isTr ? "Virman" : "Transfer"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAccountsModal(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                title={isTr ? "Banka Hesapları & Kredi Kartlarını Yönet" : "Manage Accounts"}
              >
                <Landmark className="w-3 h-3 text-slate-600" />
                <span>{isTr ? "Hesaplar" : "Accounts"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenCreateModal()}
                className="flex items-center gap-0.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-1 px-2 rounded-lg shadow-2xs transition-colors text-[11px] cursor-pointer"
                title={isTr ? "Yeni Gelir veya Gider Kaydet" : "Record Entry"}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isTr ? "Yeni" : "New"}</span>
              </button>
            </div>
          </div>

          {/* View Mode Switcher: Genel Kasa Ekstresi, Çek & Senetler ve Portföy Kâr/Zarar */}
          <div className="inline-flex flex-wrap items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/70 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setViewTab("statement")}
              className={`px-2 py-1 sm:py-0.5 rounded text-[11px] font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer min-w-0 ${
                viewTab === "statement"
                  ? "bg-white text-indigo-600 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3 h-3 shrink-0" />
              <span className="truncate">{isTr ? "Kasa & Hesap Ekstresi" : "Ledger"}</span>
            </button>

            <button
              type="button"
              onClick={() => setViewTab("checks_notes")}
              className={`px-2 py-1 sm:py-0.5 rounded text-[11px] font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer min-w-0 ${
                viewTab === "checks_notes"
                  ? "bg-white text-indigo-600 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileCheck2 className="w-3 h-3 shrink-0" />
              <span className="truncate">{isTr ? "Çek & Senetler" : "Checks & Notes"}</span>
              {checksKpis.portfolioCount > 0 && (
                <span className="px-1 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800 shrink-0 font-semibold">
                  {checksKpis.portfolioCount}
                </span>
              )}
            </button>

            {isPortfolioSector && (
              <button
                type="button"
                onClick={() => setViewTab("portfolio_profit")}
                className={`px-2 py-1 sm:py-0.5 rounded text-[11px] font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer min-w-0 ${
                  viewTab === "portfolio_profit"
                    ? "bg-white text-indigo-600 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Building2 className="w-3 h-3 shrink-0" />
                <span className="truncate">{isTr ? "Portföy Kâr / Zarar" : "Portfolio P&L"}</span>
                {portfolioAnalysis.activeWithTxs.length > 0 && (
                  <span className="px-1 py-0.2 rounded text-[10px] bg-indigo-100 text-indigo-700 shrink-0">
                    {portfolioAnalysis.activeWithTxs.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons on Desktop */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowCharts(prev => !prev)}
            className={`p-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              showCharts
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
            }`}
            title={isTr ? "Grafik Dağılım Analizi" : "Charts"}
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handlePrintStatement}
            className="p-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
            title={isTr ? "PDF Ekstre İndir / Yazdır" : "Print PDF Statement"}
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="p-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs cursor-pointer"
            title={isTr ? "Excel (XLSX) Formatında Dışa Aktar" : "Export Excel"}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenTransferModal()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
            title={isTr ? "Nakit Kasa ↔ Banka / Hesaplar Arası Virman Yap" : "Internal Transfer / Virman"}
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isTr ? "Virman" : "Transfer"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAccountsModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title={isTr ? "Banka Hesapları & Kredi Kartlarını Yönet" : "Manage Accounts"}
          >
            <Landmark className="w-3.5 h-3.5 text-slate-600" />
            <span>{isTr ? "Hesaplar" : "Accounts"}</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenCreateModal()}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-1 px-2.5 rounded-lg shadow-2xs transition-colors text-xs cursor-pointer"
            title={isTr ? "Yeni Gelir veya Gider Kaydet" : "Record Entry"}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isTr ? "Yeni" : "New"}</span>
          </button>
        </div>
      </div>

      {/* VIEW TAB 1: KASA & HESAP EKSTRESİ */}
      {viewTab === "statement" && (
        <>
          {/* 2. Date Range & Period Filter Bar - High Density Single Row */}
          <div className="bg-white border border-slate-200/80 rounded-xl px-2.5 py-1.5 shadow-xs flex flex-wrap items-center justify-between gap-1.5 text-xs">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tight mr-0.5 flex items-center gap-1 shrink-0">
                <Calendar className="w-3 h-3 text-indigo-500" />
                {isTr ? "Dönem:" : "Period:"}
              </span>
              {[
                { id: "all", label: isTr ? "Genel" : "All" },
                { id: "today", label: isTr ? "Bugün" : "Today" },
                { id: "this_week", label: isTr ? "Bu Hafta" : "This Week" },
                { id: "this_month", label: isTr ? "Bu Ay" : "This Month" }
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectDatePreset(p.id as DatePreset)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                    datePreset === p.id
                      ? "bg-indigo-600 text-white font-semibold"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-1 w-full sm:w-auto">
              <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-50 border border-slate-200 rounded-lg px-1.5 sm:px-2 py-0.5 min-w-0">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDatePreset("custom");
                  }}
                  className="bg-transparent text-[10.5px] sm:text-[11px] font-medium text-slate-700 focus:outline-none w-[86px] sm:w-24"
                />
                <span className="text-slate-300">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDatePreset("custom");
                  }}
                  className="bg-transparent text-[10.5px] sm:text-[11px] font-medium text-slate-700 focus:outline-none w-[86px] sm:w-24"
                />
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {(startDate || endDate || currencyFilter !== "all" || cashVaultFilter !== "all" || typeFilter !== "all" || categoryFilter !== "all" || methodFilter !== "all" || selectedAccountId !== "all" || selectedPropertyFilter !== "all" || searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectDatePreset("all");
                      setCurrencyFilter("all");
                      setCashVaultFilter("all");
                      setTypeFilter("all");
                      setCategoryFilter("all");
                      setMethodFilter("all");
                      setSelectedAccountId("all");
                      setSelectedPropertyFilter("all");
                      setSearchQuery("");
                    }}
                    className="flex items-center justify-center p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/70 transition-colors cursor-pointer shrink-0"
                    title={isTr ? "Filtreleri Sıfırla" : "Reset Filters"}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowAccountsSummary(prev => !prev)}
                  className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer shrink-0 ${
                    showAccountsSummary || currencyFilter !== "all" || cashVaultFilter !== "all" || selectedAccountId !== "all"
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200 bg-white"
                  }`}
                >
                  <Wallet className="w-3 h-3 shrink-0" />
                  <span>{isTr ? "Kasalar" : "Ledgers"}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform shrink-0 ${showAccountsSummary ? "rotate-180" : ""}`} />
                </button>
              </div>
            </div>
          </div>

          {/* 3. Kompakt Kasalar, Bankalar, Çek Kasası ve E-Market Kasaları Paneli (High-Density Operator Standard) */}
          {showAccountsSummary && (
            <div className="bg-white border border-slate-200/80 rounded-xl p-2 shadow-xs text-xs space-y-2">
              {/* 3A. Nakit Kasalar (Sadece Fiziki/Elden Nakit İşlemler) */}
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight mb-1 flex items-center justify-between gap-2">
                  <span>{isTr ? "Nakit Kasalar (Sadece Nakit Hareketler)" : "Physical Cash Vaults (Cash Only)"}</span>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">{isTr ? "Kasa seçmek için karta tıklayın" : "Click card to isolate ledger"}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {SUPPORTED_CURRENCIES.map(cur => {
                    const data = statementAnalysis.summaryByCurrency[cur];
                    const sym = getCurrencySymbol(cur);
                    const isNetNegative = data.closingBalance < 0;
                    const isSelected = cashVaultFilter === cur && selectedAccountId === "all";

                    return (
                      <div
                        key={cur}
                        onClick={() => {
                          if (cashVaultFilter === cur && selectedAccountId === "all") {
                            setCashVaultFilter("all");
                            setCurrencyFilter("all");
                            setMethodFilter("all");
                          } else {
                            setCashVaultFilter(cur);
                            setCurrencyFilter(cur);
                            setMethodFilter("cash");
                            setSelectedAccountId("all");
                          }
                        }}
                        className={`cursor-pointer rounded-lg px-2 py-1.5 transition-all border ${
                          isSelected
                            ? "bg-slate-900 text-white border-slate-900 shadow-xs ring-1 ring-indigo-500/40"
                            : "bg-slate-50/70 hover:bg-slate-100/80 border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-[11px] font-semibold ${isSelected ? "text-indigo-200" : "text-slate-700"}`}>
                            {cur} {isTr ? "Kasa" : "Cash"}
                          </span>
                          <span className={`text-[9.5px] font-medium px-1 py-0.2 rounded ${
                            isSelected ? "bg-white/15 text-slate-100" : "bg-white text-slate-500 border border-slate-200"
                          }`}>
                            {data.txCount} {isTr ? "işlem" : "tx"}
                          </span>
                        </div>

                        <div className={`text-xs sm:text-sm font-bold tracking-tight mt-0.5 ${
                          isSelected
                            ? (isNetNegative ? "text-rose-300" : "text-emerald-300")
                            : (isNetNegative ? "text-rose-600" : "text-emerald-700")
                        }`}>
                          {isNetNegative ? "-" : ""}{sym}{Math.abs(data.closingBalance).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>

                        <div className="flex items-center justify-between text-[9.5px] mt-1 pt-1 border-t border-slate-200/50 gap-1">
                          <div className="flex items-center gap-1 truncate">
                            <span className={isSelected ? "text-emerald-300" : "text-emerald-600"}>+{sym}{data.periodIncome.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}</span>
                            <span className={isSelected ? "text-rose-300" : "text-rose-500"}>-{sym}{data.periodExpense.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenTransferModal({ cashCurrency: cur });
                              }}
                              className={`px-1 py-0.5 rounded text-[9.5px] font-semibold flex items-center gap-0.5 cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200"
                                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80"
                              }`}
                              title={isTr ? `${cur} Nakit Kasadan Bankaya Virman / Yatır` : `Transfer ${cur} Cash to Bank`}
                            >
                              <ArrowLeftRight className="w-2.5 h-2.5" />
                              <span>{isTr ? "Virman" : "Xfer"}</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAccountStatement({
                                  cashCurrency: cur,
                                  label: `${cur} ${isTr ? "Nakit Kasa" : "Cash Vault"}`
                                });
                              }}
                              className={`px-1 py-0.5 rounded text-[9.5px] font-semibold flex items-center gap-0.5 cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-white/15 hover:bg-white/25 text-white"
                                  : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/70"
                              }`}
                              title={isTr ? `${cur} Nakit Kasa Ekstresi` : "Open Statement"}
                            >
                              <FileText className="w-2.5 h-2.5" />
                              <span>{isTr ? "Ekstre" : "Stmt"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3B. Banka Hesapları, Kredi Kartları & Çek/Senet Kasası (STRICTLY excludes marketplace vaults) */}
              {(() => {
                const bankCardAccounts = accounts.filter(a => !isMarketplaceAccount(a) && (a.account_type === "bank" || a.account_type === "credit_card"));
                if (bankCardAccounts.length === 0 && checksKpis.portfolioCount === 0) return null;

                return (
                  <div className="pt-1.5 border-t border-slate-200/60">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight mb-1 flex items-center justify-between gap-2">
                      <span>{isTr ? "Banka Hesapları, Kredi Kartları & Çek Kasası" : "Banks, Cards & Check Vault"}</span>
                      <button
                        type="button"
                        onClick={() => setShowAccountsModal(true)}
                        className="text-[10px] text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 cursor-pointer font-medium"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{isTr ? "Hesap Ekle / Düzenle" : "Manage Accounts"}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5">
                      {bankCardAccounts.map(acc => {
                        const accSummary = statementAnalysis.summaryByAccount[String(acc.id)] || {
                          closingBalance: Number(acc.initial_balance || 0),
                          periodIncome: 0,
                          periodExpense: 0,
                          txCount: 0
                        };
                        const sym = getCurrencySymbol(acc.currency);
                        const isSelected = selectedAccountId === String(acc.id);
                        const isCard = acc.account_type === "credit_card";
                        const isAccNegative = accSummary.closingBalance < 0;

                        return (
                          <div
                            key={acc.id}
                            onClick={() => {
                              if (selectedAccountId === String(acc.id)) {
                                setSelectedAccountId("all");
                              } else {
                                setSelectedAccountId(String(acc.id));
                                setCashVaultFilter("all");
                                setCurrencyFilter("all");
                                setMethodFilter("all");
                              }
                            }}
                            className={`cursor-pointer rounded-lg px-2 py-1.5 transition-all border ${
                              isSelected
                                ? "bg-slate-900 text-white border-slate-900 shadow-xs ring-1 ring-indigo-500/40"
                                : "bg-slate-50/70 hover:bg-slate-100/80 border-slate-200"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1 min-w-0">
                                {isCard ? (
                                  <CreditCard className={`w-3 h-3 shrink-0 ${isSelected ? "text-indigo-300" : "text-indigo-500"}`} />
                                ) : (
                                  <Landmark className={`w-3 h-3 shrink-0 ${isSelected ? "text-emerald-300" : "text-emerald-600"}`} />
                                )}
                                <span className={`text-[11px] font-semibold truncate ${isSelected ? "text-white" : "text-slate-800"}`}>
                                  {acc.account_name}
                                </span>
                              </div>
                              <span className={`text-[9.5px] font-medium px-1 py-0.2 rounded shrink-0 ${
                                isSelected ? "bg-white/15 text-slate-100" : "bg-white text-slate-500 border border-slate-200"
                              }`}>
                                {acc.currency}
                              </span>
                            </div>

                            <div className="flex items-baseline justify-between gap-1 mt-0.5">
                              <span className={`text-xs font-bold tracking-tight ${
                                isSelected
                                  ? (isAccNegative ? "text-rose-300" : "text-emerald-300")
                                  : (isAccNegative ? "text-rose-600" : "text-emerald-700")
                              }`}>
                                {isAccNegative ? "-" : ""}{sym}{Math.abs(accSummary.closingBalance).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span className={`text-[9.5px] ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                                {accSummary.txCount} {isTr ? "kayıt" : "tx"}
                              </span>
                            </div>

                            <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-200/50 gap-1">
                              <div className="flex items-center gap-1 text-[9.5px] truncate">
                                <span className={isSelected ? "text-emerald-300" : "text-emerald-600"}>+{sym}{accSummary.periodIncome.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}</span>
                                <span className={isSelected ? "text-rose-300" : "text-rose-500"}>-{sym}{accSummary.periodExpense.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {!isCard && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenTransferModal({ account: acc });
                                    }}
                                    className={`px-1 py-0.5 rounded text-[9.5px] font-semibold flex items-center gap-0.5 cursor-pointer transition-colors ${
                                      isSelected
                                        ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200"
                                        : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80"
                                    }`}
                                    title={isTr ? `${acc.account_name} Hesabından Virman` : "Transfer from Bank"}
                                  >
                                    <ArrowLeftRight className="w-2.5 h-2.5" />
                                    <span>{isTr ? "Virman" : "Xfer"}</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenAccountStatement({
                                      accountId: acc.id,
                                      label: acc.account_name
                                    });
                                  }}
                                  className={`px-1 py-0.5 rounded text-[9.5px] font-semibold flex items-center gap-0.5 cursor-pointer transition-colors ${
                                    isSelected
                                      ? "bg-white/15 hover:bg-white/25 text-white"
                                      : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/70"
                                  }`}
                                  title={isTr ? `${acc.account_name} Ekstresi` : "Open Statement"}
                                >
                                  <FileText className="w-2.5 h-2.5" />
                                  <span>{isTr ? "Ekstre" : "Stmt"}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Çek / Senet Kasası (Portföydeki Bekleyen Çekler -> Tahsil / Virman Kısayolu) */}
                      <div
                        onClick={() => setViewTab("checks_notes")}
                        className="cursor-pointer rounded-lg px-2 py-1.5 transition-all border bg-violet-50/50 hover:bg-violet-50 border-violet-200/80"
                        title={isTr ? "Vadesi gelen çekleri nakit kasa veya banka hesabına virman etmek için tıklayın" : "Open Checks & Notes Portfolio"}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1 min-w-0">
                            <FileCheck2 className="w-3 h-3 text-violet-600 shrink-0" />
                            <span className="text-[11px] font-semibold text-slate-800 truncate">
                              {isTr ? "Çek / Senet Kasası" : "Check Vault"}
                            </span>
                          </div>
                          <span className="text-[9.5px] font-semibold px-1 py-0.2 rounded bg-white text-violet-700 border border-violet-200 shrink-0">
                            {checksKpis.portfolioCount} {isTr ? "evrak" : "items"}
                          </span>
                        </div>

                        <div className="text-xs font-bold text-violet-800 truncate mt-0.5">
                          {checksKpis.receivedLabel || "₺0,00"}
                        </div>

                        <div className="flex items-center justify-between mt-1 pt-1 border-t border-violet-200/50 gap-1">
                          <span className="text-[9.5px] text-slate-500 truncate">
                            {checksKpis.upcomingDueCount > 0
                              ? `${checksKpis.upcomingDueCount} ${isTr ? "vadesi yakın" : "due soon"}`
                              : (isTr ? "Portföy takibi" : "Portfolio")}
                          </span>
                          <span className="px-1 py-0.5 rounded text-[9.5px] font-semibold bg-violet-100 text-violet-800 flex items-center gap-0.5 shrink-0">
                            <ArrowLeftRight className="w-2.5 h-2.5" />
                            <span>{isTr ? "Tahsil / Virman" : "Settle"}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 3C. E-Market Kasaları (HB, TY, N11, AMZ, PZRM) - STRICTLY shopLP ONLY (AGENTS.md Rule 0) */}
              {isShopLPSector && (() => {
                const mpOrder: Record<string, number> = { hepsiburada: 0, trendyol: 1, n11: 2, amazon: 3, pazarama: 4 };
                const mpVaults = accounts
                  .filter(a => isMarketplaceAccount(a))
                  .sort((a, b) => {
                    const ka = String(a.account_number || a.account_name || "").toLowerCase();
                    const kb = String(b.account_number || b.account_name || "").toLowerCase();
                    const oa = Object.entries(mpOrder).find(([k]) => ka.includes(k))?.[1] ?? 99;
                    const ob = Object.entries(mpOrder).find(([k]) => kb.includes(k))?.[1] ?? 99;
                    return oa !== ob ? oa - ob : a.id - b.id;
                  });
                const totalNetReceivable = mpVaults.reduce((sum, acc) => {
                  const bal = statementAnalysis.summaryByAccount[String(acc.id)]?.closingBalance ?? Number(acc.initial_balance || 0);
                  return sum + bal;
                }, 0);

                return (
                  <div className="pt-1.5 border-t border-slate-200/70">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight mb-1 flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <Store className="w-3 h-3 text-amber-600" />
                        <span>{isTr ? "E-Market Kasaları (HB • TY • N11 • AMZ • PZRM)" : "Marketplace Vaults (Net Receivables)"}</span>
                        {mpVaults.length > 0 && (
                          <span className={`px-1.5 py-0.2 rounded font-semibold ${
                            totalNetReceivable < 0 ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                          }`}>
                            {isTr ? "Net Alacak:" : "Total Net:"} {totalNetReceivable < 0 ? "-" : ""}₺{Math.abs(totalNetReceivable).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {mpVaults.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleOpenTransferModal({ preferMarketplace: true })}
                            className="px-1.5 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <ArrowLeftRight className="w-2.5 h-2.5" />
                            <span>{isTr ? "Hakediş Virmanı" : "Payout"}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={syncingMarketplaces}
                          onClick={() => handleSyncMarketplaces(false)}
                          className="px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                          title={isTr ? "Tüm e-market kasalarını, sipariş tarihlerini, iptalleri ve gider faturalarını yeniden eşitle" : "Sync marketplace vaults & orders"}
                        >
                          <RefreshCw className={`w-2.5 h-2.5 ${syncingMarketplaces ? "animate-spin" : ""}`} />
                          <span>{syncingMarketplaces ? (isTr ? "Eşitleniyor..." : "Syncing...") : (isTr ? "Eşitle" : "Sync")}</span>
                        </button>
                      </div>
                    </div>

                    {mpVaults.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50/40 px-2.5 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                        <span>
                          {isTr
                            ? "Hepsiburada, Trendyol, N11, Amazon ve Pazarama kasalarını oluşturmak ve siparişleri eşitlemek için tıklayın."
                            : "Click to initialize Hepsiburada, Trendyol, N11, Amazon & Pazarama vaults."}
                        </span>
                        <button
                          type="button"
                          disabled={syncingMarketplaces}
                          onClick={() => handleSyncMarketplaces(false)}
                          className="px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-semibold cursor-pointer"
                        >
                          {isTr ? "Kasaları Oluştur & Eşitle" : "Initialize & Sync"}
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
                        {mpVaults.map(acc => {
                          const accSummary = statementAnalysis.summaryByAccount[String(acc.id)] || {
                            closingBalance: Number(acc.initial_balance || 0),
                            periodIncome: 0,
                            periodExpense: 0,
                            txCount: 0
                          };
                          const sym = getCurrencySymbol(acc.currency);
                          const isSelected = selectedAccountId === String(acc.id);
                          const isAccNegative = accSummary.closingBalance < 0;

                          return (
                            <div
                              key={acc.id}
                              onClick={() => {
                                if (selectedAccountId === String(acc.id)) {
                                  setSelectedAccountId("all");
                                } else {
                                  setSelectedAccountId(String(acc.id));
                                  setCashVaultFilter("all");
                                  setCurrencyFilter("all");
                                  setMethodFilter("all");
                                }
                              }}
                              className={`cursor-pointer rounded-lg px-2 py-1.5 transition-all border ${
                                isSelected
                                  ? "bg-slate-900 text-white border-slate-900 shadow-xs ring-1 ring-amber-400/50"
                                  : "bg-amber-50/40 hover:bg-amber-50/90 border-amber-200/80"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1 min-w-0">
                                  <Store className={`w-3 h-3 shrink-0 ${isSelected ? "text-amber-300" : "text-amber-600"}`} />
                                  <span className={`text-[11px] font-semibold truncate ${isSelected ? "text-white" : "text-slate-900"}`}>
                                    {acc.account_name}
                                  </span>
                                </div>
                                <span className={`text-[9.5px] font-medium px-1 py-0.2 rounded shrink-0 ${
                                  isSelected ? "bg-white/15 text-slate-100" : "bg-white text-slate-600 border border-amber-200"
                                }`}>
                                  {accSummary.txCount}
                                </span>
                              </div>

                              <div className="flex items-baseline justify-between gap-1 mt-0.5">
                                <span className={`text-xs font-bold tracking-tight ${
                                  isSelected
                                    ? (isAccNegative ? "text-rose-300" : "text-emerald-300")
                                    : (isAccNegative ? "text-rose-600" : "text-emerald-700")
                                }`}>
                                  {isAccNegative ? "-" : ""}{sym}{Math.abs(accSummary.closingBalance).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <div className="flex items-center gap-1 text-[9.5px]">
                                  <span className={isSelected ? "text-emerald-300" : "text-emerald-700"}>+{sym}{accSummary.periodIncome.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}</span>
                                  <span className={isSelected ? "text-rose-300" : "text-rose-600"}>-{sym}{accSummary.periodExpense.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-200/50 gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenTransferModal({ account: acc });
                                  }}
                                  className={`px-1 py-0.5 rounded text-[9.5px] font-semibold flex items-center gap-0.5 cursor-pointer transition-colors ${
                                    isSelected
                                      ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200"
                                      : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80"
                                  }`}
                                  title={isTr ? "Bu pazaryeri hakedişini banka hesabına virman et" : "Transfer payout to bank"}
                                >
                                  <ArrowLeftRight className="w-2.5 h-2.5" />
                                  <span>{isTr ? "Virman" : "Payout"}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenAccountStatement({
                                      accountId: acc.id,
                                      label: acc.account_name
                                    });
                                  }}
                                  className={`px-1 py-0.5 rounded text-[9.5px] font-semibold flex items-center gap-0.5 cursor-pointer transition-colors ${
                                    isSelected
                                      ? "bg-white/15 hover:bg-white/25 text-white"
                                      : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/70"
                                  }`}
                                  title={isTr ? `${acc.account_name} Ekstresi` : "Open Statement"}
                                >
                                  <FileText className="w-2.5 h-2.5" />
                                  <span>{isTr ? "Ekstre" : "Stmt"}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Active Isolated Ledger Banner */}
          {(cashVaultFilter !== "all" || selectedAccountId !== "all") && (() => {
            const activeAcc = selectedAccountId !== "all" ? accounts.find(a => String(a.id) === selectedAccountId) : null;
            const activeLabel = activeAcc
              ? activeAcc.account_name
              : `${cashVaultFilter} ${isTr ? "Nakit Kasa (Sadece Nakit Hareketler)" : "Physical Cash Vault (Cash Only)"}`;
            return (
              <div className="bg-slate-900 text-white rounded-lg px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                  <span className="text-slate-300">{isTr ? "Aktif İzole Ekstre:" : "Active Isolated Ledger:"}</span>
                  <span className="font-semibold text-white">{activeLabel}</span>
                  <span className="text-slate-400">({filteredTransactions.length} {isTr ? "hareket" : "rows"})</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCashVaultFilter("all");
                    setSelectedAccountId("all");
                    setCurrencyFilter("all");
                    setMethodFilter("all");
                  }}
                  className="px-2 py-0.5 rounded bg-white/15 hover:bg-white/25 text-white text-[10px] font-semibold cursor-pointer transition-colors"
                >
                  {isTr ? "Tüm Hesapları Göster" : "Show All Ledgers"}
                </button>
              </div>
            );
          })()}

          {/* 4. Seçili Portföy Kâr / Zarar Karnesi (Only shown when a portfolio filter is active in ledger) */}
          {selectedPropertyFilter !== "all" && (() => {
            const prof = portfolioAnalysis.propertyMap[selectedPropertyFilter];
            if (!prof) return null;
            const isProfit = prof.net >= 0;
            const sym = getCurrencySymbol(prof.currency);

            return (
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <span>{prof.property.reference_no ? `[${prof.property.reference_no}] ` : ""}{prof.property.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                        isProfit ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}>
                        {isProfit ? (isTr ? "🟢 KÂRDA" : "PROFIT") : (isTr ? "🔴 MASRAF / ZARARDA" : "LOSS")}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {prof.property.price ? `${isTr ? "İlan Değeri:" : "Value:"} ${formatMoney(prof.property.price, prof.currency)} • ` : ""}
                      {prof.txCount} {isTr ? "finansal hareket listeleniyor" : "transactions listed"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase">{isTr ? "Toplam Gelir" : "Income"}</span>
                    <span className="font-semibold text-emerald-600">+{sym}{prof.income.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase">{isTr ? "Toplam Masraf" : "Expense"}</span>
                    <span className="font-semibold text-rose-600">-{sym}{prof.expense.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="text-right border-l border-indigo-200/80 pl-3">
                    <span className="text-[10px] text-slate-400 block uppercase">{isTr ? "Net Kâr / Zarar" : "Net P&L"}</span>
                    <span className={`font-semibold text-sm ${isProfit ? "text-emerald-700" : "text-rose-700"}`}>
                      {prof.net < 0 ? "-" : "+"}{sym}{Math.abs(prof.net).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 pl-2">
                    <button
                      type="button"
                      onClick={() => handleOpenCreateModal(selectedPropertyFilter)}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-medium flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isTr ? "Gelir/Gider Ekle" : "Add Entry"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPropertyFilter("all")}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                      title={isTr ? "Filtreyi Kaldır" : "Clear Filter"}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 5. Statement Ledger Table & Compact Single-Row Filter Toolbar */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 shadow-xs space-y-2">
            {/* Minimized Single-Row Filter Bar (No Currency Count Buttons, No "Tüm" Prefix) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-100 text-xs" data-dropdown-root>
              <div className={`grid ${isPortfolioSector ? "grid-cols-4" : "grid-cols-3"} sm:flex sm:items-center gap-1 sm:gap-1.5 w-full sm:w-auto relative`}>
                {/* 1. Portföyler Custom Minimal 2-Line Dropdown (Yalnız Portföy Sektörleri) */}
                {isPortfolioSector && (
                  <div className="relative min-w-0">
                    <button
                      type="button"
                      onClick={() => setOpenDropdown(prev => prev === "filter_property" ? null : "filter_property")}
                      className={`w-full sm:w-auto sm:max-w-[160px] px-1.5 sm:px-2.5 py-1 rounded-lg border text-[10.5px] sm:text-xs font-medium flex items-center justify-between gap-1 transition-colors cursor-pointer ${
                        selectedPropertyFilter !== "all"
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-indigo-50/70 border-indigo-200 text-indigo-900 hover:bg-indigo-100/70"
                      }`}
                    >
                      <span className="truncate">
                        {selectedPropertyFilter === "all"
                          ? (isTr ? (activeAutomotive ? "Araçlar" : "Portföyler") : "Portfolio")
                          : (() => {
                              const found = properties.find(p => String(p.id) === String(selectedPropertyFilter)) || vehicles.find(v => String(v.id) === String(selectedPropertyFilter));
                              if (!found) return isTr ? "Portföy" : "Portfolio";
                              if (activeAutomotive) return found.plate || `${found.brand || ""} ${found.model || ""}`;
                              return found.reference_no ? `#${found.reference_no}` : found.title;
                            })()}
                      </span>
                      <ChevronDown className="w-3 h-3 shrink-0 opacity-75" />
                    </button>

                    {openDropdown === "filter_property" && (
                      <div className="absolute left-0 top-full mt-1 z-40 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-xl shadow-xl p-1 max-h-60 overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPropertyFilter("all");
                            setOpenDropdown(null);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                            selectedPropertyFilter === "all"
                              ? "bg-indigo-50 text-indigo-700"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {isTr ? (activeAutomotive ? "Araçlar (Hepsi)" : "Portföyler (Hepsi)") : "Portfolio (All)"}
                        </button>
                        {(activeAutomotive ? vehicles : properties).map((p: any) => {
                          const isSel = String(selectedPropertyFilter) === String(p.id);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSelectedPropertyFilter(String(p.id));
                                setOpenDropdown(null);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer border-t border-slate-50 ${
                                isSel ? "bg-indigo-600 text-white" : "text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <div className="line-clamp-2 text-[11px] leading-snug font-medium break-words">
                                {activeAutomotive ? (
                                  `${p.plate || ""} - ${p.brand || ""} ${p.model || ""}`
                                ) : (
                                  <>
                                    {p.reference_no ? <span className={`font-mono font-semibold mr-1 ${isSel ? "text-indigo-200" : "text-indigo-600"}`}>#{p.reference_no}</span> : null}
                                    {p.title}
                                  </>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Ödeme Tipi Custom Dropdown */}
                <div className="relative min-w-0">
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(prev => prev === "filter_method" ? null : "filter_method")}
                    className={`w-full sm:w-auto px-1.5 sm:px-2.5 py-1 rounded-lg border text-[10.5px] sm:text-xs font-medium flex items-center justify-between gap-1 transition-colors cursor-pointer ${
                      methodFilter !== "all"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="truncate">
                      {methodFilter === "all"
                        ? (isTr ? "Ödeme Tipi" : "Method")
                        : methodFilter === "cash"
                        ? (isTr ? "Nakit" : "Cash")
                        : methodFilter === "bank_transfer"
                        ? (isTr ? "Havale/EFT" : "Bank")
                        : methodFilter === "credit_card"
                        ? (isTr ? "Kredi Kartı" : "Card")
                        : methodFilter === "marketplace_vault"
                        ? (isTr ? "Pazaryeri" : "Marketplace")
                        : (isTr ? "Çek/Senet" : "Check")}
                    </span>
                    <ChevronDown className="w-3 h-3 shrink-0 opacity-75" />
                  </button>

                  {openDropdown === "filter_method" && (
                    <div className="absolute left-0 top-full mt-1 z-40 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-1">
                      {[
                        { id: "all", label: isTr ? "Ödeme Tipi (Hepsi)" : "Method (All)" },
                        { id: "cash", label: isTr ? "💵 Nakit Kasa" : "Cash" },
                        { id: "bank_transfer", label: isTr ? "🏦 Banka Havale / EFT" : "Bank Transfer" },
                        { id: "credit_card", label: isTr ? "💳 Kredi Kartı" : "Credit Card" },
                        { id: "check_promissory", label: isTr ? "📝 Çek / Senet" : "Check / Note" },
                        ...(isShopLPSector ? [{ id: "marketplace_vault", label: isTr ? "🛒 Pazaryeri Kasası" : "Marketplace Vault" }] : [])
                      ].map(opt => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setMethodFilter(opt.id);
                            if (opt.id !== "cash") setCashVaultFilter("all");
                            if (opt.id !== "all" && selectedAccountId !== "all") {
                              const acc = accounts.find(a => String(a.id) === selectedAccountId);
                              if (
                                !acc ||
                                (opt.id === "bank_transfer" && acc.account_type !== "bank") ||
                                (opt.id === "credit_card" && acc.account_type !== "credit_card") ||
                                (opt.id === "marketplace_vault" && acc.account_type !== "marketplace") ||
                                opt.id === "cash" ||
                                opt.id === "check_promissory"
                              ) {
                                setSelectedAccountId("all");
                              }
                            }
                            setOpenDropdown(null);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap truncate transition-colors cursor-pointer ${
                            methodFilter === opt.id
                              ? "bg-indigo-50 text-indigo-700 font-semibold"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Türler Custom Dropdown */}
                <div className="relative min-w-0">
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(prev => prev === "filter_type" ? null : "filter_type")}
                    className={`w-full sm:w-auto px-1.5 sm:px-2.5 py-1 rounded-lg border text-[10.5px] sm:text-xs font-medium flex items-center justify-between gap-1 transition-colors cursor-pointer ${
                      typeFilter !== "all"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="truncate">
                      {typeFilter === "all"
                        ? (isTr ? "Türler" : "Types")
                        : typeFilter === "income"
                        ? (isTr ? "Gelir (+)" : "Income")
                        : (isTr ? "Gider (-)" : "Expense")}
                    </span>
                    <ChevronDown className="w-3 h-3 shrink-0 opacity-75" />
                  </button>

                  {openDropdown === "filter_type" && (
                    <div className="absolute right-0 sm:left-0 top-full mt-1 z-40 w-40 bg-white border border-slate-200 rounded-xl shadow-xl p-1">
                      {[
                        { id: "all", label: isTr ? "Türler (Hepsi)" : "Types (All)" },
                        { id: "income", label: isTr ? "Gelir (+)" : "Income (+)" },
                        { id: "expense", label: isTr ? "Gider (-)" : "Expense (-)" }
                      ].map(opt => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setTypeFilter(opt.id as any);
                            setCategoryFilter("all");
                            setOpenDropdown(null);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap truncate transition-colors cursor-pointer ${
                            typeFilter === opt.id
                              ? "bg-indigo-50 text-indigo-700 font-semibold"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Kategoriler Single-Line Optimized Custom Dropdown */}
                <div className="relative min-w-0">
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(prev => prev === "filter_category" ? null : "filter_category")}
                    className={`w-full sm:w-auto sm:max-w-[150px] px-1.5 sm:px-2.5 py-1 rounded-lg border text-[10.5px] sm:text-xs font-medium flex items-center justify-between gap-1 transition-colors cursor-pointer ${
                      categoryFilter !== "all"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="truncate">
                      {categoryFilter === "all"
                        ? (isTr ? "Kategoriler" : "Categories")
                        : [...categories.income, ...categories.expense].find(c => c.id === categoryFilter)?.label || (isTr ? "Kategoriler" : "Categories")}
                    </span>
                    <ChevronDown className="w-3 h-3 shrink-0 opacity-75" />
                  </button>

                  {openDropdown === "filter_category" && (
                    <div className="absolute right-0 sm:left-0 top-full mt-1 z-40 w-64 sm:w-72 max-w-[calc(100vw-1.5rem)] bg-white border border-slate-200 rounded-xl shadow-xl p-1 max-h-64 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryFilter("all");
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-[10.5px] sm:text-[11px] font-semibold whitespace-nowrap truncate transition-colors cursor-pointer ${
                          categoryFilter === "all"
                            ? "bg-indigo-50 text-indigo-700"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {isTr ? "Kategoriler (Hepsi)" : "Categories (All)"}
                      </button>

                      {(typeFilter === "all" || typeFilter === "income") && (
                        <div className="mt-1">
                          <div className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50/60 rounded">
                            {isTr ? "Gelirler" : "Incomes"}
                          </div>
                          {categories.income.map(c => (
                            <button
                              key={`inc-${c.id}`}
                              type="button"
                              onClick={() => {
                                setCategoryFilter(c.id);
                                setOpenDropdown(null);
                              }}
                              className={`w-full text-left px-2 py-1.5 rounded-lg text-[10.5px] sm:text-[11px] leading-tight font-medium whitespace-nowrap truncate transition-colors cursor-pointer ${
                                categoryFilter === c.id
                                  ? "bg-indigo-600 text-white font-semibold"
                                  : "text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {(typeFilter === "all" || typeFilter === "expense") && (
                        <div className="mt-1">
                          <div className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50/60 rounded">
                            {isTr ? "Giderler" : "Expenses"}
                          </div>
                          {categories.expense.map(c => (
                            <button
                              key={`exp-${c.id}`}
                              type="button"
                              onClick={() => {
                                setCategoryFilter(c.id);
                                setOpenDropdown(null);
                              }}
                              className={`w-full text-left px-2 py-1.5 rounded-lg text-[10.5px] sm:text-[11px] leading-tight font-medium whitespace-nowrap truncate transition-colors cursor-pointer ${
                                categoryFilter === c.id
                                  ? "bg-indigo-600 text-white font-semibold"
                                  : "text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Search Input */}
              <div className="relative w-full sm:w-44">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={isPortfolioSector ? (isTr ? "Ara (başlık, portföy, kişi)..." : "Search...") : (isTr ? "Ara (başlık, kişi, belge)..." : "Search...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
                />
              </div>
            </div>

            {/* High Density Statement Table */}
            <div className="overflow-x-auto">
              {loadingFinances ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-xs text-slate-500">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                  <span>{isTr ? "Kasa hareketleri yükleniyor..." : "Loading statement..."}</span>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
                  <Wallet className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                  <div className="text-xs font-semibold text-slate-600">
                    {isTr ? "Kriterlere uygun kasa hareketi bulunamadı" : "No transactions found"}
                  </div>
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70">
                      <th className="py-2 px-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{isTr ? "TARİH / BELGE" : "DATE / REF"}</th>
                      <th className="py-2 px-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{isPortfolioSector ? (isTr ? "İŞLEM BAŞLIĞI / İLAN / CARİ" : "TITLE / LISTING") : (isTr ? "İŞLEM BAŞLIĞI / CARİ" : "TITLE / CONTACT")}</th>
                      <th className="py-2 px-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{isTr ? "KATEGORİ & HESAP" : "CATEGORY & ACCOUNT"}</th>
                      <th className="py-2 px-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center">{isTr ? "DÖVİZ" : "CUR"}</th>
                      <th className="py-2 px-2.5 text-[10px] font-semibold text-emerald-700 uppercase tracking-wider text-right">{isTr ? "GİRİŞ (GELİR +)" : "CREDIT (+)"}</th>
                      <th className="py-2 px-2.5 text-[10px] font-semibold text-rose-700 uppercase tracking-wider text-right">{isTr ? "ÇIKIŞ (GİDER -)" : "DEBIT (-)"}</th>
                      <th className="py-2 px-2.5 text-[10px] font-semibold text-slate-700 uppercase tracking-wider text-right">
                        {selectedAccountId !== "all"
                          ? (isTr ? "HESAP BAKİYESİ" : "ACCOUNT BALANCE")
                          : (cashVaultFilter !== "all" || (methodFilter === "cash" && selectedAccountId === "all"))
                          ? (isTr ? "KASA BAKİYESİ" : "CASH BALANCE")
                          : (methodFilter !== "all" || typeFilter !== "all" || categoryFilter !== "all" || selectedPropertyFilter !== "all" || searchQuery)
                          ? (isTr ? "DÖNEM BAKİYESİ" : "NET BALANCE")
                          : (isTr ? "HESAP / KASA BAKİYESİ" : "BALANCE")}
                      </th>
                      <th className="py-2 px-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center w-20">{isTr ? "İŞLEM" : "ACTION"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredTransactions.map((t) => {
                      const sym = getCurrencySymbol(t.currency);
                      const isIncome = t.type === "income";
                      const dateStr = t.date ? new Date(t.date).toLocaleDateString(isTr ? "tr-TR" : "en-US", { year: "numeric", month: "2-digit", day: "2-digit" }) : "-";
                      const cleanPropTitle = t.property_title && t.property_title.trim() !== "-" ? t.property_title.trim() : null;
                      const isNegativeRunning = t.runningBalance < 0;

                      return (
                        <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2 px-2.5 whitespace-nowrap align-top">
                            <div className="font-medium text-slate-800">{dateStr}</div>
                            {t.reference_no && (
                              <div className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                                <Receipt className="w-2.5 h-2.5" />
                                <span>#{t.reference_no}</span>
                              </div>
                            )}
                          </td>

                          <td className="py-2 px-2.5 align-top">
                            <div className="space-y-0.5 max-w-sm">
                              <div className="font-semibold text-slate-800">{t.title}</div>
                              <div className="flex flex-wrap items-center gap-1">
                                {t.contact_name && (
                                  <span className="text-[10px] text-slate-600 bg-slate-100 rounded px-1.5 py-0.2 inline-flex items-center gap-0.5">
                                    <User className="w-2.5 h-2.5 text-slate-400" />
                                    {t.contact_name}
                                  </span>
                                )}
                                {isPortfolioSector && cleanPropTitle && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPropertyFilter(String(t.property_id))}
                                    className="text-[10px] text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded px-1.5 py-0.2 inline-flex items-center gap-0.5 truncate max-w-[200px] cursor-pointer"
                                    title={isTr ? "Bu portföyün kâr/zararını filtrele" : "Filter by property"}
                                  >
                                    <Building2 className="w-2.5 h-2.5 shrink-0" />
                                    {cleanPropTitle}
                                  </button>
                                )}
                              </div>
                              {t.description && (
                                <div className="text-[10px] text-slate-400 line-clamp-1">
                                  {t.description}
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="py-2 px-2.5 align-top whitespace-nowrap">
                            <div className="space-y-0.5">
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium whitespace-nowrap ${
                                t.category === "transfer"
                                  ? "bg-indigo-50 text-indigo-700"
                                  : isIncome ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                              }`}>
                                <span className={`w-1 h-1 rounded-full shrink-0 ${
                                  t.category === "transfer"
                                    ? "bg-indigo-500"
                                    : isIncome ? "bg-emerald-500" : "bg-rose-500"
                                }`}></span>
                                {getCategoryLabel(t.type, t.category)}
                              </span>

                              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                {normalizePaymentMethod(t.payment_method) === "bank_transfer" ? (
                                  <Landmark className="w-2.5 h-2.5 text-slate-400" />
                                ) : normalizePaymentMethod(t.payment_method) === "credit_card" ? (
                                  <CreditCard className="w-2.5 h-2.5 text-slate-400" />
                                ) : normalizePaymentMethod(t.payment_method) === "check_promissory" ? (
                                  <FileCheck2 className="w-2.5 h-2.5 text-slate-400" />
                                ) : normalizePaymentMethod(t.payment_method) === "marketplace_vault" ? (
                                  <Store className="w-2.5 h-2.5 text-amber-600" />
                                ) : (
                                  <Wallet className="w-2.5 h-2.5 text-slate-400" />
                                )}
                                <span className="truncate max-w-[160px]">{getResolvedAccountName(t)}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-2 px-2.5 text-center align-top whitespace-nowrap">
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium text-[10px]">
                              {t.currency}
                            </span>
                          </td>

                          <td className="py-2 px-2.5 text-right align-top whitespace-nowrap">
                            {isIncome ? (
                              <span className="font-semibold text-emerald-600">
                                +{sym}{Number(t.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-normal">—</span>
                            )}
                          </td>

                          <td className="py-2 px-2.5 text-right align-top whitespace-nowrap">
                            {!isIncome ? (
                              <span className="font-semibold text-rose-600">
                                -{sym}{Number(t.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-normal">—</span>
                            )}
                          </td>

                          <td className="py-2 px-2.5 text-right align-top whitespace-nowrap">
                            <span className={`font-semibold px-1.5 py-0.5 rounded ${
                              isNegativeRunning ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-800"
                            }`}>
                              {isNegativeRunning ? "-" : ""}{sym}{Math.abs(t.runningBalance).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </td>

                          <td className="py-2 px-2.5 text-center align-top whitespace-nowrap">
                            {confirmDeleteId === t.id ? (
                              <div className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 rounded p-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleDelete(t.id)}
                                  className="px-1 py-0.5 bg-rose-600 text-white rounded text-[10px] font-medium hover:bg-rose-700"
                                  title={isTr ? "Silmeyi Onayla" : "Confirm"}
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-1 py-0.5 text-slate-600 hover:bg-slate-200 rounded text-[10px]"
                                  title={isTr ? "İptal" : "Cancel"}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-0.5">
                                {isIncome && (
                                  <button
                                    type="button"
                                    onClick={() => handlePrintReceipt(t)}
                                    className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                    title={activeRealEstate ? (isTr ? "Resmi Komisyon Alım Belgesi (Makbuz) Yazdır" : "Print Commission Receipt") : (isTr ? "Tahsilat Makbuzu Yazdır" : "Print Collection Receipt")}
                                  >
                                    <FileText className="w-3 h-3 text-emerald-600" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(t)}
                                  className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                  title={isTr ? "Düzenle" : "Edit"}
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(t.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                  title={isTr ? "Sil" : "Delete"}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Statement Summary Footer per Currency */}
                  <tfoot className="bg-slate-900 text-white">
                    {Object.entries(filteredTotalsByCurrency).map(([cur, tot]) => {
                      const sym = getCurrencySymbol(cur);
                      const isAccountScope = selectedAccountId !== "all" && Boolean(statementAnalysis.summaryByAccount[selectedAccountId]);
                      const isCashScope = cashVaultFilter !== "all" || (methodFilter === "cash" && selectedAccountId === "all");
                      const selectedAccSummary = isAccountScope ? statementAnalysis.summaryByAccount[selectedAccountId] : null;
                      const closingBal = selectedAccSummary && selectedAccSummary.currency === cur
                        ? selectedAccSummary.closingBalance
                        : isCashScope
                        ? (statementAnalysis.summaryByCurrency[cur]?.closingBalance ?? tot.net)
                        : tot.net;
                      return (
                        <tr key={`foot-${cur}`} className="border-t border-slate-800 text-[11px]">
                          <td colSpan={3} className="py-2 px-2.5 font-medium text-slate-300">
                            {cur} {isTr ? "Dönem Toplamı" : "Total"} ({tot.count} {isTr ? "işlem" : "tx"})
                          </td>
                          <td className="py-2 px-2.5 text-center font-medium text-indigo-300">{cur}</td>
                          <td className="py-2 px-2.5 text-right font-semibold text-emerald-400">
                            +{sym}{tot.income.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-2.5 text-right font-semibold text-rose-400">
                            -{sym}{tot.expense.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-2.5 text-right font-semibold text-white">
                            {closingBal < 0 ? "-" : ""}{sym}{Math.abs(closingBal).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-2.5"></td>
                        </tr>
                      );
                    })}
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* VIEW TAB 2: KAMBİYO SENETLERİ & ÇEK PORTFÖYÜ */}
      {viewTab === "checks_notes" && (
        <div className="space-y-2.5">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight block">
                {isTr ? "Portföydeki Alacak Çek/Senet" : "Receivable in Portfolio"}
              </span>
              <div className="text-sm font-semibold text-emerald-700 mt-0.5 truncate">
                {checksKpis.receivedLabel}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {isTr ? "Tahsil bekleyen müşteri evrakları" : "Pending customer instruments"}
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight block">
                {isTr ? "Portföydeki Borç Çek/Senet" : "Payable in Portfolio"}
              </span>
              <div className="text-sm font-semibold text-rose-700 mt-0.5 truncate">
                {checksKpis.issuedLabel}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {isTr ? "Ödeme bekleyen keşide evrakları" : "Pending issued instruments"}
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight block">
                {isTr ? "Yaklaşan / Vadesi Geçmiş (7 Gün)" : "Due Soon / Overdue"}
              </span>
              <div className={`text-sm font-semibold mt-0.5 ${checksKpis.upcomingDueCount > 0 ? "text-amber-600" : "text-slate-800"}`}>
                {checksKpis.upcomingDueCount} {isTr ? "Evrak" : "Items"}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {checksKpis.portfolioCount} {isTr ? "toplam portföyde" : "in portfolio"}
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight block">
                {isTr ? "Tahsil / Ödeme Tamamlanan" : "Settled Volume"}
              </span>
              <div className="text-sm font-semibold text-indigo-700 mt-0.5 truncate">
                {checksKpis.settledLabel}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {isTr ? "Kasa & bankaya aktarılan toplam" : "Synced to cash/bank"}
              </div>
            </div>
          </div>

          {/* Filter & Action Toolbar */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <select
                value={checkDirectionFilter}
                onChange={(e) => setCheckDirectionFilter(e.target.value as any)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700"
              >
                <option value="all">{isTr ? "Yön: Tümü" : "Direction: All"}</option>
                <option value="received">{isTr ? "Alınan (Müşteri)" : "Received"}</option>
                <option value="issued">{isTr ? "Verilen (Borç)" : "Issued"}</option>
              </select>

              <select
                value={checkInstrumentFilter}
                onChange={(e) => setCheckInstrumentFilter(e.target.value as any)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700"
              >
                <option value="all">{isTr ? "Tür: Tümü" : "Type: All"}</option>
                <option value="check">{isTr ? "Çek" : "Check"}</option>
                <option value="promissory_note">{isTr ? "Kambiyo Senedi" : "Promissory Note"}</option>
              </select>

              <select
                value={checkStatusFilter}
                onChange={(e) => setCheckStatusFilter(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700"
              >
                <option value="all">{isTr ? "Durum: Tümü" : "Status: All"}</option>
                <option value="portfolio">{isTr ? "Portföyde" : "Portfolio"}</option>
                <option value="collected">{isTr ? "Tahsil Edildi" : "Collected"}</option>
                <option value="paid">{isTr ? "Ödendi" : "Paid"}</option>
                <option value="endorsed">{isTr ? "Ciro Edildi" : "Endorsed"}</option>
                <option value="bounced">{isTr ? "Karşılıksız" : "Bounced"}</option>
                <option value="cancelled">{isTr ? "İptal" : "Cancelled"}</option>
              </select>

              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-0.5">
                <input
                  type="date"
                  value={checkStartDate}
                  onChange={(e) => setCheckStartDate(e.target.value)}
                  className="bg-transparent text-[11px] text-slate-700 w-24 focus:outline-none"
                  title={isTr ? "Vade Başlangıç" : "Due From"}
                />
                <span className="text-slate-300">-</span>
                <input
                  type="date"
                  value={checkEndDate}
                  onChange={(e) => setCheckEndDate(e.target.value)}
                  className="bg-transparent text-[11px] text-slate-700 w-24 focus:outline-none"
                  title={isTr ? "Vade Bitiş" : "Due To"}
                />
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={checkSearchQuery}
                  onChange={(e) => setCheckSearchQuery(e.target.value)}
                  placeholder={isTr ? "Evrak no, cari, banka ara..." : "Search doc, party..."}
                  className="pl-7 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-800 w-44 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrintChecks}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 cursor-pointer"
                title={isTr ? "Çek / Senet Ekstresi Yazdır / PDF" : "Print PDF"}
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>PDF</span>
              </button>
              <button
                type="button"
                onClick={handleExportChecksExcel}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                title={isTr ? "Excel Olarak İndir" : "Export Excel"}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
              <button
                type="button"
                onClick={handleOpenCreateCheck}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isTr ? "Yeni Çek / Senet" : "New Check / Note"}</span>
              </button>
            </div>
          </div>

          {/* Checks & Notes Table */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 shadow-xs overflow-x-auto">
            {loadingChecks ? (
              <div className="py-10 text-center text-slate-400 text-xs">{isTr ? "Yükleniyor..." : "Loading..."}</div>
            ) : filteredChecksNotes.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                {isTr ? "Kayıtlı çek veya kambiyo senedi bulunamadı. Faturalardan, Cari Hesaplardan veya 'Yeni Çek / Senet' butonundan ekleyebilirsiniz." : "No checks or promissory notes found."}
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[820px] text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="py-2 px-2.5 text-[10px] font-semibold text-slate-500 uppercase">{isTr ? "Vade" : "Due Date"}</th>
                    <th className="py-2 px-2.5 text-[10px] font-semibold text-slate-500 uppercase">{isTr ? "Evrak / No" : "Instrument / No"}</th>
                    <th className="py-2 px-2.5 text-[10px] font-semibold text-slate-500 uppercase">{isTr ? "Yön" : "Dir"}</th>
                    <th className="py-2 px-2.5 text-[10px] font-semibold text-slate-500 uppercase">{isTr ? "Cari / İlgili" : "Party"}</th>
                    <th className="py-2 px-2.5 text-[10px] font-semibold text-slate-500 uppercase">{isTr ? "Banka / Keşideci" : "Bank"}</th>
                    <th className="py-2 px-2.5 text-[10px] font-semibold text-slate-500 uppercase text-right">{isTr ? "Tutar" : "Amount"}</th>
                    <th className="py-2 px-2.5 text-[10px] font-semibold text-slate-500 uppercase text-center">{isTr ? "Durum" : "Status"}</th>
                    <th className="py-2 px-2.5 text-[10px] font-semibold text-slate-500 uppercase">{isTr ? "Tahsil / Ödeme Hesabı" : "Account"}</th>
                    <th className="py-2 px-2.5 text-[10px] font-semibold text-slate-500 uppercase text-center">{isTr ? "İşlem" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredChecksNotes.map((cn: any) => {
                    const isOverdue = cn.status === "portfolio" && cn.due_date && new Date(cn.due_date) < new Date(new Date().toISOString().split("T")[0]);
                    const statusBadgeMap: Record<string, { label: string; cls: string }> = {
                      portfolio: { label: isTr ? "Portföyde" : "Portfolio", cls: "bg-amber-50 text-amber-800 border-amber-200" },
                      collected: { label: isTr ? "Tahsil Edildi" : "Collected", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                      paid: { label: isTr ? "Ödendi" : "Paid", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                      endorsed: { label: isTr ? "Ciro Edildi" : "Endorsed", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
                      bounced: { label: isTr ? "Karşılıksız" : "Bounced", cls: "bg-rose-50 text-rose-700 border-rose-200" },
                      cancelled: { label: isTr ? "İptal" : "Cancelled", cls: "bg-slate-100 text-slate-500 border-slate-200" }
                    };
                    const st = statusBadgeMap[cn.status] || statusBadgeMap.portfolio;

                    return (
                      <tr key={cn.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2 px-2.5 whitespace-nowrap font-medium">
                          <span className={isOverdue ? "text-rose-600 font-semibold" : "text-slate-700"}>
                            {cn.due_date ? new Date(cn.due_date).toLocaleDateString("tr-TR") : "-"}
                          </span>
                          {isOverdue && (
                            <span className="block text-[9px] text-rose-600 font-semibold">{isTr ? "Vadesi Geçti" : "Overdue"}</span>
                          )}
                        </td>
                        <td className="py-2 px-2.5 whitespace-nowrap">
                          <span className="font-semibold text-slate-800">{cn.document_no}</span>
                          <span className="block text-[10px] text-slate-500">
                            {cn.instrument_type === "promissory_note" ? (isTr ? "Kambiyo Senedi" : "Note") : (isTr ? "Çek" : "Check")}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                            cn.direction === "received"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}>
                            {cn.direction === "received" ? (isTr ? "Alınan" : "Received") : (isTr ? "Verilen" : "Issued")}
                          </span>
                        </td>
                        <td className="py-2 px-2.5">
                          <span className="font-medium text-slate-800">{cn.company_title || cn.contact_name || "-"}</span>
                          {cn.source_type && cn.source_type !== "manual" && (
                            <span className="block text-[9px] text-indigo-600">
                              {cn.source_type === "sales_invoice" ? (isTr ? "Satış Faturasından" : "From Sales Inv.") :
                               cn.source_type === "purchase_invoice" ? (isTr ? "Alış Faturasından" : "From Purchase Inv.") :
                               (isTr ? "Cari İşlemden" : "From Ledger")}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2.5 text-slate-600">
                          <div>{cn.bank_name || "-"}</div>
                          {cn.drawer_name && <div className="text-[10px] text-slate-400">{cn.drawer_name}</div>}
                        </td>
                        <td className="py-2 px-2.5 text-right whitespace-nowrap font-semibold text-slate-900">
                          {formatMoney(cn.amount, cn.currency)} <span className="text-[10px] text-slate-400">{cn.currency}</span>
                        </td>
                        <td className="py-2 px-2.5 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${st.cls}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-[11px] text-slate-600">
                          {cn.collection_account_name ? (
                            <span className="font-medium text-indigo-700">{cn.collection_account_name}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-2 px-2.5 text-center whitespace-nowrap">
                          {confirmDeleteCheckId === cn.id ? (
                            <div className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 rounded p-0.5">
                              <button
                                type="button"
                                onClick={() => handleDeleteCheck(cn.id)}
                                className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[10px] font-medium cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteCheckId(null)}
                                className="px-1.5 py-0.5 text-slate-600 rounded text-[10px] cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1">
                              {cn.status === "portfolio" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSettlingCheck(cn);
                                    setSettleAccountId("");
                                    setSettleAccountName(`${(cn.currency || "TRY").toUpperCase()} Nakit Kasa`);
                                    setSettleDate(new Date().toISOString().split("T")[0]);
                                    setSettleNotes(cn.notes || "");
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold text-white cursor-pointer ${
                                    cn.direction === "received"
                                      ? "bg-emerald-600 hover:bg-emerald-700"
                                      : "bg-indigo-600 hover:bg-indigo-700"
                                  }`}
                                >
                                  {cn.direction === "received" ? (isTr ? "Tahsil Et" : "Collect") : (isTr ? "Öde" : "Pay")}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleOpenEditCheck(cn)}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer"
                                title={isTr ? "Düzenle" : "Edit"}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteCheckId(cn.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                title={isTr ? "Sil" : "Delete"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* VIEW TAB 3: DEDICATED PORTFÖY KÂR / ZARAR ANALİZİ (PORTFOLIO P&L DASHBOARD) */}
      {viewTab === "portfolio_profit" && (
        <div className="space-y-2.5">
          {/* Top KPI Cards for Portfolio Profit & Loss */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight block">
                {isTr ? `Toplam Portföy Gelirleri (${storeDefaultCurrency})` : `Total Portfolio Income (${storeDefaultCurrency})`}
              </span>
              <div className="text-sm font-semibold text-emerald-600 mt-0.5">
                +{getCurrencySymbol(storeDefaultCurrency)}{portfolioAnalysis.totalIncome.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {portfolioAnalysis.activeWithTxs.length} {isTr ? "hareket gören ilan" : "active listings"}
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight block">
                {isTr ? `Toplam Masraf & Giderler (${storeDefaultCurrency})` : `Total Portfolio Expenses (${storeDefaultCurrency})`}
              </span>
              <div className="text-sm font-semibold text-rose-600 mt-0.5">
                -{getCurrencySymbol(storeDefaultCurrency)}{portfolioAnalysis.totalExpense.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {isTr ? "Çapraz kur dönüşümlü toplam" : "Cross-currency converted total"}
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight block">
                {isTr ? `Net Portföy Kârı (${storeDefaultCurrency})` : `Net Portfolio Profit (${storeDefaultCurrency})`}
              </span>
              <div className={`text-sm font-semibold mt-0.5 ${
                portfolioAnalysis.totalNet >= 0 ? "text-emerald-700" : "text-rose-700"
              }`}>
                {portfolioAnalysis.totalNet < 0 ? "-" : "+"}{getCurrencySymbol(storeDefaultCurrency)}{Math.abs(portfolioAnalysis.totalNet).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {portfolioAnalysis.totalNet >= 0 ? (isTr ? "🟢 Genel Portföy Kârda" : "Overall Profitable") : (isTr ? "🔴 Masraf Ağırlıklı" : "Net Loss")}
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight block">
                {isTr ? "Kârlı Portföy Oranı" : "Profitable Ratio"}
              </span>
              <div className="text-sm font-semibold text-slate-800 mt-0.5">
                {portfolioAnalysis.profitableCount} / {portfolioAnalysis.activeWithTxs.length || 1}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {portfolioAnalysis.lossCount > 0 ? `${portfolioAnalysis.lossCount} ${isTr ? "ilan masraf/zararda" : "in loss"}` : (isTr ? "Tüm aktifler kârda" : "All profitable")}
              </div>
            </div>
          </div>

          {/* Filter Bar for Portfolio P&L Table */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1">
              {[
                { id: "all", label: isTr ? "Portföyler" : "All" },
                { id: "profit", label: isTr ? "🟢 Kârda" : "Profitable" },
                { id: "loss", label: isTr ? "🔴 Zararda" : "In Loss" },
                { id: "no_activity", label: isTr ? "⚪ Hareketsiz" : "No Activity" }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setPortfolioProfitFilter(f.id as any)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                    portfolioProfitFilter === f.id
                      ? "bg-indigo-600 text-white font-semibold shadow-2xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={isTr ? "Portföy ara (başlık, ref no, bölge)..." : "Search portfolio..."}
                value={profitTabSearch}
                onChange={(e) => setProfitTabSearch(e.target.value)}
                className="pl-8 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-52 font-medium"
              />
            </div>
          </div>

          {/* Portfolio P&L Listing Table */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs">
            <div className="overflow-x-auto">
              {displayedPortfolioProfitList.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">
                  {isTr ? "Kriterlere uygun portföy bulunamadı." : "No properties found."}
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[760px] text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70">
                      <th className="py-2 px-2.5 text-[10px] font-semibold text-slate-500 uppercase">{isTr ? "PORTFÖY / İLAN" : "PROPERTY"}</th>
                      <th className="py-2 px-2.5 text-[10px] font-semibold text-slate-500 uppercase text-right">{isTr ? "LİSTE DEĞERİ" : "VALUE"}</th>
                      <th className="py-2 px-2.5 text-[10px] font-semibold text-emerald-700 uppercase text-right">{isTr ? "TOPLAM GELİR (+)" : "INCOME (+)"}</th>
                      <th className="py-2 px-2.5 text-[10px] font-semibold text-rose-700 uppercase text-right">{isTr ? "TOPLAM MASRAF (-)" : "EXPENSES (-)"}</th>
                      <th className="py-2 px-2.5 text-[10px] font-semibold text-slate-700 uppercase text-right">{isTr ? "NET KÂR / ZARAR" : "NET P&L"}</th>
                      <th className="py-2 px-2.5 text-[10px] font-semibold text-slate-500 uppercase text-center">{isTr ? "DURUM" : "STATUS"}</th>
                      <th className="py-2 px-2.5 text-[10px] font-semibold text-slate-500 uppercase text-center w-28">{isTr ? "AKSİYON" : "ACTION"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedPortfolioProfitList.map((item) => {
                      const sym = getCurrencySymbol(item.currency);
                      const isProfit = item.net >= 0;
                      const hasActivity = item.txCount > 0;

                      return (
                        <tr key={item.property.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2 px-2.5 align-top">
                            <div className="flex items-start gap-2">
                              {item.property.images && item.property.images[0] ? (
                                <img
                                  src={item.property.images[0]}
                                  alt=""
                                  className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                  <Building2 className="w-4 h-4" />
                                </div>
                              )}
                              <div className="space-y-0.5">
                                <div className="font-semibold text-slate-800 line-clamp-1 max-w-sm">
                                  {item.property.title}
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                                  {item.property.reference_no && (
                                    <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-slate-600">
                                      #{item.property.reference_no}
                                    </span>
                                  )}
                                  {item.property.kktc_region && (
                                    <span>{item.property.kktc_region}</span>
                                  )}
                                  <span>• {item.txCount} {isTr ? "hareket" : "records"}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-2 px-2.5 text-right font-medium text-slate-700 align-top whitespace-nowrap">
                            {item.property.price ? formatMoney(item.property.price, item.currency) : "-"}
                          </td>

                          <td className="py-2 px-2.5 text-right font-semibold text-emerald-600 align-top whitespace-nowrap">
                            +{sym}{item.income.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </td>

                          <td className="py-2 px-2.5 text-right font-semibold text-rose-600 align-top whitespace-nowrap">
                            -{sym}{item.expense.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </td>

                          <td className="py-2 px-2.5 text-right font-semibold align-top whitespace-nowrap">
                            <span className={isProfit ? "text-emerald-700" : "text-rose-700"}>
                              {item.net < 0 ? "-" : "+"}{sym}{Math.abs(item.net).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                            </span>
                          </td>

                          <td className="py-2 px-2.5 text-center align-top whitespace-nowrap">
                            {!hasActivity ? (
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-500">
                                {isTr ? "Hareket Yok" : "No Activity"}
                              </span>
                            ) : isProfit ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {isTr ? "🟢 KÂRDA" : "PROFIT"}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                {isTr ? "🔴 ZARARDA" : "LOSS"}
                              </span>
                            )}
                          </td>

                          <td className="py-2 px-2.5 text-center align-top whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPropertyFilter(String(item.property.id));
                                  setViewTab("statement");
                                }}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-medium transition-colors cursor-pointer"
                                title={isTr ? "Bu portföyün ekstre hareketlerini listele" : "View statement"}
                              >
                                {isTr ? "Ekstre" : "Ledger"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenCreateModal(item.property.id)}
                                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[10px] font-medium transition-colors cursor-pointer"
                                title={isTr ? "Bu portföye gelir/masraf kaydet" : "Add entry"}
                              >
                                + {isTr ? "Kayıt" : "Add"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. Bank Accounts & Credit Cards Definition Modal */}
      <AnimatePresence>
        {showAccountsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="bg-white rounded-xl w-full max-w-2xl p-4 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-3.5 text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-semibold text-slate-800">
                    {isTr ? "Banka Hesapları & Kredi Kartı Tanımlamaları" : "Bank & Card Accounts Management"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAccountsModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Account Form */}
              <form onSubmit={handleSaveAccount} className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2.5">
                <div className="font-semibold text-slate-700 text-xs flex items-center justify-between">
                  <span>{editingAccount ? (isTr ? "Hesabı Düzenle" : "Edit Account") : (isTr ? "Yeni Hesap / Kart Tanımla" : "Define New Account")}</span>
                  {editingAccount && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAccount(null);
                        setAccountFormData({
                          account_type: "bank",
                          account_name: "",
                          bank_name: "",
                          account_number: "",
                          currency: "TRY",
                          initial_balance: "0"
                        });
                      }}
                      className="text-[11px] text-slate-500 hover:underline cursor-pointer"
                    >
                      {isTr ? "Yeni Ekleme Moduna Dön" : "Switch to Add New"}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">
                      {isTr ? "Hesap Türü *" : "Account Type *"}
                    </label>
                    <select
                      value={accountFormData.account_type}
                      onChange={(e) => setAccountFormData(p => ({ ...p, account_type: e.target.value as any }))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                    >
                      <option value="bank">{isTr ? "Banka Hesabı" : "Bank Account"}</option>
                      <option value="credit_card">{isTr ? "Kredi Kartı" : "Credit Card"}</option>
                      <option value="cash">{isTr ? "Nakit Kasa" : "Cash Vault"}</option>
                      <option value="check">{isTr ? "Çek / Senet Portföyü" : "Check / Note"}</option>
                      {isShopLPSector && (
                        <option value="marketplace">{isTr ? "Pazaryeri Kasası" : "Marketplace Vault"}</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">
                      {isTr ? "Hesap / Kart Adı *" : "Account Name *"}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={isTr ? "Örn: İş Bankası Ticari TRY" : "e.g. Business Checking"}
                      value={accountFormData.account_name}
                      onChange={(e) => setAccountFormData(p => ({ ...p, account_name: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">
                      {isTr ? "Para Birimi *" : "Currency *"}
                    </label>
                    <select
                      value={accountFormData.currency}
                      onChange={(e) => setAccountFormData(p => ({ ...p, currency: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                    >
                      <option value="TRY">TRY (₺)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">
                      {isTr ? "Banka Adı (İsteğe Bağlı)" : "Bank Name"}
                    </label>
                    <input
                      type="text"
                      placeholder={isTr ? "Örn: İş Bankası, Garanti..." : "e.g. Chase, Barclays"}
                      value={accountFormData.bank_name}
                      onChange={(e) => setAccountFormData(p => ({ ...p, bank_name: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">
                      {accountFormData.account_type === "credit_card" ? (isTr ? "Son 4 Hane" : "Last 4 Digits") : (isTr ? "IBAN / Hesap No" : "IBAN / Account No")}
                    </label>
                    <input
                      type="text"
                      placeholder={accountFormData.account_type === "credit_card" ? "Örn: 4128" : "TR..."}
                      value={accountFormData.account_number}
                      onChange={(e) => setAccountFormData(p => ({ ...p, account_number: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">
                      {isTr ? "Açılış / Devir Bakiye" : "Opening Balance"}
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={accountFormData.initial_balance}
                      onChange={(e) => setAccountFormData(p => ({ ...p, initial_balance: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-xs shadow-2xs cursor-pointer"
                  >
                    {editingAccount ? (isTr ? "Değişiklikleri Kaydet" : "Update") : (isTr ? "Hesabı Tanımla" : "Save Account")}
                  </button>
                </div>
              </form>

              {/* Defined Accounts List */}
              <div className="space-y-1.5">
                <div className="font-semibold text-slate-700 text-xs">
                  {isTr ? "Tanımlı Hesaplar & Kartlar" : "Defined Accounts"} ({accounts.length})
                </div>

                {loadingAccounts ? (
                  <div className="py-6 text-center text-slate-400 text-xs">{isTr ? "Yükleniyor..." : "Loading..."}</div>
                ) : accounts.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                    {isTr ? "Henüz tanımlı banka hesabı veya kredi kartı bulunmuyor." : "No defined bank or card accounts yet."}
                  </div>
                ) : (
                  <div className="space-y-1 max-h-56 overflow-y-auto">
                    {accounts.map(acc => (
                      <div
                        key={acc.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/70 hover:bg-slate-100/70 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {acc.account_type === "credit_card" ? (
                            <CreditCard className="w-4 h-4 text-indigo-500 shrink-0" />
                          ) : acc.account_type === "marketplace" ? (
                            <Store className="w-4 h-4 text-amber-600 shrink-0" />
                          ) : (
                            <Landmark className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          <div>
                            <div className="font-semibold text-slate-800">
                              {acc.account_name}
                              <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] bg-white border border-slate-200 text-slate-600 font-medium">
                                {acc.currency}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {acc.bank_name ? `${acc.bank_name} • ` : ""}
                              {acc.account_number ? `${acc.account_number} • ` : ""}
                              {isTr ? "Açılış:" : "Initial:"} {formatMoney(acc.initial_balance, acc.currency)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenAccountStatement({ accountId: acc.id, label: acc.account_name })}
                            className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded cursor-pointer flex items-center gap-0.5"
                            title={isTr ? "Hesap Ekstresini Gör" : "View Statement"}
                          >
                            <FileText className="w-3 h-3" />
                            <span>{isTr ? "Ekstre" : "Stmt"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAccount(acc);
                              setAccountFormData({
                                account_type: acc.account_type,
                                account_name: acc.account_name,
                                bank_name: acc.bank_name || "",
                                account_number: acc.account_number || "",
                                currency: acc.currency,
                                initial_balance: String(acc.initial_balance || 0)
                              });
                            }}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded cursor-pointer"
                            title={isTr ? "Düzenle" : "Edit"}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAccount(acc.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                            title={isTr ? "Sil" : "Delete"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. Add / Edit Transaction Modal with Real-Time Portfolio P&L Preview */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="bg-white rounded-xl w-full max-w-lg p-4 shadow-xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-3 text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-indigo-600" />
                  {editingTx 
                    ? (isTr ? "Finansal Kaydı Düzenle" : "Edit Record")
                    : (isTr ? "Yeni Gelir / Gider Kaydı" : "New Financial Record")}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingTx(null);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Type Selection */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const defaultCat = categories.income[0]?.id || "other";
                      setFormData(prev => ({ ...prev, type: "income", category: defaultCat }));
                    }}
                    className={`py-2 px-3 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
                      formData.type === "income"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{isTr ? "GELİR GİRİŞİ (+)" : "INCOME (+)"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const defaultCat = categories.expense[0]?.id || "other";
                      setFormData(prev => ({ ...prev, type: "expense", category: defaultCat }));
                    }}
                    className={`py-2 px-3 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
                      formData.type === "expense"
                        ? "bg-rose-600 text-white border-rose-600 shadow-2xs font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>{isTr ? "GİDER ÇIKIŞI (-)" : "EXPENSE (-)"}</span>
                  </button>
                </div>

                {/* Title & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-8">
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">
                      {isTr ? "İşlem Başlığı *" : "Title *"}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={
                        formData.type === "income"
                          ? (isHorecaSector ? (isTr ? "Örn: Günlük Adisyon / Kasa Satışı" : "Daily POS Sales")
                            : isCorporateSector ? (isTr ? "Örn: Proje / Hizmet Tahsilatı" : "Service Revenue")
                            : activeAutomotive ? (isTr ? "Örn: Araç Satış Bedeli" : "Vehicle Sale")
                            : activeRealEstate ? (isTr ? "Örn: Satış Komisyonu" : "Commission")
                            : (isTr ? "Örn: Günlük Mağaza Satış Tahsilatı" : "Daily Store Sales"))
                          : (isHorecaSector ? (isTr ? "Örn: Mutfak & İçecek Alımı / Kira" : "Kitchen Supplies / Rent")
                            : isCorporateSector ? (isTr ? "Örn: Ofis Kirası / Tedarikçi Ödemesi" : "Office Rent / Vendor")
                            : activeAutomotive ? (isTr ? "Örn: Araç Bakım / Ekspertiz" : "Vehicle Maintenance")
                            : activeRealEstate ? (isTr ? "Örn: Ofis Kirası / İlan Bedeli" : "Listing Fee")
                            : (isTr ? "Örn: Tedarikçi Ödemesi / Kargo" : "Supplier Payment / Shipping"))
                      }
                      value={formData.title}
                      onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-xs text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">
                      {isTr ? "Tarih *" : "Date *"}
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-xs text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Amount + Currency + Payment Method */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-5">
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">
                      {isTr ? "Tutar *" : "Amount *"}
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) => setFormData(p => ({ ...p, amount: e.target.value }))}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-l-lg font-semibold text-xs text-slate-900 focus:outline-none"
                      />
                      <select
                        value={formData.currency}
                        onChange={(e) => {
                          const newCur = e.target.value;
                          setFormData(p => ({
                            ...p,
                            currency: newCur,
                            account_name: p.payment_method === "cash" && !p.account_id
                              ? `${newCur} Nakit Kasa`
                              : p.account_name
                          }));
                        }}
                        className="w-20 shrink-0 px-2 py-1.5 bg-slate-900 text-white border border-slate-900 rounded-r-lg font-medium text-xs focus:outline-none cursor-pointer"
                      >
                        <option value="GBP">GBP (£)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                        <option value="TRY">TRY (₺)</option>
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-4 relative" data-dropdown-root>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">
                      {isTr ? "Kategori" : "Category"}
                    </label>
                    <button
                      type="button"
                      onClick={() => setOpenDropdown(prev => prev === "modal_category" ? null : "modal_category")}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-xs text-slate-800 flex items-center justify-between gap-1 cursor-pointer"
                    >
                      <span className="truncate text-[11px]">
                        {categories[formData.type].find(c => c.id === formData.category)?.label || formData.category}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>
                    {openDropdown === "modal_category" && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-1 max-h-56 overflow-y-auto">
                        {categories[formData.type].map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setFormData(p => ({ ...p, category: cat.id }));
                              setOpenDropdown(null);
                            }}
                            className={`w-full text-left px-2 py-1.5 rounded-lg text-[10.5px] sm:text-[11px] leading-tight font-medium whitespace-nowrap truncate transition-colors cursor-pointer ${
                              formData.category === cat.id
                                ? "bg-indigo-600 text-white font-semibold"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">
                      {isTr ? "Ödeme Tipi" : "Method"}
                    </label>
                    <select
                      value={formData.payment_method}
                      onChange={(e) => {
                        const m = e.target.value;
                        setFormData(p => ({
                          ...p,
                          payment_method: m,
                          account_id: "",
                          account_name: m === "cash" ? `${p.currency} Nakit Kasa` : ""
                        }));
                      }}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-xs text-slate-800 focus:outline-none cursor-pointer"
                    >
                      {paymentMethods.map(pm => (
                        <option key={pm.id} value={pm.id}>{pm.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Specific Bank Account or Card Selection */}
                {formData.payment_method === "bank_transfer" && (
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-medium text-indigo-800 uppercase block">
                        {isTr ? "Banka Hesabı Seçin" : "Select Bank Account"}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddModal(false);
                          setShowAccountsModal(true);
                        }}
                        className="text-[10px] text-indigo-600 hover:underline cursor-pointer"
                      >
                        + {isTr ? "Yeni Banka Hesabı Tanımla" : "Add Bank Account"}
                      </button>
                    </div>
                    <select
                      value={formData.account_id}
                      onChange={(e) => {
                        const id = e.target.value;
                        const acc = accounts.find(a => String(a.id) === id);
                        setFormData(p => ({
                          ...p,
                          account_id: id,
                          account_name: acc ? acc.account_name : "",
                          currency: acc ? acc.currency : p.currency
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg font-medium text-xs text-slate-800 cursor-pointer"
                    >
                      <option value="">{isTr ? "— Genel Banka Hesabı —" : "— General Bank —"}</option>
                      {accounts.filter(a => a.account_type === "bank").map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.account_name} ({acc.bank_name || ""} - {acc.currency})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.payment_method === "credit_card" && (
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-medium text-indigo-800 uppercase block">
                        {isTr ? "Kredi Kartı Seçin" : "Select Credit Card"}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddModal(false);
                          setShowAccountsModal(true);
                        }}
                        className="text-[10px] text-indigo-600 hover:underline cursor-pointer"
                      >
                        + {isTr ? "Yeni Kredi Kartı Tanımla" : "Add Card"}
                      </button>
                    </div>
                    <select
                      value={formData.account_id}
                      onChange={(e) => {
                        const id = e.target.value;
                        const acc = accounts.find(a => String(a.id) === id);
                        setFormData(p => ({
                          ...p,
                          account_id: id,
                          account_name: acc ? acc.account_name : "",
                          currency: acc ? acc.currency : p.currency
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg font-medium text-xs text-slate-800 cursor-pointer"
                    >
                      <option value="">{isTr ? "— Şirket Kredi Kartı —" : "— Company Card —"}</option>
                      {accounts.filter(a => a.account_type === "credit_card").map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.account_name} ({acc.bank_name || ""} {acc.account_number ? `****${acc.account_number}` : ""} - {acc.currency})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {isShopLPSector && formData.payment_method === "marketplace_vault" && (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-medium text-amber-900 uppercase block">
                        {isTr ? "Pazaryeri Kasası Seçin" : "Select Marketplace Vault"}
                      </label>
                    </div>
                    <select
                      value={formData.account_id}
                      onChange={(e) => {
                        const id = e.target.value;
                        const acc = accounts.find(a => String(a.id) === id);
                        setFormData(p => ({
                          ...p,
                          account_id: id,
                          account_name: acc ? acc.account_name : "",
                          currency: acc ? acc.currency : p.currency
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-200 rounded-lg font-medium text-xs text-slate-800 cursor-pointer"
                    >
                      <option value="">{isTr ? "— Pazaryeri Kasası Seçin —" : "— Select Marketplace Vault —"}</option>
                      {accounts.filter(a => a.account_type === "marketplace").map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.account_name} ({acc.currency})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Contact Name & Ref No */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-8">
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">
                      {isTr ? "İlgili Kişi / Kurum (İsteğe Bağlı)" : "Contact / Client"}
                    </label>
                    <input
                      type="text"
                      placeholder={isTr ? "Örn: Ahmet Yılmaz" : "John Doe"}
                      value={formData.contact_name}
                      onChange={(e) => setFormData(p => ({ ...p, contact_name: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-xs text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">
                      {isTr ? "Belge / Makbuz No" : "Ref / Receipt No"}
                    </label>
                    <input
                      type="text"
                      placeholder={isTr ? "Örn: MKB-01" : "REC-01"}
                      value={formData.reference_no}
                      onChange={(e) => setFormData(p => ({ ...p, reference_no: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-xs text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Linked Portfolio Property with Real-Time P&L Status Indicator (Only Portfolio Sectors) */}
                {isPortfolioSector && (
                <div className="space-y-1 relative" data-dropdown-root>
                  <label className="text-[10px] font-medium text-slate-500 uppercase block">
                    {isTr ? `İlişkili ${activeAutomotive ? "Araç" : "Emlak İlanı"} (Kâr / Zarar Bağlantısı)` : "Linked Listing (P&L Tracking)"}
                  </label>
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(prev => prev === "modal_property" ? null : "modal_property")}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-xs text-slate-700 flex items-center justify-between gap-2 text-left cursor-pointer"
                  >
                    <span className="line-clamp-2 text-[11px] leading-snug">
                      {!formData.property_id
                        ? (isTr ? "— İlişkili Portföy Yok (Genel Kasa Kaydı) —" : "— None (General Cash) —")
                        : (() => {
                            const found = filteredPortfolioItems.find(item => String(item.id) === String(formData.property_id)) || properties.find(item => String(item.id) === String(formData.property_id));
                            if (!found) return isTr ? "Seçili Portföy" : "Selected Listing";
                            return activeAutomotive
                              ? `${found.plate || ""} - ${found.brand || ""} ${found.model || ""}`
                              : `${found.reference_no ? `#${found.reference_no} • ` : ""}${found.title}`;
                          })()}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>

                  {openDropdown === "modal_property" && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-1 max-h-56 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(p => ({ ...p, property_id: "" }));
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                          !formData.property_id ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {isTr ? "— İlişkili Portföy Yok (Genel Kasa Kaydı) —" : "— None (General Cash) —"}
                      </button>
                      {filteredPortfolioItems.map(item => {
                        const isSel = String(formData.property_id) === String(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              const propId = String(item.id);
                              setFormData(p => ({
                                ...p,
                                property_id: propId
                              }));
                              setOpenDropdown(null);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer border-t border-slate-50 ${
                              isSel ? "bg-indigo-600 text-white" : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <div className="line-clamp-2 text-[11px] leading-snug font-medium break-words">
                              {activeAutomotive ? (
                                `${item.plate || ""} - ${item.brand || ""} ${item.model || ""}`
                              ) : (
                                <>
                                  {item.reference_no ? (
                                    <span className={`font-mono font-semibold mr-1 ${isSel ? "text-indigo-200" : "text-indigo-600"}`}>
                                      #{item.reference_no}
                                    </span>
                                  ) : null}
                                  {item.title}
                                </>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Real-Time Live Portfolio Profit/Loss Status Preview (With Cross-Currency Conversion) */}
                  {formData.property_id && (() => {
                    const currentPropData = portfolioAnalysis.propertyMap[String(formData.property_id)];
                    if (!currentPropData) return null;
                    const propCurr = (currentPropData.currency || storeDefaultCurrency || "GBP").toUpperCase();
                    const sym = getCurrencySymbol(propCurr);
                    const enteredRawAmt = Number(String(formData.amount).replace(/,/g, ".")) || 0;
                    const enteredConvertedAmt = convertPortfolioCurrency(enteredRawAmt, formData.currency, propCurr);

                    let baseNetWithoutCurrentEdit = currentPropData.net;
                    if (editingTx && String(editingTx.property_id) === String(formData.property_id)) {
                      const oldConverted = convertPortfolioCurrency(Number(editingTx.amount) || 0, editingTx.currency || propCurr, propCurr);
                      baseNetWithoutCurrentEdit = editingTx.type === "income"
                        ? Number((currentPropData.net - oldConverted).toFixed(2))
                        : Number((currentPropData.net + oldConverted).toFixed(2));
                    }

                    const projectedNet = formData.type === "income" 
                      ? Number((baseNetWithoutCurrentEdit + enteredConvertedAmt).toFixed(2))
                      : Number((baseNetWithoutCurrentEdit - enteredConvertedAmt).toFixed(2));
                    const isProfit = currentPropData.net >= 0;

                    return (
                      <div className="bg-indigo-50/50 border border-indigo-200/80 rounded-lg p-2 text-xs space-y-1 mt-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                            {isTr ? `Portföyün Canlı Finansal Durumu (${propCurr})` : `Portfolio Financial Status (${propCurr})`}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                            isProfit ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          }`}>
                            {isProfit ? (isTr ? "🟢 Kârda" : "Profit") : (isTr ? "🔴 Masraf Ağırlıklı" : "Loss")}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-indigo-100 text-[11px]">
                          <div>
                            <span className="text-[10px] text-slate-400 block">{isTr ? "Mevcut Gelir:" : "Income:"}</span>
                            <span className="font-semibold text-emerald-600">+{sym}{currentPropData.income.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">{isTr ? "Mevcut Masraf:" : "Expenses:"}</span>
                            <span className="font-semibold text-rose-600">-{sym}{currentPropData.expense.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">{isTr ? "Net Kâr/Zarar:" : "Net P&L:"}</span>
                            <span className={`font-semibold ${currentPropData.net >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                              {currentPropData.net < 0 ? "-" : "+"}{sym}{Math.abs(currentPropData.net).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        {enteredRawAmt > 0 && (
                          <div className="text-[10px] text-indigo-700 bg-white/80 rounded p-1.5 space-y-0.5 mt-0.5 border border-indigo-100">
                            {formData.currency !== propCurr && (
                              <div className="flex items-center justify-between text-slate-600">
                                <span>{isTr ? `Çapraz Kur Dönüşümü (${formData.currency} ➔ ${propCurr}):` : `Cross Rate (${formData.currency} ➔ ${propCurr}):`}</span>
                                <span className="font-mono font-semibold text-indigo-600">
                                  {getCurrencySymbol(formData.currency)}{enteredRawAmt.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ≈ {sym}{enteredConvertedAmt.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span>{isTr ? "Bu işlem sonrası yeni net kâr/zarar:" : "Projected P&L:"}</span>
                              <span className="font-semibold">
                                {projectedNet < 0 ? "-" : "+"}{sym}{Math.abs(projectedNet).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
                )}

                {/* Description */}
                <div>
                  <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">
                    {isTr ? "Açıklama / Notlar" : "Notes"}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={isTr ? "Ek açıklama..." : "Notes..."}
                    value={formData.description}
                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-xs text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingTx(null);
                    }}
                    className="px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 font-medium text-xs transition-colors cursor-pointer"
                  >
                    {isTr ? "Vazgeç" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition-colors shadow-2xs cursor-pointer"
                  >
                    {editingTx ? (isTr ? "Kaydet" : "Update") : (isTr ? "Kasaya Kaydet" : "Save Record")}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. Dedicated Account / Cash Vault Statement ("Ekstre") Modal */}
      <AnimatePresence>
        {statementModalOpen && statementTarget && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white rounded-xl w-full max-w-5xl shadow-2xl border border-slate-200 max-h-[92dvh] flex flex-col overflow-hidden text-xs"
            >
              {/* Dark High-Contrast Header */}
              <div className="px-4 py-3 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">
                      {statementData?.account?.account_name || statementTarget.label} — {isTr ? "Hesap Ekstresi" : "Account Statement"}
                    </h3>
                    <div className="text-[10px] text-slate-300 truncate">
                      {statementData?.account?.bank_name ? `${statementData.account.bank_name} • ` : ""}
                      {statementData?.account?.account_number ? `${statementData.account.account_number} • ` : ""}
                      {statementData?.account?.currency || ""}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePrintAccountStatement}
                    disabled={statementLoading || !statementData}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-medium cursor-pointer disabled:opacity-40"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportAccountStatementExcel}
                    disabled={statementLoading || !statementData}
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-medium cursor-pointer disabled:opacity-40"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatementModalOpen(false)}
                    className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-500">{isTr ? "Tarih Aralığı:" : "Date Range:"}</span>
                  <input
                    type="date"
                    value={statementStartDate}
                    onChange={(e) => setStatementStartDate(e.target.value)}
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-800"
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="date"
                    value={statementEndDate}
                    onChange={(e) => setStatementEndDate(e.target.value)}
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => loadAccountStatement(statementTarget, statementStartDate, statementEndDate)}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${statementLoading ? "animate-spin" : ""}`} />
                    <span>{isTr ? "Sorgula" : "Apply"}</span>
                  </button>
                  {(statementStartDate || statementEndDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        setStatementStartDate("");
                        setStatementEndDate("");
                        loadAccountStatement(statementTarget, "", "");
                      }}
                      className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-[11px] font-medium cursor-pointer"
                    >
                      {isTr ? "Tümünü Göster" : "Reset"}
                    </button>
                  )}
                </div>
                <div className="text-[11px] text-slate-500">
                  {statementData?.transactions ? `${statementData.transactions.length} ${isTr ? "hareket" : "movements"}` : ""}
                </div>
              </div>

              {/* KPI Strip & Movement Table */}
              <div className="p-4 overflow-y-auto space-y-3 flex-1">
                {statementLoading ? (
                  <div className="py-12 text-center text-slate-400 text-xs">{isTr ? "Ekstre hesaplanıyor..." : "Loading statement..."}</div>
                ) : statementData ? (
                  <>
                    {(() => {
                      const cur = statementData.account?.currency || "TRY";
                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase block">{isTr ? "Devir / Açılış Bakiye" : "Opening Balance"}</span>
                            <div className="text-sm font-semibold text-slate-800 mt-0.5">
                              {statementData.openingBalance < 0 ? "-" : ""}{formatMoney(statementData.openingBalance, cur)}
                            </div>
                          </div>
                          <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-xl p-2.5">
                            <span className="text-[10px] font-semibold text-emerald-700 uppercase block">{isTr ? "Dönem Giriş (+)" : "Inflows (+)"}</span>
                            <div className="text-sm font-semibold text-emerald-700 mt-0.5">
                              +{formatMoney(statementData.periodIncome, cur)}
                            </div>
                          </div>
                          <div className="bg-rose-50/60 border border-rose-200/70 rounded-xl p-2.5">
                            <span className="text-[10px] font-semibold text-rose-700 uppercase block">{isTr ? "Dönem Çıkış (-)" : "Outflows (-)"}</span>
                            <div className="text-sm font-semibold text-rose-700 mt-0.5">
                              -{formatMoney(statementData.periodExpense, cur)}
                            </div>
                          </div>
                          <div className="bg-slate-900 text-white rounded-xl p-2.5">
                            <span className="text-[10px] font-semibold text-slate-300 uppercase block">{isTr ? "Kapanış / Güncel Bakiye" : "Closing Balance"}</span>
                            <div className={`text-sm font-semibold mt-0.5 ${statementData.closingBalance < 0 ? "text-rose-300" : "text-emerald-300"}`}>
                              {statementData.closingBalance < 0 ? "-" : ""}{formatMoney(statementData.closingBalance, cur)}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="border border-slate-200 rounded-xl overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[680px] text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="py-2 px-2.5 text-[10px] font-semibold text-slate-500 uppercase">{isTr ? "Tarih" : "Date"}</th>
                            <th className="py-2 px-2.5 text-[10px] font-semibold text-slate-500 uppercase">{isTr ? "İşlem Başlığı / Açıklama" : "Description"}</th>
                            <th className="py-2 px-2.5 text-[10px] font-semibold text-slate-500 uppercase">{isTr ? "İlgili / Belge No" : "Party / Ref"}</th>
                            <th className="py-2 px-2.5 text-[10px] font-semibold text-emerald-700 uppercase text-right">{isTr ? "Giriş (+)" : "In (+)"}</th>
                            <th className="py-2 px-2.5 text-[10px] font-semibold text-rose-700 uppercase text-right">{isTr ? "Çıkış (-)" : "Out (-)"}</th>
                            <th className="py-2 px-2.5 text-[10px] font-semibold text-slate-700 uppercase text-right">{isTr ? "Bakiye" : "Balance"}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(statementData.transactions || []).length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-400">
                                {isTr ? "Seçili dönemde bu hesap/kasa için hareket bulunmuyor." : "No movements in this period."}
                              </td>
                            </tr>
                          ) : (
                            (statementData.transactions || []).map((tx: any) => {
                              const cur = statementData.account?.currency || tx.currency || "TRY";
                              return (
                                <tr key={tx.id} className="hover:bg-slate-50/70">
                                  <td className="py-2 px-2.5 whitespace-nowrap text-slate-600">
                                    {tx.date ? new Date(tx.date).toLocaleDateString("tr-TR") : "-"}
                                  </td>
                                  <td className="py-2 px-2.5">
                                    <div className="font-medium text-slate-800">{tx.title}</div>
                                    {tx.description && <div className="text-[10px] text-slate-400 line-clamp-1">{tx.description}</div>}
                                  </td>
                                  <td className="py-2 px-2.5 text-slate-600">
                                    <div>{tx.contact_name || "-"}</div>
                                    {tx.reference_no && <div className="text-[10px] font-mono text-slate-400">{tx.reference_no}</div>}
                                  </td>
                                  <td className="py-2 px-2.5 text-right whitespace-nowrap font-semibold text-emerald-600">
                                    {tx.type === "income" ? `+${formatMoney(tx.amount, cur)}` : "—"}
                                  </td>
                                  <td className="py-2 px-2.5 text-right whitespace-nowrap font-semibold text-rose-600">
                                    {tx.type === "expense" ? `-${formatMoney(tx.amount, cur)}` : "—"}
                                  </td>
                                  <td className="py-2 px-2.5 text-right whitespace-nowrap font-semibold text-slate-900">
                                    {tx.running_balance < 0 ? "-" : ""}{formatMoney(tx.running_balance, cur)}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9. Add / Edit Check & Promissory Note Modal */}
      <AnimatePresence>
        {showCheckModal && (
          <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="bg-white rounded-xl w-full max-w-lg p-4 shadow-xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-3 text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-indigo-600" />
                  {editingCheck ? (isTr ? "Çek / Senet Kaydını Düzenle" : "Edit Check / Note") : (isTr ? "Yeni Çek / Kambiyo Senedi Ekle" : "New Check / Promissory Note")}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCheckModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCheck} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCheckFormData(p => ({ ...p, direction: "received" }))}
                    className={`py-2 px-3 rounded-lg font-semibold text-xs border cursor-pointer ${
                      checkFormData.direction === "received"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    {isTr ? "Alınan (Müşteri Çeki/Senedi)" : "Received (Asset)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckFormData(p => ({ ...p, direction: "issued" }))}
                    className={`py-2 px-3 rounded-lg font-semibold text-xs border cursor-pointer ${
                      checkFormData.direction === "issued"
                        ? "bg-rose-600 text-white border-rose-600"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    {isTr ? "Verilen (Firma Çeki/Senedi)" : "Issued (Payable)"}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">{isTr ? "Evrak Türü *" : "Type *"}</label>
                    <select
                      value={checkFormData.instrument_type}
                      onChange={(e) => setCheckFormData(p => ({ ...p, instrument_type: e.target.value as any }))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-xs text-slate-800"
                    >
                      <option value="check">{isTr ? "Çek" : "Check"}</option>
                      <option value="promissory_note">{isTr ? "Kambiyo Senedi" : "Promissory Note"}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">{isTr ? "Evrak / Seri No *" : "Document No *"}</label>
                    <input
                      type="text"
                      required
                      value={checkFormData.document_no}
                      onChange={(e) => setCheckFormData(p => ({ ...p, document_no: e.target.value }))}
                      placeholder="Örn: CK-48102"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">{isTr ? "Vade Tarihi *" : "Due Date *"}</label>
                    <input
                      type="date"
                      required
                      value={checkFormData.due_date}
                      onChange={(e) => setCheckFormData(p => ({ ...p, due_date: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-6">
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">{isTr ? "Tutar & Para Birimi *" : "Amount *"}</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        step="any"
                        required
                        value={checkFormData.amount}
                        onChange={(e) => setCheckFormData(p => ({ ...p, amount: e.target.value }))}
                        placeholder="0.00"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-l-lg font-semibold text-xs text-slate-900"
                      />
                      <select
                        value={checkFormData.currency}
                        onChange={(e) => setCheckFormData(p => ({ ...p, currency: e.target.value }))}
                        className="w-20 shrink-0 px-2 py-1.5 bg-slate-900 text-white border border-slate-900 rounded-r-lg font-medium text-xs"
                      >
                        <option value="TRY">TRY</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">{isTr ? "Düzenleme" : "Issue Date"}</label>
                    <input
                      type="date"
                      value={checkFormData.issue_date}
                      onChange={(e) => setCheckFormData(p => ({ ...p, issue_date: e.target.value }))}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">{isTr ? "Durum" : "Status"}</label>
                    <select
                      value={checkFormData.status}
                      onChange={(e) => setCheckFormData(p => ({ ...p, status: e.target.value }))}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                    >
                      <option value="portfolio">{isTr ? "Portföyde" : "Portfolio"}</option>
                      <option value="collected">{isTr ? "Tahsil Edildi" : "Collected"}</option>
                      <option value="paid">{isTr ? "Ödendi" : "Paid"}</option>
                      <option value="endorsed">{isTr ? "Ciro Edildi" : "Endorsed"}</option>
                      <option value="bounced">{isTr ? "Karşılıksız" : "Bounced"}</option>
                      <option value="cancelled">{isTr ? "İptal" : "Cancelled"}</option>
                    </select>
                  </div>
                </div>

                {(checkFormData.status === "collected" || checkFormData.status === "paid") && (
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-2.5 space-y-1">
                    <label className="text-[10px] font-semibold text-emerald-800 uppercase block">
                      {isTr ? "Tahsil / Ödeme Yapılan Kasa veya Banka Hesabı" : "Settlement Vault / Account"}
                    </label>
                    <select
                      value={checkFormData.collection_account_id}
                      onChange={(e) => {
                        const val = e.target.value;
                        const acc = accounts.find(a => String(a.id) === val);
                        setCheckFormData(p => ({
                          ...p,
                          collection_account_id: val,
                          collection_account_name: acc ? acc.account_name : `${p.currency} Nakit Kasa`
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs font-semibold text-slate-800"
                    >
                      <optgroup label={isTr ? "Nakit Kasa" : "Cash Vault"}>
                        <option value="">{checkFormData.currency} Nakit Kasa</option>
                      </optgroup>
                      {accounts.filter(a => !isMarketplaceAccount(a) && (a.account_type === "bank" || a.account_type === "credit_card")).length > 0 && (
                        <optgroup label={isTr ? "Banka Hesapları" : "Bank Accounts"}>
                          {accounts
                            .filter(a => !isMarketplaceAccount(a) && (a.account_type === "bank" || a.account_type === "credit_card"))
                            .map(acc => (
                              <option key={acc.id} value={acc.id}>
                                {acc.account_name} ({acc.bank_name || acc.account_type}) — {acc.currency}
                              </option>
                            ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">{isTr ? "Bağlı Cari Hesap (Opsiyonel)" : "Linked Company"}</label>
                    <select
                      value={checkFormData.company_id}
                      onChange={(e) => {
                        const val = e.target.value;
                        const comp = companiesList.find((c: any) => String(c.id) === val);
                        setCheckFormData(p => ({
                          ...p,
                          company_id: val,
                          contact_name: comp ? (comp.title || comp.name || p.contact_name) : p.contact_name
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                    >
                      <option value="">{isTr ? "— Cari Seçin (Opsiyonel) —" : "— Optional —"}</option>
                      {companiesList.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.title || c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">{isTr ? "İlgili Kişi / Kurum" : "Contact"}</label>
                    <input
                      type="text"
                      value={checkFormData.contact_name}
                      onChange={(e) => setCheckFormData(p => ({ ...p, contact_name: e.target.value }))}
                      placeholder={isTr ? "Firma veya kişi adı" : "Party name"}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">{isTr ? "Banka Adı" : "Bank"}</label>
                    <input
                      type="text"
                      value={checkFormData.bank_name}
                      onChange={(e) => setCheckFormData(p => ({ ...p, bank_name: e.target.value }))}
                      placeholder="Örn: Garanti BBVA"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">{isTr ? "Şube" : "Branch"}</label>
                    <input
                      type="text"
                      value={checkFormData.branch_name}
                      onChange={(e) => setCheckFormData(p => ({ ...p, branch_name: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">{isTr ? "Keşideci" : "Drawer"}</label>
                    <input
                      type="text"
                      value={checkFormData.drawer_name}
                      onChange={(e) => setCheckFormData(p => ({ ...p, drawer_name: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">{isTr ? "Notlar" : "Notes"}</label>
                  <textarea
                    rows={2}
                    value={checkFormData.notes}
                    onChange={(e) => setCheckFormData(p => ({ ...p, notes: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCheckModal(false)}
                    className="px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 font-medium cursor-pointer"
                  >
                    {isTr ? "Vazgeç" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold cursor-pointer"
                  >
                    {editingCheck ? (isTr ? "Güncelle" : "Update") : (isTr ? "Portföye Kaydet" : "Save")}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 10. One-Click Check/Note Settlement Modal ("Tahsil Et / Öde") */}
      <AnimatePresence>
        {settlingCheck && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="bg-white rounded-xl w-full max-w-md p-4 shadow-2xl border border-slate-200 space-y-3 text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {settlingCheck.direction === "received"
                    ? (isTr ? "Çek / Senet Tahsil Et" : "Collect Check / Note")
                    : (isTr ? "Çek / Senet Ödemesi Yap" : "Pay Check / Note")}
                </h3>
                <button
                  type="button"
                  onClick={() => setSettlingCheck(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSettleCheckSubmit} className="space-y-3">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isTr ? "Evrak No:" : "Doc No:"}</span>
                    <span className="font-semibold text-slate-800">{settlingCheck.document_no}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isTr ? "Tutar:" : "Amount:"}</span>
                    <span className="font-semibold text-indigo-700">{formatMoney(settlingCheck.amount, settlingCheck.currency)} {settlingCheck.currency}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-600 uppercase block mb-1">
                    {settlingCheck.direction === "received"
                      ? (isTr ? "Çek Kasasından Virman Edilecek Hedef Kasa / Banka *" : "Destination Cash / Bank Account *")
                      : (isTr ? "Ödemenin Çıkacağı Kasa / Banka Hesabı *" : "Source Cash / Bank Account *")}
                  </label>
                  <select
                    value={settleAccountId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSettleAccountId(val);
                      const acc = accounts.find(a => String(a.id) === val);
                      setSettleAccountName(acc ? acc.account_name : `${(settlingCheck.currency || "TRY").toUpperCase()} Nakit Kasa`);
                    }}
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    <optgroup label={isTr ? "Nakit Kasa" : "Physical Cash Vault"}>
                      <option value="">{(settlingCheck.currency || "TRY").toUpperCase()} Nakit Kasa</option>
                    </optgroup>
                    {accounts.filter(a => !isMarketplaceAccount(a) && (a.account_type === "bank" || a.account_type === "credit_card")).length > 0 && (
                      <optgroup label={isTr ? "Banka Hesapları" : "Bank Accounts"}>
                        {accounts
                          .filter(a => !isMarketplaceAccount(a) && (a.account_type === "bank" || a.account_type === "credit_card"))
                          .map(acc => (
                            <option key={acc.id} value={acc.id}>
                              {acc.account_name} {acc.bank_name ? `(${acc.bank_name})` : ""} — {acc.currency}
                            </option>
                          ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-600 uppercase block mb-1">{isTr ? "İşlem Tarihi" : "Settlement Date"}</label>
                  <input
                    type="date"
                    required
                    value={settleDate}
                    onChange={(e) => setSettleDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-600 uppercase block mb-1">{isTr ? "Not" : "Notes"}</label>
                  <input
                    type="text"
                    value={settleNotes}
                    onChange={(e) => setSettleNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSettlingCheck(null)}
                    className="px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 font-medium cursor-pointer"
                  >
                    {isTr ? "Vazgeç" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={settlingSubmitting}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {settlingSubmitting ? (isTr ? "İşleniyor..." : "Processing...") : (settlingCheck.direction === "received" ? (isTr ? "Tahsil Et & Kasaya İşle" : "Collect") : (isTr ? "Öde & Kasadan Düş" : "Pay"))}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 11. Universal Virman / Hesaplar Arası Aktarım Modal (Nakit Kasa ↔ Banka, Banka ↔ Banka, shopLP Pazaryeri → Banka) */}
      <AnimatePresence>
        {transferModalOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="bg-white rounded-xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden text-xs max-h-[90dvh] flex flex-col"
            >
              <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                    <ArrowLeftRight className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">
                      {isShopLPSector
                        ? (isTr ? "Hesaplar Arası Virman / Hakediş Aktarımı" : "Internal Transfer / Payout Virman")
                        : (isTr ? "Kasa & Banka Hesapları Arası Virman" : "Cash & Bank Internal Transfer")}
                    </h3>
                    <p className="text-[10px] text-slate-300 truncate">
                      {isShopLPSector
                        ? (isTr ? "Nakit kasa ↔ banka, banka ↔ banka veya e-market hakedişlerini çift gelir yazmadan virman eder." : "Transfer funds between cash, bank, and marketplace vaults cleanly.")
                        : (isTr ? "Nakit kasadan bankaya yatırma, bankadan kasaya çekme veya bankalar arası virman işlemi." : "Move funds between cash vaults and bank accounts accurately.")}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="p-1 text-slate-300 hover:text-white rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleTransferSubmit} className="p-4 space-y-3 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 uppercase block mb-1">
                      {isTr ? "Kaynak Kasa / Hesap (Çıkış -)" : "Source Account (-)"}
                    </label>
                    <select
                      required
                      value={transferForm.from_key}
                      onChange={(e) => {
                        const val = e.target.value;
                        const accId = val.startsWith("acc:") ? val.slice(4) : "";
                        const acc = accId ? accounts.find(a => String(a.id) === accId) : null;
                        const bal = accId
                          ? (statementAnalysis.summaryByAccount[accId]?.closingBalance ?? 0)
                          : (val.startsWith("cash:") ? (statementAnalysis.summaryByCurrency[val.slice(5)]?.closingBalance ?? 0) : 0);
                        setTransferForm(p => ({
                          ...p,
                          from_key: val,
                          amount: bal > 0 ? String(Number(bal.toFixed(2))) : p.amount,
                          title: acc && isMarketplaceAccount(acc) ? `${acc.account_name} Hakediş Virmanı` : p.title
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                    >
                      <option value="">{isTr ? "— Kaynak Seçin —" : "— Select Source —"}</option>
                      <optgroup label={isTr ? "Nakit Kasalar (Elden Kasa)" : "Physical Cash Vaults"}>
                        {SUPPORTED_CURRENCIES.map(cur => {
                          const bal = statementAnalysis.summaryByCurrency[cur]?.closingBalance ?? 0;
                          return (
                            <option key={cur} value={`cash:${cur}`}>
                              {cur} {isTr ? "Nakit Kasa" : "Cash"} ({formatMoney(bal, cur)})
                            </option>
                          );
                        })}
                      </optgroup>
                      {accounts.filter(a => !isMarketplaceAccount(a) && a.account_type === "bank").length > 0 && (
                        <optgroup label={isTr ? "Banka Hesapları" : "Bank Accounts"}>
                          {accounts.filter(a => !isMarketplaceAccount(a) && a.account_type === "bank").map(acc => {
                            const bal = statementAnalysis.summaryByAccount[String(acc.id)]?.closingBalance ?? 0;
                            return (
                              <option key={acc.id} value={`acc:${acc.id}`}>
                                {acc.account_name} ({formatMoney(bal, acc.currency)})
                              </option>
                            );
                          })}
                        </optgroup>
                      )}
                      {isShopLPSector && accounts.filter(a => isMarketplaceAccount(a)).length > 0 && (
                        <optgroup label={isTr ? "E-Market Kasaları (Hakediş)" : "Marketplace Vaults"}>
                          {accounts.filter(a => isMarketplaceAccount(a)).map(acc => {
                            const bal = statementAnalysis.summaryByAccount[String(acc.id)]?.closingBalance ?? 0;
                            return (
                              <option key={acc.id} value={`acc:${acc.id}`}>
                                {acc.account_name} ({formatMoney(bal, acc.currency)})
                              </option>
                            );
                          })}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 uppercase block mb-1">
                      {isTr ? "Hedef Kasa / Hesap (Giriş +)" : "Destination Account (+)"}
                    </label>
                    <select
                      required
                      value={transferForm.to_key}
                      onChange={(e) => setTransferForm(p => ({ ...p, to_key: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                    >
                      <option value="">{isTr ? "— Hedef Seçin —" : "— Select Destination —"}</option>
                      {accounts.filter(a => !isMarketplaceAccount(a) && a.account_type === "bank").length > 0 && (
                        <optgroup label={isTr ? "Banka Hesapları" : "Bank Accounts"}>
                          {accounts.filter(a => !isMarketplaceAccount(a) && a.account_type === "bank").map(acc => (
                            <option key={acc.id} value={`acc:${acc.id}`}>
                              {acc.account_name} {acc.bank_name ? `(${acc.bank_name})` : ""} — {acc.currency}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label={isTr ? "Nakit Kasalar (Elden Kasa)" : "Physical Cash Vaults"}>
                        {SUPPORTED_CURRENCIES.map(cur => (
                          <option key={cur} value={`cash:${cur}`}>{cur} {isTr ? "Nakit Kasa" : "Cash"}</option>
                        ))}
                      </optgroup>
                      {isShopLPSector && accounts.filter(a => isMarketplaceAccount(a)).length > 0 && (
                        <optgroup label={isTr ? "E-Market Kasaları" : "Marketplace Vaults"}>
                          {accounts.filter(a => isMarketplaceAccount(a)).map(acc => (
                            <option key={acc.id} value={`acc:${acc.id}`}>
                              {acc.account_name} ({acc.currency})
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-5">
                    <label className="text-[10px] font-semibold text-slate-600 uppercase block mb-1">
                      {isTr ? "Aktarılacak Tutar *" : "Amount *"}
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={transferForm.amount}
                      onChange={(e) => setTransferForm(p => ({ ...p, amount: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-xs text-slate-900"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="text-[10px] font-semibold text-slate-600 uppercase block mb-1">
                      {isTr ? "Aktarım Tarihi *" : "Date *"}
                    </label>
                    <input
                      type="date"
                      required
                      value={transferForm.date}
                      onChange={(e) => setTransferForm(p => ({ ...p, date: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-semibold text-slate-600 uppercase block mb-1">
                      {isTr ? "Dekont No" : "Ref No"}
                    </label>
                    <input
                      type="text"
                      placeholder="HKD-01"
                      value={transferForm.reference_no}
                      onChange={(e) => setTransferForm(p => ({ ...p, reference_no: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-600 uppercase block mb-1">
                    {isTr ? "İşlem Başlığı (Opsiyonel)" : "Title (Optional)"}
                  </label>
                  <input
                    type="text"
                    placeholder={isTr ? "Örn: N11 Haftalık Hakediş Ödemesi" : "e.g. Weekly Marketplace Payout"}
                    value={transferForm.title}
                    onChange={(e) => setTransferForm(p => ({ ...p, title: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-600 uppercase block mb-1">
                    {isTr ? "Açıklama / Not" : "Notes"}
                  </label>
                  <input
                    type="text"
                    placeholder={isTr ? "Banka dekont açıklaması veya mutabakat notu..." : "Reconciliation notes..."}
                    value={transferForm.description}
                    onChange={(e) => setTransferForm(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setTransferModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 font-medium cursor-pointer"
                  >
                    {isTr ? "Vazgeç" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={transferSubmitting}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>{transferSubmitting ? (isTr ? "Aktarılıyor..." : "Transferring...") : (isTr ? "Virmanı Kaydet" : "Confirm Transfer")}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
