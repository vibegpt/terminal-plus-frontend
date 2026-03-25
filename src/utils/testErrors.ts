// src/utils/testErrors.ts - Dev only!
import { AppError, ErrorType } from '../services/errorService';

export const triggerTestError = (type: string) => {
  switch(type) {
    case 'network':
      throw new Error('NetworkError: Failed to fetch');
    case 'crash':
      throw new Error('Component crashed!');
    case 'async':
      return Promise.reject(new Error('Async operation failed'));
    case '404':
      throw { status: 404, message: 'Not found' };
    case 'timeout':
      throw new Error('TimeoutError: Request timed out');
    case 'auth':
      throw { status: 401, message: 'Unauthorized' };
    case 'permission':
      throw { status: 403, message: 'Forbidden' };
    case 'server':
      throw { status: 500, message: 'Internal Server Error' };
    case 'validation':
      throw { status: 400, message: 'Bad Request' };
    case 'supabase-timeout':
      throw { code: 'PGRST301', message: 'Database timeout' };
    case 'supabase-not-found':
      throw { code: 'PGRST116', message: 'Record not found' };
    case 'supabase-foreign-key':
      throw { code: '23503', message: 'Foreign key constraint' };
    case 'rate-limit':
      throw { status: 429, message: 'Too Many Requests' };
    default:
      throw new Error(`Unknown test error: ${type}`);
  }
};

// Create specific AppError instances for testing
export const createTestAppError = (type: ErrorType): AppError => {
  const errorMap = {
    [ErrorType.NETWORK]: new AppError(
      ErrorType.NETWORK,
      'Test network error - connection failed',
      { test: true },
      0,
      true
    ),
    [ErrorType.TIMEOUT]: new AppError(
      ErrorType.TIMEOUT,
      'Test timeout error - request took too long',
      { test: true },
      408,
      true
    ),
    [ErrorType.AUTHENTICATION]: new AppError(
      ErrorType.AUTHENTICATION,
      'Test auth error - please sign in again',
      { test: true },
      401,
      false
    ),
    [ErrorType.PERMISSION]: new AppError(
      ErrorType.PERMISSION,
      'Test permission error - access denied',
      { test: true },
      403,
      false
    ),
    [ErrorType.SERVER]: new AppError(
      ErrorType.SERVER,
      'Test server error - systems are busy',
      { test: true },
      500,
      true
    ),
    [ErrorType.VALIDATION]: new AppError(
      ErrorType.VALIDATION,
      'Test validation error - invalid input',
      { test: true },
      400,
      false
    ),
    [ErrorType.NOT_FOUND]: new AppError(
      ErrorType.NOT_FOUND,
      'Test not found error - resource missing',
      { test: true },
      404,
      false
    ),
    [ErrorType.UNKNOWN]: new AppError(
      ErrorType.UNKNOWN,
      'Test unknown error - something unexpected',
      { test: true },
      500,
      true
    )
  };

  return errorMap[type];
};

// Test error scenarios for different components
export const testErrorScenarios = {
  // React Error Boundary tests
  componentCrash: () => {
    throw new Error('Component crashed during render!');
  },
  
  // Async error tests
  asyncError: async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    throw new Error('Async operation failed');
  },
  
  // Network simulation
  networkError: () => {
    const error = new Error('Failed to fetch');
    error.name = 'TypeError';
    throw error;
  },
  
  // Supabase error simulation
  supabaseError: (code: string) => {
    const error = new Error('Supabase error');
    (error as any).code = code;
    throw error;
  },
  
  // HTTP status error simulation
  httpError: (status: number) => {
    const error = new Error(`HTTP ${status} Error`);
    (error as any).status = status;
    throw error;
  }
};

// Development-only error testing utilities
export const devErrorUtils = {
  // Test all error types
  testAllErrorTypes: () => {
    const types = Object.values(ErrorType);
    return types.map(type => ({
      type,
      error: createTestAppError(type),
      description: `Test ${type} error`
    }));
  },
  
  // Simulate offline mode
  simulateOffline: () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });
    window.dispatchEvent(new Event('offline'));
  },
  
  // Simulate online mode
  simulateOnline: () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
    window.dispatchEvent(new Event('online'));
  },
  
  // Clear all test errors
  clearErrors: () => {
    localStorage.removeItem('errorLog');
    sessionStorage.clear();
  },
  
  // Get error log
  getErrorLog: () => {
    try {
      return JSON.parse(sessionStorage.getItem('errorLog') || '[]');
    } catch {
      return [];
    }
  }
};

// Only export in development
if (import.meta.env.DEV) {
  (window as any).testErrors = {
    triggerTestError,
    createTestAppError,
    testErrorScenarios,
    devErrorUtils
  };
}
