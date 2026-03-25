import React from 'react';
import { useParams } from 'react-router-dom';
import CollectionDetailExample from './CollectionDetailExample';

const CollectionDetailWithRoute: React.FC = () => {
  const { terminalCode = 'SIN-T3', collectionSlug = 'hawker-heaven' } = useParams<{
    terminalCode?: string;
    collectionSlug?: string;
  }>();

  // Validate and format the parameters
  const formattedTerminal = terminalCode?.toUpperCase() || 'SIN-T3';
  const formattedSlug = collectionSlug?.toLowerCase().replace(/\s+/g, '-') || 'hawker-heaven';

  return (
    <div>
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
        <p className="text-sm text-blue-700">
          <strong>Route Debug:</strong> /collection/{formattedTerminal}/{formattedSlug}
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Raw params: terminalCode="{terminalCode}", collectionSlug="{collectionSlug}"
        </p>
      </div>
      
      <CollectionDetailExample 
        terminalCode={formattedTerminal} 
        collectionSlug={formattedSlug} 
      />
    </div>
  );
};

export default CollectionDetailWithRoute;
