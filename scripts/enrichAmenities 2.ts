// enrichAmenities.ts

import fs from 'fs';
import path from 'path';
import slugify from 'slugify';

interface Amenity {
  name: string;
  terminal_code: string;
  amenity_type?: string;
  category?: string;
  location_description?: string;
  price_tier?: string;
  opening_hours?: string;
  image_url?: string;
  vibe_tags?: string[];
  has_free_perk?: boolean;
  slug?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

const inputFile = path.join(__dirname, '../data/raw-amenities.json');
const outputFile = path.join(__dirname, '../data/enriched-amenities.json');

// Vibe mapping rules
const vibeMap: Record<string, string[]> = {
  Refuel: ['food', 'beverage', 'cafe', 'snack', 'bar'],
  Comfort: ['lounge', 'spa', 'rest', 'relax'],
  Explore: ['duty', 'book', 'fashion', 'gallery', 'store'],
  Quick: ['express', 'convenience', 'kiosk'],
  Work: ['wifi', 'business', 'meeting'],
  Chill: ['chill', 'rest', 'garden', 'quiet', 'meditation'],
  Shop: ['shop', 'store', 'retail']
};

function autoTagVibes(amenity: Amenity): string[] {
  const tags: Set<string> = new Set();
  const fields = [amenity.name, amenity.category, amenity.amenity_type].join(' ').toLowerCase();

  for (const [vibe, keywords] of Object.entries(vibeMap)) {
    if (keywords.some(kw => fields.includes(kw))) {
      tags.add(vibe);
    }
  }

  return Array.from(tags);
}

function enrichAmenity(raw: Amenity): Amenity {
  const slug = slugify(raw.name || '', { lower: true });
  const vibe_tags = autoTagVibes(raw);
  const has_free_perk = /free|complimentary/i.test(
    (raw.location_description || '') + (raw.amenity_type || '')
  );

  // Extract airport code from terminal_code (e.g., "SYD-T1" -> "SYD")
  const airportCode = raw.terminal_code?.split('-')[0] || 'SYD';
  const image_url = raw.image_url || `/assets/amenities/${airportCode}/${slug}.jpg`;

  return {
    ...raw,
    slug,
    image_url,
    price_tier: raw.price_tier || '$$',
    vibe_tags,
    has_free_perk
  };
}

function enrichAllAmenities() {
  try {
    const rawData = fs.readFileSync(inputFile, 'utf-8');
    const rawAmenities: Amenity[] = JSON.parse(rawData);

    const enriched = rawAmenities.map(enrichAmenity);
    fs.writeFileSync(outputFile, JSON.stringify(enriched, null, 2));
    console.log(`✅ Enriched ${enriched.length} amenities → ${outputFile}`);
  } catch (error) {
    console.error('❌ Error enriching amenities:', error);
    process.exit(1);
  }
}

enrichAllAmenities(); 