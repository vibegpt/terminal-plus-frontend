# Social Proof Components Integration Guide

## Overview

This guide shows exactly how to integrate the 4 social proof components into your existing Terminal+ ExperienceView component. All components are privacy-first and designed to work with your existing architecture.

## Components Created

### 1. `<SocialActivityFeed />`
- **Format**: "2 users just discovered great coffee in Terminal B"
- **Features**: Live discoveries, privacy badges, real-time updates
- **Privacy**: Minimum 1 user, anonymized IDs, aggregated data

### 2. `<CrowdInsights />`
- **Format**: "12 users found this helpful today"
- **Features**: Helpful spots, confidence scores, vibe-based insights
- **Privacy**: Pattern-based insights, no individual tracking

### 3. `<SimilarUsersPanel />`
- **Format**: "Others with similar vibes also enjoyed..."
- **Features**: Match percentages, confidence scores, amenity details
- **Privacy**: Pattern matching, no individual user data

### 4. `<PopularSpots />`
- **Features**: Trending locations with live activity indicators
- **Privacy**: Aggregated activity, minimum user thresholds

## Integration with ExperienceView

### Step 1: Import Components

Add these imports to your `ExperienceView.tsx`:

```typescript
// In src/pages/ExperienceView.tsx
import { SocialActivityFeed } from '@/components/SocialActivityFeed';
import { CrowdInsights } from '@/components/CrowdInsights';
import { SimilarUsersPanel } from '@/components/SimilarUsersPanel';
import { PopularSpots } from '@/components/PopularSpots';
import type { 
  SimilarUserRecommendation, 
  PopularSpot 
} from '@/types/social.types';
```

### Step 2: Add State Management

Add these state variables to your ExperienceView component:

```typescript
// In your ExperienceView component
const [currentVibe, setCurrentVibe] = useState<Vibe>('refuel');
const [airportCode] = useState('SIN'); // Get from your existing state
const [terminal] = useState('T1'); // Get from your existing state
const [userPreferences] = useState(['coffee', 'wifi', 'quiet']); // Get from user profile
```

### Step 3: Add Event Handlers

Add these handlers to your ExperienceView component:

```typescript
// Handle social proof interactions
const handleRecommendationClick = (recommendation: SimilarUserRecommendation) => {
  // Navigate to amenity detail
  navigate(`/amenity/${recommendation.id}`);
  
  // Or add to journey
  addToJourney({
    id: recommendation.id,
    name: recommendation.title,
    location: recommendation.location,
    vibe: recommendation.vibe
  });
  
  // Track analytics
  trackEvent('social_recommendation_clicked', {
    recommendationId: recommendation.id,
    vibe: recommendation.vibe,
    matchPercentage: recommendation.matchPercentage
  });
};

const handleSpotClick = (spot: PopularSpot) => {
  // Show amenity details
  setSelectedAmenity(spot);
  
  // Track analytics
  trackEvent('popular_spot_clicked', {
    spotId: spot.id,
    spotName: spot.name,
    vibe: spot.vibe,
    popularityScore: spot.popularityScore
  });
};
```

### Step 4: Add Components to Layout

Add the social proof components to your existing ExperienceView layout:

```typescript
// In your ExperienceView render method
return (
  <div className="space-y-6">
    {/* Existing content */}
    <JourneyRecommendations />
    
    {/* Social Proof Section */}
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        What's Happening Now
      </h3>
      
      {/* Live Discoveries */}
      <SocialActivityFeed
        airportCode={airportCode}
        terminal={terminal}
        maxActivities={4}
        refreshInterval={30000}
        privacyLevel="aggregated"
        showUserCount={true}
      />
      
      {/* Helpful Spots */}
      <CrowdInsights
        airportCode={airportCode}
        terminal={terminal}
        timeRange="2h"
        maxInsights={4}
        privacyLevel="aggregated"
      />
      
      {/* Similar Users */}
      <SimilarUsersPanel
        currentVibe={currentVibe}
        userPreferences={userPreferences}
        airportCode={airportCode}
        terminal={terminal}
        maxRecommendations={3}
        privacyLevel="aggregated"
        onRecommendationClick={handleRecommendationClick}
      />
      
      {/* Popular Spots */}
      <PopularSpots
        airportCode={airportCode}
        terminal={terminal}
        timeRange="2h"
        maxSpots={4}
        privacyLevel="aggregated"
        onSpotClick={handleSpotClick}
      />
    </div>
    
    {/* Continue with existing content */}
    <AmenityGrid />
  </div>
);
```

### Step 5: Mobile-Optimized Layout

For mobile devices, use a responsive grid layout:

```typescript
// Mobile-optimized layout
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <SocialActivityFeed
    airportCode={airportCode}
    terminal={terminal}
    maxActivities={3}
  />
  <CrowdInsights
    airportCode={airportCode}
    terminal={terminal}
    maxInsights={3}
  />
</div>

<div className="space-y-4">
  <SimilarUsersPanel
    currentVibe={currentVibe}
    userPreferences={userPreferences}
    airportCode={airportCode}
    terminal={terminal}
    maxRecommendations={2}
    onRecommendationClick={handleRecommendationClick}
  />
  
  <PopularSpots
    airportCode={airportCode}
    terminal={terminal}
    maxSpots={3}
    onSpotClick={handleSpotClick}
  />
</div>
```

## Integration with Existing Hooks

### Use Existing Hooks

The components automatically integrate with your existing hooks:

```typescript
// Components use these existing hooks
import { useAmenities } from '@/hooks/useAmenities';
import { useVibeColors } from '@/hooks/useVibeColors';
import { useTheme } from '@/hooks/useTheme';

// They will automatically use your existing patterns
const { getVibeColor } = useVibeColors();
const { theme } = useTheme();
```

### Connect with SmartRecommendationEngine

Integrate with your existing recommendation engine:

```typescript
// In your SmartRecommendationEngine
const enhanceWithSocialProof = (recommendations: Amenity[]) => {
  // Add social proof data to existing recommendations
  return recommendations.map(amenity => ({
    ...amenity,
    socialProof: {
      userCount: getSocialUserCount(amenity.id),
      helpfulness: getHelpfulnessScore(amenity.id),
      similarUsers: getSimilarUserCount(amenity.id, currentVibe)
    }
  }));
};
```

## Supabase Integration

### Database Schema

Add these tables to your Supabase database:

```sql
-- Social activities table
CREATE TABLE social_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  anonymized_id TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  location TEXT NOT NULL,
  terminal TEXT NOT NULL,
  vibe TEXT NOT NULL,
  rating INTEGER,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '2 hours')
);

-- Crowd insights table
CREATE TABLE crowd_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type TEXT NOT NULL,
  location TEXT NOT NULL,
  terminal TEXT NOT NULL,
  vibe TEXT NOT NULL,
  user_count INTEGER NOT NULL,
  percentage INTEGER NOT NULL,
  average_rating DECIMAL(3,2),
  confidence DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Popular spots table
CREATE TABLE popular_spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  terminal TEXT NOT NULL,
  vibe TEXT NOT NULL,
  current_users INTEGER NOT NULL,
  total_visits INTEGER NOT NULL,
  average_rating DECIMAL(3,2),
  popularity_score INTEGER NOT NULL,
  live_activity JSONB NOT NULL,
  amenities TEXT[] NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  trend TEXT NOT NULL
);
```

### Real-time Subscriptions

Add real-time subscriptions to your ExperienceView:

```typescript
// In your ExperienceView useEffect
useEffect(() => {
  // Subscribe to social activity changes
  const socialSubscription = supabase
    .channel('social_activity')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'social_activities',
      filter: `airport_code=eq.${airportCode}`
    }, (payload) => {
      // Update social activity feed
      console.log('New social activity:', payload.new);
    })
    .subscribe();

  return () => {
    socialSubscription.unsubscribe();
  };
}, [airportCode]);
```

## Privacy Implementation

### Privacy Controls

All components include privacy controls:

```typescript
// Privacy levels
type PrivacyLevel = 'aggregated' | 'anonymous' | 'minimal' | 'public';

// Components respect privacy settings
<SocialActivityFeed 
  privacyLevel="aggregated"
  showUserCount={true}
/>
```

### Privacy Features

- **Minimum User Threshold**: All data requires 5+ users (except discoveries which allow 1+)
- **Anonymized IDs**: No personal identifiers displayed
- **Time-based Anonymization**: Data from last 2 hours only
- **Aggregated Data**: Only group statistics shown
- **GDPR Compliance**: Clear privacy notices and controls

## Performance Optimization

### Lazy Loading

Lazy load social components for better performance:

```typescript
// Lazy load social components
const SocialActivityFeed = lazy(() => import('@/components/SocialActivityFeed'));
const CrowdInsights = lazy(() => import('@/components/CrowdInsights'));
const SimilarUsersPanel = lazy(() => import('@/components/SimilarUsersPanel'));
const PopularSpots = lazy(() => import('@/components/PopularSpots'));

// Wrap in Suspense
<Suspense fallback={<div>Loading social insights...</div>}>
  <SocialActivityFeed airportCode={airportCode} />
</Suspense>
```

### Memoization

Components use React.memo and useMemo for performance:

```typescript
// Components are already optimized
const filteredActivities = useMemo(() => {
  return activities.filter(activity => activity.userCount >= 1);
}, [activities]);
```

## Testing Integration

### Unit Tests

Test the integration:

```typescript
// Test social proof integration
describe('ExperienceView Social Proof', () => {
  it('should display social activity feed', () => {
    render(<ExperienceView />);
    expect(screen.getByText('Live Discoveries')).toBeInTheDocument();
  });

  it('should handle recommendation clicks', () => {
    const mockNavigate = jest.fn();
    render(<ExperienceView />);
    
    fireEvent.click(screen.getByText(/Coffee Corner/));
    expect(mockNavigate).toHaveBeenCalled();
  });
});
```

## Analytics Integration

### Track Social Interactions

Add analytics tracking:

```typescript
// Track social proof interactions
const trackSocialInteraction = (event: string, data: any) => {
  gtag('event', event, {
    event_category: 'social_proof',
    event_label: data.vibe,
    value: data.userCount
  });
};

// Use in event handlers
const handleRecommendationClick = (recommendation: SimilarUserRecommendation) => {
  trackSocialInteraction('social_recommendation_clicked', {
    vibe: recommendation.vibe,
    userCount: recommendation.similarUserCount
  });
  // ... rest of handler
};
```

## Complete Integration Example

Here's a complete example of how to integrate all components:

```typescript
// src/pages/ExperienceView.tsx
import React, { useState, useEffect } from 'react';
import { SocialActivityFeed } from '@/components/SocialActivityFeed';
import { CrowdInsights } from '@/components/CrowdInsights';
import { SimilarUsersPanel } from '@/components/SimilarUsersPanel';
import { PopularSpots } from '@/components/PopularSpots';
import type { SimilarUserRecommendation, PopularSpot } from '@/types/social.types';
import type { Vibe } from '@/types/common.types';

const ExperienceView: React.FC = () => {
  const [currentVibe, setCurrentVibe] = useState<Vibe>('refuel');
  const [airportCode] = useState('SIN');
  const [terminal] = useState('T1');
  const [userPreferences] = useState(['coffee', 'wifi', 'quiet']);

  const handleRecommendationClick = (recommendation: SimilarUserRecommendation) => {
    navigate(`/amenity/${recommendation.id}`);
  };

  const handleSpotClick = (spot: PopularSpot) => {
    setSelectedAmenity(spot);
  };

  return (
    <div className="space-y-6">
      {/* Existing content */}
      <JourneyRecommendations />
      
      {/* Social Proof Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          What's Happening Now
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SocialActivityFeed
            airportCode={airportCode}
            terminal={terminal}
            maxActivities={4}
          />
          <CrowdInsights
            airportCode={airportCode}
            terminal={terminal}
            maxInsights={4}
          />
        </div>
        
        <SimilarUsersPanel
          currentVibe={currentVibe}
          userPreferences={userPreferences}
          airportCode={airportCode}
          terminal={terminal}
          onRecommendationClick={handleRecommendationClick}
        />
        
        <PopularSpots
          airportCode={airportCode}
          terminal={terminal}
          onSpotClick={handleSpotClick}
        />
      </div>
      
      {/* Continue with existing content */}
      <AmenityGrid />
    </div>
  );
};

export default ExperienceView;
```

## Conclusion

The social proof components are now ready for integration into your existing Terminal+ ExperienceView. They provide:

- ✅ Privacy-first design
- ✅ Real-time updates
- ✅ Mobile optimization
- ✅ Performance optimization
- ✅ Easy integration with existing architecture
- ✅ Comprehensive TypeScript support

All components follow your established patterns and integrate seamlessly with your existing hooks, vibe system, and Supabase backend. 