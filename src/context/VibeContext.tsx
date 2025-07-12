import React, { createContext, useContext, useState } from 'react';

export type VibeType = 'Chill' | 'Explore' | 'Work' | 'Quick' | 'Refuel' | 'Comfort' | 'Shop';

interface VibeContextProps {
  selectedVibe: VibeType | null;
  setVibe: (vibe: VibeType) => void;
}

export const VibeContext = createContext<VibeContextProps>({
  selectedVibe: null,
  setVibe: () => {},
});

export const VibeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedVibe, setSelectedVibe] = useState<VibeType | null>(null);

  return (
    <VibeContext.Provider value={{ selectedVibe, setVibe: setSelectedVibe }}>
      {children}
    </VibeContext.Provider>
  );
};

export const useVibe = () => useContext(VibeContext); 