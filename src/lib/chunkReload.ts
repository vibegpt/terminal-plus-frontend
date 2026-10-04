// src/lib/chunkReload.ts
// Recovery for a page whose JS chunks were removed by a deploy. Route chunks are
// bare dynamic imports (Vite only wraps imports that have deps to preload), so a
// missing chunk rejects the import itself; Vite's `vite:preloadError` covers only
// the imports it wraps. Both paths reload once onto the current build, at most
// once per 60 s per tab, so a chunk that keeps failing can't loop.

import { lazy, type ComponentType } from 'react';

const GUARD_KEY = 'tp_chunk_reload_at';
const GUARD_MS = 60_000;

// How Chrome, Safari and Firefox word a failed dynamic import, plus Vite's CSS preload.
const CHUNK_ERROR_RE =
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS|ChunkLoadError/i;

export function isChunkLoadError(err: unknown): boolean {
  if (!err) return false;
  const text = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  return CHUNK_ERROR_RE.test(text);
}

/** True when this tab already reloaded for a chunk error in the last 60 s. */
export function chunkReloadGuardActive(): boolean {
  try {
    const at = Number(sessionStorage.getItem(GUARD_KEY) || 0);
    return at > 0 && Date.now() - at < GUARD_MS;
  } catch {
    return true; // storage blocked: never reload automatically
  }
}

/** Reloads the page unless the guard has already fired. Returns true if it reloaded. */
export function reloadOnce(): boolean {
  if (chunkReloadGuardActive()) return false;
  try {
    sessionStorage.setItem(GUARD_KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

/**
 * React.lazy for routes: if the chunk is gone, reload once onto the current
 * build instead of throwing. Once the guard has fired it throws, and
 * RouteErrorBoundary shows a Reload button.
 */
export function lazyWithReload<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(() =>
    factory().catch((err: unknown) => {
      // Reloading: keep Suspense's fallback up until the new page replaces this one.
      if (isChunkLoadError(err) && reloadOnce()) return new Promise<{ default: T }>(() => {});
      throw err;
    }),
  );
}

/** Vite fires `vite:preloadError` for the imports it wraps: same guarded reload. */
export function installPreloadErrorHandler(): void {
  window.addEventListener('vite:preloadError', (event) => {
    if (reloadOnce()) event.preventDefault();
  });
}
