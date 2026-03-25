import * as fs from 'fs';

interface Amenity {
  amenity_slug: string;
  name: string;
  terminal_code: string;
}

class ExistingAmenityChecker {
  private existingAmenities: Amenity[] = [];
  private newAmenities: Amenity[] = [];

  public loadExistingAmenities(): void {
    // This would typically connect to Supabase
    // For now, let's create a sample of what might exist
    console.log('🔍 Checking for existing amenities...');
    
    // You would need to query your Supabase table here
    // Example: SELECT amenity_slug, name, terminal_code FROM amenity_detail
    console.log('📋 Please run this SQL query in your Supabase SQL editor:');
    console.log('');
    console.log('SELECT amenity_slug, name, terminal_code FROM amenity_detail;');
    console.log('');
    console.log('Then save the results to a file called "existing-amenities.csv"');
  }

  public loadNewAmenities(): void {
    const csvContent = fs.readFileSync('supabase-amenities.csv', 'utf-8');
    const lines = csvContent.split('\n');
    
    for (let i = 1; i < lines.length; i++) { // Skip header
      const line = lines[i];
      if (!line.trim()) continue;
      
      const columns = line.split(',');
      if (columns.length >= 14) {
        const amenity: Amenity = {
          amenity_slug: columns[2],
          name: columns[13].replace(/"/g, ''),
          terminal_code: columns[11]
        };
        this.newAmenities.push(amenity);
      }
    }
  }

  public findConflicts(): void {
    console.log('🔍 Checking for potential conflicts...');
    console.log('');
    console.log('📊 New amenities to be imported:');
    this.newAmenities.forEach((amenity, index) => {
      console.log(`${index + 1}. ${amenity.amenity_slug} (${amenity.name}) - ${amenity.terminal_code}`);
    });
    
    console.log('');
    console.log('⚠️  Potential solutions:');
    console.log('');
    console.log('1. **Delete existing amenities** from Supabase table first');
    console.log('2. **Update existing amenities** instead of inserting new ones');
    console.log('3. **Modify the CSV** to use different amenity_slug values');
    console.log('');
    console.log('💡 Recommended approach:');
    console.log('   - Export your existing amenities from Supabase');
    console.log('   - Compare with the new ones');
    console.log('   - Decide whether to replace or merge');
  }
}

async function main() {
  const checker = new ExistingAmenityChecker();
  checker.loadExistingAmenities();
  checker.loadNewAmenities();
  checker.findConflicts();
}

main().catch(console.error); 