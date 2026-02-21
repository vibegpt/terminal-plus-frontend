// Debug component to test routing
import React from 'react';
import { useParams } from 'react-router-dom';

const DebugRoute: React.FC = () => {
  const params = useParams();
  
  return (
    <div style={{ padding: '20px', color: 'white', background: '#333' }}>
      <h1>Debug Route Info</h1>
      <h2>Current Path: {window.location.pathname}</h2>
      <h3>Route Params:</h3>
      <pre>{JSON.stringify(params, null, 2)}</pre>
      <h3>Session Storage:</h3>
      <pre>
        {JSON.stringify({
          selectedCollection: sessionStorage.getItem('selectedCollection'),
          journeyContext: sessionStorage.getItem('journeyContext')
        }, null, 2)}
      </pre>
    </div>
  );
};

export default DebugRoute;
