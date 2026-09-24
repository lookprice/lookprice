import { GoogleGenAI } from "@google/genai";
import { getGeminiApiKey } from "./utils";

export interface BookMarketPriceSource {
  source_name: string;
  title?: string;
  publisher?: string;
  price: number;
  price_formatted: string;
  url?: string;
  is_exact_match?: boolean;
}

export interface BookMarketPrices {
  list_price: number;
  min_price: number;
  avg_price: number;
  max_price: number;
  suggested_price: number;
  sources: BookMarketPriceSource[];
}

export interface BookLookupResult {
  barcode: string;
  name: string;
  author: string;
  brand: string;
  publisher: string;
  category: string;
  sub_category: string;
  description: string;
  image_url: string;
  source: string;
  market_prices?: BookMarketPrices;
}

export function generateHighResBookCoverSvg(title: string, author?: string, publisher?: string, category?: string): string {
  const safeTitle = (title || "Eser Adı").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeAuthor = (author || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safePublisher = (publisher || "LOOKPRICE").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeCat = (category || "EDEBİYAT").toUpperCase();

  const palettes = [
    { bg1: "#1e1b4b", bg2: "#0f172a", gold: "#f59e0b", accent: "#818cf8", light: "#e0e7ff" }, // Midnight Navy
    { bg1: "#450a0a", bg2: "#1c0404", gold: "#fbbf24", accent: "#f87171", light: "#fee2e2" }, // Rich Crimson
    { bg1: "#064e3b", bg2: "#022c22", gold: "#34d399", accent: "#6ee7b7", light: "#d1fae5" }, // Emerald Classic
    { bg1: "#3b0764", bg2: "#1e0533", gold: "#fbbf24", accent: "#c084fc", light: "#f3e8ff" }, // Royal Velvet
    { bg1: "#1c1917", bg2: "#0c0a09", gold: "#d97706", accent: "#a8a29e", light: "#f5f5f4" }, // Onyx Leather
    { bg1: "#701a75", bg2: "#3b073a", gold: "#f472b6", accent: "#e879f9", light: "#fdf4ff" }, // Deep Plum
    { bg1: "#1e293b", bg2: "#0f172a", gold: "#38bdf8", accent: "#94a3b8", light: "#f1f5f9" }  // Slate Modern
  ];
  const hash = Math.abs((safeTitle + safeAuthor).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0));
  const pal = palettes[hash % palettes.length];

  const words = safeTitle.split(" ");
  let lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > 18 && cur) {
      lines.push(cur.trim());
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) lines.push(cur);
  lines = lines.slice(0, 4);

  const titleSvgText = lines.map((l, i) => {
    const y = 330 + (i * 44) - ((lines.length - 1) * 22);
    return `<text x="300" y="${y}" text-anchor="middle" fill="#ffffff" font-family="Georgia, serif" font-weight="900" font-size="32" letter-spacing="1.5">${l}</text>`;
  }).join("\n");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 850" width="600" height="850">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${pal.bg1}" />
        <stop offset="100%" stop-color="${pal.bg2}" />
      </linearGradient>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#d97706" />
        <stop offset="50%" stop-color="${pal.gold}" />
        <stop offset="100%" stop-color="#d97706" />
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="2" dy="4" stdDeviation="4" flood-opacity="0.5" />
      </filter>
    </defs>
    <rect width="600" height="850" rx="16" fill="url(#bgGrad)" />
    <rect x="0" y="0" width="28" height="850" rx="16" fill="#000000" opacity="0.35" />
    <line x1="28" y1="0" x2="28" y2="850" stroke="${pal.gold}" stroke-width="1.5" opacity="0.4" />
    <rect x="42" y="38" width="516" height="774" rx="10" fill="none" stroke="url(#goldGrad)" stroke-width="2.5" opacity="0.85" />
    <rect x="52" y="48" width="496" height="754" rx="6" fill="none" stroke="${pal.accent}" stroke-width="1" opacity="0.4" />
    <rect x="180" y="75" width="240" height="32" rx="16" fill="#ffffff" fill-opacity="0.1" stroke="url(#goldGrad)" stroke-width="1.2" />
    <text x="300" y="96" text-anchor="middle" fill="${pal.gold}" font-family="Arial, sans-serif" font-weight="900" font-size="12" letter-spacing="3">${safeCat}</text>
    <circle cx="300" cy="180" r="36" fill="none" stroke="url(#goldGrad)" stroke-width="2" />
    <path d="M 282 180 L 300 162 L 318 180 L 300 198 Z" fill="none" stroke="${pal.gold}" stroke-width="2" />
    <circle cx="300" cy="180" r="4" fill="${pal.gold}" />
    <g filter="url(#shadow)">
      ${titleSvgText}
    </g>
    <line x1="200" y1="480" x2="400" y2="480" stroke="url(#goldGrad)" stroke-width="2" />
    <polygon points="300,475 306,480 300,485 294,480" fill="${pal.gold}" />
    ${safeAuthor ? `<text x="300" y="550" text-anchor="middle" fill="${pal.light}" font-family="Georgia, serif" font-style="italic" font-size="24" letter-spacing="1.5">${safeAuthor}</text>` : ""}
    <rect x="120" y="710" width="360" height="42" rx="8" fill="#000000" fill-opacity="0.4" stroke="${pal.gold}" stroke-width="1" />
    <text x="300" y="736" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-weight="800" font-size="13" letter-spacing="2">${safePublisher.toUpperCase()}</text>
  </svg>`;

  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

export const splitAndCleanCategory = (rawCat: string = "") => {
  if (!rawCat) return { category: "Edebiyat", subCategory: "Roman" };
  const parts = rawCat.split(/[\/>,]/).map(s => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { category: parts[0], subCategory: parts.slice(1).join(" / ") };
  }
  return { category: parts[0] || "Edebiyat", subCategory: "Roman" };
};

// Offline Catalog for known Turkish ISBNs
const OFFLINE_CATALOG: Record<string, any> = {
  "9786051131436": {
    name: "Pinokyo (Büyümeden Önce Okunacak Kitaplar)",
    author: "Carlo Collodi",
    publisher: "Karatay Yayınları",
    category: "Çocuk Edebiyatı / Masal",
    description: "Carlo Collodi'nin dünya çocuk klasikleri arasında yer alan ölümsüz eseri Pinokyo.",
    image_url: "https://covers.openlibrary.org/b/isbn/9786051131436-L.jpg"
  },
  "9786059441032": {
    name: "Kelebek Adası",
    author: "Sarah Jio",
    publisher: "Pena Yayınları",
    category: "Edebiyat / Roman",
    description: "Sarah Jio'nun kaleminden 'Gittiğim her yol sana çıkıyor' sloganıyla unutulmaz bir aşk ve gizem romanı.",
    image_url: "https://covers.openlibrary.org/b/isbn/9786059441032-L.jpg"
  },
  "9789759693756": {
    name: "Bir Dinozorun Anıları",
    author: "Mîna Urgan",
    publisher: "Yapı Kredi Yayınları",
    category: "Biyografi / Anı",
    description: "Mîna Urgan'ın sımsıcak, dobra ve hayat dolu unutulmaz anıları.",
    image_url: "https://covers.openlibrary.org/b/isbn/9789759693756-L.jpg"
  },
  "9789752128262": { 
    name: "Uzun Yürüyüş (The Long Walk)", 
    author: "Stephen King (Richard Bachman)", 
    publisher: "Altın Kitaplar", 
    category: "Bilim Kurgu / Distopya", 
    description: "Stephen King'in Richard Bachman mahlasıyla kaleme aldığı kült distopik eseri.",
    image_url: "https://covers.openlibrary.org/b/isbn/9789752128262-L.jpg"
  },
  "9786256843639": { 
    name: "Görünmeyen Kadınlar", 
    author: "Dr. Gülseren Budayıcıoğlu", 
    publisher: "Doğan Kitap", 
    category: "Edebiyat / Psikoloji", 
    description: "Dr. Gülseren Budayıcıoğlu'nun kaleminden kadınların görünmez kılınan hayatlarına ve mücadelelerine ışık tutan sarsıcı bir başyapıt.",
    image_url: "https://covers.openlibrary.org/b/isbn/9786256843639-L.jpg"
  },
  "9789750802967": { 
    name: "Kürk Mantolu Madonna", 
    author: "Sabahattin Ali", 
    publisher: "Yapı Kredi Yayınları", 
    category: "Edebiyat / Roman", 
    description: "Sabahattin Ali'nin aşk, yalnızlık ve yabancılaşma temalarını işleyen unutulmaz eseri.",
    image_url: "https://covers.openlibrary.org/b/isbn/9789750802967-L.jpg"
  },
  "9789750738609": { 
    name: "Şeker Portakalı", 
    author: "Jose Mauro de Vasconcelos", 
    publisher: "Can Yayınları", 
    category: "Edebiyat / Roman", 
    description: "Bireyin iç dünyasındaki çatışmaları ve toplumsal baskıları gözler önüne seren başyapıt.",
    image_url: "https://covers.openlibrary.org/b/isbn/9789750738609-L.jpg"
  }
};

/**
 * Direct scraper for Işık Kitabevi (isikkitabevi.net)
 */
async function scrapeIsikKitabevi(query: string): Promise<BookMarketPriceSource[]> {
  if (!query || query.trim().length < 2) return [];
  try {
    const url = `https://isikkitabevi.net/arama.php?anaarama=${encodeURIComponent(query.trim())}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
      },
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) return [];

    const html = await res.text();
    const blocks = [...html.matchAll(/<div class='kitap'>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi)];
    const results: BookMarketPriceSource[] = [];

    for (const b of blocks) {
      const bHtml = b[1];
      const titleMatch = bHtml.match(/<h1>([^<]+)<\/h1>/i);
      const yazarMatch = bHtml.match(/<div class="yazar">([\s\S]*?)<\/div>/i);
      const yayineviMatch = bHtml.match(/<div class="yayinevi">([\s\S]*?)<\/div>/i);
      const fiyatMatch = bHtml.match(/<div class="fiyat">([\s\S]*?)<\/div>/i);
      const linkMatch = bHtml.match(/href=["'](\.\/kitap\/store\.php\?id=\d+)["']/i);

      if (titleMatch && fiyatMatch) {
        const name = titleMatch[1].trim();
        const author = yazarMatch ? yazarMatch[1].replace(/<[^>]+>/g, "").trim() : "";
        const pubAndCat = yayineviMatch ? yayineviMatch[1].replace(/<[^>]+>/g, "").trim() : "";
        const priceRaw = fiyatMatch[1].replace(/<[^>]+>/g, "").trim();
        const priceNum = parseFloat(priceRaw.replace(/[^\d\.,]/g, "").replace(",", ".")) || 0;
        const directLink = linkMatch ? "https://isikkitabevi.net" + linkMatch[1].replace("./", "/") : url;

        let pub = "";
        if (pubAndCat.includes("/")) {
          pub = pubAndCat.split("/").slice(1).join("/").trim();
        } else {
          pub = pubAndCat;
        }

        if (name && priceNum > 0) {
          results.push({
            source_name: `Işık Kitabevi`,
            title: name,
            publisher: pub,
            price: priceNum,
            price_formatted: `${priceNum.toFixed(2)} TL`,
            url: directLink
          });
        }
      }
    }
    return results;
  } catch (err) {
    return [];
  }
}

/**
 * OpenLibrary Book Data Fetcher
 */
async function fetchOpenLibraryBook(isbn: string): Promise<Partial<BookLookupResult> | null> {
  try {
    const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`, {
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    const obj = data[`ISBN:${isbn}`];
    if (obj && obj.title) {
      const author = obj.authors ? obj.authors.map((a: any) => a.name).join(", ") : "";
      const publisher = obj.publishers ? obj.publishers.map((p: any) => p.name).join(", ") : "";
      const { category: cat, subCategory: subCat } = splitAndCleanCategory(obj.subjects ? obj.subjects[0]?.name : "Edebiyat / Roman");
      return {
        name: obj.title,
        author,
        publisher,
        brand: publisher,
        category: cat,
        sub_category: subCat,
        description: `${obj.title} - ${author ? author + " eseridir. " : ""}${publisher ? publisher + " baskısı." : ""}`,
        image_url: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`,
        source: "OpenLibrary API"
      };
    }
  } catch (e) {
    // ignore
  }
  return null;
}

/**
 * Live Web Search & Price Miner for Turkish Book Portals
 */
async function scrapeLiveWebForBook(cleanBarcode: string): Promise<{
  bookData: Partial<BookLookupResult> | null;
  webPrices: BookMarketPriceSource[];
}> {
  const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";
  const headers = { 
    "User-Agent": userAgent,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8"
  };

  const queries = [`${cleanBarcode} kitap fiyatı`, `${cleanBarcode} isbn`];
  let bookData: Partial<BookLookupResult> | null = null;
  const webPrices: BookMarketPriceSource[] = [];

  for (const q of queries) {
    try {
      const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`, {
        headers,
        signal: AbortSignal.timeout(4000)
      });
      if (!res.ok) continue;

      const html = await res.text();
      const rawTitles = [...html.matchAll(/<a[^>]*class="[^"]*result__a[^"]*"[^>]*>([\s\S]*?)<\/a>/gi)].map(m => m[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#x27;/g, "\x27").trim());
      const rawSnippets = [...html.matchAll(/<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi)].map(m => m[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#x27;/g, "\x27").trim());

      let detectedName = "";
      let detectedAuthor = "";
      let detectedPublisher = "";
      let detectedDescription = "";

      for (let i = 0; i < rawTitles.length; i++) {
        const t = rawTitles[i];
        const s = rawSnippets[i] || "";

        if (t.includes("Google Books") || t.includes("Milyonlarca Kitap") || t.includes("Kitapla buluşmanın")) continue;

        // Extract metadata
        const authorMatch = s.match(/Yazar:\s*([^|,\n]+?)(?:\s+(?:Yayın\s*Evi|Yayınevi|Kapak|Çevirmen|İlk\s*Baskı|%|\d+TL|Stok|Barkod|\())/i) ||
                            s.match(/Yazar:\s*([^|,\n]+?)$/i);
        
        const pubMatch = s.match(/(?:Yayın\s*Evi|Yayınevi):\s*([^|,\n]+?)(?:\s+(?:%|\d+TL|İlk\s*Baskı|Dil|Barkod|Stok|Yazar|\())/i) ||
                         s.match(/(?:Yayın\s*Evi|Yayınevi):\s*([^|,\n]+?)$/i);

        if (authorMatch && !detectedAuthor) detectedAuthor = authorMatch[1].trim();
        if (pubMatch && !detectedPublisher) detectedPublisher = pubMatch[1].trim();

        if (!detectedName) {
          let clean = t
            .replace(/\|.*$/g, "")
            .replace(/- Kitapsec.*$/g, "")
            .replace(/- Kitapyurdu.*$/g, "")
            .replace(/- Bkmkitap.*$/g, "")
            .replace(/- Fiyat.*$/g, "")
            .replace(/- D&R.*$/g, "")
            .replace(/- İdefix.*$/g, "")
            .replace(/Fiyatları.*/gi, "")
            .replace(/Satın Al.*/gi, "")
            .replace(/978\d{10}/g, "")
            .trim();
          
          if (clean && clean.length > 2) {
            detectedName = clean;
          }
        }

        if (!detectedDescription && s.length > 25 && !s.includes("Browse new releases")) {
          detectedDescription = s;
        }

        // Extract prices found in snippet/title
        const textToScan = `${t} ${s}`;
        const priceMatches = [...textToScan.matchAll(/(\d{1,4}(?:[\.,]\d{2})?)\s*(?:TL|₺)/gi)];
        for (const pm of priceMatches) {
          const val = parseFloat(pm[1].replace(",", "."));
          if (val >= 10 && val <= 5000) {
            let srcName = "Piyasa Satıcısı";
            if (t.includes("Kitapyurdu") || s.includes("Kitapyurdu")) srcName = "Kitapyurdu";
            else if (t.includes("Bkmkitap") || s.includes("Bkmkitap")) srcName = "BKM Kitap";
            else if (t.includes("D&R") || s.includes("D&R")) srcName = "D&R";
            else if (t.includes("İdefix") || s.includes("İdefix")) srcName = "İdefix";
            else if (t.includes("Nadirkitap") || s.includes("Nadirkitap")) srcName = "Nadir Kitap";
            else if (t.includes("Trendyol")) srcName = "Trendyol";
            else if (t.includes("Hepsiburada")) srcName = "Hepsiburada";

            webPrices.push({
              source_name: srcName,
              title: detectedName || cleanBarcode,
              price: val,
              price_formatted: `${val.toFixed(2)} TL`,
              url: `https://www.google.com/search?q=${encodeURIComponent(cleanBarcode + ' ' + (detectedName || 'kitap'))}`
            });
          }
        }
      }

      if (detectedName && !bookData) {
        const { category: cat, subCategory: subCat } = splitAndCleanCategory("Edebiyat / Roman");
        bookData = {
          name: detectedName,
          author: detectedAuthor || "",
          publisher: detectedPublisher || "",
          brand: detectedPublisher || "",
          category: cat,
          sub_category: subCat,
          description: detectedDescription || `${detectedName} - ${detectedAuthor ? detectedAuthor + " eseri." : ""}`,
          image_url: `https://covers.openlibrary.org/b/isbn/${cleanBarcode}-L.jpg`,
          source: "Live Web Data Miner"
        };
      }
    } catch (err) {
      // try next query
    }
  }

  return { bookData, webPrices };
}

// Optional Gemini Refiner (if valid Gemini API key present)
async function tryGeminiLookup(cleanBarcode: string): Promise<Partial<BookLookupResult> | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey || apiKey.length < 20 || apiKey.startsWith("ya29.")) return null;

  try {
    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Lütfen "${cleanBarcode}" nolu ISBN numarasına sahip kitabın Türkiye'deki adını, yazarını, yayınevini, tür/kategorisini ve arka kapak özetini bul.
      Yanıtı SADECE geçerli bir JSON olarak ver:
      {
        "found": true,
        "name": "Kitap Adı",
        "author": "Yazar",
        "publisher": "Yayınevi",
        "category": "Edebiyat / Roman",
        "description": "Özet metni"
      }
      Kitap bulunamazsa: { "found": false }`
    });

    const text = response.text || "";
    const match = text.match(/\{[\s\S]*?\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (parsed.found && parsed.name) {
        const { category: cat, subCategory: subCat } = splitAndCleanCategory(parsed.category || "Edebiyat / Roman");
        return {
          name: parsed.name,
          author: parsed.author || "",
          publisher: parsed.publisher || "",
          brand: parsed.publisher || "",
          category: cat,
          sub_category: subCat,
          description: parsed.description || "",
          image_url: `https://covers.openlibrary.org/b/isbn/${cleanBarcode}-L.jpg`,
          source: "Gemini AI"
        };
      }
    }
  } catch (err) {
    // Ignore invalid key errors silently
  }
  return null;
}

export async function getVerifiedBookCover(isbn: string, title: string, author?: string, publisher?: string, category?: string): Promise<string> {
  const cleanIsbn = String(isbn || "").replace(/\D/g, "");
  if (cleanIsbn.length >= 9) {
    try {
      const olUrl = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`;
      const head = await fetch(olUrl, { method: "HEAD", signal: AbortSignal.timeout(1500) });
      const len = Number(head.headers.get("content-length") || 0);
      if (head.ok && len > 1500) {
        return olUrl;
      }
    } catch (e) {
      // ignore timeout
    }
  }
  return generateHighResBookCoverSvg(title, author, publisher, category);
}

/**
 * Master Book & Multi-Source Market Price Discovery Pipeline:
 * 1. Resolves Book Metadata (Offline Catalog -> OpenLibrary -> Web Miner -> Gemini AI)
 * 2. Scrapes Işık Kitabevi (isikkitabevi.net) by ISBN & Title for live prices & direct links
 * 3. Scrapes Kitapyurdu, BKM, D&R, İdefix price points
 * 4. Aggregates & computes market stats (min, avg, max, list_price, suggested)
 */
export async function masterBookLookup(barcode: string): Promise<BookLookupResult | null> {
  const cleanBarcode = String(barcode || "").replace(/\D/g, "");
  if (!cleanBarcode || cleanBarcode.length < 9) return null;

  let bookInfo: Partial<BookLookupResult> | null = null;
  let sourceTag = "Catalog";

  // 1. Check Offline Catalog
  if (OFFLINE_CATALOG[cleanBarcode]) {
    const item = OFFLINE_CATALOG[cleanBarcode];
    const { category: cat, subCategory: subCat } = splitAndCleanCategory(item.category);
    bookInfo = {
      name: item.name,
      author: item.author || "",
      brand: item.publisher || "",
      publisher: item.publisher || "",
      category: cat,
      sub_category: subCat,
      description: item.description || "",
      image_url: item.image_url,
      source: "Offline Catalog"
    };
  }

  // 2. Try OpenLibrary API
  if (!bookInfo) {
    const olInfo = await fetchOpenLibraryBook(cleanBarcode);
    if (olInfo && olInfo.name) {
      bookInfo = olInfo;
      sourceTag = "OpenLibrary API";
    }
  }

  // 3. Try Web Data Miner
  const { bookData: webInfo, webPrices } = await scrapeLiveWebForBook(cleanBarcode);
  if (!bookInfo && webInfo && webInfo.name) {
    bookInfo = webInfo;
    sourceTag = "Live Web Miner";
  }

  // 4. Try Gemini AI fallback
  if (!bookInfo) {
    const geminiInfo = await tryGeminiLookup(cleanBarcode);
    if (geminiInfo && geminiInfo.name) {
      bookInfo = geminiInfo;
      sourceTag = "Gemini AI";
    }
  }

  // If still no book name, return null
  if (!bookInfo || !bookInfo.name) return null;

  // --- MARKET PRICE DISCOVERY ENGINE ---
  const allPriceSources: BookMarketPriceSource[] = [];
  const seenKeys = new Set<string>();

  // A. Scrape Işık Kitabevi by ISBN first
  let isikResults = await scrapeIsikKitabevi(cleanBarcode);

  // B. If Işık Kitabevi returned no results by ISBN, search by Book Name + Publisher or Book Name
  if (isikResults.length === 0 && bookInfo.name) {
    const cleanTitle = bookInfo.name.replace(/\(.*?\)/g, "").trim();
    if (bookInfo.publisher) {
      const cleanPub = bookInfo.publisher.replace(/\(.*?\)/g, "").trim().split(" ")[0] || "";
      if (cleanPub && cleanPub.length >= 3) {
        isikResults = await scrapeIsikKitabevi(`${cleanTitle} ${cleanPub}`);
      }
    }
    if (isikResults.length === 0) {
      isikResults = await scrapeIsikKitabevi(cleanTitle);
    }
  }

  // Add Işık Kitabevi prices (prioritize exact publisher match if available)
  for (const ir of isikResults) {
    const key = `Işık Kitabevi:${ir.price}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      const isExact = Boolean(bookInfo.publisher && ir.publisher && ir.publisher.toLowerCase().includes(bookInfo.publisher.toLowerCase()));
      allPriceSources.push({
        source_name: `Işık Kitabevi (${ir.title})`,
        title: ir.title,
        publisher: ir.publisher,
        price: ir.price,
        price_formatted: ir.price_formatted,
        url: ir.url,
        is_exact_match: isExact
      });
    }
  }

  // C. Add Web Scraped prices (Kitapyurdu, BKM, D&R, İdefix...)
  for (const wp of webPrices) {
    const key = `${wp.source_name}:${wp.price}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      allPriceSources.push(wp);
    }
  }

  // Compute market statistics
  const priceValues = allPriceSources.map(s => s.price).filter(p => p > 0);
  let minPrice = 0;
  let avgPrice = 0;
  let maxPrice = 0;
  let listPrice = 0;
  let suggestedPrice = 0;

  if (priceValues.length > 0) {
    minPrice = Math.min(...priceValues);
    maxPrice = Math.max(...priceValues);
    avgPrice = Math.round((priceValues.reduce((a, b) => a + b, 0) / priceValues.length) * 100) / 100;
    listPrice = Math.round(maxPrice * 1.15 * 100) / 100;
    
    // Suggested price logic: if we have exact publisher match from Işık or sources, use that price or average
    const exactMatches = allPriceSources.filter(s => s.is_exact_match);
    if (exactMatches.length > 0) {
      suggestedPrice = exactMatches[0].price;
    } else {
      suggestedPrice = avgPrice;
    }
  }

  const coverUrl = await getVerifiedBookCover(cleanBarcode, bookInfo.name, bookInfo.author, bookInfo.publisher, bookInfo.category);

  return {
    barcode: cleanBarcode,
    name: bookInfo.name,
    author: bookInfo.author || "",
    brand: bookInfo.publisher || bookInfo.brand || "",
    publisher: bookInfo.publisher || bookInfo.brand || "",
    category: bookInfo.category || "Edebiyat",
    sub_category: bookInfo.sub_category || "Roman",
    description: bookInfo.description || "",
    image_url: coverUrl,
    source: bookInfo.source || sourceTag,
    market_prices: priceValues.length > 0 ? {
      min_price: minPrice,
      avg_price: avgPrice,
      max_price: maxPrice,
      list_price: listPrice,
      suggested_price: suggestedPrice,
      sources: allPriceSources
    } : undefined
  };
}
