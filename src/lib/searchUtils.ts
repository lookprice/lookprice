
/**
 * Normalizes a string for search, especially handling Turkish characters
 * and case-insensitivity.
 */
export const normalizeSearch = (text: string): string => {
  if (!text) return "";
  
  // First convert to Turkish lowercase to handle İ -> i and I -> ı
  let normalized = text.toLocaleLowerCase('tr-TR');
  
  // Further normalization to handle mixed cases and ensure consistent comparisons:
  // 1. replace 'ı' with 'i' (as users often search 'migros' for 'MİGROS' or 'mıgros')
  // 2. remove common accents if necessary, but here we focus on the Turkish casing issue
  normalized = normalized.replace(/ı/g, 'i');
  
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
