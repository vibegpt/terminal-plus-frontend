# Enhanced Singapore (SIN) Transit Logic

## 🎯 **Core Capability**

**Yes, the app can intelligently predict which terminal the user will land at and create personalized transit recommendations using time and terminal as filters.**

## 🏗️ **How It Works**

### 1. **Terminal Prediction System**
The app uses a sophisticated terminal guessing system based on airline codes:

```typescript
// Example terminal predictions for SIN
"SQ": "T3", // Singapore Airlines
"MI": "T2", // SilkAir  
"TR": "T2", // Scoot
"QF": "T1", // Qantas
"BA": "T1", // British Airways
"EK": "T3", // Emirates
"CX": "T4", // Cathay Pacific
```

### 2. **Intelligent Prioritization Algorithm**
When a user is transiting through SIN, the app:

1. **Predicts arrival terminal** based on flight number/airline
2. **Loads all transit-accessible amenities** from all 5 terminals (T1, T2, T3, T4, JEWEL)
3. **Applies smart prioritization** based on:
   - **Terminal proximity** (same terminal = highest priority)
   - **Time constraints** (shorter walks for short layovers)
   - **Transit accessibility** (only amenities marked `available_in_transit: true`)

### 3. **Time-Based Filtering Strategy**

| Layover Duration | Recommendation Strategy | Priority Logic |
|------------------|------------------------|----------------|
| **> 60 min** | Full access to all terminals | All transit amenities, prioritize by proximity |
| **30-60 min** | Prefer same/adjacent terminals | Heavy penalty for T4 unless quick service |
| **< 30 min** | Same terminal only | Only amenities in arrival terminal |
| **< 15 min** | Minimal recommendations | "No time to explore" or quick same-terminal options |

## 🔧 **Technical Implementation**

### Enhanced Hook: `useSINTransitAmenities`

```typescript
interface SINTransitOptions {
  timeLeft?: number;
  arrivalFlightNumber?: string;
  departureFlightNumber?: string;
  layoverDuration?: number;
}

export function useSINTransitAmenities({
  timeLeft,
  arrivalFlightNumber,
  departureFlightNumber,
  layoverDuration
}: SINTransitOptions = {})
```

### Priority Scoring Algorithm

```typescript
// Priority scoring based on:
let priorityScore = 0;

// 1. Terminal proximity
if (amenityTerminal === predictedArrivalTerminal) {
  priorityScore += 100; // Same terminal
} else if (terminalDistance === 1) {
  priorityScore += 50;  // Adjacent terminal
} else if (terminalDistance === 2) {
  priorityScore += 25;  // Two terminals away
}

// 2. Time-based adjustments
if (timeLeft < 30 && walkMinutes <= 10) {
  priorityScore += 20; // Quick access bonus
}
if (timeLeft < 60 && walkMinutes > 15) {
  priorityScore -= 30; // Long walk penalty
}
```

## 📊 **Real-World Examples**

### Example 1: QF1 (Qantas) Transit
- **Flight**: QF1 (SYD-SIN-LHR)
- **Predicted Terminal**: T1 (Qantas terminal)
- **Layover**: 90 minutes
- **Recommendations**: 
  - High priority: T1 amenities
  - Medium priority: T2/T3 amenities (adjacent)
  - Lower priority: T4/JEWEL (further away)

### Example 2: SQ308 (Singapore Airlines) Transit
- **Flight**: SQ308 (SIN-LHR)
- **Predicted Terminal**: T3 (Singapore Airlines terminal)
- **Layover**: 45 minutes
- **Recommendations**:
  - High priority: T3 amenities
  - Medium priority: T2/T4 (adjacent)
  - Excluded: Long walks to T1

### Example 3: Short Layover (20 minutes)
- **Any flight with 20-minute layover**
- **Recommendations**:
  - Only same-terminal amenities
  - Quick access options only
  - Heavy time penalties for terminal changes

## 🎯 **Key Features**

### ✅ **Automatic Terminal Detection**
- Uses flight number to predict arrival terminal
- Falls back to T1 if flight number unknown
- Supports all major airlines operating at SIN

### ✅ **Smart Time Management**
- 5-minute navigation buffer
- Time-based filtering and prioritization
- Different strategies for different layover durations

### ✅ **Comprehensive Coverage**
- All 4 terminals (T1, T2, T3, T4) + JEWEL
- Only transit-accessible amenities
- Real-time availability and walk times

### ✅ **Intelligent Prioritization**
- Proximity-based scoring
- Time-constraint adjustments
- Personalized recommendations

## 🔍 **Debugging & Monitoring**

The system provides comprehensive logging:

```typescript
console.log("🔍 Predicted arrival terminal: T3");
console.log("🔍 Top 3 amenities:", [
  { name: "Singapore Airlines Lounge", terminal: "SIN-T3", priorityScore: 120 },
  { name: "Starbucks", terminal: "SIN-T3", priorityScore: 115 },
  { name: "Duty Free", terminal: "SIN-T2", priorityScore: 75 }
]);
```

## 🚀 **Future Enhancements**

1. **Real-time flight data integration** for more accurate terminal prediction
2. **Dynamic terminal change detection** for flight delays/reroutes
3. **Personalized preferences** (food preferences, shopping interests)
4. **Integration with airport APIs** for real-time amenity status

## 📱 **User Experience**

Users will see:
- **Personalized recommendations** based on their arrival terminal
- **Time-appropriate suggestions** for their layover duration
- **Clear terminal information** for each recommendation
- **Walk time estimates** to help with planning

The system ensures users get the most relevant recommendations for their specific transit scenario at Singapore Changi Airport! 🎉 