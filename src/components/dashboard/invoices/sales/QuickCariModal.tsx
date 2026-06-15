import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Building2, User } from 'lucide-react';

interface QuickCariModalProps {
  isOpen: boolean;
  onClose: () => void;
  isTr: boolean;
  onSubmit: (data: {
    type: 'company' | 'customer';
    title: string; // matches title for company / name for customer
    phone?: string;
    email?: string;
    tax_office?: string;
    tax_number?: string;
    currency?: string;
  }) => void;
  initialValue?: string;
}

export const QuickCariModal: React.FC<QuickCariModalProps> = ({
  isOpen,
  onClose,
  isTr,
  onSubmit,
  initialValue = "",
}) => {
  const [type, setType] = useState<'company' | 'customer'>('company');
  const [title, setTitle] = useState(initialValue);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [taxOffice, setTaxOffice] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [currency, setCurrency] = useState("TRY");

  React.useEffect(() => {
    setTitle(initialValue);
  }, [initialValue]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      type,
      title: title.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      tax_office: type === 'company' ? taxOffice.trim() || undefined : undefined,
      tax_number: type === 'company' ? taxNumber.trim() || undefined : undefined,
      currency,
    });
    // Reset form
    setPhone("");
    setEmail("");
    setTaxOffice("");
    setTaxNumber("");
    setCurrency("TRY");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[125] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-900 text-white">
            <h3 className="text-base font-black uppercase tracking-wider flex items-center gap-2">
              <Building2 className="h-5 w-5 text-rose-500 animate-pulse" />
              {isTr ? "Hızlı Cari Kart Oluştur" : "Quick Add Cari Account"}
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {/* Cari Type Selector */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">{isTr ? "Cari Türü" : "Cari Type"}</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setType('company')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${type === 'company' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  {isTr ? "Kurumsal (Firma)" : "Corporate (Company)"}
                </button>
                <button
                  type="button"
                  onClick={() => setType('customer')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${type === 'customer' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <User className="h-3.5 w-3.5" />
                  {isTr ? "Bireysel (Müşteri)" : "Individual (Customer)"}
                </button>
              </div>
            </div>

            {/* Account Title or Customer Name */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                {type === 'company' 
                  ? (isTr ? "Cari Hesap / Ticari Ünvan *" : "Business Title *") 
                  : (isTr ? "Müşteri Adı Soyadı *" : "Customer Name *")}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={type === 'company' ? (isTr ? "örn: Akdeniz İnşaat Ltd." : "Company name") : (isTr ? "örn: Ahmet Yılmaz" : "Customer name")}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none font-bold text-slate-700 text-sm"
              />
            </div>

            {/* Contact Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">{isTr ? "Telefon" : "Phone"}</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+90 (548) 000 0000"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none font-medium text-slate-700 text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">{isTr ? "E-Posta" : "Email"}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@e-mail.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none font-medium text-slate-700 text-sm"
                />
              </div>
            </div>

            {/* Currency */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">{isTr ? "Cari Para Birimi" : "Currency"}</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none bg-white font-bold text-slate-700 text-sm"
              >
                <option value="TRY">TRY (₺)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            {/* Tax specs (rendered ONLY for Corporate) */}
            {type === 'company' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">{isTr ? "Vergi Dairesi" : "Tax Office"}</label>
                  <input
                    type="text"
                    value={taxOffice}
                    onChange={(e) => setTaxOffice(e.target.value)}
                    placeholder={isTr ? "Lefkoşa Vergi Dairesi" : "Tax Office Location"}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none font-medium text-slate-700 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">{isTr ? "Vergi Numarası" : "Tax Number / VKN"}</label>
                  <input
                    type="text"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    placeholder="12345678"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none font-medium text-slate-700 text-sm"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                {isTr ? "İptal" : "Cancel"}
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md active:scale-95"
              >
                {isTr ? "Cariyi Kaydet" : "Register Cari"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
