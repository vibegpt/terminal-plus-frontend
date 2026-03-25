// exportAmenitiesToCSV.ts

import fs from 'fs';
import path from 'path';
import { parse as json2csv } from 'json2csv';

const inputJsonFile = path.join(__dirname, 'amenities.json');
const outputCsvFile = path.join(__dirname, 'amenities.csv');

interface Amenity {
  name: string;
  terminal_code: string;
  category?: string;
  amenity_type?: string;
  description?: string;
  location_description?: string;
  opening_hours?: {
    [key: string]: string;
  };
  vibe_tags?: string[];
  status?: string;
  image_url?: string;
  airport_code?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  price_tier?: string;
}

function exportToCSV() {
  const data: Amenity[] = JSON.parse(fs.readFileSync(inputJsonFile, 'utf-8'));

  const simplified = data.map((a) => ({
    name: a.name || '',
    terminal_code: a.terminal_code || '',
    category: a.category || '',
    amenity_type: a.amenity_type || '',
    description: a.description || '',
    location_description: a.location_description || '',
    opening_hours: a.opening_hours ? JSON.stringify(a.opening_hours) : '',
    vibe_tags: a.vibe_tags ? a.vibe_tags.join(';') : '',
    status: a.status || '',
    image_url: a.image_url || '',
    airport_code: a.airport_code || '',
    lat: a.coordinates?.lat || '',
    lng: a.coordinates?.lng || '',
    price_tier: a.price_tier || ''
  }));

  const csv = json2csv(simplified);
  fs.writeFileSync(outputCsvFile, csv);
  console.log(`✅ Exported ${simplified.length} amenities to CSV → ${outputCsvFile}`);
}

exportToCSV(); 