// component.types.ts - Centralized component prop types
// Used across all UI components for consistent prop interfaces

import type { Amenity } from './amenity.types';
import type { VibeType } from './vibe.types';

// Base component props for common functionality
export interface BaseComponentProps {
  className?: string;
  'data-testid'?: string;
  id?: string;
}

// Navigation and layout components
export interface BottomNavigationProps extends BaseComponentProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  showNotifications?: boolean;
}

export type NavigationTab = 'journey' | 'history' | 'profile' | 'explore';

export interface TabNavigationProps extends BaseComponentProps {
  tabs: NavigationTab[];
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

// Amenity-related components
export interface AmenityGridProps extends BaseComponentProps {
  amenities: Amenity[];
  loading: boolean;
  error: string | null;
  onAmenitySelect?: (amenity: Amenity) => void;
  showTerminal?: boolean;
  maxItems?: number;
  emptyStateMessage?: string;
}

export interface AmenityCardProps extends BaseComponentProps {
  amenity: Amenity;
  onSelect?: (amenity: Amenity) => void;
  showTerminal?: boolean;
  showRating?: boolean;
  showDistance?: boolean;
  variant?: 'default' | 'compact' | 'featured';
}

// Filter and search components
export interface CategoryFilterProps extends BaseComponentProps {
  categories: string[];
  selectedCategory: string;
  onSelect: (category: string) => void;
  showAllOption?: boolean;
  allOptionLabel?: string;
  variant?: 'pills' | 'dropdown' | 'buttons';
}

export interface FilterBarProps extends BaseComponentProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  availableCategories: string[];
  availableTerminals: string[];
  showAdvanced?: boolean;
}

export interface FilterState {
  categories: string[];
  terminals: string[];
  priceRange?: PriceRange;
  accessibility?: boolean;
  searchQuery?: string;
  rating?: number;
  vibe?: VibeType;
}

export type PriceRange = 'budget' | 'moderate' | 'premium';

// Journey-related components
export interface JourneyViewProps extends BaseComponentProps {
  journeyId: string;
  showAmenities?: boolean;
  showTimeline?: boolean;
  showRecommendations?: boolean;
}

export interface JourneySummaryProps extends BaseComponentProps {
  journey: any; // Will be replaced with proper Journey type
  showDetails?: boolean;
  showActions?: boolean;
}

export interface TransitTimelineProps extends BaseComponentProps {
  timeline: any[]; // Will be replaced with proper TimelineBlock type
  showAmenities?: boolean;
  showTimes?: boolean;
}

// Loading and error states
export interface LoadingScreenProps extends BaseComponentProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'skeleton' | 'dots';
}

export interface ErrorMessageProps extends BaseComponentProps {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'error' | 'warning' | 'info';
}

// Theme and UI components
export interface ThemeToggleProps extends BaseComponentProps {
  variant?: 'button' | 'switch' | 'icon';
  showLabel?: boolean;
}

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: 'light' | 'dark' | 'system';
}

// Form components
export interface FormFieldProps extends BaseComponentProps {
  label: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
}

// Modal and overlay components
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export interface DrawerProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  side?: 'left' | 'right' | 'top' | 'bottom';
  size?: 'sm' | 'md' | 'lg';
}

// Utility types for component composition
export type ComponentVariant = 'default' | 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'; 