import { initDb } from './models/db';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    await initDb();
    console.log("DB initialized successfully.");
  } catch (e) {
    console.error(e);
  }
}
run();
