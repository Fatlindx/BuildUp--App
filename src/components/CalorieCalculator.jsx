import { useState } from 'react';
import { TrendingDown, Scale, TrendingUp, ChevronRight, Check, Lightbulb, Calculator } from 'lucide-react';

const activityLevels = [
  { value: 1.2,   label: 'Sitzend',        desc: 'Kaum Bewegung, Bürojob' },
  { value: 1.375, label: 'Leicht aktiv',   desc: '1–3× Sport pro Woche' },
  { value: 1.55,  label: 'Moderat aktiv',  desc: '3–5× Sport pro Woche' },
  { value: 1.725, label: 'Sehr aktiv',     desc: '6–7× intensives Training' },
  { value: 1.9,   label: 'Extrem aktiv',   desc: 'Athleten / körperl. Arbeit' },
];

const goalOptions = [
  { value: -500, label: 'Abnehmen',  desc: '−500 kcal', icon: TrendingDown, color: '#ef4444' },
  { value: 0,    label: 'Halten',    desc: '±0 kcal',   icon: Scale,        color: '#22c55e' },
  { value: 300,  label: 'Aufbauen',  desc: '+300 kcal', icon: TrendingUp,   color: '#3b82f6' },
];

function ProgressBar({ value, max, color }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="progress-bar-track">
      <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function getBmiLabel(bmi) {
  if (bmi < 18.5) return { label: 'Untergewicht', color: '#3b82f6' };
  if (bmi < 25)   return { label: 'Normalgewicht', color: '#22c55e' };
  if (bmi < 30)   return { label: 'Übergewicht',   color: '#f97316' };
  return           { label: 'Adipositas',           color: '#ef4444' };
}

export default function CalorieCalculator({ onSaveGoal }) {
  const [form, setForm] = useState({
    gender:   'male',
    age:      '',
    weight:   '',
    height:   '',
    activity: 1.55,
    goal:     0,
  });
  const [result, setResult] = useState(null);
  const [saved,  setSaved]  = useState(false);

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setResult(null);
    setSaved(false);
  };

  const calculate = () => {
    const { gender, age, weight, height, activity, goal } = form;
    if (!age || !weight || !height) return;

    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age);

    const bmr = gender === 'male'
      ? 10 * w + 6.25 * h - 5 * a + 5
      : 10 * w + 6.25 * h - 5 * a - 161;

    const tdee   = Math.round(bmr * activity);
    const target = Math.max(1200, tdee + goal);
    const protein = Math.round(w * 2.0);
    const fat     = Math.round((target * 0.25) / 9);
    const carbs   = Math.round((target - protein * 4 - fat * 9) / 4);
    const bmi     = (w / ((h / 100) ** 2)).toFixed(1);

    setResult({ bmr: Math.round(bmr), tdee, target, protein, fat, carbs, bmi });
    setSaved(false);
  };

  const handleSave = () => {
    if (result) { onSaveGoal(result.target); setSaved(true); }
  };

  const isValid = form.age && form.weight && form.height;

  return (
    <div className="page">
      <div className="calc-container">
        <h1>Kalorienrechner</h1>
        <p>Persönlicher Tagesbedarf mit der wissenschaftlichen Mifflin-St Jeor Formel.</p>

        <div className="calc-card">
          {/* Geschlecht */}
          <div style={{ marginBottom: 24 }}>
            <div className="form-section-label">Geschlecht</div>
            <div className="radio-group">
              <button
                className={`radio-btn ${form.gender === 'male' ? 'active' : ''}`}
                onClick={() => set('gender', 'male')}
              >
                ♂ Mann
              </button>
              <button
                className={`radio-btn ${form.gender === 'female' ? 'active' : ''}`}
                onClick={() => set('gender', 'female')}
              >
                ♀ Frau
              </button>
            </div>
          </div>

          {/* Körperdaten */}
          <div className="form-grid" style={{ marginBottom: 24 }}>
            <div className="form-group">
              <label>Alter (Jahre)</label>
              <input
                className="form-input"
                type="number" min="15" max="99"
                placeholder="z.B. 28"
                value={form.age}
                onChange={e => set('age', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Körpergrösse (cm)</label>
              <input
                className="form-input"
                type="number" min="140" max="220"
                placeholder="z.B. 178"
                value={form.height}
                onChange={e => set('height', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Körpergewicht (kg)</label>
              <input
                className="form-input"
                type="number" min="40" max="200" step="0.1"
                placeholder="z.B. 75"
                value={form.weight}
                onChange={e => set('weight', e.target.value)}
              />
            </div>
          </div>

          {/* Aktivitätslevel */}
          <div style={{ marginBottom: 24 }}>
            <div className="form-section-label">Aktivitätslevel</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {activityLevels.map(level => (
                <button
                  key={level.value}
                  className={`activity-btn ${form.activity === level.value ? 'active' : ''}`}
                  onClick={() => set('activity', level.value)}
                >
                  <span style={{ fontWeight: 600 }}>{level.label}</span>
                  <span style={{ fontSize: 12, opacity: 0.75 }}>{level.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ziel */}
          <div style={{ marginBottom: 28 }}>
            <div className="form-section-label">Dein Ziel</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {goalOptions.map(g => {
                const Icon = g.icon;
                return (
                  <button
                    key={g.value}
                    className={`radio-btn ${form.goal === g.value ? 'active' : ''}`}
                    style={{ flexDirection: 'column', gap: 6, padding: '14px 10px' }}
                    onClick={() => set('goal', g.value)}
                  >
                    <Icon size={22} color={form.goal === g.value ? g.color : 'var(--text-muted)'} strokeWidth={1.8} />
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{g.label}</span>
                    <span style={{ fontSize: 11, opacity: 0.7 }}>{g.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '13px', gap: 8 }}
            onClick={calculate}
            disabled={!isValid}
          >
            {isValid ? (
              <>
                <Calculator size={16} />
                Kalorien berechnen
                <ChevronRight size={16} />
              </>
            ) : 'Bitte alle Felder ausfüllen'}
          </button>
        </div>

        {/* Result */}
        {result && (() => {
          const bmiInfo = getBmiLabel(result.bmi);
          return (
            <div className="result-card">
              <div className="result-header">
                <div className="result-label-top">Dein täglicher Kalorienbedarf</div>
                <div className="result-calories">{result.target.toLocaleString()}</div>
                <div className="result-unit">kcal pro Tag für dein Ziel</div>

                <div className="result-meta">
                  <div className="result-meta-item">
                    <div className="label">Grundumsatz (BMR)</div>
                    <div className="value">{result.bmr.toLocaleString()} kcal</div>
                  </div>
                  <div className="result-meta-item">
                    <div className="label">Gesamtumsatz (TDEE)</div>
                    <div className="value">{result.tdee.toLocaleString()} kcal</div>
                  </div>
                  <div className="result-meta-item">
                    <div className="label">BMI</div>
                    <div className="value" style={{ color: bmiInfo.color }}>
                      {result.bmi}
                      <span style={{ fontSize: 12, fontWeight: 500, marginLeft: 5 }}>({bmiInfo.label})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Macros */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.1px', color: 'var(--text-muted)', marginBottom: 14 }}>
                  Empfohlene Makronährstoffe
                </div>
                <div className="macro-grid">
                  <div className="macro-card">
                    <div className="macro-value" style={{ color: '#ef4444' }}>{result.protein}g</div>
                    <div className="macro-unit">PROTEIN</div>
                    <div className="macro-name">{result.protein * 4} kcal</div>
                  </div>
                  <div className="macro-card">
                    <div className="macro-value" style={{ color: '#f97316' }}>{result.carbs}g</div>
                    <div className="macro-unit">KOHLENHYDRATE</div>
                    <div className="macro-name">{result.carbs * 4} kcal</div>
                  </div>
                  <div className="macro-card">
                    <div className="macro-value" style={{ color: '#eab308' }}>{result.fat}g</div>
                    <div className="macro-unit">FETTE</div>
                    <div className="macro-name">{result.fat * 9} kcal</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Protein',       value: result.protein * 4, color: '#ef4444', pct: Math.round((result.protein * 4 / result.target) * 100) },
                    { label: 'Kohlenhydrate', value: result.carbs * 4,   color: '#f97316', pct: Math.round((result.carbs   * 4 / result.target) * 100) },
                    { label: 'Fette',         value: result.fat * 9,     color: '#eab308', pct: Math.round((result.fat     * 9 / result.target) * 100) },
                  ].map(m => (
                    <div key={m.label} className="progress-bar-wrap">
                      <div className="progress-bar-label">
                        <span>{m.label}</span>
                        <span style={{ color: m.color, fontWeight: 600 }}>{m.pct}%</span>
                      </div>
                      <ProgressBar value={m.value} max={result.target} color={m.color} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="info-box" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Lightbulb size={16} color="var(--green)" style={{ flexShrink: 0, marginTop: 2 }} />
                <span><strong>Hinweis:</strong> Protein ist auf 2g/kg Körpergewicht für optimalen Muskelaufbau gesetzt. Fette decken 25%, Kohlenhydrate die restlichen Kalorien.</span>
              </div>

              <button
                className={`btn ${saved ? 'btn-secondary' : 'btn-primary'}`}
                style={{ width: '100%', justifyContent: 'center', padding: '13px', gap: 8, marginTop: 16 }}
                onClick={handleSave}
              >
                {saved ? (
                  <><Check size={16} /> Ziel im Tracker gespeichert!</>
                ) : (
                  <><ChevronRight size={16} /> Als Tagesziel im Tracker speichern</>
                )}
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}