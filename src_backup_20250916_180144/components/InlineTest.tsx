import React from 'react';

const InlineTest: React.FC = () => {
  return React.createElement('div', {
    style: {
      padding: '20px',
      backgroundColor: 'red',
      color: 'white',
      minHeight: '100vh',
      fontSize: '24px'
    }
  }, [
    React.createElement('h1', { key: 'title' }, 'INLINE TEST'),
    React.createElement('p', { key: 'text' }, 'If you see this, React is working!'),
    React.createElement('div', { key: 'status', style: { marginTop: '20px', padding: '10px', backgroundColor: 'white', color: 'red' } }, 'Status: Rendered')
  ]);
};

export default InlineTest;
