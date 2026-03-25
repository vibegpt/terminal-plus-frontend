import { useVibe } from '@/context/VibeContext';
import { useTheme } from '@/hooks/useTheme';

const vibeStyles = {
  Chill: {
    name: 'Chill',
    icon: '🧘',
    gradient: {
      light: 'bg-gradient-to-br from-[#CBAACB] to-[#f8fafc]',
      dark: 'bg-gradient-to-br from-[#33243b] to-[#1e293b]'
    },
    bgColor: {
      light: 'bg-[#CBAACB]',
      dark: 'bg-[#33243b]'
    },
    textColor: {
      light: 'text-slate-900',
      dark: 'text-white'
    }
  },
  Explore: {
    name: 'Explore',
    icon: '🧭',
    gradient: {
      light: 'bg-gradient-to-br from-[#F76C6C] to-[#fff6f6]',
      dark: 'bg-gradient-to-br from-[#4b1e1e] to-[#1e293b]'
    },
    bgColor: {
      light: 'bg-[#F76C6C]',
      dark: 'bg-[#4b1e1e]'
    },
    textColor: {
      light: 'text-slate-900',
      dark: 'text-white'
    }
  },
  Work: {
    name: 'Work',
    icon: '⌨️',
    gradient: {
      light: 'bg-gradient-to-br from-[#D3B88C] to-[#f8fafc]',
      dark: 'bg-gradient-to-br from-[#3b2f1e] to-[#1e293b]'
    },
    bgColor: {
      light: 'bg-[#D3B88C]',
      dark: 'bg-[#3b2f1e]'
    },
    textColor: {
      light: 'text-slate-900',
      dark: 'text-white'
    }
  },
  Quick: {
    name: 'Quick',
    icon: '⚡',
    gradient: {
      light: 'bg-gradient-to-br from-[#FFDD57] to-[#fffbe6]',
      dark: 'bg-gradient-to-br from-[#4a3b1e] to-[#1e293b]'
    },
    bgColor: {
      light: 'bg-[#FFDD57]',
      dark: 'bg-[#4a3b1e]'
    },
    textColor: {
      light: 'text-slate-900',
      dark: 'text-white'
    }
  },
  Refuel: {
    name: 'Refuel',
    icon: '☕',
    gradient: {
      light: 'bg-gradient-to-br from-[#FF7F50] to-[#fff6f2]',
      dark: 'bg-gradient-to-br from-[#4a2c1e] to-[#1e293b]'
    },
    bgColor: {
      light: 'bg-[#FF7F50]',
      dark: 'bg-[#4a2c1e]'
    },
    textColor: {
      light: 'text-slate-900',
      dark: 'text-white'
    }
  },
  Comfort: {
    name: 'Comfort',
    icon: '🛏️',
    gradient: {
      light: 'bg-gradient-to-br from-[#CBAACB] to-[#f8fafc]',
      dark: 'bg-gradient-to-br from-[#33243b] to-[#1e293b]'
    },
    bgColor: {
      light: 'bg-[#CBAACB]',
      dark: 'bg-[#33243b]'
    },
    textColor: {
      light: 'text-slate-900',
      dark: 'text-white'
    }
  },
  Shop: {
    name: 'Shop',
    icon: '🛍️',
    gradient: {
      light: 'bg-gradient-to-br from-[#FFD6E0] to-[#f8fafc]',
      dark: 'bg-gradient-to-br from-[#7c3f58] to-[#1e293b]'
    },
    bgColor: {
      light: 'bg-[#FFD6E0]',
      dark: 'bg-[#7c3f58]'
    },
    textColor: {
      light: 'text-slate-900',
      dark: 'text-white'
    }
  }
};

export function useVibeStyles(themeOverride?: 'light' | 'dark') {
  const { selectedVibe } = useVibe();
  const theme = themeOverride || useTheme();
  const vibe = selectedVibe && vibeStyles[selectedVibe as keyof typeof vibeStyles];

  if (!vibe) return null;

  return {
    name: vibe.name,
    icon: vibe.icon,
    gradient: vibe.gradient[theme],
    bgColor: vibe.bgColor[theme],
    textColor: vibe.textColor[theme]
  };
} 