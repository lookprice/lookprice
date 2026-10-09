import React, { useState } from "react";
import { motion } from "motion/react";
import { api } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../translations";

export default function ReturnExchangePage() {
  const [orderId, setOrderId] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const { lang } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.requestReturn(parseInt(orderId), reason);
    if (res.success) {
      setMessage(lang === 'tr' ? 'İade talebiniz alındı' : 'Return request submitted');
    } else {
      setMessage(res.error || (lang === 'tr' ? 'Talep başarısız' : 'Request failed'));
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto bg-[#111] p-8 rounded-3xl border border-white/10"
      >
        <h2 className="text-2xl font-medium mb-6">{lang === 'tr' ? 'İade ve Değişim Talebi' : 'Return & Exchange Request'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-white/50 uppercase mb-2">{lang === 'tr' ? 'Sipariş No' : 'Order ID'}</label>
            <input 
              type="text" 
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 uppercase mb-2">{lang === 'tr' ? 'İade Nedeni' : 'Reason'}</label>
            <textarea 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl"
            />
          </div>
          <button 
            type="submit"
            className="w-full py-3 bg-white text-black rounded-xl font-medium"
          >
            {lang === 'tr' ? 'Talep Gönder' : 'Submit Request'}
          </button>
          {message && <p className="text-center text-sm mt-4">{message}</p>}
        </form>
      </motion.div>
    </div>
  );
}
