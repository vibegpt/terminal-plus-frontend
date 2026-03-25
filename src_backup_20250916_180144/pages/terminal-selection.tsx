import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Plane, Clock, ChevronRight, Globe, Coffee, ShoppingBag, ChevronLeft } from 'lucide-react';

interface Terminal {
  code: string;
  airport: string;
  type: 'departure' | 'transit' | 'arrival';
  time: string;
  date: string;
  duration: string | null;
}

const TerminalSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedTerminal, setSelectedTerminal] = useState<Terminal | null>(null);
  
  // Get journey data from navigation state
  const { flightNumber, route } = location.state || {
    flightNumber: 'QF1',
    route: ['SYD', 'SIN', 'LHR']
  };

  const terminals: Terminal[] = [
    { 
      code: 'SYD-T1', 
      airport: 'Sydney', 
      type: 'departure',
      time: '10:30 AM',
      date: 'Today',
      duration: null
    },
    { 
      code: 'SIN-T3', 
      airport: 'Singapore', 
      type: 'transit',
      time: '8:45 PM',
      date: 'Today',
      duration: '3h 15m layover'
    },
    { 
      code: 'LHR-T5', 
      airport: 'London Heathrow', 
      type: 'arrival',
      time: '6:30 AM',
      date: 'Tomorrow',
      duration: null
    }
  ];

  const getIcon = (type: string) => {
    switch(type) {
      case 'departure': return '🛫';
      case 'transit': return '🔄';
      case 'arrival': return '🛬';
      default: return '✈️';
    }
  };

  const getGradient = (type: string) => {
    switch(type) {
      case 'departure': return 'from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30';
      case 'transit': return 'from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30';
      case 'arrival': return 'from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30';
      default: return 'from-gray-500/20 to-gray-500/20';
    }
  };

  const getBorderColor = (type: string) => {
    switch(type) {
      case 'departure': return 'border-blue-500/30';
      case 'transit': return 'border-purple-500/30';
      case 'arrival': return 'border-green-500/30';
      default: return 'border-gray-500/30';
    }
  };

  const handleTerminalSelect = (terminal: Terminal) => {
    setSelectedTerminal(terminal);
    // Navigate to Best Of collection for selected terminal
    navigate(`/best-of/${terminal.code}`, {
      state: { 
        context: terminal.type,
        flightNumber,
        route,
        fromTerminalSelection: true,
        journeyType: 'complete-journey'
      }
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <button 
          onClick={handleBack}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
        
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Plane className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Select Terminal</h1>
            <p className="text-white/60 text-sm">Flight {flightNumber}: {route.join(' → ')}</p>
          </div>
        </div>
      </div>

      {/* Journey Progress Indicator */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-0.5 bg-white/20"></div>
          </div>
          {route.map((airport: string, index: number) => (
            <div key={airport} className="relative flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full border-2 border-white ${
                index === 0 ? 'bg-blue-500' : 
                index === route.length - 1 ? 'bg-green-500' : 
                'bg-purple-500'
              }`}></div>
              <span className="text-xs mt-1 text-white/60">{airport}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Terminal Cards */}
      <div className="p-6 space-y-4">
        <p className="text-white/70 text-sm mb-6">
          Choose which part of your journey you'd like to explore
        </p>

        {terminals.map((terminal, index) => (
          <button
            key={terminal.code}
            onClick={() => handleTerminalSelect(terminal)}
            className={`w-full p-6 bg-gradient-to-r ${getGradient(terminal.type)} border ${getBorderColor(terminal.type)} rounded-2xl transition-all transform hover:scale-[1.02] text-left group`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Terminal Header */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{getIcon(terminal.type)}</span>
                  <div>
                    <h3 className="font-bold text-lg capitalize">{terminal.type}</h3>
                    <p className="text-white/70 text-sm">{terminal.airport}</p>
                  </div>
                </div>

                {/* Terminal Details */}
                <div className="space-y-2 ml-12">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <MapPin className="w-4 h-4" />
                    <span>Terminal {terminal.code.split('-')[1]}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Clock className="w-4 h-4" />
                    <span>{terminal.time} • {terminal.date}</span>
                  </div>

                  {terminal.duration && (
                    <div className="flex items-center gap-2 text-sm text-yellow-400/80">
                      <Coffee className="w-4 h-4" />
                      <span>{terminal.duration}</span>
                    </div>
                  )}
                </div>

                {/* Preview of what's available */}
                <div className="mt-4 ml-12">
                  <p className="text-xs text-white/50 mb-2">Explore:</p>
                  <div className="flex gap-2">
                    {terminal.type === 'departure' && (
                      <>
                        <span className="px-2 py-1 bg-white/10 rounded-full text-xs">Lounges</span>
                        <span className="px-2 py-1 bg-white/10 rounded-full text-xs">Shopping</span>
                        <span className="px-2 py-1 bg-white/10 rounded-full text-xs">Dining</span>
                      </>
                    )}
                    {terminal.type === 'transit' && (
                      <>
                        <span className="px-2 py-1 bg-white/10 rounded-full text-xs">Rest Areas</span>
                        <span className="px-2 py-1 bg-white/10 rounded-full text-xs">Quick Bites</span>
                        <span className="px-2 py-1 bg-white/10 rounded-full text-xs">Showers</span>
                      </>
                    )}
                    {terminal.type === 'arrival' && (
                      <>
                        <span className="px-2 py-1 bg-white/10 rounded-full text-xs">Transport</span>
                        <span className="px-2 py-1 bg-white/10 rounded-full text-xs">Currency</span>
                        <span className="px-2 py-1 bg-white/10 rounded-full text-xs">Baggage</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight className="w-6 h-6 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all mt-8" />
            </div>
          </button>
        ))}

        {/* Smart Tip */}
        <div className="mt-8 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-400 mb-1">Pro Tip</p>
              <p className="text-xs text-white/70">
                Start with your departure terminal to get personalized recommendations based on your mood, 
                then explore transit and arrival terminals to plan ahead.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Footer */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-3 gap-4 p-4 bg-white/5 rounded-xl">
          <div className="text-center">
            <p className="text-2xl font-bold">23h 50m</p>
            <p className="text-xs text-white/50">Total journey</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">2</p>
            <p className="text-xs text-white/50">Stops</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">15,342km</p>
            <p className="text-xs text-white/50">Distance</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalSelectionPage;
