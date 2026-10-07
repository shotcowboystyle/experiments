import { gsap } from 'gsap';

import { ParticleField } from './field';

/* Animaxxing `attach.ts`, trimmed to the controls this grid uses: no page
   outro exists here, so exit/blast are left out. */

export const prefersReducedMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Coarse-pointer budget. 1 keeps all transient particles. */
const COARSE_POINTER_DENSITY = 0.6;

/** Inline properties the entrance and hover states write on the target; destroy puts them back. */
const TARGET_PROPS = [
  'opacity',
  'visibility',
  'transform',
  'scale',
  '--ebg-charge',
  '--ebg-pulse',
  '--ebg-pop',
  '--ebg-angle',
];

const snapshotStyles = (element: HTMLElement, props: string[]): (() => void) => {
  const hadStyle = element.hasAttribute('style');
  const saved = props.map(
    (prop) => [element.style.getPropertyValue(prop), element.style.getPropertyPriority(prop)] as const
  );
  return () => {
    gsap.set(element, { clearProps: 'transform' });
    for (const [i, prop] of props.entries()) {
      const [value, priority] = saved[i] ?? ['', ''];
      if (value) {
        element.style.setProperty(prop, value, priority);
      } else {
        element.style.removeProperty(prop);
      }
    }
    if (!hadStyle && !element.style.length) {
      element.removeAttribute('style');
    }
  };
};

type Register = (fn: () => void) => void;

/** Roll back partial construction and attempt every cleanup, even if one throws. */
const own = (setup: (dispose: Register, after: Register) => void): (() => void) => {
  const ctx = gsap.context(() => {
    // intentionally empty: context is filled later via ctx.add
  });
  const disposers: (() => void)[] = [];
  const restores: (() => void)[] = [];
  let done = false;
  const teardown = () => {
    if (done) {
      return;
    }
    done = true;
    let failure: unknown;
    const attempt = (fn: () => void) => {
      try {
        fn();
      } catch (error) {
        failure ??= error;
      }
    };
    for (const fn of disposers.splice(0).toReversed()) {
      attempt(fn);
    }
    attempt(() => ctx.revert());
    for (const fn of restores.splice(0).toReversed()) {
      attempt(fn);
    }
    if (failure) {
      throw failure;
    }
  };
  let failure: { error: unknown } | undefined;
  ctx.add(() => {
    try {
      setup(
        (fn) => disposers.push(fn),
        (fn) => restores.push(fn)
      );
    } catch (error) {
      failure = { error };
    }
  });
  if (failure) {
    try {
      teardown();
    } catch {
      // Safe to continue: the construction error below is the one worth surfacing.
    }
    throw failure.error;
  }
  return teardown;
};

const isFocusVisible = (el: Element): boolean => {
  try {
    return el.matches(':focus-visible');
  } catch {
    // Safe to continue: old engines without :focus-visible treat any focus as visible.
    return true;
  }
};

export interface ParticleEffectInstance {
  /** Plays the effect's loud moment and returns its length in timeline seconds. The conductor decides when. */
  accent: () => number;
  /** Builds the entrance, starting after `delay` seconds, and starts the ambient loop at its end. */
  enter: (delay: number) => gsap.core.Timeline;
  /** Intensifies the effect while hovered, keyboard-focused, or touch-pressed. */
  hover: (on: boolean) => void;
  destroy: () => void;
}

export interface ParticleEffectDefinition {
  /** How far the canvas extends past the target on each side, in px. */
  bleed: number;
  create: (field: ParticleField, target: HTMLElement) => ParticleEffectInstance;
}

export interface ParticleEffectControls {
  /** The instance's accent once its entrance has landed; 0 before that. */
  accent: () => number;
  enter: (delay?: number) => void;
  pause: () => void;
  play: () => void;
  destroy: () => void;
}

export const attachParticleEffect = (
  canvas: HTMLCanvasElement,
  target: HTMLElement,
  effect: ParticleEffectDefinition
): ParticleEffectControls => {
  let destroyed = false;
  let controls!: ParticleEffectControls;
  const revert = own((dispose, after) => {
    after(snapshotStyles(target, TARGET_PROPS));
    const field = new ParticleField(canvas, target, effect.bleed);
    dispose(() => field.destroy());
    const instance = effect.create(field, target);
    dispose(() => instance.destroy());
    let entrance: gsap.core.Timeline | null = null;
    let ready = false;

    const resize = new ResizeObserver(() => field.sync());
    dispose(() => resize.disconnect());
    resize.observe(target);
    const visibility = new IntersectionObserver(([entry]) => field.setOnScreen(entry?.isIntersecting ?? true));
    dispose(() => visibility.disconnect());
    visibility.observe(target);
    const coarse = window.matchMedia('(pointer: coarse)');
    const applyDensity = () => {
      field.density = coarse.matches ? COARSE_POINTER_DENSITY : 1;
    };
    applyDensity();
    dispose(() => coarse.removeEventListener('change', applyDensity));
    coarse.addEventListener('change', applyDensity);

    const listeners = new AbortController();
    dispose(() => listeners.abort());
    const { signal } = listeners;
    let keyboardInput = false;
    let hovering = false;
    let pressing = false;
    let hot = false;
    const syncHot = () => {
      if (!ready) {
        return;
      }
      const focused =
        keyboardInput && target.matches(':focus-within') && isFocusVisible(document.activeElement ?? target);
      const on = hovering || pressing || focused;
      if (on === hot) {
        return;
      }
      hot = on;
      instance.hover(on);
    };
    document.addEventListener(
      'pointerdown',
      () => {
        keyboardInput = false;
        syncHot();
      },
      { capture: true, signal }
    );
    document.addEventListener(
      'keydown',
      (e) => {
        if (e.altKey || e.ctrlKey || e.metaKey || ['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) {
          return;
        }
        keyboardInput = true;
        syncHot();
      },
      { capture: true, signal }
    );
    target.addEventListener(
      'pointerenter',
      (e) => {
        if (e.pointerType !== 'touch') {
          hovering = true;
          syncHot();
        }
      },
      { signal }
    );
    target.addEventListener(
      'pointerdown',
      (e) => {
        if (e.pointerType === 'touch') {
          pressing = true;
          syncHot();
        }
      },
      { signal }
    );
    target.addEventListener(
      'pointerup',
      (e) => {
        if (e.pointerType === 'touch') {
          pressing = false;
          syncHot();
        }
      },
      { signal }
    );
    const release = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        pressing = false;
      } else {
        hovering = false;
      }
      syncHot();
    };
    target.addEventListener('pointercancel', release, { signal });
    target.addEventListener('pointerleave', release, { signal });
    target.addEventListener('focusin', syncHot, { signal });
    target.addEventListener('focusout', syncHot, { signal });

    dispose(() => {
      destroyed = true;
      ready = false;
      entrance?.kill();
      entrance = null;
    });
    controls = {
      accent: () => (ready && !destroyed ? instance.accent() : 0),
      destroy: () => revert(),
      enter(delay = 0) {
        if (destroyed) {
          return;
        }
        entrance?.kill();
        entrance = instance.enter(delay);
        entrance.eventCallback('onComplete', () => {
          ready = true;
          syncHot();
        });
      },
      pause() {
        if (!destroyed) {
          field.setPaused(true);
        }
      },
      play() {
        if (!destroyed) {
          field.setPaused(false);
        }
      },
    };
  });
  return controls;
};
