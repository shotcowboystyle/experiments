import { gsap } from 'gsap';

import type { ParticleEffectDefinition } from './attach';
import { perimeterLength, perimeterPoint } from './field';
import type { ParticleField } from './field';

const rnd = gsap.utils.random;

/** A jagged arc crawling a stretch of the target's outline, re-struck every few frames so it flickers. */
const bolt = (
  field: ParticleField,
  from: number,
  span: number,
  amp: number,
  life: number,
  width: number,
  ink: 0 | 1
) => {
  const { box, radius } = field;
  const segments = Math.max(4, Math.round((perimeterLength(box, radius) * span) / 12));
  let restrike = 0;
  const strike = (): number[] => {
    const pts: number[] = [];
    for (let i = 0; i <= segments; i += 1) {
      const e = perimeterPoint(box, radius, from + (span * i) / segments);
      const j = i === 0 || i === segments ? 0 : rnd(-amp, amp);
      pts.push(e.x + e.nx * j, e.y + e.ny * j);
    }
    return pts;
  };
  field.spawn({
    fade: false,
    ink,
    life,
    points: strike(),
    shape: 'bolt',
    size: width,
    update: (p, dt) => {
      restrike -= dt;
      if (restrike > 0) {
        return;
      }
      // ~20fps restrike: stepped, like a posterized frame rate.
      restrike = 0.05;
      p.points = strike();
      p.alpha = Math.random() < 0.3 ? 0.34 : 1;
    },
    x: 0,
    y: 0,
  });
};

/** Sparks thrown outward from random points on the outline. */
const spray = (field: ParticleField, count: number, speed: [number, number]) => {
  const { box, radius } = field;
  for (let i = 0; i < count; i += 1) {
    const pt = perimeterPoint(box, radius, Math.random());
    const v = rnd(speed[0], speed[1]);
    const jitter = rnd(-0.6, 0.6);
    field.spawn({
      drag: 0.06,
      gravity: 180,
      ink: Math.random() < 0.3 ? 1 : 0,
      life: rnd(0.25, 0.6),
      shape: 'spark',
      size: rnd(1, 2.4),
      vx: (pt.nx + jitter * pt.ny) * v,
      vy: (pt.ny - jitter * pt.nx) * v,
      x: pt.x,
      y: pt.y,
    });
  }
};

/** Short, stepped burst of a CSS custom property on the target; the stylesheet decides what it lights up. */
const flare = (target: HTMLElement, prop: string, from: number, duration: number, steps: number) => {
  gsap.fromTo(target, { [prop]: from }, { [prop]: 0, duration, ease: `steps(${steps})`, overwrite: 'auto' });
};

const CARD_RUNNERS = { hover: 3, idle: 1 };
const CARD_RUNNER_SPEED = { hover: 340, idle: 80 };
/** Floating motes per second drifting off the card. */
const MOTE_RATE = { hover: 20, idle: 5 };

/** Cards: an electric border, crawling runners, and motes floating away from every edge. Arcs are the card's accent. */
export const surge: ParticleEffectDefinition = {
  bleed: 110,
  create(field, card) {
    const runners: { dir: 1 | -1; t: number }[] = [];
    const state = { hovering: false, rate: MOTE_RATE.idle, speed: CARD_RUNNER_SPEED.idle };
    let moteAcc = 0;

    const setRunners = (count: number) => {
      runners.length = 0;
      for (let k = 0; k < count; k += 1) {
        runners.push({ dir: k % 2 === 0 ? 1 : -1, t: Math.random() });
      }
    };

    /** A discharge along part of the border; returns its length. */
    const discharge = (big: boolean) => {
      const from = Math.random();
      const span = big ? rnd(0.3, 0.6) : rnd(0.06, 0.22);
      const life = rnd(0.18, 0.4);
      bolt(field, from, span, big ? 9 : 6, life, big ? 2.5 : 2, 0);
      if (Math.random() < 0.6) {
        bolt(field, from + rnd(-0.02, 0.02), span * rnd(0.4, 0.9), 12, 0.15, 1, 1);
      }
      spray(field, big ? 26 : 10, [80, big ? 320 : 200]);
      const glow = big ? 0.5 : 0.3;
      flare(card, '--ebg-charge', 1, glow, big ? 5 : 3);
      return Math.max(life, glow);
    };

    const ambient = (dt: number) => {
      const { box, radius } = field;
      const total = perimeterLength(box, radius);
      for (const run of runners) {
        run.t = (run.t + (run.dir * state.speed * dt) / total + 1) % 1;
        const pt = perimeterPoint(box, radius, run.t);
        field.spawn({
          ink: run.dir === 1 ? 0 : 1,
          life: 0.5,
          shrink: true,
          size: state.hovering ? 2.2 : 1.6,
          x: pt.x,
          y: pt.y,
        });
      }
      moteAcc += state.rate * dt;
      while (moteAcc >= 1) {
        moteAcc -= 1;
        const pt = perimeterPoint(box, radius, Math.random());
        const out = rnd(8, 36);
        field.spawn({
          alpha: rnd(0.5, 1),
          drag: 0.55,
          gravity: -10,
          ink: Math.random() < 0.35 ? 1 : 0,
          life: rnd(1.3, 3),
          phase: rnd(0, Math.PI * 2),
          shape: Math.random() < 0.25 ? 'square' : 'dot',
          size: rnd(0.8, 2.4),
          spin: rnd(-3, 3),
          vx: pt.nx * out + rnd(-8, 8),
          vy: pt.ny * out - rnd(6, 26),
          wobble: rnd(6, 18),
          wobbleFreq: rnd(0.6, 2),
          x: pt.x,
          y: pt.y,
        });
      }
    };

    const idle = () => {
      setRunners(state.hovering ? CARD_RUNNERS.hover : CARD_RUNNERS.idle);
      field.addEmitter(ambient);
    };

    return {
      accent: () => discharge(state.hovering || Math.random() < 0.18),
      destroy() {
        field.removeEmitter(ambient);
        gsap.killTweensOf(state);
        gsap.killTweensOf(card);
      },
      enter(delay) {
        field.sync();
        field.particles.length = 0;
        runners.length = 0;
        gsap.set(card, { autoAlpha: 0 });
        const tl = gsap.timeline({ delay });
        // Power-on: the whole outline arcs while the card stutters in on hard frames.
        tl.call(() => bolt(field, 0, 1, 7, 0.55, 2.5, 0), [], 0);
        tl.call(() => bolt(field, 0.5, 1, 11, 0.4, 1, 1), [], 0.08);
        tl.set(card, { visibility: 'visible' }, 0);
        tl.to(card, { duration: 0.5, keyframes: { easeEach: 'steps(1)', opacity: [0, 1, 0.1, 0.8, 0.25, 1] } }, 0);
        tl.call(
          () => {
            spray(field, 40, [120, 360]);
            flare(card, '--ebg-charge', 1, 0.6, 6);
            idle();
          },
          [],
          0.5
        );
        return tl;
      },
      hover(on) {
        state.hovering = on;
        setRunners(on ? CARD_RUNNERS.hover : CARD_RUNNERS.idle);
        gsap.to(state, {
          duration: on ? 0.3 : 0.8,
          ease: on ? 'power3.out' : 'power2.inOut',
          overwrite: true,
          rate: on ? MOTE_RATE.hover : MOTE_RATE.idle,
          speed: on ? CARD_RUNNER_SPEED.hover : CARD_RUNNER_SPEED.idle,
        });
      },
    };
  },
};

/** Seconds per border revolution at rest. */
const SPIN_DURATION = 3.2;

/** Calls to action: a stepped, rotating posterized border. Its shockwave pulse is the accent. */
export const charge: ParticleEffectDefinition = {
  bleed: 70,
  create(field, cta) {
    const state = { hovering: false };
    let emberAcc = 0;
    const spin = gsap.fromTo(
      cta,
      { '--ebg-angle': '0deg' },
      { '--ebg-angle': '360deg', duration: SPIN_DURATION, ease: 'steps(24)', paused: true, repeat: -1 }
    );
    let surgeTween: gsap.core.Tween | undefined;

    const shockwave = (spread: number, duration: number, ink: 0 | 1) => {
      field.spawn({
        ink,
        life: duration,
        shape: 'outline',
        size: 0,
        update: (p) => {
          // Stepped growth: the ring jumps outward in hard frames.
          const k = Math.ceil((p.age / p.life) * 5) / 5;
          p.size = spread * k;
        },
        x: 0,
        y: 0,
      });
    };

    /** Returns its length. */
    const pulse = (strength: number) => {
      shockwave(18 * strength, 0.45, 0);
      gsap.delayedCall(0.07, () => shockwave(30 * strength, 0.55, 1));
      spray(field, Math.round(14 * strength), [60, 220 * strength]);
      flare(cta, '--ebg-pulse', 1, 0.5, 5);
      flare(cta, '--ebg-pop', 0.12 * strength, 0.35, 4);
      // The border lurches: spin races then settles back.
      surgeTween?.kill();
      surgeTween = gsap.fromTo(
        spin,
        { timeScale: 7 },
        { duration: 0.9, ease: 'power2.out', timeScale: state.hovering ? 3 : 1 }
      );
      return 0.9;
    };

    const ambient = (dt: number) => {
      const { box, radius } = field;
      emberAcc += (state.hovering ? 30 : 4) * dt;
      while (emberAcc >= 1) {
        emberAcc -= 1;
        const pt = perimeterPoint(box, radius, Math.random());
        field.spawn({
          gravity: -20,
          ink: Math.random() < 0.4 ? 1 : 0,
          life: rnd(0.6, 1.4),
          size: rnd(0.8, 1.8),
          vx: pt.nx * rnd(10, 30),
          vy: pt.ny * rnd(10, 30) - rnd(10, 30),
          x: pt.x,
          y: pt.y,
        });
      }
    };

    return {
      accent: () => {
        if (state.hovering) {
          return pulse(1.5);
        }
        return pulse(Math.random() < 0.2 ? 1.8 : 1);
      },
      destroy() {
        field.removeEmitter(ambient);
        spin.kill();
        surgeTween?.kill();
        gsap.killTweensOf(cta);
      },
      enter(delay) {
        field.sync();
        const tl = gsap.timeline({ delay });
        tl.call(
          () => {
            spin.play();
            field.addEmitter(ambient);
          },
          [],
          0
        );
        return tl;
      },
      hover(on) {
        state.hovering = on;
        surgeTween?.kill();
        surgeTween = gsap.to(spin, { duration: 0.4, overwrite: true, timeScale: on ? 3 : 1 });
      },
    };
  },
};
