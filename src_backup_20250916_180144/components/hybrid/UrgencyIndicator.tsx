// src/components/hybrid/UrgencyIndicator.tsx
import React from 'react';
import { AlertTriangle, ArrowRight, Zap, Navigation, Coffee, Wifi } from 'lucide-react';
import { motion } from 'framer-motion';

interface UrgencyIndicatorProps {
  timeToBoarding: number;
  gate: string;
  onQuickAction: () => void;
}

export const UrgencyIndicator: React.FC<UrgencyIndicatorProps> = ({
  timeToBoarding,
  gate,
  onQuickAction
}) => {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="bg-gradient-to-r from-red-500 to-orange-500 text-white"
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <AlertTriangle className="w-5 h-5" />
            </motion.div>
            <div>
              <p className="font-semibold">Boarding soon!</p>
              <p className="text-sm opacity-90">
                {timeToBoarding} minutes to Gate {gate}
              </p>
            </div>
          </div>
          
          <button
            onClick={onQuickAction}
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
          >
            <Zap className="w-4 h-4" />
            Quick Options
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        
        {/* Quick Actions Bar */}
        <div className="flex gap-2 mt-3">
          <QuickAction icon={Navigation} label="Navigate" time="3 min" />
          <QuickAction icon={Coffee} label="Grab Coffee" time="5 min" />
          <QuickAction icon={Wifi} label="Quick WiFi" time="2 min" />
        </div>
      </div>
    </motion.div>
  );
};

const QuickAction: React.FC<{
  icon: any;
  label: string;
  time: string;
}> = ({ icon: Icon, label, time }) => {
  return (
    <button className="flex-1 bg-white/10 hover:bg-white/20 rounded-lg p-2 transition-colors">
      <Icon className="w-4 h-4 mx-auto mb-1" />
      <p className="text-xs font-medium">{label}</p>
      <p className="text-xs opacity-75">{time}</p>
    </button>
  );
};
