import React, { useEffect, useState } from 'react';
import { generateTransitPlan, getBodyClockVibes } from '@/utils/generateTransitPlan_withAmenities_T1';

type Props = {
  layoverMinutes: number;
  departureTimeUTC?: number; // optional for body clock logic
  flightDurationMins?: number;
  energyLevel?: 'low' | 'default' | 'high';
};

export type TimelineBlock = {
  start: number;
  end: number;
  vibe: string;
  suggestion: string;
};

const TransitTimeline: React.FC<Props> = ({
  layoverMinutes,
  departureTimeUTC,
  flightDurationMins,
  energyLevel = 'default'
}) => {
  const [timeline, setTimeline] = useState<TimelineBlock[]>([]);
  const [bodyClockHour, setBodyClockHour] = useState<number | null>(null);
  const [arrivalHour, setArrivalHour] = useState<number | null>(null);

  useEffect(() => {
    // Optionally use body clock logic
    if (departureTimeUTC && flightDurationMins) {
      const vibeContext = getBodyClockVibes({
        departureTimeUTC,
        flightDurationMins,
        departureTimeZoneOffset: 11, // SYD
        arrivalTimeZoneOffset: 8, // SIN
        energyLevel
      });
      setBodyClockHour(vibeContext.bodyHour);
      setArrivalHour(vibeContext.localArrivalHour);
    }

    const plan = generateTransitPlan('SIN', layoverMinutes);
    setTimeline(plan);
  }, [layoverMinutes, departureTimeUTC, flightDurationMins, energyLevel]);

  return (
    <div className="w-full max-w-xl mx-auto mt-6">
      <h2 className="text-xl font-bold mb-4">Your SIN Transit Plan</h2>

      {bodyClockHour !== null && (
        <div className="text-sm text-gray-600 mb-4">
          You're landing at <strong>{arrivalHour}:00 SIN time</strong> but your body clock thinks it’s <strong>{bodyClockHour}:00</strong>.
          We've adjusted the vibe sequence accordingly.
        </div>
      )}

      <div className="space-y-4">
        {timeline.map((block, idx) => (
          <div key={idx} className="border rounded-xl shadow p-4 bg-white">
            <div className="text-sm text-gray-400">
              {block.start}–{block.end} min
            </div>
            <h3 className="text-lg font-semibold text-indigo-700 mb-1">{block.vibe}</h3>
            <p className="text-gray-800">{block.suggestion}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransitTimeline; 