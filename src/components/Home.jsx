import { 
  UtensilsCrossed, Dumbbell, BarChart2, Flame, 
  Plus, Calculator, ChevronRight, MessageCircle,
  Target, Zap, Activity
} from 'lucide-react';

export default function Home({ setActiveSection, calorieGoal, totalCalories, dailyLog, username }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend';

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

  const quotes = [
    'Disziplin schlägt Motivation jeden Tag.',
    'Kein Schmerz, kein Wachstum.',
    'Consistency is the key to results.',
    'Kleine Schritte, große Veränderungen.',
    'Du bist stärker als deine Ausreden.',
  ];
  const quote = quotes[new Date().getDate() % quotes.length];

  const circumference = 2 * Math.PI * 54;
  const dash = circumference - (pct / 100) * circumference;

  const muscleGroups = [
    { name: 'Brust',     color: '#ef4444' },
    { name: 'Rücken',    color: '#3b82f6' },
    { name: 'Beine',     color: '#f97316' },
    { name: 'Schultern', color: '#a855f7' },
    { name: 'Bizeps',    color: '#22c55e' },
    { name: 'Core',      color: '#eab308' },
  ];

  return (
    <div className="page">
      <div className="home-container">

        {/* Hero Greeting */}
        <div className="home-hero">
          <div>
            <div className="home-greeting">
              {greeting}{username ? `, ${username}` : ''}! 👋
            </div>
            <h1 className="home-title">Bereit für dein <span style={{ color: 'var(--green)' }}>Training?</span></h1>
            <p className="home-subtitle">Verfolge deine Ernährung, entdecke Übungen und erreiche deine Ziele.</p>
          </div>
          <div className="home-quote-chip">
            <MessageCircle size={15} style={{ flexShrink: 0, color: 'var(--green)' }} />
            <span>{quote}</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="home-stats-row">
          {/* Calorie Ring */}
          <div className="stat-card stat-card-main">
            <div className="stat-card-content">
              <div>
                <div className="stat-label">Heute gegessen</div>
                <div className="stat-value" style={{ color: 'var(--green)' }}>{totalCalories.toLocaleString()}</div>
                <div className="stat-sublabel">von {calorieGoal.toLocaleString()} kcal</div>
                <div className="stat-remaining">
                  {remaining > 0
                    ? <span style={{ color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Flame size={13} /> {remaining.toLocaleString()} kcal übrig
                      </span>
                    : <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Zap size={13} /> Ziel erreicht
                      </span>}
                </div>
              </div>
              <div className="calorie-ring-wrap">
                <svg width="130" height="130" viewBox="0 0 130 130">
                  <circle cx="65" cy="65" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                  <circle
                    cx="65" cy="65" r="54"
                    fill="none"
                    stroke={pct >= 100 ? '#ef4444' : 'var(--green)'}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dash}
                    transform="rotate(-90 65 65)"
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                  />
                  <text x="65" y="62" textAnchor="middle" fill="var(--text)" fontSize="18" fontWeight="700">
                    {Math.round(pct)}%
                  </text>
                  <text x="65" y="78" textAnchor="middle" fill="var(--text-secondary)" fontSize="10">
                    Ziel
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
              <div className="qa-label">Kalorienbedarf berechnen</div>
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
                <div key={i} className="recent-meal-row">
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
    </div>
  );
}