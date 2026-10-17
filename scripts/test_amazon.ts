import { AmazonService } from "../src/services/backend/amazonService";

async function test() {
  const settings = {
    clientId: "amzn1.application-oa2-client.shoplpdemo",
    clientSecret: "amzn_sec_demo12938102",
    refresh_token: "Atzr|IwEBI_demo_refresh_token_shoplp_live",
    sellerId: "A3DEMO_SHOPLP_TR"
  };
  const service = new AmazonService(settings as any, 38);
  try {
    const res = await service.testConnection();
    console.log(res);
  } catch (e: any) {
    console.error(e.message);
  }
}
test();
