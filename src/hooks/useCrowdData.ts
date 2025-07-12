import { useState } from 'react';

// Placeholder for MVP: no crowd/queue data
export const useCrowdData = () => {
  return {
    crowdData: {},
    loading: false,
    error: null,
    updateAmenityCrowdData: () => {},
    refreshCrowdData: () => {},
    getAmenityCrowdData: () => undefined,
    getAmenityCrowdLevel: () => undefined,
    getAmenityQueueTime: () => undefined,
    getAmenityCapacity: () => undefined,
  };
}; 