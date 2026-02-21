// src/contexts/TerminalContextManager.tsx
// Re-export everything from the single source of truth
export { 
  TerminalProvider, 
  useTerminalContext,
  useTerminalFilteredData as useTerminalFilter
} from '../context/TerminalContext';
