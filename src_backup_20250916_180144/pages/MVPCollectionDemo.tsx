// MVPCollectionDemo.tsx
// Demo page to showcase MVP collection page integration

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MVP_CONFIG, MVP_COLLECTIONS } from '../utils/supabaseMVPIntegration';

export const MVPCollectionDemo: React.FC = () => {
  const navigate = useNavigate();
  const [selectedVibe, setSelectedVibe] = useState('discover');
  const [selectedTerminal, setSelectedTerminal] = useState('SIN-T3');

  const getVibeEmoji = (vibe: string) => {
    const emojiMap: Record<string, string> = {
      'discover': '🔍',
      'quick': '⚡',
      'work': '💼',
      'shop': '🛍️',
      'refuel': '☕',
      'chill': '😌'
    };
    return emojiMap[vibe] || '🎯';
  };

  const getCollectionsForVibe = (vibe: string) => {
    return MVP_COLLECTIONS.filter(c => c.vibe === vibe);
  };

  const handleCollectionClick = (vibe: string, collectionSlug: string) => {
    const url = `/collection/${vibe}/${collectionSlug}?terminal=${selectedTerminal}`;
    navigate(url);
  };

  const handleTerminalChange = (terminal: string) => {
    setSelectedTerminal(terminal);
  };

  return (
    <div className="mvp-collection-demo" style={{ 
      padding: '20px', 
      fontFamily: 'system-ui',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1>🏗️ MVP Collection Page Demo</h1>
      
      <div style={{ 
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#e3f2fd',
        borderRadius: '8px',
        border: '1px solid #2196f3'
      }}>
        <h3 style={{ color: '#1976d2', marginTop: 0 }}>🎯 What This Demo Shows</h3>
        <ul style={{ color: '#1976d2', margin: '10px 0', paddingLeft: '20px' }}>
          <li><strong>Complete Integration:</strong> MVP collection page with Supabase data</li>
          <li><strong>Terminal Selection:</strong> Switch between SIN terminals</li>
          <li><strong>Vibe-Based Navigation:</strong> Browse collections by vibe</li>
          <li><strong>Real-time Data:</strong> Live updates from Supabase</li>
          <li><strong>Responsive Design:</strong> Mobile-friendly interface</li>
        </ul>
      </div>

      {/* Terminal Selection */}
      <div style={{ 
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <h3>✈️ Select Terminal</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {MVP_CONFIG.TERMINALS.map(terminal => (
            <button
              key={terminal}
              onClick={() => handleTerminalChange(terminal)}
              style={{
                padding: '10px 20px',
                border: '1px solid #ddd',
                background: selectedTerminal === terminal ? '#007bff' : 'white',
                color: selectedTerminal === terminal ? 'white' : '#333',
                borderRadius: '5px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {MVP_CONFIG.TERMINAL_NAMES[terminal as keyof typeof MVP_CONFIG.TERMINAL_NAMES]}
            </button>
          ))}
        </div>
        <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
          Selected: <strong>{MVP_CONFIG.TERMINAL_NAMES[selectedTerminal as keyof typeof MVP_CONFIG.TERMINAL_NAMES]}</strong>
        </p>
      </div>

      {/* Vibe Selection */}
      <div style={{ 
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <h3>🎨 Select Vibe</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {Array.from(new Set(MVP_COLLECTIONS.map(c => c.vibe))).map(vibe => (
            <button
              key={vibe}
              onClick={() => setSelectedVibe(vibe)}
              style={{
                padding: '10px 20px',
                border: '1px solid #ddd',
                background: selectedVibe === vibe ? '#28a745' : 'white',
                color: selectedVibe === vibe ? 'white' : '#333',
                borderRadius: '5px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {getVibeEmoji(vibe)} {vibe.charAt(0).toUpperCase() + vibe.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Collections for Selected Vibe */}
      <div style={{ 
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <h3>📚 Collections in {getVibeEmoji(selectedVibe)} {selectedVibe.charAt(0).toUpperCase() + selectedVibe.slice(1)}</h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginTop: '20px'
        }}>
          {getCollectionsForVibe(selectedVibe).map(collection => (
            <div key={collection.id} style={{
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #dee2e6',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '15px' 
              }}>
                <span style={{ fontSize: '24px', marginRight: '10px' }}>
                  {getVibeEmoji(collection.vibe)}
                </span>
                <h4 style={{ margin: 0, color: '#495057' }}>
                  {collection.name}
                </h4>
                {collection.featured && (
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: '12px',
                    backgroundColor: '#ffc107',
                    color: '#856404',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    Featured
                  </span>
                )}
              </div>
              
              <p style={{ 
                margin: '0 0 15px 0', 
                fontSize: '14px', 
                color: '#6c757d',
                lineHeight: '1.5'
              }}>
                {collection.description}
              </p>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                fontSize: '12px',
                marginBottom: '15px'
              }}>
                <div>
                  <strong>Terminals:</strong> {collection.terminals.join(', ')}
                </div>
                <div>
                  <strong>Order:</strong> {collection.display_order}
                </div>
              </div>
              
              <button
                onClick={() => handleCollectionClick(collection.vibe, collection.slug)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
              >
                🚀 View Collection
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Navigation */}
      <div style={{ 
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#fff3cd',
        borderRadius: '8px',
        border: '1px solid #ffc107'
      }}>
        <h3 style={{ color: '#856404', marginTop: 0 }}>⚡ Quick Navigation</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleCollectionClick('discover', 'jewel-discovery')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔍 Jewel Discovery
          </button>
          <button
            onClick={() => handleCollectionClick('quick', 'grab-and-go')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ⚡ Grab & Go
          </button>
          <button
            onClick={() => handleCollectionClick('refuel', 'morning-essentials')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#fd7e14',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ☕ Morning Essentials
          </button>
          <button
            onClick={() => handleCollectionClick('chill', 'lounge-life')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6f42c1',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            😌 Lounge Life
          </button>
        </div>
      </div>

      {/* Technical Details */}
      <div style={{ 
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <h3>🔧 Technical Implementation</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '5px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>📱 React Components</h4>
            <ul style={{ margin: 0, fontSize: '14px', color: '#666' }}>
              <li>MVPCollectionPage - Main collection view</li>
              <li>AmenityCard - Individual amenity display</li>
              <li>TerminalSelector - Terminal switching</li>
              <li>Responsive grid layout</li>
            </ul>
          </div>
          
          <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '5px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>🔄 Data Management</h4>
            <ul style={{ margin: 0, fontSize: '14px', color: '#666' }}>
              <li>useSupabaseAmenities hook</li>
              <li>Real-time subscriptions</li>
              <li>Automatic refresh (1 min)</li>
              <li>Error handling & fallbacks</li>
            </ul>
          </div>
          
          <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '5px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>🎨 UI Features</h4>
            <ul style={{ margin: 0, fontSize: '14px', color: '#666' }}>
              <li>Breadcrumb navigation</li>
              <li>Terminal context display</li>
              <li>Statistics dashboard</li>
              <li>Mobile-responsive design</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div style={{ 
        padding: '20px',
        backgroundColor: '#d4edda',
        borderRadius: '8px',
        border: '1px solid #c3e6cb'
      }}>
        <h3 style={{ color: '#155724', marginTop: 0 }}>🚀 Next Steps</h3>
        <ol style={{ color: '#155724', margin: '10px 0', paddingLeft: '20px' }}>
          <li><strong>Configure Supabase:</strong> Add your database credentials</li>
          <li><strong>Set up database:</strong> Create amenities table with required schema</li>
          <li><strong>Test integration:</strong> Use the demo buttons above</li>
          <li><strong>Customize styling:</strong> Modify CSS to match your brand</li>
          <li><strong>Add analytics:</strong> Track user interactions and performance</li>
        </ol>
      </div>
    </div>
  );
};

export default MVPCollectionDemo;
