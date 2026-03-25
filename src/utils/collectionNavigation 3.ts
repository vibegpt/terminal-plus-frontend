import { NavigateFunction } from 'react-router-dom';
import { SupabaseCollectionService } from '../services/SupabaseCollectionService';
import { 
  CollectionPreview, 
  CollectionPreviewState, 
  CollectionOptimizedState, 
  CollectionCompleteState 
} from '../types/collection.types';

// Option 1: Minimal State (RECOMMENDED) ✨
// Best practice: Only pass identifiers, let detail page fetch its own data
export const handleCollectionClick = (
  collection: CollectionPreview, 
  terminalCode: string, 
  navigate: NavigateFunction
) => {
  // Validate required fields
  if (!collection.collection_slug) {
    console.error('Invalid collection: missing slug');
    return;
  }

  // Navigate with minimal state - just enough for loading state
  navigate(`/collection/${terminalCode}/${collection.collection_slug}`, {
    state: { 
      // Only pass display data for immediate render while loading
      preview: {
        name: collection.collection_name,
        icon: collection.collection_icon,
        gradient: collection.collection_gradient,
        itemCount: collection.terminal_amenity_count
      }
    }
  });
};

// Option 2: Performance-Optimized (If API is slow) 🚀
// Use if you want to avoid refetching data that's already available
export const handleCollectionClickOptimized = (
  collection: CollectionPreview, 
  terminalCode: string, 
  navigate: NavigateFunction
) => {
  // Create a clean data structure without redundancy
  const collectionData: CollectionOptimizedState = {
    id: collection.collection_slug,
    display: {
      name: collection.collection_name,
      icon: collection.collection_icon,
      gradient: collection.collection_gradient,
    },
    metadata: {
      itemCount: collection.terminal_amenity_count,
      featured: collection.is_featured ?? false,
      universal: collection.is_universal ?? false,
    }
  };

  navigate(`/collection/${terminalCode}/${collection.collection_slug}`, {
    state: { collection: collectionData }
  });
};

// Option 3: With Analytics & Error Boundary 📊
// Most comprehensive - includes tracking and error handling
export const handleCollectionClickComplete = async (
  collection: CollectionPreview,
  terminalCode: string,
  navigate: NavigateFunction,
  index?: number
) => {
  try {
    // Track analytics event
    if (window.gtag) {
      window.gtag('event', 'collection_click', {
        collection_id: collection.collection_slug,
        collection_name: collection.collection_name,
        terminal: terminalCode,
        position: index,
        is_featured: collection.is_featured
      });
    }

    // Prefetch collection data (optional - for instant loading)
    const prefetchPromise = SupabaseCollectionService
      .getCollectionWithAmenities(collection.collection_slug, terminalCode)
      .catch(() => null); // Fail silently for prefetch

    // Navigate immediately (don't wait for prefetch)
    navigate(`/collection/${terminalCode}/${collection.collection_slug}`, {
      state: { 
        preview: {
          name: collection.collection_name,
          icon: collection.collection_icon,
          gradient: collection.collection_gradient,
          itemCount: collection.terminal_amenity_count
        },
        prefetchPromise // Pass promise for detail page to await
      }
    });

  } catch (error) {
    console.error('Navigation failed:', error);
    // Show user-friendly error (you'll need to implement toast)
    // toast.error('Unable to open collection. Please try again.');
  }
};

// Helper function to get the appropriate handler based on your needs
export const getCollectionHandler = (type: 'minimal' | 'optimized' | 'complete') => {
  switch (type) {
    case 'minimal':
      return handleCollectionClick;
    case 'optimized':
      return handleCollectionClickOptimized;
    case 'complete':
      return handleCollectionClickComplete;
    default:
      return handleCollectionClick; // Default to minimal
  }
};
