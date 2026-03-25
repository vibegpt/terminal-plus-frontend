import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  pageLoadTime: number;
  componentLoadTime: number;
  bundleSize: number;
  cacheHitRate: number;
}

export function usePerformanceMonitoring(componentName: string) {
  const startTime = useRef<number>(Date.now());
  const metrics = useRef<PerformanceMetrics>({
    pageLoadTime: 0,
    componentLoadTime: 0,
    bundleSize: 0,
    cacheHitRate: 0
  });

  useEffect(() => {
    const endTime = Date.now();
    const loadTime = endTime - startTime.current;
    
    metrics.current.componentLoadTime = loadTime;
    
    // Log performance metrics in development
    if (import.meta.env.DEV) {
      console.log(`🚀 ${componentName} loaded in ${loadTime}ms`);
    }

    // Track with analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'component_load_time', {
        event_category: 'Performance',
        event_label: componentName,
        value: loadTime
      });
    }

    // Track with Sentry
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.addBreadcrumb({
        category: 'performance',
        message: `${componentName} component loaded`,
        level: 'info',
        data: {
          loadTime,
          timestamp: new Date().toISOString()
        }
      });
    }
  }, [componentName]);

  return metrics.current;
}

// Hook for measuring page load performance
export function usePagePerformance() {
  useEffect(() => {
    const measurePageLoad = () => {
      if (typeof window === 'undefined') return;

      // Measure various performance metrics
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        const metrics = {
          // Time to First Byte
          ttfb: navigation.responseStart - navigation.requestStart,
          // DOM Content Loaded
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          // Load Complete
          loadComplete: navigation.loadEventEnd - navigation.navigationStart,
          // First Paint
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          // First Contentful Paint
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
          // Largest Contentful Paint
          largestContentfulPaint: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime || 0,
          // Cumulative Layout Shift
          cumulativeLayoutShift: performance.getEntriesByType('layout-shift').reduce((acc, entry) => acc + entry.value, 0)
        };

        // Log metrics in development
        if (import.meta.env.DEV) {
          console.log('📊 Page Performance Metrics:', metrics);
        }

        // Track with analytics
        if (typeof gtag !== 'undefined') {
          gtag('event', 'page_performance', {
            event_category: 'Performance',
            custom_map: {
              ttfb: Math.round(metrics.ttfb),
              dom_content_loaded: Math.round(metrics.domContentLoaded),
              load_complete: Math.round(metrics.loadComplete),
              first_paint: Math.round(metrics.firstPaint),
              first_contentful_paint: Math.round(metrics.firstContentfulPaint),
              largest_contentful_paint: Math.round(metrics.largestContentfulPaint),
              cumulative_layout_shift: Math.round(metrics.cumulativeLayoutShift * 1000) / 1000
            }
          });
        }

        // Track with Sentry
        if (typeof window !== 'undefined' && window.Sentry) {
          window.Sentry.addBreadcrumb({
            category: 'performance',
            message: 'Page performance metrics collected',
            level: 'info',
            data: metrics
          });
        }
      }
    };

    // Measure after page load
    if (document.readyState === 'complete') {
      measurePageLoad();
    } else {
      window.addEventListener('load', measurePageLoad);
      return () => window.removeEventListener('load', measurePageLoad);
    }
  }, []);
}

// Hook for measuring bundle size and cache performance
export function useBundlePerformance() {
  useEffect(() => {
    const measureBundleSize = () => {
      if (typeof window === 'undefined') return;

      // Estimate bundle size from loaded scripts
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      const totalSize = scripts.reduce((acc, script) => {
        const src = script.getAttribute('src');
        if (src && src.includes('assets/')) {
          // This is a rough estimate - in production you'd want more accurate measurement
          return acc + 100; // Assume ~100KB per chunk
        }
        return acc;
      }, 0);

      // Check cache performance
      const cacheHitRate = performance.getEntriesByType('resource').filter(entry => 
        entry.transferSize === 0 // Cached resources have transferSize of 0
      ).length / performance.getEntriesByType('resource').length;

      const metrics = {
        estimatedBundleSize: totalSize,
        cacheHitRate: Math.round(cacheHitRate * 100) / 100,
        resourceCount: performance.getEntriesByType('resource').length
      };

      if (import.meta.env.DEV) {
        console.log('📦 Bundle Performance:', metrics);
      }

      // Track with analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', 'bundle_performance', {
          event_category: 'Performance',
          custom_map: {
            bundle_size: totalSize,
            cache_hit_rate: Math.round(cacheHitRate * 100),
            resource_count: metrics.resourceCount
          }
        });
      }
    };

    // Measure after a short delay to ensure all resources are loaded
    const timeoutId = setTimeout(measureBundleSize, 1000);
    return () => clearTimeout(timeoutId);
  }, []);
}

// Hook for measuring lazy loading performance
export function useLazyLoadPerformance(componentName: string) {
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    const endTime = Date.now();
    const loadTime = endTime - startTime.current;

    if (import.meta.env.DEV) {
      console.log(`⚡ Lazy loaded ${componentName} in ${loadTime}ms`);
    }

    // Track lazy load performance
    if (typeof gtag !== 'undefined') {
      gtag('event', 'lazy_load_time', {
        event_category: 'Performance',
        event_label: componentName,
        value: loadTime
      });
    }
  }, [componentName]);
}

export default usePerformanceMonitoring;
