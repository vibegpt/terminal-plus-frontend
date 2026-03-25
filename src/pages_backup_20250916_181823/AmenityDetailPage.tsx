// src/pages/AmenityDetailPage.tsx
// Individual Amenity Detail Page

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Clock, Star, DollarSign, Navigation } from 'lucide-react';

export default function AmenityDetailPage() {
  const { amenitySlug } = useParams();
  const navigate = useNavigate();

  // Mock amenity data - replace with your actual data
  const amenity = {
    name: amenitySlug?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Amenity',
    description: 'This is a detailed description of the amenity. It provides information about what you can expect, the atmosphere, and any special features.',
    price: 'FREE',
    distance: '3 min walk',
    rating: 4.8,
    openingHours: '24/7',
    location: 'Level 3, near Gate A',
    category: 'Attraction',
    image: 'https://images.unsplash.com/photo-1459156212016-c812468e2115?w=800&h=600&fit=crop'
  };

  const handleBack = () => {
    navigate(-1);
  };

  const getPriceColor = (price: string) => {
    if (price === 'FREE') return 'text-green-400';
    if (price === '$') return 'text-yellow-400';
    if (price === '$$') return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <header className="sticky top-0 bg-slate-900/90 backdrop-blur-sm p-4 border-b border-slate-700/50">
        <motion.button 
          onClick={handleBack}
          className="mb-3 text-blue-400 hover:text-blue-300 flex items-center gap-2"
          whileHover={{ x: -4 }}
        >
          ← Back
        </motion.button>
        <h1 className="text-2xl font-bold">{amenity.name}</h1>
        <p className="text-slate-400">{amenity.category}</p>
      </header>

      {/* Hero Image */}
      <div className="relative h-64 overflow-hidden">
        <img 
          src={amenity.image} 
          alt={amenity.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
        <div className="absolute bottom-4 left-4">
          <span className={`text-2xl font-bold px-4 py-2 rounded-full ${
            amenity.price === 'FREE' 
              ? 'bg-green-600/90 text-white' 
              : 'bg-yellow-600/90 text-white'
          }`}>
            {amenity.price}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Basic Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold mb-3">About {amenity.name}</h2>
          <p className="text-slate-300 leading-relaxed">{amenity.description}</p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="bg-slate-800/50 rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Star className="h-6 w-6 text-yellow-400 fill-current" />
            </div>
            <div className="text-2xl font-bold">{amenity.rating}</div>
            <div className="text-sm text-slate-400">Rating</div>
          </div>
          
          <div className="bg-slate-800/50 rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Navigation className="h-6 w-6 text-blue-400" />
            </div>
            <div className="text-2xl font-bold">{amenity.distance}</div>
            <div className="text-sm text-slate-400">Distance</div>
          </div>
        </motion.div>

        {/* Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 rounded-2xl p-6 space-y-4"
        >
          <h3 className="text-lg font-bold">Details</h3>
          
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-blue-400" />
            <div>
              <div className="font-medium">Location</div>
              <div className="text-slate-400 text-sm">{amenity.location}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-green-400" />
            <div>
              <div className="font-medium">Opening Hours</div>
              <div className="text-slate-400 text-sm">{amenity.openingHours}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-yellow-400" />
            <div>
              <div className="font-medium">Price</div>
              <div className={`text-sm ${getPriceColor(amenity.price)}`}>
                {amenity.price}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors">
            Get Directions
          </button>
          
          <button className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium transition-colors">
            Save to Favorites
          </button>
        </motion.div>
      </div>

      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/vibes-feed')}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-2xl flex items-center justify-center z-20 text-white font-bold"
      >
        🏠
      </motion.button>
    </div>
  );
}
