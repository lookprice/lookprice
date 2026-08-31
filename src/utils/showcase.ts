export const getLabels = (labels: any): string[] => {
  if (!labels) return [];
  if (Array.isArray(labels)) {
    return labels.map(l => String(l || "").trim()).filter(Boolean);
  }
  if (typeof labels === "string") {
    const trimmed = labels.trim();
    if (!trimmed) return [];
    if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map(l => String(l || "").trim()).filter(Boolean);
        }
      } catch (e) {
        // Fallback below
      }
    }
    return trimmed
      .replace(/[\[\]"]/g, "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
  }
  return [];
};

export const formatPrice = (price: number, currency: string, sector?: string, storeType?: string) => {
  const isPortfolio = storeType === "real_estate" || storeType === "motor_vehicle" || sector === "real_estate" || sector === "automotive";
  const decimals = isPortfolio ? 0 : 2;
  return `${Number(price).toLocaleString("tr-TR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} ${currency || "TRY"}`;
};
