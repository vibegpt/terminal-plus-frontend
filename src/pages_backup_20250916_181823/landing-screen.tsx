import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function LandingScreen() {
  const [_, setLocation] = useLocation();
  const isDarkMode = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
      <h1 className={`text-4xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Welcome to Terminal+</h1>
      <p className={`text-lg mb-8 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Your personalized airport companion.</p>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button className={`w-full py-3 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition ${isDarkMode ? 'dark:text-white' : ''}`}>Get Started</button>
        <button className={`w-full py-3 rounded-lg font-semibold transition ${isDarkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}>Learn More</button>
      </div>
      <div className={`mt-16 text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
        <p>© 2025 Terminal+. All rights reserved.</p>
      </div>
    </div>
  );
}