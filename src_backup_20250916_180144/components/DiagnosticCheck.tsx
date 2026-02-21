import React, { useEffect, useState } from 'react';

export default function DiagnosticCheck() {
  const [cssLoaded, setCssLoaded] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  
  useEffect(() => {
    // Check if Adaptive Luxe CSS variables are loaded
    const rootStyles = getComputedStyle(document.documentElement);
    const luxeColor = rootStyles.getPropertyValue('--luxe-midnight');
    setCssLoaded(!!luxeColor);
    
    // Get current path
    setCurrentPath(window.location.pathname);
    
    // Listen for path changes
    const handlePathChange = () => {
      setCurrentPath(window.location.pathname);
    };
    
    window.addEventListener('popstate', handlePathChange);
    return () => window.removeEventListener('popstate', handlePathChange);
  }, []);
  
  // Also update on any click
  useEffect(() => {
    const handleClick = () => {
      setTimeout(() => {
        setCurrentPath(window.location.pathname);
      }, 100);
    };
    
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      padding: '15px',
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px',
      fontFamily: 'monospace'
    }}>
      <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#00FF88' }}>
        🔍 Diagnostic Info
      </div>
      <div>📍 Path: {currentPath || '/'}</div>
      <div>🎨 Adaptive Luxe CSS: {cssLoaded ? '✅ Loaded' : '❌ Not Loaded'}</div>
      <div>🌐 Port: {window.location.port}</div>
      <div>⚡ Vite Dev Server</div>
      <div style={{ marginTop: '10px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Quick Test:</div>
        <a href="/collection/discover/hidden-gems" style={{ color: '#00FF88', display: 'block', textDecoration: 'underline' }}>
          → Adaptive Luxe Test
        </a>
        <a href="/test" style={{ color: '#00FF88', display: 'block', textDecoration: 'underline' }}>
          → Navigation Test
        </a>
      </div>
      <div style={{ marginTop: '10px', fontSize: '10px', color: '#888' }}>
        If CSS not loaded, try:<br/>
        1. Stop server (Ctrl+C)<br/>
        2. Run: rm -rf node_modules/.vite<br/>
        3. Run: npm run dev
      </div>
    </div>
  );
}
