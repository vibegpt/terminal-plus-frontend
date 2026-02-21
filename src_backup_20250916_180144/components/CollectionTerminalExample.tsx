import React from 'react';
import { useCollectionTerminal, useCollectionsWithHealth, useContextualCollections } from '../hooks/useCollectionTerminal';

interface CollectionCardProps {
  collection: {
    collection_id: string;
    collection_name: string;
    icon: string;
    gradient: string;
    spots_total: number;
    spots_near_you: number;
    health_score?: string;
    health_color?: string;
  };
}

const CollectionCard: React.FC<CollectionCardProps> = ({ collection }) => {
  const healthScore = collection.health_score || 'Unknown';
  const healthColor = collection.health_color || 'text-gray-600';
  
  return (
    <div className="p-4 rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{collection.icon}</span>
          <h3 className="font-semibold text-gray-900">{collection.collection_name}</h3>
        </div>
        <span className={`text-sm font-medium ${healthColor}`}>
          {healthScore}
        </span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total spots:</span>
          <span className="font-medium">{collection.spots_total}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Near you:</span>
          <span className="font-medium text-blue-600">{collection.spots_near_you}</span>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${Math.min((collection.spots_near_you / Math.max(collection.spots_total, 1)) * 100, 100)}%` 
            }}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Example component showing different ways to use the collection terminal service
 */
export const CollectionTerminalExample: React.FC = () => {
  const [airport, setAirport] = React.useState('SIN');
  const [terminal, setTerminal] = React.useState('T3');
  const [context, setContext] = React.useState<'departure' | 'arrival' | 'transit' | 'layover'>('transit');

  // Basic usage
  const { collections, loading, error } = useCollectionTerminal(airport, terminal);
  
  // With health scoring
  const { collections: healthCollections, loading: healthLoading } = useCollectionsWithHealth(airport, terminal);
  
  // Contextual collections
  const { collections: contextualCollections, loading: contextualLoading } = useContextualCollections(airport, terminal, context);

  if (loading || healthLoading || contextualLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading collections...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Collection Terminal Service Demo
        </h1>
        <p className="text-gray-600">
          Showing collections for {airport} {terminal}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 justify-center">
        <select 
          value={airport} 
          onChange={(e) => setAirport(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="SIN">Singapore (SIN)</option>
          <option value="SYD">Sydney (SYD)</option>
          <option value="LHR">London (LHR)</option>
        </select>
        
        <select 
          value={terminal} 
          onChange={(e) => setTerminal(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="T1">Terminal 1</option>
          <option value="T2">Terminal 2</option>
          <option value="T3">Terminal 3</option>
          <option value="T4">Terminal 4</option>
          <option value="JEWEL">Jewel</option>
        </select>
        
        <select 
          value={context} 
          onChange={(e) => setContext(e.target.value as any)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="departure">Departure</option>
          <option value="arrival">Arrival</option>
          <option value="transit">Transit</option>
          <option value="layover">Layover</option>
        </select>
      </div>

      {/* Basic Collections */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">All Collections ({collections.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map(collection => (
            <CollectionCard key={collection.collection_id} collection={collection} />
          ))}
        </div>
      </div>

      {/* Health Scored Collections */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Collections with Health Scoring ({healthCollections.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {healthCollections.map(collection => (
            <CollectionCard key={collection.collection_id} collection={collection} />
          ))}
        </div>
      </div>

      {/* Contextual Collections */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">
          Contextual Collections for {context} ({contextualCollections.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contextualCollections.map(collection => (
            <CollectionCard key={collection.collection_id} collection={collection} />
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{collections.length}</div>
            <div className="text-sm text-gray-600">Total Collections</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {collections.reduce((sum, c) => sum + c.spots_total, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Spots</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {collections.reduce((sum, c) => sum + c.spots_near_you, 0)}
            </div>
            <div className="text-sm text-gray-600">Near You</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {Math.round((collections.reduce((sum, c) => sum + c.spots_near_you, 0) / 
                           Math.max(collections.reduce((sum, c) => sum + c.spots_total, 0), 1)) * 100)}%
            </div>
            <div className="text-sm text-gray-600">Coverage</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionTerminalExample;
