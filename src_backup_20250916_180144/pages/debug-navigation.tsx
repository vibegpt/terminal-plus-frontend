import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useJourneyContext } from '@/context/JourneyContext';
import { debugJourneyData, migrateJourneyData, clearAllJourneyData } from '@/utils';

export default function DebugNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, actions } = useJourneyContext();

  const testNavigation = (slug: string) => {
    console.log(`Testing navigation to: /amenity/${slug}`);
    console.log(`Current location: ${location.pathname}`);
    console.log(`Navigate function:`, navigate);
    
    try {
      navigate(`/amenity/${slug}`);
      console.log(`Navigation attempted successfully`);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            🐛 Debug Navigation
          </h1>
          <p className="text-slate-600 mb-6">
            Testing navigation functionality
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate('/')}>
              🏠 Back to Home
            </Button>
            <Button onClick={() => navigate('/test-amenity-flow')} variant="outline">
              🧪 Test Page
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Direct Navigation Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={() => testNavigation('coffee-breakfast')}>
                  Coffee & Breakfast
                </Button>
                <Button onClick={() => testNavigation('duty-free-shopping')}>
                  Duty Free Shopping
                </Button>
                <Button onClick={() => testNavigation('airline-lounge')}>
                  Airline Lounge
                </Button>
              </div>
              <div className="text-sm text-slate-600">
                Check the browser console for navigation logs
              </div>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader>
              <CardTitle>Current Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-mono bg-slate-100 p-2 rounded">
                {location.pathname}
              </div>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader>
              <CardTitle>Test Clickable Card</CardTitle>
            </CardHeader>
            <CardContent>
              <Card 
                className="hover:shadow-md transition-shadow cursor-pointer group p-4 border"
                onClick={() => {
                  console.log('Test card clicked!');
                  testNavigation('coffee-breakfast');
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Test Amenity Card</h3>
                    <p className="text-sm text-slate-600">Click this card to test navigation</p>
                  </div>
                  <div className="text-slate-400 group-hover:text-slate-600">
                    →
                  </div>
                </div>
              </Card>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader>
              <CardTitle>Journey Context Testing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={() => debugJourneyData()}>
                  Debug Journey Data
                </Button>
                <Button onClick={() => migrateJourneyData()}>
                  Migrate Data
                </Button>
                <Button onClick={() => clearAllJourneyData()}>
                  Clear All Data
                </Button>
              </div>
              <div className="text-sm text-slate-600">
                Current Journey Data: {journeyData ? JSON.stringify(journeyData, null, 2) : 'null'}
              </div>
              <div className="flex gap-4">
                <Button 
                  size="sm" 
                  onClick={() => updateJourneyData({ selected_vibe: 'refuel', from: 'SYD', to: 'LHR' })}
                >
                  Set Test Data
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => clearJourneyData()}
                >
                  Clear Context
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 