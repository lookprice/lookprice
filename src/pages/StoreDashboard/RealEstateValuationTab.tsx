import React, { useState, useEffect, useMemo } from "react";
import {
  FileCheck,
  Plus,
  Search,
  Printer,
  Edit2,
  Trash2,
  Eye,
  Building2,
  MapPin,
  CheckCircle2,
  Clock,
  Share2,
  FileText,
  Calculator,
  Layers,
  ShieldCheck,
  Sparkles,
  X,
  Save,
  Copy
} from "lucide-react";
import { toast } from "sonner";
import { formatPhoneForWhatsApp } from "../../utils/formatUtils";

export interface ValuationComparable {
  id: string;
  nitelik: string;
  brutAlanM2: string;
  yapiYasi: string;
  cephesi: string;
  imarHaklari: string;
  mesafeM: string;
  durum: "Satılık" | "Kiralık" | "Satıldı";
  tarih: string;
  fiyat: number;
  paraBirimi: string;
  m2BirimFiyat: number;
  kaynak: string;
  telefon: string;
}

export interface ValuationReportItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: "taslak" | "tamamlandi" | "teslim_edildi";

  // Danışmanlık Hizmet Bedeli (Gelir Kalemi)
  hizmetBedeli: number;
  hizmetParaBirimi: string;
  tahsilatDurumu: "bekliyor" | "tahsil_edildi";

  // 1. Raporu Hazırlayan Emlak Ofisine Ait Bilgiler
  kurulusAdi: string;
  sozlesmeTarihi: string;
  sozlesmeSayisi: string;
  spkListeTarihi: string;

  // 2. Rapor Bilgileri
  musteriAdi: string;
  musteriTelefon: string;
  raporTarihi: string;
  degerlemeTarihi: string;
  raporNo: string;
  acikAdres: string;
  tasinmazKodu: string;
  kullanimAmaci: "Konut" | "Ticari" | "Sanayi" | "Tarım" | "Diğer";
  kullanimAciklamasi: string;
  konuOzeti: string;

  // 3. Ana Taşınmaz Bilgileri (Tapu Kayıtları)
  ulke: string;
  kaza: string;
  kasabaKoy: string;
  mahalle: string;
  mevki: string;
  kocanNo: string;
  paftaNo: string;
  haritaNo: string;
  adaNo: string;
  parselNo: string;
  donum: string;
  evlek: string;
  ayakkare: string;
  yuzolcumuM2: string;

  // 4. Bağımsız Bölüm Bilgileri
  arsaPayi: string;
  tasinmazSistemNo: string;

  // 5. İncelenen Belgeler
  mimariProjeTarihi: string;
  mimariProjeSayisi: string;
  mimariProjeKurum: string;
  mimariProjeKatSayisi: string;
  yapiRuhsatiTarihi: string;
  yapiRuhsatiSayisi: string;
  yapiRuhsatiKurum: string;
  yapiRuhsatiKatSayisi: string;
  yapiKullanimTarihi: string;
  yapiKullanimSayisi: string;
  yapiKullanimKurum: string;
  yapiKullanimKatSayisi: string;

  // 6. İmar Durumu
  yapiNizami: string;
  taks: string;
  kaksImarOrani: string;
  katAdedi: string;
  lejant: string;
  imarAciklama: string;

  // 7. Yapı Özellikleri
  yapiDurumu: "Var" | "Yok";
  yapiAdedi: string;
  insaatSeviyesi: string;
  yapiMalzemesi: "Betonarme" | "Kargir" | "Ahşap" | "Çelik" | "Diğer";
  yapiYasi: string;
  yapiSinifi: string;
  yapiKatAdedi: string;
  bagimsizBolumSayisi: string;
  isinmaSistemi: "Doğal gaz" | "Kombi" | "Merkezi Sistem" | "Klima" | "Diğer";
  manzara: string;

  // 8. Bağımsız Bölüm Özellikleri
  brutKullanimAlaniM2: string;
  bbInsaatSeviyesi: string;
  cepheSayisi: string;
  baktigiYon: string;
  salonSayisi: string;
  odaSayisi: string;
  banyoWcSayisi: string;
  balkonSayisi: string;
  kilerSayisi: string;
  terasSayisi: string;
  digerBolumler: string;

  // 9. Diğer Özellikler
  siteIci: "Evet" | "Hayır";
  yuzmeHavuzu: "Evet" | "Hayır";
  acikOtopark: "Evet" | "Hayır";
  kapaliOtopark: "Evet" | "Hayır";
  guvenlik: "Evet" | "Hayır";
  asansor: "Evet" | "Hayır";

  // 10. Konum, Ulaşım ve Çevre Yapılaşma Analizi
  konumTipi: "Kent merkezi" | "Kent çeperi" | "Kırsal";
  ekonomikGelisme: "Hızlı" | "Sabit" | "Yavaş";
  arzTalepDengesi: "Hızlı" | "Sabit" | "Yavaş";
  yapilasmaOrani: "%0 - %25" | "%25 - %50" | "%50 - %75" | "%75 - %100";
  dolulukOrani: "%0 - %25" | "%25 - %50" | "%50 - %75" | "%75 - %100";
  ulasimOlanaklari: string;
  depremBolgesi: "1" | "2" | "3" | "4";
  yakinlikKonut: boolean;
  yakinlikRekreasyon: boolean;
  yakinlikKulturel: boolean;
  yakinlikAvmOkulHastane: boolean;
  olumluOzellikler: string;
  olumsuzOzellikler: string;

  // 11. Emsal Analizi & Kroki & Fotoğraflar
  emsaller: ValuationComparable[];
  krokiNotu: string;
  fotograflar: string[];

  // 12. Takyidat Bilgileri
  takyidatDurumu: "Var" | "Yok";
  takyidatEtkisi: string;
  takyidatAciklama: string;

  // 13. Değerlemede Kullanılan Yöntem
  yontemEmsalAciklama: string;
  yontemMaliyetAciklama: string;
  yontemGelirAciklama: string;

  // 14. Değer Hesabı, Uzlaştırma ve İmzalar
  paraBirimi: "GBP" | "USD" | "EUR" | "TRY";
  arsaPazarDegeri: number;
  arsaDegerNotu: string;
  yapiPazarDegeri: number;
  yapiDegerNotu: string;
  emlakDegeriYil: number;
  yasalDurumDegeri: number;
  mevcutDurumDegeri: number;
  tcmbKurUsd: number;
  tcmbKurGbp: number;
  degerlemeUzmani: string;
  degerlemeUzmaniLisansNo: string;
  sorumluUzman: string;
  sorumluUzmanLisansNo: string;
}

interface RealEstateValuationTabProps {
  storeId: string | number;
  branding: any;
  properties?: any[];
  onSaveBranding?: (updated?: any) => void;
}

const formatNumberInput = (val: number | string | undefined): string => {
  if (val === undefined || val === null || val === "") return "";
  const digits = String(val).replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("tr-TR");
};

const parseFormattedNumber = (raw: string): number => {
  const digits = String(raw || "").replace(/\D/g, "");
  return digits ? Number(digits) : 0;
};

export const amountToReadableTurkishWords = (amount: number, currency: string = "GBP"): string => {
  const num = Math.floor(Math.abs(Number(amount) || 0));
  if (num === 0) return "Sıfır";

  const units = ["", "Bir", "İki", "Üç", "Dört", "Beş", "Altı", "Yedi", "Sekiz", "Dokuz"];
  const tens = ["", "On", "Yirmi", "Otuz", "Kırk", "Elli", "Altmış", "Yetmiş", "Seksen", "Doksan"];
  const scales = ["", "Bin", "Milyon", "Milyar", "Trilyon"];

  const threeDigitsToWords = (n: number): string[] => {
    const words: string[] = [];
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;

    if (h > 0) {
      if (h > 1) words.push(units[h]);
      words.push("Yüz");
    }
    if (t > 0) words.push(tens[t]);
    if (u > 0) words.push(units[u]);
    return words;
  };

  let temp = num;
  let scaleIdx = 0;
  const parts: string[] = [];

  while (temp > 0) {
    const chunk = temp % 1000;
    if (chunk > 0) {
      const chunkWords = threeDigitsToWords(chunk);
      if (scaleIdx === 1 && chunk === 1) {
        parts.unshift("Bin");
      } else {
        if (scales[scaleIdx]) chunkWords.push(scales[scaleIdx]);
        parts.unshift(chunkWords.join(" "));
      }
    }
    temp = Math.floor(temp / 1000);
    scaleIdx++;
  }

  const currencyLabelMap: Record<string, string> = {
    GBP: "İngiliz Sterlini",
    STG: "İngiliz Sterlini",
    USD: "Amerikan Doları",
    EUR: "Euro",
    TRY: "Türk Lirası",
    TL: "Türk Lirası"
  };

  const currencyName = currencyLabelMap[currency.toUpperCase()] || currency;
  return `${parts.join(" ")} ${currencyName}`;
};

const formatLongTurkishDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const months = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];
  if (dateStr.includes("-")) {
    const [y, m, d] = dateStr.split("-");
    const mIdx = parseInt(m, 10) - 1;
    if (mIdx >= 0 && mIdx < 12) return `${d} ${months[mIdx]} ${y}`;
  }
  if (dateStr.includes(".")) {
    const [d, m, y] = dateStr.split(".");
    const mIdx = parseInt(m, 10) - 1;
    if (mIdx >= 0 && mIdx < 12) return `${d} ${months[mIdx]} ${y}`;
  }
  return dateStr;
};

const formatDotDate = (dateStr: string): string => {
  if (!dateStr) return "";
  if (dateStr.includes("-")) {
    const [y, m, d] = dateStr.split("-");
    return `${d}.${m}.${y}`;
  }
  return dateStr;
};

const createSampleOrtakoyReport = (storeName: string): ValuationReportItem => {
  const resolvedStore = storeName && !/^lookprice$/i.test(storeName.trim()) ? storeName.trim() : "Rodel Investment";
  return {
    id: "val_2024_rodel_380",
    createdAt: "2024-02-06T10:00:00.000Z",
    updatedAt: "2024-02-06T10:00:00.000Z",
    status: "tamamlandi",
    hizmetBedeli: 750,
    hizmetParaBirimi: "GBP",
    tahsilatDurumu: "tahsil_edildi",

    // 1. Ofis Bilgileri
    kurulusAdi: resolvedStore,
    sozlesmeTarihi: "2024-02-05",
    sozlesmeSayisi: "2024/DEĞ-380",
    spkListeTarihi: "12.04.2019",

    // 2. Rapor Bilgileri
    musteriAdi: "Gonce Avaş",
    musteriTelefon: "+90 548 890 23 09",
    raporTarihi: "2024-02-06",
    degerlemeTarihi: "2024-02-06",
    raporNo: "2024_RODEL_380",
    acikAdres: "YZB. TEKİN YURDABAK CADDESİ ORTAKÖY/LEFKOŞA",
    tasinmazKodu: "ORT-380",
    kullanimAmaci: "Ticari",
    kullanimAciklamasi: "Boş arsa ve ayrıca üstündeki yapı ayrı ayrı olarak değerlendirildi.",
    konuOzeti: "KKTC, LEFKOŞA İlçesi, ORTAKÖY sınırlarında KÖY YANI Mevkiinde yer alan 1 Adet Arsa’nın ve üstündeki yapının Pazar Değeri Tespiti.",

    // 3. Ana Taşınmaz Bilgileri
    ulke: "KKTC",
    kaza: "Lefkoşa",
    kasabaKoy: "Lefkoşa",
    mahalle: "Ortaköy",
    mevki: "Köy Yanı",
    kocanNo: "K-4821",
    paftaNo: "XXI",
    haritaNo: "21.14.W",
    adaNo: "14",
    parselNo: "288",
    donum: "1",
    evlek: "1",
    ayakkare: "2700",
    yuzolcumuM2: "1923",

    // 4. Bağımsız Bölüm
    arsaPayi: "Tam",
    tasinmazSistemNo: "KKTC-LFK-380",

    // 5. İncelenen Belgeler
    mimariProjeTarihi: "14.06.2018",
    mimariProjeSayisi: "MP-2018/412",
    mimariProjeKurum: "Lefkoşa Türk Belediyesi",
    mimariProjeKatSayisi: "2",
    yapiRuhsatiTarihi: "20.08.2018",
    yapiRuhsatiSayisi: "YR-2018/109",
    yapiRuhsatiKurum: "Lefkoşa Türk Belediyesi",
    yapiRuhsatiKatSayisi: "2",
    yapiKullanimTarihi: "10.11.2020",
    yapiKullanimSayisi: "YK-2020/88",
    yapiKullanimKurum: "Lefkoşa Türk Belediyesi",
    yapiKullanimKatSayisi: "2",

    // 6. İmar Durumu
    yapiNizami: "Ayrık Nizam",
    taks: "0.35",
    kaksImarOrani: "%160",
    katAdedi: "5 Kat",
    lejant: "Konut + Ticari",
    imarAciklama: "Değerlemeye konu Arsanın imarı : • %160 • 5 Kat • Konut + Ticari",

    // 7. Yapı Özellikleri
    yapiDurumu: "Var",
    yapiAdedi: "1",
    insaatSeviyesi: "%100",
    yapiMalzemesi: "Betonarme",
    yapiYasi: "6",
    yapiSinifi: "3B",
    yapiKatAdedi: "2",
    bagimsizBolumSayisi: "1",
    isinmaSistemi: "Klima",
    manzara: "Şehir",

    // 8. Bağımsız Bölüm Özellikleri
    brutKullanimAlaniM2: "340",
    bbInsaatSeviyesi: "%100",
    cepheSayisi: "3",
    baktigiYon: "K / G / D",
    salonSayisi: "1",
    odaSayisi: "4",
    banyoWcSayisi: "2",
    balkonSayisi: "2",
    kilerSayisi: "1",
    terasSayisi: "1",
    digerBolumler: "Bahçe ve Açık Otopark Alanı",

    // 9. Diğer Özellikler
    siteIci: "Hayır",
    yuzmeHavuzu: "Hayır",
    acikOtopark: "Evet",
    kapaliOtopark: "Hayır",
    guvenlik: "Hayır",
    asansor: "Hayır",

    // 10. Konum ve Çevre
    konumTipi: "Kent merkezi",
    ekonomikGelisme: "Hızlı",
    arzTalepDengesi: "Hızlı",
    yapilasmaOrani: "%75 - %100",
    dolulukOrani: "%75 - %100",
    ulasimOlanaklari: "Ana arter üzerinde, toplu taşıma ve özel araç ile ulaşım çok kolay.",
    depremBolgesi: "2",
    yakinlikKonut: true,
    yakinlikRekreasyon: true,
    yakinlikKulturel: true,
    yakinlikAvmOkulHastane: true,
    olumluOzellikler: "Ortaköy merkezi konum, %160 5 Kat Konut+Ticari yüksek imar hakkı, ana cadde yakınlığı.",
    olumsuzOzellikler: "Parsel geometrisinde kısmi şekilsizlik mevcuttur.",

    // 11. Emsaller
    emsaller: [
      {
        id: "ems_1",
        nitelik: "Ticari + Konut İmarlı Arsa",
        brutAlanM2: "1.650",
        yapiYasi: "-",
        cephesi: "Güney-Doğu",
        imarHaklari: "%160 / 5 Kat",
        mesafeM: "250 m",
        durum: "Satılık",
        tarih: "01.02.2024",
        fiyat: 385000,
        paraBirimi: "GBP",
        m2BirimFiyat: 233,
        kaynak: "Bölge Emlak Ofisi",
        telefon: "+90 533 800 10 20"
      },
      {
        id: "ems_2",
        nitelik: "Arsa + Müstakil Bina",
        brutAlanM2: "2.050",
        yapiYasi: "8",
        cephesi: "Kuzey-Batı",
        imarHaklari: "%160 / 5 Kat",
        mesafeM: "400 m",
        durum: "Satılık",
        tarih: "25.01.2024",
        fiyat: 640000,
        paraBirimi: "GBP",
        m2BirimFiyat: 312,
        kaynak: "Sahibinden / Portföy",
        telefon: "+90 542 850 30 40"
      },
      {
        id: "ems_3",
        nitelik: "Ticari İmarlı Parsel",
        brutAlanM2: "1.338",
        yapiYasi: "-",
        cephesi: "Doğu",
        imarHaklari: "%160 / 5 Kat",
        mesafeM: "320 m",
        durum: "Satıldı",
        tarih: "15.01.2024",
        fiyat: 310000,
        paraBirimi: "GBP",
        m2BirimFiyat: 231,
        kaynak: "Tapu / Bölge Araştırması",
        telefon: "+90 548 860 50 60"
      }
    ],
    krokiNotu: "Emsal 1 konu taşınmazın 250m güneyinde, Emsal 2 400m kuzeybatısında, Emsal 3 ise 320m doğusunda Yzb. Tekin Yurdabak Caddesi aksında yer almaktadır.",
    fotograflar: [],

    // 12. Takyidat
    takyidatDurumu: "Yok",
    takyidatEtkisi: "Değeri olumsuz etkileyen herhangi bir şerh veya ipotek bulunmamaktadır.",
    takyidatAciklama: "Tapu kaydında satışı engelleyici kısıtlama tespit edilmemiştir.",

    // 13. Yöntem
    yontemEmsalAciklama: "Bölgedeki benzer imar haklarına (%160, 5 Kat, Konut+Ticari) sahip arsa ve yapılı taşınmaz satışları karşılaştırılarak şerefiyelendirme yapılmıştır.",
    yontemMaliyetAciklama: "Arazi üzerindeki mevcut betonarme yapının yeniden inşa maliyeti üzerinden yıpranma payı düşülerek yapı değeri hesaplanmıştır.",
    yontemGelirAciklama: "Bölgedeki ticari ve konut kira çarpanları kontrol amaçlı dikkate alınmıştır.",

    // 14. Değer Hesabı & Uzlaştırma
    paraBirimi: "GBP",
    arsaPazarDegeri: 400000,
    arsaDegerNotu: "Gayrimenkulün şekilsizliği göz önünde bulundurulmuştur.",
    yapiPazarDegeri: 200000,
    yapiDegerNotu: "Arazi üstündeki kapalı alan ayrıca değerlendirilmiştir.",
    emlakDegeriYil: 540000,
    yasalDurumDegeri: 600000,
    mevcutDurumDegeri: 600000,
    tcmbKurUsd: 30.5,
    tcmbKurGbp: 38.6,
    degerlemeUzmani: "Emrah CEYHAN",
    degerlemeUzmaniLisansNo: "SPK-DEĞ-4092",
    sorumluUzman: "Sercan GÖRGÜNER",
    sorumluUzmanLisansNo: "SPK-SDU-1184"
  };
};

export const RealEstateValuationTab: React.FC<RealEstateValuationTabProps> = ({
  storeId,
  branding,
  properties = [],
  onSaveBranding
}) => {
  const resolvedStoreName = useMemo(() => {
    const raw = branding?.store_name || branding?.name || "";
    if (raw && !/^lookprice$/i.test(raw.trim())) return raw.trim();
    return "Seçkin Emlak";
  }, [branding]);

  const storageKey = `re_valuation_reports_${storeId || "default"}`;

  const [reports, setReports] = useState<ValuationReportItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      if (Array.isArray(branding?.valuation_reports) && branding.valuation_reports.length > 0) {
        return branding.valuation_reports;
      }
    } catch {
      // ignore
    }
    return [createSampleOrtakoyReport(resolvedStoreName)];
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "taslak" | "tamamlandi" | "teslim_edildi">("all");
  const [editingReport, setEditingReport] = useState<ValuationReportItem | null>(null);
  const [activeFormStep, setActiveFormStep] = useState<number>(1);
  const [previewReport, setPreviewReport] = useState<ValuationReportItem | null>(null);
  const [previewMode, setPreviewMode] = useState<"bildirim" | "teknik" | "tam">("tam");

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(reports));
    } catch {
      // ignore
    }
  }, [reports, storageKey]);

  const saveReportsList = (nextReports: ValuationReportItem[]) => {
    setReports(nextReports);
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextReports));
    } catch {
      // ignore
    }
    if (onSaveBranding && branding) {
      onSaveBranding({ ...branding, valuation_reports: nextReports });
    }
  };

  const handleCreateNewReport = () => {
    const todayIso = new Date().toISOString().split("T")[0];
    const year = new Date().getFullYear();
    const randomNum = Math.floor(100 + Math.random() * 900);
    const prefix = resolvedStoreName.split(" ")[0].toUpperCase().replace(/[^A-Z0-9]/g, "") || "EMLAK";

    const newItem: ValuationReportItem = {
      ...createSampleOrtakoyReport(resolvedStoreName),
      id: `val_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "taslak",
      hizmetBedeli: 500,
      hizmetParaBirimi: "GBP",
      tahsilatDurumu: "bekliyor",
      kurulusAdi: resolvedStoreName,
      sozlesmeTarihi: todayIso,
      sozlesmeSayisi: `${year}/DEĞ-${randomNum}`,
      musteriAdi: "",
      musteriTelefon: "",
      raporTarihi: todayIso,
      degerlemeTarihi: todayIso,
      raporNo: `${year}_${prefix}_${randomNum}`,
      acikAdres: "",
      tasinmazKodu: `TSN-${randomNum}`,
      konuOzeti: "",
      kaza: "Lefkoşa",
      kasabaKoy: "",
      mahalle: "",
      mevki: "",
      kocanNo: "",
      paftaNo: "",
      haritaNo: "",
      adaNo: "",
      parselNo: "",
      donum: "0",
      evlek: "0",
      ayakkare: "0",
      yuzolcumuM2: "",
      arsaPazarDegeri: 0,
      yapiPazarDegeri: 0,
      yasalDurumDegeri: 0,
      mevcutDurumDegeri: 0
    };
    setEditingReport(newItem);
    setActiveFormStep(1);
  };

  const handleFillFromPortfolio = (propId: string) => {
    if (!editingReport || !propId) return;
    const found = properties.find((p: any) => String(p.id) === String(propId));
    if (!found) return;
    const specs = found.real_estate_specs || {};
    const arsaVal = Number(found.price) || 0;
    setEditingReport({
      ...editingReport,
      acikAdres: found.location || specs.address || editingReport.acikAdres,
      tasinmazKodu: found.reference_code || `REF-${found.id}`,
      kaza: specs.city || specs.district || editingReport.kaza,
      mahalle: specs.neighborhood || editingReport.mahalle,
      kocanNo: specs.title_deed_no || editingReport.kocanNo,
      paftaNo: specs.sheet_no || editingReport.paftaNo,
      haritaNo: specs.map_no || editingReport.haritaNo,
      parselNo: specs.parcel_no || editingReport.parselNo,
      yuzolcumuM2: String(specs.area_m2 || specs.gross_m2 || editingReport.yuzolcumuM2 || ""),
      brutKullanimAlaniM2: String(specs.area_m2 || editingReport.brutKullanimAlaniM2 || ""),
      kaksImarOrani: specs.zoning_rate || editingReport.kaksImarOrani,
      katAdedi: specs.max_floors ? `${specs.max_floors} Kat` : editingReport.katAdedi,
      paraBirimi: (found.currency || "GBP") as any,
      arsaPazarDegeri: arsaVal,
      yasalDurumDegeri: arsaVal + (editingReport.yapiPazarDegeri || 0),
      mevcutDurumDegeri: arsaVal + (editingReport.yapiPazarDegeri || 0)
    });
    toast.success("Portföy verileri aktarıldı");
  };

  const handleSaveReport = () => {
    if (!editingReport) return;
    if (!editingReport.musteriAdi.trim()) {
      toast.error("Lütfen raporu talep eden müşteri adını girin");
      setActiveFormStep(1);
      return;
    }

    const totalVal = (Number(editingReport.arsaPazarDegeri) || 0) + (Number(editingReport.yapiPazarDegeri) || 0);
    const autoKonu =
      editingReport.konuOzeti?.trim() ||
      `${editingReport.ulke || "KKTC"}, ${(editingReport.kaza || "").toUpperCase()} İlçesi, ${(editingReport.mahalle || "").toUpperCase()} sınırlarında ${(editingReport.mevki || "").toUpperCase()} Mevkiinde yer alan 1 Adet Arsa’nın${editingReport.yapiDurumu === "Var" ? " ve üstündeki yapının" : ""} Pazar Değeri Tespiti.`;

    const autoImar =
      editingReport.imarAciklama?.trim() ||
      `Değerlemeye konu Arsanın imarı : • ${editingReport.kaksImarOrani || "%100"} • ${editingReport.katAdedi || "2 Kat"} • ${editingReport.lejant || "Konut"}`;

    const finalized: ValuationReportItem = {
      ...editingReport,
      konuOzeti: autoKonu,
      imarAciklama: autoImar,
      yasalDurumDegeri: editingReport.yasalDurumDegeri || totalVal,
      mevcutDurumDegeri: editingReport.mevcutDurumDegeri || totalVal,
      updatedAt: new Date().toISOString()
    };

    const exists = reports.some(r => r.id === finalized.id);
    const nextList = exists
      ? reports.map(r => (r.id === finalized.id ? finalized : r))
      : [finalized, ...reports];

    saveReportsList(nextList);
    setEditingReport(null);
    toast.success("Değerleme raporu kaydedildi");
  };

  const handleDeleteReport = (id: string) => {
    const next = reports.filter(r => r.id !== id);
    saveReportsList(next);
    toast.success("Rapor silindi");
  };

  const handleSendWhatsApp = (rep: ValuationReportItem) => {
    const totalVal = (Number(rep.arsaPazarDegeri) || 0) + (Number(rep.yapiPazarDegeri) || 0);
    const text = [
      `*GAYRİMENKUL DEĞERLEME BİLDİRİM FORMU*`,
      `*Rapor No:* ${rep.raporNo} (${formatDotDate(rep.raporTarihi)})`,
      `*Sayın:* ${rep.musteriAdi}`,
      `*Konu:* ${rep.konuOzeti}`,
      `*Açık Adres:* ${rep.acikAdres}`,
      `*Tapu Kaydı:* Kaza: ${rep.kaza} - Mahalle: ${rep.mahalle} - Mevki: ${rep.mevki} (${rep.donum} Dönüm, ${rep.evlek} Evlek, ${rep.ayakkare} Ayakkare)`,
      `*İmar Durumu:* ${rep.kaksImarOrani} • ${rep.katAdedi} • ${rep.lejant}`,
      `*Arsa Pazar Değeri:* ${rep.arsaPazarDegeri.toLocaleString("tr-TR")} ${rep.paraBirimi} (${amountToReadableTurkishWords(rep.arsaPazarDegeri, rep.paraBirimi)})`,
      rep.yapiDurumu === "Var" && rep.yapiPazarDegeri > 0
        ? `*Yapı Pazar Değeri:* ${rep.yapiPazarDegeri.toLocaleString("tr-TR")} ${rep.paraBirimi} (${amountToReadableTurkishWords(rep.yapiPazarDegeri, rep.paraBirimi)})`
        : null,
      `*TOPLAM PAZAR DEĞERİ:* ${totalVal.toLocaleString("tr-TR")} ${rep.paraBirimi}`,
      ``,
      `Saygılarımızla,`,
      `*${rep.kurulusAdi}* - ${rep.degerlemeUzmani}`
    ]
      .filter(Boolean)
      .join("\n");

    const cleanPhone = formatPhoneForWhatsApp(rep.musteriTelefon || "");
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;

    navigator.clipboard?.writeText(text).catch(() => {});
    toast.success("Değerleme özeti panoya kopyalandı, WhatsApp açılıyor...");
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  };

  const handlePrintValuation = (rep: ValuationReportItem, mode: "bildirim" | "teknik" | "tam") => {
    const totalVal = (Number(rep.arsaPazarDegeri) || 0) + (Number(rep.yapiPazarDegeri) || 0);
    const arsaWords = amountToReadableTurkishWords(rep.arsaPazarDegeri, rep.paraBirimi);
    const yapiWords = amountToReadableTurkishWords(rep.yapiPazarDegeri, rep.paraBirimi);
    const totalWords = amountToReadableTurkishWords(totalVal, rep.paraBirimi);

    const tlRate = rep.paraBirimi === "GBP" ? (rep.tcmbKurGbp || 38.6) : rep.paraBirimi === "USD" ? (rep.tcmbKurUsd || 30.5) : 1;
    const usdRate = rep.tcmbKurUsd || 30.5;
    const gbpRate = rep.tcmbKurGbp || 38.6;

    const toTL = (v: number) => Math.round(v * tlRate).toLocaleString("tr-TR");
    const toUSD = (v: number) => Math.round((v * tlRate) / usdRate).toLocaleString("tr-TR");
    const toGBP = (v: number) => Math.round((v * tlRate) / gbpRate).toLocaleString("tr-TR");

    const bildirimHtml = `
      <div class="page-sheet">
        <div class="doc-header">
          <div>
            <div class="brand-name">${rep.kurulusAdi}</div>
            <div class="doc-sub">GAYRİMENKUL DEĞERLEME BİLDİRİM FORMU</div>
          </div>
          <div class="doc-meta">
            <div><strong>Tarih:</strong> ${formatLongTurkishDate(rep.raporTarihi)}</div>
            <div><strong>Rapor No:</strong> ${rep.raporNo}</div>
          </div>
        </div>

        <div class="section-banner">GAYRİMENKULÜN TANIMI</div>
        <div class="subject-box">
          <strong>Konu:</strong> ${rep.konuOzeti || `${rep.ulke}, ${rep.kaza} İlçesi, ${rep.mahalle} sınırlarında ${rep.mevki} Mevkiinde yer alan 1 Adet Arsa’nın ve üstündeki yapının Pazar Değeri Tespiti.`}
        </div>

        <div class="letter-body">
          <p><strong>Sayın; ${rep.musteriAdi},</strong></p>
          <p>Talebiniz doğrultusunda konu gayrimenkul için hazırlamış olduğumuz, <strong>“Pazar Değeri Tespiti”</strong> çalışmamızı ekte bilgilerinize sunuyoruz.</p>
          <p>Gayrimenkulü ve çevre özelliklerini yerinde inceledikten sonra konu gayrimenkullerin bölgedeki konumunu da dikkate alarak çalışmalarımız tamamlanmıştır.</p>
          <p>Ekteki rapor; gayrimenkulle ilgili kısıtlamaları, gayrimenkulün fiziki ve hukuki tanımlarını, imar durumunu ve lokasyon bilgilerini, bölge ve çevre ile ilgili önemli bilgileri, çevre gelişimlerini ve gayrimenkullerin pazar koşullarını kapsamaktadır.</p>
          <p>Konu gayrimenkul ile maddi herhangi bir ilişkimiz olmadığını sonuçlarla bağlantısı olmadığını belirtiriz.</p>
          <p style="margin-top:10px;">Saygılarımızla,</p>
          <div class="letter-sign">
            <div><strong>${rep.kurulusAdi}</strong></div>
            <div>${rep.degerlemeUzmani}</div>
          </div>
        </div>

        <div class="section-banner" style="margin-top:14px;">YÖNETİCİ ÖZETİ</div>
        <table class="summary-table">
          <tbody>
            <tr>
              <th>Rapor Tarihi ve Numarası</th>
              <td>${formatDotDate(rep.raporTarihi)} / ${rep.raporNo}</td>
            </tr>
            <tr>
              <th>Raporu Talep Eden</th>
              <td><strong>${rep.musteriAdi}</strong></td>
            </tr>
            <tr>
              <th>Değerleme Tarihi</th>
              <td>${formatDotDate(rep.degerlemeTarihi)}</td>
            </tr>
            <tr>
              <th>Gayrimenkullerin Açık Adresi</th>
              <td>${rep.acikAdres}</td>
            </tr>
            <tr>
              <th>Gayrimenkullerin Kullanımı</th>
              <td>${rep.kullanimAciklamasi}</td>
            </tr>
            <tr>
              <th>Tapu Kayıtları</th>
              <td>
                <strong>Kaza:</strong> ${rep.kaza} – <strong>Kasaba/Köy:</strong> ${rep.kasabaKoy || rep.kaza} &nbsp;|&nbsp;
                <strong>Mahalle:</strong> ${rep.mahalle} &nbsp;|&nbsp; <strong>Mevki:</strong> ${rep.mevki}<br/>
                <strong>Koçan No:</strong> ${rep.kocanNo || "-"} &nbsp;|&nbsp; <strong>Pafta/Harita:</strong> ${rep.paftaNo || "-"}/${rep.haritaNo || "-"} &nbsp;|&nbsp; <strong>Ada/Parsel:</strong> ${rep.adaNo || "-"}/${rep.parselNo || "-"}<br/>
                <strong>Yüz Ölçümü:</strong> ${rep.donum || "0"} Dönüm, ${rep.evlek || "0"} Evlek, ${rep.ayakkare || "0"} Ayakkare ${rep.yuzolcumuM2 ? `(${rep.yuzolcumuM2} m²)` : ""}
              </td>
            </tr>
            <tr>
              <th>İmar Durumu</th>
              <td>
                Değerlemeye konu Arsanın imarı :<br/>
                • <strong>${rep.kaksImarOrani}</strong> &nbsp; • <strong>${rep.katAdedi}</strong> &nbsp; • <strong>${rep.lejant}</strong>
              </td>
            </tr>
            <tr class="val-highlight">
              <th>Pazar Değeri (Arsa)<br/><span style="font-weight:normal;font-size:10px;">(KDV dahil fiyatı)<br/>${rep.arsaDegerNotu || ""}</span></th>
              <td>
                <div class="price-big">${(rep.arsaPazarDegeri || 0).toLocaleString("tr-TR")} ${rep.paraBirimi}</div>
                <div class="price-words">(${arsaWords})</div>
              </td>
            </tr>
            ${
              rep.yapiDurumu === "Var" || rep.yapiPazarDegeri > 0
                ? `<tr class="val-highlight">
                    <th>Pazar Değeri (Yapı)<br/><span style="font-weight:normal;font-size:10px;">(${rep.yapiDegerNotu || "Arazi üstündeki kapalı alan değerlendirilmesi"})</span></th>
                    <td>
                      <div class="price-big">${(rep.yapiPazarDegeri || 0).toLocaleString("tr-TR")} ${rep.paraBirimi}</div>
                      <div class="price-words">(${yapiWords})</div>
                    </td>
                  </tr>`
                : ""
            }
            <tr class="val-total">
              <th>TOPLAM PAZAR DEĞERİ</th>
              <td>
                <div class="price-big">${totalVal.toLocaleString("tr-TR")} ${rep.paraBirimi}</div>
                <div class="price-words">(${totalWords})</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    const teknikHtml = `
      <div class="page-sheet ${mode === "tam" ? "page-break" : ""}">
        <div class="doc-header">
          <div>
            <div class="brand-name">${rep.kurulusAdi}</div>
            <div class="doc-sub">TAŞINMAZ DEĞERLEME RAPORU (TEKNİK EK)</div>
          </div>
          <div class="doc-meta">
            <div><strong>Rapor No:</strong> ${rep.raporNo}</div>
            <div><strong>Değerleme Tarihi:</strong> ${formatDotDate(rep.degerlemeTarihi)}</div>
          </div>
        </div>

        <div class="tech-grid-2">
          <div>
            <div class="tech-sec-title">1. RAPORU HAZIRLAYAN EMLAK OFİSİ BİLGİLERİ</div>
            <table class="tech-table">
              <tr><th>Kuruluş Adı</th><td>${rep.kurulusAdi}</td></tr>
              <tr><th>Dayanak Sözleşme</th><td>${formatDotDate(rep.sozlesmeTarihi)} / ${rep.sozlesmeSayisi}</td></tr>
              <tr><th>Yetki / Liste Tarihi</th><td>${rep.spkListeTarihi || "-"}</td></tr>
            </table>
          </div>
          <div>
            <div class="tech-sec-title">2. RAPOR BİLGİLERİ</div>
            <table class="tech-table">
              <tr><th>Müşteri Bilgileri</th><td>${rep.musteriAdi} (${rep.musteriTelefon || "-"})</td></tr>
              <tr><th>Rapor & Değerleme Tarihi</th><td>${formatDotDate(rep.raporTarihi)} / ${formatDotDate(rep.degerlemeTarihi)}</td></tr>
              <tr><th>Taşınmaz Kodu & Kullanım</th><td>${rep.tasinmazKodu} — ${rep.kullanimAmaci}</td></tr>
            </table>
          </div>
        </div>

        <div class="tech-sec-title">3. ANA TAŞINMAZ & 4. BAĞIMSIZ BÖLÜM BİLGİLERİ</div>
        <table class="tech-table">
          <tr>
            <th>Kaza / Kasaba / Mahalle / Mevki</th>
            <td>${rep.kaza} / ${rep.kasabaKoy || rep.kaza} / ${rep.mahalle} / ${rep.mevki}</td>
            <th>Koçan / Pafta / Harita</th>
            <td>${rep.kocanNo || "-"} / ${rep.paftaNo || "-"} / ${rep.haritaNo || "-"}</td>
          </tr>
          <tr>
            <th>Ada / Parsel No</th>
            <td>${rep.adaNo || "-"} / ${rep.parselNo || "-"}</td>
            <th>Yüz Ölçümü</th>
            <td>${rep.donum} Dönüm, ${rep.evlek} Evlek, ${rep.ayakkare} a² (${rep.yuzolcumuM2 || "-"} m²)</td>
          </tr>
          <tr>
            <th>Arsa Payı & Sistem No</th>
            <td>${rep.arsaPayi || "Tam"} / ${rep.tasinmazSistemNo || "-"}</td>
            <th>Açık Adres</th>
            <td>${rep.acikAdres}</td>
          </tr>
        </table>

        <div class="tech-sec-title">5. İNCELENEN BELGELER & 6. İMAR DURUMU</div>
        <table class="tech-table">
          <tr>
            <th>Belge Türü</th>
            <th>Tarihi</th>
            <th>Sayısı</th>
            <th>İncelendiği Kurum</th>
            <th>Kat Sayısı</th>
          </tr>
          <tr>
            <td>Onaylı Mimari Proje</td>
            <td>${rep.mimariProjeTarihi || "-"}</td>
            <td>${rep.mimariProjeSayisi || "-"}</td>
            <td>${rep.mimariProjeKurum || "-"}</td>
            <td>${rep.mimariProjeKatSayisi || "-"}</td>
          </tr>
          <tr>
            <td>Yapı Ruhsatı</td>
            <td>${rep.yapiRuhsatiTarihi || "-"}</td>
            <td>${rep.yapiRuhsatiSayisi || "-"}</td>
            <td>${rep.yapiRuhsatiKurum || "-"}</td>
            <td>${rep.yapiRuhsatiKatSayisi || "-"}</td>
          </tr>
          <tr>
            <td>Yapı Kullanma İzin Belgesi</td>
            <td>${rep.yapiKullanimTarihi || "-"}</td>
            <td>${rep.yapiKullanimSayisi || "-"}</td>
            <td>${rep.yapiKullanimKurum || "-"}</td>
            <td>${rep.yapiKullanimKatSayisi || "-"}</td>
          </tr>
        </table>
        <table class="tech-table" style="margin-top:4px;">
          <tr>
            <th>Yapı Nizamı</th><td>${rep.yapiNizami}</td>
            <th>TAKS / KAKS (İmar)</th><td>${rep.taks || "-"} / ${rep.kaksImarOrani}</td>
            <th>Kat Adedi & Lejant</th><td>${rep.katAdedi} — ${rep.lejant}</td>
          </tr>
        </table>

        <div class="tech-sec-title">7. YAPI ÖZELLİKLERİ, 8. BAĞIMSIZ BÖLÜM & 9. DİĞER ÖZELLİKLER</div>
        <table class="tech-table">
          <tr>
            <th>Yapı Durumu / Adedi</th><td>${rep.yapiDurumu} (${rep.yapiAdedi || "0"} Adet)</td>
            <th>Yapı Malzemesi / Sınıfı</th><td>${rep.yapiMalzemesi} / ${rep.yapiSinifi || "-"}</td>
            <th>Yapı Yaşı / İnşaat %</th><td>${rep.yapiYasi || "-"} Yıl / ${rep.insaatSeviyesi || "%100"}</td>
          </tr>
          <tr>
            <th>Brüt Alan / Kat Adedi</th><td>${rep.brutKullanimAlaniM2 || "-"} m² / ${rep.yapiKatAdedi || "-"} Kat</td>
            <th>Oda / Salon / Banyo / Balkon</th><td>${rep.odaSayisi} Oda, ${rep.salonSayisi} Salon, ${rep.banyoWcSayisi} Banyo, ${rep.balkonSayisi} Balkon</td>
            <th>Isınma / Cephe / Manzara</th><td>${rep.isinmaSistemi} / ${rep.baktigiYon} / ${rep.manzara}</td>
          </tr>
          <tr>
            <th>Site İçi / Havuz</th><td>Site: ${rep.siteIci} | Havuz: ${rep.yuzmeHavuzu}</td>
            <th>Açık / Kapalı Otopark</th><td>Açık: ${rep.acikOtopark} | Kapalı: ${rep.kapaliOtopark}</td>
            <th>Güvenlik / Asansör</th><td>Güvenlik: ${rep.guvenlik} | Asansör: ${rep.asansor}</td>
          </tr>
        </table>

        <div class="tech-sec-title">10. KONUM, ULAŞIM VE YAKIN ÇEVRE YAPILAŞMA ANALİZİ</div>
        <table class="tech-table">
          <tr>
            <th>Konum / Gelişme / Arz-Talep</th>
            <td>${rep.konumTipi} | Gelişme: ${rep.ekonomikGelisme} | Arz/Talep: ${rep.arzTalepDengesi}</td>
            <th>Yapılaşma / Doluluk / Deprem</th>
            <td>Yapılaşma: ${rep.yapilasmaOrani} | Doluluk: ${rep.dolulukOrani} | Deprem: ${rep.depremBolgesi}. Bölge</td>
          </tr>
          <tr>
            <th>Ulaşım Olanakları</th>
            <td colspan="3">${rep.ulasimOlanaklari}</td>
          </tr>
          <tr>
            <th>Olumlu Özellikler</th>
            <td>${rep.olumluOzellikler}</td>
            <th>Olumsuz Özellikler</th>
            <td>${rep.olumsuzOzellikler}</td>
          </tr>
        </table>

        <div class="tech-sec-title">11. EMSAL ANALİZİ TABLOSU</div>
        <table class="tech-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Niteliği</th>
              <th>Alan (m²)</th>
              <th>Yaş / Cephe</th>
              <th>İmar Hakkı</th>
              <th>Mesafe</th>
              <th>Durum / Tarih</th>
              <th>Fiyat</th>
              <th>m² Birim</th>
              <th>Kaynak / İletişim</th>
            </tr>
          </thead>
          <tbody>
            ${rep.emsaller
              .map(
                (e, idx) => `
              <tr>
                <td><strong>Emsal ${idx + 1}</strong></td>
                <td>${e.nitelik}</td>
                <td>${e.brutAlanM2}</td>
                <td>${e.yapiYasi} / ${e.cephesi}</td>
                <td>${e.imarHaklari}</td>
                <td>${e.mesafeM}</td>
                <td>${e.durum} (${e.tarih})</td>
                <td><strong>${(e.fiyat || 0).toLocaleString("tr-TR")} ${e.paraBirimi}</strong></td>
                <td>${(e.m2BirimFiyat || 0).toLocaleString("tr-TR")} ${e.paraBirimi}/m²</td>
                <td>${e.kaynak} (${e.telefon})</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        ${rep.krokiNotu ? `<div class="note-line"><strong>11.1. Kroki & Konum Notu:</strong> ${rep.krokiNotu}</div>` : ""}

        <div class="tech-sec-title">12. TAKYİDAT BİLGİLERİ & 13. DEĞERLEME YÖNTEMLERİ</div>
        <table class="tech-table">
          <tr>
            <th>Takyidat Durumu</th>
            <td><strong>${rep.takyidatDurumu}</strong> — ${rep.takyidatEtkisi} (${rep.takyidatAciklama})</td>
          </tr>
          <tr>
            <th>Emsal Karşılaştırma</th>
            <td>${rep.yontemEmsalAciklama}</td>
          </tr>
          <tr>
            <th>Maliyet & Gelir Yaklaşımı</th>
            <td>${rep.yontemMaliyetAciklama} ${rep.yontemGelirAciklama ? `| ${rep.yontemGelirAciklama}` : ""}</td>
          </tr>
        </table>

        <div class="tech-sec-title">14. DEĞER HESABI, UZLAŞTIRMA VE UYGUNLUK BEYANI</div>
        <table class="tech-table">
          <thead>
            <tr>
              <th>Değer Kalemi</th>
              <th>Orijinal Tutar (${rep.paraBirimi})</th>
              <th>TL Karşılığı</th>
              <th>USD Karşılığı</th>
              <th>GBP Karşılığı</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Arsa Pazar Değeri</td>
              <td><strong>${(rep.arsaPazarDegeri || 0).toLocaleString("tr-TR")} ${rep.paraBirimi}</strong></td>
              <td>${toTL(rep.arsaPazarDegeri || 0)} TL</td>
              <td>${toUSD(rep.arsaPazarDegeri || 0)} USD</td>
              <td>${toGBP(rep.arsaPazarDegeri || 0)} GBP</td>
            </tr>
            <tr>
              <td>Yapı (Kapalı Alan) Pazar Değeri</td>
              <td><strong>${(rep.yapiPazarDegeri || 0).toLocaleString("tr-TR")} ${rep.paraBirimi}</strong></td>
              <td>${toTL(rep.yapiPazarDegeri || 0)} TL</td>
              <td>${toUSD(rep.yapiPazarDegeri || 0)} USD</td>
              <td>${toGBP(rep.yapiPazarDegeri || 0)} GBP</td>
            </tr>
            <tr>
              <td>Yasal & Mevcut Durum Toplam Pazar Değeri</td>
              <td><strong>${totalVal.toLocaleString("tr-TR")} ${rep.paraBirimi}</strong></td>
              <td><strong>${toTL(totalVal)} TL</strong></td>
              <td><strong>${toUSD(totalVal)} USD</strong></td>
              <td><strong>${toGBP(totalVal)} GBP</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="compliance-box">
          <strong>Uygunluk Beyanı:</strong> Rapor TDES-310 ve TKGM 2019/1 - 2019/5 sayılı genelgelerine uygun olarak hazırlanmıştır.
        </div>

        <div class="signatures-row">
          <div class="sig-card">
            <div class="sig-role">Raporu Hazırlayan Değerleme Uzmanı</div>
            <div class="sig-name">${rep.degerlemeUzmani}</div>
            <div class="sig-lic">Lisans No: ${rep.degerlemeUzmaniLisansNo || "-"}</div>
            <div class="sig-line">İmza / Kaşe</div>
          </div>
          <div class="sig-card">
            <div class="sig-role">Sorumlu Değerleme Uzmanı (Onay)</div>
            <div class="sig-name">${rep.sorumluUzman}</div>
            <div class="sig-lic">Lisans No: ${rep.sorumluUzmanLisansNo || "-"}</div>
            <div class="sig-line">İmza / Kaşe</div>
          </div>
        </div>
      </div>
    `;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8" />
        <title>Gayrimenkul Değerleme Raporu - ${rep.raporNo}</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
          body { margin: 0; padding: 0; color: #0f172a; background: #fff; font-size: 11px; line-height: 1.4; }
          .page-sheet { width: 100%; max-width: 190mm; margin: 0 auto; padding: 4mm; border: 1.5px solid #1e293b; }
          .page-break { page-break-before: always; margin-top: 8mm; }
          .doc-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 10px; }
          .brand-name { font-size: 18px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
          .doc-sub { font-size: 11px; font-weight: 700; color: #475569; margin-top: 2px; }
          .doc-meta { text-align: right; font-size: 11px; color: #334155; }
          .section-banner { background: #0f172a; color: #ffffff; font-weight: 800; font-size: 11px; padding: 5px 10px; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 8px; }
          .subject-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 11.5px; margin-bottom: 10px; }
          .letter-body p { margin: 5px 0; text-align: justify; font-size: 11.5px; }
          .letter-sign { margin-top: 10px; font-size: 12px; }
          .summary-table { width: 100%; border-collapse: collapse; margin-top: 4px; }
          .summary-table th, .summary-table td { border: 1px solid #94a3b8; padding: 7px 9px; vertical-align: top; text-align: left; }
          .summary-table th { width: 34%; background: #f1f5f9; font-weight: 700; color: #1e293b; }
          .val-highlight th { background: #eff6ff; color: #1e3a8a; }
          .val-highlight td { background: #f8fafc; }
          .val-total th, .val-total td { background: #0f172a; color: #ffffff; }
          .price-big { font-size: 15px; font-weight: 900; }
          .price-words { font-size: 11px; font-weight: 600; opacity: 0.9; margin-top: 2px; }
          .tech-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          .tech-sec-title { background: #1e293b; color: #ffffff; font-size: 10px; font-weight: 800; padding: 4px 8px; margin-top: 8px; margin-bottom: 3px; text-transform: uppercase; }
          .tech-table { width: 100%; border-collapse: collapse; font-size: 10px; }
          .tech-table th, .tech-table td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: left; }
          .tech-table th { background: #f8fafc; font-weight: 700; color: #334155; }
          .note-line { font-size: 9.5px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 4px 6px; margin-top: 3px; }
          .compliance-box { margin-top: 8px; padding: 6px 8px; background: #f1f5f9; border: 1px solid #94a3b8; font-size: 10px; }
          .signatures-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 12px; }
          .sig-card { border: 1px solid #cbd5e1; padding: 8px; text-align: center; }
          .sig-role { font-size: 9.5px; font-weight: 700; color: #475569; text-transform: uppercase; }
          .sig-name { font-size: 12px; font-weight: 800; color: #0f172a; margin-top: 3px; }
          .sig-lic { font-size: 9.5px; color: #64748b; }
          .sig-line { margin-top: 22px; border-top: 1px dashed #94a3b8; padding-top: 3px; font-size: 9px; color: #64748b; }
        </style>
      </head>
      <body>
        ${mode === "bildirim" ? bildirimHtml : mode === "teknik" ? teknikHtml : `${bildirimHtml}${teknikHtml}`}
      </body>
      </html>
    `;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1500);
      }, 250);
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          r.raporNo.toLowerCase().includes(q) ||
          r.musteriAdi.toLowerCase().includes(q) ||
          r.acikAdres.toLowerCase().includes(q) ||
          r.kaza.toLowerCase().includes(q) ||
          r.mahalle.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [reports, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const totalCount = reports.length;
    const completedCount = reports.filter(r => r.status === "tamamlandi" || r.status === "teslim_edildi").length;
    const collectedRevenue = reports
      .filter(r => r.tahsilatDurumu === "tahsil_edildi")
      .reduce((acc, r) => acc + (Number(r.hizmetBedeli) || 0), 0);
    const pendingRevenue = reports
      .filter(r => r.tahsilatDurumu === "bekliyor")
      .reduce((acc, r) => acc + (Number(r.hizmetBedeli) || 0), 0);
    return { totalCount, completedCount, collectedRevenue, pendingRevenue };
  }, [reports]);

  return (
    <div className="space-y-3">
      {/* Compact Header & KPI Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight uppercase">
                Gayrimenkul Değerleme & Bildirim Raporları
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                14 bölümlü teknik değerleme raporu ve yönetici özeti bildirim formu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCreateNewReport}
              className="px-3 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Yeni Değerleme Raporu</span>
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-2.5 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200/70 rounded-lg px-2.5 py-1.5">
            <div className="text-[10px] font-bold text-slate-500 uppercase">Toplam Rapor</div>
            <div className="text-sm font-black text-slate-900">{stats.totalCount} Adet</div>
          </div>
          <div className="bg-slate-50 border border-slate-200/70 rounded-lg px-2.5 py-1.5">
            <div className="text-[10px] font-bold text-slate-500 uppercase">Tamamlanan</div>
            <div className="text-sm font-black text-emerald-700">{stats.completedCount} Rapor</div>
          </div>
          <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-lg px-2.5 py-1.5">
            <div className="text-[10px] font-bold text-emerald-700 uppercase">Tahsil Edilen Hizmet</div>
            <div className="text-sm font-black text-emerald-900">{stats.collectedRevenue.toLocaleString("tr-TR")} GBP</div>
          </div>
          <div className="bg-amber-50/70 border border-amber-200/70 rounded-lg px-2.5 py-1.5">
            <div className="text-[10px] font-bold text-amber-700 uppercase">Bekleyen Hizmet Bedeli</div>
            <div className="text-sm font-black text-amber-900">{stats.pendingRevenue.toLocaleString("tr-TR")} GBP</div>
          </div>
        </div>
      </div>

      {/* Editor Modal / Panel */}
      {editingReport && (
        <div className="bg-white border-2 border-slate-900 rounded-xl shadow-lg overflow-hidden">
          <div className="bg-slate-900 text-white px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black uppercase tracking-wide">
                Değerleme Raporu Düzenle — {editingReport.raporNo}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {properties.length > 0 && (
                <select
                  onChange={e => handleFillFromPortfolio(e.target.value)}
                  defaultValue=""
                  className="bg-slate-800 text-white text-[11px] font-semibold px-2 py-1 rounded border border-slate-700"
                >
                  <option value="">Portföyden Bilgi Aktar...</option>
                  {properties.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.reference_code ? `[${p.reference_code}] ` : ""}{p.title}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={handleSaveReport}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Kaydet</span>
              </button>
              <button
                type="button"
                onClick={() => setEditingReport(null)}
                className="p-1 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 5 Step Navigation */}
          <div className="flex items-center gap-1 px-3 py-2 bg-slate-100 border-b border-slate-200 overflow-x-auto">
            {[
              { id: 1, label: "1. Rapor & Müşteri" },
              { id: 2, label: "2. Tapu & İmar" },
              { id: 3, label: "3. Yapı & Çevre" },
              { id: 4, label: "4. Emsal & Takyidat" },
              { id: 5, label: "5. Değer & Sonuç" }
            ].map(st => (
              <button
                key={st.id}
                type="button"
                onClick={() => setActiveFormStep(st.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeFormStep === st.id
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="p-3.5 space-y-3">
            {/* STEP 1: RAPOR & MÜŞTERİ */}
            {activeFormStep === 1 && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Rapor No</label>
                    <input
                      type="text"
                      value={editingReport.raporNo}
                      onChange={e => setEditingReport({ ...editingReport, raporNo: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Rapor Tarihi</label>
                    <input
                      type="date"
                      value={editingReport.raporTarihi}
                      onChange={e => setEditingReport({ ...editingReport, raporTarihi: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Değerleme Tarihi</label>
                    <input
                      type="date"
                      value={editingReport.degerlemeTarihi}
                      onChange={e => setEditingReport({ ...editingReport, degerlemeTarihi: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Rapor Durumu</label>
                    <select
                      value={editingReport.status}
                      onChange={e => setEditingReport({ ...editingReport, status: e.target.value as any })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg font-bold text-slate-900"
                    >
                      <option value="taslak">Taslak</option>
                      <option value="tamamlandi">Tamamlandı</option>
                      <option value="teslim_edildi">Müşteriye Teslim Edildi</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Raporu Talep Eden Yatırımcı</label>
                    <input
                      type="text"
                      placeholder="Örn: Gonce Avaş"
                      value={editingReport.musteriAdi}
                      onChange={e => setEditingReport({ ...editingReport, musteriAdi: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Müşteri Telefon</label>
                    <input
                      type="text"
                      placeholder="+90 548 ..."
                      value={editingReport.musteriTelefon}
                      onChange={e => setEditingReport({ ...editingReport, musteriTelefon: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Hazırlayan Kuruluş</label>
                    <input
                      type="text"
                      value={editingReport.kurulusAdi}
                      onChange={e => setEditingReport({ ...editingReport, kurulusAdi: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Taşınmazın Açık Adresi</label>
                    <input
                      type="text"
                      placeholder="Örn: YZB. TEKİN YURDABAK CADDESİ ORTAKÖY/LEFKOŞA"
                      value={editingReport.acikAdres}
                      onChange={e => setEditingReport({ ...editingReport, acikAdres: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Kullanım Amacı</label>
                      <select
                        value={editingReport.kullanimAmaci}
                        onChange={e => setEditingReport({ ...editingReport, kullanimAmaci: e.target.value as any })}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-900"
                      >
                        <option value="Konut">Konut</option>
                        <option value="Ticari">Ticari</option>
                        <option value="Sanayi">Sanayi</option>
                        <option value="Tarım">Tarım</option>
                        <option value="Diğer">Diğer</option>
                      </select>
                    </div>
                    <div className="w-28">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Taşınmaz Kodu</label>
                      <input
                        type="text"
                        value={editingReport.tasinmazKodu}
                        onChange={e => setEditingReport({ ...editingReport, tasinmazKodu: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Bildirim Formu Konu Metni</label>
                    <input
                      type="text"
                      placeholder="Otomatik oluşturulur veya özel girilebilir"
                      value={editingReport.konuOzeti}
                      onChange={e => setEditingReport({ ...editingReport, konuOzeti: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Gayrimenkul Kullanım Notu</label>
                    <input
                      type="text"
                      value={editingReport.kullanimAciklamasi}
                      onChange={e => setEditingReport({ ...editingReport, kullanimAciklamasi: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                </div>

                {/* Hizmet Bedeli */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Değerleme Hizmet Ücreti</label>
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={formatNumberInput(editingReport.hizmetBedeli)}
                        onChange={e =>
                          setEditingReport({ ...editingReport, hizmetBedeli: parseFormattedNumber(e.target.value) })
                        }
                        className="w-32 px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-l-lg text-slate-900 bg-white"
                      />
                      <select
                        value={editingReport.hizmetParaBirimi}
                        onChange={e => setEditingReport({ ...editingReport, hizmetParaBirimi: e.target.value })}
                        className="w-20 px-2 py-1.5 text-xs font-bold border-y border-r border-slate-300 rounded-r-lg bg-slate-100 text-slate-900"
                      >
                        <option value="GBP">GBP</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="TRY">TRY</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Tahsilat Durumu</label>
                    <select
                      value={editingReport.tahsilatDurumu}
                      onChange={e => setEditingReport({ ...editingReport, tahsilatDurumu: e.target.value as any })}
                      className="w-36 px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white text-slate-900"
                    >
                      <option value="bekliyor">Tahsilat Bekliyor</option>
                      <option value="tahsil_edildi">Tahsil Edildi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Sözleşme No</label>
                    <input
                      type="text"
                      value={editingReport.sozlesmeSayisi}
                      onChange={e => setEditingReport({ ...editingReport, sozlesmeSayisi: e.target.value })}
                      className="w-36 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: TAPU & İMAR */}
            {activeFormStep === 2 && (
              <div className="space-y-3">
                <div className="text-xs font-black text-slate-800 uppercase">3. Ana Taşınmaz & Tapu Kayıtları</div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Kaza / İlçe</label>
                    <input
                      type="text"
                      value={editingReport.kaza}
                      onChange={e => setEditingReport({ ...editingReport, kaza: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Kasaba / Köy</label>
                    <input
                      type="text"
                      value={editingReport.kasabaKoy}
                      onChange={e => setEditingReport({ ...editingReport, kasabaKoy: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Mahalle</label>
                    <input
                      type="text"
                      value={editingReport.mahalle}
                      onChange={e => setEditingReport({ ...editingReport, mahalle: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Mevki</label>
                    <input
                      type="text"
                      value={editingReport.mevki}
                      onChange={e => setEditingReport({ ...editingReport, mevki: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Koçan No</label>
                    <input
                      type="text"
                      value={editingReport.kocanNo}
                      onChange={e => setEditingReport({ ...editingReport, kocanNo: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <div className="w-24">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Pafta No</label>
                    <input
                      type="text"
                      value={editingReport.paftaNo}
                      onChange={e => setEditingReport({ ...editingReport, paftaNo: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="w-28">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Harita No</label>
                    <input
                      type="text"
                      value={editingReport.haritaNo}
                      onChange={e => setEditingReport({ ...editingReport, haritaNo: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Ada No</label>
                    <input
                      type="text"
                      value={editingReport.adaNo}
                      onChange={e => setEditingReport({ ...editingReport, adaNo: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Parsel No</label>
                    <input
                      type="text"
                      value={editingReport.parselNo}
                      onChange={e => setEditingReport({ ...editingReport, parselNo: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="w-20">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Dönüm</label>
                    <input
                      type="text"
                      value={editingReport.donum}
                      onChange={e => setEditingReport({ ...editingReport, donum: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                  <div className="w-20">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Evlek</label>
                    <input
                      type="text"
                      value={editingReport.evlek}
                      onChange={e => setEditingReport({ ...editingReport, evlek: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Ayakkare (a²)</label>
                    <input
                      type="text"
                      value={editingReport.ayakkare}
                      onChange={e => setEditingReport({ ...editingReport, ayakkare: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                  <div className="w-28">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Toplam m²</label>
                    <input
                      type="text"
                      value={editingReport.yuzolcumuM2}
                      onChange={e => setEditingReport({ ...editingReport, yuzolcumuM2: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <div className="text-xs font-black text-slate-800 uppercase mb-2">6. İmar Durumu</div>
                  <div className="flex flex-wrap gap-2.5">
                    <div className="w-36">
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Yapı Nizamı</label>
                      <input
                        type="text"
                        value={editingReport.yapiNizami}
                        onChange={e => setEditingReport({ ...editingReport, yapiNizami: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">TAKS</label>
                      <input
                        type="text"
                        value={editingReport.taks}
                        onChange={e => setEditingReport({ ...editingReport, taks: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div className="w-28">
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">İmar Oranı (KAKS)</label>
                      <input
                        type="text"
                        placeholder="Örn: %160"
                        value={editingReport.kaksImarOrani}
                        onChange={e => setEditingReport({ ...editingReport, kaksImarOrani: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg font-bold"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Kat Adedi</label>
                      <input
                        type="text"
                        placeholder="Örn: 5 Kat"
                        value={editingReport.katAdedi}
                        onChange={e => setEditingReport({ ...editingReport, katAdedi: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg font-bold"
                      />
                    </div>
                    <div className="w-44">
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Lejant (İmar Fonksiyonu)</label>
                      <select
                        value={editingReport.lejant}
                        onChange={e => setEditingReport({ ...editingReport, lejant: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg font-bold"
                      >
                        <option value="Konut + Ticari">Konut + Ticari</option>
                        <option value="Konut">Konut</option>
                        <option value="Ticari">Ticari</option>
                        <option value="Turizm">Turizm</option>
                        <option value="Sanayi">Sanayi</option>
                        <option value="Tarım">Tarım</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: YAPI & ÇEVRE ÖZELLİKLERİ */}
            {activeFormStep === 3 && (
              <div className="space-y-3">
                <div className="text-xs font-black text-slate-800 uppercase">7 & 8. Yapı ve Bağımsız Bölüm Özellikleri</div>
                <div className="flex flex-wrap gap-2">
                  <div className="w-28">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Yapı Durumu</label>
                    <select
                      value={editingReport.yapiDurumu}
                      onChange={e => setEditingReport({ ...editingReport, yapiDurumu: e.target.value as any })}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg font-bold"
                    >
                      <option value="Var">Var</option>
                      <option value="Yok">Yok (Boş Arsa)</option>
                    </select>
                  </div>
                  <div className="w-28">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Yapı Malzemesi</label>
                    <select
                      value={editingReport.yapiMalzemesi}
                      onChange={e => setEditingReport({ ...editingReport, yapiMalzemesi: e.target.value as any })}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                    >
                      <option value="Betonarme">Betonarme</option>
                      <option value="Kargir">Kargir</option>
                      <option value="Ahşap">Ahşap</option>
                      <option value="Çelik">Çelik</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">İnşaat %</label>
                    <input
                      type="text"
                      value={editingReport.insaatSeviyesi}
                      onChange={e => setEditingReport({ ...editingReport, insaatSeviyesi: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="w-20">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Yapı Yaşı</label>
                    <input
                      type="text"
                      value={editingReport.yapiYasi}
                      onChange={e => setEditingReport({ ...editingReport, yapiYasi: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="w-28">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Kapalı Alan m²</label>
                    <input
                      type="text"
                      value={editingReport.brutKullanimAlaniM2}
                      onChange={e => setEditingReport({ ...editingReport, brutKullanimAlaniM2: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                  <div className="w-20">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Oda</label>
                    <input
                      type="text"
                      value={editingReport.odaSayisi}
                      onChange={e => setEditingReport({ ...editingReport, odaSayisi: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="w-20">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Salon</label>
                    <input
                      type="text"
                      value={editingReport.salonSayisi}
                      onChange={e => setEditingReport({ ...editingReport, salonSayisi: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Isınma</label>
                    <select
                      value={editingReport.isinmaSistemi}
                      onChange={e => setEditingReport({ ...editingReport, isinmaSistemi: e.target.value as any })}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                    >
                      <option value="Klima">Klima</option>
                      <option value="Merkezi Sistem">Merkezi Sistem</option>
                      <option value="Kombi">Kombi</option>
                      <option value="Doğal gaz">Doğal gaz</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <div className="text-xs font-black text-slate-800 uppercase mb-2">10. Konum ve Çevre Yapılaşma Analizi</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Değeri Olumlu Etkileyen Faktörler</label>
                      <input
                        type="text"
                        value={editingReport.olumluOzellikler}
                        onChange={e => setEditingReport({ ...editingReport, olumluOzellikler: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Değeri Olumsuz Etkileyen Faktörler</label>
                      <input
                        type="text"
                        value={editingReport.olumsuzOzellikler}
                        onChange={e => setEditingReport({ ...editingReport, olumsuzOzellikler: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: EMSAL ANALİZİ & TAKYİDAT */}
            {activeFormStep === 4 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-slate-800 uppercase">11. Emsal Karşılaştırma Tablosu</div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextEmsal: ValuationComparable = {
                        id: `ems_${Date.now()}`,
                        nitelik: "Benzer İmarlı Arsa",
                        brutAlanM2: "1.500",
                        yapiYasi: "-",
                        cephesi: "Güney",
                        imarHaklari: editingReport.kaksImarOrani || "%160",
                        mesafeM: "300 m",
                        durum: "Satılık",
                        tarih: formatDotDate(editingReport.degerlemeTarihi),
                        fiyat: 350000,
                        paraBirimi: editingReport.paraBirimi,
                        m2BirimFiyat: 233,
                        kaynak: "Bölge Emlak Ofisi",
                        telefon: ""
                      };
                      setEditingReport({
                        ...editingReport,
                        emsaller: [...editingReport.emsaller, nextEmsal]
                      });
                    }}
                    className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[11px] font-bold cursor-pointer"
                  >
                    + Emsal Ekle
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 text-[10px] uppercase">
                        <th className="p-2">Nitelik</th>
                        <th className="p-2 w-20">Alan m²</th>
                        <th className="p-2 w-24">İmar</th>
                        <th className="p-2 w-20">Mesafe</th>
                        <th className="p-2 w-32">Fiyat</th>
                        <th className="p-2 w-24">m² Birim</th>
                        <th className="p-2">Kaynak / Tel</th>
                        <th className="p-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {editingReport.emsaller.map((em, idx) => (
                        <tr key={em.id}>
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={em.nitelik}
                              onChange={e => {
                                const list = [...editingReport.emsaller];
                                list[idx] = { ...em, nitelik: e.target.value };
                                setEditingReport({ ...editingReport, emsaller: list });
                              }}
                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={em.brutAlanM2}
                              onChange={e => {
                                const list = [...editingReport.emsaller];
                                list[idx] = { ...em, brutAlanM2: e.target.value };
                                setEditingReport({ ...editingReport, emsaller: list });
                              }}
                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={em.imarHaklari}
                              onChange={e => {
                                const list = [...editingReport.emsaller];
                                list[idx] = { ...em, imarHaklari: e.target.value };
                                setEditingReport({ ...editingReport, emsaller: list });
                              }}
                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={em.mesafeM}
                              onChange={e => {
                                const list = [...editingReport.emsaller];
                                list[idx] = { ...em, mesafeM: e.target.value };
                                setEditingReport({ ...editingReport, emsaller: list });
                              }}
                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={formatNumberInput(em.fiyat)}
                              onChange={e => {
                                const list = [...editingReport.emsaller];
                                list[idx] = { ...em, fiyat: parseFormattedNumber(e.target.value) };
                                setEditingReport({ ...editingReport, emsaller: list });
                              }}
                              className="w-full px-2 py-1 text-xs font-bold border border-slate-200 rounded"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={formatNumberInput(em.m2BirimFiyat)}
                              onChange={e => {
                                const list = [...editingReport.emsaller];
                                list[idx] = { ...em, m2BirimFiyat: parseFormattedNumber(e.target.value) };
                                setEditingReport({ ...editingReport, emsaller: list });
                              }}
                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={em.kaynak}
                              onChange={e => {
                                const list = [...editingReport.emsaller];
                                list[idx] = { ...em, kaynak: e.target.value };
                                setEditingReport({ ...editingReport, emsaller: list });
                              }}
                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                            />
                          </td>
                          <td className="p-1.5 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                setEditingReport({
                                  ...editingReport,
                                  emsaller: editingReport.emsaller.filter((_, i) => i !== idx)
                                })
                              }
                              className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">12. Takyidat / Şerh Durumu</label>
                    <select
                      value={editingReport.takyidatDurumu}
                      onChange={e => setEditingReport({ ...editingReport, takyidatDurumu: e.target.value as any })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg font-bold"
                    >
                      <option value="Yok">Yok (Temiz)</option>
                      <option value="Var">Var</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Takyidat Açıklaması</label>
                    <input
                      type="text"
                      value={editingReport.takyidatAciklama}
                      onChange={e => setEditingReport({ ...editingReport, takyidatAciklama: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: DEĞER HESABI, UZLAŞTIRMA VE İMZALAR */}
            {activeFormStep === 5 && (
              <div className="space-y-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-black text-slate-900 uppercase">
                      14. Pazar Değeri Tespiti (Bildirim Formunu Otomatik Besler)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-600">Rapor Para Birimi:</span>
                      <select
                        value={editingReport.paraBirimi}
                        onChange={e => setEditingReport({ ...editingReport, paraBirimi: e.target.value as any })}
                        className="w-24 px-2 py-1 text-xs font-black border border-slate-300 rounded-lg bg-white text-slate-900"
                      >
                        <option value="GBP">GBP (£)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="TRY">TRY (₺)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                      <label className="block text-[11px] font-bold text-slate-800 mb-1">
                        Pazar Değeri (Arsa / Ana Taşınmaz - KDV Dahil)
                      </label>
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={formatNumberInput(editingReport.arsaPazarDegeri)}
                          onChange={e => {
                            const val = parseFormattedNumber(e.target.value);
                            setEditingReport({
                              ...editingReport,
                              arsaPazarDegeri: val,
                              yasalDurumDegeri: val + (Number(editingReport.yapiPazarDegeri) || 0),
                              mevcutDurumDegeri: val + (Number(editingReport.yapiPazarDegeri) || 0)
                            });
                          }}
                          placeholder="400.000"
                          className="w-44 px-3 py-1.5 text-sm font-black border border-slate-300 rounded-l-lg text-slate-900"
                        />
                        <span className="px-3 py-1.5 text-xs font-black bg-slate-100 border-y border-r border-slate-300 rounded-r-lg text-slate-700">
                          {editingReport.paraBirimi}
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-indigo-700 mt-1">
                        Yazıyla: {amountToReadableTurkishWords(editingReport.arsaPazarDegeri, editingReport.paraBirimi)}
                      </div>
                      <input
                        type="text"
                        placeholder="Özel Not (Örn: Gayrimenkulün şekilsizliği göz önünde bulundurulmuştur.)"
                        value={editingReport.arsaDegerNotu}
                        onChange={e => setEditingReport({ ...editingReport, arsaDegerNotu: e.target.value })}
                        className="w-full mt-2 px-2.5 py-1 text-xs border border-slate-200 rounded-md"
                      />
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                      <label className="block text-[11px] font-bold text-slate-800 mb-1">
                        Pazar Değeri (Arazi Üstündeki Yapı / Kapalı Alan)
                      </label>
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={formatNumberInput(editingReport.yapiPazarDegeri)}
                          onChange={e => {
                            const val = parseFormattedNumber(e.target.value);
                            setEditingReport({
                              ...editingReport,
                              yapiPazarDegeri: val,
                              yasalDurumDegeri: (Number(editingReport.arsaPazarDegeri) || 0) + val,
                              mevcutDurumDegeri: (Number(editingReport.arsaPazarDegeri) || 0) + val
                            });
                          }}
                          placeholder="200.000"
                          className="w-44 px-3 py-1.5 text-sm font-black border border-slate-300 rounded-l-lg text-slate-900"
                        />
                        <span className="px-3 py-1.5 text-xs font-black bg-slate-100 border-y border-r border-slate-300 rounded-r-lg text-slate-700">
                          {editingReport.paraBirimi}
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-indigo-700 mt-1">
                        Yazıyla: {amountToReadableTurkishWords(editingReport.yapiPazarDegeri, editingReport.paraBirimi)}
                      </div>
                      <input
                        type="text"
                        placeholder="Yapı Değerleme Notu"
                        value={editingReport.yapiDegerNotu}
                        onChange={e => setEditingReport({ ...editingReport, yapiDegerNotu: e.target.value })}
                        className="w-full mt-2 px-2.5 py-1 text-xs border border-slate-200 rounded-md"
                      />
                    </div>
                  </div>
                </div>

                {/* Uzman & Onaylayan İmzaları */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Raporu Hazırlayan Uzman</label>
                    <input
                      type="text"
                      value={editingReport.degerlemeUzmani}
                      onChange={e => setEditingReport({ ...editingReport, degerlemeUzmani: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Uzman Lisans No</label>
                    <input
                      type="text"
                      value={editingReport.degerlemeUzmaniLisansNo}
                      onChange={e => setEditingReport({ ...editingReport, degerlemeUzmaniLisansNo: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Sorumlu Değerleme Uzmanı</label>
                    <input
                      type="text"
                      value={editingReport.sorumluUzman}
                      onChange={e => setEditingReport({ ...editingReport, sorumluUzman: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Sorumlu Lisans No</label>
                    <input
                      type="text"
                      value={editingReport.sorumluUzmanLisansNo}
                      onChange={e => setEditingReport({ ...editingReport, sorumluUzmanLisansNo: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rapor no, müşteri adı, adres veya bölge ara..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {[
            { id: "all", label: "Tümü" },
            { id: "tamamlandi", label: "Tamamlanan" },
            { id: "taslak", label: "Taslak" },
            { id: "teslim_edildi", label: "Teslim Edilen" }
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id as any)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                statusFilter === f.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Table / Cards */}
      <div className="space-y-2.5">
        {filteredReports.map(rep => {
          const totalVal = (Number(rep.arsaPazarDegeri) || 0) + (Number(rep.yapiPazarDegeri) || 0);
          return (
            <div
              key={rep.id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 shadow-2xs transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[11px] font-black">
                      {rep.raporNo}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {formatDotDate(rep.raporTarihi)}
                    </span>
                    <span className="text-sm font-black text-slate-900">
                      Sayın {rep.musteriAdi}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        rep.tahsilatDurumu === "tahsil_edildi"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      Hizmet: {rep.hizmetBedeli} {rep.hizmetParaBirimi} ({rep.tahsilatDurumu === "tahsil_edildi" ? "Tahsil Edildi" : "Bekliyor"})
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-700 truncate">
                    {rep.konuOzeti}
                  </div>

                  <div className="flex items-center gap-3 flex-wrap text-[11px] text-slate-500">
                    <span>
                      <strong>Tapu:</strong> {rep.kaza} / {rep.mahalle} / {rep.mevki} ({rep.donum} Dönüm, {rep.evlek} Evlek, {rep.ayakkare} a²)
                    </span>
                    <span>•</span>
                    <span>
                      <strong>İmar:</strong> {rep.kaksImarOrani} • {rep.katAdedi} • {rep.lejant}
                    </span>
                  </div>
                </div>

                {/* Valuation Summary & Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0 border-t lg:border-t-0 pt-2.5 lg:pt-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">
                      Arsa: {(rep.arsaPazarDegeri || 0).toLocaleString("tr-TR")} {rep.paraBirimi}
                      {rep.yapiPazarDegeri > 0 ? ` + Yapı: ${rep.yapiPazarDegeri.toLocaleString("tr-TR")} ${rep.paraBirimi}` : ""}
                    </div>
                    <div className="text-base font-black text-slate-900">
                      Toplam: {totalVal.toLocaleString("tr-TR")} {rep.paraBirimi}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewReport(rep);
                        setPreviewMode("bildirim");
                      }}
                      className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Bildirim Formu</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPreviewReport(rep);
                        setPreviewMode("teknik");
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Teknik Rapor</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePrintValuation(rep, "tam")}
                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Yazdır</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendWhatsApp(rep)}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingReport(rep);
                        setActiveFormStep(1);
                      }}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
                      title="Düzenle"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteReport(rep.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 cursor-pointer"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Document Preview Modal (Bildirim Formu & Teknik Rapor) */}
      {previewReport && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs sm:text-sm font-black uppercase">
                  {previewReport.raporNo} — {previewReport.musteriAdi}
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setPreviewMode("bildirim")}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer ${
                    previewMode === "bildirim" ? "bg-white text-slate-900" : "bg-slate-800 text-slate-300"
                  }`}
                >
                  Bildirim Formu
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("teknik")}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer ${
                    previewMode === "teknik" ? "bg-white text-slate-900" : "bg-slate-800 text-slate-300"
                  }`}
                >
                  Teknik Rapor (14 Bölüm)
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintValuation(previewReport, previewMode)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>A4 Yazdır / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewReport(null)}
                  className="p-1 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-900 text-xs leading-relaxed">
              {previewMode === "bildirim" ? (
                <div className="border-2 border-slate-900 p-4 sm:p-6 rounded-lg space-y-4 bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-900 pb-3 gap-2">
                    <div>
                      <div className="text-lg font-black text-slate-900 uppercase">{previewReport.kurulusAdi}</div>
                      <div className="text-xs font-bold text-slate-600">Gayrimenkul Değerleme Bildirim Formu</div>
                    </div>
                    <div className="text-right text-xs font-bold text-slate-700">
                      <div>{formatLongTurkishDate(previewReport.raporTarihi)}</div>
                      <div>Rapor No: {previewReport.raporNo}</div>
                    </div>
                  </div>

                  <div className="bg-slate-900 text-white px-3 py-1.5 font-black text-xs uppercase">
                    GAYRİMENKULÜN TANIMI
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg font-semibold text-slate-800">
                    <strong>Konu:</strong> {previewReport.konuOzeti}
                  </div>

                  <div className="space-y-2 text-slate-800">
                    <p className="font-bold">Sayın; {previewReport.musteriAdi},</p>
                    <p>
                      Talebiniz doğrultusunda konu gayrimenkul için hazırlamış olduğumuz, <strong>“Pazar Değeri Tespiti”</strong> çalışmamızı ekte bilgilerinize sunuyoruz.
                    </p>
                    <p>
                      Gayrimenkulü ve çevre özelliklerini yerinde inceledikten sonra konu gayrimenkullerin bölgedeki konumunu da dikkate alarak çalışmalarımız tamamlanmıştır.
                    </p>
                    <p>
                      Ekteki rapor; gayrimenkulle ilgili kısıtlamaları, gayrimenkulün fiziki ve hukuki tanımlarını, imar durumunu ve lokasyon bilgilerini, bölge ve çevre ile ilgili önemli bilgileri, çevre gelişimlerini ve gayrimenkullerin pazar koşullarını kapsamaktadır.
                    </p>
                    <p>
                      Konu gayrimenkul ile maddi herhangi bir ilişkimiz olmadığını sonuçlarla bağlantısı olmadığını belirtiriz.
                    </p>
                    <div className="pt-2">
                      <div>Saygılarımızla,</div>
                      <div className="font-black text-slate-900 mt-1">{previewReport.kurulusAdi}</div>
                      <div className="font-bold text-slate-700">{previewReport.degerlemeUzmani}</div>
                    </div>
                  </div>

                  <div className="bg-slate-900 text-white px-3 py-1.5 font-black text-xs uppercase">
                    YÖNETİCİ ÖZETİ
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-slate-300 text-xs">
                      <tbody>
                        <tr className="border-b border-slate-300">
                          <th className="bg-slate-100 p-2.5 text-left w-1/3 font-bold">Rapor Tarihi ve Numarası</th>
                          <td className="p-2.5 font-semibold">{formatDotDate(previewReport.raporTarihi)} / {previewReport.raporNo}</td>
                        </tr>
                        <tr className="border-b border-slate-300">
                          <th className="bg-slate-100 p-2.5 text-left font-bold">Raporu Talep Eden</th>
                          <td className="p-2.5 font-bold">{previewReport.musteriAdi}</td>
                        </tr>
                        <tr className="border-b border-slate-300">
                          <th className="bg-slate-100 p-2.5 text-left font-bold">Değerleme Tarihi</th>
                          <td className="p-2.5">{formatDotDate(previewReport.degerlemeTarihi)}</td>
                        </tr>
                        <tr className="border-b border-slate-300">
                          <th className="bg-slate-100 p-2.5 text-left font-bold">Gayrimenkullerin Açık Adresi</th>
                          <td className="p-2.5 font-semibold">{previewReport.acikAdres}</td>
                        </tr>
                        <tr className="border-b border-slate-300">
                          <th className="bg-slate-100 p-2.5 text-left font-bold">Gayrimenkullerin Kullanımı</th>
                          <td className="p-2.5">{previewReport.kullanimAciklamasi}</td>
                        </tr>
                        <tr className="border-b border-slate-300">
                          <th className="bg-slate-100 p-2.5 text-left font-bold">Tapu Kayıtları</th>
                          <td className="p-2.5">
                            <div>
                              <strong>Kaza:</strong> {previewReport.kaza} – <strong>Kasaba/köy:</strong> {previewReport.kasabaKoy || previewReport.kaza} – <strong>Mahalle:</strong> {previewReport.mahalle} – <strong>Mevki:</strong> {previewReport.mevki}
                            </div>
                            <div className="mt-0.5">
                              <strong>Yüz Ölçümü:</strong> {previewReport.donum} Dönüm, {previewReport.evlek} Evlek, {previewReport.ayakkare} Ayakkare
                            </div>
                          </td>
                        </tr>
                        <tr className="border-b border-slate-300">
                          <th className="bg-slate-100 p-2.5 text-left font-bold">İmar Durumu</th>
                          <td className="p-2.5 font-semibold">
                            Değerlemeye konu Arsanın imarı : • {previewReport.kaksImarOrani} • {previewReport.katAdedi} • {previewReport.lejant}
                          </td>
                        </tr>
                        <tr className="border-b border-slate-300 bg-indigo-50/50">
                          <th className="p-2.5 text-left font-bold text-indigo-950">
                            Pazar Değeri (KDV dahil fiyatı)
                            {previewReport.arsaDegerNotu && (
                              <div className="text-[11px] font-normal text-slate-600 mt-0.5">
                                ({previewReport.arsaDegerNotu})
                              </div>
                            )}
                          </th>
                          <td className="p-2.5">
                            <div className="text-base font-black text-slate-900">
                              {(previewReport.arsaPazarDegeri || 0).toLocaleString("tr-TR")} {previewReport.paraBirimi}
                            </div>
                            <div className="text-xs font-bold text-indigo-800">
                              ({amountToReadableTurkishWords(previewReport.arsaPazarDegeri, previewReport.paraBirimi)})
                            </div>
                          </td>
                        </tr>
                        {(previewReport.yapiDurumu === "Var" || previewReport.yapiPazarDegeri > 0) && (
                          <tr className="border-b border-slate-300 bg-emerald-50/50">
                            <th className="p-2.5 text-left font-bold text-emerald-950">
                              Pazar Değeri
                              <div className="text-[11px] font-normal text-slate-600 mt-0.5">
                                ({previewReport.yapiDegerNotu || "Arazi üstündeki kapalı alan değerlendirilmesi"})
                              </div>
                            </th>
                            <td className="p-2.5">
                              <div className="text-base font-black text-slate-900">
                                {(previewReport.yapiPazarDegeri || 0).toLocaleString("tr-TR")} {previewReport.paraBirimi}
                              </div>
                              <div className="text-xs font-bold text-emerald-800">
                                ({amountToReadableTurkishWords(previewReport.yapiPazarDegeri, previewReport.paraBirimi)})
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-slate-900 p-4 sm:p-6 rounded-lg space-y-4 bg-white">
                  <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                    <div>
                      <div className="text-base font-black text-slate-900 uppercase">TAŞINMAZ DEĞERLEME RAPORU (14 BÖLÜM)</div>
                      <div className="text-xs text-slate-600">{previewReport.kurulusAdi} — Rapor No: {previewReport.raporNo}</div>
                    </div>
                    <div className="text-right text-xs font-bold">
                      Değerleme Tarihi: {formatDotDate(previewReport.degerlemeTarihi)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="border border-slate-200 rounded-lg p-2.5">
                      <div className="font-black text-slate-900 uppercase mb-1">1. Emlak Ofisi Bilgileri</div>
                      <div><strong>Kuruluş:</strong> {previewReport.kurulusAdi}</div>
                      <div><strong>Sözleşme:</strong> {formatDotDate(previewReport.sozlesmeTarihi)} / {previewReport.sozlesmeSayisi}</div>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-2.5">
                      <div className="font-black text-slate-900 uppercase mb-1">2. Rapor & Müşteri Bilgileri</div>
                      <div><strong>Talep Eden:</strong> {previewReport.musteriAdi}</div>
                      <div><strong>Açık Adres:</strong> {previewReport.acikAdres}</div>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-2.5">
                    <div className="font-black text-slate-900 uppercase mb-1">3-6. Tapu Kayıtları ve İmar Durumu</div>
                    <div>
                      <strong>Kaza/Mahalle/Mevki:</strong> {previewReport.kaza} / {previewReport.mahalle} / {previewReport.mevki} | <strong>Koçan:</strong> {previewReport.kocanNo} | <strong>Ada/Parsel:</strong> {previewReport.adaNo}/{previewReport.parselNo}
                    </div>
                    <div>
                      <strong>Yüz Ölçümü:</strong> {previewReport.donum} Dönüm, {previewReport.evlek} Evlek, {previewReport.ayakkare} Ayakkare ({previewReport.yuzolcumuM2} m²)
                    </div>
                    <div>
                      <strong>İmar Durumu:</strong> {previewReport.yapiNizami} • TAKS: {previewReport.taks} • KAKS: {previewReport.kaksImarOrani} • {previewReport.katAdedi} • {previewReport.lejant}
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-2.5">
                    <div className="font-black text-slate-900 uppercase mb-1">7-10. Yapı, Bağımsız Bölüm ve Çevre Analizi</div>
                    <div>
                      <strong>Yapı:</strong> {previewReport.yapiDurumu} ({previewReport.yapiMalzemesi}, {previewReport.brutKullanimAlaniM2} m², {previewReport.odaSayisi}+{previewReport.salonSayisi}, Isınma: {previewReport.isinmaSistemi})
                    </div>
                    <div><strong>Olumlu Faktörler:</strong> {previewReport.olumluOzellikler}</div>
                    <div><strong>Olumsuz Faktörler:</strong> {previewReport.olumsuzOzellikler}</div>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-2.5">
                    <div className="font-black text-slate-900 uppercase mb-1">11. Emsal Karşılaştırma Analizi</div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-slate-200 text-[11px]">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="border border-slate-200 p-1.5 text-left">Emsal</th>
                            <th className="border border-slate-200 p-1.5 text-left">Nitelik</th>
                            <th className="border border-slate-200 p-1.5 text-left">Alan (m²)</th>
                            <th className="border border-slate-200 p-1.5 text-left">İmar</th>
                            <th className="border border-slate-200 p-1.5 text-left">Fiyat</th>
                            <th className="border border-slate-200 p-1.5 text-left">m² Birim</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewReport.emsaller.map((em, i) => (
                            <tr key={em.id}>
                              <td className="border border-slate-200 p-1.5 font-bold">Emsal {i + 1}</td>
                              <td className="border border-slate-200 p-1.5">{em.nitelik}</td>
                              <td className="border border-slate-200 p-1.5">{em.brutAlanM2}</td>
                              <td className="border border-slate-200 p-1.5">{em.imarHaklari}</td>
                              <td className="border border-slate-200 p-1.5 font-bold">{em.fiyat.toLocaleString("tr-TR")} {em.paraBirimi}</td>
                              <td className="border border-slate-200 p-1.5">{em.m2BirimFiyat.toLocaleString("tr-TR")} {em.paraBirimi}/m²</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-2.5">
                    <div className="font-black text-slate-900 uppercase mb-1">12-14. Takyidat, Yöntem ve Nihai Değer Uzlaştırması</div>
                    <div><strong>Takyidat:</strong> {previewReport.takyidatDurumu} — {previewReport.takyidatAciklama}</div>
                    <div className="mt-1 font-bold text-slate-900">
                      Arsa Pazar Değeri: {(previewReport.arsaPazarDegeri || 0).toLocaleString("tr-TR")} {previewReport.paraBirimi} | Yapı Pazar Değeri: {(previewReport.yapiPazarDegeri || 0).toLocaleString("tr-TR")} {previewReport.paraBirimi}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                      <span><strong>Hazırlayan Uzman:</strong> {previewReport.degerlemeUzmani} ({previewReport.degerlemeUzmaniLisansNo})</span>
                      <span><strong>Sorumlu Uzman:</strong> {previewReport.sorumluUzman} ({previewReport.sorumluUzmanLisansNo})</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealEstateValuationTab;
