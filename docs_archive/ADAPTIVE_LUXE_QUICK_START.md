# 🚀 Adaptive Luxe Implementation Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install framer-motion
```

### 2. Test the New Design

Navigate to any collection to see the Adaptive Luxe design:

```
http://localhost:3000/collection/discover/hidden-gems
http://localhost:3000/collection/shop/luxury-boulevard
http://localhost:3000/collection/chill/coffee-casual
```

### 3. Features to Try

#### 🌙 Time-Based Themes
- View the app at different times to see theme changes
- Morning (5am-12pm): Soft pastel theme
- Day (12pm-8pm): Clean white theme  
- Night (8pm-5am): Dark mode with neon accents

#### 📍 Live Status Indicators
- Green pulse = Not busy / Available
- Yellow pulse = Getting busy / Closing soon
- Red pulse = Busy / Closed

#### 🗺️ Mini Maps
- Every card shows distance/time
- Visual path from your location
- Tap for full map view (FAB button)

#### 📱 Mobile Features
- Haptic feedback on all taps
- Pull-to-refresh for updates
- Grid/List view toggle
- Smooth 60fps animations

## Component Usage Examples

### Basic Collection Card

```tsx
import { GlassCard, LiveBadge, MiniMap, Chip } from '@/components/AdaptiveLuxe';

function AmenityCard({ amenity }) {
  return (
    <GlassCard hover onClick={() => navigate(`/amenity/${amenity.slug}`)}>
      <div className="relative h-48 overflow-hidden">
        <img src={amenity.image} className="w-full h-full object-cover" />
        
        {/* Live status badge */}
        <div className="absolute top-4 left-4">
          <LiveBadge status="success">Open Now</LiveBadge>
        </div>
        
        {/* Mini map */}
        <div className="absolute top-4 right-4">
          <MiniMap distance="3 min" />
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-xl font-bold text-white mb-2">{amenity.name}</h3>
        
        {/* Info chips */}
        <div className="flex gap-2 flex-wrap">
          <Chip variant="default">⭐ {amenity.rating}</Chip>
          <Chip variant="default">💰 {amenity.price}</Chip>
          <Chip variant="success">🚶 {amenity.walkTime} min</Chip>
        </div>
      </div>
    </GlassCard>
  );
}
```

### Hero Section with Glass

```tsx
import { HeroSection } from '@/components/AdaptiveLuxe';

function CollectionHero({ collection }) {
  return (
    <HeroSection
      gradient={collection.gradient}
      emoji={collection.emoji}
      title={collection.name}
      subtitle={collection.subtitle}
      stats={[
        { label: 'Total', value: collection.count, live: true },
        { label: 'Open', value: collection.openCount },
        { label: 'Nearby', value: collection.nearbyCount }
      ]}
    />
  );
}
```

### Live Updates Integration

```tsx
// Connect to real-time data
useEffect(() => {
  const subscription = supabase
    .channel('amenity-status')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'amenities' },
      (payload) => {
        // Update live status
        updateAmenityStatus(payload.new);
      }
    )
    .subscribe();
    
  return () => subscription.unsubscribe();
}, []);
```

## Customization

### Custom Theme Colors

Edit `/src/styles/adaptive-luxe.css`:

```css
:root {
  /* Change primary gradient */
  --luxe-purple: #your-color;
  --luxe-pink: #your-color;
  
  /* Change live status colors */
  --luxe-lime: #your-success-color;
  --luxe-gold: #your-warning-color;
  --luxe-hot-pink: #your-danger-color;
}
```

### Custom Glass Effects

```css
.custom-glass {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 0.15);
}
```

## Performance Tips

1. **Lazy Load Images**
```tsx
<img loading="lazy" src={image} />
```

2. **Use Skeleton Loaders**
```tsx
import { Skeleton } from '@/components/AdaptiveLuxe';

{loading ? <Skeleton height="h-48" /> : <Content />}
```

3. **Optimize Glass Effects**
```css
/* Reduce blur on low-end devices */
@media (max-width: 640px) {
  .glass-card {
    backdrop-filter: blur(10px); /* Reduced from 20px */
  }
}
```

## Troubleshooting

### Glass Effects Not Working
- Check browser support for `backdrop-filter`
- Add `-webkit-backdrop-filter` prefix
- Provide fallback background color

### Performance Issues
- Reduce backdrop-filter blur radius
- Limit number of glass elements
- Use `will-change: transform` on animated elements

### Theme Not Changing
- Check `getTimeTheme()` function
- Verify body `data-theme` attribute
- Clear browser cache

## Next Steps

1. **Add Real Data**
   - Connect to amenity database
   - Implement live occupancy API
   - Add real-time updates

2. **Enhance Features**
   - AR navigation preview
   - Voice search
   - Personalized recommendations

3. **Polish Experience**
   - Onboarding tour
   - Loading animations
   - Error states

## Support

For issues or questions about the Adaptive Luxe design system:
- Check the [Design System Documentation](./ADAPTIVE_LUXE_DESIGN_SYSTEM.md)
- Review component examples in `/src/components/AdaptiveLuxe.tsx`
- Test the live demo at `/collection/discover/hidden-gems`

---

**The Adaptive Luxe design is now ready to make Terminal+ memorable!** ✨
