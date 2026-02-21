import * as fs from 'fs';
import * as path from 'path';

interface Amenity {
  id: number;
  created_at: string;
  amenity_slug: string;
  description: string;
  website_url: string;
  logo_url: string;
  vibe_tags: string[];
  booking_required: boolean;
  available_in_tr: boolean;
  price_level: string;
  opening_hours: string;
  terminal_code: string;
  airport_code: string;
  name: string;
}

class SupabaseCSVGenerator {
  private amenities: Amenity[] = [];
  private idCounter = 1;

  private generateSlug(name: string, terminal: string): string {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');
    
    const terminalSuffix = terminal.toLowerCase().replace('sin-', '');
    return `${baseSlug}-${terminalSuffix}`;
  }

  private parseOpeningHours(hours: string): string {
    if (!hours || hours === '24 hours') {
      return '{"Monday-Sunday": "24:00"}';
    }
    if (hours === '6:00 AM - 11:00 PM') {
      return '{"Monday-Sunday": "06:00-23:00"}';
    }
    return '{"Monday-Sunday": "06:00-23:00"}';
  }

  private categorizeAmenity(name: string): { category: string; amenity_type: string } {
    const lowerName = name.toLowerCase();
    
    // Attractions
    if (lowerName.includes('garden') || lowerName.includes('park') || 
        lowerName.includes('maze') || lowerName.includes('slide') || 
        lowerName.includes('studio') || lowerName.includes('tree') ||
        lowerName.includes('vortex') || lowerName.includes('nets') ||
        lowerName.includes('bowls') || lowerName.includes('pond')) {
      return { category: 'Attraction', amenity_type: 'Entertainment' };
    }
    
    // Food & Beverage
    if (lowerName.includes('restaurant') || lowerName.includes('café') || 
        lowerName.includes('tea') || lowerName.includes('toast') ||
        lowerName.includes('lab') || lowerName.includes('dynasty') ||
        lowerName.includes('bak kut teh') || lowerName.includes('sushi') ||
        lowerName.includes('kaya') || lowerName.includes('jerky') ||
        lowerName.includes('curry') || lowerName.includes('snacks')) {
      return { category: 'Food & Beverage', amenity_type: 'Restaurant' };
    }
    
    // Hotels
    if (lowerName.includes('hotel') || lowerName.includes('aerotel') || 
        lowerName.includes('yotelair') || lowerName.includes('crowne plaza')) {
      return { category: 'Services', amenity_type: 'Hotel' };
    }
    
    // Lounges
    if (lowerName.includes('lounge')) {
      return { category: 'Services', amenity_type: 'Lounge' };
    }
    
    // Services
    if (lowerName.includes('exchange') || lowerName.includes('telecommunications') ||
        lowerName.includes('tax refund') || lowerName.includes('spa') ||
        lowerName.includes('kiosk')) {
      return { category: 'Services', amenity_type: 'Service' };
    }
    
    // Shopping
    if (lowerName.includes('duty free') || lowerName.includes('uniqlo') ||
        lowerName.includes('zara') || lowerName.includes('muji') ||
        lowerName.includes('kinokuniya') || lowerName.includes('hands') ||
        lowerName.includes('keith') || lowerName.includes('twg')) {
      return { category: 'Shopping', amenity_type: 'Retail' };
    }
    
    return { category: 'Other', amenity_type: 'Other' };
  }

  private generateVibeTags(name: string): string[] {
    const lowerName = name.toLowerCase();
    const tags: string[] = [];
    
    if (lowerName.includes('garden') || lowerName.includes('park')) {
      tags.push('Chill', 'Explore');
    }
    if (lowerName.includes('maze') || lowerName.includes('slide') || lowerName.includes('nets')) {
      tags.push('Explore', 'Fun');
    }
    if (lowerName.includes('restaurant') || lowerName.includes('café') || lowerName.includes('tea')) {
      tags.push('Refuel');
    }
    if (lowerName.includes('lounge')) {
      tags.push('Chill', 'Comfort', 'Work');
    }
    if (lowerName.includes('hotel')) {
      tags.push('Chill', 'Comfort');
    }
    if (lowerName.includes('duty free') || lowerName.includes('shopping')) {
      tags.push('Shop');
    }
    if (lowerName.includes('spa')) {
      tags.push('Chill', 'Comfort');
    }
    
    return tags.length > 0 ? tags : ['Explore'];
  }

  public addAmenity(data: {
    name: string;
    description: string;
    terminal_code: string;
    opening_hours: string;
    airport_code: string;
  }): void {
    const { category, amenity_type } = this.categorizeAmenity(data.name);
    const vibeTags = this.generateVibeTags(data.name);
    
    const amenity: Amenity = {
      id: this.idCounter++,
      created_at: new Date().toISOString(),
      amenity_slug: this.generateSlug(data.name, data.terminal_code),
      description: data.description,
      website_url: '',
      logo_url: '',
      vibe_tags: vibeTags,
      booking_required: false,
      available_in_tr: true,
      price_level: '$$',
      opening_hours: this.parseOpeningHours(data.opening_hours),
      terminal_code: data.terminal_code,
      airport_code: data.airport_code,
      name: data.name
    };
    
    this.amenities.push(amenity);
  }

  public generateCSV(): string {
    const headers = [
      'id', 'created_at', 'amenity_slug', 'description', 'website_url', 
      'logo_url', 'vibe_tags', 'booking_required', 'available_in_tr', 
      'price_level', 'opening_hours', 'terminal_code', 'airport_code', 'name'
    ];
    
    const csvRows = [headers.join(',')];
    
    for (const amenity of this.amenities) {
      const row = [
        amenity.id,
        amenity.created_at,
        amenity.amenity_slug,
        `"${amenity.description}"`,
        amenity.website_url,
        amenity.logo_url,
        `"{${amenity.vibe_tags.join(',')}}"`,
        amenity.booking_required,
        amenity.available_in_tr,
        amenity.price_level,
        amenity.opening_hours,
        amenity.terminal_code,
        amenity.airport_code,
        `"${amenity.name}"`
      ];
      csvRows.push(row.join(','));
    }
    
    return csvRows.join('\n');
  }

  public saveToFile(filename: string): void {
    const csv = this.generateCSV();
    fs.writeFileSync(filename, csv);
    console.log(`✅ CSV saved to: ${filename}`);
    console.log(`📊 Total amenities: ${this.amenities.length}`);
  }
}

// Main execution
async function main() {
  const generator = new SupabaseCSVGenerator();
  
  // Add all the amenities from the CSV data
  const amenityData = [
    // Jewel amenities
    { name: "Canopy Park", description: "Indoor park with nets, mazes and slides", terminal_code: "SIN-JEWEL", opening_hours: "24 hours", airport_code: "SIN" },
    { name: "Foggy Bowls", description: "Mist-filled play areas for children", terminal_code: "SIN-JEWEL", opening_hours: "24 hours", airport_code: "SIN" },
    { name: "Hedge Maze", description: "Singapore's largest hedge maze", terminal_code: "SIN-JEWEL", opening_hours: "24 hours", airport_code: "SIN" },
    { name: "Manulife Sky Nets", description: "Walking and bouncing nets suspended in the air", terminal_code: "SIN-JEWEL", opening_hours: "24 hours", airport_code: "SIN" },
    { name: "Mirror Maze", description: "Immersive mirror maze experience", terminal_code: "SIN-JEWEL", opening_hours: "24 hours", airport_code: "SIN" },
    { name: "Rain Vortex", description: "The world's tallest indoor waterfall", terminal_code: "SIN-JEWEL", opening_hours: "24 hours", airport_code: "SIN" },
    { name: "Shiseido Forest Valley", description: "Lush indoor forest with walking trails", terminal_code: "SIN-JEWEL", opening_hours: "24 hours", airport_code: "SIN" },
    { name: "Changi Experience Studio", description: "Interactive digital attraction about Changi Airport", terminal_code: "SIN-JEWEL", opening_hours: "24 hours", airport_code: "SIN" },
    { name: "Social Tree", description: "Interactive installation for photo sharing", terminal_code: "SIN-JEWEL", opening_hours: "24 hours", airport_code: "SIN" },
    { name: "Bengawan Solo", description: "Traditional Singaporean cakes and kueh", terminal_code: "SIN-JEWEL", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Tiger Street Lab", description: "Craft beer and local fare", terminal_code: "SIN-JEWEL", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Din Tai Fung", description: "Renowned Taiwanese restaurant famous for xiaolongbao", terminal_code: "SIN-JEWEL", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Koi Thé", description: "Premium Taiwanese bubble tea", terminal_code: "SIN-JEWEL", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Song Fa Bak Kut Teh", description: "Award-winning pork rib soup", terminal_code: "SIN-JEWEL", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Travelex", description: "Global foreign exchange services", terminal_code: "SIN-JEWEL", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "UOB Currency Exchange", description: "Competitive rates for currency exchange", terminal_code: "SIN-JEWEL", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Telecommunications Kiosk", description: "SIM cards and mobile services", terminal_code: "SIN-JEWEL", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "TRS Tax Refund", description: "Tourist refund scheme counter", terminal_code: "SIN-JEWEL", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Spa Express", description: "Quick massage and spa treatments", terminal_code: "SIN-JEWEL", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Kinokuniya", description: "Comprehensive Japanese bookstore", terminal_code: "SIN-JEWEL", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Zara", description: "Spanish fast fashion retailer", terminal_code: "SIN-JEWEL", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Irvins Salted Egg", description: "Popular salted egg fish skin and chips", terminal_code: "SIN-JEWEL", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Eu Yan Sang", description: "Traditional Chinese medicine", terminal_code: "SIN-JEWEL", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Muji", description: "Minimalist Japanese home goods", terminal_code: "SIN-JEWEL", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },

    // Terminal 1 amenities
    { name: "Manulife Sky Nets", description: "Walking and bouncing nets suspended in the air", terminal_code: "SIN-T1", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Mirror Maze", description: "Immersive mirror maze experience", terminal_code: "SIN-T1", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Rain Vortex", description: "The world's tallest indoor waterfall", terminal_code: "SIN-T1", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Shiseido Forest Valley", description: "Lush indoor forest with walking trails", terminal_code: "SIN-T1", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Entertainment Deck", description: "Games and entertainment zone", terminal_code: "SIN-T1", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Butterfly Garden", description: "Tropical butterfly habitat with flowering plants", terminal_code: "SIN-T1", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Cactus Garden", description: "Outdoor roof garden with over 100 species of cacti", terminal_code: "SIN-T1", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Koi Pond", description: "Tranquil pond with Japanese koi fish", terminal_code: "SIN-T1", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Sunflower Garden", description: "Rooftop garden with viewing gallery", terminal_code: "SIN-T1", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Tiger Street Lab", description: "Craft beer and local fare", terminal_code: "SIN-T1", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Din Tai Fung", description: "Renowned Taiwanese restaurant famous for xiaolongbao", terminal_code: "SIN-T1", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Paradise Dynasty", description: "Known for signature colorful xiaolongbao", terminal_code: "SIN-T1", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Bee Cheng Hiang", description: "Famous for its barbecued pork jerky", terminal_code: "SIN-T1", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Koi Thé", description: "Premium Taiwanese bubble tea", terminal_code: "SIN-T1", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Sushi Tei", description: "Premium sushi and Japanese cuisine", terminal_code: "SIN-T1", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Song Fa Bak Kut Teh", description: "Award-winning pork rib soup", terminal_code: "SIN-T1", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Crowne Plaza Changi Airport", description: "Luxury hotel connected to Terminal 3", terminal_code: "SIN-T1", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Ambassador Transit Hotel", description: "In-terminal hotel for transiting passengers", terminal_code: "SIN-T1", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Singapore Airlines SilverKris Lounge", description: "Premium lounge for Singapore Airlines first and business class passengers", terminal_code: "SIN-T1", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "SATS Premier Lounge", description: "Comfortable lounge with shower facilities", terminal_code: "SIN-T1", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "dnata Lounge", description: "Modern lounge with extensive food options", terminal_code: "SIN-T1", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "UOB Currency Exchange", description: "Competitive rates for currency exchange", terminal_code: "SIN-T1", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Telecommunications Kiosk", description: "SIM cards and mobile services", terminal_code: "SIN-T1", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "TRS Tax Refund", description: "Tourist refund scheme counter", terminal_code: "SIN-T1", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Spa Express", description: "Quick massage and spa treatments", terminal_code: "SIN-T1", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Lotte Duty Free", description: "Korean duty-free retailer", terminal_code: "SIN-T1", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Uniqlo", description: "Japanese casual wear designer", terminal_code: "SIN-T1", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Zara", description: "Spanish fast fashion retailer", terminal_code: "SIN-T1", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Eu Yan Sang", description: "Traditional Chinese medicine", terminal_code: "SIN-T1", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Muji", description: "Minimalist Japanese home goods", terminal_code: "SIN-T1", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Tokyu Hands", description: "Japanese lifestyle store", terminal_code: "SIN-T1", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },

    // Terminal 2 amenities
    { name: "Canopy Park", description: "Indoor park with nets, mazes and slides", terminal_code: "SIN-T2", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Foggy Bowls", description: "Mist-filled play areas for children", terminal_code: "SIN-T2", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Mirror Maze", description: "Immersive mirror maze experience", terminal_code: "SIN-T2", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Rain Vortex", description: "The world's tallest indoor waterfall", terminal_code: "SIN-T2", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Entertainment Deck", description: "Games and entertainment zone", terminal_code: "SIN-T2", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Butterfly Garden", description: "Tropical butterfly habitat with flowering plants", terminal_code: "SIN-T2", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Cactus Garden", description: "Outdoor roof garden with over 100 species of cacti", terminal_code: "SIN-T2", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Koi Pond", description: "Tranquil pond with Japanese koi fish", terminal_code: "SIN-T2", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Sunflower Garden", description: "Rooftop garden with viewing gallery", terminal_code: "SIN-T2", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Bengawan Solo", description: "Traditional Singaporean cakes and kueh", terminal_code: "SIN-T2", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Tiger Street Lab", description: "Craft beer and local fare", terminal_code: "SIN-T2", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Din Tai Fung", description: "Renowned Taiwanese restaurant famous for xiaolongbao", terminal_code: "SIN-T2", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Paradise Dynasty", description: "Known for signature colorful xiaolongbao", terminal_code: "SIN-T2", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Koi Thé", description: "Premium Taiwanese bubble tea", terminal_code: "SIN-T2", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Old Chang Kee", description: "Local curry puffs and fried snacks", terminal_code: "SIN-T2", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Song Fa Bak Kut Teh", description: "Award-winning pork rib soup", terminal_code: "SIN-T2", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Aerotel Singapore", description: "Airport transit hotel with swimming pool", terminal_code: "SIN-T2", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "YOTELAIR Singapore Changi", description: "Modern capsule-style transit hotel inside the terminal", terminal_code: "SIN-T2", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Cathay Pacific Lounge", description: "Elegant lounge for Cathay Pacific passengers", terminal_code: "SIN-T2", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Singapore Airlines SilverKris Lounge", description: "Premium lounge for Singapore Airlines first and business class passengers", terminal_code: "SIN-T2", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "dnata Lounge", description: "Modern lounge with extensive food options", terminal_code: "SIN-T2", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Travelex", description: "Global foreign exchange services", terminal_code: "SIN-T2", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "UOB Currency Exchange", description: "Competitive rates for currency exchange", terminal_code: "SIN-T2", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Telecommunications Kiosk", description: "SIM cards and mobile services", terminal_code: "SIN-T2", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "TRS Tax Refund", description: "Tourist refund scheme counter", terminal_code: "SIN-T2", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Kinokuniya", description: "Comprehensive Japanese bookstore", terminal_code: "SIN-T2", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Uniqlo", description: "Japanese casual wear designer", terminal_code: "SIN-T2", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Zara", description: "Spanish fast fashion retailer", terminal_code: "SIN-T2", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Irvins Salted Egg", description: "Popular salted egg fish skin and chips", terminal_code: "SIN-T2", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Eu Yan Sang", description: "Traditional Chinese medicine", terminal_code: "SIN-T2", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Muji", description: "Minimalist Japanese home goods", terminal_code: "SIN-T2", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },

    // Terminal 3 amenities
    { name: "Canopy Park", description: "Indoor park with nets, mazes and slides", terminal_code: "SIN-T3", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Foggy Bowls", description: "Mist-filled play areas for children", terminal_code: "SIN-T3", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "The Slide@T3", description: "World's tallest slide in an airport", terminal_code: "SIN-T3", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Changi Experience Studio", description: "Interactive digital attraction about Changi Airport", terminal_code: "SIN-T3", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Entertainment Deck", description: "Games and entertainment zone", terminal_code: "SIN-T3", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Butterfly Garden", description: "Tropical butterfly habitat with flowering plants", terminal_code: "SIN-T3", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Cactus Garden", description: "Outdoor roof garden with over 100 species of cacti", terminal_code: "SIN-T3", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Koi Pond", description: "Tranquil pond with Japanese koi fish", terminal_code: "SIN-T3", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Sunflower Garden", description: "Rooftop garden with viewing gallery", terminal_code: "SIN-T3", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Bengawan Solo", description: "Traditional Singaporean cakes and kueh", terminal_code: "SIN-T3", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Tiger Street Lab", description: "Craft beer and local fare", terminal_code: "SIN-T3", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Din Tai Fung", description: "Renowned Taiwanese restaurant famous for xiaolongbao", terminal_code: "SIN-T3", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Paradise Dynasty", description: "Known for signature colorful xiaolongbao", terminal_code: "SIN-T3", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Bee Cheng Hiang", description: "Famous for its barbecued pork jerky", terminal_code: "SIN-T3", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Ya Kun Kaya Toast", description: "Traditional Singaporean breakfast sets", terminal_code: "SIN-T3", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Sushi Tei", description: "Premium sushi and Japanese cuisine", terminal_code: "SIN-T3", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Aerotel Singapore", description: "Airport transit hotel with swimming pool", terminal_code: "SIN-T3", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "YOTELAIR Singapore Changi", description: "Modern capsule-style transit hotel inside the terminal", terminal_code: "SIN-T3", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Cathay Pacific Lounge", description: "Elegant lounge for Cathay Pacific passengers", terminal_code: "SIN-T3", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "SATS Premier Lounge", description: "Comfortable lounge with shower facilities", terminal_code: "SIN-T3", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "dnata Lounge", description: "Modern lounge with extensive food options", terminal_code: "SIN-T3", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "UOB Currency Exchange", description: "Competitive rates for currency exchange", terminal_code: "SIN-T3", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Telecommunications Kiosk", description: "SIM cards and mobile services", terminal_code: "SIN-T3", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "TRS Tax Refund", description: "Tourist refund scheme counter", terminal_code: "SIN-T3", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Spa Express", description: "Quick massage and spa treatments", terminal_code: "SIN-T3", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Kinokuniya", description: "Comprehensive Japanese bookstore", terminal_code: "SIN-T3", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Lotte Duty Free", description: "Korean duty-free retailer", terminal_code: "SIN-T3", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Uniqlo", description: "Japanese casual wear designer", terminal_code: "SIN-T3", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Irvins Salted Egg", description: "Popular salted egg fish skin and chips", terminal_code: "SIN-T3", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Muji", description: "Minimalist Japanese home goods", terminal_code: "SIN-T3", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Tokyu Hands", description: "Japanese lifestyle store", terminal_code: "SIN-T3", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },

    // Terminal 4 amenities
    { name: "Canopy Park", description: "Indoor park with nets, mazes and slides", terminal_code: "SIN-T4", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Manulife Sky Nets", description: "Walking and bouncing nets suspended in the air", terminal_code: "SIN-T4", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Mirror Maze", description: "Immersive mirror maze experience", terminal_code: "SIN-T4", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Changi Experience Studio", description: "Interactive digital attraction about Changi Airport", terminal_code: "SIN-T4", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Entertainment Deck", description: "Games and entertainment zone", terminal_code: "SIN-T4", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Butterfly Garden", description: "Tropical butterfly habitat with flowering plants", terminal_code: "SIN-T4", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Cactus Garden", description: "Outdoor roof garden with over 100 species of cacti", terminal_code: "SIN-T4", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Koi Pond", description: "Tranquil pond with Japanese koi fish", terminal_code: "SIN-T4", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Sunflower Garden", description: "Rooftop garden with viewing gallery", terminal_code: "SIN-T4", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Tiger Street Lab", description: "Craft beer and local fare", terminal_code: "SIN-T4", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Din Tai Fung", description: "Renowned Taiwanese restaurant famous for xiaolongbao", terminal_code: "SIN-T4", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Paradise Dynasty", description: "Known for signature colorful xiaolongbao", terminal_code: "SIN-T4", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Koi Thé", description: "Premium Taiwanese bubble tea", terminal_code: "SIN-T4", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Ya Kun Kaya Toast", description: "Traditional Singaporean breakfast sets", terminal_code: "SIN-T4", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Sushi Tei", description: "Premium sushi and Japanese cuisine", terminal_code: "SIN-T4", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Song Fa Bak Kut Teh", description: "Award-winning pork rib soup", terminal_code: "SIN-T4", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Ambassador Transit Hotel", description: "In-terminal hotel for transiting passengers", terminal_code: "SIN-T4", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "YOTELAIR Singapore Changi", description: "Modern capsule-style transit hotel inside the terminal", terminal_code: "SIN-T4", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Singapore Airlines SilverKris Lounge", description: "Premium lounge for Singapore Airlines first and business class passengers", terminal_code: "SIN-T4", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Plaza Premium Lounge", description: "Award-winning independent airport lounge", terminal_code: "SIN-T4", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "SATS Premier Lounge", description: "Comfortable lounge with shower facilities", terminal_code: "SIN-T4", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "UOB Currency Exchange", description: "Competitive rates for currency exchange", terminal_code: "SIN-T4", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Telecommunications Kiosk", description: "SIM cards and mobile services", terminal_code: "SIN-T4", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "TRS Tax Refund", description: "Tourist refund scheme counter", terminal_code: "SIN-T4", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Spa Express", description: "Quick massage and spa treatments", terminal_code: "SIN-T4", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Lotte Duty Free", description: "Korean duty-free retailer", terminal_code: "SIN-T4", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Charles & Keith", description: "Singaporean footwear and accessories brand", terminal_code: "SIN-T4", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Zara", description: "Spanish fast fashion retailer", terminal_code: "SIN-T4", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Irvins Salted Egg", description: "Popular salted egg fish skin and chips", terminal_code: "SIN-T4", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "TWG Tea", description: "Luxury tea brand", terminal_code: "SIN-T4", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" },
    { name: "Tokyu Hands", description: "Japanese lifestyle store", terminal_code: "SIN-T4", opening_hours: "6:00 AM - 11:00 PM", airport_code: "SIN" }
  ];

  for (const data of amenityData) {
    generator.addAmenity(data);
  }

  generator.saveToFile('supabase-amenities.csv');
}

main().catch(console.error); 