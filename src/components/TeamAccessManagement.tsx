import React, { useState } from 'react';
import { 
  Users, UserPlus, Shield, ShieldCheck, Key, Lock, CheckCircle2, 
  XCircle, Edit3, Trash2, Eye, EyeOff, Sparkles, AlertCircle, RefreshCw,
  FileText, ShoppingBag, CreditCard, BarChart2, Settings, UserCheck, Phone, Mail
} from 'lucide-react';
import { api } from '../services/api';

export interface StoreUser {
  id: number;
  username?: string;
  email: string;
  role: string;
  full_name?: string;
  name?: string;
  phone?: string;
  is_active?: boolean;
  permissions?: string | string[];
  created_at?: string;
}

interface TeamAccessManagementProps {
  users: StoreUser[];
  currentUser?: any;
  storeId?: number;
  maxUsers?: number;
  lang?: string;
  onRefreshUsers?: () => void;
}

const DEFAULT_MODULE_PERMISSIONS = [
  { id: 'products', label: 'İlan / Ürün Yönetimi', desc: 'İlan/Ürün ekleme, fiyat güncelleme ve durum değiştirme', icon: ShoppingBag },
  { id: 'invoices', label: 'Alış / Satış Faturaları', desc: 'E-Fatura, e-Arşiv ve alış/satış faturaları takibi', icon: FileText },
  { id: 'crm', label: 'Cari Hesaplar & CRM', desc: 'Müşteri kayıtları, borç/alacak ve kişi yönetimi', icon: Users },
  { id: 'pos', label: 'Hızlı Satış & POS', desc: 'Kasa işlemleri ve mağaza hızlı satış terminali', icon: CreditCard },
  { id: 'reports', label: 'Finansal Raporlar', desc: 'Gelir/gider tablosu, ciro ve satış analizleri', icon: BarChart2 },
  { id: 'settings', label: 'Mağaza & Web Ayarları', desc: 'Site görünümü, branding ve genel mağaza ayarları', icon: Settings },
  { id: 'team', label: 'Ekip & Yetki Yönetimi', desc: 'Kullanıcı ekleme ve yetkilendirme işlemleri', icon: ShieldCheck },
];

const ROLE_PRESETS = [
  { 
    id: 'admin', 
    title: 'ADMIN / Mağaza Yöneticisi', 
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    desc: 'Tüm mağaza paneline ve ayarlara sınırsız tam yetki',
    perms: ['products', 'invoices', 'crm', 'pos', 'reports', 'settings', 'team'] 
  },
  { 
    id: 'manager', 
    title: 'Mağaza Müdürü', 
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    desc: 'Operasyonel tam yetki; ilanlar, cari, faturalar, pos ve raporlar',
    perms: ['products', 'invoices', 'crm', 'pos', 'reports'] 
  },
  { 
    id: 'consultant', 
    title: 'Satış & Portföy Danışmanı', 
    badge: 'bg-teal-50 text-teal-700 border-teal-200',
    desc: 'Portföy/ürün yönetimi, müşteri kaydı, randevular ve satış',
    perms: ['products', 'crm', 'pos'] 
  },
  { 
    id: 'staff', 
    title: 'Saha & Personel', 
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    desc: 'Sadece ürün/ilan listesi, müşteri kaydı ve hızlı satış',
    perms: ['products', 'pos'] 
  },
  { 
    id: 'viewer', 
    title: 'Gözlemci (Viewer)', 
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    desc: 'Salt okunur görünüm, düzenleme ve işlem yetkisi yok',
    perms: [] 
  },
  { 
    id: 'custom', 
    title: 'Özel Yetkilendirme', 
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    desc: 'Modül bazlı özel izin seçimi',
    perms: [] 
  }
];

export const TeamAccessManagement: React.FC<TeamAccessManagementProps> = ({
  users = [],
  currentUser,
  storeId,
  maxUsers = 10,
  lang = 'tr',
  onRefreshUsers
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StoreUser | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('consultant');
  const [isActive, setIsActive] = useState(true);
  const [selectedPerms, setSelectedPerms] = useState<string[]>(['products', 'crm']);
  
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password generator
  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
    setShowPassword(true);
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setUsername('');
    setPassword('');
    setShowPassword(false);
    setRole('consultant');
    setIsActive(true);
    setSelectedPerms(['products', 'crm']);
    setErrorMsg('');
    setSuccessMsg('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (u: StoreUser) => {
    setEditingUser(u);
    setFullName(u.full_name || u.name || '');
    setEmail(u.email || '');
    setPhone(u.phone || '');
    setUsername(u.username || '');
    setPassword('');
    setShowPassword(false);
    setRole(u.role || 'consultant');
    setIsActive(u.is_active !== undefined ? u.is_active : true);
    
    // Parse permissions
    let pList: string[] = [];
    if (Array.isArray(u.permissions)) {
      pList = u.permissions;
    } else if (typeof u.permissions === 'string') {
      try {
        pList = JSON.parse(u.permissions);
      } catch (e) {
        pList = [];
      }
    } else if (u.role === 'admin' || u.role === 'storeadmin' || u.role === 'superadmin') {
      pList = ['products', 'invoices', 'crm', 'pos', 'reports', 'settings', 'team'];
    }
    setSelectedPerms(pList);
    setErrorMsg('');
    setSuccessMsg('');
    setModalOpen(true);
  };

  const handleRoleSelect = (selectedRole: string) => {
    setRole(selectedRole);
    const preset = ROLE_PRESETS.find(r => r.id === selectedRole);
    if (preset && selectedRole !== 'custom') {
      setSelectedPerms(preset.perms);
    }
  };

  const handlePermToggle = (permId: string) => {
    setRole('custom');
    if (selectedPerms.includes(permId)) {
      setSelectedPerms(selectedPerms.filter(p => p !== permId));
    } else {
      setSelectedPerms([...selectedPerms, permId]);
    }
  };

  const handleToggleActive = async (u: StoreUser) => {
    try {
      const newStatus = !(u.is_active !== undefined ? u.is_active : true);
      await api.toggleUserStatus(u.id, newStatus, storeId);
      if (onRefreshUsers) onRefreshUsers();
    } catch (err: any) {
      alert("Durum güncellenirken hata oluştu: " + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteUser = async (u: StoreUser) => {
    if (!window.confirm(`${u.full_name || u.email} kullanıcısını mağazadan silmek istediğinize emin misiniz?`)) {
      return;
    }
    try {
      await api.deleteUser(u.id, storeId);
      if (onRefreshUsers) onRefreshUsers();
    } catch (err: any) {
      alert("Kullanıcı silinirken hata oluştu: " + (err.response?.data?.error || err.message));
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }
    if (!editingUser && !password) {
      setErrorMsg('Yeni kullanıcı için giriş şifresi belirlemeniz gerekmektedir.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    const payload = {
      full_name: fullName || email.split('@')[0],
      email,
      phone,
      username: username || email.split('@')[0],
      password,
      role,
      is_active: isActive,
      permissions: selectedPerms,
      storeId
    };

    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, payload, storeId);
        setSuccessMsg('Kullanıcı bilgileri ve yetkileri başarıyla güncellendi!');
      } else {
        await api.addUser(payload, storeId);
        setSuccessMsg('Yeni kullanıcı hesabı oluşturuldu ve yetkileri atandı!');
      }

      setTimeout(() => {
        setModalOpen(false);
        if (onRefreshUsers) onRefreshUsers();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || 'Kullanıcı kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadge = (userRole: string) => {
    switch (userRole) {
      case 'admin':
      case 'storeadmin':
      case 'superadmin':
        return <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-black uppercase rounded-lg">ADMIN / YÖNETİCİ</span>;
      case 'manager':
        return <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-black uppercase rounded-lg">MAĞAZA MÜDÜRÜ</span>;
      case 'consultant':
      case 'sales':
        return <span className="px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-black uppercase rounded-lg">SATIŞ DANIŞMANI</span>;
      case 'staff':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase rounded-lg">SAHA / PERSONEL</span>;
      case 'viewer':
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-black uppercase rounded-lg">GÖZLEMCİ</span>;
      default:
        return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase rounded-lg">ÖZEL YETKİLİ</span>;
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 md:p-5 space-y-4 text-slate-900 shadow-2xs">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs md:text-sm font-extrabold tracking-tight text-slate-900 uppercase">
              EKİP YÖNETİMİ VE ERİŞİM YETKİLERİ
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Mağaza kullanıcıları ve modül bazlı yetkilendirme
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>Kota: <strong className="text-slate-900 font-black">{users.length}</strong> / {maxUsers}</span>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Yeni Ekip Üyesi</span>
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-500" /> Kayıtlı Kullanıcılar ({users.length})
          </span>
        </div>

        {users.length === 0 ? (
          <div className="p-6 text-center bg-slate-50/80 border border-slate-200 rounded-xl space-y-2">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Henüz ek bir ekip üyesi bulunmuyor.</p>
            <button
              onClick={handleOpenAddModal}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-extrabold transition-all cursor-pointer shadow-2xs"
            >
              + İlk Ekip Üyesini Ekle
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((u) => {
              const active = u.is_active !== undefined ? u.is_active : true;
              const isCurrentAdmin = u.email === currentUser?.email || u.role === 'superadmin';

              return (
                <div
                  key={u.id}
                  className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    active 
                      ? 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-white' 
                      : 'bg-rose-50/40 border-rose-200/80 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-indigo-50 border border-indigo-200/90 rounded-lg flex items-center justify-center text-indigo-700 font-extrabold text-xs uppercase shrink-0 shadow-2xs">
                      {(u.full_name || u.name || u.email || 'U')[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-slate-900 truncate">{u.full_name || u.name || u.email.split('@')[0]}</span>
                        {getRoleBadge(u.role)}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3 text-slate-400 shrink-0" /> {u.email}</span>
                        {u.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400 shrink-0" /> {u.phone}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleToggleActive(u)}
                      className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                        active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      {active ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> AÇIK
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-rose-600" /> KAPALI
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(u)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Edit3 className="w-3 h-3" /> Düzenle
                    </button>

                    {!isCurrentAdmin && (
                      <button
                        onClick={() => handleDeleteUser(u)}
                        className="p-1 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 rounded-md transition-all cursor-pointer"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Compact User Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 space-y-4 text-slate-900 shadow-xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-lg transition-all cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-center text-emerald-600">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase text-slate-900">
                  {editingUser ? 'Kullanıcı Düzenle & Yetkilendir' : 'Yeni Ekip Üyesi'}
                </h3>
                <p className="text-[10px] text-slate-500 font-medium">
                  Giriş bilgileri ve modül erişim rolleri
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] font-bold text-rose-700 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] font-bold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {successMsg}
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-3.5">
              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Ad Soyad
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ahmet Yılmaz"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg py-2 px-3 text-xs font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    placeholder="+90 533 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg py-2 px-3 text-xs font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Email & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    E-Posta Adresi *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ahmet@magaza.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg py-2 px-3 text-xs font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Kullanıcı Adı (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    placeholder="ahmetyilmaz"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg py-2 px-3 text-xs font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Password Section */}
              <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[9px] font-black text-slate-700 uppercase tracking-wider">
                    {editingUser ? 'Yeni Şifre (İsteğe Bağlı)' : 'Giriş Şifresi *'}
                  </label>

                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[9px] font-black text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> Rastgele Üret
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={editingUser ? '•••••••• (Mevcut korunsun)' : 'En az 6 karakter'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-lg py-1.5 pl-3 pr-8 text-xs font-bold text-slate-900 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Account Status Switch */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50/80 border border-slate-200 rounded-xl">
                <div>
                  <p className="text-[11px] font-black text-slate-900">Hesap Durumu</p>
                  <p className="text-[9px] text-slate-500">Pasif yapılan kullanıcılar giriş yapamaz.</p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-100 text-rose-700 border border-rose-200'
                  }`}
                >
                  {isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {isActive ? 'AKTİF' : 'PASİF'}
                </button>
              </div>

              {/* Role Presets */}
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                  Rol & İzin Şablonu
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ROLE_PRESETS.map((p) => {
                    const isSelected = role === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleRoleSelect(p.id)}
                        className={`p-2 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-500 ring-1 ring-indigo-500'
                            : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-[10px] font-black text-slate-900 truncate">{p.title}</div>
                        <div className="text-[8px] text-slate-500 truncate mt-0.5">{p.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Granular Permission Checkboxes */}
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                  Modül Erişim Yetkileri
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {DEFAULT_MODULE_PERMISSIONS.map((m) => {
                    const isChecked = selectedPerms.includes(m.id) || role === 'admin';
                    const IconComp = m.icon;

                    return (
                      <div
                        key={m.id}
                        onClick={() => role !== 'admin' && handlePermToggle(m.id)}
                        className={`p-2 rounded-lg border flex items-center gap-2 transition-all ${
                          isChecked
                            ? 'bg-emerald-50/80 border-emerald-300 text-slate-900'
                            : 'bg-slate-50/50 border-slate-200 text-slate-500'
                        } ${role === 'admin' ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
                      >
                        <div className={`p-1 rounded ${isChecked ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                          <IconComp className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-extrabold truncate">{m.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-extrabold uppercase transition-all cursor-pointer"
                >
                  İptal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-100"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> {editingUser ? 'Kaydet' : 'Oluştur'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamAccessManagement;
