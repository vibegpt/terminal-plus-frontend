/**
 * Environment variable validation utility
 * Ensures all required environment variables are present
 */

interface RequiredEnvVars {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_APP_ENV: string;
}

interface OptionalEnvVars {
  VITE_SENTRY_DSN?: string;
  VITE_GA_TRACKING_ID?: string;
  VITE_POSTHOG_KEY?: string;
}

export type EnvVars = RequiredEnvVars & OptionalEnvVars;

const REQUIRED_ENV_VARS: (keyof RequiredEnvVars)[] = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_APP_ENV',
];

const VALID_ENVIRONMENTS = ['development', 'staging', 'production'] as const;

/**
 * Validates that all required environment variables are present
 * @throws Error if any required variables are missing
 */
export function validateEnvironment(): EnvVars {
  const missing: string[] = [];
  const env: Partial<EnvVars> = {};

  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    const value = import.meta.env[varName];
    if (!value || value.trim() === '') {
      missing.push(varName);
    } else {
      env[varName] = value;
    }
  }

  // Check optional variables
  const optionalVars: (keyof OptionalEnvVars)[] = [
    'VITE_SENTRY_DSN',
    'VITE_GA_TRACKING_ID',
    'VITE_POSTHOG_KEY',
  ];

  for (const varName of optionalVars) {
    const value = import.meta.env[varName];
    if (value && value.trim() !== '') {
      env[varName] = value;
    }
  }

  // Validate environment value
  if (env.VITE_APP_ENV && !VALID_ENVIRONMENTS.includes(env.VITE_APP_ENV as any)) {
    throw new Error(
      `Invalid VITE_APP_ENV: ${env.VITE_APP_ENV}. Must be one of: ${VALID_ENVIRONMENTS.join(', ')}`
    );
  }

  // Validate Supabase URL format
  if (env.VITE_SUPABASE_URL && !env.VITE_SUPABASE_URL.startsWith('https://')) {
    throw new Error(
      'Invalid VITE_SUPABASE_URL: Must be a valid HTTPS URL'
    );
  }

  // Validate Sentry DSN format (if provided)
  if (env.VITE_SENTRY_DSN && !env.VITE_SENTRY_DSN.startsWith('https://')) {
    throw new Error(
      'Invalid VITE_SENTRY_DSN: Must be a valid HTTPS URL'
    );
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n\n` +
      'Please check your .env.local file and ensure all required variables are set.\n' +
      'See ENVIRONMENT_SETUP.md for setup instructions.'
    );
  }

  return env as EnvVars;
}

/**
 * Gets environment variables with validation
 * Call this once at app startup
 */
export function getValidatedEnv(): EnvVars {
  try {
    return validateEnvironment();
  } catch (error) {
    console.error('Environment validation failed:', error);
    throw error;
  }
}

/**
 * Checks if we're in development mode
 */
export function isDevelopment(): boolean {
  return import.meta.env.VITE_APP_ENV === 'development';
}

/**
 * Checks if we're in production mode
 */
export function isProduction(): boolean {
  return import.meta.env.VITE_APP_ENV === 'production';
}

/**
 * Checks if we're in staging mode
 */
export function isStaging(): boolean {
  return import.meta.env.VITE_APP_ENV === 'staging';
}

/**
 * Gets the current environment name
 */
export function getEnvironment(): string {
  return import.meta.env.VITE_APP_ENV || 'development';
}

/**
 * Checks if analytics should be enabled
 */
export function isAnalyticsEnabled(): boolean {
  const env = import.meta.env.VITE_APP_ENV;
  return env === 'production' || env === 'staging';
}

/**
 * Checks if error reporting should be enabled
 */
export function isErrorReportingEnabled(): boolean {
  const env = import.meta.env.VITE_APP_ENV;
  return env === 'production' || env === 'staging';
}

/**
 * Gets environment info for debugging
 */
export function getEnvironmentInfo() {
  return {
    environment: getEnvironment(),
    isDevelopment: isDevelopment(),
    isProduction: isProduction(),
    isStaging: isStaging(),
    analyticsEnabled: isAnalyticsEnabled(),
    errorReportingEnabled: isErrorReportingEnabled(),
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Not set',
    sentryDsn: import.meta.env.VITE_SENTRY_DSN ? 'Set' : 'Not set',
    gaTrackingId: import.meta.env.VITE_GA_TRACKING_ID ? 'Set' : 'Not set',
    posthogKey: import.meta.env.VITE_POSTHOG_KEY ? 'Set' : 'Not set',
  };
}
