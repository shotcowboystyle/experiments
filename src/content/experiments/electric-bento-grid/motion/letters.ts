import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

const rnd = gsap.utils.random;
const GLYPHS = '#%&@$!?/\\<>*+=[]{}01█▓▒░';

export interface Headline {
  /** Scatter the letters in from all over the card. */
  scatterIn: (delay: number) => gsap.core.Animation;
  /** Plays one random glitch and returns its length in timeline seconds; 0 before the letters land. */
  glitch: () => number;
  revert: () => void;
}

const isBlank = (c: HTMLElement) => !c.textContent?.trim();

/**
 * Splits a headline into characters and hides them, scattered, ready for
 * `scatterIn`. The split stays for the page's life because the glitch loop
 * keeps addressing single characters.
 */
const spread = () => Math.min(window.innerWidth * 0.35, 360);

export const prepareHeadline = (el: HTMLElement): Headline => {
  const split = SplitText.create(el, { aria: 'auto', smartWrap: true, type: 'chars' });
  const chars = (split.chars as HTMLElement[]).filter((c) => !isBlank(c));
  const busy = new Set<HTMLElement>();
  const running = new Set<gsap.core.Animation>();
  let landed = false;
  let stopped = false;

  gsap.set(chars, {
    autoAlpha: 0,
    rotation: () => rnd(-200, 200),
    scale: () => rnd(0.2, 2.4),
    x: () => rnd(-spread(), spread()),
    y: () => rnd(-spread() * 0.6, spread() * 0.6),
  });

  const track = (anim: gsap.core.Animation, targets: HTMLElement[]) => {
    for (const t of targets) {
      busy.add(t);
    }
    running.add(anim);
    const done = anim.eventCallback('onComplete') as (() => void) | null;
    anim.eventCallback('onComplete', () => {
      for (const t of targets) {
        busy.delete(t);
      }
      running.delete(anim);
      done?.();
    });
    return anim;
  };

  const free = () => chars.filter((c) => !busy.has(c));
  const pick = () => gsap.utils.random(free()) as HTMLElement | undefined;
  const run = (max: number) => {
    const pool = free();
    if (pool.length === 0) {
      return [];
    }
    const start = Math.floor(rnd(0, pool.length - 1));
    return pool.slice(start, start + Math.max(1, Math.round(rnd(2, max))));
  };

  const scramble = () => {
    const c = pick();
    if (!c) {
      return null;
    }
    const original = c.textContent;
    gsap.set(c, { textAlign: 'center', width: c.offsetWidth });
    return track(
      gsap.to(c, {
        duration: rnd(0.3, 0.7),
        ease: 'steps(8)',
        onComplete: () => {
          c.textContent = original;
          gsap.set(c, { clearProps: 'width,textAlign' });
        },
        onUpdate: () => {
          c.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? '#';
        },
      }),
      [c]
    );
  };

  const flip = () => {
    const c = pick();
    if (!c) {
      return null;
    }
    return track(
      gsap.fromTo(
        c,
        { rotationX: 0 },
        { clearProps: 'transform', duration: 0.6, ease: 'steps(10)', rotationX: 360, transformPerspective: 300 }
      ),
      [c]
    );
  };

  const jolt = () => {
    const c = pick();
    if (!c) {
      return null;
    }
    return track(
      gsap
        .timeline()
        .call(() => c.classList.add('ebg-hot'))
        .to(c, { duration: 0.12, ease: 'steps(2)', rotation: rnd(-18, 18), y: '-0.35em' })
        .to(c, { clearProps: 'transform', duration: 0.3, ease: 'steps(4)', rotation: 0, y: 0 })
        .call(() => c.classList.remove('ebg-hot')),
      [c]
    );
  };

  const invert = () => {
    const targets = run(4);
    if (targets.length === 0) {
      return null;
    }
    const toggleInv = () => {
      for (const t of targets) {
        t.classList.toggle('ebg-inv');
      }
    };
    const clearInv = () => {
      for (const t of targets) {
        t.classList.remove('ebg-inv');
      }
    };
    return track(
      gsap
        .timeline({ onComplete: clearInv })
        .call(toggleInv, [], 0)
        .call(toggleInv, [], 0.08)
        .call(toggleInv, [], 0.16)
        .call(clearInv, [], 0.5),
      targets
    );
  };

  const wave = () => {
    const targets = run(7);
    if (targets.length === 0) {
      return null;
    }
    return track(
      gsap.to(targets, {
        clearProps: 'transform',
        duration: 0.5,
        keyframes: { easeEach: 'steps(2)', y: [0, '-0.3em', '0.12em', 0] },
        stagger: 0.05,
      }),
      targets
    );
  };

  const hop = () => {
    const targets = run(3);
    if (targets.length === 0) {
      return null;
    }
    return track(
      gsap
        .timeline()
        .to(targets, {
          duration: 0.18,
          ease: 'power3.out',
          rotation: () => rnd(-90, 90),
          x: () => rnd(-40, 40),
          y: () => rnd(-50, 30),
        })
        .to(targets, { clearProps: 'transform', duration: 0.5, ease: 'back.out(3)', rotation: 0, x: 0, y: 0 }),
      targets
    );
  };

  /** Knocks the second ink plate out of register, then lets the stylesheet's offset return. */
  const misregister = () =>
    track(
      gsap
        .timeline()
        .set(el, { '--ebg-mis': `${rnd(-10, 10)}px`, '--ebg-mis-y': `${rnd(-6, 6)}px` })
        .set(el, { '--ebg-mis': `${rnd(-6, 6)}px`, '--ebg-mis-y': `${rnd(-4, 4)}px` }, 0.08)
        .call(
          () => {
            el.style.removeProperty('--ebg-mis');
            el.style.removeProperty('--ebg-mis-y');
          },
          [],
          0.2
        ),
      []
    );

  /** The rare one: every letter blows apart and slams back. */
  const shatter = () => {
    const targets = free();
    if (targets.length < chars.length) {
      return null;
    }
    return track(
      gsap
        .timeline()
        .to(targets, {
          duration: 0.35,
          ease: 'expo.out',
          rotation: () => rnd(-160, 160),
          scale: () => rnd(0.4, 1.8),
          stagger: { each: 0.01, from: 'random' },
          x: () => rnd(-spread() * 0.4, spread() * 0.4),
          y: () => rnd(-spread() * 0.3, spread() * 0.3),
        })
        .to(targets, {
          clearProps: 'transform',
          duration: 0.7,
          ease: 'expo.inOut',
          rotation: 0,
          scale: 1,
          stagger: { each: 0.015, from: 'random' },
          x: 0,
          y: 0,
        }),
      targets
    );
  };

  const effects = [scramble, scramble, flip, jolt, invert, wave, hop, misregister];

  const glitch = () => {
    if (stopped || !landed) {
      return 0;
    }
    const play = Math.random() < 0.06 ? shatter : (gsap.utils.random(effects) as () => gsap.core.Animation | null);
    return play()?.totalDuration() ?? 0;
  };

  return {
    glitch,
    revert() {
      stopped = true;
      for (const anim of running) {
        anim.kill();
      }
      split.revert();
      el.style.removeProperty('--ebg-mis');
      el.style.removeProperty('--ebg-mis-y');
    },
    scatterIn(delay) {
      return track(
        gsap.to(chars, {
          autoAlpha: 1,
          clearProps: 'transform,opacity,visibility',
          delay,
          duration: 0.9,
          ease: 'expo.out',
          onComplete: () => {
            landed = true;
          },
          rotation: 0,
          scale: 1,
          stagger: { each: 0.03, from: 'random' },
          x: 0,
          y: 0,
        }),
        chars
      );
    },
  };
};
