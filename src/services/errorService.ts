export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  PERMISSION = 'PERMISSION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

export class AppError extends Error {
  constructor(
    public type: ErrorType,
    public message: string,
    public details?: any,
    public statusCode?: number,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ErrorService {
  static handle(error: any): AppError {
    // Supabase errors
    if (error?.code === 'PGRST301') {
      return new AppError(
        ErrorType.TIMEOUT,
        'Request timed out. Check your connection.',
        error,
        408,
        true
      );
    }
    
    if (error?.code === '23503') {
      return new AppError(
        ErrorType.NOT_FOUND,
        'This amenity is no longer available.',
        error,
        404,
        false
      );
    }

    if (error?.code === 'PGRST116') {
      return new AppError(
        ErrorType.NOT_FOUND,
        'The requested data was not found.',
        error,
        404,
        false
      );
    }

    if (error?.code === 'PGRST301') {
      return new AppError(
        ErrorType.TIMEOUT,
        'Database query timed out.',
        error,
        408,
        true
      );
    }
    
    // Network errors
    if (error?.message?.includes('NetworkError') || error?.message?.includes('Failed to fetch')) {
      return new AppError(
        ErrorType.NETWORK,
        'Connection lost. Showing cached data.',
        error,
        0,
        true
      );
    }

    if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
      return new AppError(
        ErrorType.NETWORK,
        'Unable to connect to airport services.',
        error,
        0,
        true
      );
    }
    
    // Rate limiting
    if (error?.status === 429) {
      return new AppError(
        ErrorType.SERVER,
        'Too many requests. Please wait a moment.',
        error,
        429,
        true
      );
    }

    // Authentication errors
    if (error?.status === 401) {
      return new AppError(
        ErrorType.AUTHENTICATION,
        'Please sign in again to continue.',
        error,
        401,
        false
      );
    }

    // Permission errors
    if (error?.status === 403) {
      return new AppError(
        ErrorType.PERMISSION,
        'You don\'t have access to this feature.',
        error,
        403,
        false
      );
    }

    // Validation errors
    if (error?.status === 400) {
      return new AppError(
        ErrorType.VALIDATION,
        'Invalid request. Please check your input.',
        error,
        400,
        false
      );
    }

    // Server errors
    if (error?.status >= 500) {
      return new AppError(
        ErrorType.SERVER,
        'Airport systems are temporarily unavailable.',
        error,
        error.status,
        true
      );
    }

    // Timeout errors
    if (error?.name === 'TimeoutError' || error?.message?.includes('timeout')) {
      return new AppError(
        ErrorType.TIMEOUT,
        'Request is taking too long. Please try again.',
        error,
        408,
        true
      );
    }
    
    return new AppError(
      ErrorType.UNKNOWN,
      'Something unexpected happened.',
      error,
      500,
      true
    );
  }

  static getUserMessage(error: AppError): string {
    const messages = {
      [ErrorType.NETWORK]: "Can't connect. Check airport WiFi.",
      [ErrorType.NOT_FOUND]: "This doesn't exist anymore.",
      [ErrorType.TIMEOUT]: "Taking too long. Try again?",
      [ErrorType.SERVER]: "Airport systems are busy.",
      [ErrorType.AUTHENTICATION]: "Please sign in again.",
      [ErrorType.PERMISSION]: "You don't have access to this.",
      [ErrorType.VALIDATION]: "Something's wrong with your input.",
      [ErrorType.UNKNOWN]: "Oops! Something went wrong."
    };
    
    return messages[error.type] || error.message;
  }

  static getRetryDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, etc.
    return Math.min(1000 * Math.pow(2, attempt), 30000); // Max 30 seconds
  }

  static shouldRetry(error: AppError, attempt: number): boolean {
    if (!error.retryable) return false;
    if (attempt >= 3) return false; // Max 3 retries
    
    // Don't retry certain error types
    if (error.type === ErrorType.AUTHENTICATION) return false;
    if (error.type === ErrorType.PERMISSION) return false;
    if (error.type === ErrorType.VALIDATION) return false;
    
    return true;
  }

  static logError(error: AppError, context?: any): void {
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('AppError:', {
        type: error.type,
        message: error.message,
        statusCode: error.statusCode,
        retryable: error.retryable,
        details: error.details,
        context
      });
    }

    // In production, this would send to your error tracking service
    // Example: Sentry.captureException(error, { extra: context });
  }
}
