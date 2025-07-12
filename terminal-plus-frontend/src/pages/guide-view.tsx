import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getBoardingStatus } from "@/utils/getBoardingStatus";
import { useRecommendations } from "@/hooks/useRecommendations";
import amenitiesData from "@/data/airport_terminal_amenities.json";
import sinAmenities from "@/data/sin_new_amenities.json";
import lhrAmenities from "@/data/lhr_amenities.json";
import { TerminalAmenity } from "@/types/amenity";
import { Plane } from "lucide-react";
import CategoryFilter from "@/components/CategoryFilter";
import CategoryCarousels from "@/components/CategoryCarousels";
import { useVibe } from '@/context/VibeContext';
import { useTheme } from '@/hooks/useTheme';

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const allAmenities = [...amenitiesData, ...sinAmenities, ...lhrAmenities];

// Transform amenities data to match TerminalAmenity type
const transformedAmenities: TerminalAmenity[] = allAmenities.map((amenity: any) => ({
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
    y: (amenity.coordinates?.lat ?? 0)
  },
  terminal_code: amenity.terminal_code
}));

// Helper: Check if amenity is open now
function isAmenityOpen(opening_hours: any): boolean {
  if (!opening_hours) return true; // Assume open if no data
  const now = new Date();
  const day = now.toLocaleString('en-US', { weekday: 'long' });
  const hours = opening_hours[day] || opening_hours["Monday-Sunday"];
  if (!hours) return true;
  if (hours.toLowerCase() === '24/7') return true;
  // Format: "06:00-22:00"
  const [open, close] = hours.split('-');
  if (!open || !close) return true;
  const [openH, openM] = open.split(':').map(Number);
  const [closeH, closeM] = close.split(':').map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const openMins = openH * 60 + openM;
  const closeMins = closeH * 60 + closeM;
  if (closeMins < openMins) {
    // Overnight
    return nowMins >= openMins || nowMins < closeMins;
  }
  return nowMins >= openMins && nowMins < closeMins;
}

// For Relax mode, include a variety of tags
const relaxTags = [
  'relax',
  'premium',
  'comfort',
  'rest',
  'social',
  'food'
];

// Helper: Parse location description for badge and concise location (shared with amenity-detail)
function parseLocation(location: string) {
  let badge = '';
  let concise = '';
  if (!location) return { badge, concise: '' };
  const lower = location.toLowerCase();
  if (lower.includes('before security')) badge = 'Before Security';
  // Do NOT show 'After Security' as a badge or in the text
  // Find 'Gate XX' or 'Gates XX-YY'
  const gateMatch = location.match(/Gate[s]? [0-9A-Za-z\-]+/);
  if (gateMatch) {
    concise = `Near ${gateMatch[0]}`;
  } else if (lower.includes('food court')) {
    concise = 'Food Court';
  } else if (lower.includes('luxury precinct')) {
    concise = 'Luxury Precinct';
  } else if (lower.includes('mezzanine')) {
    concise = 'Mezzanine Level';
  } else if (lower.includes('arrivals')) {
    concise = 'Arrivals';
  }
  return { badge, concise };
}

// Vibe glow mapping
const vibeGlow: Record<string, string> = {
  Relax: 'vibe-glow-relax',
  Explore: 'vibe-glow-explore',
  Comfort: 'vibe-glow-comfort',
  Work: 'vibe-glow-work',
  Quick: 'vibe-glow-quick'
};

// Card glow mapping for amenity cards
const cardGlow: Record<string, string> = {
  Relax: 'vibe-glow-relax',
  Explore: 'vibe-glow-explore',
  Comfort: 'vibe-glow-comfort',
  Work: 'vibe-glow-work',
  Quick: 'vibe-glow-quick'
};

// Vibe backgrounds and headers
const vibeBackgrounds = {
  Relax:    '#A8D0E6',
  Explore:  '#F76C6C',
  Work:     '#D3B88C',
  Quick:    '#FFDD57',
  Refuel:   '#FF7F50',
  Comfort:  '#CBAACB',
};
const vibeHeaders = {
  Relax: '🧘 Your Relax Guide',
  Explore: '🧭 Explore Around You',
  Work: '⌨️ Get Focused, Stay Sharp',
  Quick: '⚡ Quick Stops Before You Go',
  Refuel: '☕ Time to Refuel',
  Comfort: '🛏️ Comfort-First Picks',
};

export default function GuideView() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [journey, setJourney] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const { selectedVibe } = useVibe();
  const theme = useTheme();

  // Detect if user came from Explore Terminal
  const fromExploreTerminal = location.state?.from === '/explore-terminal';
  // If from Explore Terminal, get terminal and vibe from query params
  const exploreTerminal = searchParams.get('terminal');
  const exploreVibe = searchParams.get('vibe');

  useEffect(() => {
    let data = sessionStorage.getItem("tempJourneyData");
    if (!data) {
      // Fallback: try localStorage
      data = localStorage.getItem("lastJourneyData");
      if (data) {
        sessionStorage.setItem("tempJourneyData", data); // Repopulate sessionStorage
      }
    }
    if (data) {
      const parsed = JSON.parse(data);
      console.log('[Debug] Loaded journey.selected_vibe:', parsed.selected_vibe);
      console.log('[Debug] Loaded journey.vibe:', parsed.vibe);
      setJourney(parsed);
    } else {
      navigate("/plan-journey-stepper");
    }
  }, [navigate]);

  // Debug: Log journey data
  useEffect(() => {
    if (journey) {
      const initialVibe = journey.selected_vibe || journey.vibe;
      console.log('[Debug] GuideView: journey.selected_vibe:', journey.selected_vibe);
      console.log('[Debug] GuideView: journey.vibe:', journey.vibe);
      console.log('[Debug] GuideView: initialVibe passed to useRecommendations:', initialVibe);
    }
  }, [journey]);

  const {
    recommendations,
    loading,
    error,
    activeVibe,
    changeVibe
  } = useRecommendations({
    amenities: transformedAmenities,
    currentTerminal: journey?.terminal || "T1",
    currentGate: journey?.gate || "A1",
    timeAvailableMinutes: journey?.time_available_minutes || 60,
    initialVibe: journey?.selected_vibe || journey?.vibe
  });

  useEffect(() => {
    console.log('[Debug] GuideView: activeVibe from useRecommendations:', activeVibe);
  }, [activeVibe]);

  const filteredAmenities = useMemo(() => {
    if (!transformedAmenities) return [];
    
    return transformedAmenities.filter(amenity => {
      const amenityWithTerminal = amenity as TerminalAmenity & { terminal_code: string };
      const airportCode = journey?.origin || 'SYD';
      const terminalCode = journey?.terminal || 'T1';
      const matchesTerminal = amenityWithTerminal.terminal_code === `${airportCode}-${terminalCode}`;
      
      // Relax vibe: match if any tag (case-insensitive) is in relaxTags
      const matchesVibe = activeVibe === 'relax'
        ? amenity.vibe_tags.some(tag =>
            relaxTags.some(relaxTag =>
              tag.toLowerCase() === relaxTag.toLowerCase()
            )
          )
        : amenity.vibe_tags.map(t => t.toLowerCase()).includes(activeVibe.toLowerCase());

      return matchesTerminal && matchesVibe;
    });
  }, [transformedAmenities, journey?.terminal, activeVibe]);

  // Debug: Log amenities and filtered results
  useEffect(() => {
    if (journey) {
      console.log('GuideView: all amenities:', transformedAmenities);
      console.log('GuideView: journey terminal:', journey.terminal);
      console.log('GuideView: activeVibe:', activeVibe);
      console.log('GuideView: filtered amenities:', filteredAmenities);
    }
  }, [journey, activeVibe, filteredAmenities]);

  // Determine the current vibe (prefer selected_vibe, fallback to journey.vibe)
  const currentVibe = (journey?.selected_vibe || journey?.vibe || 'Relax');
  type VibeKey = keyof typeof vibeBackgrounds;
  const safeVibe = (currentVibe in vibeBackgrounds ? currentVibe : 'Relax') as VibeKey;
  const pageBgColor = vibeBackgrounds[safeVibe];
  const headerText = vibeHeaders[safeVibe];

  // Track selected card
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  // Extract unique categories from filtered amenities
  const categories = Array.from(new Set(filteredAmenities.map(a => a.category).filter(Boolean)));
  // Filter amenities by selected category
  const displayedAmenities = selectedCategory === 'All Categories'
    ? filteredAmenities
    : filteredAmenities.filter(a => a.category === selectedCategory);

  if (!journey) {
    return null;
  }

  // Determine boarding status
  const boardingTime = journey.boarding_time ? new Date(journey.boarding_time).getTime() : undefined;
  const boardingStatus = getBoardingStatus(boardingTime);

  // Navigation to amenity detail
  function navigateToAmenity(slug: string) {
    navigate(`/amenity/${slug}`);
  }

  const previousFrom = location.state?.from;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded-lg">
          Error loading recommendations: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: pageBgColor }}>
      {/* Navigation Buttons */}
      <div className="flex gap-2 mb-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          ← Back
        </Button>
        <Button variant="ghost" onClick={() => navigate("/")}>🏠 Home</Button>
      </div>
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#222', textShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>{headerText}</h1>
        {/* Flight Information */}
        <div className="bg-white/80 rounded-lg p-4 shadow-md mb-4 max-w-md mx-auto">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex flex-col items-center">
                <div className="text-sm text-slate-500">From</div>
                <div className="font-medium text-slate-900">{journey.departure}</div>
              </div>
              <span className="mx-2 text-xl text-slate-400">→</span>
              {journey.layovers && journey.layovers.length > 0 && journey.layovers[0] && (
                <>
                  <div className="flex flex-col items-center">
                    <div className="text-sm text-slate-500">Via</div>
                    <div className="font-medium text-slate-900">{journey.layovers[0]}</div>
                  </div>
                  <span className="mx-2 text-xl text-slate-400">→</span>
                </>
              )}
              <div className="flex flex-col items-center">
                <div className="text-sm text-slate-500">To</div>
                <div className="font-medium text-slate-900">{journey.destination}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full">
              <div>
                <div className="text-sm text-slate-500">Departure Time</div>
                <div className="font-medium text-slate-900">
                  {journey.departure_time ? new Date(journey.departure_time).toLocaleString() : "Not set"}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Gate</div>
                <div className="font-medium text-slate-900">
                  {journey.gate || (
                    <span className="text-sm text-slate-500">
                      (Common gates for {journey.departure} {journey.terminal}: A1-A10)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mb-8 w-full max-w-md mx-auto">
        <div className="bg-white/90 rounded-lg p-6 shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-2 text-slate-900">
            {headerText.replace('Guide', 'Recommendations for')} {journey.departure} Terminal {journey.terminal}
          </h2>
          <CategoryFilter categories={categories} selectedCategory={selectedCategory} onSelect={setSelectedCategory} />
          <div className="overflow-x-auto w-full pb-2 snap-x snap-mandatory px-2">
            <div className="flex flex-nowrap gap-4">
              {displayedAmenities.length === 0 && (
                <div className="col-span-2 text-center text-slate-500" style={{ color: pageBgColor }}>
                  {(() => {
                    if (safeVibe === 'Relax') return "Hang tight. We're finding a calm spot for you…";
                    if (safeVibe === 'Quick') return "Loading top picks — fast.";
                    return "No amenities found for this vibe and category in this terminal.";
                  })()}
                </div>
              )}
              {displayedAmenities.map((amenity, idx) => {
                const amenitySlug = amenity.slug;
                const openNow = isAmenityOpen(amenity.opening_hours);
                const isSelected = selectedCard === amenitySlug;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedCard(amenitySlug);
                      navigate(`/amenity/${amenitySlug}`, { state: { from: previousFrom || location.pathname } });
                    }}
                    className={`relative min-w-[320px] max-w-[340px] h-80 rounded-lg overflow-hidden shadow-lg group flex items-end focus:outline-none cursor-pointer transition-all duration-200 border-2 snap-start ${
                      cardGlow[activeVibe] || ''
                    } ${
                      isSelected ? 'brightness-125 border-4' : 'border-transparent'
                    }`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && amenitySlug) navigate(`/amenity/${amenitySlug}`, { state: { from: previousFrom || location.pathname } }); }}
                    aria-label={`View details for ${amenity.name}`}
                  >
                    <img
                      src={amenity.image_url}
                      alt={amenity.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={{ boxShadow: `0 4px 24px 0 ${pageBgColor}55` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    <div className="relative z-10 p-4 w-full">
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-2">
                          {amenity.amenity_type === "Lounge" ? "🛋️" :
                           amenity.amenity_type === "Spa" ? "💆" :
                           amenity.amenity_type === "Rest Area" ? "🧘" :
                           amenity.amenity_type === "Shopping" ? "🛍️" :
                           amenity.amenity_type === "Food" ? "🍽️" :
                           amenity.amenity_type === "Work" ? "💼" :
                           amenity.amenity_type === "Quick" ? "⚡" : "✨"}
                        </span>
                        <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold" style={{ background: pageBgColor + '33', color: pageBgColor }}>{safeVibe}</span>
                      </div>
                      <div className="font-bold text-lg text-white drop-shadow mb-1">{amenity.name}</div>
                      <div className="text-slate-200 text-xs mb-1">{parseLocation(amenity.location_description).concise || amenity.location_description.replace(/After Security,? ?/i, '')}</div>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {amenity.vibe_tags && amenity.vibe_tags.map((tag, i) => (
                          <span key={i} className="inline-block bg-white/30 text-white text-xs px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-green-300">{openNow ? 'Open' : 'Closed'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="mb-8">
        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-6 shadow-md flex flex-col items-center">
          <div className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Terminal Map (Preview)</div>
          <svg width="320" height="120" viewBox="0 0 320 120" className="mb-2">
            <rect x="20" y="40" width="280" height="40" rx="20" fill="#e0e7ef" />
            <circle cx="60" cy="60" r="12" fill="#a5b4fc" />
            <circle cx="160" cy="60" r="12" fill="#fbbf24" />
            <circle cx="260" cy="60" r="12" fill="#34d399" />
            <text x="60" y="60" textAnchor="middle" dy=".3em" fontSize="12">A</text>
            <text x="160" y="60" textAnchor="middle" dy=".3em" fontSize="12">B</text>
            <text x="260" y="60" textAnchor="middle" dy=".3em" fontSize="12">C</text>
          </svg>
          <div className="text-slate-500 dark:text-slate-400 text-sm">Personalized maps coming soon!</div>
        </div>
      </div>
      <div className="flex justify-between">
        <Button variant="outline" className="border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white" onClick={() => navigate("/plan-journey-stepper")}>Plan Another Journey</Button>
        <Button variant="outline" className="border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white" onClick={() => navigate("/my-journeys")}>View My Journeys</Button>
      </div>
    </div>
  );
} 