import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const FEATURED_COLLECTIONS = [
  { 
    slug: 'singapore-exclusives', 
    name: 'Singapore Exclusives', 
    icon: '🇸🇬', 
    description: 'Local Singapore brands and experiences',
    gradient: 'from-green-500 to-blue-600',
    terminal: 'T3'
  },
  { 
    slug: 'quick-bites', 
    name: 'Quick Bites', 
    icon: '🏃', 
    description: 'Fast food and quick meals',
    gradient: 'from-orange-500 to-red-600',
    terminal: 'T3'
  },
  { 
    slug: 'lounges-affordable', 
    name: 'Affordable Lounges', 
    icon: '🛋️', 
    description: 'Comfortable lounge experiences',
    gradient: 'from-purple-500 to-indigo-600',
    terminal: 'T3'
  },
  { 
    slug: 'coffee-worth-walk', 
    name: 'Coffee Worth Walking', 
    icon: '☕', 
    description: 'Best coffee spots in the airport',
    gradient: 'from-brown-500 to-amber-600',
    terminal: 'T1'
  },
  { 
    slug: 'gardens-at-dawn', 
    name: 'Gardens at Dawn', 
    icon: '🌅', 
    description: 'Beautiful garden experiences',
    gradient: 'from-pink-500 to-rose-600',
    terminal: 'T2'
  }
];

export const SingaporeAirportApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="bg-gradient-to-br from-blue-500 to-purple-600">
          <div className="px-4 py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-white"
            >
              <h1 className="text-4xl font-bold mb-4">
                Changi Smart7 Collections
              </h1>
              <p className="text-xl text-white/90 mb-6">
                AI-curated experiences for every mood and moment
              </p>
              <div className="flex items-center justify-center gap-4 text-sm">
                <span className="px-4 py-2 bg-white/20 backdrop-blur rounded-full">
                  ✨ AI-Powered
                </span>
                <span className="px-4 py-2 bg-white/20 backdrop-blur rounded-full">
                  🗺️ Terminal Aware
                </span>
                <span className="px-4 py-2 bg-white/20 backdrop-blur rounded-full">
                  🎯 Personalized
                </span>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Wave divider */}
        <div className="relative -mt-1">
          <svg viewBox="0 0 1440 120" className="w-full h-12">
            <path 
              fill="#f3f4f6"
              d="M0,32L48,37.3C96,43,192,53,288,56C384,59,480,53,576,45.3C672,37,768,27,864,26.7C960,27,1056,37,1152,42.7C1248,48,1344,48,1392,48L1440,48L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
            />
          </svg>
        </div>
      </div>

      {/* Featured Collections Grid */}
      <div className="px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Featured Collections
            </h2>
            <Link 
              to="/explore" 
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View All →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURED_COLLECTIONS.map((collection, index) => (
              <motion.div
                key={collection.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <Link to={`/collection/${collection.slug}`}>
                  <div className={`bg-gradient-to-br ${collection.gradient} p-6 rounded-xl text-white h-full transition-transform group-hover:scale-105`}>
                    <div className="text-4xl mb-3">{collection.icon}</div>
                    <h3 className="text-lg font-bold mb-2">{collection.name}</h3>
                    <p className="text-white/80 text-sm mb-3">{collection.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                        Terminal {collection.terminal}
                      </span>
                      <span className="text-xs text-white/80">→ Explore</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link 
              to="/dashboard"
              className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors text-center"
            >
              <span className="text-2xl block mb-2">📊</span>
              <span className="text-sm font-medium text-blue-700">Dashboard</span>
            </Link>
            <Link 
              to="/test"
              className="p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors text-center"
            >
              <span className="text-2xl block mb-2">🧪</span>
              <span className="text-sm font-medium text-green-700">Test System</span>
            </Link>
            <Link 
              to="/explore"
              className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors text-center"
            >
              <span className="text-2xl block mb-2">🔍</span>
              <span className="text-sm font-medium text-purple-700">Explore All</span>
            </Link>
            <Link 
              to="/"
              className="p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors text-center"
            >
              <span className="text-2xl block mb-2">🏠</span>
              <span className="text-sm font-medium text-orange-700">Home</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Terminal Selector */}
      <div className="px-4 mb-20">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Your Terminal</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['T1', 'T2', 'T3', 'T4'].map(terminal => (
              <Link
                key={terminal}
                to={`/collections?terminal=${terminal}`}
                className="p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-center"
              >
                <span className="text-2xl block mb-2">✈️</span>
                <span className="text-sm font-medium text-gray-700">Terminal {terminal}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
