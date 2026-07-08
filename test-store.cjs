fetch('http://localhost:3000/api/public/store/Abone')
  .then(res => res.json())
  .then(data => {
    console.log("page_layout:", data.page_layout);
  })
  .catch(console.error);
