#!/usr/bin/env node
/**
 * backfill-opening-hours.js
 * 
 * Fetches real opening hours from Google Places API for SIN amenities
 * and writes them back to Supabase with hours_confirmed = true.
 * 
 * Usage:
 *   node backfill-opening-hours.js                  # Dry run (preview only)
 *   node backfill-opening-hours.js --write           # Actually update Supabase
 *   node backfill-opening-hours.js --write --all     # Update ALL amenities (not just unconfirmed)
 *   node backfill-opening-hours.js --terminal SIN-T3 # Only process one terminal
 * 
 * Required env vars (in .env or exported):
 *   VITE_SUPABASE_URL          - Your Supabase project URL
 *   VITE_SUPABASE_ANON_KEY     - Your Supabase anon key (or use SERVICE_ROLE for writes)
 *   SUPABASE_SERVICE_ROLE_KEY  - Service role key (preferred for writes)
 *   GOOGLE_MAPS_API_KEY        - Google Maps API key with Places API enabled
 * 
 * Prerequisites:
 *   npm install @supabase/supabase-js dotenv
 *   
 *   Ensure Google Places API (New) is enabled in your Google Cloud Console.
 *   The script uses the Text Search endpoint which requires billing enabled.
 * 
 * Cost estimate:
 *   ~561 amenities × 1 Text Search call each = ~561 calls
 *   Google Places Text Search: $32 per 1000 calls = ~$18 total
 *   With SKU caching and the --terminal flag, you can control costs.
 */

const { createClient } = require('@supabase/supabase-js');

// ---------- CONFIG ----------
// Load from .env if present
try { require('dotenv').config(); } catch (e) { /* dotenv optional */ }

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

// Parse CLI flags
const args = process.argv.slice(2);
const WRITE_MODE = args.includes('--write');
const ALL_MODE = args.includes('--all');
const terminalIdx = args.indexOf('--terminal');
const TERMINAL_FILTER = terminalIdx !== -1 ? args[terminalIdx + 1] : null;

// Rate limiting: Google Places allows 600 QPM, we'll be conservative
const DELAY_MS = 200;       // 200ms between calls = 300 QPM max
const BATCH_SIZE = 50;       // Process in batches, pause between
const BATCH_PAUSE_MS = 5000; // 5s pause between batches

// Terminal name mappings for better Google search context
const TERMINAL_SEARCH_NAMES = {
  'SIN-T1': 'Changi Airport Terminal 1',
  'SIN-T2': 'Changi Airport Terminal 2',
  'SIN-T3': 'Changi Airport Terminal 3',
  'SIN-T4': 'Changi Airport Terminal 4',
  'SIN-JEWEL': 'Jewel Changi Airport',
};

// Categories that are unlikely to have Google Places listings
const SKIP_CATEGORIES = [
  'art installation', 'cultural performance', 'garden', 'playground',
  'viewing gallery', 'heritage zone', 'immersive wall'
];

// ---------- HELPERS ----------

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format Google's opening_hours into a human-readable string.
 * 
 * Places API (New) returns:
 *   weekdayDescriptions: ["Monday: 6:00 AM – 1:00 AM", ...]
 *   periods: [{ open: { day: 0, hour: 6, minute: 0 }, close: { day: 0, hour: 1, minute: 0 } }]
 * 
 * We PRIORITIZE weekdayDescriptions because it's pre-formatted and reliable.
 * Output: "06:00-01:00" or "24/7" or "Mon-Fri 06:00-22:00, Sat-Sun 08:00-20:00"
 */
function formatOpeningHours(periods, weekdayText) {
  
  // PRIORITY 1: Use weekdayDescriptions (most reliable from Places API New)
  if (weekdayText && weekdayText.length >= 1) {
    // Extract just the hours portion from each day
    const hourPatterns = weekdayText.map(text => {
      // Handle formats like "Monday: 6:00 AM – 1:00 AM" or "Monday: Open 24 hours"
      const match = text.match(/:\s*(.+)/);
      return match ? match[1].trim() : 'Closed';
    });
    
    const unique = [...new Set(hourPatterns)];
    
    // All same hours across all days
    if (unique.length === 1) {
      if (unique[0].toLowerCase().includes('open 24 hours')) return '24/7';
      if (unique[0].toLowerCase().includes('closed')) return 'Closed';
      return parseGoogleTimeRange(unique[0]);
    }
    
    // Two patterns — check for weekday/weekend split
    if (unique.length === 2 && weekdayText.length === 7) {
      const weekday = hourPatterns.slice(0, 5);  // Mon-Fri
      const weekend = hourPatterns.slice(5);       // Sat-Sun
      const weekdayUnique = [...new Set(weekday)];
      const weekendUnique = [...new Set(weekend)];
      
      if (weekdayUnique.length === 1 && weekendUnique.length === 1) {
        const wdHours = parseGoogleTimeRange(weekdayUnique[0]);
        const weHours = parseGoogleTimeRange(weekendUnique[0]);
        if (weHours === 'Closed') return `Mon-Fri ${wdHours}, Sat-Sun Closed`;
        return `Mon-Fri ${wdHours}, Sat-Sun ${weHours}`;
      }
    }
    
    // Fallback: use the most common hours pattern
    const mostCommon = unique.sort((a, b) => 
      hourPatterns.filter(h => h === b).length - hourPatterns.filter(h => h === a).length
    )[0];
    if (mostCommon.toLowerCase().includes('open 24 hours')) return '24/7';
    return parseGoogleTimeRange(mostCommon);
  }

  // PRIORITY 2: Use periods (Places API New format: hour/minute integers)
  if (periods && periods.length > 0) {
    // 24/7 check: single period with no close
    if (periods.length === 1 && !periods[0].close) {
      return '24/7';
    }

    // Extract hours from first period using New API format (hour/minute integers)
    const first = periods[0];
    const openHour = first.open?.hour;
    const openMin = first.open?.minute;
    const closeHour = first.close?.hour;
    const closeMin = first.close?.minute;
    
    if (openHour !== undefined && closeHour !== undefined) {
      const open = `${String(openHour).padStart(2,'0')}:${String(openMin || 0).padStart(2,'0')}`;
      const close = `${String(closeHour).padStart(2,'0')}:${String(closeMin || 0).padStart(2,'0')}`;
      return `${open}-${close}`;
    }
    
    // Legacy format fallback (time as "0600" string)
    if (first.open?.time && first.close?.time) {
      const open = first.open.time;
      const close = first.close.time;
      return `${open.slice(0,2)}:${open.slice(2)}-${close.slice(0,2)}:${close.slice(2)}`;
    }
  }

  return null;
}

/**
 * Parse Google's "10:00 AM – 10:00 PM" format into "10:00-22:00"
 */
function parseGoogleTimeRange(text) {
  if (!text) return null;
  if (text.toLowerCase().includes('open 24 hours')) return '24/7';
  if (text.toLowerCase().includes('closed')) return 'Closed';
  
  // Match patterns like "6:00 AM – 1:00 AM" or "10:00 AM – 10:00 PM"
  const match = text.match(/(\d{1,2}:\d{2})\s*(AM|PM)\s*[–-]\s*(\d{1,2}:\d{2})\s*(AM|PM)/i);
  if (!match) return text; // Return raw if we can't parse
  
  const openTime = convertTo24h(match[1], match[2]);
  const closeTime = convertTo24h(match[3], match[4]);
  return `${openTime}-${closeTime}`;
}

function convertTo24h(time, ampm) {
  let [hours, minutes] = time.split(':').map(Number);
  if (ampm.toUpperCase() === 'PM' && hours !== 12) hours += 12;
  if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Search Google Places API for a specific amenity at Changi Airport.
 * Uses the Text Search (New) endpoint.
 */
async function searchGooglePlaces(amenityName, terminalCode) {
  const terminalName = TERMINAL_SEARCH_NAMES[terminalCode] || 'Changi Airport Singapore';
  const query = `${amenityName} ${terminalName}`;
  
  // Use Places API Text Search
  const url = 'https://places.googleapis.com/v1/places:searchText';
  
  const body = {
    textQuery: query,
    locationBias: {
      circle: {
        center: {
          latitude: 1.3644,  // Changi Airport coordinates
          longitude: 103.9915
        },
        radius: 3000.0  // 3km radius covers all terminals + Jewel
      }
    },
    maxResultCount: 3,  // We only need the top match
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.currentOpeningHours,places.regularOpeningHours,places.id'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`  ❌ Google API error (${response.status}): ${errText.slice(0, 200)}`);
      return null;
    }

    const data = await response.json();
    
    if (!data.places || data.places.length === 0) {
      return null;
    }

    // Take the first result — it's the closest match
    const place = data.places[0];
    
    // Check if the result is actually at Changi Airport (not some random location)
    const address = place.formattedAddress || '';
    const isChangi = address.toLowerCase().includes('changi') || 
                     address.toLowerCase().includes('airport') ||
                     address.toLowerCase().includes('jewel');
    
    if (!isChangi) {
      return null;
    }

    // Check if the Google result name is a reasonable match for what we searched
    // This prevents "Montblanc" matching "Lotte Duty Free" or "Rituals" matching "Shilla Duty Free"
    const googleName = (place.displayName?.text || '').toLowerCase();
    const searchName = amenityName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const googleClean = googleName.replace(/[^a-z0-9]/g, '');
    
    // At least one significant word from our amenity name should appear in the Google result
    const significantWords = searchName.split(/\s+/).filter(w => w.length > 2);
    const nameWords = amenityName.toLowerCase().split(/[\s&]+/).filter(w => w.length > 2);
    const hasNameMatch = nameWords.some(word => googleClean.includes(word.replace(/[^a-z0-9]/g, '')));
    
    if (!hasNameMatch && nameWords.length > 0) {
      return { placeId: place.id, name: place.displayName?.text, hours: null, mismatch: true };
    }

    // Extract opening hours
    const hours = place.regularOpeningHours || place.currentOpeningHours;
    if (!hours) {
      return { placeId: place.id, name: place.displayName?.text, hours: null };
    }

    const formatted = formatOpeningHours(hours.periods, hours.weekdayDescriptions);
    
    return {
      placeId: place.id,
      name: place.displayName?.text,
      address: place.formattedAddress,
      hours: formatted,
      rawPeriods: hours.periods,
      weekdayText: hours.weekdayDescriptions,
    };

  } catch (err) {
    console.error(`  ❌ Fetch error: ${err.message}`);
    return null;
  }
}

// ---------- MAIN ----------

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  Terminal+ Opening Hours Backfill (Google Places API)   ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  // Validate config
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY. Set env vars or create .env file.');
    process.exit(1);
  }
  if (!GOOGLE_API_KEY) {
    console.error('❌ Missing GOOGLE_MAPS_API_KEY. Set env var or add to .env file.');
    process.exit(1);
  }

  console.log(`Mode:     ${WRITE_MODE ? '🔴 WRITE (will update Supabase)' : '🟢 DRY RUN (preview only)'}`);
  console.log(`Scope:    ${ALL_MODE ? 'ALL amenities' : 'Only unconfirmed hours'}`);
  console.log(`Terminal: ${TERMINAL_FILTER || 'All SIN terminals'}`);
  console.log('');

  // Connect to Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Fetch amenities that need hours
  let query = supabase
    .from('amenity_detail')
    .select('id, name, amenity_slug, terminal_code, opening_hours, hours_confirmed, description')
    .eq('airport_code', 'SIN')
    .order('terminal_code')
    .order('name');

  if (!ALL_MODE) {
    query = query.or('hours_confirmed.is.null,hours_confirmed.eq.false');
  }

  if (TERMINAL_FILTER) {
    query = query.eq('terminal_code', TERMINAL_FILTER);
  }

  const { data: amenities, error } = await query;

  if (error) {
    console.error('❌ Supabase query error:', error.message);
    process.exit(1);
  }

  console.log(`Found ${amenities.length} amenities to process.`);
  console.log('');

  // Filter out amenities unlikely to have Google listings
  const processable = amenities.filter(a => {
    const desc = (a.description || '').toLowerCase();
    const name = (a.name || '').toLowerCase();
    const skip = SKIP_CATEGORIES.some(cat => desc.includes(cat) || name.includes(cat));
    if (skip) {
      console.log(`  ⏭  Skipping (no Google listing expected): ${a.name}`);
    }
    return !skip;
  });

  console.log(`\nProcessing ${processable.length} amenities (skipped ${amenities.length - processable.length}).\n`);

  // Process in batches
  const results = {
    found: [],
    notFound: [],
    errors: [],
    skipped: amenities.length - processable.length,
  };

  for (let i = 0; i < processable.length; i++) {
    const amenity = processable[i];
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const batchTotal = Math.ceil(processable.length / BATCH_SIZE);

    // Batch pause
    if (i > 0 && i % BATCH_SIZE === 0) {
      console.log(`\n⏸  Pausing between batches (${batchNum}/${batchTotal})...\n`);
      await sleep(BATCH_PAUSE_MS);
    }

    const progress = `[${String(i + 1).padStart(3)}/${processable.length}]`;
    process.stdout.write(`${progress} ${amenity.terminal_code} | ${amenity.name}... `);

    try {
      const result = await searchGooglePlaces(amenity.name, amenity.terminal_code);

      if (result && result.hours) {
        console.log(`✅ ${result.hours} (Google: "${result.name}")`);
        results.found.push({
          id: amenity.id,
          name: amenity.name,
          terminal: amenity.terminal_code,
          oldHours: amenity.opening_hours,
          newHours: result.hours,
          googleName: result.name,
          googlePlaceId: result.placeId,
        });

        // Write to Supabase if in write mode
        if (WRITE_MODE) {
          const { error: updateErr } = await supabase
            .from('amenity_detail')
            .update({
              opening_hours: result.hours,
              hours_confirmed: true,
            })
            .eq('id', amenity.id);

          if (updateErr) {
            console.error(`    ⚠️  Write failed: ${updateErr.message}`);
            results.errors.push({ id: amenity.id, name: amenity.name, error: updateErr.message });
          }
        }
      } else if (result && result.mismatch) {
        console.log(`🟠 Name mismatch: Google="${result.name}" — skipping`);
        results.notFound.push({ id: amenity.id, name: amenity.name, terminal: amenity.terminal_code, reason: `name mismatch: ${result.name}` });
      } else if (result && !result.hours) {
        console.log(`🟡 Found on Google but no hours listed`);
        results.notFound.push({ id: amenity.id, name: amenity.name, terminal: amenity.terminal_code, reason: 'no hours' });
      } else {
        console.log(`⬜ Not found on Google`);
        results.notFound.push({ id: amenity.id, name: amenity.name, terminal: amenity.terminal_code, reason: 'not found' });
      }
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
      results.errors.push({ id: amenity.id, name: amenity.name, error: err.message });
    }

    await sleep(DELAY_MS);
  }

  // ---------- SUMMARY ----------
  console.log('\n');
  console.log('══════════════════════════════════════════════════════════');
  console.log('                     RESULTS SUMMARY                     ');
  console.log('══════════════════════════════════════════════════════════');
  console.log(`  Total processed:    ${processable.length}`);
  console.log(`  Hours found:        ${results.found.length} ✅`);
  console.log(`  Not found/no hours: ${results.notFound.length} ⬜`);
  console.log(`  Errors:             ${results.errors.length} ❌`);
  console.log(`  Skipped (no listing): ${results.skipped} ⏭`);
  console.log(`  Mode:               ${WRITE_MODE ? 'WRITTEN TO SUPABASE' : 'DRY RUN (use --write to save)'}`);
  console.log('══════════════════════════════════════════════════════════');

  // Show what was found
  if (results.found.length > 0) {
    console.log('\n📋 Hours found:');
    console.log('─'.repeat(80));
    for (const r of results.found) {
      const changed = r.oldHours !== r.newHours ? ' ← CHANGED' : '';
      console.log(`  ${r.terminal} | ${r.name}`);
      console.log(`    Old: ${r.oldHours || '(empty)'} → New: ${r.newHours}${changed}`);
    }
  }

  // Show not found
  if (results.notFound.length > 0) {
    console.log('\n⬜ Not found / no hours (will keep terminal defaults):');
    console.log('─'.repeat(80));
    for (const r of results.notFound) {
      console.log(`  ${r.terminal} | ${r.name} (${r.reason})`);
    }
  }

  // Show errors
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    console.log('─'.repeat(80));
    for (const r of results.errors) {
      console.log(`  ${r.name}: ${r.error}`);
    }
  }

  // Write results to a JSON file for reference
  const outputPath = `./hours-backfill-results-${new Date().toISOString().slice(0,10)}.json`;
  const fs = require('fs');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n📁 Full results saved to: ${outputPath}`);

  if (!WRITE_MODE && results.found.length > 0) {
    console.log('\n💡 Run with --write to save these hours to Supabase:');
    console.log(`   node backfill-opening-hours.js --write`);
  }

  // Cost estimate
  console.log(`\n💰 Estimated Google API cost: ~$${(processable.length * 0.032).toFixed(2)} (${processable.length} Text Search calls)`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
