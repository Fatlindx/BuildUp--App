import { useState, useMemo } from 'react';
import { Search, X, Dumbbell, Target, Zap, Package, Flame, ZoomIn } from 'lucide-react';
import { exercises, muscleGroups, difficulties, equipmentTypes } from '../data/exercises';

const muscleColors = {
  Brust: '#ef4444', Rücken: '#3b82f6', Schultern: '#a855f7',
  Beine: '#f97316', Bizeps: '#22c55e', Trizeps: '#06b6d4', Core: '#eab308',
};

function DifficultyBadge({ level }) {
  const cls = { Leicht: 'badge-leicht', Mittel: 'badge-mittel', Schwer: 'badge-schwer' };
  return <span className={`badge ${cls[level] || 'badge-gray'}`}>{level}</span>;
}

// ─── Lightbox Vollbild ────────────────────────────────────────────────────────
function Lightbox({ src, alt, onClose }) {
  if (!src) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.97)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.15s ease',
        cursor: 'zoom-out',
      }}
    >
      <button onClick={onClose} style={{
        position: 'absolute', top: 16, right: 16,
        width: 44, height: 44, borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.2)',
        color: '#fff', display: 'flex', alignItems: 'center',
        justifyContent: 'center', cursor: 'pointer', zIndex: 10000,
      }}>
        <X size={20} />
      </button>
      <img
        src={src} alt={alt}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '95vw', maxHeight: '92vh',
          objectFit: 'contain',
          borderRadius: '10px',
          boxShadow: '0 40px 100px rgba(0,0,0,0.9)',
          cursor: 'default',
        }}
      />
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function ExerciseModal({ exercise, onClose }) {
  const [lightboxSrc, setLightboxSrc] = useState(null);
  if (!exercise) return null;
  const color = muscleColors[exercise.muscleGroup] || '#22c55e';

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
            <button className="modal-close" onClick={onClose}><X size={18} /></button>
          </div>

          {/* Body */}
          <div className="modal-body">

            {/* Vorschau-Bild – 4:3 – klickbar für Zoom */}
            {exercise.image && (
              <div
                onClick={() => setLightboxSrc(exercise.image)}
                style={{
                  position: 'relative', marginBottom: 12,
                  cursor: 'zoom-in', borderRadius: 12, overflow: 'hidden',
                  border: '1px solid var(--border)',
                  aspectRatio: '4 / 3',
                  background: '#0a0a0a',
                }}
              >
                <img
                  src={exercise.image} alt={exercise.name}
                  style={{
                    width: '100%', height: '100%',
                    objectFit: 'contain',
                    objectPosition: 'center',
                    display: 'block',
                  }}
                />
                <div style={{
                  position: 'absolute', bottom: 8, right: 8,
                  background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 7, padding: '4px 9px',
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 11, color: 'rgba(255,255,255,0.7)',
                  pointerEvents: 'none',
                }}>
                  <ZoomIn size={11} /> Vollbild
                </div>
              </div>
            )}

            {/* Detail-Bild – 16:9 – Ausführung */}
            {exercise.imageDetail && exercise.imageDetail !== exercise.image && (
              <div style={{ marginBottom: 22 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '1.1px', color: 'var(--text-muted)',
                  marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{
                    width: 4, height: 4, borderRadius: '50%',
                    background: 'var(--green)', display: 'inline-block'
                  }} />
                  Ausführung
                </div>
                <div
                  onClick={() => setLightboxSrc(exercise.imageDetail)}
                  style={{
                    position: 'relative', cursor: 'zoom-in',
                    borderRadius: 12, overflow: 'hidden',
                    border: '1px solid var(--border)',
                    aspectRatio: '16 / 9',
                    background: '#0a0a0a',
                  }}
                >
                  <img
                    src={exercise.imageDetail} alt={`${exercise.name} Ausführung`}
                    style={{
                      width: '100%', height: '100%',
                      objectFit: 'contain',
                      objectPosition: 'center',
                      display: 'block',
                    }}
                  />
                  <div style={{
                    position: 'absolute', bottom: 8, right: 8,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 7, padding: '4px 9px',
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontSize: 11, color: 'rgba(255,255,255,0.7)',
                    pointerEvents: 'none',
                  }}>
                    <ZoomIn size={11} /> Vollbild
                  </div>
                </div>
              </div>
            )}

            {/* Über diese Übung */}
            <div className="modal-section">
              <h4>Über diese Übung</h4>
              <p>{exercise.description}</p>
            </div>
            <div className="modal-divider" />

            {/* Trainierte Muskeln */}
            <div className="modal-section">
              <h4><Target size={12} />Trainierte Muskeln</h4>
              <div className="muscle-tags">
                {exercise.targetMuscles.map(m => (
                  <span key={m} className="tag" style={{ borderColor: `${color}40`, color }}>{m}</span>
                ))}
              </div>
            </div>
            <div className="modal-divider" />

            {/* Equipment */}
            <div className="modal-section">
              <h4><Package size={12} />Equipment</h4>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{exercise.equipment}</p>
            </div>
            <div className="modal-divider" />

            {/* Ausführung */}
            <div className="modal-section">
              <h4>Ausführung — Schritt für Schritt</h4>
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
              <h4>Häufige Fehler vermeiden</h4>
              <ul className="tip-list mistake-list">
                {exercise.commonMistakes.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>

            {/* Kalorien */}
            <div className="calorie-info-box">
              <div className="calorie-info-icon">
                <Flame size={20} color="var(--green)" />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 2 }}>Kalorienverbrauch</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  ca. <strong style={{ color: 'var(--green)' }}>{exercise.caloriesPerMin} kcal/min</strong> bei mittlerer Intensität
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Lightbox src={lightboxSrc} alt={exercise?.name} onClose={() => setLightboxSrc(null)} />
    </>
  );
}

// ─── Exercise Card ────────────────────────────────────────────────────────────
function ExerciseCard({ exercise, onClick, index }) {
  const color = muscleColors[exercise.muscleGroup] || '#22c55e';
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="exercise-card"
      onClick={() => onClick(exercise)}
      style={{ animationDelay: `${index * 35}ms` }}
    >
      {/* Karten-Bild – 4:3 Format, ganzes Bild sichtbar */}
      <div style={{
        aspectRatio: '4 / 3',
        position: 'relative',
        overflow: 'hidden',
        background: '#0a0a0a',
      }}>
        {exercise.image && !imgError ? (
          <img
            src={exercise.image}
            alt={exercise.name}
            onError={() => setImgError(true)}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'contain',
              objectPosition: 'center',
              transition: 'transform 0.45s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(135deg, ${color}18, ${color}06)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Dumbbell size={40} strokeWidth={1.5} color={color} />
          </div>
        )}

        {/* Overlay mit Name und Kategorie */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', padding: '10px 12px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, transparent 30%, rgba(0,0,0,0.75) 100%)',
          zIndex: 1,
        }}>
          <span className="exercise-card-category">{exercise.category}</span>
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

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ExerciseLibrary() {
  const [search,       setSearch]       = useState('');
  const [filterMuscle, setFilterMuscle] = useState('Alle');
  const [filterDiff,   setFilterDiff]   = useState('Alle');
  const [filterEquip,  setFilterEquip]  = useState('Alle');
  const [selected,     setSelected]     = useState(null);

  const filtered = useMemo(() => exercises.filter(ex => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      ex.name.toLowerCase().includes(q) ||
      ex.muscleGroup.toLowerCase().includes(q) ||
      ex.targetMuscles.some(m => m.toLowerCase().includes(q));
    const matchMuscle = filterMuscle === 'Alle' || ex.muscleGroup === filterMuscle;
    const matchDiff   = filterDiff   === 'Alle' || ex.difficulty  === filterDiff;
    const matchEquip  = filterEquip  === 'Alle' || ex.equipmentType === filterEquip;
    return matchSearch && matchMuscle && matchDiff && matchEquip;
  }), [search, filterMuscle, filterDiff, filterEquip]);

  const resetFilters = () => {
    setFilterMuscle('Alle'); setFilterDiff('Alle');
    setFilterEquip('Alle'); setSearch('');
  };
  const hasFilters = filterMuscle !== 'Alle' || filterDiff !== 'Alle' || filterEquip !== 'Alle' || search;

  const counts = {};
  exercises.forEach(e => { counts[e.muscleGroup] = (counts[e.muscleGroup] || 0) + 1; });

  return (
    <div className="page">
      <div className="library-header">
        <h1>Übungsbibliothek</h1>
        <p>{exercises.length} professionell dokumentierte Übungen — von Einsteiger bis Elite.</p>
      </div>

      <div className="library-layout">
        <aside className="filter-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div className="filter-panel-title" style={{ marginBottom: 0 }}>Filter</div>
            {hasFilters && (
              <button className="btn btn-ghost btn-sm" onClick={resetFilters} style={{ fontSize: 12 }}>
                Zurücksetzen
              </button>
            )}
          </div>
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
          <div className="filter-count">
            <strong>{filtered.length}</strong> Übung{filtered.length !== 1 ? 'en' : ''} gefunden
          </div>
        </aside>

        <div>
          <div className="search-bar">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Übung oder Muskelgruppe suchen…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>
                <X size={14} />
              </button>
            )}
          </div>

          {filtered.length > 0 ? (
            <div className="exercise-grid">
              {filtered.map((ex, i) => (
                <ExerciseCard key={ex.id} exercise={ex} onClick={setSelected} index={i} />
              ))}
            </div>
          ) : (
            <div className="no-results">
              <div className="no-results-icon"><Search size={38} strokeWidth={1.2} /></div>
              <p style={{ marginBottom: 16 }}>Keine Übungen gefunden.</p>
              <button className="btn btn-secondary btn-sm" onClick={resetFilters}>Filter zurücksetzen</button>
            </div>
          )}
        </div>
      </div>

      {selected && <ExerciseModal exercise={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}