import google from 'googlethis';
import { search } from 'duck-duck-scrape';

async function test() {
  console.log("Testing googlethis...");
  try {
    const images = await google.image('Coca Cola 330ml kutu', { safe: false });
    console.log("Google images found:", images.length > 0 ? images[0].url : "None");
  } catch(e) {
    console.error(e);
  }

  console.log("Testing duck-duck-scrape...");
  try {
    // duck-duck-scrape doesn't specifically have image search or we can check its API
  } catch(e) {
  }
}
test();
