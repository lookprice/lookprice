import React from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Mail, 
  CreditCard, 
  Building2, 
  MapPin, 
  Home, 
  ShoppingBag, 
  Truck, 
  ExternalLink, 
  RotateCcw, 
  Loader2 
} from 'lucide-react';

interface StoreProfileProps {
  lang: string;
  t: any;
  store: any;
  primaryColor: string;
  isProfileView: boolean;
  isOrdersView: boolean;
  isReturnView: boolean;
  customerProfile: any;
  isEditingProfile: boolean;
  setIsEditingProfile: (val: boolean) => void;
  profileEditForm: any;
  setProfileEditForm: React.Dispatch<React.SetStateAction<any>>;
  handleCustomerUpdate: (e: React.FormEvent) => void;
  orders: any[];
  loadingOrders: boolean;
}

export const StoreProfile: React.FC<StoreProfileProps> = ({
  lang,
  t,
  store,
  primaryColor,
  isProfileView,
  isOrdersView,
  isReturnView,
  customerProfile,
  isEditingProfile,
  setIsEditingProfile,
  profileEditForm,
  setProfileEditForm,
  handleCustomerUpdate,
  orders,
  loadingOrders,
}) => {
  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-12 custom-scrollbar bg-white/50 backdrop-blur-xl">
      {isProfileView && customerProfile && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            <div className="p-8 md:p-12 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tighter">
                  {lang === "tr" ? "Hesap Bilgilerim" : "My Account"}
                </h2>
                <p className="text-gray-400 font-medium text-sm mt-1">
                  {lang === "tr"
                    ? "Profilinizi ve adres bilgilerinizi yönetin"
                    : "Manage your profile and address details"}
                </p>
              </div>
              {!isEditingProfile && (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-semibold text-sm hover:bg-gray-800 transition-all flex items-center gap-2"
                >
                  {lang === "tr" ? "Bilgileri Düzenle" : "Edit Profile"}
                </button>
              )}
            </div>

            <div className="p-8 md:p-12">
              {isEditingProfile ? (
                <form onSubmit={handleCustomerUpdate} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1">
                        {lang === "tr" ? "AD" : "NAME"}
                      </label>
                      <input
                        required
                        type="text"
                        value={profileEditForm.name || ""}
                        onChange={(e) =>
                          setProfileEditForm((prev: any) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-gray-100 rounded-2xl transition-all outline-none font-bold text-gray-900"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1">
                        {lang === "tr" ? "SOYAD" : "SURNAME"}
                      </label>
                      <input
                        required
                        type="text"
                        value={profileEditForm.surname || ""}
                        onChange={(e) =>
                          setProfileEditForm((prev: any) => ({
                            ...prev,
                            surname: e.target.value,
                          }))
                        }
                        className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-gray-100 rounded-2xl transition-all outline-none font-bold text-gray-900"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1">
                        {lang === "tr" ? "ÜLKE" : "COUNTRY"}
                      </label>
                      <input
                        required
                        type="text"
                        value={profileEditForm.country || ""}
                        onChange={(e) =>
                          setProfileEditForm((prev: any) => ({
                            ...prev,
                            country: e.target.value,
                          }))
                        }
                        className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-gray-100 rounded-2xl transition-all outline-none font-bold text-gray-900"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1">
                        {lang === "tr" ? "İL" : "CITY"}
                      </label>
                      <input
                        required
                        type="text"
                        value={profileEditForm.city || ""}
                        onChange={(e) =>
                          setProfileEditForm((prev: any) => ({
                            ...prev,
                            city: e.target.value,
                          }))
                        }
                        className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-gray-100 rounded-2xl transition-all outline-none font-bold text-gray-900"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1">
                        {lang === "tr"
                          ? "T.C. KİMLİK NUMARASI"
                          : "TC ID"}
                      </label>
                      <input
                        type="text"
                        value={profileEditForm.tc_id || ""}
                        onChange={(e) =>
                          setProfileEditForm((prev: any) => ({
                            ...prev,
                            tc_id: e.target.value,
                          }))
                        }
                        className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-gray-100 rounded-2xl transition-all outline-none font-bold text-gray-900"
                      />
                    </div>
                    <div className="space-y-2 flex flex-col justify-center">
                      <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1 mb-2">
                        {lang === "tr"
                          ? "HESAP TÜRÜ"
                          : "ACCOUNT TYPE"}
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="edit_is_corporate"
                            checked={!profileEditForm.is_corporate}
                            onChange={() =>
                              setProfileEditForm((prev: any) => ({
                                ...prev,
                                is_corporate: false,
                              }))
                            }
                            className="w-4 h-4 text-primary focus:ring-primary"
                          />
                          <span className="text-sm font-bold text-gray-700">
                            {lang === "tr"
                              ? "Bireysel"
                              : "Individual"}
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="edit_is_corporate"
                            checked={profileEditForm.is_corporate}
                            onChange={() =>
                              setProfileEditForm((prev: any) => ({
                                ...prev,
                                is_corporate: true,
                              }))
                            }
                            className="w-4 h-4 text-primary focus:ring-primary"
                          />
                          <span className="text-sm font-bold text-gray-700">
                            {lang === "tr" ? "Kurumsal" : "Corporate"}
                          </span>
                        </label>
                      </div>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1">
                        {t.dashboard.address}
                      </label>
                      <textarea
                        required
                        value={profileEditForm.address || ""}
                        onChange={(e) =>
                          setProfileEditForm((prev: any) => ({
                            ...prev,
                            address: e.target.value,
                          }))
                        }
                        className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-gray-100 rounded-2xl transition-all outline-none font-bold text-gray-900 resize-none"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 pt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingProfile(false);
                        setProfileEditForm(customerProfile);
                      }}
                      className="flex-1 py-5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-2xl font-semibold transition-all"
                    >
                      {lang === "tr" ? "İptal" : "Cancel"}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-5 text-white rounded-2xl font-semibold transition-all shadow-xl active:scale-95"
                      style={{
                        backgroundColor: primaryColor,
                        boxShadow: `0 10px 25px -5px ${primaryColor}40`,
                      }}
                    >
                      {lang === "tr" ? "Kaydet" : "Save"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-8">
                    <div>
                      <label className="text-[10px] font-semibold text-gray-400 tracking-wide mb-2 block">
                        Kişisel Bilgiler
                      </label>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xss text-gray-400 font-bold tracking-wide">
                              {lang === "tr"
                                ? "Ad Soyad"
                                : "Full Name"}
                            </p>
                            <p className="text-base font-semibold text-gray-900">
                              {customerProfile.name}{" "}
                              {customerProfile.surname}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                            <Mail className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xss text-gray-400 font-bold tracking-wide">
                              E-posta
                            </p>
                            <p className="text-base font-semibold text-gray-900">
                              {customerProfile.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                            <CreditCard className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xss text-gray-400 font-bold tracking-wide">
                              {lang === "tr"
                                ? "T.C. Kimlik No"
                                : "TC ID"}
                            </p>
                            <p className="text-base font-semibold text-gray-900">
                              {customerProfile.tc_id || "-"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xss text-gray-400 font-bold tracking-wide">
                              {lang === "tr"
                                ? "Hesap Türü"
                                : "Account Type"}
                            </p>
                            <p className="text-base font-semibold text-gray-900">
                              {customerProfile.is_corporate
                                ? lang === "tr"
                                  ? "Kurumsal"
                                  : "Corporate"
                                : lang === "tr"
                                  ? "Bireysel"
                                  : "Individual"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <label className="text-[10px] font-semibold text-gray-400 tracking-wide mb-2 block">
                        Adres Bilgileri
                      </label>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xss text-gray-400 font-bold tracking-wide">
                              {lang === "tr" ? "Konum" : "Location"}
                            </p>
                            <p className="text-base font-semibold text-gray-900">
                              {customerProfile.city},{" "}
                              {customerProfile.country}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 mt-1">
                            <Home className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xss text-gray-400 font-bold tracking-wide">
                              {lang === "tr"
                                ? "Tam Adres"
                                : "Full Address"}
                            </p>
                            <p className="text-base font-semibold text-gray-900 leading-tight">
                              {customerProfile.address}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {isOrdersView && (
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tighter">
              {lang === "tr" ? "Siparişlerim" : "My Orders"}
            </h2>
            <div className="px-4 py-1.5 bg-gray-100 rounded-lg text-[10px] font-semibold text-gray-500 tracking-wide">
              {orders.length} {lang === "tr" ? "SİPARİŞ" : "ORDERS"}
            </div>
          </div>

          {loadingOrders ? (
            <div className="bg-white rounded-lg p-20 text-center border border-gray-100 shadow-sm">
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
              <p className="text-gray-500 font-bold">
                {lang === "tr"
                  ? "Siparişler yükleniyor..."
                  : "Loading orders..."}
              </p>
            </div>
          ) : orders.length > 0 ? (
            <div className="grid gap-4">
              {orders.map((order: any) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group bg-white rounded-2xl border border-gray-100 hover:border-primary/20 transition-all shadow-sm hover:shadow-xl overflow-hidden"
                >
                  <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-semibold text-gray-400 tracking-wide">
                            #{order.id}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                          <span className="text-[10px] font-bold text-gray-500">
                            {new Date(order.created_at).toLocaleDateString(
                              lang === "tr" ? "tr-TR" : "en-US",
                            )}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {order.items_count || order.items?.length || 1}{" "}
                          {lang === "tr" ? "Ürün" : "Items"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center flex-wrap gap-4 md:gap-8">
                      <div className="hidden sm:block">
                        <p className="text-[10px] font-semibold text-gray-400 tracking-wide mb-1">
                          {lang === "tr" ? "ÖDEME" : "PAYMENT"}
                        </p>
                        <p className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                          <CreditCard className="w-3 h-3" />
                          {order.payment_method === "iyzico"
                            ? "iyzico"
                            : order.payment_method === "bank_transfer"
                              ? lang === "tr" ? "Havale" : "Transfer"
                              : order.payment_method === "cash_on_delivery"
                                ? lang === "tr" ? "Kapıda" : "COD"
                                : order.payment_method}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 tracking-wide mb-1">
                          {lang === "tr" ? "TUTAR" : "TOTAL"}
                        </p>
                        <p className="text-sm font-semibold text-primary">
                          {order.total_amount?.toLocaleString(
                            lang === "tr" ? "tr-TR" : "en-US",
                            { minimumFractionDigits: 2 },
                          )}{" "}
                          {order.currency}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 tracking-wide mb-1 text-right">
                          {lang === "tr" ? "DURUM" : "STATUS"}
                        </p>
                        <span
                          className={`inline-flex px-3 py-1 rounded-lg text-[9px] font-semibold tracking-wide border transition-colors ${
                            order.status === "completed" || order.status === "delivered"
                              ? "bg-green-50 text-green-600 border-green-100"
                              : order.status === "shipped" || order.status === "processing"
                                ? "bg-blue-50 text-blue-600 border-blue-100"
                                : order.status === "cancelled" || order.status === "returned"
                                  ? "bg-red-50 text-red-600 border-red-100"
                                  : "bg-orange-50 text-orange-600 border-orange-100"
                          }`}
                        >
                          {order.status === "pending" ? (lang === "tr" ? "Bekliyor" : "Pending") :
                           order.status === "processing" ? (lang === "tr" ? "Hazırlanıyor" : "Preparing") :
                           order.status === "shipped" ? (lang === "tr" ? "Kargoda" : "Shipped") :
                           order.status === "delivered" ? (lang === "tr" ? "Teslim Edildi" : "Delivered") :
                           order.status === "completed" ? (lang === "tr" ? "Tamamlandı" : "Completed") :
                           order.status === "cancelled" ? (lang === "tr" ? "İptal Edildi" : "Cancelled") : order.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="px-4 py-2 bg-blue-50/30 border-t border-gray-100 italic text-xs text-gray-500">
                      {lang === "tr" ? "Not: " : "Note: "}
                      {order.notes}
                    </div>
                  )}

                  {(order.tracking_number || order.shipping_carrier) && (
                    <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] font-semibold text-gray-400 tracking-wide">
                            {lang === "tr" ? "KARGO BİLGİSİ" : "SHIPPING INFO"}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-700">
                              {order.shipping_carrier || (lang === "tr" ? "Standart Kargo" : "Standard Shipping")}
                            </span>
                            {order.tracking_number && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span className="text-xs font-mono font-bold text-primary select-all">
                                  {order.tracking_number}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {order.tracking_number && (
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            const carrier = order.shipping_carrier?.toLowerCase() || '';
                            let url = "";
                            if (carrier.includes("aras")) url = `https://www.araskargo.com.tr/takipp-detay?kargo_no=${order.tracking_number}`;
                            else if (carrier.includes("yurtiçi")) url = `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${order.tracking_number}`;
                            else if (carrier.includes("mng")) url = `https://www.mngkargo.com.tr/gonderitakip/${order.tracking_number}`;
                            else if (carrier.includes("ptt")) url = `https://gonderitakip.ptt.gov.tr/Track/Verify?id=${order.tracking_number}`;
                            else if (carrier.includes("ups")) url = `https://www.ups.com/track?tracknum=${order.tracking_number}`;
                            if (url) window.open(url, "_blank");
                          }}
                          className="px-4 py-1.5 bg-white border border-gray-200 rounded-xl text-[10px] font-semibold text-gray-600 hover:border-primary hover:text-primary transition-all flex items-center gap-2"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {lang === "tr" ? "KARGO TAKİP" : "TRACK SHIPPING"}
                        </a>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-20 text-center border border-gray-100 shadow-sm">
              <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-10 h-10 text-gray-200" />
              </div>
              <p className="text-gray-400 font-bold">
                {lang === "tr" ? "Henüz bir siparişiniz bulunmuyor." : "You don't have any orders yet."}
              </p>
            </div>
          )}
        </div>
      )}

      {isReturnView && (
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-12 border border-gray-100">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tighter mb-12">
            {lang === "tr" ? "İade Taleplerim" : "My Return Requests"}
          </h2>
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <RotateCcw className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-400 font-bold">
              {lang === "tr" ? "Aktif bir iade veya değişim talebiniz bulunmuyor." : "You don't have any active return or exchange requests."}
            </p>
          </div>
        </div>
      )}
    </main>
  );
};
