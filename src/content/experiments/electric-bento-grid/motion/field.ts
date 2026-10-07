import { gsap } from 'gsap';

/* Animaxxing particle field, adapted for a posterized print look: particles
   snap to a coarse pixel grid, alpha is quantized to a few ink levels, dots
   render as squares, and a second ink plus a jagged `bolt` shape are added. */

export type Shape = 'dot' | 'spark' | 'square' | 'star' | 'outline' | 'bolt';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Half-width for dots and squares, stroke width for sparks and bolts, spread for outlines. */
  size: number;
  alpha: number;
  shape: Shape;
  /** 0 draws in the canvas `color`, 1 in its `--ebg-ink2`. */
  ink: 0 | 1;
  rotation: number;
  /** Radians per second. */
  spin: number;
  /** Fraction of velocity kept after one second. 1 keeps it all. */
  drag: number;
  /** Pixels per second squared, downward positive. */
  gravity: number;
  /** Total seconds to live, or Infinity while something else owns the particle. */
  life: number;
  age: number;
  fade: boolean;
  shrink: boolean;
  /** Sideways sway: amplitude in px/s and frequency in Hz. */
  wobble: number;
  wobbleFreq: number;
  phase: number;
  /** Flat x,y list for bolts, in canvas pixels. */
  points?: number[];
  update?: (p: Particle, dt: number, time: number) => void;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
export type Emitter = (dt: number, time: number) => void;

const DEFAULTS: Omit<Particle, 'x' | 'y'> = {
  age: 0,
  alpha: 1,
  drag: 1,
  fade: true,
  gravity: 0,
  ink: 0,
  life: 1,
  phase: 0,
  rotation: 0,
  shape: 'dot',
  shrink: false,
  size: 2,
  spin: 0,
  vx: 0,
  vy: 0,
  wobble: 0,
  wobbleFreq: 0,
};

/** Longest step the simulation will take, so a stalled tab does not fling everything off screen. */
const MAX_STEP = 0.05;
/**
 * Global motion speed: the particle simulation runs at this rate, and the
 * controller sets GSAP's global timeScale to match. 0.5 = half speed.
 */
export const MOTION_SPEED = 0.5;
/** Pixel grid particles snap to. */
const SNAP = 2;
/** Ink levels alpha is quantized to. */
const ALPHA_LEVELS = 3;

const snap = (v: number) => Math.round(v / SNAP) * SNAP;

const strokeBolt = (ctx: CanvasRenderingContext2D, pts: number[] | undefined, size: number) => {
  if (!pts || pts.length < 4) {
    return;
  }
  ctx.lineWidth = size;
  ctx.beginPath();
  ctx.moveTo(snap(pts[0] ?? 0), snap(pts[1] ?? 0));
  for (let i = 2; i < pts.length; i += 2) {
    ctx.lineTo(snap(pts[i] ?? 0), snap(pts[i + 1] ?? 0));
  }
  ctx.stroke();
};

export class ParticleField {
  readonly canvas: HTMLCanvasElement;
  readonly particles: Particle[] = [];
  readonly emitters = new Set<Emitter>();
  /** The target element's rectangle, in canvas CSS pixels. */
  readonly box: Box = { h: 0, w: 0, x: 0, y: 0 };
  radius = 0;
  colors: [string, string] = ['#000', '#000'];
  time = 0;
  /** Transient particle budget; outlines and owned particles are exempt. */
  density = 1;

  private readonly ctx: CanvasRenderingContext2D;
  private readonly target: HTMLElement;
  private readonly bleed: number;
  private width = 0;
  private height = 0;
  private running = false;
  private onScreen = true;
  private paused = false;
  private destroyed = false;

  constructor(canvas: HTMLCanvasElement, target: HTMLElement, bleed: number) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('ParticleField needs a 2d canvas context');
    }
    this.canvas = canvas;
    this.ctx = ctx;
    this.target = target;
    this.bleed = bleed;
    this.sync();
  }

  /** Re-measure the target and resize the canvas around it. */
  sync(): void {
    if (this.destroyed) {
      return;
    }
    const { offsetWidth: w, offsetHeight: h } = this.target;
    // 1x backing store: the posterized 2px grid hides it, and it quarters the fill cost on retina screens.
    const dpr = 1;
    this.width = w + this.bleed * 2;
    this.height = h + this.bleed * 2;
    this.box.x = this.bleed;
    this.box.y = this.bleed;
    this.box.w = w;
    this.box.h = h;
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.canvas.style.left = `${-this.bleed}px`;
    this.canvas.style.top = `${-this.bleed}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.radius = Number(getComputedStyle(this.target).borderTopLeftRadius.split('px')[0]) || 0;
    this.recolor();
  }

  recolor(): void {
    const style = getComputedStyle(this.canvas);
    const ink = style.color;
    this.colors = [ink, style.getPropertyValue('--ebg-ink2').trim() || ink];
  }

  spawn(init: Partial<Particle> & { x: number; y: number }): Particle {
    const p: Particle = { ...DEFAULTS, ...init };
    if (this.destroyed) {
      return p;
    }
    const structural = p.life === Infinity || p.shape === 'outline' || p.shape === 'bolt';
    if (!structural && this.density < 1 && Math.random() > this.density) {
      return p;
    }
    this.particles.push(p);
    this.start();
    return p;
  }

  /** Let every managed particle finish within `within` seconds. */
  release(within = 0.3): void {
    for (const p of this.particles) {
      if (p.life === Infinity || p.life - p.age > within) {
        p.life = p.age + within;
        p.fade = true;
      }
    }
  }

  /** Let particles an interrupted tween still owns fade out within `within` seconds. */
  releaseOwned(within = 0.3): void {
    for (const p of this.particles) {
      if (p.life === Infinity) {
        p.life = p.age + within;
        p.fade = true;
      }
    }
  }

  addEmitter(emitter: Emitter): void {
    if (this.destroyed) {
      return;
    }
    this.emitters.add(emitter);
    this.start();
  }

  removeEmitter(emitter: Emitter): void {
    this.emitters.delete(emitter);
  }

  setOnScreen(onScreen: boolean): void {
    this.onScreen = onScreen;
    if (onScreen) {
      this.start();
    } else {
      this.stop();
    }
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    if (paused) {
      this.stop();
    } else {
      this.start();
    }
  }

  start(): void {
    if (this.destroyed || this.paused || this.running || !this.onScreen) {
      return;
    }
    if (this.particles.length === 0 && this.emitters.size === 0) {
      return;
    }
    this.running = true;
    gsap.ticker.add(this.tick);
  }

  stop(): void {
    if (!this.running) {
      return;
    }
    this.running = false;
    gsap.ticker.remove(this.tick);
  }

  destroy(): void {
    this.destroyed = true;
    this.stop();
    this.emitters.clear();
    this.particles.length = 0;
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  private readonly tick = (_time: number, deltaMs: number) => {
    const dt = Math.min(deltaMs / 1000, MAX_STEP) * MOTION_SPEED;
    this.time += dt;
    for (const emitter of this.emitters) {
      emitter(dt, this.time);
    }
    this.step(dt);
    this.draw();
    if (this.particles.length === 0 && this.emitters.size === 0) {
      this.stop();
    }
  };

  private step(dt: number): void {
    const list = this.particles;
    let keep = 0;
    for (const p of list) {
      p.age += dt;
      if (p.age >= p.life) {
        continue;
      }
      if (p.drag !== 1) {
        const keepVelocity = p.drag ** dt;
        p.vx *= keepVelocity;
        p.vy *= keepVelocity;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.wobble !== 0) {
        p.x += Math.sin(this.time * p.wobbleFreq * Math.PI * 2 + p.phase) * p.wobble * dt;
      }
      p.rotation += p.spin * dt;
      p.update?.(p, dt, this.time);
      list[keep] = p;
      keep += 1;
    }
    list.length = keep;
  }

  private draw(): void {
    const { ctx } = this;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
    let ink = -1;
    for (const p of this.particles) {
      const progress = p.life === Infinity ? 0 : p.age / p.life;
      const raw = p.alpha * (p.fade ? 1 - progress : 1);
      const size = p.size * (p.shrink ? 1 - progress : 1);
      if (raw <= 0.05 || size <= 0.2) {
        continue;
      }
      if (p.ink !== ink) {
        ({ ink } = p);
        ctx.fillStyle = this.colors[ink] ?? this.colors[0];
        ctx.strokeStyle = ctx.fillStyle;
      }
      // Posterize: a few flat ink levels instead of a smooth fade.
      ctx.globalAlpha = Math.min(Math.ceil(raw * ALPHA_LEVELS) / ALPHA_LEVELS, 1);
      const x = snap(p.x);
      const y = snap(p.y);
      switch (p.shape) {
        case 'dot': {
          const s = Math.max(SNAP, snap(size * 2));
          ctx.fillRect(x - s / 2, y - s / 2, s, s);
          break;
        }
        case 'spark': {
          const speed = Math.hypot(p.vx, p.vy);
          if (speed < 1) {
            ctx.fillRect(x - size, y - size, size * 2, size * 2);
            break;
          }
          const tail = Math.min(speed * 0.05, 22);
          ctx.lineWidth = Math.max(1, size);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(snap(p.x - (p.vx / speed) * tail), snap(p.y - (p.vy / speed) * tail));
          ctx.stroke();
          break;
        }
        case 'square': {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(p.rotation);
          ctx.fillRect(-size, -size, size * 2, size * 2);
          ctx.restore();
          break;
        }
        case 'star': {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(p.rotation);
          ctx.fillRect(-size, -1, size * 2, 2);
          ctx.fillRect(-1, -size, 2, size * 2);
          ctx.restore();
          break;
        }
        case 'outline': {
          const { x: bx, y: by, w, h } = this.box;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(bx - size, by - size, w + size * 2, h + size * 2, this.radius + size);
          ctx.stroke();
          break;
        }
        case 'bolt': {
          strokeBolt(ctx, p.points, size);
          break;
        }
        default: {
          break;
        }
      }
    }
    ctx.globalAlpha = 1;
  }
}

export interface EdgePoint {
  x: number;
  y: number;
  nx: number;
  ny: number;
}

export const perimeterLength = (box: Box, radius: number): number => {
  const r = Math.min(radius, box.w / 2, box.h / 2);
  return 2 * (box.w - 2 * r) + 2 * (box.h - 2 * r) + 2 * Math.PI * r;
};

/** A point on a rounded rectangle's outline at `t` in [0, 1), clockwise from the top-left corner, with the outward normal. */
export const perimeterPoint = (box: Box, radius: number, t: number): EdgePoint => {
  const r = Math.min(radius, box.w / 2, box.h / 2);
  const { x, y, w, h } = box;
  const sw = w - 2 * r;
  const sh = h - 2 * r;
  const arc = (Math.PI * r) / 2;
  const total = 2 * sw + 2 * sh + 4 * arc;
  let d = (((t % 1) + 1) % 1) * total;

  if (d < sw) {
    return { nx: 0, ny: -1, x: x + r + d, y };
  }
  d -= sw;
  if (d < arc) {
    const a = -Math.PI / 2 + d / r;
    return { nx: Math.cos(a), ny: Math.sin(a), x: x + w - r + Math.cos(a) * r, y: y + r + Math.sin(a) * r };
  }
  d -= arc;
  if (d < sh) {
    return { nx: 1, ny: 0, x: x + w, y: y + r + d };
  }
  d -= sh;
  if (d < arc) {
    const a = d / r;
    return { nx: Math.cos(a), ny: Math.sin(a), x: x + w - r + Math.cos(a) * r, y: y + h - r + Math.sin(a) * r };
  }
  d -= arc;
  if (d < sw) {
    return { nx: 0, ny: 1, x: x + w - r - d, y: y + h };
  }
  d -= sw;
  if (d < arc) {
    const a = Math.PI / 2 + d / r;
    return { nx: Math.cos(a), ny: Math.sin(a), x: x + r + Math.cos(a) * r, y: y + h - r + Math.sin(a) * r };
  }
  d -= arc;
  if (d < sh) {
    return { nx: -1, ny: 0, x, y: y + h - r - d };
  }
  d -= sh;
  const a = Math.PI + d / r;
  return { nx: Math.cos(a), ny: Math.sin(a), x: x + r + Math.cos(a) * r, y: y + r + Math.sin(a) * r };
};
