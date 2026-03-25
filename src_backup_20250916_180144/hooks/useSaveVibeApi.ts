import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export const useSaveVibeApi = () => {
  const { toast } = useToast();
  
  const saveVibeMutation = useMutation({
    mutationFn: async (selectedVibe: "Chill" | "Explore" | "Work" | "Quick" | "Shop") => {
      const response = await fetchWithAuth("/api/saveVibe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode: selectedVibe }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save vibe.");
      }

      return await response.json();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to save vibe: ${error.message}`,
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vibe preference saved successfully!",
      });
    }
  });

  return { saveVibeMutation };
};