// Weekday labels. Backend uses ISO: 0 = Monday, 6 = Sunday.

const SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const LONG = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

export function weekdayShort(n) { return SHORT[n] ?? '—'; }
export function weekdayLong(n) { return LONG[n] ?? '—'; }

export function WeekdayLabel({ weekday, long = false }) {
  return <span>{(long ? LONG : SHORT)[weekday] ?? '—'}</span>;
}

export const WEEKDAY_OPTIONS = SHORT.map((short, i) => ({
  value: i,
  short,
  long: LONG[i],
}));
