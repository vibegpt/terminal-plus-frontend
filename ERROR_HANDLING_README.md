# Comprehensive Error Handling System

This implementation provides a production-ready error handling system for the Terminal Plus application with user-friendly error messages, automatic retry logic, offline support, and comprehensive error tracking.

## 🎯 **System Overview**

The error handling system consists of multiple layers:

1. **Global Error Boundary** - Catches unhandled React errors
2. **Route Error Boundary** - Handles React Router errors (404s, 503s, etc.)
3. **Error Service** - Centralized error processing and classification
4. **Error Alerts** - User-friendly error notifications
5. **Offline Cache** - Graceful degradation when offline
6. **Sentry Integration** - Production error tracking and monitoring

## 📁 **File Structure**

```
src/
├── components/
│   ├── RouteErrorBoundary.tsx      # React Router error handling
│   └── ErrorAlert.tsx              # User-friendly error notifications
├── services/
│   └── errorService.ts             # Error classification and handling
├── hooks/
│   ├── useOfflineCache.ts          # Offline data caching
│   └── useVibeAmenities.ts         # Enhanced with error handling
├── pages/
│   └── ErrorHandlingDemo.tsx       # Demo page showcasing features
├── utils/
│   └── errorBoundary.tsx           # Global React error boundary
└── main.tsx                        # Sentry initialization
```

## 🚀 **Key Features**

### **1. Error Classification**
- **Network Errors**: Connection issues, WiFi problems
- **Timeout Errors**: Slow responses, database timeouts
- **Authentication Errors**: Login required, session expired
- **Permission Errors**: Access denied, insufficient privileges
- **Server Errors**: 5xx responses, system unavailable
- **Validation Errors**: Invalid input, malformed requests
- **Not Found Errors**: 404s, missing resources

### **2. Automatic Retry Logic**
- **Exponential Backoff**: 1s, 2s, 4s, 8s delays
- **Smart Retry**: Only retries appropriate error types
- **Max Retries**: Prevents infinite retry loops
- **User Feedback**: Clear retry status indicators

### **3. Offline Support**
- **Local Caching**: Stores data for offline access
- **Cache Validation**: TTL and max-age controls
- **Graceful Degradation**: Shows cached data when offline
- **Sync on Reconnect**: Updates when connection restored

### **4. User Experience**
- **Friendly Messages**: Airport-specific error language
- **Visual Indicators**: Icons and colors for different error types
- **Action Buttons**: Retry, dismiss, navigate options
- **Auto-dismiss**: Temporary errors auto-hide
- **Progress Indicators**: Shows retry attempts and loading states

## 🛠️ **Usage Examples**

### **Basic Error Handling**

```tsx
import { useVibeAmenities } from '../hooks/useVibeAmenities';
import { ErrorAlert } from '../components/ErrorAlert';

const MyComponent = () => {
  const {
    vibesWithAmenities,
    loading,
    error,
    errorMessage,
    refetch,
    isRetrying,
    isOffline,
    hasCachedData
  } = useVibeAmenities({
    terminalCode: 'T3',
    airportCode: 'SIN',
    limitPerVibe: 10
  });

  return (
    <div>
      {error && (
        <ErrorAlert
          error={error}
          onDismiss={() => setError(null)}
          onRetry={refetch}
        />
      )}
      
      {/* Your component content */}
    </div>
  );
};
```

### **Custom Error Handling**

```tsx
import { ErrorService, AppError, ErrorType } from '../services/errorService';

const handleApiCall = async () => {
  try {
    const result = await apiCall();
    return result;
  } catch (error) {
    const appError = ErrorService.handle(error);
    
    // Log error for debugging
    ErrorService.logError(appError, { context: 'apiCall' });
    
    // Show user-friendly message
    const userMessage = ErrorService.getUserMessage(appError);
    setError(userMessage);
    
    // Check if we should retry
    if (ErrorService.shouldRetry(appError, retryCount)) {
      setTimeout(() => retry(), ErrorService.getRetryDelay(retryCount));
    }
  }
};
```

### **Offline Cache Usage**

```tsx
import { useOfflineCache } from '../hooks/useOfflineCache';

const MyComponent = () => {
  const {
    isOnline,
    cache,
    setCache,
    isCacheValid,
    hasCache
  } = useOfflineCache({
    key: 'my-data',
    ttl: 5 * 60 * 1000, // 5 minutes
    maxAge: 2 * 60 * 60 * 1000 // 2 hours
  });

  return (
    <div>
      {isOnline ? '🌐 Online' : '📱 Offline'}
      {hasCache && '💾 Cached data available'}
    </div>
  );
};
```

## 🎨 **Error UI Components**

### **ErrorAlert Component**

```tsx
<ErrorAlert
  error={error}
  onDismiss={() => setError(null)}
  onRetry={() => refetch()}
  autoDismiss={true}
  dismissDelay={5000}
/>
```

**Props:**
- `error`: AppError object
- `onDismiss`: Function to dismiss the alert
- `onRetry`: Optional retry function
- `autoDismiss`: Auto-hide after delay
- `dismissDelay`: Delay in milliseconds

### **RouteErrorBoundary**

Automatically handles:
- **404 errors**: "Page not found" with navigation
- **503 errors**: "WiFi issues" with offline mode
- **5xx errors**: "Server error" with retry option
- **Generic errors**: Fallback with debug info

## 🔧 **Configuration**

### **Environment Variables**

```env
# Sentry Configuration
VITE_SENTRY_DSN=your_sentry_dsn_here
VITE_APP_ENV=production

# Error Handling
VITE_ERROR_RETRY_MAX=3
VITE_CACHE_TTL=300000
```

### **Error Service Configuration**

```tsx
// Customize retry behavior
ErrorService.getRetryDelay(attempt) // Custom delay calculation
ErrorService.shouldRetry(error, attempt) // Custom retry logic
ErrorService.getUserMessage(error) // Custom user messages
```

## 📊 **Error Tracking**

### **Sentry Integration**

- **Automatic Error Capture**: All unhandled errors
- **User Context**: Terminal, airport, user info
- **Performance Monitoring**: Page load times, API calls
- **Session Replay**: User actions before errors
- **Release Tracking**: Error rates by version

### **Error Logging**

```tsx
// Automatic logging in ErrorService
ErrorService.logError(error, { 
  terminalCode: 'T3',
  airportCode: 'SIN',
  userId: 'user123'
});
```

## 🧪 **Testing**

Visit `/error-demo` to see the error handling system in action:

- **Interactive Error Triggers**: Test different error types
- **Real Data Loading**: See error handling with actual API calls
- **Offline Simulation**: Test offline cache behavior
- **Retry Logic**: Watch automatic retry attempts
- **User Experience**: See error alerts and recovery

## 🚨 **Error Types & Messages**

| Error Type | User Message | Retryable | Icon |
|------------|--------------|-----------|------|
| NETWORK | "Can't connect. Check airport WiFi." | ✅ | 📶 |
| TIMEOUT | "Taking too long. Try again?" | ✅ | ⏰ |
| AUTHENTICATION | "Please sign in again." | ❌ | 🔐 |
| PERMISSION | "You don't have access to this." | ❌ | 🚫 |
| SERVER | "Airport systems are busy." | ✅ | ⚠️ |
| VALIDATION | "Something's wrong with your input." | ❌ | ✏️ |
| NOT_FOUND | "This doesn't exist anymore." | ❌ | 🔍 |
| UNKNOWN | "Oops! Something went wrong." | ✅ | ❓ |

## 🔄 **Retry Logic**

### **Exponential Backoff**
- Attempt 1: 1 second delay
- Attempt 2: 2 second delay  
- Attempt 3: 4 second delay
- Max: 30 seconds

### **Retry Conditions**
- ✅ Network errors
- ✅ Timeout errors
- ✅ Server errors (5xx)
- ❌ Authentication errors
- ❌ Permission errors
- ❌ Validation errors
- ❌ Not found errors

## 💾 **Offline Cache**

### **Cache Strategy**
- **TTL**: Time to live (when cache expires)
- **Max Age**: Maximum age before invalidation
- **Validation**: Check cache validity before use
- **Cleanup**: Remove expired cache automatically

### **Cache Keys**
- `vibes_{airport}_{terminal}`: Vibe amenities
- `collection_{id}`: Collection data
- `amenity_{id}`: Individual amenity data

## 🎯 **Best Practices**

### **Error Handling**
1. **Always handle errors gracefully**
2. **Provide clear user feedback**
3. **Log errors for debugging**
4. **Implement retry logic for transient errors**
5. **Cache data for offline support**

### **User Experience**
1. **Use friendly, airport-specific language**
2. **Show loading states during retries**
3. **Provide clear action buttons**
4. **Auto-dismiss temporary errors**
5. **Maintain app functionality during errors**

### **Performance**
1. **Cache frequently accessed data**
2. **Implement exponential backoff**
3. **Limit retry attempts**
4. **Use offline-first approach**
5. **Monitor error rates and performance**

## 🔮 **Future Enhancements**

- [ ] **Error Analytics Dashboard**: Track error patterns and trends
- [ ] **A/B Testing**: Test different error messages
- [ ] **Predictive Caching**: Pre-cache likely-needed data
- [ ] **Smart Retry**: ML-based retry timing
- [ ] **Error Recovery**: Automatic error resolution
- [ ] **User Feedback**: Error reporting from users
- [ ] **Performance Monitoring**: Real-time error metrics

## 📚 **Resources**

- [Sentry React Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)
- [React Error Boundaries](https://reactjs.org/docs/error-boundaries.html)
- [Exponential Backoff](https://en.wikipedia.org/wiki/Exponential_backoff)
- [Offline-First Architecture](https://offlinefirst.org/)
- [Error Handling Best Practices](https://kentcdodds.com/blog/use-react-error-boundary-to-handle-errors-in-react)
