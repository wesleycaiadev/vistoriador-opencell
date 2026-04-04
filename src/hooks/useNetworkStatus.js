import { useState, useEffect, useCallback } from 'react';

/**
 * Hook que monitora o estado de rede do navegador em tempo real.
 * Usa navigator.onLine como source of truth + event listeners
 * para transições online/offline.
 *
 * Retorna { isOnline: boolean } — reativo a mudanças de conectividade.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  const handleOnline = useCallback(() => setIsOnline(true), []);
  const handleOffline = useCallback(() => setIsOnline(false), []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return { isOnline };
}
