import { useState, useMemo, useEffect, useCallback } from 'react';
import { useI18n } from '../i18n.jsx';
import {
  Search, X, Dumbbell, Target, Zap, Package, ZoomIn, Heart, ChevronDown, ChevronUp, TrendingUp, Flame
} from 'lucide-react';
import { supabase } from '../supabase';
import { exercises, muscleGroups, difficulties, equipmentTypes } from '../data/exercises';

const muscleColors = {
  Brust: 'var(--red)', Rücken: 'var(--blue)', Schultern: 'var(--purple)',
  Beine: 'var(--orange)', Bizeps: '#22c55e', Trizeps: '#06b6d4', Core: 'var(--yellow)',
};

// Sets/Reps Empfehlungen nach Ziel
const setsRepsMap = {
  Muskelaufbau:        { sets: '3–4', reps: '8–12',  rest: '60–90s',  note: 'Hypertrophie-Bereich',   progress: 'Gewicht +2.5kg wenn alle Sätze vollständig' },
  'Gewicht verlieren': { sets: '3',   reps: '15–20', rest: '30–45s',  note: 'Hohes Volumen, kurze Pause', progress: 'Reps erhöhen, dann Gewicht steigern' },
  Kraft:               { sets: '4–5', reps: '3–6',   rest: '3–5 min', note: 'Maximalkraft',            progress: 'Gewicht +5kg nach 2 erfolgreichen Sessions' },
  Ausdauer:            { sets: '2–3', reps: '20–25', rest: '20–30s',  note: 'Ausdauer & Kondition',   progress: 'Sätze erhöhen, dann Pause verkürzen' },
  Standard:            { sets: '3',   reps: '10–15', rest: '60s',     note: 'Allgemeine Fitness',      progress: 'Alle 2 Wochen Gewicht oder Reps erhöhen' },
};

function DifficultyBadge({ level }) {
  const cls = { Leicht: 'badge-leicht', Mittel: 'badge-mittel', Schwer: 'badge-schwer' };
  const { t } = useI18n();
  const labels = { Leicht: t('exercises.diff_easy'), Mittel: t('exercises.diff_medium'), Schwer: t('exercises.diff_hard') };
  return <span className={`badge ${cls[level] || 'badge-gray'}`}>{labels[level] || level}</span>;
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ src, alt, onClose }) {
  if (!src) return null;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      width: '100vw', height: '100vh', zIndex: 9999,
      background: 'rgba(0,0,0,0.97)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', animation: 'fadeIn 0.15s ease', cursor: 'zoom-out',
      boxSizing: 'border-box',
    }}>
      <button onClick={onClose} style={{
        position: 'absolute', top: 16, right: 16,
        width: 44, height: 44, borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10000,
      }}>
        <X size={20} />
      </button>
      <img src={src} alt={alt} onClick={e => e.stopPropagation()} style={{
        maxWidth: '95vw', maxHeight: '92vh', objectFit: 'contain',
        borderRadius: '10px', boxShadow: '0 40px 100px rgba(0,0,0,0.9)', cursor: 'default',
      }} />
    </div>
  );
}

// ─── Exercise Modal ────────────────────────────────────────────────────────────
function ExerciseModal({ exercise, onClose, isFavorite, onToggleFavorite, userGoal, t }) {
  const [lightboxSrc, setLightboxSrc] = useState(null);
  if (!exercise) return null;
  const color = muscleColors[exercise.muscleGroup] || '#22c55e';

  // Sets/Reps basierend auf User-Ziel
  const goalKey = userGoal === 'Gewicht verlieren' ? 'Gewicht verlieren'
    : userGoal === 'Muskelaufbau' ? 'Muskelaufbau'
    : 'Standard';
  const rec = setsRepsMap[goalKey] || setsRepsMap.Standard;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>

          {/* Header */}
          <div className="modal-header">
            <div className="modal-header-inner">
              {exercise.image && (
                <img src={exercise.image} alt={exercise.name} className="modal-thumbnail"
                  style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 10 }} />
              )}
              <div style={{ minWidth: 0 }}>
                <div className="tag-row" style={{ marginBottom: 8 }}>
                  <DifficultyBadge level={exercise.difficulty} />
                  <span className="badge badge-gray">{exercise.muscleGroup}</span>
                  <span className="badge badge-gray">{exercise.category}</span>
                </div>
                <h2 className="modal-title">{exercise.name}</h2>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Favoriten Button */}
              <button
                onClick={() => onToggleFavorite(exercise.id)}
                title={isFavorite ? 'Aus Favoriten entfernen' : t('exercises.add_to_fav')}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: isFavorite ? 'rgba(239,68,68,0.15)' : 'var(--bg-card-2)',
                  border: `1px solid ${isFavorite ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0,
                }}
              >
                <Heart size={16} color={isFavorite ? 'var(--red)' : 'var(--text-muted)'} fill={isFavorite ? 'var(--red)' : 'none'} />
              </button>
              <button className="modal-close" onClick={onClose}><X size={18} /></button>
            </div>
          </div>

          {/* Body */}
          <div className="modal-body">

            {/* Hauptbild */}
            {exercise.image && (
              <div onClick={() => setLightboxSrc(exercise.image)} style={{
                position: 'relative', marginBottom: 12, cursor: 'zoom-in',
                borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)',
                aspectRatio: '4 / 3', background: '#0a0a0a',
              }}>
                <img src={exercise.image} alt={exercise.name} style={{
                  width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', display: 'block',
                }} />
                <div style={{
                  position: 'absolute', bottom: 8, right: 8,
                  background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7,
                  padding: '4px 9px', display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 11, color: 'rgba(255,255,255,0.7)', pointerEvents: 'none',
                }}>
                  <ZoomIn size={11} /> Vollbild
                </div>
              </div>
            )}

            {/* Ausführungsbild */}
            {exercise.imageDetail && exercise.imageDetail !== exercise.image && (
              <div style={{ marginBottom: 22 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '1.1px', color: 'var(--text-muted)', marginBottom: 8,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
                  Ausführung
                </div>
                <div onClick={() => setLightboxSrc(exercise.imageDetail)} style={{
                  position: 'relative', cursor: 'zoom-in', borderRadius: 12, overflow: 'hidden',
                  border: '1px solid var(--border)', aspectRatio: '16 / 9', background: '#0a0a0a',
                }}>
                  <img src={exercise.imageDetail} alt={`${exercise.name} Ausführung`} style={{
                    width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', display: 'block',
                  }} />
                  <div style={{
                    position: 'absolute', bottom: 8, right: 8,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7,
                    padding: '4px 9px', display: 'flex', alignItems: 'center', gap: 5,
                    fontSize: 11, color: 'rgba(255,255,255,0.7)', pointerEvents: 'none',
                  }}>
                    <ZoomIn size={11} /> Vollbild
                  </div>
                </div>
              </div>
            )}

            {/* Sets/Reps Empfehlung */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.03))',
              border: '1px solid var(--border-active)', borderRadius: 12,
              padding: '16px 18px', marginBottom: 20,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--green)', marginBottom: 12 }}>
                {t('exercises.recommendation')} — {goalKey}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { label: t('exercises.sets'), value: rec.sets },
                  { label: t('exercises.reps'), value: rec.reps },
                  { label: t('exercises.rest'), value: rec.rest },
                ].map(r => (
                  <div key={r.label} style={{
                    background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '10px',
                    textAlign: 'center', border: '1px solid rgba(34,197,94,0.15)',
                  }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--green)' }}>{r.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{r.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10, fontStyle: 'italic' }}>
                {rec.note}
              </div>
              {rec.progress && (
                <div style={{
                  marginTop: 10, paddingTop: 10,
                  borderTop: '1px solid rgba(34,197,94,0.15)',
                  display: 'flex', alignItems: 'flex-start', gap: 7,
                }}>
                  <TrendingUp size={13} color="var(--green)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{t('exercises.progression')}: </strong>
                    {rec.progress}
                  </span>
                </div>
              )}
            </div>

            {/* Über diese Übung */}
            <div className="modal-section">
              <h4>{t('exercises.about')}</h4>
              <p>{exercise.description}</p>
            </div>
            <div className="modal-divider" />

            {/* Trainierte Muskeln */}
            <div className="modal-section">
              <h4><Target size={12} />{t('exercises.muscles')}</h4>
              <div className="muscle-tags">
                {exercise.targetMuscles.map(m => (
                  <span key={m} className="tag" style={{ borderColor: `${color}40`, color }}>{m}</span>
                ))}
              </div>
            </div>
            <div className="modal-divider" />

            {/* Equipment */}
            <div className="modal-section">
              <h4><Package size={12} />{t('exercises.equipment')}</h4>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{exercise.equipment}</p>
            </div>
            <div className="modal-divider" />

            {/* Ausführung */}
            <div className="modal-section">
              <h4>{t('exercises.execution')}</h4>
              <ol className="step-list">
                {exercise.instructions.map((step, i) => (
                  <li key={i}>
                    <span className="step-num">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="modal-divider" />

            {/* Tipps */}
            <div className="modal-section">
              <h4>Profi-Tipps</h4>
              <ul className="tip-list">
                {exercise.tips.map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            </div>
            <div className="modal-divider" />

            {/* Fehler */}
            <div className="modal-section">
              <h4>{t('exercises.about')}</h4>
              <ul className="tip-list mistake-list">
                {exercise.commonMistakes.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>

            {/* Kalorien */}
            <div className="calorie-info-box">
              <div className="calorie-info-icon"><Flame size={20} color="var(--green)" /></div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Kalorienverbrauch</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  ca. <strong style={{ color: 'var(--green)' }}>{exercise.caloriesPerMin} kcal/min</strong> bei mittlerer Intensität
                </div>
              </div>
            </div>

            {/* Favoriten Button unten */}
            <button
              onClick={() => onToggleFavorite(exercise.id)}
              style={{
                width: '100%', marginTop: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px', borderRadius: 12,
                background: isFavorite ? 'rgba(239,68,68,0.1)' : 'var(--bg-card-2)',
                border: `1px solid ${isFavorite ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
                color: isFavorite ? 'var(--red)' : 'var(--text-muted)',
                cursor: 'pointer', fontSize: 14, fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
            >
              <Heart size={16} fill={isFavorite ? 'var(--red)' : 'none'} />
              {isFavorite ? 'Aus Favoriten entfernen' : t('exercises.add_to_fav')}
            </button>
          </div>
        </div>
      </div>

      <Lightbox src={lightboxSrc} alt={exercise?.name} onClose={() => setLightboxSrc(null)} />
    </>
  );
}

// ─── Exercise Card ─────────────────────────────────────────────────────────────
function ExerciseCard({ exercise, onClick, index, isFavorite, onToggleFavorite }) {
  const color = muscleColors[exercise.muscleGroup] || '#22c55e';
  const [imgError, setImgError] = useState(false);

  return (
    <div className="exercise-card" onClick={() => onClick(exercise)} style={{ animationDelay: `${index * 35}ms`, position: 'relative' }}>

      {/* Favoriten Button auf der Karte */}
      <button
        onClick={e => { e.stopPropagation(); onToggleFavorite(exercise.id); }}
        title={isFavorite ? 'Aus Favoriten entfernen' : 'Favorit'}
        style={{
          position: 'absolute', top: 10, right: 10, zIndex: 10,
          width: 30, height: 30, borderRadius: '50%',
          background: isFavorite ? 'rgba(239,68,68,0.9)' : 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(6px)',
          border: `1px solid ${isFavorite ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.15)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.2s ease',
        }}
      >
        <Heart size={13} color={isFavorite ? '#fff' : 'rgba(255,255,255,0.8)'} fill={isFavorite ? '#fff' : 'none'} />
      </button>

      {/* Bild */}
      <div style={{ aspectRatio: '4 / 3', position: 'relative', overflow: 'hidden', background: '#0a0a0a' }}>
        {exercise.image && !imgError ? (
          <img
            src={exercise.image} alt={exercise.name}
            onError={() => setImgError(true)}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'contain', objectPosition: 'center',
              transition: 'transform 0.45s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(135deg, ${color}18, ${color}06)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Dumbbell size={38} strokeWidth={1.5} color={color} />
          </div>
        )}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '10px 12px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, transparent 30%, rgba(0,0,0,0.75) 100%)',
        }}>
          {/* Nur Compound/Isolation Badge — relevant für Training */}
          {(exercise.category === 'COMPOUND' || exercise.category === 'ISOLATIONSÜBUNG') && (
            <span className="exercise-card-category" style={{ fontSize: 9 }}>
              {exercise.category === 'COMPOUND' ? 'COMPOUND' : 'ISOLATION'}
            </span>
          )}
          <h3 className="exercise-card-name">{exercise.name}</h3>
        </div>
      </div>

      {/* Body */}
      <div className="exercise-card-body">
        <div className="exercise-meta">
          <DifficultyBadge level={exercise.difficulty} />
          <span className="badge" style={{ background: `${color}22`, color }}>{exercise.muscleGroup}</span>
        </div>
        <div className="exercise-muscles">
          <Target size={12} />
          <span>
            {exercise.targetMuscles.slice(0, 2).join(', ')}
            {exercise.targetMuscles.length > 2 && ` +${exercise.targetMuscles.length - 2}`}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="exercise-footer">
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {exercise.equipmentType === 'Körpergewicht' ? 'Kein Equipment' : exercise.equipmentType}
        </span>
        <span style={{ color: 'var(--green)', fontWeight: 600, fontSize: 13 }}>
          {exercise.caloriesPerMin} kcal/min
        </span>
      </div>
    </div>
  );
}

// ─── Filter Panel (Mobile collapsible) ────────────────────────────────────────
function FilterPanel({ filterMuscle, setFilterMuscle, filterDiff, setFilterDiff, filterEquip, setFilterEquip, hasFilters, resetFilters, filteredCount, counts, isMobile, sortBy, setSortBy, t }) {
  const [open, setOpen] = useState(!isMobile);

  return (
    <aside className="filter-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: open ? 18 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="filter-panel-title" style={{ marginBottom: 0 }}>Filter</div>
          {hasFilters && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100,
              background: 'var(--green-glow)', color: 'var(--green)', border: '1px solid var(--border-active)',
            }}>Aktiv</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {hasFilters && (
            <button className="btn btn-ghost btn-sm" onClick={resetFilters} style={{ fontSize: 12 }}>
              Zurücksetzen
            </button>
          )}
          {isMobile && (
            <button onClick={() => setOpen(o => !o)} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', padding: 4,
            }}>
              {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>
      </div>

      {open && (
        <>
          <div className="filter-group">
            <label><Dumbbell size={12} /> Muskelgruppe</label>
            <div className="filter-chips">
              {muscleGroups.map(g => (
                <button key={g} className={`chip ${filterMuscle === g ? 'active' : ''}`} onClick={() => setFilterMuscle(g)}>
                  {g}{g !== 'Alle' && counts[g] ? ` (${counts[g]})` : ''}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label><Zap size={12} /> Schwierigkeitsgrad</label>
            <div className="filter-chips">
              {difficulties.map(d => (
                <button key={d} className={`chip ${filterDiff === d ? 'active' : ''}`} onClick={() => setFilterDiff(d)}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label><Package size={12} /> Equipment</label>
            <div className="filter-chips">
              {equipmentTypes.map(e => (
                <button key={e} className={`chip ${filterEquip === e ? 'active' : ''}`} onClick={() => setFilterEquip(e)}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          {/* P5: Sort */}
          <div className="filter-group">
            <label><TrendingUp size={12} /> Sortierung</label>
            <div className="filter-chips">
              {[
                { value: 'default',    label: t('exercises.sort_default') },
                { value: 'name',       label: t('exercises.sort_az') },
                { value: 'difficulty', label: t('exercises.sort_diff') },
              ].map(s => (
                <button key={s.value} className={`chip ${sortBy === s.value ? 'active' : ''}`}
                  onClick={() => setSortBy(s.value)}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-count">
            {filteredCount !== 1 ? t('exercises.results_plural').replace('{n}', filteredCount) : t('exercises.results').replace('{n}', filteredCount)}
          </div>
        </>
      )}
    </aside>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ExerciseLibrary({ user, profile }) {
  const { t } = useI18n();
  const setsRepsMap = {
    Muskelaufbau:        { sets: '3–4', reps: '8–12',  rest: '60–90s',  note: t('exercises.note_hypertrophy'), prog: t('exercises.prog_add_weight') },
    'Gewicht verlieren': { sets: '3',   reps: '15–20', rest: '30–45s',  note: t('exercises.note_high_volume'), prog: t('exercises.prog_increase_reps') },
    Kraft:               { sets: '4–5', reps: '3–6',   rest: '3–5 min', note: t('exercises.note_max_strength'), prog: t('exercises.prog_add_sets') },
    Ausdauer:            { sets: '2–3', reps: '20–25', rest: '20–30s',  note: t('exercises.note_endurance'),   prog: t('exercises.prog_biweekly') },
    Standard:            { sets: '3',   reps: '10–15', rest: '60s',     note: t('exercises.note_general'),     prog: t('exercises.prog_biweekly') },
  };
  const [search,        setSearch]        = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterMuscle,  setFilterMuscle]  = useState('Alle');
  const [filterDiff,    setFilterDiff]    = useState('Alle');
  const [filterEquip,   setFilterEquip]   = useState('Alle');
  const [sortBy,        setSortBy]        = useState('default'); // default | name | difficulty
  const [selected,      setSelected]      = useState(null);
  const [favorites,     setFavorites]     = useState(new Set());
  const [activeTab,     setActiveTab]     = useState('all'); // 'all' | 'favorites'
  const [isMobile,      setIsMobile]      = useState(window.innerWidth < 768);
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('recently_viewed_exercises') || '[]'); }
    catch { return []; }
  });

  const trackViewed = useCallback((exerciseId) => {
    setRecentlyViewed(prev => {
      const updated = [exerciseId, ...prev.filter(id => id !== exerciseId)].slice(0, 6);
      try { sessionStorage.setItem('recently_viewed_exercises', JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  // Resize listener
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Favoriten laden
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const { data } = await supabase
          .from('favorite_exercises')
          .select('exercise_id')
          .eq('user_id', user.id);
        if (data) setFavorites(new Set(data.map(f => f.exercise_id)));
      } catch (err) {
        console.error('Load favorites error:', err);
      }
    };
    load();
  }, [user]);

  // Favoriten togglen
  const toggleFavorite = useCallback(async (exerciseId) => {
    if (!user) return;
    const isFav = favorites.has(exerciseId);
    // Optimistic UI
    setFavorites(prev => {
      const next = new Set(prev);
      isFav ? next.delete(exerciseId) : next.add(exerciseId);
      return next;
    });
    try {
      if (isFav) {
        await supabase.from('favorite_exercises').delete()
          .eq('user_id', user.id).eq('exercise_id', exerciseId);
      } else {
        await supabase.from('favorite_exercises').upsert({
          user_id: user.id, exercise_id: exerciseId,
        });
      }
    } catch (err) {
      // Rollback optimistic update on error
      setFavorites(prev => {
        const next = new Set(prev);
        isFav ? next.add(exerciseId) : next.delete(exerciseId);
        return next;
      });
      console.error('Toggle favorite error:', err);
    }
  }, [user, favorites]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return exercises.filter(ex => {
      const matchSearch = !q ||
        ex.name.toLowerCase().includes(q) ||
        ex.muscleGroup.toLowerCase().includes(q) ||
        ex.targetMuscles.some(m => m.toLowerCase().includes(q));
      const matchMuscle = filterMuscle === 'Alle' || ex.muscleGroup === filterMuscle;
      const matchDiff   = filterDiff   === 'Alle' || ex.difficulty  === filterDiff;
      const matchEquip  = filterEquip  === 'Alle' || ex.equipmentType === filterEquip;
      return matchSearch && matchMuscle && matchDiff && matchEquip;
    });
  }, [debouncedSearch, filterMuscle, filterDiff, filterEquip]);

  const displayedExercises = activeTab === 'favorites'
    ? filtered.filter(ex => favorites.has(ex.id))
    : filtered;

  const resetFilters = () => {
    setFilterMuscle('Alle'); setFilterDiff('Alle');
    setFilterEquip('Alle'); setSearch('');
  };
  const hasFilters = filterMuscle !== 'Alle' || filterDiff !== 'Alle' || filterEquip !== 'Alle' || search;

  const counts = {};
  exercises.forEach(e => { counts[e.muscleGroup] = (counts[e.muscleGroup] || 0) + 1; });

  const userGoal = profile?.goal || t('exercises.sort_default');

  return (
    <div className="page">
      <div className="library-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1>{t('exercises.title')}</h1>
            <p>{exercises.length} professionell dokumentierte Übungen — von Einsteiger bis Elite.</p>
          </div>
          {/* Tabs: Alle / Favoriten */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card-2)', borderRadius: 10, padding: 4 }}>
            {[
              { id: 'all',       label: t('exercises.all') },
              { id: 'favorites', label: `Favoriten${favorites.size > 0 ? ` (${favorites.size})` : ''}` },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: activeTab === t.id ? 'var(--green-glow)' : 'transparent',
                border: activeTab === t.id ? '1px solid var(--border-active)' : '1px solid transparent',
                color: activeTab === t.id ? 'var(--green)' : 'var(--text-muted)',
                cursor: 'pointer', transition: 'all 0.2s ease', whiteSpace: 'nowrap',
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="library-layout">
        <FilterPanel
          filterMuscle={filterMuscle} setFilterMuscle={setFilterMuscle}
          filterDiff={filterDiff} setFilterDiff={setFilterDiff}
          filterEquip={filterEquip} setFilterEquip={setFilterEquip}
          hasFilters={hasFilters} resetFilters={resetFilters}
          filteredCount={displayedExercises.length}
          counts={counts} isMobile={isMobile}
          sortBy={sortBy} setSortBy={setSortBy}
          t={t}
        />

        <div>
          {/* P5: Zuletzt angesehen */}
          {recentlyViewed.length > 0 && !debouncedSearch && !hasFilters && activeTab === 'all' && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.8px', color: 'var(--text-muted)',
                marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Target size={11} /> Zuletzt angesehen
              </div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {recentlyViewed
                  .map(id => exercises.find(ex => ex.id === id))
                  .filter(Boolean)
                  .map(ex => (
                    <button key={ex.id} onClick={() => { setSelected(ex); trackViewed(ex.id); }}
                      style={{
                        fontSize: 12, padding: '5px 12px', borderRadius: 100,
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        color: 'var(--text-secondary)', cursor: 'pointer',
                        transition: 'all 0.15s ease', fontWeight: 500,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.color = 'var(--green)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                      {ex.name}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Suchfeld */}
          <div className="search-bar">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder={t('exercises.search_placeholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoComplete="off"
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Favoriten leer */}
          {activeTab === 'favorites' && favorites.size === 0 && (
            <div className="no-results">
              <div className="no-results-icon"><Heart size={38} strokeWidth={1.2} /></div>
              <p style={{ marginBottom: 8 }}>Noch keine Favoriten gespeichert.</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                Klicke auf das Herz-Symbol auf einer Übungskarte um sie zu speichern.
              </p>
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('all')}>
                Alle Übungen anzeigen
              </button>
            </div>
          )}

          {/* Grid */}
          {displayedExercises.length > 0 ? (
            <div className="exercise-grid">
              {displayedExercises.map((ex, i) => (
                <ExerciseCard
                  key={ex.id} exercise={ex} onClick={setSelected} index={i}
                  isFavorite={favorites.has(ex.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          ) : activeTab !== 'favorites' && (
            <div className="no-results">
              <div className="no-results-icon"><Search size={38} strokeWidth={1.2} /></div>
              <p style={{ marginBottom: 16 }}>{t('exercises.no_results')}</p>
              <button className="btn btn-secondary btn-sm" onClick={resetFilters}>{t('exercises.reset_filters')}</button>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <ExerciseModal
          exercise={selected}
          onClose={() => setSelected(null)}
          isFavorite={favorites.has(selected.id)}
          onToggleFavorite={toggleFavorite}
          userGoal={userGoal}
          t={t}
        />
      )}
    </div>
  );
}
