// UI state, modal config, theming
// Used in: UI context, modals, themes

import type { Amenity } from './amenity.types';

// Theme types
export interface ThemeContextProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastProps {
  id?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive';
  type?: ToastType;
}

export interface ToasterToast extends ToastProps {
  id: string;
}

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive';
  type?: ToastType;
}

export interface ToastState {
  toasts: ToasterToast[];
}

// Component prop types
export interface FilterBarProps {
  filters: any;
  availableCategories: string[];
  availableTerminals: string[];
  onFilterChange: (key: string, value: any) => void;
  onReset: () => void;
  className?: string;
}

export interface AmenityCardProps {
  amenity: Amenity;
  onSelect?: (amenity: Amenity) => void;
  variant?: 'default' | 'compact' | 'detailed';
  showTerminal?: boolean;
  className?: string;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  className?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export interface ErrorMessageProps {
  message: string;
  className?: string;
  variant?: 'error' | 'warning' | 'info';
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
}

export interface SimpleToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose?: () => void;
}

// Navigation types
export interface BottomNavigationProps {
  currentPath: string;
  className?: string;
}

export interface TabNavigationProps {
  tabs: {
    id: string;
    label: string;
    icon?: React.ReactNode;
    content: React.ReactNode;
  }[];
  defaultTab?: string;
  className?: string;
}

// Journey component types
export interface JourneyRecommendationsProps {
  context: 'departure' | 'transit' | 'arrival';
  journeyData?: any;
  onBack: () => void;
}

export interface RecommendationItem {
  id: string;
  title: string;
  description: string;
  category: string;
  estimatedTime: number;
  distance: string;
  rating: number;
  vibe: string;
  icon: React.ReactNode;
  priority: 'high' | 'medium' | 'low';
  slug?: string;
}

export interface JourneyViewProps {
  journeyData: any;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export interface JourneySummaryProps {
  journey: any;
  className?: string;
}

export interface JourneySuccessScreenProps {
  journeyData: any;
  onContinue?: () => void;
  onSave?: () => void;
}

export interface JourneyInputScreenProps {
  onComplete: (data: any) => void;
  onBack?: () => void;
  initialData?: any;
  className?: string;
}

// Multi-airport journey types
export interface MultiAirportTimelineProps {
  tripData: any[];
  className?: string;
  onStopClick?: (stop: any) => void;
}

export interface MultiAirportTripProps {
  tripData: any;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

// Guide and recommendation types
export interface GuideViewProps {
  amenities: Amenity[];
  userLocation?: { lat: number; lng: number };
  selectedVibe?: string;
  onAmenitySelect?: (amenity: Amenity) => void;
  className?: string;
}

export interface VibeRecommendationsProps {
  vibe: string;
  amenities: Amenity[];
  onAmenitySelect?: (amenity: Amenity) => void;
  className?: string;
}

export interface RecommendationSectionProps {
  title: string;
  recommendations: any[];
  onRecommendationClick?: (recommendation: any) => void;
  className?: string;
}

// Category and filter types
export interface CategoryCarouselsProps {
  amenities: Amenity[];
  terminal: string;
  vibe?: string;
  onAmenityClick?: (slug: string) => void;
  className?: string;
}

export interface CategoryFilterProps {
  categories: string[];
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  className?: string;
}

export interface AmenityGridProps {
  amenities: Amenity[];
  onAmenitySelect?: (amenity: Amenity) => void;
  loading?: boolean;
  error?: string;
  className?: string;
}

// Authentication types
export interface SupabaseAuthWrapperProps {
  children: React.ReactNode;
}

// Transition and animation types
export interface TransitionManagerProps {
  children: React.ReactNode;
  className?: string;
}

// Vibe management types
export interface VibeContextProps {
  children: React.ReactNode;
}

export interface VibeSession {
  id: string;
  vibe: string;
  timestamp: string;
  duration: number;
  activities: string[];
}

// Form types
export interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'time';
  placeholder?: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  className?: string;
}

export interface FormProps {
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
}

// Modal and dialog types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

// Layout types
export interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  sidebar?: React.ReactNode;
}

export interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
} 