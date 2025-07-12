const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/airport_terminal_amenities.json');

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
let patched = false;

for (const amenity of data) {
  if (!amenity.slug && amenity.name) {
    amenity.slug = slugify(amenity.name);
    patched = true;
  }
}

if (patched) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log('Patched missing slugs in airport_terminal_amenities.json');
} else {
  console.log('No missing slugs found.');
} 