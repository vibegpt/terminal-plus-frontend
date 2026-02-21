import React from 'react';
import { useTracking } from '../hooks/useTracking';

interface Amenity {
  id: number;
  name: string;
  description: string;
  terminal_code: string;
  vibe_tags?: string;
}

interface Collection {
  id: string;
  name: string;
}

interface TrackingExampleProps {
  amenity: Amenity;
  collection: Collection;
}

export const TrackingExample: React.FC<TrackingExampleProps> = ({ amenity, collection }) => {
  // Initialize tracking with auto-view tracking enabled
  const { trackClick, trackBookmark } = useTracking({
    amenityId: amenity.id,
    collectionId: collection.id,
    autoTrackView: true
  });

  const handleAmenityClick = () => {
    trackClick(amenity);
    // Your amenity click logic here
    console.log(`Clicked on ${amenity.name}`);
  };

  const handleBookmarkAdd = () => {
    trackBookmark(amenity, 'add');
    // Your bookmark add logic here
    console.log(`Added ${amenity.name} to bookmarks`);
  };

  const handleBookmarkRemove = () => {
    trackBookmark(amenity, 'remove');
    // Your bookmark remove logic here
    console.log(`Removed ${amenity.name} from bookmarks`);
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #ccc', 
      borderRadius: '8px',
      margin: '10px'
    }}>
      <h3>{amenity.name}</h3>
      <p>{amenity.description}</p>
      <p>Terminal: {amenity.terminal_code}</p>
      {amenity.vibe_tags && <p>Vibe: {amenity.vibe_tags}</p>}
      
      <div style={{ marginTop: '15px' }}>
        <button 
          onClick={handleAmenityClick}
          style={{
            padding: '8px 16px',
            marginRight: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          View Details
        </button>
        
        <button 
          onClick={handleBookmarkAdd}
          style={{
            padding: '8px 16px',
            marginRight: '10px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Add Bookmark
        </button>
        
        <button 
          onClick={handleBookmarkRemove}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Remove Bookmark
        </button>
      </div>
      
      <div style={{ 
        marginTop: '15px', 
        fontSize: '12px', 
        color: '#666',
        fontStyle: 'italic'
      }}>
        Collection: {collection.name} • Auto-tracking enabled
      </div>
    </div>
  );
};





