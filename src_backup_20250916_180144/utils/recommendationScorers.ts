// utils/recommendationScorers.ts

// ✅ Matches selected vibe exactly
export function scoreVibeMatch(amenity: any, selectedVibe?: string): number {
  if (!selectedVibe || !amenity.vibe) return 0;
  return amenity.vibe.toLowerCase() === selectedVibe.toLowerCase() ? 10 : 0;
}

// ✅ Scores +5 if terminal prefix matches gate prefix (e.g., "T3")
export function scoreGateProximity(amenity: any, gate?: string): number {
  const terminalPrefix = amenity?.terminal?.[0]?.toLowerCase();
  const gatePrefix = gate?.[0]?.toLowerCase();
  if (!terminalPrefix || !gatePrefix) return 0;
  return terminalPrefix === gatePrefix ? 5 : -2;
}

// ✅ Bonus if boarding isn't imminent
export function scoreUrgency(timeLeft?: number): number {
  if (typeof timeLeft !== "number") return 0;
  if (timeLeft < 10) return -10;
  if (timeLeft < 30) return 5;
  return 10;
}

// ✅ Scores opening hours if present
export function scoreOpeningHours(amenity: any): number {
  const rawTime = amenity?.closeTime;
  if (!rawTime || typeof rawTime !== "string" || !rawTime.includes(":")) {
    return 0; // Neutral if time is missing
  }

  const closeHour = parseInt(rawTime.split(":")[0], 10);
  if (isNaN(closeHour)) return 0;

  const nowHour = new Date().getHours();
  return nowHour < closeHour ? 5 : -5;
}

// ✅ Optional: Match amenity category with user interest (e.g., Food, Shopping)
export function scoreCategoryMatch(amenity: any, selectedCategory?: string): number {
  if (!selectedCategory || typeof amenity.category !== "string") return 0;
  return amenity.category.toLowerCase() === selectedCategory.toLowerCase() ? 5 : 0;
}

// ✅ Optional: Penalize high-priced amenities for budget vibes
export function scorePrice(amenity: any): number {
  if (typeof amenity.price !== "number") return 0;
  // Assumes price 1–5 scale; prefer cheaper if refueling/quick
  return 5 - Math.min(amenity.price, 5);
} 