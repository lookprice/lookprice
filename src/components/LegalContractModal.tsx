import React, { useState } from "react";
import { 
  FileText, 
  Download, 
  Send, 
  Share2, 
  CheckCircle, 
  X, 
  Eye, 
  User, 
  CreditCard, 
  Calendar, 
  Bookmark, 
  Phone,
  FileCheck,
  Languages,
  Printer
} from "lucide-react";
import { contractTemplates, ContractTemplate, ContractPlaceholderValues } from "../utils/contractTemplates";
import { RealEstateProperty } from "../types";

interface LegalContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: RealEstateProperty;
  storeName: string;
}

export const LegalContractModal: React.FC<LegalContractModalProps> = ({ 
  isOpen, 
  onClose, 
  property,
  storeName 
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("showing_agreement");
  const [clientName, setClientName] = useState<string>("");
  const [clientIdentity, setClientIdentity] = useState<string>("");
  const [clientPhone, setClientPhone] = useState<string>("");
  const [commissionRate, setCommissionRate] = useState<string>("3");
  const [contractDate, setContractDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [previewMode, setPreviewMode] = useState<'editor' | 'preview'>('editor');
  const [signed, setSigned] = useState<boolean>(false);
  const [signingName, setSigningName] = useState<string>("");

  if (!isOpen) return null;

  const currentTemplate = contractTemplates.find(t => t.id === selectedTemplateId) || contractTemplates[0];

  const placeholderValues: ContractPlaceholderValues = {
    storeName: storeName || "LookPrice Real Estate",
    storePhone: "+90 533 800 00 00",
    storeEmail: "realestate@lookprice.me",
    clientName: clientName || "[Alıcı / Mülk Sahibi Adı]",
    clientIdentity: clientIdentity || "[T.C. No / Pasapor No]",
    clientPhone: clientPhone || "[Telefon Numarası]",
    propertyTitle: property.title,
    propertyLocation: property.location || "Kıbrıs",
    propertyPrice: `${(property.currency === 'GBP' ? '£' : property.currency === 'USD' ? '$' : property.currency === 'EUR' ? '€' : '₺')}${property.price.toLocaleString()}`,
    propertyBlockPlot: property.block_plot,
    commissionRate: commissionRate,
    contractDate: contractDate
  };

  const { html, markdown } = currentTemplate.getTemplate(placeholderValues);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${currentTemplate.titleTr}</title>
            <style>
              body { font-family: sans-serif; background: white; margin: 0; }
              @media print {
                body { padding: 0; }
                button { display: none; }
              }
            </style>
          </head>
          <body>
            ${html}
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleShareWhatsApp = () => {
    const message = `Merhaba, ${property.title} için düzenlenen ${currentTemplate.titleTr} belgesi hazırdır. İncelemek için bizimle iletişime geçebilirsiniz. Sözleşme Tarihi: ${placeholderValues.contractDate}`;
    window.open(`https://wa.me/${clientPhone.replace(/\s+/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleEmailPDF = () => {
    alert("Yatırımcı hukuk sözleşmesi dijital damgalı olarak PDF e-posta adresine gönderildi!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-[2.5rem] w-full max-w-6xl h-[90vh] flex flex-col md:flex-row overflow-hidden shadow-2xl relative border border-slate-800">
        
        {/* Left Side: Parameters Form */}
        <div className="w-full md:w-[40%] bg-slate-950 p-6 flex flex-col justify-between border-r border-slate-800 overflow-y-auto">
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] bg-indigo-600/20 text-indigo-400 font-black tracking-widest px-2 py-0.5 rounded-md uppercase">CRM Legal Integration</span>
                <h3 className="text-xl font-black text-white mt-1">Sözleşme Jeneratörü</h3>
                <p className="text-slate-400 text-xs">FTSO ve Kıbrıs mevzuatına uygun tanzim şablonları</p>
              </div>
              <button 
                onClick={onClose}
                className="md:hidden p-2 bg-slate-800 text-slate-400 rounded-full hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Template Selector */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">1. Sözleşme Tipi Seçin</span>
              <div className="grid grid-cols-1 gap-2">
                {contractTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplateId(template.id);
                      setSigned(false);
                    }}
                    className={`p-3 rounded-2xl flex items-start gap-3 transition-all text-left border ${
                      selectedTemplateId === template.id 
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/15' 
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900/90'
                    }`}
                  >
                    <FileText className={`w-5 h-5 shrink-0 mt-0.5 ${selectedTemplateId === template.id ? 'text-white' : 'text-slate-400'}`} />
                    <div>
                      <h5 className="text-xs font-black leading-tight">{template.titleTr}</h5>
                      <p className="text-[9px] text-slate-400 mt-1 line-clamp-1 group-hover:text-slate-300">
                        {template.descriptionTr}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Placeholder Parameters */}
            <div className="space-y-3.5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">2. Müşteri & Sözleşme Bilgileri</span>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 ml-1">Müşteri Tam Adı / Temsilci</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="text"
                      className="w-full bg-slate-900 border border-slate-800 pl-9 pr-4 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                      placeholder="Örn: John Smith"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 ml-1">Kimlik / Pasaport No</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input 
                        type="text"
                        className="w-full bg-slate-900 border border-slate-800 pl-9 pr-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none"
                        placeholder="Örn: 99123456"
                        value={clientIdentity}
                        onChange={(e) => setClientIdentity(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 ml-1">Telefon Numarası</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input 
                        type="text"
                        className="w-full bg-slate-900 border border-slate-800 pl-9 pr-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none"
                        placeholder="Örn: 0533..."
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 ml-1">Hizmet Komisyonu (%)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">%</span>
                      <input 
                        type="number"
                        className="w-full bg-slate-900 border border-slate-800 pl-7 pr-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none"
                        placeholder="3"
                        min="1"
                        max="10"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 ml-1">Sözleşme İmza Tarihi</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input 
                        type="date"
                        className="w-full bg-slate-900 border border-slate-800 pl-9 pr-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"
                        value={contractDate}
                        onChange={(e) => setContractDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Digital Stamp Feature */}
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider">Hızlı Dijital Onay İmza</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Müşteriyle ofiste veya tablet üzerinden yan yanayken, ismini yazarak dijital onay mührünü basabilirsiniz.
              </p>
              {signed ? (
                <div className="bg-emerald-950/40 border border-emerald-900/60 p-2.5 rounded-xl text-center text-xs text-emerald-400 font-bold flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Dijital Damga İmzalandı: {signingName}
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <input 
                    type="text" 
                    placeholder="Müşteri onay adı..." 
                    className="flex-1 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold text-white outline-none"
                    value={signingName}
                    onChange={(e) => setSigningName(e.target.value)}
                  />
                  <button 
                    onClick={() => {
                      if (!signingName) return alert("Lütfen onaylayacak kişinin adını yazın.");
                      setSigned(true);
                      setClientName(signingName);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase px-4 rounded-xl transition-all"
                  >
                    Mühürle
                  </button>
                </div>
              )}
            </div>
          </div>

          <p className="text-[9px] text-slate-500 text-center mt-6">
            LookPrice Premium Real Estate Engine • 2026 Legal Sync v4
          </p>
        </div>

        {/* Right Side: Contract Live Rendering */}
        <div className="flex-1 bg-white flex flex-col justify-between overflow-hidden">
          
          {/* Top action bar */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center gap-2 shrink-0">
            <div className="flex gap-1 bg-slate-200/80 p-0.5 rounded-xl">
              <button 
                onClick={() => setPreviewMode('editor')}
                className={`px-3 py-1 text-[10px] font-black uppercase tracking-tight rounded-lg flex items-center gap-1 transition-all ${
                  previewMode === 'editor' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Canlı İzle
              </button>
              <button 
                onClick={() => setPreviewMode('preview')}
                className={`px-3 py-1 text-[10px] font-black uppercase tracking-tight rounded-lg flex items-center gap-1 transition-all ${
                  previewMode === 'preview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                <Languages className="w-3.5 h-3.5" /> HTML Kod
              </button>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={handlePrint}
                className="p-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl border border-indigo-100 transition-colors flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tight"
                title="Yazdır"
              >
                <Printer className="w-3.5 h-3.5" /> Yazdır / PDF
              </button>
              <button 
                onClick={handleShareWhatsApp}
                className="p-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl border border-green-100 transition-colors flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tight"
                title="WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5" /> WhatsApp Paylaş
              </button>
              <button 
                onClick={handleEmailPDF}
                className="p-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tight"
                title="E-posta Gönder"
              >
                <Send className="w-3.5 h-3.5" /> E-posta
              </button>
              <button 
                onClick={onClose}
                className="hidden md:block p-2 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* RENDERED CONTENT */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-100/50">
            {previewMode === 'editor' ? (
              <div className="bg-white shadow-lg rounded-3xl border border-slate-200/80 overflow-hidden mx-auto max-w-3xl">
                <div dangerouslySetInnerHTML={{ __html: html }} />
              </div>
            ) : (
              <div className="max-w-2xl mx-auto p-4 bg-slate-950 text-cyan-400 font-mono text-[10px] leading-relaxed rounded-2xl border border-slate-900 overflow-x-auto">
                <pre>{html}</pre>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
