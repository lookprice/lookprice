
import pg from 'pg';
const { Pool } = pg;

async function checkEnv() {
  const allKeys = Object.keys(process.env);
  const filteredKeys = allKeys.filter(k => 
    !k.startsWith('npm_') && 
    !k.startsWith('NODE_') && 
    !['PATH', 'HOME', 'PWD', 'SHELL', 'TERM', 'USER', 'LANG', 'DATABASE_URL', 'GEMINI_API_KEY'].includes(k)
  );
  
  console.log("Available Environment Keys (Filtered):", filteredKeys);
}

checkEnv();
