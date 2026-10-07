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
    id: 970, // Hepsiburada Live Category ID: 970 (Usb Bellek)
    name: "USB Flash Bellekler",
    displayName: "Bilgisayar > Veri Depolama > Usb Bellek",
    paths: ["Bilgisayar", "Veri Depolama", "Usb Bellek"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 698, // Hepsiburada Live Category ID: 698 (Kart Okuyucular)
    name: "Kart Okuyucular",
    displayName: "Foto / Kamera > Aksesuarlar > Hafıza Kartı ve Kart Okuyucuları > Kart Okuyucular",
    paths: ["Foto / Kamera", "Aksesuarlar", "Hafıza Kartı ve Kart Okuyucuları", "Kart Okuyucular"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1100011, // Hepsiburada Live Category ID: 1100011 (Sd Kartlar)
    name: "Sd Kartlar",
    displayName: "Foto / Kamera > Aksesuarlar > Hafıza Kartı ve Kart Okuyucuları > Sd Kartlar",
    paths: ["Foto / Kamera", "Aksesuarlar", "Hafıza Kartı ve Kart Okuyucuları", "Sd Kartlar"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 60003724, // Hepsiburada Live Category ID: 60003724 (Micro Sd Kartlar)
    name: "Hafıza Kartları (MicroSD / SD)",
    displayName: "Foto / Kamera > Aksesuarlar > Hafıza Kartı ve Kart Okuyucuları > Micro Sd Kartlar",
    paths: ["Foto / Kamera", "Aksesuarlar", "Hafıza Kartı ve Kart Okuyucuları", "Micro Sd Kartlar"],
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
    id: 1000181,
    name: "Kablo Switch Çoklayıcılar",
    displayName: "Bilgisayar Sistemleri ve Ekipmanları > Bilgisayar Aksesuarları > Kablo Switch Çoklayıcılar",
    paths: ["Bilgisayar Sistemleri ve Ekipmanları", "Bilgisayar Aksesuarları", "Kablo Switch Çoklayıcılar"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000182,
    name: "Kablo ve Dönüştürücüler",
    displayName: "Bilgisayar Sistemleri ve Ekipmanları > Bilgisayar Aksesuarları > Kablo ve Dönüştürücüler",
    paths: ["Bilgisayar Sistemleri ve Ekipmanları", "Bilgisayar Aksesuarları", "Kablo ve Dönüştürücüler"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000183,
    name: "HDMI, DisplayPort & VGA Görüntü Kabloları",
    displayName: "Bilgisayar Sistemleri ve Ekipmanları > Bilgisayar Aksesuarları > HDMI, DisplayPort & VGA Kablolar",
    paths: ["Bilgisayar Sistemleri ve Ekipmanları", "Bilgisayar Aksesuarları", "Görüntü Kabloları"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000184,
    name: "Ağ & Ethernet Kabloları (Patch & Cat6 / Cat7 / Cat8)",
    displayName: "Bilgisayar Sistemleri ve Ekipmanları > Bilgisayar Aksesuarları > Ağ & Ethernet Kabloları",
    paths: ["Bilgisayar Sistemleri ve Ekipmanları", "Bilgisayar Aksesuarları", "Ethernet Kabloları"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000185,
    name: "USB Şarj, Data Kablo & Adaptörler",
    displayName: "Bilgisayar Sistemleri ve Ekipmanları > Bilgisayar Aksesuarları > USB Kablo & Adaptörler",
    paths: ["Bilgisayar Sistemleri ve Ekipmanları", "Bilgisayar Aksesuarları", "USB Kabloları"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000186,
    name: "Güç, Kasa & SATA Adaptör Kabloları",
    displayName: "Bilgisayar Sistemleri ve Ekipmanları > Bilgisayar Aksesuarları > Güç & Adaptör Kabloları",
    paths: ["Bilgisayar Sistemleri ve Ekipmanları", "Bilgisayar Aksesuarları", "Güç Kabloları"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000187,
    name: "Ses & Müzik Bağlantı Kabloları (3.5mm Aux / RCA / Optik)",
    displayName: "Bilgisayar Sistemleri ve Ekipmanları > Bilgisayar Aksesuarları > Ses & Müzik Kabloları",
    paths: ["Bilgisayar Sistemleri ve Ekipmanları", "Bilgisayar Aksesuarları", "Ses Kabloları"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000188,
    name: "Bilgisayar Aksesuarları (Genel)",
    displayName: "Bilgisayar Sistemleri ve Ekipmanları > Bilgisayar Aksesuarları > Bilgisayar Aksesuarları",
    paths: ["Bilgisayar Sistemleri ve Ekipmanları", "Bilgisayar Aksesuarları"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000189,
    name: "Bilgisayar Donanım & Çevre Birimi Aksesuarları",
    displayName: "Bilgisayar Sistemleri ve Ekipmanları > Çevre Birimleri > Aksesuarlar",
    paths: ["Bilgisayar Sistemleri ve Ekipmanları", "Çevre Birimleri", "Aksesuarlar"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000190,
    name: "Notebook Adaptörleri",
    displayName: "Bilgisayar Sistemleri ve Ekipmanları > Bilgisayar Aksesuarları > Notebook Aksesuarları > Notebook Adaptörleri",
    paths: ["Bilgisayar Sistemleri ve Ekipmanları", "Bilgisayar Aksesuarları", "Notebook Aksesuarları", "Notebook Adaptörleri"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000191,
    name: "Dell Notebook Adaptörleri",
    displayName: "Bilgisayar Sistemleri ve Ekipmanları > Bilgisayar Aksesuarları > Notebook Aksesuarları > Notebook Adaptörleri > Dell Notebook Adaptörleri",
    paths: ["Bilgisayar Sistemleri ve Ekipmanları", "Bilgisayar Aksesuarları", "Notebook Aksesuarları", "Notebook Adaptörleri", "Dell Notebook Adaptörleri"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000192,
    name: "Asus Notebook Adaptörleri",
    displayName: "Bilgisayar Sistemleri ve Ekipmanları > Bilgisayar Aksesuarları > Notebook Aksesuarları > Notebook Adaptörleri > Asus Notebook Adaptörleri",
    paths: ["Bilgisayar Sistemleri ve Ekipmanları", "Bilgisayar Aksesuarları", "Notebook Aksesuarları", "Notebook Adaptörleri", "Asus Notebook Adaptörleri"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000193,
    name: "HP Notebook Adaptörleri",
    displayName: "Bilgisayar Sistemleri ve Ekipmanları > Bilgisayar Aksesuarları > Notebook Aksesuarları > Notebook Adaptörleri > HP Notebook Adaptörleri",
    paths: ["Bilgisayar Sistemleri ve Ekipmanları", "Bilgisayar Aksesuarları", "Notebook Aksesuarları", "Notebook Adaptörleri", "HP Notebook Adaptörleri"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000194,
    name: "Lenovo Notebook Adaptörleri",
    displayName: "Bilgisayar Sistemleri ve Ekipmanları > Bilgisayar Aksesuarları > Notebook Aksesuarları > Notebook Adaptörleri > Lenovo Notebook Adaptörleri",
    paths: ["Bilgisayar Sistemleri ve Ekipmanları", "Bilgisayar Aksesuarları", "Notebook Aksesuarları", "Notebook Adaptörleri", "Lenovo Notebook Adaptörleri"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000195,
    name: "Acer Notebook Adaptörleri",
    displayName: "Bilgisayar Sistemleri ve Ekipmanları > Bilgisayar Aksesuarları > Notebook Aksesuarları > Notebook Adaptörleri > Acer Notebook Adaptörleri",
    paths: ["Bilgisayar Sistemleri ve Ekipmanları", "Bilgisayar Aksesuarları", "Notebook Aksesuarları", "Notebook Adaptörleri", "Acer Notebook Adaptörleri"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000196,
    name: "Apple Macbook Adaptör & Şarj Cihazları",
    displayName: "Bilgisayar Sistemleri ve Ekipmanları > Bilgisayar Aksesuarları > Notebook Aksesuarları > Notebook Adaptörleri > Apple Macbook Adaptörleri",
    paths: ["Bilgisayar Sistemleri ve Ekipmanları", "Bilgisayar Aksesuarları", "Notebook Aksesuarları", "Notebook Adaptörleri", "Apple Macbook Adaptörleri"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000197,
    name: "Muadil & Evrensel Notebook Adaptörleri",
    displayName: "Bilgisayar Sistemleri ve Ekipmanları > Bilgisayar Aksesuarları > Notebook Aksesuarları > Notebook Adaptörleri > Muadil Notebook Adaptörleri",
    paths: ["Bilgisayar Sistemleri ve Ekipmanları", "Bilgisayar Aksesuarları", "Notebook Aksesuarları", "Notebook Adaptörleri", "Muadil Notebook Adaptörleri"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000198,
    name: "Notebook Bataryaları & Piller",
    displayName: "Bilgisayar Sistemleri ve Ekipmanları > Bilgisayar Aksesuarları > Notebook Aksesuarları > Notebook Bataryaları",
    paths: ["Bilgisayar Sistemleri ve Ekipmanları", "Bilgisayar Aksesuarları", "Notebook Aksesuarları", "Notebook Bataryaları"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 676,
    name: "Notebook Çantaları",
    displayName: "Bilgisayar > Aksesuarlar > Notebook Çantaları",
    paths: ["Bilgisayar", "Aksesuarlar", "Notebook Çantaları"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 98,
    name: "Dizüstü Bilgisayar (Laptop / Notebook)",
    displayName: "Bilgisayar > Bilgisayarlar > Dizüstü Bilgisayar (Laptop)",
    paths: ["Bilgisayar", "Bilgisayarlar", "Dizüstü Bilgisayar"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 111001,
    name: "Mini Masaüstü & All-in-One Bilgisayarlar",
    displayName: "Bilgisayar > Bilgisayarlar > Mini Masaüstü & All-in-One",
    paths: ["Bilgisayar", "Bilgisayarlar", "Mini Masaüstü"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 106861,
    name: "Notebook Standları & Soğutucular",
    displayName: "Bilgisayar > Aksesuarlar > Notebook Standları & Soğutucular",
    paths: ["Bilgisayar", "Aksesuarlar", "Notebook Standları"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 47,
    name: "Bellek (RAM - DDR4 & DDR5)",
    displayName: "Bilgisayar > Bileşenler > Bellek (RAM)",
    paths: ["Bilgisayar", "Bileşenler", "Bellek (RAM)"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 51,
    name: "Klavyeler (Kablolu & Kablosuz)",
    displayName: "Bilgisayar > Çevre Birimleri > Klavye",
    paths: ["Bilgisayar", "Çevre Birimleri", "Klavye"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 52,
    name: "Mouse / Fare (Kablolu & Kablosuz)",
    displayName: "Bilgisayar > Çevre Birimleri > Mouse",
    paths: ["Bilgisayar", "Çevre Birimleri", "Mouse"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 29,
    name: "Mouse Pad & Masa Pedleri",
    displayName: "Bilgisayar > Aksesuarlar > Mouse Pad",
    paths: ["Bilgisayar", "Aksesuarlar", "Mouse Pad"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 3007055,
    name: "Klavye & Mouse Setler",
    displayName: "Bilgisayar > Çevre Birimleri > Klavye & Mouse Setler",
    paths: ["Bilgisayar", "Çevre Birimleri", "Klavye & Mouse Setler"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 57,
    name: "Monitörler (LED / IPS / Gaming)",
    displayName: "Bilgisayar > Çevre Birimleri > Monitörler",
    paths: ["Bilgisayar", "Çevre Birimleri", "Monitörler"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 100225,
    name: "Taşınabilir Harici Harddiskler",
    displayName: "Bilgisayar > Veri Depolama > Taşınabilir Diskler",
    paths: ["Bilgisayar", "Veri Depolama", "Taşınabilir Diskler"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 100221,
    name: "Dahili Sabit Diskler (HDD)",
    displayName: "Bilgisayar > Bileşenler > Sabit Diskler",
    paths: ["Bilgisayar", "Bileşenler", "Sabit Diskler"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 105307,
    name: "Bilgisayar Kablo & Dönüştürücüler",
    displayName: "Bilgisayar > Aksesuarlar > Kablo & Dönüştürücüler",
    paths: ["Bilgisayar", "Aksesuarlar", "Kablo & Dönüştürücüler"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 16113,
    name: "Şarj Cihazları & Hızlı Şarj Adaptörleri",
    displayName: "Telefon > Aksesuarlar > Şarj Cihazları",
    paths: ["Telefon", "Telefon Aksesuarları", "Şarj Cihazları"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "phone"
  },
  {
    id: 29010123,
    name: "Telefon Şarj & Data Kabloları",
    displayName: "Telefon > Aksesuarlar > Şarj Kabloları",
    paths: ["Telefon", "Telefon Aksesuarları", "Şarj Kabloları"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "phone"
  },
  {
    id: 1000123,
    name: "Laptop Çantaları & Kılıfları",
    displayName: "Bilgisayar > Aksesuarlar > Notebook Çantaları & Kılıflar > Laptop Çantaları & Kılıfları",
    paths: ["Bilgisayar", "Aksesuarlar", "Notebook Çantaları & Kılıflar", "Laptop Çantaları & Kılıfları"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000135,
    name: "Notebook Sırt Çantaları (15-16 inç / 17 inç)",
    displayName: "Bilgisayar > Aksesuarlar > Notebook Çantaları & Kılıflar > Notebook Sırt Çantaları",
    paths: ["Bilgisayar", "Aksesuarlar", "Notebook Çantaları & Kılıflar", "Notebook Sırt Çantaları"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000136,
    name: "Notebook El & Evrak Çantaları",
    displayName: "Bilgisayar > Aksesuarlar > Notebook Çantaları & Kılıflar > Notebook Evrak Çantaları",
    paths: ["Bilgisayar", "Aksesuarlar", "Notebook Çantaları & Kılıflar", "Notebook Evrak Çantaları"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000137,
    name: "Laptop Kılıf & Sleeve",
    displayName: "Bilgisayar > Aksesuarlar > Notebook Çantaları & Kılıflar > Laptop Kılıf & Sleeve",
    paths: ["Bilgisayar", "Aksesuarlar", "Notebook Çantaları & Kılıflar", "Laptop Kılıf & Sleeve"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000138,
    name: "Sunum Kumandaları & Lazer Pointer (Presenter)",
    displayName: "Bilgisayar > Aksesuarlar > Sunum Kumandaları & Lazer Pointer (Presenter)",
    paths: ["Bilgisayar", "Aksesuarlar", "Sunum Kumandaları & Lazer Pointer"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000139,
    name: "Projeksiyon Cihazları & Sunum Ekipmanları",
    displayName: "Bilgisayar > Çevre Birimleri > Projeksiyon Cihazları & Sunum Ekipmanları",
    paths: ["Bilgisayar", "Çevre Birimleri", "Projeksiyon Cihazları"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 2000201,
    name: "Dijital Fotoğraf Makineleri & Kameralar (DSLR / Aynasız)",
    displayName: "Fotoğraf & Kamera > Fotoğraf Makineleri > Dijital Fotoğraf Makineleri",
    paths: ["Fotoğraf & Kamera", "Fotoğraf Makineleri", "Dijital Fotoğraf Makineleri"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "electronics"
  },
  {
    id: 2000202,
    name: "Tripod & Monopodlar",
    displayName: "Fotoğraf & Kamera > Fotoğrafçılık Aksesuarları > Tripod & Monopodlar",
    paths: ["Fotoğraf & Kamera", "Fotoğrafçılık Aksesuarları", "Tripod & Monopodlar"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "electronics"
  },
  {
    id: 2000203,
    name: "Fotoğraf Makinesi & Kamera Çantaları",
    displayName: "Fotoğraf & Kamera > Fotoğrafçılık Aksesuarları > Kamera Çantaları & Kılıflar",
    paths: ["Fotoğraf & Kamera", "Fotoğrafçılık Aksesuarları", "Kamera Çantaları & Kılıflar"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "electronics"
  },
  {
    id: 2000204,
    name: "Lens & Kamera Filtreleri",
    displayName: "Fotoğraf & Kamera > Fotoğrafçılık Aksesuarları > Lens & Filtreler",
    paths: ["Fotoğraf & Kamera", "Fotoğrafçılık Aksesuarları", "Lens & Filtreler"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "electronics"
  },
  {
    id: 2000205,
    name: "Tepe Flaş, Stüdyo Işık & Ring Light",
    displayName: "Fotoğraf & Kamera > Fotoğrafçılık Aksesuarları > Stüdyo & Flaş Aydınlatma",
    paths: ["Fotoğraf & Kamera", "Fotoğrafçılık Aksesuarları", "Stüdyo & Flaş Aydınlatma"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "electronics"
  },
  {
    id: 2000206,
    name: "Gimbal & Kamera Sabitleyiciler",
    displayName: "Fotoğraf & Kamera > Fotoğrafçılık Aksesuarları > Gimbal & Sabitleyiciler",
    paths: ["Fotoğraf & Kamera", "Fotoğrafçılık Aksesuarları", "Gimbal & Sabitleyiciler"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "electronics"
  },
  {
    id: 2000207,
    name: "Aksiyon Kameralar & Aksesuarları",
    displayName: "Fotoğraf & Kamera > Kameralar > Aksiyon Kameralar",
    paths: ["Fotoğraf & Kamera", "Kameralar", "Aksiyon Kameralar"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "electronics"
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
    name: "Barkod Okuyucular, Termal Yazıcı, El Terminali & Barkod Sarf",
    displayName: "Ofis & Pos > Barkod Okuyucu, El Terminali & Termal Yazıcılar",
    paths: ["Ofis & Kırtasiye", "Barkod Sistemleri", "Barkod Okuyucu", "El Terminali", "Barkod Sarf"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000132,
    name: "Harddisk Kutusu & Disk Kızağı (HDD Caddy)",
    displayName: "Bilgisayar > Veri Depolama > Harddisk Kutusu & Disk Kızağı",
    paths: ["Bilgisayar", "Veri Depolama", "Harddisk Kutusu", "HDD Caddy"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000133,
    name: "Teknoloji Kimyasalları, Contact Cleaner, Degreaser & Termal Macun",
    displayName: "Bilgisayar > Bakım & Temizlik > Teknoloji Kimyasalları & Termal Macun",
    paths: ["Bilgisayar", "Bakım & Temizlik", "Teknoloji Kimyasalları", "Contact Cleaner", "Degreaser", "Soğutma"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 1000134,
    name: "Akım Korumalı Priz, Grup Priz & Uzatma Kablosu",
    displayName: "Elektronik > Elektrik & Aydınlatma > Akım Korumalı Priz & Grup Priz",
    paths: ["Elektronik", "Elektrik", "Priz", "Akım Korumalı Priz"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "electronics"
  },
  {
    id: 1000140,
    name: "Dokunmatik Kalem (Stylus) & Grafik Tablet Kalemi",
    displayName: "Bilgisayar & Tablet > Aksesuarlar > Dokunmatik Kalem (Stylus)",
    paths: ["Bilgisayar", "Tablet Aksesuarları", "Dokunmatik Kalem", "Stylus"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "computer"
  },
  {
    id: 371974,
    name: "Telsiz & Masaüstü DECT Telefonlar",
    displayName: "Telefon > Sabit & Telsiz Telefonlar > DECT Telefon",
    paths: ["Telefon", "Telsiz Telefon", "Dect Telefon"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "phone"
  },
  {
    id: 2000105,
    name: "Taşınabilir Bluetooth Hoparlör & Kablolu/Kablosuz Speaker",
    displayName: "Elektronik > Ses Sistemleri > Bluetooth Hoparlör & Speaker",
    paths: ["Elektronik", "Ses Sistemleri", "Hoparlör", "Speaker", "Bluetooth Hoparlör"],
    leaf: true,
    available: true,
    status: "ACTIVE",
    sector: "electronics"
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
    name: "Tansiyon Aletleri, Medikal Cihazlar & Hasta Bakım (Boru Tipi Yatak / Hasta Önlüğü)",
    displayName: "Sağlık & Medikal > Tansiyon Aleti, Medikal Cihaz & Hasta Bakım",
    paths: ["Kozmetik & Kişisel Bakım", "Sağlık & Medikal", "Tansiyon Aletleri", "Hasta Bakım", "Boru Tipi Yatak", "Hasta Önlüğü"],
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
    name: "Küçük Ev Aletleri, Blender, Kahve & Çay Makineleri",
    displayName: "Elektrikli Ev Aletleri > Küçük Ev Aletleri, Blender & Kahve Makineleri",
    paths: ["Elektrikli Ev Aletleri", "Küçük Ev Aletleri", "Mutfak Aletleri", "Blender", "Kahve Makineleri"],
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

// 2. Standard Trendyol Leaf Categories (Full Multi-Sector Child Taxonomy)
export const TRENDYOL_DEFAULT_CATEGORIES: MarketplaceCategory[] = [
  // --- BİLGİSAYAR & BİLİŞİM (COMPUTER & IT) ---
  { id: 108656, name: "USB Flash Bellek", displayName: "Bilgisayar & Tablet > Veri Depolama > USB Bellek", paths: ["Elektronik", "Bilgisayar & Tablet", "Veri Depolama", "USB Bellek"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 103108, name: "Hafıza Kartı (SD / MicroSD)", displayName: "Bilgisayar & Tablet > Veri Depolama > Hafıza Kartı", paths: ["Elektronik", "Bilgisayar & Tablet", "Veri Depolama", "Hafıza Kartı"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 103109, name: "Kart Okuyucu & Adaptör", displayName: "Bilgisayar & Tablet > Veri Depolama > Kart Okuyucu", paths: ["Elektronik", "Bilgisayar & Tablet", "Veri Depolama", "Kart Okuyucu"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 103668, name: "Dahili SSD (M.2 NVMe & SATA)", displayName: "Bilgisayar & Tablet > Bilgisayar Bileşenleri > SSD (Katı Hal Sürücü)", paths: ["Elektronik", "Bilgisayar & Tablet", "Bilgisayar Bileşenleri", "SSD"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 103669, name: "Taşınabilir / Harici SSD & Harddisk", displayName: "Bilgisayar & Tablet > Veri Depolama > Taşınabilir Disk (Harici HDD/SSD)", paths: ["Elektronik", "Bilgisayar & Tablet", "Veri Depolama", "Taşınabilir Disk"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 103670, name: "Dahili Harddisk (HDD) & Server Disk", displayName: "Bilgisayar & Tablet > Bilgisayar Bileşenleri > Sabit Disk (HDD)", paths: ["Elektronik", "Bilgisayar & Tablet", "Bilgisayar Bileşenleri", "Harddisk"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 103671, name: "Harddisk Kutusu & Disk Kızağı (Caddy)", displayName: "Bilgisayar & Tablet > Veri Depolama > Harddisk Kutusu & Kızağı", paths: ["Elektronik", "Bilgisayar & Tablet", "Veri Depolama", "Harddisk Kutusu"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 103672, name: "RAM / Sistem Belleği (DDR4 & DDR5)", displayName: "Bilgisayar & Tablet > Bilgisayar Bileşenleri > RAM Bellek", paths: ["Elektronik", "Bilgisayar & Tablet", "Bilgisayar Bileşenleri", "RAM"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 103673, name: "Anakart (Motherboard)", displayName: "Bilgisayar & Tablet > Bilgisayar Bileşenleri > Anakart", paths: ["Elektronik", "Bilgisayar & Tablet", "Bilgisayar Bileşenleri", "Anakart"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 103674, name: "İşlemci (CPU)", displayName: "Bilgisayar & Tablet > Bilgisayar Bileşenleri > İşlemci", paths: ["Elektronik", "Bilgisayar & Tablet", "Bilgisayar Bileşenleri", "İşlemci"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 103675, name: "Ekran Kartı (GPU)", displayName: "Bilgisayar & Tablet > Bilgisayar Bileşenleri > Ekran Kartı", paths: ["Elektronik", "Bilgisayar & Tablet", "Bilgisayar Bileşenleri", "Ekran Kartı"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 103676, name: "Bilgisayar Kasası & Güç Kaynağı (PSU)", displayName: "Bilgisayar & Tablet > Bilgisayar Bileşenleri > Kasa & PSU", paths: ["Elektronik", "Bilgisayar & Tablet", "Bilgisayar Bileşenleri", "Güç Kaynağı"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 103677, name: "İşlemci & Kasa Soğutucu / Fan", displayName: "Bilgisayar & Tablet > Bilgisayar Bileşenleri > Soğutucu & Overclock", paths: ["Elektronik", "Bilgisayar & Tablet", "Bilgisayar Bileşenleri", "Soğutucu"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 103100, name: "Dizüstü Bilgisayar (Laptop / Notebook)", displayName: "Bilgisayar & Tablet > Bilgisayarlar > Laptop / Notebook", paths: ["Elektronik", "Bilgisayar & Tablet", "Bilgisayarlar", "Laptop"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 103101, name: "Masaüstü Bilgisayar & Mini PC", displayName: "Bilgisayar & Tablet > Bilgisayarlar > Masaüstü & Mini PC", paths: ["Elektronik", "Bilgisayar & Tablet", "Bilgisayarlar", "Masaüstü Bilgisayar"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 103102, name: "Tablet Bilgisayar & iPad", displayName: "Bilgisayar & Tablet > Tablet", paths: ["Elektronik", "Bilgisayar & Tablet", "Tablet"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 103665, name: "Notebook Çantası & Kılıfı (13-14 / 15.6 / 17.3 inç)", displayName: "Bilgisayar & Tablet > Aksesuarlar > Laptop & Notebook Çantası", paths: ["Elektronik", "Bilgisayar & Tablet", "Aksesuarlar", "Notebook Çantası"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 103666, name: "Notebook Soğutucu & Laptop / Monitör Standı", displayName: "Bilgisayar & Tablet > Aksesuarlar > Notebook Standı & Soğutucu", paths: ["Elektronik", "Bilgisayar & Tablet", "Aksesuarlar", "Laptop Standı"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 103667, name: "Notebook Adaptörü, Batarya & Güç Kablosu", displayName: "Bilgisayar & Tablet > Yedek Parça > Notebook Adaptör & Batarya", paths: ["Elektronik", "Bilgisayar & Tablet", "Yedek Parça", "Notebook Adaptörü"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 103680, name: "Monitör (Gaming & Ofis Ekran)", displayName: "Bilgisayar & Tablet > Çevre Birimleri > Monitör", paths: ["Elektronik", "Bilgisayar & Tablet", "Çevre Birimleri", "Monitör"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 103681, name: "Mouse / Fare (Kablolu & Kablosuz)", displayName: "Bilgisayar & Tablet > Çevre Birimleri > Mouse", paths: ["Elektronik", "Bilgisayar & Tablet", "Çevre Birimleri", "Mouse"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 103682, name: "Klavye & Klavye-Mouse Set", displayName: "Bilgisayar & Tablet > Çevre Birimleri > Klavye & Setler", paths: ["Elektronik", "Bilgisayar & Tablet", "Çevre Birimleri", "Klavye"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 103683, name: "Mouse Pad & Masa Pedi", displayName: "Bilgisayar & Tablet > Aksesuarlar > Mouse Pad", paths: ["Elektronik", "Bilgisayar & Tablet", "Aksesuarlar", "Mouse Pad"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 103684, name: "USB Hub, Type-C Çoklayıcı & Docking Station", displayName: "Bilgisayar & Tablet > Aksesuarlar > USB Çoklayıcı & Hub", paths: ["Elektronik", "Bilgisayar & Tablet", "Aksesuarlar", "USB Hub"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 103685, name: "HDMI, DisplayPort, Ses & Görüntü Kabloları / Dönüştürücü", displayName: "Bilgisayar & Tablet > Aksesuarlar > Kablo & Dönüştürücüler", paths: ["Elektronik", "Bilgisayar & Tablet", "Aksesuarlar", "Kablo & Dönüştürücü"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 103686, name: "Modem, Wi-Fi Router, Switch, Powerline, USB Bluetooth & Ağ Kablolama Ekipmanları", displayName: "Bilgisayar & Tablet > Ağ & Modem > Modem, Router, Switch & Kablolama", paths: ["Elektronik", "Bilgisayar & Tablet", "Ağ & Modem", "Modem & Router", "Powerline", "USB Bluetooth", "Kablolama Ekipmanı"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 103687, name: "Lazer, Tanklı, Deskjet AIO Yazıcı, Tarayıcı & Yazıcı Yedek Parça", displayName: "Bilgisayar & Tablet > Yazıcı & Tarayıcı > Yazıcılar & Yedek Parça", paths: ["Elektronik", "Bilgisayar & Tablet", "Yazıcı & Tarayıcı", "Yazıcı", "Deskjet AIO", "Lazer Yazıcı", "Yazıcı Yedek Parça"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 103688, name: "Toner, Kartuş, Mürekkep & Yazıcı Sarf Malzemeleri", displayName: "Bilgisayar & Tablet > Yazıcı & Tarayıcı > Toner & Kartuş", paths: ["Elektronik", "Bilgisayar & Tablet", "Yazıcı & Tarayıcı", "Toner & Kartuş", "Sarf Malzemeler"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 103689, name: "Barkod Okuyucu, Termal Yazıcı, El Terminali, Barkod Sarf & POS Ekipmanları", displayName: "Ofis & Kırtasiye > Ofis Teknolojileri > Barkod Okuyucu, El Terminali & Yazıcı", paths: ["Elektronik", "Ofis Teknolojileri", "Barkod Okuyucu", "El Terminali", "Barkod Sarf"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 103690, name: "Sunum Kumandası (Presenter) & Projeksiyon Aksesuar", displayName: "Bilgisayar & Tablet > Aksesuarlar > Sunum Kumandası & Presenter", paths: ["Elektronik", "Bilgisayar & Tablet", "Aksesuarlar", "Sunum Kumandası", "Projektör"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 103691, name: "Webcam (Web Kamerası) & Dokunmatik Kalem (Stylus)", displayName: "Bilgisayar & Tablet > Çevre Birimleri > Webcam & Stylus Kalem", paths: ["Elektronik", "Bilgisayar & Tablet", "Çevre Birimleri", "Webcam", "Dokunmatik Kalem"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 103692, name: "Teknoloji Kimyasalları, Contact Cleaner, Degreaser, Soğutma Spreyi & Termal Macun", displayName: "Bilgisayar & Tablet > Bakım & Temizlik > Teknoloji Kimyasalları", paths: ["Elektronik", "Bilgisayar & Tablet", "Bakım & Temizlik", "Teknoloji Kimyasalları", "Contact Cleaner", "Degreaser", "Soğutma"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 103693, name: "Akım Korumalı Priz, Grup Priz & Uzatma Kablosu", displayName: "Elektronik > Elektrik & Aydınlatma > Akım Korumalı Priz & Grup Priz", paths: ["Elektronik", "Elektrik", "Priz", "Adaptör & Şarj Aletleri"], leaf: true, available: true, status: "ACTIVE", sector: "electronics" },

  // --- TELEFON & AKSESUAR (PHONE & ACCESSORIES) ---
  { id: 600, name: "Akıllı Cep Telefonları (iPhone & Android)", displayName: "Elektronik > Telefon > Cep Telefonu", paths: ["Elektronik", "Telefon", "Cep Telefonu"], leaf: true, available: true, status: "ACTIVE", sector: "phone" },
  { id: 601, name: "Cep Telefonu Aksesuarları, Şarj Cihazı & Kablo", displayName: "Elektronik > Telefon > Şarj Cihazı & Data Kablosu", paths: ["Elektronik", "Telefon Aksesuar", "Şarj Cihazı"], leaf: true, available: true, status: "ACTIVE", sector: "phone" },
  { id: 603, name: "Telefon Kılıfı & Ekran Koruyucu Cam", displayName: "Elektronik > Telefon > Kılıf & Ekran Koruyucu", paths: ["Elektronik", "Telefon Aksesuar", "Kılıf"], leaf: true, available: true, status: "ACTIVE", sector: "phone" },
  { id: 604, name: "Powerbank (Taşınabilir Şarj Cihazı)", displayName: "Elektronik > Telefon > Powerbank", paths: ["Elektronik", "Telefon Aksesuar", "Powerbank"], leaf: true, available: true, status: "ACTIVE", sector: "phone" },
  { id: 602, name: "Bluetooth Kulaklık, Kablolu Kulaklık & Speaker", displayName: "Elektronik > Ses Sistemleri > Kulaklık & Hoparlör", paths: ["Elektronik", "Kulaklık", "Hoparlör"], leaf: true, available: true, status: "ACTIVE", sector: "phone" },
  { id: 605, name: "Akıllı Saat & Akıllı Bileklik", displayName: "Elektronik > Giyilebilir Teknoloji > Akıllı Saat", paths: ["Elektronik", "Giyilebilir Teknoloji", "Akıllı Saat"], leaf: true, available: true, status: "ACTIVE", sector: "phone" },
  { id: 606, name: "Telsiz & Masaüstü DECT Telefon", displayName: "Elektronik > Telefon > Telsiz & Masaüstü Telefon", paths: ["Elektronik", "Telefon", "Dect Telefon"], leaf: true, available: true, status: "ACTIVE", sector: "phone" },

  // --- ELEKTRONİK, TV, KAMERA & GÜVENLİK ---
  { id: 650, name: "Televizyon (Smart LED / QLED / OLED TV)", displayName: "Elektronik > TV & Görüntü > Televizyon", paths: ["Elektronik", "TV & Görüntü", "Televizyon"], leaf: true, available: true, status: "ACTIVE", sector: "electronics" },
  { id: 651, name: "Güvenlik Kamerası & IP Kamera Sistemleri", displayName: "Elektronik > Güvenlik Sistemleri > Güvenlik Kamerası", paths: ["Elektronik", "Güvenlik", "Kameralar"], leaf: true, available: true, status: "ACTIVE", sector: "electronics" },
  { id: 652, name: "Fotoğraf Makinesi, Aksiyon Kamera, Tripod & Filtre", displayName: "Elektronik > Fotoğraf & Kamera > Kamera & Tripod Aksesuarları", paths: ["Elektronik", "Fotoğraf & Kamera", "Tripod"], leaf: true, available: true, status: "ACTIVE", sector: "electronics" },
  { id: 653, name: "Taşınabilir Kablosuz & Kablolu Hoparlör / Ses Sistemi", displayName: "Elektronik > Ses Sistemleri > Bluetooth Hoparlör & Speaker", paths: ["Elektronik", "Ses Sistemleri", "Hoparlör"], leaf: true, available: true, status: "ACTIVE", sector: "electronics" },

  // --- MODA & TEKSTİL ---
  { id: 412, name: "Kadın Ayakkabı", displayName: "Ayakkabı > Kadın Ayakkabı", paths: ["Kadın", "Ayakkabı"], leaf: true, available: true, status: "ACTIVE", sector: "fashion" },
  { id: 413, name: "Erkek Ayakkabı", displayName: "Ayakkabı > Erkek Ayakkabı", paths: ["Erkek", "Ayakkabı"], leaf: true, available: true, status: "ACTIVE", sector: "fashion" },
  { id: 414, name: "Spor Ayakkabı & Sneaker", displayName: "Ayakkabı > Spor Ayakkabı", paths: ["Ayakkabı", "Spor Ayakkabı"], leaf: true, available: true, status: "ACTIVE", sector: "fashion" },
  { id: 520, name: "Kadın Tişört & Bluz", displayName: "Giyim > Kadın > Tişört", paths: ["Kadın", "Giyim", "Tişört"], leaf: true, available: true, status: "ACTIVE", sector: "fashion" },
  { id: 521, name: "Erkek Tişört & Polo", displayName: "Giyim > Erkek > Tişört", paths: ["Erkek", "Giyim", "Tişört"], leaf: true, available: true, status: "ACTIVE", sector: "fashion" },
  { id: 522, name: "Kadın Elbise", displayName: "Giyim > Kadın > Elbise", paths: ["Kadın", "Giyim", "Elbise"], leaf: true, available: true, status: "ACTIVE", sector: "fashion" },
  { id: 523, name: "Erkek Pantolon & Jean", displayName: "Giyim > Erkek > Pantolon", paths: ["Erkek", "Giyim", "Pantolon"], leaf: true, available: true, status: "ACTIVE", sector: "fashion" },

  // --- EV, YAŞAM, MEDİKAL & KOZMETİK ---
  { id: 701, name: "Cilt Bakım Ürünleri", displayName: "Kozmetik > Cilt Bakımı", paths: ["Kozmetik", "Cilt Bakım"], leaf: true, available: true, status: "ACTIVE", sector: "home" },
  { id: 702, name: "Parfüm & Deodorant", displayName: "Kozmetik > Parfüm", paths: ["Kozmetik", "Parfüm"], leaf: true, available: true, status: "ACTIVE", sector: "home" },
  { id: 703, name: "Medikal Cihazlar, Tansiyon Aleti & Hasta Bakım Ürünleri", displayName: "Sağlık & Medikal > Medikal Cihaz & Hasta Bakım", paths: ["Sağlık", "Medikal", "Hasta Bakım"], leaf: true, available: true, status: "ACTIVE", sector: "home" },
  { id: 801, name: "Ev Tekstili", displayName: "Ev & Yaşam > Ev Tekstili", paths: ["Ev & Yaşam", "Tekstil"], leaf: true, available: true, status: "ACTIVE", sector: "home" },
  { id: 802, name: "Küçük Ev Aletleri, Blender & Mutfak Gereçleri", displayName: "Ev & Yaşam > Küçük Ev Aletleri & Mutfak", paths: ["Ev & Yaşam", "Mutfak", "Blender"], leaf: true, available: true, status: "ACTIVE", sector: "home" },
  { id: 901, name: "Oto Aksesuar & Bakım", displayName: "Otomotiv > Oto Aksesuar", paths: ["Otomotiv", "Aksesuar"], leaf: true, available: true, status: "ACTIVE", sector: "auto" }
];

// 3. Standard Amazon Categories
export const AMAZON_DEFAULT_CATEGORIES: MarketplaceCategory[] = [
  // --- BİLGİSAYAR & BİLİŞİM (COMPUTER & IT) ---
  { id: 7000101, name: "USB Flash Bellekler", displayName: "Bilgisayar & Bilişim > Veri Depolama > USB Flash Bellekler", paths: ["Bilgisayar", "Veri Depolama", "USB Flash Bellekler"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 7000102, name: "Kart Okuyucular & Adaptörler", displayName: "Bilgisayar & Bilişim > Veri Depolama > Kart Okuyucular", paths: ["Bilgisayar", "Veri Depolama", "Kart Okuyucular"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 7000103, name: "Hafıza Kartları (MicroSD & SD)", displayName: "Bilgisayar & Bilişim > Veri Depolama > Hafıza Kartları", paths: ["Bilgisayar", "Veri Depolama", "Hafıza Kartları"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 7000104, name: "Harici SSD & Taşınabilir Diskler (HDD Kutusu)", displayName: "Bilgisayar & Bilişim > Veri Depolama > Taşınabilir SSD & Harddisk", paths: ["Bilgisayar", "Veri Depolama", "Harici Diskler"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 7000105, name: "Dahili SSD (NVMe M.2 / SATA) & Dahili HDD", displayName: "Bilgisayar & Bilişim > Donanım > Dahili SSD & Sabit Disk", paths: ["Bilgisayar", "Donanım", "Dahili SSD"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 7000106, name: "Masaüstü & Laptop RAM (Bellek)", displayName: "Bilgisayar & Bilişim > Donanım > RAM Bellek", paths: ["Bilgisayar", "Donanım", "RAM Bellek"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 7000107, name: "Mouse / Fare (Kablosuz & Oyuncu)", displayName: "Bilgisayar & Bilişim > Çevre Birimleri > Mouse / Fare", paths: ["Bilgisayar", "Çevre Birimleri", "Mouse / Fare"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 7000108, name: "Klavye & Klavye-Mouse Setleri", displayName: "Bilgisayar & Bilişim > Çevre Birimleri > Klavye & Setler", paths: ["Bilgisayar", "Çevre Birimleri", "Klavye"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 7000109, name: "Mousepad & Masa Pedleri", displayName: "Bilgisayar & Bilişim > Aksesuarlar > Mousepad", paths: ["Bilgisayar", "Aksesuarlar", "Mousepad"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 7000110, name: "Monitör & Ekranlar (Gaming & Ofis)", displayName: "Bilgisayar & Bilişim > Çevre Birimleri > Monitörler", paths: ["Bilgisayar", "Monitörler"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 7000111, name: "Webcam & Yayıncı Kameraları", displayName: "Bilgisayar & Bilişim > Çevre Birimleri > Web Kameraları", paths: ["Bilgisayar", "Web Kameraları"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 7000112, name: "Bilgisayar Kulaklıkları & Mikrofonlar", displayName: "Bilgisayar & Bilişim > Çevre Birimleri > Kulaklık & Mikrofon", paths: ["Bilgisayar", "Kulaklık"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 7000113, name: "Laptop Soğutucu & Monitör / Notebook Standları", displayName: "Bilgisayar & Bilişim > Aksesuarlar > Laptop Soğutucu & Stand", paths: ["Bilgisayar", "Aksesuarlar", "Laptop Soğutucu"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 7000114, name: "USB Hub & Çoklayıcı Adaptörler", displayName: "Bilgisayar & Bilişim > Aksesuarlar > USB Hub & Adaptörler", paths: ["Bilgisayar", "Aksesuarlar", "USB Hub"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 7000115, name: "HDMI, DisplayPort, Ses & Görüntü Kabloları / Dönüştürücü", displayName: "Bilgisayar & Bilişim > Aksesuarlar > Görüntü & Ses Kabloları", paths: ["Bilgisayar", "Kablolar", "Görüntü Kabloları"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 7000116, name: "Lazer, Tanklı & Deskjet AIO Yazıcı, Tarayıcı & Yedek Parça", displayName: "Bilgisayar & Bilişim > Ofis Ekipmanları > Yazıcı & Tarayıcı", paths: ["Bilgisayar", "Yazıcılar", "Deskjet AIO", "Yazıcı Yedek Parça"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 7000117, name: "Modem, Wi-Fi Router, Switch, Powerline, USB Bluetooth & Ağ Kablolama", displayName: "Bilgisayar & Bilişim > Ağ & İnternet > Modem, Router & Ağ Ekipmanları", paths: ["Bilgisayar", "Ağ Ekipmanları", "Modem", "Powerline", "USB Bluetooth", "Kablolama Ekipmanı"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 7000118, name: "Notebook & Laptop Çantaları / Sırt Çantası / Kılıf (13-14 / 15-16 / 17 inç)", displayName: "Bilgisayar & Bilişim > Aksesuarlar > Laptop & Notebook Çantaları", paths: ["Bilgisayar", "Aksesuarlar", "Notebook Çantaları", "Çanta 13-14", "Çanta 15-16"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 7000119, name: "Dizüstü Bilgisayar (Laptop) & Masaüstü / Mini PC", displayName: "Bilgisayar & Bilişim > Bilgisayarlar > Dizüstü & Masaüstü Bilgisayar", paths: ["Bilgisayar", "Bilgisayarlar", "Laptop", "Masaüstü Bilgisayar"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 7000120, name: "Tablet Bilgisayar & iPad", displayName: "Bilgisayar & Bilişim > Tabletler > Tablet Bilgisayarlar", paths: ["Bilgisayar", "Tabletler", "iPad"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 7000121, name: "Notebook Adaptörü, Laptop Batarya & Güç Kablosu (Dell / Asus / HP / Lenovo)", displayName: "Bilgisayar & Bilişim > Aksesuarlar > Notebook Adaptör & Batarya", paths: ["Bilgisayar", "Aksesuarlar", "Notebook Adaptörü", "Laptop Batarya", "Güç Kablosu-Laptop"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 7000122, name: "Toner, Kartuş & Yazıcı Sarf Malzemeleri", displayName: "Bilgisayar & Bilişim > Ofis Ekipmanları > Toner & Kartuş", paths: ["Bilgisayar", "Toner & Kartuş", "Sarf Malzemeler"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 7000123, name: "Barkod Okuyucu, Barkod Yazıcı, El Terminali, Barkod Sarf & POS Ekipmanları", displayName: "Bilgisayar & Bilişim > Ofis Ekipmanları > Barkod Okuyucu, El Terminali & POS", paths: ["Bilgisayar", "Barkod Okuyucu", "El Terminali", "Barkod Sarf"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 7000124, name: "Anakart (Motherboard), İşlemci (CPU), Ekran Kartı (GPU) & Güç Kaynağı (PSU)", displayName: "Bilgisayar & Bilişim > Donanım > Anakart, İşlemci, Ekran Kartı & PSU", paths: ["Bilgisayar", "Donanım", "Bileşenler", "Anakart", "İşlemci", "Ekran Kartı", "Güç Kaynağı"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 7000125, name: "Sunum Kumandası (Presenter) & Lazer Pointer", displayName: "Bilgisayar & Bilişim > Aksesuarlar > Sunum Kumandası", paths: ["Bilgisayar", "Aksesuarlar", "Sunum Kumandası", "Projektör"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 7000126, name: "Teknoloji Kimyasalları, Contact Cleaner, Degreaser, Soğutma & Termal Macun", displayName: "Bilgisayar & Bilişim > Bakım & Temizlik > Teknoloji Kimyasalları & Termal Macun", paths: ["Bilgisayar", "Teknoloji Kimyasalları", "Contact Cleaner", "Degreaser", "Soğutma"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 7000127, name: "Dokunmatik Kalem (Stylus) & Grafik Tablet Kalemi", displayName: "Bilgisayar & Bilişim > Aksesuarlar > Dokunmatik Kalem (Stylus)", paths: ["Bilgisayar", "Aksesuarlar", "Dokunmatik Kalem", "Stylus"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 7000128, name: "Akım Korumalı Priz, Grup Priz & Uzatma Kablosu", displayName: "Elektronik > Elektrik & Priz > Akım Korumalı Priz", paths: ["Elektronik", "Priz", "Adaptör & Şarj Aletleri"], leaf: true, available: true, status: "ACTIVE", sector: "electronics" },
  { id: 7000208, name: "Telsiz & Masaüstü DECT Telefonlar", displayName: "Telefon & Aksesuar > Sabit & Telsiz Telefon > DECT Telefon", paths: ["Telefon", "Dect Telefon", "Telsiz Telefon"], leaf: true, available: true, status: "ACTIVE", sector: "phone" },

  // --- TELEFON & AKSESUAR (PHONE & ACCESSORIES) ---
  { id: 7000201, name: "Akıllı Telefonlar (iPhone & Android)", displayName: "Telefon & Aksesuar > Cep Telefonları > Akıllı Telefonlar", paths: ["Telefon", "Cep Telefonları"], leaf: true, available: true, status: "ACTIVE", sector: "phone" },
  { id: 7000202, name: "Kılıf & Kapaklar (iPhone & Android)", displayName: "Telefon & Aksesuar > Aksesuarlar > Kılıflar", paths: ["Telefon", "Kılıflar"], leaf: true, available: true, status: "ACTIVE", sector: "phone" },
  { id: 7000203, name: "Ekran Koruyucu Camlar", displayName: "Telefon & Aksesuar > Aksesuarlar > Ekran Koruyucular", paths: ["Telefon", "Ekran Koruyucu"], leaf: true, available: true, status: "ACTIVE", sector: "phone" },
  { id: 7000204, name: "Şarj Cihazı, Adaptör & Şarj Kabloları", displayName: "Telefon & Aksesuar > Şarj Cihazları & Kablolar", paths: ["Telefon", "Şarj Cihazları"], leaf: true, available: true, status: "ACTIVE", sector: "phone" },
  { id: 7000205, name: "Powerbank (Taşınabilir Şarj Cihazları)", displayName: "Telefon & Aksesuar > Powerbank & Şarj", paths: ["Telefon", "Powerbank"], leaf: true, available: true, status: "ACTIVE", sector: "phone" },
  { id: 7000206, name: "Bluetooth Kulaklıklar (TWS & Kulak Üstü)", displayName: "Telefon & Aksesuar > Ses > Bluetooth Kulaklıklar", paths: ["Telefon", "Kulaklıklar"], leaf: true, available: true, status: "ACTIVE", sector: "phone" },
  { id: 7000207, name: "Akıllı Saatler & Bileklikler", displayName: "Telefon & Aksesuar > Giyilebilir Teknoloji > Akıllı Saatler", paths: ["Telefon", "Akıllı Saatler"], leaf: true, available: true, status: "ACTIVE", sector: "phone" },

  // --- ELEKTRONİK & TV (ELECTRONICS) ---
  { id: 7000301, name: "Televizyonlar (Smart & OLED TV)", displayName: "Elektronik & TV > Televizyonlar", paths: ["Elektronik", "Televizyon"], leaf: true, available: true, status: "ACTIVE", sector: "electronics" },
  { id: 7000302, name: "Soundbar & Ses Sistemleri", displayName: "Elektronik & TV > Ses Sistemleri > Soundbar", paths: ["Elektronik", "Soundbar"], leaf: true, available: true, status: "ACTIVE", sector: "electronics" },
  { id: 7000303, name: "Bluetooth Hoparlörler (Portable Speaker)", displayName: "Elektronik & TV > Ses Sistemleri > Bluetooth Hoparlör", paths: ["Elektronik", "Hoparlör"], leaf: true, available: true, status: "ACTIVE", sector: "electronics" },
  { id: 7000304, name: "Güvenlik Kameraları & IP Kamera Sistemleri", displayName: "Elektronik & TV > Kamera & Güvenlik > Güvenlik Kameraları", paths: ["Elektronik", "Kameralar", "Güvenlik Kamerası"], leaf: true, available: true, status: "ACTIVE", sector: "electronics" },
  { id: 7000305, name: "Fotoğraf Makinesi, Tripod, Filtre & Aksiyon Kamera", displayName: "Elektronik & TV > Fotoğraf & Kamera > Kamera & Tripod", paths: ["Elektronik", "Fotoğraf & Kamera", "Tripod"], leaf: true, available: true, status: "ACTIVE", sector: "electronics" },

  // --- EV, YAŞAM, MEDİKAL & MUTFAK (HOME & KITCHEN) ---
  { id: 7000401, name: "Kahve Makineleri, Blender & Küçük Ev Aletleri", displayName: "Ev, Yaşam & Mutfak > Küçük Ev Aletleri > Kahve, Çay & Blender", paths: ["Ev & Mutfak", "Kahve Makineleri", "Blender"], leaf: true, available: true, status: "ACTIVE", sector: "home" },
  { id: 7000402, name: "Robot Süpürgeler & Dikey Süpürgeler", displayName: "Ev, Yaşam & Mutfak > Küçük Ev Aletleri > Süpürgeler", paths: ["Ev & Mutfak", "Süpürgeler"], leaf: true, available: true, status: "ACTIVE", sector: "home" },
  { id: 7000403, name: "Tencere, Tava & Mutfak Gereçleri", displayName: "Ev, Yaşam & Mutfak > Mutfak Gereçleri", paths: ["Ev & Mutfak", "Mutfak"], leaf: true, available: true, status: "ACTIVE", sector: "home" },
  { id: 7000404, name: "Medikal Cihazlar, Tansiyon Aleti & Hasta Bakım", displayName: "Sağlık & Bakım > Medikal Cihazlar & Hasta Bakım", paths: ["Sağlık", "Medikal", "Hasta Bakım"], leaf: true, available: true, status: "ACTIVE", sector: "home" },

  // --- MODA & TEKSTİL (FASHION) ---
  { id: 7000501, name: "Erkek Giyim & Tişörtler", displayName: "Moda & Tekstil > Erkek Giyim", paths: ["Moda", "Erkek Giyim"], leaf: true, available: true, status: "ACTIVE", sector: "fashion" },
  { id: 7000502, name: "Kadın Giyim & Elbiseler", displayName: "Moda & Tekstil > Kadın Giyim", paths: ["Moda", "Kadın Giyim"], leaf: true, available: true, status: "ACTIVE", sector: "fashion" },
  { id: 7000503, name: "Spor Ayakkabılar & Sneaker", displayName: "Moda & Tekstil > Ayakkabı & Çanta > Spor Ayakkabı", paths: ["Moda", "Ayakkabı"], leaf: true, available: true, status: "ACTIVE", sector: "fashion" },

  // --- OTO & YAPI MARKET (AUTO & TOOLS) ---
  { id: 7000601, name: "Oto Aksesuar & Araç İçi Donanım", displayName: "Oto & Yapı Market > Oto Aksesuar", paths: ["Otomotiv", "Aksesuar"], leaf: true, available: true, status: "ACTIVE", sector: "auto" },
  { id: 7000602, name: "Şarjlı Matkap & El Aletleri", displayName: "Oto & Yapı Market > Yapı Market > El Aletleri", paths: ["Yapı Market", "El Aletleri"], leaf: true, available: true, status: "ACTIVE", sector: "auto" }
];

// 4. Standard Pazarama Categories
export const PAZARAMA_DEFAULT_CATEGORIES: MarketplaceCategory[] = [
  { id: 101, name: "Giyim & Ayakkabı", displayName: "Moda > Giyim & Ayakkabı", paths: ["Moda"], leaf: true, sector: "fashion" },
  { id: 102, name: "Cep Telefonu & Aksesuar", displayName: "Elektronik > Telefon & Aksesuar", paths: ["Elektronik", "Telefon"], leaf: true, sector: "phone" },
  { id: 108, name: "Dizüstü Bilgisayar & Tablet", displayName: "Elektronik > Bilgisayar & Tablet", paths: ["Elektronik", "Bilgisayar"], leaf: true, sector: "computer" },
  { id: 109, name: "Notebook Çantası & Aksesuarları", displayName: "Elektronik > Bilgisayar > Notebook Çantası & Stand", paths: ["Elektronik", "Bilgisayar", "Notebook Çantası"], leaf: true, sector: "computer" },
  { id: 110, name: "Veri Depolama (SSD, Harddisk, USB Bellek)", displayName: "Elektronik > Bilgisayar > Veri Depolama", paths: ["Elektronik", "Bilgisayar", "Veri Depolama"], leaf: true, sector: "computer" },
  { id: 111, name: "Çevre Birimleri (Monitör, Klavye, Mouse, Kablo)", displayName: "Elektronik > Bilgisayar > Çevre Birimleri", paths: ["Elektronik", "Bilgisayar", "Çevre Birimleri"], leaf: true, sector: "computer" },
  { id: 112, name: "Yazıcı, Toner, Kartuş & Barkod Okuyucu", displayName: "Elektronik > Ofis > Yazıcı & Sarf Malzeme", paths: ["Elektronik", "Yazıcı", "Toner"], leaf: true, sector: "computer" },
  { id: 103, name: "Ev, Yaşam & Küçük Ev Aletleri", displayName: "Ev & Yaşam > Küçük Ev Aletleri & Mutfak", paths: ["Ev & Yaşam"], leaf: true, sector: "home" },
  { id: 104, name: "Kozmetik, Kişisel Bakım & Medikal", displayName: "Kozmetik & Sağlık > Bakım & Medikal", paths: ["Kozmetik", "Medikal"], leaf: true, sector: "home" },
  { id: 105, name: "Oto Aksesuar", displayName: "Oto & Bahçe > Araç Bakım & Aksesuar", paths: ["Oto & Bahçe"], leaf: true, sector: "auto" }
];

// 5. Standard N11.com Leaf Categories
export const N11_DEFAULT_CATEGORIES: MarketplaceCategory[] = [
  { id: 1000268, name: "USB Flash Bellek", displayName: "Bilgisayar > Veri Depolama > USB Flash Bellek", paths: ["Bilgisayar", "Veri Depolama", "USB Bellek"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 1000270, name: "Hafıza Kartı (MicroSD / SD Kartlar)", displayName: "Bilgisayar > Veri Depolama > Hafıza Kartı", paths: ["Bilgisayar", "Veri Depolama", "Hafıza Kartı", "Sd Kartlar"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 1000269, name: "Dahili / Harici SSD & Harddisk (Server Disk)", displayName: "Bilgisayar > Veri Depolama > SSD & Harddisk", paths: ["Bilgisayar", "Veri Depolama", "SSD", "Harddisk", "Harici Harddisk", "Server Harddisk"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 1000271, name: "Harddisk Kutusu & Disk Kızağı", displayName: "Bilgisayar > Veri Depolama > Harddisk Kutusu", paths: ["Bilgisayar", "Veri Depolama", "Harddisk Kutusu"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 1000272, name: "Kart Okuyucu", displayName: "Bilgisayar > Veri Depolama > Kart Okuyucu", paths: ["Bilgisayar", "Veri Depolama", "Kart Okuyucu"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 1000273, name: "RAM / Sistem Belleği (Masaüstü PC RAM & Laptop RAM)", displayName: "Bilgisayar > Yedek Parça & Bileşen > RAM Bellek", paths: ["Bilgisayar", "Bileşenler", "RAM Bellek", "PC RAM", "Laptop RAM"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 1000274, name: "Anakart (Motherboard), İşlemci (CPU), Ekran Kartı (GPU) & Güç Kaynağı (PSU)", displayName: "Bilgisayar > Yedek Parça & Bileşen > Anakart, İşlemci, Ekran Kartı & PSU", paths: ["Bilgisayar", "Bileşenler", "Anakart", "İşlemci", "Ekran Kartı", "Güç Kaynağı"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 1000275, name: "Dizüstü Bilgisayar (Laptop / Notebook) & Masaüstü / Mini PC", displayName: "Bilgisayar > Dizüstü & Masaüstü Bilgisayar", paths: ["Bilgisayar", "Laptop", "Notebook", "Masaüstü Bilgisayar"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 1000276, name: "Tablet Bilgisayar & iPad", displayName: "Bilgisayar > Tablet Bilgisayar & iPad", paths: ["Bilgisayar", "Tablet", "iPad"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 1000278, name: "Monitör", displayName: "Bilgisayar > Çevre Birimleri > Monitör", paths: ["Bilgisayar", "Monitör", "Monitörler"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 1000280, name: "Klavye & Mouse / Fare Setleri", displayName: "Bilgisayar > Çevre Birimleri > Klavye & Mouse", paths: ["Bilgisayar", "Klavye", "Mouse", "Fare"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 1000281, name: "Mouse Pad & Masa Pedi", displayName: "Bilgisayar > Aksesuar > Mouse Pad", paths: ["Bilgisayar", "Aksesuar", "Mouse Pad"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 1000282, name: "Ağ, Modem, Wi-Fi Router, Switch, Powerline, USB Bluetooth & Kablolama", displayName: "Bilgisayar > Ağ Ürünleri > Modem, Router, Switch & Kablolama", paths: ["Bilgisayar", "Modem", "Ağ", "Powerline", "USB Bluetooth", "Kablolama Ekipmanı"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 1000285, name: "Laptop & Notebook Çantası / Sırt Çantası / Kılıf (13-14 / 15-16 inç)", displayName: "Bilgisayar > Aksesuar > Laptop & Notebook Çantası", paths: ["Bilgisayar", "Notebook Çanta", "Çanta 13-14", "Çanta 15-16", "Kılıf"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 1000286, name: "Laptop Standı, Monitör Standı & Notebook Soğutucu", displayName: "Bilgisayar > Aksesuar > Notebook Soğutucu & Stand", paths: ["Bilgisayar", "Aksesuar", "Laptop Standı"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 1000287, name: "Notebook Adaptörü, Laptop Batarya & Güç Kablosu (Dell / Asus / HP / Lenovo)", displayName: "Bilgisayar > Yedek Parça > Notebook Adaptör & Batarya", paths: ["Bilgisayar", "Yedek Parça", "Notebook Adaptörü", "Laptop Batarya", "Güç Kablosu-Laptop"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 1000288, name: "USB Hub, Çoklayıcı & Dönüştürücü", displayName: "Bilgisayar > Aksesuar > USB Hub & Çoklayıcı", paths: ["Bilgisayar", "USB Hub", "Çoklayıcı"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 1000289, name: "HDMI, DisplayPort, Ses & Görüntü Kabloları / Dönüştürücü", displayName: "Bilgisayar > Kablo & Adaptör > Ses & Görüntü Kablosu", paths: ["Bilgisayar", "Kablo", "Dönüştürücü", "Ses & Görüntü Kablosu"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 1000290, name: "Lazer & Deskjet AIO Yazıcı, Tarayıcı & Yazıcı Yedek Parça", displayName: "Bilgisayar > Yazıcı & Sarf > Yazıcılar & Yedek Parça", paths: ["Bilgisayar", "Yazıcı", "Lazer Yazıcı", "Deskjet AIO", "Yazıcı Yedek Parça"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 1000291, name: "Toner, Kartuş & Yazıcı Sarf Malzemeleri", displayName: "Bilgisayar > Yazıcı & Sarf > Toner & Kartuş", paths: ["Bilgisayar", "Toner", "Kartuş", "Sarf Malzemeler"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 1000292, name: "Barkod Okuyucu, Barkod Yazıcı, El Terminali, Barkod Sarf & POS Sistemleri", displayName: "Bilgisayar > Ofis Kırtasiye > Barkod Okuyucu, El Terminali & Yazıcı", paths: ["Bilgisayar", "Barkod Okuyucu", "El Terminali", "Barkod Sarf"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 1000293, name: "Sunum Kumandası (Presenter) & Projeksiyon Aksesuar", displayName: "Bilgisayar > Projeksiyon > Sunum Kumandası", paths: ["Bilgisayar", "Sunum Kumandası", "Projektör"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 1000294, name: "Webcam (Web Kamerası) & Dokunmatik Kalem (Stylus)", displayName: "Bilgisayar > Çevre Birimleri > Webcam & Dokunmatik Kalem", paths: ["Bilgisayar", "Webcam", "Dokunmatik Kalem", "Stylus"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 1000295, name: "Teknoloji Kimyasalları, Contact Cleaner, Degreaser, Soğutma & Termal Macun", displayName: "Bilgisayar > Bakım & Temizlik > Teknoloji Kimyasalları & Termal Macun", paths: ["Bilgisayar", "Teknoloji Kimyasalları", "Contact Cleaner", "Degreaser", "Soğutma"], leaf: true, available: true, status: "ACTIVE", sector: "computer" },
  { id: 1000296, name: "Akım Korumalı Priz, Grup Priz & Uzatma Kablosu", displayName: "Elektronik > Elektrik & Aydınlatma > Akım Korumalı Priz", paths: ["Elektronik", "Priz", "Adaptör & Şarj Aletleri"], leaf: true, available: true, status: "ACTIVE", sector: "electronics" },
  { id: 1000301, name: "Cep Telefonu (Akıllı Telefonlar / iPhone & Android)", displayName: "Telefon & Aksesuarları > Cep Telefonu", paths: ["Telefon", "Cep Telefonu", "iPhone"], leaf: true, available: true, status: "ACTIVE", sector: "phone" },
  { id: 1000302, name: "Telsiz & Masaüstü DECT Telefon", displayName: "Telefon & Aksesuarları > Telsiz & Masaüstü Telefon", paths: ["Telefon", "Dect Telefon", "Telsiz Telefon"], leaf: true, available: true, status: "ACTIVE", sector: "phone" },
  { id: 1000305, name: "Telefon Kılıfı & Kapak", displayName: "Telefon & Aksesuarları > Kılıf & Kapak", paths: ["Telefon", "Kılıf"], leaf: true, available: true, status: "ACTIVE", sector: "phone" },
  { id: 1000308, name: "Ekran Koruyucu Cam & Film", displayName: "Telefon & Aksesuarları > Ekran Koruyucu", paths: ["Telefon", "Ekran Koruyucu"], leaf: true, available: true, status: "ACTIVE", sector: "phone" },
  { id: 1000312, name: "Şarj Cihazı, Kablo & Powerbank", displayName: "Telefon & Aksesuarları > Şarj & Güç", paths: ["Telefon", "Şarj", "Powerbank"], leaf: true, available: true, status: "ACTIVE", sector: "phone" },
  { id: 1000315, name: "Bluetooth Kulaklık, Kablolu Kulaklık, Ofis Kulaklık & Speaker / Hoparlör", displayName: "Telefon & Aksesuarları > Kulaklık & Hoparlör", paths: ["Telefon", "Kulaklık", "Bluetooth", "Kablosuz Kulaklık", "Ofis Kulaklık", "Speaker", "Hoparlör"], leaf: true, available: true, status: "ACTIVE", sector: "phone" },
  { id: 1000320, name: "Akıllı Saat & Bileklik", displayName: "Telefon & Aksesuarları > Akıllı Saat", paths: ["Telefon", "Akıllı Saat"], leaf: true, available: true, status: "ACTIVE", sector: "phone" },
  { id: 1000401, name: "Televizyon, Bluetooth Hoparlör & Ses Sistemleri", displayName: "Elektronik > TV & Ses Sistemleri", paths: ["Elektronik", "TV", "Ses Sistemleri", "Bluetooth Hoparlör", "Speaker"], leaf: true, available: true, status: "ACTIVE", sector: "electronics" },
  { id: 1000410, name: "Güvenlik Kamerası, IP Kamera & Alarm", displayName: "Elektronik > Güvenlik Sistemleri", paths: ["Elektronik", "Kameralar", "Güvenlik"], leaf: true, available: true, status: "ACTIVE", sector: "electronics" },
  { id: 1000415, name: "Fotoğraf Makinesi, Aksiyon Kamera, Tripod, Filtre & Kamera Aksesuar", displayName: "Elektronik > Fotoğraf & Kamera > Kamera & Tripod", paths: ["Elektronik", "Fotoğraf", "Tripod", "Aksiyon Kamera", "Foto Filtre"], leaf: true, available: true, status: "ACTIVE", sector: "electronics" },
  { id: 1000501, name: "Erkek Giyim & Tişört & Pantolon", displayName: "Giyim & Ayakkabı > Erkek Giyim", paths: ["Giyim", "Erkek"], leaf: true, available: true, status: "ACTIVE", sector: "fashion" },
  { id: 1000505, name: "Kadın Giyim & Elbise", displayName: "Giyim & Ayakkabı > Kadın Giyim", paths: ["Giyim", "Kadın"], leaf: true, available: true, status: "ACTIVE", sector: "fashion" },
  { id: 1000510, name: "Spor Ayakkabı & Sneaker", displayName: "Giyim & Ayakkabı > Ayakkabı", paths: ["Ayakkabı", "Sneaker"], leaf: true, available: true, status: "ACTIVE", sector: "fashion" },
  { id: 1000601, name: "Küçük Ev Aletleri, Blender & Süpürge", displayName: "Ev & Yaşam > Küçük Ev Aletleri", paths: ["Ev Yaşam", "Küçük Ev Aletleri", "Blender"], leaf: true, available: true, status: "ACTIVE", sector: "home" },
  { id: 1000610, name: "Mutfak Gereçleri & Tencere", displayName: "Ev & Yaşam > Mutfak Gereçleri", paths: ["Ev Yaşam", "Mutfak"], leaf: true, available: true, status: "ACTIVE", sector: "home" },
  { id: 1000620, name: "Medikal Cihazlar, Tansiyon Aleti & Hasta Bakım (Boru Tipi Yatak / Hasta Önlüğü)", displayName: "Kozmetik & Kişisel Bakım > Sağlık & Medikal Cihazlar", paths: ["Sağlık", "Medikal", "Hasta Bakım", "Boru Tipi Yatak", "Hasta Önlüğü"], leaf: true, available: true, status: "ACTIVE", sector: "home" },
  { id: 1000701, name: "Oto Aksesuar & Araç İçi Donanım", displayName: "Otomotiv & Motosiklet > Oto Aksesuar", paths: ["Otomotiv", "Aksesuar"], leaf: true, available: true, status: "ACTIVE", sector: "auto" }
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
  laptop_bags: [
    { id: "Marka", name: "Marka (Brand)", description: "Çanta veya kılıf üretici markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "EkranBoyutu", name: "Uyumlu Ekran Boyutu (İnç)", description: "Laptop / tablet ekran boyutu desteği", mandatory: true, type: "select", values: ["15.6 inç", "16 inç", "13.3 inç", "14 inç", "17.3 inç", "11 - 12.9 inç", "Evrensel / Tüm Boyutlar"], defaultValue: "15.6 inç" },
    { id: "CantaTipi", name: "Çanta & Kılıf Türü", description: "Taşıma tipi veya form faktörü", mandatory: true, type: "select", values: ["Sırt Çantası", "Omuz / El Çantası", "Evrak Çantası", "Kılıf / Sleeve", "Sert Kapak / Hardcase"], defaultValue: "Sırt Çantası" },
    { id: "Renk", name: "Renk (Color)", description: "Çanta ana rengi", mandatory: true, type: "select", values: ["Siyah", "Gri", "Koyu Gri / Antrasit", "Lacivert", "Mavi", "Haki / Yeşil", "Kahverengi", "Kırmızı", "Pembe"], defaultValue: "Siyah" },
    { id: "Malzeme", name: "Malzeme & Su Geçirmezlik", description: "Dış yüzey materyali", mandatory: false, type: "select", values: ["Su Geçirmez Polyester", "Su İtici Kumaş", "Deri / Suni Deri", "Neopren", "Kanvas / Keten"], defaultValue: "Su Geçirmez Polyester" },
    { id: "BolmeSayisi", name: "Bölme Sayısı", description: "Göz ve cep sayısı", mandatory: false, type: "select", values: ["1 Bölmeli", "2 Bölmeli", "3 Bölmeli", "4+ Bölmeli"], defaultValue: "2 Bölmeli" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Türkiye" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["12", "24", "36"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "Vergi oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  presenter_remote: [
    { id: "Marka", name: "Marka (Brand)", description: "Presenter markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "BaglantiTipi", name: "Bağlantı Tipi / Alıcı", description: "Kablosuz bağlantı türü", mandatory: true, type: "select", values: ["2.4 GHz USB Alıcı", "Bluetooth", "2.4 GHz + Bluetooth (Çift Mod)"], defaultValue: "2.4 GHz USB Alıcı" },
    { id: "LazerRengi", name: "Lazer Işık Rengi", description: "Lazer işaretçi rengi", mandatory: false, type: "select", values: ["Kırmızı Lazer", "Yeşil Lazer", "Sanal / Ekran Üstü Lazer", "Lazer Yok"], defaultValue: "Kırmızı Lazer" },
    { id: "Menzil", name: "Kablosuz Kullanım Menzili", description: "Maksimum kapsama alanı", mandatory: false, type: "select", values: ["10 Metre", "15 Metre", "20 Metre", "30 Metre", "50+ Metre"], defaultValue: "15 Metre" },
    { id: "PilTipi", name: "Pil Türü / Güç Kaynağı", description: "Çalışma gücü", mandatory: false, type: "select", values: ["AAA İnce Pil", "Şarj Edilebilir Dahili Batarya (Type-C)", "AA Kalem Pil"], defaultValue: "AAA İnce Pil" },
    { id: "Renk", name: "Renk (Color)", description: "Ürün rengi", mandatory: true, type: "select", values: ["Siyah", "Gri", "Gümüş", "Beyaz"], defaultValue: "Siyah" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["12", "24", "36"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "Vergi oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  photography_camera: [
    { id: "Marka", name: "Marka (Brand)", description: "Ürün veya aksesuar markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "UrunTipi", name: "Aksesuar & Ürün Türü", description: "Kategori tipi", mandatory: true, type: "select", values: ["Tripod & Monopod", "Kamera Çantası & Kılıfı", "Lens & Filtre", "Tepe Flaş & Stüdyo Işığı", "Gimbal & Sabitleyici", "Aksiyon Kamera Aksesuarı", "Fotoğraf Makinesi"], defaultValue: "Tripod & Monopod" },
    { id: "UyumluMarkaModel", name: "Uyumlu Kamera / Cihaz Markası", description: "Uyumlu cihaz türü veya markası", mandatory: false, type: "select", values: ["Evrensel (Tüm Kameralar)", "Canon", "Nikon", "Sony", "Fujifilm", "Panasonic", "GoPro / Aksiyon Kamera", "Akıllı Telefon"], defaultValue: "Evrensel (Tüm Kameralar)" },
    { id: "Renk", name: "Renk (Color)", description: "Ürün rengi", mandatory: true, type: "select", values: ["Siyah", "Gümüş", "Gri", "Kırmızı"], defaultValue: "Siyah" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["12", "24", "36"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "Vergi oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
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
  ram_memory: [
    { id: "Marka", name: "Marka (Brand)", description: "Bellek markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "Kapasite", name: "Bellek Kapasitesi (GB)", description: "RAM boyutu", mandatory: true, type: "select", values: ["4 GB", "8 GB", "16 GB", "32 GB", "64 GB (2x32GB)", "128 GB"], defaultValue: "16 GB" },
    { id: "BellekTipi", name: "Bellek Tipi", description: "RAM jenerasyonu", mandatory: true, type: "select", values: ["DDR5", "DDR4", "DDR3", "LPDDR5"], defaultValue: "DDR5" },
    { id: "BellekHizi", name: "Bellek Hızı (MHz)", description: "Çalışma frekansı", mandatory: true, type: "select", values: ["3200 MHz", "3600 MHz", "4800 MHz", "5200 MHz", "5600 MHz", "6000 MHz", "6400 MHz", "7200 MHz"], defaultValue: "6000 MHz" },
    { id: "FormFaktoru", name: "Form Faktörü / Kullanım Alanı", description: "Masaüstü (UDIMM) veya Laptop (SO-DIMM)", mandatory: true, type: "select", values: ["Masaüstü (UDIMM)", "Laptop / Notebook (SO-DIMM)"], defaultValue: "Masaüstü (UDIMM)" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Tayvan" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["24", "36", "60", "Ömür Boyu"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "KDV Oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  motherboard: [
    { id: "Marka", name: "Marka (Brand)", description: "Anakart markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "SoketTipi", name: "İşlemci Soket Tipi", description: "Uyumlu işlemci soketi", mandatory: true, type: "select", values: ["AMD AM5", "AMD AM4", "Intel LGA1700", "Intel LGA1200", "Intel LGA1851"], defaultValue: "AMD AM5" },
    { id: "YongaSeti", name: "Yonga Seti (Chipset)", description: "Anakart çipseti", mandatory: true, type: "select", values: ["AMD B650", "AMD X670 / X870", "AMD A620", "AMD B550", "Intel Z790", "Intel B760", "Intel H610"], defaultValue: "AMD B650" },
    { id: "FormFaktoru", name: "Form Faktörü", description: "Fiziksel anakart boyutu", mandatory: true, type: "select", values: ["ATX", "Micro-ATX", "Mini-ITX", "E-ATX"], defaultValue: "Micro-ATX" },
    { id: "RamDesteği", name: "RAM Tipi & Kanalı", description: "Desteklenen bellek teknolojisi", mandatory: false, type: "select", values: ["DDR5 (Çift Kanal)", "DDR4 (Çift Kanal)"], defaultValue: "DDR5 (Çift Kanal)" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Tayvan" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["24", "36"], defaultValue: "36" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "KDV Oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  cpu_processor: [
    { id: "Marka", name: "Marka (Brand)", description: "İşlemci üreticisi", mandatory: true, type: "select", values: ["Intel", "AMD"], defaultValue: "AMD" },
    { id: "IslemciAilesi", name: "İşlemci Ailesi / Serisi", description: "Seri adı", mandatory: true, type: "select", values: ["AMD Ryzen 7", "AMD Ryzen 5", "AMD Ryzen 9", "Intel Core i7", "Intel Core i5", "Intel Core i9", "Intel Core Ultra 7", "Intel Core Ultra 5"], defaultValue: "AMD Ryzen 7" },
    { id: "SoketTipi", name: "Soket Tipi", description: "Anakart bağlantı soketi", mandatory: true, type: "select", values: ["Socket AM5", "Socket AM4", "LGA1700", "LGA1851", "LGA1200"], defaultValue: "Socket AM5" },
    { id: "CekirdekSayisi", name: "Çekirdek Sayısı", description: "Fiziksel çekirdek adedi", mandatory: false, type: "select", values: ["6 Çekirdek", "8 Çekirdek", "12 Çekirdek", "16 Çekirdek", "20 Çekirdek", "24 Çekirdek"], defaultValue: "8 Çekirdek" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Malezya" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["24", "36"], defaultValue: "36" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "KDV Oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  gpu_graphics_card: [
    { id: "Marka", name: "Marka (Brand)", description: "Ekran kartı markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "GpuUreticisi", name: "GPU Chipset Üreticisi", description: "Grafik çip üreticisi", mandatory: true, type: "select", values: ["NVIDIA", "AMD", "Intel"], defaultValue: "NVIDIA" },
    { id: "BellekKapasitesi", name: "VRAM Kapasitesi (GB)", description: "Grafik bellek miktarı", mandatory: true, type: "select", values: ["6 GB", "8 GB", "12 GB", "16 GB", "20 GB", "24 GB"], defaultValue: "12 GB" },
    { id: "BellekTipi", name: "Bellek Tipi", description: "VRAM teknolojisi", mandatory: false, type: "select", values: ["GDDR6X", "GDDR6", "GDDR7"], defaultValue: "GDDR6X" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["24", "36"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "KDV Oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  monitors_screens: [
    { id: "Marka", name: "Marka (Brand)", description: "Monitör markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "EkranBoyutu", name: "Ekran Boyutu (İnç)", description: "Panel boyutu", mandatory: true, type: "select", values: ["23.8 inç", "24 inç", "27 inç", "31.5 inç / 32 inç", "34 inç Ultrawide", "49 inç"], defaultValue: "27 inç" },
    { id: "YenilemeHizi", name: "Yenileme Hızı (Hz)", description: "Tazeleme frekansı", mandatory: true, type: "select", values: ["60 Hz / 75 Hz", "100 Hz", "144 Hz", "165 Hz / 180 Hz", "240 Hz", "360 Hz+"], defaultValue: "165 Hz / 180 Hz" },
    { id: "Cozunurluk", name: "Çözünürlük Standardı", description: "Ekran çözünürlüğü", mandatory: true, type: "select", values: ["Full HD (1920x1080)", "2K QHD (2560x1440)", "4K UHD (3840x2160)", "UWQHD (3440x1440)"], defaultValue: "2K QHD (2560x1440)" },
    { id: "PanelTipi", name: "Panel Teknolojisi", description: "Ekran paneli türü", mandatory: false, type: "select", values: ["Fast IPS", "OLED / QD-OLED", "VA Panel", "TN Panel"], defaultValue: "Fast IPS" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["24", "36"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "KDV Oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  keyboards_mice: [
    { id: "Marka", name: "Marka (Brand)", description: "Klavye / Mouse markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "BaglantiTipi", name: "Bağlantı Türü", description: "Kablosuz veya kablolu bağlantı", mandatory: true, type: "select", values: ["2.4 GHz Kablosuz + Bluetooth", "Kablolu USB", "Bluetooth", "Kablolu + Kablosuz (Çift Mod)"], defaultValue: "2.4 GHz Kablosuz + Bluetooth" },
    { id: "UrunTipi", name: "Ürün Türü", description: "Klavye, mouse veya set", mandatory: true, type: "select", values: ["Mouse / Fare", "Mekanik Klavye", "Membran Klavye", "Klavye + Mouse Seti", "Mousepad / Masa Pedi"], defaultValue: "Mouse / Fare" },
    { id: "Renk", name: "Renk (Color)", description: "Ürün rengi", mandatory: true, type: "select", values: ["Siyah", "Beyaz", "Gri", "Pembe", "Çok Renkli / RGB"], defaultValue: "Siyah" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["12", "24", "36"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "KDV Oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  power_supply_case: [
    { id: "Marka", name: "Marka (Brand)", description: "Kasa / Güç kaynağı markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "GucKapasitesi", name: "Güç Kapasitesi (Watt)", description: "PSU watt değeri", mandatory: false, type: "select", values: ["500W", "600W / 650W", "750W", "850W", "1000W+", "Güç Kaynağı Yok (Yalnız Kasa)"], defaultValue: "750W" },
    { id: "Sertifika", name: "80 Plus Verimlilik Sertifikası", description: "Güç sertifikası", mandatory: false, type: "select", values: ["80 Plus Gold", "80 Plus Bronze", "80 Plus Platinum", "Sertifikasız / Standart"], defaultValue: "80 Plus Gold" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["24", "36", "60"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "KDV Oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  pc_cooling: [
    { id: "Marka", name: "Marka (Brand)", description: "Soğutucu markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "SogutucuTipi", name: "Soğutucu Türü", description: "Sıvı veya hava soğutma", mandatory: true, type: "select", values: ["Sıvı Soğutma (AIO)", "Kule Tipi Hava Soğutma", "Kasa Fanı", "Laptop Soğutucu Stand"], defaultValue: "Sıvı Soğutma (AIO)" },
    { id: "RadyatorBoyutu", name: "Radyatör / Fan Boyutu", description: "Radyatör veya fan boyutu", mandatory: false, type: "select", values: ["240 mm", "360 mm", "120 mm", "140 mm", "280 mm"], defaultValue: "240 mm" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["24", "36"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "KDV Oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  printers_scanners: [
    { id: "Marka", name: "Marka (Brand)", description: "Yazıcı markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "YaziciTipi", name: "Yazıcı Teknolojisi", description: "Baskı teknolojisi", mandatory: true, type: "select", values: ["Tanklı Mürekkep Sistemli", "Lazer (Siyah Beyaz)", "Lazer (Renkli)", "Mürekkep Püskürtmeli (Kartuşlu)", "Barkod & Etiket Yazıcı"], defaultValue: "Tanklı Mürekkep Sistemli" },
    { id: "Islev", name: "Fonksiyon / İşlev", description: "Yazıcı özellikleri", mandatory: true, type: "select", values: ["Çok Fonksiyonlu (Yazıcı+Tarayıcı+Fotokopi)", "Tek Fonksiyonlu (Yalnız Yazıcı)"], defaultValue: "Çok Fonksiyonlu (Yazıcı+Tarayıcı+Fotokopi)" },
    { id: "Baglanti", name: "Bağlantı Özelliği", description: "Kablosuz veya USB", mandatory: false, type: "select", values: ["Wi-Fi + USB", "Wi-Fi + Ethernet + USB", "Yalnızca USB"], defaultValue: "Wi-Fi + USB" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Filipinler" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["24", "36"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "KDV Oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  network_router: [
    { id: "Marka", name: "Marka (Brand)", description: "Ağ cihazı markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "CihazTipi", name: "Ağ Cihazı Türü", description: "Ağ ekipmanı türü", mandatory: true, type: "select", values: ["Wi-Fi Router", "VDSL2 / ADSL2+ Modem", "Mesh Wi-Fi Sistemi", "Masaüstü / Gigabit Switch", "Menzil Genişletici (Range Extender)"], defaultValue: "Wi-Fi Router" },
    { id: "WifiStandardi", name: "Wi-Fi Standardı", description: "Kablosuz hız standardı", mandatory: false, type: "select", values: ["Wi-Fi 6 (802.11ax)", "Wi-Fi 6E / Wi-Fi 7", "Wi-Fi 5 (802.11ac)", "Wi-Fi 4 (802.11n)"], defaultValue: "Wi-Fi 6 (802.11ax)" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["24", "36"], defaultValue: "36" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "KDV Oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  network_wifi_adapter: [
    { id: "Marka", name: "Marka (Brand)", description: "Wi-Fi Adaptör / Ağ Kartı üretici markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "CihazTipi", name: "Adaptör Türü", description: "Ağ adaptör tipi ve form faktörü", mandatory: true, type: "select", values: ["USB Wi-Fi Adaptör (Nano / Antensiz)", "USB Wi-Fi Adaptör (Yüksek Kazançlı Antenli)", "PCI-e Wi-Fi + Bluetooth Ağ Kartı", "USB Bluetooth Adaptör (Dongle)", "USB to RJ45 Ethernet Dönüştürücü Adaptör"], defaultValue: "USB Wi-Fi Adaptör (Yüksek Kazançlı Antenli)" },
    { id: "WifiStandardi", name: "Wi-Fi Standardı & Hız", description: "Kablosuz hız ve bağlantı standardı", mandatory: true, type: "select", values: ["Wi-Fi 6 (802.11ax) 1800/2400 Mbps", "Wi-Fi 5 (802.11ac) AC1200 / AC1300 Çift Bant", "Wi-Fi 5 (802.11ac) AC600 / AC650 Çift Bant", "Wi-Fi 4 (802.11n) N300 (300 Mbps)", "Wi-Fi 4 (802.11n) N150 (150 Mbps)", "Gigabit 1000 Mbps RJ45 Ethernet"], defaultValue: "Wi-Fi 5 (802.11ac) AC1200 / AC1300 Çift Bant" },
    { id: "FrekansBandi", name: "Frekans Bandı", description: "Kablosuz frekans desteği", mandatory: true, type: "select", values: ["Çift Bant (Dual Band 2.4 GHz & 5 GHz)", "Tek Bant (2.4 GHz)", "Üç Bant (Tri-Band 2.4 / 5 / 6 GHz)"], defaultValue: "Çift Bant (Dual Band 2.4 GHz & 5 GHz)" },
    { id: "BaglantiArabirimi", name: "Bağlantı Arayüzü", description: "Bilgisayara bağlantı portu", mandatory: true, type: "select", values: ["USB 3.0 / 3.2", "USB 2.0", "Type-C (USB-C)", "PCI Express x1"], defaultValue: "USB 3.0 / 3.2" },
    { id: "AntenYapisi", name: "Anten Yapısı", description: "Anten özellikleri", mandatory: false, type: "select", values: ["Harici Yüksek Kazançlı Anten (High Gain)", "Çift Harici Anten", "Dahili Entegre Nano Anten"], defaultValue: "Harici Yüksek Kazançlı Anten (High Gain)" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["24", "36"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "KDV Oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  phone_accessories: [
    { id: "Marka", name: "Marka (Brand)", description: "Ürün markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "UyumluMarka", name: "Uyumlu Telefon Markası", description: "Aksesuarın uyumlu olduğu telefon markası", mandatory: false, type: "select", values: ["Apple iPhone", "Samsung", "Xiaomi", "Huawei", "Oppo", "Evrensel (Tüm Markalar)"], defaultValue: "Apple iPhone" },
    { id: "UyumluModel", name: "Uyumlu Model", description: "Uyumlu telefon model adı (Örn: iPhone 15 Pro, S24)", mandatory: false, type: "text", placeholder: "Örn: iPhone 15 Pro / Galaxy S24" },
    { id: "BaglantiTipi", name: "Bağlantı / Şarj Tipi", description: "Kablo / adaptör çıkışı", mandatory: false, type: "select", values: ["Type-C", "Lightning", "Micro USB", "Kablosuz (MagSafe / Qi)", "Yok"], defaultValue: "Type-C" },
    { id: "GucWatt", name: "Güç Çıkışı (Watt)", description: "Şarj adaptörü veya kablo kapasitesi", mandatory: false, type: "select", values: ["20W", "25W", "30W", "45W", "65W", "100W", "Yok"], defaultValue: "20W" },
    { id: "Renk", name: "Renk (Color)", description: "Ürün rengi", mandatory: true, type: "select", values: ["Siyah", "Beyaz", "Şeffaf", "Mavi", "Mor", "Yeşil", "Gri", "Gümüş", "Gold", "Pembe"], defaultValue: "Siyah" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["12", "24", "36"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "Vergi oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  tablet_devices: [
    { id: "Marka", name: "Marka (Brand)", description: "Tablet üretici markası", mandatory: true, type: "select", values: ["Apple", "Samsung", "Lenovo", "Xiaomi", "Huawei", "TCL", "Honor", "Casper", "Reeder", "Diğer"], defaultValue: "Apple" },
    { id: "EkranBoyutu", name: "Ekran Boyutu (İnç)", description: "Tablet ekran boyutu", mandatory: true, type: "select", values: ["10.1 inç", "10.9 inç / 11 inç", "12.9 inç / 13 inç", "8.7 inç / 8 inç", "12.4 inç"], defaultValue: "10.9 inç / 11 inç" },
    { id: "DahiliHafiza", name: "Dahili Hafıza / Depolama", description: "Tablet depolama kapasitesi", mandatory: true, type: "select", values: ["32 GB", "64 GB", "128 GB", "256 GB", "512 GB", "1 TB"], defaultValue: "128 GB" },
    { id: "RamKapasitesi", name: "RAM Kapasitesi (GB)", description: "Bellek miktarı", mandatory: true, type: "select", values: ["3 GB", "4 GB", "6 GB", "8 GB", "12 GB", "16 GB"], defaultValue: "8 GB" },
    { id: "IsletimSistemi", name: "İşletim Sistemi", description: "Tablet yazılım altyapısı", mandatory: true, type: "select", values: ["iPadOS", "Android", "Windows 11", "HarmonyOS"], defaultValue: "iPadOS" },
    { id: "HagBaglanti", name: "Hücresel Bağlantı (SIM)", description: "SIM kart veya 4G/5G desteği", mandatory: false, type: "select", values: ["Yalnızca Wi-Fi", "Wi-Fi + Cellular (SIM Kartlı)"], defaultValue: "Yalnızca Wi-Fi" },
    { id: "Renk", name: "Renk (Color)", description: "Tablet rengi", mandatory: true, type: "select", values: ["Uzay Grisi", "Gümüş", "Siyah", "Koyu Gri", "Mavi", "Pembe", "Altın / Gold", "Yeşil"], defaultValue: "Uzay Grisi" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Yasal garanti süresi", mandatory: true, type: "select", values: ["12", "24", "36"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "Vergi oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  notebook_adapters: [
    { id: "Marka", name: "Marka (Brand)", description: "Adaptör üretici markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "UyumluMarka", name: "Uyumlu Notebook Markası", description: "Adaptörün uyumlu olduğu bilgisayar markası", mandatory: true, type: "select", values: ["Dell", "Asus", "HP", "Lenovo", "Apple Macbook", "Acer", "Monster", "Casper", "Toshiba", "Samsung", "Evrensel / Tüm Markalar"], defaultValue: "Dell" },
    { id: "GucWatt", name: "Güç Çıkışı (Watt)", description: "Adaptör gücü", mandatory: true, type: "select", values: ["45W", "65W", "90W", "120W", "130W", "180W", "230W", "240W", "300W", "100W Type-C", "65W Type-C"], defaultValue: "65W" },
    { id: "VoltajV", name: "Çıkış Voltajı (V)", description: "Gerilim değeri", mandatory: true, type: "select", values: ["19.5V", "19V", "20V", "18.5V", "12V", "5V - 20V (Type-C PD)"], defaultValue: "19.5V" },
    { id: "AkımAmper", name: "Çıkış Akımı (Amper)", description: "Akım gücü", mandatory: false, type: "select", values: ["3.34A", "3.42A", "4.62A", "4.74A", "2.25A", "3.25A", "6.15A", "9.23A", "11.8A"], defaultValue: "3.34A" },
    { id: "Uckonnektor", name: "Konnektor / Uç Tipi", description: "Adaptör soket ucu", mandatory: false, type: "select", values: ["Dell 7.4x5.0mm İğneli Uç", "Dell 4.5x3.0mm Mavi Uç", "Type-C (USB-C PD)", "Lenovo Square (Dikdörtgen)", "Standart 5.5x2.5mm", "Asus 4.0x1.35mm", "HP 4.5x3.0mm Mavi Uç"], defaultValue: "Dell 4.5x3.0mm Mavi Uç" },
    { id: "Renk", name: "Renk (Color)", description: "Adaptör rengi", mandatory: true, type: "select", values: ["Siyah", "Beyaz"], defaultValue: "Siyah" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["12", "24", "36"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "Vergi oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  usb_hub_adapters: [
    { id: "Marka", name: "Marka (Brand)", description: "USB Hub veya dönüştürücü üretici markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "GirisArabirimi", name: "Giriş Arayüzü / Erkek Uç", description: "Cihaza takılan erkek uç", mandatory: true, type: "select", values: ["Type-C (USB-C)", "USB 3.0 (USB-A)", "Thunderbolt 3 / 4", "Lightning"], defaultValue: "Type-C (USB-C)" },
    { id: "PortSayisi", name: "Çıkış / Port Sayısı", description: "Çoklayıcı toplam port sayısı", mandatory: true, type: "select", values: ["4 Port", "5 in 1", "6 in 1", "7 in 1", "8 in 1", "10 in 1", "11+ in 1"], defaultValue: "4 Port" },
    { id: "CikisPortlari", name: "Desteklenen Çıkışlar", description: "Hub üzerindeki konnektör tipleri", mandatory: false, type: "select", values: ["4 x USB 3.0 / USB 2.0", "HDMI + USB 3.0 + Type-C PD", "HDMI + RJ45 Ethernet + USB 3.0 + SD/TF", "VGA + HDMI + USB 3.0", "USB 3.0 + Type-C"], defaultValue: "4 x USB 3.0 / USB 2.0" },
    { id: "HDMIDestegi", name: "Görüntü Çıkışı Desteği", description: "HDMI veya DisplayPort çözünürlüğü", mandatory: false, type: "select", values: ["4K @ 60Hz", "4K @ 30Hz", "1080p Full HD", "Görüntü Çıkışı Yok"], defaultValue: "Görüntü Çıkışı Yok" },
    { id: "GucPD", name: "USB Type-C PD Şarj Desteği", description: "Power Delivery şarj kapasitesi", mandatory: false, type: "select", values: ["100W PD Şarj", "87W PD Şarj", "60W PD Şarj", "Şarj Desteği Yok"], defaultValue: "Şarj Desteği Yok" },
    { id: "GovdeMalzemesi", name: "Gövde Malzemesi", description: "Kasa ve ısı dağıtım malzemesi", mandatory: false, type: "select", values: ["Alüminyum Alaşım", "ABS Isıya Dayanıklı Plastik"], defaultValue: "Alüminyum Alaşım" },
    { id: "Renk", name: "Renk (Color)", description: "Cihaz rengi", mandatory: true, type: "select", values: ["Uzay Grisi / Antrasit", "Gümüş", "Siyah"], defaultValue: "Uzay Grisi / Antrasit" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["12", "24", "36"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "Vergi oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  cables_converters: [
    { id: "Marka", name: "Marka (Brand)", description: "Kablo / adaptör markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "KabloTipi", name: "Kablo / Bağlantı Türü", description: "Kablo fonksiyonu", mandatory: true, type: "select", values: ["HDMI Kablo", "DisplayPort Kablo", "Type-C - HDMI Dönüştürücü Kablo", "VGA Kablo", "Ethernet Cat6 / Cat7", "USB Extension / Uzatma", "Aux 3.5mm Ses Kablosu", "Güç / SATA Kablosu"], defaultValue: "HDMI Kablo" },
    { id: "Uzunluk", name: "Kablo Uzunluğu", description: "Kablo boyu", mandatory: true, type: "select", values: ["0.5 Metre", "1 Metre", "1.5 Metre", "2 Metre", "3 Metre", "5 Metre", "10 Metre"], defaultValue: "1.5 Metre" },
    { id: "KonnektorUclari", name: "Konnektör Uçları", description: "Giriş ve çıkış konnektörleri", mandatory: false, type: "select", values: ["Erkek - Erkek (Male to Male)", "Erkek - Dişi (Male to Female)", "Dişi - Dişi (Female to Female)"], defaultValue: "Erkek - Erkek (Male to Male)" },
    { id: "Kaplama", name: "Kablo Kaplaması / Örgü", description: "Dış koruma malzemesi", mandatory: false, type: "select", values: ["Örgülü Kumaş / Naylon", "PVC / Standart", "Altın Kaplama Uçlu (Gold Plated)"], defaultValue: "Örgülü Kumaş / Naylon" },
    { id: "Renk", name: "Renk (Color)", description: "Kablo rengi", mandatory: true, type: "select", values: ["Siyah", "Gri", "Gümüş", "Kırmızı", "Mavi", "Beyaz"], defaultValue: "Siyah" },
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
  webcam_camera: [
    { id: "Marka", name: "Marka (Brand)", description: "Web kamerası üretici markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "Cozunurluk", name: "Video Çözünürlüğü", description: "Kamera görüntü kalitesi", mandatory: true, type: "select", values: ["1080p Full HD (1920x1080)", "2K QHD (2560x1440)", "4K Ultra HD", "720p HD"], defaultValue: "1080p Full HD (1920x1080)" },
    { id: "KareHizi", name: "Kare Hızı (FPS)", description: "Saniyedeki kare sayısı", mandatory: true, type: "select", values: ["60 FPS", "30 FPS"], defaultValue: "30 FPS" },
    { id: "Mikrofon", name: "Dahili Mikrofon", description: "Ses kaydı ve gürültü engelleme", mandatory: true, type: "select", values: ["Çift Gürültü Önleyici Mikrofon (Stereo)", "Dahili Mikrofonlu (Mono)", "Mikrofonsuz"], defaultValue: "Dahili Mikrofonlu (Mono)" },
    { id: "Odaklama", name: "Odaklama Tipi", description: "Netleme mekanizması", mandatory: false, type: "select", values: ["Otomatik Odaklama (Auto-Focus)", "Sabit Odak (Fixed Focus)"], defaultValue: "Otomatik Odaklama (Auto-Focus)" },
    { id: "Baglanti", name: "Bağlantı Arayüzü", description: "Bilgisayar bağlantı portu", mandatory: true, type: "select", values: ["USB 2.0 / 3.0 Tak-Çalıştır", "Type-C (USB-C)"], defaultValue: "USB 2.0 / 3.0 Tak-Çalıştır" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["24", "36"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "Vergi oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  power_strip_socket: [
    { id: "Marka", name: "Marka (Brand)", description: "Priz / elektrik ekipmanı markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "PrizSayisi", name: "Priz / Yuva Sayısı", description: "Toplam AC priz çıkışı", mandatory: true, type: "select", values: ["Tekli (1 Priz)", "2'li Grup Priz", "3'lü Grup Priz", "4'lü Grup Priz", "5'li Grup Priz", "6'lı Grup Priz", "8+ Çoklu Priz"], defaultValue: "3'lü Grup Priz" },
    { id: "KabloUzunlugu", name: "Kablo Uzunluğu", description: "Hat kablo boyu", mandatory: true, type: "select", values: ["Kablosuz (Fiş Priz)", "1.5 Metre", "2 Metre", "3 Metre", "5 Metre", "10 Metre"], defaultValue: "2 Metre" },
    { id: "AkimKoruma", name: "Akım & Yıldırım Koruması", description: "Yüksek voltaj koruma özelliği", mandatory: true, type: "select", values: ["Akım Korumalı (Surge Protection)", "Standart Topraklı Çocuk Korumalı"], defaultValue: "Akım Korumalı (Surge Protection)" },
    { id: "UsbCikisi", name: "USB / Type-C Şarj Portu", description: "Dahili USB şarj çıkışı", mandatory: false, type: "select", values: ["USB-A + Type-C PD Girişli", "USB Şarj Girişli", "Yok (Yalnızca AC Priz)"], defaultValue: "Yok (Yalnızca AC Priz)" },
    { id: "Anahtar", name: "Açma / Kapama Anahtarı", description: "Güç kesme düğmesi", mandatory: false, type: "select", values: ["Anahtarlı (On/Off Butonlu)", "Anahtarsız"], defaultValue: "Anahtarlı (On/Off Butonlu)" },
    { id: "Renk", name: "Renk (Color)", description: "Gövde rengi", mandatory: true, type: "select", values: ["Beyaz", "Siyah", "Gri"], defaultValue: "Beyaz" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Türkiye" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["24", "36"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "Vergi oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  stylus_pen: [
    { id: "Marka", name: "Marka (Brand)", description: "Dokunmatik kalem üretici markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "UyumluCihaz", name: "Uyumlu Cihaz / Ekosistem", description: "Çalıştığı tablet veya ekran teknolojisi", mandatory: true, type: "select", values: ["Apple iPad (Avuç İçi Reddetmeli / Palm Rejection)", "Tüm Dokunmatik Ekranlar (Üniversal Kapasitif)", "Samsung Galaxy Tab Serisi", "Grafik Çizim Tableti"], defaultValue: "Apple iPad (Avuç İçi Reddetmeli / Palm Rejection)" },
    { id: "BaglantiSarj", name: "Şarj & Çalışma Tipi", description: "Güç ve bağlantı yapısı", mandatory: true, type: "select", values: ["Type-C Şarjlı (Aktif Stylus)", "Manyetik Kablosuz Şarjlı", "Pilsiz / Pasif Kapasitif"], defaultValue: "Type-C Şarjlı (Aktif Stylus)" },
    { id: "Renk", name: "Renk (Color)", description: "Kalem rengi", mandatory: true, type: "select", values: ["Beyaz", "Siyah", "Gümüş", "Gri"], defaultValue: "Beyaz" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["12", "24"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "Vergi oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  dect_landline_phone: [
    { id: "Marka", name: "Marka (Brand)", description: "Telefon cihazı markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "TelefonTipi", name: "Telefon Türü", description: "Telsiz veya masaüstü sabit telefon", mandatory: true, type: "select", values: ["Kablosuz DECT Telsiz Telefon", "Kablolu Masaüstü / Ofis Telefonu", "IP / VoIP Masaüstü Telefon"], defaultValue: "Kablosuz DECT Telsiz Telefon" },
    { id: "ArayanNumara", name: "Arayan Numara Gösterimi (Caller ID)", description: "Ekran ve numara gösterimi", mandatory: true, type: "select", values: ["Var (Aydınlatmalı Ekran)", "Yok"], defaultValue: "Var (Aydınlatmalı Ekran)" },
    { id: "Hoparlor", name: "Handsfree / Hoparlör", description: "Ahizesiz görüşme özelliği", mandatory: false, type: "select", values: ["Var (Eller Serbest Hoparlör)", "Yok"], defaultValue: "Var (Eller Serbest Hoparlör)" },
    { id: "Renk", name: "Renk (Color)", description: "Cihaz rengi", mandatory: true, type: "select", values: ["Siyah", "Beyaz", "Gümüş / Gri"], defaultValue: "Siyah" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["24", "36"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "Vergi oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  tv_mount_remote: [
    { id: "Marka", name: "Marka (Brand)", description: "Askı aparatı veya kumanda markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "UrunTipi", name: "Ürün Türü", description: "Askı aparatı veya kumanda tipi", mandatory: true, type: "select", values: ["Sabit TV Duvar Askı Aparatı", "Hareketli / Açılı TV Askı Aparatı", "Masaüstü / Tavan Monitör & TV Tutucu", "Akıllı / Üniversal TV Kumandası"], defaultValue: "Hareketli / Açılı TV Askı Aparatı" },
    { id: "DesteklenenEkran", name: "Uyumlu Ekran Boyutu", description: "Desteklenen TV / monitör inç aralığı", mandatory: true, type: "select", values: ["19\" - 43\" inç", "32\" - 55\" inç", "40\" - 65\" inç", "55\" - 85\" inç", "Tüm TV Modelleri (Kumanda)"], defaultValue: "32\" - 55\" inç" },
    { id: "Renk", name: "Renk (Color)", description: "Ürün rengi", mandatory: true, type: "select", values: ["Siyah", "Beyaz", "Gümüş"], defaultValue: "Siyah" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Türkiye" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["24", "36"], defaultValue: "24" },
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
  security_camera: [
    { id: "Marka", name: "Marka (Brand)", description: "Güvenlik kamerası markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "KameraCozunurluk", name: "Kamera Çözünürlüğü (MP / HD)", description: "Görüntü kalitesi ve çözünürlük", mandatory: true, type: "select", values: ["1080p Full HD (2 MP)", "2K QHD (3 MP / 4 MP)", "4K Ultra HD (8 MP)", "720p HD (1 MP)"], defaultValue: "1080p Full HD (2 MP)" },
    { id: "KullanimAlani", name: "Kullanım Alanı & Tipi", description: "İç mekan / dış mekan / bebek kamerası", mandatory: true, type: "select", values: ["İç Mekan & Dış Mekan (IP66 Su Geçirmez)", "Yalnızca İç Mekan", "Kablosuz Bataryalı / Güneş Panelli", "Bebek & Evcil Hayvan Kamerası"], defaultValue: "İç Mekan & Dış Mekan (IP66 Su Geçirmez)" },
    { id: "GeceGorus", name: "Gece Görüş Özelliği", description: "Gece aydınlatma ve görüş teknolojisi", mandatory: true, type: "select", values: ["Renkli Gece Görüşü (Spot Işıklı)", "Kızılötesi (IR) Gece Görüşü", "Akıllı Çift Işık (Dual Light)"], defaultValue: "Kızılötesi (IR) Gece Görüşü" },
    { id: "BaglantiTipi", name: "Bağlantı Teknolojisi", description: "Wi-Fi, Ethernet veya SIM Kartlı", mandatory: true, type: "select", values: ["Wi-Fi (Kablosuz)", "Ethernet (PoE / Kablolu)", "4G / SIM Kartlı", "Wi-Fi + Ethernet"], defaultValue: "Wi-Fi (Kablosuz)" },
    { id: "HareketAlgilama", name: "Hareket Algılama & AI Takip", description: "Otomatik algılama ve bildirim", mandatory: false, type: "select", values: ["AI İnsan & Araç Algılama (360° Takip)", "PIR Hareket Sensörü", "Standart Hareket Algılama"], defaultValue: "AI İnsan & Araç Algılama (360° Takip)" },
    { id: "SesOzelligi", name: "Ses Desteği & Konuşma", description: "Mikrofon ve hoparlör desteği", mandatory: false, type: "select", values: ["Karşılıklı İki Yönlü Ses (Mikrofon + Hoparlör)", "Yalnızca Dahili Mikrofon (Ses Kayıt)", "Ses Desteği Yok"], defaultValue: "Karşılıklı İki Yönlü Ses (Mikrofon + Hoparlör)" },
    { id: "DepolamaDesteği", name: "Hafıza & Kayıt Desteği", description: "SD Kart veya NVR/DVR desteği", mandatory: false, type: "select", values: ["MicroSD Kart Desteği (Max 128GB/256GB)", "NVR / DVR Kayıt Cihazı Uyumlu", "Bulut Depolama (Cloud) + MicroSD"], defaultValue: "MicroSD Kart Desteği (Max 128GB/256GB)" },
    { id: "Renk", name: "Renk", description: "Kamera gövde rengi", mandatory: true, type: "select", values: ["Beyaz", "Siyah", "Gri"], defaultValue: "Beyaz" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["12", "24", "36"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "Vergi oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  laptop_computer: [
    { id: "Marka", name: "Marka (Brand)", description: "Bilgisayar üretici markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "IslemciTipi", name: "İşlemci Tipi / Serisi", description: "İşlemci modeli", mandatory: true, type: "select", values: ["Intel Core i5", "Intel Core i7", "Intel Core i3", "Intel Core i9", "Intel Core Ultra 7", "AMD Ryzen 5", "AMD Ryzen 7", "Apple M2 / M3", "Intel Celeron / N100"], defaultValue: "Intel Core i5" },
    { id: "RamSistema", name: "RAM (Sistem Belleği)", description: "Bellek kapasitesi", mandatory: true, type: "select", values: ["8 GB", "16 GB", "24 GB", "32 GB", "64 GB", "4 GB"], defaultValue: "16 GB" },
    { id: "SsdKapasitesi", name: "SSD Kapasitesi", description: "Dahili depolama boyutu", mandatory: true, type: "select", values: ["256 GB", "512 GB", "1 TB", "2 TB", "128 GB"], defaultValue: "512 GB" },
    { id: "EkranBoyutu", name: "Ekran Boyutu (İnç)", description: "Laptop ekran boyutu", mandatory: true, type: "select", values: ["15.6 inç", "14 inç", "16 inç", "13.3 inç", "17.3 inç", "Masaüstü / Ekran Yok"], defaultValue: "15.6 inç" },
    { id: "IsletimSistemi", name: "İşletim Sistemi", description: "Kurulu işletim sistemi", mandatory: true, type: "select", values: ["FreeDOS (İşletim Sistemsiz)", "Windows 11 Home", "Windows 11 Pro", "macOS", "Ubuntu / Linux"], defaultValue: "FreeDOS (İşletim Sistemsiz)" },
    { id: "EkranKarti", name: "Ekran Kartı Hafızası", description: "Paylaşımlı veya harici ekran kartı", mandatory: false, type: "select", values: ["Paylaşımlı (Dahili GPU)", "4 GB Harici", "6 GB Harici", "8 GB Harici", "12 GB+ Harici"], defaultValue: "Paylaşımlı (Dahili GPU)" },
    { id: "Renk", name: "Renk (Color)", description: "Cihaz rengi", mandatory: true, type: "select", values: ["Siyah", "Gri / Uzay Grisi", "Gümüş", "Lacivert", "Beyaz"], defaultValue: "Gri / Uzay Grisi" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["24", "36"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "Vergi oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  laptop_stand_cooler: [
    { id: "Marka", name: "Marka (Brand)", description: "Stand veya soğutucu markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "UrunTipi", name: "Stand / Soğutucu Türü", description: "Ürün fonksiyonu", mandatory: true, type: "select", values: ["Ergonomik Yükseltici Laptop Standı", "Fanlı Notebook Soğutucu Stand", "Katlanabilir Taşınabilir Stand", "Monitör & Masaüstü Standı"], defaultValue: "Ergonomik Yükseltici Laptop Standı" },
    { id: "UyumluBoyut", name: "Uyumlu Ekran Boyutu", description: "Desteklenen cihaz boyutu", mandatory: true, type: "select", values: ["10 - 17.3 inç (Evrensel)", "13 - 15.6 inç", "15.6 - 17.3 inç"], defaultValue: "10 - 17.3 inç (Evrensel)" },
    { id: "Malzeme", name: "Gövde Materyali", description: "Üretim malzemesi", mandatory: false, type: "select", values: ["Alüminyum Alaşım", "Metal / Çelik Mesh", "ABS Plastik"], defaultValue: "Alüminyum Alaşım" },
    { id: "Renk", name: "Renk (Color)", description: "Ürün rengi", mandatory: true, type: "select", values: ["Gümüş", "Uzay Grisi", "Siyah", "Beyaz"], defaultValue: "Gümüş" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["12", "24", "36"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "Vergi oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  mousepad: [
    { id: "Marka", name: "Marka (Brand)", description: "Mousepad markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "Boyut", name: "Boyut / Ölçü Tipi", description: "Mouse pad ebatı", mandatory: true, type: "select", values: ["Standart (Small / Medium)", "Geniş (Large)", "XL / XXL Masa Boyu (90x40 cm)", "Jel / Bilek Destekli"], defaultValue: "Standart (Small / Medium)" },
    { id: "YuzeyTipi", name: "Yüzey & Özellik", description: "Kumaş veya aydınlatma", mandatory: false, type: "select", values: ["Kaymaz Taban Kumaş Yüzey", "Bilek Destekli Ergonomik", "RGB Aydınlatmalı Gaming", "Sert / Deri Yüzey"], defaultValue: "Kaymaz Taban Kumaş Yüzey" },
    { id: "Renk", name: "Renk (Color)", description: "Ürün rengi", mandatory: true, type: "select", values: ["Siyah", "Gri", "Desenli / Çok Renkli", "Lacivert", "Kırmızı"], defaultValue: "Siyah" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["12", "24"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "Vergi oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  toner_cartridge: [
    { id: "Marka", name: "Marka (Brand)", description: "Toner veya kartuş markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "SarfTipi", name: "Sarf Malzeme Türü", description: "Toner, kartuş veya mürekkep", mandatory: true, type: "select", values: ["Orijinal Lazer Toner", "Muadil Lazer Toner", "Orijinal Mürekkep Kartuş / Şişe", "Muadil Kartuş / Mürekkep", "Yazıcı Şeridi / Drum Ünitesi"], defaultValue: "Muadil Lazer Toner" },
    { id: "BaskiRengi", name: "Baskı Rengi", description: "Toner / mürekkep rengi", mandatory: true, type: "select", values: ["Siyah (Black)", "Mavi (Cyan)", "Kırmızı (Magenta)", "Sarı (Yellow)", "4 Renk Set (CMYK)"], defaultValue: "Siyah (Black)" },
    { id: "UyumluYaziciMarkasi", name: "Uyumlu Yazıcı Markası", description: "Uyumlu olduğu yazıcı markası", mandatory: false, type: "select", values: ["HP", "Canon", "Brother", "Epson", "Samsung", "Xerox", "Lexmark", "Pantum", "Kyocera"], defaultValue: "HP" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["12", "24"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "Vergi oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  barcode_pos_scanner: [
    { id: "Marka", name: "Marka (Brand)", description: "Barkod cihazı markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "CihazTuru", name: "Barkod / POS Ekipman Türü", description: "Cihaz fonksiyonu", mandatory: true, type: "select", values: ["2D Karekod Barkod Okuyucu", "1D Lazer Barkod Okuyucu", "Masaüstü Barkod Okuyucu", "Termal Fiş & Etiket Yazıcı", "El Terminali (PDA / POS)", "Barkod Etiketi / Ribon Sarf"], defaultValue: "2D Karekod Barkod Okuyucu" },
    { id: "BaglantiTipi", name: "Bağlantı Türü", description: "İletişim arayüzü", mandatory: true, type: "select", values: ["Kablolu USB", "Kablosuz 2.4GHz + USB", "Bluetooth + Kablosuz", "USB + Ethernet (LAN)", "Wi-Fi + 4G (El Terminali)"], defaultValue: "Kablolu USB" },
    { id: "Renk", name: "Renk", description: "Cihaz rengi", mandatory: true, type: "select", values: ["Siyah", "Beyaz", "Gri"], defaultValue: "Siyah" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["12", "24", "36"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "Vergi oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  smartphone_devices: [
    { id: "Marka", name: "Marka (Brand)", description: "Telefon üretici markası", mandatory: true, type: "select", values: ["Apple", "Samsung", "Xiaomi", "Redmi", "POCO", "Huawei", "Honor", "Oppo", "Realme", "Nothing", "Tecno", "Infinix", "Reeder", "General Mobile"], defaultValue: "Apple" },
    { id: "DahiliHafiza", name: "Dahili Hafıza (Depolama)", description: "Telefon depolama kapasitesi", mandatory: true, type: "select", values: ["64 GB", "128 GB", "256 GB", "512 GB", "1 TB"], defaultValue: "128 GB" },
    { id: "RamKapasitesi", name: "RAM Kapasitesi", description: "Telefon sistem belleği", mandatory: true, type: "select", values: ["4 GB", "6 GB", "8 GB", "12 GB", "16 GB"], defaultValue: "8 GB" },
    { id: "EkranBoyutu", name: "Ekran Boyutu (İnç)", description: "Ekran büyüklüğü", mandatory: true, type: "select", values: ["6.1 inç", "6.3 inç", "6.5 inç", "6.7 inç", "6.8 inç", "6.9 inç"], defaultValue: "6.1 inç" },
    { id: "GarantiTipi", name: "Garanti Tipi", description: "Resmi distribütör veya ithalatçı garantisi", mandatory: true, type: "select", values: ["Resmi Distribütör Garantili (Apple / Samsung TR)", "İthalatçı Garantili"], defaultValue: "Resmi Distribütör Garantili (Apple / Samsung TR)" },
    { id: "Renk", name: "Renk (Color)", description: "Telefon kasa rengi", mandatory: true, type: "select", values: ["Siyah / Titanyum Siyah", "Beyaz / Yıldız Işığı", "Natürel Titanyum / Gri", "Mavi", "Gece Yarısı", "Mor", "Pembe", "Yeşil", "Altın / Gold"], defaultValue: "Siyah / Titanyum Siyah" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Yasal garanti süresi", mandatory: true, type: "select", values: ["24"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "Vergi oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  medical_healthcare: [
    { id: "Marka", name: "Marka (Brand)", description: "Medikal ürün veya cihaz markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "MedikalUrunTipi", name: "Medikal / Sağlık Ürün Türü", description: "Cihaz veya sarf türü", mandatory: true, type: "select", values: ["Koldan Ölçer Dijital Tansiyon Aleti", "Bilekten Ölçer Tansiyon Aleti", "Havalı Yatak (Boru Tipi / Baklava Tipi)", "Hasta Bakım Önlüğü & Sarf Malzeme", "Nebulizatör & Solunum Cihazı", "Temassız Ateş Ölçer / Termometre", "Oksimetre / Pulse Oksimetre"], defaultValue: "Koldan Ölçer Dijital Tansiyon Aleti" },
    { id: "KullanimTipi", name: "Kullanım Şekli", description: "Ev veya klinik kullanım", mandatory: false, type: "select", values: ["Ev & Klinik Tipi Otomatik", "Profesyonel Hastane Tipi", "Tek Kullanımlık / Steril"], defaultValue: "Ev & Klinik Tipi Otomatik" },
    { id: "Renk", name: "Renk", description: "Ürün rengi", mandatory: false, type: "select", values: ["Beyaz", "Mavi", "Gri", "Siyah"], defaultValue: "Beyaz" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi", mandatory: true, type: "select", values: ["12", "24", "36"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "KDV Oranı (%10 veya %20)", mandatory: true, type: "select", values: ["10", "20"], defaultValue: "10" }
  ],
  tech_chemicals: [
    { id: "Marka", name: "Marka (Brand)", description: "Kimyasal / bakım ürünü markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "KimyasalTipi", name: "Bakım / Kimyasal Türü", description: "Ürün fonksiyonu", mandatory: true, type: "select", values: ["Yağsız Kontak Sprey (Contact Cleaner)", "Yağlı Kontak Sprey", "Yag Çözücü (Degreaser) Sprey", "Termal Macun (CPU / GPU Soğutma)", "Basınçlı Hava & Toz Temizleyici Sprey", "Ekran & Elektronik Temizleme Köpüğü / Sıvısı"], defaultValue: "Yağsız Kontak Sprey (Contact Cleaner)" },
    { id: "HacimGramaj", name: "Hacim / Gramaj", description: "Sprey ml veya macun gr ölçüsü", mandatory: true, type: "select", values: ["200 ml", "250 ml", "400 ml", "500 ml", "4 gr / 8 gr (Termal Macun)"], defaultValue: "400 ml" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim ülkesi", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Türkiye" },
    { id: "GarantiSuresi", name: "Garanti / Raf Ömrü (Ay)", description: "Raf ömrü", mandatory: true, type: "select", values: ["12", "24", "36"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "Vergi oranı", mandatory: true, type: "select", values: ["10", "20"], defaultValue: "20" }
  ],
  general: [
    { id: "Marka", name: "Marka (Brand)", description: "Ürün markası", mandatory: true, type: "text", defaultValue: "$product.brand" },
    { id: "Mensei", name: "Menşei Ülke (Origin Country)", description: "Üretim yeri", mandatory: true, type: "select", values: MARKETPLACE_ORIGIN_COUNTRIES, defaultValue: "Çin" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi (Ay cinsinden)", mandatory: true, type: "select", values: ["6", "12", "24", "36"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "KDV Vergi Oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ]
};

// Exact Category ID Schema Registry (CTO Deterministic Map)
export const CATEGORY_ID_ATTRIBUTE_MAP: Record<string, MarketplaceAttribute[]> = {
  // Security & IP Cameras
  "2000103": COMMON_MARKETPLACE_ATTRIBUTES.security_camera,
  "7000304": COMMON_MARKETPLACE_ATTRIBUTES.security_camera,
  "651": COMMON_MARKETPLACE_ATTRIBUTES.security_camera,

  // Mobile & Tablets
  "371972": COMMON_MARKETPLACE_ATTRIBUTES.tablet_devices,
  "1000276": COMMON_MARKETPLACE_ATTRIBUTES.tablet_devices,
  "103102": COMMON_MARKETPLACE_ATTRIBUTES.tablet_devices,
  "7000120": COMMON_MARKETPLACE_ATTRIBUTES.tablet_devices,
  "371960": COMMON_MARKETPLACE_ATTRIBUTES.smartphone_devices,
  "600": COMMON_MARKETPLACE_ATTRIBUTES.smartphone_devices,
  "7000201": COMMON_MARKETPLACE_ATTRIBUTES.smartphone_devices,
  "1000301": COMMON_MARKETPLACE_ATTRIBUTES.smartphone_devices,
  "371965": COMMON_MARKETPLACE_ATTRIBUTES.phone_accessories,
  "371966": COMMON_MARKETPLACE_ATTRIBUTES.phone_accessories,
  "16113": COMMON_MARKETPLACE_ATTRIBUTES.audio_headphone,
  "371969": COMMON_MARKETPLACE_ATTRIBUTES.phone_accessories,
  "29010123": COMMON_MARKETPLACE_ATTRIBUTES.audio_headphone,
  "371970": COMMON_MARKETPLACE_ATTRIBUTES.phone_accessories,
  "371971": COMMON_MARKETPLACE_ATTRIBUTES.phone_accessories,
  "371973": COMMON_MARKETPLACE_ATTRIBUTES.phone_accessories,
  "371967": COMMON_MARKETPLACE_ATTRIBUTES.audio_headphone,
  "371968": COMMON_MARKETPLACE_ATTRIBUTES.smartwatch,

  // Laptops & Desktops
  "98": COMMON_MARKETPLACE_ATTRIBUTES.laptop_computer,
  "103100": COMMON_MARKETPLACE_ATTRIBUTES.laptop_computer,
  "103101": COMMON_MARKETPLACE_ATTRIBUTES.laptop_computer,
  "7000119": COMMON_MARKETPLACE_ATTRIBUTES.laptop_computer,
  "1000114": COMMON_MARKETPLACE_ATTRIBUTES.laptop_computer,
  "1000115": COMMON_MARKETPLACE_ATTRIBUTES.laptop_computer,
  "1000116": COMMON_MARKETPLACE_ATTRIBUTES.laptop_computer,
  "111001": COMMON_MARKETPLACE_ATTRIBUTES.toner_cartridge,
  "1000275": COMMON_MARKETPLACE_ATTRIBUTES.laptop_computer,

  // Trendyol Specific Leaf IDs
  "108656": COMMON_MARKETPLACE_ATTRIBUTES.usb_storage,
  "103108": COMMON_MARKETPLACE_ATTRIBUTES.memory_cards,
  "103109": COMMON_MARKETPLACE_ATTRIBUTES.memory_cards,
  "103668": COMMON_MARKETPLACE_ATTRIBUTES.ssd_hardware,
  "103669": COMMON_MARKETPLACE_ATTRIBUTES.ssd_hardware,
  "103670": COMMON_MARKETPLACE_ATTRIBUTES.ssd_hardware,
  "103671": COMMON_MARKETPLACE_ATTRIBUTES.ssd_hardware,
  "103672": COMMON_MARKETPLACE_ATTRIBUTES.ram_memory,
  "103673": COMMON_MARKETPLACE_ATTRIBUTES.motherboard,
  "103674": COMMON_MARKETPLACE_ATTRIBUTES.cpu_processor,
  "103675": COMMON_MARKETPLACE_ATTRIBUTES.gpu_graphics_card,
  "103676": COMMON_MARKETPLACE_ATTRIBUTES.power_supply_case,
  "103677": COMMON_MARKETPLACE_ATTRIBUTES.pc_cooling,
  "103665": COMMON_MARKETPLACE_ATTRIBUTES.laptop_bags,
  "103666": COMMON_MARKETPLACE_ATTRIBUTES.laptop_stand_cooler,
  "103667": COMMON_MARKETPLACE_ATTRIBUTES.notebook_adapters,
  "103680": COMMON_MARKETPLACE_ATTRIBUTES.monitors_screens,
  "103681": COMMON_MARKETPLACE_ATTRIBUTES.keyboards_mice,
  "103682": COMMON_MARKETPLACE_ATTRIBUTES.keyboards_mice,
  "103683": COMMON_MARKETPLACE_ATTRIBUTES.mousepad,
  "103684": COMMON_MARKETPLACE_ATTRIBUTES.usb_hub_adapters,
  "103685": COMMON_MARKETPLACE_ATTRIBUTES.cables_converters,
  "103686": COMMON_MARKETPLACE_ATTRIBUTES.network_router,
  "103687": COMMON_MARKETPLACE_ATTRIBUTES.printers_scanners,
  "103688": COMMON_MARKETPLACE_ATTRIBUTES.toner_cartridge,
  "103689": COMMON_MARKETPLACE_ATTRIBUTES.barcode_pos_scanner,
  "103690": COMMON_MARKETPLACE_ATTRIBUTES.presenter_remote,
  "103691": COMMON_MARKETPLACE_ATTRIBUTES.electronics,
  "103692": COMMON_MARKETPLACE_ATTRIBUTES.tech_chemicals,
  "703": COMMON_MARKETPLACE_ATTRIBUTES.medical_healthcare,
  "652": COMMON_MARKETPLACE_ATTRIBUTES.photography_camera,
  "653": COMMON_MARKETPLACE_ATTRIBUTES.audio_headphone,

  // N11 Default Categories Mapping
  "1000268": COMMON_MARKETPLACE_ATTRIBUTES.usb_storage,
  "1000270": COMMON_MARKETPLACE_ATTRIBUTES.memory_cards,
  "1000269": COMMON_MARKETPLACE_ATTRIBUTES.ssd_hardware,
  "1000271": COMMON_MARKETPLACE_ATTRIBUTES.ssd_hardware,
  "1000272": COMMON_MARKETPLACE_ATTRIBUTES.memory_cards,
  "1000273": COMMON_MARKETPLACE_ATTRIBUTES.ram_memory,
  "1000274": COMMON_MARKETPLACE_ATTRIBUTES.motherboard,
  "1000278": COMMON_MARKETPLACE_ATTRIBUTES.monitors_screens,
  "1000280": COMMON_MARKETPLACE_ATTRIBUTES.keyboards_mice,
  "1000281": COMMON_MARKETPLACE_ATTRIBUTES.mousepad,
  "1000282": COMMON_MARKETPLACE_ATTRIBUTES.network_router,
  "1000285": COMMON_MARKETPLACE_ATTRIBUTES.laptop_bags,
  "1000286": COMMON_MARKETPLACE_ATTRIBUTES.laptop_stand_cooler,
  "1000287": COMMON_MARKETPLACE_ATTRIBUTES.notebook_adapters,
  "1000288": COMMON_MARKETPLACE_ATTRIBUTES.usb_hub_adapters,
  "1000289": COMMON_MARKETPLACE_ATTRIBUTES.cables_converters,
  "1000290": COMMON_MARKETPLACE_ATTRIBUTES.printers_scanners,
  "1000291": COMMON_MARKETPLACE_ATTRIBUTES.toner_cartridge,
  "1000292": COMMON_MARKETPLACE_ATTRIBUTES.barcode_pos_scanner,
  "1000293": COMMON_MARKETPLACE_ATTRIBUTES.presenter_remote,
  "1000305": COMMON_MARKETPLACE_ATTRIBUTES.phone_accessories,
  "1000308": COMMON_MARKETPLACE_ATTRIBUTES.phone_accessories,
  "1000312": COMMON_MARKETPLACE_ATTRIBUTES.phone_accessories,
  "1000315": COMMON_MARKETPLACE_ATTRIBUTES.audio_headphone,
  "1000320": COMMON_MARKETPLACE_ATTRIBUTES.smartwatch,
  "1000401": COMMON_MARKETPLACE_ATTRIBUTES.monitors_screens,
  "1000410": COMMON_MARKETPLACE_ATTRIBUTES.security_camera,
  "1000415": COMMON_MARKETPLACE_ATTRIBUTES.photography_camera,
  "1000501": COMMON_MARKETPLACE_ATTRIBUTES.apparel,
  "1000505": COMMON_MARKETPLACE_ATTRIBUTES.apparel,
  "1000510": COMMON_MARKETPLACE_ATTRIBUTES.apparel,
  "1000601": COMMON_MARKETPLACE_ATTRIBUTES.home_kitchen,
  "1000610": COMMON_MARKETPLACE_ATTRIBUTES.home_kitchen,
  "1000620": COMMON_MARKETPLACE_ATTRIBUTES.medical_healthcare,
  "1000701": COMMON_MARKETPLACE_ATTRIBUTES.auto,

  // Amazon Additional Leaf IDs
  "7000118": COMMON_MARKETPLACE_ATTRIBUTES.laptop_bags,
  "7000121": COMMON_MARKETPLACE_ATTRIBUTES.notebook_adapters,
  "7000122": COMMON_MARKETPLACE_ATTRIBUTES.toner_cartridge,
  "7000123": COMMON_MARKETPLACE_ATTRIBUTES.barcode_pos_scanner,
  "7000124": COMMON_MARKETPLACE_ATTRIBUTES.motherboard,
  "7000125": COMMON_MARKETPLACE_ATTRIBUTES.presenter_remote,
  "7000305": COMMON_MARKETPLACE_ATTRIBUTES.photography_camera,
  "7000404": COMMON_MARKETPLACE_ATTRIBUTES.medical_healthcare,

  // USB Hubs & Adapters
  "1000122": COMMON_MARKETPLACE_ATTRIBUTES.usb_hub_adapters,
  "7000114": COMMON_MARKETPLACE_ATTRIBUTES.usb_hub_adapters,

  // Notebook Adapters
  "1000190": COMMON_MARKETPLACE_ATTRIBUTES.notebook_adapters,
  "1000191": COMMON_MARKETPLACE_ATTRIBUTES.notebook_adapters,
  "1000192": COMMON_MARKETPLACE_ATTRIBUTES.notebook_adapters,
  "1000193": COMMON_MARKETPLACE_ATTRIBUTES.notebook_adapters,
  "1000194": COMMON_MARKETPLACE_ATTRIBUTES.notebook_adapters,
  "1000195": COMMON_MARKETPLACE_ATTRIBUTES.notebook_adapters,
  "1000196": COMMON_MARKETPLACE_ATTRIBUTES.notebook_adapters,
  "1000197": COMMON_MARKETPLACE_ATTRIBUTES.notebook_adapters,
  "1000198": COMMON_MARKETPLACE_ATTRIBUTES.notebook_adapters,

  // USB Flash Storage & Memory Cards
  "970": COMMON_MARKETPLACE_ATTRIBUTES.usb_storage,
  "1000101": COMMON_MARKETPLACE_ATTRIBUTES.usb_storage,
  "7000101": COMMON_MARKETPLACE_ATTRIBUTES.usb_storage,
  "698": COMMON_MARKETPLACE_ATTRIBUTES.memory_cards,
  "1000102": COMMON_MARKETPLACE_ATTRIBUTES.memory_cards,
  "1100011": COMMON_MARKETPLACE_ATTRIBUTES.memory_cards,
  "1000103": COMMON_MARKETPLACE_ATTRIBUTES.memory_cards,
  "60003724": COMMON_MARKETPLACE_ATTRIBUTES.memory_cards,
  "7000102": COMMON_MARKETPLACE_ATTRIBUTES.memory_cards,
  "7000103": COMMON_MARKETPLACE_ATTRIBUTES.memory_cards,

  // SSD & Hard Drives
  "1000104": COMMON_MARKETPLACE_ATTRIBUTES.ssd_hardware,
  "1000105": COMMON_MARKETPLACE_ATTRIBUTES.ssd_hardware,
  "1000106": COMMON_MARKETPLACE_ATTRIBUTES.ssd_hardware,
  "1000107": COMMON_MARKETPLACE_ATTRIBUTES.ssd_hardware,
  "100225": COMMON_MARKETPLACE_ATTRIBUTES.ssd_hardware,
  "100221": COMMON_MARKETPLACE_ATTRIBUTES.ssd_hardware,
  "7000104": COMMON_MARKETPLACE_ATTRIBUTES.ssd_hardware,
  "7000105": COMMON_MARKETPLACE_ATTRIBUTES.ssd_hardware,

  // PC Components
  "47": COMMON_MARKETPLACE_ATTRIBUTES.ram_memory,
  "1000108": COMMON_MARKETPLACE_ATTRIBUTES.ram_memory,
  "7000106": COMMON_MARKETPLACE_ATTRIBUTES.ram_memory,
  "1000109": COMMON_MARKETPLACE_ATTRIBUTES.motherboard,
  "1000110": COMMON_MARKETPLACE_ATTRIBUTES.cpu_processor,
  "1000111": COMMON_MARKETPLACE_ATTRIBUTES.gpu_graphics_card,
  "1000112": COMMON_MARKETPLACE_ATTRIBUTES.power_supply_case,
  "1000113": COMMON_MARKETPLACE_ATTRIBUTES.pc_cooling,
  "1000124": COMMON_MARKETPLACE_ATTRIBUTES.laptop_stand_cooler,
  "106861": COMMON_MARKETPLACE_ATTRIBUTES.laptop_stand_cooler,
  "7000113": COMMON_MARKETPLACE_ATTRIBUTES.laptop_stand_cooler,

  // Monitors & TV
  "57": COMMON_MARKETPLACE_ATTRIBUTES.monitors_screens,
  "1000117": COMMON_MARKETPLACE_ATTRIBUTES.monitors_screens,
  "2000101": COMMON_MARKETPLACE_ATTRIBUTES.monitors_screens,
  "7000110": COMMON_MARKETPLACE_ATTRIBUTES.monitors_screens,
  "7000301": COMMON_MARKETPLACE_ATTRIBUTES.monitors_screens,

  // Keyboards, Mice & Mousepads
  "51": COMMON_MARKETPLACE_ATTRIBUTES.keyboards_mice,
  "52": COMMON_MARKETPLACE_ATTRIBUTES.keyboards_mice,
  "3007055": COMMON_MARKETPLACE_ATTRIBUTES.keyboards_mice,
  "29": COMMON_MARKETPLACE_ATTRIBUTES.mousepad,
  "1000118": COMMON_MARKETPLACE_ATTRIBUTES.keyboards_mice,
  "1000119": COMMON_MARKETPLACE_ATTRIBUTES.keyboards_mice,
  "7000107": COMMON_MARKETPLACE_ATTRIBUTES.keyboards_mice,
  "7000108": COMMON_MARKETPLACE_ATTRIBUTES.keyboards_mice,
  "7000109": COMMON_MARKETPLACE_ATTRIBUTES.mousepad,

  // Audio & Soundbars
  "520": COMMON_MARKETPLACE_ATTRIBUTES.audio_headphone,
  "1000120": COMMON_MARKETPLACE_ATTRIBUTES.audio_headphone,
  "2000102": COMMON_MARKETPLACE_ATTRIBUTES.audio_headphone,
  "7000112": COMMON_MARKETPLACE_ATTRIBUTES.audio_headphone,
  "7000206": COMMON_MARKETPLACE_ATTRIBUTES.audio_headphone,
  "7000302": COMMON_MARKETPLACE_ATTRIBUTES.audio_headphone,
  "7000303": COMMON_MARKETPLACE_ATTRIBUTES.audio_headphone,

  // Cables & Converters & Barcode POS
  "105307": COMMON_MARKETPLACE_ATTRIBUTES.barcode_pos_scanner,
  "1000181": COMMON_MARKETPLACE_ATTRIBUTES.cables_converters,
  "1000182": COMMON_MARKETPLACE_ATTRIBUTES.cables_converters,
  "1000183": COMMON_MARKETPLACE_ATTRIBUTES.cables_converters,
  "1000184": COMMON_MARKETPLACE_ATTRIBUTES.cables_converters,
  "1000185": COMMON_MARKETPLACE_ATTRIBUTES.cables_converters,
  "1000186": COMMON_MARKETPLACE_ATTRIBUTES.cables_converters,
  "1000187": COMMON_MARKETPLACE_ATTRIBUTES.cables_converters,
  "7000115": COMMON_MARKETPLACE_ATTRIBUTES.cables_converters,

  // Laptop Bags
  "676": COMMON_MARKETPLACE_ATTRIBUTES.laptop_bags,
  "1000123": COMMON_MARKETPLACE_ATTRIBUTES.laptop_bags,
  "1000135": COMMON_MARKETPLACE_ATTRIBUTES.laptop_bags,
  "1000136": COMMON_MARKETPLACE_ATTRIBUTES.laptop_bags,
  "1000137": COMMON_MARKETPLACE_ATTRIBUTES.laptop_bags,

  // Presenters & Office
  "1000138": COMMON_MARKETPLACE_ATTRIBUTES.presenter_remote,
  "1000139": COMMON_MARKETPLACE_ATTRIBUTES.presenter_remote,

  // Network & Routers & PC Components
  "410": COMMON_MARKETPLACE_ATTRIBUTES.network_router,
  "45": COMMON_MARKETPLACE_ATTRIBUTES.gpu_graphics_card,
  "121": COMMON_MARKETPLACE_ATTRIBUTES.motherboard,
  "103939": COMMON_MARKETPLACE_ATTRIBUTES.ssd_hardware,
  "319": COMMON_MARKETPLACE_ATTRIBUTES.cpu_processor,
  "1000125": COMMON_MARKETPLACE_ATTRIBUTES.network_router,
  "1000126": COMMON_MARKETPLACE_ATTRIBUTES.network_router,
  "1000127": COMMON_MARKETPLACE_ATTRIBUTES.network_wifi_adapter,
  "1000128": COMMON_MARKETPLACE_ATTRIBUTES.network_router,
  "7000117": COMMON_MARKETPLACE_ATTRIBUTES.network_wifi_adapter,

  // Printers, Scanners, Toner & Barcode POS
  "4": COMMON_MARKETPLACE_ATTRIBUTES.printers_scanners,
  "1000129": COMMON_MARKETPLACE_ATTRIBUTES.printers_scanners,
  "1000130": COMMON_MARKETPLACE_ATTRIBUTES.toner_cartridge,
  "1000131": COMMON_MARKETPLACE_ATTRIBUTES.barcode_pos_scanner,
  "7000116": COMMON_MARKETPLACE_ATTRIBUTES.printers_scanners,

  // Photography Cameras & Accessories
  "2000201": COMMON_MARKETPLACE_ATTRIBUTES.photography_camera,
  "2000202": COMMON_MARKETPLACE_ATTRIBUTES.photography_camera,
  "2000203": COMMON_MARKETPLACE_ATTRIBUTES.photography_camera,
  "2000204": COMMON_MARKETPLACE_ATTRIBUTES.photography_camera,
  "2000205": COMMON_MARKETPLACE_ATTRIBUTES.photography_camera,
  "2000206": COMMON_MARKETPLACE_ATTRIBUTES.photography_camera,
  "2000207": COMMON_MARKETPLACE_ATTRIBUTES.photography_camera,

  // Medical & Healthcare
  "26012174": COMMON_MARKETPLACE_ATTRIBUTES.medical_healthcare,

  // Apparel & Shoes
  "60003858": COMMON_MARKETPLACE_ATTRIBUTES.apparel,
  "60003859": COMMON_MARKETPLACE_ATTRIBUTES.apparel,
  "60003857": COMMON_MARKETPLACE_ATTRIBUTES.apparel,
  "60003860": COMMON_MARKETPLACE_ATTRIBUTES.apparel,
  "12101943": COMMON_MARKETPLACE_ATTRIBUTES.apparel,
  "12101944": COMMON_MARKETPLACE_ATTRIBUTES.apparel,
  "12101945": COMMON_MARKETPLACE_ATTRIBUTES.apparel,
  "12101946": COMMON_MARKETPLACE_ATTRIBUTES.apparel,
  "12101947": COMMON_MARKETPLACE_ATTRIBUTES.apparel,
  "12101948": COMMON_MARKETPLACE_ATTRIBUTES.apparel,
  "12101949": COMMON_MARKETPLACE_ATTRIBUTES.apparel,

  // General Electronics & Specialized Child Accessories
  "1000121": COMMON_MARKETPLACE_ATTRIBUTES.webcam_camera,
  "7000111": COMMON_MARKETPLACE_ATTRIBUTES.webcam_camera,
  "1000294": COMMON_MARKETPLACE_ATTRIBUTES.webcam_camera,
  "1000132": COMMON_MARKETPLACE_ATTRIBUTES.ssd_hardware,
  "1000133": COMMON_MARKETPLACE_ATTRIBUTES.tech_chemicals,
  "1000134": COMMON_MARKETPLACE_ATTRIBUTES.power_strip_socket,
  "103693": COMMON_MARKETPLACE_ATTRIBUTES.power_strip_socket,
  "7000128": COMMON_MARKETPLACE_ATTRIBUTES.power_strip_socket,
  "1000296": COMMON_MARKETPLACE_ATTRIBUTES.power_strip_socket,
  "1000140": COMMON_MARKETPLACE_ATTRIBUTES.stylus_pen,
  "7000127": COMMON_MARKETPLACE_ATTRIBUTES.stylus_pen,
  "1000188": COMMON_MARKETPLACE_ATTRIBUTES.electronics,
  "1000189": COMMON_MARKETPLACE_ATTRIBUTES.electronics,
  "2000104": COMMON_MARKETPLACE_ATTRIBUTES.tv_mount_remote,
  "2000105": COMMON_MARKETPLACE_ATTRIBUTES.audio_headphone,
  "371974": COMMON_MARKETPLACE_ATTRIBUTES.dect_landline_phone,
  "606": COMMON_MARKETPLACE_ATTRIBUTES.dect_landline_phone,
  "7000208": COMMON_MARKETPLACE_ATTRIBUTES.dect_landline_phone,
  "1000302": COMMON_MARKETPLACE_ATTRIBUTES.dect_landline_phone,
  "7000126": COMMON_MARKETPLACE_ATTRIBUTES.tech_chemicals,
  "1000295": COMMON_MARKETPLACE_ATTRIBUTES.tech_chemicals
};

// Returns relevant attributes based on Child Category Name/Path first, then Category ID
export function getAttributesForCategory(catName: string, paths: string[] = [], categoryId?: string | number): MarketplaceAttribute[] {
  const safePaths: string[] = Array.isArray(paths) ? [...paths] : (typeof paths === "string" ? [paths] : []);
  let resolvedCatId = categoryId !== undefined && categoryId !== null ? String(categoryId).trim() : "";
  let resolvedCatName = String(catName || "").trim();

  // If catName is purely numeric or is an ID and categoryId was not supplied, treat catName as categoryId
  if (!resolvedCatId && /^\d+$/.test(resolvedCatName)) {
    resolvedCatId = resolvedCatName;
    resolvedCatName = "";
  }

  // Always hydrate category name & paths from catalog when resolvedCatId is known and name/paths are missing
  if (resolvedCatId && (!resolvedCatName || /^\d+$/.test(resolvedCatName) || safePaths.length === 0)) {
    const allKnown = [
      ...HEPSIBURADA_DEFAULT_CATEGORIES,
      ...TRENDYOL_DEFAULT_CATEGORIES,
      ...AMAZON_DEFAULT_CATEGORIES,
      ...N11_DEFAULT_CATEGORIES,
      ...PAZARAMA_DEFAULT_CATEGORIES
    ];
    const foundCat = allKnown.find(c => String(c.id) === resolvedCatId);
    if (foundCat) {
      if (!resolvedCatName || /^\d+$/.test(resolvedCatName)) {
        resolvedCatName = foundCat.name || foundCat.displayName || "";
      }
      if (safePaths.length === 0 && Array.isArray(foundCat.paths)) {
        safePaths.push(...foundCat.paths);
      }
    }
  }

  // Direct O(1) Category ID Schema Resolution (when Category ID is valid and not the generic 2147483647 placeholder)
  if (resolvedCatId && resolvedCatId !== "2147483647" && resolvedCatId !== "0" && resolvedCatId !== "null" && resolvedCatId !== "undefined" && CATEGORY_ID_ATTRIBUTE_MAP[resolvedCatId]) {
    const isGenericLaptopParent = ["98", "3000500", "103165"].includes(resolvedCatId);
    if (!isGenericLaptopParent) {
      return CATEGORY_ID_ATTRIBUTE_MAP[resolvedCatId];
    }
  }

  const rawLeaf = String(resolvedCatName || (safePaths.length > 0 ? safePaths[safePaths.length - 1] : "") || "");
  const rawFull = `${resolvedCatName} ${safePaths.join(" ")}`;
  const leafText = `${rawLeaf.replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase()} ${normalizeCategoryText(rawLeaf)}`.trim();
  const text = `${rawFull.replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase()} ${normalizeCategoryText(rawFull)}`.trim();

  // Child Category Specific Override Checks (Ensures child categories like 'Notebook Çantası', 'Laptop Standı', 'Mouse Pad', 'Sunum Kumandası' NEVER inherit parent category fields!)
  if (
    text.includes("notebook çanta") ||
    text.includes("laptop çanta") ||
    text.includes("notebook canta") ||
    text.includes("laptop canta") ||
    text.includes("notebook kılıf") ||
    text.includes("laptop kılıf") ||
    text.includes("evrak çanta") ||
    text.includes("sırt çanta") ||
    text.includes("sirt canta") ||
    text.includes("çanta 13") ||
    text.includes("çanta 14") ||
    text.includes("çanta 15") ||
    text.includes("çanta 16") ||
    text.includes("çanta 17") ||
    text.includes("sleeve") ||
    (text.includes("notebook") && text.includes("çanta")) ||
    (text.includes("laptop") && text.includes("çanta"))
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.laptop_bags;
  }

  if (
    text.includes("laptop stand") ||
    text.includes("notebook stand") ||
    text.includes("laptop soğutucu") ||
    text.includes("notebook soğutucu") ||
    text.includes("monitör stand")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.laptop_stand_cooler;
  }

  if (
    text.includes("mouse pad") ||
    text.includes("mousepad") ||
    text.includes("masa pedi")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.mousepad;
  }

  if (
    text.includes("sunum kumanda") ||
    text.includes("presenter") ||
    text.includes("lazer pointer") ||
    text.includes("laser pointer")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.presenter_remote;
  }

  if (
    text.includes("barkod okuyucu") ||
    text.includes("barkod yazıcı") ||
    text.includes("barkod sarf") ||
    text.includes("termal yazıcı") ||
    text.includes("el terminali") ||
    text.includes("el terminal") ||
    text.includes("pda terminal")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.barcode_pos_scanner;
  }

  if (
    text.includes("toner") ||
    text.includes("kartuş") ||
    text.includes("kartus") ||
    (text.includes("sarf malzeme") && !text.includes("barkod"))
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.toner_cartridge;
  }

  // Child Category Override: Teknoloji Kimyasalları, Contact Cleaner, Degreaser, Termal Macun
  if (
    text.includes("contact cleaner") ||
    text.includes("kontak sprey") ||
    text.includes("degreaser") ||
    text.includes("yağ çözücü") ||
    text.includes("termal macun") ||
    text.includes("teknoloji kimyasal") ||
    (text.includes("kimyasal") && (text.includes("soğutma") || text.includes("temiz")))
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.tech_chemicals;
  }

  // Child Category Override: Medikal Cihaz, Tansiyon Aleti, Hasta Bakım, Boru Tipi Yatak, Hasta Önlüğü
  if (
    text.includes("tansiyon alet") ||
    text.includes("medikal cihaz") ||
    text.includes("hasta bakım") ||
    text.includes("hasta bakim") ||
    text.includes("boru tipi yatak") ||
    text.includes("havalı yatak") ||
    text.includes("hasta önlüğü") ||
    text.includes("hasta onlugu") ||
    text.includes("nebulizatör") ||
    text.includes("oksimetre")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.medical_healthcare;
  }

  // Child Category Override: Web Kamerası (Webcam)
  if (
    text.includes("webcam") ||
    text.includes("web kamera") ||
    text.includes("yayıncı kamera") ||
    text.includes("yayinci kamera")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.webcam_camera;
  }

  // Child Category Override: Akım Korumalı Priz, Grup Priz & Uzatma Kablosu
  if (
    text.includes("akım korumalı priz") ||
    text.includes("akim korumali priz") ||
    text.includes("grup priz") ||
    text.includes("uzatma kablo") ||
    text.includes("çoklu priz") ||
    text.includes("coklu priz")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.power_strip_socket;
  }

  // Child Category Override: Dokunmatik Kalem (Stylus)
  if (
    text.includes("stylus") ||
    text.includes("dokunmatik kalem") ||
    text.includes("ipad kalem") ||
    text.includes("tablet kalem")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.stylus_pen;
  }

  // Child Category Override: Telsiz & Masaüstü DECT Telefon
  if (
    text.includes("telsiz telefon") ||
    text.includes("dect telefon") ||
    text.includes("masaüstü telefon") ||
    text.includes("masaustu telefon") ||
    text.includes("sabit telefon") ||
    text.includes("ip telefon")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.dect_landline_phone;
  }

  // Child Category Override: TV Askı Aparatları & Kumanda
  if (
    text.includes("tv askı") ||
    text.includes("tv aski") ||
    text.includes("duvar askı aparat") ||
    text.includes("tv kumanda") ||
    text.includes("uydu kumanda")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.tv_mount_remote;
  }

  // Wi-Fi Adaptörleri, USB Wi-Fi, Ağ Kartları & Bluetooth Dongle
  if (
    text.includes("1000127") ||
    text.includes("wi-fi adaptör") ||
    text.includes("wifi adaptör") ||
    text.includes("wifi adaptor") ||
    text.includes("wi-fi adaptor") ||
    text.includes("ağ adaptör") ||
    text.includes("ag adaptor") ||
    text.includes("kablosuz adaptör") ||
    text.includes("kablosuz adaptor") ||
    text.includes("kablosuz alıcı") ||
    text.includes("kablosuz alici") ||
    text.includes("usb wifi") ||
    text.includes("usb wi-fi") ||
    text.includes("wifi alıcı") ||
    text.includes("wifi alici") ||
    text.includes("ağ kartı") ||
    text.includes("ag karti") ||
    text.includes("bluetooth adaptör") ||
    text.includes("bluetooth adaptor") ||
    text.includes("dongle")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.network_wifi_adapter;
  }

  // 0a. Tablet Bilgisayarlar & iPad (Device itself) - MUST match before phone accessories!
  if (
    (
      text.includes("371972") ||
      text.includes("1000276") ||
      text.includes("tablet bilgisayar") ||
      text.includes("ipad") ||
      (text.includes("tablet") && !text.includes("kılıf") && !text.includes("kilif") && !text.includes("cam") && !text.includes("koruyucu") && !text.includes("kalem") && !text.includes("tutucu") && !text.includes("çanta") && !text.includes("canta") && !text.includes("şarj") && !text.includes("sarj") && !text.includes("stant") && !text.includes("stand"))
    ) && !text.includes("servis")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.tablet_devices;
  }

  // 0b. Notebook Adaptörleri, Bataryaları & Güç Kabloları (Dell, Asus, HP, Lenovo vb.) - MUST match before phone chargers!
  if (
    text.includes("notebook adaptör") ||
    text.includes("laptop adaptör") ||
    text.includes("notebook adaptor") ||
    text.includes("laptop adaptor") ||
    text.includes("laptop batarya") ||
    text.includes("notebook batarya") ||
    text.includes("güç kablosu-laptop") ||
    text.includes("guc kablosu-laptop") ||
    text.includes("dell notebook adaptör") ||
    text.includes("asus notebook adaptör") ||
    text.includes("hp notebook adaptör") ||
    text.includes("lenovo notebook adaptör") ||
    text.includes("macbook şarj") ||
    text.includes("macbook adaptor") ||
    text.includes("notebook şarj") ||
    (text.includes("adaptör") && (text.includes("notebook") || text.includes("laptop") || text.includes("dell") || text.includes("asus") || text.includes("hp") || text.includes("lenovo") || text.includes("bilgisayar"))) ||
    (text.includes("batarya") && (text.includes("notebook") || text.includes("laptop")))
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.notebook_adapters;
  }

  // 0b-2. Dizüstü Bilgisayar (Laptop / Notebook), Masaüstü PC & Mini PC (Device itself)
  if (
    (
      leafText === "notebook" ||
      leafText === "laptop" ||
      leafText.includes("dizüstü bilgisayar") ||
      leafText.includes("dizustu bilgisayar") ||
      leafText.includes("masaüstü bilgisayar") ||
      leafText.includes("masaustu bilgisayar") ||
      leafText.includes("mini pc") ||
      leafText.includes("all-in-one") ||
      text.includes("dizüstü bilgisayar") ||
      text.includes("masaüstü bilgisayar") ||
      text.includes("mini pc") ||
      ((text.includes("notebook") || text.includes("laptop")) && !text.includes("çanta") && !text.includes("canta") && !text.includes("kılıf") && !text.includes("kilif") && !text.includes("stand") && !text.includes("soğutucu") && !text.includes("sogutucu") && !text.includes("adaptör") && !text.includes("adaptor") && !text.includes("batarya") && !text.includes("ram") && !text.includes("kablo") && !text.includes("şarj") && !text.includes("sarj"))
    ) && !text.includes("servis")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.laptop_computer;
  }

  // 0c. USB Hub, Type-C Çoklayıcı & Çoğaltıcılar (#1000122) - MUST match BEFORE USB Flash Storage and Cables!
  if (
    text.includes("1000122") ||
    text.includes("usb hub") ||
    text.includes("usb-c hub") ||
    text.includes("type-c hub") ||
    text.includes("type c hub") ||
    text.includes("multihub") ||
    text.includes("hub&çoğaltıcı") ||
    text.includes("hub & çoğaltıcı") ||
    text.includes("hub çoğaltıcı") ||
    text.includes("çoğaltıcı") ||
    text.includes("cogaltici") ||
    text.includes("type-c çoklayıcı") ||
    text.includes("type c çoklayıcı") ||
    text.includes("type-c coklayici") ||
    text.includes("çoklayıcı adaptör") ||
    text.includes("coklayici adaptor") ||
    text.includes("multiport") ||
    text.includes("docking station") ||
    ((text.includes("usb") || text.includes("kablo")) && (text.includes("hub") || text.includes("çoklayıcı") || text.includes("coklayici") || text.includes("çoğaltıcı") || text.includes("cogaltici")))
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.usb_hub_adapters;
  }

  // 0d. Kablo & Görüntü/Ağ/Ses Kablo ve Dönüştürücüleri (#1000181 - #1000187)
  if (
    text.includes("1000181") ||
    text.includes("1000182") ||
    text.includes("1000183") ||
    text.includes("1000184") ||
    text.includes("1000185") ||
    text.includes("1000186") ||
    text.includes("1000187") ||
    text.includes("hdmi kablo") ||
    text.includes("displayport kablo") ||
    text.includes("ethernet kablo") ||
    text.includes("ses&görüntü kablosu") ||
    text.includes("ses & görüntü kablosu") ||
    text.includes("görüntü kablo") ||
    text.includes("ses kablo") ||
    text.includes("cat6") ||
    text.includes("cat7") ||
    text.includes("aux kablo") ||
    (text.includes("kablo") && text.includes("dönüştürücü") && !text.includes("şarj") && !text.includes("sarj") && !text.includes("data") && !text.includes("apple") && !text.includes("iphone") && !text.includes("telefon"))
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.cables_converters;
  }

  // 0e. Kulaklık & Hoparlör / Speaker (MUST match BEFORE generic 'kablo' in phone_accessories so 'Kablolu Kulaklık' and 'Kablolu Speaker' get audio_headphone!)
  if (
    text.includes("kulaklık") ||
    text.includes("kulaklik") ||
    text.includes("headphone") ||
    text.includes("earphone") ||
    text.includes("tws") ||
    text.includes("soundbar") ||
    text.includes("hoparlör") ||
    text.includes("hoparlor") ||
    text.includes("speaker") ||
    text.includes("ses sistemi") ||
    text.includes("ses sistemleri")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.audio_headphone;
  }

  // 0f. Ağ, Modem, Router, Switch & USB Bluetooth/Wi-Fi Adaptörler (MUST match before generic 'usb' in usb_storage!)
  if (
    text.includes("modem") ||
    text.includes("router") ||
    text.includes("switch") ||
    text.includes("ağ ekipman") ||
    text.includes("kablolama ekipman") ||
    text.includes("access point") ||
    text.includes("powerline") ||
    text.includes("usb bluetooth") ||
    text.includes("bluetooth adaptör") ||
    text.includes("wi-fi") ||
    text.includes("network")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.network_router;
  }

  // 0g. RAM & Sistem Belleği (Laptop RAM / PC RAM) - MUST match BEFORE generic 'bellek' in usb_storage!
  if (
    text.includes("laptop ram") ||
    text.includes("pc ram") ||
    text.includes("ram (bellek") ||
    text.includes("ram bellek") ||
    text.includes("ddr4") ||
    text.includes("ddr5") ||
    text.includes("so-dimm") ||
    /\bram\b/.test(text)
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.ram_memory;
  }

  // 1. Laptop & Notebook Çantaları, Kılıfları, Sleeveler (MUST match BEFORE phone accessories!)
  if (
    text.includes("notebook çanta") ||
    text.includes("laptop çanta") ||
    text.includes("notebook kılıf") ||
    text.includes("laptop kılıf") ||
    text.includes("evrak çanta") ||
    text.includes("sırt çanta") ||
    text.includes("sleeve") ||
    text.includes("laptop çantaları") ||
    text.includes("notebook çantaları") ||
    (text.includes("laptop") && (text.includes("çanta") || text.includes("kılıf"))) ||
    (text.includes("notebook") && (text.includes("çanta") || text.includes("kılıf")))
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.laptop_bags;
  }

  // 2. Sunum Kumandaları, Presenter, Lazer Pointer
  if (
    text.includes("sunum kumanda") ||
    text.includes("presenter") ||
    text.includes("lazer pointer") ||
    text.includes("laser pointer") ||
    text.includes("sunum kumandasi") ||
    text.includes("sunum ekipman")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.presenter_remote;
  }

  // 3. USB Flash Bellek & Veri Depolama (MUST match BEFORE photography/camera to avoid false positives on 'flas'/'flash')
  if (
    text.includes("usb flash") ||
    text.includes("flash bellek") ||
    text.includes("flash drive") ||
    text.includes("usb drive") ||
    text.includes("usb bellek") ||
    (text.includes("usb") && text.includes("bellek")) ||
    (text.includes("veri depolama") && (text.includes("usb") || text.includes("flash") || text.includes("bellek")))
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.usb_storage;
  }

  // 3.5. Güvenlik & IP Kameraları (#2000103) - MUST match BEFORE photography_camera!
  if (
    text.includes("2000103") ||
    text.includes("7000304") ||
    text.includes("güvenlik kamera") ||
    text.includes("guvenlik kamera") ||
    text.includes("ip kamera") ||
    text.includes("ip güvenlik") ||
    text.includes("güvenlik sistemleri") ||
    (text.includes("güvenlik") && text.includes("kamera"))
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.security_camera;
  }

  // 4. Fotoğrafçılık, Kameralar, Tripod, Lens, Aksiyon Kamera, Kamera Çantası
  if (
    text.includes("fotoğraf") ||
    text.includes("fotograf") ||
    text.includes("tripod") ||
    text.includes("monopod") ||
    text.includes("gimbal") ||
    text.includes("lens") ||
    text.includes("tepe flaş") ||
    text.includes("stüdyo flaş") ||
    (text.includes("flaş") && !text.includes("flash") && !text.includes("bellek")) ||
    (text.includes("kamera") && !text.includes("webcam") && !text.includes("web kamerası"))
  ) {
    if (text.includes("webcam") || text.includes("web kamerası")) {
      return COMMON_MARKETPLACE_ATTRIBUTES.electronics;
    }
    return COMMON_MARKETPLACE_ATTRIBUTES.photography_camera;
  }

  // 5. Diğer USB Bellek & Veri Depolama Fallback
  if (
    (text.includes("usb") && !text.includes("kablo") && !text.includes("şarj")) ||
    text.includes("flash") ||
    text.includes("bellekler")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.usb_storage;
  }

  // 5. Kart Okuyucu & Hafıza Kartları
  if (
    text.includes("kart okuyucu") ||
    text.includes("hafıza kart") ||
    text.includes("hafiza kart") ||
    text.includes("microsd") ||
    text.includes("sd kart") ||
    (text.includes("depolama") && text.includes("kartlar"))
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.memory_cards;
  }

  // 6a. RAM & Bellek
  if (
    text.includes("ram") ||
    text.includes("bellek") ||
    text.includes("ddr4") ||
    text.includes("ddr5") ||
    text.includes("so-dimm")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.ram_memory;
  }

  // 6b. Anakart / Motherboard
  if (
    text.includes("anakart") ||
    text.includes("motherboard") ||
    text.includes("chipset") ||
    text.includes("yonga seti")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.motherboard;
  }

  // 6c. İşlemci / CPU
  if (
    text.includes("işlemci") ||
    text.includes("islemci") ||
    text.includes("processor") ||
    text.includes("ryzen") ||
    text.includes("intel core")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.cpu_processor;
  }

  // 6d. Ekran Kartı / GPU
  if (
    text.includes("ekran kartı") ||
    text.includes("ekran karti") ||
    text.includes("graphics card") ||
    text.includes("vram") ||
    text.includes("rtx") ||
    text.includes("gtx") ||
    text.includes("radeon")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.gpu_graphics_card;
  }

  // 6e. Monitör & Ekran & Televizyon
  if (
    text.includes("monitör") ||
    text.includes("monitor") ||
    text.includes("ekranlar") ||
    text.includes("televizyon") ||
    text.includes("smart tv") ||
    text.includes("oled tv") ||
    text.includes("qled tv")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.monitors_screens;
  }

  // 6f. Klavye & Mouse / Fare
  if (
    text.includes("klavye") ||
    text.includes("mouse") ||
    text.includes("fare") ||
    text.includes("mousepad")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.keyboards_mice;
  }

  // 6g. Güç Kaynağı (PSU) & Bilgisayar Kasası
  if (
    text.includes("güç kaynağı") ||
    text.includes("guc kaynagi") ||
    text.includes("psu") ||
    text.includes("bilgisayar kasası") ||
    text.includes("kasa")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.power_supply_case;
  }

  // 6h. Soğutucu & Fan
  if (
    text.includes("soğutucu") ||
    text.includes("sogutucu") ||
    text.includes("sıvı soğutma") ||
    text.includes("fan") ||
    text.includes("radyatör")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.pc_cooling;
  }

  // 6i. Yazıcı & Tarayıcı
  if (
    text.includes("yazıcı") ||
    text.includes("yazici") ||
    text.includes("tarayıcı") ||
    text.includes("toner") ||
    text.includes("kartuş")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.printers_scanners;
  }

  // 6j. Ağ & Router & Modem
  if (
    text.includes("modem") ||
    text.includes("router") ||
    text.includes("ağ ekipman") ||
    text.includes("access point") ||
    text.includes("wi-fi")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.network_router;
  }

  // 6k. SSD & Sabit Disk & Harddisk Kutusu
  if (
    text.includes("ssd") ||
    text.includes("harddisk") ||
    text.includes("hard disk") ||
    text.includes("sabit disk") ||
    text.includes("harici disk") ||
    text.includes("taşınabilir disk") ||
    text.includes("m.2") ||
    text.includes("nvme")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.ssd_hardware;
  }

  // 6l. Akıllı Cep Telefonu Cihazı (CEP TELEFONU > IPHONE, Akıllı Telefonlar - Cihazın kendisi)
  if (
    (
      leafText === "iphone" ||
      leafText === "cep telefonu" ||
      leafText === "akıllı telefon" ||
      leafText === "akilli telefon" ||
      text.includes("akıllı cep telefon") ||
      text.includes("cep telefonu > iphone") ||
      (text.includes("cep telefonu") && !text.includes("aksesuar") && !text.includes("kılıf") && !text.includes("kilif") && !text.includes("şarj") && !text.includes("sarj") && !text.includes("kablo") && !text.includes("cam") && !text.includes("koruyucu") && !text.includes("tutucu") && !text.includes("powerbank"))
    ) && !text.includes("dect") && !text.includes("telsiz")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.smartphone_devices;
  }

  // 7. Telefon Aksesuar / Telefon Kılıfı / Şarj (Ensure laptop/notebook/bags/camera are excluded!)
  if (
    text.includes("telefon") ||
    text.includes("cep telefonu") ||
    text.includes("powerbank") ||
    text.includes("ekran koruyucu") ||
    (text.includes("kılıf") && !text.includes("laptop") && !text.includes("notebook") && !text.includes("kamera") && !text.includes("fotoğraf")) ||
    (text.includes("şarj") && !text.includes("pil") && !text.includes("laptop")) ||
    text.includes("kablo")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.phone_accessories;
  }

  // 8. Kulaklık & Ses
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

  // 9. Akıllı Saat & Bileklik
  if (
    text.includes("akıllı saat") ||
    text.includes("smart watch") ||
    text.includes("bileklik") ||
    text.includes("smartband")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.smartwatch;
  }

  // 10. Giyim & Ayakkabı
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

  // 11. Oto Aksesuar
  if (
    text.includes("oto") ||
    text.includes("araba") ||
    text.includes("motosiklet") ||
    text.includes("automotive")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.auto;
  }

  // 12. Ev & Mutfak
  if (
    text.includes("mutfak") ||
    text.includes("kahve") ||
    text.includes("süpürge") ||
    text.includes("tencere") ||
    text.includes("küçük ev aletleri")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.home_kitchen;
  }

  // 13. Kozmetik
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

  // 14. Genel Elektronik & Çevre Birimleri
  if (
    text.includes("elektronik") ||
    text.includes("çevre birimleri") ||
    text.includes("cevre birimleri") ||
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

// Extracts root stem for Turkish suffix variations in category search
export function getCategorySearchStem(token: string): string {
  if (!token) return "";
  let stem = token.toLowerCase();
  const suffixes = ["cilik", "çılık", "cilik", "culuk", "çülük", "lari", "leri", "lar", "ler", "sasi", "sasi", "sida", "sinde", "si", "si", "su", "su", "i", "i", "u", "u"];
  for (const suf of suffixes) {
    if (stem.length > 4 && stem.endsWith(suf)) {
      stem = stem.slice(0, stem.length - suf.length);
      break;
    }
  }
  return stem;
}

// Flexible Turkish category search matcher supporting stemmed tokens and prefixes
export function matchCategorySearchToken(catText: string, token: string): boolean {
  if (!token || !catText) return false;
  if (catText.includes(token)) return true;

  const stem = getCategorySearchStem(token);
  if (stem && stem.length >= 3 && catText.includes(stem)) {
    return true;
  }

  const words = catText.split(" ");
  return words.some(w => w.startsWith(token) || (stem.length >= 3 && w.startsWith(stem)));
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

  const stopWords = ["ve", "ile", "de", "da", "icin", "sistemleri", "urunleri", "ekipmanlari", "aksesuarlari"];
  const localTokens = localNorm.split(" ").filter((t) => t.length > 1 && !stopWords.includes(t));
  const leafTokens = leafNorm.split(" ").filter((t) => t.length > 1 && !stopWords.includes(t) && !/^\d+$/.test(t));
  const effectiveLeafTokens = leafTokens.length > 0 ? leafTokens : leafNorm.split(" ").filter((t) => t.length > 1);
  const parentTokens = parentNorm ? parentNorm.split(" ").filter((t) => t.length > 1 && !stopWords.includes(t)) : [];

  const localAttrSchema = getAttributesForCategory(leafName, rawParts);
  const isSpecializedSchema = localAttrSchema !== COMMON_MARKETPLACE_ATTRIBUTES.general;

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
    if (leafNorm.length >= 3 && (catNameNorm.includes(leafNorm) || leafNorm.includes(catNameNorm))) {
      score += 70;
    } else if (localNorm.length >= 3 && (catNameNorm.includes(localNorm) || localNorm.includes(catNameNorm))) {
      score += 60;
    } else if (leafNorm.length >= 3 && fullPathNorm.includes(leafNorm)) {
      score += 55;
    }

    // Leaf token matching (higher weight, supports Turkish suffix stemming via matchCategorySearchToken)
    let matchedLeafTokens = 0;
    for (const token of effectiveLeafTokens) {
      if (catNameNorm.includes(token) || matchCategorySearchToken(catNameNorm, token)) {
        matchedLeafTokens += 3;
      } else if (fullPathNorm.includes(token) || matchCategorySearchToken(fullPathNorm, token)) {
        matchedLeafTokens += 2;
      }
    }
    if (effectiveLeafTokens.length > 0) {
      score += (matchedLeafTokens / (effectiveLeafTokens.length * 3)) * 45;
    }

    // Parent context bonus if parent tokens match path or category
    if (parentTokens.length > 0) {
      let matchedParentTokens = 0;
      for (const pToken of parentTokens) {
        if (catNameNorm.includes(pToken) || matchCategorySearchToken(catNameNorm, pToken)) {
          matchedParentTokens += 2;
        } else if (fullPathNorm.includes(pToken) || matchCategorySearchToken(fullPathNorm, pToken)) {
          matchedParentTokens += 1.5;
        }
      }
      score += (matchedParentTokens / (parentTokens.length * 2)) * 25;
    }

    // Combined local tokens match bonus
    if (localTokens.length > 0) {
      let matchedAll = 0;
      for (const token of localTokens) {
        if (fullPathNorm.includes(token) || matchCategorySearchToken(fullPathNorm, token)) {
          matchedAll += 1;
        }
      }
      score += (matchedAll / localTokens.length) * 15;
    }

    // Semantic Child Category Attribute Schema Alignment Bonus
    if (isSpecializedSchema) {
      const catAttrSchema = getAttributesForCategory(cat.name, cat.paths || [], cat.id);
      if (catAttrSchema === localAttrSchema) {
        score += 35;
      }
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
