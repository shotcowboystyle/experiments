import { useAnimationFrame, useMotionValue } from 'motion/react';
import { useState } from 'react';

import { Button } from '~/components/ui/Button';

import type { AIState, OrbColors } from './SiriOrb';
import { SiriOrb, STATE_MOTION } from './SiriOrb';

import './siri-orb-demo.css';

const STATES = Object.keys(STATE_MOTION) as AIState[];

// `<input type="color">` only speaks sRGB hex, so the pickers start from the
// nearest hex to each oklch default. c2 and c3 sit outside sRGB and clip.
// Untouched swatches keep rendering the real oklch value.
const PICKER_DEFAULTS: OrbColors = {
  bg: '#e7e1f6',
  c1: '#f153aa',
  c2: '#00b9db',
  c3: '#8a79ff',
  c4: '#de74e5',
};

const SiriOrbDemo = () => {
  const [size, setSize] = useState(192);
  const [animationDuration, setAnimationDuration] = useState(20);
  const [state, setState] = useState<AIState>('listening');
  const [colors, setColors] = useState<Partial<OrbColors>>({});
  const [simulate, setSimulate] = useState(true);
  const [level, setLevel] = useState(0);
  const amplitude = useMotionValue(0);

  // A speech-like envelope, so the reactive states can be seen without asking
  // for the microphone. Three detuned sines read as organic; one reads as a
  // metronome.
  useAnimationFrame((time) => {
    if (!simulate) {
      return;
    }
    const t = time / 1000;
    const { intensity, speed } = STATE_MOTION[state];
    const envelope =
      0.5 +
      0.3 * Math.sin(t * 2.1 * speed) +
      0.14 * Math.sin(t * 5.3 * speed + 1.7) +
      0.06 * Math.sin(t * 11.7 * speed + 0.4);
    amplitude.set(Math.min(1, Math.max(0, envelope * intensity)));
  });

  return (
    <div className="siri-orb-demo">
      <div className="siri-orb-stage">
        <SiriOrb
          amplitude={amplitude}
          animationDuration={animationDuration}
          colors={colors}
          size={size}
          state={state}
        />
      </div>

      <fieldset className="siri-orb-controls">
        <legend>Props</legend>
        <label>
          <span>state</span>
          <select
            onChange={(e) => setState(e.target.value as AIState)}
            s-select=""
            s-size="sm"
            value={state}
          >
            {STATES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          <span>size</span>
          <input
            max={320}
            min={16}
            onChange={(e) => setSize(e.target.valueAsNumber)}
            type="range"
            value={size}
          />
          <output>{size}px</output>
        </label>
        <label>
          <span>animationDuration</span>
          <input
            max={60}
            min={2}
            onChange={(e) => setAnimationDuration(e.target.valueAsNumber)}
            type="range"
            value={animationDuration}
          />
          <output>{animationDuration}s</output>
        </label>
        <label>
          <span>amplitude</span>
          <input
            disabled={simulate}
            max={1}
            min={0}
            onChange={(e) => {
              setLevel(e.target.valueAsNumber);
              amplitude.set(e.target.valueAsNumber);
            }}
            step={0.01}
            type="range"
            value={level}
          />
          <output>{simulate ? 'auto' : level.toFixed(2)}</output>
        </label>
        <label>
          <input
            checked={simulate}
            onChange={(e) => {
              setSimulate(e.target.checked);
              amplitude.set(level);
            }}
            type="checkbox"
          />
          <span>simulate speech</span>
        </label>
        <div className="siri-orb-swatches">
          <span>colors</span>
          {(Object.keys(PICKER_DEFAULTS) as (keyof OrbColors)[]).map((key) => (
            <input
              aria-label={key}
              key={key}
              onChange={(e) => setColors((c) => ({ ...c, [key]: e.target.value }))}
              title={key}
              type="color"
              value={colors[key] ?? PICKER_DEFAULTS[key]}
            />
          ))}
          <Button
            disabled={Object.keys(colors).length === 0}
            onClick={() => setColors({})}
            size="sm"
            variant="ghost"
          >
            Reset
          </Button>
        </div>
      </fieldset>
    </div>
  );
};

export default SiriOrbDemo;
