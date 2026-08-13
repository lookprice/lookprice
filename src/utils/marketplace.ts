export function formatLocation(listing: any) {
  return (listing.sector_data?.city || listing.location || "Belirtilmemiş");
}

export function formatCategory(listing: any) {
    return listing.category || "İlan";
}
