import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AmenityDetailPage from "@/components/AmenityDetailPage";
import { ArrowLeft, Home } from "lucide-react";

export default function TestAmenityDetailPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)} className="hover:bg-slate-100">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-semibold text-slate-800">Test Amenity Detail</h1>
          <Button variant="ghost" onClick={() => navigate("/")} className="hover:bg-slate-100">
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <AmenityDetailPage
          name="Betty's Burgers"
          imageUrls={[
            "https://bpbyhdjdezynyiclqezy.supabase.co/storage/v1/object/public/amenities/SYD/bettys-burgers.jpg",
            "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop",
            "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop"
          ]}
          vibe="Refuel"
          rating={4.6}
          reviews={50}
          category="Burgers"
          openHours="Open 24hrs"
          features={["Wi-Fi", "Power Outlets", "Family Friendly", "Credit Cards", "Mobile Ordering"]}
          locationMapUrl="https://maps.google.com/maps?q=Sydney+Airport+Terminal+1&z=15&output=embed"
          similar={[
            { name: "Coffee Shop", distance: "Nearby", price: "$$" },
            { name: "Rest Area", distance: "2 min walk", price: "Free" },
            { name: "Boost Juice", distance: "3 min walk", price: "$" },
          ]}
        />
      </div>
    </div>
  );
} 