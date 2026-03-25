// src/utils/errorBoundary.tsx - Global error boundary
import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class CollectionErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error reporting service
    console.error('Collection Error:', error, errorInfo);
    
    // Store error details
    this.setState({
      error,
      errorInfo,
      retryCount: 0
    });
    
    // Save error to sessionStorage for debugging
    const errorLog = {
      message: error.toString(),
      stack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      location: window.location.href
    };
    
    try {
      const errors = JSON.parse(sessionStorage.getItem('errorLog') || '[]');
      errors.push(errorLog);
      sessionStorage.setItem('errorLog', JSON.stringify(errors.slice(-5)));
    } catch (storageError) {
      console.warn('Failed to save error log:', storageError);
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: this.state.retryCount + 1 
    });
  };

  handleGoHome = () => {
    try {
      sessionStorage.clear();
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to clear session:', error);
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#0A0E27] via-[#1a1a2e] to-[#0A0E27] flex items-center justify-center p-4">
          <div className="glass-card-heavy p-8 max-w-md w-full text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              Oops! Something went wrong
            </h1>
            <p className="text-white/60 mb-6">
              {this.state.retryCount > 2 
                ? "We're having persistent issues. Please try again later."
                : "We encountered an error loading this collection."}
            </p>
            
            <div className="space-y-3">
              {this.state.retryCount <= 2 && (
                <button
                  onClick={this.handleReset}
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </button>
              )}
              
              <button
                onClick={this.handleGoHome}
                className="w-full px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 font-medium transition-all flex items-center justify-center gap-2"
              >
                <Home className="h-4 w-4" />
                Back to Home
              </button>
            </div>
            
            {/* Debug info in development */}
            {import.meta.env.DEV && (
              <details className="mt-6 text-left">
                <summary className="text-white/40 text-sm cursor-pointer">
                  Error Details
                </summary>
                <pre className="mt-2 text-xs text-white/40 overflow-auto">
                  {this.state.error && this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default CollectionErrorBoundary;
