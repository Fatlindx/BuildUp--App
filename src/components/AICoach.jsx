import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Loader, Zap } from 'lucide-react';

export default function AICoach({ onClose, dailyLog, calorieGoal, profile }) {
  const displayName = profile?.username || profile?.full_name?.split(' ')[0] || 'du';

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: buildWelcomeMessage(displayName, profile, calorieGoal, dailyLog),
    }
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const totalCal  = dailyLog.reduce((s, i) => s + i.calories, 0);
  const totalProt = dailyLog.reduce((s, i) => s + (i.protein || 0), 0);
  const totalCarb = dailyLog.reduce((s, i) => s + (i.carbs || 0), 0);
  const totalFat  = dailyLog.reduce((s, i) => s + (i.fat || 0), 0);
  const remaining = calorieGoal - totalCal;

  // Build personalized system prompt
  const systemPrompt = buildSystemPrompt({ profile, calorieGoal, totalCal, totalProt, totalCarb, totalFat, remaining, dailyLog });

  // Build personalized quick questions based on profile
  const quickQuestions = buildQuickQuestions(profile, totalCal, calorieGoal, totalProt);

  const sendMessage = async (text) => {
    const msgText = text || input.trim();
    if (!msgText || loading) return;

    const userMessage = { role: 'user', content: msgText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 500,
          system: systemPrompt,
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(typeof data.error === 'object' ? JSON.stringify(data.error) : data.error);

      const reply = data.content?.[0]?.text || 'Entschuldigung, keine Antwort erhalten.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Fehler: ${e.message}`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const caloriePercent = Math.min(100, Math.round((totalCal / calorieGoal) * 100));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: 540, display: 'flex', flexDirection: 'column', height: '82vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 18 }}>
          <div className="modal-header-inner">
            <div style={{
              width: 44, height: 44, borderRadius: 13, flexShrink: 0,
              background: 'linear-gradient(135deg, var(--green), var(--green-dark))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(34,197,94,0.35)',
            }}>
              <Bot size={21} color="#000" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: 17 }}>BuildUp Coach</h2>
              <p style={{ fontSize: 11.5, color: 'var(--green)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                Persönlicher Coach von {displayName}
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* ── Stats Bar ── */}
        <div style={{
          padding: '12px 24px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-card-2)',
        }}>
          {/* Kalorienprogress */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
              TAGESFORTSCHRITT
            </span>
            <span style={{ fontSize: 11, color: caloriePercent >= 100 ? '#f87171' : 'var(--green)', fontWeight: 700 }}>
              {totalCal} / {calorieGoal} kcal
            </span>
          </div>
          <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 100, marginBottom: 10, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 100,
              width: `${caloriePercent}%`,
              background: caloriePercent >= 100 ? '#f87171' : 'var(--green)',
              transition: 'width 0.5s ease',
            }} />
          </div>
          {/* Makros */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { label: 'Protein', value: totalProt, unit: 'g', color: '#ef4444' },
              { label: 'Carbs',   value: totalCarb, unit: 'g', color: '#f97316' },
              { label: 'Fette',   value: totalFat,  unit: 'g', color: '#eab308' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.03)', borderRadius: 8,
                padding: '7px 10px', textAlign: 'center',
                border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: s.color }}>
                  {s.value}<span style={{ fontSize: 9, fontWeight: 500 }}>{s.unit}</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Profile Tags */}
          {profile && (
            <div style={{ display: 'flex', gap: 5, marginTop: 10, flexWrap: 'wrap' }}>
              {profile.goal && (
                <span style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 100,
                  background: 'var(--green-glow)', color: 'var(--green)',
                  border: '1px solid var(--border-active)', fontWeight: 600,
                }}>
                  🎯 {profile.goal}
                </span>
              )}
              {profile.weight && (
                <span style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 100,
                  background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                }}>
                  ⚖️ {profile.weight} kg
                </span>
              )}
              {profile.height && (
                <span style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 100,
                  background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                }}>
                  📏 {profile.height} cm
                </span>
              )}
              {remaining > 0 && (
                <span style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 100,
                  background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                }}>
                  🔥 {remaining} kcal übrig
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Messages ── */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '20px 24px',
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex', gap: 10,
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              alignItems: 'flex-start',
            }}>
              {/* Avatar */}
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: msg.role === 'user' ? 'var(--green-glow)' : 'var(--bg-card-2)',
                border: `1px solid ${msg.role === 'user' ? 'var(--border-active)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {msg.role === 'user'
                  ? <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)' }}>
                      {displayName[0]?.toUpperCase()}
                    </span>
                  : <Bot size={13} color="var(--text-secondary)" />}
              </div>

              {/* Bubble */}
              <div style={{
                maxWidth: '78%',
                padding: '11px 15px',
                borderRadius: 14,
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.08))'
                  : 'var(--bg-card)',
                border: `1px solid ${msg.role === 'user' ? 'var(--border-active)' : 'var(--border)'}`,
                fontSize: 13.5, lineHeight: 1.65, color: 'var(--text)',
                borderTopRightRadius: msg.role === 'user' ? 4 : 14,
                borderTopLeftRadius: msg.role === 'assistant' ? 4 : 14,
                whiteSpace: 'pre-wrap',
              }}>
                {msg.content}
              </div>
            </div>
          ))}

          {/* Loading */}
          {loading && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--bg-card-2)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Bot size={13} color="var(--text-secondary)" />
              </div>
              <div style={{
                padding: '11px 15px', borderRadius: 14, borderTopLeftRadius: 4,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: 'var(--green)', display: 'inline-block',
                      animation: `bounce 1s ease ${i * 0.15}s infinite`,
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Coach denkt nach...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Quick Questions ── */}
        {messages.length <= 1 && (
          <div style={{ padding: '0 24px 12px' }}>
            <p style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>
              Schnellfragen für dich
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {quickQuestions.map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  style={{
                    fontSize: 12, padding: '6px 12px', borderRadius: 100,
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    color: 'var(--text-secondary)', cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.color = 'var(--green)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Input ── */}
        <div style={{
          padding: '14px 24px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex', gap: 10,
        }}>
          <input
            className="form-input"
            placeholder="Frag mich alles über Training & Ernährung..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            style={{ flex: 1, fontSize: 13.5 }}
            autoFocus
          />
          <button
            className="btn btn-primary"
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            style={{ padding: '10px 16px', flexShrink: 0 }}
          >
            <Send size={15} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}

// ── Helper: Welcome Message ──
function buildWelcomeMessage(name, profile, calorieGoal, dailyLog) {
  const totalCal = dailyLog.reduce((s, i) => s + i.calories, 0);
  const remaining = calorieGoal - totalCal;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend';

  let msg = `${greeting}, ${name}! 💪\n\n`;

  if (profile?.goal) {
    msg += `Ich sehe dein Ziel ist **${profile.goal}** — ich bin hier um dir dabei zu helfen.\n\n`;
  }

  if (totalCal === 0) {
    msg += `Du hast heute noch nichts geloggt. Soll ich dir sagen was du essen solltest um dein Ziel zu erreichen?`;
  } else if (remaining > 0) {
    msg += `Du hast heute ${totalCal} kcal gegessen — noch ${remaining} kcal bis zu deinem Ziel. Gut gemacht!`;
  } else {
    msg += `Du hast dein Kalorienziel von ${calorieGoal} kcal heute bereits erreicht. 🎯`;
  }

  return msg;
}

// ── Helper: System Prompt ──
function buildSystemPrompt({ profile, calorieGoal, totalCal, totalProt, totalCarb, totalFat, remaining, dailyLog }) {
  const name = profile?.username || profile?.full_name?.split(' ')[0] || 'der User';

  // Calculate BMI if we have height and weight
  let bmiInfo = '';
  if (profile?.weight && profile?.height) {
    const bmi = (profile.weight / ((profile.height / 100) ** 2)).toFixed(1);
    const bmiCat = bmi < 18.5 ? 'Untergewicht' : bmi < 25 ? 'Normalgewicht' : bmi < 30 ? 'Übergewicht' : 'Adipositas';
    bmiInfo = `\n- BMI: ${bmi} (${bmiCat})`;
  }

  // Goal-specific strategy
  const goalStrategy = {
    'Muskelaufbau': 'Kalorienüberschuss ~300-500 kcal, hohe Proteinzufuhr (2-2.5g/kg), Krafttraining fokus',
    'Gewicht verlieren': 'Kaloriendefizit ~300-500 kcal, moderate Proteinzufuhr (1.6-2g/kg), Kombination Kraft + Cardio',
    'Fit bleiben': 'Kalorienbilanz ausgewogen, gute Makroverteilung, abwechslungsreiches Training',
    'Ausdauer verbessern': 'Moderate Kalorien, Kohlenhydratfokus, progressives Ausdauertraining',
  };
  const strategy = goalStrategy[profile?.goal] || 'Individuelle Strategie basierend auf den Zielen';

  return `Du bist der persönliche BuildUp Coach von ${name}. Du kennst ${name} genau und redest ihn/sie direkt an.

NUTZERPROFIL:
- Name: ${name}
- Ziel: ${profile?.goal || 'Nicht gesetzt'}
- Gewicht: ${profile?.weight ? `${profile.weight} kg` : 'Nicht angegeben'}
- Grösse: ${profile?.height ? `${profile.height} cm` : 'Nicht angegeben'}${bmiInfo}
- Strategie für "${profile?.goal || 'allgemein'}": ${strategy}

HEUTIGE DATEN (${new Date().toLocaleDateString('de-DE')}):
- Kalorienziel: ${calorieGoal} kcal
- Gegessen: ${totalCal} kcal (${Math.round((totalCal/calorieGoal)*100)}% des Ziels)
- Noch übrig: ${remaining > 0 ? `${remaining} kcal` : `${Math.abs(remaining)} kcal über Ziel`}
- Protein: ${totalProt}g | Kohlenhydrate: ${totalCarb}g | Fette: ${totalFat}g
- Mahlzeiten: ${dailyLog.length > 0 ? dailyLog.map(i => i.name).join(', ') : 'Noch nichts gegessen'}

DEIN COACHING-STIL:
- Sprich ${name} direkt und persönlich an — du kennst seine/ihre Daten
- Beziehe dich immer auf die echten Nutzerdaten wenn relevant
- Motivierend aber ehrlich — keine leeren Floskeln
- Konkrete, umsetzbare Empfehlungen
- Unter 200 Wörter pro Antwort
- Antworte immer auf Deutsch
- Erwähne nie dass du eine KI bist

DEIN WISSEN:
- Makronährstoffe, Kalorienmanagement, Muskelaufbau, Gewichtsabnahme
- Krafttraining, Cardio, HIIT, alle Sportarten
- Supplements, Vitamine, Schlaf, Regeneration
- Trainingspläne Anfänger bis Fortgeschrittene
- Bei komplett themenfremden Fragen: freundlich auf Fitness & Ernährung hinweisen`;
}

// ── Helper: Personalized Quick Questions ──
function buildQuickQuestions(profile, totalCal, calorieGoal, totalProt) {
  const questions = [];
  const remaining = calorieGoal - totalCal;

  // Goal-specific questions
  if (profile?.goal === 'Muskelaufbau') {
    questions.push('Wie viel Protein brauche ich täglich?');
    questions.push('Welche Übungen für maximalen Muskelaufbau?');
  } else if (profile?.goal === 'Gewicht verlieren') {
    questions.push('Wie erstelle ich ein Kaloriendefizit?');
    questions.push('Welches Cardio verbrennt am meisten?');
  } else {
    questions.push('Gib mir einen Trainingsplan');
    questions.push('Was sind die besten Übungen für Bauch?');
  }

  // Data-driven questions
  if (totalCal === 0) {
    questions.push('Was soll ich heute essen?');
  } else if (remaining > 200) {
    questions.push(`Ich habe noch ${remaining} kcal — was soll ich essen?`);
  }

  if (totalProt < 50) {
    questions.push('Wie bekomme ich mehr Protein?');
  }

  // Weight/height based
  if (profile?.weight && profile?.height) {
    questions.push('Wie ist mein aktueller BMI zu bewerten?');
  } else {
    questions.push('Wie viel Wasser sollte ich trinken?');
  }

  // Always include
  questions.push('Wie ist mein heutiger Fortschritt?');

  return questions.slice(0, 6);
}
