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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 to-white">
      <div className="flex flex-col items-center gap-4 animate-pulse-slow">
        {/* Logo */}
        <div className="text-6xl font-bold text-blue-700">
          +
        </div>

        {/* App Name */}
        <div className="text-2xl text-blue-800 font-semibold">
          Terminal+
        </div>

        {/* Tagline */}
        <div className="text-gray-600 mt-4">
          Preparing your Terminal Journey...
        </div>
      </div>
    </div>
  );
}