const { GoogleGenAI } = require("@google/genai");

async function run() {
  const apiKey = process.env.VITE_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    console.error("No API key found in env!");
    return;
  }
  
  console.log("Using API Key starting with:", apiKey.slice(0, 6));
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    console.log("Calling Gemini with gemini-3.5-flash & Google Search...");
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Search the web for the 3 most recent property listings from Northern Cyprus (KKTC) in Girne Alsancak. Return as a JSON array of objects with keys: title, price, location, link.",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });
    
    console.log("Response text:", response.text);
  } catch (error) {
    console.error("Error during call:", error);
  }
}

run();
