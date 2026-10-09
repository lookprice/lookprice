import axios from "axios";
import xml2js from "xml2js";
import https from "https";
import http from "http";

export interface TCMBRates {
  USD?: number;
  EUR?: number;
  GBP?: number;
  [key: string]: number | undefined;
}

const httpsAgent = new https.Agent({ keepAlive: false, rejectUnauthorized: false });
const httpAgent = new http.Agent({ keepAlive: false });

const TCMB_URLS = [
  "https://www.tcmb.gov.tr/kurlar/today.xml",
  "http://www.tcmb.gov.tr/kurlar/today.xml"
];

const DEFAULT_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
  "Connection": "close",
  "Cache-Control": "no-cache",
  "Pragma": "no-cache"
};

/**
 * Robustly fetches and parses exchange rates from TCMB XML with retries and headers to prevent ECONNRESET
 */
export async function fetchTCMBRatesWithRetry(maxRetriesPerUrl = 3): Promise<{ rates: TCMBRates; tcmbDate?: string }> {
  let lastError: any = null;

  for (const url of TCMB_URLS) {
    for (let attempt = 1; attempt <= maxRetriesPerUrl; attempt++) {
      try {
        const isHttps = url.startsWith("https:");
        const response = await axios.get(url, {
          headers: DEFAULT_HEADERS,
          timeout: 10000,
          responseType: "text",
          httpsAgent: isHttps ? httpsAgent : undefined,
          httpAgent: !isHttps ? httpAgent : undefined
        });

        if (response.data && typeof response.data === "string" && response.data.includes("Tarih_Date")) {
          const parser = new xml2js.Parser();
          const result: any = await new Promise((resolve, reject) => {
            parser.parseString(response.data, (err: any, parsed: any) => {
              if (err) return reject(err);
              resolve(parsed);
            });
          });

          const tcmbDate = result?.Tarih_Date?.["$"]?.Tarih;
          const currencies = result?.Tarih_Date?.Currency;

          if (!currencies || !Array.isArray(currencies)) {
            throw new Error("Invalid TCMB XML structure");
          }

          const rates: TCMBRates = {};
          for (const c of currencies) {
            const code = c["$"]?.CurrencyCode || c["$"]?.Kod;
            if (["USD", "EUR", "GBP"].includes(code)) {
              // Kara Kaplı Kitap Kuralı: Döviz Alış (ForexBuying) esas alınır
              const rateStr = (c.ForexBuying && c.ForexBuying[0]) || (c.ForexSelling && c.ForexSelling[0]) || (c.BanknoteSelling && c.BanknoteSelling[0]);
              if (rateStr) {
                const val = parseFloat(rateStr);
                if (!isNaN(val) && val > 0) {
                  rates[code] = val;
                }
              }
            }
          }

          if (Object.keys(rates).length > 0) {
            return { rates, tcmbDate };
          }
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[TCMB-FETCHER] Attempt ${attempt} on ${url} failed: ${err.message || err.code || err}`);
        if (attempt < maxRetriesPerUrl) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
  }

  console.error("[TCMB-FETCHER] All TCMB URL retries failed. Falling back to default baseline rates:", lastError?.message || lastError);
  // Fallback rates so the system never breaks or crashes on TCMB network resets
  return {
    rates: {
      USD: 38.50,
      EUR: 42.10,
      GBP: 49.80
    },
    tcmbDate: "Fallback-Cache"
  };
}
