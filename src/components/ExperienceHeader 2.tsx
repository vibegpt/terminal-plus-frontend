import React from "react";

interface ExperienceHeaderProps {
  terminal: string;
  phase: string;
}

export function ExperienceHeader({ terminal, phase }: ExperienceHeaderProps) {
  return (
    <div className="text-center mb-4">
      <h2 className="text-2xl font-bold">
        <span style={{ color: "#CBD5E1" }}>{terminal}</span>{" "}
        <span style={{ color: "#38BDF8" }}>{phase}</span>
      </h2>
      <p className="text-gray-400 text-sm">6 places available</p>
    </div>
  );
} 