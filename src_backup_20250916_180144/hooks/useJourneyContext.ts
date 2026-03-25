import { useJourneyContext as useOriginalJourneyContext } from '../context/JourneyContext';

// Legacy compatibility hook that provides journey data in the expected format
export function useJourneyContext() {
  const { state, actions } = useOriginalJourneyContext();
  
  // Transform the complex flight data into legacy format
  const legacyJourneyData = {
    from: state.flightData?.segments?.[0]?.departure?.airport || '',
    to: state.flightData?.segments?.[state.flightData.segments?.length - 1]?.arrival?.airport || '',
    flightNumber: state.flightData?.flightNumber || '',
    layover: state.flightData?.segments?.[1]?.departure?.airport || '',
    selected_vibe: state.preferences?.selectedVibe || 'Comfort',
    departure: state.flightData?.segments?.[0]?.departure?.airport || '',
    destination: state.flightData?.segments?.[state.flightData.segments?.length - 1]?.arrival?.airport || '',
    terminal: state.journeyScope?.currentSegment?.terminal || 'T1',
    flightDate: state.flightData?.segments?.[0]?.departure?.scheduled ? 
      new Date(state.flightData.segments[0].departure.scheduled).toISOString().split('T')[0] : '',
    departure_time: state.flightData?.segments?.[0]?.departure?.scheduled || null,
    boarding_time: state.timeContext?.boardingTime?.toISOString() || null,
  };

  return {
    journeyData: legacyJourneyData,
    setJourneyData: (updates: any) => {
      // Update preferences with new vibe
      if (updates.selected_vibe) {
        actions.updatePreferences({ selectedVibe: updates.selected_vibe });
      }
      
      // For other updates, we'd need to update the flight data structure
      // This is a simplified version - in a real app you'd want more sophisticated mapping
      console.log('Legacy setJourneyData called with:', updates);
    },
    state,
    actions
  };
}
