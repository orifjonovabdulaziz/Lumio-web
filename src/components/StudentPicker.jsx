// Debounced student search with multi-select.
// Props:
//   value:       number[]              currently selected student ids
//   onChange:    (ids, studentsById)   called with next id[] and a map merged from fetched+initial
//   excludeIds?: number[]              ids hidden from result list (e.g. already in roster)
//   initialStudents?: Student[]        to hydrate labels for value ids known up-front
import React from 'react';
import { searchStudents } from '../lib/users.js';
import { Spinner } from '../ui.jsx';

export function StudentPicker({ value = [], onChange, excludeIds = [], initialStudents = [] }) {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [open, setOpen] = React.useState(false);

  // Map of id → student record; merges initialStudents, any results we see, and selected-in-result hits.
  const cacheRef = React.useRef(new Map());
  React.useEffect(() => {
    for (const s of initialStudents) cacheRef.current.set(s.id, s);
  }, [initialStudents]);

  const selectedIds = new Set(value);
  const excludeSet = new Set(excludeIds);

  // Debounce search
  React.useEffect(() => {
    const q = query.trim();
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const t = setTimeout(async () => {
      try {
        const data = await searchStudents({ q, signal: controller.signal });
        for (const s of data.results) cacheRef.current.set(s.id, s);
        setResults(data.results);
      } catch (e) {
        if (e.name !== 'CanceledError' && e.code !== 'ERR_CANCELED') {
          setError('Не удалось загрузить список.');
        }
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => { clearTimeout(t); controller.abort(); };
  }, [query]);

  function toggle(student) {
    cacheRef.current.set(student.id, student);
    const next = selectedIds.has(student.id)
      ? value.filter((id) => id !== student.id)
      : [...value, student.id];
    onChange(next, cacheRef.current);
  }

  function removeSelected(id) {
    onChange(value.filter((x) => x !== id), cacheRef.current);
  }

  const visible = results.filter((s) => !excludeSet.has(s.id));

  return (
    <div style={{ position: 'relative' }}>
      {/* Chips */}
      {value.length > 0 && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8,
        }}>
          {value.map((id) => {
            const s = cacheRef.current.get(id);
            const label = s
              ? `${s.first_name} ${s.last_name}`.trim() || s.username
              : `#${id}`;
            return (
              <span key={id} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'var(--primary-soft)', color: 'var(--primary-soft-ink)',
                borderRadius: 999, padding: '4px 4px 4px 10px', fontSize: 13, fontWeight: 540,
              }}>
                {label}
                <button type="button" onClick={() => removeSelected(id)} aria-label="Убрать"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'inherit', opacity: 0.75, padding: 2, display: 'flex',
                  }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 3l6 6M9 3l-6 6"/></svg>
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Search field */}
      <div style={{ position: 'relative' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Найти ученика по имени, email или username"
          style={{
            width: '100%', height: 46, boxSizing: 'border-box',
            border: '1px solid var(--line-strong)', borderRadius: 12,
            padding: '0 14px 0 40px', background: 'var(--surface)',
            fontSize: 15, fontFamily: 'inherit', color: 'var(--ink)',
            outline: 'none',
          }}
        />
        <span style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--mute)', display: 'flex',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="7" cy="7" r="4.5"/><path d="M11 11l3 3"/></svg>
        </span>
        {loading && (
          <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
            <Spinner size={14} />
          </span>
        )}
      </div>

      {/* Dropdown */}
      {open && (visible.length > 0 || error || (!loading && results.length === 0)) && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6, zIndex: 20,
          background: 'var(--surface)', border: '1px solid var(--line-strong)',
          borderRadius: 12, boxShadow: '0 12px 28px rgba(16,24,40,0.08)',
          maxHeight: 280, overflow: 'auto',
        }}>
          {error && (
            <div style={{ padding: 12, color: 'var(--danger)', fontSize: 13.5 }}>{error}</div>
          )}
          {!error && visible.length === 0 && !loading && (
            <div style={{ padding: 12, color: 'var(--mute)', fontSize: 13.5 }}>
              {query ? 'Ничего не найдено.' : 'Начните вводить имя или username.'}
            </div>
          )}
          {visible.map((s) => {
            const selected = selectedIds.has(s.id);
            const label = `${s.first_name} ${s.last_name}`.trim() || s.username;
            return (
              <button
                key={s.id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); toggle(s); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '10px 12px', textAlign: 'left',
                  background: selected ? 'var(--primary-soft)' : 'transparent',
                  border: 'none', borderBottom: '1px solid var(--line)',
                  fontFamily: 'inherit', cursor: 'pointer', color: 'var(--ink)',
                }}
              >
                <span style={{
                  width: 18, height: 18, borderRadius: 4,
                  border: `1.5px solid ${selected ? 'var(--primary)' : 'var(--line-strong)'}`,
                  background: selected ? 'var(--primary)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {selected && (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.2 5 8.5 9.5 3.5"/></svg>
                  )}
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 540, color: 'var(--ink)' }}>{label}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--mute)' }}>
                    @{s.username}{s.email ? ` · ${s.email}` : ''}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
