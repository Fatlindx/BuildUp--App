import { useState } from 'react';
import { supabase } from '../supabase';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

export default function Auth({ onLogin }) {
  const [mode, setMode]         = useState('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const handleSubmit = async () => {
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLogin(data.user);
      } else if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          await supabase.from('profiles').insert({ id: data.user.id, username });
        }
        setSuccess('📧 Bestätigungsmail gesendet! Bitte prüfe dein Postfach und klicke auf den Link um dein Konto zu aktivieren.');
        setMode('login');
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setSuccess('✅ E-Mail zum Zurücksetzen wurde gesendet! Prüfe deinen Posteingang.');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, background: 'linear-gradient(135deg, var(--green), var(--green-dark))',
            borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, margin: '0 auto 16px', boxShadow: 'var(--shadow-green)'
          }}>💪</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-1px', marginBottom: 6 }}>BuildUp</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {mode === 'login' ? 'Willkommen zurück!' : mode === 'register' ? 'Erstelle dein kostenloses Konto' : 'Passwort zurücksetzen'}
          </p>
        </div>

        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)', padding: 32
        }}>
          {mode !== 'forgot' && (
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card-2)', borderRadius: 10, padding: 4, marginBottom: 28 }}>
              {['login', 'register'].map(m => (
                <button key={m} onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                  style={{
                    flex: 1, padding: '9px', borderRadius: 8, fontSize: 13.5, fontWeight: 600,
                    background: mode === m ? 'var(--green-glow)' : 'transparent',
                    border: mode === m ? '1px solid var(--border-active)' : '1px solid transparent',
                    color: mode === m ? 'var(--green)' : 'var(--text-secondary)',
                    cursor: 'pointer', transition: 'var(--transition)'
                  }}>
                  {m === 'login' ? 'Einloggen' : 'Registrieren'}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'register' && (
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="form-input" placeholder="Benutzername" value={username}
                  onChange={e => setUsername(e.target.value)} style={{ paddingLeft: 38 }} />
              </div>
            )}
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="form-input" type="email" placeholder="E-Mail" value={email}
                onChange={e => setEmail(e.target.value)} style={{ paddingLeft: 38 }} />
            </div>
            {mode !== 'forgot' && (
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="form-input" type={showPw ? 'text' : 'password'} placeholder="Passwort"
                  value={password} onChange={e => setPassword(e.target.value)}
                  style={{ paddingLeft: 38, paddingRight: 42 }}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
                <button onClick={() => setShowPw(p => !p)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer'
                }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            )}
          </div>

          {mode === 'login' && (
            <div style={{ textAlign: 'right', marginTop: 8 }}>
              <button onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                style={{ fontSize: 12.5, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Passwort vergessen?
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                style={{ fontSize: 12.5, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                ← Zurück zum Login
              </button>
            </div>
          )}

          {error && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 13, color: '#f87171' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, fontSize: 13, color: 'var(--green)' }}>
              {success}
            </div>
          )}

          <button className="btn btn-primary" onClick={handleSubmit}
            disabled={loading || !email || (mode !== 'forgot' && !password)}
            style={{ width: '100%', justifyContent: 'center', marginTop: 20, padding: 13 }}>
            {loading ? 'Bitte warten...' : mode === 'login' ? 'Einloggen' : mode === 'register' ? 'Konto erstellen' : 'Reset-E-Mail senden'}
          </button>
        </div>
      </div>
    </div>
  );
}