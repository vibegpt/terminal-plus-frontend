import { useEffect, useState } from 'react';

interface UsePullToRefreshOptions {
  threshold?: number;
  resistance?: number;
  onRefresh: () => Promise<void>;
  enabled?: boolean;
}

interface UsePullToRefreshReturn {
  isPulling: boolean;
  pullDistance: number;
  isRefreshing: boolean;
}

export function usePullToRefresh({
  threshold = 60,
  resistance = 0.5,
  onRefresh,
  enabled = true
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  useEffect(() => {
    if (!enabled) return;

    let startY = 0;
    let currentY = 0;
    let isAtTop = false;
    
    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      isAtTop = window.scrollY === 0;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isAtTop || isRefreshing) return;
      
      currentY = e.touches[0].clientY;
      const distance = currentY - startY;
      
      if (distance > 0) {
        e.preventDefault();
        const resistanceDistance = distance * resistance;
        setPullDistance(Math.min(resistanceDistance, threshold * 1.5));
        setIsPulling(true);
      }
    };
    
    const handleTouchEnd = async () => {
      if (!isPulling || isRefreshing) {
        setPullDistance(0);
        setIsPulling(false);
        return;
      }

      if (pullDistance > threshold) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } catch (error) {
          console.error('Pull to refresh failed:', error);
        } finally {
          setIsRefreshing(false);
        }
      }
      
      setPullDistance(0);
      setIsPulling(false);
    };
    
    const handleScroll = () => {
      isAtTop = window.scrollY === 0;
    };
    
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isPulling, pullDistance, isRefreshing, threshold, resistance, onRefresh, enabled]);
  
  return { isPulling, pullDistance, isRefreshing };
}

export default usePullToRefresh;
