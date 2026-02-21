import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Bell, 
  Moon, 
  Sun,
  Globe,
  HelpCircle,
  Shield,
  Smartphone,
  RefreshCw
} from 'lucide-react';
import { useSimpleJourneyContext } from '../hooks/useSimpleJourneyContext';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { location, setManualTerminal } = useSimpleJourneyContext();
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));
  const [notifications, setNotifications] = useState(true);
  const [autoDetectLocation, setAutoDetectLocation] = useState(true);
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    setDarkMode(!darkMode);
  };
  
  // Reset journey context
  const resetContext = () => {
    // Clear session storage
    sessionStorage.clear();
    // Reload to trigger fresh context prompt
    window.location.href = '/';
  };
  
  // Manual terminal selection
  const selectTerminal = (terminal: string) => {
    setManualTerminal(terminal);
    navigate('/');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-4 flex items-center gap-3">
          <button 
            onClick={() => navigate('/')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
        </div>
      </div>
      
      {/* Settings Sections */}
      <div className="p-4 space-y-6">
        {/* Location Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Location</h2>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Auto-detect toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Auto-detect location</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Use GPS when available</p>
                </div>
              </div>
              <button
                onClick={() => setAutoDetectLocation(!autoDetectLocation)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoDetectLocation ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoDetectLocation ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            {/* Manual terminal selection */}
            <div className="pt-2">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Select terminal manually:</p>
              <div className="grid grid-cols-2 gap-2">
                {['T1', 'T2', 'T3', 'T4'].map(terminal => (
                  <button
                    key={terminal}
                    onClick={() => selectTerminal(terminal)}
                    className="p-3 text-center bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    Terminal {terminal.replace('T', '')}
                  </button>
                ))}
              </div>
              <button
                onClick={() => selectTerminal('JEWEL')}
                className="w-full mt-2 p-3 text-center bg-purple-50 dark:bg-purple-900/30 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
              >
                Jewel Changi
              </button>
            </div>
            
            {/* Current location display */}
            {location.terminal && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  Currently showing: <span className="font-medium">{location.terminal}</span>
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Appearance */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Appearance</h2>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {darkMode ? <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" /> : <Sun className="w-5 h-5 text-gray-600" />}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Dark mode</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Easier on the eyes</p>
                </div>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  darkMode ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
        
        {/* Notifications */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Notifications</h2>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Push notifications</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Gate changes, delays</p>
                </div>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
        
        {/* Data & Privacy */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Data & Privacy</h2>
          </div>
          
          <div className="p-4 space-y-3">
            <button
              onClick={resetContext}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">Reset preferences</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Clear all personalization</p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => navigate('/test/location-detection')}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">Test location detection</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Debug location services</p>
                </div>
              </div>
            </button>
          </div>
        </div>
        
        {/* About */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">About</h2>
          </div>
          
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Terminal+ v2.0</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Singapore Changi Edition</p>
                </div>
              </div>
            </div>
            
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-white">Help & Support</span>
              </div>
            </button>
            
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-white">Privacy Policy</span>
              </div>
            </button>
          </div>
        </div>
        
        {/* Version info */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Terminal+ 2.0.0 • Build 2024.08.26
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Made with ❤️ for travelers
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
