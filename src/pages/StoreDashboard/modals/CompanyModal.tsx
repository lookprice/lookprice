import React from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";

interface CompanyModalProps {
  showCompanyModal: boolean;
  setShowCompanyModal: (show: boolean) => void;
  editingCompany: any;
  setEditingCompany: (c: any) => void;
  handleAddCompany?: (e: React.FormEvent) => void;
  isTr: boolean;
  branding: any;
  translations: any;
}

export const CompanyModal = ({
  showCompanyModal,
  setShowCompanyModal,
  editingCompany,
  setEditingCompany,
  handleAddCompany,
  isTr,
  branding,
  translations: t,
}: CompanyModalProps) => {
  if (!showCompanyModal) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white animate-fade-in">
          <div>
            <h3 className="text-lg font-black uppercase tracking-wider">
              {editingCompany
                ? isTr
                  ? "Cari Hesap Düzenle"
                  : "Edit Client Account"
                : isTr
                ? "Yeni Cari Hesap (Müşteri/Tedarikçi) Kaydet"
                : "Add Client Account"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isTr
                ? "Müşteri, satıcı ve diğer tedarikçi cari kayıtlarını yönetin."
                : "Manage customers suppliers accounting."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowCompanyModal(false);
              setEditingCompany(null);
            }}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            if (handleAddCompany) handleAddCompany(e);
          }}
          className="flex-1 overflow-y-auto p-8 space-y-6"
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "Cari Hesap / Ticari Ünvan *" : "Company / Business Title *"}
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder={isTr ? "örn: Akdeniz İnşaat Ltd." : "Company business name"}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-extrabold text-slate-900"
                defaultValue={editingCompany?.title || ""}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                  {isTr ? "İlgili Kişi / Temsilci" : "Contact Person"}
                </label>
                <input
                  type="text"
                  name="representative"
                  placeholder={isTr ? "örn: Ahmet Yılmaz" : "Representative contact"}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                  defaultValue={editingCompany?.representative || ""}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                  {isTr ? "Cari Para Birimi" : "Client Account Currency"}
                </label>
                <select
                  name="currency"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700 appearance-none text-xs h-[50px]"
                  defaultValue={editingCompany?.currency || branding?.default_currency || "TRY"}
                >
                  <option value="TRY">TRY (₺)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                  {isTr ? "Vergi Dairesi" : "Tax Office"}
                </label>
                <input
                  type="text"
                  name="tax_office"
                  placeholder={isTr ? "Lefkoşa Vergi Dairesi" : "Tax location"}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                  defaultValue={editingCompany?.tax_office || ""}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                  {isTr ? "Vergi Numarası VKN / KKTC VKN" : "Tax / Registration No"}
                </label>
                <input
                  type="text"
                  name="tax_number"
                  placeholder="0123456789"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                  defaultValue={editingCompany?.tax_number || ""}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                  {isTr ? "E-Posta Adresi" : "Email Address"}
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="info@example.com"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-semibold text-slate-900"
                  defaultValue={editingCompany?.email || ""}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                  {isTr ? "Telefon Numarası" : "Phone Number"}
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+90533..."
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700"
                  defaultValue={editingCompany?.phone || ""}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "Adres / Lokasyon" : "Physical Address"}
              </label>
              <textarea
                name="address"
                rows={2}
                placeholder={isTr ? "Cari firmanın fiziki adresi" : "Address details"}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-semibold text-slate-800"
                defaultValue={editingCompany?.address || ""}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-rose-500 uppercase tracking-wider ml-1">
                {isTr ? "Sevk Adresi (2. Alternatif Adres)" : "Delivery / Dispatch Address (2nd Address)"}
              </label>
              <textarea
                name="delivery_address"
                rows={2}
                placeholder={isTr ? "Sevkiyat ve irsaliyeler için ikinci alternatif adres" : "Alternative delivery address"}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-semibold text-slate-800"
                defaultValue={editingCompany?.delivery_address || ""}
              />
            </div>

            {!editingCompany && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                  {isTr ? "Açılış Devir Bakiyesi (Borç ise eksi girin)" : "Opening Devir Balance"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="opening_balance"
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                  defaultValue="0"
                />
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowCompanyModal(false);
                setEditingCompany(null);
              }}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all cursor-pointer"
            >
              {isTr ? "Cariyi Kaydet" : "Save Client Account"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
