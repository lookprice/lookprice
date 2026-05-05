import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { api } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../translations";
import { User } from "../types";

interface LoginPageProps {
  onLogin: (token: string, user: User) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang].auth;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.login({ email, password });
    if (res.token) {
      onLogin(res.token, res.user);
    } else {
      setError(res.error || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white font-sans px-4 selection:bg-indigo-500/30">
      {/* Top Navigation / Back Button */}
      <div className="fixed top-8 left-8 z-[100]">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">{lang === 'tr' ? 'Ana Sayfaya Dön' : 'Back to Home'}</span>
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-[#111] p-10 rounded-3xl shadow-2xl border border-white/10"
      >
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <div className="w-6 h-6 bg-black rounded-sm" />
            </div>
          </div>
          <h2 className="text-3xl font-medium tracking-tight text-white">{t.loginTitle}</h2>
          <p className="mt-3 text-white/40 font-light">
            {lang === 'tr' ? 'Sisteme erişmek için giriş yapın.' : 'Login to access the system.'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 text-red-400 p-4 rounded-xl flex items-center text-sm border border-red-500/20">
              <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" /> 
              <span className="font-medium">{error}</span>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2">{t.email}</label>
              <input 
                id="email"
                name="email"
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-white placeholder-white/20"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-xs font-medium text-white/50 uppercase tracking-wider">{t.password}</label>
                <button 
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                >
                  {t.forgotPassword}
                </button>
              </div>
              <input 
                id="password"
                name="password"
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-white placeholder-white/20"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <button 
            type="submit"
            className="w-full py-4 bg-white text-black rounded-xl font-medium hover:bg-white/90 transition-all mt-8"
          >
            {t.loginTitle}
          </button>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-white/40 font-light">
              {t.noAccount}{" "}
              <button 
                type="button"
                onClick={() => navigate("/", { state: { openDemo: true } })}
                className="text-white hover:text-indigo-400 font-medium transition-colors"
              >
                {t.registerTitle}
              </button>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
