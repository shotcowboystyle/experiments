import type { Variants } from 'motion/react';
import { motion, useReducedMotion } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { Fragment, useState } from 'react';

import './staggered-text.css';

export interface StaggeredTextProps extends HTMLAttributes<HTMLElement> {
  /** The text that rolls, letter by letter. */
  text: string;
  /** The element the text renders as. @default "h3" */
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

// `custom` is how many letters away from the pointer this one sits, so the
// roll spreads outward from wherever you land and settles back faster.
const roll: Variants = {
  rest: (distance: number) => ({
    transition: { delay: distance * 0.02, duration: 0.3, ease: 'easeInOut' },
    y: 0,
  }),
  rolled: (distance: number) => ({
    transition: { delay: distance * 0.04, duration: 0.4, ease: 'easeInOut' },
    y: '-100%',
  }),
};

const segmenter = new Intl.Segmenter();

export const StaggeredText = ({ text, as: Tag = 'h3', className, ...props }: StaggeredTextProps) => {
  const [active, setActive] = useState<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  // Split on graphemes, not code units, so emoji and accents stay whole. Words
  // are kept unbreakable so the line wraps between them, never mid-word; the
  // running index skips over each space so distances span the whole line.
  let index = 0;
  const words = text.split(' ').map((word) => {
    const letters = Array.from(segmenter.segment(word), ({ segment }, n) => ({ char: segment, i: index + n }));
    index += letters.length + 1;
    return letters;
  });

  return (
    <Tag
      className={className ? `staggered-text ${className}` : 'staggered-text'}
      onPointerLeave={() => setActive(null)}
      {...props}
    >
      <span s-sr-only="">{text}</span>
      <span aria-hidden>
        {words.map((letters, w) => (
          <Fragment key={w}>
            {w > 0 && ' '}
            <span className="staggered-text-word">
              {letters.map(({ char, i }) => (
                <span
                  className="staggered-text-letter"
                  key={i}
                  // Reduced motion keeps the text and drops the roll.
                  onPointerEnter={shouldReduceMotion ? undefined : () => setActive(i)}
                >
                  <motion.span
                    animate={active === null ? 'rest' : 'rolled'}
                    className="staggered-text-roll"
                    custom={Math.abs((active ?? i) - i)}
                    initial={false}
                    variants={roll}
                  >
                    {char}
                    <span className="staggered-text-copy">{char}</span>
                  </motion.span>
                </span>
              ))}
            </span>
          </Fragment>
        ))}
      </span>
    </Tag>
  );
};
