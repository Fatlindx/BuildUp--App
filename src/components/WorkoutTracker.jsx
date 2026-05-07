import { useState, useEffect } from 'react';
import { useI18n } from '../i18n.jsx';
import {
  Plus, Trash2, Play, Check, Clock, Dumbbell, BarChart2, Edit2, X, Search, Trophy, ArrowLeft, Timer, ClipboardList, ChevronUp, ChevronDown, TrendingUp, Star,
  Award,
  Activity,
  ArrowUp,
  Layers,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../supabase';
import { exercises } from '../data/exercises';

const muscleColors = {
  Brust: 'var(--red)', Rücken: 'var(--blue)', Schultern: 'var(--purple)',
  Beine: 'var(--orange)', Bizeps: '#22c55e', Trizeps: '#06b6d4', Core: 'var(--yellow)',
};

// ── Quick-Start Templates ──────────────────────────────────────────────────
const TEMPLATES = [
  {
    name: 'Push / Pull / Legs',
    description: 'Klassischer 3-Tage Split',
    days: [
      { id: 't1', name: 'Push', exercises: [
        { exerciseId: 'bench-press', sets: 4, reps: 8, weight: 60 },
        { exerciseId: 'overhead-press', sets: 3, reps: 10, weight: 40 },
        { exerciseId: 'incline-dumbbell-press', sets: 3, reps: 12, weight: 20 },
      ]},
      { id: 't2', name: 'Pull', exercises: [
        { exerciseId: 'pull-up', sets: 4, reps: 8, weight: 0 },
        { exerciseId: 'bent-over-row', sets: 3, reps: 10, weight: 60 },
        { exerciseId: 'dumbbell-curl', sets: 3, reps: 12, weight: 15 },
      ]},
      { id: 't3', name: 'Legs', exercises: [
        { exerciseId: 'squat', sets: 4, reps: 8, weight: 80 },
        { exerciseId: 'leg-press', sets: 3, reps: 12, weight: 100 },
        { exerciseId: 'romanian-deadlift', sets: 3, reps: 10, weight: 60 },
      ]},
    ]
  },
  {
    name: 'Upper / Lower',
    description: 'training.template_split_desc',
    days: [
      { id: 'u1', name: 'Upper A', exercises: [
        { exerciseId: 'bench-press', sets: 4, reps: 8, weight: 60 },
        { exerciseId: 'bent-over-row', sets: 4, reps: 8, weight: 60 },
        { exerciseId: 'overhead-press', sets: 3, reps: 10, weight: 40 },
      ]},
      { id: 'u2', name: 'Lower A', exercises: [
        { exerciseId: 'squat', sets: 4, reps: 8, weight: 80 },
        { exerciseId: 'romanian-deadlift', sets: 3, reps: 10, weight: 60 },
        { exerciseId: 'leg-press', sets: 3, reps: 12, weight: 100 },
      ]},
    ]
  },
  {
    name: 'Ganzkörper',
    description: 'training.template_fullbody_desc',
    days: [
      { id: 'g1', name: 'Ganzkörper A', exercises: [
        { exerciseId: 'squat', sets: 3, reps: 10, weight: 50 },
        { exerciseId: 'bench-press', sets: 3, reps: 10, weight: 50 },
        { exerciseId: 'bent-over-row', sets: 3, reps: 10, weight: 50 },
      ]},
      { id: 'g2', name: 'Ganzkörper B', exercises: [
        { exerciseId: 'deadlift', sets: 3, reps: 8, weight: 70 },
        { exerciseId: 'overhead-press', sets: 3, reps: 10, weight: 35 },
        { exerciseId: 'pull-up', sets: 3, reps: 8, weight: 0 },
      ]},
    ]
  },
];

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('de-DE', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

// ── Pause Timer ────────────────────────────────────────────────────────────
function PauseTimer({ duration, onDone }) {
  const [remaining, setRemaining] = useState(duration);
  useEffect(() => {
    if (remaining <= 0) { onDone(); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining]);
  const pct = ((duration - remaining) / duration) * 100;
  return (
    <div style={{
      position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
      background: 'var(--bg-card)', border: '1px solid var(--border-active)',
      borderRadius: 'var(--radius-xl)', padding: '16px 28px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      boxShadow: 'var(--shadow-green)', zIndex: 300, minWidth: 220,
      animation: 'slideUp 0.3s ease',
    }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
        Pause
      </div>
      <div style={{ fontSize: 40, fontWeight: 900, color: 'var(--green)', letterSpacing: '-1.5px' }}>
        {formatDuration(remaining)}
      </div>
      <div style={{ width: '100%', height: 4, background: 'var(--bg-card-2)', borderRadius: 100 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--green)', borderRadius: 100, transition: 'width 1s linear' }} />
      </div>
      <button className="btn btn-ghost btn-sm" onClick={onDone} style={{ fontSize: 12 }}>
        Überspringen →
      </button>
    </div>
  );
}

// ── Hauptkomponente ────────────────────────────────────────────────────────
export default function WorkoutTracker({ user, profile }) {
  const { t } = useI18n();
  const [view, setView]           = useState('plans');
  const [plans, setPlans]         = useState([]);
  const [history, setHistory]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editPlan, setEditPlan]   = useState(null);
  const [activePlan, setActivePlan] = useState(null);

  useEffect(() => {
    if (user) { loadPlans(); loadHistory(); }
  }, [user]);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('workout_plans').select('*')
        .eq('user_id', user.id).order('created_at', { ascending: false });
        setPlans(data || []);
    } catch (err) {
      console.error('Load plans error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const { data } = await supabase.from('workout_history').select('*')
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
      setHistory(data || []);
    } catch (err) {
      console.error('Load history error:', err);
    }
  };

  const deletePlan = async (id) => {
    if (!confirm(t('training.delete_confirm'))) return;
    try {
      await supabase.from('workout_plans').delete().eq('id', id);
      setPlans(p => p.filter(x => x.id !== id));
    } catch (err) {
      console.error('Delete plan error:', err);
    }
  };

  const openEdit = (plan = null) => {
    setEditPlan(plan ? {
      id: plan.id, name: plan.name,
      description: plan.description || '',
      days: plan.plan_data?.days || [],
    } : { name: '', description: '', days: [] });
    setView('create');
  };

  const startWorkout = (plan) => {
    setActivePlan(plan);
    setView('workout');
  };

  return (
    <div className="page">
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 80px' }}>

        {view !== 'workout' && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1px', marginBottom: 6 }}>Training</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
                  Erstelle Pläne, tracke deine Workouts und verfolge deinen Fortschritt.
                </p>
              </div>
              {view === 'plans' && (
                <button className="btn btn-primary" onClick={() => openEdit()}>
                  <Plus size={16} /> Neuer Plan
                </button>
              )}
              {(view === 'create' || view === 'history') && (
                <button className="btn btn-ghost" onClick={() => { setView('plans'); setEditPlan(null); }}>
                  <ArrowLeft size={15} /> Zurück
                </button>
              )}
            </div>

            {view !== 'create' && (
              <div style={{ display: 'flex', gap: 4, marginTop: 24, background: 'var(--bg-card-2)', padding: 4, borderRadius: 12, width: 'fit-content' }}>
                {[
                  { id: 'plans',    label: t('training.my_plans'),  icon: <ClipboardList size={14}/> },
                  { id: 'insights', label: t('training.insights'),    icon: <TrendingUp size={14}/> },
                  { id: 'history',  label: t('training.history_tab'), icon: <BarChart2 size={14}/> },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setView(tab.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '8px 18px', borderRadius: 9, fontSize: 14, fontWeight: 600,
                    background: view === tab.id ? 'var(--green-glow)' : 'transparent',
                    border: view === tab.id ? '1px solid var(--border-active)' : '1px solid transparent',
                    color: view === tab.id ? 'var(--green)' : 'var(--text-secondary)',
                    cursor: 'pointer', transition: 'var(--transition)',
                  }}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'plans'   && <PlansView plans={plans} loading={loading} onEdit={openEdit} onDelete={deletePlan} onStart={startWorkout} onNew={() => openEdit()} history={history} />}
        {view === 'create'  && <CreateView editPlan={editPlan} user={user} onSaved={() => { loadPlans(); setView('plans'); setEditPlan(null); }} />}
        {view === 'workout' && <WorkoutView plan={activePlan} user={user} onDone={() => { loadHistory(); setView('history'); }} onBack={() => setView('plans')} />}
        {view === 'insights' && <InsightsView history={history} plans={plans} />}
        {view === 'history' && <HistoryView history={history} />}
      </div>
    </div>
  );
}

// ── PLANS VIEW ─────────────────────────────────────────────────────────────
function PlansView({ plans, loading, onEdit, onDelete, onStart, onNew, history }) {
  // Berechne Stats aus History
  const totalWorkouts = history.length;
  const totalVolume = history.reduce((s, h) => s + (h.total_volume || 0), 0);
  const totalMinutes = history.reduce((s, h) => s + (h.duration_minutes || 0), 0);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontSize: 14 }}>
      Lädt...
    </div>
  );

  return (
    <div>
      {/* Stats Row */}
      {totalWorkouts > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Workouts', value: totalWorkouts, icon: <Trophy size={18} color="var(--green)" /> },
            { label: 'Gesamt Volumen', value: `${totalVolume.toLocaleString()} kg`, icon: <Dumbbell size={18} color="var(--blue)" /> },
            { label: 'Trainingszeit', value: `${Math.round(totalMinutes / 60)}h ${totalMinutes % 60}m`, icon: <Clock size={18} color="var(--purple)" /> },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '16px 18px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              {s.icon}
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {plans.length === 0 ? (
        <div>
          {/* Empty State */}
          <div style={{
            textAlign: 'center', padding: '48px 24px',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)', marginBottom: 28,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 'var(--radius-lg)',
              background: 'var(--green-glow)', border: '1px solid var(--border-active)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <ClipboardList size={28} color="var(--green)" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Noch kein Trainingsplan</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
              Erstelle deinen ersten Plan oder starte mit einem Template.
            </p>
            <button className="btn btn-primary" onClick={onNew}>
              <Plus size={15} /> Eigenen Plan erstellen
            </button>
          </div>

          {/* Templates */}
          <TemplatesSection onUseTemplate={onNew} />
        </div>
      ) : (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginBottom: 32 }}>
            {plans.map(plan => {
              const days = plan.plan_data?.days || [];
              const totalEx = days.reduce((s, d) => s + (d.exercises?.length || 0), 0);
              const lastWorkout = history.find(h => h.plan_id === plan.id);
              return (
                <div key={plan.id} style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)', padding: 24,
                  transition: 'var(--transition)', position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--green), transparent)' }} />

                  <div style={{ marginBottom: 14 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.3px' }}>{plan.name}</h3>
                    {plan.description && (
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{plan.description?.startsWith('training.') ? t(plan.description) : plan.description}</p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-muted)' }}>
                      <Clock size={12} /> {days.length} Tag{days.length !== 1 ? 'e' : ''}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-muted)' }}>
                      <Dumbbell size={12} /> {totalEx} Übungen
                    </div>
                    {lastWorkout && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-muted)' }}>
                        <TrendingUp size={12} /> Zuletzt: {formatDate(lastWorkout.date)}
                      </div>
                    )}
                  </div>

                  {days.length > 0 && (
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 16 }}>
                      {days.map((day, i) => (
                        <span key={i} style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 100,
                          background: 'var(--bg-card-2)', color: 'var(--text-secondary)',
                          border: '1px solid var(--border)',
                        }}>
                          {day.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary" onClick={() => onStart(plan)} style={{ flex: 1, justifyContent: 'center', padding: '9px 14px' }}>
                      <Play size={14} /> Starten
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => onEdit(plan)} style={{ padding: '9px 12px' }}>
                      <Edit2 size={14} />
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => onDelete(plan.id)} style={{ padding: '9px 12px' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <TemplatesSection onUseTemplate={onNew} />
        </div>
      )}
    </div>
  );
}

// ── TEMPLATES SECTION ──────────────────────────────────────────────────────
function TemplatesSection({ onUseTemplate }) {
  const { t } = useI18n();
  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Star size={16} color="var(--green)" /> Vorlagen
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {TEMPLATES.map((tpl, i) => (
          <div key={i} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '18px 20px',
            cursor: 'pointer', transition: 'var(--transition)',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-active)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{tpl.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{t(tpl.description)}</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
              {tpl.days.map((d, j) => (
                <span key={j} style={{
                  fontSize: 11, padding: '2px 7px', borderRadius: 100,
                  background: 'var(--bg-card-2)', color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                }}>
                  {d.name}
                </span>
              ))}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={onUseTemplate} style={{ width: '100%', justifyContent: 'center' }}>
              Als Vorlage verwenden
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── CREATE VIEW ────────────────────────────────────────────────────────────
function CreateView({ editPlan, user, onSaved }) {
  const { t } = useI18n();
  const [name, setName]             = useState(editPlan?.name || '');
  const [desc, setDesc]             = useState(editPlan?.description || '');
  const [days, setDays]             = useState(editPlan?.days || []);
  const [saving, setSaving]         = useState(false);
  const [activeDay, setActiveDay]   = useState(null);
  const [exSearch, setExSearch]     = useState('');
  const [filterMuscle, setFilterMuscle] = useState('Alle');

  const muscleGroupList = ['Alle', 'Brust', 'Rücken', 'Schultern', 'Beine', 'Bizeps', 'Trizeps', 'Core'];

  const addDay = () => {
    const newDay = { id: Date.now().toString(), name: `Tag ${days.length + 1}`, exercises: [] };
    setDays(d => [...d, newDay]);
    setActiveDay(newDay.id);
  };

  const updateDayName = (id, val) => setDays(d => d.map(x => x.id === id ? { ...x, name: val } : x));
  const removeDay = (id) => { setDays(d => d.filter(x => x.id !== id)); if (activeDay === id) setActiveDay(null); };

  const addExerciseToDay = (dayId, exercise) => {
    setDays(d => d.map(x => x.id === dayId ? {
      ...x, exercises: [...(x.exercises || []), { exerciseId: exercise.id, sets: 3, reps: 10, weight: 0, note: '' }]
    } : x));
  };

  const removeExerciseFromDay = (dayId, index) => {
    setDays(d => d.map(x => x.id === dayId ? { ...x, exercises: x.exercises.filter((_, i) => i !== index) } : x));
  };

  const updateExercise = (dayId, index, field, value) => {
    setDays(d => d.map(x => x.id === dayId ? {
      ...x, exercises: x.exercises.map((e, i) => i === index ? { ...e, [field]: field === 'note' ? value : Number(value) } : e)
    } : x));
  };

  const moveExercise = (dayId, index, dir) => {
    setDays(d => d.map(x => {
      if (x.id !== dayId) return x;
      const exs = [...x.exercises];
      const newIndex = index + dir;
      if (newIndex < 0 || newIndex >= exs.length) return x;
      [exs[index], exs[newIndex]] = [exs[newIndex], exs[index]];
      return { ...x, exercises: exs };
    }));
  };

  const savePlan = async () => {
    if (!name.trim()) { alert(t('training.plan_name') + ' ' + t('common.error')); return; }
    setSaving(true);
    try {
    const payload = { user_id: user.id, name: name.trim(), description: desc.trim(), plan_data: { days } };
    if (editPlan?.id) {
      await supabase.from('workout_plans').update(payload).eq('id', editPlan.id);
    } else {
      await supabase.from('workout_plans').insert(payload);
    }
    } catch (err) {
      console.error('Save plan error:', err);
    } finally {
      setSaving(false);
    }
    onSaved();
  };

  const filteredExercises = exercises.filter(e => {
    const matchSearch = !exSearch || e.name.toLowerCase().includes(exSearch.toLowerCase());
    const matchMuscle = filterMuscle === 'Alle' || e.muscleGroup === filterMuscle;
    return matchSearch && matchMuscle;
  });

  const currentDay = days.find(d => d.id === activeDay);

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24, letterSpacing: '-0.5px' }}>
        {editPlan?.id ? 'Plan bearbeiten' : 'Neuen Plan erstellen'}
      </h2>

      {/* Plan Info */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Plan Name *
            </label>
            <input className="form-input" placeholder="z.B. Push / Pull / Legs" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Beschreibung
            </label>
            <input className="form-input" placeholder="Kurze Beschreibung..." value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>

        {/* Tag Liste */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: 12 }}>
            Trainingstage
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
            {days.map(day => (
              <div key={day.id} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 10px', borderRadius: 9,
                background: activeDay === day.id ? 'var(--green-glow)' : 'transparent',
                border: activeDay === day.id ? '1px solid var(--border-active)' : '1px solid transparent',
                cursor: 'pointer', transition: 'var(--transition)',
              }} onClick={() => setActiveDay(day.id)}>
                <div style={{ flex: 1, fontSize: 13, fontWeight: activeDay === day.id ? 700 : 500, color: activeDay === day.id ? 'var(--green)' : 'var(--text)' }}>
                  {day.name}
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-card-2)', padding: '1px 5px', borderRadius: 4 }}>
                  {day.exercises?.length || 0}
                </span>
                <button onClick={e => { e.stopPropagation(); removeDay(day.id); }} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, opacity: 0.6 }}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={addDay} style={{ width: '100%', justifyContent: 'center' }}>
            <Plus size={13} /> Tag hinzufügen
          </button>
        </div>

        {/* Tag Editor */}
        <div>
          {!currentDay ? (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
              <Dumbbell size={32} strokeWidth={1.2} style={{ display: 'block', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14 }}>{t('training.select_day_hint')}</p>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
              {/* Tag Name */}
              <input className="form-input" value={currentDay.name}
                onChange={e => updateDayName(currentDay.id, e.target.value)}
                style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}
              />

              {/* Übungen */}
              {currentDay.exercises?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: 10 }}>
                    Übungen ({currentDay.exercises.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {currentDay.exercises.map((ex, i) => {
                      const exercise = exercises.find(e => e.id === ex.exerciseId);
                      if (!exercise) return null;
                      const color = muscleColors[exercise.muscleGroup] || 'var(--green)';
                      return (
                        <div key={i} style={{
                          background: 'var(--bg-card-2)', border: '1px solid var(--border)',
                          borderRadius: 10, overflow: 'hidden',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
                            <div style={{ width: 3, height: 32, borderRadius: 2, background: color, flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 14, fontWeight: 600 }}>{exercise.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{exercise.muscleGroup}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              {[
                                { label: 'Sets', field: 'sets', min: 1, max: 10 },
                                { label: 'Reps', field: 'reps', min: 1, max: 50 },
                                { label: 'kg', field: 'weight', min: 0, max: 500 },
                              ].map(({ label, field, min, max }) => (
                                <div key={field} style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                                  <input type="number" min={min} max={max} value={ex[field]}
                                    onChange={e => updateExercise(currentDay.id, i, field, e.target.value)}
                                    style={{
                                      width: 50, padding: '5px 6px', borderRadius: 7, textAlign: 'center',
                                      background: 'var(--bg)', border: '1px solid var(--border)',
                                      color: 'var(--text)', fontSize: 13, fontWeight: 700, outline: 'none',
                                    }}
                                  />
                                </div>
                              ))}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <button onClick={() => moveExercise(currentDay.id, i, -1)} disabled={i === 0}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: i === 0 ? 'var(--border)' : 'var(--text-muted)', padding: 2 }}>
                                  <ChevronUp size={12} />
                                </button>
                                <button onClick={() => moveExercise(currentDay.id, i, 1)} disabled={i === currentDay.exercises.length - 1}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: i === currentDay.exercises.length - 1 ? 'var(--border)' : 'var(--text-muted)', padding: 2 }}>
                                  <ChevronDown size={12} />
                                </button>
                              </div>
                              <button onClick={() => removeExerciseFromDay(currentDay.id, i)}
                                style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          {/* Notiz-Feld */}
                          <div style={{ padding: '0 14px 10px' }}>
                            <input
                              placeholder="Notiz (z.B. Fokus auf Kontraktion)..."
                              value={ex.note || ''}
                              onChange={e => updateExercise(currentDay.id, i, 'note', e.target.value)}
                              style={{
                                width: '100%', padding: '5px 10px', borderRadius: 7, fontSize: 12,
                                background: 'var(--bg)', border: '1px solid var(--border)',
                                color: 'var(--text-secondary)', outline: 'none', boxSizing: 'border-box',
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Übung suchen */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: 10 }}>
                  Übung hinzufügen
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                  <div className="search-bar" style={{ flex: 1, padding: '8px 12px', margin: 0 }}>
                    <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <input placeholder="Übung suchen..." value={exSearch} onChange={e => setExSearch(e.target.value)}
                      style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13, flex: 1 }} />
                  </div>
                  <select value={filterMuscle} onChange={e => setFilterMuscle(e.target.value)}
                    className="form-input" style={{ width: 'auto', padding: '8px 12px' }}>
                    {muscleGroupList.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div style={{ maxHeight: 220, overflowY: 'auto', background: 'var(--bg-card-2)', border: '1px solid var(--border)', borderRadius: 10 }}>
                  {filteredExercises.slice(0, 30).map(ex => {
                    const alreadyAdded = currentDay.exercises?.some(e => e.exerciseId === ex.id);
                    return (
                      <div key={ex.id} onClick={() => !alreadyAdded && addExerciseToDay(currentDay.id, ex)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '9px 14px', cursor: alreadyAdded ? 'default' : 'pointer',
                          borderBottom: '1px solid var(--border)',
                          opacity: alreadyAdded ? 0.4 : 1, transition: 'var(--transition)',
                        }}
                        onMouseEnter={e => { if (!alreadyAdded) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: muscleColors[ex.muscleGroup] || 'var(--green)', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{ex.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ex.muscleGroup} · {ex.difficulty}</div>
                        </div>
                        {alreadyAdded
                          ? <Check size={13} color="var(--green)" />
                          : <Plus size={13} style={{ color: 'var(--green)', flexShrink: 0 }} />
                        }
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, gap: 10 }}>
        <button className="btn btn-primary" onClick={savePlan} disabled={saving} style={{ minWidth: 140, justifyContent: 'center' }}>
          {saving ? 'Wird gespeichert...' : <><Check size={15} /> Plan speichern</>}
        </button>
      </div>
    </div>
  );
}

// ── WORKOUT VIEW ───────────────────────────────────────────────────────────
function WorkoutView({ plan, user, onDone, onBack }) {
  const { t } = useI18n();
  const days = plan?.plan_data?.days || [];
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [setsDone, setSetsDone]   = useState({});
  const [setValues, setSetValues] = useState({});
  const [pauseTimer, setPauseTimer] = useState(null);
  const [pauseDuration, setPauseDuration] = useState(60);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed]     = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const currentDay = days[currentDayIndex];
  const getSetValue = (ei, si, field) => setValues[`${ei}-${si}-${field}`] ?? '';
  const updateSetValue = (ei, si, field, val) => setSetValues(v => ({ ...v, [`${ei}-${si}-${field}`]: val }));

  const toggleSet = (ei, si) => {
    const key = `${ei}-${si}`;
    const wasDone = setsDone[key];
    setSetsDone(s => ({ ...s, [key]: !s[key] }));
    if (!wasDone) setPauseTimer(Date.now());
  };

  const totalSets = currentDay?.exercises?.reduce((s, e) => s + (e.sets || 0), 0) || 0;
  const completedSets = Object.values(setsDone).filter(Boolean).length;
  const progressPct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  const finishWorkout = async () => {
    const durationMin = Math.ceil(elapsed / 60);
    let totalVolume = 0;
    currentDay?.exercises?.forEach((ex, ei) => {
      for (let s = 0; s < ex.sets; s++) {
        if (setsDone[`${ei}-${s}`]) {
          totalVolume += (Number(getSetValue(ei, s, 'reps')) || ex.reps) * (Number(getSetValue(ei, s, 'weight')) || ex.weight);
        }
      }
    });
    try {
      await supabase.from('workout_history').insert({
        user_id: user.id, plan_id: plan.id, plan_name: plan.name,
        day_name: currentDay.name, duration_minutes: durationMin,
        total_volume: totalVolume, exercises_done: { sets: setsDone, values: setValues },
      });
    } catch (err) {
      console.error('Save workout history error:', err);
    }
    setShowSummary(true);
   
  };

  if (showSummary) {
    const durationMin = Math.ceil(elapsed / 60);
    let totalVolume = 0;
    currentDay?.exercises?.forEach((ex, ei) => {
      for (let s = 0; s < ex.sets; s++) {
        if (setsDone[`${ei}-${s}`]) {
          totalVolume += (Number(getSetValue(ei, s, 'reps')) || ex.reps) * (Number(getSetValue(ei, s, 'weight')) || ex.weight);
        }
      }
    });
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', padding: '48px 0' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}><Trophy size={56} color="var(--yellow)" strokeWidth={1.5} /></div>
        <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.8px', marginBottom: 8 }}>Workout abgeschlossen!</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>{currentDay.name} · {plan.name}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
          {[
            { label: t('training.duration'), value: `${durationMin} min`, icon: <Clock size={22}/> },
            { label: 'Sets', value: `${completedSets}/${totalSets}`, icon: <Check size={22}/> },
            { label: 'Volumen', value: `${totalVolume} kg`, icon: <Trophy size={22}/> },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-active)',
              borderRadius: 'var(--radius-lg)', padding: 20,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            }}>
              <div style={{ color: 'var(--green)' }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <button className="btn btn-primary" onClick={onDone} style={{ justifyContent: 'center', minWidth: 180, padding: '13px 28px' }}>
          Fertig
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Workout Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16, padding: '16px 20px',
        background: 'var(--bg-card)', border: '1px solid var(--border-active)',
        borderRadius: 'var(--radius-lg)', position: 'sticky', top: 70, zIndex: 50,
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="btn btn-ghost btn-sm" onClick={onBack}><ArrowLeft size={15} /></button>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              {plan.name}
            </div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>{currentDay?.name}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--green)', letterSpacing: '-0.5px' }}>
              {formatDuration(elapsed)}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t('training.duration')}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: completedSets === totalSets && totalSets > 0 ? 'var(--green)' : 'var(--text)' }}>
              {progressPct}%
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{completedSets}/{totalSets} Sets</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ height: 4, background: 'var(--bg-card-2)', borderRadius: 100, marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--green)', borderRadius: 100, transition: 'width 0.4s ease' }} />
      </div>

      {/* Tag Auswahl */}
      {days.length > 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {days.map((day, i) => (
            <button key={i} onClick={() => setCurrentDayIndex(i)} style={{
              padding: '6px 14px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: currentDayIndex === i ? 'var(--green-glow)' : 'var(--bg-card)',
              border: currentDayIndex === i ? '1px solid var(--border-active)' : '1px solid var(--border)',
              color: currentDayIndex === i ? 'var(--green)' : 'var(--text-secondary)',
              transition: 'var(--transition)',
            }}>
              {day.name}
            </button>
          ))}
        </div>
      )}

      {/* Pausenzeit */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <Timer size={13} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Pause:</span>
        {[30, 60, 90, 120, 180].map(s => (
          <button key={s} onClick={() => setPauseDuration(s)} style={{
            padding: '3px 10px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            background: pauseDuration === s ? 'var(--green-glow)' : 'transparent',
            border: pauseDuration === s ? '1px solid var(--border-active)' : '1px solid var(--border)',
            color: pauseDuration === s ? 'var(--green)' : 'var(--text-secondary)',
          }}>
            {s >= 60 ? `${s/60}m` : `${s}s`}
          </button>
        ))}
      </div>

      {/* Übungen */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
        {currentDay?.exercises?.map((ex, ei) => {
          const exercise = exercises.find(e => e.id === ex.exerciseId);
          if (!exercise) return null;
          const allDone = Array.from({ length: ex.sets }, (_, i) => setsDone[`${ei}-${i}`]).every(Boolean);
          const doneSets = Array.from({ length: ex.sets }, (_, i) => setsDone[`${ei}-${i}`]).filter(Boolean).length;
          const color = muscleColors[exercise.muscleGroup] || 'var(--green)';

          return (
            <div key={ei} style={{
              background: 'var(--bg-card)', border: `1px solid ${allDone ? 'var(--border-active)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-lg)', overflow: 'hidden', transition: 'var(--transition)',
            }}>
              {/* Übung Header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 18px', background: allDone ? 'rgba(34,197,94,0.06)' : 'transparent',
                borderLeft: `3px solid ${allDone ? 'var(--green)' : color}`,
              }}>
                {exercise.image && (
                  <img src={exercise.image} alt={exercise.name} style={{ width: 42, height: 42, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{exercise.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {ex.sets} Sets · {ex.reps} Reps · {ex.weight > 0 ? `${ex.weight} kg` : 'Körpergewicht'}
                    {ex.note && <span style={{ color: 'var(--purple)', marginLeft: 6 }}>· {ex.note}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: allDone ? 'var(--green)' : 'var(--text-muted)' }}>
                    {doneSets}/{ex.sets}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Sets</div>
                </div>
                {allDone && <Check size={18} color="var(--green)" />}
              </div>

              {/* Sets */}
              <div style={{ padding: '0 16px 14px' }}>
                {/* Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr 44px', gap: 6, padding: '6px 4px 4px', borderBottom: '1px solid var(--border)' }}>
                  {['SET', 'KG', 'REPS', ''].map(h => (
                    <span key={h} style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textAlign: 'center' }}>{h}</span>
                  ))}
                </div>
                {Array.from({ length: ex.sets }, (_, si) => {
                  const key = `${ei}-${si}`;
                  const done = setsDone[key];
                  return (
                    <div key={si} style={{
                      display: 'grid', gridTemplateColumns: '28px 1fr 1fr 44px',
                      gap: 6, padding: '5px 4px', alignItems: 'center', borderRadius: 8,
                      background: done ? 'rgba(34,197,94,0.05)' : 'transparent',
                      transition: 'background 0.2s ease',
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: done ? 'var(--green)' : 'var(--text-muted)', textAlign: 'center' }}>
                        {si + 1}
                      </span>
                      <input type="number" placeholder={String(ex.weight || 0)}
                        value={getSetValue(ei, si, 'weight')} disabled={done}
                        onChange={e => updateSetValue(ei, si, 'weight', e.target.value)}
                        style={{
                          padding: '7px 8px', borderRadius: 8, fontSize: 13, fontWeight: 600, textAlign: 'center',
                          background: done ? 'rgba(34,197,94,0.08)' : 'var(--bg-card-2)',
                          border: `1px solid ${done ? 'var(--border-active)' : 'var(--border)'}`,
                          color: 'var(--text)', outline: 'none',
                        }}
                      />
                      <input type="number" placeholder={String(ex.reps)}
                        value={getSetValue(ei, si, 'reps')} disabled={done}
                        onChange={e => updateSetValue(ei, si, 'reps', e.target.value)}
                        style={{
                          padding: '7px 8px', borderRadius: 8, fontSize: 13, fontWeight: 600, textAlign: 'center',
                          background: done ? 'rgba(34,197,94,0.08)' : 'var(--bg-card-2)',
                          border: `1px solid ${done ? 'var(--border-active)' : 'var(--border)'}`,
                          color: 'var(--text)', outline: 'none',
                        }}
                      />
                      <button onClick={() => toggleSet(ei, si)} style={{
                        width: 36, height: 36, borderRadius: 9, display: 'flex',
                        alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        background: done ? 'var(--green)' : 'var(--bg-card-2)',
                        border: `1px solid ${done ? 'var(--green)' : 'var(--border)'}`,
                        transition: 'all 0.15s ease', margin: '0 auto',
                      }}>
                        <Check size={16} color={done ? '#000' : 'var(--text-muted)'} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Beenden */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 20 }}>
        <button className="btn btn-primary" onClick={finishWorkout}
          style={{ justifyContent: 'center', minWidth: 220, padding: '14px 32px', fontSize: 15 }}>
          <Trophy size={16} /> Workout beenden
        </button>
      </div>

      {pauseTimer && (
        <PauseTimer key={pauseTimer} duration={pauseDuration} onDone={() => setPauseTimer(null)} />
      )}
    </div>
  );
}

// ── INSIGHTS VIEW ────────────────────────────────────────────────────────────
function InsightsView({ history, plans }) {
  const { t } = useI18n();

  // ── Compute Personal Records ─────────────────────────────────
  const prByExercise = {};   // exerciseId → { maxWeight, maxVolume, count }
  const muscleHits   = {};   // muscleGroup → count
  const weeklyData   = {};   // ISO week → sessionCount

  history.forEach(session => {
    const sets   = session.exercises_done?.sets   || {};
    const values = session.exercises_done?.values || {};

    // Weekly frequency
    const d    = new Date(session.date || session.created_at);
    const week = `${d.getFullYear()}-W${String(Math.ceil((d.getDate() + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7)).padStart(2,'0')}`;
    weeklyData[week] = (weeklyData[week] || 0) + 1;

    // PR + exercise frequency
    Object.keys(sets).forEach(key => {
      const [exIdxStr] = key.split('-');
      const exIdx = Number(exIdxStr);
      const exId  = session.exercises_done?.exIds?.[exIdx] || `ex_${exIdx}`;
      const exName = session.exercises_done?.exNames?.[exIdx] || `Exercise ${exIdx + 1}`;

      if (!prByExercise[exId]) {
        prByExercise[exId] = { name: exName, maxWeight: 0, maxVolume: 0, count: 0, sessions: 0 };
      }

      const setIdx = Number(key.split('-')[1]);
      const weight = Number(values[`${exIdx}-${setIdx}-weight`]) || 0;
      const reps   = Number(values[`${exIdx}-${setIdx}-reps`])   || 0;
      const vol    = weight * reps;

      if (sets[key]) { // set completed
        prByExercise[exId].count++;
        if (weight > prByExercise[exId].maxWeight) prByExercise[exId].maxWeight = weight;
        if (vol    > prByExercise[exId].maxVolume)  prByExercise[exId].maxVolume = vol;
      }
    });

    // Muscle groups from plans
    plans.forEach(plan => {
      plan.days?.forEach(day => {
        const key = `${session.plan_id}-${session.day_name}`;
        const sessKey = `${plan.id}-${day.name}`;
        if (key === sessKey) {
          day.exercises?.forEach(ex => {
            const ex_data = window.__buildupExercises?.find?.(e => e.id === ex.exerciseId);
            const muscle  = ex_data?.muscleGroup || ex.muscleGroup || 'Other';
            muscleHits[muscle] = (muscleHits[muscle] || 0) + 1;
          });
        }
      });
    });
  });

  // Top PRs by max weight
  const topPRs = Object.entries(prByExercise)
    .filter(([, v]) => v.maxWeight > 0)
    .sort(([, a], [, b]) => b.maxWeight - a.maxWeight)
    .slice(0, 6);

  // Muscle balance
  const muscleEntries = Object.entries(muscleHits).sort(([,a],[,b]) => b - a);
  const maxMuscleHits = Math.max(...muscleEntries.map(([,v]) => v), 1);

  // Last 8 weeks frequency
  const now = new Date();
  const last8Weeks = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (7 * (7 - i)));
    const week = `${d.getFullYear()}-W${String(Math.ceil((d.getDate() + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7)).padStart(2,'0')}`;
    return { week, count: weeklyData[week] || 0, label: `W${8 - i}` };
  });
  const maxWeekCount = Math.max(...last8Weeks.map(w => w.count), 1);

  // Total stats
  const totalSessions  = history.length;
  const totalVolume    = history.reduce((s, h) => s + (h.total_volume || 0), 0);
  const avgDuration    = totalSessions > 0
    ? Math.round(history.reduce((s, h) => s + (h.duration_minutes || 0), 0) / totalSessions) : 0;
  const longestSession = Math.max(...history.map(h => h.duration_minutes || 0), 0);
  const weeksActive    = Object.keys(weeklyData).length;

  if (totalSessions === 0) return (
    <div style={{ textAlign: 'center', padding: '64px 24px',
      background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
      <TrendingUp size={48} color="var(--green)" strokeWidth={1.3} style={{ marginBottom: 16 }} />
      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{t('training.no_insights_yet')}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{t('training.no_insights_sub')}</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Overview Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {[
          { icon: <Trophy size={16} color="var(--yellow)" />,    label: t('training.total_sessions'),  value: totalSessions,                bg: 'rgba(234,179,8,0.08)',   border: 'rgba(234,179,8,0.2)' },
          { icon: <Clock size={16} color="var(--blue)" />,       label: t('training.avg_duration'),    value: `${avgDuration} min`,          bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.2)' },
          { icon: <Layers size={16} color="var(--green)" />,     label: t('training.total_volume'),    value: `${(totalVolume/1000).toFixed(1)}t`, bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)' },
          { icon: <Calendar size={16} color="var(--purple)" />,  label: t('training.weeks_active'),    value: weeksActive,                   bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.2)' },
        ].map(s => (
          <div key={s.label} style={{
            background: s.bg, border: `1px solid ${s.border}`,
            borderRadius: 'var(--radius)', padding: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              {s.icon}
              <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600 }}>
                {s.label}
              </span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Weekly Frequency ── */}
      {totalSessions > 1 && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '20px 20px 16px',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={14} color="var(--green)" />
            {t('training.weekly_frequency')}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 72 }}>
            {last8Weeks.map((w, i) => {
              const pct = maxWeekCount > 0 ? w.count / maxWeekCount : 0;
              const isRecent = i >= 6;
              return (
                <div key={w.week} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 9, color: w.count > 0 ? 'var(--text-muted)' : 'transparent' }}>{w.count}</div>
                  <div style={{
                    width: '100%', borderRadius: 4,
                    background: w.count === 0 ? 'var(--bg-card-2)' : isRecent ? 'var(--green)' : 'rgba(34,197,94,0.35)',
                    height: `${Math.max(pct * 50, w.count > 0 ? 6 : 4)}px`,
                    transition: 'height 0.4s ease',
                    boxShadow: isRecent && w.count > 0 ? '0 0 8px rgba(34,197,94,0.3)' : 'none',
                  }} />
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{w.label}</div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
            {t('training.last_8_weeks')}
          </div>
        </div>
      )}

      {/* ── Personal Records ── */}
      {topPRs.length > 0 && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '20px',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={14} color="var(--yellow)" />
            {t('training.personal_records')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {topPRs.map(([exId, pr], idx) => (
              <div key={exId} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 10,
                background: idx === 0 ? 'rgba(234,179,8,0.06)' : 'var(--bg-card-2)',
                border: `1px solid ${idx === 0 ? 'rgba(234,179,8,0.2)' : 'var(--border)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: idx === 0 ? 'rgba(234,179,8,0.12)' : 'var(--bg-card)',
                    border: `1px solid ${idx === 0 ? 'rgba(234,179,8,0.25)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: idx === 0 ? 'var(--yellow)' : 'var(--text-muted)',
                  }}>
                    {idx === 0 ? '🥇' : idx + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{pr.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                      {pr.count} {t('training.sets_done')}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: idx === 0 ? 'var(--yellow)' : 'var(--text)' }}>
                    {pr.maxWeight} kg
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t('training.max_weight')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Muscle Balance ── */}
      {muscleEntries.length > 0 && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '20px',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={14} color="var(--blue)" />
            {t('training.muscle_balance')}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
            {t('training.muscle_balance_sub')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {muscleEntries.slice(0, 6).map(([muscle, count]) => {
              const pct = count / maxMuscleHits;
              const colors = {
                Brust: 'var(--red)', Rücken: 'var(--blue)', Schultern: 'var(--purple)',
                Beine: 'var(--orange)', Bizeps: 'var(--green)', Trizeps: '#06b6d4',
                Core: 'var(--yellow)', Chest: 'var(--red)', Back: 'var(--blue)',
                Shoulders: 'var(--purple)', Legs: 'var(--orange)', Biceps: 'var(--green)',
              };
              const color = colors[muscle] || 'var(--text-muted)';
              return (
                <div key={muscle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{muscle}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{count}×</span>
                  </div>
                  <div style={{ height: 5, background: 'var(--bg-card-2)', borderRadius: 3 }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      background: color,
                      width: `${pct * 100}%`,
                      transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                      opacity: 0.8,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
          {muscleEntries.length > 0 && (() => {
            const trained   = new Set(muscleEntries.map(([m]) => m));
            const allMuscles = ['Brust','Rücken','Schultern','Beine','Bizeps','Trizeps','Core'];
            const neglected  = allMuscles.filter(m => !trained.has(m));
            return neglected.length > 0 ? (
              <div style={{
                marginTop: 14, padding: '10px 12px', borderRadius: 9,
                background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.15)',
                display: 'flex', alignItems: 'flex-start', gap: 8,
              }}>
                <AlertCircle size={13} color="var(--yellow)" style={{ marginTop: 1, flexShrink: 0 }} />
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text)' }}>{t('training.neglected')}: </strong>
                  {neglected.join(', ')}
                </div>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* ── Longest Session ── */}
      {longestSession > 0 && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Timer size={16} color="var(--purple)" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{t('training.longest_session')}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{t('training.personal_best')}</div>
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--purple)' }}>{longestSession} min</div>
        </div>
      )}

    </div>
  );
}


// ── HISTORY VIEW ───────────────────────────────────────────────────────────
function HistoryView({ history }) {
  const { t } = useI18n();
  // Volumen Chart — letzte 10 Workouts
  const chartData = history.slice(0, 10).reverse();
  const maxVolume = Math.max(...chartData.map(h => h.total_volume || 0), 1);

  if (history.length === 0) return (
    <div style={{
      textAlign: 'center', padding: '72px 24px',
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
    }}>
      <div style={{ marginBottom: 16 }}><Dumbbell size={48} color="var(--green)" strokeWidth={1.3} /></div>
      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{t('training.no_history')}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{t('training.no_history_sub')}</p>
    </div>
  );

  // Stats
  const totalWorkouts = history.length;
  const totalVolume = history.reduce((s, h) => s + (h.total_volume || 0), 0);
  const avgDuration = Math.round(history.reduce((s, h) => s + (h.duration_minutes || 0), 0) / totalWorkouts);
  const bestVolume = Math.max(...history.map(h => h.total_volume || 0));

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: t('training.total_sessions'), value: totalWorkouts, color: 'var(--green)' },
          { label: t('training.total_volume'), value: `${totalVolume.toLocaleString()}kg`, color: 'var(--blue)' },
          { label: t('training.avg_duration'), value: `${avgDuration} min`, color: 'var(--purple)' },
          { label: t('training.best_volume'), value: `${bestVolume.toLocaleString()}kg`, color: 'var(--orange)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Volumen Chart */}
      {chartData.length > 1 && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 24,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--text)' }}>
            {t('training.volume_trend')} ({chartData.length})
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 100 }}>
            {chartData.map((h, i) => {
              const pct = maxVolume > 0 ? (h.total_volume || 0) / maxVolume : 0;
              const isLast = i === chartData.length - 1;
              return (
                <div key={h.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                    {h.total_volume > 0 ? `${h.total_volume}` : ''}
                  </div>
                  <div style={{
                    width: '100%', borderRadius: 5,
                    background: isLast ? 'var(--green)' : 'rgba(34,197,94,0.3)',
                    height: `${Math.max(pct * 80, 4)}px`,
                    transition: 'height 0.4s ease',
                    boxShadow: isLast ? '0 0 10px rgba(34,197,94,0.3)' : 'none',
                  }} />
                  <div style={{ fontSize: 9, color: isLast ? 'var(--green)' : 'var(--text-muted)', fontWeight: isLast ? 700 : 400, whiteSpace: 'nowrap' }}>
                    {new Date(h.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {history.map((h, i) => (
          <div key={h.id} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '16px 20px',
            transition: 'var(--transition)',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: i === 0 ? 'var(--green-glow)' : 'var(--bg-card-2)',
                border: `1px solid ${i === 0 ? 'var(--border-active)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {i === 0 ? <Trophy size={15} color="var(--yellow)" /> : <Dumbbell size={15} color="var(--text-muted)" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {h.plan_name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                  {h.day_name} · {formatDate(h.date || h.created_at)}
                </div>
              </div>
              {i === 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700, color: 'var(--green)',
                  background: 'var(--green-glow)', border: '1px solid var(--border-active)',
                  padding: '2px 8px', borderRadius: 6, whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {t('training.latest')}
                </span>
              )}
            </div>
            <div style={{
              display: 'flex', gap: 16, marginTop: 12, paddingTop: 12,
              borderTop: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Clock size={12} color="var(--text-muted)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>
                  {h.duration_minutes || '—'} min
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Layers size={12} color="var(--text-muted)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)' }}>
                  {h.total_volume ? `${h.total_volume.toLocaleString()}kg` : '—'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
