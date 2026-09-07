async function test() {
  const metaFetch = await fetch('https://gapbilisim.com/api/public/store/GAP/catalog.xml');
  const text = await metaFetch.text();
  
  const links = text.match(/<g:link>.*?<\/g:link>/g);
  console.log("Total products:", links?.length);
  const uniqueLinks = new Set(links);
  console.log("Unique links:", uniqueLinks.size);
  console.log(links?.slice(0, 5));
}
test();
