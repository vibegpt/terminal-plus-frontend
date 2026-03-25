import React from 'react';
import { useTerminalCollections } from '@/services/UniversalCollectionService';

// Simple usage example - exactly as requested
export function SimpleCollectionExample() {
  const { collections, loading } = useTerminalCollections('SIN', 'T3');
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      {collections.map(col => (
        <div key={col.collection_uuid}>
          {col.collection_name}: {col.spots_total} spots ({col.spots_near_you} near you)
        </div>
      ))}
    </div>
  );
}

// Alternative: Using the service directly
export function DirectServiceExample() {
  const [collections, setCollections] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    async function loadCollections() {
      try {
        // This would be the direct service call
        // const collections = await getCollectionsForTerminal('SIN', 'T3');
        // setCollections(collections);
      } catch (error) {
        console.error('Error loading collections:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadCollections();
  }, []);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      {collections.map(col => (
        <div key={col.collection_uuid}>
          {col.collection_name}: {col.spots_total} spots ({col.spots_near_you} near you)
        </div>
      ))}
    </div>
  );
}

// Collection card component - exactly as requested
export function CollectionCard({ collection }: { collection: any }) {
  return (
    <div className="collection-card">
      <h3>{collection.collection_name} {collection.collection_icon}</h3>
      <p>{collection.spots_near_you} spots in Terminal 3</p>
      <p className="text-sm text-gray-500">
        {collection.spots_total} total across all terminals
      </p>
    </div>
  );
}

// Usage with the card component
export function CollectionCardsExample() {
  const { collections, loading } = useTerminalCollections('SIN', 'T3');
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      {collections.map(collection => (
        <CollectionCard key={collection.collection_uuid} collection={collection} />
      ))}
      
      <p>{collections[0]?.spots_near_you} spots near you</p>
    </div>
  );
}

export default SimpleCollectionExample;
