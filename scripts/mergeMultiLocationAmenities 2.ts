import fs from 'fs';
import path from 'path';

interface Location {
  terminal: string;
  zone: string;
  lat: number | null;
  lng: number | null;
}

interface MultiLocationAmenity {
  id: string;
  name: string;
  brand: string;
  vibe_tags: string[];
  transit_only: boolean;
  is_chain_brand: boolean;
  show_all_locations_on_map: boolean;
  locations: Location[];
}

interface LegacyAmenity {
  name: string;
  slug?: string;
  terminal_code: string;
  category: string;
  amenity_type: string;
  description: string;
  location_description: string;
  opening_hours: Record<string, string>;
  vibe_tags: string[];
  status: string;
  image_url: string;
  airport_code: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  price_tier: string;
  access?: string;
  tags?: string[];
}

function mergeMultiLocationAmenities() {
  const mainAmenitiesPath = path.join(__dirname, '../src/data/amenities.json');
  const multiLocationPath = path.join(__dirname, 'sin_multi_terminal_amenities_v2.json');
  const backupPath = path.join(__dirname, '../src/data/amenities_backup_v2.json');

  // Read existing amenities
  const existingAmenities: LegacyAmenity[] = JSON.parse(fs.readFileSync(mainAmenitiesPath, 'utf-8'));
  console.log(`📖 Existing amenities: ${existingAmenities.length}`);

  // Read new multi-location amenities
  let multiLocationAmenities: MultiLocationAmenity[] = [];
  if (fs.existsSync(multiLocationPath)) {
    multiLocationAmenities = JSON.parse(fs.readFileSync(multiLocationPath, 'utf-8'));
    console.log(`🏢 Multi-location amenities: ${multiLocationAmenities.length}`);
  }

  // Create backup
  fs.writeFileSync(backupPath, JSON.stringify(existingAmenities, null, 2));
  console.log(`💾 Backup created: ${backupPath}`);

  // Remove existing entries that will be replaced by multi-location versions
  const idsToReplace = new Set(multiLocationAmenities.map(a => a.id));
  const namesToReplace = new Set(multiLocationAmenities.map(a => a.name.toLowerCase()));
  
  let removedCount = 0;
  const filteredAmenities = existingAmenities.filter(amenity => {
    const shouldRemove = idsToReplace.has(amenity.slug || '') || 
                        namesToReplace.has(amenity.name.toLowerCase());
    if (shouldRemove) {
      removedCount++;
      console.log(`🗑️  Removing existing: ${amenity.name} (${amenity.terminal_code})`);
    }
    return !shouldRemove;
  });

  console.log(`🗑️  Removed ${removedCount} existing entries to be replaced`);

  // Convert multi-location amenities to legacy format for compatibility
  const convertedAmenities: LegacyAmenity[] = [];
  
  multiLocationAmenities.forEach((multiAmenity) => {
    // Create one entry per location
    multiAmenity.locations.forEach((location) => {
      const legacyAmenity: LegacyAmenity = {
        name: multiAmenity.name,
        slug: multiAmenity.id,
        terminal_code: `SIN-${location.terminal}`,
        category: 'Shopping',
        amenity_type: 'Retail',
        description: '',
        location_description: location.zone,
        opening_hours: { 'All': '24 Hours' },
        vibe_tags: multiAmenity.vibe_tags,
        status: 'active',
        image_url: '',
        airport_code: 'SIN',
        coordinates: {
          lat: location.lat || 0,
          lng: location.lng || 0
        },
        price_tier: '$$',
        access: multiAmenity.transit_only ? 'transit-only' : 'public',
        tags: [
          ...(multiAmenity.transit_only ? ['transit-only'] : []),
          'multi-location',
          `brand:${multiAmenity.brand}`,
          `chain:${multiAmenity.is_chain_brand}`,
          `show-all:${multiAmenity.show_all_locations_on_map}`
        ]
      };
      convertedAmenities.push(legacyAmenity);
    });
  });

  console.log(`🔄 Converted ${multiLocationAmenities.length} multi-location amenities to ${convertedAmenities.length} legacy entries`);

  // Merge all amenities
  const mergedAmenities = [...filteredAmenities, ...convertedAmenities];

  // Sort by terminal_code, then by category, then by name
  mergedAmenities.sort((a, b) => {
    if (a.terminal_code !== b.terminal_code) {
      return a.terminal_code.localeCompare(b.terminal_code);
    }
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.name.localeCompare(b.name);
  });

  // Write merged data back to amenities.json
  fs.writeFileSync(mainAmenitiesPath, JSON.stringify(mergedAmenities, null, 2));

  console.log(`\n📈 Final Statistics:`);
  console.log(`✅ Total amenities after merge: ${mergedAmenities.length}`);
  console.log(`📈 Net change: ${convertedAmenities.length - removedCount} amenities`);
  console.log(`🔄 Multi-location amenities: ${multiLocationAmenities.length} brands`);
  console.log(`📍 Total locations: ${convertedAmenities.length}`);

  // Count by terminal
  const terminalCounts: Record<string, number> = {};
  mergedAmenities.forEach(amenity => {
    terminalCounts[amenity.terminal_code] = (terminalCounts[amenity.terminal_code] || 0) + 1;
  });

  console.log(`\n🏢 By Terminal:`);
  Object.entries(terminalCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([terminal, count]) => {
      console.log(`  ${terminal}: ${count} amenities`);
    });

  // Count multi-location amenities
  const multiLocationCount = mergedAmenities.filter(a => 
    a.tags && a.tags.includes('multi-location')
  ).length;
  
  console.log(`\n🏢 Multi-location amenities: ${multiLocationCount} total entries`);
  console.log(`🎯 Unique brands: ${multiLocationAmenities.length}`);

  console.log(`\n💾 Updated amenities.json with multi-location support`);
  console.log(`📍 File: ${mainAmenitiesPath}`);
}

if (require.main === module) {
  mergeMultiLocationAmenities();
}

export { mergeMultiLocationAmenities }; 