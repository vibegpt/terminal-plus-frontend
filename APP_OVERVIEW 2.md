# Terminal+ App Overview

## App Purpose & User Pain Points Solved

Terminal+ is a mobile-first web application designed to transform "dead time" in international airport terminals into a personalized, mood-driven experience.

### Core Problem Solved
- **Dead Time Transformation**: Converts waiting time in airport terminals from boring/draining to engaging/purposeful
- **Personalized Experience**: Tailors recommendations based on user's current mood, energy level, and journey context
- **Context-Aware Guidance**: Provides relevant suggestions based on departure, transit, or arrival phases
- **Mood-Driven Discovery**: Uses vibe-based filtering to match user's emotional state and preferences

### User Pain Points Addressed
1. **Boredom & Anxiety**: Long waits in unfamiliar terminals
2. **Decision Fatigue**: Overwhelming choices in large airport terminals
3. **Time Waste**: Unproductive waiting periods during layovers
4. **Disorientation**: Confusion about what's available and where to go
5. **Mismatched Expectations**: Recommendations that don't match current mood/energy

## Journey Phases

### 1. Departure Phase
- **Context**: User is preparing to board their flight
- **Focus**: Quick, efficient, stress-reducing options
- **Time Pressure**: Usually limited time before boarding
- **User State**: Often anxious, rushed, or excited
- **Recommendations**: Quick refuel, comfort zones, essential services

### 2. Transit Phase
- **Context**: User is in a layover or connecting flight
- **Focus**: Exploration, relaxation, productivity based on layover duration
- **Time Pressure**: Variable (short layovers vs. long waits)
- **User State**: Tired, bored, or looking to make the most of time
- **Recommendations**: Lounges, shopping, dining, work spaces, attractions

### 3. Arrival Phase
- **Context**: User has just landed and is navigating to next destination
- **Focus**: Essential services, transportation, final comforts
- **Time Pressure**: Usually moderate (waiting for baggage, transport)
- **User State**: Relieved, tired, or eager to continue journey
- **Recommendations**: Transportation info, final meals, comfort services

## Vibe Categories

### Chill 😌
- **Color**: #A8D0E6 (Soft Ice Blue)
- **Tone**: Calm, peaceful, decompression
- **Description**: Quiet lounges, chill cafes, and peaceful corners to decompress
- **Use Case**: When user needs to relax, destress, or find quiet spaces
- **Examples**: Meditation rooms, quiet lounges, peaceful cafes

### Explore 🔍
- **Color**: #F76C6C (Coral)
- **Tone**: Discovery, stimulation, curiosity
- **Description**: Wander, shop, and discover cool stuff you didn't expect
- **Use Case**: When user wants to discover new things or has time to explore
- **Examples**: Shopping centers, attractions, unique dining spots

### Comfort 🛋️
- **Color**: #CBAACB (Lavender)
- **Tone**: Safety, gentleness, rest
- **Description**: Stretch, nap, or just slow down — we'll find your cozy zone
- **Use Case**: When user needs physical comfort or rest
- **Examples**: Comfortable seating, nap pods, massage chairs

### Refuel 🍔
- **Color**: #FF7F50 (Punchy Red-Orange)
- **Tone**: Appetite, recharge, energy boost
- **Description**: Recharge with food, drinks, or a strong coffee fix
- **Use Case**: When user needs sustenance or energy boost
- **Examples**: Restaurants, cafes, food courts, coffee shops

### Work 💼
- **Color**: #D3B88C (Warm Taupe)
- **Tone**: Structure, focus, grounding
- **Description**: Find focused spots to plug in, tune out, and get things done
- **Use Case**: When user needs to be productive during wait time
- **Examples**: Business lounges, work pods, quiet workspaces

### Quick ⚡
- **Color**: #FFDD57 (Electric Yellow)
- **Tone**: Urgency, motion, alert
- **Description**: Grab what you need, fast — snacks, essentials, no time wasted
- **Use Case**: When user has limited time and needs efficiency
- **Examples**: Grab-and-go food, convenience stores, express services

### Shop 🛍️
- **Color**: #FFD6E0 (Light Pink)
- **Tone**: Retail therapy, discovery, indulgence
- **Description**: Browse, shop, and treat yourself to something special
- **Use Case**: When user wants to shop or browse retail options
- **Examples**: Duty-free shops, boutiques, souvenir stores

## Technical Implementation

### Vibe Metadata Structure
```typescript
{
  emoji: string;        // Visual representation
  color: string;        // Hex color code
  glow: string;         // CSS glow effect
  pin: string;          // Map pin emoji
}
```

### Recommendation Engine Integration
- **Vibe Filtering**: Amenities filtered by vibe tags
- **Context Awareness**: Recommendations adapt to journey phase
- **Energy Matching**: Suggestions match user's energy level
- **Time Optimization**: Recommendations consider available time
- **Location Relevance**: Terminal-specific suggestions

### User Experience Flow
1. **Journey Planning**: User enters flight details and selects vibe
2. **Context Detection**: App determines journey phase (departure/transit/arrival)
3. **Personalized Recommendations**: Filtered by vibe, context, and preferences
4. **Interactive Guidance**: Real-time updates and alternative suggestions
5. **Feedback Loop**: User corrections improve future recommendations

## Success Metrics

### User Engagement
- Time spent in app during terminal visits
- Number of recommendations viewed
- Vibe selection patterns
- Journey completion rates

### User Satisfaction
- Recommendation relevance scores
- User feedback on vibe accuracy
- Return usage rates
- Positive sentiment in reviews

### Business Impact
- User retention across multiple journeys
- Feature adoption rates
- Data quality improvements
- Platform expansion to new airports 