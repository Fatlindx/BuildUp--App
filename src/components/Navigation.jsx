import { useState } from 'react';
import { Home, UtensilsCrossed, Flame, Dumbbell, BarChart2, Zap, LogOut, Bot, Dumbbell as WorkoutIcon } from 'lucide-react';

const navItems = [
  { id: 'home',       label: 'Home',        icon: Home },
  { id: 'nutrition',  label: 'Ernährung',   icon: UtensilsCrossed },
  { id: 'calculator', label: 'Kalorien',    icon: Flame },
  { id: 'exercises',  label: 'Übungen',     icon: Dumbbell },
  { id: 'workout',    label: 'Training',    icon: Dumbbell },
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
          {user && (
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
              {profile?.username || user.email?.split('@')[0]}
            </span>
          )}

          {user && (
            <button
              onClick={onOpenCoach}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 16px', borderRadius: 10,
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                border: 'none', cursor: 'pointer', color: '#000',
                fontWeight: 700, fontSize: 13,
                boxShadow: '0 0 18px rgba(34,197,94,0.4)',
                transition: 'all 0.2s ease',
                position: 'relative', overflow: 'hidden',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 0 28px rgba(34,197,94,0.6)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 0 18px rgba(34,197,94,0.4)';
              }}
              title="KI Coach öffnen"
            >
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.15), transparent)',
                pointerEvents: 'none'
              }} />
              <Bot size={15} strokeWidth={2.5} />
              <span>KI Coach</span>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#000', opacity: 0.5,
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

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
    </nav>
  );
}