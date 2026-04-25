// MessageInput — autoresize textarea + emoji + templates + send.
//
// Backend currently accepts only {"content": "..."} — text messages.
// Attach (paperclip) and voice (mic) are rendered as DISABLED buttons with
// "скоро" tooltips. Emoji picker still works since it just inserts unicode.
import React from 'react';
import { ChatIco } from './icons.jsx';
import { QuickTemplates } from './templates.jsx';

const EMOJI_GRID = [
  '😊', '😂', '🥰', '😎', '🤔', '😅', '🙌', '👍',
  '👏', '🙏', '💯', '🔥', '🎉', '💪', '🤝', '✅',
  '❤️', '💜', '⭐', '🌟', '📚', '✍️', '🎯', '✨',
];

export function MessageInput({
  onSend, templates, onAddTemplate, disabled, offline,
  isConnected, pendingSends = 0,
}) {
  const [text, setText] = React.useState('');
  const [emojiOpen, setEmojiOpen] = React.useState(false);
  const [tplOpen, setTplOpen] = React.useState(false);
  const taRef = React.useRef(null);
  const tplWrapRef = React.useRef(null);
  const emojiWrapRef = React.useRef(null);

  // Autoresize the textarea up to ~5 lines.
  React.useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const max = 24 * 5 + 16;
    ta.style.height = Math.min(ta.scrollHeight, max) + 'px';
  }, [text]);

  React.useEffect(() => {
    function onDown(e) {
      if (tplOpen && tplWrapRef.current && !tplWrapRef.current.contains(e.target)) {
        setTplOpen(false);
      }
      if (emojiOpen && emojiWrapRef.current && !emojiWrapRef.current.contains(e.target)) {
        setEmojiOpen(false);
      }
    }
    if (tplOpen || emojiOpen) document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [tplOpen, emojiOpen]);

  function commit() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend({ kind: 'text', text: trimmed });
    // Per integration spec — clear input now; the message appears in the
    // thread when the server broadcasts it back. No optimistic insert.
    setText('');
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      commit();
    }
  }

  const canSend = !disabled && text.trim().length > 0;

  const placeholder = offline
    ? 'Нет соединения…'
    : (isConnected === false
        ? 'Подключаемся…'
        : (disabled ? 'Недоступно' : 'Сообщение'));

  return (
    <div style={{
      borderTop: '1px solid var(--line)', background: 'white',
      padding: '10px 12px', flexShrink: 0,
    }}>
      {pendingSends > 0 && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          margin: '0 0 6px 4px',
          fontSize: 11.5, color: 'var(--mute)',
        }}>
          <span style={{
            width: 10, height: 10, borderRadius: '50%',
            border: '1.5px solid currentColor', borderRightColor: 'transparent',
            display: 'inline-block', animation: 'lumio-spin 0.7s linear infinite',
          }} />
          Отправка…
        </div>
      )}
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 6,
        background: 'oklch(0.98 0.004 260)',
        border: '1px solid var(--line-strong)', borderRadius: 14,
        padding: 6,
      }}>
        {/* Attach — backend doesn't support yet */}
        <button
          disabled
          aria-label="Прикрепить файл — скоро"
          title="Файлы пока не поддерживаются"
          style={disabledIconBtn}
        ><ChatIco.paperclip /></button>

        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={disabled}
          aria-label="Сообщение"
          style={{
            flex: 1, minWidth: 0, resize: 'none',
            border: 'none', outline: 'none', background: 'transparent',
            fontFamily: 'inherit', fontSize: 14.5, lineHeight: 1.5,
            color: 'var(--ink)', padding: '8px 6px',
            maxHeight: 24 * 5 + 16, overflowY: 'auto',
            opacity: disabled ? 0.6 : 1,
          }}
        />

        <div ref={emojiWrapRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setEmojiOpen((v) => !v)}
            disabled={disabled}
            aria-label="Эмодзи" title="Эмодзи"
            style={disabled ? disabledIconBtn : inputIconBtn}
          ><ChatIco.smile /></button>
          {emojiOpen && (
            <EmojiPicker
              onPick={(e) => { setText(text + e); setEmojiOpen(false); taRef.current?.focus(); }}
            />
          )}
        </div>

        <div ref={tplWrapRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setTplOpen((v) => !v)}
            disabled={disabled}
            aria-label="Шаблоны" title="Быстрые шаблоны"
            style={disabled ? disabledIconBtn : inputIconBtn}
          ><ChatIco.template /></button>
          {tplOpen && (
            <QuickTemplates
              templates={templates || []}
              onPick={(t) => { setText(t); setTplOpen(false); taRef.current?.focus(); }}
              onAdd={(t) => onAddTemplate?.(t)}
              onClose={() => setTplOpen(false)}
            />
          )}
        </div>

        {canSend ? (
          <button
            onClick={commit}
            aria-label="Отправить"
            style={{
              ...inputIconBtn,
              background: 'var(--primary)', color: 'white', borderColor: 'var(--primary)',
            }}
          ><ChatIco.send width={15} height={15} /></button>
        ) : (
          /* Mic — backend doesn't support voice messages yet */
          <button
            disabled
            aria-label="Голосовое сообщение — скоро"
            title="Голосовые сообщения пока не поддерживаются"
            style={disabledIconBtn}
          ><ChatIco.mic /></button>
        )}
      </div>
    </div>
  );
}

const inputIconBtn = {
  width: 36, height: 36, borderRadius: 10,
  background: 'transparent', border: '1px solid transparent',
  color: 'var(--ink-soft)', cursor: 'pointer', flexShrink: 0,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'inherit', transition: 'background-color 120ms, color 120ms',
};

const disabledIconBtn = {
  ...inputIconBtn,
  cursor: 'not-allowed', color: 'var(--line-strong)', opacity: 0.65,
};

function EmojiPicker({ onPick }) {
  return (
    <div role="dialog" aria-label="Эмодзи" style={{
      position: 'absolute', bottom: 'calc(100% + 8px)', right: 0,
      width: 220, padding: 8,
      background: 'white', border: '1px solid var(--line-strong)', borderRadius: 12,
      boxShadow: '0 12px 32px -8px rgba(15,23,42,0.18), 0 2px 6px rgba(15,23,42,0.06)',
      zIndex: 30,
      display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 2,
    }}>
      {EMOJI_GRID.map((e) => (
        <button
          key={e}
          onClick={() => onPick(e)}
          aria-label={`Эмодзи ${e}`}
          style={{
            border: 'none', background: 'transparent', cursor: 'pointer',
            padding: 4, fontSize: 18, borderRadius: 6,
          }}
          onMouseEnter={(ev) => { ev.currentTarget.style.background = 'oklch(0.96 0.004 260)'; }}
          onMouseLeave={(ev) => { ev.currentTarget.style.background = 'transparent'; }}
        >{e}</button>
      ))}
    </div>
  );
}
