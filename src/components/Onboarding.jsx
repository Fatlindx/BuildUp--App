import { useState } from 'react';
import { useI18n } from '../i18n.jsx';
import { supabase } from '../supabase';
import { Zap, ChevronRight, ChevronLeft, Check } from 'lucide-react';

// ── Schritt-Definitionen ──
const STEPS = ['ziel', 'geschlecht', 'koerper', 'aktivitaet', 'zusammenfassung'];

// Goals and activity levels are defined inside component to support i18n
// (see getGoals(t) and getActivityLevels(t) below)

// ── Kalorienberechnung (Mifflin-St Jeor) ──
function calculateNutrition(data) {
  const { gender, age, height, weight, activityLevel, goal } = data;
  if (!gender || !age || !height || !weight || !activityLevel) return null;

  const bmr = gender === 'männlich'
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;

  const tdee = Math.round(bmr * activityLevel);

  let calories, strategy;
  if (goal === 'Muskelaufbau') {
    calories = tdee + 300;
    strategy = 'Kalorienüberschuss +300 kcal';
  } else if (goal === 'Gewicht verlieren') {
    calories = tdee - 400;
    strategy = 'Kaloriendefizit -400 kcal';
  } else {
    calories = tdee;
    strategy = 'Kalorienbilanz ausgeglichen';
  }

  // Makros
  const protein = Math.round(weight * (goal === 'Muskelaufbau' ? 2.2 : 1.8));
  const fat     = Math.round((calories * 0.25) / 9);
  const carbs   = Math.round((calories - protein * 4 - fat * 9) / 4);
  const bmi     = (weight / ((height / 100) ** 2)).toFixed(1);

  return { calories, protein, fat, carbs, tdee, strategy, bmi };
}

export default function Onboarding({ user, onComplete }) {
  const { t, lang } = useI18n();
  const [step, setStep]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData]     = useState({
    goal: null,
    gender: null,
    age: '',
    height: '',
    weight: '',
    activityLevel: null,
  });

  const set = (key, val) => setData(prev => ({ ...prev, [key]: val }));

  const currentStep = STEPS[step];
  const nutrition   = calculateNutrition(data);

  const canNext = () => {
    if (currentStep === 'ziel')         return !!data.goal;
    if (currentStep === 'geschlecht')   return !!data.gender;
    if (currentStep === 'koerper')      return data.age && data.height && data.weight;
    if (currentStep === 'aktivitaet')   return !!data.activityLevel;
    return true;
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const handleComplete = async () => {
    if (!nutrition) return;
    setLoading(true);
    try {
      await supabase.from('profiles').upsert({
        id:              user.id,
        goal:            data.goal,
        gender:          data.gender,
        age:             parseInt(data.age),
        height:          parseInt(data.height),
        weight:          parseFloat(data.weight),
        activity_level:  data.activityLevel,
        calorie_goal:    nutrition.calories,
        onboarding_done: true,
      });
      onComplete(data.goal);
    } catch (err) {
      console.error('Onboarding save error:', err);
      // Still complete even if save fails — user can update profile later
      onComplete(data.goal);
    } finally {
      setLoading(false);
    }
  };

  const progress = ((step) / (STEPS.length - 1)) * 100;

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* ── Logo + Progress ── */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48,
            background: 'linear-gradient(135deg, var(--green), var(--green-dark))',
            borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 20px',
            boxShadow: 'var(--shadow-green)',
          }}>
            <Zap size={22} color="#000" strokeWidth={2.5} />
          </div>

          {/* Progress Bar */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 8 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{
                height: 4, flex: 1, maxWidth: 60, borderRadius: 100,
                background: i <= step ? 'var(--green)' : 'var(--border)',
                transition: 'background 0.3s ease',
              }} />
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Schritt {step + 1} von {STEPS.length}
          </p>
        </div>

        {/* ── Step Content ── */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)', padding: '28px 24px',
          marginBottom: 20,
        }}>

          {/* STEP 1 — Ziel */}
          {currentStep === 'ziel' && (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 6 }}>
                Was ist dein Ziel?
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
                Wir passen alles auf dein Ziel an.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {goals.map(g => (
                  <button key={g.id} onClick={() => set('goal', g.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 18px', borderRadius: 'var(--radius)',
                    background: data.goal === g.id ? 'var(--green-glow)' : 'var(--bg-card-2)',
                    border: `1px solid ${data.goal === g.id ? 'var(--border-active)' : 'var(--border)'}`,
                    cursor: 'pointer', transition: 'var(--transition)', textAlign: 'left',
                    boxShadow: data.goal === g.id ? 'var(--shadow-green)' : 'none',
                  }}>
                    <span style={{ fontSize: 26, flexShrink: 0 }}>{g.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: data.goal === g.id ? 'var(--green)' : 'var(--text)', marginBottom: 2 }}>
                        {g.label}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{g.desc}</div>
                    </div>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${data.goal === g.id ? 'var(--green)' : 'var(--border)'}`,
                      background: data.goal === g.id ? 'var(--green)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {data.goal === g.id && <Check size={11} color="#000" strokeWidth={3} />}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* STEP 2 — Geschlecht */}
          {currentStep === 'geschlecht' && (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 6 }}>
                Dein Geschlecht
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
                Wird für die genaue Kalorienberechnung benötigt.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { id: 'männlich', label: t('onboarding.male') },
                  { id: 'weiblich', label: t('onboarding.female') },
                ].map(g => (
                  <button key={g.id} onClick={() => set('gender', g.id)} style={{
                    padding: '24px 16px', borderRadius: 'var(--radius)',
                    background: data.gender === g.id ? 'var(--green-glow)' : 'var(--bg-card-2)',
                    border: `1px solid ${data.gender === g.id ? 'var(--border-active)' : 'var(--border)'}`,
                    cursor: 'pointer', transition: 'var(--transition)', textAlign: 'center',
                    boxShadow: data.gender === g.id ? 'var(--shadow-green)' : 'none',
                  }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>{g.emoji}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: data.gender === g.id ? 'var(--green)' : 'var(--text)' }}>
                      {g.label}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* STEP 3 — Körperdaten */}
          {currentStep === 'koerper' && (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 6 }}>
                Deine Körperdaten
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
                Für deinen persönlichen Kalorienbedarf.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { key: 'age',    label: t('onboarding.age'),       unit: 'Jahre', placeholder: 'z.B. 25', min: 13, max: 100 },
                  { key: 'height', label: 'Grösse',      unit: 'cm',    placeholder: 'z.B. 178', min: 100, max: 250 },
                  { key: 'weight', label: 'Körpergewicht', unit: 'kg',  placeholder: 'z.B. 75',  min: 30,  max: 300 },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
                      {f.label}
                    </label>
                    <div style={{ display: 'flex', gap: 0 }}>
                      <input
                        type="number"
                        placeholder={f.placeholder}
                        value={data[f.key]}
                        min={f.min} max={f.max}
                        onChange={e => set(f.key, e.target.value)}
                        className="form-input"
                        style={{ flex: 1, borderRadius: '10px 0 0 10px', borderRight: 'none' }}
                      />
                      <div style={{
                        padding: '0 14px', background: 'var(--bg-hover)',
                        border: '1px solid var(--border)', borderRadius: '0 10px 10px 0',
                        display: 'flex', alignItems: 'center',
                        fontSize: 13, color: 'var(--text-muted)', fontWeight: 500,
                        whiteSpace: 'nowrap',
                      }}>
                        {f.unit}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* STEP 4 — Aktivitätslevel */}
          {currentStep === 'aktivitaet' && (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 6 }}>
                Wie aktiv bist du?
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
                Wähle deinen durchschnittlichen Alltag.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activityLevels.map(a => (
                  <button key={a.id} onClick={() => set('activityLevel', a.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 16px', borderRadius: 'var(--radius)',
                    background: data.activityLevel === a.id ? 'var(--green-glow)' : 'var(--bg-card-2)',
                    border: `1px solid ${data.activityLevel === a.id ? 'var(--border-active)' : 'var(--border)'}`,
                    cursor: 'pointer', transition: 'var(--transition)', textAlign: 'left',
                  }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{a.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: data.activityLevel === a.id ? 'var(--green)' : 'var(--text)', marginBottom: 1 }}>
                        {a.label}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.desc}</div>
                    </div>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${data.activityLevel === a.id ? 'var(--green)' : 'var(--border)'}`,
                      background: data.activityLevel === a.id ? 'var(--green)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {data.activityLevel === a.id && <Check size={12} color="#000" strokeWidth={3} />}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* STEP 5 — Zusammenfassung */}
          {currentStep === 'zusammenfassung' && nutrition && (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 4 }}>
                Dein persönlicher Plan
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
                Basierend auf deinen Daten berechnet.
              </p>

              {/* Hauptkalorien */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.04))',
                border: '1px solid var(--border-active)', borderRadius: 'var(--radius)',
                padding: '20px', textAlign: 'center', marginBottom: 16,
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
                  Tägliches Kalorienziel
                </div>
                <div style={{ fontSize: 52, fontWeight: 900, color: 'var(--green)', letterSpacing: '-2px', lineHeight: 1 }}>
                  {nutrition.calories}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>kcal / Tag</div>
                <div style={{
                  fontSize: 12, color: 'var(--green)', marginTop: 8,
                  background: 'var(--green-glow)', border: '1px solid var(--border-active)',
                  borderRadius: 100, padding: '3px 12px', display: 'inline-block',
                }}>
                  {nutrition.strategy}
                </div>
              </div>

              {/* Makros */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                {[
                  { label: 'Protein', value: nutrition.protein, unit: 'g', color: 'var(--red)' },
                  { label: 'Carbs',   value: nutrition.carbs,   unit: 'g', color: 'var(--orange)' },
                  { label: 'Fette',   value: nutrition.fat,     unit: 'g', color: 'var(--yellow)' },
                ].map(m => (
                  <div key={m.label} style={{
                    background: 'var(--bg-card-2)', border: '1px solid var(--border)',
                    borderRadius: 10, padding: '12px 8px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: m.color }}>
                      {m.value}<span style={{ fontSize: 10 }}>{m.unit}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Profil-Zusammenfassung */}
              <div style={{
                background: 'var(--bg-card-2)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '14px 16px',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Ziel',        value: data.goal },
                    { label: 'Geschlecht',  value: data.gender },
                    { label: t('onboarding.age'),       value: `${data.age} Jahre` },
                    { label: 'Grösse',      value: `${data.height} cm` },
                    { label: 'Gewicht',     value: `${data.weight} kg` },
                    { label: 'BMI',         value: nutrition.bmi },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600, marginTop: 1 }}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Navigation Buttons ── */}
        <div style={{ display: 'flex', gap: 10 }}>
          {step > 0 && (
            <button
              onClick={handleBack}
              className="btn btn-secondary"
              style={{ padding: '13px 20px', flexShrink: 0 }}
            >
              <ChevronLeft size={16} />
            </button>
          )}

          {currentStep !== 'zusammenfassung' ? (
            <button
              onClick={handleNext}
              disabled={!canNext()}
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center', padding: 14, fontSize: 15 }}
            >
              Weiter <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={loading}
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center', padding: 14, fontSize: 15 }}
            >
              {loading ? 'Wird gespeichert...' : t('onboarding.start')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
