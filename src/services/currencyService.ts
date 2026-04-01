// src/services/currencyService.ts
export async function getExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;
  try {
    const response = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
    const data = await response.json();
    return data.rates[to];
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    return 1; // Fallback to 1 if API fails
  }
}
