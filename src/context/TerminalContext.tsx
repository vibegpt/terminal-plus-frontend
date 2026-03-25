// src/context/TerminalContext.tsx
import React, { createContext, useContext, useState, useMemo } from 'react';

interface TerminalContextValue {
  airport: string | null;
  terminal: string | null;
  setAirport: (airport: string | null) => void;
  setTerminal: (terminal: string | null) => void;
}

const TerminalContext = createContext<TerminalContextValue | undefined>(undefined);

export const TerminalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to Singapore T3 for MVP
  const [airport, setAirport] = useState<string | null>('SIN');
  const [terminal, setTerminal] = useState<string | null>('SIN-T3');
  
  const value = useMemo(
    () => ({ airport, terminal, setAirport, setTerminal }), 
    [airport, terminal]
  );
  
  return (
    <TerminalContext.Provider value={value}>
      {children}
    </TerminalContext.Provider>
  );
};

export const useTerminalContext = () => {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error('useTerminalContext must be used within TerminalProvider');
  }
  return context;
};

// Export aliases for backward compatibility
export const useTerminal = useTerminalContext;
export const useTerminalCode = useTerminalContext;

// Additional exports that existing components expect
export const useTerminalFilteredData = <T extends { terminal_code?: string }>(
  data: T[],
  includeAllIfNoTerminal: boolean = true
): T[] => {
  const { terminal } = useTerminalContext();
  
  return React.useMemo(() => {
    if (!terminal && includeAllIfNoTerminal) {
      return data;
    }
    
    if (!terminal) {
      return [];
    }
    
    return data.filter(item => item.terminal_code === terminal);
  }, [data, terminal, includeAllIfNoTerminal]);
};

// TerminalStorage class for backward compatibility
export class TerminalStorage {
  static getSelectedTerminal(): string | null {
    try {
      return localStorage.getItem('selectedTerminal');
    } catch {
      return null;
    }
  }

  static setSelectedTerminal(code: string | null): void {
    try {
      if (code) {
        localStorage.setItem('selectedTerminal', code);
      } else {
        localStorage.removeItem('selectedTerminal');
      }
    } catch (e) {
      console.warn('Failed to persist terminal selection:', e);
    }
  }

  static clearAll(): void {
    try {
      localStorage.removeItem('selectedTerminal');
    } catch (e) {
      console.warn('Failed to clear terminal storage:', e);
    }
  }
}

export default TerminalProvider;
