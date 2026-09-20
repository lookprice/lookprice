import React, { useState, useDeferredValue } from "react";
import { Search, UserPlus, Users, Trash2, Edit2, Phone, Mail, X, Plus, Info, CheckCircle2, PhoneCall, Building, LayoutList, LayoutGrid } from "lucide-react";
import { RealEstateContact } from "../../types";
import { translations } from "../../translations";
import { useLanguage } from "../../contexts/LanguageContext";

export type LeadStage = 'new' | 'contacted' | 'converted' | 'reviewed' | 'cancelled' | 'none';

export const getLeadStage = (notes?: string): LeadStage => {
  if (!notes) return 'none';
  if (notes.includes('[MÜLK SAHİBİ BAŞVURUSU]')) return 'new';
  if (notes.includes('[MÜLK SAHİBİ - İLETİŞİME GEÇİLDİ]')) return 'contacted';
  if (notes.includes('[MÜLK SAHİBİ - PORTFÖYE ALINDI]')) return 'converted';
  if (notes.includes('[MÜLK SAHİBİ - İNCELENDİ]')) return 'reviewed';
  if (notes.includes('[MÜLK SAHİBİ - İPTAL]')) return 'cancelled';
  if (notes.includes('[MÜLK SAHİBİ')) return 'reviewed';
  return 'none';
};

export const updateLeadStageInNotes = (existingNotes: string = "", newStage: LeadStage): string => {
  let cleanNotes = existingNotes
    .replace('[MÜLK SAHİBİ BAŞVURUSU]', '')
    .replace('[MÜLK SAHİBİ - İLETİŞİME GEÇİLDİ]', '')
    .replace('[MÜLK SAHİBİ - PORTFÖYE ALINDI]', '')
    .replace('[MÜLK SAHİBİ - İNCELENDİ]', '')
    .replace('[MÜLK SAHİBİ - İPTAL]', '')
    .trim();

  switch (newStage) {
    case 'new':
      return `[MÜLK SAHİBİ BAŞVURUSU] ${cleanNotes}`.trim();
    case 'contacted':
      return `[MÜLK SAHİBİ - İLETİŞİME GEÇİLDİ] ${cleanNotes}`.trim();
    case 'converted':
      return `[MÜLK SAHİBİ - PORTFÖYE ALINDI] ${cleanNotes}`.trim();
    case 'reviewed':
      return `[MÜLK SAHİBİ - İNCELENDİ] ${cleanNotes}`.trim();
    case 'cancelled':
      return `[MÜLK SAHİBİ - İPTAL] ${cleanNotes}`.trim();
    default:
      return cleanNotes;
  }
};

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
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

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

  const handleQuickStatusChange = async (contact: RealEstateContact, newStage: LeadStage) => {
    const updatedNotes = updateLeadStageInNotes(contact.notes, newStage);
    try {
      await onSaveContact({
        ...contact,
        notes: updatedNotes
      });
    } catch (err: any) {
      console.error("Failed to update status", err);
    }
  };

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
      let finalNotes = formData.notes || "";
      // If editing an unreviewed new lead, saving the edit form automatically marks it as reviewed if stage wasn't changed
      if (editingContact && getLeadStage(editingContact.notes) === 'new' && getLeadStage(finalNotes) === 'new') {
        finalNotes = updateLeadStageInNotes(finalNotes, 'reviewed');
      }

      const finalizedData = {
        ...formData,
        notes: finalNotes,
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
    <div className="space-y-4">
      {/* HEADER CONTROL BANNER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2 flex-1 w-full max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={isTr ? "Mülk sahibi, yatırımcı veya telefon ara..." : t.search}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500 shadow-2xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="bg-slate-100 p-0.5 rounded-xl flex items-center border border-slate-200 shrink-0">
            <button 
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'table' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Satır / Tablo Görünümü"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Satır Tipi</span>
            </button>
            <button 
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'grid' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Kart Görünümü"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Kartlar</span>
            </button>
          </div>
        </div>

        <button 
          onClick={openAddModal}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-black transition-all w-full sm:w-auto justify-center cursor-pointer shadow-2xs active:scale-95 shrink-0"
        >
          <UserPlus size={15} className="stroke-[2.5]" />
          <span>{isTr ? "Yeni Kişi Ekle" : t.add}</span>
        </button>
      </div>
      
      {filteredContacts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <Users size={40} className="mx-auto text-slate-300 mb-2" />
          <p className="text-slate-500 text-xs font-bold">
            {isTr ? "Kayıtlı mülk sahibi veya yatırımcı bulunamadı." : "No property owners or investors found."}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* HIGH-DENSITY ROW / TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-3">Ad Soyad / Kişi</th>
                  <th className="py-2.5 px-3">Kişi Rolü</th>
                  <th className="py-2.5 px-3">Aşama Statüsü</th>
                  <th className="py-2.5 px-3">İletişim</th>
                  <th className="py-2.5 px-3">Notlar & Başvuru İçeriği</th>
                  <th className="py-2.5 px-3">Kayıt Tarihi</th>
                  <th className="py-2.5 px-3 text-right">Aksiyonlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                {filteredContacts.map(contact => {
                  const stage = getLeadStage(contact.notes);
                  return (
                    <tr key={contact.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 font-extrabold ${
                            stage === 'new' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                            stage === 'contacted' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                            stage === 'converted' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                            'bg-slate-100 border-slate-200 text-slate-600'
                          }`}>
                            {stage === 'new' ? '🏡' : stage === 'contacted' ? '📞' : stage === 'converted' ? '🔑' : <Users size={14} />}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-xs leading-tight">{contact.name}</h4>
                            <span className="text-[10px] text-slate-400 font-mono">#{contact.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-md border ${
                          contact.type === 'owner' 
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200/80' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                        }`}>
                          {contact.type === 'owner' ? (isTr ? 'Mülk Sahibi' : 'Owner') : (isTr ? 'Yatırımcı' : 'Investor')}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          {stage === 'new' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 border border-amber-600 shadow-2xs animate-pulse">
                              🌐 Yeni Başvuru
                            </span>
                          )}
                          {stage === 'contacted' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-600 text-white border border-blue-700 shadow-2xs">
                              📞 İletişime Geçildi
                            </span>
                          )}
                          {stage === 'converted' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-600 text-white border border-emerald-700 shadow-2xs">
                              🏡 Portföye Alındı
                            </span>
                          )}
                          {stage === 'reviewed' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 border border-slate-300">
                              ✓ İncelendi / Arşiv
                            </span>
                          )}
                          {stage === 'cancelled' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200">
                              ✕ İptal Edildi
                            </span>
                          )}
                          {stage === 'none' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400">
                              Standart Kayıt
                            </span>
                          )}

                          {/* Quick Stage Change Shortcuts */}
                          {stage !== 'none' && (
                            <div className="flex items-center gap-1 mt-0.5">
                              {stage !== 'contacted' && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickStatusChange(contact, 'contacted')}
                                  className="text-[9px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                  title="İletişime geçildi yap"
                                >
                                  +İletişim
                                </button>
                              )}
                              {stage !== 'converted' && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickStatusChange(contact, 'converted')}
                                  className="text-[9px] font-bold text-emerald-600 hover:text-emerald-800 hover:underline cursor-pointer"
                                  title="Portföye alındı yap"
                                >
                                  +Portföy
                                </button>
                              )}
                              {stage !== 'reviewed' && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickStatusChange(contact, 'reviewed')}
                                  className="text-[9px] font-bold text-slate-500 hover:text-slate-700 hover:underline cursor-pointer"
                                  title="İncelendi olarak arşivle"
                                >
                                  +İncelendi
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="space-y-0.5 text-[11px]">
                          <div className="flex items-center gap-1 font-bold text-slate-900">
                            <Phone size={12} className="text-emerald-600 shrink-0" />
                            <span>{contact.phone}</span>
                          </div>
                          {contact.email && (
                            <div className="flex items-center gap-1 text-slate-500">
                              <Mail size={12} className="text-slate-400 shrink-0" />
                              <span className="truncate max-w-[150px]">{contact.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 max-w-xs">
                        <p className="text-[11px] text-slate-600 font-medium line-clamp-2 leading-snug">
                          {contact.notes || '---'}
                        </p>
                      </td>

                      <td className="py-2.5 px-3 text-[10px] text-slate-500 whitespace-nowrap font-medium">
                        {contact.created_at ? new Date(contact.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '---'}
                      </td>

                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => openEditModal(contact)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-indigo-700 hover:text-indigo-800 text-[11px] font-black rounded-lg border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                            title={isTr ? "Düzenle ve Durum Değiştir" : "Edit and Change Status"}
                          >
                            <Edit2 size={12} />
                            <span>{isTr ? "Düzenle / İncele" : "Edit / Review"}</span>
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm(isTr ? "Bu kişiyi silmek istediğinizden emin misiniz?" : "Are you sure you want to delete this contact?")) {
                                onDeleteContact(contact.id!);
                              }
                            }} 
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title={isTr ? "Sil" : "Delete"}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map(contact => {
            const stage = getLeadStage(contact.notes);
            return (
              <div key={contact.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-full border ${
                        stage === 'new' ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' :
                        stage === 'contacted' ? 'bg-blue-500/10 border-blue-500/30 text-blue-600' :
                        stage === 'converted' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' :
                        'bg-slate-50 border-slate-100 text-slate-600'
                      }`}>
                        {stage === 'new' ? '🏡' : stage === 'contacted' ? '📞' : stage === 'converted' ? '🔑' : <Users size={18} />}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{contact.name}</h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className={`inline-block text-[9px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full ${contact.type === 'owner' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                            {contact.type === 'owner' ? (isTr ? 'Mülk Sahibi' : 'Owner') : (isTr ? 'Yatırımcı' : 'Investor')}
                          </span>
                          {stage === 'new' && (
                            <span className="inline-block text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 border border-amber-600 shadow-xs animate-pulse">
                              🌐 Yeni Başvuru (Bekliyor)
                            </span>
                          )}
                          {stage === 'contacted' && (
                            <span className="inline-block text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-500 text-white border border-blue-600 shadow-xs">
                              📞 İletişime Geçildi
                            </span>
                          )}
                          {stage === 'converted' && (
                            <span className="inline-block text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white border border-emerald-700 shadow-xs">
                              🏡 Portföye Alındı
                            </span>
                          )}
                          {stage === 'reviewed' && (
                            <span className="inline-block text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300">
                              ✓ İncelendi / Arşiv
                            </span>
                          )}
                          {stage === 'cancelled' && (
                            <span className="inline-block text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                              ✕ İptal Edildi
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {contact.created_at && (
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        {new Date(contact.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600 mt-2">
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-slate-400" />
                      <span className="font-bold text-slate-800">{contact.phone}</span>
                    </div>
                    {contact.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={13} className="text-slate-400" />
                        <span className="text-slate-600">{contact.email}</span>
                      </div>
                    )}
                    {contact.notes && (
                      <div className={`mt-2.5 text-[11px] p-2.5 rounded-xl border leading-relaxed ${
                        stage === 'new' ? 'bg-amber-50/80 border-amber-200/80 text-slate-800 font-medium' :
                        stage === 'contacted' ? 'bg-blue-50/80 border-blue-200/80 text-slate-800 font-medium' :
                        stage === 'converted' ? 'bg-emerald-50/80 border-emerald-200/80 text-slate-800 font-medium' :
                        'bg-slate-50 border-slate-100 text-slate-600 italic'
                      }`}>
                        {contact.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Lead Stage Bar */}
                {stage !== 'none' && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5 bg-slate-50/80 p-2 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-500">
                      {isTr ? "Aşama Güncelle:" : "Change Stage:"}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {stage !== 'contacted' && (
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(contact, 'contacted')}
                          className="px-2 py-1 text-[10px] font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all active:scale-95 flex items-center gap-1"
                          title={isTr ? "İletişime geçildi olarak işaretle (Uyarıyı kaldırır)" : "Mark as contacted"}
                        >
                          📞 İletişime Geçildi
                        </button>
                      )}
                      {stage !== 'converted' && (
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(contact, 'converted')}
                          className="px-2 py-1 text-[10px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-95 flex items-center gap-1"
                          title={isTr ? "Portföye dahil edildi olarak işaretle" : "Mark as converted to portfolio"}
                        >
                          🏡 Portföye Alındı
                        </button>
                      )}
                      {stage !== 'reviewed' && (
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(contact, 'reviewed')}
                          className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-all active:scale-95 flex items-center gap-1"
                          title={isTr ? "İncelendi olarak arşivle" : "Mark as reviewed"}
                        >
                          ✓ İncelendi
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center gap-1.5 mt-3 pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-medium">
                    ID: #{contact.id}
                  </span>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => openEditModal(contact)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      title={isTr ? "Düzenle ve Durum Değiştir" : "Edit and Change Status"}
                    >
                      <Edit2 size={12} />
                      <span>{isTr ? "Düzenle / İncele" : "Edit / Review"}</span>
                    </button>
                    <button 
                      onClick={() => {
                        if (window.confirm(isTr ? "Bu kişiyi silmek istediğinizden emin misiniz?" : "Are you sure you want to delete this contact?")) {
                          onDeleteContact(contact.id!);
                        }
                      }} 
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title={isTr ? "Sil" : "Delete"}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD/EDIT CONTACT MODAL - VIEWPORT-FIT COMPACT DESIGN */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[100] p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Fixed Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-150 bg-slate-50 shrink-0">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2 uppercase tracking-tight">
                <Users size={18} className="text-indigo-600" />
                {editingContact ? (isTr ? "Kişiyi Düzenle & İncele" : "Edit & Review Contact") : (isTr ? "Yeni Kişi Ekle" : "Add New Contact")}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto custom-scrollbar flex-1 text-xs font-bold">
                {errorMsg && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-700 p-2.5 rounded-xl text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}

                {/* Lead Stage Selector if contact is a web lead or has lead stage */}
                {(editingContact || getLeadStage(formData.notes) !== 'none') && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
                    <label className="block text-xs font-black text-slate-800 flex items-center justify-between">
                      <span>{isTr ? "Başvuru Aşama Statüsü *" : "Lead Stage Status *"}</span>
                      <span className="text-[10px] text-amber-600 font-bold">{isTr ? "(Ekranda görünür uyarıyı temizler)" : "(Clears dashboard alert)"}</span>
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, notes: updateLeadStageInNotes(formData.notes, 'new') })}
                        className={`p-2 text-left text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${getLeadStage(formData.notes) === 'new' ? 'bg-amber-500 text-slate-950 border-amber-600 font-black shadow-xs' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                      >
                        🟡 Yeni Başvuru (Bekliyor)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, notes: updateLeadStageInNotes(formData.notes, 'contacted') })}
                        className={`p-2 text-left text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${getLeadStage(formData.notes) === 'contacted' ? 'bg-blue-600 text-white border-blue-700 font-black shadow-xs' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                      >
                        📞 İletişime Geçildi
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, notes: updateLeadStageInNotes(formData.notes, 'converted') })}
                        className={`p-2 text-left text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${getLeadStage(formData.notes) === 'converted' ? 'bg-emerald-600 text-white border-emerald-700 font-black shadow-xs' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                      >
                        🏡 Portföye Alındı
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, notes: updateLeadStageInNotes(formData.notes, 'reviewed') })}
                        className={`p-2 text-left text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${getLeadStage(formData.notes) === 'reviewed' ? 'bg-slate-800 text-white border-slate-900 font-black shadow-xs' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                      >
                        ✓ İncelendi & Arşiv
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                      {isTr ? "İsim Soyisim *" : "Name *"}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ahmet Yılmaz"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                      {isTr ? "Telefon Numarası *" : "Phone Number *"}
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+90 533 123 4567"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                      value={formData.phone || ""}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      onBlur={(e) => {
                        const norm = standardizeOwnerPhone(e.target.value);
                        setFormData({ ...formData, phone: norm });
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                      {isTr ? "E-Posta Adresi" : "Email Address"}
                    </label>
                    <input
                      type="email"
                      placeholder="example@mail.com"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                      value={formData.email || ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                      {isTr ? "Kişi Rolü / Tipi" : "Role / Type"}
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: "owner" })}
                        className={`py-1.5 px-2 text-[11px] font-black rounded-lg border transition-all cursor-pointer ${formData.type === 'owner' ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                      >
                        🏠 {isTr ? "Mülk Sahibi" : "Owner"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: "investor" })}
                        className={`py-1.5 px-2 text-[11px] font-black rounded-lg border transition-all cursor-pointer ${formData.type === 'investor' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                      >
                        💼 {isTr ? "Yatırımcı" : "Investor"}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                    {isTr ? "Özel Notlar & Başvuru İçeriği" : "Notes & Submission Content"}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={isTr ? "Müşteri veya portföy hakkında ek notlar..." : "Additional notes..."}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500 min-h-[70px]"
                    value={formData.notes || ""}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              {/* Fixed Footer Buttons */}
              <div className="flex justify-end gap-2 p-3 sm:p-4 bg-slate-50 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {isTr ? "Vazgeç" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-2xs active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {saveLoading && <span className="animate-spin mr-1">⌛</span>}
                  {editingContact ? (isTr ? "Kaydet & İncelemeyi Tamamla" : "Save & Complete Review") : (isTr ? "Kaydet" : "Save")}
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
