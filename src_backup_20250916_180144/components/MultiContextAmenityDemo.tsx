import React from 'react';
import ContextAwareAmenityCard from './ContextAwareAmenityCard';
import { getAllContextAmenities, getCollectionsForAmenity } from '../utils/amenityContexts';

// Demo component showing the same amenity in different collections
// Demonstrates contextual messaging and different emphasis per collection

const MultiContextAmenityDemo: React.FC = () => {
  const multiContextAmenities = getAllContextAmenities();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Multi-Context Amenity Demo
      </h1>
      
      <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
        The same amenity can appear in different collections with contextual messaging, 
        different emphasis, and tailored call-to-actions based on the user's current context.
      </p>

      {/* Butterfly Garden Example */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center text-green-600">
          🦋 Butterfly Garden - Same Amenity, Different Contexts
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Explore Collection Context */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-green-700">Explore Collection</h3>
              <p className="text-sm text-gray-600">Context: "Discover tropical species"</p>
            </div>
            
            <ContextAwareAmenityCard
              amenity={{
                id: 'butterfly-garden',
                name: 'Butterfly Garden',
                description: 'A stunning indoor garden featuring thousands of butterflies',
                category: 'Attraction',
                location: 'Terminal 3, Level 2'
              }}
              collectionSlug="explore"
              onAmenityClick={(id) => console.log(`Clicked ${id} in explore context`)}
            />
          </div>

          {/* Chill Collection Context */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-700">Chill Collection</h3>
              <p className="text-sm text-gray-600">Context: "Peaceful nature escape"</p>
            </div>
            
            <ContextAwareAmenityCard
              amenity={{
                id: 'butterfly-garden',
                name: 'Butterfly Garden',
                description: 'A stunning indoor garden featuring thousands of butterflies',
                category: 'Attraction',
                location: 'Terminal 3, Level 2'
              }}
              collectionSlug="chill"
              onAmenityClick={(id) => console.log(`Clicked ${id} in chill context`)}
            />
          </div>

          {/* Changi Exclusives Context */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-purple-700">Changi Exclusives</h3>
              <p className="text-sm text-gray-600">Context: "World's largest butterfly habitat"</p>
            </div>
            
            <ContextAwareAmenityCard
              amenity={{
                id: 'butterfly-garden',
                name: 'Butterfly Garden',
                description: 'A stunning indoor garden featuring thousands of butterflies',
                category: 'Attraction',
                location: 'Terminal 3, Level 2'
              }}
              collectionSlug="changi-exclusives"
              onAmenityClick={(id) => console.log(`Clicked ${id} in exclusives context`)}
            />
          </div>
        </div>
      </div>

      {/* Rain Vortex Example */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">
          🌊 Rain Vortex - Different Perspectives
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Explore Collection Context */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-700">Explore Collection</h3>
              <p className="text-sm text-gray-600">Context: "Engineering marvel"</p>
            </div>
            
            <ContextAwareAmenityCard
              amenity={{
                id: 'jewel-waterfall',
                name: 'Rain Vortex',
                description: 'The world\'s tallest indoor waterfall',
                category: 'Attraction',
                location: 'Jewel Changi, Level 1'
              }}
              collectionSlug="explore"
              onAmenityClick={(id) => console.log(`Clicked ${id} in explore context`)}
            />
          </div>

          {/* Changi Exclusives Context */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-purple-700">Changi Exclusives</h3>
              <p className="text-sm text-gray-600">Context: "Jewel's centerpiece"</p>
            </div>
            
            <ContextAwareAmenityCard
              amenity={{
                id: 'jewel-waterfall',
                name: 'Rain Vortex',
                description: 'The world\'s tallest indoor waterfall',
                category: 'Attraction',
                location: 'Jewel Changi, Level 1'
              }}
              collectionSlug="changi-exclusives"
              onAmenityClick={(id) => console.log(`Clicked ${id} in exclusives context`)}
            />
          </div>

          {/* Chill Collection Context */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-teal-700">Chill Collection</h3>
              <p className="text-sm text-gray-600">Context: "Soothing water sounds"</p>
            </div>
            
            <ContextAwareAmenityCard
              amenity={{
                id: 'jewel-waterfall',
                name: 'Rain Vortex',
                description: 'The world\'s tallest indoor waterfall',
                category: 'Attraction',
                location: 'Jewel Changi, Level 1'
              }}
              collectionSlug="chill"
              onAmenityClick={(id) => console.log(`Clicked ${id} in chill context`)}
            />
          </div>
        </div>
      </div>

      {/* Hawker Food Court Example */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center text-orange-600">
          🥘 Hawker Food Court - Different Appeals
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Refuel Collection Context */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-orange-700">Refuel Collection</h3>
              <p className="text-sm text-gray-600">Context: "Local food at real prices"</p>
            </div>
            
            <ContextAwareAmenityCard
              amenity={{
                id: 'hawker-food-court',
                name: 'Local Hawker Food Court',
                description: 'Authentic Singapore street food experience',
                category: 'Food & Beverage',
                price_level: '$$',
                location: 'Terminal 3, Level 1'
              }}
              collectionSlug="refuel"
              onAmenityClick={(id) => console.log(`Clicked ${id} in refuel context`)}
            />
          </div>

          {/* Local Eats Context */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-700">Local Eats Singapore</h3>
              <p className="text-sm text-gray-600">Context: "Traditional Singapore cuisine"</p>
            </div>
            
            <ContextAwareAmenityCard
              amenity={{
                id: 'hawker-food-court',
                name: 'Local Hawker Food Court',
                description: 'Authentic Singapore street food experience',
                category: 'Food & Beverage',
                price_level: '$$',
                location: 'Terminal 3, Level 1'
              }}
              collectionSlug="local-eats-sin"
              onAmenityClick={(id) => console.log(`Clicked ${id} in local-eats context`)}
            />
          </div>

          {/* Quick Bites Context */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-yellow-700">Quick Bites</h3>
              <p className="text-sm text-gray-600">Context: "Fast local food"</p>
            </div>
            
            <ContextAwareAmenityCard
              amenity={{
                id: 'hawker-food-court',
                name: 'Local Hawker Food Court',
                description: 'Authentic Singapore street food experience',
                category: 'Food & Beverage',
                price_level: '$$',
                location: 'Terminal 3, Level 1'
              }}
              collectionSlug="quick-bites"
              onAmenityClick={(id) => console.log(`Clicked ${id} in quick-bites context`)}
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">🎯 Key Benefits of Multi-Context Amenities</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">For Users:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Relevant messaging based on current context</li>
              <li>• Different emphasis points for different needs</li>
              <li>• Tailored call-to-actions</li>
              <li>• Consistent amenity information across collections</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">For Collections:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Same amenity serves multiple purposes</li>
              <li>• Contextual relevance increases engagement</li>
              <li>• Flexible collection curation</li>
              <li>• Better user experience through personalization</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiContextAmenityDemo;
