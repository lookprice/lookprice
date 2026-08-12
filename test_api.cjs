const https = require('https');
https.get('https://ais-dev-fw5matlno23z7prjfvwxwu-416165499277.europe-west2.run.app/api/public/marketplace/listings', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const listing = json.realEstate.find(l => l.title && l.title.includes('HASPOLAT'));
      console.log(JSON.stringify(listing, null, 2));
    } catch (e) {
      console.log("Error parsing JSON:", e.message);
      console.log(data.substring(0, 200));
    }
  });
});
