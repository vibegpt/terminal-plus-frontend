import React, { useState } from 'react';
import { useTracking } from '../hooks/useTracking';
import { Clock, DollarSign, MapPin, Bookmark, Share2, Navigation } from 'lucide-react';

interface Amenity {
  id: number;
  name: string;
  description: string;
  terminal_code: string;
  price_level: '$' | '$$' | '$$$';
  vibe_tags: string[];
  opening_hours: string;
  logo_url?: string;
  website_url?: string;
}

interface AmenityCardProps {
  amenity: Amenity;
  collectionId?: number;
  position?: number;
  isSmart7Selection?: boolean;
  contextReason?: string; // Why Smart7 selected this
}

export const AmenityCard: React.FC<AmenityCardProps> = ({
  amenity,
  collectionId,
  position,
  isSmart7Selection = false,
  contextReason
}) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Initialize tracking with auto view tracking
  const {
    trackClick,
    trackBookmark,
    trackShare,
    trackNavigate
  } = useTracking({
    amenityId: amenity.id,
    collectionId,
    autoTrackView: true,
    viewThresholdMs: 800 // Count as view after 800ms
  });

  const handleCardClick = () => {
    trackClick();
    // Navigate to amenity detail or expand card
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
    trackBookmark();
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareMenu(true);
    trackShare();
    
    // Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: amenity.name,
        text: amenity.description,
        url: window.location.href
      });
    }
  };

  const handleNavigate = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackNavigate();
    
    // Open navigation/maps
    const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(
      `${amenity.name} Terminal ${amenity.terminal_code} Changi Airport`
    )}`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <div 
      className="amenity-card"
      onClick={handleCardClick}
      data-amenity-id={amenity.id}
      data-smart7={isSmart7Selection}
      style={{
        border: '1px solid #e0e0e0',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        position: 'relative'
      }}
    >
      {/* Smart7 Badge */}
      {isSmart7Selection && (
        <div 
          style={{
            position: 'absolute',
            top: '-8px',
            right: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          Smart7 Pick
        </div>
      )}

      {/* Main Content */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {/* Logo */}
        {amenity.logo_url && (
          <img 
            src={amenity.logo_url} 
            alt={amenity.name}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '8px',
              objectFit: 'cover'
            }}
          />
        )}

        {/* Info */}
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
            {amenity.name}
          </h3>
          
          <p style={{ 
            margin: '0 0 12px 0', 
            fontSize: '14px', 
            color: '#666',
            lineHeight: '1.4'
          }}>
            {amenity.description}
          </p>

          {/* Meta Info */}
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            fontSize: '13px',
            color: '#888'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={14} />
              Terminal {amenity.terminal_code}
            </span>
            
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <DollarSign size={14} />
              {amenity.price_level}
            </span>
            
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={14} />
              {amenity.opening_hours || 'Hours vary'}
            </span>
          </div>

          {/* Vibe Tags */}
          {amenity.vibe_tags && amenity.vibe_tags.length > 0 && (
            <div style={{ 
              display: 'flex', 
              gap: '6px', 
              marginTop: '8px',
              flexWrap: 'wrap'
            }}>
              {amenity.vibe_tags.slice(0, 3).map(tag => (
                <span 
                  key={tag}
                  style={{
                    background: '#f0f0f0',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#666'
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Context Reason for Smart7 */}
          {contextReason && (
            <div style={{
              marginTop: '8px',
              padding: '6px 10px',
              background: '#f8f9fa',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#667eea',
              fontStyle: 'italic'
            }}>
              ✨ {contextReason}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: '1px solid #f0f0f0'
      }}>
        <button
          onClick={handleBookmark}
          style={{
            flex: 1,
            padding: '8px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            background: isBookmarked ? '#667eea' : 'white',
            color: isBookmarked ? 'white' : '#666',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          <Bookmark size={16} fill={isBookmarked ? 'white' : 'none'} />
          {isBookmarked ? 'Saved' : 'Save'}
        </button>

        <button
          onClick={handleShare}
          style={{
            flex: 1,
            padding: '8px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            background: 'white',
            color: '#666',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          <Share2 size={16} />
          Share
        </button>

        <button
          onClick={handleNavigate}
          style={{
            flex: 1,
            padding: '8px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            background: 'white',
            color: '#666',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          <Navigation size={16} />
          Navigate
        </button>
      </div>
    </div>
  );
};
