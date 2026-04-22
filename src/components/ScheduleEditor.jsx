// Editable list of weekly slots: (weekday, start_time, end_time) rows.
import React from 'react';
import { Button } from '../ui.jsx';
import { WEEKDAY_OPTIONS } from './WeekdayLabel.jsx';

function trimSeconds(t) {
  if (!t) return '';
  return t.length >= 5 ? t.slice(0, 5) : t;
}

export function slotsToPayload(slots) {
  return slots.map((s) => ({
    weekday: Number(s.weekday),
    start_time: trimSeconds(s.start_time),
    end_time: trimSeconds(s.end_time),
  }));
}

export function slotsFromRoom(schedules = []) {
  return schedules.map((s) => ({
    weekday: s.weekday,
    start_time: trimSeconds(s.start_time),
    end_time: trimSeconds(s.end_time),
  }));
}

export function validateSlots(slots) {
  const errors = slots.map(() => ({}));
  slots.forEach((s, i) => {
    if (!s.start_time) errors[i].start_time = 'Укажите начало.';
    if (!s.end_time) errors[i].end_time = 'Укажите конец.';
    if (s.start_time && s.end_time && s.end_time <= s.start_time) {
      errors[i].end_time = 'Конец должен быть позже начала.';
    }
  });
  return errors;
}

// Map server errors of shape { schedules: [{...}, {end_time: ["..."]}] } onto row indices
export function applySlotServerErrors(slots, serverSchedules) {
  if (!Array.isArray(serverSchedules)) return slots.map(() => ({}));
  return slots.map((_, i) => {
    const row = serverSchedules[i];
    if (!row || typeof row !== 'object') return {};
    const out = {};
    for (const [k, v] of Object.entries(row)) {
      out[k] = Array.isArray(v) ? v[0] : String(v);
    }
    return out;
  });
}

export function ScheduleEditor({ value, onChange, errors = [] }) {
  function update(i, patch) {
    const next = value.map((s, idx) => (idx === i ? { ...s, ...patch } : s));
    onChange(next);
  }
  function remove(i) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...value, { weekday: 0, start_time: '10:00', end_time: '11:00' }]);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {value.length === 0 && (
        <div style={{
          padding: '14px 16px', border: '1px dashed var(--line-strong)',
          borderRadius: 12, color: 'var(--mute)', fontSize: 13.5, textAlign: 'center',
        }}>
          Добавьте хотя бы один слот расписания.
        </div>
      )}
      {value.map((slot, i) => {
        const err = errors[i] || {};
        return (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr auto',
            gap: 10, alignItems: 'start',
          }}>
            <div>
              <select
                value={slot.weekday}
                onChange={(e) => update(i, { weekday: Number(e.target.value) })}
                style={selectStyle}
              >
                {WEEKDAY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.long}</option>
                ))}
              </select>
            </div>
            <div>
              <input
                type="time"
                value={trimSeconds(slot.start_time)}
                onChange={(e) => update(i, { start_time: e.target.value })}
                style={{ ...inputStyle, borderColor: err.start_time ? 'var(--danger)' : 'var(--line-strong)' }}
              />
              {err.start_time && <FieldErr msg={err.start_time} />}
            </div>
            <div>
              <input
                type="time"
                value={trimSeconds(slot.end_time)}
                onChange={(e) => update(i, { end_time: e.target.value })}
                style={{ ...inputStyle, borderColor: err.end_time ? 'var(--danger)' : 'var(--line-strong)' }}
              />
              {err.end_time && <FieldErr msg={err.end_time} />}
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="Удалить слот"
              style={{
                height: 46, width: 46, borderRadius: 12,
                background: 'var(--surface)', border: '1px solid var(--line-strong)',
                color: 'var(--mute)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M3 5h10M6 5V3h4v2M5 5l.6 8a1 1 0 0 0 1 .9h2.8a1 1 0 0 0 1-.9L11 5"/>
              </svg>
            </button>
          </div>
        );
      })}
      <div>
        <Button type="button" size="sm" variant="soft" onClick={add}
          leftIcon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M8 3v10M3 8h10"/></svg>}
        >
          Добавить слот
        </Button>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', height: 46,
  border: '1px solid var(--line-strong)', borderRadius: 12,
  padding: '0 12px', background: 'var(--surface)',
  fontSize: 15, fontFamily: 'inherit', color: 'var(--ink)',
  outline: 'none',
};

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none' stroke='%237b7f86' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'><path d='M3 4.5 6 7.5 9 4.5'/></svg>\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: 32,
};

function FieldErr({ msg }) {
  return (
    <div role="alert" style={{ fontSize: 12.5, color: 'var(--danger)', marginTop: 4 }}>
      {msg}
    </div>
  );
}
