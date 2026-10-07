import type { LucideIcon } from 'lucide-react';
import { Cloud, CloudMoon, CloudRain, CloudSnow, Droplets, Moon, Sun, Thermometer, Wind } from 'lucide-react';
import { motion } from 'motion/react';

import type { Tone } from './GlassWidget';
import { GlassWidget } from './GlassWidget';

export type Sky = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy' | 'night' | 'night-cloudy';

// One table for every widget: the icon, its words, and the tone it tints the
// icon and the bloom with.
const SKY: Record<Sky, { Icon: LucideIcon; label: string; tone: Tone }> = {
  cloudy: { Icon: Cloud, label: 'Cloudy', tone: 'blue' },
  night: { Icon: Moon, label: 'Clear Night', tone: 'blue' },
  'night-cloudy': { Icon: CloudMoon, label: 'Partly Cloudy', tone: 'purple' },
  rainy: { Icon: CloudRain, label: 'Rainy', tone: 'cyan' },
  snowy: { Icon: CloudSnow, label: 'Snowy', tone: 'purple' },
  sunny: { Icon: Sun, label: 'Sunny', tone: 'amber' },
  windy: { Icon: Wind, label: 'Windy', tone: 'blue' },
};

const SkyIcon = ({ sky, size }: { sky: Sky; size: number }) => {
  const { Icon, tone } = SKY[sky];
  return (
    <Icon
      className="glass-sky"
      data-tone={tone}
      size={size}
    />
  );
};

interface WeatherWidgetProps {
  temperature: number;
  condition: Sky;
  location?: string;
}

export const WeatherWidget = ({ temperature, condition, location }: WeatherWidgetProps) => (
  <GlassWidget tone={SKY[condition].tone}>
    {location && <p className="glass-label">{location}</p>}
    <div className="glass-inline glass-weather-now">
      <span className="glass-tile">
        <SkyIcon
          size={32}
          sky={condition}
        />
      </span>
      <div>
        <p
          className="glass-figure"
          data-size="4xl"
        >
          {temperature}°
        </p>
        <p className="glass-label">{SKY[condition].label}</p>
      </div>
    </div>
  </GlassWidget>
);

interface CurrentWeatherWidgetProps {
  location: string;
  temperature: number;
  condition?: Sky;
  feelsLike?: number;
  high?: number;
  low?: number;
  humidity?: number;
  windSpeed?: number;
}

export const CurrentWeatherWidget = ({
  location,
  temperature,
  condition = 'sunny',
  feelsLike,
  high,
  low,
  humidity,
  windSpeed,
}: CurrentWeatherWidgetProps) => (
  <GlassWidget tone={SKY[condition].tone}>
    <div className="glass-row glass-stat-head">
      <div>
        <p className="glass-title">{location}</p>
        {feelsLike !== undefined && <p className="glass-meta">Feels like {feelsLike}°</p>}
      </div>
      <SkyIcon
        size={32}
        sky={condition}
      />
    </div>
    <p
      className="glass-figure"
      data-size="5xl"
    >
      {temperature}°
    </p>
    <p className="glass-label glass-gap">{SKY[condition].label}</p>
    {(high !== undefined || low !== undefined) && (
      <p className="glass-inline glass-label">
        <Thermometer size={12} />
        {high !== undefined && <span>H: {high}°</span>}
        {low !== undefined && <span>L: {low}°</span>}
      </p>
    )}
    {(humidity !== undefined || windSpeed !== undefined) && (
      <p className="glass-inline glass-meta glass-divider">
        {humidity !== undefined && (
          <span className="glass-inline">
            <Droplets size={12} /> {humidity}%
          </span>
        )}
        {windSpeed !== undefined && (
          <span className="glass-inline">
            <Wind size={12} /> {windSpeed} km/h
          </span>
        )}
      </p>
    )}
  </GlassWidget>
);

interface DetailedWeatherWidgetProps {
  temperature: number;
  condition: Sky;
  location?: string;
  feelsLike?: number;
  humidity?: number;
  windSpeed?: number;
}

export const DetailedWeatherWidget = ({
  temperature,
  condition,
  location,
  feelsLike,
  humidity,
  windSpeed,
}: DetailedWeatherWidgetProps) => (
  <GlassWidget
    size="lg"
    tone={SKY[condition].tone}
  >
    {location && <p className="glass-label">{location}</p>}
    <div className="glass-inline glass-weather-now">
      <span className="glass-tile">
        <SkyIcon
          size={40}
          sky={condition}
        />
      </span>
      <div>
        <p
          className="glass-figure"
          data-size="5xl"
        >
          {temperature}°
        </p>
        <p className="glass-label">{SKY[condition].label}</p>
        {feelsLike !== undefined && <p className="glass-meta">Feels like {feelsLike}°</p>}
      </div>
    </div>
    <dl className="glass-readings glass-divider">
      {humidity !== undefined && (
        <div
          className="glass-inline"
          data-tone="cyan"
        >
          <Droplets
            className="glass-sky"
            size={16}
          />
          <div>
            <dt className="glass-meta">Humidity</dt>
            <dd>{humidity}%</dd>
          </div>
        </div>
      )}
      {windSpeed !== undefined && (
        <div
          className="glass-inline"
          data-tone="blue"
        >
          <Wind
            className="glass-sky"
            size={16}
          />
          <div>
            <dt className="glass-meta">Wind</dt>
            <dd>{windSpeed} km/h</dd>
          </div>
        </div>
      )}
    </dl>
  </GlassWidget>
);

export interface ForecastDay {
  day: string;
  high: number;
  low: number;
  condition: Sky;
}

interface ForecastWeatherWidgetProps {
  current: { temperature: number; condition: Sky };
  forecast: ForecastDay[];
  location?: string;
}

export const ForecastWeatherWidget = ({ current, forecast, location }: ForecastWeatherWidgetProps) => (
  <GlassWidget
    size="lg"
    tone="cyan"
  >
    {location && <p className="glass-label">{location}</p>}
    <div className="glass-inline glass-weather-now glass-forecast-now">
      <span className="glass-tile">
        <SkyIcon
          size={40}
          sky={current.condition}
        />
      </span>
      <div>
        <p
          className="glass-figure"
          data-size="4xl"
        >
          {current.temperature}°
        </p>
        <p className="glass-label">{SKY[current.condition].label}</p>
      </div>
    </div>
    <ul
      className="glass-list"
      role="list"
    >
      {forecast.map((day) => (
        <li
          className="glass-event glass-forecast-day"
          key={day.day}
        >
          <SkyIcon
            size={20}
            sky={day.condition}
          />
          <span className="glass-grow glass-truncate">{day.day}</span>
          <span className="glass-meta glass-truncate">{SKY[day.condition].label}</span>
          <span className="glass-temps">
            {day.high}°<span>{day.low}°</span>
          </span>
        </li>
      ))}
    </ul>
  </GlassWidget>
);

interface HourlyWeatherWidgetProps {
  hours: { time: string; temperature: number; condition: Sky }[];
}

export const HourlyWeatherWidget = ({ hours }: HourlyWeatherWidgetProps) => {
  const temps = hours.map((h) => h.temperature);
  const min = Math.min(...temps);
  // `|| 1` keeps a flat day from dividing by zero.
  const range = Math.max(...temps) - min || 1;

  return (
    <GlassWidget
      size="lg"
      tone="blue"
    >
      <p className="glass-label">24 Hour Forecast</p>
      {hours.length === 0 ? (
        <p className="glass-empty">No hourly data available</p>
      ) : (
        <ol
          className="glass-hourly"
          role="list"
        >
          {hours.map((hour, i) => (
            <li key={hour.time}>
              <div className="glass-hourly-track">
                {/* Never below 10%, so the coldest hour still has a visible bar. */}
                <motion.div
                  animate={{ height: `${Math.max(((hour.temperature - min) / range) * 100, 10)}%` }}
                  className="glass-hourly-bar"
                  initial={{ height: 0 }}
                  transition={{ bounce: 0.2, delay: i * 0.04, type: 'spring', visualDuration: 0.5 }}
                >
                  <span>{hour.temperature}°</span>
                </motion.div>
              </div>
              <SkyIcon
                size={16}
                sky={hour.condition}
              />
              <span className="glass-meta">{hour.time}</span>
            </li>
          ))}
        </ol>
      )}
    </GlassWidget>
  );
};

/** Each day's low-to-high span, placed on one shared scale for the whole week. */
export const ForecastWidget = ({ forecast }: { forecast: ForecastDay[] }) => {
  const min = Math.min(...forecast.map((d) => d.low));
  const range = Math.max(...forecast.map((d) => d.high)) - min || 1;
  const at = (t: number) => `${((t - min) / range) * 100}%`;

  return (
    <GlassWidget tone="amber">
      <h3 className="glass-label glass-gap">{forecast.length}-Day Forecast</h3>
      <ul
        className="glass-list"
        role="list"
      >
        {forecast.map((day) => (
          <li
            className="glass-range-row"
            key={day.day}
          >
            <span className="glass-label">{day.day}</span>
            <SkyIcon
              size={20}
              sky={day.condition}
            />
            <span className="glass-meta">{day.low}°</span>
            <span className="glass-range">
              <span style={{ insetInline: `${at(day.low)} calc(100% - ${at(day.high)})` }} />
            </span>
            <span>{day.high}°</span>
          </li>
        ))}
      </ul>
    </GlassWidget>
  );
};
