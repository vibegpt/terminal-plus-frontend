// PWA Service for handling service worker registration and updates
class PWAService {
  private registration: ServiceWorkerRegistration | null = null;
  private updateAvailable = false;

  async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully:', this.registration);

        // Listen for updates
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration?.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.updateAvailable = true;
                this.notifyUpdateAvailable();
              }
            });
          }
        });

        // Listen for controller change (app update)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });

      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  async unregisterServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.unregister()));
        console.log('Service Workers unregistered');
      } catch (error) {
        console.error('Service Worker unregistration failed:', error);
      }
    }
  }

  private notifyUpdateAvailable(): void {
    // You can customize this notification
    if (confirm('A new version of Terminal Plus is available. Would you like to update?')) {
      this.updateApp();
    }
  }

  updateApp(): void {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  isUpdateAvailable(): boolean {
    return this.updateAvailable;
  }

  async getRegistration(): Promise<ServiceWorkerRegistration | null> {
    return this.registration;
  }

  // Check if app is running in standalone mode
  isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches || 
           (window.navigator as any).standalone === true;
  }

  // Check if app can be installed
  canInstall(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Get device type for PWA features
  getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const userAgent = navigator.userAgent;
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      return 'mobile';
    } else if (/iPad|Android/i.test(userAgent)) {
      return 'tablet';
    }
    return 'desktop';
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  }

  // Send notification
  async sendNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (this.registration && Notification.permission === 'granted') {
      await this.registration.showNotification(title, {
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        ...options
      });
    }
  }

  // Background sync
  async requestBackgroundSync(tag: string): Promise<void> {
    if (this.registration && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        await this.registration.sync.register(tag);
      } catch (error) {
        console.error('Background sync registration failed:', error);
      }
    }
  }

  // Cache management
  async clearCache(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
  }

  // Get cache size
  async getCacheSize(): Promise<number> {
    if (!('caches' in window)) return 0;

    let totalSize = 0;
    const cacheNames = await caches.keys();
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }
    
    return totalSize;
  }
}

// Export singleton instance
export const pwaService = new PWAService();

// Auto-register service worker
if (typeof window !== 'undefined') {
  pwaService.registerServiceWorker();
}
