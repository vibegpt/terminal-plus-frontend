// /src/components/TransitGuide.tsx
import React, { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAmenities } from "@/hooks/useAmenities";
import { TerminalAmenity } from "@/types/amenity.types";
import { fetchFlightInfo } from "@/services/flightData";
import CategoryFilter from "@/components/CategoryFilter";
import { MixItUpToggle } from "@/components/MixItUpToggle";
import { ValueModeToggle } from "@/components/ValueModeToggle";
import { useVibeColors } from "@/hooks/useVibeColors";
import { useValueMode } from "@/hooks/useValueMode";

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const vibes = [
  { value: "Chill", label: "🛋️ Chill", glow: "vibe-glow-relax" },
  { value: "Refuel", label: "⛽ Refuel", glow: "vibe-glow-refuel" },
  { value: "Comfort", label: "🛏️ Comfort", glow: "vibe-glow-comfort" },
  { value: "Explore", label: "🛍️ Explore", glow: "vibe-glow-explore" },
  { value: "Quick", label: "⚡ Quick", glow: "vibe-glow-quick" },
  { value: "Work", label: "💼 Work", glow: "vibe-glow-work" },
  { value: "Shop", label: "🛒 Shop", glow: "vibe-glow-shop" }
];

const relaxTags = [
  "chill",
  "premium",
  "comfort",
  "rest",
  "social",
  "food"
];

interface TransitGuideProps {
  airport?: string;
}

export default function TransitGuide({ airport: propAirport }: TransitGuideProps) {
  const params = useParams<{ airport: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { getVibeColor, getVibeBgGlow, getCardGlowClass } = useVibeColors();
  const { valueMode } = useValueMode();

  // Use prop airport if provided, otherwise use route param
  const airport = propAirport || params.airport;

  // Use the proper amenity loading hook
  const { data: allAmenities, isLoading: isAmenitiesLoading } = useAmenities();

  // Process amenities data - simplified and fixed
  const processedAmenitiesData: TerminalAmenity[] = useMemo(() => {
    if (!allAmenities || isAmenitiesLoading) {
      return [];
    }
    
    console.log('🔍 Processing amenities data, total items:', allAmenities.length);
    console.log('🔍 Current airport parameter:', airport);
    console.log('🔍 Sample terminal codes:', allAmenities.slice(0, 10).map(a => a.terminal_code));
    
    // Filter by airport first, then process
    const airportFiltered = allAmenities.filter((amenity: any) => {
      const matches = amenity.terminal_code && amenity.terminal_code.startsWith(`${airport}-`);
      if (matches) {
        console.log(`🔍 MATCH: ${amenity.name} (${amenity.terminal_code})`);
      }
      return matches;
    });
    
    console.log(`🔍 Amenities for ${airport}:`, airportFiltered.length);
    console.log(`🔍 Sample ${airport} amenities:`, airportFiltered.slice(0, 5).map(a => ({ name: a.name, terminal: a.terminal_code })));
    
    return airportFiltered.map((amenity: any) => ({
      id: amenity.id || amenity.slug || amenity.name,
      name: amenity.name,
      location: amenity.location_description || amenity.location || "",
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
      terminal_code: amenity.terminal_code,
      has_free_perk: amenity.has_free_perk || false
    }));
  }, [airport, allAmenities, isAmenitiesLoading]);

  // Get user's current vibe from session/local storage
  const [selectedVibe, setSelectedVibe] = useState<string>("Chill");
  const [mixItUp, setMixItUp] = useState<boolean>(true); // Will be set based on user location
  const [gateInfo, setGateInfo] = useState<{ arrivalGate?: string, departureGate?: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [isAtTransitAirport, setIsAtTransitAirport] = useState<boolean>(false);

  useEffect(() => {
    const data = sessionStorage.getItem("tempJourneyData") || localStorage.getItem("lastJourneyData");
    if (!data) return;

    try {
      const journey = JSON.parse(data);
      const { userCurrentAirport, dep, transit, arr } = journey;

      const isAtDeparture = userCurrentAirport === dep;
      const isAtTransit = userCurrentAirport === transit;
      const isAtArrival = userCurrentAirport === arr;

      const isViewingDeparture = airport === dep;
      const isViewingTransit = airport === transit;
      const isViewingArrival = airport === arr;

      let defaultMixItUp = true; // default = ON

      if (
        (isAtDeparture && isViewingDeparture) ||
        (isAtTransit && isViewingTransit) ||
        (isAtArrival && isViewingArrival)
      ) {
        defaultMixItUp = false; // OFF if user is at and viewing that airport
      }

      setMixItUp(defaultMixItUp);
      
      // Set isAtTransitAirport for UI messaging
      setIsAtTransitAirport(isAtTransit && isViewingTransit);

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
    } catch (e) {
      console.error('Error parsing journey data:', e);
    }
  }, [airport]);

  const filteredAmenities = useMemo(() => {
    if (!airport) return [];

    let results = mixItUp
      ? [...processedAmenitiesData].sort(() => Math.random() - 0.5)
      : processedAmenitiesData.filter(a => {
          const vibe = selectedVibe.toLowerCase();
          return vibe === "chill"
            ? (a.vibe_tags || []).some(tag => relaxTags.includes(tag.toLowerCase()))
            : (a.vibe_tags || []).some(tag => tag.toLowerCase() === vibe);
        });

    // Apply value mode filtering
    if (valueMode) {
      results = results.filter(a => a.price_tier === "$" || a.has_free_perk);
    }

    return results;
  }, [selectedVibe, mixItUp, processedAmenitiesData, airport, valueMode]);

  // Track selected card for glow
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const pageBgGlowClass = mixItUp ? 'bg-gradient-to-br from-blue-50 to-purple-50' : getVibeBgGlow(selectedVibe);

  // Extract unique categories from filtered amenities
  const categories = Array.from(new Set(filteredAmenities.map(a => a.category).filter(Boolean)));
  // Filter amenities by selected category
  const displayedAmenities = selectedCategory === 'All Categories'
    ? filteredAmenities
    : filteredAmenities.filter(a => a.category === selectedCategory);

  return (
    <div className={`max-w-2xl mx-auto p-6 min-h-screen ${pageBgGlowClass}`}>
      <div className="flex gap-2 mb-4">
        <Button variant="ghost" onClick={() => {
          // More robust back navigation
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            // If no history, try to go to a sensible default
            const referrer = document.referrer;
            if (referrer && referrer.includes(window.location.origin)) {
              // If we came from our own site, go back
              window.history.back();
            } else {
              // Otherwise go to home
              navigate("/");
            }
          }
        }}>
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
      
      {/* Toggle Controls */}
      <div className="flex justify-between items-center mb-4">
        <MixItUpToggle 
          isActive={mixItUp} 
          onToggle={setMixItUp}
        />
        <ValueModeToggle />
      </div>
      
      <p className="text-xs text-slate-500 mb-4">
        {mixItUp
          ? "MixItUp is ON — browsing a mix of amenities."
          : "Select your vibe for personalised recommendations."
        }
        {valueMode && " Value mode is ON — showing budget-friendly options."}
      </p>

      {/* Vibe Selector - Only show when Mix It Up is off */}
      {!mixItUp && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
            {isAtTransitAirport ? "What's your vibe today?" : "Select Your Vibe"}
          </h3>
          <div className="flex flex-wrap gap-2">
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
        </div>
      )}
      <div className="overflow-x-auto pb-2">
        <CategoryFilter categories={categories} selectedCategory={selectedCategory} onSelect={setSelectedCategory} />
        <div className="flex flex-nowrap gap-4">
          {displayedAmenities.length === 0 && (
            <div className="text-center text-slate-500 dark:text-slate-400">
              {valueMode 
                ? "No budget-friendly amenities found for this vibe and category in this airport."
                : "No amenities found for this vibe and category in this airport."
              }
            </div>
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
                  mixItUp ? "vibe-glow-mix" : getCardGlowClass(selectedVibe)
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
                    {valueMode && amenity.price_tier === "$" && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full drop-shadow">💸 Budget</span>
                    )}
                    {valueMode && amenity.has_free_perk && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full drop-shadow">🎁 Free</span>
                    )}
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