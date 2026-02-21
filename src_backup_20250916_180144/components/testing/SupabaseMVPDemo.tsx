// SupabaseMVPDemo.tsx
// Demo component for Supabase MVP integration

import React, { useState, useEffect } from 'react';
import { MVP_CONFIG, MVP_COLLECTIONS } from '../../utils/supabaseMVPIntegration';

interface DemoState {
  selectedTerminal: string;
  selectedVibe: string;
  selectedCollection: string;
  showMockData: boolean;
}

export const SupabaseMVPDemo: React.FC = () => {
  const [state, setState] = useState<DemoState>({
    selectedTerminal: MVP_CONFIG.DEFAULT_TERMINAL,
    selectedVibe: 'discover',
    selectedCollection: 'jewel-discovery',
    showMockData: false
  });

  const [mockAmenities, setMockAmenities] = useState<any[]>([]);

  // Generate mock amenity data for demo
  useEffect(() => {
    if (state.showMockData) {
      const mockData = [
        {
          id: 1,
          name: 'Starbucks T1',
          description: 'Coffee and snacks',
          vibe_tags: 'quick,refuel',
          terminal_code: 'SIN-T1',
          price_level: '$$',
          opening_hours: '0500-2300',
          booking_required: false,
          available_in_tr: true
        },
        {
          id: 2,
          name: 'Jewel Canopy Park',
          description: 'Nature park and attractions',
          vibe_tags: 'discover,chill',
          terminal_code: 'SIN-JEWEL',
          price_level: '$$$',
          opening_hours: '0900-2200',
          booking_required: true,
          available_in_tr: false
        },
        {
          id: 3,
          name: 'Grab & Go Express',
          description: 'Quick food and beverages',
          vibe_tags: 'quick,grab',
          terminal_code: 'SIN-T2',
          price_level: '$',
          opening_hours: '24/7',
          booking_required: false,
          available_in_tr: true
        },
        {
          id: 4,
          name: 'Business Lounge',
          description: 'Premium lounge access',
          vibe_tags: 'chill,work',
          terminal_code: 'SIN-T3',
          price_level: '$$$$',
          opening_hours: '24/7',
          booking_required: true,
          available_in_tr: true
        },
        {
          id: 5,
          name: 'DFS Duty Free',
          description: 'Shopping and retail',
          vibe_tags: 'shop,retail',
          terminal_code: 'SIN-T4',
          price_level: '$$',
          opening_hours: '0700-2300',
          booking_required: false,
          available_in_tr: true
        }
      ];

      // Filter by selected terminal and vibe
      const filtered = mockData.filter(amenity => {
        const terminalMatch = !state.selectedTerminal || amenity.terminal_code === state.selectedTerminal;
        const vibeMatch = !state.selectedVibe || amenity.vibe_tags.includes(state.selectedVibe);
        return terminalMatch && vibeMatch;
      });

      setMockAmenities(filtered);
    } else {
      setMockAmenities([]);
    }
  }, [state.selectedTerminal, state.selectedVibe, state.showMockData]);

  const getCollectionsForVibe = (vibe: string) => {
    return MVP_COLLECTIONS.filter(c => c.vibe === vibe);
  };

  const getTerminalName = (code: string) => {
    return MVP_CONFIG.TERMINAL_NAMES[code as keyof typeof MVP_CONFIG.TERMINAL_NAMES] || code;
  };

  const getPriceDisplay = (priceLevel: string) => {
    const priceMap: Record<string, string> = {
      '$': 'Budget',
      '$$': 'Moderate',
      '$$$': 'Premium',
      '$$$$': 'Luxury'
    };
    return priceMap[priceLevel] || priceLevel;
  };

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

  return (
    <div className="supabase-mvp-demo" style={{ 
      padding: '20px', 
      fontFamily: 'system-ui',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1>🏗️ Supabase MVP Integration Demo</h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '300px 1fr', 
        gap: '20px',
        marginBottom: '20px'
      }}>
        {/* Configuration Panel */}
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          height: 'fit-content'
        }}>
          <h3>⚙️ Configuration</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Airport:
            </label>
            <div style={{ 
              padding: '8px', 
              backgroundColor: '#e9ecef', 
              borderRadius: '4px',
              fontFamily: 'monospace'
            }}>
              {MVP_CONFIG.AIRPORT_CODE}
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Terminal:
            </label>
            <select
              value={state.selectedTerminal}
              onChange={(e) => setState(prev => ({ ...prev, selectedTerminal: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            >
              {MVP_CONFIG.TERMINALS.map(terminal => (
                <option key={terminal} value={terminal}>
                  {getTerminalName(terminal)}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Vibe:
            </label>
            <select
              value={state.selectedVibe}
              onChange={(e) => setState(prev => ({ ...prev, selectedVibe: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            >
              {Array.from(new Set(MVP_COLLECTIONS.map(c => c.vibe))).map(vibe => (
                <option key={vibe} value={vibe}>
                  {getVibeEmoji(vibe)} {vibe.charAt(0).toUpperCase() + vibe.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Collection:
            </label>
            <select
              value={state.selectedCollection}
              onChange={(e) => setState(prev => ({ ...prev, selectedCollection: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            >
              {getCollectionsForVibe(state.selectedVibe).map(collection => (
                <option key={collection.slug} value={collection.slug}>
                  {collection.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Show Mock Data:
            </label>
            <input
              type="checkbox"
              checked={state.showMockData}
              onChange={(e) => setState(prev => ({ ...prev, showMockData: e.target.checked }))}
              style={{ marginLeft: '10px' }}
            />
          </div>
        </div>

        {/* Collections Overview */}
        <div>
          <h3>📚 Collections Overview</h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '15px'
          }}>
            {MVP_COLLECTIONS.map(collection => (
              <div key={collection.id} style={{
                padding: '15px',
                backgroundColor: collection.featured ? '#fff3cd' : '#f8f9fa',
                borderRadius: '8px',
                border: collection.featured ? '2px solid #ffc107' : '1px solid #dee2e6'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '10px' 
                }}>
                  <span style={{ fontSize: '20px', marginRight: '8px' }}>
                    {getVibeEmoji(collection.vibe)}
                  </span>
                  <h4 style={{ margin: 0, color: collection.featured ? '#856404' : '#495057' }}>
                    {collection.name}
                  </h4>
                  {collection.featured && (
                    <span style={{
                      marginLeft: 'auto',
                      fontSize: '12px',
                      backgroundColor: '#ffc107',
                      color: '#856404',
                      padding: '2px 6px',
                      borderRadius: '10px'
                    }}>
                      Featured
                    </span>
                  )}
                </div>
                
                <p style={{ 
                  margin: '0 0 10px 0', 
                  fontSize: '14px', 
                  color: '#6c757d' 
                }}>
                  {collection.description}
                </p>
                
                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                  <strong>Vibe:</strong> {collection.vibe}<br />
                  <strong>Terminals:</strong> {collection.terminals.join(', ')}<br />
                  <strong>Order:</strong> {collection.display_order}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mock Amenities Display */}
      {state.showMockData && (
        <div style={{ marginTop: '20px' }}>
          <h3>🏪 Mock Amenities ({mockAmenities.length})</h3>
          
          {mockAmenities.length > 0 ? (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '15px'
            }}>
              {mockAmenities.map(amenity => (
                <div key={amenity.id} style={{
                  padding: '15px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '10px'
                  }}>
                    <h4 style={{ margin: 0, color: '#495057' }}>
                      {amenity.name}
                    </h4>
                    <span style={{
                      fontSize: '12px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px'
                    }}>
                      {getPriceDisplay(amenity.price_level)}
                    </span>
                  </div>
                  
                  <p style={{ 
                    margin: '0 0 10px 0', 
                    fontSize: '14px', 
                    color: '#6c757d' 
                  }}>
                    {amenity.description}
                  </p>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    fontSize: '12px'
                  }}>
                    <div>
                      <strong>Terminal:</strong> {getTerminalName(amenity.terminal_code)}
                    </div>
                    <div>
                      <strong>Hours:</strong> {amenity.opening_hours}
                    </div>
                    <div>
                      <strong>Vibes:</strong> {amenity.vibe_tags}
                    </div>
                    <div>
                      <strong>Booking:</strong> {amenity.booking_required ? 'Required' : 'Not Required'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              padding: '20px', 
              textAlign: 'center', 
              color: '#6c757d',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              No amenities found for the selected terminal and vibe combination.
            </div>
          )}
        </div>
      )}

      {/* Terminal Statistics */}
      <div style={{ marginTop: '20px' }}>
        <h3>📊 Terminal Statistics</h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          {MVP_CONFIG.TERMINALS.map(terminal => (
            <div key={terminal} style={{
              padding: '15px',
              backgroundColor: '#e9ecef',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#495057' }}>
                {getTerminalName(terminal)}
              </div>
              <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
                {terminal}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Integration Notes */}
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: '#d1ecf1', 
        borderRadius: '8px',
        border: '1px solid #bee5eb'
      }}>
        <h4 style={{ color: '#0c5460', marginTop: 0 }}>🔗 Integration Notes</h4>
        <ul style={{ color: '#0c5460', margin: '10px 0', paddingLeft: '20px' }}>
          <li>This demo shows the MVP configuration for Singapore Changi Airport</li>
          <li>Collections are organized by vibes (discover, quick, work, shop, refuel, chill)</li>
          <li>Each collection has specific terminal availability and display order</li>
          <li>The mock data demonstrates filtering by terminal and vibe tags</li>
          <li>In production, this would connect to your Supabase amenities table</li>
          <li>Real-time updates are supported via Supabase subscriptions</li>
        </ul>
      </div>
    </div>
  );
};
