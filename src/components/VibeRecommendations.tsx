import React from 'react';
import { useRecommendations } from '../hooks/useRecommendations';
import { TerminalAmenity } from '../types/amenity';

/**
 * VibeRecommendations displays recommendations based on the current vibe.
 * Always pass initialVibe from journey/session data for correct vibe propagation.
 */
interface VibeRecommendationsProps {
  amenities: TerminalAmenity[];
  currentTerminal: string;
  currentGate: string;
  timeAvailableMinutes: number;
  /**
   * The initial vibe to use for recommendations. Should come from journey/session data.
   */
  initialVibe?: string;
}

const VIBE_OPTIONS = [
  { id: 'Relax', label: 'Relax', icon: '🧘' },
  { id: 'Explore', label: 'Explore', icon: '🔍' },
  { id: 'Quick', label: 'Quick', icon: '⚡' },
  { id: 'Comfort', label: 'Comfort', icon: '🛋️' },
  { id: 'Work', label: 'Work', icon: '💼' },
  { id: 'Social', label: 'Social', icon: '👥' }
];

export const VibeRecommendations: React.FC<VibeRecommendationsProps> = ({
  amenities,
  currentTerminal,
  currentGate,
  timeAvailableMinutes,
  initialVibe
}) => {
  const {
    recommendations,
    loading,
    error,
    activeVibe,
    changeVibe
  } = useRecommendations({
    amenities,
    currentTerminal,
    currentGate,
    timeAvailableMinutes,
    initialVibe
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        <p>Error loading recommendations: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Vibe Selector */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {VIBE_OPTIONS.map((vibe) => (
          <button
            key={vibe.id}
            onClick={() => changeVibe(vibe.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all
              ${activeVibe === vibe.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
          >
            <span>{vibe.icon}</span>
            <span>{vibe.label}</span>
          </button>
        ))}
      </div>

      {/* Recommendations */}
      {recommendations?.suggested_actions && (
        <div className="space-y-4">
          {recommendations.suggested_actions.map((action: any) => (
            <div
              key={action.slug}
              className="bg-slate-100 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {action.estimated_time_minutes} min
                  </span>
                </div>
                
                <div className="mt-3 flex flex-wrap gap-2">
                  {action.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium
                      ${action.urgency === 'high' ? 'bg-red-100 text-red-700' :
                        action.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'}`}
                    >
                      {action.urgency} priority
                    </span>
                    <span className="text-sm text-gray-500">
                      {action.distance_meters}m away
                    </span>
                  </div>
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    onClick={() => {/* Handle action click */}}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 