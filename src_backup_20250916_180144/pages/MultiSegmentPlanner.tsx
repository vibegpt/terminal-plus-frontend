// pages/MultiSegmentPlanner.tsx - Complete journey planning for multi-segment flights
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  ArrowRight, 
  Clock, 
  MapPin, 
  Plane, 
  Settings,
  CheckCircle,
  Star
} from 'lucide-react';
import { useJourneyContext } from '@/hooks/useJourneyContext';

interface SegmentPlan {
  segmentId: number;
  context: 'departure' | 'transit' | 'arrival';
  selectedVibe?: string;
  savedAmenities: string[];
  timeAllocated: number; // minutes
  isComplete: boolean;
}

export default function MultiSegmentPlanner() {
  const navigate = useNavigate();
  const { state, actions } = useJourneyContext();
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [segmentPlans, setSegmentPlans] = useState<SegmentPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize segment plans from journey context
  useEffect(() => {
    if (!state.flightData || !state.journeyScope) {
      navigate('/smart-journey');
      return;
    }

    if (state.journeyScope.type !== 'full-journey') {
      navigate('/vibe-selection');
      return;
    }

    // Initialize segment plans - SIMPLIFIED APPROACH
    const plans: SegmentPlan[] = [];
    
    // For QF1: SYD→SIN→LHR, we want:
    // 1. SYD Departure
    // 2. SIN Transit  
    // 3. LHR Arrival
    
    state.flightData.segments.forEach((segment, index) => {
      // 1. Add departure for first segment
      if (index === 0) {
        plans.push({
          segmentId: index * 10 + 1, // e.g., 1 for first departure
          context: 'departure',
          savedAmenities: [],
          timeAllocated: Math.max(20, state.timeContext.timeUntilBoarding),
          isComplete: false
        });
      }
      
      // 2. Add transit for each segment that has a connection
      if (index < state.flightData!.segments.length - 1) {
        plans.push({
          segmentId: index * 10 + 5, // e.g., 5 for first transit
          context: 'transit',
          savedAmenities: [],
          timeAllocated: 180, // 3 hours default layover time
          isComplete: false
        });
      }
      
      // 3. Add arrival for last segment only
      if (index === state.flightData!.segments.length - 1) {
        plans.push({
          segmentId: index * 10 + 9, // e.g., 19 for last arrival
          context: 'arrival',
          savedAmenities: [],
          timeAllocated: 30,
          isComplete: false
        });
      }
    });

    setSegmentPlans(plans);

    // Check if returning from a completed segment
    const returnedFromSegment = sessionStorage.getItem('completedSegmentIndex');
    if (returnedFromSegment) {
      const segmentIndex = parseInt(returnedFromSegment);
      const returnedVibe = sessionStorage.getItem('selectedVibe');
      const returnedAmenities = sessionStorage.getItem('savedAmenities');
      
      console.log('🔍 Completing segment:', { segmentIndex, returnedVibe, plansLength: plans.length });
      
      if (segmentIndex >= 0 && segmentIndex < plans.length && plans[segmentIndex]) {
        const updatedPlans = [...plans];
        updatedPlans[segmentIndex] = {
          ...updatedPlans[segmentIndex],
          selectedVibe: returnedVibe || 'Mixed',
          savedAmenities: returnedAmenities ? JSON.parse(returnedAmenities) : [],
          isComplete: true
        };
        
        console.log('✅ Updated segment plans:', updatedPlans.map(p => ({ context: p.context, isComplete: p.isComplete })));
        setSegmentPlans(updatedPlans);
      }
      
      // Clean up
      sessionStorage.removeItem('completedSegmentIndex');
      sessionStorage.removeItem('selectedVibe');
      sessionStorage.removeItem('savedAmenities');
    }
  }, [state.flightData, state.journeyScope, navigate]);

  // Calculate time allocation for each segment
  const calculateTimeAllocation = (segment: any, index: number | string, allSegments: any[]): number => {
    const numIndex = typeof index === 'string' ? parseFloat(index) : index;
    
    if (numIndex === 0) {
      // Departure: based on time until boarding
      return Math.max(20, state.timeContext.timeUntilBoarding);
    } else if (numIndex % 1 !== 0) {
      // Transit (fractional index): based on layover duration
      const layoverIndex = Math.floor(numIndex) - 1;
      const layover = state.journeyScope?.layoverDetails?.[layoverIndex];
      return layover?.durationMinutes || 180; // Default 3 hours
    } else if (numIndex === allSegments.length - 1) {
      // Arrival: standard allocation
      return 30;
    }
    
    return 60; // Default fallback
  };

  // Handle segment completion
  const handleSegmentComplete = (segmentIndex: number, vibe: string, amenities: string[]) => {
    console.log('🔍 handleSegmentComplete called:', { segmentIndex, vibe, amenities });
    
    if (segmentIndex < 0 || segmentIndex >= segmentPlans.length) {
      console.error('❌ Invalid segment index:', segmentIndex, 'Plans length:', segmentPlans.length);
      return;
    }
    
    const updatedPlans = [...segmentPlans];
    updatedPlans[segmentIndex] = {
      ...updatedPlans[segmentIndex],
      selectedVibe: vibe,
      savedAmenities: amenities,
      isComplete: true
    };
    
    console.log('✅ Segment completed:', {
      segmentIndex,
      context: updatedPlans[segmentIndex].context,
      vibe,
      amenitiesCount: amenities.length
    });
    
    setSegmentPlans(updatedPlans);
  };

  // Navigate to segment planning  
  const handlePlanSegment = (planIndex: number) => {
    const plan = segmentPlans[planIndex];
    if (!plan) return;

    // Save current planning state
    sessionStorage.setItem('multiSegmentPlans', JSON.stringify(segmentPlans));
    sessionStorage.setItem('currentSegmentIndex', planIndex.toString());
    sessionStorage.setItem('multiSegmentReturn', 'true');

    // Determine airport and terminal based on context
    let airport, terminal;
    
    if (plan.context === 'departure') {
      const segment = state.flightData?.segments[0];
      airport = segment?.departure.airport;
      terminal = segment?.departure.terminal;
    } else if (plan.context === 'transit') {
      const segment = state.flightData?.segments[0]; // Transit at end of first segment
      airport = segment?.arrival.airport;
      terminal = segment?.arrival.terminal;
    } else {
      // arrival
      const segment = state.flightData?.segments[state.flightData.segments.length - 1];
      airport = segment?.arrival.airport;
      terminal = segment?.arrival.terminal;
    }

    if (!airport || !terminal) {
      console.error('Missing airport/terminal data for planning');
      return;
    }

    // Navigate to appropriate planning interface
    if (plan.context === 'departure') {
      navigate(`/vibe-selection?airport=${airport}&terminal=${terminal}&context=departure&segment=${planIndex}&returnTo=multi-segment`);
    } else if (plan.context === 'transit') {
      navigate(`/experience?airport=${airport}&terminal=${terminal}&context=transit&vibe=mixed&segment=${planIndex}&returnTo=multi-segment`);
    } else {
      navigate(`/experience?airport=${airport}&terminal=${terminal}&context=arrival&vibe=mixed&segment=${planIndex}&returnTo=multi-segment`);
    }
  };

  // Complete entire journey planning
  const handleCompleteJourney = () => {
    if (!allSegmentsComplete) return;

    setIsLoading(true);

    // Save complete journey plan
    const completeJourneyPlan = {
      flightData: state.flightData,
      segmentPlans,
      totalSavedAmenities: segmentPlans.reduce((total, plan) => total + plan.savedAmenities.length, 0),
      planningCompletedAt: new Date().toISOString()
    };

    // Update journey context with complete plan
    actions.updatePreferences({
      completeJourneyPlan,
      planningComplete: true
    });

    // Save to storage
    sessionStorage.setItem('completeJourneyPlan', JSON.stringify(completeJourneyPlan));
    
    setTimeout(() => {
      setIsLoading(false);
      navigate('/journey-summary');
    }, 1000);
  };

  // Check if all segments are complete
  const allSegmentsComplete = segmentPlans.every(plan => plan.isComplete);
  const completedCount = segmentPlans.filter(plan => plan.isComplete).length;

  // Handle back navigation
  const handleBack = () => {
    navigate('/smart-journey');
  };

  if (!state.flightData || !state.journeyScope) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            No journey data found
          </p>
          <Button onClick={() => navigate('/smart-journey')}>
            Start New Journey
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Complete Journey Planner
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {state.flightData.flightNumber}: {state.flightData.segments.map(s => s.route).join(' → ')}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Progress
            </div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white">
              {completedCount}/{segmentPlans.length}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              Journey Planning Progress
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {Math.round((completedCount / segmentPlans.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / segmentPlans.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Segment Planning Cards */}
        <div className="space-y-4">
          {segmentPlans.map((plan, planIndex) => {
            // Determine which flight segment this plan refers to
            let segment, contextConfig;
            
            if (plan.context === 'departure') {
              segment = state.flightData?.segments[0]; // First segment
              contextConfig = {
                icon: <Plane className="h-5 w-5 text-blue-600" />,
                color: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
                title: `${segment?.departure.airport} Departure`,
                buttonText: 'Plan Departure',
                route: segment?.route || '',
                time: segment?.departure.time || '',
                terminal: segment?.departure.terminal || ''
              };
            } else if (plan.context === 'transit') {
              segment = state.flightData?.segments[0]; // Transit happens at end of first segment
              const transitAirport = segment?.arrival.airport;
              contextConfig = {
                icon: <MapPin className="h-5 w-5 text-orange-600" />,
                color: 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800',
                title: `${transitAirport} Transit`,
                buttonText: 'Plan Transit',
                route: `Layover at ${transitAirport}`,
                time: segment?.arrival.time || '',
                terminal: segment?.arrival.terminal || ''
              };
            } else {
              // arrival - use last segment
              segment = state.flightData?.segments[state.flightData.segments.length - 1];
              contextConfig = {
                icon: <CheckCircle className="h-5 w-5 text-green-600" />,
                color: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
                title: `${segment?.arrival.airport} Arrival`,
                buttonText: 'Plan Arrival',
                route: segment?.route || '',
                time: segment?.arrival.time || '',
                terminal: segment?.arrival.terminal || ''
              };
            }

            if (!segment) return null;

            const isCurrentSegment = planIndex === currentSegmentIndex;

            return (
              <div
                key={`${plan.segmentId}-${plan.context}`}
                className={`border-2 rounded-xl p-6 transition-all duration-200 ${
                  plan.isComplete 
                    ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' 
                    : contextConfig.color
                } ${isCurrentSegment ? 'ring-2 ring-purple-500 ring-opacity-50' : ''}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {contextConfig.icon}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {contextConfig.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {contextConfig.route} • {segment.duration}
                      </p>
                    </div>
                  </div>
                  
                  {plan.isComplete ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-300">
                        Complete
                      </span>
                    </div>
                  ) : (
                    <Badge variant="outline">
                      {plan.timeAllocated}min available
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {contextConfig.time}
                    </div>
                    <div>
                      Terminal: {contextConfig.terminal}
                    </div>
                    {plan.savedAmenities.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        {plan.savedAmenities.length} saved
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {plan.isComplete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePlanSegment(planIndex)}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => handlePlanSegment(planIndex)}
                      disabled={isLoading}
                      className={plan.isComplete ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      {plan.isComplete ? 'Review' : contextConfig.buttonText}
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Complete Journey Button */}
        <div className="sticky bottom-6">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Ready to finalize your journey?
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {completedCount}/{segmentPlans.length} segments planned • {segmentPlans.reduce((total, plan) => total + plan.savedAmenities.length, 0)} total amenities saved
                </p>
              </div>
              
              <Button
                onClick={handleCompleteJourney}
                disabled={!allSegmentsComplete || isLoading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    Finalizing...
                  </>
                ) : (
                  <>
                    Complete Journey
                    <CheckCircle className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        {import.meta.env.DEV && (
          <details className="mt-6">
            <summary className="cursor-pointer text-xs text-slate-500">
              Debug Info (dev only)
            </summary>
            <pre className="mt-2 text-xs bg-slate-100 dark:bg-slate-900 p-2 rounded overflow-auto">
              {JSON.stringify({ 
                segmentPlansCount: segmentPlans.length,
                segmentPlans: segmentPlans.map(p => ({ context: p.context, segmentId: p.segmentId })),
                flightSegments: state.flightData?.segments.length,
                flightSegmentsRoutes: state.flightData?.segments.map(s => s.route),
                currentSegmentIndex,
                allSegmentsComplete,
                flightData: state.flightData?.flightNumber
              }, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
