// utils/index.ts - Barrel export for all utilities
// Centralized utility imports for cleaner, more maintainable code

// Recommendation utilities
export {
  calculateLayoverDuration,
  determineJourneyType,
  calculateStressLevel,
  calculateRelevanceScore,
  generatePersonalizedReason,
  calculateOptimalTiming,
  evaluateCircadianFit,
  shouldUseSelectedVibe,
  isLiveContext,
  filterRecommendationsByCategory,
  filterRecommendationsForTimeframe,
  getBodyClockRecommendations,
  getUrgentRecommendations
} from './recommendationUtils';

// Transit utilities
export {
  generateTransitPlan,
  createTimelineFromSteps,
  calculateTotalJourneyTime,
  getNextDepartureTime,
  isTransitRequired,
  getTransitDuration,
  createMultiAirportTimeline,
  validateTransitPlan
} from './transitUtils';

// Flight utilities
export {
  getBoardingStatus,
  getFlightDuration,
  calculateFlightDuration,
  isFlightDelayed,
  getFlightStatus,
  adjustForTimezone,
  formatFlightTime,
  getTimeUntilFlight
} from './flightUtils';

// Storage utilities
export {
  StorageService,
  storageService,
  saveJourneyData,
  getJourneyData,
  saveUserPreferences,
  getUserPreferences,
  saveAmenityHistory,
  getAmenityHistory,
  clearJourneyData,
  clearAllData
} from './storageUtils';

// Terminal utilities
export {
  resolveTerminal,
  extractAirlineCode,
  isInternationalFlight,
  checkTransitOrSelfTransfer,
  getTerminalInfo,
  calculateTerminalDistance,
  estimateWalkingTime,
  getTerminalFromGate
} from './terminalUtils';

// Legacy terminal utilities (for backwards compatibility)
export { guessTerminal } from './terminalGuesses';

// Legacy transit utilities (for backwards compatibility)
export { getBodyClockVibes } from './generateTransitPlan_withAmenities_T1';

// Journey utilities
export {
  migrateJourneyData,
  validateJourneyData,
  getJourneyDataFromStorage,
  debugJourneyData,
  clearAllJourneyData
} from './journeyUtils';

// Analytics utilities
export {
  trackEvent,
  trackVibeSelected,
  trackJourneySaved,
  trackAmenityViewed,
  trackPageView,
  trackUserAction,
  logEvent
} from './analyticsUtils';

// Re-export types for convenience
export type { JourneyData, UserPreferences } from '@/types/journey.types';
export type { Amenity } from '@/types/amenity.types'; 