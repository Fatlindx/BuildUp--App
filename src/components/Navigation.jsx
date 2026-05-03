import { useState, useEffect } from 'react';
import { Home, UtensilsCrossed, Flame, Dumbbell, BarChart2, Zap, LogOut, Bot, ClipboardList, User } from 'lucide-react';

const navItems = [
  { id: 'home',       label: 'Home',        icon: Home },
  { id: 'nutrition',  label: 'Ernährung',   icon: UtensilsCrossed },
  { id: 'exercises',  label: 'Übungen',     icon: Dumbbell },
  { id: 'workout',    label: 'Training',    icon: ClipboardList },
  { id: 'progress',   label: 'Fortschritt', icon: BarChart2 },
  { id: 'calculator', label: 'Rechner',     icon: Flame },
];

const allNavItems = [
  { id: 'home',       label: 'Home',        icon: Home },
  { id: 'nutrition',  label: 'Ernährung',   icon: UtensilsCrossed },
  { id: 'calculator', label: 'Rechner',     icon: Flame },
  { id: 'exercises',  label: 'Übungen',     icon: Dumbbell },
  { id: 'workout',    label: 'Training',    icon: ClipboardList },
  { id: 'progress',   label: 'Fortschritt', icon: BarChart2 },
];

export default function Navigation({ activeSection, setActiveSection, user, profile, onLogout, onOpenCoach }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNav = (id) => {
    setActiveSection(id);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const displayName = profile?.username || user?.email?.split('@')[0] || '';

  return (
    <>
      {/* ── DESKTOP TOP NAV ── */}
      {!isMobile && (
        <nav className="nav">
          <div className="nav-container">
            <button className="nav-logo" onClick={() => handleNav('home')}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <div className="logo-icon">
                <Zap size={18} color="#000" strokeWidth={2.5} />
              </div>
              <span className="logo-text">BuildUp</span>
            </button>

            <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
              {allNavItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={`nav-link ${activeSection === item.id ? 'active' : ''}`}
                    onClick={() => handleNav(item.id)}
                  >
                    <Icon size={15} strokeWidth={1.8} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {user && (
                <button
                  onClick={() => handleNav('profile')}
                  style={{
                    fontSize: 12.5,
                    color: activeSection === 'profile' ? 'var(--text)' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: activeSection === 'profile' ? 'var(--surface-2)' : 'none',
                    border: '1px solid',
                    borderColor: activeSection === 'profile' ? 'var(--border-active)' : 'transparent',
                    cursor: 'pointer',
                    padding: '5px 10px', borderRadius: 8,
                    transition: 'all 0.2s ease',
                    fontWeight: activeSection === 'profile' ? 600 : 400,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--surface-2)';
                    e.currentTarget.style.color = 'var(--text)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = activeSection === 'profile' ? 'var(--surface-2)' : 'none';
                    e.currentTarget.style.color = activeSection === 'profile' ? 'var(--text)' : 'var(--text-muted)';
                    e.currentTarget.style.borderColor = activeSection === 'profile' ? 'var(--border-active)' : 'transparent';
                  }}
                  title="Profil öffnen"
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', flexShrink: 0 }} />
                  {displayName}
                </button>
              )}

              {user && (
                <button
                  onClick={onOpenCoach}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '7px 13px', borderRadius: 10,
                    background: 'var(--green-glow)',
                    border: '1px solid var(--border-active)',
                    cursor: 'pointer', color: 'var(--green)',
                    fontWeight: 600, fontSize: 12.5,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(34,197,94,0.2)';
                    e.currentTarget.style.borderColor = 'rgba(34,197,94,0.6)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--green-glow)';
                    e.currentTarget.style.borderColor = 'var(--border-active)';
                  }}
                  title="KI Coach öffnen"
                >
                  <Bot size={15} strokeWidth={2} />
                  <span>KI Coach</span>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--green)', opacity: 0.8,
                    animation: 'pulse 2s infinite'
                  }} />
                </button>
              )}

              {user && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={onLogout}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}
                  title="Ausloggen"
                >
                  <LogOut size={15} />
                  <span style={{ fontSize: 13 }}>Logout</span>
                </button>
              )}
            </div>

            <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menü öffnen">
              <span style={{ transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
              <span style={{ opacity: menuOpen ? 0 : 1 }} />
              <span style={{ transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
            </button>
          </div>
        </nav>
      )}

      {/* ── MOBILE TOP BAR ── */}
      {isMobile && (
        <>
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
            background: 'rgba(10,10,10,0.97)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--border)',
            padding: '10px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            height: 56,
          }}>
            <button onClick={() => handleNav('home')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: 'var(--green)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Zap size={17} color="#000" strokeWidth={2.5} />
              </div>
              <span style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)', letterSpacing: '-0.3px' }}>BuildUp</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={onOpenCoach}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 11px', borderRadius: 9,
                  background: 'var(--green-glow)',
                  border: '1px solid var(--border-active)',
                  cursor: 'pointer', color: 'var(--green)',
                  fontWeight: 600, fontSize: 12,
                }}
              >
                <Bot size={13} strokeWidth={2} />
                <span>Coach</span>
                <span style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: 'var(--green)',
                  animation: 'pulse 2s infinite',
                  flexShrink: 0,
                }} />
              </button>

              <button
                onClick={() => handleNav('profile')}
                style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: activeSection === 'profile' ? 'var(--green)' : 'var(--surface-2)',
                  border: `2px solid ${activeSection === 'profile' ? 'var(--green)' : 'var(--border)'}`,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: activeSection === 'profile' ? '#000' : 'var(--text-muted)',
                  fontWeight: 700, fontSize: 13,
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}
                title="Profil"
              >
                {displayName ? displayName[0].toUpperCase() : <User size={14} />}
              </button>
            </div>
          </div>

          {/* Spacer for fixed top bar */}
          <div style={{ height: 56 }} />
        </>
      )}

      {/* ── MOBILE BOTTOM NAV ── */}
      {isMobile && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
          background: 'rgba(10,10,10,0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
          paddingTop: 6,
          paddingBottom: 'calc(6px + env(safe-area-inset-bottom))',
        }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                style={{
                  flex: 1,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 2,
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '4px 2px 6px',
                  position: 'relative',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {/* Active top bar */}
                {isActive && (
                  <span style={{
                    position: 'absolute', top: -6, left: '50%',
                    transform: 'translateX(-50%)',
                    width: 24, height: 2.5, borderRadius: 2,
                    background: 'var(--green)',
                  }} />
                )}

                {/* Icon */}
                <div style={{
                  width: 44, height: 30,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 10,
                  background: isActive ? 'rgba(34,197,94,0.12)' : 'transparent',
                  transition: 'all 0.18s ease',
                  transform: isActive ? 'translateY(-1px) scale(1.05)' : 'scale(1)',
                }}>
                  <Icon
                    size={21}
                    strokeWidth={isActive ? 2.3 : 1.6}
                    color={isActive ? 'var(--green)' : '#6b7280'}
                  />
                </div>

                {/* Label */}
                <span style={{
                  fontSize: 9,
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? 'var(--green)' : '#6b7280',
                  letterSpacing: '0.01em',
                  lineHeight: 1,
                  transition: 'all 0.18s ease',
                }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @media (max-width: 767px) {
          body { padding-bottom: 80px; }
        }
      `}</style>
    </>
  );
}
