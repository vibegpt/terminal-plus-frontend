# Terminal Plus Scripts

This folder contains data processing scripts for the Terminal Plus application.

## Folder Structure

```
scripts/
├── enrichAmenities.ts     # Main enrichment script
├── copyToSrc.ts          # Copy data to React app
├── exportAmenitiesToCSV.ts # Export to CSV format
├── tsconfig.json         # TypeScript configuration
├── types.d.ts           # Type declarations
├── package.json         # Dependencies and scripts
└── README.md           # This file

data/
├── raw-amenities.json      # Input: Raw amenity data
├── enriched-amenities.json # Output: Processed amenity data
└── amenities.csv          # CSV export

src/data/
└── enriched-amenities.json # Copy for React app use
```

## Setup

1. Install dependencies:
   ```bash
   cd scripts
   npm install
   ```

2. Place your raw amenity data in `data/raw-amenities.json`

## Usage

### Quick Start

The easiest way to run the enrichment:

```bash
./run-enrich.sh
```

Or using npm:

```bash
npm run run
```

### Individual Commands

#### Enrich Amenities

Process raw amenity data to add:
- **Slugs**: URL-friendly identifiers
- **Vibe Tags**: Auto-generated based on keywords
- **Free Perks**: Detected from descriptions
- **Image URLs**: Generated paths for assets
- **Price Tiers**: Defaulted if missing

```bash
npx ts-node enrichAmenities.ts
```

Or using npm:

```bash
npm run enrich
```

#### Copy to Source

Copy enriched data to the React application:

```bash
npx ts-node copyToSrc.ts
```

Or using npm:

```bash
npm run copy
```

#### Full Process

Enrich and copy data in one command:

```bash
npm run process
```

#### Export to CSV

Convert enriched data to CSV format:

```bash
npx ts-node exportAmenitiesToCSV.ts
```

Or using npm:

```bash
npm run export-csv
```

### Development Mode

Watch for changes and re-run automatically:
```bash
npm run dev
```

### Build

Compile TypeScript to JavaScript:
```bash
npm run build
```

## Vibe Mapping

The script automatically tags amenities with vibes based on these keywords:

- **Refuel**: food, beverage, cafe, snack, bar
- **Comfort**: lounge, spa, rest, relax
- **Explore**: duty, book, fashion, gallery, store
- **Quick**: express, convenience, kiosk
- **Work**: wifi, business, meeting
- **Chill**: chill, rest, garden, quiet, meditation
- **Shop**: shop, store, retail

## Input Format

Raw amenities should be an array of objects with these fields:

```typescript
interface Amenity {
  name: string;
  terminal_code: string;
  amenity_type?: string;
  category?: string;
  location_description?: string;
  price_tier?: string;
  opening_hours?: string;
  image_url?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}
```

## Output Format

Enriched amenities include additional fields:

```typescript
interface EnrichedAmenity extends Amenity {
  slug: string;
  vibe_tags: string[];
  has_free_perk: boolean;
  image_url: string; // Generated if not provided
  price_tier: string; // Defaulted to "$$" if missing
}
``` 