import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const navigate = useNavigate();
  const isDarkMode = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
      <h1 className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>404</h1>
      <p className={`text-lg mb-8 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Page not found.</p>
      <button className={`px-6 py-3 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition ${isDarkMode ? 'dark:text-white' : ''}`} onClick={() => window.location.href = '/'}>Go Home</button>
    </div>
  );
}
