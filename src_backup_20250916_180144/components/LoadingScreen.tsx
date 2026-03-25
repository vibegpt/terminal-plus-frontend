import React from "react";

export default function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="flex flex-col items-center">
        <div className="animate-spin-slow w-16 h-16 mb-6 text-purple-600 dark:text-purple-400">
          {/* Airplane Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.5 19.5L23 12 2.5 4.5 2 7l14 5-14 5z"/>
          </svg>
        </div>

        <p className="text-purple-800 dark:text-purple-300 text-lg font-semibold">
          Preparing your Terminal+ Journey...
        </p>
      </div>
    </div>
  );
}