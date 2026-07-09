import React from "react";
import { X, AlertTriangle, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Store, Lead, EnrakipsizSlide, EnrakipsizAd } from "../../types/superadmin";
import { DEVELOPED_COUNTRIES } from "../../constants";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white p-6 rounded-2xl max-w-lg w-full relative max-h-[90vh] overflow-y-auto"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"><X className="h-5 w-5" /></button>
          {children}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export const SlideModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  slide: any;
  setSlide: (slide: any) => void;
  onSave: (e: React.FormEvent) => void;
}> = ({ isOpen, onClose, slide, setSlide, onSave }) => (
  <Modal isOpen={isOpen} onClose={onClose}>
    <h2 className="text-xl font-bold mb-5">Vitrin Slaytı Düzenle / Ekle</h2>
    <form onSubmit={onSave} className="space-y-4">
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Başlık (Title)</label>
        <input 
          type="text" 
          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
          value={slide.title || ""} 
          onChange={e => setSlide({...slide, title: e.target.value})} 
          required 
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Alt Başlık (Subtitle)</label>
        <input 
          type="text" 
          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
          value={slide.subtitle || ""} 
          onChange={e => setSlide({...slide, subtitle: e.target.value})} 
          required 
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Açıklama (Description)</label>
        <textarea 
          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs h-16" 
          value={slide.description || ""} 
          onChange={e => setSlide({...slide, description: e.target.value})} 
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Görsel Adresi (Image URL)</label>
        <input 
          type="text" 
          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
          value={slide.image_url || ""} 
          onChange={e => setSlide({...slide, image_url: e.target.value})} 
          required 
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Sponsor/Yayınlayan Rozeti</label>
        <input 
          type="text" 
          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
          value={slide.badge || ""} 
          onChange={e => setSlide({...slide, badge: e.target.value})} 
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Kategori Türü (Type)</label>
        <select 
          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" 
          value={slide.type || "vehicle"} 
          onChange={e => setSlide({...slide, type: e.target.value})}
        >
          <option value="vehicle">Otomobil & Araç</option>
          <option value="real_estate">Emlak & Gayrimenkul</option>
          <option value="product">Diğer Özel Ürünler</option>
          <option value="all">Genel</option>
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tıklama Yönlendirme Linki (Link URL)</label>
        <input 
          type="text" 
          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
          value={slide.link_url || ""} 
          onChange={e => setSlide({...slide, link_url: e.target.value})} 
          placeholder="Eşleşen ilan veya dış link"
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Kart Renk Geçiş Grubu (Accent Gradient)</label>
        <input 
          type="text" 
          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono" 
          value={slide.accent || "from-indigo-500 to-purple-500"} 
          onChange={e => setSlide({...slide, accent: e.target.value})} 
        />
      </div>
      <div className="flex items-center gap-2">
        <input 
          type="checkbox" 
          id="slide-is-active"
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" 
          checked={slide.is_active !== false} 
          onChange={e => setSlide({...slide, is_active: e.target.checked})} 
        />
        <label htmlFor="slide-is-active" className="text-sm font-semibold text-gray-700">Bu slayt aktif vizyonda gösterilsin</label>
      </div>
      <div className="flex space-x-2 pt-3">
        <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold text-xs">Kaydet</button>
        <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-gray-950 py-2 rounded-lg font-bold text-xs">İptal</button>
      </div>
    </form>
  </Modal>
);

export const AdModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  ad: any;
  setAd: (ad: any) => void;
  onSave: (e: React.FormEvent) => void;
}> = ({ isOpen, onClose, ad, setAd, onSave }) => (
  <Modal isOpen={isOpen} onClose={onClose}>
    <h2 className="text-xl font-bold mb-5">Sponsor Reklam Kampanyası Düzenle / Ekle</h2>
    <form onSubmit={onSave} className="space-y-4">
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Reklam Kampanya Başlığı</label>
        <input 
          type="text" 
          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
          value={ad.title || ""} 
          onChange={e => setAd({...ad, title: e.target.value})} 
          required 
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Reklam Veren Broker (Yayınlayan)</label>
        <input 
          type="text" 
          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
          value={ad.broker || ""} 
          onChange={e => setAd({...ad, broker: e.target.value})} 
          required 
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Kampanya Açıklama Metni</label>
        <textarea 
          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs h-16" 
          value={ad.description || ""} 
          onChange={e => setAd({...ad, description: e.target.value})} 
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Slogan Rozeti (e.g., %1.19 Tercihli Faiz)</label>
        <input 
          type="text" 
          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
          value={ad.profit_badge || ""} 
          onChange={e => setAd({...ad, profit_badge: e.target.value})} 
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Buton Aksiyon Yazısı</label>
        <input 
          type="text" 
          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
          value={ad.action_text || "Hemen Keşfet"} 
          onChange={e => setAd({...ad, action_text: e.target.value})} 
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Reklam Tıklama Linki (Link URL)</label>
        <input 
          type="text" 
          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
          value={ad.link_url || ""} 
          onChange={e => setAd({...ad, link_url: e.target.value})} 
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Medya Türü</label>
        <select 
          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" 
          value={ad.media_type || "image"} 
          onChange={e => setAd({...ad, media_type: e.target.value})}
        >
          <option value="image">Görsel (Image URL)</option>
          <option value="video">Promosyon Videosu (Youtube/Video Link)</option>
          <option value="html">Özel HTML Kod bloğu / Metin</option>
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Medya URL Adresi (Görsel veya Video linki)</label>
        <input 
          type="text" 
          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
          value={ad.media_url || ""} 
          onChange={e => setAd({...ad, media_url: e.target.value})} 
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Yerleşim Pozisyonu (Layout Position)</label>
        <select 
          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" 
          value={ad.position || "middle"} 
          onChange={e => setAd({...ad, position: e.target.value})}
        >
          <option value="top">Üst Duyuru Altı Banner</option>
          <option value="middle">İlan Kartları Arası Büyük Sponsor Kartı</option>
          <option value="sidebar">Sağ/Sol Yan Sütun Reklamı</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input 
          type="checkbox" 
          id="ad-is-active"
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" 
          checked={ad.is_active !== false} 
          onChange={e => setAd({...ad, is_active: e.target.checked})} 
        />
        <label htmlFor="ad-is-active" className="text-sm font-semibold text-gray-700">Bu kampanya yayında ve aktif gösterilsin</label>
      </div>
      <div className="flex space-x-2 pt-3">
        <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold text-xs">Kaydet</button>
        <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-gray-950 py-2 rounded-lg font-bold text-xs">İptal</button>
      </div>
    </form>
  </Modal>
);

export const LeadModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  lead: any;
  setLead: (lead: any) => void;
  onSave: (e: React.FormEvent) => void;
  st: any;
}> = ({ isOpen, onClose, lead, setLead, onSave, st }) => (
  <Modal isOpen={isOpen} onClose={onClose}>
    <h2 className="text-xl font-bold mb-5">{st.manageLead}</h2>
    <form onSubmit={onSave} className="space-y-3">
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{st.processStatus}</label>
        <select 
          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
          value={lead.status} 
          onChange={e => setLead({...lead, status: e.target.value})}
        >
          <option value="new">Yeni</option>
          <option value="contacted">İletişime Geçildi</option>
          <option value="demo">Demo Yapıldı</option>
          <option value="sold">Satış Tamamlandı</option>
          <option value="lost">Kaybedildi</option>
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{st.salesProbability} (%{lead.probability})</label>
        <input 
          type="range" 
          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
          min="0" max="100" 
          value={lead.probability} 
          onChange={e => setLead({...lead, probability: parseInt(e.target.value)})} 
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{st.meetingNotes}</label>
        <textarea 
          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
          rows={3} 
          value={lead.notes || ""} 
          onChange={e => setLead({...lead, notes: e.target.value})}
          placeholder={st.notesPlaceholder}
        />
      </div>
      <div className="flex space-x-2 pt-3">
        <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold text-sm">{st.update}</button>
        <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-gray-900 py-2 rounded-lg font-bold text-sm">{st.close}</button>
      </div>
    </form>
  </Modal>
);

export const EditStoreModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  store: any;
  setStore: (store: any) => void;
  onSave: (e: React.FormEvent) => void;
  stores: Store[];
  st: any;
}> = ({ isOpen, onClose, store, setStore, onSave, stores, st }) => (
  <Modal isOpen={isOpen} onClose={onClose}>
    <h2 className="text-xl font-bold mb-5">{st.editStore}</h2>
    <form onSubmit={onSave} className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="space-y-3">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{st.storeName}</label>
          <input 
            type="text" 
            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
            value={store.name} 
            onChange={e => setStore({...store, name: e.target.value})} 
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{st.slug}</label>
          <input 
            type="text" 
            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
            value={store.slug} 
            onChange={e => setStore({...store, slug: e.target.value})} 
          />
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{st.authorizedPerson}</label>
          <input 
            type="text" 
            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
            value={store.contact_person} 
            onChange={e => setStore({...store, contact_person: e.target.value})} 
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{st.phone}</label>
          <input 
            type="text" 
            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
            value={store.phone} 
            onChange={e => {
              let val = e.target.value;
              if (val && !val.startsWith('+')) val = '+' + val;
              setStore({...store, phone: val});
            }} 
          />
        </div>
      </div>
      <div className="md:col-span-2">
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{st.address}</label>
        <textarea 
          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
          rows={2} 
          value={store.address || ""} 
          onChange={e => setStore({...store, address: e.target.value})} 
        />
      </div>
      <div className="grid grid-cols-2 gap-3 md:col-span-2">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{st.country}</label>
          <select 
            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
            value={store.country || "TR"} 
            onChange={e => {
              const country = DEVELOPED_COUNTRIES.find(c => c.code === e.target.value);
              setStore({
                ...store, 
                country: e.target.value,
                phone: country && (!store.phone || store.phone.trim() === '') ? country.dialCode + " " : store.phone
              });
            }}
          >
            {DEVELOPED_COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{st.email}</label>
          <input 
            type="email" 
            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
            value={store.email} 
            onChange={e => setStore({...store, email: e.target.value})} 
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 md:col-span-2">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{st.currency}</label>
          <select 
            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
            value={store.default_currency || "TRY"} 
            onChange={e => setStore({...store, default_currency: e.target.value})}
          >
            <option value="TRY">TRY</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{st.language}</label>
          <select 
            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
            value={store.language || "tr"} 
            onChange={e => setStore({...store, language: e.target.value})}
          >
            <option value="tr">Turkish</option>
            <option value="en">English</option>
            <option value="de">German</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Plan</label>
          <select 
            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
            value={store.plan || "free"} 
            onChange={e => setStore({...store, plan: e.target.value})}
          >
            <option value="free">Free</option>
            <option value="basic">Basic</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
      </div>
      <div className="md:col-span-2">
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{st.newAdminPassword}</label>
        <input 
          type="text" 
          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
          value={store.admin_password || ""} 
          onChange={e => setStore({...store, admin_password: e.target.value})} 
          placeholder={st.passwordNote}
        />
      </div>
      <div className="md:col-span-2 space-y-4">
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Mağaza Türü / Sektörü</label>
        <select 
          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
          value={store.store_type || "product"} 
          onChange={e => setStore({...store, store_type: e.target.value as any})}
        >
          <option value="product">Ürün & Perakende (Standart Satış)</option>
          <option value="real_estate">Emlak (Gayrimenkul)</option>
          <option value="motor_vehicle">Motorlu Taşıtlar (Oto, Moto, Deniz, İş, Tarım)</option>
        </select>

        {store.store_type === 'motor_vehicle' && (
          <select 
            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
            value={store.sub_sector || ""} 
            onChange={e => setStore({...store, sub_sector: e.target.value as any})}
          >
            <option value="">Kategori Seçiniz</option>
            <option value="car">Otomobil & Hafif Ticari</option>
            <option value="motorcycle">Motosiklet</option>
            <option value="marine">Deniz Taşıtları</option>
            <option value="construction">İş Makineleri</option>
            <option value="agricultural">Tarım Makineleri</option>
            <option value="other">Diğer Motorlu Taşıtlar</option>
          </select>
        )}
      </div>
      <div className="md:col-span-2">
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Üst Mağaza (Şube ise)</label>
        <select 
          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
          value={store.parent_id || ""} 
          onChange={e => setStore({...store, parent_id: e.target.value})}
        >
          <option value="">Bağımsız Mağaza</option>
          {stores.filter(s => s.id !== store.id && !s.parent_id).map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-2">
        <h3 className="text-xs font-bold text-indigo-600 uppercase mb-3 flex items-center">
          🛡️ MAĞAZA ONAY, KOTA & LİMİT AYARLARI
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Mağaza Onay Durumu</label>
            <select 
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold" 
              value={store.status || "approved"} 
              onChange={e => {
                const status = e.target.value;
                setStore({
                  ...store, 
                  status,
                  is_approved: status === "approved"
                });
              }}
            >
              <option value="approved">✅ Onaylı & Aktif</option>
              <option value="pending">⏳ Onay Bekliyor</option>
              <option value="suspended">🚫 Askıya Alındı</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Maksimum Kullanıcı Kotası</label>
            <input 
              type="number" 
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
              value={store.max_users !== undefined ? store.max_users : 5} 
              onChange={e => setStore({...store, max_users: parseInt(e.target.value) || 0})}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Maksimum Ürün Sınırı</label>
            <input 
              type="number" 
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
              value={store.max_products !== undefined ? store.max_products : 100} 
              onChange={e => setStore({...store, max_products: parseInt(e.target.value) || 0})}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Gayrimenkul Portföy Sınırı</label>
            <input 
              type="number" 
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
              value={store.max_properties !== undefined ? store.max_properties : 20} 
              onChange={e => setStore({...store, max_properties: parseInt(e.target.value) || 0})}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Vasıta / Araç İlan Sınırı</label>
            <input 
              type="number" 
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
              value={store.max_vehicles !== undefined ? store.max_vehicles : 20} 
              onChange={e => setStore({...store, max_vehicles: parseInt(e.target.value) || 0})}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Cari Hesap / Müşteri Kotası</label>
            <input 
              type="number" 
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
              value={store.max_customers !== undefined ? store.max_customers : 50} 
              onChange={e => setStore({...store, max_customers: parseInt(e.target.value) || 0})}
            />
          </div>
        </div>
      </div>

      <div className="md:col-span-2 flex space-x-2 mt-2">
        <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold text-sm">{st.update}</button>
        <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-gray-900 py-2 rounded-lg font-bold text-sm">{st.close}</button>
      </div>
    </form>
  </Modal>
);

export const StoreDetailsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  store: any;
  st: any;
}> = ({ isOpen, onClose, store, st }) => (
  <Modal isOpen={isOpen} onClose={onClose}>
    <h2 className="text-xl font-bold mb-5">{store.name} {st.storeDetails}</h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{st.companyInformation}</h3>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-[9px] text-gray-400 uppercase font-bold">{st.address}</p>
          <p className="text-xs text-gray-900">{store.address || 'N/A'}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-[9px] text-gray-400 uppercase font-bold">{st.authorizedPerson}</p>
          <p className="text-xs text-gray-900">{store.contact_person || 'N/A'}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-[9px] text-gray-400 uppercase font-bold">{st.phone}</p>
          <p className="text-xs text-gray-900">{store.phone || 'N/A'}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{st.systemAccess}</h3>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-[9px] text-gray-400 uppercase font-bold">{st.adminLoginEmail}</p>
          <p className="text-xs text-gray-900 font-mono">{store.admin_email || 'N/A'}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-[9px] text-gray-400 uppercase font-bold">{st.subscriptionEndDate}</p>
          <p className="text-xs text-gray-900">{new Date(store.subscription_end).toLocaleDateString()}</p>
        </div>
        
        <div className="pt-2">
          <button 
            onClick={() => {
              window.open(`${window.location.origin}/dashboard/${store.slug}`, '_blank');
            }}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center"
          >
            <LogOut className="h-3.5 w-3.5 mr-2 rotate-180" /> {st.goToStorePanel}
          </button>
        </div>
      </div>
    </div>

    <button 
      onClick={onClose}
      className="w-full bg-gray-100 text-gray-900 py-2 rounded-lg font-bold text-sm mt-6"
    >
      {st.close}
    </button>
  </Modal>
);

export const DeleteStoreModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  store: any;
  password: string;
  setPassword: (p: string) => void;
  onDelete: (e: React.FormEvent) => void;
}> = ({ isOpen, onClose, store, password, setPassword, onDelete }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-6 rounded-2xl max-w-sm w-full relative shadow-2xl"
        >
          <h2 className="text-lg font-bold mb-3 text-red-600 flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" /> Mağazayı Sil
          </h2>
          <p className="text-xs text-gray-600 mb-5 font-medium">
            <span className="font-bold text-gray-900">{store.name}</span> mağazasını ve tüm verilerini kalıcı olarak silmek istediğinize emin misiniz?
          </p>
          
          <form onSubmit={onDelete} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Admin Şifrenizi Girin</label>
              <input 
                type="password" 
                required
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:border-red-500 focus:ring-0 transition-all text-sm"
                placeholder="Şifreniz"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            
            <div className="flex space-x-2 pt-1">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-bold text-sm hover:bg-gray-200 transition-all"
              >
                Vazgeç
              </button>
              <button 
                type="submit"
                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-red-700 transition-all shadow-sm"
              >
                Sil
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export const AddStoreModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  newStore: any;
  setNewStore: (s: any) => void;
  onSave: (e: React.FormEvent) => void;
  stores: Store[];
  st: any;
}> = ({ isOpen, onClose, newStore, setNewStore, onSave, stores, st }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-6 rounded-2xl max-w-3xl w-full relative my-4 max-h-[90vh] overflow-y-auto flex flex-col"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"><X className="h-5 w-5" /></button>
          <h2 className="text-xl font-bold mb-5 sticky top-0 bg-white z-0">{st.registerNewStore}</h2>
          <form onSubmit={onSave} className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{st.storeInformation}</h3>
                <div>
                  <label className="block text-xs font-medium text-gray-700">{st.storeName}</label>
                  <input required className="mt-1 block w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" value={newStore.name} onChange={e => setNewStore({...newStore, name: e.target.value})} placeholder="e.g. Migros" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">{st.slugIdentifier}</label>
                  <input required className="mt-1 block w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" value={newStore.slug} onChange={e => setNewStore({...newStore, slug: e.target.value})} placeholder="e.g. migros" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">{st.address}</label>
                  <textarea className="mt-1 block w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" rows={2} value={newStore.address} onChange={e => setNewStore({...newStore, address: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">{st.authorizedPerson}</label>
                    <input className="mt-1 block w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" value={newStore.contact_person} onChange={e => setNewStore({...newStore, contact_person: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">{st.country}</label>
                    <select 
                      className="mt-1 block w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                      value={newStore.country} 
                      onChange={e => {
                        const country = DEVELOPED_COUNTRIES.find(c => c.code === e.target.value);
                        setNewStore({
                          ...newStore, 
                          country: e.target.value,
                          phone: country ? country.dialCode + " " : newStore.phone
                        });
                      }}
                    >
                      {DEVELOPED_COUNTRIES.map(c => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">{st.phone}</label>
                  <input className="mt-1 block w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" value={newStore.phone} onChange={e => setNewStore({...newStore, phone: e.target.value})} placeholder="+90 5XX XXX XX XX" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">{st.email}</label>
                  <input type="email" className="mt-1 block w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" value={newStore.email} onChange={e => setNewStore({...newStore, email: e.target.value})} />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{st.adminAccount}</h3>
                <div>
                  <label className="block text-xs font-medium text-gray-700">{st.adminEmail}</label>
                  <input required type="email" className="mt-1 block w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" value={newStore.admin_email} onChange={e => setNewStore({...newStore, admin_email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">{st.adminPassword}</label>
                  <input required type="text" className="mt-1 block w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono" value={newStore.admin_password} onChange={e => setNewStore({...newStore, admin_password: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">{st.subscriptionEnd}</label>
                  <input required type="date" className="mt-1 block w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" value={newStore.subscription_end} onChange={e => setNewStore({...newStore, subscription_end: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">{st.currency}</label>
                    <select className="mt-1 block w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" value={newStore.default_currency} onChange={e => setNewStore({...newStore, default_currency: e.target.value})}>
                      <option value="TRY">TRY</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">{st.language}</label>
                    <select className="mt-1 block w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" value={newStore.language} onChange={e => setNewStore({...newStore, language: e.target.value})}>
                      <option value="tr">Turkish</option>
                      <option value="en">English</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Plan</label>
                  <select className="mt-1 block w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" value={newStore.plan} onChange={e => setNewStore({...newStore, plan: e.target.value as any})}>
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Üst Mağaza (Şube ise)</label>
                  <select className="mt-1 block w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" value={newStore.parent_id} onChange={e => setNewStore({...newStore, parent_id: e.target.value})}>
                    <option value="">Bağımsız Mağaza</option>
                    {stores.filter(s => !s.parent_id).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-6 flex space-x-3 sticky bottom-0 bg-white pt-4 border-t">
              <button type="submit" className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-bold shadow-sm hover:bg-indigo-700 transition-all">{st.register}</button>
              <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-gray-900 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition-all">{st.cancel}</button>
            </div>
          </form>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);
