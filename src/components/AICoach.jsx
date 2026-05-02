import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Loader } from 'lucide-react';

export default function AICoach({ onClose, dailyLog, calorieGoal, profile }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hallo${profile?.username ? ` ${profile.username}` : ''}! 👋 Ich bin dein persönlicher BuildUp Coach. Ich kenne deine heutigen Daten und helfe dir bei allen Fragen zu Ernährung, Training und Sport. Was möchtest du wissen?`
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

  const systemPrompt = `Du bist ein erfahrener, freundlicher und motivierender Personal Trainer und Ernährungscoach in der BuildUp App. Du hast umfassendes Wissen über:

ERNÄHRUNG:
- Makronährstoffe (Protein, Kohlenhydrate, Fette) und ihre Funktionen
- Kalorienmanagement, Diäten, Gewichtsabnahme und Muskelaufbau
- Supplements, Vitamine und Mineralstoffe
- Meal Prep, gesunde Rezepte und Ernährungsplanung
- Spezielle Ernährungsformen (Vegane, Keto, Intermittent Fasting etc.)

TRAINING & SPORT:
- Krafttraining, Hypertrophie, Muskelaufbau
- Cardio, HIIT, Ausdauertraining
- Yoga, Stretching, Mobilität und Flexibilität
- Alle Sportarten: Fussball, Basketball, Schwimmen, Kampfsport, Radfahren etc.
- Trainingspläne für Anfänger bis Fortgeschrittene
- Verletzungsprävention und Regeneration
- Sporttechniken und Taktiken

GESUNDHEIT & LIFESTYLE:
- Schlaf und Regeneration
- Stressmanagement und mentale Gesundheit
- Körperzusammensetzung und Fitness-Tests
- Motivation und Zielsetzung

Nutzerdaten heute:
- Ziel: ${profile?.goal || 'Nicht gesetzt'}
- Kalorienziel: ${calorieGoal} kcal
- Gegessen: ${totalCal} kcal
- Noch übrig: ${remaining} kcal
- Protein: ${totalProt}g
- Kohlenhydrate: ${totalCarb}g
- Fette: ${totalFat}g
- Mahlzeiten heute: ${dailyLog.length > 0 ? dailyLog.map(i => i.name).join(', ') : 'Noch nichts gegessen'}

Antworte immer auf Deutsch, präzise und motivierend. Nutze die Nutzerdaten wenn relevant. Bei komplett themenfremden Fragen erkläre freundlich dass du ein Fitness und Ernährungscoach bist. Halte Antworten unter 200 Wörtern. Erwähne nie dass du eine KI bist – du bist der BuildUp Coach.`;

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input.trim() };
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
          max_tokens: 400,
          system: systemPrompt,
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content
          })),
        }),
      });

      const data = await response.json();

      if (data.error) throw new Error(typeof data.error === 'object' ? JSON.stringify(data.error) : data.error);

      const reply = data.content?.[0]?.text || 'Entschuldigung, keine Antwort erhalten.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Fehler: ${e.message}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    'Was soll ich heute noch essen?',
    'Wie viel Protein fehlt mir noch?',
    'Gib mir einen Trainingsplan für Anfänger',
    'Wie ist mein heutiger Fortschritt?',
    'Was sind die besten Übungen für Bauch?',
    'Wie viel Wasser sollte ich trinken?',
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal"
        style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', height: '80vh' }}
        onClick={e => e.stopPropagation()}>

        <div className="modal-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 20 }}>
          <div className="modal-header-inner">
            <div style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: 'linear-gradient(135deg, var(--green), var(--green-dark))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 18px rgba(34,197,94,0.4)',
            }}>
              <Bot size={20} color="#000" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="modal-title">BuildUp Coach</h2>
              <p style={{ fontSize: 12, color: 'var(--green)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
                Online – Ernährung, Training & Sport
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
          padding: '14px 28px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-card-2)'
        }}>
          {[
            { label: 'Kalorien', value: totalCal,  unit: 'kcal', color: 'var(--green)' },
            { label: 'Protein',  value: totalProt, unit: 'g',    color: '#ef4444' },
            { label: 'Carbs',    value: totalCarb, unit: 'g',    color: '#f97316' },
            { label: 'Fette',    value: totalFat,  unit: 'g',    color: '#eab308' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: s.color }}>
                {s.value}<span style={{ fontSize: 10 }}>{s.unit}</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{
          flex: 1, overflowY: 'auto', padding: '20px 28px',
          display: 'flex', flexDirection: 'column', gap: 16
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex', gap: 10,
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              alignItems: 'flex-start'
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: msg.role === 'user' ? 'var(--green-glow)' : 'var(--bg-card-2)',
                border: `1px solid ${msg.role === 'user' ? 'var(--border-active)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {msg.role === 'user'
                  ? <User size={14} color="var(--green)" />
                  : <Bot size={14} color="var(--text-secondary)" />}
              </div>
              <div style={{
                maxWidth: '75%', padding: '12px 16px', borderRadius: 14,
                background: msg.role === 'user' ? 'var(--green-glow)' : 'var(--bg-card)',
                border: `1px solid ${msg.role === 'user' ? 'var(--border-active)' : 'var(--border)'}`,
                fontSize: 13.5, lineHeight: 1.6, color: 'var(--text)',
                borderTopRightRadius: msg.role === 'user' ? 4 : 14,
                borderTopLeftRadius: msg.role === 'assistant' ? 4 : 14,
              }}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'var(--bg-card-2)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Bot size={14} color="var(--text-secondary)" />
              </div>
              <div style={{
                padding: '12px 16px', borderRadius: 14, borderTopLeftRadius: 4,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 8
              }}>
                <Loader size={14} color="var(--green)" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Coach tippt...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {messages.length <= 1 && (
          <div style={{ padding: '0 28px 12px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {quickQuestions.map(q => (
              <button key={q} className="chip" style={{ fontSize: 12 }}
                onClick={() => setInput(q)}>
                {q}
              </button>
            ))}
          </div>
        )}

        <div style={{
          padding: '16px 28px 24px',
          borderTop: '1px solid var(--border)',
          display: 'flex', gap: 10
        }}>
          <input
            className="form-input"
            placeholder="Frage deinen Coach..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary"
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            style={{ padding: '10px 16px', flexShrink: 0 }}>
            <Send size={15} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}