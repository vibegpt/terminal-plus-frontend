import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Switch } from './ui/switch';
import { 
  Download, 
  Wifi, 
  WifiOff, 
  Smartphone, 
  Monitor,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Settings,
  Shield,
  Zap,
  Database,
  Cloud,
  HardDrive,
  Smartphone as Phone,
  Tablet,
  Laptop
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import type { 
  PWAStatus, 
  OfflineData, 
  CacheStatus, 
  InstallationPrompt,
  PWAConfig
} from '@/types/pwa.types';

interface PWAOptimizerProps {
  onInstallPrompt?: (prompt: InstallationPrompt) => void;
  onOfflineStatusChange?: (isOffline: boolean) => void;
  onCacheUpdate?: (status: CacheStatus) => void;
  className?: string;
}

export const PWAOptimizer: React.FC<PWAOptimizerProps> = ({
  onInstallPrompt,
  onOfflineStatusChange,
  onCacheUpdate,
  className = ''
}) => {
  const { theme } = useTheme();
  const [pwaStatus, setPwaStatus] = useState<PWAStatus>('checking');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallationPrompt | null>(null);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>('idle');
  const [offlineData, setOfflineData] = useState<OfflineData>({
    amenities: [],
    userData: null,
    lastSync: null
  });
  const [syncProgress, setSyncProgress] = useState(0);
  const [pwaConfig, setPwaConfig] = useState<PWAConfig>({
    autoInstall: false,
    offlineMode: true,
    backgroundSync: true,
    pushNotifications: false,
    cacheStrategy: 'network-first'
  });

  // Check PWA status on mount
  useEffect(() => {
    checkPWAStatus();
    checkInstallationStatus();
    setupEventListeners();
    initializeServiceWorker();
  }, []);

  const checkPWAStatus = useCallback(async () => {
    try {
      // Check if service worker is registered
      const swRegistration = await navigator.serviceWorker.getRegistration();
      
      // Check if app is installed
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInstalled = isStandalone || (window.navigator as any).standalone;
      
      // Check cache status
      const cacheStatus = await checkCacheStatus();
      
      setPwaStatus(swRegistration && isInstalled ? 'installed' : 'available');
      setIsInstalled(isInstalled);
      setCacheStatus(cacheStatus);
    } catch (error) {
      console.error('Error checking PWA status:', error);
      setPwaStatus('error');
    }
  }, []);

  const checkInstallationStatus = useCallback(() => {
    // Check if app is installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInstalled = isStandalone || (window.navigator as any).standalone;
    setIsInstalled(isInstalled);
  }, []);

  const setupEventListeners = useCallback(() => {
    // Online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      onOfflineStatusChange?.(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      onOfflineStatusChange?.(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Before install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      const prompt = {
        type: 'install',
        title: 'Install Terminal+',
        description: 'Add Terminal+ to your home screen for quick access',
        icon: '/icon-192x192.png',
        screenshots: [
          '/screenshot-1.png',
          '/screenshot-2.png'
        ]
      };
      setInstallPrompt(prompt);
      setShowInstallPrompt(true);
      onInstallPrompt?.(prompt);
    });

    // App installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setPwaStatus('installed');
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onOfflineStatusChange, onInstallPrompt]);

  const initializeServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        
        // Listen for service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available
                setCacheStatus('update-available');
              }
            });
          }
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        setPwaStatus('error');
      }
    } else {
      setPwaStatus('unsupported');
    }
  }, []);

  const checkCacheStatus = useCallback(async (): Promise<CacheStatus> => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        const terminalCache = cacheNames.find(name => name.includes('terminal-plus'));
        
        if (terminalCache) {
          const cache = await caches.open(terminalCache);
          const requests = await cache.keys();
          return requests.length > 0 ? 'cached' : 'empty';
        }
        return 'empty';
      } catch (error) {
        console.error('Error checking cache status:', error);
        return 'error';
      }
    }
    return 'unsupported';
  }, []);

  const handleInstall = useCallback(async () => {
    if (installPrompt) {
      try {
        // Trigger the install prompt
        const result = await (installPrompt as any).prompt();
        console.log('Install prompt result:', result);
        
        if (result.outcome === 'accepted') {
          setIsInstalled(true);
          setShowInstallPrompt(false);
          setPwaStatus('installed');
        }
      } catch (error) {
        console.error('Error during installation:', error);
      }
    }
  }, [installPrompt]);

  const handleCacheUpdate = useCallback(async () => {
    try {
      setCacheStatus('updating');
      setSyncProgress(0);

      // Simulate cache update progress
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setCacheStatus('updated');
            onCacheUpdate?.('updated');
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      // Update service worker
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

    } catch (error) {
      console.error('Error updating cache:', error);
      setCacheStatus('error');
    }
  }, [onCacheUpdate]);

  const toggleOfflineMode = useCallback((enabled: boolean) => {
    setPwaConfig(prev => ({ ...prev, offlineMode: enabled }));
    
    if (enabled) {
      // Enable offline mode
      console.log('Offline mode enabled');
    } else {
      // Disable offline mode
      console.log('Offline mode disabled');
    }
  }, []);

  const toggleBackgroundSync = useCallback((enabled: boolean) => {
    setPwaConfig(prev => ({ ...prev, backgroundSync: enabled }));
    
    if (enabled && 'serviceWorker' in navigator) {
      // Register background sync
      navigator.serviceWorker.ready.then(registration => {
        if ('sync' in registration) {
          (registration as any).sync.register('background-sync');
        }
      });
    }
  }, []);

  const getPWAStatusColor = (status: PWAStatus) => {
    const colors = {
      checking: 'bg-gray-100 text-gray-800 border-gray-200',
      available: 'bg-blue-100 text-blue-800 border-blue-200',
      installed: 'bg-green-100 text-green-800 border-green-200',
      error: 'bg-red-100 text-red-800 border-red-200',
      unsupported: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[status] || colors.checking;
  };

  const getCacheStatusColor = (status: CacheStatus) => {
    const colors = {
      idle: 'bg-gray-100 text-gray-800 border-gray-200',
      cached: 'bg-green-100 text-green-800 border-green-200',
      updating: 'bg-blue-100 text-blue-800 border-blue-200',
      'update-available': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      updated: 'bg-green-100 text-green-800 border-green-200',
      error: 'bg-red-100 text-red-800 border-red-200',
      empty: 'bg-gray-100 text-gray-800 border-gray-200',
      unsupported: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[status] || colors.idle;
  };

  const getDeviceIcon = () => {
    const userAgent = navigator.userAgent;
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return /iPad/.test(userAgent) ? <Tablet className="w-5 h-5" /> : <Phone className="w-5 h-5" />;
    }
    return <Laptop className="w-5 h-5" />;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* PWA Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5" />
            <span>PWA Status</span>
            <Badge variant="outline" className={getPWAStatusColor(pwaStatus)}>
              {pwaStatus === 'checking' && <RefreshCw className="w-4 h-4 animate-spin" />}
              {pwaStatus === 'available' && <Download className="w-4 h-4" />}
              {pwaStatus === 'installed' && <CheckCircle className="w-4 h-4" />}
              {pwaStatus === 'error' && <AlertCircle className="w-4 h-4" />}
              <span className="ml-1 capitalize">{pwaStatus}</span>
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isOnline ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
              <span className="text-sm font-medium">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {getDeviceIcon()}
              <span className="text-sm text-gray-500">
                {navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}
              </span>
            </div>
          </div>

          {/* Installation Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Installation Status</span>
            <div className="flex items-center space-x-2">
              {isInstalled ? (
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Installed
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                  <Download className="w-3 h-3 mr-1" />
                  Available
                </Badge>
              )}
            </div>
          </div>

          {/* Cache Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Cache Status</span>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={getCacheStatusColor(cacheStatus)}>
                {cacheStatus === 'updating' && <RefreshCw className="w-3 h-3 animate-spin mr-1" />}
                <span className="capitalize">{cacheStatus.replace('-', ' ')}</span>
              </Badge>
              {cacheStatus === 'update-available' && (
                <Button size="sm" onClick={handleCacheUpdate}>
                  Update
                </Button>
              )}
            </div>
          </div>

          {/* Cache Update Progress */}
          {cacheStatus === 'updating' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Updating cache...</span>
                <span className="text-sm">{syncProgress}%</span>
              </div>
              <Progress value={syncProgress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Install Prompt */}
      {showInstallPrompt && !isInstalled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="w-5 h-5" />
              <span>Install Terminal+</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Add Terminal+ to your home screen for quick access and offline functionality.
            </p>
            <div className="flex space-x-3">
              <Button onClick={handleInstall} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Install App
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowInstallPrompt(false)}
              >
                Later
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PWA Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>PWA Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Offline Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-4 h-4 text-gray-500" />
              <div>
                <span className="text-sm font-medium">Offline Mode</span>
                <p className="text-xs text-gray-500">Cache data for offline use</p>
              </div>
            </div>
            <Switch
              checked={pwaConfig.offlineMode}
              onCheckedChange={toggleOfflineMode}
            />
          </div>

          {/* Background Sync */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Cloud className="w-4 h-4 text-gray-500" />
              <div>
                <span className="text-sm font-medium">Background Sync</span>
                <p className="text-xs text-gray-500">Sync data when online</p>
              </div>
            </div>
            <Switch
              checked={pwaConfig.backgroundSync}
              onCheckedChange={toggleBackgroundSync}
            />
          </div>

          {/* Push Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-gray-500" />
              <div>
                <span className="text-sm font-medium">Push Notifications</span>
                <p className="text-xs text-gray-500">Receive updates and alerts</p>
              </div>
            </div>
            <Switch
              checked={pwaConfig.pushNotifications}
              onCheckedChange={(enabled) => 
                setPwaConfig(prev => ({ ...prev, pushNotifications: enabled }))
              }
            />
          </div>

          {/* Cache Strategy */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Cache Strategy</span>
            </div>
            <select
              value={pwaConfig.cacheStrategy}
              onChange={(e) => 
                setPwaConfig(prev => ({ ...prev, cacheStrategy: e.target.value as any }))
              }
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="network-first">Network First</option>
              <option value="cache-first">Cache First</option>
              <option value="stale-while-revalidate">Stale While Revalidate</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Offline Data Status */}
      {pwaConfig.offlineMode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Offline Data</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Cached Amenities</span>
              <Badge variant="outline">
                {offlineData.amenities.length} items
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Last Sync</span>
              <span className="text-sm text-gray-500">
                {offlineData.lastSync ? 
                  new Date(offlineData.lastSync).toLocaleDateString() : 
                  'Never'
                }
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Storage Used</span>
              <span className="text-sm text-gray-500">
                {navigator.storage ? 'Calculating...' : 'Unknown'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 