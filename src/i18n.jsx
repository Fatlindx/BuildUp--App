// ─── BuildUp i18n System ──────────────────────────────────────────────────────
// Zentrale i18n Logik — keine externen Bibliotheken, kein Overhead
// Sprachen: de (Standard), en, fr, es

import { createContext, useContext, useState, useEffect } from 'react';
import { de } from './locales/de.js';
import { en } from './locales/en.js';
import { fr } from './locales/fr.js';
import { es } from './locales/es.js';

const LOCALES = { de, en, fr, es };
const STORAGE_KEY = 'buildup_lang';
const DEFAULT_LANG = 'de';

// Context
export const I18nContext = createContext(null);

// Provider
export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return LOCALES[saved] ? saved : DEFAULT_LANG;
    } catch { return DEFAULT_LANG; }
  });

  function setLang(newLang) {
    if (!LOCALES[newLang]) return;
    setLangState(newLang);
    try { localStorage.setItem(STORAGE_KEY, newLang); } catch {}
  }

  // t(key) — Übersetzung abrufen, Fallback auf Deutsch
  function t(key) {
    const keys = key.split('.');
    let val = LOCALES[lang];
    let fallback = LOCALES[DEFAULT_LANG];
    for (const k of keys) {
      val = val?.[k];
      fallback = fallback?.[k];
    }
    return val ?? fallback ?? key;
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t, languages: Object.keys(LOCALES) }}>
      {children}
    </I18nContext.Provider>
  );
}

// Hook
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

// Sprach-Labels
export const LANG_LABELS = {
  de: 'Deutsch',
  en: 'English',
  fr: 'Français',
  es: 'Español',
};

// ─── Mapping Layer — interne Werte → übersetzt ────────────────────────────────
// DB-Werte bleiben stabil, nur Anzeige wird übersetzt

export const GOAL_KEYS = {
  muscle:               { de: 'Muskelaufbau',      en: 'Build Muscle',   fr: 'Prise de muscle',  es: 'Ganar músculo' },
  Muskelaufbau:         { de: 'Muskelaufbau',      en: 'Build Muscle',   fr: 'Prise de muscle',  es: 'Ganar músculo' },
  lose_weight:          { de: 'Gewicht verlieren', en: 'Lose Weight',    fr: 'Perdre du poids',  es: 'Perder peso' },
  'Gewicht verlieren':  { de: 'Gewicht verlieren', en: 'Lose Weight',    fr: 'Perdre du poids',  es: 'Perder peso' },
  fit:                  { de: 'Fit bleiben',       en: 'Stay Fit',       fr: 'Rester en forme',  es: 'Mantenerse en forma' },
  'Fit bleiben':        { de: 'Fit bleiben',       en: 'Stay Fit',       fr: 'Rester en forme',  es: 'Mantenerse en forma' },
  endurance:            { de: 'Ausdauer',          en: 'Endurance',      fr: 'Endurance',        es: 'Resistencia' },
  'Ausdauer verbessern':{ de: 'Ausdauer',          en: 'Endurance',      fr: 'Endurance',        es: 'Resistencia' },
};

export function translateGoal(goalKey, lang = DEFAULT_LANG) {
  return GOAL_KEYS[goalKey]?.[lang] ?? GOAL_KEYS[goalKey]?.de ?? goalKey ?? '—';
}

export const ACTIVITY_KEYS = {
  sedentary:     { de: 'Wenig aktiv',    en: 'Sedentary',       fr: 'Sédentaire',       es: 'Sedentario' },
  light:         { de: 'Leicht aktiv',   en: 'Lightly active',  fr: 'Légèrement actif', es: 'Ligeramente activo' },
  moderate:      { de: 'Mässig aktiv',   en: 'Moderately active',fr:'Modérément actif', es: 'Moderadamente activo' },
  active:        { de: 'Sehr aktiv',     en: 'Very active',     fr: 'Très actif',       es: 'Muy activo' },
  extra_active:  { de: 'Extrem aktiv',   en: 'Extra active',    fr: 'Extrêmement actif',es: 'Extremadamente activo' },
};

export function translateActivity(key, lang = DEFAULT_LANG) {
  return ACTIVITY_KEYS[key]?.[lang] ?? key;
}
