import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import { 
  Wrench, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ChevronRight, 
  Edit2, 
  Trash2, 
  Eye,
  Settings,
  Package,
  User,
  Smartphone,
  FileText,
  Loader2,
  Printer,
  Check,
  Save,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translations } from '../../translations';
import { useLanguage } from '../../contexts/LanguageContext';
import { Product } from '../../types';

interface ServiceItem {
  id?: number;
  product_id?: number | null;
  item_name: string;
  quantity: number | string;
  unit_price: number | string;
  tax_rate: number | string;
  total_price: number;
  type: 'part' | 'labor';
}

interface ServiceRecord {
  id: number;
  customer_name: string;
  customer_phone: string;
  device_model: string;
  device_serial: string;
  issue_description: string;
  status: 'received' | 'diagnosing' | 'waiting_approval' | 'repairing' | 'ready' | 'delivered' | 'cancelled' | 'converted_to_sale';
  notes: string;
  total_amount: number;
  currency: string;
  quotation_id?: number;
  is_converted_to_sale?: boolean;
  created_at: string;
  updated_at: string;
  items?: ServiceItem[];
}

export const ServiceTab: React.FC<{ storeId?: number; isViewer?: boolean; products: Product[]; onTabChange: (tab: string) => void }> = ({ storeId, isViewer, products, onTabChange }) => {
  const { lang } = useLanguage();
  const isTr = lang === 'tr';
  const t = translations[lang].dashboard;
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Partial<ServiceRecord> | null>(null);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [selectedRecord, setSelectedRecord] = useState<ServiceRecord | null>(null);
  const [page, setPage] = useState(1);
  const [storeInfo, setStoreInfo] = useState<any>(null);
  const itemsPerPage = 15;

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  useEffect(() => {
    const fetchStoreInfo = async () => {
      try {
        const info = await api.getBranding(storeId);
        setStoreInfo(info);
      } catch (err) {
        console.error("Error fetching store info:", err);
      }
    };
    fetchStoreInfo();
  }, [storeId]);


  const generateExcel = () => {
    const data = records.filter(r => statusFilter === 'all' || r.status === statusFilter).map(r => ({
      [t.service_tab.serviceNo]: r.id,
      [t.service_tab.customerName]: r.customer_name,
      [t.service_tab.deviceModel]: r.device_model,
      [t.service_tab.status]: t.service_tab.statuses[r.status],
      [t.service_tab.date]: r.created_at,
      [t.service_tab.totalAmount]: r.total_amount
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t.service_tab.serviceRecords);
    XLSX.writeFile(wb, "servis_kayitlari.xlsx");
  };

  useEffect(() => {
    fetchRecords();
  }, [storeId]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await api.getServiceRecords(storeId);
      setRecords(data);
    } catch (err) {
      console.error("Error fetching service records:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecord = async () => {
    if (!editingRecord?.customer_name || !editingRecord?.device_model) {
      alert(t.service_tab.fillRequiredFields);
      return;
    }

    const data = {
      ...editingRecord,
      items: serviceItems.map(item => ({
        ...item,
        quantity: Number(String(item.quantity).replace(',', '.')) || 0,
        unit_price: Number(String(item.unit_price).replace(',', '.')) || 0,
        tax_rate: Number(String(item.tax_rate).replace(',', '.')) || 0,
        total_price: Number(String(item.total_price).replace(',', '.')) || 0
      }))
    };

    try {
      if (editingRecord.id) {
        await api.updateServiceRecord(editingRecord.id, data, storeId);
        if (data.status === 'waiting_approval') {
          alert(isTr ? "Teknik servis durumu 'Onay Bekliyor' olarak güncellendi ve otomatik olarak bir teklif oluşturuldu. İşlemlere 'Teklifler/Satış' bölümünden devam edebilirsiniz." : "Service status updated to 'Waiting Approval' and a quotation has been automatically created. You can continue the process from the 'Quotations/Sales' section.");
        }
      } else {
        await api.addServiceRecord(data, storeId);
      }
      setShowModal(false);
      setEditingRecord(null);
      setServiceItems([]);
      fetchRecords();
    } catch (err) {
      console.error("Error saving service record:", err);
    }
  };

  const handleDeleteRecord = async (id: number) => {
    if (!window.confirm(t.service_tab.deleteServiceConfirm)) return;
    try {
      await api.deleteServiceRecord(id, storeId);
      fetchRecords();
    } catch (err) {
      console.error("Error deleting service record:", err);
    }
  };

  const handleEdit = async (record: ServiceRecord) => {
    try {
      const fullRecord = await api.getServiceRecord(record.id, storeId);
      setEditingRecord(fullRecord);
      setServiceItems((fullRecord.items || []).map((item: any) => ({
        ...item,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        tax_rate: Math.floor(Number(item.tax_rate) || 0),
        total_price: Number(item.total_price)
      })));
      setShowModal(true);
    } catch (err) {
      console.error("Error fetching full record:", err);
    }
  };

  const handleViewDetails = async (record: ServiceRecord) => {
    try {
      const fullRecord = await api.getServiceRecord(record.id, storeId);
      setSelectedRecord({
        ...fullRecord,
        items: (fullRecord.items || []).map((item: any) => ({
          ...item,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          tax_rate: Number(item.tax_rate),
          total_price: Number(item.total_price)
        }))
      });
      setShowDetailsModal(true);
    } catch (err) {
      console.error("Error fetching full record:", err);
    }
  };

  const addItem = (type: 'part' | 'labor') => {
    const newItem: ServiceItem = {
      item_name: type === 'labor' ? t.service_tab.laborCost : '',
      quantity: 1,
      unit_price: 0,
      tax_rate: 20,
      total_price: 0,
      type
    };
    setServiceItems([...serviceItems, newItem]);
  };

  const updateItem = (index: number, updates: Partial<ServiceItem>) => {
    const newItems = [...serviceItems];
    const item = { ...newItems[index], ...updates };
    
    // Force integer for tax rate if it's being updated
    if ('tax_rate' in updates) {
      item.tax_rate = String(updates.tax_rate).replace(/[^0-9]/g, '').substring(0, 2);
    }

    if (updates.product_id) {
      const product = products.find(p => p.id === Number(updates.product_id));
      if (product) {
        item.item_name = product.name;
        const taxRate = Number(product.tax_rate) || 20;
        // If price_2 is available, it's KDV Hariç. Convert to KDV Dahil for display.
        if (product.price_2 && Number(product.price_2) > 0) {
          item.unit_price = Number(product.price_2) * (1 + taxRate / 100);
        } else {
          item.unit_price = Number(product.price);
        }
      }
    }

    const qty = Number(String(item.quantity).replace(',', '.')) || 0;
    const price = Number(String(item.unit_price).replace(',', '.')) || 0;
    const tax = Math.floor(Number(String(item.tax_rate).replace(',', '.')) || 0);

    // Since price is KDV Dahil, total is just qty * price
    item.total_price = Number((qty * price).toFixed(2));
    newItems[index] = item;
    setServiceItems(newItems);
  };

  const removeItem = (index: number) => {
    setServiceItems(serviceItems.filter((_, i) => i !== index));
  };

  const getStatusColor = (status: ServiceRecord['status']) => {
    switch (status) {
      case 'received': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'diagnosing': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'waiting_approval': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'repairing': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'ready': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'delivered': return 'bg-gray-100 text-gray-500 border-gray-200';
      case 'cancelled': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'converted_to_sale': return 'bg-slate-900 text-white border-slate-900';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: ServiceRecord['status']) => {
    return t.service_tab.statuses[status] || status;
  };

  const filteredRecords = records.filter(r => {
    const matchesSearch = 
      r.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.device_model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.device_serial?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedRecords = filteredRecords.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  const totalServiceAmount = serviceItems.reduce((sum, item) => sum + item.total_price, 0);

  const handleConvertToSale = async () => {
    if (!selectedRecord) return;
    
    if (selectedRecord.is_converted_to_sale) {
      alert(isTr ? "Bu kayıt zaten satışa dönüştürülmüş." : "This record has already been converted to a sale.");
      setShowConversionModal(false);
      return;
    }

    if (selectedRecord.quotation_id) {
      // Already has a quotation, just redirect
      setShowConversionModal(false);
      setShowDetailsModal(false);
      onTabChange('quotations');
      return;
    }

    try {
      // Update status to waiting_approval which triggers quotation creation in backend
      await api.updateServiceRecord(selectedRecord.id, { ...selectedRecord, status: 'waiting_approval' }, storeId);
      
      // Refresh records and redirect
      await fetchRecords();
      setShowConversionModal(false);
      setShowDetailsModal(false);
      onTabChange('quotations');
      
      alert(isTr ? "Teklif oluşturuldu. 'Teklifler/Satış' bölümüne yönlendiriliyorsunuz." : "Quotation created. Redirecting to 'Quotations/Sales' section.");
    } catch (err: any) {
      console.error("Error converting to sale:", err);
      alert(isTr ? "İşlem sırasında bir hata oluştu: " + (err.message || err) : "An error occurred during the process: " + (err.message || err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Conversion Modal */}
      <AnimatePresence>
        {showConversionModal && selectedRecord && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">{t.service_tab.convertToSale}</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t.service_tab.paymentMethod}</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="cash">{t.service_tab.cash}</option>
                    <option value="credit_card">{t.service_tab.creditCard}</option>
                    <option value="bank_transfer">{t.service_tab.bankTransfer}</option>
                    <option value="company">{t.service_tab.currentAccount}</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button onClick={() => setShowConversionModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">{t.cancel}</button>
                  <button onClick={handleConvertToSale} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">{t.service_tab.confirm}</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t.service_tab.title}</h2>
          <p className="text-gray-500">{t.service_tab.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generateExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
          >
            <FileText className="w-4 h-4" />
            {t.service_tab.excelReport}
          </button>
          {!isViewer && (
            <button
              onClick={() => {
                setEditingRecord({ status: 'received' });
                setServiceItems([]);
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              <Plus className="w-4 h-4" />
              {t.service_tab.newRecord}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t.service_tab.searchPlaceholderService}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm"
          >
            <option value="all">{t.service_tab.allStatuses}</option>
            {Object.entries(t.service_tab.statuses).map(([key, label]) => (
              <option key={key} value={key}>{label as string}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.service_tab.deviceCustomer}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.service_tab.status}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.service_tab.amount}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.service_tab.date}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">{t.service_tab.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                  </td>
                </tr>
              ) : paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Wrench className="w-12 h-12 opacity-20" />
                      <p>{t.service_tab.noRecordsFound}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map(record => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{record.device_model}</span>
                        <span className="text-xs text-gray-500">{record.customer_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}>
                        {getStatusLabel(record.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">
                        {Number(record.total_amount).toLocaleString('tr-TR', { style: 'currency', currency: record.currency })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(record.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            handleViewDetails(record);
                            setTimeout(() => handlePrint(), 100);
                          }}
                          className="p-2 text-gray-400 hover:text-slate-600 transition-colors"
                          title={t.print}
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewDetails(record)}
                          className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                          title={t.service_tab.details}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {!isViewer && (
                          <>
                            <button
                              onClick={() => handleEdit(record)}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                              title={t.service_tab.edit}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRecord(record.id)}
                              className="p-2 text-gray-400 hover:text-rose-600 transition-colors"
                              title={t.service_tab.delete}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500">
              {filteredRecords.length} {t.service_tab.records}
            </p>
            <div className="flex items-center space-x-3">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                {t.service_tab.prev}
              </button>
              <div className="text-xs font-medium text-gray-600 tabular-nums">
                {page} <span className="text-gray-300 mx-1">/</span> {totalPages}
              </div>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                {t.service_tab.next}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Service Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <Wrench className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {editingRecord?.id ? t.service_tab.editServiceRecord : t.service_tab.newRecord}
                  </h2>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <XCircle className="h-6 w-6 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Customer & Device Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <User className="w-4 h-4" /> {t.service_tab.customerInfo}
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.service_tab.customerName} *</label>
                        <input
                          type="text"
                          value={editingRecord?.customer_name || ''}
                          onChange={(e) => setEditingRecord(prev => ({ ...prev!, customer_name: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          placeholder={t.service_tab.fullName}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.service_tab.phone}</label>
                        <input
                          type="text"
                          value={editingRecord?.customer_phone || ''}
                          onChange={(e) => setEditingRecord(prev => ({ ...prev!, customer_phone: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          placeholder={t.service_tab.phonePlaceholder}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Smartphone className="w-4 h-4" /> {t.service_tab.deviceInfo}
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.service_tab.deviceModel} *</label>
                        <input
                          type="text"
                          value={editingRecord?.device_model || ''}
                          onChange={(e) => setEditingRecord(prev => ({ ...prev!, device_model: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          placeholder={t.service_tab.example_device}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.service_tab.serialImei}</label>
                        <input
                          type="text"
                          value={editingRecord?.device_serial || ''}
                          onChange={(e) => setEditingRecord(prev => ({ ...prev!, device_serial: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          placeholder={t.service_tab.serialPlaceholder}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Issue & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.service_tab.issueDescription}</label>
                    <textarea
                      value={editingRecord?.issue_description || ''}
                      onChange={(e) => setEditingRecord(prev => ({ ...prev!, issue_description: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-24 resize-none"
                      placeholder={t.service_tab.issuePlaceholder}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.service_tab.status}</label>
                    <select
                      value={editingRecord?.status || 'received'}
                      onChange={(e) => setEditingRecord(prev => ({ ...prev!, status: e.target.value as any }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                      <option value="received">{t.service_tab.statuses.received}</option>
                      <option value="diagnosing">{t.service_tab.statuses.diagnosing}</option>
                      <option value="waiting_approval">{t.service_tab.statuses.waitingApproval}</option>
                      <option value="repairing">{t.service_tab.statuses.repairing}</option>
                      <option value="ready">{t.service_tab.statuses.ready}</option>
                      <option value="delivered">{t.service_tab.statuses.delivered}</option>
                      <option value="cancelled">{t.service_tab.statuses.cancelled}</option>
                    </select>
                    <label className="block text-xs font-bold text-slate-500 uppercase mt-4 mb-1">{t.service_tab.notesInternal}</label>
                    <textarea
                      value={editingRecord?.notes || ''}
                      onChange={(e) => setEditingRecord(prev => ({ ...prev!, notes: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-20 resize-none"
                      placeholder={t.service_tab.notesPlaceholder}
                    />
                  </div>
                </div>

                {/* Parts & Labor */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Package className="w-4 h-4" /> {t.service_tab.partsAndLabor}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => addItem('part')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all"
                      >
                        <Plus className="w-3 h-3" /> {t.service_tab.addPart}
                      </button>
                      <button
                        onClick={() => addItem('labor')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all"
                      >
                        <Plus className="w-3 h-3" /> {t.service_tab.addLabor}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {serviceItems.map((item, index) => (
                      <div key={index} className="flex flex-wrap md:flex-nowrap items-end gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex-1 min-w-[200px]">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                            {item.type === 'part' ? t.service_tab.sparePart : t.service_tab.laborService}
                          </label>
                          {item.type === 'part' ? (
                            <select
                              value={item.product_id || ''}
                              onChange={(e) => updateItem(index, { product_id: e.target.value ? Number(e.target.value) : null })}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none"
                            >
                              <option value="">{t.service_tab.selectPart}</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.stock_quantity} {p.unit})</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={item.item_name}
                              onChange={(e) => updateItem(index, { item_name: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none"
                              placeholder={t.service_tab.laborDescriptionPlaceholder}
                            />
                          )}
                        </div>
                        <div className="w-24">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.service_tab.quantity}</label>
                          <input
                            type="text"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, { quantity: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none"
                          />
                        </div>
                        <div className="w-32">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.service_tab.unitPrice}</label>
                          <input
                            type="text"
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, { unit_price: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none"
                          />
                        </div>
                        <div className="w-20">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.service_tab.taxRate}</label>
                          <input
                            type="text"
                            value={Math.floor(Number(item.tax_rate) || 0)}
                            onChange={(e) => updateItem(index, { tax_rate: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none"
                          />
                        </div>
                        <div className="w-32">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.service_tab.total}</label>
                          <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-bold text-slate-700">
                            {item.total_price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(index)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {serviceItems.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
                        {t.service_tab.noRecordsFound}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase">{t.service_tab.totalAmount}</p>
                  <p className="text-2xl font-black text-slate-900">
                    {totalServiceAmount.toLocaleString('tr-TR', { style: 'currency', currency: editingRecord?.currency || 'TRY' })}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-all"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={handleSaveRecord}
                    className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {t.save}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedRecord && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  {t.service_tab.details} #{selectedRecord.id}
                </h2>
                <div className="flex items-center gap-2">
                  {selectedRecord.quotation_id && (
                    <div className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" />
                      {isTr ? `Teklif #${selectedRecord.quotation_id}` : `Quotation #${selectedRecord.quotation_id}`}
                    </div>
                  )}
                  {selectedRecord.status === 'delivered' && !selectedRecord.is_converted_to_sale && !selectedRecord.quotation_id && (
                    <button
                      onClick={() => setShowConversionModal(true)}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-bold flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      {t.service_tab.convertToSale}
                    </button>
                  )}
                  {selectedRecord.is_converted_to_sale && (
                    <div className="px-4 py-2 bg-slate-100 text-slate-500 rounded-lg text-sm font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      {t.service_tab.statuses.converted_to_sale}
                    </div>
                  )}
                  <button
                    onClick={handlePrint}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-indigo-600"
                    title={t.print}
                  >
                    <Printer className="h-6 w-6" />
                  </button>
                  <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <XCircle className="h-6 w-6 text-slate-400" />
                  </button>
                </div>
              </div>
              <div ref={printRef} className="p-6 max-h-[75vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-6 print:bg-white text-slate-900 font-sans text-[10px]">
                {/* Top Border */}
                <div className="border-t-2 border-slate-900 mb-3"></div>

                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="w-1/2 space-y-0.5 pr-4">
                    <h1 className="font-bold text-xs uppercase">{storeInfo?.name || "Teknik Servis"}</h1>
                    <p className="leading-tight">{storeInfo?.address}</p>
                    <p>Tel: {storeInfo?.phone}</p>
                    <p>E-Posta: {storeInfo?.email}</p>
                  </div>
                  <div className="w-1/2 flex justify-end items-start">
                    <div className="text-center mr-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-full mx-auto mb-1 flex items-center justify-center border border-slate-200">
                        <Wrench className="w-6 h-6 text-slate-400" />
                      </div>
                      <span className="font-bold text-base uppercase tracking-widest">{isTr ? 'TEKNİK SERVİS FORMU' : 'SERVICE FORM'}</span>
                    </div>
                  </div>
                </div>

                {/* Middle Border */}
                <div className="border-t-2 border-slate-900 mb-3"></div>

                {/* Customer & Service Info */}
                <div className="flex justify-between items-start mb-4">
                  <div className="w-1/2 space-y-0.5 pr-4">
                    <p className="font-bold border-b border-slate-900 pb-0.5 mb-1 text-[11px]">{isTr ? 'MÜŞTERİ BİLGİLERİ' : 'CUSTOMER INFO'}</p>
                    <p className="font-bold text-[11px]">{selectedRecord.customer_name || '-'}</p>
                    <p>Tel: {selectedRecord.customer_phone || '-'}</p>
                  </div>
                  <div className="w-1/2 pl-4">
                    <table className="w-full border-collapse border border-slate-900 text-[9px]">
                      <tbody>
                        <tr>
                          <td className="border border-slate-900 p-0.5 font-bold w-1/3">{isTr ? 'Kayıt No:' : 'Record No:'}</td>
                          <td className="border border-slate-900 p-0.5">#{selectedRecord.id.toString().padStart(6, '0')}</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-900 p-0.5 font-bold">{isTr ? 'Tarih:' : 'Date:'}</td>
                          <td className="border border-slate-900 p-0.5">{new Date(selectedRecord.created_at).toLocaleDateString('tr-TR')}</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-900 p-0.5 font-bold">{isTr ? 'Durum:' : 'Status:'}</td>
                          <td className="border border-slate-900 p-0.5 uppercase">{getStatusLabel(selectedRecord.status)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Device Info */}
                <div className="mb-4">
                  <p className="font-bold border-b border-slate-900 pb-0.5 mb-1 text-[11px]">{isTr ? 'CİHAZ BİLGİLERİ & AÇIKLAMA' : 'DEVICE INFO & DESCRIPTION'}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p><span className="font-bold">{isTr ? 'Cihaz Modeli:' : 'Device Model:'}</span> {selectedRecord.device_model}</p>
                      <p><span className="font-bold">{isTr ? 'Seri No:' : 'Serial No:'}</span> {selectedRecord.device_serial || '-'}</p>
                    </div>
                    <div>
                      <p><span className="font-bold">{isTr ? 'Açıklama:' : 'Description:'}</span> {selectedRecord.issue_description || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full border-collapse border border-slate-900 text-xs mb-4">
                  <thead>
                    <tr className="bg-slate-100 print:bg-slate-100">
                      <th className="border border-slate-900 p-2 text-center w-12">{isTr ? 'Sıra No' : 'No'}</th>
                      <th className="border border-slate-900 p-2 text-left">{isTr ? 'Parça / İşçilik' : 'Part / Labor'}</th>
                      <th className="border border-slate-900 p-2 text-center w-20">{isTr ? 'Miktar' : 'Qty'}</th>
                      <th className="border border-slate-900 p-2 text-right w-24">{isTr ? 'Birim Fiyat' : 'Unit Price'}</th>
                      <th className="border border-slate-900 p-2 text-right w-28">{isTr ? 'Toplam' : 'Total'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedRecord.items || []).map((item: any, idx: number) => {
                      const unitPrice = Number(item.unit_price) || 0;
                      const qty = Number(item.quantity) || 0;
                      const lineTotal = unitPrice * qty;

                      return (
                        <tr key={idx}>
                          <td className="border border-slate-900 p-2 text-center">{idx + 1}</td>
                          <td className="border border-slate-900 p-2">
                            <div className="font-bold">{item.item_name}</div>
                            <div className="text-[10px] text-slate-500 uppercase">{item.type === 'part' ? (isTr ? 'Yedek Parça' : 'Spare Part') : (isTr ? 'İşçilik' : 'Labor')}</div>
                          </td>
                          <td className="border border-slate-900 p-2 text-center">{qty}</td>
                          <td className="border border-slate-900 p-2 text-right">{unitPrice.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {selectedRecord.currency}</td>
                          <td className="border border-slate-900 p-2 text-right">{lineTotal.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {selectedRecord.currency}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-4">
                  <table className="w-1/2 border-collapse border border-slate-900 text-[9px]">
                    <tbody>
                      <tr className="bg-slate-50">
                        <td className="border border-slate-900 p-1 font-bold text-right text-[10px]">{isTr ? 'Genel Toplam' : 'Grand Total'}</td>
                        <td className="border border-slate-900 p-1 text-right font-bold w-32 text-[10px]">{Number(selectedRecord.total_amount).toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {selectedRecord.currency}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="p-6 bg-slate-50 flex justify-end gap-3">
                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-all">
                  <Printer className="w-4 h-4" /> {t.print}
                </button>
                {!selectedRecord.is_converted_to_sale && (
                  <button
                    onClick={() => handleConvertToSale()}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all"
                  >
                    {t.service_tab.convertToSale}
                  </button>
                )}
                {selectedRecord.is_converted_to_sale && (
                  <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold border border-emerald-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> {t.service_tab.statuses.converted_to_sale}
                  </div>
                )}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
                >
                  {t.close}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
