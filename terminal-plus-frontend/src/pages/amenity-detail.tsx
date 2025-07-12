import React from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import amenitiesData from "@/data/airport_terminal_amenities.json";
import sinAmenities from "@/data/sin_new_amenities.json";
import lhrAmenities from "@/data/lhr_amenities.json";
import { useVibe } from '@/context/VibeContext';
import { useTheme } from '@/hooks/useTheme';
import { Clock } from "lucide-react";

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const allAmenities = [...amenitiesData, ...sinAmenities, ...lhrAmenities];

// Map recommendation titles to amenity data
const recommendationToAmenity: Record<string, any> = {
  "Premium Lounge": {
    name: "Premium Lounge",
    amenity_type: "Lounge",
    category: "Comfort",
    location_description: "Terminal 1, Gate A12",
    price_tier: "$$$",
    opening_hours: {
      "Monday-Sunday": "24/7"
    },
    vibe_tags: ["Relax", "Comfort", "Premium"],
    image_url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&q=80",
    terminal_code: "T1"
  },
  "Relaxation Zone": {
    name: "Relaxation Zone",
    amenity_type: "Rest Area",
    category: "Wellness",
    location_description: "Terminal 1, Gate B8",
    price_tier: "Free",
    opening_hours: {
      "Monday-Sunday": "24/7"
    },
    vibe_tags: ["Relax", "Quiet", "Wellness"],
    image_url: "https://images.unsplash.com/photo-1517502166878-35c93a0072f0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&q=80",
    terminal_code: "T1"
  },
  "Spa Express": {
    name: "Spa Express",
    amenity_type: "Spa",
    category: "Wellness",
    location_description: "Terminal 1, Gate C15",
    price_tier: "$$",
    opening_hours: {
      "Monday-Sunday": "06:00-22:00"
    },
    vibe_tags: ["Relax", "Wellness", "Premium"],
    image_url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&q=80",
    terminal_code: "T1"
  }
};

// Helper: Format opening hours for display
function formatOpeningHours(opening_hours: any): { days: string, status: string }[] {
  if (!opening_hours) return [];
  const daysOfWeek = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ];
  // Check for 24/7
  const all247 = daysOfWeek.every(day => {
    const hours = opening_hours[day] || opening_hours["Monday-Sunday"];
    return hours && hours.toLowerCase().includes("24");
  });
  if (all247) return [{ days: "Mon–Sun", status: "Open 24hrs" }];

  // Group days by hours
  const groups: { days: string[]; hours: string }[] = [];
  for (const day of daysOfWeek) {
    const hours = opening_hours[day] || opening_hours["Monday-Sunday"] || "Closed";
    if (groups.length && groups[groups.length - 1].hours === hours) {
      groups[groups.length - 1].days.push(day);
    } else {
      groups.push({ days: [day], hours });
    }
  }
  // Format groups
  return groups.map(group => {
    const dayStr = group.days.length === 1
      ? group.days[0].slice(0, 3)
      : `${group.days[0].slice(0, 3)}–${group.days[group.days.length - 1].slice(0, 3)}`;
    if (group.hours.toLowerCase() === "closed") return { days: dayStr, status: "Closed" };
    if (group.hours.toLowerCase().includes("24")) return { days: dayStr, status: "Open 24hrs" };
    // Convert to 12-hour format
    const [open, close] = group.hours.split("-");
    const formatTime = (t: string) => {
      if (!t) return "";
      let [h, m] = t.split(":");
      let hour = parseInt(h, 10);
      const min = m || "00";
      const ampm = hour >= 12 ? "pm" : "am";
      if (hour === 0) hour = 12;
      if (hour > 12) hour -= 12;
      return `${hour}:${min}${ampm}`;
    };
    return { days: dayStr, status: `${formatTime(open)}–${formatTime(close)}` };
  });
}

// Helper: Parse location description for badge and concise location
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

function OpeningHours({ hours }: { hours: { days: string, status: string }[] }) {
  if (!hours || hours.length === 0) return null;
  return (
    <div className="mt-2 flex items-start gap-2 text-sm">
      <Clock className="w-4 h-4 mt-0.5 text-slate-500" aria-label="Opening hours" />
      <div>
        <span className="font-semibold">Opening Hours:</span>
        {hours.length === 1 ? (
          <span className="ml-1">{hours[0].days}: {hours[0].status}</span>
        ) : (
          <ul className="ml-2 list-disc">
            {hours.map((h, i) => (
              <li key={i}>{h.days}: {h.status}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function AmenityDetail() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const location = useLocation();
  const { selectedVibe } = useVibe();
  const theme = useTheme();
  
  // Force re-render on slug change
  React.useEffect(() => {}, [slug]);

  let amenity = null;
  if (slug) {
    // Try to find in recommendations mapping
    const title = slug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    amenity = recommendationToAmenity[title];
    // If not found in recommendations, look in the amenities data
    if (!amenity) {
      amenity = (allAmenities as any[]).find(a => a.slug === slug);
    }
  }

  // Determine the vibe for the glow: always use the user's selected vibe if available
  let amenityVibe = selectedVibe;
  if (!amenityVibe && amenity && amenity.vibe_tags && amenity.vibe_tags.length > 0) {
    // Prefer the first matching tag that is a known vibe
    const knownVibes = ['Relax', 'Explore', 'Comfort', 'Work', 'Quick'];
    const found = amenity.vibe_tags.find((tag: string) => knownVibes.includes(tag));
    if (found) amenityVibe = found;
  }
  if (!amenityVibe) amenityVibe = 'Relax';
  // Vibe glow mapping
  const vibeGlow: Record<string, string> = {
    Relax: 'vibe-glow-relax',
    Explore: 'vibe-glow-explore',
    Comfort: 'vibe-glow-comfort',
    Work: 'vibe-glow-work',
    Quick: 'vibe-glow-quick'
  };
  const pageGlowClass = vibeGlow[amenityVibe] || '';

  // Filtering logic (should match guide-view)
  // For demo, fallback to 'Relax' vibe and 'SYD-T1' terminal if not in state/history
  // In a real app, you might get these from context, query params, or navigation state
  const terminal = 'SYD-T1';
  const relaxTags = [
    'relax', 'comfort', 'quiet', 'wellness', 'spa', 'lounge', 'rest', 'nap', 'premium', 'recliners', 'soft lighting'
  ];
  const filteredAmenities = allAmenities.filter((a: any) => {
    const amenityTerminal = a.terminal_code || a.terminal || '';
    const tags = (a.vibe_tags || []).map((tag: string) => tag.toLowerCase());
    return relaxTags.some(tag => tags.includes(tag)) &&
      (amenityTerminal.toLowerCase() === terminal.toLowerCase() || !amenityTerminal);
  });

  // Find current index in filtered list
  const currentIndex = filteredAmenities.findIndex((a: any) => slugify(a.name) === slug);
  const prevAmenity = currentIndex > 0 ? filteredAmenities[currentIndex - 1] : null;
  const nextAmenity = currentIndex < filteredAmenities.length - 1 ? filteredAmenities[currentIndex + 1] : null;

  const vibeBgGlow: Record<string, string> = {
    Relax: 'bg-[#A8D0E6]',
    Explore: 'bg-[#F76C6C]',
    Comfort: 'bg-[#CBAACB]',
    Work: 'bg-[#D3B88C]',
    Quick: 'bg-[#FFDD57]'
  };
  const pageBgGlowClass = vibeBgGlow[amenityVibe] || 'bg-slate-100';

  // Vibe backgrounds and headlines
  const vibeBackgrounds = {
    Relax:    'bg-[#A8D0E6]',
    Explore:  'bg-[#F76C6C]',
    Work:     'bg-[#D3B88C]',
    Quick:    'bg-[#FFDD57]',
    Refuel:   'bg-[#FF7F50]',
    Comfort:  'bg-[#CBAACB]',
  };
  const vibeHeadlines = {
    Relax: "🧘 Great Relax spot to unwind",
    Explore: "🧭 Curious? Explore something new",
    Work: "⌨️ Quiet corner to focus up",
    Quick: "⚡ In and out — quick and easy",
    Refuel: "☕ Great Refuel spot to recharge",
    Comfort: "🛏️ Space to rest and reset",
  };
  const vibeColor = {
    Relax:    '#A8D0E6',
    Explore:  '#F76C6C',
    Work:     '#D3B88C',
    Quick:    '#FFDD57',
    Refuel:   '#FF7F50',
    Comfort:  '#CBAACB',
  };

  // Ensure amenityVibe is typed correctly for vibe-based lookups
  type VibeKey = keyof typeof vibeBackgrounds;
  const safeAmenityVibe = (amenityVibe in vibeBackgrounds ? amenityVibe : 'Relax') as VibeKey;
  const pageBgClass = vibeBackgrounds[safeAmenityVibe];
  const headline = vibeHeadlines[safeAmenityVibe];
  const badgeColor = vibeColor[safeAmenityVibe];

  if (!amenity) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${pageBgClass}`}>
        <div className={`bg-slate-100 dark:bg-slate-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center ${pageGlowClass}`}>
          <h1 className="text-2xl font-bold mb-4 text-red-600 dark:text-red-400">Amenity Not Found</h1>
          <Button variant="ghost" onClick={() => navigate("/guide-view")}>← Back</Button>
          <Button variant="ghost" onClick={() => navigate("/")}>🏠 Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${pageBgClass}`}>
      <div className="rounded-3xl shadow-xl p-6 max-w-md w-full flex flex-col gap-4" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(2px)' }}>
        <div className="flex items-center justify-between mb-2">
          <Button variant="ghost" onClick={() => {
            const from = location.state?.from;
            if (from && from !== location.pathname) {
              navigate(from);
            } else {
              navigate("/guide-view");
            }
          }}>← Back</Button>
          <Button variant="ghost" onClick={() => navigate("/")}>🏠 Home</Button>
        </div>
        <div className="mb-2 text-center">
          <h2 className="text-xl font-bold mb-1" style={{ color: badgeColor }}>{headline}</h2>
        </div>
        <div className="flex flex-col items-center gap-2 mb-2">
          <span className="text-3xl font-bold mb-1 text-slate-900" style={{ color: badgeColor }}>{amenity.name}</span>
          <span className="inline-block rounded-full px-3 py-1 text-sm font-semibold" style={{ background: badgeColor + '33', color: badgeColor }}>{safeAmenityVibe}</span>
        </div>
        <div className="flex flex-col gap-1 mb-2">
          <div className="flex items-center gap-2 text-slate-700 text-sm"><span className="font-semibold">Location:</span> <span>{parseLocation(amenity.location_description).concise || amenity.location_description.replace(/After Security,? ?/i, '')}</span></div>
          {amenity.distance && <div className="flex items-center gap-2 text-slate-700 text-sm"><span className="font-semibold">Distance:</span> <span>{amenity.distance}</span></div>}
          <OpeningHours hours={formatOpeningHours(amenity.opening_hours)} />
          {amenity.notes && amenity.notes.trim() !== '' && (
            <div className="mt-2 text-xs text-slate-500">
              <span className="font-semibold">Note:</span> {amenity.notes}
            </div>
          )}
          {amenity.price_tier && <div className="flex items-center gap-2 text-slate-700 text-sm"><span className="font-semibold">Price:</span> <span>{amenity.price_tier}</span></div>}
        </div>
        {amenity.image_url && (
          <div className="rounded-xl overflow-hidden mb-2 shadow-lg" style={{ boxShadow: `0 4px 24px 0 ${badgeColor}55` }}>
            <img src={amenity.image_url} alt={amenity.name} className="w-full object-cover" style={{ maxHeight: 180 }} />
          </div>
        )}
        <div className="bg-white/80 rounded-lg p-4 text-slate-700 text-base text-center shadow" style={{ border: `1.5px solid ${badgeColor}33` }}>
          <p>{amenity.localizations?.en?.description || "More information about this amenity will be available soon."}</p>
        </div>
        <Button variant="outline" className="w-full mt-2" onClick={() => navigate("/guide-view")}>Back to Guide</Button>
      </div>
    </div>
  );
} 