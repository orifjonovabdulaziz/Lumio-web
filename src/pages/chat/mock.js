// Mock chat data + tiny shared store for popover→fullpage handoff.
//
// Times are anchored to "now" so the date separators always render as
// Сегодня / Вчера / older. Avoids stale-looking demos.
const now = Date.now();
const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export const ME_ID = 'me';

export const MOCK_TEMPLATES = [
  { id: 't1', text: 'Увидимся завтра в [время]' },
  { id: 't2', text: 'Напомни сдать домашнее задание' },
  { id: 't3', text: 'Отличная работа! 🎉' },
  { id: 't4', text: 'Урок переносится на [дата]' },
  { id: 't5', text: 'Жду тебя на уроке через 10 минут.' },
];

export const MOCK_CHATS = [
  {
    id: 'c1', kind: 'direct', name: 'Марина Иванова', online: true,
    pinned: true, muted: false, archived: false, unread: 2,
    typing: false, lastSeen: null,
    preview: 'Хорошо, тогда до завтра!',
    previewTime: now - 4 * MIN,
    previewSelf: false,
  },
  {
    id: 'c2', kind: 'group', name: 'Алгебра 8А', members: 6,
    pinned: true, muted: false, archived: false, unread: 5,
    typing: 'Тимур',
    preview: 'Тимур: я закончил §3.2',
    previewTime: now - 18 * MIN,
    previewSelf: false,
  },
  {
    id: 'c3', kind: 'direct', name: 'Тимур Рашидов', online: false,
    pinned: false, muted: false, archived: false, unread: 0,
    lastSeen: now - 90 * MIN,
    preview: 'Спасибо, понял!',
    previewTime: now - 90 * MIN,
    previewSelf: false,
    lastStatus: 'read',
  },
  {
    id: 'c4', kind: 'direct', name: 'Саша Смирнов', online: true,
    pinned: false, muted: false, archived: false, unread: 0,
    typing: 'Саша',
    preview: 'печатает…',
    previewTime: now - 2 * MIN,
    previewSelf: false,
  },
  {
    id: 'c5', kind: 'group', name: 'Физика — Пятница', members: 3,
    pinned: false, muted: true, archived: false, unread: 0,
    preview: 'Алёша: я отправил решение',
    previewTime: now - 5 * HOUR,
    previewSelf: false,
  },
  {
    id: 'c6', kind: 'direct', name: 'Алёна Громова', online: false,
    pinned: false, muted: false, archived: false, unread: 0,
    lastSeen: now - 2 * DAY,
    preview: 'Вы: домашнее задание выслала на почту',
    previewTime: now - 26 * HOUR,
    previewSelf: true,
    lastStatus: 'delivered',
  },
  {
    id: 'c7', kind: 'group', name: 'Подготовка к ОГЭ', members: 4,
    pinned: false, muted: false, archived: false, unread: 1,
    preview: 'Кирилл: можно пересдать тест?',
    previewTime: now - 3 * DAY,
    previewSelf: false,
  },
  {
    id: 'c8', kind: 'direct', name: 'Никита Орлов', online: false,
    pinned: false, muted: false, archived: true, unread: 0,
    lastSeen: now - 30 * DAY,
    preview: 'Вы: всего хорошего!',
    previewTime: now - 30 * DAY,
    previewSelf: true,
    lastStatus: 'read',
  },
  {
    id: 'c9', kind: 'direct', name: 'Даня Петров', online: false,
    pinned: false, muted: false, archived: false, unread: 0,
    lastSeen: now - 6 * HOUR,
    preview: 'Вы: ок, до встречи',
    previewTime: now - 6 * HOUR,
    previewSelf: true,
    lastStatus: 'sent',
  },
  {
    id: 'c10', kind: 'direct', name: 'Кирилл Сидоров', online: false,
    pinned: false, muted: false, archived: false, unread: 0,
    lastSeen: now - 4 * DAY,
    preview: 'Хорошо, спасибо!',
    previewTime: now - 4 * DAY,
    previewSelf: false,
  },
];

// Active chat conversation — Марина Иванова (c1), 18 messages of mixed types.
export const MOCK_MESSAGES = {
  c1: [
    { id: 'm1', authorId: 'u1', authorName: 'Марина Иванова', kind: 'text',
      text: 'Здравствуйте! Хотела уточнить по домашнему заданию на завтра.',
      sentAt: now - 26 * HOUR, status: 'read' },
    { id: 'm2', authorId: ME_ID, kind: 'text',
      text: 'Конечно, Марина. Что не получается?',
      sentAt: now - 26 * HOUR + 3 * MIN, status: 'read' },
    { id: 'm3', authorId: 'u1', authorName: 'Марина Иванова', kind: 'text',
      text: 'Третья задача в §3.2 — там про дискриминант. Я попробовала, но получается отрицательный.',
      sentAt: now - 26 * HOUR + 5 * MIN, status: 'read' },
    { id: 'm4', authorId: 'u1', authorName: 'Марина Иванова', kind: 'image',
      url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600',
      caption: 'Вот мои черновики',
      sentAt: now - 26 * HOUR + 6 * MIN, status: 'read' },
    { id: 'm5', authorId: ME_ID, kind: 'text',
      text: 'Посмотрел — у тебя ошибка в раскрытии скобок на втором шаге. Минус потерялся.',
      sentAt: now - 26 * HOUR + 12 * MIN, status: 'read',
      replyTo: { id: 'm4', preview: '📷 Вот мои черновики', authorName: 'Марина Иванова' } },
    { id: 'm6', authorId: 'u1', authorName: 'Марина Иванова', kind: 'text',
      text: 'Аа, точно! Спасибо, сейчас перерешаю.',
      sentAt: now - 26 * HOUR + 15 * MIN, status: 'read',
      reactions: [{ emoji: '👍', count: 1, mine: true }] },

    { id: 'sys1', kind: 'system', text: 'Урок «Алгебра · 8 класс» завершён',
      sentAt: now - 25 * HOUR },

    { id: 'm7', authorId: ME_ID, kind: 'file',
      file: { name: 'Квадратные уравнения §3.2.pdf', size: 248_000, ext: 'PDF' },
      sentAt: now - 25 * HOUR, status: 'read',
      caption: 'Дополнительный разбор — посмотри, если будет время.' },
    { id: 'm8', authorId: 'u1', authorName: 'Марина Иванова', kind: 'text',
      text: 'Хорошо, обязательно посмотрю!',
      sentAt: now - 24 * HOUR, status: 'read' },

    { id: 'm9', authorId: ME_ID, kind: 'lessonLink',
      lesson: { title: 'Алгебра · 8 класс', time: 'завтра в 14:00', roomName: 'Алгебра 8А' },
      sentAt: now - 6 * HOUR, status: 'read' },
    { id: 'm10', authorId: 'u1', authorName: 'Марина Иванова', kind: 'text',
      text: 'Приду! 🙂', sentAt: now - 5 * HOUR, status: 'read' },

    { id: 'm11', authorId: 'u1', authorName: 'Марина Иванова', kind: 'voice',
      voice: { duration: 23, peaks: [0.3, 0.6, 0.4, 0.8, 0.5, 0.7, 0.3, 0.9, 0.5, 0.6, 0.4, 0.7, 0.5, 0.3, 0.6, 0.8, 0.4, 0.5, 0.7, 0.3, 0.6, 0.5, 0.4] },
      sentAt: now - 60 * MIN, status: 'read' },
    { id: 'm12', authorId: ME_ID, kind: 'text',
      text: 'Понял, спасибо за пояснение. Завтра разберём подробнее.',
      sentAt: now - 55 * MIN, status: 'read' },

    { id: 'm13', authorId: ME_ID, kind: 'homework',
      homework: { title: 'Квадратные уравнения — повтор', due: 'до пятницы', state: 'sent' },
      sentAt: now - 30 * MIN, status: 'read' },
    { id: 'm14', authorId: 'u1', authorName: 'Марина Иванова', kind: 'text',
      text: 'Ок, сделаю до четверга.',
      sentAt: now - 25 * MIN, status: 'read',
      reactions: [{ emoji: '🎉', count: 1, mine: true }, { emoji: '👍', count: 2, mine: false }] },

    { id: 'm15', authorId: ME_ID, kind: 'text',
      text: 'Если **будут вопросы** — пиши, я на связи. Можно даже голосом, так быстрее.',
      sentAt: now - 18 * MIN, status: 'read' },
    { id: 'm16', authorId: 'u1', authorName: 'Марина Иванова', kind: 'text',
      text: 'Спасибо, поняла! А ссылка на конспект ещё актуальна? https://lumio.app/notes/3-2',
      sentAt: now - 10 * MIN, status: 'read' },
    { id: 'm17', authorId: ME_ID, kind: 'text',
      text: 'Да, всё там же. Ссылка постоянная.',
      sentAt: now - 8 * MIN, status: 'read' },
    { id: 'm18', authorId: 'u1', authorName: 'Марина Иванова', kind: 'text',
      text: 'Хорошо, тогда до завтра!',
      sentAt: now - 4 * MIN, status: 'read' },
  ],
  c2: [
    { id: 'g1', authorId: 'u3', authorName: 'Тимур Рашидов', kind: 'text',
      text: 'Я закончил §3.2', sentAt: now - 18 * MIN, status: 'read' },
  ],
  c3: [
    { id: 't1', authorId: 'u3', authorName: 'Тимур Рашидов', kind: 'text',
      text: 'Спасибо, понял!', sentAt: now - 90 * MIN, status: 'read' },
  ],
};

export const PINNED_MESSAGES = {
  c1: [{ id: 'm9', preview: '📅 Урок «Алгебра · 8 класс» — завтра в 14:00' }],
};

// ─── Tiny store: popover→fullpage handoff ─────────────────────────────────
let pendingActiveId = null;

export function setPendingActive(id) { pendingActiveId = id; }
export function consumePendingActive() {
  const v = pendingActiveId; pendingActiveId = null; return v;
}
