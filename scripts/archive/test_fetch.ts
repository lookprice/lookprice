async function check() {
  try {
    const r = await fetch('http://localhost:3000/api/schema-check');
    const d = await r.json();
    console.log(JSON.stringify(d, null, 2));
  } catch(e) {
    console.error(e);
  }
}
check();
