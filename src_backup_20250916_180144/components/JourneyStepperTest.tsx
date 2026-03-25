import React from "react";
import JourneyStepper from "./JourneyStepper";

const JourneyStepperTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Journey Stepper Test</h1>
        <JourneyStepper />
      </div>
    </div>
  );
};

export default JourneyStepperTest; 