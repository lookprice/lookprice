const filters = { search: "", category: null, tags: [] };
const isFiltersActive = filters.search || filters.category || filters.tags?.length > 0;
console.log(isFiltersActive);
