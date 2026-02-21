# Google Maps Integration Setup

## 🗺️ Getting Started with Google Maps

### 1. Get Your Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Maps JavaScript API**
4. Go to **Credentials** and create an API key
5. Restrict the API key to your domain for security

### 2. Add Your API Key

Create a `.env` file in your project root and add:

```env
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### 3. Available Map Views

We now have three different map implementations:

#### 🌍 **Google Maps Terminal** (`/google-maps-terminal`)
- **Real Google Maps** with actual satellite imagery
- **Custom vibe-colored pins** with emoji icons
- **Interactive InfoWindows** with amenity details
- **Real coordinates** around Sydney Airport
- **TikTok-style carousel** at the bottom

#### 🗺️ **Enhanced Terminal Map** (`/enhanced-terminal-map`)
- **Mock map** with custom positioning
- **Custom pin system** with glow effects
- **Preview bubbles** on pin click
- **Horizontal carousel** with AmenityCards

#### 🗺️ **TikTok-Style Map** (`/terminal-map`)
- **Original TikTok-inspired** design
- **Spatial-first** layout
- **Vibe filtering** with color-coded chips
- **Mobile-optimized** interactions

### 4. Features

#### **Custom Pins by Vibe**
- 🍔 **Refuel** (Orange) - Food & drinks
- 🛋️ **Comfort** (Blue) - Lounges & seating
- ⚡ **Quick** (Yellow) - Fast service
- 🔍 **Explore** (Purple) - Discovery
- 💼 **Work** (Green) - Business amenities
- 🛍️ **Shop** (Pink) - Retail & shopping
- 😌 **Chill** (Teal) - Relaxation

#### **Interactive Elements**
- **Tap pins** to see detailed previews
- **Filter by vibe** using the top chips
- **Swipe carousel** at the bottom
- **Navigate to details** from previews

### 5. Development Notes

- The Google Maps component will work with a demo key for development
- For production, use a restricted API key
- All coordinates are generated around Sydney Airport (-33.9399, 151.1753)
- The map uses custom SVG icons for vibe-specific pins

### 6. Next Steps

1. Add your Google Maps API key to `.env`
2. Test the `/google-maps-terminal` route
3. Customize pin positions with real amenity coordinates
4. Add directions functionality
5. Implement real-time location services

---

**Ready to explore?** Visit `http://localhost:5179/google-maps-terminal` to see the real Google Maps integration in action! 🚀 