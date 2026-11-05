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
  ArrowRight
} from "lucide-react";
import * as XLSX from "xlsx";
import { useLanguage } from "../../contexts/LanguageContext";
import { usePortfolioFinances, PortfolioTransaction } from "../../hooks/usePortfolioFinances";
import { useRealEstate } from "../../hooks/useRealEstate";
import { api } from "../../services/api";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

interface PortfolioFinancesTabProps {
  storeId: number;
  isAutomotive?: boolean;
  isRealEstate?: boolean;
}

export interface FinancialAccount {
  id: number;
  store_id: number;
  account_type: "bank" | "credit_card" | "check" | "cash";
  account_name: string;
  bank_name?: string;
  account_number?: string;
  currency: string;
  initial_balance: number;
  created_at?: string;
}

type DatePreset = "all" | "today" | "this_week" | "this_month" | "last_month" | "this_year" | "custom";
type ViewTabMode = "statement" | "portfolio_profit";

const SUPPORTED_CURRENCIES = ["GBP", "EUR", "USD", "TRY"] as const;

export default function PortfolioFinancesTab({ 
  storeId, 
  isAutomotive = false, 
  isRealEstate = false 
}: PortfolioFinancesTabProps) {
  const { lang } = useLanguage();
  const isTr = lang === "tr";

  const activeAutomotive = isAutomotive;
  const activeRealEstate = isRealEstate || (!isAutomotive && !isRealEstate);

  const { properties } = useRealEstate(storeId);
  const { transactions, loading: loadingFinances, addTransaction, updateTransaction, deleteTransaction, fetchTransactions } = usePortfolioFinances(storeId);

  // Tab View Switcher: "statement" (Genel Kasa & Ekstre) vs "portfolio_profit" (Portföy Kâr/Zarar Takibi)
  const [viewTab, setViewTab] = useState<ViewTabMode>("statement");

  // Financial Accounts (Bank accounts, Credit cards, etc.)
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [showAccountsModal, setShowAccountsModal] = useState(false);
  const [showAccountsSummary, setShowAccountsSummary] = useState(false);

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

  // Modal & Edit States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTx, setEditingTx] = useState<PortfolioTransaction | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [showCharts, setShowCharts] = useState(false);

  // Account modal states
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);
  const [accountFormData, setAccountFormData] = useState({
    account_type: "bank" as "bank" | "credit_card" | "check",
    account_name: "",
    bank_name: "",
    account_number: "",
    currency: "TRY",
    initial_balance: "0"
  });

  // Filter States
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currencyFilter, setCurrencyFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<string>("all");
  const [portfolioProfitFilter, setPortfolioProfitFilter] = useState<"all" | "profit" | "loss" | "no_activity">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [portfolioSearch, setPortfolioSearch] = useState("");
  const [profitTabSearch, setProfitTabSearch] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    type: "income" as "income" | "expense",
    category: activeAutomotive ? "car_sales" : "commission",
    title: "",
    amount: "",
    currency: activeAutomotive ? "TRY" : "GBP",
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
    { id: "check_promissory", label: isTr ? "Çek / Senet" : "Check / Note" }
  ];

  const categories = useMemo(() => ({
    income: activeAutomotive 
      ? [
          { id: "car_sales", label: isTr ? "Araç Satış Geliri" : "Vehicle Sales Income" },
          { id: "commission", label: isTr ? "Oto Satış Komisyonu" : "Vehicle Sales Commission" },
          { id: "car_rental", label: isTr ? "Araç Kiralama Geliri" : "Car Rental Income" },
          { id: "deposit_income", label: isTr ? "Kapora / Ön Ödeme" : "Deposit Received" },
          { id: "consulting", label: isTr ? "Ekspertiz & Danışmanlık" : "Appraisal & Consulting" },
          { id: "other", label: isTr ? "Diğer Gelirler" : "Other Income" }
        ]
      : [
          { id: "commission", label: isTr ? "Emlak Satış Komisyonu" : "Real Estate Sales Commission" },
          { id: "rental_placement", label: isTr ? "Kiralama Hizmet Bedeli" : "Rental Placement Fee" },
          { id: "deposit_income", label: isTr ? "Kapora / Ön Ödeme Tahsilatı" : "Deposit Received" },
          { id: "property_management", label: isTr ? "Mülk Yönetim & Aidat Geliri" : "Property Management Fee" },
          { id: "consulting", label: isTr ? "Danışmanlık & Ekspertiz Bedeli" : "Consulting & Appraisal Fee" },
          { id: "other", label: isTr ? "Diğer Gelirler" : "Other Income" }
        ],
    expense: activeAutomotive
      ? [
          { id: "car_purchase", label: isTr ? "Stok Araç Alım Bedeli" : "Vehicle Inventory Purchase" },
          { id: "vehicle_maintenance", label: isTr ? "Araç Bakım, Onarım & Ekspertiz" : "Vehicle Maintenance & Appraisal" },
          { id: "advertising", label: isTr ? "Portal İlan Ücretleri" : "Listing Portal Fees" },
          { id: "rent_utilities", label: isTr ? "Ofis/Galeri Kirası & Faturalar" : "Gallery Rent & Utilities" },
          { id: "agent_commission", label: isTr ? "Satış Personeli Primi & Maaş" : "Agent Commission & Salary" },
          { id: "tax_official", label: isTr ? "Noter, Vergi & Resmi Harçlar" : "Notary, Tax & Official Fees" },
          { id: "marketing", label: isTr ? "Reklam & Tanıtım Giderleri" : "Marketing & Printing" },
          { id: "other", label: isTr ? "Diğer Giderler" : "Other Expenses" }
        ]
      : [
          { id: "advertising", label: isTr ? "Portal İlan & Vitrin Ücretleri" : "Listing Portal Fees" },
          { id: "rent_utilities", label: isTr ? "Ofis Kirası, Elektrik, Su & İnternet" : "Office Rent & Utilities" },
          { id: "agent_commission", label: isTr ? "Danışman Primi & Personel Ödemesi" : "Agent Commission & Payroll" },
          { id: "marketing", label: isTr ? "Dijital Reklam, Afiş & Tabela" : "Marketing, Banner & Printing" },
          { id: "vehicle", label: isTr ? "Ulaşım, Taşıt & Yakıt Gideri" : "Transportation & Fuel" },
          { id: "tax_official", label: isTr ? "Tapu, Vergi & Resmi Harçlar" : "Title Deed, Tax & Official Fees" },
          { id: "office_supplies", label: isTr ? "Ofis Mutfak & Kırtasiye Gideri" : "Office & Hospitality Expenses" },
          { id: "other", label: isTr ? "Diğer Giderler" : "Other Expenses" }
        ]
  }), [activeAutomotive, isTr]);

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

  // Open modal for New Record (optionally pre-selecting a property)
  const handleOpenCreateModal = (preselectedPropertyId?: string | number) => {
    setEditingTx(null);
    setPortfolioSearch("");
    const defaultCur = currencyFilter !== "all" ? currencyFilter : (activeAutomotive ? "TRY" : "GBP");
    setFormData({
      type: "income",
      category: activeAutomotive ? "car_sales" : "commission",
      title: "",
      amount: "",
      currency: defaultCur,
      date: new Date().toISOString().split("T")[0],
      property_id: preselectedPropertyId ? String(preselectedPropertyId) : (selectedPropertyFilter !== "all" ? selectedPropertyFilter : ""),
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
    setFormData({
      type: tx.type,
      category: tx.category,
      title: tx.title || "",
      amount: String(tx.amount || ""),
      currency: tx.currency || (activeAutomotive ? "TRY" : "GBP"),
      date: txDateStr,
      property_id: tx.property_id ? String(tx.property_id) : "",
      payment_method: tx.payment_method || "cash",
      account_id: tx.account_id ? String(tx.account_id) : "",
      account_name: tx.account_name || "",
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

    let resolvedAccountName = formData.account_name;
    if (!resolvedAccountName) {
      if (formData.payment_method === "cash") {
        resolvedAccountName = `${formData.currency} Nakit Kasa`;
      } else if (formData.payment_method === "bank_transfer") {
        const foundAcc = accounts.find(a => String(a.id) === String(formData.account_id));
        resolvedAccountName = foundAcc ? foundAcc.account_name : (isTr ? "Banka Hesabı" : "Bank Account");
      } else if (formData.payment_method === "credit_card") {
        const foundCard = accounts.find(a => String(a.id) === String(formData.account_id));
        resolvedAccountName = foundCard ? foundCard.account_name : (isTr ? "Kredi Kartı" : "Credit Card");
      } else if (formData.payment_method === "check_promissory") {
        resolvedAccountName = isTr ? "Çek / Senet Portföyü" : "Check / Note Portfolio";
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
      payment_method: formData.payment_method,
      account_id: formData.account_id ? Number(formData.account_id) : null,
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

  const getCategoryLabel = (type: "income" | "expense", id: string) => {
    const list = type === "income" ? categories.income : categories.expense;
    return list.find(c => c.id === id)?.label || id;
  };

  const getPaymentMethodLabel = (method?: string) => {
    const found = paymentMethods.find(m => m.id === (method || "cash"));
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

  // Comprehensive Real Estate / Vehicle Portfolio Profit & Loss Analysis Engine
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
        currency: p.currency || "GBP"
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
          currency: v.currency || "TRY"
        };
      });
    }

    // Populate from transactions
    transactions.forEach(t => {
      if (t.property_id) {
        const key = String(t.property_id);
        if (!propertyMap[key]) {
          propertyMap[key] = {
            property: {
              id: t.property_id,
              title: t.property_title || (isTr ? `İlan #${t.property_id}` : `Property #${t.property_id}`),
              reference_no: "",
              currency: t.currency
            },
            income: 0,
            expense: 0,
            net: 0,
            txCount: 0,
            transactions: [],
            currency: t.currency
          };
        }
        const amt = Number(t.amount) || 0;
        if (t.type === "income") propertyMap[key].income += amt;
        else propertyMap[key].expense += amt;
        propertyMap[key].net = propertyMap[key].income - propertyMap[key].expense;
        propertyMap[key].txCount += 1;
        propertyMap[key].transactions.push(t);
      }
    });

    const propertyList = Object.values(propertyMap);
    const activeWithTxs = propertyList.filter(p => p.txCount > 0);

    const totalIncome = activeWithTxs.reduce((sum, p) => sum + p.income, 0);
    const totalExpense = activeWithTxs.reduce((sum, p) => sum + p.expense, 0);
    const totalNet = totalIncome - totalExpense;
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
  }, [properties, vehicles, transactions, activeAutomotive, isTr]);

  // Compute Chronological Running Balances & Date-Range Statement Data per Currency
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
    });

    // Account specific running balances
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

    const runningTracker: Record<string, number> = { GBP: 0, EUR: 0, USD: 0, TRY: 0 };
    const enrichedWithRunning: Array<PortfolioTransaction & { runningBalance: number }> = [];

    for (const tx of chronological) {
      const cur = tx.currency || "GBP";
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
      if (runningTracker[cur] === undefined) runningTracker[cur] = 0;

      const amt = Number(tx.amount) || 0;
      const delta = tx.type === "income" ? amt : -amt;
      const txTime = tx.date ? new Date(tx.date).getTime() : 0;

      if (tx.type === "income") {
        summaryByCurrency[cur].allTimeIncome += amt;
      } else {
        summaryByCurrency[cur].allTimeExpense += amt;
      }
      summaryByCurrency[cur].allTimeNet = summaryByCurrency[cur].allTimeIncome - summaryByCurrency[cur].allTimeExpense;

      const isBeforeStart = startTs !== null && txTime < startTs;
      const isAfterEnd = endTs !== null && txTime > endTs;

      if (isBeforeStart) {
        summaryByCurrency[cur].openingBalance += delta;
        runningTracker[cur] += delta;
      } else if (!isAfterEnd) {
        runningTracker[cur] += delta;
        if (tx.type === "income") {
          summaryByCurrency[cur].periodIncome += amt;
        } else {
          summaryByCurrency[cur].periodExpense += amt;
        }
        summaryByCurrency[cur].txCount += 1;
        enrichedWithRunning.push({
          ...tx,
          runningBalance: runningTracker[cur]
        });
      }
    }

    Object.keys(summaryByCurrency).forEach(cur => {
      const s = summaryByCurrency[cur];
      s.periodNet = s.periodIncome - s.periodExpense;
      s.closingBalance = s.openingBalance + s.periodNet;
    });

    accounts.forEach(acc => {
      const accKey = String(acc.id);
      const accTxs = enrichedWithRunning.filter(t => String(t.account_id) === accKey);
      const periodInc = accTxs.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount || 0), 0);
      const periodExp = accTxs.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount || 0), 0);
      const initBal = Number(acc.initial_balance || 0);

      summaryByAccount[accKey] = {
        account_id: acc.id,
        account_name: acc.account_name,
        account_type: acc.account_type,
        currency: acc.currency,
        openingBalance: initBal,
        periodIncome: periodInc,
        periodExpense: periodExp,
        closingBalance: initBal + (periodInc - periodExp),
        txCount: accTxs.length
      };
    });

    const periodTransactionsDesc = [...enrichedWithRunning].reverse();

    return {
      summaryByCurrency,
      summaryByAccount,
      periodTransactionsDesc,
      periodTransactionsAsc: enrichedWithRunning
    };
  }, [transactions, startDate, endDate, accounts]);

  // Apply Search, Type, Category, Currency, Method, and Property filters on statement
  const filteredTransactions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return statementAnalysis.periodTransactionsDesc.filter(t => {
      const matchesType = typeFilter === "all" || t.type === typeFilter;
      const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
      const matchesCurrency = currencyFilter === "all" || t.currency === currencyFilter;
      const matchesMethod = methodFilter === "all" || (t.payment_method || "cash") === methodFilter;
      const matchesAccount = selectedAccountId === "all" || String(t.account_id) === selectedAccountId;
      const matchesProperty = selectedPropertyFilter === "all" || String(t.property_id) === selectedPropertyFilter;
      const matchesSearch = !q || 
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.property_title && t.property_title.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.contact_name && t.contact_name.toLowerCase().includes(q)) ||
        (t.account_name && t.account_name.toLowerCase().includes(q)) ||
        (t.reference_no && t.reference_no.toLowerCase().includes(q)) ||
        getCategoryLabel(t.type, t.category).toLowerCase().includes(q);

      return matchesType && matchesCategory && matchesCurrency && matchesMethod && matchesAccount && matchesProperty && matchesSearch;
    });
  }, [statementAnalysis.periodTransactionsDesc, typeFilter, categoryFilter, currencyFilter, methodFilter, selectedAccountId, selectedPropertyFilter, searchQuery, categories]);

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

      // 2. Sheet: Portföy Kâr / Zarar Raporu
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

      // 3. Sheet: Ekrandaki Filtreli Ekstre
      const chronologicalFiltered = [...filteredTransactions].reverse();
      const allLedgerRows = chronologicalFiltered.map((t, idx) => ({
        "#": idx + 1,
        [isTr ? "Tarih" : "Date"]: t.date ? new Date(t.date).toLocaleDateString("tr-TR") : "",
        [isTr ? "Tür" : "Type"]: t.type === "income" ? (isTr ? "GELİR (+)" : "INCOME (+)") : (isTr ? "GİDER (-)" : "EXPENSE (-)"),
        [isTr ? "Kategori" : "Category"]: getCategoryLabel(t.type, t.category),
        [isTr ? "İşlem Başlığı" : "Title"]: t.title || "",
        [isTr ? "İlişkili Portföy" : "Linked Property"]: t.property_title || "-",
        [isTr ? "Hesap / Kasa" : "Account"]: t.account_name || getPaymentMethodLabel(t.payment_method),
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

      XLSX.writeFile(wb, `Kasa_ve_Portfoy_Ekstresi_${new Date().toISOString().split("T")[0]}.xlsx`);
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
            <div class="meta">Dönem: ${periodStr}</div>
          </div>
          <div class="meta right">Yazdırma Tarihi: ${new Date().toLocaleDateString("tr-TR")}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Tarih</th>
              <th>İşlem Başlığı</th>
              <th>İlişkili Portföy</th>
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
                <td>${t.date ? new Date(t.date).toLocaleDateString("tr-TR") : "-"}</td>
                <td>${t.title || ""}</td>
                <td>${t.property_title || "-"}</td>
                <td>${t.account_name || getPaymentMethodLabel(t.payment_method)}</td>
                <td>${getCategoryLabel(t.type, t.category)}</td>
                <td class="right inc">${t.type === "income" ? `+${formatMoney(t.amount, t.currency)}` : "-"}</td>
                <td class="right exp">${t.type === "expense" ? `-${formatMoney(t.amount, t.currency)}` : "-"}</td>
                <td class="right bal">${t.runningBalance < 0 ? "-" : ""}${formatMoney(t.runningBalance, t.currency)}</td>
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

  // Filtered table totals per currency
  const filteredTotalsByCurrency = useMemo(() => {
    const map: Record<string, { income: number; expense: number; net: number; count: number }> = {};
    filteredTransactions.forEach(t => {
      const cur = t.currency || "GBP";
      if (!map[cur]) map[cur] = { income: 0, expense: 0, net: 0, count: 0 };
      const amt = Number(t.amount) || 0;
      if (t.type === "income") map[cur].income += amt;
      else map[cur].expense += amt;
      map[cur].net = map[cur].income - map[cur].expense;
      map[cur].count += 1;
    });
    return map;
  }, [filteredTransactions]);

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
    <div className="space-y-2.5">
      {/* 1. Header & Action Bar - Compact Single Row, No Subtitle, View Switcher */}
      <div className="bg-white border border-slate-200/80 rounded-xl px-3 py-2 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Coins className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold text-slate-800 tracking-tight">
              {isTr ? "Gelir - Gider & Kasa Takibi" : "Ledger & Finances"}
            </h2>
          </div>

          {/* View Mode Switcher: Genel Ekstre vs Portföy Kâr/Zarar */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/70 ml-1">
            <button
              type="button"
              onClick={() => setViewTab("statement")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                viewTab === "statement"
                  ? "bg-white text-indigo-600 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>{isTr ? "Kasa & Hesap Ekstresi" : "Ledger"}</span>
            </button>

            <button
              type="button"
              onClick={() => setViewTab("portfolio_profit")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                viewTab === "portfolio_profit"
                  ? "bg-white text-indigo-600 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Building2 className="w-3 h-3" />
              <span>{isTr ? "Portföy Kâr / Zarar" : "Portfolio P&L"}</span>
              {portfolioAnalysis.activeWithTxs.length > 0 && (
                <span className="px-1 py-0.2 rounded text-[10px] bg-indigo-100 text-indigo-700">
                  {portfolioAnalysis.activeWithTxs.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons on Single Row with Shortened Labels */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowCharts(prev => !prev)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              showCharts
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
            }`}
            title={isTr ? "Grafik Dağılım Analizi" : "Charts"}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{isTr ? "Grafik" : "Charts"}</span>
          </button>

          <button
            type="button"
            onClick={handlePrintStatement}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
            title={isTr ? "PDF Ekstre İndir / Yazdır" : "Print PDF Statement"}
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>PDF</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs cursor-pointer"
            title={isTr ? "Excel (XLSX) Formatında Dışa Aktar" : "Export Excel"}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>XLS</span>
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
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-1 px-3 rounded-lg shadow-2xs transition-colors text-xs cursor-pointer"
            title={isTr ? "Yeni Gelir veya Gider Kaydet" : "Record Entry"}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isTr ? "Yeni İşlem" : "New"}</span>
          </button>
        </div>
      </div>

      {/* VIEW TAB 1: KASA & HESAP EKSTRESİ */}
      {viewTab === "statement" && (
        <>
          {/* 2. Date Range & Period Filter Bar - High Density Single Row */}
          <div className="bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tight mr-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-indigo-500" />
                {isTr ? "Dönem:" : "Period:"}
              </span>
              {[
                { id: "all", label: isTr ? "Tüm Zamanlar" : "All Time" },
                { id: "today", label: isTr ? "Bugün" : "Today" },
                { id: "this_week", label: isTr ? "Bu Hafta" : "This Week" },
                { id: "this_month", label: isTr ? "Bu Ay" : "This Month" },
                { id: "last_month", label: isTr ? "Geçen Ay" : "Last Month" },
                { id: "this_year", label: isTr ? "Bu Yıl" : "This Year" }
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectDatePreset(p.id as DatePreset)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    datePreset === p.id
                      ? "bg-indigo-600 text-white font-semibold"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDatePreset("custom");
                  }}
                  className="bg-transparent text-[11px] font-medium text-slate-700 focus:outline-none w-24"
                />
                <span className="text-slate-300">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDatePreset("custom");
                  }}
                  className="bg-transparent text-[11px] font-medium text-slate-700 focus:outline-none w-24"
                />
              </div>

              {(startDate || endDate || currencyFilter !== "all" || typeFilter !== "all" || categoryFilter !== "all" || methodFilter !== "all" || selectedAccountId !== "all" || selectedPropertyFilter !== "all" || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    handleSelectDatePreset("all");
                    setCurrencyFilter("all");
                    setTypeFilter("all");
                    setCategoryFilter("all");
                    setMethodFilter("all");
                    setSelectedAccountId("all");
                    setSelectedPropertyFilter("all");
                    setSearchQuery("");
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                  title={isTr ? "Filtreleri Sıfırla" : "Reset Filters"}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{isTr ? "Sıfırla" : "Reset"}</span>
                </button>
              )}
            </div>
          </div>

          {/* 3. Kasalar ve Hesaplar Açılır / Kapanır Mimari (Collapsible & Selectable Accounts Drawer) */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-2 shadow-xs text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight shrink-0 flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5 text-indigo-500" />
                  {isTr ? "Bakiyeler:" : "Balances:"}
                </span>

                {SUPPORTED_CURRENCIES.map(cur => {
                  const s = statementAnalysis.summaryByCurrency[cur];
                  const sym = getCurrencySymbol(cur);
                  const isSelected = currencyFilter === cur;
                  const isNeg = s.closingBalance < 0;
                  return (
                    <button
                      key={cur}
                      type="button"
                      onClick={() => setCurrencyFilter(prev => prev === cur ? "all" : cur)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors shrink-0 flex items-center gap-1 border cursor-pointer ${
                        isSelected
                          ? "bg-slate-900 text-white border-slate-900 shadow-2xs font-semibold"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                      title={isTr ? `${cur} işlemlerini filtrele` : `Filter ${cur}`}
                    >
                      <span className="text-slate-400">{cur}:</span>
                      <span className={isNeg ? "text-rose-500" : (isSelected ? "text-emerald-300" : "text-emerald-700")}>
                        {isNeg ? "-" : ""}{sym}{Math.abs(s.closingBalance).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </button>
                  );
                })}

                {accounts.length > 0 && (
                  <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0 flex items-center gap-1">
                    <Landmark className="w-3 h-3 text-slate-400" />
                    {accounts.length} {isTr ? "hesap" : "accounts"}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAccountsSummary(prev => !prev)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-indigo-200 transition-colors cursor-pointer"
                >
                  <span>{showAccountsSummary ? (isTr ? "Kapat" : "Close") : (isTr ? "Kasalar & Detay" : "Ledgers")}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAccountsSummary ? "rotate-180" : ""}`} />
                </button>
              </div>
            </div>

            {/* Expanded Minimalist & Futuristic Account Cards */}
            {showAccountsSummary && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-2.5">
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight mb-1.5 flex items-center justify-between">
                    <span>{isTr ? "Nakit Kasa Ekstreleri" : "Cash Ledgers"}</span>
                    <span className="text-[10px] text-slate-400">{isTr ? "Filtrelemek için karta tıklayın" : "Click card to filter"}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {SUPPORTED_CURRENCIES.map(cur => {
                      const data = statementAnalysis.summaryByCurrency[cur];
                      const sym = getCurrencySymbol(cur);
                      const isNetNegative = data.closingBalance < 0;
                      const isSelected = currencyFilter === cur && methodFilter === "all" && selectedAccountId === "all";

                      return (
                        <div 
                          key={cur}
                          onClick={() => {
                            setCurrencyFilter(cur);
                            setMethodFilter("all");
                            setSelectedAccountId("all");
                          }}
                          className={`cursor-pointer rounded-xl p-2.5 transition-all border ${
                            isSelected
                              ? "bg-slate-900 text-white border-slate-900 shadow-sm ring-1 ring-indigo-500/30"
                              : "bg-slate-50/70 hover:bg-slate-100/80 border-slate-200"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[11px] font-semibold ${isSelected ? "text-indigo-300" : "text-slate-600"}`}>
                              {cur} {isTr ? "Kasa" : "Cash"}
                            </span>
                            <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                              isSelected ? "bg-white/10 text-white" : "bg-white text-slate-500 border border-slate-200"
                            }`}>
                              {data.txCount} {isTr ? "işlem" : "tx"}
                            </span>
                          </div>

                          <div className={`text-sm font-semibold tracking-tight ${
                            isSelected
                              ? (isNetNegative ? "text-rose-300" : "text-emerald-300")
                              : (isNetNegative ? "text-rose-600" : "text-emerald-700")
                          }`}>
                            {isNetNegative ? "-" : ""}{sym}{Math.abs(data.closingBalance).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 pt-1 border-t border-slate-200/50">
                            <span className="text-emerald-600">+{sym}{data.periodIncome.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}</span>
                            <span className="text-rose-500">-{sym}{data.periodExpense.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bank Accounts & Credit Cards */}
                {accounts.length > 0 && (
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight mb-1.5 flex items-center justify-between">
                      <span>{isTr ? "Tanımlı Banka Hesapları & Kredi Kartları" : "Bank & Card Ledgers"}</span>
                      <button
                        type="button"
                        onClick={() => setShowAccountsModal(true)}
                        className="text-[10px] text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{isTr ? "Hesap Ekle / Düzenle" : "Manage Accounts"}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {accounts.map(acc => {
                        const accSummary = statementAnalysis.summaryByAccount[String(acc.id)] || {
                          closingBalance: Number(acc.initial_balance || 0),
                          periodIncome: 0,
                          periodExpense: 0,
                          txCount: 0
                        };
                        const sym = getCurrencySymbol(acc.currency);
                        const isSelected = selectedAccountId === String(acc.id);
                        const isCard = acc.account_type === "credit_card";

                        return (
                          <div
                            key={acc.id}
                            onClick={() => {
                              setSelectedAccountId(prev => prev === String(acc.id) ? "all" : String(acc.id));
                              setCurrencyFilter("all");
                              setMethodFilter("all");
                            }}
                            className={`cursor-pointer rounded-xl p-2.5 transition-all border ${
                              isSelected
                                ? "bg-slate-900 text-white border-slate-900 shadow-sm ring-1 ring-indigo-500/30"
                                : "bg-slate-50/70 hover:bg-slate-100/80 border-slate-200"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5 truncate">
                                {isCard ? (
                                  <CreditCard className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                ) : (
                                  <Landmark className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                )}
                                <span className={`text-[11px] font-semibold truncate ${isSelected ? "text-white" : "text-slate-800"}`}>
                                  {acc.account_name}
                                </span>
                              </div>
                              <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded shrink-0 ${
                                isSelected ? "bg-white/10 text-white" : "bg-white text-slate-500 border border-slate-200"
                              }`}>
                                {acc.currency}
                              </span>
                            </div>

                            {acc.bank_name && (
                              <div className="text-[10px] text-slate-400 truncate mb-1">
                                {acc.bank_name} {acc.account_number ? `• ${acc.account_number}` : ""}
                              </div>
                            )}

                            <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-200/50">
                              <span className={`text-xs font-semibold ${
                                isSelected ? "text-emerald-300" : "text-slate-800"
                              }`}>
                                {sym}{accSummary.closingBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {accSummary.txCount} {isTr ? "kayıt" : "records"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

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
                      title={isTr ? "Filtreyi Kaldır (Tüm Portföylere Dön)" : "Clear Filter"}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 5. Statement Ledger Table & Compact Filter Toolbar */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs space-y-2.5">
            {/* Shortened Tabs & Filters */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 text-xs">
              {/* Currency Tabs */}
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setCurrencyFilter("all");
                    setSelectedAccountId("all");
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    currencyFilter === "all" && selectedAccountId === "all"
                      ? "bg-slate-900 text-white font-semibold"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {isTr ? "Tümü" : "All"} ({statementAnalysis.periodTransactionsDesc.length})
                </button>

                {SUPPORTED_CURRENCIES.map(cur => {
                  const count = statementAnalysis.summaryByCurrency[cur]?.txCount || 0;
                  const sym = getCurrencySymbol(cur);
                  return (
                    <button
                      key={cur}
                      type="button"
                      onClick={() => {
                        setCurrencyFilter(cur);
                        setSelectedAccountId("all");
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                        currencyFilter === cur && selectedAccountId === "all"
                          ? "bg-indigo-600 text-white font-semibold"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      <span>{sym} {cur}</span>
                      <span className={`px-1 py-0.2 rounded text-[10px] ${
                        currencyFilter === cur && selectedAccountId === "all" ? "bg-white/20 text-white" : "bg-white text-slate-500"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Payment Method, Linked Property, Flow Type & Category Filters */}
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Linked Portfolio Property Filter */}
                <select
                  value={selectedPropertyFilter}
                  onChange={(e) => setSelectedPropertyFilter(e.target.value)}
                  className="px-2 py-1 bg-indigo-50/70 border border-indigo-200 text-indigo-900 rounded-lg text-xs font-medium focus:outline-none max-w-[170px]"
                  title={isTr ? "İlişkili Portföye Göre Filtrele" : "Filter by Linked Property"}
                >
                  <option value="all">{isTr ? "🏢 Tüm Portföyler" : "All Properties"}</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.reference_no ? `[${p.reference_no}] ` : ""}{p.title}
                    </option>
                  ))}
                </select>

                {/* Payment Method filter */}
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none"
                >
                  <option value="all">{isTr ? "Tüm Ödeme Yolları" : "All Methods"}</option>
                  <option value="cash">{isTr ? "💵 Nakit Kasa" : "Cash"}</option>
                  <option value="bank_transfer">{isTr ? "🏦 Banka Havale / EFT" : "Bank Transfer"}</option>
                  <option value="credit_card">{isTr ? "💳 Kredi Kartı" : "Credit Card"}</option>
                  <option value="check_promissory">{isTr ? "📝 Çek / Senet" : "Check / Note"}</option>
                </select>

                {/* Flow Type Filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value as any);
                    setCategoryFilter("all");
                  }}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none"
                >
                  <option value="all">{isTr ? "Tüm Türler" : "All Types"}</option>
                  <option value="income">{isTr ? "Sadece Gelir (+)" : "Income (+)"}</option>
                  <option value="expense">{isTr ? "Sadece Gider (-)" : "Expense (-)"}</option>
                </select>

                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none max-w-[140px]"
                >
                  <option value="all">{isTr ? "Tüm Kategoriler" : "All Categories"}</option>
                  {(typeFilter === "all" || typeFilter === "income") && (
                    <optgroup label={isTr ? "Gelirler" : "Incomes"}>
                      {categories.income.map(c => (
                        <option key={`inc-${c.id}`} value={c.id}>{c.label}</option>
                      ))}
                    </optgroup>
                  )}
                  {(typeFilter === "all" || typeFilter === "expense") && (
                    <optgroup label={isTr ? "Giderler" : "Expenses"}>
                      {categories.expense.map(c => (
                        <option key={`exp-${c.id}`} value={c.id}>{c.label}</option>
                      ))}
                    </optgroup>
                  )}
                </select>

                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={isTr ? "Ara (başlık, portföy, kişi)..." : "Search..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-40 font-medium"
                  />
                </div>
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
                      <th className="py-2 px-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{isTr ? "İŞLEM BAŞLIĞI / İLAN / CARİ" : "TITLE / LISTING"}</th>
                      <th className="py-2 px-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{isTr ? "KATEGORİ & HESAP" : "CATEGORY & ACCOUNT"}</th>
                      <th className="py-2 px-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center">{isTr ? "DÖVİZ" : "CUR"}</th>
                      <th className="py-2 px-2.5 text-[10px] font-semibold text-emerald-700 uppercase tracking-wider text-right">{isTr ? "GİRİŞ (GELİR +)" : "CREDIT (+)"}</th>
                      <th className="py-2 px-2.5 text-[10px] font-semibold text-rose-700 uppercase tracking-wider text-right">{isTr ? "ÇIKIŞ (GİDER -)" : "DEBIT (-)"}</th>
                      <th className="py-2 px-2.5 text-[10px] font-semibold text-slate-700 uppercase tracking-wider text-right">{isTr ? "KASA BAKİYESİ" : "BALANCE"}</th>
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
                                {cleanPropTitle && (
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

                          <td className="py-2 px-2.5 align-top">
                            <div className="space-y-0.5">
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium ${
                                isIncome ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                              }`}>
                                <span className={`w-1 h-1 rounded-full ${isIncome ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                                {getCategoryLabel(t.type, t.category)}
                              </span>

                              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                {t.payment_method === "bank_transfer" ? (
                                  <Landmark className="w-2.5 h-2.5 text-slate-400" />
                                ) : t.payment_method === "credit_card" ? (
                                  <CreditCard className="w-2.5 h-2.5 text-slate-400" />
                                ) : t.payment_method === "check_promissory" ? (
                                  <FileCheck2 className="w-2.5 h-2.5 text-slate-400" />
                                ) : (
                                  <Wallet className="w-2.5 h-2.5 text-slate-400" />
                                )}
                                <span className="truncate max-w-[160px]">{t.account_name || getPaymentMethodLabel(t.payment_method)}</span>
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
                      const closingBal = statementAnalysis.summaryByCurrency[cur]?.closingBalance ?? tot.net;
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

      {/* VIEW TAB 2: DEDICATED PORTFÖY KÂR / ZARAR ANALİZİ (PORTFOLIO P&L DASHBOARD) */}
      {viewTab === "portfolio_profit" && (
        <div className="space-y-2.5">
          {/* Top KPI Cards for Portfolio Profit & Loss */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight block">
                {isTr ? "Toplam Portföy Gelirleri" : "Total Portfolio Income"}
              </span>
              <div className="text-sm font-semibold text-emerald-600 mt-0.5">
                +£{portfolioAnalysis.totalIncome.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {portfolioAnalysis.activeWithTxs.length} {isTr ? "hareket gören ilan" : "active listings"}
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight block">
                {isTr ? "Toplam Masraf & Giderler" : "Total Portfolio Expenses"}
              </span>
              <div className="text-sm font-semibold text-rose-600 mt-0.5">
                -£{portfolioAnalysis.totalExpense.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {isTr ? "İlan, reklam, tapu, tadilat" : "Marketing, legal, fees"}
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight block">
                {isTr ? "Net Portföy Kârı" : "Net Portfolio Profit"}
              </span>
              <div className={`text-sm font-semibold mt-0.5 ${
                portfolioAnalysis.totalNet >= 0 ? "text-emerald-700" : "text-rose-700"
              }`}>
                {portfolioAnalysis.totalNet < 0 ? "-" : "+"}£{Math.abs(portfolioAnalysis.totalNet).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
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
                { id: "all", label: isTr ? "Tüm Portföyler" : "All" },
                { id: "profit", label: isTr ? "🟢 Sadece Kârda Olanlar" : "Profitable" },
                { id: "loss", label: isTr ? "🔴 Masraf / Zararda Olanlar" : "In Loss" },
                { id: "no_activity", label: isTr ? "⚪ Hareketi Olmayanlar" : "No Activity" }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setPortfolioProfitFilter(f.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
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
                      <option value="check">{isTr ? "Çek / Senet Portföyü" : "Check / Note"}</option>
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
                      const defaultCat = activeAutomotive ? "car_sales" : "commission";
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
                      const defaultCat = activeAutomotive ? "car_purchase" : "advertising";
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
                      placeholder={formData.type === "income" ? (isTr ? "Örn: Satış Komisyonu" : "Commission") : (isTr ? "Örn: Ofis Kirası / İlan Bedeli" : "Listing Fee")}
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
                        onChange={(e) => setFormData(p => ({ ...p, currency: e.target.value }))}
                        className="w-20 shrink-0 px-2 py-1.5 bg-slate-900 text-white border border-slate-900 rounded-r-lg font-medium text-xs focus:outline-none cursor-pointer"
                      >
                        <option value="GBP">GBP (£)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                        <option value="TRY">TRY (₺)</option>
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">
                      {isTr ? "Kategori" : "Category"}
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-xs text-slate-800 focus:outline-none cursor-pointer"
                    >
                      {categories[formData.type].map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">
                      {isTr ? "Ödeme Yöntemi" : "Method"}
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

                {/* Linked Portfolio Property with Real-Time P&L Status Indicator */}
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-500 uppercase block">
                    {isTr ? `İlişkili ${activeAutomotive ? "Araç" : "Emlak İlanı"} (Kâr / Zarar Bağlantısı)` : "Linked Listing (P&L Tracking)"}
                  </label>
                  <select
                    value={formData.property_id}
                    onChange={(e) => {
                      const propId = e.target.value;
                      const matched = portfolioAnalysis.propertyMap[propId];
                      setFormData(p => ({
                        ...p,
                        property_id: propId,
                        currency: matched ? matched.currency : p.currency
                      }));
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-xs text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="">{isTr ? "— İlişkili Portföy Yok (Genel Kasa Kaydı) —" : "— None (General Cash) —"}</option>
                    {filteredPortfolioItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {activeAutomotive 
                          ? `${item.plate || ""} - ${item.brand || ""} ${item.model || ""} (${item.year || ""})` 
                          : `${item.reference_no ? `[${item.reference_no}] ` : ""}${item.title} (${Math.round(Number(item.price) || 0).toLocaleString("tr-TR")} ${item.currency || "GBP"})`}
                      </option>
                    ))}
                  </select>

                  {/* Real-Time Live Portfolio Profit/Loss Status Preview */}
                  {formData.property_id && (() => {
                    const currentPropData = portfolioAnalysis.propertyMap[String(formData.property_id)];
                    if (!currentPropData) return null;
                    const isProfit = currentPropData.net >= 0;
                    const sym = getCurrencySymbol(currentPropData.currency);
                    const enteredAmt = Number(String(formData.amount).replace(/,/g, ".")) || 0;
                    const projectedNet = formData.type === "income" 
                      ? currentPropData.net + enteredAmt 
                      : currentPropData.net - enteredAmt;

                    return (
                      <div className="bg-indigo-50/50 border border-indigo-200/80 rounded-lg p-2 text-xs space-y-1 mt-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                            {isTr ? "Portföyün Canlı Finansal Durumu" : "Portfolio Financial Status"}
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

                        {enteredAmt > 0 && (
                          <div className="text-[10px] text-indigo-700 bg-white/70 rounded p-1 flex items-center justify-between mt-0.5 border border-indigo-100">
                            <span>{isTr ? "Bu işlem sonrası yeni net kâr/zarar:" : "Projected P&L:"}</span>
                            <span className="font-semibold">
                              {projectedNet < 0 ? "-" : "+"}{sym}{Math.abs(projectedNet).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

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
    </div>
  );
}
