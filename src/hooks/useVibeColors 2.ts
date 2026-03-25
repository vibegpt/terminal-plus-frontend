import { vibeColorMap, vibeGradientMap } from '@/constants/vibeColorsGenZ';

export function useVibeColors() {
  const getVibeColor = (vibe: string) => {
    return vibeColorMap[vibe] || '#CCCCCC'; // Fallback color
  };

  const getVibeBgGlow = (vibe: string) => {
    return vibeGradientMap[vibe] || 'bg-slate-100'; // Fallback bg class
  };

  const getCardGlowClass = (vibe: string) => {
    return vibeGradientMap[vibe] || ''; // No glow if undefined
  };

  return {
    getVibeColor,
    getVibeBgGlow,
    getCardGlowClass
  };
} 