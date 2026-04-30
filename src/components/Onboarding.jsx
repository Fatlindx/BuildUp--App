import { useState } from 'react';
import { supabase } from '../supabase';

const goals = [
  { id: 'nutrition', emoji: '🥗', label: 'Ernährung tracken',  desc: 'Ich möchte meine Ernährung im Blick behalten' },
  { id: 'muscle',    emoji: '💪', label: 'Muskeln aufbauen',    desc: 'Ich möchte Muskelmasse aufbauen' },
  { id: 'lose',      emoji: '🔥', label: 'Abnehmen',            desc: 'Ich möchte Gewicht verlieren' },
  { id: 'beginner',  emoji: '🏃', label: 'Einsteiger',          desc: 'Ich fange gerade erst an' },
];

export default function Onboarding({ user, onComplete }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(false);

  const handleComplete = async () => {
    if (!selected) return;
    setLoading(true);
    await supabase.from('profiles').upsert({
      id: user.id,
      goal: selected,
      onboarding_done: true,
    });
    onComplete(selected);
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
    }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, background: 'linear-gradient(135deg, var(--green), var(--green-dark))',
            borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, margin: '0 auto 16px', boxShadow: 'var(--shadow-green)'
          }}>💪</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.8px', marginBottom: 8 }}>
            Willkommen bei BuildUp!
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6 }}>
            Was ist dein Hauptziel? Wir passen die App für dich an.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
          {goals.map(g => (
            <button key={g.id} onClick={() => setSelected(g.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 18,
                padding: '18px 22px', borderRadius: 'var(--radius-lg)',
                background: selected === g.id ? 'var(--green-glow)' : 'var(--bg-card)',
                border: selected === g.id ? '1px solid var(--border-active)' : '1px solid var(--border)',
                cursor: 'pointer', transition: 'var(--transition)', textAlign: 'left',
                boxShadow: selected === g.id ? 'var(--shadow-green)' : 'none',
              }}>
              <span style={{ fontSize: 32, flexShrink: 0 }}>{g.emoji}</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: selected === g.id ? 'var(--green)' : 'var(--text)', marginBottom: 3 }}>
                  {g.label}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{g.desc}</div>
              </div>
              <div style={{
                marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                border: selected === g.id ? '2px solid var(--green)' : '2px solid var(--border)',
                background: selected === g.id ? 'var(--green)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {selected === g.id && <span style={{ color: '#000', fontSize: 11, fontWeight: 900 }}>✓</span>}
              </div>
            </button>
          ))}
        </div>

        <button className="btn btn-primary" onClick={handleComplete}
          disabled={!selected || loading}
          style={{ width: '100%', justifyContent: 'center', padding: 14, fontSize: 15 }}>
          {loading ? 'Wird gespeichert...' : 'Los geht\'s →'}
        </button>
      </div>
    </div>
  );
}