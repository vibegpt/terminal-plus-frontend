import React from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default function AppError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : (error as Error)?.message || 'Something went wrong';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Oops, that's on us
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message}
        </p>
        
        <div className="space-y-3">
          <button 
            onClick={() => window.location.reload()} 
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Reload Page
          </button>
          
          <button 
            onClick={() => window.location.href = '/'} 
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </button>
        </div>
        
        <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
          If this problem persists, please contact support
        </div>
      </div>
    </div>
  );
}
