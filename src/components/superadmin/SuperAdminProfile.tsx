import React, { useState, useEffect } from "react";
import { 
  User, Key, Save, Lock, UserCircle, Briefcase, Phone, Mail, MapPin, 
  Sparkles, RefreshCw, Eye, EyeOff, ShieldCheck, Check, X, Copy,
  Hash, ShieldAlert, Store
} from "lucide-react";
import { api } from "../../services/api";
import { toast } from "sonner";

export function SuperAdminProfile({ lang }: { lang: string }) {
  const isTr = lang === 'tr';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Profile Form (Süper Mağaza Kimliği)
  const [profile, setProfile] = useState({
    name: "",
    full_name: "", // Firma / Platform Adı
    email: "",
    phone: "",
    address: "",
    super_store_id: "",
    super_store_code: ""
  });

  // Password Form
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminProfile();
      if (res) {
        setProfile({
          name: res.name || "",
          full_name: res.full_name || "",
          email: res.email || "",
          phone: res.phone || "",
          address: res.address || "",
          super_store_id: res.super_store_id || "SUPER_LOOKPRICE_MASTER",
          super_store_code: res.super_store_code || "HQ-ROOT-MASTER-99"
        });
      }
    } catch (error) {
      console.error(error);
      toast.error(isTr ? 'Profil bilgileri alınamadı.' : 'Failed to fetch profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateAdminProfile(profile);
      toast.success(isTr ? 'Süper Mağaza Kimliği ve Ayarları güncellendi.' : 'Super Store Identity updated.');
    } catch (error) {
      console.error(error);
      toast.error(isTr ? 'Güncelleme başarısız.' : 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  // Generate random super store ID
  const handleGenerateSuperStoreId = () => {
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    const newId = `SUPER_LP_${rand}`;
    setProfile(prev => ({ ...prev, super_store_id: newId }));
    toast.success(isTr ? `Yeni Süper Mağaza Kimliği üretildi: ${newId}` : `Generated new ID: ${newId}`);
  };

  // Generate random super store code
  const handleGenerateSuperStoreCode = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    const newCode = `HQ-ROOT-${rand}`;
    setProfile(prev => ({ ...prev, super_store_code: newCode }));
    toast.success(isTr ? `Yeni Yetki Kodu üretildi: ${newCode}` : `Generated new code: ${newCode}`);
  };

  // Password rules validation
  const p = passwords.newPassword;
  const ruleMinLength = p.length >= 12;
  const ruleUpper = /[A-Z]/.test(p);
  const ruleLower = /[a-z]/.test(p);
  const ruleNumber = /[0-9]/.test(p);
  const ruleSpecial = /[^A-Za-z0-9]/.test(p);
  const isPasswordValid = ruleMinLength && ruleUpper && ruleLower && ruleNumber && ruleSpecial;

  // Generate strong password
  const handleGenerateStrongPassword = () => {
    const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowers = "abcdefghijkmnopqrstuvwxyz";
    const numbers = "23456789";
    const symbols = "!@#$%^&*()_+=";
    
    let pass = "";
    pass += uppers[Math.floor(Math.random() * uppers.length)];
    pass += lowers[Math.floor(Math.random() * lowers.length)];
    pass += numbers[Math.floor(Math.random() * numbers.length)];
    pass += symbols[Math.floor(Math.random() * symbols.length)];
    
    const all = uppers + lowers + numbers + symbols;
    for (let i = 0; i < 12; i++) {
      pass += all[Math.floor(Math.random() * all.length)];
    }
    
    // Shuffle
    pass = pass.split('').sort(() => 0.5 - Math.random()).join('');
    
    setPasswords(prev => ({
      ...prev,
      newPassword: pass,
      confirmPassword: pass
    }));
    setShowNewPassword(true);
    setShowConfirmPassword(true);
    toast.success(isTr ? '16 karakterli güçlü şifre oluşturuldu.' : 'Strong 16-character password generated.');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPasswordValid) {
      toast.error(isTr 
        ? 'Yeni şifreniz tüm kurumsal güvenlik kriterlerini karşılamalıdır (en az 12 karakter, büyük/küçük harf, rakam ve sembol).' 
        : 'Password must be at least 12 characters and include uppercase, lowercase, number, and symbol.');
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error(isTr ? 'Yeni şifreler eşleşmiyor.' : 'New passwords do not match.');
      return;
    }
    
    try {
      setSavingPassword(true);
      await api.changePassword(
        passwords.currentPassword,
        passwords.newPassword
      );
      toast.success(isTr ? 'Süperadmin şifresi başarıyla güncellendi.' : 'Password updated successfully.');
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || (isTr ? 'Şifre güncellenemedi.' : 'Password update failed.'));
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
        <p className="text-sm font-semibold">{isTr ? 'Profil ve Kimlik Bilgileri Yükleniyor...' : 'Loading profile...'}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Super Store Identity */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Store className="text-indigo-600 w-6 h-6" />
              {isTr ? 'Süper Mağaza Kimliği & Platform Yetkisi' : 'Super Store Identity & Authority'}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {isTr 
                ? 'Süper admin için özel mağaza kimliğini, yetki kodunu ve temel kurumsal bilgileri dilediğiniz an güncelleyin.' 
                : 'Update super admin store ID, code and corporate identity at any time.'}
            </p>
          </div>
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[11px] font-black rounded-full border border-indigo-200">
            ROOT ACCESS
          </span>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          {/* Super Store ID and Code Inputs */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-indigo-600" />
                {isTr ? 'Süper Mağaza Kimliği (Super Store ID)' : 'Super Store ID'}
              </label>
              <button
                type="button"
                onClick={handleGenerateSuperStoreId}
                className="text-xs text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isTr ? 'Rastgele Üret' : 'Generate'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={profile.super_store_id}
                onChange={(e) => setProfile({ ...profile, super_store_id: e.target.value })}
                placeholder="SUPER_LOOKPRICE_MASTER"
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-mono font-bold text-indigo-900"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(profile.super_store_id);
                  toast.success(isTr ? 'Mağaza kimliği kopyalandı' : 'Copied');
                }}
                className="p-2.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-slate-600 cursor-pointer shrink-0"
                title={isTr ? "Kopyala" : "Copy"}
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {isTr ? 'Süper Mağaza Yetki Kodu (Store Authority Code)' : 'Store Authority Code'}
                </label>
                <button
                  type="button"
                  onClick={handleGenerateSuperStoreCode}
                  className="text-xs text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isTr ? 'Rastgele Üret' : 'Generate'}
                </button>
              </div>
              <input
                type="text"
                value={profile.super_store_code}
                onChange={(e) => setProfile({ ...profile, super_store_code: e.target.value })}
                placeholder="HQ-ROOT-MASTER-99"
                className="w-full mt-1.5 px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-mono font-bold text-slate-800"
              />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
              {isTr 
                ? 'ℹ️ Bu kimlik ve kodlar, süperadminin sistemdeki özel işlemlerini diğer mağazalardan tamamen izole eder ve dilediğiniz an değiştirilebilir.'
                : 'ℹ️ These credentials isolate super admin operations from regular tenant stores and can be modified anytime.'}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              {isTr ? 'Firma / Platform Adı' : 'Company / Brand Name'}
            </label>
            <input
              type="text"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              placeholder="LookPrice HQ / Global Master"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {isTr ? 'Yönetici Adı' : 'Manager Name'}
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                {isTr ? 'E-Posta' : 'E-Mail'}
              </label>
              <input
                type="email"
                required
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-900"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              {isTr ? 'Telefon / Destek Hattı' : 'Phone / Support Line'}
            </label>
            <input
              type="text"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {isTr ? 'Merkez Adres' : 'HQ Address'}
            </label>
            <textarea
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium resize-none text-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? (isTr ? 'Kaydediliyor...' : 'Saving...') : (isTr ? 'Süper Mağaza Kimliğini Kaydet' : 'Save Super Store Identity')}
          </button>
        </form>
      </div>

      {/* Password Reset with 12+ Char Strict Rules */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Lock className="text-rose-600 w-6 h-6" />
              {isTr ? 'Süperadmin Güvenliği & Şifre Değişimi' : 'Superadmin Security & Password Reset'}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {isTr 
                ? 'Yeni şifreniz en az 12 karakter olmalı; büyük harf, küçük harf, rakam ve sembol içermelidir.' 
                : 'New password must be at least 12 characters and include uppercase, lowercase, number, and symbol.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerateStrongPassword}
            className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-600" />
            {isTr ? 'Güçlü Şifre Üret' : 'Generate Strong'}
          </button>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" />
              {isTr ? 'Mevcut Şifre' : 'Current Password'}
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                required
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 text-sm font-medium text-slate-900 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div className="space-y-1 pt-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-rose-500" />
              {isTr ? 'Yeni Şifre' : 'New Password'}
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                required
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 text-sm font-medium text-slate-900 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isTr ? 'Yeni Şifre (Tekrar Doğrulama)' : 'Confirm New Password'}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 text-sm font-medium text-slate-900 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Live Criteria Checklist */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {isTr ? 'Yeni Şifre Güvenlik Kriterleri' : 'Password Security Rules'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className={`flex items-center gap-1.5 ${ruleMinLength ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                {ruleMinLength ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                <span>{isTr ? 'En az 12 karakter' : 'At least 12 characters'}</span>
              </div>
              <div className={`flex items-center gap-1.5 ${ruleUpper ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                {ruleUpper ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                <span>{isTr ? 'En az 1 büyük harf (A-Z)' : 'At least 1 uppercase'}</span>
              </div>
              <div className={`flex items-center gap-1.5 ${ruleLower ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                {ruleLower ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                <span>{isTr ? 'En az 1 küçük harf (a-z)' : 'At least 1 lowercase'}</span>
              </div>
              <div className={`flex items-center gap-1.5 ${ruleNumber ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                {ruleNumber ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                <span>{isTr ? 'En az 1 rakam (0-9)' : 'At least 1 number'}</span>
              </div>
              <div className={`flex items-center gap-1.5 ${ruleSpecial ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                {ruleSpecial ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                <span>{isTr ? 'En az 1 özel karakter (!@#$)' : 'At least 1 special char'}</span>
              </div>
              <div className={`flex items-center gap-1.5 ${passwords.newPassword && passwords.newPassword === passwords.confirmPassword ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                {passwords.newPassword && passwords.newPassword === passwords.confirmPassword ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                <span>{isTr ? 'Şifreler eşleşiyor' : 'Passwords match'}</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingPassword || !isPasswordValid || passwords.newPassword !== passwords.confirmPassword}
            className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-md shadow-slate-200 disabled:opacity-50 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            {savingPassword ? (isTr ? 'Güncelleniyor...' : 'Updating...') : (isTr ? 'Süperadmin Şifresini Güncelle' : 'Update Superadmin Password')}
          </button>
        </form>
      </div>
    </div>
  );
}
