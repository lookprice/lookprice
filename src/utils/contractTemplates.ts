export interface ContractPlaceholderValues {
  storeName: string;
  storePhone?: string;
  storeEmail?: string;
  clientName: string;
  clientIdentity: string;
  clientPhone: string;
  propertyTitle: string;
  propertyLocation: string;
  propertyPrice: string;
  propertyBlockPlot?: string;
  commissionRate: string;
  contractDate: string;
}

export interface ContractTemplate {
  id: string;
  titleTr: string;
  titleEn: string;
  descriptionTr: string;
  descriptionEn: string;
  getTemplate: (values: ContractPlaceholderValues) => { html: string; markdown: string };
}

export const contractTemplates: ContractTemplate[] = [
  {
    id: "showing_agreement",
    titleTr: "Yer Gösterme Belgesi (Komisyon Sözleşmesi)",
    titleEn: "Property Showing & Commission Agreement",
    descriptionTr: "Müşterinin portföyü gördüğünü ve doğrudan satın alma/kiralama girişimlerini önleyen sözleşme.",
    descriptionEn: "Confirms property viewing and protects agent's commission rights from direct purchase.",
    getTemplate: (v) => {
      const html = `
<div style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1e293b; line-height: 1.6;">
  <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px double #cbd5e1; padding-bottom: 20px;">
    <h1 style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">YER GÖSTERME SÖZLEŞMESİ</h1>
    <h2 style="font-size: 14px; font-weight: bold; color: #64748b; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em;">PROPERTY SHOWING AGREEMENT</h2>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px;">
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; width: 30%;">EMLAK OFİSİ (Aracı) / AGENCY</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${v.storeName} ${v.storePhone ? `(Tel: ${v.storePhone})` : ''}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">MÜŞTERİ / CLIENT</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>${v.clientName}</strong></td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">T.C. / PASAPORT NO</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${v.clientIdentity}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">TELEFON / PHONE</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${v.clientPhone}</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">MÜLK BİLGİSİ / PROPERTY</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${v.propertyTitle} (${v.propertyLocation}) ${v.propertyBlockPlot ? `• Ada/Parsel: ${v.propertyBlockPlot}` : ''}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">MÜLK BEDELİ / PRICE</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #1d4ed8;">${v.propertyPrice}</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">SÖZLEŞME TARİHİ / DATE</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${v.contractDate}</td>
    </tr>
  </table>

  <h3 style="font-size: 14px; font-weight: bold; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-top: 20px;">SÖZLEŞME ŞARTLARI (TR)</h3>
  <ol style="font-size: 12px; color: #334155; padding-left: 20px; text-align: justify; margin-bottom: 25px;">
    <li><strong>Hizmetin Konusu:</strong> Aracı, yukarıda belirtilen gayrimenkulü müşteriye/temsilcisine göstermiş ve yerinde incelemesini sağlamıştır.</li>
    <li><strong>Komisyon Hakkı:</strong> Müşteri, Aracı tarafından kendisine gösterilen bu gayrimenkulü kendisi, eşi, birinci veya ikinci derece akrabaları, doğrudan veya ortağı ya da yöneticisi olduğu şirket adına her ne şekilde olursa olsun satın aldığı veya kiraladığı takdirde, gayrimenkul bedelinin <strong>%${v.commissionRate}</strong> oranında (+ KDV) komisyon ücretini Aracı firmaya ödemeyi kabul ve taahhüt eder.</li>
    <li><strong>Doğrudan Alım Engeli:</strong> Müşteri, bu gayrimenkulün mal sahibi ile doğrudan veya üçüncü şahıslar aracılığıyla iletişime geçerek, Aracı'yı devredışı bırakmak suretiyle alım-satım yapamaz. Aksi takdirde, belirlenen komisyon bedelinin iki katı tutarında cezai şart ödemeyi kabul eder.</li>
    <li><strong>Süre:</strong> Bu sözleşme, imzalandığı tarihten itibaren 12 (Oniki) Ay boyunca geçerlidir.</li>
    <li><strong>Uyuşmazlıkların Çözümü:</strong> Bu sözleşmeden doğacak uyuşmazlıklarda yerel mahkemeler ve icra daireleri yetkilidir.</li>
  </ol>

  <h3 style="font-size: 14px; font-weight: bold; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-top: 20px;">TERMS of AGREEMENT (EN)</h3>
  <ol style="font-size: 11px; color: #475569; padding-left: 20px; text-align: justify; margin-bottom: 30px;">
    <li><strong>Subject of Service:</strong> The Agent has shown the customer/representative the property specified above and provided on-site viewings.</li>
    <li><strong>Commission Fee:</strong> If the Customer, their spouse, first or second-degree relatives, or any company they are directly/indirectly associated with as a partner or manager, purchases or rents this property, the Customer agrees and promises to pay a commission fee of <strong>%${v.commissionRate}</strong> (+ VAT) of the property price to the Agency.</li>
    <li><strong>Bypassing Clause:</strong> The Customer is strictly prohibited from bypassing the Agent to execute a sale directly with the property owner. In case of breach, the Customer agrees to pay twice the normal commission rate as a contractual penalty.</li>
    <li><strong>Validity Period:</strong> This agreement shall remain valid for 12 (Twelve) Months from the date of signing.</li>
    <li><strong>Jurisdiction:</strong> In case of any dispute arising from this agreement, local courts and enforcement offices shall have exclusive jurisdiction.</li>
  </ol>

  <div style="margin-top: 40px; display: flex; justify-content: space-between; gap: 40px;">
    <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 12px; padding: 15px; background-color: #f8fafc; text-align: center; min-height: 180px; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <span style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">EMLAK OFİSİ YETKİLİSİ</span>
        <span style="display: block; font-size: 10px; color: #94a3b8;">AGENCY REPRESENTATIVE</span>
      </div>
      <div style="font-size: 14px; font-weight: bold; color: #475569; font-style: italic; margin: 15px 0;">
        ${v.storeName}
      </div>
      <div style="font-size: 9px; color: #94a3b8;">Kaşe & İmza / Stamp & Signature</div>
    </div>

    <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 12px; padding: 15px; background-color: #f8fafc; text-align: center; min-height: 180px; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <span style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">MÜŞTERİ / ALICI</span>
        <span style="display: block; font-size: 10px; color: #94a3b8;">CUSTOMER / BUYER</span>
      </div>
      <div style="font-size: 14px; font-weight: bold; color: #0284c7; font-family: monospace; letter-spacing: 2px; margin: 15px 0; border: 1px dashed #cbd5e1; padding: 8px; border-radius: 6px;">
        ${v.clientName.toUpperCase()}
      </div>
      <div style="font-size: 9px; color: #94a3b8;">Onaylandı & Dijital İmzalandı / Signed</div>
    </div>
  </div>

  <div style="text-align: center; margin-top: 40px; font-size: 9px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px;">
    Bu belgenin oluşturulmasında Türkiye FTSO ve Kuzey Kıbrıs (KKTC) Taşınmaz Mal Mevzuatı gözetilmiştir. LookPrice CRM Legal System.
  </div>
</div>
`;
      const markdown = `
# YER GÖSTERME SÖZLEŞMESİ (PROPERTY SHOWING AGREEMENT)

**Ofis/Agency:** ${v.storeName}
**Müşteri/Client:** ${v.clientName}
**T.C. / Pasaport No:** ${v.clientIdentity}
**Telefon/Phone:** ${v.clientPhone}
**Tarih/Date:** ${v.contractDate}

---

## 1. MÜLK BİLGİLERİ (PROPERTY DETAILS)
- **Mülk/Property:** ${v.propertyTitle}
- **Lokasyon / Location:** ${v.propertyLocation} ${v.propertyBlockPlot ? `(Ada / Parsel: ${v.propertyBlockPlot})` : ''}
- **Bedel / Price:** ${v.propertyPrice}

---

## 2. ŞARTLAR / TERMS
1. Aracı emlak ofisi, yukarıdaki mülkü müşteriye göstermiştir.
2. Müşteri, bu mülkü kendisi veya yakını adına satın alırsa, Aracı firmaya **%${v.commissionRate}** + KDV komisyon ödemeyi kabul eder.
3. Aracı firmayı devredışı bırakarak mal sahibiyle direkt işlem yapılamaz; aksi halde cezai şart uygulanır.
`;
      return { html, markdown };
    }
  },
  {
    id: "exclusivity_agreement",
    titleTr: "Tek Yetki ve Satış Pazarlama Sözleşmesi",
    titleEn: "Exclusive Real Estate Listing Agreement",
    descriptionTr: "Mülk sahibinin gayrimenkul satış yetkisini tek bir ofise devrettiği sözleşme.",
    descriptionEn: "Exclusive mandate from owner granting sole rights to market and sell property.",
    getTemplate: (v) => {
      const html = `
<div style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1e293b; line-height: 1.6;">
  <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px double #cbd5e1; padding-bottom: 20px;">
    <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">TEK YETKİLİ PAZARLAMA VE SATIŞ SÖZLEŞMESİ</h1>
    <h2 style="font-size: 13px; font-weight: bold; color: #64748b; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em;">EXCLUSIVE LISTING MANDATE</h2>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px;">
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; width: 30%;">YETKİLİ ACENTE / EXCLUSIVE BROKER</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${v.storeName}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">MÜLK SAHİBİ / OWNER</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>${v.clientName}</strong></td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">T.C. / PASAPORT NO</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${v.clientIdentity}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">İLETİŞİM / CONTACT</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${v.clientPhone}</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">PAZARLANACAK MÜLK / PROPERTY</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${v.propertyTitle} (${v.propertyLocation}) ${v.propertyBlockPlot ? `• Ada/Parsel: ${v.propertyBlockPlot}` : ''}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">HEDEF SATIŞ BEDELİ / ASKING PRICE</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #1d4ed8;">${v.propertyPrice}</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">SÖZLEŞME TARİHİ / DATE</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${v.contractDate}</td>
    </tr>
  </table>

  <h3 style="font-size: 14px; font-weight: bold; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-top: 20px;">SÖZLEŞME METNİ / CONTRACT BODY (TR & EN)</h3>
  <div style="font-size: 12px; color: #334155; text-align: justify; margin-bottom: 25px;">
    <p>
      İşbu sözleşme uyarınca, <strong>Mülk Sahibi</strong>, yukarıda detayları verilen taşınmazın satılması, reklam ve tanıtımının yapılması amacıyla tek yetkili kılınmak üzere <strong>${v.storeName}</strong> (Aracı) firmasını atamıştır. 
    </p>
    <p>
      Mülk Sahibi, bu sözleşme süresince başka bir emlak ofisini yetkilendirmeyeceğini, gayrimenkulü kendisi satsa dahi, Aracı'ya satış bedeli üzerinden <strong>%${v.commissionRate}</strong> oranında (+ KDV) komisyon ödemeyi yükümlenir. 
    </p>
    <p style="font-style: italic; color: #475569;">
      Under this exclusive agreement, the <strong>Owner</strong> authorizes <strong>${v.storeName}</strong> (Broker) as the sole agent for marketing and selling the specified property. The Owner agrees that even if the property is sold directly by themselves or through another agent, the Broker is entitled to receive a fee of <strong>%${v.commissionRate}</strong> of the final sale price.
    </p>
    <p>
      <strong>Sözleşme Süresi (Duration):</strong> Bu yetkilendirme belgesi, imza tarihinden itibaren 6 (Altı) ay boyunca geçerlidir.
    </p>
  </div>

  <div style="margin-top: 40px; display: flex; justify-content: space-between; gap: 40px;">
    <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 12px; padding: 15px; background-color: #f8fafc; text-align: center; min-height: 180px; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <span style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">YETKİLİ OFİS CAŞESİ</span>
        <span style="display: block; font-size: 10px; color: #94a3b8;">AGENT STAMP/SIGNATURE</span>
      </div>
      <div style="font-size: 14px; font-weight: bold; color: #475569; font-style: italic;">
        ${v.storeName}
      </div>
      <div style="font-size: 9px; color: #94a3b8;">Yetkili Broker / Advisor</div>
    </div>

    <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 12px; padding: 15px; background-color: #f8fafc; text-align: center; min-height: 180px; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <span style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">MÜLK SAHİBİ</span>
        <span style="display: block; font-size: 10px; color: #94a3b8;">PROPERTY OWNER</span>
      </div>
      <div style="font-size: 14px; font-weight: bold; color: #0284c7; font-family: monospace; letter-spacing: 2px;">
        ${v.clientName.toUpperCase()}
      </div>
      <div style="font-size: 9px; color: #94a3b8;">Onaylandı & Dijital İmzalandı / Authorized</div>
    </div>
  </div>
</div>
`;
      const markdown = `
# TEK YETKİLİ SATIŞ SÖZLEŞMESİ

**Aracı:** ${v.storeName}
**Mülk Sahibi:** ${v.clientName}
**Tarih:** ${v.contractDate}

Mülk Sahibi, yukarıdaki mülkün satışı için Aracı firmaya **%${v.commissionRate}** komisyon bedeliyle tek yetki vermiştir.
Bu sözleşme 6 ay süreyle geçerlidir.
`;
      return { html, markdown };
    }
  },
  {
    id: "sales_brokerage",
    titleTr: "Alım-Satım Aracılık ve Rezervasyon Sözleşmesi",
    titleEn: "Sale, Purchase & Reservation Contract",
    descriptionTr: "Alıcı, Satıcı ve Broker arasında yapılan, kapora (rezervasyon) şartlarını belirleyen üçlü protokol.",
    descriptionEn: "Tripartite agreement between buyer, seller, and agent specifying reservation details.",
    getTemplate: (v) => {
      const html = `
<div style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1e293b; line-height: 1.6;">
  <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px double #cbd5e1; padding-bottom: 20px;">
    <h1 style="font-size: 20px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">ALIM SATIM VE REZERVASYON PROTOKOLÜ</h1>
    <h2 style="font-size: 12px; font-weight: bold; color: #64748b; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em;">RESERVATION & PRE-SALE AGREEMENT</h2>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
    <tr style="background-color: #f8fafc;">
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; width: 30%;">ARACI / AGENCY</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0;">${v.storeName}</td>
    </tr>
    <tr>
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">ALICI (Müşteri) / BUYER</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>${v.clientName}</strong></td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">PASAPORT/TC</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0;">${v.clientIdentity}</td>
    </tr>
    <tr>
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">TELEFON</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0;">${v.clientPhone}</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">TAŞINMAZ / PROPERTY</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0;">${v.propertyTitle} (${v.propertyLocation})</td>
    </tr>
    <tr>
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">TOPLAM SATIŞ BEDELİ</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #1d4ed8;">${v.propertyPrice}</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">KAPORA TUTARI / DEPOSIT</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #e11d48;">5.000 GBP (Veya Karşılığı)</td>
    </tr>
    <tr>
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">ARACILIK ÜCRETİ / FEE</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">%${v.commissionRate} (+ KDV)</td>
    </tr>
  </table>

  <h4 style="font-size: 13px; font-weight: bold; margin: 15px 0 5px 0;">PROTOKOL ŞARTLARI / CONDITIONS</h4>
  <p style="font-size: 11px; color: #475569; text-align: justify; margin: 0 0 10px 0;">
    <strong>TR:</strong> Alıcı, işbu protokolle belirtilen taşınmaz kaparasını ödemiş olup, Aracı emlak ofisi mülkü 15 (Onbeş) gün boyunca satış dondurma statüsünde (rezervasyon) bekletecektir. Bu süre zarfında Alıcı sözleşmeden vazgeçerse kapora iade edilmez. Satıcının kusuru nedeniyle satış gerçekleşmezse kapora iki katı olarak Alıcıya iade edilir.
  </p>
  <p style="font-size: 10px; color: #64748b; text-align: justify; margin: 0 0 20px 0;">
    <strong>EN:</strong> The Buyer has deposited the reservation amount for the property. The Agency will put the property in reserved state for 15 days. If the Buyer defaults, the deposit is non-refundable. If the Sale fails due to Seller's default, the deposit shall be returned in double amount.
  </p>

  <div style="margin-top: 30px; display: flex; justify-content: space-between; gap: 20px; font-size: 11px;">
    <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center; background-color: #f8fafc;">
      <strong>ALICI / BUYER</strong><br/><br/>
      <span style="font-family: monospace; font-size: 12px; color: #0284c7;">${v.clientName}</span><br/><br/>
      İmza / Signature
    </div>
    <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center; background-color: #f8fafc;">
      <strong>ARACI / BROKER</strong><br/><br/>
      <span style="color: #475569; font-style: italic;">${v.storeName}</span><br/><br/>
      İmza / Signature
    </div>
  </div>
</div>
`;
      const markdown = `
# ALIM SATIM VE REZERVASYON SÖZLEŞMESİ
**Alıcı:** ${v.clientName}
**Aracı:** ${v.storeName}
**Mülk:** ${v.propertyTitle}
**Bedel:** ${v.propertyPrice}
**Komisyon:** %${v.commissionRate}
`;
      return { html, markdown };
    }
  },
  {
    id: "inter_branch_split",
    titleTr: "Şubeler Arası Ortak Satış ve Komisyon Split Sözleşmesi",
    titleEn: "Inter-Branch Co-Brokerage & Commission Split",
    descriptionTr: "Farklı şubelerin veya danışmanların portföy ve müşteriyi birleştirerek haklarını güvenceye alma protokolü.",
    descriptionEn: "Protects commission split rights between collaborating branches or agents.",
    getTemplate: (v) => {
      const html = `
<div style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1e293b; line-height: 1.6;">
  <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px double #cbd5e1; padding-bottom: 20px;">
    <h1 style="font-size: 20px; font-weight: 950; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">ŞUBELER ARASI PORTFÖY ORTAK SATIŞ VE KOMİSYON PAYLAŞIM PROTOKOLÜ</h1>
    <h2 style="font-size: 11px; font-weight: bold; color: #64748b; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em;">INTER-BRANCH CO-BROKERAGE & COMMISSION SPLIT PROTOCOL</h2>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
    <tr style="background-color: #f8fafc;">
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; width: 30%;">PORTFÖY SAHİBİ ŞUBE</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0;">${v.storeName} (Portföy Yetkilisi)</td>
    </tr>
    <tr>
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">MÜŞTERİ GETİREN ŞUBE/DANIŞMAN</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>${v.clientName || 'İş Ortağı / Misafir Şube Yetkilisi'}</strong> ${v.clientPhone ? `(Tel: ${v.clientPhone})` : ''}</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">ORTAK İŞLEM TAŞINMAZI</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0;">${v.propertyTitle} (${v.propertyLocation})</td>
    </tr>
    <tr>
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">TOPLAM TAŞINMAZ BEDELİ</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #1d4ed8;">${v.propertyPrice}</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">HEDEF TOPLAM KOMİSYON</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #059669;">%${v.commissionRate || '3'} + KDV</td>
    </tr>
    <tr>
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">PAYLAŞIM (SPLIT) ORANI</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #2563eb;">%50 / %50 (Eşit Bölüşüm)</td>
    </tr>
  </table>

  <h4 style="font-size: 13px; font-weight: bold; margin: 15px 0 5px 0; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">ORTAK PAZARLAMA ŞARTLARI / CO-MARKETING CLAUSES</h4>
  <ol style="font-size: 11px; color: #475569; padding-left: 18px; text-align: justify; margin: 0 0 20px 0; space-y: 2px;">
    <li><strong>Sözleşmenin Amacı:</strong> İşbu protokol, mülkiyeti / tek satma yetkisi birinci şubede bulunan yukarıdaki taşınmazın, ikinci şubenin getireceği alıcı adaya ortaklaşa satılması veya kiralanması durumunda tarafların hak ediş oranlarını belirlemek amacıyla tanzim edilmiştir.</li>
    <li><strong>Komisyon Bölünmesi:</strong> Satışın veya kiralamanın başarıyla tamamlanması ve komisyonun tahsil edilmesi durumunda, elde edilen net hizmet bedeli <strong>%50 (Yüzde Elli)</strong> Portföy Sahibi Şubeye ve <strong>%50 (Yüzde Elli)</strong> Müşteri Getiren Şubeye/Danışmana eşit oranda paylaştırılacaktır.</li>
    <li><strong>Müşteri Gizliliği ve Korunması:</strong> Portföy sahibi taraf, misafir şubenin getirdiği alıcının bilgilerini üçüncü taraflarla paylaşmamayı ve satış sürecinde alıcıyı bypass ederek mal sahibiyle doğrudan işlem yaptırmamayı kabul ve taahhüt eder.</li>
    <li><strong>Geçerlilik Süresi:</strong> Bu protokol imza tarihinden itibaren 6 (Altı) ay süresince belirtilen müşteri adayına yapılan gösterimler için geçerlidir.</li>
  </ol>

  <div style="margin-top: 35px; display: flex; justify-content: space-between; gap: 30px; font-size: 11px;">
    <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; text-align: center; background-color: #f8fafc; display: flex; flex-direction: column; justify-content: space-between; min-height: 140px;">
      <strong>PORTFÖY YETKİLİ ŞUBESİ</strong>
      <span style="color: #475569; font-style: italic; font-weight: bold; display: block; margin: 10px 0;">${v.storeName}</span>
      <div style="font-size: 9px; color: #94a3b8;">Dijital Kaşe & Onay</div>
    </div>
    <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; text-align: center; background-color: #f8fafc; display: flex; flex-direction: column; justify-content: space-between; min-height: 140px;">
      <strong>MÜŞTERİ YETKİLİ ŞUBE / ACENTE</strong>
      <span style="font-family: monospace; font-size: 12px; color: #0284c7; font-weight: bold; display: block; margin: 10px 0;">${v.clientName || '[İş Ortağı Şube]'}</span>
      <div style="font-size: 9px; color: #94a3b8;">Hızlı Dijital İmza Onaylandı</div>
    </div>
  </div>
</div>
`;
      const markdown = `
# ŞUBELER ARASI PORTFÖY PAYLAŞIM VE KOMİSYON ORTAKLIĞI PROTOKOLÜ
**Portföy Sahibi:** ${v.storeName}
**Müşteri Sahibi:** ${v.clientName}
**Mülk:** ${v.propertyTitle}
**Bölüşüm Oranı:** %50 / %50
`;
      return { html, markdown };
    }
  }
];
