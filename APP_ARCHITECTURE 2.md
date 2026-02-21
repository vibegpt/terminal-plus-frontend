# Terminal+ App Architecture & Flow

## 📱 App Overview

Terminal+ is a React-based mobile-first web application that transforms airport terminal "dead time" into personalized, mood-driven experiences. The app uses a component-based architecture with custom hooks for state management and business logic.

## 🗂️ Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Route-level components
├── hooks/              # Custom React hooks
├── context/            # React Context providers
├── types/              # TypeScript type definitions
├── services/           # Business logic services
├── utils/              # Utility functions
├── constants/          # App constants and configurations
├── data/               # Static data files
├── lib/                # Third-party integrations
└── helpers/            # Helper functions
```

## 🎯 Core User Flows

### 1. Journey Planning Flow
**Path**: `/plan-journey` → `/experience`
**Components**: `JourneyStepper` → `ExperienceView`

### 2. Terminal Exploration Flow
**Path**: `/explore/:airportCode` → `/experience`
**Components**: `ExperienceView` → `TerminalMapView`

### 3. Amenity Detail Flow
**Path**: `/amenity/:slug`
**Components**: `AmenityDetailPage`

## 📄 Pages (Route-Level Components)

### Core Pages
- **`HomePage`** (`/`) - Landing page with journey planning options
- **`PlanJourneyStepper`** (`/plan-journey`) - Journey planning with stepper UI
- **`ExperienceView`** (`/experience`) - Main terminal experience with map and recommendations
- **`AmenityDetail`** (`/amenity/:slug`) - Detailed amenity information

### Legacy/Redirect Pages
- **`ExploreTerminal`** - Redirects to ExperienceView
- **`GoogleMapsTerminalPage`** - Redirects to ExperienceView
- **`TerminalMapView`** - Redirects to ExperienceView

### Development/Testing Pages
- **`SimpleGoogleMapsTest`** (`/test-google-maps`) - Google Maps integration testing
- **`DebugNavigation`** (`/debug-navigation`) - Development navigation testing

## 🧩 Components

### Core Journey Components
- **`JourneyStepper`** - Multi-step journey planning interface
- **`JourneyInputScreen`** - Flight details input form
- **`JourneySuccessScreen`** - Journey completion confirmation
- **`JourneyHistoryScreen`** - Saved journeys list
- **`JourneyView`** - Individual journey display
- **`JourneySummary`** - Journey overview card
- **`JourneyDataDisplay`** - Journey information display

### Terminal & Map Components
- **`TerminalMapView`** - Main terminal map interface
- **`EnhancedTerminalMapView`** - Advanced map with amenities
- **`GoogleMapsTerminalView`** - Google Maps integration
- **`TransitGuide`** - Transit-specific guidance
- **`TransitTimeline`** - Multi-airport journey timeline

### Recommendation Components
- **`JourneyRecommendations`** - Personalized amenity recommendations
- **`VibeRecommendations`** - Vibe-based filtering
- **`RecommendationSection`** - Recommendation display section
- **`VibeRecommendationCard`** - Individual recommendation card
- **`CategoryCarousels`** - Category-based amenity browsing
- **`RecommendationsExample`** - Example recommendation usage
- **`RecommendationsWithFallbacks`** - Recommendations with fallback tips

### Amenity Components
- **`AmenityCard`** - Individual amenity display card
- **`AmenityGrid`** - Grid layout for amenities
- **`AmenityDetailPage`** - Detailed amenity information
- **`CategoryFilter`** - Amenity category filtering

### Vibe & Energy Components
- **`VibePicker`** - Vibe selection interface
- **`VibeIcon`** - Vibe visual representation
- **`VibesManager`** - Vibe management interface
- **`VibeChat`** - Vibe-based chat interface
- **`VibeManagerChat`** - AI-powered vibe manager
- **`EnergySuggestionCard`** - Energy level suggestions
- **`SmartRecommendationsWithEnergy`** - Energy-aware recommendations

### UI Components
- **`AppHeader`** - Main app header
- **`BottomNavigation`** - Mobile bottom navigation
- **`TabNavigation`** - Tab-based navigation
- **`FilterBar`** - Filtering interface
- **`LoadingScreen`** - Loading states
- **`ErrorFallback`** - Error handling
- **`SplashScreen`** - App splash screen
- **`ThemeToggle`** - Dark/light mode toggle

### Authentication Components
- **`SupabaseAuthWrapper`** - Authentication wrapper
- **`RequireAuth`** - Protected route component
- **`ProfileScreen`** - User profile management

### Utility Components
- **`FallbackTips`** - Helpful tips when recommendations are limited
- **`EmptyJourneyMessage`** - Empty state messaging
- **`TransitionManager`** - Page transition handling
- **`MicAccessChecker`** - Microphone access verification

## 🪝 Custom Hooks

### Data Management Hooks
- **`useAmenities`** - Amenity data loading and management
- **`useSINTransitAmenities`** - Singapore transit-specific amenities
- **`useCrowdData`** - Crowd level data (placeholder)
- **`useOfflineCache`** - Offline data caching for amenities and journeys

### Recommendation Hooks
- **`useRecommendations`** - Simplified recommendation engine wrapper
- **`useRecommendationsEngine`** - Performance-optimized recommendation engine
- **`useSmartRecommendations`** - Smart recommendation system with energy suggestions
- **`useRecommendationEngine`** - Core recommendation logic
- **`useAdaptiveRecommendations`** - Adaptive recommendation filtering
- **`useAmenityFiltering`** - Amenity filtering logic

### Journey Management Hooks
- **`useJourneyPlanning`** - Journey planning logic
- **`useStepperLogic`** - Journey stepper state management
- **`useSaveJourneyApi`** - Journey saving to backend
- **`useSaveVibeApi`** - Vibe preferences saving

### Authentication Hooks
- **`useAuth`** - Authentication state management
- **`useSupabaseAuth`** - Supabase authentication integration

### UI/UX Hooks
- **`useTheme`** - Theme management (dark/light mode)
- **`useVibeColors`** - Vibe color management
- **`useVibeStyles`** - Vibe styling utilities
- **`useValueMode`** - Value mode toggle
- **`useVoiceEmotion`** - Voice emotion detection
- **`useInitialNavigation`** - Initial navigation logic
- **`use-mobile`** - Mobile device detection
- **`use-toast`** - Toast notification system
- **`useSimpleToast`** - Simplified toast notifications

## 🔄 App Flow Architecture

### 1. Entry Point Flow
```
App.tsx → AppRoutes → HomePage
```

### 2. Journey Planning Flow
```
HomePage → PlanJourneyStepper → JourneyStepper → ExperienceView
```

### 3. Terminal Exploration Flow
```
ExperienceView → TerminalMapView → AmenityDetailPage
```

### 4. Recommendation Flow
```
useAmenities → useRecommendations → JourneyRecommendations → AmenityCard
```

### 5. Authentication Flow
```
SupabaseAuthWrapper → useSupabaseAuth → Protected Routes
```

## 🎨 UI Component Hierarchy

### Main Layout
```
AppHeader
├── BottomNavigation
├── TabNavigation
└── Main Content Area
    ├── TerminalMapView
    ├── JourneyRecommendations
    └── VibeManagerChat
```

### Journey Planning
```
JourneyStepper
├── JourneyInputScreen
├── VibePicker
├── JourneySummary
└── JourneySuccessScreen
```

### Terminal Experience
```
ExperienceView
├── TerminalMapView
├── FilterBar
├── CategoryCarousels
└── RecommendationSection
```

## 🔧 Key Services

### Recommendation Engine
- **`SmartRecommendationEngine`** - Core recommendation algorithm
- **`recommendationService`** - Recommendation API integration
- **`enhancedRecommendationService`** - Enhanced recommendation features

### Data Services
- **`crowdService`** - Crowd level data (placeholder)
- **`flightData`** - Flight information integration

## 📊 State Management

### Context Providers
- **`JourneyContext`** - Journey state management
- **`ThemeProvider`** - Theme state management
- **`VibeContext`** - Vibe state management

### Local State
- **React useState** - Component-level state
- **React useReducer** - Complex state logic (JourneyStepper)
- **React useMemo** - Performance optimization

## 🗄️ Data Flow

### Amenity Data Flow
```
Static JSON Files → useAmenities → useRecommendations → UI Components
```

### Journey Data Flow
```
User Input → JourneyStepper → useSaveJourneyApi → Backend
```

### Recommendation Data Flow
```
Amenity Data → SmartRecommendationEngine → Filtered Results → UI
```

## 🎯 Key Features Status

### ✅ Implemented
- Journey planning with stepper interface
- Vibe-based amenity filtering
- Terminal map visualization
- Amenity detail pages
- Basic authentication
- Offline caching
- Smart recommendation engine
- Energy-aware suggestions

### 🟡 In Progress
- Real-time crowd data
- Multi-airport journey support
- Advanced Google Maps integration
- User journey history sync

### ❌ Not Started
- Real-time queue data
- Advanced analytics
- Push notifications
- Social features

## 🚀 Development Guidelines

### Component Structure
- Use functional components with hooks
- Implement proper TypeScript typing
- Follow mobile-first responsive design
- Use Tailwind CSS for styling

### State Management
- Use React Context for global state
- Use local state for component-specific data
- Implement proper error boundaries
- Handle loading states gracefully

### Performance
- Use React.memo for expensive components
- Implement proper dependency arrays in hooks
- Use useMemo for expensive calculations
- Optimize bundle size with code splitting

### Testing
- Components have example implementations
- Hooks include error handling
- Services have fallback mechanisms
- UI components are responsive

This architecture provides a solid foundation for the Terminal+ app with clear separation of concerns, reusable components, and scalable state management. 