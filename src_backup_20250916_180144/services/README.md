# Location Detection Service

The `LocationDetectionService` provides intelligent location detection for users at Changi Airport (SIN) using multiple strategies.

## Features

- **Multi-strategy detection**: GPS, WiFi, and smart defaults
- **Terminal-specific location**: Detects which terminal (T1, T2, T3, T4, JEWEL) user is at
- **Walking distance calculations**: Provides walking times between terminals
- **Arrival pattern analysis**: Time-based user state and vibe recommendations
- **Confidence scoring**: Each detection method provides confidence levels

## Usage

### Basic Location Detection

```typescript
import { LocationDetectionService } from './LocationDetectionService';

// Detect current location
const location = await LocationDetectionService.detectLocation();
console.log('Location:', location);
```

### Get Arrival Pattern

```typescript
// Get arrival pattern based on current time
const pattern = LocationDetectionService.getArrivalPattern();
console.log('User state:', pattern.user_state);
console.log('Vibe priorities:', pattern.vibe_priority);
```

### Manual Location Setting

```typescript
// For testing or manual override
const manualLocation = {
  method: 'MANUAL' as const,
  isAtAirport: true,
  airport: 'SIN',
  terminal: 'T3',
  confidence: 100
};
```

## Detection Methods

### 1. GPS Detection (Highest Priority)
- Uses device GPS coordinates
- Checks proximity to Changi terminals
- Confidence: 95% if within 500m of terminal
- Confidence: 70% if within 3km of airport

### 2. WiFi Detection (Medium Priority)
- Scans for Changi WiFi networks
- Terminal-specific SSID patterns
- Confidence: 85% for specific terminals
- Confidence: 60% for generic Changi WiFi

### 3. Smart Default (Fallback)
- Time-based arrival patterns
- Assumes planning mode
- Confidence: 40%
- Provides walking distances from central area

## Arrival Patterns

The service analyzes arrival times to determine user state and vibe priorities:

- **Early Morning (00:00-07:00)**: Exhausted users from Europe/Middle East
- **Morning (06:00-10:00)**: Fresh users from Australia/NZ
- **Midday (10:00-15:00)**: Active users from East/Southeast Asia
- **Afternoon (15:00-20:00)**: Jetlagged users from US West Coast/China
- **Evening (20:00-00:00)**: Tired users from India/Middle East/Europe

## Integration Examples

### With Recommendation Engine

```typescript
const location = await LocationDetectionService.detectLocation();
const pattern = LocationDetectionService.getArrivalPattern();

const context = {
  location,
  arrivalPattern: pattern,
  timestamp: new Date().toISOString()
};

// Pass to recommendation service
const recommendations = await recommendationService.getRecommendations(context);
```

### With Navigation

```typescript
const location = await LocationDetectionService.detectLocation();

if (location.terminal && location.walkingDistances) {
  // Show walking directions to other terminals
  Object.entries(location.walkingDistances).forEach(([terminal, distance]) => {
    if (distance > 0) {
      console.log(`Walking to ${terminal}: ${distance} minutes`);
    }
  });
}
```

## Testing

Visit `/test/location-detection` in your app to test the service:

- Auto-detect location using GPS
- Set manual terminal location
- View arrival patterns
- See walking distances
- Test integration scenarios

## Configuration

### Terminal Coordinates

```typescript
private static readonly CHANGI_TERMINALS = {
  T1: { lat: 1.3644, lng: 103.9915, name: 'Terminal 1' },
  T2: { lat: 1.3590, lng: 103.9891, name: 'Terminal 2' },
  T3: { lat: 1.3564, lng: 103.9855, name: 'Terminal 3' },
  T4: { lat: 1.3375, lng: 103.9833, name: 'Terminal 4' },
  JEWEL: { lat: 1.3602, lng: 103.9897, name: 'Jewel' }
};
```

### WiFi Patterns

```typescript
private static readonly WIFI_PATTERNS = {
  'Changi_T1': 'T1',
  'Changi_T2': 'T2',
  'Changi_T3': 'T3',
  'Changi_T4': 'T4',
  'Changi_Jewel': 'JEWEL',
  '#WiFi@Changi': 'GENERIC'
};
```

## Browser Compatibility

- **GPS**: Modern browsers with HTTPS
- **WiFi**: Experimental APIs (may require native app bridge)
- **Fallback**: Always available

## Error Handling

The service gracefully handles:
- GPS permission denied
- WiFi scanning unavailable
- Network errors
- Invalid coordinates

## Future Enhancements

- Bluetooth beacon detection
- Indoor positioning systems
- Machine learning for pattern recognition
- Multi-airport support
- Real-time crowd data integration
