import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Plane, History } from "lucide-react";

interface JourneySuccessScreenProps {
  onContinue: () => void;
}

export function JourneySuccessScreen({ onContinue }: JourneySuccessScreenProps) {
  // In our app, navigation is handled by the parent component's callbacks
  const handlePlanAnother = () => {
    onContinue(); // This will bring us back to the journey input screen
  };

  const handleViewJourneys = () => {
    onContinue(); // This will take us back to HomePage where user can navigate to history
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 min-h-screen">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-2">
          <CheckCircle className="text-white h-14 w-14" />
        </div>
        
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
          🎉 Journey Saved Successfully!
        </h1>
        
        <p className="text-lg text-slate-600 dark:text-slate-300">
          You're all set for a smoother airport experience.
        </p>
        
        <p className="text-md text-slate-500 dark:text-slate-400">
          We've saved your flight details and vibe preferences for your upcoming journey.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
          <Button
            onClick={handlePlanAnother}
            className="px-6 py-6 rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:from-primary-700 hover:to-secondary-700"
          >
            <Plane className="h-5 w-5 mr-2" />
            Plan Another Journey
          </Button>
          
          <Button
            onClick={handleViewJourneys}
            variant="outline" 
            className="px-6 py-6 rounded-lg border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <History className="h-5 w-5 mr-2" />
            View My Journeys
          </Button>
        </div>
      </div>
    </div>
  );
}
