type Vibe =
  | "Quick"
  | "Refuel"
  | "Chill"
  | "Explore"
  | "Comfort"
  | "Grind";

interface TimelineBlock {
  start: number;
  end: number;
  vibe: Vibe;
  suggestion: string;
}

interface BodyClockInput {
  departureTimeUTC: number;
  flightDurationMins: number;
  departureTimeZoneOffset: number;
  arrivalTimeZoneOffset: number;
  energyLevel?: "low" | "default" | "high";
}

// You must import this JSON manually in Cursor
// It should match this structure: Record<Vibe, Amenity[]>
import sinAmenitiesByVibe from './sin_amenities_by_vibe.json';

export function getBodyClockVibes({
  departureTimeUTC,
  flightDurationMins,
  departureTimeZoneOffset,
  arrivalTimeZoneOffset,
  energyLevel = "default"
}: BodyClockInput): {
  bodyHour: number;
  localArrivalHour: number;
  recommendedVibes: Vibe[];
} {
  const flightDurationHrs = flightDurationMins / 60;
  const utcArrival = departureTimeUTC + flightDurationHrs;
  const bodyClockArrival = utcArrival + departureTimeZoneOffset;
  const localArrival = utcArrival + arrivalTimeZoneOffset;
  const bodyHour = Math.floor(bodyClockArrival % 24);

  let vibeWeights: Record<Vibe, number> = {
    Quick: 1,
    Refuel: 1,
    Chill: 1,
    Explore: 1,
    Comfort: 1,
    Grind: 1
  };

  if (bodyHour >= 2 && bodyHour <= 6) {
    vibeWeights.Comfort += 2;
    vibeWeights.Chill += 1;
    vibeWeights.Explore -= 1;
    vibeWeights.Grind -= 1;
  } else if (bodyHour >= 7 && bodyHour <= 11) {
    vibeWeights.Refuel += 1;
    vibeWeights.Chill += 1;
  } else if (bodyHour >= 0 && bodyHour <= 1) {
    vibeWeights.Comfort += 1;
    vibeWeights.Quick += 1;
    vibeWeights.Explore -= 1;
  }

  if (energyLevel === "low") {
    vibeWeights.Comfort += 1;
    vibeWeights.Grind -= 1;
    vibeWeights.Explore -= 1;
  }
  if (energyLevel === "high") {
    vibeWeights.Explore += 2;
    vibeWeights.Grind += 1;
    vibeWeights.Comfort -= 1;
  }

  const sortedVibes = Object.entries(vibeWeights)
    .filter(([_, w]) => w > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([v]) => v as Vibe);

  return {
    bodyHour,
    localArrivalHour: Math.floor(localArrival % 24),
    recommendedVibes: sortedVibes
  };
}

const sinVibeRules: Record<string, { vibe_focus: Vibe[]; description: string }> = {
  under_60_minutes: {
    vibe_focus: ["Quick", "Refuel"],
    description: "Focus on essentials like SIM check, water refill, snacks, and finding your gate."
  },
  "60_to_120_minutes": {
    vibe_focus: ["Quick", "Refuel", "Chill"],
    description: "Enough time to grab food, relax briefly, and visit an iconic spot like ST3PS or a garden."
  },
  "120_to_240_minutes": {
    vibe_focus: ["Quick", "Refuel", "Chill", "Explore"],
    description: "You can build a full vibe-based mini-journey — explore the terminal, chill, or catch a film."
  },
  over_240_minutes: {
    vibe_focus: ["Quick", "Refuel", "Chill", "Explore", "Comfort"],
    description: "Extended layover: You have time to rest, nap, or use on-site accommodation like Aerotel."
  }
};

function getRealAmenityForVibeT1(vibe: Vibe): string {
  const pool = (sinAmenitiesByVibe as any)[vibe]?.filter(
    (a: any) => a.terminal === "SIN-T1"
  );
  if (!pool || pool.length === 0) return "Explore freely in SIN T1";
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return `${pick.name} (T1) — ${pick.amenity_type}`;
}

export function generateTransitPlan(
  airportCode: string,
  layoverMinutes: number
): TimelineBlock[] {
  if (airportCode !== "SIN") {
    throw new Error("Transit planner currently only supports SIN.");
  }

  let rule;
  if (layoverMinutes <= 60) rule = sinVibeRules["under_60_minutes"];
  else if (layoverMinutes <= 120) rule = sinVibeRules["60_to_120_minutes"];
  else if (layoverMinutes <= 240) rule = sinVibeRules["120_to_240_minutes"];
  else rule = sinVibeRules["over_240_minutes"];

  const chunk = Math.floor(layoverMinutes / rule.vibe_focus.length);
  const timeline: TimelineBlock[] = [];

  for (let i = 0; i < rule.vibe_focus.length; i++) {
    const vibe = rule.vibe_focus[i];
    timeline.push({
      start: i * chunk,
      end: (i + 1) * chunk,
      vibe,
      suggestion: getRealAmenityForVibeT1(vibe)
    });
  }

  return timeline;
} 