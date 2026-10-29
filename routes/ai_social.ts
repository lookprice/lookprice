import express from "express";
import { GoogleGenAI } from "@google/genai";

const router = express.Router();

// Initialize Google GenAI with recommended telemetry header
const getGenAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
};

/**
 * Helper: Detect Product Segment & Build Tailored Usage Scenarios
 */
export function buildSegmentScenarios(title: string = "", category: string = "", brand: string = "") {
  const titleLower = String(title || "").toLowerCase();
  const combined = `${title} ${category} ${brand}`.toLowerCase();

  // 0. PİKNİK, TERMAL ÇANTA, KAMP & OUTDOOR LIFESTYLE SEGMENTİ
  if (
    titleLower.includes("piknik") ||
    titleLower.includes("termo") ||
    titleLower.includes("termal") ||
    titleLower.includes("soğutucu") ||
    titleLower.includes("kamp") ||
    titleLower.includes("termos") ||
    combined.includes("piknik")
  ) {
    return {
      segmentId: "outdoor_picnic_lifestyle",
      segmentLabel: "Doğa, Piknik & Termal Koruma Deneyimi",
      segmentIcon: "user",
      defaultSceneType: "user_lifestyle",
      scenarios: [
        {
          id: "outdoor_picnic_fresh",
          title: "Doğa & Piknik Taze Koruma",
          description: "Açık havada içecek ve yiyecekleri saatlerce taze tutan sahne.",
          sceneType: "user_lifestyle",
          kicker: "DOĞADA VE SEYAHATTE HEP TAZE",
          headline: "MAKSİMUM ISI YALITIMI",
          badge: "Termal İç Kaplama & Geniş Taşıma Hacmi",
          storyScenes: [
            { phase: "Doğa & Piknik Sahnesi", subtitle: "Açık havada ve seyahatte ideal ısı koruma", highlight: "Üstün Termal Yalıtım" },
            { phase: "Geniş İç Hacim", subtitle: "Yiyecek ve içecekler için ferah, sızdırmaz bölme", highlight: "Pratik & Ergonomik Taşıma" },
            { phase: "Çoklu Açı Vitrin", subtitle: "Alüminyum folyo iç yüzey ve dayanıklı dış kumaş", highlight: "Uzun Ömürlü Kalite" },
            { phase: "Özel Kampanya", subtitle: "Stoktan hızlı kargo avantajıyla", highlight: "Hemen Keşfet" }
          ],
          aiPrompt: `Bright commercial outdoor picnic and travel lifestyle photography featuring "${title}" on lush green grass with fresh fruits and cold beverages inside, warm natural sunlight, crisp focus on centered product, 8k.`
        },
        {
          id: "travel_beach_companion",
          title: "Plaj, Kamp & Yolculuk Senaryosu",
          description: "Tatil, plaj ve araç yolculuklarında pratik kullanım.",
          sceneType: "user_lifestyle",
          kicker: "HER YOLCULUKTA YANINDA",
          headline: "KONFORLU TAŞIMA DENEYİMİ",
          badge: "Katlanabilir Form & Kolay Temizlenen İç Yüzey",
          storyScenes: [
            { phase: "Seyahat & Kamp Konforu", subtitle: "Plajda, kampta ve araçta soğuk/sıcak koruma", highlight: "4 Mevsim Kullanım" },
            { phase: "Fonksiyonel Detaylar", subtitle: "Sağlam taşıma kulpları ve fermuarlı tam koruma", highlight: "Ergonomik Tasarım" },
            { phase: "Detay & İç Yüzey", subtitle: "Kaliteli yalıtım katmanı ve şık dış görünüm", highlight: "Orijinal Ürün" },
            { phase: "Avantajlı Fiyat", subtitle: "Güvenli ödeme ve hızlı teslimat", highlight: "Siparişi Tamamla" }
          ],
          aiPrompt: `Sunny summer travel and camping lifestyle shot of "${title}" carried effortlessly outdoors, natural bokeh background, commercial product photography.`
        },
        {
          id: "studio_macro_detail",
          title: "Stüdyo Çoklu Açı & Yalıtım Detayı",
          description: "İç termal doku ve dış kumaş kalitesini vurgulayan vitrin.",
          sceneType: "studio_macro",
          kicker: "ÜSTÜN MALZEME KALİTESİ",
          headline: "FONKSİYONEL TASARIM",
          badge: "Orijinal Ürün & Koşulsuz İade Garantisi",
          storyScenes: [
            { phase: "Merkez Odak Vitrin", subtitle: "Ürünün tam boy ve net stüdyo görünümü", highlight: "Kusursuz Form" },
            { phase: "Termal İç Yüzey", subtitle: "Isı koruyucu özel iç kaplama detayı", highlight: "Dayanıklı Yapı" },
            { phase: "Çoklu Açı Kolajı", subtitle: "Tüm detaylarıyla şeffaf ürün incelemesi", highlight: "Tam Uyum" },
            { phase: "Özel Teklif", subtitle: "Mağazamıza özel kampanya avantajı", highlight: "Güvenli Alışveriş" }
          ],
          aiPrompt: `Clean architectural studio product photography of "${title}" on a soft minimalist podium, crisp texture detail, centered composition.`
        }
      ]
    };
  }

  const isBagOrWearableInTitle =
    titleLower.includes("çanta") ||
    titleLower.includes("çantası") ||
    titleLower.includes("backpack") ||
    titleLower.includes("kulaklık") ||
    titleLower.includes("saat") ||
    titleLower.includes("ayakkabı");

  // 1. DOLAP İÇİ ORGANİZER / EV & DÜZENLEME SEGMENTİ
  if (
    !isBagOrWearableInTitle &&
    (combined.includes("organizer") ||
      combined.includes("düzenleyici") ||
      combined.includes("dolap") ||
      combined.includes("askı") ||
      combined.includes("çekmece") ||
      combined.includes("hurç") ||
      combined.includes("saklama") ||
      combined.includes("kutu") ||
      combined.includes("raf") ||
      combined.includes("banyo") ||
      combined.includes("mutfak"))
  ) {
    return {
      segmentId: "closet_home_organizer",
      segmentLabel: "Ev, Yaşam & Dolap İçi Düzenleme",
      segmentIcon: "wardrobe",
      defaultSceneType: "closet_organizer",
      scenarios: [
        {
          id: "closet_human_action",
          title: "Dolap İçi & İnsan Etkileşimi",
          description: "Gardırop içinde eşya yerleştiren kullanıcı sahnesi.",
          sceneType: "closet_organizer",
          kicker: "DOLABINIZDA KUSURSUZ DÜZEN",
          headline: "MAKSİMUM ALAN TASARRUFU",
          badge: "Pratik Bölmeli Tasarım & Nefes Alan Doku",
          storyScenes: [
            { phase: "Sahne 1: Dolap İçi Canlandırma", subtitle: "Gardırop ve raflarda ferah, simetrik yerleşim", highlight: "Anında Düzen & Kolay Erişim" },
            { phase: "Sahne 2: İnsan Etkileşimi & Kullanım", subtitle: "Bölmelere zahmetsizce eşya yerleştirme deneyimi", highlight: "Ergonomik & Geniş İç Hacim" },
            { phase: "Sahne 3: Çoklu Açı & Doku Kolajı", subtitle: "Dayanıklı dikiş, katlanabilir yapı ve form koruma", highlight: "Uzun Ömürlü Premium Kalite" },
            { phase: "Sahne 4: Satış & Kampanya Finali", subtitle: "Evinize düzen katacak özel fırsat", highlight: "Hemen Sipariş Verin" }
          ],
          aiPrompt: `Realistic commercial lifestyle photography of "${title}" placed inside a warm, well-lit modern wooden walk-in closet/wardrobe. A person's hands and upper figure are neatly placing folded clothes/items into the organizer compartments. Clean Scandinavian interior, soft natural lighting, centered product focus, ultra-detailed 8k.`
        },
        {
          id: "drawer_shelf_symmetry",
          title: "Raf & Çekmece Simetrik Kurulum",
          description: "Dolap raflarında ve çekmecelerde düzenli yerleşim.",
          sceneType: "closet_organizer",
          kicker: "AKILLI YAŞAM ÇÖZÜMLERİ",
          headline: "HER ŞEY YERLİ YERİNDE",
          badge: "Katlanabilir & Yıkanabilir Özel Form",
          storyScenes: [
            { phase: "Sahne 1: Çekmece & Raf Perspektifi", subtitle: "Dağınıklığı ortadan kaldıran modüler yapı", highlight: "%60'a Varan Alan Kazanımı" },
            { phase: "Sahne 2: Detay & Bölmeler", subtitle: "Her eşya için ideal ölçülerde ayrılmış gözler", highlight: "Pratik Tasarım" },
            { phase: "Sahne 3: Çoklu Görsel Vitrin", subtitle: "Farklı açılardan ürün formu ve malzeme kalitesi", highlight: "Üstün İşçilik" },
            { phase: "Sahne 4: Avantajlı Fiyat", subtitle: "Sınırlı süreli ev & yaşam fırsatı", highlight: "Aynı Gün Kargo" }
          ],
          aiPrompt: `High-end interior organization shot of "${title}" neatly arranged inside a modern open wardrobe shelf with warm LED strip lighting, surrounded by neatly folded linen and garments, sharp focus on the centered organizer.`
        },
        {
          id: "studio_macro_detail",
          title: "Stüdyo Çoklu Açı & Detay Şovu",
          description: "Doku, dikiş ve iç hacmi merkezde vurgulayan vitrin.",
          sceneType: "studio_macro",
          kicker: "ÜSTÜN MALZEME KALİTESİ",
          headline: "FONKSİYONEL TASARIM",
          badge: "Orijinal Ürün & Koşulsuz İade Garantisi",
          storyScenes: [
            { phase: "Sahne 1: Merkez Odak Vitrin", subtitle: "Ürünün tam boy ve net stüdyo görünümü", highlight: "Kusursuz Form" },
            { phase: "Sahne 2: Doku & Malzeme Yakın Plan", subtitle: "Sağlam gövde ve kaliteli kumaş/materyal", highlight: "Dayanıklı Yapı" },
            { phase: "Sahne 3: Çoklu Açı Kolajı", subtitle: "Tüm detaylarıyla şeffaf ürün incelemesi", highlight: "Tam Uyum" },
            { phase: "Sahne 4: Özel Teklif", subtitle: "Mağazamıza özel kampanya avantajı", highlight: "Güvenli Alışveriş" }
          ],
          aiPrompt: `Clean architectural studio product photography of "${title}" on a soft minimalist beige podium with gentle morning sunlight shadows, crisp texture detail, centered composition.`
        }
      ]
    };
  }

  // 2. KULAKLIK, SES, ÇANTA & GİYİLEBİLİR TEKNOLOJİ (KULLANICI ÜZERİNDE SENARYO)
  if (
    combined.includes("kulaklık") ||
    combined.includes("headphone") ||
    combined.includes("earbud") ||
    combined.includes("airpods") ||
    combined.includes("mikrofonlu") ||
    combined.includes("çanta") ||
    combined.includes("sırt çantası") ||
    combined.includes("backpack") ||
    combined.includes("saat") ||
    combined.includes("watch") ||
    combined.includes("gözlük") ||
    combined.includes("giyim") ||
    combined.includes("ayakkabı")
  ) {
    return {
      segmentId: "user_wearable",
      segmentLabel: "Kullanıcı Üzerinde Lifestyle & Deneyim",
      segmentIcon: "user",
      defaultSceneType: "user_lifestyle",
      scenarios: [
        {
          id: "user_active_wear",
          title: "Kullanıcı Üzerinde Canlı Deneyim",
          description: "Model/kullanıcı üzerinde ergonomi ve duruş sahnesi.",
          sceneType: "user_lifestyle",
          kicker: "GÜN BOYU MAKSİMUM KONFOR",
          headline: "SENİN TARZIN SENİN RİTMİN",
          badge: "Ergonomik Tasarım & Üstün Performans",
          storyScenes: [
            { phase: "Sahne 1: Kullanıcı Üzerinde Canlandırma", subtitle: "Gerçek kullanımda kusursuz uyum ve estetik duruş", highlight: "Üst Düzey Ergonomi" },
            { phase: "Sahne 2: Hareket Halinde Deneyim", subtitle: "Ofiste, seyahatte ve günlük yaşamda kesintisiz konfor", highlight: "Hafif & Dayanıklı Yapı" },
            { phase: "Sahne 3: Çoklu Açı & Detay Kolajı", subtitle: "Yastıklama, doku ve malzeme kalitesine yakın bakış", highlight: "Premium İşçilik" },
            { phase: "Sahne 4: Fırsat & Sipariş", subtitle: "Stoklarla sınırlı özel lansman fiyatı", highlight: "Hemen Keşfet" }
          ],
          aiPrompt: `Cinematic commercial lifestyle portrait of a modern professional person wearing/using "${title}" in a stylish contemporary cafe or creative studio lounge. Natural bokeh background, warm golden rim lighting, product is crystal clear and centered in frame, 8k photography.`
        },
        {
          id: "urban_commute_scene",
          title: "Şehir & Mobil Çalışma Senaryosu",
          description: "Günlük yaşam ve seyahat temposunda kullanım kurgusu.",
          sceneType: "user_lifestyle",
          kicker: "HER AN YANINDA",
          headline: "ÖZGÜRLÜĞÜ KEŞFET",
          badge: "Suya/Dış Etkenlere Dayanıklı & Uzun Ömürlü",
          storyScenes: [
            { phase: "Sahne 1: Şehir & Mobil Yaşam", subtitle: "Dinamik yaşam tarzına eşlik eden modern tasarım", highlight: "Tam Mobilite" },
            { phase: "Sahne 2: Fonksiyonel Detaylar", subtitle: "Kullanıcı dostu bölmeler ve kontrol detayları", highlight: "Akıllı Detaylar" },
            { phase: "Sahne 3: Çoklu Görsel Şovu", subtitle: "Her açıdan estetik ve fonksiyonel bütünlük", highlight: "Orijinal Kalite" },
            { phase: "Sahne 4: Mağaza Garantisi", subtitle: "Hızlı kargo ve güvenli ödeme ayrıcalığı", highlight: "Siparişi Tamamla" }
          ],
          aiPrompt: `Dynamic urban lifestyle photography featuring "${title}" being worn/carried by a stylish commuter in a modern architectural business district, soft sunlight, shallow depth of field, centered subject.`
        },
        {
          id: "desk_companion_scene",
          title: "Çalışma Masası & Lifestyle Kurulum",
          description: "Bilgisayar ve masaüstü ekipmanlarla birlikte sunum.",
          sceneType: "desk_setup",
          kicker: "PROFESYONEL EKİPMAN",
          headline: "PERFORMANS VE ESTETİK",
          badge: "Orijinal Distribitör Garantili",
          storyScenes: [
            { phase: "Sahne 1: Masaüstü Ekosistemi", subtitle: "Çalışma masanızda şık ve güçlü tamamlayıcı", highlight: "Modern Kurulum" },
            { phase: "Sahne 2: Yakın Plan Mühendislik", subtitle: "İnce düşünülmüş tasarım hatları", highlight: "Yüksek Kalite" },
            { phase: "Sahne 3: Çoklu Resim Kolajı", subtitle: "Ürünün tüm açıları tek ekranda", highlight: "Net Odak" },
            { phase: "Sahne 4: Kampanya Özeti", subtitle: "Kaçırılmayacak fiyat avantajı", highlight: "Ücretsiz Kargo" }
          ],
          aiPrompt: `Minimalist modern workspace desk setup featuring "${title}" placed neatly beside an ultra-thin laptop and warm desk lamp, depth of field, studio commercial lighting.`
        }
      ]
    };
  }

  // 3. MASAÜSTÜ EKİPMANLARI, KLAVYE, MOUSE, MONİTÖR, DONANIM & BİLİŞİM
  if (
    combined.includes("klavye") ||
    combined.includes("keyboard") ||
    combined.includes("mouse") ||
    combined.includes("fare") ||
    combined.includes("monitör") ||
    combined.includes("monitor") ||
    combined.includes("ekran") ||
    combined.includes("laptop") ||
    combined.includes("notebook") ||
    combined.includes("bilgisayar") ||
    combined.includes("ssd") ||
    combined.includes("nvme") ||
    combined.includes("disk") ||
    combined.includes("ram") ||
    combined.includes("anakart") ||
    combined.includes("kasa") ||
    combined.includes("oyuncu") ||
    combined.includes("gaming") ||
    combined.includes("usb") ||
    combined.includes("hub") ||
    combined.includes("stand") ||
    combined.includes("webcam") ||
    combined.includes("yazıcı")
  ) {
    return {
      segmentId: "desktop_setup",
      segmentLabel: "Masaüstü, Ofis & Pro Stüdyo Ekipmanı",
      segmentIcon: "monitor",
      defaultSceneType: "desk_setup",
      scenarios: [
        {
          id: "modern_office_desk",
          title: "Modern Ofis & Ev Masası Senaryosu",
          description: "Çalışma masasında monitör ve kullanıcı etkileşimi.",
          sceneType: "desk_setup",
          kicker: "MASANIZDA YENİ NESİL GÜÇ",
          headline: "MAKSİMUM VERİMLİLİK VE HIZ",
          badge: "Yüksek Performans & 24 Ay Resmi Garanti",
          storyScenes: [
            { phase: "Sahne 1: Masaüstü Kurulum Sahnesi", subtitle: "Modern ofis ve ev masasında kusursuz yerleşim", highlight: "Ergonomik Masaüstü Deneyimi" },
            { phase: "Sahne 2: Aktif Kullanım & Etkileşim", subtitle: "Kesintisiz hız, hassasiyet ve akıcı iş akışı", highlight: "Üstün Tepkime & Performans" },
            { phase: "Sahne 3: Çoklu Açı & Mühendislik Kolajı", subtitle: "Bağlantı noktaları, gövde yapısı ve malzeme kalitesi", highlight: "Pro Donanım Mimarisi" },
            { phase: "Sahne 4: Özel Fiyat & Hızlı Kargo", subtitle: "Stoktan aynı gün kargo avantajıyla", highlight: "Hemen Sipariş Verin" }
          ],
          aiPrompt: `Ultra-clean modern ergonomic office and home desk setup featuring "${title}" as the centerpiece on a matte walnut desk. Soft warm architectural key light, subtle dual-monitor workspace in the softly blurred background, human hands interacting naturally with the desk setup, commercial tech photography, 8k.`
        },
        {
          id: "pro_gaming_studio",
          title: "Pro Stüdyo & RGB Masa Senaryosu",
          description: "Ambiyans ışıklı stüdyo masasında performans şovu.",
          sceneType: "desk_setup",
          kicker: "SINIRLARI ZORLAYAN TEKNOLOJİ",
          headline: "OYUNUN VE İŞİN HAKİMİ OL",
          badge: "Ultra Hızlı Tepkime & Dayanıklı Mimari",
          storyScenes: [
            { phase: "Sahne 1: Pro Stüdyo Atmosferi", subtitle: "Ambiyans ışıklı profesyonel masa kurulumunda başrol", highlight: "Yüksek Hız & Güç" },
            { phase: "Sahne 2: Yakın Plan Detaylar", subtitle: "Hassas işçilik ve ileri teknoloji bileşenler", highlight: "Maksimum Dayanıklılık" },
            { phase: "Sahne 3: Çoklu Görsel Vitrin", subtitle: "Farklı açılardan ürün tasarımı", highlight: "Tam Uyumluluk" },
            { phase: "Sahne 4: Teknolojik Fırsat", subtitle: "Peşin fiyatına taksit ve güvenli teslimat", highlight: "Sepete Ekle" }
          ],
          aiPrompt: `Futuristic high-end creator and gaming desk setup with "${title}" centered on a sleek carbon-fiber desk mat, subtle cyan and indigo ambient LED backlight, ultra-sharp product details, cinematic commercial shot.`
        },
        {
          id: "multi_angle_tech_collage",
          title: "Çoklu Açı & Teknik Detay Kolajı",
          description: "Tüm açıları merkeze odaklayan teknik vitrin.",
          sceneType: "studio_macro",
          kicker: "İLERİ MÜHENDİSLİK",
          headline: "PROFESYONELLERİN TERCİHİ",
          badge: "Adınıza Faturalı & Orijinal Kutu",
          storyScenes: [
            { phase: "Sahne 1: Merkez Odak Ürün", subtitle: "Her detayı net, ortalanmış stüdyo sunumu", highlight: "Orijinal Tasarım" },
            { phase: "Sahne 2: Çoklu Açı İncelemesi", subtitle: "Ön, yan ve detay perspektiflerin dinamik geçişi", highlight: "360° Kalite Algısı" },
            { phase: "Sahne 3: Teknik Avantajlar", subtitle: "Uzun süreli kullanıma uygun sağlam yapı", highlight: "Yüksek Verim" },
            { phase: "Sahne 4: Satışa Özel Teklif", subtitle: "Mağaza güvencesiyle hemen sahip olun", highlight: "Fırsatı Yakala" }
          ],
          aiPrompt: `High-contrast macro commercial studio shot of "${title}" floating slightly above a sleek dark titanium surface with subtle rim lighting, centered composition.`
        }
      ]
    };
  }

  // 4. GENEL PERAKENDE & LIFESTYLE ÜRÜNLER
  return {
    segmentId: "general_lifestyle",
    segmentLabel: "Gerçek Yaşam & Lifestyle Kullanım Senaryosu",
    segmentIcon: "sparkles",
    defaultSceneType: "desk_setup",
    scenarios: [
      {
        id: "real_life_usage",
        title: "Gerçek Yaşam Kullanım Senaryosu",
        description: "Doğal kullanım ortamında insan etkileşimli sunum.",
        sceneType: "desk_setup",
        kicker: "YAŞAMINIZA DEĞER KATAR",
        headline: "KALİTE VE KONFOR BİR ARADA",
        badge: "Orijinal Ürün & Hızlı Teslimat",
        storyScenes: [
          { phase: "Sahne 1: Yaşam Alanında Canlandırma", subtitle: "Doğal kullanım ortamında estetik ve fonksiyonel duruş", highlight: "Pratik & Şık Kullanım" },
          { phase: "Sahne 2: Kullanıcı Deneyimi", subtitle: "Günlük hayatı kolaylaştıran ergonomik detaylar", highlight: "Yüksek Memnuniyet" },
          { phase: "Sahne 3: Çoklu Açı & Detay Kolajı", subtitle: "Ürünün tüm açılarından net ve ortalanmış görünüm", highlight: "Üstün Malzeme Kalitesi" },
          { phase: "Sahne 4: Özel Fiyat Avantajı", subtitle: "Sınırlı stok ve kampanya fırsatıyla", highlight: "Hemen İnceleyin" }
        ],
        aiPrompt: `Commercial lifestyle product photography of "${title}" staged naturally in a bright, modern home/office interior environment with subtle human interaction, warm natural daylight, centered product focus.`
      },
      {
        id: "user_interaction_story",
        title: "Kullanıcı Etkileşimli Deneyim",
        description: "Kullanıcı üzerinde aktif kullanım ve fayda vurgusu.",
        sceneType: "user_lifestyle",
        kicker: "DENEYİMİ KEŞFET",
        headline: "HER DETAYDA KUSURSUZLUK",
        badge: "Peşin Fiyatına Taksit & Ücretsiz Kargo",
        storyScenes: [
          { phase: "Sahne 1: Kullanıcı ile Bütünleşme", subtitle: "İlk dokunuştan itibaren fark yaratan kalite", highlight: "Ergonomik Yapı" },
          { phase: "Sahne 2: Aktif Performans", subtitle: "Beklentilerin ötesinde dayanıklılık ve işlevsellik", highlight: "Uzun Ömürlü" },
          { phase: "Sahne 3: Çoklu Görsel Vitrin", subtitle: "Yakın plan doku ve tasarım hatları", highlight: "Seçkin Tasarım" },
          { phase: "Sahne 4: Mağaza Ayrıcalığı", subtitle: "Güvenli alışveriş ve hızlı gönderim", highlight: "Sipariş Verin" }
        ],
        aiPrompt: `Lifestyle commercial scene showing a person interacting with and using "${title}" in a contemporary setting, warm lighting, shallow depth of field, centered product.`
      },
      {
        id: "closet_home_stage",
        title: "Ev & Dolap İçi Düzen Senaryosu",
        description: "Dolap, raf veya ev içi yaşam alanında yerleşim.",
        sceneType: "closet_organizer",
        kicker: "EVİNİZ İÇİN EN İYİSİ",
        headline: "MODERN VE DÜZENLİ YAŞAM",
        badge: "Müşteri Memnuniyeti Garantili",
        storyScenes: [
          { phase: "Sahne 1: Mekân İçi Yerleşim", subtitle: "Ev ve dolap içi alanlarda kusursuz uyum", highlight: "Estetik Görünüm" },
          { phase: "Sahne 2: Pratik Kullanım", subtitle: "Kolay yerleştirme ve düzenli görünüm", highlight: "Fonksiyonel" },
          { phase: "Sahne 3: Çoklu Açı Kolajı", subtitle: "Ürünün her açıdan detaylı görünümü", highlight: "Kaliteli İşçilik" },
          { phase: "Sahne 4: Kampanya Finali", subtitle: "Kaçırılmayacak fiyatlarla", highlight: "Hemen Al" }
        ],
        aiPrompt: `Warm modern home interior shelf and wardrobe setup featuring "${title}" neatly arranged with a person organizing items around it, soft daylight, centered focus.`
      }
    ]
  };
}

/**
 * POST /api/ai-social/analyze-segment
 * Analyzes product segment and returns tailored real-world usage scenarios & video storyboards
 */
router.post("/analyze-segment", async (req: any, res: any) => {
  const { title = "", category = "", brand = "", customIdea = "" } = req.body;
  const baseSegment = buildSegmentScenarios(title, category, brand);

  // If user didn't pass a custom idea or if AI client isn't needed for instant load, return enriched segment scenarios
  try {
    const ai = getGenAIClient();
    if (ai && customIdea && customIdea.trim().length > 3) {
      const prompt = `Sen yaratıcı bir reklam yönetmeni ve ürün senaristisin.
Ürün: "${title}" (Kategori: ${category || 'Genel'}, Marka: ${brand || 'Seçkin'})
Kullanıcının Hayal Ettiği Özel Senaryo: "${customIdea}"

Bu ürün ve kullanıcının hayali için 4 sahnelik bir video reklam storyboard'u ve afiş başlığı üret.
SADECE aşağıdaki JSON formatında yanıt ver:
{
  "id": "custom_ai_scenario",
  "title": "Kısa Senaryo Başlığı",
  "description": "Senaryonun görsel betimlemesi",
  "sceneType": "desk_setup",
  "kicker": "ÜST BAŞLIK (BÜYÜK HARF)",
  "headline": "ANA VURUCU BAŞLIK",
  "badge": "Alt avantaj rozeti",
  "storyScenes": [
    { "phase": "Sahne 1: ...", "subtitle": "...", "highlight": "..." },
    { "phase": "Sahne 2: ...", "subtitle": "...", "highlight": "..." },
    { "phase": "Sahne 3: ...", "subtitle": "...", "highlight": "..." },
    { "phase": "Sahne 4: ...", "subtitle": "...", "highlight": "..." }
  ],
  "aiPrompt": "Detailed English visual generation prompt placing the product in this exact scenario with centered focus"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const parsed = JSON.parse(response.text?.trim() || "{}");
      if (parsed && parsed.title) {
        return res.json({
          ...baseSegment,
          scenarios: [parsed, ...baseSegment.scenarios],
          source: "gemini-3.8-flash"
        });
      }
    }
  } catch (err: any) {
    console.warn("AI custom scenario enrichment notice:", err?.message || err);
  }

  // If user provided customIdea but Gemini API key wasn't active, build a tailored custom scenario object immediately
  if (customIdea && customIdea.trim().length > 2) {
    const ideaLower = customIdea.toLowerCase();
    const detectedSceneType =
      ideaLower.includes("dolap") || ideaLower.includes("raf") || ideaLower.includes("çekmece")
        ? "closet_organizer"
        : ideaLower.includes("insan") || ideaLower.includes("kullanıcı") || ideaLower.includes("model") || ideaLower.includes("üzerinde")
        ? "user_lifestyle"
        : "desk_setup";

    const customScenario = {
      id: `custom_${Date.now()}`,
      title: `Özel Senaryo: ${customIdea.slice(0, 42)}`,
      description: `${title} ürünü için "${customIdea}" kurgusunda gerçek yaşam canlandırması ve çoklu açı sunumu.`,
      sceneType: detectedSceneType,
      kicker: "ÖZEL SENARYO KURGUSU",
      headline: "GERÇEK DENEYİMİ KEŞFET",
      badge: customIdea.slice(0, 50),
      storyScenes: [
        { phase: "Sahne 1: Senaryo Açılışı", subtitle: customIdea, highlight: "Gerçek Yaşam Canlandırması" },
        { phase: "Sahne 2: Aktif Kullanım & İnsan Etkileşimi", subtitle: `${title} kullanım esnasında maksimum pratiklik sağlar`, highlight: "Ergonomik & İşlevsel" },
        { phase: "Sahne 3: Çoklu Resim & Detay Kolajı", subtitle: "Ürünün her açıdan ortalanmış net görünümü", highlight: "Üstün Kalite" },
        { phase: "Sahne 4: Satış & Aksiyon", subtitle: "Özel fiyat ve hızlı kargo avantajıyla", highlight: "Hemen Sipariş Verin" }
      ],
      aiPrompt: `Commercial lifestyle scene of "${title}": ${customIdea}. Product centered and prominent in frame, realistic lighting.`
    };

    return res.json({
      ...baseSegment,
      scenarios: [customScenario, ...baseSegment.scenarios],
      source: "smart_segment_engine"
    });
  }

  return res.json({
    ...baseSegment,
    source: "smart_segment_engine"
  });
});

/**
 * Helper to fetch an image URL and convert to base64 + mimeType
 */
async function fetchImageAsBase64(imageUrl: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    if (imageUrl.startsWith("data:image/")) {
      const match = imageUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (match) {
        return { mimeType: match[1], data: match[2] };
      }
    }
    const resp = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });
    if (!resp.ok) return null;
    const contentType = resp.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await resp.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return { data: base64, mimeType: contentType.split(";")[0] };
  } catch (e) {
    return null;
  }
}

/**
 * POST /api/ai-social/generate-scene-image
 * Uses Gemini Image Generation / Editing (`gemini-3.1-flash-lite-image`) to place the product
 * into the selected segment scenario (e.g. office desk, on a user, inside a closet with human action).
 */
router.post("/generate-scene-image", async (req: any, res: any) => {
  const {
    imageUrl,
    title = "Seçkin Ürün",
    scenarioTitle = "",
    scenarioPrompt = "",
    sceneType = "desk_setup"
  } = req.body;

  try {
    const ai = getGenAIClient();
    if (ai) {
      const parts: any[] = [];
      if (imageUrl) {
        const imgData = await fetchImageAsBase64(imageUrl);
        if (imgData) {
          parts.push({
            inlineData: {
              data: imgData.data,
              mimeType: imgData.mimeType
            }
          });
        }
      }

      const instruction =
        parts.length > 0
          ? `Place this exact product ("${title}") naturally into the following real-life commercial lifestyle scenario: ${scenarioPrompt || scenarioTitle}. Keep the product perfectly centered in the focal area, preserve its authentic design and proportions, and create photorealistic environment lighting around it.`
          : `Create a photorealistic commercial product lifestyle scene for "${title}": ${scenarioPrompt || scenarioTitle}. Keep the product centered and prominent.`;

      parts.push({ text: instruction });

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-image",
        contents: { parts }
      });

      const candidateParts = response.candidates?.[0]?.content?.parts || [];
      for (const part of candidateParts) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || "image/png";
          return res.json({
            success: true,
            generatedImageUrl: `data:${mime};base64,${part.inlineData.data}`,
            mode: "gemini-3.1-flash-lite-image",
            sceneType
          });
        }
      }
    }
  } catch (error: any) {
    console.warn("Gemini scene image generation notice (activating procedural studio stage):", error?.message || error);
  }

  // Return procedural stage instruction so the client canvas compositor immediately builds the contextual scene
  return res.json({
    success: true,
    generatedImageUrl: null,
    mode: "procedural_stage",
    sceneType,
    scenarioTitle
  });
});

/**
 * POST /api/ai-social/generate-ai-video
 * Uses `gemini-omni-1.1-flash` via Interactions API to generate an AI video from product image(s) + scenario prompt
 */
router.post("/generate-ai-video", async (req: any, res: any) => {
  const {
    imageUrls = [],
    title = "Seçkin Ürün",
    scenarioPrompt = "",
    aspectRatio = "square"
  } = req.body;

  try {
    const ai = getGenAIClient() as any;
    if (ai && ai.interactions && typeof ai.interactions.create === "function") {
      const inputItems: any[] = [];
      const urlsToUse = Array.isArray(imageUrls) ? imageUrls.slice(0, 2) : [];

      for (const url of urlsToUse) {
        const imgData = await fetchImageAsBase64(url);
        if (imgData) {
          inputItems.push({
            type: "image",
            mime_type: imgData.mimeType,
            data: imgData.data
          });
        }
      }

      inputItems.push({
        type: "text",
        text: `Create a high-converting commercial product video for "${title}". Scenario: ${scenarioPrompt}. Smooth cinematic camera movement around the centered product in its realistic usage environment.`
      });

      const interaction = await ai.interactions.create(
        {
          model: "gemini-omni-1.1-flash",
          input: inputItems,
          background: false,
          store: false,
          stream: false,
          response_format: {
            type: "video",
            aspect_ratio: aspectRatio === "story" ? "9:16" : "16:9",
            duration: "5s",
            resolution: "720p"
          }
        },
        { timeout: 180000 }
      );

      const videoPart = interaction?.output_video;
      if (videoPart?.data) {
        const mime = videoPart.mime_type || "video/mp4";
        return res.json({
          success: true,
          videoDataUrl: `data:${mime};base64,${videoPart.data}`,
          mode: "gemini-omni-1.1-flash"
        });
      }
    }
  } catch (error: any) {
    console.warn("Gemini Omni video generation notice (using multi-scene storyboard engine):", error?.message || error);
  }

  return res.json({
    success: true,
    videoDataUrl: null,
    mode: "storyboard_engine"
  });
});

/**
 * POST /api/ai-social/generate-caption
 * Generates sector-specific, scenario-driven social media caption using Google AI Pro (gemini-3.8-flash)
 */
router.post("/generate-caption", async (req: any, res: any) => {
  const { 
    itemType = 'product',
    title, 
    price, 
    oldPrice, 
    currency = 'TRY', 
    category, 
    brand, 
    storeName, 
    phone, 
    tone = 'promo',
    campaignBadge,
    scenarioTitle = '',
    scenarioDescription = '',
    specs = {} 
  } = req.body;

  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₺';
  const cleanStoreName = storeName || "Seçkin Mağaza";
  const cleanPhone = phone || "";

  const generateFallbackCaption = () => {
    const seg = buildSegmentScenarios(title, category, brand);
    const activeScen = seg.scenarios[0];
    let hook = "";
    let storyLine = "";
    let bullets: string[] = [];
    let hashtags: string[] = [];

    if (itemType === 'product') {
      if (seg.segmentId === 'closet_home_organizer') {
        hook = `✨ Evinizde ve Dolabınızda Kusursuz Düzen Dönemi: ${title}`;
        storyLine = scenarioDescription || `Gardırobunuzda, raflarınızda ve çekmecelerinizde aradığınız her şeye saniyeler içinde ulaşmanın keyfini yaşayın.`;
        bullets = [
          `🧺 Geniş iç hacim ve pratik bölmeli tasarım ile maksimum alan tasarrufu`,
          `👌 Eşyalarınızı formunu bozmadan, düzenli ve ferah şekilde saklama imkanı`,
          `💰 Özel Kampanya Fiyatı: ${price} ${currencySymbol}${oldPrice ? ` (Eski Fiyat: ${oldPrice} ${currencySymbol})` : ''}`,
          campaignBadge ? `🎁 Avantaj: ${campaignBadge}` : `📦 Stoktan Aynı Gün Hızlı Kargo`
        ];
        hashtags = [`#${cleanStoreName.replace(/\s+/g, '')}`, '#DolapDüzeni', '#EvDüzenleme', '#Organizer', '#PratikYaşam'];
      } else if (seg.segmentId === 'user_wearable') {
        hook = `🎧 Gün Boyu Seninle, Her Anında Maksimum Konfor: ${title}`;
        storyLine = scenarioDescription || `İster çalışma alanında ister şehir temposunda; ergonomik yapısı ve üstün performansıyla tarzınızı tamamlar.`;
        bullets = [
          `⚡ Kullanıcı odaklı ergonomik tasarım ve uzun süreli kullanımda tam konfor`,
          brand ? `🏷️ Orijinal ${brand} Kalitesi ve Güvencesi` : `🏷️ Üst Segment Malzeme ve İşçilik`,
          `💰 Özel Fiyat: ${price} ${currencySymbol}${oldPrice ? ` (Önceki Fiyat: ${oldPrice} ${currencySymbol})` : ''}`,
          campaignBadge ? `🎁 ${campaignBadge}` : `🚀 Hızlı Teslimat & Güvenli Alışveriş`
        ];
        hashtags = [`#${cleanStoreName.replace(/\s+/g, '')}`, '#Lifestyle', '#Konfor', '#Teknoloji', '#YeniNesil'];
      } else if (seg.segmentId === 'desktop_setup') {
        hook = `💻 Çalışma ve Oyun Masanızın Yeni Güç Merkezi: ${title}`;
        storyLine = scenarioDescription || `Masaüstü kurulumunuzda hızı, ergonomiyi ve profesyonel performansı bir üst seviyeye taşıyın.`;
        bullets = [
          `🚀 Yüksek tepkime süresi, kesintisiz performans ve dayanıklı donanım mimarisi`,
          `🎯 Ofis ve ev çalışma masalarında kusursuz ergonomi ve modern estetik`,
          `💰 Avantajlı Fiyat: ${price} ${currencySymbol}${oldPrice ? ` (Liste Fiyatı: ${oldPrice} ${currencySymbol})` : ''}`,
          campaignBadge ? `🎁 ${campaignBadge}` : `🛡️ Resmi Garantili & Faturalı Gönderim`
        ];
        hashtags = [`#${cleanStoreName.replace(/\s+/g, '')}`, '#MasaüstüKurulum', '#Teknoloji', '#Donanım', '#OfisMasası'];
      } else {
        hook = tone === 'luxury'
          ? `💎 ${cleanStoreName} Seçkisiyle Yaşamınıza Değer Katın: ${title}`
          : `🔥 Gerçek Kullanımda Fark Yaratan Kalite: ${title}`;
        storyLine = scenarioDescription || activeScen.description;
        bullets = [
          `✨ Üstün malzeme kalitesi, fonksiyonel tasarım ve uzun ömürlü kullanım`,
          `💰 Özel Fiyat: ${price} ${currencySymbol}${oldPrice ? ` (Eski Fiyat: ${oldPrice} ${currencySymbol})` : ''}`,
          campaignBadge ? `🎁 ${campaignBadge}` : `📦 Hızlı & Güvenli Kargo Avantajı`,
          `💳 Güvenli Ödeme ve Müşteri Memnuniyeti Garantisi`
        ];
        hashtags = [`#${cleanStoreName.replace(/\s+/g, '')}`, '#Kalite', '#Fırsat', '#Alışveriş', '#Tavsiye'];
      }
    } else if (itemType === 'vehicle') {
      hook = `🏁 PRESTİJ VE PERFORMANS: ${title}`;
      storyLine = `Kusursuz kondisyonu ve sürüş dinamikleriyle yeni sahibini bekliyor.`;
      bullets = [
        `🚘 Model: ${specs.year || ''} ${title}`,
        specs.mileage ? `⏱️ Kilometre: ${specs.mileage} KM` : '',
        specs.fuel ? `⛽ Yakıt / Vites: ${specs.fuel} / ${specs.transmission || 'Otomatik'}` : '',
        `💰 Fiyat: ${price} ${currencySymbol}`,
        campaignBadge ? `💎 ${campaignBadge}` : `🤝 Takas ve Finansman Kolaylığı`
      ].filter(Boolean);
      hashtags = [`#${cleanStoreName.replace(/\s+/g, '')}`, '#Otomotiv', '#SatılıkAraç', '#Prestij', '#Galeri'];
    } else {
      hook = `🏡 HAYALLERİNİZDEKİ YAŞAM: ${title}`;
      storyLine = `Seçkin lokasyonda hem yaşam hem de yüksek yatırım değeri sunan özel portföy.`;
      bullets = [
        specs.location ? `📍 Konum: ${specs.location}` : '📍 Seçkin Lokasyon',
        specs.sqm ? `📐 Alan: ${specs.sqm} m²` : '',
        specs.rooms ? `🛏️ Oda: ${specs.rooms}` : '',
        `💰 Fiyat: ${price} ${currencySymbol}`,
        campaignBadge ? `✨ ${campaignBadge}` : `🔑 Hemen Taşınmaya / Yatırıma Uygun`
      ].filter(Boolean);
      hashtags = [`#${cleanStoreName.replace(/\s+/g, '')}`, '#Gayrimenkul', '#LüksKonut', '#Yatırım', '#Emlak'];
    }

    const cta = cleanPhone 
      ? `📲 Detaylı Bilgi ve Sipariş / İletişim: ${cleanPhone}\n🌐 Web sitemizi ziyaret edin veya DM'den bize ulaşın!`
      : `📲 Detaylı Bilgi ve Hızlı Sipariş için DM atabilir veya profilimizdeki linke tıklayabilirsiniz!`;

    return `${hook}\n\n${storyLine}\n\n${bullets.join('\n')}\n\n${cta}\n\n${hashtags.join(' ')}`;
  };

  try {
    const ai = getGenAIClient();
    if (!ai) {
      return res.json({ caption: generateFallbackCaption(), source: 'fallback' });
    }

    const prompt = `Sen üst düzey bir e-ticaret ve kreatif pazarlama direktörüsün.
Aşağıdaki ürün ve seçilen kullanım senaryosu için satışları arttırıcı, müşterinin ürünü kendi hayatında (masasında, üzerinde veya evinde/dolabında) hayal etmesini sağlayan çok etkileyici bir Instagram/Reels paylaşım metni yaz.

ÜRÜN VE SENARYO BİLGİLERİ:
- Ürün: ${title}
- Kategori / Marka: ${category || ''} / ${brand || ''}
- Seçilen Görsel/Video Senaryosu: ${scenarioTitle || 'Gerçek yaşam kullanım senaryosu'} (${scenarioDescription || ''})
- Fiyat: ${price} ${currencySymbol} ${oldPrice ? `(Önceki Fiyat: ${oldPrice} ${currencySymbol})` : ''}
- Avantaj Rozeti: ${campaignBadge || ''}
- Mağaza: ${cleanStoreName}
- İletişim: ${cleanPhone || 'DM / Profildeki Link'}
- Ton: ${tone}

KURALLAR:
1. İlk cümle ürünü doğrudan kullanım senaryosuyla (örn. çalışma masasında, kullanıcı üzerinde veya dolap içi düzende) canlandıran güçlü bir kanca (hook) olsun.
2. Ardından ürünün müşteriye sağladığı somut faydaları 3-4 maddede akıcı şekilde sırala.
3. Fiyat ve kampanya avantajını net belirt.
4. Profesyonel bir iletişim/sipariş çağrısı ve 5 adet sektörel hashtag ile bitir.
Sadece paylaşım metnini döndür.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt
    });

    const captionText = response.text?.trim();
    if (!captionText) {
      return res.json({ caption: generateFallbackCaption(), source: 'fallback' });
    }

    res.json({ caption: captionText, source: 'gemini-3.8-flash' });
  } catch (error: any) {
    res.json({ caption: generateFallbackCaption(), source: 'fallback' });
  }
});

/**
 * POST /api/ai-social/generate-campaign-copy
 * Generates segment-specific campaign headlines and scenario hooks
 */
router.post("/generate-campaign-copy", async (req: any, res: any) => {
  const { title = "", category = "", brand = "", price = "", discountPercentage = 0 } = req.body;
  const seg = buildSegmentScenarios(title, category, brand);

  const fallbackCampaigns = seg.scenarios.map((s) => ({
    kicker: s.kicker,
    headline: discountPercentage > 0 ? `%${discountPercentage} İNDİRİM` : s.headline,
    badge: s.badge,
    scenarioId: s.id
  }));

  try {
    const ai = getGenAIClient();
    if (!ai) {
      return res.json({ campaigns: fallbackCampaigns, source: 'fallback' });
    }

    const prompt = `"${title}" (${category || 'Genel'}) ürünü için ürünün kullanım senaryosuna uygun, satış arttırıcı 3 adet afiş/video başlık paketi üret.
SADECE JSON array döndür:
[
  { "kicker": "ÜST SLOGAN", "headline": "ANA VURGU", "badge": "Alt fayda veya kampanya rozeti" }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    let parsed = JSON.parse(response.text?.trim() || "[]");
    if (!Array.isArray(parsed) || parsed.length === 0) parsed = fallbackCampaigns;

    res.json({ campaigns: parsed, source: 'gemini-3.8-flash' });
  } catch (error: any) {
    res.json({ campaigns: fallbackCampaigns, source: 'fallback' });
  }
});

export default router;
