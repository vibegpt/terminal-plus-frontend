import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// ALL AMENITIES DATA
const ALL_AMENITIES = {
  1: { name: 'Ya Kun Kaya Toast', desc: 'Traditional kaya toast with soft-boiled eggs', terminal: 'T3', price: '$', hours: '24/7', location: 'Level 2, near Gate 45' },
  2: { name: 'Killiney Kopitiam', desc: 'Authentic local coffee and traditional breakfast', terminal: 'T3', price: '$', hours: '24/7', location: 'Level 3, Food Street' },
  3: { name: 'Toast Box', desc: 'Nanyang-style coffee and toast sets', terminal: 'T2', price: '$', hours: '6am-midnight', location: 'Level 2, Departure Hall' },
  4: { name: 'Heavenly Wang', desc: 'Famous for chicken rice and roasted meats', terminal: 'T3', price: '$$', hours: '6am-10pm', location: 'Level 3, Food Gallery' },
  5: { name: 'Old Chang Kee', desc: 'Singapore curry puffs and local snacks', terminal: 'T3', price: '$', hours: '24/7', location: 'Multiple locations' },
  8: { name: 'Butterfly Garden', desc: 'Tropical butterfly sanctuary with over 1000 butterflies', terminal: 'T3', price: 'Free', hours: '24/7', location: 'Level 2 & 3, multiple entrances' },
  9: { name: 'Koi Pond', desc: 'Tranquil spot with beautiful koi fish', terminal: 'T1', price: 'Free', hours: '24/7', location: 'Level 2, Central Area' },
};

export default function SimpleAmenity() {
  const { amenityId } = useParams();
  const navigate = useNavigate();
  const amenity = ALL_AMENITIES[amenityId] || ALL_AMENITIES[1];

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#1a1a1a', 
      color: 'white',
      padding: '20px'
    }}>
      <button 
        onClick={() => navigate(-1)}
        style={{
          padding: '10px 20px',
          backgroundColor: '#333',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        ← Back
      </button>

      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '30px',
        backgroundColor: '#2a2a2a',
        borderRadius: '10px'
      }}>
        <h1 style={{ fontSize: '2em', marginBottom: '20px' }}>{amenity.name}</h1>
        <p style={{ fontSize: '1.2em', marginBottom: '30px' }}>{amenity.desc}</p>
        
        <div style={{ space: '15px' }}>
          <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#1a1a1a', borderRadius: '5px' }}>
            <strong>📍 Location:</strong> Terminal {amenity.terminal}, {amenity.location}
          </div>
          
          <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#1a1a1a', borderRadius: '5px' }}>
            <strong>💰 Price Level:</strong> {amenity.price}
          </div>
          
          <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#1a1a1a', borderRadius: '5px' }}>
            <strong>🕐 Opening Hours:</strong> {amenity.hours}
          </div>
        </div>

        <button 
          onClick={() => navigate('/')}
          style={{
            width: '100%',
            padding: '15px',
            backgroundColor: '#4a9eff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '1.1em',
            marginTop: '30px'
          }}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
