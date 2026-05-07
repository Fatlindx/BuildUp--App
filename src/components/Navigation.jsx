import { useState, useEffect, useRef } from 'react';
import { useI18n, LANG_LABELS, translateGoal } from '../i18n.jsx';
import {
  Home, UtensilsCrossed, Flame, Dumbbell, BarChart2,
  ClipboardList, Bot, ChevronLeft, LogOut,
  User, Settings, Shield, HelpCircle, X, Globe,
  Target, Scale, Ruler, Activity, ChevronRight,
} from 'lucide-react';

export default function Navigation({
  activeSection, setActiveSection,
  canGoBack, onGoBack,
  user, profile,
  onOpenCoach, onLogout,
}) {
  const { t, lang, setLang } = useI18n();
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isMobile,     setIsMobile]     = useState(window.innerWidth < 768);
  const panelRef = useRef(null);

  // Nav items — bottom bar + desktop
  const navItems = [
    { id: 'home',       label: t('nav.home'),       icon: Home },
    { id: 'nutrition',  label: t('nav.nutrition'),  icon: UtensilsCrossed },
    { id: 'exercises',  label: t('nav.exercises'),  icon: Dumbbell },
    { id: 'workout',    label: t('nav.training'),   icon: ClipboardList },
    { id: 'progress',   label: t('nav.progress'),   icon: BarChart2 },
    { id: 'calculator', label: t('nav.calculator'), icon: Flame },
  ];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setMenuOpen(false);
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [menuOpen]);

  // Close on ESC
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { setMenuOpen(false); setSettingsOpen(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleNav = (id) => {
    setActiveSection(id);
    setMenuOpen(false);
    setSettingsOpen(false);
  };

  const handleLangChange = (newLang) => {
    setLang(newLang);
   
  };

  const displayName = profile?.username || profile?.full_name?.split(' ')[0] || 'User';

  // ─── Hamburger Icon ───────────────────────────────────────────
  const HamburgerIcon = ({ open }) => (
    <div style={{
      width: 20, height: 14, display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between', position: 'relative',
    }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          display: 'block', height: 1.5, background: 'var(--text)',
          borderRadius: 2, transformOrigin: 'center',
          transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: open
            ? i === 0 ? 'rotate(45deg) translate(4px, 4px)'
            : i === 1 ? 'scaleX(0) translateX(8px)'
            : 'rotate(-45deg) translate(4px, -4px)'
            : 'none',
          opacity: open && i === 1 ? 0 : 1,
        }} />
      ))}
    </div>
  );

  // ─── Slide-In Menu Panel ──────────────────────────────────────
  const MenuPanel = () => (
    <>
      {/* Backdrop */}
      <div onClick={() => { setMenuOpen(false); setSettingsOpen(false); }} style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease both',
      }} />

      {/* Panel */}
      <div ref={panelRef} style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: Math.min(300, window.innerWidth * 0.82),
        zIndex: 1101,
        background: 'var(--bg-elevated, #111111)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        animation: 'slideInLeft 0.25s cubic-bezier(0.4, 0, 0.2, 1) both',
        overflowY: 'auto',
      }}>

        {/* Panel Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <button onClick={() => handleNav('home')} style={{
            display: 'flex', alignItems: 'center', gap: 9,
            background: 'none', border: 'none', cursor: 'pointer',
          }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, overflow: 'hidden', flexShrink: 0 }}>
              <img src="/logo-512.png" alt="BuildUp"
                style={{ width: 28, height: 28, objectFit: 'cover' }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', letterSpacing: '-0.3px' }}>
              BuildUp
            </span>
          </button>
          <button onClick={() => { setMenuOpen(false); setSettingsOpen(false); }} style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'var(--bg-card-2)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-muted)',
          }}>
            <X size={14} />
          </button>
        </div>

        {/* Profile Summary */}
        {user && !settingsOpen && (
          <button onClick={() => handleNav('profile')} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 20px',
            background: 'none', border: 'none',
            borderBottom: '1px solid var(--border)',
            cursor: 'pointer', textAlign: 'left',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'var(--green-glow)', border: '1.5px solid var(--border-active)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, color: 'var(--green)', fontWeight: 700, fontSize: 14,
            }}>
              {displayName[0]?.toUpperCase() || <User size={16} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                {t('profile.title')}
              </div>
            </div>
            <ChevronRight size={14} color="var(--text-muted)" />
          </button>
        )}

        {/* Settings Sub-View */}
        {settingsOpen ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Settings Back */}
            <button onClick={() => setSettingsOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 20px', background: 'none', border: 'none',
              borderBottom: '1px solid var(--border)',
              cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13,
            }}>
              <ChevronLeft size={14} />
              <span>{t('common.back')}</span>
            </button>

            <div style={{ padding: '8px 0', flex: 1, overflowY: 'auto' }}>

              {/* Language Section */}
              <div style={{ padding: '12px 20px 6px' }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8,
                }}>
                  {t('profile.language')}
                </div>
                {Object.entries(LANG_LABELS).map(([code, label]) => (
                  <button key={code} onClick={() => handleLangChange(code)} style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px', borderRadius: 9, marginBottom: 4,
                    background: lang === code ? 'var(--green-glow)' : 'var(--bg-card-2)',
                    border: `1px solid ${lang === code ? 'var(--border-active)' : 'var(--border)'}`,
                    cursor: 'pointer', transition: 'all 0.15s ease',
                  }}>
                    <span style={{
                      fontSize: 13, fontWeight: lang === code ? 600 : 400,
                      color: lang === code ? 'var(--green)' : 'var(--text)',
                    }}>
                      {label}
                    </span>
                    {lang === code && (
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: 'var(--green)', flexShrink: 0,
                      }} />
                    )}
                  </button>
                ))}
              </div>

            </div>
          </div>
        ) : (
          /* Main Menu Items */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 0' }}>
            {[
              { icon: Settings,   label: t('nav.settings'),     action: () => setSettingsOpen(true), hasArrow: true },
              { icon: Shield,     label: t('nav.privacy'),      action: () => {} },
              { icon: HelpCircle, label: t('nav.help'),         action: () => {} },
            ].map((item) => (
              <button key={item.label} onClick={item.action} style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px', background: 'none', border: 'none',
                cursor: 'pointer', textAlign: 'left',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9,
                    background: 'var(--bg-card-2)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <item.icon size={16} color="var(--text-secondary, var(--text-muted))" strokeWidth={1.8} />
                  </div>
                  <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 400 }}>
                    {item.label}
                  </span>
                </div>
                {item.hasArrow && <ChevronRight size={14} color="var(--text-muted)" />}
              </button>
            ))}

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--border)', margin: '8px 20px' }} />

            {/* Logout */}
            {user && (
              <button onClick={() => { setMenuOpen(false); onLogout(); }} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 20px', background: 'none', border: 'none',
                cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                  background: 'rgba(239,68,68,0.10)',
                  border: '1px solid rgba(239,68,68,0.22)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <LogOut size={14} color="#ef4444" strokeWidth={2} />
                </div>
                <span style={{ fontSize: 14, color: '#ef4444', fontWeight: 500 }}>
                  {t('nav.logout')}
                </span>
              </button>
            )}

            {/* App version */}
            <div style={{ marginTop: 'auto', padding: '16px 20px 20px', flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.5 }}>
                BuildUp v1.0
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* ── DESKTOP NAV ── */}
      {!isMobile && (
        <nav className="nav">
          <div className="nav-container">
            {/* Left: Hamburger */}
            <button onClick={() => { setMenuOpen(o => !o); setSettingsOpen(false); }}
              style={{
                width: 34, height: 34, borderRadius: 9,
                background: menuOpen ? 'var(--bg-card-2)' : 'none',
                border: `1px solid ${menuOpen ? 'var(--border)' : 'transparent'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
                transition: 'all 0.2s ease',
              }}
              aria-label="Menü">
              <HamburgerIcon open={menuOpen} />
            </button>

            {/* Logo centered */}
            <button className="nav-logo" onClick={() => handleNav('home')}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <div className="logo-icon" style={{ overflow: 'hidden', padding: 0 }}>
                <img src="/logo-512.png" alt="BuildUp"
                  style={{ width: 34, height: 34, objectFit: 'cover' }} />
              </div>
              <span className="logo-text">BuildUp</span>
            </button>

            {/* Nav Links */}
            <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
              {navItems.map(item => {
                const Icon = item.icon;
                return (
                  <button key={item.id}
                    className={`nav-link ${activeSection === item.id ? 'active' : ''}`}
                    onClick={() => handleNav(item.id)}>
                    <Icon size={15} strokeWidth={1.8} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right: Back + Coach */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {canGoBack && activeSection !== 'home' && (
                <button onClick={onGoBack} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 9,
                  background: 'var(--bg-card-2)', border: '1px solid var(--border)',
                  color: 'var(--text-muted)', cursor: 'pointer',
                  fontSize: 13, fontWeight: 500, flexShrink: 0,
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--border-active)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
                  <ChevronLeft size={15} />
                  <span>{t('nav.back')}</span>
                </button>
              )}
              {user && (
                <button onClick={onOpenCoach} style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '7px 13px', borderRadius: 10,
                  background: 'var(--green-glow)', border: '1px solid var(--border-active)',
                  cursor: 'pointer', color: 'var(--green)', fontWeight: 600, fontSize: 13,
                  transition: 'all 0.2s ease', whiteSpace: 'nowrap', flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--green-glow)'; }}>
                  <Bot size={15} strokeWidth={2} />
                  <span>{t('nav.coach')}</span>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
                </button>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* ── MOBILE TOP BAR ── */}
      {isMobile && (
        <>
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
            background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)',
            padding: '0 16px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', height: 56,
          }}>

            {/* Left: Hamburger (or Back) */}
            <div style={{ width: 44, display: 'flex', alignItems: 'center' }}>
              {canGoBack && activeSection !== 'home' ? (
                <button onClick={onGoBack} style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: 'var(--bg-card-2)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--text-muted)',
                }}>
                  <ChevronLeft size={18} />
                </button>
              ) : (
                <button onClick={() => { setMenuOpen(o => !o); setSettingsOpen(false); }} style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: menuOpen ? 'var(--bg-card-2)' : 'none',
                  border: `1px solid ${menuOpen ? 'var(--border)' : 'transparent'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                }}
                aria-label="Menü">
                  <HamburgerIcon open={menuOpen} />
                </button>
              )}
            </div>

            {/* Center: Logo */}
            <button onClick={() => handleNav('home')} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'none', border: 'none', cursor: 'pointer',
              position: 'absolute', left: '50%', transform: 'translateX(-50%)',
            }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, overflow: 'hidden', flexShrink: 0 }}>
                <img src="/logo-512.png" alt="BuildUp"
                  style={{ width: 28, height: 28, objectFit: 'cover' }} />
              </div>
              <span style={{
                fontWeight: 700, fontSize: 16, color: 'var(--text)',
                letterSpacing: '-0.3px',
              }}>BuildUp</span>
            </button>

            {/* Right: Coach */}
            <div style={{ width: 44, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              {user && (
                <button onClick={onOpenCoach} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 10px', borderRadius: 9,
                  background: 'var(--green-glow)', border: '1px solid var(--border-active)',
                  cursor: 'pointer', color: 'var(--green)', fontWeight: 600, fontSize: 12,
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  <Bot size={13} strokeWidth={2} />
                  <span>{t('nav.coach')}</span>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
                </button>
              )}
            </div>
          </div>
          <div style={{ height: 56 }} />
        </>
      )}

      {/* ── SLIDE-IN MENU PANEL ── */}
      {menuOpen && <MenuPanel />}

      {/* ── MOBILE BOTTOM NAV ── */}
      {isMobile && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
          background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)', borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
          paddingTop: 6, paddingBottom: 'calc(6px + env(safe-area-inset-bottom))',
        }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button key={item.id} onClick={() => handleNav(item.id)} style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 2,
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '4px 2px 6px', position: 'relative',
                WebkitTapHighlightColor: 'transparent',
              }}>
                {isActive && (
                  <span style={{
                    position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)',
                    width: 24, height: 2.5, borderRadius: 2, background: 'var(--green)',
                  }} />
                )}
                <div style={{
                  width: 44, height: 30, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', borderRadius: 10,
                  background: isActive ? 'rgba(34,197,94,0.12)' : 'transparent',
                  transition: 'all 0.18s ease',
                  transform: isActive ? 'translateY(-1px) scale(1.05)' : 'scale(1)',
                }}>
                  <Icon size={22} strokeWidth={isActive ? 2.3 : 1.6}
                    color={isActive ? 'var(--green)' : '#6b7280'} />
                </div>
                <span style={{
                  fontSize: 9, fontWeight: isActive ? 700 : 400,
                  color: isActive ? 'var(--green)' : '#6b7280',
                  letterSpacing: '0.01em', lineHeight: 1,
                  transition: 'all 0.18s ease',
                }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      )}
    </>
  );
}
