# 🚨 VITE DEV SERVER TROUBLESHOOTING

## You're seeing the old design on localhost:5173

This is likely a **Vite cache issue**. Here's how to fix it:

## 🔧 Step-by-Step Fix

### 1. Stop the Dev Server
Press `Ctrl+C` in your terminal to stop the current server

### 2. Clear Vite Cache
Run these commands in your terminal:
```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Clear any build artifacts
rm -rf dist

# Optional: Clear node_modules cache
rm -rf node_modules/.cache
```

### 3. Hard Refresh Browser
- **Mac**: `Cmd + Shift + R`
- **Windows/Linux**: `Ctrl + Shift + R`

### 4. Restart Dev Server
```bash
npm run dev
```

### 5. Test the Adaptive Luxe Design
Go directly to a collection page:
```
http://localhost:5173/collection/discover/hidden-gems
```

## 🔍 Diagnostic Tool

I've added a diagnostic tool to your app. You should see a **black box in the bottom-left corner** showing:
- Current path
- Whether Adaptive Luxe CSS is loaded
- Quick links to test pages

## ✅ What You Should See

When working correctly on `/collection/discover/hidden-gems`:

1. **Dark gradient background** (not white)
2. **Glassmorphic hero section** with blur effects
3. **Time indicator** in top-right (🌙 Night Mode / ☀️ Day Mode)
4. **Live pulse dots** (animated green/yellow/red)
5. **Mini-maps** on cards showing walking time
6. **Floating map button** (bottom-right)

## 🚫 If You're Still Seeing Old Design

### Check 1: Are CSS files imported?
The diagnostic tool should show "✅ Loaded" for Adaptive Luxe CSS

### Check 2: Is the route correct?
- URL should be `/collection/[vibe]/[collection]`
- NOT `/collection/[terminal]/[collection]`

### Check 3: Force Vite to rebuild
```bash
# Stop server
Ctrl+C

# Delete ALL caches
rm -rf node_modules/.vite
rm -rf node_modules/.cache
rm -rf dist

# Reinstall dependencies (optional but thorough)
npm install

# Start fresh
npm run dev
```

### Check 4: Browser DevTools
1. Open DevTools (F12)
2. Go to Network tab
3. Check "Disable cache" checkbox
4. Refresh page

### Check 5: Try Incognito/Private Window
Sometimes browser extensions interfere:
- **Chrome**: Ctrl+Shift+N (Windows) or Cmd+Shift+N (Mac)
- **Firefox**: Ctrl+Shift+P (Windows) or Cmd+Shift+P (Mac)

## 🎯 Direct Test Links

After clearing cache and restarting, try these:

1. **Home Page**: http://localhost:5173/
2. **Test Page**: http://localhost:5173/test
3. **Adaptive Luxe**: http://localhost:5173/collection/discover/hidden-gems

## 📝 What the Diagnostic Box Shows

```
🔍 Diagnostic Info
📍 Path: /collection/discover/hidden-gems
🎨 Adaptive Luxe CSS: ✅ Loaded  <- This should be green
🌐 Port: 5173
⚡ Vite Dev Server
```

## 🆘 Last Resort

If nothing works, there might be a deeper issue:

1. **Check file exists**:
   ```bash
   ls src/pages/CollectionDetailAdaptiveLuxeSimple.tsx
   ls src/styles/adaptive-luxe.css
   ```

2. **Check for errors in terminal** where you run `npm run dev`

3. **Check browser console** for red errors (F12 → Console tab)

4. **Try a different browser** to rule out browser-specific issues

## 💡 Common Issues

- **Port conflict**: Make sure no other app is using port 5173
- **File permissions**: Make sure all files are readable
- **Node version**: Should be Node 16+ for Vite
- **Missing dependencies**: Run `npm install` to ensure all packages are installed

The Adaptive Luxe design IS in your codebase - we just need to make sure Vite is serving the updated files!
