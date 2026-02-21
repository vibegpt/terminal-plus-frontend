import { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  threshold?: number;
}

interface VirtualScrollState {
  visibleStartIndex: number;
  visibleEndIndex: number;
  totalHeight: number;
  offsetY: number;
  visibleItems: any[];
}

export const useVirtualScroll = <T>(
  items: T[],
  options: VirtualScrollOptions
) => {
  const { itemHeight, containerHeight, overscan = 5, threshold = 0.1 } = options;
  
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // Calculate visible range
  const visibleStartIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleEndIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  // Calculate total height and offset
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStartIndex * itemHeight;

  // Get visible items
  const visibleItems = items.slice(visibleStartIndex, visibleEndIndex + 1);

  // Handle scroll events
  const handleScroll = useCallback((scrollTop: number) => {
    setScrollTop(scrollTop);
    setIsScrolling(true);

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Set timeout to detect end of scrolling
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    visibleStartIndex,
    visibleEndIndex,
    totalHeight,
    offsetY,
    visibleItems,
    isScrolling,
    handleScroll
  };
};

// Hook for lazy loading with virtual scrolling
export const useLazyVirtualScroll = <T>(
  items: T[],
  options: VirtualScrollOptions,
  loadMore: () => void
) => {
  const virtualScroll = useVirtualScroll(items, options);
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px'
  });

  // Load more items when approaching the end
  useEffect(() => {
    if (inView && virtualScroll.visibleEndIndex >= items.length - 10) {
      loadMore();
    }
  }, [inView, virtualScroll.visibleEndIndex, items.length, loadMore]);

  return {
    ...virtualScroll,
    loadMoreRef
  };
};

// Hook for performance monitoring with virtual scrolling
export const useVirtualScrollPerformance = () => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    scrollFPS: 0,
    memoryUsage: 0
  });

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  const measurePerformance = useCallback(() => {
    const now = performance.now();
    const deltaTime = now - lastTimeRef.current;
    
    frameCountRef.current++;
    
    if (deltaTime >= 1000) { // Calculate FPS every second
      const fps = Math.round((frameCountRef.current * 1000) / deltaTime);
      
      setMetrics(prev => ({
        ...prev,
        scrollFPS: fps,
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
      }));
      
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }
  }, []);

  const measureRenderTime = useCallback((startTime: number) => {
    const renderTime = performance.now() - startTime;
    setMetrics(prev => ({ ...prev, renderTime }));
  }, []);

  return {
    metrics,
    measurePerformance,
    measureRenderTime
  };
};

// Hook for intersection observer with virtual scrolling optimization
export const useOptimizedIntersection = (options = {}) => {
  const { ref, inView, entry } = useInView({
    threshold: 0.1,
    rootMargin: '50px',
    ...options
  });

  const [isIntersecting, setIsIntersecting] = useState(false);
  const intersectionTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (inView !== isIntersecting) {
      // Debounce intersection changes to avoid rapid state updates
      if (intersectionTimeoutRef.current) {
        clearTimeout(intersectionTimeoutRef.current);
      }

      intersectionTimeoutRef.current = setTimeout(() => {
        setIsIntersecting(inView);
      }, 50);
    }

    return () => {
      if (intersectionTimeoutRef.current) {
        clearTimeout(intersectionTimeoutRef.current);
      }
    };
  }, [inView, isIntersecting]);

  return {
    ref,
    inView: isIntersecting,
    entry
  };
};
