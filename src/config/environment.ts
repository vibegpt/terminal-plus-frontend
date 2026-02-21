export interface Environment {
  name: 'development' | 'staging' | 'production';
  apiUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  sentryDsn?: string;
  posthogKey?: string;
  gaTrackingId?: string;
  enableAnalytics: boolean;
  enableErrorReporting: boolean;
  enablePWA: boolean;
  cdnUrl?: string;
  featureFlags: {
    smart7: boolean;
    virtualAmenities: boolean;
    offlineMode: boolean;
    pushNotifications: boolean;
  };
}

const environments: Record<string, Environment> = {
  development: {
    name: 'development',
    apiUrl: 'http://localhost:3000',
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    enableAnalytics: false,
    enableErrorReporting: false,
    enablePWA: false,
    featureFlags: {
      smart7: true,
      virtualAmenities: true,
      offlineMode: true,
      pushNotifications: false,
    },
  },
  staging: {
    name: 'staging',
    apiUrl: 'https://staging.terminal-plus.com',
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    sentryDsn: import.meta.env.VITE_SENTRY_DSN,
    enableAnalytics: true,
    enableErrorReporting: true,
    enablePWA: true,
    featureFlags: {
      smart7: true,
      virtualAmenities: true,
      offlineMode: true,
      pushNotifications: false,
    },
  },
  production: {
    name: 'production',
    apiUrl: 'https://api.terminal-plus.com',
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    sentryDsn: import.meta.env.VITE_SENTRY_DSN,
    posthogKey: import.meta.env.VITE_POSTHOG_KEY,
    gaTrackingId: import.meta.env.VITE_GA_TRACKING_ID,
    cdnUrl: 'https://cdn.terminal-plus.com',
    enableAnalytics: true,
    enableErrorReporting: true,
    enablePWA: true,
    featureFlags: {
      smart7: true,
      virtualAmenities: false,
      offlineMode: true,
      pushNotifications: true,
    },
  },
};

export const config = environments[import.meta.env.VITE_APP_ENV || 'development'];
