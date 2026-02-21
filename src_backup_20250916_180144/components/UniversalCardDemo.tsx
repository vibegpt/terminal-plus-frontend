import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UniversalCard } from './UniversalCard';

// Demo component to test all card variants
export const UniversalCardDemo: React.FC = () => {
  const navigate = useNavigate();

  const handleCardClick = (cardType: string, title: string) => {
    console.log(`Clicked ${cardType}: ${title}`);
    
    // Route to appropriate destination
    if (cardType === 'amenity') {
      const slug = title.toLowerCase().replace(/\s+/g, '-');
      navigate(`/amenity/${slug}`);
    } else if (cardType === 'collection') {
      // Route to collection view (would be implemented)
      navigate(`/collections/${title.toLowerCase().replace(/\s+/g, '-')}`);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center">Unified Card System Demo</h1>
      
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Best Of Collection Cards */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">📦 Best Of Collections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <UniversalCard
              variant="collection"
              id="quick-fuel-ups"
              title="Quick Fuel-Ups"
              subtitle="Fast food & coffee"
              vibe="Refuel"
              itemCount={8}
              description="Perfect spots when you're short on time"
              preview={["Starbucks", "Burger King", "Pret A Manger", "Costa Coffee"]}
              onClick={() => handleCardClick('collection', 'Quick Fuel-Ups')}
            />
            
            <UniversalCard
              variant="collection"
              id="chill-zones"
              title="Chill Zones"
              subtitle="Quiet relaxation spots"
              vibe="Chill"
              itemCount={5}
              description="Peaceful areas to decompress before your flight"
              preview={["Meditation Room", "Garden Terrace", "Quiet Lounge"]}
              onClick={() => handleCardClick('collection', 'Chill Zones')}
            />
            
            <UniversalCard
              variant="collection"
              id="work-hubs"
              title="Work Hubs"
              subtitle="Productive spaces"
              vibe="Work"
              itemCount={6}
              description="WiFi, power outlets, and quiet environments"
              preview={["Business Lounge", "Co-working Space", "Study Pods"]}
              onClick={() => handleCardClick('collection', 'Work Hubs')}
            />
          </div>
        </section>

        {/* Vibe-Selected Amenities */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">🎨 Vibe-Selected Amenities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <UniversalCard
              variant="amenity"
              id="starbucks-t1"
              title="Starbucks"
              subtitle="Coffee & Light Meals"
              vibe="Chill"
              rating={4.2}
              walkTime="3 min walk"
              price="$$"
              openHours="6:00am - 10:00pm"
              crowdLevel="medium"
              image="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=100&h=100&fit=crop"
              onClick={() => handleCardClick('amenity', 'Starbucks')}
            />
            
            <UniversalCard
              variant="amenity"
              id="burger-king"
              title="Burger King"
              subtitle="Fast food classics"
              vibe="Refuel"
              rating={3.8}
              walkTime="5 min walk"
              price="$"
              openHours="24/7"
              crowdLevel="high"
              image="https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=100&h=100&fit=crop"
              onClick={() => handleCardClick('amenity', 'Burger King')}
            />
            
            <UniversalCard
              variant="amenity"
              id="business-lounge"
              title="Business Lounge"
              subtitle="Premium workspace"
              vibe="Work"
              rating={4.6}
              walkTime="7 min walk"
              price="$$$"
              openHours="5:00am - 11:00pm"
              crowdLevel="low"
              image="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=100&h=100&fit=crop"
              onClick={() => handleCardClick('amenity', 'Business Lounge')}
            />
          </div>
        </section>

        {/* Personalized Recommendations */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">🎯 Personalized Recommendations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <UniversalCard
              variant="recommendation"
              id="urgent-coffee"
              title="Express Coffee Bar"
              subtitle="Quick caffeine fix"
              vibe="Quick"
              rating={4.1}
              walkTime="2 min walk"
              priority="high"
              timeContext="30 min until boarding"
              personalizedReason="Perfect for your tight schedule and need for speed"
              image="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=100&h=100&fit=crop"
              onClick={() => handleCardClick('amenity', 'Express Coffee Bar')}
            />
            
            <UniversalCard
              variant="recommendation"
              id="comfort-zone"
              title="Relaxation Pod"
              subtitle="Private quiet space"
              vibe="Comfort"
              rating={4.7}
              walkTime="4 min walk"
              priority="medium"
              timeContext="2 hours available"
              personalizedReason="Matches your preference for peaceful environments"
              image="https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=100&h=100&fit=crop"
              onClick={() => handleCardClick('amenity', 'Relaxation Pod')}
            />
            
            <UniversalCard
              variant="recommendation"
              id="duty-free"
              title="Duty Free Shopping"
              subtitle="Tax-free luxury goods"
              vibe="Shop"
              rating={4.3}
              walkTime="6 min walk"
              priority="low"
              timeContext="1 hour available"
              personalizedReason="Great for last-minute gifts and souvenirs"
              image="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&h=100&fit=crop"
              onClick={() => handleCardClick('amenity', 'Duty Free Shopping')}
            />
          </div>
        </section>

        {/* Different Vibes Showcase */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">🌈 Vibe Variations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['Refuel', 'Chill', 'Work', 'Explore', 'Quick', 'Comfort', 'Shop'].map(vibe => (
              <UniversalCard
                key={vibe}
                variant="amenity"
                id={`${vibe.toLowerCase()}-demo`}
                title={`${vibe} Example`}
                subtitle={`Perfect for ${vibe.toLowerCase()} mood`}
                vibe={vibe}
                rating={4.0 + Math.random() * 1}
                walkTime={`${Math.floor(Math.random() * 10) + 2} min walk`}
                price="$$"
                onClick={() => handleCardClick('vibe-demo', vibe)}
              />
            ))}
          </div>
        </section>

        {/* Navigation Test */}
        <section className="mt-12 p-6 bg-white rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">🧭 Navigation Test</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-4 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-800 font-medium transition-colors"
            >
              🏠 Home
            </button>
            <button
              onClick={() => navigate('/plan-journey')}
              className="p-4 bg-green-100 hover:bg-green-200 rounded-lg text-green-800 font-medium transition-colors"
            >
              🛫 Smart Journey
            </button>
            <button
              onClick={() => navigate('/experience?context=departure&airport=SYD&terminal=T1&vibe=chill')}
              className="p-4 bg-purple-100 hover:bg-purple-200 rounded-lg text-purple-800 font-medium transition-colors"
            >
              🎯 Experience View
            </button>
            <button
              onClick={() => navigate('/best-of/SYD-T1')}
              className="p-4 bg-orange-100 hover:bg-orange-200 rounded-lg text-orange-800 font-medium transition-colors"
            >
              📦 Best Of Page
            </button>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            Click these buttons to test navigation between different parts of the app
          </p>
        </section>
      </div>
    </div>
  );
};

export default UniversalCardDemo;
