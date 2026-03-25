// Vibe system constants with updated colors and definitions
export interface VibeDefinition {
  id: string;
  name: string;
  emoji: string;
  color: string;
  gradient: string;
  description: string;
  focus: string;
  examples: string[];
}

export const VIBE_DEFINITIONS: Record<string, VibeDefinition> = {
  chill: {
    id: 'chill',
    name: 'Chill',
    emoji: '😌',
    color: '#87CEEB', // Sky Blue - peaceful, calm
    gradient: 'from-[#87CEEB] to-sky-400',
    description: 'Quiet, peaceful, low-stimulation environments',
    focus: 'Mental relaxation, ambient experiences',
    examples: ['Meditation rooms', 'Quiet lounges', 'Libraries', 'Reading areas', 'Prayer rooms']
  },
  comfort: {
    id: 'comfort',
    name: 'Comfort',
    emoji: '🛋️',
    color: '#CBAACB', // Lavender - rest, sleep
    gradient: 'from-[#CBAACB] to-purple-400',
    description: 'Physical rest and wellness spaces',
    focus: 'Body comfort, rest, recovery',
    examples: ['Sleep pods', 'Spas', 'Massage chairs', 'Day hotels', 'Showers']
  },
  explore: {
    id: 'explore',
    name: 'Explore',
    emoji: '🧭',
    color: '#F76C6C', // Coral Red - active, energetic
    gradient: 'from-[#F76C6C] to-red-400',
    description: 'Active discovery and terminal attractions',
    focus: 'Discovering attractions and experiences',
    examples: ['Gardens', 'Art installations', 'Observation decks', 'Cinemas', 'Museums']
  },
  refuel: {
    id: 'refuel',
    name: 'Refuel',
    emoji: '🍔',
    color: '#FF7F50', // Orange - appetite, energy
    gradient: 'from-[#FF7F50] to-orange-400',
    description: 'Food, drinks, and dining experiences',
    focus: 'Sustenance and energy boost',
    examples: ['Restaurants', 'Cafes', 'Bars', 'Food courts', 'Coffee shops']
  },
  quick: {
    id: 'quick',
    name: 'Quick',
    emoji: '⚡',
    color: '#FFDD57', // Electric Yellow - urgency, speed
    gradient: 'from-[#FFDD57] to-yellow-400',
    description: 'Fast essentials and grab-and-go options',
    focus: 'Speed and efficiency',
    examples: ['Grab-and-go food', 'Convenience stores', 'Express services', 'Quick shops']
  },
  work: {
    id: 'work',
    name: 'Work',
    emoji: '💼',
    color: '#D3B88C', // Warm Taupe - focus, grounding
    gradient: 'from-[#D3B88C] to-amber-600',
    description: 'Productive spaces for work and focus',
    focus: 'Productivity during wait time',
    examples: ['Business lounges', 'Work pods', 'Meeting rooms', 'Quiet workspaces']
  },
  shop: {
    id: 'shop',
    name: 'Shop',
    emoji: '🛍️',
    color: '#FFD6E0', // Light Pink - indulgence, discovery
    gradient: 'from-[#FFD6E0] to-pink-400',
    description: 'Shopping and retail therapy',
    focus: 'Browse and shop',
    examples: ['Duty-free shops', 'Boutiques', 'Souvenir stores', 'Fashion outlets']
  }
};

// Get vibe by ID
export const getVibeById = (id: string): VibeDefinition | undefined => {
  return VIBE_DEFINITIONS[id];
};

// Get all vibes as array
export const getAllVibes = (): VibeDefinition[] => {
  return Object.values(VIBE_DEFINITIONS);
};

// Get vibe color
export const getVibeColor = (vibeId: string): string => {
  return VIBE_DEFINITIONS[vibeId]?.color || '#87CEEB';
};

// Get vibe gradient
export const getVibeGradient = (vibeId: string): string => {
  return VIBE_DEFINITIONS[vibeId]?.gradient || 'from-gray-500 to-gray-600';
};
