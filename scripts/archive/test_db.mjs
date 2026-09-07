async function check() {
  const res = await fetch('http://localhost:3000/api/public/fix-db');
  console.log(await res.json());
}
check();
