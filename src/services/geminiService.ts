import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

function getGemini() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set in environment.");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

export const generateProductDescription = async (productData: any, lang: string = 'tr') => {
  const prompt = `
    Ürün Adı: ${productData.name}
    Kategori: ${productData.category}
    Öne Çıkanlar: ${productData.labels?.join(', ') || ''}
    
    Bu ürün için ${lang === 'tr' ? 'Türkçe' : 'İngilizce'}, profesyonel, marka değeri yüksek, SEO odaklı, ikna edici bir ürün açıklaması yaz. 
    İçerik sadece açıklamayı içermeli, giriş cümlesi olmasın.
  `;

  const ai = getGemini();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text;
};

export const generateBlogContent = async (topic: string, storeName: string, lang: string = 'tr') => {
  const prompt = `
    Mağaza/Firma Adı: ${storeName}
    Konu/Konsept: ${topic}
    Dil: ${lang === 'tr' ? 'Türkçe' : 'İngilizce'}
    
    Bu konu ve mağaza için profesyonel bir blog yazısı oluştur. Çıktıyı aşağıdaki JSON formatında ver:
    {
      "title": "Blog Başlığı",
      "excerpt": "Blog özet metni (maks 2 cümle)",
      "content": "Blog içeriği, HTML veya Markdown destekleyen zengin bir metin.",
      "image_url": "https://images.unsplash.com/photo-..." (varsa konuya uygun rastgele bir unsplash adresi, yoksa boş)
    }
  `;

  const ai = getGemini();
  const response = await ai.models.generateContent({ 
    model: "gemini-1.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });
  
  const text = response.text;

  if (text) {
     return JSON.parse(text);
  }
  return { title: "", excerpt: "", content: "", image_url: "" };
};

export const findProductImageUrl = async (product: { name: string, barcode?: string }) => {
  try {
    const prompt = `SEARCH THE WEB and find a HIGH-QUALITY, professional product image URL for: "${product.name}"${product.barcode ? ` (Barcode/GTIN: ${product.barcode})` : ""}. 

    SEARCH STRATEGY:
    1. Search GLOBAL: Amazon (all regions), eBay, Zalando, ASOS, or official brand site galleries.
    2. IT SECTOR: Focus on Icecat, CNET, PCMag, Newegg, and manufacturer portals (Dell, HP, Lenovo, ASUS, MSI).
    3. Look for direct CDN links (e.g. m.media-amazon.com, static.zara.net, productimages.hepsiburada.net, images.icecat.biz).
    
    RESPONSE RULES:
    - Provide a single direct URL ending in .jpg, .png, or .webp.
    - RETURN ONLY THE URL. If no image is found, return "NONE".`;

    const ai = getGemini();
    const response = await ai.models.generateContent({
      model: "gemini-1.5-pro", // Using Pro for better tool use and accuracy
      contents: prompt,
      tools: [
        {
          googleSearchRetrieval: {
            dynamicRetrievalConfig: {
              mode: "dynamic",
              dynamicThreshold: 0.1
            }
          }
        }
      ]
    } as any);

    const responseText = response.text || "";
    // Robust URL extraction
    const urlRegex = /(https?:\/\/[^\s"'>]+\.(?:jpg|jpeg|png|webp|avif|gif)(?:\?[^\s"'>]*)?)/i;
    const match = responseText.match(urlRegex);
    let url = match ? match[0] : null;

    if (url && !url.toUpperCase().includes("NONE") && url.length > 10) {
      if (url.startsWith("http://")) {
        url = url.replace("http://", "https://");
      }
      return url;
    }
    return null;
  } catch (e) {
    console.error("Gemini find image error:", e);
    return null;
  }
};
