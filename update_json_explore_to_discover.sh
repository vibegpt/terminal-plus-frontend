#!/bin/bash

# Script to replace all "Explore" with "Discover" in JSON files
# This updates vibe_tags in local data files

echo "🔄 Starting update: 'Explore' → 'Discover' in JSON files..."

# Change to data directory
cd "$(dirname "$0")/src/data"

# List of files to update (excluding backups)
files=(
  "amenities-new.json"
  "amenities.json"
  "enriched-amenities.json"
  "sin_jewel.json"
  "sin_t1.json"
  "sin_t2.json"
  "sin_t3.json"
  "sin_t4.json"
  "sin-transit-amenities.json"
  "sin-transit-summary.json"
  "syd_t1.json"
)

# Create backup directory
backup_dir="./backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$backup_dir"
echo "📦 Created backup directory: $backup_dir"

# Process each file
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo ""
    echo "Processing: $file"

    # Backup original
    cp "$file" "$backup_dir/$file"
    echo "  ✅ Backed up to $backup_dir/$file"

    # Count occurrences before
    before=$(grep -o '"Explore"' "$file" | wc -l | tr -d ' ')

    # Replace "Explore" with "Discover" (case-sensitive to avoid breaking other words)
    sed -i.tmp 's/"Explore"/"Discover"/g' "$file"
    rm -f "${file}.tmp"

    # Count occurrences after
    after=$(grep -o '"Discover"' "$file" | wc -l | tr -d ' ')

    echo "  📊 Replaced $before occurrences of \"Explore\" with \"Discover\""
  else
    echo "⚠️  File not found: $file"
  fi
done

echo ""
echo "✅ Update complete!"
echo ""
echo "Summary:"
echo "  - Backup location: $backup_dir"
echo "  - Files processed: ${#files[@]}"
echo ""
echo "To verify changes:"
echo "  grep -r '\"Explore\"' *.json"
echo ""
echo "To restore from backup if needed:"
echo "  cp $backup_dir/*.json ."
