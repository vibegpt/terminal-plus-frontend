import React from 'react';
import { Heart } from 'lucide-react';
import { useBookmarkAmenity } from '../hooks/queries/useAmenities';
import { useAppStore } from '../stores/useAppStore';

interface BookmarkButtonProps {
  amenityId: number;
  amenityName: string;
  className?: string;
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({ 
  amenityId, 
  amenityName, 
  className = '' 
}) => {
  const isBookmarked = useAppStore((state) => state.isBookmarked(amenityId.toString()));
  const bookmarkMutation = useBookmarkAmenity();

  const handleBookmark = () => {
    bookmarkMutation.mutate(amenityId);
  };

  return (
    <button
      data-testid="bookmark-button"
      onClick={handleBookmark}
      disabled={bookmarkMutation.isPending}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
        isBookmarked
          ? 'bg-red-50 border-red-200 text-red-600'
          : 'bg-white border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
      } ${className}`}
    >
      <Heart 
        className={`w-4 h-4 ${
          isBookmarked ? 'fill-current' : ''
        }`} 
      />
      <span className="text-sm font-medium">
        {isBookmarked ? 'Saved' : 'Save'}
      </span>
    </button>
  );
};
