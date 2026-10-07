import type { MotionStyle, MotionValue, TargetAndTransition, Transition } from 'motion/react';
import { motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';

import './siri-orb.css';

export type AIState = 'idle' | 'listening' | 'thinking' | 'streaming' | 'done' | 'error';

export interface StateMotion {
  /** Outer bloom strength, 0–1. */
  glow: number;
  /** Palette hue rotation in degrees. Small shifts read as a mood change. */
  hueRotate: number;
  /** Overall energy, 0–1. Drives simulated amplitude. */
  intensity: number;
  /** How much amplitude reaches the surface, 0 = ignore it. */
  reactivity: number;
  /** Chroma multiplier. Below 1 desaturates. */
  saturation: number;
  /** Resting scale, 1 = no change. */
  scale: number;
  /** Ambient loop speed multiplier, 1 = base tempo. */
  speed: number;
}

// `thinking` keeps scale 1: internal churn only, so the layout around it stays
// calm. `error` desaturates rather than grows, so it reads as a change of
// state, not a grab for attention. `done` overshoots once.
export const STATE_MOTION: Record<AIState, StateMotion> = {
  done: { glow: 0.7, hueRotate: 0, intensity: 0.4, reactivity: 0, saturation: 1, scale: 1.1, speed: 0.8 },
  error: { glow: 0.25, hueRotate: 0, intensity: 0.5, reactivity: 0, saturation: 0.3, scale: 0.96, speed: 1 },
  idle: { glow: 0.15, hueRotate: 0, intensity: 0.3, reactivity: 0, saturation: 0.75, scale: 0.94, speed: 0.6 },
  listening: { glow: 0.6, hueRotate: 0, intensity: 0.75, reactivity: 1, saturation: 1.05, scale: 1.06, speed: 1 },
  streaming: { glow: 0.45, hueRotate: -10, intensity: 0.6, reactivity: 0.6, saturation: 1, scale: 1.02, speed: 1.4 },
  thinking: { glow: 0.35, hueRotate: 18, intensity: 1, reactivity: 0.15, saturation: 1, scale: 1, speed: 2.4 },
};

export interface OrbColors {
  bg: string;
  c1: string;
  c2: string;
  c3: string;
  /** Fourth mesh stop. More stops means fewer visible repeats per rotation. */
  c4: string;
}

// Chroma near 0.2: lower washes out once the mesh is blurred and the dot
// pattern laid over it.
export const DEFAULT_COLORS: OrbColors = {
  bg: 'oklch(92% 0.03 300)',
  c1: 'oklch(68% 0.21 350)',
  c2: 'oklch(70% 0.18 210)',
  c3: 'oklch(66% 0.2 285)',
  c4: 'oklch(72% 0.19 325)',
};

export interface SiriOrbProps {
  /** Live level, 0–1. A motion value, so a 60fps signal never re-renders React. */
  amplitude?: MotionValue<number>;
  /** Mesh rotation period in seconds, before the state's speed divides it. @default 20 */
  animationDuration?: number;
  className?: string;
  colors?: Partial<OrbColors>;
  /** Diameter in px. @default 192 */
  size?: number;
  /** Drives speed, scale, saturation and how much amplitude gets through. @default "idle" */
  state?: AIState;
}

const easeInOut = [0.645, 0.045, 0.355, 1] as const;
const spring: Transition = { bounce: 0.1, duration: 0.25, type: 'spring' };

// Small orbs get proportionally less blur, contrast, dot and shadow, and a
// tighter dot mask, or the mesh turns to mud and the centre goes dark.
const materialFor = (size: number) => {
  const small = size < 50;
  const contrast = Math.max(size * (small ? 0.004 : 0.008), small ? 1.2 : 1.5);
  let finalContrast = contrast;
  let maskRadius = '25%';
  if (size < 30) {
    finalContrast = 1.1;
    maskRadius = '0%';
  } else if (small) {
    finalContrast = Math.max(contrast * 1.2, 1.3);
    maskRadius = '5%';
  } else if (size < 100) {
    maskRadius = '15%';
  }
  return {
    blur: Math.max(size * (small ? 0.008 : 0.015), small ? 1 : 4),
    contrast: finalContrast,
    dot: Math.max(size * (small ? 0.004 : 0.008), small ? 0.05 : 0.1),
    mask: maskRadius === '0%' ? 'none' : `radial-gradient(black ${maskRadius}, transparent 75%)`,
    shadow: Math.max(size * (small ? 0.004 : 0.008), small ? 0.5 : 2),
  };
};

export const SiriOrb = ({
  amplitude,
  animationDuration = 20,
  className,
  colors,
  size = 192,
  state = 'idle',
}: SiriOrbProps) => {
  const shouldReduceMotion = useReducedMotion();
  const silence = useMotionValue(0);
  const level = amplitude ?? silence;
  const preset = STATE_MOTION[state];
  const palette = { ...DEFAULT_COLORS, ...colors };
  const material = materialFor(size);

  // Gated per state: `thinking` barely listens, so it keeps churning
  // internally instead of throbbing with room noise.
  const reactivity = shouldReduceMotion ? 0 : preset.reactivity;
  // Loud input tightens the blur, which reads as the orb focusing.
  const blur = useTransform(level, (l) => `${material.blur * (1 - l * reactivity * 0.45)}px`);
  // Amplitude adds at most 12% on top of the state's resting scale.
  const scale = useTransform(level, (l) => preset.scale + l * reactivity * 0.12);

  let animate: TargetAndTransition = { scale: 1, x: 0 };
  let transition: Transition = spring;
  if (shouldReduceMotion) {
    transition = { duration: 0 };
  } else if (state === 'error') {
    // One lateral nudge, well under 200ms.
    animate = { scale: 1, x: [0, -3, 3, 0] };
    transition = { duration: 0.18, ease: easeInOut };
  } else if (state === 'idle') {
    // A slow, shallow breath that never draws attention.
    animate = { scale: [1, 1.035, 1], x: 0 };
    transition = { duration: 5.5, ease: easeInOut, repeat: Number.POSITIVE_INFINITY };
  }

  return (
    // The disc clips its own overflow, so the bloom lives in this wrapper.
    <motion.div
      animate={animate}
      className={className ? `siri-orb ${className}` : 'siri-orb'}
      style={{ '--orb-size': `${size}px`, height: size, width: size } as MotionStyle}
      transition={transition}
    >
      <motion.div
        animate={{ opacity: preset.glow * 0.7 }}
        className="siri-orb-glow"
        // The bloom stays in the orb's own palette rather than a status colour.
        style={{ '--orb-glow': palette.c2 } as MotionStyle}
        transition={shouldReduceMotion ? { duration: 0 } : spring}
      />
      <motion.div
        className="siri-orb-disc"
        style={
          {
            '--bg': palette.bg,
            '--blur-amount': blur,
            '--c1': palette.c1,
            '--c2': palette.c2,
            '--c3': palette.c3,
            '--c4': palette.c4,
            '--contrast-amount': material.contrast,
            '--dot-mask': material.mask,
            '--dot-size': `${material.dot}px`,
            // The sheen drifts slower than the mesh turns, and doesn't match
            // it as the state speeds up, which would look mechanical.
            '--drift-duration': `${(12 / (1 + preset.speed)) * 2}s`,
            '--rim': `${Math.max(size * 0.06, 1.5)}px`,
            '--rotate-duration': `${shouldReduceMotion ? animationDuration : animationDuration / preset.speed}s`,
            '--shadow-spread': `${material.shadow}px`,
            // Only the disc, so a future status accent around it keeps its hue.
            filter: `saturate(${preset.saturation}) hue-rotate(${preset.hueRotate}deg)`,
            scale,
          } as MotionStyle
        }
      >
        <span
          aria-hidden
          className="siri-orb-layer siri-orb-sheen"
        />
        <span
          aria-hidden
          className="siri-orb-layer siri-orb-rim"
        />
      </motion.div>
    </motion.div>
  );
};
