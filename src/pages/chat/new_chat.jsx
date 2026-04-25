// NewChatSearch — overlay над списком чатов: поиск ученика по q-параметру в
// /api/v1/users/students/?q=<query> и открытие нового DM.
import React from 'react';
import { ChatIco } from './icons.jsx';
import { searchStudents } from '../../lib/chat.js';
import { nameHue } from './format.js';

export function NewChatSearch({ onPick, onClose }) {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  // Debounced search
  React.useEffect(() => {
    const q = query.trim();
    if (!q) { setResults([]); setError(null); return; }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true); setError(null);
      try {
        const rows = await searchStudents(q, { signal: ctrl.signal });
        setResults(rows);
      } catch (e) {
        if (ctrl.signal.aborted) return;
        setError('Не удалось найти учеников');
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => { ctrl.abort(); clearTimeout(t); };
  }, [query]);

  React.useEffect(() => {
    function onEsc(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 10,
      background: 'rgba(15,23,42,0.18)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '16px',
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 360,
          background: 'white', border: '1px solid var(--line-strong)', borderRadius: 14,
          boxShadow: '0 12px 32px -8px rgba(15,23,42,0.18), 0 2px 6px rgba(15,23,42,0.06)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          maxHeight: 'calc(100% - 32px)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px 6px',
        }}>
          <div style={{ fontSize: 14, fontWeight: 580, color: 'var(--ink)' }}>
            Новый чат
          </div>
          <button
            onClick={onClose} aria-label="Закрыть"
            style={{
              width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'transparent', color: 'var(--mute)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}
          ><ChatIco.x width={14} height={14} /></button>
        </div>

        <div style={{ padding: '0 14px 8px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '0 10px', height: 38, borderRadius: 10,
            background: 'oklch(0.97 0.004 260)', border: '1px solid var(--line)',
          }}>
            <ChatIco.search width={14} height={14} style={{ color: 'var(--mute)' }} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск ученика по имени"
              style={{
                flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
                fontFamily: 'inherit', fontSize: 13.5, color: 'var(--ink)',
              }}
            />
          </div>
        </div>

        <div style={{
          flex: 1, minHeight: 0, overflowY: 'auto', padding: '4px 6px 10px',
        }}>
          {loading && (
            <div style={{ padding: '12px', textAlign: 'center', fontSize: 13, color: 'var(--mute)' }}>
              Ищем…
            </div>
          )}
          {error && !loading && (
            <div style={{ padding: '12px', textAlign: 'center', fontSize: 13, color: 'var(--danger)' }}>
              {error}
            </div>
          )}
          {!loading && !error && query.trim() && results.length === 0 && (
            <div style={{ padding: '20px 12px', textAlign: 'center', fontSize: 13, color: 'var(--mute)' }}>
              Никого не нашли
            </div>
          )}
          {!loading && !query.trim() && (
            <div style={{ padding: '20px 12px', textAlign: 'center', fontSize: 13, color: 'var(--mute)' }}>
              Начните вводить имя ученика
            </div>
          )}
          {!loading && results.map((u) => (
            <StudentRow key={u.id} student={u} onPick={() => onPick(u)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StudentRow({ student, onPick }) {
  const [hover, setHover] = React.useState(false);
  const fn = student.first_name || '';
  const ln = student.last_name || '';
  const name = `${fn} ${ln}`.trim() || student.username;
  const hue = nameHue(name);
  return (
    <button
      onClick={onPick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', borderRadius: 10, fontFamily: 'inherit',
        background: hover ? 'oklch(0.97 0.004 260)' : 'transparent',
        border: 'none', cursor: 'pointer', textAlign: 'left',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: `oklch(0.86 0.08 ${hue})`, color: `oklch(0.32 0.14 ${hue})`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 600, fontSize: 14,
      }}>{name[0]?.toUpperCase()}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13.5, fontWeight: 540, color: 'var(--ink)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{name}</div>
        <div style={{
          fontSize: 11.5, color: 'var(--mute)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>@{student.username}</div>
      </div>
    </button>
  );
}
