// /src/components/JourneyStepper.tsx
import React, { useReducer, useMemo } from "react";
import type { JourneyData } from "../types/journey.types";

type GuideContext = "departure" | "transit" | "arrival" | null;

type StepperState = {
  currentStep: number;
  guideContext: GuideContext;
  levelUpExpanded: boolean;
  journeyData: JourneyData;
};

type StepperAction =
  | { type: "SET_STEP"; payload: number }
  | { type: "TOGGLE_LEVEL_UP" }
  | { type: "SET_GUIDE_CONTEXT"; payload: GuideContext }
  | { type: "UPDATE_JOURNEY"; payload: Partial<JourneyData> };

const initialState: StepperState = {
  currentStep: 0,
  guideContext: null,
  levelUpExpanded: false,
  journeyData: {
    from: "",
    to: "",
    selected_vibe: undefined,
    flightNumber: "",
    date: "",
    layovers: [],
  },
};

function journeyStepperReducer(state: StepperState, action: StepperAction): StepperState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, currentStep: action.payload };
    case "TOGGLE_LEVEL_UP":
      return { ...state, levelUpExpanded: !state.levelUpExpanded };
    case "SET_GUIDE_CONTEXT":
      return { ...state, guideContext: action.payload };
    case "UPDATE_JOURNEY":
      return { ...state, journeyData: { ...state.journeyData, ...action.payload } };
    default:
      return state;
  }
}

// ✅ Reusable validation logic
const useStepValidation = (
  currentStep: number,
  journeyData: JourneyData,
  levelUpExpanded: boolean
): boolean => {
  return useMemo(() => {
    const validators: Record<number, () => boolean> = {
      0: () => {
        const hasValidAirports =
          /^[A-Z]{3}$/.test(journeyData.departure || '') &&
          /^[A-Z]{3}$/.test(journeyData.destination || '');
        const hasFlight = !!journeyData.flightNumber;
        return levelUpExpanded ? hasValidAirports && hasFlight : hasValidAirports;
      },
      1: () => !!journeyData.selected_vibe,
      2: () => true,
      3: () => true,
    };
    return validators[currentStep]?.() ?? true;
  }, [currentStep, journeyData, levelUpExpanded]);
};

// 🧩 Main component
const JourneyStepper: React.FC = () => {
  const [state, dispatch] = useReducer(journeyStepperReducer, initialState);
  const { currentStep, guideContext, levelUpExpanded, journeyData } = state;

  const canProceed = useStepValidation(currentStep, journeyData, levelUpExpanded);

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Plan Your Journey</h2>

      <div className="mb-6">
        <p className="text-sm text-gray-700">Step: {currentStep}</p>
        <p className="text-xs text-gray-500">Guide: {guideContext ?? "none"}</p>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => dispatch({ type: "SET_STEP", payload: currentStep - 1 })}
          disabled={currentStep === 0}
          className="bg-gray-300 px-4 py-2 rounded"
        >
          Back
        </button>
        <button
          onClick={() => dispatch({ type: "SET_STEP", payload: currentStep + 1 })}
          disabled={!canProceed}
          className={`px-4 py-2 rounded ${
            canProceed ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
          }`}
        >
          Next
        </button>
      </div>

      <div className="mt-4">
        <button
          onClick={() => dispatch({ type: "TOGGLE_LEVEL_UP" })}
          className="text-xs underline text-blue-500"
        >
          {levelUpExpanded ? "Hide Level Up" : "Show Level Up"}
        </button>
      </div>
    </div>
  );
};

export default JourneyStepper; 