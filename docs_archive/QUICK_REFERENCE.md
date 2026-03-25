# Terminal+ Adaptive Luxe - Quick Reference Guide

## 🚀 Quick Start
```bash
cd /Users/toddbyrne/Desktop/terminal-plus-frontend
npm run dev
```
**Main URL:** http://localhost:5173/terminal/SYD-T1

---

## ✅ What We Built
**Adaptive Luxe Design System** - Premium glassmorphism UI that changes based on time of day, with live status indicators and smooth animations.

### Key Files Modified/Created:
1. **Routes:** `src/routes.tsx` → Fixed to use Adaptive Luxe
2. **Pages:** 
   - `TerminalCollectionsAdaptiveLuxe.tsx` → Main landing
   - `CollectionDetailAdaptiveLuxe.tsx` → Collection view  
   - `AmenityDetailAdaptiveLuxe.tsx` → Amenity details
3. **Components:** `src/components/AdaptiveLuxe.tsx` → UI library
4. **Config:** `src/config/database.ts` → Dynamic tables
5. **Styles:** `src/styles/adaptive-luxe.css` → Glassmorphism

---

## 🔄 Dynamic Database Tables

### Current Setup:
- **Primary Table:** `amenity_detail_rows11` (768 amenities)
- **Backup Tables:** Auto-fallback if primary fails

### To Change Tables:
```bash
# Edit .env.local
VITE_AMENITIES_TABLE=new_table_name

# Restart server
npm run dev
```

---

## 🎨 Design Features
- **Glassmorphism:** Blurred glass cards with depth
- **Live Indicators:** Pulsing dots for status
- **Time Themes:** Morning/Day/Night modes
- **Mobile Ready:** Touch-optimized with haptics

---

## 🔧 Common Commands

### Test Different Data:
```bash
# Main amenities (768 items)
VITE_AMENITIES_TABLE=amenity_detail_rows11 npm run dev

# Dining only (36 items)
VITE_AMENITIES_TABLE=syd_t1_new_dining_amenities npm run dev
```

### Troubleshooting:
```bash
# If design doesn't show
1. Hard refresh: Cmd+Shift+R
2. Check console for errors
3. Restart dev server

# If data doesn't load
1. Check .env.local has correct Supabase keys
2. Verify table name exists in Supabase
3. Check network tab for API errors
```

---

## 📱 Routes Available

### Collections by Terminal:
- `/terminal/SYD-T1` - Sydney Terminal 1
- `/terminal/SIN-T3` - Singapore Terminal 3

### Collection Types:
- `/collection/SYD-T1/quick-bites` - Fast food
- `/collection/SYD-T1/coffee-culture` - Cafes
- `/collection/SYD-T1/duty-free` - Shopping
- `/collection/SYD-T1/local-flavors` - Local cuisine
- `/collection/SYD-T1/fine-dining` - Restaurants
- `/collection/SYD-T1/wellness` - Spas & lounges

### Amenity Details:
- `/amenity/[amenity-slug]` - Any amenity

---

## 💡 Key Points
1. **Not Hardcoded:** Tables are configurable via environment variables
2. **Live Updates:** Fetches fresh data from Supabase on each request
3. **Auto Fallback:** Never breaks - tries multiple tables if needed
4. **Time Adaptive:** UI changes based on time of day automatically

---

## 📊 Database Requirements
Tables must have these fields:
- `amenity_slug`, `name`, `description`
- `terminal_code`, `airport_code`
- `vibe_tags`, `price_level`
- `opening_hours`, `website_url`

---

**Status:** ✅ Fully Implemented & Working  
**Last Updated:** August 23, 2025