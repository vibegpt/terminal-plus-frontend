import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getBoardingStatus } from "@/utils";
import { useRecommendations } from "@/hooks/useRecommendations";
import amenitiesData from "@/data/amenities.json";
import { TerminalAmenity } from "@/types/amenity.types";
import { Plane } from "lucide-react";
import CategoryFilter from "@/components/CategoryFilter";
import CategoryCarousels from "@/components/CategoryCarousels";
import { useVibe } from '@/context/VibeContext';
import { useTheme } from '@/hooks/useTheme';
import AmenityCard from "@/components/AmenityCard";

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const transformedAmenities: TerminalAmenity[] = amenitiesData.map((amenity: any) => ({
  id: amenity.id || amenity.name,
  name: amenity.name,
  amenity_type: amenity.amenity_type,
  location_description: amenity.location_description,
  category: amenity.category,
  vibe_tags: amenity.vibe_tags || [],
  price_tier: amenity.price_tier,
  opening_hours: amenity.opening_hours,
  image_url: amenity.image_url,
  slug: amenity.slug,
  coordinates: {
    x: (amenity.coordinates?.lng ?? 0),
    y: (amenity.coordinates?.lat ?? 0),
    lat: (amenity.coordinates?.lat ?? 0),
    lng: (amenity.coordinates?.lng ?? 0)
  },
  terminal_code: amenity.terminal_code,
  airport_code: amenity.airport_code,
  location: amenity.location_description || ""
}));

function isAmenityOpen(opening_hours: any): boolean {
  if (!opening_hours) return true;
  const now = new Date();
  const day = now.toLocaleString('en-US', { weekday: 'long' });
  const hours = opening_hours[day] || opening_hours["Monday-Sunday"];
  if (!hours) return true;
  if (hours.toLowerCase() === '24/7') return true;
  const [open, close] = hours.split('-');
  if (!open || !close) return true;
  const [openH, openM] = open.split(':').map(Number);
  const [closeH, closeM] = close.split(':').map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const openMins = openH * 60 + openM;
  const closeMins = closeH * 60 + closeM;
  if (closeMins < openMins) {
    return nowMins >= openMins || nowMins < closeMins;
  }
  return nowMins >= openMins && nowMins < closeMins;
}

interface AmenityWithDistance extends TerminalAmenity {
  distance?: number;
}

function filterAmenitiesByVibeAndTerminal(data: TerminalAmenity[], airportCode: string, terminalCode: string, selectedVibe: string) {
  return data.filter((item) =>
    item.airport_code === airportCode &&
    item.terminal_code === terminalCode &&
    (item.vibe_tags || []).includes(selectedVibe as any)
  );
}

function calculateDistance(userCoords: { lat: number, lng: number }, amenityCoords?: { x: number, y: number }) {
  if (!amenityCoords) return Infinity;
  const dx = userCoords.lat - amenityCoords.y;
  const dy = userCoords.lng - amenityCoords.x;
  return Math.sqrt(dx * dx + dy * dy);
}

function sortByDistanceIfAvailable(amenities: TerminalAmenity[], userCoords: { lat: number, lng: number } | null): AmenityWithDistance[] {
  if (!userCoords) return amenities;
  return [...amenities].map(a => ({
    ...a,
    distance: calculateDistance(userCoords, a.coordinates)
  })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
}

function filterBy5MinDistanceOnly(amenities: AmenityWithDistance[], userCoords: { lat: number, lng: number } | null) {
  if (!userCoords) return amenities;
  const maxDistance = 0.004; // ~5 min walk range
  return amenities.filter(a => {
    const d = calculateDistance(userCoords, a.coordinates);
    return d <= maxDistance;
  });
}

const relaxTags = [
  'relax',
  'premium',
  'comfort',
  'rest',
  'social',
  'food'
];

function parseLocation(location: string) {
  let badge = '';
  let concise = '';
  if (!location) return { badge, concise: '' };
  const lower = location.toLowerCase();
  if (lower.includes('before security')) badge = 'Before Security';
  return { badge, concise: location };
}

export default function GuideView() {
  const [searchParams] = useSearchParams();
  const vibe = searchParams.get("vibe") || "Explore";
  const terminal = searchParams.get("terminal") || "";
  const airport = searchParams.get("airport") || "";
  const minsToBoard = Number(searchParams.get("minsToBoard") || 999);
  const [userCoords, setUserCoords] = useState<{ lat: number, lng: number } | null>(null);

  // NEW: Get search query from sessionStorage (explore-journey) or URL
  const [searchQuery, setSearchQuery] = useState<string>("");
  useEffect(() => {
    // Try to get from URL first
    let query = searchParams.get("search") || "";
    if (!query) {
      // Try to get from sessionStorage (explore-journey)
      const exploreJourney = sessionStorage.getItem('explore-journey');
      if (exploreJourney) {
        try {
          const parsed = JSON.parse(exploreJourney);
          query = parsed.search || "";
        } catch {}
      }
    }
    setSearchQuery(query);
  }, [searchParams]);

  const [journeyData, setJourneyData] = useState<any>(null);

  useEffect(() => {
    const dataString = sessionStorage.getItem("tempJourneyData");
    if (dataString) {
      const parsed = JSON.parse(dataString);
      setJourneyData(parsed);
    }
  }, []);

  const sinTransitPlan = journeyData?.transitPlan?.SIN?.plan || [];

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
      });
    }
  }, []);

  useEffect(() => {
    console.log('DEBUG airport:', airport);
    console.log('DEBUG terminal:', terminal);
    console.log('DEBUG searchQuery:', searchQuery);
    const byTerminal = transformedAmenities.filter(a => a.airport_code === airport && a.terminal_code === terminal);
    console.log('DEBUG byTerminal:', byTerminal.map(a => a.name));
  }, [airport, terminal, searchQuery]);

  const filtered: AmenityWithDistance[] = useMemo(() => {
    const search = searchQuery && searchQuery.trim().length > 0 ? searchQuery.trim().toLowerCase() : "";
    let byTerminal = transformedAmenities.filter(a => a.airport_code === airport && a.terminal_code === terminal);
    if (search) {
      byTerminal = byTerminal.filter(amenity =>
        amenity.name?.toLowerCase().includes(search) ||
        (Array.isArray(amenity.vibe_tags) && amenity.vibe_tags.some((tag: any) => tag.toLowerCase().includes(search)))
      );
    } else {
      byTerminal = byTerminal.filter(amenity => (amenity.vibe_tags || []).includes(vibe as any));
    }
    byTerminal = sortByDistanceIfAvailable(byTerminal, userCoords);
    if (minsToBoard <= 30) {
      byTerminal = filterBy5MinDistanceOnly(byTerminal, userCoords);
    }
    return byTerminal;
  }, [airport, terminal, vibe, userCoords, minsToBoard, searchQuery]);

  const navigate = useNavigate();

  return (
    <div className="px-4 py-6">
      {minsToBoard <= 30 && (
        <div className="mb-4 text-sm text-yellow-600 dark:text-yellow-300">
          ✈️ Showing only nearby options — boarding soon!
        </div>
      )}
      <h1 className="text-xl font-bold mb-4">Explore {terminal}</h1>
      {sinTransitPlan.length > 0 && (
        <div className="mb-8 mt-6 border-t pt-6">
          <h2 className="text-xl font-bold mb-4 text-slate-700">Your SIN Transit Timeline</h2>
          <div className="grid gap-4">
            {sinTransitPlan.map((block: any, i: number) => (
              <div key={i} className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-800 shadow-sm">
                <div className="text-xs text-slate-500 mb-1">
                  {block.start}–{block.end} min
                </div>
                <div className="font-semibold text-blue-600 dark:text-blue-400 mb-1">
                  {block.vibe}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {block.suggestion}
                </p>
              </div>
            ))}
          </div>
          <Button onClick={() => navigate('/transit-plan')} className="mt-4">
            Customize SIN Timeline
          </Button>
        </div>
      )}
      
      {/* Quick access to ExperienceView with social proof */}
      <div className="mb-6 mt-4 border-t pt-4">
        <Button 
          onClick={() => navigate('/experience')} 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          🧪 View with Social Proof (ExperienceView)
        </Button>
      </div>
      {filtered.length === 0 ? (
        <p>No amenities found matching this vibe in this terminal.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
          {filtered.map((amenity, index) => (
            <AmenityCard
              key={index}
              name={amenity.name}
              category={amenity.category || "🍴 Restaurant"}
              vibe={amenity.vibe_tags?.[0] || "Refuel"}
              imageUrl={amenity.image_url || "/images/default-amenity.jpg"}
              logoUrl={undefined} // Add logo_url if available in your data
              rating={4.5} // Add rating if available in your data
              openHours={amenity.opening_hours ? 
                (typeof amenity.opening_hours === 'string' ? 
                  amenity.opening_hours : 
                  amenity.opening_hours["Monday-Sunday"] || "9am–9pm") : 
                "9am–9pm"}
              terminal={amenity.terminal_code || "T1"}
              walkTime={userCoords && typeof amenity.distance === 'number' && isFinite(amenity.distance) ? 
                `${Math.round(amenity.distance * 1000)}m walk` : 
                "5 min walk"}
              slug={amenity.slug || slugify(amenity.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
} 