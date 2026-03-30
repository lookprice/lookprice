import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { api } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../translations";
import { User } from "../types";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const { lang } = useLanguage();
  const t = translations[lang].auth;

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await api.getProfile();
      if (res) {
        setUser(res);
        setName(res.name || "");
        setPhone(res.phone || "");
        setAddress(res.address || "");
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.updateProfile({ name, phone, address });
    if (res.success) {
      setMessage(lang === 'tr' ? 'Profil güncellendi' : 'Profile updated');
    } else {
      setMessage(res.error || (lang === 'tr' ? 'Güncelleme başarısız' : 'Update failed'));
    }
  };

  if (!user) return <div className="text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto bg-[#111] p-8 rounded-3xl border border-white/10"
      >
        <h2 className="text-2xl font-medium mb-6">{lang === 'tr' ? 'Profilim' : 'My Profile'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-white/50 uppercase mb-2">{lang === 'tr' ? 'İsim' : 'Name'}</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 uppercase mb-2">{lang === 'tr' ? 'Telefon' : 'Phone'}</label>
            <input 
              type="text" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 uppercase mb-2">{lang === 'tr' ? 'Adres' : 'Address'}</label>
            <textarea 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl"
            />
          </div>
          <button 
            type="submit"
            className="w-full py-3 bg-white text-black rounded-xl font-medium"
          >
            {lang === 'tr' ? 'Kaydet' : 'Save'}
          </button>
          {message && <p className="text-center text-sm mt-4">{message}</p>}
        </form>
      </motion.div>
    </div>
  );
}
