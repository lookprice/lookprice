import React, { useState } from "react";
import { motion } from "motion/react";
import { api } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../translations";
import { useNavigate, useLocation } from "react-router-dom";

export default function GuestCheckoutPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const basket = location.state?.basket || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.createGuestSale({ name, email, address, items: basket });
    if (res.success) {
      setMessage(lang === 'tr' ? 'Siparişiniz alındı' : 'Order placed successfully');
      setTimeout(() => navigate('/'), 2000);
    } else {
      setMessage(res.error || (lang === 'tr' ? 'Sipariş başarısız' : 'Order failed'));
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto bg-[#111] p-8 rounded-3xl border border-white/10"
      >
        <h2 className="text-2xl font-medium mb-6">{lang === 'tr' ? 'Misafir Ödeme' : 'Guest Checkout'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-white/50 uppercase mb-2">{lang === 'tr' ? 'İsim' : 'Name'}</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 uppercase mb-2">{lang === 'tr' ? 'E-posta' : 'Email'}</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 uppercase mb-2">{lang === 'tr' ? 'Adres' : 'Address'}</label>
            <textarea 
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl"
            />
          </div>
          <button 
            type="submit"
            className="w-full py-3 bg-white text-black rounded-xl font-medium"
          >
            {lang === 'tr' ? 'Siparişi Tamamla' : 'Complete Order'}
          </button>
          {message && <p className="text-center text-sm mt-4">{message}</p>}
        </form>
      </motion.div>
    </div>
  );
}
