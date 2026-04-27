async function test() {
  const metaFetch = await fetch('https://gapbilisim.com/api/public/store/GAP/catalog.xml');
  const text = await metaFetch.text();
  console.log("Channel link:");
  console.log(text.match(/<channel>[\s\S]*?<link>(.*?)<\/link>/)?.[1]);
  console.log("First item link:");
  console.log(text.match(/<item>[\s\S]*?<g:link>(.*?)<\/g:link>/)?.[1]);
}
test();
