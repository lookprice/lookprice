import dotenv from 'dotenv';
dotenv.config();
import { supabase } from './src/services/supabaseService.js';

async function run() {
  console.log("Supabase instance:", !!supabase);
  if (!supabase) {
    console.error("Supabase client is not initialized.");
    return;
  }
  
  try {
    const testBuffer = Buffer.from("test upload content to make sure bucket is working");
    const filename = "test-check-" + Date.now() + ".txt";
    
    console.log("Uploading file to bucket 'lookdocu'...", filename);
    const { data, error } = await supabase.storage
      .from("lookdocu")
      .upload(filename, testBuffer, {
        contentType: "text/plain",
        upsert: false,
      });
      
    if (error) {
      console.error("Upload error details:", error);
    } else {
      console.log("Upload success! Public URL:", supabase.storage.from("lookdocu").getPublicUrl(filename).data.publicUrl);
    }
  } catch(e) {
    console.error("Caught error:", e);
  }
}

run();
