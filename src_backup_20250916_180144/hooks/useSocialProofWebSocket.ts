import { useState, useEffect, useCallback, useRef } from 'react';

// Types matching your backend schema
export type VibeType = 'chill' | 'explore' | 'comfort' | 'refuel' | 'work' | 'quick' | 'shop';

export interface AnonymizedActivityData {
  activity_id: string;
  activity_type: 'checkin' | 'checkout' | 'amenity_use' | 'recommendation_view' | string;
  amenity_id?: string;
  terminal_code: string;
  timestamp: number;
  meta?: Record<string, any>;
}

export interface SpotPopularityData {
  spot_id: string;
  current_occupancy: number;
  occupancy_trend: 'increasing' | 'decreasing' | 'steady';
  last_updated: number;
}

export interface SimilarUsersData {
  user_segment_id: string;
  top_vibes: VibeType[];
  recommended_spots: string[];
  rationale?: string;
}

export type SocialProofType = 'activity_feed' | 'spot_popularity' | 'similar_users';

export interface SocialProofMessage {
  type: SocialProofType;
  terminal_code: string;
  timestamp: number;
  data: AnonymizedActivityData | SpotPopularityData | SimilarUsersData;
  vibe_context?: VibeType[];
}

export interface BatchedSocialProofMessage {
  messages: SocialProofMessage[];
  batch_id: string;
  compression_used: boolean;
  estimated_data_usage: number;
}

export interface SocialProofMetrics {
  messageLatency: number;
  connectionHealth: 'excellent' | 'good' | 'poor' | 'disconnected';
  dataUsage: number;
  batteryImpact: number;
}

export interface SocialProofHookReturn {
  // Real-time data
  socialProofData: SocialProofMessage[];
  activityFeed: AnonymizedActivityData[];
  spotPopularity: Record<string, SpotPopularityData>;
  similarUsers: SimilarUsersData[];
  
  // Connection status
  connected: boolean;
  connecting: boolean;
  error: string | null;
  
  // Metrics
  metrics: SocialProofMetrics;
  
  // Actions
  reconnect: () => void;
  disconnect: () => void;
}

export function useSocialProofWebSocket(
  terminalCode?: string,
  autoConnect: boolean = true
): SocialProofHookReturn {
  const [socialProofData, setSocialProofData] = useState<SocialProofMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<SocialProofMetrics>({
    messageLatency: 0,
    connectionHealth: 'disconnected',
    dataUsage: 0,
    batteryImpact: 0
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageTimestampsRef = useRef<number[]>([]);

  // Derived state
  const activityFeed = socialProofData
    .filter(msg => msg.type === 'activity_feed')
    .map(msg => msg.data as AnonymizedActivityData)
    .slice(-50); // Keep last 50 activities

  const spotPopularity = socialProofData
    .filter(msg => msg.type === 'spot_popularity')
    .reduce((acc, msg) => {
      const data = msg.data as SpotPopularityData;
      acc[data.spot_id] = data;
      return acc;
    }, {} as Record<string, SpotPopularityData>);

  const similarUsers = socialProofData
    .filter(msg => msg.type === 'similar_users')
    .map(msg => msg.data as SimilarUsersData)
    .slice(-10); // Keep last 10 user segments

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnecting(true);
    setError(null);

    try {
      const ws = new WebSocket('ws://localhost:8081');
      
      ws.onopen = () => {
        console.log('🎉 Connected to Terminal+ Social Proof Backend');
        setConnected(true);
        setConnecting(false);
        setError(null);
        setMetrics(prev => ({ ...prev, connectionHealth: 'excellent' }));
      };

      ws.onmessage = (event) => {
        try {
          const timestamp = Date.now();
          const data = JSON.parse(event.data);
          
          // Handle both single messages and batched messages
          const messages: SocialProofMessage[] = data.messages || [data];
          
          // Calculate latency
          const latency = timestamp - (messages[0]?.timestamp || timestamp);
          setMetrics(prev => ({
            ...prev,
            messageLatency: latency,
            dataUsage: prev.dataUsage + event.data.length
          }));

          // Update social proof data
          setSocialProofData(prev => {
            const newData = [...prev, ...messages];
            // Keep last 1000 messages to prevent memory issues
            return newData.slice(-1000);
          });

          console.log(`📊 Received ${messages.length} social proof messages`, messages[0]?.type);
          
        } catch (err) {
          console.error('Error parsing social proof message:', err);
          setError('Failed to parse social proof data');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket connection error');
        setMetrics(prev => ({ ...prev, connectionHealth: 'poor' }));
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setConnected(false);
        setConnecting(false);
        setMetrics(prev => ({ ...prev, connectionHealth: 'disconnected' }));
        
        // Auto-reconnect if not a clean close
        if (event.code !== 1000 && autoConnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Attempting to reconnect to social proof backend...');
            connect();
          }, 3000);
        }
      };

      wsRef.current = ws;
      
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setConnecting(false);
      setError('Failed to connect to social proof backend');
    }
  }, [autoConnect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'User initiated disconnect');
      wsRef.current = null;
    }
    
    setConnected(false);
    setConnecting(false);
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(connect, 100);
  }, [connect, disconnect]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Update connection health based on recent message activity
  useEffect(() => {
    if (!connected) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const recentMessages = messageTimestampsRef.current.filter(
        timestamp => now - timestamp < 10000 // Last 10 seconds
      );

      let health: 'excellent' | 'good' | 'poor' | 'disconnected' = 'excellent';
      if (recentMessages.length === 0) health = 'poor';
      else if (recentMessages.length < 3) health = 'good';

      setMetrics(prev => ({ ...prev, connectionHealth: health }));
    }, 5000);

    return () => clearInterval(interval);
  }, [connected]);

  return {
    socialProofData,
    activityFeed,
    spotPopularity,
    similarUsers,
    connected,
    connecting,
    error,
    metrics,
    reconnect,
    disconnect
  };
}
