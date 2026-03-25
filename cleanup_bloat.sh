#!/bin/bash

echo "🧹 Starting Terminal Plus Cleanup..."
echo "📦 Creating backup first..."

# Create backup
cp -r src src_backup_$(date +%Y%m%d_%H%M%S)

# Remove test/demo/debug components
echo "🗑️  Removing test/demo/debug components..."
rm -f src/components/*Test*.tsx
rm -f src/components/*test*.tsx
rm -f src/components/*Demo*.tsx
rm -f src/components/*demo*.tsx
rm -f src/components/*Debug*.tsx
rm -f src/components/*debug*.tsx
rm -f src/components/*Example*.tsx
rm -f src/components/TestBackendChat.tsx
rm -f src/components/DiagnosticCheck.tsx
rm -f src/components/SimpleTest.tsx
rm -f src/components/InlineTest.tsx
rm -f src/components/DomTest.tsx

# Remove emotion/voice features (not in MVP)
echo "🗑️  Removing emotion/voice features..."
rm -f src/components/Emotion*.tsx
rm -f src/components/VoiceInterface.tsx
rm -f src/components/MoodCalibration.tsx

# Remove unused features
echo "🗑️  Removing unused features..."
rm -f src/components/GamificationHub.tsx
rm -f src/components/ShoppingTrailDashboard.tsx
rm -f src/components/MultiAirportTimeline.tsx
rm -f src/components/MultiAirportTrip.tsx

# Remove duplicate pages
echo "🗑️  Cleaning pages directory..."
rm -f src/pages/*test*.tsx
rm -f src/pages/*Test*.tsx
rm -f src/pages/*demo*.tsx
rm -f src/pages/*Demo*.tsx
rm -f src/pages/*debug*.tsx
rm -f src/pages/*Debug*.tsx
rm -f src/pages/*Example*.tsx
rm -f src/pages/*Phase3*.tsx
rm -f src/pages/MVPCollectionPage.tsx
rm -f src/pages/CollectionPageMVP.tsx
rm -f src/pages/VibesFeedMVP-Updated.tsx
rm -f src/pages/scrapeSYDAmenities.js
rm -f src/pages/SimplifiedAmenity.tsx
rm -f src/pages/SimpleCollection.tsx
rm -f src/pages/SimpleVibesFeed.tsx
rm -f src/pages/*Standalone.tsx
rm -f src/pages/*AdaptiveLuxe*.tsx
rm -f src/pages/MultiSegmentPlanner.tsx
rm -f src/pages/emotion-demo.tsx

# Remove non-SIN airport data
echo "🗑️  Removing non-SIN data files..."
rm -f src/data/syd_*.json
rm -f src/data/lhr_*.json
rm -f data/syd_*.json
rm -f data/lhr_*.json

# Remove old archives and zips
echo "🗑️  Removing archives..."
rm -f src-files.tar.gz
rm -f src-files.zip
rm -f src/components.zip
rm -f src/hooks.zip
rm -f src/pages.zip
rm -f src/utils.zip

# Remove test scripts
echo "🗑️  Removing test scripts..."
rm -f test-*.js
rm -f test-*.sh
rm -f navigation-test.js

# Clean up excessive documentation
echo "📚 Archiving documentation..."
mkdir -p docs_archive
mv *.md docs_archive/ 2>/dev/null || true
echo "# Terminal Plus - SIN Airport MVP" > README.md

# Remove nested terminal-plus-frontend folder
echo "🗑️  Removing nested duplicate folder..."
rm -rf terminal-plus-frontend

# Count results
PAGES_COUNT=$(ls src/pages/*.tsx 2>/dev/null | wc -l)
COMPONENTS_COUNT=$(ls src/components/*.tsx 2>/dev/null | wc -l)

echo ""
echo "✅ Cleanup Complete!"
echo "📊 Results:"
echo "   - Pages remaining: $PAGES_COUNT"
echo "   - Components remaining: $COMPONENTS_COUNT"
echo "   - Backup saved as: src_backup_*"
echo ""
echo "🎯 Next step: Fix App.tsx to remove TestBackendChat and DiagnosticCheck"
