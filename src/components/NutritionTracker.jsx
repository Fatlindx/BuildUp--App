import { useState, useMemo } from "react";
import { Search, X, Plus, Trash2, Droplets, Lightbulb, Target, Leaf, ScanLine } from "lucide-react";
import { foodDatabase, foodCategories } from "../data/foods";
import BarcodeScanner from "./BarcodeScanner";

const WATER_GOAL = 8;

function ProgressBar({ value, max, color, height = 7 }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="progress-bar-track" style={{ height }}>
      <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
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

export default function NutritionTracker({ calorieGoal, setCalorieGoal, dailyLog, setDailyLog }) {
  const [search, setSearch]               = useState("");
  const [filterCat, setFilterCat]         = useState("Alle");
  const [selectedFood, setSelectedFood]   = useState(null);
  const [qty, setQty]                     = useState("1");
  const [waterGlasses, setWaterGlasses]   = useState(0);
  const [manualGoal, setManualGoal]       = useState("");
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [showScanner, setShowScanner]     = useState(false);

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

  const selectFood = (food) => { setSelectedFood(food); setQty("1"); setSearch(""); setFilterCat("Alle"); };

  const q = parseFloat(qty) || 1;
  const preview = selectedFood ? {
    cal:  Math.round(selectedFood.calories * q),
    prot: Math.round(selectedFood.protein  * q),
    carb: Math.round(selectedFood.carbs    * q),
    fat:  Math.round(selectedFood.fat      * q),
  } : null;

  const addToLog = () => {
    if (!selectedFood || q <= 0) return;
    setDailyLog(log => [...log, {
      id: Date.now(), name: selectedFood.name, category: selectedFood.category,
      serving: selectedFood.serving,
      calories: Math.round(selectedFood.calories * q), protein: Math.round(selectedFood.protein * q),
      carbs: Math.round(selectedFood.carbs * q), fat: Math.round(selectedFood.fat * q),
    }]);
    setSelectedFood(null); setQty("1");
  };

  const removeEntry = (id) => setDailyLog(log => log.filter(i => i.id !== id));

  const saveManualGoal = () => {
    const g = parseInt(manualGoal);
    if (g > 0) { setCalorieGoal(g); setShowGoalInput(false); setManualGoal(""); }
  };

  const getCatColor = (cat) => {
    if (cat === "Frühstück")    return "#fb923c";
    if (cat === "Hauptgericht") return "#3b82f6";
    if (cat === "Snack")        return "#22c55e";
    if (cat === "Getränk")      return "#60a5fa";
    if (cat === "Fitness Meal") return "#a855f7";
    if (cat === "Gescannt")     return "#22c55e";
    return "#64748b";
  };

  const quickFoods = [0, 5, 35, 55, 147, 171].map(i => foodDatabase[i]).filter(Boolean);

  return (
    <div className="page">
      <div className="tracker-container">
        <div className="tracker-header">
          <h1>Ernährungs-Tracker</h1>
          <p>Verfolge Kalorien und Makronährstoffe aus 205+ Lebensmitteln.</p>
        </div>

        <div className="tracker-layout">
          <div>
            {/* Mahlzeit hinzufügen */}
            <div className="tracker-card">
              <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Plus size={16} /> Mahlzeit hinzufügen
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={() => setShowScanner(true)}
                >
                  <ScanLine size={14} /> Barcode scannen
                </button>
              </h3>

              <div className="category-filter-chips">
                {foodCategories.map(cat => (
                  <button key={cat} className={`category-chip ${filterCat === cat ? "active" : ""}`}
                    onClick={() => { setFilterCat(cat); setSelectedFood(null); }}>
                    {cat}
                  </button>
                ))}
              </div>

              <div className="food-search-wrap">
                <div className="food-search-input-row" style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>
                    <Search size={15} />
                  </span>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Lebensmittel suchen..."
                    value={search}
                    style={{ paddingLeft: 36 }}
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

              {showResults && (searchResults.length > 0 ? (
                <div className="food-results">
                  {searchResults.map(food => (
                    <div key={food.id} className="food-result-item" onClick={() => selectFood(food)}>
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

              {selectedFood && (
                <div className="portion-row">
                  <div className="form-group">
                    <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      <strong style={{ color: "var(--text)" }}>{selectedFood.name}</strong>
                      <span style={{ color: "var(--text-muted)", marginLeft: 6 }}>({selectedFood.serving})</span>
                    </label>
                    <input className="form-input" type="number" min="0.25" step="0.25"
                      placeholder="Portionen" value={qty}
                      onChange={e => setQty(e.target.value)} />
                    {preview && (
                      <span style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                        = {preview.cal} kcal — P: {preview.prot}g / K: {preview.carb}g / F: {preview.fat}g
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <button className="btn btn-primary btn-sm" onClick={addToLog}>
                      <Plus size={14} /> Hinzufügen
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedFood(null); setQty("1"); }}>
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}

              {!selectedFood && !search && filterCat === "Alle" && (
                <div className="quick-add-section">
                  <div className="quick-add-label">Schnellzugriff:</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {quickFoods.map(f => (
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
                  <p className="empty-hint">Suche oben nach einem Lebensmittel oder scanne einen Barcode.</p>
                </div>
              ) : (
                <>
                  <div className="log-list">
                    {dailyLog.map(item => (
                      <div key={item.id} className="log-item">
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
            {/* Kalorienübersicht */}
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
                    <span style={{ fontWeight: 600 }}>{Math.round((totals.calories / calorieGoal) * 100)}%</span>
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
                    onKeyDown={e => e.key === "Enter" && saveManualGoal()} />
                  <button className="btn btn-primary btn-sm" onClick={saveManualGoal}>OK</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowGoalInput(false)}>
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Makronährstoffe */}
            <div className="tracker-card">
              <h3>Makronährstoffe</h3>
              <div className="macro-bars">
                <MacroRow label="Protein"       value={totals.protein} goal={goalProtein} unit="g" color="#ef4444" />
                <MacroRow label="Kohlenhydrate" value={totals.carbs}   goal={goalCarbs}   unit="g" color="#f97316" />
                <MacroRow label="Fette"         value={totals.fat}     goal={goalFat}     unit="g" color="#eab308" />
              </div>
            </div>

            {/* Wassertracker */}
            <div className="tracker-card">
              <h3><Droplets size={16} color="#60a5fa" /> Wassertracker</h3>
              <div className="water-tracker">
                <div className="water-header">
                  <div>
                    <div className="water-value">{waterGlasses}</div>
                    <div className="water-subtitle">von {WATER_GOAL} Gläsern</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#60a5fa" }}>{waterGlasses * 250} ml</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>getrunken</div>
                  </div>
                </div>
                <ProgressBar value={waterGlasses} max={WATER_GOAL} color="#60a5fa" height={7} />
                <div className="water-glasses">
                  {Array.from({ length: WATER_GOAL }, (_, i) => (
                    <button key={i} className={`water-glass ${i < waterGlasses ? "filled" : ""}`}
                      onClick={() => setWaterGlasses(i < waterGlasses ? i : i + 1)}>
                      <Droplets size={16} color={i < waterGlasses ? "#60a5fa" : "var(--text-muted)"} />
                    </button>
                  ))}
                </div>
                <div className="water-info">
                  <span>{waterGlasses * 250} ml</span>
                  <span style={{ color: "#60a5fa" }}>{(WATER_GOAL - waterGlasses) * 250} ml fehlen</span>
                </div>
                <button className="btn btn-secondary btn-sm"
                  style={{ width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: 6 }}
                  onClick={() => setWaterGlasses(g => Math.min(g + 1, WATER_GOAL))}>
                  <Plus size={14} /> Glas hinzufügen
                </button>
              </div>
            </div>

            {/* Tip Box */}
            <div className="tip-box" style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Lightbulb size={16} color="var(--green)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>Trinke täglich 2–3 Liter Wasser für optimale Leistung und Fettstoffwechsel.</span>
            </div>
          </div>
        </div>
      </div>

      {showScanner && (
        <BarcodeScanner
          onAddFood={(food) => {
            setDailyLog(log => [...log, food]);
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}