
import { renderService } from './src/services/renderService.ts';

async function testRender() {
  const domain = "gapbilisim.com";
  try {
    console.log(`Testing Render registration for ${domain}...`);
    const result = await renderService.addCustomDomain(domain);
    console.log("Result:", JSON.stringify(result, null, 2));
    
    console.log(`Testing Render registration for www.${domain}...`);
    const resultWww = await renderService.addCustomDomain(`www.${domain}`);
    console.log("Result WWW:", JSON.stringify(resultWww, null, 2));
    
    process.exit(0);
  } catch (e) {
    console.error("Test failed:", e);
    process.exit(1);
  }
}

testRender();
