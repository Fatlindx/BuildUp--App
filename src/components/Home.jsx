import {
  UtensilsCrossed, Dumbbell, BarChart2, Flame, Plus, Calculator, ChevronRight, MessageCircle, Target, Activity, TrendingUp, CheckCircle2, Sunrise, Clock
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useI18n } from '../i18n.jsx';
import { exercises } from '../data/exercises';

// ── Dynamische Motivations-Texte ──
function getDynamicStatus(pct, totalCalories, calorieGoal, dailyLog, hour, t) {
  if (pct >= 100) return {
    title: t('home.status_goal_reached'),
    subtitle: t('home.status_sub_goal_reached'),
    color: '#22c55e',
    iconName: 'CheckCircle2',
  };
  if (pct >= 85) return {
    title: t('home.status_great'),
    subtitle: t('home.status_sub_great'),
    color: 'var(--green-bright)',
    iconName: 'TrendingUp',
  };
  if (pct >= 50) return {
    title: t('home.status_halfway'),
    subtitle: t('home.status_sub_halfway'),
    color: 'var(--blue-light)',
    iconName: 'Activity',
  };
  if (hour < 10 && (dailyLog || []).length === 0) return {
    title: t('home.greeting_morning') + '.',
    subtitle: t('home.status_sub_nothing'),
    color: 'var(--orange)',
    iconName: 'Sunrise',
  };
  if (hour >= 18 && pct < 30) return {
    title: t('home.status_start'),
    subtitle: t('home.status_sub_start'),
    color: 'var(--orange)',
    iconName: 'Clock',
  };
  return {
    title: t('home.status_nothing_yet'),
    subtitle: t('home.status_sub_nothing'),
    color: 'var(--text)',
    iconName: null,
  };
}

// ── Motivations-Chips ──
const motivationQuotes = (t) => [
  t('home.progress_motivation'),
  'Consistency is the key to results.',
  'Small steps, big changes.',
  'Discipline beats motivation every time.',
  t('home.streak_great'),
];

// ── Mahlzeit-Feedback Toast ──
function FeedbackToast({ message, show }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9000,
      background: 'rgba(15,15,15,0.92)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(34,197,94,0.25)',
      color: 'var(--text)',
      padding: '10px 20px',
      borderRadius: 10,
      fontSize: 13, fontWeight: 500,
      display: 'flex', alignItems: 'center', gap: 8,
      animation: 'toastIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      whiteSpace: 'nowrap',
      letterSpacing: '-0.1px',
    }}>
      <CheckCircle2 size={14} color="var(--green)" strokeWidth={2} />
      {message}
    </div>
  );
}

export default function Home({ setActiveSection, calorieGoal, totalCalories, dailyLog, logHistory, username }) {
  const hour = new Date().getHours();
  const { t, lang } = useI18n();
  const greeting = hour < 5 ? t('home.greeting_night') : hour < 12 ? t('home.greeting_morning') : hour < 18 ? t('home.greeting_day') : t('home.greeting_evening');
  const greetingIcon = null; // Icons werden inline gerendert

  // ── P7: Retention Logic ──
  const TODAY = new Date().toISOString().split('T')[0];
  const history = logHistory || {};

  // Streak berechnen
  const calcStreak = () => {
    let streak = 0;
    const d = new Date();
    // Start from yesterday (today might not be done yet)
    d.setDate(d.getDate() - 1);
    for (let i = 0; i < 60; i++) {
      const key = d.toISOString().split('T')[0];
      if ((history[key] || []).length > 0) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    // Also count today if logged
    if ((history[TODAY] || []).length > 0 || (dailyLog || []).length > 0) streak++;
    return streak;
  };
  const streak = calcStreak();

  // Gestern nicht getrackt?
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().split('T')[0];
  const loggedYesterday = (history[yesterdayKey] || []).length > 0;
  const loggedToday = (dailyLog || []).length > 0 || (history[TODAY] || []).length > 0;
  const showNudge = !loggedYesterday && !loggedToday && hour >= 9; // Nudge nur ab 9 Uhr

  // Wochenstatistik
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  const daysTrackedThisWeek = weekDays.filter(d =>
    d === TODAY ? loggedToday : (history[d] || []).length > 0
  ).length;

  // Weekly Summary — Sonntag oder wenn genug Daten (>= 3 Tage diese Woche)
  const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;
  const showWeeklySummary = daysTrackedThisWeek >= 3 && isWeekend && streak > 0;

  const pct = calorieGoal > 0 ? Math.min((totalCalories / calorieGoal) * 100, 100) : 0;
  const remaining = Math.max(calorieGoal - totalCalories, 0);

  const totalProtein = (dailyLog || []).reduce((s, i) => s + (i.protein || 0), 0);
  const totalCarbs   = (dailyLog || []).reduce((s, i) => s + (i.carbs || 0), 0);
  const totalFat     = (dailyLog || []).reduce((s, i) => s + (i.fat || 0), 0);

  const macros = [
    { label: t('home.protein'),       value: totalProtein, unit: 'g', color: 'var(--red)' },
    { label: t('home.carbs'), value: totalCarbs,   unit: 'g', color: 'var(--orange)' },
    { label: t('home.fat'),         value: totalFat,     unit: 'g', color: 'var(--yellow)' },
  ];

  const quotes = motivationQuotes(t);
  const quote = quotes[new Date().getDate() % quotes.length];
  const status = getDynamicStatus(pct, totalCalories, calorieGoal, dailyLog, hour, t);

  const circumference = 2 * Math.PI * 54;
  const dash = circumference - (pct / 100) * circumference;

  // ── P8: Kleine Erfolge — Tages-Meilensteine ──
  const miniMilestones = [];
  if ((dailyLog || []).length >= 3) miniMilestones.push({ iconName: 'UtensilsCrossed', text: '3 Mahlzeiten heute' });
  if (totalProtein >= 100)  miniMilestones.push({ iconName: 'Dumbbell',        text: t('home.milestone_protein') });
  if (pct >= 100)           miniMilestones.push({ iconName: 'Target',           text: t('home.milestone_goal') });
  if (pct >= 50 && pct < 100) miniMilestones.push({ iconName: 'TrendingUp',    text: t('home.milestone_halfway') });

  // ── Toast Feedback ──
  const [toast, setToast] = useState({ show: false, message: '' });
  const prevLogLength = useState((dailyLog || []).length)[0];

  useEffect(() => {
    if ((dailyLog || []).length > 0 && (dailyLog || []).length > prevLogLength) {
      const last = dailyLog[(dailyLog || []).length - 1];
      setToast({ show: true, message: `${last.name} hinzugefügt` });
      setTimeout(() => setToast({ show: false, message: '' }), 2500);
    }
  }, [(dailyLog || []).length]);

  // ── Kontextbasierte Kalorien-Reaktion ──
  const calorieReaction = () => {
    if (!calorieGoal) return null;
    if (pct >= 100) return { text: 'Tagesziel erreicht', color: '#22c55e' };
    if (pct >= 85)  return { text: 'Fast geschafft', color: 'var(--green-bright)' };
    if (pct >= 50)  return { text: 'Auf Kurs', color: 'var(--blue-light)' };
    if (pct > 0)    return { text: 'Gut gestartet', color: 'var(--text-muted)' };
    return { text: 'Noch nichts gegessen', color: 'var(--text-muted)' };
  };
  const reaction = calorieReaction();

  const muscleGroups = [
    { name: 'Brust',     color: 'var(--red)' },
    { name: 'Rücken',    color: 'var(--blue)' },
    { name: 'Beine',     color: 'var(--orange)' },
    { name: 'Schultern', color: 'var(--purple)' },
    { name: 'Bizeps',    color: '#22c55e' },
    { name: 'Core',      color: 'var(--yellow)' },
  ];

  const showName = username && username !== 'User';

  return (
    <div className="page">
      <div className="home-container">

        {/* Hero Greeting — dynamisch */}
        <div className="home-hero">
          <div>
            <div className="home-greeting" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {greeting}{showName ? `, ${username}` : ''}
            </div>

            {/* Dynamischer Status-Titel */}
            <h1 className="home-title" style={{ color: status.color !== 'var(--text)' ? 'var(--text)' : 'var(--text)' }}>
              {status.title.includes('Bereit') ? (
                <>{t('home.status_start')}</>
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
                  <TrendingUp size={11} strokeWidth={2} />
                  {reaction.text}
                </div>
              )}
              {/* P8: Mini-Erfolge als Chips */}
              {miniMilestones.map((m, i) => {
                const IconMap = { UtensilsCrossed, Dumbbell, Target, TrendingUp };
                const MIcon = IconMap[m.iconName];
                return (
                  <div key={i} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)',
                    padding: '4px 10px', borderRadius: 100,
                    fontSize: 12, fontWeight: 600, color: 'var(--green)',
                    animation: `slideUpFade 0.35s ${i * 0.08}s ease both`,
                  }}>
                    {MIcon && <MIcon size={11} strokeWidth={2} />}
                    {m.text}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="home-quote-chip">
            <MessageCircle size={15} style={{ flexShrink: 0, color: 'var(--green)' }} />
            <span>{quote}</span>
          </div>
        </div>

        {/* ── P7: Retention Cards ── */}

        {/* Streak Banner — nur wenn Streak > 1 */}
        {streak > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderRadius: 12, marginBottom: 12,
            background: streak >= 7
              ? 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.03))'
              : 'var(--bg-card)',
            border: `1px solid ${streak >= 7 ? 'var(--border-active)' : 'var(--border)'}`,
            animation: 'slideUpFade 0.3s ease both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Flame size={16} color={streak >= 7 ? 'var(--green)' : 'var(--orange)'} strokeWidth={2} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                  {streak} Tage Streak
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                  {streak >= 7 ? t('home.streak_great') : t('home.streak_next').replace('{n}', 7 - streak)}
                </div>
              </div>
            </div>
            {daysTrackedThisWeek > 0 && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>
                  {daysTrackedThisWeek}/7
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t('common.this_week')}</div>
              </div>
            )}
          </div>
        )}

        {/* Konsistenz-Nudge — wenn gestern nicht getrackt */}
        {showNudge && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '11px 16px', borderRadius: 12, marginBottom: 12,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            animation: 'slideUpFade 0.35s ease both', cursor: 'pointer',
          }}
          onClick={() => setActiveSection('nutrition')}
          >
            <Clock size={15} color="var(--text-muted)" strokeWidth={2} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                {t('home.nudge_title')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                {t('home.nudge_sub')}
              </div>
            </div>
            <ChevronRight size={14} color="var(--text-muted)" />
          </div>
        )}

        {/* Weekly Summary — Wochenende mit genug Daten */}
        {showWeeklySummary && (
          <div style={{
            padding: '14px 16px', borderRadius: 12, marginBottom: 12,
            background: 'linear-gradient(135deg, rgba(34,197,94,0.06), var(--bg-card))',
            border: '1px solid var(--border-active)',
            animation: 'slideUpFade 0.4s ease both',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.7px', color: 'var(--green)', marginBottom: 10 }}>
              Deine Woche
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { label: t('home.days_active'),  value: `${daysTrackedThisWeek}/7`, color: 'var(--green)' },
                { label: t('home.streak'),      value: `${streak} Tage`,          color: 'var(--orange)' },
                { label: t('home.goal_days'),   value: calorieGoal > 0 ? `${weekDays.filter(d => {
                    const log = d === TODAY ? dailyLog : (history[d] || []);
                    const kcal = (log || []).reduce((s,i) => s + (i.calories||0), 0);
                    return kcal >= calorieGoal * 0.85;
                  }).length}` : '—', color: 'var(--blue-light)' },
              ].map(s => (
                <div key={s.label} style={{
                  background: 'var(--bg-card-2)', borderRadius: 10, padding: '10px',
                  textAlign: 'center', border: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                <div className="stat-label">{t('home.today_eaten')}</div>
                <div className="stat-value" style={{
                  color: pct >= 100 ? 'var(--green)' : pct >= 85 ? 'var(--green-bright)' : 'var(--green)',
                  transition: 'color 0.3s ease',
                }}>
                  {totalCalories.toLocaleString()}
                </div>
                <div className="stat-sublabel">{t('home.of_goal').replace('{goal}', calorieGoal.toLocaleString())}</div>
                <div className="stat-remaining" style={{ marginTop: 8 }}>
                  {remaining > 0
                    ? <span style={{ color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Flame size={13} /> {t('home.remaining').replace('{n}', remaining.toLocaleString())}
                      </span>
                    : <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700 }}>
                        <CheckCircle2 size={13} /> {t('home.goal_reached')}
                      </span>}
                </div>

                {/* Mahlzeiten-Zähler */}
                {(dailyLog || []).length > 0 && (
                  <div style={{
                    marginTop: 10, fontSize: 12, color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <UtensilsCrossed size={11} />
                    {(dailyLog || []).length} {t('home.meals_today')}
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
                    stroke={pct >= 100 ? '#22c55e' : pct >= 85 ? 'var(--green-bright)' : 'var(--green)'}
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
                    {t('home.goal_set')}
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
              <div className="mini-stat-value">{(dailyLog || []).length}</div>
              <div className="mini-stat-label">{t('home.meals_today')}</div>
            </div>
            <div className="mini-stat-card" onClick={() => setActiveSection('exercises')}>
              <div className="mini-stat-icon"><Dumbbell size={22} strokeWidth={1.5} color="var(--text-secondary)" /></div>
              <div className="mini-stat-value">{exercises.length}</div>
              <div className="mini-stat-label">{t('home.exercises_available')}</div>
            </div>
            <div className="mini-stat-card" onClick={() => setActiveSection('progress')}>
              <div className="mini-stat-icon"><BarChart2 size={22} strokeWidth={1.5} color="var(--text-secondary)" /></div>
              <div className="mini-stat-value">{calorieGoal > 0 ? <CheckCircle2 size={16} color="var(--green)" strokeWidth={2} /> : <span style={{color:"var(--text-muted)"}}>—</span>}</div>
              <div className="mini-stat-label">{t('home.goal_set')}</div>
            </div>
            <div className="mini-stat-card" onClick={() => setActiveSection('calculator')}>
              <div className="mini-stat-icon"><Flame size={22} strokeWidth={1.5} color="var(--text-secondary)" /></div>
              <div className="mini-stat-value">{calorieGoal.toLocaleString()}</div>
              <div className="mini-stat-label">{t('home.kcal_goal')}</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="home-section">
          <h2 className="home-section-title">{t('home.quick_actions')}</h2>
          <div className="quick-actions-grid">
            <button className="quick-action-card" onClick={() => setActiveSection('nutrition')}>
              <div className="qa-icon" style={{ background: 'rgba(34,197,94,0.15)' }}>
                <Plus size={24} color="#22c55e" strokeWidth={1.8} />
              </div>
              <div className="qa-label">{t('home.add_meal')}</div>
              <div className="qa-sub">{t('home.add_meal_sub')}</div>
            </button>
            <button className="quick-action-card" onClick={() => setActiveSection('exercises')}>
              <div className="qa-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>
                <Dumbbell size={24} color="#3b82f6" strokeWidth={1.8} />
              </div>
              <div className="qa-label">{t('home.discover_exercises')}</div>
              <div className="qa-sub">{exercises.length} {t('nav.exercises')}</div>
            </button>
            <button className="quick-action-card" onClick={() => setActiveSection('calculator')}>
              <div className="qa-icon" style={{ background: 'rgba(239,68,68,0.15)' }}>
                <Calculator size={24} color="#ef4444" strokeWidth={1.8} />
              </div>
              <div className="qa-label">{t('home.calorie_calc')}</div>
              <div className="qa-sub">{t('home.calorie_calc_sub')}</div>
            </button>
            <button className="quick-action-card" onClick={() => setActiveSection('progress')}>
              <div className="qa-icon" style={{ background: 'rgba(234,179,8,0.15)' }}>
                <TrendingUp size={24} color="#eab308" strokeWidth={1.8} />
              </div>
              <div className="qa-label">{t('home.view_progress')}</div>
              <div className="qa-sub">{t('home.view_progress_sub')}</div>
            </button>
          </div>
        </div>

        {/* Recent Meals */}
        {(dailyLog || []).length > 0 && (
          <div className="home-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="home-section-title" style={{ marginBottom: 0 }}>{t('home.todays_meals')}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setActiveSection('nutrition')}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {t('common.see_all')} <ChevronRight size={14} />
              </button>
            </div>
            <div className="recent-meals">
              {(dailyLog || []).slice(-4).reverse().map((item, i) => (
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
          <h2 className="home-section-title">{t('home.training_by_muscle')}</h2>
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
