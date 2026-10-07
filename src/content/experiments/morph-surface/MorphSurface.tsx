import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useId, useRef, useState } from 'react';

import { Button } from '~/components/ui/Button';

import { SiriOrb } from '../siri-orb/SiriOrb';

import './morph-surface.css';

const DOCK_HEIGHT = 44;
const PANEL_HEIGHT = 200;
const SENT_DURATION = 1500;
const ORB_COLORS = { bg: 'oklch(22.64% 0 0)' };

const spring = { damping: 45, mass: 0.7, stiffness: 550, type: 'spring' as const };
const fade = { duration: 0.2 };

export const MorphSurface = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const refocusRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const id = useId();

  // Closing from inside the panel hands focus back to the trigger, but only
  // once the dock is no longer inert. A click outside leaves focus wherever
  // the click put it.
  const close = (refocus: boolean) => {
    refocusRef.current = refocus;
    setOpen(false);
  };

  useEffect(() => {
    if (!open && refocusRef.current) {
      refocusRef.current = false;
      triggerRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        close(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!sent) {
      return;
    }
    const timer = setTimeout(() => setSent(false), SENT_DURATION);
    return () => clearTimeout(timer);
  }, [sent]);

  return (
    <div className="morph-surface">
      <motion.div
        animate={{
          borderRadius: open ? 14 : 20,
          height: open ? PANEL_HEIGHT : DOCK_HEIGHT,
          width: open ? '100%' : 'auto',
        }}
        className="morph-surface-body"
        initial={false}
        ref={rootRef}
        // Closing waits a beat so the panel content fades before the shape
        // starts collapsing around it.
        transition={shouldReduceMotion ? { duration: 0 } : { ...spring, delay: open ? 0 : 0.08 }}
      >
        <footer
          className="morph-surface-dock"
          inert={open}
        >
          <span className="morph-surface-orb-slot">
            <AnimatePresence initial={false}>
              {open ? null : (
                <motion.span
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  initial={{ opacity: 0 }}
                  transition={fade}
                >
                  {/* Shows `done` for a moment after sending: the orb is the
                      confirmation. */}
                  <SiriOrb
                    colors={ORB_COLORS}
                    size={24}
                    state={sent ? 'done' : 'idle'}
                  />
                </motion.span>
              )}
            </AnimatePresence>
          </span>
          <Button
            aria-controls={id}
            aria-expanded={open}
            onClick={() => setOpen(true)}
            ref={triggerRef}
            size="sm"
            variant="ghost"
          >
            Ask AI
          </Button>
        </footer>

        <form
          className="morph-surface-panel"
          id={id}
          inert={!open}
          onSubmit={(event) => {
            event.preventDefault();
            setSent(true);
            close(true);
          }}
        >
          <AnimatePresence>
            {open ? (
              <motion.div
                animate={{ opacity: 1 }}
                className="morph-surface-panel-inner"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                transition={shouldReduceMotion ? { duration: 0 } : spring}
              >
                <div className="morph-surface-header">
                  <label htmlFor={`${id}-message`}>
                    <SiriOrb
                      colors={ORB_COLORS}
                      size={24}
                    />
                    AI Input
                  </label>
                  <Button
                    aria-label="Send"
                    size="sm"
                    type="submit"
                    variant="ghost"
                  >
                    <kbd>⌘</kbd>
                    <kbd>Enter</kbd>
                  </Button>
                </div>
                <textarea
                  // Mounted only when the panel opens, so autofocus lands on
                  // open without a timer. Fine here: the user just asked for this panel.
                  autoFocus
                  className="morph-surface-field"
                  id={`${id}-message`}
                  name="message"
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      close(true);
                    }
                    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  placeholder="Ask me anything…"
                  required
                  spellCheck={false}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </form>
      </motion.div>
      <span
        aria-live="polite"
        s-sr-only=""
      >
        {sent ? 'Sent' : ''}
      </span>
    </div>
  );
};
