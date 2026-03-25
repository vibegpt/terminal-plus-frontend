// src/utils/performanceMonitor.ts - Performance monitoring utilities
import { trackNavigationEvent } from './navigationHelpers';

export interface NavigationMetrics {
  navigationStart: number;
  dataFetchStart: number;
  dataFetchEnd: number;
  renderStart: number;
  renderEnd: number;
}

export const measureNavigationPerformance = (): {
  markDataFetchStart: () => void;
  markDataFetchEnd: () => void;
  markRenderStart: () => void;
  markRenderEnd: () => void;
  getMetrics: () => NavigationMetrics;
} => {
  const metrics: NavigationMetrics = {
    navigationStart: performance.now(),
    dataFetchStart: 0,
    dataFetchEnd: 0,
    renderStart: 0,
    renderEnd: 0
  };
  
  return {
    markDataFetchStart: () => {
      metrics.dataFetchStart = performance.now();
    },
    
    markDataFetchEnd: () => {
      metrics.dataFetchEnd = performance.now();
    },
    
    markRenderStart: () => {
      metrics.renderStart = performance.now();
    },
    
    markRenderEnd: () => {
      metrics.renderEnd = performance.now();
      
      const totalTime = metrics.renderEnd - metrics.navigationStart;
      const dataFetchTime = metrics.dataFetchEnd - metrics.dataFetchStart;
      const renderTime = metrics.renderEnd - metrics.renderStart;
      
      // Log performance metrics
      console.log('Navigation Performance:', {
        total: `${totalTime.toFixed(2)}ms`,
        dataFetch: `${dataFetchTime.toFixed(2)}ms`,
        render: `${renderTime.toFixed(2)}ms`
      });
      
      // Send to analytics if slow
      if (totalTime > 3000) {
        trackNavigationEvent('slow_navigation', {
          totalTime,
          dataFetchTime,
          renderTime,
          path: window.location.pathname
        });
      }
      
      // Store performance data for analysis
      try {
        const performanceLog = JSON.parse(localStorage.getItem('performance_log') || '[]');
        performanceLog.push({
          timestamp: new Date().toISOString(),
          path: window.location.pathname,
          metrics: {
            total: totalTime,
            dataFetch: dataFetchTime,
            render: renderTime
          }
        });
        localStorage.setItem('performance_log', JSON.stringify(performanceLog.slice(-100)));
      } catch (error) {
        console.warn('Failed to save performance log:', error);
      }
    },
    
    getMetrics: () => ({ ...metrics })
  };
};

// Component render performance monitoring
export const useComponentPerformance = (componentName: string) => {
  const startTime = performance.now();
  
  return {
    markRenderComplete: () => {
      const renderTime = performance.now() - startTime;
      
      if (renderTime > 100) { // Log slow renders
        console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
        
        trackNavigationEvent('slow_component_render', {
          componentName,
          renderTime,
          path: window.location.pathname
        });
      }
    }
  };
};

// Memory usage monitoring
export const monitorMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    
    const memoryInfo = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    };
    
    // Log memory usage
    console.log('Memory Usage:', {
      used: `${(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      total: `${(memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      limit: `${(memoryInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`,
      usage: `${memoryInfo.usagePercentage.toFixed(1)}%`
    });
    
    // Warn if memory usage is high
    if (memoryInfo.usagePercentage > 80) {
      console.warn('High memory usage detected:', memoryInfo.usagePercentage.toFixed(1) + '%');
      
      trackNavigationEvent('high_memory_usage', {
        usagePercentage: memoryInfo.usagePercentage,
        path: window.location.pathname
      });
    }
    
    return memoryInfo;
  }
  
  return null;
};

// Network performance monitoring
export const monitorNetworkPerformance = () => {
  if ('getEntriesByType' in performance) {
    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    
    if (navigationEntries.length > 0) {
      const entry = navigationEntries[0];
      
      const networkMetrics = {
        dnsLookup: entry.domainLookupEnd - entry.domainLookupStart,
        tcpConnection: entry.connectEnd - entry.connectStart,
        serverResponse: entry.responseEnd - entry.requestStart,
        domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
        loadComplete: entry.loadEventEnd - entry.loadEventStart,
        totalTime: entry.loadEventEnd - entry.navigationStart
      };
      
      console.log('Network Performance:', {
        dns: `${networkMetrics.dnsLookup.toFixed(2)}ms`,
        tcp: `${networkMetrics.tcpConnection.toFixed(2)}ms`,
        server: `${networkMetrics.serverResponse.toFixed(2)}ms`,
        domReady: `${networkMetrics.domContentLoaded.toFixed(2)}ms`,
        load: `${networkMetrics.loadComplete.toFixed(2)}ms`,
        total: `${networkMetrics.totalTime.toFixed(2)}ms`
      });
      
      // Track slow network performance
      if (networkMetrics.totalTime > 5000) {
        trackNavigationEvent('slow_network_performance', {
          ...networkMetrics,
          path: window.location.pathname
        });
      }
      
      return networkMetrics;
    }
  }
  
  return null;
};

// Performance budget monitoring
export const checkPerformanceBudget = (metrics: NavigationMetrics) => {
  const budget = {
    total: 3000, // 3 seconds
    dataFetch: 1500, // 1.5 seconds
    render: 1000 // 1 second
  };
  
  const violations = [];
  
  if (metrics.renderEnd - metrics.navigationStart > budget.total) {
    violations.push('Total navigation time exceeded budget');
  }
  
  if (metrics.dataFetchEnd - metrics.dataFetchStart > budget.dataFetch) {
    violations.push('Data fetch time exceeded budget');
  }
  
  if (metrics.renderEnd - metrics.renderStart > budget.render) {
    violations.push('Render time exceeded budget');
  }
  
  if (violations.length > 0) {
    console.warn('Performance budget violations:', violations);
    
    trackNavigationEvent('performance_budget_violation', {
      violations,
      metrics,
      path: window.location.pathname
    });
  }
  
  return violations;
};

// Auto-performance monitoring
export const startPerformanceMonitoring = () => {
  // Monitor memory usage every 30 seconds
  setInterval(() => {
    monitorMemoryUsage();
  }, 30000);
  
  // Monitor network performance on page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      monitorNetworkPerformance();
    }, 1000);
  });
  
  console.log('Performance monitoring started');
};
