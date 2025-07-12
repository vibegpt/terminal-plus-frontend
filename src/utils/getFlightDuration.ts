import { fetchFlightInfo } from "@/services/flightData";

const flightDurationCache: Record<string, number> = {};

export async function getFlightDuration(
  from: string,
  to: string,
  date: string,
  flightNumber?: string
): Promise<number> {
  const cacheKey = `${from}-${to}-${date}-${flightNumber || "any"}`;
  if (flightDurationCache[cacheKey]) return flightDurationCache[cacheKey];

  try {
    const response = await fetchFlightInfo({ dep: from, arr: to, date });

    if (response?.data?.length > 0) {
      let flight = response.data[0];

      // Try to match exact flight number (e.g. QF1)
      if (flightNumber) {
        const matched = response.data.find(
          (f: any) => f.flight?.iata?.toUpperCase() === flightNumber.toUpperCase()
        );
        if (matched) flight = matched;
      }

      const depTime = new Date(flight?.departure?.scheduled);
      const arrTime = new Date(flight?.arrival?.scheduled);

      if (!isNaN(depTime.getTime()) && !isNaN(arrTime.getTime())) {
        const duration = Math.round((arrTime.getTime() - depTime.getTime()) / 60000);
        flightDurationCache[cacheKey] = duration;
        return duration;
      }
    }

    // Fallback durations
    if (from === "SYD" && to === "SIN") return 510;
    if (from === "SIN" && to === "LHR") return 800;
    return 540;
  } catch (err) {
    console.error("Flight duration fetch failed:", err);
    return 540;
  }
} 