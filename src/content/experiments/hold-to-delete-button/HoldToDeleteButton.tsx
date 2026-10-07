import { Check, Trash2 } from 'lucide-react';
import { animate, motion, useAnimationControls, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import './hold-to-delete-button.css';

export interface HoldToDeleteButtonProps {
  /** Text displayed inside the button. @default "Hold to delete" */
  label?: string;
  /** Milliseconds the user must hold before the action triggers. @default 2000 */
  holdDuration?: number;
  /** Milliseconds the success state shows before resetting. @default 1200 */
  successDuration?: number;
  /** Called once when the hold completes. */
  onDelete?: () => void;
  /** Whether the button ignores interaction. @default false */
  disabled?: boolean;
  className?: string;
}

type HoldState = 'idle' | 'holding' | 'done';

const easeOut = [0.23, 1, 0.32, 1] as const;
const drainSpring = { bounce: 0, duration: 0.3, type: 'spring' as const };
const rest = { rotate: 0, scale: 1, x: 0 };

// A release past halfway earns the bigger shake: you nearly did it.
const bigShake = {
  rotate: [0, -1.2, 1, -0.6, 0.3, 0],
  scale: [1, 0.985, 0.99, 0.995, 1, 1],
  x: [0, -7, 6, -4, 2, 0],
};
const smallShake = {
  rotate: 0,
  scale: [1, 0.99, 0.995, 1],
  x: [0, -3, 3, 0],
};

export const HoldToDeleteButton = ({
  label = 'Hold to delete',
  holdDuration = 2000,
  successDuration = 1200,
  onDelete,
  disabled = false,
  className,
}: HoldToDeleteButtonProps) => {
  const [state, setState] = useState<HoldState>('idle');
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef(0);
  const controls = useAnimationControls();
  const progress = useMotionValue(0);
  const shouldReduceMotion = useReducedMotion();
  const clipPath = useTransform(progress, (value) => `inset(0 ${100 - value * 100}% 0 0)`);

  const startHold = () => {
    if (disabled || state !== 'idle') {
      return;
    }
    startedAtRef.current = performance.now();
    setState('holding');
    controls.start({ scale: shouldReduceMotion ? 1 : 0.97 }, { duration: 0.12, ease: easeOut });
    animate(progress, 1, { duration: holdDuration / 1000, ease: 'linear' });
    holdTimerRef.current = setTimeout(() => {
      holdTimerRef.current = null;
      setState('done');
      controls.start(rest, { duration: 0.16, ease: easeOut });
      progress.set(1);
      onDelete?.();
    }, holdDuration);
  };

  const cancelHold = () => {
    if (!holdTimerRef.current) {
      return;
    }
    const heldRatio = Math.min((performance.now() - startedAtRef.current) / holdDuration, 1);
    clearTimeout(holdTimerRef.current);
    holdTimerRef.current = null;
    setState('idle');
    animate(progress, 0, drainSpring);

    // A tap barely registers as an attempt, so it gets no shake.
    if (shouldReduceMotion || heldRatio < 0.15) {
      controls.start(rest);
      return;
    }
    const isPastHalfway = heldRatio >= 0.5;
    controls.start(isPastHalfway ? bigShake : smallShake, { duration: isPastHalfway ? 0.38 : 0.24, ease: easeOut });
  };

  useEffect(() => {
    if (state !== 'done') {
      return;
    }
    const timer = setTimeout(() => {
      setState('idle');
      animate(progress, 0, drainSpring);
    }, successDuration);
    return () => clearTimeout(timer);
  }, [state, successDuration, progress]);

  useEffect(
    () => () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
    },
    []
  );

  // Drawn twice: tinted underneath, filled on top and clipped to the progress.
  // Both copies are aria-hidden; the live region below is the accessible name.
  const content = (
    <>
      <span className="hold-delete-icon">
        {state === 'done' ? (
          <Check
            size={16}
            strokeWidth={2.25}
          />
        ) : (
          <Trash2
            size={16}
            strokeWidth={2}
          />
        )}
      </span>
      <span className="hold-delete-labels">
        <span data-for="idle">{label}</span>
        <span data-for="holding">Keep holding</span>
        <span data-for="done">Deleted</span>
      </span>
    </>
  );

  return (
    <motion.button
      animate={controls}
      aria-busy={state === 'holding'}
      className={className ? `hold-delete ${className}` : 'hold-delete'}
      data-state={state}
      disabled={disabled}
      onBlur={cancelHold}
      onKeyDown={(event) => {
        if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
          event.preventDefault();
          startHold();
        }
      }}
      onKeyUp={(event) => {
        if (event.key === ' ' || event.key === 'Enter') {
          cancelHold();
        }
      }}
      onPointerCancel={cancelHold}
      onPointerDown={(event) => {
        // Captured so a finger drifting off the edge doesn't count as letting go.
        event.currentTarget.setPointerCapture(event.pointerId);
        startHold();
      }}
      onPointerLeave={cancelHold}
      onPointerUp={cancelHold}
      type="button"
    >
      <span
        aria-hidden
        className="hold-delete-layer"
      >
        {content}
      </span>
      <motion.span
        aria-hidden
        className="hold-delete-layer hold-delete-fill"
        style={{ clipPath }}
      >
        {content}
      </motion.span>
      <span
        aria-live="polite"
        s-sr-only=""
      >
        {{ done: 'Deleted', holding: 'Keep holding', idle: label }[state]}
      </span>
    </motion.button>
  );
};
