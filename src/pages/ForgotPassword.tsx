import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { api } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../translations";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const res = await api.forgotPassword(email);
    setLoading(false);
    if (res.success) {
      setMessage(res.message);
      if (res.debug_token) {
        console.log("Debug Token:", res.debug_token);
      }
    } else {
      setError(res.error || (lang === 'tr' ? "İşlem başarısız" : "Operation failed"));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white font-sans px-4 selection:bg-indigo-500/30">
      {/* Top Navigation / Back Button */}
      <div className="fixed top-8 left-8 z-[100]">
        <button 
          onClick={() => navigate('/login')}
          className="flex items-center space-x-2 text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">{lang === 'tr' ? 'Girişe Dön' : 'Back to Login'}</span>
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
          <h2 className="text-3xl font-medium tracking-tight text-white">
            {lang === 'tr' ? 'Şifremi Unuttum' : 'Forgot Password'}
          </h2>
          <p className="mt-3 text-white/40 font-light">
            {lang === 'tr' 
              ? 'E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.' 
              : 'Enter your email address and we will send you a password reset link.'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 text-red-400 p-4 rounded-xl flex items-center text-sm border border-red-500/20">
              <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" /> 
              <span className="font-medium">{error}</span>
            </div>
          )}
          {message && (
            <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-xl flex items-center text-sm border border-emerald-500/20">
              <CheckCircle2 className="h-5 w-5 mr-3 flex-shrink-0" /> 
              <span className="font-medium">{message}</span>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
                {lang === 'tr' ? 'E-posta Adresi' : 'Email Address'}
              </label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-white placeholder-white/20"
                placeholder="admin@example.com"
              />
            </div>
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-white text-black rounded-xl font-medium hover:bg-white/90 transition-all disabled:opacity-50 mt-8"
          >
            {loading 
              ? (lang === 'tr' ? "Gönderiliyor..." : "Sending...") 
              : (lang === 'tr' ? "Sıfırlama Bağlantısı Gönder" : "Send Reset Link")}
          </button>
          
          <div className="mt-8 text-center">
            <button 
              type="button"
              onClick={() => navigate("/login")}
              className="text-sm text-white/40 hover:text-white font-medium transition-colors"
            >
              {lang === 'tr' ? 'Giriş Sayfasına Dön' : 'Return to Login'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
