import { Moon, Pause, Play, RotateCcw, Sun } from 'lucide-react';
import { useAnimationFrame } from 'motion/react';
import { useState } from 'react';

import { Button } from '~/components/ui/Button';

import { GlassWidget, useNow } from './GlassWidget';

const pad = (n: number) => String(n).padStart(2, '0');

// Hand lengths in viewBox units, out of a 50-unit radius.
const HANDS = { hour: 24, minute: 33, second: 37 };

// Twelve marks on a 40-unit circle, clockwise from 12. Rounded, because Node
// and the browser disagree on the last digit of Math.sin, which React flags
// as a hydration mismatch.
const MARKS = Array.from({ length: 12 }, (_, i) => {
  const angle = ((i * 30 - 90) * Math.PI) / 180;
  return { x: Math.round(400 * Math.cos(angle)) / 10 + 50, y: Math.round(400 * Math.sin(angle)) / 10 + 50 };
});

interface AnalogClockWidgetProps {
  /** A fixed time to show. @default the current time, ticking */
  time?: Date;
  /** Numerals around the face, or dots when off. @default true */
  showNumbers?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const AnalogClockWidget = ({ time, showNumbers = true, size = 'md' }: AnalogClockWidgetProps) => {
  const now = useNow();
  const t = time ?? now;
  // Minutes and hours creep with the hand before them, like a real movement.
  const angles = t && {
    hour: (t.getHours() % 12) * 30 + t.getMinutes() * 0.5,
    minute: t.getMinutes() * 6 + t.getSeconds() * 0.1,
    second: t.getSeconds() * 6,
  };

  return (
    <GlassWidget
      className="glass-center"
      size="sm"
      tone="blue"
    >
      {/* One 100-unit viewBox at every size, so nothing is re-measured per size. */}
      <svg
        aria-label={t ? `Clock showing ${t.toLocaleTimeString('en-US', { timeStyle: 'short' })}` : 'Clock'}
        className="glass-dial"
        data-size={size}
        role="img"
        viewBox="0 0 100 100"
      >
        <circle
          className="glass-dial-face"
          cx={50}
          cy={50}
          r={49}
        />
        {MARKS.map(({ x, y }, i) =>
          showNumbers ? (
            <text
              className="glass-dial-number"
              key={i}
              x={x}
              y={y}
            >
              {i || 12}
            </text>
          ) : (
            <circle
              className="glass-dial-tick"
              cx={x}
              cy={y}
              key={i}
              r={1.5}
            />
          )
        )}
        {angles &&
          (['hour', 'minute', 'second'] as const).map((hand) => (
            <line
              className="glass-hand"
              data-hand={hand}
              key={hand}
              transform={`rotate(${angles[hand]} 50 50)`}
              x1={50}
              x2={50}
              y1={50}
              y2={50 - HANDS[hand]}
            />
          ))}
        <circle
          className="glass-dial-pin"
          cx={50}
          cy={50}
          r={3}
        />
      </svg>
    </GlassWidget>
  );
};

interface DigitalClockWidgetProps {
  time?: Date;
  showSeconds?: boolean;
  format?: '12h' | '24h';
}

export const DigitalClockWidget = ({ time, showSeconds = true, format = '12h' }: DigitalClockWidgetProps) => {
  const now = useNow();
  const t = time ?? now;
  const h = t?.getHours() ?? 0;

  return (
    <GlassWidget className="glass-center">
      <time
        className="glass-digital"
        dateTime={t?.toISOString()}
      >
        <span
          className="glass-figure"
          data-size="4xl"
        >
          {t ? `${pad(format === '12h' ? h % 12 || 12 : h)}:${pad(t.getMinutes())}` : '--:--'}
        </span>
        {showSeconds && <span className="glass-digital-seconds">:{t ? pad(t.getSeconds()) : '--'}</span>}
        {format === '12h' && <span className="glass-label">{h >= 12 ? 'PM' : 'AM'}</span>}
      </time>
    </GlassWidget>
  );
};

const zoned = (now: Date, timeZone: string) => {
  try {
    return {
      hour: Number(now.toLocaleString('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone })),
      time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone }),
    };
  } catch {
    // An unknown IANA zone throws a RangeError. Only that row shows dashes;
    // the other cities keep ticking.
  }
};

interface WorldClockWidgetProps {
  clocks: { city: string; timezone: string }[];
}

export const WorldClockWidget = ({ clocks }: WorldClockWidgetProps) => {
  const now = useNow();

  return (
    <GlassWidget tone="blue">
      <ul
        className="glass-list"
        role="list"
      >
        {clocks.map(({ city, timezone }) => {
          const local = now && zoned(now, timezone);
          // Day or night is read off the city's own hour, not passed in.
          const isDay = local && local.hour >= 6 && local.hour < 18;
          return (
            <li
              className="glass-row"
              key={city}
            >
              <span className="glass-world-city">
                {city}
                {local &&
                  (isDay ? (
                    <Sun
                      aria-label="Day"
                      className="glass-sky"
                      data-tone="amber"
                      size={16}
                    />
                  ) : (
                    <Moon
                      aria-label="Night"
                      className="glass-sky"
                      data-tone="blue"
                      size={16}
                    />
                  ))}
              </span>
              <span className="glass-world-time">{local?.time ?? '--:--'}</span>
            </li>
          );
        })}
      </ul>
    </GlassWidget>
  );
};

/**
 * Running time in ms, measured from timestamps rather than counted ticks, so a
 * throttled background tab never loses time. Stops itself at `limit`.
 */
const useElapsed = (limit = Number.POSITIVE_INFINITY) => {
  const [banked, setBanked] = useState(0);
  const [startedAt, setStartedAt] = useState<number>();
  const [now, setNow] = useState(0);
  const running = startedAt !== undefined;
  const elapsed = Math.min(limit, banked + (running ? now - startedAt : 0));

  useAnimationFrame(() => {
    if (startedAt === undefined) {
      return;
    }
    const t = performance.now();
    if (banked + t - startedAt >= limit) {
      setBanked(limit);
      setStartedAt(undefined);
    } else {
      setNow(t);
    }
  });

  const toggle = () => {
    const t = performance.now();
    if (startedAt === undefined) {
      setStartedAt(t);
      setNow(t);
    } else {
      setBanked(Math.min(limit, banked + t - startedAt));
      setStartedAt(undefined);
    }
  };

  const reset = () => {
    setBanked(0);
    setStartedAt(undefined);
  };

  return { elapsed, reset, running, toggle };
};

interface TransportProps {
  /** Names the buttons, e.g. "Start timer", so two widgets never share one. */
  label: string;
  running: boolean;
  done?: boolean;
  onReset: () => void;
  onToggle: () => void;
}

const Transport = ({ label, running, done, onReset, onToggle }: TransportProps) => (
  <div className="glass-transport">
    <Button
      aria-label={`Reset ${label}`}
      icon
      onClick={onReset}
      variant="ghost"
    >
      <RotateCcw size={16} />
    </Button>
    <Button
      aria-label={`${running ? 'Pause' : 'Start'} ${label}`}
      className="glass-play"
      data-tone={running ? 'red' : 'green'}
      disabled={done}
      icon
      onClick={onToggle}
      variant="ghost"
    >
      {running ? <Pause size={20} /> : <Play size={20} />}
    </Button>
  </div>
);

export const StopwatchWidget = () => {
  const { elapsed, reset, running, toggle } = useElapsed();
  const ms = Math.floor(elapsed);

  return (
    <GlassWidget>
      <p
        className="glass-figure glass-readout"
        data-size="3xl"
      >
        {pad(Math.floor(ms / 60_000))}:{pad(Math.floor((ms % 60_000) / 1000))}.{pad(Math.floor((ms % 1000) / 10))}
      </p>
      <Transport
        label="stopwatch"
        onReset={reset}
        onToggle={toggle}
        running={running}
      />
    </GlassWidget>
  );
};

export const TimerWidget = ({ initialMinutes = 5 }: { initialMinutes?: number }) => {
  const duration = initialMinutes * 60_000;
  const { elapsed, reset, running, toggle } = useElapsed(duration);
  // Rounded up, so the display reads 00:00 only once time is actually out.
  const left = Math.ceil((duration - elapsed) / 1000);
  const done = left === 0;

  return (
    <GlassWidget tone={done ? 'red' : 'green'}>
      <div className="glass-ring">
        <svg
          aria-hidden
          viewBox="0 0 100 100"
        >
          <circle
            className="glass-ring-track"
            cx={50}
            cy={50}
            r={44}
          />
          {/* pathLength 100 turns the dash offset into a plain percentage. */}
          <circle
            className="glass-ring-fill"
            cx={50}
            cy={50}
            pathLength={100}
            r={44}
            strokeDasharray={100}
            strokeDashoffset={(elapsed / duration) * 100}
          />
        </svg>
        <span
          className="glass-figure glass-ring-label"
          data-size="2xl"
          role="timer"
        >
          {pad(Math.floor(left / 60))}:{pad(left % 60)}
        </span>
      </div>
      <Transport
        done={done}
        label="timer"
        onReset={reset}
        onToggle={toggle}
        running={running}
      />
    </GlassWidget>
  );
};
