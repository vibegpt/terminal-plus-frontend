import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";

type TripStop = {
  Name: string;
  Type: string;
  LocationDescription: string;
};

type TripSegment = {
  airport: string;
  terminal: string;
  type: string;
  vibe: string;
  plan: TripStop[];
};

type Trip = {
  id: string;
  title: string;
  journeys: TripSegment[];
  created_at: string;
  user_id: string;
};

export default function SavedTrips() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch trips using React Query
  const { 
    data,
    isLoading, 
    error 
  } = useQuery<{trips: Trip[]}>({
    queryKey: ["/api/loadTripBundles"],
    queryFn: getQueryFn({ on401: "returnNull" })
  });

  const handleViewTrip = (trip: Trip) => {
    // Store the trip data in localStorage
    localStorage.setItem("currentTripData", JSON.stringify(trip.journeys));
    setLocation("/multi-airport-journey");
  };

  const handleDeleteTrip = async (id: string) => {
    // Ask for confirmation
    if (!window.confirm("Are you sure you want to delete this trip?")) {
      return;
    }

    setIsDeleting(id);
    
    try {
      const response = await apiRequest("DELETE", `/api/deleteTripBundle/${id}`);
      
      if (response.ok) {
        // Invalidate and refetch trips after successful deletion
        queryClient.invalidateQueries({ queryKey: ["/api/loadTripBundles"] });
        
        toast({
          title: "Trip deleted",
          description: "The trip has been successfully deleted",
          variant: "default",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete trip");
      }
    } catch (err) {
      console.error("Error deleting trip:", err);
      toast({
        title: "Error deleting trip",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  // Show error toast if there was an error fetching trips
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading trips",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 dark:text-blue-400" />
        <p className="ml-2 text-lg text-slate-900 dark:text-white">Loading your saved trips...</p>
      </div>
    );
  }

  const trips = data?.trips || [];

  if (trips.length === 0) {
    return (
      <div className="p-6 text-center bg-white dark:bg-slate-900">
        <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">📂 Your Saved Trips</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">No saved trips yet.</p>
        <button
          onClick={() => setLocation("/")}
          className="mt-4 bg-blue-600 dark:bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition"
        >
          Plan New Trip
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-slate-900">
      <h1 className="text-2xl font-bold mb-6 text-center text-slate-900 dark:text-white">📂 Your Saved Trips</h1>

      <ul className="space-y-4">
        {trips.map((trip) => (
          <li
            key={trip.id}
            className="border border-slate-200 dark:border-slate-700 p-4 rounded shadow flex flex-col gap-2 bg-white dark:bg-slate-800"
          >
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">{trip.title}</span>
              <div className="text-gray-500 dark:text-gray-400 text-sm">
                {new Date(trip.created_at).toLocaleString()}
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleViewTrip(trip)}
                className="bg-green-600 dark:bg-green-500 text-white py-1 px-4 rounded hover:bg-green-700 dark:hover:bg-green-600 text-sm"
              >
                View Trip ➔
              </button>
              <button
                onClick={() => handleDeleteTrip(trip.id)}
                disabled={isDeleting === trip.id}
                className="bg-red-500 dark:bg-red-400 text-white py-1 px-4 rounded hover:bg-red-600 dark:hover:bg-red-500 text-sm flex items-center gap-1"
              >
                {isDeleting === trip.id ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="text-center mt-8">
        <button
          onClick={() => setLocation("/")}
          className="text-blue-600 dark:text-blue-400 underline text-sm"
        >
          Plan Another Journey
        </button>
      </div>
    </div>
  );
}