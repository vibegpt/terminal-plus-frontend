// Update for the collection modal in terminal-best-of-inline-styles.tsx
// Add this import at the top
import { navigateToAmenity } from '@/utils/amenityNavigation';

// Then update the attractions display in the modal:
{selectedCollection.attractions && selectedCollection.attractions.length > 0 ? (
  <div className="space-y-3">
    {selectedCollection.attractions.map((attraction: any, idx: number) => (
      <div 
        key={idx}
        onClick={() => {
          const slug = attraction.amenity_slug || attraction.name?.toLowerCase().replace(/\s+/g, '-');
          navigate(navigateToAmenity(slug, terminalCode));
        }}
        className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between hover:bg-gray-100 transition-all cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{attraction.icon}</span>
          <div>
            <h4 className="font-semibold text-gray-900">{attraction.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-500">{attraction.terminal}</span>
              <Clock className="w-3 h-3 text-gray-500 ml-2" />
              <span className="text-xs text-gray-500">{attraction.time}</span>
            </div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    ))}
  </div>
) : (
  <div className="text-center py-8 text-gray-500">
    <p>No amenities available for this collection yet.</p>
  </div>
)}