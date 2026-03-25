#!/bin/bash

echo "🚨 Terminal+ App Emergency Fix Script"
echo "====================================="

# Kill existing dev servers
echo "🔄 Killing existing dev servers..."
pkill -f vite 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true

# Clear build caches
echo "🧹 Clearing build caches..."
rm -rf dist/ 2>/dev/null || true
rm -rf .vite/ 2>/dev/null || true
rm -rf node_modules/.cache/ 2>/dev/null || true

# Clear npm cache
echo "🧹 Clearing npm cache..."
npm cache clean --force

# Remove node_modules (optional - uncomment if needed)
# echo "🗑️ Removing node_modules..."
# rm -rf node_modules/ 2>/dev/null || true

# Create backup of current state
echo "💾 Creating backup..."
cp -r src/ src-backup-$(date +%Y%m%d-%H%M%S)/ 2>/dev/null || true

# Reinstall dependencies (if node_modules was removed)
if [ ! -d "node_modules" ]; then
    echo "📦 Reinstalling dependencies..."
    npm install
fi

# Clear browser cache instructions
echo ""
echo "🌐 Browser Cache Clear Instructions:"
echo "1. Open DevTools (F12)"
echo "2. Right-click refresh button"
echo "3. Select 'Empty Cache and Hard Reload'"
echo ""
echo "Or run in browser console:"
echo "localStorage.clear(); sessionStorage.clear(); location.reload(true);"

# Start dev server
echo "🚀 Starting dev server..."
echo "Navigate to: http://localhost:5175/collection/hawker-heaven"
echo ""
npm run dev
