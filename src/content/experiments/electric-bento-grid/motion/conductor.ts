import { gsap } from 'gsap';

/** One loud moment. Returns its length in timeline seconds, or 0 when it can't play right now. */
export type Accent = () => number;

/** Timeline seconds of quiet after an accent before the next may start. */
const REST: [number, number] = [1, 2.4];
/** Timeline seconds between retries when nothing on screen could play. */
const RETRY = 0.5;

const now = () => gsap.globalTimeline.time();

const onScreen = (el: HTMLElement) => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
};

/**
 * Plays loud accents one at a time, so no two elements flex together.
 * Timing runs on GSAP's global timeline, so pausing or slowing it pauses or slows the conductor too.
 */
export const createConductor = () => {
  const performers = new Map<Accent, HTMLElement>();
  let busyUntil = 0;
  let next: gsap.core.Tween | undefined;

  /** Plays `accent` only if the stage is quiet. */
  const request = (accent: Accent): boolean => {
    if (now() < busyUntil) {
      return false;
    }
    const length = accent();
    if (length <= 0) {
      return false;
    }
    busyUntil = now() + length + gsap.utils.random(REST[0], REST[1]);
    return true;
  };

  const tick = () => {
    const candidates = gsap.utils.shuffle([...performers].filter(([, el]) => onScreen(el)));
    for (const [accent] of candidates) {
      if (request(accent)) {
        break;
      }
    }
    next = gsap.delayedCall(Math.max(busyUntil - now(), RETRY), tick);
  };

  return {
    /** Registers a performer; returns its removal. */
    add(el: HTMLElement, accent: Accent) {
      performers.set(accent, el);
      return () => {
        performers.delete(accent);
      };
    },
    request,
    start() {
      next ??= gsap.delayedCall(RETRY, tick);
    },
  };
};
