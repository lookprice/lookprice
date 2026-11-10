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

      const defaultItem1Details = [
        v.propertyLocation,
        v.propertyAddress,
        v.propertyTitle,
        v.propertyBlockPlot ? `Ada/Parsel: ${v.propertyBlockPlot}` : ""
      ]
        .filter(Boolean)
        .join(" • ");

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
    titleTr: "Tek Yetki Sözleşmesi",
    titleEn: "Exclusive Listing Agreement",
    descriptionTr: "Mülk sahibinin gayrimenkul satış yetkisini tek bir ofise devrettiği sözleşme.",
    descriptionEn: "Exclusive mandate from owner granting sole rights to market and sell property.",
    getTemplate: (v) => {
      const ownerFullName = (
        v.clientName && !v.clientName.startsWith("[")
          ? v.clientName
          : v.ownerName || "Mülk Sahibi"
      ).trim();
      const ownerIdStr = (
        v.clientIdentity && !v.clientIdentity.startsWith("[")
          ? v.clientIdentity
          : v.sellerIdentity || "Belirtilmedi"
      ).trim();
      const ownerPhoneStr = (
        v.clientPhone && !v.clientPhone.startsWith("[")
          ? v.clientPhone
          : v.ownerPhone || "Belirtilmedi"
      ).trim();
      const agencyRepName = (
        v.sellerSigningName ||
        (v.ownerName && v.ownerName !== ownerFullName ? v.ownerName : "") ||
        v.agentAndCompany ||
        v.storeName ||
        "Yetkili Emlak Ofisi"
      ).trim();

      const html = `
<div style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1e293b; line-height: 1.6;">
  <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px double #cbd5e1; padding-bottom: 20px;">
    <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">TEK YETKİLİ PAZARLAMA VE SATIŞ SÖZLEŞMESİ</h1>
    <h2 style="font-size: 13px; font-weight: bold; color: #64748b; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em;">EXCLUSIVE LISTING MANDATE</h2>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px;">
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; width: 30%;">YETKİLİ EMLAK OFİSİ / BROKER</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>${agencyRepName}</strong> (${v.storeName})</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">MÜLK SAHİBİ / OWNER</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>${ownerFullName}</strong></td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">KİMLİK / PASAPORT NO</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${ownerIdStr}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">MÜLK SAHİBİ İLETİŞİM</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${ownerPhoneStr}</td>
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
      İşbu sözleşme uyarınca, <strong>Mülk Sahibi (${ownerFullName})</strong>, yukarıda detayları verilen taşınmazın satılması, reklam ve tanıtımının yapılması amacıyla tek yetkili kılınmak üzere <strong>${v.storeName}</strong> (Aracı) firmasını atamıştır. 
    </p>
    <p>
      Mülk Sahibi, bu sözleşme süresince başka bir emlak ofisini yetkilendirmeyeceğini, gayrimenkulü kendisi satsa dahi, Aracı'ya satış bedeli üzerinden <strong>${v.commissionRate}</strong> oranında (+ KDV) komisyon ödemeyi yükümlenir. 
    </p>
    <p style="font-style: italic; color: #475569;">
      Under this exclusive agreement, the <strong>Owner</strong> authorizes <strong>${v.storeName}</strong> (Broker) as the sole agent for marketing and selling the specified property. The Owner agrees that even if the property is sold directly by themselves or through another agent, the Broker is entitled to receive a fee of <strong>${v.commissionRate}</strong> of the final sale price.
    </p>
    <p>
      <strong>Sözleşme Süresi (Duration):</strong> Bu yetkilendirme belgesi, imza tarihinden itibaren <strong>${v.contractDuration || "6 (Altı) Ay"}</strong> boyunca geçerlidir.
    </p>
  </div>

  ${renderCustomClausesHtml(v.customClauses)}

  <div style="margin-top: 32px; display: flex; justify-content: space-between; gap: 32px; page-break-inside: avoid;">
    <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 12px; padding: 15px; background-color: #f8fafc; text-align: center; min-height: 180px; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <span style="font-size: 12px; font-weight: 900; color: #0f172a; text-transform: uppercase;">MÜLK SAHİBİ (1. İMZA)</span>
        <span style="display: block; font-size: 11px; font-weight: bold; color: #334155; margin-top: 2px;">${ownerFullName}</span>
      </div>
      ${renderSignatureOrStamp(
        v.signingName || ownerFullName,
        v.isSigned,
        v.signatureImage,
        "1. Öncelik: Mülk Sahibi İmzası Bekleniyor"
      )}
      <div style="font-size: 10px; color: #64748b;">1. İmza (Öncelikli) • Mülk Sahibi</div>
    </div>

    <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 12px; padding: 15px; background-color: #f8fafc; text-align: center; min-height: 180px; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <span style="font-size: 12px; font-weight: 900; color: #0f172a; text-transform: uppercase;">İŞLETME YETKİLİSİ / ARACI OFİS (2. İMZA)</span>
        <span style="display: block; font-size: 11px; font-weight: bold; color: #334155; margin-top: 2px;">${agencyRepName}</span>
      </div>
      ${renderSignatureOrStamp(
        agencyRepName,
        v.sellerSigned,
        v.sellerSignatureImage,
        v.isSigned ? "İşletme Yetkilisi Onayı Bekleniyor" : "Önce Mülk Sahibi İmzası Bekleniyor"
      )}
      <div style="font-size: 10px; color: #64748b;">2. İmza (Final Onay) • İşletme Yetkilisi</div>
    </div>
  </div>
</div>
`;
      const markdown = `
# TEK YETKİLİ SATIŞ SÖZLEŞMESİ

**Aracı Ofis / Yetkili:** ${agencyRepName} (${v.storeName})
**Mülk Sahibi:** ${ownerFullName}
**Tarih:** ${v.contractDate}
${v.propertyAddress ? `**Adres / Address:** ${v.propertyAddress}\n` : ''}

Mülk Sahibi, yukarıdaki mülkün satışı için Aracı firmaya **${v.commissionRate}** komisyon bedeliyle tek yetki vermiştir.
Bu sözleşme 6 ay süreyle geçerlidir.
${renderCustomClausesMarkdown(v.customClauses)}`;
      return { html, markdown };
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
      <li style="margin-bottom: 5px;">Verilen Depozit kiraya sayılmaz. Gayrimenkul’ün tahliye edileceği gün kiraya veren ve kiracı birlikte gayrimenkulü, tüm eşya ve malzemeleri kontrol edip herhangi bir zarar ziyan ve arızalı yıpranmış kırılmış veya yırtılmış herhangi bir şey varsa elektrik, su, internet veya aidat borcu varsa tüm bu masraflar kaparo dan karşılanacaktır. Eğer verilen depozit yetersiz kaldığı takdirde geriye kalan tüm masraflar kiracı tarafından karşılanacağını kiracı kabul ve taahhüt eder. Şayet herhangi bir zarar ziyan ve borç yoksa kiraya veren alınan depozit’i eksiksiz bir tamam iade edeceğini kabul ve taahhüt eder.</li>
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
    descriptionTr: "Mülk sahibinin gayrimenkul kiralama yetkisini emlak ofisine devrettiği yetki belgesi.",
    descriptionEn: "Mandate from owner granting rights to market and rent the property.",
    getTemplate: (v) => {
      const ownerFullName = (
        v.clientName && !v.clientName.startsWith("[")
          ? v.clientName
          : v.ownerName || "Mülk Sahibi"
      ).trim();
      const ownerIdStr = (
        v.clientIdentity && !v.clientIdentity.startsWith("[")
          ? v.clientIdentity
          : v.sellerIdentity || "Belirtilmedi"
      ).trim();
      const ownerPhoneStr = (
        v.clientPhone && !v.clientPhone.startsWith("[")
          ? v.clientPhone
          : v.ownerPhone || "Belirtilmedi"
      ).trim();
      const agencyRepName = (
        v.sellerSigningName ||
        (v.ownerName && v.ownerName !== ownerFullName ? v.ownerName : "") ||
        v.agentAndCompany ||
        v.storeName ||
        "Yetkili Emlak Ofisi"
      ).trim();

      const html = `
<div style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1e293b; line-height: 1.6;">
  <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px double #cbd5e1; padding-bottom: 20px;">
    <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">KİRALAMA YETKİ BELGESİ</h1>
    <h2 style="font-size: 13px; font-weight: bold; color: #64748b; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em;">RENTAL AUTHORIZATION MANDATE</h2>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px;">
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; width: 30%;">ARACI OFİS / YETKİLİ</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>${agencyRepName}</strong> (${v.storeName})</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">MÜLK SAHİBİ / OWNER</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>${ownerFullName}</strong></td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">KİMLİK / PASAPORT NO</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${ownerIdStr}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">MÜLK SAHİBİ İLETİŞİM</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${ownerPhoneStr}</td>
    </tr>
    <tr style="background-color: #f8fafc;">
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
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">HİZMET BEDELİ / COMMISSION</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>${v.commissionRate}</strong> (+ KDV)</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">SÖZLEŞME TARİHİ / DATE</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${v.contractDate}</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">YETKİ SÜRESİ / DURATION</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>${v.contractDuration || "12 Ay / 12 Months"}</strong></td>
    </tr>
  </table>

  <p style="font-size: 12px; text-align: justify;">
    Mülk Sahibi (<strong>${ownerFullName}</strong>), yukarıdaki taşınmazın kiralanması için <strong>${v.contractDate}</strong> tarihli yetki belgesi ile <strong>${v.contractDuration || "12 Ay / 12 Months"}</strong> süre boyunca <strong>${v.storeName}</strong> firmasını yetkili kılmıştır. Aracı, mülkün tanıtımını yapacak, kiracı adaylarını bulacak ve sözleşme sürecini yönetecektir. Kiralama gerçekleştiğinde Mülk Sahibi <strong>${v.commissionRate}</strong> tutarında hizmet bedeli ödemeyi kabul eder.
  </p>

  ${renderCustomClausesHtml(v.customClauses)}

  <div style="margin-top: 32px; display: flex; justify-content: space-between; gap: 32px; font-size: 11px; page-break-inside: avoid;">
    <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px; text-align: center; background-color: #f8fafc; display: flex; flex-direction: column; justify-content: space-between; min-height: 170px;">
      <div>
        <strong style="font-size: 12px; color: #0f172a;">MÜLK SAHİBİ (1. İMZA)</strong>
        <div style="font-size: 11px; font-weight: bold; color: #334155; margin-top: 2px;">${ownerFullName}</div>
      </div>
      ${renderSignatureOrStamp(
        v.signingName || ownerFullName,
        v.isSigned,
        v.signatureImage,
        "1. Öncelik: Mülk Sahibi İmzası Bekleniyor"
      )}
      <div style="font-size: 10px; color: #64748b;">1. İmza (Öncelikli) • Mülk Sahibi</div>
    </div>
    <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px; text-align: center; background-color: #f8fafc; display: flex; flex-direction: column; justify-content: space-between; min-height: 170px;">
      <div>
        <strong style="font-size: 12px; color: #0f172a;">İŞLETME YETKİLİSİ / ARACI OFİS (2. İMZA)</strong>
        <div style="font-size: 11px; font-weight: bold; color: #334155; margin-top: 2px;">${agencyRepName}</div>
      </div>
      ${renderSignatureOrStamp(
        agencyRepName,
        v.sellerSigned,
        v.sellerSignatureImage,
        v.isSigned ? "İşletme Yetkilisi Onayı Bekleniyor" : "Önce Mülk Sahibi İmzası Bekleniyor"
      )}
      <div style="font-size: 10px; color: #64748b;">2. İmza (Final Onay) • İşletme Yetkilisi</div>
    </div>
  </div>
</div>
`;
      const markdown = `
# KİRALAMA YETKİ BELGESİ
**Mülk Sahibi:** ${ownerFullName}
**Aracı Ofis / Yetkili:** ${agencyRepName} (${v.storeName})
**Mülk:** ${v.propertyTitle}
**Hedef Kira:** ${v.propertyPrice}
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
  } else if (prop.title) {
    parts.push(`(${prop.title}) özelliklerindeki`);
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
  const nature = detectDefaultPropertyNature(prop).toLocaleLowerCase("tr-TR");
  if (unitParts.length > 0) {
    segments.push(`${unitParts.join(" ")} ${nature}`);
  } else if (title) {
    segments.push(`${title} (${nature})`);
  } else {
    segments.push(nature);
  }

  return segments.join(" ").replace(/\s+/g, " ").trim();
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

  const rooms = (prop.rooms || sec.rooms || "").toString().trim();
  const nature = detectDefaultPropertyNature(prop);
  const rentalPropertyDef =
    rooms && rooms !== "Belirtilmedi"
      ? `${rooms} ${nature}`
      : (prop.title || nature || "3+1 Daire").toString().trim();

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
  const title = (prop.title || "").toString().trim();
  const kocan = (prop.kocan_no || sec.kocan_no || "").toString().trim();
  const ada = (prop.ada || sec.ada || "").toString().trim();
  const parsel = (prop.parsel || sec.parsel || prop.block_plot || sec.block_plot || "").toString().trim();

  const parts: string[] = [];
  if (refTag) parts.push(refTag);
  if (region) parts.push(region);
  if (address && !region.toLowerCase().includes(address.toLowerCase())) parts.push(address);
  if (title) parts.push(title);
  if (kocan) parts.push(`Koçan: ${kocan}`);
  if (ada || parsel) parts.push(`Ada/Parsel: ${[ada, parsel].filter(Boolean).join("/")}`);

  return parts.join(" - ").replace(/\s+/g, " ").trim();
}


