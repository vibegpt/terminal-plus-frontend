// vibePatternVerifier.ts
// Core verification utilities for vibe-first routing pattern with terminal context

interface VibeConfig {
  id: string;
  name: string;
  slug: string;
  collections: string[];
  icon?: string;
  color?: string;
}

interface CollectionConfig {
  slug: string;
  vibe: string;
  name: string;
  description?: string;
  terminals?: string[]; // Optional terminal restrictions
  amenityCount?: number;
}

interface VerificationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: Record<string, any>;
}

export class VibePatternVerifier {
  // Define valid vibes with all collections including Singapore-specific ones
  private static readonly VALID_VIBES: VibeConfig[] = [
    { 
      id: 'discover', 
      name: 'Discover', 
      slug: 'discover', 
      collections: [
        'jewel-discovery', 
        'hidden-gems',
        'garden-paradise',
        'entertainment-hub',
        'jewel-experience'
      ] 
    },
    { 
      id: 'quick', 
      name: 'Quick', 
      slug: 'quick', 
      collections: ['grab-and-go', 'quick-bites'] 
    },
    { 
      id: 'work', 
      name: 'Work', 
      slug: 'work', 
      collections: ['productivity-spaces', 'meeting-rooms'] 
    },
    { 
      id: 'shop', 
      name: 'Shop', 
      slug: 'shop', 
      collections: [
        'retail-therapy', 
        'duty-free-finds',
        'singapore-shopping-trail',
        'support-local-champions',
        'artisan-craft-masters'
      ] 
    },
    { 
      id: 'refuel', 
      name: 'Refuel', 
      slug: 'refuel', 
      collections: [
        'morning-essentials', 
        'energy-boost',
        'hawker-heaven'
      ] 
    },
    { 
      id: 'chill', 
      name: 'Chill', 
      slug: 'chill', 
      collections: ['lounge-life', 'quiet-zones'] 
    }
  ];

  // Valid terminal codes for Singapore Changi
  private static readonly VALID_TERMINALS = ['SIN-T1', 'SIN-T2', 'SIN-T3', 'SIN-T4', 'SIN-JEWEL'];

  /**
   * Validates a vibe-first URL pattern
   * @param url The URL to validate (e.g., /collection/discover/jewel-discovery)
   */
  static validateUrl(url: string): VerificationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const metadata: Record<string, any> = {};

    // Parse URL pattern
    const urlPattern = /^\/collection\/([^\/]+)\/([^\/\?]+)(\?.*)?$/;
    const match = url.match(urlPattern);

    if (!match) {
      errors.push(`Invalid URL pattern: ${url}. Expected: /collection/{vibe}/{collection-slug}`);
      return { valid: false, errors, warnings };
    }

    const [, vibe, collectionSlug, queryString] = match;
    metadata.vibe = vibe;
    metadata.collectionSlug = collectionSlug;

    // Validate vibe
    const vibeConfig = this.VALID_VIBES.find(v => v.slug === vibe);
    if (!vibeConfig) {
      errors.push(`Invalid vibe: ${vibe}. Valid vibes: ${this.VALID_VIBES.map(v => v.slug).join(', ')}`);
    } else {
      metadata.vibeName = vibeConfig.name;
      
      // Validate collection belongs to vibe
      if (!vibeConfig.collections.includes(collectionSlug)) {
        warnings.push(`Collection '${collectionSlug}' not found in vibe '${vibe}'. Expected: ${vibeConfig.collections.join(', ')}`);
      }
    }

    // Parse and validate query parameters
    if (queryString) {
      const params = new URLSearchParams(queryString);
      const terminal = params.get('terminal');
      
      if (terminal) {
        metadata.terminal = terminal;
        if (!this.VALID_TERMINALS.includes(terminal)) {
          warnings.push(`Unknown terminal code: ${terminal}. Valid terminals: ${this.VALID_TERMINALS.join(', ')}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      metadata
    };
  }

  /**
   * Validates collection data structure
   */
  static validateCollection(collection: CollectionConfig): VerificationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const metadata: Record<string, any> = {};

    // Required fields
    if (!collection.slug) {
      errors.push('Collection slug is required');
    } else {
      metadata.slug = collection.slug;
    }

    if (!collection.vibe) {
      errors.push('Collection vibe is required');
    } else {
      const vibeConfig = this.VALID_VIBES.find(v => v.slug === collection.vibe);
      if (!vibeConfig) {
        errors.push(`Invalid vibe: ${collection.vibe}`);
      } else {
        metadata.vibe = collection.vibe;
        metadata.vibeName = vibeConfig.name;
      }
    }

    if (!collection.name) {
      errors.push('Collection name is required');
    }

    // Optional terminal restrictions
    if (collection.terminals && collection.terminals.length > 0) {
      const invalidTerminals = collection.terminals.filter(t => !this.VALID_TERMINALS.includes(t));
      if (invalidTerminals.length > 0) {
        warnings.push(`Unknown terminals: ${invalidTerminals.join(', ')}`);
      }
      metadata.terminals = collection.terminals;
    }

    // Validate amenity count if provided
    if (collection.amenityCount !== undefined) {
      if (collection.amenityCount < 0) {
        errors.push('Amenity count cannot be negative');
      }
      metadata.amenityCount = collection.amenityCount;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      metadata
    };
  }

  /**
   * Validates terminal context
   */
  static validateTerminalContext(terminal: string | null, autoDetected: boolean = false): VerificationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const metadata: Record<string, any> = {
      terminal,
      autoDetected
    };

    if (terminal) {
      if (!this.VALID_TERMINALS.includes(terminal)) {
        errors.push(`Invalid terminal: ${terminal}. Valid terminals: ${this.VALID_TERMINALS.join(', ')}`);
      } else {
        metadata.valid = true;
        metadata.terminalName = this.getTerminalName(terminal);
      }

      if (autoDetected) {
        metadata.source = 'auto-detection';
      } else {
        metadata.source = 'manual-selection';
      }
    } else {
      warnings.push('No terminal context provided. Will show all amenities.');
      metadata.valid = false;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      metadata
    };
  }

  /**
   * Batch validate multiple URLs
   */
  static validateBatch(urls: string[]): { results: VerificationResult[], summary: any } {
    const results = urls.map(url => this.validateUrl(url));
    
    const summary = {
      total: urls.length,
      valid: results.filter(r => r.valid).length,
      invalid: results.filter(r => !r.valid).length,
      withWarnings: results.filter(r => r.warnings.length > 0).length,
      vibeDistribution: {} as Record<string, number>,
      terminalDistribution: {} as Record<string, number>
    };

    // Calculate distributions
    results.forEach(r => {
      if (r.metadata?.vibe) {
        summary.vibeDistribution[r.metadata.vibe] = (summary.vibeDistribution[r.metadata.vibe] || 0) + 1;
      }
      if (r.metadata?.terminal) {
        summary.terminalDistribution[r.metadata.terminal] = (summary.terminalDistribution[r.metadata.terminal] || 0) + 1;
      }
    });

    return { results, summary };
  }

  /**
   * Generate valid URL from components
   */
  static generateUrl(vibe: string, collectionSlug: string, terminal?: string): string {
    let url = `/collection/${vibe}/${collectionSlug}`;
    if (terminal) {
      url += `?terminal=${terminal}`;
    }
    return url;
  }

  /**
   * Get human-readable terminal name
   */
  private static getTerminalName(terminalCode: string): string {
    const terminalNames: Record<string, string> = {
      'SIN-T1': 'Terminal 1',
      'SIN-T2': 'Terminal 2',
      'SIN-T3': 'Terminal 3',
      'SIN-T4': 'Terminal 4',
      'SIN-JEWEL': 'Jewel Changi'
    };
    return terminalNames[terminalCode] || terminalCode;
  }

  /**
   * Get all valid vibes
   */
  static getValidVibes(): VibeConfig[] {
    return [...this.VALID_VIBES];
  }

  /**
   * Get collections for a specific vibe
   */
  static getCollectionsForVibe(vibe: string): string[] {
    const vibeConfig = this.VALID_VIBES.find(v => v.slug === vibe);
    return vibeConfig ? [...vibeConfig.collections] : [];
  }

  /**
   * Validate amenity data against vibe pattern
   */
  static validateAmenityData(amenity: any, expectedVibe?: string): VerificationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const metadata: Record<string, any> = {};

    // Check required fields
    if (!amenity.id) errors.push('Amenity ID is required');
    if (!amenity.name) errors.push('Amenity name is required');
    if (!amenity.terminal_code) errors.push('Terminal code is required');
    
    // Validate terminal code
    if (amenity.terminal_code && !this.VALID_TERMINALS.includes(amenity.terminal_code)) {
      warnings.push(`Unknown terminal code: ${amenity.terminal_code}`);
    }

    // Validate vibe tags if present
    if (amenity.vibe_tags) {
      const vibeTags = amenity.vibe_tags.split(',').map((t: string) => t.trim());
      metadata.vibeTags = vibeTags;
      
      if (expectedVibe && !vibeTags.some((tag: string) => tag.toLowerCase().includes(expectedVibe.toLowerCase()))) {
        warnings.push(`Amenity vibe tags don't match expected vibe: ${expectedVibe}`);
      }
    }

    // Validate price level
    if (amenity.price_level) {
      const validPriceLevels = ['$', '$$', '$$$', '$$$$'];
      if (!validPriceLevels.includes(amenity.price_level)) {
        warnings.push(`Invalid price level: ${amenity.price_level}. Expected: ${validPriceLevels.join(', ')}`);
      }
    }

    metadata.amenityId = amenity.id;
    metadata.amenityName = amenity.name;
    metadata.terminal = amenity.terminal_code;

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      metadata
    };
  }
}

// Export for use in other modules
export type { VibeConfig, CollectionConfig, VerificationResult };
