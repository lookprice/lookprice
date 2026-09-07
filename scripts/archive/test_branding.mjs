async function test() {
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'lookprice.me@gmail.com', password: 'password' })
  });
  
  if (!loginRes.ok) {
    console.log("Login failed", await loginRes.text());
    return;
  }
  
  const token = (await loginRes.json()).token;
  
  const payload = {
    name: "My Store",
    about_text: "Updated text!!",
    page_layout_settings: { show_announcement: true, announcement_text: "YENİ!!!" },
    brand_label: "A brand"
  };
  
  const res = await fetch('http://localhost:3000/api/store/branding', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  
  console.log(res.status);
  console.log(await res.text());
}

test();
