// src/components/VirtualAmenityList.tsx
import { memo, CSSProperties } from 'react';
import { List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { AmenityCard } from './AmenityCard';
import { Amenity } from '../types/amenity';
import { getTestId } from '../utils/testUtils';

interface VirtualAmenityListProps {
  amenities: Amenity[];
  onAmenityClick?: (amenity: Amenity) => void;
  collectionId?: number;
  isSmart7?: boolean;
  className?: string;
}

// Memoized row component for performance
const Row = memo(({ 
  index, 
  style, 
  data 
}: { 
  index: number; 
  style: CSSProperties; 
  data: any 
}) => {
  const { amenities, onAmenityClick, collectionId, isSmart7 } = data;
  const amenity = amenities[index];
  
  return (
    <div style={style}>
      <div className="px-4 py-2">
        <AmenityCard
          amenity={amenity}
          collectionId={collectionId}
          position={index}
          isSmart7Selection={isSmart7}
          onClick={() => onAmenityClick?.(amenity)}
        />
      </div>
    </div>
  );
});

Row.displayName = 'VirtualRow';

export const VirtualAmenityList: React.FC<VirtualAmenityListProps> = ({
  amenities,
  onAmenityClick,
  collectionId,
  isSmart7 = false,
  className = ''
}) => {
  const itemData = {
    amenities,
    onAmenityClick,
    collectionId,
    isSmart7,
  };

  if (!amenities || amenities.length === 0) {
    return (
      <div 
        className={`virtual-amenity-list ${className}`}
        style={{ 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}
      >
        <div style={{ textAlign: 'center', color: '#666' }}>
          <p>No amenities found</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`virtual-amenity-list ${className}`}
      {...getTestId('virtual-amenity-list')}
      style={{ height: '100%', width: '100%' }}
    >
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            itemCount={amenities.length}
            itemSize={140} // Height of each amenity card
            width={width}
            itemData={itemData}
            overscanCount={3} // Render 3 items outside of visible area
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
};

export default VirtualAmenityList;