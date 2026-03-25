import React from 'react';
import { Home, Search, Heart, User, MapPin } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

interface MobileNavigationProps {
  className?: string;
}

const navigationItems = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    path: '/',
    color: 'text-blue-600'
  },
  {
    id: 'search',
    label: 'Search',
    icon: Search,
    path: '/search',
    color: 'text-green-600'
  },
  {
    id: 'favorites',
    label: 'Favorites',
    icon: Heart,
    path: '/favorites',
    color: 'text-red-600'
  },
  {
    id: 'map',
    label: 'Map',
    icon: MapPin,
    path: '/map',
    color: 'text-purple-600'
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    path: '/profile',
    color: 'text-gray-600'
  }
];

export function MobileNavigation({ className }: MobileNavigationProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <nav className={cn("mobile-nav", className)}>
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={cn(
                "mobile-nav-item",
                isActive && "active",
                isActive && item.color
              )}
              aria-label={item.label}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium mt-1">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// Alternative compact navigation for smaller screens
export function CompactMobileNavigation({ className }: MobileNavigationProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <nav className={cn("mobile-nav py-2", className)}>
      <div className="flex justify-around items-center max-w-sm mx-auto">
        {navigationItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={cn(
                "mobile-nav-item px-2",
                isActive && "active",
                isActive && item.color
              )}
              aria-label={item.label}
            >
              <Icon className="w-6 h-6" />
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// Floating action button for primary actions
interface FloatingActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label?: string;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  className?: string;
}

export function FloatingActionButton({ 
  onClick, 
  icon, 
  label,
  position = 'bottom-right',
  className 
}: FloatingActionButtonProps) {
  const positionClasses = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-left': 'bottom-20 left-4',
    'bottom-center': 'bottom-20 left-1/2 transform -translate-x-1/2'
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed z-50 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 active:scale-95 transition-all duration-200 flex items-center justify-center",
        positionClasses[position],
        className
      )}
      aria-label={label}
    >
      {icon}
    </button>
  );
}

export default MobileNavigation;
