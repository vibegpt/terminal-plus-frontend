import { useEffect, useState } from "react";
import type { Amenity } from "../types/amenity.types";
import type { JourneyData } from "../types/journey.types";

const AMENITY_CACHE_KEY = "terminalplus_cached_amenities";
const JOURNEY_CACHE_KEY = "terminalplus_cached_journey";
const TTL = 1000 * 60 * 60 * 2; // 2 hours

type CacheResult<T> = {
  data: T | null;
  isOffline: boolean;
  isLoading: boolean;
};

export function useOfflineAmenities(fetchLive: () => Promise<Amenity[]>): CacheResult<Amenity[]> {
  const [data, setData] = useState<Amenity[] | null>(null);
  const [isOffline, setOffline] = useState(false);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const cached = localStorage.getItem(AMENITY_CACHE_KEY);
        const now = Date.now();

        if (cached) {
          const { data: cachedData, timestamp } = JSON.parse(cached);
          const isStale = now - timestamp > TTL;

          if (!navigator.onLine || isStale) {
            setData(cachedData);
            setOffline(true);
            setLoading(false);
            return;
          }
        }

        try {
          const fresh = await fetchLive();
          localStorage.setItem(
            AMENITY_CACHE_KEY,
            JSON.stringify({ data: fresh, timestamp: now })
          );
          setData(fresh);
          setOffline(false);
        } catch (error) {
          console.warn("Failed to fetch live amenities, using cached data:", error);
          if (cached) {
            const { data: cachedData } = JSON.parse(cached);
            setData(cachedData);
            setOffline(true);
          }
        }
      } catch (error) {
        console.error("Error loading amenities from cache:", error);
        setData(null);
        setOffline(true);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [fetchLive]);

  return { data, isOffline, isLoading };
}

export function useOfflineJourney(): {
  journey: JourneyData | null;
  saveJourney: (data: JourneyData) => void;
  clearJourney: () => void;
} {
  const [journey, setJourney] = useState<JourneyData | null>(null);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(JOURNEY_CACHE_KEY);
      if (cached) {
        const parsedJourney = JSON.parse(cached);
        setJourney(parsedJourney);
      }
    } catch (error) {
      console.error("Error loading journey from cache:", error);
      // Clear corrupted cache
      localStorage.removeItem(JOURNEY_CACHE_KEY);
    }
  }, []);

  const saveJourney = (data: JourneyData) => {
    try {
      localStorage.setItem(JOURNEY_CACHE_KEY, JSON.stringify(data));
      setJourney(data);
    } catch (error) {
      console.error("Error saving journey to cache:", error);
    }
  };

  const clearJourney = () => {
    try {
      localStorage.removeItem(JOURNEY_CACHE_KEY);
      setJourney(null);
    } catch (error) {
      console.error("Error clearing journey cache:", error);
    }
  };

  return { journey, saveJourney, clearJourney };
} 