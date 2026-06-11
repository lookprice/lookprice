import React from 'react';
import { Mail, Shield, Lock } from 'lucide-react';

interface NewsletterSectionProps {
  show: boolean;
  lang: string;
}

export const NewsletterSection: React.FC<NewsletterSectionProps> = ({
  show,
  lang
}) => {
  if (!show) return null;

  return (
    <section className="bg-white py-12 px-4 md:px-8 border-t border-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-900 rounded-[4rem] p-6 md:p-24 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-blue-600/30 via-indigo-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-lg blur-[100px]" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16">
            <div className="max-w-xl text-center lg:text-left">
              <h2 className="text-4xl md:text-7xl font-bold text-white tracking-tighter mb-8 leading-[0.9]">
                {lang === "tr"
                  ? "Fırsatları Kaçırmayın"
                  : "Never Miss a Deal"}
              </h2>
              <p className="text-white/60 font-medium text-xl md:text-2xl leading-relaxed">
                {lang === "tr"
                  ? "Yeni ürünler ve özel indirimlerden ilk siz haberdar olun. Hemen abone olun!"
                  : "Be the first to know about new products and special discounts. Subscribe now!"}
              </p>
            </div>

            <div className="w-full max-w-md">
              <form
                className="space-y-4"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    placeholder={
                      lang === "tr"
                        ? "E-posta adresiniz"
                        : "Your email address"
                    }
                    className="w-full pl-16 pr-6 py-4 bg-white/10 border border-white/10 rounded-lg text-white placeholder:text-gray-500 font-bold focus:bg-white/20 focus:border-white/30 transition-all outline-none text-lg"
                  />
                </div>
                <button className="w-full py-4 bg-white text-gray-900 rounded-lg font-semibold text-lg tracking-wide hover:bg-blue-50 hover:scale-[0.98] transition-all shadow-lg shadow-black/20">
                  {lang === "tr"
                    ? "ABONE OL VE KEŞFET"
                    : "SUBSCRIBE & DISCOVER"}
                </button>
              </form>
              <div className="flex items-center justify-center lg:justify-start gap-4 mt-8 opacity-40">
                <div className="flex items-center gap-2">
                  <Shield className="w-3 h-3 text-white" />
                  <span className="text-[10px] text-white font-semibold tracking-wide">
                    KVKK GÜVENLİ
                  </span>
                </div>
                <div className="w-1 h-1 rounded-lg bg-white/20" />
                <div className="flex items-center gap-2">
                  <Lock className="w-3 h-3 text-white" />
                  <span className="text-[10px] text-white font-semibold tracking-wide">
                    SSL KORUMALI
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
