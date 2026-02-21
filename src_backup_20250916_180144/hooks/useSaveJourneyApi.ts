import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { JourneyData } from "@/types/journey.types";
import type { Vibe } from "@/types/common.types";

// Local interface for API-specific journey data
type ApiJourneyData = {
  flight_number: string;
  origin: string;
  destination: string;
  transit?: string;
  selected_vibe: Vibe;
};

export const useSaveJourneyApi = () => {
  const { toast } = useToast();
  
  const saveJourneyMutation = useMutation({
    mutationFn: async (journey: ApiJourneyData) => {
      console.log("useSaveJourneyApi - Starting API call");
      
      // First check if we have a session
      try {
        const response = await fetchWithAuth("/api/saveJourney", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(journey),
        });
        
        console.log("useSaveJourneyApi - API response:", response.status);

        // Handle different response statuses
        if (response.status === 401) {
          console.error("useSaveJourneyApi - Authentication error (401)");
          throw new Error("Please log in to save your journey.");
        }
        
        if (response.status === 404) {
          console.error("useSaveJourneyApi - Endpoint not found (404)");
          throw new Error("Journey service unavailable. Please try again later.");
        }
        
        if (!response.ok) {
          let errorMessage = "Failed to save journey.";
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            // If parsing JSON fails, use status text
            errorMessage = response.statusText || errorMessage;
          }
          
          console.error(`useSaveJourneyApi - API error: ${errorMessage}`);
          throw new Error(errorMessage);
        }

        // Successfully saved journey
        const data = await response.json();
        console.log("useSaveJourneyApi - Journey saved successfully:", data);
        return data;
      } catch (error) {
        console.error("useSaveJourneyApi - Exception:", error);
        throw error;
      }
    },
    onError: (error: Error) => {
      console.error("useSaveJourneyApi - Mutation error:", error);
      toast({
        title: "Error",
        description: `Failed to save journey: ${error.message}`,
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      console.log("useSaveJourneyApi - Mutation success:", data);
      toast({
        title: "Success",
        description: "Journey saved successfully!",
      });
    }
  });

  return { saveJourneyMutation };
};