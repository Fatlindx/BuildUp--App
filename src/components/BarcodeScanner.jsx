import { useState, useEffect, useRef } from 'react';
import { useI18n } from '../i18n.jsx';
import { X, ScanLine, CheckCircle2, AlertCircle, Wifi, Edit3 } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

// ─── PLU Datenbank — Frische Produkte (Obst & Gemüse) ──────────────────────
const PLU_DB = {
  3011: { name: 'Banane', calories: 89, protein: 1.1, carbs: 23.0, fat: 0.3, serving: '100g' },
  4011: { name: 'Banane', calories: 89, protein: 1.1, carbs: 23.0, fat: 0.3, serving: '100g' },
  3107: { name: 'Apfel', calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2, serving: '100g' },
  4129: { name: 'Apfel', calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2, serving: '100g' },
  3283: { name: 'Birne', calories: 57, protein: 0.4, carbs: 15.2, fat: 0.1, serving: '100g' },
  4409: { name: 'Birne', calories: 57, protein: 0.4, carbs: 15.2, fat: 0.1, serving: '100g' },
  3030: { name: 'Orange', calories: 47, protein: 0.9, carbs: 11.8, fat: 0.1, serving: '100g' },
  4051: { name: 'Orange', calories: 47, protein: 0.9, carbs: 11.8, fat: 0.1, serving: '100g' },
  3337: { name: 'Zitrone', calories: 29, protein: 1.1, carbs: 9.3, fat: 0.3, serving: '100g' },
  4053: { name: 'Zitrone', calories: 29, protein: 1.1, carbs: 9.3, fat: 0.3, serving: '100g' },
  4290: { name: 'Erdbeeren', calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, serving: '100g' },
  3222: { name: 'Erdbeeren', calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, serving: '100g' },
  4432: { name: 'Trauben', calories: 69, protein: 0.7, carbs: 18.1, fat: 0.2, serving: '100g' },
  3428: { name: 'Trauben', calories: 69, protein: 0.7, carbs: 18.1, fat: 0.2, serving: '100g' },
  4196: { name: 'Karotten', calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2, serving: '100g' },
  3030: { name: 'Zwiebel', calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, serving: '100g' },
  4082: { name: 'Kartoffeln', calories: 77, protein: 2.0, carbs: 17.5, fat: 0.1, serving: '100g' },
  4072: { name: 'Kartoffeln', calories: 77, protein: 2.0, carbs: 17.5, fat: 0.1, serving: '100g' },
  4664: { name: 'Tomate', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, serving: '100g' },
  3421: { name: 'Cherrytomaten', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, serving: '100g' },
  4067: { name: 'Gurke', calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, serving: '100g' },
  4225: { name: 'Zucchini', calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3, serving: '100g' },
  4688: { name: 'Aubergine', calories: 25, protein: 1.0, carbs: 5.7, fat: 0.2, serving: '100g' },
  3123: { name: 'Peperoni (Rot)', calories: 31, protein: 1.0, carbs: 6.0, fat: 0.3, serving: '100g' },
  3122: { name: 'Peperoni (Grün)', calories: 20, protein: 0.9, carbs: 4.6, fat: 0.2, serving: '100g' },
  4080: { name: 'Champignons', calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3, serving: '100g' },
  3104: { name: 'Spargel', calories: 20, protein: 2.2, carbs: 3.9, fat: 0.1, serving: '100g' },
  4081: { name: 'Mais', calories: 86, protein: 3.3, carbs: 19.0, fat: 1.4, serving: '100g' },
  4601: { name: 'Lauch', calories: 61, protein: 1.5, carbs: 14.1, fat: 0.3, serving: '100g' },
  4677: { name: 'Kürbis', calories: 26, protein: 1.0, carbs: 6.5, fat: 0.1, serving: '100g' },
};

function lookupPLU(code) {
  const s = code.toString().trim();
  // Bio-PLU: 5-stellig, startet mit 9
  const key = s.startsWith('9') && s.length === 5 ? s.slice(1) : s;
  const product = PLU_DB[key] || PLU_DB[s];
  if (!product) return null;
  return { ...product, category: 'Obst & Gemüse', isBio: s.startsWith('9') && s.length === 5, source: 'PLU' };
}

// ─── CH-Basics Datenbank — Häufigste Schweizer Produkte ────────────────────
// Abgedeckt: Migros, Coop, Rivella, Ovomaltine, Zweifel, Emmi, Appenzeller, Kambly
const CH_DB = {
  // Rivella
  '7616600010003': { name: 'Rivella Rot', brand: 'Rivella', calories: 37, protein: 0.1, carbs: 8.9, fat: 0.0, serving: '100ml', category: 'Getränk' },
  '7616600010034': { name: 'Rivella Blau', brand: 'Rivella', calories: 37, protein: 0.1, carbs: 8.9, fat: 0.0, serving: '100ml', category: 'Getränk' },
  '7616600010010': { name: 'Rivella Grün', brand: 'Rivella', calories: 23, protein: 0.1, carbs: 5.3, fat: 0.0, serving: '100ml', category: 'Getränk' },
  // Ovomaltine
  '7617100004152': { name: 'Ovomaltine Pulver', brand: 'Wander', calories: 382, protein: 14.4, carbs: 64.2, fat: 7.7, serving: '100g', category: 'Fitness & Protein' },
  '7617100036048': { name: 'Ovomaltine Crunchy Cream', brand: 'Wander', calories: 508, protein: 6.7, carbs: 56.2, fat: 28.1, serving: '100g', category: 'Aufstrich' },
  '7617100055544': { name: 'Ovomaltine Riegel', brand: 'Wander', calories: 423, protein: 6.7, carbs: 63.4, fat: 15.4, serving: '100g', category: 'Snack' },
  // Zweifel
  '7610848040079': { name: 'Zweifel Original Chips', brand: 'Zweifel', calories: 519, protein: 6.5, carbs: 51.3, fat: 31.3, serving: '100g', category: 'Snack' },
  '7610848022105': { name: 'Zweifel Paprika Chips', brand: 'Zweifel', calories: 519, protein: 5.9, carbs: 52.1, fat: 31.5, serving: '100g', category: 'Snack' },
  '7610848061050': { name: 'Zweifel Popcorn', brand: 'Zweifel', calories: 478, protein: 8.3, carbs: 62.4, fat: 20.1, serving: '100g', category: 'Snack' },
  // Migros Eigenmarken
  '7610807000015': { name: 'M-Classic Vollmilch', brand: 'Migros', calories: 61, protein: 3.3, carbs: 4.7, fat: 3.5, serving: '100ml', category: 'Milch & Milchprodukte' },
  '7610807002934': { name: 'M-Classic Halbrahm', brand: 'Migros', calories: 136, protein: 2.9, carbs: 3.7, fat: 12.5, serving: '100ml', category: 'Milch & Milchprodukte' },
  '7613034626608': { name: 'Farmer Müesli Klassik', brand: 'Migros', calories: 369, protein: 9.1, carbs: 64.8, fat: 7.2, serving: '100g', category: 'Frühstück' },
  '7613034369499': { name: 'Farmer Nuss Mix Müesli', brand: 'Migros', calories: 406, protein: 9.8, carbs: 54.3, fat: 15.8, serving: '100g', category: 'Frühstück' },
  '7610807004006': { name: 'M-Classic Haferflocken', brand: 'Migros', calories: 370, protein: 12.5, carbs: 60.2, fat: 6.9, serving: '100g', category: 'Frühstück' },
  '7613034843173': { name: 'Migros Protein Joghurt', brand: 'Migros', calories: 85, protein: 10.2, carbs: 5.6, fat: 2.4, serving: '100g', category: 'Fitness & Protein' },
  // Emmi
  '7610399001099': { name: 'Emmi Caffè Latte Macchiato', brand: 'Emmi', calories: 72, protein: 2.5, carbs: 11.4, fat: 1.8, serving: '100ml', category: 'Milch & Milchprodukte' },
  '7610399001075': { name: 'Emmi Caffè Latte Cappuccino', brand: 'Emmi', calories: 72, protein: 2.5, carbs: 11.2, fat: 1.9, serving: '100ml', category: 'Milch & Milchprodukte' },
  '7610399004144': { name: 'Emmi Protein Shake Schokolade', brand: 'Emmi', calories: 62, protein: 7.0, carbs: 5.0, fat: 1.4, serving: '100ml', category: 'Fitness & Protein' },
  // Käse CH
  '7610836000011': { name: 'Appenzeller Käse', brand: 'Appenzeller', calories: 399, protein: 25.9, carbs: 0.0, fat: 32.0, serving: '100g', category: 'Milch & Milchprodukte' },
  '7616600041007': { name: 'Gruyère AOP', brand: 'Le Gruyère', calories: 413, protein: 29.8, carbs: 0.0, fat: 32.5, serving: '100g', category: 'Milch & Milchprodukte' },
  // Coop Eigenmarken
  '7613269061847': { name: 'Naturaplan Bio Vollmilch', brand: 'Coop', calories: 61, protein: 3.3, carbs: 4.7, fat: 3.5, serving: '100ml', category: 'Milch & Milchprodukte' },
  '7613269070009': { name: 'Prix Garantie Joghurt Natur', brand: 'Coop', calories: 60, protein: 4.0, carbs: 4.7, fat: 2.8, serving: '100g', category: 'Milch & Milchprodukte' },
  // Schokolade CH
  '7610815011232': { name: 'Frey Milchschokolade', brand: 'Frey', calories: 537, protein: 7.2, carbs: 57.3, fat: 30.9, serving: '100g', category: 'Snack' },
  '7610839985030': { name: 'Lindt Milchschokolade', brand: 'Lindt', calories: 535, protein: 7.5, carbs: 56.7, fat: 30.5, serving: '100g', category: 'Snack' },
  // Kambly / Ricola
  '7614400023510': { name: 'Kambly Bretzeli', brand: 'Kambly', calories: 459, protein: 9.4, carbs: 66.3, fat: 16.6, serving: '100g', category: 'Snack' },
  '7612100055006': { name: 'Ricola Kräuterzucker', brand: 'Ricola', calories: 376, protein: 0.0, carbs: 93.8, fat: 0.0, serving: '100g', category: 'Snack' },
};

function lookupCH(barcode) {
  const product = CH_DB[barcode.trim()];
  if (!product) return null;
  return { ...product, source: 'CH-Datenbank' };
}

// ─── Open Food Facts API ────────────────────────────────────────────────────
const OFF_USER_AGENT = 'BuildUp Fitness App - Contact: fatlind@buildup.app';

async function fetchOFF(barcode) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,product_name_de,brands,nutriments,serving_size`,
      {
        signal: controller.signal,
        headers: { 'User-Agent': OFF_USER_AGENT },
      }
    );
    clearTimeout(timeout);

    // Validierung: kein HTML, muss JSON sein
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('json')) {
      return { status: 'api_error', message: t('scanner.api_unavailable') };
    }
    if (res.status === 429) {
      return { status: 'rate_limit', message: t('scanner.rate_limit') };
    }
    if (!res.ok) {
      return { status: 'api_error', message: 'Serverfehler. Bitte nochmals versuchen.' };
    }

    const data = await res.json();

    if (data.status !== 1 || !data.product) {
      return { status: 'not_found' };
    }

    const p = data.product;
    const n = p.nutriments || {};
    const kcal = n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0;

    // Makros auf 1 Dezimalstelle
    return {
      status: 'found',
      product: {
        name: p.product_name_de || p.product_name || 'Unbekanntes Produkt',
        brand: p.brands || '',
        serving: p.serving_size || '100g',
        calories: Math.round(kcal * 10) / 10,
        protein:  Math.round((n.proteins_100g ?? 0) * 10) / 10,
        carbs:    Math.round((n.carbohydrates_100g ?? 0) * 10) / 10,
        fat:      Math.round((n.fat_100g ?? 0) * 10) / 10,
        category: 'Gescannt',
        source: 'OpenFoodFacts',
      },
    };
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      return { status: 'timeout', message: t('scanner.timeout') };
    }
    return { status: 'api_error', message: t('scanner.network_error') };
  }
}

// ─── Haupt-Lookup: PLU → CH-DB → OFF → not found ───────────────────────────
async function lookupBarcode(barcode) {
  const code = barcode.trim();

  // 1. PLU (Frische Produkte)
  if (/^\d{4,5}$/.test(code)) {
    const plu = lookupPLU(code);
    if (plu) return { status: 'found', product: plu };
  }

  // 2. CH-Datenbank (Schweizer Eigenmarken)
  const ch = lookupCH(code);
  if (ch) return { status: 'found', product: ch };

  // 3. Open Food Facts
  return await fetchOFF(code);
}

// ─── UI Komponente ──────────────────────────────────────────────────────────
export default function BarcodeScanner({ onAddFood, onClose }) {
  const { t } = useI18n();
  const scannerRef = useRef(null);
  const [phase, setPhase]       = useState('scanning'); // scanning | loading | found | notfound | error | manual
  const [product, setProduct]   = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [manual, setManual]     = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });

  useEffect(() => {
    startScanner();
    return () => { scannerRef.current?.stop().catch(() => {}); };
  }, []);

  function startScanner() {
    const scanner = new Html5Qrcode('barcode-reader');
    scannerRef.current = scanner;
    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 280, height: 160 } },
        async (code) => {
          await scanner.stop();
          setPhase('loading');
          const result = await lookupBarcode(code);

          if (result.status === 'found') {
            setProduct(result.product);
            setPhase('found');
          } else if (result.status === 'not_found') {
            setPhase('notfound');
          } else {
            // api_error | rate_limit | timeout
            setErrorMsg(result.message || 'Produkt konnte nicht geladen werden.');
            setPhase('error');
          }
        },
        () => {} // Kein Fehler bei jedem nicht-erkannten Frame
      )
      .then(() => {})
      .catch(() => {
        setErrorMsg(t('scanner.camera_error'));
        setPhase('error');
      });
  }

  function addToLog() {
    if (!product) return;
    onAddFood({
      id:       Date.now(),
      name:     product.brand ? `${product.name} (${product.brand})` : product.name,
      category: product.category || 'Gescannt',
      serving:  product.serving || '100g',
      calories: product.calories,
      protein:  product.protein,
      carbs:    product.carbs,
      fat:      product.fat,
    });
    onClose();
  }

  function addManual() {
    if (!manual.name || !manual.calories) return;
    onAddFood({
      id:       Date.now(),
      name:     manual.name,
      category: 'Manuell',
      serving:  '100g',
      calories: parseFloat(manual.calories) || 0,
      protein:  parseFloat(manual.protein)  || 0,
      carbs:    parseFloat(manual.carbs)    || 0,
      fat:      parseFloat(manual.fat)      || 0,
    });
    onClose();
  }

  function rescan() {
    setProduct(null);
    setErrorMsg('');
    setPhase('scanning');
    setTimeout(() => startScanner(), 100);
  }

  const sourceLabel = {
    'PLU': t('scanner.source_plu'),
    'CH-Datenbank': t('scanner.source_ch'),
    'OpenFoodFacts': t('scanner.source_off'),
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-inner">
            <ScanLine size={20} color="var(--green)" />
            <div>
              <h2 className="modal-title">Barcode scannen</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                {phase === 'scanning' && t('scanner.aim')}
                {phase === 'loading'  && t('scanner.loading')}
                {phase === 'found'    && t('scanner.found')}
                {phase === 'notfound' && t('scanner.not_found_title')}
                {phase === 'error'    && 'Problem aufgetreten'}
                {phase === 'manual'   && t('scanner.manual_title')}
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="modal-body">

          {/* Scanner View */}
          {(phase === 'scanning' || phase === 'loading') && (
            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#000', marginBottom: 16 }}>
              <div id="barcode-reader" style={{ width: '100%' }} />
              {phase === 'loading' && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', background: 'rgba(8,8,8,0.8)',
                  backdropFilter: 'blur(4px)',
                }}>
                  <div style={{
                    width: 40, height: 40, border: '3px solid var(--green-glow)',
                    borderTop: '3px solid var(--green)', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                </div>
              )}
            </div>
          )}

          {/* Gefunden */}
          {phase === 'found' && product && (
            <div style={{ animation: 'slideUpFade 0.25s ease both' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
                padding: '8px 12px', borderRadius: 8,
                background: 'var(--green-glow)', border: '1px solid var(--border-active)',
              }}>
                <CheckCircle2 size={14} color="var(--green)" />
                <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>
                  {sourceLabel[product.source] || product.source}
                  {product.isBio && ' · Bio'}
                </span>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
                  {product.name}
                </div>
                {product.brand && (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{product.brand}</div>
                )}
              </div>

              {/* Makros */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16,
              }}>
                {[
                  { label: t('scanner.kcal'), value: product.calories, unit: 'kcal', color: 'var(--green)' },
                  { label: 'Protein',  value: product.protein,  unit: 'g',    color: 'var(--red)' },
                  { label: 'Carbs',    value: product.carbs,    unit: 'g',    color: 'var(--orange)' },
                  { label: 'Fett',     value: product.fat,      unit: 'g',    color: 'var(--yellow)' },
                ].map(m => (
                  <div key={m.label} style={{
                    background: 'var(--bg-card-2)', borderRadius: 10, padding: '10px 8px',
                    textAlign: 'center', border: '1px solid var(--border)',
                  }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: m.color }}>
                      {m.value}<span style={{ fontSize: 10, fontWeight: 400 }}>{m.unit}</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{m.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16, textAlign: 'center' }}>
                {t('scanner.per_100g').replace('{serving}', product.serving)}
              </div>

              <button className="btn btn-primary" onClick={addToLog}
                style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}>
                <CheckCircle2 size={15} /> Zum Tagesprotokoll hinzufügen
              </button>
              <button className="btn btn-ghost" onClick={rescan}
                style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}>
                Nochmals scannen
              </button>
            </div>
          )}

          {/* Nicht gefunden */}
          {phase === 'notfound' && (
            <div style={{ textAlign: 'center', padding: '8px 0', animation: 'slideUpFade 0.25s ease both' }}>
              <AlertCircle size={38} color="var(--text-muted)" strokeWidth={1.2} style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                Produkt nicht in der Datenbank
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
                Dieses Produkt ist noch nicht erfasst. Du kannst es manuell hinzufügen.
              </div>
              <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                <button className="btn btn-primary" onClick={() => setPhase('manual')}
                  style={{ justifyContent: 'center' }}>
                  <Edit3 size={14} /> Manuell eingeben
                </button>
                <button className="btn btn-secondary" onClick={rescan}
                  style={{ justifyContent: 'center' }}>
                  Nochmals scannen
                </button>
              </div>
            </div>
          )}

          {/* API Fehler */}
          {phase === 'error' && (
            <div style={{ textAlign: 'center', padding: '8px 0', animation: 'slideUpFade 0.25s ease both' }}>
              <Wifi size={38} color="var(--text-muted)" strokeWidth={1.2} style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                Verbindungsproblem
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
                {errorMsg}
              </div>
              <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                <button className="btn btn-primary" onClick={rescan}
                  style={{ justifyContent: 'center' }}>
                  Nochmals versuchen
                </button>
                <button className="btn btn-secondary" onClick={() => setPhase('manual')}
                  style={{ justifyContent: 'center' }}>
                  <Edit3 size={14} /> Manuell eingeben
                </button>
              </div>
            </div>
          )}

          {/* Manuell */}
          {phase === 'manual' && (
            <div style={{ animation: 'slideUpFade 0.25s ease both' }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                  Gib die Nährwerte pro 100g ein.
                </div>
                {[
                  { key: 'name',     label: t('scanner.product_name'),  type: 'text',   required: true },
                  { key: 'calories', label: 'Kalorien (kcal)', type: 'number', required: true },
                  { key: 'protein',  label: 'Protein (g)',  type: 'number', required: false },
                  { key: 'carbs',    label: 'Kohlenhydrate (g)', type: 'number', required: false },
                  { key: 'fat',      label: 'Fett (g)',     type: 'number', required: false },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>
                      {f.label}{f.required && ' *'}
                    </label>
                    <input
                      type={f.type}
                      className="form-input"
                      placeholder={f.key === 'name' ? 'z.B. Coop Joghurt Natur' : '0'}
                      value={manual[f.key]}
                      onChange={e => setManual(m => ({ ...m, [f.key]: e.target.value }))}
                      style={{ width: '100%' }}
                    />
                  </div>
                ))}
              </div>
              <button
                className="btn btn-primary"
                onClick={addManual}
                disabled={!manual.name || !manual.calories}
                style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}>
                <CheckCircle2 size={15} /> Hinzufügen
              </button>
              <button className="btn btn-ghost" onClick={rescan}
                style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}>
                Zurück zum Scanner
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
