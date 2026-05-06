import { useState } from 'react';
import { supabase } from '../supabase';
import { Mail, Lock, User, Eye, EyeOff, AlertTriangle } from 'lucide-react';

// ── Fehlermeldungen auf Deutsch ──
function translateError(message) {
  const msg = message?.toLowerCase() || '';
  if (msg.includes('invalid login credentials') || msg.includes('invalid email or password'))
    return 'E-Mail oder Passwort ist falsch.';
  if (msg.includes('email not confirmed'))
    return 'Bitte bestätige zuerst deine E-Mail-Adresse.';
  if (msg.includes('user already registered') || msg.includes('already been registered'))
    return 'Diese E-Mail-Adresse ist bereits registriert.';
  if (msg.includes('password should be at least'))
    return 'Das Passwort muss mindestens 6 Zeichen lang sein.';
  if (msg.includes('unable to validate email address') || msg.includes('invalid email'))
    return 'Bitte gib eine gültige E-Mail-Adresse ein.';
  if (msg.includes('email rate limit') || msg.includes('too many requests'))
    return 'Zu viele Versuche. Bitte warte kurz und versuche es erneut.';
  if (msg.includes('network') || msg.includes('fetch'))
    return 'Verbindungsfehler. Bitte prüfe deine Internetverbindung.';
  if (msg.includes('signup is disabled'))
    return 'Registrierung ist momentan nicht verfügbar.';
  // Fallback: original message
  return 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.';
}

// ── Validierung vor dem API-Call ──
function validate(mode, email, password, username) {
  if (!email.trim()) return 'Bitte gib deine E-Mail-Adresse ein.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Bitte gib eine gültige E-Mail-Adresse ein.';
  if (mode === 'forgot') return null;
  if (!password) return 'Bitte gib dein Passwort ein.';
  if (mode === 'register') {
    if (!username.trim()) return 'Bitte gib einen Benutzernamen ein.';
    if (username.trim().length < 3) return 'Der Benutzername muss mindestens 3 Zeichen lang sein.';
    if (password.length < 6) return 'Das Passwort muss mindestens 6 Zeichen lang sein.';
  }
  return null;
}

export default function Auth({ onLogin }) {
  const [mode, setMode]         = useState('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const switchMode = (m) => {
    setMode(m);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    // Client-seitige Validierung zuerst
    const validationError = validate(mode, email, password, username);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLogin(data.user);

      } else if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          await supabase.from('profiles').insert({
            id: data.user.id,
            username: username.trim(),
          });
        }
        setSuccess('Bestätigungsmail gesendet! Prüfe dein Postfach und klicke auf den Bestätigungslink.');
        setMode('login');

      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setSuccess('Reset-E-Mail gesendet! Prüfe deinen Posteingang.');
      }
    } catch (e) {
      setError(translateError(e.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* ── Logo ── */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56,
            
            borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', boxShadow: 'var(--shadow-green)',
          }}>
            <img src="/logo-512.png" alt="BuildUp" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 'var(--radius-lg)', display: "block" }} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-1px', marginBottom: 6 }}>
            BuildUp
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {mode === 'login'    ? 'Willkommen zurück!' :
             mode === 'register' ? 'Erstelle dein kostenloses Konto' :
                                   'Passwort zurücksetzen'}
          </p>
        </div>

        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)', padding: 32,
        }}>

          {/* ── Tab Toggle ── */}
          {mode !== 'forgot' && (
            <div style={{
              display: 'flex', gap: 4,
              background: 'var(--bg-card-2)', borderRadius: 10,
              padding: 4, marginBottom: 28,
            }}>
              {[
                { id: 'login',    label: 'Einloggen' },
                { id: 'register', label: 'Registrieren' },
              ].map(m => (
                <button key={m.id} onClick={() => switchMode(m.id)} style={{
                  flex: 1, padding: '9px', borderRadius: 8,
                  fontSize: 14, fontWeight: 600,
                  background: mode === m.id ? 'var(--green-glow)' : 'transparent',
                  border: mode === m.id ? '1px solid var(--border-active)' : '1px solid transparent',
                  color: mode === m.id ? 'var(--green)' : 'var(--text-secondary)',
                  cursor: 'pointer', transition: 'var(--transition)',
                }}>
                  {m.label}
                </button>
              ))}
            </div>
          )}

          {/* ── Felder ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {mode === 'register' && (
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  className="form-input"
                  placeholder="Benutzername"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  style={{ paddingLeft: 38 }}
                  autoComplete="username"
                />
              </div>
            )}

            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                className="form-input"
                type="email"
                placeholder="E-Mail"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ paddingLeft: 38 }}
                autoComplete="email"
              />
            </div>

            {mode !== 'forgot' && (
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder={mode === 'register' ? 'Passwort (min. 6 Zeichen)' : 'Passwort'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ paddingLeft: 38, paddingRight: 42 }}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                />
                <button onClick={() => setShowPw(p => !p)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer',
                }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            )}
          </div>

          {/* ── Links ── */}
          {mode === 'login' && (
            <div style={{ textAlign: 'right', marginTop: 8 }}>
              <button onClick={() => switchMode('forgot')} style={{
                fontSize: 13, color: 'var(--text-muted)',
                background: 'none', border: 'none', cursor: 'pointer',
              }}>
                Passwort vergessen?
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <button onClick={() => switchMode('login')} style={{
                fontSize: 13, color: 'var(--text-muted)',
                background: 'none', border: 'none', cursor: 'pointer',
              }}>
                ← Zurück zum Login
              </button>
            </div>
          )}

          {/* ── Fehlermeldung ── */}
          {error && (
            <div style={{
              marginTop: 16, padding: '11px 14px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 10, fontSize: 14,
              color: '#f87171', lineHeight: 1.5,
              display: 'flex', alignItems: 'flex-start', gap: 8,
            }}>
              <AlertTriangle size={15} style={{ flexShrink: 0, color: "#f97316" }} />
              {error}
            </div>
          )}

          {/* ── Erfolgsmeldung ── */}
          {success && (
            <div style={{
              marginTop: 16, padding: '11px 14px',
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: 10, fontSize: 14,
              color: 'var(--green)', lineHeight: 1.5,
            }}>
              {success}
            </div>
          )}

          {/* ── Submit Button ── */}
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || !email || (mode !== 'forgot' && !password)}
            style={{ width: '100%', justifyContent: 'center', marginTop: 20, padding: 13, fontSize: 15 }}
          >
            {loading ? 'Bitte warten...' :
             mode === 'login'    ? 'Einloggen' :
             mode === 'register' ? 'Konto erstellen' :
                                   'Reset-E-Mail senden'}
          </button>
        </div>
      </div>
    </div>
  );
}
