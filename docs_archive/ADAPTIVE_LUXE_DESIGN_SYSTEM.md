# 🎨 Terminal+ Adaptive Luxe Design System

## ✨ Overview

The **Adaptive Luxe** design system combines premium glassmorphism aesthetics with functional real-time features to create a memorable, high-end airport navigation experience.

## 🎯 Core Principles

### 1. **Glassmorphism First**
- Frosted glass effects on all cards
- Semi-transparent overlays
- Backdrop blur for depth

### 2. **Live Data Visualization**
- Pulsing dots for real-time status
- Color-coded urgency (green/yellow/red)
- Live occupancy indicators

### 3. **Spatial Context**
- Mini-maps on every card
- Walking time estimates
- "You are here" indicators

### 4. **Time-Adaptive Themes**
- Morning (5am-12pm): Soft pastels
- Day (12pm-8pm): Clean whites
- Night (8pm-5am): Dark mode with neon accents

## 📁 File Structure

```
src/
├── styles/
│   └── adaptive-luxe.css         # Core design system styles
├── components/
│   └── AdaptiveLuxe.tsx         # Reusable components
├── pages/
│   └── CollectionDetailAdaptiveLuxe.tsx  # Collection page
```

## 🧩 Component Library

### Live Status Components

```tsx
import { LiveDot, LiveBadge } from '@/components/AdaptiveLuxe';

// Simple pulsing dot
<LiveDot status="success" size="small" />

// Badge with live indicator
<LiveBadge status="warning">Getting Busy</LiveBadge>
```

### Glass Cards

```tsx
import { GlassCard, GlassCardHeavy } from '@/components/AdaptiveLuxe';

// Interactive glass card
<GlassCard hover onClick={handleClick}>
  <p>Content here</p>
</GlassCard>

// Heavy glass effect (for hero sections)
<GlassCardHeavy className="p-6">
  <h1>Hero Content</h1>
</GlassCardHeavy>
```

### Mini Maps

```tsx
import { MiniMap } from '@/components/AdaptiveLuxe';

// Shows walking path and time
<MiniMap distance="3 min" showPath />
```

### Chips & Badges

```tsx
import { Chip } from '@/components/AdaptiveLuxe';

// Status chips
<Chip variant="success" icon="⭐">4.5 Rating</Chip>
<Chip variant="warning">Closing Soon</Chip>
<Chip variant="danger">Busy</Chip>
```

### Hero Sections

```tsx
import { HeroSection } from '@/components/AdaptiveLuxe';

<HeroSection
  gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
  emoji="💎"
  title="Hidden Gems"
  subtitle="Secret spots locals love"
  stats={[
    { label: 'Spots', value: 18, live: true },
    { label: 'Nearby', value: 5 }
  ]}
/>
```

## 🎨 Color Palette

### Core Colors
```css
--luxe-midnight: #0A0E27;      /* Dark background */
--luxe-dark-blue: #1a1a2e;     /* Surface */
--luxe-surface: #151B3B;        /* Card background */
```

### Accent Colors
```css
--luxe-purple: #667eea;         /* Primary */
--luxe-pink: #764ba2;           /* Primary gradient end */
--luxe-lime: #00FF88;           /* Success/Live */
--luxe-hot-pink: #FF006E;       /* Danger/Alert */
--luxe-gold: #FFD700;           /* Warning */
```

### Status Colors
- **Green (#00FF88)**: Open, Available, Not Busy
- **Yellow (#FFD700)**: Warning, Closing Soon, Getting Busy
- **Red (#FF006E)**: Closed, Busy, Alert

## 📱 Mobile Optimizations

### Haptic Feedback
```tsx
const vibrate = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
};
```

### Safe Area Insets (iPhone)
```tsx
<div className="safe-area-inset" />
```

### Performance
- Backdrop filter fallbacks for older devices
- Lazy loading for images
- Virtual scrolling for large lists
- Skeleton loaders during data fetch

## 🌟 Signature Features

### 1. Live Pulse System
```tsx
// Real-time status updates
const liveStatus = {
  quiet: { color: 'success', label: 'Quiet now' },
  moderate: { color: 'warning', label: 'Getting busy' },
  busy: { color: 'danger', label: 'Peak hours' }
};
```

### 2. Time-Based Themes
```tsx
const getTimeTheme = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 20) return 'day';
  return 'night';
};
```

### 3. Gradient Borders (Hover Effect)
```css
.gradient-border:hover::before {
  opacity: 1; /* Reveals gradient border */
}
```

## 🚀 Implementation Steps

### Step 1: Import Styles
```tsx
import '../styles/adaptive-luxe.css';
```

### Step 2: Use Components
```tsx
import { GlassCard, LiveBadge, MiniMap } from '@/components/AdaptiveLuxe';
```

### Step 3: Apply Theme
```tsx
useEffect(() => {
  document.body.setAttribute('data-theme', getTimeTheme());
}, []);
```

## 📊 Design Patterns

### Card Layout
```
┌─────────────────────────────┐
│ [Image/Gradient Background] │
│ ┌──────┐          ┌──────┐ │
│ │ LIVE │          │ Map  │ │
│ └──────┘          └──────┘ │
│                             │
│ Title                       │
│ Subtitle                    │
│ [Chip] [Chip] [Chip]       │
└─────────────────────────────┘
```

### Information Hierarchy
1. **Visual** (Image/Emoji) - Instant recognition
2. **Title** - What it is
3. **Live Status** - Is it available now?
4. **Distance/Time** - Can I make it?
5. **Details** - Additional info

## 🎯 Use Cases

### Collection Pages
- Hero with glassmorphism
- Filter pills
- Grid/List view toggle
- Live status badges

### Amenity Cards
- Mini-map integration
- Live occupancy
- Rich media preview
- Quick action chips

### Navigation
- Floating action buttons
- Sticky headers with blur
- Smooth page transitions
- Haptic feedback

## 🔧 Customization

### Custom Gradients
```tsx
const gradients = {
  purple: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  neon: 'linear-gradient(135deg, #00FF88 0%, #FF006E 100%)',
  sunset: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
};
```

### Custom Glass Effects
```css
.custom-glass {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.18);
}
```

## 📝 Best Practices

1. **Always include haptic feedback** on interactive elements
2. **Use live badges** for time-sensitive information
3. **Include mini-maps** for spatial context
4. **Implement skeleton loaders** for better perceived performance
5. **Test on real devices** for glass effect performance
6. **Provide fallbacks** for older browsers

## 🎉 Result

The Adaptive Luxe design creates a **premium, memorable experience** that:
- Feels alive with real-time data
- Provides spatial context at a glance
- Adapts to time of day
- Delights with smooth animations
- Maintains 60fps performance

## 🚀 Next Steps

1. Integrate real-time data APIs
2. Add user preferences for theme
3. Implement advanced filters
4. Add AR navigation preview
5. Create onboarding tour

---

**The Adaptive Luxe design system makes Terminal+ feel like a premium, living guide that's both beautiful and incredibly useful.**
