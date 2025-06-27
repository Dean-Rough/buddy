# PWA Implementation Guide - Onda Platform

## Overview

This guide provides step-by-step instructions for implementing Progressive Web App (PWA) features for the Onda platform. Target timeline: 2-4 weeks for production-ready PWA.

## Phase 1: Core PWA Setup (Week 1)

### 1.1 Create Web App Manifest

Create `public/manifest.json`:

```json
{
  "name": "Onda - Safe AI Chat for Kids",
  "short_name": "Onda",
  "description": "A safe AI companion for children aged 6-12",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "orientation": "portrait-primary",
  "scope": "/",
  "lang": "en-GB",
  "categories": ["education", "kids"],
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/chat-mobile.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshots/parent-dashboard.png",
      "sizes": "1024x768",
      "type": "image/png",
      "form_factor": "wide"
    }
  ]
}
```

### 1.2 Update HTML Head Meta Tags

In `app/layout.tsx`, add PWA meta tags:

```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* PWA Configuration */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="background-color" content="#ffffff" />

        {/* Apple-specific PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Onda" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />

        {/* Splash screens for iOS */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/iphone5_splash.png"
          media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)"
        />

        {/* Microsoft Windows */}
        <meta name="msapplication-TileColor" content="#000000" />
        <meta
          name="msapplication-TileImage"
          content="/icons/ms-icon-144x144.png"
        />

        {/* Viewport for mobile */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no, viewport-fit=cover"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 1.3 Basic Service Worker

Create `public/sw.js`:

```javascript
const CACHE_NAME = 'onda-v1.0.0';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - network first for API, cache first for static
self.addEventListener('fetch', event => {
  const { request } = event;

  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }

  // API requests - network first
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const responseClone = response.clone();
          caches
            .open(DYNAMIC_CACHE)
            .then(cache => cache.put(request, responseClone));
          return response;
        })
        .catch(() => {
          return caches
            .match(request)
            .then(response => response || caches.match('/offline'));
        })
    );
    return;
  }

  // Static assets - cache first
  event.respondWith(
    caches.match(request).then(response => {
      if (response) {
        return response;
      }

      return fetch(request)
        .then(response => {
          const responseClone = response.clone();
          caches
            .open(DYNAMIC_CACHE)
            .then(cache => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match('/offline'));
    })
  );
});

// Push notification handling
self.addEventListener('push', event => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url,
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/view-icon.png',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss-icon.png',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});
```

### 1.4 Service Worker Registration

Create `components/pwa/ServiceWorkerProvider.tsx`:

```tsx
'use client';

import { useEffect } from 'react';

export default function ServiceWorkerProvider() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          console.log('SW registered:', registration);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (
                  newWorker.state === 'installed' &&
                  navigator.serviceWorker.controller
                ) {
                  // New content available, notify user
                  if (confirm('New version available! Reload to update?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch(error => {
          console.log('SW registration failed:', error);
        });
    }
  }, []);

  return null;
}
```

## Phase 2: Install Experience (Week 2)

### 2.1 Install Prompt Component

Create `components/pwa/InstallPrompt.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { BrutalButton } from '@/components/ui/brutal-button';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA installed');
      // Track installation
      gtag('event', 'pwa_install', {
        event_category: 'engagement',
        value: 1,
      });
    }

    setInstallPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Show again after 3 days
    localStorage.setItem('install-prompt-dismissed', Date.now().toString());
  };

  if (!showPrompt || !installPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white border-2 border-black p-4 rounded-lg shadow-lg z-50">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm">Add Onda to Home Screen</h3>
          <p className="text-xs text-gray-600 mt-1">
            Get the full app experience with one tap!
          </p>
        </div>
        <div className="flex gap-2 ml-4">
          <BrutalButton variant="white" size="sm" onClick={handleDismiss}>
            Later
          </BrutalButton>
          <BrutalButton variant="blue" size="sm" onClick={handleInstall}>
            Install
          </BrutalButton>
        </div>
      </div>
    </div>
  );
}
```

### 2.2 iOS Install Instructions

Create `components/pwa/IOSInstallInstructions.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Share, Plus, Home } from 'lucide-react';

export default function IOSInstallInstructions() {
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if already installed
    const isStandalone = window.matchMedia(
      '(display-mode: standalone)'
    ).matches;
    setIsInstalled(isStandalone);

    // Show instructions if iOS and not installed
    if (iOS && !isStandalone) {
      const hasSeenInstructions = localStorage.getItem('ios-install-seen');
      if (!hasSeenInstructions) {
        setShowInstructions(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setShowInstructions(false);
    localStorage.setItem('ios-install-seen', 'true');
  };

  if (!isIOS || isInstalled || !showInstructions) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Add to Home Screen</h3>
          <button onClick={handleDismiss} className="text-gray-500">
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
            <div className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded">
              1
            </div>
            <div className="flex items-center gap-2">
              <span>Tap the share button</span>
              <Share size={16} />
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
            <div className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded">
              2
            </div>
            <div className="flex items-center gap-2">
              <span>Select "Add to Home Screen"</span>
              <Plus size={16} />
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
            <div className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded">
              3
            </div>
            <div className="flex items-center gap-2">
              <span>Find Onda on your home screen</span>
              <Home size={16} />
            </div>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="w-full mt-6 bg-black text-white py-3 rounded font-bold"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
```

## Phase 3: Offline Functionality (Week 3)

### 3.1 Offline Chat Support

Create `hooks/useOfflineSync.ts`:

```typescript
import { useState, useEffect } from 'react';

interface OfflineMessage {
  id: string;
  content: string;
  timestamp: number;
  synced: boolean;
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [offlineMessages, setOfflineMessages] = useState<OfflineMessage[]>([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const queueMessage = (content: string) => {
    const message: OfflineMessage = {
      id: Date.now().toString(),
      content,
      timestamp: Date.now(),
      synced: false,
    };

    setOfflineMessages(prev => [...prev, message]);

    // Store in localStorage
    const stored = localStorage.getItem('offline-messages') || '[]';
    const messages = JSON.parse(stored);
    messages.push(message);
    localStorage.setItem('offline-messages', JSON.stringify(messages));

    return message.id;
  };

  const syncMessages = async () => {
    if (!isOnline || offlineMessages.length === 0) return;

    try {
      for (const message of offlineMessages) {
        if (!message.synced) {
          await fetch('/api/chat/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: message.content,
              timestamp: message.timestamp,
            }),
          });

          // Mark as synced
          setOfflineMessages(prev =>
            prev.map(m => (m.id === message.id ? { ...m, synced: true } : m))
          );
        }
      }

      // Clean up synced messages
      const unsyncedMessages = offlineMessages.filter(m => !m.synced);
      setOfflineMessages(unsyncedMessages);
      localStorage.setItem(
        'offline-messages',
        JSON.stringify(unsyncedMessages)
      );
    } catch (error) {
      console.error('Failed to sync messages:', error);
    }
  };

  useEffect(() => {
    if (isOnline) {
      syncMessages();
    }
  }, [isOnline]);

  return {
    isOnline,
    queueMessage,
    offlineMessages,
    syncMessages,
  };
}
```

### 3.2 Offline Indicator

Create `components/ui/OfflineIndicator.tsx`:

```tsx
'use client';

import { Wifi, WifiOff } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';

export default function OfflineIndicator() {
  const { isOnline, offlineMessages } = useOfflineSync();

  if (isOnline && offlineMessages.length === 0) return null;

  return (
    <div
      className={`fixed top-4 right-4 px-3 py-2 rounded-lg text-sm font-medium z-40 ${
        isOnline
          ? 'bg-green-100 text-green-800 border border-green-200'
          : 'bg-red-100 text-red-800 border border-red-200'
      }`}
    >
      <div className="flex items-center gap-2">
        {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
        <span>
          {isOnline
            ? offlineMessages.length > 0
              ? `Syncing ${offlineMessages.length} messages...`
              : 'Connected'
            : 'Offline mode'}
        </span>
      </div>
    </div>
  );
}
```

## Phase 4: Performance & Polish (Week 4)

### 4.1 Performance Monitoring

Create `lib/performance.ts`:

```typescript
export function measurePerformance() {
  if (typeof window === 'undefined') return;

  // Core Web Vitals
  const observer = new PerformanceObserver(list => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'navigation') {
        const navEntry = entry as PerformanceNavigationTiming;
        console.log(
          'FCP:',
          navEntry.domContentLoadedEventEnd -
            navEntry.domContentLoadedEventStart
        );
      }

      if (entry.entryType === 'largest-contentful-paint') {
        console.log('LCP:', entry.startTime);
      }

      if (entry.entryType === 'first-input') {
        console.log('FID:', entry.processingStart - entry.startTime);
      }
    }
  });

  observer.observe({
    entryTypes: ['navigation', 'largest-contentful-paint', 'first-input'],
  });
}

export function trackPWAInstall() {
  if (typeof window === 'undefined') return;

  window.addEventListener('appinstalled', () => {
    console.log('PWA installed');
    // Track with analytics
    gtag('event', 'pwa_installed', {
      event_category: 'engagement',
    });
  });
}
```

### 4.2 Update Available Notification

Create `components/pwa/UpdateNotification.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

export default function UpdateNotification() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [newWorker, setNewWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      navigator.serviceWorker.ready.then(registration => {
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (worker) {
            worker.addEventListener('statechange', () => {
              if (
                worker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                setUpdateAvailable(true);
                setNewWorker(worker);
              }
            });
          }
        });
      });
    }
  }, []);

  const handleUpdate = () => {
    if (newWorker) {
      newWorker.postMessage({ action: 'skipWaiting' });
    }
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg z-50">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm">Update Available</h3>
          <p className="text-xs opacity-90 mt-1">
            New features and improvements ready!
          </p>
        </div>
        <button
          onClick={handleUpdate}
          className="flex items-center gap-2 bg-white text-blue-500 px-4 py-2 rounded font-bold text-sm"
        >
          <RefreshCw size={16} />
          Update
        </button>
      </div>
    </div>
  );
}
```

## Testing Checklist

### Manual Testing

- [ ] Install on iOS Safari (Add to Home Screen)
- [ ] Install on Android Chrome (Install prompt)
- [ ] Test offline functionality
- [ ] Verify push notifications (if implemented)
- [ ] Test app icon and splash screen
- [ ] Verify full-screen mode
- [ ] Test update mechanism

### Automated Testing

```bash
# Lighthouse audit
npm install -g lighthouse
lighthouse https://your-app.com --view

# PWA audit specifically
lighthouse https://your-app.com --only-categories=pwa --view
```

## Production Deployment

### Environment Variables

Add to `.env.production`:

```bash
NEXT_PUBLIC_PWA_ENABLED=true
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

### Vercel Configuration

Update `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/manifest.json",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000"
        }
      ]
    }
  ]
}
```

## Success Metrics

- **Installation Rate**: >30% of users add to home screen
- **Offline Usage**: >5% of sessions include offline interactions
- **Performance**: Lighthouse PWA score >90
- **Retention**: PWA users have >40% higher retention
- **Parent Satisfaction**: >4.5/5 rating for convenience

This implementation provides a production-ready PWA that delivers native app experience while maintaining the web-first advantages crucial for child safety AI platforms.
