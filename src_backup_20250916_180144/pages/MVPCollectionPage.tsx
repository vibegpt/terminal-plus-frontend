// MVPCollectionPage.tsx
// Complete collection page implementation with Supabase integration for Singapore terminals

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  SupabaseMVPService, 
  useSupabaseAmenities,
  MVP_CONFIG,
  SupabaseAmenity 
} from '../utils/supabaseMVPIntegration';
import { useTerminalContext } from '../contexts/TerminalContextManager';
import { VibePatternVerifier } from '../utils/vibePatternVerifier';

// Initialize Supabase (replace with your credentials)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

interface AmenityCardProps {
  amenity: SupabaseAmenity;
  terminal: string;
}

const AmenityCard: React.FC<AmenityCardProps> = ({ amenity, terminal }) => {
  const getPriceDisplay = (level: string) => {
    return level || '$';
  };

  const getStatusBadge = () => {
    if (amenity.available_in_tr) {
      return <span className="badge badge-transit">Transit Area</span>;
    }
    if (amenity.booking_required) {
      return <span className="badge badge-booking">Booking Required</span>;
    }
    return null;
  };

  return (
    <div className="amenity-card">
      <div className="amenity-header">
        {amenity.logo_url && (
          <img 
            src={amenity.logo_url} 
            alt={amenity.name}
            className="amenity-logo"
          />
        )}
        <div className="amenity-info">
          <h3>{amenity.name}</h3>
          <p className="amenity-terminal">{MVP_CONFIG.TERMINAL_NAMES[terminal as keyof typeof MVP_CONFIG.TERMINAL_NAMES]}</p>
        </div>
        <div className="amenity-price">{getPriceDisplay(amenity.price_level)}</div>
      </div>
      
      <p className="amenity-description">{amenity.description}</p>
      
      <div className="amenity-footer">
        <span className="opening-hours">📍 {amenity.opening_hours || 'Hours vary'}</span>
        {getStatusBadge()}
      </div>

      {amenity.website_url && (
        <a 
          href={amenity.website_url}
          target="_blank"
          rel="noopener noreferrer"
          className="amenity-link"
        >
          Visit Website →
        </a>
      )}
    </div>
  );
};

interface TerminalSelectorProps {
  currentTerminal: string | null;
  onTerminalChange: (terminal: string) => void;
}

const TerminalSelector: React.FC<TerminalSelectorProps> = ({ 
  currentTerminal, 
  onTerminalChange 
}) => {
  return (
    <div className="terminal-selector">
      <label>Terminal:</label>
      <div className="terminal-buttons">
        {MVP_CONFIG.TERMINALS.map(terminal => (
          <button
            key={terminal}
            className={`terminal-btn ${currentTerminal === terminal ? 'active' : ''}`}
            onClick={() => onTerminalChange(terminal)}
          >
            {MVP_CONFIG.TERMINAL_NAMES[terminal as keyof typeof MVP_CONFIG.TERMINAL_NAMES]}
          </button>
        ))}
      </div>
    </div>
  );
};

// Main Collection Page Component
export const MVPCollectionPage: React.FC = () => {
  const { vibe, collectionSlug } = useParams<{ vibe: string; collectionSlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Terminal context
  const { 
    currentTerminal, 
    setTerminal, 
    autoDetected,
    isDetecting 
  } = useTerminalContext();

  // Get terminal from URL or context
  const urlTerminal = searchParams.get('terminal');
  const activeTerminal = urlTerminal || currentTerminal || MVP_CONFIG.DEFAULT_TERMINAL;

  // Supabase data fetching
  const {
    amenities,
    loading,
    error,
    refresh,
    lastFetched
  } = useSupabaseAmenities(SUPABASE_URL, SUPABASE_ANON_KEY, {
    terminal: activeTerminal,
    vibe,
    collection: collectionSlug,
    autoRefresh: true,
    refreshInterval: 60000 // Refresh every minute
  });

  // Stats and analytics
  const [stats, setStats] = useState<any>(null);
  const supabaseService = new SupabaseMVPService(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Validate URL pattern on mount
  useEffect(() => {
    const currentPath = `/collection/${vibe}/${collectionSlug}${window.location.search}`;
    const validation = VibePatternVerifier.validateUrl(currentPath);
    
    if (!validation.valid) {
      console.error('Invalid URL pattern:', validation.errors);
      navigate('/'); // Redirect to home on invalid pattern
    }
  }, [vibe, collectionSlug, navigate]);

  // Sync terminal with URL
  useEffect(() => {
    if (urlTerminal && urlTerminal !== currentTerminal) {
      setTerminal(urlTerminal);
    } else if (!urlTerminal && currentTerminal) {
      // Add terminal to URL if we have one in context
      searchParams.set('terminal', currentTerminal);
      setSearchParams(searchParams, { replace: true });
    }
  }, [urlTerminal, currentTerminal, setTerminal, searchParams, setSearchParams]);

  // Fetch terminal stats
  useEffect(() => {
    const fetchStats = async () => {
      const terminalStats = await supabaseService.getTerminalStats(activeTerminal);
      setStats(terminalStats);
    };
    fetchStats();
  }, [activeTerminal]);

  // Handle terminal change
  const handleTerminalChange = (terminal: string) => {
    setTerminal(terminal);
    searchParams.set('terminal', terminal);
    setSearchParams(searchParams);
  };

  // Get collection name from slug
  const getCollectionName = () => {
    const names: Record<string, string> = {
      // Discover Vibe
      'jewel-discovery': 'Jewel Discovery',
      'hidden-gems': 'Hidden Gems',
      'garden-paradise': 'Garden Paradise',
      'entertainment-hub': 'Entertainment Hub',
      'jewel-experience': 'Jewel Experience',
      
      // Quick Vibe
      'grab-and-go': 'Grab & Go',
      'quick-bites': 'Quick Bites',
      
      // Work Vibe
      'productivity-spaces': 'Productivity Spaces',
      'meeting-rooms': 'Meeting Rooms',
      
      // Shop Vibe
      'retail-therapy': 'Retail Therapy',
      'duty-free-finds': 'Duty-Free Finds',
      'singapore-shopping-trail': 'Singapore Shopping Trail',
      'support-local-champions': 'Support Local Champions',
      'artisan-craft-masters': 'Artisan Craft Masters',
      
      // Refuel Vibe
      'morning-essentials': 'Morning Essentials',
      'energy-boost': 'Energy Boost',
      'hawker-heaven': 'Hawker Heaven',
      
      // Chill Vibe
      'lounge-life': 'Lounge Life',
      'quiet-zones': 'Quiet Zones'
    };
    return names[collectionSlug || ''] || collectionSlug;
  };

  // Group amenities by category
  const groupedAmenities = amenities.reduce((acc, amenity) => {
    const category = amenity.price_level || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(amenity);
    return acc;
  }, {} as Record<string, SupabaseAmenity[]>);

  if (loading && amenities.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading amenities for {MVP_CONFIG.TERMINAL_NAMES[activeTerminal as keyof typeof MVP_CONFIG.TERMINAL_NAMES]}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>⚠️ Error Loading Amenities</h2>
        <p>{error}</p>
        <button onClick={refresh}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="collection-page">
      {/* Header */}
      <header className="collection-header">
        <div className="breadcrumbs">
          <span onClick={() => navigate('/')}>Home</span>
          <span> / </span>
          <span onClick={() => navigate(`/vibe/${vibe}`)}>{vibe}</span>
          <span> / </span>
          <span>{getCollectionName()}</span>
        </div>

        <h1>{getCollectionName()}</h1>
        
        <div className="terminal-context">
          <TerminalSelector 
            currentTerminal={activeTerminal}
            onTerminalChange={handleTerminalChange}
          />
          {autoDetected && (
            <span className="auto-detected-badge">
              📍 Auto-detected
            </span>
          )}
        </div>
      </header>

      {/* Stats Bar */}
      {stats && (
        <div className="stats-bar">
          <div className="stat">
            <span className="stat-value">{amenities.length}</span>
            <span className="stat-label">Amenities</span>
          </div>
          <div className="stat">
            <span className="stat-value">{Object.keys(groupedAmenities).length}</span>
            <span className="stat-label">Categories</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.terminals.find((t: any) => t.code === activeTerminal)?.count || 0}</span>
            <span className="stat-label">Total in Terminal</span>
          </div>
        </div>
      )}

      {/* Amenities Grid */}
      <div className="amenities-container">
        {amenities.length === 0 ? (
          <div className="no-results">
            <h3>No amenities found</h3>
            <p>Try selecting a different terminal or browsing another collection.</p>
            <button onClick={() => navigate('/')}>Browse Collections</button>
          </div>
        ) : (
          <>
            {Object.entries(groupedAmenities).map(([category, items]) => (
              <section key={category} className="amenity-category">
                <h2 className="category-title">
                  {category} ({items.length})
                </h2>
                <div className="amenities-grid">
                  {items.map(amenity => (
                    <AmenityCard 
                      key={amenity.id}
                      amenity={amenity}
                      terminal={activeTerminal}
                    />
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="collection-footer">
        {lastFetched && (
          <p className="last-updated">
            Last updated: {lastFetched.toLocaleTimeString()}
          </p>
        )}
        <button onClick={refresh} disabled={loading}>
          {loading ? 'Refreshing...' : '🔄 Refresh'}
        </button>
      </footer>

      {/* Styles */}
      <style>{`
        .collection-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .collection-header {
          margin-bottom: 30px;
        }

        .breadcrumbs {
          font-size: 14px;
          color: #666;
          margin-bottom: 10px;
        }

        .breadcrumbs span {
          cursor: pointer;
        }

        .breadcrumbs span:hover {
          text-decoration: underline;
        }

        .terminal-context {
          margin-top: 20px;
          padding: 15px;
          background: #f5f5f5;
          border-radius: 8px;
        }

        .terminal-selector {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .terminal-buttons {
          display: flex;
          gap: 10px;
        }

        .terminal-btn {
          padding: 8px 16px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .terminal-btn:hover {
          background: #f0f0f0;
        }

        .terminal-btn.active {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .auto-detected-badge {
          display: inline-block;
          margin-left: 10px;
          padding: 4px 8px;
          background: #d4edda;
          color: #155724;
          border-radius: 4px;
          font-size: 12px;
        }

        .stats-bar {
          display: flex;
          gap: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          margin-bottom: 30px;
        }

        .stat {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 24px;
          font-weight: bold;
        }

        .stat-label {
          font-size: 14px;
          color: #666;
        }

        .amenities-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .amenity-card {
          padding: 20px;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .amenity-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .amenity-header {
          display: flex;
          align-items: start;
          margin-bottom: 15px;
        }

        .amenity-logo {
          width: 40px;
          height: 40px;
          border-radius: 4px;
          margin-right: 12px;
        }

        .amenity-info {
          flex: 1;
        }

        .amenity-info h3 {
          margin: 0 0 4px 0;
          font-size: 18px;
        }

        .amenity-terminal {
          font-size: 14px;
          color: #666;
        }

        .amenity-price {
          font-size: 18px;
          font-weight: bold;
          color: #28a745;
        }

        .amenity-description {
          color: #555;
          margin-bottom: 15px;
          line-height: 1.5;
        }

        .amenity-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 15px;
          border-top: 1px solid #f0f0f0;
        }

        .opening-hours {
          font-size: 14px;
          color: #666;
        }

        .badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }

        .badge-transit {
          background: #e3f2fd;
          color: #1976d2;
        }

        .badge-booking {
          background: #fff3cd;
          color: #856404;
        }

        .amenity-link {
          display: inline-block;
          margin-top: 10px;
          color: #007bff;
          text-decoration: none;
          font-size: 14px;
        }

        .amenity-link:hover {
          text-decoration: underline;
        }

        .category-title {
          margin: 30px 0 20px 0;
          font-size: 20px;
          color: #333;
        }

        .loading-container,
        .error-container,
        .no-results {
          text-align: center;
          padding: 60px 20px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f0f0f0;
          border-top-color: #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .collection-footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          text-align: center;
        }

        .last-updated {
          font-size: 14px;
          color: #666;
          margin-bottom: 10px;
        }

        @media (max-width: 768px) {
          .amenities-grid {
            grid-template-columns: 1fr;
          }
          
          .terminal-buttons {
            flex-wrap: wrap;
          }
          
          .stats-bar {
            flex-direction: column;
            gap: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default MVPCollectionPage;
