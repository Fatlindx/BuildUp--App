import { useState } from 'react';
import { Home, UtensilsCrossed, Flame, Dumbbell, BarChart2, Zap, LogOut, Bot, ClipboardList } from 'lucide-react';

const navItems = [
  { id: 'home',       label: 'Home',        icon: Home },
  { id: 'nutrition',  label: 'Ernährung',   icon: UtensilsCrossed },
  { id: 'calculator', label: 'Rechner',     icon: Flame },
  { id: 'exercises',  label: 'Übungen',     icon: Dumbbell },
  { id: 'workout',    label: 'Training',    icon: ClipboardList },
  { id: 'progress',   label: 'Fortschritt', icon: BarChart2 },
];

export default function Navigation({ activeSection, setActiveSection, user, profile, onLogout, onOpenCoach }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNav = (id) => {
    setActiveSection(id);
    setMenuOpen(false);
  };

  return (
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
          {navItems.map(item => {
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

          {/* Klickbarer Username → Profil */}
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
              {profile?.username || user.email?.split('@')[0]}
            </button>
          )}

          {/* KI Coach Button */}
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
                boxShadow: 'none',
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

          {/* Logout */}
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

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
    </nav>
  );
}
