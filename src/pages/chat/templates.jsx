// Quick-templates popup — anchored above the message input.
import React from 'react';
import { ChatIco } from './icons.jsx';

export function QuickTemplates({ templates, onPick, onAdd, onClose }) {
  const [draft, setDraft] = React.useState('');

  function commit() {
    const t = draft.trim();
    if (!t) return;
    onAdd(t);
    setDraft('');
  }

  return (
    <div
      role="menu"
      style={{
        position: 'absolute', bottom: 'calc(100% + 8px)', right: 0,
        width: 320, maxWidth: 'calc(100vw - 32px)',
        background: 'white', border: '1px solid var(--line-strong)',
        borderRadius: 14, padding: 8, zIndex: 30,
        boxShadow: '0 12px 32px -8px rgba(15,23,42,0.18), 0 2px 6px rgba(15,23,42,0.06)',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 6px 8px',
      }}>
        <div style={{ fontSize: 12, fontWeight: 580, color: 'var(--ink-soft)',
          textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Быстрые шаблоны
        </div>
        <button
          onClick={onClose}
          aria-label="Закрыть"
          style={{
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: 'var(--mute)', display: 'inline-flex', padding: 2,
          }}
        ><ChatIco.x width={14} height={14} /></button>
      </div>

      <ul style={{
        listStyle: 'none', padding: 0, margin: 0,
        maxHeight: 220, overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 2,
      }}>
        {templates.length === 0 && (
          <li style={{ padding: '10px 8px', fontSize: 13, color: 'var(--mute)', textAlign: 'center' }}>
            Шаблонов пока нет
          </li>
        )}
        {templates.map((t) => (
          <li key={t.id}>
            <TemplateRow text={t.text} onClick={() => onPick(t.text)} />
          </li>
        ))}
      </ul>

      <div style={{ height: 1, background: 'var(--line)', margin: '6px 4px' }} />

      <div style={{ padding: '4px 4px 2px', display: 'flex', gap: 6 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }}
          placeholder="Свой шаблон…"
          style={{
            flex: 1, minWidth: 0, fontFamily: 'inherit', fontSize: 13,
            padding: '8px 10px', borderRadius: 8,
            border: '1px solid var(--line-strong)', outline: 'none',
            background: 'var(--surface)', color: 'var(--ink)',
          }}
        />
        <button
          onClick={commit}
          disabled={!draft.trim()}
          style={{
            padding: '0 12px', borderRadius: 8, fontFamily: 'inherit',
            fontSize: 13, fontWeight: 560, cursor: draft.trim() ? 'pointer' : 'not-allowed',
            background: 'var(--primary)', color: 'white', border: 'none',
            opacity: draft.trim() ? 1 : 0.55,
          }}
        >Добавить</button>
      </div>
    </div>
  );
}

function TemplateRow({ text, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: '100%', textAlign: 'left',
        padding: '8px 10px', borderRadius: 8, fontFamily: 'inherit',
        background: hover ? 'oklch(0.97 0.004 260)' : 'transparent',
        color: 'var(--ink)', border: 'none', cursor: 'pointer', fontSize: 13.5,
        display: 'flex', alignItems: 'center', gap: 8,
      }}
    >
      <ChatIco.zap width={13} height={13} style={{ color: 'var(--primary-soft-ink)', flexShrink: 0 }} />
      <span style={{
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1,
      }}>{text}</span>
    </button>
  );
}
