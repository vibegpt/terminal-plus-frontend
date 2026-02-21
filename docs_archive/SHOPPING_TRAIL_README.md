# 🛍️ **Shopping Trail System**

A comprehensive, AI-powered shopping trail system for Terminal Plus that creates personalized shopping experiences at airports like Changi Airport in Singapore.

## ✨ **Features**

### **🎯 Smart Trail Generation**
- **AI-Powered Recommendations**: Uses machine learning to create personalized shopping trails
- **Preference-Based Filtering**: Considers interests, budget, duration, and accessibility
- **Real-Time Optimization**: Adapts trails based on crowd levels and current conditions
- **Fallback Algorithm**: Robust fallback system when AI services are unavailable

### **📍 Intelligent Location Tracking**
- **Adaptive Accuracy**: Automatically adjusts tracking frequency based on proximity to amenities
- **Battery Optimization**: Reduces power consumption when away from shopping areas
- **Proximity Detection**: Identifies when users are near shopping locations
- **Real-Time Updates**: Provides instant location-based notifications

### **⚡ Smart Queue System**
- **Priority-Based Processing**: Handles actions based on importance (check-ins > achievements > social)
- **Network Awareness**: Adjusts priorities based on connection quality
- **Battery Awareness**: Optimizes for power efficiency
- **Retry Logic**: Automatic retry with exponential backoff for failed actions

### **📊 Live Analytics & Progress**
- **Real-Time Progress Tracking**: Shows completion percentage and visited amenities
- **Live Leaderboard**: Competitive rankings with other users
- **Spending Analytics**: Track total spent and average ratings
- **Achievement System**: Unlock badges and milestones

## 🏗️ **Architecture**

### **Core Services**
```
src/
├── services/
│   ├── shoppingTrailService.ts    # Main shopping trail logic
│   ├── locationManager.ts         # Smart location tracking
│   ├── smartQueue.ts             # Priority-based action queue
│   └── aiTrailGenerator.ts       # AI trail generation
├── components/
│   ├── ShoppingTrailDashboard.tsx # Main dashboard
│   └── ui/
│       ├── BentoCard.tsx         # Flexible card component
│       ├── ProgressRing.tsx      # Circular progress indicator
│       └── LiveLeaderboard.tsx   # Real-time rankings
└── types/
    └── shopping-trail.types.ts   # TypeScript interfaces
```

### **Data Flow**
```
User Action → Smart Queue → Processing → Database → Real-time Updates
     ↓
Location Manager → Proximity Detection → Trail Optimization
     ↓
AI Generator → Preference Analysis → Personalized Trail
```

## 🚀 **Getting Started**

### **1. Access the System**
- **Live Dashboard**: Navigate to `/shopping-trail`
- **Interactive Demo**: Navigate to `/shopping-trail-demo`

### **2. Start Location Tracking**
```typescript
import { locationManager } from '../services/locationManager';

// Start tracking with automatic mode switching
await locationManager.startTracking();

// Listen for mode changes
locationManager.onModeChange((mode) => {
  console.log(`Switched to ${mode} mode`);
});
```

### **3. Generate Personalized Trail**
```typescript
import { aiTrailGenerator } from '../services/aiTrailGenerator';

const preferences: UserPreferences = {
  userId: 'user123',
  interests: ['Fashion', 'Electronics', 'Food'],
  budget: { min: 50, max: 500, currency: 'SGD' },
  duration: 3,
  pace: 'moderate',
  accessibility: 'standard',
  groupSize: 2,
  weatherPreference: 'indoor',
  timeOfDay: 'afternoon'
};

const trail = await aiTrailGenerator.generateAITrail(preferences, {
  avoidCrowds: true,
  minimizeWalking: true,
  maximizeVariety: true
});
```

### **4. Queue Actions**
```typescript
import { smartQueue, ActionType, Priority } from '../services/smartQueue';

// Queue a check-in action
smartQueue.enqueue({
  type: ActionType.CHECK_IN,
  priority: Priority.CRITICAL,
  payload: {
    amenityId: 'amenity123',
    timestamp: Date.now()
  },
  maxRetries: 3,
  metadata: {
    userId: 'user123',
    location: { lat: 1.3644, lng: 103.9915 }
  }
});
```

## 🎨 **UI Components**

### **BentoCard System**
- **Flexible Layouts**: Small, medium, and large card sizes
- **Gradient Support**: Beautiful gradient backgrounds
- **Live Indicators**: Real-time status indicators
- **Responsive Design**: Adapts to different screen sizes

### **ProgressRing**
- **Circular Progress**: Visual completion indicator
- **Animated Updates**: Smooth transitions and animations
- **Customizable Sizes**: Small, medium, and large variants
- **Glow Effects**: Subtle visual enhancements

### **LiveLeaderboard**
- **Real-Time Updates**: Live ranking updates
- **Compact Mode**: Space-efficient display
- **User Highlighting**: Current user identification
- **Performance Metrics**: Completion percentage and spending

## 🔧 **Configuration**

### **Location Manager Settings**
```typescript
const locationConfig = {
  highAccuracy: {
    interval: 5000,        // 5 seconds
    distanceThreshold: 100, // 100 meters
    batteryThreshold: 0.3   // 30%
  },
  balanced: {
    interval: 30000,        // 30 seconds
    distanceThreshold: 500, // 500 meters
    batteryThreshold: 0.2   // 20%
  },
  lowPower: {
    interval: 120000,       // 2 minutes
    distanceThreshold: 1000, // 1 kilometer
    batteryThreshold: 0.1   // 10%
  }
};
```

### **Queue Priorities**
```typescript
enum Priority {
  CRITICAL = 0,    // Check-ins, purchases
  HIGH = 1,        // Ratings, achievements
  MEDIUM = 2,      // Social actions
  LOW = 3,         // Analytics
  BACKGROUND = 4   // Sync operations
}
```

## 📱 **Mobile Optimization**

### **Battery Management**
- **Adaptive Tracking**: Reduces GPS usage when battery is low
- **Smart Caching**: Minimizes network requests
- **Background Processing**: Efficient background task handling

### **Network Awareness**
- **Connection Quality**: Adapts to network conditions
- **Offline Support**: Queues actions for later sync
- **Progressive Enhancement**: Graceful degradation

## 🔒 **Security & Privacy**

### **Data Protection**
- **User Authentication**: Secure user identification
- **Location Privacy**: Optional location sharing
- **Data Encryption**: Secure data transmission
- **GDPR Compliance**: User data control

### **Access Control**
- **Role-Based Access**: Different permission levels
- **API Rate Limiting**: Prevents abuse
- **Input Validation**: Secure data handling

## 🧪 **Testing & Development**

### **Demo Mode**
- **Interactive Controls**: Test all system features
- **Mock Data**: Realistic simulation data
- **Performance Monitoring**: Queue health and statistics
- **Action Logging**: Track all demo interactions

### **Development Tools**
- **TypeScript Support**: Full type safety
- **Error Handling**: Comprehensive error management
- **Logging**: Detailed system logging
- **Debug Mode**: Enhanced debugging information

## 📈 **Performance Metrics**

### **Queue Health Indicators**
- **Success Rate**: Percentage of successful actions
- **Processing Time**: Average action processing time
- **Queue Length**: Number of pending actions
- **Error Rate**: Failed action percentage

### **Location Tracking Metrics**
- **Accuracy**: GPS precision levels
- **Battery Impact**: Power consumption optimization
- **Update Frequency**: Location update intervals
- **Proximity Detection**: Nearby amenity identification

## 🚀 **Future Enhancements**

### **Planned Features**
- **Machine Learning**: Enhanced recommendation algorithms
- **Social Features**: Share trails with friends
- **Gamification**: More achievement types and rewards
- **AR Integration**: Augmented reality trail guidance
- **Voice Commands**: Hands-free trail navigation

### **Integration Opportunities**
- **Payment Systems**: Direct purchase integration
- **Loyalty Programs**: Airport loyalty point integration
- **Transportation**: Public transport integration
- **Weather Services**: Real-time weather data
- **Event Calendar**: Special events and promotions

## 🤝 **Contributing**

### **Development Setup**
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Start development server: `npm run dev`

### **Code Standards**
- **TypeScript**: Strict type checking
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **Testing**: Unit and integration tests

## 📚 **API Reference**

### **Shopping Trail Service**
```typescript
// Get user progress
const progress = await shoppingTrailService.getUserProgress(userId);

// Track a visit
await shoppingTrailService.trackVisit(amenityId, rating, amount, userId);

// Get collection details
const collection = await shoppingTrailService.getCollectionDetails();
```

### **Location Manager**
```typescript
// Start tracking
await locationManager.startTracking();

// Get current state
const state = locationManager.getState();

// Check proximity
const isNearby = locationManager.isNearShoppingAmenities();
```

### **Smart Queue**
```typescript
// Get queue statistics
const stats = smartQueue.getStats();

// Get queue status
const status = smartQueue.getStatus();

// Clear completed actions
smartQueue.clearCompleted();
```

## 🆘 **Support & Troubleshooting**

### **Common Issues**
- **Location Permission**: Ensure GPS access is granted
- **Network Connectivity**: Check internet connection
- **Battery Level**: Low battery may affect tracking
- **Browser Compatibility**: Use modern browsers

### **Debug Information**
- **Console Logs**: Detailed system information
- **Queue Status**: Real-time queue monitoring
- **Location State**: Current tracking status
- **Error Reports**: Comprehensive error details

---

**Built with ❤️ for Terminal Plus**

*Transform your airport shopping experience with intelligent, personalized trails!*
