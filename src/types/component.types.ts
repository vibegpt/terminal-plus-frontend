import type { AmenityLocation } from './amenity.types';

export interface FilterBarProps {
  filters: any;
  availableCategories: string[];
  availableTerminals: string[];
  onFilterChange: (key: string, value: any) => void;
  onReset: () => void;
  className?: string;
}

export interface AmenityCardProps {
  amenity: AmenityLocation;
  onSelect?: (amenity: AmenityLocation) => void;
  variant?: 'default' | 'compact' | 'detailed';
  showTerminal?: boolean;
  className?: string;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  className?: string;
} 