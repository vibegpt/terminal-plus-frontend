const fs = require('fs');
const path = './src/data/airport_terminal_amenities.json';

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const data = JSON.parse(fs.readFileSync(path, 'utf8'));
let patched = 0;

for (const amenity of data) {
  const isSIN = (
    (amenity.terminal_code && amenity.terminal_code.startsWith('SIN')) ||
    (amenity.airport_code && amenity.airport_code.startsWith('SIN'))
  );
  if (
    isSIN &&
    !amenity.slug &&
    amenity.name
  ) {
    amenity.slug = slugify(amenity.name);
    patched++;
  }
}

if (patched > 0) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
  console.log(`Patched ${patched} SIN amenities with missing slugs!`);
} else {
  console.log('No missing slugs found for SIN amenities.');
} 