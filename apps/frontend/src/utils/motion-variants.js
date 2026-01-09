/**
 * Standardized animation variants for Motion v12 (motion.dev)
 * Tuned for Apple HIG "Butter Smooth" feel (Spring Physics)
 */

const appleSpring = { type: "spring", stiffness: 300, damping: 30, mass: 1 };

export const panelVariants = {
  // Left Sidebar
  left: {
    initial: { x: "-100%", opacity: 0 },
    animate: {
      x: 0,
      opacity: 1,
      transition: appleSpring,
    },
    exit: {
      x: "-100%",
      opacity: 0,
      transition: { ...appleSpring, stiffness: 400, damping: 40 },
    },
  },
  // Right Sidebar
  right: {
    initial: { x: "100%", opacity: 0 },
    animate: {
      x: 0,
      opacity: 1,
      transition: appleSpring,
    },
    exit: {
      x: "100%",
      opacity: 0,
      transition: { ...appleSpring, stiffness: 400, damping: 40 },
    },
  },
};

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const itemVariants = {
  hidden: { y: 10, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 500, damping: 30 },
  },
};

export const tabVariants = {
  initial: { scale: 0.95, opacity: 0, y: 5 },
  animate: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 500, damping: 30 },
  },
  exit: { scale: 0.95, opacity: 0, y: 5, transition: { duration: 0.1 } },
};

export const pageVariants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 200, damping: 20, mass: 1 },
  },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } },
};
