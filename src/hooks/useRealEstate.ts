import { useState, useEffect } from 'react';
import { RealEstateProperty } from '../types';

export const useRealEstate = (storeId?: number) => {
  const [properties, setProperties] = useState<RealEstateProperty[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProperties = async () => {
    if (!storeId) return;
    setLoading(true);
    // Mocking for now: check localStorage or start empty
    const saved = localStorage.getItem(`lookprice_realestate_${storeId}`);
    if (saved) {
      setProperties(JSON.parse(saved));
    } else {
      setProperties([]);
    }
    setLoading(false);
  };

  const saveProperty = (property: Partial<RealEstateProperty>) => {
    let updated;
    if (property.id) {
       updated = properties.map(p => p.id === property.id ? { ...p, ...property, updated_at: new Date().toISOString() } : p);
    } else {
       const newProp: RealEstateProperty = {
         ...(property as any),
         id: Date.now(),
         store_id: storeId!,
         created_at: new Date().toISOString(),
         updated_at: new Date().toISOString()
       };
       updated = [...properties, newProp];
    }
    setProperties(updated as RealEstateProperty[]);
    localStorage.setItem(`lookprice_realestate_${storeId}`, JSON.stringify(updated));
  };
  
  const deleteProperty = (id: number) => {
    const updated = properties.filter(p => p.id !== id);
    setProperties(updated);
    localStorage.setItem(`lookprice_realestate_${storeId}`, JSON.stringify(updated));
  }

  useEffect(() => {
    fetchProperties();
  }, [storeId]);

  return {
    properties,
    loading,
    fetchProperties,
    saveProperty,
    deleteProperty
  };
};
