// Collection Types for Type Safety
export interface CollectionPreview {
  collection_id: string;
  collection_slug: string;
  collection_name: string;
  collection_icon: string;
  collection_gradient: string;
  terminal_amenity_count: number;
  is_featured?: boolean;
  is_universal?: boolean;
}

export interface CollectionPreviewState {
  name: string;
  icon: string;
  gradient: string;
  itemCount: number;
}

export interface CollectionOptimizedState {
  id: string;
  display: {
    name: string;
    icon: string;
    gradient: string;
  };
  metadata: {
    itemCount: number;
    featured: boolean;
    universal: boolean;
  };
}

export interface CollectionCompleteState {
  preview: CollectionPreviewState;
  prefetchPromise?: Promise<any>;
}
