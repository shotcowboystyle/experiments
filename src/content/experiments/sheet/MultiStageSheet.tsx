'use client';

import { AlertTriangle, BanIcon, GripIcon, Eye, EyeOffIcon, ScanFaceIcon, Lock, ShieldIcon, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type React from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
import { Drawer } from 'vaul';

import { Button } from '~/components/ui/Button';

import './sheet.css';

interface MultiStageSheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

type Stage = 'default' | 'phrase' | 'key' | 'remove';

const STAGE_COPY: Record<Stage, { title: string; description: string }> = {
  default: {
    description: 'View your private key or recovery phrase, or remove the wallet.',
    title: 'Wallet options',
  },
  key: {
    description: 'Reveal the key used to access this wallet.',
    title: 'Private Key',
  },
  phrase: {
    description: 'Reveal the phrase used to back up this wallet.',
    title: 'Secret Recovery Phrase',
  },
  remove: {
    description: 'Confirm that you want to remove this wallet.',
    title: 'Remove wallet',
  },
};

// Custom hook to measure element height
const useMeasure = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    if (ref.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setHeight(entry.contentRect.height);
        }
      });

      resizeObserver.observe(ref.current);
      setHeight(ref.current.getBoundingClientRect().height);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []);

  return [ref, height] as const;
};

// Animation variants matching Vaul's style
const contentVariants = {
  // Exits are shorter than enters, whichever stage is leaving.
  hidden: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: 0.15, ease: 'easeOut' as const },
  },
  initial: {
    opacity: 0,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
  },
};

export const MultiStageSheet = ({
  open: controlledOpen,
  onOpenChange,
  trigger = <Button>Wallet options</Button>,
}: MultiStageSheetProps) => {
  const [stage, setStage] = useState<Stage>('default');
  const [localOpen, setLocalOpen] = useState(false);
  const [contentRef, contentHeight] = useMeasure();
  const shouldReduceMotion = useReducedMotion();

  // Use controlled open if provided, otherwise use local state
  const isOpen = controlledOpen ?? localOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setLocalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  // Reset once Vaul's close has finished, not on a timer that fires mid-slide.
  const handleAnimationEnd = (open: boolean) => {
    if (!open) {
      setStage('default');
    }
  };

  // Calculate height based on stage
  const getHeight = () => {
    switch (stage) {
      case 'default': {
        return 290;
      }
      case 'remove': {
        return 312;
      }
      case 'phrase': {
        return 465;
      }
      case 'key': {
        return 441;
      }
      default: {
        return contentHeight || 500;
      }
    }
  };

  const handleStageChange = (newStage: Stage) => {
    setStage(newStage);
  };

  const resizeTransition = shouldReduceMotion
    ? { duration: 0 }
    : {
        duration: 0.27,
        ease: [0.25, 1, 0.5, 1] as [number, number, number, number],
      };

  const stageTransition = (duration: number) =>
    shouldReduceMotion
      ? { duration: 0 }
      : {
          duration,
          ease: 'easeOut' as const,
        };

  return (
    <Drawer.Root
      modal={true}
      onAnimationEnd={handleAnimationEnd}
      onOpenChange={handleOpenChange}
      open={isOpen}
    >
      <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>

      <Drawer.Portal>
        <Drawer.Overlay className="sheet-overlay" />
        <Drawer.Content asChild>
          {/* The height is hard-coded per stage rather than measured: animating
              to a height read back after render shows a jump on the first
              frame. `contentHeight` is only the fallback. */}
          <motion.div
            animate={{ height: getHeight(), transition: resizeTransition }}
            className="sheet"
            initial={false}
          >
            <Drawer.Title s-sr-only="">{STAGE_COPY[stage].title}</Drawer.Title>
            <Drawer.Description s-sr-only="">{STAGE_COPY[stage].description}</Drawer.Description>

            <div
              className="sheet-body"
              ref={contentRef}
            >
              {/* Close button. Nudged with a transform rather than top/right so
                  the move stays off the layout path. */}
              <Drawer.Close asChild>
                <motion.button
                  animate={{
                    x: stage === 'default' ? 0 : -4,
                    y: stage === 'default' ? 0 : 4,
                  }}
                  aria-label="Close"
                  className="sheet-close"
                  initial={false}
                  transition={resizeTransition}
                  type="button"
                >
                  <X
                    aria-hidden
                    size={16}
                  />
                </motion.button>
              </Drawer.Close>

              {/* Content with smooth opacity/scale transitions */}
              <AnimatePresence
                initial={false}
                mode="popLayout"
              >
                {stage === 'default' && (
                  <motion.div
                    animate="visible"
                    exit="hidden"
                    initial="initial"
                    key="default"
                    transition={stageTransition(0.22)}
                    variants={contentVariants}
                  >
                    <header className="sheet-menu-header">
                      <h2 className="sheet-menu-title">Options</h2>
                    </header>

                    <div className="sheet-menu">
                      <button
                        className="sheet-row"
                        onClick={() => handleStageChange('key')}
                        type="button"
                      >
                        <Lock
                          aria-hidden
                          size={20}
                        />
                        View Private Key
                      </button>

                      <button
                        className="sheet-row"
                        onClick={() => handleStageChange('phrase')}
                        type="button"
                      >
                        <GripIcon
                          aria-hidden
                          size={20}
                        />
                        View Recovery Phrase
                      </button>

                      <button
                        className="sheet-row sheet-row-danger"
                        onClick={() => handleStageChange('remove')}
                        type="button"
                      >
                        <AlertTriangle
                          aria-hidden
                          size={20}
                        />
                        Remove Wallet
                      </button>
                    </div>
                  </motion.div>
                )}

                {stage === 'phrase' && (
                  <motion.div
                    animate="visible"
                    exit="hidden"
                    initial="initial"
                    key="phrase"
                    transition={stageTransition(0.27)}
                    variants={contentVariants}
                  >
                    <div className="sheet-detail">
                      <header className="sheet-detail-header">
                        <div className="sheet-hero-icon">
                          <Eye
                            aria-hidden
                            size={48}
                          />
                        </div>
                        <h2 className="sheet-title">Secret Recovery Phrase</h2>
                        <p className="sheet-text">
                          Your Secret Recovery Phrase is the key used to back up your wallet. Keep it secret at all
                          times.
                        </p>
                      </header>

                      <ul className="sheet-list">
                        <li>
                          <ShieldIcon
                            aria-hidden
                            size={18}
                          />
                          Keep your Secret Phrase safe
                        </li>

                        <li>
                          <EyeOffIcon
                            aria-hidden
                            size={18}
                          />
                          Don't share it with anyone else
                        </li>

                        <li>
                          <BanIcon
                            aria-hidden
                            size={18}
                          />
                          If you lose it, we can't recover it
                        </li>
                      </ul>
                    </div>

                    <div className="sheet-actions">
                      <button
                        className="sheet-pill"
                        onClick={() => handleStageChange('default')}
                        type="button"
                      >
                        Cancel
                      </button>

                      <button
                        className="sheet-pill sheet-pill-primary"
                        type="button"
                      >
                        <ScanFaceIcon
                          aria-hidden
                          size={20}
                        />
                        Reveal
                      </button>
                    </div>
                  </motion.div>
                )}

                {stage === 'key' && (
                  <motion.div
                    animate="visible"
                    exit="hidden"
                    initial="initial"
                    key="key"
                    transition={stageTransition(0.27)}
                    variants={contentVariants}
                  >
                    <div className="sheet-detail">
                      <header className="sheet-detail-header">
                        <div className="sheet-hero-icon">
                          <Lock
                            aria-hidden
                            size={48}
                          />
                        </div>
                        <h2 className="sheet-title">Private Key</h2>
                        <p className="sheet-text">
                          Your Private Key is used to access your wallet. Never share it with anyone.
                        </p>
                      </header>

                      <ul className="sheet-list">
                        <li>
                          <ShieldIcon
                            aria-hidden
                            size={18}
                          />
                          Keep your private key secure
                        </li>
                        <li>
                          <Lock
                            aria-hidden
                            size={18}
                          />
                          Never share it online
                        </li>
                        <li>
                          <BanIcon
                            aria-hidden
                            size={18}
                          />
                          Store it in a safe place
                        </li>
                      </ul>
                    </div>

                    <div className="sheet-actions">
                      <button
                        className="sheet-pill"
                        onClick={() => handleStageChange('default')}
                        type="button"
                      >
                        Cancel
                      </button>
                      <button
                        className="sheet-pill sheet-pill-primary"
                        type="button"
                      >
                        <Eye
                          aria-hidden
                          size={20}
                        />
                        View Key
                      </button>
                    </div>
                  </motion.div>
                )}

                {stage === 'remove' && (
                  <motion.div
                    animate="visible"
                    exit="hidden"
                    initial="initial"
                    key="remove"
                    transition={stageTransition(0.15)}
                    variants={contentVariants}
                  >
                    <div className="sheet-detail">
                      <header className="sheet-detail-header sheet-detail-header-plain">
                        <div className="sheet-hero-icon">
                          <div className="sheet-danger-badge">
                            <AlertTriangle
                              aria-hidden
                              size={24}
                            />
                          </div>
                        </div>
                        <h2 className="sheet-title sheet-center">Are you sure?</h2>
                      </header>
                      <p className="sheet-text sheet-center">
                        You haven't backed up your wallet yet. If you remove it, you could lose access forever.
                      </p>
                    </div>

                    <div className="sheet-actions">
                      <button
                        className="sheet-pill"
                        onClick={() => handleStageChange('default')}
                        type="button"
                      >
                        Cancel
                      </button>
                      <button
                        className="sheet-pill sheet-pill-danger"
                        type="button"
                      >
                        Continue
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
