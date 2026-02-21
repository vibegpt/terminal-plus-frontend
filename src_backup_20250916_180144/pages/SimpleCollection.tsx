import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// HARDCODED AMENITIES DATA
const COLLECTIONS_DATA = {
  'hawker-heaven': {
    name: 'Hawker Heaven',
    amenities: [
      { id: 1, name: 'Ya Kun Kaya Toast', desc: 'Traditional breakfast', terminal: 'T3', price: '$' },
      { id: 2, name: 'Killiney Kopitiam', desc: 'Local coffee shop', terminal: 'T3', price: '$' },
      { id: 3, name: 'Toast Box', desc: 'Nanyang coffee', terminal: 'T2', price: '$' },
      { id: 4, name: 'Heavenly Wang', desc: 'Chicken rice', terminal: 'T3', price: '$$' },
      { id: 5, name: 'Old Chang Kee', desc: 'Curry puffs', terminal: 'T3', price: '$' },
      { id: 6, name: 'Bengawan Solo', desc: 'Local cakes', terminal: 'T3', price: '$$' },
      { id: 7, name: 'Bee Cheng Hiang', desc: 'Bak kwa', terminal: 'T3', price: '$$$' },
    ]
  },
  'hidden-gems': {
    name: 'Hidden Gems',
    amenities: [
      { id: 8, name: 'Butterfly Garden', desc: 'Free nature spot', terminal: 'T3', price: 'Free' },
      { id: 9, name: 'Koi Pond', desc: 'Tranquil spot', terminal: 'T1', price: 'Free' },
      { id: 10, name: 'Sunflower Garden', desc: 'Rooftop garden', terminal: 'T2', price: 'Free' },
      { id: 11, name: 'Movie Theatre', desc: '24hr cinema', terminal: 'T3', price: 'Free' },
      { id: 12, name: 'Heritage Zone', desc: 'Cultural exhibits', terminal: 'T4', price: 'Free' },
      { id: 13, name: 'Orchid Garden', desc: 'Beautiful flowers', terminal: 'T2', price: 'Free' },
      { id: 14, name: 'Cactus Garden', desc: 'Desert plants', terminal: 'T1', price: 'Free' },
    ]
  },
  'quiet-zones': {
    name: 'Quiet Zones',
    amenities: [
      { id: 15, name: 'Snooze Lounge', desc: 'Rest area', terminal: 'T1', price: 'Free' },
      { id: 16, name: 'Quiet Corner', desc: 'Peaceful spot', terminal: 'T2', price: 'Free' },
      { id: 17, name: 'Rest Zone', desc: 'Comfortable seating', terminal: 'T3', price: 'Free' },
      { id: 18, name: 'Silent Area', desc: 'No noise zone', terminal: 'T4', price: 'Free' },
    ]
  },
  'quick-bites': {
    name: 'Quick Bites',
    amenities: [
      { id: 19, name: 'McDonald\'s', desc: 'Fast food classics', terminal: 'T3', price: '$' },
      { id: 20, name: 'Subway', desc: 'Fresh sandwiches', terminal: 'T2', price: '$' },
      { id: 21, name: 'KFC', desc: 'Fried chicken', terminal: 'T3', price: '$' },
      { id: 22, name: 'Pizza Hut', desc: 'Pizza and sides', terminal: 'T1', price: '$$' },
      { id: 23, name: 'Burger King', desc: 'Flame-grilled burgers', terminal: 'T3', price: '$' },
      { id: 24, name: 'Domino\'s', desc: 'Quick pizza delivery', terminal: 'T2', price: '$$' },
      { id: 25, name: 'Wendy\'s', desc: 'Fresh beef burgers', terminal: 'T3', price: '$' },
    ]
  },
  'coffee-culture': {
    name: 'Coffee Culture',
    amenities: [
      { id: 26, name: 'Starbucks Reserve', desc: 'Premium coffee experience', terminal: 'T3', price: '$$$' },
      { id: 27, name: 'Coffee Bean & Tea Leaf', desc: 'Classic coffee and tea', terminal: 'T2', price: '$$' },
      { id: 28, name: 'Gloria Jean\'s', desc: 'Australian coffee', terminal: 'T3', price: '$$' },
      { id: 29, name: 'The Coffee Club', desc: 'Café style dining', terminal: 'T1', price: '$$' },
      { id: 30, name: 'Dome Coffee', desc: 'Artisan coffee', terminal: 'T2', price: '$$' },
      { id: 31, name: 'Zarraffa\'s Coffee', desc: 'Premium coffee', terminal: 'T3', price: '$$' },
      { id: 32, name: 'Coffee Club Express', desc: 'Quick coffee fix', terminal: 'T1', price: '$' },
    ]
  },
  'duty-free': {
    name: 'Duty Free',
    amenities: [
      { id: 33, name: 'DFS Galleria', desc: 'Luxury duty-free shopping', terminal: 'T3', price: '$$$' },
      { id: 34, name: 'Lotte Duty Free', desc: 'Korean beauty and fashion', terminal: 'T2', price: '$$$' },
      { id: 35, name: 'Shilla Duty Free', desc: 'Premium Korean brands', terminal: 'T3', price: '$$$' },
      { id: 36, name: 'King Power', desc: 'Thai luxury goods', terminal: 'T1', price: '$$$' },
      { id: 37, name: 'Dufry', desc: 'International duty-free', terminal: 'T2', price: '$$$' },
      { id: 38, name: 'Heinemann', desc: 'European duty-free', terminal: 'T3', price: '$$$' },
      { id: 39, name: 'World Duty Free', desc: 'Global luxury brands', terminal: 'T1', price: '$$$' },
    ]
  }
};

export default function SimpleCollection() {
  const { collectionSlug } = useParams();
  const navigate = useNavigate();
  const collection = COLLECTIONS_DATA[collectionSlug] || COLLECTIONS_DATA['hawker-heaven'];

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#1a1a1a', 
      color: 'white',
      padding: '20px'
    }}>
      <button 
        onClick={() => navigate('/')}
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
        ← Back to Vibes
      </button>

      <h1 style={{ fontSize: '2em', marginBottom: '10px' }}>{collection.name}</h1>
      <p style={{ opacity: 0.7, marginBottom: '30px' }}>
        Showing {Math.min(7, collection.amenities.length)} amenities (Smart7)
      </p>

      {/* Hero Amenity */}
      <div 
        onClick={() => navigate(`/amenity/${collection.amenities[0].id}`)}
        style={{
          padding: '20px',
          backgroundColor: '#2a2a4a',
          border: '3px solid gold',
          borderRadius: '10px',
          marginBottom: '20px',
          cursor: 'pointer'
        }}
      >
        <div style={{ color: 'gold', marginBottom: '10px' }}>⭐ HERO AMENITY</div>
        <h2>{collection.amenities[0].name}</h2>
        <p>{collection.amenities[0].desc}</p>
        <div style={{ marginTop: '10px', fontSize: '0.9em', opacity: 0.8 }}>
          📍 Terminal {collection.amenities[0].terminal} | 💰 {collection.amenities[0].price}
        </div>
      </div>

      {/* Other 6 Amenities */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '15px'
      }}>
        {collection.amenities.slice(1, 7).map((amenity) => (
          <div
            key={amenity.id}
            onClick={() => navigate(`/amenity/${amenity.id}`)}
            style={{
              padding: '15px',
              backgroundColor: '#2a2a2a',
              border: '1px solid #444',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
          >
            <h3 style={{ marginBottom: '5px' }}>{amenity.name}</h3>
            <p style={{ fontSize: '0.9em', opacity: 0.7, marginBottom: '10px' }}>{amenity.desc}</p>
            <div style={{ fontSize: '0.8em', opacity: 0.6 }}>
              📍 T{amenity.terminal} | 💰 {amenity.price}
            </div>
          </div>
        ))}
      </div>

      {/* Rotation indicator */}
      {collection.amenities.length > 7 && (
        <div style={{ 
          marginTop: '30px', 
          textAlign: 'center',
          padding: '15px',
          backgroundColor: '#2a2a2a',
          borderRadius: '8px'
        }}>
          <p>📱 Smart7: Showing best 7 of {collection.amenities.length} total amenities</p>
          <p style={{ fontSize: '0.9em', opacity: 0.7, marginTop: '5px' }}>
            Rotation arrows would go here in full version
          </p>
        </div>
      )}
    </div>
  );
}
