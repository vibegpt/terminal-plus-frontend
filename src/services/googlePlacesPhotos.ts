// Google Places Photos Service
// Automatically fetches and caches venue photos from Google Places API

interface PlacePhoto {
  photo_reference: string;
  height: number;
  width: number;
}

interface PlaceDetails {
  place_id: string;
  name: string;
  photos?: PlacePhoto[];
  rating?: number;
  website?: string;
}

class GooglePlacesPhotosService {
  private apiKey: string;
  private cache = new Map<string, string>();
  
  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  }

  // Search for a place and get photo URLs
  async getAmenityPhotos(amenityName: string, airportCode: string): Promise<string[]> {
    if (!this.apiKey) {
      console.warn('Google Maps API key not configured');
      return [];
    }

    const cacheKey = `${amenityName}-${airportCode}`;
    if (this.cache.has(cacheKey)) {
      return [this.cache.get(cacheKey)!];
    }

    try {
      // Search for the place near the airport
      const query = `${amenityName} ${airportCode} airport`;
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${this.apiKey}`;
      
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      
      if (searchData.results && searchData.results.length > 0) {
        const place = searchData.results[0];
        
        if (place.photos && place.photos.length > 0) {
          // Get the best photo (largest resolution)
          const bestPhoto = place.photos.reduce((prev: PlacePhoto, current: PlacePhoto) => 
            (current.width * current.height) > (prev.width * prev.height) ? current : prev
          );
          
          // Generate photo URL
          const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${bestPhoto.photo_reference}&key=${this.apiKey}`;
          
          this.cache.set(cacheKey, photoUrl);
          return [photoUrl];
        }
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching photos for ${amenityName}:`, error);
      return [];
    }
  }

  // Batch fetch photos for multiple amenities
  async batchFetchPhotos(amenities: Array<{name: string, airport_code: string, id: string}>, updateCallback: (id: string, photoUrl: string) => void) {
    const promises = amenities.map(async (amenity) => {
      const photos = await this.getAmenityPhotos(amenity.name, amenity.airport_code);
      if (photos.length > 0) {
        updateCallback(amenity.id, photos[0]);
      }
    });
    
    await Promise.all(promises);
  }

  // Clear cache (useful for testing)
  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
export const placesPhotosService = new GooglePlacesPhotosService();
export default GooglePlacesPhotosService;