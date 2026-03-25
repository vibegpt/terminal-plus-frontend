import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import localAmenities from '@/data/amenities.json';
import { normalizeAmenity, toSlug } from '@/utils/normalizeAmenity';
import AmenityDetailPage from '@/components/AmenityDetailPage';

export default function EnhancedAmenityDetail() {
  const navigate = useNavigate();
  const { slug } = useParams();

  // Find the amenity by slug and normalize it
  const rawAmenity = slug ? localAmenities.find(a => {
    // Check if the amenity has a slug field that matches
    if (a.slug === slug) return true;
    
    // If no slug field, generate one from the name and check if it matches
    if (!a.slug) {
      const generatedSlug = toSlug(a.name);
      return generatedSlug === slug;
    }
    
    return false;
  }) : null;
  const amenity = rawAmenity ? normalizeAmenity(rawAmenity) : null;

  if (!amenity) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-slate-800">Amenity Not Found</h1>
          <p className="text-slate-600 mb-4">The amenity "{slug}" is not available yet.</p>
          <p className="text-sm text-slate-500 mb-6">We're working on adding more detailed information for this amenity.</p>
          <div className="space-y-3">
            <Button variant="outline" onClick={() => navigate(-1)} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={() => navigate("/")} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
              <Home className="w-4 h-4 mr-2" />
              Return Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Add default values for missing properties
  const amenityWithDefaults = {
    ...amenity,
    rating: amenity.rating || 4.5,
    review_count: amenity.review_count || 50,
    estimated_duration: amenity.estimated_duration || 30,
    distance: amenity.distance || '2 min walk',
    features: amenity.features || {
      wifi: true, power_outlets: true, wheelchair_accessible: true, family_friendly: true, pet_friendly: false, credit_cards: true, mobile_payment: true
    },
    gallery: amenity.gallery || [amenity.image_url || '/images/default-amenity.jpg'],
    image_url: amenity.image_url || '/images/default-amenity.jpg'
  };

  // Convert features object to array of strings
  const featuresArray = Object.entries(amenityWithDefaults.features || {})
    .filter(([_, enabled]) => enabled)
    .map(([key, _]) => {
      const featureMap: Record<string, string> = {
        wifi: 'Wi-Fi',
        power_outlets: 'Power Outlets',
        wheelchair_accessible: 'Wheelchair Accessible',
        family_friendly: 'Family Friendly',
        pet_friendly: 'Pet Friendly',
        credit_cards: 'Credit Cards',
        mobile_payment: 'Contactless Payment'
      };
      return featureMap[key] || key;
    });

  // Format opening hours
  const formatOpeningHours = (opening_hours: any): string => {
    if (!opening_hours) return "Hours not available";
    
    if (opening_hours["Monday-Sunday"] === "24/7") {
      return "Open 24hrs";
    }
    
    const hours = opening_hours["Monday-Sunday"];
    if (hours) {
      const [open, close] = hours.split("-");
      const formatTime = (t: string) => {
        if (!t) return "";
        let [h, m] = t.split(":");
        let hour = parseInt(h, 10);
        const min = m || "00";
        const ampm = hour >= 12 ? "pm" : "am";
        if (hour === 0) hour = 12;
        if (hour > 12) hour -= 12;
        return `${hour}:${min}${ampm}`;
      };
      return `${formatTime(open)}–${formatTime(close)}`;
    }
    
    return "Hours not available";
  };

  // Get vibe for display
  const amenityVibe = amenity.vibe_tags?.[0] || 'Comfort';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)} className="hover:bg-slate-100">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button variant="ghost" onClick={() => navigate("/")} className="hover:bg-slate-100">
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <AmenityDetailPage
          name={amenityWithDefaults.name}
          imageUrls={[
            amenityWithDefaults.image_url,
            ...(amenityWithDefaults.gallery || []).slice(0, 2)
          ]}
          vibe={amenityVibe}
          rating={amenityWithDefaults.rating}
          reviews={amenityWithDefaults.review_count}
          category={amenityWithDefaults.category}
          openHours={formatOpeningHours(amenityWithDefaults.opening_hours)}
          features={featuresArray}
          locationMapUrl={`https://maps.google.com/maps?q=${encodeURIComponent(amenityWithDefaults.name + ' ' + amenityWithDefaults.terminal)}&z=15&output=embed`}
          similar={[
            { name: "Coffee Shop", distance: "Nearby", price: "$$" },
            { name: "Rest Area", distance: "2 min walk", price: "Free" },
          ]}
        />
      </div>
    </div>
  );
} 