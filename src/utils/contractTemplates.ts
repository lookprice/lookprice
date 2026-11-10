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
  partnerName?: string;
  partnerRole?: string;
  commissionPercentage?: string;
  estimatedPayout?: string;
  calculationType?: string;
  ownerName?: string;
  offerPropertyDetails?: string;
  offerPropertyNature?: string;
  viewingDate?: string;
  agentAndCompany?: string;
  offerPrice?: string;
  offerValidityPeriod?: string;
  offerFreeNotes?: string;
  customClauses?: string;
  authorizedPersonName?: string;
  authorizedPersonIdentity?: string;
  authorizedPersonIdType?: string;
  consultantIdType?: string;
  officeSplitRate?: string;
  consultantSplitRate?: string;
  externalOfficeSplitRate?: string;
  externalInternalOfficeRate?: string;
  externalInternalConsultantRate?: string;
  noticePeriodDays?: string;
  sellerIdentity?: string;
  sellerIdType?: string;
  buyerIdType?: string;
  ownerPhone?: string;
  sellerSigned?: boolean;
  sellerSigningName?: string;
  sellerSignatureImage?: string;
  contractStage?: string;
  kocanNo?: string;
  paftaNo?: string;
  adaNo?: string;
  parselNo?: string;
  apartmentUnitInfo?: string;
  salePropertyDetails?: string;
  salePriceRaw?: string | number;
  saleCurrency?: string;
  depositDate?: string;
  remainingAmountRaw?: string;
  deedTransferDate?: string;
  paymentDeadlineMonths?: string;
  gracePeriodDays?: string;
  taxClauseText?: string;
  witness1Name?: string;
  witness1Identity?: string;
  witness2Name?: string;
  witness2Identity?: string;
  // Rental Agreement (KİRA SÖZLEŞMESİ) fields
  rentalPropertyDef?: string;
  rentalUsagePurpose?: string;
  rentalDistrict?: string;
  rentalTownVillage?: string;
  rentPriceRaw?: string | number;
  rentCurrency?: string;
  rentPaymentMethod?: string;
  rentStartDate?: string;
  rentEndDate?: string;
  fixturePhotos?: {
    id?: string;
    name: string;
    condition?: string;
    timestamp_str?: string;
    url?: string;
  }[];
  // Property Showing Agreement (YER GÖSTERME SÖZLEŞMESİ) fields
  brokerAddress?: string;
  clientAddress?: string;
  showingItem1Details?: string;
  showingItem1Price?: string;
  showingItem2Details?: string;
  showingItem2Price?: string;
  // Owner Authorization (KİRALIKLARDA YETKİ BELGESİ & TEK YETKİ) fields
  authPropertyTypeFeatures?: string;
  authAdvancePayment?: string;
  authAnnualIncreaseRate?: string;
  authTenantCriteria?: string;
  authCopiesCount?: string;
  exclusivityIntent?: "rent" | "sale" | string;
  authPropertyCategory?: string;
  authPropertyCategoryOther?: string;
  authServiceFeePayer?: string;
  authServiceFeeReceiver?: string;
  authShowingDayType?: string;
  authShowingHours?: string;
  authDurationDays?: string;
  // Rental Deposit / Kapora Agreement (KAPORA SÖZLEŞMESİ) fields
  kaporaTenant2Info?: string;
  kaporaTenant3Info?: string;
  kaporaTotalRentAmount?: string;
  kaporaDuesAmount?: string;
  kaporaCommissionAmount?: string;
  kaporaPaidAmount?: string;
  kaporaRemainingBalance?: string;
  kaporaBalanceDueDate?: string;
  // Sales Deposit / Kapora & Escrow Agreements fields
  salesDepositPaidAmount?: string;
  salesDepositRemainingAmount?: string;
  salesPaymentTerms?: string;
  reservationDays?: string;
  escrowDeadlineDays?: string;
  // Commission Receipt (KOMİSYON ALIM BELGESİ) fields
  commissionAmountWords?: string;
  commissionPaymentMethod?: string;
  commissionInvoiceNote?: string;
  commissionBrokerTitle?: string;
  commissionPayerName?: string;
  commissionPayerIdentity?: string;
  commissionPayerPhone?: string;
  commissionPayerRole?: string;
  commissionReceiptNo?: string;
}

export function parseCustomClauseLines(customClauses?: string): string[] {
  if (!customClauses || !customClauses.trim()) return [];
  return customClauses
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^(\d+[\.\-\)]\s*|[\-\•\*]\s*)/, "").trim())
    .filter(Boolean);
}

export function renderCustomClausesHtml(customClauses?: string): string {
  const lines = parseCustomClauseLines(customClauses);
  if (lines.length === 0) return "";
  const listItems = lines
    .map((line) => `<li style="margin-bottom: 4px;">${line}</li>`)
    .join("");
  return `
  <div style="margin: 20px 0; padding: 14px 16px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #334155; border-radius: 6px; page-break-inside: avoid;">
    <h4 style="font-size: 12px; font-weight: 900; color: #0f172a; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.04em;">ÖZEL ŞARTLAR / EK MADDELER</h4>
    <ol style="font-size: 12px; color: #1e293b; margin: 0; padding-left: 18px; text-align: justify; line-height: 1.6;">
      ${listItems}
    </ol>
  </div>
  `;
}

export function renderCustomClausesMarkdown(customClauses?: string): string {
  const lines = parseCustomClauseLines(customClauses);
  if (lines.length === 0) return "";
  return `\n## ÖZEL ŞARTLAR / EK MADDELER\n${lines.map((l, i) => `${i + 1}. ${l}`).join("\n")}\n`;
}

export function renderSignatureOrStamp(
  clientName: string,
  isSigned?: boolean,
  signatureImage?: string,
  waitingLabel?: string
): string {
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
        ${waitingLabel || "İmza veya Mobil Onay Bekleniyor"}
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
    titleTr: "Yer Gösterme Sözleşmesi",
    titleEn: "Property Showing Agreement",
    descriptionTr: "Müşteriye gösterilen satılık/kiralık taşınmazlar için KKTC resmi yer gösterme sözleşmesi.",
    descriptionEn: "Official KKTC property showing agreement for both sale and rental properties.",
    getTemplate: (v) => {
      const rawBrokerTitle = (v.agentAndCompany || v.storeName || "").trim();
      const brokerTitle =
        !rawBrokerTitle ||
        rawBrokerTitle.toLowerCase().includes("seçkin") ||
        rawBrokerTitle.toLowerCase().includes("premium vip")
          ? "Rodel investment EMRAH CEYHAN"
          : rawBrokerTitle;
      const brokerIdentity = (v.authorizedPersonIdentity || "1170237140").trim();
      const brokerAddr = (
        v.brokerAddress || "Atatürk Caddesi No: 81/A Küçük Kaymaklı / Lefkoşa"
      ).trim();
      const rawBrokerPhone = (v.storePhone || "").trim();
      const brokerPhone =
        !rawBrokerPhone || rawBrokerPhone.includes("5XX")
          ? "0 542 865 5000"
          : rawBrokerPhone;

      const cleanClientName =
        v.clientName && !v.clientName.startsWith("[")
          ? v.clientName.trim()
          : "....................................................................................";
      const cleanClientIdentity =
        v.clientIdentity && !v.clientIdentity.startsWith("[")
          ? v.clientIdentity.trim()
          : "..................................................";
      const cleanClientAddress =
        v.clientAddress && v.clientAddress.trim()
          ? v.clientAddress.trim()
          : "..........................................................................................................................................";
      const cleanClientPhone =
        v.clientPhone && !v.clientPhone.startsWith("[")
          ? v.clientPhone.trim()
          : "..........................................................................................................................................";

      const rawComm = (v.commissionRate || "").trim();
      const isNumericOrPercent = /^%?\s*\d+([.,]\d+)?\s*%?$/.test(rawComm);
      const saleCommText = isNumericOrPercent
        ? rawComm.startsWith("%")
          ? rawComm
          : `%${rawComm.replace(/%/g, "").trim()}`
        : "%5";
      const rentCommText =
        !isNumericOrPercent && rawComm
          ? rawComm
          : "1 aylık kira bedeli";

      const defaultItem1Details = (
        v.showingItem1Details ||
        v.propertyTitle ||
        [v.propertyLocation, v.propertyAddress, v.propertyBlockPlot ? `Ada/Parsel: ${v.propertyBlockPlot}` : ""].filter(Boolean).join(" • ")
      ).trim();

      const item1Details = (v.showingItem1Details || defaultItem1Details).trim();
      const item1Price = (v.showingItem1Price || v.propertyPrice || "").trim();
      const item2Details = (v.showingItem2Details || "").trim();
      const item2Price = (v.showingItem2Price || "").trim();

      const renderTableMiniSignature = (hasRowContent: boolean) => {
        if (!hasRowContent) return "";
        if (v.isSigned) {
          if (v.signatureImage) {
            return `
              <div style="text-align: center;">
                <img src="${v.signatureImage}" alt="İmza" style="max-height: 34px; max-width: 110px; margin: 0 auto; display: block;" />
                <span style="font-size: 8px; font-weight: 900; color: #166534;">✔ İMZALANDI</span>
              </div>
            `;
          }
          return `<span style="font-size: 9px; font-weight: 900; color: #166534;">✔ DİJİTAL ONAYLI</span>`;
        }
        return `<span style="font-size: 9px; color: #94a3b8; font-style: italic;">İmza</span>`;
      };

      const html = `
<div style="font-family: 'Times New Roman', Times, serif; max-width: 820px; margin: 0 auto; padding: 32px 36px; color: #0f172a; line-height: 1.55; background-color: #ffffff; border: 1px solid #cbd5e1;">
  <div style="text-align: center; margin-bottom: 18px; border-bottom: 2px solid #0f172a; padding-bottom: 10px;">
    <h1 style="font-size: 20px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.04em;">YER GÖSTERME SÖZLEŞMESİ</h1>
  </div>

  <div style="margin-bottom: 14px; font-size: 13px;">
    <div style="font-weight: 900; font-size: 13.5px; text-transform: uppercase; margin-bottom: 6px; text-decoration: underline;">1- TARAFLAR</div>
    
    <div style="padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 6px; background-color: #f8fafc; margin-bottom: 10px;">
      <div style="font-weight: 900; color: #0f172a; margin-bottom: 3px;">Emlak Komisyoncusu</div>
      <div><strong>Adı, Soyadı — Ünvanı :</strong> ${brokerTitle}</div>
      <div><strong>KKTC Kimlik No:</strong> ${brokerIdentity}</div>
      <div><strong>Adres:</strong> ${brokerAddr}</div>
      <div><strong>Telefon:</strong> ${brokerPhone}</div>
      <div style="font-style: italic; margin-top: 2px;">( Bundan böyle <strong>Emlak Komisyoncusu</strong> olarak anılacaktır.)</div>
    </div>

    <div style="padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 6px; background-color: #ffffff;">
      <div style="font-weight: 900; color: #0f172a; margin-bottom: 4px;">Alıcı / Kiracı Adayı</div>
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
        <div style="flex: 1; min-width: 240px;"><strong>Adı, Soyadı-Ünvanı :</strong> ${cleanClientName}</div>
        <div><strong>K / P / MŞ NO:</strong> ${cleanClientIdentity}</div>
      </div>
      <div style="margin-bottom: 4px;"><strong>Adresi :</strong> ${cleanClientAddress}</div>
      <div style="margin-bottom: 4px;"><strong>Telefonu :</strong> ${cleanClientPhone}</div>
      <div style="font-style: italic;">Bundan sonra <strong>"Müşteri"</strong> olarak anılacaktır.</div>
    </div>
  </div>

  <div style="margin-bottom: 12px; font-size: 13px; text-align: justify;">
    <div style="font-weight: 900; font-size: 13.5px; text-transform: uppercase; margin-bottom: 4px; text-decoration: underline;">SÖZLEŞMENİN KONUSU:</div>
    <p style="margin: 0;">
      Müşterinin Emlak Komisyoncusunun; bulup müşteriye gösterdiği, aşağıda adresleri yazılı taşınmazlara ilişkin olarak, sadece emlak komisyoncusu ile satın alma ve/veya kiralama için çalışılması.
    </p>
  </div>

  <div style="margin-bottom: 16px; font-size: 12.5px; text-align: justify;">
    <div style="font-weight: 900; font-size: 13.5px; text-transform: uppercase; margin-bottom: 6px; text-decoration: underline;">SÖZLEŞMENİN ŞARTLARI:</div>
    <p style="margin: 0 0 7px 0;">
      <strong>A-</strong> Emlak komisyoncusu tarafından kendisine gösterilen, aşağıdaki adres ve/veya adresleri karşısında müşterinin imzalarının bulunduğu taşınmazların, işbu sözleşmenin imzalanmasından itibaren 1 yıl içinde; her ne suretle olursa olsun müşteri adına ve üçüncü dereceye kadar akrabalarının adına ve paydaşı olduğu veya temsil ettiği şirket ve kuruluşlar adına veya sair ilişkiler içinde bulunduğu kurum, eş, dost, akraba gibi üçüncü şahıslar adına Satın Alınması/Kiraya Tutulması halinde ; aşağıda taşınmazların adresleri karşısında belirtilen ortalama bedel üzerinden satışlarda <strong>${saleCommText}</strong> Kiralıklarda <strong>${rentCommText}</strong> olan tutarı "Emlak Komisyonculuğu" ücreti ödemeyi kabul ve taahhüt eder.
    </p>
    <p style="margin: 0 0 7px 0;">
      <strong>B-</strong> (A) fıkrasında belirtilen şartların, Emlak Komisyoncusu devre dışı bırakılmak suretiyle gerçekleşmesi halinde müşteri; kendisine ve taşınmaz mal sahibine ait komisyon ücretinin tamamını ödemekle yükümlüdür. Şayet müşteri "Emlak Komisyoncusunun sözleşme süresi içinde görevini yerine getirmediği veya taşınmaz sahibi ile irtibata geçip anlaşma zemini sağlayamadığı" iddiasını ileri sürecek olursa bu iddiasını, yazılı delil veya noterden çektiği ihtarnamelerle ispatlamak zorundadır.
    </p>
    <p style="margin: 0 0 7px 0;">
      <strong>C-</strong> Emlak Komisyoncusunun işbu sözleşmeden doğacak alacaklarının zamanında ödenmemesi halinde aylık %10 temerrüt faizi uygulanır.
    </p>
    <p style="margin: 0 0 7px 0;">
      <strong>D-</strong> İşbu sözleşme, A maddesinde sayılan kişi ve kurumlarca taşınmaz Satın Alınmadığı/Kiralanmadığı takdirde geçersizdir.
    </p>
    <p style="margin: 0 0 7px 0;">
      <strong>E-</strong> İşbu sözleşmeden doğacak uyuşmazlıkların çözümünde, KKTC Mahkemeleri ve İcra Daireleri yetkilidir.
    </p>
    <p style="margin: 0;">
      <strong>F-</strong> İşbu sözleşme 1 nüsha düzenlenmiş olup; taraflarca birer nüshası tevdi edilmiştir. <strong>${v.contractDate || "..../..../202..."}</strong>
    </p>
  </div>

  ${renderCustomClausesHtml(v.customClauses)}

  <div style="margin-top: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; gap: 28px; page-break-inside: avoid;">
    <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; background-color: #f8fafc; text-align: center; min-height: 150px; display: flex; flex-direction: column; justify-content: space-between;">
      <div style="font-size: 12px; font-weight: 900; color: #0f172a; text-transform: uppercase;">MÜŞTERİ</div>
      ${renderSignatureOrStamp(v.clientName, v.isSigned, v.signatureImage, "Müşteri İmzası Bekleniyor")}
      <div style="font-size: 10px; color: #475569; font-weight: bold;">${v.clientName && !v.clientName.startsWith("[") ? v.clientName : "Alıcı / Kiracı Adayı"}</div>
    </div>

    <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; background-color: #f8fafc; text-align: center; min-height: 150px; display: flex; flex-direction: column; justify-content: space-between;">
      <div style="font-size: 12px; font-weight: 900; color: #0f172a; text-transform: uppercase;">EMLAK KOMİSYONCUSU</div>
      <div style="font-size: 13px; font-weight: 900; color: #0f172a; margin: 16px 0;">
        ${brokerTitle}
      </div>
      <div style="font-size: 10px; color: #475569; font-weight: bold;">Kaşe & İmza</div>
    </div>
  </div>

  <div style="margin-top: 14px; page-break-inside: avoid;">
    <div style="font-weight: 900; font-size: 13px; color: #0f172a; margin-bottom: 6px;">
      Emlak Komisyoncusu Tarafından Müşteriye Gösterilen Yerler (Gayrimenkuller):
    </div>
    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
      <thead>
        <tr style="background-color: #f1f5f9;">
          <th style="border: 1px solid #0f172a; padding: 7px 8px; width: 48px; text-align: center; font-weight: 900;">Sıra</th>
          <th style="border: 1px solid #0f172a; padding: 7px 8px; text-align: left; font-weight: 900;">Gayrimenkul Adres ve bilgiler</th>
          <th style="border: 1px solid #0f172a; padding: 7px 8px; width: 135px; text-align: center; font-weight: 900;">Ortalama Değeri</th>
          <th style="border: 1px solid #0f172a; padding: 7px 8px; width: 95px; text-align: center; font-weight: 900;">Tarih</th>
          <th style="border: 1px solid #0f172a; padding: 7px 8px; width: 120px; text-align: center; font-weight: 900;">İmza</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border: 1px solid #0f172a; padding: 10px 8px; text-align: center; font-weight: 900;">1-</td>
          <td style="border: 1px solid #0f172a; padding: 10px 8px; font-weight: bold;">${item1Details}</td>
          <td style="border: 1px solid #0f172a; padding: 10px 8px; text-align: center; font-weight: 900;">${item1Price}</td>
          <td style="border: 1px solid #0f172a; padding: 10px 8px; text-align: center;">${v.contractDate || ""}</td>
          <td style="border: 1px solid #0f172a; padding: 8px; text-align: center;">${renderTableMiniSignature(true)}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #0f172a; padding: 12px 8px; text-align: center; font-weight: 900;">2-</td>
          <td style="border: 1px solid #0f172a; padding: 12px 8px; font-weight: bold;">${item2Details}</td>
          <td style="border: 1px solid #0f172a; padding: 12px 8px; text-align: center; font-weight: 900;">${item2Price}</td>
          <td style="border: 1px solid #0f172a; padding: 12px 8px; text-align: center;">${item2Details ? (v.contractDate || "") : ""}</td>
          <td style="border: 1px solid #0f172a; padding: 8px; text-align: center;">${renderTableMiniSignature(Boolean(item2Details))}</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
`;
      const markdown = `
# YER GÖSTERME SÖZLEŞMESİ

## 1- TARAFLAR
**Emlak Komisyoncusu**
- **Adı, Soyadı — Ünvanı :** ${brokerTitle}
- **KKTC Kimlik No:** ${brokerIdentity}
- **Adres:** ${brokerAddr}
- **Telefon:** ${brokerPhone}
(Bundan böyle Emlak Komisyoncusu olarak anılacaktır.)

**Alıcı / Kiracı Adayı**
- **Adı, Soyadı-Ünvanı :** ${cleanClientName}
- **K / P / MŞ NO:** ${cleanClientIdentity}
- **Adresi :** ${cleanClientAddress}
- **Telefonu :** ${cleanClientPhone}
Bundan sonra "Müşteri" olarak anılacaktır.

## SÖZLEŞMENİN KONUSU:
Müşterinin Emlak Komisyoncusunun; bulup müşteriye gösterdiği, aşağıda adresleri yazılı taşınmazlara ilişkin olarak, sadece emlak komisyoncusu ile satın alma ve/veya kiralama için çalışılması.

## SÖZLEŞMENİN ŞARTLARI:
A- Emlak komisyoncusu tarafından kendisine gösterilen, aşağıdaki adres ve/veya adresleri karşısında müşterinin imzalarının bulunduğu taşınmazların, işbu sözleşmenin imzalanmasından itibaren 1 yıl içinde; her ne suretle olursa olsun müşteri adına ve üçüncü dereceye kadar akrabalarının adına ve paydaşı olduğu veya temsil ettiği şirket ve kuruluşlar adına veya sair ilişkiler içinde bulunduğu kurum, eş, dost, akraba gibi üçüncü şahıslar adına Satın Alınması/Kiraya Tutulması halinde ; aşağıda taşınmazların adresleri karşısında belirtilen ortalama bedel üzerinden satışlarda ${saleCommText} Kiralıklarda ${rentCommText} olan tutarı "Emlak Komisyonculuğu" ücreti ödemeyi kabul ve taahhüt eder.
B- (A) fıkrasında belirtilen şartların, Emlak Komisyoncusu devre dışı bırakılmak suretiyle gerçekleşmesi halinde müşteri; kendisine ve taşınmaz mal sahibine ait komisyon ücretinin tamamını ödemekle yükümlüdür. Şayet müşteri "Emlak Komisyoncusunun sözleşme süresi içinde görevini yerine getirmediği veya taşınmaz sahibi ile irtibata geçip anlaşma zemini sağlayamadığı" iddiasını ileri sürecek olursa bu iddiasını, yazılı delil veya noterden çektiği ihtarnamelerle ispatlamak zorundadır.
C- Emlak Komisyoncusunun işbu sözleşmeden doğacak alacaklarının zamanında ödenmemesi halinde aylık %10 temerrüt faizi uygulanır.
D- İşbu sözleşme, A maddesinde sayılan kişi ve kurumlarca taşınmaz Satın Alınmadığı/Kiralanmadığı takdirde geçersizdir.
E- İşbu sözleşmeden doğacak uyuşmazlıkların çözümünde, KKTC Mahkemeleri ve İcra Daireleri yetkilidir.
F- İşbu sözleşme 1 nüsha düzenlenmiş olup; taraflarca birer nüshası tevdi edilmiştir. ${v.contractDate}
${renderCustomClausesMarkdown(v.customClauses)}

## Emlak Komisyoncusu Tarafından Müşteriye Gösterilen Yerler (Gayrimenkuller):
1- ${item1Details} | Ortalama Değeri: ${item1Price} | Tarih: ${v.contractDate}
${item2Details ? `2- ${item2Details} | Ortalama Değeri: ${item2Price} | Tarih: ${v.contractDate}` : "2-"}
`;
      return { html, markdown };
    }
  },
  {
    id: "exclusivity_agreement",
    titleTr: "Tek Yetki Kiralama Sözleşmesi",
    titleEn: "Exclusive Rental Mandate",
    descriptionTr: "Mülk sahibinin gayrimenkul kiralama yetkisini tek bir ofise devrettiği resmi sözleşme.",
    descriptionEn: "Exclusive mandate from owner granting sole rights to market and rent property.",
    getTemplate: (v) => {
      const rawDate = (v.contractDate || new Date().toLocaleDateString("tr-TR")).trim();
      const slashDate = rawDate.replace(/\./g, "/");

      const ownerFullName = (
        v.clientName && !v.clientName.startsWith("[")
          ? v.clientName
          : v.ownerName || "Mülk Sahibi"
      ).trim();
      const ownerIdStr = (
        v.clientIdentity && !v.clientIdentity.startsWith("[")
          ? v.clientIdentity
          : v.sellerIdentity || ""
      ).trim();
      const ownerAddrStr = (v.clientAddress || "").trim();
      const ownerPhoneStr = (
        v.clientPhone && !v.clientPhone.startsWith("[")
          ? v.clientPhone
          : v.ownerPhone || ""
      ).trim();

      const rawBrokerTitle = (
        v.sellerSigningName ||
        (v.ownerName && v.ownerName !== ownerFullName ? v.ownerName : "") ||
        v.agentAndCompany ||
        v.storeName ||
        ""
      ).trim();
      const brokerTitle =
        !rawBrokerTitle ||
        rawBrokerTitle.toLowerCase().includes("seçkin") ||
        rawBrokerTitle.toLowerCase().includes("premium vip")
          ? "Rodel investment EMRAH CEYHAN"
          : rawBrokerTitle;

      const brokerIdentity = (
        v.authorizedPersonIdentity ||
        (v.sellerIdentity && !v.sellerIdentity.startsWith("[") ? v.sellerIdentity : "") ||
        "1170237140"
      ).trim();
      const brokerAddr = (
        v.brokerAddress || "Atatürk Caddesi No: 81/A Küçük Kaymaklı / Lefkoşa"
      ).trim();
      const rawBrokerPhone = (v.ownerPhone || v.storePhone || "").trim();
      const brokerPhone =
        !rawBrokerPhone || rawBrokerPhone.includes("5XX")
          ? "0 542 865 5000"
          : rawBrokerPhone;

      // KİRALIK PORTFÖY TEK YETKİ SÖZLEŞMESİ: "KİRALIK GAYRİMENKUL TEK YETKİLİ KİRALAMA SÖZLEŞMESİ"
      if (v.exclusivityIntent === "rent") {
        const rawPropAddr = [
          v.propertyAddress && v.propertyAddress !== "Belirtilmemiş adres" ? v.propertyAddress.trim() : "",
          v.propertyLocation && (!v.propertyAddress || !v.propertyAddress.includes(v.propertyLocation)) ? v.propertyLocation.trim() : "",
          v.kocanNo ? `Koçan No: ${v.kocanNo}` : "",
          v.adaNo ? `Ada/Blok: ${v.adaNo}` : "",
          v.parselNo ? `Parsel: ${v.parselNo}` : v.propertyBlockPlot ? `Parsel: ${v.propertyBlockPlot}` : ""
        ]
          .filter(Boolean)
          .join(" • ");

        const propAddrDisplay =
          rawPropAddr ||
          "......................................................................................................................................";

        const selectedCat = (v.authPropertyCategory || "APT.DAİRESİ").toUpperCase().trim();
        const catOtherText = (v.authPropertyCategoryOther || "").trim();
        const renderCatBox = (catCode: string, label: string) => {
          const isChecked = selectedCat === catCode;
          return `<span style="display: inline-flex; align-items: center; gap: 4px; margin-right: 12px; font-weight: ${isChecked ? "900" : "bold"}; color: ${isChecked ? "#0f172a" : "#334155"};">
            <span>${label}</span>
            <span style="display: inline-block; min-width: 22px; text-align: center; border-bottom: 1.5px solid #0f172a; font-weight: 900; color: #0f172a;">${isChecked ? "X" : "&nbsp;&nbsp;"}</span>
            <span>\\</span>
          </span>`;
        };

        const otherLineDisplay =
          selectedCat === "DİĞER"
            ? catOtherText || v.authPropertyTypeFeatures || "............................................................"
            : catOtherText || "............................................................";

        const rentCurr = (v.rentCurrency || "GBP").toUpperCase();
        const currMeta = getCurrencyMeta(rentCurr);
        const rawRentNum = parseNumericAmount(v.rentPriceRaw ?? v.propertyPrice);
        const minRentDisplay =
          rawRentNum > 0
            ? `${rawRentNum.toLocaleString("tr-TR")} ${currMeta.codeLabel} (${numberToTurkishWords(rawRentNum)} ${currMeta.wordLabel})`
            : "............................................................";

        const paymentMethodDisplay =
          (v.rentPaymentMethod || "").trim() ||
          "..............................................................................";
        const depositDisplay =
          (v.depositAmount || "").trim() ||
          "......................................................................................";

        const feePayerDisplay =
          (v.authServiceFeePayer || (ownerFullName && ownerFullName !== "Mülk Sahibi" ? ownerFullName : "")).trim() ||
          ".........................................";
        const feeReceiverDisplay =
          (v.authServiceFeeReceiver || brokerTitle).trim() ||
          "..............................................";

        const showingDay = (v.authShowingDayType || "TÜMÜ").toUpperCase().trim();
        const showingHoursDisplay = (v.authShowingHours || "09:00 - 18:00").trim();
        const renderShowingDayItem = (code: string, label: string) => {
          const isMatch = showingDay === code;
          return `<span style="margin-right: 14px;">
            <strong>${label}</strong>
            <span style="display: inline-block; min-width: 28px; text-align: center; border-bottom: 1.5px solid #0f172a; font-weight: 900;">${isMatch ? "X" : "&nbsp;&nbsp;"}</span>
          </span>`;
        };

        const rawDurationDays = (v.authDurationDays || v.contractDuration || "90").toString().trim();
        const cleanedDays = rawDurationDays
          .replace(/\/\s*12\s*Months/gi, "")
          .replace(/\b(gündür|gundur|gün|gun)\b/gi, "")
          .trim() || "90 (Doksan)";

        const w1Line = [v.witness1Name, v.witness1Identity].filter(Boolean).join(" - ").trim();
        const w2Line = [v.witness2Name, v.witness2Identity].filter(Boolean).join(" - ").trim();

        const signerOwnerLabel =
          v.signingName && !v.signingName.startsWith("[")
            ? v.signingName.trim()
            : ownerFullName || "Gayrimenkul Sahibi / Vekili";

        const html = `
<div style="font-family: 'Times New Roman', Georgia, serif; max-width: 800px; margin: 0 auto; padding: 28px 34px; color: #0f172a; line-height: 1.55; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px;">
  <div style="text-align: center; margin-bottom: 12px;">
    <div style="font-size: 16px; font-weight: bold; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em;">
      KİRALIK GAYRİMENKUL
    </div>
    <h1 style="font-size: 19px; font-weight: bold; color: #0f172a; margin: 2px 0 0 0; text-transform: uppercase; letter-spacing: 0.04em; text-decoration: underline;">
      TEK YETKİLİ KİRALAMA SÖZLEŞMESİ
    </h1>
  </div>

  <div style="text-align: right; font-size: 13px; font-weight: bold; color: #0f172a; margin-bottom: 10px;">
    Tarih: ${slashDate}
  </div>

  <div style="margin-bottom: 12px; font-size: 13px; color: #0f172a; padding: 8px 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px;">
    <div style="font-weight: bold; text-decoration: underline; margin-bottom: 4px;">1-Gayrimenkul sahibinin bilgileri:</div>
    <div><strong>ADI SOYADI:</strong> ${ownerFullName || "...................................................................................................."}</div>
    <div><strong>P./K./MŞ. NO:</strong> ${ownerIdStr || "...................................................................................................."}</div>
    <div><strong>ADRES:</strong> ${ownerAddrStr || "...................................................................................................."}</div>
    <div><strong>TELEFON:</strong> ${ownerPhoneStr || "...................................................................................................."}</div>
  </div>

  <div style="margin-bottom: 12px; font-size: 13px; color: #0f172a; padding: 8px 12px; background: #ffffff; border: 1.5px solid #0f172a; border-radius: 6px;">
    <div style="font-weight: bold; text-decoration: underline; margin-bottom: 4px;">2- Gayrimenkulün bilgileri:</div>
    <div style="margin-bottom: 6px;"><strong>ADRES:</strong> ${propAddrDisplay}</div>
    <div style="margin-bottom: 8px; line-height: 1.8;">
      <strong>ÇEŞİT:</strong>
      ${renderCatBox("EV", "EV")}
      ${renderCatBox("APT.DAİRESİ", "APT.DAİRESİ")}
      ${renderCatBox("BİNA", "BİNA")}
      ${renderCatBox("DEPO", "DEPO")}
      ${renderCatBox("BÜRO", "BÜRO")}
      ${renderCatBox("DÜKKAN", "DÜKKAN")}
      <span><strong>DİĞER:</strong> ${otherLineDisplay}</span>
    </div>
    <p style="margin: 0; text-align: justify;">
      Sayın <strong>${ownerFullName || "................................................"}</strong> (kiraya veren) ve <strong>${brokerTitle || "......................................."}</strong> (komisyoncu) yukarıda yazılı olan gayrimenkule kiracı bulunup kiraya verilmesi için aşağıdaki şekilde anlaşmışlardır.
    </p>
  </div>

  <div style="margin-bottom: 12px; font-size: 13px; color: #0f172a; padding: 8px 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; line-height: 1.65;">
    <div style="font-weight: bold; text-decoration: underline; margin-bottom: 4px;">3- İşlem bilgileri:</div>
    <div><strong>Minimum kira bedeli:</strong> ${minRentDisplay} / ay.</div>
    <div><strong>Ödeme şekli:</strong> ${paymentMethodDisplay}</div>
    <div><strong>Depozit:</strong> ${depositDisplay}</div>
    <div><strong>Hizmet bedeli:</strong> 1 aylık kira bedeli + KDV'dir</div>
    <div>
      İş bu hizmet bedeli <strong>${feePayerDisplay}</strong> tarafından <strong>${feeReceiverDisplay}</strong>'a ödenecektir.
    </div>
    <div style="margin-top: 4px;">
      <div style="font-weight: bold;">GÖSTERİM ZAMANI:</div>
      <div>
        ${renderShowingDayItem("HAFTA İÇİ", "HAFTA İÇİ")}
        ${renderShowingDayItem("HAFTA SONU", "HAFTA SONU")}
        ${renderShowingDayItem("TÜMÜ", "TÜMÜ")}
        <span><strong>SAAT:</strong> ${showingHoursDisplay || "........................."}</span>
      </div>
    </div>
  </div>

  <div style="margin-bottom: 10px; font-size: 12.5px; color: #0f172a; text-align: justify;">
    <div style="font-size: 13px; font-weight: bold; text-decoration: underline; margin-bottom: 4px;">4- Yetki ve sorumluluklar:</div>
    <p style="margin: 0 0 5px 0;">
      Gayrimenkulü kiraya vermek için yapılması gereken pazarlama faaliyetlerinin tüm masraflarını komisyoncu karşılayacaktır.
    </p>
    <p style="margin: 0 0 5px 0;">
      Müşteri, bu anlaşma ile gayrimenkulün kiralanması için pazarlanması ve/veya tanıtımı amacıyla gayrimenkule giriş-çıkış iznini ve gayrimenkulün kiralanması ve pazarlanması için temsil haklarını komisyoncuya vermiştir.
    </p>
    <p style="margin: 0;">
      Müşteri, sözleşme süresince kendisine gelen potansiyel kiracıları ve/veya kiralama taleplerini komisyoncuya yönlendirir. Müşteri, bu kişi veya kuruluşları komisyoncuya yönlendirmeyip kiralama işlemini kendisi yapması halinde 1 (bir) aylık kira bedeli + KDV tutarı kadar hizmet bedelini komisyoncuya ödemeyi kabul ve taahhüt eder.
    </p>
  </div>

  <div style="margin-bottom: 10px; font-size: 12.5px; color: #0f172a; text-align: justify;">
    <div style="font-size: 13px; font-weight: bold; text-decoration: underline; margin-bottom: 4px;">5- Yetki süresi:</div>
    <p style="margin: 0 0 4px 0;">
      Bu sözleşmenin yetki süresi imza tarihinden itibaren <strong>${cleanedDays}</strong> gündür.
    </p>
    <p style="margin: 0;">
      Sözleşme süresinin bitiminden sonra, taraflar sözleşmeyi uzatıp uzatmamak konusunda serbesttir.
    </p>
  </div>

  <div style="margin-bottom: 10px; font-size: 12.5px; color: #0f172a; text-align: justify;">
    <div style="font-size: 13px; font-weight: bold; text-decoration: underline; margin-bottom: 4px;">6- Sözleşme süresi sonrası:</div>
    <p style="margin: 0;">
      Müşteri, bu sözleşmenin bitim tarihinden sonraki 120 gün içerisinde, komisyoncunun kendisine sözleşme süresinde tanıştırmış olduğu herhangi bir müşteriye, ortağına veya idarecisi bulunduğu şirkete, şirketin ortak olduğu kuruluşlara ya da kan ve sihri hısımlarına gayrimenkulünü kiraya verdiği taktirde, 1 (bir) aylık kira bedeli + KDV tutarı kadar hizmet bedelini komisyoncuya ödemeyi kabul ve taahhüt eder.
    </p>
  </div>

  <div style="margin-bottom: 10px; font-size: 12.5px; color: #0f172a; text-align: justify;">
    <div style="font-size: 13px; font-weight: bold; text-decoration: underline; margin-bottom: 4px;">7- Vazgeçme durumu:</div>
    <p style="margin: 0;">
      Müşteri, sözleşme süresince herhangi bir nedenle gayrimenkulünü kiraya vermekten vazgeçerse, 1 (bir) aylık kira bedeli + KDV tutarı kadar hizmet bedelini komisyoncuya ödemeyi kabul ve taahhüt eder.
    </p>
  </div>

  <div style="margin-bottom: 10px; font-size: 12.5px; color: #0f172a; text-align: justify;">
    <div style="font-size: 13px; font-weight: bold; text-decoration: underline; margin-bottom: 4px;">8- Anlaşmazlık</div>
    <p style="margin: 0;">
      Sözleşme kapsamında doğabilecek anlaşmazlıkların çözümü için KKTC Mahkemeleri yetkilidir.
    </p>
  </div>

  ${renderCustomClausesHtml(v.customClauses)}

  <div style="margin-top: 18px; display: flex; justify-content: space-between; gap: 24px; page-break-inside: avoid;">
    <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px 14px; background-color: #f8fafc; display: flex; flex-direction: column; justify-content: space-between; min-height: 185px; font-size: 12.5px;">
      <div>
        <div style="font-size: 13px; font-weight: bold; color: #0f172a; text-align: center; text-decoration: underline; margin-bottom: 6px;">
          GAYRİMENKUL SAHİBİ/VEKİLİ
        </div>
        <div><strong>ADI SOYADI:</strong> ${ownerFullName || "................................................"}</div>
        <div><strong>P./K./MŞ. NO:</strong> ${ownerIdStr || "................................................"}</div>
        <div><strong>ADRES:</strong> ${ownerAddrStr || "................................................"}</div>
        <div><strong>TEL:</strong> ${ownerPhoneStr || "................................................"}</div>
      </div>
      <div style="margin-top: 6px;">
        <div style="font-weight: bold; color: #0f172a;">İMZA:</div>
        ${renderSignatureOrStamp(
          signerOwnerLabel,
          v.isSigned,
          v.signatureImage,
          "1. Öncelik: Gayrimenkul Sahibi İmzası Bekleniyor"
        )}
      </div>
      <div style="font-size: 10px; color: #64748b; text-align: center;">1. İmza (Öncelikli) • Gayrimenkul Sahibi / Vekili</div>
    </div>

    <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px 14px; background-color: #f8fafc; display: flex; flex-direction: column; justify-content: space-between; min-height: 185px; font-size: 12.5px;">
      <div>
        <div style="font-size: 13px; font-weight: bold; color: #0f172a; text-align: center; text-decoration: underline; margin-bottom: 6px;">
          KOMİSYONCU
        </div>
        <div><strong>ADI SOYADI:</strong> ${brokerTitle}</div>
        <div><strong>P./K./MŞ. NO:</strong> ${brokerIdentity}</div>
        <div><strong>ADRES:</strong> ${brokerAddr}</div>
        <div><strong>TEL:</strong> ${brokerPhone}</div>
      </div>
      <div style="margin-top: 6px;">
        <div style="font-weight: bold; color: #0f172a;">İMZA:</div>
        ${renderSignatureOrStamp(
          brokerTitle,
          v.sellerSigned,
          v.sellerSignatureImage,
          v.isSigned ? "Komisyoncu Final Onayı Bekleniyor" : "Önce Gayrimenkul Sahibi İmzası Bekleniyor"
        )}
      </div>
      <div style="font-size: 10px; color: #64748b; text-align: center;">2. İmza (Final Onay) • Komisyoncu</div>
    </div>
  </div>

  <div style="margin-top: 18px; padding-top: 10px; border-top: 1px dashed #cbd5e1; font-size: 12.5px; color: #0f172a; page-break-inside: avoid;">
    <div style="font-weight: bold; margin-bottom: 4px;">Şahitler:</div>
    <div style="margin-bottom: 3px;"><strong>1.</strong> ${w1Line || "..........................................................................."}</div>
    <div><strong>2.</strong> ${w2Line || "..........................................................................."}</div>
  </div>
</div>
`;

        const markdown = `# KİRALIK GAYRİMENKUL TEK YETKİLİ KİRALAMA SÖZLEŞMESİ
**Tarih:** ${slashDate}
**1- Gayrimenkul Sahibinin Bilgileri:** ${ownerFullName} (P./K./MŞ. No: ${ownerIdStr}) - Adres: ${ownerAddrStr} - Tel: ${ownerPhoneStr}
**2- Gayrimenkulün Bilgileri:** Adres: ${propAddrDisplay} | Çeşit: ${selectedCat} ${catOtherText ? `(${catOtherText})` : ""}
**3- İşlem Bilgileri:** Minimum Kira: ${minRentDisplay} / ay | Ödeme Şekli: ${paymentMethodDisplay} | Depozit: ${depositDisplay} | Hizmet Bedeli: 1 aylık kira bedeli + KDV (${feePayerDisplay} -> ${feeReceiverDisplay}) | Gösterim: ${showingDay} (${showingHoursDisplay})
**5- Yetki Süresi:** ${cleanedDays} gün
${renderCustomClausesMarkdown(v.customClauses)}`;

        return { html, markdown };
      }

      // SATILIK PORTFÖY TEK YETKİ / YETKİLİ SATIŞ SÖZLEŞMESİ
      const rawPropAddr = [
        v.propertyAddress && v.propertyAddress !== "Belirtilmemiş adres" ? v.propertyAddress.trim() : "",
        v.propertyLocation && (!v.propertyAddress || !v.propertyAddress.includes(v.propertyLocation)) ? v.propertyLocation.trim() : ""
      ]
        .filter(Boolean)
        .join(" • ");

      const propAddrDisplay =
        rawPropAddr ||
        "......................................................................................................................................";

      const selectedCat = (v.authPropertyCategory || "APT.DAİRESİ").toUpperCase().trim();
      const catOtherText = (v.authPropertyCategoryOther || "").trim();
      const renderCatBox = (catCode: string, label: string) => {
        const isChecked = selectedCat === catCode;
        return `<span style="display: inline-flex; align-items: center; gap: 4px; margin-right: 12px; font-weight: ${isChecked ? "900" : "bold"}; color: ${isChecked ? "#0f172a" : "#334155"};">
          <span>${label}</span>
          <span style="display: inline-block; min-width: 22px; text-align: center; border-bottom: 1.5px solid #0f172a; font-weight: 900; color: #0f172a;">${isChecked ? "X" : "&nbsp;&nbsp;"}</span>
          <span>\\</span>
        </span>`;
      };

      const otherLineDisplay =
        selectedCat === "DİĞER"
          ? catOtherText || v.authPropertyTypeFeatures || "............................................................"
          : catOtherText || "............................................................";

      const kocanVal = (v.kocanNo || "").trim() || "........................";
      const districtVal =
        (v.rentalDistrict || (v.propertyLocation ? v.propertyLocation.split("/")[0].trim() : "")).trim() ||
        "...................";
      const mahalleVal =
        (
          v.rentalTownVillage ||
          (v.propertyLocation && v.propertyLocation.includes("/") ? v.propertyLocation.split("/")[1].trim() : "")
        ).trim() || ".............................";
      const adaVal = (v.adaNo || "").trim() || "...............................";
      const paftaVal = (v.paftaNo || "").trim() || "........................";
      const parselVal = (v.parselNo || v.propertyBlockPlot || "").trim() || "..........................................";

      const saleCurr = (v.saleCurrency || "GBP").toUpperCase();
      const saleCurrMeta = getCurrencyMeta(saleCurr);
      const rawSaleNum = parseNumericAmount(v.salePriceRaw ?? v.propertyPrice);
      const minSaleDisplay =
        rawSaleNum > 0
          ? `${rawSaleNum.toLocaleString("tr-TR")} ${saleCurrMeta.codeLabel} (${numberToTurkishWords(rawSaleNum)} ${saleCurrMeta.wordLabel})`
          : "..................................................................................";

      const rawCommNum = (v.commissionRate || "5").toString().replace(/[^\d.,]/g, "").trim() || "5";

      const rawDurationDays = (v.authDurationDays || v.contractDuration || "90 (Doksan)").toString().trim();
      const cleanedDays =
        rawDurationDays
          .replace(/\/\s*12\s*Months/gi, "")
          .replace(/\b(gündür|gundur|gün|gun)\b/gi, "")
          .trim() || "90 (Doksan)";

      const w1Line = [v.witness1Name, v.witness1Identity].filter(Boolean).join(" - ").trim();
      const w2Line = [v.witness2Name, v.witness2Identity].filter(Boolean).join(" - ").trim();

      const signerOwnerLabel =
        v.signingName && !v.signingName.startsWith("[")
          ? v.signingName.trim()
          : ownerFullName || "Gayrimenkul Sahibi / Vekili";

      const html = `
<div style="font-family: 'Times New Roman', Georgia, serif; max-width: 800px; margin: 0 auto; padding: 28px 34px; color: #0f172a; line-height: 1.55; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px;">
  <div style="text-align: center; margin-bottom: 12px;">
    <div style="font-size: 16px; font-weight: bold; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em;">
      SATILIK GAYRİMENKUL
    </div>
    <h1 style="font-size: 19px; font-weight: bold; color: #0f172a; margin: 2px 0 0 0; text-transform: uppercase; letter-spacing: 0.04em; text-decoration: underline;">
      YETKİLİ SATIŞ SÖZLEŞMESİ
    </h1>
    <div style="font-size: 13px; font-weight: bold; color: #334155; margin-top: 2px;">
      (hizmet bedeli eklenerek)
    </div>
  </div>

  <div style="text-align: right; font-size: 13px; font-weight: bold; color: #0f172a; margin-bottom: 10px;">
    Tarih: ${slashDate}
  </div>

  <div style="margin-bottom: 12px; font-size: 13px; color: #0f172a; padding: 8px 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px;">
    <div style="font-weight: bold; text-decoration: underline; margin-bottom: 4px;">1-Gayrimenkul sahibinin bilgileri:</div>
    <div><strong>ADI SOYADI:</strong> ${ownerFullName || "...................................................................................................."}</div>
    <div><strong>P./K./MŞ. NO:</strong> ${ownerIdStr || "...................................................................................................."}</div>
    <div><strong>ADRES:</strong> ${ownerAddrStr || "...................................................................................................."}</div>
    <div><strong>TELEFON:</strong> ${ownerPhoneStr || "...................................................................................................."}</div>
  </div>

  <div style="margin-bottom: 12px; font-size: 13px; color: #0f172a; padding: 8px 12px; background: #ffffff; border: 1.5px solid #0f172a; border-radius: 6px;">
    <div style="font-weight: bold; text-decoration: underline; margin-bottom: 4px;">2- Gayrimenkulün bilgileri:</div>
    <div style="margin-bottom: 6px;"><strong>ADRES:</strong> ${propAddrDisplay}</div>
    <div style="margin-bottom: 6px; line-height: 1.8;">
      <strong>ÇEŞİT:</strong>
      ${renderCatBox("EV", "EV")}
      ${renderCatBox("APT.DAİRESİ", "APT.DAİRESİ")}
      ${renderCatBox("BİNA", "BİNA")}
      ${renderCatBox("DEPO", "DEPO")}
      ${renderCatBox("BÜRO", "BÜRO")}
      ${renderCatBox("DÜKKAN", "DÜKKAN")}
      <span><strong>DİĞER:</strong> ${otherLineDisplay}</span>
    </div>
    <div style="margin-bottom: 4px; line-height: 1.7;">
      <strong>Koçan bilgileri:</strong>&nbsp;&nbsp;
      <span><strong>Koçan no:</strong> ${kocanVal}</span>&nbsp;&nbsp;&nbsp;
      <span><strong>Kaza:</strong> ${districtVal}</span>&nbsp;&nbsp;&nbsp;
      <span><strong>Mahalle:</strong> ${mahalleVal}</span>
    </div>
    <div style="margin-bottom: 8px; line-height: 1.7;">
      <span><strong>Ada:</strong> ${adaVal}</span>&nbsp;&nbsp;&nbsp;
      <span><strong>Pafta/Harita:</strong> ${paftaVal}</span>&nbsp;&nbsp;&nbsp;
      <span><strong>Parsel:</strong> ${parselVal}</span>
    </div>
    <p style="margin: 0; text-align: justify;">
      Sayın <strong>${ownerFullName || "................................................"}</strong> (Gayrimenkul sahibi) ve <strong>${brokerTitle || "......................................."}</strong> (komisyoncu) yukarıda yazılı olan gayrimenkulün satışı maksadıyla pazarlama, tanıtma ve aracılık işlemleri için aşağıdaki şekilde anlaşmışlardır.
    </p>
  </div>

  <div style="margin-bottom: 12px; font-size: 12.5px; color: #0f172a; padding: 8px 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; line-height: 1.65; text-align: justify;">
    <div style="font-size: 13px; font-weight: bold; text-decoration: underline; margin-bottom: 4px;">3- İşlem bilgileri:</div>
    <p style="margin: 0 0 4px 0;">
      <strong>Gayrimenkulün minimum satış bedeli:</strong> <strong>${minSaleDisplay}</strong>
    </p>
    <p style="margin: 0 0 4px 0;">
      Stopaj vergisi gayrimenkul sahibine, devir harcı alıcıya aittir.
    </p>
    <p style="margin: 0 0 4px 0;">
      Komisyoncu gayrimenkulü, yukarıda belirlenmiş bulunan minimum satış bedelinin üstüne <strong>% ${rawCommNum}</strong> hizmet bedeli ekleyerek piyasaya sunacaktır.
    </p>
    <p style="margin: 0 0 4px 0;">
      Gayrimenkul sahibi, herhangi bir nedenle yukarıda talep etmiş olduğu minimum satış bedelinden bir indirim yapmayı kendi insiyatifi ile kabul edebilir.
    </p>
    <p style="margin: 0;">
      Bu durumda, mülk sahibi, kendi insiyatifiyle kabul ettiği indirimli satış fiyatı üzerinden komisyoncuya <strong>% ${rawCommNum} + KDV</strong> ödemeyi kabul ve taahhüt eder.
    </p>
  </div>

  <div style="margin-bottom: 10px; font-size: 12.5px; color: #0f172a; text-align: justify;">
    <div style="font-size: 13px; font-weight: bold; text-decoration: underline; margin-bottom: 4px;">4- Yetki ve sorumluluklar:</div>
    <p style="margin: 0 0 4px 0;">
      Yetki veren, bu anlaşma ile gayrimenkulün pazarlanması ve/veya tanıtımı amacıyla potansiyel müşterilerin gayrimenkulü ziyaretlerinde giriş - çıkış için gereken kolaylığı göstereceğini kabul eder.
    </p>
    <p style="margin: 0 0 4px 0;">
      Yetki veren, yetkilendirilen kendi alt acente kanalını oluşturma hakkına sahip olduğunu kabul ve beyan eder.
    </p>
    <p style="margin: 0 0 4px 0;">
      Yetki alan, yetki verene gayrimenkulü ziyaret eden potansiyel alıcıların bilgilerini bildirecektir.
    </p>
    <p style="margin: 0 0 4px 0;">
      Taraflar işbu sözleşmede belirtilen şartlara uymadığı ve/veya sözleşmeyi ihlal ettiği ve/veya diğer tarafı kasten zarara uğrattığı takdirde ortaya çıkacak olan genel ve özel zarar ziyanı karşılayacağını kabul ve/veya taahhüt eder.
    </p>
    <p style="margin: 0;">
      İleri tetkik gerektiren hallerde 3. kişi veya kişilerin çalıştırılması ve/veya ayrı ve özerk bir pazarlama programı yapılacak olması durumunda taraflar bunların ücret ve/veya masraflarını aralarında anlaşarak karşılayacaktır.
    </p>
  </div>

  <div style="margin-bottom: 10px; font-size: 12.5px; color: #0f172a; text-align: justify;">
    <div style="font-size: 13px; font-weight: bold; text-decoration: underline; margin-bottom: 4px;">5- Yetki süresi:</div>
    <p style="margin: 0 0 4px 0;">
      Bu sözleşmenin yetki süresi imza tarihinden itibaren <strong>${cleanedDays}</strong> gündür.
    </p>
    <p style="margin: 0;">
      Anlaşma süresinin bitiminden sonra, taraflar sözleşmeyi uzatıp uzatmamak konusunda serbesttir. Böyle bir uzatma tarafların imzaladığı yazılı bir mütabakat veya anlaşma ile yapılır.
    </p>
  </div>

  <div style="margin-bottom: 10px; font-size: 12.5px; color: #0f172a; text-align: justify;">
    <div style="font-size: 13px; font-weight: bold; text-decoration: underline; margin-bottom: 4px;">6- Sözleşme süresi sonrası:</div>
    <p style="margin: 0;">
      Müşteri, bu anlaşma süresinin bitim tarihinden sonraki 180 gün içerisinde, komisyoncunun kendisine anlaşma süresinde tanıştırmış olduğu - veya aynı süre içerisinde kendisinin yönlendirmiş olduğu - alıcıya, ortağına veya idarecisi bulunduğu şirkete, şirketin ortak olduğu kuruluşlara ya da kan ve sihri hısımlarına doğrudan satış yaptığı taktirde, yukarıda belirtilen minimum satış bedeli üzerinden <strong>% ${rawCommNum} + KDV</strong> tutarı kadar profesyonel hizmet bedelini komisyoncuya ödemeyi kabul ve taahhüt eder.
    </p>
  </div>

  <div style="margin-bottom: 10px; font-size: 12.5px; color: #0f172a; text-align: justify;">
    <div style="font-size: 13px; font-weight: bold; text-decoration: underline; margin-bottom: 4px;">7-Hizmet bedeli ödeme şekli</div>
    <p style="margin: 0;">
      Hizmet bedeli ödemesi, satış sözleşmesi yapılıp tamamlandığında veya tapu devir esnasında komisyoncuya ödenir. Satış sözleşmesi veya tapu devir işlemi hangisi daha önce ise, önce olan işlem hizmet bedeline hak kazanıldığını ifade eder.
    </p>
  </div>

  <div style="margin-bottom: 10px; font-size: 12.5px; color: #0f172a; text-align: justify;">
    <div style="font-size: 13px; font-weight: bold; text-decoration: underline; margin-bottom: 4px;">8- Anlaşmazlık</div>
    <p style="margin: 0;">
      Anlaşma kapsamında doğabilecek anlaşmazlıkların çözümü için KKTC Mahkemeleri yetkilidir.
    </p>
  </div>

  ${renderCustomClausesHtml(v.customClauses)}

  <div style="margin-top: 18px; display: flex; justify-content: space-between; gap: 24px; page-break-inside: avoid;">
    <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px 14px; background-color: #f8fafc; display: flex; flex-direction: column; justify-content: space-between; min-height: 185px; font-size: 12.5px;">
      <div>
        <div style="font-size: 13px; font-weight: bold; color: #0f172a; text-align: center; text-decoration: underline; margin-bottom: 6px;">
          GAYRİMENKUL SAHİBİ/VEKİLİ
        </div>
        <div><strong>ADI SOYADI:</strong> ${ownerFullName || "................................................"}</div>
        <div><strong>P./K./MŞ. NO:</strong> ${ownerIdStr || "................................................"}</div>
        <div><strong>ADRES:</strong> ${ownerAddrStr || "................................................"}</div>
        <div><strong>TEL:</strong> ${ownerPhoneStr || "................................................"}</div>
      </div>
      <div style="margin-top: 6px;">
        <div style="font-weight: bold; color: #0f172a;">İMZA:</div>
        ${renderSignatureOrStamp(
          signerOwnerLabel,
          v.isSigned,
          v.signatureImage,
          "1. Öncelik: Gayrimenkul Sahibi İmzası Bekleniyor"
        )}
      </div>
      <div style="font-size: 10px; color: #64748b; text-align: center;">1. İmza (Öncelikli) • Gayrimenkul Sahibi / Vekili</div>
    </div>

    <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px 14px; background-color: #f8fafc; display: flex; flex-direction: column; justify-content: space-between; min-height: 185px; font-size: 12.5px;">
      <div>
        <div style="font-size: 13px; font-weight: bold; color: #0f172a; text-align: center; text-decoration: underline; margin-bottom: 6px;">
          KOMİSYONCU
        </div>
        <div><strong>ADI SOYADI:</strong> ${brokerTitle}</div>
        <div><strong>P./K./MŞ. NO:</strong> ${brokerIdentity}</div>
        <div><strong>ADRES:</strong> ${brokerAddr}</div>
        <div><strong>TEL:</strong> ${brokerPhone}</div>
      </div>
      <div style="margin-top: 6px;">
        <div style="font-weight: bold; color: #0f172a;">İMZA:</div>
        ${renderSignatureOrStamp(
          brokerTitle,
          v.sellerSigned,
          v.sellerSignatureImage,
          v.isSigned ? "Komisyoncu Final Onayı Bekleniyor" : "Önce Gayrimenkul Sahibi İmzası Bekleniyor"
        )}
      </div>
      <div style="font-size: 10px; color: #64748b; text-align: center;">2. İmza (Final Onay) • Komisyoncu</div>
    </div>
  </div>

  <div style="margin-top: 18px; padding-top: 10px; border-top: 1px dashed #cbd5e1; font-size: 12.5px; color: #0f172a; page-break-inside: avoid;">
    <div style="font-weight: bold; margin-bottom: 4px;">Şahitler:</div>
    <div style="margin-bottom: 3px;"><strong>1.</strong> ${w1Line || "..........................................................................."}</div>
    <div><strong>2.</strong> ${w2Line || "..........................................................................."}</div>
  </div>
</div>
`;
      const markdown = `# SATILIK GAYRİMENKUL YETKİLİ SATIŞ SÖZLEŞMESİ (HİZMET BEDELİ EKLENEREK)
**Tarih:** ${slashDate}
**1- Gayrimenkul Sahibinin Bilgileri:** ${ownerFullName} (P./K./MŞ. No: ${ownerIdStr}) - Adres: ${ownerAddrStr} - Tel: ${ownerPhoneStr}
**2- Gayrimenkulün Bilgileri:** Adres: ${propAddrDisplay} | Çeşit: ${selectedCat} ${catOtherText ? `(${catOtherText})` : ""} | Koçan No: ${kocanVal} | Kaza: ${districtVal} | Mahalle: ${mahalleVal} | Ada: ${adaVal} | Pafta/Harita: ${paftaVal} | Parsel: ${parselVal}
**3- İşlem Bilgileri:** Minimum Satış Bedeli: ${minSaleDisplay} | Hizmet Bedeli: % ${rawCommNum} + KDV
**5- Yetki Süresi:** ${cleanedDays} gün
${renderCustomClausesMarkdown(v.customClauses)}`;
      return { html, markdown };
    }
  },
  {
    id: "sales_authorization",
    titleTr: "Yetkili Satış Sözleşmesi (Hizmet Bedeli Eklenerek)",
    titleEn: "Authorized Sales Agreement (With Service Fee Added)",
    descriptionTr: "Satılık gayrimenkuller için mülk sahibi ile komisyoncu arasında imzalanan resmi KKTC yetkili satış sözleşmesi (hizmet bedeli eklenerek).",
    descriptionEn: "Official KKTC authorized sales mandate between property owner and broker with service fee added.",
    getTemplate: (v) => {
      const exclTpl = contractTemplates.find((t) => t.id === "exclusivity_agreement");
      if (exclTpl) {
        return exclTpl.getTemplate({ ...v, exclusivityIntent: "sale" });
      }
      return { html: "", markdown: "" };
    }
  },
  {
    id: "sales_brokerage",
    titleTr: "Satış Sözleşmesi",
    titleEn: "Real Estate Sales Agreement",
    descriptionTr: "Satıcı (Mülk Sahibi) ve Alıcı arasında akdedilen resmi gayrimenkul satış ve kapora sözleşmesi.",
    descriptionEn: "Official real estate sales and deposit agreement executed between Seller and Buyer.",
    getTemplate: (v) => {
      const rawDate = (v.contractDate || new Date().toLocaleDateString("tr-TR")).trim();
      const slashDate = rawDate.replace(/\./g, "/");
      const dotDate = rawDate.replace(/\//g, ".");

      const sellerName = (v.ownerName || v.sellerSigningName || "MÜLK SAHİBİ / SATICI").trim();
      const sellerId = (v.sellerIdentity || "Belirtilmedi").trim();
      const sellerIdType = (v.sellerIdType || "KKTC Kimlik Kartı").trim();

      const buyerName = (v.clientName || v.signingName || "ALICI").trim();
      const buyerId = (v.clientIdentity || "Belirtilmedi").trim();
      const buyerIdType = (v.buyerIdType || "KKTC KİMLİK").trim();

      const propClauseText = (
        v.salePropertyDetails ||
        `${v.propertyLocation || "KKTC"}’da ${v.kocanNo ? `${v.kocanNo} koçan numaralı, ` : ""}${
          v.paftaNo ? `${v.paftaNo} Pafta / Haritalı ` : ""
        }${v.adaNo ? `${v.adaNo} Ada/Blok ` : ""}${v.parselNo ? `${v.parselNo} Parsel numarada kain ` : ""}${
          v.apartmentUnitInfo || v.propertyTitle || "taşınmaz"
        }`
      ).trim();

      const currCode = (v.saleCurrency || "GBP").toUpperCase();
      const totalAmountRaw = v.salePriceRaw !== undefined && v.salePriceRaw !== "" ? v.salePriceRaw : v.propertyPrice;
      const depositRaw = v.depositAmount || "0";
      const remainingNum = computeRemainingSaleAmount(totalAmountRaw, depositRaw);

      const formattedTotal = formatSaleContractAmount(totalAmountRaw, currCode, true);
      const formattedDeposit = formatSaleContractAmount(depositRaw, currCode, false);
      const formattedRemaining = formatSaleContractAmount(remainingNum, currCode, false);

      const depositDateStr = (v.depositDate || dotDate).replace(/\//g, ".");
      const deedTransferDateStr = (v.deedTransferDate || dotDate).replace(/\//g, ".");
      const deadlineMonths = (v.paymentDeadlineMonths || "4 (dört) ay").trim();
      const graceDays = (v.gracePeriodDays || "14").toString().replace(/[^\d]/g, "") || "14";

      const taxResponsibilities = (
        v.taxClauseText ||
        "Satıcı Belediye Emlak Vergisi (varsa KDV yi) ve Stopaj Ödeyecek, Alıcı ise Tapu Devir Harcı’nı ödeyecektir."
      ).trim();

      const brokerName = (
        v.agentAndCompany ||
        `${v.storeName || "Seçkin Emlak"}${v.authorizedPersonName ? ` ${v.authorizedPersonName}` : ""}`
      ).trim();
      const commRateClean = (v.commissionRate || "%5").includes("%")
        ? v.commissionRate
        : `%${v.commissionRate || "5"}`;

      const w1Name = (v.witness1Name || v.authorizedPersonName || "").trim();
      const w1Id = (v.witness1Identity || v.authorizedPersonIdentity || "").trim();
      const w2Name = (v.witness2Name || "").trim();
      const w2Id = (v.witness2Identity || "").trim();

      const html = `
<div style="font-family: 'Times New Roman', Georgia, serif; max-width: 800px; margin: 0 auto; padding: 32px 36px; color: #0f172a; line-height: 1.65; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px;">
  <div style="text-align: left; font-size: 14px; font-weight: bold; color: #0f172a; margin-bottom: 6px;">
    ${slashDate}
  </div>

  <div style="text-align: center; margin-bottom: 18px;">
    <h1 style="font-size: 20px; font-weight: bold; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.04em; text-decoration: underline;">SATIŞ SÖZLEŞMESİ</h1>
  </div>

  <p style="font-size: 14px; text-align: justify; margin: 0 0 18px 0; color: #0f172a;">
    Bir taraftan <strong>${sellerId}</strong> numaralı ${sellerIdType} hamili <strong>${sellerName}</strong> (Bundan Sonra <strong>SATICI</strong> olarak anılacaktır), diğer taraftan <strong>${buyerId}</strong> numaralı ${buyerIdType} Hamili <strong>${buyerName}</strong> (bundan sonra <strong>ALICI</strong> olarak anılacaktır). Bugün <strong>${slashDate}</strong> tarihinde işbu satış sözleşmesini akdederler.
  </p>

  <div style="font-size: 14px; font-weight: bold; color: #0f172a; margin-bottom: 10px; text-decoration: underline;">
    ŞARTLAR:
  </div>

  <ol style="font-size: 13.5px; color: #0f172a; padding-left: 22px; text-align: justify; margin: 0 0 20px 0;">
    <li style="margin-bottom: 10px;">
      Satıcı sahibi ve/veya satış yetkilisi olduğu <strong>${propClauseText}</strong> taşınmazı alıcıya satmayı ve alıcıda satın almayı kabul ve deruhte ederler.
    </li>
    <li style="margin-bottom: 10px;">
      Taşınmazın satış bedeli <strong>${formattedTotal}</strong> olup, alıcı satıcıya <strong>${depositDateStr}</strong> tarihinde <strong>${formattedDeposit}</strong> Kapora olarak ödemiştir. Geriye kalan <strong>${formattedRemaining}</strong> En geç <strong>${deedTransferDateStr}</strong> Tapu devri öncesi veya tapu devir esnasında ödenecektir.
    </li>
    <li style="margin-bottom: 10px;">
      Satıcı alıcıya ve/veya alıcının göstereceği gerçek ve/veya tüzel kişi veya kuruluşa koçanı en geç <strong>${deedTransferDateStr}</strong> tarihinde geriye kalan tutarı aldıktan sonra yasal işemlere başlayıp tapu devir günü devretmekle ve taşınmazı teslim etmekle yükümlüdür.
    </li>
    <li style="margin-bottom: 10px;">
      Alıcı, en geç <strong>${deadlineMonths}</strong> içerisinde ödemeyi tam olarak aldıktan sonra tapu devir işlemini yapmak üzere hazır bulunmadığı takdirde Satıcının koşulsuz olarak sözleşmeyi tek taraflı fesih edip , verilen kapora miktarını irad edeceğini kabul ve deruhte eder. Bu tarihten itibaren satıcı konu edilen taşınmaz mal ile her istediğini yapabilir. Doğabilecek aksilikler göz önünde bulundurularak tarafların isteği üzerine <strong>${graceDays}</strong> Gün lütuf süresi duruma göre eklenebilir.
    </li>
    <li style="margin-bottom: 10px;">
      Koçan devri için taraflar yasal vergilerini şu şekilde ödemekle yükümlüdürler. (${taxResponsibilities})<br/>
      Satıcı aracılık eden Emlakçı <strong>${brokerName}</strong>’a Sözleşme günü (<strong>${dotDate}</strong>) satış bedelinin <strong>${commRateClean}</strong> oranında Emlak Komisyonu Ödeyecektir.
    </li>
    <li style="margin-bottom: 10px;">
      Taraflar, bugünden itibaren sözleşmedeki karşılıklı yükümlülüklerin tamamen yerine getirilmesine değin işbu satış sözleşmesinde konu edilen taşınmaz malı her ne suretle olursa olsun 3. Şahıslara satmamayı, devretmemeyi veya yükümlülük altına koymamayı kabul ve taahhüt ederler.
    </li>
    <li style="margin-bottom: 10px;">
      Satıcı, söz konusu malı alıcılara devretmezse ve/veya sözleşmeden cayarsa ve/veya satmaktan vazgeçerse alıcıdan aldığı tüm meblağı yasal faizleriyle birlikte iade etmeyi ve tüm aldığı miktarı kadar ödemeyide cezai işlem olarak ödemeyi, Alıcı sözleşmeden cayarsa ve/veya vazgeçerse ödemiş oldukları meblağı geri talep etmeyeceğini kabul ve taahhüt ederler.
    </li>
    <li style="margin-bottom: 10px;">
      Taraflardan herhangi birisinin sözleşmeden cayması ve konunun mahkemeye intikal etmesi halinde kusurlu taraf tüm avukat, dava ve mahkeme masrafları’nıda ödemekle yükümlü olacaktır.
    </li>
    <li style="margin-bottom: 10px;">
      İşbu satış sözleşmesi, tarafları, tarafların mirasçılarını ve bu sözleşmedeki hak ve yükümlülükleri yasal olarak devralabilecek kişileride bağlayıcıdır.
    </li>
  </ol>

  ${renderCustomClausesHtml(v.customClauses)}

  <div style="margin-top: 28px; display: flex; justify-content: space-between; gap: 28px; page-break-inside: avoid;">
    <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 10px; padding: 14px; text-align: center; background-color: #f8fafc; display: flex; flex-direction: column; justify-content: space-between; min-height: 165px;">
      <div>
        <div style="font-size: 13px; font-weight: bold; color: #0f172a; letter-spacing: 0.05em;">SATICI</div>
        <div style="font-size: 13px; font-weight: bold; color: #0f172a; margin-top: 2px;">${sellerName}</div>
        <div style="font-size: 12px; color: #334155;">${sellerId}</div>
      </div>
      ${renderSignatureOrStamp(
        v.sellerSigningName || sellerName,
        v.sellerSigned,
        v.sellerSignatureImage,
        v.isSigned ? "Satıcı Onayı / İmza Bekleniyor" : "Önce Alıcı İmzası Bekleniyor"
      )}
      <div style="font-size: 10px; color: #64748b;">2. İmza (Final Onay) • Satıcı</div>
    </div>

    <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 10px; padding: 14px; text-align: center; background-color: #f8fafc; display: flex; flex-direction: column; justify-content: space-between; min-height: 165px;">
      <div>
        <div style="font-size: 13px; font-weight: bold; color: #0f172a; letter-spacing: 0.05em;">ALICI</div>
        <div style="font-size: 13px; font-weight: bold; color: #0f172a; margin-top: 2px;">${buyerName}</div>
        <div style="font-size: 12px; color: #334155;">${buyerId}</div>
      </div>
      ${renderSignatureOrStamp(
        v.signingName || buyerName,
        v.isSigned,
        v.signatureImage,
        "1. Öncelik: Alıcı İmzası Bekleniyor"
      )}
      <div style="font-size: 10px; color: #64748b;">1. İmza (Öncelikli) • Alıcı</div>
    </div>
  </div>

  <div style="margin-top: 24px; padding-top: 14px; border-top: 1px dashed #cbd5e1; font-size: 13px; color: #0f172a; page-break-inside: avoid;">
    <div style="font-weight: bold; margin-bottom: 8px;">Yukarıdaki imzaların tümüne şahitler;</div>
    <div style="display: flex; justify-content: space-between; gap: 24px; flex-wrap: wrap;">
      <div style="flex: 1; min-width: 200px;">
        <strong>1</strong> ${w1Name} ${w1Id}
      </div>
      <div style="flex: 1; min-width: 200px;">
        <strong>2</strong> ${w2Name} ${w2Id}
      </div>
    </div>
  </div>
</div>
`;
      const markdown = `
# SATIŞ SÖZLEŞMESİ
**Tarih:** ${slashDate}
**SATICI:** ${sellerName} (${sellerIdType} - ${sellerId})
**ALICI:** ${buyerName} (${buyerIdType} - ${buyerId})
**Taşınmaz:** ${propClauseText}
**Satış Bedeli:** ${formattedTotal}
**Kapora:** ${formattedDeposit} (${depositDateStr})
**Kalan Bakiye:** ${formattedRemaining} (En geç ${deedTransferDateStr})
**Emlak Komisyonu:** ${commRateClean} (${brokerName})
${renderCustomClausesMarkdown(v.customClauses)}`;
      return { html, markdown };
    }
  },
  {
    id: "inter_branch_split",
    titleTr: "Ortak Satış & Paylaşım Sözleşmesi",
    titleEn: "Co-Brokerage & Split Agreement",
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

  ${renderCustomClausesHtml(v.customClauses)}

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
${renderCustomClausesMarkdown(v.customClauses)}`;
      return { html, markdown };
    }
  },
  {
    id: "rental_agreement",
    titleTr: "Kira Sözleşmesi",
    titleEn: "Rental & Lease Agreement",
    descriptionTr: "Kiraya Veren (Mülk Sahibi) ve Kiracı arasında akdedilen 9+9 maddelik resmi KKTC kira sözleşmesi.",
    descriptionEn: "Official 9+9 clause KKTC lease agreement between landlord and tenant.",
    getTemplate: (v) => {
      const rawDate = (v.contractDate || new Date().toLocaleDateString("tr-TR")).trim();
      const slashDate = rawDate.replace(/\./g, "/");

      const landlordName = (v.ownerName || v.sellerSigningName || "KİRAYA VEREN").trim();
      const landlordId = (v.sellerIdentity || "Belirtilmedi").trim();
      const landlordIdType = (v.sellerIdType || "KKTC kimlik").trim();
      const landlordPhone = (v.ownerPhone || v.storePhone || "").trim();

      const tenantName = (v.clientName || v.signingName || "KİRACI").trim();
      const tenantId = (v.clientIdentity || "Belirtilmedi").trim();
      const tenantIdType = (v.buyerIdType || "TC kimlik").trim();
      const tenantPhone = (v.clientPhone || "").trim();

      const propDef = (v.rentalPropertyDef || v.propertyTitle || "Daire / Konut").trim();
      const usagePurpose = (v.rentalUsagePurpose || "Aile Yaşam Alanı").trim();
      const propAddress = (v.propertyAddress || v.propertyLocation || "KKTC").trim();
      const districtVal = (v.rentalDistrict || (v.propertyLocation ? v.propertyLocation.split("/")[0].trim() : "")).trim();
      const townVillageVal = (
        v.rentalTownVillage ||
        (v.propertyLocation && v.propertyLocation.includes("/") ? v.propertyLocation.split("/")[1].trim() : "")
      ).trim();
      const kocanVal = (v.kocanNo || "").trim();
      const paftaVal = (v.paftaNo || "").trim();
      const adaVal = (v.adaNo || "").trim();
      const parselVal = (v.parselNo || v.propertyBlockPlot || "").trim();

      const rentCurr = (v.rentCurrency || v.saleCurrency || "TL").toUpperCase();
      const rawRentAmount = v.rentPriceRaw !== undefined && v.rentPriceRaw !== "" ? v.rentPriceRaw : v.propertyPrice;
      const formattedMonthlyRent = formatSaleContractAmount(rawRentAmount, rentCurr, false);

      const paymentMethodStr = (v.rentPaymentMethod || "Aylık Ödemeli").trim();
      const paymentTermsStr = (v.paymentDay || "Her Ayın En Geç 5 (Beş)’inde Ödenecektir.").trim();
      const depositSummaryStr = formatDepositWithWords(v.depositAmount || "1 Aylık Kira Bedeli", rentCurr);

      const rentStartSlash = (v.rentStartDate || slashDate).replace(/\./g, "/");
      const rentEndSlash = (
        v.rentEndDate ||
        (() => {
          const parts = slashDate.split("/");
          if (parts.length === 3) {
            const yr = parseInt(parts[2], 10);
            if (!isNaN(yr)) return `${parts[0]}/${parts[1]}/${yr + 1}`;
          }
          return "";
        })()
      ).replace(/\./g, "/");
      const durationStr = (v.rentDuration || "1 (Bir) Yıl").trim();

      const w1Name = (v.witness1Name || v.authorizedPersonName || "").trim();
      const w1Id = (v.witness1Identity || v.authorizedPersonIdentity || "").trim();
      const w2Name = (v.witness2Name || "").trim();
      const w2Id = (v.witness2Identity || "").trim();

      const customLines = parseCustomClauseLines(v.customClauses);
      const clauseFormula = customLines.length > 0 ? `9 + 9 + ${customLines.length}` : "9 + 9";

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
<div style="font-family: 'Times New Roman', Georgia, serif; max-width: 800px; margin: 0 auto; padding: 30px 34px; color: #0f172a; line-height: 1.58; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px;">
  <div style="text-align: left; font-size: 13.5px; font-weight: bold; color: #0f172a; margin-bottom: 4px;">
    Tarih:${slashDate}
  </div>

  <div style="text-align: center; margin-bottom: 16px;">
    <h1 style="font-size: 20px; font-weight: bold; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.04em; text-decoration: underline;">KİRA SÖZLEŞMESİ</h1>
  </div>

  <div style="margin-bottom: 16px;">
    <div style="font-size: 13.5px; font-weight: bold; color: #0f172a; text-decoration: underline; margin-bottom: 4px;">TARAFLAR</div>
    <p style="font-size: 13.5px; text-align: justify; margin: 0; color: #0f172a;">
      Bir taraftan <strong>${landlordId}</strong> numaralı ${landlordIdType} hamili <strong>${landlordName}</strong>, (Bundan böyle <strong>KİRAYA VEREN</strong> olarak anılacaktır.), diğer taraftan <strong>${tenantId}</strong> numaralı ${tenantIdType} hamili <strong>${tenantName}</strong>, Bundan böyle <strong>KİRACI</strong> olarak anılacaktır. Bugün <strong>${slashDate}</strong> tarihinde işbu kira sözleşmesini akdederler.
    </p>
  </div>

  <div style="margin-bottom: 16px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 14px; background-color: #f8fafc;">
    <div style="font-size: 13.5px; font-weight: bold; color: #0f172a; text-decoration: underline; margin-bottom: 6px;">TAŞINMAZIN BİLGİLERİ</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #0f172a;">
      <tr>
        <td style="padding: 3px 6px 3px 0; width: 52%;"><strong>Taşınmazın Tanımı:</strong> ${propDef}</td>
        <td style="padding: 3px 0;"><strong>Kullanım Amacı:</strong> ${usagePurpose}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding: 3px 0;"><strong>Adresi:</strong> ${propAddress}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding: 3px 0;">
          <div style="display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
            <span style="min-width: 160px;"><strong>Kaza:</strong> ${districtVal || "...................."}</span>
            <span style="min-width: 180px;"><strong>Kasaba veya Köy:</strong> ${townVillageVal || "...................."}</span>
            <span style="min-width: 140px;"><strong>Koçan No:</strong> ${kocanVal || "...................."}</span>
          </div>
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding: 3px 0;">
          <div style="display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
            <span style="min-width: 160px;"><strong>Pafta/Harita:</strong> ${paftaVal || "...................."}</span>
            <span style="min-width: 180px;"><strong>Ada/Blok:</strong> ${adaVal || "...................."}</span>
            <span style="min-width: 140px;"><strong>Parsel:</strong> ${parselVal || "...................."}</span>
          </div>
        </td>
      </tr>
    </table>
    <div style="font-size: 12.5px; font-style: italic; color: #334155; margin-top: 4px;">
      (Bundan böyle <strong>GAYRİMENKUL</strong> olarak anılacaktır.)
    </div>
  </div>

  <div style="margin-bottom: 18px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 14px; background-color: #ffffff;">
    <div style="font-size: 13.5px; font-weight: bold; color: #0f172a; text-decoration: underline; margin-bottom: 6px;">KİRA ŞARTLARI</div>
    <div style="font-size: 13px; color: #0f172a; line-height: 1.65;">
      <div><strong>Bir aylık kira bedeli:</strong> ${formattedMonthlyRent}</div>
      <div><strong>Ödeme şekli:</strong> ${paymentMethodStr}</div>
      <div><strong>Ödeme şartları:</strong> ${paymentTermsStr}</div>
      <div><strong>Alınan depozito miktarı:</strong> ${depositSummaryStr}</div>
      <div style="display: flex; flex-wrap: wrap; gap: 24px;">
        <span><strong>Kira sözleşme başlangıç tarihi:</strong> ${rentStartSlash}</span>
        <span><strong>Kira sözleşme bitiş tarihi:</strong> ${rentEndSlash || "...................."}</span>
      </div>
      <div><strong>Kira sözleşme süresi:</strong> ${durationStr}</div>
      <div style="margin-top: 4px; font-weight: bold;">
        Kiraya veren gayrimenkulü kiraya vermeyi ve kiracı gayrimenkulü kiralamayı kabul ve deruhte ederler.
      </div>
    </div>
  </div>

  <div style="margin-bottom: 14px;">
    <div style="font-size: 14px; font-weight: bold; color: #0f172a; margin-bottom: 4px;">Sözleşme Koşulları</div>
    <div style="font-size: 13.5px; font-weight: bold; color: #0f172a; text-decoration: underline; margin-bottom: 6px;">A - Genel Koşullar</div>
    <ol style="font-size: 12.5px; color: #0f172a; padding-left: 20px; text-align: justify; margin: 0;">
      <li style="margin-bottom: 5px;">Kiracı, gayrimenkulü kısmen veya tamamen başkasına kiraya veremez. Devir ve ciro edemez ve 3. şahısların istifadesine tahsis edemez.</li>
      <li style="margin-bottom: 5px;">Kiracı, gayrimenkulü anlaşmada yazılı olduğu şekilde kullanmak zorundadır. Kullanma tarzını, şeklini değiştiremez.</li>
      <li style="margin-bottom: 5px;">Kiracı, gayrimenkulü yasal tebliğ yeri kabul etmiş olup, iş bu kontrat yürürlükte olduğu sürece bu adrese yapılacak her türlü tebligatın kendi şahsına yapılmış sayılacağını şimdiden kabul ve beyan eder.</li>
      <li style="margin-bottom: 5px;">Kiracı, gayrimenkul dahilinde, gayrimenkulün menfaatine de olsa kiraya verenin yazılı rıza ve muvafakati olmadan değişiklik, tamirat ve ilave yapamaz. Taşıyıcı kolon ve kirişleri yıkamaz. Her hal ve şartta ana yapıya ve statiğine zarar verecek işler yapılamaz. Bu madde çerçevesi içinde onay alınarak dahi yapılan işlerden ortaya çıkacak hukuki, cezai, mali ve idari tüm ceza ve sorumluluklar kiracıya aittir. Aksi halin tahliye sebebi teşkil edeceğini taraflar kabul ve beyan ederler. Kiracı gayrimenkulü ne halde buldu ise kiraya verene o halde ve adete göre teslim etmeye mecburdur. Kiracı, kira dönemi sonunda gayrimenkulde yapmış olduğu tadilatlarla ilgili herhangi bir talepte bulunamaz.</li>
      <li style="margin-bottom: 5px;">Kiracı, Yasa ve Belediye mevzuatına ve nizamlara harfiyen uymak zorundadır. Gayrimenkulde kullanılacak olan elektrik, su, aidat yönetim ve yönetici giderleri kiracıya aittir. Bu borçların ödenmemesi tahliye nedenidir. Binaya ait vergi ve demirbaş giderleri mal sahibine aittir. Kiracı kira sözleşmesinin yapıldığı tarihten itibaren bir ay içinde gayrimenkule ait elektrik, su, telefon, ve internet aboneliklerini ilgili kurumlarla sözleşmelerini yaparak kendi üzerine alacak ve sözleşmelerin fotokopilerinin kiraya verene ulaştıracaktır. Kiracı sözleşmeyi KKTC vergi dairesinden pullatmakla yükümlüdür.</li>
      <li style="margin-bottom: 5px;">Kiracı, ödemekle yükümlü olduğu kira bedelini zamanında ödemez ise kiraya veren, bir ihbarname göndererek borcu derhal ödenmesini talep edebilecektir. Kira borcunun ödenmemesi yasal bir tahliye sebebidir ve bu durumda kiraya veren, kiracı aleyhinde KKTC Mahkemeleri'nde tahliye davası açacaktır.</li>
      <li style="margin-bottom: 5px;">İş bu sözleşmedeki yazılı olan bütün koşullar ve maddeler sözleşme fesh edilinceye ve hükümsüz kalıncaya kadar geçerlidir.</li>
      <li style="margin-bottom: 5px;">İş bu koşullar gayrimenkule ait kira sözleşmesinin ayrılmaz bir parçasıdır. Taraflar hükümlerin aynen tatbik edileceğini kabul, beyan ve taahhüt ederler. Bu sözleşmede yazılı bulunmayan hükümlere ihtiyaç duyulduğunda, sözleşmenin yapıldığı tarihteki yürürlükte bulunan ilgili tüm KKTC mevzuatı uygulanır.</li>
      <li style="margin-bottom: 5px;">İhtilaf vukuunda KKTC Mahkemeleri yetkilidir. Tebligat adresleri yukarıda belirtilen adreslerdir.</li>
    </ol>
  </div>

  <div style="margin-bottom: 14px;">
    <div style="font-size: 13.5px; font-weight: bold; color: #0f172a; text-decoration: underline; margin-bottom: 6px;">B - Özel Koşullar</div>
    <ol style="font-size: 12.5px; color: #0f172a; padding-left: 20px; text-align: justify; margin: 0;">
      <li style="margin-bottom: 5px;">Tahliye sonunda, gayrimenkulün demirbaşlarına zarar verilmediği ve kiracının ödemek zorunda olduğu faturaların ödendiği ibraz olduktan sonra alınan depozito miktarı kiracıya kiraya veren tarafından iade edilecektir. Eğer kiracı gayrimenkulü sözleşme süresi dolmadan önce tahliye ederse alınan depozito iade edilmeyecektir.</li>
      <li style="margin-bottom: 5px;">Kiracı gayrimenkulü süre sonunda tahliye etmek isterse, bunu iki ay önceden kiraya verene veya vekiline bildirecektir. Taraflar süre sonunda gayrimenkulün tahliyesi konusunda birbirlerine herhangi bir bildirimde bulunmadıkları taktirde kontrat kendiliğinden bir yıl daha uzar.</li>
      <li style="margin-bottom: 5px;">Kira akdinin bir yıl daha uzaması durumunda, yıllık kira artışı kiraya veren ve kiracı tarafından karşılıklı olarak anlaşma yoluna gidilecektir ve yeni sözleşme yapılacaktır. Şayet karşılıklı anlaşma sağlanamazsa kiracı gayrimenkulü tahliye edecektir.</li>
      <li style="margin-bottom: 5px;">Kiracı gayrimenkulü tahliye edeceği son ay içerisinde gayrimenkulü yeni kiracı adaylarına göstermek zorundadır.</li>
      <li style="margin-bottom: 5px;">Verilen Depozit kiraya sayılmaz. Gayrimenkul’ün tahliye edileceği gün kiraya veren ve kiracı birlikte gayrimenkulü, tüm eşya ve malzemeleri kontrol edip herhangi bir zarar ziyan ve arızalı yıpranmış kırılmış veya yırtılmış herhangi bir şey varsa elektrik, su, internet veya aidat borcu varsa tüm bu masraflar depozitodan karşılanacaktır. Eğer verilen depozit yetersiz kaldığı takdirde geriye kalan tüm masraflar kiracı tarafından karşılanacağını kiracı kabul ve taahhüt eder. Şayet herhangi bir zarar ziyan ve borç yoksa kiraya veren alınan depozit’i eksiksiz bir tamam iade edeceğini kabul ve taahhüt eder.</li>
      <li style="margin-bottom: 5px;">Kiracı, kiralananı kendi malı gibi kullanmaya, evsaf ve meziyetlerini şöhret ve itibarını kaybetmesine meydan vermemeye ve bina içinde meskun diğer kiracı/maliklere karşı özenli davranmaya mecburdur.</li>
      <li style="margin-bottom: 5px;">Kira sözleşmesinin sona erdirilmesi halinde kiralanan üzerinde yapılmış olan her türlü tadilat ve değişiklik kiralayan tarafından talep edilmesi halinde kiracı tarafından eski haline getirilecek ve kiralanan ilk teslim edildiği şekli ile kiraya verene teslim edilecektir. Kiracı bu yükümlülüğüne aykırı hareket etmesi halinde kiraya verenin kiralananı eski haline getirmek için yaptığı masrafların beş katı tutarında cezai şart bedeli ödemeyi kabul ve taahhüt eder.</li>
      <li style="margin-bottom: 5px;">Mal sahibi, yetkili veya sorumlu olan kişi normal zamanlarda kiracıya sözlü olarak bilgi vererek veya acil durumlarda bilgi vermeden kontrol veya hasar önlemek amacıyla gayrimenkule dilediği zaman girmeye yetkilidir.</li>
      <li style="margin-bottom: 5px;">İşbu sözleşmede yazan tüm maddeler kiracının kendi diline çevrilmiş ve şahitler huzurunda detaylı olarak anlatılıp imzalanmıştır.</li>
    </ol>
  </div>

  ${renderCustomClausesHtml(v.customClauses)}

  ${(v.isFurnishedRental || groupedFixtures.length > 0) ? `
  <div style="margin: 16px 0; border: 1.5px solid #0f172a; border-radius: 8px; overflow: hidden; background-color: #ffffff; page-break-inside: avoid;">
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

  <p style="font-size: 13px; font-weight: bold; text-align: justify; margin: 14px 0 22px 0; color: #0f172a;">
    Bu sözleşme 4 sayfa olarak düzenlenmiştir. ${clauseFormula} maddelik bu sözleşmenin bir nüshası kiracıya bir nüshası kiraya verene verilmiş ve yürürlüğe girmiştir.
  </p>

  <div style="margin-top: 22px; display: flex; justify-content: space-between; gap: 26px; page-break-inside: avoid;">
    <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 10px; padding: 14px; background-color: #f8fafc; display: flex; flex-direction: column; justify-content: space-between; min-height: 175px; font-size: 13px;">
      <div style="text-align: left;">
        <div style="font-weight: bold; color: #0f172a; text-decoration: underline; margin-bottom: 4px;">Kiraya veren:</div>
        <div><strong>Adı soyadı:</strong> ${landlordName}</div>
        <div><strong>${landlordIdType} No:</strong> ${landlordId}</div>
        <div><strong>Tel:</strong> ${landlordPhone || "Belirtilmedi"}</div>
      </div>
      <div style="margin-top: 6px;">
        <div style="font-size: 12px; font-weight: bold; color: #0f172a;">İmza:</div>
        ${renderSignatureOrStamp(
          v.sellerSigningName || landlordName,
          v.sellerSigned,
          v.sellerSignatureImage,
          v.isSigned ? "Kiraya Veren Onayı Bekleniyor" : "Önce Kiracı İmzası Bekleniyor"
        )}
      </div>
      <div style="font-size: 10px; color: #475569; text-align: center;">2. İmza (Final Onay) • Kiraya Veren</div>
    </div>

    <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 10px; padding: 14px; background-color: #f8fafc; display: flex; flex-direction: column; justify-content: space-between; min-height: 175px; font-size: 13px;">
      <div style="text-align: left;">
        <div style="font-weight: bold; color: #0f172a; text-decoration: underline; margin-bottom: 4px;">Kiracı:</div>
        <div><strong>Adı Soyadı:</strong> ${tenantName}</div>
        <div><strong>${tenantIdType} No:</strong> ${tenantId}</div>
        <div><strong>Tel.:</strong> ${tenantPhone || "Belirtilmedi"}</div>
      </div>
      <div style="margin-top: 6px;">
        <div style="font-size: 12px; font-weight: bold; color: #0f172a;">İmza:</div>
        ${renderSignatureOrStamp(
          v.signingName || tenantName,
          v.isSigned,
          v.signatureImage,
          "1. Öncelik: Kiracı İmzası Bekleniyor"
        )}
      </div>
      <div style="font-size: 10px; color: #475569; text-align: center;">1. İmza (Öncelikli) • Kiracı</div>
    </div>
  </div>

  <div style="margin-top: 22px; padding-top: 12px; border-top: 1px dashed #cbd5e1; font-size: 13px; color: #0f172a; page-break-inside: avoid;">
    <div style="font-weight: bold; margin-bottom: 6px;">Yukarıdaki İmzaların Tümüne Şahitler:</div>
    <div style="display: flex; justify-content: space-between; gap: 24px; flex-wrap: wrap;">
      <div style="flex: 1; min-width: 200px;">
        ${w1Name} ${w1Id}
      </div>
      <div style="flex: 1; min-width: 200px;">
        ${w2Name} ${w2Id}
      </div>
    </div>
  </div>
</div>
`;
      const markdown = `
# KİRA SÖZLEŞMESİ
**Tarih:** ${slashDate}
**KİRAYA VEREN:** ${landlordName} (${landlordIdType} - ${landlordId})
**KİRACI:** ${tenantName} (${tenantIdType} - ${tenantId})
**Taşınmazın Tanımı:** ${propDef} (${usagePurpose})
**Adresi:** ${propAddress}
**Bir Aylık Kira Bedeli:** ${formattedMonthlyRent}
**Ödeme Şekli & Şartları:** ${paymentMethodStr} / ${paymentTermsStr}
**Depozito:** ${depositSummaryStr}
**Süre:** ${rentStartSlash} - ${rentEndSlash} (${durationStr})
${v.isFurnishedRental ? `\n> **EŞYA VE DEMİRBAŞ ONAYI:** "Mülk'ü kiralarken içerisinde bulunan Eşya / demirbaşları inceledim, gördüm. Eşyalara ait resimleri de inceledim, gördüm. Onaylıyorum. kabulümdür."\n` : ''}${renderCustomClausesMarkdown(v.customClauses)}`;
      return { html, markdown };
    }
  },
  {
    id: "rental_authorization",
    titleTr: "Kiralama Yetki Belgesi",
    titleEn: "Rental Authorization Mandate",
    descriptionTr: "Mülk sahibinin (Kiraya Veren) gayrimenkul kiralama yetkisini emlak komisyoncusuna devrettiği resmi KKTC yetki belgesi sözleşmesi.",
    descriptionEn: "Official KKTC rental authorization agreement between Landlord/Owner and Real Estate Broker.",
    getTemplate: (v) => {
      const rawDate = (v.contractDate || new Date().toLocaleDateString("tr-TR")).trim();
      const slashDate = rawDate.replace(/\./g, "/");

      // Emlak Komisyoncusu (Tellal) - 2. İmza (Final Onay)
      const rawBrokerTitle = (
        v.sellerSigningName ||
        (v.ownerName && v.ownerName !== v.clientName ? v.ownerName : "") ||
        v.agentAndCompany ||
        v.storeName ||
        ""
      ).trim();
      const brokerTitle =
        !rawBrokerTitle ||
        rawBrokerTitle.toLowerCase().includes("seçkin") ||
        rawBrokerTitle.toLowerCase().includes("premium vip")
          ? "Rodel investment EMRAH CEYHAN"
          : rawBrokerTitle;

      const brokerIdentity = (
        v.authorizedPersonIdentity ||
        (v.sellerIdentity && !v.sellerIdentity.startsWith("[") ? v.sellerIdentity : "") ||
        "1170237140"
      ).trim();
      const brokerAddr = (
        v.brokerAddress || "Atatürk Caddesi No: 81/A Küçük Kaymaklı / Lefkoşa"
      ).trim();
      const rawBrokerPhone = (v.ownerPhone || v.storePhone || "").trim();
      const brokerPhone =
        !rawBrokerPhone || rawBrokerPhone.includes("5XX")
          ? "0 542 865 5000"
          : rawBrokerPhone;

      // Kiraya Veren / Yetkilisi (Mülk Sahibi) - 1. İmza (Öncelikli)
      const landlordName =
        v.clientName && !v.clientName.startsWith("[")
          ? v.clientName.trim()
          : "................................................................................................................................................";
      const landlordId =
        v.clientIdentity && !v.clientIdentity.startsWith("[")
          ? v.clientIdentity.trim()
          : "";
      const landlordAddr =
        v.clientAddress && v.clientAddress.trim()
          ? v.clientAddress.trim()
          : "................................................................................................................................................";
      const landlordPhone =
        v.clientPhone && !v.clientPhone.startsWith("[")
          ? v.clientPhone.trim()
          : "................................................................................................................................................";

      // Sözleşmenin Konusu: Taşınmazın Adresi & Cinsi ve Özellikleri (İlan açıklaması ASLA kullanılmaz!)
      const rawPropAddr = [
        v.propertyAddress && v.propertyAddress !== "Belirtilmemiş adres" ? v.propertyAddress.trim() : "",
        v.propertyLocation && (!v.propertyAddress || !v.propertyAddress.includes(v.propertyLocation)) ? v.propertyLocation.trim() : "",
        v.kocanNo ? `Koçan No: ${v.kocanNo}` : "",
        v.adaNo ? `Ada/Blok: ${v.adaNo}` : "",
        v.parselNo ? `Parsel: ${v.parselNo}` : v.propertyBlockPlot ? `Parsel: ${v.propertyBlockPlot}` : ""
      ]
        .filter(Boolean)
        .join(" • ");

      const propAddrDisplay =
        rawPropAddr ||
        ".........................................................................................................................................";

      const propTypeFeaturesDisplay =
        (v.authPropertyTypeFeatures || v.rentalPropertyDef || "").trim() ||
        ".........................................................................................................................................";

      // a) Kira Bedeli: Tutar (Yazı ile)
      const rentCurr = (v.rentCurrency || "TL").toUpperCase();
      const currMeta = getCurrencyMeta(rentCurr);
      const rawRentNum = parseNumericAmount(v.rentPriceRaw ?? v.propertyPrice);
      const rentNumFormatted = rawRentNum > 0 ? `${rawRentNum.toLocaleString("tr-TR")} ${currMeta.codeLabel}` : "...................................................";
      const rentWordsFormatted = rawRentNum > 0 ? `${numberToTurkishWords(rawRentNum)} ${currMeta.wordLabel}` : "...................................................";

      // b) Güvence Bedeli (Depozito): Tutar (Yazı ile)
      const formatAmountAndWordsPair = (rawVal?: string, fallbackText?: string) => {
        const clean = (rawVal || "").trim();
        if (!clean) {
          return {
            amount: fallbackText || "...................................................",
            words: "..................................................."
          };
        }
        const onlyDigitsAndSeps = /^[\d.,\s]+(TL|TRY|GBP|EUR|USD|£|\$|€|₺)?$/i.test(clean);
        const num = parseNumericAmount(clean);
        if (onlyDigitsAndSeps && num > 0) {
          return {
            amount: `${num.toLocaleString("tr-TR")} ${currMeta.codeLabel}`,
            words: `${numberToTurkishWords(num)} ${currMeta.wordLabel}`
          };
        }
        const parenMatch = clean.match(/^([^(]+)\(([^)]+)\)$/);
        if (parenMatch) {
          return {
            amount: parenMatch[1].trim(),
            words: parenMatch[2].trim()
          };
        }
        if (/(\d+)\s*ayl[ıi]k/i.test(clean)) {
          const m = clean.match(/(\d+)/);
          const mNum = m ? parseInt(m[1], 10) : 1;
          const totalNum = rawRentNum > 0 ? rawRentNum * mNum : 0;
          return {
            amount: totalNum > 0 ? `${clean} - ${totalNum.toLocaleString("tr-TR")} ${currMeta.codeLabel}` : clean,
            words: totalNum > 0 ? `${numberToTurkishWords(totalNum)} ${currMeta.wordLabel}` : `${numberToTurkishWords(mNum)} Aylık Kira Bedeli`
          };
        }
        return {
          amount: clean,
          words: "Yukarıda Belirtilen Şartlarda"
        };
      };

      const depPair = formatAmountAndWordsPair(v.depositAmount, "2 Aylık Kira Bedeli");
      const advPair = formatAmountAndWordsPair(v.authAdvancePayment, "1 Aylık Kira Bedeli");
      const annualIncDisplay =
        (v.authAnnualIncreaseRate || "").trim() ||
        ".........................................................................................................................................";
      const tenantCriteriaDisplay =
        (v.authTenantCriteria || "").trim() ||
        "....................................................................................................................................................................................................................";

      // C- Sözleşmenin süresi .... aydır.
      const rawDuration = (v.contractDuration || "6 (Altı)").trim();
      const durationCleanMonths = rawDuration
        .replace(/\/\s*12\s*Months/gi, "")
        .replace(/\b(aydır|aydir|ay)\b/gi, "")
        .trim() || "6 (Altı)";

      // J- Nüsha sayısı
      const copiesCountDisplay = (v.authCopiesCount || "2 (İki)").trim();

      const signerLandlordLabel =
        v.signingName && !v.signingName.startsWith("[")
          ? v.signingName.trim()
          : v.clientName && !v.clientName.startsWith("[")
          ? v.clientName.trim()
          : "Kiraya Veren / Yetkili";

      const html = `
<div style="font-family: 'Times New Roman', Georgia, serif; max-width: 800px; margin: 0 auto; padding: 28px 34px; color: #0f172a; line-height: 1.56; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px;">
  <div style="text-align: center; margin-bottom: 16px;">
    <h1 style="font-size: 19px; font-weight: bold; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.04em; text-decoration: underline;">
      KİRALIKLARDA YETKİ BELGESİ SÖZLEŞMESİ
    </h1>
  </div>

  <div style="margin-bottom: 12px; font-size: 13px; color: #0f172a;">
    <div style="font-weight: bold; text-decoration: underline; margin-bottom: 4px;">1- TARAFLAR</div>
    
    <div style="margin-bottom: 8px; padding: 8px 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px;">
      <div style="font-weight: bold; color: #0f172a;">Emlak Komisyoncusu (Tellal)</div>
      <div><strong>Adı, Soyadı-Ünvanı :</strong> ${brokerTitle}</div>
      <div><strong>K / P / MŞ NO :</strong> ${brokerIdentity}</div>
      <div><strong>Adresi :</strong> ${brokerAddr}</div>
      <div><strong>TeL:</strong> ${brokerPhone}</div>
      <div style="font-style: italic; font-size: 12px; color: #334155; margin-top: 2px;">
        (Bu sözleşme süresince "Tellal" ; "Emlak Komisyoncusu" olarak anılacaktır.)
      </div>
    </div>

    <div style="padding: 8px 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px;">
      <div style="font-weight: bold; color: #0f172a;">Kiraya Veren / Yetkilisi</div>
      <div>
        <strong>Adı Soyadı-Ünvanı :</strong> ${landlordName}
        ${landlordId ? `<span style="margin-left: 12px;"><strong>Kimlik / Pasaport No :</strong> ${landlordId}</span>` : ""}
      </div>
      <div><strong>Adresi :</strong> ${landlordAddr}</div>
      <div><strong>Telefonu :</strong> ${landlordPhone}</div>
    </div>
  </div>

  <div style="margin-bottom: 12px; font-size: 13px; color: #0f172a;">
    <div style="font-weight: bold; text-decoration: underline; margin-bottom: 4px;">SÖZLEŞMENİN KONUSU</div>
    <p style="margin: 0 0 6px 0; text-align: justify;">
      Aşağıda bilgileri bulunan taşınmazın, 3. maddede yazılı şartlar çerçevesinde kiraya verilmesi ve kira sözleşmesinin hazırlanması imkanın sağlanması hususunda Emlak Komisyoncusuna gerekli yetkinin verilmesi ve bu konuda tarafların hak ve yükümlülükleri
    </p>
    <div style="padding: 8px 12px; background: #ffffff; border: 1.5px solid #0f172a; border-radius: 6px;">
      <div style="margin-bottom: 4px;"><strong>Taşınmazın Adresi :</strong> ${propAddrDisplay}</div>
      <div><strong>Cinsi ve Özellikleri :</strong> ${propTypeFeaturesDisplay}</div>
    </div>
  </div>

  <div style="margin-bottom: 12px; font-size: 12.5px; color: #0f172a; text-align: justify;">
    <div style="font-size: 13px; font-weight: bold; text-decoration: underline; margin-bottom: 6px;">SÖZLEŞMENİN ŞARTLARI</div>

    <div style="margin-bottom: 6px;">
      <strong>A-</strong> Emlak Komisyoncusu, 2. Maddede açık adresi belirtilen taşınmaza, aşağıda kira şartları ile kiracı bulmak ve kiraya veren ile karşı karşıya gelmelerini sağlamayı yükümlenir. Emlak Komisyoncusu, bu hizmeti bizzat yürüteceği gibi bir başka Emlak Komisyoncusu ile de ortak hareket edebilir. Kiraya verenin talep ettiği şartlar ve özellikler:
      <div style="padding-left: 16px; margin-top: 4px; line-height: 1.65;">
        <div><strong>a) Kira Bedeli :</strong> ${rentNumFormatted} ( ${rentWordsFormatted} )</div>
        <div><strong>b) Güvence Bedeli :</strong> ${depPair.amount} ( ${depPair.words} )</div>
        <div><strong>c) Peşinat :</strong> ${advPair.amount} ( ${advPair.words} )</div>
        <div><strong>d) Yıllık artış oranı :</strong> ${annualIncDisplay}</div>
      </div>
    </div>

    <div style="margin-bottom: 6px;">
      <strong>B) Kiracı adayında aranılacak başlıca özellikler :</strong> ${tenantCriteriaDisplay}
    </div>

    <div style="margin-bottom: 6px;">
      <strong>C-</strong> Sözleşmenin süresi <strong>${durationCleanMonths}</strong> aydır. Sözleşme süresi içinde taraflar, -mücbir sebepler dışında sözleşmeyi tek yanlı olarak feshedemezler. Kiraya veren, henüz süre dolmadan sözleşmeyi tek yanlı olarak feshederse bu takdirde; Emlak Komisyoncusuna, işbu sözleşmede yazılı kira bedeli üzerinden bir aylık kira bedeli kadar bir meblağı derhal ödemeyi kabul ve taahhüt eder.
    </div>

    <div style="margin-bottom: 6px;">
      <strong>D-</strong> Taraflar, sözleşme bitiminde 15 gün öncesine kadar, karşı tarafa sözleşmenin yenilenmeyeceğini yazılı olarak ihbar etmedikleri takdirde, sözleşme aynı koşullarla ve C Fıkrasında belirtilen süre kadar yenilenmiş olur.
    </div>

    <div style="margin-bottom: 6px;">
      <strong>E-</strong> Kiraya veren, işbu sözleşme süresince taşınmazın kiraya verilmesi amacıyla pazarlanması için başka hiçbir kişi veya kuruluşa yetki veremeyeceği gibi bizzat kendisi de kiraya veremez. Aksi halde kiraya veren, sözleşmede belirtilen kira bedelinin üzerinden bir kira bedeli oranındaki bir meblağı, Emlak komisyoncusuna ödemeyi kabul ve taahhüt eder.
    </div>

    <div style="margin-bottom: 6px;">
      <strong>F-</strong> Kiraya veren, Emlak komisyoncusunun; sözleşmedeki özel ve genel şartlar çerçevesinde bulup önerdiği kiracı adayı ile kira sözleşmesi yapmaktan imtina ederse; kira sözleşmesinin yapılması imkanını sağlamış olmakla görevini tamamlamış bulunan Emlak Komisyoncusuna; sözleşmede belirtilen kira bedeli üzerinden bir aylık kira bedeli oranındaki bir meblağı, "Tellaliye ücreti" olarak ödemeyi kabul ve taahhüt eder.
    </div>

    <div style="margin-bottom: 6px;">
      <strong>G-</strong> Emlak Komisyoncusunun, bulup kiraya verene önerdiği kiracı adaylarına ilişkin değerlendirmenin sözleşmenin bitim tarihini aşması halinde, bu konuda kiraya verenin cevabını bildirinceye kadar geçecek süre, sözleşme süresi içinde sayılır ve bu halde de sözleşme koşulları aynen uygulanır.
    </div>

    <div style="margin-bottom: 6px;">
      <strong>H-</strong> Emlak komisyoncusunun işbu sözleşmeden doğacak alacaklarının zamanında ödenmemesi halinde aylık %10 temerrüt faizi uygulanır.
    </div>

    <div style="margin-bottom: 6px;">
      <strong>I-</strong> İşbu sözleşmede şayet mal sahibi bir vekille (Yetkiliyle) temsil edilmişse vekalete dayalı yetkinin varlığı ve geçerliliğini "vekil" olduğunu beyan eden kişi ispat etmek zorundadır. Yetkisiz temsil veya vekaletin hükümsüzlüğü gibi hallerde işbu sözleşme ile Mal sahibine yüklenilen bütün borçlar ve sorumluluklar vekaleten imza koyan kişiye aittir.
    </div>

    <div style="margin-bottom: 6px;">
      <strong>İ-</strong> İşbu sözleşmeden doğacak uyuşmazlıkların çözümünde, KKTC Mahkemeleri ve İcra Daireleri yetkilidir.
    </div>

    ${renderCustomClausesHtml(v.customClauses)}

    <div style="margin-top: 8px; font-weight: bold;">
      <strong>J-</strong> İşbu sözleşme <strong>${copiesCountDisplay}</strong> nüsha düzenlenmiş olup; taraflarca birer nüshası tevdi edilmiştir. <strong>${slashDate}</strong>
    </div>
  </div>

  <div style="margin-top: 22px; display: flex; justify-content: space-between; gap: 28px; page-break-inside: avoid;">
    <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 10px; padding: 14px; text-align: center; background-color: #f8fafc; display: flex; flex-direction: column; justify-content: space-between; min-height: 165px;">
      <div>
        <div style="font-size: 13px; font-weight: bold; color: #0f172a; text-decoration: underline;">KİRAYA VEREN / YETKİLİ</div>
        <div style="font-size: 12.5px; font-weight: bold; color: #1e293b; margin-top: 4px;">${signerLandlordLabel}</div>
      </div>
      ${renderSignatureOrStamp(
        signerLandlordLabel,
        v.isSigned,
        v.signatureImage,
        "1. Öncelik: Kiraya Veren (Mülk Sahibi) İmzası Bekleniyor"
      )}
      <div style="font-size: 10px; color: #64748b;">1. İmza (Öncelikli) • Kiraya Veren / Mülk Sahibi</div>
    </div>

    <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 10px; padding: 14px; text-align: center; background-color: #f8fafc; display: flex; flex-direction: column; justify-content: space-between; min-height: 165px;">
      <div>
        <div style="font-size: 13px; font-weight: bold; color: #0f172a; text-decoration: underline;">EMLAK KOMİSYONCUSU</div>
        <div style="font-size: 12.5px; font-weight: bold; color: #1e293b; margin-top: 4px;">${brokerTitle}</div>
      </div>
      ${renderSignatureOrStamp(
        brokerTitle,
        v.sellerSigned,
        v.sellerSignatureImage,
        v.isSigned ? "Emlak Komisyoncusu Final Onayı Bekleniyor" : "Önce Kiraya Veren İmzası Bekleniyor"
      )}
      <div style="font-size: 10px; color: #64748b;">2. İmza (Final Onay) • Emlak Komisyoncusu</div>
    </div>
  </div>
</div>
`;
      const markdown = `# KİRALIKLARDA YETKİ BELGESİ SÖZLEŞMESİ
**Tarih:** ${slashDate}
**Emlak Komisyoncusu (Tellal):** ${brokerTitle} (K/P/MŞ No: ${brokerIdentity}) - ${brokerAddr} - Tel: ${brokerPhone}
**Kiraya Veren / Yetkilisi:** ${landlordName} - Adres: ${landlordAddr} - Tel: ${landlordPhone}
**Taşınmazın Adresi:** ${propAddrDisplay}
**Cinsi ve Özellikleri:** ${propTypeFeaturesDisplay}
**a) Kira Bedeli:** ${rentNumFormatted} (${rentWordsFormatted})
**b) Güvence Bedeli:** ${depPair.amount} (${depPair.words})
**c) Peşinat:** ${advPair.amount} (${advPair.words})
**d) Yıllık Artış Oranı:** ${annualIncDisplay}
**B) Kiracı Adayında Aranılacak Özellikler:** ${tenantCriteriaDisplay}
**C) Yetki Süresi:** ${durationCleanMonths} ay
${renderCustomClausesMarkdown(v.customClauses)}`;
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

  <div style="margin-bottom: 30px; text-align: justify; font-size: 12px; font-style: italic; color: #475569;">
    I, the tenant, hereby declare and undertake to vacate the property specified above on <strong>${v.evictionDate || '[Eviction Date]'}</strong> without any further notice, unconditionally, and to return all furnishings and items received upon leasing the property completely, fully, and in the exact cosmetic condition they were received, to the landlord or their authorized representatives/institutions. If I fail to vacate on the specified date, I agree to be responsible for all legal costs and damages incurred by the landlord.
  </div>

  ${renderCustomClausesHtml(v.customClauses)}

  <div style="margin-top: 40px; display: flex; justify-content: flex-end;">
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
${renderCustomClausesMarkdown(v.customClauses)}`;
      return { html, markdown };
    }
  },
  {
    id: "external_partner_revenue_share",
    titleTr: "Paydaş Gelir Paylaşım Protokolü",
    titleEn: "Partner Revenue Share Agreement",
    descriptionTr: "Dış iş ortağı, portföy/müşteri yönlendiren paydaş için dijital hakediş ve komisyon güvence protokolü.",
    descriptionEn: "Digital commission protection and revenue share agreement for external freelance/partner stakeholders.",
    getTemplate: (v) => {
      const partner = v.partnerName || v.clientName || "Dış İş Ortağı / Paydaş";
      const partnerRole = v.partnerRole || "Portföy & Müşteri Paydaşı";
      const commRate = v.commissionPercentage || "%20";
      const payout = v.estimatedPayout || "Hesaplanan Komisyon Payı";
      const calcType = v.calculationType || "Ortak Masraflar Düşüldükten Sonra Net Hakediş";

      const html = `
<div style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #0f172a; line-height: 1.6; background-color: #ffffff;">
  <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px double #0f172a; padding-bottom: 20px;">
    <div style="font-size: 11px; font-weight: 900; letter-spacing: 0.15em; color: #4338ca; text-transform: uppercase; margin-bottom: 5px;">LOOKPRICE EMLAK EKOSİSTEMİ • AKILLI HAKEDİŞ SÖZLEŞMESİ</div>
    <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">DIŞ PAYDAŞ GELİR PAYLAŞIM PROTOKOLÜ</h1>
    <h2 style="font-size: 13px; font-weight: bold; color: #64748b; margin: 5px 0 0 0; text-transform: uppercase;">EXTERNAL PARTNER REVENUE SHARE & COMMISSION AGREEMENT</h2>
  </div>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; font-size: 13px; background-color: #f8fafc; padding: 15px; border-radius: 10px; border: 1px solid #e2e8f0;">
    <div>
      <strong style="color: #4338ca;">1. YETKİLİ OFİS / FİRMA:</strong><br/>
      Firma Adı: <strong>${v.storeName}</strong><br/>
      İletişim Tel: ${v.storePhone || 'Ofis Kaydı'}<br/>
      E-posta: ${v.storeEmail || 'info@lookprice.net'}
    </div>
    <div>
      <strong style="color: #4338ca;">2. DIŞ PAYDAŞ / ÇÖZÜM ORTAĞI:</strong><br/>
      Adı Soyadı / Firma: <strong>${partner}</strong><br/>
      Rol / Görev: <strong>${partnerRole}</strong><br/>
      Telefon: ${v.clientPhone || 'Belirtilmiş Paydaş İletişimi'}
    </div>
  </div>

  <div style="background-color: #f1f5f9; padding: 15px; border-radius: 10px; border: 1px solid #cbd5e1; margin-bottom: 25px; font-size: 13px;">
    <strong style="color: #0f172a; text-transform: uppercase;">İşleme Konu Portföy ve Hizmet Bedeli Matrisi:</strong><br/>
    Taşınmaz Bilgisi: <strong>${v.propertyTitle}</strong> [${v.propertyLocation || 'KKTC'}]<br/>
    Portföy Referans No: <strong>${v.propertyBlockPlot || 'REF'}</strong><br/>
    Mülk Liste / Satış Bedeli: <strong>${v.propertyPrice}</strong><br/>
    Paydaş Hakediş Oranı: <span style="font-size: 15px; font-weight: 900; color: #047857; background: #ecfdf5; padding: 2px 8px; border-radius: 6px; border: 1px solid #a7f3d0;">${commRate}</span><br/>
    Hesaplama Modeli: <strong>${calcType}</strong><br/>
    Tahmini / Kesin Hakediş Tutarı: <strong>${payout}</strong>
  </div>

  <div style="margin-bottom: 25px; text-align: justify; font-size: 13px; line-height: 1.8;">
    <strong>MADDE 1 - SÖZLEŞMENİN KONUSU VE KAPSAMI:</strong><br/>
    İşbu protokol, yukarıda bilgileri yer alan taşınmazın satış veya kiralama aracılık faaliyetleri neticesinde elde edilecek toplam aracılık komisyonundan (hizmet bedelinden), Dış Paydaş <strong>${partner}</strong> adına tahakkuk edecek gelir paylaşımı hakediş oranını ve ödeme şartlarını taraflar arasında hukuki ve dijital olarak güvence altına alır.
  </div>

  <div style="margin-bottom: 25px; text-align: justify; font-size: 13px; line-height: 1.8;">
    <strong>MADDE 2 - HAKEDİŞİN KESİNLEŞMESİ VE ÖDEME ZAMANI:</strong><br/>
    Taşınmazın alıcı/kiracı ile resmi sözleşme imzalanması ve hizmet bedelinin ofis hesaplarına intikal etmesini müteakip en geç <strong>3 (üç) iş günü</strong> içerisinde, paydaşın payına düşen <strong>${commRate} (${payout})</strong> tutarındaki meblağ, paydaşın beyan edeceği banka/IBAN hesabına kesintisiz olarak ödenecektir.
  </div>

  <div style="margin-bottom: 25px; text-align: justify; font-size: 13px; line-height: 1.8; background-color: #fffbeb; padding: 12px; border-left: 4px solid #f59e0b; border-radius: 4px;">
    <strong>MADDE 3 - DEĞİŞMEZLİK VE OVERRIDE KORUMASI (IMMUTABILITY):</strong><br/>
    İşbu protokol taraflarca dijital olarak onaylandığı andan itibaren LookPrice Emlak Çekirdeği üzerinde Kilitli (Locked) statüye geçer. Ofis yöneticisi, çalışan veya herhangi bir üçüncü şahıs tarafından tek taraflı olarak paydaş silinemez, hakediş oranı düşürülemez veya yok sayılamaz. Zorunlu revizyonlar ancak tarafların karşılıklı yeni dijital onayı ve sistem denetim kaydı (audit trail) ile geçerlilik kazanır.
  </div>

  ${renderCustomClausesHtml(v.customClauses)}

  <div style="margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
    <div style="text-align: center; border: 1px solid #cbd5e1; padding: 15px; border-radius: 12px; background-color: #f8fafc; min-height: 140px; display: flex; flex-direction: column; justify-content: space-between;">
      <span style="font-size: 11px; font-weight: bold; color: #475569; text-transform: uppercase;">YETKİLİ EMLAK OFİSİ</span>
      <div style="font-size: 12px; font-weight: 900; color: #0f172a;">${v.storeName}</div>
      <div style="font-size: 9px; color: #64748b;">Kurumsal Onay • Tarih: ${v.contractDate}</div>
    </div>

    <div style="text-align: center; border: 1px solid #cbd5e1; padding: 15px; border-radius: 12px; background-color: #f8fafc; min-height: 140px; display: flex; flex-direction: column; justify-content: space-between;">
      <span style="font-size: 11px; font-weight: bold; color: #475569; text-transform: uppercase;">DIŞ PAYDAŞ (HAK SAHİBİ)</span>
      ${renderSignatureOrStamp(partner, v.isSigned, v.signatureImage)}
      <div style="font-size: 9px; color: #64748b;">Mobil / Tokenized Dijital İmza • ${v.contractDate}</div>
    </div>
  </div>
</div>
`;
      const markdown = `
# DIŞ PAYDAŞ GELİR PAYLAŞIM PROTOKOLÜ
**Yetkili Ofis:** ${v.storeName}
**Dış Paydaş:** ${partner} (${partnerRole})
**Mülk:** ${v.propertyTitle}
**Komisyon Payı:** ${commRate} (${payout})
**Tarih:** ${v.contractDate}
${renderCustomClausesMarkdown(v.customClauses)}`;
      return { html, markdown };
    }
  },
  {
    id: "offer_letter",
    titleTr: "Fiyat Teklif Mektubu",
    titleEn: "Property Purchase Offer Letter",
    descriptionTr: "Potansiyel alıcının mülk sahibine sunduğu resmi satın alma fiyat teklif mektubu.",
    descriptionEn: "Official purchase price offer letter from prospective buyer to property owner.",
    getTemplate: (v: ContractPlaceholderValues) => {
      const ownerName = (v.ownerName || "Mülk Sahibi").trim();
      const buyerName = (v.signingName || v.clientName || "Potansiyel Alıcı").trim();
      const currentDate = (v.contractDate || new Date().toLocaleDateString("tr-TR")).trim();
      const viewingDate = (v.viewingDate || currentDate).trim();
      const propDetails = (v.offerPropertyDetails || v.propertyAddress || v.propertyLocation || v.propertyTitle || "KKTC").trim();
      const natureInf = getPropertyNatureInflections(v.offerPropertyNature || v.propertyTitle);
      const agentCompany = (
        v.agentAndCompany ||
        `${v.storeName || "Seçkin Emlak"}`
      ).trim();
      const formattedOffer = formatOfferPriceWithWords(v.offerPrice || v.propertyPrice || "");
      const validityPeriod = (v.offerValidityPeriod || "7 (yedi) gün").trim();
      const freeNotes = (v.offerFreeNotes || "").trim();

      const html = `
        <div style="font-family: 'Times New Roman', Georgia, serif; color: #0f172a; line-height: 1.75; max-width: 780px; margin: 0 auto; padding: 28px 32px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 16px;">
            <h1 style="font-size: 22px; font-weight: bold; letter-spacing: 0.08em; margin: 0; color: #0f172a; text-decoration: underline;">TEKLİF MEKTUBU</h1>
          </div>

          <div style="text-align: right; font-size: 14px; font-weight: bold; color: #1e293b; margin-bottom: 24px;">
            ${currentDate}
          </div>

          <div style="font-size: 15px; font-weight: bold; color: #0f172a; margin-bottom: 20px; padding-left: 28px;">
            Sn. ${ownerName}
          </div>

          <p style="font-size: 15px; text-align: justify; margin-bottom: 18px; color: #0f172a;">
            <strong>${propDetails}</strong> bulunan <strong>${natureInf.accusative}</strong> <strong>${viewingDate}</strong> tarihinde <strong>${agentCompany}</strong> aracılığıyla görüp incelemiş bulunmaktayız. Bu <strong>${natureInf.instrumental}</strong> ciddi olarak ilgileniyoruz.
          </p>

          <p style="font-size: 15px; text-align: justify; text-indent: 28px; margin-bottom: 18px; color: #0f172a;">
            Söz konusu gayrimenkulü beğendik ve satın almayı arzu ediyoruz. Yukarıda yazılı olan gayrimenkulünüzü satın almak için <strong style="color: #1e1b4b; background: #fef3c7; padding: 2px 6px; border-radius: 4px;">${formattedOffer}</strong> öneriyoruz.
          </p>

          <p style="font-size: 15px; text-align: justify; margin-bottom: 28px; color: #0f172a;">
            Bu teklif ${freeNotes ? `<strong>${freeNotes}</strong> koşuluyla ve ` : ""}<strong>${validityPeriod}</strong> süre ile geçerlidir.
          </p>

          ${renderCustomClausesHtml(v.customClauses)}

          <div style="margin-top: 36px; padding-top: 18px; border-top: 1px dashed #cbd5e1;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
              <div style="font-size: 14px; font-weight: bold; color: #0f172a; min-width: 220px;">
                <div>Mülk Sahibi (Kabul / Onay)</div>
                <div style="font-size: 14px; font-weight: bold; color: #0f172a; margin-top: 4px;">${ownerName}</div>
                ${renderSignatureOrStamp(
                  v.sellerSigningName || ownerName,
                  v.sellerSigned,
                  v.sellerSignatureImage,
                  v.isSigned ? "Mülk Sahibi Onayı Bekleniyor" : "Önce Teklif Sahibi İmzalar"
                )}
              </div>
              <div style="text-align: right; min-width: 220px;">
                <div style="font-size: 14px; font-weight: bold; color: #0f172a;">Teklif Sahibi (Alıcı)</div>
                <div style="font-size: 15px; font-weight: bold; color: #0f172a; margin-bottom: 6px; margin-top: 4px;">${buyerName}</div>
                ${renderSignatureOrStamp(buyerName, v.isSigned, v.signatureImage, "1. Öncelik: Alıcı İmzası Bekleniyor")}
                <div style="font-size: 13px; font-weight: bold; color: #334155; margin-top: 10px;">${currentDate}</div>
              </div>
            </div>
          </div>

          <div style="margin-top: 28px; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-family: sans-serif; font-size: 11px; color: #475569; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
            <span><strong>Aracı Kurum / Danışman:</strong> ${agentCompany}</span>
            ${v.clientPhone ? `<span><strong>Teklif Sahibi İletişim:</strong> ${v.clientPhone}</span>` : ""}
          </div>
        </div>
      `;

      const markdown = `# TEKLİF MEKTUBU
**Tarih:** ${currentDate}

**Sn. ${ownerName}**

**${propDetails}** bulunan **${natureInf.accusative}** **${viewingDate}** tarihinde **${agentCompany}** aracılığıyla görüp incelemiş bulunmaktayız. Bu **${natureInf.instrumental}** ciddi olarak ilgileniyoruz.

Söz konusu gayrimenkulü beğendik ve satın almayı arzu ediyoruz. Yukarıda yazılı olan gayrimenkulünüzü satın almak için **${formattedOffer}** öneriyoruz.

Bu teklif ${freeNotes ? `**${freeNotes}** koşuluyla ve ` : ""}**${validityPeriod}** süre ile geçerlidir.
${renderCustomClausesMarkdown(v.customClauses)}
---
**Teklif Sahipleri:** ${buyerName}
**İmza Durumu:** ${v.isSigned ? "DİJİTAL ONAYLI İMZALANDI" : "- İmza -"}
**Tarih:** ${currentDate}
`;

      return { html, markdown };
    }
  },
  {
    id: "consultant_partnership",
    titleTr: "Danışman İş Ortaklığı Sözleşmesi",
    titleEn: "Real Estate Consultant Partnership Agreement",
    descriptionTr: "İşletmeye katılan gayrimenkul danışmanı ile ofis arasındaki çalışma ve komisyon paylaşım sözleşmesi.",
    descriptionEn: "Partnership, exclusivity, and commission split agreement between the agency and real estate consultant.",
    getTemplate: (v: ContractPlaceholderValues) => {
      const storeTitle = (v.storeName && !v.storeName.toLowerCase().includes("lookprice") ? v.storeName : "Rodel Investment").trim();
      const authName = (v.authorizedPersonName || v.ownerName || "EMRAH CEYHAN").trim();
      const authId = (v.authorizedPersonIdentity || "1170237140").trim();
      const authIdType = (v.authorizedPersonIdType || "KKTC Kimlik").trim();

      const consultantName = (v.signingName || v.clientName || "Gayrimenkul Danışmanı").trim();
      const consultantId = (v.clientIdentity || "Belirtilmedi").trim();
      const consultantIdType = (v.consultantIdType || "Kimlik / Pasaport").trim();
      const currentDate = (v.contractDate || new Date().toLocaleDateString("tr-TR")).trim();

      const noticeDays = (v.noticePeriodDays || "30").toString().replace(/[^\d]/g, "") || "30";
      const offSplit = (v.officeSplitRate || "50").toString().replace(/[^\d]/g, "") || "50";
      const consSplit = (v.consultantSplitRate || "50").toString().replace(/[^\d]/g, "") || "50";
      const isDirectEqual = offSplit === "50" && consSplit === "50";

      const rawExtSplit = (v.externalOfficeSplitRate || "50 - 50").trim();
      const extMatches = rawExtSplit.match(/\d+/g);
      const extOff1 = extMatches && extMatches[0] ? extMatches[0] : "50";
      const extOff2 = extMatches && extMatches[1] ? extMatches[1] : "50";

      const extIntOff = (v.externalInternalOfficeRate || offSplit || "50").toString().replace(/[^\d]/g, "") || "50";
      const extIntCons = (v.externalInternalConsultantRate || consSplit || "50").toString().replace(/[^\d]/g, "") || "50";
      const isExtIntEqual = extIntOff === "50" && extIntCons === "50";

      const customLines = parseCustomClauseLines(v.customClauses);
      const clauseFormula = customLines.length > 0 ? `4+4+5+${customLines.length}` : "4+4+5";

      const html = `
        <div style="font-family: 'Times New Roman', Georgia, serif; color: #0f172a; line-height: 1.65; max-width: 790px; margin: 0 auto; padding: 28px 34px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 10px;">
            <h1 style="font-size: 20px; font-weight: bold; letter-spacing: 0.04em; margin: 0; color: #0f172a; text-transform: uppercase;">EMLAK DANIŞMAN İŞ ORTAKLIĞI SÖZLEŞMESİ</h1>
          </div>

          <div style="text-align: right; font-size: 13.5px; font-weight: bold; color: #0f172a; margin-bottom: 18px;">
            TARİH: ${currentDate}
          </div>

          <p style="font-size: 14px; text-align: justify; text-indent: 28px; margin: 0 0 8px 0; color: #0f172a;">
            Bir tarafta <strong>${storeTitle}</strong> firması sahibi <strong>${authId}</strong> ${authIdType} hamili <strong>${authName}</strong> bundan böyle <strong>‘’Yetkili’’</strong> olarak anılacaktır.
          </p>

          <p style="font-size: 14px; text-align: justify; text-indent: 28px; margin: 0 0 18px 0; color: #0f172a;">
            Bir tarafta <strong>${consultantId}</strong> ${consultantIdType} hamili <strong>${consultantName}</strong> bundan böyle <strong>‘’Danışman’’</strong> olarak anılacaktır.
          </p>

          <div style="margin-bottom: 14px;">
            <div style="font-size: 14.5px; font-weight: bold; color: #0f172a; text-decoration: underline; margin-bottom: 6px;">Şartlar:</div>
            <ol style="font-size: 13.5px; color: #0f172a; margin: 0; padding-left: 22px; text-align: justify;">
              <li style="margin-bottom: 4px;">Danışman; başka bir emlak ofisi, emlakçı, danışman veya broker ile çalışmayacaktır.</li>
              <li style="margin-bottom: 4px;">Danışman; hiçbir Emlak (Gayrimenkul) alım – satım – kiralama işini yetkilinin haberi, izni ve bilgisi olmadan yapmayacaktır.</li>
              <li style="margin-bottom: 4px;">Danışman iş ortaklığından vazgeçmeden, en az <strong>${noticeDays}</strong> gün önceden yetkiliye bildirir.</li>
              <li style="margin-bottom: 4px;">Danışman iş ortaklığından vazgeçerken tüm portföy ofise kalıp yarım kalan işler tamamlanıp komisyon bedeli anlaşılan oranlarda paylaşıldıktan sonra iş ortaklığından ancak öyle vazgeçebilir.</li>
            </ol>
          </div>

          <div style="margin-bottom: 14px;">
            <div style="font-size: 14.5px; font-weight: bold; color: #0f172a; text-decoration: underline; margin-bottom: 6px;">Emlak komisyon paylaşım oranları:</div>
            <ol style="font-size: 13.5px; color: #0f172a; margin: 0; padding-left: 22px; text-align: justify;">
              <li style="margin-bottom: 4px;">Danışman sadece kendi yapmış olduğu işlerden komisyon alacaktır.</li>
              <li style="margin-bottom: 4px;">Satılan veya kiralanan gayrimenkul’den alınan komisyon üzerinden <strong>%${offSplit}</strong> Yetkili ve <strong>%${consSplit}</strong> danışman ${isDirectEqual ? "eşit olarak" : "oranında"} paylaşılacaktır.</li>
              <li style="margin-bottom: 4px;">Ofis içinde başka bir danışmanla beraber iş yapıldıysa alınan komisyon bedeli danışmanlar ve yetkili arasında eşit olarak paylaşılacaktır.</li>
              <li style="margin-bottom: 4px;">Başka bir emlak ofisiyle ortak iş yapıldıysa alınan komisyon bedeli ofisler arası <strong>%${extOff1} - %${extOff2}</strong> paylaşılıp ofise kalan komisyon bedelinin <strong>%${extIntOff} - %${extIntCons}</strong> ${isExtIntEqual ? "eşit olarak" : "oranında"} yetkili ve danışman arasında paylaşılacaktır.</li>
            </ol>
          </div>

          <div style="margin-bottom: 14px;">
            <div style="font-size: 14.5px; font-weight: bold; color: #0f172a; text-decoration: underline; margin-bottom: 6px;">İş kuralları:</div>
            <ol style="font-size: 13.5px; color: #0f172a; margin: 0; padding-left: 22px; text-align: justify;">
              <li style="margin-bottom: 4px;">Danışman kesinlikle ofise bağlı kalacaktır.</li>
              <li style="margin-bottom: 4px;">Danışman ofisi ve yetkiliyi zor durumda bırakacak işlere kalkışmayacaktır.</li>
              <li style="margin-bottom: 4px;">Danışman, Yetkiliye ve Müşteriye kesinlikle yalan, sahtekarlık, dolandırıcılık ve yanıltma içinde bulunmayıp iş ahlakına uygun ve dürüst şekilde çalışacaktır.</li>
              <li style="margin-bottom: 4px;">Danışman ofis içerisinde ve ofis dışında ofis kurallarına uygun hareket edecektir.</li>
              <li style="margin-bottom: 4px;">Tüm portföy <strong>${storeTitle}</strong> ofisine aittir. Danışman bu portföyü ve bilgilerini 3. Şahıs, Şirket, Kurum ve başka emlak ofisleriyle paylaşmayacağını kabul ve taahhüt eder.</li>
            </ol>
          </div>

          ${renderCustomClausesHtml(v.customClauses)}

          <p style="font-size: 13.5px; text-align: justify; margin: 16px 0 26px 0; color: #0f172a;">
            İşbu sözleşme sırasında anlaşmazlık vuku bulursa KKTC Mahkemeleri yetkilidir. Sözleşme 2 adet olarak düzenlenmiş olup <strong>${clauseFormula}</strong> maddelik bu sözleşmenin bir nüshası yetkiliye bir nüshası danışmana verilmiş ve yürürlüğe girmiştir.
          </p>

          <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: flex-start; gap: 24px;">
            <div style="flex: 1; text-align: left; font-size: 14px; color: #0f172a;">
              <div style="font-weight: bold; margin-bottom: 6px;">Yetkili</div>
              <div style="font-weight: bold;">${storeTitle}</div>
              <div style="font-weight: bold; margin-bottom: 18px;">${authName}</div>
              <div style="font-size: 11px; color: #64748b; border-top: 1px dashed #cbd5e1; display: inline-block; padding-top: 4px; min-width: 160px;">Kaşe & İmza</div>
            </div>

            <div style="flex: 1; text-align: right; font-size: 14px; color: #0f172a;">
              <div style="font-weight: bold; margin-bottom: 6px;">Danışman</div>
              <div style="font-weight: bold; margin-bottom: 8px;">${consultantName}</div>
              <div style="display: flex; justify-content: flex-end;">
                ${renderSignatureOrStamp(consultantName, v.isSigned, v.signatureImage)}
              </div>
            </div>
          </div>
        </div>
      `;

      const markdown = `# EMLAK DANIŞMAN İŞ ORTAKLIĞI SÖZLEŞMESİ
**TARİH:** ${currentDate}

Bir tarafta **${storeTitle}** firması sahibi **${authId}** ${authIdType} hamili **${authName}** bundan böyle **‘’Yetkili’’** olarak anılacaktır.
Bir tarafta **${consultantId}** ${consultantIdType} hamili **${consultantName}** bundan böyle **‘’Danışman’’** olarak anılacaktır.

## Şartlar:
1. Danışman; başka bir emlak ofisi, emlakçı, danışman veya broker ile çalışmayacaktır.
2. Danışman; hiçbir Emlak (Gayrimenkul) alım – satım – kiralama işini yetkilinin haberi, izni ve bilgisi olmadan yapmayacaktır.
3. Danışman iş ortaklığından vazgeçmeden, en az ${noticeDays} gün önceden yetkiliye bildirir.
4. Danışman iş ortaklığından vazgeçerken tüm portföy ofise kalıp yarım kalan işler tamamlanıp komisyon bedeli anlaşılan oranlarda paylaşıldıktan sonra iş ortaklığından ancak öyle vazgeçebilir.

## Emlak komisyon paylaşım oranları:
1. Danışman sadece kendi yapmış olduğu işlerden komisyon alacaktır.
2. Satılan veya kiralanan gayrimenkul’den alınan komisyon üzerinden %${offSplit} Yetkili ve %${consSplit} danışman ${isDirectEqual ? "eşit olarak" : "oranında"} paylaşılacaktır.
3. Ofis içinde başka bir danışmanla beraber iş yapıldıysa alınan komisyon bedeli danışmanlar ve yetkili arasında eşit olarak paylaşılacaktır.
4. Başka bir emlak ofisiyle ortak iş yapıldıysa alınan komisyon bedeli ofisler arası %${extOff1} - %${extOff2} paylaşılıp ofise kalan komisyon bedelinin %${extIntOff} - %${extIntCons} ${isExtIntEqual ? "eşit olarak" : "oranında"} yetkili ve danışman arasında paylaşılacaktır.

## İş kuralları:
1. Danışman kesinlikle ofise bağlı kalacaktır.
2. Danışman ofisi ve yetkiliyi zor durumda bırakacak işlere kalkışmayacaktır.
3. Danışman, Yetkiliye ve Müşteriye kesinlikle yalan, sahtekarlık, dolandırıcılık ve yanıltma içinde bulunmayıp iş ahlakına uygun ve dürüst şekilde çalışacaktır.
4. Danışman ofis içerisinde ve ofis dışında ofis kurallarına uygun hareket edecektir.
5. Tüm portföy ${storeTitle} ofisine aittir. Danışman bu portföyü ve bilgilerini 3. Şahıs, Şirket, Kurum ve başka emlak ofisleriyle paylaşmayacağını kabul ve taahhüt eder.
${renderCustomClausesMarkdown(v.customClauses)}
İşbu sözleşme sırasında anlaşmazlık vuku bulursa KKTC Mahkemeleri yetkilidir. Sözleşme 2 adet olarak düzenlenmiş olup ${clauseFormula} maddelik bu sözleşmenin bir nüshası yetkiliye bir nüshası danışmana verilmiş ve yürürlüğe girmiştir.

**Yetkili:** ${storeTitle} - ${authName}
**Danışman:** ${consultantName}
`;

      return { html, markdown };
    }
  },
  {
    id: "rental_deposit_agreement",
    titleTr: "Kapora Sözleşmesi",
    titleEn: "Rental Deposit / Reservation Agreement",
    getTemplate: (v: ContractPlaceholderValues) => {
      const currMeta = getCurrencyMeta(v.rentCurrency || "GBP");
      const rentNum = parseNumericAmount(v.rentPriceRaw);
      const rentFormatted = rentNum > 0 ? rentNum.toLocaleString("tr-TR") : "..........";
      const rentWords = rentNum > 0 ? numberToTurkishWords(rentNum).replace(/\s+/g, "") : "....................";
      const currWordCompact = currMeta.wordLabel.replace(/\s+/g, "");
      const monthlyRentDisplay =
        rentNum > 0
          ? `${rentFormatted} ${currMeta.codeLabel} (${rentWords}${currWordCompact})`
          : "........................................";

      const paymentMethodStr = (v.rentPaymentMethod || "1 Yıl Peşin Ödemeli").trim();

      // Total period rent (e.g., 12 months upfront = 12 * rentNum, or 6 months = 6 * rentNum, or custom)
      const pmLower = paymentMethodStr.toLocaleLowerCase("tr-TR");
      const defaultPeriodMultiplier =
        pmLower.includes("1 yıl") || pmLower.includes("12 ay") || pmLower.includes("yıllık")
          ? 12
          : pmLower.includes("6 ay")
          ? 6
          : pmLower.includes("3 ay")
          ? 3
          : 1;
      const explicitTotalRentNum = parseNumericAmount(v.kaporaTotalRentAmount);
      const computedTotalRentNum = explicitTotalRentNum > 0 ? explicitTotalRentNum : rentNum * defaultPeriodMultiplier;
      const totalRentFormatted = computedTotalRentNum > 0 ? computedTotalRentNum.toLocaleString("tr-TR") : "..........";
      const totalRentWords =
        computedTotalRentNum > 0 ? numberToTurkishWords(computedTotalRentNum).replace(/\s+/g, "") : "....................";
      const totalRentDisplay =
        computedTotalRentNum > 0
          ? `${totalRentFormatted} ${currMeta.codeLabel} (${totalRentWords}${currWordCompact})`
          : (v.kaporaTotalRentAmount || "........................................");

      // Deposit
      const rawDepStr = (v.depositAmount || "").trim();
      const depNum = parseNumericAmount(rawDepStr);
      const inferredDepNum =
        depNum > 0 && (depNum >= 50 || !rawDepStr.toLocaleLowerCase("tr-TR").includes("kira"))
          ? depNum
          : rawDepStr.startsWith("2") && rentNum > 0
          ? rentNum * 2
          : rentNum > 0
          ? rentNum
          : 0;
      const depWords = inferredDepNum > 0 ? numberToTurkishWords(inferredDepNum).replace(/\s+/g, "") : "";
      const depositDisplay =
        inferredDepNum > 0
          ? rawDepStr.toLocaleLowerCase("tr-TR").includes("kira")
            ? `${rawDepStr} olan ${inferredDepNum.toLocaleString("tr-TR")} ${currMeta.codeLabel} (${depWords}${currWordCompact})`
            : `${inferredDepNum.toLocaleString("tr-TR")} ${currMeta.codeLabel} (${depWords}${currWordCompact})`
          : rawDepStr || "1 Aylık Kira Bedeli";

      // Commission
      const rawCommStr = (v.kaporaCommissionAmount || v.commissionRate || "1 Kira Bedeli").trim();
      const commNum = parseNumericAmount(rawCommStr);
      const inferredCommNum =
        commNum > 0 && (commNum >= 50 || !rawCommStr.toLocaleLowerCase("tr-TR").includes("kira"))
          ? commNum
          : rentNum > 0
          ? rentNum
          : 0;
      const commWords = inferredCommNum > 0 ? numberToTurkishWords(inferredCommNum).replace(/\s+/g, "") : "";
      const commissionDisplay =
        inferredCommNum > 0
          ? rawCommStr.toLocaleLowerCase("tr-TR").includes("kira")
            ? `${rawCommStr} olan ${inferredCommNum.toLocaleString("tr-TR")} ${currMeta.codeLabel} (${commWords}${currWordCompact})`
            : `${inferredCommNum.toLocaleString("tr-TR")} ${currMeta.codeLabel} (${commWords}${currWordCompact})`
          : rawCommStr || "1 Kira Bedeli";

      // Aidat (Dues)
      const duesDisplay = (v.kaporaDuesAmount || "Belirtilmedi").trim();

      // Grand Total (Total Rent + Deposit + Commission)
      const grandTotalNum = computedTotalRentNum + inferredDepNum + inferredCommNum;
      const grandTotalWords = grandTotalNum > 0 ? numberToTurkishWords(grandTotalNum).replace(/\s+/g, "") : "";
      const grandTotalDisplay =
        grandTotalNum > 0
          ? `${grandTotalNum.toLocaleString("tr-TR")} ${currMeta.codeLabel} (${grandTotalWords}${currWordCompact})${
              duesDisplay && duesDisplay !== "Belirtilmedi" && duesDisplay !== "Yok" ? ` + Aidat (${duesDisplay})` : ""
            }`
          : "..................................................";

      // Paid Kapora & Remaining Balance
      const paidKaporaNum = parseNumericAmount(v.kaporaPaidAmount);
      const paidKaporaWords = paidKaporaNum > 0 ? numberToTurkishWords(paidKaporaNum).replace(/\s+/g, "") : "....................";
      const kaporaPaidDisplay =
        paidKaporaNum > 0
          ? `${paidKaporaNum.toLocaleString("tr-TR")} ${currMeta.codeLabel} - Yalnız (${paidKaporaWords}${currWordCompact})`
          : (v.kaporaPaidAmount || ".................... " + currMeta.codeLabel);

      const explicitRemNum = parseNumericAmount(v.kaporaRemainingBalance);
      const computedRemNum =
        explicitRemNum > 0
          ? explicitRemNum
          : grandTotalNum > 0 && paidKaporaNum > 0
          ? Math.max(0, grandTotalNum - paidKaporaNum)
          : grandTotalNum > 0
          ? grandTotalNum
          : 0;
      const remWords = computedRemNum > 0 ? numberToTurkishWords(computedRemNum).replace(/\s+/g, "") : "....................";
      const remainingBalanceDisplay =
        computedRemNum > 0
          ? `${computedRemNum.toLocaleString("tr-TR")} ${currMeta.codeLabel} (${remWords}${currWordCompact})`
          : (v.kaporaRemainingBalance || ".................... " + currMeta.codeLabel);

      // Broker & Tenant Details
      const brokerTitle = (v.agentAndCompany || v.ownerName || v.storeName || "Rodel Investment - EMRAH CEYHAN").trim();
      const brokerIdStr = (v.authorizedPersonIdentity || v.sellerIdentity || "1170237140").trim();
      const brokerPhoneStr = (v.ownerPhone || v.storePhone || "").trim();

      const tenant1Name = (v.clientName || "......................................................").trim();
      const tenant1Id = (v.clientIdentity || "..............................").trim();
      const tenant1IdType = (v.buyerIdType || "Pasaport / Kimlik").trim();
      const tenant1Summary = `${tenant1Name} (${tenant1IdType} No: ${tenant1Id})`;
      const tenant2Summary = (v.kaporaTenant2Info || "").trim();
      const tenant3Summary = (v.kaporaTenant3Info || "").trim();

      const allTenantsInline = [tenant1Summary, tenant2Summary, tenant3Summary].filter(Boolean).join(", ");

      const propDef = (
        v.rentalPropertyDef ||
        (v.isFurnishedRental ? "Eşyalı Daire / Konut" : "Daire / Konut")
      ).trim();
      const propAddr = (
        v.propertyAddress ||
        [v.rentalTownVillage, v.rentalDistrict, v.propertyLocation].filter(Boolean).join(" / ") ||
        "........................................................................................"
      ).trim();

      const viewingDateStr = (v.viewingDate || v.contractDate || "..../..../20....").trim();
      const balanceDueDateStr = (v.kaporaBalanceDueDate || "..../..../20....").trim();
      const leaseStartDateStr = (v.rentStartDate || v.kaporaBalanceDueDate || v.contractDate || "..../..../20....").trim();

      const html = `
        <div style="font-family: 'Times New Roman', Times, serif; line-height: 1.52; color: #0f172a; max-width: 820px; margin: 0 auto; padding: 26px 32px; border: 1px solid #cbd5e1; background: #fff;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 14px;">
            <div>
              <h1 style="margin: 0; font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.4px;">
                KAPORA SÖZLEŞMESİ
              </h1>
              <div style="font-size: 11.5px; font-weight: bold; color: #334155; margin-top: 3px;">
                TARAFLAR ARASINDA AŞAĞIDAKİ ŞARTLAR DAHİLİNDE KAPORA ANLAŞMASINA VARILMIŞTIR
              </div>
            </div>
            <div style="font-size: 13px; font-weight: bold; white-space: nowrap; text-align: right;">
              Tarih: ${v.contractDate}
            </div>
          </div>

          <div style="font-size: 13px; text-align: justify;">
            <p style="margin: 0 0 10px 0;">
              Bir taraftan <strong>${allTenantsInline}</strong> (Bundan böyle <strong>"KİRACI"</strong> olarak anılacaktır), işbu kapora anlaşmasını yapmaya tam yetkili olduğunu ve aşağıda bilgileri yazılı taşınmazı kiralamak niyetinde olduğunu beyan eder;
            </p>
            <p style="margin: 0 0 12px 0;">
              Diğer taraftan <strong>${brokerIdStr}</strong> numaralı K.K.T.C Kimlik Kartı / MŞ hamili <strong>${brokerTitle}</strong>${brokerPhoneStr ? ` (Tel: ${brokerPhoneStr})` : ""} (Bundan böyle <strong>"EMLAK KOMİSYONCUSU / EMLAKÇI"</strong> olarak anılacaktır); bugün <strong>${v.contractDate}</strong> tarihinde işbu kapora sözleşmesini aşağıdaki şartlar dahilinde akdederler.
            </p>

            <!-- MALIN TANIMI VE ADRESİ -->
            <div style="border: 1.5px solid #0f172a; border-radius: 6px; padding: 10px 14px; margin-bottom: 12px; background: #f8fafc;">
              <p style="margin: 2px 0;"><strong>Malın Tanımı (Cinsi ve Özellikleri):</strong> ${propDef}</p>
              <p style="margin: 4px 0;"><strong>Adres:</strong> ${propAddr}</p>
              <p style="margin: 4px 0 0 0; font-style: italic; color: #1e293b;">
                Söz konusu taşınmazı Emlak Komisyoncusu aracılığı ile kiralamak amacıyla <strong>${viewingDateStr}</strong> tarihinde gördüm/gördük ve beğendim.
              </p>
            </div>

            <!-- KİRA, DEPOZİT, AİDAT, KOMİSYON VE TOPLAM TABLOSU -->
            <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 14px; margin-bottom: 12px; background: #ffffff;">
              <p style="margin: 3px 0;"><strong>Gayrimenkulün Aylık Kirası:</strong> ${monthlyRentDisplay}</p>
              <p style="margin: 3px 0;"><strong>Ödeme Şekli & Dönem Kira Toplamı:</strong> ${paymentMethodStr} (Toplam Kira Bedeli: <strong>${totalRentDisplay}</strong>)</p>
              <p style="margin: 3px 0;"><strong>Depozit:</strong> ${depositDisplay}</p>
              <p style="margin: 3px 0;"><strong>Aidat:</strong> ${duesDisplay}</p>
              <p style="margin: 3px 0;"><strong>Komisyon (Hizmet Bedeli):</strong> ${commissionDisplay} <em>(${brokerTitle}’a komisyon olarak ödemeyi kabul ve taahhüt etmişlerdir.)</em></p>
              <p style="margin: 6px 0 2px 0; padding-top: 5px; border-top: 1px dashed #94a3b8; font-size: 13.5px;">
                <strong>Genel Toplam:</strong> <strong>${grandTotalDisplay}</strong>
              </p>
            </div>

            <!-- KAPORA, KALAN BAKİYE, REZERVASYON VE KASA MUHAFAZA HÜKÜMLERİ -->
            <p style="margin: 0 0 9px 0;">
              Söz konusu gayrimenkulü yukarıda belirtilen şartlar dahilinde kiralamak için kendi isteğim ile bugün Emlak Komisyoncusu'na <strong>${kaporaPaidDisplay}</strong> kapora bırakıyorum / verilmiştir ve geriye kalan <strong>${remainingBalanceDisplay}</strong> tutarı en geç <strong>${balanceDueDateStr}</strong> tarihinde ödemeyi kabul ve taahhüt ediyorum.
            </p>
            <p style="margin: 0 0 9px 0;">
              Mal sahibi / Emlak Komisyoncusu, söz konusu (<strong>${propDef}</strong>) taşınmazı bugünden itibaren <strong>${balanceDueDateStr}</strong> tarihine değin başka kişilere kiralamayacağını kabul eder. Alınan kapora; tarafların hakları düşünülerek işbu kiralamaya aracılık eden Emlak Komisyoncusu'nun kasasında, kira sözleşmesi yapılana (<strong>${balanceDueDateStr}</strong> tarihine) kadar muhafaza edilecektir.
            </p>
            <p style="margin: 0 0 11px 0;">
              Şayet Kiracı(lar) vaktinde gelir, bakiye ödemeyi tamamlar ve kira sözleşmesi imzalanır ise kira sözleşme başlangıç tarihi <strong>${leaseStartDateStr}</strong> olacaktır (bu tarihten itibaren kiralama başlayacaktır).
            </p>

            <!-- CAYMA VE İADE ŞARTLARI (KİRACI & ARACI) -->
            <div style="border-left: 3.5px solid #0f172a; padding: 6px 12px; margin-bottom: 12px; background: #f8fafc;">
              <p style="margin: 0 0 6px 0;">
                <strong>Kiracı Beyanı (Vazgeçme ve Cezai İşlem):</strong> Şayet kiracı <strong>${balanceDueDateStr}</strong> tarihine değin yukarıda anlaşılan hususları yerine getirmez, şartlara uymadığı takdirde veya taşınmazı kiralamaktan vazgeçmesi halinde verdiği kaporayı cezai işlem olarak geri talep edemeyeceğini ve geri alamayacağını biliyor, kabul ve beyan ediyorum. Mal sahibi zarar ziyan olarak söz konusu kapora bedeline el koyabilir ve geri iade etmez.
              </p>
              <p style="margin: 0;">
                <strong>Aracı (Emlak Komisyoncusu) Beyanı:</strong> Mülk sahibinin kiralama işleminden vazgeçmesi halinde ise Emlak Komisyoncusu alınan kaporayı hiçbir kesintiye uğramadan Kiracı'ya geri iade edecektir.
              </p>
            </div>

            <!-- KİRACI BİLGİLERİ LİSTESİ VE TERCÜME / OKUMA BEYANI -->
            <div style="margin-bottom: 10px;">
              <p style="margin: 0 0 4px 0; font-weight: bold;">Kiracı Bilgileri:</p>
              <p style="margin: 2px 0;">1) ${tenant1Summary}${v.clientPhone ? ` — Tel: ${v.clientPhone}` : ""}</p>
              ${tenant2Summary ? `<p style="margin: 2px 0;">2) ${tenant2Summary}</p>` : ""}
              ${tenant3Summary ? `<p style="margin: 2px 0;">3) ${tenant3Summary}</p>` : ""}
            </div>

            <p style="margin: 0 0 10px 0; font-weight: bold;">
              İşbu yazılanları (gerekmesi halinde tarafıma tercümesi yapıldıktan sonra) okuyup anladıktan sonra hür irademle imzaladığımı kabul ve beyan ederim.
            </p>

            ${renderCustomClausesHtml(v.customClauses)}
          </div>

          <!-- İMZA BLOKLARI -->
          <div style="margin-top: 18px; display: flex; justify-content: space-between; gap: 18px; border-top: 2px solid #0f172a; padding-top: 14px;">
            <div style="width: 48%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 6px; background: #f8fafc;">
              <p style="margin: 0 0 6px 0; font-weight: bold; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
                KİRACI (1. İMZA - ÖNCELİKLİ)
              </p>
              <p style="margin: 3px 0; font-size: 12px;"><strong>1) Ad Soyad / Kimlik:</strong> ${tenant1Summary}</p>
              ${tenant2Summary ? `<p style="margin: 3px 0; font-size: 12px;"><strong>2) Kiracı 2:</strong> ${tenant2Summary}</p>` : ""}
              ${tenant3Summary ? `<p style="margin: 3px 0; font-size: 12px;"><strong>3) Kiracı 3:</strong> ${tenant3Summary}</p>` : ""}
              <p style="margin: 3px 0; font-size: 12px;"><strong>Telefon:</strong> ${v.clientPhone || "...................................."}</p>
              ${
                v.isSigned
                  ? `
                <div style="margin-top: 8px; padding: 8px; border: 2px solid #16a34a; background-color: #f0fdf4; border-radius: 6px; text-align: center;">
                  <div style="font-size: 10px; font-weight: bold; color: #15803d; text-transform: uppercase;">✔ 1. İMZA: KİRACI DİJİTAL İMZASI</div>
                  ${v.signatureImage ? `<img src="${v.signatureImage}" style="max-height: 52px; margin: 4px auto; display: block;" alt="Kiracı İmzası" />` : ""}
                  <div style="font-family: monospace; font-size: 11px; color: #166534; font-weight: bold;">${v.signingName || v.clientName}</div>
                </div>
              `
                  : `<p style="margin-top: 26px; color: #475569; font-size: 12px; font-weight: bold;">İMZA: ................................................</p>`
              }
            </div>

            <div style="width: 48%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 6px; background: #f8fafc;">
              <p style="margin: 0 0 6px 0; font-weight: bold; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
                EMLAK KOMİSYONCUSU / EMLAKÇI (2. İMZA - ONAY)
              </p>
              <p style="margin: 3px 0; font-size: 12px;"><strong>Unvan / Yetkili:</strong> ${brokerTitle}</p>
              <p style="margin: 3px 0; font-size: 12px;"><strong>KKTC Kimlik / MŞ No:</strong> ${brokerIdStr}</p>
              <p style="margin: 3px 0; font-size: 12px;"><strong>Telefon:</strong> ${brokerPhoneStr || "...................................."}</p>
              ${
                v.sellerSigned
                  ? `
                <div style="margin-top: 8px; padding: 8px; border: 2px solid #0284c7; background-color: #f0f9ff; border-radius: 6px; text-align: center;">
                  <div style="font-size: 10px; font-weight: bold; color: #0369a1; text-transform: uppercase;">✔ 2. İMZA: EMLAK KOMİSYONCUSU DİJİTAL ONAYI</div>
                  ${v.sellerSignatureImage ? `<img src="${v.sellerSignatureImage}" style="max-height: 52px; margin: 4px auto; display: block;" alt="Emlak Komisyoncusu İmzası" />` : ""}
                  <div style="font-family: monospace; font-size: 11px; color: #075985; font-weight: bold;">${v.sellerSigningName || brokerTitle}</div>
                </div>
              `
                  : `<p style="margin-top: 26px; color: #475569; font-size: 12px; font-weight: bold;">İMZA: ................................................</p>`
              }
            </div>
          </div>
        </div>
      `;

      const markdown = `# KAPORA SÖZLEŞMESİ
**Tarih:** ${v.contractDate}

Bir taraftan **${allTenantsInline}** (Bundan böyle **KİRACI** olarak anılacaktır), diğer taraftan **${brokerIdStr}** numaralı K.K.T.C Kimlik Kartı hamili **${brokerTitle}** (Bundan böyle **EMLAK KOMİSYONCUSU** olarak anılacaktır) bugün **${v.contractDate}** tarihinde işbu kapora sözleşmesini akdederler.

- **Malın Tanımı:** ${propDef}
- **Adres:** ${propAddr}
- **Görülme Tarihi:** ${viewingDateStr}
- **Gayrimenkulün Aylık Kirası:** ${monthlyRentDisplay}
- **Ödeme Şekli & Dönem Toplamı:** ${paymentMethodStr} (${totalRentDisplay})
- **Depozit:** ${depositDisplay}
- **Aidat:** ${duesDisplay}
- **Komisyon:** ${commissionDisplay}
- **Genel Toplam:** ${grandTotalDisplay}

Söz konusu gayrimenkulü yukarıda belirtilen şartlar dahilinde kiralamak için kendi isteğim ile **${kaporaPaidDisplay}** kapora bırakıyorum ve geriye kalan **${remainingBalanceDisplay}** tutarı en geç **${balanceDueDateStr}** tarihinde ödemeyi taahhüt ediyorum.
Alınan kapora; tarafların hakları düşünülerek Emlak Komisyoncusu'nun kasasında kira sözleşmesi yapılana (**${balanceDueDateStr}** tarihine) kadar muhafaza edilecektir. Mal sahibi söz konusu taşınmazı **${balanceDueDateStr}** tarihine değin başka kişilere kiralamayacağını kabul eder.
Kira sözleşme başlangıç tarihi **${leaseStartDateStr}** olacaktır.

- **Kiracı:** İşbu kaporayı söz konusu gayrimenkulü şartlara uymadığım takdirde veya kiralamaktan vazgeçmem halinde cezai işlem olarak geri alamayacağımı biliyorum.
- **Aracı:** Mülk sahibinin kiralama işleminden vazgeçmesi halinde ise Emlak Komisyoncusu kaporayı hiçbir kesintiye uğramadan geri iade edecektir.
${renderCustomClausesMarkdown(v.customClauses)}

**KİRACI:** ${allTenantsInline}
**EMLAK KOMİSYONCUSU:** ${brokerTitle}
`;

      return { html, markdown };
    }
  },
  {
    id: "sales_deposit_agreement",
    titleTr: "Kapora Sözleşmesi (Emlakçı Kasa Muhafazalı)",
    titleEn: "Sales Deposit Agreement (Broker Escrow)",
    getTemplate: (v: ContractPlaceholderValues) => {
      const currMeta = getCurrencyMeta(v.saleCurrency || "GBP");
      const currWordCompact = currMeta.wordLabel.replace(/\s+/g, "");

      const saleNum = parseNumericAmount(v.salePriceRaw || v.propertyPrice);
      const priceFormatted = saleNum > 0 ? saleNum.toLocaleString("tr-TR") : "..........";
      const priceWords = saleNum > 0 ? numberToTurkishWords(saleNum).replace(/\s+/g, "") : "....................";

      const kaporaNum = parseNumericAmount(v.salesDepositPaidAmount || v.depositAmount);
      const kaporaFormatted = kaporaNum > 0 ? kaporaNum.toLocaleString("tr-TR") : "..........";
      const kaporaWords = kaporaNum > 0 ? numberToTurkishWords(kaporaNum).replace(/\s+/g, "") : "....................";

      const remainingNum = parseNumericAmount(v.salesDepositRemainingAmount || v.remainingAmountRaw) || (saleNum > 0 && kaporaNum > 0 ? Math.max(0, saleNum - kaporaNum) : 0);
      const remainingFormatted = remainingNum > 0 ? remainingNum.toLocaleString("tr-TR") : "..........";
      const remainingWords = remainingNum > 0 ? numberToTurkishWords(remainingNum).replace(/\s+/g, "") : "....................";

      const brokerName = (v.agentAndCompany || v.ownerName || v.storeName || "EMRAH CEYHAN").trim();
      const brokerBrand = (v.storeName || "Rodel investment").trim();
      const brokerIdStr = (v.authorizedPersonIdentity || "1170237140").trim();
      const brokerPhoneStr = (v.storePhone || v.ownerPhone || "").trim();

      const clientNameStr = (v.clientName || "................................................").trim();
      const clientIdStr = (v.clientIdentity || "....................").trim();
      const clientIdType = (v.buyerIdType || "K.K.T.C kimlik kartı / Pasaport").trim();

      const district = (v.rentalDistrict || v.propertyLocation || "Lefkoşa").trim();
      const townVillage = (v.rentalTownVillage || "Ornithi").trim();
      const ada = (v.adaNo || "165").trim();
      const parsel = (v.parselNo || "22").trim();
      const kocan = (v.kocanNo || "YENİ589").trim();
      const pafta = (v.paftaNo || "S31.D.07.D.4").trim();
      const malTanimi = (v.authPropertyCategoryOther || v.rentalPropertyDef || v.propertyTitle || "Tasvip olunmuş Arsa").replace(/^\[Ref:[^\]]+\]\s*/i, "").trim();

      const paymentTerms = (v.salesPaymentTerms || "Tapu devrinde hepsi ödenecektir.").trim();
      const viewingDateStr = (v.viewingDate || v.contractDate || "..../..../20....").trim();

      const witness1Str = `${v.witness1Name || "...................................."} (Kimlik: ${v.witness1Identity || "...................."})`;
      const witness2Str = `${v.witness2Name || "...................................."} (Kimlik: ${v.witness2Identity || "...................."})`;

      const html = `
        <div style="font-family: 'Times New Roman', Times, serif; line-height: 1.55; color: #0f172a; max-width: 820px; margin: 0 auto; padding: 26px 32px; border: 1px solid #cbd5e1; background: #fff;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 14px;">
            <div>
              <h1 style="margin: 0; font-size: 19px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
                KAPORA SÖZLEŞMESİ
              </h1>
              <div style="font-size: 11px; font-weight: bold; color: #475569; margin-top: 2px;">
                SATILIK TAŞINMAZ REZERVASYON VE EMLAKÇI KASA MUHAFAZA PROTOKOLÜ
              </div>
            </div>
            <div style="font-size: 13px; font-weight: bold; white-space: nowrap;">
              ${v.contractDate}
            </div>
          </div>

          <div style="font-size: 13.5px; text-align: justify;">
            <p style="margin: 0 0 10px 0;">
              Bir taraftan <strong>${clientIdStr}</strong> ${clientIdType} hamili <strong>${clientNameStr}</strong> (Bundan böyle <strong>ALICI</strong> olarak anılacaktır),
            </p>
            <p style="margin: 0 0 12px 0;">
              Diğer Taraftan <strong>${brokerIdStr}</strong> numaralı K.K.T.C kimlik kartı hamili (<strong>${brokerBrand}</strong>) <strong>${brokerName}</strong>${brokerPhoneStr ? ` (Tel: ${brokerPhoneStr})` : ""} (Bundan böyle <strong>EMLAK KOMİSYONCUSU</strong> olarak anılacaktır). Bugün <strong>${v.contractDate}</strong> tarihinde iş bu kapora sözleşmesini akdederler.
            </p>

            <div style="border: 1.5px solid #0f172a; border-radius: 6px; padding: 10px 14px; margin-bottom: 12px; background: #f8fafc;">
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; font-size: 13px;">
                <div><strong>Ülke:</strong> KKTC</div>
                <div><strong>İlçe:</strong> ${district}</div>
                <div><strong>Mahalle:</strong> ${townVillage}</div>
                <div><strong>Ada/Blok:</strong> ${ada}</div>
                <div><strong>Parsel No:</strong> ${parsel}</div>
                <div><strong>Koçan No:</strong> ${kocan}</div>
                <div style="grid-column: span 2;"><strong>Pafta No:</strong> ${pafta}</div>
              </div>
              <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #cbd5e1; font-size: 13px;">
                <strong>Malın Tanımı:</strong> ${malTanimi}
              </div>
              <div style="margin-top: 4px; font-style: italic; color: #334155; font-size: 12.5px;">
                Taşınmazı Emlak Komisyoncusu aracılığı ile satın almak amacıyla <strong>${viewingDateStr}</strong> tarihinde gördüm.
              </div>
            </div>

            <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 14px; margin-bottom: 12px; background: #ffffff;">
              <p style="margin: 3px 0;"><strong>Gayrimenkulün fiyatı:</strong> <strong>${priceFormatted} ${currMeta.codeLabel}</strong> (${priceWords}${currWordCompact})</p>
              <p style="margin: 3px 0;"><strong>Ödeme şekli:</strong> ${paymentTerms}</p>
            </div>

            <p style="margin: 0 0 10px 0;">
              Söz konusu gayrimenkulü yukarıda belirtilen şartlar dahilinde satın almak için kendi isteğim ile <strong>${kaporaFormatted} ${currMeta.codeLabel}</strong> -yalnız(<strong>${kaporaWords}${currWordCompact}</strong>) kapora bırakıyorum ve geriye kalan <strong>${remainingFormatted} ${currMeta.codeLabel}</strong> (<strong>${remainingWords}${currWordCompact}</strong>) tutarı en geç tapu devrinde ödemeyi taahhüt ediyorum.
            </p>

            <p style="margin: 0 0 10px 0;">
              Alınan kapora; alıcı ve satıcının hakları düşünülerek iş bu satışa aracılık eden Emlak Komisyoncusu 'nun kasasında, tapu devrine kadar muhafaza edilecektir.
            </p>

            <div style="border-left: 3.5px solid #0f172a; padding: 6px 12px; margin-bottom: 12px; background: #f8fafc;">
              <p style="margin: 0 0 6px 0;">
                <strong>Alıcı:</strong> İş bu kaporayı söz konusu gayrimenkulü şartlara uymadığım takdirde veya satın almaktan vazgeçmem halinde cezai işlem olarak geri alamayacağımı biliyorum.
              </p>
              <p style="margin: 0;">
                <strong>Aracı:</strong> Mülk sahibinin satma işleminden vazgeçmesi halinde ise Emlak Komisyoncusu kaporayı hiç bir kesintiye uğramadan geri iade edecektir.
              </p>
            </div>

            ${renderCustomClausesHtml(v.customClauses)}
          </div>

          <div style="margin-top: 18px; display: flex; justify-content: space-between; gap: 16px; border-top: 2px solid #0f172a; padding-top: 14px;">
            <div style="width: 48%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 6px; background: #f8fafc;">
              <p style="margin: 0 0 6px 0; font-weight: bold; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
                ALICI (1. İMZA)
              </p>
              <p style="margin: 3px 0; font-size: 12px;"><strong>Adı Soyadı:</strong> ${clientNameStr}</p>
              <p style="margin: 3px 0; font-size: 12px;"><strong>Kimlik / Pasaport No:</strong> ${clientIdStr}</p>
              <p style="margin: 3px 0; font-size: 12px;"><strong>Telefon:</strong> ${v.clientPhone || "...................."}</p>
              ${
                v.isSigned
                  ? `
                <div style="margin-top: 8px; padding: 6px; border: 2px solid #16a34a; background-color: #f0fdf4; border-radius: 6px; text-align: center;">
                  <div style="font-size: 10px; font-weight: bold; color: #15803d; text-transform: uppercase;">✔ 1. İMZA: ALICI DİJİTAL ONAYI</div>
                  ${v.signatureImage ? `<img src="${v.signatureImage}" style="max-height: 48px; margin: 4px auto; display: block;" alt="Alıcı İmzası" />` : ""}
                  <div style="font-family: monospace; font-size: 11px; color: #166534; font-weight: bold;">${v.signingName || clientNameStr}</div>
                </div>
              `
                  : `<p style="margin-top: 24px; color: #475569; font-size: 12px; font-weight: bold;">İMZA: ................................................</p>`
              }
            </div>

            <div style="width: 48%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 6px; background: #f8fafc;">
              <p style="margin: 0 0 6px 0; font-weight: bold; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
                EMLAK KOMİSYONCUSU (2. İMZA)
              </p>
              <p style="margin: 3px 0; font-size: 12px;"><strong>Yetkili / Ünvan:</strong> ${brokerBrand} - ${brokerName}</p>
              <p style="margin: 3px 0; font-size: 12px;"><strong>KKTC Kimlik / MŞ:</strong> ${brokerIdStr}</p>
              <p style="margin: 3px 0; font-size: 12px;"><strong>Telefon:</strong> ${brokerPhoneStr || "...................."}</p>
              ${
                v.sellerSigned
                  ? `
                <div style="margin-top: 8px; padding: 6px; border: 2px solid #0284c7; background-color: #f0f9ff; border-radius: 6px; text-align: center;">
                  <div style="font-size: 10px; font-weight: bold; color: #0369a1; text-transform: uppercase;">✔ 2. İMZA: EMLAK KOMİSYONCUSU ONAYI</div>
                  ${v.sellerSignatureImage ? `<img src="${v.sellerSignatureImage}" style="max-height: 48px; margin: 4px auto; display: block;" alt="Komisyoncu İmzası" />` : ""}
                  <div style="font-family: monospace; font-size: 11px; color: #075985; font-weight: bold;">${v.sellerSigningName || brokerName}</div>
                </div>
              `
                  : `<p style="margin-top: 24px; color: #475569; font-size: 12px; font-weight: bold;">İMZA: ................................................</p>`
              }
            </div>
          </div>

          <div style="margin-top: 12px; padding: 8px 12px; border: 1px dashed #94a3b8; border-radius: 6px; font-size: 11.5px; background: #fafafa;">
            <strong>ŞAHİTLER:</strong> 1) ${witness1Str} &nbsp;&nbsp;|&nbsp;&nbsp; 2) ${witness2Str}
          </div>
        </div>
      `;

      const markdown = `# KAPORA SÖZLEŞMESİ
**Tarih:** ${v.contractDate}

Bir taraftan **${clientIdStr}** ${clientIdType} hamili **${clientNameStr}** (Bundan böyle **ALICI** olarak anılacaktır),
Diğer Taraftan **${brokerIdStr}** numaralı K.K.T.C kimlik kartı hamili (**${brokerBrand}**) **${brokerName}** (Bundan böyle **EMLAK KOMİSYONCUSU** olarak anılacaktır). Bugün **${v.contractDate}** tarihinde iş bu kapora sözleşmesini akdederler.

- **Ülke:** KKTC | **İlçe:** ${district} | **Mahalle:** ${townVillage} | **Ada/Blok:** ${ada}
- **Parsel No:** ${parsel} | **Koçan No:** ${kocan} | **Pafta No:** ${pafta}
- **Malın Tanımı:** ${malTanimi}
- **Görülme:** Taşınmazı Emlak Komisyoncusu aracılığı ile satın almak amacıyla ${viewingDateStr} tarihinde gördüm.
- **Gayrimenkulün fiyatı:** ${priceFormatted} ${currMeta.codeLabel} (${priceWords}${currWordCompact})
- **Ödeme şekli:** ${paymentTerms}

Söz konusu gayrimenkulü yukarıda belirtilen şartlar dahilinde satın almak için kendi isteğim ile **${kaporaFormatted} ${currMeta.codeLabel}** -yalnız(**${kaporaWords}${currWordCompact}**) kapora bırakıyorum ve geriye kalan **${remainingFormatted} ${currMeta.codeLabel}** (**${remainingWords}${currWordCompact}**) tutarı en geç tapu devrinde ödemeyi taahhüt ediyorum.

Alınan kapora; alıcı ve satıcının hakları düşünülerek iş bu satışa aracılık eden Emlak Komisyoncusu 'nun kasasında, tapu devrine kadar muhafaza edilecektir.

- **Alıcı:** İş bu kaporayı söz konusu gayrimenkulü şartlara uymadığım takdirde veya satın almaktan vazgeçmem halinde cezai işlem olarak geri alamayacağımı biliyorum.
- **Aracı:** Mülk sahibinin satma işleminden vazgeçmesi halinde ise Emlak Komisyoncusu kaporayı hiç bir kesintiye uğramadan geri iade edecektir.
${renderCustomClausesMarkdown(v.customClauses)}

**ALICI:** ${clientNameStr}
**EMLAK KOMİSYONCUSU:** ${brokerName}
**ŞAHİTLER:** 1) ${witness1Str}  2) ${witness2Str}
`;

      return { html, markdown };
    }
  },
  {
    id: "escrow_deposit_agreement",
    titleTr: "Emanet Sözleşmesi",
    titleEn: "Escrow Deposit Agreement",
    getTemplate: (v: ContractPlaceholderValues) => {
      const currMeta = getCurrencyMeta(v.saleCurrency || "GBP");
      const currWordCompact = currMeta.wordLabel.replace(/\s+/g, "");

      const saleNum = parseNumericAmount(v.salePriceRaw || v.propertyPrice);
      const priceFormatted = saleNum > 0 ? saleNum.toLocaleString("tr-TR") : "..........";
      const priceWords = saleNum > 0 ? numberToTurkishWords(saleNum).replace(/\s+/g, "") : "....................";

      const kaporaNum = parseNumericAmount(v.salesDepositPaidAmount || v.depositAmount);
      const kaporaFormatted = kaporaNum > 0 ? kaporaNum.toLocaleString("tr-TR") : "..........";
      const kaporaWords = kaporaNum > 0 ? numberToTurkishWords(kaporaNum).replace(/\s+/g, "") : "....................";

      const remainingNum = parseNumericAmount(v.salesDepositRemainingAmount || v.remainingAmountRaw) || (saleNum > 0 && kaporaNum > 0 ? Math.max(0, saleNum - kaporaNum) : 0);
      const remainingFormatted = remainingNum > 0 ? remainingNum.toLocaleString("tr-TR") : "..........";
      const remainingWords = remainingNum > 0 ? numberToTurkishWords(remainingNum).replace(/\s+/g, "") : "....................";

      const brokerName = (v.agentAndCompany || v.ownerName || v.storeName || "EMRAH CEYHAN").trim();
      const brokerBrand = (v.storeName || "RODEL INVESTMENT").trim();
      const brokerIdStr = (v.authorizedPersonIdentity || "1170237140").trim();

      const clientNameStr = (v.clientName || "................................................").trim();
      const clientIdStr = (v.clientIdentity || "....................").trim();
      const clientIdType = (v.buyerIdType || "KKTC kimlik").trim();

      const district = (v.rentalDistrict || v.propertyLocation || "Lefkoşa").trim();
      const townVillage = (v.rentalTownVillage || "ORNİTHİ").trim();
      const ada = (v.adaNo || "165").trim();
      const parsel = (v.parselNo || "18").trim();
      const kocan = (v.kocanNo || "YENİ585").trim();
      const pafta = (v.paftaNo || "S31.D.07.D.4").trim();
      const malTanimi = (v.authPropertyCategoryOther || v.rentalPropertyDef || v.propertyTitle || "arsa").replace(/^\[Ref:[^\]]+\]\s*/i, "").trim();

      const depositDateStr = (v.depositDate || v.contractDate || "..../..../20....").trim();
      const deadlineDays = (v.escrowDeadlineDays || "15").trim();

      const html = `
        <div style="font-family: 'Times New Roman', Times, serif; line-height: 1.55; color: #0f172a; max-width: 820px; margin: 0 auto; padding: 26px 32px; border: 1px solid #cbd5e1; background: #fff;">
          <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 14px;">
            <h1 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 1px;">
              -EMANET SÖZLEŞMESİ-
            </h1>
            <div style="font-size: 12px; font-weight: bold; color: #475569; margin-top: 4px;">
              Tarih: ${v.contractDate}
            </div>
          </div>

          <div style="font-size: 13.5px; text-align: justify;">
            <p style="margin: 0 0 12px 0;">
              Bir taraftan <strong>${brokerIdStr}</strong> numaralı KKTC kimlik hamili <strong>${brokerName}</strong> (<strong>${brokerBrand}</strong>) (bundan böyle <strong>EMANETÇİ</strong> olarak anılacak), Diğer taraftan <strong>${clientIdStr}</strong> numaralı ${clientIdType} hamili <strong>${clientNameStr}</strong> (bundan böyle <strong>ALICI</strong> olarak anılacaktır). Bugün <strong>${v.contractDate}</strong> tarihinde işbu emanet sözleşmesini akdederler.
            </p>

            <div style="font-weight: bold; font-size: 13.5px; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #0f172a; padding-bottom: 3px;">
              ŞARTLAR:
            </div>

            <ol style="margin: 0 0 14px 0; padding-left: 20px;">
              <li style="margin-bottom: 7px;">
                <strong>ALICI</strong>, ${district} , ${townVillage}’de Koçan No: <strong>${kocan}</strong> Pafta No: <strong>${pafta}</strong> Ada/Blok: <strong>${ada}</strong> Parsel No: <strong>${parsel}</strong> ${malTanimi}yı satın almayı kabul ve deruhte eder.
              </li>
              <li style="margin-bottom: 7px;">
                <strong>Emanetçi</strong>, Yukarıdaki adreste bulunan Taşınmazı Alıcıya göstermiş olup Mal sahibiyle görüşmeleri sonucu mal sahibi ve alıcıyı anlaştırmıştır.
              </li>
              <li style="margin-bottom: 7px;">
                Taşınmazın satış bedeli <strong>${priceFormatted} ${currMeta.codeLabel}</strong> (<strong>${priceWords}${currWordCompact}</strong>) peşin olarak ödenecektir.
              </li>
              <li style="margin-bottom: 7px;">
                Alıcı, Emanetçi’ye <strong>${depositDateStr}</strong> tarihinde <strong>KAPORA</strong> olarak <strong>${kaporaFormatted} ${currMeta.codeLabel}</strong> (<strong>${kaporaWords}${currWordCompact}</strong>) vermiştir.
              </li>
              <li style="margin-bottom: 7px;">
                Emanetçi, Söz konusu Kapora’yı Tapu devri yapılıncaya kadar Kendi himayesinde tutacaktır.
              </li>
              <li style="margin-bottom: 7px;">
                Alıcı Bir aksilik çıkmadığı taktirde en geç Tapu Devrinde (ortalama ${deadlineDays} gün içerisinde) geriye kalan <strong>${remainingFormatted} ${currMeta.codeLabel}</strong> (<strong>${remainingWords}${currWordCompact}</strong>) Alıcı tarafından Tapu Devri yapılırken ödeyecektir.
              </li>
              <li style="margin-bottom: 7px;">
                Eğer satışta satıcı tarafından bir problem çıkarsa alınan kapora Alıcı’ya iade edilecektir.
              </li>
              <li style="margin-bottom: 7px;">
                Eğer satışta alıcı tarafından bir problem çıkarsa alınan kapora yanacak ve alıcıya iade edilmeyecektir.
              </li>
            </ol>

            ${renderCustomClausesHtml(v.customClauses)}
          </div>

          <div style="margin-top: 24px; display: flex; justify-content: space-between; gap: 20px; border-top: 2px solid #0f172a; padding-top: 16px;">
            <div style="width: 48%; padding: 12px 14px; border: 1.5px solid #0f172a; border-radius: 6px; background: #f8fafc;">
              <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 13.5px; text-transform: uppercase;">
                ALICI
              </p>
              <p style="margin: 3px 0; font-size: 13px;"><strong>Ad Soyad:</strong> ${clientNameStr}</p>
              <p style="margin: 3px 0; font-size: 13px;"><strong>Kimlik No:</strong> ${clientIdStr}</p>
              <p style="margin: 3px 0; font-size: 12px;"><strong>Tel:</strong> ${v.clientPhone || "...................."}</p>
              ${
                v.isSigned
                  ? `
                <div style="margin-top: 8px; padding: 6px; border: 2px solid #16a34a; background-color: #f0fdf4; border-radius: 6px; text-align: center;">
                  <div style="font-size: 10px; font-weight: bold; color: #15803d; text-transform: uppercase;">✔ 1. İMZA: ALICI DİJİTAL İMZASI</div>
                  ${v.signatureImage ? `<img src="${v.signatureImage}" style="max-height: 48px; margin: 4px auto; display: block;" alt="Alıcı İmzası" />` : ""}
                  <div style="font-family: monospace; font-size: 11px; color: #166534; font-weight: bold;">${v.signingName || clientNameStr}</div>
                </div>
              `
                  : `<p style="margin-top: 28px; color: #475569; font-size: 12px; font-weight: bold;">İMZA: ................................................</p>`
              }
            </div>

            <div style="width: 48%; padding: 12px 14px; border: 1.5px solid #0f172a; border-radius: 6px; background: #f8fafc;">
              <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 13.5px; text-transform: uppercase;">
                EMANETÇİ
              </p>
              <p style="margin: 3px 0; font-size: 13px;"><strong>Ad Soyad:</strong> ${brokerName}</p>
              <p style="margin: 3px 0; font-size: 13px;"><strong>KKTC Kimlik:</strong> ${brokerIdStr}</p>
              <p style="margin: 3px 0; font-size: 12px;"><strong>Unvan:</strong> ${brokerBrand}</p>
              ${
                v.sellerSigned
                  ? `
                <div style="margin-top: 8px; padding: 6px; border: 2px solid #0284c7; background-color: #f0f9ff; border-radius: 6px; text-align: center;">
                  <div style="font-size: 10px; font-weight: bold; color: #0369a1; text-transform: uppercase;">✔ 2. İMZA: EMANETÇİ DİJİTAL ONAYI</div>
                  ${v.sellerSignatureImage ? `<img src="${v.sellerSignatureImage}" style="max-height: 48px; margin: 4px auto; display: block;" alt="Emanetçi İmzası" />` : ""}
                  <div style="font-family: monospace; font-size: 11px; color: #075985; font-weight: bold;">${v.sellerSigningName || brokerName}</div>
                </div>
              `
                  : `<p style="margin-top: 28px; color: #475569; font-size: 12px; font-weight: bold;">İMZA: ................................................</p>`
              }
            </div>
          </div>
        </div>
      `;

      const markdown = `# -EMANET SÖZLEŞMESİ-
**Tarih:** ${v.contractDate}

Bir taraftan **${brokerIdStr}** numaralı KKTC kimlik hamili **${brokerName}** (**${brokerBrand}**) (bundan böyle **EMANETÇİ** olarak anılacak), Diğer taraftan **${clientIdStr}** numaralı ${clientIdType} hamili **${clientNameStr}** (bundan böyle **ALICI** olarak anılacaktır). Bugün **${v.contractDate}** tarihinde işbu emanet sözleşmesini akdederler.

### ŞARTLAR:
1. **ALICI**, ${district} , ${townVillage}’de Koçan No: **${kocan}** Pafta No: **${pafta}** Ada/Blok: **${ada}** Parsel No: **${parsel}** ${malTanimi}yı satın almayı kabul ve deruhte eder.
2. **Emanetçi**, Yukarıdaki adreste bulunan Taşınmazı Alıcıya göstermiş olup Mal sahibiyle görüşmeleri sonucu mal sahibi ve alıcıyı anlaştırmıştır.
3. Taşınmazın satış bedeli **${priceFormatted} ${currMeta.codeLabel}** (**${priceWords}${currWordCompact}**) peşin olarak ödenecektir.
4. Alıcı, Emanetçi’ye **${depositDateStr}** tarihinde **KAPORA** olarak **${kaporaFormatted} ${currMeta.codeLabel}** (**${kaporaWords}${currWordCompact}**) vermiştir.
5. Emanetçi, Söz konusu Kapora’yı Tapu devri yapılıncaya kadar Kendi himayesinde tutacaktır.
6. Alıcı Bir aksilik çıkmadığı taktirde en geç Tapu Devrinde (ortalama ${deadlineDays} gün içerisinde) geriye kalan **${remainingFormatted} ${currMeta.codeLabel}** (**${remainingWords}${currWordCompact}**) Alıcı tarafından Tapu Devri yapılırken ödeyecektir.
7. Eğer satışta satıcı tarafından bir problem çıkarsa alınan kapora Alıcı’ya iade edilecektir.
8. Eğer satışta alıcı tarafından bir problem çıkarsa alınan kapora yanacak ve alıcıya iade edilmeyecektir.
${renderCustomClausesMarkdown(v.customClauses)}

**ALICI:** ${clientNameStr} (${clientIdStr})
**EMANETÇİ:** ${brokerName} (${brokerIdStr})
`;

      return { html, markdown };
    }
  },
  {
    id: "property_reservation_deposit",
    titleTr: "Gayrimenkul Kapora Anlaşması (2 Katı Cayma Cezalı)",
    titleEn: "Property Reservation & Deposit Agreement (Double Penalty)",
    getTemplate: (v: ContractPlaceholderValues) => {
      const currMeta = getCurrencyMeta(v.saleCurrency || "GBP");
      const currWordCompact = currMeta.wordLabel.replace(/\s+/g, "");

      const saleNum = parseNumericAmount(v.salePriceRaw || v.propertyPrice);
      const priceFormatted = saleNum > 0 ? saleNum.toLocaleString("tr-TR") : "........................................";
      const priceWords = saleNum > 0 ? numberToTurkishWords(saleNum).replace(/\s+/g, "") : "....................";

      const kaporaNum = parseNumericAmount(v.salesDepositPaidAmount || v.depositAmount);
      const kaporaFormatted = kaporaNum > 0 ? kaporaNum.toLocaleString("tr-TR") : "....................";
      const kaporaWords = kaporaNum > 0 ? numberToTurkishWords(kaporaNum).replace(/\s+/g, "") : "....................";

      const clientNameStr = (v.clientName || "...............................................................................................").trim();
      const clientIdStr = (v.clientIdentity || "........................................").trim();
      const clientPhoneStr = (v.clientPhone || "........................................").trim();

      const ownerNameStr = (v.ownerName || "...............................................................................................").trim();
      const ownerIdStr = (v.sellerIdentity || "........................................").trim();
      const ownerPhoneStr = (v.ownerPhone || "........................................").trim();

      const propAddr = (v.propertyAddress || [v.rentalTownVillage, v.rentalDistrict, v.propertyLocation].filter(Boolean).join(" / ") || ".......................................................................................................").trim();
      const kocan = (v.kocanNo || ".....................................................").trim();
      const ada = (v.adaNo || ".............................................................").trim();
      const townVillage = (v.rentalTownVillage || "......................................................").trim();
      const pafta = (v.paftaNo || ".................................................").trim();
      const district = (v.rentalDistrict || "...........................................................").trim();
      const parsel = (v.parselNo || "...........................................................").trim();

      const reservationDaysStr = (v.reservationDays || "15 (on beş)").trim();

      const witness1Name = (v.witness1Name || "......................................................").trim();
      const witness1Id = (v.witness1Identity || "........................................").trim();
      const witness2Name = (v.witness2Name || "......................................................").trim();
      const witness2Id = (v.witness2Identity || "........................................").trim();

      const html = `
        <div style="font-family: 'Times New Roman', Times, serif; line-height: 1.52; color: #0f172a; max-width: 820px; margin: 0 auto; padding: 26px 32px; border: 1px solid #cbd5e1; background: #fff;">
          <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 14px;">
            <h1 style="margin: 0; font-size: 19px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
              GAYRİMENKUL KAPORA ANLAŞMASI
            </h1>
            <div style="font-size: 12.5px; font-weight: bold; margin-top: 4px;">
              Tarih: ${v.contractDate}
            </div>
          </div>

          <div style="font-size: 13.5px; text-align: justify;">
            <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 14px; margin-bottom: 12px; background: #f8fafc;">
              <p style="margin: 2px 0;"><strong>Alıcı Adı / Soyadı:</strong> ${clientNameStr}</p>
              <p style="margin: 2px 0;"><strong>Satıcı Adı / Soyadı:</strong> ${ownerNameStr}</p>
              <p style="margin: 4px 0 2px 0; font-size: 14px;">
                <strong>Gayrimenkulün satış bedeli:</strong> <strong>${priceFormatted} ${currMeta.codeLabel}</strong> ${saleNum > 0 ? `(${priceWords}${currWordCompact})` : ""}
              </p>
            </div>

            <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 14px; margin-bottom: 12px; background: #ffffff;">
              <div style="font-weight: bold; font-size: 13px; text-transform: uppercase; margin-bottom: 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;">
                Gayrimenkulün Bilgileri:
              </div>
              <p style="margin: 2px 0;"><strong>Gayrimenkulün adresi:</strong> ${propAddr}</p>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 3px; margin-top: 4px;">
                <div><strong>Koçan no:</strong> ${kocan}</div>
                <div><strong>Ada:</strong> ${ada}</div>
                <div><strong>Mahalle:</strong> ${townVillage}</div>
                <div><strong>Pafta/Harita:</strong> ${pafta}</div>
                <div><strong>Kaza:</strong> ${district}</div>
                <div><strong>Parsel:</strong> ${parsel}</div>
              </div>
            </div>

            <p style="margin: 0 0 10px 0; font-size: 13.5px; background: #fffbeb; padding: 8px 12px; border: 1px solid #fde68a; border-radius: 6px;">
              <strong>Kapora miktarı:</strong> <strong>${kaporaFormatted} ${currMeta.codeLabel}</strong> ${kaporaNum > 0 ? `(${kaporaWords}${currWordCompact})` : ""}, iş bu meblağ geri ödemesiz olarak alıcı tarafından ödenir.
            </p>

            <p style="margin: 0 0 8px 0; font-weight: bold;">
              Taraflar aralarında iş bu kapora anlaşmasını tam mütabakat ile yaparlar, şöyle ki;
            </p>

            <ol style="margin: 0 0 14px 0; padding-left: 20px;">
              <li style="margin-bottom: 6px;">
                Satıcı iş bu anlaşma ile yukarıda detayları verilen gayrimenkulü, alıcıdan almış olduğu geri ödemesiz meblağ karşılığında bu anlaşmanın imza tarihinden itibaren <strong>${reservationDaysStr}</strong> günü rezerve ettiğini ve bu süre içerisinde başka bir alıcıya satmayacağını kabul ve taahhüt eder.
              </li>
              <li style="margin-bottom: 6px;">
                İş bu sözleşme altında, söz konusu kaporaya konu meblağ, alıcı tarafından satıcıya bir tamam verilir ve yukarıda detayları verilen gayrimenkulün satışı tamamlanıncaya kadar söz konusu kaporayı himayesinde tutar.
              </li>
              <li style="margin-bottom: 6px;">
                İlgili sürede, satış sözleşmesi elde olmayan sebeplerden dolayı tamamlanamazsa geçerli mazeret gösterilmesi şartı ile süre komisyoncunun izni ile 7 iş günü daha uzatılabilir.
              </li>
              <li style="margin-bottom: 6px;">
                Alıcı tarafından ödenmiş kapora'nın taraflar arası satış anlaşmasının imzalanmasından sonra, toplam satış bedeline mahsuben yapılmış bir ödeme sayılacağı kabul edilir.
              </li>
              <li style="margin-bottom: 6px; color: #991b1b; font-weight: bold;">
                Satıcı, gayrimenkulü rezarvasyon süresi bittiğinde veya bu süre içinde gayrimenkulü satmaktan vazgeçer, imtina eder, ve/veya ayrılan sürenin sonunda satışı gerçekleştirmez ise, alıcı'ya cezai müeyyide olarak kapora miktarının 2 katı (alınan kaporanın iadesi ve kapora miktarı kadar cayma bedeli) bedel ödemekle yükümlü olduğunu kabul ve beyan eder.
              </li>
              <li style="margin-bottom: 6px;">
                Taraflar, alıcı'nın söz konusu gayrimenkulü satın almaktan vazgeçtiği hallerde ve/veya belirlenen süre zarfında gayrimenkulün satışına ilişkin yükümlülüklerini yerine getirmede imtina ederse, söz konusu kapora meblağı satıcıya kalacağını ve bu meblağın alıcıya geri ödenmeyeceği hususunda iş bu sözleşme altında mutabakata varmışlardır.
              </li>
              <li style="margin-bottom: 6px;">
                Satıcı ve alıcı,satıcı himayesinde bulunan mevcut kapora'nın işbu sözleşme tahtında icrasına komisyoncuya yetki verir ve bu konu ile ilgili olarak doğabilecek tüm yükümlülüklerini kaldırır ve üçüncü kişilere karşı ibra eder.
              </li>
              <li style="margin-bottom: 6px;">
                Alıcı işbu sözleşme ile satıcıdan ilgili gayrimenkule ilişkin ayrıntılı bilgiyi ilgili yasal mevzuat bağlamında almış olduğunu kabul ve beyan eder.
              </li>
            </ol>

            ${renderCustomClausesHtml(v.customClauses)}
          </div>

          <div style="margin-top: 18px; display: flex; justify-content: space-between; gap: 16px; border-top: 2px solid #0f172a; padding-top: 14px;">
            <div style="width: 48%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 6px; background: #f8fafc;">
              <p style="margin: 0 0 6px 0; font-weight: bold; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
                ALICI
              </p>
              <p style="margin: 3px 0; font-size: 12px;"><strong>Adı Soyadı:</strong> ${clientNameStr}</p>
              <p style="margin: 3px 0; font-size: 12px;"><strong>P./K. No:</strong> ${clientIdStr}</p>
              <p style="margin: 3px 0; font-size: 12px;"><strong>Tel:</strong> ${clientPhoneStr}</p>
              ${
                v.isSigned
                  ? `
                <div style="margin-top: 8px; padding: 6px; border: 2px solid #16a34a; background-color: #f0fdf4; border-radius: 6px; text-align: center;">
                  <div style="font-size: 10px; font-weight: bold; color: #15803d; text-transform: uppercase;">✔ 1. İMZA: ALICI DİJİTAL ONAYI</div>
                  ${v.signatureImage ? `<img src="${v.signatureImage}" style="max-height: 48px; margin: 4px auto; display: block;" alt="Alıcı İmzası" />` : ""}
                  <div style="font-family: monospace; font-size: 11px; color: #166534; font-weight: bold;">${v.signingName || clientNameStr}</div>
                </div>
              `
                  : `<p style="margin-top: 24px; color: #475569; font-size: 12px; font-weight: bold;">İMZA: ................................................</p>`
              }
            </div>

            <div style="width: 48%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 6px; background: #f8fafc;">
              <p style="margin: 0 0 6px 0; font-weight: bold; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
                SATICI
              </p>
              <p style="margin: 3px 0; font-size: 12px;"><strong>Adı Soyadı:</strong> ${ownerNameStr}</p>
              <p style="margin: 3px 0; font-size: 12px;"><strong>P./K. No:</strong> ${ownerIdStr}</p>
              <p style="margin: 3px 0; font-size: 12px;"><strong>Tel:</strong> ${ownerPhoneStr}</p>
              ${
                v.sellerSigned
                  ? `
                <div style="margin-top: 8px; padding: 6px; border: 2px solid #0284c7; background-color: #f0f9ff; border-radius: 6px; text-align: center;">
                  <div style="font-size: 10px; font-weight: bold; color: #0369a1; text-transform: uppercase;">✔ 2. İMZA: SATICI DİJİTAL ONAYI</div>
                  ${v.sellerSignatureImage ? `<img src="${v.sellerSignatureImage}" style="max-height: 48px; margin: 4px auto; display: block;" alt="Satıcı İmzası" />` : ""}
                  <div style="font-family: monospace; font-size: 11px; color: #075985; font-weight: bold;">${v.sellerSigningName || ownerNameStr}</div>
                </div>
              `
                  : `<p style="margin-top: 24px; color: #475569; font-size: 12px; font-weight: bold;">İMZA: ................................................</p>`
              }
            </div>
          </div>

          <div style="margin-top: 14px; display: flex; justify-content: space-between; gap: 16px; border-top: 1px dashed #cbd5e1; padding-top: 10px; font-size: 12px;">
            <div style="width: 48%;">
              <p style="margin: 0 0 3px 0; font-weight: bold;">ŞAHİT 1</p>
              <p style="margin: 2px 0;"><strong>Adı Soyadı:</strong> ${witness1Name}</p>
              <p style="margin: 2px 0;"><strong>P./K. No:</strong> ${witness1Id}</p>
              <p style="margin: 6px 0 0 0; color: #64748b;">İmza: ................................................</p>
            </div>
            <div style="width: 48%;">
              <p style="margin: 0 0 3px 0; font-weight: bold;">ŞAHİT 2</p>
              <p style="margin: 2px 0;"><strong>Adı Soyadı:</strong> ${witness2Name}</p>
              <p style="margin: 2px 0;"><strong>P./K. No:</strong> ${witness2Id}</p>
              <p style="margin: 6px 0 0 0; color: #64748b;">İmza: ................................................</p>
            </div>
          </div>
        </div>
      `;

      const markdown = `# GAYRİMENKUL KAPORA ANLAŞMASI
**Tarih:** ${v.contractDate}

- **Alıcı Adı / Soyadı:** ${clientNameStr}
- **Satıcı Adı / Soyadı:** ${ownerNameStr}
- **Gayrimenkulün satış bedeli:** ${priceFormatted} ${currMeta.codeLabel} (${priceWords}${currWordCompact})
- **Gayrimenkulün adresi:** ${propAddr}
- **Koçan no:** ${kocan} | **Ada:** ${ada}
- **Mahalle:** ${townVillage} | **Pafta/Harita:** ${pafta}
- **Kaza:** ${district} | **Parsel:** ${parsel}
- **Kapora miktarı:** ${kaporaFormatted} ${currMeta.codeLabel} (${kaporaWords}${currWordCompact}), iş bu meblağ geri ödemesiz olarak alıcı tarafından ödenir.

Taraflar aralarında iş bu kapora anlaşmasını tam mütabakat ile yaparlar, şöyle ki;
1. Satıcı iş bu anlaşma ile yukarıda detayları verilen gayrimenkulü, alıcıdan almış olduğu geri ödemesiz meblağ karşılığında bu anlaşmanın imza tarihinden itibaren **${reservationDaysStr}** günü rezerve ettiğini ve bu süre içerisinde başka bir alıcıya satmayacağını kabul ve taahhüt eder.
2. İş bu sözleşme altında, söz konusu kaporaya konu meblağ, alıcı tarafından satıcıya bir tamam verilir ve yukarıda detayları verilen gayrimenkulün satışı tamamlanıncaya kadar söz konusu kaporayı himayesinde tutar.
3. İlgili sürede, satış sözleşmesi elde olmayan sebeplerden dolayı tamamlanamazsa geçerli mazeret gösterilmesi şartı ile süre komisyoncunun izni ile 7 iş günü daha uzatılabilir.
4. Alıcı tarafından ödenmiş kapora'nın taraflar arası satış anlaşmasının imzalanmasından sonra, toplam satış bedeline mahsuben yapılmış bir ödeme sayılacağı kabul edilir.
5. Satıcı, gayrimenkulü rezarvasyon süresi bittiğinde veya bu süre içinde gayrimenkulü satmaktan vazgeçer, imtina eder, ve/veya ayrılan sürenin sonunda satışı gerçekleştirmez ise, alıcı'ya cezai müeyyide olarak **kapora miktarının 2 katı** (alınan kaporanın iadesi ve kapora miktarı kadar cayma bedeli) bedel ödemekle yükümlü olduğunu kabul ve beyan eder.
6. Taraflar, alıcı'nın söz konusu gayrimenkulü satın almaktan vazgeçtiği hallerde ve/veya belirlenen süre zarfında gayrimenkulün satışına ilişkin yükümlülüklerini yerine getirmede imtina ederse, söz konusu kapora meblağı satıcıya kalacağını ve bu meblağın alıcıya geri ödenmeyeceği hususunda iş bu sözleşme altında mutabakata varmışlardır.
7. Satıcı ve alıcı,satıcı himayesinde bulunan mevcut kapora'nın işbu sözleşme tahtında icrasına komisyoncuya yetki verir ve bu konu ile ilgili olarak doğabilecek tüm yükümlülüklerini kaldırır ve üçüncü kişilere karşı ibra eder.
8. Alıcı işbu sözleşme ile satıcıdan ilgili gayrimenkule ilişkin ayrıntılı bilgiyi ilgili yasal mevzuat bağlamında almış olduğunu kabul ve beyan eder.
${renderCustomClausesMarkdown(v.customClauses)}

**ALICI:** ${clientNameStr} (P./K. No: ${clientIdStr})
**SATICI:** ${ownerNameStr} (P./K. No: ${ownerIdStr})
**ŞAHİT 1:** ${witness1Name} (${witness1Id})
**ŞAHİT 2:** ${witness2Name} (${witness2Id})
`;

      return { html, markdown };
    }
  },
  {
    id: "rental_commission_receipt",
    titleTr: "Kiralık Komisyon Alım Belgesi",
    titleEn: "Rental Commission Receipt",
    getTemplate: (v: ContractPlaceholderValues) => {
      const currMeta = getCurrencyMeta(v.rentCurrency || v.saleCurrency || "GBP");
      const currWordCompact = currMeta.wordLabel.replace(/\s+/g, "");

      // Resolve numeric amount for commission
      let commissionNum = parseNumericAmount(v.commissionAmountWords || v.depositAmount || v.kaporaCommissionAmount || v.commissionRate);
      if (commissionNum <= 0) {
        // If commissionRate is percentage like "%5" and rentPrice is known
        const rentNum = parseNumericAmount(v.rentPriceRaw || v.propertyPrice);
        if (rentNum > 0) {
          const rateMatch = String(v.commissionRate || "").match(/\d+/);
          const pct = rateMatch ? parseFloat(rateMatch[0]) : 0;
          if (pct > 0 && pct <= 100) {
            commissionNum = Math.round((rentNum * pct) / 100);
          } else {
            // Default to 1 month rent if rent property
            commissionNum = rentNum;
          }
        }
      }

      const commissionFormatted = commissionNum > 0 ? commissionNum.toLocaleString("tr-TR") : "....................";
      const commissionWords = commissionNum > 0 ? numberToTurkishWords(commissionNum).replace(/\s+/g, "") : "....................";

      const receiptNo = (v.commissionReceiptNo || `MAK-KIR-${(v.contractDate || "").replace(/\D/g, "").slice(0, 8) || "001"}`).trim();
      const propAddr = (v.propertyAddress || v.rentalAddress || [v.rentalTownVillage, v.rentalDistrict, v.propertyLocation].filter(Boolean).join(" / ") || ".......................................................................................................").trim();
      const propDetails = (v.propertyTitle || "Kiralık Gayrimenkul").trim();
      const paymentMethod = (v.commissionPaymentMethod || "Nakit").trim();

      const brokerTitle = (v.commissionBrokerTitle || v.agentAndCompany || v.storeName || "Rodel Investment").trim();
      const brokerIdentity = (v.authorizedPersonIdentity || "1170237140").trim();
      const brokerPhone = (v.storePhone || "").trim();
      const brokerAddr = (v.brokerAddress || "Atatürk Caddesi No: 81/A Küçük Kaymaklı / Lefkoşa").trim();

      const tenantName = (v.clientName || "...............................................................................................").trim();
      const tenantId = (v.clientIdentity || "........................................").trim();
      const tenantPhone = (v.clientPhone || "........................................").trim();

      const html = `
        <div style="font-family: 'Times New Roman', Times, serif; line-height: 1.55; color: #0f172a; max-width: 820px; margin: 0 auto; padding: 30px 36px; border: 2px solid #0f172a; background: #ffffff; position: relative;">
          <!-- Top Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
            <div>
              <div style="font-size: 18px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
                ${v.storeName || "YETKİLİ EMLAK DANIŞMANLIĞI"}
              </div>
              <div style="font-size: 11.5px; color: #475569; margin-top: 3px;">
                ${brokerAddr}
              </div>
              <div style="font-size: 11.5px; color: #475569;">
                İletişim: <strong>${brokerPhone || "Belirtilmedi"}</strong>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="display: inline-block; padding: 4px 10px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px; font-weight: bold; color: #0f172a;">
                Makbuz No: ${receiptNo}
              </div>
              <div style="font-size: 12px; font-weight: bold; color: #334155; margin-top: 5px;">
                Tarih: ${v.contractDate || "..../..../20...."}
              </div>
            </div>
          </div>

          <!-- Document Title -->
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 21px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; color: #0f172a; text-decoration: underline;">
              KİRALIK KOMİSYON ALIM BELGESİ
            </h1>
            <div style="font-size: 12px; font-style: italic; color: #64748b; margin-top: 4px;">
              (Kiralama Hizmet Bedeli Tahsilat Makbuzu)
            </div>
          </div>

          <!-- Section 1: Kiralanan Gayrimenkul -->
          <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px 16px; margin-bottom: 14px; background: #f8fafc;">
            <div style="font-size: 12px; font-weight: 900; text-transform: uppercase; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">
              KİRALANAN GAYRİMENKULÜN BİLGİLERİ
            </div>
            <p style="margin: 4px 0; font-size: 13.5px;">
              <strong>KİRALANAN ADRES :</strong> ${propAddr}
            </p>
            <p style="margin: 4px 0; font-size: 13px; color: #1e293b;">
              <strong>Mülk & Ref Bilgisi :</strong> ${propDetails}
            </p>
            ${(v.adaNo || v.parselNo || v.kocanNo) ? `
              <p style="margin: 4px 0; font-size: 12px; color: #475569;">
                <strong>Kadastro :</strong> Ada: ${v.adaNo || "-"} | Parsel: ${v.parselNo || "-"} | Pafta: ${v.paftaNo || "-"} | Koçan No: ${v.kocanNo || "-"}
              </p>
            ` : ""}
          </div>

          <!-- Section 2: Alınan Komisyon Bedeli -->
          <div style="border: 2px solid #0284c7; border-radius: 6px; padding: 14px 16px; margin-bottom: 16px; background: #f0f9ff;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px;">
              <div style="font-size: 15px; font-weight: 900; color: #0369a1; text-transform: uppercase;">
                ALINAN KOMİSYON BEDELİ:
              </div>
              <div style="font-size: 18px; font-weight: 900; color: #0c4a6e;">
                ${commissionFormatted} ${currMeta.codeLabel}
              </div>
            </div>
            ${commissionNum > 0 ? `
              <div style="font-size: 13px; font-weight: bold; color: #075985; margin-top: 4px;">
                Yalnız : ${commissionWords} ${currWordCompact}
              </div>
            ` : ""}
            <div style="margin-top: 8px; font-size: 12px; color: #0369a1; display: flex; gap: 16px;">
              <div><strong>Ödeme Şekli:</strong> ${paymentMethod}</div>
              <div><strong>Hizmet Türü:</strong> Gayrimenkul Kiralama Aracılık Bedeli</div>
            </div>
          </div>

          <!-- Legal Confirmation Text -->
          <p style="font-size: 12.5px; text-align: justify; margin: 0 0 20px 0; color: #334155; line-height: 1.5;">
            Yukarıda açık adresi ve portföy bilgileri yer alan gayrimenkulün kiralanmasına istinaden; Gayrimenkulü Kiralayan Aracı tarafından sunulan tanıtım, pazarlama ve kiralama aracılık hizmetleri karşılığında kararlaştırılan hizmet komisyon bedeli kiracıdan eksiksiz olarak tahsil edilmiş olup, taraflar bu hususta tam mutabakata varmışlardır.
          </p>

          ${renderCustomClausesHtml(v.customClauses)}

          <!-- Signatures Section -->
          <div style="display: flex; justify-content: space-between; gap: 20px; border-top: 2px solid #0f172a; padding-top: 14px; margin-top: 10px;">
            <!-- Aracı Tarafı -->
            <div style="width: 48%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 6px; background: #f8fafc; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="font-size: 12px; font-weight: 900; text-transform: uppercase; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px;">
                  GAYRİMENKULÜ KİRALAYAN ARACI
                </div>
                <p style="margin: 3px 0; font-size: 12px;"><strong>Ünvan:</strong> ${brokerTitle}</p>
                <p style="margin: 3px 0; font-size: 12px;"><strong>Yetkili KKTC No:</strong> ${brokerIdentity}</p>
                <p style="margin: 3px 0; font-size: 12px;"><strong>Tel:</strong> ${brokerPhone || "Belirtilmedi"}</p>
              </div>
              <div style="margin-top: 20px; text-align: center;">
                ${
                  v.sellerSigned
                    ? `
                  <div style="padding: 6px; border: 2px solid #0284c7; background-color: #f0f9ff; border-radius: 6px;">
                    <div style="font-size: 9px; font-weight: bold; color: #0369a1; text-transform: uppercase;">✔ ARACI DİJİTAL ONAYI</div>
                    ${v.sellerSignatureImage ? `<img src="${v.sellerSignatureImage}" style="max-height: 44px; margin: 4px auto; display: block;" alt="Aracı İmzası" />` : ""}
                    <div style="font-family: monospace; font-size: 11px; color: #075985; font-weight: bold;">${v.sellerSigningName || brokerTitle}</div>
                  </div>
                `
                    : `<p style="color: #64748b; font-size: 11px; font-weight: bold; border-top: 1px dashed #cbd5e1; padding-top: 8px;">KAŞE & İMZA: ............................................</p>`
                }
              </div>
            </div>

            <!-- Kiracı Tarafı -->
            <div style="width: 48%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 6px; background: #f8fafc; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="font-size: 12px; font-weight: 900; text-transform: uppercase; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px;">
                  KİRACI (ÖDEMEYİ YAPAN)
                </div>
                <p style="margin: 3px 0; font-size: 12px;"><strong>Adı Soyadı:</strong> ${tenantName}</p>
                <p style="margin: 3px 0; font-size: 12px;"><strong>P./K./Kimlik No:</strong> ${tenantId}</p>
                <p style="margin: 3px 0; font-size: 12px;"><strong>Tel:</strong> ${tenantPhone}</p>
              </div>
              <div style="margin-top: 20px; text-align: center;">
                ${
                  v.isSigned
                    ? `
                  <div style="padding: 6px; border: 2px solid #16a34a; background-color: #f0fdf4; border-radius: 6px;">
                    <div style="font-size: 9px; font-weight: bold; color: #15803d; text-transform: uppercase;">✔ KİRACI DİJİTAL ONAYI</div>
                    ${v.signatureImage ? `<img src="${v.signatureImage}" style="max-height: 44px; margin: 4px auto; display: block;" alt="Kiracı İmzası" />` : ""}
                    <div style="font-family: monospace; font-size: 11px; color: #166534; font-weight: bold;">${v.signingName || tenantName}</div>
                  </div>
                `
                    : `<p style="color: #64748b; font-size: 11px; font-weight: bold; border-top: 1px dashed #cbd5e1; padding-top: 8px;">İMZA: ............................................</p>`
                }
              </div>
            </div>
          </div>

          <!-- Bottom Footer -->
          <div style="margin-top: 16px; border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #94a3b8;">
            <span>Resmi Belge No: ${receiptNo}</span>
            <span>LookPrice Real Estate E-Sözleşme & Makbuz Sistemi</span>
          </div>
        </div>
      `;

      const markdown = `# KİRALIK KOMİSYON ALIM BELGESİ
**Makbuz No:** ${receiptNo}
**Tarih:** ${v.contractDate || ""}

- **KİRALANAN ADRES :** ${propAddr}
- **Mülk Detayı :** ${propDetails}
- **ALINAN KOMİSYON BEDELİ :** ${commissionFormatted} ${currMeta.codeLabel} (${commissionWords} ${currWordCompact})
- **Ödeme Şekli :** ${paymentMethod}

${renderCustomClausesMarkdown(v.customClauses)}

**GAYRİMENKULÜ KİRALAYAN ARACI:** ${brokerTitle} (${brokerIdentity})
**KİRACI:** ${tenantName} (${tenantId})
`;

      return { html, markdown };
    }
  },
  {
    id: "sales_commission_receipt",
    titleTr: "Satılık Komisyon Alım Belgesi",
    titleEn: "Sales Commission Receipt",
    getTemplate: (v: ContractPlaceholderValues) => {
      const currMeta = getCurrencyMeta(v.saleCurrency || "GBP");
      const currWordCompact = currMeta.wordLabel.replace(/\s+/g, "");

      // Resolve numeric amount for commission
      let commissionNum = parseNumericAmount(v.commissionAmountWords || v.depositAmount || v.kaporaCommissionAmount || v.commissionRate);
      if (commissionNum <= 0) {
        // If commissionRate is percentage like "%5" and salePrice is known
        const saleNum = parseNumericAmount(v.salePriceRaw || v.propertyPrice);
        if (saleNum > 0) {
          const rateMatch = String(v.commissionRate || "").match(/\d+/);
          const pct = rateMatch ? parseFloat(rateMatch[0]) : 5;
          commissionNum = Math.round((saleNum * pct) / 100);
        }
      }

      const commissionFormatted = commissionNum > 0 ? commissionNum.toLocaleString("tr-TR") : "....................";
      const commissionWords = commissionNum > 0 ? numberToTurkishWords(commissionNum).replace(/\s+/g, "") : "....................";

      const receiptNo = (v.commissionReceiptNo || `MAK-SAT-${(v.contractDate || "").replace(/\D/g, "").slice(0, 8) || "001"}`).trim();
      const propAddr = (v.propertyAddress || [v.rentalTownVillage, v.rentalDistrict, v.propertyLocation].filter(Boolean).join(" / ") || ".......................................................................................................").trim();
      const propDetails = (v.propertyTitle || "Satılık Gayrimenkul").trim();
      const paymentMethod = (v.commissionPaymentMethod || "Banka Havalesi / EFT").trim();

      const brokerTitle = (v.commissionBrokerTitle || v.agentAndCompany || v.storeName || "Rodel Investment").trim();
      const brokerIdentity = (v.authorizedPersonIdentity || "1170237140").trim();
      const brokerPhone = (v.storePhone || "").trim();
      const brokerAddr = (v.brokerAddress || "Atatürk Caddesi No: 81/A Küçük Kaymaklı / Lefkoşa").trim();

      // Payer is owner by default, or client (buyer)
      const payerName = (v.commissionPayerName || v.ownerName || v.clientName || "...............................................................................................").trim();
      const payerId = (v.commissionPayerIdentity || v.sellerIdentity || v.clientIdentity || "........................................").trim();
      const payerPhone = (v.commissionPayerPhone || v.ownerPhone || v.clientPhone || "........................................").trim();
      const payerRole = (v.commissionPayerRole || "MAL SAHİBİ").trim();

      const html = `
        <div style="font-family: 'Times New Roman', Times, serif; line-height: 1.55; color: #0f172a; max-width: 820px; margin: 0 auto; padding: 30px 36px; border: 2px solid #0f172a; background: #ffffff; position: relative;">
          <!-- Top Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
            <div>
              <div style="font-size: 18px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
                ${v.storeName || "YETKİLİ EMLAK DANIŞMANLIĞI"}
              </div>
              <div style="font-size: 11.5px; color: #475569; margin-top: 3px;">
                ${brokerAddr}
              </div>
              <div style="font-size: 11.5px; color: #475569;">
                İletişim: <strong>${brokerPhone || "Belirtilmedi"}</strong>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="display: inline-block; padding: 4px 10px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px; font-weight: bold; color: #0f172a;">
                Makbuz No: ${receiptNo}
              </div>
              <div style="font-size: 12px; font-weight: bold; color: #334155; margin-top: 5px;">
                Tarih: ${v.contractDate || "..../..../20...."}
              </div>
            </div>
          </div>

          <!-- Document Title -->
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 21px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; color: #0f172a; text-decoration: underline;">
              SATILIK KOMİSYON ALIM BELGESİ
            </h1>
            <div style="font-size: 12px; font-style: italic; color: #64748b; margin-top: 4px;">
              (Gayrimenkul Satış Hizmet Bedeli Tahsilat Makbuzu)
            </div>
          </div>

          <!-- Section 1: Satılan Gayrimenkul -->
          <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px 16px; margin-bottom: 14px; background: #f8fafc;">
            <div style="font-size: 12px; font-weight: 900; text-transform: uppercase; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">
              SATILAN GAYRİMENKULÜN BİLGİLERİ
            </div>
            <p style="margin: 4px 0; font-size: 13.5px;">
              <strong>SATILAN GAYRİMENKUL ADRES :</strong> ${propAddr}
            </p>
            <p style="margin: 4px 0; font-size: 13px; color: #1e293b;">
              <strong>Mülk & Ref Bilgisi :</strong> ${propDetails}
            </p>
            ${(v.adaNo || v.parselNo || v.kocanNo) ? `
              <p style="margin: 4px 0; font-size: 12px; color: #475569;">
                <strong>Kadastro :</strong> Ada: ${v.adaNo || "-"} | Parsel: ${v.parselNo || "-"} | Pafta: ${v.paftaNo || "-"} | Koçan No: ${v.kocanNo || "-"}
              </p>
            ` : ""}
          </div>

          <!-- Section 2: Alınan Komisyon Bedeli -->
          <div style="border: 2px solid #16a34a; border-radius: 6px; padding: 14px 16px; margin-bottom: 16px; background: #f0fdf4;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px;">
              <div style="font-size: 15px; font-weight: 900; color: #15803d; text-transform: uppercase;">
                ALINAN KOMİSYON BEDELİ:
              </div>
              <div style="font-size: 18px; font-weight: 900; color: #14532d;">
                ${commissionFormatted} ${currMeta.codeLabel}
              </div>
            </div>
            ${commissionNum > 0 ? `
              <div style="font-size: 13px; font-weight: bold; color: #166534; margin-top: 4px;">
                Yalnız : ${commissionWords} ${currWordCompact}
              </div>
            ` : ""}
            <div style="margin-top: 8px; font-size: 12px; color: #15803d; display: flex; gap: 16px;">
              <div><strong>Ödeme Şekli:</strong> ${paymentMethod}</div>
              <div><strong>Hizmet Türü:</strong> Gayrimenkul Satış Aracılık Bedeli</div>
            </div>
          </div>

          <!-- Legal Confirmation Text -->
          <p style="font-size: 12.5px; text-align: justify; margin: 0 0 20px 0; color: #334155; line-height: 1.5;">
            Yukarıda açık adresi ve tapu kayıt bilgileri yer alan gayrimenkulün satış işlemine istinaden; Gayrimenkulü Satan Aracı tarafından yürütülen tanıtım, pazarlama ve satış aracılık hizmetleri neticesinde hak kazanılan hizmet komisyon bedeli tahsil edilmiş olup, taraflar bu tutarın eksiksiz ödendiği hususunda tam mutabakata varmışlardır.
          </p>

          ${renderCustomClausesHtml(v.customClauses)}

          <!-- Signatures Section -->
          <div style="display: flex; justify-content: space-between; gap: 20px; border-top: 2px solid #0f172a; padding-top: 14px; margin-top: 10px;">
            <!-- Aracı Tarafı -->
            <div style="width: 48%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 6px; background: #f8fafc; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="font-size: 12px; font-weight: 900; text-transform: uppercase; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px;">
                  GAYRİ MENKULÜ SATAN ARACI
                </div>
                <p style="margin: 3px 0; font-size: 12px;"><strong>Ünvan:</strong> ${brokerTitle}</p>
                <p style="margin: 3px 0; font-size: 12px;"><strong>Yetkili KKTC No:</strong> ${brokerIdentity}</p>
                <p style="margin: 3px 0; font-size: 12px;"><strong>Tel:</strong> ${brokerPhone || "Belirtilmedi"}</p>
              </div>
              <div style="margin-top: 20px; text-align: center;">
                ${
                  v.sellerSigned
                    ? `
                  <div style="padding: 6px; border: 2px solid #0284c7; background-color: #f0f9ff; border-radius: 6px;">
                    <div style="font-size: 9px; font-weight: bold; color: #0369a1; text-transform: uppercase;">✔ ARACI DİJİTAL ONAYI</div>
                    ${v.sellerSignatureImage ? `<img src="${v.sellerSignatureImage}" style="max-height: 44px; margin: 4px auto; display: block;" alt="Aracı İmzası" />` : ""}
                    <div style="font-family: monospace; font-size: 11px; color: #075985; font-weight: bold;">${v.sellerSigningName || brokerTitle}</div>
                  </div>
                `
                    : `<p style="color: #64748b; font-size: 11px; font-weight: bold; border-top: 1px dashed #cbd5e1; padding-top: 8px;">KAŞE & İMZA: ............................................</p>`
                }
              </div>
            </div>

            <!-- Mal Sahibi / Ödeyen Tarafı -->
            <div style="width: 48%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 6px; background: #f8fafc; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="font-size: 12px; font-weight: 900; text-transform: uppercase; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px;">
                  ${payerRole.toUpperCase()}
                </div>
                <p style="margin: 3px 0; font-size: 12px;"><strong>Adı Soyadı:</strong> ${payerName}</p>
                <p style="margin: 3px 0; font-size: 12px;"><strong>P./K./Kimlik No:</strong> ${payerId}</p>
                <p style="margin: 3px 0; font-size: 12px;"><strong>Tel:</strong> ${payerPhone}</p>
              </div>
              <div style="margin-top: 20px; text-align: center;">
                ${
                  v.isSigned
                    ? `
                  <div style="padding: 6px; border: 2px solid #16a34a; background-color: #f0fdf4; border-radius: 6px;">
                    <div style="font-size: 9px; font-weight: bold; color: #15803d; text-transform: uppercase;">✔ DİJİTAL ONAY</div>
                    ${v.signatureImage ? `<img src="${v.signatureImage}" style="max-height: 44px; margin: 4px auto; display: block;" alt="İmza" />` : ""}
                    <div style="font-family: monospace; font-size: 11px; color: #166534; font-weight: bold;">${v.signingName || payerName}</div>
                  </div>
                `
                    : `<p style="color: #64748b; font-size: 11px; font-weight: bold; border-top: 1px dashed #cbd5e1; padding-top: 8px;">İMZA: ............................................</p>`
                }
              </div>
            </div>
          </div>

          <!-- Bottom Footer -->
          <div style="margin-top: 16px; border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #94a3b8;">
            <span>Resmi Belge No: ${receiptNo}</span>
            <span>LookPrice Real Estate E-Sözleşme & Makbuz Sistemi</span>
          </div>
        </div>
      `;

      const markdown = `# SATILIK KOMİSYON ALIM BELGESİ
**Makbuz No:** ${receiptNo}
**Tarih:** ${v.contractDate || ""}

- **SATILAN GAYRİMENKUL ADRES :** ${propAddr}
- **Mülk Detayı :** ${propDetails}
- **ALINAN KOMİSYON BEDELİ :** ${commissionFormatted} ${currMeta.codeLabel} (${commissionWords} ${currWordCompact})
- **Ödeme Şekli :** ${paymentMethod}

${renderCustomClausesMarkdown(v.customClauses)}

**GAYRİ MENKULÜ SATAN ARACI:** ${brokerTitle} (${brokerIdentity})
**MAL SAHİBİ:** ${payerName} (${payerId})
`;

      return { html, markdown };
    }
  }
];

export function getCurrencyMeta(rawCurr?: string): { codeLabel: string; wordLabel: string } {
  const c = (rawCurr || "TL").toUpperCase().trim();
  if (c === "GBP" || c === "STG" || c === "£") {
    return { codeLabel: "GBP", wordLabel: "İngiliz Sterlini" };
  }
  if (c === "EUR" || c === "€") {
    return { codeLabel: "EUR", wordLabel: "Euro" };
  }
  if (c === "USD" || c === "$") {
    return { codeLabel: "USD", wordLabel: "Amerikan Doları" };
  }
  return { codeLabel: "TL", wordLabel: "Türk Lirası" };
}

export function parseNumericAmount(val?: string | number | null): number {
  if (val === undefined || val === null || val === "") return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : Math.max(0, Math.round(val));
  const str = String(val).trim();
  // Strip any parenthesized words e.g. "25.000 TL (YirmiBeşBinTürkLirası)" -> "25.000 TL"
  const beforeParen = str.split("(")[0].trim();
  const digits = beforeParen.replace(/[^\d]/g, "");
  if (!digits) return 0;
  const parsed = parseInt(digits, 10);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
}

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

export function getPropertyNatureInflections(natureRaw?: string): {
  label: string;
  accusative: string;
  instrumental: string;
} {
  const s = (natureRaw || "").toLocaleLowerCase("tr-TR");
  if (s.includes("arsa") || s.includes("tarla") || s.includes("arazi") || s.includes("parsel")) {
    return { label: "Arsa", accusative: "arsanızı", instrumental: "arsanızla" };
  }
  if (s.includes("villa")) {
    return { label: "Villa", accusative: "villanızı", instrumental: "villanızla" };
  }
  if (s.includes("müstakil") || s.includes("mustakil") || s.includes("ev")) {
    return { label: "Müstakil Ev", accusative: "müstakil evinizi", instrumental: "müstakil evinizle" };
  }
  if (s.includes("daire") || s.includes("apartman") || s.includes("penthouse") || s.includes("stüdyo") || s.includes("studyo") || s.includes("rezidans")) {
    return { label: "Daire", accusative: "dairenizi", instrumental: "dairenizle" };
  }
  if (s.includes("dükkan") || s.includes("dukkan") || s.includes("ofis") || s.includes("mağaza") || s.includes("magaza") || s.includes("ticari") || s.includes("depo")) {
    return { label: "Ticari Gayrimenkul", accusative: "ticari gayrimenkulünüzü", instrumental: "ticari gayrimenkulünüzle" };
  }
  return { label: "Gayrimenkul", accusative: "gayrimenkulünüzü", instrumental: "gayrimenkulünüzle" };
}

export function detectDefaultPropertyNature(prop: any): string {
  if (!prop) return "Gayrimenkul";
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
  const combined = `${prop.type || ""} ${sec.type || ""} ${prop.sub_category || ""} ${prop.title || ""}`;
  return getPropertyNatureInflections(combined).label;
}

export function buildDefaultOfferPropertyDetails(prop: any): string {
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

  const regionLabel = resolvePropertyRegionLabel(prop);
  const mahalle = (prop.mahalle || sec.mahalle || "").toString().trim();
  const address = (prop.address || sec.address || "").toString().trim();
  const kocanType = (prop.kocan_type || sec.kocan_type || prop.kktc_title_type || sec.kktc_title_type || "").toString().trim();
  const pafta = (prop.pafta || sec.pafta || "").toString().trim();
  const ada = (prop.ada || sec.ada || "").toString().trim();
  const parsel = (prop.parsel || sec.parsel || prop.block_plot || sec.block_plot || "").toString().trim();
  const area = (prop.area || sec.area || prop.net_area || "").toString().trim();
  const rooms = (prop.rooms || sec.rooms || "").toString().trim();

  const parts: string[] = [];
  if (regionLabel) {
    parts.push(`KKTC, ${regionLabel.replace(/\s*\/\s*/g, ", ")}`);
  } else {
    parts.push("KKTC");
  }
  if (mahalle) parts.push(`${mahalle} mevkii'nde`);
  else if (address) parts.push(`${address} mevkiinde`);

  if (kocanType) parts.push(`Koçan Türü/No: ${kocanType}`);
  if (pafta) parts.push(`Pafta no: ${pafta}`);
  if (ada) parts.push(`Ada/Harita No: ${ada}`);
  if (parsel) parts.push(`Parsel no: ${parsel}'de`);

  const specs: string[] = [];
  if (area) specs.push(`${area} m²`);
  if (rooms && rooms !== "Belirtilmedi") specs.push(`${rooms}`);
  if (specs.length > 0) {
    parts.push(`${specs.join(" ")} olan`);
  } else {
    const feat = resolvePropertyFeatureHighlight(prop);
    if (feat) parts.push(`${feat} özelliklerindeki`);
  }

  return parts.join(", ");
}

export function formatOfferPriceWithWords(rawOffer: string | number, defaultCurrency?: string): string {
  if (rawOffer === undefined || rawOffer === null || rawOffer === "") return "Belirtilmedi";
  const str = String(rawOffer).trim();
  if (str.includes("(") && str.includes(")")) {
    return str;
  }
  const upper = str.toLocaleUpperCase("tr-TR");
  const digitsOnly = str.replace(/[^\d]/g, "");
  const num = parseInt(digitsOnly, 10);

  let currCode = (defaultCurrency || "GBP").toUpperCase();
  let currWords = "sterlin";
  let currDisplay = "GBP/STG";

  if (upper.includes("EUR") || upper.includes("€")) {
    currCode = "EUR";
    currDisplay = "EUR";
    currWords = "euro";
  } else if (upper.includes("USD") || upper.includes("$")) {
    currCode = "USD";
    currDisplay = "USD";
    currWords = "amerikan doları";
  } else if (upper.includes("TRY") || upper.includes("TL") || upper.includes("₺")) {
    currCode = "TRY";
    currDisplay = "TL";
    currWords = "türk lirası";
  } else if (upper.includes("GBP") || upper.includes("STG") || upper.includes("£")) {
    currCode = "GBP";
    currDisplay = "GBP/STG";
    currWords = "sterlin";
  } else {
    if (currCode === "EUR") {
      currDisplay = "EUR";
      currWords = "euro";
    } else if (currCode === "USD") {
      currDisplay = "USD";
      currWords = "amerikan doları";
    } else if (currCode === "TRY" || currCode === "TL") {
      currDisplay = "TL";
      currWords = "türk lirası";
    } else {
      currDisplay = "GBP/STG";
      currWords = "sterlin";
    }
  }

  if (!isNaN(num) && num > 0) {
    const formattedNum = num.toLocaleString("tr-TR");
    const wordsLower = numberToTurkishWords(num).toLocaleLowerCase("tr-TR");
    return `${formattedNum} ${currDisplay} (${wordsLower} ${currWords})`;
  }
  return str;
}

export function computeRemainingSaleAmount(rawTotal?: string | number, rawDeposit?: string | number): string {
  const tDigits = String(rawTotal || "").replace(/[^\d]/g, "");
  const dDigits = String(rawDeposit || "").replace(/[^\d]/g, "");
  const tNum = parseInt(tDigits, 10);
  const dNum = parseInt(dDigits, 10);
  if (isNaN(tNum) || tNum <= 0) return "";
  if (isNaN(dNum) || dNum <= 0) return tNum.toLocaleString("tr-TR");
  const rem = Math.max(0, tNum - dNum);
  return rem.toLocaleString("tr-TR");
}

export function formatSaleContractAmount(
  rawAmount?: string | number,
  defaultCurrency?: string,
  includeDashDot?: boolean
): string {
  if (rawAmount === undefined || rawAmount === null || rawAmount === "") return "Belirtilmedi";
  const str = String(rawAmount).trim();
  if (str.includes("(") && str.includes(")")) {
    return str;
  }
  const upper = str.toLocaleUpperCase("tr-TR");
  const digitsOnly = str.replace(/[^\d]/g, "");
  const num = parseInt(digitsOnly, 10);

  let currCode = (defaultCurrency || "GBP").toUpperCase();
  let currWordsCamel = "İngilizSterlini";

  if (upper.includes("EUR") || upper.includes("€")) {
    currCode = "EUR";
    currWordsCamel = "Euro";
  } else if (upper.includes("USD") || upper.includes("$")) {
    currCode = "USD";
    currWordsCamel = "AmerikanDoları";
  } else if (upper.includes("TRY") || upper.includes("TL") || upper.includes("₺")) {
    currCode = "TL";
    currWordsCamel = "TürkLirası";
  } else if (upper.includes("GBP") || upper.includes("STG") || upper.includes("£")) {
    currCode = "GBP";
    currWordsCamel = "İngilizSterlini";
  } else {
    if (currCode === "EUR") {
      currWordsCamel = "Euro";
    } else if (currCode === "USD") {
      currWordsCamel = "AmerikanDoları";
    } else if (currCode === "TRY" || currCode === "TL") {
      currCode = "TL";
      currWordsCamel = "TürkLirası";
    } else {
      currCode = "GBP";
      currWordsCamel = "İngilizSterlini";
    }
  }

  if (!isNaN(num) && num >= 0) {
    const formattedNum = num.toLocaleString("tr-TR");
    const wordsJoined = numberToTurkishWords(num).replace(/\s+/g, "");
    const sep = includeDashDot ? " .-" : " ";
    return `${formattedNum}${sep}${currCode} (${wordsJoined}${currWordsCamel})`;
  }
  return str;
}

export function buildDefaultSalePropertyDetails(prop: any): string {
  if (!prop) {
    return "Lefkoşa Küçük Kaymaklı’da C3006 koçan numaralı, XXI 30-E-1,E-2 Pafta / Haritalı C Ada/Blok 1623 Parsel numarada kain 3. Kat 2 nolu daire";
  }
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

  const regionLabel = resolvePropertyRegionLabel(prop).replace(/\s*\/\s*/g, " ");
  const mahalle = (prop.mahalle || sec.mahalle || "").toString().trim();
  const address = (prop.address || sec.address || "").toString().trim();
  const kocanNo = (prop.kocan_no || sec.kocan_no || prop.kocan_type || sec.kocan_type || prop.kktc_title_type || sec.kktc_title_type || "").toString().trim();
  const pafta = (prop.pafta || sec.pafta || "").toString().trim();
  const ada = (prop.ada || sec.ada || "").toString().trim();
  const parsel = (prop.parsel || sec.parsel || prop.block_plot || sec.block_plot || "").toString().trim();
  const floor = (prop.floor || sec.floor || prop.bulundugu_kat || sec.bulundugu_kat || "").toString().trim();
  const unitNo = (prop.apartment_no || sec.apartment_no || prop.daire_no || sec.daire_no || "").toString().trim();
  const title = (prop.title || "").toString().trim();

  const locPart = [regionLabel, mahalle || address].filter(Boolean).join(" ").trim() || "KKTC";
  const segments: string[] = [`${locPart}’da`];

  if (kocanNo) segments.push(`${kocanNo} koçan numaralı,`);
  if (pafta) segments.push(`${pafta} Pafta / Haritalı`);
  if (ada) segments.push(`${ada} Ada/Blok`);
  if (parsel) segments.push(`${parsel} Parsel numarada kain`);

  const unitParts: string[] = [];
  if (floor) unitParts.push(`${floor}. Kat`);
  if (unitNo) unitParts.push(`${unitNo} nolu`);
  const feat = resolvePropertyFeatureHighlight(prop).toLocaleLowerCase("tr-TR");
  if (unitParts.length > 0) {
    segments.push(`${unitParts.join(" ")} ${feat}`);
  } else {
    segments.push(feat);
  }

  return segments.join(" ").replace(/\s+/g, " ").trim();
}

export function resolvePropertyFeatureHighlight(prop: any): string {
  if (!prop) return "Gayrimenkul";
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

  const subType = (
    prop.sub_type ||
    sec.sub_type ||
    prop.subType ||
    sec.subType ||
    prop.property_sub_type ||
    sec.property_sub_type ||
    prop.sub_category ||
    sec.sub_category ||
    ""
  ).toString().trim();

  const type = (prop.type || sec.type || prop.category || sec.category || "").toString().trim().toLowerCase();
  const rooms = (prop.rooms || sec.rooms || prop.room_count || sec.room_count || "").toString().trim();
  const rawTitle = (prop.title || "").toString().toLowerCase();

  const isTwinVilla =
    subType.toLowerCase().includes("ikiz") ||
    rawTitle.includes("ikiz villa") ||
    rawTitle.includes("ikiz");

  const isDetachedVilla =
    subType.toLowerCase().includes("müstakil villa") ||
    subType.toLowerCase().includes("mustakil villa") ||
    rawTitle.includes("müstakil villa") ||
    rawTitle.includes("mustakil villa");

  const isTriplexVilla =
    subType.toLowerCase().includes("triplex") ||
    subType.toLowerCase().includes("tripleks") ||
    rawTitle.includes("triplex") ||
    rawTitle.includes("tripleks");

  const isVilla =
    isTwinVilla ||
    isDetachedVilla ||
    isTriplexVilla ||
    subType.toLowerCase().includes("villa") ||
    rawTitle.includes("villa") ||
    type.includes("villa");

  const isPenthouse =
    subType.toLowerCase().includes("penthouse") ||
    rawTitle.includes("penthouse") ||
    rawTitle.includes("çatı dubleksi") ||
    rawTitle.includes("cati dubleks");

  const isStudio =
    rooms.toLowerCase().includes("stüdyo") ||
    rooms.toLowerCase().includes("studyo") ||
    rooms === "1+0" ||
    subType.toLowerCase().includes("stüdyo") ||
    subType.toLowerCase().includes("studyo") ||
    rawTitle.includes("stüdyo") ||
    rawTitle.includes("studyo") ||
    rawTitle.includes("1+0");

  const isApartment =
    subType.toLowerCase().includes("daire") ||
    subType.toLowerCase().includes("rezidans") ||
    subType.toLowerCase().includes("apartman") ||
    rawTitle.includes("daire") ||
    type === "residence" ||
    type === "konut";

  const isLand =
    type === "land" ||
    type === "arsa" ||
    subType.toLowerCase().includes("arsa") ||
    subType.toLowerCase().includes("tarla") ||
    subType.toLowerCase().includes("arazi") ||
    rawTitle.includes("arsa") ||
    rawTitle.includes("tarla");

  const isCommercial =
    type === "commercial" ||
    type === "ticari" ||
    subType.toLowerCase().includes("dükkan") ||
    subType.toLowerCase().includes("dukkan") ||
    subType.toLowerCase().includes("ofis") ||
    subType.toLowerCase().includes("iş yeri") ||
    subType.toLowerCase().includes("is yeri") ||
    subType.toLowerCase().includes("bina") ||
    subType.toLowerCase().includes("depo") ||
    rawTitle.includes("dükkan") ||
    rawTitle.includes("dukkan") ||
    rawTitle.includes("ofis") ||
    rawTitle.includes("işyeri") ||
    rawTitle.includes("isyeri");

  const cleanRooms = rooms && rooms !== "Belirtilmedi" && rooms !== "0" ? rooms : "";

  if (isLand) {
    if (subType && (subType.toLowerCase().includes("arsa") || subType.toLowerCase().includes("tarla"))) {
      return subType;
    }
    return "Arsa";
  }

  if (isTwinVilla) {
    return cleanRooms ? `${cleanRooms} İkiz Villa` : "İkiz Villa";
  }

  if (isDetachedVilla) {
    return cleanRooms ? `${cleanRooms} Müstakil Villa` : "Müstakil Villa";
  }

  if (isTriplexVilla) {
    return cleanRooms ? `${cleanRooms} Triplex Villa` : "Triplex Villa";
  }

  if (isVilla) {
    return cleanRooms ? `${cleanRooms} Villa` : "Villa";
  }

  if (isPenthouse) {
    return cleanRooms ? `${cleanRooms} Penthouse Daire` : "Penthouse Daire";
  }

  if (isStudio) {
    return "Stüdyo Daire";
  }

  if (isCommercial) {
    if (subType && subType !== "Ticari") return subType;
    if (rawTitle.includes("dükkan") || rawTitle.includes("dukkan")) return "Dükkan";
    if (rawTitle.includes("ofis")) return "Ofis";
    if (rawTitle.includes("depo")) return "Depo";
    return "Ticari İşyeri";
  }

  if (isApartment || cleanRooms) {
    return cleanRooms ? `${cleanRooms} Daire` : "Daire";
  }

  if (subType) {
    return subType;
  }

  return detectDefaultPropertyNature(prop) || "Gayrimenkul";
}

export function resolveOfficialPropertyTitle(prop: any): string {
  if (!prop) return "";
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

  const refTag = prop.reference_no
    ? `[Ref: ${prop.reference_no}]`
    : prop.id
    ? `[Ref: LP-${prop.id}]`
    : "";

  const feature = resolvePropertyFeatureHighlight(prop);
  const region = resolvePropertyRegionLabel(prop);
  const mahalle = (prop.mahalle || sec.mahalle || "").toString().trim();
  const address = (prop.address || sec.address || "").toString().trim();
  const ada = (prop.ada || sec.ada || "").toString().trim();
  const parsel = (prop.parsel || sec.parsel || prop.block_plot || sec.block_plot || "").toString().trim();
  const pafta = (prop.pafta || sec.pafta || "").toString().trim();
  const kocanNo = (prop.kocan_no || sec.kocan_no || prop.kocan_type || sec.kocan_type || "").toString().trim();

  const parts: string[] = [];
  if (refTag) parts.push(refTag);

  const locParts: string[] = [];
  if (region) locParts.push(region);
  if (mahalle && !region.toLowerCase().includes(mahalle.toLowerCase())) locParts.push(mahalle);
  else if (address && !region.toLowerCase().includes(address.toLowerCase())) locParts.push(address);
  if (locParts.length > 0) parts.push(locParts.join(", "));

  const cadastreParts: string[] = [];
  if (ada) cadastreParts.push(`Ada: ${ada}`);
  if (parsel) cadastreParts.push(`Parsel: ${parsel}`);
  if (pafta) cadastreParts.push(`Pafta: ${pafta}`);
  if (kocanNo && !ada && !parsel) cadastreParts.push(`Koçan: ${kocanNo}`);
  if (cadastreParts.length > 0) parts.push(cadastreParts.join(", "));

  if (feature) parts.push(feature);

  return parts.join(" - ").replace(/\s+/g, " ").trim();
}

export function buildDefaultRentalPropertyMeta(prop: any): {
  rentalPropertyDef: string;
  rentalUsagePurpose: string;
  rentalAddress: string;
  rentalDistrict: string;
  rentalTownVillage: string;
  kocanNo: string;
  paftaNo: string;
  adaNo: string;
  parselNo: string;
} {
  if (!prop) {
    return {
      rentalPropertyDef: "3+1 Daire",
      rentalUsagePurpose: "Aile Yaşam Alanı",
      rentalAddress: "",
      rentalDistrict: "Girne",
      rentalTownVillage: "",
      kocanNo: "",
      paftaNo: "",
      adaNo: "",
      parselNo: ""
    };
  }
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

  const nature = detectDefaultPropertyNature(prop);
  const rentalPropertyDef = resolvePropertyFeatureHighlight(prop) || "3+1 Daire";

  const isCommercial =
    prop.type === "commercial" ||
    sec.type === "commercial" ||
    nature.toLocaleLowerCase("tr-TR").includes("ticari");
  const rentalUsagePurpose = isCommercial ? "Ticari İşyeri" : "Aile Yaşam Alanı";

  const regionFull = resolvePropertyRegionLabel(prop);
  const regionParts = regionFull.split("/").map((s) => s.trim());
  const rentalDistrict = (prop.kktc_region || sec.kktc_region || regionParts[0] || "Girne").toString().trim();
  const rentalTownVillage = (
    prop.kktc_sub_region ||
    sec.kktc_sub_region ||
    prop.mahalle ||
    sec.mahalle ||
    regionParts[1] ||
    ""
  )
    .toString()
    .trim();

  const rentalAddress = (
    prop.address ||
    sec.address ||
    [rentalTownVillage, rentalDistrict].filter(Boolean).join(" / ")
  )
    .toString()
    .trim();

  const kocanNo = (
    prop.kocan_no ||
    sec.kocan_no ||
    prop.kocan_type ||
    sec.kocan_type ||
    prop.kktc_title_type ||
    sec.kktc_title_type ||
    ""
  )
    .toString()
    .trim();
  const paftaNo = (prop.pafta || sec.pafta || "").toString().trim();
  const adaNo = (prop.ada || sec.ada || "").toString().trim();
  const parselNo = (prop.parsel || sec.parsel || prop.block_plot || sec.block_plot || "").toString().trim();

  return {
    rentalPropertyDef,
    rentalUsagePurpose,
    rentalAddress,
    rentalDistrict,
    rentalTownVillage,
    kocanNo,
    paftaNo,
    adaNo,
    parselNo
  };
}

export function buildDefaultShowingPropertyDetails(prop: any): string {
  if (!prop) return "";
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

  const refTag = prop.reference_no ? `[Ref: ${prop.reference_no}]` : prop.id ? `[Ref: LP-${prop.id}]` : "";
  const region = resolvePropertyRegionLabel(prop);
  const address = (prop.address || sec.address || prop.mahalle || sec.mahalle || "").toString().trim();
  const kocan = (prop.kocan_no || sec.kocan_no || "").toString().trim();
  const ada = (prop.ada || sec.ada || "").toString().trim();
  const parsel = (prop.parsel || sec.parsel || prop.block_plot || sec.block_plot || "").toString().trim();
  const pafta = (prop.pafta || sec.pafta || "").toString().trim();
  const featureHighlight = resolvePropertyFeatureHighlight(prop);

  const parts: string[] = [];
  if (refTag) parts.push(refTag);
  if (region) parts.push(region);
  if (address && !region.toLowerCase().includes(address.toLowerCase())) parts.push(address);
  if (ada || parsel) parts.push(`Ada/Parsel: ${[ada, parsel].filter(Boolean).join("/")}`);
  if (pafta) parts.push(`Pafta: ${pafta}`);
  if (kocan && !ada && !parsel) parts.push(`Koçan: ${kocan}`);
  if (featureHighlight) parts.push(featureHighlight);

  return parts.join(" - ").replace(/\s+/g, " ").trim();
}

export function detectDefaultAuthPropertyCategory(prop: any): string {
  if (!prop) return "APT.DAİRESİ";
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
  const combined = `${prop.type || ""} ${sec.type || ""} ${prop.sub_category || ""} ${prop.title || ""}`.toLocaleLowerCase("tr-TR");
  if (combined.includes("villa") || combined.includes("müstakil") || combined.includes("mustakil") || combined.includes("ev")) {
    return "EV";
  }
  if (combined.includes("bina") || combined.includes("komple")) {
    return "BİNA";
  }
  if (combined.includes("depo") || combined.includes("antrepo")) {
    return "DEPO";
  }
  if (combined.includes("büro") || combined.includes("buro") || combined.includes("ofis")) {
    return "BÜRO";
  }
  if (combined.includes("dükkan") || combined.includes("dukkan") || combined.includes("mağaza") || combined.includes("magaza") || combined.includes("ticari")) {
    return "DÜKKAN";
  }
  if (combined.includes("arsa") || combined.includes("tarla") || combined.includes("arazi")) {
    return "DİĞER";
  }
  return "APT.DAİRESİ";
}



