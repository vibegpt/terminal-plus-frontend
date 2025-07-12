import { useState, useEffect } from 'react';
import { getRecommendations } from '../services/recommendationService';
import { TerminalAmenity } from '../types/amenity';

interface UseRecommendationsProps {
  amenities: TerminalAmenity[];
  currentTerminal: string;
  currentGate: string;
  timeAvailableMinutes: number;
  initialVibe?: string;
}

// Helper function to get gate coordinates
const getGateCoordinates = (terminal: string, gate: string) => {
  // Default coordinates for each terminal
  const terminalCoordinates: Record<string, { x: number, y: number }> = {
    'T1': { x: 0.5, y: 0.5 },
    'T2': { x: 0.7, y: 0.5 },
    'T3': { x: 0.3, y: 0.5 }
  };

  // Get base coordinates for the terminal
  const baseCoords = terminalCoordinates[terminal] || { x: 0.5, y: 0.5 };

  // Adjust coordinates based on gate (this is a simplified example)
  const gateNumber = parseInt(gate.replace(/[^0-9]/g, ''));
  const gateLetter = gate.replace(/[^A-Z]/g, '');
  
  // Adjust x coordinate based on gate number
  const xOffset = (gateNumber % 10) * 0.02;
  // Adjust y coordinate based on gate letter
  const yOffset = (gateLetter.charCodeAt(0) - 65) * 0.02;

  return {
    x: baseCoords.x + xOffset,
    y: baseCoords.y + yOffset
  };
};

export const useRecommendations = ({
  amenities,
  currentTerminal,
  currentGate,
  timeAvailableMinutes,
  initialVibe = 'Explore'
}: UseRecommendationsProps) => {
  const [activeVibe, setActiveVibe] = useState(initialVibe);
  const [previousVibe, setPreviousVibe] = useState<string | undefined>();
  const [recommendations, setRecommendations] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const priorityFlags = {
    show_time_sensitive: timeAvailableMinutes < 30,
    avoid_long_walks: timeAvailableMinutes < 45,
    prefer_quick_restore: timeAvailableMinutes < 20
  };

  // Sync activeVibe with initialVibe if it changes
  useEffect(() => {
    setActiveVibe(initialVibe);
  }, [initialVibe]);

  const changeVibe = (newVibe: string) => {
    setPreviousVibe(activeVibe);
    setActiveVibe(newVibe);
  };

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const current_location = getGateCoordinates(currentTerminal, currentGate);
        
        const context = {
          current_terminal: currentTerminal,
          current_gate: currentGate,
          time_available_minutes: timeAvailableMinutes,
          active_vibe: activeVibe,
          previous_vibe: previousVibe,
          priority_flags: priorityFlags,
          current_location
        };

        const result = await getRecommendations(amenities, context);
        setRecommendations(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch recommendations'));
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [amenities, currentTerminal, currentGate, timeAvailableMinutes, activeVibe, previousVibe]);

  return {
    recommendations,
    loading,
    error,
    activeVibe,
    previousVibe,
    changeVibe,
    priorityFlags
  };
}; 