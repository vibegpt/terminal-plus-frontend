// Example usage of LocationDetectionService
import { LocationDetectionService } from './LocationDetectionService';

// Example 1: Detect current location
async function detectCurrentLocation() {
  try {
    const location = await LocationDetectionService.detectLocation();
    console.log('Location detected:', location);
    
    // Get user-friendly description
    const description = LocationDetectionService.getLocationDescription(location);
    console.log('You are:', description);
    
    // Check if at airport
    if (location.isAtAirport) {
      console.log(`Welcome to ${location.airport}!`);
      
      if (location.terminal) {
        console.log(`You're at ${location.terminal}`);
        
        // Show walking distances to other terminals
        if (location.walkingDistances) {
          console.log('Walking distances to other terminals:');
          Object.entries(location.walkingDistances).forEach(([terminal, distance]) => {
            if (distance > 0) {
              console.log(`${terminal}: ${distance} minutes`);
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Location detection failed:', error);
  }
}

// Example 2: Get arrival pattern based on time
function getCurrentArrivalPattern() {
  const pattern = LocationDetectionService.getArrivalPattern();
  console.log('Current arrival pattern:', pattern);
  
  console.log(`Time slot: ${pattern.timeSlot}`);
  console.log(`Likely origins: ${pattern.likely_origins.join(', ')}`);
  console.log(`Example airports: ${pattern.examples.join(', ')}`);
  console.log(`User state: ${pattern.user_state}`);
  console.log(`Vibe priorities: ${pattern.vibe_priority.join(', ')}`);
}

// Example 3: Manual location setting (for testing)
function setManualLocation(terminal: string) {
  const manualResult = {
    method: 'MANUAL' as const,
    isAtAirport: true,
    airport: 'SIN',
    terminal,
    confidence: 100,
    walkingDistances: LocationDetectionService['calculateWalkingDistances'](terminal)
  };
  
  console.log('Manual location set:', manualResult);
  return manualResult;
}

// Example 4: Integration with other services
async function getLocationBasedRecommendations() {
  const location = await LocationDetectionService.detectLocation();
  const pattern = LocationDetectionService.getArrivalPattern();
  
  // Combine location and arrival pattern for smart recommendations
  const context = {
    location,
    arrivalPattern: pattern,
    timestamp: new Date().toISOString()
  };
  
  console.log('Context for recommendations:', context);
  
  // This could be passed to recommendation services
  // const recommendations = await recommendationService.getRecommendations(context);
  
  return context;
}

// Export examples for use in other files
export {
  detectCurrentLocation,
  getCurrentArrivalPattern,
  setManualLocation,
  getLocationBasedRecommendations
};
