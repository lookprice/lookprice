import React from 'react';
import { 
  ShoppingBag, 
  Instagram, 
  Facebook, 
  Twitter, 
  MessageCircle, 
  Mail, 
  Phone, 
  CreditCard, 
  ShieldCheck, 
  Globe 
} from 'lucide-react';
import { Store as StoreInfo } from '../../types';

interface StoreFooterProps {
  store: any;
  lang: string;
  setShowAboutModal: (show: boolean) => void;
  setShowStoreLocatorModal: (show: boolean) => void;
}

const getDisplayStoreName = (store: any) => {
  const rawName = store?.branding?.store_name || store?.branding?.name || store?.name || "";
  if (!rawName || rawName.toLowerCase().includes("lookprice")) {
    const type = store?.store_type || store?.branding?.store_type;
    if (type === 'real_estate') {
      return "Premium VIP Emlak";
    } else if (type === 'motor_vehicle' || type === 'automotive') {
      return "Seçkin Otomotiv";
    }
    return "Seçkin Mağaza";
  }
  return rawName;
};

export const StoreFooter: React.FC<StoreFooterProps> = ({
  store,
  lang,
  setShowAboutModal,
  setShowStoreLocatorModal
}) => {
  const displayName = getDisplayStoreName(store);

  return (
    <footer className="bg-slate-50 pt-20 pb-10 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          <div className="col-span-1">
            <div className="flex items-center gap-3 mb-6">
              {store?.logo_url ? (
                <img
                  src={store.logo_url}
                  alt={displayName}
                  className="h-8 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : null}
              <span className="text-xl font-bold tracking-tighter text-slate-950">
                {displayName}
              </span>
            </div>
            <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6">
              {store?.description || (lang === "tr" ? "Seçkin ürünler, premium deneyim." : "Exclusive products, premium experience.")}
            </p>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6">
              {lang === "tr" ? "HIZLI ERİŞİM" : "QUICK LINKS"}
            </h4>
            <ul className="space-y-3">
               {store?.about_text && (
                  <li>
                    <button
                      onClick={() => setShowAboutModal(true)}
                      className="text-slate-600 hover:text-slate-950 text-xs font-semibold transition-colors"
                    >
                      {lang === "tr" ? "Hakkımızda" : "About Us"}
                    </button>
                  </li>
               )}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6">
              {lang === "tr" ? "İLETİŞİM" : "CONTACT"}
            </h4>
            <ul className="space-y-3">
               <li className="text-slate-600 text-xs font-semibold">
                  {store?.email || "destek@seckinmagaza.com"}
               </li>
               <li className="text-slate-600 text-xs font-semibold">
                  {store?.phone || "+90 212 000 00 00"}
               </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 font-medium text-[10px]">
              © {new Date().getFullYear()} {displayName}.
            </p>
            <div className="flex items-center gap-6">
               <span className="text-slate-400 text-[10px] font-medium tracking-wide">
                 Secure Platform
               </span>
            </div>
        </div>
      </div>
    </footer>
  );
};
