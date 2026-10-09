import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function generateHighResBookCoverSvg(title, author, publisher, category) {
  const safeTitle = (title || "Eser Adı").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeAuthor = (author || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safePublisher = (publisher || "D&G BOOKS").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeCat = (category || "EDEBİYAT").toUpperCase();

  const palettes = [
    { bg1: "#1e1b4b", bg2: "#0f172a", gold: "#f59e0b", accent: "#818cf8", light: "#e0e7ff" },
    { bg1: "#450a0a", bg2: "#1c0404", gold: "#fbbf24", accent: "#f87171", light: "#fee2e2" },
    { bg1: "#064e3b", bg2: "#022c22", gold: "#34d399", accent: "#6ee7b7", light: "#d1fae5" },
    { bg1: "#3b0764", bg2: "#1e0533", gold: "#fbbf24", accent: "#c084fc", light: "#f3e8ff" },
    { bg1: "#1c1917", bg2: "#0c0a09", gold: "#d97706", accent: "#a8a29e", light: "#f5f5f4" },
    { bg1: "#701a75", bg2: "#3b073a", gold: "#f472b6", accent: "#e879f9", light: "#fdf4ff" },
    { bg1: "#1e293b", bg2: "#0f172a", gold: "#38bdf8", accent: "#94a3b8", light: "#f1f5f9" }
  ];
  const hash = Math.abs((safeTitle + safeAuthor).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0));
  const pal = palettes[hash % palettes.length];

  const words = safeTitle.split(" ");
  let lines = [];
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

const KNOWN_AUTHORS = {
  "dostoyevski": { author: "Fyodor Dostoyevski", cat: "Edebiyat", subcat: "Dünya Klasikleri / Rus Edebiyatı", pub: "İş Bankası Kültür Yayınları" },
  "tolstoy": { author: "Lev Tolstoy", cat: "Edebiyat", subcat: "Dünya Klasikleri / Rus Edebiyatı", pub: "İş Bankası Kültür Yayınları" },
  "çehov": { author: "Anton Çehov", cat: "Edebiyat", subcat: "Dünya Klasikleri / Kısa Öykü", pub: "Can Yayınları" },
  "goethe": { author: "Johann Wolfgang von Goethe", cat: "Edebiyat", subcat: "Dünya Klasikleri / Alman Edebiyatı", pub: "İş Bankası Kültür Yayınları" },
  "kafka": { author: "Franz Kafka", cat: "Edebiyat", subcat: "Dünya Klasikleri / Modern Klasikler", pub: "Can Yayınları" },
  "zweig": { author: "Stefan Zweig", cat: "Edebiyat", subcat: "Modern Klasikler / Novella", pub: "İş Bankası Kültür Yayınları" },
  "steinbeck": { author: "John Steinbeck", cat: "Edebiyat", subcat: "Dünya Klasikleri / Amerikan Edebiyatı", pub: "Sel Yayıncılık" },
  "orwell": { author: "George Orwell", cat: "Edebiyat", subcat: "Distopya / Politik Kurgu", pub: "Can Yayınları" },
  "camus": { author: "Albert Camus", cat: "Edebiyat", subcat: "Varoluşçu Edebiyat / Roman", pub: "Can Yayınları" },
  "victor hugo": { author: "Victor Hugo", cat: "Edebiyat", subcat: "Dünya Klasikleri / Fransız Edebiyatı", pub: "İş Bankası Kültür Yayınları" },
  "balzac": { author: "Honoré de Balzac", cat: "Edebiyat", subcat: "Dünya Klasikleri / Fransız Edebiyatı", pub: "Can Yayınları" },
  "dickens": { author: "Charles Dickens", cat: "Edebiyat", subcat: "Dünya Klasikleri / İngiliz Edebiyatı", pub: "İş Bankası Kültür Yayınları" },
  "jane austen": { author: "Jane Austen", cat: "Edebiyat", subcat: "Dünya Klasikleri / Romantik Dönem", pub: "İş Bankası Kültür Yayınları" },
  "pessoa": { author: "Fernando Pessoa", cat: "Edebiyat", subcat: "Dünya Edebiyatı / Felsefi Deneme", pub: "Kırmızı Kedi Yayınevi" },
  "saramago": { author: "José Saramago", cat: "Edebiyat", subcat: "Dünya Edebiyatı / Çağdaş Roman", pub: "Kırmızı Kedi Yayınevi" },
  "marquez": { author: "Gabriel García Márquez", cat: "Edebiyat", subcat: "Büyülü Gerçekçilik / Roman", pub: "Can Yayınları" },
  "paul auster": { author: "Paul Auster", cat: "Edebiyat", subcat: "Çağdaş Dünya Romanı", pub: "Can Yayınları" },
  "virginia woolf": { author: "Virginia Woolf", cat: "Edebiyat", subcat: "Modern Klasikler / Bilinç Akışı", pub: "İletişim Yayınları" },
  "hesse": { author: "Hermann Hesse", cat: "Edebiyat", subcat: "Modern Klasikler / Doğu Felsefesi", pub: "Yapı Kredi Yayınları" },
  "jack london": { author: "Jack London", cat: "Edebiyat", subcat: "Macera & Doğa / Klasikler", pub: "İş Bankası Kültür Yayınları" },
  "murakami": { author: "Haruki Murakami", cat: "Edebiyat", subcat: "Çağdaş Japon Edebiyatı / Roman", pub: "Doğan Kitap" },
  "sabahattin ali": { author: "Sabahattin Ali", cat: "Edebiyat", subcat: "Türk Edebiyatı / Klasik Roman & Hikaye", pub: "Yapı Kredi Yayınları" },
  "ahmet hamdi tanpınar": { author: "Ahmet Hamdi Tanpınar", cat: "Edebiyat", subcat: "Türk Edebiyatı / Modern Klasik", pub: "Dergâh Yayınları" },
  "yaşar kemal": { author: "Yaşar Kemal", cat: "Edebiyat", subcat: "Türk Edebiyatı / Destansı Roman", pub: "Yapı Kredi Yayınları" },
  "orhan pamuk": { author: "Orhan Pamuk", cat: "Edebiyat", subcat: "Türk Edebiyatı / Postmodern Roman", pub: "Yapı Kredi Yayınları" },
  "reşat nuri": { author: "Reşat Nuri Güntekin", cat: "Edebiyat", subcat: "Türk Edebiyatı / Sosyal Roman", pub: "İnkılap Kitabevi" },
  "peyami safa": { author: "Peyami Safa", cat: "Edebiyat", subcat: "Türk Edebiyatı / Psikolojik Roman", pub: "Ötüken Neşriyat" },
  "mustafa kutlu": { author: "Mustafa Kutlu", cat: "Edebiyat", subcat: "Türk Edebiyatı / Hikaye & Deneme", pub: "Dergâh Yayınları" },
  "zülfü livaneli": { author: "Zülfü Livaneli", cat: "Edebiyat", subcat: "Türk Edebiyatı / Çağdaş Roman", pub: "İnkılap Kitabevi" },
  "ayşe kulin": { author: "Ayşe Kulin", cat: "Edebiyat", subcat: "Türk Edebiyatı / Biyografik & Tarihi Roman", pub: "Everest Yayınları" },
  "canan tan": { author: "Canan Tan", cat: "Edebiyat", subcat: "Türk Edebiyatı / Aşk & Sosyal Roman", pub: "Doğan Kitap" },
  "ahmet ümit": { author: "Ahmet Ümit", cat: "Edebiyat", subcat: "Polisiye & Gerilim / Türk Edebiyatı", pub: "Yapı Kredi Yayınları" },
  "iskender pala": { author: "İskender Pala", cat: "Edebiyat", subcat: "Tarihi Roman / Tasavvuf", pub: "Kapı Yayınları" },
  "oğuz atay": { author: "Oğuz Atay", cat: "Edebiyat", subcat: "Türk Edebiyatı / Postmodern Klasik", pub: "İletişim Yayınları" },
  "kemal tahir": { author: "Kemal Tahir", cat: "Edebiyat", subcat: "Türk Edebiyatı / Tarihi & Toplumcu Roman", pub: "İthaki Yayınları" },
  "beyza alkoç": { author: "Beyza Alkoç", cat: "Edebiyat", subcat: "Genç Yetişkin / Romantik Kurgu", pub: "İndigo Kitap" },
  "zeynep sey": { author: "Zeynep Sey", cat: "Çocuk & Gençlik", subcat: "Genç Yetişkin / Gençlik Romanı", pub: "Ephesus Yayınları" },
  "gülten dayıoğlu": { author: "Gülten Dayıoğlu", cat: "Çocuk & Gençlik", subcat: "Çocuk & İlkgençlik Edebiyatı", pub: "Altın Kitaplar" },
  "sarah jio": { author: "Sarah Jio", cat: "Edebiyat", subcat: "Romantik & Duygusal Roman", pub: "Pena Yayınları" },
  "agatha christie": { author: "Agatha Christie", cat: "Edebiyat", subcat: "Polisiye & Gizem / Dünya Klasikleri", pub: "Altın Kitaplar" },
  "arthur conan doyle": { author: "Sir Arthur Conan Doyle", cat: "Edebiyat", subcat: "Polisiye & Dedektiflik / Sherlock Holmes", pub: "İş Bankası Kültür Yayınları" },
  "dan brown": { author: "Dan Brown", cat: "Edebiyat", subcat: "Gerilim & Komplo Teorisi", pub: "Altın Kitaplar" },
  "varol yaşaroğlu": { author: "Varol Yaşaroğlu", cat: "Çocuk & Gençlik", subcat: "Çizgi Roman & Mizah / Kral Şakir", pub: "Eksik Parça Çocuk" },
  "john flanagan": { author: "John Flanagan", cat: "Çocuk & Gençlik", subcat: "Fantastik Macera / Gölgelerin Efendisi", pub: "Beyaz Balina Yayınları" },
  "carlo collodi": { author: "Carlo Collodi", cat: "Çocuk & Gençlik", subcat: "Dünya Çocuk Klasikleri / Masal", pub: "Can Çocuk Yayınları" },
  "antoine de saint-exupery": { author: "Antoine de Saint-Exupéry", cat: "Edebiyat", subcat: "Modern Masal / Felsefi Öykü", pub: "Can Çocuk Yayınları" },
  "jules verne": { author: "Jules Verne", cat: "Çocuk & Gençlik", subcat: "Klasik Bilimkurgu & Macera", pub: "İş Bankası Kültür Yayınları" },
  "meltem erinçmen": { author: "Meltem Erinçmen Kano", cat: "Çocuk & Gençlik", subcat: "Çocuk Eğitici Hikaye & Masal", pub: "Çikolata Yayınevi" },
  "doğan cüceloğlu": { author: "Doğan Cüceloğlu", cat: "Kişisel Gelişim & Psikoloji", subcat: "Gelişim Psikolojisi & İletişim", pub: "Kronik Kitap" },
  "gülseren budayıcıoğlu": { author: "Gülseren Budayıcıoğlu", cat: "Kişisel Gelişim & Psikoloji", subcat: "Psikoterapi Hikayeleri & İnsan Ruhu", pub: "Doğan Kitap" },
  "üstün dökmen": { author: "Üstün Dökmen", cat: "Kişisel Gelişim & Psikoloji", subcat: "İletişim & Yaşam Becerileri", pub: "Remzi Kitabevi" },
  "sigmund freud": { author: "Sigmund Freud", cat: "Kişisel Gelişim & Psikoloji", subcat: "Psikanaliz & Psikoloji Klasikleri", pub: "Say Yayınları" },
  "carl gustav jung": { author: "Carl Gustav Jung", cat: "Kişisel Gelişim & Psikoloji", subcat: "Analitik Psikoloji & Arketipler", pub: "Say Yayınları" },
  "oğuz saygın": { author: "Oğuz Saygın", cat: "Kişisel Gelişim & Psikoloji", subcat: "Zihinsel Gelişim & NLP", pub: "Hayat Yayınları" },
  "ilber ortaylı": { author: "İlber Ortaylı", cat: "Tarih & Araştırma", subcat: "Osmanlı & Türkiye Tarihi / Biyografi", pub: "Kronik Kitap" },
  "halil inalcık": { author: "Halil İnalcık", cat: "Tarih & Araştırma", subcat: "Osmanlı Tarihi & Sosyoloji", pub: "Kronik Kitap" },
  "stephen hawking": { author: "Stephen Hawking", cat: "Bilim & Popüler Bilim", subcat: "Teorik Fizik & Evrenbilim", pub: "Alfa Yayınları" },
  "carl sagan": { author: "Carl Sagan", cat: "Bilim & Popüler Bilim", subcat: "Astronomi & Evren / Kozmos", pub: "Say Yayınları" },
  "richard holloway": { author: "Richard Holloway", cat: "Tarih & Araştırma", subcat: "Dinler Tarihi & Felsefe", pub: "Alfa Yayınları" },
  "david a. weintraub": { author: "David A. Weintraub", cat: "Bilim & Popüler Bilim", subcat: "Astrofizik & Kozmoloji", pub: "Alfa Yayınları" },
  "friedrich nietzsche": { author: "Friedrich Nietzsche", cat: "Felsefe & Düşünce", subcat: "Felsefe Klasikleri / Batı Felsefesi", pub: "İş Bankası Kültür Yayınları" },
  "platon": { author: "Platon (Eflatun)", cat: "Felsefe & Düşünce", subcat: "Antik Yunan Felsefesi / Diyaloglar", pub: "İş Bankası Kültür Yayınları" },
  "marcus aurelius": { author: "Marcus Aurelius", cat: "Felsefe & Düşünce", subcat: "Stoacı Felsefe / Kendime Düşünceler", pub: "İş Bankası Kültür Yayınları" }
};

function classifyByTitle(title = "") {
  const t = title.toLowerCase();

  if (t.includes("kral şakir") || t.includes("saftirik") || t.includes("çizgi roman") || t.includes("manga") || t.includes("marvel") || t.includes("çizgi")) {
    return { cat: "Çocuk & Gençlik", subcat: "Çizgi Roman & Mizah" };
  }
  if (t.includes("hikaye") || t.includes("hikâye") || t.includes("masal") || t.includes("çocuk") || t.includes("minik") || t.includes("koca ayak") || t.includes("kahramanlar") || t.includes("pinokyo") || t.includes("pamuk prenses") || t.includes("keloğlan") || t.includes("nasreddin hoca")) {
    return { cat: "Çocuk & Gençlik", subcat: "Masal & Hikaye" };
  }
  if (t.includes("sözlük") || t.includes("redhouse") || t.includes("dictionary") || t.includes("gramer") || t.includes("ingilizce") || t.includes("almanca") || t.includes("fransızca") || t.includes("arapça")) {
    return { cat: "Eğitim & Başvuru", subcat: "Sözlük & Yabancı Dil" };
  }
  if (t.includes("psikoloji") || t.includes("özgüven") || t.includes("beyin") || t.includes("başarı") || t.includes("motivasyon") || t.includes("zihin") || t.includes("bilinçaltı") || t.includes("insan ilişkileri") || t.includes("mutluluk")) {
    return { cat: "Kişisel Gelişim & Psikoloji", subcat: "Popüler Psikoloji & Gelişim" };
  }
  if (t.includes("felsefe") || t.includes("düşünce") || t.includes("etik") || t.includes("mantık") || t.includes("varoluş")) {
    return { cat: "Felsefe & Düşünce", subcat: "Felsefe İncelemeleri" };
  }
  if (t.includes("tarih") || t.includes("osmanlı") || t.includes("cumhuriyet") || t.includes("savaş") || t.includes("imparatorluk") || t.includes("padişah") || t.includes("atatürk")) {
    return { cat: "Tarih & Araştırma", subcat: "Türk & Dünya Tarihi" };
  }
  if (t.includes("fizik") || t.includes("kimya") || t.includes("biyoloji") || t.includes("evren") || t.includes("kuantum") || t.includes("astrofizik") || t.includes("kozmoloji") || t.includes("bilim")) {
    return { cat: "Bilim & Popüler Bilim", subcat: "Evren & Doğa Bilimleri" };
  }
  if (t.includes("hukuk") || t.includes("medeni") || t.includes("ceza") || t.includes("anayasa") || t.includes("mevzuat") || t.includes("kanun")) {
    return { cat: "Akademik & Hukuk", subcat: "Hukuk & Mevzuat" };
  }
  if (t.includes("şiir") || t.includes("divan") || t.includes("koşma") || t.includes("gazel") || t.includes("rubai")) {
    return { cat: "Edebiyat", subcat: "Şiir & Antoloji" };
  }
  if (t.includes("polisiye") || t.includes("cinayet") || t.includes("dedektif") || t.includes("şüphe") || t.includes("katil") || t.includes("soruşturma")) {
    return { cat: "Edebiyat", subcat: "Polisiye & Gerilim" };
  }

  return { cat: "Edebiyat", subcat: "Roman & Edebi Eserler" };
}

function generateRichBackCoverSynopsis(title, author, publisher, cat, subcat) {
  const safeTitle = title || "Bu seçkin eser";
  const safeAuthor = author ? `${author}` : "Usta Kalem";
  const safeCat = cat || "Edebiyat";
  const safeSubCat = subcat || "Roman";
  const tNorm = safeTitle.toLowerCase().replace(/['"’]/g, "");

  if (tNorm.includes("werther")) {
    return "Dünya edebiyatının dönüm noktalarından biri kabul edilen bu ölümsüz mektup roman, genç bir ressamın karşılıksız ve tutkulu aşkı uğruna ruhunda kopan fırtınaları eşsiz bir lirizmle aktarır. Goethe'nin henüz yirmi beş yaşındayken kaleme aldığı ve tüm Avrupa'da derin bir yankı uyandıran eser, romantizm akımının en çarpıcı ve duygu yüklü manifestosu niteliğindedir. İnsanın içsel çatışmalarını ve melankolisini ustalıkla işleyen başyapıt, her çağda okurun kalbine dokunmaya devam ediyor.";
  }
  if (tNorm.includes("zamanın kısa tarihi") || tNorm.includes("brief history of time")) {
    return "Modern astrofiziğin en büyük dehalarından Stephen Hawking'in kaleme aldığı bu çığır açıcı başyapıt, evrenin başlangıcından kara deliklerin gizemine kadar insanlığın en temel sorularına ışık tutuyor. Büyük Patlama'dan zamanın göreceli doğasına uzanan bu büyüleyici anlatı, karmaşık kuramsal fizik kavramlarını herkesin anlayabileceği duru ve akıcı bir üslupla sunuyor. Gökyüzüne her baktığınızda evrenin sırlarını yeniden keşfetmenizi sağlayacak benzersiz bir başvuru kaynağı.";
  }
  if (tNorm.includes("menekşeli mektup") || (author.toLowerCase().includes("mustafa kutlu") && tNorm.includes("menekşe"))) {
    return "Çağdaş Türk hikâyeciliğinin özgün ustası Mustafa Kutlu, geleneksel ile modern hayatın kavşağında savrulan insanımızın iç dünyasını sıcacık, samimi ve derinlikli bir dille anlatıyor. İnce bir hüzünle yoğrulmuş olan Menekşeli Mektup, unutulmaya yüz tutmuş değerleri, saf sevgileri ve Anadolu insanının vakarını zarif bir edebi nakış gibi satırlara döküyor. Kutlu'nun akıcı ve musiki dolu dili, okuru ilk cümleden itibaren büyülü bir duygu iklimine davet ediyor.";
  }
  if (tNorm.includes("dinin kısa tarihi") || tNorm.includes("dinler tarihi")) {
    return "İnançların, kadim ritüellerin ve insanlığın kutsal olanı anlama arayışının büyüleyici yolculuğu... Richard Holloway, ilk çağ mağara resimlerinden günümüzün modern inanç sistemlerine kadar dinler tarihini açık, objektif, tarafsız ve son derece sürükleyici bir bakış açısıyla mercek altına alıyor. Hem tarihin dönüm noktalarını aydınlatan hem de felsefi sorgulamalara kapı aralayan bu eser, inanç olgusunu kavramak isteyen her entelektüel okur için vazgeçilmez bir kılavuz.";
  }
  if (tNorm.includes("evren kaç yaşında")) {
    return "Gökyüzüne baktığımızda yalnızca yıldızları değil, zamanın başlangıcına uzanan milyarlarca yıllık bir geçmişi izliyoruz. David A. Weintraub, antik gökbilimcilerin ilk hesaplamalarından uzay teleskoplarının en güncel verilerine kadar evrenin yaşını bulma serüvenini nefes kesici bir dille anlatıyor. Bilimsel merakın sınırlarını zorlayan bu sürükleyici çalışma, kozmolojinin en büyük bilmecelerinden birine ışık tutuyor.";
  }
  if (tNorm.includes("kral şakir")) {
    return "Varol Yaşaroğlu'nun imzasını taşıyan fenomen seri Kral Şakir, çocukları ve gençleri kahkaha dolu, sınır tanımaz bir maceraya davet ediyor! Şakir, Necati Ağabey, Remzi ve Canan ile birlikte mahallenin ve dünyanın en eğlenceli olaylarının tam ortasına dalmaya hazır olun. Eğlenceli çizimleri, zeki mizahı ve dostluk vurgusuyla çocukların kitap okuma sevgisini zirveye taşıyan muazzam bir çizgi serüven.";
  }
  if (tNorm.includes("pinokyo")) {
    return "Carlo Collodi'nin dünya çocuk edebiyatına armağan ettiği ölümsüz masal, tahta bir kuklanın gerçek bir çocuğa dönüşme yolculuğundaki hatalarını, vicdan muhasebesini ve sevginin iyileştirici gücünü anlatır. Her yaştan okurun kalbinde silinmez izler bırakan bu büyüleyici macera; dürüstlük, cesaret ve erdem kavramlarını sıcacık ve unutulmaz bir anlatımla taçlandırıyor.";
  }
  if (tNorm.includes("kürk mantolu madonna")) {
    return "Sabahattin Ali'nin Türk ve dünya edebiyatına damgasını vuran ölümsüz eseri; yalnızlığın, derin bir aşkın ve ruhsal yabancılaşmanın en çarpıcı anlatımıdır. Raif Efendi ile Maria Puder arasındaki sarsıcı bağ üzerinden insanın iç dünyasındaki en mahrem kıvrımları keşfe çıkan roman, edebiyatımızın en duyarlı ve sarsıcı aşk hikayelerinden birini sunuyor.";
  }
  if (tNorm.includes("piraye")) {
    return "Canan Tan'ın geniş okur kitlelerini derinden etkileyen unutulmaz romanı Piraye; Diyarbakır'ın köklü gelenekleri ile modern bir genç kadının özgürlük ve aşk mücadelesini bir araya getiriyor. Aşkın, fedakarlığın, toplumsal baskıların ve kadın kimliğinin çarpıcı bir içtenlikle ele alındığı bu sürükleyici eser, Türk edebiyatının en çok okunan çağdaş romanları arasında yer alıyor.";
  }

  if (safeCat === "Çocuk & Gençlik") {
    return `${safeAuthor} imzasını taşıyan "${safeTitle}", genç okurların hayal gücünü harekete geçiren, dostluk ve macera dolu sıcacık bir anlatı sunuyor. Eğlenceli olay örgüsü ve zengin karakter dünyasıyla çocukların merak duygusunu pekiştirirken, okuma alışkanlığını keyifli bir serüvene dönüştürüyor. Her sayfasında yeni bir keşif ve pozitif yaşam değerleri barındıran bu eser, kütüphanelerin vazgeçilmez parçası olmaya aday.`;
  }

  if (safeCat === "Kişisel Gelişim & Psikoloji") {
    return `İnsan psikolojisinin derinliklerine, zihinsel potansiyele ve kişisel farkındalığa ışık tutan "${safeTitle}", günlük hayatın getirdiği zorluklarla başa çıkma ve içsel huzuru inşa etme yollarını berrak bir dille sunuyor. ${safeAuthor} tarafından geliştirilen pratik ilkeler ve vaka analizleriyle zenginleşen bu çalışma, kendinizi ve çevrenizdeki ilişkileri daha iyi anlamanız için güçlü bir rehber niteliğindedir.`;
  }

  if (safeCat === "Tarih & Araştırma" || safeCat === "Felsefe & Düşünce") {
    return `Tarihin dönüm noktalarını, felsefi açılımları ve insan düşüncesinin gelişim evrelerini titiz bir araştırmayla bir araya getiren "${safeTitle}", okura çok katmanlı bir entelektüel vizyon kazandırıyor. ${safeAuthor} yetkinliğiyle kaleme alınan bu kapsamlı inceleme, geçmişin birikimiyle geleceğin sorularına yanıt arayan tüm düşünce tutkunları için temel bir başvuru eseridir.`;
  }

  if (safeCat === "Bilim & Popüler Bilim") {
    return `Evrenin, doğanın ve teknolojinin işleyiş mekanizmalarını akıcı ve anlaşılır bir üslupla açıklayan "${safeTitle}", bilimin sınır tanımaz heyecanını sayfalarına taşıyor. ${safeAuthor} tarafından ele alınan güncel teoriler ve keşifler, okuru sorgulayan, gözlemleyen ve evrenin gizemlerini keşfetmeye odaklanan ilham verici bir yolculuğa çıkarıyor.`;
  }

  if (safeCat === "Eğitim & Başvuru" || safeCat === "Akademik & Hukuk") {
    return `Alanında uzmanlaşmak isteyenler, öğrenciler ve araştırmacılar için güvenilir, sistematik ve kapsamlı bir içerik sunan "${safeTitle}", teorik bilgileri anlaşılır ve pedagojik bir çerçevede aktarıyor. Zengin içeriği ve özenle hazırlanmış konu başlıklarıyla hem eğitim sürecinde hem de mesleki başvurularda vazgeçilmez bir kaynak niteliği taşımaktadır.`;
  }

  return `${safeAuthor} tarafından ustalıkla kurgulanan "${safeTitle}", insan ruhunun derinliklerine, toplumsal ilişkilere ve bireysel sorgulamalara ayna tutan zengin bir edebi yolculuk vadediyor. Akıcı dili, güçlü karakter tahlilleri ve sürükleyici kurgusuyla okuru ilk sayfalardan itibaren etkisi altına alan bu ${safeSubCat.toLowerCase()} çalışması, kütüphanenizin en değerli parçalarından biri olacak.`;
}

async function run() {
  const prods = await pool.query(`
    SELECT id, name, barcode, author, brand, category, sub_category, description, image_url
    FROM products
    WHERE store_id IN (1, 24)
    ORDER BY id ASC
  `);

  console.log(`Starting rapid enrichment for ${prods.rows.length} bookstore products...`);

  for (const p of prods.rows) {
    let finalName = (p.name || "").trim();
    let finalAuthor = (p.author || "").trim();
    let finalBrand = (p.brand || "").trim();
    let finalCat = (p.category || "").trim();
    let finalSubCat = (p.sub_category || "").trim();
    let finalDesc = (p.description || "").trim();

    // Check author dictionary
    const aKey = (finalAuthor + " " + finalName).toLowerCase();
    let match = null;
    for (const [k, v] of Object.entries(KNOWN_AUTHORS)) {
      if (aKey.includes(k)) {
        match = v;
        break;
      }
    }

    if (match) {
      if (!finalAuthor || finalAuthor.length < 3) finalAuthor = match.author;
      if (!finalBrand) finalBrand = match.pub;
      if (!finalCat || finalCat === "Edebiyat / Roman-Öykü") finalCat = match.cat;
      if (!finalSubCat) finalSubCat = match.subcat;
    }

    if (!finalCat || finalCat === "Edebiyat / Roman-Öykü") {
      const c = classifyByTitle(finalName);
      finalCat = c.cat;
      if (!finalSubCat) finalSubCat = c.subcat;
    }

    if (!finalSubCat) {
      finalSubCat = "Roman & Edebi Eserler";
    }

    if (!finalBrand) {
      finalBrand = "D&G Kitap";
    }

    if (!finalDesc || finalDesc.length < 40) {
      finalDesc = generateRichBackCoverSynopsis(finalName, finalAuthor, finalBrand, finalCat, finalSubCat);
    }

    // Refresh cover badge if SVG
    let finalImage = p.image_url;
    if (!finalImage || finalImage.startsWith("data:image/svg+xml")) {
      finalImage = generateHighResBookCoverSvg(finalName, finalAuthor, finalBrand, finalCat);
    }

    await pool.query(`
      UPDATE products
      SET 
        name = $1,
        author = $2,
        brand = $3,
        category = $4,
        sub_category = $5,
        description = $6,
        image_url = $7
      WHERE id = $8
    `, [finalName, finalAuthor, finalBrand, finalCat, finalSubCat, finalDesc, finalImage, p.id]);
  }

  console.log(`ALL ${prods.rows.length} BOOKS FULLY ENRICHED AND UPDATED!`);
  await pool.end();
}

run();
