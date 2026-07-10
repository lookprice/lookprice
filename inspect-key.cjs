const key = process.env.GEMINI_API_KEY;
if (key) {
  console.log("Length:", key.length);
  console.log("Starts with AIzaSy:", key.startsWith("AIzaSy"));
  console.log("First 6 chars:", key.slice(0, 6));
  console.log("Last 6 chars:", key.slice(-6));
  console.log("Contains whitespaces:", /\s/.test(key));
} else {
  console.log("No GEMINI_API_KEY in environment!");
}
