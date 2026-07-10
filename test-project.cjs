console.log("PROJECT keys in process.env:");
Object.keys(process.env).forEach(key => {
  if (key.includes("PROJECT") || key.includes("GCP") || key.includes("GCLOUD") || key.includes("ID")) {
    console.log(`- ${key}: ${process.env[key]}`);
  }
});
