// Tiny date / size formatters (replaces date-fns to avoid a new dep).
const MONTHS_RU = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

function pad(n) { return n < 10 ? `0${n}` : `${n}`; }

function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

export function formatTime(date) {
  const d = new Date(date);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Compact label for chat list entries: time today, "вчера", "12 мар", "12.03.24"
export function formatRelative(date, now = new Date()) {
  const d = new Date(date);
  const today = startOfDay(now);
  const that = startOfDay(d);
  const diffDays = Math.round((today - that) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return formatTime(d);
  if (diffDays === 1) return 'вчера';
  if (diffDays > 1 && diffDays < 7) {
    const days = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
    return days[d.getDay()];
  }
  if (d.getFullYear() === now.getFullYear()) {
    return `${d.getDate()} ${MONTHS_RU[d.getMonth()]}`;
  }
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${String(d.getFullYear()).slice(2)}`;
}

// "Сегодня" / "Вчера" / "12 марта" — used for date separators in the conversation
const MONTHS_RU_FULL = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

export function formatDateSeparator(date, now = new Date()) {
  const d = new Date(date);
  const today = startOfDay(now);
  const that = startOfDay(d);
  const diffDays = Math.round((today - that) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Сегодня';
  if (diffDays === 1) return 'Вчера';
  return `${d.getDate()} ${MONTHS_RU_FULL[d.getMonth()]}`;
}

// "был(а) в 14:30" / "был(а) вчера"
export function formatLastSeen(date, now = new Date()) {
  const d = new Date(date);
  const today = startOfDay(now);
  const that = startOfDay(d);
  const diffDays = Math.round((today - that) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return `был(а) в ${formatTime(d)}`;
  if (diffDays === 1) return 'был(а) вчера';
  if (diffDays < 7) return `был(а) ${diffDays} дн. назад`;
  return `был(а) ${d.getDate()} ${MONTHS_RU[d.getMonth()]}`;
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

// Pluralize "учеников" / "участника" / etc. — duplicated from teacher.jsx kept tiny.
export function pluralize(n, [one, few, many]) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}

// Same hue derivation as LetterAvatar in teacher.jsx — used for consistent colors.
export function nameHue(name) {
  return Array.from(name || '?').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
}
