// src/components/shared/ViewToggle.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layers, Music, Film } from 'lucide-react';
import analytics from '../../lib/analytics';

export const ViewToggle: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const views = [
    { path: '/', icon: Layers, label: 'Hybrid', color: 'from-purple-500 to-pink-500' },
    { path: '/spotify', icon: Music, label: 'Spotify', color: 'from-green-500 to-green-600' },
    { path: '/netflix', icon: Film, label: 'Netflix', color: 'from-red-500 to-red-600' },
  ];
  
  const handleViewSwitch = (view: typeof views[0]) => {
    analytics.trackEvent('main_view_switched', {
      from: location.pathname,
      to: view.path,
      viewType: view.label.toLowerCase() as any
    });
    navigate(view.path);
  };
  
  return (
    <div className="fixed bottom-20 right-4 z-50">
      <div className="bg-white/95 backdrop-blur-lg rounded-full shadow-xl p-1 flex flex-col gap-1">
        {views.map((view) => {
          const isActive = location.pathname === view.path;
          return (
            <button
              key={view.path}
              onClick={() => handleViewSwitch(view)}
              className={`relative p-3 rounded-full transition-all duration-300 ${
                isActive 
                  ? 'bg-gradient-to-r text-white shadow-lg transform scale-110' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={isActive ? {
                backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`,
                '--tw-gradient-from': view.color.split(' ')[1],
                '--tw-gradient-to': view.color.split(' ')[3]
              } as any : {}}
              aria-label={view.label}
            >
              <view.icon className="w-5 h-5" />
              {isActive && (
                <span className="absolute -left-12 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded shadow-sm">
                  {view.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
