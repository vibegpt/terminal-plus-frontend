import React, { createContext, useContext, useState } from 'react';

interface VibeContextType {
  selectedVibe: string;
  setSelectedVibe: (vibe: string) => void;
  vibeHistory: string[];
  addVibeToHistory: (vibe: string) => void;
}

const VibeContext = createContext<VibeContextType | undefined>(undefined);

export const VibeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedVibe, setSelectedVibe] = useState('discover');
  const [vibeHistory, setVibeHistory] = useState<string[]>([]);
  
  const addVibeToHistory = (vibe: string) => {
    setVibeHistory(prev => {
      const filtered = prev.filter(v => v !== vibe);
      return [vibe, ...filtered].slice(0, 5); // Keep last 5 vibes
    });
  };
  
  return (
    <VibeContext.Provider value={{ 
      selectedVibe, 
      setSelectedVibe, 
      vibeHistory, 
      addVibeToHistory 
    }}>
      {children}
    </VibeContext.Provider>
  );
};

export const useVibeContext = () => {
  const context = useContext(VibeContext);
  if (!context) {
    throw new Error('useVibeContext must be used within VibeProvider');
  }
  return context;
}; 