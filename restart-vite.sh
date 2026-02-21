#!/bin/bash

echo "🧹 Clearing Vite cache and restarting..."

# Stop any running processes on port 5173
echo "Stopping any existing dev server..."
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Clear all caches
echo "Clearing caches..."
rm -rf node_modules/.vite
rm -rf node_modules/.cache
rm -rf dist
rm -rf .parcel-cache

# Clear browser storage (reminder)
echo "
⚠️  IMPORTANT: Clear your browser cache!
   - Chrome/Edge: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   - Or open DevTools → Network → Check 'Disable cache'
"

# Restart server
echo "Starting fresh dev server..."
npm run dev
