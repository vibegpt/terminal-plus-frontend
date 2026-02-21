// Progressive Web App types for Terminal+

// PWA status types
export type PWAStatus = 'checking' | 'available' | 'installed' | 'error' | 'unsupported';

// Cache status types
export type CacheStatus = 'idle' | 'cached' | 'updating' | 'update-available' | 'updated' | 'error' | 'empty' | 'unsupported';

// Installation prompt interface
export interface InstallationPrompt {
  type: 'install';
  title: string;
  description: string;
  icon: string;
  screenshots: string[];
  metadata?: {
    themeColor?: string;
    backgroundColor?: string;
    display?: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
    orientation?: 'portrait' | 'landscape' | 'any';
  };
}

// Offline data interface
export interface OfflineData {
  amenities: any[];
  userData: any | null;
  lastSync: Date | null;
  metadata?: {
    totalSize: number;
    lastUpdated: Date;
    version: string;
  };
}

// PWA configuration interface
export interface PWAConfig {
  autoInstall: boolean;
  offlineMode: boolean;
  backgroundSync: boolean;
  pushNotifications: boolean;
  cacheStrategy: 'network-first' | 'cache-first' | 'stale-while-revalidate';
  metadata?: {
    name: string;
    shortName: string;
    description: string;
    themeColor: string;
    backgroundColor: string;
    display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
    orientation: 'portrait' | 'landscape' | 'any';
    scope: string;
    startUrl: string;
  };
}

// Service worker registration interface
export interface ServiceWorkerRegistration {
  id: string;
  scope: string;
  state: 'installing' | 'installed' | 'activating' | 'activated' | 'redundant';
  updateViaCache: 'all' | 'imports' | 'none';
  waiting?: ServiceWorker;
  active?: ServiceWorker;
  installing?: ServiceWorker;
  onupdatefound?: ((event: Event) => void) | null;
}

// Cache storage interface
export interface CacheStorage {
  name: string;
  size: number;
  lastUpdated: Date;
  entries: number;
  strategy: 'network-first' | 'cache-first' | 'stale-while-revalidate';
  metadata?: {
    version: string;
    description: string;
    maxAge: number;
  };
}

// Background sync interface
export interface BackgroundSync {
  id: string;
  tag: string;
  state: 'pending' | 'completed' | 'failed';
  timestamp: Date;
  data?: any;
  retryCount: number;
  maxRetries: number;
}

// Push notification interface
export interface PushNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction: boolean;
  silent: boolean;
  timestamp: Date;
  isRead: boolean;
}

// PWA analytics interface
export interface PWAAnalytics {
  installations: number;
  uninstallations: number;
  installationsByPlatform: Record<string, number>;
  cacheHits: number;
  cacheMisses: number;
  offlineUsage: number;
  backgroundSyncs: number;
  pushNotifications: {
    sent: number;
    delivered: number;
    clicked: number;
  };
  performance: {
    loadTime: number;
    timeToInteractive: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
  };
}

// PWA event interface
export interface PWAEvent {
  type: 'install' | 'uninstall' | 'update' | 'offline' | 'online' | 'background-sync' | 'push';
  timestamp: Date;
  data?: any;
  metadata?: Record<string, any>;
}

// PWA error interface
export interface PWAError {
  code: string;
  message: string;
  type: 'installation' | 'cache' | 'sync' | 'notification' | 'service-worker' | 'unknown';
  timestamp: Date;
  recoverable: boolean;
  suggestions?: string[];
}

// PWA notification interface
export interface PWANotification {
  id: string;
  type: 'install' | 'update' | 'offline' | 'sync' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

// PWA export data interface
export interface PWAExportData {
  config: PWAConfig;
  offlineData: OfflineData;
  analytics: PWAAnalytics;
  events: PWAEvent[];
  errors: PWAError[];
  exportDate: Date;
  exportFormat: 'json' | 'csv' | 'pdf';
  privacyLevel: 'full' | 'anonymized' | 'aggregated';
}

// PWA API response interface
export interface PWAApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  metadata?: {
    version?: string;
    timestamp?: Date;
  };
}

// PWA API error interface
export interface PWAApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  retryable: boolean;
}

// PWA storage interface
export interface PWAStorage {
  quota: number;
  usage: number;
  available: number;
  percentage: number;
  breakdown: {
    cache: number;
    indexedDB: number;
    localStorage: number;
    sessionStorage: number;
  };
}

// PWA performance interface
export interface PWAPerformance {
  loadTime: number;
  timeToInteractive: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  totalBlockingTime: number;
  speedIndex: number;
}

// PWA accessibility interface
export interface PWAAccessibility {
  screenReader: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';
  colorBlindness: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  keyboardNavigation: boolean;
  voiceControl: boolean;
}

// PWA security interface
export interface PWASecurity {
  https: boolean;
  serviceWorker: boolean;
  contentSecurityPolicy: boolean;
  crossOriginIsolation: boolean;
  secureContext: boolean;
  permissions: {
    notifications: 'granted' | 'denied' | 'default';
    geolocation: 'granted' | 'denied' | 'default';
    camera: 'granted' | 'denied' | 'default';
    microphone: 'granted' | 'denied' | 'default';
  };
}

// PWA compatibility interface
export interface PWACompatibility {
  serviceWorker: boolean;
  cacheAPI: boolean;
  pushAPI: boolean;
  backgroundSync: boolean;
  webAppManifest: boolean;
  installPrompt: boolean;
  beforeInstallPrompt: boolean;
  displayMode: boolean;
  orientation: boolean;
  themeColor: boolean;
}

// Utility types for PWA features
export type PWAFeature = 'installation' | 'caching' | 'background-sync' | 'push-notifications' | 'offline' | 'analytics';

export type PWADisplayMode = 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';

export type PWAOrientation = 'portrait' | 'landscape' | 'any';

export type PWACacheStrategy = 'network-first' | 'cache-first' | 'stale-while-revalidate';

export type PWAInstallationSource = 'browser' | 'app-store' | 'play-store' | 'manual';

// PWA manifest interface
export interface PWAManifest {
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  scope: string;
  display: PWADisplayMode;
  orientation: PWAOrientation;
  theme_color: string;
  background_color: string;
  icons: Array<{
    src: string;
    sizes: string;
    type: string;
    purpose?: string;
  }>;
  screenshots?: Array<{
    src: string;
    sizes: string;
    type: string;
    form_factor?: 'narrow' | 'wide';
  }>;
  categories?: string[];
  lang?: string;
  dir?: 'ltr' | 'rtl' | 'auto';
  prefer_related_applications?: boolean;
  related_applications?: Array<{
    platform: string;
    url: string;
    id?: string;
  }>;
}

// PWA service worker interface
export interface PWAServiceWorker {
  id: string;
  state: 'installing' | 'installed' | 'activating' | 'activated' | 'redundant';
  scriptURL: string;
  scope: string;
  onstatechange?: ((event: Event) => void) | null;
  onerror?: ((event: Event) => void) | null;
  postMessage: (message: any, transfer?: Transferable[]) => void;
  skipWaiting: () => Promise<void>;
}

// PWA installation interface
export interface PWAInstallation {
  id: string;
  timestamp: Date;
  source: PWAInstallationSource;
  platform: string;
  browser: string;
  version: string;
  userAgent: string;
  metadata?: {
    referrer?: string;
    campaign?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  };
}

// PWA update interface
export interface PWAUpdate {
  id: string;
  fromVersion: string;
  toVersion: string;
  timestamp: Date;
  type: 'minor' | 'major' | 'patch';
  changelog?: string[];
  breakingChanges?: string[];
  newFeatures?: string[];
  bugFixes?: string[];
}

// PWA offline interface
export interface PWAOffline {
  isOffline: boolean;
  lastOnline: Date;
  offlineDuration: number;
  cachedResources: number;
  syncQueue: Array<{
    id: string;
    type: string;
    data: any;
    timestamp: Date;
    retryCount: number;
  }>;
  metadata?: {
    networkType?: string;
    connectionSpeed?: number;
    batteryLevel?: number;
  };
} 