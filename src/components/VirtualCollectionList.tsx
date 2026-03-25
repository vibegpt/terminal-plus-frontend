import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useInView } from 'react-intersection-observer';

interface Collection {
  id: number;
  name: string;
  description: string;
  vibe: string;
  icon: string;
  color: string;
  amenityCount: number;
  amenities: any[];
}

interface CollectionCardProps {
  collection: Collection;
  onClick?: () => void;
}

const CollectionCard: React.FC<CollectionCardProps> = ({ collection, onClick }) => {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  return (
    <div
      ref={ref}
      onClick={onClick}
      className="collection-card"
      style={{
        background: `linear-gradient(135deg, ${collection.color}20 0%, ${collection.color}40 100%)`,
        border: `2px solid ${collection.color}`,
        borderRadius: '16px',
        padding: '20px',
        margin: '8px 16px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        transform: inView ? 'translateY(0)' : 'translateY(20px)',
        opacity: inView ? 1 : 0.7,
        minHeight: '140px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: collection.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}
        >
          {collection.icon}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ 
            margin: '0 0 4px 0', 
            fontSize: '20px', 
            fontWeight: 'bold',
            color: '#333'
          }}>
            {collection.name}
          </h3>
          <p style={{ 
            margin: 0, 
            fontSize: '14px', 
            color: '#666',
            lineHeight: '1.4'
          }}>
            {collection.description}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: 'auto'
      }}>
        <span style={{
          background: collection.color,
          color: 'white',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          {collection.vibe}
        </span>
        
        <span style={{
          color: '#666',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {collection.amenityCount} amenities
        </span>
      </div>
    </div>
  );
};

interface VirtualCollectionListProps {
  collections: Collection[];
  onCollectionClick?: (collection: Collection) => void;
  height?: number;
  itemHeight?: number;
  className?: string;
}

// Individual item renderer for react-window
const CollectionItem = ({ index, style, data }: { 
  index: number; 
  style: React.CSSProperties; 
  data: { 
    collections: Collection[]; 
    onCollectionClick?: (collection: Collection) => void;
  } 
}) => {
  const { collections, onCollectionClick } = data;
  const collection = collections[index];

  return (
    <div style={style}>
      <CollectionCard 
        collection={collection}
        onClick={() => onCollectionClick?.(collection)}
      />
    </div>
  );
};

export const VirtualCollectionList: React.FC<VirtualCollectionListProps> = ({
  collections,
  onCollectionClick,
  height = 600,
  itemHeight = 180,
  className = ''
}) => {
  // Memoize the data to prevent unnecessary re-renders
  const itemData = useMemo(() => ({
    collections,
    onCollectionClick
  }), [collections, onCollectionClick]);

  if (!collections || collections.length === 0) {
    return (
      <div className={`virtual-collection-list ${className}`} style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          <p>No collections found</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`virtual-collection-list ${className}`}
      style={{ height }}
    >
      <List
        height={height}
        itemCount={collections.length}
        itemSize={itemHeight}
        itemData={itemData}
        overscanCount={3} // Render 3 extra items above and below viewport
        className="virtual-list"
      >
        {CollectionItem}
      </List>
    </div>
  );
};

// Hook for intersection observer with virtual scrolling
export const useVirtualScrollIntersection = () => {
  const { ref, inView, entry } = useInView({
    threshold: 0.1,
    rootMargin: '50px'
  });

  return {
    ref,
    inView,
    entry,
    isVisible: inView
  };
};
