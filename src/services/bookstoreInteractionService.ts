export interface BookReview {
  id: string;
  productId: number | string;
  storeId?: number | string;
  orderId?: number | string;
  bookTitle?: string;
  rating: number; // 1 to 5
  comment: string;
  authorName: string;
  createdAt: string;
  verifiedPurchase: boolean;
}

// Storage keys
const getFavoritesKey = (storeId?: number | string) => `bookstore_favs_${storeId || 'default'}`;
const getReviewsKey = (productId: number | string) => `bookstore_reviews_p_${productId}`;
const getStoreReviewsKey = (storeId?: number | string) => `bookstore_store_reviews_${storeId || 'default'}`;

// Dispatch custom events so all mounted components re-render immediately on change
const dispatchFavChange = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('bookstore-favorites-changed'));
  }
};

const dispatchReviewChange = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('bookstore-reviews-changed'));
  }
};

export const bookstoreInteraction = {
  // --- FAVORITES ---
  getFavorites: (storeId?: number | string): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(getFavoritesKey(storeId));
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  isFavorite: (productId: number | string, storeId?: number | string): boolean => {
    const favs = bookstoreInteraction.getFavorites(storeId);
    return favs.includes(String(productId));
  },

  toggleFavorite: (productId: number | string, storeId?: number | string): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      const idStr = String(productId);
      const favs = bookstoreInteraction.getFavorites(storeId);
      let updated: string[];
      let isNowFav: boolean;
      if (favs.includes(idStr)) {
        updated = favs.filter(id => id !== idStr);
        isNowFav = false;
      } else {
        updated = [...favs, idStr];
        isNowFav = true;
      }
      localStorage.setItem(getFavoritesKey(storeId), JSON.stringify(updated));
      dispatchFavChange();
      return isNowFav;
    } catch (e) {
      return false;
    }
  },

  // --- REVIEWS ---
  getProductReviews: (productId: number | string): BookReview[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(getReviewsKey(productId));
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  getAllCustomerReviews: (storeId?: number | string): BookReview[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(getStoreReviewsKey(storeId));
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  addReview: (data: {
    productId: number | string;
    storeId?: number | string;
    orderId?: number | string;
    bookTitle?: string;
    rating: number;
    comment: string;
    authorName: string;
    verifiedPurchase?: boolean;
  }): BookReview => {
    const newReview: BookReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      productId: data.productId,
      storeId: data.storeId,
      orderId: data.orderId,
      bookTitle: data.bookTitle,
      rating: Math.max(1, Math.min(5, Math.round(data.rating))),
      comment: data.comment.trim(),
      authorName: data.authorName.trim() || 'Okur',
      createdAt: new Date().toISOString(),
      verifiedPurchase: data.verifiedPurchase ?? true
    };

    if (typeof window !== 'undefined') {
      try {
        // Save to product-specific reviews
        const prodReviews = bookstoreInteraction.getProductReviews(data.productId);
        localStorage.setItem(getReviewsKey(data.productId), JSON.stringify([newReview, ...prodReviews]));

        // Save to store-wide reviews
        const storeReviews = bookstoreInteraction.getAllCustomerReviews(data.storeId);
        localStorage.setItem(getStoreReviewsKey(data.storeId), JSON.stringify([newReview, ...storeReviews]));

        dispatchReviewChange();
      } catch (e) {
        console.error('Error saving review:', e);
      }
    }

    return newReview;
  },

  getReviewStats: (productId: number | string, baseScore: number = 4.8) => {
    const reviews = bookstoreInteraction.getProductReviews(productId);
    if (reviews.length === 0) {
      return {
        averageRating: baseScore,
        reviewCount: 0,
        reviews: []
      };
    }
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = Number((sum / reviews.length).toFixed(1));
    return {
      averageRating: avg,
      reviewCount: reviews.length,
      reviews
    };
  }
};
