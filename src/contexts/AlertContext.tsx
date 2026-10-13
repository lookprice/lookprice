import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Alert } from '../services/AlertService';

interface AlertContextType {
  alerts: Alert[];
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp'>) => void;
  removeAlert: (id: string) => void;
  clearAlerts: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const addAlert = (newAlert: Omit<Alert, 'id' | 'timestamp'>) => {
    const alert: Alert = {
      ...newAlert,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };
    setAlerts((prev) => [alert, ...prev]);
  };

  const removeAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const clearAlerts = () => setAlerts([]);

  return (
    <AlertContext.Provider value={{ alerts, addAlert, removeAlert, clearAlerts }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error('useAlerts must be used within AlertProvider');
  return context;
};
