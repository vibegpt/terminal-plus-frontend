// src/hooks/useBookmarks.ts
// localStorage-backed bookmark system for amenities

import { useState, useEffect, useCallback } from 'react';

const LS_KEY = 'tp_saved_amenities';

export interface SavedAmenity {
  amenitySlug: string;
  name: string;
  terminalCode: string;
  vibeTag: string;
  savedAt: string; // ISO-8601
}

function read(): SavedAmenity[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
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
