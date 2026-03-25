import React, { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function TestBackendChat() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const testBackend = async () => {
    if (!message.trim()) return;
    
    setLoading(true);
    setResponse('');
    
    try {
      console.log('🚀 Sending to backend:', API_URL + '/ask');
      
      const res = await fetch(`${API_URL}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();
      console.log('✅ Backend response:', data);
      
      if (data.status === 'success') {
        setResponse(data.response);
      } else {
        setResponse('Error: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Backend error:', error);
      setResponse('Failed to connect to backend. Is it running on port 3001?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '350px',
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      border: '2px solid #e5e7eb',
      zIndex: 1000
    }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: 'bold' }}>
        🧪 Backend Test Chat
      </h3>
      
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && testBackend()}
          placeholder="Test message (try: 'Hello')"
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            fontSize: '14px'
          }}
        />
      </div>
      
      <button
        onClick={testBackend}
        disabled={loading || !message.trim()}
        style={{
          width: '100%',
          padding: '8px',
          backgroundColor: loading ? '#9ca3af' : '#3b82f6',
          color: 'white',
          borderRadius: '6px',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: '500'
        }}
      >
        {loading ? 'Testing...' : 'Test Backend Connection'}
      </button>
      
      {response && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: response.startsWith('Error') ? '#fee2e2' : '#f0f9ff',
          borderRadius: '6px',
          fontSize: '13px',
          color: response.startsWith('Error') ? '#991b1b' : '#1e40af'
        }}>
          <strong>Response:</strong><br />
          {response}
        </div>
      )}
      
      <div style={{
        marginTop: '10px',
        fontSize: '11px',
        color: '#6b7280',
        textAlign: 'center'
      }}>
        Backend: {API_URL}
      </div>
    </div>
  );
}
