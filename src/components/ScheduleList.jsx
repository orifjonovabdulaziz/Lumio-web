// Read-only render of a room's weekly schedule.
import React from 'react';
import { weekdayShort, weekdayLong } from './WeekdayLabel.jsx';

function trimSeconds(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  return `${h}:${m}`;
}

export function formatSlot(slot, { long = false } = {}) {
  const day = long ? weekdayLong(slot.weekday) : weekdayShort(slot.weekday);
  return `${day} ${trimSeconds(slot.start_time)}–${trimSeconds(slot.end_time)}`;
}

export function ScheduleList({ schedules, timezone, long = true, empty = 'Расписание не задано' }) {
  if (!schedules || schedules.length === 0) {
    return <div style={{ color: 'var(--mute)', fontSize: 13.5 }}>{empty}</div>;
  }
  const sorted = [...schedules].sort((a, b) => {
    if (a.weekday !== b.weekday) return a.weekday - b.weekday;
    return (a.start_time || '').localeCompare(b.start_time || '');
  });
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {sorted.map((s) => (
        <li key={s.id ?? `${s.weekday}-${s.start_time}`} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 14, color: 'var(--ink-soft)',
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: long ? 'auto' : 28, minWidth: long ? 110 : 28,
            padding: long ? '3px 10px' : 0,
            height: 22, borderRadius: 6,
            background: 'var(--primary-soft)', color: 'var(--primary-ink)',
            fontSize: 12.5, fontWeight: 560,
          }}>{long ? weekdayLong(s.weekday) : weekdayShort(s.weekday)}</span>
          <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 540 }}>
            {trimSeconds(s.start_time)}–{trimSeconds(s.end_time)}
          </span>
          {timezone && (
            <span style={{ color: 'var(--mute)', fontSize: 12.5, marginLeft: 'auto' }}>{timezone}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

// Pick the next upcoming occurrence across all schedule slots, respecting room.timezone.
// Returns null if no schedules. Does not return an absolute Date — only a short label.
export function nextSlotLabel(schedules, timezone) {
  if (!schedules?.length) return null;

  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();

  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    weekday: 'short',
    hour: '2-digit', minute: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
  const wdMap = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  const curWd = wdMap[parts.weekday];
  const curMin = parseInt(parts.hour, 10) * 60 + parseInt(parts.minute, 10);

  let best = null;
  for (const s of schedules) {
    const [h, m] = (s.start_time || '00:00').split(':').map(Number);
    const slotMin = h * 60 + m;
    let daysAhead = (s.weekday - curWd + 7) % 7;
    if (daysAhead === 0 && slotMin <= curMin) daysAhead = 7;
    const totalMin = daysAhead * 24 * 60 + slotMin;
    if (!best || totalMin < best.totalMin) best = { slot: s, totalMin };
  }
  if (!best) return null;

  const hh = String(Math.floor(best.slot.start_time ? parseInt(best.slot.start_time.slice(0, 2), 10) : 0)).padStart(2, '0');
  const mm = best.slot.start_time ? best.slot.start_time.slice(3, 5) : '00';
  return `${weekdayShort(best.slot.weekday)} ${hh}:${mm}`;
}
