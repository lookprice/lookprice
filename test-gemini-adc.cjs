const { GoogleGenAI } = require("@google/genai");

async function run() {
  console.log("Initializing GoogleGenAI with empty options (ADC mode)...");
  // By passing empty options, it will use ADC (GoogleAuth) if GEMINI_API_KEY is not defined,
  // but wait, if GEMINI_API_KEY is defined in env, it will load it automatically!
  // To test ADC, let's delete GEMINI_API_KEY from env before initializing!
  delete process.env.GEMINI_API_KEY;
  delete process.env.GOOGLE_API_KEY;
  delete process.env.API_KEY;

  const ai = new GoogleGenAI({});
  
  try {
    console.log("Calling Gemini 1.5 Flash in ADC mode...");
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: "Hello! Tell me a one-word greeting in Turkish.",
    });
    
    console.log("Response text:", response.text);
  } catch (error) {
    console.error("Error during ADC call:", error);
  }
}

run();
