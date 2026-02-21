#!/bin/bash

# Script to upload and compare CSV amenities with existing databases
# Usage: ./upload-and-compare.sh <path-to-your-csv-file>

set -e

echo "=== Terminal Plus Amenity Comparison Tool ==="
echo ""

# Check if CSV file is provided
if [ $# -eq 0 ]; then
    echo "Usage: ./upload-and-compare.sh <path-to-your-csv-file>"
    echo ""
    echo "This script will:"
    echo "1. Copy your CSV file to the scripts directory"
    echo "2. Compare it with existing amenity databases"
    echo "3. Generate a report of missing amenities"
    echo "4. Export missing amenities to a new CSV file"
    echo ""
    echo "Example: ./upload-and-compare.sh ~/Downloads/my-amenities.csv"
    exit 1
fi

CSV_FILE="$1"
CSV_FILENAME=$(basename "$CSV_FILE")

# Check if the file exists
if [ ! -f "$CSV_FILE" ]; then
    echo "Error: File '$CSV_FILE' not found!"
    exit 1
fi

echo "📁 Uploading CSV file: $CSV_FILENAME"
cp "$CSV_FILE" "./$CSV_FILENAME"

echo "🔍 Running comparison..."
npm run compare "$CSV_FILENAME"

echo ""
echo "✅ Comparison complete!"
echo ""
echo "📊 Results:"
echo "- Report saved to: comparison-report.md"
echo "- Missing amenities exported to: missing-amenities.csv"
echo ""
echo "📋 Next steps:"
echo "1. Review the comparison report"
echo "2. Check the missing-amenities.csv file"
echo "3. Add missing amenities to your Supabase database"
echo "4. Clean up duplicate entries in your CSV if needed"
echo ""
echo "🎯 The script found $(grep -c "Missing from Database:" comparison-report.md || echo "unknown") missing amenities" 