"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  animate,
  type Variants,
} from "motion/react";

// Shared easing curve for a consistent, premium feel across the app.
export const EASE = [0.21, 0.47, 0.32, 0.98] as const;

/** Fades + slides content up once it scrolls into view. */
export function FadeIn({
  children,
  className,
  delay = 0,
  y = 24,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: reduceMotion ? 0 : 0.6, ease: EASE, delay: reduceMotion ? 0 : delay }}
    >
      {children}
    </motion.div>
  );
}

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const staggerChild: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

/** Container that reveals its <StaggerItem> children one after another. */
export function Stagger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={reduceMotion ? undefined : staggerContainer}
      initial={reduceMotion ? false : "hidden"}
      whileInView={reduceMotion ? undefined : "visible"}
      viewport={{ once: true, margin: "-60px" }}
    >
      {children}
    </motion.div>
  );
}

/** A single item inside <Stagger>. Optionally lifts on hover. */
export function StaggerItem({
  children,
  className,
  lift = true,
}: {
  children: React.ReactNode;
  className?: string;
  lift?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={reduceMotion ? undefined : staggerChild}
      whileHover={!reduceMotion && lift ? { y: -6 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Counts up from 0 to `value` when scrolled into view. Styling (gradients,
 * sizes) is passed straight through via `className` to the rendered element.
 */
export function AnimatedCounter({
  value,
  className,
  decimals = 0,
}: {
  value: number;
  className?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    // Nothing to animate: either it is off-screen, or the viewer has asked for
    // reduced motion, in which case the final value is rendered directly below
    // rather than written into state from here.
    if (!inView || reduceMotion) return;
    const controls = animate(0, value, {
      duration: 1,
      ease: "easeOut",
      onUpdate: (v) => setAnimated(v),
    });
    return () => controls.stop();
  }, [inView, value, reduceMotion]);

  // Derived during render instead of synchronised through an effect. With
  // reduced motion there is no count-up at all, so the final value renders
  // immediately; otherwise the animated value carries it (0 until in view).
  const display = reduceMotion ? value : animated;

  return (
    <span ref={ref} className={className}>
      {display.toFixed(decimals)}
    </span>
  );
}
