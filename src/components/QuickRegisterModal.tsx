import React, { useState } from 'react';
import { X, Save, Building2, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function QuickRegisterModal({ isOpen, onClose, type, onSave, api, isTr }: any) {
  const [formData, setFormData] = useState<any>({
    name: "",
    tax_number: "",
    tax_office: "",
    address: "",
    email: ""
  });
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      let result;
      if (type === 'customer') {
        result = await api.addCustomer(formData);
      } else {
        result = await api.addCompany(formData);
      }
      onSave(result);
      onClose();
      toast.success(isTr ? "Kayıt başarıyla oluşturuldu" : "Registration successful");
    } catch (err) {
      toast.error(isTr ? "Kayıt oluşturulurken hata oluştu" : "Error creating registration");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckTaxpayer = async () => {
    if (!formData.tax_number) return;
    setChecking(true);
    try {
        const res = await api.checkTaxpayer(formData.tax_number);
        toast.info(res.documentType === 'E-FATURA' ? "E-Fatura Mükellefi" : "E-Arşiv Mükellefi");
    } catch(err) {
        toast.error("Sorgulama hatası");
    } finally {
        setChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-black">{type === 'customer' ? (isTr ? "Hızlı Müşteri Kaydı" : "Quick Customer Registration") : (isTr ? "Hızlı Firma Kaydı" : "Quick Company Registration")}</h3>
          <button onClick={onClose}><X className="h-5 w-5"/></button>
        </div>
        
        <input className="w-full p-3 border rounded-xl text-sm" placeholder={isTr ? "Ad / Ünvan" : "Name / Title"} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        
        <div className="flex gap-2">
            <input className="flex-1 p-3 border rounded-xl text-sm" placeholder={isTr ? "Vergi/TC No" : "Tax/ID No"} value={formData.tax_number} onChange={e => setFormData({...formData, tax_number: e.target.value})} />
            <button onClick={handleCheckTaxpayer} className="px-4 bg-slate-100 rounded-xl font-bold text-xs" disabled={checking}>
                {checking ? <Loader2 className="h-4 w-4 animate-spin"/> : (isTr ? "Sorgula" : "Check")}
            </button>
        </div>

        <input className="w-full p-3 border rounded-xl text-sm" placeholder={isTr ? "Vergi Dairesi" : "Tax Office"} value={formData.tax_office} onChange={e => setFormData({...formData, tax_office: e.target.value})} />
        <textarea className="w-full p-3 border rounded-xl text-sm" placeholder={isTr ? "Adres" : "Address"} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
        
        <button className="w-full py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700" onClick={handleSave} disabled={loading}>
          {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto"/> : (isTr ? "Kaydet" : "Save")}
        </button>
      </div>
    </div>
  );
}
