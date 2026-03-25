import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Monitor, Wifi, WifiOff, Bell, RefreshCw, Trash2, Info } from 'lucide-react';
import { pwaService } from '../services/pwaService';

export const PWADemo: React.FC = () => {
  const [isStandalone, setIsStandalone] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [cacheSize, setCacheSize] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Check PWA status
    setIsStandalone(pwaService.isStandalone());
    setCanInstall(pwaService.canInstall());
    setDeviceType(pwaService.getDeviceType());
    setNotificationPermission(Notification.permission);

    // Get cache size
    pwaService.getCacheSize().then(setCacheSize);

    // Listen for online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRequestNotification = async () => {
    const permission = await pwaService.requestNotificationPermission();
    setNotificationPermission(permission);
  };

  const handleSendNotification = async () => {
    await pwaService.sendNotification('Terminal Plus', {
      body: 'Welcome to Terminal Plus! Discover amazing airport amenities.',
      tag: 'welcome'
    });
  };

  const handleBackgroundSync = async () => {
    await pwaService.requestBackgroundSync('background-sync');
    alert('Background sync requested! Data will sync when connection is restored.');
  };

  const handleClearCache = async () => {
    await pwaService.clearCache();
    const newSize = await pwaService.getCacheSize();
    setCacheSize(newSize);
    alert('Cache cleared successfully!');
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            PWA Features Demo
          </h1>
          <p className="text-gray-600">
            Progressive Web App capabilities and installation options
          </p>
        </div>

        {/* PWA Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">PWA Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {isStandalone ? '📱' : '🌐'}
              </div>
              <div className="text-sm text-blue-800">
                {isStandalone ? 'Installed' : 'Web App'}
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {canInstall ? '✅' : '❌'}
              </div>
              <div className="text-sm text-green-800">
                {canInstall ? 'Installable' : 'Not Installable'}
              </div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {deviceType === 'mobile' ? '📱' : deviceType === 'tablet' ? '📱' : '💻'}
              </div>
              <div className="text-sm text-purple-800 capitalize">
                {deviceType}
              </div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {isOnline ? '🌐' : '📱'}
              </div>
              <div className="text-sm text-orange-800">
                {isOnline ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>
        </div>

        {/* Installation Options */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Installation</h2>
          
          {!isStandalone ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Install as PWA</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Add Terminal Plus to your home screen for quick access and offline functionality.
                </p>
                {canInstall ? (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Download className="h-4 w-4" />
                    <span>Look for the install prompt or use your browser's install option</span>
                  </div>
                ) : (
                  <div className="text-sm text-blue-600">
                    Install prompt will appear when conditions are met
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Manual Installation</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Chrome/Edge:</strong> Click the install button in the address bar</p>
                  <p><strong>Firefox:</strong> Click the install button in the address bar</p>
                  <p><strong>Safari (iOS):</strong> Tap Share → Add to Home Screen</p>
                  <p><strong>Safari (macOS):</strong> File → Add to Dock</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <Smartphone className="h-5 w-5" />
                <span className="font-medium">App is installed and running in standalone mode!</span>
              </div>
            </div>
          )}
        </div>

        {/* PWA Features */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">PWA Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Notifications */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Permission: <span className="font-medium">{notificationPermission}</span>
              </p>
              <div className="space-y-2">
                <button
                  onClick={handleRequestNotification}
                  disabled={notificationPermission === 'granted'}
                  className="w-full px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Request Permission
                </button>
                <button
                  onClick={handleSendNotification}
                  disabled={notificationPermission !== 'granted'}
                  className="w-full px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Test Notification
                </button>
              </div>
            </div>

            {/* Background Sync */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Background Sync
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Sync data when connection is restored
              </p>
              <button
                onClick={handleBackgroundSync}
                className="w-full px-3 py-2 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
              >
                Request Background Sync
              </button>
            </div>

            {/* Cache Management */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Cache Management
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                Cache Size: <span className="font-medium">{formatBytes(cacheSize)}</span>
              </p>
              <button
                onClick={handleClearCache}
                className="w-full px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 flex items-center justify-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear Cache
              </button>
            </div>

            {/* Offline Support */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                Offline Support
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                Status: <span className="font-medium">{isOnline ? 'Online' : 'Offline'}</span>
              </p>
              <p className="text-xs text-gray-500">
                App works offline with cached data
              </p>
            </div>
          </div>
        </div>

        {/* PWA Benefits */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">PWA Benefits</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">🚀 Fast Loading</h3>
              <p className="text-sm text-blue-700">
                Cached resources load instantly, even on slow connections
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">📱 Native Feel</h3>
              <p className="text-sm text-green-700">
                Full-screen experience with native app-like interface
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-medium text-purple-900 mb-2">💾 Offline Access</h3>
              <p className="text-sm text-purple-700">
                Works without internet connection using cached data
              </p>
            </div>
            
            <div className="p-4 bg-orange-50 rounded-lg">
              <h3 className="font-medium text-orange-900 mb-2">🔔 Push Notifications</h3>
              <p className="text-sm text-orange-700">
                Get updates about new amenities and offers
              </p>
            </div>
            
            <div className="p-4 bg-red-50 rounded-lg">
              <h3 className="font-medium text-red-900 mb-2">🔄 Auto Updates</h3>
              <p className="text-sm text-red-700">
                Automatically updates with new features and improvements
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">💡 No App Store</h3>
              <p className="text-sm text-gray-700">
                Install directly from the browser, no app store required
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWADemo;
