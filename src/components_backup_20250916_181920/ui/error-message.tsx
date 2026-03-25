import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './button';

interface ErrorMessageProps {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  action, 
  className = '' 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div className="text-red-400 mb-4">
        <AlertCircle className="w-16 h-16" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Something went wrong
      </h3>
      <p className="text-gray-500 text-center mb-4 max-w-md">
        {message}
      </p>
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  );
}; 