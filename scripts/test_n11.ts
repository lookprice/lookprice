import { N11Service } from "../src/services/backend/n11Service";

async function test() {
  const auth = { appKey: "n11_demo_app_554109", appSecret: "n11_sec_991823ab4" };
  try {
    const res = await N11Service.testConnection(auth);
    console.log(res);
  } catch (e) {
    console.error(e);
  }
}
test();
