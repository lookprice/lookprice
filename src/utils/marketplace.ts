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
  const sec = listing.sector_data || {};
  const structured = listing.square_meters || sec.net_m2 || sec.m2 || listing.sqm_gross || sec.gross_m2 || sec.area;
  if (structured) return structured;
  
  const desc = (listing.description || "").toLowerCase().replace('²', '2').replace('metrekare', 'm2');
  const match = desc.match(/(\d+([.,]\d+)?)\s*m\s*2/);
  
  return match ? match[1].replace(',', '.') : null;
}

export function aggregateTags(listings: any[]): string[] {
  const allTags = listings.flatMap(l => l.tags || []);
  return Array.from(new Set(allTags)).filter(Boolean) as string[];
}
