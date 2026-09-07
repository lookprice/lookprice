import React, { useState } from "react";
import { motion } from "motion/react";
import { X, Eye, EyeOff } from "lucide-react";

interface UserModalProps {
  showUserModal: boolean;
  setShowUserModal: (show: boolean) => void;
  handleAddUser?: (e: React.FormEvent) => void;
  isTr: boolean;
  translations: any;
}

export const UserModal = ({
  showUserModal,
  setShowUserModal,
  handleAddUser,
  isTr,
  translations: t,
}: UserModalProps) => {
  const [showPassword, setShowPassword] = useState(false);

  if (!showUserModal) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
          <h3 className="text-sm font-black uppercase tracking-wider">
            {isTr ? "Personel / Kullanıcı Hesabı Ekle" : "Add User Account"}
          </h3>
          <button
            type="button"
            onClick={() => setShowUserModal(false)}
            className="p-1 hover:bg-white/20 rounded-full transition-colors text-white border-0 outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            if (handleAddUser) handleAddUser(e);
          }}
          className="p-6 space-y-4"
        >
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              {isTr ? "Kullanıcı Giriş Adı *" : "Username *"}
            </label>
            <input
              type="text"
              name="username"
              required
              placeholder="örn: ahmet_yilmaz"
              className="w-full px-4 py-2 text-xs bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              {isTr ? "Kullanıcı Adı E-Posta *" : "Email Address *"}
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="ahmet@firma.com"
              className="w-full px-4 py-2 text-xs bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all font-semibold text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              {isTr ? "Giriş Şifresi *" : "Password *"}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-2 text-xs bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-0 outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              {isTr ? "Kullanıcı Yetki Rolü" : "Role Authorization"}
            </label>
            <select
              name="role"
              className="w-full px-4 py-2 text-xs bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700 appearance-none h-[40px]"
              defaultValue="editor"
            >
              <option value="storeadmin">
                {isTr ? "Mağaza Yöneticisi (Store Admin)" : "Store Admin"}
              </option>
              <option value="editor">
                {isTr ? "Editör / Tezgahtar (Editor)" : "Editor / Sales"}
              </option>
              <option value="viewer">
                {isTr ? "Sadece İzleyici (Viewer)" : "Viewer Only"}
              </option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                {isTr ? "Adı Soyadı" : "Full Name"}
              </label>
              <input
                type="text"
                name="name"
                placeholder="Ahmet Yılmaz"
                className="w-full px-4 py-2 text-xs bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                {isTr ? "Telefon No" : "Phone"}
              </label>
              <input
                type="tel"
                name="phone"
                placeholder="+90548..."
                className="w-full px-4 py-2 text-xs bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => setShowUserModal(false)}
              className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase hover:bg-slate-200 transition-all cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-indigo-700 transition-all cursor-pointer"
            >
              {isTr ? "Kullanıcı Ekle" : "Add User Account"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
