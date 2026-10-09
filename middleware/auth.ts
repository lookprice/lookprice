import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("KRİTİK HATA: JWT_SECRET çevre değişkeni tanımlanmamış!");
}

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-lookprice-applet-dev-2026";

export const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: "Invalid token" });
  }
};

/**
 * Centralized Store ID Isolation Helper
 * Ensures non-superadmin users can ONLY access their own store_id.
 */
export function getAuthorizedStoreId(req: any, requestedStoreId?: any): number {
  if (req.user?.role === "superadmin" && requestedStoreId !== undefined && requestedStoreId !== null && requestedStoreId !== "") {
    const parsed = Number(requestedStoreId);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return Number(req.user?.store_id || 0);
}

