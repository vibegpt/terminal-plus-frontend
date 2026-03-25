import * as Sentry from '@sentry/react';
import { config } from '@/config/environment';

export class MonitoringService {
  static init() {
    if (config.enableErrorReporting && config.sentryDsn) {
      Sentry.init({
        dsn: config.sentryDsn,
        environment: config.name,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration({
            maskAllText: false,
            blockAllMedia: false,
          }),
        ],
        tracesSampleRate: config.name === 'production' ? 0.1 : 1.0,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        beforeSend(event, hint) {
          // Filter out non-critical errors
          if (event.level === 'warning') {
            return null;
          }
          return event;
        },
      });
    }

    // Performance monitoring
    if (config.enableAnalytics) {
      this.initPerformanceMonitoring();
    }
  }

  private static initPerformanceMonitoring() {
    // Web Vitals monitoring
    import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
      const sendMetric = (metric: any) => {
        // Send to analytics
        if (window.gtag) {
          window.gtag('event', metric.name, {
            event_category: 'Web Vitals',
            value: Math.round(metric.value),
            event_label: metric.id,
            non_interaction: true,
          });
        }
        // Also send to Sentry
        Sentry.addBreadcrumb({
          category: 'performance',
          message: `${metric.name}: ${metric.value}`,
          level: 'info',
        });
      };

      onCLS(sendMetric);
      onFID(sendMetric);
      onFCP(sendMetric);
      onLCP(sendMetric);
      onTTFB(sendMetric);
    });
  }

  static logEvent(name: string, properties?: Record<string, any>) {
    // Send to PostHog if available
    if (window.posthog && config.posthogKey) {
      window.posthog.capture(name, properties);
    }
    
    // Send to GA4
    if (window.gtag && config.gaTrackingId) {
      window.gtag('event', name, properties);
    }
  }

  static setUser(userId: string, traits?: Record<string, any>) {
    Sentry.setUser({ id: userId, ...traits });
    
    if (window.posthog) {
      window.posthog.identify(userId, traits);
    }
  }
}
