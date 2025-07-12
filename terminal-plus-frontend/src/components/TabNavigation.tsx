import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JourneyInputScreen } from "@/components/JourneyInputScreen";
import { JourneySuccessScreen } from "@/components/JourneySuccessScreen";
import { JourneyHistoryScreen } from "@/components/JourneyHistoryScreen";
import { ProfileScreen } from "@/components/ProfileScreen";
import { useState } from "react";

export function TabNavigation() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("journey");

  const onJourneySaved = () => {
    setShowSuccess(true);
    
    // Automatically navigate to history after 3 seconds
    setTimeout(() => {
      setShowSuccess(false);
      setActiveTab("history");
    }, 3000);
  };

  if (showSuccess) {
    return <JourneySuccessScreen onContinue={() => {
      setShowSuccess(false);
      setActiveTab("history");
    }} />;
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1">
      <TabsList>
        <TabsTrigger value="journey">Plan Journey</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
        <TabsTrigger value="profile">Profile</TabsTrigger>
      </TabsList>
      <TabsContent value="journey" className="p-0 overflow-hidden flex-1">
        <JourneyInputScreen onJourneySaved={onJourneySaved} />
      </TabsContent>
      <TabsContent value="history" className="p-0 overflow-hidden flex-1">
        <JourneyHistoryScreen />
      </TabsContent>
      <TabsContent value="profile" className="p-0 overflow-hidden flex-1">
        <ProfileScreen />
      </TabsContent>
    </Tabs>
  );
}
