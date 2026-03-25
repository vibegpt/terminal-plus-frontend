import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export const vibeOptions = [
  { value: 'Chill', label: 'Chill', emoji: '🧘' },
  { value: 'Explore', label: 'Explore', emoji: '🧭' },
  { value: 'Work', label: 'Work', emoji: '💼' },
  { value: 'Quick', label: 'Quick', emoji: '⚡' },
  { value: 'Shop', label: 'Shop', emoji: '🛍️' }
];

export function getVibeEmoji(vibe: 'Chill' | 'Explore' | 'Work' | 'Quick' | 'Shop'): string {
  const option = vibeOptions.find(opt => opt.value === vibe);
  return option ? option.emoji : '';
}

// Vibe glow CSS classes (add these to your global stylesheet):
// .vibe-glow-violet { box-shadow: 0 0 40px 10px rgba(139, 92, 246, 0.25) !important; }
// .vibe-glow-green  { box-shadow: 0 0 40px 10px rgba(34, 197, 94, 0.25) !important; }
// .vibe-glow-blue   { box-shadow: 0 0 40px 10px rgba(59, 130, 246, 0.25) !important; }
// .vibe-glow-orange { box-shadow: 0 0 40px 10px rgba(251, 146, 60, 0.25) !important; }
// .vibe-glow-white  { box-shadow: 0 0 40px 10px rgba(255, 255, 255, 0.25) !important; }
