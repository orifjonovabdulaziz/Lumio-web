// Landing page — visually mirrors lumio (FSD) project's landing
import React from 'react';
import { useRouter } from '../router.jsx';

// ────────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────────
export function LandingPage() {
  return (
    <div className="ll-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <Hero />
      <Services />
      <Integrations />
      <Testimonials />
      <Footer />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Navbar — sticky, gradient brand text, login button on the right
// ────────────────────────────────────────────────────────────────────────────
function Navbar() {
  const { navigate } = useRouter();
  return (
    <nav style={{
      background: 'rgba(255,255,255,0.8)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid #e5e7eb',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        padding: '16px clamp(16px, 4vw, 32px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a href="#/" onClick={(e) => { e.preventDefault(); navigate('/'); }}
          className="ll-brand"
          style={{ fontSize: 'clamp(20px, 2vw, 24px)', textDecoration: 'none' }}>
          Lumio
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="#/sign-in" onClick={(e) => { e.preventDefault(); navigate('/sign-in'); }}
            className="ll-btn-secondary"
            style={{
              padding: '10px 24px', fontSize: 14, fontWeight: 500,
              borderRadius: 9999, textDecoration: 'none', display: 'inline-flex',
              alignItems: 'center', cursor: 'pointer',
            }}>
            Войти
          </a>
        </div>
      </div>
    </nav>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Hero — title + subtitle + 2 CTAs on left, 3 rotated info cards on right
// ────────────────────────────────────────────────────────────────────────────
function Hero() {
  const { navigate } = useRouter();
  return (
    <section style={{
      maxWidth: 1280, margin: '0 auto',
      padding: 'clamp(40px, 6vw, 80px) clamp(16px, 4vw, 32px)',
    }}>
      <div className="ll-hero-grid" style={{
        display: 'grid', gridTemplateColumns: '1fr', gap: 32, alignItems: 'center',
      }}>
        {/* Left: copy */}
        <div className="ll-hero-content" style={{
          display: 'flex', flexDirection: 'column', gap: 24, textAlign: 'center',
        }}>
          <h1 style={{
            fontSize: 'clamp(30px, 5vw, 60px)', fontWeight: 700, lineHeight: 1.1,
            margin: 0, color: '#111827', letterSpacing: '-0.02em',
          }}>
            Трансформируй свой опыт обучения сегодня
          </h1>
          <p className="ll-hero-subtitle" style={{
            fontSize: 'clamp(16px, 1.4vw, 20px)', color: '#4b5563',
            maxWidth: 672, margin: '0 auto', lineHeight: 1.5,
          }}>
            Объединяем учителей и учеников на современной, интуитивной платформе для эффективного онлайн-образования
          </p>
          <div className="ll-hero-actions" style={{
            display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center',
          }}>
            <button
              onClick={() => navigate('/sign-up')}
              className="ll-btn-primary"
              style={{
                padding: '16px 32px', fontSize: 16, borderRadius: 9999,
                cursor: 'pointer',
              }}>
              Присоединиться
            </button>
            <button
              onClick={() => navigate('/sign-in')}
              className="ll-btn-secondary"
              style={{
                padding: '16px 32px', fontSize: 16, borderRadius: 9999,
                cursor: 'pointer',
              }}>
              Узнать больше
            </button>
          </div>
        </div>

        {/* Right: rotated cards */}
        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
          }}>
            <HeroCard
              className="ll-card-rot-r"
              icon={<IconGraduationCap />}
              iconBg="#f3e8ff" iconColor="#9333ea"
              title="Студенты"
              desc="Учись в своём темпе"
            />
            <HeroCard
              className="ll-card-rot-l"
              icon={<IconBookOpen />}
              iconBg="#dbeafe" iconColor="#2563eb"
              title="Учителя"
              desc="Создавай увлекательные уроки"
              style={{ marginTop: 32 }}
            />
            <HeroCard
              className="ll-card-rot-s"
              icon={<IconUsers />}
              iconBg="#fce7f3" iconColor="#db2777"
              title="Сообщество"
              desc="Общайся с единомышленниками"
              style={{ marginTop: -16 }}
            />
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 128, height: 128,
              background: 'radial-gradient(circle, rgba(216,180,254,0.2), rgba(147,197,253,0.2))',
              borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none',
            }} />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroCard({ icon, iconBg, iconColor, title, desc, className, style }) {
  return (
    <div className={className} style={{
      background: '#fff', padding: 24, borderRadius: 30,
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)',
      ...style,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 24,
        background: iconBg, color: iconColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
      }}>{icon}</div>
      <h3 style={{ fontSize: 16, fontWeight: 500, margin: '0 0 8px', color: '#111827' }}>{title}</h3>
      <p style={{ fontSize: 14, color: '#4b5563', margin: 0, lineHeight: 1.4 }}>{desc}</p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Services — 6 cards with mini illustrations
// ────────────────────────────────────────────────────────────────────────────
function Services() {
  const items = [
    {
      title: 'Живые занятия',
      desc: 'Интерактивные видеоуроки с демонстрацией экрана и совместной работой в реальном времени',
      illus: <IllusLiveSessions />,
    },
    {
      title: 'Умное расписание',
      desc: 'Автоматическое управление календарём и напоминания о занятиях для всех',
      illus: <IllusCalendar />,
    },
    {
      title: 'Мгновенные сообщения',
      desc: 'Общение с учителями и одноклассниками в выделенных каналах комнаты',
      illus: <IllusChat />,
    },
    {
      title: 'Обмен ресурсами',
      desc: 'Загружай и делись учебными материалами, заданиями и учебными ресурсами',
      illus: <IllusFiles />,
    },
    {
      title: 'Отслеживание прогресса',
      desc: 'Мониторинг учебного прогресса с подробной аналитикой и статистикой',
      illus: <IllusProgress />,
    },
    {
      title: 'Безопасная платформа',
      desc: 'Корпоративная безопасность для защиты ваших данных и конфиденциальности',
      illus: <IllusSecurity />,
    },
  ];
  return (
    <section style={{
      background: '#f3f3f2',
      padding: 'clamp(64px, 10vw, 128px) clamp(20px, 4vw, 32px) clamp(32px, 6vw, 64px)',
      color: '#0c0c0c',
    }}>
      <div style={{ maxWidth: 896, margin: '0 auto', textAlign: 'center' }}>
        <h2 className="ll-svc-heading" style={{
          fontSize: '2.25rem', lineHeight: 1.05, fontWeight: 700,
          letterSpacing: '-0.03em', margin: 0,
        }}>
          Наши услуги
        </h2>
        <p className="ll-svc-subtitle" style={{
          margin: '20px auto 0', color: '#8a8a8a', fontSize: 16,
          lineHeight: 1.55, maxWidth: 512,
        }}>
          Всё необходимое для современного образования
        </p>
      </div>

      <div className="ll-svc-grid" style={{
        margin: '64px auto 0', maxWidth: 1280,
        display: 'grid', gridTemplateColumns: '1fr', gap: 20,
      }}>
        {items.map((s, i) => (
          <div key={i} className="ll-svc-card">
            <div style={{
              position: 'relative', flex: 1, minHeight: 192, borderRadius: 16,
              overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {s.illus}
            </div>
            <div style={{ padding: '12px 8px 0' }}>
              <h3 style={{
                fontSize: 22, fontWeight: 700, margin: '0 0 8px',
                letterSpacing: '-0.01em', color: '#0c0c0c',
              }}>{s.title}</h3>
              <p style={{ color: '#8a8a8a', fontSize: 15, lineHeight: 1.5, margin: 0 }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Service illustrations ───────────────────────────────────────────────────
function IllusLiveSessions() {
  return (
    <div style={{
      background: '#fff', border: '1px solid #ececea', borderRadius: 14,
      boxShadow: '0 10px 25px -16px rgba(0,0,0,0.18)',
      padding: 10, width: 'min(256px, 90%)',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ background: '#f4f4f2', borderRadius: 10, padding: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[
            { bg: 'linear-gradient(135deg, #c4b5fd, #818cf8)' },
            { bg: 'linear-gradient(135deg, #fda4af, #fb7185)' },
            { bg: 'linear-gradient(135deg, #93c5fd, #60a5fa)' },
            { bg: 'linear-gradient(135deg, #86efac, #4ade80)' },
          ].map((p, i) => (
            <div key={i} style={{
              aspectRatio: '4 / 3', borderRadius: 6, background: p.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: 16, height: 16, borderRadius: 8, background: 'rgba(255,255,255,0.7)' }} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '4px 0' }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#ececea',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#777' }}>
          <IconMic size={12} />
        </div>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#ececea',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#777' }}>
          <IconCam size={12} />
        </div>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#ef4444',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <IconPhone size={12} />
        </div>
      </div>
    </div>
  );
}

function IllusCalendar() {
  return (
    <div style={{
      background: '#fff', border: '1px solid #ececea', borderRadius: 14,
      boxShadow: '0 10px 25px -16px rgba(0,0,0,0.18)',
      padding: '12px 14px', width: 'min(272px, 90%)',
      display: 'flex', flexDirection: 'column', gap: 9,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#0c0c0c' }}>Март 2026</span>
        <span style={{
          background: '#fff3e0', color: '#e65100', fontSize: 10, fontWeight: 500,
          padding: '2px 7px', borderRadius: 9999,
        }}>3 урока</span>
      </div>
      <div style={{ display: 'flex', gap: 5, justifyContent: 'space-between' }}>
        {['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ'].map((d, i) => {
          const active = i === 2;
          return (
            <div key={i} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              padding: '6px 0', borderRadius: 8,
              background: active ? '#8476ff' : '#fafafa',
              color: active ? '#fff' : '#0c0c0c',
            }}>
              <span style={{ fontSize: 9, fontWeight: 500, opacity: 0.85, letterSpacing: '0.04em' }}>{d}</span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{12 + i}</span>
              {active && <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#fff' }} />}
            </div>
          );
        })}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: '#f4f0ff', color: '#8476ff', fontSize: 11, fontWeight: 500,
        padding: '6px 9px', borderRadius: 7,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8476ff' }} />
        14:00 · Английский B1
      </div>
    </div>
  );
}

function IllusChat() {
  return (
    <div style={{
      background: '#fff', border: '1px solid #ececea', borderRadius: 14,
      boxShadow: '0 10px 25px -16px rgba(0,0,0,0.18)',
      padding: '10px 12px', width: 'min(256px, 90%)',
      display: 'flex', flexDirection: 'column', gap: 7,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600,
        color: '#0c0c0c', paddingBottom: 5, borderBottom: '1px solid #ececea',
      }}>
        <span style={{ color: '#8a8a8a' }}>#</span> английский-b1
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%',
            background: 'linear-gradient(135deg, #c4b5fd, #818cf8)', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#0c0c0c' }}>Анна</div>
            <div style={{
              fontSize: 11, color: '#555', background: '#f5f5f3',
              padding: '5px 8px', borderRadius: 8, lineHeight: 1.35, marginTop: 2,
            }}>Привет! Готов к уроку?</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <div>
            <div style={{
              fontSize: 11, color: '#fff', background: '#8476ff',
              padding: '5px 8px', borderRadius: 8, lineHeight: 1.35,
            }}>Да, уже подключаюсь</div>
          </div>
        </div>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#fafafa', border: '1px solid #ececea', borderRadius: 8,
        padding: '5px 8px', fontSize: 10, color: '#8a8a8a',
      }}>
        Введите сообщение…
      </div>
    </div>
  );
}

function IllusFiles() {
  const files = [
    { color: '#fde68a', icon: '📄', name: 'lesson-01.pdf', size: '1.2MB' },
    { color: '#bfdbfe', icon: '📊', name: 'homework.xlsx', size: '420KB' },
    { color: '#fbcfe8', icon: '🎵', name: 'audio.mp3', size: '3.8MB' },
  ];
  return (
    <div style={{
      background: '#fff', border: '1px solid #ececea', borderRadius: 14,
      boxShadow: '0 10px 25px -16px rgba(0,0,0,0.18)',
      padding: '12px 14px', width: 'min(256px, 90%)',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
        color: '#0c0c0c', paddingBottom: 6, borderBottom: '1px solid #ececea',
      }}>
        Материалы курса
      </div>
      {files.map((f, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 0' }}>
          <span style={{
            width: 22, height: 22, borderRadius: 6, background: f.color,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
          }}>{f.icon}</span>
          <span style={{ flex: 1, fontSize: 11, fontWeight: 500, color: '#0c0c0c' }}>{f.name}</span>
          <span style={{ fontSize: 10, color: '#8a8a8a' }}>{f.size}</span>
        </div>
      ))}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        border: '1.5px dashed #ccc', borderRadius: 8, padding: 8,
        fontSize: 11, color: '#8a8a8a', marginTop: 2,
      }}>
        + Загрузить файл
      </div>
    </div>
  );
}

function IllusProgress() {
  const bars = [
    { h: 35, active: false }, { h: 50, active: false }, { h: 70, active: false },
    { h: 90, active: true }, { h: 60, active: false },
  ];
  return (
    <div style={{
      background: '#fff', border: '1px solid #ececea', borderRadius: 14,
      boxShadow: '0 10px 25px -16px rgba(0,0,0,0.18)',
      padding: '12px 14px', width: 'min(272px, 90%)',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#0c0c0c' }}>Прогресс</span>
        <span style={{
          display: 'inline-flex', gap: 2, background: '#ececea', padding: 2,
          borderRadius: 9999, fontSize: 10, fontWeight: 500,
        }}>
          <span style={{ padding: '2px 7px', borderRadius: 9999, background: '#0c0c0c', color: '#fff' }}>Неделя</span>
          <span style={{ padding: '2px 7px', borderRadius: 9999, color: '#777' }}>Месяц</span>
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 6, height: 88 }}>
        <div style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          fontSize: 9, color: '#aaa', padding: '2px 0',
        }}>
          <span>100</span><span>50</span><span>0</span>
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 5, height: '100%' }}>
          {bars.map((b, i) => (
            <div key={i} style={{
              position: 'relative', flex: 1, height: '100%',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            }}>
              {b.active && (
                <div style={{
                  position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)',
                  background: '#0c0c0c', color: '#fff', fontSize: 10, fontWeight: 600,
                  padding: '2px 6px', borderRadius: 9999, whiteSpace: 'nowrap',
                }}>+12%</div>
              )}
              <div style={{
                width: 10, height: `${b.h}%`,
                borderRadius: '5px 5px 2px 2px',
                background: b.active
                  ? 'linear-gradient(to top, #8476ff, #bdb2ff)'
                  : 'rgba(0,0,0,0.06)',
              }} />
            </div>
          ))}
        </div>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4, color: '#16a34a',
        fontSize: 11, fontWeight: 500,
      }}>
        ↗ +12% к прошлой неделе
      </div>
    </div>
  );
}

function IllusSecurity() {
  return (
    <div style={{
      position: 'relative', width: 200, height: 160,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', width: 160, height: 160,
          borderRadius: '50%', border: '1px dashed rgba(0,0,0,0.08)',
        }} />
      </div>
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: 'linear-gradient(135deg, #a78bfa, #8476ff)',
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 14px 28px -14px rgba(132,118,255,0.55)',
        position: 'relative', zIndex: 2,
      }}>
        <IconShield size={26} />
      </div>
      <div style={{
        position: 'absolute', bottom: 10, left: 8,
        background: '#fff', border: '1px solid #ececea', borderRadius: 8,
        padding: '5px 9px', display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 10, fontWeight: 500, color: '#0c0c0c',
        boxShadow: '0 6px 16px -10px rgba(0,0,0,0.15)', zIndex: 3,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
        SSL
      </div>
      <div style={{
        position: 'absolute', top: 10, right: 8,
        background: '#fff', border: '1px solid #ececea', borderRadius: 8,
        padding: '5px 9px', display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 10, fontWeight: 500, color: '#0c0c0c',
        boxShadow: '0 6px 16px -10px rgba(0,0,0,0.15)', zIndex: 3,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8476ff' }} />
        2FA
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Integrations — auto-rotating arc carousel (5 brand tiles)
// ────────────────────────────────────────────────────────────────────────────
function Integrations() {
  const items = [
    { id: 'meet', name: 'Google Meet', desc: 'Видеоконференции и онлайн-встречи', bg: '#e6f4ea', color: '#137333', icon: <IconCam size={28} /> },
    { id: 'mail', name: 'Gmail',       desc: 'Корпоративная электронная почта', bg: '#fce8e6', color: '#ea4335', icon: <IconMail size={28} /> },
    { id: 'cal',  name: 'Google Calendar', desc: 'Планирование и расписание', bg: '#e8f0fe', color: '#1a73e8', icon: <IconCalendar size={28} /> },
    { id: 'slack', name: 'Slack',       desc: 'Командный мессенджер', bg: '#f0ebff', color: '#4A154B', icon: <IconHash size={28} /> },
    { id: 'drive', name: 'Google Drive', desc: 'Облачное хранилище для файлов', bg: '#e6f4ea', color: '#137333', icon: <IconDrive size={28} /> },
  ];
  const [active, setActive] = React.useState(2);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 480);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  React.useEffect(() => {
    const id = setInterval(() => setActive((p) => (p + 1) % items.length), 2800);
    return () => clearInterval(id);
  }, [items.length]);

  function transformFor(slot) {
    const base = isMobile
      ? { '-3': [-200, 40, -20, 0.3, 0], '-2': [-140, 10, -10, 0.5, 0], '-1': [-110, -2, -9, 0.85, 1],
          '0': [0, -15, 0, 1.05, 1], '1': [110, -2, 9, 0.85, 1], '2': [140, 10, 10, 0.5, 0], '3': [200, 40, 20, 0.3, 0] }
      : { '-3': [-420, 80, -28, 0.5, 0], '-2': [-330, 36, -18, 0.78, 0.85], '-1': [-180, -4, -9, 0.9, 1],
          '0': [0, -28, 0, 1.08, 1], '1': [180, -4, 9, 0.9, 1], '2': [330, 36, 18, 0.78, 0.85], '3': [420, 80, 28, 0.5, 0] };
    return base[String(slot)] || base['0'];
  }

  const activeItem = items[active];

  return (
    <section style={{
      maxWidth: 1280, margin: '0 auto',
      padding: 'clamp(48px, 8vw, 96px) clamp(16px, 4vw, 32px)',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
        <h2 className="ll-svc-heading" style={{
          fontSize: '2.25rem', lineHeight: 1.05, fontWeight: 700,
          letterSpacing: '-0.03em', margin: 0, color: '#0c0c0c',
        }}>
          Всё в одном месте
        </h2>
        <p style={{ margin: '20px auto 0', color: '#8a8a8a', fontSize: 16, lineHeight: 1.55, maxWidth: 480 }}>
          Все нужные инструменты работают вместе — без лишних переключений
        </p>
      </div>

      <div className="ll-int-stage">
        {items.map((item, i) => {
          let offset = i - active;
          if (offset > items.length / 2) offset -= items.length;
          if (offset < -items.length / 2) offset += items.length;
          const [x, y, rot, scale, opacity] = transformFor(offset);
          const isActive = offset === 0;
          return (
            <div
              key={item.id}
              className="ll-int-tile"
              style={{
                transform: `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${scale})`,
                opacity, zIndex: 4 - Math.abs(offset),
                pointerEvents: opacity === 0 ? 'none' : 'auto',
                outline: isActive ? '2px solid rgba(132,118,255,0.4)' : 'none',
                outlineOffset: 4,
              }}
              aria-hidden={!isActive}
            >
              <span style={{
                width: '60%', height: '60%', borderRadius: 14,
                background: item.bg, color: item.color,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {item.icon}
              </span>
            </div>
          );
        })}
      </div>

      <div key={activeItem.id} style={{
        marginTop: 28, textAlign: 'center',
        animation: 'lumio-fadein 0.4s ease both',
      }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#0c0c0c' }}>{activeItem.name}</div>
        <div style={{ marginTop: 4, fontSize: 14, color: '#8a8a8a' }}>{activeItem.desc}</div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Testimonials — 3-card carousel with prev/center/next
// ────────────────────────────────────────────────────────────────────────────
function Testimonials() {
  const items = [
    { name: 'Сара Джонсон', role: 'Учитель математики',
      review: 'Эта платформа изменила то, как я преподаю. Мои студенты более вовлечены, и я могу легко отслеживать их прогресс.' },
    { name: 'Михаил Чен', role: 'Студент',
      review: 'Мне нравится, как легко получить доступ к урокам и общаться с учителями. Интерфейс очень интуитивный!' },
    { name: 'Эмилия Родригес', role: 'Учитель физики',
      review: 'Функции расписания и обмена ресурсами экономят мне часы каждую неделю. Очень рекомендую!' },
  ];
  const [i, setI] = React.useState(0);
  const prev = (i - 1 + items.length) % items.length;
  const next = (i + 1) % items.length;

  return (
    <section style={{
      padding: 'clamp(48px, 8vw, 96px) clamp(16px, 4vw, 32px)',
      background: 'linear-gradient(180deg, transparent, rgba(243,232,255,0.4))',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
          <h2 className="ll-svc-heading" style={{
            fontSize: '2.25rem', lineHeight: 1.05, fontWeight: 700,
            letterSpacing: '-0.03em', margin: 0, color: '#0c0c0c',
          }}>
            Что говорят наши пользователи
          </h2>
          <p style={{ margin: '20px auto 0', color: '#8a8a8a', fontSize: 16, lineHeight: 1.55, maxWidth: 520 }}>
            Присоединяйтесь к тысячам довольных учителей и студентов
          </p>
        </div>

        <div className="ll-tst-row" style={{
          marginTop: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24,
        }}>
          <div className="ll-tst-side" style={{ transform: 'rotate(-6deg)', opacity: 0.85 }}>
            <TestimonialCard data={items[prev]} />
          </div>
          <div style={{ transform: 'translateY(-8px)' }}>
            <TestimonialCard data={items[i]} highlight />
          </div>
          <div className="ll-tst-side" style={{ transform: 'rotate(6deg)', opacity: 0.85 }}>
            <TestimonialCard data={items[next]} />
          </div>
        </div>

        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center', gap: 12 }}>
          <button
            aria-label="Предыдущий"
            onClick={() => setI((p) => (p - 1 + items.length) % items.length)}
            className="ll-btn-secondary"
            style={{
              width: 44, height: 44, borderRadius: '50%', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <IconChevronLeft />
          </button>
          <button
            aria-label="Следующий"
            onClick={() => setI((p) => (p + 1) % items.length)}
            className="ll-btn-secondary"
            style={{
              width: 44, height: 44, borderRadius: '50%', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <IconChevronRight />
          </button>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ data, highlight }) {
  const initials = data.name.split(' ').map((n) => n[0]).join('').slice(0, 2);
  return (
    <div className="ll-tst-card" style={highlight ? {
      boxShadow: '0 30px 60px -24px rgba(132,118,255,0.35), 0 1px 2px rgba(0,0,0,0.05)',
    } : null}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
        color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 600, fontSize: 22, marginBottom: 16,
      }}>{initials}</div>
      <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0c0c0c' }}>{data.name}</p>
      <p style={{ margin: '4px 0 12px', fontSize: 13, color: '#8a8a8a' }}>{data.role}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <span style={{ display: 'inline-flex', gap: 2 }}>
          {[0,1,2,3,4].map((s) => <IconStar key={s} size={14} />)}
        </span>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#0c0c0c' }}>5.0</span>
      </div>
      <p style={{ margin: 0, fontSize: 14, color: '#4b5563', lineHeight: 1.55 }}>«{data.review}»</p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Footer
// ────────────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{
      textAlign: 'center', color: '#4b5563',
      padding: 'clamp(32px, 4vw, 48px) 16px',
    }}>
      <p style={{ margin: 0, fontSize: 14 }}>© 2026 Lumio. Все права защищены.</p>
    </footer>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Inline icons (lucide-style)
// ────────────────────────────────────────────────────────────────────────────
function svgProps(size = 22) {
  return {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 2,
    strokeLinecap: 'round', strokeLinejoin: 'round',
  };
}
function IconGraduationCap({ size = 22 }) {
  return (<svg {...svgProps(size)}>
    <path d="M22 10v6"/><path d="M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/>
  </svg>);
}
function IconBookOpen({ size = 22 }) {
  return (<svg {...svgProps(size)}>
    <path d="M2 4h7a3 3 0 0 1 3 3v13"/><path d="M22 4h-7a3 3 0 0 0-3 3v13"/>
    <path d="M2 4v15h7a3 3 0 0 1 3 3"/><path d="M22 4v15h-7a3 3 0 0 0-3 3"/>
  </svg>);
}
function IconUsers({ size = 22 }) {
  return (<svg {...svgProps(size)}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>);
}
function IconStar({ size = 14 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="#facc15">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>
  </svg>);
}
function IconChevronLeft({ size = 22 }) {
  return (<svg {...svgProps(size)}><polyline points="15 18 9 12 15 6"/></svg>);
}
function IconChevronRight({ size = 22 }) {
  return (<svg {...svgProps(size)}><polyline points="9 18 15 12 9 6"/></svg>);
}
function IconMic({ size = 14 }) {
  return (<svg {...svgProps(size)}>
    <rect x="9" y="2" width="6" height="12" rx="3"/>
    <path d="M5 10v2a7 7 0 0 0 14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>
  </svg>);
}
function IconCam({ size = 14 }) {
  return (<svg {...svgProps(size)}>
    <polygon points="23 7 16 12 23 17"/>
    <rect x="1" y="5" width="15" height="14" rx="2"/>
  </svg>);
}
function IconPhone({ size = 14 }) {
  return (<svg {...svgProps(size)}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>);
}
function IconMail({ size = 28 }) {
  return (<svg {...svgProps(size)}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>);
}
function IconCalendar({ size = 28 }) {
  return (<svg {...svgProps(size)}>
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>);
}
function IconHash({ size = 28 }) {
  return (<svg {...svgProps(size)}>
    <line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/>
    <line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>
  </svg>);
}
function IconDrive({ size = 28 }) {
  return (<svg {...svgProps(size)}>
    <path d="M7 4h10l5 9-5 9H7l-5-9z"/>
    <line x1="12" y1="4" x2="7" y2="13"/><line x1="12" y1="22" x2="17" y2="13"/>
    <line x1="2" y1="13" x2="22" y2="13"/>
  </svg>);
}
function IconShield({ size = 26 }) {
  return (<svg {...svgProps(size)}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>);
}
