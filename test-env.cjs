console.log("Keys in process.env:");
Object.keys(process.env).forEach(key => {
  if (key.includes("API") || key.includes("KEY") || key.includes("SECRET") || key.includes("TOKEN") || key.includes("GOOGLE") || key.includes("GEMINI")) {
    console.log(`- ${key}: length ${process.env[key] ? process.env[key].length : 0}`);
  }
});
