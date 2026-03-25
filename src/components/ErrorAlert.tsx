import React, { useEffect, useState } from 'react';
import { AlertCircle, X, WifiOff, RefreshCw, Clock, Shield, AlertTriangle } from 'lucide-react';
import { AppError, ErrorType } from '../services/errorService';

interface ErrorAlertProps {
  error: AppError | null;
  onDismiss: () => void;
  onRetry?: () => void;
  autoDismiss?: boolean;
  dismissDelay?: number;
}

export function ErrorAlert({ 
  error, 
  onDismiss, 
  onRetry, 
  autoDismiss = false,
  dismissDelay = 5000
}: ErrorAlertProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      
      if (autoDismiss && error.retryable) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(onDismiss, 300); // Wait for animation
        }, dismissDelay);
        
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [error, autoDismiss, dismissDelay, onDismiss]);

  if (!error || !isVisible) return null;

  const getIcon = () => {
    switch (error.type) {
      case ErrorType.NETWORK:
        return <WifiOff className="h-5 w-5 text-orange-500" />;
      case ErrorType.TIMEOUT:
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case ErrorType.AUTHENTICATION:
        return <Shield className="h-5 w-5 text-red-500" />;
      case ErrorType.PERMISSION:
        return <Shield className="h-5 w-5 text-red-500" />;
      case ErrorType.SERVER:
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getColorClasses = () => {
    switch (error.type) {
      case ErrorType.NETWORK:
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case ErrorType.TIMEOUT:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case ErrorType.AUTHENTICATION:
      case ErrorType.PERMISSION:
        return 'bg-red-50 border-red-200 text-red-800';
      case ErrorType.SERVER:
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    }
  };

  const getRetryButtonText = () => {
    switch (error.type) {
      case ErrorType.NETWORK:
        return 'Check Connection';
      case ErrorType.TIMEOUT:
        return 'Try Again';
      case ErrorType.SERVER:
        return 'Retry';
      default:
        return 'Try Again';
    }
  };

  return (
    <div className={`fixed top-4 right-4 p-4 rounded-lg border ${getColorClasses()} shadow-lg z-50 max-w-sm transform transition-all duration-300 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{error.message}</p>
          {error.statusCode && (
            <p className="text-xs opacity-75 mt-1">
              Error {error.statusCode}
            </p>
          )}
          {error.retryable && onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-xs font-medium hover:underline focus:outline-none focus:underline"
            >
              {getRetryButtonText()}
            </button>
          )}
        </div>
        <button 
          onClick={() => {
            setIsVisible(false);
            setTimeout(onDismiss, 300);
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      {/* Progress bar for auto-dismiss */}
      {autoDismiss && error.retryable && (
        <div className="mt-2 h-1 bg-current opacity-20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-current opacity-50 rounded-full transition-all ease-linear"
            style={{
              animation: `shrink ${dismissDelay}ms linear forwards`
            }}
          />
        </div>
      )}
    </div>
  );
}

// CSS for the progress bar animation
const style = document.createElement('style');
style.textContent = `
  @keyframes shrink {
    from { width: 100%; }
    to { width: 0%; }
  }
`;
document.head.appendChild(style);

export default ErrorAlert;
