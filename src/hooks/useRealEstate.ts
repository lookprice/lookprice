import { useState, useEffect } from 'react';
import { RealEstateProperty, RealEstateContact } from '../types';
import { api } from '../services/api';

export const useRealEstate = (storeId?: number) => {
  const [properties, setProperties] = useState<RealEstateProperty[]>([]);
  const [contacts, setContacts] = useState<RealEstateContact[]>([]);
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

  const fetchContacts = async () => {
    if (!storeId) return;
    try {
      const res = await api.getRealEstateContacts(undefined, storeId);
      setContacts(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setContacts([]);
    }
  };

  const saveProperty = async (property: Partial<RealEstateProperty>) => {
    try {
      let res;
      const payload = { ...property, store_id: storeId };
      if (property.id) {
        res = await api.updateProperty(property.id, payload);
      } else {
        res = await api.addProperty(payload);
      }
      if (res && res.error) {
        throw new Error(res.error);
      }
      await fetchProperties();
    } catch (error) {
      console.error('Error saving property:', error);
      throw error;
    }
  };
  
  const saveContact = async (contact: Partial<RealEstateContact>) => {
    try {
      let res;
      const payload = { ...contact, store_id: storeId };
      if (contact.id) {
        res = await api.updateRealEstateContact(contact.id, payload, storeId);
      } else {
        res = await api.addRealEstateContact(payload, storeId);
      }
      if (res && res.error) {
        throw new Error(res.error);
      }
      await fetchContacts();
    } catch (error) {
      console.error('Error saving contact:', error);
      throw error;
    }
  };

  const deleteProperty = async (id: number) => {
    try {
      await api.deleteProperty(id, storeId);
      await fetchProperties();
    } catch (error) {
      console.error('Error deleting property:', error);
      throw error;
    }
  }

  const deleteContact = async (id: string) => {
    try {
      await api.deleteRealEstateContact(id, storeId);
      await fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  }

  useEffect(() => {
    fetchProperties();
    fetchContacts();
  }, [storeId]);

  return {
    properties,
    contacts,
    loading,
    fetchProperties,
    fetchContacts,
    saveProperty,
    saveContact,
    deleteProperty,
    deleteContact
  };
};
