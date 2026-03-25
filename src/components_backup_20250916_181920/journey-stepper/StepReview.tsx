// /src/components/journey-stepper/StepReview.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { useValueMode } from '@/hooks/useValueMode';
import { ValueModeToggle } from '@/components/ValueModeToggle';
import { useJourneyContext } from '@/hooks/useJourneyContext';

interface Props {
  onBack: () => void;
  onConfirm: () => void;
  savedAmenities?: any[];
  visitedContexts?: string[];
}

const StepReview: React.FC<Props> = ({ onBack, onConfirm }) => {
  const { journeyData } = useJourneyContext();
  const { valueMode } = useValueMode();

  const insights = (context: 'departure' | 'transit' | 'arrival') => {
    if (!valueMode) return null;
    if (context === 'transit') return '🎁 Free lounge and budget food found';
    if (context === 'arrival') return '💸 Cheap SIM and transport deals available';
    return '🔥 Budget-friendly picks highlighted';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Review Your Journey</h2>
        <ValueModeToggle />
      </div>
      
      <div className="grid md:grid-cols-3 gap-4">
        {/* Departure */}
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold">{journeyData.departure} Departure</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Vibe: {journeyData.selected_vibe || 'Refuel'}
          </p>
          {valueMode && <p className="text-xs text-green-600 mt-2">{insights('departure')}</p>}
        </div>

        {/* Transit */}
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold">{journeyData.layover || 'Transit'} Transit</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Options curated for your stopover</p>
          {valueMode && <p className="text-xs text-green-600 mt-2">{insights('transit')}</p>}
        </div>

        {/* Arrival */}
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold">{journeyData.destination} Arrival</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Essential services + SIM & transport</p>
          {valueMode && <p className="text-xs text-green-600 mt-2">{insights('arrival')}</p>}
        </div>
      </div>

      <div className="flex justify-between gap-4">
        <Button variant="outline" onClick={onBack}>← Back</Button>
        <Button onClick={onConfirm}>Continue to Terminal Plans →</Button>
      </div>
    </div>
  );
};

export default StepReview; 