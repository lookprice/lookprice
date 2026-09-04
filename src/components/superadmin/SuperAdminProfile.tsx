import React, { useState, useEffect } from "react";
import { User, Key, Save, Lock, UserCircle, Briefcase, Phone, Mail, MapPin } from "lucide-react";
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
    full_name: "", // Can be used as Company/Store Name representation
    email: "",
    phone: "",
    address: ""
  });

  // Password Form
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

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
          address: res.address || ""
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
      toast.success(isTr ? 'Süper Mağaza Kimliği güncellendi.' : 'Super Store Identity updated.');
    } catch (error) {
      console.error(error);
      toast.error(isTr ? 'Güncelleme başarısız.' : 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      toast.success(isTr ? 'Şifre başarıyla güncellendi.' : 'Password updated successfully.');
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || (isTr ? 'Şifre güncellenemedi.' : 'Password update failed.'));
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">{isTr ? 'Yükleniyor...' : 'Loading...'}</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Super Store Identity */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <UserCircle className="text-indigo-600 w-6 h-6" />
            {isTr ? 'Süper Mağaza Kimliği' : 'Super Store Identity'}
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {isTr ? 'Süper admin temel iletişim ve marka bilgilerini güncelleyin.' : 'Update super admin basic contact and brand information.'}
          </p>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              {isTr ? 'Firma / Kurum Adı' : 'Company / Brand Name'}
            </label>
            <input
              type="text"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              placeholder="LookPrice HQ"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
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
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
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
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
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
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
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
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? (isTr ? 'Kaydediliyor...' : 'Saving...') : (isTr ? 'Kimliği Güncelle' : 'Update Identity')}
          </button>
        </form>
      </div>

      {/* Password Reset */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Lock className="text-rose-500 w-6 h-6" />
            {isTr ? 'Güvenlik & Şifre Değişimi' : 'Security & Password Reset'}
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {isTr ? 'Yeni şifreniz en az 12 karakter olmalı; büyük harf, küçük harf, rakam ve sembol içermelidir.' : 'New password must be at least 12 characters and include uppercase, lowercase, number, and symbol.'}
          </p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" />
              {isTr ? 'Mevcut Şifre' : 'Current Password'}
            </label>
            <input
              type="password"
              required
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 text-sm font-medium"
            />
          </div>
          
          <div className="space-y-1 pt-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isTr ? 'Yeni Şifre' : 'New Password'}
            </label>
            <input
              type="password"
              required
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 text-sm font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isTr ? 'Yeni Şifre (Tekrar)' : 'Confirm New Password'}
            </label>
            <input
              type="password"
              required
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 text-sm font-medium"
            />
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl my-4">
            <p className="text-xs text-amber-800 font-medium">
              <span className="font-bold">Kurumsal Güvenlik Politikası:</span> Şifreniz güçlü olmalı ve periyodik olarak değiştirilmelidir. Zayıf şifreler sistem tarafından reddedilecektir.
            </p>
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {savingPassword ? (isTr ? 'Kaydediliyor...' : 'Saving...') : (isTr ? 'Şifreyi Güncelle' : 'Update Password')}
          </button>
        </form>
      </div>
    </div>
  );
}
