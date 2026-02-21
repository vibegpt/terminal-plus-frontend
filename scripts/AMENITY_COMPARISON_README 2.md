# Amenity Comparison Tool

This tool helps you compare your CSV amenities with the existing databases to identify missing amenities that need to be added to Supabase.

## Quick Start

### Option 1: Use the upload script (Recommended)
```bash
# Navigate to the scripts directory
cd scripts

# Run the comparison with your CSV file
./upload-and-compare.sh /path/to/your/amenities.csv
```

### Option 2: Manual comparison
```bash
# Navigate to the scripts directory
cd scripts

# Install dependencies (if not already done)
npm install

# Run the comparison
npm run compare /path/to/your/amenities.csv
```

## What the tool does

1. **Loads your CSV file** - Supports various CSV formats and column names
2. **Scans existing databases** - Reads all JSON amenity files in `src/data/`
3. **Compares amenities** - Matches by normalized amenity names
4. **Generates reports** - Creates detailed comparison reports
5. **Exports missing data** - Saves missing amenities to a new CSV file

## Supported CSV Formats

The tool automatically detects and handles these column name variations:

- `name` / `Name`
- `terminal_code` / `terminalCode` / `terminal_code`
- `category` / `Category`
- `amenity_type` / `amenityType` / `amenity_type`
- `description` / `Description`
- `location_description` / `locationDescription` / `location_description`
- `opening_hours` / `openingHours` / `opening_hours`
- `vibe_tags` / `vibeTags` / `vibe_tags`
- `status` / `Status`
- `image_url` / `imageUrl` / `image_url`
- `airport_code` / `airportCode` / `airport_code`
- `lat` / `Lat`
- `lng` / `Lng`
- `price_tier` / `priceTier` / `price_tier`

## Output Files

### 1. `comparison-report.md`
A detailed markdown report containing:
- Summary statistics
- List of all missing amenities with details
- List of duplicate amenities in your CSV
- Recommendations for next steps

### 2. `missing-amenities.csv`
A CSV file containing only the amenities that are missing from the database, ready for import to Supabase.

## Example Output

```
=== Terminal Plus Amenity Comparison Tool ===

📁 Uploading CSV file: my-amenities.csv
🔍 Running comparison...

# Amenity Comparison Report

## Summary
- CSV Amenities: 259
- Existing Database Amenities: 258
- Missing from Database: 174
- Duplicates in CSV: 50

## Missing Amenities (174)
1. **Heineken House**
   - Terminal: SYD-T1
   - Category: Dining
   - Type: Bar
   - Airport: SYD

2. **Kitchen by Mike**
   - Terminal: SYD-T1
   - Category: Dining
   - Type: Casual Dining
   - Airport: SYD
...
```

## Understanding the Results

### Missing Amenities
These are amenities in your CSV that don't exist in the current databases. You should:
1. Review each one for accuracy
2. Add them to your Supabase database
3. Consider if they need additional data (coordinates, descriptions, etc.)

### Duplicate Amenities
These are amenities that appear multiple times in your CSV. You should:
1. Review and remove duplicates
2. Consolidate similar entries
3. Ensure each amenity appears only once per terminal

### Summary Statistics
- **CSV Amenities**: Total count from your uploaded file
- **Existing Database Amenities**: Total count from all JSON files
- **Missing from Database**: Amenities in your CSV not in the database
- **Duplicates in CSV**: Amenities that appear multiple times in your CSV

## Database Files Scanned

The tool scans these files in `src/data/`:
- `amenities.json` - Main consolidated amenities
- `sin_t1.json` - Singapore Terminal 1
- `sin_t2.json` - Singapore Terminal 2
- `sin_t3.json` - Singapore Terminal 3
- `sin_t4.json` - Singapore Terminal 4
- `syd_t1.json` - Sydney Terminal 1
- `syd_t2.json` - Sydney Terminal 2
- `lhr_t2.json` - London Heathrow Terminal 2
- `sin_jewel.json` - Singapore Jewel

## CSV Format Requirements

Your CSV should have these columns (column names are flexible):

```csv
name,terminal_code,category,amenity_type,description,location_description,opening_hours,vibe_tags,status,image_url,airport_code,lat,lng,price_tier
"Starbucks","SYD-T1","Dining","Café","","After Security, near Gate 24","{""Monday-Sunday"":""24/7""}","Chill;Refuel;Quick","active","https://cdn.terminal.plus/images/amenities/starbucks.jpg","SYD",-33.9462,151.1773,"$$"
```

## Troubleshooting

### Common Issues

1. **"CSV file not found"**
   - Make sure the file path is correct
   - Use absolute paths if needed

2. **"Error reading file"**
   - Check that your CSV is properly formatted
   - Ensure the file isn't corrupted

3. **"No missing amenities found"**
   - All your amenities already exist in the database
   - Check for duplicates in your CSV

4. **"Too many missing amenities"**
   - Your CSV might be from a different airport/terminal
   - Check terminal codes match your database

### Getting Help

If you encounter issues:
1. Check the console output for error messages
2. Verify your CSV format matches the requirements
3. Ensure all required dependencies are installed (`npm install`)

## Next Steps After Comparison

1. **Review the report** - Check `comparison-report.md` for details
2. **Clean duplicates** - Remove duplicate entries from your CSV
3. **Add missing amenities** - Import `missing-amenities.csv` to Supabase
4. **Verify data quality** - Ensure coordinates, descriptions, and other fields are complete
5. **Update existing amenities** - Consider if any existing amenities need updates

## Advanced Usage

### Custom Comparison
```typescript
import { AmenityComparator } from './compareAmenities';

const comparator = new AmenityComparator();
const result = await comparator.compareAmenities('my-amenities.csv');
console.log(result.summary);
```

### Export Custom Format
```typescript
// Export missing amenities in a different format
comparator.exportMissingToCSV(result.missingFromDatabase, 'custom-output.csv');
```

## Data Quality Tips

1. **Normalize names** - Use consistent naming conventions
2. **Add coordinates** - Include lat/lng for map functionality
3. **Complete descriptions** - Add helpful descriptions for users
4. **Categorize properly** - Use consistent category names
5. **Add vibe tags** - Include relevant vibe tags for recommendations
6. **Verify terminal codes** - Ensure codes match your airport structure 