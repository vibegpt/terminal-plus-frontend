import React from 'react';
import { useLocation, useParams } from 'react-router-dom';

export function DebugTest() {
  const location = useLocation();
  const params = useParams();
  
  // Test what's available
  const [checks, setChecks] = React.useState<Record<string, boolean>>({});
  
  React.useEffect(() => {
    const results: Record<string, boolean> = {
      'React Mounted': true,
      'Router Working': !!location,
      'Params Working': !!params,
    };
    
    // Test if contexts exist (won't crash if they don't)
    try {
      // Test for common contexts - these will fail silently if not available
      results['Window Object'] = typeof window !== 'undefined';
      results['Local Storage'] = !!window.localStorage;
    } catch (e) {
      console.error('Context check failed:', e);
    }
    
    setChecks(results);
    console.log('Debug Test Results:', results);
  }, [location, params]);
  
  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#1a1a1a',
      color: 'white',
      fontFamily: 'monospace'
    }}>
      <h1 style={{ color: '#00ff00' }}>🔧 Debug Test Component</h1>
      <p>If you see this, React is working!</p>
      
      <div style={{ marginTop: '20px' }}>
        <h2>System Checks:</h2>
        {Object.entries(checks).map(([key, value]) => (
          <div key={key} style={{ margin: '5px 0' }}>
            <span>{value ? '✅' : '❌'}</span> {key}
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Route Info:</h2>
        <pre style={{ backgroundColor: '#333', padding: '10px' }}>
          Path: {location.pathname}
          {'\n'}Params: {JSON.stringify(params, null, 2)}
        </pre>
      </div>
      
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#444' }}>
        <p>Check browser console for errors!</p>
        <button 
          onClick={() => window.location.href = '/'}
          style={{
            padding: '10px 20px',
            backgroundColor: '#00ff00',
            color: 'black',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}
