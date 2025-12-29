/**
 * Standardized animation variants for Motion v12 (motion.dev)
 */

export const panelVariants = {
    // Left Sidebar
    left: {
        initial: { x: "-100%", opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: "-100%", opacity: 0 },
        transition: { type: "spring", damping: 25, stiffness: 200 }
    },
    // Right Sidebar
    right: {
        initial: { x: "100%", opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: "100%", opacity: 0 },
        transition: { type: "spring", damping: 25, stiffness: 200 }
    }
};

export const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

export const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1 }
};

export const tabVariants = {
    initial: { scale: 0.9, opacity: 0, y: 5 },
    animate: { scale: 1, opacity: 1, y: 0 },
    exit: { scale: 0.9, opacity: 0, y: 5 },
    transition: { duration: 0.2 }
};
