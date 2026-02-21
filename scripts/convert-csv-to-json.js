// Convert CSV to JSON for new amenities
const fs = require('fs');
const path = require('path');

// Read the CSV file
const csvPath = path.join(__dirname, '../data/new-amenities-for-collections.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV manually (since we have complex JSON strings in cells)
const lines = csvContent.split('\n');
const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

const amenities = [];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;
  
  // This is a more complex CSV parser that handles JSON arrays in cells
  const values = [];
  let current = '';
  let inQuotes = false;
  let inBrackets = 0;
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    
    if (char === '"' && line[j-1] !== '\\') {
      inQuotes = !inQuotes;
    } else if (char === '[' && !inQuotes) {
      inBrackets++;
      current += char;
    } else if (char === ']' && !inQuotes) {
      inBrackets--;
      current += char;
    } else if (char === ',' && !inQuotes && inBrackets === 0) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  
  // Create amenity object
  const amenity = {};
  headers.forEach((header, index) => {
    let value = values[index];
    if (!value) {
      amenity[header] = null;
      return;
    }
    
    // Remove surrounding quotes
    value = value.replace(/^"/, '').replace(/"$/, '');
    
    // Parse JSON arrays and objects
    if (value.startsWith('[') || value.startsWith('{')) {
      try {
        amenity[header] = JSON.parse(value);
      } catch (e) {
        amenity[header] = value;
      }
    } else if (header === 'instagram_posts_count' || header === 'time_required') {
      amenity[header] = parseInt(value) || 0;
    } else {
      amenity[header] = value;
    }
  });
  
  amenities.push(amenity);
}

// Write JSON file
const jsonPath = path.join(__dirname, '../data/new-amenities-for-collections.json');
fs.writeFileSync(jsonPath, JSON.stringify(amenities, null, 2));

console.log(`Converted ${amenities.length} amenities to JSON`);
console.log('Output file:', jsonPath);
