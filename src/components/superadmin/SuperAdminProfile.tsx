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
      <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center space-y-2">
        <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
        <p className="text-xs font-semibold">{isTr ? 'Profil ve Kimlik Bilgileri Yükleniyor...' : 'Loading profile...'}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 max-w-5xl mx-auto">
      {/* Super Store Identity */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 sm:p-4 shadow-2xs border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 shrink-0">
              <Store className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight">
                {isTr ? 'Süper Mağaza Kimliği & Platform Yetkisi' : 'Super Store Identity & Authority'}
              </h2>
              <p className="text-[10.5px] text-slate-500 font-medium">
                {isTr ? 'Süperadmin mağaza kimliği ve platform erişim anahtarları' : 'Super admin store identity and authority credentials'}
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 text-[9.5px] font-black rounded-md border border-indigo-200 dark:border-indigo-900/50 shrink-0">
            ROOT ACCESS
          </span>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-2.5">
          {/* Super Store ID and Code Inputs (Compact Block) */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/90 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Hash className="w-3 h-3 text-indigo-600" />
                {isTr ? 'Süper Mağaza Kimliği (Store ID)' : 'Super Store ID'}
              </label>
              <button
                type="button"
                onClick={handleGenerateSuperStoreId}
                className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                {isTr ? 'Üret' : 'Generate'}
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                required
                value={profile.super_store_id}
                onChange={(e) => setProfile({ ...profile, super_store_id: e.target.value })}
                placeholder="SUPER_LOOKPRICE_MASTER"
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-1 focus:ring-indigo-500 text-xs font-mono font-bold text-indigo-900 dark:text-indigo-300"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(profile.super_store_id);
                  toast.success(isTr ? 'Mağaza kimliği kopyalandı' : 'Copied');
                }}
                className="p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-600 dark:text-slate-300 cursor-pointer shrink-0"
                title={isTr ? "Kopyala" : "Copy"}
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="pt-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  {isTr ? 'Yetki Kodu (Authority Code)' : 'Store Authority Code'}
                </label>
                <button
                  type="button"
                  onClick={handleGenerateSuperStoreCode}
                  className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  {isTr ? 'Üret' : 'Generate'}
                </button>
              </div>
              <input
                type="text"
                value={profile.super_store_code}
                onChange={(e) => setProfile({ ...profile, super_store_code: e.target.value })}
                placeholder="HQ-ROOT-MASTER-99"
                className="w-full mt-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-1 focus:ring-indigo-500 text-xs font-mono font-bold text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              {isTr ? 'Firma / Platform Adı' : 'Company / Brand Name'}
            </label>
            <input
              type="text"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              placeholder="LookPrice HQ / Global Master"
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3" />
                {isTr ? 'Yönetici Adı' : 'Manager Name'}
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {isTr ? 'E-Posta' : 'E-Mail'}
              </label>
              <input
                type="email"
                required
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {isTr ? 'Telefon / Destek Hattı' : 'Phone / Support Line'}
              </label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {isTr ? 'Merkez Adres' : 'HQ Address'}
              </label>
              <input
                type="text"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? (isTr ? 'Kaydediliyor...' : 'Saving...') : (isTr ? 'Kimlik Bilgilerini Kaydet' : 'Save Identity')}
          </button>
        </form>
      </div>

      {/* Password Reset with 12+ Char Strict Rules (Ultra-Compact) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 sm:p-4 shadow-2xs border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-600 shrink-0">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight">
                {isTr ? 'Süperadmin Güvenliği & Şifre Değişimi' : 'Superadmin Security & Password Reset'}
              </h2>
              <p className="text-[10.5px] text-slate-500 font-medium">
                {isTr ? 'En az 12 karakterli, yüksek güvenlikli şifre yapılandırması' : '12+ character high-security password configuration'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGenerateStrongPassword}
            className="px-2 py-1 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-md text-[10px] font-bold hover:bg-rose-100 transition-all flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Sparkles className="w-3 h-3 text-rose-600" />
            {isTr ? 'Şifre Üret' : 'Generate'}
          </button>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Key className="w-3 h-3" />
              {isTr ? 'Mevcut Şifre' : 'Current Password'}
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                required
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium text-slate-900 dark:text-slate-100 pr-8"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-3 h-3 text-rose-500" />
                {isTr ? 'Yeni Şifre' : 'New Password'}
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium text-slate-900 dark:text-slate-100 pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {isTr ? 'Yeni Şifre (Tekrar)' : 'Confirm Password'}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium text-slate-900 dark:text-slate-100 pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Compact Live Criteria Checklist */}
          <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/90 dark:border-slate-700/60 space-y-1.5">
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              {isTr ? 'Şifre Kriterleri' : 'Password Criteria'}
            </p>
            <div className="grid grid-cols-2 gap-1 text-[10.5px]">
              <div className={`flex items-center gap-1 ${ruleMinLength ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-400'}`}>
                {ruleMinLength ? <Check className="w-3 h-3 text-emerald-600 shrink-0" /> : <X className="w-3 h-3 text-slate-400 shrink-0" />}
                <span>{isTr ? 'En az 12 karakter' : '12+ chars'}</span>
              </div>
              <div className={`flex items-center gap-1 ${ruleUpper ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-400'}`}>
                {ruleUpper ? <Check className="w-3 h-3 text-emerald-600 shrink-0" /> : <X className="w-3 h-3 text-slate-400 shrink-0" />}
                <span>{isTr ? 'Büyük harf (A-Z)' : 'Uppercase'}</span>
              </div>
              <div className={`flex items-center gap-1 ${ruleLower ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-400'}`}>
                {ruleLower ? <Check className="w-3 h-3 text-emerald-600 shrink-0" /> : <X className="w-3 h-3 text-slate-400 shrink-0" />}
                <span>{isTr ? 'Küçük harf (a-z)' : 'Lowercase'}</span>
              </div>
              <div className={`flex items-center gap-1 ${ruleNumber ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-400'}`}>
                {ruleNumber ? <Check className="w-3 h-3 text-emerald-600 shrink-0" /> : <X className="w-3 h-3 text-slate-400 shrink-0" />}
                <span>{isTr ? 'Rakam (0-9)' : 'Number'}</span>
              </div>
              <div className={`flex items-center gap-1 ${ruleSpecial ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-400'}`}>
                {ruleSpecial ? <Check className="w-3 h-3 text-emerald-600 shrink-0" /> : <X className="w-3 h-3 text-slate-400 shrink-0" />}
                <span>{isTr ? 'Özel karakter' : 'Special char'}</span>
              </div>
              <div className={`flex items-center gap-1 ${passwords.newPassword && passwords.newPassword === passwords.confirmPassword ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-400'}`}>
                {passwords.newPassword && passwords.newPassword === passwords.confirmPassword ? <Check className="w-3 h-3 text-emerald-600 shrink-0" /> : <X className="w-3 h-3 text-slate-400 shrink-0" />}
                <span>{isTr ? 'Eşleşiyor' : 'Matches'}</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingPassword || !isPasswordValid || passwords.newPassword !== passwords.confirmPassword}
            className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {savingPassword ? (isTr ? 'Güncelleniyor...' : 'Updating...') : (isTr ? 'Şifreyi Güncelle' : 'Update Password')}
          </button>
        </form>
      </div>
    </div>
  );
}
