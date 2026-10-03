// src/lib/routes.ts
// The app's page routes, defined once. App.tsx renders <Route>s from these
// patterns, and isPagePath() decides whether a URL is a page (rendered at once,
// for every visitor) or Home (where first-time visitors get the capture gate).

import { matchPath } from 'react-router-dom';

export const HOME_PATH = '/';

export const PAGE_PATHS = {
  vibe: '/vibe/:vibeId',
  collection: '/collection/:vibeSlug/:collectionId',
  search: '/search',
  profile: '/profile',
  map: '/map',
  saved: '/saved',
  amenityInTerminal: '/amenity/:terminalCode/:slug',
  amenity: '/amenity/:slug',
} as const;

/**
 * True for a URL that renders a page of its own. `/`, `/sin` and unknown
 * paths are false: they all end up on Home.
 */
export function isPagePath(pathname: string): boolean {
  return Object.values(PAGE_PATHS).some(pattern => matchPath(pattern, pathname) !== null);
}
