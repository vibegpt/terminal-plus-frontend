# JourneyContext Usage Guide

## Overview

The `JourneyContext` provides centralized state management for journey data across your entire application. It allows any component to access and modify journey information without prop drilling.

## Setup

The `JourneyProvider` is already configured in your `App.tsx`:

```tsx
import { JourneyProvider } from './context/JourneyContext';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <VibeProvider>
            <JourneyProvider>
              <AppRoutes />
            </JourneyProvider>
          </VibeProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

## Basic Usage

### 1. Access Journey Data

```tsx
import { useJourney } from "@/context/JourneyContext";

const MyComponent = () => {
  const { journeyData, setJourneyData } = useJourney();
  
  return (
    <div>
      <p>From: {journeyData.departure}</p>
      <p>To: {journeyData.destination}</p>
      <p>Vibe: {journeyData.selected_vibe}</p>
    </div>
  );
};
```

### 2. Update Journey Data

```tsx
import { useJourney } from "@/context/JourneyContext";

const JourneyForm = () => {
  const { journeyData, setJourneyData } = useJourney();
  
  const updateDeparture = (departure: string) => {
    setJourneyData({
      ...journeyData,
      departure: departure.toUpperCase()
    });
  };
  
  return (
    <input
      value={journeyData.departure}
      onChange={(e) => updateDeparture(e.target.value)}
      placeholder="Departure airport"
    />
  );
};
```

## Journey Data Structure

```tsx
interface JourneyData {
  departure: string;        // Airport code (e.g., "SYD")
  destination: string;      // Airport code (e.g., "LHR")
  flightNumber: string;     // Flight number (e.g., "QF1")
  flightDate: string;       // Date string
  layovers: string[];       // Array of transit airports
  selected_vibe: string;    // Selected vibe (e.g., "Chill", "Explore")
  terminal: string;         // Terminal information
}
```

## Component Examples

### Journey Data Display Component

```tsx
import React from "react";
import { useJourney } from "@/context/JourneyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const JourneySummary = () => {
  const { journeyData } = useJourney();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Journey</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>From:</span>
            <span>{journeyData.departure}</span>
          </div>
          <div className="flex justify-between">
            <span>To:</span>
            <span>{journeyData.destination}</span>
          </div>
          <div className="flex justify-between">
            <span>Vibe:</span>
            <span>{journeyData.selected_vibe}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

### Journey Form Component

```tsx
import React from "react";
import { useJourney } from "@/context/JourneyContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const JourneyForm = () => {
  const { journeyData, setJourneyData } = useJourney();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Journey data:", journeyData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Departure (e.g., SYD)"
        value={journeyData.departure}
        onChange={(e) => setJourneyData({
          ...journeyData,
          departure: e.target.value.toUpperCase()
        })}
      />
      <Input
        placeholder="Destination (e.g., LHR)"
        value={journeyData.destination}
        onChange={(e) => setJourneyData({
          ...journeyData,
          destination: e.target.value.toUpperCase()
        })}
      />
      <Button type="submit">Save Journey</Button>
    </form>
  );
};
```

## Integration with Vibe System

The JourneyContext works seamlessly with your vibe system:

```tsx
import { useJourney } from "@/context/JourneyContext";
import { useVibeColors } from "@/hooks/useVibeColors";

const VibeAwareComponent = () => {
  const { journeyData } = useJourney();
  const { getVibeColor } = useVibeColors();
  
  const vibeColor = getVibeColor(journeyData.selected_vibe);
  
  return (
    <div style={{ backgroundColor: vibeColor }}>
      <h2>Your {journeyData.selected_vibe} Journey</h2>
      <p>From {journeyData.departure} to {journeyData.destination}</p>
    </div>
  );
};
```

## Error Handling

The `useJourney` hook includes error handling:

```tsx
import { useJourney } from "@/context/JourneyContext";

const SafeComponent = () => {
  try {
    const { journeyData } = useJourney();
    return <div>Journey: {journeyData.departure}</div>;
  } catch (error) {
    // This will happen if the component is used outside JourneyProvider
    return <div>Error: Component must be wrapped in JourneyProvider</div>;
  }
};
```

## Best Practices

1. **Always wrap components in JourneyProvider**: The `useJourney` hook will throw an error if used outside the provider.

2. **Use spread operator for updates**: Always spread the existing journey data when updating:
   ```tsx
   setJourneyData({ ...journeyData, departure: "SYD" });
   ```

3. **Type safety**: The context is fully typed, so you get TypeScript support for all journey data properties.

4. **Conditional rendering**: Check if journey data exists before rendering:
   ```tsx
   if (!journeyData.departure) return null;
   ```

5. **Persistence**: The context maintains state during the session. For persistence across sessions, consider using localStorage or your backend.

## Migration from Props

If you're migrating from prop-based journey data:

**Before:**
```tsx
const MyComponent = ({ journeyData, setJourneyData }) => {
  return <div>{journeyData.departure}</div>;
};
```

**After:**
```tsx
const MyComponent = () => {
  const { journeyData } = useJourney();
  return <div>{journeyData.departure}</div>;
};
```

## Available Components

- `JourneyStepper`: Complete journey planning flow
- `StepDeparture`: Departure/destination input
- `StepVibeSelection`: Vibe selection interface
- `StepSummary`: Journey summary display
- `StepReview`: Final review before confirmation
- `JourneyDataDisplay`: Reusable journey data display component

All these components now use the JourneyContext internally and can be used anywhere in your app without prop passing. 