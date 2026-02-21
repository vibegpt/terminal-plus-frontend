# useJourneyContext Hook

The `useJourneyContext` hook provides intelligent, context-aware journey management for Terminal+ applications. It integrates with the `LocationDetectionService` to provide personalized recommendations based on user location, energy level, time constraints, and journey phase.

## Features

- **Intelligent Location Detection**: Automatic terminal detection with fallback strategies
- **Context-Aware Greetings**: Time-based greetings with location context
- **Dynamic Vibe Ordering**: Smart prioritization based on user state and context
- **Featured Collections**: Contextual collection recommendations
- **Journey Phase Management**: Departure, arrival, transit, and exploring phases
- **User State Tracking**: Energy levels and time availability
- **Real-time Updates**: Automatic time updates and location refresh

## Usage

### Basic Setup

```typescript
import { JourneyContextProvider, useJourneyContext } from './hooks/useJourneyContext';

// Wrap your app with the provider
function App() {
  return (
    <JourneyContextProvider>
      <YourApp />
    </JourneyContextProvider>
  );
}

// Use the hook in your components
function MyComponent() {
  const {
    location,
    phase,
    userState,
    timeContext,
    vibeOrder,
    featuredCollections,
    setPhase,
    setUserEnergy,
    setTimeAvailable,
    refreshLocation,
    setManualTerminal
  } = useJourneyContext();

  // Your component logic here
}
```

### Context Values

#### Location Information
```typescript
const { location } = useJourneyContext();

// location.isAtAirport: boolean
// location.airport?: string (e.g., 'SIN')
// location.terminal?: string (e.g., 'T1', 'T2', 'T3', 'T4', 'JEWEL')
// location.cluster?: string (e.g., 'T1-T2-T3-JEWEL')
// location.method: 'GPS' | 'WIFI' | 'MANUAL' | 'DEFAULT'
// location.confidence: number (0-100)
```

#### Journey Phase
```typescript
const { phase, setPhase } = useJourneyContext();

// phase: 'departure' | 'transit' | 'arrival' | 'exploring' | 'unknown'
// setPhase: (phase: JourneyContext['phase']) => void

// Examples:
setPhase('departure');  // User is leaving
setPhase('arrival');    // User just arrived
setPhase('transit');    // User is connecting
setPhase('exploring');  // User is browsing
```

#### User State
```typescript
const { userState, setUserEnergy, setTimeAvailable } = useJourneyContext();

// userState.energy: 'exhausted' | 'tired' | 'active' | 'fresh' | 'jetlagged'
// userState.timeAvailable?: 'rushed' | 'moderate' | 'plenty'
// userState.hasAsked: boolean

// Examples:
setUserEnergy('exhausted');        // Just off a long flight
setUserEnergy('fresh');            // Ready to explore
setTimeAvailable('rushed');        // Limited time
setTimeAvailable('plenty');        // Lots of time
```

#### Time Context
```typescript
const { timeContext } = useJourneyContext();

// timeContext.currentTime: Date
// timeContext.timeSlot: 'early_morning' | 'morning' | 'midday' | 'afternoon' | 'evening' | 'late_night'
// timeContext.likelyOrigins: string[] (e.g., ['Europe', 'Middle East'])
// timeContext.greeting: string (e.g., "Good morning from Terminal 3")
```

#### Vibe Recommendations
```typescript
const { vibeOrder, featuredCollections } = useJourneyContext();

// vibeOrder: string[] (prioritized vibes)
// featuredCollections: string[] (contextual collections)

// Example vibeOrder: ['comfort', 'quick', 'refuel', 'shop', 'explore']
// Example featuredCollections: ['breakfast-champions', 'coffee-worth-walk']
```

### Actions

#### Location Management
```typescript
const { refreshLocation, setManualTerminal } = useJourneyContext();

// Refresh location using all detection methods
await refreshLocation();

// Manually set terminal (for testing or user override)
setManualTerminal('T3');
```

#### User State Management
```typescript
const { setUserEnergy, setTimeAvailable } = useJourneyContext();

// Set energy level (triggers auto-phase detection)
setUserEnergy('exhausted');  // Auto-sets phase to 'arrival'

// Set time constraints
setTimeAvailable('rushed');  // Prioritizes quick options
```

## Intelligent Features

### Auto-Phase Detection
The hook automatically detects journey phases based on user energy:

- **Exhausted** → Likely just arrived → Sets phase to 'arrival'
- **Fresh** → Likely departing → Sets phase to 'departure' or 'exploring'

### Dynamic Vibe Ordering
Vibe priorities automatically adjust based on:

1. **Time of Day**: Morning prioritizes refuel, evening prioritizes comfort
2. **User Energy**: Exhausted users get comfort first, fresh users get explore first
3. **Time Available**: Rushed users get quick options first
4. **Journey Phase**: Departure prioritizes quick/shop, arrival prioritizes comfort

### Contextual Greetings
Greetings automatically include location context:

- "Good morning from Terminal 3" (when at specific terminal)
- "Good afternoon to Changi" (when at airport but terminal unknown)
- "Welcome" (when planning mode)

### Featured Collections
Collections are automatically selected based on:

- **Time**: Breakfast collections in morning, dinner collections in evening
- **Energy**: Recovery collections for exhausted users
- **Phase**: Transportation collections for arrivals, gate essentials for departures
- **Location**: Changi-specific collections when at SIN

## Integration Examples

### With Recommendation Engine
```typescript
const { location, userState, timeContext } = useJourneyContext();

// Create context for recommendations
const recommendationContext = {
  location,
  userState,
  timeContext,
  timestamp: new Date().toISOString()
};

// Pass to recommendation service
const recommendations = await recommendationService.getRecommendations(recommendationContext);
```

### With Navigation
```typescript
const { location, phase } = useJourneyContext();

if (phase === 'departure' && location.terminal) {
  // Show departure-specific navigation
  showDepartureNavigation(location.terminal);
} else if (phase === 'arrival') {
  // Show arrival-specific navigation
  showArrivalNavigation();
}
```

### With Vibe Selection
```typescript
const { vibeOrder, setUserEnergy } = useJourneyContext();

// Auto-adjust vibe order based on user input
const handleEnergyChange = (energy: string) => {
  setUserEnergy(energy);
  // vibeOrder will automatically update
};

// Use the intelligent vibe order
return (
  <div>
    {vibeOrder.map((vibe, index) => (
      <VibeButton key={vibe} vibe={vibe} priority={index + 1} />
    ))}
  </div>
);
```

### With Collection Display
```typescript
const { featuredCollections, location } = useJourneyContext();

// Show contextual collections
return (
  <div>
    <h2>Recommended for You</h2>
    {featuredCollections.map(collection => (
      <CollectionCard key={collection} slug={collection} />
    ))}
  </div>
);
```

## Testing

Visit `/test/journey-context` in your app to test all hook functionality:

- **Location Detection**: Test GPS, WiFi, and manual terminal setting
- **Journey Phases**: Set and view different journey phases
- **User State**: Adjust energy levels and time constraints
- **Vibe Ordering**: See how vibe priorities change with context
- **Featured Collections**: View contextual collection recommendations
- **Real-time Updates**: Watch time and location updates

## Performance Considerations

- **Location Updates**: Only refreshes when explicitly called or on mount
- **Time Updates**: Updates every minute (configurable)
- **Memoization**: Vibe order and collections are memoized with useCallback
- **Context Optimization**: Provider only re-renders when necessary

## Browser Compatibility

- **GPS**: Requires HTTPS and user permission
- **Time APIs**: Works in all modern browsers
- **Context API**: React 16.3+ required

## Future Enhancements

- **Bluetooth Beacon Integration**: More precise indoor positioning
- **Machine Learning**: Pattern recognition for better recommendations
- **Multi-Airport Support**: Extend beyond Changi Airport
- **Offline Support**: Cache location and context data
- **Voice Integration**: Voice-based energy and phase setting
