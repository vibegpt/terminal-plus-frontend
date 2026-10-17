export const J: any = { journey: null, writes: [] as any[] };
export function useJourney() { return { journey: J.journey, setJourney: (j: any) => J.writes.push(j) }; }
