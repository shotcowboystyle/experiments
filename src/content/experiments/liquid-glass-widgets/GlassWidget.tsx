import { MotionConfig, motion } from 'motion/react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import './glass-widget.css';

export type Tone = 'cyan' | 'purple' | 'blue' | 'pink' | 'green' | 'amber' | 'red';

export interface GlassWidgetProps {
  children: ReactNode;
  /** Extra class on the glass card, for the widget's own layout. */
  className?: string;
  /** Inner padding step. @default "md" */
  size?: 'sm' | 'md' | 'lg';
  /** Hue of the bloom behind the glass, and of the widget's accents. @default "cyan" */
  tone?: Tone;
}

// `visualDuration` settles the spring in a set time whatever its bounce, so
// the entrance and the hover lift read as one family.
const variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  hover: { transition: { bounce: 0.4, type: 'spring', visualDuration: 0.3 }, y: -2 },
  visible: { opacity: 1, scale: 1, transition: { bounce: 0.2, type: 'spring', visualDuration: 0.4 }, y: 0 },
} as const;

/** A frosted card over a breathing bloom. Every widget in this experiment is one. */
export const GlassWidget = ({ children, className, size = 'md', tone = 'cyan' }: GlassWidgetProps) => (
  // "user" drops the lift and the slide-in under reduced motion; the fade stays.
  <MotionConfig reducedMotion="user">
    <motion.div
      animate="visible"
      className="glass"
      data-tone={tone}
      initial="hidden"
      variants={variants}
      whileHover="hover"
    >
      <div
        aria-hidden
        className="glass-glow"
      />
      <div
        className={className ? `glass-card ${className}` : 'glass-card'}
        data-size={size}
      >
        {children}
      </div>
    </motion.div>
  </MotionConfig>
);

/**
 * The current time, re-read every `interval` ms. `undefined` until mounted,
 * so the server never bakes its own clock into the HTML.
 */
export const useNow = (interval = 1000) => {
  const [now, setNow] = useState<Date>();
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), interval);
    return () => clearInterval(id);
  }, [interval]);
  return now;
};

/** Stand-in block while a clock-driven widget waits for `useNow`. */
export const Skeleton = ({ height }: { height: string }) => (
  <div
    className="glass-skeleton"
    style={{ blockSize: height }}
  />
);
