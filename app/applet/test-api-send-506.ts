import axios from 'axios';

async function run() {
  try {
    console.log("Sending POST to http://localhost:3000/api/einvoice/send/506 ...");
    const res = await axios.post('http://localhost:3000/api/einvoice/send/506', {});
    console.log("Result:", res.data);
  } catch (err: any) {
    console.error("Error status:", err.response?.status);
    console.error("Error data:", JSON.stringify(err.response?.data, null, 2));
  }
}
run();
