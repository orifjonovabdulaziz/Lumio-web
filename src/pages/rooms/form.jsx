// Shared room form — used by /rooms/new and /rooms/:name/edit.
import React from 'react';
import { useRouter } from '../../router.jsx';
import { useAuth } from '../../lib/auth.js';
import { createRoom, updateRoom, addStudents, getRoom } from '../../lib/rooms.js';
import { Button, Card, FormField, Input, Spinner, Toast } from '../../ui.jsx';
import { StudentPicker } from '../../components/StudentPicker.jsx';
import {
  ScheduleEditor, slotsFromRoom, slotsToPayload, validateSlots, applySlotServerErrors,
} from '../../components/ScheduleEditor.jsx';
import { slugifyTitle, getTimezoneList, browserTimezone, RoomsTopBar, CenteredMessage, isNotFound } from './shared.jsx';

// mode: 'create' | 'edit'
export function RoomForm({ mode, roomName }) {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const isEdit = mode === 'edit';

  const [loading, setLoading] = React.useState(isEdit);
  const [loadError, setLoadError] = React.useState(null);
  const [room, setRoom] = React.useState(null);

  const [form, setForm] = React.useState({
    name: '',
    title: '',
    description: '',
    subject: '',
    timezone: browserTimezone(),
    starts_on: '',
    ends_on: '',
    max_participants: '',
  });
  const [nameTouched, setNameTouched] = React.useState(false);
  const [slots, setSlots] = React.useState([]);
  const [slotsTouched, setSlotsTouched] = React.useState(false);
  const [initialStudentIds, setInitialStudentIds] = React.useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = React.useState([]);
  const [initialStudents, setInitialStudents] = React.useState([]);

  const [errors, setErrors] = React.useState({});
  const [slotErrors, setSlotErrors] = React.useState([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [warning, setWarning] = React.useState(null);
  const [serverError, setServerError] = React.useState(null);

  const timezones = React.useMemo(() => getTimezoneList(), []);

  // Gate teacher-only access on the client (server enforces too)
  React.useEffect(() => {
    if (user && user.role !== 'teacher') navigate('/rooms', { replace: true });
  }, [user, navigate]);

  // Load room data for edit
  React.useEffect(() => {
    if (!isEdit || !roomName) return;
    const controller = new AbortController();
    setLoading(true);
    getRoom(roomName, { signal: controller.signal })
      .then((r) => {
        setRoom(r);
        setForm({
          name: r.name,
          title: r.title || '',
          description: r.description || '',
          subject: r.subject || '',
          timezone: r.timezone || browserTimezone(),
          starts_on: r.starts_on || '',
          ends_on: r.ends_on || '',
          max_participants: r.max_participants ?? '',
        });
        setSlots(slotsFromRoom(r.schedules));
        const ids = (r.students || []).map((s) => s.id);
        setInitialStudentIds(ids);
        setSelectedStudentIds(ids);
        setInitialStudents(r.students || []);
      })
      .catch((err) => {
        if (err.name === 'CanceledError') return;
        setLoadError(isNotFound(err) ? '404' : 'load');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [isEdit, roomName]);

  function upd(k, v) {
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === 'title' && !isEdit && !nameTouched) {
        next.name = slugifyTitle(v);
      }
      return next;
    });
  }

  function validateTop() {
    const e = {};
    if (!form.title.trim()) e.title = 'Укажите заголовок.';
    if (!form.name.trim()) e.name = 'Укажите slug (латиница, цифры, -).';
    else if (!/^[a-z0-9][a-z0-9-]*$/.test(form.name)) e.name = 'Только латиница, цифры и дефис.';
    if (!form.timezone) e.timezone = 'Выберите часовой пояс.';
    if (form.starts_on && form.ends_on && form.ends_on < form.starts_on) {
      e.ends_on = 'Дата окончания не может быть раньше начала.';
    }
    if (form.max_participants !== '' && Number(form.max_participants) < 1) {
      e.max_participants = 'Число должно быть положительным.';
    }
    return e;
  }

  async function onSubmit(e) {
    e.preventDefault();
    const top = validateTop();
    const slotErr = validateSlots(slots);
    const slotHasErr = slotErr.some((r) => Object.keys(r).length > 0);
    setErrors(top);
    setSlotErrors(slotErr);
    if (Object.keys(top).length > 0 || slotHasErr) return;

    setSubmitting(true);
    setServerError(null);
    setWarning(null);

    const payload = {
      name: form.name.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
      subject: form.subject.trim(),
      timezone: form.timezone,
      starts_on: form.starts_on || null,
      ends_on: form.ends_on || null,
      max_participants: form.max_participants === '' ? null : Number(form.max_participants),
    };
    if (!isEdit || slotsTouched) {
      payload.schedules = slotsToPayload(slots);
    }
    // Drop null/'' fields to keep PATCH tidy
    for (const k of Object.keys(payload)) {
      if (payload[k] === null && (k === 'starts_on' || k === 'ends_on' || k === 'max_participants')) continue;
      if (payload[k] === '' || payload[k] === null) delete payload[k];
    }

    try {
      let savedRoom;
      if (isEdit) {
        savedRoom = await updateRoom(roomName, payload);
      } else {
        savedRoom = await createRoom(payload);
      }

      // Roster diff (only on create for now — edit uses the detail page's roster tools)
      if (!isEdit && selectedStudentIds.length > 0) {
        try {
          await addStudents(savedRoom.name, selectedStudentIds);
        } catch {
          setWarning('Комната создана, но не удалось прикрепить учеников. Попробуйте добавить их вручную на странице комнаты.');
          navigate(`/rooms/${savedRoom.name}`);
          return;
        }
      }

      navigate(`/rooms/${savedRoom.name}`);
    } catch (err) {
      handleServerError(err);
    } finally {
      setSubmitting(false);
    }
  }

  function handleServerError(err) {
    const status = err.response?.status;
    const data = err.response?.data;
    if (status === 403) {
      setServerError('Действие доступно только преподавателям.');
      return;
    }
    if (status === 400 && data && typeof data === 'object') {
      const mapped = {};
      for (const [k, v] of Object.entries(data)) {
        if (k === 'schedules') {
          setSlotErrors(applySlotServerErrors(slots, v));
        } else if (k === 'student_ids') {
          mapped.student_ids = Array.isArray(v) ? v[0] : String(v);
        } else {
          mapped[k] = Array.isArray(v) ? v[0] : String(v);
        }
      }
      setErrors((e) => ({ ...e, ...mapped }));
      if (mapped.detail || mapped.non_field_errors) {
        setServerError(mapped.detail || mapped.non_field_errors);
      }
      return;
    }
    setServerError('Не удалось сохранить комнату. Попробуйте снова.');
  }

  if (loadError === '404') {
    return (
      <>
        <RoomsTopBar crumbs={[{ label: 'Мои комнаты', to: '/rooms' }, { label: roomName }]} />
        <CenteredMessage
          title="Комната не найдена"
          body="Возможно, её удалили или у вас больше нет к ней доступа."
          action={<Button onClick={() => navigate('/rooms')}>К списку комнат</Button>}
        />
      </>
    );
  }
  if (loadError) {
    return (
      <>
        <RoomsTopBar crumbs={[{ label: 'Мои комнаты', to: '/rooms' }]} />
        <CenteredMessage
          title="Не удалось загрузить комнату"
          body="Проверьте соединение и попробуйте ещё раз."
          action={<Button onClick={() => navigate('/rooms')}>Назад</Button>}
        />
      </>
    );
  }

  const crumbs = isEdit
    ? [{ label: 'Мои комнаты', to: '/rooms' }, { label: form.title || roomName, to: `/rooms/${roomName}` }, { label: 'Редактирование' }]
    : [{ label: 'Мои комнаты', to: '/rooms' }, { label: 'Новая комната' }];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <RoomsTopBar crumbs={crumbs} />
      {warning && <Toast kind="info" onClose={() => setWarning(null)}>{warning}</Toast>}
      <main style={{
        padding: 'clamp(28px, 4vw, 48px) clamp(20px, 3vw, 32px)',
        maxWidth: 760, margin: '0 auto', width: '100%', boxSizing: 'border-box',
      }}>
        <h1 style={{
          margin: '0 0 24px', fontSize: 'clamp(26px, 3vw, 32px)', fontWeight: 620,
          letterSpacing: '-0.025em', color: 'var(--ink)',
        }}>{isEdit ? 'Редактирование комнаты' : 'Новая комната'}</h1>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={18} /></div>
        ) : (
          <form onSubmit={onSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            <Card style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <SectionTitle>Основное</SectionTitle>

              <FormField label="Название" error={errors.title} required>
                <Input value={form.title} onChange={(e) => upd('title', e.target.value)} placeholder="Например, «Math 101»" />
              </FormField>

              <FormField label="Slug (идентификатор)" hint="Используется в URL и для LiveKit. Латиница, цифры, дефисы." error={errors.name} required>
                <Input
                  value={form.name}
                  onChange={(e) => { setNameTouched(true); upd('name', e.target.value.toLowerCase()); }}
                  onBlur={() => setNameTouched(true)}
                  placeholder="math-101"
                  disabled={isEdit}
                />
              </FormField>

              <FormField label="Предмет" error={errors.subject}>
                <Input value={form.subject} onChange={(e) => upd('subject', e.target.value)} placeholder="Математика" />
              </FormField>

              <FormField label="Описание" error={errors.description}>
                <textarea
                  value={form.description}
                  onChange={(e) => upd('description', e.target.value)}
                  rows={3}
                  style={{
                    width: '100%', minHeight: 80, padding: '12px 14px',
                    border: '1px solid var(--line-strong)', borderRadius: 12,
                    background: 'var(--surface)', fontSize: 15, fontFamily: 'inherit',
                    color: 'var(--ink)', outline: 'none', resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                  placeholder="Краткое описание урока"
                />
              </FormField>
            </Card>

            <Card style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <SectionTitle>Когда</SectionTitle>

              <FormField label="Часовой пояс" hint="Расписание задаётся в этом поясе" error={errors.timezone} required>
                <select value={form.timezone} onChange={(e) => upd('timezone', e.target.value)}
                  style={selectStyle}>
                  {timezones.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </FormField>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="Начало курса" error={errors.starts_on}>
                  <input type="date" value={form.starts_on}
                    onChange={(e) => upd('starts_on', e.target.value)}
                    style={dateInputStyle} />
                </FormField>
                <FormField label="Окончание" error={errors.ends_on}>
                  <input type="date" value={form.ends_on}
                    onChange={(e) => upd('ends_on', e.target.value)}
                    style={dateInputStyle} />
                </FormField>
              </div>

              <div>
                <div style={{
                  fontSize: 13.5, fontWeight: 530, color: 'var(--ink-soft)', marginBottom: 8,
                }}>Расписание (еженедельно)</div>
                <ScheduleEditor
                  value={slots}
                  onChange={(next) => { setSlotsTouched(true); setSlots(next); }}
                  errors={slotErrors}
                />
              </div>
            </Card>

            <Card style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <SectionTitle>Ограничения</SectionTitle>
              <FormField label="Максимум участников" hint="Оставьте пустым — без ограничения" error={errors.max_participants}>
                <Input type="number" min="1" value={form.max_participants}
                  onChange={(e) => upd('max_participants', e.target.value)} placeholder="15" />
              </FormField>
            </Card>

            {!isEdit && (
              <Card style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <SectionTitle>Ученики</SectionTitle>
                <div style={{ fontSize: 13, color: 'var(--mute)' }}>
                  Добавьте учеников сразу или подключите позже на странице комнаты.
                </div>
                <StudentPicker
                  value={selectedStudentIds}
                  onChange={setSelectedStudentIds}
                  initialStudents={initialStudents}
                />
                {errors.student_ids && (
                  <div role="alert" style={{ fontSize: 13, color: 'var(--danger)' }}>{errors.student_ids}</div>
                )}
              </Card>
            )}

            {serverError && (
              <div role="alert" style={{
                background: 'var(--danger-bg)', border: '1px solid oklch(0.85 0.07 25)',
                color: 'var(--danger)', padding: '10px 14px', borderRadius: 10, fontSize: 13.5,
              }}>{serverError}</div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button type="button" variant="ghost" onClick={() => navigate(isEdit ? `/rooms/${roomName}` : '/rooms')}>
                Отмена
              </Button>
              <Button type="submit" loading={submitting}>
                {submitting
                  ? (isEdit ? 'Сохраняем…' : 'Создаём…')
                  : (isEdit ? 'Сохранить' : 'Создать комнату')}
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 11.5, fontWeight: 560, color: 'var(--mute)',
      textTransform: 'uppercase', letterSpacing: '0.08em',
    }}>{children}</div>
  );
}

const baseInput = {
  width: '100%', height: 46, boxSizing: 'border-box',
  border: '1px solid var(--line-strong)', borderRadius: 12,
  padding: '0 14px', background: 'var(--surface)',
  fontSize: 15, fontFamily: 'inherit', color: 'var(--ink)', outline: 'none',
};

const dateInputStyle = { ...baseInput };
const selectStyle = {
  ...baseInput,
  appearance: 'none',
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none' stroke='%237b7f86' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'><path d='M3 4.5 6 7.5 9 4.5'/></svg>\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: 32,
};
