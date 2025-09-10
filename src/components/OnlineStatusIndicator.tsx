'use client';

import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Wifi, WifiOff, Cloud, CloudOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '@/lib/db';

export function OnlineStatusIndicator() {
  const isOnline = useOnlineStatus();
  const [unsyncedCount, setUnsyncedCount] = useState(0);

  useEffect(() => {
    // Check for unsynced items
    const checkUnsyncedItems = async () => {
      const count = await db.getUnsyncedCount();
      setUnsyncedCount(count);
    };

    checkUnsyncedItems();
    
    // Check periodically
    const interval = setInterval(checkUnsyncedItems, 10000); // Every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-600">Online</span>
          {unsyncedCount > 0 && (
            <span className="text-xs text-muted-foreground">
              ({unsyncedCount} to sync)
            </span>
          )}
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-orange-600" />
          <span className="text-sm font-medium text-orange-600">Offline Mode</span>
          {unsyncedCount > 0 && (
            <span className="text-xs text-muted-foreground">
              ({unsyncedCount} saved locally)
            </span>
          )}
        </>
      )}
    </div>
  );
}

// Compact version for mobile header
export function OnlineStatusBadge() {
  const isOnline = useOnlineStatus();
  
  return (
    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
      isOnline ? 'bg-green-100' : 'bg-orange-100'
    }`}>
      {isOnline ? (
        <Cloud className="h-4 w-4 text-green-600" />
      ) : (
        <CloudOff className="h-4 w-4 text-orange-600" />
      )}
    </div>
  );
}