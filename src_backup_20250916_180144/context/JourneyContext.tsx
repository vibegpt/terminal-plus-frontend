import React, { createContext, useContext, useState } from 'react';

interface JourneyContextType {
  currentJourney: string | null;
  setCurrentJourney: (journey: string | null) => void;
  journeyHistory: string[];
  addJourneyToHistory: (journey: string) => void;
  clearJourneyHistory: () => void;
}

const JourneyContext = createContext<JourneyContextType | undefined>(undefined);

export const JourneyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentJourney, setCurrentJourney] = useState<string | null>(null);
  const [journeyHistory, setJourneyHistory] = useState<string[]>([]);
  
  const addJourneyToHistory = (journey: string) => {
    setJourneyHistory(prev => {
      const filtered = prev.filter(j => j !== journey);
      return [journey, ...filtered].slice(0, 10); // Keep last 10 journeys
    });
  };
  
  const clearJourneyHistory = () => {
    setJourneyHistory([]);
  };
  
  return (
    <JourneyContext.Provider value={{ 
      currentJourney, 
      setCurrentJourney, 
      journeyHistory, 
      addJourneyToHistory,
      clearJourneyHistory
    }}>
      {children}
    </JourneyContext.Provider>
  );
};

export const useJourneyContext = () => {
  const context = useContext(JourneyContext);
  if (!context) {
    throw new Error('useJourneyContext must be used within JourneyProvider');
  }
  return context;
}; 