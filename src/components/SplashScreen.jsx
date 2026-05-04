import { useEffect, useState } from 'react';

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState('in');

  useEffect(() => {
    const holdTimer = setTimeout(() => setPhase('out'), 1800);
    const doneTimer = setTimeout(() => onDone(), 2300);
    return () => { clearTimeout(holdTimer); clearTimeout(doneTimer); };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#080808',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 24,
      opacity: phase === 'out' ? 0 : 1,
      transition: 'opacity 0.5s ease',
      pointerEvents: 'none',
    }}>
      {/* Echtes Logo */}
      <div style={{
        width: 96, height: 96,
        borderRadius: 26,
        overflow: 'hidden',
        animation: 'splashIconIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        boxShadow: '0 0 60px rgba(34,197,94,0.3), 0 0 120px rgba(34,197,94,0.1)',
      }}>
        <img
          src="/logo-512.png"
          alt="BuildUp"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* Wordmark */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        animation: 'splashTextIn 0.6s 0.2s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}>
        <div style={{
          fontSize: 38, fontWeight: 900, letterSpacing: '-1.5px',
          background: 'linear-gradient(135deg, #fff 40%, #4ade80)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Build<span style={{
            background: 'linear-gradient(135deg, #22c55e, #4ade80)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Up</span>
        </div>
        <div style={{
          fontSize: 12, color: 'rgba(255,255,255,0.35)',
          letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 500,
        }}>
          Fortschritt, der bleibt.
        </div>
      </div>

      {/* Loading Dots */}
      <div style={{
        display: 'flex', gap: 6,
        animation: 'splashTextIn 0.6s 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        marginTop: 4,
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 5, height: 5, borderRadius: '50%',
            background: '#22c55e',
            animation: `splashDot 1.2s ease ${i * 0.18}s infinite`,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes splashIconIn {
          from { opacity: 0; transform: scale(0.6) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes splashTextIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splashDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40%            { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
