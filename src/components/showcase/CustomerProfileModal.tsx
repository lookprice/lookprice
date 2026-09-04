import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Package, MapPin, Phone, Mail, Edit3, Save, CheckCircle2, Building, FileText, ChevronDown, ChevronUp, Truck } from 'lucide-react';
import { api } from '../../services/api';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
  lang: string;
  initialTab?: 'profile' | 'orders';
  onLogout?: () => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  customer, 
  lang, 
  initialTab = 'profile',
  onLogout 
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>(initialTab);
  const [orders, setOrders] = useState<any[]>([]);
  const [profile, setProfile] = useState(customer);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  const [editForm, setEditForm] = useState({
    name: customer?.name || customer?.full_name || '',
    surname: customer?.surname || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    address: customer?.address || '',
    city: customer?.city || '',
    country: customer?.country || 'TR',
    tc_id: customer?.tc_id || customer?.tax_number || '',
    company_title: customer?.company_title || '',
    tax_office: customer?.tax_office || '',
    is_corporate: !!customer?.is_corporate
  });

  useEffect(() => {
    setProfile(customer);
    setEditForm({
      name: customer?.name || customer?.full_name || '',
      surname: customer?.surname || '',
      phone: customer?.phone || '',
      email: customer?.email || '',
      address: customer?.address || '',
      city: customer?.city || '',
      country: customer?.country || 'TR',
      tc_id: customer?.tc_id || customer?.tax_number || '',
      company_title: customer?.company_title || '',
      tax_office: customer?.tax_office || '',
      is_corporate: !!customer?.is_corporate
    });
  }, [customer]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
      if (activeTab === 'orders') {
        fetchOrders();
      }
    }
  }, [isOpen, activeTab]);

  const fetchProfile = async () => {
    try {
      const res = await api.getCustomerProfile();
      if (res && res.id) {
        setProfile(res);
        setEditForm({
          name: res.name || res.full_name || '',
          surname: res.surname || '',
          phone: res.phone || '',
          email: res.email || '',
          address: res.address || '',
          city: res.city || '',
          country: res.country || 'TR',
          tc_id: res.tc_id || res.tax_number || '',
          company_title: res.company_title || '',
          tax_office: res.tax_office || '',
          is_corporate: !!res.is_corporate
        });
      }
    } catch (e) {
      console.error("Error fetching profile:", e);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.getCustomerOrders();
      if (Array.isArray(res)) {
        setOrders(res);
      } else if (res && Array.isArray(res.orders)) {
        setOrders(res.orders);
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.error("Error fetching orders:", e);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.updateCustomerProfile(editForm);
      if (res?.customer || res?.success) {
        const updated = res.customer || { ...profile, ...editForm };
        setProfile(updated);
        try {
          const currentStored = JSON.parse(localStorage.getItem("customer") || "{}");
          localStorage.setItem("customer", JSON.stringify({ ...currentStored, ...updated }));
        } catch (e) {}
        setIsEditing(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Error saving profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'delivered' || s === 'completed') {
      return { text: lang === 'tr' ? 'Teslim Edildi' : 'Delivered', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
    if (s === 'shipped') {
      return { text: lang === 'tr' ? 'Kargoya Verildi' : 'Shipped', cls: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
    if (s === 'processing' || s === 'preparing') {
      return { text: lang === 'tr' ? 'Hazırlanıyor' : 'Preparing', cls: 'bg-amber-100 text-amber-800 border-amber-200' };
    }
    if (s === 'pending') {
      return { text: lang === 'tr' ? 'Sipariş Alındı' : 'Order Received', cls: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
    }
    if (s === 'cancelled') {
      return { text: lang === 'tr' ? 'İptal Edildi' : 'Cancelled', cls: 'bg-rose-100 text-rose-800 border-rose-200' };
    }
    return { text: lang === 'tr' ? 'İşleniyor' : 'Processing', cls: 'bg-slate-100 text-slate-800 border-slate-200' };
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[88vh]"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/70">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{lang === 'tr' ? 'Müşteri Hesabım' : 'Customer Account'}</h2>
              {profile && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {profile.name || profile.surname ? `${profile.name || ''} ${profile.surname || ''}` : profile.email}
                </p>
              )}
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-100 bg-white px-6 gap-6">
            <button 
              className={`py-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'profile' 
                  ? 'border-slate-900 text-slate-900' 
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
              onClick={() => setActiveTab('profile')}
            >
              <User className="w-4 h-4" />
              {lang === 'tr' ? 'Profil Bilgileri' : 'Profile Info'}
            </button>
            <button 
              className={`py-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'orders' 
                  ? 'border-slate-900 text-slate-900' 
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
              onClick={() => setActiveTab('orders')}
            >
              <Package className="w-4 h-4" />
              {lang === 'tr' ? 'Siparişlerim' : 'My Orders'}
              {orders.length > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-slate-100 text-slate-800 rounded-full font-bold">
                  {orders.length}
                </span>
              )}
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {activeTab === 'profile' ? (
              <div className="space-y-4">
                {saveSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    {lang === 'tr' ? 'Profil bilgileriniz başarıyla güncellendi.' : 'Profile updated successfully.'}
                  </div>
                )}

                {!isEditing ? (
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3.5">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3 text-slate-900">
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700">
                            {(profile?.name?.[0] || 'M').toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-base leading-tight">{profile?.name} {profile?.surname}</p>
                            <p className="text-xs text-slate-500">{profile?.email || '-'}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 hover:border-slate-400 text-slate-700 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          {lang === 'tr' ? 'Düzenle' : 'Edit'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                        <div className="flex items-center gap-2.5 text-slate-700 bg-white p-2.5 rounded-xl border border-slate-100">
                          <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">{lang === 'tr' ? 'Telefon' : 'Phone'}</span>
                            <span className="font-medium">{profile?.phone || '-'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 text-slate-700 bg-white p-2.5 rounded-xl border border-slate-100">
                          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">{lang === 'tr' ? 'TC / Vergi No' : 'Tax ID / VKN'}</span>
                            <span className="font-medium">{profile?.tc_id || profile?.tax_number || '-'}</span>
                          </div>
                        </div>
                      </div>

                      {profile?.is_corporate && (
                        <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-xs">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">{lang === 'tr' ? 'Kurumsal Bilgiler' : 'Corporate Info'}</span>
                          <p className="font-semibold text-slate-800">{profile?.company_title || '-'}</p>
                          {profile?.tax_office && (
                            <p className="text-slate-500 text-[11px] mt-0.5">{lang === 'tr' ? 'Vergi Dairesi:' : 'Tax Office:'} {profile.tax_office}</p>
                          )}
                        </div>
                      )}

                      <div className="bg-white p-3 rounded-xl border border-slate-100 text-xs">
                        <div className="flex items-start gap-2 text-slate-700">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">{lang === 'tr' ? 'Teslimat / Fatura Adresi' : 'Address'}</span>
                            <span className="font-medium">{profile?.address || (lang === 'tr' ? 'Adres belirtilmemiş' : 'No address')}</span>
                            {(profile?.city || profile?.country) && (
                              <span className="block text-slate-500 text-[11px] mt-0.5">{[profile.city, profile.country].filter(Boolean).join(', ')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {onLogout && (
                      <div className="pt-2">
                        <button
                          onClick={() => {
                            onLogout();
                            onClose();
                          }}
                          className="w-full py-3 px-4 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors"
                        >
                          {lang === 'tr' ? 'Hesaptan Çıkış Yap' : 'Log Out'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">{lang === 'tr' ? 'Ad' : 'First Name'} *</label>
                        <input
                          type="text" required
                          value={editForm.name}
                          onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-slate-900 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">{lang === 'tr' ? 'Soyad' : 'Last Name'}</label>
                        <input
                          type="text"
                          value={editForm.surname}
                          onChange={e => setEditForm({ ...editForm, surname: e.target.value })}
                          className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-slate-900 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">{lang === 'tr' ? 'Telefon' : 'Phone'} *</label>
                        <input
                          type="tel" required
                          value={editForm.phone}
                          onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                          className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-slate-900 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">{lang === 'tr' ? 'TC Kimlik / Vergi No (VKN)' : 'Tax ID / VKN'}</label>
                        <input
                          type="text"
                          value={editForm.tc_id}
                          onChange={e => setEditForm({ ...editForm, tc_id: e.target.value })}
                          maxLength={11}
                          placeholder="11 haneli TCKN veya 10 haneli VKN"
                          className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-slate-900 outline-none"
                        />
                      </div>
                    </div>

                    <div className="pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={editForm.is_corporate}
                          onChange={e => setEditForm({ ...editForm, is_corporate: e.target.checked })}
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                        {lang === 'tr' ? 'Kurumsal Fatura Bilgileri' : 'Corporate Invoice Information'}
                      </label>
                    </div>

                    {editForm.is_corporate && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">{lang === 'tr' ? 'Şirket Ünvanı' : 'Company Title'}</label>
                          <input
                            type="text"
                            value={editForm.company_title}
                            onChange={e => setEditForm({ ...editForm, company_title: e.target.value })}
                            className="w-full mt-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-slate-900 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">{lang === 'tr' ? 'Vergi Dairesi' : 'Tax Office'}</label>
                          <input
                            type="text"
                            value={editForm.tax_office}
                            onChange={e => setEditForm({ ...editForm, tax_office: e.target.value })}
                            className="w-full mt-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-slate-900 outline-none"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">{lang === 'tr' ? 'Şehir / İl' : 'City'}</label>
                        <input
                          type="text"
                          value={editForm.city}
                          onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                          className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-slate-900 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">{lang === 'tr' ? 'Ülke' : 'Country'}</label>
                        <input
                          type="text"
                          value={editForm.country}
                          onChange={e => setEditForm({ ...editForm, country: e.target.value })}
                          className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-slate-900 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">{lang === 'tr' ? 'Açık Adres' : 'Full Address'}</label>
                      <textarea
                        rows={2}
                        value={editForm.address}
                        onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                        className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-slate-900 outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        {lang === 'tr' ? 'Vazgeç' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-1.5 px-5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {isSaving ? (lang === 'tr' ? 'Kaydediliyor...' : 'Saving...') : (lang === 'tr' ? 'Kaydet' : 'Save')}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {loadingOrders ? (
                  <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
                    <span>{lang === 'tr' ? 'Siparişler yükleniyor...' : 'Loading orders...'}</span>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-600 font-bold text-sm">{lang === 'tr' ? 'Henüz verilmiş bir siparişiniz bulunmamaktadır.' : 'No orders found yet.'}</p>
                    <p className="text-slate-400 text-xs mt-1">{lang === 'tr' ? 'Mağazamızdan sipariş verdiğinizde tüm detayları burada görüntüleyebilirsiniz.' : 'All your purchase history will be listed here.'}</p>
                  </div>
                ) : (
                  orders.map((order: any, idx: number) => {
                    const badge = getStatusBadge(order.status);
                    const isExpanded = expandedOrderId === (order.id || idx);
                    const orderItems = Array.isArray(order.items) ? order.items : [];

                    return (
                      <div 
                        key={`cust-order-${order.id || idx}-${idx}`} 
                        className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden transition-all hover:border-slate-300"
                      >
                        <div 
                          className="p-4 flex flex-col md:flex-row justify-between md:items-center gap-3 cursor-pointer select-none"
                          onClick={() => setExpandedOrderId(isExpanded ? null : (order.id || idx))}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-800 text-xs shrink-0">
                              #{order.id}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900">
                                  {lang === 'tr' ? 'Sipariş' : 'Order'} #{order.id}
                                </span>
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${badge.cls}`}>
                                  {badge.text}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {order.created_at ? new Date(order.created_at).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-4">
                            <div className="text-left md:text-right">
                              <p className="font-black text-slate-900 text-sm">
                                {Number(order.total_amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {order.currency || 'TL'}
                              </p>
                              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                                {order.payment_method === 'credit_card' || order.payment_method === 'iyzico' ? 'Kredi Kartı' :
                                 order.payment_method === 'bank_transfer' ? 'Havale / EFT' :
                                 order.payment_method === 'cash_on_delivery' ? 'Kapıda Ödeme' :
                                 order.payment_method || 'Online'}
                              </span>
                            </div>
                            <div className="p-1 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-600">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          </div>
                        </div>

                        {/* Order Details Accordion */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-3 text-xs">
                            {/* Items List */}
                            {orderItems.length > 0 ? (
                              <div className="space-y-1.5">
                                <span className="text-[10px] uppercase font-bold text-slate-400">{lang === 'tr' ? 'Sipariş Kalemleri' : 'Order Items'}</span>
                                <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                                  {orderItems.map((item: any, iIdx: number) => (
                                    <div key={`ord-item-${item.id || iIdx}`} className="p-2.5 flex justify-between items-center text-xs">
                                      <div>
                                        <p className="font-semibold text-slate-900">{item.product_name || item.name || `Ürün ${iIdx + 1}`}</p>
                                        <p className="text-[11px] text-slate-400">{item.quantity} adet x {Number(item.unit_price || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {order.currency || 'TL'}</p>
                                      </div>
                                      <p className="font-bold text-slate-800">
                                        {Number(item.total_price || (item.quantity * item.unit_price) || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {order.currency || 'TL'}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}

                            {/* Tracking / Shipping Info */}
                            {order.tracking_number && (
                              <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl flex items-center gap-2 text-blue-900 text-xs">
                                <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                                <div>
                                  <span className="font-bold">{order.shipping_carrier || 'Kargo'}:</span> {order.tracking_number}
                                </div>
                              </div>
                            )}

                            {/* Delivery Address */}
                            {order.customer_address && (
                              <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
                                <span className="font-bold text-slate-800 block text-[10px] uppercase text-slate-400">{lang === 'tr' ? 'Teslimat Adresi:' : 'Delivery Address:'}</span>
                                {order.customer_address}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
