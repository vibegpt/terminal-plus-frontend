import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

type ToastType = 'success' | 'error' | 'loading';

interface SimpleToastProps {
  message: string;
  type: ToastType;
  subtitle?: string;
  onClose?: () => void;
  duration?: number;
}

const SimpleToast: React.FC<SimpleToastProps> = ({ 
  message, 
  type, 
  subtitle,
  onClose,
  duration = 3000 
}) => {
  useEffect(() => {
    if (type !== 'loading' && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [type, onClose, duration]);

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-100 dark:bg-green-900';
      case 'error':
        return 'bg-red-100 dark:bg-red-900';
      case 'loading':
        return 'bg-blue-100 dark:bg-blue-900';
      default:
        return 'bg-slate-100 dark:bg-slate-800';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800 dark:text-green-200';
      case 'error':
        return 'text-red-800 dark:text-red-200';
      case 'loading':
        return 'text-blue-800 dark:text-blue-200';
      default:
        return 'text-slate-800 dark:text-slate-200';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />;
      case 'loading':
        return <Loader2 className="h-5 w-5 text-blue-500 dark:text-blue-400 animate-spin" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 min-w-[240px] max-w-md">
      <div className={`${getBgColor()} ${getTextColor()} rounded-full shadow-md px-6 py-3 flex flex-col items-center gap-1`}> 
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="text-base font-semibold">{message}</span>
        </div>
        {subtitle && (
          <span className="text-xs font-normal opacity-80 mt-1">{subtitle}</span>
        )}
      </div>
    </div>
  );
};

export default SimpleToast;