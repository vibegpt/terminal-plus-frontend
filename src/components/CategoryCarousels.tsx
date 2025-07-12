import React from "react";
import { Button } from "@/components/ui/button";

interface Amenity {
  name: string;
  amenity_type: string;
  location_description: string;
  category: string;
  vibe_tags?: string[];
  price_tier?: string;
  opening_hours?: any;
  image_url?: string;
  slug: string;
  terminal_code: string;
}

interface CategoryCarouselsProps {
  amenities: Amenity[];
  terminal: string;
  vibe?: string;
  onAmenityClick?: (slug: string) => void;
}

// Helper: Check if amenity is open now
function isAmenityOpen(opening_hours: any): boolean {
  if (!opening_hours) return true;
  const now = new Date();
  const day = now.toLocaleString('en-US', { weekday: 'long' });
  const hours = opening_hours[day] || opening_hours["Monday-Sunday"];
  if (!hours) return true;
  if (hours.toLowerCase() === '24/7') return true;
  const [open, close] = hours.split('-');
  if (!open || !close) return true;
  const [openH, openM] = open.split(':').map(Number);
  const [closeH, closeM] = close.split(':').map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const openMins = openH * 60 + openM;
  const closeMins = closeH * 60 + closeM;
  if (closeMins < openMins) {
    return nowMins >= openMins || nowMins < closeMins;
  }
  return nowMins >= openMins && nowMins < closeMins;
}

const categoryIcons: Record<string, string> = {
  'Food & Drink': '🍽️',
  'Lounges': '🛋️',
  'Shopping': '🛍️',
  'Services': '🛠️',
  'Rest': '🧘',
  'Work': '💼',
  'Quick': '⚡',
};

const CategoryCarousels: React.FC<CategoryCarouselsProps> = ({ amenities, terminal, vibe, onAmenityClick }) => {
  // Group amenities by category, filter by terminal
  const grouped = React.useMemo(() => {
    const byCat: Record<string, Amenity[]> = {};
    for (const amenity of amenities) {
      if (amenity.terminal_code !== terminal) continue;
      if (!byCat[amenity.category]) byCat[amenity.category] = [];
      byCat[amenity.category].push(amenity);
    }
    return byCat;
  }, [amenities, terminal]);

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([category, catAmenities]) => (
        <div key={category}>
          <div className="flex items-center mb-2">
            <span className="text-xl mr-2">{categoryIcons[category] || '✨'}</span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{category}</h2>
          </div>
          <div className="overflow-x-auto w-full pb-2 snap-x snap-mandatory">
            <div className="flex flex-nowrap gap-4">
              {catAmenities.map((amenity) => {
                const openNow = isAmenityOpen(amenity.opening_hours);
                const highlight = vibe && amenity.vibe_tags?.includes(vibe);
                return (
                  <div
                    key={amenity.slug}
                    className={`relative min-w-[260px] max-w-[280px] h-64 rounded-lg overflow-hidden shadow-lg group flex flex-col justify-end focus:outline-none cursor-pointer transition-all duration-200 border-2 snap-start ${highlight ? 'border-blue-500' : 'border-transparent'}`}
                    onClick={() => onAmenityClick?.(amenity.slug)}
                    tabIndex={0}
                    role="button"
                    aria-label={`View details for ${amenity.name}`}
                  >
                    {amenity.image_url ? (
                      <img
                        src={amenity.image_url}
                        alt={amenity.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-slate-200 flex items-center justify-center text-4xl">{categoryIcons[amenity.category] || '✨'}</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    <div className="relative z-10 p-4 w-full">
                      <div className="font-bold text-lg text-white drop-shadow-md flex items-center">
                        {categoryIcons[amenity.category] || '✨'}
                        <span className="ml-2">{amenity.name}</span>
                      </div>
                      <div className="text-slate-200 text-sm mb-1 drop-shadow-md truncate">
                        {amenity.location_description}
                      </div>
                      <div className="flex flex-wrap gap-2 mb-1">
                        {amenity.vibe_tags && amenity.vibe_tags.map((tag: string) => (
                          <span key={tag} className={`inline-block text-xs px-2 py-1 rounded-full drop-shadow ${vibe && tag === vibe ? 'bg-blue-500 text-white' : 'bg-white/30 text-white'}`}>{tag}</span>
                        ))}
                      </div>
                      <div className={`text-xs font-semibold ${openNow ? 'text-green-300' : 'text-red-300'} drop-shadow`}>
                        {openNow ? 'Open' : 'Closed'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CategoryCarousels; 