import { useState, useEffect } from 'react';
import { User, Mail, Calendar, Target, Edit3, Save, X, Dumbbell, Flame, TrendingUp, Scale } from 'lucide-react';

export default function ProfilePage({ user, profile, onUpdateProfile }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    username:  profile?.username  || '',
    full_name: profile?.full_name || '',
    goal:      profile?.goal      || 'Muskelaufbau',
    weight:    profile?.weight    || '',
    height:    profile?.height    || '',
  });

  // Sync when profile loads/changes
  useEffect(() => {
    setForm({
      username:  profile?.username  || '',
      full_name: profile?.full_name || '',
      goal:      profile?.goal      || 'Muskelaufbau',
      weight:    profile?.weight    || '',
      height:    profile?.height    || '',
    });
  }, [profile]);

  const goals = ['Muskelaufbau', 'Gewicht verlieren', 'Fit bleiben', 'Ausdauer verbessern'];

  const handleSave = async () => {
    if (onUpdateProfile) await onUpdateProfile(form);
    setEditing(false);
  };

  const handleCancel = () => {
    setForm({
      username:  profile?.username  || '',
      full_name: profile?.full_name || '',
      goal:      profile?.goal      || 'Muskelaufbau',
      weight:    profile?.weight    || '',
      height:    profile?.height    || '',
    });
    setEditing(false);
  };

  // ✅ NEVER derive from email — always username or 'User'
  const displayName = profile?.username || 'User';
  const avatarLetter = displayName !== 'User' ? displayName[0].toUpperCase() : null;

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
    : 'Unbekannt';

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px' }}>

      {/* Header Card */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '32px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 24, position: 'relative',
      }}>
        {/* Avatar */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'var(--green-glow)', border: '2px solid var(--green)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {avatarLetter
            ? <span style={{ fontSize: 32, fontWeight: 700, color: 'var(--green)' }}>{avatarLetter}</span>
            : <User size={32} color="var(--green)" />
          }
        </div>

        {/* Info */}
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            {form.full_name || displayName}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            @{displayName}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <Calendar size={12} color="var(--text-muted)" />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Mitglied seit {memberSince}</span>
          </div>
        </div>

        {!editing && (
          <button onClick={() => setEditing(true)} style={{
            position: 'absolute', top: 20, right: 20,
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 10,
            background: 'var(--bg-card-2)', border: '1px solid var(--border)',
            color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--green)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <Edit3 size={13} /> Bearbeiten
          </button>
        )}
      </div>

      {/* P7: Stats Row — mit Profil-Daten gefüllt */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { icon: Dumbbell,   label: 'Gewicht',    value: profile?.weight ? `${profile.weight} kg` : '—' },
          { icon: Scale,      label: 'Grösse',     value: profile?.height ? `${profile.height} cm` : '—' },
          { icon: TrendingUp, label: 'Ziel',        value: profile?.goal ? profile.goal.split(' ')[0] : '—' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '16px', textAlign: 'center',
          }}>
            <Icon size={20} color="var(--green)" style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Details Card */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '24px',
      }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginTop: 0, marginBottom: 20 }}>
          Profil-Details
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          <Field label="E-Mail" icon={Mail}>
            <span style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>{user?.email}</span>
          </Field>

          <Field label="Benutzername" icon={User}>
            {editing ? (
              <input value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="Dein Benutzername" style={inputStyle} />
            ) : (
              <span style={valueStyle}>
                {form.username || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Nicht gesetzt</span>}
              </span>
            )}
          </Field>

          <Field label="Vollständiger Name" icon={User}>
            {editing ? (
              <input value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Max Mustermann" style={inputStyle} />
            ) : (
              <span style={valueStyle}>{form.full_name || '—'}</span>
            )}
          </Field>

          <Field label="Fitnessziel" icon={Target}>
            {editing ? (
              <select value={form.goal}
                onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
                style={inputStyle}>
                {goals.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            ) : (
              <span style={{ ...valueStyle, color: 'var(--green)' }}>{form.goal || '—'}</span>
            )}
          </Field>

          <Field label="Gewicht (kg)" icon={Scale}>
            {editing ? (
              <input type="number" value={form.weight}
                onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                placeholder="75" style={inputStyle} />
            ) : (
              <span style={valueStyle}>{form.weight ? `${form.weight} kg` : '—'}</span>
            )}
          </Field>

          <Field label="Größe (cm)" icon={TrendingUp}>
            {editing ? (
              <input type="number" value={form.height}
                onChange={e => setForm(f => ({ ...f, height: e.target.value }))}
                placeholder="180" style={inputStyle} />
            ) : (
              <span style={valueStyle}>{form.height ? `${form.height} cm` : '—'}</span>
            )}
          </Field>

        </div>

        {editing && (
          <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
            <button onClick={handleCancel} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 10,
              background: 'none', border: '1px solid var(--border)',
              color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13,
            }}>
              <X size={13} /> Abbrechen
            </button>
            <button onClick={handleSave} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 10,
              background: 'var(--green)', border: 'none',
              color: '#000', cursor: 'pointer', fontSize: 13, fontWeight: 700,
            }}>
              <Save size={13} /> Speichern
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Icon size={12} color="var(--text-muted)" />
        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

const valueStyle = { fontSize: 13.5, color: 'var(--text)' };
const inputStyle = {
  width: '100%', padding: '7px 10px',
  background: 'var(--bg-card-2)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--text)', fontSize: 13,
  outline: 'none', boxSizing: 'border-box',
};
