import React, { useState, useEffect } from “react”;
import { AppHeader } from “@/components/AppHeader”;
import { TabNavigation } from “@/components/TabNavigation”;
import { BottomNavigation } from “@/components/BottomNavigation”;
import { JourneyInputScreen } from “@/components/JourneyInputScreen”;
import { JourneySuccessScreen } from “@/components/JourneySuccessScreen”;
import { JourneyHistoryScreen } from “@/components/JourneyHistoryScreen”;
import { ProfileScreen } from “@/components/ProfileScreen”;
import { useAuth } from “@/hooks/useAuth”;
import { useLocation } from “wouter”;
import { Button } from “@/components/ui/button”;
import { Plane, History, User } from “lucide-react”;
import { track } from “@/lib/track”;

export default function HomePage() {
const [activeTab, setActiveTab] = useState(“journey”);
const [showSuccess, setShowSuccess] = useState(false);
const [renderError, setRenderError] = useState<Error | null>(null);
const { user } = useAuth();
const [_, setLocation] = useLocation();

useEffect(() => {
console.log(“HomePage rendered with:”, {
activeTab,
showSuccess,
user: user?.id,
});
}, [activeTab, showSuccess, user]);

const handleJourneySaved = () => {
setShowSuccess(true);
track(“journey_saved”, { userId: user?.id });

setTimeout(() => {
  setShowSuccess(false);
  setActiveTab("history");
}, 3000);

};

const renderContentSafely = () => {
try {
if (showSuccess) {
return (
<JourneySuccessScreen
onContinue={() => {
setShowSuccess(false);
setActiveTab(“history”);
}}
/>
);
}

  switch (activeTab) {
    case "journey":
      return <JourneyInputScreen onJourneySaved={handleJourneySaved} />;
    case "history":
      return <JourneyHistoryScreen />;
    case "profile":
      return <ProfileScreen />;
    default:
      return <JourneyInputScreen onJourneySaved={handleJourneySaved} />;
  }
} catch (error) {
  console.error("Error rendering content:", error);
  setRenderError(error as Error);
  return (
    <div className="p-6 text-red-500">
      <h3 className="text-lg font-bold">Error loading content</h3>
      <p>{(error as Error).message}</p>
    </div>
  );
}

};

if (renderError) {
return (

Something went wrong
{renderError.message}
<button
onClick={() => setRenderError(null)}
className=“px-4 py-2 bg-primary rounded”
>
Try Again


);
}

return (



  <main className="flex-1 p-6 flex flex-col justify-center">
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 text-transparent bg-clip-text mb-3">Terminal Plus</h1>
      <p className="text-slate-600 dark:text-slate-400">Your ultimate airport companion for smoother journeys</p>
    </div>

    <div className="grid gap-4 mb-8">
      <Button
        onClick={() => {
          track("navigate_plan_journey", { userId: user?.id });
          setLocation("/plan-journey");
        }}
        size="lg"
        className="py-6 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white"
      >
        <Plane className="h-5 w-5 mr-2" />
        Plan a New Journey
      </Button>

      <Button
        onClick={() => {
          track("navigate_your_journeys", { userId: user?.id });
          setLocation("/your-journeys");
        }}
        variant="outline"
        size="lg"
        className="py-6"
      >
        <History className="h-5 w-5 mr-2" />
        View Your Journeys
      </Button>
    </div>

    <div className="text-center">
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Get personalized recommendations based on your travel needs</p>
      <div className="flex justify-center space-x-4">
        {["Relax", "Explore", "Work", "Quick"].map((vibe) => (
          <div
            key={vibe}
            className="flex flex-col items-center"
            onClick={() => track("select_vibe", { vibe, userId: user?.id })}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 mb-1">
              {vibe === "Relax" && "😌"}
              {vibe === "Explore" && "🔍"}
              {vibe === "Work" && "💼"}
              {vibe === "Quick" && "⚡"}
            </div>
            <span className="text-xs font-medium">{vibe}</span>
          </div>
        ))}
      </div>
    </div>
  </main>
</div>

);
}