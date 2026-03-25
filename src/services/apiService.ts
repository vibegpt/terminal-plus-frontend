// API Service for Terminal Plus Frontend
// Handles all communication with the secure backend API

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface VibeChatRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  vibe: string;
  mood: string;
}

export interface VibeChatResponse {
  response: string;
  usage: {
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
  };
  model: string;
}

export interface AmenitySearchRequest {
  query: string;
  amenities: Array<{
    id: string;
    name: string;
    category?: string;
    terminal_code?: string;
    description?: string;
  }>;
}

export interface AmenitySearchResponse {
  results: string;
  usage: {
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
  };
  method: 'ai_search' | 'pattern_matching';
  model: string;
}

export interface MoodDetectionRequest {
  text: string;
}

export interface MoodDetectionResponse {
  mood: 'happy' | 'sad' | 'stressed' | 'excited' | 'calm' | 'neutral';
  confidence: number;
  reasoning: string;
  usage: {
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
  };
  model: string;
}

export interface PatternSearchResponse {
  results: Array<{
    id: string;
    name: string;
    category?: string;
    terminal_code?: string;
    description?: string;
  }>;
  method: 'pattern_matching';
  count: number;
}

export class ApiService {
  private static async makeRequest<T>(
    endpoint: string, 
    options: RequestInit
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const duration = Date.now() - startTime;
      
      // Track API call for monitoring
      this.trackApiCall(endpoint, options.method || 'GET', duration, response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error ${response.status}: ${errorData.error || response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      // Track error for monitoring
      this.trackError(endpoint, error);
      throw error;
    }
  }

  // Vibe Chat - AI-powered chat with mood and vibe context
  static async vibeChat(request: VibeChatRequest): Promise<VibeChatResponse> {
    return this.makeRequest<VibeChatResponse>('/ai/vibe-chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Amenity Search - AI-powered amenity search
  static async searchAmenities(request: AmenitySearchRequest): Promise<AmenitySearchResponse> {
    return this.makeRequest<AmenitySearchResponse>('/ai/search-amenities', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Mood Detection - Analyze user text for emotional state
  static async detectMood(request: MoodDetectionRequest): Promise<MoodDetectionResponse> {
    return this.makeRequest<MoodDetectionResponse>('/ai/detect-mood', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Pattern-based Search - Fallback search when AI is unavailable
  static async patternSearch(request: AmenitySearchRequest): Promise<PatternSearchResponse> {
    return this.makeRequest<PatternSearchResponse>('/search/amenities', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Health Check - Verify backend is running
  static async healthCheck(): Promise<{ status: string; timestamp: string; version: string }> {
    return this.makeRequest('/health', {
      method: 'GET',
    });
  }

  // Smart Search - Automatically choose between AI and pattern search
  static async smartSearch(request: AmenitySearchRequest): Promise<AmenitySearchResponse | PatternSearchResponse> {
    try {
      // Try AI search first
      return await this.searchAmenities(request);
    } catch (error) {
      console.warn('AI search failed, falling back to pattern search:', error);
      
      try {
        // Fallback to pattern search
        return await this.patternSearch(request);
      } catch (fallbackError) {
        console.error('Both AI and pattern search failed:', fallbackError);
        throw new Error('Search service unavailable. Please try again later.');
      }
    }
  }

  // Batch Operations - Send multiple requests efficiently
  static async batchVibeChat(requests: VibeChatRequest[]): Promise<VibeChatResponse[]> {
    // For now, process sequentially to avoid overwhelming the API
    // In the future, this could be optimized with a batch endpoint
    const results: VibeChatResponse[] = [];
    
    for (const request of requests) {
      try {
        const result = await this.vibeChat(request);
        results.push(result);
      } catch (error) {
        console.error('Batch request failed:', error);
        // Continue with other requests
      }
    }
    
    return results;
  }

  // Utility Methods

  // Check if backend is available
  static async isBackendAvailable(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch {
      return false;
    }
  }

  // Get API status and version
  static async getApiStatus(): Promise<{
    available: boolean;
    version?: string;
    timestamp?: string;
  }> {
    try {
      const health = await this.healthCheck();
      return {
        available: true,
        version: health.version,
        timestamp: health.timestamp,
      };
    } catch {
      return { available: false };
    }
  }

  // Private monitoring methods

  private static trackApiCall(
    endpoint: string, 
    method: string, 
    duration: number, 
    status: number
  ) {
    // Log API call for monitoring
    console.log(`API Call: ${method} ${endpoint} - ${duration}ms - Status: ${status}`);
    
    // In production, send to analytics service
    if (import.meta.env.PROD) {
      // Example: send to analytics service
      // analytics.track('api_call', { endpoint, method, duration, status });
    }
  }

  private static trackError(endpoint: string, error: any) {
    // Log error for monitoring
    console.error(`API Error in ${endpoint}:`, error);
    
    // In production, send to error tracking service
    if (import.meta.env.PROD) {
      // Example: send to error tracking service
      // errorTracker.captureException(error, { endpoint });
    }
  }
}

// Export default instance for convenience
export default ApiService;
