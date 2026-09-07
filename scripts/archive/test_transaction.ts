import fetch from 'node-fetch';
async function run() {
  const r = await fetch('http://localhost:3000/api/store/companies/1/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'credit',
      amount: 100,
      description: 'Test',
      transaction_date: new Date().toISOString(),
      payment_method: 'cash',
      storeId: 1
    })
  });
  console.log(await r.text());
}
run();
