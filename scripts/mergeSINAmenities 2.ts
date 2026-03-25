import fs from 'fs';
import path from 'path';

interface Amenity {
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

function mergeSINAmenities() {
  const mainAmenitiesPath = path.join(__dirname, '../src/data/amenities.json');
  const newDiningPath = path.join(__dirname, 'sin_t1_dining_amenities.json');
  const transitAttractionsPath = path.join(__dirname, 'SIN_Transit_Attractions.json');
  const transitShopsPath = path.join(__dirname, 'SIN_Transit_Shops.json');
  const multiTerminalPath = path.join(__dirname, 'sin_multi_terminal_amenities.json');
  const backupPath = path.join(__dirname, '../src/data/amenities_backup.json');

  // Read existing amenities
  const existingAmenities: Amenity[] = JSON.parse(fs.readFileSync(mainAmenitiesPath, 'utf-8'));
  console.log(`📖 Existing amenities: ${existingAmenities.length}`);

  // Read new SIN dining amenities (if present)
  let newSINAmenities: any[] = [];
  if (fs.existsSync(newDiningPath)) {
    newSINAmenities = JSON.parse(fs.readFileSync(newDiningPath, 'utf-8'));
    console.log(`🍽️  New SIN amenities (all terminals): ${newSINAmenities.length}`);
  }

  // Read SIN transit attractions (if present)
  let transitAttractions: any[] = [];
  if (fs.existsSync(transitAttractionsPath)) {
    transitAttractions = JSON.parse(fs.readFileSync(transitAttractionsPath, 'utf-8'));
    console.log(`🎡 SIN Transit Attractions: ${transitAttractions.length}`);
  }

  // Read SIN transit shops (if present)
  let transitShops: any[] = [];
  if (fs.existsSync(transitShopsPath)) {
    transitShops = JSON.parse(fs.readFileSync(transitShopsPath, 'utf-8'));
    console.log(`🛍️  SIN Transit Shops: ${transitShops.length}`);
  }

  // Read SIN multi-terminal amenities (if present)
  let multiTerminalAmenities: any[] = [];
  if (fs.existsSync(multiTerminalPath)) {
    multiTerminalAmenities = JSON.parse(fs.readFileSync(multiTerminalPath, 'utf-8'));
    console.log(`🏢 SIN Multi-terminal amenities: ${multiTerminalAmenities.length}`);
  }

  // Create backup
  fs.writeFileSync(backupPath, JSON.stringify(existingAmenities, null, 2));
  console.log(`💾 Backup created: ${backupPath}`);

  // Prepare lookup for duplicate detection (by name and slug)
  const existingByName = new Map(existingAmenities.map(a => [a.name.toLowerCase(), a]));
  const existingBySlug = new Map(existingAmenities.filter(a => a.slug).map(a => [a.slug!.toLowerCase(), a]));

  // Merge new SIN dining amenities (add only if not duplicate by name)
  const uniqueNewAmenities: Amenity[] = [];
  const duplicates: string[] = [];
  newSINAmenities.forEach((amenity: any) => {
    const lowerName = amenity.name.toLowerCase();
    if (existingByName.has(lowerName)) {
      duplicates.push(amenity.name);
    } else {
      const completeAmenity: Amenity = {
        name: amenity.name,
        terminal_code: amenity.terminal_code,
        category: amenity.category || 'Dining',
        amenity_type: amenity.amenity_type || 'Casual Dining',
        description: amenity.description || '',
        location_description: amenity.location_description || '',
        opening_hours: amenity.opening_hours || {},
        vibe_tags: amenity.vibe_tags || [],
        status: amenity.status || 'active',
        image_url: amenity.image_url || '',
        airport_code: amenity.airport_code || 'SIN',
        coordinates: amenity.coordinates || { lat: 0, lng: 0 },
        price_tier: amenity.price_tier || '$$',
        access: amenity.access || 'public',
        tags: amenity.tags || []
      };
      uniqueNewAmenities.push(completeAmenity);
      existingByName.set(lowerName, completeAmenity);
    }
  });

  // Merge SIN transit attractions (replace by name or slug, always add as transit-only)
  let replacedAttractions = 0;
  let addedAttractions = 0;
  transitAttractions.forEach((attr: any) => {
    const lowerName = attr.name.toLowerCase();
    const lowerSlug = attr.slug ? attr.slug.toLowerCase() : undefined;
    // Remove any existing amenity with same name or slug
    let replacedIdx = -1;
    replacedIdx = existingAmenities.findIndex(a => a.name.toLowerCase() === lowerName || (lowerSlug && a.slug && a.slug.toLowerCase() === lowerSlug));
    if (replacedIdx !== -1) {
      existingAmenities.splice(replacedIdx, 1);
      replacedAttractions++;
    }
    // Add the new transit attraction
    const completeAmenity: Amenity = {
      name: attr.name,
      slug: attr.slug,
      terminal_code: attr.terminal_code || 'SIN',
      category: 'Attraction',
      amenity_type: 'Transit Attraction',
      description: attr.description || '',
      location_description: attr.location || '',
      opening_hours: { 'All': attr.open_hours || '24 Hours' },
      vibe_tags: attr.vibe_tags || ['Explore'],
      status: 'active',
      image_url: attr.image_url || '',
      airport_code: 'SIN',
      coordinates: attr.coordinates || { lat: 0, lng: 0 },
      price_tier: '$$',
      access: 'transit-only',
      tags: ['transit-only']
    };
    existingAmenities.push(completeAmenity);
    addedAttractions++;
  });

  // Merge SIN transit shops (replace by name or slug, always add as transit-only)
  let replacedShops = 0;
  let addedShops = 0;
  transitShops.forEach((shop: any) => {
    const lowerName = shop.name.toLowerCase();
    const lowerSlug = shop.slug ? shop.slug.toLowerCase() : undefined;
    // Remove any existing amenity with same name or slug
    let replacedIdx = -1;
    replacedIdx = existingAmenities.findIndex(a => a.name.toLowerCase() === lowerName || (lowerSlug && a.slug && a.slug.toLowerCase() === lowerSlug));
    if (replacedIdx !== -1) {
      existingAmenities.splice(replacedIdx, 1);
      replacedShops++;
    }
    // Add the new transit shop
    const completeAmenity: Amenity = {
      name: shop.name,
      slug: shop.slug,
      terminal_code: shop.terminal_code || 'SIN',
      category: 'Shopping',
      amenity_type: 'Retail',
      description: shop.description || '',
      location_description: shop.location || '',
      opening_hours: shop.opening_hours || {},
      vibe_tags: shop.vibe_tags || ['Shop'],
      status: 'active',
      image_url: shop.image_url || '',
      airport_code: 'SIN',
      coordinates: shop.coordinates || { lat: 0, lng: 0 },
      price_tier: shop.price_tier || '$$',
      access: 'transit-only',
      tags: ['transit-only']
    };
    existingAmenities.push(completeAmenity);
    addedShops++;
  });

  // Merge SIN multi-terminal amenities (create separate entries for each terminal)
  let replacedMultiTerminal = 0;
  let addedMultiTerminal = 0;
  multiTerminalAmenities.forEach((amenity: any) => {
    const terminals = amenity.terminals || [amenity.terminal?.split(' ') || 'SIN'];
    
    terminals.forEach((terminal: string) => {
      const terminalCode = `SIN-${terminal}`;
      const lowerName = amenity.name.toLowerCase();
      const lowerSlug = amenity.slug ? amenity.slug.toLowerCase() : undefined;
      
      // Remove any existing amenity with same name or slug in this terminal
      let replacedIdx = -1;
      replacedIdx = existingAmenities.findIndex(a => 
        a.name.toLowerCase() === lowerName && a.terminal_code === terminalCode ||
        (lowerSlug && a.slug && a.slug.toLowerCase() === lowerSlug && a.terminal_code === terminalCode)
      );
      
      if (replacedIdx !== -1) {
        existingAmenities.splice(replacedIdx, 1);
        replacedMultiTerminal++;
      }
      
      // Add the new multi-terminal amenity
      const completeAmenity: Amenity = {
        name: amenity.name,
        slug: amenity.slug,
        terminal_code: terminalCode,
        category: 'Shopping',
        amenity_type: 'Retail',
        description: amenity.description || '',
        location_description: amenity.location || 'Multiple Locations',
        opening_hours: amenity.opening_hours || { 'All': '24 Hours' },
        vibe_tags: amenity.vibe_tags || ['Shop'],
        status: 'active',
        image_url: amenity.image_url || '',
        airport_code: 'SIN',
        coordinates: amenity.coordinates || { lat: 0, lng: 0 },
        price_tier: amenity.price_tier || '$$',
        access: 'transit-only',
        tags: ['transit-only', 'multi-terminal']
      };
      existingAmenities.push(completeAmenity);
      addedMultiTerminal++;
    });
  });

  // Merge all
  const mergedAmenities = [...existingAmenities, ...uniqueNewAmenities];

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
  console.log(`📈 Net increase: ${uniqueNewAmenities.length + addedAttractions + addedShops + addedMultiTerminal - replacedAttractions - replacedShops - replacedMultiTerminal} amenities`);
  console.log(`🔄 Transit attractions replaced: ${replacedAttractions}, added: ${addedAttractions}`);
  console.log(`🔄 Transit shops replaced: ${replacedShops}, added: ${addedShops}`);
  console.log(`🔄 Multi-terminal amenities replaced: ${replacedMultiTerminal}, added: ${addedMultiTerminal}`);

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

  // Count SIN transit-only amenities
  const sinTransit = mergedAmenities.filter(a => a.terminal_code.startsWith('SIN') && a.access === 'transit-only');
  const sinTransitAttractions = sinTransit.filter(a => a.category === 'Attraction');
  const sinTransitShops = sinTransit.filter(a => a.category === 'Shopping');
  console.log(`\n🎡 SIN Transit-only amenities: ${sinTransit.length}`);
  console.log(`  🎨 Attractions: ${sinTransitAttractions.length}`);
  console.log(`  🛍️  Shops: ${sinTransitShops.length}`);

  console.log(`\n💾 Updated amenities.json with merged data`);
  console.log(`📍 File: ${mainAmenitiesPath}`);
}

if (require.main === module) {
  mergeSINAmenities();
}

export { mergeSINAmenities }; 