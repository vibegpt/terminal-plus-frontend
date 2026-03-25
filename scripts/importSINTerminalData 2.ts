#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';

interface SINAmenity {
  name: string;
  slug?: string;
  terminal_code: string;
  category: string;
  amenity_type: string;
  description: string;
  location_description: string;
  opening_hours: any;
  vibe_tags: string[];
  status: string;
  image_url: string;
  airport_code: string;
  airport_name: string;
  city: string;
  country: string;
  area: string;
  id?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  price_tier: string;
  available_in_transit?: boolean;
}

interface ProcessedAmenity extends SINAmenity {
  id: string;
  collection_id?: string;
  priority: number;
  is_featured: boolean;
  rating?: number;
  website_url?: string;
  logo_url?: string;
  booking_required?: boolean;
}

class SINTerminalDataImporter {
  private terminalFiles = [
    'sin_t1.json',
    'sin_t2.json', 
    'sin_t3.json',
    'sin_t4.json',
    'sin_jewel.json'
  ];
  
  private dataDir = path.join(__dirname, '../src/data');
  private outputDir = path.join(__dirname, '../output');
  
  private allAmenities: ProcessedAmenity[] = [];
  private uniqueIds = new Set<string>();
  
  constructor() {
    this.ensureOutputDir();
  }
  
  private ensureOutputDir(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }
  
  private generateUniqueId(amenity: SINAmenity): string {
    const baseSlug = amenity.slug || 
      amenity.name.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    
    const terminalCode = amenity.terminal_code.toLowerCase();
    let id = `${terminalCode}-${baseSlug}`;
    let counter = 1;
    
    while (this.uniqueIds.has(id)) {
      id = `${terminalCode}-${baseSlug}-${counter}`;
      counter++;
    }
    
    this.uniqueIds.add(id);
    return id;
  }
  
  private assignCollectionId(amenity: SINAmenity): string {
    // Map categories to collection IDs
    const categoryCollections: { [key: string]: string } = {
      'Food & Beverage': 'quick-bites',
      'Dining': 'quick-bites',
      'Restaurant': 'quick-bites',
      'Café': 'coffee-chill',
      'Coffee': 'coffee-chill',
      'Bar': 'bars',
      'Lounge': 'lounge-life',
      'Shopping': 'duty-free',
      'Retail': 'duty-free',
      'Wellness': 'wellness',
      'Spa': 'wellness',
      'Entertainment': 'entertainment',
      'Attraction': 'explore',
      'Observation': 'explore',
      'Transport': 'transport',
      'Quiet Space': 'comfort-spaces',
      'Prayer Room': 'comfort-spaces'
    };
    
    return categoryCollections[amenity.category] || 'explore';
  }
  
  private calculatePriority(amenity: SINAmenity): number {
    let priority = 1;
    
    // Higher priority for premium amenities
    if (amenity.price_tier === '$$$$') priority += 3;
    else if (amenity.price_tier === '$$$') priority += 2;
    else if (amenity.price_tier === '$$') priority += 1;
    
    // Higher priority for featured categories
    if (['Food & Beverage', 'Dining', 'Lounge'].includes(amenity.category)) {
      priority += 2;
    }
    
    // Higher priority for 24/7 availability
    if (amenity.opening_hours && 
        Object.values(amenity.opening_hours).some((hours: any) => 
          hours === '24/7' || hours.includes('24/7'))) {
      priority += 1;
    }
    
    return Math.min(priority, 5); // Cap at 5
  }
  
  private processAmenity(amenity: SINAmenity, terminalCode: string): ProcessedAmenity {
    const processed: ProcessedAmenity = {
      ...amenity,
      id: this.generateUniqueId(amenity),
      collection_id: this.assignCollectionId(amenity),
      priority: this.calculatePriority(amenity),
      is_featured: amenity.price_tier === '$$$$' || 
                   ['Lounge', 'Spa', 'Attraction'].includes(amenity.category),
      rating: 4.0 + Math.random() * 1.0, // Random rating between 4.0-5.0
      website_url: '',
      logo_url: '',
      booking_required: ['Spa', 'Lounge'].includes(amenity.category),
      available_in_transit: amenity.available_in_transit || false
    };
    
    return processed;
  }
  
  private loadTerminalData(): void {
    console.log('🔄 Loading SIN terminal data...');
    
    for (const fileName of this.terminalFiles) {
      const filePath = path.join(this.dataDir, fileName);
      
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  File not found: ${fileName}`);
        continue;
      }
      
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const terminalData = JSON.parse(fileContent);
        
        if (Array.isArray(terminalData)) {
          terminalData.forEach(amenity => {
            if (amenity.terminal_code && amenity.airport_code === 'SIN') {
              const processed = this.processAmenity(amenity, amenity.terminal_code);
              this.allAmenities.push(processed);
            }
          });
        }
        
        console.log(`✅ Loaded ${fileName}: ${Array.isArray(terminalData) ? terminalData.length : 0} amenities`);
      } catch (error) {
        console.error(`❌ Error loading ${fileName}:`, error);
      }
    }
    
    console.log(`📊 Total amenities processed: ${this.allAmenities.length}`);
  }
  
  private generateSQL(): string {
    console.log('🔧 Generating PostgreSQL SQL...');
    
    let sql = `-- SIN Terminal Amenities Import SQL
-- Generated on: ${new Date().toISOString()}
-- Total amenities: ${this.allAmenities.length}

-- NOTE: This is a minimal schema - please adjust column names to match your actual table
-- Common basic columns: id, name, description, terminal_code, airport_code

-- Clear existing SIN amenities (optional - uncomment if needed)
-- DELETE FROM amenity_detail WHERE airport_code = 'SIN';

-- Insert amenity_detail records
INSERT INTO amenity_detail (
  id,
  name,
  description,
  terminal_code,
  airport_code,
  status,
  created_at,
  updated_at
) VALUES\n`;
    
    const values = this.allAmenities.map(amenity => {
      const vibeTags = Array.isArray(amenity.vibe_tags) 
        ? amenity.vibe_tags.join(',')
        : (amenity.vibe_tags as any)?.toString() || '';
      
      let coordinates = 'NULL';
      if (amenity.coordinates && 
          typeof amenity.coordinates.lat === 'number' && 
          typeof amenity.coordinates.lng === 'number' &&
          !isNaN(amenity.coordinates.lat) && 
          !isNaN(amenity.coordinates.lng) &&
          amenity.coordinates.lat !== 0 && 
          amenity.coordinates.lng !== 0) {
        coordinates = `ST_GeomFromText('POINT(${amenity.coordinates.lng} ${amenity.coordinates.lat})')`;
      }
      
      return `(
  gen_random_uuid(),
  '${(amenity.name || '').replace(/'/g, "''")}',
  '${(amenity.description || '').replace(/'/g, "''")}',
  '${amenity.terminal_code}',
  '${amenity.airport_code}',
  '${amenity.status}',
  NOW(),
  NOW()
)`;
    });
    
    sql += values.join(',\n') + ';\n\n';
    
    // Add collection_amenities inserts
    sql += `-- Insert collection_amenities records
INSERT INTO collection_amenities (
  collection_id,
  amenity_detail_id,
  priority,
  is_featured,
  created_at
) VALUES\n`;
    
    const collectionValues = this.allAmenities.map(amenity => {
      return `(
  (SELECT id FROM collections WHERE collection_id = '${amenity.collection_id}'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = '${amenity.id}'),
  ${amenity.priority},
  ${amenity.is_featured},
  NOW()
)`;
    });
    
    sql += collectionValues.join(',\n') + ';\n';
    
    return sql;
  }
  
  private generateCSV(): string {
    console.log('📄 Generating CSV backup...');
    
    const headers = [
      'id',
      'name',
      'amenity_slug',
      'terminal_code',
      'airport_code',
      'category',
      'amenity_type',
      'description',
      'location_description',
      'opening_hours',
      'vibe_tags',
      'price_level',
      'collection_id',
      'priority',
      'is_featured',
      'rating',
      'website_url',
      'logo_url',
      'booking_required',
      'available_in_transit',
      'status'
    ];
    
    const csvRows = [headers.join(',')];
    
    this.allAmenities.forEach(amenity => {
      const row = headers.map(header => {
        let value = amenity[header as keyof ProcessedAmenity];
        
        if (header === 'opening_hours') {
          value = JSON.stringify(value);
        } else if (header === 'vibe_tags' && Array.isArray(value)) {
          value = value.join(';');
        }
        
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        
        return value || '';
      });
      
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }
  
  private saveOutputs(): void {
    const sqlContent = this.generateSQL();
    const csvContent = this.generateCSV();
    
    const sqlPath = path.join(this.outputDir, 'sin_terminals_import.sql');
    const csvPath = path.join(this.outputDir, 'sin_terminals_backup.csv');
    
    fs.writeFileSync(sqlPath, sqlContent);
    fs.writeFileSync(csvPath, csvContent);
    
    console.log(`💾 SQL file saved: ${sqlPath}`);
    console.log(`💾 CSV backup saved: ${csvPath}`);
  }
  
  private generateSummary(): void {
    console.log('\n📋 IMPORT SUMMARY');
    console.log('================');
    console.log(`Total amenities processed: ${this.allAmenities.length}`);
    
    const terminalCounts: { [key: string]: number } = {};
    const categoryCounts: { [key: string]: number } = {};
    const collectionCounts: { [key: string]: number } = {};
    
    this.allAmenities.forEach(amenity => {
      terminalCounts[amenity.terminal_code] = (terminalCounts[amenity.terminal_code] || 0) + 1;
      categoryCounts[amenity.category] = (categoryCounts[amenity.category] || 0) + 1;
      collectionCounts[amenity.collection_id!] = (collectionCounts[amenity.collection_id!] || 0) + 1;
    });
    
    console.log('\nBy Terminal:');
    Object.entries(terminalCounts).forEach(([terminal, count]) => {
      console.log(`  ${terminal}: ${count} amenities`);
    });
    
    console.log('\nBy Category:');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} amenities`);
    });
    
    console.log('\nBy Collection:');
    Object.entries(collectionCounts).forEach(([collection, count]) => {
      console.log(`  ${collection}: ${count} amenities`);
    });
  }
  
  public run(): void {
    console.log('🚀 Starting SIN Terminal Data Import...\n');
    
    try {
      this.loadTerminalData();
      this.saveOutputs();
      this.generateSummary();
      
      console.log('\n✅ Import completed successfully!');
      console.log(`📁 Check the 'output' directory for generated files`);
      
    } catch (error) {
      console.error('❌ Import failed:', error);
      process.exit(1);
    }
  }
}

// Run the importer
if (require.main === module) {
  const importer = new SINTerminalDataImporter();
  importer.run();
}

export default SINTerminalDataImporter;
