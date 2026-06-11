import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

async function testGemini() {
  console.log("GEMINI_API_KEY from env:", process.env.GEMINI_API_KEY ? "EXISTS" : "MISSING");
  
  if (!process.env.GEMINI_API_KEY) {
      console.log("Keys:", Object.keys(process.env).filter(k => k.includes('KEY') || k.includes('GEMINI')));
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });
  const prompt = `You are an expert product cataloger. Given product: "LookPrice Makine", brand: "Unknown", barcode: "12345". 
Return ONLY valid JSON: { "imageUrl": "url", "author": "name", "brand": "name" }.`;

  console.log("Sending prompt to Gemini...");
  try {
    const aiResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    console.log("Response:", aiResponse.text);
  } catch (err: any) {
    console.error("Gemini Error:", err.message);
  }
}

testGemini();
