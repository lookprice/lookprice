const keys = Object.keys(process.env);
console.log("All Env Keys:", keys.filter(k => !k.startsWith("npm_") && !k.startsWith("NODE_")));
