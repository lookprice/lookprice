import axios, { AxiosInstance } from "axios";
import { pool } from "../../../models/db";
import PQueue from 'p-queue';

export class HepsiburadaServiceV3 {
  private queue = new PQueue({ concurrency: 5, interval: 1000, intervalCap: 100 });
  private axiosInstance: AxiosInstance;
  private env: 'sit' | 'production';

  constructor(env: 'sit' | 'production' = 'sit') {
    this.env = env;
    this.axiosInstance = axios.create({
      baseURL: env === 'sit' ? 'https://api.sit.hepsiburada.com/v3' : 'https://api.hepsiburada.com/v3',
    });
  }

  private async getAccessToken(): Promise<string> {
    // 1. Get credentials from integrator_configs
    const { rows } = await pool.query(
      'SELECT client_id, client_secret, token FROM integrator_configs WHERE marketplace = $1 AND env = $2',
      ['hepsiburada', this.env]
    );

    if (rows.length === 0) throw new Error('Hepsiburada integrator credentials not found');
    const { client_id, client_secret, token } = rows[0];

    // 2. Check if token exists and is valid (simplified for now)
    if (token && token.access_token && new Date(token.expires_at) > new Date()) {
      return token.access_token;
    }

    // 3. Get new token
    const res = await axios.post(`${this.env === 'sit' ? 'https://api.sit.hepsiburada.com' : 'https://api.hepsiburada.com'}/v3/auth`, {
      client_id,
      client_secret,
      grant_type: 'client_credentials'
    });

    const newToken = res.data;
    const expiresAt = new Date(Date.now() + newToken.expires_in * 1000);

    // 4. Update DB
    await pool.query(
      'UPDATE integrator_configs SET token = $1 WHERE marketplace = $2 AND env = $3',
      [JSON.stringify({ access_token: newToken.access_token, expires_at: expiresAt }), 'hepsiburada', this.env]
    );

    return newToken.access_token;
  }

  async importListings(products: any[]) {
    return this.authenticatedRequest('POST', '/listings/import', products);
  }

  async checkTaskStatus(trackingId: string) {
    return this.authenticatedRequest('GET', `/listings/import/${trackingId}`);
  }

  async authenticatedRequest(method: string, url: string, data?: any) {
    return this.queue.add(async () => {
      const token = await this.getAccessToken();
      const res = await this.axiosInstance.request({
        method,
        url: url.startsWith('/') ? url : `/${url}`, // Ensure absolute path
        data,
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    });
  }
}
