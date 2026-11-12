// CC-27C: why an amenity record failed to load.

export type LoadFailure = 'missing' | 'unreachable';

/**
 * supabase-js `.single()` reports zero rows as PostgREST error PGRST116. Anything else
 * (a dropped network, a 5xx) means the catalogue could not be reached, which is not the
 * same as the venue not existing: the page says so, instead of "Not found".
 */
export function classifyLoadError(error: { code?: string | null } | null | undefined): LoadFailure {
  return error?.code === 'PGRST116' ? 'missing' : 'unreachable';
}
