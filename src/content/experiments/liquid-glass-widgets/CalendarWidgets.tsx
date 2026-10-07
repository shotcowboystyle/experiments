import { ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '~/components/ui/Button';

import type { Tone } from './GlassWidget';
import { GlassWidget, Skeleton, useNow } from './GlassWidget';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MINUTE = 60_000;

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

interface CalendarWidgetProps {
  /** The day treated as today. @default the current date */
  date?: Date;
  onDateSelect?: (date: Date) => void;
}

export const CalendarWidget = ({ date, onDateSelect }: CalendarWidgetProps) => {
  const now = useNow(MINUTE);
  const today = date ?? now;
  // Both start unset and fall back to today, so they need no sync effect.
  const [month, setMonth] = useState<Date>();
  const [selected, setSelected] = useState<Date>();

  if (!today) {
    return (
      <GlassWidget
        size="sm"
        tone="purple"
      >
        <Skeleton height="15rem" />
      </GlassWidget>
    );
  }

  const shown = month ?? new Date(today.getFullYear(), today.getMonth(), 1);
  const picked = selected ?? today;
  const length = new Date(shown.getFullYear(), shown.getMonth() + 1, 0).getDate();
  const step = (by: number) => setMonth(new Date(shown.getFullYear(), shown.getMonth() + by, 1));

  return (
    <GlassWidget
      size="sm"
      tone="purple"
    >
      <div className="glass-row">
        <Button
          aria-label="Previous month"
          icon
          onClick={() => step(-1)}
          size="sm"
          variant="ghost"
        >
          <ChevronLeft size={16} />
        </Button>
        <span
          aria-live="polite"
          className="glass-calendar-title"
        >
          {shown.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </span>
        <Button
          aria-label="Next month"
          icon
          onClick={() => step(1)}
          size="sm"
          variant="ghost"
        >
          <ChevronRight size={16} />
        </Button>
      </div>

      <div className="glass-calendar-grid">
        {WEEKDAYS.map((day) => (
          <abbr
            className="glass-weekday"
            key={day}
            title={day}
          >
            {day[0]}
          </abbr>
        ))}
        {Array.from({ length }, (_, i) => {
          const day = new Date(shown.getFullYear(), shown.getMonth(), i + 1);
          return (
            <button
              aria-current={sameDay(day, today) ? 'date' : undefined}
              aria-label={day.toLocaleDateString('en-US', { dateStyle: 'full' })}
              aria-pressed={sameDay(day, picked)}
              className="glass-day"
              key={i}
              onClick={() => {
                setSelected(day);
                onDateSelect?.(day);
              }}
              // The first of the month starts in its weekday's column; no blank cells.
              style={i === 0 ? { gridColumnStart: day.getDay() + 1 } : undefined}
              type="button"
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </GlassWidget>
  );
};

export const CompactCalendarWidget = ({ date }: { date?: Date }) => {
  const now = useNow(MINUTE);
  const today = date ?? now;

  return (
    <GlassWidget
      className="glass-center"
      tone="purple"
    >
      {today ? (
        <>
          <p className="glass-compact-date">
            <span>{today.toLocaleDateString('en-US', { weekday: 'short' })}</span>
            <span className="glass-accent">{today.toLocaleDateString('en-US', { month: 'short' })}</span>
          </p>
          <p
            className="glass-figure"
            data-size="6xl"
          >
            {today.getDate()}
          </p>
        </>
      ) : (
        <Skeleton height="5.25rem" />
      )}
    </GlassWidget>
  );
};

export interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  /** Colour of the event's side bar. @default "cyan" */
  tone?: Tone;
}

interface EventsCalendarWidgetProps {
  date?: Date;
  events?: CalendarEvent[];
  onAdd?: () => void;
}

export const EventsCalendarWidget = ({ date, events = [], onAdd }: EventsCalendarWidgetProps) => {
  const now = useNow(MINUTE);
  const today = date ?? now;

  return (
    <GlassWidget
      size="lg"
      tone="purple"
    >
      <div className="glass-row glass-events-head">
        {today ? (
          <div>
            <p className="glass-label">{today.toLocaleDateString('en-US', { weekday: 'long' })}</p>
            <p
              className="glass-figure"
              data-size="2xl"
            >
              {today.toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}
            </p>
          </div>
        ) : (
          <Skeleton height="3rem" />
        )}
        <Button
          aria-label="Add event"
          icon
          onClick={onAdd}
          size="sm"
          variant="ghost"
        >
          <Plus size={16} />
        </Button>
      </div>

      {events.length > 0 ? (
        <ul
          className="glass-list"
          role="list"
        >
          {events.map((event) => (
            <li
              className="glass-event"
              key={event.id}
            >
              <span
                className="glass-event-bar"
                data-tone={event.tone ?? 'cyan'}
              />
              <div className="glass-grow">
                <p className="glass-truncate">{event.title}</p>
                <p className="glass-meta">
                  <Clock size={12} />
                  {event.time}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="glass-empty">No events today</p>
      )}
    </GlassWidget>
  );
};
