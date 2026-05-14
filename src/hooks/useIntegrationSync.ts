import { useState } from 'react';
import { Logger } from '../services/logger';

export const useIntegrationSync = (integrationName: string, t: any) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const runSync = async (syncFn: () => Promise<any>, onSuccess: (res: any) => void) => {
    setIsSyncing(true);
    setLastError(null);
    try {
      const res = await syncFn();
      
      if (res && res.error) {
        throw new Error(typeof res.error === 'string' ? res.error : JSON.stringify(res.error));
      }
      
      setLastSync(new Date());
      onSuccess(res);
    } catch (error: any) {
      const errorMessage = error.message || t.errorOccurred || "Sync failed";
      setLastError(errorMessage);
      Logger.error(`Sync failed for ${integrationName}`, { 
        error: error.message, 
        stack: error.stack 
      });
      alert(`${t.errorOccurred || 'Error'}: ${errorMessage}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const retry = async (syncFn: () => Promise<any>, onSuccess: (res: any) => void) => {
    await runSync(syncFn, onSuccess);
  };

  return { isSyncing, runSync, retry, lastError, lastSync };
};
