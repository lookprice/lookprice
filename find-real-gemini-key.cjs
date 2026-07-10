console.log("Searching process.env for keys starting with AIza:");
Object.keys(process.env).forEach(key => {
  const value = process.env[key];
  if (value && value.startsWith && value.startsWith("AIza")) {
    console.log(`- ${key}: length ${value.length}, starts with ${value.slice(0, 10)}`);
  }
});
