import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseDataService } from '../services/supabaseDataService';
import { testSupabaseConnection } from '../utils/testSupabase';
import { behavioralTracking } from '../services/behavioralTrackingService';

export const Smart7Collections = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadSmart7Collections();
    
    // Track scroll behavior
    const handleScroll = () => {
      const scrollDepth = window.scrollY;
      const maxDepth = document.documentElement.scrollHeight - window.innerHeight;
      behavioralTracking.trackScroll(scrollDepth, maxDepth);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      behavioralTracking.cleanup();
    };
  }, []);

  const loadSmart7Collections = async () => {
    try {
      const data = await supabaseDataService.getSmart7Collections();
      setCollections(data);
      
      // Track collection view for analytics
      if (data.length > 0) {
        await behavioralTracking.trackCollectionView('smart7', 'Smart7 Collections');
      }
    } catch (error) {
      console.error('Failed to load Smart7:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToCollection = async (collectionId: string) => {
    // Track collection click for analytics
    await behavioralTracking.trackAmenityClick(0, collectionId, {
      collection_id: collectionId,
      terminal_code: 'SYD-T1',
      vibe_context: 'smart7',
      journey_phase: 'planning'
    });
    
    navigate(`/collection/${collectionId}`);
  };

  if (loading) return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <div>Loading Smart7...</div>
      <button 
        onClick={testSupabaseConnection}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          background: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        🧪 Test Supabase Connection
      </button>
    </div>
  );

  return (
    <div>
      {/* Test Button */}
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        background: 'rgba(255,255,255,0.05)',
        marginBottom: '20px',
        borderRadius: '10px'
      }}>
        <button 
          onClick={testSupabaseConnection}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          🧪 Test Supabase Connection
        </button>
        <p style={{ marginTop: '10px', opacity: '0.7', fontSize: '14px' }}>
          Check browser console for results
        </p>
      </div>

      {/* Collections Grid */}
      <div className="smart7-grid">
        {collections.map(collection => (
          <div 
            key={collection.id}
            className="collection-card"
            style={{
              background: collection.gradient
            }}
            onClick={() => navigateToCollection(collection.collection_id)}
          >
            <div className="icon">{collection.icon}</div>
            <h3>{collection.name}</h3>
            <p>{collection.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
