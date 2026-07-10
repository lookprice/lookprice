const { GoogleGenAI } = require("@google/genai");

async function run() {
  const projectId = "ais-europe-west2-5f21facd58174";
  console.log("Using Project ID:", projectId);
  
  // Try Vertex AI mode using automatic credential detection (since NodeAuth is running on Cloud Run,
  // it should automatically authenticate using the metadata server service account)
  const ai = new GoogleGenAI({
    vertexai: true,
    project: projectId,
    location: "europe-west2" // let's try europe-west2 first as project ID indicates europe-west2, or us-central1
  });
  
  try {
    console.log("Calling Gemini 1.5 Flash in Vertex AI mode...");
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: "Hello! Tell me a one-word greeting in Turkish.",
    });
    
    console.log("Response text:", response.text);
  } catch (error) {
    console.error("Error with europe-west2:", error);
    
    try {
      console.log("Retrying with us-central1 location...");
      const aiUS = new GoogleGenAI({
        vertexai: true,
        project: projectId,
        location: "us-central1"
      });
      const responseUS = await aiUS.models.generateContent({
        model: "gemini-1.5-flash",
        contents: "Hello! Tell me a one-word greeting in Turkish.",
      });
      console.log("Response text (us-central1):", responseUS.text);
    } catch (err) {
      console.error("Error with us-central1:", err);
    }
  }
}

run();
