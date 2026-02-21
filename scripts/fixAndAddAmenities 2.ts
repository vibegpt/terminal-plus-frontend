import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';

interface Amenity {
  name: string;
  terminal_code: string;
  category?: string;
  amenity_type?: string;
  description?: string;
  location_description?: string;
  opening_hours?: any;
  vibe_tags?: string[];
  status?: string;
  image_url?: string;
  airport_code: string;
  coordinates?: {
    lat?: number;
    lng?: number;
  };
  price_tier?: string;
  slug?: string;
  available_in_transit?: boolean;
}

class AmenityManager {
  private dataDir: string;

  constructor() {
    this.dataDir = path.join(__dirname, '../src/data');
  }

  async loadCSV(filePath: string): Promise<Amenity[]> {
    return new Promise((resolve, reject) => {
      const results: Amenity[] = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data: any) => {
          const amenity: Amenity = {
            name: data.name || data.Name || data.amenity_slug || '',
            terminal_code: data.terminal_code || data.terminalCode || data['terminal_code'] || '',
            category: data.category || data.Category || '',
            amenity_type: data.amenity_type || data.amenityType || data['amenity_type'] || '',
            description: data.description || data.Description || '',
            location_description: data.location_description || data.locationDescription || data['location_description'] || '',
            opening_hours: data.opening_hours && data.opening_hours.trim() ? (() => {
              try {
                return JSON.parse(data.opening_hours);
              } catch {
                return {};
              }
            })() : {},
            vibe_tags: data.vibe_tags ? (data.vibe_tags.startsWith('{') ? data.vibe_tags.replace(/[{}]/g, '').split(',') : data.vibe_tags.split(';')) : [],
            status: data.status || 'active',
            image_url: data.image_url || data.imageUrl || data['image_url'] || data.logo_url || '',
            airport_code: data.airport_code || data.airportCode || data['airport_code'] || '',
            coordinates: {
              lat: data.lat ? parseFloat(data.lat) : undefined,
              lng: data.lng ? parseFloat(data.lng) : undefined
            },
            price_tier: data.price_tier || data.priceTier || data['price_tier'] || data.price_level || '',
            available_in_transit: data.available_in_tr === 'true'
          };
          results.push(amenity);
        })
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  loadExistingAmenities(fileName: string): Amenity[] {
    const filePath = path.join(this.dataDir, fileName);
    if (fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return Array.isArray(data) ? data : [];
      } catch (error: any) {
        console.warn(`Error reading ${fileName}:`, error.message);
        return [];
      }
    }
    return [];
  }

  saveAmenities(amenities: Amenity[], fileName: string): void {
    const filePath = path.join(this.dataDir, fileName);
    fs.writeFileSync(filePath, JSON.stringify(amenities, null, 2));
    console.log(`✅ Saved ${amenities.length} amenities to ${fileName}`);
  }

  fixMemoryOfLivedSpace(amenities: Amenity[]): Amenity[] {
    return amenities.map(amenity => {
      if (amenity.name === 'memory-of-lived-space') {
        return {
          ...amenity,
          terminal_code: 'SIN-T3',
          airport_code: 'SIN',
          available_in_transit: true
        };
      }
      return amenity;
    });
  }

  filterSingaporeAmenities(amenities: Amenity[]): Amenity[] {
    return amenities.filter(amenity => 
      amenity.airport_code === 'SIN' && 
      amenity.name !== 'memory-of-lived-space' // We'll handle this separately
    );
  }

  categorizeAmenity(amenity: Amenity): Amenity {
    // Add proper categories based on name patterns
    const name = amenity.name.toLowerCase();
    
    if (name.includes('lounge') || name.includes('plaza-premium')) {
      amenity.category = 'Services';
      amenity.amenity_type = 'Lounge';
    } else if (name.includes('caffe') || name.includes('coffee') || name.includes('nero')) {
      amenity.category = 'Food & Beverage';
      amenity.amenity_type = 'Café';
    } else if (name.includes('duty-free') || name.includes('lotte')) {
      amenity.category = 'Shopping';
      amenity.amenity_type = 'Duty-Free Store';
    } else if (name.includes('guardian') || name.includes('health')) {
      amenity.category = 'Shopping';
      amenity.amenity_type = 'Pharmacy';
    } else if (name.includes('whsmith') || name.includes('books')) {
      amenity.category = 'Shopping';
      amenity.amenity_type = 'Books & Convenience';
    } else if (name.includes('travelex') || name.includes('money')) {
      amenity.category = 'Services';
      amenity.amenity_type = 'Currency Exchange';
    } else if (name.includes('heritage') || name.includes('immersive') || name.includes('wall')) {
      amenity.category = 'Attractions';
      amenity.amenity_type = 'Cultural Area';
    } else if (name.includes('mother') || name.includes('child') || name.includes('saga') || name.includes('spirit') || name.includes('steel')) {
      amenity.category = 'Attraction';
      amenity.amenity_type = 'Art Installation';
    } else if (name.includes('popcorn') || name.includes('garrett')) {
      amenity.category = 'Shopping';
      amenity.amenity_type = 'Snacks & Confectionery';
    } else if (name.includes('fragrance') || name.includes('bak-kwa')) {
      amenity.category = 'Shopping';
      amenity.amenity_type = 'Food & Gifts';
    } else if (name.includes('twg') || name.includes('tea')) {
      amenity.category = 'Food & Beverage';
      amenity.amenity_type = 'Tea Boutique';
    } else if (name.includes('irvins') || name.includes('salted-egg')) {
      amenity.category = 'Food & Beverage';
      amenity.amenity_type = 'Snacks';
    } else if (name.includes('lego')) {
      amenity.category = 'Shopping';
      amenity.amenity_type = 'Toys & Games';
    } else if (name.includes('victorias-secret')) {
      amenity.category = 'Shopping';
      amenity.amenity_type = 'Fashion & Beauty';
    } else if (name.includes('watches') || name.includes('switzerland')) {
      amenity.category = 'Shopping';
      amenity.amenity_type = 'Watches & Jewelry';
    } else if (name.includes('uob')) {
      amenity.category = 'Services';
      amenity.amenity_type = 'Banking';
    } else if (name.includes('kaboom') || name.includes('istudio')) {
      amenity.category = 'Shopping';
      amenity.amenity_type = 'Electronics';
    } else if (name.includes('kering') || name.includes('eyewear')) {
      amenity.category = 'Shopping';
      amenity.amenity_type = 'Eyewear';
    } else if (name.includes('eu-yan-sang')) {
      amenity.category = 'Shopping';
      amenity.amenity_type = 'Traditional Medicine';
    } else {
      // Default categorization for fashion brands
      if (name.includes('gucci') || name.includes('hermes') || name.includes('louis-vuitton') || 
          name.includes('michael-kors') || name.includes('montblanc') || name.includes('swarovski') ||
          name.includes('tiffany') || name.includes('tory-burch') || name.includes('longchamp') ||
          name.includes('furla') || name.includes('coach') || name.includes('charles-keith') ||
          name.includes('lacoste') || name.includes('tommy-hilfiger') || name.includes('timberland') ||
          name.includes('uniqlo') || name.includes('fila') || name.includes('giordano')) {
        amenity.category = 'Shopping';
        amenity.amenity_type = 'Fashion & Accessories';
      } else {
        amenity.category = 'Shopping';
        amenity.amenity_type = 'Retail';
      }
    }

    return amenity;
  }

  groupAmenitiesByTerminal(amenities: Amenity[]): { [key: string]: Amenity[] } {
    const grouped: { [key: string]: Amenity[] } = {};
    
    amenities.forEach(amenity => {
      const terminal = amenity.terminal_code;
      if (!grouped[terminal]) {
        grouped[terminal] = [];
      }
      grouped[terminal].push(amenity);
    });
    
    return grouped;
  }

  async processAmenities(csvFilePath: string): Promise<void> {
    console.log('🔄 Loading CSV amenities...');
    const csvAmenities = await this.loadCSV(csvFilePath);
    
    console.log('🔧 Fixing Memory of Lived Space location...');
    const fixedAmenities = this.fixMemoryOfLivedSpace(csvAmenities);
    
    console.log('🇸🇬 Filtering Singapore amenities...');
    const singaporeAmenities = this.filterSingaporeAmenities(fixedAmenities);
    
    console.log('🏷️ Categorizing amenities...');
    const categorizedAmenities = singaporeAmenities.map(amenity => this.categorizeAmenity(amenity));
    
    console.log('📁 Grouping by terminal...');
    const groupedAmenities = this.groupAmenitiesByTerminal(categorizedAmenities);
    
    // Add to existing JSON files
    for (const [terminal, amenities] of Object.entries(groupedAmenities)) {
      const fileName = this.getFileNameForTerminal(terminal);
      if (fileName) {
        const existingAmenities = this.loadExistingAmenities(fileName);
        const combinedAmenities = [...existingAmenities, ...amenities];
        this.saveAmenities(combinedAmenities, fileName);
      }
    }
    
    console.log('✅ Processing complete!');
    console.log(`📊 Added ${categorizedAmenities.length} Singapore amenities across ${Object.keys(groupedAmenities).length} terminals`);
  }

  getFileNameForTerminal(terminal: string): string | null {
    const mapping: { [key: string]: string } = {
      'SIN-T1': 'sin_t1.json',
      'SIN-T2': 'sin_t2.json',
      'SIN-T3': 'sin_t3.json',
      'SIN-T4': 'sin_t4.json',
      'SIN-JEWEL': 'sin_jewel.json'
    };
    return mapping[terminal] || null;
  }
}

async function main() {
  const manager = new AmenityManager();
  
  const csvFilePath = process.argv[2] || 'amenity_detail_rows-9.csv';
  
  if (!fs.existsSync(csvFilePath)) {
    console.error(`CSV file not found: ${csvFilePath}`);
    process.exit(1);
  }

  try {
    await manager.processAmenities(csvFilePath);
  } catch (error) {
    console.error('Error processing amenities:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { AmenityManager }; 