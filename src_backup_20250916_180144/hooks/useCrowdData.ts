import { useMemo } from 'react';
import { useSocialProofWebSocket } from './useSocialProofWebSocket';

export interface CrowdData {
  occupancy: number;
  trend: 'increasing' | 'decreasing' | 'steady';
  queueTime?: number;
  capacity?: number;
  lastUpdated: number;
}

export const useCrowdData = (terminalCode?: string) => {
  console.log('🔗 useCrowdData called with terminalCode:', terminalCode);
  
  const { 
    spotPopularity, 
    activityFeed, 
    connected, 
    error,
    metrics 
  } = useSocialProofWebSocket(terminalCode);

  const crowdData = useMemo(() => {
    const data: Record<string, CrowdData> = {};
    
    Object.entries(spotPopularity).forEach(([spotId, popularity]) => {
      data[spotId] = {
        occupancy: popularity.current_occupancy,
        trend: popularity.occupancy_trend,
        queueTime: popularity.current_occupancy > 80 ? 
          Math.round(popularity.current_occupancy / 10) : undefined,
        capacity: 100,
        lastUpdated: popularity.last_updated
      };
    });

    return data;
  }, [spotPopularity]);

  return {
    crowdData,
    loading: !connected,
    error,
    connectionHealth: metrics.connectionHealth,
    updateAmenityCrowdData: () => console.log('Update crowd data'),
    refreshCrowdData: () => console.log('Crowd data refreshes automatically via WebSocket'),
    getAmenityCrowdData: (amenityId: string) => crowdData[amenityId],
    getAmenityCrowdLevel: (amenityId: string) => {
      const data = crowdData[amenityId];
      if (!data) return undefined;
      if (data.occupancy < 30) return 'low';
      if (data.occupancy < 70) return 'medium';
      return 'high';
    },
    getAmenityQueueTime: (amenityId: string) => crowdData[amenityId]?.queueTime,
    getAmenityCapacity: (amenityId: string) => crowdData[amenityId]?.capacity,
    recentActivity: activityFeed.slice(-10),
    totalMessages: activityFeed.length
  };
};
