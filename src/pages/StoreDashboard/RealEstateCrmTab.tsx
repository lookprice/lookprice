import React, { useState, useDeferredValue } from "react";
import { Search, UserPlus, Users, Trash2, Edit2, Phone, Mail } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const filteredContacts = contacts.filter(c => {
    const s = deferredSearch.toLowerCase();
    return c.name.toLowerCase().includes(s) || (c.phone || "").includes(s) || (c.email || "").toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={t.search}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm">
          <UserPlus size={16} />
          {t.add}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContacts.map(contact => (
          <div key={contact.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-full">
                  <Users size={20} className="text-slate-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{contact.name}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${contact.type === 'owner' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {contact.type}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Phone size={14} />
                {contact.phone}
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} />
                {contact.email}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <button className="p-2 text-slate-400 hover:text-slate-900"><Edit2 size={16} /></button>
              <button onClick={() => onDeleteContact(contact.id!)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RealEstateCrmTab;
