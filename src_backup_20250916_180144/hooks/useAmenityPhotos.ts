// Hook for automatically loading Google Places photos for amenities
import { useState, useEffect } from 'react';
import { placesPhotosService } from '../services/googlePlacesPhotos';
import type { Amenity } from '../types/amenity.types';

interface UseAmenityPhotosReturn {
  photosLoaded: Record<string, string>;
  isLoading: boolean;
  loadPhotosForAmenities: (amenities: Amenity[]) => void;
}

export const useAmenityPhotos = (): UseAmenityPhotosReturn => {
  const [photosLoaded, setPhotosLoaded] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const loadPhotosForAmenities = async (amenities: Amenity[]) => {
    if (!amenities.length) return;
    
    setIsLoading(true);
    
    // Filter amenities that don't have photos and have required data
    const needingPhotos = amenities.filter(amenity => 
      !amenity.image_url && 
      !photosLoaded[amenity.id] && 
      amenity.name && 
      amenity.airport_code
    );

    if (needingPhotos.length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      await placesPhotosService.batchFetchPhotos(
        needingPhotos.map(a => ({
          name: a.name,
          airport_code: a.airport_code!,
          id: a.id
        })),
        (id, photoUrl) => {
          setPhotosLoaded(prev => ({
            ...prev,
            [id]: photoUrl
          }));
        }
      );
    } catch (error) {
      console.error('Error loading amenity photos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    photosLoaded,
    isLoading,
    loadPhotosForAmenities
  };
};

// Utility hook for a single amenity
export const useAmenityPhoto = (amenity: Amenity) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    amenity.image_url || amenity.image || null
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!photoUrl && amenity.name && amenity.airport_code) {
      setIsLoading(true);
      placesPhotosService
        .getAmenityPhotos(amenity.name, amenity.airport_code)
        .then(photos => {
          if (photos.length > 0) {
            setPhotoUrl(photos[0]);
          }
        })
        .catch(error => {
          console.error('Error loading photo:', error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [amenity.name, amenity.airport_code, photoUrl]);

  return { photoUrl, isLoading };
};