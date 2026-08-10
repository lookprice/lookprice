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
    badge: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    desc: 'Tüm mağaza paneline ve ayarlara sınırsız tam yetki',
    perms: ['products', 'invoices', 'crm', 'pos', 'reports', 'settings', 'team'] 
  },
  { 
    id: 'manager', 
    title: 'Mağaza Müdürü', 
    badge: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    desc: 'Operasyonel tam yetki; ilanlar, cari, faturalar, pos ve raporlar',
    perms: ['products', 'invoices', 'crm', 'pos', 'reports'] 
  },
  { 
    id: 'consultant', 
    title: 'Satış & Portföy Danışmanı', 
    badge: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
    desc: 'Portföy/ürün yönetimi, müşteri kaydı, randevular ve satış',
    perms: ['products', 'crm', 'pos'] 
  },
  { 
    id: 'staff', 
    title: 'Saha & Personel', 
    badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    desc: 'Sadece ürün/ilan listesi, müşteri kaydı ve hızlı satış',
    perms: ['products', 'pos'] 
  },
  { 
    id: 'viewer', 
    title: 'Gözlemci (Viewer)', 
    badge: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
    desc: 'Salt okunur görünüm, düzenleme ve işlem yetkisi yok',
    perms: [] 
  },
  { 
    id: 'custom', 
    title: 'Özel Yetkilendirme', 
    badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
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
    setPassword(''); // leave empty if not changing
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
        return <span className="px-2.5 py-1 bg-purple-500/10 text-purple-600 border border-purple-500/20 text-[10px] font-black uppercase rounded-lg">ADMIN / YÖNETİCİ</span>;
      case 'manager':
        return <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 text-[10px] font-black uppercase rounded-lg">MAĞAZA MÜDÜRÜ</span>;
      case 'consultant':
      case 'sales':
        return <span className="px-2.5 py-1 bg-teal-500/10 text-teal-600 border border-teal-500/20 text-[10px] font-black uppercase rounded-lg">SATIŞ DANIŞMANI</span>;
      case 'staff':
        return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-black uppercase rounded-lg">SAHA / PERSONEL</span>;
      case 'viewer':
        return <span className="px-2.5 py-1 bg-slate-500/10 text-slate-600 border border-slate-500/20 text-[10px] font-black uppercase rounded-lg">GÖZLEMCİ</span>;
      default:
        return <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-black uppercase rounded-lg">ÖZEL YETKİLİ</span>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 text-white shadow-2xl">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-10 h-10 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black tracking-tight text-white uppercase">
                EKİP YÖNETİMİ MAĞAZA ERİŞİM YETKİLERİ
              </h2>
              <p className="text-xs text-slate-400 font-bold">
                Mağaza kullanıcıları, yetki rolleri, şifre belirleme ve modül erişim kontrolleri
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>Kullanıcı Kotası: <strong className="text-white font-black">{users.length}</strong> / {maxUsers}</span>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" /> Yeni Kullanıcı Ekle
          </button>
        </div>
      </div>

      {/* Main Admin Account Highlight Banner */}
      <div className="p-4 bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-900 border border-purple-500/30 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-purple-600/20 border border-purple-500/40 rounded-xl flex items-center justify-center text-purple-300 font-black shrink-0">
            👑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white">MAĞAZA KURUCU / ADMIN HESABI</span>
              <span className="px-2 py-0.5 bg-purple-500 text-white text-[9px] font-black uppercase tracking-widest rounded-md">
                Sınırsız Tam Yetkili
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Mevcut mağaza sahibi hesabı varsayılan olarak <strong className="text-purple-300">ADMIN</strong> yetkisine sahiptir ve tüm yönetim modüllerini kontrol edebilir.
            </p>
          </div>
        </div>
      </div>

      {/* Users Grid / List */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-400" /> Kayıtlı Ekip Üyeleri ({users.length})
        </h3>

        {users.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/50 border border-slate-800/80 rounded-2xl space-y-3">
            <Users className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400 font-bold">Henüz ek bir ekip üyesi tanımlanmamış.</p>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs font-black hover:bg-indigo-600 hover:text-white transition-all"
            >
              + İlk Ekip Üyesini Ekle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map((u) => {
              const active = u.is_active !== undefined ? u.is_active : true;
              const isCurrentAdmin = u.email === currentUser?.email || u.role === 'superadmin';

              return (
                <div
                  key={u.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                    active 
                      ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700' 
                      : 'bg-slate-950/40 border-rose-900/40 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center text-white font-black text-sm uppercase shrink-0">
                        {(u.full_name || u.name || u.email || 'U')[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-black text-white">{u.full_name || u.name || u.email.split('@')[0]}</h4>
                          {getRoleBadge(u.role)}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400 font-medium">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-500" /> {u.email}</span>
                          {u.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-500" /> {u.phone}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleActive(u)}
                        title={active ? 'Hesabı Kapalı / Pasif Yap' : 'Hesabı Açık / Aktif Yap'}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                          active
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                        }`}
                      >
                        {active ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> AÇIK
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-400" /> KAPALI
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="text-[10px] font-bold text-slate-500">
                      ID: #{u.id} {u.username && `• @${u.username}`}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(u)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Düzenle & Şifre
                      </button>

                      {!isCurrentAdmin && (
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="p-1.5 bg-slate-800/60 hover:bg-rose-600 text-slate-400 hover:text-white rounded-xl transition-all"
                          title="Kullanıcıyı Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* User Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 md:p-8 space-y-6 text-white shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-6 right-6 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-all"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black uppercase text-white">
                  {editingUser ? 'Kullanıcı Düzenle & Yetkilendir' : 'Yeni Ekip Üyesi Oluştur'}
                </h3>
                <p className="text-xs text-slate-400 font-bold">
                  Giriş bilgileri, yetki rolü ve panel kullanım yetkilerini belirleyin
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-bold text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMsg}
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-5">
              {/* Name & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                    Ad Soyad
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Ahmet Yılmaz"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 px-4 text-xs font-bold text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                    Telefon Numarası
                  </label>
                  <input
                    type="tel"
                    placeholder="Örn: +90 533 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 px-4 text-xs font-bold text-white outline-none"
                  />
                </div>
              </div>

              {/* Email & Username */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                    Giriş E-Posta Adresi
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ahmet@magaza.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 px-4 text-xs font-bold text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                    Kullanıcı Adı (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    placeholder="ahmetyilmaz"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 px-4 text-xs font-bold text-white outline-none"
                  />
                </div>
              </div>

              {/* Password Section */}
              <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-wider">
                    {editingUser ? 'Yeni Şifre Belirle (Değiştirmek İstemiyorsanız Boş Bırakın)' : 'Giriş Şifresi Belirle *'}
                  </label>

                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[10px] font-black text-amber-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Rastgele Şifre Üret
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={editingUser ? '•••••••• (Mevcut şifreyi koru)' : 'En az 6 karakterli şifre'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 pl-4 pr-10 text-xs font-bold text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Account Status Switch */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                <div>
                  <p className="text-xs font-black text-white">Hesap Açık / Aktiflik Durumu</p>
                  <p className="text-[10px] text-slate-400">Kapalı yapılan kullanıcılar panele giriş yapamaz.</p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-900/60 text-rose-300 border border-rose-700'
                  }`}
                >
                  {isActive ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {isActive ? 'HESAP AÇIK (AKTİF)' : 'HESAP KAPALI (PASİF)'}
                </button>
              </div>

              {/* Role Presets */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  Kullanıcı Rolü & Şablon Yetkisi
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {ROLE_PRESETS.map((p) => {
                    const isSelected = role === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleRoleSelect(p.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500'
                            : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black text-white">{p.title}</span>
                          <span className={p.badge}>{p.id.toUpperCase()}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">{p.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Granular Permission Checkboxes */}
              <div>
                <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-wider mb-2">
                  Modül Bazlı Erişim Yetkileri (Özel İzinler)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {DEFAULT_MODULE_PERMISSIONS.map((m) => {
                    const isChecked = selectedPerms.includes(m.id) || role === 'admin';
                    const IconComp = m.icon;

                    return (
                      <div
                        key={m.id}
                        onClick={() => role !== 'admin' && handlePermToggle(m.id)}
                        className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                          isChecked
                            ? 'bg-emerald-950/20 border-emerald-500/50 text-white'
                            : 'bg-slate-950/30 border-slate-850 text-slate-500'
                        } ${role === 'admin' ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
                      >
                        <div className={`mt-0.5 p-1.5 rounded-lg ${isChecked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold">{m.label}</p>
                          <p className="text-[9px] text-slate-400 font-medium">{m.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-extrabold uppercase transition-all"
                >
                  İptal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all active:scale-95"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> {editingUser ? 'Değişiklikleri Kaydet' : 'Kullanıcıyı Kaydet'}
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
