import React, { useState } from 'react';
import { Store, Utensils, Car, Building2, BookOpen, Hotel, ArrowRight, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

interface DemoAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (token: string, user: any) => void;
}

export const DemoAccountsModal: React.FC<DemoAccountsModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [loadingSector, setLoadingSector] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const demoSectors = [
    {
      id: 'shoplp',
      name: 'ShopLP - Perakende & E-Mağaza',
      badge: 'Genel Ticaret & POS',
      icon: Store,
      color: 'from-blue-600 to-indigo-600',
      bgColor: 'bg-blue-50 text-blue-700 border-blue-200',
      description: 'Ürün yönetimi, barkodlu satış, teknik servis takibi, cari hesaplar, fiyat teklifleri, alış ve satış faturaları.',
      itemsSample: 'Akıllı Telefon, Kulaklık, Akıllı Saat, Teknik Servis Kaydı'
    },
    {
      id: 'horecalp',
      name: 'HoReCaLP - Kafe & Restoran',
      badge: 'Hızlı POS & Adisyon',
      icon: Utensils,
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-50 text-amber-700 border-amber-200',
      description: 'Masa yönetimi, adisyonlar, yiyecek & içecek menüsü, mutfak ekranı ve hızlı tahsilat işlemleri.',
      itemsSample: 'Adana Kebap, Pide, Baklava, Masa 1-4, Adisyonlar'
    },
    {
      id: 'autolp',
      name: 'AutoLP - Otomotiv & Galeri',
      badge: 'Motorlu Araçlar',
      icon: Car,
      color: 'from-rose-600 to-red-700',
      bgColor: 'bg-rose-50 text-rose-700 border-rose-200',
      description: 'Araç portföyü, plaka, marka/model, kilometre, test sürüşü ve galeri stok operasyonları.',
      itemsSample: 'BMW 3.20i, Mercedes C200, Audi A4, Servis Kayıtları'
    },
    {
      id: 'restatelp',
      name: 'REstateLP - Gayrimenkul Emlak',
      badge: 'İlan & Portföy',
      icon: Building2,
      color: 'from-emerald-600 to-teal-700',
      bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: 'Villa, daire ve arsa portföyü, metrekare, oda sayısı, tapu bilgileri ve müşteri eşleştirme.',
      itemsSample: 'Girne Lüks Villa, Lefkoşa Daire, İskele Stüdyo'
    },
    {
      id: 'booklp',
      name: 'BookLP - Kitabevi & Kırtasiye',
      badge: 'Yayıncılık & Stok',
      icon: BookOpen,
      color: 'from-purple-600 to-indigo-700',
      bgColor: 'bg-purple-50 text-purple-700 border-purple-200',
      description: 'Kitap envanteri, yazar yönetimi, ISBN kodları, ders kitapları ve kırtasiye ürün takibi.',
      itemsSample: 'Suç ve Ceza Ciltli, Yazılım Mimarisi, Defterler'
    },
    {
      id: 'hotellp',
      name: 'HotelLP - Otel & Rezervasyon',
      badge: 'Konaklama Yönetimi',
      icon: Hotel,
      color: 'from-sky-600 to-blue-700',
      bgColor: 'bg-sky-50 text-sky-700 border-sky-200',
      description: 'Oda rezervasyonları, check-in / check-out takibi, Deluxe ve Suit odalar, konuk folyoları.',
      itemsSample: 'Deluxe Deniz Manzaralı Oda, Suit Oda, Aktif Rezervasyonlar'
    }
  ];

  const handleLaunchDemo = async (sectorId: string) => {
    try {
      setLoadingSector(sectorId);
      setErrorMsg(null);
      const res = await api.demoLogin(sectorId);
      if (res.token && res.user) {
        onLoginSuccess(res.token, res.user);
        onClose();
      } else {
        setErrorMsg('Demo hesaba giriş yapılırken geçersiz yanıt alındı.');
      }
    } catch (err: any) {
      console.error("Demo login error:", err);
      setErrorMsg(err?.response?.data?.error || 'Demo hesaba bağlanırken bir hata oluştu.');
    } finally {
      setLoadingSector(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm shadow-md shadow-indigo-500/20">LP</span>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Canlı Demo Hesapları ve Test Panelleri</h2>
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              İlgilendiğiniz sektörü seçin; içerisi örnek ürün, araç, gayrimenkul ve işlemlerle dolu canlı demo hesabına anında tek tıkla bağlanın!
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition-all font-bold text-lg"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {demoSectors.map((sector) => {
              const IconComponent = sector.icon;
              const isLoading = loadingSector === sector.id;

              return (
                <div 
                  key={sector.id}
                  className="group relative bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${sector.color} text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider border ${sector.bgColor}`}>
                        {sector.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {sector.name}
                    </h3>
                    
                    <p className="text-xs font-normal text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                      {sector.description}
                    </p>

                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 block mb-1">Yüklü Örnek Veriler:</span>
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 line-clamp-1">
                        ✨ {sector.itemsSample}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-3">
                    <button
                      onClick={() => handleLaunchDemo(sector.id)}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Demo Hesaba Bağlanılıyor...</span>
                        </>
                      ) : (
                        <>
                          <span>Hemen Demo İncele</span>
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-indigo-50/80 dark:bg-indigo-950/40 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-4 text-indigo-900 dark:text-indigo-200">
            <ShieldCheck className="h-6 w-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            <div className="text-xs leading-relaxed font-medium">
              <span className="font-bold">Güvenli ve İzole Test Ortamı:</span> Her demo hesabı kendi sektörel veritabanı ile tamamen bağımsızdır. Dilediğiniz gibi yeni ürün ekleyebilir, satış yapabilir, fatura kesebilir veya rezervasyon oluşturabilirsiniz.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            LookPrice Kurumsal Çoklu Sektör Ekosistemi
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
