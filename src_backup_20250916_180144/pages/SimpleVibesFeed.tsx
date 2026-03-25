import React from 'react';
import { useNavigate } from 'react-router-dom';

// COMPLETE VIBES DATA - ALL 7
const VIBES_DATA = {
  discover: {
    name: 'Discover',
    icon: '🔍',
    description: 'Unique experiences & hidden gems',
    color: '#9333ea',
    collections: [
      { slug: 'hidden-gems', name: 'Hidden Gems', count: 12 },
      { slug: 'instagram-spots', name: 'Instagram Spots', count: 8 },
      { slug: 'art-culture', name: 'Art & Culture', count: 15 }
    ]
  },
  chill: {
    name: 'Chill',
    icon: '😌',
    description: 'Easy-going spots & casual relaxation',
    color: '#0ea5e9',
    collections: [
      { slug: 'quiet-zones', name: 'Quiet Zones', count: 10 },
      { slug: 'garden-spaces', name: 'Garden Spaces', count: 7 },
      { slug: 'coffee-chill', name: 'Coffee & Chill', count: 20 }
    ]
  },
  comfort: {
    name: 'Comfort',
    icon: '🛏️',
    description: 'Premium rest & wellness',
    color: '#ec4899',
    collections: [
      { slug: 'sleep-pods', name: 'Sleep Pods', count: 5 },
      { slug: 'spa-wellness', name: 'Spa & Wellness', count: 8 },
      { slug: 'premium-lounges', name: 'Premium Lounges', count: 12 }
    ]
  },
  refuel: {
    name: 'Refuel',
    icon: '🍔',
    description: 'Food & drinks for every taste',
    color: '#f97316',
    collections: [
      { slug: 'hawker-heaven', name: 'Hawker Heaven', count: 55 },
      { slug: 'quick-bites', name: 'Quick Bites', count: 30 },
      { slug: 'coffee-culture', name: 'Coffee Culture', count: 25 },
      { slug: 'fine-dining', name: 'Fine Dining', count: 10 }
    ]
  },
  work: {
    name: 'Work',
    icon: '💼',
    description: 'Productivity & business spaces',
    color: '#6b7280',
    collections: [
      { slug: 'business-centers', name: 'Business Centers', count: 8 },
      { slug: 'meeting-rooms', name: 'Meeting Rooms', count: 5 },
      { slug: 'work-lounges', name: 'Work Lounges', count: 10 }
    ]
  },
  shop: {
    name: 'Shop',
    icon: '🛍️',
    description: 'Retail therapy & souvenirs',
    color: '#f43f5e',
    collections: [
      { slug: 'duty-free', name: 'Duty Free', count: 40 },
      { slug: 'local-finds', name: 'Local Finds', count: 20 },
      { slug: 'luxury-brands', name: 'Luxury Brands', count: 25 }
    ]
  },
  quick: {
    name: 'Quick',
    icon: '⚡',
    description: 'Fast essentials for time-pressed',
    color: '#eab308',
    collections: [
      { slug: '24-7-essentials', name: '24/7 Essentials', count: 15 },
      { slug: 'grab-and-go', name: 'Grab & Go', count: 20 },
      { slug: 'express-services', name: 'Express Services', count: 10 }
    ]
  }
};

export default function SimpleVibesFeed() {
  const navigate = useNavigate();

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(to bottom, #0f0f0f, #1a1a1a)',
      color: 'white',
      padding: '20px'
    }}>
      {/* Header */}
      <header style={{ 
        marginBottom: '40px',
        padding: '20px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '15px',
        backdropFilter: 'blur(10px)'
      }}>
        <h1 style={{ 
          fontSize: '3em', 
          marginBottom: '10px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Terminal+
        </h1>
        <p style={{ opacity: 0.8 }}>📍 Singapore Changi • Terminal 3</p>
        <p style={{ opacity: 0.6, fontSize: '0.9em' }}>Your mood-first airport guide</p>
        <div style={{ marginTop: '15px' }}>
          <a 
            href="/smart7" 
            style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '20px',
              color: 'white',
              textDecoration: 'none',
              fontSize: '0.9em',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }}
          >
            🎯 View Smart7 Collections
          </a>
        </div>
      </header>
      
      {/* Vibes List */}
      {Object.entries(VIBES_DATA).map(([vibeKey, vibe]) => (
        <div key={vibeKey} style={{ marginBottom: '50px' }}>
          {/* Vibe Header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '2.5em' }}>{vibe.icon}</span>
              <div>
                <h2 style={{ 
                  fontSize: '1.8em', 
                  marginBottom: '5px',
                  color: vibe.color 
                }}>
                  {vibe.name}
                </h2>
                <p style={{ opacity: 0.7, fontSize: '0.9em' }}>{vibe.description}</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/vibe/${vibeKey}`)}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                border: `1px solid ${vibe.color}`,
                color: vibe.color,
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '0.9em',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = vibe.color;
                e.currentTarget.style.color = 'white';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = vibe.color;
              }}
            >
              See all →
            </button>
          </div>
          
          {/* Collections Horizontal Scroll */}
          <div style={{ 
            display: 'flex', 
            gap: '15px', 
            overflowX: 'auto',
            padding: '5px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            {vibe.collections.map(collection => (
              <div
                key={collection.slug}
                onClick={() => navigate(`/collection/${collection.slug}`)}
                style={{
                  minWidth: '220px',
                  padding: '20px',
                  background: `linear-gradient(135deg, ${vibe.color}20, ${vibe.color}10)`,
                  border: `1px solid ${vibe.color}30`,
                  borderRadius: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = `0 10px 30px ${vibe.color}40`;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <h3 style={{ 
                  fontSize: '1.2em',
                  marginBottom: '10px',
                  color: 'white'
                }}>
                  {collection.name}
                </h3>
                <p style={{ 
                  fontSize: '0.9em', 
                  opacity: 0.8,
                  color: vibe.color,
                  fontWeight: 'bold'
                }}>
                  {collection.count} spots
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {/* Footer */}
      <footer style={{
        marginTop: '60px',
        padding: '20px',
        textAlign: 'center',
        opacity: 0.5,
        fontSize: '0.9em'
      }}>
        <p>Terminal+ • Smart airport navigation</p>
        <p>Powered by Smart7 Algorithm</p>
      </footer>
    </div>
  );
}
