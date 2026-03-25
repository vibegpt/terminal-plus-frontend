# Amenities Management System

This system allows you to add new amenities to the `amenities.json` file using a simplified format.

## Quick Start

### 1. Add New Amenities

Create a JSON file with your amenities in this format:

```json
[
  {
    "name": "Amenity Name",
    "slug": "amenity-slug",
    "vibes": ["Refuel", "Quick"],
    "terminal": "T1",
    "airportCode": "SYD",
    "image_url": "https://example.com/image.jpg",
    "logo_url": "https://example.com/logo.png"
  }
]
```

### 2. Run the Transformation

```bash
cd scripts
npx ts-node addNewAmenities.ts
```

Or specify a custom file:

```bash
npx ts-node addNewAmenities.ts your-amenities-file.json
```

## Supported Vibe Tags

The system uses 7 core vibe tags for consistent categorization:

- **Refuel**: Food & dining establishments
- **Quick**: Fast service options  
- **Shop**: Retail stores (including luxury brands)
- **Comfort**: Lounges and rest areas
- **Chill**: Relaxation spaces
- **Explore**: Attractions and entertainment
- **Work**: Business centers and work spaces

## Automatic Categorization

The system automatically determines:
- **Category**: Based on vibes and name patterns
- **Amenity Type**: Specific type within the category
- **Price Tier**: $ (budget), $$ (mid-range), $$$ (luxury)
- **Terminal Code**: Combines airport code and terminal
- **Coordinates**: Generated with slight variations

## File Structure

- `amenities-template.json`: Template showing the preferred format
- `createAmenitiesFromTemplate.ts`: Core transformation logic
- `addNewAmenities.ts`: Simple script to process new amenities
- `analyzeAndTransformAmenities.ts`: Analysis and transformation with detailed reporting

## Example Usage

1. **Add a few amenities**: Use `amenities-template.json` as a starting point
2. **Add many amenities**: Create a new JSON file with your data
3. **Check for duplicates**: The system automatically detects and skips duplicates
4. **Review results**: The script provides detailed output of what was added

## Output

The system creates:
- `src/data/amenities-new.json`: New amenities file
- Detailed console output showing what was processed
- Automatic duplicate detection and reporting

## Current Amenities Count

- **Total**: 241 amenities (International terminals only)
- **SYD**: 106 amenities (T1 only - International terminal)
- **SIN**: 58 amenities across multiple terminals
- **LHR**: 77 amenities across multiple terminals

## Vibe Tag Coverage

- **Coverage**: 100% consolidated to 7 core vibes
- **Total vibe instances**: 478 across 241 amenities
- **Distribution**: Quick (119), Shop (115), Comfort (91), Chill (56), Refuel (40), Explore (35), Work (22) 