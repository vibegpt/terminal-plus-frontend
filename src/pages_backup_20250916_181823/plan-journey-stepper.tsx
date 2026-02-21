import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSimpleToast } from '@/hooks/useSimpleToast';
import { SmartJourneyFlow } from '@/components/journey-stepper/SmartJourneyFlow';

// Option to switch between classic and smart flow
const USE_SMART_FLOW = true; // Toggle this for A/B testing

export default function PlanJourneyStepperPage() {
  const navigate = useNavigate();
  const { showToast } = useSimpleToast();

  // Show smart flow by default, fallback to classic if needed
  if (USE_SMART_FLOW) {
    return (
      <div className="min-h-screen bg-[#0E1B33]">
        {/* Header with back button */}
        <div className="absolute top-4 left-4 z-10">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-white hover:text-gray-300 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full"
          >
            ← Home
          </Button>
        </div>
        
        <SmartJourneyFlow />
      </div>
    );
  }

  // Classic flow fallback (your existing stepper)
  return <ClassicJourneyFlow />;
}

// Your existing journey stepper as fallback
const ClassicJourneyFlow = () => {
  // ... your existing stepper code here
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-900 p-6">
      {/* Your existing stepper implementation */}
    </div>
  );
}; 