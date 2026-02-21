import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TerminalProvider } from '@/context/TerminalContext';
import { JourneyProvider } from '@/context/JourneyContext';
import { UserPreferencesProvider } from '@/context/UserPreferencesContext';
import { OfflineProvider } from '@/context/OfflineContext';
import { BehaviorTrackingProvider } from '@/context/BehaviorTrackingContext';

// Lazy load DevTools only in development
const ReactQueryDevtools = import.meta.env.DEV 
  ? React.lazy(() => import('@tanstack/react-query-devtools').then(module => ({ default: module.ReactQueryDevtools })))
  : null;

// Properly configured QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,      // 2 minutes
      gcTime: 10 * 60 * 1000,        // 10 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 404s
        if (error?.status === 404) return false;
        // Retry network errors up to 3 times
        if (!error?.status && failureCount < 3) return true;
        return false;
      },
      refetchOnWindowFocus: true,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: 2,
      onError: (error) => {
        console.error('Mutation error:', error);
        // Show toast notification
      },
    },
  },
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <OfflineProvider>
        <TerminalProvider>
          <JourneyProvider>
            <UserPreferencesProvider>
              <BehaviorTrackingProvider>
                {children}
                {import.meta.env.DEV && ReactQueryDevtools && (
                  <React.Suspense fallback={null}>
                    <ReactQueryDevtools />
                  </React.Suspense>
                )}
              </BehaviorTrackingProvider>
            </UserPreferencesProvider>
          </JourneyProvider>
        </TerminalProvider>
      </OfflineProvider>
    </QueryClientProvider>
  );
}

export default AppProviders;
