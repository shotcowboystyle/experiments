import { ChevronLeft, Share2 } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';

import './split-button.css';

export interface SplitButtonItem {
  /** Stable value passed to `onValueSelect` when the item is chosen. */
  value: string;
  /** Content displayed inside the choice button. */
  label: ReactNode;
  /** Whether the choice is unavailable. @default false */
  disabled?: boolean;
}

export interface SplitButtonProps {
  /** Short choices revealed when the action expands. */
  items: SplitButtonItem[];
  /** Content displayed inside the collapsed trigger. */
  trigger: ReactNode;
  /** Optional icon displayed before the trigger content. */
  triggerIcon?: ReactNode;
  /** Controlled expanded state. */
  open?: boolean;
  /** Initial expanded state for uncontrolled usage. @default false */
  defaultOpen?: boolean;
  /** Called whenever the expanded state changes. */
  onOpenChange?: (open: boolean) => void;
  /** Called with the selected item value before the action collapses. */
  onValueSelect?: (value: string) => void;
  /** Accessible label for the control that returns to the trigger. @default "Back" */
  backLabel?: string;
  /** Whether the trigger and choices are unavailable. @default false */
  disabled?: boolean;
  className?: string;
}

const widthSpring = {
  damping: 48,
  mass: 0.9,
  stiffness: 260,
  type: 'spring' as const,
};

// Tracks the content's width so the surface can spring to it.
const useMeasureWidth = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    if (!ref.current) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => setWidth(entry.borderBoxSize[0].inlineSize));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
};

export const SplitButton = ({
  items,
  trigger,
  triggerIcon,
  open,
  defaultOpen = false,
  onOpenChange,
  onValueSelect,
  backLabel = 'Back',
  disabled = false,
  className,
}: SplitButtonProps) => {
  const [contentRef, contentWidth] = useMeasureWidth();
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [isAnimating, setIsAnimating] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const isOpen = open ?? internalOpen;
  const previousIsOpen = useRef(isOpen);
  // Only a toggle from inside moves focus; a controlled change from outside leaves it alone.
  const shouldFocus = useRef(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const hasEnabledItem = items.some((item) => !item.disabled);

  const setOpen = (nextOpen: boolean) => {
    shouldFocus.current = true;
    if (open === undefined) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  // The content swaps before the width catches up, so clip the overflow from
  // the first frame rather than waiting for Motion's onAnimationStart.
  useLayoutEffect(() => {
    if (previousIsOpen.current === isOpen) {
      return;
    }
    previousIsOpen.current = isOpen;
    setIsAnimating(true);

    // The pressed button unmounts with the swap; hand focus to its counterpart.
    if (shouldFocus.current) {
      shouldFocus.current = false;
      (isOpen ? backRef : triggerRef).current?.focus();
    }
  }, [isOpen]);

  return (
    <motion.div
      animate={contentWidth ? { width: contentWidth } : undefined}
      className={className ? `split-button ${className}` : 'split-button'}
      data-animating={isAnimating || undefined}
      initial={false}
      onAnimationComplete={() => setIsAnimating(false)}
      onAnimationStart={() => setIsAnimating(true)}
      transition={shouldReduceMotion ? { duration: 0 } : widthSpring}
    >
      <div
        className="split-button-content"
        data-open={isOpen || undefined}
        ref={contentRef}
      >
        {isOpen ? (
          <div
            className="split-button-choices"
            onKeyDown={(event) => event.key === 'Escape' && setOpen(false)}
          >
            <button
              aria-label={backLabel}
              className="split-button-back"
              disabled={disabled}
              onClick={() => setOpen(false)}
              ref={backRef}
              type="button"
            >
              <ChevronLeft
                aria-hidden
                size={16}
                strokeWidth={1.75}
              />
            </button>
            <span
              aria-hidden
              className="split-button-divider"
            />
            {items.map((item) => (
              <button
                className="split-button-option"
                disabled={disabled || item.disabled}
                key={item.value}
                onClick={() => {
                  onValueSelect?.(item.value);
                  setOpen(false);
                }}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : (
          <button
            className="split-button-trigger"
            disabled={disabled || !hasEnabledItem}
            onClick={() => setOpen(true)}
            ref={triggerRef}
            type="button"
          >
            {triggerIcon && (
              <span
                aria-hidden
                className="split-button-icon"
              >
                {triggerIcon}
              </span>
            )}
            {trigger}
          </button>
        )}
      </div>
    </motion.div>
  );
};

/** Islands can't take icons or callbacks as props, so the demo wires them here. */
export const SplitButtonDemo = () => (
  <SplitButton
    items={[
      { label: 'Copy link', value: 'link' },
      { label: 'Email', value: 'email' },
      { label: 'Message', value: 'message' },
      { disabled: true, label: 'Embed', value: 'embed' },
    ]}
    trigger="Share"
    triggerIcon={
      <Share2
        size={16}
        strokeWidth={1.75}
      />
    }
  />
);
