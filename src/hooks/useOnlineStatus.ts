'use client';

import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  // Initialize with undefined to avoid hydration mismatch
  // Server will render as if online, client will update after mount
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    // Check initial status after mount
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    // Event handlers
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}