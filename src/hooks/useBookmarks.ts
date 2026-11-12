// src/hooks/useBookmarks.ts
// localStorage-backed bookmark system for amenities

import { useState, useEffect, useCallback } from 'react';
import { resolveSlug } from '../../shared/catalogue/slugMap';

const LS_KEY = 'tp_saved_amenities';

export interface SavedAmenity {
  amenitySlug: string;
  name: string;
  terminalCode: string;
  vibeTag: string;
  savedAt: string; // ISO-8601
}

/**
 * CC-27B: a bookmark saved under an old slug is mapped to its canonical slug on read, and
 * two bookmarks that collapse to one canonical slug become one (the earliest save wins).
 * The mapped list is written back once, under the same key and shape, so Saved only
 * ever fetches canonical slugs.
 */
function read(): SavedAmenity[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const items: SavedAmenity[] = raw ? JSON.parse(raw) : [];
    const bySlug = new Map<string, SavedAmenity>();
    let changed = false;
    for (const item of items) {
      const slug = resolveSlug(item.amenitySlug);
      const existing = bySlug.get(slug);
      if (existing) {
        changed = true;
        if (item.savedAt < existing.savedAt) bySlug.set(slug, { ...existing, savedAt: item.savedAt });
        continue;
      }
      if (slug !== item.amenitySlug) changed = true;
      bySlug.set(slug, slug === item.amenitySlug ? item : { ...item, amenitySlug: slug });
    }
    const mapped = [...bySlug.values()];
    if (changed) write(mapped);
    return mapped;
  } catch {
    return [];
  }
}

function write(items: SavedAmenity[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
}

/** Check if a specific amenity is saved */
export function isSaved(slug: string): boolean {
  return read().some(a => a.amenitySlug === slug);
}

/** Toggle bookmark — returns new saved state */
export function toggleBookmark(amenity: Omit<SavedAmenity, 'savedAt'>): boolean {
  const items = read();
  const idx = items.findIndex(a => a.amenitySlug === amenity.amenitySlug);
  if (idx >= 0) {
    items.splice(idx, 1);
    write(items);
    return false;
  }
  items.push({ ...amenity, savedAt: new Date().toISOString() });
  write(items);
  return true;
}

/** Remove a bookmark by slug */
export function removeBookmark(slug: string) {
  write(read().filter(a => a.amenitySlug !== slug));
}

/** Hook: reactive bookmark state for a single amenity */
export function useBookmark(slug: string) {
  const [saved, setSaved] = useState(() => isSaved(slug));

  const toggle = useCallback((amenity: Omit<SavedAmenity, 'savedAt'>) => {
    const next = toggleBookmark(amenity);
    setSaved(next);
    return next;
  }, []);

  return { saved, toggle };
}

/** Hook: full saved list, re-reads on window focus */
export function useSavedAmenities() {
  const [items, setItems] = useState<SavedAmenity[]>(read);

  useEffect(() => {
    const refresh = () => setItems(read());
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  const remove = useCallback((slug: string) => {
    removeBookmark(slug);
    setItems(read());
  }, []);

  return { items, remove };
}
