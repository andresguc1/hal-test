/**
 * useMotionVariants — Respeta prefers-reduced-motion en animaciones Framer Motion.
 *
 * La regla CSS global (prefers-reduced-motion: reduce) en index.css sólo suprime
 * animaciones CSS. Este hook asegura que las animaciones JavaScript de Framer Motion
 * también se reduzcan cuando el usuario lo ha solicitado en su SO.
 *
 * @param {object} full    - Variantes normales de Framer Motion (con x, y, scale, etc.)
 * @param {object} [reduced] - Variantes reducidas. Por defecto: sólo opacity.
 * @returns {object} Las variantes apropiadas según la preferencia del usuario.
 *
 * @example
 * const variants = useMotionVariants(
 *   { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } },
 *   { hidden: { opacity: 0 },        show: { opacity: 1 } }
 * );
 * <motion.div variants={variants} initial="hidden" animate="show" />
 */
import { useReducedMotion } from "framer-motion";

const OPACITY_ONLY_DEFAULTS = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
  exit: { opacity: 0 },
};

export function useMotionVariants(full, reduced) {
  const shouldReduce = useReducedMotion();
  return shouldReduce ? (reduced ?? OPACITY_ONLY_DEFAULTS) : full;
}

/**
 * useMotionTransition — Devuelve una duración de transición respetando
 * prefers-reduced-motion (0ms si el usuario prefiere sin movimiento).
 *
 * @param {number} durationMs - Duración en milisegundos para el caso normal.
 * @returns {object} Objeto de transición Framer Motion { duration, ease }
 */
export function useMotionTransition(durationMs = 300) {
  const shouldReduce = useReducedMotion();
  return {
    duration: shouldReduce ? 0 : durationMs / 1000,
    ease: "easeOut",
  };
}
