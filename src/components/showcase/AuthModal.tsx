import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  authMode: 'login' | 'register';
  setAuthMode: (mode: 'login' | 'register') => void;
  lang: string;
  customerInfo: any;
  setCustomerInfo: (info: any) => void;
  onLogin: (e: React.FormEvent) => void;
  onRegister: (e: React.FormEvent) => void;
  theme?: {
    primaryColor?: string;
    borderFocusColor?: string;
  };
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  authMode,
  setAuthMode,
  lang,
  customerInfo,
  setCustomerInfo,
  onLogin,
  onRegister,
  theme
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-3xl p-6 md:p-10 w-full max-w-md relative z-10 shadow-2xl mx-auto flex flex-col max-h-[90vh] overflow-hidden"
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 md:right-6 md:top-6 p-2 rounded-full hover:bg-slate-100 transition-colors z-20 text-slate-500 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="overflow-y-auto flex-grow pr-2 -mr-2">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-6 text-center">
              {lang === "tr" ? "MÜŞTERİ GİRİŞİ" : "CUSTOMER LOGIN"}
            </h2>

            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
              <button
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${authMode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
                onClick={() => setAuthMode("login")}
              >
                {lang === "tr" ? "GİRİŞ YAP" : "LOGIN"}
              </button>
              <button
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${authMode === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
                onClick={() => setAuthMode("register")}
              >
                {lang === "tr" ? "KAYIT OL" : "REGISTER"}
              </button>
            </div>

            {authMode === "login" ? (
              <form onSubmit={onLogin} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="login-email" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {lang === "tr" ? "E-POSTA" : "E-MAIL"}
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 rounded-xl text-sm font-semibold transition-all"
                    style={{ focusBorderColor: theme?.borderFocusColor } as any}
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="login-password" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {lang === "tr" ? "ŞİFRE" : "PASSWORD"}
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    required
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 rounded-xl text-sm font-semibold transition-all"
                    style={{ focusBorderColor: theme?.borderFocusColor } as any}
                    value={customerInfo.password}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, password: e.target.value })}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-4 text-white rounded-xl font-bold text-sm tracking-wide shadow-xl transition-all cursor-pointer hover:bg-opacity-90 mt-2"
                  style={{ backgroundColor: theme?.primaryColor || '#0ea5e9' }}
                >
                  {lang === "tr" ? "GİRİŞ YAP" : "LOGIN"}
                </button>
              </form>
            ) : (
              <form onSubmit={onRegister} className="space-y-4">
                 <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={!customerInfo.is_corporate} onChange={() => setCustomerInfo({...customerInfo, is_corporate: false})} className="text-slate-900 focus:ring-slate-900"/>
                      <span className="text-xs font-bold text-slate-700">{lang === 'tr' ? 'Bireysel' : 'Individual'}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={customerInfo.is_corporate} onChange={() => setCustomerInfo({...customerInfo, is_corporate: true})} className="text-slate-900 focus:ring-slate-900"/>
                      <span className="text-xs font-bold text-slate-700">{lang === 'tr' ? 'Kurumsal' : 'Corporate'}</span>
                    </label>
                 </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="reg-name" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      {lang === "tr" ? "ADINIZ" : "NAME"}
                    </label>
                    <input
                      id="reg-name"
                      type="text"
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="reg-surname" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      {lang === "tr" ? "SOYADINIZ" : "SURNAME"}
                    </label>
                    <input
                      id="reg-surname"
                      type="text"
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                      value={customerInfo.surname}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, surname: e.target.value })}
                    />
                  </div>
                </div>
                
                {customerInfo.is_corporate && (
                  <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        {lang === "tr" ? "TC/VERGİ NUMARASI" : "TC/TAX ID"}
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                        value={customerInfo.tc_id || ''}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, tc_id: e.target.value })}
                      />
                  </div>
                )}

                <div className="space-y-1">
                  <label htmlFor="reg-email" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {lang === "tr" ? "E-POSTA" : "E-MAIL"}
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {lang === "tr" ? "TELEFON" : "PHONE"}
                  </label>
                  <input
                    type="tel"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        {lang === "tr" ? "İL" : "CITY"}
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                        value={customerInfo.city || ''}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, city: e.target.value })}
                      />
                    </div>
                     <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        {lang === "tr" ? "ÜLKE" : "COUNTRY"}
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                        value={customerInfo.country || ''}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, country: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      {lang === "tr" ? "ADRES" : "ADDRESS"}
                    </label>
                    <textarea
                      rows={2}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold resize-none"
                      value={customerInfo.address || ''}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="reg-password" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {lang === "tr" ? "ŞİFRE" : "PASSWORD"}
                  </label>
                  <input
                    id="reg-password"
                    type="password"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                    value={customerInfo.password}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, password: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="reg-passwordConfirm" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {lang === "tr" ? "ŞİFRE TEKRAR" : "PASSWORD (CONFIRM)"}
                  </label>
                  <input
                    id="reg-passwordConfirm"
                    type="password"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                    value={customerInfo.passwordConfirm}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, passwordConfirm: e.target.value })}
                  />
                </div>

                <div className="space-y-3 pt-2">
                   <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative flex-shrink-0 mt-0.5">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={customerInfo.accept_terms}
                          onChange={(e) => setCustomerInfo({...customerInfo, accept_terms: e.target.checked})}
                          required
                        />
                        <div className="w-5 h-5 border-2 border-slate-300 rounded peer-checked:bg-slate-900 peer-checked:border-slate-900 transition-colors flex items-center justify-center">
                           <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 14" fill="none">
                               <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                           </svg>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-slate-600 leading-snug group-hover:text-slate-900 transition-colors">
                        {lang === 'tr' ? 'Kişisel verilerin işlenmesine ilişkin aydınlatma metnini okudum ve kabul ediyorum.' : 'I have read and accept the clarification text on the processing of personal data.'}
                      </span>
                   </label>
                   
                   <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative flex-shrink-0 mt-0.5">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={customerInfo.marketing_email}
                          onChange={(e) => setCustomerInfo({...customerInfo, marketing_email: e.target.checked})}
                        />
                         <div className="w-5 h-5 border-2 border-slate-300 rounded peer-checked:bg-slate-900 peer-checked:border-slate-900 transition-colors flex items-center justify-center">
                           <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 14" fill="none">
                               <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                           </svg>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-slate-600 leading-snug group-hover:text-slate-900 transition-colors">
                        {lang === 'tr' ? 'Kampanyalardan e-posta ile haberdar olmak istiyorum.' : 'I want to be informed about campaigns by e-mail.'}
                      </span>
                   </label>
                   
                   <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative flex-shrink-0 mt-0.5">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={customerInfo.marketing_sms}
                          onChange={(e) => setCustomerInfo({...customerInfo, marketing_sms: e.target.checked})}
                        />
                        <div className="w-5 h-5 border-2 border-slate-300 rounded peer-checked:bg-slate-900 peer-checked:border-slate-900 transition-colors flex items-center justify-center">
                           <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 14" fill="none">
                               <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                           </svg>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-slate-600 leading-snug group-hover:text-slate-900 transition-colors">
                        {lang === 'tr' ? 'Kampanyalardan SMS ile haberdar olmak istiyorum.' : 'I want to receive marketing SMS messages.'}
                      </span>
                   </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 text-white rounded-xl font-bold text-sm tracking-wide shadow-xl transition-all cursor-pointer hover:bg-opacity-90 mt-2"
                  style={{ backgroundColor: theme?.primaryColor || '#0ea5e9' }}
                >
                  {lang === "tr" ? "KAYIT OL" : "REGISTER"}
                </button>
              </form>
            )}
            
            <div className="mt-8 flex items-center justify-center gap-4">
              <div className="flex-1 h-px bg-slate-200"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase">{lang === 'tr' ? 'VEYA' : 'OR'}</span>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>
            
            <button 
              className="mt-6 w-full py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-3 transition-colors cursor-pointer"
              onClick={() => alert("Yakında eklenecek")}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google {lang === 'tr' ? 'ile Giriş Yap' : 'Login'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
