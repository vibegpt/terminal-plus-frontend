import React from 'react';
import { ArrowRight, Clock, MapPin, Star, Users } from 'lucide-react';

// Base card interface that all cards inherit from
interface BaseCardProps {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  vibe?: string;
  rating?: number;
  walkTime?: string;
  category?: string;
  onClick?: () => void;
}

// Different card contexts that extend base
interface AmenityCardProps extends BaseCardProps {
  variant: 'amenity';
  price?: string;
  openHours?: string;
  distance?: string;
  crowdLevel?: 'low' | 'medium' | 'high';
}

interface CollectionCardProps extends BaseCardProps {
  variant: 'collection';
  itemCount?: number;
  preview?: string[];
  description?: string;
}

interface RecommendationCardProps extends BaseCardProps {
  variant: 'recommendation';
  priority?: 'high' | 'medium' | 'low';
  timeContext?: string;
  personalizedReason?: string;
}

type UnifiedCardProps = AmenityCardProps | CollectionCardProps | RecommendationCardProps;

// Vibe styling system
const vibeStyles = {
  Refuel: {
    bg: 'bg-gradient-to-br from-orange-50 to-red-50',
    border: 'border-orange-200',
    accent: 'text-orange-600',
    badge: 'bg-orange-100 text-orange-700',
    glow: 'shadow-orange-100',
    icon: '🍔'
  },
  Chill: {
    bg: 'bg-gradient-to-br from-blue-50 to-cyan-50',
    border: 'border-blue-200',
    accent: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700',
    glow: 'shadow-blue-100',
    icon: '😌'
  },
  Work: {
    bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
    border: 'border-green-200',
    accent: 'text-green-600',
    badge: 'bg-green-100 text-green-700',
    glow: 'shadow-green-100',
    icon: '💼'
  },
  Explore: {
    bg: 'bg-gradient-to-br from-purple-50 to-violet-50',
    border: 'border-purple-200',
    accent: 'text-purple-600',
    badge: 'bg-purple-100 text-purple-700',
    glow: 'shadow-purple-100',
    icon: '🔍'
  },
  Quick: {
    bg: 'bg-gradient-to-br from-yellow-50 to-orange-50',
    border: 'border-yellow-200',
    accent: 'text-yellow-700',
    badge: 'bg-yellow-100 text-yellow-800',
    glow: 'shadow-yellow-100',
    icon: '⚡'
  },
  Comfort: {
    bg: 'bg-gradient-to-br from-slate-50 to-gray-50',
    border: 'border-slate-200',
    accent: 'text-slate-600',
    badge: 'bg-slate-100 text-slate-700',
    glow: 'shadow-slate-100',
    icon: '🛋️'
  },
  Shop: {
    bg: 'bg-gradient-to-br from-pink-50 to-rose-50',
    border: 'border-pink-200',
    accent: 'text-pink-600',
    badge: 'bg-pink-100 text-pink-700',
    glow: 'shadow-pink-100',
    icon: '🛍️'
  }
};

// Universal Card Component
export const UniversalCard: React.FC<UnifiedCardProps> = (props) => {
  const { title, subtitle, image, vibe = 'Refuel', rating, walkTime, onClick, variant } = props;
  
  const vibeStyle = vibeStyles[vibe as keyof typeof vibeStyles] || vibeStyles.Refuel;
  
  return (
    <div 
      className={`
        relative rounded-xl border transition-all duration-200 cursor-pointer group
        ${vibeStyle.bg} ${vibeStyle.border} ${vibeStyle.glow}
        hover:scale-[1.02] hover:shadow-lg
        ${onClick ? 'hover:shadow-xl' : ''}
      `}
      onClick={onClick}
    >
      {/* Common card structure for all variants */}
      <div className="p-4">
        {/* Header section - consistent across all variants */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {vibe && (
                <span className="text-lg">{vibeStyle.icon}</span>
              )}
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${vibeStyle.badge}`}>
                {vibe}
              </span>
            </div>
            
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-gray-700">
              {title}
            </h3>
            
            {subtitle && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                {subtitle}
              </p>
            )}
          </div>
          
          {image && (
            <div className="w-12 h-12 ml-3 rounded-lg overflow-hidden flex-shrink-0">
              <img 
                src={image} 
                alt={title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/default-amenity.jpg';
                }}
              />
            </div>
          )}
        </div>

        {/* Variant-specific content */}
        {variant === 'amenity' && <AmenityContent {...props as AmenityCardProps} vibeStyle={vibeStyle} />}
        {variant === 'collection' && <CollectionContent {...props as CollectionCardProps} vibeStyle={vibeStyle} />}
        {variant === 'recommendation' && <RecommendationContent {...props as RecommendationCardProps} vibeStyle={vibeStyle} />}

        {/* Common footer with interaction cue */}
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {rating && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                <span>{rating}</span>
              </div>
            )}
            {walkTime && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{walkTime}</span>
              </div>
            )}
          </div>
          
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </div>
  );
};

// Amenity-specific content
const AmenityContent: React.FC<AmenityCardProps & { vibeStyle: any }> = ({ 
  price, openHours, distance, crowdLevel, vibeStyle 
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-xs">
      {price && <span className={`font-medium ${vibeStyle.accent}`}>{price}</span>}
      {crowdLevel && (
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          <span className={`capitalize ${vibeStyle.accent}`}>{crowdLevel}</span>
        </div>
      )}
    </div>
    
    {openHours && (
      <div className="flex items-center gap-1 text-xs text-gray-600">
        <Clock className="w-3 h-3" />
        <span>{openHours}</span>
      </div>
    )}
  </div>
);

// Collection-specific content  
const CollectionContent: React.FC<CollectionCardProps & { vibeStyle: any }> = ({ 
  itemCount, preview, description, vibeStyle 
}) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 text-xs">
      {itemCount && <span className={`font-medium ${vibeStyle.accent}`}>{itemCount} places</span>}
    </div>
    
    {description && (
      <p className="text-xs text-gray-600 line-clamp-2">{description}</p>
    )}
    
    {preview && preview.length > 0 && (
      <div className="flex -space-x-1">
        {preview.slice(0, 3).map((item, index) => (
          <div key={index} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white text-xs flex items-center justify-center">
            {item.charAt(0)}
          </div>
        ))}
        {preview.length > 3 && (
          <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white text-xs flex items-center justify-center">
            +{preview.length - 3}
          </div>
        )}
      </div>
    )}
  </div>
);

// Recommendation-specific content
const RecommendationContent: React.FC<RecommendationCardProps & { vibeStyle: any }> = ({ 
  priority, timeContext, personalizedReason, vibeStyle 
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-xs">
      {priority && (
        <span className={`
          px-2 py-1 rounded-full text-xs font-medium
          ${priority === 'high' ? 'bg-red-100 text-red-700' : ''}
          ${priority === 'medium' ? 'bg-orange-100 text-orange-700' : ''}
          ${priority === 'low' ? 'bg-gray-100 text-gray-700' : ''}
        `}>
          {priority} priority
        </span>
      )}
      {timeContext && <span className="text-gray-500">{timeContext}</span>}
    </div>
    
    {personalizedReason && (
      <p className="text-xs text-gray-600 italic line-clamp-2">
        "{personalizedReason}"
      </p>
    )}
  </div>
);

export default UniversalCard;
