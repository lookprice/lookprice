
/**
 * Normalizes a string for search, especially handling Turkish characters
 * and case-insensitivity.
 */
export const normalizeSearch = (text: string): string => {
  if (!text) return "";
  
  // First convert to Turkish lowercase to handle İ -> i and I -> ı
  let normalized = text.toLocaleLowerCase('tr-TR');
  
  // Replace Turkish special characters with normalized equivalents for ultra-tolerant matching
  normalized = normalized
    .replace(/ı/g, 'i')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u');
  
  return normalized;
};

/**
 * Checks if a search term matches any of the fields in an object
 */
export const matchesSearch = (item: any, search: string, fields: string[]): boolean => {
  const normalizedSearch = normalizeSearch(search);
  if (!normalizedSearch) return true;
  
  const searchTerms = normalizedSearch.split(/\s+/).filter(Boolean);
  if (searchTerms.length === 0) return true;
  
  return searchTerms.every(term => {
    return fields.some(field => {
      const value = item[field];
      if (value === undefined || value === null) return false;
      return normalizeSearch(String(value)).includes(term);
    });
  });
};
