// addNewAmenities.ts

import fs from 'fs';
import path from 'path';
import { createAmenitiesFromTemplate, ProvidedAmenity } from './createAmenitiesFromTemplate';

// Function to add new amenities from a JSON file
function addNewAmenitiesFromFile(inputFile: string) {
  try {
    // Read the input file
    const inputPath = path.join(__dirname, inputFile);
    const newAmenities: ProvidedAmenity[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
    
    console.log(`📖 Reading amenities from: ${inputFile}`);
    console.log(`📝 Found ${newAmenities.length} amenities to process`);
    
    // Process the amenities
    const result = createAmenitiesFromTemplate(newAmenities);
    
    console.log(`\n🎉 Successfully processed amenities!`);
    console.log(`📊 Final count: ${result.length} total amenities`);
    
    return result;
  } catch (error) {
    console.error(`❌ Error processing amenities:`, error);
    return null;
  }
}

// Example usage
if (require.main === module) {
  // You can specify a different input file here
  const inputFile = 'amenities-template.json';
  addNewAmenitiesFromFile(inputFile);
}

export { addNewAmenitiesFromFile }; 