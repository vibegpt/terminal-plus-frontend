# SoftContextPrompt Component

The `SoftContextPrompt` is an intelligent, animated modal component that helps users set their journey context in a user-friendly way. It integrates seamlessly with the `useJourneyContext` hook to provide personalized experiences based on user selection.

## Features

- **Intelligent Context Detection**: Automatically shows when users need to set their context
- **Time-Aware Options**: Context options adapt based on current time of day
- **Smooth Animations**: Beautiful Framer Motion animations with spring physics
- **Mobile Optimized**: Haptic feedback and touch-friendly interactions
- **Dark Mode Support**: Full dark mode compatibility
- **Accessibility**: Proper focus management and keyboard navigation
- **Terminal Selection**: Optional terminal selection for low-confidence locations

## When It Shows

The prompt automatically appears when:

1. **User hasn't been asked yet** (`!userState.hasAsked`)
2. **AND** either:
   - Low confidence location (`location.confidence < 60`)
   - OR at airport needing context (`location.isAtAirport`)

## Usage

### Basic Implementation

```typescript
import { SoftContextPrompt } from './components/SoftContextPrompt';
import { JourneyContextProvider } from './hooks/useJourneyContext';

function App() {
  return (
    <JourneyContextProvider>
      <YourApp />
      <SoftContextPrompt /> {/* Automatically shows when needed */}
    </JourneyContextProvider>
  );
}
```

### Manual Control

```typescript
import { SoftContextPrompt } from './components/SoftContextPrompt';
import { useJourneyContext } from './hooks/useJourneyContext';

function MyComponent() {
  const { userState, location } = useJourneyContext();
  const [showPrompt, setShowPrompt] = useState(false);

  // Show prompt manually
  const handleShowPrompt = () => {
    setShowPrompt(true);
  };

  return (
    <div>
      <button onClick={handleShowPrompt}>
        Set My Context
      </button>
      
      {showPrompt && <SoftContextPrompt />}
    </div>
  );
}
```

## Context Options

The component dynamically shows context options based on time and user scenario:

### Time-Based Options

#### Early Morning (22:00-06:00)
- **Just landed (Long flight)** - Exhausted → Arrival phase
- **Departing soon** - Active → Departure phase  
- **Long layover** - Active → Transit phase
- **Just arrived (Short flight)** - Fresh → Arrival phase
- **Planning ahead** - Fresh → Exploring phase

#### Morning (06:00-10:00)
- **Just arrived (Short flight)** - Fresh → Arrival phase
- **Departing soon** - Active → Departure phase
- **Just landed (Long flight)** - Exhausted → Arrival phase
- **Long layover** - Active → Transit phase
- **Planning ahead** - Fresh → Exploring phase

#### Other Times
- Standard order with context-appropriate prioritization

### Option Details

| Option | Energy | Phase | Time Available | Description |
|--------|--------|-------|----------------|-------------|
| Just landed (Long) | exhausted | arrival | moderate | Long flight recovery |
| Just arrived (Short) | fresh | arrival | moderate | Short flight, feeling good |
| Departing soon | active | departure | rushed | Need quick options |
| Long layover | active | transit | plenty | Time to explore |
| Planning ahead | fresh | exploring | moderate | Not at airport yet |

## User Flow

### 1. Context Selection
- User sees relevant options based on time
- Each option has an icon, label, and sublabel
- Options are color-coded with gradients
- Haptic feedback on mobile devices

### 2. Automatic Context Application
When an option is selected:
- **Energy level** is set automatically
- **Journey phase** is set automatically  
- **Time available** is inferred
- **Location context** is updated if needed

### 3. Terminal Selection (Optional)
If location confidence is low and not "exploring":
- Shows terminal selection screen
- Options: T1, T2, T3, T4, JEWEL, or "Show all"
- Updates location with manual terminal setting

### 4. Prompt Closure
- Automatically closes after selection
- Marks user as "asked" to prevent re-showing
- Provides skip option for dismissive users

## Props & Configuration

The component doesn't accept props - it's fully controlled by the `useJourneyContext` hook:

```typescript
// All configuration comes from the hook
const {
  location,           // Current location state
  userState,          // User energy and time
  timeContext,        // Time-based context
  setUserEnergy,      // Set energy level
  setPhase,           // Set journey phase
  setTimeAvailable,   // Set time constraints
  setManualTerminal   // Set terminal manually
} = useJourneyContext();
```

## Styling & Theming

### Color Scheme
- **Primary**: Blue to purple gradients
- **Success**: Green to teal gradients
- **Warning**: Yellow to orange gradients
- **Info**: Blue to cyan gradients
- **Neutral**: Gray to slate gradients

### Dark Mode
- Automatic dark mode support
- Dark backgrounds and text colors
- Proper contrast ratios
- Smooth theme transitions

### Responsive Design
- Mobile-first approach
- Bottom sheet on mobile, centered on desktop
- Touch-friendly button sizes
- Proper spacing for all screen sizes

## Animation Details

### Entrance Animation
```typescript
initial={{ y: 100, opacity: 0, scale: 0.95 }}
animate={{ y: 0, opacity: 1, scale: 1 }}
transition={{ type: 'spring', damping: 25 }}
```

### Exit Animation
```typescript
exit={{ y: 100, opacity: 0, scale: 0.95 }}
```

### Interactive Animations
- **Hover**: Scale up by 2%
- **Tap**: Scale down by 2%
- **Selection**: Chevron slides right
- **Terminal buttons**: Scale up by 5% on hover

## Integration Examples

### With Journey Context
```typescript
// The component automatically integrates with journey context
<JourneyContextProvider>
  <YourApp />
  <SoftContextPrompt /> {/* Shows when context needed */}
</JourneyContextProvider>
```

### With Custom Triggers
```typescript
function CustomTrigger() {
  const [showPrompt, setShowPrompt] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowPrompt(true)}>
        Personalize My Experience
      </button>
      
      {showPrompt && <SoftContextPrompt />}
    </>
  );
}
```

### With Location Services
```typescript
// The prompt automatically shows when location confidence is low
// and integrates with LocationDetectionService via the hook
```

## Testing

Visit `/test/soft-context-prompt` to test all functionality:

- **Context Display**: View current journey context
- **Test Controls**: Manually show/hide the prompt
- **Condition Check**: See when prompt should appear
- **Options Preview**: View available context options
- **Live Testing**: Test the actual prompt component

## Performance Considerations

- **Conditional Rendering**: Only renders when needed
- **Memoized Options**: Context options are calculated efficiently
- **Animation Optimization**: Uses Framer Motion's optimized animations
- **State Management**: Minimal state updates, efficient re-renders

## Browser Compatibility

- **Modern Browsers**: Full support for all features
- **Mobile Browsers**: Haptic feedback and touch optimizations
- **Progressive Enhancement**: Graceful fallbacks for older browsers
- **Accessibility**: Screen reader and keyboard navigation support

## Future Enhancements

- **Voice Input**: Voice-based context selection
- **Gesture Support**: Swipe gestures for mobile
- **Smart Suggestions**: ML-based option prioritization
- **Multi-Language**: Internationalization support
- **Custom Themes**: User-configurable color schemes
- **Analytics**: Track user context selection patterns

## Troubleshooting

### Prompt Not Showing
1. Check if `userState.hasAsked` is false
2. Verify location confidence is < 60 OR at airport
3. Ensure component is wrapped in `JourneyContextProvider`

### Context Not Updating
1. Verify `useJourneyContext` hook is working
2. Check if all setter functions are properly bound
3. Ensure no errors in console

### Animation Issues
1. Verify Framer Motion is installed
2. Check for CSS conflicts
3. Ensure proper z-index values
