const key = process.env.GLOBAL_API_KEY;
if (key) {
  console.log("GLOBAL_API_KEY Length:", key.length);
  console.log("Starts with AIzaSy:", key.startsWith("AIzaSy"));
  console.log("First 6 chars:", key.slice(0, 6));
} else {
  console.log("No GLOBAL_API_KEY in environment!");
}
