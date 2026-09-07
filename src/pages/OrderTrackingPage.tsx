import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { api } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "@/translations";
import { Sale } from "../types";

export default function OrderTrackingPage() {
  const [orders, setOrders] = useState<Sale[]>([]);
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;

  useEffect(() => {
    const fetchOrders = async () => {
      const res = await api.getMyOrders();
      if (res) setOrders(res);
    };
    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-[#111] p-8 rounded-3xl border border-white/10"
      >
        <h2 className="text-2xl font-medium mb-6">{lang === 'tr' ? 'Siparişlerim' : 'My Orders'}</h2>
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="p-4 bg-black border border-white/10 rounded-xl flex justify-between items-center">
              <div>
                <p className="font-medium">#{order.id}</p>
                <p className="text-sm text-white/50">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{t[order.status] || order.status}</p>
                {order.tracking_number && (
                  <div className="flex flex-col items-end mt-1">
                    {order.shipping_carrier && <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{order.shipping_carrier}</p>}
                    <p className="text-xs text-indigo-400 font-mono">{order.tracking_number}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
