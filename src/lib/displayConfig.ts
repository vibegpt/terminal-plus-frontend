// src/lib/displayConfig.ts
// Shared display-count constants. Values unchanged from what was previously
// hardcoded independently in each file — this is centralization only.

export const DISPLAY = {
  COLLECTION_VISIBLE: 7,   // amenities shown per collection (smart7Select, selectScoredAmenities, VibePage/CollectionDetailPage)
  COLLECTION_POOL: 21,     // documented reference only — mirrors api/lib/agent.ts's pool cap,
                           // which is a protected file and does not import this; keep in sync manually
  VIBE_POOL: 50,           // vibe-surface candidate pool cap: VibePage query (still a literal there)
                           // and api/lib/ranking.ts. Must stay equal to VibePage's .limit() —
                           // smart7Select's name-dedup only yields identical results from identical pools
  SEARCH_LIMIT: 40,        // api/chat.ts fallback query pool cap
} as const;
