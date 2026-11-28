export type LegalDocType = "privacy" | "kvkk" | "delivery_return" | "sales" | "pre_info";

export interface StoreLegalProfile {
  legalName: string;
  brandName: string;
  taxOffice: string;
  taxNumber: string;
  mersisNo: string;
  address: string;
  phone: string;
  email: string;
  kepAddress: string;
  websiteUrl: string;
}

export interface BuyerCheckoutContext {
  fullName?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  tcId?: string;
  paymentMethod?: string;
  currency?: string;
  subtotal?: number;
  shippingTotal?: number;
  grandTotal?: number;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

/**
 * Resolves the store's official company credentials from store & branding objects.
 * Never returns raw slugs or technical platform identifiers (Rule 1).
 */
export function resolveStoreLegalProfile(store: any): StoreLegalProfile {
  const br = store?.branding && typeof store.branding === "object" ? store.branding : {};
  const einv =
    (store?.einvoice_settings && typeof store.einvoice_settings === "object" ? store.einvoice_settings : null) ||
    (br?.einvoice_settings && typeof br.einvoice_settings === "object" ? br.einvoice_settings : {}) ||
    {};

  const rawBrandName = String(br?.store_name || br?.name || store?.name || "").trim();
  const brandName =
    !rawBrandName || rawBrandName.toLowerCase().includes("lookprice")
      ? "Seçkin Mağaza"
      : rawBrandName;

  const rawLegalName = String(
    store?.legal_name ||
      br?.legal_name ||
      einv?.title ||
      einv?.company_title ||
      store?.company_title ||
      br?.company_title ||
      ""
  ).trim();

  const legalName =
    rawLegalName && !rawLegalName.toLowerCase().includes("lookprice")
      ? rawLegalName
      : brandName;

  const taxOffice = String(
    store?.legal_tax_office ||
      br?.legal_tax_office ||
      einv?.tax_office ||
      store?.tax_office ||
      br?.tax_office ||
      ""
  ).trim();

  const taxNumber = String(
    store?.legal_tax_number ||
      br?.legal_tax_number ||
      einv?.vkn ||
      einv?.tax_number ||
      store?.tax_number ||
      br?.tax_number ||
      ""
  ).trim();

  const mersisNo = String(
    store?.legal_mersis ||
      br?.legal_mersis ||
      einv?.mersis_no ||
      store?.mersis_no ||
      br?.mersis_no ||
      ""
  ).trim();

  const firstLocation =
    (Array.isArray(br?.locations) && br.locations[0]) ||
    (Array.isArray(store?.locations) && store.locations[0]) ||
    (Array.isArray(br?.page_layout_settings?.locations) && br.page_layout_settings.locations[0]) ||
    null;

  const baseAddr = String(
    store?.legal_address ||
      br?.legal_address ||
      einv?.address ||
      firstLocation?.address ||
      store?.address ||
      br?.address ||
      br?.store_address ||
      ""
  ).trim();

  const district = String(firstLocation?.district || store?.district || br?.district || "").trim();
  const city = String(firstLocation?.city || store?.city || br?.city || "").trim();

  let fullAddress = baseAddr;
  if (district && !fullAddress.toLowerCase().includes(district.toLowerCase())) {
    fullAddress = fullAddress ? `${fullAddress}, ${district}` : district;
  }
  if (city && !fullAddress.toLowerCase().includes(city.toLowerCase())) {
    fullAddress = fullAddress ? `${fullAddress} / ${city}` : city;
  }

  const phonesList = Array.isArray(store?.phones)
    ? store.phones
    : Array.isArray(br?.phones)
      ? br.phones
      : [];
  const phone = String(
    store?.legal_phone ||
      br?.legal_phone ||
      store?.phone ||
      br?.phone ||
      phonesList[0] ||
      store?.whatsapp_number ||
      br?.whatsapp_number ||
      ""
  ).trim();

  const emailsList = Array.isArray(store?.emails)
    ? store.emails
    : Array.isArray(br?.emails)
      ? br.emails
      : [];
  const email = String(
    store?.legal_email ||
      br?.legal_email ||
      store?.email ||
      br?.email ||
      emailsList[0] ||
      ""
  ).trim();

  const kepAddress = String(store?.legal_kep || br?.legal_kep || einv?.kep_address || "").trim();

  let websiteUrl = "";
  const customDomain = String(store?.custom_domain || br?.custom_domain || "").trim();
  if (customDomain) {
    websiteUrl = customDomain.startsWith("http") ? customDomain : `https://${customDomain}`;
  } else if (typeof window !== "undefined" && window.location?.origin) {
    const slug = store?.slug || br?.slug || "";
    websiteUrl = slug ? `${window.location.origin}/s/${slug}` : window.location.origin;
  }

  return {
    legalName,
    brandName,
    taxOffice,
    taxNumber,
    mersisNo,
    address: fullAddress || "Türkiye",
    phone: phone || "İletişim kanallarımız üzerinden ulaşabilirsiniz",
    email: email || "Mağaza iletişim formu üzerinden ulaşabilirsiniz",
    kepAddress,
    websiteUrl,
  };
}

function formatSellerIdentityBlock(p: StoreLegalProfile, isTr = true): string {
  const lines: string[] = [];
  if (isTr) {
    lines.push(`Ticari Ünvan / Satıcı Adı: ${p.legalName}${p.brandName && p.brandName !== p.legalName ? ` (${p.brandName})` : ""}`);
    lines.push(`Açık Adres: ${p.address}`);
    lines.push(`Telefon: ${p.phone}`);
    lines.push(`E-Posta: ${p.email}`);
    if (p.taxOffice || p.taxNumber) {
      lines.push(`Vergi Dairesi / Vergi No: ${[p.taxOffice ? `${p.taxOffice} V.D.` : "", p.taxNumber].filter(Boolean).join(" — ")}`);
    }
    if (p.mersisNo) {
      lines.push(`MERSİS No: ${p.mersisNo}`);
    }
    if (p.kepAddress) {
      lines.push(`KEP Adresi: ${p.kepAddress}`);
    }
    if (p.websiteUrl) {
      lines.push(`Web Sitesi: ${p.websiteUrl}`);
    }
  } else {
    lines.push(`Legal Company Title / Seller: ${p.legalName}${p.brandName && p.brandName !== p.legalName ? ` (${p.brandName})` : ""}`);
    lines.push(`Registered Address: ${p.address}`);
    lines.push(`Phone: ${p.phone}`);
    lines.push(`E-Mail: ${p.email}`);
    if (p.taxOffice || p.taxNumber) {
      lines.push(`Tax Office / Tax ID: ${[p.taxOffice, p.taxNumber].filter(Boolean).join(" — ")}`);
    }
    if (p.mersisNo) {
      lines.push(`MERSIS No: ${p.mersisNo}`);
    }
    if (p.websiteUrl) {
      lines.push(`Website: ${p.websiteUrl}`);
    }
  }
  return lines.join("\n");
}

/**
 * 1. GİZLİLİK POLİTİKASI VE KVKK AYDINLATMA METNİ
 */
export function generateDefaultPrivacyPolicy(store: any, lang = "tr"): string {
  const p = resolveStoreLegalProfile(store);
  const isTr = lang === "tr";
  const sellerBlock = formatSellerIdentityBlock(p, isTr);

  if (!isTr) {
    return `PRIVACY POLICY & PERSONAL DATA PROTECTION NOTICE

1. DATA CONTROLLER & SELLER DETAILS
${sellerBlock}

2. PURPOSE OF PROCESSING PERSONAL DATA
Your personal data (name, surname, delivery address, phone number, e-mail address, and invoice details) shared while visiting ${p.brandName} or placing an order are processed in accordance with Law No. 6698 on the Protection of Personal Data (KVKK) and GDPR solely for creating membership, fulfilling orders, issuing official e-Invoices/e-Archives, delivering shipments, and providing after-sales customer support.

3. CREDIT CARD & PAYMENT SECURITY (256-BIT SSL & IYZICO ASSURANCE)
The security of your credit and debit card information is our highest priority. ${p.legalName} NEVER stores or records your credit card number, CVV security code, or card password on its own servers.
All online card payments are processed directly through the BRSA (BDDK) licensed payment institution "iyzico" infrastructure with PCI-DSS Level 1 security standards, 256-bit SSL encryption, and 3D Secure authentication.

4. TRANSFER OF PERSONAL DATA TO THIRD PARTIES
Customer data is never sold or shared with unauthorized third parties for commercial purposes. Data is shared strictly to the extent necessary with:
- Contracted cargo and logistics companies for order delivery,
- Licensed payment institution (iyzico) and partner banks for payment authorization,
- The Revenue Administration (GİB) and authorized bodies for statutory tax and e-Invoice obligations.

5. COOKIE POLICY
Our website uses essential session cookies required for shopping cart functionality, user authentication, and security verification.

6. YOUR RIGHTS UNDER ARTICLE 11 OF KVKK
You have the right to learn whether your personal data is processed, request correction of incomplete or inaccurate data, and request deletion or destruction of your data under statutory conditions by contacting us via ${p.email} or our registered address (${p.address}).`;
  }

  return `GİZLİLİK POLİTİKASI VE KİŞİSEL VERİLERİN KORUNMASI (KVKK) AYDINLATMA METNİ

1. VERİ SORUMLUSU VE SATICI FİRMA BİLGİLERİ
${sellerBlock}

İşbu Gizlilik Politikası ve Aydınlatma Metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") ve 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun kapsamında, ${p.legalName} ("Satıcı" veya "Şirket") tarafından işletilen ${p.brandName} e-ticaret web sitesini ziyaret eden, üye olan veya alışveriş yapan tüm kullanıcıların ("Alıcı" veya "Üye") kişisel verilerinin işlenmesine ve korunmasına ilişkin esasları düzenlemektedir.

2. KİŞİSEL VERİLERİN TOPLANMA YÖNTEMİ VE İŞLENME AMAÇLARI
Web sitemiz üzerinden üyelik oluşturma, sipariş verme veya müşteri destek kanallarımızla iletişime geçme süreçlerinde beyan ettiğiniz kimlik (ad, soyad, kurumsal fatura talep edilmesi halinde T.C. Kimlik / Vergi No), iletişim (teslimat adresi, e-posta adresi, telefon numarası) ve sipariş/işlem bilgileriniz aşağıdaki amaçlarla işlenmektedir:
• Mesafeli satış sözleşmesinin kurulması ve sipariş edilen ürünlerin alıcıya eksiksiz teslim edilmesi,
• Vergi Usul Kanunu ve Gelir İdaresi Başkanlığı (GİB) mevzuatı uyarınca resmi e-Fatura / e-Arşiv Fatura düzenlenmesi,
• İptal, iade, değişim, garanti ve satış sonrası müşteri destek süreçlerinin yürütülmesi,
• Açık onay vermeniz halinde kampanya ve bilgilendirme iletişimlerinin gerçekleştirilmesi.

3. KREDİ KARTI VE ÖDEME GÜVENLİĞİ (256-BİT SSL VE İYZİCO GÜVENCESİ)
Web sitemizden yapacağınız alışverişlerde kredi kartı ve banka kartı güvenliğiniz en üst düzeyde korunmaktadır:
• Web sitemizde kredi kartı numaranız, son kullanma tarihi, CVV güvenlik kodunuz veya 3D Secure şifreniz KESİNLİKLE KAYDEDİLMEZ ve sunucularımızda saklanmaz.
• Tüm kartlı ödeme işlemleri, BDDK (Bankacılık Düzenleme ve Denetleme Kurumu) lisanslı ödeme kuruluşu olan "iyzico" güvenli ödeme altyapısı, PCI-DSS (Payment Card Industry Data Security Standard) 1. Seviye güvenlik sertifikası, 256-Bit SSL şifreleme protokolü ve 3D Secure doğrulama sistemi üzerinden doğrudan bankanız ile güvenli ortamda gerçekleştirilir.
• Mağaza yönetimi veya üçüncü şahıslar kart bilgilerinizi hiçbir şekilde göremez ve erişemez.

4. KİŞİSEL VERİLERİN ÜÇÜNCÜ KİŞİLERE AKTARILMASI
Kişisel verileriniz, yasal zorunluluklar ve siparişinizin ifası dışında hiçbir üçüncü kişi veya kurumla ticari amaçla paylaşılmaz. Verileriniz yalnızca hizmetin gerektirdiği ölçüde:
• Siparişinizin adresinize ulaştırılması amacıyla anlaşmalı kargo ve lojistik firmalarıyla,
• Ödeme işleminin güvenli şekilde onaylanması amacıyla BDDK lisanslı ödeme kuruluşu (iyzico) ve ilgili bankalarla,
• Yasal faturalandırma yükümlülükleri kapsamında Gelir İdaresi Başkanlığı (GİB) ve yetkili kamu kurumlarıyla paylaşılmaktadır.

5. ÇEREZ (COOKIE) KULLANIMI
Web sitemizde alışveriş sepetinizin korunması, oturum güvenliğinin sağlanması ve kullanıcı deneyiminin iyileştirilmesi amacıyla zorunlu ve işlevsel çerezler kullanılmaktadır. Tarayıcı ayarlarınızdan çerez tercihlerinizi dilediğiniz zaman yönetebilirsiniz.

6. KVKK MADDE 11 KAPSAMINDAKİ HAKLARINIZ VE BAŞVURU
6698 sayılı KVKK'nın 11. maddesi uyarınca veri sahipleri;
• Kişisel verilerinin işlenip işlenmediğini öğrenme ve işlenmişse bilgi talep etme,
• İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme,
• Eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme,
• KVKK'nın 7. maddesinde öngörülen şartlar çerçevesinde kişisel verilerin silinmesini veya yok edilmesini isteme haklarına sahiptir.

Taleplerinizi yazılı olarak "${p.address}" adresimize veya "${p.email}" e-posta adresimize iletebilirsiniz. Başvurularınız en geç 30 (otuz) gün içinde ücretsiz olarak sonuçlandırılır.`;
}

/**
 * 2. TESLİMAT VE İADE KOŞULLARI
 */
export function generateDefaultDeliveryAndReturnPolicy(store: any, lang = "tr"): string {
  const p = resolveStoreLegalProfile(store);
  const isTr = lang === "tr";
  const sellerBlock = formatSellerIdentityBlock(p, isTr);

  if (!isTr) {
    return `DELIVERY, CANCELLATION AND RETURN POLICY

1. SELLER & RETURN ADDRESS INFORMATION
${sellerBlock}

2. SHIPPING & DELIVERY TERMS
• Order Processing Time: Orders placed and confirmed on ${p.brandName} are carefully packaged and handed over to our contracted cargo partner within 1 to 3 business days (and in any case not exceeding the statutory 30-day period under Consumer Protection Law No. 6502).
• Shipping Tracking: Once your order is shipped, your tracking number is shared via SMS/e-mail and can be tracked from the "Order Tracking" section on our website.
• Delivery Inspection: Please inspect your package in the presence of the courier upon delivery. If you notice any physical damage, crushing, or opening on the outer package, please request the courier to draw up a "Damage Assessment Report" and do not accept the damaged package.

3. RIGHT OF WITHDRAWAL & RETURN CONDITIONS (14 DAYS)
• In accordance with Consumer Protection Law No. 6502 and the Regulation on Distance Contracts, the Buyer has the right to withdraw from the contract within 14 (fourteen) days from the date of delivery without giving any reason and without paying any penalty.
• Return Conditions: To exercise the right of withdrawal, the product must be unused, undamaged, and returned in its original box/packaging together with all standard accessories, promotional items (if any), and the original invoice (or return invoice for corporate buyers).
• Return Shipment Address: Returns must be sent to "${p.legalName} — ${p.address}" after notifying us via ${p.email} or ${p.phone}.

4. PRODUCTS EXCLUDED FROM THE RIGHT OF WITHDRAWAL
Pursuant to Article 15 of the Regulation on Distance Contracts, the right of withdrawal cannot be exercised for:
• Products prepared specifically in line with the Buyer's personal requests or custom measurements,
• Perishable goods or goods likely to expire rapidly,
• Products whose protective elements (packaging, tape, seal) have been opened after delivery and whose return is unsuitable for health and hygiene reasons (e.g., in-ear headphones, personal care/hygiene items),
• Books, digital content, software, CD/DVDs, and consumables (toner, cartridge) if their protective packaging has been opened by the Buyer.

5. ORDER CANCELLATION & REFUND PROCESS (IYZICO / CREDIT CARD & BANK TRANSFER)
• You may cancel your order free of charge before it is handed over to the cargo company.
• Once the returned product reaches our return address and its compliance with return conditions is confirmed, the full product amount paid is refunded within at most 14 (fourteen) days in accordance with your original payment method:
  - Credit / Debit Card Payments (iyzico): Refunded directly to your card through the iyzico secure payment gateway. Depending on your bank's internal processes, the reflection on your statement takes 1–5 business days. Installment payments are refunded by the bank according to its installment schedule.
  - Bank Transfer / EFT Payments: Refunded directly to the Buyer's designated IBAN account.`;
  }

  return `TESLİMAT, İPTAL VE İADE KOŞULLARI

1. SATICI VE İADE GÖNDERİM ADRESİ BİLGİLERİ
${sellerBlock}

2. TESLİMAT VE KARGO KOŞULLARI
• Kargoya Teslim Süresi: ${p.brandName} web sitemiz üzerinden oluşturulan ve ödemesi onaylanan siparişleriniz, stok ve tedarik durumuna göre ortalama 1 ila 3 iş günü içerisinde (6502 sayılı Tüketicinin Korunması Hakkında Kanun uyarınca yasal azami 30 günlük süreyi kesinlikle aşmamak kaydıyla) özenle paketlenerek anlaşmalı kargo firmasına teslim edilir.
• Kargo Takibi: Siparişiniz kargoya verildiğinde kargo takip numaranız kayıtlı e-posta adresinize veya cep telefonunuza bildirilir; ayrıca web sitemizdeki "Sipariş Takibi" ekranından anlık olarak izlenebilir.
• Teslimat Anında Kontrol: Siparişinizi kargo görevlisinden teslim alırken paketin dış ambalajında ezilme, yırtılma, ıslanma veya açılma olup olmadığını kontrol ediniz. Hasarlı olduğu tespit edilen paketleri teslim almayarak kargo görevlisine "Hasar Tespit Tutanağı" tutturunuz ve durumu derhal ${p.phone} veya ${p.email} üzerinden tarafımıza bildiriniz.
• Kargo Ücretleri: Ürün veya sepet tutarına göre uygulanan kargo ücreti ve ücretsiz kargo kampanya limitleri, ödeme onayından önce Sipariş Özeti ekranında Alıcı'ya açıkça gösterilir.

3. CAYMA HAKKI VE İADE ŞARTLARI (14 GÜNLÜK YASAL SÜRE)
• 14 Günlük Cayma Hakkı: Alıcı (Tüketici), 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca, malı teslim aldığı tarihten itibaren 14 (ondört) gün içerisinde hiçbir gerekçe göstermeksizin ve hiçbir cezai şart ödemeksizin sözleşmeden cayma (iade) hakkına sahiptir.
• Cayma Hakkının Kullanımı ve İade Şartları:
  1. İade edilmek istenen ürünün kullanılmamış, yeniden satılabilir özelliğini kaybetmemiş, orijinal kutusu/ambalajı, varsa tüm standart aksesuarları ve koruyucu aparatları ile birlikte eksiksiz olması gerekmektedir.
  2. Ürünle birlikte gönderilen e-Arşiv / e-Fatura çıktısının (kurumsal fatura ile alınan siparişlerde ise firmanız tarafından düzenlenecek iade faturasının) pakete eklenmesi zorunludur.
  3. Cayma hakkı bildirimlerinizi ${p.email} e-posta adresimiz, ${p.phone} telefon hattımız veya müşteri hesabınızdaki İade Talebi ekranı üzerinden ileterek ürünü "${p.legalName} — ${p.address}" adresimize gönderebilirsiniz.
  4. Cayma hakkı kapsamında anlaşmalı kargo firmamız aracılığıyla yapılan iadelerde kargo masrafı Satıcı'ya aittir.

4. CAYMA HAKKI KULLANILAMAYACAK ÜRÜNLER
Mesafeli Sözleşmeler Yönetmeliği'nin 15. maddesi uyarınca aşağıdaki ürünlerde cayma hakkı kullanılamaz:
• Alıcının özel istekleri veya kişisel ihtiyaçları doğrultusunda hazırlanan (özel ölçü, kişiye özel baskı/tasarım yapılan) ürünler,
• Tesliminden sonra ambalaj, bant, mühür, paket gibi koruyucu unsurları açılmış olan mallardan; iadesi sağlık ve hijyen açısından uygun olmayan ürünler (kulak içi kulaklıklar, kişisel bakım ve hijyen ürünleri, iç giyim vb.),
• Tesliminden sonra koruyucu ambalajı açılmış olması halinde; kitap, dijital içerik, yazılım programları, veri kaydedebilme ve veri depolama cihazları, ses veya görüntü kayıtları ile bilgisayar sarf malzemeleri (açılmış toner, kartuş, şerit vb.),
• Çabuk bozulabilen veya son kullanma tarihi geçebilecek gıda ve tüketim ürünleri.
(Ürünün ayıplı/kusurlu çıkması halinde tüketici her zaman yasal seçimlik haklarını kullanabilir.)

5. SİPARİŞ İPTALİ VE ÜCRET İADESİ SÜRECİ (İYZİCO / KREDİ KARTI VE HAVALE)
• Sipariş İptali: Henüz kargoya teslim edilmemiş siparişlerinizi müşteri panelinizden veya iletişim kanallarımızdan bize ulaşarak kesintisiz iptal edebilirsiniz.
• Ücret İadesi Süresi: İptal onayı veya iade edilen ürünün Satıcı'ya ulaşıp iade şartlarına uygunluğunun kontrol edilmesinden itibaren en geç 14 (ondört) gün içerisinde toplam bedel, Alıcı'nın ödeme yaptığı yöntemle birebir uyumlu şekilde iade edilir:
  - Kredi Kartı / Banka Kartı ile Yapılan Ödemeler (iyzico): Ödeme tutarı, BDDK lisanslı ödeme kuruluşu iyzico üzerinden doğrudan işlem yaptığınız kredi/banka kartına iade edilir. İadenin kart ekstrenize yansıması bankanızın iç süreçlerine bağlı olarak 1 ila 5 iş günü sürebilir. Taksitli yapılan alışverişlerde iyzico ve Satıcı tutarın tamamını bankanıza tek seferde öder; bankanız bu tutarı kartınıza taksit sayısı kadar aylık artı bakiye olarak yansıtır.
  - Havale / EFT ile Yapılan Ödemeler: Alıcı tarafından bildirilen ve sipariş sahibi adına kayıtlı olan banka IBAN hesabına en geç 14 gün içinde nakden iade edilir.`;
}

/**
 * 3. MESAFELİ SATIŞ SÖZLEŞMESİ (Taraflar, Yasal Mevzuat, Teslimat ve İade Hükümleri Dahil)
 */
export function generateDefaultDistanceSalesAgreement(
  store: any,
  lang = "tr",
  buyer?: BuyerCheckoutContext
): string {
  const p = resolveStoreLegalProfile(store);
  const isTr = lang === "tr";
  const todayStr = new Date().toLocaleDateString(isTr ? "tr-TR" : "en-US");

  const buyerName = buyer?.fullName?.trim() || (isTr ? "Sipariş Formunda Beyan Edilen Alıcı / Üye" : "Buyer / Member Declared in Order Form");
  const buyerAddress = [buyer?.address, buyer?.city, buyer?.country].filter(Boolean).join(", ").trim() || (isTr ? "Sipariş Formunda Beyan Edilen Teslimat Adresi" : "Delivery Address Declared in Order Form");
  const buyerPhone = buyer?.phone?.trim() || (isTr ? "Sipariş Formunda Beyan Edilen Telefon" : "Phone Declared in Order Form");
  const buyerEmail = buyer?.email?.trim() || (isTr ? "Sipariş Formunda Beyan Edilen E-Posta" : "E-Mail Declared in Order Form");

  const curr = buyer?.currency || store?.currency || store?.default_currency || "TRY";
  const hasBasketItems = Array.isArray(buyer?.items) && buyer!.items!.length > 0;

  let itemsTableText = "";
  if (hasBasketItems) {
    const lines = buyer!.items!.map(
      (it, idx) =>
        `${idx + 1}. ${it.name} — Adet: ${it.quantity} x ${Number(it.price || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${curr} = ${(Number(it.price || 0) * Number(it.quantity || 1)).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${curr}`
    );
    if (buyer?.shippingTotal !== undefined) {
      lines.push(
        `Kargo / Teslimat Bedeli: ${Number(buyer.shippingTotal) > 0 ? `${Number(buyer.shippingTotal).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${curr}` : "Ücretsiz (0,00 " + curr + ")"}`
      );
    }
    if (buyer?.grandTotal !== undefined) {
      lines.push(
        `Vergiler (KDV) Dahil Genel Toplam: ${Number(buyer.grandTotal).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${curr}`
      );
    }
    itemsTableText = lines.join("\n");
  } else {
    itemsTableText = isTr
      ? "• Ürün/Hizmetin Cinsi, Miktarı, Marka/Modeli ve Vergiler (KDV) Dahil Satış Bedeli: Web sitesindeki ürün tanıtım sayfasında ve Alıcı tarafından onaylanan Sipariş Özeti / Fatura ekranında belirtildiği gibidir.\n• Kargo / Teslimat Ücreti: Sipariş özeti ekranında belirtilen tutardır.\n• Ödeme Şekli: Kredi/Banka Kartı (iyzico Güvenli Ödeme), Banka Havalesi/EFT veya seçilen diğer ödeme yöntemi."
      : "• Product type, quantity, brand/model, VAT-included price, and shipping cost are as specified on the product page and Order Summary screen confirmed by the Buyer prior to payment.";
  }

  if (!isTr) {
    return `DISTANCE SALES AGREEMENT

ARTICLE 1 – PARTIES
1.1. SELLER (COMPANY):
Title: ${p.legalName} (${p.brandName})
Address: ${p.address}
Phone: ${p.phone}
E-Mail: ${p.email}
${p.taxOffice || p.taxNumber ? `Tax Office / Tax ID: ${[p.taxOffice, p.taxNumber].filter(Boolean).join(" — ")}\n` : ""}${p.mersisNo ? `MERSIS No: ${p.mersisNo}\n` : ""}Website: ${p.websiteUrl}

1.2. BUYER (CONSUMER / MEMBER):
Full Name / Title: ${buyerName}
Delivery Address: ${buyerAddress}
Phone: ${buyerPhone}
E-Mail: ${buyerEmail}

ARTICLE 2 – SUBJECT & LEGAL BASIS
The subject of this Agreement is the determination of the rights and obligations of the Parties in accordance with Consumer Protection Law No. 6502 and the Regulation on Distance Contracts regarding the sale and delivery of the product(s) ordered electronically by the Buyer from the Seller's website (${p.websiteUrl}).

ARTICLE 3 – PRODUCT, PRICE, PAYMENT & DELIVERY DETAILS
${itemsTableText}

ARTICLE 4 – GENERAL PROVISIONS & DELIVERY
4.1. The Buyer declares that they have read and been informed of the preliminary information regarding the basic characteristics of the product, VAT-included sales price, payment method, and delivery/return terms on ${p.websiteUrl} and confirmed them electronically.
4.2. The product subject to the contract is delivered to the Buyer or the person/organization at the address indicated by the Buyer within the period specified on the website depending on the distance, provided that it does not exceed the statutory 30 (thirty) days.
4.3. The Seller is responsible for delivering the contracted product intact, complete, in accordance with the qualifications specified in the order, and together with warranty documents and manuals, if any.

ARTICLE 5 – RIGHT OF WITHDRAWAL (14 DAYS) & RETURN PROCEDURE
5.1. The Buyer has the right to withdraw from the contract within 14 (fourteen) days from the delivery of the product to themselves or the person/organization at the address indicated, without assuming any legal or criminal liability and without giving any reason.
5.2. To exercise the right of withdrawal, written notification must be given to the Seller's e-mail (${p.email}) or phone (${p.phone}) within 14 days, and the product must be unused and returned with its original box, accessories, and invoice to "${p.address}".
5.3. Within at most 14 (fourteen) days following the receipt of the withdrawal notice and product, the total amount is refunded to the Buyer in accordance with the payment instrument used (for credit/debit card payments, via the iyzico payment infrastructure back to the Buyer's card).

ARTICLE 6 – PRODUCTS WHERE RIGHT OF WITHDRAWAL CANNOT BE EXERCISED
Pursuant to Article 15 of the Regulation on Distance Contracts, custom-made goods, hygiene-sensitive products whose packaging has been opened, and opened software/media/consumables are excluded from the right of withdrawal.

ARTICLE 7 – DISPUTE RESOLUTION & COMPETENT COURTS
In disputes arising from this Agreement, Consumer Arbitration Committees and Consumer Courts in the place of residence of the Buyer or the Seller are authorized up to the monetary limits announced annually by the Ministry of Trade.

ARTICLE 8 – ENFORCEMENT
This Agreement enters into force on ${todayStr} upon electronic approval by the Buyer.`;
  }

  return `MESAFELİ SATIŞ SÖZLEŞMESİ

MADDE 1 – TARAFLAR

1.1. SATICI BİLGİLERİ ("SATICI")
Ticari Ünvanı: ${p.legalName}${p.brandName && p.brandName !== p.legalName ? ` (${p.brandName})` : ""}
Açık Adresi: ${p.address}
Telefon: ${p.phone}
E-Posta Adresi: ${p.email}
${p.taxOffice || p.taxNumber ? `Vergi Dairesi / Vergi No: ${[p.taxOffice ? `${p.taxOffice} V.D.` : "", p.taxNumber].filter(Boolean).join(" — ")}\n` : ""}${p.mersisNo ? `MERSİS No: ${p.mersisNo}\n` : ""}${p.kepAddress ? `KEP Adresi: ${p.kepAddress}\n` : ""}Web Sitesi: ${p.websiteUrl}

1.2. ALICI (TÜKETİCİ / ÜYE) BİLGİLERİ ("ALICI")
Adı Soyadı / Ünvanı: ${buyerName}
Teslimat Adresi: ${buyerAddress}
Telefon: ${buyerPhone}
E-Posta Adresi: ${buyerEmail}

İşbu sözleşmeyi kabul etmekle ALICI, sözleşme konusu siparişi onayladığı takdirde sipariş konusu bedeli ve varsa kargo ücreti, vergi gibi belirtilen ek ücretleri ödeme yükümlülüğü altına gireceğini ve bu konuda önceden bilgilendirildiğini kabul ve beyan eder.

MADDE 2 – SÖZLEŞMENİN KONUSU VE YASAL MEVZUAT
İşbu Mesafeli Satış Sözleşmesi'nin ("Sözleşme") konusu; ALICI'nın, SATICI'ya ait "${p.websiteUrl}" internet sitesi ("Site") üzerinden elektronik ortamda siparişini verdiği, aşağıda nitelikleri ve satış fiyatı belirtilen ürün/ürünlerin satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve 29188 sayılı Resmi Gazete'de yayımlanan Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların karşılıklı hak ve yükümlülüklerinin belirlenmesidir.

MADDE 3 – SÖZLEŞME KONUSU ÜRÜN, FİYAT VE ÖDEME BİLGİLERİ
3.1. Malın/Ürünün temel özellikleri (türü, miktarı, marka/modeli, rengi, adedi) SATICI'ya ait internet sitesinde yer almakta olup, sipariş özeti ve fatura içeriğinde detaylı olarak belirtilmiştir.
3.2. Sipariş ve Fiyat Özeti:
${itemsTableText}

3.3. Ödeme Güvenliği: Kredi kartı veya banka kartı ile yapılan ödemeler, BDDK lisanslı ödeme kuruluşu "iyzico" güvenli ödeme altyapısı (256-Bit SSL ve 3D Secure) aracılığıyla tahsil edilir. SATICI, ALICI'nın kart bilgilerini hiçbir şekilde kaydetmez ve saklamaz.

MADDE 4 – GENEL HÜKÜMLER VE TESLİMAT ŞARTLARI
4.1. ALICI, SATICI'ya ait internet sitesinde sözleşme konusu ürünün temel nitelikleri, tüm vergiler dahil satış fiyatı, ödeme şekli, teslimat koşulları ve cayma hakkına ilişkin ön bilgileri okuyup bilgi sahibi olduğunu ve elektronik ortamda gerekli teyidi verdiğini kabul ve beyan eder.
4.2. Sözleşme konusu her bir ürün, 6502 sayılı Kanun uyarınca yasal 30 (otuz) günlük süreyi aşmamak kaydıyla, yerleşim yerinin uzaklığına bağlı olarak internet sitesindeki ön bilgiler kısmında belirtilen süre zarfında ALICI veya gösterdiği adresteki kişi ve/veya kuruluşa anlaşmalı kargo şirketi aracılığıyla teslim edilir.
4.3. SATICI, sözleşme konusu ürünü sağlam, eksiksiz, siparişte belirtilen niteliklere uygun ve varsa garanti belgeleri, kullanım kılavuzları ve yasal e-Fatura/e-Arşiv faturası ile teslim하mekle yükümlüdür.
4.4. ALICI, sözleşme konusu ürünü teslim almadan önce muayene edecek; ezik, kırık, ambalajı yırtılmış vb. hasarlı ve ayıplı ürünü kargo şirketinden teslim almayarak kargo görevlisine "Hasar Tespit Tutanağı" tutturacaktır.
4.5. Ürünün tesliminden sonra ALICI'ya ait kredi kartının ALICI'nın kusurundan kaynaklanmayan bir şekilde yetkisiz kişilerce haksız veya hukuka aykırı olarak kullanılması nedeni ile ilgili banka veya finans kuruluşunun ürün bedelini SATICI'ya ödememesi halinde, ALICI kendisine teslim edilmiş olması kaydıyla ürünü 3 (üç) gün içinde SATICI'ya iade etmekle yükümlüdür.

MADDE 5 – CAYMA HAKKI VE İADE PROSEDÜRÜ (14 GÜN)
5.1. ALICI; mal satışına ilişkin mesafeli sözleşmelerde, ürünün kendisine veya gösterdiği adresteki kişi/kuruluşa teslim tarihinden itibaren 14 (ondört) gün içerisinde, SATICI'ya bildirmek şartıyla hiçbir hukuki ve cezai sorumluluk üstlenmeksizin ve hiçbir gerekçe göstermeksizin malı reddederek sözleşmeden cayma hakkına sahiptir.
5.2. Cayma hakkının kullanılması için 14 (ondört) günlük süre içinde SATICI'nın "${p.email}" e-posta adresine, "${p.phone}" telefonuna veya müşteri hesabı üzerinden SATICI'ya bildirimde bulunulması ve ürünün kullanılmamış, kutusu, ambalajı, varsa standart aksesuarları ve faturası ile birlikte "${p.legalName} — ${p.address}" adresine gönderilmesi gerekmektedir.
5.3. SATICI, cayma bildiriminin ve ürünün kendisine ulaşmasından itibaren en geç 14 (ondört) gün içerisinde toplam bedeli ALICI'nın satın alırken kullandığı ödeme aracına uygun bir şekilde (Kredi/Banka kartı işlemlerinde iyzico üzerinden ilgili karta, Havale/EFT işlemlerinde ALICI'nın IBAN hesabına) tek seferde iade etmekle yükümlüdür.
5.4. ALICI'nın kredi kartına yapılan iadelerin banka tarafından ALICI hesaplarına yansıtılması ilgili bankanın süreçleriyle ilgili olup, taksitli satışlarda banka iadeyi ALICI kredi kartına taksit vadesi boyunca artı bakiye olarak yansıtabilir.

MADDE 6 – CAYMA HAKKI KULLANILAMAYACAK ÜRÜNLER
Mesafeli Sözleşmeler Yönetmeliği'nin 15. maddesi gereğince;
a) ALICI'nın istekleri veya kişisel ihtiyaçları doğrultusunda hazırlanan mallar,
b) Çabuk bozulabilen veya son kullanma tarihi geçebilecek mallar,
c) Tesliminden sonra ambalaj, bant, mühür, paket gibi koruyucu unsurları açılmış olan mallardan; iadesi sağlık ve hijyen açısından uygun olmayanlar,
ç) Malın tesliminden sonra ambalaj, bant, mühür, paket gibi koruyucu unsurları açılmış olması halinde maddi ortamda sunulan kitap, dijital içerik, yazılım programları, ses veya görüntü kayıtları ve bilgisayar sarf malzemeleri için cayma hakkı kullanılamaz.

MADDE 7 – TEMERRÜT HALİ VE HUKUKİ SONUÇLARI
ALICI, ödeme işlemlerini kredi kartı ile yaptığı durumda temerrüde düştüğü takdirde, kart sahibi banka ile arasındaki kredi kartı sözleşmesi çerçevesinde faiz ödeyeceğini ve bankaya karşı sorumlu olacağını kabul, beyan ve taahhüt eder.

MADDE 8 – UYUŞMAZLIKLARIN ÇÖZÜMÜ VE YETKİLİ MAHKEME
İşbu sözleşmeden doğabilecek uyuşmazlıklarda, Ticaret Bakanlığınca her yıl ilan edilen parasal sınırlar dahilinde ALICI'nın mal veya hizmeti satın aldığı ve ikametgahının bulunduğu yerdeki Tüketici Hakem Heyetleri ile Tüketici Mahkemeleri yetkilidir.

MADDE 9 – YÜRÜRLÜK
ALICI, Site üzerinden verdiği siparişe ait ödemeyi gerçekleştirdiğinde işbu sözleşmenin tüm şartlarını kabul etmiş sayılır.
Düzenleme / Onay Tarihi: ${todayStr}`;
}

/**
 * 4. ÖN BİLGİLENDİRME FORMU
 */
export function generateDefaultPreInfoForm(
  store: any,
  lang = "tr",
  buyer?: BuyerCheckoutContext
): string {
  const p = resolveStoreLegalProfile(store);
  const isTr = lang === "tr";
  const sellerBlock = formatSellerIdentityBlock(p, isTr);

  if (!isTr) {
    return `PRE-INFORMATION FORM

1. SELLER INFORMATION
${sellerBlock}

2. SUBJECT
This Pre-Information Form has been prepared pursuant to Consumer Protection Law No. 6502 and the Regulation on Distance Contracts to inform the Buyer prior to conclusion of the contract about the seller identity, product characteristics, VAT-included total price, delivery/shipping process, and the 14-day right of withdrawal.

3. PAYMENT & DELIVERY
Payments by credit/debit card are processed securely via the iyzico payment infrastructure (Visa / MasterCard / Troy, 256-Bit SSL). Orders are shipped within 1–3 business days and delivered within the statutory 30-day maximum limit.

4. RIGHT OF WITHDRAWAL (14 DAYS)
The Buyer may withdraw from the contract within 14 days from delivery without penalty by notifying ${p.email} or ${p.phone} and returning the unused product to ${p.address}. Refunds are processed within 14 days via the original payment method.

5. COMPLAINTS & DISPUTES
Buyers may submit applications regarding complaints to the Seller's contact channels or to Consumer Arbitration Committees and Consumer Courts.`;
  }

  return `MESAFELİ SATIŞ ÖN BİLGİLENDİRME FORMU

1. SATICI FİRMA BİLGİLERİ
${sellerBlock}

2. KONU VE KAPSAM
İşbu Ön Bilgilendirme Formu'nun konusu, ALICI'nın SATICI'ya ait ${p.brandName} (${p.websiteUrl}) web sitesi üzerinden sipariş vereceği ürün/hizmetlerin satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri uyarınca sözleşme kurulmadan önce bilgilendirilmesidir.

3. SÖZLEŞME KONUSU ÜRÜN, FİYAT VE ÖDEME BİLGİLERİ
• Ürünlerin temel özellikleri, vergiler (KDV) dahil toplam satış fiyatı ve kargo bedeli, ödeme onayından hemen önce Sepet ve Sipariş Özeti ekranında ALICI'nın onayına sunulmaktadır.
• Kartlı ödemeler, BDDK lisanslı ödeme kuruluşu "iyzico" güvenli ödeme altyapısı (Visa, MasterCard, Troy — 256-Bit SSL & 3D Secure) üzerinden tahsil edilir.

4. TESLİMAT SÜRESİ VE ŞARTLARI
• Sipariş konusu ürünler, ödemenin onaylanmasının ardından 1-3 iş günü içerisinde (yasal azami 30 günlük süreyi aşmamak kaydıyla) anlaşmalı kargo firmasına teslim edilerek ALICI'nın belirttiği teslimat adresine gönderilir.

5. CAYMA HAKKI VE İADE ÖZETİ (14 GÜN)
• ALICI, ürünü teslim aldığı tarihten itibaren 14 (ondört) gün içinde hiçbir gerekçe göstermeksizin ve cezai şart ödemeksizin cayma hakkını kullanabilir.
• Cayma bildirimi ${p.email} veya ${p.phone} üzerinden yapılarak, ürün orijinal kutusu, aksesuarları ve faturası ile "${p.address}" adresine gönderilir.
• İade onayından itibaren en geç 14 gün içinde ürün bedeli ödeme aracına uygun olarak (kredi kartına iyzico aracılığıyla veya IBAN hesabına) eksiksiz iade edilir.

6. ŞİKAYET VE UYUŞMAZLIK ÇÖZÜM MERCİLERİ
• ALICI, sipariş ve ürünlerle ilgili her türlü talep ve şikayetini yukarıdaki SATICI iletişim kanallarına iletebilir. Ayrıca her yıl Ticaret Bakanlığı tarafından belirlenen parasal sınırlar dahilinde Tüketici Hakem Heyetlerine ve Tüketici Mahkemelerine başvurabilir.`;
}

function extractRawLegalText(val: any): string {
  if (!val) return "";
  if (typeof val === "string") return val.trim();
  if (typeof val === "object" && typeof val.content === "string") return val.content.trim();
  return "";
}

function isPlaceholderLegalText(txt: string): boolean {
  if (!txt || txt.length < 40) return true;
  const lower = txt.toLowerCase();
  if (
    lower.includes("içerik henüz eklenmemiş") ||
    lower.includes("content not added") ||
    lower.includes("şartnameleri...") ||
    lower.includes("terms...")
  ) {
    return true;
  }
  return false;
}

/**
 * Resolves the complete legal document title and content for any requested document type.
 * If the operator entered custom text, uses it (and ensures official seller info is attached);
 * otherwise generates the full, legally compliant text from the store's official company credentials.
 */
export function resolveLegalDocumentContent(
  type: LegalDocType,
  store: any,
  lang = "tr",
  buyer?: BuyerCheckoutContext
): { title: string; content: string; profile: StoreLegalProfile } {
  const isTr = lang === "tr";
  const profile = resolveStoreLegalProfile(store);
  const lp =
    (store?.legal_pages && typeof store.legal_pages === "object" ? store.legal_pages : null) ||
    (store?.branding?.legal_pages && typeof store.branding.legal_pages === "object" ? store.branding.legal_pages : {}) ||
    {};

  if (type === "privacy" || type === "kvkk") {
    const title = isTr ? "Gizlilik Politikası ve KVKK Aydınlatma Metni" : "Privacy Policy & KVKK Notice";
    const custom = extractRawLegalText(lp.privacy_policy) || extractRawLegalText(lp.kvkk);
    const content = !isPlaceholderLegalText(custom)
      ? custom
      : generateDefaultPrivacyPolicy(store, lang);
    return { title, content, profile };
  }

  if (type === "delivery_return") {
    const title = isTr ? "Teslimat ve İade Koşulları" : "Delivery & Return Policy";
    const customCombined = extractRawLegalText(lp.delivery_return);
    const customShipping = extractRawLegalText(lp.shipping_policy);
    const customReturn = extractRawLegalText(lp.return_policy);

    let content = "";
    if (!isPlaceholderLegalText(customCombined)) {
      content = customCombined;
    } else if (!isPlaceholderLegalText(customShipping) || !isPlaceholderLegalText(customReturn)) {
      const sellerHeader = `SATICI VE İADE ADRESİ BİLGİLERİ\n${formatSellerIdentityBlock(profile, isTr)}\n\n`;
      const parts = [
        !isPlaceholderLegalText(customShipping) ? `TESLİMAT VE KARGO KOŞULLARI\n${customShipping}` : "",
        !isPlaceholderLegalText(customReturn) ? `İPTAL VE İADE KOŞULLARI\n${customReturn}` : "",
      ].filter(Boolean);
      content = sellerHeader + parts.join("\n\n") + "\n\n" + generateDefaultDeliveryAndReturnPolicy(store, lang);
    } else {
      content = generateDefaultDeliveryAndReturnPolicy(store, lang);
    }
    return { title, content, profile };
  }

  if (type === "sales") {
    const title = isTr ? "Mesafeli Satış Sözleşmesi" : "Distance Sales Agreement";
    const custom = extractRawLegalText(lp.sales_agreement);
    const content = !isPlaceholderLegalText(custom) && !buyer?.items?.length
      ? custom
      : generateDefaultDistanceSalesAgreement(store, lang, buyer);
    return { title, content, profile };
  }

  // pre_info
  const title = isTr ? "Ön Bilgilendirme Formu" : "Pre-Information Form";
  const custom = extractRawLegalText(lp.pre_info);
  const content = !isPlaceholderLegalText(custom)
    ? custom
    : generateDefaultPreInfoForm(store, lang, buyer);
  return { title, content, profile };
}
