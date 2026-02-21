
import React from 'react';
import { TerminalProvider } from './context/TerminalContext';
import { VibeProvider } from './context/VibeContext';
import { JourneyProvider } from './context/JourneyContext';
import AppRoutes from './components/AppRoutes';

function App() {
  return (
    <TerminalProvider>
      <VibeProvider>
        <JourneyProvider>
          <AppRoutes />
        </JourneyProvider>
      </VibeProvider>
    </TerminalProvider>
  );
}

export default App;

