import { GoogleGenAI } from "@google/genai";

// Lazy initialization wrapper
const aiProxy = {
  get models() {
    return new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || "dummy-key-to-prevent-crash",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    }).models;
  }
};

export default aiProxy;
