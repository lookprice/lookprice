console.log("Printing all environment keys and their values (anonymized/length):");
Object.keys(process.env).forEach(key => {
  const value = process.env[key];
  if (!value) return;
  const isSensitive = key.includes("KEY") || key.includes("SECRET") || key.includes("PASSWORD") || key.includes("TOKEN") || value.length > 30;
  if (isSensitive) {
    console.log(`- ${key}: length ${value.length}, starts with: ${value.slice(0, 8)}...`);
  } else {
    console.log(`- ${key}: ${value}`);
  }
});
