import React from 'react';
import { Loader2, Plane } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text = 'Loading...',
  fullScreen = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50'
    : 'flex items-center justify-center p-8';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        {/* Animated spinner with plane icon */}
        <div className="relative">
          <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
          <Plane className={`${sizeClasses[size === 'sm' ? 'sm' : 'md']} absolute inset-0 m-auto text-blue-500 opacity-70`} />
        </div>
        
        {/* Loading text */}
        <div className="text-center">
          <p className={`${textSizeClasses[size]} font-medium text-gray-700`}>
            {text}
          </p>
          <div className="mt-2 flex space-x-1 justify-center">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Pre-configured variants for common use cases
export const PageLoadingSpinner: React.FC = () => (
  <LoadingSpinner 
    size="lg" 
    text="Loading page..." 
    fullScreen={true}
  />
);

export const ComponentLoadingSpinner: React.FC = () => (
  <LoadingSpinner 
    size="md" 
    text="Loading..." 
    fullScreen={false}
  />
);

export const InlineLoadingSpinner: React.FC = () => (
  <LoadingSpinner 
    size="sm" 
    text="" 
    fullScreen={false}
  />
);

// Skeleton loader for content
export const ContentSkeleton: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <div className="animate-pulse space-y-3">
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    ))}
  </div>
);

// Card skeleton loader
export const CardSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-start space-x-3">
        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          <div className="flex space-x-2">
            <div className="h-6 bg-gray-200 rounded w-16"></div>
            <div className="h-6 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// List skeleton loader
export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: items }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

export default LoadingSpinner;
