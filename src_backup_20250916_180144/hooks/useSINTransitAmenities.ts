import { useEffect, useState } from "react";
import { loadAmenitiesByTerminal } from "./useAmenities";
import { normalizeAmenity } from "@/utils/normalizeAmenity";
import { resolveTerminal } from "@/utils/terminalGuesses";

const SIN_TRANSIT_TERMINALS = [
  "SIN-T1",
  "SIN-T2", 
  "SIN-T3",
  "SIN-T4",
  "SIN-JEWEL",
];

interface SINTransitOptions {
  timeLeft?: number;
  arrivalFlightNumber?: string;
  departureFlightNumber?: string;
  layoverDuration?: number;
}

export function useSINTransitAmenities({
  timeLeft,
  arrivalFlightNumber,
  departureFlightNumber,
  layoverDuration
}: SINTransitOptions = {}) {
  const [amenities, setAmenities] = useState<any[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("🔍 useSINTransitAmenities: Loading SIN transit amenities...", {
          timeLeft,
          arrivalFlightNumber,
          departureFlightNumber,
          layoverDuration
        });
        
        // Predict arrival terminal based on flight number
        const predictedArrivalTerminal = arrivalFlightNumber 
          ? resolveTerminal({ airport: "SIN", flightNumber: arrivalFlightNumber })
          : "T1"; // Default fallback
        
        console.log(`🔍 Predicted arrival terminal: ${predictedArrivalTerminal}`);
        
        // Load all SIN terminal files
        const files = await Promise.all(
          SIN_TRANSIT_TERMINALS.map((code) => loadAmenitiesByTerminal(code))
        );

        const rawAmenities = files.flat();
        console.log(`🔍 useSINTransitAmenities: Loaded ${rawAmenities.length} total amenities from ${SIN_TRANSIT_TERMINALS.length} terminals`);
        
        // Normalize and filter by available_in_transit
        const normalized = rawAmenities
          .map(normalizeAmenity)
          .filter((a) => a.available_in_transit === true);
          
        console.log(`🔍 useSINTransitAmenities: ${normalized.length} amenities available in transit`);

        // Apply intelligent filtering and prioritization
        const filteredAndPrioritized = normalized
          .filter((a) => {
            if (!timeLeft) return true; // No time constraint
            
            const walkTimeStr = a.walkTime || "5 min walk";
            const walkMinutes = parseInt(walkTimeStr.replace("min walk", "").trim()) || 5;
            
            // Reserve 5 minutes buffer for navigation
            const availableTime = timeLeft - 5;
            
            return walkMinutes <= availableTime;
          })
          .map((amenity) => {
            // Add priority score based on terminal proximity and time constraints
            let priorityScore = 0;
            
            // Extract terminal from amenity
            const amenityTerminal = amenity.terminal?.split('-')[1] || "T1";
            
            // High priority for same terminal
            if (amenityTerminal === predictedArrivalTerminal) {
              priorityScore += 100;
            }
            
            // Medium priority for adjacent terminals
            const terminalDistance = getTerminalDistance(amenityTerminal, predictedArrivalTerminal);
            if (terminalDistance === 1) {
              priorityScore += 50;
            } else if (terminalDistance === 2) {
              priorityScore += 25;
            }
            
            // Time-based adjustments
            if (timeLeft) {
              const walkTimeStr = amenity.walkTime || "5 min walk";
              const walkMinutes = parseInt(walkTimeStr.replace("min walk", "").trim()) || 5;
              
              // Bonus for quick access during short layovers
              if (timeLeft < 30 && walkMinutes <= 10) {
                priorityScore += 20;
              }
              
              // Penalty for long walks during short layovers
              if (timeLeft < 60 && walkMinutes > 15) {
                priorityScore -= 30;
              }
            }
            
            return {
              ...amenity,
              priorityScore
            };
          })
          .sort((a, b) => b.priorityScore - a.priorityScore); // Sort by priority

        console.log(`🔍 useSINTransitAmenities: ${filteredAndPrioritized.length} amenities after filtering and prioritization`);
        console.log(`🔍 Top 3 amenities:`, filteredAndPrioritized.slice(0, 3).map(a => ({
          name: a.name,
          terminal: a.terminal,
          priorityScore: a.priorityScore,
          walkTime: a.walkTime
        })));
        
        setAmenities(filteredAndPrioritized);
      } catch (e) {
        console.error("🚫 useSINTransitAmenities error:", e);
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [timeLeft, arrivalFlightNumber, departureFlightNumber, layoverDuration]);

  return { amenities, isLoading, error };
}

// Helper function to calculate terminal distance
function getTerminalDistance(terminal1: string, terminal2: string): number {
  const terminalOrder = ["T1", "T2", "T3", "T4"];
  const t1Index = terminalOrder.indexOf(terminal1);
  const t2Index = terminalOrder.indexOf(terminal2);
  
  if (t1Index === -1 || t2Index === -1) return 3; // Default to far if unknown
  
  return Math.abs(t1Index - t2Index);
} 