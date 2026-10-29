import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  Send,
  Copy,
  Check,
  Download,
  Printer,
  Globe,
  ShoppingCart,
  Utensils,
  Building2,
  Car,
  BookOpen,
  Briefcase,
  MessageCircle,
  Mail,
  Instagram,
  KeyRound,
  ExternalLink,
  Layers,
  Share2,
  Truck,
  Receipt,
  QrCode,
  ShieldCheck,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Phone,
  User,
  GitBranch,
  Eye
} from "lucide-react";
import toast from "react-hot-toast";

export type MarketingSectorKey =
  | "shoplp"
  | "horecalp"
  | "restatelp"
  | "autolp"
  | "booklp"
  | "weblp";

export type MarketingChannelKey = "whatsapp" | "instagram" | "email";

interface SectorCampaignConfig {
  key: MarketingSectorKey;
  badge: string;
  name: string;
  productBrand: string;
  shortTitle: string;
  targetAudience: string;
  heroHeadline: string;
  heroSubheadline: string;
  accentHex: string;
  secondaryHex: string;
  gradientClass: string;
  coverImage: string;
  webDemoSlug: string;
  sectorDemoSlug: string;
  branchDemoSlugs: string[];
  demoEmail: string;
  demoPassword: string;
  painPoints: string[];
  valuePillars: Array<{
    title: string;
    desc: string;
  }>;
}

interface SavedProspect {
  id: string;
  companyName: string;
  contactPerson: string;
  branchCount: string;
  phone: string;
  email: string;
  instagram: string;
  sector: MarketingSectorKey;
  status: "hazir" | "gonderildi" | "donus_alindi";
  createdAt: string;
}

const SECTOR_CONFIGS: Record<MarketingSectorKey, SectorCampaignConfig> = {
  shoplp: {
    key: "shoplp",
    badge: "PERAKENDE & ÇOK ŞUBELİ MAĞAZA",
    name: "ShopLP + WebLP Ekosistemi",
    productBrand: "ShopLP Bulut Perakende & CRM",
    shortTitle: "Perakende, Mağaza Zinciri & E-Ticaret",
    targetAudience: "Elektronik, Yapı Market, Giyim, Ev & Yaşam, Kozmetik, Medikal ve Çok Şubeli Mağazalar",
    heroHeadline: "KURUMSAL WEB SİTENİZ VE ÇOK ŞUBELİ MAĞAZA YÖNETİMİNİZ HAZIR!",
    heroSubheadline: "Masaüstüne hapsolmuş geleneksel yazılımları geride bırakın. Tüm şubelerinizi, web sitenizi, pazaryerlerini ve araç filonuzu tek bulut panelden yönetin.",
    accentHex: "#4f46e5",
    secondaryHex: "#06b6d4",
    gradientClass: "from-indigo-600 via-blue-700 to-slate-900",
    coverImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
    webDemoSlug: "weblp-demo",
    sectorDemoSlug: "shoplp-demo",
    branchDemoSlugs: ["shoplp-demo", "weblp-demo"],
    demoEmail: "demo@shoplp.com",
    demoPassword: "shoplp1234",
    painPoints: [
      "Şubeler arası telefonla stok sorma ve Excel karmaşası",
      "Masaüstü bilgisayara bağımlı, uzaktan erişilemeyen eski paket programlar",
      "Web sitesi, kasa ve pazaryerlerinde ayrı ayrı fiyat/stok güncelleme yükü"
    ],
    valuePillars: [
      {
        title: "Kişiselleştirilebilir Kurumsal Web & E-Vitrin",
        desc: "Logonuz ve kurumsal kimliğinizle hazır web siteniz anında yayında; kasadaki stokla %100 senkronize."
      },
      {
        title: "Çok Şubeli Canlı Stok & Transfer Motoru",
        desc: "Tüm şubelerinizin stoklarını tek ekranda görün, tek tıkla şubeler arası barkodlu transfer yapın."
      },
      {
        title: "Google AI Pro Sosyal Medya & Video Stüdyosu",
        desc: "Ürünlerinizi saniyeler içinde senaryolu Instagram Reels videolarına ve profesyonel kampanya afişlerine dönüştürün."
      },
      {
        title: "5 Pazaryeri & Resmi e-Fatura Entegrasyonu",
        desc: "Trendyol, Hepsiburada, N11, Amazon ve Pazarama stok/fiyatlarınızı ve e-Fatura süreçlerinizi tek merkezden yönetin."
      },
      {
        title: "Araç Filosu, Teknik Servis & Teklif CRM",
        desc: "Şirket araçlarınızın bakım/yakıt takibini, müşteri tekliflerini ve teknik servis kayıtlarını eksiksiz kontrol edin."
      },
      {
        title: "Dövizli Cari Hesap & Dijital Mutabakat",
        desc: "TCMB kur senkronizasyonlu cari bakiyeler ve WhatsApp üzerinden tek tıkla onaylanan resmi cari mutabakat."
      }
    ]
  },
  horecalp: {
    key: "horecalp",
    badge: "CAFE, RESTORAN & KONAKLAMA",
    name: "HoReCaLP + HotelLP Ekosistemi",
    productBrand: "HoReCaLP Restoran, Cafe & Otel Otomasyonu",
    shortTitle: "Cafe, Restoran Zinciri & Butik Otel",
    targetAudience: "Kafeler, Restoran Zincirleri, Pastaneler, Beach Club ve Butik Oteller",
    heroHeadline: "KURUMSAL WEB SİTENİZ, QR MENÜNÜZ VE TÜM ŞUBE ADİSYONLARINIZ TEK EKRANDA!",
    heroSubheadline: "Geleneksel adisyon programlarının hantal yapısından kurtulun. Masadan QR siparişi, mutfak ekranını, şube cirolarını ve otel oda folyolarını cebinizden yönetin.",
    accentHex: "#d97706",
    secondaryHex: "#ea580c",
    gradientClass: "from-amber-600 via-orange-700 to-slate-900",
    coverImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    webDemoSlug: "weblp-demo",
    sectorDemoSlug: "horecalp-demo",
    branchDemoSlugs: ["horecalp-demo", "weblp-demo"],
    demoEmail: "demo@horecalp.com",
    demoPassword: "horecalp1234",
    painPoints: [
      "Mekan dışındayken şubelerin anlık masa, adisyon ve kasa durumunu görememe",
      "Fiyat değiştiğinde basılı menüleri ve şube ekranlarını tek tek güncelleme zorluğu",
      "Sosyal medya için profesyonel menü/kampanya videosu üretememe"
    ],
    valuePillars: [
      {
        title: "Yeni Nesil Kurumsal Web & Temassız QR Menü",
        desc: "Mekanınıza özel kurumsal web sitesi ve masadan doğrudan sipariş alabilen çok dilli dijital QR menü."
      },
      {
        title: "Hızlı POS Adisyon & Masa Birleştirme / Bölme",
        desc: "Garson el terminali, hızlı kasa POS ekranı, Alman usulü hesap bölme ve anlık masa taşıma."
      },
      {
        title: "Akıllı Dijital Mutfak & Bar Hazırlık Ekranı",
        desc: "Siparişler saniyesinde mutfak ekranına düşer; hazırlık süreleri ve garson bildirimleri sıfır hatayla işler."
      },
      {
        title: "Çok Şubeli Konsolide Ciro & Reçete/Stok Kontrolü",
        desc: "Tüm şubelerinizin gün sonu Z raporlarını, satılan ürün kalemlerini ve stok düşümlerini canlı izleyin."
      },
      {
        title: "Google AI Pro Menü & Kampanya Reels Stüdyosu",
        desc: "Yemek ve içecek görsellerinizden saniyeler içinde iştah açıcı Instagram Reels videoları ve afişler üretin."
      },
      {
        title: "Entegre Otel Oda Folyosu & Kurye Filo Yönetimi",
        desc: "Otel konseptinde restoran adisyonlarını tek tıkla oda hesabına aktarın; paket servis araç filonuzu takip edin."
      }
    ]
  },
  restatelp: {
    key: "restatelp",
    badge: "GAYRİMENKUL & PROJE YATIRIM",
    name: "REstateLP + WebLP Ekosistemi",
    productBrand: "REstateLP Dijital Emlak & Portföy CRM",
    shortTitle: "Emlak Ofisleri, İnşaat & Yatırım Şirketleri",
    targetAudience: "Çok Şubeli Gayrimenkul Ofisleri, İnşaat Firmaları ve Yatırım Danışmanları",
    heroHeadline: "PRESTİJLİ EMLAK WEB SİTENİZ VE ÇOK ŞUBELİ PORTFÖY CRM SİSTEMİNİZ HAZIR!",
    heroSubheadline: "Klasik ilan sitelerine bağımlı kalmayın. Harita tabanlı lüks portföy vitrininizi, şube danışmanlarınızı, biyometrik imzalı sözleşmelerinizi ve sosyal medya videolarınızı tek merkezden yönetin.",
    accentHex: "#e11d48",
    secondaryHex: "#9333ea",
    gradientClass: "from-rose-600 via-purple-800 to-slate-900",
    coverImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
    webDemoSlug: "weblp-demo",
    sectorDemoSlug: "restatelp-demo",
    branchDemoSlugs: ["restatelp-demo", "restatelp-girne-demo", "restatelp-iskele-demo"],
    demoEmail: "demo@restatelp.com",
    demoPassword: "restatelp1234",
    painPoints: [
      "Şubeler ve danışmanlar arasında portföy, kapora ve müşteri takibinin kopuk olması",
      "Yabancı ve yerel yatırımcılara Sterlin/Euro/Dolar bazlı profesyonel sunum ve harita deneyimi sunamama",
      "Her yeni ilan için saatlerce vitrin afişi ve Instagram videosu hazırlama zahmeti"
    ],
    valuePillars: [
      {
        title: "Harita Tabanlı (IDX) Lüks Gayrimenkul Web Vitrini",
        desc: "Koçan/Tapu türü, imar, KAKS, Sterlin/Döviz filtreli ve tam ekran interaktif haritalı kurumsal web siteniz hazır."
      },
      {
        title: "Çok Şubeli Portföy & Danışman Performans CRM",
        desc: "Merkez, Girne, İskele gibi tüm şubelerinizin portföylerini ve danışman müşteri eşleştirmelerini tek ekrandan yönetin."
      },
      {
        title: "Biyometrik Dijital İmzalı Yer Gösterme & Sözleşmeler",
        desc: "Tabletten veya telefondan saniyeler içinde biyometrik imzalı yer gösterme belgesi ve kira/satış sözleşmesi oluşturun."
      },
      {
        title: "Tek Tıkla A4 Cam Vitrin Posteri & AI Reels Video",
        desc: "İlan fotoğraflarından otomatik A4 vitrin posteri ve Google AI Pro ile sinematik sosyal medya videoları üretin."
      },
      {
        title: "Araç Filosu & Saha Gezi/Randevu Takvimi",
        desc: "Danışmanlarınızın saha araç zimmetlerini, yakıt/bakım giderlerini ve müşteri yer gösterme takvimini kontrol edin."
      },
      {
        title: "Otomatik Yatırımcı Eşleştirme & Dövizli Finans",
        desc: "Yeni portföy girildiğinde bütçe ve kriteri uyan alıcıları sistem otomatik tespit eder; komisyon ve cariyi tutar."
      }
    ]
  },
  autolp: {
    key: "autolp",
    badge: "OTOMOTİV, GALERİ & FİLO",
    name: "AutoLP + WebLP Ekosistemi",
    productBrand: "AutoLP Bulut Oto Galeri & Filo CRM",
    shortTitle: "Oto Galeri, Lüks Showroom & Filo Şirketleri",
    targetAudience: "Çok Şubeli Oto Galeriler, Lüks Araç Showroomları ve Filo Kiralama Şirketleri",
    heroHeadline: "SHOWROOM WEB SİTENİZ VE ÇOK ŞUBELİ OTO GALERİ / FİLO SİSTEMİNİZ HAZIR!",
    heroSubheadline: "Defter ve Excel ile araç maliyet/kapora takibine son verin. Şubelerinizdeki tüm araç envanterini, ekspertiz şemalarını, dijital sözleşmeleri ve AI sosyal medya videolarını tek ekranda toplayın.",
    accentHex: "#2563eb",
    secondaryHex: "#0891b2",
    gradientClass: "from-blue-600 via-cyan-800 to-slate-900",
    coverImage: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
    webDemoSlug: "weblp-demo",
    sectorDemoSlug: "autolp-demo",
    branchDemoSlugs: ["autolp-demo", "autolp-girne-demo", "autolp-magusa-demo"],
    demoEmail: "demo@autolp.com",
    demoPassword: "autolp1234",
    painPoints: [
      "Şubelerdeki araçların alış maliyeti, yapılan masraflar, gümrük/tescil ve net kâr hesabının karışması",
      "Instagram için her araca özel profesyonel afiş ve video hazırlamanın zaman alması",
      "Kapora, takas ve satış sözleşmelerinde kurumsal standart eksikliği"
    ],
    valuePillars: [
      {
        title: "Premium Showroom Web Sitesi & Kredi Hesaplayıcı",
        desc: "Araçlarınızın tüm teknik donanımını, ekspertiz durumunu ve finansman seçeneklerini sunan modern web vitrini."
      },
      {
        title: "Çok Şubeli Araç Envanteri & Maliyet/Kâr Analizi",
        desc: "Aracın alışından satışına kadar tüm bakım, kuaför, gümrük ve komisyon giderlerini Sterlin/Döviz bazlı takip edin."
      },
      {
        title: "Biyometrik Dijital İmzalı Araç Satış & Kapora Sözleşmesi",
        desc: "Alıcı ve satıcı arasında hukuki geçerliliğe sahip, ekspertiz şemalı ve biyometrik imzalı dijital sözleşmeler."
      },
      {
        title: "Google AI Pro Araç Tanıtım Videosu & Afiş Stüdyosu",
        desc: "Showroom fotoğraflarınızdan saniyeler içinde dikkat çekici Instagram Reels videoları ve story afişleri üretin."
      },
      {
        title: "Test Sürüşü Randevu & Müşteri Talep Radarı",
        desc: "Müşterinin aradığı marka/model stoğunuza girdiğinde anında bildirim üreten akıllı eşleştirme radarı."
      },
      {
        title: "Şirket & Kiralık Filo Bakım / Muayene Takibi",
        desc: "Envanterinizdeki tüm araçların sigorta, muayene, servis ve yakıt süreçlerini otomatik hatırlatmalarla yönetin."
      }
    ]
  },
  booklp: {
    key: "booklp",
    badge: "KİTABEVİ, KIRTASİYE & YAYINEVİ",
    name: "BookLP + ShopLP Ekosistemi",
    productBrand: "BookLP Sinematik Kitabevi & Çok Şubeli POS",
    shortTitle: "Kitabevleri, Kırtasiye Zincirleri & Yayınevleri",
    targetAudience: "Çok Şubeli Kitabevleri, Kırtasiye Mağazaları, Sahaflar ve Yayınevleri",
    heroHeadline: "SİNEMATİK KİTABEVİ WEB SİTENİZ VE ÇOK ŞUBELİ ISBN/POS SİSTEMİNİZ HAZIR!",
    heroSubheadline: "Binlerce eseri geleneksel kasa programlarına sıkıştırmayın. Okurlarınıza Netflix kalitesinde bir dijital kitap vitrini sunarken, tüm şubelerinizin ISBN stoklarını ve satışlarını tek merkezden yönetin.",
    accentHex: "#9333ea",
    secondaryHex: "#db2777",
    gradientClass: "from-purple-600 via-fuchsia-800 to-slate-900",
    coverImage: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80",
    webDemoSlug: "weblp-demo",
    sectorDemoSlug: "booklp-demo",
    branchDemoSlugs: ["booklp-demo", "booklp-girne-demo"],
    demoEmail: "demo@booklp.com",
    demoPassword: "booklp1234",
    painPoints: [
      "Okurun sorduğu bir kitabın hangi şubede kaç adet kaldığını anında görememe",
      "Yazar, yayınevi, çevirmen ve ISBN bazlı modern bir online katalog sunamama",
      "Yeni çıkan kitapları ve kampanya listelerini sosyal medyada hızlıca duyuramama"
    ],
    valuePillars: [
      {
        title: "Netflix Tarzı Sinematik Kitap & Eser Web Vitrini",
        desc: "Yazar, yayınevi, kategori ve ISBN arama motorlu, okurların hayran kalacağı modern online kitabevi vitrini."
      },
      {
        title: "Çok Şubeli ISBN Barkodlu Hızlı POS & Stok Transferi",
        desc: "Hangi kitabın hangi şubede olduğunu saniyesinde görün; şubeler arası barkodlu kitap transferini tek tıkla yapın."
      },
      {
        title: "Mağaza İçi QR Fiyat & Eser Künyesi Sorgulama",
        desc: "Okurlar mağaza içinde kitabın barkodunu okutarak güncel fiyatını ve arka kapak özetini telefonundan inceler."
      },
      {
        title: "Google AI Pro Kitap Tanıtım & Sosyal Medya Stüdyosu",
        desc: "Haftanın çok satanlarını ve yeni çıkan eserleri saniyeler içinde estetik sosyal medya afişlerine ve videolara dönüştürün."
      },
      {
        title: "Yayınevi / Dağıtımcı Dövizli Cari & Fatura Yönetimi",
        desc: "Tedarikçi alış faturalarınızı, konsinye/iskonto oranlarınızı ve resmi e-Fatura süreçlerinizi eksiksiz yönetin."
      },
      {
        title: "Okul / Kurumsal Toplu Liste Teklif & Dağıtım Filosu",
        desc: "Okul ve kurumlara özel kırtasiye/kitap listesi teklifleri hazırlayın, sevkiyat araç filonuzu takip edin."
      }
    ]
  },
  weblp: {
    key: "weblp",
    badge: "KURUMSAL WEB & ŞİRKET YÖNETİMİ",
    name: "WebLP + Kurumsal CRM Ekosistemi",
    productBrand: "WebLP Kurumsal Web, Şube & Filo Yönetimi",
    shortTitle: "Üretim, Hizmet, İnşaat & Kurumsal Şirketler",
    targetAudience: "Üretim Tesisleri, Toptancılar, Hukuk/Danışmanlık Büroları, Klinikler ve Çok Şubeli Hizmet Şirketleri",
    heroHeadline: "PRESTİJLİ KURUMSAL WEB SİTENİZ VE ŞİRKET YÖNETİM PANELİNİZ HAZIR!",
    heroSubheadline: "Ajanslara aylarca bekleyip yüksek bütçeler ödemeyin. Kendi yönetim panelinden dilediğiniz an güncelleyebileceğiniz kurumsal web siteniz ve uçtan uca şirket CRM'iniz bugün teslime hazır.",
    accentHex: "#0f766e",
    secondaryHex: "#2563eb",
    gradientClass: "from-teal-600 via-emerald-800 to-slate-900",
    coverImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    webDemoSlug: "weblp-demo",
    sectorDemoSlug: "akdeniz-hukuk",
    branchDemoSlugs: ["weblp-demo", "akdeniz-hukuk", "shoplp-demo"],
    demoEmail: "demo@weblp.com",
    demoPassword: "weblp1234",
    painPoints: [
      "Web sitesi olmayan veya yıllardır güncellenmeyen eski web siteleri yüzünden kurumsal prestij kaybı",
      "Şubeler, saha personeli, şirket araçları ve cari hesapların birbirinden kopuk yönetilmesi",
      "Sosyal medyada kurumsal kimliğe yakışır düzenli görsel ve video içerik üretememe"
    ],
    valuePillars: [
      {
        title: "Dinamik Yönetim Panelli Prestijli Kurumsal Web Sitesi",
        desc: "Kod bilmeden hizmetlerinizi, projelerinizi, blog yazılarınızı ve iletişim bilgilerinizi saniyeler içinde güncelleyin."
      },
      {
        title: "Daha Fazlası: ShopLP / CRM Gücüyle Tam Entegrasyon",
        desc: "İhtiyacınız büyüdüğünde tek tıkla stok, teklif, satış, e-Fatura ve çok şubeli ERP modüllerini devreye alın."
      },
      {
        title: "Araç Filosu, Yakıt, Bakım & Personel Zimmet Yönetimi",
        desc: "Şirketinizin tüm binek ve ticari araçlarının masraf, sigorta, muayene ve saha görevlerini tek ekrandan izleyin."
      },
      {
        title: "Google AI Pro Kurumsal Sosyal Medya & Video Stüdyosu",
        desc: "Hizmet ve ürünlerinizi yapay zeka destekli kurumsal afiş ve Reels videolarıyla sosyal medyada öne çıkarın."
      },
      {
        title: "Kurumsal Teklif, Sözleşme & Dijital Cari Mutabakat",
        desc: "Müşterilerinize antetli PDF teklifler gönderin, dövizli cari hesaplarınızı ve mutabakatlarınızı dijitalleştirin."
      },
      {
        title: "Çoklu Dil (TR / EN / EL) & Tam Mobil Uyumluluk",
        desc: "Uluslararası müşterilerinize Türkçe, İngilizce ve Yunanca dil desteğiyle kusursuz bir dijital vitrin sunun."
      }
    ]
  }
};

export const SuperAdminMarketingHub: React.FC<{ lang?: string }> = ({ lang = "tr" }) => {
  const [selectedSector, setSelectedSector] = useState<MarketingSectorKey>("shoplp");
  const [selectedChannel, setSelectedChannel] = useState<MarketingChannelKey>("whatsapp");

  // Prospect Personalization State
  const [companyName, setCompanyName] = useState<string>("");
  const [contactPerson, setContactPerson] = useState<string>("");
  const [branchCount, setBranchCount] = useState<string>("2+");
  const [prospectPhone, setProspectPhone] = useState<string>("");
  const [prospectEmail, setProspectEmail] = useState<string>("");
  const [prospectInstagram, setProspectInstagram] = useState<string>("");
  const [senderName, setSenderName] = useState<string>("LookPrice Dijital Dönüşüm Ekibi");
  const [senderPhone, setSenderPhone] = useState<string>("+90 548 800 00 00");
  const [includeLoginCredentials, setIncludeLoginCredentials] = useState<boolean>(true);
  const [includeWebLpLink, setIncludeWebLpLink] = useState<boolean>(true);

  // Editable Generated Copy State
  const [customSubject, setCustomSubject] = useState<string>("");
  const [customBody, setCustomBody] = useState<string>("");
  const [isEditedManually, setIsEditedManually] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isGeneratingPng, setIsGeneratingPng] = useState<boolean>(false);

  // Saved Prospects in localStorage for outreach tracking
  const [savedProspects, setSavedProspects] = useState<SavedProspect[]>(() => {
    try {
      const raw = localStorage.getItem("lp_superadmin_marketing_prospects");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("lp_superadmin_marketing_prospects", JSON.stringify(savedProspects));
    } catch {}
  }, [savedProspects]);

  const currentConfig = SECTOR_CONFIGS[selectedSector];
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://lookprice.net";
  const displayDomain = baseUrl.includes("localhost") || baseUrl.includes("run.app") ? "https://lookprice.net" : baseUrl;

  const webDemoUrl = `${displayDomain}/@${currentConfig.webDemoSlug}`;
  const sectorDemoUrl = `${displayDomain}/@${currentConfig.sectorDemoSlug}`;
  const loginUrl = `${displayDomain}/login`;

  // Generate dynamic agency-grade copy whenever inputs change (unless locked by manual edit)
  const generatedCopy = useMemo(() => {
    const firmTitle = companyName.trim() ? `*${companyName.trim()}*` : "Değerli İşletmemiz";
    const plainFirmTitle = companyName.trim() || "Değerli İşletmemiz";
    const greetingName = contactPerson.trim()
      ? `Sayın ${contactPerson.trim()} (${plainFirmTitle})`
      : `Sayın ${plainFirmTitle} Yönetimi`;
    const branchesText = branchCount.trim() ? `${branchCount.trim()} şubeli` : "çok şubeli";

    const credentialsBlock = includeLoginCredentials
      ? `\n🔐 *Yönetim Panelini Canlı Test Edin:*\n• *Panel Girişi:* ${loginUrl}\n• *Kullanıcı (E-Posta):* ${currentConfig.demoEmail}\n• *Şifre:* ${currentConfig.demoPassword}`
      : "";

    const credentialsEmailBlock = includeLoginCredentials
      ? `\n--------------------------------------------------\nYÖNETİM PANELİNİ CANLI TEST EDİN (DEMO GİRİŞ BİLGİLERİ)\n• Yönetim Paneli Giriş: ${loginUrl}\n• Kullanıcı E-Posta: ${currentConfig.demoEmail}\n• Demo Şifresi: ${currentConfig.demoPassword}\n--------------------------------------------------`
      : "";

    const webLpLine = includeWebLpLink
      ? `🌐 *Kurumsal Web Sitesi Önizleme (@weblp-demo):*\n${webDemoUrl}\n`
      : "";

    const branchShowcaseLine =
      currentConfig.branchDemoSlugs.length > 2
        ? `🏢 *Çok Şubeli Canlı Vitrin Örneklerimiz:*\n• Merkez: ${displayDomain}/@${currentConfig.branchDemoSlugs[0]}\n• Şube 1: ${displayDomain}/@${currentConfig.branchDemoSlugs[1]}\n• Şube 2: ${displayDomain}/@${currentConfig.branchDemoSlugs[2]}\n`
        : `🚀 *Sektörel Canlı Vitrin & E-Mağaza Önizleme (@${currentConfig.sectorDemoSlug}):*\n${sectorDemoUrl}\n`;

    if (selectedChannel === "whatsapp") {
      const subject = `${plainFirmTitle} İçin Kurumsal Web Siteniz & Çok Şubeli Yönetim Paneliniz Hazır!`;
      const body = `Merhaba ${greetingName} 👋

Bölgesel pazar araştırmamızda ${firmTitle} markanızın ${branchesText} güçlü operasyonunu inceledik ve size harika bir haberimiz var:

✨ *"Kurumsal Web Siteniz Hazır!"*
Markanıza özel kişiselleştirebileceğiniz, kendi yönetim paneliyle birlikte kontrol edebileceğiniz modern kurumsal web sitenizi bugün teslim etmeye hazırız.

💡 *Daha fazlasına mı ihtiyacınız var?*
Öyleyse masaüstüne hapsolmuş geleneksel paket yazılımları geride bırakın! Web sitenizle %100 entegre çalışan ve tüm şubelerinizin ihtiyaçlarını tek bulut ekranda toplayan *${currentConfig.productBrand}* ekosistemiyle tanışın:

✅ *${currentConfig.valuePillars[0].title}:* ${currentConfig.valuePillars[0].desc}
✅ *${currentConfig.valuePillars[1].title}:* ${currentConfig.valuePillars[1].desc}
✅ *${currentConfig.valuePillars[2].title}:* ${currentConfig.valuePillars[2].desc}
✅ *${currentConfig.valuePillars[3].title}:* ${currentConfig.valuePillars[3].desc}
✅ *Araç Filosu & Saha Kontrolü:* Şirket araçlarınızın yakıt, bakım, sigorta ve zimmet süreçlerini aynı panelden yönetin.

👇 *Sistemi Hemen Canlı İnceleyin:*
${webLpLine}${branchShowcaseLine}${credentialsBlock}

Size özel hazırladığımız sektörel tanıtım broşürümüzü de ekte paylaşıyorum. Uygun olduğunuzda 10 dakikalık hızlı bir canlı sunum veya kahve ziyareti planlayabilir miyiz?

Saygılarımızla,
*${senderName}*
📞 ${senderPhone}`;

      return { subject, body };
    }

    if (selectedChannel === "instagram") {
      const subject = `Instagram DM Tanıtım Kancası (${plainFirmTitle})`;
      const body = `Merhaba ${plainFirmTitle} ailesi 👋✨

"${plainFirmTitle} Kurumsal Web Siteniz Hazır!" desek? 🚀
Üstelik sadece bir web sitesi değil; geleneksel masaüstü programların aksine ${branchesText} tüm mağazalarınızı cep telefonunuzdan yönetebileceğiniz *${currentConfig.productBrand}* sistemiyle birlikte!

🔹 Tüm şubelerde ortak canlı stok & fiyat kontrolü
🔹 *Google AI Pro* ile ürünlerinizden tek tıkla Instagram Reels videosu ve kampanya afişi üretimi
🔹 Araç filosu, dövizli cari ve şube ciro takibi

🌐 *Kurumsal Web Demo:* ${webDemoUrl}
🛍️ *Sektörel Vitrin Demo:* ${sectorDemoUrl}${
        includeLoginCredentials
          ? `\n🔑 *Panel Giriş (${loginUrl}):* ${currentConfig.demoEmail} | Şifre: ${currentConfig.demoPassword}`
          : ""
      }

Markanıza özel kurguyu 5 dakikada canlı göstermek isteriz. İletişim numaranızı paylaşırsanız hemen detayları iletelim! 🙌`;

      return { subject, body };
    }

    // Email format
    const subject = `${plainFirmTitle}: Kurumsal Web Siteniz Hazır! (+ Çok Şubeli ${currentConfig.productBrand} Dönüşümü)`;
    const body = `${greetingName},

Bölgede ${branchesText} yapısıyla faaliyet gösteren ${plainFirmTitle} işletmenizin dijital görünürlüğünü ve şubeler arası operasyonel gücünü bir üst lige taşıyacak yeni nesil bir çözümle yanınızdayız.

1. ADIM: "KURUMSAL WEB SİTENİZ HAZIR!"
Aylarca süren tasarım süreçleri ve yüksek ajans maliyetleri olmadan; logonuz, kurumsal renkleriniz ve ürün/portföy yapınızla tamamen kişiselleştirebileceğiniz Kurumsal Web Sitenizi yönetim paneliyle birlikte teslim ediyoruz.

2. ADIM: "DAHA FAZLASINA MI İHTİYACINIZ VAR?"
Geleneksel masaüstü yazılımların şubeler arasında yarattığı kopukluğu tamamen ortadan kaldırıyoruz. Web sitenizle aynı anda konuşan ${currentConfig.productBrand} sistemi ile tüm şubelerinizi tek bir bulut merkezden yönetin:

• ${currentConfig.valuePillars[0].title}: ${currentConfig.valuePillars[0].desc}
• ${currentConfig.valuePillars[1].title}: ${currentConfig.valuePillars[1].desc}
• ${currentConfig.valuePillars[2].title}: ${currentConfig.valuePillars[2].desc}
• ${currentConfig.valuePillars[3].title}: ${currentConfig.valuePillars[3].desc}
• ${currentConfig.valuePillars[4].title}: ${currentConfig.valuePillars[4].desc}
• ${currentConfig.valuePillars[5].title}: ${currentConfig.valuePillars[5].desc}

--------------------------------------------------
CANLI ÖNİZLEME VE DEMO LİNKLERİ
${includeWebLpLink ? `• Kurumsal Web Sitesi Önizleme (@weblp-demo): ${webDemoUrl}\n` : ""}• Sektörel Canlı Vitrin (@${currentConfig.sectorDemoSlug}): ${sectorDemoUrl}
--------------------------------------------------${credentialsEmailBlock}

İşletmenize özel hazırladığımız görsel tanıtım broşürünü ekte inceleyebilirsiniz. Bu hafta içinde işletmenizde veya online toplantıda 15 dakikalık canlı bir demo gerçekleştirmekten memnuniyet duyarız.

İyi çalışmalar dileriz,

${senderName}
Telefon / WhatsApp: ${senderPhone}
Web: ${displayDomain}`;

    return { subject, body };
  }, [
    selectedSector,
    selectedChannel,
    companyName,
    contactPerson,
    branchCount,
    senderName,
    senderPhone,
    includeLoginCredentials,
    includeWebLpLink,
    currentConfig,
    webDemoUrl,
    sectorDemoUrl,
    loginUrl,
    displayDomain
  ]);

  useEffect(() => {
    if (!isEditedManually) {
      setCustomSubject(generatedCopy.subject);
      setCustomBody(generatedCopy.body);
    }
  }, [generatedCopy, isEditedManually]);

  const handleResetCopy = () => {
    setIsEditedManually(false);
    setCustomSubject(generatedCopy.subject);
    setCustomBody(generatedCopy.body);
    toast.success("Metin şablonu varsayılan ajans kurgusuna sıfırlandı.");
  };

  const handleCopyText = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`${label} panoya kopyalandı!`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = prospectPhone.replace(/[^0-9]/g, "");
    const encoded = encodeURIComponent(customBody);
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone.startsWith("0") ? "9" + cleanPhone : cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSendEmail = () => {
    const mailto = `mailto:${encodeURIComponent(prospectEmail.trim())}?subject=${encodeURIComponent(
      customSubject
    )}&body=${encodeURIComponent(customBody)}`;
    window.open(mailto, "_blank");
  };

  const handleOpenInstagram = () => {
    navigator.clipboard.writeText(customBody);
    toast.success("DM metni panoya kopyalandı! Instagram profili açılıyor...");
    const cleanHandle = prospectInstagram.replace(/^@/, "").trim();
    const url = cleanHandle ? `https://www.instagram.com/${cleanHandle}/` : "https://www.instagram.com/";
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSaveProspect = () => {
    if (!companyName.trim()) {
      toast.error("Lütfen kaydetmek için en azından Hedef Firma Adı girin.");
      return;
    }
    const newItem: SavedProspect = {
      id: `${Date.now()}`,
      companyName: companyName.trim(),
      contactPerson: contactPerson.trim(),
      branchCount: branchCount.trim() || "2+",
      phone: prospectPhone.trim(),
      email: prospectEmail.trim(),
      instagram: prospectInstagram.trim(),
      sector: selectedSector,
      status: "hazir",
      createdAt: new Date().toLocaleDateString("tr-TR")
    };
    setSavedProspects(prev => [newItem, ...prev]);
    toast.success(`"${companyName.trim()}" potansiyel müşteri listesine eklendi!`);
  };

  const handleLoadProspect = (item: SavedProspect) => {
    setCompanyName(item.companyName);
    setContactPerson(item.contactPerson);
    setBranchCount(item.branchCount);
    setProspectPhone(item.phone);
    setProspectEmail(item.email);
    setProspectInstagram(item.instagram);
    setSelectedSector(item.sector);
    setIsEditedManually(false);
    toast.success(`"${item.companyName}" bilgileri stüdyoya yüklendi.`);
  };

  const handleToggleProspectStatus = (id: string) => {
    setSavedProspects(prev =>
      prev.map(p => {
        if (p.id !== id) return p;
        const nextStatus =
          p.status === "hazir" ? "gonderildi" : p.status === "gonderildi" ? "donus_alindi" : "hazir";
        return { ...p, status: nextStatus };
      })
    );
  };

  const handleDeleteProspect = (id: string) => {
    setSavedProspects(prev => prev.filter(p => p.id !== id));
    toast.success("Kayıt listeden silindi.");
  };

  // High-Resolution Canvas Brochure Generator (1080x1350 Portrait Social/WhatsApp Brochure)
  const handleDownloadBrochurePng = async () => {
    try {
      setIsGeneratingPng(true);
      const canvas = document.createElement("canvas");
      const W = 1080;
      const H = 1350;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");

      // 1. Deep Executive Background Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      bgGrad.addColorStop(0, "#090d16");
      bgGrad.addColorStop(0.5, "#0f172a");
      bgGrad.addColorStop(1, "#050811");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Subtle glowing orb at top right
      const orbGrad = ctx.createRadialGradient(W - 150, 180, 20, W - 150, 180, 420);
      orbGrad.addColorStop(0, `${currentConfig.accentHex}55`);
      orbGrad.addColorStop(1, "transparent");
      ctx.fillStyle = orbGrad;
      ctx.fillRect(0, 0, W, 650);

      // Helper for rounded rectangles
      const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
      };

      // Word wrap helper
      const drawWrappedText = (
        text: string,
        x: number,
        y: number,
        maxWidth: number,
        lineHeight: number,
        maxLines = 3
      ): number => {
        const words = text.split(" ");
        let line = "";
        let currentY = y;
        let linesDrawn = 0;

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + " ";
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && n > 0) {
            linesDrawn++;
            if (linesDrawn >= maxLines) {
              ctx.fillText(line.trim() + "…", x, currentY);
              return currentY + lineHeight;
            }
            ctx.fillText(line.trim(), x, currentY);
            line = words[n] + " ";
            currentY += lineHeight;
          } else {
            line = testLine;
          }
        }
        if (line.trim()) {
          ctx.fillText(line.trim(), x, currentY);
          currentY += lineHeight;
        }
        return currentY;
      };

      // 2. Top Header Bar
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      roundRect(56, 44, W - 112, 78, 22);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Brand Logo Pill
      ctx.fillStyle = currentConfig.accentHex;
      roundRect(76, 60, 195, 46, 12);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 22px Inter, system-ui, sans-serif";
      ctx.fillText("LOOKPRICE", 98, 91);

      // Sector Badge on Right
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "700 18px Inter, system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(currentConfig.badge, W - 80, 90);
      ctx.textAlign = "left";

      // 3. Personalized Prospect Banner (if company name provided)
      const targetFirm = companyName.trim()
        ? `SAYIN ${companyName.trim().toLocaleUpperCase("tr-TR")} YÖNETİMİ İÇİN ÖZEL HAZIRLANMIŞTIR`
        : `ÇOK ŞUBELİ İŞLETMELER İÇİN YENİ NESİL DİJİTAL DÖNÜŞÜM PAKETİ`;

      ctx.fillStyle = `${currentConfig.accentHex}28`;
      roundRect(56, 142, W - 112, 48, 14);
      ctx.fill();
      ctx.strokeStyle = `${currentConfig.accentHex}88`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#fbbf24";
      ctx.font = "800 18px Inter, system-ui, sans-serif";
      ctx.fillText(`★ ${targetFirm}`, 80, 173);

      // 4. Main Headline & Hook
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 40px Inter, system-ui, sans-serif";
      const afterHeadlineY = drawWrappedText(currentConfig.heroHeadline, 56, 242, W - 112, 48, 2);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "600 21px Inter, system-ui, sans-serif";
      const afterSubY = drawWrappedText(currentConfig.heroSubheadline, 56, afterHeadlineY + 12, W - 112, 30, 2);

      // 5. "Step 1 -> Step 2" Conversion Bridge Strip
      const bridgeY = Math.max(afterSubY + 16, 395);
      const bridgeGrad = ctx.createLinearGradient(56, bridgeY, W - 56, bridgeY);
      bridgeGrad.addColorStop(0, currentConfig.accentHex);
      bridgeGrad.addColorStop(1, currentConfig.secondaryHex);
      ctx.fillStyle = bridgeGrad;
      roundRect(56, bridgeY, W - 112, 74, 18);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "900 21px Inter, system-ui, sans-serif";
      ctx.fillText("1. Kurumsal Web Siteniz Hazır!", 82, bridgeY + 32);
      ctx.font = "600 17px Inter, system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.fillText(
        `2. Daha Fazlası: ${branchCount || "2+"} Şubenizin Tamamı, Stok, CRM, AI Video & Araç Filosu Tek Bulutta!`,
        82,
        bridgeY + 58
      );

      // 6. 6 Value Pillar Cards (2 columns x 3 rows)
      const gridStartY = bridgeY + 96;
      const cardW = (W - 112 - 24) / 2;
      const cardH = 185;
      const gapX = 24;
      const gapY = 20;

      currentConfig.valuePillars.slice(0, 6).forEach((pillar, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const cx = 56 + col * (cardW + gapX);
        const cy = gridStartY + row * (cardH + gapY);

        ctx.fillStyle = "rgba(30, 41, 59, 0.78)";
        roundRect(cx, cy, cardW, cardH, 20);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Number badge
        ctx.fillStyle = currentConfig.accentHex;
        roundRect(cx + 22, cy + 20, 42, 34, 10);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "900 18px Inter, system-ui, sans-serif";
        ctx.fillText(`0${idx + 1}`, cx + 32, cy + 43);

        // Pillar Title
        ctx.fillStyle = "#ffffff";
        ctx.font = "800 20px Inter, system-ui, sans-serif";
        drawWrappedText(pillar.title, cx + 76, cy + 42, cardW - 94, 25, 2);

        // Pillar Description
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "500 17px Inter, system-ui, sans-serif";
        drawWrappedText(pillar.desc, cx + 22, cy + 98, cardW - 44, 24, 3);
      });

      // 7. Bottom Demo Links & Contact Footer Box
      const footerY = H - 195;
      ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
      roundRect(56, footerY, W - 112, 150, 24);
      ctx.fill();
      ctx.strokeStyle = currentConfig.accentHex;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#fbbf24";
      ctx.font = "800 18px Inter, system-ui, sans-serif";
      ctx.fillText("CANLI DEMO VİTRİNLERİMİZİ HEMEN İNCELEYİN:", 84, footerY + 38);

      ctx.fillStyle = "#ffffff";
      ctx.font = "700 20px monospace";
      ctx.fillText(`🌐 Kurumsal Web Demo: lookprice.net/@${currentConfig.webDemoSlug}`, 84, footerY + 72);
      ctx.fillText(`🚀 Sektörel Vitrin Demo: lookprice.net/@${currentConfig.sectorDemoSlug}`, 84, footerY + 104);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "600 17px Inter, system-ui, sans-serif";
      ctx.fillText(
        includeLoginCredentials
          ? `🔑 Panel Girişi: lookprice.net/login  |  Kullanıcı: ${currentConfig.demoEmail}  |  Şifre: ${currentConfig.demoPassword}`
          : `📞 İletişim & Canlı Sunum: ${senderName} • ${senderPhone}`,
        84,
        footerY + 134
      );

      const dataUrl = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      const safeFirm = (companyName.trim() || currentConfig.key)
        .replace(/[^a-zA-Z0-9ğüşöçıİĞÜŞÖÇ_-]/g, "_");
      link.download = `LookPrice_Tanitim_Brosuru_${safeFirm}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Yüksek çözünürlüklü Sektörel Tanıtım Broşürü (PNG) indirildi!");
    } catch (err: any) {
      console.error("Brochure generation error:", err);
      toast.error("Görsel oluşturulurken bir hata oluştu.");
    } finally {
      setIsGeneratingPng(false);
    }
  };

  // Printable A4 Executive Brochure Window
  const handlePrintA4Brochure = () => {
    const printWin = window.open("", "_blank", "width=900,height=1100");
    if (!printWin) {
      toast.error("Lütfen tarayıcınızda açılır pencere (pop-up) izni verin.");
      return;
    }

    const firmHeader = companyName.trim()
      ? `Sayın ${companyName.trim()} Yönetimi İçin Özel Dijital Dönüşüm Dosyası`
      : `${currentConfig.name} — Kurumsal Tanıtım Broşürü`;

    const pillarsHtml = currentConfig.valuePillars
      .map(
        (p, i) => `
        <div class="pillar-card">
          <div class="pillar-num">0${i + 1}</div>
          <div class="pillar-title">${p.title}</div>
          <div class="pillar-desc">${p.desc}</div>
        </div>
      `
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <title>${firmHeader}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; }
    body { background: #ffffff; color: #0f172a; padding: 4mm; }
    .page-frame { border: 2px solid #0f172a; border-radius: 14px; padding: 18px 22px; min-height: 268mm; display: flex; flex-direction: column; justify-content: space-between; }
    .top-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
    .brand { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: ${currentConfig.accentHex}; }
    .badge { background: #0f172a; color: #fff; font-size: 11px; font-weight: 800; padding: 5px 12px; border-radius: 99px; letter-spacing: 0.6px; }
    .prospect-banner { margin-top: 12px; background: #f8fafc; border-left: 4px solid ${currentConfig.accentHex}; padding: 8px 12px; font-size: 12px; font-weight: 800; color: #1e293b; }
    .hero { margin-top: 14px; background: #0f172a; color: #ffffff; border-radius: 14px; padding: 20px; }
    .hero h1 { font-size: 22px; font-weight: 900; line-height: 1.25; margin-bottom: 8px; }
    .hero p { font-size: 13px; color: #cbd5e1; line-height: 1.45; }
    .bridge-box { margin-top: 14px; background: ${currentConfig.accentHex}; color: #fff; border-radius: 10px; padding: 12px 16px; }
    .bridge-box h3 { font-size: 14px; font-weight: 900; margin-bottom: 3px; }
    .bridge-box p { font-size: 12px; opacity: 0.95; }
    .section-title { margin-top: 16px; font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; }
    .pillars-grid { margin-top: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .pillar-card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; background: #ffffff; }
    .pillar-num { display: inline-block; background: ${currentConfig.accentHex}; color: #fff; font-size: 10px; font-weight: 900; padding: 2px 7px; border-radius: 5px; margin-bottom: 5px; }
    .pillar-title { font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
    .pillar-desc { font-size: 11.5px; color: #475569; line-height: 1.4; }
    .comparison { margin-top: 14px; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; background: #f8fafc; }
    .comparison h4 { font-size: 12px; font-weight: 900; color: #0f172a; margin-bottom: 6px; }
    .comparison ul { list-style: none; font-size: 11.5px; color: #334155; }
    .comparison li { margin-bottom: 4px; }
    .demo-footer { margin-top: 16px; border: 2px solid ${currentConfig.accentHex}; border-radius: 12px; padding: 14px 16px; background: #f8fafc; display: flex; justify-content: space-between; align-items: center; }
    .demo-links { font-size: 12px; line-height: 1.6; color: #0f172a; }
    .demo-links strong { color: ${currentConfig.accentHex}; }
    .contact-col { text-align: right; font-size: 12px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="page-frame">
    <div>
      <div class="top-bar">
        <div class="brand">LOOKPRICE EKOSİSTEMİ</div>
        <div class="badge">${currentConfig.badge}</div>
      </div>

      <div class="prospect-banner">
        ★ ${firmHeader} (${branchCount || "2+"} Şubeli Operasyon Kurgusu)
      </div>

      <div class="hero">
        <h1>${currentConfig.heroHeadline}</h1>
        <p>${currentConfig.heroSubheadline}</p>
      </div>

      <div class="bridge-box">
        <h3>1. ADIM: Kurumsal Web Siteniz Kişiselleştirilebilir Yönetim Paneliyle Hazır!</h3>
        <p>2. ADIM: Daha fazlasına mı ihtiyacınız var? Geleneksel masaüstü yazılımları bırakın; tüm şubelerinizi, stoklarınızı, sosyal medyanızı ve araç filonuzu tek bulut ekrandan yönetin.</p>
      </div>

      <div class="section-title">Sektörünüze Özel Temel Sistem Yeteneklerimiz</div>
      <div class="pillars-grid">
        ${pillarsHtml}
      </div>

      <div class="comparison">
        <h4>Neden Geleneksel Masaüstü Paket Yazılımlar Yerine LookPrice Bulut Ekosistemi?</h4>
        <ul>
          <li>✔ <strong>Mekan Bağımsız Yönetim:</strong> Sadece mağazadaki bilgisayardan değil; cep telefonunuzdan ve tabletten tüm şubelerinizi canlı izleyin.</li>
          <li>✔ <strong>Web + Mağaza + Sosyal Medya Tek Merkezde:</strong> Ürün veya ilan girdiğinizde kurumsal web sitenizde anında yayınlanır, AI ile Reels videosu üretilir.</li>
          <li>✔ <strong>Sıfır Sunucu & Yedekleme Maliyeti:</strong> Bilgisayar çökmesi veya veri kaybı riski olmadan yüksek güvenlikli bulut altyapısı.</li>
        </ul>
      </div>
    </div>

    <div class="demo-footer">
      <div class="demo-links">
        <div><strong>🌐 Kurumsal Web Demo:</strong> ${webDemoUrl}</div>
        <div><strong>🚀 Sektörel Canlı Vitrin:</strong> ${sectorDemoUrl}</div>
        ${
          includeLoginCredentials
            ? `<div><strong>🔑 Yönetim Paneli (${loginUrl}):</strong> ${currentConfig.demoEmail} &nbsp;|&nbsp; <strong>Şifre:</strong> ${currentConfig.demoPassword}</div>`
            : ""
        }
      </div>
      <div class="contact-col">
        <div style="font-weight:900;font-size:13px;">${senderName}</div>
        <div>İletişim / WhatsApp: <strong>${senderPhone}</strong></div>
        <div style="color:#64748b;font-size:11px;">${displayDomain}</div>
      </div>
    </div>
  </div>
  <script>
    window.onload = function() { setTimeout(function() { window.print(); }, 250); };
  </script>
</body>
</html>`;

    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Top Executive Agency Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              LookPrice B2B Reklam Ajansı & Satış Büyüme Stüdyosu
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              "Kurumsal Web Siteniz Hazır" & Çok Şubeli Dönüşüm Pazarlama Merkezi
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Geleneksel masaüstü yazılım kullanan veya modern web sitesi olmayan çok şubeli potansiyel müşterileriniz için sektöre özel <strong>WhatsApp, Instagram DM ve Kurumsal E-Posta</strong> metinlerini, <strong>canlı demo linklerini (`@weblp-demo`, `@shoplp-demo` vb.)</strong> ve <strong>indirilebilir Görsel Tanıtım Broşürünü</strong> tek ekranda üretin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleDownloadBrochurePng}
              disabled={isGeneratingPng}
              className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              {isGeneratingPng ? "Broşür Hazırlanıyor..." : "Görsel Broşür İndir (PNG)"}
            </button>
            <button
              type="button"
              onClick={handlePrintA4Brochure}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/15 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4 text-indigo-300" />
              A4 PDF Broşür Yazdır
            </button>
          </div>
        </div>
      </div>

      {/* Step 1: Sector Selector Pills */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-500" />
          1. Hedeflenen Potansiyel Müşteri Sektörünü Seçin
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {(
            [
              { key: "shoplp", label: "Perakende & Mağaza", sub: "@shoplp-demo", icon: ShoppingCart },
              { key: "horecalp", label: "Cafe, Restoran & Otel", sub: "@horecalp-demo", icon: Utensils },
              { key: "restatelp", label: "Emlak & Gayrimenkul", sub: "@restatelp-demo", icon: Building2 },
              { key: "autolp", label: "Oto Galeri & Filo", sub: "@autolp-demo", icon: Car },
              { key: "booklp", label: "Kitabevi & Kırtasiye", sub: "@booklp-demo", icon: BookOpen },
              { key: "weblp", label: "Kurumsal Şirket / Web", sub: "@weblp-demo", icon: Briefcase }
            ] as const
          ).map(item => {
            const Icon = item.icon;
            const active = selectedSector === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setSelectedSector(item.key);
                  setIsEditedManually(false);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  active
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md"
                    : "bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Icon className={`w-4 h-4 ${active ? "text-amber-400 dark:text-indigo-600" : "text-indigo-500"}`} />
                  <span className="font-mono text-[10px] opacity-75">{item.sub}</span>
                </div>
                <div className="font-bold text-xs leading-snug">{item.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 12-Col Split Workspace: Left Copy & Personalization (7 cols) | Right Visual Brochure Preview (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Prospect Inputs + Copywriting Studio */}
        <div className="lg:col-span-7 space-y-5">
          {/* Prospect Personalization Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-500" />
                2. Hedef Müşteri & İletişim Kanalı Kişiselleştirme
              </div>
              <button
                type="button"
                onClick={handleSaveProspect}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-100 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Aday Listesine Kaydet
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Hedef Firma / Marka Adı
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => {
                    setCompanyName(e.target.value);
                    setIsEditedManually(false);
                  }}
                  placeholder="Örn: Özmerkez Yapı Market"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Yetkili Kişi (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={e => {
                    setContactPerson(e.target.value);
                    setIsEditedManually(false);
                  }}
                  placeholder="Örn: Ahmet Bey"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Şube Sayısı
                </label>
                <input
                  type="text"
                  value={branchCount}
                  onChange={e => {
                    setBranchCount(e.target.value);
                    setIsEditedManually(false);
                  }}
                  placeholder="Örn: 3"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Müşteri WhatsApp / Mobil
                </label>
                <input
                  type="text"
                  value={prospectPhone}
                  onChange={e => setProspectPhone(e.target.value)}
                  placeholder="Örn: +90 548 8XX XX XX"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Müşteri Instagram Hesabı
                </label>
                <input
                  type="text"
                  value={prospectInstagram}
                  onChange={e => setProspectInstagram(e.target.value)}
                  placeholder="Örn: @ozmerkezmarket"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Müşteri E-Posta Adresi
                </label>
                <input
                  type="email"
                  value={prospectEmail}
                  onChange={e => setProspectEmail(e.target.value)}
                  placeholder="Örn: info@firma.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Gönderici İmza / Ünvan
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={e => {
                    setSenderName(e.target.value);
                    setIsEditedManually(false);
                  }}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Gönderici İletişim Telefonu
                </label>
                <input
                  type="text"
                  value={senderPhone}
                  onChange={e => {
                    setSenderPhone(e.target.value);
                    setIsEditedManually(false);
                  }}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Checkboxes for Links & Credentials */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeWebLpLink}
                  onChange={e => {
                    setIncludeWebLpLink(e.target.checked);
                    setIsEditedManually(false);
                  }}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>`@weblp-demo` Kurumsal Web Linkini Ekle</span>
              </label>

              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeLoginCredentials}
                  onChange={e => {
                    setIncludeLoginCredentials(e.target.checked);
                    setIsEditedManually(false);
                  }}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Yönetim Paneli Demo Giriş Bilgilerini ({currentConfig.demoEmail} / {currentConfig.demoPassword}) Ekle</span>
              </label>
            </div>
          </div>

          {/* Copywriting Channel Tabs & Editor */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedChannel("whatsapp");
                    setIsEditedManually(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    selectedChannel === "whatsapp"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/60"
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  WhatsApp Mesajı
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedChannel("instagram");
                    setIsEditedManually(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    selectedChannel === "instagram"
                      ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/60"
                  }`}
                >
                  <Instagram className="w-3.5 h-3.5" />
                  Instagram DM Kancası
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedChannel("email");
                    setIsEditedManually(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    selectedChannel === "email"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/60"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  Kurumsal E-Posta
                </button>
              </div>

              <div className="flex items-center gap-2">
                {isEditedManually && (
                  <button
                    type="button"
                    onClick={handleResetCopy}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 hover:bg-slate-100 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Şablona Sıfırla
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleCopyText(customBody, "main_body", "Pazarlama metni")}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center gap-1.5 hover:opacity-90 cursor-pointer"
                >
                  {copiedKey === "main_body" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  Metni Kopyala
                </button>
              </div>
            </div>

            {selectedChannel === "email" && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">E-Posta Konu Başlığı (Subject)</label>
                  <button
                    type="button"
                    onClick={() => handleCopyText(customSubject, "email_subj", "E-Posta konusu")}
                    className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" /> Konuyu Kopyala
                  </button>
                </div>
                <input
                  type="text"
                  value={customSubject}
                  onChange={e => {
                    setCustomSubject(e.target.value);
                    setIsEditedManually(true);
                  }}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">
                  Canlı Düzenlenebilir Tanıtım Metni (İstediğiniz Gibi Revize Edebilirsiniz)
                </label>
                <span className="text-[11px] text-slate-400 font-mono">{customBody.length} karakter</span>
              </div>
              <textarea
                rows={15}
                value={customBody}
                onChange={e => {
                  setCustomBody(e.target.value);
                  setIsEditedManually(true);
                }}
                className="w-full p-3.5 text-xs leading-relaxed rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 font-sans focus:ring-2 focus:ring-indigo-500 outline-none resize-y"
              />
            </div>

            {/* Direct Channel Launch Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp ile Doğrudan Gönder
                </button>

                <button
                  type="button"
                  onClick={handleOpenInstagram}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-95 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <Instagram className="w-4 h-4" />
                  Metni Kopyala & Instagram DM Aç
                </button>

                <button
                  type="button"
                  onClick={handleSendEmail}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <Mail className="w-4 h-4" />
                  E-Posta İstemcisinde Aç
                </button>
              </div>
            </div>
          </div>

          {/* Quick Demo Links & Login Credentials Reference Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                {currentConfig.name} — Hızlı Kopyalanabilir Demo Linkleri & Giriş Bilgileri
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-400 font-semibold">Kurumsal Web Sitesi Demo (@weblp-demo)</div>
                  <div className="font-mono text-indigo-300 truncate">{webDemoUrl}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyText(webDemoUrl, "url_web", "@weblp-demo linki")}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                    title="Linki Kopyala"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={`/@${currentConfig.webDemoSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
                    title="Yeni Sekmede Aç"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-400 font-semibold">
                    Sektörel Vitrin Demo (@{currentConfig.sectorDemoSlug})
                  </div>
                  <div className="font-mono text-emerald-300 truncate">{sectorDemoUrl}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyText(sectorDemoUrl, "url_sector", `@${currentConfig.sectorDemoSlug} linki`)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                    title="Linki Kopyala"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={`/@${currentConfig.sectorDemoSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                    title="Yeni Sekmede Aç"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-amber-300 font-bold">Yönetim Paneli Demo Giriş:</span>
                <span className="font-mono bg-black/40 px-2 py-0.5 rounded text-white">
                  E-Posta: {currentConfig.demoEmail}
                </span>
                <span className="font-mono bg-black/40 px-2 py-0.5 rounded text-white">
                  Şifre: {currentConfig.demoPassword}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleCopyText(
                    `Yönetim Paneli: ${loginUrl}\nKullanıcı E-Posta: ${currentConfig.demoEmail}\nŞifre: ${currentConfig.demoPassword}`,
                    "demo_creds",
                    "Demo giriş bilgileri"
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[11px] flex items-center gap-1 cursor-pointer hover:bg-amber-400"
              >
                <Copy className="w-3 h-3" /> Giriş Bilgilerini Kopyala
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Sectoral Visual Brochure Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-950 text-white rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
            {/* Brochure Cover Header */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={currentConfig.coverImage}
                alt={currentConfig.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-55"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

              <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-black text-xs tracking-wider">
                  LOOKPRICE
                </span>
                <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                  {currentConfig.badge}
                </span>
              </div>

              <div className="absolute bottom-3 left-4 right-4">
                <div className="inline-block px-2.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-extrabold uppercase mb-1.5">
                  ★ {companyName.trim() ? `${companyName.trim()} İçin Özel Kurgulanmıştır` : "Çok Şubeli Dijital Dönüşüm Broşürü"}
                </div>
                <h3 className="text-base sm:text-lg font-black leading-tight text-white">
                  {currentConfig.heroHeadline}
                </h3>
              </div>
            </div>

            {/* Brochure Body */}
            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                {currentConfig.heroSubheadline}
              </p>

              {/* 2-Step Hook Banner */}
              <div className={`p-3.5 rounded-2xl bg-gradient-to-r ${currentConfig.gradientClass} border border-white/15 space-y-1`}>
                <div className="text-xs font-black text-amber-300 uppercase">
                  1. ADIM: KURUMSAL WEB SİTENİZ TESLİME HAZIR!
                </div>
                <div className="text-[11px] text-white/95 font-medium leading-snug">
                  <strong>2. ADIM: DAHA FAZLASI MI LAZIM?</strong> Masaüstü yazılımları bırakın;{" "}
                  <strong>{branchCount || "2+"} şubenizin</strong> stok, satış, sosyal medya video ve araç filosunu{" "}
                  <strong>{currentConfig.productBrand}</strong> ile tek ekrandan yönetin!
                </div>
              </div>

              {/* 6 Value Pillars Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentConfig.valuePillars.map((pillar, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold">
                          0{idx + 1}
                        </span>
                        <h4 className="font-bold text-xs text-white leading-tight">{pillar.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">{pillar.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Brochure Footer Demo Box */}
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-indigo-500/40 space-y-1.5 text-xs">
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  CANLI DEMO VİTRİNLERİ & YÖNETİM PANELİ TESTİ
                </div>
                <div className="font-mono text-[11px] text-slate-200 truncate">
                  🌐 Kurumsal Web: <span className="text-indigo-300">lookprice.net/@{currentConfig.webDemoSlug}</span>
                </div>
                <div className="font-mono text-[11px] text-slate-200 truncate">
                  🚀 Sektörel Vitrin: <span className="text-emerald-300">lookprice.net/@{currentConfig.sectorDemoSlug}</span>
                </div>
                {includeLoginCredentials && (
                  <div className="font-mono text-[11px] text-amber-300 pt-1 border-t border-slate-800">
                    🔑 Panel: lookprice.net/login ({currentConfig.demoEmail} / {currentConfig.demoPassword})
                  </div>
                )}
              </div>

              {/* Brochure Download Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadBrochurePng}
                  disabled={isGeneratingPng}
                  className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" />
                  Broşürü İndir (PNG)
                </button>
                <button
                  type="button"
                  onClick={handlePrintA4Brochure}
                  className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Printer className="w-4 h-4" />
                  A4 PDF Broşür
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Prospects Outreach Tracker Table */}
      {savedProspects.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Kaydedilen Potansiyel Müşteri & Saha Pazarlama Takip Listesi ({savedProspects.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="py-2 px-3">Firma & Şube</th>
                  <th className="py-2 px-3">Sektör Paketi</th>
                  <th className="py-2 px-3">İletişim Kanalları</th>
                  <th className="py-2 px-3">Durum</th>
                  <th className="py-2 px-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {savedProspects.map(item => {
                  const sec = SECTOR_CONFIGS[item.sector] || SECTOR_CONFIGS.shoplp;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">{item.companyName}</div>
                        <div className="text-[11px] text-slate-500">
                          {item.contactPerson ? `${item.contactPerson} • ` : ""}
                          {item.branchCount} Şube • {item.createdAt}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px]">
                          {sec.shortTitle}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 space-x-2">
                        {item.phone && <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">📞 {item.phone}</span>}
                        {item.instagram && <span className="font-mono text-[11px] text-pink-600">📸 {item.instagram}</span>}
                        {item.email && <span className="font-mono text-[11px] text-indigo-600">✉️ {item.email}</span>}
                      </td>
                      <td className="py-2.5 px-3">
                        <button
                          type="button"
                          onClick={() => handleToggleProspectStatus(item.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer ${
                            item.status === "donus_alindi"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : item.status === "gonderildi"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {item.status === "donus_alindi"
                            ? "✓ Dönüş Alındı / Demo"
                            : item.status === "gonderildi"
                              ? "⏳ Tanıtım Gönderildi"
                              : "• Gönderime Hazır"}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleLoadProspect(item)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-[11px] cursor-pointer"
                        >
                          Stüdyoya Yükle
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProspect(item.id)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
