async function test() {
  const metaFetch = await fetch('https://gapbilisim.com/s/GAP/p/824142310328', { redirect: 'manual' });
  console.log("Status:", metaFetch.status);
  console.log("Headers:", Object.fromEntries(metaFetch.headers.entries()));
}
test();
