// Global boarding status indicator component
import React from 'react';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useBoardingContext } from '../hooks/useBoardingContext';

export const BoardingStatusBar: React.FC = () => {
  const { boardingStatus, timeUntilBoarding, flightInfo } = useBoardingContext();

  if (!flightInfo || !timeUntilBoarding) return null;

  const getStatusColor = () => {
    switch (boardingStatus) {
      case 'rush':
        return 'bg-red-500';
      case 'imminent':
        return 'bg-orange-500';
      case 'soon':
        return 'bg-yellow-500';
      case 'normal':
        return 'bg-blue-500';
      case 'extended':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (boardingStatus) {
      case 'rush':
        return <AlertTriangle className="w-4 h-4" />;
      case 'extended':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusMessage = () => {
    const hours = Math.floor(timeUntilBoarding / 60);
    const minutes = timeUntilBoarding % 60;
    
    let timeStr = '';
    if (hours > 0) {
      timeStr = `${hours}h ${minutes}m`;
    } else {
      timeStr = `${minutes} min`;
    }

    switch (boardingStatus) {
      case 'rush':
        return `⚡ Boarding in ${timeStr} - Hurry!`;
      case 'imminent':
        return `🍔 Boarding in ${timeStr} - Quick bite?`;
      case 'soon':
        return `😌 Boarding in ${timeStr} - Time to relax`;
      case 'normal':
        return `✈️ Boarding in ${timeStr}`;
      case 'extended':
        return `🔍 ${flightInfo.isDelayed ? 'Delayed' : 'Boarding'} in ${timeStr} - Explore!`;
      default:
        return `Boarding in ${timeStr}`;
    }
  };

  return (
    <div className={`${getStatusColor()} text-white px-4 py-2 flex items-center justify-between text-sm`}>
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className="font-medium">{getStatusMessage()}</span>
      </div>
      {flightInfo.gate && (
        <span className="text-xs opacity-90">Gate {flightInfo.gate}</span>
      )}
    </div>
  );
};

// Mini boarding status indicator for headers
export const BoardingStatusPill: React.FC = () => {
  const { boardingStatus, timeUntilBoarding } = useBoardingContext();

  if (!timeUntilBoarding) return null;

  const getStatusColor = () => {
    switch (boardingStatus) {
      case 'rush':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'imminent':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'soon':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'normal':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'extended':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const hours = Math.floor(timeUntilBoarding / 60);
  const minutes = timeUntilBoarding % 60;
  
  let timeStr = '';
  if (hours > 0) {
    timeStr = `${hours}h ${minutes}m`;
  } else {
    timeStr = `${minutes}m`;
  }

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}>
      <Clock className="w-3 h-3" />
      <span>{timeStr}</span>
    </div>
  );
};