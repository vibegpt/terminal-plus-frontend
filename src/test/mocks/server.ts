import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock Supabase amenities endpoint
  http.get('https://test.supabase.co/rest/v1/amenity_detail', () => {
    return HttpResponse.json([
      {
        id: 1,
        name: 'Test Coffee Shop',
        amenity_slug: 'test-coffee',
        terminal_code: 'SIN-T3',
        vibe_tags: ['refuel', 'work'],
        price_level: '$$',
      },
      {
        id: 2,
        name: 'Test Lounge',
        amenity_slug: 'test-lounge',
        terminal_code: 'SIN-T3',
        vibe_tags: ['comfort', 'chill'],
        price_level: '$$$',
      },
    ]);
  }),

  // Mock collections endpoint
  http.get('https://test.supabase.co/rest/v1/collections', () => {
    return HttpResponse.json([
      {
        id: 'morning-energy',
        name: 'Morning Energy',
        description: 'Start your day right',
        vibe_tags: ['refuel'],
      },
    ]);
  }),
];

export const server = setupServer(...handlers);
