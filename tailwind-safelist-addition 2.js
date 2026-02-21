// Add to your tailwind.config.js

module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './src/styles/*.css' // Make sure CSS files are included
  ],
  safelist: [
    'gradient-animate',
    'glass-overlay',
    'float-animation',
    'bounce-in',
    'terminal-pill',
    'preview-icon',
    'changi-exclusives-card',
    // Add animation classes
    'bounce-in-delay-0',
    'bounce-in-delay-1', 
    'bounce-in-delay-2',
    'fade-in',
    'pulse-dot'
  ],
  theme: {
    extend: {
      // Add custom animations if needed
      animation: {
        'gradient-shift': 'gradient-shift 4s ease infinite',
        'float': 'float 3s ease-in-out infinite',
        'bounce-in': 'bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards'
      }
    }
  }
}