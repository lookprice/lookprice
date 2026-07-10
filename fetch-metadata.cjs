const http = require('http');

function getMetadata(path) {
  return new Promise((resolve, reject) => {
    const req = http.get({
      hostname: 'metadata.google.internal',
      path: '/computeMetadata/v1/' + path,
      headers: { 'Metadata-Flavor': 'Google' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data.trim()));
    });
    req.on('error', reject);
  });
}

async function run() {
  try {
    const projectId = await getMetadata('project/project-id');
    const projectNumber = await getMetadata('project/numeric-project-id');
    console.log("Project ID:", projectId);
    console.log("Project Number:", projectNumber);
  } catch (e) {
    console.error("Metadata server call failed:", e.message);
  }
}

run();
