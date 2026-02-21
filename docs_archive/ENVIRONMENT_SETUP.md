# Environment Setup Guide

## 🔧 Create .env file in your project root:

```env
# Analytics Configuration
VITE_GA4_MEASUREMENT_ID=G-F136HW3V8Q
VITE_HOTJAR_ID=6486356

# Supabase Configuration  
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Flight API Configuration (optional)
VITE_FLIGHT_API_BASE_URL=https://api.aviationstack.com/v1
VITE_FLIGHT_API_KEY=your_flight_api_key_here

# Development Settings
VITE_DEBUG_MODE=true
```

## 🔍 Find Any Remaining process.env Usage:

Search your codebase for any remaining `process.env` usage and replace with `import.meta.env`:

```bash
# Search command
grep -r "process\.env" src/

# Common replacements needed:
process.env.NODE_ENV → import.meta.env.MODE
process.env.REACT_APP_* → import.meta.env.VITE_*
process.env.NEXT_PUBLIC_* → import.meta.env.VITE_*
```

## 📱 HTTPS Setup for Production Features:

### Option 1: Local HTTPS (for testing Hotjar locally)
```bash
# Install mkcert for local HTTPS
brew install mkcert  # macOS
# or
choco install mkcert # Windows

# Create certificates
mkcert -install
mkcert localhost 127.0.0.1

# Update your vite.config.ts
export default defineConfig({
  // ... other config
  server: {
    https: {
      key: fs.readFileSync('./localhost-key.pem'),
      cert: fs.readFileSync('./localhost.pem'),
    },
    port: 5174
  }
});
```

### Option 2: Production Deployment
```bash
# Deploy to Vercel/Netlify for HTTPS
npm run build
# Deploy to your preferred platform
```

## 🚀 Testing the Fixes:

### 1. GPS Location Testing:
```javascript
// Test in browser console:
navigator.geolocation.getCurrentPosition(
  (pos) => console.log('GPS works:', pos),
  (err) => console.log('GPS error:', err)
);
```

### 2. Analytics Testing:
```javascript
// Check in browser console:
console.log('GA4:', window.gtag);
console.log('Hotjar:', window.hj);
console.log('Environment:', import.meta.env.MODE);
```

### 3. Environment Variables:
```javascript
// Test in component:
console.log('Env vars:', {
  mode: import.meta.env.MODE,
  ga4: import.meta.env.VITE_GA4_MEASUREMENT_ID,
  supabase: import.meta.env.VITE_SUPABASE_URL
});
```

## ✅ Expected Results:

- ✅ No more `process` variable errors
- ✅ Hotjar warning acknowledged (works in HTTPS only)  
- ✅ GPS graceful fallback (no error shown to users)
- ✅ Analytics working in development
- ✅ All environment variables properly loaded

## 🎯 Quick Verification:

1. **Check browser console** - no `process` errors
2. **Test GPS** - should fail gracefully without error UI
3. **Check analytics** - GA4 should initialize 
4. **Environment variables** - should load from VITE_* prefix
