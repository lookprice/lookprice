import React, { useState } from "react";
import { motion } from "motion/react";
import { api } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import { useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, CreditCard, Banknote, Truck, AlertCircle } from "lucide-react";

export default function GuestCheckoutPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'bank_transfer' | 'cash_on_delivery'>('credit_card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const basket = location.state?.basket || [];
  const storeId = location.state?.storeId;
  const total = location.state?.total || 0;
  const currency = location.state?.currency || 'TRY';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.createPublicSale({ 
        storeId,
        customerName: name, 
        customerEmail: email, 
        customerPhone: phone,
        customerAddress: address, 
        items: basket,
        total,
        currency,
        paymentMethod
      });

      if (res.success) {
        if (res.paymentPageUrl) {
           // Modal içinde kalmamak için PaymentGatewayPage sayfasına yönlendiriyoruz
           navigate('/payment-gateway', { state: { paymentPageUrl: res.paymentPageUrl } });
        } else {
          navigate('/checkout/success');
        }
      } else {
        setError(res.error || "Ödeme başlatılamadı");
      }
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto bg-[#111] p-8 rounded-3xl border border-white/10"
      >
        <h2 className="text-2xl font-medium mb-6">{lang === 'tr' ? 'Güvenli Ödeme' : 'Secure Checkout'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/50 uppercase mb-2">{lang === 'tr' ? 'İsim Soyisim' : 'Full Name'}</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl focus:border-white/30 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 uppercase mb-2">{lang === 'tr' ? 'Telefon' : 'Phone'}</label>
              <input 
                type="tel" 
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl focus:border-white/30 transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/50 uppercase mb-2">{lang === 'tr' ? 'E-posta' : 'Email'}</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl focus:border-white/30 transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-white/50 uppercase mb-2">{lang === 'tr' ? 'Teslimat Adresi' : 'Shipping Address'}</label>
            <textarea 
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl focus:border-white/30 transition-all outline-none h-24 resize-none"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-xs text-white/50 uppercase mb-2">{lang === 'tr' ? 'Ödeme Yöntemi' : 'Payment Method'}</label>
            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('credit_card')}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${paymentMethod === 'credit_card' ? 'border-white bg-white/10' : 'border-white/10 bg-black'}`}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="font-medium">{lang === 'tr' ? 'Kredi / Banka Kartı (iyzico)' : 'Credit / Debit Card (iyzico)'}</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${paymentMethod === 'bank_transfer' ? 'border-white bg-white/10' : 'border-white/10 bg-black'}`}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5" />
                  <span className="font-medium">{lang === 'tr' ? 'Havale / EFT' : 'Bank Transfer'}</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cash_on_delivery')}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${paymentMethod === 'cash_on_delivery' ? 'border-white bg-white/10' : 'border-white/10 bg-black'}`}
              >
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5" />
                  <span className="font-medium">{lang === 'tr' ? 'Kapıda Ödeme' : 'Cash on Delivery'}</span>
                </div>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-white text-black rounded-xl font-bold text-lg hover:bg-gray-200 transition-all disabled:opacity-50"
          >
            {loading ? (lang === 'tr' ? 'İşleniyor...' : 'Processing...') : (lang === 'tr' ? 'Ödemeye Geç' : 'Proceed to Payment')}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
