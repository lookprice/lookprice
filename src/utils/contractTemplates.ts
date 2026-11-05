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
  propertyAddress?: string;
  splitRatio?: string;
  contractDuration?: string;
  evictionDate?: string;
  depositAmount?: string;
  rentDuration?: string;
  paymentDay?: string;
  isSigned?: boolean;
  signingName?: string;
  signatureImage?: string;
  isFurnishedRental?: boolean;
  fixturePhotosCount?: number;
  fixturePhotos?: {
    id?: string;
    name: string;
    condition?: string;
    timestamp_str?: string;
    url?: string;
  }[];
}

export function renderSignatureOrStamp(clientName: string, isSigned?: boolean, signatureImage?: string): string {
  const cleanName = (clientName || "Müşteri / Alıcı").trim();
  if (isSigned) {
    if (signatureImage) {
      return `
        <div style="text-align: center; margin: 10px auto; max-width: 220px; font-family: sans-serif;">
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff; padding: 5px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); display: inline-block;">
            <img src="${signatureImage}" alt="Signature" style="max-width: 100%; max-height: 55px; display: block; margin: 0 auto; min-height: 40px;" />
          </div>
          <div style="font-size: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: #166534; margin-top: 5px;">
            ✔ DİJİTAL ONAYLI İMZA
          </div>
          <div style="font-size: 10px; font-weight: bold; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 2px;">
            ${cleanName.toUpperCase()}
          </div>
        </div>
      `;
    }
    return `
      <div style="border: 2px dashed #10b981; padding: 10px; border-radius: 8px; background-color: #f0fdf4; color: #15803d; text-align: center; margin: 10px auto; max-width: 220px; font-family: sans-serif;">
        <div style="font-size: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: #166534; border-bottom: 1px solid #bbf7d0; padding-bottom: 3px; margin-bottom: 5px;">
          ✔ DİJİTAL ONAY MÜHRÜ
        </div>
        <div style="font-size: 12px; font-weight: bold; font-family: monospace; color: #14532d; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${cleanName.toUpperCase()}
        </div>
        <div style="font-size: 7px; color: #166534; margin-top: 2px; font-weight: bold;">
          KİMLİK VE IP ONAYLI
        </div>
        <div style="font-size: 7px; color: #15803d; font-style: italic; margin-top: 2px;">
          OFİSTE SEKTÖREL ONAY
        </div>
      </div>
    `;
  }
  return `
    <div style="border: 1.5px dashed #cbd5e1; padding: 14px 10px; border-radius: 8px; background-color: #f8fafc; color: #94a3b8; text-align: center; margin: 10px auto; max-width: 220px; font-family: sans-serif;">
      <div style="font-size: 12px; font-weight: bold; font-family: monospace; color: #64748b; opacity: 0.6; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        ${cleanName.toUpperCase()}
      </div>
      <div style="font-size: 8px; color: #94a3b8; margin-top: 6px; font-style: italic;">
        İmza veya Mobil Onay Bekleniyor
      </div>
    </div>
  `;
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
      <td style="padding: 10px; border: 1px solid #e2e8f0;">
        <strong>${v.propertyTitle}</strong> (${v.propertyLocation}) ${v.propertyBlockPlot ? `• Ada/Parsel: ${v.propertyBlockPlot}` : ''}
        ${v.propertyAddress ? `<div style="margin-top: 4px; font-size: 11px; color: #64748b;"><strong>Mülk Adresi / Property Address:</strong> ${v.propertyAddress}</div>` : ''}
      </td>
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
    <li><strong>Komisyon Hakkı:</strong> Müşteri, Aracı tarafından kendisine gösterilen bu gayrimenkulü kendisi, eşi, birinci veya ikinci derece akrabaları, doğrudan veya ortağı ya da yöneticisi olduğu şirket adına her ne şekilde olursa olsun satın aldığı veya kiraladığı takdirde, gayrimenkul bedelinin <strong>${v.commissionRate}</strong> oranında (+ KDV) komisyon ücretini Aracı firmaya ödemeyi kabul ve taahhüt eder.</li>
    <li><strong>Doğrudan Alım Engeli:</strong> Müşteri, bu gayrimenkulün mal sahibi ile doğrudan veya üçüncü şahıslar aracılığıyla iletişime geçerek, Aracı'yı devredışı bırakmak suretiyle alım-satım yapamaz. Aksi takdirde, belirlenen komisyon bedelinin iki katı tutarında cezai şart ödemeyi kabul eder.</li>
    <li><strong>Süre:</strong> Bu sözleşme, imzalandığı tarihten itibaren 12 (Oniki) Ay boyunca geçerlidir.</li>
    <li><strong>Uyuşmazlıkların Çözümü:</strong> Bu sözleşmeden doğacak uyuşmazlıklarda yerel mahkemeler ve icra daireleri yetkilidir.</li>
  </ol>

  <h3 style="font-size: 14px; font-weight: bold; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-top: 20px;">TERMS of AGREEMENT (EN)</h3>
  <ol style="font-size: 11px; color: #475569; padding-left: 20px; text-align: justify; margin-bottom: 30px;">
    <li><strong>Subject of Service:</strong> The Agent has shown the customer/representative the property specified above and provided on-site viewings.</li>
    <li><strong>Commission Fee:</strong> If the Customer, their spouse, first or second-degree relatives, or any company they are directly/indirectly associated with as a partner or manager, purchases or rents this property, the Customer agrees and promises to pay a commission fee of <strong>${v.commissionRate}</strong> (+ VAT) of the property price to the Agency.</li>
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
        <span style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">MÜŞTERI / ALICI</span>
        <span style="display: block; font-size: 10px; color: #94a3b8;">CUSTOMER / BUYER</span>
      </div>
      ${renderSignatureOrStamp(v.clientName, v.isSigned, v.signatureImage)}
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
${v.propertyAddress ? `- **Adres / Address:** ${v.propertyAddress}\n` : ''}- **Bedel / Price:** ${v.propertyPrice}

---

## 2. ŞARTLAR / TERMS
1. Aracı emlak ofisi, yukarıdaki mülkü müşteriye göstermiştir.
2. Müşteri, bu mülkü kendisi veya yakını adına satın alırsa, Aracı firmaya **${v.commissionRate}** + KDV komisyon ödemeyi kabul eder.
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
      <td style="padding: 10px; border: 1px solid #e2e8f0;">
        <strong>${v.propertyTitle}</strong> (${v.propertyLocation}) ${v.propertyBlockPlot ? `• Ada/Parsel: ${v.propertyBlockPlot}` : ''}
        ${v.propertyAddress ? `<div style="margin-top: 4px; font-size: 11px; color: #64748b;"><strong>Mülk Adresi / Property Address:</strong> ${v.propertyAddress}</div>` : ''}
      </td>
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
      Mülk Sahibi, bu sözleşme süresince başka bir emlak ofisini yetkilendirmeyeceğini, gayrimenkulü kendisi satsa dahi, Aracı'ya satış bedeli üzerinden <strong>${v.commissionRate}</strong> oranında (+ KDV) komisyon ödemeyi yükümlenir. 
    </p>
    <p style="font-style: italic; color: #475569;">
      Under this exclusive agreement, the <strong>Owner</strong> authorizes <strong>${v.storeName}</strong> (Broker) as the sole agent for marketing and selling the specified property. The Owner agrees that even if the property is sold directly by themselves or through another agent, the Broker is entitled to receive a fee of <strong>${v.commissionRate}</strong> of the final sale price.
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
      ${renderSignatureOrStamp(v.clientName, v.isSigned, v.signatureImage)}
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
${v.propertyAddress ? `**Adres / Address:** ${v.propertyAddress}\n` : ''}

Mülk Sahibi, yukarıdaki mülkün satışı için Aracı firmaya **${v.commissionRate}** komisyon bedeliyle tek yetki vermiştir.
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
      <td style="padding: 8px; border: 1px solid #e2e8f0;">
        <strong>${v.propertyTitle}</strong> (${v.propertyLocation})
        ${v.propertyAddress ? `<div style="margin-top: 4px; font-size: 10px; color: #64748b;"><strong>Mülk Adresi / Property Address:</strong> ${v.propertyAddress}</div>` : ''}
      </td>
    </tr>
    <tr>
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">TOPLAM SATIŞ BEDELİ</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #1d4ed8;">${v.propertyPrice}</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">KAPORA TUTARI / DEPOSIT</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #e11d48;">${formatDepositWithWords(v.depositAmount || "5.000 GBP")}</td>
    </tr>
    <tr>
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">ARACILIK ÜCRETİ / FEE</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">${v.commissionRate} (+ KDV)</td>
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
    <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center; background-color: #f8fafc; display: flex; flex-direction: column; justify-content: space-between; min-height: 150px;">
      <strong>ALICI / BUYER</strong>
      ${renderSignatureOrStamp(v.clientName, v.isSigned, v.signatureImage)}
      <div>İmza / Signature</div>
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
**Kapora:** ${formatDepositWithWords(v.depositAmount || "5.000 GBP")}
**Komisyon:** ${v.commissionRate}
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
      const rawRatio = v.splitRatio || "50 / 50";
      const matches = rawRatio.match(/\d+/g);
      let displayRatio = rawRatio;
      let detailedClauseText = `taraflar arasında <strong>${rawRatio}</strong> oranında`;

      if (matches && matches.length >= 2) {
        const p1 = matches[0];
        const p2 = matches[1];
        displayRatio = `%${p1} / %${p2}`;
        detailedClauseText = `<strong>%${p1} (Yüzde ${p1})</strong> Portföy Sahibi Şubeye ve <strong>%${p2} (Yüzde ${p2})</strong> Müşteri Getiren Şubeye/Danışmana`;
      } else {
        if (!displayRatio.includes('%')) {
          displayRatio = `%${displayRatio}`;
        }
      }

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
      <td style="padding: 8px; border: 1px solid #e2e8f0;">
        <strong>${v.propertyTitle}</strong> (${v.propertyLocation})
        ${v.propertyAddress ? `<div style="margin-top: 4px; font-size: 10px; color: #64748b;"><strong>Mülk Adresi / Property Address:</strong> ${v.propertyAddress}</div>` : ''}
      </td>
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
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #2563eb;">${displayRatio}</td>
    </tr>
  </table>

  <h4 style="font-size: 13px; font-weight: bold; margin: 15px 0 5px 0; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">ORTAK PAZARLAMA ŞARTLARI / CO-MARKETING CLAUSES</h4>
  <ol style="font-size: 11px; color: #475569; padding-left: 18px; text-align: justify; margin: 0 0 20px 0; space-y: 2px;">
    <li><strong>Sözleşmenin Amacı:</strong> İşbu protokol, mülkiyeti / tek satma yetkisi birinci şubede bulunan yukarıdaki taşınmazın, ikinci şubenin getireceği alıcı adaya ortaklaşa satılması veya kiralanması durumunda tarafların hak ediş oranlarını belirlemek amacıyla tanzim edilmiştir.</li>
    <li><strong>Komisyon Bölünmesi:</strong> Satışın veya kiralamanın başarıyla tamamlanması ve komisyonun tahsil edilmesi durumunda, elde edilen net hizmet bedeli ${detailedClauseText} oranında paylaştırılacaktır.</li>
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
      <strong>MÜŞTERI YETKİLİ ŞUBE / ACENTE</strong>
      ${renderSignatureOrStamp(v.clientName || '[İş Ortağı Şube]', v.isSigned, v.signatureImage)}
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
**Bölüşüm Oranı:** ${displayRatio}
`;
      return { html, markdown };
    }
  },
  {
    id: "rental_agreement",
    titleTr: "Kira Sözleşmesi (Konut ve Çatılı İşyeri)",
    titleEn: "Rental & Lease Agreement",
    descriptionTr: "Kiracı ve mülk sahibi arasında yapılan standart kira sözleşmesi.",
    descriptionEn: "Standard lease agreement between landlord and tenant.",
    getTemplate: (v) => {
      const rawFixtures = Array.isArray(v.fixturePhotos) ? v.fixturePhotos : [];
      const groupedFixturesMap = new Map<
        string,
        { name: string; condition: string; timestamp: string; urls: string[] }
      >();
      rawFixtures.forEach((fp) => {
        const baseName = (fp.name || "Eşya").replace(/\s*\(#\d+\)\s*$/, "").trim();
        const existing = groupedFixturesMap.get(baseName);
        if (existing) {
          if (fp.url) existing.urls.push(fp.url);
        } else {
          groupedFixturesMap.set(baseName, {
            name: baseName,
            condition: fp.condition || "Sağlam / Çalışır",
            timestamp: fp.timestamp_str || v.contractDate,
            urls: fp.url ? [fp.url] : []
          });
        }
      });
      const groupedFixtures = Array.from(groupedFixturesMap.values());

      const fixtureTableRowsHtml = groupedFixtures
        .map(
          (g, idx) => `
          <tr style="border-bottom: 1px solid #cbd5e1; page-break-inside: avoid;">
            <td style="padding: 5px 8px; font-weight: 800; color: #0f172a; font-size: 11px; text-align: center; width: 32px;">${idx + 1}</td>
            <td style="padding: 5px 8px; font-weight: 800; color: #0f172a; font-size: 11px;">${g.name}</td>
            <td style="padding: 5px 8px; font-weight: 700; color: #0369a1; font-size: 10px; width: 110px;">${g.condition}</td>
            <td style="padding: 5px 8px; font-family: monospace; font-weight: 700; color: #334155; font-size: 10px; width: 115px;">${g.timestamp}</td>
            <td style="padding: 4px 8px;">
              <div style="display: flex; flex-wrap: wrap; gap: 4px; align-items: center;">
                ${g.urls
                  .map(
                    (u) =>
                      `<img src="${u}" alt="${g.name}" style="width: 54px; height: 38px; object-fit: cover; border-radius: 4px; border: 1px solid #94a3b8; background: #0f172a;" />`
                  )
                  .join("")}
              </div>
            </td>
          </tr>
        `
        )
        .join("");

      const html = `
<div style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 32px; color: #0f172a; line-height: 1.55;">
  <div style="text-align: center; margin-bottom: 24px; border-bottom: 3px double #94a3b8; padding-bottom: 16px;">
    <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">KİRA SÖZLEŞMESİ</h1>
    <h2 style="font-size: 13px; font-weight: bold; color: #475569; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em;">LEASE AGREEMENT & FURNISHED INVENTORY PROTOCOL</h2>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
    <tr style="background-color: #f8fafc;">
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: bold; width: 30%;">MÜLK SAHİBİ / LANDLORD</td>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">${v.storeName} (Veya Temsil Ettiği Mal Sahibi)</td>
    </tr>
    <tr>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: bold;">KİRACI / TENANT</td>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1;"><strong>${v.clientName}</strong></td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: bold;">T.C. / PASAPORT NO</td>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">${v.clientIdentity}</td>
    </tr>
    <tr>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: bold;">TELEFON / PHONE</td>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">${v.clientPhone}</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: bold;">KİRALANAN MÜLK / PROPERTY</td>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">
        <strong>${v.propertyTitle}</strong> (${v.propertyLocation})
        ${v.propertyAddress ? `<div style="margin-top: 3px; font-size: 11px; color: #475569;"><strong>Mülk Adresi:</strong> ${v.propertyAddress}</div>` : ''}
      </td>
    </tr>
    <tr>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: bold;">AYLIK KİRA BEDELİ / MONTHLY RENT</td>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #1d4ed8;">${v.propertyPrice}</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: bold;">SÖZLEŞME TARİHİ / DATE</td>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">${v.contractDate}</td>
    </tr>
    <tr>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: bold;">KİRA SÜRESİ / LEASE PERIOD</td>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1;"><strong>${v.rentDuration || "1 Yıl / 1 Year"}</strong></td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: bold;">ÖDEME GÜNÜ / PAYMENT DATE</td>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1;"><strong>${v.paymentDay || "Her ayın en geç 5. günü / By the 5th day of each month"}</strong></td>
    </tr>
    <tr>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: bold;">DEPOZİTO / SECURITY DEPOSIT</td>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #be123c;">${formatDepositWithWords(v.depositAmount || "1 Aylık Kira Bedeli")}</td>
    </tr>
  </table>

  <h3 style="font-size: 13px; font-weight: 900; color: #0f172a; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px; margin-top: 16px;">SÖZLEŞME ŞARTLARI & DEMİRBAŞ KORUMA POLİTİKASI (TR)</h3>
  <ol style="font-size: 11.5px; color: #1e293b; padding-left: 18px; text-align: justify; margin-bottom: 20px;">
    <li><strong>Kira Süresi:</strong> Kira sözleşmesi aksi belirtilmedikçe <strong>${v.rentDuration || "1 (Bir) yıl"}</strong> sürelidir. Süre sonunda taraflar fesih bildiriminde bulunmazsa sözleşme aynı şartlarla uzar.</li>
    <li><strong>Ödeme Günü:</strong> Kira bedeli <strong>${v.paymentDay || "her ayın en geç 5. (Beşinci) günü"}</strong> mülk sahibinin hesabına eksiksiz ödenmelidir.</li>
    <li><strong>Depozito ve Tahliye Eşya Durum Güvencesi (Çıkış Ekspertizi):</strong> Kiracı, mülke ve içerisindeki eşyalara gelebilecek hasarlara teminat olarak <strong>${formatDepositWithWords(v.depositAmount || "1 Aylık Kira Bedeli")}</strong> depozito ödemiştir. Tahliye (çıkış) esnasında mülkteki tüm eşya, mobilya, beyaz eşya ve sayaçlar; işbu sözleşme ekindeki <strong>zaman damgalı ("hukuki delil" mühürlü) giriş fotoğrafları ve eşya listesi</strong> ile birebir karşılaştırılır. Eşyaların teslim alındığı sağlamlıkta ve eksiksiz teslim edilmemesi halinde, onarım veya güncel ikame bedeli doğrudan depozitodan mahsup edilir; depozitoyu aşan zararlar kiracıdan ayrıca tahsil edilir.</li>
    <li><strong>Kullanım Amacı:</strong> Taşınmaz sadece konut/işyeri amacıyla kullanılabilir, alt kiralama veya devir yapılamaz.</li>
    ${v.isFurnishedRental || groupedFixtures.length > 0 ? `<li><strong>Eşya ve Demirbaş Kabul Beyanı:</strong> Kiracı; <em>"Mülk'ü kiralarken içerisinde bulunan Eşya / demirbaşları inceledim, gördüm. Eşyalara ait resimleri de inceledim, gördüm. Onaylıyorum, kabulümdür."</em> beyanını gayrikabili rücu kabul ve taahhüt etmiştir.</li>` : ''}
  </ol>

  ${(v.isFurnishedRental || groupedFixtures.length > 0) ? `
  <div style="margin: 18px 0; border: 1.5px solid #0f172a; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
    <div style="background-color: #0f172a; color: #ffffff; padding: 8px 12px; font-weight: 900; font-size: 11px; text-transform: uppercase; display: flex; align-items: center; justify-content: space-between;">
      <span>EK-1: TESLİM EDİLEN EŞYA LİSTESİ VE MÜHÜRLÜ DELİL FOTOĞRAFLARI</span>
      <span style="background-color: #fbbf24; color: #0f172a; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 900;">${groupedFixtures.length} Kalem Eşya (${rawFixtures.length || v.fixturePhotosCount || 0} Fotoğraf)</span>
    </div>
    ${groupedFixtures.length > 0 ? `
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background-color: #f1f5f9; border-bottom: 1px solid #cbd5e1; font-size: 10px; font-weight: 900; color: #0f172a; text-transform: uppercase;">
          <th style="padding: 5px 8px; text-align: center; width: 32px;">No</th>
          <th style="padding: 5px 8px; text-align: left;">Eşya / Demirbaş Adı</th>
          <th style="padding: 5px 8px; text-align: left; width: 110px;">Nitelik / Durum</th>
          <th style="padding: 5px 8px; text-align: left; width: 115px;">Mühür Zamanı</th>
          <th style="padding: 5px 8px; text-align: left;">Hukuki Delil Fotoğrafları</th>
        </tr>
      </thead>
      <tbody>
        ${fixtureTableRowsHtml}
      </tbody>
    </table>
    ` : `
    <div style="padding: 10px 12px; font-size: 11px; color: #334155;">
      Bu mülk eşyalı olarak kiralanmış olup toplam <strong>${v.fixturePhotosCount || 0} adet</strong> zaman damgalı eşya fotoğrafı sistem arşivinde kayıtlıdır.
    </div>
    `}
  </div>
  ` : ''}

  <div style="margin-top: 28px; display: flex; justify-content: space-between; gap: 30px; page-break-inside: avoid;">
    <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; background-color: #f8fafc; text-align: center; min-height: 130px; display: flex; flex-direction: column; justify-content: space-between;">
      <strong>MÜLK SAHİBİ / YETKİLİ ARACI</strong>
      <div style="font-size: 12px; font-weight: bold; color: #0f172a;">${v.storeName}</div>
      <div style="font-size: 11px; color: #475569;">İmza / Kaşe</div>
    </div>
    <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; background-color: #f8fafc; text-align: center; min-height: 130px; display: flex; flex-direction: column; justify-content: space-between;">
      <strong>KİRACI / TESLİM ALAN (TENANT)</strong>
      ${renderSignatureOrStamp(v.clientName, v.isSigned, v.signatureImage)}
      <div style="font-size: 11px; color: #475569;">Sözleşme & Eşya Listesi Kabul İmzası</div>
    </div>
  </div>
</div>
`;
      const markdown = `
# KİRA SÖZLEŞMESİ (LEASE AGREEMENT)
**Kiracı:** ${v.clientName}
**Mülk:** ${v.propertyTitle}
**Kira Bedeli:** ${v.propertyPrice}
**Tarih:** ${v.contractDate}
${v.isFurnishedRental ? `\n> **EŞYA VE DEMİRBAŞ ONAYI:** "Mülk'ü kiralarken içerisinde bulunan Eşya / demirbaşları inceledim, gördüm. Eşyalara ait resimleri de inceledim, gördüm. Onaylıyorum. kabulümdür."\n` : ''}
`;
      return { html, markdown };
    }
  },
  {
    id: "rental_authorization",
    titleTr: "Kiralama Yetki Belgesi",
    titleEn: "Rental Authorization Mandate",
    descriptionTr: "Mülk sahibinin gayrimenkul kiralama yetkisini emlak ofisine devrettiği yetki belgesi.",
    descriptionEn: "Mandate from owner granting rights to market and rent the property.",
    getTemplate: (v) => {
      const html = `
<div style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1e293b; line-height: 1.6;">
  <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px double #cbd5e1; padding-bottom: 20px;">
    <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">KİRALAMA YETKİ BELGESİ</h1>
    <h2 style="font-size: 13px; font-weight: bold; color: #64748b; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em;">RENTAL AUTHORIZATION MANDATE</h2>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px;">
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; width: 30%;">ARACI OFİS / AGENT</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${v.storeName}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">MÜLK SAHİBİ / OWNER</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>${v.clientName}</strong></td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">MÜLK BİLGİSİ / PROPERTY</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">
        <strong>${v.propertyTitle}</strong> (${v.propertyLocation})
        ${v.propertyAddress ? `<div style="margin-top: 4px; font-size: 11px; color: #64748b;"><strong>Mülk Adresi / Property Address:</strong> ${v.propertyAddress}</div>` : ''}
      </td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">HEDEF KİRA / ASKING RENT</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #1d4ed8;">${v.propertyPrice}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">HİZMET BEDELİ / COMMISSION</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>${v.commissionRate}</strong> (+ KDV)</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">SÖZLEŞME TARİHİ / DATE</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${v.contractDate}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">YETKİ SÜRESİ / DURATION</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>${v.contractDuration || "12 Ay / 12 Months"}</strong></td>
    </tr>
  </table>

  <p style="font-size: 12px; text-align: justify;">
    Mülk Sahibi, yukarıdaki taşınmazın kiralanması için <strong>${v.contractDate}</strong> tarihli yetki belgesi ile <strong>${v.contractDuration || "12 Ay / 12 Months"}</strong> süre boyunca <strong>${v.storeName}</strong> firmasını yetkili kılmıştır. Aracı, mülkün tanıtımını yapacak, kiracı adaylarını bulacak ve sözleşme sürecini yönetecektir. Kiralama gerçekleştiğinde Mülk Sahibi <strong>${v.commissionRate}</strong> tutarında hizmet bedeli ödemeyi kabul eder.
  </p>

  <div style="margin-top: 40px; display: flex; justify-content: space-between; gap: 40px; font-size: 11px;">
    <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; text-align: center; background-color: #f8fafc; display: flex; flex-direction: column; justify-content: space-between; min-height: 140px;">
      <strong>MÜLK SAHİBİ / OWNER</strong>
      ${renderSignatureOrStamp(v.clientName, v.isSigned, v.signatureImage)}
      <div style="font-size: 9px; color: #94a3b8;">İmza / Signature</div>
    </div>
    <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; text-align: center; background-color: #f8fafc; display: flex; flex-direction: column; justify-content: space-between; min-height: 140px;">
      <strong>ARACI OFİS / AGENT</strong>
      <span style="color: #475569; font-style: italic; font-weight: bold; display: block; margin: 10px 0;">${v.storeName}</span>
      <div style="font-size: 9px; color: #94a3b8;">Kaşe & İmza</div>
    </div>
  </div>
</div>
`;
      const markdown = `
# KİRALAMA YETKİ BELGESİ
**Mülk Sahibi:** ${v.clientName}
**Aracı:** ${v.storeName}
**Mülk:** ${v.propertyTitle}
**Hedef Kira:** ${v.propertyPrice}
`;
      return { html, markdown };
    }
  },
  {
    id: "eviction_undertaking",
    titleTr: "Tahliye Taahhütnamesi",
    titleEn: "Eviction Undertaking",
    descriptionTr: "Kiracının mülkü belirli bir tarihte tahliye edeceğine dair resmi taahhüdü.",
    descriptionEn: "Tenant's official undertaking to vacate the property on a specific date.",
    getTemplate: (v) => {
      const html = `
<div style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1e293b; line-height: 1.6;">
  <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px double #cbd5e1; padding-bottom: 20px;">
    <h1 style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">TAHLİYE TAAHHÜTNAMESİ</h1>
    <h2 style="font-size: 14px; font-weight: bold; color: #64748b; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em;">EVICTION UNDERTAKING</h2>
  </div>

  <div style="margin-bottom: 30px; text-align: justify; font-size: 14px;">
    <strong>KİRACI BİLGİLERİ / TENANT INFORMATION:</strong><br/>
    Adı Soyadı / Name: <strong>${v.clientName}</strong><br/>
    T.C. Kimlik / Pasaport No: ${v.clientIdentity}<br/>
    Telefon / Phone: ${v.clientPhone || 'Belirtilmemiş'}<br/>
    Adres / Address: <strong>${v.propertyAddress || `${v.propertyTitle} (${v.propertyLocation})`}</strong>
  </div>

  <div style="margin-bottom: 30px; text-align: justify; font-size: 14px; line-height: 1.8;">
    Halen kiracı olarak kullanmakta olduğum yukarıda adresi belirtilen taşınmazı, hiçbir ihtar ve ihbara gerek kalmadan, kayıtsız ve şartsız olarak <strong>${v.evictionDate || '[Tahliye Tarihi]'}</strong> tarihinde boşaltarak, mülk'ü kiraladığımdan itibaren teslim aldığım eşyaları tam ve eksiksiz, eşyaların teslim alındığı kozmetik durumunda, mal sahibine veya mal sahibinin yetkili kıldığı kişi veya kurumlara teslim edeceğimi, adı geçen tarihte tahliye etmediğim takdirde mülk sahibinin icra yoluna başvurarak yapacağı tüm masrafları ve doğacak zararları ödeyeceğimi şimdiden kabul, beyan ve taahhüt ederim.
  </div>

  <div style="margin-bottom: 40px; text-align: justify; font-size: 12px; font-style: italic; color: #475569;">
    I, the tenant, hereby declare and undertake to vacate the property specified above on <strong>${v.evictionDate || '[Eviction Date]'}</strong> without any further notice, unconditionally, and to return all furnishings and items received upon leasing the property completely, fully, and in the exact cosmetic condition they were received, to the landlord or their authorized representatives/institutions. If I fail to vacate on the specified date, I agree to be responsible for all legal costs and damages incurred by the landlord.
  </div>

  <div style="margin-top: 60px; display: flex; justify-content: flex-end;">
    <div style="text-align: center; border: 1px solid #cbd5e1; padding: 15px; border-radius: 12px; background-color: #f8fafc; min-width: 240px; display: flex; flex-direction: column; justify-content: space-between; min-height: 160px;">
      <span style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">TAAHHÜT EDEN (KİRACI)</span>
      ${renderSignatureOrStamp(v.clientName, v.isSigned, v.signatureImage)}
      <div>
        <div style="font-size: 10px; color: #94a3b8;">İmza / Signature</div>
        <div style="font-size: 9px; color: #94a3b8; margin-top: 4px;">Tarih: ${v.contractDate}</div>
      </div>
    </div>
  </div>
</div>
`;
      const markdown = `
# TAHLİYE TAAHHÜTNAMESİ
**Kiracı:** ${v.clientName}
**Mülk:** ${v.propertyTitle}
**Taahhüt Tarihi:** ${v.contractDate}
`;
      return { html, markdown };
    }
  }
];

export function numberToTurkishWords(num: number): string {
  if (num === 0) return "Sıfır";
  const birler = ["", "Bir", "İki", "Üç", "Dört", "Beş", "Altı", "Yedi", "Sekiz", "Dokuz"];
  const onlar = ["", "On", "Yirmi", "Otuz", "Kırk", "Elli", "Altmış", "Yetmiş", "Seksen", "Doksan"];
  const binler = ["", "Bin", "Milyon", "Milyar", "Trilyon"];

  let words = "";
  let temp = Math.floor(num);
  let step = 0;

  while (temp > 0) {
    const sub = temp % 1000;
    if (sub > 0) {
      let subWords = "";
      const yuzlerDigit = Math.floor(sub / 100);
      const onlarDigit = Math.floor((sub % 100) / 10);
      const birlerDigit = sub % 10;

      if (yuzlerDigit > 0) {
        if (yuzlerDigit === 1) {
          subWords += "Yüz ";
        } else {
          subWords += birler[yuzlerDigit] + " Yüz ";
        }
      }
      if (onlarDigit > 0) {
        subWords += onlar[onlarDigit] + " ";
      }
      if (birlerDigit > 0) {
        if (step === 1 && sub === 1) {
          // just "Bin", not "Bir Bin"
        } else {
          subWords += birler[birlerDigit] + " ";
        }
      }
      
      subWords += binler[step] + " ";
      words = subWords + words;
    }
    temp = Math.floor(temp / 1000);
    step++;
  }

  return words.trim().replace(/\s+/g, " ");
}

export function resolvePropertyRegionLabel(prop: any): string {
  if (!prop) return "KKTC";
  const sec =
    typeof prop.sector_data === "string"
      ? (() => {
          try {
            return JSON.parse(prop.sector_data);
          } catch {
            return {};
          }
        })()
      : prop.sector_data || {};

  const rawRegion = (prop.kktc_region || sec.kktc_region || "").toString().trim();
  const rawSubRegion = (prop.kktc_sub_region || sec.kktc_sub_region || "").toString().trim();
  const rawLocation = (prop.location || sec.location || "").toString().trim();
  const rawAddress = (prop.address || sec.address || "").toString().trim();
  const rawTitle = (prop.title || "").toString().trim();

  const norm = (s: string) =>
    s
      .toLocaleLowerCase("tr-TR")
      .replace(/ı/g, "i")
      .replace(/ş/g, "s")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c");

  const combinedText = norm(`${rawTitle} ${rawAddress} ${rawSubRegion} ${rawLocation}`);

  let inferredRegion = "";
  if (
    combinedText.includes("lefkosa") ||
    combinedText.includes("kaymakli") ||
    combinedText.includes("gonyeli") ||
    combinedText.includes("ortakoy") ||
    combinedText.includes("dereboyu") ||
    combinedText.includes("yenikent") ||
    combinedText.includes("hamitkoy") ||
    combinedText.includes("kizilbas") ||
    combinedText.includes("taskinkoy") ||
    combinedText.includes("metehan") ||
    combinedText.includes("alaykoy") ||
    combinedText.includes("haspolat")
  ) {
    inferredRegion = "Lefkoşa";
  } else if (
    combinedText.includes("gazimagusa") ||
    combinedText.includes("magusa") ||
    combinedText.includes("sakarya") ||
    combinedText.includes("yenibogazici") ||
    combinedText.includes("tatlisu")
  ) {
    inferredRegion = "Gazimağusa";
  } else if (
    combinedText.includes("iskele") ||
    combinedText.includes("long beach") ||
    combinedText.includes("bafra") ||
    combinedText.includes("bogaz")
  ) {
    inferredRegion = "İskele";
  } else if (combinedText.includes("guzelyurt")) {
    inferredRegion = "Güzelyurt";
  } else if (
    combinedText.includes("lefke") ||
    combinedText.includes("gemikonagi") ||
    combinedText.includes("yedidalga")
  ) {
    inferredRegion = "Lefke";
  } else if (
    combinedText.includes("girne") ||
    combinedText.includes("alsancak") ||
    combinedText.includes("lapta") ||
    combinedText.includes("catalkoy") ||
    combinedText.includes("ozankoy") ||
    combinedText.includes("bellapais") ||
    combinedText.includes("karaoglanoglu") ||
    combinedText.includes("edremit") ||
    combinedText.includes("zeytinlik") ||
    combinedText.includes("karsiyaka") ||
    combinedText.includes("esentepe") ||
    combinedText.includes("bahceli")
  ) {
    inferredRegion = "Girne";
  }

  let finalRegion = rawRegion;
  if (inferredRegion && (!finalRegion || (norm(finalRegion) === "girne" && inferredRegion !== "Girne"))) {
    finalRegion = inferredRegion;
  }

  if (finalRegion && rawSubRegion) {
    return `${finalRegion} / ${rawSubRegion}`;
  }
  if (finalRegion) {
    return finalRegion;
  }
  if (rawLocation) {
    return rawLocation;
  }
  return "KKTC";
}

export function formatDepositWithWords(depositStr: string, defaultCurrency?: string): string {
  if (!depositStr) return "1 Aylık Kira Bedeli";
  const trimmed = depositStr.trim();
  if (trimmed.includes("(") && trimmed.includes(")")) {
    return trimmed;
  }
  const upperStr = trimmed.toLocaleUpperCase("tr-TR");
  if (
    upperStr.includes("AYLIK") ||
    upperStr.includes("KİRA") ||
    upperStr.includes("KIRA") ||
    upperStr.includes("MAAŞ") ||
    upperStr.includes("BEDEL")
  ) {
    return trimmed;
  }
  const cleanStr = trimmed.replace(/\./g, "").replace(/,/g, "");
  const match = cleanStr.match(/\d+/);
  if (match) {
    const num = parseInt(match[0], 10);
    if (!isNaN(num) && num > 0) {
      const words = numberToTurkishWords(num);
      let currency = "Sterlin";
      const fallbackCurr = (defaultCurrency || "").toUpperCase();
      if (upperStr.includes("GBP") || upperStr.includes("£") || upperStr.includes("STERLİN") || upperStr.includes("STERLIN")) {
        currency = "Sterlin";
      } else if (upperStr.includes("EUR") || upperStr.includes("€") || upperStr.includes("AVRO")) {
        currency = "Euro";
      } else if (upperStr.includes("USD") || upperStr.includes("$") || upperStr.includes("DOLAR")) {
        currency = "Dolar";
      } else if (
        upperStr.includes("TRY") ||
        upperStr.includes("TL") ||
        upperStr.includes("₺") ||
        upperStr.includes("TÜRK LİRASI") ||
        upperStr.includes("TURK LIRASI")
      ) {
        currency = "Türk Lirası";
      } else if (fallbackCurr === "TRY" || fallbackCurr === "TL") {
        currency = "Türk Lirası";
      } else if (fallbackCurr === "EUR") {
        currency = "Euro";
      } else if (fallbackCurr === "USD") {
        currency = "Dolar";
      }
      return `${trimmed} (${words} ${currency})`;
    }
  }
  return trimmed;
}


