# Singapore (SIN) Transit Logic Implementation

## 🎯 Core Principle

**Transit = All amenities marked `"available_in_transit": true` across SIN-T1, T2, T3, T4, JEWEL, filtered by time sensitivity.**

## 🏗️ Architecture Overview

### 1. New Hook: `useSINTransitAmenities`
- **Location**: `src/hooks/useSINTransitAmenities.ts`
- **Purpose**: Loads and filters SIN transit amenities across all terminals
- **Features**:
  - Loads all 5 SIN terminals (T1, T2, T3, T4, JEWEL)
  - Filters by `available_in_transit: true`
  - Applies time-based constraints
  - 5-minute navigation buffer

### 2. Enhanced Recommendation Engine
- **Location**: `src/hooks/useRecommendationEngine.ts`
- **Enhancements**:
  - Transit-aware scoring
  - Time-based penalties/bonuses
  - SIN-specific transit logic

### 3. Updated useRecommendations
- **Location**: `src/hooks/useRecommendations.ts`
- **Integration**: Clean, modular approach that automatically detects SIN transit
- **Features**:
  - Uses `useSINTransitAmenities` for SIN transit scenarios
  - Falls back to `useAmenities` for other contexts
  - Maintains backward compatibility
  - Simplified logic flow

## ⏱️ Time Constraints Strategy

| Transit Time Left | What to Recommend | Logic |
|------------------|-------------------|-------|
| > 60 min | All transit amenities incl. T4, Jewel | Full access to all terminals |
| 30–60 min | Prefer T1/T2/T3, limit T4 to fast services | Moderate time constraints |
| < 30 min | Only same-terminal or adjacent terminals | Heavy time penalties |
| < 15 min | Skip recs or show "No time to explore" prompt | Minimal recommendations |

## 🔧 Implementation Details

### useSINTransitAmenities Hook

```typescript
const SIN_TRANSIT_TERMINALS = [
  "SIN-T1", "SIN-T2", "SIN-T3", "SIN-T4", "SIN-JEWEL"
];

export function useSINTransitAmenities(timeLeft?: number) {
  // Loads all SIN terminals
  // Filters by available_in_transit: true
  // Applies time constraints with 5-min buffer
}
```

### Enhanced Scoring Logic

```typescript
// Transit bonus scoring
let transitBonus = 0;
if (context.isTransit && context.transitAirport === "SIN") {
  // +10 for transit-accessible amenities
  if (amenity.available_in_transit === true) {
    transitBonus = 10;
  }
  
  // Time-based penalties
  if (walkMinutes > context.timeLeft - 5) {
    transitBonus -= 50; // Heavy penalty
  }
  
  // Quick access bonus for short layovers
  if (context.timeLeft < 30 && walkMinutes <= 10) {
    transitBonus += 5;
  }
}
```

## 📊 Data Structure

### Amenity Fields for Transit
```json
{
  "name": "Example Amenity",
  "terminal_code": "SIN-T1",
  "available_in_transit": true,
  "walkTime": "5 min walk",
  "vibe_tags": ["Shop", "Quick"],
  "category": "Shopping"
}
```

### Key Fields:
- `available_in_transit`: Boolean flag for transit accessibility
- `walkTime`: String format "X min walk" for time calculations
- `terminal_code`: Used for terminal-specific logic
- `vibe_tags`: For vibe-based filtering

## 🚀 Usage Examples

### Basic Transit Usage
```typescript
const { amenities, isLoading, error } = useSINTransitAmenities(timeLeft);
```

### In useRecommendations
```typescript
// Automatically detected when:
// - journeyContext === "transit"
// - journeyData.layovers.includes("SIN")

const recommendations = useRecommendations({
  journeyContext: "transit",
  timeLeft: 45,
  journeyData: { layovers: ["SIN"] }
});

// Clean implementation:
const isSINTransit = journeyContext === "transit" && 
                     journeyData?.layovers?.includes("SIN");

// Uses appropriate hook based on context
const transitAmenities = useSINTransitAmenities(timeLeft);
const defaultAmenities = useAmenities();
```

## 🎯 Benefits Achieved

✅ **Accurate Transit Recommendations**: Only shows amenities accessible during layovers
✅ **Time-Aware Filtering**: Respects layover duration constraints
✅ **Inter-Terminal Navigation**: Handles SIN's complex terminal layout
✅ **Vibe Optimization**: Better recommendations based on available time
✅ **Scalable Architecture**: Ready for other multi-terminal airports

## 🔄 Integration Points

### 1. Journey Context Detection
- Automatically detects SIN transit scenarios
- Switches from terminal-specific to transit-wide loading
- Maintains backward compatibility

### 2. Time-Based Filtering
- 5-minute navigation buffer
- Dynamic scoring based on available time
- Progressive constraints for shorter layovers

### 3. Recommendation Engine Enhancement
- Transit-aware scoring algorithm
- Time-based penalties and bonuses
- SIN-specific optimization

## 📈 Performance Impact

- **Code Splitting**: Each terminal remains separate chunk
- **Lazy Loading**: Only loads SIN terminals when needed
- **Efficient Filtering**: Pre-filters by transit accessibility
- **Smart Caching**: Reuses terminal data across contexts

## 🔮 Future Enhancements

1. **Other Airports**: Extend to LHR, CDG, etc.
2. **Real-time Updates**: Dynamic transit availability
3. **Terminal Proximity**: Distance-based scoring
4. **Transit Routes**: Optimal path recommendations
5. **CMS Integration**: Dynamic transit data updates

## 🧪 Testing Scenarios

### Test Cases:
1. **Long Layover (>60min)**: Full access to all terminals
2. **Medium Layover (30-60min)**: Limited to closer terminals
3. **Short Layover (<30min)**: Same-terminal only
4. **Very Short (<15min)**: Minimal recommendations
5. **Non-Transit**: Falls back to terminal-specific loading

### Expected Behaviors:
- ✅ SIN transit loads all 5 terminals
- ✅ Time constraints properly applied
- ✅ Transit-accessible filtering works
- ✅ Scoring reflects transit context
- ✅ Backward compatibility maintained 