import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
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
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../../types';

interface ServiceItem {
  id?: number;
  product_id?: number | null;
  item_name: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
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
  status: 'received' | 'diagnosing' | 'waiting_approval' | 'repairing' | 'ready' | 'delivered' | 'cancelled';
  notes: string;
  total_amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
  items?: ServiceItem[];
}

export const ServiceTab: React.FC<{ storeId?: number; isViewer?: boolean; products: Product[] }> = ({ storeId, isViewer, products }) => {
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
  const itemsPerPage = 15;

  const generatePDF = (record: ServiceRecord) => {
    const doc = new jsPDF();
    
    // Helper to replace Turkish characters
    const replaceTurkishChars = (str: string) => {
      return str
        .replace(/ç/g, 'c').replace(/Ç/g, 'C')
        .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
        .replace(/ı/g, 'i').replace(/İ/g, 'I')
        .replace(/ö/g, 'o').replace(/Ö/g, 'O')
        .replace(/ş/g, 's').replace(/Ş/g, 'S')
        .replace(/ü/g, 'u').replace(/Ü/g, 'U');
    };

    doc.setFontSize(18);
    doc.text(replaceTurkishChars(`Teknik Servis Raporu - #${record.id}`), 10, 15);
    
    doc.setFontSize(12);
    doc.text(replaceTurkishChars(`Musteri: ${record.customer_name}`), 10, 25);
    doc.text(replaceTurkishChars(`Cihaz: ${record.device_model}`), 10, 32);
    doc.text(replaceTurkishChars(`Durum: ${record.status}`), 10, 39);
    doc.text(replaceTurkishChars(`Tarih: ${new Date().toLocaleDateString()}`), 10, 46);
    
    const tableData = (record.items || []).map(item => [
      replaceTurkishChars(item.item_name),
      item.quantity,
      `${item.unit_price} ${record.currency}`,
      `${item.total_price} ${record.currency}`
    ]);
    
    autoTable(doc, {
      head: [['Urun/Hizmet', 'Miktar', 'Birim Fiyat', 'Toplam']],
      body: tableData,
      startY: 55,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
    });
    
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text(replaceTurkishChars(`Toplam Tutar: ${record.total_amount} ${record.currency}`), 10, finalY);
    
    doc.setFontSize(10);
    doc.text(replaceTurkishChars('Bu belge teknik servis islemleri icin hazirlanmistir.'), 10, finalY + 20);
    
    doc.save(`teknik_servis_${record.id}.pdf`);
  };

  const generateExcel = () => {
    const ws = XLSX.utils.json_to_sheet(records.filter(r => statusFilter === 'all' || r.status === statusFilter));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Servis Kayıtları");
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
      alert("Lütfen müşteri adı ve cihaz modelini doldurun.");
      return;
    }

    const data = {
      ...editingRecord,
      items: serviceItems
    };

    try {
      if (editingRecord.id) {
        await api.updateServiceRecord(editingRecord.id, data, storeId);
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
    if (!window.confirm("Bu servis kaydını silmek istediğinize emin misiniz?")) return;
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
        tax_rate: Number(item.tax_rate),
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
      item_name: type === 'labor' ? 'İşçilik Ücreti' : '',
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
    
    if (updates.product_id) {
      const product = products.find(p => p.id === Number(updates.product_id));
      if (product) {
        item.item_name = product.name;
        item.unit_price = Number(product.price);
      }
    }

    item.total_price = item.quantity * item.unit_price * (1 + item.tax_rate / 100);
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
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: ServiceRecord['status']) => {
    switch (status) {
      case 'received': return 'Cihaz Kabul';
      case 'diagnosing': return 'Arıza Tespiti';
      case 'waiting_approval': return 'Onay Bekliyor';
      case 'repairing': return 'Onarımda';
      case 'ready': return 'Hazır';
      case 'delivered': return 'Teslim Edildi';
      case 'cancelled': return 'İptal Edildi';
      default: return status;
    }
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
    try {
      // 1. Update Service Record status
      await api.updateServiceRecord(selectedRecord.id, { ...selectedRecord, status: 'cancelled' }, storeId);
      
      // 2. Create Sale
      await api.addQuotation({
        customer_name: selectedRecord.customer_name,
        customer_phone: selectedRecord.customer_phone,
        items: selectedRecord.items,
        total_amount: selectedRecord.total_amount,
        currency: selectedRecord.currency,
        status: 'completed',
        payment_method: paymentMethod
      }, storeId);
      
      // 3. Update Inventory (Stock)
      for (const item of selectedRecord.items || []) {
        if (item.product_id) {
          await api.updateProductStock(item.product_id, -item.quantity, storeId);
        }
      }
      
      setShowConversionModal(false);
      setShowDetailsModal(false);
      fetchRecords();
      alert("Satış başarıyla oluşturuldu.");
    } catch (err) {
      console.error("Error converting to sale:", err);
      alert("Satışa dönüştürülürken bir hata oluştu.");
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
                <h3 className="text-lg font-bold text-slate-900">Satışa Dönüştür</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ödeme Yöntemi</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="cash">Nakit</option>
                    <option value="credit_card">Kredi Kartı</option>
                    <option value="bank_transfer">Havale/EFT</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button onClick={() => setShowConversionModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">İptal</button>
                  <button onClick={handleConvertToSale} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Onayla</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Teknik Servis</h2>
          <p className="text-gray-500">Cihaz kayıtlarını ve onarım süreçlerini yönetin.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generateExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
          >
            <FileText className="w-4 h-4" />
            Excel Raporu
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
              Yeni Servis Kaydı
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Müşteri, cihaz veya seri no ile ara..."
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
            <option value="all">Tüm Durumlar</option>
            <option value="received">Cihaz Kabul</option>
            <option value="diagnosing">Arıza Tespiti</option>
            <option value="waiting_approval">Onay Bekliyor</option>
            <option value="repairing">Onarımda</option>
            <option value="ready">Hazır</option>
            <option value="delivered">Teslim Edildi</option>
            <option value="cancelled">İptal Edildi</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cihaz / Müşteri</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Durum</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tutar</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tarih</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">İşlemler</th>
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
                      <p>Kayıt bulunamadı.</p>
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
                          onClick={() => handleViewDetails(record)}
                          className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                          title="Detaylar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {!isViewer && (
                          <>
                            <button
                              onClick={() => handleEdit(record)}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Düzenle"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRecord(record.id)}
                              className="p-2 text-gray-400 hover:text-rose-600 transition-colors"
                              title="Sil"
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
              {filteredRecords.length} kayıt
            </p>
            <div className="flex items-center space-x-3">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                Önceki
              </button>
              <div className="text-xs font-medium text-gray-600 tabular-nums">
                {page} <span className="text-gray-300 mx-1">/</span> {totalPages}
              </div>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                Sonraki
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
                    {editingRecord?.id ? 'Servis Kaydını Düzenle' : 'Yeni Servis Kaydı'}
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
                      <User className="w-4 h-4" /> Müşteri Bilgileri
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Müşteri Adı *</label>
                        <input
                          type="text"
                          value={editingRecord?.customer_name || ''}
                          onChange={(e) => setEditingRecord(prev => ({ ...prev!, customer_name: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          placeholder="Ad Soyad"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefon</label>
                        <input
                          type="text"
                          value={editingRecord?.customer_phone || ''}
                          onChange={(e) => setEditingRecord(prev => ({ ...prev!, customer_phone: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          placeholder="05xx xxx xx xx"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Smartphone className="w-4 h-4" /> Cihaz Bilgileri
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cihaz Modeli *</label>
                        <input
                          type="text"
                          value={editingRecord?.device_model || ''}
                          onChange={(e) => setEditingRecord(prev => ({ ...prev!, device_model: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          placeholder="Örn: iPhone 13 Pro"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Seri No / IMEI</label>
                        <input
                          type="text"
                          value={editingRecord?.device_serial || ''}
                          onChange={(e) => setEditingRecord(prev => ({ ...prev!, device_serial: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          placeholder="Seri numarası"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Issue & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Arıza Açıklaması</label>
                    <textarea
                      value={editingRecord?.issue_description || ''}
                      onChange={(e) => setEditingRecord(prev => ({ ...prev!, issue_description: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-24 resize-none"
                      placeholder="Müşteri şikayeti..."
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Servis Durumu</label>
                    <select
                      value={editingRecord?.status || 'received'}
                      onChange={(e) => setEditingRecord(prev => ({ ...prev!, status: e.target.value as any }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                      <option value="received">Cihaz Kabul</option>
                      <option value="diagnosing">Arıza Tespiti</option>
                      <option value="waiting_approval">Onay Bekliyor</option>
                      <option value="repairing">Onarımda</option>
                      <option value="ready">Hazır</option>
                      <option value="delivered">Teslim Edildi</option>
                      <option value="cancelled">İptal Edildi</option>
                    </select>
                    <label className="block text-xs font-bold text-slate-500 uppercase mt-4 mb-1">Notlar (Dahili)</label>
                    <textarea
                      value={editingRecord?.notes || ''}
                      onChange={(e) => setEditingRecord(prev => ({ ...prev!, notes: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-20 resize-none"
                      placeholder="Teknik servis notları..."
                    />
                  </div>
                </div>

                {/* Parts & Labor */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Package className="w-4 h-4" /> Parçalar ve İşçilik
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => addItem('part')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all"
                      >
                        <Plus className="w-3 h-3" /> Parça Ekle
                      </button>
                      <button
                        onClick={() => addItem('labor')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all"
                      >
                        <Plus className="w-3 h-3" /> İşçilik Ekle
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {serviceItems.map((item, index) => (
                      <div key={index} className="flex flex-wrap md:flex-nowrap items-end gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex-1 min-w-[200px]">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                            {item.type === 'part' ? 'Yedek Parça' : 'Hizmet / İşçilik'}
                          </label>
                          {item.type === 'part' ? (
                            <select
                              value={item.product_id || ''}
                              onChange={(e) => updateItem(index, { product_id: e.target.value ? Number(e.target.value) : null })}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none"
                            >
                              <option value="">Parça Seçin...</option>
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
                              placeholder="İşçilik açıklaması..."
                            />
                          )}
                        </div>
                        <div className="w-24">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Miktar</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none"
                          />
                        </div>
                        <div className="w-32">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Birim Fiyat</label>
                          <input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, { unit_price: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none"
                          />
                        </div>
                        <div className="w-20">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">KDV %</label>
                          <input
                            type="number"
                            value={item.tax_rate}
                            onChange={(e) => updateItem(index, { tax_rate: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none"
                          />
                        </div>
                        <div className="w-32">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Toplam</label>
                          <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-bold text-slate-700">
                            {item.total_price.toFixed(2)}
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
                        Henüz parça veya işçilik eklenmedi.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase">Toplam Servis Bedeli</p>
                  <p className="text-2xl font-black text-slate-900">
                    {totalServiceAmount.toLocaleString('tr-TR', { style: 'currency', currency: editingRecord?.currency || 'TRY' })}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-all"
                  >
                    Vazgeç
                  </button>
                  <button
                    onClick={handleSaveRecord}
                    className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Kaydet
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
                  Servis Detayı #{selectedRecord.id}
                </h2>
                <div className="flex items-center gap-2">
                  {selectedRecord.status === 'delivered' && (
                    <button
                      onClick={() => setShowConversionModal(true)}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-bold flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Satışa Dönüştür
                    </button>
                  )}
                  <button
                    onClick={() => generatePDF(selectedRecord)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-indigo-600"
                    title="PDF İndir"
                  >
                    <Download className="h-6 w-6" />
                  </button>
                  <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <XCircle className="h-6 w-6 text-slate-400" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Müşteri</h4>
                    <p className="font-bold text-slate-900">{selectedRecord.customer_name}</p>
                    <p className="text-sm text-slate-500">{selectedRecord.customer_phone}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Cihaz</h4>
                    <p className="font-bold text-slate-900">{selectedRecord.device_model}</p>
                    <p className="text-sm text-slate-500">SN: {selectedRecord.device_serial || '-'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Arıza / Şikayet</h4>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {selectedRecord.issue_description || 'Açıklama yok.'}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Parçalar ve İşlemler</h4>
                  <div className="space-y-2">
                    {selectedRecord.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm p-2 border-b border-slate-50">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${item.type === 'part' ? 'bg-blue-400' : 'bg-amber-400'}`} />
                          <span className="text-slate-700">{item.item_name} x{item.quantity}</span>
                        </div>
                        <span className="font-bold text-slate-900">
                          {Number(item.total_price).toLocaleString('tr-TR', { style: 'currency', currency: selectedRecord.currency })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(selectedRecord.status)}`}>
                    {getStatusLabel(selectedRecord.status)}
                  </span>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Toplam Tutar</p>
                    <p className="text-xl font-black text-indigo-600">
                      {Number(selectedRecord.total_amount).toLocaleString('tr-TR', { style: 'currency', currency: selectedRecord.currency })}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 flex justify-end gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-all">
                  <Printer className="w-4 h-4" /> Yazdır
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
                >
                  Kapat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
