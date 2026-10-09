import express from "express";
import { authenticate } from "../middleware/auth";
import axios from "axios";
import { pool } from "../models/db";

const router = express.Router();

// Instagram Auth URL
router.get("/auth-url", authenticate, (req: any, res) => {
  const clientId = process.env.INSTAGRAM_CLIENT_ID || "901342875671985";
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || "https://www.enrakipsiz.com/api/instagram/callback";
  const scopes = "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish,instagram_business_manage_insights";
  const state = req.user.store_id; // Pass store_id as state

  const authUrl = `https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${state}`;
  res.json({ url: authUrl });
});

// Instagram Callback
router.get("/callback", async (req, res) => {
  const { code, state } = req.query;
  if (!code) return res.status(400).send("Code missing");

  const clientId = process.env.INSTAGRAM_CLIENT_ID || "901342875671985";
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || "https://www.enrakipsiz.com/api/instagram/callback";

  try {
    // 1. Exchange code for short-lived token
    const formData = new URLSearchParams();
    formData.append("client_id", clientId);
    formData.append("client_secret", clientSecret || "");
    formData.append("grant_type", "authorization_code");
    formData.append("redirect_uri", redirectUri);
    formData.append("code", code as string);

    const tokenRes = await axios.post("https://api.instagram.com/oauth/access_token", formData);

    const shortToken = tokenRes.data.access_token;
    const userId = tokenRes.data.user_id;

    // 2. Exchange for long-lived token (Optional but recommended for Business apps)
    // For Basic Display API it's different, but for Business API we usually get a long-lived token via another endpoint if needed.
    // However, the standard access_token from Business login is often already long-lived or we can use it directly.
    
    // Storing in database
    if (state) {
      const storeId = state;
      await pool.query(
        `UPDATE stores SET 
            instagram_access_token = $1, 
            instagram_business_account_id = $2
         WHERE id = $3`,
        [shortToken, userId, storeId]
      );
    }

    res.send(`
      <html>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; text-align: center;">
          <div style="padding: 40px; border-radius: 20px; background: #f8fafc; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #1e293b;">Bağlantı Başarılı!</h2>
            <p style="color: #64748b;">Instagram hesabınız sisteme başarıyla bağlandı.<br/>Bu pencere otomatik olarak kapanacaktır.</p>
            <script>
              setTimeout(() => {
                if (window.opener) {
                  window.opener.postMessage({ type: 'INSTAGRAM_AUTH_SUCCESS' }, '*');
                }
                window.close();
              }, 3000);
            </script>
          </div>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error("Instagram Callback Error:", error.response?.data || error.message);
    res.status(500).send("Authentication failed. Details: " + (error.response?.data?.error_message || error.message));
  }
});

// Post to Instagram
router.post("/post", authenticate, async (req, res) => {
  const { imageUrl, caption } = req.body;
  // Placeholder for Instagram Graph API call
  res.json({ success: true, message: "Posting initiated" });
});

export default router;
