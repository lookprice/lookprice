import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const generateProductDescription = async (productData: any, lang: string = 'tr') => {
  const prompt = `
    Ürün Adı: ${productData.name}
    Kategori: ${productData.category}
    Öne Çıkanlar: ${productData.labels?.join(', ') || ''}
    
    Bu ürün için ${lang === 'tr' ? 'Türkçe' : 'İngilizce'}, profesyonel, marka değeri yüksek, SEO odaklı, ikna edici bir ürün açıklaması yaz. 
    İçerik sadece açıklamayı içermeli, giriş cümlesi olmasın.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-preview",
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

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-preview",
    contents: prompt,
    config: {
        responseMimeType: "application/json"
    }
  });

  if (response.text) {
     return JSON.parse(response.text);
  }
  return { title: "", excerpt: "", content: "", image_url: "" };
};
