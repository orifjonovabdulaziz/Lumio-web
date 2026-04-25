// /rooms/:name/live — LiveKit connection + basic tile grid.
import React from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { useRouter } from '../../router.jsx';
import { getLiveKitToken, getRoom, getRoster } from '../../lib/rooms.js';
import { Button, Spinner } from '../../ui.jsx';
import { RoomsTopBar, CenteredMessage, isNotFound } from './shared.jsx';

// Find a publication by Track.Source (works across livekit-client minor versions).
function findPubBySource(participant, source) {
  if (!participant) return undefined;
  if (typeof participant.getTrackPublications === 'function') {
    for (const p of participant.getTrackPublications()) {
      if (p.source === source) return p;
    }
  }
  const pubs = participant.trackPublications;
  if (pubs && typeof pubs.values === 'function') {
    for (const p of pubs.values()) {
      if (p.source === source) return p;
    }
  }
  return undefined;
}

export function RoomLivePage({ name }) {
  const { navigate } = useRouter();
  const roomRef = React.useRef(null);
  const [phase, setPhase] = React.useState('connecting'); // connecting | live | error | notfound | disconnected
  const [errorMsg, setErrorMsg] = React.useState(null);
  const [mediaWarning, setMediaWarning] = React.useState(null);
  const [tokenInfo, setTokenInfo] = React.useState(null);
  const [micEnabled, setMicEnabled] = React.useState(false);
  const [camEnabled, setCamEnabled] = React.useState(false);
  const [screenEnabled, setScreenEnabled] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [busyShare, setBusyShare] = React.useState(false);
  const [participantsTick, setParticipantsTick] = React.useState(0);
  const rerender = React.useCallback(() => setParticipantsTick((n) => n + 1), []);
  const [expected, setExpected] = React.useState(null);
  const [panelOpen, setPanelOpen] = React.useState(false);

  const canShareScreen = React.useMemo(
    () => typeof navigator !== 'undefined'
      && typeof navigator.mediaDevices?.getDisplayMedia === 'function',
    [],
  );

  React.useEffect(() => {
    const ctrl = new AbortController();
    Promise.all([
      getRoom(name, { signal: ctrl.signal }),
      getRoster(name, { signal: ctrl.signal }),
    ])
      .then(([room, roster]) => {
        setExpected({
          creator: room?.created_by || null,
          students: Array.isArray(roster) ? roster : [],
        });
      })
      .catch(() => { /* best effort — panel can still show online list */ });
    return () => ctrl.abort();
  }, [name]);

  const syncLocalState = React.useCallback(() => {
    const lp = roomRef.current?.localParticipant;
    if (!lp) return;
    setMicEnabled(!!lp.isMicrophoneEnabled);
    setCamEnabled(!!lp.isCameraEnabled);
    setScreenEnabled(!!lp.isScreenShareEnabled);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    let room;

    async function connect() {
      try {
        const info = await getLiveKitToken(name);
        if (cancelled) return;
        setTokenInfo(info);

        room = new Room({ adaptiveStream: true, dynacast: true });
        roomRef.current = room;

        const onAny = () => {
          if (cancelled) return;
          rerender();
          syncLocalState();
        };
        room.on(RoomEvent.ParticipantConnected, onAny);
        room.on(RoomEvent.ParticipantDisconnected, onAny);
        room.on(RoomEvent.TrackSubscribed, onAny);
        room.on(RoomEvent.TrackUnsubscribed, onAny);
        room.on(RoomEvent.LocalTrackPublished, onAny);
        room.on(RoomEvent.LocalTrackUnpublished, onAny);
        room.on(RoomEvent.TrackMuted, onAny);
        room.on(RoomEvent.TrackUnmuted, onAny);
        room.on(RoomEvent.ActiveSpeakersChanged, onAny);
        room.on(RoomEvent.Disconnected, () => { if (!cancelled) setPhase('disconnected'); });

        await room.connect(info.url, info.token);
        if (cancelled) { room.disconnect(); return; }

        setPhase('live');

        // Publish camera + microphone after we're live so the UI reflects attempts in real time.
        try {
          await room.localParticipant.setMicrophoneEnabled(true);
        } catch (err) {
          if (!cancelled) setMediaWarning('Не удалось включить микрофон. Проверьте разрешения браузера.');
        }
        try {
          await room.localParticipant.setCameraEnabled(true);
        } catch (err) {
          if (!cancelled) setMediaWarning((prev) => prev || 'Не удалось включить камеру. Проверьте разрешения браузера.');
        }
        if (!cancelled) syncLocalState();
      } catch (err) {
        if (cancelled) return;
        if (isNotFound(err)) { setPhase('notfound'); return; }
        const status = err.response?.status;
        if (status === 400) {
          setErrorMsg('Комната сейчас недоступна (архивирована).');
        } else {
          setErrorMsg('Не удалось подключиться к комнате.');
        }
        setPhase('error');
      }
    }

    connect();

    return () => {
      cancelled = true;
      if (room) room.disconnect();
    };
  }, [name, rerender, syncLocalState]);

  async function toggleMic() {
    const room = roomRef.current;
    if (!room || busy) return;
    setBusy(true);
    const next = !room.localParticipant.isMicrophoneEnabled;
    try {
      await room.localParticipant.setMicrophoneEnabled(next);
      setMediaWarning(null);
    } catch {
      setMediaWarning('Не удалось переключить микрофон.');
    } finally {
      syncLocalState();
      setBusy(false);
    }
  }

  async function toggleCam() {
    const room = roomRef.current;
    if (!room || busy) return;
    setBusy(true);
    const next = !room.localParticipant.isCameraEnabled;
    try {
      await room.localParticipant.setCameraEnabled(next);
      setMediaWarning(null);
    } catch {
      setMediaWarning('Не удалось переключить камеру.');
    } finally {
      syncLocalState();
      setBusy(false);
    }
  }

  async function toggleScreenShare() {
    const room = roomRef.current;
    if (!room || busyShare) return;
    const lp = room.localParticipant;
    const next = !lp.isScreenShareEnabled;
    setBusyShare(true);
    try {
      if (next) {
        await lp.setScreenShareEnabled(true, {
          audio: true,
          resolution: { width: 1920, height: 1080, frameRate: 15 },
          selfBrowserSurface: 'include',
        });
      } else {
        await lp.setScreenShareEnabled(false);
      }
      setMediaWarning(null);
    } catch (err) {
      // User cancelled the system picker — not an error.
      if (err?.name !== 'NotAllowedError') {
        setMediaWarning('Не удалось запустить демонстрацию экрана.');
      }
    } finally {
      syncLocalState();
      setBusyShare(false);
    }
  }

  function hangup() {
    roomRef.current?.disconnect();
    navigate(`/rooms/${name}`);
  }

  const rosterSplit = React.useMemo(() => {
    const room = roomRef.current;
    if (!room || phase !== 'live') return { online: [], offline: [], total: 0 };
    const participants = [room.localParticipant, ...Array.from(room.remoteParticipants.values())];

    const expectedUsers = [];
    if (expected?.creator) expectedUsers.push({ ...expected.creator, kind: 'teacher' });
    if (expected?.students) {
      for (const s of expected.students) expectedUsers.push({ ...s, kind: 'student' });
    }

    const online = participants.map((p) => {
      const user = expectedUsers.find((u) => matchesParticipant(p, u));
      return { participant: p, user, isLocal: p === room.localParticipant };
    });

    const offline = expectedUsers.filter((u) => !participants.some((p) => matchesParticipant(p, u)));

    return { online, offline, total: online.length + offline.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expected, participantsTick, phase]);

  if (phase === 'notfound') {
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

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: 'oklch(0.14 0.01 260)', color: 'white',
    }}>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px clamp(16px, 3vw, 28px)',
        borderBottom: '1px solid oklch(0.22 0.01 260)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 580 }}>{tokenInfo?.room || name}</div>
          {phase === 'live' && (
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 999,
              background: 'oklch(0.55 0.2 25)', color: 'white', fontWeight: 540,
            }}>LIVE</span>
          )}
        </div>
        <div style={{ fontSize: 12.5, color: 'oklch(0.7 0.01 260)' }}>
          {tokenInfo?.identity || ''}
        </div>
      </header>

      {mediaWarning && (
        <div role="alert" style={{
          padding: '10px clamp(16px, 3vw, 28px)',
          background: 'oklch(0.28 0.06 25)', color: 'oklch(0.92 0.04 25)',
          fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 10,
          borderBottom: '1px solid oklch(0.22 0.01 260)',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <circle cx="8" cy="8" r="7"/><path d="M8 4.5v4M8 11v.01"/>
          </svg>
          {mediaWarning}
        </div>
      )}

      <main style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(16px, 3vw, 32px)',
      }}>
        {phase === 'connecting' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: 'oklch(0.7 0.01 260)' }}>
            <Spinner size={22} />
            <div>Подключаемся…</div>
          </div>
        )}

        {phase === 'error' && (
          <div style={{ textAlign: 'center', color: 'oklch(0.8 0.05 25)' }}>
            <div style={{ fontSize: 18, fontWeight: 580, marginBottom: 6 }}>Ошибка подключения</div>
            <div style={{ color: 'oklch(0.7 0.01 260)', marginBottom: 16 }}>{errorMsg}</div>
            <Button onClick={() => navigate(`/rooms/${name}`)}>Назад к комнате</Button>
          </div>
        )}

        {phase === 'disconnected' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 580, marginBottom: 6 }}>Соединение разорвано</div>
            <Button onClick={() => window.location.reload()}>Переподключиться</Button>
          </div>
        )}

        {phase === 'live' && roomRef.current && (
          <ParticipantGrid room={roomRef.current} tick={participantsTick} />
        )}
      </main>

      {phase === 'live' && panelOpen && (
        <ParticipantsPanel
          online={rosterSplit.online}
          offline={rosterSplit.offline}
          expectedLoaded={!!expected}
          onClose={() => setPanelOpen(false)}
        />
      )}

      {phase === 'live' && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          padding: '16px', borderTop: '1px solid oklch(0.22 0.01 260)',
        }}>
          <ControlButton on={micEnabled} onClick={toggleMic} label={micEnabled ? 'Mic on' : 'Mic off'}>
            {micEnabled ? (
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2a2 2 0 0 0-2 2v4a2 2 0 0 0 4 0V4a2 2 0 0 0-2-2z"/><path d="M4 8a4 4 0 0 0 8 0M8 12v2"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2 2l12 12"/><path d="M10 4a2 2 0 0 0-4 0v4"/><path d="M4 8a4 4 0 0 0 6 3.5"/></svg>
            )}
          </ControlButton>
          <ControlButton on={camEnabled} onClick={toggleCam} label={camEnabled ? 'Cam on' : 'Cam off'}>
            {camEnabled ? (
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="8" height="6" rx="1"/><path d="M10 7l4-2v6l-4-2"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2 2l12 12"/><rect x="2" y="5" width="8" height="6" rx="1"/><path d="M10 7l4-2v6l-4-2"/></svg>
            )}
          </ControlButton>
          {canShareScreen && (
            <button
              onClick={toggleScreenShare}
              disabled={busyShare}
              aria-label={screenEnabled ? 'Остановить демонстрацию экрана' : 'Демонстрация экрана'}
              title={screenEnabled ? 'Остановить демонстрацию экрана' : 'Демонстрация экрана'}
              style={{
                width: 48, height: 46, borderRadius: 14,
                background: screenEnabled ? 'oklch(0.55 0.13 250)' : 'oklch(0.28 0.015 260)',
                color: 'white', border: 'none',
                cursor: busyShare ? 'default' : 'pointer',
                opacity: busyShare ? 0.7 : 1,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {screenEnabled ? (
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="12" height="9" rx="1"/>
                  <path d="M5 14h6"/>
                  <path d="M6 6l4 4M10 6l-4 4"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="12" height="9" rx="1"/>
                  <path d="M5 14h6"/>
                  <path d="M8 5.5v5M5.5 8L8 5.5 10.5 8"/>
                </svg>
              )}
            </button>
          )}
          <button
            onClick={() => setPanelOpen((v) => !v)}
            aria-label="Участники"
            title="Участники"
            style={{
              height: 46, padding: '0 14px', borderRadius: 14,
              background: panelOpen ? 'oklch(0.35 0.02 260)' : 'oklch(0.28 0.015 260)',
              color: 'white', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 14, fontWeight: 540,
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="6" r="2.5"/>
              <path d="M2 13a4 4 0 0 1 8 0"/>
              <circle cx="11" cy="5.5" r="2"/>
              <path d="M11 10a3.5 3.5 0 0 1 3.5 3.5"/>
            </svg>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {rosterSplit.online.length}
              {rosterSplit.total > rosterSplit.online.length && `/${rosterSplit.total}`}
            </span>
          </button>
          <button
            onClick={hangup}
            style={{
              height: 46, padding: '0 18px', borderRadius: 14,
              background: 'oklch(0.55 0.2 25)', color: 'white', border: 'none',
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 540,
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 7a7 7 0 0 1 12 0l-2 2-2-1V6a6 6 0 0 0-4 0v2L4 9z"/>
            </svg>
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}

function ControlButton({ children, onClick, on, label }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        width: 48, height: 46, borderRadius: 14,
        background: on ? 'oklch(0.28 0.015 260)' : 'oklch(0.45 0.1 25)',
        color: 'white', border: 'none', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {children}
    </button>
  );
}

function ParticipantGrid({ room, tick: _tick }) {
  // _tick prop is intentionally read but unused — its change triggers re-render so we
  // re-read live room state (participants, publications, isSpeaking) without remounting tiles.
  const participants = [room.localParticipant, ...Array.from(room.remoteParticipants.values())];

  let screenShare = null;
  for (const p of participants) {
    const pub = findPubBySource(p, Track.Source.ScreenShare);
    if (pub?.track && !pub.isMuted) {
      screenShare = { participant: p, publication: pub };
      break;
    }
  }

  if (screenShare) {
    const isLocalShare = screenShare.participant === room.localParticipant;
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 12,
        width: '100%', maxWidth: 1400,
      }}>
        <ScreenShareTile
          participant={screenShare.participant}
          publication={screenShare.publication}
          isLocal={isLocalShare}
        />
        <div style={{
          display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4,
        }}>
          {participants.map((p) => (
            <div key={p.sid || p.identity} style={{ flex: '0 0 200px' }}>
              <ParticipantTile participant={p} isLocal={p === room.localParticipant} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const count = participants.length;
  const cols = count <= 1 ? 1 : count <= 4 ? 2 : 3;
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      gap: 12, width: '100%', maxWidth: 1100,
    }}>
      {participants.map((p) => (
        <ParticipantTile key={p.sid || p.identity} participant={p} isLocal={p === room.localParticipant} />
      ))}
    </div>
  );
}

function ScreenShareTile({ participant, publication, isLocal }) {
  const videoRef = React.useRef(null);
  const audioRef = React.useRef(null);

  const videoTrack = publication.track;
  const videoKey = videoTrack?.sid || publication.trackSid || null;
  const audioPub = findPubBySource(participant, Track.Source.ScreenShareAudio);
  const audioTrack = audioPub?.track;
  const audioKey = audioTrack?.sid || audioPub?.trackSid || null;

  React.useEffect(() => {
    if (!videoTrack || !videoRef.current) return;
    videoTrack.attach(videoRef.current);
    return () => { videoTrack.detach(); };
  }, [videoTrack, videoKey]);

  React.useEffect(() => {
    if (isLocal || !audioTrack || !audioRef.current) return;
    audioTrack.attach(audioRef.current);
    return () => { audioTrack.detach(); };
  }, [audioTrack, audioKey, isLocal]);

  const name = participant.name || participant.identity;

  return (
    <div style={{
      position: 'relative', aspectRatio: '16 / 9',
      background: 'black', borderRadius: 12, overflow: 'hidden',
      border: '2px solid oklch(0.42 0.14 250)',
    }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        style={{ width: '100%', height: '100%', objectFit: 'contain', background: 'black' }}
      />
      {!isLocal && <audio ref={audioRef} autoPlay />}
      <div style={{
        position: 'absolute', top: 10, left: 10,
        background: 'rgba(0,0,0,0.6)', color: 'white',
        padding: '5px 10px', borderRadius: 8, fontSize: 12.5, fontWeight: 540,
        backdropFilter: 'blur(6px)',
        display: 'inline-flex', alignItems: 'center', gap: 6,
      }}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="12" height="9" rx="1"/>
          <path d="M5 14h6"/>
        </svg>
        {name}{isLocal ? ' (вы)' : ''} — демонстрация экрана
      </div>
    </div>
  );
}

function ParticipantTile({ participant, isLocal }) {
  const videoRef = React.useRef(null);
  const audioRef = React.useRef(null);

  const videoPub = findPubBySource(participant, Track.Source.Camera);
  const audioPub = findPubBySource(participant, Track.Source.Microphone);
  const videoTrack = videoPub?.track;
  const audioTrack = audioPub?.track;
  // Sid changes when a track is unpublished and republished; use it as a cheap cache key.
  const videoKey = videoTrack?.sid || videoPub?.trackSid || null;
  const audioKey = audioTrack?.sid || audioPub?.trackSid || null;
  const videoMuted = !!videoPub?.isMuted || !videoTrack;

  React.useEffect(() => {
    if (!videoTrack || !videoRef.current) return;
    videoTrack.attach(videoRef.current);
    return () => { videoTrack.detach(); };
  }, [videoTrack, videoKey]);

  React.useEffect(() => {
    if (isLocal || !audioTrack || !audioRef.current) return;
    audioTrack.attach(audioRef.current);
    return () => { audioTrack.detach(); };
  }, [audioTrack, audioKey, isLocal]);

  const speaking = participant.isSpeaking;
  const name = participant.name || participant.identity;

  return (
    <div style={{
      position: 'relative', aspectRatio: '16 / 10',
      background: 'oklch(0.22 0.01 260)', borderRadius: 12,
      overflow: 'hidden',
      border: `2px solid ${speaking ? 'oklch(0.72 0.13 175)' : 'transparent'}`,
      transition: 'border-color 140ms',
    }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        style={{
          width: '100%', height: '100%', objectFit: 'cover',
          background: 'black',
          opacity: videoMuted ? 0 : 1,
          transition: 'opacity 140ms',
        }}
      />
      {videoMuted && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'oklch(0.20 0.01 260)', color: 'oklch(0.6 0.01 260)',
          fontSize: 36, fontWeight: 620,
        }}>
          {(name || '?')[0]?.toUpperCase()}
        </div>
      )}
      {!isLocal && <audio ref={audioRef} autoPlay />}
      <div style={{
        position: 'absolute', bottom: 8, left: 8, right: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{
          background: 'rgba(0,0,0,0.55)', color: 'white',
          padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 540,
          backdropFilter: 'blur(4px)',
        }}>
          {name}{isLocal ? ' (вы)' : ''}
        </span>
        {speaking && (
          <span style={{
            background: 'oklch(0.60 0.13 175)', color: 'white',
            padding: '3px 6px', borderRadius: 6, fontSize: 11, fontWeight: 540,
          }}>говорит</span>
        )}
      </div>
    </div>
  );
}

// Match a LiveKit participant to a backend user. The token backend may set
// identity to username, to the raw id, or to "user:{id}" — try them all.
function matchesParticipant(p, user) {
  if (!p || !user) return false;
  const pid = (p.identity || '').toLowerCase();
  const uname = (user.username || '').toLowerCase();
  if (uname && pid === uname) return true;
  if (user.id != null && pid === String(user.id)) return true;
  if (user.id != null && pid === `user:${user.id}`) return true;
  return false;
}

function ParticipantsPanel({ online, offline, expectedLoaded, onClose }) {
  return (
    <aside style={{
      position: 'fixed', top: 0, right: 0, bottom: 0,
      width: 340, maxWidth: '100vw',
      background: 'oklch(0.18 0.01 260)',
      borderLeft: '1px solid oklch(0.26 0.01 260)',
      display: 'flex', flexDirection: 'column',
      zIndex: 20, color: 'white',
      boxShadow: '-8px 0 24px rgba(0,0,0,0.3)',
    }}>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderBottom: '1px solid oklch(0.26 0.01 260)',
      }}>
        <div style={{ fontSize: 14, fontWeight: 580 }}>
          Участники{' '}
          <span style={{ color: 'oklch(0.65 0.01 260)', fontWeight: 500 }}>
            · {online.length}
            {expectedLoaded && offline.length > 0 && ` из ${online.length + offline.length}`}
          </span>
        </div>
        <button onClick={onClose} aria-label="Закрыть" style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'oklch(0.7 0.01 260)', padding: 4, display: 'flex',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M3 3l10 10M13 3L3 13"/>
          </svg>
        </button>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px 16px' }}>
        <PanelSection title="В эфире" count={online.length} dotColor="oklch(0.72 0.13 160)">
          {online.length === 0 ? (
            <EmptyHint>Пока никого</EmptyHint>
          ) : (
            online.map(({ participant, user, isLocal }) => (
              <ParticipantRow
                key={participant.sid || participant.identity}
                participant={participant}
                user={user}
                isLocal={isLocal}
                status="online"
              />
            ))
          )}
        </PanelSection>

        {expectedLoaded ? (
          <PanelSection title="Не подключились" count={offline.length} dotColor="oklch(0.45 0.01 260)">
            {offline.length === 0 ? (
              <EmptyHint>Все здесь</EmptyHint>
            ) : (
              offline.map((u) => (
                <ParticipantRow
                  key={`off-${u.id}`}
                  user={u}
                  status="offline"
                />
              ))
            )}
          </PanelSection>
        ) : (
          <div style={{
            color: 'oklch(0.6 0.01 260)', fontSize: 12.5, textAlign: 'center', padding: '16px 0',
          }}>
            Загружаем список ожидаемых…
          </div>
        )}
      </div>
    </aside>
  );
}

function PanelSection({ title, count, dotColor, children }) {
  return (
    <section style={{ marginBottom: 14 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 4px', marginBottom: 4,
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%', background: dotColor, display: 'inline-block',
        }} />
        <span style={{
          fontSize: 11, fontWeight: 560, color: 'oklch(0.7 0.01 260)',
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          {title} · {count}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{children}</div>
    </section>
  );
}

function EmptyHint({ children }) {
  return (
    <div style={{
      color: 'oklch(0.55 0.01 260)', fontSize: 12.5,
      padding: '8px 10px',
    }}>{children}</div>
  );
}

function ParticipantRow({ participant, user, isLocal, status }) {
  const fullName = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
    : participant?.name || participant?.identity || '—';
  const handle = user?.username
    ? `@${user.username}`
    : participant?.identity || '';

  let micOff = false;
  let camOff = false;
  if (participant) {
    const micPub = findPubBySource(participant, Track.Source.Microphone);
    const camPub = findPubBySource(participant, Track.Source.Camera);
    micOff = !micPub?.track || micPub.isMuted;
    camOff = !camPub?.track || camPub.isMuted;
  }
  const speaking = participant?.isSpeaking;
  const isOffline = status === 'offline';

  const initial = (fullName || '?')[0]?.toUpperCase();

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 10px', borderRadius: 10,
      background: speaking ? 'oklch(0.24 0.02 175 / 0.5)' : 'transparent',
      opacity: isOffline ? 0.6 : 1,
      transition: 'background-color 140ms',
    }}>
      <div style={{
        position: 'relative', width: 32, height: 32, borderRadius: '50%',
        background: isOffline ? 'oklch(0.28 0.01 260)' : 'oklch(0.40 0.08 260)',
        color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 600, fontSize: 13, flexShrink: 0,
      }}>
        {initial}
        {!isOffline && (
          <span style={{
            position: 'absolute', right: -1, bottom: -1,
            width: 10, height: 10, borderRadius: '50%',
            background: 'oklch(0.72 0.13 160)',
            border: '2px solid oklch(0.18 0.01 260)',
          }} />
        )}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: 13.5, fontWeight: 540, color: 'white',
          display: 'flex', alignItems: 'center', gap: 6,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {fullName}
          {isLocal && (
            <span style={{ fontSize: 11, color: 'oklch(0.65 0.01 260)', fontWeight: 500 }}>
              (вы)
            </span>
          )}
          {user?.kind === 'teacher' && (
            <span style={{
              fontSize: 10.5, fontWeight: 560, padding: '1px 6px', borderRadius: 4,
              background: 'oklch(0.32 0.08 250)', color: 'oklch(0.85 0.06 250)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>препод</span>
          )}
        </div>
        <div style={{
          fontSize: 11.5, color: 'oklch(0.6 0.01 260)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {handle}
        </div>
      </div>
      {!isOffline && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'oklch(0.7 0.01 260)' }}>
          <StatusIcon kind="mic" off={micOff} />
          <StatusIcon kind="cam" off={camOff} />
        </div>
      )}
    </div>
  );
}

function StatusIcon({ kind, off }) {
  const color = off ? 'oklch(0.62 0.14 25)' : 'oklch(0.7 0.01 260)';
  if (kind === 'mic') {
    return (
      <span title={off ? 'Микрофон выключен' : 'Микрофон включён'} style={{ display: 'inline-flex', color }}>
        {off ? (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 2l12 12"/>
            <path d="M10 4a2 2 0 0 0-4 0v4"/>
            <path d="M4 8a4 4 0 0 0 6 3.5"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2a2 2 0 0 0-2 2v4a2 2 0 0 0 4 0V4a2 2 0 0 0-2-2z"/>
            <path d="M4 8a4 4 0 0 0 8 0M8 12v2"/>
          </svg>
        )}
      </span>
    );
  }
  return (
    <span title={off ? 'Камера выключена' : 'Камера включена'} style={{ display: 'inline-flex', color }}>
      {off ? (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 2l12 12"/>
          <rect x="2" y="5" width="8" height="6" rx="1"/>
          <path d="M10 7l4-2v6l-4-2"/>
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="8" height="6" rx="1"/>
          <path d="M10 7l4-2v6l-4-2"/>
        </svg>
      )}
    </span>
  );
}
