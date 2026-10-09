import { api } from "./api";

export const generateProductDescription = async (productData: any, lang: string = 'tr') => {
  const res = await api.generateProductDescription(productData.name, productData.category, lang);
  return res.text;
};

export const generateBlogContent = async (topic: string, storeName: string, lang: string = 'tr') => {
  const res = await api.generateBlog(topic, storeName, lang);
  return res;
};

export const findProductImageUrl = async (product: { name: string, barcode?: string, id?: number }, storeId?: number) => {
  const res = await api.autoFindImage({ id: product.id }, storeId);
  if (res && res.success && res.results && res.results[0] && res.results[0].status === 'found') {
    return res.results[0].url;
  }
  return null;
};
