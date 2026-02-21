// hooks/useMultiSegmentReturn.ts - Handle returns from vibe selection to multi-segment planner

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function useMultiSegmentReturn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const returnTo = searchParams.get('returnTo');
  const segmentIndex = searchParams.get('segment');
  const context = searchParams.get('context');
  const airport = searchParams.get('airport');
  const terminal = searchParams.get('terminal');

  // Function to return to multi-segment planner with completion data
  const returnToMultiSegment = (selectedVibe: string, savedAmenities: string[] = []) => {
    if (returnTo === 'multi-segment' && segmentIndex !== null) {
      // Save completion data to session storage
      sessionStorage.setItem('completedSegmentIndex', segmentIndex);
      sessionStorage.setItem('selectedVibe', selectedVibe);
      sessionStorage.setItem('savedAmenities', JSON.stringify(savedAmenities));
      
      // Navigate back to multi-segment planner
      navigate('/multi-segment-planner');
      return true; // Indicates navigation happened
    }
    return false; // Normal flow continues
  };

  // Function to check if we're in multi-segment mode
  const isMultiSegmentMode = () => {
    return returnTo === 'multi-segment' && segmentIndex !== null;
  };

  // Function to get segment context info
  const getSegmentInfo = () => {
    if (!isMultiSegmentMode()) return null;
    
    return {
      segmentIndex: parseInt(segmentIndex || '0'),
      context: context as 'departure' | 'transit' | 'arrival',
      airport: airport || '',
      terminal: terminal || '',
      isMultiSegment: true
    };
  };

  return {
    returnToMultiSegment,
    isMultiSegmentMode,
    getSegmentInfo
  };
}
