import React, { useState, useEffect } from "react";
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Filter, 
  Calendar, 
  Tag, 
  FileText, 
  CircleDollarSign, 
  Coins, 
  Info, 
  Search,
  CheckCircle,
  X,
  PlusCircle,
  Wallet
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { usePortfolioFinances, PortfolioTransaction } from "../../hooks/usePortfolioFinances";
import { useRealEstate } from "../../hooks/useRealEstate";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";

interface PortfolioFinancesTabProps {
  storeId: number;
}

export default function PortfolioFinancesTab({ storeId }: PortfolioFinancesTabProps) {
  const { lang } = useLanguage();
  const isTr = lang === 'tr';

  const { properties, loading: loadingProperties } = useRealEstate(storeId);
  const { transactions, loading: loadingFinances, addTransaction, deleteTransaction } = usePortfolioFinances(storeId);

  // States
  const [showAddModal, setShowAddModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currencyFilter, setCurrencyFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    type: "income" as "income" | "expense",
    category: "commission",
    title: "",
    amount: "",
    currency: "GBP", // Default to GBP since Cyprus properties are heavily GBP-based
    date: new Date().toISOString().split("T")[0],
    property_id: "" as string | number,
    description: ""
  });

  const categories = {
    income: [
      { id: "commission", label: isTr ? "Emlak Satış Komisyonu" : "Real Estate Sales Commission" },
      { id: "rental_placement", label: isTr ? "Kiralama Hizmet Bedeli" : "Rental Placement Fee" },
      { id: "consulting", label: isTr ? "Danışmanlık Hizmet Bedeli" : "Consulting Service Fee" },
      { id: "other", label: isTr ? "Diğer Gelirler" : "Other Income" }
    ],
    expense: [
      { id: "advertising", label: isTr ? "Portal İlan Ücretleri (Sahibinden vb.)" : "Listing Portal Fees" },
      { id: "rent_utilities", label: isTr ? "Ofis Kirası & Faturalar" : "Office Rent & Utilities" },
      { id: "agent_commission", label: isTr ? "Personel / Danışman Primi" : "Agent/Staff Commission" },
      { id: "marketing", label: isTr ? "Tanıtım, Afiş & Tabela Gideri" : "Marketing, Banner & Printing" },
      { id: "vehicle", label: isTr ? "Ulaşım, Taşıt & Yakıt Gideri" : "Transportation & Fuel" },
      { id: "other", label: isTr ? "Diğer Giderler" : "Other Expenses" }
    ]
  };

  // Auto-set category when type changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      category: prev.type === "income" ? "commission" : "advertising"
    }));
  }, [formData.type]);

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || Number(formData.amount) <= 0) {
      toast.error(isTr ? "Lütfen tüm zorunlu alanları doldurun." : "Please fill out all required fields.");
      return;
    }

    try {
      await addTransaction({
        type: formData.type,
        category: formData.category,
        title: formData.title,
        amount: Number(formData.amount),
        currency: formData.currency,
        date: new Date(formData.date).toISOString(),
        property_id: formData.property_id ? Number(formData.property_id) : null,
        description: formData.description
      });
      toast.success(isTr ? "Finansal kayıt başarıyla eklendi." : "Financial record added successfully.");
      setShowAddModal(false);
      setFormData({
        type: "income",
        category: "commission",
        title: "",
        amount: "",
        currency: "GBP",
        date: new Date().toISOString().split("T")[0],
        property_id: "",
        description: ""
      });
    } catch (err: any) {
      toast.error(isTr ? "Kayıt eklenirken hata oluştu." : "Error adding financial record.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(isTr ? "Bu finansal kaydı silmek istediğinize emin misiniz?" : "Are you sure you want to delete this financial record?")) return;
    try {
      await deleteTransaction(id);
      toast.success(isTr ? "Kayıt başarıyla silindi." : "Record deleted successfully.");
    } catch (err) {
      toast.error(isTr ? "Kayıt silinirken hata oluştu." : "Error deleting record.");
    }
  };

  // Financial calculations per currency
  const financials = (() => {
    const totals: Record<string, { income: number; expense: number; net: number }> = {
      GBP: { income: 0, expense: 0, net: 0 },
      TRY: { income: 0, expense: 0, net: 0 },
      EUR: { income: 0, expense: 0, net: 0 },
      USD: { income: 0, expense: 0, net: 0 }
    };

    transactions.forEach(t => {
      const cur = t.currency || "GBP";
      if (!totals[cur]) {
        totals[cur] = { income: 0, expense: 0, net: 0 };
      }
      const amt = Number(t.amount);
      if (t.type === "income") {
        totals[cur].income += amt;
      } else {
        totals[cur].expense += amt;
      }
      totals[cur].net = totals[cur].income - totals[cur].expense;
    });

    return totals;
  })();

  // Filtered transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesType = typeFilter === "all" || t.type === typeFilter;
    const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
    const matchesCurrency = currencyFilter === "all" || t.currency === currencyFilter;
    const matchesSearch = !searchQuery || 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.property_title && t.property_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesCategory && matchesCurrency && matchesSearch;
  });

  // Chart data: Distribution of Income vs Expense by Category
  const categoryChartData = (() => {
    const incomeCats: Record<string, number> = {};
    const expenseCats: Record<string, number> = {};

    transactions.forEach(t => {
      // For chart, we convert to GBP briefly as standard baseline or show overall value
      // Simple approximate conversion rates to display everything in a standard baseline "GBP"
      const rateToGbp: Record<string, number> = { GBP: 1, TRY: 0.024, EUR: 0.83, USD: 0.79 };
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
  })();

  const COLORS_INCOME = ["#059669", "#10B981", "#34D399", "#6EE7B7", "#A7F3D0"];
  const COLORS_EXPENSE = ["#DC2626", "#EF4444", "#F87171", "#FCA5A5", "#FEE2E2", "#FFC0CB"];

  const getCategoryLabel = (type: "income" | "expense", id: string) => {
    const list = type === "income" ? categories.income : categories.expense;
    return list.find(c => c.id === id)?.label || id;
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

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Coins className="w-7 h-7 text-indigo-600" />
            {isTr ? "Gelir - Gider & Kasa Takibi" : "Income, Expenses & Cash Flow"}
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            {isTr 
              ? "Portföy komisyonlarınızı, kiralama gelirlerinizi ve operasyonel giderlerinizi tek panelden yönetin."
              : "Track listing commissions, rent placements, and office expenses seamlessly in multiple currencies."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-indigo-100 transition-all duration-150 active:scale-95 text-sm"
        >
          <Plus className="w-5 h-5" />
          {isTr ? "Yeni Gelir / Gider Kaydı" : "Add Income / Expense"}
        </button>
      </div>

      {/* Financial Summaries Carousel / Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(financials).map(([cur, data]) => {
          const sym = getCurrencySymbol(cur);
          const isNetNegative = data.net < 0;
          return (
            <div 
              key={cur}
              className="bg-white border border-slate-100 rounded-[1.75rem] p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-400 tracking-widest uppercase">{cur} HESABI</span>
                <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase ${
                  isNetNegative ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {sym} {cur}
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {isTr ? "KASA NET BAKİYE" : "NET CASH BALANCE"}
                </label>
                <div className={`text-2xl font-black ${isNetNegative ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {isNetNegative ? "-" : ""}{sym}{Math.abs(data.net).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block tracking-wider uppercase">
                    {isTr ? "TOPLAM GELİR" : "TOTAL INCOME"}
                  </span>
                  <span className="text-xs font-black text-emerald-600 flex items-center gap-0.5 mt-0.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {sym}{data.income.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block tracking-wider uppercase">
                    {isTr ? "TOPLAM GİDER" : "TOTAL EXPENSES"}
                  </span>
                  <span className="text-xs font-black text-rose-500 flex items-center gap-0.5 mt-0.5">
                    <TrendingDown className="w-3.5 h-3.5" />
                    {sym}{data.expense.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Analytics Charts */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income Chart */}
          <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              {isTr ? "Gelirlerin Kategori Dağılımı (Oransal GBP)" : "Income Distribution (Normalized GBP)"}
            </h3>
            {categoryChartData.incomeList.length > 0 ? (
              <div className="h-64 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="w-full sm:w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData.incomeList}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoryChartData.incomeList.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS_INCOME[index % COLORS_INCOME.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `£${v}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 space-y-2">
                  {categoryChartData.incomeList.map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORS_INCOME[idx % COLORS_INCOME.length] }}
                        />
                        <span className="font-semibold text-slate-600 truncate max-w-[140px]">{entry.name}</span>
                      </div>
                      <span className="font-bold text-slate-800">£{Math.round(entry.value || 0).toLocaleString('tr-TR')}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400 font-medium">
                {isTr ? "Yeterli gelir kaydı bulunmuyor." : "No income records available."}
              </div>
            )}
          </div>

          {/* Expense Chart */}
          <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              {isTr ? "Giderlerin Kategori Dağılımı (Oransal GBP)" : "Expense Distribution (Normalized GBP)"}
            </h3>
            {categoryChartData.expenseList.length > 0 ? (
              <div className="h-64 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="w-full sm:w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData.expenseList}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoryChartData.expenseList.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS_EXPENSE[index % COLORS_EXPENSE.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `£${v}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 space-y-2">
                  {categoryChartData.expenseList.map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORS_EXPENSE[idx % COLORS_EXPENSE.length] }}
                        />
                        <span className="font-semibold text-slate-600 truncate max-w-[140px]">{entry.name}</span>
                      </div>
                      <span className="font-bold text-slate-800">£{Math.round(entry.value || 0).toLocaleString('tr-TR')}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400 font-medium">
                {isTr ? "Yeterli gider kaydı bulunmuyor." : "No expense records available."}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transaction Records Management Panel */}
      <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-50">
          <h3 className="text-base font-black text-slate-800 tracking-tight">
            {isTr ? "İşlem Geçmişi" : "Transaction Ledger"}
          </h3>

          {/* Filters section */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={isTr ? "Kayıtlarda ara..." : "Search ledger..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-slate-50 border-0 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-44 font-medium transition-all"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 border-0 rounded-xl text-xs text-slate-600 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">{isTr ? "Tüm İşlemler" : "All Flows"}</option>
              <option value="income">{isTr ? "Gelirler (+)" : "Incomes (+)"}</option>
              <option value="expense">{isTr ? "Giderler (-)" : "Expenses (-)"}</option>
            </select>

            {/* Currency Filter */}
            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border-0 rounded-xl text-xs text-slate-600 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">{isTr ? "Tüm Para Birimleri" : "All Currencies"}</option>
              <option value="GBP">GBP (£)</option>
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="TRY">TRY (₺)</option>
            </select>
          </div>
        </div>

        {/* Entries Table */}
        <div className="overflow-x-auto">
          {loadingFinances ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="text-xs text-slate-400 font-medium">
                {isTr ? "Veriler yükleniyor..." : "Fetching ledger details..."}
              </span>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <Wallet className="w-12 h-12 text-slate-300 stroke-[1.5]" />
              <div className="text-sm font-semibold text-slate-500">
                {isTr ? "Eşleşen finansal kayıt bulunamadı" : "No matching records found"}
              </div>
              <div className="text-xs text-slate-400 max-w-sm text-center">
                {isTr 
                  ? "Arama kriterlerinizi değiştirebilir veya sağ üstten yeni bir işlem kaydedebilirsiniz." 
                  : "You can adjust filter choices or press 'Add Income / Expense' to populate the log."}
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isTr ? "TARİH" : "DATE"}</th>
                  <th className="py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isTr ? "AÇIKLAMA / İLAN" : "TITLE / PROPERTY"}</th>
                  <th className="py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isTr ? "KATEGORİ" : "CATEGORY"}</th>
                  <th className="py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">{isTr ? "MİKTAR" : "AMOUNT"}</th>
                  <th className="py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center" style={{ width: "80px" }}>{isTr ? "İŞLEM" : "ACTION"}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((t) => {
                  const sym = getCurrencySymbol(t.currency);
                  const isIncome = t.type === "income";
                  const dateStr = t.date ? new Date(t.date).toLocaleDateString(isTr ? "tr-TR" : "en-US", { year: 'numeric', month: 'short', day: 'numeric' }) : "";
                  
                  return (
                    <tr key={t.id} className="border-b border-slate-50/50 hover:bg-slate-50/20 group transition-colors">
                      <td className="py-4 text-xs font-semibold text-slate-500">{dateStr}</td>
                      <td className="py-4">
                        <div className="space-y-1 max-w-md">
                          <div className="text-xs font-black text-slate-700">{t.title}</div>
                          {t.property_id && t.property_title && (
                            <div className="text-[10px] font-semibold text-indigo-600 flex items-center gap-1 bg-indigo-50/40 border border-indigo-100/50 rounded-lg px-2 py-0.5 w-fit">
                              <Building2 className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate max-w-[280px]">{t.property_title}</span>
                            </div>
                          )}
                          {t.description && (
                            <div className="text-[10px] text-slate-400 italic">
                              {t.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wide ${
                          isIncome ? "bg-emerald-50 text-emerald-700" : "bg-rose-50/80 text-rose-700"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isIncome ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                          {getCategoryLabel(t.type, t.category)}
                        </span>
                      </td>
                      <td className={`py-4 text-xs font-black text-right ${isIncome ? "text-emerald-600" : "text-rose-500"}`}>
                        {isIncome ? "+" : "-"}{sym}{Number(t.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleDelete(t.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                          title={isTr ? "Sil" : "Delete"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Record Creation Modal Component */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[2.2rem] w-full max-w-lg p-7 shadow-2xl space-y-5 border border-slate-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-indigo-600" />
                  {isTr ? "Yeni Finansal Kayıt Oluştur" : "Record Income & Expenses"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Transaction Type Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    {isTr ? "KAYIT TÜRÜ" : "TRANSACTION TYPE"}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: "income" }))}
                      className={`py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                        formData.type === "income"
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                          : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100/50"
                      }`}
                    >
                      <TrendingUp className="w-4 h-4" />
                      {isTr ? "GELİR (+)" : "INCOME (+)"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: "expense" }))}
                      className={`py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                        formData.type === "expense"
                          ? "bg-rose-500 text-white border-rose-500 shadow-sm"
                          : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100/50"
                      }`}
                    >
                      <TrendingDown className="w-4 h-4" />
                      {isTr ? "GİDER (-)" : "EXPENSE (-)"}
                    </button>
                  </div>
                </div>

                {/* Amount / Currency */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                      {isTr ? "MİKTAR *" : "AMOUNT *"}
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData(p => ({ ...p, amount: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                      {isTr ? "PARA BİRİMİ" : "CURRENCY"}
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData(p => ({ ...p, currency: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="GBP">GBP (£)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="TRY">TRY (₺)</option>
                    </select>
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    {isTr ? "İŞLEM BAŞLIĞI *" : "TRANSACTION TITLE *"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={formData.type === "income" ? (isTr ? "Örn: Girne 1+1 Satış Komisyon Ödemesi" : "e.g. Girne 1+1 Commission") : (isTr ? "Örn: Ofis Kirası Ödemesi" : "e.g. Office rent")}
                    value={formData.title}
                    onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-semibold text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Category selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    {isTr ? "KATEGORİ" : "CATEGORY"}
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-semibold text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {categories[formData.type].map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    {isTr ? "İŞLEM TARİHİ" : "FLOW DATE"}
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-semibold text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Linked Real Estate Property Dropdown */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center justify-between">
                    <span>{isTr ? "İLİŞKİLİ EMLAK İLANI (İSTEĞE BAĞLI)" : "LINKED LISTING (OPTIONAL)"}</span>
                    <span className="text-[9px] text-indigo-500 lowercase">komisyon takibi için</span>
                  </label>
                  <select
                    value={formData.property_id}
                    onChange={(e) => setFormData(p => ({ ...p, property_id: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-semibold text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">{isTr ? "İlişkili İlan Yok" : "No Linked Listing"}</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({Math.round(Number(p.price) || 0).toLocaleString('tr-TR')} {p.currency})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    {isTr ? "NOTLAR / AÇIKLAMA" : "NOTES & DETAILS"}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={isTr ? "Detaylı açıklama girin..." : "Add specific ledger notes..."}
                    value={formData.description}
                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-semibold text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-5 py-3 rounded-xl hover:bg-slate-50 text-slate-500 font-bold text-xs uppercase transition-all"
                  >
                    {isTr ? "VAZGEÇ" : "CANCEL"}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-100"
                  >
                    {isTr ? "İŞLEMİ KAYDET" : "SAVE TRANSACTION"}
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
