import { useState, useEffect } from 'react';
import { Plus, Minus, Droplets, Trophy } from 'lucide-react';

const WATER_GOAL = 8; // Gläser
const ML_PER_GLASS = 250;

export default function WaterTracker({ waterGlasses, setWaterGlasses }) {
  const [animating, setAnimating] = useState(false);
  const [lastAction, setLastAction] = useState(null);

  const pct = Math.min((waterGlasses / WATER_GOAL) * 100, 100);
  const totalMl = waterGlasses * ML_PER_GLASS;
  const remaining = Math.max(0, WATER_GOAL - waterGlasses);
  const done = waterGlasses >= WATER_GOAL;

  const getWaterColor = () => {
    if (pct >= 100) return '#22c55e';
    if (pct >= 75)  return '#60a5fa';
    if (pct >= 50)  return '#38bdf8';
    if (pct >= 25)  return '#7dd3fc';
    return '#93c5fd';
  };

  const addGlass = () => {
    if (waterGlasses >= WATER_GOAL) return;
    setLastAction('add');
    setAnimating(true);
    setWaterGlasses(g => Math.min(g + 1, WATER_GOAL));
    setTimeout(() => setAnimating(false), 400);
  };

  const removeGlass = () => {
    if (waterGlasses <= 0) return;
    setLastAction('remove');
    setWaterGlasses(g => Math.max(g - 1, 0));
  };

  const waterColor = getWaterColor();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Visual Water Container */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>

        {/* Animated Glass */}
        <div style={{
          width: 70, height: 90, position: 'relative',
          flexShrink: 0, cursor: 'pointer',
        }} onClick={addGlass}>
          {/* Glass outline */}
          <svg viewBox="0 0 70 90" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            {/* Glass body */}
            <path d="M8,8 L62,8 L55,82 L15,82 Z"
              fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
            {/* Water fill */}
            <clipPath id="glassClip">
              <path d="M8,8 L62,8 L55,82 L15,82 Z" />
            </clipPath>
            {/* Animated water */}
            <g clipPath="url(#glassClip)">
              {/* Water body */}
              <rect
                x="0" y={8 + (74 * (1 - pct / 100))}
                width="70" height={74 * (pct / 100) + 10}
                fill={waterColor}
                opacity="0.25"
                style={{ transition: 'y 0.5s ease, height 0.5s ease' }}
              />
              {/* Wave */}
              {pct > 0 && (
                <path
                  d={`M0,${8 + (74 * (1 - pct / 100))} Q17.5,${8 + (74 * (1 - pct / 100)) - 4} 35,${8 + (74 * (1 - pct / 100))} Q52.5,${8 + (74 * (1 - pct / 100)) + 4} 70,${8 + (74 * (1 - pct / 100))} L70,90 L0,90 Z`}
                  fill={waterColor}
                  opacity="0.5"
                  style={{ transition: 'all 0.5s ease' }}
                >
                  <animate
                    attributeName="d"
                    dur="2s"
                    repeatCount="indefinite"
                    values={`
                      M0,${8 + (74 * (1 - pct / 100))} Q17.5,${8 + (74 * (1 - pct / 100)) - 4} 35,${8 + (74 * (1 - pct / 100))} Q52.5,${8 + (74 * (1 - pct / 100)) + 4} 70,${8 + (74 * (1 - pct / 100))} L70,90 L0,90 Z;
                      M0,${8 + (74 * (1 - pct / 100))} Q17.5,${8 + (74 * (1 - pct / 100)) + 4} 35,${8 + (74 * (1 - pct / 100))} Q52.5,${8 + (74 * (1 - pct / 100)) - 4} 70,${8 + (74 * (1 - pct / 100))} L70,90 L0,90 Z;
                      M0,${8 + (74 * (1 - pct / 100))} Q17.5,${8 + (74 * (1 - pct / 100)) - 4} 35,${8 + (74 * (1 - pct / 100))} Q52.5,${8 + (74 * (1 - pct / 100)) + 4} 70,${8 + (74 * (1 - pct / 100))} L70,90 L0,90 Z
                    `}
                  />
                </path>
              )}
            </g>
            {/* Glass border */}
            <path d="M8,8 L62,8 L55,82 L15,82 Z"
              fill="none" stroke={done ? waterColor : 'rgba(255,255,255,0.15)'} strokeWidth="1.5" />
            {/* Percentage text */}
            <text x="35" y="50" textAnchor="middle" fill="white"
              fontSize="13" fontWeight="800" style={{ fontFamily: 'Inter, sans-serif' }}>
              {Math.round(pct)}%
            </text>
          </svg>
        </div>

        {/* Stats */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 900, color: waterColor, letterSpacing: '-1px', lineHeight: 1 }}>
                {totalMl} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>ml</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3 }}>
                {done ? '🎯 Tagesziel erreicht!' : `${remaining * ML_PER_GLASS} ml noch übrig`}
              </div>
            </div>
            {done && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 11, fontWeight: 700, color: '#22c55e',
                background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
                padding: '3px 8px', borderRadius: 100,
              }}>
                <Trophy size={10} /> Ziel!
              </div>
            )}
          </div>

          {/* Glass dots */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {Array.from({ length: WATER_GOAL }, (_, i) => (
              <button
                key={i}
                onClick={() => {
                  if (i < waterGlasses) {
                    setWaterGlasses(i);
                  } else {
                    setWaterGlasses(i + 1);
                  }
                }}
                style={{
                  width: 28, height: 28, borderRadius: 8,
                  border: `1px solid ${i < waterGlasses ? waterColor : 'var(--border)'}`,
                  background: i < waterGlasses ? `${waterColor}22` : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  transform: animating && i === waterGlasses - 1 && lastAction === 'add' ? 'scale(1.2)' : 'scale(1)',
                }}
              >
                <Droplets size={12} color={i < waterGlasses ? waterColor : 'var(--border)'} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: `linear-gradient(90deg, ${waterColor}, ${done ? '#22c55e' : waterColor})`,
          borderRadius: 100, transition: 'width 0.5s ease',
          boxShadow: pct > 0 ? `0 0 8px ${waterColor}60` : 'none',
        }} />
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={removeGlass}
          disabled={waterGlasses <= 0}
          style={{
            width: 36, height: 36, borderRadius: 9,
            background: 'var(--bg-card-2)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: waterGlasses <= 0 ? 'not-allowed' : 'pointer',
            opacity: waterGlasses <= 0 ? 0.3 : 1, transition: 'all 0.15s ease',
            color: 'var(--text-muted)',
          }}
        >
          <Minus size={14} />
        </button>

        <button
          onClick={addGlass}
          disabled={done}
          className="btn btn-secondary btn-sm"
          style={{
            flex: 1, justifyContent: 'center',
            border: done ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--border)',
            color: done ? '#22c55e' : 'var(--text)',
            background: done ? 'rgba(34,197,94,0.08)' : 'var(--bg-card-2)',
          }}
        >
          <Droplets size={13} color={done ? '#22c55e' : waterColor} />
          {done ? 'Tagesziel erreicht ✓' : `+ Glas hinzufügen (${waterGlasses}/${WATER_GOAL})`}
        </button>
      </div>

      {/* Hydration tip */}
      <div style={{
        fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.6,
        padding: '8px 12px', background: 'rgba(96,165,250,0.05)',
        border: '1px solid rgba(96,165,250,0.1)', borderRadius: 8,
      }}>
        💡 {waterGlasses === 0
          ? 'Starte deinen Tag mit einem Glas Wasser!'
          : done
          ? 'Perfekt! Ausreichend Wasser fördert Konzentration und Stoffwechsel.'
          : `Noch ${remaining} Glas${remaining !== 1 ? 'er' : ''} bis zum Tagesziel. Gut gemacht!`}
      </div>
    </div>
  );
}
