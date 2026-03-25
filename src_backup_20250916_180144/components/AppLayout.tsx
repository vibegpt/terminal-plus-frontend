import React from 'react';
import { Outlet } from 'react-router-dom';
import TestBackendChat from './TestBackendChat';
import DiagnosticCheck from './DiagnosticCheck';
import ContextDebugHelper from './ContextDebugHelper';

const AppLayout: React.FC = () => {
  return (
    <>
      {/* Main app content */}
      <Outlet />
      
      {/* Development tools - Remove in production */}
      <TestBackendChat />
      <DiagnosticCheck />
      
      {/* Context Debug Helper - Development only */}
      {import.meta.env.DEV && <ContextDebugHelper />}
    </>
  );
};

export default AppLayout;
