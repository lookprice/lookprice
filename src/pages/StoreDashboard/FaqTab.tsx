import React from 'react';
import { HelpCircle } from 'lucide-react';

export default function FaqTab() {
  const faqItems = [
    { q: "İnternet kesilirse restoran operasyonları durur mu?", a: "Hayır, LookPrice PWA teknolojisi ile çalışır. İnternet kopsa dahi sipariş almaya, adisyon yönetmeye devam edebilirsiniz. Bağlantı geri geldiğinde tüm veriler otomatik olarak merkezi bulut sunucularımızla eşitlenir." },
    { q: "Masada hesap bölme veya kısmi tahsilat mümkün mü?", a: "Evet, LookPrice restoran modülünde Alman usulü hesap bölme, kalem bazlı adisyon taşıma ve kısmi tahsilat özellikleri tamamen esnektir. Garsonlarımız bu işlemleri kasaya gitmeden, mobil cihazlarından anında gerçekleştirebilir." },
    { q: "Garson veya kasiyerler geçmiş satışları veya adisyonları silebilir mi?", a: "Hayır. Sistemimizde yetkisiz silme işlemi mümkün değildir. Garson ve kasiyerler ancak 'iptal sebebi' belirterek işlem iptal edebilirler. Bu iptaller sistemde anlık olarak görüntülenir, raporlanır ve yönetici panelinden detaylıca filtrelenebilir." },
    { q: "Çalışanlar vardiya devrini nasıl yapacak?", a: "LookPrice, kasiyerler için özel bir 'Kasa Devir' senaryosu sunar. Vardiya sonunda sistem otomatik kasa raporu oluşturur ve çalışanlar birbirlerine kasayı güvenli ve hatasız bir şekilde teslim edebilirler." },
    { q: "Mutfak ve bar yazıcılarından çıktı alabilir miyiz?", a: "Evet, yerel ağınızda bulunan mutfak ve bar yazıcılarını, hafif bir 'Print Agent' uygulamamız ile sistemimize bağlayarak, siparişlerin anında ilgili birimlere iletilmesini sağlıyoruz." }
  ];

  return (
    <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
      <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
        <HelpCircle className="text-indigo-600" /> Sıkça Sorulan Sorular (Cafe/Restaurant)
      </h2>
      <div className="space-y-6">
        {faqItems.map((item, index) => (
          <div key={index} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
            <h3 className="text-md font-bold text-slate-900 mb-2">{item.q}</h3>
            <p className="text-slate-600 text-sm leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
