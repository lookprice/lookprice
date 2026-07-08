fetch('http://localhost:3000/api/public/store/Abone/products')
  .then(res => res.json())
  .then(data => {
    console.log(JSON.stringify(data).substring(0, 500));
    console.log("Total products:", data.length);
  })
  .catch(console.error);
