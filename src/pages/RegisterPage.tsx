import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { api } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../translations";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang].auth;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.register({ email, password, name });
    if (res.token) {
      // Assuming registration automatically logs in or redirects to login
      navigate("/login");
    } else {
      setError(res.error || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white font-sans px-4 selection:bg-indigo-500/30">
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
          <h2 className="text-3xl font-medium tracking-tight text-white">{lang === 'tr' ? 'Hesap Oluştur' : 'Create Account'}</h2>
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
              <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2">{lang === 'tr' ? 'İsim' : 'Name'}</label>
              <input 
                id="name"
                name="name"
                type="text" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-white placeholder-white/20"
                placeholder="John Doe"
              />
            </div>
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
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2">{t.password}</label>
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
            {lang === 'tr' ? 'Kayıt Ol' : 'Register'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
