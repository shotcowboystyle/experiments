import { Activity, Cpu, DollarSign, Users } from 'lucide-react';

import { CalendarWidget, CompactCalendarWidget, EventsCalendarWidget } from './CalendarWidgets';
import { AnalogClockWidget, DigitalClockWidget, StopwatchWidget, TimerWidget, WorldClockWidget } from './ClockWidgets';
import { CircularProgressStat, ComparisonStat, MetricStat, StatCard } from './StatWidgets';
import type { ForecastDay, Sky } from './WeatherWidgets';
import {
  CurrentWeatherWidget,
  DetailedWeatherWidget,
  ForecastWeatherWidget,
  ForecastWidget,
  HourlyWeatherWidget,
  WeatherWidget,
} from './WeatherWidgets';

const FORECAST: ForecastDay[] = [
  { condition: 'sunny', day: 'Mon', high: 24, low: 15 },
  { condition: 'cloudy', day: 'Tue', high: 21, low: 14 },
  { condition: 'rainy', day: 'Wed', high: 17, low: 12 },
  { condition: 'windy', day: 'Thu', high: 19, low: 11 },
  { condition: 'sunny', day: 'Fri', high: 26, low: 16 },
];

const HOURS: { condition: Sky; temperature: number; time: string }[] = [
  { condition: 'night-cloudy', temperature: 14, time: '6AM' },
  { condition: 'sunny', temperature: 17, time: '9AM' },
  { condition: 'sunny', temperature: 22, time: '12PM' },
  { condition: 'cloudy', temperature: 23, time: '3PM' },
  { condition: 'cloudy', temperature: 19, time: '6PM' },
  { condition: 'night', temperature: 16, time: '9PM' },
];

const usd = new Intl.NumberFormat('en-US', { currency: 'USD', maximumFractionDigits: 0, style: 'currency' });

const LiquidGlassWidgetsDemo = () => (
  <div className="glass-demo">
    <AnalogClockWidget />
    <CurrentWeatherWidget
      condition="sunny"
      feelsLike={24}
      high={26}
      humidity={42}
      location="Lisbon"
      low={17}
      temperature={23}
      windSpeed={12}
    />
    <CalendarWidget />
    <StatCard
      change={{ type: 'increase', value: 12.5 }}
      icon={<Users size={16} />}
      title="Active users"
      tone="purple"
      value="24.8k"
    />
    <StopwatchWidget />
    <DigitalClockWidget />
    <HourlyWeatherWidget hours={HOURS} />
    <ComparisonStat
      current={48_250}
      format={(v) => usd.format(v)}
      icon={<DollarSign size={16} />}
      previous={42_100}
      title="Revenue"
    />
    <EventsCalendarWidget
      events={[
        { id: 'standup', time: '9:30 AM', title: 'Design standup', tone: 'cyan' },
        { id: 'review', time: '1:00 PM', title: 'Glass shader review', tone: 'pink' },
        { id: 'run', time: '6:15 PM', title: 'Evening run', tone: 'green' },
      ]}
    />
    <CompactCalendarWidget />
    <MetricStat
      icon={<Cpu size={16} />}
      label="CPU"
      unit="%"
      value={68}
    />
    <TimerWidget initialMinutes={5} />
    <ForecastWidget forecast={FORECAST} />
    <WorldClockWidget
      clocks={[
        { city: 'New York', timezone: 'America/New_York' },
        { city: 'London', timezone: 'Europe/London' },
        { city: 'Tokyo', timezone: 'Asia/Tokyo' },
      ]}
    />
    <CircularProgressStat
      icon={<Activity size={16} />}
      label="Move goal"
      size="sm"
      tone="pink"
      unit="kcal"
      value={420}
      max={600}
    />
    <WeatherWidget
      condition="rainy"
      location="Seattle"
      temperature={12}
    />
    <DetailedWeatherWidget
      condition="snowy"
      feelsLike={-6}
      humidity={81}
      location="Reykjavík"
      temperature={-2}
      windSpeed={28}
    />
    <ForecastWeatherWidget
      current={{ condition: 'night-cloudy', temperature: 18 }}
      forecast={FORECAST.slice(0, 4)}
      location="San Francisco"
    />
  </div>
);

export default LiquidGlassWidgetsDemo;
