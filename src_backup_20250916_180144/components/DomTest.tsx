import React, { useEffect } from 'react';

const DomTest: React.FC = () => {
  useEffect(() => {
    // Direct DOM manipulation
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `
        <div style="padding: 20px; background-color: green; color: white; min-height: 100vh; font-size: 24px;">
          <h1>DOM TEST</h1>
          <p>If you see this, the component is mounting!</p>
          <div style="margin-top: 20px; padding: 10px; background-color: white; color: green;">
            Status: DOM Manipulated
          </div>
        </div>
      `;
    }
  }, []);

  return (
    <div style={{ padding: '20px', backgroundColor: 'blue', color: 'white', minHeight: '100vh' }}>
      <h1>React Component</h1>
      <p>This should be replaced by DOM manipulation</p>
    </div>
  );
};

export default DomTest;
