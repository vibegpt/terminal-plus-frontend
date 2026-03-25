// /src/hooks/useStepperLogic.ts
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSimpleToast } from "@/hooks/useSimpleToast";

interface StepperLogicOptions {
  initialData?: any;
  onComplete?: (savedJourney: any) => void;
}

export function useStepperLogic({ initialData, onComplete }: StepperLogicOptions) {
  const navigate = useNavigate();
  const { showToast, clearToast } = useSimpleToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [guideContext, setGuideContext] = useState<null | 'departure' | 'transit' | 'arrival'>(null);
  const [journeyData, setJourneyData] = useState(initialData || {
    departure: "",
    destination: "",
    flightNumber: "",
    flightDate: "",
    layovers: [] as string[],
    selected_vibe: "",
    terminal: ""
  });

  const canProceed = () => {
    if (guideContext) return false;
    if (currentStep === 0) return /^[A-Z]{3}$/.test(journeyData.departure) && /^[A-Z]{3}$/.test(journeyData.destination);
    if (currentStep === 1) return !!journeyData.selected_vibe;
    return true;
  };

  const handleNext = () => {
    if (currentStep === 2) {
      if (!journeyData.selected_vibe) {
        alert("Please select a vibe before continuing.");
        return;
      }
      const fullJourney = { ...journeyData, terminal: journeyData.terminal || "" };
      const dataString = JSON.stringify(fullJourney);
      sessionStorage.setItem("tempJourneyData", dataString);
      localStorage.setItem("lastJourneyData", dataString);
      showToast("Journey saved!", "success");

      setTimeout(() => {
        clearToast();
        if (onComplete) {
          onComplete(fullJourney);
        } else {
          setCurrentStep(currentStep + 1);
        }
      }, 1500);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (guideContext) {
      setGuideContext(null);
    } else if (currentStep === 0) {
      navigate(-1);
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window?.gtag) {
      window.gtag('event', 'step_change', {
        step: currentStep + 1,
        vibe: journeyData.selected_vibe || 'unset'
      });
    }
  }, [currentStep]);

  return {
    currentStep,
    setCurrentStep,
    journeyData,
    setJourneyData,
    guideContext,
    setGuideContext,
    canProceed,
    handleNext,
    handleBack
  };
} 