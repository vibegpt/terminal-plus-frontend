import React, { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import amenitiesDataRaw from "@/data/airport_terminal_amenities.json";
import sinAmenities from "@/data/sin_new_amenities.json";
import lhrAmenities from "@/data/lhr_amenities.json";
import { TerminalAmenity } from "@/types/amenity";
import { fetchFlightInfo } from "@/services/flightData";
import CategoryFilter from "@/components/CategoryFilter";

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const allAmenities = [...(amenitiesDataRaw as any[]), ...sinAmenities, ...lhrAmenities];

// Transform amenities data to match TerminalAmenity type
const amenitiesData: TerminalAmenity[] = allAmenities.map((amenity: any) => ({
  name: amenity.name,
  amenity_type: amenity.amenity_type,
  location_description: amenity.location_description,
  category: amenity.category,
  vibe_tags: amenity.vibe_tags || [],
  price_tier: String(amenity.price_tier || ""),
  opening_hours: amenity.opening_hours,
  image_url: amenity.image_url,
  slug: amenity.slug,
  coordinates: {
    x: amenity.coordinates?.lng ?? 0,
    y: amenity.coordinates?.lat ?? 0
  },
  terminal_code: amenity.terminal_code
}));

type AmenityWithTerminal = TerminalAmenity & { terminal_code: string };

const vibes = [
  { value: "Relax", label: "🛋️ Relax", glow: "vibe-glow-relax" },
  { value: "Explore", label: "🛍️ Explore", glow: "vibe-glow-explore" },
  { value: "Comfort", label: "🛏️ Comfort", glow: "vibe-glow-comfort" },
  { value: "Work", label: "💼 Work", glow: "vibe-glow-work" },
  { value: "Quick", label: "⚡ Quick", glow: "vibe-glow-quick" }
];

const relaxTags = [
  "relax",
  "premium",
  "comfort",
  "rest",
  "social",
  "food"
];

const vibeBgGlow: Record<string, string> = {
  Relax: 'bg-[#A8D0E6]',
  Explore: 'bg-[#F76C6C]',
  Comfort: 'bg-[#CBAACB]',
  Work: 'bg-[#D3B88C]',
  Quick: 'bg-[#FFDD57]'
};

const cardGlow: Record<string, string> = {
  Relax: "vibe-glow-relax",
  Explore: "vibe-glow-explore",
  Comfort: "vibe-glow-comfort",
  Work: "vibe-glow-work",
  Quick: "vibe-glow-quick"
};

export default function TransitGuide() {
  const { airport } = useParams<{ airport: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Get user's current vibe from session/local storage
  const [selectedVibe, setSelectedVibe] = useState<string>("Relax");
  const [gateInfo, setGateInfo] = useState<{ arrivalGate?: string, departureGate?: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');

  useEffect(() => {
    let data = sessionStorage.getItem("tempJourneyData") || localStorage.getItem("lastJourneyData");
    if (!data) return;
    try {
      const journey = JSON.parse(data);
      async function getGates() {
        let arrivalGate, departureGate;
        // Inbound leg (to transit)
        const inbound = await fetchFlightInfo({
          flightNumber: journey.flight1,
          dep: journey.dep,
          arr: journey.transit,
          date: journey.date
        });
        arrivalGate = inbound?.data?.[0]?.arrival?.gate;
        // Outbound leg (from transit)
        const outbound = await fetchFlightInfo({
          flightNumber: journey.flight2,
          dep: journey.transit,
          arr: journey.arr,
          date: journey.date
        });
        departureGate = outbound?.data?.[0]?.departure?.gate;
        setGateInfo({ arrivalGate, departureGate });
      }
      getGates();
    } catch {}
  }, []);

  // Filter amenities for this airport and vibe
  const filteredAmenities = useMemo(() => {
    if (!airport) return [];
    return (amenitiesData as AmenityWithTerminal[]).filter(a => {
      const matchesAirport = a.terminal_code && a.terminal_code.startsWith(`${airport}-`);
      if (!matchesAirport) return false;
      if (selectedVibe.toLowerCase() === "relax") {
        return a.vibe_tags.some(tag => relaxTags.some(relaxTag => tag.toLowerCase() === relaxTag.toLowerCase()));
      }
      return a.vibe_tags.map(t => t.toLowerCase()).includes(selectedVibe.toLowerCase());
    });
  }, [airport, selectedVibe]);

  // Track selected card for glow
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const pageBgGlowClass = vibeBgGlow[selectedVibe] || 'bg-slate-100';

  // Extract unique categories from filtered amenities
  const categories = Array.from(new Set(filteredAmenities.map(a => a.category).filter(Boolean)));
  // Filter amenities by selected category
  const displayedAmenities = selectedCategory === 'All Categories'
    ? filteredAmenities
    : filteredAmenities.filter(a => a.category === selectedCategory);

  return (
    <div className={`max-w-2xl mx-auto p-6 min-h-screen ${pageBgGlowClass}`}>
      <div className="flex gap-2 mb-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          ← Back
        </Button>
        <Button variant="ghost" onClick={() => navigate("/")}>🏠 Home</Button>
      </div>
      <h1 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Transit Guide: {airport?.toUpperCase()}</h1>
      {gateInfo && (
        <div className="mb-4 p-3 rounded bg-slate-100 dark:bg-slate-800 text-blue-900 dark:text-blue-200">
          <strong>Transit Gates:</strong><br />
          Arrival Gate: {gateInfo.arrivalGate || "TBA"}<br />
          Departure Gate: {gateInfo.departureGate || "TBA"}
        </div>
      )}
      {/* Vibe Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {vibes.map(vibe => (
          <button
            key={vibe.value}
            onClick={() => setSelectedVibe(vibe.value)}
            className={`px-4 py-2 rounded-lg font-medium text-base border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 ${
              selectedVibe === vibe.value
                ? `${vibe.glow} border-blue-600 dark:border-blue-400 bg-slate-100 dark:bg-slate-800 text-blue-900 dark:text-blue-200`
                : "border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:border-blue-400"
            }`}
          >
            {vibe.label}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto pb-2">
        <CategoryFilter categories={categories} selectedCategory={selectedCategory} onSelect={setSelectedCategory} />
        <div className="flex flex-nowrap gap-4">
          {displayedAmenities.length === 0 && (
            <div className="text-center text-slate-500 dark:text-slate-400">No amenities found for this vibe and category in this airport.</div>
          )}
          {displayedAmenities.map((amenity, idx) => {
            const amenitySlug = amenity.slug || slugify(amenity.name);
            const isSelected = selectedCard === amenitySlug;
            return (
              <div
                key={idx}
                onClick={() => {
                  setSelectedCard(amenitySlug);
                  navigate(`/amenity/${amenitySlug}`, { state: { from: location.pathname } });
                }}
                className={`relative min-w-[220px] max-w-[250px] h-56 rounded-lg overflow-hidden shadow-lg group flex items-end focus:outline-none cursor-pointer transition-all duration-200 border-2 ${
                  cardGlow[selectedVibe] || ""
                } ${isSelected ? "brightness-125 border-4" : "border-transparent"}`}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if ((e.key === "Enter" || e.key === " ") && amenitySlug) navigate(`/amenity/${amenitySlug}`, { state: { from: location.pathname } });
                }}
                aria-label={`View details for ${amenity.name}`}
              >
                <img
                  src={amenity.image_url}
                  alt={amenity.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="relative z-10 p-4 w-full">
                  <div className="font-bold text-lg text-slate-900 dark:text-white drop-shadow-md mb-1">{amenity.name}</div>
                  <div className="text-slate-800 dark:text-slate-200 text-sm mb-1 drop-shadow-md">{amenity.location_description}</div>
                  <div className="flex flex-wrap gap-2 mb-1">
                    {amenity.vibe_tags && amenity.vibe_tags.map((tag: string) => (
                      <span key={tag} className="inline-block bg-white/30 text-slate-900 dark:text-white text-xs px-2 py-1 rounded-full drop-shadow">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 