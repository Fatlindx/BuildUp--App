import { useState, useEffect } from 'react';
import { useI18n } from '../i18n.jsx';
import { supabase } from '../supabase';
import {
  UtensilsCrossed, Target, Dumbbell, ClipboardList, Flame, Star, Trophy, Rocket, Lock, TrendingUp, Scale, Plus, ChevronUp, Check, Zap, AlertCircle, CheckCircle2, Activity, Minus, Award, Crown
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

function calcStreak(logHistory) {
  let count = 0;
  const today = new Date();
  for (let i = 0; i <= 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    if ((logHistory[key] || []).length > 0) count++;
    else break;
  }
  return count;
}

// ── P3: Smooth Gradient Progress Bar ──
function GradientProgressBar({ value, max, height = 10 }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const color = pct >= 100 ? 'var(--red)' : pct >= 85 ? 'var(--green-bright)' : pct >= 50 ? '#22c55e' : '#22c55e';
  const glow  = pct >= 100 ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.4)';

  return (
    <div style={{ position: 'relative', marginBottom: 6 }}>
      <div style={{
        height, background: 'rgba(255,255,255,0.06)',
        borderRadius: 100, overflow: 'visible', position: 'relative',
      }}>
        {/* Track */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(255,255,255,0.04)', borderRadius: 100,
        }} />
        {/* Fill */}
        <div style={{
          height: '100%', width: `${pct}%`,
          background: `linear-gradient(90deg, ${pct >= 100 ? 'var(--red)' : '#16a34a'}, ${color})`,
          borderRadius: 100,
          transition: 'width 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          boxShadow: pct > 0 ? `0 0 12px ${glow}` : 'none',
        }}>
          {/* Animated shine */}
          {pct > 5 && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
              borderRadius: 100,
              animation: 'shimmerBar 2s ease infinite',
            }} />
          )}
        </div>
        {/* Zielmarke bei 100% */}
        <div style={{
          position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
          width: 2, height: height + 4, background: 'rgba(255,255,255,0.2)',
          borderRadius: 2,
        }} />
      </div>
    </div>
  );
}

export default function Progress({ calorieGoal, dailyLog, logHistory, user, profile }) {
  const { t } = useI18n();
  const [weightLog, setWeightLog]             = useState([]);
  const [weightInput, setWeightInput]         = useState('');
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [savingWeight, setSavingWeight]       = useState(false);
  const [weightLoaded, setWeightLoaded]       = useState(false);
  const [animatedPct, setAnimatedPct]         = useState(0);

  const totalCal  = (dailyLog || []).reduce((s, i) => s + (i.calories || 0), 0);
  const totalProt = (dailyLog || []).reduce((s, i) => s + (i.protein || 0), 0);
  const totalCarb = (dailyLog || []).reduce((s, i) => s + (i.carbs || 0), 0);
  const totalFat  = (dailyLog || []).reduce((s, i) => s + (i.fat || 0), 0);
  const pct = calorieGoal > 0 ? Math.min((totalCal / calorieGoal) * 100, 100) : 0;
  const streak = calcStreak(logHistory);
  const totalDaysLogged = Object.values(logHistory || {}).filter(l => Array.isArray(l) && l.length > 0).length;

  // Animate progress on mount
  useEffect(() => {
    const t = setTimeout(() => setAnimatedPct(pct), 100);
    return () => clearTimeout(t);
  }, [pct]);

  const last7Days = getLast7Days();
  const weekData = last7Days.map(({ key, label, isToday }) => {
    const log = (logHistory || {})[key] || [];
    const kcal = log.reduce((s, i) => s + i.calories, 0);
    const dayPct = calorieGoal > 0 && kcal > 0 ? Math.min(Math.round((kcal / calorieGoal) * 100), 100) : 0;
    return { day: label, pct: dayPct, kcal, active: isToday };
  });
  const maxWeekKcal = Math.max(...weekData.map(d => d.kcal), 1);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const { data } = await supabase.from('weight_logs').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(30);
        if (data) setWeightLog(data);
      } catch (err) {
        console.error('Load weight error:', err);
      } finally {
        setWeightLoaded(true);
      }
    };
    load();
  }, [user]);

  const saveWeight = async () => {
    const val = parseFloat(weightInput);
    if (!val || val < 20 || val > 500) return;
    setSavingWeight(true);
    const today = new Date().toISOString().split('T')[0];
    try {
      const { data, error } = await supabase.from('weight_logs').upsert(
        { user_id: user.id, date: today, weight: val }, { onConflict: 'user_id,date' }
      ).select().single();
      if (!error && data) {
        setWeightLog(prev => {
          const filtered = prev.filter(w => w.date !== today);
          return [data, ...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
        });
      }
    } catch (err) {
      console.error('Save weight error:', err);
    } finally {
      setWeightInput(''); setShowWeightInput(false); setSavingWeight(false);
    }
  };

  const weightChart = weightLog.slice(0, 7).reverse();
  const weightMin = weightChart.length > 0 ? Math.min(...weightChart.map(w => w.weight)) - 2 : 0;
  const weightMax = weightChart.length > 0 ? Math.max(...weightChart.map(w => w.weight)) + 2 : 100;
  const weightRange = weightMax - weightMin || 1;
  const latestWeight = weightLog[0]?.weight;
  const oldestWeight = weightLog[weightLog.length - 1]?.weight;
  const weightDiff = latestWeight && oldestWeight && weightLog.length > 1 ? (latestWeight - oldestWeight).toFixed(1) : null;
  const bmi = latestWeight && profile?.height ? (latestWeight / ((profile.height / 100) ** 2)).toFixed(1) : null;
  const bmiCategory = bmi ? bmi < 18.5 ? t('progress.bmi_under') : bmi < 25 ? t('progress.bmi_normal') : bmi < 30 ? t('progress.bmi_over') : 'Adipositas' : null;
  const bmiColor = bmi ? bmi < 18.5 ? 'var(--blue-light)' : bmi < 25 ? 'var(--green)' : bmi < 30 ? 'var(--orange)' : 'var(--red)' : 'var(--green)';

  const stats = [
    { label: 'Heute gegessen', value: `${totalCal} kcal`,    icon: UtensilsCrossed },
    { label: 'Tagesziel',      value: `${calorieGoal} kcal`, icon: Target },
    { label: 'Protein heute',  value: `${totalProt}g`,       icon: Dumbbell },
    { label: 'Mahlzeiten',     value: dailyLog.length,       icon: ClipboardList },
  ];

  const achievements = [
    { icon: Flame,      color: 'var(--orange)', title: 'Erster Eintrag',  desc: 'Erste Mahlzeit geloggt',       done: Object.values(logHistory).some(l => l.length > 0) },
    { icon: Target,     color: '#22c55e', title: 'Ziel gesetzt',    desc: 'Kalorienziel konfiguriert',     done: calorieGoal > 0 },
    { icon: Dumbbell,   color: 'var(--blue)', title: '3 Mahlzeiten',    desc: 'Heute 3+ Mahlzeiten getrackt', done: dailyLog.length >= 3 },
    { icon: Star,       color: 'var(--yellow)', title: 'Protein-Profi',   desc: '80g+ Protein heute',            done: totalProt >= 80 },
    { icon: Trophy,     color: 'var(--purple)', title: 'Kalorienbudget',  desc: 'Innerhalb des Tagesziels',      done: pct >= 80 && pct <= 100 && calorieGoal > 0 },
    { icon: Rocket,     color: '#06b6d4', title: 'Konstanz',        desc: 'App 3+ Tage genutzt',           done: totalDaysLogged >= 3 },
    { icon: Scale,      color: '#ec4899', title: 'Gewicht geloggt', desc: 'Erstes Gewicht eingetragen',    done: weightLog.length > 0 },
    { icon: TrendingUp, color: '#22c55e', title: '7-Tage-Streak',   desc: '7 Tage in Folge getrackt',     done: streak >= 7 },
  ];

  // P6: Tagesstatus mit Icon
  const statusText = pct >= 100 ? { text: 'Über Ziel',     color: 'var(--red)',          iconName: 'AlertCircle',  bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)'   }
    : pct >= 85 ? { text: 'Fast am Ziel',   color: 'var(--green-bright)',          iconName: 'TrendingUp',   bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.3)'  }
    : pct >= 50 ? { text: 'On Track',        color: 'var(--green)',     iconName: 'CheckCircle2', bg: 'var(--green-glow)',     border: 'var(--border-active)'  }
    : pct > 0   ? { text: 'Gestartet',       color: 'var(--blue-light)',          iconName: 'Activity',     bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.3)'  }
    : { text: t('progress.nothing_yet'),   color: 'var(--text-muted)',   iconName: 'Minus',        bg: 'var(--bg-card-2)',     border: 'var(--border)'         };

  // P6: Wochentrend — Vergleich dieser Woche
  const daysWithData   = weekData.filter(d => d.kcal > 0).length;
  const avgKcal        = daysWithData > 0 ? Math.round(weekData.reduce((s,d) => s + d.kcal, 0) / daysWithData) : 0;
  const daysOnTrack    = (calorieGoal > 0) ? weekData.filter(d => d.kcal >= calorieGoal * 0.8 && d.kcal <= calorieGoal * 1.1).length : 0;
  const weekScore      = daysWithData > 0 ? Math.round((daysOnTrack / daysWithData) * 100) : 0;
  const weekTrend      = weekScore >= 80 ? { text: 'Ausgezeichnete Woche', color: 'var(--green)', iconName: 'Trophy' }
    : weekScore >= 50 ? { text: 'Gute Woche',          color: 'var(--green-bright)',        iconName: 'TrendingUp' }
    : weekScore >  0  ? { text: 'Woche im Aufbau',     color: 'var(--orange)',        iconName: 'Activity' }
    : { text: 'Diese Woche starten', color: 'var(--text-muted)', iconName: 'Target' };

  return (
    <div className="page">
      <div className="progress-container">
        {/* P6: Status Header mit Live-Badges */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ marginBottom: 6 }}>{t('progress.title')}</h1>
            <p>{t('progress.subtitle')}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {/* P6: Tagesstatus Badge — Lucide Icons */}
            {(() => {
              const iconMap = { AlertCircle, TrendingUp, CheckCircle2, Activity, Minus };
              const SI = iconMap[statusText.iconName];
              return (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 100,
                  background: statusText.bg, border: `1px solid ${statusText.border}`,
                  fontSize: 13, fontWeight: 700, color: statusText.color,
                  animation: 'slideUpFade 0.4s ease both',
                }}>
                  {SI && <SI size={13} strokeWidth={2} />}
                  <span>{statusText.text}</span>
                </div>
              );
            })()}
            {/* Wochentrend Badge */}
            {daysWithData > 0 && (() => {
              const iconMap = { Trophy, TrendingUp, Activity, Target };
              const WI = iconMap[weekTrend.iconName];
              return (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 100,
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  fontSize: 13, fontWeight: 600, color: weekTrend.color,
                  animation: 'slideUpFade 0.4s 0.1s ease both',
                }}>
                  {WI && <WI size={13} strokeWidth={2} />}
                  <span>{weekTrend.text}</span>
                </div>
              );
            })()}
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="progress-stats-grid">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="progress-stat-card" style={{
                animation: `slideUpFade 0.4s ${i * 0.07}s ease both`,
              }}>
                <div className="progress-stat-icon"><Icon size={22} strokeWidth={1.5} color="var(--text-secondary)" /></div>
                <div className="progress-stat-value">{s.value}</div>
                <div className="progress-stat-label">{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* ── P3: Kalorienfortschritt — Premium ── */}
        <div className="progress-card" style={{
          borderColor: pct >= 100 ? 'rgba(239,68,68,0.3)' : pct >= 85 ? 'rgba(34,197,94,0.3)' : 'var(--border)',
          transition: 'border-color 0.4s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <h3 className="progress-card-title" style={{ marginBottom: 0 }}>{t('progress.calorie_progress')}</h3>
            {/* P3: Tagesstatus Badge */}
            <span style={{
              fontSize: 12, fontWeight: 700, color: statusText.color,
              background: 'var(--bg-card-2)', border: `1px solid ${statusText.color}40`,
              padding: '3px 10px', borderRadius: 100, flexShrink: 0,
            }}>
              {statusText.text}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              {totalCal.toLocaleString()} kcal gegessen
            </span>
            <span style={{ fontSize: 16, fontWeight: 800, color: pct >= 100 ? 'var(--red)' : 'var(--green)' }}>
              {Math.round(animatedPct)}%
            </span>
          </div>

          {/* P3: Premium Gradient Progress Bar */}
          <GradientProgressBar value={totalCal} max={calorieGoal} height={12} />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            <span>0 kcal</span>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
              {calorieGoal > 0 && totalCal < calorieGoal
                ? `${(calorieGoal - totalCal).toLocaleString()} kcal verbleibend`
                : `Ziel: ${calorieGoal.toLocaleString()} kcal`}
            </span>
            <span>Ziel</span>
          </div>

          {/* P3: Makro Progress Bars */}
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: t('progress.protein'), value: totalProt, goal: calorieGoal > 0 ? Math.round((calorieGoal * 0.30) / 4) : 0, unit: 'g', color: 'var(--red)' },
              { label: t('progress.carbs'), value: totalCarb, goal: calorieGoal > 0 ? Math.round((calorieGoal * 0.45) / 4) : 0, unit: 'g', color: 'var(--orange)' },
              { label: 'Fette', value: totalFat, goal: calorieGoal > 0 ? Math.round((calorieGoal * 0.25) / 9) : 0, unit: 'g', color: 'var(--yellow)' },
            ].map(m => {
              const mPct = m.goal > 0 ? Math.min((m.value / m.goal) * 100, 100) : 0;
              return (
                <div key={m.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.color, display: 'inline-block' }} />
                      {m.label}
                    </span>
                    <span style={{ fontWeight: 600, color: m.color }}>
                      {m.value}{m.unit}
                      {m.goal > 0 && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> / {m.goal}{m.unit}</span>}
                    </span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${mPct}%`,
                      background: m.color, borderRadius: 100,
                      transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: mPct > 0 ? `0 0 8px ${m.color}60` : 'none',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── P3: Wochenverlauf — Premium Balkendiagramm ── */}
        <div className="progress-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 className="progress-card-title" style={{ marginBottom: 0 }}>{t('progress.week_view')}</h3>
            {streak > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* P8: Streak Milestone Badge — Lucide Icons */}
                <span style={{
                  fontSize: 12, fontWeight: 700,
                  color: streak >= 30 ? 'var(--yellow)' : streak >= 14 ? 'var(--purple)' : streak >= 7 ? '#22c55e' : 'var(--orange)',
                  background: streak >= 30 ? 'rgba(234,179,8,0.1)' : streak >= 14 ? 'rgba(168,85,247,0.1)' : streak >= 7 ? 'rgba(34,197,94,0.1)' : 'rgba(249,115,22,0.08)',
                  border: `1px solid ${streak >= 30 ? 'rgba(234,179,8,0.25)' : streak >= 14 ? 'rgba(168,85,247,0.25)' : streak >= 7 ? 'rgba(34,197,94,0.25)' : 'rgba(249,115,22,0.2)'}`,
                  padding: '4px 12px', borderRadius: 100,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {streak >= 30 ? <Crown size={12} strokeWidth={2} /> :
                   streak >= 14 ? <Award size={12} strokeWidth={2} /> :
                   streak >= 7  ? <Flame size={12} strokeWidth={2} /> :
                                  <Zap size={12} strokeWidth={2} />}
                  {streak} Tag{streak !== 1 ? 'e' : ''} Streak
                  {streak >= 7 && <span style={{ fontSize: 9, opacity: 0.7, letterSpacing: '0.3px' }}>
                    {streak >= 30 ? '· Legende' : streak >= 14 ? '· Elite' : '· Profi'}
                  </span>}
                </span>
              </div>
            )}
          </div>

          {/* P3: Balkendiagramm mit Labels und Kalorien */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 140 }}>
            {weekData.map((d, i) => {
              const barH = maxWeekKcal > 0 && d.kcal > 0 ? Math.max((d.kcal / maxWeekKcal) * 100, 8) : 0;
              const isGoalReached = calorieGoal > 0 && d.kcal >= calorieGoal * 0.8;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%' }}>
                  {/* Kalorie-Label oben */}
                  <div style={{ fontSize: 9, color: d.active ? 'var(--green)' : 'var(--text-muted)', fontWeight: d.active ? 700 : 400, minHeight: 14 }}>
                    {d.kcal > 0 ? (d.kcal >= 1000 ? `${(d.kcal/1000).toFixed(1)}k` : d.kcal) : ''}
                  </div>

                  {/* Bar Track */}
                  <div style={{
                    flex: 1, width: '100%',
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: 8, display: 'flex', alignItems: 'flex-end',
                    overflow: 'hidden', position: 'relative',
                    border: d.active ? '1px solid rgba(34,197,94,0.2)' : '1px solid transparent',
                  }}>
                    {d.kcal > 0 && (
                      <div style={{
                        width: '100%', height: `${barH}%`,
                        borderRadius: 7,
                        background: d.active
                          ? 'linear-gradient(to top, #16a34a, #22c55e, #4ade80)'
                          : isGoalReached
                            ? 'rgba(34,197,94,0.45)'
                            : 'rgba(255,255,255,0.14)',
                        transition: 'height 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: d.active ? '0 0 16px rgba(34,197,94,0.35)' : 'none',
                        position: 'relative', overflow: 'hidden',
                      }}>
                        {/* Shine on active */}
                        {d.active && (
                          <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 60%)',
                            borderRadius: 7,
                          }} />
                        )}
                      </div>
                    )}
                    {d.kcal === 0 && (
                      <div style={{ width: '100%', textAlign: 'center', paddingBottom: 6 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>–</span>
                      </div>
                    )}
                  </div>

                  {/* Tag Label */}
                  <div style={{
                    fontSize: 11, fontWeight: d.active ? 700 : 500,
                    color: d.active ? 'var(--green)' : 'var(--text-muted)',
                  }}>
                    {d.day}
                  </div>
                </div>
              );
            })}
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
            <button onClick={() => setShowWeightInput(v => !v)} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 8,
              background: showWeightInput ? 'var(--green-glow)' : 'var(--bg-card-2)',
              border: `1px solid ${showWeightInput ? 'var(--border-active)' : 'var(--border)'}`,
              color: showWeightInput ? 'var(--green)' : 'var(--text-muted)',
              cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s ease',
            }}>
              {showWeightInput ? <ChevronUp size={13} /> : <Plus size={13} />}
              {showWeightInput ? 'Schliessen' : 'Eintragen'}
            </button>
          </div>

          {showWeightInput && (
            <div style={{
              display: 'flex', gap: 8, marginBottom: 16, padding: 14,
              background: 'var(--bg-card-2)', border: '1px solid var(--border-active)', borderRadius: 10,
            }}>
              <div style={{ display: 'flex', flex: 1, gap: 0 }}>
                <input type="number" placeholder="z.B. 75.5" value={weightInput}
                  onChange={e => setWeightInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveWeight()}
                  min="20" max="500" step="0.1"
                  className="form-input"
                  style={{ flex: 1, borderRadius: '10px 0 0 10px', borderRight: 'none' }}
                  autoFocus />
                <div style={{
                  padding: '0 12px', background: 'var(--bg-hover)',
                  border: '1px solid var(--border)', borderRadius: '0 10px 10px 0',
                  display: 'flex', alignItems: 'center', fontSize: 13, color: 'var(--text-muted)',
                }}>kg</div>
              </div>
              <button onClick={saveWeight} disabled={savingWeight || !weightInput}
                className="btn btn-primary" style={{ padding: '10px 16px', flexShrink: 0 }}>
                {savingWeight ? '...' : <Check size={15} />}
              </button>
            </div>
          )}

          {latestWeight && (
            <div style={{ display: 'grid', gridTemplateColumns: bmi ? '1fr 1fr 1fr' : '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div style={{ background: 'var(--bg-card-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{latestWeight}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>kg aktuell</div>
              </div>
              {weightDiff !== null && (
                <div style={{ background: 'var(--bg-card-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: parseFloat(weightDiff) < 0 ? 'var(--green)' : parseFloat(weightDiff) > 0 ? 'var(--orange)' : 'var(--text)' }}>
                    {parseFloat(weightDiff) > 0 ? '+' : ''}{weightDiff}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>kg Veränderung</div>
                </div>
              )}
              {bmi && (
                <div style={{ background: 'var(--bg-card-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: bmiColor }}>{bmi}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>BMI · {bmiCategory}</div>
                </div>
              )}
            </div>
          )}

          {weightChart.length > 1 ? (
            <div style={{ marginBottom: 8 }}>
              <svg width="100%" height="100" viewBox={`0 0 ${weightChart.length * 50} 80`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(34,197,94,0.35)" />
                    <stop offset="100%" stopColor="rgba(34,197,94,0)" />
                  </linearGradient>
                </defs>
                {[0, 0.5, 1].map((p, i) => (
                  <line key={i} x1="0" y1={p * 70} x2={weightChart.length * 50} y2={p * 70} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                ))}
                <path
                  d={[
                    `M ${weightChart.map((w, i) => { const x = i*50+25; const y = ((weightMax-w.weight)/weightRange)*60+5; return `${x},${y}`; }).join(' L ')}`,
                    `L ${(weightChart.length-1)*50+25},75`, `L 25,75 Z`
                  ].join(' ')}
                  fill="url(#weightGrad)"
                />
                <polyline
                  points={weightChart.map((w, i) => { const x = i*50+25; const y = ((weightMax-w.weight)/weightRange)*60+5; return `${x},${y}`; }).join(' ')}
                  fill="none" stroke="var(--green)" strokeWidth="2.5"
                  strokeLinejoin="round" strokeLinecap="round"
                />
                {weightChart.map((w, i) => {
                  const x = i*50+25; const y = ((weightMax-w.weight)/weightRange)*60+5; const isLast = i === weightChart.length-1;
                  return (
                    <g key={i}>
                      {isLast && <circle cx={x} cy={y} r={10} fill="rgba(34,197,94,0.15)" />}
                      <circle cx={x} cy={y} r={isLast ? 5 : 3} fill="var(--green)" stroke="var(--bg-card)" strokeWidth="1.5" />
                      <text x={x} y={y-10} textAnchor="middle" fontSize="9" fill="var(--text-muted)">{w.weight}</text>
                    </g>
                  );
                })}
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                {weightChart.map((w, i) => (
                  <div key={i} style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', flex: 1 }}>
                    {new Date(w.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              {weightLoaded && weightLog.length === 0 ? (
                <><Scale size={32} strokeWidth={1.2} color="var(--text-muted)" style={{ marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
                Noch kein Gewicht eingetragen.<br /><span style={{ fontSize: 12 }}>Trag täglich dein Gewicht ein um deinen Verlauf zu sehen.</span></>
              ) : weightLog.length === 1 ? t('progress.log_tomorrow') : 'Lädt...'}
            </div>
          )}

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
                    border: '1px solid var(--border)', borderRadius: 8, fontSize: 13,
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

        {/* ── P3: Achievements — mit Glow für aktive ── */}
        <div className="progress-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 className="progress-card-title" style={{ marginBottom: 0 }}>
              Errungenschaften
            </h3>
            <span style={{
              fontSize: 12, fontWeight: 700,
              color: 'var(--green)',
              background: 'var(--green-glow)', border: '1px solid var(--border-active)',
              padding: '3px 10px', borderRadius: 100,
            }}>
              {achievements.filter(a => a.done).length}/{achievements.length} erreicht
            </span>
          </div>
          <div className="achievements-grid">
            {achievements.map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={i} style={{
                  background: a.done ? `${a.color}0d` : 'var(--bg-card-2)',
                  border: `1px solid ${a.done ? `${a.color}55` : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  padding: 16,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  textAlign: 'center', gap: 6,
                  transition: 'all 0.3s ease',
                  opacity: a.done ? 1 : 0.45,
                  // P3: Glow für aktive Achievements
                  boxShadow: a.done ? `0 0 20px ${a.color}25, 0 0 40px ${a.color}10` : 'none',
                  animation: a.done ? `countIn 0.4s ${i * 0.05}s cubic-bezier(0.22, 1, 0.36, 1) both` : 'none',
                }}>
                  <div style={{ fontSize: 28, lineHeight: 1 }}>
                    {a.done
                      ? <Icon size={22} strokeWidth={1.5} color={a.color} />
                      : <Lock size={22} strokeWidth={1.5} color="var(--text-muted)" />}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: a.done ? 'var(--text)' : 'var(--text-muted)' }}>
                    {a.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {a.desc}
                  </div>
                  {a.done && (
                    <div style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px',
                      borderRadius: 100, background: `${a.color}22`,
                      color: a.color, border: `1px solid ${a.color}44`,
                      marginTop: 2,
                    }}>
                      Erreicht
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* P6: Motivationsbanner mit Trend-Daten ── */}
        <div className="motivation-banner" style={{
          borderColor: streak >= 7 ? 'rgba(234,179,8,0.3)' : 'var(--border)',
          background: streak >= 7
            ? 'linear-gradient(135deg, rgba(234,179,8,0.06), var(--bg-card))'
            : 'var(--bg-card)',
        }}>
          <div className="motivation-icon">
            <TrendingUp size={36} strokeWidth={1.5} color={streak >= 7 ? 'var(--yellow)' : 'var(--green)'} />
          </div>
          <div style={{ flex: 1 }}>
            {/* P8: Streak Milestone Messages */}
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
              {streak >= 30 ? 'Legendärer Status' :
               streak >= 14 ? 'Elite-Level erreicht' :
               streak >= 7  ? 'Aussergewöhnlich' :
               streak >= 3  ? 'Starke Konstanz' :
               streak === 1  ? 'Erster Schritt' :
               t('progress.stay_on_track')}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>
              {totalDaysLogged === 0
                ? 'Fang heute an – jede Mahlzeit bringt dich näher ans Ziel.'
                : streak >= 30
                  ? `${streak} Tage in Folge. Bemerkenswerte Disziplin.`
                  : streak >= 14
                    ? `${streak} Tage non-stop. Das ist Elite-Level Disziplin.`
                    : streak >= 7
                      ? `${streak} Tage Streak. Du bist auf dem besten Weg.`
                      : streak >= 3
                        ? `${streak} Tage in Folge. Weiter so.`
                        : streak === 1
                          ? 'Erster Schritt gesetzt. Morgen weiter.'
                          : `Super! Du hast heute ${dailyLog.length} Mahlzeit${dailyLog.length !== 1 ? 'en' : ''} geloggt.`}
            </div>

            {/* P6: Wochenstatistik Mini-Grid */}
            {daysWithData > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { label: 'Tage getrackt',  value: `${daysWithData}/7`,       color: 'var(--green)' },
                  { label: 'Ø Kalorien',     value: `${avgKcal.toLocaleString()} kcal`, color: 'var(--blue-light)' },
                  { label: 'On Track Tage',  value: `${daysOnTrack} Tage`,     color: 'var(--green-bright)' },
                ].map(s => (
                  <div key={s.label} style={{
                    background: 'var(--bg-card-2)', border: '1px solid var(--border)',
                    borderRadius: 10, padding: '10px 12px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* P8: Nächste Streak-Milestone */}
            {streak > 0 && (() => {
              const milestones = [3, 7, 14, 30, 60, 100];
              const next = milestones.find(m => m > streak);
              const daysLeft = next ? next - streak : null;
              if (!daysLeft) return null;
              return (
                <div style={{
                  marginTop: 12, padding: '10px 14px', borderRadius: 10,
                  background: 'var(--bg-card-2)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Target size={12} strokeWidth={1.8} />
                    Nächste Milestone
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>
                    {daysLeft} {daysLeft === 1 ? 'Tag' : 'Tage'} bis {next}-Tage Streak
                  </span>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmerBar {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
