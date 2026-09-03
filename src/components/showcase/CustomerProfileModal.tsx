import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Package, MapPin, Phone, Mail } from 'lucide-react';
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

  useEffect(() => {
    setProfile(customer);
  }, [customer]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (isOpen && activeTab === 'orders') {
      fetchOrders();
    }
  }, [isOpen, activeTab]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.getCustomerOrders();
      setOrders(res.orders || []);
    } catch (e) {
      console.error("Error fetching orders:", e);
    } finally {
      setLoadingOrders(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{lang === 'tr' ? 'Müşteri Hesabım' : 'Customer Account'}</h2>
              {profile && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {lang === 'tr' ? `Sn. ${profile.name || ''} ${profile.surname || ''}` : `Welcome, ${profile.name || ''}`}
                </p>
              )}
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex border-b border-slate-100 bg-white px-6 gap-4">
            <button 
              className={`py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'profile' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
              onClick={() => setActiveTab('profile')}
            >
              <User className="w-4 h-4" />
              {lang === 'tr' ? 'Profil Bilgileri' : 'Profile Info'}
            </button>
            <button 
              className={`py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'orders' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
              onClick={() => setActiveTab('orders')}
            >
              <Package className="w-4 h-4" />
              {lang === 'tr' ? 'Siparişlerim' : 'My Orders'}
            </button>
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {activeTab === 'profile' ? (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex items-center gap-3 text-slate-700">
                    <User className="w-5 h-5 text-indigo-500" /> 
                    <span className="font-semibold">{profile?.name} {profile?.surname}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 text-sm">
                    <Mail className="w-5 h-5 text-slate-400" /> 
                    <span>{profile?.email || '-'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 text-sm">
                    <Phone className="w-5 h-5 text-slate-400" /> 
                    <span>{profile?.phone || '-'}</span>
                  </div>
                  <div className="flex items-start gap-3 text-slate-600 text-sm">
                    <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" /> 
                    <span>{profile?.address || '-'}</span>
                  </div>
                </div>

                {onLogout && (
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        onLogout();
                        onClose();
                      }}
                      className="w-full py-3 px-4 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-sm font-bold transition-colors"
                    >
                      {lang === 'tr' ? 'Hesaptan Çıkış Yap' : 'Log Out'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {loadingOrders ? (
                  <p className="text-center py-8 text-slate-400 text-sm">{lang === 'tr' ? 'Siparişler yükleniyor...' : 'Loading orders...'}</p>
                ) : orders.length === 0 ? (
                  <div className="text-center py-10">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium text-sm">{lang === 'tr' ? 'Henüz verilmiş bir siparişiniz bulunmamaktadır.' : 'No orders found yet.'}</p>
                  </div>
                ) : (
                  orders.map((order: any, idx: number) => (
                    <div key={`customer-order-${order.id || idx}-${idx}`} className="p-4 border border-slate-200 rounded-2xl hover:border-indigo-200 transition-colors flex justify-between items-center bg-white shadow-sm">
                      <div>
                        <p className="font-bold text-slate-900">#{order.order_number || order.id}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{order.created_at ? new Date(order.created_at).toLocaleDateString('tr-TR') : '-'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900">{order.currency || 'TL'} {Number(order.total_amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                        <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase mt-1 ${
                          order.status === 'completed' || order.status === 'delivered' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : order.status === 'shipped' || order.status === 'processing'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'cancelled' || order.status === 'payment_failed'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {order.status === "checkout_initiated" || order.status === "pending_payment" || order.status === "awaiting_payment"
                            ? (lang === "tr" ? "Ödeme Bekleniyor" : "Awaiting Payment") :
                           order.status === "payment_failed"
                            ? (lang === "tr" ? "Ödeme Alınamadı" : "Payment Failed") :
                           order.status === "pending"
                            ? (lang === "tr" ? "Sipariş Alındı" : "Pending Approval") :
                           order.status === "processing"
                            ? (lang === "tr" ? "Hazırlanıyor" : "Preparing") :
                           order.status === "shipped"
                            ? (lang === "tr" ? "Kargoda" : "Shipped") :
                           order.status === "delivered"
                            ? (lang === "tr" ? "Teslim Edildi" : "Delivered") :
                           order.status === "completed"
                            ? (lang === "tr" ? "Tamamlandı" : "Completed") :
                           order.status === "cancelled"
                            ? (lang === "tr" ? "İptal Edildi" : "Cancelled") : (order.status || (lang === 'tr' ? 'Beklemede' : 'Pending'))}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
