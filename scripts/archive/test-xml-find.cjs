async function test() {
  const metaFetch = await fetch('https://gapbilisim.com/api/public/store/GAP/catalog.xml');
  const text = await metaFetch.text();
  if (text.includes('824142310328')) {
    console.log("FOUND IT");
    const snippet = text.substring(text.indexOf('824142310328') - 100, text.indexOf('824142310328') + 100);
    console.log(snippet);
  } else {
    console.log("NOT FOUND In ENTIRE XML");
  }
}
test();
