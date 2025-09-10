'use client';

import { useEffect, useState } from 'react';

export default function ServiceWorkerRegistration() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('Service Worker registered:', reg);
          setRegistration(reg);

          // Check for updates
          reg.addEventListener('updatefound', () => {
            console.log('Update found!');
            const newWorker = reg.installing;
            
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('New content available, please refresh');
                  setUpdateAvailable(true);
                }
              });
            }
          });

          // Handle messages from service worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'SW_UPDATED') {
              console.log('Service worker updated');
              setUpdateAvailable(true);
            }
          });

          // Check for updates periodically
          setInterval(() => {
            reg.update();
          }, 30000); // Check every 30 seconds in development

        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });

      // Listen for controller changes (when SW updates)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Controller changed, reloading page');
        window.location.reload();
      });
    }
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    setUpdateAvailable(false);
  };

  // Show update notification
  if (updateAvailable) {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50">
        <p className="mb-2">New version available!</p>
        <div className="flex gap-2">
          <button
            onClick={handleUpdate}
            className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium"
          >
            Update Now
          </button>
          <button
            onClick={() => setUpdateAvailable(false)}
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-medium"
          >
            Later
          </button>
        </div>
      </div>
    );
  }

  return null;
}