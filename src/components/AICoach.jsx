import { useState, useRef, useEffect } from 'react';
import { useI18n, translateGoal } from '../i18n.jsx';
import { X, Send, Bot, Sparkles, Dumbbell, Droplets, Scale, Ruler } from 'lucide-react';

export default function AICoach({ onClose, dailyLog, calorieGoal, profile }) {
  const { t, lang } = useI18n();
  const displayName = profile?.username || profile?.full_name?.split(' ')[0] || 'du';

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: buildWelcomeMessage(displayName, profile, calorieGoal, dailyLog),
    }
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping]   = useState(false);
  const bottomRef             = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const totalCal  = (dailyLog || []).reduce((s, i) => s + (i.calories || 0), 0);
  const totalProt = (dailyLog || []).reduce((s, i) => s + (i.protein || 0), 0);
  const totalCarb = (dailyLog || []).reduce((s, i) => s + (i.carbs || 0), 0);
  const totalFat  = (dailyLog || []).reduce((s, i) => s + (i.fat || 0), 0);
  const remaining = calorieGoal - totalCal;
  const pct       = calorieGoal > 0 ? Math.min(100, Math.round((totalCal / calorieGoal) * 100)) : 0;

  const systemPrompt   = buildSystemPrompt({ profile, calorieGoal, totalCal, totalProt, totalCarb, totalFat, remaining, dailyLog });
  const quickQuestions = buildQuickQuestions(profile, totalCal, calorieGoal, totalProt, t);

  const sendMessage = async (text) => {
    const msgText = text || input.trim();
    if (!msgText || loading) return;

    const userMessage    = { role: 'user', content: msgText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setTyping(true);

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
      setTyping(false);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      setTyping(false);
      setMessages(prev => [...prev, { role: 'assistant', content: `Fehler: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  // Motivations-Farbe basierend auf Fortschritt
  const progressColor = pct >= 100 ? 'var(--red)' : pct >= 80 ? 'var(--green-bright)' : 'var(--green)';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', height: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header — Premium Coach Identity ── */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'linear-gradient(135deg, rgba(34,197,94,0.06) 0%, transparent 60%)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Glow hinter dem Header */}
          <div style={{
            position: 'absolute', top: -40, right: -40,
            width: 120, height: 120,
            background: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Coach Avatar — Premium */}
              <div style={{
                width: 50, height: 50, borderRadius: 15, flexShrink: 0,
                background: 'linear-gradient(135deg, var(--green), var(--green-dark))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 24px rgba(34,197,94,0.4), 0 0 0 1px rgba(34,197,94,0.2)',
                position: 'relative',
              }}>
                <Bot size={22} color="#000" strokeWidth={2.5} />
                {/* Online indicator */}
                <div style={{
                  position: 'absolute', bottom: 2, right: 2,
                  width: 10, height: 10, borderRadius: '50%',
                  background: 'var(--green)',
                  border: '2px solid var(--bg-card)',
                  boxShadow: '0 0 6px rgba(34,197,94,0.8)',
                }} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
                    BuildUp Coach
                  </h2>
                  <Sparkles size={13} color="var(--green)" />
                </div>
                <p style={{ fontSize: 12, color: 'var(--green)', margin: '3px 0 0', fontWeight: 500 }}>
                  Persönlicher Coach von {displayName}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  {profile?.goal ? `${t('coach.goal_label').replace('{goal}', translateGoal(profile.goal, lang))}` : t('coach.expert')}
                </p>
              </div>
            </div>
            <button className="modal-close" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        {/* ── Tagesstatus — Kompakt aber informativ ── */}
        <div style={{
          padding: '12px 24px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-card-2)',
        }}>
          {/* Progress Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
              Tagesfortschritt
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: progressColor }}>
              {totalCal.toLocaleString()} / {calorieGoal.toLocaleString()} kcal · {pct}%
            </span>
          </div>

          {/* Progress Bar */}
          <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 100, marginBottom: 12, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 100, width: `${pct}%`,
              background: `linear-gradient(90deg, var(--green-dark), ${progressColor})`,
              transition: 'width 0.6s ease',
              boxShadow: pct > 0 ? `0 0 8px ${progressColor}60` : 'none',
            }} />
          </div>

          {/* Makros + Profil Tags */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {[
              { iconName: 'Dumbbell', label: 'Protein', value: `${totalProt}g`, color: 'var(--red)' },
              { iconName: 'Wheat', label: 'Carbs',   value: `${totalCarb}g`, color: 'var(--orange)' },
              { iconName: 'Droplets', label: 'Fette',   value: `${totalFat}g`,  color: 'var(--yellow)' },
            ].map(m => (
              <div key={m.label} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 8px', borderRadius: 100,
                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                fontSize: 11,
              }}>
                <span>{m.icon}</span>
                <span style={{ color: m.color, fontWeight: 700 }}>{m.value}</span>
              </div>
            ))}

            {/* Separator */}
            <div style={{ width: 1, height: 14, background: 'var(--border)' }} />

            {/* Profile Info */}
            {profile?.weight && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}><Scale size={11} strokeWidth={1.8} /> {profile.weight} kg</span>
            )}
            {profile?.height && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}><Ruler size={11} strokeWidth={1.8} /> {profile.height} cm</span>
            )}
            {remaining > 0 && (
              <span style={{
                fontSize: 11, padding: '2px 7px', borderRadius: 100,
                background: 'var(--green-glow)', color: 'var(--green)',
                border: '1px solid var(--border-active)', fontWeight: 600,
              }}>
                {remaining} kcal übrig
              </span>
            )}
          </div>
        </div>

        {/* ── Messages ── */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '20px 20px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex', gap: 10,
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              alignItems: 'flex-end',
              animation: 'slideUpFade 0.25s ease both',
            }}>
              {/* Avatar */}
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, var(--green-dark), var(--green))'
                  : 'var(--bg-hover)',
                border: `1px solid ${msg.role === 'user' ? 'var(--green)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: msg.role === 'user' ? '0 0 10px rgba(34,197,94,0.25)' : 'none',
              }}>
                {msg.role === 'user'
                  ? <span style={{ fontSize: 12, fontWeight: 800, color: '#000' }}>
                      {(displayName[0] || 'U').toUpperCase()}
                    </span>
                  : <Bot size={14} color="var(--green)" />}
              </div>

              {/* Bubble */}
              <div style={{
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: 'var(--radius-lg)',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, rgba(34,197,94,0.18), rgba(34,197,94,0.08))'
                  : 'var(--bg-card)',
                border: `1px solid ${msg.role === 'user' ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                fontSize: 14, lineHeight: 1.65, color: 'var(--text)',
                borderBottomRightRadius: msg.role === 'user' ? 4 : 18,
                borderBottomLeftRadius: msg.role === 'assistant' ? 4 : 18,
                whiteSpace: 'pre-wrap',
                boxShadow: msg.role === 'user' ? '0 2px 12px rgba(34,197,94,0.1)' : 'none',
              }}>
                {msg.content}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {typing && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', animation: 'slideUpFade 0.25s ease both' }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'var(--bg-hover)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Bot size={14} color="var(--green)" />
              </div>
              <div style={{
                padding: '12px 16px', borderRadius: 'var(--radius-lg)', borderBottomLeftRadius: 4,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: '50%', background: 'var(--green)',
                    animation: `typingDot 1.2s ease ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Quick Questions — nur beim Start ── */}
        {messages.length <= 1 && !loading && (
          <div style={{ padding: '8px 20px 12px' }}>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8 }}>
              Schnellfragen für dich
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {quickQuestions.map(q => (
                <button key={q} onClick={() => sendMessage(q)} style={{
                  fontSize: 12, padding: '6px 12px', borderRadius: 100,
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.color = 'var(--green)'; e.currentTarget.style.background = 'var(--green-glow)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Input ── */}
        <div style={{
          padding: '12px 20px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex', gap: 10,
          background: 'var(--bg-card)',
        }}>
          <input
            className="form-input"
            placeholder={`Frag ${displayName === 'du' ? 'mich' : 'deinen Coach'} alles über Training & Ernährung...`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            style={{ flex: 1, fontSize: 14 }}
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
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}

// ── Welcome Message — Persönlich & Motivierend ──
function buildWelcomeMessage(name, profile, calorieGoal, dailyLog) {
  const totalCal  = (dailyLog || []).reduce((s, i) => s + (i.calories || 0), 0);
  const remaining = calorieGoal - totalCal;
  const hour      = new Date().getHours();
  const greeting  = hour < 5 ? 'Gute Nacht' : hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend';
  const firstName = name === 'du' ? '' : `, ${name}`;

  // Dynamische Begrüssung basierend auf Ziel + Tageszeit
  const goalGreetings = {
    'Muskelaufbau':        `Heute ist ein neuer Tag um stärker zu werden.`,
    'Gewicht verlieren':   `Jeder Tag ist eine neue Chance.`,
    'Fit bleiben':         `Bleib konsequent — das ist der Schlüssel zum Erfolg.`,
    'Ausdauer verbessern': `Dein Körper wird sich anpassen — vertrau dem Prozess.`,
  };
  const motivLine = goalGreetings[profile?.goal] || `Bereit für heute? Ich bin hier um dir zu helfen.`;

  let msg = `${greeting}${firstName}.\n\n${motivLine}\n\n`;

  // Kontext-basierte Nachricht
  if (totalCal === 0) {
    msg += `Du hast heute noch nichts gegessen. Soll ich dir einen Ernährungsplan für heute vorschlagen?`;
  } else if (remaining > 500) {
    msg += `Du hast heute ${totalCal} kcal gegessen — noch ${remaining} kcal bis zum Ziel. Was kann ich dir empfehlen?`;
  } else if (remaining > 0) {
    msg += `Noch ${remaining} kcal bis zum Ziel. Weiter so.`;
  } else {
    msg += `Du hast dein Tagesziel von ${calorieGoal} kcal heute erreicht.`;
  }

  return msg;
}

// ── System Prompt — Coach Persönlichkeit ──
function buildSystemPrompt({ profile, calorieGoal, totalCal, totalProt, totalCarb, totalFat, remaining, dailyLog }) {
  const name = profile?.username || profile?.full_name?.split(' ')[0] || 'der User';

  let bmiInfo = '';
  if (profile?.weight && profile?.height) {
    const bmi    = (profile.weight / ((profile.height / 100) ** 2)).toFixed(1);
    const bmiCat = bmi < 18.5 ? 'Untergewicht' : bmi < 25 ? 'Normalgewicht' : bmi < 30 ? 'Übergewicht' : 'Adipositas';
    bmiInfo = `\n- BMI: ${bmi} (${bmiCat})`;
  }

  const goalStrategy = {
    'Muskelaufbau':        'Kalorienüberschuss ~300-500 kcal, hohe Proteinzufuhr (2-2.5g/kg KG), Fokus auf Krafttraining',
    'Gewicht verlieren':   'Kaloriendefizit ~300-500 kcal, moderate Proteinzufuhr (1.6-2g/kg KG), Kombination aus Kraft + Cardio',
    'Fit bleiben':         'Ausgeglichene Kalorienbilanz, gute Makroverteilung, abwechslungsreiches Training',
    'Ausdauer verbessern': 'Moderate Kalorien mit Kohlenhydratfokus, progressives Ausdauertraining',
  };
  const strategy = goalStrategy[profile?.goal] || 'Individuelle Strategie je nach Zielen';

  return `Du bist Max, der persönliche Fitness-Coach von ${name} in der BuildUp App. Du kennst ${name} und seine/ihre Daten genau.

DEINE PERSÖNLICHKEIT:
- Motivierend, direkt, ehrlich — keine leeren Floskeln
- Du sprichst ${name} immer beim Namen an
- Du machst konkrete, personalisierte Empfehlungen basierend auf den echten Daten
- Kurze, klare Antworten unter 180 Wörter — kein unnötiges Drumherum
- Manchmal humorvoll, immer professionell
- Antworte immer auf Deutsch

PROFIL VON ${name.toUpperCase()}:
- Ziel: ${profile?.goal || 'Nicht gesetzt'}
- Gewicht: ${profile?.weight ? `${profile.weight} kg` : 'Nicht angegeben'}
- Grösse: ${profile?.height ? `${profile.height} cm` : 'Nicht angegeben'}${bmiInfo}
- Strategie: ${strategy}

HEUTIGE STATS (${new Date().toLocaleDateString('de-DE')}):
- Kalorien: ${totalCal} / ${calorieGoal} kcal (${Math.round((totalCal/calorieGoal)*100)}%)
- Verbleibend: ${remaining > 0 ? `${remaining} kcal` : `${Math.abs(remaining)} kcal über Ziel`}
- Protein: ${totalProt}g | Carbs: ${totalCarb}g | Fette: ${totalFat}g
- Mahlzeiten: ${(dailyLog || []).length > 0 ? dailyLog.map(i => i.name).join(', ') : 'Noch keine'}

DEIN FACHWISSEN: Makros, Kalorien, Muskelaufbau, Gewichtsabnahme, Krafttraining, Cardio, HIIT, Supplements, Regeneration, Trainingspläne aller Level. Bei themenfremden Fragen freundlich auf Fitness & Ernährung hinweisen.`;
}

// ── Quick Questions — Personalisiert ──
function buildQuickQuestions(profile, totalCal, calorieGoal, totalProt, t) {
  const questions = [];
  const remaining = calorieGoal - totalCal;

  if (profile?.goal === 'Muskelaufbau') {
    questions.push('Wie viel Protein brauche ich täglich?');
    questions.push('Was sind die besten Übungen für Muskelaufbau?');
  } else if (profile?.goal === 'Gewicht verlieren') {
    questions.push('Wie erstelle ich ein Kaloriendefizit?');
    questions.push('Welches Training verbrennt am meisten Kalorien?');
  } else {
    questions.push(t('coach.q1'));
    questions.push(t('coach.q2'));
  }

  if (totalCal === 0) {
    questions.push(t('coach.q3'));
  } else if (remaining > 200) {
    questions.push(`Noch ${remaining} kcal übrig — was empfiehlst du?`);
  }

  if (totalProt < 50) questions.push(t('coach.q4'));

  if (profile?.weight && profile?.height) {
    questions.push(t('coach.q5'));
  } else {
    questions.push('Wie viel Wasser sollte ich täglich trinken?');
  }

  questions.push(t('coach.q6'));

  return questions.slice(0, 6);
}
