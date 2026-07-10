const token = process.env.GEMINI_API_KEY;
if (!token) {
  console.error("No GEMINI_API_KEY found!");
  process.exit(1);
}

async function run() {
  console.log("Testing direct fetch to Gemini API using Authorization: Bearer...");
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Hello! Tell me a one-word greeting in Turkish."
          }]
        }]
      })
    });
    
    const status = response.status;
    const data = await response.json();
    console.log("HTTP Status:", status);
    console.log("Response:", JSON.stringify(data));
  } catch (e) {
    console.error("Fetch failed:", e.message);
  }
}

run();
