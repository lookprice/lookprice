import React from 'react';
import { motion } from 'motion/react';
import { Shield, FileText, Trash2, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LegalPage: React.FC<{ type: 'privacy' | 'terms' | 'deletion' }> = ({ type }) => {
  const navigate = useNavigate();

  const content = {
    privacy: {
      title: 'Gizlilik Politikası',
      icon: <Shield className="w-8 h-8 text-indigo-600" />,
      lastUpdate: '9 Temmuz 2024',
      sections: [
        {
          heading: '1. Veri Toplama',
          text: 'Enrakipsiz.com, Instagram entegrasyonu aracılığıyla yalnızca kullanıcı tarafından onaylanan portföy görsellerini ve açıklamalarını paylaşmak amacıyla erişim sağlar. Kişisel mesajlarınıza veya özel verilerinize erişilmez.'
        },
        {
          heading: '2. Veri Kullanımı',
          text: 'Toplanan veriler (Instagram Access Token), sadece sizin adınıza otomatik paylaşım yapmak için şifrelenmiş olarak saklanır. Bu veriler üçüncü taraflarla paylaşılmaz.'
        },
        {
          heading: '3. Güvenlik',
          text: 'Verileriniz endüstri standardı şifreleme yöntemleri ile korunmaktadır.'
        }
      ]
    },
    terms: {
      title: 'Kullanım Koşulları',
      icon: <FileText className="w-8 h-8 text-indigo-600" />,
      lastUpdate: '9 Temmuz 2024',
      sections: [
        {
          heading: '1. Hizmet Tanımı',
          text: 'Enrakipsiz, gayrimenkul ve otomotiv portföylerinizi yönetmenize ve sosyal medya platformlarında otomatik paylaşmanıza yardımcı olan bir SaaS platformudur.'
        },
        {
          heading: '2. Kullanıcı Sorumluluğu',
          text: 'Kullanıcılar, paylaşılan içeriklerin doğruluğundan ve telif haklarından kendileri sorumludur.'
        }
      ]
    },
    deletion: {
      title: 'Veri Silme Talimatları',
      icon: <Trash2 className="w-8 h-8 text-indigo-600" />,
      lastUpdate: '9 Temmuz 2024',
      sections: [
        {
          heading: 'Instagram Verilerini Kaldırma',
          text: 'Enrakipsiz üzerindeki Instagram bağlantınızı kaldırmak ve verilerinizi silmek için aşağıdaki adımları izleyin:'
        },
        {
          heading: 'Adım 1: Mağaza Paneli',
          text: 'Mağaza Dashboard -> Entegrasyonlar -> Meta sekmesine gidin.'
        },
        {
          heading: 'Adım 2: Bağlantıyı Kes',
          text: '"Bağlantıyı Kes" butonuna tıklayarak erişim anahtarınızı (token) sistemimizden kalıcı olarak silebilirsiniz.'
        },
        {
          heading: 'Adım 3: Facebook Ayarları',
          text: 'Alternatif olarak, Facebook Ayarlarınızdaki "Uygulamalar ve Web Siteleri" bölümünden Enrakipsiz uygulamasına olan erişimi kaldırabilirsiniz.'
        }
      ]
    }
  };

  const active = content[type];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-8 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Geri Dön
        </button>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-8 sm:p-12 border-b border-slate-50 bg-slate-50/50">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                {active.icon}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{active.title}</h1>
                <p className="text-slate-500 text-sm mt-1">Son Güncelleme: {active.lastUpdate}</p>
              </div>
            </div>
          </div>

          <div className="p-8 sm:p-12 space-y-10">
            {active.sections.map((section, idx) => (
              <div key={idx} className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900">{section.heading}</h2>
                <p className="text-slate-600 leading-relaxed text-lg">
                  {section.text}
                </p>
              </div>
            ))}

            <div className="pt-10 border-t border-slate-100 mt-10">
              <p className="text-slate-500 text-sm italic">
                Daha fazla bilgi veya sorularınız için destek@enrakipsiz.com adresi üzerinden bizimle iletişime geçebilirsiniz.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            © 2024 EnRakipsiz. Tüm hakları saklıdır.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LegalPage;
