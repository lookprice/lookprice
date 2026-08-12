const listing = {
  title: "Satılık 19 DÖNÜM Sanayi İmarlı Arazi HASPOLAT Sanayi Bölgesinde  (25.824 m2)",
  type: "land",
  subtype: "İmarlı Arsa",
  sector_data: { type: "land", subtype: "İmarlı Arsa" }
};

function formatCategory(listing) {
  if (!listing) return "İlan";
  if (listing.listing_type === "vehicle") {
    return listing.brand || listing.category || listing.sector_data?.model || "Vasıta";
  }
  
  const sec = listing.sector_data || {};
  const rawCatList = [
    sec.property_type,
    sec.propertyType,
    sec.type,
    sec.re_type,
    sec.category,
    sec.sub_category,
    listing.sub_category,
    listing.category,
    listing.type
  ].filter(Boolean).map(s => String(s));
  
  const rawCat = rawCatList.join(" ");
  const titleLower = (listing.title || "").toLowerCase();
  const rawLower = (rawCat || "").toLowerCase();

  const hasHouseIndicator = titleLower.includes("müstakil") || titleLower.includes("mustakil") || titleLower.includes("villa") || titleLower.includes("ev") || titleLower.includes("daire") || titleLower.includes("penthouse") || titleLower.includes("1+1") || titleLower.includes("2+1") || titleLower.includes("3+1") || titleLower.includes("4+1") || titleLower.includes("apartman") || titleLower.includes("stüdyo") || titleLower.includes("studio") || titleLower.includes("rezidans");

  // 2. Arsa Check
  if (rawLower.includes("arsa") || (titleLower.includes("arsa") && !hasHouseIndicator) || sec.type === 'land' || sec.property_type === 'land') {
    if (!rawLower.includes("residence") && !rawLower.includes("konut") && !rawLower.includes("villa") && !rawLower.includes("müstakil")) {
      return "Arsa";
    }
  }

  // 3. Tarla / Arazi Check
  if (rawLower.includes("tarla") || (titleLower.includes("tarla") && !hasHouseIndicator) || rawLower.includes("arazi") || (titleLower.includes("arazi") && !hasHouseIndicator) || titleLower.includes("dönüm") || titleLower.includes("donum")) {
    if (!rawLower.includes("residence") && !rawLower.includes("konut") && !rawLower.includes("villa") && !rawLower.includes("müstakil")) {
      return "Tarla / Arazi";
    }
  }
  
  return "Daire";
}

console.log(formatCategory(listing));
