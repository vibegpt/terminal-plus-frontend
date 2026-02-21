import React from "react";

export default function ErrorFallback({ message = "Something went wrong." }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-red-500">
        <p className="font-bold text-lg">Error</p>
        <p>{message}</p>
      </div>
    </div>
  );
} 