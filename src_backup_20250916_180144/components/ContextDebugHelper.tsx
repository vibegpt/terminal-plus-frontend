import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bug, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Info,
  RefreshCw
} from 'lucide-react';

interface ContextStatus {
  name: string;
  status: 'active' | 'inactive' | 'error';
  details?: string;
}

const ContextDebugHelper: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [contextStatuses, setContextStatuses] = useState<ContextStatus[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const checkContexts = () => {
    const statuses: ContextStatus[] = [];
    
    try {
      // Check if window objects exist (basic context check)
      if (typeof window !== 'undefined') {
        // Check for Supabase
        if ((window as any).supabase) {
          statuses.push({
            name: 'Supabase',
            status: 'active',
            details: 'Available globally'
          });
        } else {
          statuses.push({
            name: 'Supabase',
            status: 'inactive',
            details: 'Not available globally'
          });
        }

        // Check for test collections helper
        if ((window as any).testCollections) {
          statuses.push({
            name: 'Test Collections',
            status: 'active',
            details: 'Debug tools available'
          });
        } else {
          statuses.push({
            name: 'Test Collections',
            status: 'inactive',
            details: 'Debug tools not loaded'
          });
        }

        // Check for gtag (Google Analytics)
        if ((window as any).gtag) {
          statuses.push({
            name: 'Google Analytics',
            status: 'active',
            details: 'gtag available'
          });
        } else {
          statuses.push({
            name: 'Google Analytics',
            status: 'inactive',
            details: 'gtag not loaded'
          });
        }
      }

      // Check localStorage for context data
      try {
        const hasLocalStorage = localStorage.getItem('journey-context') || 
                               localStorage.getItem('vibe-context') ||
                               localStorage.getItem('terminal-context');
        
        statuses.push({
          name: 'Local Storage',
          status: hasLocalStorage ? 'active' : 'inactive',
          details: hasLocalStorage ? 'Context data found' : 'No context data'
        });
      } catch (error) {
        statuses.push({
          name: 'Local Storage',
          status: 'error',
          details: 'Access denied or unavailable'
        });
      }

      // Check sessionStorage
      try {
        const hasSessionStorage = sessionStorage.getItem('session-data') ||
                                 sessionStorage.getItem('user-preferences');
        
        statuses.push({
          name: 'Session Storage',
          status: hasSessionStorage ? 'active' : 'inactive',
          details: hasSessionStorage ? 'Session data found' : 'No session data'
        });
      } catch (error) {
        statuses.push({
          name: 'Session Storage',
          status: 'error',
          details: 'Access denied or unavailable'
        });
      }

      // Check for React DevTools
      if ((window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        statuses.push({
          name: 'React DevTools',
          status: 'active',
          details: 'DevTools extension detected'
        });
      } else {
        statuses.push({
          name: 'React DevTools',
          status: 'inactive',
          details: 'DevTools extension not detected'
        });
      }

      // Check for Vite HMR
      if (import.meta.env.DEV && import.meta.hot) {
        statuses.push({
          name: 'Vite HMR',
          status: 'active',
          details: 'Hot Module Replacement enabled'
        });
      } else {
        statuses.push({
          name: 'Vite HMR',
          status: 'inactive',
          details: 'HMR not available in production'
        });
      }

    } catch (error) {
      statuses.push({
        name: 'Context Checker',
        status: 'error',
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    setContextStatuses(statuses);
    setLastUpdate(new Date());
  };

  useEffect(() => {
    checkContexts();
    
    // Auto-check every 5 seconds
    const interval = setInterval(checkContexts, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
      case 'inactive':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
      case 'error':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/20';
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed top-4 left-4 z-50 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all duration-200"
        title="Context Debug Helper"
      >
        <Bug className="w-5 h-5" />
      </button>

      {/* Debug Panel */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, x: -400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -400 }}
            className="fixed top-4 left-20 z-40 w-80 max-h-96 overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Bug className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Context Debug
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={checkContexts}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => setIsVisible(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Context Statuses */}
            <div className="p-4 space-y-3">
              {contextStatuses.map((context, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${getStatusColor(context.status)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(context.status)}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {context.name}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      context.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' :
                      context.status === 'inactive' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                    }`}>
                      {context.status}
                    </span>
                  </div>
                  {context.details && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {context.details}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                Auto-refresh every 5 seconds
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ContextDebugHelper;
