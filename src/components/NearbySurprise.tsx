import { useEffect, useState } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface NearbySurpriseProps {
  currentCollectionId: string;
  userTerminal: string;
  onDismiss: () => void;
  onTap: (amenitySlug: string) => void;
}

interface SurpriseAmenity {
  name: string;
  amenity_slug: string;
  description: string | null;
  vibe_tags: string | null;
  logo_url: string | null;
}

const VIBE_ACCENT: Record<string, string> = {
  Quick: 'bg-yellow-500/20 text-yellow-300',
  Refuel: 'bg-orange-500/20 text-orange-300',
  Explore: 'bg-red-500/20 text-red-300',
  Chill: 'bg-blue-500/20 text-blue-300',
  Comfort: 'bg-purple-500/20 text-purple-300',
  Work: 'bg-amber-500/20 text-amber-300',
  Shop: 'bg-emerald-500/20 text-emerald-300',
};

export default function NearbySurprise({
  currentCollectionId,
  userTerminal,
  onDismiss,
  onTap,
}: NearbySurpriseProps) {
  const [amenity, setAmenity] = useState<SurpriseAmenity | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const key = `tp_surprise_dismissed_${currentCollectionId}`;
    if (sessionStorage.getItem(key) === 'true') {
      setDismissed(true);
      return;
    }

    const fetchSurprise = async () => {
      // Get amenity IDs already in the current collection
      const { data: collectionAmenities } = await supabase
        .from('collection_amenities')
        .select('amenity_id')
        .eq('collection_id', currentCollectionId);

      const excludeIds = (collectionAmenities || []).map((ca: any) => ca.amenity_id);

      // Find a same-terminal amenity NOT in this collection
      let query = supabase
        .from('amenity_detail')
        .select('name, amenity_slug, description, vibe_tags, logo_url')
        .eq('terminal_code', userTerminal)
        .eq('airport_code', 'SIN')
        .limit(10);

      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      const { data } = await query;
      if (data && data.length > 0) {
        // Pick a random one from top results for variety
        const pick = data[Math.floor(Math.random() * Math.min(data.length, 5))];
        setAmenity(pick);
      }
    };

    fetchSurprise();
  }, [currentCollectionId, userTerminal]);

  const handleDismiss = () => {
    const key = `tp_surprise_dismissed_${currentCollectionId}`;
    sessionStorage.setItem(key, 'true');
    setDismissed(true);
    onDismiss();
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100) {
      handleDismiss();
    }
  };

  if (dismissed || !amenity) return null;

  const firstVibe = amenity.vibe_tags?.split(',')[0]?.trim() || '';
  const accentClass = VIBE_ACCENT[firstVibe] || 'bg-white/10 text-white/60';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, x: 200 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        className="mx-4 mt-4 cursor-grab active:cursor-grabbing"
        onClick={() => onTap(amenity.amenity_slug)}
      >
        <motion.div
          initial={{ boxShadow: '0 0 0 0 rgba(255,255,255,0.15)' }}
          animate={{ boxShadow: '0 0 0 0 rgba(255,255,255,0)' }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-4"
        >
          <div className="flex items-center gap-3">
            {amenity.logo_url ? (
              <img
                src={amenity.logo_url}
                alt={amenity.name}
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-white/40" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs text-white/40 font-medium">2 min away</span>
                {firstVibe && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${accentClass}`}>
                    {firstVibe}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-white truncate">{amenity.name}</p>
              {amenity.description && (
                <p className="text-xs text-white/50 truncate">{amenity.description}</p>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
