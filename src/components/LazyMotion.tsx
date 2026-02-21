import React, { lazy, Suspense, useState, useEffect } from 'react';

// Only load Framer Motion when needed
const MotionDiv = lazy(() => 
  import('framer-motion').then(mod => ({ 
    default: mod.motion.div 
  }))
);

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  whileHover?: any;
  whileTap?: any;
  initial?: any;
  animate?: any;
  transition?: any;
}

export function AnimatedCard({ 
  children, 
  whileHover = { scale: 1.02 },
  whileTap = { scale: 0.98 },
  ...props 
}: AnimatedCardProps) {
  return (
    <Suspense fallback={<div {...props}>{children}</div>}>
      <MotionDiv
        whileHover={whileHover}
        whileTap={whileTap}
        {...props}
      >
        {children}
      </MotionDiv>
    </Suspense>
  );
}

// Lazy load other Framer Motion components
const MotionButton = lazy(() => 
  import('framer-motion').then(mod => ({ 
    default: mod.motion.button 
  }))
);

export function AnimatedButton({ 
  children, 
  whileHover = { scale: 1.05 },
  whileTap = { scale: 0.95 },
  ...props 
}: AnimatedCardProps) {
  return (
    <Suspense fallback={<button {...props}>{children}</button>}>
      <MotionButton
        whileHover={whileHover}
        whileTap={whileTap}
        {...props}
      >
        {children}
      </MotionButton>
    </Suspense>
  );
}

const MotionSection = lazy(() => 
  import('framer-motion').then(mod => ({ 
    default: mod.motion.section 
  }))
);

export function AnimatedSection({ 
  children, 
  initial = { opacity: 0, y: 20 },
  animate = { opacity: 1, y: 0 },
  transition = { duration: 0.5 },
  ...props 
}: AnimatedCardProps) {
  return (
    <Suspense fallback={<section {...props}>{children}</section>}>
      <MotionSection
        initial={initial}
        animate={animate}
        transition={transition}
        {...props}
      >
        {children}
      </MotionSection>
    </Suspense>
  );
}

// Hook for lazy loading Framer Motion
export function useLazyMotion() {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    import('framer-motion').then(() => {
      setIsLoaded(true);
    });
  }, []);
  
  return isLoaded;
}

export default AnimatedCard;
