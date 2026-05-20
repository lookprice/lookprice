import { useState, useEffect } from 'react';
import { RealEstateProperty } from '../types';
import { api } from '../services/api';

export const useRealEstate = (storeId?: number) => {
  const [properties, setProperties] = useState<RealEstateProperty[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProperties = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await api.getProperties(storeId);
      setProperties(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const saveProperty = async (property: Partial<RealEstateProperty>) => {
    try {
      if (property.id) {
        await api.updateProperty(property.id, property);
      } else {
        await api.addProperty(property);
      }
      await fetchProperties();
    } catch (error) {
      console.error('Error saving property:', error);
      throw error;
    }
  };
  
  const deleteProperty = async (id: number) => {
    try {
      await api.deleteProperty(id);
      await fetchProperties();
    } catch (error) {
      console.error('Error deleting property:', error);
      throw error;
    }
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
