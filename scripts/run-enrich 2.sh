#!/bin/bash

# Run the amenity enrichment script
echo "🔄 Running amenity enrichment..."
npx ts-node enrichAmenities.ts

# Copy to src if successful
if [ $? -eq 0 ]; then
    echo "📋 Copying enriched data to src..."
    npx ts-node copyToSrc.ts
    echo "✅ Enrichment complete!"
else
    echo "❌ Enrichment failed!"
    exit 1
fi 