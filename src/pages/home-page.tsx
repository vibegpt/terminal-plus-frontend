import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import VibeManagerChat from "@/components/VibeManagerChat";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-900">
      <h1 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">Welcome to Terminal+</h1>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button className="w-full py-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition" onClick={() => navigate("/plan-journey-stepper")}>Plan My Journey</button>
        <button className="w-full py-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition" onClick={() => navigate("/explore-terminal")}>Explore Terminal</button>
    </div>
      <div className="mt-16 text-slate-400 dark:text-slate-500 text-sm">
        <p>© 2025 Terminal+. All rights reserved.</p>
      </div>
      <VibeManagerChat />
    </div>
);
}