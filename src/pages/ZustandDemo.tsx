import React, { useState } from 'react';
import { useAppStore, useAuthStore, useSearchStore, useUIStore } from '../stores';
import { Button } from '../components/ui/button';

export const ZustandDemo: React.FC = () => {
  const [demoSection, setDemoSection] = useState<'app' | 'auth' | 'search' | 'ui'>('app');

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Zustand State Management Demo</h1>
      
      {/* Navigation */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Button
          onClick={() => setDemoSection('app')}
          variant={demoSection === 'app' ? 'default' : 'outline'}
        >
          App Store
        </Button>
        <Button
          onClick={() => setDemoSection('auth')}
          variant={demoSection === 'auth' ? 'default' : 'outline'}
        >
          Auth Store
        </Button>
        <Button
          onClick={() => setDemoSection('search')}
          variant={demoSection === 'search' ? 'default' : 'outline'}
        >
          Search Store
        </Button>
        <Button
          onClick={() => setDemoSection('ui')}
          variant={demoSection === 'ui' ? 'default' : 'outline'}
        >
          UI Store
        </Button>
      </div>

      {/* Demo Sections */}
      {demoSection === 'app' && <AppStoreDemo />}
      {demoSection === 'auth' && <AuthStoreDemo />}
      {demoSection === 'search' && <SearchStoreDemo />}
      {demoSection === 'ui' && <UIStoreDemo />}
    </div>
  );
};

const AppStoreDemo: React.FC = () => {
  const {
    amenities,
    bookmarks,
    selectedTerminal,
    boardingTime,
    currentVibe,
    isLoading,
    theme,
    addAmenity,
    addBookmark,
    removeBookmark,
    setSelectedTerminal,
    setBoardingTime,
    setCurrentVibe,
    setLoading,
    setTheme,
    getFilteredAmenities,
    isBookmarked
  } = useAppStore();

  const mockAmenity = {
    id: Date.now(),
    name: 'Demo Restaurant',
    description: 'A demo restaurant for testing',
    terminal_code: selectedTerminal,
    price_level: '$' as const,
    vibe_tags: ['food', 'quick'],
    opening_hours: '24/7'
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">App Store Demo</h2>
      
      {/* State Display */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="text-lg font-medium mb-2">Current State</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Selected Terminal:</strong> {selectedTerminal}
          </div>
          <div>
            <strong>Boarding Time:</strong> {boardingTime || 'Not set'}
          </div>
          <div>
            <strong>Current Vibe:</strong> {currentVibe || 'None'}
          </div>
          <div>
            <strong>Theme:</strong> {theme}
          </div>
          <div>
            <strong>Amenities Count:</strong> {amenities.length}
          </div>
          <div>
            <strong>Bookmarks Count:</strong> {bookmarks.length}
          </div>
          <div>
            <strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Terminal Selection</h3>
          <div className="flex flex-wrap gap-2">
            {['SIN-T1', 'SIN-T2', 'SIN-T3', 'SIN-T4', 'SIN-JEWEL'].map(terminal => (
              <Button
                key={terminal}
                onClick={() => setSelectedTerminal(terminal)}
                variant={selectedTerminal === terminal ? 'default' : 'outline'}
                size="sm"
              >
                {terminal}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Vibe Selection</h3>
          <div className="flex flex-wrap gap-2">
            {['comfort', 'refuel', 'quick', 'chill', 'work'].map(vibe => (
              <Button
                key={vibe}
                onClick={() => setCurrentVibe(vibe)}
                variant={currentVibe === vibe ? 'default' : 'outline'}
                size="sm"
              >
                {vibe}
              </Button>
            ))}
            <Button
              onClick={() => setCurrentVibe(null)}
              variant="outline"
              size="sm"
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Demo Actions */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Demo Actions</h3>
        <div className="flex flex-wrap gap-4">
          <Button
            onClick={() => addAmenity(mockAmenity)}
            disabled={isLoading}
          >
            Add Demo Amenity
          </Button>
          
          <Button
            onClick={() => addBookmark(mockAmenity)}
            disabled={isBookmarked(mockAmenity.id)}
          >
            Bookmark Demo Amenity
          </Button>
          
          <Button
            onClick={() => removeBookmark(mockAmenity.id)}
            disabled={!isBookmarked(mockAmenity.id)}
            variant="destructive"
          >
            Remove Bookmark
          </Button>
          
          <Button
            onClick={() => setLoading(!isLoading)}
            variant="outline"
          >
            Toggle Loading
          </Button>
          
          <Button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            variant="outline"
          >
            Toggle Theme
          </Button>
        </div>
      </div>

      {/* Boarding Time Input */}
      <div className="space-y-2">
        <label htmlFor="boarding-time" className="text-sm font-medium">
          Boarding Time:
        </label>
        <input
          id="boarding-time"
          type="time"
          value={boardingTime}
          onChange={(e) => setBoardingTime(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>
    </div>
  );
};

const AuthStoreDemo: React.FC = () => {
  const { user, isAuthenticated, isLoading, error, login, logout, loginWithGoogle } = useAuthStore();
  const [email, setEmail] = useState('demo@terminalplus.com');
  const [password, setPassword] = useState('demo123');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Auth Store Demo</h2>
      
      {/* State Display */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="text-lg font-medium mb-2">Current State</h3>
        <div className="space-y-2 text-sm">
          <div>
            <strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}
          </div>
          <div>
            <strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}
          </div>
          {error && (
            <div className="text-red-600">
              <strong>Error:</strong> {error}
            </div>
          )}
          {user && (
            <div>
              <strong>User:</strong> {user.name} ({user.email})
            </div>
          )}
        </div>
      </div>

      {/* Auth Actions */}
      {!isAuthenticated ? (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Login</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email:
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border rounded px-3 py-2 w-full"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password:
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border rounded px-3 py-2 w-full"
              />
            </div>
            <div className="flex gap-4">
              <Button
                onClick={() => login(email, password)}
                disabled={isLoading}
              >
                Login
              </Button>
              <Button
                onClick={loginWithGoogle}
                disabled={isLoading}
                variant="outline"
              >
                Login with Google
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">User Actions</h3>
          <Button
            onClick={logout}
            variant="destructive"
          >
            Logout
          </Button>
        </div>
      )}
    </div>
  );
};

const SearchStoreDemo: React.FC = () => {
  const {
    query,
    filters,
    sortOptions,
    recentSearches,
    savedSearches,
    updateSearchQuery,
    updateSearchFilters,
    setSortBy,
    setSortOrder,
    toggleFilter,
    addRecentSearch,
    saveSearch,
    unsaveSearch,
    hasActiveFilters,
    getActiveFilters
  } = useSearchStore();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Search Store Demo</h2>
      
      {/* Search Query */}
      <div className="space-y-2">
        <label htmlFor="search-query" className="text-sm font-medium">
          Search Query:
        </label>
        <input
          id="search-query"
          type="text"
          value={query}
          onChange={(e) => updateSearchQuery(e.target.value)}
          placeholder="Search amenities..."
          className="border rounded px-3 py-2 w-full"
        />
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Filters</h3>
        
        <div>
          <h4 className="font-medium mb-2">Terminal:</h4>
          <div className="flex flex-wrap gap-2">
            {['T1', 'T2', 'T3', 'T4', 'JEWEL'].map(terminal => (
              <Button
                key={terminal}
                onClick={() => toggleFilter('terminal', terminal)}
                variant={filters.terminal.includes(terminal) ? 'default' : 'outline'}
                size="sm"
              >
                {terminal}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Price Level:</h4>
          <div className="flex flex-wrap gap-2">
            {['$', '$$', '$$$'].map(price => (
              <Button
                key={price}
                onClick={() => toggleFilter('priceLevel', price)}
                variant={filters.priceLevel.includes(price) ? 'default' : 'outline'}
                size="sm"
              >
                {price}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Options:</h4>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.openNow}
                onChange={(e) => toggleFilter('openNow', e.target.checked)}
              />
              Open Now
            </label>
          </div>
        </div>
      </div>

      {/* Sort Options */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Sort Options</h3>
        <div className="flex gap-4 items-center">
          <select
            value={sortOptions.by}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border rounded px-3 py-2"
          >
            <option value="name">Name</option>
            <option value="price">Price</option>
            <option value="distance">Distance</option>
            <option value="rating">Rating</option>
          </select>
          
          <Button
            onClick={() => setSortOrder(sortOptions.order === 'asc' ? 'desc' : 'asc')}
            variant="outline"
            size="sm"
          >
            {sortOptions.order === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
      </div>

      {/* Recent and Saved Searches */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Recent Searches</h3>
          <div className="space-y-1">
            {recentSearches.slice(0, 5).map((search, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <span className="text-sm">{search}</span>
                <Button
                  onClick={() => saveSearch(search)}
                  size="sm"
                  variant="outline"
                >
                  Save
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Saved Searches</h3>
          <div className="space-y-1">
            {savedSearches.map((search, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <span className="text-sm">{search}</span>
                <Button
                  onClick={() => unsaveSearch(search)}
                  size="sm"
                  variant="destructive"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters() && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Active Filters</h3>
          <pre className="text-sm">{JSON.stringify(getActiveFilters(), null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

const UIStoreDemo: React.FC = () => {
  const {
    theme,
    sidebar,
    toasts,
    globalLoading,
    modals,
    setTheme,
    toggleSidebar,
    setSidebarTab,
    showToast,
    setGlobalLoading,
    openModal,
    closeModal
  } = useUIStore();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">UI Store Demo</h2>
      
      {/* State Display */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="text-lg font-medium mb-2">Current State</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Theme:</strong> {theme}
          </div>
          <div>
            <strong>Sidebar Open:</strong> {sidebar.isOpen ? 'Yes' : 'No'}
          </div>
          <div>
            <strong>Active Tab:</strong> {sidebar.activeTab}
          </div>
          <div>
            <strong>Global Loading:</strong> {globalLoading ? 'Yes' : 'No'}
          </div>
          <div>
            <strong>Toasts Count:</strong> {toasts.length}
          </div>
          <div>
            <strong>Modals Count:</strong> {modals.length}
          </div>
        </div>
      </div>

      {/* Theme Controls */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Theme</h3>
        <div className="flex gap-2">
          {['light', 'dark', 'system'].map(t => (
            <Button
              key={t}
              onClick={() => setTheme(t as any)}
              variant={theme === t ? 'default' : 'outline'}
              size="sm"
            >
              {t}
            </Button>
          ))}
        </div>
      </div>

      {/* Sidebar Controls */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Sidebar</h3>
        <div className="flex gap-2">
          <Button
            onClick={toggleSidebar}
            variant="outline"
            size="sm"
          >
            Toggle Sidebar
          </Button>
          
          {['search', 'favorites', 'history', 'settings'].map(tab => (
            <Button
              key={tab}
              onClick={() => setSidebarTab(tab)}
              variant={sidebar.activeTab === tab ? 'default' : 'outline'}
              size="sm"
            >
              {tab}
            </Button>
          ))}
        </div>
      </div>

      {/* Toast Controls */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Toast Notifications</h3>
        <div className="flex gap-2">
          <Button
            onClick={() => showToast({
              type: 'success',
              title: 'Success!',
              message: 'This is a success toast'
            })}
            size="sm"
          >
            Success Toast
          </Button>
          
          <Button
            onClick={() => showToast({
              type: 'error',
              title: 'Error!',
              message: 'This is an error toast'
            })}
            size="sm"
            variant="destructive"
          >
            Error Toast
          </Button>
          
          <Button
            onClick={() => showToast({
              type: 'info',
              title: 'Info',
              message: 'This is an info toast'
            })}
            size="sm"
            variant="outline"
          >
            Info Toast
          </Button>
        </div>
      </div>

      {/* Loading Controls */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Loading States</h3>
        <Button
          onClick={() => setGlobalLoading(!globalLoading)}
          variant="outline"
          size="sm"
        >
          Toggle Global Loading
        </Button>
      </div>

      {/* Modal Controls */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Modals</h3>
        <Button
          onClick={() => openModal({
            component: 'DemoModal',
            props: { title: 'Demo Modal', content: 'This is a demo modal' }
          })}
          size="sm"
        >
          Open Demo Modal
        </Button>
        
        {modals.length > 0 && (
          <Button
            onClick={() => closeModal(modals[modals.length - 1].id)}
            size="sm"
            variant="destructive"
          >
            Close Last Modal
          </Button>
        )}
      </div>
    </div>
  );
};
