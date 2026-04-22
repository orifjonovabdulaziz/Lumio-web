// /rooms/:name/live — LiveKit connection + basic tile grid.
import React from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { useRouter } from '../../router.jsx';
import { getLiveKitToken } from '../../lib/rooms.js';
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
  const [busy, setBusy] = React.useState(false);
  const [participantsTick, setParticipantsTick] = React.useState(0);
  const rerender = React.useCallback(() => setParticipantsTick((n) => n + 1), []);

  const syncLocalState = React.useCallback(() => {
    const lp = roomRef.current?.localParticipant;
    if (!lp) return;
    setMicEnabled(!!lp.isMicrophoneEnabled);
    setCamEnabled(!!lp.isCameraEnabled);
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

  function hangup() {
    roomRef.current?.disconnect();
    navigate(`/rooms/${name}`);
  }

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
