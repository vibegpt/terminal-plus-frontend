// src/hooks/usePageMeta.ts
// Per-page <title> and rel=canonical for pages with their own URL (vibe,
// collection, amenity). index.html holds the static title, which every other
// page keeps. It has no canonical, because the SPA serves that file for every
// route.

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ORIGIN = 'https://terminalplus.app';

// Captured at module load, before any page has changed it.
const STATIC_TITLE = typeof document !== 'undefined' ? document.title : '';

/**
 * Sets document.title (when `title` is non-null) and a canonical link to this
 * page's own URL (path only, no query). Both are undone on unmount.
 */
export function usePageMeta(title: string | null): void {
  const { pathname } = useLocation();

  useEffect(() => {
    if (title) document.title = title;
    return () => { document.title = STATIC_TITLE; };
  }, [title]);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'canonical';
    link.href = `${ORIGIN}${pathname}`;
    document.head.appendChild(link);
    return () => { link.remove(); };
  }, [pathname]);
}

/** "Power Up ⚡" → "Power Up": emoji read badly in tab titles and search results. */
export function stripEmoji(s: string): string {
  return s.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '').replace(/\s+/g, ' ').trim();
}
