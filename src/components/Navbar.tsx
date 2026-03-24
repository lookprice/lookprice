import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Logo from "./Logo";
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../translations";
import { User } from "../types";

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

const Navbar = ({ user, onLogout }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang].nav;

  return (
    <nav className="bg-white/70 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center cursor-pointer group" onClick={() => navigate("/")}>
            <div className="p-2 bg-slate-950 rounded-2xl shadow-lg shadow-slate-950/10 group-hover:scale-105 transition-transform">
              <Logo size={24} className="text-white" />
            </div>
            <div className="ml-4 flex flex-col">
              <span className="text-xl font-black text-slate-900 tracking-tighter leading-none">Look<span className="text-indigo-600">Price</span></span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Retail_OS</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex items-center space-x-8 mr-8">
              {['Features', 'Pricing', 'ROI'].map((item) => (
                <button 
                  key={item} 
                  onClick={() => {
                    const element = document.getElementById(item);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest"
                >
                  {item}
                </button>
              ))}
            </div>

            {!user && (
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => navigate("/login")}
                  className="text-sm font-black text-slate-900 hover:text-indigo-600 transition-colors uppercase tracking-widest px-4"
                >
                  {t.login}
                </button>
                <button 
                  onClick={() => navigate("/", { state: { openDemo: true } })}
                  className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl text-sm font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95 uppercase tracking-widest"
                >
                  {translations[lang].nav.demo}
                </button>
              </div>
            )}
            {user && (
              <div className="flex items-center space-x-6">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Authenticated</span>
                  <span className="text-sm font-bold text-slate-900">{user.email}</span>
                </div>
                <div className="h-10 w-px bg-slate-200" />
                <button 
                  onClick={onLogout}
                  className="flex items-center text-slate-500 hover:text-rose-600 px-4 py-2.5 rounded-2xl text-sm font-black transition-colors hover:bg-rose-50 uppercase tracking-widest"
                >
                  <LogOut className="h-4 w-4 mr-2" /> {t.logout}
                </button>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-2 shadow-xl"
          >
            {!user && (
              <button 
                onClick={() => {
                  navigate("/login");
                  setIsOpen(false);
                }}
                className="block w-full text-center px-4 py-4 text-base font-black text-white bg-slate-900 rounded-2xl"
              >
                {t.login}
              </button>
            )}
            {user && (
              <>
                <div className="px-4 py-3 bg-slate-50 rounded-2xl mb-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">User Account</p>
                  <p className="text-sm font-bold text-slate-900">{user.email}</p>
                </div>
                <button 
                  onClick={() => {
                    onLogout();
                    setIsOpen(false);
                  }}
                  className="flex items-center justify-center w-full px-4 py-4 text-base font-bold text-rose-600 bg-rose-50 rounded-2xl"
                >
                  <LogOut className="h-5 w-5 mr-2" /> {t.logout}
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
