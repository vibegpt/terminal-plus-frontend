import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle, Plane, History } from "lucide-react";

export default function JourneySuccessPage() {
  const [_, setLocation] = useLocation();

  // Fire GA4 event and auto-redirect after 5 seconds
  useEffect(() => {
    // ✅ GA4 event for journey save success
    if (window.gtag) {
      window.gtag('event', 'save_journey_success', {
        event_category: 'Journey',
        event_label: 'Success',
      });
    }

    const timer = setTimeout(() => {
      setLocation("/your-journeys");
    }, 5000);

    return () => clearTimeout(timer);
  }, [setLocation]);

  const handlePlanAnother = () => {
    setLocation("/plan-journey");
  };

  const handleViewJourneys = () => {
    setLocation("/your-journeys");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-900">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 w-full max-w-md flex flex-col items-center">
        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Journey Saved!</h1>
        <p className="text-slate-600 dark:text-slate-300 mb-6 text-center">Your journey has been saved successfully. You can view or edit it anytime.</p>
        <Button className="w-full mb-2 bg-primary-600 text-white dark:text-white" onClick={() => setLocation("/my-journey")}>View My Journey</Button>
        <Button className="w-full bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white" onClick={() => setLocation("/")}>Back to Home</Button>
      </div>
    </div>
  );
}