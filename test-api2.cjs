fetch('http://localhost:3000/api/public/store/Abone/products')
  .then(res => res.json())
  .then(data => {
    console.log(data[0].sector_data ? "Has sector_data" : "Missing sector_data");
    console.log(data[0].sector_data);
  })
  .catch(console.error);
