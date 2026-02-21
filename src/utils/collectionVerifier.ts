// src/utils/collectionVerifier.ts

// Define the vibe structure
export const VIBES = {
  discover: ['jewel-discovery', 'hidden-gems', 'instagram-hotspots'],
  quick: ['grab-and-go', 'quick-bites', 'express-stops'],
  work: ['business-lounges', 'quiet-zones', 'productivity-spaces'],
  shop: ['retail-therapy', 'luxury-brands', 'local-finds'],
  refuel: ['morning-essentials', 'energy-boost', 'healthy-choices'],
  chill: ['lounge-life', 'spa-wellness', 'quiet-corners']
} as const;

export type Vibe = keyof typeof VIBES;
export type CollectionSlug = typeof VIBES[Vibe][number];

interface CollectionVerificationResult {
  isValid: boolean;
  issues: string[];
  warnings: string[];
  suggestions: string[];
  vibeStructure?: typeof VIBES;
}

interface CollectionDefinition {
  slug: string;
  name: string;
  vibe: string;
  vibes?: string[];
  displayName?: string;
  gradient?: string;
}

export class CollectionVerifier {
  /**
   * Get all vibes
   */
  static getVibes(): string[] {
    return Object.keys(VIBES);
  }

  /**
   * Get collections for a specific vibe
   */
  static getCollectionsForVibe(vibe: string): string[] {
    return VIBES[vibe as Vibe] || [];
  }

  /**
   * Find which vibe a collection belongs to
   */
  static getVibeForCollection(collectionSlug: string): string | null {
    for (const [vibe, collections] of Object.entries(VIBES)) {
      if (collections.includes(collectionSlug as any)) {
        return vibe;
      }
    }
    return null;
  }

  /**
   * Verify all collections and vibe structure
   */
  static verifyAllCollections(): CollectionVerificationResult {
    const result: CollectionVerificationResult = {
      isValid: true,
      issues: [],
      warnings: [],
      suggestions: [],
      vibeStructure: VIBES
    };

    // Check for duplicate collections across vibes
    const allCollections = new Set<string>();
    const duplicates: string[] = [];

    Object.entries(VIBES).forEach(([vibe, collections]) => {
      collections.forEach(collection => {
        if (allCollections.has(collection)) {
          duplicates.push(`${collection} (found in multiple vibes)`);
          result.isValid = false;
        }
        allCollections.add(collection);
      });
    });

    if (duplicates.length > 0) {
      result.issues.push(`Duplicate collections found: ${duplicates.join(', ')}`);
    }

    // Verify slug naming conventions
    allCollections.forEach(slug => {
      if (!this.isValidSlug(slug)) {
        result.warnings.push(`Collection slug "${slug}" doesn't follow kebab-case convention`);
      }
    });

    // Check for empty vibes
    Object.entries(VIBES).forEach(([vibe, collections]) => {
      if (collections.length === 0) {
        result.warnings.push(`Vibe "${vibe}" has no collections`);
      }
    });

    // Suggestions
    if (allCollections.size < 10) {
      result.suggestions.push('Consider adding more collections for variety');
    }

    this.logVerificationResult(result);
    return result;
  }

  /**
   * Verify a specific collection exists and is valid
   */
  static verifyCollection(vibe: string, slug: string): {
    exists: boolean;
    correctVibe: boolean;
    actualVibe: string | null;
    data: any;
    issues: string[];
  } {
    const actualVibe = this.getVibeForCollection(slug);
    const exists = actualVibe !== null;
    const correctVibe = actualVibe === vibe;
    const issues: string[] = [];

    if (!exists) {
      issues.push(`Collection "${slug}" not found in any vibe`);
    } else if (!correctVibe) {
      issues.push(`Collection "${slug}" is in vibe "${actualVibe}", not "${vibe}"`);
    }

    if (!this.isValidSlug(slug)) {
      issues.push(`Invalid slug format: "${slug}"`);
    }

    return {
      exists,
      correctVibe,
      actualVibe,
      data: exists ? { slug, vibe: actualVibe } : null,
      issues
    };
  }

  /**
   * Validate route parameters
   */
  static validateRoute(vibe: string, collectionSlug: string): {
    valid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check if vibe exists
    if (!this.getVibes().includes(vibe)) {
      issues.push(`Unknown vibe: "${vibe}"`);
      suggestions.push(`Available vibes: ${this.getVibes().join(', ')}`);
    }

    // Check if collection exists
    const verification = this.verifyCollection(vibe, collectionSlug);
    if (!verification.exists) {
      issues.push(`Collection "${collectionSlug}" not found`);
      
      // Suggest similar collections
      const allCollections = Object.values(VIBES).flat();
      const similar = this.findSimilarCollections(collectionSlug, allCollections);
      if (similar.length > 0) {
        suggestions.push(`Did you mean: ${similar.join(', ')}?`);
      }
    } else if (!verification.correctVibe) {
      issues.push(`Collection "${collectionSlug}" belongs to vibe "${verification.actualVibe}"`);
      suggestions.push(`Use URL: /collection/${verification.actualVibe}/${collectionSlug}`);
    }

    return {
      valid: issues.length === 0,
      issues,
      suggestions
    };
  }

  /**
   * Find similar collection names (for typo suggestions)
   */
  private static findSimilarCollections(input: string, collections: readonly string[]): string[] {
    const similar: string[] = [];
    const inputLower = input.toLowerCase();
    
    collections.forEach(collection => {
      const collectionLower = collection.toLowerCase();
      // Check if collections share significant parts
      if (
        collectionLower.includes(inputLower.substring(0, 4)) ||
        inputLower.includes(collectionLower.substring(0, 4))
      ) {
        similar.push(collection);
      }
    });
    
    return similar.slice(0, 3); // Return top 3 suggestions
  }

  /**
   * Get display name from slug
   */
  static getDisplayName(slug: string): string {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Validate slug format
   */
  private static isValidSlug(slug: string): boolean {
    return /^[a-z0-9-]+$/.test(slug);
  }

  /**
   * Log verification results
   */
  private static logVerificationResult(result: CollectionVerificationResult) {
    console.group('📋 Collection & Vibe Verification Report');
    
    if (result.isValid) {
      console.log('✅ All collections and vibes valid');
    } else {
      console.error('❌ Validation failed');
    }

    if (result.vibeStructure) {
      console.group('🎨 Vibe Structure');
      Object.entries(result.vibeStructure).forEach(([vibe, collections]) => {
        console.log(`${vibe}: ${collections.length} collections`);
      });
      console.groupEnd();
    }

    if (result.issues.length > 0) {
      console.group('🚨 Critical Issues');
      result.issues.forEach(issue => console.error(issue));
      console.groupEnd();
    }

    if (result.warnings.length > 0) {
      console.group('⚠️ Warnings');
      result.warnings.forEach(warning => console.warn(warning));
      console.groupEnd();
    }

    if (result.suggestions.length > 0) {
      console.group('💡 Suggestions');
      result.suggestions.forEach(suggestion => console.info(suggestion));
      console.groupEnd();
    }

    console.groupEnd();
  }

  /**
   * Auto-fix common issues
   */
  static autoFix(): { fixed: string[]; failed: string[] } {
    const fixed: string[] = [];
    const failed: string[] = [];

    try {
      // Clear any invalid collection storage
      const stored = sessionStorage.getItem('selectedCollection');
      if (stored) {
        const parsed = JSON.parse(stored);
        const actualVibe = this.getVibeForCollection(parsed.slug);
        
        if (!actualVibe || actualVibe !== parsed.vibe) {
          sessionStorage.removeItem('selectedCollection');
          fixed.push(`Cleared invalid collection: ${parsed.slug}`);
        }
      }
    } catch (error) {
      failed.push('Could not validate stored collection');
    }

    // Log vibe structure for reference
    console.log('📚 Available vibes and collections:');
    Object.entries(VIBES).forEach(([vibe, collections]) => {
      console.log(`  ${vibe}:`, collections);
    });

    return { fixed, failed };
  }

  /**
   * Get a visual map of the vibe/collection structure
   */
  static getVisualMap(): string {
    let output = '🗺️ Vibe & Collection Map\n';
    output += '========================\n\n';
    
    Object.entries(VIBES).forEach(([vibe, collections]) => {
      const vibeEmoji = this.getVibeEmoji(vibe);
      output += `${vibeEmoji} ${vibe.toUpperCase()}\n`;
      collections.forEach(collection => {
        output += `  └─ ${this.getDisplayName(collection)}\n`;
      });
      output += '\n';
    });
    
    return output;
  }

  /**
   * Get emoji for vibe
   */
  private static getVibeEmoji(vibe: string): string {
    const emojiMap: Record<string, string> = {
      discover: '🔍',
      quick: '⚡',
      work: '💼',
      shop: '🛍️',
      refuel: '🔋',
      chill: '😌'
    };
    return emojiMap[vibe] || '📦';
  }
}

// Export convenience functions
export const verifyAllCollections = () => CollectionVerifier.verifyAllCollections();
export const verifyCollection = (vibe: string, slug: string) => 
  CollectionVerifier.verifyCollection(vibe, slug);
export const validateRoute = (vibe: string, slug: string) => 
  CollectionVerifier.validateRoute(vibe, slug);
export const getVibeForCollection = (slug: string) => 
  CollectionVerifier.getVibeForCollection(slug);
export const autoFixCollections = () => CollectionVerifier.autoFix();
export const getCollectionMap = () => CollectionVerifier.getVisualMap();
