import React, { useState, useDeferredValue } from "react";
import { Search, UserPlus, Users, Trash2, Edit2, Phone, Mail, X, Plus, Info } from "lucide-react";
import { RealEstateContact } from "../../types";
import { translations } from "../../translations";
import { useLanguage } from "../../contexts/LanguageContext";

interface RealEstateCrmTabProps {
  contacts: RealEstateContact[];
  onSaveContact: (contact: Partial<RealEstateContact>) => Promise<void>;
  onDeleteContact: (id: string) => Promise<void>;
}

const RealEstateCrmTab = ({ contacts, onSaveContact, onDeleteContact }: RealEstateCrmTabProps) => {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const isTr = lang === 'tr';

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Partial<RealEstateContact> | null>(null);
  const [formData, setFormData] = useState<Partial<RealEstateContact>>({
    name: "",
    phone: "",
    email: "",
    type: "owner",
    notes: ""
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const standardizeOwnerPhone = (phone: string) => {
    if (!phone) return phone;
    let cleaned = phone.trim();
    if (cleaned.startsWith('05') && cleaned.replace(/\s/g, '').length === 11) {
      const rawDigits = cleaned.replace(/\s/g, '');
      cleaned = `+90 ${rawDigits.substring(1, 4)} ${rawDigits.substring(4, 7)} ${rawDigits.substring(7)}`;
    } else if (cleaned.startsWith('5') && cleaned.replace(/\s/g, '').length === 10) {
      const rawDigits = cleaned.replace(/\s/g, '');
      cleaned = `+90 ${rawDigits.substring(0, 3)} ${rawDigits.substring(3, 6)} ${rawDigits.substring(6)}`;
    } else if (!cleaned.startsWith('+') && !cleaned.startsWith('00')) {
      const rawDigits = cleaned.replace(/\D/g, '');
      if (rawDigits.length === 10) {
        cleaned = `+90 ${rawDigits.substring(0, 3)} ${rawDigits.substring(3, 6)} ${rawDigits.substring(6)}`;
      } else if (rawDigits.length === 11 && rawDigits.startsWith('0')) {
        cleaned = `+90 ${rawDigits.substring(1, 4)} ${rawDigits.substring(4, 7)} ${rawDigits.substring(7)}`;
      }
    }
    return cleaned;
  };

  const filteredContacts = contacts.filter(c => {
    const s = deferredSearch.toLowerCase();
    return (
      (c.name || "").toLowerCase().includes(s) || 
      (c.phone || "").includes(s) || 
      (c.email || "").toLowerCase().includes(s)
    );
  });

  const openAddModal = () => {
    setEditingContact(null);
    setFormData({
      name: "",
      phone: "",
      email: "",
      type: "owner",
      notes: ""
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (contact: RealEstateContact) => {
    setEditingContact(contact);
    setFormData({ ...contact });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setErrorMsg(isTr ? "İsim Soyisim alanı zorunludur!" : "Name field is required!");
      return;
    }
    if (!formData.phone?.trim()) {
      setErrorMsg(isTr ? "Telefon alanı zorunludur!" : "Phone field is required!");
      return;
    }

    setSaveLoading(true);
    setErrorMsg(null);
    try {
      // Standardize phone right before saving
      const finalizedData = {
        ...formData,
        phone: standardizeOwnerPhone(formData.phone || "")
      };
      await onSaveContact(finalizedData);
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || (isTr ? "Bir hata oluştu" : "An error occurred"));
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={isTr ? "Mülk sahibi veya yatırımcı ara..." : t.search}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors w-full sm:w-auto justify-center"
        >
          <UserPlus size={16} />
          {isTr ? "Yeni Kişi Ekle" : t.add}
        </button>
      </div>
      
      {filteredContacts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Users size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">
            {isTr ? "Kayıtlı mülk sahibi veya yatırımcı bulunamadı." : "No property owners or investors found."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map(contact => (
            <div key={contact.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-full border border-slate-100">
                      <Users size={18} className="text-slate-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">{contact.name}</h3>
                      <span className={`inline-block mt-1 text-[9px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full ${contact.type === 'owner' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                        {contact.type === 'owner' ? (isTr ? 'Mülk Sahibi' : 'Owner') : (isTr ? 'Yatırımcı' : 'Investor')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600 mt-2">
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-slate-400" />
                    <span className="font-medium text-slate-800">{contact.phone}</span>
                  </div>
                  {contact.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-slate-400" />
                      <span className="text-slate-600">{contact.email}</span>
                    </div>
                  )}
                  {contact.notes && (
                    <div className="mt-2 text-[11px] bg-slate-50 p-2 rounded border border-slate-100 text-slate-500 italic">
                      {contact.notes}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-1.5 mt-4 pt-3 border-t border-slate-100">
                <button 
                  onClick={() => openEditModal(contact)}
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded transition-colors"
                  title={isTr ? "Düzenle" : "Edit"}
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm(isTr ? "Bu kişiyi silmek istediğinizden emin misiniz?" : "Are you sure you want to delete this contact?")) {
                      onDeleteContact(contact.id!);
                    }
                  }} 
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                  title={isTr ? "Sil" : "Delete"}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD/EDIT CONTACT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-150 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Users size={18} className="text-slate-600" />
                {editingContact ? (isTr ? "Kişiyi Düzenle" : "Edit Contact") : (isTr ? "Yeni Kişi Ekle" : "Add New Contact")}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-lg text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isTr ? "İsim Soyisim *" : "Name *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ahmet Yılmaz"
                  className="w-full p-2.5 border rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-950"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isTr ? "Telefon Numarası *" : "Phone Number *"}
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+90 533 123 4567"
                  className="w-full p-2.5 border rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-950"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  onBlur={(e) => {
                    const norm = standardizeOwnerPhone(e.target.value);
                    setFormData({ ...formData, phone: norm });
                  }}
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  {isTr ? "Yerel telefonlar otomatik olarak uluslararası formata dönüştürülür." : "Local phone numbers are formatted to international standard automatically."}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isTr ? "E-Posta Adresi" : "Email Address"}
                </label>
                <input
                  type="email"
                  placeholder="example@mail.com"
                  className="w-full p-2.5 border rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-950"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isTr ? "Kişi Rolü / Tipi" : "Role / Type"}
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "owner" })}
                    className={`p-2.5 text-xs font-semibold rounded-lg border transition-all ${formData.type === 'owner' ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                  >
                    🏠 {isTr ? "Mülk Sahibi" : "Owner"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "investor" })}
                    className={`p-2.5 text-xs font-semibold rounded-lg border transition-all ${formData.type === 'investor' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                  >
                    💼 {isTr ? "Yatırımcı" : "Investor"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isTr ? "Özel Notlar" : "Notes"}
                </label>
                <textarea
                  rows={3}
                  placeholder={isTr ? "Müşteri veya portföy hakkında ek notlar..." : "Additional notes..."}
                  className="w-full p-2.5 border rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-950"
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {isTr ? "Vazgeç" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                >
                  {saveLoading && <span className="animate-spin mr-1">⌛</span>}
                  {editingContact ? (isTr ? "Güncelle" : "Update") : (isTr ? "Kaydet" : "Save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealEstateCrmTab;
