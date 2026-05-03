import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import {
  UtensilsCrossed, Target, Dumbbell, ClipboardList,
  Flame, Star, Trophy, Rocket, Lock, TrendingUp,
  Scale, Plus, ChevronDown, ChevronUp, Check
} from 'lucide-react';

// ── Letzte 7 Tage ──
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

// ── Streak korrekt berechnen (rückwärts von heute) ──
function calcStreak(logHistory) {
  let count = 0;
  const today = new Date();
  for (let i = 0; i <= 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    const log = logHistory[key] || [];
    if (log.length > 0) {
      count++;
    } else {
      break; // Streak unterbrochen
    }
  }
  return count;
}

// ── Mini Progress Bar ──
function ProgressBar({ value, max, color, height = 7 }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ height, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 100, transition: 'width 0.6s ease' }} />
    </div>
  );
}

export default function Progress({ calorieGoal, dailyLog, logHistory, user, profile }) {
  const [weightLog, setWeightLog]       = useState([]);
  const [weightInput, setWeightInput]   = useState('');
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [savingWeight, setSavingWeight] = useState(false);
  const [weightLoaded, setWeightLoaded] = useState(false);

  const totalCal  = dailyLog.reduce((s, i) => s + i.calories, 0);
  const totalProt = dailyLog.reduce((s, i) => s + (i.protein || 0), 0);
  const pct = calorieGoal > 0 ? Math.min((totalCal / calorieGoal) * 100, 100) : 0;
  const streak = calcStreak(logHistory);
  const totalDaysLogged = Object.values(logHistory).filter(l => l.length > 0).length;

  const last7Days = getLast7Days();
  const weekData = last7Days.map(({ key, label, isToday }) => {
    const log = logHistory[key] || [];
    const kcal = log.reduce((s, i) => s + i.calories, 0);
    const dayPct = calorieGoal > 0 && kcal > 0
      ? Math.min(Math.round((kcal / calorieGoal) * 100), 100) : 0;
    return { day: label, pct: dayPct, kcal, active: isToday };
  });

  // ── Gewicht laden ──
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(30);
      if (data) setWeightLog(data);
      setWeightLoaded(true);
    };
    load();
  }, [user]);

  // ── Gewicht speichern ──
  const saveWeight = async () => {
    const val = parseFloat(weightInput);
    if (!val || val < 20 || val > 500) return;
    setSavingWeight(true);
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('weight_logs')
      .upsert({ user_id: user.id, date: today, weight: val }, { onConflict: 'user_id,date' })
      .select()
      .single();
    if (!error && data) {
      setWeightLog(prev => {
        const filtered = prev.filter(w => w.date !== today);
        return [data, ...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
      });
    }
    setWeightInput('');
    setShowWeightInput(false);
    setSavingWeight(false);
  };

  // ── Gewichts-Chart (letzte 7 Einträge) ──
  const weightChart = weightLog.slice(0, 7).reverse();
  const weightMin = weightChart.length > 0 ? Math.min(...weightChart.map(w => w.weight)) - 2 : 0;
  const weightMax = weightChart.length > 0 ? Math.max(...weightChart.map(w => w.weight)) + 2 : 100;
  const weightRange = weightMax - weightMin || 1;

  // Gewichtsveränderung
  const latestWeight = weightLog[0]?.weight;
  const oldestWeight = weightLog[weightLog.length - 1]?.weight;
  const weightDiff = latestWeight && oldestWeight && weightLog.length > 1
    ? (latestWeight - oldestWeight).toFixed(1) : null;

  // BMI
  const bmi = latestWeight && profile?.height
    ? (latestWeight / ((profile.height / 100) ** 2)).toFixed(1) : null;
  const bmiCategory = bmi
    ? bmi < 18.5 ? 'Untergewicht' : bmi < 25 ? 'Normalgewicht' : bmi < 30 ? 'Übergewicht' : 'Adipositas'
    : null;
  const bmiColor = bmi
    ? bmi < 18.5 ? '#60a5fa' : bmi < 25 ? 'var(--green)' : bmi < 30 ? '#f97316' : '#ef4444'
    : 'var(--green)';

  // Stats
  const stats = [
    { label: 'Heute gegessen', value: `${totalCal} kcal`,    icon: UtensilsCrossed },
    { label: 'Tagesziel',      value: `${calorieGoal} kcal`, icon: Target },
    { label: 'Protein heute',  value: `${totalProt}g`,       icon: Dumbbell },
    { label: 'Mahlzeiten',     value: dailyLog.length,       icon: ClipboardList },
  ];

  // Errungenschaften
  const achievements = [
    { icon: Flame,    color: '#f97316', title: 'Erster Eintrag',  desc: 'Erste Mahlzeit geloggt',        done: Object.values(logHistory).some(l => l.length > 0) },
    { icon: Target,   color: '#22c55e', title: 'Ziel gesetzt',    desc: 'Kalorienziel konfiguriert',      done: calorieGoal > 0 },
    { icon: Dumbbell, color: '#3b82f6', title: '3 Mahlzeiten',    desc: 'Heute 3+ Mahlzeiten getrackt',  done: dailyLog.length >= 3 },
    { icon: Star,     color: '#eab308', title: 'Protein-Profi',   desc: '80g+ Protein heute',             done: totalProt >= 80 },
    { icon: Trophy,   color: '#a855f7', title: 'Kalorienbudget',  desc: 'Innerhalb des Tagesziels',       done: pct >= 80 && pct <= 100 && calorieGoal > 0 },
    { icon: Rocket,   color: '#06b6d4', title: 'Konstanz',        desc: 'App 3+ Tage genutzt',            done: totalDaysLogged >= 3 },
    { icon: Scale,    color: '#ec4899', title: 'Gewicht geloggt', desc: 'Erstes Gewicht eingetragen',     done: weightLog.length > 0 },
    { icon: TrendingUp, color: '#22c55e', title: '7-Tage-Streak', desc: '7 Tage in Folge getrackt',      done: streak >= 7 },
  ];

  return (
    <div className="page">
      <div className="progress-container">
        <div className="page-header">
          <h1>Mein Fortschritt</h1>
          <p>Behalte deine Ziele im Blick und bleibe motiviert.</p>
        </div>

        {/* ── Stats Grid ── */}
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

        {/* ── Kalorienfortschritt ── */}
        <div className="progress-card">
          <h3 className="progress-card-title">Heutiger Kalorienfortschritt</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              {totalCal.toLocaleString()} kcal gegessen
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: pct >= 100 ? '#f87171' : 'var(--green)' }}>
              {Math.round(pct)}%
            </span>
          </div>
          <div className="big-progress-track">
            <div className="big-progress-fill" style={{
              width: `${pct}%`,
              background: pct >= 100
                ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                : 'linear-gradient(90deg, var(--green), var(--green-light))',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            <span>0 kcal</span>
            <span>Ziel: {calorieGoal.toLocaleString()} kcal</span>
          </div>

          {/* Makros heute */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 16 }}>
            {[
              { label: 'Protein', value: dailyLog.reduce((s, i) => s + (i.protein || 0), 0), unit: 'g', color: '#ef4444' },
              { label: 'Carbs',   value: dailyLog.reduce((s, i) => s + (i.carbs || 0), 0),   unit: 'g', color: '#f97316' },
              { label: 'Fette',   value: dailyLog.reduce((s, i) => s + (i.fat || 0), 0),     unit: 'g', color: '#eab308' },
            ].map(m => (
              <div key={m.label} style={{
                background: 'var(--bg-card-2)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '10px 12px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: m.color }}>
                  {m.value}<span style={{ fontSize: 10, fontWeight: 500 }}>{m.unit}</span>
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Wochenverlauf ── */}
        <div className="progress-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 className="progress-card-title" style={{ marginBottom: 0 }}>Wochenverlauf</h3>
            {streak > 0 && (
              <span style={{
                fontSize: 12, fontWeight: 700, color: '#f97316',
                background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)',
                padding: '3px 10px', borderRadius: 100,
              }}>
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
                      background: d.active
                        ? 'linear-gradient(to top, var(--green), var(--green-light))'
                        : 'rgba(255,255,255,0.18)',
                    }} />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 4 }}>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>–</span>
                    </div>
                  )}
                </div>
                <div className={`weekly-bar-label ${d.active ? 'active' : ''}`}>{d.day}</div>
                {d.kcal > 0 && (
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center' }}>
                    {d.kcal >= 1000 ? `${(d.kcal / 1000).toFixed(1)}k` : d.kcal}
                  </div>
                )}
              </div>
            ))}
          </div>
          {totalDaysLogged === 0 && (
            <div style={{ marginTop: 14, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
              Noch keine Daten. Fang heute an, Mahlzeiten zu loggen!
            </div>
          )}
        </div>

        {/* ── Gewichtstracking ── */}
        <div className="progress-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="progress-card-title" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Scale size={18} color="var(--text-secondary)" strokeWidth={1.5} />
              Gewichtsverlauf
            </h3>
            <button
              onClick={() => setShowWeightInput(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 8,
                background: showWeightInput ? 'var(--green-glow)' : 'var(--bg-card-2)',
                border: `1px solid ${showWeightInput ? 'var(--border-active)' : 'var(--border)'}`,
                color: showWeightInput ? 'var(--green)' : 'var(--text-muted)',
                cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
            >
              {showWeightInput ? <ChevronUp size={13} /> : <Plus size={13} />}
              {showWeightInput ? 'Schliessen' : 'Eintragen'}
            </button>
          </div>

          {/* Eingabefeld */}
          {showWeightInput && (
            <div style={{
              display: 'flex', gap: 8, marginBottom: 16,
              padding: 14, background: 'var(--bg-card-2)',
              border: '1px solid var(--border-active)', borderRadius: 10,
            }}>
              <div style={{ display: 'flex', flex: 1, gap: 0 }}>
                <input
                  type="number"
                  placeholder="z.B. 75.5"
                  value={weightInput}
                  onChange={e => setWeightInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveWeight()}
                  min="20" max="500" step="0.1"
                  className="form-input"
                  style={{ flex: 1, borderRadius: '10px 0 0 10px', borderRight: 'none' }}
                  autoFocus
                />
                <div style={{
                  padding: '0 12px', background: 'var(--bg-hover)',
                  border: '1px solid var(--border)', borderRadius: '0 10px 10px 0',
                  display: 'flex', alignItems: 'center',
                  fontSize: 13, color: 'var(--text-muted)',
                }}>kg</div>
              </div>
              <button
                onClick={saveWeight}
                disabled={savingWeight || !weightInput}
                className="btn btn-primary"
                style={{ padding: '10px 16px', flexShrink: 0 }}
              >
                {savingWeight ? '...' : <Check size={15} />}
              </button>
            </div>
          )}

          {/* Aktuelle Werte */}
          {latestWeight && (
            <div style={{ display: 'grid', gridTemplateColumns: bmi ? '1fr 1fr 1fr' : '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div style={{
                background: 'var(--bg-card-2)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '12px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{latestWeight}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1 }}>kg aktuell</div>
              </div>
              {weightDiff !== null && (
                <div style={{
                  background: 'var(--bg-card-2)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '12px', textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: 22, fontWeight: 800,
                    color: parseFloat(weightDiff) < 0 ? 'var(--green)' : parseFloat(weightDiff) > 0 ? '#f97316' : 'var(--text)',
                  }}>
                    {parseFloat(weightDiff) > 0 ? '+' : ''}{weightDiff}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1 }}>kg Veränderung</div>
                </div>
              )}
              {bmi && (
                <div style={{
                  background: 'var(--bg-card-2)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '12px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: bmiColor }}>{bmi}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1 }}>BMI · {bmiCategory}</div>
                </div>
              )}
            </div>
          )}

          {/* Chart */}
          {weightChart.length > 1 ? (
            <div style={{ marginBottom: 8 }}>
              <svg width="100%" height="100" viewBox={`0 0 ${weightChart.length * 50} 80`} preserveAspectRatio="none">
                {/* Grid lines */}
                {[0, 0.5, 1].map((pct, i) => (
                  <line key={i}
                    x1="0" y1={pct * 70}
                    x2={weightChart.length * 50} y2={pct * 70}
                    stroke="rgba(255,255,255,0.05)" strokeWidth="1"
                  />
                ))}

                {/* Area fill */}
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(34,197,94,0.3)" />
                    <stop offset="100%" stopColor="rgba(34,197,94,0)" />
                  </linearGradient>
                </defs>
                <path
                  d={[
                    `M ${weightChart.map((w, i) => {
                      const x = i * 50 + 25;
                      const y = ((weightMax - w.weight) / weightRange) * 60 + 5;
                      return `${x},${y}`;
                    }).join(' L ')}`,
                    `L ${(weightChart.length - 1) * 50 + 25},75`,
                    `L 25,75 Z`
                  ].join(' ')}
                  fill="url(#weightGrad)"
                />

                {/* Line */}
                <polyline
                  points={weightChart.map((w, i) => {
                    const x = i * 50 + 25;
                    const y = ((weightMax - w.weight) / weightRange) * 60 + 5;
                    return `${x},${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="var(--green)"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                {/* Dots */}
                {weightChart.map((w, i) => {
                  const x = i * 50 + 25;
                  const y = ((weightMax - w.weight) / weightRange) * 60 + 5;
                  const isLast = i === weightChart.length - 1;
                  return (
                    <g key={i}>
                      <circle cx={x} cy={y} r={isLast ? 5 : 3} fill="var(--green)" />
                      {isLast && <circle cx={x} cy={y} r={8} fill="rgba(34,197,94,0.2)" />}
                      <text x={x} y={y - 10} textAnchor="middle" fontSize="9" fill="var(--text-muted)">
                        {w.weight}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* X-Achse Labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                {weightChart.map((w, i) => (
                  <div key={i} style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', flex: 1 }}>
                    {new Date(w.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: 'center', padding: '24px 0',
              color: 'var(--text-muted)', fontSize: 13,
            }}>
              {weightLoaded && weightLog.length === 0 ? (
                <>
                  <Scale size={32} strokeWidth={1.2} color="var(--text-muted)" style={{ marginBottom: 8, display: 'block', margin: '0 auto 10px' }} />
                  Noch kein Gewicht eingetragen.<br />
                  <span style={{ fontSize: 12 }}>Trag täglich dein Gewicht ein um deinen Verlauf zu sehen.</span>
                </>
              ) : weightLog.length === 1 ? (
                'Trag morgen wieder dein Gewicht ein um den Verlauf zu sehen.'
              ) : (
                'Lädt...'
              )}
            </div>
          )}

          {/* Letzte Einträge */}
          {weightLog.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                Letzte Einträge
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {weightLog.slice(0, 5).map(w => (
                  <div key={w.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px', background: 'var(--bg-card-2)',
                    border: '1px solid var(--border)', borderRadius: 8,
                    fontSize: 13,
                  }}>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {new Date(w.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--text)' }}>{w.weight} kg</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Errungenschaften ── */}
        <div className="progress-card">
          <h3 className="progress-card-title">
            Errungenschaften
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>
              {achievements.filter(a => a.done).length}/{achievements.length}
            </span>
          </h3>
          <div className="achievements-grid">
            {achievements.map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={i} className={`achievement-card ${a.done ? 'done' : 'locked'}`}>
                  <div className="achievement-icon">
                    {a.done
                      ? <Icon size={26} strokeWidth={1.5} color={a.color} />
                      : <Lock size={26} strokeWidth={1.5} color="var(--text-muted)" />}
                  </div>
                  <div className="achievement-title">{a.title}</div>
                  <div className="achievement-desc">{a.desc}</div>
                  {a.done && <div className="achievement-badge">Erreicht ✓</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Motivationsbanner ── */}
        <div className="motivation-banner">
          <div className="motivation-icon">
            <TrendingUp size={36} strokeWidth={1.5} color="var(--green)" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
              {streak >= 7 ? '🏆 Aussergewöhnlich!' : streak >= 3 ? '🔥 Starke Konstanz!' : 'Bleib am Ball!'}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
              {totalDaysLogged === 0
                ? 'Fang heute an – jede Mahlzeit bringt dich näher ans Ziel.'
                : streak >= 7
                  ? `${streak} Tage Streak! Du bist auf dem besten Weg zum Ziel.`
                  : streak >= 3
                    ? `${streak} Tage in Folge! Weiter so, du bist auf einem guten Weg.`
                    : `Super! Du hast heute ${dailyLog.length} Mahlzeit${dailyLog.length !== 1 ? 'en' : ''} geloggt.`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
