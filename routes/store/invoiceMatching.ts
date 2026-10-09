import { Pool } from "pg";

export interface MatchCandidate {
  productId: number;
  barcode: string;
  productCode: string;
  name: string;
  matchType: 'supplier_mapping' | 'barcode' | 'product_code' | 'exact_name' | 'normalized_name' | 'model_token';
}

/**
 * Checks if a string is a valid standard numeric barcode (e.g. EAN-13, EAN-8, UPC, GTIN-14).
 * Must be 8 to 14 numeric digits, without letters or AUTO-/M-/P- prefixes.
 */
export function isValidStandardBarcode(code: string | null | undefined): boolean {
  if (!code) return false;
  const str = String(code).trim();
  if (!str || str.startsWith("AUTO-") || str.startsWith("M-") || str.startsWith("P-") || str.startsWith("TEMP-")) {
    return false;
  }
  // Standard barcodes are strictly numeric digits, 8 to 14 characters long
  return /^[0-9]{8,14}$/.test(str);
}

/**
 * Generates a valid standard 13-digit pseudo-EAN barcode (starting with internal prefix '200')
 */
export function generateTempBarcode(): string {
  const timeStr = Date.now().toString().slice(-9);
  const randomDigit = Math.floor(Math.random() * 10).toString();
  return `200${timeStr}${randomDigit}`;
}

/**
 * Sanitizes incoming barcode & product code values from invoice lines (UBL / XML / Manual).
 * Ensures non-standard barcode strings (like "TRU16977") are routed to productCode,
 * and a valid temporary numeric barcode is generated if no valid standard barcode exists.
 */
export function sanitizeInvoiceItemCodes(
  rawBarcode?: string | null,
  rawSellerCode?: string | null,
  rawBuyerCode?: string | null,
  rawProductCode?: string | null
): { barcode: string | null; productCode: string | null; isTempBarcode: boolean } {
  const cleanBarcode = rawBarcode ? String(rawBarcode).trim() : null;
  const cleanSeller = rawSellerCode ? String(rawSellerCode).trim() : null;
  const cleanBuyer = rawBuyerCode ? String(rawBuyerCode).trim() : null;
  const cleanProdCode = rawProductCode ? String(rawProductCode).trim() : null;

  // Candidates collected from invoice
  const candidates = [cleanBarcode, cleanProdCode, cleanSeller, cleanBuyer]
    .filter(Boolean)
    .map(c => String(c).trim())
    .filter(c => c.length > 0 && !c.startsWith("AUTO-"));

  // Find if any candidate is a true valid standard barcode
  let validBarcode: string | null = null;
  for (const c of candidates) {
    if (isValidStandardBarcode(c)) {
      validBarcode = c;
      break;
    }
  }

  // Find candidate for productCode (e.g. "TRU16977")
  let targetProductCode: string | null = cleanProdCode || cleanSeller || cleanBuyer || null;

  // If cleanBarcode is NOT a valid barcode (e.g., "TRU16977"), it belongs in productCode!
  if (cleanBarcode && !isValidStandardBarcode(cleanBarcode)) {
    if (!targetProductCode || targetProductCode.length < cleanBarcode.length) {
      targetProductCode = cleanBarcode;
    }
  }

  return {
    barcode: validBarcode, // Returns null if no valid standard barcode exists on the invoice line (no synthetic 200... barcodes)
    productCode: targetProductCode,
    isTempBarcode: !validBarcode
  };
}

/**
 * Normalizes text for Turkish-safe, punctuation-free string matching
 */
export function normalizeText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/[ıİ]/g, "i")
    .replace(/[ğĞ]/g, "g")
    .replace(/[üÜ]/g, "u")
    .replace(/[şŞ]/g, "s")
    .replace(/[öÖ]/g, "o")
    .replace(/[çÇ]/g, "c")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Strips trailing serial numbers, IMEI numbers, and invoice noise before token/spec analysis
 */
export function stripSerialAndNoise(text: string | null | undefined): string {
  if (!text) return "";
  return String(text)
    .replace(/\b(?:sn|s\/n|seri\s*no|imei)\s*[:.]?\s*[A-Za-z0-9,\s_-]+$/gi, " ")
    .replace(/\(\s*(?:sn|imei)\s*[:.]?[^)]*\)/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const BRAND_ALIASES: Array<{ pattern: RegExp; canonical: string; isAftermarket?: boolean }> = [
  { pattern: /\b(kingston)\b/i, canonical: "kingston" },
  { pattern: /\b(twinmos)\b/i, canonical: "twinmos" },
  { pattern: /\b(samsung)\b/i, canonical: "samsung" },
  { pattern: /\b(sandisk)\b/i, canonical: "sandisk" },
  { pattern: /\b(kioxia|exceria)\b/i, canonical: "kioxia" },
  { pattern: /\b(crucial)\b/i, canonical: "crucial" },
  { pattern: /\b(ramaxel)\b/i, canonical: "ramaxel" },
  { pattern: /\b(micron)\b/i, canonical: "micron" },
  { pattern: /\b(corsair)\b/i, canonical: "corsair" },
  { pattern: /\b(hiksemi)\b/i, canonical: "hiksemi" },
  { pattern: /\b(hikvision)\b/i, canonical: "hikvision" },
  { pattern: /\b(dahua)\b/i, canonical: "dahua" },
  { pattern: /\b(bory)\b/i, canonical: "bory" },
  { pattern: /\b(walram)\b/i, canonical: "walram" },
  { pattern: /\b(western\s*digital|\bwd\b)\b/i, canonical: "wd" },
  { pattern: /\b(seagate|ironwolf|barracuda|skyhawk)\b/i, canonical: "seagate" },
  { pattern: /\b(toshiba|surveillance\s+s300|hdwt\d+)\b/i, canonical: "toshiba" },
  { pattern: /\b(lexar)\b/i, canonical: "lexar" },
  { pattern: /\b(adata)\b/i, canonical: "adata" },
  { pattern: /\b(apacer)\b/i, canonical: "apacer" },
  { pattern: /\b(patriot)\b/i, canonical: "patriot" },
  { pattern: /\b(transcend)\b/i, canonical: "transcend" },
  { pattern: /\b(intenso)\b/i, canonical: "intenso" },
  { pattern: /\b(netac)\b/i, canonical: "netac" },
  { pattern: /\b(lenovo|thinkpad|thinkvision|thinkbook|ideapad|legion)\b/i, canonical: "lenovo" },
  { pattern: /\b(hp|hewlett|laserjet|officejet|deskjet|pagewide|probook|elitebook)\b/i, canonical: "hp" },
  { pattern: /\b(hpe|aruba)\b/i, canonical: "hpe" },
  { pattern: /\b(dell|vostro|vost|latitude|optiplex|inspiron|alienware)\b/i, canonical: "dell" },
  { pattern: /\b(asus|zenbook|vivobook|rog)\b/i, canonical: "asus" },
  { pattern: /\b(acer|aspire|nitro|extensa)\b/i, canonical: "acer" },
  { pattern: /\b(msi|cubi)\b/i, canonical: "msi" },
  { pattern: /\b(apple|iphone|ipad|macbook|airpods|earpods|imac|magsafe)\b/i, canonical: "apple" },
  { pattern: /\b(xiaomi|redmi|poco|mi\s+box)\b/i, canonical: "xiaomi" },
  { pattern: /\b(huawei|freebuds|freeclip|matebook|matepad)\b/i, canonical: "huawei" },
  { pattern: /\b(honor)\b/i, canonical: "honor" },
  { pattern: /\b(microsoft|windows\s+1[01]|ms\s+windows|ms\s+365|surface)\b/i, canonical: "microsoft" },
  { pattern: /\b(logitech)\b/i, canonical: "logitech" },
  { pattern: /\b(trust)\b/i, canonical: "trust" },
  { pattern: /\b(jabra|evolve|speak2)\b/i, canonical: "jabra" },
  { pattern: /\b(targus|heritgeluxe)\b/i, canonical: "targus" },
  { pattern: /\b(tp-?link|omada|archer|tapo|deco)\b/i, canonical: "tplink" },
  { pattern: /\b(ubiquiti|unifi)\b/i, canonical: "ubiquiti" },
  { pattern: /\b(keenetic)\b/i, canonical: "keenetic" },
  { pattern: /\b(ruijie|reyee)\b/i, canonical: "ruijie" },
  { pattern: /\b(cisco)\b/i, canonical: "cisco" },
  { pattern: /\b(tenda)\b/i, canonical: "tenda" },
  { pattern: /\b(zyxel)\b/i, canonical: "zyxel" },
  { pattern: /\b(cudy)\b/i, canonical: "cudy" },
  { pattern: /\b(mikrotik)\b/i, canonical: "mikrotik" },
  { pattern: /\b(zebra)\b/i, canonical: "zebra" },
  { pattern: /\b(datalogic|quickscan)\b/i, canonical: "datalogic" },
  { pattern: /\b(argox)\b/i, canonical: "argox" },
  { pattern: /\b(honeywell)\b/i, canonical: "honeywell" },
  { pattern: /\b(cilico)\b/i, canonical: "cilico" },
  { pattern: /\b(epson|ecotank)\b/i, canonical: "epson" },
  { pattern: /\b(canon|i-?sensys|pixma)\b/i, canonical: "canon" },
  { pattern: /\b(brother)\b/i, canonical: "brother" },
  { pattern: /\b(minolta|konica)\b/i, canonical: "minolta" },
  { pattern: /\b(lexmark)\b/i, canonical: "lexmark" },
  { pattern: /\b(xerox)\b/i, canonical: "xerox" },
  { pattern: /\b(ricoh)\b/i, canonical: "ricoh" },
  { pattern: /\b(kyocera)\b/i, canonical: "kyocera" },
  { pattern: /\b(pantum)\b/i, canonical: "pantum" },
  { pattern: /\b(lg|ultragear|qned)\b/i, canonical: "lg" },
  { pattern: /\b(tcl)\b/i, canonical: "tcl" },
  { pattern: /\b(onvo)\b/i, canonical: "onvo" },
  { pattern: /\b(philips)\b/i, canonical: "philips" },
  { pattern: /\b(viewsonic)\b/i, canonical: "viewsonic" },
  { pattern: /\b(aoc)\b/i, canonical: "aoc" },
  { pattern: /\b(benq)\b/i, canonical: "benq" },
  { pattern: /\b(digitus|assmann|ak-\d{6}-\d{3}|da-\d{5}|dn-\d{4,5})\b/i, canonical: "digitus" },
  { pattern: /\b(ugreen)\b/i, canonical: "ugreen" },
  { pattern: /\b(baseus)\b/i, canonical: "baseus" },
  { pattern: /\b(belkin)\b/i, canonical: "belkin" },
  { pattern: /\b(anker)\b/i, canonical: "anker" },
  { pattern: /\b(veggieg)\b/i, canonical: "veggieg" },
  { pattern: /\b(bix)\b/i, canonical: "bix" },
  { pattern: /\b(orico)\b/i, canonical: "orico" },
  { pattern: /\b(qport|q-cat|q-ugb|q-hvg)\b/i, canonical: "qport" },
  { pattern: /\b(inca|icat6|iutp)\b/i, canonical: "inca" },
  { pattern: /\b(dark)\b/i, canonical: "dark" },
  { pattern: /\b(frisby)\b/i, canonical: "frisby" },
  { pattern: /\b(speed|sp-u100)\b/i, canonical: "speed" },
  { pattern: /\b(codegen)\b/i, canonical: "codegen" },
  { pattern: /\b(everest)\b/i, canonical: "everest" },
  { pattern: /\b(s-?link)\b/i, canonical: "slink" },
  { pattern: /\b(hadron)\b/i, canonical: "hadron" },
  { pattern: /\b(beek|bc-u60|bc-dsp)\b/i, canonical: "beek" },
  { pattern: /\b(aten|uc232a)\b/i, canonical: "aten" },
  { pattern: /\b(noyafa|nf-\d{4})\b/i, canonical: "noyafa" },
  { pattern: /\b(fnirsi|lpm-?10a)\b/i, canonical: "fnirsi" },
  { pattern: /\b(meanwell|mw-rs)\b/i, canonical: "meanwell" },
  { pattern: /\b(zkteco)\b/i, canonical: "zkteco" },
  { pattern: /\b(karcher)\b/i, canonical: "karcher" },
  { pattern: /\b(skg)\b/i, canonical: "skg" },
  { pattern: /\b(shaza)\b/i, canonical: "shaza" },
  { pattern: /\b(dodobees)\b/i, canonical: "dodobees" },
  { pattern: /\b(hepu)\b/i, canonical: "hepu" },
  { pattern: /\b(perfects)\b/i, canonical: "perfects" },
  { pattern: /\b(tech21)\b/i, canonical: "tech21" },
  { pattern: /\b(kimmeer)\b/i, canonical: "kimmeer" },
  { pattern: /\b(altus)\b/i, canonical: "altus" },
  { pattern: /\b(hometech)\b/i, canonical: "hometech" },
  { pattern: /\b(alpin)\b/i, canonical: "alpin" },
  { pattern: /\b(startech)\b/i, canonical: "startech" },
  { pattern: /\b(ibm|ultrium)\b/i, canonical: "ibm" },
  { pattern: /\b(eset)\b/i, canonical: "eset" },
  { pattern: /\b(dji|osmo)\b/i, canonical: "dji" },
  { pattern: /\b(a4-?tech)\b/i, canonical: "a4tech" },
  { pattern: /\b(mack)\b/i, canonical: "mack" },
  { pattern: /\b(classone)\b/i, canonical: "classone" },
  { pattern: /\b(addison)\b/i, canonical: "addison" },
  { pattern: /\b(unitek)\b/i, canonical: "unitek" },
  { pattern: /\b(vento)\b/i, canonical: "vento" },
  { pattern: /\b(powerful)\b/i, canonical: "powerful" },
  { pattern: /\b(achill)\b/i, canonical: "achill" },
  { pattern: /\b(enlite)\b/i, canonical: "enlite" },
  { pattern: /\b(ttaf)\b/i, canonical: "ttaf" },
  { pattern: /\b(bambu\s*lab)\b/i, canonical: "bambulab" },
  { pattern: /\b(joby|gorillapod)\b/i, canonical: "joby" },
  { pattern: /\b(vertion)\b/i, canonical: "vertion" },
  { pattern: /\b(coverzone)\b/i, canonical: "coverzone" },
  { pattern: /\b(fulltech)\b/i, canonical: "fulltech" },
  { pattern: /\b(berqnet)\b/i, canonical: "berqnet" }
];

export function extractBrands(text: string | null | undefined, brandField?: string | null): string[] {
  const combined = `${brandField || ""} ${stripSerialAndNoise(text || "")}`
    .toLocaleLowerCase("tr-TR")
    .replace(/[ıİ]/g, "i")
    .replace(/[ğĞ]/g, "g")
    .replace(/[üÜ]/g, "u")
    .replace(/[şŞ]/g, "s")
    .replace(/[öÖ]/g, "o")
    .replace(/[çÇ]/g, "c");

  if (!combined.trim()) return [];

  // Strip universal compatibility clauses like "iPhone 16, 15, Galaxy S24, S23, iPad, MacBook... için"
  const primaryText = combined.replace(/[,،]?\s*(?:iphone|ipad|macbook|galaxy)[^.]*\bicin\b/gi, " ");

  const found: string[] = [];
  for (const b of BRAND_ALIASES) {
    if (b.pattern.test(primaryText)) {
      found.push(b.canonical);
    }
  }
  return Array.from(new Set(found));
}

export function hasBrandConflict(
  text1: string | null | undefined,
  text2: string | null | undefined,
  brand1?: string | null,
  brand2?: string | null
): boolean {
  const b1 = extractBrands(text1, brand1);
  const b2 = extractBrands(text2, brand2);
  if (b1.length === 0 || b2.length === 0) return false;

  // Treat hp and hpe as compatible only when both refer to network/server or cartridge items, otherwise check direct overlap
  const hasOverlap = b1.some(x => b2.includes(x) || (x === "hp" && b2.includes("hpe")) || (x === "hpe" && b2.includes("hp")));
  return !hasOverlap;
}

export type ProductFunctionalCategory =
  | "ram"
  | "ssd_hdd"
  | "usb_flash"
  | "memory_card"
  | "data_tape"
  | "laptop_pc"
  | "tablet"
  | "smartphone"
  | "tablet_phone"
  | "monitor_tv"
  | "lcd_panel"
  | "mount_stand"
  | "printer"
  | "scanner_terminal"
  | "consumable"
  | "bag_case"
  | "battery"
  | "power_adapter_ups"
  | "hub_dock_converter"
  | "network_active"
  | "cable_connector"
  | "keyboard_mouse"
  | "audio_video"
  | "gpu_component"
  | "software_license"
  | "tester_tool"
  | null;

export function extractProductCategory(text: string | null | undefined): ProductFunctionalCategory {
  if (!text) return null;
  const t = stripSerialAndNoise(text)
    .toLocaleLowerCase("tr-TR")
    .replace(/[ıİ]/g, "i")
    .replace(/[ğĞ]/g, "g")
    .replace(/[üÜ]/g, "u")
    .replace(/[şŞ]/g, "s")
    .replace(/[öÖ]/g, "o")
    .replace(/[çÇ]/g, "c");

  // 1. Bags / Cases / Backpacks (must check before laptop/thinkpad/ipad)
  if (/\b(sirt\s*cant|backpack|notebook\s*cant|laptop\s*cant|canta|folio|rugged\s*boot|kilif)\b/i.test(t) && !/\b(mouse\s*\+\s*.*canta|m196grf\+canta)\b/i.test(t)) {
    return "bag_case";
  }

  // 2. Replacement LCD panel / keyboard / fan / battery for laptops (must check before laptop_pc)
  if (/\b(nb\s*lcd\s*ekran|lcd\s*ekran.*pin|wxga\s*nb\s*lcd|lcd\d{3})\b/i.test(t)) {
    return "lcd_panel";
  }
  if (/\b(batarya|bataryasi|pili|el\s*terminal\s*batarya|btry|42whr)\b/i.test(t)) {
    return "battery";
  }
  if (/\b(notebook\s*fan|uyumlu\s*fan|fan\s*lga|anakart|ekran\s*karti|gddr5|gddr6|gt710)\b/i.test(t)) {
    return "gpu_component";
  }

  // 3. Mounts / Stands / Brackets (must check before monitor/tv)
  if (/\b(aski\s*aparat|duvar\s*asma|duvar\s*monte|tv\s*sehpasi|tv\s*unitesi|fuar\s*standi|monitor\s*standi|projeksiyon\s*aski|kamera\s*direk)\b/i.test(t)) {
    return "mount_stand";
  }

  // 4. Consumables (Toner, Ink Cartridge, Drum, Ribbon, EcoTank Bottle) — must check before printer
  if (
    /\b(toner|murekkep\s*kartus|orjinal\s*kartus|siyah\s*kartus|renkli\s*kartus|plotter\s*kartus|mavi\s*kartus|sari\s*kartus|kirmizi\s*kartus|mat\s*siyah\s*kartus|imaging\s*drum|drum\s*unit|yazici\s*seridi|muadil\s*serit|2'li\s*serit|ribon|black\s*bottle|murekkep\s*set|epson\s*103\s*ecotank|t913[0-9a-z]|cli-581|3yl[78]\d|f6v2[45]|c937\d|c9403|cn69[23]|ce25\d|cf2[1235]\d|q2612|w203\d)\b/i.test(t)
  ) {
    return "consumable";
  }
  if (/\b(data\s*kartus|lto-?5|ultrium|c7975a|46x1290)\b/i.test(t)) {
    return "data_tape";
  }

  // 5. Testers / Cable Finders
  if (/\b(kablo\s*bulucu|kablo\s*izleyici|kablo\s*test|network\s*test|nf-85\d\d|lpm-?10a)\b/i.test(t)) {
    return "tester_tool";
  }

  // 6. Software & Licenses
  if (/\b(windows\s*1[01]\s*pro|fqc-10556|ms\s*365\s*apps|office\s*ev\s*ve\s*is|office\s*365|eset\s*protect)\b/i.test(t)) {
    return "software_license";
  }

  // 7. Scanners & Mobile Terminals (must check before printer)
  if (/\b(barkod\s*okuyucu|karekod.*okuyucu|quickscan|ds2278|qd2590|d2590|el\s*terminali|mobil\s*bilgisayar|mc330\d|parmak\s*izi\s*okuyucu|sf300)\b/i.test(t)) {
    return "scanner_terminal";
  }

  // 8. Printers
  if (/\b(barkod\s*yazici|lazer\s*yazici|tankli\s*yazici|cok\s*fonksiyonlu|laserjet\s*mfp|laser\s*mfp|mfp\s*137|4zb84a|ecotank\s*l\d{4}|i-?sensys\s*mf\d+|zd220[dt]|zd230[dt]|zq521|cp-2140|print\s*std\s*ezpl)\b/i.test(t) && !/\b(tamir|onarim|bakim|servis|toner|kartus)\b/i.test(t)) {
    return "printer";
  }

  // 9. Power Adapters, Chargers, PoE Injectors, UPS, Power Supplies
  if (
    /\b(notebook\s*adaptor|laptop\s*adaptor|laptop\s*sarj|sarj\s*adaptor|sarj\s*cihazi|guc\s*adaptor|usb-?c\s*ac\s*adaptor|ac\s*usb-?c\s*adaptor|slim\s*usb-?c\s*\d+w\s*charger|usb-?c\s*\d+w\s*ac\s*adapter|usb-?c\s*power\s*adaptor|nano\s*power.*adapter|\d+w\s*usb-?c\s*adapter|poe\s*adaptor|poe-24|tl-poe\d+|guc\s*kaynagi|power\s*supply|kesintisiz\s*guc|mini\s*dc\s*ups|modem\s*ups|mw-rs|adlx\d+|adl\d+|ha65nm|da100pm|450-bf)\b/i.test(t)
  ) {
    return "power_adapter_ups";
  }

  // 10. Hubs, Docks, Card Readers, Signal/Interface Converters (USB-RS232, USB-Ethernet, HDMI-VGA, etc.)
  if (
    /\b(docking\s*station|multi\s*port\s*hub|type-?c\s*hub|\d+\s*in\s*1.*hub|\d+in1.*hub|bağlanti\s*noktali.*hub|baglanti\s*noktali.*hub|kart\s*okuyucu|usb\s*to\s*rs-?232|seri\s*adaptor|serial\s*adaptor|uc232a|da-70167|gigabit\s*ethernet.*donusturucu|ethernet\s*adaptoru|ethernet\s*cevirici|iutp-01t|q-ugb1|dn-3023|aktif\s*donusturucu|cevirici\s*donusturucu|vga\s*to\s*hdmi|hdmi\s*to\s*vga|dp.*to\s*hdmi|usb-?c\s*to\s*hdmi|usb\s*type-?c\s*hdmi\s*adaptor|ua520c|2pc54aa|type-?c\s*adaptor\s*usbce|otg.*converter|type-?c\s*to\s*type-?c\s*\+\s*usb|hdmi.*uzatma\s*adaptor|hdmi\s*erkek\s*erkek\s*adaptor)\b/i.test(t)
  ) {
    return "hub_dock_converter";
  }

  // 11. Active Network Equipment (Switches, Access Points, Routers, Modems, SFP modules)
  if (
    /\b(switch|access\s*point|router|modem|wi-?fi\s*mesh|sfp\s*modul|sfp\s*lc|alici-verici|bn-glc|ls10\d\dg|tl-sg\d+|jl68\db|r4w02a|eap\d{3}|rg-es\d+|kn-\d{4}|m7000)\b/i.test(t)
  ) {
    return "network_active";
  }

  // 12. Keyboards, Mice, Mousepads, Stylus Pens, Presenters
  if (/\b(klavye|keyboard|tus\s*takimi|mouse\s*pad|mousepad|kablosuz\s*mouse|kablolu\s*mouse|laser\s*mouse|wired\s*mouse|sessiz\s*mouse|m170|m171|m196|m240|mk120|mk235|k120|k650|muwa3ze|kalem.*usb-?c|sunum\s*kumandasi|tv\s*box\s*kumandasi)\b/i.test(t)) {
    return "keyboard_mouse";
  }

  // 13. Audio / Video / Headphones / Webcams / Conference Cameras
  if (/\b(kulaklik|earpods|airpods|freebuds|freeclip|evolve\s*20|speak2|konferans\s*kamerasi|meeting\s*pro|dashcam|osmo\s*pocket|color\s*maker\s*bullet)\b/i.test(t)) {
    return "audio_video";
  }

  // 14. Cables & Passive Connectors
  if (
    /\b(kablo|kablosu|patch\s*kablo|uzatma\s*kablo|yazici\s*kablosu|sarj\s*kablosu|magsafe\s*3\s*cable|lightning\s*to\s*usb|usb-?c\s*to\s*lightning|rj-?45.*konnektor|cat[67].*konnektor|gecis\s*konnektoru|moduler\s*adaptor\s*cat|sp-u100|q-catflash|q-catfull|icat6|bc-u60\d\d|bc-dsp|ak-3\d{5})\b/i.test(t)
  ) {
    return "cable_connector";
  }

  // 15. Phones vs Tablets
  if (/\b(ipad|galaxy\s*tab|tablet)\b/i.test(t) && !/\b(kilif|case|ekran\s*koruyucu)\b/i.test(t)) {
    return "tablet";
  }
  if (/\b(iphone\s*\d+|honor\s*(?:400|magic)|akilli\s*telefon|cep\s*telefonu|smartphone)\b/i.test(t)) {
    return "smartphone";
  }

  // 16. Monitors & TVs
  if (/\b(monitor|monitör|thinkvision|ultragear|mp241\d?|mp245v|mp275q|e2425hm|e2725hm|se2225hm|t27-40|s22i-30|google\s*tv|smart.*tv|miniled\s*tv|qled.*tv|uydu\s*alic|65qned|65vq90|65t6dgtv)\b/i.test(t)) {
    return "monitor_tv";
  }

  // 17. Laptops, Mini PCs, Desktops
  if (
    /\b(dizustu\s*bilgisayar|macbook|thinkpad\s*e1[46]|probook\s*4|elitebook\s*[68]|vost\s*3530|alienware|dell\s*(?:nb\s*)?pro\s*1[46]|dell\s*por\s*u5|dell\s*pro\s*micro|dell\s*pro\s*max|asus\s*nb|asus\s*e1600|msi\s*cubi\s*nuc|masaustu\s*pc)\b/i.test(t) ||
    (/\b(i[3579]-\d{4,5}|ultra\s*[579]\s*\d{3}[a-z]|ryzen\s*[3579])\b/i.test(t) && /\b(ssd|fhd|wuxga|ubuntu|fdos|dos|w11|windows)\b/i.test(t))
  ) {
    return "laptop_pc";
  }

  // 18. Memory Cards & USB Flash Drives
  if (/\b(microsd|microsdhc|microsdxc|sdhc|sdxc|hafiza\s*karti|sdcs[23]|lmex1l)\b/i.test(t)) {
    return "memory_card";
  }
  if (/\b(flash\s*bellek|usb\s*bellek|flash\s*disk|dual\s*usb|e307c|dtxm?|dtkn|exodia)\b/i.test(t)) {
    return "usb_flash";
  }

  // 19. RAM Modules (only when not a full laptop/PC)
  if (/\b(ddr3|ddr4|ddr5|sodimm|udimm|nb\s*ram|notebook\s*ram|desktop\s*ram|kvr\d+|tmd\d+|m425r)\b/i.test(t)) {
    return "ram";
  }

  // 20. SSD & HDD Drives
  if (/\b(ssd|nvme|m\.2|m2\s*2280|sata\s*3|hard\s*disk|harddisk|sas\s*hdd|surveillance|ironwolf|870\s*evo|990\s*pro|snv3s|r500-c|nv890|nvcx1tb)\b/i.test(t)) {
    return "ssd_hdd";
  }

  return null;
}

export function hasCategoryConflict(text1: string | null | undefined, text2: string | null | undefined): boolean {
  const c1 = extractProductCategory(text1);
  const c2 = extractProductCategory(text2);
  if (!c1 || !c2) return false;
  return c1 !== c2;
}

/**
 * Extracts storage / memory / size / power / length capacities from product titles or codes.
 */
export function extractProductCapacities(text: string | null | undefined): string[] {
  if (!text) return [];
  const clean = stripSerialAndNoise(text)
    .toLowerCase()
    // Avoid treating Kingston SNV3S/1000G or 500G model suffix as grams, convert to gb/tb
    .replace(/\bsnv3s\/1000g\b/gi, "1tb")
    .replace(/\bsnv3s\/500g\b/gi, "500gb")
    .replace(/\b1000\s*gb\b/gi, "1tb")
    .replace(/(\d+),(\d+)\s*(mt|m|metre)\b/gi, "$1.$2m")
    .replace(/(\d+(?:\.\d+)?)\s*(?:mt|metre)\b/gi, "$1m");

  const results: string[] = [];
  const regex = /(?:^|[^a-z0-9.])(\d+(?:\.\d+)?)\s*(tb|gb|mb|watt|w|kva|mah|ah|ml|lt|kg|gr|inch|inç|cm|mm|m|port)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(clean)) !== null) {
    let num = parseFloat(m[1]);
    let unit = m[2].toLowerCase();
    if (unit === "watt") unit = "w";
    if (unit === "inç") unit = "inch";
    if (unit === "gb" && num === 1000) {
      num = 1;
      unit = "tb";
    }
    if (unit === "cm" && (num === 50 || num === 100 || num === 150 || num === 180 || num === 200 || num === 300 || num === 500)) {
      // Keep cm if small, or normalize 50cm -> 0.5m
      if (num === 50) {
        results.push("0.5m");
        continue;
      }
    }
    results.push(`${num}${unit}`);
  }
  return Array.from(new Set(results));
}

export function hasCapacityConflict(text1: string | null | undefined, text2: string | null | undefined): boolean {
  const caps1 = extractProductCapacities(text1);
  const caps2 = extractProductCapacities(text2);
  if (caps1.length === 0 || caps2.length === 0) return false;

  // Group capacities by dimension type so we compare storage vs storage, wattage vs wattage, length vs length, port vs port
  const dimGroups: Array<{ name: string; test: (c: string) => boolean }> = [
    { name: "storage", test: c => c.endsWith("gb") || c.endsWith("tb") || c.endsWith("mb") },
    { name: "power", test: c => c.endsWith("w") || c.endsWith("kva") },
    { name: "length", test: c => c.endsWith("m") && !c.endsWith("mm") && !c.endsWith("cm") },
    { name: "ports", test: c => c.endsWith("port") },
    { name: "volume", test: c => c.endsWith("ml") || c.endsWith("lt") }
  ];

  for (const grp of dimGroups) {
    const g1 = caps1.filter(grp.test);
    const g2 = caps2.filter(grp.test);
    if (g1.length > 0 && g2.length > 0) {
      const hasOverlap = g1.some(c1 => g2.includes(c1));
      if (!hasOverlap) return true;
    }
  }
  return false;
}

function extractConsumableColor(text: string): string[] {
  const t = text
    .toLocaleLowerCase("tr-TR")
    .replace(/[ıİ]/g, "i")
    .replace(/[ğĞ]/g, "g")
    .replace(/[üÜ]/g, "u")
    .replace(/[şŞ]/g, "s")
    .replace(/[öÖ]/g, "o")
    .replace(/[çÇ]/g, "c");

  if (/\b(cmy|uc\s*renkli|3\s*renkli|sari\/kirmizi\/mavi|cok\s*renkli|siyah\s*ve\s*beyaz)\b/i.test(t)) {
    return ["multicolor"];
  }
  const colors: string[] = [];
  if (/\b(black|siyah|mat\s*siyah|matte\s*black|photo\s*black|\bbk\b|\bpb\b)\b/i.test(t)) colors.push("black");
  if (/\b(cyan|mavi)\b/i.test(t)) colors.push("cyan");
  if (/\b(magenta|kirmizi)\b/i.test(t)) colors.push("magenta");
  if (/\b(yellow|sari)\b/i.test(t)) colors.push("yellow");
  if (/\b(green|yesil)\b/i.test(t)) colors.push("green");
  return colors;
}

/**
 * Checks if two product descriptions have conflicting specifications (capacity, DDR gen, RAM speed, SSD/HDD, color, iPhone gen).
 */
export function hasSpecificationConflict(text1: string | null | undefined, text2: string | null | undefined): boolean {
  if (!text1 || !text2) return false;
  const clean1 = stripSerialAndNoise(text1);
  const clean2 = stripSerialAndNoise(text2);
  const t1 = clean1.toLowerCase();
  const t2 = clean2.toLowerCase();

  // 1. Capacity / Power / Length / Port count conflict
  if (hasCapacityConflict(clean1, clean2)) return true;

  // 2. RAM / Memory generation conflict (ddr3, ddr4, ddr5)
  const ddrTypes = ["ddr3", "ddr4", "ddr5"];
  const foundDdr1 = ddrTypes.filter(d => t1.includes(d));
  const foundDdr2 = ddrTypes.filter(d => t2.includes(d));
  if (foundDdr1.length > 0 && foundDdr2.length > 0 && !foundDdr1.some(d => foundDdr2.includes(d))) {
    return true;
  }

  // 3. RAM Speed conflict (e.g. 3200mhz vs 5600mhz)
  const mhz1 = Array.from(new Set((t1.match(/\b(\d{4})\s*mhz\b/gi) || []).map(x => x.replace(/\s+/g, "").toLowerCase())));
  const mhz2 = Array.from(new Set((t2.match(/\b(\d{4})\s*mhz\b/gi) || []).map(x => x.replace(/\s+/g, "").toLowerCase())));
  if (mhz1.length > 0 && mhz2.length > 0 && !mhz1.some(m => mhz2.includes(m))) {
    return true;
  }

  // 4. RAM Form factor conflict (Notebook/NB/SODIMM vs Desktop/PC/UDIMM)
  const isNbRam1 = /\b(notebook\s*ram|nb\s*ram|sodimm|so-dimm|kutulu\s*nb)\b/i.test(t1);
  const isDtRam1 = /\b(desktop\s*ram|pc\s*ram|udimm)\b/i.test(t1);
  const isNbRam2 = /\b(notebook\s*ram|nb\s*ram|sodimm|so-dimm|kutulu\s*nb)\b/i.test(t2);
  const isDtRam2 = /\b(desktop\s*ram|pc\s*ram|udimm)\b/i.test(t2);
  if ((isNbRam1 && isDtRam2) || (isDtRam1 && isNbRam2)) {
    return true;
  }

  // 5. Storage form factor / bus conflict (M.2 NVMe PCIe vs 2.5" SATA3)
  const isNvme1 = /\b(nvme|pcie|m\.2|m2\s*2280)\b/i.test(t1) && !/\b(docking|kutusu)\b/i.test(t1);
  const isSata1 = /\b(sata\s*3|sata3|2\.5"|2\.5''|2'')\b/i.test(t1) && !isNvme1;
  const isNvme2 = /\b(nvme|pcie|m\.2|m2\s*2280)\b/i.test(t2) && !/\b(docking|kutusu)\b/i.test(t2);
  const isSata2 = /\b(sata\s*3|sata3|2\.5"|2\.5''|2'')\b/i.test(t2) && !isNvme2;
  if ((isNvme1 && isSata2) || (isSata1 && isNvme2)) {
    return true;
  }

  // 6. Consumable Color Conflict (Black vs Cyan vs Magenta vs Yellow vs CMY)
  const cat1 = extractProductCategory(clean1);
  const cat2 = extractProductCategory(clean2);
  if (cat1 === "consumable" || cat2 === "consumable") {
    const col1 = extractConsumableColor(clean1);
    const col2 = extractConsumableColor(clean2);
    if (col1.length > 0 && col2.length > 0 && !col1.some(c => col2.includes(c))) {
      return true;
    }
  }

  // 7. iPhone / iPad Model Number & Tier Conflict (e.g. iPhone 18 Pro vs iPhone 17 Pro Max, iPhone 17 Pro Max vs iPhone 17)
  const iph1 = t1.match(/\biphone\s*(\d{2})\b/i);
  const iph2 = t2.match(/\biphone\s*(\d{2})\b/i);
  if (iph1 && iph2 && iph1[1] !== iph2[1]) {
    return true;
  }
  if (iph1 && iph2) {
    const getIphoneTier = (s: string) => {
      if (/\bpro\s*max\b/i.test(s)) return "promax";
      if (/\bpro\b/i.test(s)) return "pro";
      if (/\bplus\b/i.test(s)) return "plus";
      if (/\bair\b/i.test(s)) return "air";
      if (/\bmini\b/i.test(s)) return "mini";
      return "base";
    };
    if (getIphoneTier(t1) !== getIphoneTier(t2)) {
      return true;
    }
  }

  return false;
}

/**
 * Detects conflicting explicit manufacturer model / part numbers (e.g. 3YL77AE vs 3YL84AE, MZ-77E500BW vs MZ-77E1T0BW, ZD220D vs ZD220T vs DS2278, MP241 vs MP2412).
 */
export function hasModelCodeConflict(
  text1: string | null | undefined,
  text2: string | null | undefined
): boolean {
  if (!text1 || !text2) return false;
  const s1 = stripSerialAndNoise(text1).toUpperCase();
  const s2 = stripSerialAndNoise(text2).toUpperCase();

  // Family-specific strict model patterns: if BOTH texts contain a code from the same family and there is no common code, conflict!
  const familyPatterns: Array<{ regex: RegExp; normalize?: (m: string) => string }> = [
    // HP Ink & Toner part families (normalize trailing E/A/C/H where base 5-char code is identical like F6V25AE <-> F6V25A, CN692AE <-> CN692A, CF259X <-> CF259XC)
    {
      regex: /\b(3YL[78][0-9]AE|3YM\d\dAE|F6V2[45]A[E]?|F6T8[123]A|L0S07AE|C937[0-9]A|C9403A|CN69[23]A[E]?|CE25[0-3][AX]|CE278A|CE285A|CE505[AX]|CF217A|CF226[AX]|CF23[34]A|CF259[AX][CH]?|CB435A|Q2612A|W203[0-3]A|X4D19AC|M0J90AE|M0K25XC)\b/g,
      normalize: m => m.slice(0, 6).replace(/A$/, "")
    },
    // HP Cartridge short series in parentheses e.g. (912) vs (912XL), (652) vs (305)
    {
      regex: /\(\s*(912XL|912|913A|973X|991AC|991XC|652|305|704|504A|504X|415A|33A|34A|26A|12A|05A|05X|59A|59X)\s*\)/g,
      normalize: m => m.replace(/[()\s]/g, "")
    },
    // Samsung SSD model codes (MZ-77E500BW vs MZ-77E1T0BW vs MZ-V9P1T0BW)
    { regex: /\b(MZ-[A-Z0-9]{6,10})\b/g },
    // MSI Monitor model codes (MP241 vs MP2412 vs MP245V vs MP275Q)
    {
      regex: /\b(MP\d{3,4}[A-Z]?)\b/g,
      normalize: m => m.match(/^MP\d{3,4}/)?.[0] || m
    },
    // Zebra printer / scanner model codes (ZD220D vs ZD220T vs ZD230D vs ZD230T vs ZQ521 vs DS2278 vs MC3300)
    {
      regex: /\b(ZD220[DT]|ZD230[DT]|ZQ521|DS2278|MC330\d|ZC100|ZC350)\b/g,
      normalize: m => m.replace(/^MC330\d$/, "MC3300")
    },
    // Digitus / Assmann cable codes (AK-300105-018 vs AK-300200-018 vs AK-300202-018 vs AK-330107-020 vs AK-330107-050 vs AK-330107-100)
    {
      regex: /\b(AK-\d{6}-\d{3})\b/g
    },
    // Beek patch/HDMI cable codes (BC-U6005 vs BC-U6015 vs BC-DSP-HA-MM-01-1 vs BC-DSP-HA-MM-05-1)
    {
      regex: /\b(BC-U60\d\d|BC-DSP-HA-MM-\d\d-\d)\b/g
    },
    // TP-Link switch/AP/router/adapter codes (normalize LS105G <-> LS1005G)
    {
      regex: /\b(LS100?5G|LS100?8G|TL-SG\d+[A-Z]*|TL-POE\d+[A-Z]*|EAP\d{3}|AX53|BE230|UA520C|M7000)\b/g,
      normalize: m => m.replace(/^LS105G$/, "LS1005G").replace(/^LS108G$/, "LS1008G")
    },
    // Qport model codes (Q-CATFLASH vs Q-CATFULL vs Q-HVG18 vs Q-UGB1)
    {
      regex: /\b(Q-CATFLASH|Q-CATFULL|Q-HVG18|Q-UGB1)\b/g
    },
    // Dell Monitor model codes (E2425HM vs E2725HM vs SE2225HM)
    {
      regex: /\b(S?E\d{4}HM)\b/g
    }
  ];

  for (const fam of familyPatterns) {
    const m1 = Array.from(s1.matchAll(fam.regex)).map(x => (fam.normalize ? fam.normalize(x[1]) : x[1]));
    const m2 = Array.from(s2.matchAll(fam.regex)).map(x => (fam.normalize ? fam.normalize(x[1]) : x[1]));
    if (m1.length > 0 && m2.length > 0) {
      const overlap = m1.some(c => m2.includes(c));
      if (!overlap) return true;
    }
  }

  return false;
}

/**
 * Master 5-Gate Zero-False-Positive Conflict Veto
 * Returns true if the invoice item and candidate inventory product have ANY brand, category, specification, or model conflict.
 */
export function hasProductMatchConflict(
  invoiceName: string | null | undefined,
  productName: string | null | undefined,
  options?: {
    invoiceBrand?: string | null;
    productBrand?: string | null;
    invoiceBarcode?: string | null;
    productBarcode?: string | null;
  }
): boolean {
  if (!invoiceName || !productName) return false;
  if (hasBrandConflict(invoiceName, productName, options?.invoiceBrand, options?.productBrand)) return true;
  if (hasCategoryConflict(invoiceName, productName)) return true;
  if (hasSpecificationConflict(invoiceName, productName)) return true;
  if (hasModelCodeConflict(invoiceName, productName)) return true;
  return false;
}

/**
 * Extracts genuine alphanumeric manufacturer model/part tokens (e.g. "MZ-V9P1T0BW", "KVR32S22S8/16", "TRU16977", "C9370A", "E307C")
 * Strictly excludes generic capacities (16GB, 512GB), frequencies (3200MHz, 144Hz), latencies (CL22, CL46), power (65W), lengths, and interface standards.
 */
export function extractModelTokens(text: string | null | undefined): string[] {
  if (!text) return [];
  const cleanedText = stripSerialAndNoise(text);

  const genericTerms = new Set([
    "usb3.0", "usb3.1", "usb3.2", "usb2.0", "usb4.0", "type-c", "typec", "usbc", "usb-c", "usb-a", "usba", "usbce", "usbad",
    "ddr3", "ddr4", "ddr5", "gddr5", "gddr6", "lpddr4", "lpddr5", "pcie", "pcie2.0", "pcie3.0", "pcie4.0", "pcie3", "pcie4", "pcie5",
    "nvme", "sata", "sata2", "sata3", "sata3.0", "hdmi", "hdmi1.4", "hdmi2.0", "hdmi2.1", "wifi", "wifi6", "wifi7", "wi-fi",
    "bluetooth", "cat5", "cat5e", "cat6", "cat6a", "cat7", "utp", "ftp", "sftp", "lszh", "rj45", "ezrj45",
    "1080p", "2160p", "720p", "4k", "8k", "64bit", "32bit", "128bit", "3dnand", "2280", "non-ecc", "sodimm", "udimm",
    "uhs-1", "uhs-i", "uhs-ii", "class-10", "class10", "100mb/sn", "100mb/s", "wled", "miniled", "oled", "qled",
    "1920x1080", "2560x1440", "3840x2160", "350x300", "10/100/1000", "802.11", "a/b/g/n/a", "e-mark"
  ]);

  // Regex for pure measurement/spec tokens that must NEVER be treated as model numbers
  const measurementRegex = /^(?:\d+(?:[.,]\d+)?(?:tb|gb|mb|kb|g|t|mhz|ghz|hz|khz|watt|w|whr|wh|kva|va|mah|ah|v|volt|vdc|vac|a|amp|mbps|gbps|mbs|mb\/s|dpi|p|k|mp|bit|mm|cm|mt|m|inch|inç|inc|ml|lt|cl|kg|gr|awg|pin|port|cell|tk|ad|adet|yil|yıl|sn|ms|ns|rpm)|cl\d+|ddr\d+[a-z]*|gddr\d+[a-z]*|pcie\d*(?:\.\d+)?|sata\d*(?:\.\d+)?|usb\d*(?:\.\d+)?|cat\.?\d+[a-z]*|wifi\d*|rj-?\d+|gen\d+|\d+in\d+|\d+x\d+[a-z]*|\d{3,4}\/\d{3,4}(?:mb\/s|mbs)?|i[3579]-\d{3,5}[a-z]*|u[579]-\d{3}[a-z]*|16gb-3200.*|16gbb-3200.*)$/i;

  const rawMatches = cleanedText.match(/[A-Za-z0-9]+(?:[-_/][A-Za-z0-9]+)+|[A-Za-z]+[0-9]+[A-Za-z0-9]*|[0-9]+[A-Za-z]+[A-Za-z0-9]*/g) || [];

  const validTokens: string[] = [];
  for (const m of rawMatches) {
    const clean = m.replace(/^[.,@~*()-]+|[.,@~*()-]+$/g, "").trim();
    if (clean.length < 4) continue;
    const upper = clean.toUpperCase();
    if (
      upper.startsWith("AUTO-") ||
      upper.startsWith("TEMP-") ||
      upper.startsWith("M-17") ||
      upper.startsWith("GEN-17") ||
      upper.startsWith("HBCV") ||
      upper.startsWith("HBV") ||
      upper.startsWith("TY-") ||
      upper.startsWith("HB-")
    ) {
      continue;
    }
    // Must contain at least one letter AND at least one digit to be a genuine alphanumeric model token
    if (!/[0-9]/.test(clean) || !/[A-Za-z]/.test(clean)) continue;
    if (genericTerms.has(clean.toLowerCase())) continue;
    if (measurementRegex.test(clean)) continue;
    validTokens.push(clean);
  }

  return Array.from(new Set(validTokens));
}

// Short-lived in-memory cache for store product catalog and supplier mappings during batch matching
const storeProductsCache = new Map<number, { timestamp: number; rows: any[] }>();
const storeMappingsCache = new Map<number, { timestamp: number; rows: any[] }>();
const CACHE_TTL_MS = 15000;

export function invalidateStoreProductsCache(storeId?: number) {
  if (storeId !== undefined) {
    storeProductsCache.delete(storeId);
    storeMappingsCache.delete(storeId);
  } else {
    storeProductsCache.clear();
    storeMappingsCache.clear();
  }
}

async function getStoreMappingsCached(clientOrPool: any, storeId: number): Promise<any[]> {
  const now = Date.now();
  const cached = storeMappingsCache.get(storeId);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.rows;
  }
  const res = await clientOrPool.query(
    `SELECT spm.supplier_vkn, spm.supplier_product_name, spm.supplier_product_code, spm.product_id,
            p.barcode, COALESCE(p.product_code, p.sku, '') as product_code, p.name, p.brand
     FROM supplier_product_mappings spm
     JOIN products p ON spm.product_id = p.id
     WHERE spm.store_id = $1`,
    [storeId]
  );
  storeMappingsCache.set(storeId, { timestamp: now, rows: res.rows });
  return res.rows;
}

async function getStoreProductsCached(clientOrPool: any, storeId: number): Promise<any[]> {
  const now = Date.now();
  const cached = storeProductsCache.get(storeId);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.rows;
  }
  const res = await clientOrPool.query(
    `SELECT id, barcode, COALESCE(product_code, sku, '') as product_code, sku, name, brand, stock_quantity
     FROM products
     WHERE store_id = $1
     ORDER BY CASE WHEN COALESCE(stock_quantity, 0) < 0 THEN 0 WHEN COALESCE(stock_quantity, 0) > 0 THEN 1 ELSE 2 END, id ASC`,
    [storeId]
  );
  const rows = res.rows.map((p: any) => {
    const cleanName = stripSerialAndNoise(p.name || "");
    return {
      ...p,
      _cleanName: cleanName,
      _cleanLower: cleanName.toLowerCase(),
      _normName: normalizeText(cleanName),
      _nameLower: (p.name || "").toLowerCase(),
      _codeLower: (p.product_code || "").trim().toLowerCase(),
      _skuLower: (p.sku || "").trim().toLowerCase(),
      _barcodeTrim: (p.barcode || "").trim(),
      _brands: extractBrands(cleanName, p.brand),
      _category: extractProductCategory(cleanName),
      _capacities: extractProductCapacities(cleanName)
    };
  });
  storeProductsCache.set(storeId, { timestamp: now, rows });
  return rows;
}

/**
 * Intelligent Multi-Tier Product Matching with 5-Gate Zero-False-Positive Veto
 *
 * 1. Supplier Product Mappings (Validated by 5-Gate Veto)
 * 2. Barcode Match (Validated by 5-Gate Veto)
 * 3. Product Code / SKU Match (Validated by 5-Gate Veto)
 * 4. Exact or Normalized Name Match (Validated by 5-Gate Veto)
 * 4.5. Canonical Brand + Category + Specification Signature Match (Matches e.g. Kingston 16GB 3200MHz DDR4 NB Ram)
 * 5. Distinct Manufacturer Model/Part Token Match (Validated by 5-Gate Veto)
 */
export async function findMatchingProduct(
  clientOrPool: any,
  storeId: number,
  params: {
    supplierVkn?: string | null;
    productName: string;
    barcode?: string | null;
    productCode?: string | null;
    sellerCode?: string | null;
    buyerCode?: string | null;
  }
): Promise<MatchCandidate | null> {
  const { supplierVkn, productName, barcode, productCode, sellerCode, buyerCode } = params;
  const cleanName = stripSerialAndNoise(productName || "");
  const normalizedItemName = normalizeText(cleanName);

  // Guard: Generic non-inventory fee/shipping/service titles must never fuzzy-match inventory products
  const genericFeeNames = new Set([
    "hizmetbedeli", "kargobedeli", "nakliyebedeli", "iscilikbedeli", "servisbedeli",
    "danismanlikbedeli", "kurulumbedeli", "montajbedeli", "bakimbedeli", "onarimbedeli"
  ]);
  if (genericFeeNames.has(normalizedItemName)) {
    return null;
  }

  // Candidate codes collected from invoice
  const rawCodes = [barcode, productCode, sellerCode, buyerCode]
    .filter(Boolean)
    .map(c => String(c).replace(/[@.,~]+$/g, "").trim())
    .filter(c => c.length > 0 && !c.startsWith("AUTO-") && !c.startsWith("TEMP-") && c !== "0" && c !== "-");
  const candidateCodes = Array.from(new Set(rawCodes));
  const incomingStandardBarcode = candidateCodes.find(c => isValidStandardBarcode(c) && !c.startsWith("200")) || null;

  // 1. Tier 1: Check Supplier Product Mappings (Prior manual or confirmed links)
  if (supplierVkn && cleanName) {
    try {
      const allMappings = await getStoreMappingsCached(clientOrPool, storeId);
      const rawTrim = (productName || "").trim();
      const matchingMaps = allMappings.filter(
        m =>
          m.supplier_vkn === supplierVkn &&
          (m.supplier_product_name === rawTrim ||
            m.supplier_product_name === cleanName ||
            (m.supplier_product_code && candidateCodes.includes(m.supplier_product_code)))
      );
      for (const row of matchingMaps) {
        if (hasProductMatchConflict(cleanName, row.name, { productBrand: row.brand })) continue;
        return {
          productId: row.product_id,
          barcode: row.barcode,
          productCode: row.product_code,
          name: row.name,
          matchType: "supplier_mapping"
        };
      }
    } catch (err) {
      console.error("Error checking supplier_product_mappings:", err);
    }
  }

  // Fetch store products (cached and pre-indexed for batch speed)
  const allStoreProducts = await getStoreProductsCached(clientOrPool, storeId);

  // 2. Tier 2: Exact Barcode Match (Only for valid standard barcodes, guarded by 5-Gate Conflict Veto)
  const standardBarcodes = candidateCodes.filter(c => isValidStandardBarcode(c));
  for (const code of standardBarcodes) {
    const codeTrim = code.trim();
    const barMatches = allStoreProducts.filter(p => p._barcodeTrim === codeTrim);
    for (const row of barMatches) {
      if (hasProductMatchConflict(cleanName, row.name, { productBrand: row.brand })) {
        continue;
      }
      return {
        productId: row.id,
        barcode: row.barcode,
        productCode: row.product_code,
        name: row.name,
        matchType: "barcode"
      };
    }
  }

  // 3. Tier 3: Product Code / SKU Match (products.product_code or products.sku, guarded by 5-Gate Conflict Veto)
  for (const code of candidateCodes) {
    if (code.length < 3) continue;
    const codeLower = code.trim().toLowerCase();
    const codeMatches = allStoreProducts.filter(
      p => (p._codeLower && p._codeLower === codeLower) || (p._skuLower && p._skuLower === codeLower)
    );
    for (const row of codeMatches) {
      if (hasProductMatchConflict(cleanName, row.name, { productBrand: row.brand })) continue;
      return {
        productId: row.id,
        barcode: row.barcode,
        productCode: row.product_code,
        name: row.name,
        matchType: "product_code"
      };
    }
  }

  // 4. Tier 4: Exact or Normalized Product Name Match
  if (cleanName) {
    const cleanLower = cleanName.toLowerCase();
    for (const p of allStoreProducts) {
      if (p._cleanLower === cleanLower) {
        if (!hasProductMatchConflict(cleanName, p.name, { productBrand: p.brand })) {
          return {
            productId: p.id,
            barcode: p.barcode,
            productCode: p.product_code,
            name: p.name,
            matchType: "exact_name"
          };
        }
      }
    }

    if (normalizedItemName.length >= 6) {
      for (const p of allStoreProducts) {
        const normP = p._normName;
        if (
          normP &&
          (normP === normalizedItemName ||
            (normP.length >= 12 &&
              normalizedItemName.length >= 12 &&
              (normP.includes(normalizedItemName) || normalizedItemName.includes(normP))))
        ) {
          if (!hasProductMatchConflict(cleanName, p.name, { productBrand: p.brand })) {
            return {
              productId: p.id,
              barcode: p.barcode,
              productCode: p.product_code,
              name: p.name,
              matchType: "normalized_name"
            };
          }
        }
      }
    }
  }

  // 5. Tier 5: Distinct Manufacturer Model Token Match (across all store products, no LIMIT 5 truncation!)
  const tokensToSearch = Array.from(
    new Set([
      ...candidateCodes.filter(c => !isValidStandardBarcode(c) && /[A-Za-z]/.test(c) && /[0-9]/.test(c)),
      ...extractModelTokens(cleanName),
      ...candidateCodes.flatMap(c => extractModelTokens(c))
    ])
  ).filter(t => t.length >= 4);

  // Sort tokens by specificity (longer and containing hyphens/slashes first, e.g. KVR32S22S8/16 before KVR32S22S8)
  tokensToSearch.sort((a, b) => b.length - a.length);

  for (const token of tokensToSearch) {
    const tokenLower = token.toLowerCase();
    const tokenVariants = [tokenLower];
    if (tokenLower.includes("/")) {
      const preSlash = tokenLower.split("/")[0];
      if (preSlash.length >= 6) tokenVariants.push(preSlash);
    }
    if (/^ak-\d{6}-\d{3}-[a-z]$/i.test(tokenLower)) {
      tokenVariants.push(tokenLower.slice(0, -2));
    }

    const matchingRows = allStoreProducts.filter((row: any) => {
      const hasToken = tokenVariants.some(
        tv => row._nameLower.includes(tv) || row._codeLower.includes(tv) || row._skuLower.includes(tv)
      );
      if (!hasToken) return false;
      if (hasProductMatchConflict(cleanName, row.name, { productBrand: row.brand })) return false;
      return true;
    });

    if (matchingRows.length === 1) {
      const row = matchingRows[0];
      return {
        productId: row.id,
        barcode: row.barcode,
        productCode: row.product_code,
        name: row.name,
        matchType: "model_token"
      };
    } else if (matchingRows.length > 1) {
      const cleanLower = cleanName.toLowerCase();
      const invoiceWords = cleanLower.split(/\s+/).filter((w: string) => w.length > 2);
      let bestMatch: any = null;
      let maxScore = -1;
      for (const row of matchingRows) {
        const overlap = invoiceWords.filter((w: string) => row._nameLower.includes(w)).length;
        const negStockBonus = Number(row.stock_quantity) < 0 ? 0.5 : 0;
        const score = overlap + negStockBonus;
        if (score > maxScore) {
          maxScore = score;
          bestMatch = row;
        }
      }
      if (bestMatch && maxScore >= 1) {
        return {
          productId: bestMatch.id,
          barcode: bestMatch.barcode,
          productCode: bestMatch.product_code,
          name: bestMatch.name,
          matchType: "model_token"
        };
      }
    }
  }

  // 6. Tier 6: Canonical Brand + Functional Category + Exact Specification Signature Match
  const itemBrands = extractBrands(cleanName);
  const itemCategory = extractProductCategory(cleanName);
  const itemCaps = extractProductCapacities(cleanName);

  if (itemBrands.length > 0 && itemCategory && itemCaps.length > 0) {
    const specCandidates = allStoreProducts.filter((row: any) => {
      const prodBrands = row._brands;
      if (prodBrands.length === 0 || !itemBrands.some(b => prodBrands.includes(b))) return false;
      if (row._category !== itemCategory) return false;
      const prodCaps = row._capacities;
      if (prodCaps.length === 0) return false;
      if (!itemCaps.every(c => prodCaps.includes(c)) || !prodCaps.every(c => itemCaps.includes(c))) return false;
      if (hasProductMatchConflict(cleanName, row.name, { productBrand: row.brand })) return false;
      return true;
    });

    if (specCandidates.length === 1) {
      const row = specCandidates[0];
      return {
        productId: row.id,
        barcode: row.barcode,
        productCode: row.product_code,
        name: row.name,
        matchType: "normalized_name"
      };
    } else if (specCandidates.length > 1) {
      // Require high significant word overlap (>= 65% of shorter title's words)
      const getSigWords = (s: string) =>
        normalizeTurkishText(stripSerialAndNoise(s))
          .replace(/[^a-z0-9\s]/g, " ")
          .split(/\s+/)
          .filter(w => w.length >= 2);
      const w1 = getSigWords(cleanName);
      let bestRow: any = null;
      let bestRatio = 0;
      for (const row of specCandidates) {
        const w2 = getSigWords(row.name);
        const minLen = Math.min(w1.length, w2.length);
        if (minLen === 0) continue;
        const shared = w1.filter(x => w2.includes(x)).length;
        const ratio = shared / minLen;
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestRow = row;
        }
      }
      if (bestRow && bestRatio >= 0.7) {
        return {
          productId: bestRow.id,
          barcode: bestRow.barcode,
          productCode: bestRow.product_code,
          name: bestRow.name,
          matchType: "normalized_name"
        };
      }
    }
  }

  return null;
}

/**
 * Remember mapping for future invoices
 */
export async function saveSupplierMapping(
  clientOrPool: any,
  storeId: number,
  supplierVkn: string,
  supplierProductName: string,
  productId: number,
  supplierProductCode?: string | null
) {
  if (!supplierVkn || !supplierProductName || !productId) return;
  try {
    await clientOrPool.query(
      `INSERT INTO supplier_product_mappings 
        (store_id, supplier_vkn, supplier_product_name, supplier_product_code, product_id) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (store_id, supplier_vkn, supplier_product_name) 
       DO UPDATE SET 
         product_id = EXCLUDED.product_id,
         supplier_product_code = COALESCE(EXCLUDED.supplier_product_code, supplier_product_mappings.supplier_product_code)`,
      [storeId, supplierVkn, supplierProductName, supplierProductCode || null, productId]
    );
  } catch (err) {
    console.error("Failed to save supplier product mapping:", err);
  }
}

export interface ExpenseDetectionResult {
  isExpense: boolean;
  expenseCategory: string | null;
  expenseCenter: string | null;
  reason?: string;
}

export function normalizeTurkishText(str: string): string {
  if (!str) return '';
  return str
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'g')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/Ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'u')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Intelligent Expense Supplier & Category Detection Engine
 * Covers supermarkets, electricity, water, telecom, fuel, cargo, stationery, cleaning, maintenance, food, insurance, rent.
 */
export function detectExpenseCategory(
  supplierTitle?: string | null,
  supplierVkn?: string | null,
  notes?: string | null
): ExpenseDetectionResult {
  const rawTitle = (supplierTitle || "").trim();
  const rawNotes = (notes || "").trim();
  const normTitle = normalizeTurkishText(rawTitle);
  const normNotes = normalizeTurkishText(rawNotes);
  const titleLower = normTitle;
  const combined = `${normTitle} ${normNotes}`;
  const vkn = String(supplierVkn || '').trim();

  // Known VKN / Tax Number overrides
  // 1750051846: BİM Birleşik Mağazalar A.Ş.
  // 9980069675: Yeni Mağazacılık A.Ş. (A101)
  // 8110057404: ŞOK Marketler Ticaret A.Ş.
  // 6220529546: Migros Ticaret A.Ş.
  // 2030018596: CarrefourSA Carrefour Sabancı Ticaret Merkezi A.Ş.
  if (['1750051846', '9980069675', '8110057404', '6220529546', '2030018596'].includes(vkn)) {
    return {
      isExpense: true,
      expenseCategory: 'MARKET',
      expenseCenter: 'office',
      reason: 'Known Supermarket VKN'
    };
  }

  // 1. Supermarket, Grocery & Food Retail (BİM, A101, ŞOK, Migros, Carrefour, Tarım Kredi, Hakmar, etc.)
  const isBimMarket = (
    titleLower === 'bim' ||
    titleLower.startsWith('bim ') ||
    titleLower.endsWith(' bim') ||
    titleLower.includes(' bim ') ||
    titleLower.includes('bim birlesik') ||
    titleLower.includes('bim birleşik') ||
    titleLower.includes('bim magazacilik') ||
    titleLower.includes('bim mağazacılık') ||
    titleLower.includes('birlesik magazalar') ||
    titleLower.includes('birleşik mağazalar')
  ) && !titleLower.includes('bimel') && !titleLower.includes('bimed') && !titleLower.includes('bimeks') && !titleLower.includes('bimsan') && !titleLower.includes('bimak');

  if (
    isBimMarket ||
    titleLower.includes('a101') || titleLower.includes('yeni magazacilik') || titleLower.includes('yeni mağazacılık') ||
    titleLower.includes('sok market') || titleLower.includes('şok market') || titleLower.includes('sok marketler') || titleLower.includes('şok marketler') ||
    titleLower.includes('migros') || titleLower.includes('macrocenter') ||
    titleLower.includes('carrefour') || titleLower.includes('carrefoursa') ||
    titleLower.includes('metro gross') || titleLower.includes('metro toptanci') || titleLower.includes('metro toptancı') ||
    titleLower.includes('tarim kredi') || titleLower.includes('tarım kredi') ||
    titleLower.includes('hakmar') || titleLower.includes('bizim toptan') ||
    titleLower.includes('file market') || titleLower.includes('onur market') ||
    titleLower.includes('happy center') || titleLower.includes('mopas') || titleLower.includes('mopaş') ||
    titleLower.includes('yunus market') || titleLower.includes('cagri market') || titleLower.includes('çağrı market') ||
    titleLower.includes('makro market') || titleLower.includes('pehlivanoglu') || titleLower.includes('pehlivanoğlu') ||
    titleLower.includes('gross market') || titleLower.includes('supermarket') || titleLower.includes('süpermarket') ||
    titleLower.includes('hipermarket') || titleLower.includes('bakkal') || titleLower.includes('manav')
  ) {
    return {
      isExpense: true,
      expenseCategory: 'MARKET',
      expenseCenter: 'office',
      reason: 'Supermarket & Retail Store'
    };
  }

  // 2. Electricity & Energy
  if (
    combined.includes('enerjisa') || combined.includes('ayedas') || combined.includes('ayedaş') ||
    combined.includes('ck bogazici') || combined.includes('ck boğaziçi') || combined.includes('bogazici elektrik') || combined.includes('boğaziçi elektrik') ||
    combined.includes('gediz') || combined.includes('toroslar') || combined.includes('yesilirmak') || combined.includes('yeşilırmak') ||
    combined.includes('dicle elektrik') || combined.includes('uludag elektrik') || combined.includes('uludağ elektrik') ||
    combined.includes('akdeniz elektrik') || combined.includes('coruh elektrik') || combined.includes('camlibel') || combined.includes('çamlıbel') ||
    combined.includes('araz elektrik') || combined.includes('baskent elektrik') || combined.includes('başkent elektrik') ||
    combined.includes('elektrik perakende') || combined.includes('elektrik dagitim') || combined.includes('elektrik dağıtım') ||
    combined.includes('epias') || combined.includes('epiaş') || combined.includes('kib-tek') || combined.includes('kibtek')
  ) {
    return {
      isExpense: true,
      expenseCategory: 'ELEKTRIK',
      expenseCenter: 'office',
      reason: 'Electricity Utility'
    };
  }

  // 3. Water & Drainage
  if (
    combined.includes('iski') || combined.includes('aski') || combined.includes('izsu') || combined.includes('buski') ||
    combined.includes('deski') || combined.includes('koski') || combined.includes('gaski') || combined.includes('meski') || combined.includes('saski') ||
    combined.includes('sirma su') || combined.includes('sırma su') || combined.includes('hayat su') || combined.includes('erikli') ||
    combined.includes('hamidiye') || combined.includes('pinar su') || combined.includes('pınar su') || combined.includes('damla su') ||
    combined.includes('abant su') || combined.includes('kardelen su') || combined.includes('su aritma') || combined.includes('su arıtma') ||
    combined.includes('su ve kanalizasyon')
  ) {
    return {
      isExpense: true,
      expenseCategory: 'SU',
      expenseCenter: 'office',
      reason: 'Water Utility'
    };
  }

  // 4. Fuel, Gas & Energy
  if (
    combined.includes('igdas') || combined.includes('igdaş') || combined.includes('baskentgaz') || combined.includes('başkentgaz') || combined.includes('izmirgaz') ||
    combined.includes('shell') || combined.includes('petrol ofisi') || combined.includes('opet') || combined.includes('bp petrol') ||
    combined.includes('totalenergies') || combined.includes('aygaz') || combined.includes('ipragaz') || combined.includes('milangaz') ||
    combined.includes('likitgaz') || combined.includes('akaryakit') || combined.includes('akaryakıt') || combined.includes('benzin') ||
    combined.includes('otogaz') || combined.includes('motorin') || combined.includes('akpet') || combined.includes('alpet') ||
    combined.includes('sunpet') || combined.includes('tp petrol') || combined.includes('petrol istasyon')
  ) {
    return {
      isExpense: true,
      expenseCategory: 'YAKIT',
      expenseCenter: 'office',
      reason: 'Fuel / Gas / Energy'
    };
  }

  // 5. Telecom, Internet, Cloud & Software
  if (
    combined.includes('turkcell') || combined.includes('vodafone') || combined.includes('turk telekom') || combined.includes('türk telekom') ||
    combined.includes('ttnet') || combined.includes('superonline') || combined.includes('turksat') || combined.includes('türksat') ||
    combined.includes('millenicom') || combined.includes('netspeed') || combined.includes('gibirnet') || combined.includes('netgsm') ||
    combined.includes('verimor') || combined.includes('hosting') || combined.includes('natro') || combined.includes('isimtescil') ||
    combined.includes('radore') || combined.includes('dgnplus') || combined.includes('turhost') || combined.includes('niobe') ||
    combined.includes('digitalocean') || combined.includes('aws') || combined.includes('google cloud') || combined.includes('cloudflare') ||
    combined.includes('domain') || combined.includes('sunucu') || combined.includes('telekomunikasyon') || combined.includes('telekomünikasyon') ||
    combined.includes('iletisim hizmetleri') || combined.includes('iletişim hizmetleri')
  ) {
    return {
      isExpense: true,
      expenseCategory: 'TELEKOM',
      expenseCenter: 'office',
      reason: 'Telecommunications & IT'
    };
  }

  // 6. Cargo, Courier & Logistics
  if (
    combined.includes('aras kargo') || combined.includes('yurtici kargo') || combined.includes('yurtiçi kargo') ||
    combined.includes('mng kargo') || combined.includes('surat kargo') || combined.includes('sürat kargo') ||
    combined.includes('ptt kargo') || combined.includes('ups kargo') || combined.includes('fedex') || combined.includes('dhl') ||
    combined.includes('kargo tasimacilik') || combined.includes('kargo taşımacılık') || combined.includes('kurye') ||
    combined.includes('scotty') || combined.includes('hepsijet') || combined.includes('kolay gelsin') ||
    combined.includes('trendyol express') || combined.includes('sendeo') || combined.includes('lojistik ve tasima') || combined.includes('lojistik ve taşıma')
  ) {
    return {
      isExpense: true,
      expenseCategory: 'KARGO',
      expenseCenter: 'marketing',
      reason: 'Cargo & Logistics'
    };
  }

  // 7. Stationery, Office Supplies & Packaging
  if (
    combined.includes('kirtasiye') || combined.includes('kırtasiye') || combined.includes('avansas') ||
    combined.includes('officestore') || combined.includes('d&r') || combined.includes('nezih') ||
    combined.includes('fotokopi') || combined.includes('matbaa') || combined.includes('toner') || combined.includes('kartus') || combined.includes('kartuş') ||
    combined.includes('ambalaj') || combined.includes('koli kutu') || combined.includes('poset') || combined.includes('poşet') ||
    combined.includes('etiket matbaa') || combined.includes('faber-castell') || combined.includes('adel kalem')
  ) {
    return {
      isExpense: true,
      expenseCategory: 'KIRTASIYE',
      expenseCenter: 'office',
      reason: 'Stationery & Office Supplies'
    };
  }

  // 8. Cleaning & Consumables
  if (
    combined.includes('temizlik urun') || combined.includes('temizlik ürün') || combined.includes('deterjan') ||
    combined.includes('dezenfektan') || combined.includes('hijyen') || combined.includes('endustriyel temizlik') || combined.includes('endüstriyel temizlik') ||
    combined.includes('kagit havlu') || combined.includes('kağıt havlu') || combined.includes('pecete') || combined.includes('peçete')
  ) {
    return {
      isExpense: true,
      expenseCategory: 'TEMIZLIK',
      expenseCenter: 'office',
      reason: 'Cleaning & Consumables'
    };
  }

  // 9. Maintenance, Repair & DIY Hardware
  if (
    combined.includes('koctas') || combined.includes('koçtaş') || combined.includes('bauhaus') ||
    combined.includes('ikea') || combined.includes('tekzen') || combined.includes('praktiker') ||
    combined.includes('nalbur') || combined.includes('hirdavat') || combined.includes('hırdavat') ||
    combined.includes('oto sanayi') || combined.includes('oto tamir') || combined.includes('oto servis') ||
    combined.includes('periyodik bakim') || combined.includes('periyodik bakım')
  ) {
    return {
      isExpense: true,
      expenseCategory: 'BAKIM_ONARIM',
      expenseCenter: 'service',
      reason: 'Maintenance, Hardware & DIY'
    };
  }

  // 10. Food, Catering & Restaurant
  if (
    combined.includes('multinet') || combined.includes('sodexo') || combined.includes('edenred') ||
    combined.includes('ticket restaurant') || combined.includes('metropolcard') ||
    combined.includes('catering') || combined.includes('tabldot') || combined.includes('restoran') ||
    combined.includes('lokanta') || combined.includes('pastane') || combined.includes('firin') || combined.includes('fırın')
  ) {
    return {
      isExpense: true,
      expenseCategory: 'YEMEK',
      expenseCenter: 'personnel',
      reason: 'Food & Catering'
    };
  }

  // 11. Insurance & Security
  if (
    combined.includes('anadolu sigorta') || combined.includes('allianz') || combined.includes('ak sigorta') || combined.includes('aksigorta') ||
    combined.includes('axa sigorta') || combined.includes('sompo') || combined.includes('gunes sigorta') || combined.includes('güneş sigorta') ||
    combined.includes('mapfre') || combined.includes('turkiye sigorta') || combined.includes('türkiye sigorta') || combined.includes('hdi sigorta') ||
    combined.includes('neova') || combined.includes('doga sigorta') || combined.includes('doğa sigorta') ||
    combined.includes('kasko') || combined.includes('trafik sigortasi') || combined.includes('trafik sigortası') ||
    combined.includes('pronet') || combined.includes('securitas') || combined.includes('kale guvenlik') || combined.includes('kale güvenlik')
  ) {
    return {
      isExpense: true,
      expenseCategory: 'SIGORTA',
      expenseCenter: 'office',
      reason: 'Insurance & Security'
    };
  }

  // 12. Professional Services, Rent, Dues & Consultancy
  if (
    combined.includes('mali musavir') || combined.includes('mali müşavir') || combined.includes('muhasebe') || combined.includes('smmm') ||
    combined.includes('avukat') || combined.includes('hukuk burosu') || combined.includes('hukuk bürosu') || combined.includes('noter') ||
    combined.includes('ticaret odasi') || combined.includes('ticaret odası') || combined.includes('sanayi odasi') || combined.includes('sanayi odası') ||
    combined.includes('esnaf odasi') || combined.includes('esnaf odası') || combined.includes('apartman yonetimi') || combined.includes('apartman yönetimi') ||
    combined.includes('site yonetimi') || combined.includes('site yönetimi') || combined.includes('aidat') || combined.includes('kira bedeli')
  ) {
    return {
      isExpense: true,
      expenseCategory: 'KIRA_VE_AIDAT',
      expenseCenter: 'office',
      reason: 'Rent, Dues & Professional Services'
    };
  }

  return {
    isExpense: false,
    expenseCategory: null,
    expenseCenter: null
  };
}

/**
 * Reverts stock additions, deletes stock movements, cleans up orphan auto-created products,
 * and sets invoice items to non-inventory state for an expense invoice.
 */
export async function revertInvoiceStockAndProducts(
  clientOrPool: any,
  storeId: number,
  invoiceId: number
): Promise<{ revertedCount: number; deletedProductsCount: number }> {
  // Fetch invoice details
  const invRes = await clientOrPool.query(
    "SELECT id, invoice_number, document_number FROM purchase_invoices WHERE id = $1 AND store_id = $2",
    [invoiceId, storeId]
  );
  if (invRes.rows.length === 0) return { revertedCount: 0, deletedProductsCount: 0 };
  const inv = invRes.rows[0];
  const invNum = inv.invoice_number || inv.document_number || '';

  // Get all items in this purchase invoice
  const itemsRes = await clientOrPool.query(
    "SELECT id, product_id, barcode, product_code, quantity, system_quantity FROM purchase_invoice_items WHERE purchase_invoice_id = $1",
    [invoiceId]
  );

  let revertedCount = 0;
  let deletedProductsCount = 0;
  const productIdsToCheck: number[] = [];

  for (const item of itemsRes.rows) {
    let prodId = item.product_id;
    if (!prodId && (item.barcode || item.product_code)) {
      const pFind = await clientOrPool.query(
        "SELECT id FROM products WHERE store_id = $1 AND (barcode = $2 OR (product_code IS NOT NULL AND product_code = $3)) LIMIT 1",
        [storeId, item.barcode || '__NONE__', item.product_code || '__NONE__']
      );
      if (pFind.rows.length > 0) {
        prodId = pFind.rows[0].id;
      }
    }

    if (prodId) {
      const qtyToDeduct = item.system_quantity != null ? Number(item.system_quantity) : Number(item.quantity || 1);
      if (qtyToDeduct > 0) {
        await clientOrPool.query(
          "UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - $1) WHERE id = $2 AND store_id = $3",
          [qtyToDeduct, prodId, storeId]
        );
        revertedCount++;
      }
      productIdsToCheck.push(prodId);
    }
  }

  // Delete all stock movement logs related to this invoice
  await clientOrPool.query(
    `DELETE FROM stock_movements 
     WHERE store_id = $1 
       AND ((source = 'purchase_invoice' OR invoice_type = 'purchase') AND (invoice_id = $2 OR description LIKE $3 OR description LIKE $4))`,
    [storeId, invoiceId, `%${invNum}%`, `%${invoiceId}%`]
  );

  // Unlink items from product catalog so they do not show barcode/stock links
  await clientOrPool.query(
    "UPDATE purchase_invoice_items SET product_id = NULL, barcode = NULL, product_code = NULL WHERE purchase_invoice_id = $1",
    [invoiceId]
  );

  // Check if any referenced products were auto-created exclusively for incoming invoices and have no other transactions
  for (const pid of Array.from(new Set(productIdsToCheck))) {
    try {
      const prodRes = await clientOrPool.query(
        "SELECT id, labels, stock_quantity FROM products WHERE id = $1 AND store_id = $2",
        [pid, storeId]
      );
      if (prodRes.rows.length > 0) {
        const p = prodRes.rows[0];
        const labelsStr = JSON.stringify(p.labels || []);
        const isAutoCreated = labelsStr.includes("yeni_fatura_urunu");

        if (isAutoCreated) {
          // Check if this product is used in any sale or other invoice
          const saleCheck = await clientOrPool.query(
            "SELECT 1 FROM sales_items WHERE product_id = $1 LIMIT 1",
            [pid]
          );
          const otherInvCheck = await clientOrPool.query(
            "SELECT 1 FROM purchase_invoice_items WHERE product_id = $1 AND purchase_invoice_id != $2 LIMIT 1",
            [pid, invoiceId]
          );
          const movesCheck = await clientOrPool.query(
            "SELECT 1 FROM stock_movements WHERE product_id = $1 LIMIT 1",
            [pid]
          );

          if (saleCheck.rows.length === 0 && otherInvCheck.rows.length === 0 && movesCheck.rows.length === 0) {
            await clientOrPool.query("DELETE FROM products WHERE id = $1 AND store_id = $2", [pid, storeId]);
            deletedProductsCount++;
          }
        }
      }
    } catch (e) {
      console.error(`Error cleaning auto-created product ${pid}:`, e);
    }
  }

  return { revertedCount, deletedProductsCount };
}

/**
 * Resolves expense classification by consulting:
 * 1. Pinned supplier record in companies table (is_expense = true)
 * 2. Historical purchase invoices for this supplier in this store (is_expense = true)
 * 3. Keyword / VKN intelligent detection engine (detectExpenseCategory)
 * If detected as expense, optionally pins the supplier in companies table so future queries are instant.
 */
export async function resolveExpenseClassification(
  poolOrClient: any,
  storeId: number,
  params: {
    supplierTitle?: string | null;
    supplierVkn?: string | null;
    companyId?: number | null;
    pinToCompany?: boolean;
  }
): Promise<ExpenseDetectionResult> {
  const { supplierTitle, supplierVkn, companyId, pinToCompany = true } = params;
  const vkn = (supplierVkn || '').trim();
  const title = (supplierTitle || '').trim();

  // 1. Check pinned supplier in companies table
  if (companyId) {
    const compRes = await poolOrClient.query(
      "SELECT id, is_expense, expense_category, expense_center FROM companies WHERE id = $1 AND store_id = $2",
      [companyId, storeId]
    );
    if (compRes.rows.length > 0) {
      if (compRes.rows[0].is_expense === false) {
        return {
          isExpense: false,
          expenseCategory: null,
          expenseCenter: null,
          reason: 'Company explicitly marked as stock supplier'
        };
      }
      if (compRes.rows[0].is_expense === true) {
        return {
          isExpense: true,
          expenseCategory: compRes.rows[0].expense_category || 'MARKET',
          expenseCenter: compRes.rows[0].expense_center || 'office',
          reason: 'Pinned in Company Record'
        };
      }
    }
  }

  if (vkn) {
    const compRes = await poolOrClient.query(
      "SELECT id, is_expense, expense_category, expense_center FROM companies WHERE store_id = $1 AND tax_number = $2 LIMIT 1",
      [storeId, vkn]
    );
    if (compRes.rows.length > 0) {
      if (compRes.rows[0].is_expense === false) {
        return {
          isExpense: false,
          expenseCategory: null,
          expenseCenter: null,
          reason: 'Company explicitly marked as stock supplier by VKN'
        };
      }
      if (compRes.rows[0].is_expense === true) {
        return {
          isExpense: true,
          expenseCategory: compRes.rows[0].expense_category || 'MARKET',
          expenseCenter: compRes.rows[0].expense_center || 'office',
          reason: 'Pinned by Supplier VKN in Companies'
        };
      }
    }
  }

  // 2. Check historical purchase invoices for this supplier in this store
  if (vkn || title) {
    const histRes = await poolOrClient.query(
      `SELECT expense_category, expense_center 
       FROM purchase_invoices 
       WHERE store_id = $1 
         AND is_expense = true 
         AND (
           ($2 != '' AND tax_number = $2) 
           OR ($3 != '' AND LOWER(TRIM(supplier_name)) = LOWER(TRIM($3)))
         )
       ORDER BY id DESC LIMIT 1`,
      [storeId, vkn, title]
    );
    if (histRes.rows.length > 0) {
      const cat = histRes.rows[0].expense_category || 'MARKET';
      const center = histRes.rows[0].expense_center || 'office';

      // Pin to company if requested
      if (pinToCompany && (vkn || companyId)) {
        try {
          if (companyId) {
            await poolOrClient.query(
              "UPDATE companies SET is_expense = true, expense_category = COALESCE(expense_category, $1), expense_center = COALESCE(expense_center, $2) WHERE id = $3",
              [cat, center, companyId]
            );
          } else if (vkn) {
            await poolOrClient.query(
              "UPDATE companies SET is_expense = true, expense_category = COALESCE(expense_category, $1), expense_center = COALESCE(expense_center, $2) WHERE store_id = $3 AND tax_number = $4",
              [cat, center, storeId, vkn]
            );
          }
        } catch (e) {
          console.error("Error auto-pinning company as expense:", e);
        }
      }

      return {
        isExpense: true,
        expenseCategory: cat,
        expenseCenter: center,
        reason: 'Inherited from Past Expense Invoices'
      };
    }
  }

  // 3. Intelligent detection engine based on Title & VKN
  const detected = detectExpenseCategory(title, vkn, null);
  if (detected.isExpense) {
    // Pin to company so future invoices are immediately recognized
    if (pinToCompany && (vkn || companyId)) {
      try {
        if (companyId) {
          await poolOrClient.query(
            "UPDATE companies SET is_expense = true, expense_category = COALESCE(expense_category, $1), expense_center = COALESCE(expense_center, $2) WHERE id = $3",
            [detected.expenseCategory, detected.expenseCenter, companyId]
          );
        } else if (vkn) {
          await poolOrClient.query(
            "UPDATE companies SET is_expense = true, expense_category = COALESCE(expense_category, $1), expense_center = COALESCE(expense_center, $2) WHERE store_id = $3 AND tax_number = $4",
            [detected.expenseCategory, detected.expenseCenter, storeId, vkn]
          );
        }
      } catch (e) {
        console.error("Error pinning detected company as expense:", e);
      }
    }
    return detected;
  }

  return {
    isExpense: false,
    expenseCategory: null,
    expenseCenter: null
  };
}


