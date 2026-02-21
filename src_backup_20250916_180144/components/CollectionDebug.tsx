import React from 'react';
import { useParams } from 'react-router-dom';

export function CollectionDebug() {
  const { collectionSlug, vibe } = useParams();
  const [collectionData, setCollectionData] = React.useState<any>(null);
  const [error, setError] = React.useState<string>('');
  
  React.useEffect(() => {
    // Test what collections exist
    const testCollections = {
      'refuel': ['hawker-heaven', 'quick-bites', 'coffee-culture', 'fine-dining'],
      'discover': ['hidden-gems', 'instagram-spots', 'art-culture'],
      'chill': ['quiet-zones', 'garden-spaces', 'coffee-chill'],
      'comfort': ['sleep-pods', 'spa-wellness', 'premium-lounges'],
      'work': ['business-centers', 'meeting-rooms', 'work-lounges'],
      'shop': ['duty-free', 'local-finds', 'luxury-brands'],
      'quick': ['24-7-essentials', 'grab-and-go', 'express-services']
    };
    
    console.log('CollectionDebug - Looking for:', { collectionSlug, vibe });
    
    // Try to find the collection
    let found = false;
    for (const [vibeKey, collections] of Object.entries(testCollections)) {
      if (collections.includes(collectionSlug || '')) {
        found = true;
        setCollectionData({
          vibe: vibeKey,
          collection: collectionSlug,
          message: `Found in ${vibeKey} vibe!`
        });
        break;
      }
    }
    
    if (!found) {
      setError(`Collection "${collectionSlug}" not found in any vibe`);
    }
  }, [collectionSlug, vibe]);
  
  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#1a1a1a',
      color: 'white',
      minHeight: '100vh',
      fontFamily: 'monospace'
    }}>
      <h1>🔍 Collection Debug</h1>
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#333' }}>
        <h2>Route Params:</h2>
        <pre>{JSON.stringify({ collectionSlug, vibe }, null, 2)}</pre>
      </div>
      
      {collectionData && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#2a4a2a',
          border: '2px solid #00ff00'
        }}>
          <h2>✅ Collection Found:</h2>
          <pre>{JSON.stringify(collectionData, null, 2)}</pre>
          <p>This collection belongs to the <strong>{collectionData.vibe}</strong> vibe</p>
        </div>
      )}
      
      {error && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#4a2a2a',
          border: '2px solid #ff0000'
        }}>
          <h2>❌ Error:</h2>
          <p>{error}</p>
        </div>
      )}
      
      <div style={{ marginTop: '30px' }}>
        <h3>Test Different Collections:</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {['hawker-heaven', 'hidden-gems', 'quiet-zones', 'duty-free'].map(slug => (
            <button
              key={slug}
              onClick={() => window.location.href = `/collection/${slug}`}
              style={{
                padding: '10px 20px',
                backgroundColor: '#444',
                color: 'white',
                border: '1px solid #666',
                cursor: 'pointer'
              }}
            >
              Test: {slug}
            </button>
          ))}
        </div>
      </div>
      
      <div style={{ marginTop: '30px' }}>
        <h3>Correct URLs for Hawker Heaven:</h3>
        <div style={{ backgroundColor: '#2a2a4a', padding: '15px' }}>
          <p>Since Hawker Heaven is in Refuel vibe, try:</p>
          <a 
            href="/collection/refuel/hawker-heaven"
            style={{ color: '#00ffff' }}
          >
            /collection/refuel/hawker-heaven
          </a>
          <br />
          <span>OR just:</span>
          <br />
          <a 
            href="/collection/hawker-heaven"
            style={{ color: '#00ffff' }}
          >
            /collection/hawker-heaven
          </a>
        </div>
      </div>
      
      <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
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
          Back to Home
        </button>
        
        <button 
          onClick={() => window.location.href = '/vibe/refuel'}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ff9900',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          View All Refuel Collections
        </button>
      </div>
    </div>
  );
}
