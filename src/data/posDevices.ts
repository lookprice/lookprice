export interface FiscalDepartmentMapping {
  dept: number;
  label: string;
  vatRate: number;
  code?: string;
}

export interface PosDeviceSpec {
  id: string;
  brand: string;
  model: string;
  category: 'yn_okc' | 'android_pos' | 'thermal_escpos';
  protocol: 'GMP3_TCP' | 'TSM_ECR_TCP' | 'PAX_LAN_JSON' | 'ESC_POS_RAW';
  defaultPort: number;
  connectionTypes: string[];
  gmp3Supported: boolean;
  supportsLastTxQuery: boolean;
  supportsZReport: boolean;
  supportsSplitPayment: boolean;
  driverUrl: string;
  driverLabel: string;
  usbVcpDriverUrl: string;
  sdkDocUrl: string;
  setupSteps: string[];
  notes: string;
}

export const UNIVERSAL_POS_DEVICES: PosDeviceSpec[] = [
  {
    id: 'hugin_t300_spectra',
    brand: 'Hugin',
    model: 'Hugin T300 / Spectra (YN ÖKC)',
    category: 'yn_okc',
    protocol: 'GMP3_TCP',
    defaultPort: 4444,
    connectionTypes: ['Ethernet LAN (TCP 4444)', 'Wi-Fi (TCP 4444)', 'USB-VCP (COM Port)'],
    gmp3Supported: true,
    supportsLastTxQuery: true,
    supportsZReport: true,
    supportsSplitPayment: true,
    driverUrl: 'https://www.hugin.com.tr/destek',
    driverLabel: 'Hugin Destek & GMP3 / USB VCP Sürücü Portalı',
    usbVcpDriverUrl: 'https://ftdichip.com/drivers/vcp-drivers/',
    sdkDocUrl: 'https://www.hugin.com.tr/cozumler/yazilim-entegrasyonu',
    setupSteps: [
      'T300 Spectra cihazında F tuşuna basın > Kurulum > Bağlantı / Harici Uygulama Ayarları menüsüne girin.',
      'İletişim Modu olarak Ethernet / Wi-Fi (TCP/IP) veya USB-Serial seçin ve Statik Yerel IP (örn. 192.168.1.55) atayın.',
      'GMP3 Sunucu Portunu 4444 olarak kaydedin ve cihazı PC Moduna (Harici Satış Açık) alın.',
      'Departman 1–8 KDV oranlarını aşağıdaki LookPrice KDV matrisi ile birebir eşitleyin.',
      'Kasa bilgisayarında LP-Hardware-Bridge ajanını başlatın ve PING / STATUS testi ile "Kağıt Dolu & Hazır" onayını görün.'
    ],
    notes: 'GİB GMP3 standart bayt/hex çerçevesi ile TCP 4444 üzerinden tam çift yönlü iletişim, parçalı tahsilat, NFC/Çip tetikleme ve LAST_TX mükerrer fiş koruması destekler.'
  },
  {
    id: 'ingenico_move5000f',
    brand: 'Ingenico',
    model: 'Ingenico Move/5000F & Desk/5000 (YN ÖKC)',
    category: 'yn_okc',
    protocol: 'TSM_ECR_TCP',
    defaultPort: 5555,
    connectionTypes: ['Ethernet LAN (TCP 5555)', 'USB-VCP (Telium Driver)', 'Wi-Fi'],
    gmp3Supported: true,
    supportsLastTxQuery: true,
    supportsZReport: true,
    supportsSplitPayment: true,
    driverUrl: 'https://ingenico.com/tr/destek',
    driverLabel: 'Ingenico Türkiye TSM & ECR Driver Portalı',
    usbVcpDriverUrl: 'https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers',
    sdkDocUrl: 'https://developer.ingenico.com/',
    setupSteps: [
      'Cihazda F > Yetkili Menüsü > TSM / Harici Kasa Entegrasyon Ayarlarına girin.',
      'Entegrasyon protokolünü GMP3 / TCP ECR olarak seçip Statik IP ve Port (varsayılan 5555) tanımlayın.',
      'USB bağlantı kullanılacaksa Ingenico Telium USB CDC sürücüsünü kasaya kurun.',
      'LP-Hardware-Bridge üzerinden "PING / STATUS" butonuna basarak eşleşmeyi doğrulayın.'
    ],
    notes: 'GMP3 ve TSM ECR modlarını destekler; bankalarla BKM ortak POS üzerinden temassız/PIN tahsilatı tek fişte birleştirir.'
  },
  {
    id: 'beko_300tr',
    brand: 'Beko / Token',
    model: 'Beko 300TR / 400TR (Token YN ÖKC)',
    category: 'yn_okc',
    protocol: 'GMP3_TCP',
    defaultPort: 4444,
    connectionTypes: ['Wi-Fi / LAN (TCP 4444)', 'USB-Serial', 'Bluetooth SPP'],
    gmp3Supported: true,
    supportsLastTxQuery: true,
    supportsZReport: true,
    supportsSplitPayment: true,
    driverUrl: 'https://www.beko.com.tr/destek/yazar-kasa-pos',
    driverLabel: 'Beko YN ÖKC Sürücü & TokenFlex Destek Sayfası',
    usbVcpDriverUrl: 'https://ftdichip.com/drivers/vcp-drivers/',
    sdkDocUrl: 'https://developers.tokeninc.com/',
    setupSteps: [
      'Beko 300TR/400TR ana ekranından Ayarlar > Harici Kasa / GMP3 Bağlantısı adımını açın.',
      'Aynı yerel Wi-Fi/LAN ağına bağlanın ve sabit IP ile TCP Port 4444 belirleyin.',
      'Token / Beko GMP3 servis lisansının cihazda aktif olduğundan emin olun.',
      'LP-Hardware-Bridge yapılandırmasını indirip başlatın.'
    ],
    notes: 'Beko 300TR ve 400TR Android tabanlı modeller GMP3 TCP 4444 üzerinden satış, iptal, parçalı tahsilat ve Z raporu komutlarını destekler.'
  },
  {
    id: 'pavo_n86',
    brand: 'Pavo / Payten',
    model: 'Pavo N86 / N3 (Android YN ÖKC)',
    category: 'android_pos',
    protocol: 'GMP3_TCP',
    defaultPort: 3400,
    connectionTypes: ['Wi-Fi LAN (TCP 3400)', 'USB-C ADB/Serial'],
    gmp3Supported: true,
    supportsLastTxQuery: true,
    supportsZReport: true,
    supportsSplitPayment: true,
    driverUrl: 'https://www.pavo.com.tr/destek',
    driverLabel: 'Pavo YN ÖKC Doküman ve Sürücü Merkezi',
    usbVcpDriverUrl: 'https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers',
    sdkDocUrl: 'https://developer.payten.com/',
    setupSteps: [
      'Pavo cihazda Kasa Entegrasyon Uygulamasını açıp "Yerel Ağ Modu"nu aktif edin.',
      'Cihaz IP adresini ve varsayılan 3400 portunu LookPrice ayarlarına girin.',
      'KDV departman tablolarının Pavo cihaz menüsündeki KDV oranlarıyla eşleştiğini onaylayın.'
    ],
    notes: 'Hem GMP3 soket hem de yerel LAN JSON/REST entegrasyon modlarıyla ShopLP ve HorecaLP adisyon kapatma akışını destekler.'
  },
  {
    id: 'profilo_telestar',
    brand: 'Profilo',
    model: 'Profilo Telestar / S900 / YK-8000',
    category: 'yn_okc',
    protocol: 'GMP3_TCP',
    defaultPort: 4444,
    connectionTypes: ['Ethernet LAN (TCP 4444)', 'RS232 / USB-Serial'],
    gmp3Supported: true,
    supportsLastTxQuery: true,
    supportsZReport: true,
    supportsSplitPayment: true,
    driverUrl: 'https://www.profiloodemesistemleri.com/destek',
    driverLabel: 'Profilo Ödeme Sistemleri Sürücü & GMP3 Destek',
    usbVcpDriverUrl: 'https://ftdichip.com/drivers/vcp-drivers/',
    sdkDocUrl: 'https://www.profiloodemesistemleri.com/',
    setupSteps: [
      'Profilo cihazda Yönetici Menüsü > Kasa Haberleşme > GMP3 TCP aktif edin.',
      'IP ve Port (4444) değerlerini kaydedip cihazı harici satış moduna alın.',
      'USB/RS232 dönüştürücü kullanıyorsanız FTDI VCP sürücüsünü yükleyin.'
    ],
    notes: 'Standart GMP3 protokolü ile tam uyumludur.'
  },
  {
    id: 'vera_delta',
    brand: 'Vera / MT',
    model: 'Vera Delta / Vera Pay ÖKC',
    category: 'yn_okc',
    protocol: 'GMP3_TCP',
    defaultPort: 5000,
    connectionTypes: ['Ethernet LAN (TCP 5000)', 'USB-VCP'],
    gmp3Supported: true,
    supportsLastTxQuery: true,
    supportsZReport: true,
    supportsSplitPayment: true,
    driverUrl: 'https://www.vera.com.tr/destek',
    driverLabel: 'Vera YN ÖKC Sürücü ve Haberleşme Dosyaları',
    usbVcpDriverUrl: 'https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers',
    sdkDocUrl: 'https://www.vera.com.tr/',
    setupSteps: [
      'Vera Delta cihazında Ayarlar > PC Bağlantısı > TCP/IP Soket modunu açın.',
      'Port 5000 olarak girin ve cihazı PC moduna geçirin.'
    ],
    notes: 'Vera Delta serisi TCP/IP ve seri port üzerinden mali fiş kesme ve Z raporu destekler.'
  },
  {
    id: 'generic_escpos_kitchen',
    brand: 'Üniversal ESC/POS',
    model: 'Ağ Termal / Mutfak / Adisyon Yazıcısı (80mm)',
    category: 'thermal_escpos',
    protocol: 'ESC_POS_RAW',
    defaultPort: 9100,
    connectionTypes: ['Ethernet Raw (TCP 9100)', 'Windows Yazıcı Paylaşımı'],
    gmp3Supported: false,
    supportsLastTxQuery: false,
    supportsZReport: false,
    supportsSplitPayment: false,
    driverUrl: 'https://download.epson-biz.com/modules/pos/index.php',
    driverLabel: 'Üniversal 80mm ESC/POS & Epson TM Termal Sürücüleri',
    usbVcpDriverUrl: 'https://ftdichip.com/drivers/vcp-drivers/',
    sdkDocUrl: 'https://reference.epson-biz.com/modules/ref_escpos/',
    setupSteps: [
      'Termal yazıcıyı Ethernet kablosu ile modeme/switch’e bağlayın (varsayılan port 9100).',
      'Kendi kendini test çıktısı (Self-Test) alarak yazıcının IP adresini öğrenin ve yukarıdaki alana yazın.'
    ],
    notes: 'Mali onaylı ÖKC değildir; mutfak siparişi, bar çıktısı ve bilgi fişi basımı içindir.'
  }
];

export const USB_VCP_DRIVERS = [
  {
    name: 'FTDI USB-Serial (VCP) Driver (Windows / macOS)',
    url: 'https://ftdichip.com/drivers/vcp-drivers/',
    description: 'Hugin T300, Beko ve Profilo USB-Serial kabloları için zorunlu COM port sürücüsü.'
  },
  {
    name: 'Silicon Labs CP210x Universal USB Driver',
    url: 'https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers',
    description: 'Ingenico, Pavo ve Vera USB bağlantı kabloları için sanal COM sürücüsü.'
  },
  {
    name: 'Node.js LTS Runtime (LP-Hardware-Bridge için)',
    url: 'https://nodejs.org/tr/download',
    description: 'Yerel kasa bilgisayarında LP-Hardware-Bridge servisini çalıştırmak için (v18+ önerilir).'
  }
];

export const DEFAULT_FISCAL_DEPARTMENTS: FiscalDepartmentMapping[] = [
  { dept: 1, label: 'Temel Gıda (%1)', vatRate: 1, code: 'DEPT_01' },
  { dept: 2, label: 'Yiyecek & Restoran (%10)', vatRate: 10, code: 'DEPT_02' },
  { dept: 3, label: 'Tekstil & Giyim (%10)', vatRate: 10, code: 'DEPT_03' },
  { dept: 4, label: 'Genel Perakende (%20)', vatRate: 20, code: 'DEPT_04' },
  { dept: 5, label: 'İçecek & Kafe (%20)', vatRate: 20, code: 'DEPT_05' },
  { dept: 6, label: 'Temizlik & Kozmetik (%20)', vatRate: 20, code: 'DEPT_06' },
  { dept: 7, label: 'Kitap & İstisna (%0)', vatRate: 0, code: 'DEPT_07' },
  { dept: 8, label: 'Elektronik & Hizmet (%20)', vatRate: 20, code: 'DEPT_08' }
];

export function getPosDeviceById(deviceId?: string | null): PosDeviceSpec {
  const norm = String(deviceId || '').trim().toLowerCase();
  return (
    UNIVERSAL_POS_DEVICES.find(d => d.id.toLowerCase() === norm || d.brand.toLowerCase() === norm) ||
    UNIVERSAL_POS_DEVICES[0]
  );
}

export function normalizeDepartments(raw?: any): FiscalDepartmentMapping[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_FISCAL_DEPARTMENTS.map(d => ({ ...d }));
  }
  const byDept = new Map<number, FiscalDepartmentMapping>();
  for (const d of DEFAULT_FISCAL_DEPARTMENTS) {
    byDept.set(d.dept, { ...d });
  }
  for (const item of raw) {
    const deptNum = Number(item?.dept);
    if (deptNum >= 1 && deptNum <= 8) {
      byDept.set(deptNum, {
        dept: deptNum,
        label: String(item.label || byDept.get(deptNum)?.label || `Departman ${deptNum}`),
        vatRate: Number.isFinite(Number(item.vatRate)) ? Number(item.vatRate) : (byDept.get(deptNum)?.vatRate ?? 20),
        code: item.code || `DEPT_0${deptNum}`
      });
    }
  }
  return Array.from(byDept.values()).sort((a, b) => a.dept - b.dept);
}

export function resolveDepartmentForTaxRate(
  vatRate: number | string | null | undefined,
  departments?: FiscalDepartmentMapping[],
  preferredLabelHint?: string | null
): FiscalDepartmentMapping {
  const list = normalizeDepartments(departments);
  const targetVat = Number.isFinite(Number(vatRate)) ? Math.round(Number(vatRate)) : 20;

  const exactMatches = list.filter(d => Math.round(Number(d.vatRate)) === targetVat);
  if (exactMatches.length > 0) {
    if (preferredLabelHint) {
      const hint = preferredLabelHint.toLocaleLowerCase('tr-TR');
      const hinted = exactMatches.find(d => d.label.toLocaleLowerCase('tr-TR').includes(hint));
      if (hinted) return hinted;
    }
    return exactMatches[0];
  }

  // Fallback to closest department or Dept 4 (%20)
  return list.find(d => d.dept === 4) || list[0];
}

export interface VatAuditResult {
  isSynced: boolean;
  mappedRates: number[];
  unmappedRates: number[];
  departmentRates: number[];
  suggestedFixes: Array<{ vatRate: number; suggestedDept: number; message: string }>;
}

export function auditProductVatMappings(
  productVatRates: Array<number | string | null | undefined>,
  departments?: FiscalDepartmentMapping[]
): VatAuditResult {
  const list = normalizeDepartments(departments);
  const deptRateSet = new Set(list.map(d => Math.round(Number(d.vatRate))));
  const distinctProductRates = Array.from(
    new Set(
      productVatRates
        .map(r => (r === null || r === undefined || r === '' ? 20 : Math.round(Number(r))))
        .filter(r => !Number.isNaN(r) && r >= 0 && r <= 100)
    )
  ).sort((a, b) => a - b);

  const mappedRates: number[] = [];
  const unmappedRates: number[] = [];
  const suggestedFixes: Array<{ vatRate: number; suggestedDept: number; message: string }> = [];

  for (const rate of distinctProductRates) {
    if (deptRateSet.has(rate)) {
      mappedRates.push(rate);
    } else {
      unmappedRates.push(rate);
      const fallbackSlot = list.find(d => d.dept === 8) || list[list.length - 1];
      suggestedFixes.push({
        vatRate: rate,
        suggestedDept: fallbackSlot.dept,
        message: `Mağazada %${rate} KDV oranlı ürün var ancak ÖKC Departman 1–8 tablosunda %${rate} tanımlı değil. Departman ${fallbackSlot.dept} içine %${rate} atamanız önerilir.`
      });
    }
  }

  return {
    isSynced: unmappedRates.length === 0,
    mappedRates,
    unmappedRates,
    departmentRates: Array.from(deptRateSet).sort((a, b) => a - b),
    suggestedFixes
  };
}
