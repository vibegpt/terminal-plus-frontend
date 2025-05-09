import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const [_, setLocation] = useLocation();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-purple-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="text-center max-w-xl">
        <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-transparent bg-clip-text">
          Welcome to Terminal+
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mb-8 text-lg">
          Plan your airport time perfectly — relax, explore, recharge, or move fast.
        </p>
        <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
          <Button
            onClick={() => {
              sessionStorage.removeItem("tempJourneyData");
              setLocation("/plan-journey-stepper");
            }}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 py-3 px-6 text-lg"
            size="lg"
          >
            ✈️ Plan My Journey
          </Button>
          <Button
            onClick={() => setLocation("/explore-terminal")}
            className="bg-gradient-to-r from-green-600 to-emerald-600 py-3 px-6 text-lg"
            size="lg"
          >
            🔍 Explore Terminal
          </Button>
        </div>
      </div>
      <div className="mt-16 text-slate-400 dark:text-slate-500 text-sm">
        <p>© 2025 Terminal+. All rights reserved.</p>
      </div>
    </div>
  );
}