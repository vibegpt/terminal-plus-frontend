// pages/JourneySummaryPage.tsx - Final journey summary and launch
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Star, 
  MapPin, 
  Clock,
  ArrowRight 
} from 'lucide-react';

export default function JourneySummaryPage() {
  const navigate = useNavigate();

  // Get complete journey plan from storage
  const completeJourneyPlan = React.useMemo(() => {
    try {
      const stored = sessionStorage.getItem('completeJourneyPlan');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  const handleStartJourney = () => {
    // Navigate to the main experience with complete journey context
    navigate('/experience?mode=journey&context=departure');
  };

  const handleEditPlan = () => {
    navigate('/multi-segment-planner');
  };

  if (!completeJourneyPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            No journey plan found
          </p>
          <Button onClick={() => navigate('/smart-journey')}>
            Start New Journey
          </Button>
        </div>
      </div>
    );
  }

  const { flightData, segmentPlans, totalSavedAmenities } = completeJourneyPlan;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-green-950 dark:via-slate-900 dark:to-blue-950">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            🎉 Journey Plan Complete!
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Your personalized {flightData.flightNumber} experience is ready
          </p>
        </div>

        {/* Journey Overview */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Journey Overview
          </h2>
          
          <div className="space-y-4">
            {/* Flight Route */}
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <MapPin className="h-5 w-5" />
              <span className="text-lg">
                {flightData.segments.map((s: any) => s.route).join(' → ')}
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {segmentPlans.length}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Segments Planned
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {totalSavedAmenities}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Amenities Saved
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {flightData.totalJourneyTime}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Total Journey
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Segment Summary */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Your Planned Experience
          </h3>
          
          {segmentPlans.map((plan: any, index: number) => {
            const contextConfig = {
              departure: { icon: '🛫', color: 'bg-blue-50 dark:bg-blue-950' },
              transit: { icon: '✈️', color: 'bg-orange-50 dark:bg-orange-950' },
              arrival: { icon: '🛬', color: 'bg-green-50 dark:bg-green-950' }
            };
            
            const config = contextConfig[plan.context as keyof typeof contextConfig];
            
            return (
              <div
                key={plan.segmentId}
                className={`${config.color} p-4 rounded-lg border`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{config.icon}</span>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white capitalize">
                        {plan.context}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {plan.selectedVibe && `${plan.selectedVibe} vibe • `}
                        {plan.savedAmenities.length} amenities saved
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-slate-600 dark:text-slate-400">
                    <Clock className="h-4 w-4 inline mr-1" />
                    {plan.timeAllocated}min
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-6">
          <Button
            onClick={handleStartJourney}
            className="w-full py-6 text-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            🚀 Start Your Journey Experience
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleEditPlan}
              className="flex-1"
            >
              Edit Plan
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/smart-journey')}
              className="flex-1"
            >
              New Journey
            </Button>
          </div>
        </div>

        {/* Success Message */}
        <div className="bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 p-4 rounded-lg text-center">
          <p className="text-green-800 dark:text-green-300 font-medium">
            ✨ Your personalized terminal experience is ready to guide you through every step of your journey!
          </p>
        </div>
      </div>
    </div>
  );
}
