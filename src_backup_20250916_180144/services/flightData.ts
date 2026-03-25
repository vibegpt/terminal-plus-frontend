// No Flight Labs API keys or references remain. Only AviationStack API logic is present.
const API_KEY = import.meta.env.VITE_AVIATIONSTACK_API_KEY;

type FetchFlightInfoParams = {
  flightNumber?: string;
  dep?: string;
  arr?: string;
  date?: string;
};

export async function fetchFlightInfo({ flightNumber, dep, arr, date }: FetchFlightInfoParams) {
  let url = `http://api.aviationstack.com/v1/flights?access_key=${API_KEY}`;
  if (flightNumber) url += `&flight_iata=${flightNumber}`;
  else if (dep && arr && date) url += `&dep_iata=${dep}&arr_iata=${arr}&flight_date=${date}`;
  else throw new Error("Insufficient flight info");
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch flight data");
  return res.json();
}

const flightDurationCache: Record<string, number> = {};

const fallbackDurations: Record<string, number> = {
  "SYD-SIN": 510,
  "SIN-LHR": 800,
};

export async function getFlightDuration(
  from: string,
  to: string,
  date: string,
  flightNumber?: string
): Promise<number> {
  const cacheKey = `${from}-${to}-${date}-${flightNumber || "any"}`;
  if (flightDurationCache.hasOwnProperty(cacheKey)) return flightDurationCache[cacheKey];

  try {
    const response = await fetchFlightInfo({ dep: from, arr: to, date });

    if (response?.data?.length > 0) {
      let flight = response.data[0];

      // Try to match exact flight number (e.g. QF1)
      if (flightNumber) {
        const matched = response.data.find(
          (f: any) =>
            f.flight?.iata?.toUpperCase() === flightNumber.toUpperCase() ||
            f.flight?.icao?.toUpperCase() === flightNumber.toUpperCase()
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
    const fallbackKey = `${from}-${to}`;
    const fallback = fallbackDurations[fallbackKey] ?? 540;
    flightDurationCache[cacheKey] = fallback;
    return fallback;
  } catch (err) {
    console.error("Flight duration fetch failed:", err);
    const fallbackKey = `${from}-${to}`;
    const fallback = fallbackDurations[fallbackKey] ?? 540;
    flightDurationCache[cacheKey] = fallback;
    return fallback;
  }
}