// Common utility types and enums used throughout the application

// Boarding status types
export type BoardingStatus = 'imminent' | 'soon' | 'normal';

// Vibe types
export type Vibe = 'chill' | 'refuel' | 'comfort' | 'discover' | 'quick' | 'work' | 'social' | 'shop';
export type VibeName = Vibe; // Alias for backward compatibility

// Crowd level types
export type CrowdLevel = 'low' | 'medium' | 'high' | 'peak';

// Urgency types
export type Urgency = 'low' | 'medium' | 'high';

// Availability types
export type Availability = 'low' | 'medium' | 'high';

// Priority types
export type Priority = 'low' | 'medium' | 'high';

// Context types for recommendations
export type RecommendationContext = 'departure' | 'transit' | 'arrival';

// Journey stop types
export type JourneyStopType = 'departure' | 'transit' | 'arrival';

// Component variant types
export type ComponentVariant = 'default' | 'compact' | 'detailed';

// Button variant types
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';

// Button size types
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

// Input type types
export type InputType = 'text' | 'email' | 'password' | 'number' | 'date' | 'time' | 'tel' | 'url';

// Modal size types
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

// Container max width types
export type ContainerMaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

// Padding size types
export type PaddingSize = 'none' | 'sm' | 'md' | 'lg' | 'xl';

// Error variant types
export type ErrorVariant = 'error' | 'warning' | 'info';

// Loading spinner size types
export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

// Theme types
export type Theme = 'light' | 'dark';

// Toast type types
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

// Price tier types
export type PriceTier = 'budget' | 'moderate' | 'premium' | 'luxury';

// Amenity category types
export type AmenityCategory = 
  | 'Food & Dining'
  | 'Shopping'
  | 'Lounge'
  | 'Spa & Wellness'
  | 'Business Services'
  | 'Entertainment'
  | 'Transportation'
  | 'Information'
  | 'Medical'
  | 'Prayer Room'
  | 'Family Services'
  | 'Other';

// Terminal types
export type Terminal = 'T1' | 'T2' | 'T3' | 'T4' | 'T5';

// Airport codes
export type AirportCode = 'SYD' | 'LHR' | 'SIN' | 'LAX' | 'JFK' | 'CDG' | 'FRA' | 'AMS' | 'DXB' | 'HKG';

// Time period types
export type TimePeriod = 'morning' | 'afternoon' | 'evening' | 'night';

// Day of week types
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

// Week type
export type WeekType = 'weekday' | 'weekend';

// Coordinate types
export interface Coordinates {
  x: number;
  y: number;
  lat?: number;
  lng?: number;
}

// Location types
export interface Location {
  id: string;
  name: string;
  coordinates: Coordinates;
  terminal?: Terminal;
  gate?: string;
}

// Time range types
export interface TimeRange {
  start: string;
  end: string;
}

// Opening hours types
export interface OpeningHours {
  [key: string]: string | TimeRange;
}

// Price range types
export interface PriceRange {
  min: number;
  max: number;
  currency: string;
}

// Rating types
export interface Rating {
  value: number;
  count: number;
  maxValue: number;
}

// Image types
export interface Image {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

// Tag types
export interface Tag {
  id: string;
  name: string;
  color?: string;
  category?: string;
}

// Metadata types
export interface Metadata {
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  version?: string;
}

// Pagination types
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Sort types
export interface Sort {
  field: string;
  direction: 'asc' | 'desc';
}

// Filter types
export interface Filter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'startsWith' | 'endsWith';
  value: any;
}

// Query types
export interface Query {
  pagination?: Pagination;
  sort?: Sort[];
  filters?: Filter[];
  search?: string;
}

// Result types
export interface Result<T> {
  data: T;
  pagination?: Pagination;
  metadata?: Metadata;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  stack?: string;
}

// Success types
export interface Success {
  message: string;
  data?: any;
  timestamp: string;
}

// Loading state types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  data: any | null;
}

// Async state types
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated?: string;
}

// Event types
export interface Event {
  id: string;
  type: string;
  data: any;
  timestamp: string;
  userId?: string;
}

// Log types
export interface Log {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: any;
  timestamp: string;
  userId?: string;
  sessionId?: string;
}

// Utility type helpers
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type NonNullable<T> = T extends null | undefined ? never : T;

export type ValueOf<T> = T[keyof T];

export type ArrayElement<T> = T extends Array<infer U> ? U : never;

// Type guards
export function isString(value: any): value is string {
  return typeof value === 'string';
}

export function isNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: any): value is boolean {
  return typeof value === 'boolean';
}

export function isObject(value: any): value is object {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray(value: any): value is any[] {
  return Array.isArray(value);
}

export function isFunction(value: any): value is Function {
  return typeof value === 'function';
}

export function isDate(value: any): value is Date {
  return value instanceof Date;
}

export function isUndefined(value: any): value is undefined {
  return typeof value === 'undefined';
}

export function isNull(value: any): value is null {
  return value === null;
}

export function isNullOrUndefined(value: any): value is null | undefined {
  return value === null || value === undefined;
}

// Enum-like objects for better type safety
export const VIBES = {
  CHILL: 'chill',
  REFUEL: 'refuel',
  COMFORT: 'comfort',
  DISCOVER: 'discover',
  QUICK: 'quick',
  WORK: 'work',
  SOCIAL: 'social',
  SHOP: 'shop'
} as const;

export const CROWD_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  PEAK: 'peak'
} as const;

export const URGENCY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
} as const;

export const AVAILABILITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
} as const;

export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
} as const; 