export function isRentalListing(listing: any): boolean {
  if (!listing) return false;
  const sec = listing.sector_data || {};
  const rawIntent = (
    listing.listing_intent ||
    sec.listing_intent ||
    listing.intent ||
    sec.intent ||
    ""
  ).toString().toLowerCase();

  if (rawIntent === "rent" || rawIntent === "kiralik" || rawIntent === "rental") return true;
  if (rawIntent === "sale" || rawIntent === "satilik") return false;

  if (listing.reference_no && /-k-/i.test(listing.reference_no)) return true;

  const category = (listing.category || "").toLowerCase();
  const title = (listing.title || "").toLowerCase();
  const desc = (listing.description || "").toLowerCase();

  const isKiralikPattern = /k[iıİI]ral[iıİI]k/i;
  if (
    isKiralikPattern.test(rawIntent) ||
    isKiralikPattern.test(category) ||
    isKiralikPattern.test(title) ||
    isKiralikPattern.test(desc) ||
    title.includes("aylık") ||
    title.includes("depozito")
  ) {
    return true;
  }

  return false;
}

export function getListingIntent(listing: any): "kiralik" | "satilik" {
  return isRentalListing(listing) ? "kiralik" : "satilik";
}

export const formatLocation = (listing: any) => {
  if (!listing) return "LEFKOŞA / Küçük Kaymaklı";
  const sec = listing.sector_data || {};
  let city = sec.kktc_region || sec.city || listing.city || "";
  let district = sec.district || sec.region || sec.neighborhood || listing.district || "";

  if (!city && listing.location && typeof listing.location === "string") {
    const parts = listing.location.split("/").map((s: string) => s.trim());
    if (parts.length >= 2) {
      city = parts[0];
      district = parts[1];
    } else if (parts.length === 1 && !parts[0].toLowerCase().includes("istanbul")) {
      city = parts[0];
    }
  }

  city = city.toUpperCase();
  if (district) {
    return `${city} / ${district}`;
  }
  return city;
};

export function getSquareMeters(listing: any) {
  if (!listing) return null;
  const sec = listing.sector_data || {};
  const structured = listing.square_meters || listing.m2 || sec.square_meters || sec.net_m2 || sec.m2 || listing.sqm_gross || sec.gross_m2 || sec.area || sec.m2_net;
  if (structured && structured !== "-") return structured;
  
  const titleAndDesc = ((listing.title || "") + " " + (listing.description || "")).toLowerCase().replace('²', '2').replace('metrekare', 'm2');
  const match = titleAndDesc.match(/(\d+([.,]\d+)?)\s*m\s*2/);
  
  return match ? match[1].replace(',', '.') : null;
}

export function getVehicleMileage(listing: any) {
  if (!listing) return "-";
  const sec = listing.sector_data || {};
  const val = listing.mileage || listing.km || sec.mileage || sec.km || sec.current_mileage;
  if (val && val !== "-") {
    const num = Number(val);
    return isNaN(num) ? val : num.toLocaleString('tr-TR');
  }
  const titleAndDesc = ((listing.title || "") + " " + (listing.description || "")).toLowerCase();
  const match = titleAndDesc.match(/(\d{1,3}([.,]\d{3})+|\d+)\s*(km|kilometre)/);
  if (match) return match[1];
  return "-";
}

export function getVehicleYear(listing: any) {
  if (!listing) return "-";
  const sec = listing.sector_data || {};
  const val = listing.year || sec.year || sec.model_year;
  if (val && val !== "-") return String(val);
  const match = (listing.title || "").match(/\b(19\d\d|20[0-2]\d)\b/);
  if (match) return match[1];
  return "-";
}

export function aggregateTags(listings: any[]): string[] {
  const allTags = listings.flatMap(l => l.tags || []);
  return Array.from(new Set(allTags)).filter(Boolean) as string[];
}
