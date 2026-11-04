import React, { useState, useEffect, useMemo } from "react";
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
  User
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

type DatePreset = "all" | "today" | "this_week" | "this_month" | "last_month" | "this_year" | "custom";

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

  // Modal & Edit States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTx, setEditingTx] = useState<PortfolioTransaction | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [showCharts, setShowCharts] = useState(false);

  // Filter States
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currencyFilter, setCurrencyFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [portfolioSearch, setPortfolioSearch] = useState("");

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
    reference_no: "",
    contact_name: "",
    description: ""
  });

  const paymentMethods = [
    { id: "cash", label: isTr ? "Nakit Kasa" : "Cash" },
    { id: "bank_transfer", label: isTr ? "Banka Havale / EFT" : "Bank Transfer" },
    { id: "credit_card", label: isTr ? "Kredi Kartı / POS" : "Credit Card" },
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
      const dayOfWeek = now.getDay() || 7; // Monday = 1 ... Sunday = 7
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

  // Open modal for New Record
  const handleOpenCreateModal = () => {
    setEditingTx(null);
    setPortfolioSearch("");
    setFormData({
      type: "income",
      category: activeAutomotive ? "car_sales" : "commission",
      title: "",
      amount: "",
      currency: currencyFilter !== "all" ? currencyFilter : (activeAutomotive ? "TRY" : "GBP"),
      date: new Date().toISOString().split("T")[0],
      property_id: "",
      payment_method: "cash",
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

    const payload = {
      type: formData.type,
      category: formData.category,
      title: formData.title.trim(),
      amount: numericAmount,
      currency: formData.currency,
      date: new Date(formData.date).toISOString(),
      property_id: formData.property_id ? Number(formData.property_id) : null,
      payment_method: formData.payment_method,
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
        toast.success(isTr ? "Finansal işlem kasaya kaydedildi." : "Financial record saved.");
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

  // Compute Chronological Running Balances & Date-Range Statement Data per Currency
  const statementAnalysis = useMemo(() => {
    const startTs = startDate ? new Date(`${startDate}T00:00:00`).getTime() : null;
    const endTs = endDate ? new Date(`${endDate}T23:59:59.999`).getTime() : null;

    // Sort all transactions chronologically (oldest first) to compute accurate running balances per currency
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

      // All-time totals
      if (tx.type === "income") {
        summaryByCurrency[cur].allTimeIncome += amt;
      } else {
        summaryByCurrency[cur].allTimeExpense += amt;
      }
      summaryByCurrency[cur].allTimeNet = summaryByCurrency[cur].allTimeIncome - summaryByCurrency[cur].allTimeExpense;

      // Check date range
      const isBeforeStart = startTs !== null && txTime < startTs;
      const isAfterEnd = endTs !== null && txTime > endTs;

      if (isBeforeStart) {
        summaryByCurrency[cur].openingBalance += delta;
        runningTracker[cur] += delta;
      } else if (!isAfterEnd) {
        // Inside selected period
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

    // Reverse enriched list so newest transactions in the period are shown at the top of the table
    const periodTransactionsDesc = [...enrichedWithRunning].reverse();

    return {
      summaryByCurrency,
      periodTransactionsDesc,
      periodTransactionsAsc: enrichedWithRunning
    };
  }, [transactions, startDate, endDate]);

  // Apply Search, Type, Category, Currency filters on top of periodTransactionsDesc
  const filteredTransactions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return statementAnalysis.periodTransactionsDesc.filter(t => {
      const matchesType = typeFilter === "all" || t.type === typeFilter;
      const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
      const matchesCurrency = currencyFilter === "all" || t.currency === currencyFilter;
      const matchesSearch = !q || 
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.property_title && t.property_title.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.contact_name && t.contact_name.toLowerCase().includes(q)) ||
        (t.reference_no && t.reference_no.toLowerCase().includes(q)) ||
        getCategoryLabel(t.type, t.category).toLowerCase().includes(q);

      return matchesType && matchesCategory && matchesCurrency && matchesSearch;
    });
  }, [statementAnalysis.periodTransactionsDesc, typeFilter, categoryFilter, currencyFilter, searchQuery, categories]);

  // Export Multi-Currency Statement to Excel (.xlsx)
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

      // 1. Sheet: Dönem Kasa Özeti (Summary per Currency)
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
      wsSummary["!cols"] = [{ wch: 14 }, { wch: 24 }, { wch: 26 }, { wch: 24 }, { wch: 24 }, { wch: 18 }, { wch: 26 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, isTr ? "Kasa Özeti" : "Cash Summary");

      // 2. Sheet: Filtered Ledger (Ekrandaki Filtreli Ekstre)
      const chronologicalFiltered = [...filteredTransactions].reverse();
      const allLedgerRows = chronologicalFiltered.map((t, idx) => ({
        "#": idx + 1,
        [isTr ? "Tarih" : "Date"]: t.date ? new Date(t.date).toLocaleDateString("tr-TR") : "",
        [isTr ? "Tür" : "Type"]: t.type === "income" ? (isTr ? "GELİR (+)" : "INCOME (+)") : (isTr ? "GİDER (-)" : "EXPENSE (-)"),
        [isTr ? "Kategori" : "Category"]: getCategoryLabel(t.type, t.category),
        [isTr ? "İşlem Başlığı" : "Title"]: t.title || "",
        [isTr ? "İlgili Kişi / Kurum" : "Contact"]: t.contact_name || "-",
        [isTr ? "Belge / Makbuz No" : "Ref No"]: t.reference_no || "-",
        [isTr ? "Ödeme Yöntemi" : "Payment Method"]: getPaymentMethodLabel(t.payment_method),
        [isTr ? "İlişkili İlan / Araç" : "Linked Listing"]: (t.property_title && t.property_title.trim() !== "-") ? t.property_title : "-",
        [isTr ? "Giriş (+)" : "Credit (+)"]: t.type === "income" ? Number(Number(t.amount).toFixed(2)) : 0,
        [isTr ? "Çıkış (-)" : "Debit (-)"]: t.type === "expense" ? Number(Number(t.amount).toFixed(2)) : 0,
        [isTr ? "Para Birimi" : "Currency"]: t.currency,
        [isTr ? "Kümülatif Kasa Bakiyesi" : "Running Balance"]: Number(t.runningBalance.toFixed(2)),
        [isTr ? "Açıklama / Not" : "Description"]: t.description || ""
      }));
      const wsAll = XLSX.utils.json_to_sheet(allLedgerRows);
      wsAll["!cols"] = [
        { wch: 5 }, { wch: 12 }, { wch: 12 }, { wch: 26 }, { wch: 32 },
        { wch: 22 }, { wch: 16 }, { wch: 18 }, { wch: 28 }, { wch: 14 },
        { wch: 14 }, { wch: 12 }, { wch: 22 }, { wch: 35 }
      ];
      XLSX.utils.book_append_sheet(wb, wsAll, isTr ? "Tüm İşlemler Ekstre" : "All Transactions");

      // 3. Per-Currency Dedicated Statement Sheets (GBP Ekstre, EUR Ekstre, USD Ekstre, TRY Ekstre)
      SUPPORTED_CURRENCIES.forEach(cur => {
        const curTxs = statementAnalysis.periodTransactionsAsc.filter(t => t.currency === cur);
        const curSummary = statementAnalysis.summaryByCurrency[cur];
        if (curTxs.length === 0 && curSummary.openingBalance === 0) return;

        const sheetRows: any[] = [];
        // Opening balance row
        sheetRows.push({
          [isTr ? "Tarih" : "Date"]: startDate || (isTr ? "Dönem Başı" : "Opening"),
          [isTr ? "Tür" : "Type"]: isTr ? "DEVİR" : "OPENING",
          [isTr ? "Kategori" : "Category"]: "-",
          [isTr ? "İşlem Başlığı" : "Title"]: isTr ? "Dönem Başı Devreden Kasa Bakiyesi" : "Opening Carried Balance",
          [isTr ? "İlgili Kişi / Kurum" : "Contact"]: "-",
          [isTr ? "Belge No" : "Ref No"]: "-",
          [isTr ? "Giriş (+)" : "Credit (+)"]: curSummary.openingBalance > 0 ? Number(curSummary.openingBalance.toFixed(2)) : 0,
          [isTr ? "Çıkış (-)" : "Debit (-)"]: curSummary.openingBalance < 0 ? Number(Math.abs(curSummary.openingBalance).toFixed(2)) : 0,
          [isTr ? "Para Birimi" : "Currency"]: cur,
          [isTr ? "Kasa Bakiyesi" : "Balance"]: Number(curSummary.openingBalance.toFixed(2)),
          [isTr ? "Açıklama" : "Notes"]: ""
        });

        curTxs.forEach(t => {
          sheetRows.push({
            [isTr ? "Tarih" : "Date"]: t.date ? new Date(t.date).toLocaleDateString("tr-TR") : "",
            [isTr ? "Tür" : "Type"]: t.type === "income" ? (isTr ? "GELİR (+)" : "INCOME (+)") : (isTr ? "GİDER (-)" : "EXPENSE (-)"),
            [isTr ? "Kategori" : "Category"]: getCategoryLabel(t.type, t.category),
            [isTr ? "İşlem Başlığı" : "Title"]: t.title || "",
            [isTr ? "İlgili Kişi / Kurum" : "Contact"]: t.contact_name || "-",
            [isTr ? "Belge No" : "Ref No"]: t.reference_no || "-",
            [isTr ? "Giriş (+)" : "Credit (+)"]: t.type === "income" ? Number(Number(t.amount).toFixed(2)) : 0,
            [isTr ? "Çıkış (-)" : "Debit (-)"]: t.type === "expense" ? Number(Number(t.amount).toFixed(2)) : 0,
            [isTr ? "Para Birimi" : "Currency"]: cur,
            [isTr ? "Kasa Bakiyesi" : "Balance"]: Number(t.runningBalance.toFixed(2)),
            [isTr ? "Açıklama" : "Notes"]: [t.property_title, t.description].filter(Boolean).join(" | ")
          });
        });

        // Closing summary row
        sheetRows.push({
          [isTr ? "Tarih" : "Date"]: endDate || (isTr ? "Dönem Sonu" : "Closing"),
          [isTr ? "Tür" : "Type"]: isTr ? "TOPLAM / BAKİYE" : "CLOSING TOTAL",
          [isTr ? "Kategori" : "Category"]: "-",
          [isTr ? "İşlem Başlığı" : "Title"]: isTr ? "Dönem Sonu Toplam & Net Kasa Bakiyesi" : "Period Totals & Closing Balance",
          [isTr ? "İlgili Kişi / Kurum" : "Contact"]: "-",
          [isTr ? "Belge No" : "Ref No"]: "-",
          [isTr ? "Giriş (+)" : "Credit (+)"]: Number(curSummary.periodIncome.toFixed(2)),
          [isTr ? "Çıkış (-)" : "Debit (-)"]: Number(curSummary.periodExpense.toFixed(2)),
          [isTr ? "Para Birimi" : "Currency"]: cur,
          [isTr ? "Kasa Bakiyesi" : "Balance"]: Number(curSummary.closingBalance.toFixed(2)),
          [isTr ? "Açıklama" : "Notes"]: `${isTr ? "Dönem Net" : "Period Net"}: ${curSummary.periodNet >= 0 ? "+" : ""}${curSummary.periodNet.toFixed(2)} ${cur}`
        });

        const wsCur = XLSX.utils.json_to_sheet(sheetRows);
        wsCur["!cols"] = [
          { wch: 13 }, { wch: 14 }, { wch: 25 }, { wch: 34 }, { wch: 20 },
          { wch: 14 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 35 }
        ];
        XLSX.utils.book_append_sheet(wb, wsCur, `${cur} Ekstresi`);
      });

      const fileDate = new Date().toISOString().split("T")[0];
      const curSuffix = currencyFilter !== "all" ? `_${currencyFilter}` : "_Tum_Kurlar";
      XLSX.writeFile(wb, `Kasa_Gelir_Gider_Ekstresi${curSuffix}_${fileDate}.xlsx`);
      toast.success(isTr ? "Excel kasa ekstresi başarıyla indirildi." : "Excel cash statement downloaded.");
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error(isTr ? "Excel oluşturulurken bir hata oluştu." : "Failed to export Excel file.");
    }
  };

  // Printable Statement View (via hidden iframe so window.open is never needed)
  const handlePrintStatement = () => {
    const periodLabel = (startDate || endDate)
      ? `${startDate ? new Date(startDate).toLocaleDateString("tr-TR") : "Başlangıç"} — ${endDate ? new Date(endDate).toLocaleDateString("tr-TR") : "Bugün"}`
      : "Tüm Zamanlar";
    const activeCurrencies = currencyFilter === "all" ? SUPPORTED_CURRENCIES : [currencyFilter as any];
    const chronologicalRows = [...filteredTransactions].reverse();

    const html = `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8" />
        <title>Gelir - Gider & Kasa Ekstresi</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 20px; font-size: 11px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 14px; }
          .title { font-size: 16px; font-weight: 800; text-transform: uppercase; }
          .subtitle { font-size: 11px; color: #475569; margin-top: 2px; }
          .cards { display: grid; grid-template-columns: repeat(${activeCurrencies.length}, 1fr); gap: 10px; margin-bottom: 16px; }
          .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 10px; background: #f8fafc; }
          .card-cur { font-weight: 800; font-size: 11px; color: #334155; margin-bottom: 4px; }
          .card-bal { font-weight: 900; font-size: 14px; margin-bottom: 4px; }
          .card-row { display: flex; justify-content: space-between; font-size: 10px; color: #475569; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th { background: #0f172a; color: #fff; text-align: left; padding: 6px 8px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.04em; }
          td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 10px; vertical-align: top; }
          .right { text-align: right; }
          .inc { color: #059669; font-weight: 700; }
          .exp { color: #dc2626; font-weight: 700; }
          .bal { font-weight: 800; color: #0f172a; }
          @media print { body { margin: 10mm; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">GELİR - GİDER & KASA EKSTRESİ</div>
            <div class="subtitle">Dönem: ${periodLabel} | Para Birimi: ${currencyFilter === "all" ? "Tüm Para Birimleri" : currencyFilter}</div>
          </div>
          <div style="text-align:right;font-size:10px;color:#475569;">
            Rapor Tarihi: ${new Date().toLocaleString("tr-TR")}<br/>
            Toplam Kayıt: ${chronologicalRows.length} işlem
          </div>
        </div>
        <div class="cards">
          ${activeCurrencies.map(cur => {
            const s = statementAnalysis.summaryByCurrency[cur];
            const sym = getCurrencySymbol(cur);
            return `
              <div class="card">
                <div class="card-cur">${cur} (${sym}) KASA HESABI</div>
                <div class="card-bal">${s.closingBalance < 0 ? "-" : ""}${formatMoney(s.closingBalance, cur)}</div>
                <div class="card-row"><span>Devreden:</span><span>${s.openingBalance < 0 ? "-" : ""}${formatMoney(s.openingBalance, cur)}</span></div>
                <div class="card-row"><span>Dönem Gelir (+):</span><span class="inc">+${formatMoney(s.periodIncome, cur)}</span></div>
                <div class="card-row"><span>Dönem Gider (-):</span><span class="exp">-${formatMoney(s.periodExpense, cur)}</span></div>
              </div>
            `;
          }).join("")}
        </div>
        <table>
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Başlık / Açıklama</th>
              <th>Kategori</th>
              <th>Kişi / Belge</th>
              <th class="right">Giriş (+)</th>
              <th class="right">Çıkış (-)</th>
              <th class="right">Kümülatif Bakiye</th>
            </tr>
          </thead>
          <tbody>
            ${chronologicalRows.map(t => `
              <tr>
                <td>${t.date ? new Date(t.date).toLocaleDateString("tr-TR") : "-"}</td>
                <td>
                  <strong>${t.title || ""}</strong>
                  ${t.property_title && t.property_title.trim() !== "-" ? `<div style="color:#4f46e5;font-size:9px;">İlan/Araç: ${t.property_title}</div>` : ""}
                  ${t.description ? `<div style="color:#64748b;font-size:9px;">${t.description}</div>` : ""}
                </td>
                <td>${getCategoryLabel(t.type, t.category)}</td>
                <td>${[t.contact_name, t.reference_no].filter(Boolean).join(" / ") || "-"}</td>
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

  // Chart data: Distribution of Income vs Expense by Category for the active period
  const categoryChartData = useMemo(() => {
    const incomeCats: Record<string, number> = {};
    const expenseCats: Record<string, number> = {};
    const rateToGbp: Record<string, number> = { GBP: 1, TRY: 0.024, EUR: 0.85, USD: 0.79 };

    filteredTransactions.forEach(t => {
      const valGbp = Number(t.amount) * (rateToGbp[t.currency] || 1);
      if (t.type === "income") {
        incomeCats[t.category] = (incomeCats[t.category] || 0) + valGbp;
      } else {
        expenseCats[t.category] = (expenseCats[t.category] || 0) + valGbp;
      }
    });

    const incomeList = Object.entries(incomeCats).map(([cat, val]) => {
      const catObj = categories.income.find(c => c.id === cat) || { label: cat };
      return { name: catObj.label, value: Math.round(val) };
    });

    const expenseList = Object.entries(expenseCats).map(([cat, val]) => {
      const catObj = categories.expense.find(c => c.id === cat) || { label: cat };
      return { name: catObj.label, value: Math.round(val) };
    });

    return { incomeList, expenseList };
  }, [filteredTransactions, categories]);

  const COLORS_INCOME = ["#059669", "#10B981", "#34D399", "#6EE7B7", "#A7F3D0"];
  const COLORS_EXPENSE = ["#DC2626", "#EF4444", "#F87171", "#FCA5A5", "#FEE2E2", "#FFC0CB"];

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

  return (
    <div className="space-y-4">
      {/* Single Integrated Module Header & Action Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
              {isTr ? "Gelir - Gider & Kasa Takibi (Çoklu Döviz Ekstresi)" : "Income, Expense & Multi-Currency Cash Ledger"}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {isTr 
                ? "Tarih aralığına ve para birimine göre kasa hareketlerinizi, devreden bakiyeleri ve ekstrelerinizi inceleyin."
                : "Monitor cash movements, opening balances, and statements by date range and currency."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCharts(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              showCharts
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            {isTr ? "Grafik Analiz" : "Charts"}
          </button>

          <button
            type="button"
            onClick={handlePrintStatement}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all"
            title={isTr ? "Ekstreyi Yazdır / PDF" : "Print / PDF Statement"}
          >
            <Printer className="w-4 h-4 text-slate-600" />
            {isTr ? "Ekstre Yazdır / PDF" : "Print / PDF"}
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {isTr ? "Excel Ekstre İndir (.xlsx)" : "Export Excel (.xlsx)"}
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2 px-4 rounded-xl shadow-xs transition-all active:scale-95 text-xs"
          >
            <Plus className="w-4 h-4" />
            {isTr ? "Yeni Gelir / Gider Ekle" : "New Entry"}
          </button>
        </div>
      </div>

      {/* Date Range & Period Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
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
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                datePreset === p.id
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100 hover:bg-slate-200/70 text-slate-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">{isTr ? "Başlangıç:" : "From:"}</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset("custom");
              }}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none w-28"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">{isTr ? "Bitiş:" : "To:"}</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset("custom");
              }}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none w-28"
            />
          </div>

          {(startDate || endDate || currencyFilter !== "all" || typeFilter !== "all" || categoryFilter !== "all" || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                handleSelectDatePreset("all");
                setCurrencyFilter("all");
                setTypeFilter("all");
                setCategoryFilter("all");
                setSearchQuery("");
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
              title={isTr ? "Tüm Filtreleri Temizle" : "Reset All Filters"}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {isTr ? "Filtreleri Sıfırla" : "Reset"}
            </button>
          )}
        </div>
      </div>

      {/* Interactive Per-Currency Statement Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {SUPPORTED_CURRENCIES.map((cur) => {
          const data = statementAnalysis.summaryByCurrency[cur];
          const sym = getCurrencySymbol(cur);
          const isNetNegative = data.closingBalance < 0;
          const isSelected = currencyFilter === cur;

          return (
            <div 
              key={cur}
              onClick={() => setCurrencyFilter(prev => prev === cur ? "all" : cur)}
              className={`cursor-pointer rounded-2xl p-4 transition-all border ${
                isSelected
                  ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-indigo-500/30"
                  : "bg-white border-slate-200/80 hover:border-indigo-300 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-black tracking-wider uppercase ${isSelected ? "text-indigo-300" : "text-slate-500"}`}>
                    {cur} {isTr ? "KASA EKSTRESİ" : "ACCOUNT"}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-lg text-[11px] font-black uppercase ${
                  isSelected
                    ? "bg-white/15 text-white"
                    : isNetNegative ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-700"
                }`}>
                  {sym} {cur} • {data.txCount} {isTr ? "İşlem" : "Tx"}
                </span>
              </div>

              <div className="mb-3">
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                  {(startDate || endDate) ? (isTr ? "DÖNEM SONU KASA BAKİYESİ" : "CLOSING BALANCE") : (isTr ? "GÜNCEL NET KASA BAKİYESİ" : "NET CASH BALANCE")}
                </span>
                <div className={`text-xl font-black tracking-tight ${
                  isSelected
                    ? (isNetNegative ? "text-rose-300" : "text-emerald-300")
                    : (isNetNegative ? "text-rose-600" : "text-emerald-600")
                }`}>
                  {isNetNegative ? "-" : ""}{sym}{Math.abs(data.closingBalance).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {startDate && (
                <div className={`flex items-center justify-between text-[11px] py-1 px-2 rounded-lg mb-2 ${
                  isSelected ? "bg-white/10 text-slate-200" : "bg-slate-50 text-slate-600"
                }`}>
                  <span className="font-semibold">{isTr ? "Devreden Bakiye:" : "Opening:"}</span>
                  <span className="font-black">
                    {data.openingBalance < 0 ? "-" : ""}{sym}{Math.abs(data.openingBalance).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <div className={`grid grid-cols-2 gap-2 pt-2 border-t ${isSelected ? "border-white/15" : "border-slate-100"}`}>
                <div>
                  <span className={`text-[9px] font-bold block tracking-wider uppercase ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                    {isTr ? "DÖNEM GELİR (+)" : "PERIOD INCOME"}
                  </span>
                  <span className={`text-xs font-black flex items-center gap-0.5 mt-0.5 ${isSelected ? "text-emerald-300" : "text-emerald-600"}`}>
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                    +{sym}{data.periodIncome.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className={`text-[9px] font-bold block tracking-wider uppercase ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                    {isTr ? "DÖNEM GİDER (-)" : "PERIOD EXPENSE"}
                  </span>
                  <span className={`text-xs font-black flex items-center gap-0.5 mt-0.5 ${isSelected ? "text-rose-300" : "text-rose-600"}`}>
                    <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
                    -{sym}{data.periodExpense.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Collapsible Visual Analytics Charts */}
      {showCharts && transactions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              {isTr ? "Gelirlerin Kategori Dağılımı (GBP Bazlı)" : "Income Distribution (GBP Normalized)"}
            </h3>
            {categoryChartData.incomeList.length > 0 ? (
              <div className="h-52 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="w-full sm:w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData.incomeList}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={68}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoryChartData.incomeList.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS_INCOME[index % COLORS_INCOME.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `£${v}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 space-y-1.5">
                  {categoryChartData.incomeList.map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: COLORS_INCOME[idx % COLORS_INCOME.length] }}
                        />
                        <span className="font-semibold text-slate-600 truncate max-w-[150px]">{entry.name}</span>
                      </div>
                      <span className="font-bold text-slate-800">£{Math.round(entry.value || 0).toLocaleString("tr-TR")}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-xs text-slate-400 font-medium">
                {isTr ? "Seçili dönemde gelir kaydı bulunmuyor." : "No income records in selected period."}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              {isTr ? "Giderlerin Kategori Dağılımı (GBP Bazlı)" : "Expense Distribution (GBP Normalized)"}
            </h3>
            {categoryChartData.expenseList.length > 0 ? (
              <div className="h-52 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="w-full sm:w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData.expenseList}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={68}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoryChartData.expenseList.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS_EXPENSE[index % COLORS_EXPENSE.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `£${v}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 space-y-1.5">
                  {categoryChartData.expenseList.map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: COLORS_EXPENSE[idx % COLORS_EXPENSE.length] }}
                        />
                        <span className="font-semibold text-slate-600 truncate max-w-[150px]">{entry.name}</span>
                      </div>
                      <span className="font-bold text-slate-800">£{Math.round(entry.value || 0).toLocaleString("tr-TR")}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-xs text-slate-400 font-medium">
                {isTr ? "Seçili dönemde gider kaydı bulunmuyor." : "No expense records in selected period."}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Statement Ledger Table & Currency Statement Tabs */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
        {/* Currency Statement Tabs & Filter Controls */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          {/* Currency Statement Selector Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrencyFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                currencyFilter === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              {isTr ? "Tüm Kurlar Ekstresi" : "All Currencies"} ({statementAnalysis.periodTransactionsDesc.length})
            </button>
            {SUPPORTED_CURRENCIES.map(cur => {
              const count = statementAnalysis.summaryByCurrency[cur]?.txCount || 0;
              return (
                <button
                  key={cur}
                  type="button"
                  onClick={() => setCurrencyFilter(cur)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                    currencyFilter === cur
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  <span>{getCurrencySymbol(cur)} {cur} {isTr ? "Ekstresi" : "Ledger"}</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                    currencyFilter === cur ? "bg-white/20 text-white" : "bg-white text-slate-600"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search, Flow Type & Category Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={isTr ? "Başlık, ilan, kişi, belge ara..." : "Search statement..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-48 font-medium"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as any);
                setCategoryFilter("all");
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">{isTr ? "Tüm İşlem Türleri" : "All Types"}</option>
              <option value="income">{isTr ? "Sadece Gelirler (+)" : "Incomes (+)"}</option>
              <option value="expense">{isTr ? "Sadece Giderler (-)" : "Expenses (-)"}</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 max-w-[190px]"
            >
              <option value="all">{isTr ? "Tüm Kategoriler" : "All Categories"}</option>
              {(typeFilter === "all" || typeFilter === "income") && (
                <optgroup label={isTr ? "Gelir Kategorileri" : "Income Categories"}>
                  {categories.income.map(c => (
                    <option key={`inc-${c.id}`} value={c.id}>{c.label}</option>
                  ))}
                </optgroup>
              )}
              {(typeFilter === "all" || typeFilter === "expense") && (
                <optgroup label={isTr ? "Gider Kategorileri" : "Expense Categories"}>
                  {categories.expense.map(c => (
                    <option key={`exp-${c.id}`} value={c.id}>{c.label}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        </div>

        {/* Entries Statement Table */}
        <div className="overflow-x-auto">
          {loadingFinances ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2.5">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-600"></div>
              <span className="text-xs text-slate-500 font-medium">
                {isTr ? "Kasa hareketleri yükleniyor..." : "Loading cash statement..."}
              </span>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-2.5 text-slate-400">
              <Wallet className="w-10 h-10 text-slate-300 stroke-[1.5]" />
              <div className="text-sm font-bold text-slate-600">
                {isTr ? "Seçili kriterlere uygun kasa hareketi bulunamadı" : "No matching cash transactions found"}
              </div>
              <div className="text-xs text-slate-400 max-w-md text-center">
                {isTr 
                  ? "Tarih aralığını / döviz filtresini değiştirebilir veya 'Yeni Gelir / Gider Ekle' butonu ile ilk kasa işleminizi kaydedebilirsiniz." 
                  : "Adjust your date/currency filters or click 'New Entry' to record a transaction."}
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[860px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="py-2.5 px-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">{isTr ? "TARİH / BELGE" : "DATE / REF"}</th>
                  <th className="py-2.5 px-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">{isTr ? "İŞLEM BAŞLIĞI / İLAN / CARİ" : "TITLE / LISTING / CONTACT"}</th>
                  <th className="py-2.5 px-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">{isTr ? "KATEGORİ & ÖDEME" : "CATEGORY & METHOD"}</th>
                  <th className="py-2.5 px-3 text-[10px] font-black text-slate-500 uppercase tracking-wider text-center">{isTr ? "DOVİZ" : "CUR"}</th>
                  <th className="py-2.5 px-3 text-[10px] font-black text-emerald-700 uppercase tracking-wider text-right">{isTr ? "GİRİŞ (GELİR +)" : "CREDIT (+)"}</th>
                  <th className="py-2.5 px-3 text-[10px] font-black text-rose-700 uppercase tracking-wider text-right">{isTr ? "ÇIKIŞ (GİDER -)" : "DEBIT (-)"}</th>
                  <th className="py-2.5 px-3 text-[10px] font-black text-slate-700 uppercase tracking-wider text-right">{isTr ? "KASA BAKİYESİ" : "RUNNING BALANCE"}</th>
                  <th className="py-2.5 px-3 text-[10px] font-black text-slate-500 uppercase tracking-wider text-center w-24">{isTr ? "İŞLEM" : "ACTION"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((t) => {
                  const sym = getCurrencySymbol(t.currency);
                  const isIncome = t.type === "income";
                  const dateStr = t.date ? new Date(t.date).toLocaleDateString(isTr ? "tr-TR" : "en-US", { year: "numeric", month: "2-digit", day: "2-digit" }) : "-";
                  const cleanPropTitle = t.property_title && t.property_title.trim() !== "-" ? t.property_title.trim() : null;
                  const isNegativeRunning = t.runningBalance < 0;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap align-top">
                        <div className="text-xs font-bold text-slate-800">{dateStr}</div>
                        {t.reference_no && (
                          <div className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                            <Receipt className="w-3 h-3 text-slate-400" />
                            <span>#{t.reference_no}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3 align-top">
                        <div className="space-y-0.5 max-w-md">
                          <div className="text-xs font-black text-slate-900">{t.title}</div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {t.contact_name && (
                              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 rounded-md px-1.5 py-0.5 inline-flex items-center gap-1">
                                <User className="w-2.5 h-2.5 text-slate-500" />
                                {t.contact_name}
                              </span>
                            )}
                            {cleanPropTitle && (
                              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-md px-1.5 py-0.5 inline-flex items-center gap-1">
                                <Building2 className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate max-w-[240px]">{cleanPropTitle}</span>
                              </span>
                            )}
                          </div>
                          {t.description && (
                            <div className="text-[11px] text-slate-500 line-clamp-2">
                              {t.description}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 align-top">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wide ${
                          isIncome ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isIncome ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                          {getCategoryLabel(t.type, t.category)}
                        </span>
                        <div className="text-[10px] font-semibold text-slate-400 mt-0.5">
                          {getPaymentMethodLabel(t.payment_method)}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-center align-top whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-black text-[11px]">
                          {t.currency}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right align-top whitespace-nowrap">
                        {isIncome ? (
                          <span className="text-xs font-black text-emerald-600">
                            +{sym}{Number(t.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300 font-bold">—</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right align-top whitespace-nowrap">
                        {!isIncome ? (
                          <span className="text-xs font-black text-rose-600">
                            -{sym}{Number(t.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300 font-bold">—</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right align-top whitespace-nowrap">
                        <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                          isNegativeRunning ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-900"
                        }`}>
                          {isNegativeRunning ? "-" : ""}{sym}{Math.abs(t.runningBalance).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center align-top whitespace-nowrap">
                        {confirmDeleteId === t.id ? (
                          <div className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => handleDelete(t.id)}
                              className="px-1.5 py-1 bg-rose-600 text-white rounded-md text-[10px] font-black hover:bg-rose-700"
                              title={isTr ? "Silmeyi Onayla" : "Confirm Delete"}
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-1.5 py-1 text-slate-600 hover:bg-slate-200 rounded-md text-[10px] font-bold"
                              title={isTr ? "İptal" : "Cancel"}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(t)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title={isTr ? "Düzenle" : "Edit"}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(t.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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

              {/* Statement Summary Footer per Active Currency */}
              <tfoot className="bg-slate-900 text-white">
                {Object.entries(filteredTotalsByCurrency).map(([cur, tot]) => {
                  const sym = getCurrencySymbol(cur);
                  const closingBal = statementAnalysis.summaryByCurrency[cur]?.closingBalance ?? tot.net;
                  return (
                    <tr key={`foot-${cur}`} className="border-t border-slate-800 text-xs">
                      <td colSpan={3} className="py-2.5 px-3 font-black uppercase tracking-wider text-slate-300">
                        {cur} {isTr ? "DÖNEM EKSTRE TOPLAMI" : "STATEMENT TOTAL"} ({tot.count} {isTr ? "İşlem" : "Tx"})
                      </td>
                      <td className="py-2.5 px-3 text-center font-black text-indigo-300">{cur}</td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-400">
                        +{sym}{tot.income.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-rose-400">
                        -{sym}{tot.expense.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-white">
                        {closingBal < 0 ? "-" : ""}{sym}{Math.abs(closingBal).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3"></td>
                    </tr>
                  );
                })}
              </tfoot>
            </table>
          )}
        </div>
      </div>

      {/* Add / Edit Transaction Modal (Compact High-Density Operator Standard) */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="bg-white rounded-2xl w-full max-w-xl p-5 shadow-2xl space-y-4 border border-slate-200 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-indigo-600" />
                  {editingTx 
                    ? (isTr ? "Finansal Kaydı Düzenle" : "Edit Financial Record")
                    : (isTr ? "Yeni Gelir / Gider Kaydı Oluştur" : "New Income / Expense Record")}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingTx(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Transaction Type Selection */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const defaultCat = activeAutomotive ? "car_sales" : "commission";
                      setFormData(prev => ({ ...prev, type: "income", category: defaultCat }));
                    }}
                    className={`py-2.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                      formData.type === "income"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    {isTr ? "GELİR GİRİŞİ (+)" : "INCOME (+)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const defaultCat = activeAutomotive ? "car_purchase" : "advertising";
                      setFormData(prev => ({ ...prev, type: "expense", category: defaultCat }));
                    }}
                    className={`py-2.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                      formData.type === "expense"
                        ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <TrendingDown className="w-4 h-4" />
                    {isTr ? "GİDER ÇIKIŞI (-)" : "EXPENSE (-)"}
                  </button>
                </div>

                {/* Row 1: Title & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-8 space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-0.5 block">
                      {isTr ? "İŞLEM BAŞLIĞI *" : "TRANSACTION TITLE *"}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={formData.type === "income" ? (isTr ? "Örn: Girne 2+1 Villa Satış Komisyonu" : "e.g. Property Sales Commission") : (isTr ? "Örn: Ofis Kirası / Portal İlan Ödemesi" : "e.g. Office Rent")}
                      value={formData.title}
                      onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="sm:col-span-4 space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-0.5 block">
                      {isTr ? "İŞLEM TARİHİ *" : "DATE *"}
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                {/* Row 2: Amount + Compact Currency + Payment Method (Rule 13 Bounded Width) */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-5 space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-0.5 block">
                      {isTr ? "TUTAR *" : "AMOUNT *"}
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) => setFormData(p => ({ ...p, amount: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-l-xl font-black text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData(p => ({ ...p, currency: e.target.value }))}
                        className="w-24 shrink-0 px-2.5 py-2 bg-slate-900 text-white border border-slate-900 rounded-r-xl font-black text-xs focus:outline-none"
                      >
                        <option value="GBP">GBP (£)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                        <option value="TRY">TRY (₺)</option>
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-4 space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-0.5 block">
                      {isTr ? "KATEGORİ" : "CATEGORY"}
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {categories[formData.type].map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3 space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-0.5 block">
                      {isTr ? "ÖDEME YÖNTEMİ" : "METHOD"}
                    </label>
                    <select
                      value={formData.payment_method}
                      onChange={(e) => setFormData(p => ({ ...p, payment_method: e.target.value }))}
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {paymentMethods.map(pm => (
                        <option key={pm.id} value={pm.id}>{pm.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 3: Contact Name & Reference / Receipt No */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-8 space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-0.5 block">
                      {isTr ? "İLGİLİ KİŞİ / KURUM / MÜŞTERİ (İSTEĞE BAĞLI)" : "CONTACT / CLIENT NAME"}
                    </label>
                    <input
                      type="text"
                      placeholder={isTr ? "Örn: Ahmet Yılmaz / ABC İnşaat" : "e.g. John Doe"}
                      value={formData.contact_name}
                      onChange={(e) => setFormData(p => ({ ...p, contact_name: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="sm:col-span-4 space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-0.5 block">
                      {isTr ? "BELGE / MAKBUZ NO" : "REF / RECEIPT NO"}
                    </label>
                    <input
                      type="text"
                      placeholder={isTr ? "Örn: MKB-2026-01" : "e.g. REC-001"}
                      value={formData.reference_no}
                      onChange={(e) => setFormData(p => ({ ...p, reference_no: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                {/* Row 4: Linked Portfolio Item Search & Select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-0.5 block">
                    {isTr ? `İLİŞKİLİ ${activeAutomotive ? "ARAÇ" : "EMLAK İLANI"} (İSTEĞE BAĞLI)` : `LINKED ${activeAutomotive ? "VEHICLE" : "PROPERTY"} (OPTIONAL)`}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        placeholder={isTr ? "Portföyde filtrele..." : "Filter portfolio..."}
                        value={portfolioSearch}
                        onChange={(e) => setPortfolioSearch(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div className="sm:col-span-7">
                      <select
                        value={formData.property_id}
                        onChange={(e) => setFormData(p => ({ ...p, property_id: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="">{isTr ? "— İlişkili Portföy Yok —" : "— No Linked Item —"}</option>
                        {filteredPortfolioItems.map(item => (
                          <option key={item.id} value={item.id}>
                            {activeAutomotive 
                              ? `${item.plate || ""} - ${item.brand || ""} ${item.model || ""} (${item.year || ""})` 
                              : `${item.reference_no ? `[${item.reference_no}] ` : ""}${item.title} (${Math.round(Number(item.price) || 0).toLocaleString("tr-TR")} ${item.currency || "GBP"})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Row 5: Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-0.5 block">
                    {isTr ? "AÇIKLAMA / NOTLAR" : "NOTES & DETAILS"}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={isTr ? "İşlemle ilgili ek detay veya açıklama..." : "Add transaction notes..."}
                    value={formData.description}
                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingTx(null);
                    }}
                    className="px-4 py-2.5 rounded-xl hover:bg-slate-100 text-slate-600 font-bold text-xs uppercase transition-all"
                  >
                    {isTr ? "VAZGEÇ" : "CANCEL"}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm"
                  >
                    {editingTx ? (isTr ? "DEĞİŞİKLİKLERİ KAYDET" : "UPDATE RECORD") : (isTr ? "İŞLEMİ KASAYA KAYDET" : "SAVE TRANSACTION")}
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
