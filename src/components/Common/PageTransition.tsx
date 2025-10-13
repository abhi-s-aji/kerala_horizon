import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  pageKey: string;
  className?: string;
}

// Different transition variants for variety
const transitionVariants = {
  // Slide transitions
  slideLeft: {
    initial: { x: 300, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -300, opacity: 0 }
  },
  slideRight: {
    initial: { x: -300, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 300, opacity: 0 }
  },
  slideUp: {
    initial: { y: 300, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -300, opacity: 0 }
  },
  slideDown: {
    initial: { y: -300, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 300, opacity: 0 }
  },

  // Fade transitions
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  fadeScale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.1 }
  },

  // Scale transitions
  scaleUp: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.2, opacity: 0 }
  },
  scaleDown: {
    initial: { scale: 1.2, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 }
  },

  // Rotation transitions
  rotateIn: {
    initial: { rotate: -180, opacity: 0 },
    animate: { rotate: 0, opacity: 1 },
    exit: { rotate: 180, opacity: 0 }
  },

  // Flip transitions
  flipX: {
    initial: { rotateX: 90, opacity: 0 },
    animate: { rotateX: 0, opacity: 1 },
    exit: { rotateX: -90, opacity: 0 }
  },
  flipY: {
    initial: { rotateY: 90, opacity: 0 },
    animate: { rotateY: 0, opacity: 1 },
    exit: { rotateY: -90, opacity: 0 }
  }
};

// Page-specific transition mapping
const pageTransitions: Record<string, keyof typeof transitionVariants> = {
  transport: 'slideLeft',
  stay: 'slideUp',
  food: 'fadeScale',
  culture: 'rotateIn',
  sustainability: 'scaleUp',
  community: 'slideRight',
  aiTools: 'flipX',
  tripPlanner: 'slideDown',
  sos: 'scaleDown',
  shopping: 'flipY',
  settings: 'fade'
};

const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  pageKey, 
  className = '' 
}) => {
  // Get transition type for this page, fallback to fade
  const transitionType = pageTransitions[pageKey] || 'fade';
  const variants = transitionVariants[transitionType];

  const transitionConfig = {
    type: 'tween' as const,
    ease: [0.25, 0.46, 0.45, 0.94] as const, // Custom easing for smooth feel
    duration: 0.4
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={transitionConfig}
        className={`w-full ${className}`}
        style={{
          // Ensure proper layering during transitions
          position: 'relative',
          zIndex: 1
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Stagger animation for child elements
export const StaggerContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className = '', delay = 0.1 }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: delay,
        delayChildren: 0.1
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Individual stagger item
export const StaggerItem: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'tween' as const,
        ease: 'easeOut' as const,
        duration: 0.3
      }
    }
  };

  return (
    <motion.div
      variants={itemVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Hover animations for interactive elements
export const HoverScale: React.FC<{
  children: React.ReactNode;
  className?: string;
  scale?: number;
}> = ({ children, className = '', scale = 1.05 }) => {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: scale * 0.95 }}
      transition={{ type: 'spring' as const, stiffness: 300, damping: 20 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Loading animation
export const LoadingTransition: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ isLoading, children, className = '' }) => {
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`flex items-center justify-center p-8 ${className}`}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full"
          />
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Floating animation for decorative elements
export const FloatingElement: React.FC<{
  children: React.ReactNode;
  className?: string;
  duration?: number;
}> = ({ children, className = '', duration = 3 }) => {
  return (
    <motion.div
      animate={{
        y: [-10, 10, -10],
        rotate: [-1, 1, -1]
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
