// /rooms/:name — room details, schedule, roster management.
import React from 'react';
import { useRouter } from '../../router.jsx';
import { useAuth } from '../../lib/auth.js';
import {
  getRoom, getRoster, addStudents, removeStudent, deleteRoom,
} from '../../lib/rooms.js';
import { Button, Card, Spinner, Toast } from '../../ui.jsx';
import { ScheduleList } from '../../components/ScheduleList.jsx';
import { StudentPicker } from '../../components/StudentPicker.jsx';
import { RoomsTopBar, CenteredMessage, isNotFound } from './shared.jsx';

export function RoomDetailPage({ name }) {
  const { navigate } = useRouter();
  const { user } = useAuth();

  const [room, setRoom] = React.useState(null);
  const [roster, setRoster] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [newIds, setNewIds] = React.useState([]);
  const [adding, setAdding] = React.useState(false);
  const [addError, setAddError] = React.useState(null);

  const isCreator = user && room && room.created_by?.id === user.id;

  const loadAll = React.useCallback(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    Promise.all([getRoom(name, { signal: controller.signal }), getRoster(name, { signal: controller.signal })])
      .then(([r, roster]) => {
        setRoom(r);
        setRoster(roster);
      })
      .catch((err) => {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
        setError(isNotFound(err) ? '404' : 'load');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [name]);

  React.useEffect(() => loadAll(), [loadAll]);

  async function onAddStudents() {
    if (newIds.length === 0) { setAddOpen(false); return; }
    setAdding(true);
    setAddError(null);
    try {
      const next = await addStudents(name, newIds);
      setRoster(next);
      setNewIds([]);
      setAddOpen(false);
      setToast({ kind: 'success', msg: `Добавлено: ${newIds.length}` });
    } catch (err) {
      const data = err.response?.data;
      if (data?.student_ids) {
        setAddError(Array.isArray(data.student_ids) ? data.student_ids[0] : String(data.student_ids));
      } else {
        setAddError('Не удалось добавить учеников.');
      }
    } finally {
      setAdding(false);
    }
  }

  async function onRemoveStudent(id) {
    try {
      await removeStudent(name, id);
      setRoster((cur) => cur.filter((s) => s.id !== id));
      setToast({ kind: 'info', msg: 'Ученик убран из комнаты' });
    } catch {
      setToast({ kind: 'error', msg: 'Не удалось удалить ученика' });
    }
  }

  async function onDeleteRoom() {
    if (!confirm('Удалить комнату? Это действие нельзя отменить.')) return;
    try {
      await deleteRoom(name);
      navigate('/rooms', { replace: true });
    } catch {
      setToast({ kind: 'error', msg: 'Не удалось удалить комнату' });
    }
  }

  if (error === '404') {
    return (
      <>
        <RoomsTopBar crumbs={[{ label: 'Мои комнаты', to: '/rooms' }, { label: name }]} />
        <CenteredMessage
          title="Комната не найдена"
          body="Возможно, её удалили или у вас нет доступа."
          action={<Button onClick={() => navigate('/rooms')}>К списку комнат</Button>}
        />
      </>
    );
  }
  if (error) {
    return (
      <>
        <RoomsTopBar crumbs={[{ label: 'Мои комнаты', to: '/rooms' }]} />
        <CenteredMessage
          title="Не удалось загрузить"
          body="Проверьте соединение и попробуйте ещё раз."
          action={<Button onClick={loadAll}>Повторить</Button>}
        />
      </>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
        <RoomsTopBar crumbs={[{ label: 'Мои комнаты', to: '/rooms' }, { label: name }]} />
        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><Spinner size={18} /></div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <RoomsTopBar
        crumbs={[{ label: 'Мои комнаты', to: '/rooms' }, { label: room.title }]}
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            {isCreator && (
              <Button size="sm" variant="secondary" onClick={() => navigate(`/rooms/${name}/edit`)}>
                Редактировать
              </Button>
            )}
            <Button size="sm" onClick={() => navigate(`/rooms/${name}/live`)}>
              Войти в урок
            </Button>
          </div>
        }
      />

      {toast && <Toast kind={toast.kind} onClose={() => setToast(null)}>{toast.msg}</Toast>}

      <main style={{
        padding: 'clamp(28px, 4vw, 48px) clamp(20px, 3vw, 32px)',
        maxWidth: 960, margin: '0 auto', width: '100%', boxSizing: 'border-box',
        display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 24,
      }} className="lumio-room-detail">
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          <div>
            <h1 style={{
              margin: 0, fontSize: 'clamp(28px, 3vw, 36px)', fontWeight: 620,
              letterSpacing: '-0.025em', color: 'var(--ink)', textWrap: 'balance',
            }}>{room.title}</h1>
            <div style={{ color: 'var(--mute)', fontSize: 14, marginTop: 6, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span>@{room.name}</span>
              {room.subject && <><span>·</span><span>{room.subject}</span></>}
              <span>·</span>
              <span>{room.timezone}</span>
            </div>
            {room.description && (
              <p style={{ color: 'var(--ink-soft)', fontSize: 15, lineHeight: 1.55, marginTop: 12 }}>
                {room.description}
              </p>
            )}
          </div>

          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 11.5, fontWeight: 560, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Расписание
            </div>
            <ScheduleList schedules={room.schedules} timezone={room.timezone} />
          </Card>

          {(room.starts_on || room.ends_on || room.max_participants) && (
            <Card style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11.5, fontWeight: 560, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Параметры
              </div>
              {room.starts_on && <InfoRow label="Начало" value={room.starts_on} />}
              {room.ends_on && <InfoRow label="Окончание" value={room.ends_on} />}
              {room.max_participants && <InfoRow label="Макс. участников" value={room.max_participants} />}
            </Card>
          )}

          {isCreator && (
            <Card style={{ padding: 20 }}>
              <div style={{ fontSize: 11.5, fontWeight: 560, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Опасная зона
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, fontSize: 13.5, color: 'var(--mute)' }}>
                  Удаление комнаты необратимо. Ростер и расписание будут стёрты.
                </div>
                <Button size="sm" variant="danger" onClick={onDeleteRoom}>Удалить</Button>
              </div>
            </Card>
          )}
        </div>

        {/* Right column — roster */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <Card style={{ padding: 20 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12,
            }}>
              <div style={{ fontSize: 11.5, fontWeight: 560, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Ученики
              </div>
              {isCreator && !addOpen && (
                <Button size="sm" variant="soft" onClick={() => setAddOpen(true)}
                  leftIcon={<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M8 3v10M3 8h10"/></svg>}
                >Добавить</Button>
              )}
            </div>

            {addOpen && isCreator && (
              <div style={{ marginBottom: 14, padding: 12, background: 'oklch(0.98 0.003 260)', borderRadius: 10 }}>
                <StudentPicker
                  value={newIds}
                  onChange={setNewIds}
                  excludeIds={roster.map((s) => s.id)}
                />
                {addError && (
                  <div role="alert" style={{ fontSize: 13, color: 'var(--danger)', marginTop: 8 }}>{addError}</div>
                )}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
                  <Button size="sm" variant="ghost" onClick={() => { setAddOpen(false); setNewIds([]); setAddError(null); }}>
                    Отмена
                  </Button>
                  <Button size="sm" onClick={onAddStudents} loading={adding} disabled={newIds.length === 0}>
                    Добавить{newIds.length ? ` (${newIds.length})` : ''}
                  </Button>
                </div>
              </div>
            )}

            {roster.length === 0 ? (
              <div style={{ color: 'var(--mute)', fontSize: 13.5, textAlign: 'center', padding: '20px 0' }}>
                Пока никого нет
              </div>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {roster.map((s) => (
                  <li key={s.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 10,
                    background: 'oklch(0.99 0.003 260)',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'var(--primary-soft)', color: 'var(--primary-ink)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 600, fontSize: 13, flexShrink: 0,
                    }}>{(s.first_name || s.username || '?')[0]?.toUpperCase()}</div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 540, color: 'var(--ink)' }}>
                        {`${s.first_name || ''} ${s.last_name || ''}`.trim() || s.username}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--mute)' }}>@{s.username}</div>
                    </div>
                    {isCreator && (
                      <button
                        type="button"
                        onClick={() => onRemoveStudent(s.id)}
                        aria-label="Убрать из комнаты"
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--mute)', padding: 6, display: 'flex',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 5h10M6 5V3h4v2M5 5l.6 8a1 1 0 0 0 1 .9h2.8a1 1 0 0 0 1-.9L11 5"/></svg>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {room.created_by && (
            <Card style={{ padding: 16 }}>
              <div style={{ fontSize: 11.5, fontWeight: 560, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Преподаватель
              </div>
              <div style={{ fontSize: 14, fontWeight: 540, color: 'var(--ink)' }}>
                {`${room.created_by.first_name || ''} ${room.created_by.last_name || ''}`.trim() || room.created_by.username}
              </div>
              <div style={{ fontSize: 12, color: 'var(--mute)' }}>@{room.created_by.username}</div>
            </Card>
          )}
        </aside>
      </main>

      <style>{`
        @media (max-width: 860px) {
          .lumio-room-detail { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
      <span style={{ color: 'var(--mute)' }}>{label}</span>
      <span style={{ color: 'var(--ink)', fontWeight: 540, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}
