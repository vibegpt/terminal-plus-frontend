// src/components/NavigationBreadcrumb.tsx - Navigation breadcrumb component
import React from 'react';
import { ChevronRight, Home, MapPin, Building2, Sparkles } from 'lucide-react';
import { useNavigation } from '../hooks/useNavigation';

interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: React.ComponentType<{ className?: string }>;
  isCurrent?: boolean;
}

const NavigationBreadcrumb: React.FC = () => {
  const { navigateHome, currentPath } = useNavigation();
  
  // Build breadcrumb trail
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const parts = currentPath.split('/').filter(Boolean);
    const crumbs: BreadcrumbItem[] = [{ 
      label: 'Home', 
      path: '/', 
      icon: Home 
    }];
    
    if (parts[0] === 'collections') {
      crumbs.push({ 
        label: 'Collections', 
        path: '/collections',
        icon: Sparkles
      });
      
      if (parts[1]) {
        const collection = JSON.parse(
          sessionStorage.getItem('selectedCollection') || '{}'
        );
        crumbs.push({ 
          label: collection.name || parts[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
          path: currentPath,
          isCurrent: true
        });
      }
    } else if (parts[0] === 'amenity') {
      const amenityContext = JSON.parse(
        sessionStorage.getItem('amenityContext') || '{}'
      );
      
      if (amenityContext.fromCollection) {
        crumbs.push({ 
          label: 'Collections', 
          path: '/collections',
          icon: Sparkles
        });
        crumbs.push({ 
          label: amenityContext.fromCollection.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
          path: `/collections/${amenityContext.fromCollection}` 
        });
      }
      
      crumbs.push({ 
        label: amenityContext.name || 'Amenity', 
        path: currentPath,
        isCurrent: true
      });
    } else if (parts[0] === 'terminal') {
      crumbs.push({ 
        label: 'Terminals', 
        path: '/terminals',
        icon: Building2
      });
      
      if (parts[1]) {
        const terminalContext = JSON.parse(
          sessionStorage.getItem('terminalContext') || '{}'
        );
        const terminalName = terminalContext.terminalCode || parts[1];
        crumbs.push({ 
          label: terminalName, 
          path: currentPath,
          isCurrent: true
        });
      }
    } else if (parts[0] === 'vibe') {
      crumbs.push({ 
        label: 'Vibes', 
        path: '/vibes',
        icon: Sparkles
      });
      
      if (parts[1]) {
        const vibeContext = JSON.parse(
          sessionStorage.getItem('vibeContext') || '{}'
        );
        const vibeName = vibeContext.vibeSlug || parts[1];
        crumbs.push({ 
          label: vibeName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
          path: currentPath,
          isCurrent: true
        });
      }
    } else if (parts[0] === 'plan-journey') {
      crumbs.push({ 
        label: 'Plan Journey', 
        path: currentPath,
        icon: MapPin,
        isCurrent: true
      });
    }
    
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  // Don't show breadcrumbs on home page
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center gap-2 px-4 py-3 text-sm bg-white/5 backdrop-blur-sm border-b border-white/10">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.path} className="flex items-center gap-2">
          {index > 0 && (
            <ChevronRight className="h-3 w-3 text-white/40 flex-shrink-0" />
          )}
          
          {crumb.isCurrent ? (
            // Current page - not clickable
            <span className={`
              flex items-center gap-1 text-white font-medium
            `}>
              {crumb.icon && <crumb.icon className="h-3 w-3" />}
              {crumb.label}
            </span>
          ) : (
            // Clickable breadcrumb
            <button
              onClick={() => {
                if (crumb.path === '/') {
                  navigateHome();
                } else {
                  window.location.href = crumb.path;
                }
              }}
              className="flex items-center gap-1 text-white/60 hover:text-white transition-colors hover:bg-white/10 px-2 py-1 rounded"
            >
              {crumb.icon && <crumb.icon className="h-3 w-3" />}
              {crumb.label}
            </button>
          )}
        </div>
      ))}
    </nav>
  );
};

export default NavigationBreadcrumb;
