export type MarketplaceSectorType = 'computer' | 'phone' | 'electronics' | 'fashion' | 'home' | 'auto' | 'all' | string;

export interface MarketplaceCategory {
  id: string | number;
  name: string;
  displayName?: string;
  paths?: string[];
  parentName?: string;
  leaf?: boolean;
  available?: boolean;
  status?: string;
  sector?: MarketplaceSectorType;
}

export interface MarketplaceSectorOption {
  id: string;
  name: string;
  iconName: string;
  description: string;
  keywords: string[];
}

export const MARKETPLACE_SECTORS: MarketplaceSectorOption[] = [
  {
    id: 'all',
    name: 'Tüm Sektörler',
    iconName: 'LayoutGrid',
    description: 'Tüm pazar yeri kategorileri',
    keywords: []
  },
  {
    id: 'computer',
    name: 'Bilgisayar & Bilişim',
    iconName: 'Laptop',
    description: 'USB Bellek, Kart Okuyucu, SSD, RAM, PC Donanım, Ağ ve Çevre Birimleri',
    keywords: ['bilgisayar', 'bellek', 'usb', 'ram', 'hafıza', 'kart okuyucu', 'ssd', 'harddisk', 'laptop', 'dizüstü', 'monitör', 'klavye', 'mouse', 'yazıcı', 'toner', 'kartuş', 'modem', 'router', 'anakart', 'işlemci', 'ekran kartı', 'gaming', 'çevre birimleri', 'kasa', 'güç kaynağı', 'barkod']
  },
  {
    id: 'phone',
    name: 'Telefon & Aksesuar',
    iconName: 'Smartphone',
    description: 'Akıllı Telefon, Şarj, Kılıf, Ekran Koruyucu, Powerbank, Bluetooth Kulaklık, Akıllı Saat',
    keywords: ['telefon', 'cep', 'akıllı telefon', 'kılıf', 'şarj', 'kablo', 'powerbank', 'kulaklık', 'tws', 'bluetooth', 'akıllı saat', 'bileklik', 'ekran koruyucu', 'cam', 'tutucu', 'tablet', 'ipad']
  },
  {
    id: 'electronics',
    name: 'Elektronik & TV',
    iconName: 'Tv',
    description: 'Televizyon, Soundbar, Ses Sistemleri, Güvenlik Kameraları, Projeksiyon',
    keywords: ['elektronik', 'televizyon', 'tv', 'soundbar', 'ses sistemi', 'kamera', 'ip kamera', 'güvenlik', 'projeksiyon', 'hoparlör', 'amfi']
  },
  {
    id: 'fashion',
    name: 'Moda & Tekstil',
    iconName: 'Shirt',
    description: 'Kadın & Erkek Giyim, Ayakkabı, Çanta ve Aksesuar',
    keywords: ['giyim', 'ayakkabı', 'sneaker', 'tişört', 'elbise', 'pantolon', 'jean', 'kadın', 'erkek', 'çanta', 'mont', 'ceket', 'çorap', 'iç giyim']
  },
  {
    id: 'home',
    name: 'Ev, Yaşam & Mutfak',
    iconName: 'Home',
    description: 'Küçük Ev Aletleri, Mutfak, Ev Tekstili, Banyo & Dekorasyon',
    keywords: ['ev', 'yaşam', 'mutfak', 'kahve makinesi', 'çay', 'nevresim', 'banyo', 'batarya', 'musluk', 'süpürge', 'robot süpürge', 'tencere', 'tava']
  },
  {
    id: 'auto',
    name: 'Oto & Yapı Market',
    iconName: 'Wrench',
    description: 'Otomotiv Aksesuarları, El Aletleri, Hırdavat & Yapı',
    keywords: ['oto', 'araba', 'motosiklet', 'aksesuar', 'paspas', 'koltuk kılıfı', 'matkap', 'hırdavat', 'el aletleri', 'vidalama', 'yapı market']
  }
];

export function detectCategorySector(catName: string, paths: string[] = []): string {
  const text = (catName + ' ' + (paths || []).join(' ')).toLowerCase();
  for (const s of MARKETPLACE_SECTORS) {
    if (s.id === 'all') continue;
    for (const kw of s.keywords) {
      if (text.includes(kw)) return s.id;
    }
  }
  return 'all';
}

export interface MarketplaceAttribute {
  id: string;
  name: string;
  description?: string;
  mandatory: boolean;
  type: 'text' | 'number' | 'select' | 'boolean';
  values?: string[];
  placeholder?: string;
  defaultValue?: string;
}

// 1. Standard Hepsiburada Leaf Categories & Attributes
export const HEPSIBURADA_DEFAULT_CATEGORIES: MarketplaceCategory[] = [
  // --- BİLGİSAYAR & VERİ DEPOLAMA (USB BELLEK, KART OKUYUCU, HAFIZA KARTLARI, SSD, RAM) ---
  {
    id: 1000101,
    name: "USB Flash Bellekler",
    displayName: "Bilgisayar > Veri Depolama > USB Flash Bellekler",
    paths: ["Bilgisayar", "Veri Depolama", "USB Flash Bellekler"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000102,
    name: "Kart Okuyucular",
    displayName: "Bilgisayar > Veri Depolama > Kart Okuyucular",
    paths: ["Bilgisayar", "Veri Depolama", "Kart Okuyucular"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000103,
    name: "Hafıza Kartları (MicroSD / SD)",
    displayName: "Bilgisayar > Veri Depolama > Hafıza Kartları (MicroSD & SD)",
    paths: ["Bilgisayar", "Veri Depolama", "Hafıza Kartları"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000104,
    name: "Taşınabilir / Harici SSD",
    displayName: "Bilgisayar > Veri Depolama > Taşınabilir Harici SSD",
    paths: ["Bilgisayar", "Veri Depolama", "Taşınabilir SSD"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000105,
    name: "Harici Sabit Diskler (External HDD)",
    displayName: "Bilgisayar > Veri Depolama > Harici Harddiskler",
    paths: ["Bilgisayar", "Veri Depolama", "Harici Harddiskler"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000106,
    name: "Dahili SSD Diskler (M.2 NVMe & SATA)",
    displayName: "Bilgisayar > Bileşenler > Dahili SSD Diskler",
    paths: ["Bilgisayar", "Bileşenler", "Dahili SSD"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000107,
    name: "Dahili Sabit Diskler (HDD)",
    displayName: "Bilgisayar > Bileşenler > Dahili Harddiskler (HDD)",
    paths: ["Bilgisayar", "Bileşenler", "Dahili Harddisk"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000108,
    name: "RAM / Bellek (DDR4 & DDR5)",
    displayName: "Bilgisayar > Bileşenler > RAM / Bellek (Masaüstü & Notebook)",
    paths: ["Bilgisayar", "Bileşenler", "RAM (Bellek)"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000109,
    name: "Anakartlar",
    displayName: "Bilgisayar > Bileşenler > Anakartlar",
    paths: ["Bilgisayar", "Bileşenler", "Anakartlar"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000110,
    name: "İşlemciler (CPU)",
    displayName: "Bilgisayar > Bileşenler > İşlemciler (Intel / AMD)",
    paths: ["Bilgisayar", "Bileşenler", "İşlemciler"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000111,
    name: "Ekran Kartları (GPU)",
    displayName: "Bilgisayar > Bileşenler > Ekran Kartları",
    paths: ["Bilgisayar", "Bileşenler", "Ekran Kartları"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000112,
    name: "Bilgisayar Kasaları & Güç Kaynakları (PSU)",
    displayName: "Bilgisayar > Bileşenler > Kasa & Güç Kaynakları",
    paths: ["Bilgisayar", "Bileşenler", "Kasa & Güç Kaynağı"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000113,
    name: "İşlemci Soğutucuları & Sıvı Soğutma",
    displayName: "Bilgisayar > Bileşenler > Soğutma Sistemleri & Fanlar",
    paths: ["Bilgisayar", "Bileşenler", "Soğutma Sistemleri"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000114,
    name: "Dizüstü Bilgisayar (Laptop / Notebook)",
    displayName: "Bilgisayar > Bilgisayarlar > Dizüstü Bilgisayar (Laptop)",
    paths: ["Bilgisayar", "Bilgisayarlar", "Dizüstü Bilgisayar"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000115,
    name: "Masaüstü Bilgisayar & All-in-One",
    displayName: "Bilgisayar > Bilgisayarlar > Masaüstü Bilgisayarlar",
    paths: ["Bilgisayar", "Bilgisayarlar", "Masaüstü Bilgisayar"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000116,
    name: "Gaming Oyuncu Bilgisayarları",
    displayName: "Bilgisayar > Gaming > Hazır Oyuncu Sistemleri",
    paths: ["Bilgisayar", "Bilgisayarlar", "Oyuncu Bilgisayarı"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000117,
    name: "Monitörler",
    displayName: "Bilgisayar > Çevre Birimleri > Monitörler & Gaming Ekranlar",
    paths: ["Bilgisayar", "Çevre Birimleri", "Monitörler"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000118,
    name: "Klavye & Mouse Setleri",
    displayName: "Bilgisayar > Çevre Birimleri > Klavye & Mouse Setleri",
    paths: ["Bilgisayar", "Çevre Birimleri", "Klavye & Mouse"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000119,
    name: "Oyuncu Klavye, Mouse & Kulaklık",
    displayName: "Bilgisayar > Gaming > Oyuncu Ekipmanları",
    paths: ["Bilgisayar", "Çevre Birimleri", "Oyuncu Ekipmanları"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000120,
    name: "PC Kulaklık & Mikrofon",
    displayName: "Bilgisayar > Çevre Birimleri > PC Kulaklık & Mikrofon",
    paths: ["Bilgisayar", "Çevre Birimleri", "Kulaklık"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000121,
    name: "Web Kameraları (Webcam)",
    displayName: "Bilgisayar > Çevre Birimleri > Web Kameraları",
    paths: ["Bilgisayar", "Çevre Birimleri", "Webcam"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000122,
    name: "USB Hub & Type-C Çoklayıcılar",
    displayName: "Bilgisayar > Aksesuarlar > USB Hub & Type-C Dönüştürücüler",
    paths: ["Bilgisayar", "Aksesuarlar", "USB Hub & Çoklayıcı"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000123,
    name: "Laptop Çantaları & Kılıfları",
    displayName: "Bilgisayar > Aksesuarlar > Notebook Çantaları & Kılıflar",
    paths: ["Bilgisayar", "Aksesuarlar", "Laptop Çantaları"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000124,
    name: "Laptop Soğutucuları & Standlar",
    displayName: "Bilgisayar > Aksesuarlar > Laptop Soğutucu & Standlar",
    paths: ["Bilgisayar", "Aksesuarlar", "Soğutucu & Stand"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000125,
    name: "Modem & Wi-Fi Router",
    displayName: "Bilgisayar > Ağ & Modem > Wi-Fi Router & Modemler",
    paths: ["Bilgisayar", "Ağ & Modem", "Router & Modem"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000126,
    name: "Wi-Fi Menzil Genişleticiler (Range Extender)",
    displayName: "Bilgisayar > Ağ & Modem > Wi-Fi Menzil Genişleticiler",
    paths: ["Bilgisayar", "Ağ & Modem", "Menzil Genişletici"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000127,
    name: "USB Wi-Fi Adaptörler & Ağ Kartları",
    displayName: "Bilgisayar > Ağ & Modem > USB Wi-Fi Adaptörler",
    paths: ["Bilgisayar", "Ağ & Modem", "Ağ Adaptörleri"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000128,
    name: "Ethernet Ağ Anahtarları (Switch)",
    displayName: "Bilgisayar > Ağ & Modem > Ethernet Switch & Hub",
    paths: ["Bilgisayar", "Ağ & Modem", "Switch"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000129,
    name: "Yazıcılar & Tarayıcılar",
    displayName: "Bilgisayar > Ofis Donanımları > Çok Fonksiyonlu Yazıcılar",
    paths: ["Bilgisayar", "Yazıcı & Tarayıcı", "Yazıcılar"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000130,
    name: "Toner, Kartuş & Mürekkep",
    displayName: "Bilgisayar > Tüketim Malzemeleri > Toner & Kartuş",
    paths: ["Bilgisayar", "Yazıcı Tüketim", "Toner & Kartuş"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000131,
    name: "Barkod Okuyucular & Termal Yazıcılar",
    displayName: "Ofis & Pos > Barkod Okuyucu & Termal Yazıcılar",
    paths: ["Ofis & Kırtasiye", "Barkod Sistemleri", "Barkod Okuyucular"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },

  // --- TELEFON & AKSESUAR ---
  {
    id: 371960,
    name: "Akıllı Cep Telefonları",
    displayName: "Telefon > Cep Telefonları & Akıllı Telefonlar",
    paths: ["Telefon", "Cep Telefonu", "Akıllı Telefonlar"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "phone"
  },
  {
    id: 371965,
    name: "Cep Telefonu Kılıfları",
    displayName: "Telefon > Aksesuarlar > Telefon Kılıfı & Kapaklar",
    paths: ["Telefon", "Telefon Aksesuarları", "Kılıflar"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "phone"
  },
  {
    id: 371966,
    name: "Şarj Cihazı & Adaptörler",
    displayName: "Telefon > Aksesuarlar > Hızlı Şarj Adaptörleri",
    paths: ["Telefon", "Telefon Aksesuarları", "Şarj Aletleri"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "phone"
  },
  {
    id: 371969,
    name: "Şarj & Data Kabloları (Type-C / Lightning)",
    displayName: "Telefon > Aksesuarlar > Type-C, Lightning Kablolar",
    paths: ["Telefon", "Telefon Aksesuarları", "Kablolar"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "phone"
  },
  {
    id: 371970,
    name: "Powerbank Taşınabilir Şarj",
    displayName: "Telefon > Aksesuarlar > Powerbank Taşınabilir Şarj Cihazları",
    paths: ["Telefon", "Telefon Aksesuarları", "Powerbank"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "phone"
  },
  {
    id: 371971,
    name: "Ekran Koruyucu Kırılmaz Cam",
    displayName: "Telefon > Aksesuarlar > Ekran Koruyucu Camlar",
    paths: ["Telefon", "Telefon Aksesuarları", "Ekran Koruyucu"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "phone"
  },
  {
    id: 371967,
    name: "Bluetooth TWS Kulaklıklar",
    displayName: "Telefon > Aksesuarlar > Bluetooth TWS Kulaklık",
    paths: ["Telefon", "Ses Sistemleri", "Bluetooth Kulaklık"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "phone"
  },
  {
    id: 371968,
    name: "Akıllı Saat & Akıllı Bileklik",
    displayName: "Telefon > Giyilebilir Teknoloji > Akıllı Saat & Bileklik",
    paths: ["Telefon", "Giyilebilir Teknoloji", "Akıllı Saat"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "phone"
  },
  {
    id: 371972,
    name: "Tablet Bilgisayarlar & iPad",
    displayName: "Telefon & Mobil > Tablet Bilgisayarlar & iPad",
    paths: ["Telefon", "Tablet", "Tabletler"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "phone"
  },
  {
    id: 371973,
    name: "Araç İçi Telefon Tutucular",
    displayName: "Telefon > Aksesuarlar > Araç İçi Telefon Tutucular & MagSafe",
    paths: ["Telefon", "Telefon Aksesuarları", "Araç Tutucu"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "phone"
  },

  // --- ELEKTRONİK & TV ---
  {
    id: 2000101,
    name: "LED, QLED & OLED Televizyonlar",
    displayName: "Elektronik > TV & Görüntü > LED, QLED & OLED TV",
    paths: ["Elektronik", "TV", "Televizyon"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "electronics"
  },
  {
    id: 2000102,
    name: "Soundbar & Ev Sinema Sistemleri",
    displayName: "Elektronik > Ses Sistemleri > Soundbar & Ev Sinema",
    paths: ["Elektronik", "Ses Sistemleri", "Soundbar"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "electronics"
  },
  {
    id: 2000103,
    name: "Güvenlik & IP Kameralar",
    displayName: "Elektronik > Güvenlik Sistemleri > IP Güvenlik Kameraları",
    paths: ["Elektronik", "Güvenlik", "Kameralar"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "electronics"
  },
  {
    id: 2000104,
    name: "TV Askı Aparatları & Kumandalar",
    displayName: "Elektronik > TV Aksesuarları > Askı Aparatları & Akıllı Kumanda",
    paths: ["Elektronik", "TV Aksesuar", "Askı Aparatı"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "electronics"
  },

  // --- MODA & TEKSTİL ---
  {
    id: 60003858,
    name: "Kadın Günlük Ayakkabı",
    displayName: "Kadın Günlük Ayakkabı",
    paths: ["Giyim / Ayakkabı", "Kadın", "Ayakkabı", "Günlük Ayakkabı"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "fashion"
  },
  {
    id: 60003859,
    name: "Erkek Günlük Ayakkabı",
    displayName: "Erkek Günlük Ayakkabı",
    paths: ["Giyim / Ayakkabı", "Erkek", "Ayakkabı", "Günlük Ayakkabı"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "fashion"
  },
  {
    id: 60003857,
    name: "Kadın Spor Ayakkabı",
    displayName: "Kadın Spor Ayakkabı & Sneaker",
    paths: ["Giyim / Ayakkabı", "Kadın", "Spor Ayakkabı", "Sneaker"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "fashion"
  },
  {
    id: 60003860,
    name: "Erkek Spor Ayakkabı",
    displayName: "Erkek Spor Ayakkabı & Sneaker",
    paths: ["Giyim / Ayakkabı", "Erkek", "Spor Ayakkabı", "Sneaker"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "fashion"
  },
  {
    id: 12101943,
    name: "Kadın Mont & Kaban",
    displayName: "Kadın Mont & Kaban",
    paths: ["Giyim / Ayakkabı", "Kadın", "Dış Giyim", "Mont & Kaban"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "fashion"
  },
  {
    id: 12101944,
    name: "Erkek Mont & Kaban",
    displayName: "Erkek Mont & Kaban",
    paths: ["Giyim / Ayakkabı", "Erkek", "Dış Giyim", "Mont & Kaban"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "fashion"
  },
  {
    id: 12101945,
    name: "Kadın Elbise",
    displayName: "Kadın Elbise",
    paths: ["Giyim / Ayakkabı", "Kadın", "Giyim", "Elbise"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "fashion"
  },
  {
    id: 12101946,
    name: "Kadın Tişört & Bluz",
    displayName: "Kadın Tişört & Bluz",
    paths: ["Giyim / Ayakkabı", "Kadın", "Giyim", "Tişört"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "fashion"
  },
  {
    id: 12101947,
    name: "Erkek Tişört",
    displayName: "Erkek Tişört & Polo",
    paths: ["Giyim / Ayakkabı", "Erkek", "Giyim", "Tişört"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "fashion"
  },
  {
    id: 12101948,
    name: "Kadın Pantolon",
    displayName: "Kadın Pantolon & Jean",
    paths: ["Giyim / Ayakkabı", "Kadın", "Giyim", "Pantolon"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "fashion"
  },
  {
    id: 12101949,
    name: "Erkek Pantolon",
    displayName: "Erkek Pantolon & Jean",
    paths: ["Giyim / Ayakkabı", "Erkek", "Giyim", "Pantolon"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "fashion"
  },

  // --- EV, YAŞAM & SAĞLIK ---
  {
    id: 26012174,
    name: "Tansiyon Aletleri",
    displayName: "Tansiyon Aletleri & Medikal",
    paths: ["Kozmetik & Kişisel Bakım", "Sağlık & Medikal", "Tansiyon Aletleri"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "home"
  },
  {
    id: 26012175,
    name: "Yüz & Cilt Bakım Kremleri",
    displayName: "Yüz & Cilt Bakım Kremleri",
    paths: ["Kozmetik & Kişisel Bakım", "Cilt Bakımı", "Yüz Kremleri"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "home"
  },
  {
    id: 26012176,
    name: "Parfüm & Deodorant",
    displayName: "Parfüm & Deodorant",
    paths: ["Kozmetik & Kişisel Bakım", "Parfüm", "Kadın & Erkek"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "home"
  },
  {
    id: 18021948,
    name: "Batarya & Musluklar",
    displayName: "Batarya & Musluk Sistemleri",
    paths: ["Ev & Yaşam", "Banyo & Mutfak", "Batarya & Musluk"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "home"
  },
  {
    id: 18021949,
    name: "Yatak Örtüsü & Nevresim",
    displayName: "Yatak Örtüsü & Nevresim Takımları",
    paths: ["Ev & Yaşam", "Ev Tekstili", "Nevresim"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "home"
  },
  {
    id: 18021950,
    name: "Kahve & Çay Makineleri",
    displayName: "Kahve & Çay Makineleri",
    paths: ["Elektrikli Ev Aletleri", "Mutfak Aletleri", "Kahve Makineleri"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "home"
  },

  // --- OTO & YAPI MARKET ---
  {
    id: 2147483647,
    name: "Oto Koltuk Kılıfı & Paspas",
    displayName: "Oto Koltuk Kılıfı & Paspas",
    paths: ["Oto & Motosiklet", "Oto Aksesuar", "Koltuk Kılıfları"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "auto"
  },
  {
    id: 60002524,
    name: "Konsept Hediyelikler",
    displayName: "Konsept Hediyelikler & Aksesuar",
    paths: ["Hobi & Eğlence", "Hediyelik Eşya", "Konsept"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "home"
  }
];

// 2. Standard Trendyol Categories
export const TRENDYOL_DEFAULT_CATEGORIES: MarketplaceCategory[] = [
  { id: 412, name: "Kadın Ayakkabı", displayName: "Ayakkabı > Kadın Ayakkabı", paths: ["Kadın", "Ayakkabı"] },
  { id: 413, name: "Erkek Ayakkabı", displayName: "Ayakkabı > Erkek Ayakkabı", paths: ["Erkek", "Ayakkabı"] },
  { id: 414, name: "Spor Ayakkabı & Sneaker", displayName: "Ayakkabı > Spor Ayakkabı", paths: ["Ayakkabı", "Spor Ayakkabı"] },
  { id: 520, name: "Kadın Tişört & Bluz", displayName: "Giyim > Kadın > Tişört", paths: ["Kadın", "Giyim", "Tişört"] },
  { id: 521, name: "Erkek Tişört & Polo", displayName: "Giyim > Erkek > Tişört", paths: ["Erkek", "Giyim", "Tişört"] },
  { id: 522, name: "Kadın Elbise", displayName: "Giyim > Kadın > Elbise", paths: ["Kadın", "Giyim", "Elbise"] },
  { id: 523, name: "Erkek Pantolon & Jean", displayName: "Giyim > Erkek > Pantolon", paths: ["Erkek", "Giyim", "Pantolon"] },
  { id: 601, name: "Cep Telefonu Aksesuarları", displayName: "Elektronik > Telefon > Aksesuarlar", paths: ["Elektronik", "Telefon Aksesuar"] },
  { id: 602, name: "Bluetooth Kulaklık", displayName: "Elektronik > Ses Sistemleri > Kulaklık", paths: ["Elektronik", "Kulaklık"] },
  { id: 701, name: "Cilt Bakım Ürünleri", displayName: "Kozmetik > Cilt Bakımı", paths: ["Kozmetik", "Cilt Bakım"] },
  { id: 702, name: "Parfüm", displayName: "Kozmetik > Parfüm", paths: ["Kozmetik", "Parfüm"] },
  { id: 801, name: "Ev Tekstili", displayName: "Ev & Yaşam > Ev Tekstili", paths: ["Ev & Yaşam", "Tekstil"] },
  { id: 802, name: "Mutfak Gereçleri", displayName: "Ev & Yaşam > Mutfak Gereçleri", paths: ["Ev & Yaşam", "Mutfak"] },
  { id: 901, name: "Oto Aksesuar & Bakım", displayName: "Otomotiv > Oto Aksesuar", paths: ["Otomotiv", "Aksesuar"] }
];

// 3. Standard Amazon Categories
export const AMAZON_DEFAULT_CATEGORIES: MarketplaceCategory[] = [
  { id: "shoes", name: "Ayakkabı & Çanta (Shoes)", displayName: "Moda > Ayakkabı & Çanta", paths: ["Moda", "Ayakkabı"] },
  { id: "apparel", name: "Giyim & Aksesuar (Apparel)", displayName: "Moda > Giyim & Tekstil", paths: ["Moda", "Giyim"] },
  { id: "electronics", name: "Elektronik & Aksesuarlar (Electronics)", displayName: "Elektronik > Çevre Birimleri & Aksesuarlar", paths: ["Elektronik"] },
  { id: "home", name: "Ev & Mutfak (Home & Kitchen)", displayName: "Ev & Mutfak > Yaşam & Dekorasyon", paths: ["Ev & Mutfak"] },
  { id: "beauty", name: "Güzellik & Kişisel Bakım (Beauty)", displayName: "Güzellik & Bakım > Kozmetik", paths: ["Güzellik"] },
  { id: "automotive", name: "Otomotiv Parça & Aksesuarları (Automotive)", displayName: "Otomotiv > Araç Aksesuarları", paths: ["Otomotiv"] },
  { id: "sports", name: "Spor & Outdoor (Sports & Outdoors)", displayName: "Spor > Outdoor & Fitness", paths: ["Spor"] },
  { id: "toys", name: "Oyuncak & Oyunlar (Toys & Games)", displayName: "Bebek & Çocuk > Oyuncak", paths: ["Oyuncak"] },
  { id: "food", name: "Gıda & İçecek (Grocery & Gourmet)", displayName: "Süpermarket > Gıda", paths: ["Gıda"] }
];

// 4. Standard Pazarama Categories
export const PAZARAMA_DEFAULT_CATEGORIES: MarketplaceCategory[] = [
  { id: 101, name: "Giyim & Ayakkabı", displayName: "Moda > Giyim & Ayakkabı", paths: ["Moda"] },
  { id: 102, name: "Elektronik & Telefon", displayName: "Elektronik > Telefon & Aksesuar", paths: ["Elektronik"] },
  { id: 103, name: "Ev & Yaşam", displayName: "Ev & Yaşam > Mobilya & Dekorasyon", paths: ["Ev & Yaşam"] },
  { id: 104, name: "Kozmetik & Kişisel Bakım", displayName: "Kozmetik > Bakım Ürünleri", paths: ["Kozmetik"] },
  { id: 105, name: "Oto Aksesuar", displayName: "Oto & Bahçe > Araç Bakım & Aksesuar", paths: ["Oto & Bahçe"] },
  { id: 106, name: "Anne & Bebek", displayName: "Anne & Bebek > Bebek Giyim & Bakım", paths: ["Anne Bebek"] },
  { id: 107, name: "Spor & Outdoor", displayName: "Spor & Outdoor > Fitness & Kamp", paths: ["Spor Outdoor"] }
];

// Country list for Origin / Menşei
export const MARKETPLACE_ORIGIN_COUNTRIES = [
  "Çin",
  "Türkiye",
  "Almanya",
  "ABD",
  "Japonya",
  "Güney Kore",
  "Vietnam",
  "Tayvan",
  "İtalya",
  "Fransa",
  "İngiltere",
  "Diğer"
];

// Common Category Attribute Definitions (by sector & product category keywords)
export const COMMON_MARKETPLACE_ATTRIBUTES: Record<string, MarketplaceAttribute[]> = {
  usb_storage: [
    { id: "Marka", name: "Marka (Brand)", description: "Ürün markası veya üretici", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "Kapasite", name: "Kapasite / Hafıza", description: "Depolama kapasitesi", mandatory: true, type: "select", values: ["8 GB", "16 GB", "32 GB", "64 GB", "128 GB", "256 GB", "512 GB", "1 TB", "2 TB"], defaultValue: "64 GB" },
    { id: "UsbVersiyonu", name: "USB Versiyonu / Bağlantı", description: "Arayüz standardı", mandatory: true, type: "select", values: ["USB 3.2 Gen 1", "USB 3.1", "USB 3.0", "USB 2.0", "Type-C", "Lightning / OTG"], defaultValue: "USB 3.0" },
    { id: "Mensei", name: "Menşei Ülke (Origin Country)", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Yasal garanti süresi", mandatory: true, type: "select", values: ["12", "24", "36", "60"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "Vergi oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  memory_cards: [
    { id: "Marka", name: "Marka (Brand)", description: "Ürün markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "Kapasite", name: "Kapasite", description: "Kart depolama boyutu", mandatory: true, type: "select", values: ["16 GB", "32 GB", "64 GB", "128 GB", "256 GB", "512 GB", "1 TB"], defaultValue: "64 GB" },
    { id: "KartTipi", name: "Kart / Okuyucu Tipi", description: "Hafıza kartı veya okuyucu formatı", mandatory: true, type: "select", values: ["MicroSDXC", "MicroSDHC", "SDHC / SDXC", "CompactFlash", "Type-C Çoklu Okuyucu", "USB 3.0 Okuyucu"], defaultValue: "MicroSDXC" },
    { id: "HizSinifi", name: "Hız Sınıfı", description: "Okuma/Yazma hız standardı", mandatory: false, type: "select", values: ["UHS-I U3 (V30)", "UHS-I U1 (Class 10)", "Class 10", "A1 / A2"], defaultValue: "UHS-I U3 (V30)" },
    { id: "Mensei", name: "Menşei Ülke (Origin Country)", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["12", "24", "36", "60"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "KDV Oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  ssd_hardware: [
    { id: "Marka", name: "Marka (Brand)", description: "Ürün markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "Kapasite", name: "Disk Kapasitesi", description: "SSD / Sabit Disk boyutu", mandatory: true, type: "select", values: ["120 GB", "240 GB", "250 GB", "480 GB", "500 GB", "512 GB", "1 TB", "2 TB", "4 TB"], defaultValue: "500 GB" },
    { id: "FormFaktoru", name: "Form Faktörü / Arayüz", description: "Bağlantı arayüzü", mandatory: true, type: "select", values: ["M.2 NVMe (PCIe 4.0)", "M.2 NVMe (PCIe 3.0)", "2.5 inç SATA 3", "Harici Taşınabilir Type-C"], defaultValue: "M.2 NVMe (PCIe 4.0)" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["24", "36", "60"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "KDV Oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  phone_accessories: [
    { id: "Marka", name: "Marka (Brand)", description: "Ürün markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "UyumluMarka", name: "Uyumlu Telefon Markası", description: "Aksesuarın uyumlu olduğu telefon markası", mandatory: true, type: "select", values: ["Apple iPhone", "Samsung", "Xiaomi", "Huawei", "Oppo", "Evrensel (Tüm Markalar)"], defaultValue: "Apple iPhone" },
    { id: "UyumluModel", name: "Uyumlu Model", description: "Uyumlu telefon model adı (Örn: iPhone 15 Pro, S24)", mandatory: false, type: "text", placeholder: "Örn: iPhone 15 Pro / Galaxy S24" },
    { id: "BaglantiTipi", name: "Bağlantı / Şarj Tipi", description: "Kablo / adaptör çıkışı", mandatory: false, type: "select", values: ["Type-C", "Lightning", "Micro USB", "Kablosuz (MagSafe / Qi)", "Yok"], defaultValue: "Type-C" },
    { id: "GucWatt", name: "Güç Çıkışı (Watt)", description: "Şarj adaptörü veya kablo kapasitesi", mandatory: false, type: "select", values: ["20W", "25W", "30W", "45W", "65W", "100W", "Yok"], defaultValue: "20W" },
    { id: "Renk", name: "Renk (Color)", description: "Ürün rengi", mandatory: true, type: "select", values: ["Siyah", "Beyaz", "Şeffaf", "Mavi", "Mor", "Yeşil", "Gri", "Gümüş", "Gold", "Pembe"], defaultValue: "Siyah" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["12", "24", "36"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "Vergi oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  audio_headphone: [
    { id: "Marka", name: "Marka (Brand)", description: "Kulaklık markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "KulaklikTipi", name: "Kulaklık Türü", description: "Form faktörü", mandatory: true, type: "select", values: ["TWS Tam Kablosuz Kulakiçi", "Kulaküstü Bluetooth (ANC)", "Kablolu Kulakiçi", "Gaming Oyuncu Kulaklığı"], defaultValue: "TWS Tam Kablosuz Kulakiçi" },
    { id: "BluetoothSurumu", name: "Bluetooth Versiyonu", description: "Kablosuz bağlantı sürümü", mandatory: false, type: "select", values: ["Bluetooth 5.4", "Bluetooth 5.3", "Bluetooth 5.2", "Bluetooth 5.0", "Kablolu"], defaultValue: "Bluetooth 5.3" },
    { id: "GurultuEngelleme", name: "Aktif Gürültü Engelleme (ANC)", description: "ANC özelliği", mandatory: false, type: "select", values: ["Var (ANC)", "Yok / Pasif Yalıtım"], defaultValue: "Yok / Pasif Yalıtım" },
    { id: "Renk", name: "Renk", description: "Kulaklık rengi", mandatory: true, type: "select", values: ["Siyah", "Beyaz", "Gri", "Mavi", "Bej", "Pembe"], defaultValue: "Siyah" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["12", "24", "36"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "KDV Oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  smartwatch: [
    { id: "Marka", name: "Marka (Brand)", description: "Akıllı saat markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "EkranBoyutu", name: "Ekran Boyutu / Tipi", description: "Ekran özellikleri", mandatory: false, type: "select", values: ["1.96 inç AMOLED", "1.75 inç AMOLED", "1.69 inç IPS", "1.4 inç Yuvarlak", "1.83 inç HD"], defaultValue: "1.96 inç AMOLED" },
    { id: "UyumluSistem", name: "Uyumlu İşletim Sistemi", description: "Bağlantı desteği", mandatory: true, type: "select", values: ["Android & iOS (Evrensel)", "Yalnızca iOS (Apple)", "Yalnızca Android"], defaultValue: "Android & iOS (Evrensel)" },
    { id: "KordonRengi", name: "Kordon / Kasa Rengi", description: "Renk", mandatory: true, type: "select", values: ["Siyah", "Gümüş", "Gri", "Turuncu", "Lacivert", "Gold", "Pembe"], defaultValue: "Siyah" },
    { id: "SuGecirmezlik", name: "Suya Dayanıklılık", description: "Su koruma sertifikası", mandatory: false, type: "select", values: ["IP68", "IP67", "5 ATM", "Suya Dayanıklı Değil"], defaultValue: "IP68" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["12", "24", "36"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "KDV Oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  apparel: [
    { id: "Marka", name: "Marka (Brand)", description: "Ürünün tescilli markası veya üretici", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "Beden", name: "Beden / Numara (Size)", description: "Kıyafet veya ayakkabı bedeni", mandatory: true, type: "select", values: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "Standart", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"], defaultValue: "M" },
    { id: "Renk", name: "Renk (Color)", description: "Ana ürün rengi", mandatory: true, type: "select", values: ["Siyah", "Beyaz", "Gri", "Lacivert", "Mavi", "Kırmızı", "Yeşil", "Sarı", "Bej", "Kahverengi", "Çok Renkli"], defaultValue: "Siyah" },
    { id: "Cinsiyet", name: "Cinsiyet (Gender)", description: "Hedef kitle cinsiyeti", mandatory: true, type: "select", values: ["Erkek", "Kadın", "Unisex", "Kız Çocuk", "Erkek Çocuk", "Bebek"], defaultValue: "Unisex" },
    { id: "Materyal", name: "Materyal / Kumaş (Material)", description: "Kumaş veya malzeme türü", mandatory: false, type: "select", values: ["%100 Pamuk", "Pamuk & Polyester", "Keten", "Kot / Denim", "Deri / Suni Deri", "Polyester", "Triko / Yün"], defaultValue: "%100 Pamuk" },
    { id: "Mensei", name: "Menşei (Origin Country)", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Türkiye" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Tüketici garanti süresi", mandatory: true, type: "select", values: ["6", "12", "24"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "Vergi oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "10" }
  ],
  electronics: [
    { id: "Marka", name: "Marka (Brand)", description: "Ürünün üretici markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "Model", name: "Model Kodu", description: "Cihaz veya parça model adı", mandatory: false, type: "text", defaultValue: "$product.model" },
    { id: "Renk", name: "Renk (Color)", description: "Cihaz veya kılıf rengi", mandatory: true, type: "select", values: ["Siyah", "Beyaz", "Gümüş", "Uzay Grisi", "Mavi", "Kırmızı", "Şeffaf"], defaultValue: "Siyah" },
    { id: "UyumluMarka", name: "Uyumlu Cihaz / Marka", description: "Aksesuarın uyumlu olduğu telefon/cihaz", mandatory: false, type: "text", defaultValue: "Evrensel" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Yasal garanti süresi", mandatory: true, type: "select", values: ["12", "24", "36", "60"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "Vergi oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  cosmetics: [
    { id: "Marka", name: "Marka (Brand)", description: "Kozmetik markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "Hacim", name: "Hacim / Gramaj", description: "Ürün net ağırlığı veya hacmi (ml, gr)", mandatory: true, type: "text", defaultValue: "100 ml" },
    { id: "CiltTipi", name: "Cilt Tipi", description: "Uyumlu cilt türü", mandatory: false, type: "select", values: ["Tüm Cilt Tipleri", "Kuru", "Yağlı", "Karma", "Hassas"], defaultValue: "Tüm Cilt Tipleri" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Türkiye" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti veya raf ömrü", mandatory: true, type: "select", values: ["12", "24", "36"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "Vergi oranı", mandatory: true, type: "select", values: ["10", "20"], defaultValue: "20" }
  ],
  auto: [
    { id: "Marka", name: "Marka (Brand)", description: "Ürün markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "UyumluAracMarkasi", name: "Uyumlu Araç Markası", description: "Uyumlu araç markası veya Evrensel", mandatory: true, type: "select", values: ["Evrensel (Tüm Araçlar)", "Volkswagen", "Ford", "Renault", "Fiat", "Toyota", "BMW", "Mercedes-Benz", "Hyundai", "Honda", "Peugeot", "Diğer"], defaultValue: "Evrensel (Tüm Araçlar)" },
    { id: "UrunTipi", name: "Ürün Tipi / Kategorisi", description: "Aksesuar türü", mandatory: false, type: "select", values: ["Telefon Tutucu / Şarj", "Oto Paspas", "Koltuk Kılıfı & Minder", "FM Transmitter & Bluetooth", "Araç İçi Kamera", "Bakım & Temizlik", "Aydınlatma / LED"], defaultValue: "Telefon Tutucu / Şarj" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["12", "24", "36"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "Vergi oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  home_kitchen: [
    { id: "Marka", name: "Marka (Brand)", description: "Ürün markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "GucWatt", name: "Güç (Watt)", description: "Elektrikli cihaz güç tüketimi", mandatory: false, type: "text", placeholder: "Örn: 1500W" },
    { id: "Materyal", name: "Materyal / Malzeme", description: "Gövde ve parça materyali", mandatory: false, type: "select", values: ["Paslanmaz Çelik", "Plastik", "Cam", "Döküm / Granit", "Seramik", "Ahşap / Bambu"], defaultValue: "Paslanmaz Çelik" },
    { id: "Renk", name: "Renk", description: "Ürün rengi", mandatory: true, type: "select", values: ["Siyah", "Beyaz", "Inox / Gri", "Kırmızı", "Rose Gold", "Antrasit"], defaultValue: "Siyah" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["12", "24", "36"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "Vergi oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  general: [
    { id: "Marka", name: "Marka (Brand)", description: "Ürün markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "Mensei", name: "Menşei Ülke (Origin Country)", description: "Üretim yeri", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi (Ay cinsinden)", mandatory: true, type: "select", values: ["6", "12", "24", "36"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "KDV Vergi Oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ]
};

// Returns relevant attributes based on category name or category path
export function getAttributesForCategory(catName: string, paths: string[] = []): MarketplaceAttribute[] {
  const text = `${catName} ${paths.join(" ")}`.toLowerCase();

  // 1. USB Flash Bellek & Veri Depolama
  if (
    text.includes("usb") ||
    text.includes("flash bellek") ||
    text.includes("flash drive") ||
    text.includes("bellekler")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.usb_storage;
  }

  // 2. Kart Okuyucu & Hafıza Kartları
  if (
    text.includes("kart okuyucu") ||
    text.includes("hafıza kart") ||
    text.includes("microsd") ||
    text.includes("sd kart")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.memory_cards;
  }

  // 3. SSD & Sabit Disk & PC Donanım
  if (
    text.includes("ssd") ||
    text.includes("harddisk") ||
    text.includes("sabit disk") ||
    text.includes("m.2") ||
    text.includes("nvme") ||
    text.includes("ram") ||
    text.includes("anakart") ||
    text.includes("işlemci") ||
    text.includes("ekran kartı")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.ssd_hardware;
  }

  // 4. Telefon Aksesuar / Kılıf / Şarj
  if (
    text.includes("telefon") ||
    text.includes("kılıf") ||
    text.includes("şarj") ||
    text.includes("powerbank") ||
    text.includes("kablo") ||
    text.includes("ekran koruyucu")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.phone_accessories;
  }

  // 5. Kulaklık & Ses
  if (
    text.includes("kulaklık") ||
    text.includes("headphone") ||
    text.includes("earphone") ||
    text.includes("tws") ||
    text.includes("soundbar") ||
    text.includes("hoparlör")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.audio_headphone;
  }

  // 6. Akıllı Saat & Bileklik
  if (
    text.includes("akıllı saat") ||
    text.includes("smart watch") ||
    text.includes("bileklik") ||
    text.includes("smartband")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.smartwatch;
  }

  // 7. Giyim & Ayakkabı
  if (
    text.includes("ayakkabı") ||
    text.includes("giyim") ||
    text.includes("tişört") ||
    text.includes("pantolon") ||
    text.includes("elbise") ||
    text.includes("kaban") ||
    text.includes("mont") ||
    text.includes("tekstil") ||
    text.includes("apparel") ||
    text.includes("shoes")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.apparel;
  }

  // 8. Oto Aksesuar
  if (
    text.includes("oto") ||
    text.includes("araba") ||
    text.includes("motosiklet") ||
    text.includes("automotive")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.auto;
  }

  // 9. Ev & Mutfak
  if (
    text.includes("mutfak") ||
    text.includes("kahve") ||
    text.includes("süpürge") ||
    text.includes("tencere") ||
    text.includes("küçük ev aletleri")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.home_kitchen;
  }

  // 10. Kozmetik
  if (
    text.includes("kozmetik") ||
    text.includes("parfüm") ||
    text.includes("krem") ||
    text.includes("cilt") ||
    text.includes("sağlık") ||
    text.includes("beauty")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.cosmetics;
  }

  // 11. Genel Elektronik
  if (
    text.includes("elektronik") ||
    text.includes("tv") ||
    text.includes("televizyon") ||
    text.includes("monitör") ||
    text.includes("klavye") ||
    text.includes("mouse") ||
    text.includes("electronics")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.electronics;
  }

  return COMMON_MARKETPLACE_ATTRIBUTES.general;
}

// Normalizes Turkish characters and punctuation for clean matching
export function normalizeCategoryText(str: string): string {
  if (!str) return "";
  return str
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Smart Auto-Match Algorithm
export function suggestMarketplaceCategory(
  localCategoryName: string,
  marketplaceCategories: MarketplaceCategory[]
): { bestMatch: MarketplaceCategory | null; score: number } {
  if (!localCategoryName || !marketplaceCategories || marketplaceCategories.length === 0) {
    return { bestMatch: null, score: 0 };
  }

  // Handle hierarchical path like "BELLEK&HAFIZA KARTLARI > USB BELLEK"
  const rawParts = localCategoryName.split('>').map((p) => p.trim()).filter(Boolean);
  const leafName = rawParts[rawParts.length - 1] || localCategoryName;
  const parentName = rawParts.length > 1 ? rawParts[0] : '';

  const localNorm = normalizeCategoryText(localCategoryName);
  const leafNorm = normalizeCategoryText(leafName);
  const parentNorm = parentName ? normalizeCategoryText(parentName) : '';

  const localTokens = localNorm.split(" ").filter((t) => t.length > 1 && !["ve", "ile", "de", "da"].includes(t));
  const leafTokens = leafNorm.split(" ").filter((t) => t.length > 1 && !["ve", "ile", "de", "da"].includes(t));

  let bestMatch: MarketplaceCategory | null = null;
  let bestScore = 0;

  for (const cat of marketplaceCategories) {
    const catNameNorm = normalizeCategoryText(cat.name || "");
    const fullPathNorm = normalizeCategoryText(`${cat.name} ${(cat.paths || []).join(" ")} ${cat.displayName || ""}`);

    // Exact leaf match (e.g. "USB BELLEK" -> "USB Flash Bellekler" or exact)
    if (catNameNorm === leafNorm || catNameNorm === localNorm) {
      return { bestMatch: cat, score: 100 };
    }

    let score = 0;

    // Substring containment for leaf subcategory
    if (catNameNorm.includes(leafNorm) || leafNorm.includes(catNameNorm)) {
      score += 70;
    } else if (catNameNorm.includes(localNorm) || localNorm.includes(catNameNorm)) {
      score += 60;
    }

    // Leaf token matching (higher weight)
    let matchedLeafTokens = 0;
    for (const token of leafTokens) {
      if (catNameNorm.includes(token)) {
        matchedLeafTokens += 3;
      } else if (fullPathNorm.includes(token)) {
        matchedLeafTokens += 1.5;
      }
    }
    if (leafTokens.length > 0) {
      score += (matchedLeafTokens / (leafTokens.length * 3)) * 40;
    }

    // Parent context bonus if parent matches path or category
    if (parentNorm && (fullPathNorm.includes(parentNorm) || parentNorm.includes(catNameNorm))) {
      score += 15;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = cat;
    }
  }

  return {
    bestMatch: bestScore >= 35 ? bestMatch : null,
    score: Math.min(100, Math.round(bestScore))
  };
}
