import { 
  UtensilsCrossed, Dumbbell, BarChart2, Flame, 
  Plus, Calculator, ChevronRight, MessageCircle,
  Target, Zap, Activity, TrendingUp, CheckCircle2,
  AlertCircle, Sunrise
} from 'lucide-react';
import { useState, useEffect } from 'react';

// ── Dynamische Motivations-Texte ──
function getDynamicStatus(pct, totalCalories, calorieGoal, dailyLog, hour) {
  // Ziel erreicht
  if (pct >= 100) return {
    title: 'Perfekt getroffen! 🎯',
    subtitle: 'Tagesziel erreicht. Bleib auf Kurs.',
    color: '#22c55e',
    icon: '🏆',
  };
  // Fast da
  if (pct >= 85) return {
    title: 'Du bist nah dran 💪',
    subtitle: `Noch ${(calorieGoal - totalCalories).toLocaleString()} kcal bis zum Ziel.`,
    color: '#4ade80',
    icon: '🔥',
  };
  // Guter Fortschritt
  if (pct >= 50) return {
    title: 'Stark unterwegs ⚡',
    subtitle: 'Du bist heute auf Kurs.',
    color: '#60a5fa',
    icon: '📈',
  };
  // Morgens mit nichts gegessen
  if (hour < 10 && dailyLog.length === 0) return {
    title: `Guten Morgen! ☀️`,
    subtitle: 'Starte deinen Tag mit einer guten Mahlzeit.',
    color: '#f97316',
    icon: '🌅',
  };
  // Abends noch wenig
  if (hour >= 18 && pct < 30) return {
    title: 'Heute noch nachholen ⏰',
    subtitle: 'Du hast heute wenig gegessen.',
    color: '#f97316',
    icon: '⚠️',
  };
  // Standard — noch am Start
  return {
    title: 'Bereit für dein Training?',
    subtitle: 'Verfolge deine Ernährung und erreiche deine Ziele.',
    color: 'var(--text)',
    icon: null,
  };
}

// ── Motivations-Chips ──
const motivationQuotes = [
  'Disziplin schlägt Motivation jeden Tag.',
  'Kein Schmerz, kein Wachstum.',
  'Consistency is the key to results.',
  'Kleine Schritte, große Veränderungen.',
  'Du bist stärker als deine Ausreden.',
  'Heute ist der Tag. Nicht morgen.',
  'Fortschritt, nicht Perfektion.',
];

// ── Mahlzeit-Feedback Toast ──
function FeedbackToast({ message, show }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9000,
      background: 'rgba(34,197,94,0.95)',
      backdropFilter: 'blur(12px)',
      color: '#000',
      padding: '10px 20px',
      borderRadius: 100,
      fontSize: 13.5, fontWeight: 700,
      display: 'flex', alignItems: 'center', gap: 8,
      animation: 'toastIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
      boxShadow: '0 4px 24px rgba(34,197,94,0.4)',
      whiteSpace: 'nowrap',
    }}>
      <CheckCircle2 size={15} />
      {message}
    </div>
  );
}

export default function Home({ setActiveSection, calorieGoal, totalCalories, dailyLog, username }) {
  const hour = new Date().getHours();
  const greeting     = hour < 5 ? 'Gute Nacht' : hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend';
  const greetingIcon = hour < 5 ? '🌙' : hour < 12 ? '☀️' : hour < 18 ? '⚡' : '🌆';

  const pct = calorieGoal > 0 ? Math.min((totalCalories / calorieGoal) * 100, 100) : 0;
  const remaining = Math.max(calorieGoal - totalCalories, 0);

  const totalProtein = dailyLog.reduce((s, i) => s + (i.protein || 0), 0);
  const totalCarbs   = dailyLog.reduce((s, i) => s + (i.carbs   || 0), 0);
  const totalFat     = dailyLog.reduce((s, i) => s + (i.fat     || 0), 0);

  const macros = [
    { label: 'Protein',       value: totalProtein, unit: 'g', color: '#ef4444' },
    { label: 'Kohlenhydrate', value: totalCarbs,   unit: 'g', color: '#f97316' },
    { label: 'Fette',         value: totalFat,     unit: 'g', color: '#eab308' },
  ];

  const quote = motivationQuotes[new Date().getDate() % motivationQuotes.length];
  const status = getDynamicStatus(pct, totalCalories, calorieGoal, dailyLog, hour);

  const circumference = 2 * Math.PI * 54;
  const dash = circumference - (pct / 100) * circumference;

  // ── P8: Kleine Erfolge — Tages-Meilensteine ──
  const miniMilestones = [];
  if (dailyLog.length >= 3) miniMilestones.push({ icon: '🍽️', text: '3 Mahlzeiten heute' });
  if (totalProtein >= 100)  miniMilestones.push({ icon: '💪', text: '100g Protein erreicht' });
  if (pct >= 100)           miniMilestones.push({ icon: '🎯', text: 'Tagesziel erreicht!' });
  if (pct >= 50 && pct < 100) miniMilestones.push({ icon: '⚡', text: 'Halbzeit geschafft' });

  // ── Toast Feedback ──
  const [toast, setToast] = useState({ show: false, message: '' });
  const prevLogLength = useState(dailyLog.length)[0];

  useEffect(() => {
    if (dailyLog.length > 0 && dailyLog.length > prevLogLength) {
      const last = dailyLog[dailyLog.length - 1];
      setToast({ show: true, message: `${last.name} hinzugefügt ✓` });
      setTimeout(() => setToast({ show: false, message: '' }), 2500);
    }
  }, [dailyLog.length]);

  // ── Kontextbasierte Kalorien-Reaktion ──
  const calorieReaction = () => {
    if (!calorieGoal) return null;
    if (pct >= 100) return { text: 'Tagesziel erreicht! 🏆', color: '#22c55e' };
    if (pct >= 85)  return { text: 'Fast geschafft! 💪', color: '#4ade80' };
    if (pct >= 50)  return { text: 'Du bist auf Kurs ⚡', color: '#60a5fa' };
    if (pct > 0)    return { text: 'Gut gestartet 🌱', color: 'var(--text-muted)' };
    return { text: 'Noch nichts gegessen', color: 'var(--text-muted)' };
  };
  const reaction = calorieReaction();

  const muscleGroups = [
    { name: 'Brust',     color: '#ef4444' },
    { name: 'Rücken',    color: '#3b82f6' },
    { name: 'Beine',     color: '#f97316' },
    { name: 'Schultern', color: '#a855f7' },
    { name: 'Bizeps',    color: '#22c55e' },
    { name: 'Core',      color: '#eab308' },
  ];

  const showName = username && username !== 'User';

  return (
    <div className="page">
      <div className="home-container">

        {/* Hero Greeting — dynamisch */}
        <div className="home-hero">
          <div>
            <div className="home-greeting" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>{greetingIcon}</span>
              {greeting}{showName ? `, ${username}` : ''}!
            </div>

            {/* Dynamischer Status-Titel */}
            <h1 className="home-title" style={{ color: status.color !== 'var(--text)' ? 'var(--text)' : 'var(--text)' }}>
              {status.title.includes('Bereit') ? (
                <>Bereit für dein <span style={{ color: 'var(--green)' }}>Training?</span></>
              ) : (
                <span>{status.title}</span>
              )}
            </h1>
            <p className="home-subtitle" style={{ color: 'var(--text-secondary)' }}>
              {status.subtitle}
            </p>

            {/* P6: Kontext-Reaktion Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 12 }}>
              {reaction && pct > 0 && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  padding: '5px 12px', borderRadius: 100,
                  fontSize: 12, fontWeight: 600, color: reaction.color,
                  animation: 'slideUpFade 0.4s ease both',
                }}>
                  <TrendingUp size={12} />
                  {reaction.text}
                </div>
              )}
              {/* P8: Mini-Erfolge als Chips */}
              {miniMilestones.map((m, i) => (
                <div key={i} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                  padding: '4px 10px', borderRadius: 100,
                  fontSize: 11.5, fontWeight: 600, color: 'var(--green)',
                  animation: `slideUpFade 0.35s ${i * 0.08}s ease both`,
                }}>
                  {m.icon} {m.text}
                </div>
              ))}
            </div>
          </div>

          <div className="home-quote-chip">
            <MessageCircle size={15} style={{ flexShrink: 0, color: 'var(--green)' }} />
            <span>{quote}</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="home-stats-row">
          {/* Calorie Ring */}
          <div className="stat-card stat-card-main" style={{
            borderColor: pct >= 100 ? 'rgba(34,197,94,0.35)' : 'var(--border)',
            background: pct >= 100 ? 'linear-gradient(135deg, rgba(34,197,94,0.06), var(--bg-card))' : 'var(--bg-card)',
            transition: 'all 0.4s ease',
          }}>
            <div className="stat-card-content">
              <div>
                <div className="stat-label">Heute gegessen</div>
                <div className="stat-value" style={{
                  color: pct >= 100 ? 'var(--green)' : pct >= 85 ? '#4ade80' : 'var(--green)',
                  transition: 'color 0.3s ease',
                }}>
                  {totalCalories.toLocaleString()}
                </div>
                <div className="stat-sublabel">von {calorieGoal.toLocaleString()} kcal</div>
                <div className="stat-remaining" style={{ marginTop: 8 }}>
                  {remaining > 0
                    ? <span style={{ color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Flame size={13} /> {remaining.toLocaleString()} kcal übrig
                      </span>
                    : <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700 }}>
                        <CheckCircle2 size={13} /> Tagesziel erreicht!
                      </span>}
                </div>

                {/* Mahlzeiten-Zähler */}
                {dailyLog.length > 0 && (
                  <div style={{
                    marginTop: 10, fontSize: 11.5, color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <UtensilsCrossed size={11} />
                    {dailyLog.length} {dailyLog.length === 1 ? 'Mahlzeit' : 'Mahlzeiten'} heute
                  </div>
                )}
              </div>
              <div className="calorie-ring-wrap">
                <svg width="130" height="130" viewBox="0 0 130 130">
                  <circle cx="65" cy="65" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                  {/* Fortschrittsring */}
                  <circle
                    cx="65" cy="65" r="54"
                    fill="none"
                    stroke={pct >= 100 ? '#22c55e' : pct >= 85 ? '#4ade80' : 'var(--green)'}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dash}
                    transform="rotate(-90 65 65)"
                    style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease' }}
                  />
                  <text x="65" y="62" textAnchor="middle" fill="var(--text)" fontSize="18" fontWeight="700">
                    {Math.round(pct)}%
                  </text>
                  <text x="65" y="78" textAnchor="middle" fill="var(--text-secondary)" fontSize="10">
                    {pct >= 100 ? 'Ziel ✓' : 'Ziel'}
                  </text>
                </svg>
              </div>
            </div>

            <div className="home-macro-row">
              {macros.map(m => (
                <div key={m.label} className="home-macro-chip">
                  <span style={{ color: m.color, fontWeight: 700 }}>{m.value}{m.unit}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mini Stats */}
          <div className="home-mini-stats">
            <div className="mini-stat-card" onClick={() => setActiveSection('nutrition')}>
              <div className="mini-stat-icon"><UtensilsCrossed size={22} strokeWidth={1.5} color="var(--text-secondary)" /></div>
              <div className="mini-stat-value">{dailyLog.length}</div>
              <div className="mini-stat-label">Mahlzeiten heute</div>
            </div>
            <div className="mini-stat-card" onClick={() => setActiveSection('exercises')}>
              <div className="mini-stat-icon"><Dumbbell size={22} strokeWidth={1.5} color="var(--text-secondary)" /></div>
              <div className="mini-stat-value">71</div>
              <div className="mini-stat-label">Übungen verfügbar</div>
            </div>
            <div className="mini-stat-card" onClick={() => setActiveSection('progress')}>
              <div className="mini-stat-icon"><BarChart2 size={22} strokeWidth={1.5} color="var(--text-secondary)" /></div>
              <div className="mini-stat-value">{calorieGoal > 0 ? '✓' : '—'}</div>
              <div className="mini-stat-label">Ziel gesetzt</div>
            </div>
            <div className="mini-stat-card" onClick={() => setActiveSection('calculator')}>
              <div className="mini-stat-icon"><Flame size={22} strokeWidth={1.5} color="var(--text-secondary)" /></div>
              <div className="mini-stat-value">{calorieGoal.toLocaleString()}</div>
              <div className="mini-stat-label">kcal Tagesziel</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="home-section">
          <h2 className="home-section-title">Schnellaktionen</h2>
          <div className="quick-actions-grid">
            <button className="quick-action-card" onClick={() => setActiveSection('nutrition')}>
              <div className="qa-icon" style={{ background: 'rgba(34,197,94,0.15)' }}>
                <Plus size={22} color="var(--green)" />
              </div>
              <div className="qa-label">Mahlzeit hinzufügen</div>
              <div className="qa-sub">Kalorien tracken</div>
            </button>
            <button className="quick-action-card" onClick={() => setActiveSection('exercises')}>
              <div className="qa-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>
                <Dumbbell size={22} color="#3b82f6" />
              </div>
              <div className="qa-label">Übungen entdecken</div>
              <div className="qa-sub">71 Übungen</div>
            </button>
            <button className="quick-action-card" onClick={() => setActiveSection('calculator')}>
              <div className="qa-icon" style={{ background: 'rgba(239,68,68,0.15)' }}>
                <Calculator size={22} color="#ef4444" />
              </div>
              <div className="qa-label">Kalorienbedarf</div>
              <div className="qa-sub">Mifflin-St Jeor</div>
            </button>
            <button className="quick-action-card" onClick={() => setActiveSection('progress')}>
              <div className="qa-icon" style={{ background: 'rgba(234,179,8,0.15)' }}>
                <BarChart2 size={22} color="#eab308" />
              </div>
              <div className="qa-label">Fortschritt ansehen</div>
              <div className="qa-sub">Statistiken & Ziele</div>
            </button>
          </div>
        </div>

        {/* Recent Meals */}
        {dailyLog.length > 0 && (
          <div className="home-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="home-section-title" style={{ marginBottom: 0 }}>Heutige Mahlzeiten</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setActiveSection('nutrition')}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                Alle ansehen <ChevronRight size={14} />
              </button>
            </div>
            <div className="recent-meals">
              {dailyLog.slice(-4).reverse().map((item, i) => (
                <div key={i} className="recent-meal-row" style={{
                  animation: `slideUpFade 0.3s ${i * 0.05}s ease both`,
                }}>
                  <div className="recent-meal-icon">
                    <UtensilsCrossed size={18} strokeWidth={1.5} color="var(--text-muted)" />
                  </div>
                  <div className="recent-meal-info">
                    <div className="recent-meal-name">{item.name}</div>
                    <div className="recent-meal-meta">{item.serving}</div>
                  </div>
                  <div className="recent-meal-cal">{item.calories} kcal</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Muscle Groups Quick Nav */}
        <div className="home-section">
          <h2 className="home-section-title">Training nach Muskelgruppe</h2>
          <div className="muscle-quick-grid">
            {muscleGroups.map(m => (
              <button
                key={m.name}
                className="muscle-quick-chip"
                style={{ '--mcolor': m.color }}
                onClick={() => setActiveSection('exercises')}
              >
                <Activity size={14} />
                <span>{m.name}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Toast Feedback */}
      <FeedbackToast show={toast.show} message={toast.message} />

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(16px) scale(0.95); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
