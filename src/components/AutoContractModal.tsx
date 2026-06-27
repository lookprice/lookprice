import React, { useState } from "react";
import { 
  X, 
  Printer, 
  Share2, 
  Send, 
  Eye, 
  FileText,
  User, 
  CreditCard, 
  Phone, 
  Calendar,
  CheckCircle,
  ShieldCheck,
  FileSignature
} from "lucide-react";

interface AutoContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: any;
  storeName: string;
}

export const AutoContractModal: React.FC<AutoContractModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  storeName
}) => {
  const [contractType, setContractType] = useState<'consignment' | 'booking'>('consignment');
  const [clientName, setClientName] = useState("");
  const [clientIdentity, setClientIdentity] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [commissionAmount, setCommissionAmount] = useState("2.5");
  const [depositAmount, setDepositAmount] = useState("");
  const [contractDate, setContractDate] = useState(new Date().toISOString().split('T')[0]);
  const [signedName, setSignedName] = useState("");
  const [isSigned, setIsSigned] = useState(false);
  const [previewMode, setPreviewMode] = useState<'editor' | 'code'>('editor');

  const numberToWords = (n: string) => {
    const num = parseInt(n.replace(/\./g, ''));
    if (isNaN(num)) return '';

    const currencyNames: { [key: string]: string } = {
      GBP: 'Sterlin',
      USD: 'Dolar',
      EUR: 'Euro',
      TRY: 'Türk Lirası',
      TL: 'Türk Lirası'
    };
    const currencySuffix = currencyNames[vehicle?.currency?.toUpperCase()] || 'Türk Lirası';

    if (num === 0) {
      return 'Sıfır ' + currencySuffix;
    }

    const birler = ['', 'Bir', 'İki', 'Üç', 'Dört', 'Beş', 'Altı', 'Yedi', 'Sekiz', 'Dokuz'];
    const onlar = ['', 'On', 'Yirmi', 'Otuz', 'Kırk', 'Elli', 'Altmış', 'Yetmiş', 'Seksen', 'Doksan'];
    const basamak = ['', 'Bin', 'Milyon', 'Milyar'];
    
    let words = '';
    let i = 0;
    let tempNum = num;

    while (tempNum > 0) {
        let b = tempNum % 1000;
        if (b > 0) {
            let s = '';
            let y = Math.floor(b / 100);
            let o = Math.floor((b % 100) / 10);
            let bi = b % 10;
            
            if (y > 0) s += (y > 1 ? birler[y] : '') + 'Yüz';
            s += onlar[o] + birler[bi];
            
            if (i === 1 && b === 1) s = 'Bin';
            else s += basamak[i];
            words = s + words;
        }
        tempNum = Math.floor(tempNum / 1000);
        i++;
    }
    return words + ' ' + currencySuffix;
  };

  if (!isOpen || !vehicle) return null;

  const vehicleDetails = `${vehicle.brand} ${vehicle.model} (${vehicle.year}) • Plaka: ${vehicle.plate || 'Belirtilmedi'} • Şasi: ${vehicle.chassis_number || 'Belirtilmedi'} • KM: ${(vehicle.current_mileage || 0).toLocaleString()}`;
  const currencySymbol = vehicle.currency === 'GBP' ? '£' : vehicle.currency === 'USD' ? '$' : vehicle.currency === 'EUR' ? '€' : '₺';
  const priceFormatted = `${currencySymbol}${(vehicle.selling_price || vehicle.buying_price || 0).toLocaleString()}`;
  const depositFormatted = depositAmount ? `${depositAmount} ${currencySymbol} (${numberToWords(depositAmount)})` : '[Kapora Tutarı]';

  const renderConsignmentHtml = () => `
<div style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1e293b; line-height: 1.6;">
  <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px double #cbd5e1; padding-bottom: 20px;">
    <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">ARAÇ KONSİNYE GİRİŞ VE SATIŞ SÖZLEŞMESİ</h1>
    <h2 style="font-size: 13px; font-weight: bold; color: #64748b; margin: 5px 0 0 0; text-transform: uppercase;">CAR CONSIGNMENT & MARKETING MANDATE</h2>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px;">
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; width: 30%;">YETKİLİ GALERİ / DEALER</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${storeName.replace(/lookprice/gi, 'Seçkin')}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">ARAÇ SAHİBİ / OWNER</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>${clientName || '[Araç Sahibi Adı]'}</strong></td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">T.C. / PASAPORT NO</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${clientIdentity || '[Kimlik / Pasaport]'}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">TELEFON / PHONE</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${clientPhone || '[Telefon Numarası]'}</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">KONSİNYE ARAÇ BİLGİSİ</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${vehicleDetails}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">HEDEF SATIŞ BEDELİ</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #1d4ed8;">${priceFormatted}</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">HİZMET KOMİSYONU / FEE</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">%${commissionAmount} + KDV</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">SÖZLEŞME TARİHİ / DATE</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${contractDate}</td>
    </tr>
  </table>

  <h3 style="font-size: 14px; font-weight: bold; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-top: 20px;">SÖZLEŞME MADDELERİ / STANDARD CONSIGNMENT CLAUSES</h3>
  <ol style="font-size: 11px; color: #334155; padding-left: 20px; text-align: justify; margin-bottom: 25px;">
    <li><strong>Teslimat Amacı:</strong> Hizmet alan, yukarıda özellikleri belirtilen aracını satılması amacıyla Galeri'ye (emanet) teslim etmiştir. Araç konsinye süresince Galeri showroom'unda muhafaza edilecektir.</li>
    <li><strong>Galeri Sorumlulukları:</strong> Galeri, aracı fiziki olarak korumakla, rutin iç ve dış temizliğini sağlamakla, internet portallarında fotoğraf ve video donatılarıyla ilan ve pazarlamasını yapmakla yükümlüdür.</li>
    <li><strong>Satış Yetkisi ve Komisyon:</strong> Araç satış bedelinin ödenmesine müteakip, Galeri hedef satış bedeli üzerinden <strong>%${commissionAmount}</strong> pazarlama ve aracılık ücretine hak kazanır. Hizmet alan, Galeri'yi devredışı bırakarak aracı bir başkasına satarsa da yine belirlenen bu komisyon tutarını ödemeyi kabul ve taahhüt eder.</li>
    <li><strong>Süre:</strong> Bu emanet pazarlama sözleşmesi imza tarihinden itibaren 30 (Otuz) gün süreyle geçerlidir.</li>
  </ol>

  <div style="margin-top: 45px; display: flex; justify-content: space-between; gap: 40px;">
    <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 12px; padding: 15px; background-color: #f8fafc; text-align: center; min-height: 160px; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <span style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">YETKİLİ GALERİ ADINA</span>
        <span style="display: block; font-size: 10px; color: #94a3b8;">GALERİ YETKİLİ ADI</span>
      </div>
      <div style="font-size: 14px; font-weight: bold; color: #475569; font-style: italic;">
        ${storeName.replace(/lookprice/gi, 'Seçkin')}
      </div>
      <div style="font-size: 9px; color: #94a3b8;">Kaşe & Güvenli İmza / Stamp</div>
    </div>

    <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 12px; padding: 15px; background-color: #f8fafc; text-align: center; min-height: 160px; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <span style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">ARAÇ SAHİBİ / CONSULTANT</span>
        <span style="display: block; font-size: 10px; color: #94a3b8;">CLIENT / VEHICLE OWNER</span>
      </div>
      <div style="font-size: 14px; font-weight: bold; color: #0284c7; font-family: monospace; letter-spacing: 1px;">
        ${clientName ? clientName.toUpperCase() : '[İmza Onayı]'}
      </div>
      <div style="font-size: 9px; color: #94a3b8;">Onaylandı & Dijital Mühür Basıldı</div>
    </div>
  </div>
</div>
`;

  const renderBookingHtml = () => `
<div style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1e293b; line-height: 1.6;">
  <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px double #cbd5e1; padding-bottom: 20px;">
    <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">ARAÇ SATIŞ REZERVASYON VE KAPORA PROTOKOLÜ</h1>
    <h2 style="font-size: 13px; font-weight: bold; color: #64748b; margin: 5px 0 0 0; text-transform: uppercase;">CAR BOOKING & RESERVATION协议</h2>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px;">
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; width: 30%;">ARACI GALERİ / DEALER</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${storeName.replace(/lookprice/gi, 'Seçkin')}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">ALICI (Müşteri) / INVESTOR</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>${clientName || '[Alıcı Adı Soyadı]'}</strong></td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">T.C. / PASAPORT NO</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${clientIdentity || '[Kimlik / Pasaport Bilgisi]'}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">TELSİZ / PHONE</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${clientPhone || '[Telefon Numarası]'}</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">REZERVASYON ARAÇ DETAYI</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${vehicleDetails}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">TOPLAM ARAÇ BEDELİ</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #1d4ed8;">${priceFormatted}</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">ALINAN KAPORA TUTARI</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #e11d48;">${depositFormatted}</td>
    </tr>
  </table>

  <h3 style="font-size: 14px; font-weight: bold; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">SÖZLEŞME ŞARTLARI</h3>
  <p style="font-size: 11px; color: #334155; text-align: justify;">
    Alıcı, yukarıda bahsi geçen aracı satın alma niyetiyle rezervasyon kaporası ödemiştir. Söz konusu araç 7 (Yedi) iş günü süresince Galeri tarafından satış dondurma statüsünde kilitli tutularak üçüncü kişilere pazarlanmayacaktır. 7 iş günü sonunda alıcının bakiye tutarı ödemeyerek vazgeçmesi halinde kapora iade edilmez, Galeri lehine gelir kaydedilir. Galeri satış prosedürü güvenle korunmuştur.
  </p>

  <div style="margin-top: 45px; display: flex; justify-content: space-between; gap: 40px;">
    <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 12px; padding: 15px; background-color: #f8fafc; text-align: center;">
      <span style="font-size: 11px; font-weight: bold; color: #64748b;">ARACI / BROADCAST DEPT</span><br/><br/>
      <span style="font-weight: bold; color: #475569;">${storeName.replace(/lookprice/gi, 'Seçkin')}</span>
    </div>
    <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 12px; padding: 15px; background-color: #f8fafc; text-align: center;">
      <span style="font-size: 11px; font-weight: bold; color: #64748b;">MÜŞTERİ / BUYER</span><br/><br/>
      <span style="font-family: monospace; font-weight: bold; color: #0284c7;">${clientName ? clientName.toUpperCase() : '[İmza Onayı]'}</span>
    </div>
  </div>
</div>
`;

  const htmlContent = contractType === 'consignment' ? renderConsignmentHtml() : renderBookingHtml();

  const handlePrint = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.write(`
        <html>
          <head>
            <title>${contractType === 'consignment' ? 'Araç Emanet Sözleşmesi' : 'Araç Rezervasyon Protokolü'}</title>
            <style>
              body { font-family: sans-serif; background: white; margin: 40px; color: #1e293b; }
              @media print {
                body { margin: 0; padding: 20px; }
              }
            </style>
          </head>
          <body>
            ${htmlContent}
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    }
  };

  const handleShareWhatsApp = () => {
    const message = `Merhaba, ${vehicle.brand} ${vehicle.model} aracınız için düzenlenen resmi sözleşme hazırdır. Detayları incelemek için bizimle irtibata geçebilirsiniz. Tarih: ${contractDate}`;
    window.open(`https://wa.me/${clientPhone.replace(/\s+/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-[2.5rem] w-full max-w-6xl h-[90vh] flex flex-col md:flex-row overflow-hidden shadow-2xl relative border border-slate-800">
        
        {/* Left Side Parameters */}
        <div className="w-full md:w-[40%] bg-slate-950 p-6 flex flex-col justify-between border-r border-slate-800 overflow-y-auto">
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] bg-blue-600/20 text-blue-400 font-black tracking-widest px-2 py-0.5 rounded-md uppercase">Oto Galeri Legal CRM</span>
                <h3 className="text-xl font-black text-white mt-1">Galeri Sözleşme Jeneratörü</h3>
                <p className="text-slate-400 text-xs">Konsinye (Emanet) ve Alım-Satım Sözleşmeleri</p>
              </div>
              <button 
                onClick={onClose}
                className="md:hidden p-2 bg-slate-800 text-slate-400 rounded-full hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Type selector */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">1. Sözleşme Tipi</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setContractType('consignment'); setIsSigned(false); }}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                    contractType === 'consignment' 
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                      : 'bg-slate-900/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <span className="text-xs font-black">Konsinye Satış Sözleşmesi</span>
                  <span className="text-[8px] opacity-80">Emanet araç giriş tutanağı</span>
                </button>
                <button
                  onClick={() => { setContractType('booking'); setIsSigned(false); }}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                    contractType === 'booking' 
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                      : 'bg-slate-900/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <span className="text-xs font-black">Rezervasyon / Kapora</span>
                  <span className="text-[8px] opacity-80">Sözleşmeli ön satış kilidi</span>
                </button>
              </div>
            </div>

            {/* Params form */}
            <div className="space-y-3.5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">2. Müşteri & Sözleşme Detayları</span>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 ml-1">Müşteri / Malik Adı Soyadı</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="text"
                      className="w-full bg-slate-900 border border-slate-800 pl-9 pr-4 py-2 rounded-xl text-xs font-bold text-white focus:outline-none"
                      placeholder="Örn: Ahmet Kara"
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
                        value={clientIdentity}
                        onChange={(e) => setClientIdentity(e.target.value)}
                        placeholder="Örn: Pasaport / TC"
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
                        placeholder="Telefon"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 ml-1">Komisyon Tutarı (%)</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none"
                      value={commissionAmount}
                      onChange={(e) => setCommissionAmount(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 ml-1">Kapora Tutarı</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="Örn: 10.000"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 ml-1">Sözleşme Tarihi</label>
                    <input 
                      type="date"
                      className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"
                      value={contractDate}
                      onChange={(e) => setContractDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick drawing / signature button */}
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider">Hızlı Dijital İmza</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Müşteri onayını doğrudan mülk koduna bağlayıp geçerli aracı mühür kaydını oluşturabilirsiniz.
              </p>
              {isSigned ? (
                <div className="bg-emerald-950/40 border border-emerald-900/60 p-2.5 rounded-xl text-center text-xs text-emerald-400 font-bold flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Müşteri Dijital İmzası Onaylandı
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <input 
                    type="text" 
                    placeholder="Onaylayacak isim..." 
                    className="flex-1 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold text-white outline-none"
                    value={signedName}
                    onChange={(e) => setSignedName(e.target.value)}
                  />
                  <button 
                    onClick={() => {
                      if (!signedName) return alert("Lütfen imzalayan kişi ismini girin.");
                      setIsSigned(true);
                      setClientName(signedName);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase px-4 rounded-xl transition-all"
                  >
                    Mühürle
                  </button>
                </div>
              )}
            </div>
          </div>

          <p className="text-[9px] text-slate-500 text-center mt-6">
            Premium Auto Dealer Legal Module • v4 Engine
          </p>
        </div>

        {/* Right Side Rendering */}
        <div className="flex-1 bg-white flex flex-col justify-between overflow-hidden">
          
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center gap-2 shrink-0">
            <span className="text-[10px] text-slate-500 font-bold">
              Canlı Sözleşme Taslağı
            </span>

            <div className="flex gap-2">
              <button 
                onClick={handlePrint}
                className="p-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl border border-blue-100 transition-colors flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tight"
              >
                <Printer className="w-3.5 h-3.5" /> Yazdır / PDF
              </button>
              <button 
                onClick={handleShareWhatsApp}
                className="p-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl border border-green-100 transition-colors flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tight"
              >
                <Share2 className="w-3.5 h-3.5" /> WhatsApp Gönder
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-100/50">
            <div className="bg-white shadow-lg rounded-3xl border border-slate-200/80 overflow-hidden mx-auto max-w-3xl">
              <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button 
              onClick={onClose}
              className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-xl hover:bg-slate-800 transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
