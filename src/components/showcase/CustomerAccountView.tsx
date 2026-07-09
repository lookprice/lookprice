import React from "react";
import { User, Package, RotateCcw, LogOut, Edit3, MapPin, Phone, Mail, ChevronRight, CheckCircle2, Loader2, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CustomerAccountViewProps {
  isProfileView: boolean;
  isOrdersView: boolean;
  isReturnView: boolean;
  customerProfile: any;
  profileEditForm: any;
  setProfileEditForm: (val: any) => void;
  isEditingProfile: boolean;
  setIsEditingProfile: (val: boolean) => void;
  handleProfileUpdate: (e: React.FormEvent) => void;
  orders: any[];
  loadingOrders: boolean;
  lang: string;
  t: any;
  navigate: (path: string) => void;
  handleLogout: () => void;
  getStorePath: (path: string) => string;
}

export const CustomerAccountView: React.FC<CustomerAccountViewProps> = ({
  isProfileView,
  isOrdersView,
  isReturnView,
  customerProfile,
  profileEditForm,
  setProfileEditForm,
  isEditingProfile,
  setIsEditingProfile,
  handleProfileUpdate,
  orders,
  loadingOrders,
  lang,
  t,
  navigate,
  handleLogout,
  getStorePath,
}) => {
  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-12">
      {isProfileView && (
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-50">
            <div className="grid grid-cols-1 lg:grid-cols-3">
              {/* Profile Sidebar */}
              <div className="bg-gray-50 p-6 md:p-8 border-r border-gray-100">
                <div className="flex flex-col items-center text-center mb-10">
                  <div className="w-24 h-24 bg-white rounded-xl shadow-xl flex items-center justify-center mb-6 border-4 border-white">
                    <User className="w-10 h-10 text-gray-900" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tighter mb-1">
                    {customerProfile?.name} {customerProfile?.surname}
                  </h2>
                  <p className="text-gray-400 text-xss font-bold tracking-wide uppercase">
                    {customerProfile?.email}
                  </p>
                </div>

                <nav className="space-y-2">
                  <button
                    onClick={() => navigate(getStorePath("/profile"))}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl text-sm font-bold transition-all ${
                      isProfileView ? "bg-gray-900 text-white shadow-xl" : "text-gray-600 hover:bg-white"
                    }`}
                  >
                    <User className="w-5 h-5" />
                    {lang === "tr" ? "Profilim" : "My Profile"}
                  </button>
                  <button
                    onClick={() => navigate(getStorePath("/orders"))}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl text-sm font-bold transition-all ${
                      isOrdersView ? "bg-gray-900 text-white shadow-xl" : "text-gray-600 hover:bg-white"
                    }`}
                  >
                    <Package className="w-5 h-5" />
                    {lang === "tr" ? "Siparişlerim" : "My Orders"}
                  </button>
                  <button
                    onClick={() => navigate(getStorePath("/return"))}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl text-sm font-bold transition-all ${
                      isReturnView ? "bg-gray-900 text-white shadow-xl" : "text-gray-600 hover:bg-white"
                    }`}
                  >
                    <RotateCcw className="w-5 h-5" />
                    {lang === "tr" ? "İade Talebi" : "Return Request"}
                  </button>
                  <div className="pt-6 mt-6 border-t border-gray-200">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-4 px-6 py-4 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all"
                    >
                      <LogOut className="w-5 h-5" />
                      {lang === "tr" ? "Çıkış Yap" : "Logout"}
                    </button>
                  </div>
                </nav>
              </div>

              {/* Profile Content */}
              <div className="lg:col-span-2 p-6 md:p-12 bg-white">
                <div className="flex items-center justify-between mb-12">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tighter">
                      {lang === "tr" ? "Profil Bilgileri" : "Profile Settings"}
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                      {lang === "tr" ? "Hesap bilgilerinizi güncelleyin" : "Update your account information"}
                    </p>
                  </div>
                  {!isEditingProfile && (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:shadow-xl transition-all"
                    >
                      <Edit3 className="w-4 h-4" />
                      {lang === "tr" ? "Düzenle" : "Edit"}
                    </button>
                  )}
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleProfileUpdate} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xss font-bold text-gray-400 uppercase tracking-widest">{lang === "tr" ? "Ad" : "Name"}</label>
                        <input
                          type="text"
                          value={profileEditForm.name || ""}
                          onChange={(e) => setProfileEditForm({ ...profileEditForm, name: e.target.value })}
                          className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xss font-bold text-gray-400 uppercase tracking-widest">{lang === "tr" ? "Soyad" : "Surname"}</label>
                        <input
                          type="text"
                          value={profileEditForm.surname || ""}
                          onChange={(e) => setProfileEditForm({ ...profileEditForm, surname: e.target.value })}
                          className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xss font-bold text-gray-400 uppercase tracking-widest">{lang === "tr" ? "Telefon" : "Phone"}</label>
                        <input
                          type="tel"
                          value={profileEditForm.phone || ""}
                          onChange={(e) => setProfileEditForm({ ...profileEditForm, phone: e.target.value })}
                          className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xss font-bold text-gray-400 uppercase tracking-widest">{lang === "tr" ? "Adres" : "Address"}</label>
                      <textarea
                        value={profileEditForm.address || ""}
                        onChange={(e) => setProfileEditForm({ ...profileEditForm, address: e.target.value })}
                        className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all text-sm h-32"
                      />
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                      <button
                        type="submit"
                        className="px-8 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:shadow-xl transition-all"
                      >
                        {lang === "tr" ? "Güncelle" : "Update Profile"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="px-8 py-3 bg-white text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all"
                      >
                        {lang === "tr" ? "İptal" : "Cancel"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-gray-900" />
                        </div>
                        <div>
                          <p className="text-xss font-bold text-gray-400 uppercase tracking-widest mb-1">{lang === "tr" ? "Adres" : "Address"}</p>
                          <p className="text-gray-900 font-medium leading-relaxed">{customerProfile?.address || (lang === "tr" ? "Adres belirtilmemiş" : "No address provided")}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Phone className="w-5 h-5 text-gray-900" />
                        </div>
                        <div>
                          <p className="text-xss font-bold text-gray-400 uppercase tracking-widest mb-1">{lang === "tr" ? "Telefon" : "Phone"}</p>
                          <p className="text-gray-900 font-medium">{customerProfile?.phone || (lang === "tr" ? "Telefon belirtilmemiş" : "No phone provided")}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Mail className="w-5 h-5 text-gray-900" />
                        </div>
                        <div>
                          <p className="text-xss font-bold text-gray-400 uppercase tracking-widest mb-1">{lang === "tr" ? "E-posta" : "Email"}</p>
                          <p className="text-gray-900 font-medium">{customerProfile?.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isOrdersView && (
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tighter">
                {lang === "tr" ? "Siparişlerim" : "My Orders"}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {lang === "tr" ? "Tüm siparişlerinizi buradan takip edebilirsiniz" : "Track all your orders here"}
              </p>
            </div>
            <button
              onClick={() => navigate(getStorePath("/"))}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:shadow-xl transition-all"
            >
              {lang === "tr" ? "Alışverişe Devam Et" : "Continue Shopping"}
            </button>
          </div>

          {loadingOrders ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-gray-300 animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-100 p-20 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-gray-200" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {lang === "tr" ? "Henüz siparişiniz yok" : "No orders yet"}
              </h3>
              <p className="text-gray-400 mb-8 max-w-xs mx-auto">
                {lang === "tr" ? "Hemen keşfetmeye başlayın ve ilk siparişinizi verin!" : "Start exploring and place your first order!"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-all duration-500">
                  <div className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Package className="w-8 h-8 text-gray-900" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="text-lg font-bold text-gray-900">#{order.order_number || order.id}</h4>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              order.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                              order.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-gray-400 text-xss font-bold uppercase tracking-widest">
                            {new Date(order.created_at).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", {
                              day: "numeric",
                              month: "long",
                              year: "numeric"
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-left md:text-right">
                        <p className="text-xss font-bold text-gray-400 uppercase tracking-widest mb-1">{lang === "tr" ? "Toplam Tutar" : "Total Amount"}</p>
                        <p className="text-2xl font-bold text-gray-900">{order.total_amount} {order.currency}</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-50 pt-8 mt-8">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-8">
                          <div className="flex items-center gap-2 text-gray-500 font-medium">
                            <MapPin className="w-4 h-4" />
                            {order.delivery_address?.slice(0, 40)}...
                          </div>
                          <div className="flex items-center gap-2 text-gray-500 font-medium">
                            <ChevronRight className="w-4 h-4" />
                            {order.items?.length} {lang === "tr" ? "Ürün" : "Items"}
                          </div>
                        </div>
                        <button className="flex items-center gap-2 text-gray-900 font-bold hover:gap-3 transition-all">
                          {lang === "tr" ? "Detayları Gör" : "View Details"}
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isReturnView && (
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-50 text-center">
            <div className="w-24 h-24 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <RotateCcw className="w-12 h-12 text-gray-900" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tighter mb-4">
              {lang === "tr" ? "İade Talebi Oluştur" : "Create Return Request"}
            </h1>
            <p className="text-gray-500 leading-relaxed mb-10 text-lg">
              {lang === "tr" 
                ? "İade işlemleriniz için lütfen siparişlerim sayfasından ilgili siparişi seçerek iade talebi oluşturunuz veya bizimle iletişime geçiniz."
                : "For returns, please select the relevant order from my orders page or contact us directly."}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate(getStorePath("/orders"))}
                className="w-full sm:w-auto px-10 py-4 bg-gray-900 text-white rounded-xl text-sm font-bold hover:shadow-2xl transition-all"
              >
                {lang === "tr" ? "Siparişlerime Git" : "Go to My Orders"}
              </button>
              <button
                onClick={() => navigate(getStorePath("/contact"))}
                className="w-full sm:w-auto px-10 py-4 bg-white text-gray-900 border border-gray-100 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all"
              >
                {lang === "tr" ? "Destek Al" : "Get Support"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
