import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import JourneyReorderView from "@/components/JourneyReorderView";

export default function JourneyReorderPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)} className="hover:bg-slate-100">
            ← Back
          </Button>
          <h1 className="text-xl font-semibold text-slate-800">Journey Reorder</h1>
          <Button variant="ghost" onClick={() => navigate("/")} className="hover:bg-slate-100">
            🏠 Home
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <JourneyReorderView />
      </div>
    </div>
  );
} 