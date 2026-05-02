import { useState, useEffect, useRef } from 'react';
import {
  Plus, Trash2, Play, ChevronRight, ChevronLeft,
  Check, Clock, Dumbbell, BarChart2, Edit2, X,
  Search, Trophy, Zap, ArrowLeft, Timer, ClipboardList
} from 'lucide-react';
import { supabase } from '../supabase';
import { exercises } from '../data/exercises';

const muscleColors = {
  Brust: '#ef4444', Rücken: '#3b82f6', Schultern: '#a855f7',
  Beine: '#f97316', Bizeps: '#22c55e', Trizeps: '#06b6d4', Core: '#eab308',
};

// ─── Hilfsfunktionen ──────────────────────────────────────────────────────────
function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

// ─── PauseTimer Komponente ────────────────────────────────────────────────────
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
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: 'var(--bg-card)', border: '1px solid var(--border-active)',
      borderRadius: 'var(--radius-xl)', padding: '16px 28px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      boxShadow: 'var(--shadow-green)', zIndex: 300, minWidth: 220,
    }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
        Pause
      </div>
      <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--green)', letterSpacing: '-1.5px' }}>
        {formatDuration(remaining)}
      </div>
      <div style={{ width: '100%', height: 4, background: 'var(--bg-card-2)', borderRadius: 100 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--green)', borderRadius: 100, transition: 'width 1s linear' }} />
      </div>
      <button className="btn btn-ghost btn-sm" onClick={onDone} style={{ fontSize: 12 }}>
        Überspringen
      </button>
    </div>
  );
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────────
export default function WorkoutTracker({ user, profile }) {
  const [view, setView]         = useState('plans'); // plans | create | workout | history
  const [plans, setPlans]       = useState([]);
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editPlan, setEditPlan] = useState(null);
  const [activePlan, setActivePlan] = useState(null);
  const [activeDay, setActiveDay]   = useState(0);

  useEffect(() => {
    if (user) { loadPlans(); loadHistory(); }
  }, [user]);

  const loadPlans = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setPlans(data || []);
    setLoading(false);
  };

  const loadHistory = async () => {
    const { data } = await supabase
      .from('workout_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);
    setHistory(data || []);
  };

  const deletePlan = async (id) => {
    if (!confirm('Trainingsplan löschen?')) return;
    await supabase.from('workout_plans').delete().eq('id', id);
    setPlans(p => p.filter(x => x.id !== id));
  };

  const startWorkout = (plan) => {
    setActivePlan(plan);
    setActiveDay(0);
    setView('workout');
  };

  const openEdit = (plan = null) => {
    setEditPlan(plan ? {
      id: plan.id,
      name: plan.name,
      description: plan.description || '',
      days: plan.plan_data?.days || [],
    } : { name: '', description: '', days: [] });
    setView('create');
  };

  return (
    <div className="page">
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 72px' }}>

        {/* Header */}
        {view !== 'workout' && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1px', marginBottom: 6 }}>
                  Training
                </h1>
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

            {/* Tabs */}
            {view !== 'create' && (
              <div style={{ display: 'flex', gap: 4, marginTop: 24, background: 'var(--bg-card-2)', padding: 4, borderRadius: 12, width: 'fit-content' }}>
                {[
                  { id: 'plans', label: 'Meine Pläne', icon: <ClipboardList size={14}/> },
                  { id: 'history', label: 'History', icon: <BarChart2 size={14}/> },
                ].map(tab => (
                  <button key={tab.id}
                    onClick={() => setView(tab.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      padding: '8px 18px', borderRadius: 9,
                      fontSize: 13.5, fontWeight: 600,
                      background: view === tab.id ? 'var(--green-glow)' : 'transparent',
                      border: view === tab.id ? '1px solid var(--border-active)' : '1px solid transparent',
                      color: view === tab.id ? 'var(--green)' : 'var(--text-secondary)',
                      cursor: 'pointer', transition: 'var(--transition)',
                    }}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Views */}
        {view === 'plans'   && <PlansView plans={plans} loading={loading} onEdit={openEdit} onDelete={deletePlan} onStart={startWorkout} onNew={() => openEdit()} />}
        {view === 'create'  && <CreateView editPlan={editPlan} user={user} onSaved={() => { loadPlans(); setView('plans'); setEditPlan(null); }} />}
        {view === 'workout' && <WorkoutView plan={activePlan} dayIndex={activeDay} user={user} onDone={() => { loadHistory(); setView('history'); }} onBack={() => setView('plans')} />}
        {view === 'history' && <HistoryView history={history} />}
      </div>
    </div>
  );
}

// ─── PLANS VIEW ───────────────────────────────────────────────────────────────
function PlansView({ plans, loading, onEdit, onDelete, onStart, onNew }) {
  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 14 }}>Lädt...</div>
    </div>
  );

  if (plans.length === 0) return (
    <div style={{
      textAlign: 'center', padding: '72px 24px',
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
    }}>
      <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--green-glow)', border: '1px solid var(--border-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
  <ClipboardList size={28} color="var(--green)" />
</div>
      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Noch kein Trainingsplan</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
        Erstelle deinen ersten Plan und starte durch!
      </p>
      <button className="btn btn-primary" onClick={onNew}>
        <Plus size={15} /> Ersten Plan erstellen
      </button>
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
      {plans.map(plan => {
        const days = plan.plan_data?.days || [];
        const totalExercises = days.reduce((s, d) => s + (d.exercises?.length || 0), 0);
        return (
          <div key={plan.id} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: 24,
            transition: 'var(--transition)', position: 'relative', overflow: 'hidden',
          }}>
            {/* Top accent */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--green), transparent)' }} />

            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.3px' }}>
                {plan.name}
              </h3>
              {plan.description && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {plan.description}
                </p>
              )}
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
                <Clock size={13} /> {days.length} Tag{days.length !== 1 ? 'e' : ''}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
                <Dumbbell size={13} /> {totalExercises} Übung{totalExercises !== 1 ? 'en' : ''}
              </div>
            </div>

            {/* Days preview */}
            {days.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                {days.map((day, i) => (
                  <span key={i} style={{
                    fontSize: 11, padding: '3px 9px', borderRadius: 100,
                    background: 'var(--bg-card-2)', color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                  }}>
                    {day.name}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
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
  );
}

// ─── CREATE VIEW ──────────────────────────────────────────────────────────────
function CreateView({ editPlan, user, onSaved }) {
  const [name, setName]               = useState(editPlan?.name || '');
  const [desc, setDesc]               = useState(editPlan?.description || '');
  const [days, setDays]               = useState(editPlan?.days || []);
  const [saving, setSaving]           = useState(false);
  const [activeDay, setActiveDay]     = useState(null);
  const [exSearch, setExSearch]       = useState('');
  const [filterMuscle, setFilterMuscle] = useState('Alle');

  const muscleGroups = ['Alle', 'Brust', 'Rücken', 'Schultern', 'Beine', 'Bizeps', 'Trizeps', 'Core'];

  const addDay = () => {
    const newDay = { id: Date.now().toString(), name: `Tag ${days.length + 1}`, exercises: [] };
    setDays(d => [...d, newDay]);
    setActiveDay(newDay.id);
  };

  const updateDayName = (id, name) => setDays(d => d.map(x => x.id === id ? { ...x, name } : x));
  const removeDay = (id) => { setDays(d => d.filter(x => x.id !== id)); if (activeDay === id) setActiveDay(null); };

  const addExerciseToDay = (dayId, exercise) => {
    setDays(d => d.map(x => x.id === dayId ? {
      ...x,
      exercises: [...(x.exercises || []), { exerciseId: exercise.id, sets: 3, reps: 10, weight: 0 }]
    } : x));
  };

  const removeExerciseFromDay = (dayId, index) => {
    setDays(d => d.map(x => x.id === dayId ? {
      ...x, exercises: x.exercises.filter((_, i) => i !== index)
    } : x));
  };

  const updateExercise = (dayId, index, field, value) => {
    setDays(d => d.map(x => x.id === dayId ? {
      ...x,
      exercises: x.exercises.map((e, i) => i === index ? { ...e, [field]: Number(value) } : e)
    } : x));
  };

  const savePlan = async () => {
    if (!name.trim()) { alert('Bitte gib einen Namen ein.'); return; }
    setSaving(true);
    const payload = {
      user_id: user.id,
      name: name.trim(),
      description: desc.trim(),
      plan_data: { days },
    };
    if (editPlan?.id) {
      await supabase.from('workout_plans').update(payload).eq('id', editPlan.id);
    } else {
      await supabase.from('workout_plans').insert(payload);
    }
    setSaving(false);
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Plan Name *
            </label>
            <input className="form-input" placeholder="z.B. Push / Pull / Legs" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Beschreibung
            </label>
            <input className="form-input" placeholder="Kurze Beschreibung deines Plans..." value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Tage */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>

        {/* Tag Liste */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: 12 }}>
            Trainingstage
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
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
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{day.exercises?.length || 0}</span>
                <button onClick={e => { e.stopPropagation(); removeDay(day.id); }} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
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
              <Dumbbell size={32} strokeWidth={1.2} style={{ marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14 }}>Wähle einen Tag aus oder füge einen neuen hinzu</p>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
              {/* Tag Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <input
                  className="form-input"
                  value={currentDay.name}
                  onChange={e => updateDayName(currentDay.id, e.target.value)}
                  style={{ flex: 1, fontWeight: 700, fontSize: 15 }}
                />
              </div>

              {/* Übungen im Tag */}
              {currentDay.exercises?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: 10 }}>
                    Übungen
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {currentDay.exercises.map((ex, i) => {
                      const exercise = exercises.find(e => e.id === ex.exerciseId);
                      if (!exercise) return null;
                      return (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 14px', background: 'var(--bg-card-2)',
                          border: '1px solid var(--border)', borderRadius: 10,
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>{exercise.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{exercise.muscleGroup}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            {[
                              { label: 'Sets', field: 'sets', min: 1, max: 10 },
                              { label: 'Reps', field: 'reps', min: 1, max: 50 },
                              { label: 'kg', field: 'weight', min: 0, max: 500 },
                            ].map(({ label, field, min, max }) => (
                              <div key={field} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
                                <input
                                  type="number" min={min} max={max}
                                  value={ex[field]}
                                  onChange={e => updateExercise(currentDay.id, i, field, e.target.value)}
                                  style={{
                                    width: 52, padding: '5px 7px', borderRadius: 7,
                                    background: 'var(--bg)', border: '1px solid var(--border)',
                                    color: 'var(--text)', fontSize: 13, fontWeight: 700,
                                    textAlign: 'center', outline: 'none',
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          <button onClick={() => removeExerciseFromDay(currentDay.id, i)}
                            style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Übungen suchen */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: 10 }}>
                  Übung hinzufügen
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                  <div className="search-bar" style={{ flex: 1, padding: '8px 12px', margin: 0 }}>
                    <Search size={14} style={{ color: 'var(--text-muted)' }} />
                    <input
                      placeholder="Übung suchen..."
                      value={exSearch}
                      onChange={e => setExSearch(e.target.value)}
                      style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13, flex: 1 }}
                    />
                  </div>
                  <select
                    value={filterMuscle}
                    onChange={e => setFilterMuscle(e.target.value)}
                    className="form-input"
                    style={{ width: 'auto', padding: '8px 12px' }}
                  >
                    {muscleGroups.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div style={{
                  maxHeight: 240, overflowY: 'auto',
                  background: 'var(--bg-card-2)', border: '1px solid var(--border)',
                  borderRadius: 10,
                }}>
                  {filteredExercises.slice(0, 30).map(ex => (
                    <div key={ex.id}
                      onClick={() => addExerciseToDay(currentDay.id, ex)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px', cursor: 'pointer',
                        borderBottom: '1px solid var(--border)',
                        transition: 'var(--transition)',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: muscleColors[ex.muscleGroup] || 'var(--green)', flexShrink: 0
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{ex.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ex.muscleGroup} · {ex.difficulty}</div>
                      </div>
                      <Plus size={14} style={{ color: 'var(--green)', flexShrink: 0 }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, gap: 10 }}>
        <button className="btn btn-primary" onClick={savePlan} disabled={saving} style={{ minWidth: 140, justifyContent: 'center' }}>
          {saving ? 'Wird gespeichert...' : <><Check size={15} /> Plan speichern</>}
        </button>
      </div>
    </div>
  );
}

// ─── WORKOUT VIEW ─────────────────────────────────────────────────────────────
function WorkoutView({ plan, dayIndex, user, onDone, onBack }) {
  const days = plan?.plan_data?.days || [];
  const [currentDayIndex, setCurrentDayIndex] = useState(dayIndex);
  const [setsDone, setSetsDone]               = useState({});
  const [setValues, setSetValues]             = useState({});
  const [pauseTimer, setPauseTimer]           = useState(null);
  const [pauseDuration, setPauseDuration]     = useState(60);
  const [startTime]                           = useState(Date.now());
  const [elapsed, setElapsed]                 = useState(0);
  const [showSummary, setShowSummary]         = useState(false);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const currentDay = days[currentDayIndex];

  const getSetValue = (exIndex, setIndex, field) => {
    return setValues[`${exIndex}-${setIndex}-${field}`] ?? '';
  };

  const updateSetValue = (exIndex, setIndex, field, value) => {
    setSetValues(v => ({ ...v, [`${exIndex}-${setIndex}-${field}`]: value }));
  };

  const toggleSet = (exIndex, setIndex) => {
    const key = `${exIndex}-${setIndex}`;
    const wasCompleted = setsDone[key];
    setSetsDone(s => ({ ...s, [key]: !s[key] }));
    if (!wasCompleted) setPauseTimer(Date.now());
  };

  const totalSets = currentDay?.exercises?.reduce((s, e) => s + (e.sets || 0), 0) || 0;
  const completedSets = Object.values(setsDone).filter(Boolean).length;

  const finishWorkout = async () => {
    const durationMin = Math.ceil(elapsed / 60);
    let totalVolume = 0;

    currentDay?.exercises?.forEach((ex, exIndex) => {
      for (let s = 0; s < ex.sets; s++) {
        const key = `${exIndex}-${s}`;
        if (setsDone[key]) {
          const reps = Number(getSetValue(exIndex, s, 'reps')) || ex.reps;
          const weight = Number(getSetValue(exIndex, s, 'weight')) || ex.weight;
          totalVolume += reps * weight;
        }
      }
    });

    await supabase.from('workout_history').insert({
      user_id: user.id,
      plan_id: plan.id,
      plan_name: plan.name,
      day_name: currentDay.name,
      duration_minutes: durationMin,
      total_volume: totalVolume,
      exercises_done: { sets: setsDone, values: setValues },
    });

    setShowSummary(true);
  };

  if (showSummary) {
    const durationMin = Math.ceil(elapsed / 60);
    let totalVolume = 0;
    currentDay?.exercises?.forEach((ex, exIndex) => {
      for (let s = 0; s < ex.sets; s++) {
        if (setsDone[`${exIndex}-${s}`]) {
          totalVolume += (Number(getSetValue(exIndex, s, 'reps')) || ex.reps) * (Number(getSetValue(exIndex, s, 'weight')) || ex.weight);
        }
      }
    });

    return (
      <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', padding: '48px 0' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🏆</div>
        <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.8px', marginBottom: 8 }}>Workout abgeschlossen!</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>{currentDay.name} · {plan.name}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
          {[
            { label: 'Dauer', value: `${durationMin} min`, icon: <Clock size={20}/> },
            { label: 'Sets', value: `${completedSets}/${totalSets}`, icon: <Check size={20}/> },
            { label: 'Volumen', value: `${totalVolume} kg`, icon: <Trophy size={20}/> },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-active)',
              borderRadius: 'var(--radius-lg)', padding: 20, display: 'flex',
              flexDirection: 'column', alignItems: 'center', gap: 8,
            }}>
              <div style={{ color: 'var(--green)' }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <button className="btn btn-primary" onClick={onDone} style={{ justifyContent: 'center', minWidth: 180 }}>
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
        marginBottom: 24, padding: '16px 20px',
        background: 'var(--bg-card)', border: '1px solid var(--border-active)',
        borderRadius: 'var(--radius-lg)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Dauer</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: completedSets === totalSets && totalSets > 0 ? 'var(--green)' : 'var(--text)' }}>
              {completedSets}/{totalSets}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Sets</div>
          </div>
        </div>
      </div>

      {/* Tag Auswahl */}
      {days.length > 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {days.map((day, i) => (
            <button key={i}
              onClick={() => setCurrentDayIndex(i)}
              style={{
                padding: '6px 14px', borderRadius: 100, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                background: currentDayIndex === i ? 'var(--green-glow)' : 'var(--bg-card)',
                border: currentDayIndex === i ? '1px solid var(--border-active)' : '1px solid var(--border)',
                color: currentDayIndex === i ? 'var(--green)' : 'var(--text-secondary)',
                transition: 'var(--transition)',
              }}
            >
              {day.name}
            </button>
          ))}
        </div>
      )}

      {/* Pause Timer Konfiguration */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <Timer size={14} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 }}>Pausenzeit:</span>
        {[30, 60, 90, 120].map(s => (
          <button key={s}
            onClick={() => setPauseDuration(s)}
            style={{
              padding: '4px 10px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: pauseDuration === s ? 'var(--green-glow)' : 'transparent',
              border: pauseDuration === s ? '1px solid var(--border-active)' : '1px solid var(--border)',
              color: pauseDuration === s ? 'var(--green)' : 'var(--text-secondary)',
            }}
          >
            {s}s
          </button>
        ))}
      </div>

      {/* Übungen */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        {currentDay?.exercises?.map((ex, exIndex) => {
          const exercise = exercises.find(e => e.id === ex.exerciseId);
          if (!exercise) return null;
          const allDone = Array.from({ length: ex.sets }, (_, i) => setsDone[`${exIndex}-${i}`]).every(Boolean);

          return (
            <div key={exIndex} style={{
              background: 'var(--bg-card)', border: `1px solid ${allDone ? 'var(--border-active)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-lg)', overflow: 'hidden',
              transition: 'var(--transition)',
            }}>
              {/* Übung Header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 18px',
                background: allDone ? 'var(--green-glow)' : 'transparent',
              }}>
                {exercise.image && (
                  <img src={exercise.image} alt={exercise.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{exercise.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {ex.sets} Sets · {ex.reps} Reps · {ex.weight > 0 ? `${ex.weight} kg` : 'Körpergewicht'}
                  </div>
                </div>
                {allDone && <Check size={18} color="var(--green)" />}
              </div>

              {/* Sets */}
              <div style={{ padding: '0 18px 16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr 48px', gap: 8, marginBottom: 8, padding: '0 4px' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>SET</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>KG</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>REPS</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>✓</span>
                </div>
                {Array.from({ length: ex.sets }, (_, setIndex) => {
                  const key = `${exIndex}-${setIndex}`;
                  const done = setsDone[key];
                  return (
                    <div key={setIndex} style={{
                      display: 'grid', gridTemplateColumns: '32px 1fr 1fr 48px',
                      gap: 8, marginBottom: 6, alignItems: 'center',
                      padding: '6px 4px', borderRadius: 8,
                      background: done ? 'rgba(34,197,94,0.06)' : 'transparent',
                      transition: 'var(--transition)',
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: done ? 'var(--green)' : 'var(--text-muted)' }}>
                        {setIndex + 1}
                      </span>
                      <input
                        type="number"
                        placeholder={String(ex.weight || 0)}
                        value={getSetValue(exIndex, setIndex, 'weight')}
                        onChange={e => updateSetValue(exIndex, setIndex, 'weight', e.target.value)}
                        disabled={done}
                        style={{
                          padding: '7px 10px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                          background: done ? 'rgba(34,197,94,0.08)' : 'var(--bg-card-2)',
                          border: `1px solid ${done ? 'var(--border-active)' : 'var(--border)'}`,
                          color: 'var(--text)', outline: 'none', textAlign: 'center',
                        }}
                      />
                      <input
                        type="number"
                        placeholder={String(ex.reps)}
                        value={getSetValue(exIndex, setIndex, 'reps')}
                        onChange={e => updateSetValue(exIndex, setIndex, 'reps', e.target.value)}
                        disabled={done}
                        style={{
                          padding: '7px 10px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                          background: done ? 'rgba(34,197,94,0.08)' : 'var(--bg-card-2)',
                          border: `1px solid ${done ? 'var(--border-active)' : 'var(--border)'}`,
                          color: 'var(--text)', outline: 'none', textAlign: 'center',
                        }}
                      />
                      <button
                        onClick={() => toggleSet(exIndex, setIndex)}
                        style={{
                          width: 36, height: 36, borderRadius: 9, display: 'flex',
                          alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                          background: done ? 'var(--green)' : 'var(--bg-card-2)',
                          border: `1px solid ${done ? 'var(--green)' : 'var(--border)'}`,
                          transition: 'var(--transition)',
                        }}
                      >
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

      {/* Workout beenden */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button className="btn btn-primary" onClick={finishWorkout} style={{ justifyContent: 'center', minWidth: 200, padding: '13px 28px', fontSize: 15 }}>
          <Trophy size={16} /> Workout beenden
        </button>
      </div>

      {/* Pause Timer */}
      {pauseTimer && (
        <PauseTimer
          key={pauseTimer}
          duration={pauseDuration}
          onDone={() => setPauseTimer(null)}
        />
      )}
    </div>
  );
}

// ─── HISTORY VIEW ─────────────────────────────────────────────────────────────
function HistoryView({ history }) {
  if (history.length === 0) return (
    <div style={{
      textAlign: 'center', padding: '72px 24px',
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🏋️</div>
      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Noch kein Workout abgeschlossen</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
        Starte deinen ersten Trainingsplan und schreibe Geschichte!
      </p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {history.map(h => (
        <div key={h.id} style={{
          display: 'flex', alignItems: 'center', gap: 20,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '18px 22px',
          transition: 'var(--transition)',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: 'var(--green-glow)', border: '1px solid var(--border-active)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Trophy size={20} color="var(--green)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>
              {h.plan_name} – {h.day_name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {formatDate(h.date)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--green)' }}>{h.duration_minutes} min</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Dauer</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--green)' }}>{h.total_volume} kg</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Volumen</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}