// PWA utilities for Kerala Horizon

export interface PWAInstallPrompt {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

class PWAManager {
  private deferredPrompt: PWAInstallPrompt | null = null;
  private isInstalled = false;
  private isOnline = navigator.onLine;

  constructor() {
    this.initializePWA();
  }

  private initializePWA() {
    // Register service worker
    this.registerServiceWorker();
    
    // Listen for install prompt
    this.setupInstallPrompt();
    
    // Monitor online/offline status
    this.setupNetworkListeners();
    
    // Check if app is already installed
    this.checkInstallStatus();
  }

  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully:', registration);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                this.showUpdateAvailable();
              }
            });
          }
        });
        
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  private setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event so it can be triggered later
      this.deferredPrompt = e as any;
      
      // Show install button
      this.showInstallButton();
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.isInstalled = true;
      this.hideInstallButton();
      this.showInstalledMessage();
    });
  }

  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.showOnlineMessage();
      this.syncOfflineActions();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showOfflineMessage();
    });
  }

  private checkInstallStatus() {
    // Check if running as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
    }
  }

  // Public methods
  async installApp(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      // Show the install prompt
      await this.deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        this.deferredPrompt = null;
        return true;
      } else {
        console.log('User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      console.error('Error during app installation:', error);
      return false;
    }
  }

  isAppInstalled(): boolean {
    return this.isInstalled;
  }

  isAppOnline(): boolean {
    return this.isOnline;
  }

  canInstall(): boolean {
    return this.deferredPrompt !== null;
  }

  // Offline storage management
  async storeOfflineAction(action: {
    id: string;
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
    timestamp: number;
  }) {
    try {
      const offlineActions = this.getOfflineActions();
      offlineActions.push(action);
      localStorage.setItem('kerala-horizon-offline-actions', JSON.stringify(offlineActions));
    } catch (error) {
      console.error('Failed to store offline action:', error);
    }
  }

  getOfflineActions(): any[] {
    try {
      const stored = localStorage.getItem('kerala-horizon-offline-actions');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get offline actions:', error);
      return [];
    }
  }

  async syncOfflineActions() {
    if (!this.isOnline) return;

    const actions = this.getOfflineActions();
    if (actions.length === 0) return;

    console.log(`Syncing ${actions.length} offline actions...`);

    for (const action of actions) {
      try {
        await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });
        
        // Remove successful action
        this.removeOfflineAction(action.id);
        console.log('Synced offline action:', action.id);
      } catch (error) {
        console.error('Failed to sync offline action:', action.id, error);
      }
    }
  }

  private removeOfflineAction(id: string) {
    const actions = this.getOfflineActions().filter(action => action.id !== id);
    localStorage.setItem('kerala-horizon-offline-actions', JSON.stringify(actions));
  }

  // UI feedback methods
  private showInstallButton() {
    const event = new CustomEvent('pwa-install-available');
    window.dispatchEvent(event);
  }

  private hideInstallButton() {
    const event = new CustomEvent('pwa-install-completed');
    window.dispatchEvent(event);
  }

  private showInstalledMessage() {
    this.showNotification('App installed successfully! You can now use Kerala Horizon offline.', 'success');
  }

  private showUpdateAvailable() {
    const event = new CustomEvent('pwa-update-available');
    window.dispatchEvent(event);
  }

  private showOnlineMessage() {
    this.showNotification('You\'re back online! Syncing your data...', 'success');
  }

  private showOfflineMessage() {
    this.showNotification('You\'re offline. Some features may be limited.', 'warning');
  }

  private showNotification(message: string, type: 'success' | 'warning' | 'error' = 'success') {
    const event = new CustomEvent('pwa-notification', {
      detail: { message, type }
    });
    window.dispatchEvent(event);
  }

  // Cache management
  async clearCache() {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('All caches cleared');
    }
  }

  async getCacheSize(): Promise<number> {
    if ('caches' in window && 'storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    }
    return 0;
  }
}

// Create singleton instance
export const pwaManager = new PWAManager();

// Export utility functions
export const installPWA = () => pwaManager.installApp();
export const isPWAInstalled = () => pwaManager.isAppInstalled();
export const canInstallPWA = () => pwaManager.canInstall();
export const isOnline = () => pwaManager.isAppOnline();
export const storeOfflineAction = (action: any) => pwaManager.storeOfflineAction(action);
export const syncOfflineActions = () => pwaManager.syncOfflineActions();























