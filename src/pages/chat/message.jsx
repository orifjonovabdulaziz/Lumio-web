// MessageBubble — renders a single message with all supported content types.
import React from 'react';
import { ChatIco } from './icons.jsx';
import { formatTime, formatFileSize, nameHue } from './format.js';
import { ME_ID } from './mock.js';

// ─── Avatar (small) ────────────────────────────────────────────────────────
function Avatar({ name, size = 28 }) {
  const hue = nameHue(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `oklch(0.86 0.08 ${hue})`, color: `oklch(0.32 0.14 ${hue})`,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 600, fontSize: size * 0.42,
    }}>
      {(name || '?')[0]?.toUpperCase()}
    </div>
  );
}

// ─── Status tick (own messages only) ───────────────────────────────────────
function StatusTick({ status }) {
  if (status === 'sending') {
    return <ChatIco.clock width={12} height={12} style={{ color: 'rgba(255,255,255,0.7)' }} />;
  }
  if (status === 'failed') {
    return <ChatIco.alertCircle width={12} height={12} style={{ color: '#fca5a5' }} />;
  }
  if (status === 'read') {
    return <ChatIco.doubleCheck width={14} height={14} style={{ color: '#a5b4fc' }} />;
  }
  if (status === 'delivered') {
    return <ChatIco.doubleCheck width={14} height={14} style={{ color: 'rgba(255,255,255,0.7)' }} />;
  }
  return <ChatIco.check width={14} height={14} style={{ color: 'rgba(255,255,255,0.7)' }} />;
}

// ─── Reactions row ─────────────────────────────────────────────────────────
function Reactions({ reactions, onToggle }) {
  if (!reactions?.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
      {reactions.map((r) => (
        <button
          key={r.emoji}
          onClick={() => onToggle?.(r.emoji)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            padding: '2px 7px', borderRadius: 999,
            border: r.mine ? '1px solid var(--primary-edge)' : '1px solid var(--line)',
            background: r.mine ? 'var(--primary-soft)' : 'white',
            color: r.mine ? 'var(--primary-soft-ink)' : 'var(--ink-soft)',
            fontFamily: 'inherit', fontSize: 11.5, fontWeight: 540,
            cursor: 'pointer',
          }}
          aria-label={`Реакция ${r.emoji} (${r.count})`}
        >
          <span style={{ fontSize: 12 }}>{r.emoji}</span>
          <span>{r.count}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Reply quote ───────────────────────────────────────────────────────────
function ReplyQuote({ replyTo, isMine }) {
  if (!replyTo) return null;
  return (
    <div style={{
      borderLeft: `3px solid ${isMine ? 'rgba(255,255,255,0.6)' : 'var(--primary)'}`,
      padding: '4px 8px', marginBottom: 6, borderRadius: 4,
      background: isMine ? 'rgba(255,255,255,0.12)' : 'var(--primary-soft)',
      maxWidth: '100%', minWidth: 0,
    }}>
      <div style={{
        fontSize: 11.5, fontWeight: 580,
        color: isMine ? 'rgba(255,255,255,0.9)' : 'var(--primary-soft-ink)',
      }}>{replyTo.authorName || 'Сообщение'}</div>
      <div style={{
        fontSize: 12, color: isMine ? 'rgba(255,255,255,0.85)' : 'var(--ink-soft)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{replyTo.preview}</div>
    </div>
  );
}

// ─── Inline rich-text rendering ────────────────────────────────────────────
// Supports **bold**, *italic*, http(s) links, line breaks. Not a full markdown.
function renderInline(text, isMine) {
  const out = [];
  const lines = String(text).split('\n');
  lines.forEach((line, li) => {
    if (li > 0) out.push(<br key={`br-${li}`} />);
    let i = 0;
    const linkRe = /(https?:\/\/[^\s]+)/g;
    line.replace(linkRe, (url, _u, idx) => {
      if (idx > i) out.push(...inlineFmt(line.slice(i, idx), `${li}-${idx}-pre`));
      out.push(
        <a key={`a-${li}-${idx}`} href={url} target="_blank" rel="noopener noreferrer"
           style={{
             color: isMine ? '#fff' : 'var(--primary-ink)',
             textDecoration: 'underline', wordBreak: 'break-all',
           }}>
          {url}
        </a>
      );
      i = idx + url.length;
      return url;
    });
    if (i < line.length) out.push(...inlineFmt(line.slice(i), `${li}-tail`));
  });
  return out;
}

function inlineFmt(s, key) {
  // **bold** then *italic*
  const out = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let last = 0, m;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) out.push(s.slice(last, m.index));
    if (m[2]) out.push(<strong key={`b-${key}-${m.index}`} style={{ fontWeight: 620 }}>{m[2]}</strong>);
    else if (m[3]) out.push(<em key={`i-${key}-${m.index}`} style={{ fontStyle: 'italic' }}>{m[3]}</em>);
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out.length ? out : [s];
}

// ─── Content type renderers ────────────────────────────────────────────────
function FileBlock({ file, isMine, onDownload }) {
  return (
    <button
      onClick={onDownload}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', borderRadius: 12,
        background: isMine ? 'rgba(255,255,255,0.14)' : 'white',
        border: `1px solid ${isMine ? 'rgba(255,255,255,0.18)' : 'var(--line)'}`,
        color: isMine ? '#fff' : 'var(--ink)', cursor: 'pointer',
        fontFamily: 'inherit', textAlign: 'left', minWidth: 220, maxWidth: '100%',
      }}
    >
      <span style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: isMine ? 'rgba(255,255,255,0.18)' : 'var(--primary-soft)',
        color: isMine ? '#fff' : 'var(--primary-soft-ink)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
      }}>{file.ext || <ChatIco.file width={16} height={16} />}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          display: 'block', fontSize: 13.5, fontWeight: 560,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{file.name}</span>
        <span style={{
          display: 'block', fontSize: 11.5,
          color: isMine ? 'rgba(255,255,255,0.75)' : 'var(--mute)',
        }}>{formatFileSize(file.size || 0)}</span>
      </span>
      <ChatIco.download width={16} height={16} />
    </button>
  );
}

function ImageBlock({ url, caption, onZoom }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <button
        onClick={onZoom}
        style={{
          padding: 0, border: 'none', background: 'transparent', cursor: 'zoom-in',
          borderRadius: 12, overflow: 'hidden', display: 'block', maxWidth: 280,
        }}
        aria-label="Открыть изображение"
      >
        <img src={url} alt={caption || 'Изображение'} style={{
          display: 'block', width: '100%', height: 'auto', maxHeight: 240, objectFit: 'cover',
        }} />
      </button>
      {caption && <div style={{ fontSize: 13.5 }}>{caption}</div>}
    </div>
  );
}

function VoiceBlock({ voice, isMine }) {
  const [playing, setPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const ref = React.useRef(null);
  // Fake playback animation (no real audio in mock).
  React.useEffect(() => {
    if (!playing) return;
    let t = progress;
    ref.current = setInterval(() => {
      t += 0.05;
      if (t >= 1) { t = 1; clearInterval(ref.current); setPlaying(false); }
      setProgress(t);
    }, voice.duration * 50);
    return () => clearInterval(ref.current);
  }, [playing, voice.duration]);

  const peaks = voice.peaks || [];
  const seenIdx = Math.floor(progress * peaks.length);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      minWidth: 220, padding: '6px 4px',
    }}>
      <button
        onClick={() => { if (progress >= 1) setProgress(0); setPlaying((v) => !v); }}
        aria-label={playing ? 'Пауза' : 'Воспроизвести'}
        style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: isMine ? 'rgba(255,255,255,0.18)' : 'var(--primary)',
          color: isMine ? '#fff' : '#fff',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', cursor: 'pointer',
        }}
      >
        {playing ? <ChatIco.pause width={14} height={14} /> : <ChatIco.play width={14} height={14} />}
      </button>
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', gap: 2, height: 28,
      }}>
        {peaks.map((p, i) => (
          <span key={i} style={{
            width: 2, height: `${Math.max(4, p * 24)}px`, borderRadius: 1,
            background: i < seenIdx
              ? (isMine ? '#fff' : 'var(--primary)')
              : (isMine ? 'rgba(255,255,255,0.45)' : 'var(--line-strong)'),
            transition: 'background 120ms',
          }} />
        ))}
      </div>
      <span style={{
        fontSize: 11.5, fontVariantNumeric: 'tabular-nums', flexShrink: 0,
        color: isMine ? 'rgba(255,255,255,0.85)' : 'var(--mute)',
      }}>0:{String(voice.duration).padStart(2, '0')}</span>
    </div>
  );
}

function HomeworkBlock({ homework, isMine }) {
  const stateMap = {
    sent:     { label: 'Отправлено',    bg: 'oklch(0.94 0.05 155)', fg: 'oklch(0.45 0.14 155)' },
    pending:  { label: 'Ожидает сдачи', bg: 'oklch(0.96 0.004 260)', fg: 'var(--mute)' },
    submitted:{ label: 'Сдано',         bg: 'var(--primary-soft)',   fg: 'var(--primary-soft-ink)' },
  };
  const s = stateMap[homework.state] || stateMap.pending;
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 240,
      padding: '10px 12px', borderRadius: 12,
      background: isMine ? 'rgba(255,255,255,0.14)' : 'white',
      border: `1px solid ${isMine ? 'rgba(255,255,255,0.18)' : 'var(--line)'}`,
      color: isMine ? '#fff' : 'var(--ink)',
    }}>
      <span style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: isMine ? 'rgba(255,255,255,0.18)' : 'var(--primary-soft)',
        color: isMine ? '#fff' : 'var(--primary-soft-ink)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}><ChatIco.file width={15} height={15} /></span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 540,
          color: isMine ? 'rgba(255,255,255,0.75)' : 'var(--mute)',
          textTransform: 'uppercase', letterSpacing: '0.06em' }}>Домашнее задание</div>
        <div style={{ fontSize: 13.5, fontWeight: 560, marginTop: 1 }}>{homework.title}</div>
        <div style={{
          marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 8,
          fontSize: 11.5,
          color: isMine ? 'rgba(255,255,255,0.85)' : 'var(--mute)',
        }}>
          <span>{homework.due}</span>
          <span style={{
            padding: '2px 7px', borderRadius: 999,
            background: isMine ? 'rgba(255,255,255,0.2)' : s.bg,
            color: isMine ? '#fff' : s.fg, fontWeight: 540,
          }}>{s.label}</span>
        </div>
      </div>
    </div>
  );
}

function LessonLinkBlock({ lesson, isMine, onJoin }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, minWidth: 240,
      padding: '10px 12px', borderRadius: 12,
      background: isMine ? 'rgba(255,255,255,0.14)' : 'white',
      border: `1px solid ${isMine ? 'rgba(255,255,255,0.18)' : 'var(--line)'}`,
      color: isMine ? '#fff' : 'var(--ink)',
    }}>
      <span style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: isMine ? 'rgba(255,255,255,0.18)' : 'var(--primary)',
        color: '#fff',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}><ChatIco.video width={16} height={16} /></span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 560 }}>{lesson.title}</div>
        <div style={{
          fontSize: 11.5, marginTop: 1,
          color: isMine ? 'rgba(255,255,255,0.85)' : 'var(--mute)',
        }}>{lesson.time}</div>
      </div>
      <button
        onClick={onJoin}
        style={{
          padding: '6px 12px', borderRadius: 999, fontFamily: 'inherit',
          fontSize: 12, fontWeight: 580, cursor: 'pointer',
          background: isMine ? '#fff' : 'var(--primary)',
          color: isMine ? 'var(--primary-ink)' : '#fff',
          border: 'none', flexShrink: 0,
        }}
      >Войти</button>
    </div>
  );
}

// ─── System message (centred, grey) ────────────────────────────────────────
export function SystemMessage({ text }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'center', margin: '8px 0',
    }}>
      <span style={{
        fontSize: 11.5, fontWeight: 540, color: 'var(--mute)',
        background: 'oklch(0.97 0.004 260)', padding: '4px 10px', borderRadius: 999,
      }}>{text}</span>
    </div>
  );
}

// ─── Bubble ────────────────────────────────────────────────────────────────
export function MessageBubble({
  message,
  showAvatar, showAuthor, showTail, isGroupChat,
  searchQuery, onReply, onReact, onRetry,
}) {
  const isMine = message.authorId === ME_ID;
  const align = isMine ? 'flex-end' : 'flex-start';
  const tailRadius = isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px';
  const flatRadius = '18px';
  const radius = showTail ? tailRadius : flatRadius;

  const bg = isMine ? 'var(--primary)' : 'oklch(0.96 0.004 260)';
  const fg = isMine ? '#fff' : 'var(--ink)';

  // Highlight search matches inside text content
  const highlightedText = (text) => {
    if (!searchQuery || message.kind !== 'text') return renderInline(text, isMine);
    const q = searchQuery.toLowerCase();
    const lower = text.toLowerCase();
    const idx = lower.indexOf(q);
    if (idx === -1) return renderInline(text, isMine);
    return (
      <>
        {renderInline(text.slice(0, idx), isMine)}
        <span style={{
          background: isMine ? 'rgba(255,235,59,0.5)' : 'rgba(250,204,21,0.4)',
          padding: '0 2px', borderRadius: 3,
        }}>{text.slice(idx, idx + q.length)}</span>
        {renderInline(text.slice(idx + q.length), isMine)}
      </>
    );
  };

  // The padding for image/voice bubbles is tighter so the media doesn't get
  // dwarfed by chrome.
  const isMedia = message.kind === 'image' || message.kind === 'voice';
  const padding = isMedia ? '6px 8px' : '8px 12px';

  return (
    <div style={{
      display: 'flex', justifyContent: align, gap: 8,
      padding: '1px 0', alignItems: 'flex-end',
    }}>
      {!isMine && isGroupChat && (
        <div style={{ width: 28, flexShrink: 0 }}>
          {showAvatar && <Avatar name={message.authorName} size={28} />}
        </div>
      )}

      <div style={{
        maxWidth: 'min(560px, 75%)', display: 'flex', flexDirection: 'column',
        alignItems: align,
      }}>
        {showAuthor && !isMine && isGroupChat && (
          <div style={{
            fontSize: 11.5, fontWeight: 580, marginLeft: 4, marginBottom: 2,
            color: `oklch(0.42 0.13 ${nameHue(message.authorName)})`,
          }}>{message.authorName}</div>
        )}

        <div style={{
          background: bg, color: fg, padding, borderRadius: radius,
          boxShadow: '0 1px 1px rgba(15,23,42,0.05)',
          fontSize: 14.5, lineHeight: 1.45,
          wordBreak: 'break-word', overflowWrap: 'anywhere',
          animation: 'lumio-fadein 200ms ease both',
          position: 'relative',
        }}>
          {message.replyTo && <ReplyQuote replyTo={message.replyTo} isMine={isMine} />}

          {message.kind === 'text' && (
            <div>{highlightedText(message.text)}</div>
          )}
          {message.kind === 'file' && (
            <>
              <FileBlock file={message.file} isMine={isMine} onDownload={() => {}} />
              {message.caption && (
                <div style={{ marginTop: 6, fontSize: 13.5 }}>
                  {renderInline(message.caption, isMine)}
                </div>
              )}
            </>
          )}
          {message.kind === 'image' && (
            <ImageBlock url={message.url} caption={message.caption} onZoom={() => {
              window.open(message.url, '_blank', 'noopener,noreferrer');
            }} />
          )}
          {message.kind === 'voice' && (
            <VoiceBlock voice={message.voice} isMine={isMine} />
          )}
          {message.kind === 'homework' && (
            <HomeworkBlock homework={message.homework} isMine={isMine} />
          )}
          {message.kind === 'lessonLink' && (
            <LessonLinkBlock lesson={message.lesson} isMine={isMine} onJoin={() => {}} />
          )}

          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            justifyContent: 'flex-end', marginTop: 4,
            fontSize: 10.5, color: isMine ? 'rgba(255,255,255,0.8)' : 'var(--mute)',
            fontVariantNumeric: 'tabular-nums', userSelect: 'none',
          }}>
            <span>{formatTime(message.sentAt)}</span>
            {isMine && <StatusTick status={message.status} />}
          </div>
        </div>

        <Reactions
          reactions={message.reactions}
          onToggle={(emoji) => onReact?.(message.id, emoji)}
        />

        {message.status === 'failed' && isMine && (
          <button
            onClick={() => onRetry?.(message.id)}
            style={{
              marginTop: 4, fontSize: 11.5, color: 'var(--danger)',
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 4,
            }}
          >
            <ChatIco.rotate width={12} height={12} /> Не отправлено · повторить
          </button>
        )}
      </div>

      {!isMine && onReply && (
        <button
          onClick={() => onReply(message)}
          aria-label="Ответить"
          className="lumio-msg-reply"
          style={{
            opacity: 0, transition: 'opacity 120ms',
            width: 28, height: 28, borderRadius: 8,
            background: 'transparent', border: '1px solid var(--line)',
            cursor: 'pointer', color: 'var(--mute)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        ><ChatIco.reply width={13} height={13} /></button>
      )}
    </div>
  );
}
