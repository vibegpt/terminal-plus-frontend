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
}

interface ComparisonResult {
  csvAmenities: Amenity[];
  existingAmenities: Amenity[];
  missingFromDatabase: Amenity[];
  duplicatesInCSV: Amenity[];
  summary: {
    totalCSV: number;
    totalExisting: number;
    missing: number;
    duplicates: number;
  };
}

class AmenityComparator {
  private csvAmenities: Amenity[] = [];
  private existingAmenities: Amenity[] = [];

  async loadCSV(filePath: string): Promise<Amenity[]> {
    return new Promise((resolve, reject) => {
      const results: Amenity[] = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data: any) => {
          // Handle different CSV formats including Supabase exports
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
            price_tier: data.price_tier || data.priceTier || data['price_tier'] || data.price_level || ''
          };
          results.push(amenity);
        })
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  loadExistingAmenities(): Amenity[] {
    const dataDir = path.join(__dirname, '../src/data');
    const amenityFiles = [
      'amenities.json',
      'sin_t1.json',
      'sin_t2.json', 
      'sin_t3.json',
      'sin_t4.json',
      'syd_t1.json',
      'syd_t2.json',
      'lhr_t2.json',
      'lhr_t3.json',
      'lhr_t4.json',
      'lhr_t5.json',
      'sin_jewel.json'
    ];

    const allAmenities: Amenity[] = [];

    amenityFiles.forEach(file => {
      const filePath = path.join(dataDir, file);
      if (fs.existsSync(filePath)) {
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          if (Array.isArray(data)) {
            allAmenities.push(...data);
          }
        } catch (error: any) {
          console.warn(`Error reading ${file}:`, error.message);
        }
      }
    });

    return allAmenities;
  }

  normalizeAmenityName(name: string): string {
    return name.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  findMissingAmenities(csvAmenities: Amenity[], existingAmenities: Amenity[]): Amenity[] {
    const existingNames = new Set(
      existingAmenities.map(a => this.normalizeAmenityName(a.name))
    );

    return csvAmenities.filter(csvAmenity => {
      const normalizedName = this.normalizeAmenityName(csvAmenity.name);
      return !existingNames.has(normalizedName);
    });
  }

  findDuplicates(amenities: Amenity[]): Amenity[] {
    const seen = new Set<string>();
    const duplicates: Amenity[] = [];

    amenities.forEach(amenity => {
      const normalizedName = this.normalizeAmenityName(amenity.name);
      if (seen.has(normalizedName)) {
        duplicates.push(amenity);
      } else {
        seen.add(normalizedName);
      }
    });

    return duplicates;
  }

  async compareAmenities(csvFilePath: string): Promise<ComparisonResult> {
    console.log('Loading CSV amenities...');
    this.csvAmenities = await this.loadCSV(csvFilePath);
    
    console.log('Loading existing amenities...');
    this.existingAmenities = this.loadExistingAmenities();

    console.log('Finding missing amenities...');
    const missingAmenities = this.findMissingAmenities(this.csvAmenities, this.existingAmenities);
    
    console.log('Finding duplicates...');
    const duplicates = this.findDuplicates(this.csvAmenities);

    return {
      csvAmenities: this.csvAmenities,
      existingAmenities: this.existingAmenities,
      missingFromDatabase: missingAmenities,
      duplicatesInCSV: duplicates,
      summary: {
        totalCSV: this.csvAmenities.length,
        totalExisting: this.existingAmenities.length,
        missing: missingAmenities.length,
        duplicates: duplicates.length
      }
    };
  }

  generateReport(result: ComparisonResult): string {
    let report = '# Amenity Comparison Report\n\n';
    
    report += `## Summary\n`;
    report += `- CSV Amenities: ${result.summary.totalCSV}\n`;
    report += `- Existing Database Amenities: ${result.summary.totalExisting}\n`;
    report += `- Missing from Database: ${result.summary.missing}\n`;
    report += `- Duplicates in CSV: ${result.summary.duplicates}\n\n`;

    if (result.missingFromDatabase.length > 0) {
      report += `## Missing Amenities (${result.missingFromDatabase.length})\n\n`;
      result.missingFromDatabase.forEach((amenity, index) => {
        report += `${index + 1}. **${amenity.name}**\n`;
        report += `   - Terminal: ${amenity.terminal_code}\n`;
        report += `   - Category: ${amenity.category}\n`;
        report += `   - Type: ${amenity.amenity_type}\n`;
        report += `   - Airport: ${amenity.airport_code}\n\n`;
      });
    }

    if (result.duplicatesInCSV.length > 0) {
      report += `## Duplicate Amenities in CSV (${result.duplicatesInCSV.length})\n\n`;
      result.duplicatesInCSV.forEach((amenity, index) => {
        report += `${index + 1}. **${amenity.name}** (${amenity.terminal_code})\n`;
      });
      report += '\n';
    }

    return report;
  }

  exportMissingToCSV(missingAmenities: Amenity[], outputPath: string): void {
    const csvHeader = 'name,terminal_code,category,amenity_type,description,location_description,opening_hours,vibe_tags,status,image_url,airport_code,lat,lng,price_tier\n';
    
    const csvContent = missingAmenities.map(amenity => {
      const vibeTags = amenity.vibe_tags ? amenity.vibe_tags.join(';') : '';
      const openingHours = amenity.opening_hours ? JSON.stringify(amenity.opening_hours) : '{}';
      const lat = amenity.coordinates?.lat || '';
      const lng = amenity.coordinates?.lng || '';
      
      return `"${amenity.name}","${amenity.terminal_code}","${amenity.category || ''}","${amenity.amenity_type || ''}","${amenity.description || ''}","${amenity.location_description || ''}","${openingHours}","${vibeTags}","${amenity.status || 'active'}","${amenity.image_url || ''}","${amenity.airport_code}","${lat}","${lng}","${amenity.price_tier || ''}"`;
    }).join('\n');

    fs.writeFileSync(outputPath, csvHeader + csvContent);
    console.log(`Missing amenities exported to: ${outputPath}`);
  }
}

async function main() {
  const comparator = new AmenityComparator();
  
  // You can specify your CSV file path here
  const csvFilePath = process.argv[2] || path.join(__dirname, 'amenities.csv');
  
  if (!fs.existsSync(csvFilePath)) {
    console.error(`CSV file not found: ${csvFilePath}`);
    console.log('Usage: npm run compare <path-to-your-csv>');
    process.exit(1);
  }

  try {
    console.log(`Comparing amenities from: ${csvFilePath}`);
    const result = await comparator.compareAmenities(csvFilePath);
    
    // Generate and save report
    const report = comparator.generateReport(result);
    const reportPath = path.join(__dirname, 'comparison-report.md');
    fs.writeFileSync(reportPath, report);
    
    // Export missing amenities to CSV
    const missingCsvPath = path.join(__dirname, 'missing-amenities.csv');
    comparator.exportMissingToCSV(result.missingFromDatabase, missingCsvPath);
    
    console.log('\n' + report);
    console.log(`\nReport saved to: ${reportPath}`);
    console.log(`Missing amenities exported to: ${missingCsvPath}`);
    
  } catch (error) {
    console.error('Error comparing amenities:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { AmenityComparator, ComparisonResult }; 