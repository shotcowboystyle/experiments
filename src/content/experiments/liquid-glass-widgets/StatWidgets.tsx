import { ArrowDown, ArrowUp, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';

import type { Tone } from './GlassWidget';
import { GlassWidget } from './GlassWidget';

type Trend = 'increase' | 'decrease' | 'neutral';

const ARROWS = { decrease: ArrowDown, increase: ArrowUp, neutral: Minus };
const SLOPES = { decrease: TrendingDown, increase: TrendingUp, neutral: Minus };

// Fills settle without overshoot: a bar that passes its value reads as wrong data.
const fill = { bounce: 0, type: 'spring', visualDuration: 0.8 } as const;

const percent = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
  signDisplay: 'exceptZero',
  style: 'percent',
});

const trendOf = (delta: number): Trend => {
  if (delta > 0) {
    return 'increase';
  }
  return delta < 0 ? 'decrease' : 'neutral';
};

/** A change from zero has no percentage, so it reads "New" instead of Infinity. */
const describeChange = (current: number, previous: number) => {
  if (previous !== 0) {
    return percent.format((current - previous) / Math.abs(previous));
  }
  return current === 0 ? '0%' : 'New';
};

interface StatCardProps {
  title: string;
  value: string | number;
  change?: { value: number; type: Trend };
  icon?: ReactNode;
  tone?: Tone;
}

export const StatCard = ({ title, value, change, icon, tone = 'cyan' }: StatCardProps) => {
  const Arrow = ARROWS[change?.type ?? 'neutral'];
  return (
    <GlassWidget tone={tone}>
      <div className="glass-row glass-stat-head">
        <p className="glass-label">{title}</p>
        {icon && <span className="glass-stat-icon">{icon}</span>}
      </div>
      <p
        className="glass-figure"
        data-size="3xl"
      >
        {value}
      </p>
      {change && (
        <p
          className="glass-trend"
          data-trend={change.type}
        >
          <Arrow size={12} />
          {Math.abs(change.value)}%<span>vs last period</span>
        </p>
      )}
    </GlassWidget>
  );
};

interface MetricStatProps {
  label: string;
  value: number;
  max?: number;
  unit?: string;
  icon?: ReactNode;
  tone?: Tone;
}

export const MetricStat = ({ label, value, max = 100, unit = '', icon, tone = 'blue' }: MetricStatProps) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <GlassWidget tone={tone}>
      <div className="glass-row glass-stat-head">
        <p className="glass-label glass-inline">
          {icon}
          {label}
        </p>
        <p className="glass-metric">
          {value}
          {unit && <span className="glass-label"> {unit}</span>}
        </p>
      </div>
      <div
        aria-label={label}
        aria-valuemax={max}
        aria-valuemin={0}
        aria-valuenow={value}
        className="glass-meter"
        role="meter"
      >
        <motion.div
          animate={{ width: `${pct}%` }}
          className="glass-meter-fill"
          initial={{ width: 0 }}
          transition={fill}
        />
      </div>
      <p className="glass-meta glass-meter-note">
        {pct.toFixed(0)}% of {max}
        {unit}
      </p>
    </GlassWidget>
  );
};

interface ComparisonStatProps {
  title: string;
  current: number;
  previous: number;
  format?: (value: number) => string;
  icon?: ReactNode;
  tone?: Tone;
}

export const ComparisonStat = ({
  title,
  current,
  previous,
  format = String,
  icon,
  tone = 'green',
}: ComparisonStatProps) => {
  const trend = trendOf(current - previous);
  const Slope = SLOPES[trend];
  return (
    <GlassWidget tone={tone}>
      <div className="glass-row glass-stat-head">
        <p className="glass-label">{title}</p>
        {icon && <span className="glass-stat-icon">{icon}</span>}
      </div>
      <p
        className="glass-figure"
        data-size="4xl"
      >
        {format(current)}
      </p>
      <p
        className="glass-trend"
        data-trend={trend}
      >
        <Slope size={16} />
        {describeChange(current, previous)}
        <span>from {format(previous)}</span>
      </p>
    </GlassWidget>
  );
};

interface CircularProgressStatProps {
  label: string;
  value: number;
  max?: number;
  unit?: string;
  icon?: ReactNode;
  tone?: Tone;
  size?: 'sm' | 'md' | 'lg';
}

export const CircularProgressStat = ({
  label,
  value,
  max = 100,
  unit = '',
  icon,
  tone = 'cyan',
  size = 'md',
}: CircularProgressStatProps) => (
  <GlassWidget
    className="glass-center"
    tone={tone}
  >
    <div
      className="glass-ring"
      data-size={size}
    >
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
        <motion.circle
          animate={{ pathLength: Math.min(value / max, 1) }}
          className="glass-ring-fill"
          cx={50}
          cy={50}
          initial={{ pathLength: 0 }}
          r={44}
          transition={fill}
        />
      </svg>
      <div className="glass-ring-label">
        {icon && <span className="glass-stat-icon">{icon}</span>}
        <p
          className="glass-figure"
          data-size={size === 'sm' ? '2xl' : '3xl'}
        >
          {value}
          {unit && <span className="glass-label"> {unit}</span>}
        </p>
        <p className="glass-meta">{label}</p>
      </div>
    </div>
  </GlassWidget>
);
