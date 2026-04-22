// /rooms — dashboard listing rooms the user is in.
import React from 'react';
import { useRouter } from '../../router.jsx';
import { useAuth } from '../../lib/auth.js';
import { listRooms } from '../../lib/rooms.js';
import { Button, Card, Spinner } from '../../ui.jsx';
import { nextSlotLabel } from '../../components/ScheduleList.jsx';
import { RoomsTopBar, CenteredMessage } from './shared.jsx';

export function RoomsListPage() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [state, setState] = React.useState({ loading: true, rooms: [], error: null });
  const isTeacher = user?.role === 'teacher';

  React.useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    listRooms({ signal: controller.signal })
      .then((data) => setState({ loading: false, rooms: data.results || [], error: null }))
      .catch((err) => {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
        setState({ loading: false, rooms: [], error: 'Не удалось загрузить список комнат.' });
      });
    return () => controller.abort();
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
      <RoomsTopBar
        crumbs={[{ label: 'Мои комнаты' }]}
        right={isTeacher && (
          <Button size="sm" onClick={() => navigate('/rooms/new')}
            leftIcon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M8 3v10M3 8h10"/></svg>}
          >
            Создать комнату
          </Button>
        )}
      />

      <main style={{
        flex: 1, padding: 'clamp(28px, 4vw, 48px) clamp(20px, 3vw, 32px)',
        maxWidth: 1100, margin: '0 auto', width: '100%', boxSizing: 'border-box',
      }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            margin: 0, fontSize: 'clamp(28px, 3vw, 36px)', fontWeight: 620,
            letterSpacing: '-0.025em', color: 'var(--ink)',
          }}>
            {isTeacher ? 'Мои комнаты' : 'Мои уроки'}
          </h1>
          <p style={{ margin: '8px 0 0', color: 'var(--mute)', fontSize: 15 }}>
            {isTeacher
              ? 'Создавайте комнаты, управляйте расписанием и ростером.'
              : 'Комнаты, к которым вас подключил преподаватель.'}
          </p>
        </div>

        {state.loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48, color: 'var(--mute)' }}>
            <Spinner size={18} />
          </div>
        )}

        {!state.loading && state.error && (
          <CenteredMessage title="Ошибка загрузки" body={state.error} />
        )}

        {!state.loading && !state.error && state.rooms.length === 0 && (
          <EmptyState isTeacher={isTeacher} onCreate={() => navigate('/rooms/new')} />
        )}

        {!state.loading && !state.error && state.rooms.length > 0 && (
          <div style={{
            display: 'grid', gap: 16,
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          }}>
            {state.rooms.map((r) => (
              <RoomCard key={r.id} room={r} isTeacher={isTeacher}
                onOpen={() => navigate(`/rooms/${r.name}`)}
                onEdit={() => navigate(`/rooms/${r.name}/edit`)}
                onJoin={() => navigate(`/rooms/${r.name}/live`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function RoomCard({ room, isTeacher, onOpen, onEdit, onJoin }) {
  const ownerIsMe = isTeacher && room.created_by?.role === 'teacher';
  const next = nextSlotLabel(room.schedules, room.timezone);
  const studentCount = room.students?.length ?? 0;
  const cap = room.max_participants;

  return (
    <Card style={{
      padding: 18, display: 'flex', flexDirection: 'column', gap: 12,
      cursor: 'pointer',
    }} onClick={onOpen}>
      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 16, fontWeight: 580, color: 'var(--ink)',
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{room.title}</div>
          {room.subject && (
            <div style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 2 }}>{room.subject}</div>
          )}
        </div>
        {!room.is_active && (
          <span style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 999,
            background: 'oklch(0.96 0.01 25)', color: 'var(--danger)', fontWeight: 540,
          }}>архив</span>
        )}
      </div>

      <div style={{ fontSize: 13, color: 'var(--ink-soft)', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {next ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 1"/>
            </svg>
            <span>Ближайший: <strong style={{ fontWeight: 560 }}>{next}</strong></span>
            <span style={{ color: 'var(--mute)', marginLeft: 4 }}>· {room.timezone}</span>
          </div>
        ) : (
          <div style={{ color: 'var(--mute)' }}>Расписание не задано</div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--mute)' }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="6" cy="6" r="2.5"/><path d="M2 13a4 4 0 0 1 8 0"/><circle cx="11.5" cy="5.5" r="2"/><path d="M11 13a3.3 3.3 0 0 1 3.5-3"/>
          </svg>
          {studentCount}{cap ? ` / ${cap}` : ''} {pluralStudents(studentCount)}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <Button size="sm" variant="primary" onClick={onJoin} fullWidth>Войти в урок</Button>
        {isTeacher && ownerIsMe && (
          <Button size="sm" variant="secondary" onClick={onEdit} aria-label="Редактировать">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M11 2l3 3-8 8H3v-3z"/></svg>
          </Button>
        )}
      </div>
    </Card>
  );
}

function EmptyState({ isTeacher, onCreate }) {
  return (
    <Card style={{
      padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 14,
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: 'var(--primary-soft)', color: 'var(--primary-ink)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="6" width="14" height="12" rx="2"/><path d="M17 10l4-2v8l-4-2"/>
        </svg>
      </div>
      <div>
        <div style={{ fontSize: 17, fontWeight: 580, color: 'var(--ink)' }}>
          {isTeacher ? 'Пока нет комнат' : 'Вас ещё никуда не подключили'}
        </div>
        <div style={{ color: 'var(--mute)', fontSize: 14, marginTop: 4, maxWidth: 360 }}>
          {isTeacher
            ? 'Создайте первую комнату — задайте расписание и пригласите учеников.'
            : 'Попросите преподавателя добавить вас в свою комнату.'}
        </div>
      </div>
      {isTeacher && <Button onClick={onCreate}>Создать комнату</Button>}
    </Card>
  );
}

function pluralStudents(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'ученик';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'ученика';
  return 'учеников';
}
