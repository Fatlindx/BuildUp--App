import { useState, useMemo, useEffect } from "react";
import { Search, X, Plus, Trash2, Droplets, Lightbulb, Target, Leaf, ScanLine, Clock, Star, Zap } from "lucide-react";
import { foodDatabase, foodCategories } from "../data/foods";
import BarcodeScanner from "./BarcodeScanner";
import WaterTracker from "./WaterTracker";

function ProgressBar({ value, max, color, height = 7 }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="progress-bar-track" style={{ height }}>
      <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color, transition: 'width 0.6s ease' }} />
    </div>
  );
}

function MacroRow({ label, value, goal, unit, color }) {
  return (
    <div>
      <div className="progress-bar-label">
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
          {label}
        </span>
        <span style={{ fontWeight: 600, color }}>
          {value}{unit}
          {goal > 0 && <span style={{ color: "var(--text-muted)", fontWeight: 400 }}> / {goal}{unit}</span>}
        </span>
      </div>
      <ProgressBar value={value} max={goal || 100} color={color} />
    </div>
  );
}

// P5: Letzte Mahlzeiten aus sessionStorage
function getRecentFoods() {
  try {
    return JSON.parse(sessionStorage.getItem('recent_foods') || '[]');
  } catch { return []; }
}

function saveRecentFood(food) {
  try {
    const recent = getRecentFoods();
    const filtered = recent.filter(f => f.id !== food.id);
    const updated = [food, ...filtered].slice(0, 6);
    sessionStorage.setItem('recent_foods', JSON.stringify(updated));
  } catch {}
}

export default function NutritionTracker({ calorieGoal, setCalorieGoal, dailyLog, setDailyLog }) {
  const [search, setSearch]               = useState("");
  const [filterCat, setFilterCat]         = useState("Alle");
  const [selectedFood, setSelectedFood]   = useState(null);
  const [qty, setQty]                     = useState("1");
  const [manualGoal, setManualGoal]       = useState("");
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [showScanner, setShowScanner]     = useState(false);
  const [recentFoods, setRecentFoods]     = useState(getRecentFoods);
  const [addedId, setAddedId]             = useState(null); // P5: Success feedback

  const [waterGlasses, setWaterGlasses] = useState(() => {
    const saved = sessionStorage.getItem('water_glasses');
    return saved ? parseInt(saved) : 0;
  });

  useEffect(() => {
    sessionStorage.setItem('water_glasses', String(waterGlasses));
  }, [waterGlasses]);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    return foodDatabase.filter(f => {
      const matchSearch = !q || f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q);
      const matchCat = filterCat === "Alle" || f.category === filterCat;
      return matchSearch && matchCat;
    }).slice(0, 12);
  }, [search, filterCat]);

  const showResults = search.trim().length > 0 || filterCat !== "Alle";

  const totals = useMemo(() => ({
    calories: dailyLog.reduce((s, i) => s + (i.calories || 0), 0),
    protein:  dailyLog.reduce((s, i) => s + (i.protein  || 0), 0),
    carbs:    dailyLog.reduce((s, i) => s + (i.carbs    || 0), 0),
    fat:      dailyLog.reduce((s, i) => s + (i.fat      || 0), 0),
  }), [dailyLog]);

  const goalProtein = calorieGoal > 0 ? Math.round((calorieGoal * 0.30) / 4) : 0;
  const goalCarbs   = calorieGoal > 0 ? Math.round((calorieGoal * 0.45) / 4) : 0;
  const goalFat     = calorieGoal > 0 ? Math.round((calorieGoal * 0.25) / 9) : 0;
  const remaining   = calorieGoal > 0 ? calorieGoal - totals.calories : null;
  const pct         = calorieGoal > 0 ? Math.min(100, Math.round((totals.calories / calorieGoal) * 100)) : 0;

  const selectFood = (food) => {
    setSelectedFood(food);
    setQty("1");
    setSearch("");
    setFilterCat("Alle");
  };

  const q = parseFloat(qty) || 1;
  const preview = selectedFood ? {
    cal:  Math.round(selectedFood.calories * q),
    prot: Math.round(selectedFood.protein  * q),
    carb: Math.round(selectedFood.carbs    * q),
    fat:  Math.round(selectedFood.fat      * q),
  } : null;

  const addToLog = (foodOverride) => {
    const food = foodOverride || selectedFood;
    if (!food || q <= 0) return;
    const entry = {
      id: Date.now(), name: food.name, category: food.category,
      serving: food.serving,
      calories: Math.round(food.calories * (foodOverride ? 1 : q)),
      protein:  Math.round(food.protein  * (foodOverride ? 1 : q)),
      carbs:    Math.round(food.carbs    * (foodOverride ? 1 : q)),
      fat:      Math.round(food.fat      * (foodOverride ? 1 : q)),
    };
    setDailyLog(log => [...log, entry]);

    // P5: Update recent foods
    saveRecentFood(food);
    setRecentFoods(getRecentFoods());

    // P5: Success flash
    setAddedId(food.id);
    setTimeout(() => setAddedId(null), 1200);

    if (!foodOverride) { setSelectedFood(null); setQty("1"); }
  };

  const removeEntry = (id) => setDailyLog(log => log.filter(i => i.id !== id));

  const saveManualGoal = () => {
    const g = parseInt(manualGoal);
    if (g > 0) { setCalorieGoal(g); setShowGoalInput(false); setManualGoal(""); }
  };

  const getCatColor = (cat) => {
    const map = {
      "Frühstück": "#fb923c", "Hauptgericht": "#3b82f6",
      "Snack": "#22c55e", "Getränk": "#60a5fa",
      "Fitness Meal": "#a855f7", "Gescannt": "#22c55e",
    };
    return map[cat] || "#64748b";
  };

  // P5: Favoriten zuerst — häufig geloggte Mahlzeiten
  const frequentFoods = useMemo(() => {
    const freq = {};
    dailyLog.forEach(item => { freq[item.name] = (freq[item.name] || 0) + 1; });
    return Object.entries(freq)
      .sort(([,a],[,b]) => b - a)
      .slice(0, 4)
      .map(([name]) => foodDatabase.find(f => f.name === name))
      .filter(Boolean);
  }, [dailyLog]);

  return (
    <div className="page">
      <div className="tracker-container">
        <div className="tracker-header">
          <h1>Ernährungs-Tracker</h1>
          <p>Verfolge Kalorien und Makronährstoffe aus 205+ Lebensmitteln.</p>
        </div>

        {/* P5: Tages-Status Bar — sofort sichtbar oben */}
        {calorieGoal > 0 && (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '14px 16px', marginBottom: 20,
          }}>
            {/* Top row: Kalorien + Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                {totals.calories.toLocaleString()} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/ {calorieGoal.toLocaleString()} kcal</span>
              </span>
              <span style={{
                fontSize: 11.5, fontWeight: 700, padding: '2px 10px', borderRadius: 100,
                color: pct >= 100 ? '#ef4444' : 'var(--green)',
                background: pct >= 100 ? 'rgba(239,68,68,0.1)' : 'var(--green-glow)',
                border: `1px solid ${pct >= 100 ? 'rgba(239,68,68,0.3)' : 'var(--border-active)'}`,
                whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {pct}% · {remaining !== null && remaining > 0 ? `${remaining} kcal übrig` : 'Tagesziel erreicht'}
              </span>
            </div>
            {/* Progress bar */}
            <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{
                height: '100%', width: `${pct}%`, borderRadius: 100,
                background: pct >= 100 ? '#ef4444' : 'linear-gradient(90deg, var(--green-dark), var(--green))',
                transition: 'width 0.6s ease',
                boxShadow: pct > 0 ? '0 0 8px rgba(34,197,94,0.4)' : 'none',
              }} />
            </div>
            {/* Makros row */}
            <div style={{ display: 'flex', gap: 16 }}>
              {[
                { label: 'Protein', value: totals.protein, color: '#ef4444' },
                { label: 'Carbs',   value: totals.carbs,   color: '#f97316' },
                { label: 'Fette',   value: totals.fat,     color: '#eab308' },
              ].map(m => (
                <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.value}g</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="tracker-layout">
          <div>
            {/* Mahlzeit hinzufügen */}
            <div className="tracker-card">
              <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Plus size={16} /> Mahlzeit hinzufügen
                </span>
                <button className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={() => setShowScanner(true)}>
                  <ScanLine size={14} /> Barcode scannen
                </button>
              </h3>

              {/* P5: Zuletzt gegessen — oben sichtbar ohne Suche */}
              {!selectedFood && !showResults && (
                <>
                  {recentFoods.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Clock size={12} color="var(--text-muted)" />
                        <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                          Zuletzt gegessen
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {recentFoods.map(food => (
                          <div key={food.id} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '9px 12px', borderRadius: 10,
                            background: addedId === food.id ? 'rgba(34,197,94,0.1)' : 'var(--bg-card-2)',
                            border: `1px solid ${addedId === food.id ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                            cursor: 'pointer', transition: 'all 0.2s ease',
                          }}
                          onClick={() => selectFood(food)}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{food.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{food.serving}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700 }}>{food.calories} kcal</span>
                              <button
                                onClick={e => { e.stopPropagation(); addToLog(food); }}
                                style={{
                                  width: 28, height: 28, borderRadius: 8,
                                  background: 'var(--green-glow)', border: '1px solid var(--border-active)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  cursor: 'pointer', color: 'var(--green)',
                                  transition: 'all 0.15s ease',
                                }}
                                title="Direkt hinzufügen"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* P5: Häufig gegessen (aus heutigem Log) */}
                  {frequentFoods.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Star size={12} color="var(--text-muted)" />
                        <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                          Häufig gegessen
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {frequentFoods.map(f => (
                          <button key={f.id} onClick={() => selectFood(f)} style={{
                            fontSize: 12, padding: '5px 11px', borderRadius: 100,
                            background: 'var(--bg-card-2)', border: '1px solid var(--border)',
                            color: 'var(--green)', cursor: 'pointer', fontWeight: 600,
                            transition: 'all 0.15s ease',
                          }}>
                            {f.name.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Kategorie Filter */}
              <div className="category-filter-chips">
                {foodCategories.map(cat => (
                  <button key={cat} className={`category-chip ${filterCat === cat ? "active" : ""}`}
                    onClick={() => { setFilterCat(cat); setSelectedFood(null); }}>
                    {cat}
                  </button>
                ))}
              </div>

              {/* Suche */}
              <div className="food-search-wrap">
                <div className="food-search-input-row" style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>
                    <Search size={15} />
                  </span>
                  <input className="form-input" type="text"
                    placeholder="Lebensmittel suchen..."
                    value={search} style={{ paddingLeft: 36 }}
                    onChange={e => { setSearch(e.target.value); setSelectedFood(null); }}
                  />
                  {(search || filterCat !== "Alle") && (
                    <button className="btn btn-ghost btn-sm" style={{ padding: "10px 12px" }}
                      onClick={() => { setSearch(""); setFilterCat("Alle"); setSelectedFood(null); }}>
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Suchergebnisse */}
              {showResults && (searchResults.length > 0 ? (
                <div className="food-results">
                  {searchResults.map(food => (
                    <div key={food.id} className="food-result-item" onClick={() => selectFood(food)}
                      style={{
                        background: addedId === food.id ? 'rgba(34,197,94,0.08)' : undefined,
                        transition: 'background 0.3s ease',
                      }}>
                      <div>
                        <div className="food-result-name">{food.name}</div>
                        <div className="food-result-meta">{food.serving} — P: {food.protein}g / K: {food.carbs}g / F: {food.fat}g</div>
                      </div>
                      <div className="food-result-right">
                        <div className="food-result-cals">{food.calories} kcal</div>
                        <div className="food-result-cat" style={{ color: getCatColor(food.category) }}>{food.category}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <div className="no-food-found">Kein Lebensmittel gefunden.</div>)}

              {/* Portion auswählen */}
              {selectedFood && (
                <div className="portion-row">
                  <div className="form-group">
                    <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      <strong style={{ color: "var(--text)" }}>{selectedFood.name}</strong>
                      <span style={{ color: "var(--text-muted)", marginLeft: 6 }}>({selectedFood.serving})</span>
                    </label>
                    <input className="form-input" type="number" min="0.25" step="0.25"
                      placeholder="Portionen" value={qty}
                      onChange={e => setQty(e.target.value)} autoFocus />
                    {preview && (
                      <span style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                        = {preview.cal} kcal — P: {preview.prot}g / K: {preview.carb}g / F: {preview.fat}g
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => addToLog()}>
                      <Plus size={14} /> Hinzufügen
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedFood(null); setQty("1"); }}>
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}

              {/* Schnellzugriff */}
              {!selectedFood && !search && filterCat === "Alle" && recentFoods.length === 0 && (
                <div className="quick-add-section">
                  <div className="quick-add-label">Schnellzugriff:</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {[0, 5, 35, 55, 147, 171].map(i => foodDatabase[i]).filter(Boolean).map(f => (
                      <button key={f.id} className="chip" onClick={() => selectFood(f)}>
                        {f.name.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tagesprotokoll */}
            <div className="tracker-card">
              <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                Tagesprotokoll
                {dailyLog.length > 0 && (
                  <span style={{ marginLeft: "auto", fontSize: 12.5, color: "var(--text-muted)", fontWeight: 400 }}>
                    {dailyLog.length} {dailyLog.length === 1 ? "Eintrag" : "Einträge"}
                  </span>
                )}
              </h3>
              {dailyLog.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><Leaf size={38} strokeWidth={1.2} color="var(--text-muted)" /></div>
                  <p>Noch keine Mahlzeiten eingetragen.</p>
                  <p className="empty-hint">Nutze die Schnellzugriff-Buttons oder suche oben.</p>
                </div>
              ) : (
                <>
                  <div className="log-list">
                    {dailyLog.map((item, idx) => (
                      <div key={item.id} className="log-item" style={{
                        animation: `slideUpFade 0.25s ${idx * 0.04}s ease both`,
                      }}>
                        <div className="log-item-dot" style={{ background: getCatColor(item.category) }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="log-item-name">{item.name}</div>
                          <div className="log-item-portion">{item.serving || "1 Portion"}</div>
                        </div>
                        <div className="log-item-macros">P: {item.protein}g / K: {item.carbs}g / F: {item.fat}g</div>
                        <div className="log-item-cals">{item.calories} kcal</div>
                        <button className="log-delete" onClick={() => removeEntry(item.id)}>
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                    <div className="log-total">
                      <span>Gesamt</span>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 400 }}>
                        P: {totals.protein}g / K: {totals.carbs}g / F: {totals.fat}g
                      </span>
                      <span style={{ color: "var(--green)" }}>{totals.calories} kcal</span>
                    </div>
                  </div>
                  <div style={{ marginTop: 14, textAlign: "right" }}>
                    <button className="btn btn-danger btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                      onClick={() => setDailyLog([])}>
                      <Trash2 size={13} /> Alle löschen
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div>
            <div className="tracker-card">
              <h3>Kalorienübersicht</h3>
              {calorieGoal > 0 ? (
                <>
                  <div className="calories-ring">
                    <div className="ring-value">{totals.calories.toLocaleString()}</div>
                    <div className="ring-label">von {calorieGoal.toLocaleString()} kcal</div>
                    <div className="ring-remaining" style={{ color: remaining >= 0 ? "var(--green)" : "#f87171" }}>
                      {remaining >= 0
                        ? `${remaining.toLocaleString()} kcal übrig`
                        : `${Math.abs(remaining).toLocaleString()} kcal überschritten`}
                    </div>
                  </div>
                  <ProgressBar value={totals.calories} max={calorieGoal}
                    color={totals.calories <= calorieGoal ? "var(--green)" : "#f87171"} height={8} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--text-muted)", marginTop: 7 }}>
                    <span>0</span>
                    <span style={{ fontWeight: 600 }}>{pct}%</span>
                    <span>{calorieGoal.toLocaleString()} kcal</span>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <Target size={34} strokeWidth={1.2} color="var(--text-muted)" style={{ marginBottom: 8 }} />
                  <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
                    Kein Tagesziel gesetzt.<br />Nutze den Rechner oder setze es manuell.
                  </p>
                </div>
              )}
              <div className="section-divider" />
              {!showGoalInput ? (
                <button className="btn btn-secondary btn-sm" style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => setShowGoalInput(true)}>
                  {calorieGoal > 0 ? "Ziel anpassen" : "+ Ziel manuell setzen"}
                </button>
              ) : (
                <div style={{ display: "flex", gap: 7 }}>
                  <input className="form-input" type="number" placeholder="kcal Ziel" value={manualGoal}
                    onChange={e => setManualGoal(e.target.value)} style={{ flex: 1 }}
                    onKeyDown={e => e.key === "Enter" && saveManualGoal()} autoFocus />
                  <button className="btn btn-primary btn-sm" onClick={saveManualGoal}>OK</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowGoalInput(false)}><X size={14} /></button>
                </div>
              )}
            </div>

            <div className="tracker-card">
              <h3>Makronährstoffe</h3>
              <div className="macro-bars">
                <MacroRow label="Protein"       value={totals.protein} goal={goalProtein} unit="g" color="#ef4444" />
                <MacroRow label="Kohlenhydrate" value={totals.carbs}   goal={goalCarbs}   unit="g" color="#f97316" />
                <MacroRow label="Fette"         value={totals.fat}     goal={goalFat}     unit="g" color="#eab308" />
              </div>
            </div>

            <div className="tracker-card">
              <h3><Droplets size={16} color="#60a5fa" /> Wassertracker</h3>
              <WaterTracker waterGlasses={waterGlasses} setWaterGlasses={setWaterGlasses} />
            </div>

            <div className="tip-box" style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Lightbulb size={16} color="var(--green)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>Trinke täglich 2–3 Liter Wasser für optimale Leistung und Fettstoffwechsel.</span>
            </div>
          </div>
        </div>
      </div>

      {showScanner && (
        <BarcodeScanner
          onAddFood={(food) => { setDailyLog(log => [...log, food]); setShowScanner(false); }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
