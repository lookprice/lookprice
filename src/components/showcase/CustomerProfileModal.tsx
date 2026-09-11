import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  User, 
  Package, 
  MapPin, 
  Phone, 
  Mail, 
  Edit3, 
  Save, 
  CheckCircle2, 
  Building, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Truck,
  Heart,
  Star,
  ShoppingBag,
  ExternalLink,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { api } from '../../services/api';
import { bookstoreInteraction, BookReview } from '../../services/bookstoreInteractionService';
import { getBookCoverFallbackSvg } from '../../utils/imageFallback';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
  lang: string;
  initialTab?: 'profile' | 'orders' | 'favorites';
  onLogout?: () => void;
  products?: any[];
  storeId?: number | string;
  onViewProduct?: (product: any) => void;
  addToBasket?: (product: any) => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  customer, 
  lang, 
  initialTab = 'profile',
  onLogout,
  products = [],
  storeId,
  onViewProduct,
  addToBasket
}) => {
  const isTr = lang === 'tr';
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'favorites'>(initialTab);
  const [orders, setOrders] = useState<any[]>([]);
  const [profile, setProfile] = useState(customer);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  // Favorites state
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  // Review state
  const [reviewingItem, setReviewingItem] = useState<{
    productId: number | string;
    productName: string;
    orderId?: number | string;
  } | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewHoverRating, setReviewHoverRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewSuccess, setReviewSuccess] = useState<boolean>(false);

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

  const refreshFavorites = () => {
    setFavoriteIds(bookstoreInteraction.getFavorites(storeId));
  };

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
      refreshFavorites();
      if (activeTab === 'orders') {
        fetchOrders();
      }
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    const handleFavChange = () => refreshFavorites();
    window.addEventListener('bookstore-favorites-changed', handleFavChange);
    return () => window.removeEventListener('bookstore-favorites-changed', handleFavChange);
  }, [storeId]);

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

  const handleToggleFav = (prodId: number | string) => {
    bookstoreInteraction.toggleFavorite(prodId, storeId);
    refreshFavorites();
  };

  const handleOpenReview = (item: any, order: any) => {
    const prodId = item.product_id || item.id;
    const name = item.product_name || item.name || 'Kitap';
    setReviewingItem({
      productId: prodId,
      productName: name,
      orderId: order.id
    });
    setReviewRating(5);
    setReviewComment('');
    setReviewSuccess(false);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingItem || !reviewComment.trim()) return;

    const author = profile?.name 
      ? `${profile.name} ${profile.surname ? profile.surname.charAt(0) + '.' : ''}` 
      : 'Doğrulanmış Okur';

    bookstoreInteraction.addReview({
      productId: reviewingItem.productId,
      storeId,
      orderId: reviewingItem.orderId,
      bookTitle: reviewingItem.productName,
      rating: reviewRating,
      comment: reviewComment,
      authorName: author,
      verifiedPurchase: true
    });

    setReviewSuccess(true);
    setTimeout(() => {
      setReviewSuccess(false);
      setReviewingItem(null);
    }, 1800);
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'delivered' || s === 'completed') {
      return { text: isTr ? 'Teslim Edildi' : 'Delivered', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
    if (s === 'shipped') {
      return { text: isTr ? 'Kargoya Verildi' : 'Shipped', cls: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
    if (s === 'processing' || s === 'preparing') {
      return { text: isTr ? 'Hazırlanıyor' : 'Preparing', cls: 'bg-amber-100 text-amber-800 border-amber-200' };
    }
    if (s === 'pending') {
      return { text: isTr ? 'Sipariş Alındı' : 'Order Received', cls: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
    }
    if (s === 'cancelled') {
      return { text: isTr ? 'İptal Edildi' : 'Cancelled', cls: 'bg-rose-100 text-rose-800 border-rose-200' };
    }
    return { text: isTr ? 'İşleniyor' : 'Processing', cls: 'bg-slate-100 text-slate-800 border-slate-200' };
  };

  // Filter favorite products from list
  const favoriteProducts = products.filter(p => favoriteIds.includes(String(p.id)));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm select-none"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-red-600/30">
                {(profile?.name?.[0] || 'M').toUpperCase()}
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  {isTr ? 'Müşteri Hesabım' : 'Customer Account'}
                </h2>
                {profile && (
                  <p className="text-[11px] text-slate-500 font-medium">
                    {profile.name || profile.surname ? `${profile.name || ''} ${profile.surname || ''}` : profile.email}
                  </p>
                )}
              </div>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs (Profile / Orders / Favorites) */}
          <div className="flex border-b border-slate-100 bg-white px-5 gap-4 sm:gap-6 overflow-x-auto scrollbar-none">
            <button 
              type="button"
              className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'profile' 
                  ? 'border-red-600 text-red-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
              onClick={() => setActiveTab('profile')}
            >
              <User className="w-4 h-4" />
              <span>{isTr ? 'Profil & Adres' : 'Profile & Address'}</span>
            </button>
            <button 
              type="button"
              className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'orders' 
                  ? 'border-red-600 text-red-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
              onClick={() => setActiveTab('orders')}
            >
              <Package className="w-4 h-4" />
              <span>{isTr ? 'Siparişlerim' : 'My Orders'}</span>
              {orders.length > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-800 rounded-full font-bold">
                  {orders.length}
                </span>
              )}
            </button>
            <button 
              type="button"
              className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'favorites' 
                  ? 'border-red-600 text-red-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
              onClick={() => setActiveTab('favorites')}
            >
              <Heart className="w-4 h-4" />
              <span>{isTr ? 'Favori Kitaplarım' : 'My Favorites'}</span>
              {favoriteIds.length > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] bg-red-100 text-red-700 rounded-full font-bold">
                  {favoriteIds.length}
                </span>
              )}
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
            
            {/* TAB 1: PROFIL BILGILERI & ADRES REVIZE */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                {saveSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    {isTr ? 'Profil ve teslimat bilgileriniz başarıyla güncellendi.' : 'Profile updated successfully.'}
                  </div>
                )}

                {!isEditing ? (
                  <div className="space-y-3.5">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                            {(profile?.name?.[0] || 'M').toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-900 leading-tight">{profile?.name} {profile?.surname}</p>
                            <p className="text-xs text-slate-500">{profile?.email || '-'}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-400 text-slate-700 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{isTr ? 'Bilgileri Düzenle' : 'Edit Info'}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                        <div className="flex items-center gap-2 text-slate-700 bg-white p-2.5 rounded-lg border border-slate-100">
                          <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">{isTr ? 'Telefon' : 'Phone'}</span>
                            <span className="font-medium">{profile?.phone || '-'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 bg-white p-2.5 rounded-lg border border-slate-100">
                          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">{isTr ? 'TC / Vergi No' : 'Tax ID / VKN'}</span>
                            <span className="font-medium">{profile?.tc_id || profile?.tax_number || '-'}</span>
                          </div>
                        </div>
                      </div>

                      {profile?.is_corporate && (
                        <div className="bg-white p-2.5 rounded-lg border border-slate-100 text-xs">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">{isTr ? 'Kurumsal Bilgiler' : 'Corporate Info'}</span>
                          <p className="font-semibold text-slate-800">{profile?.company_title || '-'}</p>
                          {profile?.tax_office && (
                            <p className="text-slate-500 text-[11px] mt-0.5">{isTr ? 'Vergi Dairesi:' : 'Tax Office:'} {profile.tax_office}</p>
                          )}
                        </div>
                      )}

                      <div className="bg-white p-3 rounded-lg border border-slate-100 text-xs">
                        <div className="flex items-start gap-2 text-slate-700">
                          <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">{isTr ? 'Kayıtlı Teslimat / Fatura Adresi' : 'Delivery Address'}</span>
                            <span className="font-medium text-slate-800">{profile?.address || (isTr ? 'Adres belirtilmemiş' : 'No address specified')}</span>
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
                          type="button"
                          onClick={() => {
                            onLogout();
                            onClose();
                          }}
                          className="w-full py-2.5 px-4 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                        >
                          {isTr ? 'Hesaptan Çıkış Yap' : 'Log Out'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">{isTr ? 'Ad' : 'First Name'} *</label>
                        <input
                          type="text" required
                          value={editForm.name}
                          onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-red-600 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">{isTr ? 'Soyad' : 'Last Name'}</label>
                        <input
                          type="text"
                          value={editForm.surname}
                          onChange={e => setEditForm({ ...editForm, surname: e.target.value })}
                          className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-red-600 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">{isTr ? 'Telefon' : 'Phone'} *</label>
                        <input
                          type="tel" required
                          value={editForm.phone}
                          onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                          className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-red-600 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">{isTr ? 'TC Kimlik / Vergi No (VKN)' : 'Tax ID / VKN'}</label>
                        <input
                          type="text"
                          value={editForm.tc_id}
                          onChange={e => setEditForm({ ...editForm, tc_id: e.target.value })}
                          maxLength={11}
                          placeholder="11 haneli TCKN veya 10 haneli VKN"
                          className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-red-600 outline-none"
                        />
                      </div>
                    </div>

                    <div className="pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={editForm.is_corporate}
                          onChange={e => setEditForm({ ...editForm, is_corporate: e.target.checked })}
                          className="rounded border-slate-300 text-red-600 focus:ring-red-600"
                        />
                        {isTr ? 'Kurumsal Fatura Bilgileri Ekle' : 'Corporate Invoice Information'}
                      </label>
                    </div>

                    {editForm.is_corporate && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">{isTr ? 'Şirket Ünvanı' : 'Company Title'}</label>
                          <input
                            type="text"
                            value={editForm.company_title}
                            onChange={e => setEditForm({ ...editForm, company_title: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-red-600 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">{isTr ? 'Vergi Dairesi' : 'Tax Office'}</label>
                          <input
                            type="text"
                            value={editForm.tax_office}
                            onChange={e => setEditForm({ ...editForm, tax_office: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-red-600 outline-none"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">{isTr ? 'Şehir / İl' : 'City'}</label>
                        <input
                          type="text"
                          value={editForm.city}
                          onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                          className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-red-600 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">{isTr ? 'Ülke' : 'Country'}</label>
                        <input
                          type="text"
                          value={editForm.country}
                          onChange={e => setEditForm({ ...editForm, country: e.target.value })}
                          className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-red-600 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">{isTr ? 'Teslimat & Fatura Açık Adresi' : 'Full Address'}</label>
                      <textarea
                        rows={2}
                        value={editForm.address}
                        onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-red-600 outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        {isTr ? 'Vazgeç' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-1.5 px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {isSaving ? (isTr ? 'Kaydediliyor...' : 'Saving...') : (isTr ? 'Değişiklikleri Kaydet' : 'Save Changes')}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: SIPARIS SURECLERI & YORUM/PUAN */}
            {activeTab === 'orders' && (
              <div className="space-y-3">
                {loadingOrders ? (
                  <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-slate-300 border-t-red-600 rounded-full animate-spin" />
                    <span>{isTr ? 'Sipariş süreçleri taranıyor...' : 'Loading orders...'}</span>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-700 font-bold text-sm">{isTr ? 'Henüz verilmiş bir siparişiniz bulunmamaktadır.' : 'No orders found yet.'}</p>
                    <p className="text-slate-400 text-xs mt-1">{isTr ? 'Verdiğiniz siparişlerin durumunu ve kargo takip süreçlerini buradan anlık takip edebilirsiniz.' : 'Your orders and real-time tracking will be listed here.'}</p>
                  </div>
                ) : (
                  orders.map((order: any, idx: number) => {
                    const badge = getStatusBadge(order.status);
                    const isExpanded = expandedOrderId === (order.id || idx);
                    const orderItems = Array.isArray(order.items) ? order.items : [];

                    return (
                      <div 
                        key={`cust-order-${order.id || idx}-${idx}`} 
                        className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden transition-all hover:border-slate-300"
                      >
                        <div 
                          className="p-3.5 flex flex-col sm:flex-row justify-between sm:items-center gap-3 cursor-pointer select-none bg-slate-50/60 hover:bg-slate-50 transition-colors"
                          onClick={() => setExpandedOrderId(isExpanded ? null : (order.id || idx))}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-xs shrink-0 shadow-sm">
                              #{order.id}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs sm:text-sm text-slate-900">
                                  {isTr ? 'Sipariş' : 'Order'} #{order.id}
                                </span>
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${badge.cls}`}>
                                  {badge.text}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {order.created_at ? new Date(order.created_at).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3">
                            <div className="text-left sm:text-right">
                              <p className="font-black text-slate-900 text-xs sm:text-sm">
                                {Number(order.total_amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {order.currency || 'TL'}
                              </p>
                              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                                {order.payment_method === 'credit_card' || order.payment_method === 'iyzico' ? 'Kredi Kartı' :
                                 order.payment_method === 'bank_transfer' ? 'Havale / EFT' :
                                 order.payment_method === 'cash_on_delivery' ? 'Kapıda Ödeme' :
                                 order.payment_method || 'Online'}
                              </span>
                            </div>
                            <div className="p-1 rounded-lg bg-white border border-slate-200 text-slate-400">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          </div>
                        </div>

                        {/* Order Details Accordion */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-white space-y-3 text-xs">
                            {/* Items List with Review/Rating Actions */}
                            {orderItems.length > 0 ? (
                              <div className="space-y-1.5">
                                <span className="text-[10px] uppercase font-bold text-slate-400">{isTr ? 'Sipariş Kalemleri & Eser Değerlendirme' : 'Order Items & Reviews'}</span>
                                <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-200 overflow-hidden">
                                  {orderItems.map((item: any, iIdx: number) => (
                                    <div key={`ord-item-${item.id || iIdx}`} className="p-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs bg-white">
                                      <div>
                                        <p className="font-bold text-slate-900">{item.product_name || item.name || `Eser ${iIdx + 1}`}</p>
                                        <p className="text-[11px] text-slate-400">{item.quantity} adet x {Number(item.unit_price || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {order.currency || 'TL'}</p>
                                      </div>
                                      
                                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0">
                                        <p className="font-black text-slate-800">
                                          {Number(item.total_price || (item.quantity * item.unit_price) || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {order.currency || 'TL'}
                                        </p>

                                        {/* Rate & Review Button for Delivered / Past Orders */}
                                        <button
                                          type="button"
                                          onClick={() => handleOpenReview(item, order)}
                                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                                          title="Kitabı Puanla & Yorum Yap"
                                        >
                                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                                          <span>{isTr ? 'Yorum Yap & Puanla' : 'Review & Rate'}</span>
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}

                            {/* Tracking / Shipping Info */}
                            {order.tracking_number && (
                              <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-lg flex items-center gap-2 text-blue-900 text-xs">
                                <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                                <div>
                                  <span className="font-bold">{order.shipping_carrier || 'Kargo'}:</span> {order.tracking_number}
                                </div>
                              </div>
                            )}

                            {/* Delivery Address */}
                            {order.customer_address && (
                              <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-800 block text-[10px] uppercase text-slate-400">{isTr ? 'Teslimat Adresi:' : 'Delivery Address:'}</span>
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

            {/* TAB 3: FAVORI KITAPLARIM */}
            {activeTab === 'favorites' && (
              <div className="space-y-3">
                {favoriteProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-700 font-bold text-sm">{isTr ? 'Henüz favori kitap eklemediniz.' : 'No favorite books yet.'}</p>
                    <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">{isTr ? 'Beğendiğiniz kitapların üzerindeki kalp ikonuna tıklayarak favorilerinize ekleyebilir, buradan hızlıca sipariş verebilirsiniz.' : 'Click the heart icon on any book to add it to your favorites.'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {favoriteProducts.map((book: any) => (
                      <div 
                        key={`fav-card-${book.id}`}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex gap-3 items-center hover:border-red-300 transition-all"
                      >
                        <div 
                          className="w-14 aspect-[2/3] rounded-md overflow-hidden bg-slate-200 shrink-0 cursor-pointer shadow-sm"
                          onClick={() => {
                            if (onViewProduct) {
                              onViewProduct(book);
                              onClose();
                            }
                          }}
                        >
                          <img
                            src={book.image_url || getBookCoverFallbackSvg(book.name, book.author)}
                            alt={book.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 
                            className="font-bold text-xs text-slate-900 truncate cursor-pointer hover:text-red-600"
                            onClick={() => {
                              if (onViewProduct) {
                                onViewProduct(book);
                                onClose();
                              }
                            }}
                          >
                            {book.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate">{book.author || 'Seçkin Yazar'}</p>
                          <p className="font-black text-xs text-red-600 mt-1">
                            {Number(book.price || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {book.currency || 'TRY'}
                          </p>

                          <div className="flex items-center gap-2 mt-2">
                            {addToBasket && (
                              <button
                                type="button"
                                onClick={() => addToBasket(book)}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-md text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer"
                              >
                                <ShoppingBag className="w-3 h-3" />
                                <span>{isTr ? 'Sepete Ekle' : 'Add to Cart'}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleToggleFav(book.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title={isTr ? 'Favorilerden Çıkar' : 'Remove'}
                            >
                              <Heart className="w-4 h-4 fill-rose-600 text-rose-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* INLINE REVIEW & RATING MODAL / DRAWER */}
          {reviewingItem && (
            <div className="p-4 border-t border-slate-200 bg-amber-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-900">
                  <MessageSquare className="w-4 h-4 text-amber-600" />
                  <span>{isTr ? 'Kitap Değerlendirme & Yorumu' : 'Review Book'}: {reviewingItem.productName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewingItem(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {reviewSuccess ? (
                <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{isTr ? 'Yorumunuz ve puanınız başarıyla kaydedildi! Teşekkür ederiz.' : 'Review submitted successfully! Thank you.'}</span>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-2.5 text-xs">
                  {/* Star Rating Picker */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-600">{isTr ? 'Puanınız:' : 'Rating:'}</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={`star-pick-${star}`}
                          type="button"
                          onMouseEnter={() => setReviewHoverRating(star)}
                          onMouseLeave={() => setReviewHoverRating(0)}
                          onClick={() => setReviewRating(star)}
                          className="p-0.5 transition-transform hover:scale-110 cursor-pointer"
                        >
                          <Star 
                            className={`w-5 h-5 ${
                              star <= (reviewHoverRating || reviewRating)
                                ? 'fill-amber-400 text-amber-500'
                                : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <span className="text-[11px] font-black text-amber-800">
                      {(reviewHoverRating || reviewRating)} / 5.0
                    </span>
                  </div>

                  {/* Comment Textarea */}
                  <textarea
                    required
                    rows={2}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder={isTr ? "Kitabın anlatımı, karakterleri ve baskı kalitesi hakkında düşünceleriniz..." : "Your review about the book..."}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewingItem(null)}
                      className="px-3 py-1.5 text-xs text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      {isTr ? 'Vazgeç' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isTr ? 'Yorumu Kaydet & Yayınla' : 'Submit Review'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

