import { initDb } from "./models/db";
async function run() {
  try {
    await initDb();
    console.log("initDb success");
  } catch (e) {
    console.error("initDb failed", e);
  }
}
run();
