import React, { useEffect } from "react";
import { useLocation } from "wouter";

export default function SplashScreen() {
  const [_, setLocation] = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLocation("/"); // After splash, move to LandingScreen
    }, 2000); // Show for 2 seconds

    return () => clearTimeout(timer); // Cleanup
  }, [setLocation]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="flex flex-col items-center gap-4 animate-pulse-slow">
        {/* Logo */}
        <div className="text-6xl font-bold text-blue-700 dark:text-blue-400">
          +
        </div>

        {/* App Name */}
        <div className="text-2xl text-blue-800 dark:text-blue-200 font-semibold">
          Terminal+
        </div>

        {/* Tagline */}
        <div className="text-gray-600 dark:text-gray-300 mt-4">
          Preparing your Terminal Journey...
        </div>
      </div>
    </div>
  );
}