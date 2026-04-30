import {
  UtensilsCrossed, Target, Dumbbell, ClipboardList,
  Flame, Star, Trophy, Rocket, Lock, TrendingUp
} from 'lucide-react';

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      key: d.toDateString(),
      label: d.toLocaleDateString('de-DE', { weekday: 'short' }),
      isToday: i === 0,
    });
  }
  return days;
}

export default function Progress({ calorieGoal, dailyLog, logHistory }) {
  const totalCal  = dailyLog.reduce((s, i) => s + i.calories, 0);
  const totalProt = dailyLog.reduce((s, i) => s + (i.protein || 0), 0);
  const pct = calorieGoal > 0 ? Math.min((totalCal / calorieGoal) * 100, 100) : 0;

  const last7Days = getLast7Days();
  const weekData = last7Days.map(({ key, label, isToday }) => {
    const log = logHistory[key] || [];
    const kcal = log.reduce((s, i) => s + i.calories, 0);
    const dayPct = calorieGoal > 0 && kcal > 0
      ? Math.min(Math.round((kcal / calorieGoal) * 100), 100)
      : 0;
    return { day: label, pct: dayPct, kcal, active: isToday };
  });

  const streak = (() => {
    let count = 0;
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      const log = logHistory[key] || [];
      if (log.length > 0) count++;
      else if (i < 6) break;
    }
    return count;
  })();

  const totalDaysLogged = Object.values(logHistory).filter(log => log.length > 0).length;

  const achievements = [
    { icon: Flame,    color: '#f97316', title: 'Erster Eintrag', desc: 'Erste Mahlzeit geloggt',       done: Object.values(logHistory).some(l => l.length > 0) },
    { icon: Target,   color: '#22c55e', title: 'Ziel gesetzt',   desc: 'Kalorienziel konfiguriert',     done: calorieGoal > 0 },
    { icon: Dumbbell, color: '#3b82f6', title: '3 Mahlzeiten',   desc: 'Heute 3+ Mahlzeiten getrackt', done: dailyLog.length >= 3 },
    { icon: Star,     color: '#eab308', title: 'Protein-Profi',  desc: '80g+ Protein heute',            done: totalProt >= 80 },
    { icon: Trophy,   color: '#a855f7', title: 'Kalorienbudget', desc: 'Innerhalb des Tagesziels',      done: pct >= 80 && pct <= 100 && calorieGoal > 0 },
    { icon: Rocket,   color: '#06b6d4', title: 'Konstanz',       desc: 'App 3+ Tage genutzt',           done: totalDaysLogged >= 3 },
  ];

  const stats = [
    { label: 'Heute gegessen', value: `${totalCal} kcal`,    icon: UtensilsCrossed },
    { label: 'Tagesziel',      value: `${calorieGoal} kcal`, icon: Target },
    { label: 'Protein heute',  value: `${totalProt}g`,       icon: Dumbbell },
    { label: 'Mahlzeiten',     value: dailyLog.length,       icon: ClipboardList },
  ];

  return (
    <div className="page">
      <div className="progress-container">
        <div className="page-header">
          <h1>Mein Fortschritt</h1>
          <p>Behalte deine Ziele im Blick und bleibe motiviert.</p>
        </div>

        <div className="progress-stats-grid">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="progress-stat-card">
                <div className="progress-stat-icon"><Icon size={22} strokeWidth={1.5} color="var(--text-secondary)" /></div>
                <div className="progress-stat-value">{s.value}</div>
                <div className="progress-stat-label">{s.label}</div>
              </div>
            );
          })}
        </div>

        <div className="progress-card">
          <h3 className="progress-card-title">Heutiger Kalorienfortschritt</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{totalCal.toLocaleString()} kcal gegessen</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)' }}>{Math.round(pct)}%</span>
          </div>
          <div className="big-progress-track">
            <div className="big-progress-fill" style={{
              width: `${pct}%`,
              background: pct >= 100 ? 'linear-gradient(90deg, #ef4444, #dc2626)' : 'linear-gradient(90deg, var(--green), var(--green-light))'
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            <span>0 kcal</span>
            <span>Ziel: {calorieGoal.toLocaleString()} kcal</span>
          </div>
        </div>

        <div className="progress-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 className="progress-card-title" style={{ marginBottom: 0 }}>Wochenverlauf (letzte 7 Tage)</h3>
            {streak > 0 && (
              <span style={{ fontSize: 12, fontWeight: 700, color: '#f97316', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', padding: '3px 10px', borderRadius: 100 }}>
                🔥 {streak} Tag{streak !== 1 ? 'e' : ''} Streak
              </span>
            )}
          </div>
          <div className="weekly-chart">
            {weekData.map((d, i) => (
              <div key={i} className="weekly-bar-wrap">
                <div className="weekly-bar-track">
                  {d.pct > 0 ? (
                    <div className={`weekly-bar-fill ${d.active ? 'active' : ''}`} style={{
                      height: `${d.pct}%`,
                      background: d.active ? 'linear-gradient(to top, var(--green), var(--green-light))' : 'rgba(255,255,255,0.2)'
                    }} />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>–</span>
                    </div>
                  )}
                </div>
                <div className={`weekly-bar-label ${d.active ? 'active' : ''}`}>{d.day}</div>
                {d.kcal > 0 && <div style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center' }}>{d.kcal}</div>}
              </div>
            ))}
          </div>
          {totalDaysLogged === 0 && (
            <div style={{ marginTop: 14, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
              Noch keine Daten. Fang heute an, Mahlzeiten zu loggen!
            </div>
          )}
        </div>

        <div className="progress-card">
          <h3 className="progress-card-title">Errungenschaften</h3>
          <div className="achievements-grid">
            {achievements.map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={i} className={`achievement-card ${a.done ? 'done' : 'locked'}`}>
                  <div className="achievement-icon">
                    {a.done ? <Icon size={26} strokeWidth={1.5} color={a.color} /> : <Lock size={26} strokeWidth={1.5} color="var(--text-muted)" />}
                  </div>
                  <div className="achievement-title">{a.title}</div>
                  <div className="achievement-desc">{a.desc}</div>
                  {a.done && <div className="achievement-badge">Erreicht!</div>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="motivation-banner">
          <div className="motivation-icon"><TrendingUp size={36} strokeWidth={1.5} color="var(--green)" /></div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
              {streak >= 3 ? '🔥 Starke Konstanz!' : 'Bleib am Ball!'}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {totalDaysLogged === 0
                ? 'Fang heute an – jede Mahlzeit bringt dich näher ans Ziel.'
                : streak >= 3
                  ? `Beeindruckend! ${streak} Tage in Folge getrackt. Weiter so!`
                  : `Super! Du hast heute ${dailyLog.length} Mahlzeit${dailyLog.length !== 1 ? 'en' : ''} geloggt.`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}